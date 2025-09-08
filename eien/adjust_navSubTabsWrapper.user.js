// ==UserScript==
// @name         收藏概览栏后移
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  略微调整宽屏收藏概览的位置
// @author       默沨
// @match        https://bangumi.tv/*/list/*/wish*
// @match        https://bgm.tv/*/list/*/wish*
// @match        https://chii.in/*/list/*/wish*
// @match        https://bangumi.tv/*/list/*/collect*
// @match        https://bgm.tv/*/list/*/collect*
// @match        https://chii.in/*/list/*/collect*
// @match        https://bangumi.tv/*/list/*/do*
// @match        https://bgm.tv/*/list/*/do*
// @match        https://chii.in/*/list/*/do*
// @match        https://bangumi.tv/*/list/*/on_hold*
// @match        https://bgm.tv/*/list/*/on_hold*
// @match        https://chii.in/*/list/*/on_hold*
// @match        https://bangumi.tv/*/list/*/dropped*
// @match        https://bgm.tv/*/list/*/dropped*
// @match        https://chii.in/*/list/*/dropped*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    const style = document.createElement('style');
    style.id = 'responsiveNavSubTabsWrapper';

    style.textContent = `
.navSubTabsWrapper {
    clear: both;
    box-sizing: border-box;
}

@media (min-width: 1050px) {
    .navSubTabsWrapper {
        margin-left: 20px
    }
}

@media (min-width: 1100px) {
    .navSubTabsWrapper {
        margin-left: 40px;
    }
}

@media (min-width: 1150px) {
    .navSubTabsWrapper {
        margin-left: 70px;
    }
}

@media (min-width: 1200px) {
    .navSubTabsWrapper {
        margin-left: 90px;
    }
}
`;

    document.head.appendChild(style);
})();
