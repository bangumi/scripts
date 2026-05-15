// ==UserScript==
// @name        登出按钮隐藏
// @namespace   tv.bgm.cedar.hidelogout
// @version     2.0
// @description 隐藏登出按钮. 可从设置页登出.
// @author      Cedar
// @include     *
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#post_\d+$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#;$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*\?.*/
// @exclude     /^https?://((bangumi|bgm)\.tv|chii\.in)/settings.*$/
// ==/UserScript==

'use strict';

let dock = (location.pathname.startsWith('/rakuen')? parent.document: document) // 适配超展开
  .getElementById("dock");
let logout = dock.querySelector('a[href*="/logout"]');
logout.style.display = "none";
logout.previousSibling.replaceWith('\n'); //保持元素个数一致

if(!location.pathname.startsWith('/rakuen')) {
  let badgeUserPanel = document.getElementById("badgeUserPanel");
  logout = badgeUserPanel.querySelector('a[href*="/logout"]');
  logout.closest('li').style.display = 'none';
}
