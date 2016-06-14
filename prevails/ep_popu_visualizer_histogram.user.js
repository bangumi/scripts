// ==UserScript==
// @name         Bangumi EpPopuVisualizer Histogram
// @namespace    http://bgm.tv/user/prevails
// @version      0.1.0
// @description  用色块的高度标注ep的讨论人气
// @author       "Donuts."
// @match        http://bgm.tv/subject/*
// @match        http://bgm.tv/
// @match        https://bgm.tv/subject/*
// @match        https://bgm.tv/
// @match        http://bangumi.tv/subject/*
// @match        http://bangumi.tv/
// @match        http://chii.in/subject/*
// @match        http://chii.in/
// @encoding     utf-8
// @grant        none
// ==/UserScript==


function main() {
    var $uls = $('ul.prg_list');
    $uls.each(function () {
        var $lis = $('li:not(.subtitle)', this);
        addVisualBar($lis);
    });
}

function addVisualBar($lis) {
    var ids = [];
    $lis.each(function () {
        var $a = $(this).find('a');
        var id = $a[0].id.replace("prg_", '');
        ids.push(id);
    });
    var values = ids.map(getEpValue);
    var max = values.reduce(function (a, b) {
        return Math.max(a, b);
    });
    if (max === 0) {
        max = 1;
    }
    values = values.map(getLength(max));
    $lis.each(function (index) {
        var $li = $(this);
        var html = 
            '<div style="' +
            'position:absolute;' + 
            'right:0;' + 
            'bottom:3px;' + 
            'width:3px;' + 
            'height:' + values[index] + 'em;' + 
            'background:#ffbc9a;"></div>';// 颜色
        $li.prepend(html);
    });
}

function getEpValue(id) {
    var value = $("#subject_prg_content > #prginfo_" + id + " > span > span > small.na").html();
    value = value.substring(2, value.length - 1);
    return parseInt(value);
}

function getLength(max) {
    return function (v) {
        return 1.73 * v / max;// 最大高度 默认值: 1.73em
    };
}

main();
