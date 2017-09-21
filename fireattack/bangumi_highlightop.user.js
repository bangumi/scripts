// ==UserScript==
// @name        Bangumi 高亮楼主
// @namespace   org.fireattack.bangumi
// @description 高亮Topic里楼主的名字
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.+?/topic/\d+(#.*)?$/
// @version     0.32
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle("\
.highlightop { \
    color: #FFFFFF !important; \
    padding: 0 2px 0 2px;\
    border-radius: 3px;\
    background-color: #0055DF !important;\
} \
");

var opurl = document.querySelector(".postTopic").querySelector("a.avatar").href;

var a = document.querySelectorAll("a.l");
for (index = 0; index < a.length; ++index) {
    if (a[index].href == opurl)
      a[index].className += " highlightop";
}
