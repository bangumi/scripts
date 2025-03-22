// ==UserScript==
// @name         目录内添加条目增强
// @namespace    https://bgm.tv/group/topic/409246
// @version      0.3.2
// @description  为 bangumi 增加在目录内搜索条目并添加的功能，添加无需刷新，兼容“目录批量添加与编辑”
// @author       mmm
// @include      http*://bgm.tv/index/*
// @include      http*://chii.in/index/*
// @include      http*://bangumi.tv/index/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const createFetch = method => async (url, body, serializer = body => JSON.stringify(body)) => {
        const options = method === 'POST' ? { method, body: serializer(body) } : { method };
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const fetchGet = createFetch('GET');
    const fetchPost = createFetch('POST');

    const postSearch = async (cat, keyword, { filter = {}, offset = 0 }) => {
        const url = `https://api.bgm.tv/v0/search/${cat}?limit=10&offset=${offset}`;
        const body = { keyword, filter };
        const result = await fetchPost(url, body);
        return result?.data;
    };

    const searchSubject = async (keyword, { type = '', start = 0 }) => { // 旧API结果为空时发生CORS错误，但新API搜索结果不准确，仍用旧API
        const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=${type}&max_results=10&start=${start}`;
        const result = await fetchGet(url);
        return result?.list;
    };
    // const searchSubject = (keyword, type) => postSearch('subjects', keyword, { type: [+type].filter(a => a) });
    const searchPrsn = postSearch.bind(null, 'persons');
    const searchCrt = postSearch.bind(null, 'characters');
    const getSearchMethod = {
        'subject': [searchSubject, 'start'],
        'person': [searchPrsn, 'offset'],
        'character': [searchCrt, 'offset'],
        'ep': [searchSubject, 'start'],
    };

    const getEps = async (subject_id) => {
        const url = `https://api.bgm.tv/v0/episodes?subject_id=${subject_id}`;
        const result = await fetchGet(url);
        return result?.data;
    };

    const formhash = document.querySelector('input[name=formhash]').value;

    const addItem = async (add_related) => {
        const url = `${ location.pathname }/add_related`;
        const body = { formhash, add_related, submit: '添加条目关联' };
        const result = await fetchPost(url, body, body => new URLSearchParams(body));
        return result;
    };

    const modifyItem = async (id, content, order) => {
        const url = `/index/related/${ id }/modify`;
        const body = { formhash, content, order, submit: '提交' };
        const result = await fetchPost(url, body, body => new URLSearchParams(body));
        return result;
    };

    document.querySelector('li.add a').addEventListener('click', () => {
        document.querySelector('#TB_window').style.height = 'unset';
        document.querySelector('#TB_ajaxContent').style.height = '250px';
    });
    const boxes = document.querySelectorAll('.newIndexSection');

    boxes.forEach((box) => {
        const cat = ['subject', 'character', 'person', 'ep'][box.id.at(-1)];

        const input = box.querySelector('.inputtext');
        input.style.position = 'sticky';
        input.style.top = 0;
        input.style.zIndex = 2; // 覆盖ep

        const result = document.createElement('div');
        result.classList.add('subjectListWrapper');
        box.firstElementChild.append(result);

        const btn = makeBtn();
        btn.classList.add('chiiBtn');
        btn.onclick = async () => {
            await searchAndRender(cat, input, result);
        };

        box.querySelector('#submitBtnO').append(btn);

        const makeTip = (text) => {
            const tip = document.createElement('span');
            tip.classList.add('tip');
            tip.textContent = text;
            return tip;
        };
        const contentTextarea = document.createElement('textarea');
        contentTextarea.className = 'reply';
        const orderInput = document.createElement('input');
        orderInput.type = 'text';
        orderInput.className = 'inputtext';
        input.after(makeTip('评价：'), document.createElement('br'), contentTextarea, document.createElement('br'), makeTip('排序：'), document.createElement('br'), orderInput);

        const form = box.querySelector('#newIndexRelatedForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const ukagaka = document.querySelector('#robot');
            ukagaka.style.zIndex = '103';
            unsafeWindow.chiiLib.ukagaka.presentSpeech('添加中，请稍候...');
            const v = input.value.trim();
            const add_related = input.value.match(/\d+/) ? `/${cat}/${v}` : v;
            const id = add_related.split('/').pop();

            try {
                const addedHTML = await addItem(add_related);
                const content = contentTextarea.value.trim();
                const order = parseInt(orderInput.value);

                const parser = new DOMParser();
                const query = `#item_${ cat === 'subject' ? '' : cat }${id}`;
                const addedDOM = parser.parseFromString(addedHTML, 'text/html');
                let added = addedDOM.querySelector(query);

                if (content || !isNaN(order)) {
                    const rlt = added.querySelector('a.tb_idx_rlt');
                    const rlt_id = rlt.id.split('_')[1];
                    const modifiedHTML = await modifyItem(rlt_id, content, order);
                    const modifiedDOM = parser.parseFromString(modifiedHTML, 'text/html');
                    added = modifiedDOM.querySelector(query);
                }

                const previousAnchor = added.previousElementSibling;
                const nextAnchor = added.nextElementSibling;
                if (previousAnchor) {
                    document.querySelector(`#${previousAnchor.id}`).after(added);
                } else if (nextAnchor) {
                    document.querySelector(`#${nextAnchor.id}`).before(added);
                } else {
                    const parent = added.parentElement;
                    document.querySelector('#columnSubjectBrowserA').append(parent);
                }
                added.querySelector('.tools').style.visibility = 'hidden'; // 无法进行同页修改，暂隐藏
                const collectBlock = added.querySelector('.collectBlock'); // 只有条目可以收藏
                if (collectBlock) collectBlock.style.visibility = 'hidden';

                unsafeWindow.chiiLib.ukagaka.presentSpeech('添加成功！', true);
            } catch (e) {
                console.error(e);
                unsafeWindow.chiiLib.ukagaka.presentSpeech('添加失败了T T', true);
            } finally {
                setTimeout(() => ukagaka.style.zIndex = '90', 3500);
            }
        });
    });

    function makeBtn(text = '搜索') {
        const btn = document.createElement('a');
        btn.href = 'javascript:;';
        btn.innerText = text;
        return btn;
    }

    const makeLoading = (prompt = '搜索中……') => document.createTextNode(prompt);
    async function searchAndRender(cat, input, result, target=input, append=false) {
        const [method, key] = getSearchMethod[cat];
        const keyword = input.value.trim();
        if (keyword === '') return;
        const loader = (offset) => method(keyword, { [key]: offset });
        const clickHandler = e => {
            e.preventDefault();
            if (cat === 'ep') {
                renderEps(e.currentTarget, target, append);
            } else {
                if (append) {
                    target.value += e.currentTarget.href + '\n';
                } else {
                    target.value = e.currentTarget.href;
                }
            }
        };
        renderList(loader, result, cat, a => a.addEventListener('click', clickHandler));
    }

    const listHTML = (list, cat = 'subject') => {
        const isEp = cat === 'ep';
        if (isEp) cat = 'subject';
        return list.reduce((m, { id, type, images, name,
                                 name_cn, career, infobox }) => {
            if (isEp && ![2, 6].includes(type)) return m; // 动画 + 三次元，旧API不支持多重类别筛选
            name_cn ??= infobox?.find(({ key }) => key === '简体中文名')?.value;
            if (cat !== 'subject') cat = career ? 'person' : 'character';
            type = cat === 'subject' ? ['书籍', '动画', '音乐', '游戏', '', '三次元'][type - 1] : null;
            const grid = images?.grid;
            const exist = v => v ? v : '';
            m += `<li class="clearit">
               <a href="/${ cat }/${ id }" class="avatar h">
                 ${ grid ? `<img src="${ grid }" class="avatar ll">` : ''}
               </a>
               <div class="inner">
                 <small class="grey rr">${ exist(type) }</small>
                 <p><a href="/${ cat }/${ id }" class="avatar h">${ name }</a></p>
                 <small class="tip">${ exist(name_cn) }</small>
               </div>
             </li>`;
            return m;
        }, '');
    }

    const makeMore = (text) => {
        const more = document.createElement('li');
        more.classList.add('clearit');
        more.textContent = text;
        more.style.textAlign = 'center';
        more.style.listStyle = 'none';
        return more;
    }

    const makeMoreBtn = (ul, cat, loader, applyHandler, initStart = 1) => {
        const searching = makeLoading();
        const more = makeMore('加载更多');
        more.style.cursor = 'pointer';
        more.start = initStart;
        more.onclick = async () => {
            more.before(searching);
            const nextList = await loader(more.start);
            if (!nextList) {
                searching.remove();
                return;
            }
            ul.insertAdjacentHTML('beforeend', listHTML(nextList, cat));
            applyHandler();
            searching.remove();

            if (nextList.length < 10 && !['subject', 'ep'].includes(cat)) {
                more.replaceWith(makeMore('没有啦'));
                return;
            }
            more.start += nextList.length;
        }
        return more;
    }

    async function renderList(loader, container, cat, handler = () => {}) {
        const applyHandler = () => ul.querySelectorAll('a').forEach(handler);
        const searching = makeLoading();
        let initStart = 1;

        container.innerHTML = '';
        container.append(searching);
        let firstList = await loader();
        if (firstListEnd()) return;
        let firstHTML = listHTML(firstList, cat);

        while (firstHTML === '' && cat === 'ep') {
            firstList = await loader(initStart += firstList.length);
            if (firstListEnd()) return;
            firstHTML = listHTML(firstList, cat);
        }

        const ul = document.createElement('ul');
        ul.id = 'subjectList';
        ul.classList.add('subjectList', 'ajaxSubjectList');
        ul.innerHTML = firstHTML;

        initStart += firstList.length;
        const more = firstList.length === 10 || ['subject', 'ep'].includes(cat) ? makeMoreBtn(ul, cat, loader, applyHandler, initStart)
                                                                                : makeMore('没有啦');
        container.append(ul, more);

        applyHandler();
        searching.remove();

        function firstListEnd() {
            if (!firstList) {
                container.textContent = '搜索失败';
                return true;
            } else if (firstList.length === 0) {
                container.textContent = '未找到相关条目';
                return true;
            }
        }
    }

    const epStyle = document.createElement('style');
    epStyle.textContent = `
        ul.ajaxSubjectList li ul.prg_list {
            display: flex;
            flex-wrap: wrap;
            li {
                border-bottom: none;
                border-top: none;
                padding: 0;
                a:hover {
                    color: #333;
                    text-decoration: none;
                }
            }
        }
        ul.ajaxSubjectList li:hover ul.prg_list li a {
            color: #06C;
        }
    `;
    document.head.append(epStyle);
    async function renderEps(elem, target, append) {
        const parent = elem.closest('li').querySelector('.inner');
        const fetching = makeLoading('获取中……');
        parent.append(fetching);
        const eps = await getEps(elem.href.split('/').pop());
        const epsByType = Object.groupBy?.(eps, ({ type }) => ['0', 'SP', 'OP', 'ED'][type]) ?? eps.reduce((acc, ep) => {
            const type = ['0', 'SP', 'OP', 'ED'][ep.type];
            if (!acc[type]) acc[type] = [];
            acc[type].push(ep);
            return acc;
        }, {});
        fetching.remove();
        if (!eps) {
            parent.append('获取失败');
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'prg_list clearit';
        Object.entries(epsByType).forEach(([type, eps]) => {
            if (type !== '0') {
                const subtitle = document.createElement('li');
                subtitle.className = 'subtitle';
                const span = document.createElement('span');
                span.textContent = type;
                subtitle.append(span);
                ul.append(subtitle);
            }
            eps.map(({ id, name, sort }) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `/ep/${ id }`;
                a.className = 'load-epinfo epBtnAir';
                a.title = name;
                a.textContent = String(sort).padStart(2, '0');
                li.onclick = e => {
                    e.preventDefault();
                    if (append) {
                        target.value += a.href + '\n';
                    } else {
                        target.value = a.href;
                    }
                };
                li.append(a);
                ul.append(li);
            });
        });
        parent.append(ul);
    }

    // 兼容“目录批量添加与编辑”（https://bgm.tv/dev/app/1037）
    const observer = monitorElement('.bibeBox', bibeBox => {
        const container = document.createElement('div');
        container.style = `display: flex;
                           justify-content: space-evenly;
                           height: 300px;
                           padding: 5px;
                           overflow-y: auto;`;
        const textarea = bibeBox.querySelector('textarea');
        textarea.rows = 8;
        bibeBox.previousSibling.after(container);
        bibeBox.parentNode.style.marginTop = '-150px';

        const submitWrapper = document.createElement('div');
        submitWrapper.style.width = '50%';
        submitWrapper.append(bibeBox, document.querySelector('#submit_list'));

        const searchPanel = document.createElement('div');
        searchPanel.style = 'width: 50%'
        const inputWrapper = document.createElement('div');
        inputWrapper.style = `width: fit-content;
                              margin: auto;
                              border-radius: 100px;
                              box-shadow: none;
                              border: 1px solid rgba(200, 200, 200, 0.5);
                              background-color: rgba(255, 255, 255, 0.2);`;

        const input = document.createElement('input');
        input.classList.add('inputtext');
        input.type = 'text';
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') newSearchAndRender();
        });
        input.style = `font-size: 1em;
                       width: 120px;
                       -webkit-appearance: none;
                       -moz-appearance: none;
                       box-shadow: none;
                       background: transparent;
                       line-height: 20px;
                       border: none;`;

        const result = document.createElement('div');
        result.classList.add('subjectListWrapper');
        result.style = `
          max-height: 250px;
          overflow-y: scroll;
        `;

        const select = document.createElement('select');
        select.onchange = newSearchAndRender;
        select.innerHTML = `<option value="subject">条目</option>
                            <option value="person">人物</option>
                            <option value="character">角色</option>
                            <option value="ep">章节</option>`;
        select.style = `font-size: 1em;
                        padding: 4px 4px 4px 5px;
                        width: fit-content;
                        border: none;
                        outline: none;
                        box-shadow: none;
                        background-color: transparent;
                        background-image: none;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                        border-radius: 0;
                        border-right: 1px solid rgba(200, 200, 200, 0.5)`;

        const btn = makeBtn('🔍');
        btn.onclick = newSearchAndRender;
        btn.style = `text-wrap: nowrap;
                     width: 20px;
                     height: 20px;
                     border: none;
                     border-left: 1px solid rgba(200, 200, 200, 0.5);
                     padding: 4px 5px;
                     cursor: pointer;`

        searchPanel.append(inputWrapper, result);
        inputWrapper.append(select, input, btn);

        container.append(submitWrapper, searchPanel);

        function newSearchAndRender() {
            const cat = select.value;
            searchAndRender(cat, input, result, bibeBox.querySelector('textarea'), true);
        }
    });

    // Microsoft Copilot start
    function monitorElement(selector, callback) {
        const targetNode = document.body; // 监视整个文档的变化
        const config = { childList: true, subtree: true }; // 配置监视选项

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    addedNodes.forEach(node => {
                        if (node.matches?.(selector)) {
                            observer.disconnect();
                            callback(node);
                            observer.observe(targetNode, config);
                        } else if (node.querySelectorAll) {
                            observer.disconnect();
                            const matchingElements = node.querySelectorAll(selector);
                            matchingElements.forEach(matchingNode => callback(matchingNode));
                            observer.observe(targetNode, config);
                        }
                    });
                }
            }
        });

        observer.observe(targetNode, config);

        return observer; // 返回观察者实例，以便在需要时断开观察
    }
    // end

})();
