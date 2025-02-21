// ==UserScript==
// @name         Bangumi 高楼优化
// @version      2.0.0
// @namespace    b38.dev
// @description  优化高楼评论的滚动性能，只渲染可见区域的评论，减少卡顿和内存占用
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/*
// @run-at       document-start
// ==/UserScript==
(async () => {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(`html { #sliderContainer, #comment_list > * > * { display: none; } }`));
    document.head.append(style);
    const style2 = document.createElement('style');
    style2.appendChild(document.createTextNode(`html { #comment_list .hidden { display: none; } }`));
    document.head.append(style2);

    document.addEventListener('readystatechange', () => {
        if (document.readyState !== 'complete') return;
        const container = document.querySelector('#comment_list');
        if (!container) return style.remove();
        const items = Array.from(container.children);
        if (items.length < 30) return style.remove();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = entry.target;
                const placeholder = item.placeholder;
                if (entry.isIntersecting) {
                    placeholder.classList.add('hidden');
                    for (const child of item.children) {
                        if (child == placeholder) continue;
                        child.style.display = undefined;
                        child.classList.remove('hidden');
                    }
                } else {
                    const style = getComputedStyle(item);
                    const height = item.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
                    placeholder.style.height = `${height}px`
                    placeholder.classList.remove('hidden');
                    for (const child of item.children) {
                        if (child == placeholder) continue;
                        child.classList.add('hidden');
                    }
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: [0, 0.01]
        });

        items.forEach(item => {
            for (const child of item.children)
                child.classList.add('hidden');
            item.placeholder = document.createElement('div');
            item.append(item.placeholder);
            observer.observe(item);
        });
        style.remove();
    })
})();