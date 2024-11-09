// ==UserScript==
// @name         加入或修改收藏时标签功能加强
// @version      0.1.1
// @description  加入或修改收藏时高亮或自动填充自己与他人的共同标签，高亮其中的元标签，点击展开所有标签
// @author       ooo
// @include      http*://bgm.tv/*
// @include      http*://chii.in/*
// @include      http*://bangumi.tv/*
// @license      MIT
// @grant        unsafeWindow
// @namespace https://greasyfork.org/users/1337615
// ==/UserScript==

(function() {
    const pink = '#F09199';
    const storage = JSON.parse(localStorage.getItem('incheijs')) || {
        'anime': [],
        'book': [],
        'game': [],
        'music': [],
        'real': [],
        'autofill': false,
    };

    function updateStorage(key, value) {
        storage[key] = value;
        localStorage.setItem('incheijs', JSON.stringify(storage));
        return storage[key];
    }
    function updateTagStorage(type, tags) {
        return updateStorage(type, [...new Set(storage[type].concat(tags))]);
    }
    const currentType = location.pathname.match(/(anime|book|game|music|real)(?=\/list.+(wish|collect|do|on_hold|dropped))/)?.[0];
    if (currentType) {
        const currentTags = [...document.querySelectorAll("#userTagList li")].map(tag => tag.innerText.split('\n')[1]);
        updateTagStorage(currentType, currentTags);
    }

    // Microsoft Copilot start
    const cache = new Proxy({}, {
        get(target, property) {
            const data = sessionStorage.getItem('incheijs');
            if (data) {
                const jsonData = JSON.parse(data);
                return jsonData[property];
            }
            return undefined;
        },
        set(target, property, value) {
            const data = sessionStorage.getItem('incheijs');
            let jsonData = {};
            if (data) {
                jsonData = JSON.parse(data);
            }
            jsonData[property] = value;
            sessionStorage.setItem('incheijs', JSON.stringify(jsonData));
            return true;
        }
    });
    // end

    const currentID = location.pathname.match(/(?<=subject\/)\d+/)?.[0];
    if (currentID) {
        const tagInput = document.querySelector('#tags');
        const [commonList, myList] = document.querySelectorAll('.tagList');
        markTags(currentID, tagInput, commonList, myList);
    } else if (location.pathname == "/") {
        document.querySelectorAll('.progress_percent_text > a').forEach(x => x.addEventListener('click', iframeHandler))
    } else {
        document.querySelectorAll('a.thickbox').forEach(x => x.addEventListener('click', iframeHandler));
    }

    async function markTags(subjectID, tagInput, othersList, myList) {
        const [subjectType, subjectTags, metaTags] = (cache[subjectID] ??= await getSubject(subjectID));
        const myTags = [...myList.querySelectorAll('a')].map(tag => tag.textContent);
        const storedTags = updateTagStorage(subjectType, myTags);

        const commonTags = subjectTags.filter(tag => storedTags.includes(tag));
        if (storage.autofill) fillInput(tagInput, commonTags);
        renderList(othersList, commonTags, metaTags, subjectTags);
        renderList(myList, commonTags, metaTags, storedTags);

        const fragment = document.createDocumentFragment();
        const br = document.createElement('br');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'autofill';
        checkbox.checked = storage.autofill;
        checkbox.onclick = () => {
            updateStorage('autofill', !storage.autofill);
            fillInput(tagInput, commonTags);
        }
        const label = document.createElement('label');
        label.for = 'autofill';
        label.innerText = '自动填充';
        fragment.append(br, label);
        label.prepend(checkbox);
        tagInput.after(fragment);
    }

    function fillInput(tagInput, tags) {
        tagInput.value = tags.join(' ');
    }

    async function getSubject(ID) {
        let result = null;
        if (currentID) {
            result = getInfoFromDOM(document);
        } else {
            result = await getSubjectByAPI(ID);
            if (!result) result = await getSubjectByHTML(ID);
        }
        return result;
    }

    async function getSubjectByAPI(ID) {
        try {
            const response = await fetch(`https://api.bgm.tv/v0/subjects/${ID}`);
            if (!response.ok) throw new Error('API request failed');
            let { type, tags, meta_tags: metaTags } = await response.json();
            type = ['book', 'anime', 'music', 'game', , 'real'][type - 1];
            tags = tags.map(tag => tag.name);
            return [ type, tags, metaTags ];
        } catch (error) {
            console.error('标签功能增强: Error fetching subject info from API: ', error);
        }
    }

    async function getSubjectByHTML(ID) {
        try {
            const response = await fetch(`/subject/${ID}`);
            if (!response.ok) throw new Error('HTTP request failed');
            const html = await response.text();
            const dom = new DOMParser().parseFromString(html, 'text/html');

            return getInfoFromDOM(dom);
        } catch (error) {
            console.error('标签功能增强: Error fetching and parsing page:', error);
        }
    }

    function getInfoFromDOM(dom) {
        const type = dom.querySelector('.focus').href.split('/')[3] ;
        const tagElems = [...dom.querySelectorAll('.subject_tag_section a')];
        const tags = tagElems.filter(elem => elem.id !== 'show_user_tags').map(elem => elem.textContent.split(' ')[0]);
        const metaTags = tagElems.filter(elem => elem.classList.contains('meta')).map(elem => elem.textContent.split(' ')[0]);

        return [ type, tags, metaTags ];
    }

    function renderList(list, commonTags, metaTags, fullTags) {
        const tagElms = [...list.querySelectorAll('a')];
        const tagElmsMap = Object.fromEntries(tagElms.map(tagElm => [tagElm.textContent, tagElm]));
        list.style.maxHeight = 'unset';

        for (const tag of commonTags) {
            const tagElm = tagElmsMap[tag];
            if (tagElm) {
                tagElm.style.color = pink;
            } else {
                insertTag(list, tag, 'afterbegin', tag => tag.style.color = pink);
            }
        }

        for (const tag of metaTags) {
            const tagElm = tagElmsMap[tag];
            if (tagElm) tagElm.style.border = `1px solid ${pink}`;
        }

        if (tagElms.length !== fullTags.length) {
            insert(list, ' ... ', 'beforeend', function() {
                for (const tag of fullTags.filter(tag => !tagElmsMap[tag])) insertTag(list, tag, 'beforeend');
                this.remove();
            });
        }
    }

    function insert(list, text, position, onclick, handler) {
        const elem = document.createElement('a');
        const tagWrapper = list.querySelector('.inner');
        tagWrapper.insertAdjacentElement(position, elem);
        elem.classList.add('btnGray');
        elem.href = '#;';
        elem.innerText = text;
        elem.onclick = onclick;
        handler?.(elem);
    }

    function insertTag(list, tag, position, handler) {
        insert(list, tag, position, () => unsafeWindow.chiiLib.subject.addTag(tag), handler);
    }

    async function iframeHandler() {
        const TB = await waitForTB();
        markTags(...TB);
    }

    function waitForTB() {
        return new Promise(resolve => {
            new MutationObserver((_, observer) => {
                const iframe = document.querySelector('#TB_iframeContent');
                const subjectID = new URL(iframe.src).pathname.split('/')[2] ;
                const tagInput = iframe?.contentDocument.body.querySelector('#tags');
                const [othersList, myList] = iframe?.contentDocument.body.querySelectorAll('.tagList');
                if (tagInput) {
                    resolve([subjectID, tagInput, othersList, myList]);
                    observer.disconnect();
                }
            }).observe(document.body, {'childList': true});
        });
    };
})();
