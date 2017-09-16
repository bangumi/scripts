// ==UserScript==
// @name         Bangumi 系列单行本
// @namespace    com.everpcpc.bgm
// @version      0.1
// @description  单行本条目页面添加所有单行本信息
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @grant        none
// @encoding     utf-8
// ==/UserScript==

(function() {
    series = $(".subject_section .content_inner .browserCoverMedium").find(':contains("系列")').find("a");
    if (series.length === 0) {
        return;
    }
    series_url = series[0].href;
    $.get(series_url, function(data){
        subject_main = $("#columnSubjectInHomeB");
        singles = $(data).find('.subject_section :contains("单行本")');
        if (singles.length > 0){
            subject_main.after(singles[0].parentNode);
            subject_main.after(`<div class="section_line clear"></div>`);
        }
    });

})();
