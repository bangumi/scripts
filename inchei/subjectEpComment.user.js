// ==UserScript==
// @name         章节讨论吐槽加强
// @namespace    https://bgm.tv/group/topic/408098
// @version      0.5.6
// @description  章节讨论中置顶显示自己的吐槽，高亮回复过的章节格子
// @author       oo
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @grant        GM_xmlhttpRequest
// @connect      next.bgm.tv
// @require      https://update.greasyfork.org/scripts/549003/1658079/Bangumi-BBCode-to-HTML.js
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/516402
// @gadget       https://bgm.tv/dev/app/3341
// ==/UserScript==

/* global bbcodeToHtml */
(async function () {

    const colors = {
        watched: localStorage.getItem('incheijs_ep_watched') || '#825AFA',
        air: localStorage.getItem('incheijs_ep_air') || '#87CEFA'
    }
    const myUsername = document.querySelector('#dock a').href.split('/').pop();
    const style = document.createElement('style');
    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
    const refreshStyle = () => {
        style.textContent = css`
            .commented a.epBtnQueue {
                background: linear-gradient(#FFADD1 80%, ${colors.watched} 80%);
            }
            a.load-epinfo.epBtnWatched,
            .prg_list.load-all a.epBtnAir,
            .prg_list.load-all a.epBtnQueue {
                opacity: .6;
            }
            .commented a.load-epinfo.epBtnWatched {
                opacity: 1;
                background: ${colors.watched};
            }
            html[data-theme="dark"] .commented a.epBtnAir {
                background: rgb(from ${colors.air} r g b / 90%);
            }
            html[data-theme="dark"] .commented a.epBtnQueue {
                background: linear-gradient(#FFADD1 80%, ${colors.watched} 80%);
            }

            .uncommented a.load-epinfo.epBtnWatched,
            .prg_list.load-all .commented a.epBtnAir,
            .prg_list.load-all .commented a.epBtnQueue,
            .prg_list.load-all .uncommented a.epBtnAir,
            .prg_list.load-all .uncommented a.epBtnQueue {
                opacity: 1;
            }
            .commented a.load-epinfo.epBtnAir {
                background: ${colors.air};
            }
            html[data-theme="dark"] .commented a.load-epinfo.epBtnWatched {
                background: ${colors.watched};
            }
            .cloned_mine{
                display: block !important;
                background: transparent;
            }
            div.row_reply.light_even.cloned_mine {
                background: transparent;
            }
            .cloned_mine .inner {
                margin: 0 0 0 50px;
            }
            .colorPickers input {
                border: 0;
                padding: 0;
                width: 1em;
                height: 1em;
                border-radius: 2px;
            }
            .colorPickers input::-webkit-color-swatch-wrapper {
                padding: 0;
            }
            .colorPickers input::-webkit-color-swatch {
                border: 0;
            }
            .subject_my_comments_section {
                margin: 5px 0;
                padding: 10px;
                font-size: 12px;
                -webkit-border-radius: 5px;
                -moz-border-radius: 5px;
                border-radius: 5px;
                -moz-background-clip: padding;
                -webkit-background-clip: padding-box;
                background: #FAFAFA;
                background-clip: padding-box;
            }
            html[data-theme="dark"] .subject_my_comments_section {
                background: #353535;
            }
            .subject_my_comments_section .inner {
                font-size: 14px;
                color: #444;
            }
            html[data-theme="dark"] .subject_my_comments_section .inner {
                color: #e1e1e1;
            }
            .subject_my_comments_section .inner.loading {
                opacity: .3;
                pointer-events: none;
            }
            /* 折叠回复 */
            div.sub_reply_collapse {
                padding: 2px 0 2px 0;
                -moz-opacity: 0.8;
                opacity: 0.8;
            }
            div.sub_reply_collapse .post_actions {
                margin-top: 0;
            }
            div.sub_reply_collapse a.avatar {
                display: none;
            }
            div.sub_reply_collapse div.inner {
                margin-left: 5px;
            }
            div.sub_reply_collapse div.inner div.cmt_sub_content {
                display: inline;
                margin: 0;
                color: #555;
            }
            .tip_collapsed {
                font-size: 12px;
                color: #666;
            }
            html[data-theme="dark"] .tip_collapsed {
                color: #d8d8d8;
            }
        `;
    };
    refreshStyle();
    document.head.appendChild(style);

    async function getEpComments(episodeId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://next.bgm.tv/p1/episodes/${episodeId}/comments`,
                onload: function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject(new Error(`请求失败，状态码: ${response.status}`));
                    }
                },
                onerror: function (error) {
                    reject(new Error(`请求出错: ${error}`));
                }
            });
        });
    }

    const cacheHandler = {
        // 初始化时检查并清理过期项目
        init(target) {
            const data = JSON.parse(localStorage.getItem(target.storageKey) || '{}');
            const now = Date.now();
            for (const key in data) {
                if (data[key].expiry < now) {
                    delete data[key];
                }
            }
            localStorage.setItem(target.storageKey, JSON.stringify(data));
        },
        get(target, key) {
            const data = JSON.parse(localStorage.getItem(target.storageKey) || '{}');
            const now = Date.now();
            const oneMonth = 30 * 24 * 60 * 60 * 1000;

            if (data[key] && now < data[key].expiry) {
                // 调用时延后一个月过期时间
                data[key].expiry = now + oneMonth;
                localStorage.setItem(target.storageKey, JSON.stringify(data));
                return data[key].value;
            } else {
                delete data[key];
                localStorage.setItem(target.storageKey, JSON.stringify(data));
                return undefined;
            }
        },
        set(target, key, value) {
            const now = Date.now();
            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            const expiry = now + oneMonth;

            const data = JSON.parse(localStorage.getItem(target.storageKey) || '{}');
            data[key] = { value, expiry };
            localStorage.setItem(target.storageKey, JSON.stringify(data));

            return true;
        }
    };

    const cacheTarget = { storageKey: 'incheijs_ep_cache' };
    cacheHandler.init(cacheTarget);
    const cache = new Proxy(cacheTarget, cacheHandler);

    const saveRepliesHTML = (getHTML) => (epName, epId, replies) => {
        sessionStorage.setItem(`incheijs_ep_content_${epId}`, replies.reduce((acc, reply) => {
            return acc += `<a class="l" href="/ep/${epId}#${reply.id}">📌</a> ${getHTML(reply)}<div class="clear section_line"></div>`;
        }, `<h2 class="subtitle">${epName}</h2>`));
    };

    const saveRepliesHTMLFromDOM = saveRepliesHTML((reply) => reply.querySelector('.message').innerHTML.trim());

    const saveRepliesHTMLFromJSON = saveRepliesHTML((reply) => bbcodeToHtml(reply.content));

    // 章节讨论页
    if (location.pathname.startsWith('/ep')) {
        let replies = getRepliesFromDOM(document);
        const id = location.pathname.split('/')[2];
        if (replies.length) {
            document.getElementById('reply_wrapper').before(...replies.map(elem => {
                const clone = elem.cloneNode(true);
                clone.id += '_clone';
                clone.classList.add('cloned_mine');

                // 初始化贴贴
                /* eslint-disable */
                $(clone).find('div.likes_grid').tooltip({
                    animation: true,
                    offset: 0,
                    selector: 'a.item',
                    html: true,
                    delay: {
                        show: "300",
                        "hide": 5000
                    }
                });
                $(clone).find('div.likes_grid a.item').on('show.bs.tooltip', function (e) {
                    $(".tooltip[aria-describedby!='" + $(this).attr('aria-describedby') + "']").each(function () {
                        $(this).tooltip('hide');
                    });
                    $(this).bind('click', function () { // updateAllGrids 不含克隆，在此绑定
                        chiiLib.likes.req(this);
                        return false;
                    })
                })
                $(clone).find('.likes_grid').on('mouseleave', function () {
                    $(".tooltip").each(function () {
                        $(this).tooltip('hide');
                    });
                });
                $(clone).find('a.like_dropdown').bind('mouseenter', function () {
                    var $item = $(this),
                        $container = $item.closest('.dropdown'),
                        $type = $item.attr('data-like-type'),
                        $main_id = $item.attr('data-like-main-id'),
                        $related_id = $item.attr('data-like-related-id'),
                        $tpl_id = $item.attr('data-like-tpl-id');
                    if (!$container.find('ul').length) {
                        var $tpl = $('#' + $tpl_id).html();
                        $container.append($tpl.formatUnicorn({
                            type: $type,
                            main_id: $main_id,
                            related_id: $related_id,
                        }));
                        $container.find('ul a').bind('click', function () {
                            chiiLib.likes.req(this);
                            return false;
                        });
                    }
                });
                /* eslint-enable */

                clone.querySelectorAll('[id]').forEach(e => e.id += '_clone'); // 楼中楼回复

                clone.querySelectorAll('.erase_post').forEach(e => { // 添加原删除事件
                    /* eslint-disable */
                    $(e).click(function () {
                        if (confirm(AJAXtip['eraseReplyConfirm'])) {
                            var post_id = $(this).attr('id').split('_')[1];
                            chiiLib.ukagaka.presentSpeech(AJAXtip['wait'] + AJAXtip['eraseingReply']);
                            $.ajax({
                                type: "GET",
                                url: (this) + '&ajax=1',
                                success: function (html) {
                                    $('#post_' + post_id).fadeOut(500);
                                    chiiLib.ukagaka.presentSpeech(AJAXtip['eraseReply'], true);
                                },
                                error: function (html) {
                                    chiiLib.ukagaka.presentSpeech(AJAXtip['error'], true);
                                }
                            });
                        }
                        return false;
                    });
                    /* eslint-enable */
                });

                return clone;
            }));
            cache[id] = true;
            saveRepliesHTMLFromDOM(document.title.split(' ')[0], id, replies);

            // 修改贴贴方法
            /* eslint-disable */
            chiiLib.likes.updateGridWithRelatedID = function (related_id, data, is_live = false) {
                var $container = $('#likes_grid_' + related_id);
                var $container_clone = $('#likes_grid_' + related_id + '_clone'); // edited
                $container.html('');
                $container_clone.html(''); // edited
                if (data) {
                    var $tpl = $('#' + 'likes_reaction_grid_item').html();
                    var values = $.map(data, function (v) {
                        return v;
                    }).sort(function (a, b) {
                        return parseInt(b.total) - parseInt(a.total);
                    });
                    $.each(values, function (key, item) {
                        var filtered_users = item.users.filter(user => {
                            if (typeof (data_ignore_users) !== "undefined" && data_ignore_users.length) {
                                return !data_ignore_users.includes(user.username);
                            }
                            return true;
                        });
                        if (filtered_users.length > 0) {
                            const toAppend = $tpl.formatUnicorn({
                                type: parseInt(item.type),
                                main_id: parseInt(item.main_id),
                                related_id: related_id,
                                value: parseInt(item.value),
                                emoji: item.emoji,
                                num: parseInt(filtered_users.length),
                                selected_class: (item.selected ? (is_live ? ' live_selected selected' : ' selected') : ''),
                                users: chiiLib.likes.escapeHtml(filtered_users.map(user => {
                                    return '<a href="/user/' + user.username + '">' + user.nickname + '</a>'
                                }).join('、'))
                            });
                            $container.append(toAppend);
                            $container_clone.append(toAppend); // edited
                        }
                    });
                    $container.find('a.item').bind('click', function () {
                        chiiLib.likes.req(this);
                        return false;
                    });
                    $container_clone.find('a.item').bind('click', function () { // edited
                        chiiLib.likes.req(this);
                        return false;
                    });
                }
            };
            /* eslint-enable */

            // 同步克隆和本体的回复变化
            // 修改添加回复方法
            /* eslint-disable */
            chiiLib.ajax_reply.insertSubComments = function (list_id, json) {
                if (json.posts.sub) {
                    var posts = json.posts.sub,
                        $list = $(list_id);
                    $.each(posts, function (post_id, sub_posts) {
                        if (sub_posts) {
                            var $post = $('#post_' + post_id),
                                $main_post = $post.find('div.message'),
                                $post_clone = $('#post_' + post_id + '_clone'), // edited
                                $main_post_clone = $post_clone.find('div.message'); // edited
                            if (!$('#topic_reply_' + post_id).length) {
                                $main_post.after('<div id="topic_reply_' + post_id + '" class="topic_sub_reply"></div>');
                                $main_post_clone.after('<div id="topic_reply_' + post_id + '_clone" class="topic_sub_reply"></div>'); // edited
                            }
                            var html = '';
                            $.each(sub_posts, function (key, val) {
                                if ($('#post_' + val.pst_id).length == 0) {
                                    html += '<div id="post_' + val.pst_id + '" class="sub_reply_bg clearit"><div class="re_info"><small>' + val.dateline + '</small></div><a href="' + SITE_URL + '/user/' + val.username + '" class="avatar"><span class="avatarNeue avatarSize32 ll" style="background-image:url(\'' + val.avatar + '\')"></span></a><div class="inner"><strong class="userName"><a href="' + SITE_URL + '/user/' + val.username + '" class="l">' + val.nickname + '</a></strong><div class="cmt_sub_content">' + val.pst_content + '</div></div></div>';
                                }
                            });
                            if (html != '') {
                                $(html).hide().appendTo('#topic_reply_' + post_id).fadeIn();
                                $(html).hide().appendTo('#topic_reply_' + post_id + '_clone').fadeIn(); // edited
                            }
                        }
                    });
                }
            }
            /* eslint-enable */

            // 劫持删除回复请求
            const originalAjax = $.ajax;

            $.ajax = function (options) {
                const targetUrlRegex = /\/erase\/reply\/ep\/(\d+)\?gh=[^&]+&ajax=1$/;

                const requestUrl = options.url;
                const requestType = (options.type || '').toUpperCase();

                const isTargetRequest = requestType === "GET" && targetUrlRegex.test(requestUrl);

                if (isTargetRequest) {
                    const matchResult = requestUrl.match(targetUrlRegex);
                    const post_id = matchResult ? matchResult[1] : null;
                    const originalSuccess = options.success;

                    /* eslint-disable */
                    options.success = function (html) {
                        if (post_id) { // 同步删除克隆
                            $('#post_' + post_id + '_clone').fadeOut(500, function () {
                                $(this).remove(); // 删除以避免兼容开播前隐藏设置的强制可见，且便于检查
                                $('#post_' + post_id).remove(); // 原代码已设置动画
                                // 删除后检查是否还有自己的回复
                                const myReplies = getRepliesFromDOM(document);
                                if (myReplies.length) {
                                    cache[id] = true;
                                    saveRepliesHTMLFromDOM(document.title.split(' ')[0], id, myReplies);
                                } else {
                                    cache[id] = false;
                                    sessionStorage.removeItem(`incheijs_ep_content_${id}`);
                                }
                            });
                        }
                        if (typeof originalSuccess === 'function') {
                            originalSuccess.apply(this, arguments);
                        }
                    };
                    /* eslint-enable */
                }

                return originalAjax.call(this, options);
            };

        } else {
            cache[id] = false;
        }
        // 兼容开播前隐藏

        // 添加回复
        document.querySelector('#ReplyForm').addEventListener('submit', async () => {
            const observer = new MutationObserver(() => {
                const myReplies = getRepliesFromDOM(document);
                if (myReplies.length) {
                    cache[id] = true;
                    saveRepliesHTMLFromDOM(document.title.split(' ')[0], id, myReplies);
                    observer.disconnect();
                }
            });
            observer.observe(document.querySelector('#comment_list'), { childList: true });
        });
        // 侧栏其他章节，无法直接判断是否看过，只取缓存不检查
        const epElems = document.querySelectorAll('.sideEpList li a');
        for (const elem of epElems) {
            const url = elem.href;
            const id = url.split('/')[4];
            if (cache[id] === true) elem.style.color = colors.watched;
        }
    }

    function getRepliesFromDOM(dom) {
        return [...dom.querySelectorAll('#comment_list .row_reply')]
            .filter(comment => (
                (!comment.classList.contains('reply_collapse') ||
                    comment.querySelector('.post_content_collapsed')) &&
                comment.querySelector('.avatar')?.href.split('/').pop() === myUsername
            ));
    }

    // 动画条目页
    const subjectID = location.pathname.match(/(?<=subject\/)\d+/)?.[0];
    if (subjectID) {
        const type = document.querySelector('.focus').href.split('/')[3];
        if (['anime', 'real'].includes(type)) {
            await renderWatched();
            const prgList = document.querySelector('.prg_list');
            const innerDefault = [...prgList.querySelectorAll('a')].map(elem => `<div id="incheijs_ep_content_${elem.id.split('_').pop()}"><div class="loader"></div></div>`).join('');
            document.querySelector('.subject_tag_section').insertAdjacentHTML('afterend', /* html */`
                <div class="subject_my_comments_section">
                    <h2 class="subtitle" style="font-size:14px">我的每集吐槽
                        <a style="padding-left:5px;font-size:12px" class="l" id="expandInd" href="javascript:">[展开]</a>
                        <a style="padding-left:5px;font-size:12px" class="l" id="checkRest" href="javascript:">[检查]</a>
                        <span class="colorPickers" style="float:right">
                            <input type="color" class="titleTip" title="看过格子高亮色" name="watched" value=${colors.watched}>
                            <input type="color" class="titleTip" title="非看过格子高亮色" name="air" value="${colors.air}">
                        </span>
                    </h2>
                    <div class="inner" hidden style="padding: 5px 10px"></div>
                </div>
            `);
            document.querySelectorAll('.colorPickers input').forEach(picker => {
                picker.addEventListener('change', () => {
                    const type = picker.name;
                    localStorage.setItem(`incheijs_ep_${type}`, picker.value);
                    colors[type] = picker.value;
                    refreshStyle();
                });
                $(picker).tooltip();
            });
            const expandInd = document.querySelector('#expandInd');
            const checkRest = document.querySelector('#checkRest');
            expandInd.addEventListener('click', async (e) => {
                e.target.hidden = true;
                const inner = document.querySelector('.subject_my_comments_section .inner');
                inner.innerHTML = innerDefault;
                inner.hidden = false;
                inner.classList.add('loading');
                await displayMine();
                inner.classList.remove('loading');
                if (!inner.querySelector('h2')) {
                    inner.innerHTML = '<div style="width: 100%;text-align:center">没有找到吐槽_(:з”∠)_</div>';
                    return;
                }
                [...inner.querySelectorAll('.section_line')].pop()?.remove();
            });
            checkRest.addEventListener('click', async (e) => {
                expandInd.hidden = true;
                e.target.remove();
                prgList.classList.add('load-all');
                await renderRest();
                prgList.classList.remove('load-all');
                expandInd.hidden = false;
            });
        }
    }

    // 首页
    if (location.pathname === '/') {
        renderWatched();
    }

    async function retryAsyncOperation(operation, maxRetries = 3, delay = 1000) {
        let error;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (e) {
                error = e;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw error;
    }

    async function limitConcurrency(tasks, concurrency = 2) {
        const results = [];
        let index = 0;

        async function runTask() {
            while (index < tasks.length) {
                const currentIndex = index++;
                const task = tasks[currentIndex];
                try {
                    const result = await task();
                    results[currentIndex] = result;
                } catch (error) {
                    results[currentIndex] = error;
                }
            }
        }

        const runners = Array.from({ length: concurrency }, runTask);
        await Promise.all(runners);
        return results;
    }

    async function walkThroughEps({
        cached = () => false,
        onCached = () => { },
        shouldFetch = () => true,
        onSuccess = () => { },
        onError = () => { }
    } = {}) {
        const epElems = document.querySelectorAll('.prg_list a');
        const tasks = [];

        for (const epElem of epElems) {
            const epData = {
                epElem,
                epName: epElem.title.split(' ')[0],
                epId: new URL(epElem.href).pathname.split('/').pop()
            };

            tasks.push(async () => {
                if (cached(epData)) {
                    onCached(epData);
                    return;
                } else if (shouldFetch(epData)) {
                    try {
                        const data = await retryAsyncOperation(() => getEpComments(epData.epId));
                        const comments = data.filter(comment => comment.user.username === myUsername && comment.content);
                        if (comments.length) saveRepliesHTMLFromJSON(epData.epName, epData.epId, comments);
                        onSuccess(epData, comments);
                    } catch (error) {
                        console.error(`Failed to fetch ${epElem.href}:`, error);
                        onError(epData);
                    }
                }
            });
        }

        await limitConcurrency(tasks, 5);
    }

    async function renderEps(shouldFetch) {
        await walkThroughEps({
            cached: ({ epId }) => cache[epId] !== undefined,
            onCached: ({ epElem, epId }) => epElem.parentElement.classList.add(cache[epId] ? 'commented' : 'uncommented'),
            shouldFetch,
            onSuccess: ({ epElem, epId }, comments) => {
                const hasComments = comments.length > 0;
                cache[epId] = hasComments;
                epElem.parentElement.classList.add(hasComments ? 'commented' : 'uncommented');
            }
        });
    }

    async function renderWatched() {
        await renderEps(({ epElem }) => epElem.classList.contains('epBtnWatched'));
    }

    async function renderRest() {
        await renderEps(({ epElem }) => !epElem.classList.contains('commented') && !epElem.classList.contains('uncommented'));
    }

    async function displayMine() {
        await walkThroughEps({
            cached: ({ epId }) => sessionStorage.getItem(`incheijs_ep_content_${epId}`),
            onCached: ({ epId }) => setContainer(epId),
            shouldFetch: ({ epId }) => cache[epId],
            onSuccess: ({ epId }) => setContainer(epId),
            onError: ({ epName, epId }) => setContainer(epId,
                `${epName}加载失败<div class="clear section_line"></div>`
            )
        });

        function setContainer(epId, content) {
            const cacheKey = `incheijs_ep_content_${epId}`;
            const container = document.querySelector(`#${cacheKey}`);
            container.innerHTML = content || sessionStorage.getItem(cacheKey);
        }
    }

})();
