// ==UserScript==
// @name         加入或修改收藏时标签功能加强
// @version      0.3.1
// @description  加入或修改收藏时高亮或自动填充自己与他人的共同标签，高亮其中的元标签，点击展开所有标签
// @author       ooo
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @license      MIT
// @grant        none
// @namespace    https://greasyfork.org/users/1337615
// @homepage     https://bgm.tv/group/topic/408232
// @gf           https://greasyfork.org/zh-CN/scripts/513954
// @gadget       https://bgm.tv/dev/app/3344
// ==/UserScript==

(function () {
    const user = document.querySelector('#dock a').href.split('/').pop();
    const colTypes = ['anime', 'book', 'game', 'music', 'real'];
    const colDoings = ['wish', 'collect', 'do', 'on_hold', 'dropped'];
    const colPaths = colTypes.flatMap(type => colDoings.map(doing => `/${type}/list/${user}/${doing}`));

    const exclusiveTagSets = [
        new Set(["剧场版", "TV", "OVA", "CM", "WEB", "PV"]),
        new Set(["原创", "漫画改", "游戏改", "小说改"]),
    ];
    function isMutuallyExclusive(tag1, tag2) {
        return exclusiveTagSets.some(set => {
            return set.has(tag1) && set.has(tag2);
        });
    }

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
    } else if (location.pathname === "/") {
        document.querySelectorAll('.progress_percent_text > a').forEach(x => x.addEventListener('click', iframeHandler))
    } else {
        document.querySelectorAll('a.thickbox').forEach(x => x.addEventListener('click', iframeHandler));
    }

    async function markTags(subjectID, dom = document) {
        const tagInput = dom.querySelector('#tags');
        const tagLists = dom.querySelectorAll('.tagList');
        const myList = tagLists[tagLists.length - 1];
        const myListLabel = dom.querySelectorAll('.tip_j.ll')[1];

        const [subjectType, subjectTags, metaTags, tagCounts] = (cache[subjectID] ??= await getSubject(subjectID));
        const myTags = [...myList.querySelectorAll('a')].map(tag => tag.textContent);
        let storedTags = addToStorage(subjectType, myTags);
        let commonTags = subjectTags.filter(tag => storedTags.includes(tag));

        function renderLists() {
            if (tagLists.length > 1) {
                const othersList = tagLists[0];
                renderList(othersList, commonTags, metaTags, subjectTags, tagInput);
            }
            renderList(myList, commonTags, metaTags, storedTags, tagInput);
        }
        renderLists();

        if (storage.autofill) fillInput(tagInput, commonTags, metaTags, tagCounts);

        const label = document.createElement('label');
        label.for = 'autofill';
        label.innerText = '自动填充';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'autofill';
        checkbox.checked = storage.autofill;
        checkbox.onclick = () => {
            updStorage('autofill', !storage.autofill);
            if (storage.autofill) fillInput(tagInput, commonTags, metaTags, tagCounts);
        };
        label.prepend(checkbox);
        tagInput.after(document.createElement('br'), label);

        const syncBtn = document.createElement('button');
        syncBtn.textContent = '📡';
        syncBtn.style = 'cursor: pointer; float: right; padding: 0; border: none; background: none; font-family: Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;';
        syncBtn.addEventListener('click', async function listener(e) {
            e.preventDefault();
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

    function fillInput(tagInput, tags, metaTags, tagCounts) {
        const allTags = new Set([...tagInput.value.split(/\s+/), ...tags]);
        if (!metaTags || !tagCounts) return tagInput.value = [...allTags].join(' ');

        const selectedTags = [];
        const usedTags = new Set();

        for (const tag of allTags) {
            if (usedTags.has(tag)) continue;

            const conflictTags = [...allTags].filter(
                otherTag => !usedTags.has(otherTag) && tag !== otherTag && isMutuallyExclusive(tag, otherTag)
            );

            if (conflictTags.length === 0) {
                selectedTags.push(tag);
                usedTags.add(tag);
            } else {
                const allConflictTags = [tag, ...conflictTags];
                const metaConflictTags = allConflictTags.filter(t => metaTags.includes(t));
                const selected = metaConflictTags.length > 0
                    ? metaConflictTags[0]
                    : allConflictTags.reduce((prev, current) =>
                        (tagCounts[current] || 0) > (tagCounts[prev] || 0) ? current : prev
                    );

                selectedTags.push(selected);
                allConflictTags.forEach(t => usedTags.add(t));
            }
        }

        tagInput.value = selectedTags.join(' ');
    }

    async function getSubject(ID) {
        let result = null;
        if (currentID) {
            result = getSubjectFromDOM(document);
        } else {
            result = await getSubjectByAPI(ID);
            result ??= await getSubjectByHTML(ID); // 受限条目无法用 API 获取
        }
        return result;
    }

    async function getSubjectByAPI(ID) {
        try {
            const response = await fetch(`https://api.bgm.tv/v0/subjects/${ID}`);
            if (!response.ok) throw new Error('API request failed');
            let { type, tags, meta_tags: metaTags } = await response.json();
            metaTags = [...new Set(metaTags)];
            // eslint-disable-next-line no-sparse-arrays
            type = ['book', 'anime', 'music', 'game', , 'real'][type - 1];
            tags = tags.map(tag => tag.name);
            const tagCounts = tags.reduce((acc, { name, count }) => {
                acc[name] = count;
                return acc;
            }, {});
            return [type, tags, metaTags, tagCounts];
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
        const tagElems = [...dom.querySelectorAll('.subject_tag_section a')].filter(elem => elem.id !== 'show_user_tags');
        const tags = tagElems.map(toText);
        const metaTags = tagElems.filter(elem => elem.classList.contains('meta')).map(toText);
        const tagCounts = tagElems.reduce((acc, elem) => {
            acc[toText(elem)] = elem.textContent.split(' ')[1];
            return acc;
        }, {});

        return [type, tags, metaTags, tagCounts];
    }

    function renderList(list, commonTags, metaTags, fullTags, tagInput) {
        const tagElems = [...list.querySelectorAll('a')].map(elem => {
            if (fullTags.includes(elem.textContent)) return elem;
            elem.remove();
        }).filter(elem => elem);
        const addedTags = new Set();
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
                const toInsert = newTag(tag, tagInput);
                toInsert.style.color = pink;
                frag.append(toInsert);
                addedTags.add(tag);
            }
        });

        metaTags.forEach(tag => {
            const tagElem = elemMap[tag];
            if (tagElem) tagElem.style.border = `1px solid ${pink}`;
        });

        if (tagElems.length + addedTags.size !== fullTags.length) {
            const rest = fullTags.filter(tag => !elemMap[tag] && !addedTags.has(tag)).map(text => {
                const elem = newTag(text, tagInput);
                if (metaTags.includes(text)) elem.style.border = `1px solid ${pink}`;
                return elem;
            });
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

    function newTag(text, tagInput) {
        return newTagBase(text, () => fillInput(tagInput, [text]));
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
                resolve([subjectID, iframeDOM]);
                observer.disconnect();
            }).observe(document.body, { 'childList': true });
        });
    };

    async function syncMyTags(type) {
        try {
            const paths = colPaths.filter(path => path.startsWith(`/${type}`));
            const doms = await Promise.all(paths.map(getDOM));
            const allTags = doms.flatMap(getTagsFromDOM);
            const uniqueTags = [...new Set(allTags)];
            return updStorage(type, uniqueTags);
        } catch (error) {
            console.error('Error syncing tags:', error);
            throw error;
        }
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