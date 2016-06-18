// ==UserScript==
// @name         Bangumi EpPopuVisualizer
// @namespace    http://bgm.tv/user/prevails
// @version      0.2.4
// @description  标注ep的讨论人气
// @author       "Donuts."
// @grant        GM_getValue
// @grant        GM_setValue
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

function isRootpath() {
    return location.pathname === '/';
}

function prgListExists() {
    return $('ul.prg_list').length !== 0;
}

function getMax(arr) {
	if (arr.length === 0) {
		return 0;
	}
    return arr.reduce(function (a, b) {return a > b ? a : b;});
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
    var r = parseInt('0x' + color.substr(1, 2));
    var g = parseInt('0x' + color.substr(3, 2));
    var b = parseInt('0x' + color.substr(5, 2));
    return `rgba(${r},${g},${b},X)`;
}

function getPixel($e, attr) {
    return parseInt($e.css(attr));
}

// function default_getWidth($a) {
//     var width = getPixel($a, 'width');
//     return 6 + width;// padding + border == 6
// }

// 获取格子高度
function histogram_getHeight($a) {
    return getPixel($a, 'height') + 2 +
        getPixel($a, 'padding-top') + getPixel($a, 'padding-bottom');
}

function getShowMethod(viewMode) {
    switch(viewMode) {
        case 'default':
        var colorX = colorToRgbaX(GM_getValue("default_color"));
        return function ($lis, values) {
            var max = getMax(values);
            if (max < 20) {
                max += (20 - max) / 2;
            }
            var colors = values.map(getColor(colorX, max));
            $lis.each(function (index) {
                var $li = $(this);
                //var width = default_getWidth($('a', $li));
                $li.prepend(`<div style="height:3px;width:85%;background:${colors[index]};"></div>`);
            });
        };
        /////////////////////////////
        case 'histogram':
        var color = GM_getValue("histogram_color");
        var $expA = $('a.load-epinfo:eq(0)');
        var height = histogram_getHeight($expA);
        var bottomPx = $expA.css('margin-bottom');
        var rightPx = $expA.css('margin-right');
        return function ($lis, values) {
            var max = getMax(values);
            if (max < 20) {
                max += (20 - max) / 2;
            }
            var lengths = values.map(getLength(height, max));
            $lis.each(function (index) {
                var $li = $(this);
                $li.prepend(`<div style="position:absolute;right:0;bottom:${bottomPx};width:${rightPx};height:${lengths[index]}px;background:${color};"></div>`);
            });
        };
    }
}

function getEpValue(id) {
    var value = $(`#subject_prg_content > #prginfo_${id} small.na`).html();
    value = value.substring(2, value.length - 1);
    return parseInt(value);
}

function getColor(colorX, max) {
    return function (v) {
        return colorX.replace('X', v / max);
    };
}

function getLength(height, max) {
    return function (v) {
        return height * v / max;
    };
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

var isControlPanelLoaded = false;

function addControlPanel() {
    $('#columnHomeB').append('<div id="ep_popu_visualizer_control_panel" style="padding-left:10px;"><a class="l epv_control_panel_switch" href="javascript:;">EpPopuVisualizer 设置</a></div>');
    var $cp = $('#ep_popu_visualizer_control_panel');
    var mode = GM_getValue('viewMode');
    function refreshColor() {
        $('#epv_color_pick input').val(GM_getValue(GM_getValue('viewMode') + '_color'));
    }
    $('a.epv_control_panel_switch').click(function () {
    	// lazy 载入设置面板
        if (!isControlPanelLoaded) {
            var $content = $(
`<div class="epv_content" style="margin-top:10px;display:none;">
	<div id="epv_mode_select">模式切换: 
		<input type="radio" name="viewMode" value="default" ${(mode === 'default' ? 'checked' : '')} />渐变色 (默认) 
		<input type="radio" name="viewMode" value="histogram" ${(mode === 'histogram' ? 'checked' : '')} />条形图 
	</div>
	<div id="epv_color_pick">颜色选择: 
		<input type="text" id="epv_color_text_input"  value="${GM_getValue(mode + '_color')}"> 
		<input id="epv_color_input" type="color" value="${GM_getValue(mode + '_color')}" style="height:1.3em;">
	</div>
</div>`
			);
            $cp.append($content);
            $('#epv_mode_select input').click(function () {
                GM_setValue('viewMode', $(this).val());
                refreshColor();
            });
            $('#epv_color_pick input').change(function () {
                GM_setValue(GM_getValue('viewMode') + "_color", $(this).val());
                refreshColor();
            });
            isControlPanelLoaded = true;
        }
        $(".epv_content", $cp).slideToggle('fast');
    });
}

function main() {
    init();
    if (isRootpath()) {
        addControlPanel();
    }
    if (!prgListExists()) {
        return;
    }
    var $uls;
    if (isRootpath()) {
        $uls = $('div.infoWrapper_tv ul.prg_list');
    } else {
        $uls = $('ul.prg_list');
    }
    var show = getShowMethod(GM_getValue('viewMode'));
    $uls.each(function () {
        var $lis = $('li:not(.subtitle)', this);
        var values = getValues($lis);
        show($lis, values);
    });
}

main();
