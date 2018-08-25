// ==UserScript==
// @name         Bangumi TC Searcher
// @namespace    https://github.com/bangumi/scripts/tree/master/inchei
// @version      0.1
// @description  Search bangumi by traditional Chinese
// @icon         https://bgm.tv/img/favicon.ico
// @author       inchei
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject_search.*
// @require      https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
// @require      https://gitcdn.xyz/cdn/hustlzp/jquery-s2t/8c39a9036ddb5f004c3aca6714834fb46f994b02/jquery.s2t.js
// @grant        none
// ==/UserScript==

(function() {
    var loc = decodeURI(window.location.href);
    if (/[\u3220-\uFA29]+/.test(loc)) {
        if ($.t2s(loc) !== loc)
            window.location.href = $.t2s(loc);
    }
})();