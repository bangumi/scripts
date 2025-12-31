// ==UserScript==
// @name         角色收藏页显示竖图
// @namespace    mono_vertical_image
// @version      0.0.1
// @description  角色收藏页显示竖图
// @author       默沨
// @match        https://bangumi.tv/*/mono*
// @match        https://bgm.tv/*/mono*
// @match        https://chii.in/*/mono*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .mainWrapper.mainXL .browserCoverMedium.coverList img.avatarCover.avatarTop {
            aspect-ratio: 3/4 !important;
        }
    `;

    document.head.appendChild(style);
})();
