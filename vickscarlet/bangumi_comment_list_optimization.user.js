// ==UserScript==
// @name         Bangumi 高楼优化
// @version      1.0.0
// @namespace    b38.dev
// @description  优化高楼评论的滚动性能，只渲染可见区域的评论，减少卡顿和内存占用
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/*
// @run-at       document-start
// ==/UserScript==
(async () => {
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
        const minHeight = window.innerHeight;
        const base = 60;
        const renderCount = 1;
        const minVirtual = 100;
        const heights = new Array(total).fill(base);
        if (total < minVirtual) return style.remove();

        const hashMap = new Map();
        for (let i = 0; i < total; i++) {
            hashMap.set('#' + items[i].getAttribute('id'), i)
            new MutationObserver(() => {
                if (items[i].style.display != 'none')
                    heights[i] = items[i].offsetHeight;
            }).observe(items[i], { attributes: true })
            const hashItems = items[i].querySelectorAll('.clearit');
            if (hashItems.length)
                for (const hashItem of hashItems)
                    hashMap.set('#' + hashItem.getAttribute('id'), i);
        }

        let renderData = {
            start: 0,
            end: 0,
            height: 0,
            paddingTop: 0,
            paddingBottom: base * total,
        }

        container.style.paddingBottom = renderData.paddingBottom + 'px';
        const getOffsetTopByBody = (el) => {
            let offsetTop = 0
            while (el && el.tagName !== 'BODY') {
                offsetTop += el.offsetTop
                el = el.offsetParent
            }
            return offsetTop
        }

        document.addEventListener('scroll', callNow(() => {
            let start = 0;
            let top = window.scrollY - getOffsetTopByBody(container);
            let offset = top
            while (start < total && offset > 0) {
                offset -= heights[start];
                start++;
            }
            start = Math.max(0, start - 1);
            if (renderData.start == start && renderData.paddingTop + renderData.height > top + minHeight) return;

            let paddingTop = renderData.paddingTop;
            if (start < Math.abs(start - renderData.start)) {
                paddingTop = 0;
                for (let i = 0; i < start; i++) paddingTop += heights[i];
            } else if (start < renderData.start) {
                for (let i = start; i < renderData.start; i++) paddingTop -= heights[i];
            } else {
                for (let i = renderData.start; i < start; i++) paddingTop += heights[i];
            }

            let end = Math.min(start + renderCount, total);
            if (end - start < renderCount) start = Math.max(0, end - renderCount);

            for (let i = renderData.start; i < renderData.end; i++) {
                const item = items[i];
                if (item) item.style.display = 'none';
            }

            let height = 0;
            for (let i = start; i < end; i++) {
                const item = items[i];
                item.style.display = 'block';
                height += heights[i];
            }

            while (paddingTop + height < top + minHeight && end < total) {
                const item = items[end];
                item.style.display = 'block';
                height += heights[end];
                end++;
            }

            let paddingBottom = renderData.paddingBottom;
            if (total - end < Math.abs(end - renderData.end)) {
                paddingBottom = 0;
                for (let i = end; i < total; i++) paddingBottom += heights[i];
            } else if (end < renderData.end) {
                for (let i = end; i < renderData.end; i++) paddingBottom += heights[i];
            } else {
                for (let i = renderData.end; i < end; i++) paddingBottom -= heights[i];
            }

            container.style.paddingTop = paddingTop + 'px';
            container.style.paddingBottom = paddingBottom + 'px';
            renderData.start = start;
            renderData.end = end;
            renderData.height = height;
            renderData.paddingTop = paddingTop;
            renderData.paddingBottom = paddingBottom;
        }));
        setTimeout(function () {
            window.addEventListener('hashchange', callNow(() => {
                const hash = window.location.hash;
                const idx = hashMap.get(hash);
                if (idx !== undefined) {
                    let offset = 0;
                    let start = renderData.start;
                    if (idx < Math.abs(start - idx)) {
                        offset = renderData.paddingTop;
                        if (idx < start)
                            for (let i = idx; i < start; i++) offset -= heights[i];
                        else
                            for (let i = start; i < idx; i++) offset -= heights[i];
                    } else {
                        for (let i = 0; i < idx; i++) offset += heights[i];
                    }

                    if (idx > 0) {
                        offset -= heights[idx - 1];
                        items[idx - 1].style.display = 'block';
                        offset += items[idx - 1].offsetHeight;
                        items[idx - 1].style.display = 'none';
                    }

                    items[idx].style.display = 'block';
                    offset += items[idx].querySelector(hash)?.offsetTop || 0;
                    offset += getOffsetTopByBody(container);
                    items[idx].style.display = 'none';
                    window.scrollTo(0, offset - 60);
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