// ==UserScript==
// @name         Bangumi 高楼优化
// @version      3.0.4
// @namespace    b38.dev
// @description  优化高楼评论的滚动性能，只渲染可见区域的评论，减少卡顿和内存占用
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/bangumi_comment_list_optimization.user.js
// @match        *://bgm.tv/*
// @match        *://chii.in/*
// @match        *://bangumi.tv/*
// @run-at       document-start
// ==/UserScript==
(async () => {
    /**merge:js=common/dom.utils.js**/
    async function waitElement(parent, id, timeout = 1000) { return new Promise((resolve) => { let isDone = false; const done = (fn) => { if (isDone) return; isDone = true; fn(); }; const observer = new MutationObserver((mutations) => { for (const mutation of mutations) { for (const node of mutation.addedNodes) { if (node.id == id) { done(() => { observer.disconnect(); resolve(node); }); return; } } } }); observer.observe(parent, { childList: true, subtree: true }); const node = parent.querySelector('#' + id); if (node) return done(() => { observer.disconnect(); resolve(node); }); setTimeout(() => done(() => { observer.disconnect(); resolve(parent.querySelector('#' + id)); }), timeout); }); }
    function observeChildren(element, callback) { new MutationObserver((mutations) => { for (const mutation of mutations) for (const node of mutation.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) callback(node); }).observe(element, { childList: true }); for (const child of Array.from(element.children)) callback(child); }
    function observerEach(Observer, callback, options) { return new Observer((entries) => entries.forEach(callback), options); }
    /**merge**/
    /**merge:js=common/dom.style.js**/
    function addStyle(...styles) { const style = document.createElement('style'); style.append(document.createTextNode(styles.join('\n'))); document.head.appendChild(style); return style; }
    /**merge**/
    addStyle(/**merge:css=bangumi_comment_list_optimization.user.1.css**/`html {overflow-anchor: none;#comment_list .v-hd:not(:has(.reply_highlight )) {>*:not(.v-ph:last-child) {display: none !important;}>.v-ph:last-child {display: block;height: 44px;width: 100%;}}.v-ph {display: none;}}`/**merge**/);
    const style = addStyle(/**merge:css=bangumi_comment_list_optimization.user.2.css**/`html {#sliderContainer,#comment_list > *:not(:has(.reply_highlight)) > * {display: none;}}`/**merge**/);

    const container = await waitElement(document, 'comment_list');
    if (!container) return;

    // 监听高度变化
    const resizeObserver = observerEach(ResizeObserver, entrie => {
        const placeholder = entrie.target.querySelector(':scope>.v-ph');
        placeholder.style.height = entrie.contentRect.height + 'px'
    });

    // 监听可见性变化
    const intersectionObserver = observerEach(IntersectionObserver, entry => {
        const item = entry.target;
        if (entry.isIntersecting) item.classList.remove('v-hd');
        else item.classList.add('v-hd');
    });

    // 监听评论列表变化
    observeChildren(container, item => {
        if (item._listOptimization) return;
        item._listOptimization = true;
        item.classList.add('v-hd');
        const placeholder = document.createElement('div');
        placeholder.classList.add('v-ph')
        item.append(placeholder);
        resizeObserver.observe(item);
        intersectionObserver.observe(item);
    });
    style.remove();

    const onHashChange = () => {
        const hash = window.location.hash;
        if (!hash) return;
        const item = document.querySelector(hash);
        if (!item) return;
        item.scrollTo();
    };
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('load', onHashChange);
    onHashChange();
})();
