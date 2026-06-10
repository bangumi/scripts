// ==UserScript==
// @name         关联按钮直接选择条目类型
// @namespace    bangumi.wiki.relate.non.anime
// @version      0.0.1
// @description  关联按钮直接选择条目类型
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*
// @match        http*://bgm.tv/person/*
// @match        http*://bgm.tv/character/*
// @match        http*://chii.in/subject/*
// @match        http*://chii.in/person/*
// @match        http*://chii.in/character/*
// @match        http*://bangumi.tv/subject/*
// @match        http*://bangumi.tv/person/*
// @match        http*://bangumi.tv/character/*
// @grant        none
// @license      MIT
// @gf
// ==/UserScript==

(function () {
  'use strict';

  const slugs = location.pathname.match(/\/(subject|person|character)\/\d+/)?.[0];
  if (!slugs) return;

  const ml = document.querySelector('.modifyTool [href$="add_related/anime"]');
  if (ml) {
    ml.outerHTML = `<a href="${slugs}/add_related/anime" class="l">动画</a>
    /
    <a href="${slugs}/add_related/book" class="l">书籍</a>
    /
    <a href="${slugs}/add_related/music" class="l">音乐</a>
    /
    <a href="${slugs}/add_related/game" class="l">游戏</a>
    /
    <a href="${slugs}/add_related/real" class="l">三次元</a>`;
  }
  const nl = document.querySelector('.navSubTabs [href*="add_related/subject/"]');
  if (nl) {
    nl.parentElement.outerHTML = `
    <li><a href="${slugs}/add_related/subject/anime">关联动画</a></li>
    <li><a href="${slugs}/add_related/subject/book">关联书籍</a></li>
    <li><a href="${slugs}/add_related/subject/music">关联音乐</a></li>
    <li><a href="${slugs}/add_related/subject/game">关联游戏</a></li>
    <li><a href="${slugs}/add_related/subject/real">关联三次元</a></li>`;
  }

})();
