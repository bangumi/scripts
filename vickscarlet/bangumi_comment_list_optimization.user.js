// ==UserScript==
// @name         Bangumi 高楼优化
// @version      1.0.1
// @namespace    b38.dev
// @description  优化高楼评论的滚动性能，只渲染可见区域的评论，减少卡顿和内存占用
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/*
// @run-at       document-start
// ==/UserScript==
(async () => {
    function callWhenDone(fn) {
        let done = true;
        return async (...args) => {
            if (!done) return;
            done = false;
            await fn(...args);
            done = true;
        }
    }
    function callNow(fn) {
        fn();
        return fn;
    }
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(`html { #sliderContainer, #comment_list > * { display: none; } }`));
    document.head.append(style);

    function batterScroll() {
        const container = document.querySelector('#comment_list');
        if (!container) return style.remove();
        const items = Array.from(container.children);
        const total = items.length
        let minHeight = 0;
        const base = 60;
        const buffer = 1;
        const minVirtual = 100;
        const heights = new Array(total).fill(base);
        if (total < minVirtual) return style.remove();

        const renderData = { start: 0, end: 0, key: -1, top: 0, offset: 0 }
        const hashMap = new Map();

        for (let i = 0; i < total; i++) {
            hashMap.set('#' + items[i].getAttribute('id'), i)
            new MutationObserver(() => {
                if (items[i].style.display == 'none') return;
                heights[i] = items[i].offsetHeight;
                const { start, key, top, offset } = renderData;
                let paddingTop = top - offset
                for (let i = start; i < key; i++) {
                    paddingTop -= heights[i];
                }
                paddingTop = Math.max(0, paddingTop);
                container.style.paddingTop = paddingTop + 'px';
            }).observe(items[i], { attributes: true })
            const hashItems = items[i].querySelectorAll('.clearit');
            if (hashItems.length)
                for (const hashItem of hashItems)
                    hashMap.set('#' + hashItem.getAttribute('id'), i);
        }

        const getOffsetTopByHTML = (el) => {
            let offsetTop = 0
            while (el && el.tagName !== 'HTML') {
                offsetTop += el.offsetTop
                el = el.offsetParent
            }
            return offsetTop
        }

        window.addEventListener('resize', callNow(() => {
            minHeight = window.innerHeight;
            renderData.key = -1;
        }))

        document.addEventListener('scroll', callNow(callWhenDone((e) => {
            const scrollTop = e?.target.children[0].scrollTop ?? 0;
            const top = scrollTop - getOffsetTopByHTML(container);
            let start = 0;
            let offset = top
            while (start < total && offset > 0) {
                offset -= heights[start];
                start++;
            }

            start = Math.max(0, start - 1);

            if (start == renderData.key) return;
            renderData.key = start;
            renderData.top = top;
            renderData.offset = offset;
            for (let i = renderData.start; i < renderData.end; i++) {
                const item = items[i]
                if (item) item.style.display = 'none';
            }

            let end = start;
            let endBuffer = (buffer + 2) * minHeight;
            while (end < total && endBuffer > 0) {
                const item = items[end]
                if (item) items[end].style.display = 'block'
                if (end != renderData.key) endBuffer -= heights[end];
                end++
            }
            let startBuffer = (buffer + 1) * minHeight;
            while (start > 0 && startBuffer > 0) {
                if (start - 1 < 0) break;
                start--;
                const item = items[start]
                if (item) items[start].style.display = 'block'
                if (start != renderData.key) startBuffer -= heights[start];
            }

            let paddingTop = top - offset
            let paddingBottom = 0
            for (let i = start; i < renderData.key; i++) {
                paddingTop -= heights[i];
            }
            paddingTop = Math.max(0, paddingTop);
            for (let i = end; i < total; i++) {
                paddingBottom += heights[i];
            }

            container.style.paddingTop = paddingTop + 'px';
            container.style.paddingBottom = paddingBottom + 'px';
            renderData.start = start;
            renderData.end = end;
        })));
        setTimeout(function () {
            window.addEventListener('hashchange', callNow(() => {
                const hash = window.location.hash;
                const idx = hashMap.get(hash);
                let offset = 0;
                if (idx !== undefined) {
                    console.debug('idx:', idx)
                    for (let i = 0; i <= idx; i++) offset += heights[i];

                    items[idx].style.display = 'block';
                    offset += items[idx].querySelector(hash)?.offsetTop || 0;
                    offset += getOffsetTopByHTML(container);
                    items[idx].style.display = 'none';
                    window.scrollTo(0, offset);
                } else {
                    window.scrollTo(0, 0);
                }
            }));
        }, 0)
    }

    document.addEventListener('readystatechange', async () => {
        if (document.readyState !== 'complete') return;
        batterScroll();
    })

})();