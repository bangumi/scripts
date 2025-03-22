// ==UserScript==
// @name         加入或修改收藏时标签功能加强
// @version      0.2.1
// @description  加入或修改收藏时高亮或自动填充自己与他人的共同标签，高亮其中的元标签，点击展开所有标签
// @author       ooo
// @include      http*://bgm.tv/*
// @include      http*://chii.in/*
// @include      http*://bangumi.tv/*
// @license      MIT
// @grant        unsafeWindow
// @namespace    https://greasyfork.org/users/1337615
// ==/UserScript==

(function() {
    const user = document.querySelector('a.avatar')?.href.split('/').pop() ?? unsafeWindow.CHOBITS_UID;
    const colTypes = ['anime', 'book', 'game', 'music', 'real'];
    const colDoings = ['wish', 'collect', 'do', 'on_hold', 'dropped'];
    const colPaths = colTypes.flatMap(type => colDoings.map(doing => `/${type}/list/${user}/${doing}`));

    const pink = '#F09199';
    const storage = JSON.parse(localStorage.getItem('incheijs')) || {
        'anime': [],
        'book': [],
        'game': [],
        'music': [],
        'real': [],
        'autofill': false,
    };

    function updStorage(key, value) {
        storage[key] = value;
        localStorage.setItem('incheijs', JSON.stringify(storage));
        return storage[key];
    }
    function addToStorage(type, tags) {
        return updStorage(type, [...new Set(storage[type].concat(tags))]);
    }
    function getTagsFromDOM(dom) {
        const tags = [...dom.querySelectorAll("#userTagList a.l")].map(tag => tag.childNodes[1].textContent);
        return tags;
    }

    const isColPage = colPaths.includes(location.pathname);
    if (isColPage) {
        const type = location.pathname.split('/')[1];
        addToStorage(type, getTagsFromDOM(document));
    }

    // Microsoft Copilot start
    const cache = new Proxy({}, {
        get(_, property) {
            const data = sessionStorage.getItem('incheijs');
            if (data) {
                const jsonData = JSON.parse(data);
                return jsonData[property];
            }
            return undefined;
        },
        set(_, property, value) {
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
        markTags(currentID);
    } else if (location.pathname == "/") {
        document.querySelectorAll('.progress_percent_text > a').forEach(x => x.addEventListener('click', iframeHandler))
    } else {
        document.querySelectorAll('a.thickbox').forEach(x => x.addEventListener('click', iframeHandler));
    }

    async function markTags(subjectID, dom=document) {
        const tagInput = dom.querySelector('#tags');
        const [ othersList, myList ] = dom.querySelectorAll('.tagList');
        const myListLabel = dom.querySelectorAll('.tip_j.ll')[1];

        const [ subjectType, subjectTags, metaTags ] = (cache[subjectID] ??= await getSubject(subjectID));
        const myTags = [...myList.querySelectorAll('a')].map(tag => tag.textContent);
        let storedTags = addToStorage(subjectType, myTags);
        let commonTags = subjectTags.filter(tag => storedTags.includes(tag));

        function renderLists() {
            renderList(othersList, commonTags, metaTags, subjectTags);
            renderList(myList, commonTags, metaTags, storedTags);
        }
        renderLists();

        if (storage.autofill) fillInput(tagInput, commonTags);

        const label = document.createElement('label');
        label.for = 'autofill';
        label.innerText = '自动填充';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'autofill';
        checkbox.checked = storage.autofill;
        checkbox.onclick = () => {
            updStorage('autofill', !storage.autofill);
            if (storage.autofill) fillInput(tagInput, commonTags);
        }
        label.prepend(checkbox);
        tagInput.after(document.createElement('br'), label);

        const syncBtn = document.createElement('span');
        syncBtn.textContent = '📡';
        syncBtn.style.cursor = 'pointer';
        syncBtn.style.float = 'right';
        syncBtn.addEventListener('click', async function listener() {
            syncBtn.textContent = '⏳';
            syncBtn.style.cursor = 'wait';
            try {
                storedTags = await syncMyTags(subjectType);
                commonTags = subjectTags.filter(tag => storedTags.includes(tag));
                renderLists();
                syncBtn.textContent = '✔️';
                syncBtn.removeEventListener('click', listener);
                syncBtn.style.cursor = 'default';
            } catch {
                syncBtn.textContent = '❌';
                syncBtn.style.cursor = 'pointer';
                setTimeout(() => syncBtn.textContent = '📡', 3000);
            }
        });
        myListLabel.append(document.createElement('br'), syncBtn);
    }

    function fillInput(tagInput, tags) {
        const beforeTags = tagInput.value.split(/\s+/);
        const toAdd = tags.filter(tag => !beforeTags.includes(tag)).join(' ');
        if (toAdd) tagInput.value += ` ${toAdd}`;
    }

    async function getSubject(ID) {
        let result = null;
        if (currentID) {
            result = getSubjectFromDOM(document);
        } else {
            result = await getSubjectByAPI(ID);
            result ??= await getSubjectByHTML(ID);
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
            const dom = await getDOM(`/subject/${ID}`)
            return getSubjectFromDOM(dom);
        } catch (error) {
            console.error('标签功能增强: Error fetching and parsing page:', error);
        }
    }

    function getSubjectFromDOM(dom) {
        const type = dom.querySelector('.focus').href.split('/').pop();
        const toText = elem => elem.textContent.split(' ')[0];
        const tagElems = [...dom.querySelectorAll('.subject_tag_section a')];
        const tags = tagElems.filter(elem => elem.id !== 'show_user_tags').map(toText);
        const metaTags = tagElems.filter(elem => elem.classList.contains('meta')).map(toText);

        return [ type, tags, metaTags ];
    }

    function renderList(list, commonTags, metaTags, fullTags) {
        const tagElems = [...list.querySelectorAll('a')].map(elem => {
            if (fullTags.includes(elem.textContent)) return elem;
            elem.remove();
        }).filter(elem => elem);
        const elemMap = tagElems.reduce((map, elem) => {
            map[elem.textContent] = elem;
            return map;
        }, {});
        list.style.maxHeight = 'unset';
        const frag = document.createDocumentFragment();

        commonTags.forEach(tag => {
            const tagElem = elemMap[tag];
            if (tagElem) {
                tagElem.style.color = pink;
            } else {
                const toInsert = newTag(tag);
                toInsert.style.color = pink;
                frag.append(toInsert);
            }
        });

        metaTags.forEach(tag => {
            const tagElem = elemMap[tag];
            if (tagElem) tagElem.style.border = `1px solid ${pink}`;
        });

        if (tagElems.length !== fullTags.length) {
            const rest = fullTags.filter(tag => !elemMap[tag]).map(text => newTag(text));
            const more = newTagBase(' ... ', () => more.replaceWith(...rest));
            frag.append(more);
        }

        list.querySelector('.inner').append(frag);
    }

    function newTagBase(text, onclick) {
        const tag = document.createElement('a');
        tag.classList.add('btnGray');
        tag.href = '#;';
        tag.textContent = text;
        tag.onclick = onclick;
        return tag;
    }

    function newTag(text) {
        return newTagBase(text, () => unsafeWindow.chiiLib.subject.addTag(text));
    }

    async function iframeHandler() {
        const data = await getIframeData();
        markTags(...data);
    }

    function getIframeData() {
        return new Promise(resolve => {
            new MutationObserver((mutations, observer) => {
                if (!mutations.some(({ removedNodes }) => [...removedNodes].some(node => node.id === 'TB_load'))) return;
                const iframe = document.querySelector('#TB_iframeContent');
                const subjectID = new URL(iframe.src).pathname.split('/')[2];
                const iframeDOM = iframe.contentDocument;
                resolve([ subjectID, iframeDOM ]);
                observer.disconnect();
            }).observe(document.body, { 'childList': true });
        });
    };

    async function syncMyTags(type) {
        const paths = colPaths.filter(path => path.startsWith(`/${type}`));
        const tags = [...new Set(await paths.reduce(async (result, path) => {
            const dom = await getDOM(path);
            return (await result).concat(await getTagsFromDOM(dom));
        }, []))];
        return updStorage(type, tags);
    }

    async function getDOM(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('HTTP request failed');
            const html = await response.text();
            const dom = new DOMParser().parseFromString(html, 'text/html');

            return dom;
        } catch (error) {
            console.error('标签功能增强: Error fetching and parsing page:', error);
        }
    }

})();
