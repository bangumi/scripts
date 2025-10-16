// ==UserScript==
// @name         根据章节简介关联制作人员参与
// @namespace    wiki.ep.staff.replate
// @version      0.2.0
// @description  从章节页或人物关联页根据章节简介关联制作人员参与
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/ep/*
// @match        http*://bgm.tv/subject/*/add_related/person*
// @match        http*://bgm.tv/person/new*
// @match        http*://bangumi.tv/ep/*
// @match        http*://bangumi.tv/subject/*/add_related/person*
// @match        http*://chii.in/ep/*
// @match        http*://chii.in/subject/*/add_related/person*
// @match        http*://bangumi.tv/person/new*
// @match        http*://chii.in/person/new*
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/552493
// @gadget       https://bgm.tv/dev/app/4948
// ==/UserScript==

/* global OpenCC */
// window.personAliasQuery

(async function () {
    'use strict';

    // #region vars
    let epsCache;
    const roleIdMap = [...document.querySelectorAll('#prsnPos_0 option')].reduce((map, option) => {
        map[option.textContent.split(' /')[0]] = option.value;
        return map;
    }, {});

    const regions = ['cn', 'tw', 'hk', 'jp'];
    let converters = {}, loading;

    const regexes_per = {
        "脚本": /(?<=[\u3040-\u9fa5]*?(脚本|シナリオ|剧本|编剧|プロット|大纲)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "分镜": /(?<=[\u3040-\u9fa5]*?(分镜|コンテ)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "演出": /(?<=[\u3040-\u9fa5]*?(演出)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "构图": /(?<=[\u3040-\u9fa5]*?(レイアウト|构图|layout|レイアウター)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "作画监督": /(?<=[\u3040-\u9fa5]*?(?<!総|总|アクション|メカ|ニック|エフェクト|动作|机械|特效)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "总作画监督": /(?<=(総|总)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "动作作画监督": /(?<=(アクション|动作)(作監|作画監督|設計|设计|ディレクター|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "机械作画监督": /(?<=(メカ|メカニック|机械)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "特效作画监督": /(?<=(エフェクト|特效|特技)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "原画": /(?<=(原画|作画)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "作画监督助理": /(?<=[\u3040-\u9fa5]*?(?<!総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "演出助理": /(?<=(演出|(?<!作画)監督)(補佐|补佐|协力|協力|辅佐|辅助|助理|助手)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "剪辑": /(?<=(剪辑|編集)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "CG 导演": /(?<=(3DCGディレクター|CGディレクター|3DCG导演|CG导演)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "美术监督": /(?<=(美術|美术|美術監督|美术监督)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "背景美术": /(?<=(背景)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|･|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "制作进行": /(?<=(制作进行|制作進行)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "设定制作": /(?<=(设定制作|設定制作)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "制作管理": /(?<=(制作デスク|制作管理|制作主任)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "制作协力": /(?<=[\u3040-\u9fa5]*?(制作協力|制作协力|協力プロダクション)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "总作画监督助理": /(?<=(総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "色彩演出": /(?<=(カラースクリプト)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "氛围稿": /(?<=(イメージボード)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
    };
    const regexes_role_per = {
        "脚本": /[\u3040-\u9fa5]*?(脚本|シナリオ|剧本|编剧|プロット|大纲)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "分镜": /[\u3040-\u9fa5]*?(分镜|コンテ)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "演出": /[\u3040-\u9fa5]*?(演出)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "构图": /[\u3040-\u9fa5]*?(レイアウト|构图|layout|レイアウター)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "作画监督": /[\u3040-\u9fa5]*?(?<!総|总|アクション|メカ|ニック|エフェクト|动作|机械|特效)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "总作画监督": /(総|总)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|=|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "动作作画监督": /(アクション|动作)(作監|作画監督|設計|设计|ディレクター|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|=|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "机械作画监督": /(メカ|メカニック|机械)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "特效作画监督": /(エフェクト|特效|特技)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|･|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "原画": /(原画|作画)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "作画监督助理": /[\u3040-\u9fa5]*?(?<!総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|協力|协力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "演出助理": /(演出|(?<!作画)監督)(補佐|补佐|協力|协力|辅佐|辅助|助理|助手)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "剪辑": /(剪辑|編集)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "CG 导演": /(3DCGディレクター|CGディレクター|3DCG导演|CG导演)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "美术监督": /(美術|美术|美術監督|美术监督)\s*?(?:\uff1a|\u003A|】|\/|／|·|=|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "背景美术": /(背景)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|、|･|＆|\u0026|•|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "制作进行": /(制作进行|制作進行)\s*?(?:\uff1a|\u003A|】|\/|／|·|=|、|・|･|、|＆|\u0026|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "制作管理": /(制作デスク|制作管理|制作主任)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "设定制作": /(设定制作|設定制作)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "制作协力": /[\u3040-\u9fa5]*?(制作協力|制作协力|協力プロダクション)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "总作画监督助理": /(総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "色彩演出": /(カラースクリプト)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
        "氛围稿": /(イメージボード)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))(\W|\w)+?(?=\n|$)/g,
    };
    const regexes_role = {
        "脚本": /[\u3040-\u9fa5]*?(脚本|シナリオ|剧本|编剧|プロット|大纲)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "分镜": /[\u3040-\u9fa5]*?(分镜|コンテ)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "演出": /[\u3040-\u9fa5]*?(演出)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "构图": /[\u3040-\u9fa5]*?(レイアウト|构图|layout|レイアウター)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "作画监督":  /[\u3040-\u9fa5]*?(?<!総|总|アクション|メカ|ニック|エフェクト|动作|机械|特效)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "总作画监督": /(総|总)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "动作作画监督": /(アクション|动作)(作監|作画監督|設計|设计|ディレクター|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|=|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "机械作画监督": /(メカ|メカニック|机械)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "特效作画监督": /(エフェクト|特效|特技)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "原画": /(原画|作画)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "作画监督助理":  /[\u3040-\u9fa5]*?(?<!総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "演出助理": /(演出|(?<!作画)監督)(補佐|补佐|协力|辅佐|辅助|協力|助理|助手)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "剪辑": /(剪辑|編集)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|＆|=|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "CG 导演":/(3DCGディレクター|CGディレクター|3DCG导演|CG导演)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "美术监督":/(美術|美术|美術監督|美术监督)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "背景美术":/(背景)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|･|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "制作进行":/(制作进行|制作進行)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "制作管理":/(制作デスク|制作管理|制作主任)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "设定制作": /(设定制作|設定制作)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "制作协力": /[\u3040-\u9fa5]*?(制作協力|制作协力|協力プロダクション)\s*?(?:\uff1a|\u003A|】|\/|／|·|=|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
            //以下为bangumi没有的职位
        "总作画监督助理":  /(総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "色彩演出": /(カラースクリプト)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
        "氛围稿": /(イメージボード)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：))/g,
    };
    const regex_sym = /[\uff1a\u003A【】\/／、、＆\u0026♦◆■=]/g;

    const staffSet = new Set(), repeatSet = new Set();
    const bgmIdMap = {
        "KADOKAWA": 19306,
        "斉藤壮馬": 14604,
        "週刊ビッグコミックスピリッツ": 7620,
        "あきやまえんま": 30863
    };
    const failedRequests = new Map();
    const RETRY_INTERVAL = 500;
    const MAX_RETRIES = 2;
    // #endregion

    if (location.pathname.match(/^\/ep\/\d+$/)) {
        const subjectId = document.querySelector('.nameSingle a').href.split('/').pop();
        const epLabel = parseEpLabel(document.title);
        const epDesc = document.querySelector('.epDesc')?.textContent;
        if (!epDesc) return;

        const [sfaffInfo] = extractStaffInfo({ [epLabel]: epDesc });
        const staffJSON = JSON.stringify(sfaffInfo);
        if (staffJSON === '{}') return;

        document.querySelector('.title').insertAdjacentHTML(
            'beforeend',
            `<small><a class="l staff-link" href="/subject/${subjectId}/add_related/person?staffs=${encodeURIComponent(staffJSON)}">[关联制作人员参与]</a></small>`
        );

    } if (location.pathname.match(/^\/person\/new$/)) {
        const params = new URLSearchParams(location.search);
        if (!params.has('name')) return;
        const name = params.get('name');
        document.querySelector('#crt_name').value = name;
    } else if (location.pathname.match(/^\/subject\/\d+\/add_related\/person$/)) {
        const subjectId = location.pathname.split('/')[2];
        const btn = document.createElement('button');
        btn.textContent = '获取章节简介填写参与';
        btn.id = 'epDescStaff';
        btn.style = 'margin:5px;float:right';
        btn.addEventListener('click', async () => {
            try {
                btn.disabled = true;
                btn.textContent = '获取章节中……';
                const eps = await getEps(subjectId);
                if (!eps.length) throw new Error('未获取到章节数据');
                const epData = {}, epDescs = {};
                for (const ep of eps) {
                    const epTypes = ['', 'SP', 'OP', 'ED'];
                    const epLabel = `${epTypes[ep.type]}${ep.sort}`;

                    epData[epLabel] = ep;
                    epDescs[epLabel] = ep.desc;
                }
                epsCache = epData;

                btn.textContent = '解析参与中……';
                const [staffInfo, noStaffEps] = extractStaffInfo(epDescs);

                if (Object.keys(staffInfo).length || noStaffEps.length) {
                    await updAppearEps(staffInfo, subjectId, noStaffEps);
                } else {
                    throw new Error('未解析到任何集数的人员信息');
                }

                btn.textContent = '解析完成！';
            } catch (e) {
                btn.textContent = `获取失败：${e.message}，点击重试`;
                btn.disabled = false;
            }
        });
        document.querySelector('#indexCatBox').after(btn);

        const params = new URLSearchParams(location.search);
        if (params.has('staffs')) {
            try {
                const staffInfo = JSON.parse(params.get('staffs'));
                const subjectId = location.pathname.split('/')[2];

                btn.disabled = true;
                btn.textContent = '解析参与中……';
                await updAppearEps(staffInfo, subjectId, []);
                btn.textContent = '解析完成！点击获取全部章节';
                btn.disabled = false;
            } catch (e) {
                console.error(`参数解析错误：${e.message}`);
            }
        }

        const style = document.createElement('style');
        style.textContent = `
            #crtRelateSubjects li:target {
                background-color: rgba(165, 255, 165, 0.4) !important;
                scroll-margin-block-start: 60px;
            }

            /* 提示框容器样式 */
            .staff-tip-box {
                position: fixed;
                width: min(380px, 100vw);
                backdrop-filter: blur(10px);
                background: rgba(254, 254, 254, .8);
                color: #000;
                border-radius: 15px;
                background-clip: padding-box;
                border: 1px solid rgba(255, 255, 255, .3);
                box-shadow: 0 5px 30px 10px rgba(80, 80, 80, .5);
                z-index: 9999;
                overflow: hidden;
            }

            /* 警告提示样式 */
            .staff-warning-section {
                padding: 10px 12px;
                margin: 0 0 16px;
                background: rgba(255, 248, 225, 0.6);
                border: 1px solid rgba(255, 153, 0, 0.3);
                border-radius: 8px;
                color: #856404;
            }
            .staff-warning-title {
                font-size: 14px;
                font-weight: 500;
            }

            /* 提示框拖动手柄 */
            .staff-tip-handle {
                height: 36px;
                line-height: 36px;
                padding: 0 16px;
                background: rgba(255, 255, 255, .2);
                border-bottom: 1px solid rgba(255, 255, 255, .1);
                border-top-left-radius: 15px;
                border-top-right-radius: 15px;
                font-size: 14px;
                font-weight: 500;
                color: inherit;
                cursor: move;
                user-select: none;
            }

            /* 提示框内容容器 */
            .staff-tip-content {
                padding: 12px 16px;
                max-height: 400px;
                overflow-y: auto;
                font-size: 13px;
            }

            /* 提示框标题 */
            .staff-tip-title {
                margin: 0 0 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(255, 255, 255, .2);
                font-size: 14px;
                color: inherit;
            }
            .staff-tip-title.new { color: #0a6e1e; }
            .staff-tip-title.existing { color: #0d5b68; }
            .staff-tip-title.unmatched { color: #a0222e; }

            /* 记录列表容器 */
            .staff-record-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 16px;
            }

            /* 统一记录项基础样式 */
            .staff-record-item {
                padding: 8px 12px;
                border-radius: 8px;
                backdrop-filter: blur(5px);
                color: inherit !important;
                text-decoration: none;
                transition: background 0.2s ease;
                word-break: break-word;
                position: relative;
            }

            /* 新增参与项 */
            .staff-record-item.new {
                background: rgba(240, 255, 244, .6);
                border: 1px solid rgba(40, 167, 69, .2);
            }
            .staff-record-item.new:hover {
                background: rgba(230, 255, 233, .8);
            }

            /* 已有参与项 */
            .staff-record-item.existing {
                background: rgba(240, 248, 255, .6);
                border: 1px solid rgba(23, 162, 184, .2);
            }
            .staff-record-item.existing:hover {
                background: rgba(230, 242, 255, .8);
            }

            /* 未匹配记录项 */
            .staff-record-item.unmatched {
                padding: 8px 12px;
                border-radius: 8px;
                backdrop-filter: blur(5px);
                background: rgba(255, 248, 248, .6);
                color: #a0222e;
                border: 1px solid rgba(220, 53, 69, .2);
                transition: background 0.2s ease;
            }
            .staff-record-item.unmatched:hover {
                background: rgba(255, 235, 235, .8);
            }

            /* 记录项名称强调 */
            .staff-person-name {
                font-weight: 500;
                color: inherit;
            }

            .staff-tip-content > details > details {
                margin-left: 1.5em;
            }

            /* 夜间模式适配 */
            html[data-theme="dark"] .staff-tip-box {
                background: rgba(40, 40, 40, .8);
                color: #fff;
                box-shadow: 0 5px 30px 10px rgba(0, 0, 0, .2);
            }
            html[data-theme="dark"] .staff-warning-section {
                background: rgba(60, 40, 0, 0.4);
                border-color: rgba(255, 153, 0, 0.5);
                color: #ffd700;
            }
            html[data-theme="dark"] .staff-tip-handle {
                background: rgba(0, 0, 0, .2);
                border-bottom-color: rgba(255, 255, 255, .05);
            }
            html[data-theme="dark"] .staff-tip-title {
                border-bottom-color: rgba(255, 255, 255, .05);
            }
            html[data-theme="dark"] .staff-tip-title.new { color: #51cf66; }
            html[data-theme="dark"] .staff-tip-title.existing { color: #4dd0e1; }
            html[data-theme="dark"] .staff-tip-title.unmatched { color: #e57373; }
            html[data-theme="dark"] .staff-record-item.new {
                background: rgba(25, 65, 35, 0.4);
                border-color: rgba(76, 175, 80, 0.4);
            }
            html[data-theme="dark"] .staff-record-item.new:hover {
                background: rgba(25, 65, 35, 0.6);
            }
            html[data-theme="dark"] .staff-record-item.existing {
                background: rgba(30, 45, 65, 0.4);
                border-color: rgba(33, 150, 243, 0.4);
            }
            html[data-theme="dark"] .staff-record-item.existing:hover {
                background: rgba(30, 45, 65, 0.6);
            }
            html[data-theme="dark"] .staff-record-item.unmatched {
                background: rgba(65, 30, 35, 0.4);
                border-color: rgba(244, 67, 54, 0.4);
            }
            html[data-theme="dark"] .staff-record-item.unmatched:hover {
                background: rgba(65, 30, 35, 0.6);
            }
        `;
        document.head.appendChild(style);
    }

    async function getEps(subjectId) {
        const response = await fetch(`https://api.bgm.tv/v0/episodes?subject_id=${subjectId}`);
        if (!response.ok) throw new Error(`API请求失败：HTTP ${response.status}`);
        const data = await response.json();
        return data.data || [];
    }

    function parseEpLabel(input) {
        if (!input) return '';
        const trimmed = input.trim();
        const match = trimmed.match(/^([a-zA-Z]+)\.(\d+(\.\d+)?)/);
        if (!match) return trimmed;

        const [, type, number] = match;
        return type.toLowerCase() === 'ep' ? number : `${type}${number}`;
    }

    function parseAppearEps(input) {
        if (!input) return [];

        const isNum = str => /^-?\d+(\.\d+)?$/.test(str) && !isNaN(parseFloat(str));

        const toStr = num => Number.isInteger(num) ? num.toString() : num.toFixed(1).replace(/\.0$/, '');

        return Array.from(
            new Set(
                input.split(',')
                    .map(seg => seg.trim())
                    .filter(seg => seg)
                    .flatMap(seg => {
                        if (seg.includes('-')) {
                            const [s, e] = seg.split('-').map(p => p.trim());
                            if (isNum(s) && isNum(e)) {
                                const [min, max] = [Math.min(s, e), Math.max(s, e)].map(Number);
                                const step = Number.isInteger(min) && Number.isInteger(max) ? 1 : 0.5;
                                return Array.from(
                                    { length: Math.ceil((max - min) / step) + 1 },
                                    (_, i) => toStr(min + i * step)
                                );
                            }
                        }
                        // 处理单个集数（数字标准化，非数字直接保留）
                        return isNum(seg) ? toStr(Number(seg)) : seg;
                    })
            )
        ).sort((a, b) => {
            // 排序：数字在前按数值排，非数字在后按字典序排
            const aNum = isNum(a) ? Number(a) : Infinity;
            const bNum = isNum(b) ? Number(b) : Infinity;
            return aNum !== bNum ? aNum - bNum : a.localeCompare(b);
        });
    }

    async function updAppearEps(staffInfo, subjectId, noStaffEps) {
        const groupedRecords = {
            new: {},         // 本次新增的参与记录
            existing: {},    // 已存在的参与记录
            unmatched: {}    // 未匹配记录
        };
        const oldLis = [...document.querySelectorAll('#crtRelateSubjects li')];

        const indicator = document.querySelector('#epDescStaff');
        const staffInfoEntries = Object.entries(staffInfo);
        const total = staffInfoEntries.length;
        let i = 0;
        for (const [originalName, roles] of staffInfoEntries) {
            i++;
            indicator.textContent = `解析参与中（${i}/${total}）……`;
            for (const [role, epLabels] of Object.entries(roles)) {
                const roleId = roleIdMap[role];
                if (!roleId) continue;

                let aliased = false;
                const sameRole = li => li.querySelector('select').value === roleId;
                const sameName = name => li => {
                    const liName = li.querySelector('.title a').textContent;
                    return liName === name;
                }
                const sameId = id => li => {
                    const liId = li.querySelector('.title a').href.split('/').pop();
                    return liId === id;
                }
                const matchOldLi = name => oldLis.find(li => sameName(name)(li) && sameRole(li));
                let matchedLi, name = originalName;

                async function* candidateNames() {
                    const yielded = new Set();
                    const yieldUnique = v => {
                        if (yielded.has(v)) return false;
                        yielded.add(v);
                        return true;
                    }

                    const nameNoBracket = originalName.replace(/\([^)]*\)|\{[^}]*\}|\[[^\]]*\]|（[^）]*）|［[^］]*］/g, '').trim();
                    const brackets = nameNoBracket !== name;
                    if (brackets) {
                        aliased = true;
                        if (yieldUnique(nameNoBracket)) yield nameNoBracket;
                    } else {
                        if (yieldUnique(originalName)) yield originalName;
                        aliased = true;
                    }

                    const _aliased = await window.personAliasQuery?.(nameNoBracket);
                    if (_aliased) {
                        const aliasedName = _aliased.name;
                        if (yieldUnique(aliasedName)) yield aliasedName;
                    }

                    for (const name of await getConvertedNames(nameNoBracket)) {
                        if (yieldUnique(name)) yield name;
                    }

                    if (!brackets) return;

                    aliased = false;
                    if (yieldUnique(originalName)) yield originalName;
                    aliased = true;

                    const __aliased = (await window.personAliasQuery?.(originalName));
                    if (__aliased) {
                        const aliasedName = __aliased.name;
                        if (yieldUnique(aliasedName)) yield aliasedName;
                    }

                    for (const name of await getConvertedNames(originalName)) {
                        if (yieldUnique(name)) yield name;
                    }
                }

                for await (const candidate of candidateNames()) {
                    matchedLi = matchOldLi(candidate);
                    if (!matchedLi) continue;
                    name = candidate;
                    break;
                }

                let matchedLis;
                if (!matchedLi) {
                    aliased = false;
                    for await (const candidate of candidateNames()) {
                        const searchResult = await autoSearchAndRelate(candidate, role);
                        if (!searchResult) continue;
                        const { ids, name: resultName } = searchResult;
                        const newLiList = [...document.querySelectorAll('#crtRelateSubjects li:not(.old)')];

                        if (ids.length === 1) {
                            matchedLi = newLiList.find(li => sameId(ids[0])(li) && sameRole(li));
                        } else {
                            matchedLis = newLiList.filter(li => ids.some(id => sameId(id)(li)) && sameRole(li));
                        }

                        name = resultName;
                        break;
                    }
                }
                const groupKey = `${name}-${role}`;
                const liId = `staff-${name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;

                if (matchedLi) {
                    handleMatched(matchedLi);
                } else {
                    matchedLis?.forEach(handleMatched);
                    groupedRecords.unmatched[groupKey] ||= { name: originalName, role, epLabels: new Set(epLabels) };
                }

                function handleMatched(matchedLi) {
                    matchedLi.id = liId;

                    const input = matchedLi.querySelector('[name$="[appear_eps]"]');
                    const existingSet = new Set(parseAppearEps(input.value));

                    for (const epLabel of epLabels) {
                        const wasExisting = existingSet.has(epLabel);
                        if (!wasExisting) {
                            input.value = [input.value.trim(), epLabel].filter(Boolean).join(',');
                            if (matchedLi.classList.contains('old')) {
                                matchedLi.style.background = 'rgba(255, 248, 165, 0.2)';
                            }
                        }

                        const targetGroup = wasExisting ? 'existing' : 'new';
                        groupedRecords[targetGroup][groupKey] ||= {
                            name,
                            role,
                            epLabels: new Set(),
                            aliases: {},
                            liId
                        };
                        const record = groupedRecords[targetGroup][groupKey];
                        record.epLabels.add(epLabel);
                        if (aliased) {
                            record.aliases[originalName] ||= [];
                            record.aliases[originalName].push(epLabel);
                        }
                    }
                }
            }
        }

        createDraggableTipBox(
            formatRecords(groupedRecords.new),
            formatRecords(groupedRecords.existing),
            formatRecords(groupedRecords.unmatched),
            subjectId,
            noStaffEps
        );

        const editSummaryInput = document.querySelector('#editSummary');
        const epLabelsStr = staffInfoEntries.length === 1 ? staffInfoEntries[0][0] : '';
        editSummaryInput.value = `根据${epLabelsStr}章节简介填写参与`;
    }

    // 格式化记录（排序集数）
    function formatRecords(records) {
        return Object.values(records).map(item => ({
        ...item,
        epLabels: Array.from(item.epLabels).sort((a, b) => {
            const typeOrder = { '': 0, 'SP': 1, 'OP': 2, 'ED': 3 };
            const aType = a.match(/^(SP|OP|ED)/)?.[0] || '';
            const bType = b.match(/^(SP|OP|ED)/)?.[0] || '';
            if (aType !== bType) return typeOrder[aType] - typeOrder[bType];
            const aNum = parseFloat(a.replace(/[A-Za-z]/g, '')) || 0;
            const bNum = parseFloat(b.replace(/[A-Za-z]/g, '')) || 0;
            return aNum - bNum;
        })}));
    }

    function createDraggableTipBox(newRecords, existingRecords, unMatchedRecords, subjectId, noStaffEps) {
        document.querySelector('.staff-tip-box')?.remove();

        const tipBox = document.createElement('div');
        tipBox.className = 'staff-tip-box';

        const dragHandle = document.createElement('div');
        dragHandle.className = 'staff-tip-handle';
        dragHandle.textContent = '制作人员参与填写结果';
        const contentBox = document.createElement('div');
        contentBox.className = 'staff-tip-content';
        tipBox.append(dragHandle, contentBox);

        contentBox.innerHTML = `
    ${noStaffEps?.length ? `<div class="staff-warning-section">
        <div class="staff-warning-title">以下${noStaffEps.length}个集数未匹配到任何制作人员信息：</div>
        ${noStaffEps.map(ep => `<span title="${escapeAttr(epsCache?.[ep]?.desc || '')}"><a class="l" href="/ep/${epsCache?.[ep]?.id}" target="_blank">${ep}</a></span>`).join(',')}
        </div>` : ''}
    ${repeatSet.size ? `<div class="staff-warning-section">
        <div class="staff-warning-title">以下${repeatSet.size}个新关联的同名制作人员需要检查：</div>
        ${[...repeatSet].map(repeat => `<a class="l" href="#staff-${repeat}">${repeat.replace(/-(.+)$/, '（$1）')}</a>`).join('、')}
        </div>` : ''}
    ${recordSection(newRecords, '新增参与（点击跳转）', 'new')}
    ${recordSection(existingRecords, '已有参与（点击跳转）', 'existing')}
    ${recordSection(unMatchedRecords, '未匹配', 'unmatched')}
    ${ (() => {
        if (!epsCache) return '';
        const epCacheEntries = Object.entries(epsCache);
        return `<details><summary>各集详情</summary>${epCacheEntries.map(([epLabel, { desc }]) => `
            <details><summary>${epLabel}</summary>${desc}</details>`
        ).join('')}</details>`;
    })() }
    `;

        function recordSection(records, text, className) {
            if (!records.length) return '';
            const itemTag = className === 'unmatched' ? 'div' : 'a';
            return `
        <div class="staff-record-list">
            <h4 class="staff-tip-title ${className}">${text}</h4>
            ${records.map(({ name, role, epLabels, aliases, liId }) => `
                <${ itemTag } class="staff-record-item ${className}" ${liId ? `href="#${escapeAttr(liId)}"` : ''}>
                    <span class="staff-person-name">${name}</span>
                    ${ (() => {
                        if (!aliases) return '';
                        const aliasesEntries = Object.entries(aliases);
                        return aliasesEntries.length ? `[${aliasesEntries.map(([alias, eps]) => {
                            return `<span title="${eps.join(',')}">${alias}</span>`;
                        }).join('、')}]` : '';
                    })() }
                    （${role}）-
                    ${epLabels.map(ep => `<span title="${escapeAttr(epsCache?.[ep]?.desc || '')}">${ep}</span>`).join(',')}
                    ${ className === 'unmatched' ? `→ <a class="l" href="/person/new?name=${escapeAttr(name)}" target="blank">创建</a>` : ''}
                </${ itemTag }>`).join('')}
        </div>`;
        }

        let isDragging = false;
        let startX, startY, offsetX, offsetY;

        const boxWidth = tipBox.offsetWidth;
        const boxHeight = tipBox.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let targetRight = 50;
        let targetBottom = 50;

        const maxRight = windowWidth - boxWidth;
        targetRight = Math.min(targetRight, maxRight);
        targetRight = Math.max(targetRight, 0);

        const maxBottom = windowHeight - boxHeight;
        targetBottom = Math.min(targetBottom, maxBottom);
        targetBottom = Math.max(targetBottom, 0);

        tipBox.style.bottom = `${targetBottom}px`;
        tipBox.style.right = `${targetRight}px`;

        function handleMove(clientX, clientY) {
            const moveX = clientX - startX;
            const moveY = clientY - startY;
            const newX = offsetX + moveX;
            const newY = offsetY + moveY;

            tipBox.style.left = `${newX}px`;
            tipBox.style.top = `${newY}px`;
            tipBox.style.right = 'auto';
            tipBox.style.bottom = 'auto';
        }

        // 鼠标事件
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            offsetX = tipBox.offsetLeft;
            offsetY = tipBox.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            handleMove(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) isDragging = false;
        });

        // 触摸屏事件
        dragHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            offsetX = tipBox.offsetLeft;
            offsetY = tipBox.offsetTop;
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (isDragging) isDragging = false;
        });

        document.body.appendChild(tipBox);
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    async function getConvertedNames(str) {
        if (!loading && !Object.keys(converters).length) {
            loading = new Promise(resolve => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js';
                script.onload = () => {
                    regions.forEach(from => regions.forEach(to => {
                        if (from !== to) converters[`${from}-${to}`] = OpenCC.Converter({ from, to });
                    }));
                    resolve();
                };
                document.head.appendChild(script);
            });
        }
        await loading;

        const converted = new Set();
        regions.forEach(from => regions.forEach(to => {
            if (from !== to) converted.add(converters[`${from}-${to}`](str));
        }));
        return Array.from(converted);
    }

    // #region https://bgm.tv/dev/app/3265 MIT modified
    /**
     * 从动画章节简介中提取制作人员信息
     * @param {Object.<string, string>} epDescs - 章节数据，键为集数名，值为简介文本
     * @returns {Array} 提取结果数组
     * @returns {Object.<string, Object.<string, string[]>>} 0 - 制作人员信息，结构为 {人物: {职位: [集数]}}
     * @returns {string[]} 1 - 未匹配到任何人员的集数名数组
     */
    function extractStaffInfo(epDescs) {
        const result = {};
        const noStaffEps = [];

        for (const [epLabel, desc] of Object.entries(epDescs)) {
            let processedDesc = desc.replaceAll("\r", "").replaceAll(regex_sym, "、");

            // 按正则表达式位置排序，确保先匹配长的职位名称
            const regexes = Object.entries(regexes_per).sort((a, b) => {
                const posA = processedDesc.search(a[1]);
                const posB = processedDesc.search(b[1]);
                return posA < 0 ? 1 : posB < 0 ? -1 : posA - posB;
            });

            const episodeStaff = {};
            regexes.forEach(([role, regex]) => {
                const matches = processedDesc.match(regex);

                // 清理之前已匹配的人员名称中的职位前缀
                for (const existingRole in episodeStaff) {
                    episodeStaff[existingRole] = episodeStaff[existingRole].map(name => {
                        const replaced = trimCommas(name.replaceAll(regexes_role_per[role], ""));
                        if (replaced[0] !== name[0]) {
                            return trimCommas(name.replaceAll(regexes_role[role], ""));
                        } else {
                            return replaced;
                        }
                    });
                }

                episodeStaff[role] = [];
                if (matches) {
                    episodeStaff[role] = matches.map(name => trimCommas(name));
                }
            });

            regexes.forEach(([role]) => {
                for (const existingRole in episodeStaff) {
                    episodeStaff[existingRole] = episodeStaff[existingRole].map(name => {
                        const replaced = trimCommas(name.replaceAll(regexes_role_per[role], ""));
                        if (replaced[0] !== name[0]) {
                            return trimCommas(name.replaceAll(regexes_role[role], ""));
                        } else {
                            return replaced;
                        }
                    });
                }
            });

            for (const role in episodeStaff) {
                const seenNames = new Set();

                const newStaffList = [];
                for (const name of episodeStaff[role]) {
                    if (name.includes('、')) {
                        const names = name.split('、').map(singleName => trimCommas(singleName));
                        names.forEach(singleName => {
                            if (singleName && singleName !== ' ') {
                                newStaffList.push(singleName);
                            }
                        });
                    } else {
                        newStaffList.push(name);
                    }
                }

                episodeStaff[role] = newStaffList;

                episodeStaff[role] = episodeStaff[role].filter(name => {
                    if (seenNames.has(name) || !name || name === ' ') {
                        return false;
                    }
                    seenNames.add(name);
                    return true;
                });
            }

            let hasStaff = false;
            for (const [role, staffList] of Object.entries(episodeStaff)) {
                for (const name of staffList) {
                    // eslint-disable-next-line no-irregular-whitespace
                    const staffName = name.replace(/([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{1,3})[ 　]([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{1,3})/g, '$1$2');
                    result[staffName] ||= {};
                    result[staffName][role] ||= [];
                    if (!result[staffName][role].includes(epLabel)) {
                        result[staffName][role].push(epLabel);
                        hasStaff = true;
                    }
                }
            }

            if (!hasStaff) noStaffEps.push(epLabel);
        }

        // 返回结果和没有匹配到人员的集数数组
        return [ result, noStaffEps ];
    }

    // 辅助函数
    function trimCommas(x) {
        if (typeof x === 'string') {
            x = x.trim();
            while (x.startsWith("、")) {
                x = x.replace("、", "").trimStart();
            }
            while (x.endsWith("、")) {
                x = x.split("").reverse().join("").replace("、", "").trimStart().split("").reverse().join("");
            }
        }
        return x;
    }
    // #endregion

    // #region https://bgm.tv/dev/app/2827 MIT modified
    /**
     * 自动搜索人物并关联到条目
     * @param {string} name - 要搜索的人物名称
     * @param {number} job - 职位ID
     */
    async function autoSearchAndRelate(name, role) {
        try {
            const bgmIdMap = getLastestMap();
            const searchResult = await searchPerson(name);
            let ids = new Set();
            let displayName;

            if (searchResult && Object.keys(searchResult).length > 0) {
                for (let id in searchResult) {
                    const resultName = searchResult[id].name;
                    if (name.toLowerCase() === resultName.toLowerCase() || bgmIdMap[name] == id
                    || (await window.personAliasQuery?.(name))?.id === id) {
                        await addPersonToRelate(role, resultName, id, searchResult[id]);
                        ids.add(id);
                        displayName ||= resultName;
                    }
                }
            }

            if (!displayName) return;
            return { ids: [...ids], name: displayName };
        } catch (error) {
            console.error('autoSearchAndRelate failed:', error);
        }
    }

    function getLastestMap() {
        let json = localStorage.getItem('localPrsnMap');
        let mergedMap = {...bgmIdMap};

        try {
            if (json) {
                let obj = JSON.parse(json);
                mergedMap = {...mergedMap, ...obj};
            }
        } catch (e) {
            console.warn('Failed to parse localPrsnMap:', e);
        }

        return mergedMap;
    }

    function searchPerson(query) {
        return new Promise(resolve => {
            const q = trans(query);
            const key = q;

            const execute = () => {
                $.ajax({
                    type: "GET",
                    url: `/json/search-person/${encodeURIComponent(q)}`,
                    dataType: 'json',
                    success: res => {
                        failedRequests.delete(key);
                        resolve(res || {});
                    },
                    error: (xhr, status, error) => {
                        console.error('请求错误:', error, '查询:', query);
                        const retries = (failedRequests.get(key) || 0) + 1;

                        if (retries > MAX_RETRIES) {
                            failedRequests.delete(key);
                            resolve(null);
                            return;
                        }

                        failedRequests.set(key, retries);
                        console.log(`"${query}" 将于 ${RETRY_INTERVAL}ms 后重试(${retries}/${MAX_RETRIES})`);
                        setTimeout(execute, RETRY_INTERVAL);
                    }
                });
            };

            execute();
        });
    }

    function trans(staff) {
        let id = bgmIdMap[staff];
        return id ? ('bgm_id=' + id) : staff;
    }

    async function addPersonToRelate(role, name, personId, personData) {
        const roleId = roleIdMap[role];
        if (!staffSet.has(roleId + '/' + personId)) {
            staffSet.add(roleId + '/' + personId);
            staffSet.has(roleId + name) ? repeatSet.add(name + '-' + role) : staffSet.add(roleId + name);

            subjectList[personId] = personData;
            addRelateSubject(personId, 'searchResult');
            $('#crtRelateSubjects select').eq(0).val(roleId);
            addSbjListener();
            colorSbjList();
            return true;
        }
        return false;
    }

    function colorSbjList(item) {
        let map = new Map();
        $('#crtRelateSubjects .clearit').each(function(idx) {
            let job = $(this).find('select').val();
            let staff = $(this).find('.l').text();
            let key = job + staff;
            map.get(key) instanceof Array ? map.get(key).push(idx) : map.set(key, [idx]);

            if (!item) {
                let arr = map.get(key);
                let len = arr.length;
                if (len == 2) {
                    colorItem(arr[0], true);
                    colorItem(arr[1], true);
                } else if (len > 2) {
                    colorItem(arr[len - 1], true);
                }
            }
        });
        if (item && map.get(item).length == 2) {
            colorItem(map.get(item)[0]);
            colorItem(map.get(item)[1]);
            repeatSet.delete(item);
        }
    }

    function colorItem(idx, flag) {
        $('#crtRelateSubjects .clearit').eq(idx).css('background-color', flag ? '#eef4c9' : '');
    }

    function addSbjListener() {
        $('#crtRelateSubjects .rr').off('click').on('click', function() {
            let li = $(this).parents('li.clearit');
            let job = li.find('option:checked').text().split(' /')[0];
            let staff = li.find('.l').text();
            let item = staff + '-' + job;
            colorSbjList(item);
            li.remove();
        });
    }
    // #endregion

})();
