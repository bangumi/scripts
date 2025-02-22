// ==UserScript==
// @name         Bangumi 高楼优化
// @version      2.0.1
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
    style2.appendChild(document.createTextNode(`html { #comment_list .v-hd { >*:not(.v-ph){ display: none; } >.v-ph {display: block;} } .v-ph { display: none; } }`));
    document.head.append(style2);

    document.addEventListener('readystatechange', () => {
        if (document.readyState !== 'complete') return;
        const container = document.querySelector('#comment_list');
        if (!container) return style.remove();
        const items = Array.from(container.children);
        if (items.length < 30) return style.remove();

        let width = container.offsetWidth;
        window.addEventListener('resize',()=>{ width = container.offsetWidth })
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = entry.target;
                if (entry.isIntersecting) {
                    item.classList.remove('v-hd')
                } else {
                    if(width!=item._lastWidth) {
                        const placeholder = item.querySelector(':scope>.v-ph');
                        const style = getComputedStyle(item);
                        const height = item.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
                        placeholder.style.height = `${height}px`
                        item._lastWidth = width
                    }
                    item.classList.add('v-hd');
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: [0, 0.01]
        });

        items.forEach(item => {
            item.classList.add('v-hd');
            const placeholder = document.createElement('div');
            placeholder.classList.add('v-ph')
            item.append(placeholder);
            observer.observe(item);
        });
        style.remove();
    })
})();
