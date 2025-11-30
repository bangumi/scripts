// ==UserScript==
// @name         目录内搜索添加条目/可加入页面和目录页加入同时修改评价和排序
// @namespace    https://bgm.tv/group/topic/409246
// @version      0.6.7
// @description  为 bangumi 增加在目录内搜索条目并添加的功能，添加无需刷新
// @author       mmm
// @match        http*://bgm.tv/index/*
// @match        http*://chii.in/index/*
// @match        http*://bangumi.tv/index/*
// @match        http*://bgm.tv/subject/*
// @match        http*://chii.in/subject/*
// @match        http*://bangumi.tv/subject/*
// @match        http*://bgm.tv/character/*
// @match        http*://chii.in/character/*
// @match        http*://bangumi.tv/character/*
// @match        http*://bgm.tv/person/*
// @match        http*://chii.in/person/*
// @match        http*://bangumi.tv/person/*
// @match        http*://bgm.tv/ep/*
// @match        http*://chii.in/ep/*
// @match        http*://bangumi.tv/ep/*
// @match        http*://bgm.tv/subject/topic/*
// @match        http*://chii.in/subject/topic/*
// @match        http*://bangumi.tv/subject/topic/*
// @match        http*://bgm.tv/group/topic/*
// @match        http*://chii.in/group/topic/*
// @match        http*://bangumi.tv/group/topic/*
// @match        http*://bgm.tv/blog/*
// @match        http*://chii.in/blog/*
// @match        http*://bangumi.tv/blog/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/516479
// @gadget       https://bgm.tv/dev/app/3372
// ==/UserScript==

