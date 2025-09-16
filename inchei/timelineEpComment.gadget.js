// ==UserScript==
// @name         进度时间线显示评论
// @namespace    https://bgm.tv/group/topic/418549
// @version      0.1.6
// @description  在班固米显示进度时间线的对应评论
// @author       oov
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @match        https://bangumi.tv/user/*/timeline*
// @match        https://bgm.tv/user/*/timeline*
// @match        https://chii.in/user/*/timeline*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/529610
// @gadget       https://bgm.tv/dev/app/3654
// ==/UserScript==

/*
 * 兼容性：
 * - [加载更多](https://bgm.tv/dev/app/432)
 */

(async function () {
    'use strict';

    chiiLib.ukagaka.addGeneralConfig({
        title: '进度时间线模糊防剧透',
        name: 'eptlNetabare',
        type: 'radio',
        defaultValue: 'netabare',
        getCurrentValue: () => chiiApp.cloud_settings.get('eptlNetabare') || 'on',
        onChange: v => {
            chiiApp.cloud_settings.update({ eptlNetabare: v });
            updateStyle(v === 'off');
        },
        options: [
            { value: 'on', label: '关闭' },
            { value: 'off', label: '开启' }
        ]
    });

    const style = document.createElement('style');
    function updateStyle(shouldntNetabare) {
        style.textContent = /* css */`
        .skeleton {
            background-color: #e0e0e0;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
        }
        .skeleton::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        html[data-theme="dark"] .skeleton {
            background-color: #333;
        }
        html[data-theme="dark"] .skeleton::after {
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
        .comment-skeleton {
            max-width: 500px;
            height: 32.4px;
            margin-top: 5px;
            margin-bottom: 5px;
            border-radius: 5px;
            border: 1px solid transparent;
        }

        .netabare-comment-container {
            max-height: 200px;
            overflow: auto;
            scrollbar-width: thin;
        }
        ${shouldntNetabare ? /* css */`
        .netabare-comment-container .netabare-comment {
            filter: blur(4px);
            transition: filter 200ms cubic-bezier(1, 0, 0, 1) 100ms;
        }
        .netabare-comment-container .netabare-comment img:not([smileid]) {
            filter: blur(3em);
            clip-path: inset(0);
            transition: filter 200ms cubic-bezier(1, 0, 0, 1) 100ms;
        }` : ''}
        ${shouldntNetabare ? /* css */`
        .netabare-comment-container:is(:hover, :focus) .netabare-comment {
            filter: blur(0);
        }
        .netabare-comment-container:is(:hover, :focus) .netabare-comment img:not([smileid]) {
            filter: blur(0);
        }` : ''}
        .comment.comment-failed {
            opacity: .4;
        }
        .comment.comment-failed:is(:hover, :focus) {
            opacity: 1;
        }
        `;
    }
    updateStyle(chiiApp.cloud_settings.get('eptlNetabare') === 'off');
    document.head.appendChild(style);

    class LocalStorageWithExpiry {
        constructor() {
            this.prefix = 'incheijs_eptl_';
            this.initialize();
            this.ttl = 240; // 分钟
        }

        // 初始化时清理过期项
        initialize() {
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith(this.prefix)) {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (this.isExpired(item)) localStorage.removeItem(key);
                }
            });
        }

        isExpired(item) {
            return item && item.expiry && Date.now() > item.expiry;
        }

        setItem(key, value) {
            const storageKey = `${this.prefix}${key}`;
            const expiry = Date.now() + this.ttl * 60 * 1000;
            const item = { value, expiry };
            localStorage.setItem(storageKey, JSON.stringify(item));
        }

        getItem(key) {
            const storageKey = `${this.prefix}${key}`;
            const item = JSON.parse(localStorage.getItem(storageKey));
            if (this.isExpired(item)) {
                localStorage.removeItem(storageKey);
                return null;
            }
            return item ? item.value : null;
        }

        removeItem(key) {
            const storageKey = `${this.prefix}${key}`;
            localStorage.removeItem(storageKey);
        }
    }
    const storage = new LocalStorageWithExpiry();

    const epCommentsCache = new Map();
    const subjectEpIdCache = new Map();

    const myUsername = document.querySelector('#dock a').href.split('/').pop();
    const menu = document.querySelector('#timelineTabs');
    const tmlContent = document.querySelector('#tmlContent');

    const epExists = focused => ['tab_all', 'tab_progress'].includes(focused.id);
    const isEpTl = li => {
        const subjectOrEpLink = li.querySelector(`a.l[href^="${location.origin}/subject/"]`);
        return subjectOrEpLink?.href.includes('/ep/') || subjectOrEpLink?.previousSibling.textContent.trim() === '完成了'; // 主页和时光机前后空格不同
    }
    const parseHTML = html => new DOMParser().parseFromString(html, 'text/html');
    const superGetDOM = beDistinctConcurrentRetryCached(getDOM, { cacheMap: epCommentsCache });
    const superGetSubjectEpId = beDistinctConcurrentRetryCached(getSubjectEpId, { maxCacheSize: 10, cacheMap: subjectEpIdCache, genKey: (subjectId, epNum) => `${subjectId}_${epNum}` });
    let loading = false; // 兼容加载更多，避免连续点击导致重复

    // 初始
    const initialTab = document.querySelector('#timelineTabs .focus');
    if (epExists(initialTab)) {
        lazyLoadLis([...tmlContent.querySelectorAll('li')].filter(isEpTl));
    }

    // 翻页
    tmlContent.addEventListener('click', e => {
        if (loading || !e.target.classList.contains('p')) return;
        const text = e.target.textContent;

        let toObserve, getLis;
        if (['下一页 ››', '‹‹上一页'].includes(text)) {
            superGetDOM.abortAll();
            toObserve = tmlContent;
            getLis = addedNodes => [...addedNodes].find((node) => node.id === 'timeline')?.querySelectorAll('li');
        } else if (['加载更多', '再来点'].includes(text)) {
            // 兼容加载更多
            toObserve = document.querySelector('#timeline');
            getLis = addedNodes => [...addedNodes].filter((node) => node.tagName === 'UL').flatMap((ul) => [...ul.children]);
        } else {
            return;
        }

        const observer = new MutationObserver(mutations => {
            const focused = document.querySelector('#timelineTabs .focus');
            if (!epExists(focused)) return;
            for (const mutation of mutations) {
                const { addedNodes } = mutation;
                let addedLis = getLis(addedNodes);
                addedLis &&= [...addedLis].filter(isEpTl);
                if (!addedLis || addedLis.length === 0) continue;
                observer.disconnect();
                lazyLoadLis(addedLis);
                loading = false;
            }
        });
        observer.observe(toObserve, { childList: true });
        loading = true;
    }, true);

    // 切换Tab
    let loadedObserver, currentResolve;
    const loadbarRemoved = (mutations) => mutations.some(mutation => [...mutation.removedNodes].some(node => node.classList?.contains('loading')));
    const initLoadedObserver = () => {
        if (loadedObserver) return;
        loadedObserver = new MutationObserver(mutations => {
            if (loadbarRemoved(mutations)) {
                loadedObserver.disconnect();
                currentResolve();
                currentResolve = null;
            }
        });
    };
    menu.addEventListener('click', async (e) => {
        loadedObserver?.disconnect();
        if (e.target.tagName !== 'A' || !epExists(e.target)) return;
        superGetDOM.abortAll();
        await (new Promise(resolve => {
            currentResolve = resolve;
            initLoadedObserver();
            loadedObserver.observe(tmlContent, { childList: true });
        }));
        let originalItems = [...document.querySelectorAll('#timeline li')].filter(isEpTl);
        lazyLoadLis(originalItems);
    }, true);

    function lazyLoadLis(lis) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const li = entry.target;
                        loadComments(li);
                        observer.unobserve(li);
                    }
                });
            },
            { threshold: 0.1 }
        );
        lis.forEach((li) => observer.observe(li));
    }

    async function loadComments(tl) {
        let comment = storage.getItem(tl.id);
        const inexist = comment?.inexist;
        let epA, epUrl, epId = comment?.epId;
        if (inexist && !epId) return;

        const subjectOrEpLink = tl.querySelector(`a.l[href^="${location.origin}/subject/"]`);
        const card = tl.querySelector('.card');
        const isWcl = !!epId || !subjectOrEpLink.href.includes('/ep/');

        const skeleton = document.createElement('div');
        skeleton.className = 'comment-skeleton skeleton';

        if (isWcl) {
            const subjectId = subjectOrEpLink.href.split('/').pop();
            const progText = subjectOrEpLink.nextSibling;
            const progTextFrag = progText.textContent.split(' ');
            const epNum = +progTextFrag[1];
            if (isNaN(epNum)) return;

            try {
                if (!epId) {
                    card.before(skeleton);
                    epId = await superGetSubjectEpId(subjectId, epNum);
                }
                epUrl = `/subject/ep/${epId}`;
                epA = document.createElement('a');
                epA.className = 'l';
                epA.href = epUrl;
                epA.textContent = epNum;
                const newProgText = document.createTextNode(` ${progTextFrag.slice(2).join(' ')}`);
                progText.replaceWith(' ', epA, newProgText);

                if (inexist) {
                    skeleton.remove();
                    return;
                }
            } catch (error) {
                console.error(tl, error);
                card.before(makeReloadBtn(tl, '获取章节 ID 失败，点击重试'));
                skeleton.remove();
                return;
            }
        } else {
            epA = subjectOrEpLink;
            epUrl = epA.href;
            epId = epUrl.split('/').pop();
        }

        const footer = tl.querySelector('.post_actions.date');
        const userId = tl.dataset.itemUser || location.pathname.split('/')?.[2];

        card.before(skeleton);

        try {
            if (!comment || epCommentsCache.has(epId)
                || Object.keys(comment).length === 1 && Object.keys(comment)[0] === 'epId') {
                const dom = await superGetDOM(epUrl);
                const commentEle = getUserCommentFromDom(userId, dom);
                if (!commentEle) {
                    storage.setItem(tl.id, { inexist: true, ...(isWcl && { epId }) });
                    throw new Error('No comment found');
                }
                const html = commentEle.querySelector('.message').innerHTML.trim();
                const id = commentEle.id.slice(5); // "post_".length
                comment = {
                    html,
                    id,
                    tietie: getTietieFromDom(id, dom),
                    ...(isWcl && { epId })
                };
                storage.setItem(tl.id, comment);
            }
            const { html, id, tietie } = comment;
            card.insertAdjacentHTML('beforebegin', `<div class="comment netabare-comment-container" role="button" tabindex="0"><span class="netabare-comment">${html}</span></div>`);
            epA.href = `${epUrl}#post_${id}`;
            footer.insertAdjacentHTML('beforebegin', `<div class="likes_grid" id="likes_grid_${id}"></div>`);
            footer.insertAdjacentHTML('afterbegin', /* html */`
                <div class="action dropdown dropdown_right">
                <a href="javascript:void(0);" class="icon like_dropdown"
                    data-like-type="11"
                    data-like-main-id="${epId}"
                    data-like-related-id="${id}"
                    data-like-tpl-id="likes_reaction_menu">
                    <span class="ico ico_like">&nbsp;</span>
                    <span class="title">贴贴</span>
                </a>
                </div>
            `);
            window.chiiLib.likes.updateGridWithRelatedID(id, tietie);
            window.chiiLib.likes.init();
        } catch (error) {
            if (error.message !== 'No comment found') {
                console.error(tl, error);
                if (isWcl) storage.setItem(tl.id, { epId });
                card.before(makeReloadBtn(tl, '获取章节评论失败，点击重试'));
            } else {
                console.log(tl, '未找到评论');
            }
        } finally {
            skeleton.remove();
        }
    }

    function makeReloadBtn(tl, message) {
        const btn = document.createElement('div');
        btn.className = 'comment comment-failed';
        btn.textContent = message;
        btn.style.cursor = 'pointer';
        btn.role = 'button';
        btn.tabIndex = 0;
        btn.onclick = () => {
            btn.remove();
            loadComments(tl);
        };
        return btn;
    }

    function getSubjectEpIdFromDOM(subjectId, epNum) {
        if (location.pathname.includes('/user/')) return null;
        try {
            const epEles = [...document.querySelectorAll('.load-epinfo')];
            const epTlEles = [...document.querySelectorAll('.tml_item')].filter(isEpTl);
            return (epEles.find(epEle => {
                const epEleSubjectId = epEle.getAttribute('subject_id');
                const epEleEpNum = +epEle.textContent;
                return (epEleSubjectId === subjectId && epEleEpNum === epNum)
            }) || epTlEles.find(epTlEle => {
                const epLink = epTlEle.querySelector(':is(.info, .info_full) a.l:last-of-type');
                const epTlEleSubjectId = epTlEle.querySelector('.card a').href.split('/').pop();
                const epTlEleEpNum = +epLink.textContent.split(' ')[0].split('.')[1]
                if (isNaN(epTlEleEpNum)) return false;
                return (epTlEleSubjectId === subjectId && epTlEleEpNum === epNum)
            }))?.href.split('/').pop();
        } catch (e) {
            console.error(e)
        }
    }

    async function getSubjectEpId(subjectId, epNum) {
        const epIdInDOM = getSubjectEpIdFromDOM(subjectId, epNum);
        if (epIdInDOM) return epIdInDOM;
        const response = await fetch(`https://api.bgm.tv/v0/episodes?subject_id=${subjectId}&limit=1&offset=${epNum - 1}`);
        if (!response.ok) throw new Error(`请求 ${subjectId} ep${epNum} ID 失败，状态码: ${response.status}`);
        const { data } = await response.json();
        if (!data[0]) throw new Error(`未找到 ${subjectId} ep${epNum}`);
        return data[0].id;
    }

    function getUserCommentFromDom(userId, dom) {
        return [...dom.querySelectorAll('#comment_list .row_reply')].find((comment) => comment.dataset.itemUser === userId && !comment.querySelector('.message .tip_collapsed'));
    }

    function getTietieFromDom(postId, dom) {
        const PRE = 22; /* "var data_likes_list = ".length */
        let data_likes_list = dom.querySelector('#likes_reaction_grid_item + script').textContent.trim();
        if (data_likes_list) {
            data_likes_list = data_likes_list.slice(PRE, -1);
            return JSON.parse(data_likes_list)[postId];
        }
    }

    async function getDOM(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP request failed');
        const html = await response.text();
        const dom = parseHTML(html);
        return dom;
    }

    function beDistinctConcurrentRetryCached(requestFunction, options = {}) {
        const {
            maxConcurrency = 3,
            maxRetries = 2,
            retryDelay = 1000,
            maxCacheSize = 3,
            cacheMap, // ep comments 缓存会在外部调用
            genKey = (arg1) => arg1,
        } = options;

        const pendingRequests = new Map();
        const activeRequests = new Set();
        const abortControllers = new Map();

        const wrapped = async (...args) => {
            const key = genKey(...args);
            if (cacheMap.has(key)) {
                console.log(`Returning cached result for ${key}`);
                const result = cacheMap.get(key);
                cacheMap.delete(key);
                cacheMap.set(key, result);
                return result;
            }

            if (pendingRequests.has(key)) {
                console.log(`Request to ${key} is already pending, waiting...`);
                return pendingRequests.get(key);
            }

            while (activeRequests.size >= maxConcurrency) {
                console.log(`Max concurrency (${maxConcurrency}) reached, waiting...`);
                await Promise.race([...activeRequests]);
            }

            try {
                const requestPromise = (async () => {
                    let retries = 0;
                    while (retries <= maxRetries) {
                        try {
                            const result = await requestFunction(...args);
                            if (cacheMap.size > maxCacheSize) {
                                const oldestKey = cacheMap.keys().next().value;
                                cacheMap.delete(oldestKey);
                            }
                            cacheMap.set(key, result);
                            return result;
                        } catch (error) {
                            retries++;
                            if (retries > maxRetries) {
                                throw new Error(`Request to ${key} failed after ${maxRetries} retries: ${error.message}`);
                            }
                            console.log(`Request to ${key} failed: ${error.message}, retrying (${retries}/${maxRetries})...`);
                            await new Promise((resolve) => setTimeout(resolve, retryDelay));
                        }
                    }
                })();

                const manageActiveRequests = (async () => {
                    activeRequests.add(requestPromise);
                    try {
                        return await requestPromise;
                    } finally {
                        activeRequests.delete(requestPromise);
                    }
                })();

                pendingRequests.set(key, manageActiveRequests);
                return await manageActiveRequests;
            } finally {
                pendingRequests.delete(key);
            }
        };

        wrapped.abortAll = () => {
            abortControllers.forEach((controller) => controller.abort());
            abortControllers.clear();
            activeRequests.clear();
            pendingRequests.clear();
        };

        return wrapped;
    }

    // 键盘操作
    document.addEventListener('click', e => {
        if (e.target.classList.contains('netabare-comment-container')) e.target.focus();
    }, true);

    // 保存贴贴变化
    const originalReq = window.chiiLib.likes.req;
    window.chiiLib.likes.req = (ele) => {
        const tlId = ele.closest('.tml_item').id;
        const comment = storage.getItem(tlId);
        if (!comment) return originalReq.call(this, ele);

        const id = new URLSearchParams(ele.href).get('id');
        const originalAjax = $.ajax;
        $.ajax = (options) => {
            const originalSuccess = options.success;
            options.success = function (json) {
                originalSuccess.call(this, json);
                const tietie = json.data?.[id];
                if (tietie) {
                    comment.tietie = tietie;
                } else {
                    const originalTietie = comment.tietie;
                    const onlyValue = (arr, filter) => arr.length === 1 && filter(arr[0]);

                    // 频繁贴贴会导致返回 undefined，此时不应该清除贴贴数据
                    if (!originalTietie || onlyValue(Object.keys(originalTietie), key => onlyValue(originalTietie[key].users, user => user.username === myUsername))) {
                        comment.tietie = null;
                    }
                };
                storage.setItem(tlId, comment);
            };
            const result = originalAjax.call(this, options);
            $.ajax = originalAjax;
            return result;
        };
        originalReq.call(this, ele);
    };
})();