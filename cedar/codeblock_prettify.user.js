// ==UserScript==
// @name        简易代码块美化
// @namespace   tv.bgm.cedar.codeblockprettify
// @version     1.0
// @description 美化代码块
// @author      Cedar
// @include     *
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#post_\d+$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#;$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*\?.*/
// ==/UserScript==

(function () {
  let code = document.getElementsByClassName("codeHighlight");
  for (let i = 0; i < code.length; i++)
    code[i].innerHTML = code[i].innerHTML.replace(/<br>\n/g, "<br>");
}) ();
