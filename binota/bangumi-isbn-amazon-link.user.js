// ==UserScript==
// @name        Bangumi-ISBN-Amazon-Link
// @namespace   BIAL
// @description Add amazon link by ISBN
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/subject\/\d+/
// @version     0.0.1
// @grant       none
// ==/UserScript==

$('#infobox').html($('#infobox').html().replace(/ISBN: <\/span\>(\d+)/, 'ISBN: </span>$1 <a class="l" href="https://www.amazon.co.jp/dp/$1" target="_blank">日本Amazon</a>'));
