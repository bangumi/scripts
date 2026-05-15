// ==UserScript==
// @name         突破右上角搜索分类限制
// @namespace    bangumi.search.cat.extend
// @version      0.0.1
// @description  处于人物版块时，右上角搜索分类可选择条目；其他版块时，可选择虚拟或现实人物
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/5945
// ==/UserScript==

(function () {
  'use strict';

  const headerSearch = document.querySelector('#headerSearch');
  if (!headerSearch) return;
  const siteSearchSelect = document.querySelector('#siteSearchSelect');
  const searchForm = headerSearch.querySelector('form');
  const searchClass = searchForm.action.split('/').pop();
  if (searchClass === 'mono_search') {
    siteSearchSelect.insertAdjacentHTML('beforeend', /* html */`
      <option value="5">条目</option>
      <option value="2">动画</option>
      <option value="1">书籍</option>
      <option value="4">游戏</option>
      <option value="3">音乐</option>
      <option value="6">三次元</option>
    `);
    siteSearchSelect.addEventListener('change', () => {
      searchForm.action = Number.isNaN(+siteSearchSelect.value) ? '/mono_search' : '/subject_search';
    });
  } else {
    siteSearchSelect.insertAdjacentHTML('beforeend', /* html */`
      <option value="prsn">真人</option>
      <option value="crt">角色</option>
    `);
    siteSearchSelect.addEventListener('change', () => {
      searchForm.action = ['prsn', 'crt'].includes(siteSearchSelect.value) ? '/mono_search' : '/subject_search';
    });
  }
})();
