// ==UserScript==
// @name        Bangumi-ISBN-Amazon-Link
// @namespace   BIAL
// @description Add amazon link by ISBN
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/subject\/\d+$/
// @version     0.0.3
// @grant       none
// ==/UserScript==

$('#infobox').html((function() {
    var isbn = $('#infobox').html().match(/ISBN: <\/span\>([\dX\-]+)/)[1];
    if(typeof isbn == "undefined") return $('#infobox').html();
    isbn.replace('-', '');
    if(isbn.length == 13) {
        isbn = isbn.substr(3, 9);
        var tmp = 0;
        for(var i = 0; i <= 8; i++) {
            tmp += parseInt(isbn[i]) * (10 - i);
        }
        tmp = 11 - (tmp % 11);
        if(tmp == 10) tmp = "X";
        if(tmp == 11) tmp = "0";
        isbn += ("" + tmp);
    }
    return $('#infobox').html().replace(/ISBN: <\/span\>([\dX\-]+)/, 'ISBN: </span>$1 <a class="l" href="https://www.amazon.co.jp/dp/' + isbn + '" target="_blank">日本Amazon</a>');
}));
