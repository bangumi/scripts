// ==UserScript==
// @name         Bangumi EpPopuVisualizer
// @namespace    http://bgm.tv/user/prevails
// @version      0.2.7
// @description  标注ep的讨论人气
// @author       "Donuts."
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @match        http://bgm.tv/subject/*
// @match        http://bgm.tv/
// @match        https://bgm.tv/subject/*
// @match        https://bgm.tv/
// @match        http://bangumi.tv/subject/*
// @match        http://bangumi.tv/
// @match        http://chii.in/subject/*
// @match        http://chii.in/
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @encoding     utf-8
// ==/UserScript==

function noNeed(isRoot) {
    if (isRoot) {
        return $('.load-epinfo').length === 0;
    } else {
        return ($('.focus.chl.anime').length === 0 && $('.focus.chl.real').length === 0) || $('.load-epinfo').length === 0;
    }
}

function getMax(arr) {
    if (arr.length === 0) {
        return 0;
    }
    return arr.reduce((a, b) => (a > b ? a : b));
}

function getValues($lis) {
    var ids = [];
    $lis.each(function () {
        var $a = $(this).find('a');
        var id = $a[0].id.replace("prg_", '');
        ids.push(id);
    });
    return ids.map(getEpValue);
}

function colorToRgbaX(color) {
    var r = parseInt(color.substr(1, 2), 16);
    var g = parseInt(color.substr(3, 2), 16);
    var b = parseInt(color.substr(5, 2), 16);
    return `rgba(${r},${g},${b},X)`;
}

function getPixel($e, attr) {
    return parseInt($e.css(attr));
}

function histogram_getHeight($a) {
    return getPixel($a, 'height') + 2 +
        getPixel($a, 'padding-top') + getPixel($a, 'padding-bottom');
}

function getShowMethod() {
    var viewMode = getCurrentMode();
    var $exampleEp = $('.load-epinfo:eq(0)');
    var bottomPx = $exampleEp.css('margin-bottom');
    var rightPx = $exampleEp.css('margin-right');
    var color = getCurrentModeColor();
    GM_addStyle(
        `.epv_popu_default{right:${rightPx};height:${bottomPx};}
        .epv_popu_histogram{bottom:${bottomPx};width:${rightPx};background:${color};}`);
    switch(viewMode) {
        case 'default':
        var colorX = colorToRgbaX(color);
        return function ($lis, values) {
            var max = getMax(values);
            if (max < 20) {
                max += (20 - max) / 2;
            }
            var colors = values.map((v) => (colorX.replace('X', v / max)));
            $lis.each(function (index) {
                var $a = $('a', this);
                $a.append(`<div class="epv_popu_default" style="background:${colors[index]};"></div>`);
            });
        };
        /////////////////////////////
        case 'histogram':
        var height = histogram_getHeight($exampleEp);
        return function ($lis, values) {
            var max = getMax(values);
            if (max < 20) {
                max += (20 - max) / 2;
            }
            var lengths = values.map((v) => (height * v / max));
            $lis.each(function (index) {
                var $a = $('a', this);
                $a.append(`<div class="epv_popu_histogram" style="height:${lengths[index]}px;"></div>`);
            });
        };
    }
}

function getEpValue(id) {
    var value = $(`#subject_prg_content > #prginfo_${id} .na`).html();
    value = value.substring(2, value.length - 1);
    return parseInt(value);
}

function init() {
    if (!GM_getValue('viewMode')) {
        GM_setValue('viewMode', "default");
    }
    if (!GM_getValue('default_color')) {
        GM_setValue('default_color', '#ff8040');
    }
    if (!GM_getValue('histogram_color')) {
        GM_setValue('histogram_color', '#f7bac0');
    }
}

var isControlPanelContentLoaded = false;

function addControlPanel() {
    var cp = 
        `<div id="ep_popu_visualizer_control_panel">
            <a class="l epv_control_panel_switch" href="javascript:;">EpPopuVisualizer 设置</a>
        </div>`;
    $('#columnHomeB').append(cp);
    $('.epv_control_panel_switch').click(function () {
        if (!isControlPanelContentLoaded) {
            loadControlPanelContent();
            isControlPanelContentLoaded = true;
        }
        $(".epv_content").slideToggle('fast');
    });
}

function refreshColorPickInputValue() {
    $('#epv_color_pick input').val(getCurrentModeColor());
}

function getCurrentModeColorKey() {
    return getCurrentMode() + "_color";
}

function getCurrentModeColor() {
    return GM_getValue(getCurrentModeColorKey());
}

function getCurrentMode() {
    return GM_getValue('viewMode');
}

function loadControlPanelContent() {
    var currentMode = getCurrentMode();
    var content =
        `<div class="epv_content" style="display:none;">
            <div id="epv_mode_select">模式切换: 
                <input type="radio" name="viewMode" 
                value="default" ${(currentMode === 'default' ? 'checked' : '')} /> 渐变色 (默认) 
                &nbsp;&nbsp;&nbsp;
                <input type="radio" name="viewMode" 
                value="histogram" ${(currentMode === 'histogram' ? 'checked' : '')} /> 条形图 
            </div>
            <div id="epv_color_pick">颜色选择: 
                <input type="text" id="epv_color_text_input"> 
                <input id="epv_color_input" type="color">
            </div>
        </div>`;
    $('#ep_popu_visualizer_control_panel').append(content);
    refreshColorPickInputValue();
    bindEventsToControlPanelInputs();
}

function bindEventsToControlPanelInputs() {
    $('#epv_mode_select input').click(function () {
        GM_setValue('viewMode', $(this).val());
        refreshColorPickInputValue();
    });
    $('#epv_color_pick input').change(function () {
        GM_setValue(getCurrentModeColorKey(), $(this).val());
        refreshColorPickInputValue();
    });
}

function addFixedStyleSheet() {
    const css = 
        `.epv_content > div {
            border-bottom: 1px dotted #e0e0e0;
            margin-top: 5px;
            padding: 4px 0 4px 12px;
        }
        #epv_color_input {
            height: 1.3em;
        }
        #ep_popu_visualizer_control_panel {
            padding-left: 10px;
        }
        .epv_popu_default {
            position: absolute;
            bottom: 0;
            width: 80%;
        }
        .epv_popu_histogram {
            position: absolute;
            right: 0;
        }`;
    GM_addStyle(css);
}

function main() {
    init();
    addFixedStyleSheet();
    var isRoot = location.pathname === '/';
    if (isRoot) {
        addControlPanel();
    }
    if (noNeed(isRoot)) {
        return;
    }
    var $uls = isRoot ? $('.infoWrapper_tv .prg_list') : $('.prg_list');
    var show = getShowMethod();
    $uls.each(function (index, element) {
        setTimeout(function () {
            var $lis = $('li:not(.subtitle)', element);
            var values = getValues($lis);
            show($lis, values);
        }, 150 * index + 500);
    });
}

main();
