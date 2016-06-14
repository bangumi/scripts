// ==UserScript==
// @name         Bangumi EpPopuVisualizer
// @namespace    tv.bangumi.user.prevails.eppopuvisualizer
// @version      0.1.7
// @description  用颜色标注ep的讨论人气
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

// 一些设置参数
var epPopuVisualizerParams = {
    // 讨论数最多的 ep 标记的颜色, 默认值 #ff8040
    color0: {
        r: 0xff,
        g: 0x80,
        b: 0x40
    },
    // 讨论数最少的 ep 标记的颜色, 默认值 #ffffff
    color1: {
        r: 0xff,
        g: 0xff,
        b: 0xff
    }
};


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
    values = values.map(getColor(max));
    $lis.each(function (index) {
        var $li = $(this);
        $li.prepend('<div style="height:3px;width:85%;background:' + values[index] + ';"></div>');
    });
}

function getEpValue(id) {
    var value = $("#subject_prg_content > #prginfo_" + id + " > span > span > small.na").html();
    value = value.substring(2, value.length - 1);
    return parseInt(value);
}

function getColor(max) {
    var color0 = epPopuVisualizerParams.color0;
    var color1 = epPopuVisualizerParams.color1;
    var rfactor = (color1.r - color0.r) / max;
    var gfactor = (color1.g - color0.g) / max;
    var bfactor = (color1.b - color0.b) / max;
    return function (v) {
        var r = color1.r - Math.floor(v * rfactor);
        var g = color1.g - Math.floor(v * gfactor);
        var b = color1.b - Math.floor(v * bfactor);
        return "rgb(" + r + "," + g + "," + b + ")";
    };
}

main();
