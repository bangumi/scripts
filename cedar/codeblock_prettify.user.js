// ==UserScript==
// @name        简易代码块美化
// @namespace   tv.bgm.cedar.codeblockprettify
// @version     1.0
// @description 美化代码块
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#post_\d+$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#;$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*\?.*/
// @grant        GM_addStyle
// ==/UserScript==

(function () {

  GM_addStyle(`
div.codeHighlight>pre {
  font-family: "等距更纱黑体 T SC", consolas, "Lucida Console", Monaco, monospace;
  font-size: 16px;
}
`);

  let code = document.getElementsByClassName("codeHighlight");
  for (let i = 0; i < code.length; i++)
    code[i].innerHTML = code[i].innerHTML.replace(/<br>\n/g, "<br>");
}) ();
