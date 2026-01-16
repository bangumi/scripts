// ==UserScript==
// @name         长篇动画分页显示所有格子
// @namespace    subject.eps.extend
// @version      0.0.1
// @description  在长篇动画条目页格子区域增加分页选项以显示全部格子
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*
// @match        http*://chii.in/subject/*
// @match        http*://bangumi.tv/subject/*
// @grant        none
// @license      MIT
// @gf           
// ==/UserScript==

// 完成这个脚本，不要添加多余的针对已有 class 或 id 的 CSS

(function () {
    'use strict';

    const prgList = document.querySelector('.prg_list');
    if (!prgList) return;

    // 获取 prgs prgList.querySelectorAll('li')，但是要剔除第一个出现的“li.subtitle”及后面所有li
    // 如果 prgs.length !== 100，return
    const subjectId = location.href.split('/').pop();

    // 写一个函数 fetchAllEps ，使用 fetch 发出这样的请求 GET https://api.bgm.tv/v0/episodes?subject_id=2784&type=0&limit=100&offset=0
    // 每个请求获取的结果格式是这样的：
    /*
    {
        "data": [
          {
            "airdate": "2000-10-16",
            "name": "時代を越えた少女と封印された少年",
            "name_cn": "穿越时空的少女与被封印的少年",
            "duration": "",
            "desc": "脚本：池田成/絵コンテ：池田成/演出：池田成/作画監督：菱沼義仁\r\n\r\n戦国時代。巫女桔梗に封印された半妖の少年犬夜叉は、現代からタイムスリップしてきたかごめの手で甦った！　妖怪を強くする『四魂の玉』が体の中から出てきて驚くかごめ。犬夜叉は四魂の玉を飲み込んだ百足上﨟を一撃で粉砕する。",
            "ep": 1,
            "sort": 1,
            "id": 17997,
            "subject_id": 2784,
            "comment": 13,
            "type": 0,
            "disc": 0,
            "duration_seconds": 0
          }
        ]
    }
     */
    // 在 prgList 前增加并排 tab，默认选中 1-100 ，并根据总 eps 数量，添加 101-155 这种，每个 tab 最多 100 个
    // 除了默认的 1-100,其他tab无需显示第一个出现的“li.subtitle”及后面所有li
    // 其他 tab 里面新建的 li 的格式是这样的：
    // <li><a href="/ep/17997" id="prg_17997" class="load-epinfo epBtnAir" title="ep.1 時代を越えた少女と封印された少年" rel="#prginfo_17997">01</a></li>
    // 且对应要添加的 rel 是这样的，要添加在#subject_prg_content里：
    // <div id="prginfo_17997" class="prg_popup" style="display: none;"><span class="tip">中文标题: 穿越时空的少女与被封印的少年<br>首播: 2000-10-16<br><hr class="board"><span class="cmt clearit"><a href="/subject/ep/17997" class="l icons_cmt">讨论</a> <small class="na">(+13)</small></span></span></div>
})();
