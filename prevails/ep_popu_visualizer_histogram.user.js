// ==UserScript==
// @name         Bangumi EpPopuVisualizer Histogram
// @namespace    http://bgm.tv/user/prevails
// @version      0.1.2
// @description  条形图标注ep的讨论人气
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

var right;
var bottom;
var fontSize;

function main() {
    init();
    var $uls = $('ul.prg_list');
    $uls.each(function () {
        var $lis = $('li:not(.subtitle)', this);
        addVisualBar($lis);
    });
}

function init() {
    $a = $('ul.prg_list:eq(0) > li:eq(0) > a');
    right = $a.css('margin-right');
    bottom = $a.css('margin-bottom');
    fontSize = $a.css('font-size');
    fontSize = parseFloat(fontSize.replace('px', ''));
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
    if (max < 20) {
        max += (20 - max) / 2;// 调整 max 较低时的表现
    }
    values = values.map(getLength(max));
    $lis.each(function (index) {
        var $li = $(this);
        var html =
            '<div style="' +
            'position:absolute;' +
            'right:0;' +
            'bottom:' + bottom + ';' +
            'width:' + right + ';' +
            'height:' + values[index] + 'px;' +
            'background:#f7bac0;"></div>';// 颜色
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
        return (8 + fontSize) * v / max;// 最大高度 字高 + 8
    };
}

main();
