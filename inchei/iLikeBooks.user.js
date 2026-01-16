// ==UserScript==
// @name         首页进度管理记住上次类型
// @namespace    bangumi.i.like.books
// @version      0.0.1
// @description  首页进度管理记住上次类型
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/
// @match        http*://chii.in/
// @match        http*://bangumi.tv/
// @grant        none
// @license      MIT
// @gf
// @gadget       https://bgm.tv/dev/app/5413
// ==/UserScript==

(function () {
    'use strict';

    const prefer = localStorage.getItem('homePagePrg');
    if (prefer) document.querySelector(`#prgCatrgoryFilter [subject_type="${prefer}"]`)?.click();
    document.querySelectorAll('#prgCatrgoryFilter a').forEach(a => a.addEventListener('click', () => {
        localStorage.setItem('homePagePrg', a.getAttribute('subject_type'));
    }));
})();
