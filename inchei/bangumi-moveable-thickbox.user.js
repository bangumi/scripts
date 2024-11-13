// ==UserScript==
// @name         Bangumi Moveable Thickbox
// @namespace    https://github.com/bangumi/scripts/tree/master/inchei
// @version      2.0.2
// @description  使 bangumi 的 thickbnox 可移動
// @icon         https://bgm.tv/img/favicon.ico
// @author       inchei
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// ==/UserScript==

(function() {
    'use strict';

    let isDragging = false;
    let offsetX, offsetY;
    let isWidthUnder640 = window.innerWidth < 640;

    // 为指定元素添加点击事件监听器
    document.querySelectorAll('a.thickbox').forEach(element => {
        element.addEventListener('click', () => {
            // 等待 #TB_iframeContent 加载完成后初始化拖动功能
            const iframe = document.getElementById('TB_iframeContent');
            if (iframe) {
                iframe.addEventListener('load', initializeDraggable);
            } else {
                // 如果 iframe 不存在，直接初始化拖动功能
                initializeDraggable();
            }
        });
    });

    function initializeDraggable() {
        const title = document.getElementById('TB_title');
        const windowElem = document.getElementById('TB_window');

        if (title && windowElem) {
            // 重置 #TB_window 的样式以防止错位
            windowElem.style.marginLeft = '0';
            windowElem.style.marginTop = '0';
            windowElem.style.left = `${(window.innerWidth - windowElem.offsetWidth) / 2}px`;
            windowElem.style.top = `${(window.innerHeight - windowElem.offsetHeight) / 2}px`;
            windowElem.style.right = 'auto';
            windowElem.style.bottom = 'auto';
            windowElem.style.position = 'fixed';

            checkWindowSize(true);

            title.style.cursor = 'move';

            title.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - windowElem.offsetLeft;
                offsetY = e.clientY - windowElem.offsetTop;

                document.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }
    }

    function onMouseMove(e) {
        if (isDragging) {
            const windowElem = document.getElementById('TB_window');
            let left = e.clientX - offsetX;
            let top = e.clientY - offsetY;

            // 确保窗口不会移出页面边界
            left = Math.max(-windowElem.offsetWidth*0.8, Math.min(left, window.innerWidth - windowElem.offsetWidth*0.2));
            top = Math.max(0, Math.min(top, window.innerHeight - windowElem.offsetHeight*0.2));

            windowElem.style.left = `${left}px`;
            windowElem.style.top = `${top}px`;
        }
    }

    function onMouseUp() {
        if (isDragging) {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
    }

    window.addEventListener('resize', () => checkWindowSize());

    function checkWindowSize(init=false) {
        const title = document.getElementById('TB_title');
        const windowElem = document.getElementById('TB_window');

        if (!title || !windowElem) return;

        if (window.innerWidth < 640 && (!isWidthUnder640 || init)) {
            if (!init) isWidthUnder640 = true;
            title.style.pointerEvents = 'none';
            document.getElementById('TB_closeWindowButton').style.pointerEvents = 'auto';
            windowElem.style.setProperty('margin-left', '0', 'important');
            windowElem.style.top = `${(window.innerHeight - windowElem.offsetHeight) / 2}px`;
            windowElem.style.left = '0';
        } else if (window.innerWidth >= 640 && (isWidthUnder640 || init)) {
        if (!init) isWidthUnder640 = false;
            title.style.pointerEvents = 'auto';
            windowElem.style.left = `${(window.innerWidth - windowElem.offsetWidth) / 2}px`;
        }
    }

})();
