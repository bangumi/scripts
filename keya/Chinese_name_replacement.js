// ==UserScript==
// @name         Bangumi 中文名称替换
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动将作品名称替换为中文名称并更新相关属性
// @author       Keya
// @match        *://bgm.tv/
// @match        *://bangumi.tv/
// @match        *://chii.in/
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const elements = document.querySelectorAll('[data-subject-name-cn]');

    elements.forEach(element => {
        const chineseName = element.getAttribute('data-subject-name-cn');

        if (!chineseName) return;

        if (element.textContent) {
            element.textContent = chineseName;
        }

        if (element.hasAttribute('data-subject-name')) {
            element.setAttribute('data-subject-name', chineseName);
        }

        if (element.hasAttribute('data-eusoft-scrollable-element')) {
            element.setAttribute('data-eusoft-scrollable-element', chineseName);
        }
    });

    console.log('[Bangumi Script] 已完成中文名称替换');
})();