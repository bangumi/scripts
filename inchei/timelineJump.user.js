// ==UserScript==
// @name         时光机时间线跳页
// @namespace    bangumi.timeline.jump
// @version      0.1
// @description  在Bangumi时间线页面快速跳转功能
// @author       You
// @match        *://bgm.tv/user/*/timeline*
// @match        *://bangumi.tv/user/*/timeline*
// @match        *://chii.in/user/*/timeline*
// ==/UserScript==

(function () {
    'use strict';

    // 添加搜索面板
    const panelHtml = `
        <div class="SidePanel png_bg clearit">
            <h2 align="left">乘坐时光机</h2>
            <div style="margin-top: 10px; display: flex; align-items: center;">
                <input id="mySearchInput" value="" class="searchInputL" type="text" style="min-width:60px; padding:0px 7px; height:26px;" placeholder="页码">
                <input id="mySearchBtn" class="searchBtnL" title="Search" value="跳" type="button" style="margin-left: 8px; height:30px; padding:0px 9px; cursor:pointer;">
            </div>
        </div>
    `;
    $('#columnTimelineB').append(panelHtml);

    // 添加按钮点击事件
    $('#mySearchBtn').click(function () {
        const inputVal = $('#mySearchInput').val().trim().replace(/-0/g, '-');

        if (!inputVal) return;

        if (/^\d+$/.test(inputVal)) {
            let url = '';
            const pageNum = parseInt(inputVal);
            const pageLinks = document.querySelectorAll('a.p');
            if (pageLinks.length) {
                url = [...pageLinks].pop().href.replace(/page=\d+/, 'page=' + pageNum)
            } else {
                url = `${window.location.href}?type=${$('.timelineTabs .focus')[0].id.split('_')[1]}&page=${pageNum}`;
            }
            chiiLib.tml.load(url);
        }
    });

    // 输入框回车事件
    $('#mySearchInput').keypress(function (e) {
        if (e.which === 13) {
            $('#mySearchBtn').click();
        }
    });
})();
