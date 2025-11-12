// ==UserScript==
// @name         bangumi 可拖动弹框
// @namespace    https://github.com/bangumi/scripts/tree/master/inchei
// @homepage     https://bgm.tv/group/topic/345086
// @homepageURL  https://bgm.tv/group/topic/345086
// @version      2.1.0
// @description  使 bangumi 的 thickbnox 可拖动
// @icon         https://bgm.tv/img/favicon.ico
// @author       inchei
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/130
// ==/UserScript==

(function() {
    'use strict';

    let isDragging = false;
    let offsetX, offsetY;
    let isWidthUnder640 = window.innerWidth < 640;
    let closeBtn;

    document.querySelectorAll('a.thickbox').forEach(element => {
        element.addEventListener('click', () => {
            const iframe = document.getElementById('TB_iframeContent');
            if (iframe) {
                iframe.addEventListener('load', initializeDraggable);
            } else {
                initializeDraggable();
            }
        });
    });

    function initializeDraggable() {
        const title = document.getElementById('TB_title');
        const windowElem = document.getElementById('TB_window');
        closeBtn = document.getElementById('TB_closeWindowButton');

        if (title && windowElem && closeBtn) {
            windowElem.style.marginLeft = '0';
            windowElem.style.marginTop = '0';
            windowElem.style.left = `${(window.innerWidth - windowElem.offsetWidth) / 2}px`;
            windowElem.style.top = `${(window.innerHeight - windowElem.offsetHeight) / 2}px`;
            windowElem.style.right = 'auto';
            windowElem.style.bottom = 'auto';
            windowElem.style.position = 'fixed';

            checkWindowSize(true);

            title.style.cursor = 'move';

            title.addEventListener('mousedown', handleDragStart);
            document.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);

            title.addEventListener('touchstart', handleDragStart, { passive: false });
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
    }

    function handleDragStart(e) {
        const windowElem = document.getElementById('TB_window');
        if (!windowElem) return;

        // 如果点击的是关闭按钮（target 或其祖先为 closeBtn），则不启动拖动
        if (closeBtn.contains(e.target)) {
            return;
        }

        if (e.type === 'touchstart') {
            const touch = e.touches[0];
            offsetX = touch.clientX - windowElem.offsetLeft;
            offsetY = touch.clientY - windowElem.offsetTop;
        } else {
            offsetX = e.clientX - windowElem.offsetLeft;
            offsetY = e.clientY - windowElem.offsetTop;
        }

        isDragging = true;
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        
        e.preventDefault(); // 拖动时阻止默认行为（如页面滚动）
        
        const windowElem = document.getElementById('TB_window');
        if (!windowElem) return;

        let clientX, clientY;

        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        let left = clientX - offsetX;
        let top = clientY - offsetY;
        left = Math.max(-windowElem.offsetWidth * 0.8, Math.min(left, window.innerWidth - windowElem.offsetWidth * 0.2));
        top = Math.max(0, Math.min(top, window.innerHeight - windowElem.offsetHeight * 0.2));

        windowElem.style.left = `${left}px`;
        windowElem.style.top = `${top}px`;
    }

    function handleDragEnd() {
        isDragging = false;
    }

    window.addEventListener('resize', () => checkWindowSize());

    function checkWindowSize(init = false) {
        const title = document.getElementById('TB_title');
        const windowElem = document.getElementById('TB_window');
        if (!title || !windowElem) return;

        if (window.innerWidth < 640 && (!isWidthUnder640 || init)) {
            if (!init) isWidthUnder640 = true;
            title.style.pointerEvents = 'none';
            closeBtn.style.pointerEvents = 'auto';
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
