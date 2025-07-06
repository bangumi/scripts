// ==UserScript==
// @name         展开时间线更多菜单
// @namespace    https://bgm.tv/group/topic/422469
// @version      0.0.1
// @description  把更多里的选项全部移动到了一级菜单
// @author       默沨
// @match        bangumi.tv/*
// @match        bgm.tv/*
// @match        chii.in/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const timelineTabs = document.getElementById('timelineTabs');
    if (!timelineTabs) {
        return;
    }

    const moreItem = timelineTabs.querySelector('li a.top')?.parentNode;
    if (!moreItem) {
        return;
    }

    const moreMenu = moreItem.querySelector('ul');
    if (!moreMenu) {
        return;
    }

    const mainMenuItems = Array.from(timelineTabs.children).filter(child => child.tagName === 'LI');
    const moreItemIndex = mainMenuItems.indexOf(moreItem);
    const subItems = Array.from(moreMenu.querySelectorAll('li'));

    subItems.forEach((item, index) => {
        timelineTabs.insertBefore(item, moreItem);
    });

    moreMenu.remove();
    moreItem.remove();
})();
