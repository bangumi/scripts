// ==UserScript==
// @name         Bangumi 娘标记文本框移动端修正
// @namespace    ukagaka_textarea_mobile_fix_mofeng
// @version      0.0.1
// @description  Bangumi 娘标记文本框移动端修正
// @author       默沨
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (window.innerWidth > 640) {
        return;
    }

    function adjustTextareaHeight() {
        const textarea = document.querySelector('#ukagaka_shell textarea.quick[name="content"]');
        if (textarea) {
            textarea.style.height = '40px';
        }
    }

    function initObserver() {
        const targetNode = document.getElementById('ukagaka_shell');

        if (!targetNode) {
            return;
        }

        const observer = new MutationObserver(function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'subtree') {
                    adjustTextareaHeight();
                }
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObserver);
    } else {
        initObserver();
    }
})();
