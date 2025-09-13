// ==UserScript==
// @name         下滑隐藏顶栏，上滑显示顶栏
// @namespace    https://bgm.tv/dev/app/4701
// @version      0.0.1
// @description  下滑隐藏顶栏，上滑显示顶栏
// @author       you
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @grant        none
// @license      MIT
// @gf           
// @gadget       https://bgm.tv/dev/app/4701
// ==/UserScript==

(function () {
    'use strict';

    // 创建样式表，增强动画效果
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        #headerNeue2 {
            will-change: transform, opacity, position;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10;
        }

        /* 兼容右栏固定 */
        @media (min-width: 641px) {
            #columnEpB,
            #columnB:not(:has(#sideLayout)),
            #columnInSubjectB,
            #columnSubjectBrowserB {
                transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // 初始化变量
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const htmlElement = document.documentElement;
    const headerElement = document.getElementById('headerNeue2');
    const SCROLL_THRESHOLD = 5; // 滚动阈值
    const TOP_THRESHOLD = 100; // 顶部区域判断阈值

    if (!headerElement) return;

    // 滚动处理函数
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 兼容 Safari 回弹
        const documentHeight = document.documentElement.scrollHeight;
        const viewportHeight = document.documentElement.clientHeight;
        const maxValidScrollTop = documentHeight - viewportHeight;
        if (scrollTop < 0 || scrollTop > maxValidScrollTop) return;

        // 计算滚动差值
        const scrollDiff = scrollTop - lastScrollTop;

        // 只有滚动距离超过阈值时才处理
        if (Math.abs(scrollDiff) >= SCROLL_THRESHOLD) {
            // 页面顶部区域特殊处理
            if (scrollTop <= TOP_THRESHOLD) {
                // 在顶部附近时保持顶栏显示
                htmlElement.setAttribute('data-nav-mode', 'fixed');
                headerElement.style.transform = 'translateY(0)';
                headerElement.style.opacity = '1';
            }
            // 向上滚动时显示导航栏
            else if (scrollDiff < 0) {
                htmlElement.setAttribute('data-nav-mode', 'fixed');
                headerElement.style.transform = 'translateY(0)';
                headerElement.style.opacity = '1';
            }
            // 向下滚动时隐藏导航栏
            else if (scrollDiff > 0) {
                htmlElement.setAttribute('data-nav-mode', 'default');
                headerElement.style.transform = 'translateY(-100%)';
                headerElement.style.opacity = '0';
            }

            // 更新滚动位置
            lastScrollTop = scrollTop;
        }
    }

    // 滚动事件监听
    window.addEventListener('scroll', () => {
        requestAnimationFrame(handleScroll);
    }, { passive: true });

    // 初始化状态
    htmlElement.setAttribute('data-nav-mode', 'default');

})();
