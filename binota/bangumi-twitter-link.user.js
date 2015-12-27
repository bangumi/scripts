// ==UserScript==
// @name        Bangumi-Twitter-Link
// @namespace   BTL
// @description Add twitter link in person page (According to Infobox).
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/person\/\d+$/
// @version     0.0.1
// @grant       none
// ==/UserScript==

$('#infobox').html((function() {
    return $('#infobox').html().replace(/([Tt]witter[^:]*): <\/span\>@?([\w\d_]+)/gi, '$1: </span><a class="l" href="https://twitter.com/$2" target="_blank">@$2</a>');
}));

