// ==UserScript==
// @name         条目页快捷创建角色并关联
// @namespace    https://bgm.tv/group/topic/435747
// @version      0.0.2
// @description  条目角色页添加创建按钮，创建后自动跳转到关联页面并将新角色列入其中
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*
// @match        http*://bgm.tv/subject/*/characters
// @match        http*://bgm.tv/character/new
// @match        http*://bgm.tv/character/*
// @match        http*://bgm.tv/subject/*/add_related/character*
// @match        http*://bangumi.tv/subject/*
// @match        http*://bangumi.tv/subject/*/characters
// @match        http*://bangumi.tv/character/new
// @match        http*://bangumi.tv/character/*
// @match        http*://bangumi.tv/subject/*/add_related/character*
// @match        http*://chii.in/subject/*
// @match        http*://chii.in/subject/*/characters
// @match        http*://chii.in/character/new
// @match        http*://chii.in/character/*
// @match        http*://chii.in/subject/*/add_related/character*
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/549613
// @gadget       https://bgm.tv/dev/app/3465
// ==/UserScript==

(function () {
    'use strict';

    const pathname = location.pathname;

    const exposeEntry = () => {
        const a = document.createElement('a');
        a.classList.add('l');
        a.textContent = '/ 创建角色到关联';
        a.href = '/character/new';
        const br = document.createElement('br');
        document.querySelector(':where(#columnInSubjectB, #columnCrtRelatedB) .menu_inner:nth-of-type(2), .modifyTool .tip_i p:nth-of-type(2)').append(br, a);
    }

    if (pathname.endsWith('characters') || pathname.match(/^\/subject\/\d+$/)) { // 条目角色页或条目页
        exposeEntry();
    } else if (pathname.endsWith('new')) { // 创建角色页
        const referrer = document.referrer;
        const sbjId = referrer.match(/subject\/(\d+)/)?.[1];
        if (!sbjId) return;
        sessionStorage.setItem('crtRelSbjId', sbjId);
    } else if (pathname.match(/^\/character\/\d+$/)) { // 创建好的角色页
        const sbjId = sessionStorage.getItem('crtRelSbjId');
        if (!sbjId) return;
        sessionStorage.removeItem('crtRelSbjId');

        const crtId = pathname.match(/\d+/)[0];
        const crtName = document.querySelector('#headerSubject a').textContent;
        location.href = `${location.origin}/subject/${sbjId}/add_related/character?id=${crtId}&name=${encodeURIComponent(crtName)}`;
    } else if (pathname.endsWith('character')) { // 条目关联页
        exposeEntry();
        const params = new URLSearchParams(location.search);
        const crtId = params.get('id');
        if (!crtId) return;
        const crtName = decodeURIComponent(params.get('name'));

        const ul = document.querySelector('#crtRelateSubjects');
        ul.insertAdjacentHTML('afterbegin', `<li class="clearit "><p><a href="javascript:void(0);" class="h rr">x</a></p><p class="title"><a href="/character/${crtId}" class="l" target="_blank">${crtName}</a></p><span class="tip"><input type="hidden" name="infoArr[n0][crt_id]" value="${crtId}">类型: <select name="infoArr[n0][crt_type]"><option value="1">主角</option><option value="2">配角</option><option value="3">客串</option><option value="4">闲角</option><option value="5">旁白</option><option value="6">声库</option></select><span class="tip_j"> 参与：</span><input type="text" name="infoArr[n0][crt_appear_eps]" class="inputtext medium" value=""><label><span class="tip_j"> 剧透：</span><input type="checkbox" name="infoArr[n0][crt_spoiler]" value="1" undefined=""></label><span class="tip_j"> 排序：</span><input type="text" name="infoArr[n0][crt_order]" value="0" class="inputtext item_sort" onfocus="this.select()" onmouseover="this.focus()" autocomplete="off"></span></li>`);
    }

})();