(function () {
    'use strict';

    const formhash = document.querySelector('input[name="formhash"]')?.value;
    if (!formhash) return;

    // #region 样式
    const style = document.createElement('style');
    const css = (strings) => strings.join('');
    style.textContent = css`
        #indexSelectorWrapper {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 10px;
            position: relative;
        }
        #indexSelector {
            font-size: 15px;
            padding: 5px 5px;
            line-height: 22px;
            flex: 1;
            -webkit-border-radius: 5px;
            -moz-border-radius: 5px;
            border-radius: 5px;
            -moz-background-clip: padding;
            -webkit-background-clip: padding-box;
            background-clip: padding-box;
            background-color: #fff;
            color: #000;
            border: 1px solid #d9d9d9;
        }
        html[data-theme="dark"] #indexSelector {
            background-color: #303132;
            color: #e0e0e1;
            border: 1px solid #5c5c5c;
        }
        #TB_ajaxContent {
            scrollbar-gutter: stable;
        }
        /* 新建目录表单样式 */
        #createIndexForm {
            margin: 10px 0;
            padding: 15px;
            border: 1px dashed #d9d9d9;
            border-radius: 5px;
        }
        #createIndexForm .form-group {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        #createIndexDesc {
            height: 60px;
            resize: vertical;
        }
        #toggleCreateFormBtn {
            word-break: keep-all;
            padding: 8px 16px;
            cursor: pointer;
        }
        /* 搜索选择器样式 */
        #indexSelectorWrapper .custom-select {
            width: 100%;
            position: relative;
        }
        #indexSelectorWrapper .select-input {
            cursor: pointer;
        }
        #indexSelectorWrapper .dropdown-icon {
            position: absolute;
            right: 12px;
            top: 50%;
            width: 10px;
            height: 10px;
            transform: translateY(-50%);
            pointer-events: none;
        }
        #indexSelectorWrapper .dropdown-icon::before,
        #indexSelectorWrapper .dropdown-icon::after {
            content: '';
            position: absolute;
            width: 6px;
            height: 2px;
            background-color: #666;
            border-radius: 1px;
            transition: background-color 0.2s;
        }
        #indexSelectorWrapper .dropdown-icon::before {
            transform: rotate(45deg);
            left: 0;
            bottom: 4px;
        }
        #indexSelectorWrapper .dropdown-icon::after {
            transform: rotate(-45deg);
            right: 0;
            bottom: 4px;
        }
        #indexSelectorWrapper .dropdown-icon.open {
            transform: translateY(-50%) rotate(180deg);
        }
        #indexSelectorWrapper .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            scrollbar-width: thin;
            border-top: none;
            border-radius: 0 0 5px 5px;
            z-index: 100;
            display: none;
            background-color: rgba(254, 254, 254, 0.9);
            box-shadow: inset 0 1px 1px hsla(0, 0%, 100%, 0.3), inset 0 -1px 0 hsla(0, 0%, 100%, 0.1), 0 2px 4px hsla(0, 0%, 0%, 0.2);
            backdrop-filter: blur(5px);
            color: rgba(0, 0, 0, .7);
        }
        #indexSelectorWrapper .dropdown-menu.show {
            display: block;
        }
        #indexSelectorWrapper .search-box input {
            width: 100%;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 3px;
            box-sizing: border-box;
            font-size: 15px;
        }
        #indexSelectorWrapper .search-box {
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        #indexSelectorWrapper .option-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        #indexSelectorWrapper .option-item {
            padding: 8px 10px;
            cursor: pointer;
            font-size: 15px;
        }
        #indexSelectorWrapper .option-item:hover {
            background-color: #e9f5ff;
            color: #007bff;
        }
        html[data-theme="dark"] #indexSelectorWrapper .dropdown-icon::before,
        html[data-theme="dark"] #indexSelectorWrapper .dropdown-icon::after {
            background-color: #aaa;
        }
        html[data-theme="dark"] #indexSelectorWrapper .dropdown-menu {
            background: rgba(80, 80, 80, 0.7);
            color: rgba(255, 255, 255, .7);
        }
        html[data-theme="dark"] #indexSelectorWrapper .search-box {
            border-bottom-color: #444;
        }
        html[data-theme="dark"] #indexSelectorWrapper .search-box input {
            background-color: #202122;
            color: #e0e0e0;
            border-color: #5c5c5c;
        }
        html[data-theme="dark"] #indexSelectorWrapper .option-item:hover {
            background-color: #2d3b4d;
            color: #8ab4f8;
        }
        #indexSelectorWrapper .option-item.selected {
            background-color: #369cf8;
            color: #fff;
        }
        #indexSelectorWrapper .no-result {
            padding: 10px;
            text-align: center;
            color: #999;
            font-size: 15px;
        }
        #indexSelectorWrapper .hidden-field {
            display: none;
        }

        .search-results-container {
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        html[data-theme="dark"] .search-results-container {
            border-color: #444;
        }

        :not(.prg_list) > li.selected-result,
        .prg_list li.selected-result a {
            background-color: var(--primary-color);
            color: white !important;
        }

        :not(.prg_list) > li.selected-result a,
        :not(.prg_list) > li.selected-result .tip,
        :not(.prg_list) > li.selected-result .grey,
        .prg_list li.selected-result a a,
        .prg_list li.selected-result a .tip,
        .prg_list li.selected-result a .grey {
            color: white !important;
        }

        ul.ajaxSubjectList li ul.prg_list li {
            border-bottom: none;
            border-top: none;
            padding: 0;
        }
        ul.ajaxSubjectList li:hover ul.prg_list li a {
            color: #06C;
        }
        ul.ajaxSubjectList li a.avatar {
            transition: 0ms;
        }

        .custom-search-wrapper {
            width: fit-content;
            margin: auto;
            border-radius: 100px;
            box-shadow: none;
            border: 1px solid rgba(200, 200, 200, 0.5);
            background-color: rgba(255, 255, 255, 0.2);
        }

        input[type="text"].custom-search-input {
            font-size: 1em;
            width: 120px;
            -webkit-appearance: none;
            -moz-appearance: none;
            background: transparent !important;
            line-height: 20px;
            border: none;
            padding: 4px 8px;
            box-shadow: none;
        }

        .custom-search-select {
            font-size: 1em;
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
            border-right: 1px solid rgba(200, 200, 200, 0.5);
            text-align: center;
        }

        .custom-search-btn {
            white-space: nowrap;
            width: fit-content;
            height: fit-content;
            border: none;
            border-left: 1px solid rgba(200, 200, 200, 0.5);
            padding: 4px 5px;
            cursor: pointer;
            background: transparent;
        }
    `;
    document.head.append(style);
    // #endregion

    // #region 请求函数
    const createFetch = method => async (url, body, serializer = body => JSON.stringify(body)) => {
        const options = method === 'POST' ? { method, body: serializer(body) } : { method };
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    };

    const fetchGet = createFetch('GET');
    const fetchPost = createFetch('POST');

    const postSearch = async (cat, keyword, { filter = {}, offset = 0 }) => {
        const url = `https://api.bgm.tv/v0/search/${cat}?limit=10&offset=${offset}`;
        const body = { keyword, filter };
        const result = await fetchPost(url, body);
        return result.data;
    };

    const searchSubject = async (keyword, { type = '', start = 0 }) => { // 旧API结果为空时发生CORS错误，但新API搜索结果不准确，仍用旧API
        const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=${type}&max_results=10&start=${start}`;
        const result = await fetchGet(url);
        return result.list;
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
        return result.data;
    };

    const myUsername = document.querySelector('#dock a').href.split('/').pop();

    const getDoc = (html) => new DOMParser().parseFromString(html, 'text/html');
    const getIndices = async (forceRefresh = false) => {
        const cache = JSON.parse(sessionStorage.getItem('user_indices') || 'null');
        if (!forceRefresh && cache) return cache;

        const allIndices = [];
        let currentUrl = `/user/${myUsername}/index?add_related=1`;

        try {
            while (currentUrl) {
                const html = await fetchGet(currentUrl);
                const doc = getDoc(html);

                const indexLinks = [...doc.querySelectorAll('#timeline ul a')];
                const currentPageIndices = indexLinks.map(a => ({
                    title: a.textContent.trim(),
                    id: a.href.split('/')[4]
                }));

                allIndices.push(...currentPageIndices);

                const nextPageLink = doc.querySelector('.page_inner a:nth-last-child(1)');
                if (nextPageLink) {
                    currentUrl = nextPageLink.href;
                } else {
                    currentUrl = null;
                }
            }

            sessionStorage.setItem('user_indices', JSON.stringify(allIndices));

            return allIndices;
        } catch (e) {
            console.error('获取目录失败:', e);
            if (allIndices.length) {
                return allIndices;
            }
            throw e;
        }
    }

    const addItem = async (add_related, indexId) => {
        const url = `/index/${indexId}/add_related`;
        const body = { formhash, add_related, submit: '添加' };
        const result = await fetchPost(url, body, body => new URLSearchParams(body));
        return result;
    };

    const modifyItem = async (id, content, order) => {
        const url = `/index/related/${id}/modify`;
        const body = { formhash, content, order, submit: '提交' };
        const result = await fetchPost(url, body, body => new URLSearchParams(body));
        return result;
    };

    const getAdded = (cat, subjectId, dom=document) => dom.querySelector(`[href="/${cat}/${subjectId}"]`)?.closest('[id^="item_"], [attr-index-related]');
    const addAndModify = async (cat, subjectId, indexId, content, order, idxTitle = '') => {
        const add_related = `/${cat}/${subjectId}`;
        const ukagaka = document.querySelector('#robot');
        ukagaka.style.zIndex = '103';
        chiiLib.ukagaka.presentSpeech('添加中，请稍候...');

        try {
            const addedHTML = await addItem(add_related, indexId);

            const parser = new DOMParser();
            const addedDOM = parser.parseFromString(addedHTML, 'text/html');
            let added = getAdded(cat, subjectId, addedDOM);
            if (!added) throw Error('添加失败');
            let modifyFailed = false;

            if (content || !isNaN(order)) {
                try {
                    const rlt = added.querySelector('a.tb_idx_rlt');
                    const rlt_id = rlt.id.split('_')[1];
                    await modifyItem(rlt_id, content, order);
                } catch (e) {
                    modifyFailed = true;
                    console.error('修改失败:', e);
                }
            }

            const toIdxAnchor = ` <a href="/index/${indexId}#:~:text=${encodeURIComponent(added.querySelector('h3 > a.l').textContent.trim())}" target="_blank" rel="nofollow external noopener noreferrer">点击查看</href>`;
            const successTip = idxTitle ? `已收集至目录「${idxTitle}」～${toIdxAnchor}` : '添加成功！';
            const modifyFailedTip = `添加成功，但修改失败了T T${idxTitle ? toIdxAnchor : ''}`
            chiiLib.ukagaka.presentSpeech(modifyFailed ? modifyFailedTip : successTip, true);
            return added;
        } catch (e) {
            console.error(e);
            chiiLib.ukagaka.presentSpeech('添加失败了T T', true);
        } finally {
            setTimeout(() => ukagaka.style.zIndex = '90', 3500);
        }

    };

    const createIndex = async (title, desc) => {
        await fetchPost('/index/create', {
            formhash,
            title: title.trim(),
            desc: desc.trim(),
            submit: '创建目录'
        }, body => new URLSearchParams(body));
    };
    // #endregion

    // #region 目录页
    if (location.pathname.startsWith('/index/')) {
        const indexId = location.pathname.split('/')[2];
        const boxes = document.querySelectorAll('.newIndexSection');

        boxes.forEach((box) => {
            const boxNum = box.id.split('_')[1];
            let cat = ['subject', 'character', 'person', 'ep', 'blog', 'group/topic', 'subject/topic'][boxNum];

            const input = box.querySelector('.inputtext');
            input.style.position = 'sticky';
            input.style.top = 0;
            input.style.zIndex = 2;

            if (boxNum < 4) { // 'subject', 'character', 'person', 'ep'
                // 找到原始提交按钮
                const submitBtn = box.querySelector('#submitBtnO');
                if (!submitBtn) return;

                // 创建搜索框容器并添加到提交按钮右侧
                const searchWrapper = document.createElement('div');
                searchWrapper.className = 'custom-search-wrapper';
                submitBtn.append(searchWrapper);

                // 创建搜索结果容器
                const result = document.createElement('div');
                result.classList.add('subjectListWrapper', 'search-results-container');
                result.style.display = 'none'; // 默认隐藏
                submitBtn.after(result);

                // 为subject类型添加分类选择器
                let typeSelect = null;
                if (cat === 'subject') {
                    typeSelect = document.createElement('select');
                    typeSelect.className = 'custom-search-select';
                    typeSelect.innerHTML = `
                        <option value="">全部</option>
                        <option value="1">书籍</option>
                        <option value="2">动画</option>
                        <option value="3">音乐</option>
                        <option value="4">游戏</option>
                        <option value="6">三次元</option>
                    `;
                    searchWrapper.appendChild(typeSelect);
                }

                // 创建搜索输入框
                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.className = 'custom-search-input';
                searchInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        result.style.display = 'block';
                        searchAndRender(cat, searchInput, result, input, false, typeSelect?.value);
                    }
                });

                // 创建搜索按钮
                const searchBtn = document.createElement('button');
                searchBtn.className = 'custom-search-btn';
                searchBtn.textContent = '🔍';
                searchBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    result.style.display = 'block';
                    searchAndRender(cat, searchInput, result, input, false, typeSelect?.value);
                });

                // 组装搜索框 - 添加必要的布局样式
                searchWrapper.style.display = 'inline-flex';
                searchWrapper.style.alignItems = 'center';
                searchWrapper.appendChild(searchInput);
                searchWrapper.appendChild(searchBtn);
            }

            const contentTextarea = document.createElement('textarea');
            contentTextarea.className = 'reply';
            contentTextarea.style.resize = 'vertical';
            const orderInput = document.createElement('input');
            orderInput.type = 'text';
            orderInput.className = 'inputtext';
            input.after(makeTip('评价：'), document.createElement('br'), contentTextarea, document.createElement('br'), makeTip('排序：'), document.createElement('br'), orderInput);

            const newRelatedForm = box.querySelector('#newIndexRelatedForm');
            newRelatedForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const ukagaka = document.querySelector('#robot');
                ukagaka.style.zIndex = '103';
                const v = input.value.trim();
                let subjectId;
                try {
                    const res = getCatAndId(input.value);
                    cat = res.cat;
                    subjectId = res.id;
                } catch {
                    const add_related = input.value.match(/^\d+$/) ? `/${cat}/${v}` : v;
                    subjectId = add_related.split('/').pop();
                }

                let added = getAdded(cat, subjectId);
                if (added) {
                    chiiLib.ukagaka.presentSpeech('已经添加过啦！', true);
                    setTimeout(() => ukagaka.style.zIndex = '90', 3500);
                } else {
                    added = await addAndModify(cat, subjectId, indexId, contentTextarea.value.trim(), parseInt(orderInput.value));
                    if (!added) return;
                    const neibourSelector = added.id ? candidate => `#${candidate.id}`
                        : candidate => `[attr-index-related="${candidate.getAttribute('attr-index-related')}"]`;
                    const modifyBtn = added.querySelector('a.tb_idx_rlt');
                    const eraseBtn = added.querySelector('a.erase_idx_rlt');
                    const previousAnchor = added.previousElementSibling;
                    const nextAnchor = added.nextElementSibling;
                    if (previousAnchor) {
                        document.querySelector(neibourSelector(previousAnchor)).after(added);
                    } else if (nextAnchor) {
                        document.querySelector(neibourSelector(nextAnchor)).before(added);
                    } else {
                        const parent = added.parentElement;
                        const sameParent = parent.id ? document.querySelector(`#${parent.id}`) : null;
                        if (sameParent) {
                            sameParent.append(added);
                        } else {
                            const header = parent.previousElementSibling;
                            if (header.tagName === 'H2') {
                                const line = document.createElement('div');
                                line.className = 'section_line no_border';
                                document.querySelector('#columnSubjectBrowserA').append(line, header, parent);
                            } else { // subject
                                const segmentBar = document.querySelector('.segment-container');
                                if (segmentBar) {
                                    segmentBar.after(parent);
                                } else { // 空目录
                                    const newIdxAnchor = document.querySelector('.emptyIndex');
                                    newIdxAnchor.before(parent);
                                }
                            }
                        }
                    }

                    // 激活修改功能
                    added.querySelectorAll('.thickbox').forEach(tb_init);
                    // from chiiLib.user_index.manage
                    /* eslint-disable */
                    $(modifyBtn).click(function () {
                        var $rlt_id = $(this).attr('id').split('_')[1],
                            $order = $(this).attr('order'),
                            $content = $(this).parent().parent().find('div.text').text().trim();
                        $('#ModifyRelatedForm').attr('action', '/index/related/' + $rlt_id + '/modify');
                        $('#modify_order').attr('value', $order);
                        $('#modify_content').attr('value', $content);
                        return false;
                    });
                    $(eraseBtn).click(function () {
                        if (confirm('确认删除该关联条目？')) {
                            var tml_id = $(this).attr('id').split('_')[1];
                            chiiLib.ukagaka.presentSpeech('<img src="/img/loading_s.gif" height="10" width="10" /> 请稍候，正在删除关联条目...');
                            $.ajax({
                                type: "GET",
                                url: this + '&ajax=1',
                                success: function (html) {
                                    $('[attr-index-related="' + tml_id + '"]').fadeOut(500);
                                    chiiLib.ukagaka.presentSpeech('你选择的关联条目已经删除咯～', true);
                                },
                                error: function (html) {
                                    chiiLib.ukagaka.presentSpeech(AJAXtip['error'], true);
                                }
                            });
                        }
                        return false;
                    });
                    /* eslint-enable */
                }

                added.scrollIntoView({ behavior: 'smooth' });
                added.style.boxShadow = '0 0 8px #0084b4';
                added.style.position = 'relative'; // subject 以外
                added.style.zIndex = '2'; // subject
                setTimeout(() => {
                    added.style.boxShadow = '';
                    added.style.position = '';
                    added.style.zIndex = '';
                }, 3500);
            });
        });

        // 增加弹框高度
        const addBtn = document.querySelector('a.add.primary');
        if (addBtn) addBtn.href = '#TB_inline?tb&height=300&width=450&inlineId=newIndexRelated';

        // #region 兼容“目录批量添加与编辑”
        monitorElement('.bibeBox', bibeBox => {
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
            inputWrapper.className = 'custom-search-wrapper';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'custom-search-input';
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    newSearchAndRender();
                }
            });

            const result = document.createElement('div');
            result.classList.add('subjectListWrapper', 'custom-result-list');

            const select = document.createElement('select');
            select.onchange = newSearchAndRender;
            select.className = 'custom-search-select';
            select.innerHTML = `<option value="subject">条目</option>
                                <option value="person">人物</option>
                                <option value="character">角色</option>
                                <option value="ep">章节</option>`;

            const btn = document.createElement('button');
            btn.className = 'custom-search-btn';
            btn.textContent = '🔍';
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                newSearchAndRender();
            });

            searchPanel.append(inputWrapper, result);
            inputWrapper.append(select, input, btn);

            container.append(submitWrapper, searchPanel);

            function newSearchAndRender() {
                const cat = select.value;
                searchAndRender(cat, input, result, bibeBox.querySelector('textarea'), true);
            }
        });
        // #endregion
    }
    // #endregion

    // #region 条目/角色/人物/章节页修改加入目录按钮
    if (location.pathname.match(/^\/(subject|character|person|ep|(group|subject)\/topic|blog)\/\d+/)) {
        const relateLinks = document.querySelectorAll('[href*="add_related="]');
        if (!relateLinks.length) return;

        for (const relateLink of relateLinks) {
            relateLink.href = '#TB_inline?tb&height=300&width=500&inlineId=newIndexRelated';
            relateLink.title = '加入我的目录';
            tb_init(relateLink);

            relateLink.addEventListener('click', async () => {
                const tbContent = document.getElementById('TB_ajaxContent');
                if (!tbContent) return;
                const { cat, id: subjectId } = getCatAndId(location.href);

                tbContent.innerHTML = `
                <div class="newIndexSection" style="padding: 10px;">
                    <div id="indexSelectorWrapper">
                        <span class="tip" style="min-width:5em">选择目录：</span>
                        <!-- 搜索选择器容器 -->
                        <div class="custom-select" id="searchableSelect">
                            <input type="text" class="select-input inputtext" placeholder="获取目录中..." readonly>
                            <span class="dropdown-icon"></span>

                            <div class="dropdown-menu">
                                <div class="search-box">
                                    <input type="text" placeholder="搜索目录...">
                                </div>
                                <ul class="option-list"></ul>
                            </div>
                            <input type="hidden" class="hidden-field" name="selectedDirectory" id="selectedDirectory">
                        </div>
                        <a id="toggleCreateFormBtn" class="btn btn-lg primary">新建</a>
                    </div>

                    <div id="createIndexForm" style="display: none;">
                        <div class="form-group">
                            <span class="tip">目录标题：</span>
                            <input type="text" id="createIndexTitle" required class="inputtext">
                        </div>
                        <div class="form-group">
                            <span class="tip">目录描述：</span>
                            <textarea id="createIndexDesc" class="reply" required></textarea>
                        </div>
                        <a href="javascript:;" id="createIndexBtn" class="chiiBtn">创建目录</a>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <span class="tip">评价：</span>
                        <textarea id="commentInput" class="reply" style="width: 100%; margin-top: 5px; resize: vertical; height: 120px"></textarea>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <span class="tip">排序：</span>
                        <input type="text" id="orderInput" class="inputtext">
                    </div>

                    <div>
                        <input class="inputBtn" value="添加到目录" id="submitAddBtn" type="submit">
                    </div>
                </div>`;

                const selectorInstance = createSearchableSelect();
                selectorInstance.init();

                try {
                    const indices = await getIndices();
                    if (indices.length) {
                        selectorInstance.updateOptions(indices.map(idx => ({
                            value: idx.id,
                            text: idx.title
                        })));
                    } else {
                        document.querySelector('.select-input').placeholder = '未找到目录';
                    }
                } catch (e) {
                    console.error(e);
                    document.querySelector('.select-input').placeholder = '获取目录失败，请刷新重试';
                }

                // 新建目录表单显示/隐藏切换
                const toggleBtn = document.getElementById('toggleCreateFormBtn');
                const createForm = document.getElementById('createIndexForm');
                toggleBtn.addEventListener('click', () => {
                    const isVisible = createForm.style.display !== 'none';
                    createForm.style.display = isVisible ? 'none' : 'block';
                    toggleBtn.textContent = isVisible ? '新建' : '收起';
                });

                // 创建目录功能
                const createBtn = document.getElementById('createIndexBtn');
                const titleInput = document.getElementById('createIndexTitle');
                const descInput = document.getElementById('createIndexDesc');

                createBtn.addEventListener('click', async () => {
                    const title = titleInput.value.trim();
                    const desc = descInput.value.trim();

                    if (!title) {
                        chiiLib.ukagaka.presentSpeech('请输入目录标题', true);
                        return;
                    }

                    if (!desc) {
                        chiiLib.ukagaka.presentSpeech('请输入目录描述', true);
                        return;
                    }

                    const ukagaka = document.querySelector('#robot');
                    ukagaka.style.zIndex = '103';
                    chiiLib.ukagaka.presentSpeech('创建目录中...');

                    try {
                        await createIndex(title, desc);

                        const indices = await getIndices(true);
                        // 更新选择器选项
                        selectorInstance.updateOptions(indices.map(idx => ({
                            value: idx.id,
                            text: idx.title
                        })));

                        // 选中新创建的目录
                        const newIndex = indices.find(idx => idx.title === title);
                        if (newIndex) {
                            document.querySelector('.select-input').value = newIndex.title;
                            document.getElementById('selectedDirectory').value = newIndex.id;
                        } else {
                            throw new Error('无法确认是否创建成功，请刷新再试')
                        }

                        chiiLib.ukagaka.presentSpeech('目录创建成功！', true);

                        createForm.style.display = 'none';
                        toggleBtn.textContent = '新建';
                    } catch (e) {
                        console.error(e);
                        chiiLib.ukagaka.presentSpeech(`创建失败: ${e.message}`, true);
                    } finally {
                        setTimeout(() => ukagaka.style.zIndex = '90', 3500);
                    }
                });

                // 绑定提交功能
                const submitBtn = document.getElementById('submitAddBtn');
                const commentInput = document.getElementById('commentInput');
                const orderInput = document.getElementById('orderInput');

                submitBtn.addEventListener('click', (e) => {
                    e.preventDefault();

                    const selectedIndexId = document.getElementById('selectedDirectory').value;
                    if (!selectedIndexId) {
                        chiiLib.ukagaka.presentSpeech('请选择目录', true);
                        return;
                    }

                    addAndModify(cat, subjectId, selectedIndexId, commentInput.value.trim(), parseInt(orderInput.value), document.querySelector('.select-input').value).then(tb_remove);
                });
            });
        }
    }
    // #endregion

    // #region 搜索选择器功能
    function createSearchableSelect() {
        // 私有变量
        let selectContainer, selectInput, dropdownIcon, dropdownMenu,
            searchBox, optionList, hiddenField;

        // 私有方法
        function openDropdown() {
            dropdownMenu.classList.add('show');
            dropdownIcon.classList.add('open');
            searchBox.focus();
            searchBox.value = '';

            // 显示所有选项
            const options = optionList.querySelectorAll('.option-item');
            options.forEach(item => item.style.display = 'block');

            // 移除无结果提示
            const noResultEl = optionList.querySelector('.no-result');
            if (noResultEl) optionList.removeChild(noResultEl);
        }

        function closeDropdown() {
            dropdownMenu.classList.remove('show');
            dropdownIcon.classList.remove('open');
        }

        function toggleDropdown() {
            if (dropdownMenu.classList.contains('show')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        }

        // 搜索功能
        function handleSearch(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            let hasResults = false;

            // 清除之前的无结果提示
            const noResultEl = optionList.querySelector('.no-result');
            if (noResultEl) {
                optionList.removeChild(noResultEl);
            }

            // 筛选选项
            const options = optionList.querySelectorAll('.option-item');
            options.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isMatch = text.includes(searchTerm);
                item.style.display = isMatch ? 'block' : 'none';
                if (isMatch) hasResults = true;
            });

            // 显示无结果提示
            if (!hasResults && options.length) {
                const noResult = document.createElement('li');
                noResult.className = 'no-result';
                noResult.textContent = '没有找到匹配的目录';
                optionList.appendChild(noResult);
            }
        }

        // 公共方法
        return {
            init() {
                // 获取DOM元素
                selectContainer = document.querySelector('.custom-select');
                selectInput = selectContainer.querySelector('.select-input');
                dropdownIcon = selectContainer.querySelector('.dropdown-icon');
                dropdownMenu = selectContainer.querySelector('.dropdown-menu');
                searchBox = selectContainer.querySelector('.search-box input');
                optionList = selectContainer.querySelector('.option-list');
                hiddenField = selectContainer.querySelector('.hidden-field');

                // 绑定事件
                selectInput.addEventListener('click', toggleDropdown);
                dropdownIcon.addEventListener('click', toggleDropdown);

                // 点击外部关闭下拉菜单
                document.addEventListener('click', (e) => {
                    if (!selectContainer.contains(e.target)) {
                        closeDropdown();
                    }
                });

                // 搜索功能
                searchBox.addEventListener('input', handleSearch);

                // 键盘导航
                selectInput.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        openDropdown();
                        searchBox.focus();
                    }
                });
            },

            updateOptions(options) {
                // 清空现有选项
                optionList.innerHTML = '';

                // 添加新选项
                options.forEach(option => {
                    const li = document.createElement('li');
                    li.className = 'option-item';
                    li.setAttribute('data-value', option.value);
                    li.textContent = option.text;
                    li.addEventListener('click', () => {
                        selectInput.value = option.text;
                        hiddenField.value = option.value;

                        // 更新选中状态
                        document.querySelectorAll('.option-item').forEach(i =>
                            i.classList.remove('selected')
                        );
                        li.classList.add('selected');

                        closeDropdown();
                    });
                    optionList.appendChild(li);
                });

                // 设置第一个选项为默认选中
                if (options.length) {
                    const firstOption = optionList.querySelector('.option-item');
                    if (firstOption) {
                        firstOption.classList.add('selected');
                        selectInput.value = firstOption.textContent;
                        hiddenField.value = firstOption.getAttribute('data-value');
                    }
                }
            }
        };
    }
    // #endregion

    // #region 工具函数
    function makeTip(text) {
        const tip = document.createElement('span');
        tip.classList.add('tip');
        tip.textContent = text;
        return tip;
    };

    const makeLoading = (prompt = '搜索中……') => document.createTextNode(prompt);
    async function searchAndRender(cat, input, result, target = input, append = false, type = '') {
        const [method, key] = getSearchMethod[cat];
        const keyword = input.value.trim();
        if (keyword === '') return;
        // 对于subject类型，传递分类参数
        const loader = (offset) => method(keyword, { [key]: offset, ...(cat === 'subject' ? { type } : {}) });
        const clickHandler = e => {
            e.preventDefault();
            if (target.tagName === 'INPUT') {
                document.querySelectorAll('.ajaxSubjectList li.selected-result').forEach(el => {
                    el.classList.remove('selected-result');
                });
                const liElement = e.currentTarget.closest('li');
                if (liElement) {
                    liElement.classList.add('selected-result');
                }
            }
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
            if (isEp && ![2, 6].includes(type)) return m;
            name_cn ??= infobox?.find(({ key }) => key === '简体中文名')?.value;
            if (cat !== 'subject') cat = career ? 'person' : 'character';
            type = cat === 'subject' ? ['书籍', '动画', '音乐', '游戏', '', '三次元'][type - 1] : null;
            const grid = cat === 'subject' ? images?.grid : images?.grid.replace('/g/', '/s/');
            const exist = v => v ? v : '';
            m += `<li class="clearit">
               <a href="/${cat}/${id}" class="avatar h">
                 ${grid ? `<img src="${grid}" class="avatar ll">` : ''}
               </a>
               <div class="inner">
                 <small class="grey rr">${exist(type)}</small>
                 <p><a href="/${cat}/${id}" class="avatar h">${name}</a></p>
                 <small class="tip">${exist(name_cn)}</small>
               </div>
             </li>`;
            return m;
        }, '');
    }

    const makeLiTip = (text = '') => {
        const more = document.createElement('li');
        more.classList.add('clearit');
        more.textContent = text;
        more.style.textAlign = 'center';
        more.style.listStyle = 'none';
        return more;
    }

    const makeMoreBtn = (ul, cat, loader, applyHandler, initStart = 1) => {
        const searching = makeLoading();
        const more = makeLiTip();
        const a = document.createElement('a');
        a.textContent = '加载更多';
        a.href = 'javascript:;';
        a.style.display = 'block';
        more.append(a);
        more.start = initStart;

        a.addEventListener('click', async (e) => {
            e.preventDefault();
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
                more.replaceWith(makeLiTip('没有啦'));
                return;
            }
            more.start += nextList.length;
        });

        return more;
    }

    async function renderList(loader, container, cat, handler = () => { }) {
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
            : makeLiTip('没有啦');
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
                a.href = `/ep/${id}`;
                a.className = 'load-epinfo epBtnAir';
                a.title = name;
                a.textContent = String(sort).padStart(2, '0');
                li.addEventListener('click', e => {
                    e.preventDefault();
                    // 移除之前所有选中项的高亮
                    document.querySelectorAll('.ajaxSubjectList li.selected-result').forEach(el => {
                        el.classList.remove('selected-result');
                    });
                    // 为当前选中项添加高亮
                    const topLi = li.closest('.ajaxSubjectList li');
                    if (topLi) {
                        topLi.classList.add('selected-result');
                    }
                    if (append) {
                        target.value += a.href + '\n';
                    } else {
                        target.value = a.href;
                    }
                });
                li.append(a);
                ul.append(li);
            });
        });
        parent.append(ul);
    }

    function getCatAndId(href) {
        const url = new URL(href);
        const pathname = url.pathname;
        const parts = pathname.split('/');
        const idIdx = parts.findIndex(part => part && part == +part);
        const id = parts[idIdx];
        const cat = parts.slice(1, idIdx).join('/');
        return { cat, id };
    }

    function monitorElement(selector, callback) {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

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
    }
    // #endregion

})();
