// ==UserScript==
// @name         展开所有回复
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  开启“折叠长楼层”后，点击可展开所有长楼层
// @author       vvv
// @include      http*://bgm.tv/*
// @include      http*://chii.in/*
// @include      http*://bangumi.tv/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (!document.querySelector('.topic_sub_reply')) return;
    const link = document.createElement('a');
    link.href = 'javascript:;';
    link.innerText = '[展开所有回复]';
    link.onclick = () => {
        document.querySelectorAll('.acl_ex').forEach(a => a.click());
        link.remove();
    }
    document.querySelector('h1').append(link);

})();
