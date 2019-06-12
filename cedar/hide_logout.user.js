// ==UserScript==
// @name        登出按钮隐藏
// @namespace   tv.bgm.cedar.hidelogout
// @version     1.1
// @description 隐藏登出按钮. 可从设置页登出.
// @author      Cedar
// @include     *
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#post_\d+$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#;$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*\?.*/
// @exclude     /^https?://((bangumi|bgm)\.tv|chii\.in)/settings.*$/
// @exclude     /^https?://((bangumi|bgm)\.tv|chii\.in)/rakuen.*$/
// ==/UserScript==

(function () {
  'use strict';

	function findLogoutButton(parentNode) {
		for (let i = parentNode.lastChild; i; i = i.previousSibling)
		//for (let i = parentNode.firstChild; i; i = i.nextSibling)
			if (i.nodeType === 1 && i.href.includes("logout"))
				return i;
	}

	//let dockNode = document.getElementById("dock").children[0].children[0].children[1];
	//let dockNode = document.querySelector("#dock li").nextElementSibling;
	let dockNode = document.querySelector("#dock li.last").previousElementSibling;
	let t = findLogoutButton(dockNode);
	t.previousSibling.replaceWith('\n'); //保持元素个数一致
	t.style.display="none";

	let badgeUserPanel = document.getElementById("badgeUserPanel").lastElementChild;//.lastChild.previousSibling;
	t = findLogoutButton(badgeUserPanel);
	t.href = "https://bgm.tv/notify/all";
	t.innerHTML = "提醒";
}) ();

/** version:
 *  ver 1.1     实现方法优化
 *  ver 1.0.1   修改@include
 *  ver 1.0     初始版本.
 */
