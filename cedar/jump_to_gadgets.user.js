// ==UserScript==
// @name        开发者平台跳转超合金组件
// @namespace   tv.bgm.cedar.jumptogadgets
// @version     1.0
// @description 从开发者平台一键跳转到超合金组件
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/dev/app.*$/
// ==/UserScript==

(function () {
  'use strict';

  let navTabs = document.getElementsByClassName("navTabs")[0];
  let gadgets = navTabs.children[2].cloneNode(true);
  gadgets.children[0].href = "/settings/gadgets";
  gadgets.children[0].innerHTML = "超合金组件";
  navTabs.appendChild(gadgets);
}) ();
