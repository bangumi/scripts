// ==UserScript==
// @name         顶部维基直接可选编辑/修订历史/封面/关联
// @namespace    wikiBtnSwitch
// @version      0.0.1
// @description  顶部添加直接编辑/修订历史/封面/关联的按钮，不需要先点开修订历史，可设置点击 Wiki 按钮默认打开哪一项
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*
// @match        http*://chii.in/subject/*
// @match        http*://bangumi.tv/subject/*
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/5349
// ==/UserScript==

(function () {
    'use strict';

    const subjectId = location.pathname.split('/').pop();
    if (!/\d+/.test(subjectId)) return;

    const subjectCat = document.querySelector('.focus.chl').href.split('/').pop();

    const wikiBtn = document.querySelector('[href$="/edit"][href^="/subject"]');
    const changeWikiBtn = (v = 'edit_detail') => {
        wikiBtn.href = `/subject/${subjectId}/${v.endsWith('/') ? v + subjectCat : v}`;
    };
    changeWikiBtn(localStorage.getItem('wikiBtnSwitch'));

    document.querySelector('.navTabs').insertAdjacentHTML('afterend', /* html */`
    <div class="navSubTabsWrapper">
    <ul class="navSubTabs">
        <li><a href="/subject/${subjectId}/edit_detail">编辑</a></li>
        <li><a href="/subject/${subjectId}/edit">修订历史</a></li>
        <li><a href="/subject/${subjectId}/upload_img">增改封面</a></li>
        <li><a href="/subject/${subjectId}/add_related/character">关联角色</a></li>
        <li><a href="/subject/${subjectId}/add_related/person">关联人物</a></li>
        <li><a href="/subject/${subjectId}/add_related/subject/${subjectCat}">关联条目</a></li>
    </ul>
    </div>`);

    chiiLib.ukagaka.addGeneralConfig({
        title: 'Wiki 按钮默认打开',
        name: 'wikiBtnSwitch',
        type: 'radio',
        defaultValue: 'edit_detail',
        getCurrentValue: () => localStorage.getItem('wikiBtnSwitch') || 'edit_detail',
        onChange: v => {
            localStorage.setItem('wikiBtnSwitch', v);
            changeWikiBtn(v);
        },
        options: [
            { value: 'edit_detail', label: '编辑' },
            { value: 'edit', label: '修订历史' },
            { value: 'upload_img', label: '增改封面' },
            { value: 'add_related/character', label: '关联角色' },
            { value: 'add_related/person', label: '关联人物' },
            { value: 'add_related/subject/', label: '关联条目' },
        ]
    });
})();
