// ==UserScript==
// @name         Bangumi 高楼优化
// @version      3.0.1
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
    /**merge:js=_common.dom.utils.js**/
    async function waitElement(parent, id, timeout = 1000) { return new Promise((resolve, reject) => { let isDone = false; const done = (fn) => { if (isDone) return; isDone = true; fn(); }; const observer = new MutationObserver((mutations) => { for (const mutation of mutations) { if (mutation.type === 'childList') continue; for (const node of mutation.addedNodes) { if (node.nodeType === Node.ELEMENT_NODE && node.id == id) { done(() => { observer.disconnect(); resolve(node); }); return; } } } }); observer.observe(parent, { childList: true, subtree: true }); setTimeout(() => { const node = parent.getElementById(id); if (node) done(() => { observer.disconnect(); resolve(node); }); }, 0); setTimeout(() => done(() => { observer.disconnect(); const node = parent.getElementById(id); if (node) resolve(node); else reject(); }), timeout); }); }
    /**merge**/
    /**merge:js=_common.dom.style.js**/
    function addStyle(...styles) { const style = document.createElement('style'); style.append(document.createTextNode(styles.join('\n'))); document.head.appendChild(style); return style; }
    /**merge**/
    addStyle(/**merge:css=bangumi_comment_list_optimization.user.1.css**/`html {overflow-anchor: none;#comment_list .v-hd {>*:not(.v-ph:last-child) {display: none !important;}>.v-ph:last-child {display: block;width: 100%;}}.v-ph {display: none;}}`/**merge**/);
    const style = addStyle(/**merge:css=bangumi_comment_list_optimization.user.2.css**/`html {#sliderContainer,#comment_list > * > * {display: none;}}`/**merge**/);

    waitElement(document, 'comment_list').then(container => {
        // 监听高度变化
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entrie of entries) {
                const placeholder = entrie.target.querySelector(':scope>.v-ph');
                placeholder.style.height = entrie.contentRect.height + 'px'
            }
        });

        // 监听可见性变化
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = entry.target;
                if (entry.isIntersecting) {
                    item.classList.remove('v-hd');
                } else {
                    item.classList.add('v-hd');
                }
            });
        }, { root: null, rootMargin: '0px', threshold: [0] });

        // 监听并处理列表项
        const observeIt = item => {
            if (item._listOptimization) return;
            item._listOptimization = true;
            item.classList.add('v-hd');
            const placeholder = document.createElement('div');
            placeholder.classList.add('v-ph')
            item.append(placeholder);
            resizeObserver.observe(item);
            intersectionObserver.observe(item);
        }

        // 监听评论列表变化
        new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type !== 'childList') continue;
                for (const node of mutation.addedNodes) {
                    if (node.type !== Node.ELEMENT_NODE) continue;
                    observeIt(node);
                }
            }
        }).observe(container, { childList: true });

        // 处理已存在的列表
        setTimeout(() => {
            Array.from(container.children).forEach(observeIt)
            style.remove();
        }, 0)
    }).catch(() => { });

})();
