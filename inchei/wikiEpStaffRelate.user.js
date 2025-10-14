// ==UserScript==
// @name         根据章节简介关联制作人员参与
// @namespace    wiki.ep.staff.replate
// @version      0.1.0
// @description  根据章节简介关联制作人员参与，无集数标签，逗号分隔显示
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/ep/*
// @match        http*://bgm.tv/subject/*/add_related/person*
// @match        http*://chii.in/ep/*
// @match        http*://chii.in/subject/*/add_related/person*
// @match        http*://bangumi.tv/ep/*
// @match        http*://bangumi.tv/*/add_related/person*
// @grant        none
// @license      MIT
// ==/UserScript==

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

// 缓存章节数据（key: subjectId, value: {epLabel: 章节详情}）
const epsCache = {};

(async function () {
    'use strict';

    const regions = ['cn', 'tw', 'hk', 'jp'];
    let converters = {}, loading;
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

    if (location.pathname.match(/^\/ep\/\d+$/)) {
        const subjectId = document.querySelector('.nameSingle a').href.split('/').pop();
        const epLabel = parseEpLabel(document.title);
        const epDesc = document.querySelector('.epDesc')?.textContent;
        if (!epDesc) return;

        const personRoleMap = parsePersonRoleMap(epDesc);
        const personRoleJson = JSON.stringify(personRoleMap);
        if (personRoleJson === '{}') return;

        document.querySelector('.title').insertAdjacentHTML(
            'beforeend',
            `<small><a class="l staff-link" href="/subject/${subjectId}/add_related/person?epLabel=${encodeURIComponent(epLabel)}&personRoles=${encodeURIComponent(personRoleJson)}">[关联制作人员参与]</a></small>`
        );

    } else if (location.pathname.match(/^\/subject\/\d+\/add_related\/person$/)) {
        const subjectId = location.pathname.split('/')[2];
        const btn = document.createElement('button');
        btn.textContent = '获取章节简介填写参与';
        btn.style = 'margin:5px;float:right';
        btn.addEventListener('click', async () => {
            try {
                btn.disabled = true;
                btn.textContent = '获取章节中……';
                const eps = await getEps(subjectId);
                if (!eps.length) throw new Error('未获取到章节数据');
                epsCache[subjectId] = eps.reduce((cache, ep) => {
                    const epTypes = ['', 'SP', 'OP', 'ED'];
                    const epLabel = `${epTypes[ep.type]}${ep.sort}`;
                    cache[epLabel] = ep;
                    return cache;
                }, {});

                btn.textContent = '解析参与中……';
                const epLabelRoleMap = {};
                const allEpsWithDesc = [];
                const epsWithNoMatches = [];

                for (const ep of eps) {
                    const { desc, sort, type } = ep;
                    if (!desc) continue;

                    const epTypes = ['', 'SP', 'OP', 'ED'];
                    const epLabel = `${epTypes[type]}${sort}`;
                    allEpsWithDesc.push(epLabel);

                    const personRoleMap = parsePersonRoleMap(desc);
                    if (Object.keys(personRoleMap).length) {
                        epLabelRoleMap[epLabel] = personRoleMap;
                    } else {
                        epsWithNoMatches.push(epLabel);
                    }
                }

                if (Object.keys(epLabelRoleMap).length || epsWithNoMatches.length) {
                    updAppearEps(epLabelRoleMap, subjectId, epsWithNoMatches);
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
        if (params.has('epLabel') && params.has('personRoles')) {
            try {
                const epLabel = params.get('epLabel');
                const personRoleMap = JSON.parse(params.get('personRoles'));
                const subjectId = location.pathname.split('/')[2];

                updAppearEps({ [epLabel]: personRoleMap }, subjectId, []);
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
                top: 50px;
                right: 50px;
                width: 380px;
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

        // 解析、去重、排序主逻辑
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

    async function updAppearEps(epLabelRoleMap, subjectId, epsWithNoMatches) {
        const groupedRecords = {
            new: {},         // 本次新增的参与记录
            existing: {},    // 已存在的参与记录
            unmatched: {}    // 未匹配记录
        };
        const crtLiList = [...document.querySelectorAll('#crtRelateSubjects li')];

        const epLabelRoleMapEntries = Object.entries(epLabelRoleMap);
        for (const [epLabel, personRoleMap] of epLabelRoleMapEntries) {
            for (const [originalName, roles] of Object.entries(personRoleMap)) {
                for (const role of roles) {
                    const matchLi = name => crtLiList.find(li => {
                        const displayName = li.querySelector('.title a').textContent;
                        const selectedRole = li.querySelector('[name$="[prsnPos]"] option[selected]')?.textContent.split(' /')[0] || '';
                        return displayName === name && selectedRole === role;
                    });
                    let matchedLi, name = originalName;

                    async function* candidateNames() {
                        yield originalName;
                        const nameWithoutBrackets = originalName.replace(/\([^)]*\)|\{[^}]*\}|\[[^\]]*\]|（[^）]*）|［[^］]*］/g, '').trim();
                        yield nameWithoutBrackets;

                        const _alias = await window.personAliasQuery?.(originalName);
                        if (_alias) yield _alias;

                        const __alias = await window.personAliasQuery?.(nameWithoutBrackets);
                        if (__alias) yield __alias;

                        for (const name of await getConvertedNames(nameWithoutBrackets)) yield name;
                        for (const name of await getConvertedNames(originalName)) yield name;
                    }

                    for await (const candidate of candidateNames()) {
                        matchedLi = matchLi(candidate);
                        if (!matchedLi) continue;
                        name = candidate;
                        break;
                    }
                    const groupKey = `${name}-${role}`;

                    if (matchedLi) {
                        const liId = `staff-${name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;
                        matchedLi.id = liId;

                        const input = matchedLi.querySelector('[name$="[appear_eps]"]');
                        const existingSet = new Set(parseAppearEps(input.value));
                        const wasExisting = existingSet.has(epLabel);

                        // 仅添加不存在的集数
                        if (!wasExisting) {
                            input.value = [input.value.trim(), epLabel].filter(Boolean).join(',');
                            matchedLi.style.background = 'rgba(255, 248, 165, 0.2)';
                        }

                        // 区分新增和已有记录
                        const targetGroup = wasExisting ? 'existing' : 'new';
                        groupedRecords[targetGroup][groupKey] ||= {
                            name,
                            role,
                            epLabels: new Set(),
                            liId
                        };
                        groupedRecords[targetGroup][groupKey].epLabels.add(epLabel);
                    } else {
                        groupedRecords.unmatched[groupKey] ||= { name: originalName, role, epLabels: new Set() };
                        groupedRecords.unmatched[groupKey].epLabels.add(epLabel);
                    }
                }
            }
        }

        // 格式化记录（排序集数）
        const formatRecords = (records) => Object.values(records).map(item => ({
            ...item,
            epLabels: Array.from(item.epLabels).sort((a, b) => {
                const typeOrder = { '': 0, 'SP': 1, 'OP': 2, 'ED': 3 };
                const aType = a.match(/^(SP|OP|ED)/)?.[0] || '';
                const bType = b.match(/^(SP|OP|ED)/)?.[0] || '';
                if (aType !== bType) return typeOrder[aType] - typeOrder[bType];
                const aNum = parseFloat(a.replace(/[A-Za-z]/g, '')) || 0;
                const bNum = parseFloat(b.replace(/[A-Za-z]/g, '')) || 0;
                return aNum - bNum;
            })
        }));

        createDraggableTipBox(
            formatRecords(groupedRecords.new),
            formatRecords(groupedRecords.existing),
            formatRecords(groupedRecords.unmatched),
            subjectId,
            epsWithNoMatches
        );

        const editSummaryInput = document.querySelector('#editSummary');
        const epLabelsStr = epLabelRoleMapEntries.length > 1 ? '' : epLabelRoleMapEntries[0][0];
        editSummaryInput.value = `根据${epLabelsStr}章节简介填写参与`;
    }

    function createDraggableTipBox(newRecords, existingRecords, unMatchedRecords, subjectId, epsWithNoMatches) {
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
    ${epsWithNoMatches?.length ? `<div class="staff-warning-section">
        <div class="staff-warning-title">以下${epsWithNoMatches.length}个集数未匹配到任何制作人员信息：</div>
        ${epsWithNoMatches.map(ep => `<span title="${escapeAttr(epsCache[subjectId]?.[ep]?.desc || '')}"><a class="l" href="/ep/${epsCache[subjectId]?.[ep]?.id}">${ep}</a></span>`).join(',')}
        </div>` : ''}
    ${recordSection(newRecords, '新增参与（点击跳转）', 'new')}
    ${recordSection(existingRecords, '已有参与（点击跳转）', 'existing')}
    ${recordSection(unMatchedRecords, '未匹配', 'unmatched')}
    `;

        function recordSection(records, text, className) {
            if (!records.length) return '';
            return `
        <div class="staff-record-list">
            <h4 class="staff-tip-title ${className}">${text}</h4>
            ${records.map(({ name, role, epLabels, liId }) => `
                <a class="staff-record-item ${className}" ${liId ? `href="#${escapeAttr(liId)}"` : ''}>
                    <span class="staff-person-name">${name}</span>（${role}）-
                    ${epLabels.map(ep => `<span title="${escapeAttr(epsCache[subjectId]?.[ep]?.desc || '')}">${ep}</span>`).join(',')}
                </a>`).join('')}
        </div>`;
        }

        let isDragging = false;
        let startX, startY, offsetX, offsetY;
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            offsetX = tipBox.offsetLeft;
            offsetY = tipBox.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const moveX = e.clientX - startX;
            const moveY = e.clientY - startY;
            tipBox.style.left = `${offsetX + moveX}px`;
            tipBox.style.top = `${offsetY + moveY}px`;
            tipBox.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) isDragging = false;
        });

        document.body.appendChild(tipBox);
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * 从文本提取人物-职位
     * @param {string} text - 单集简介文本
     * @returns {Object} 人物-职位映射表
     */
    function parsePersonRoleMap(text) {
        // 预处理文本
        const processedText = text.replaceAll("\r", "").replaceAll(/[\uff1a\u003A【】\/／、、＆\u0026♦◆■=]/g, "、");

        // 按职位顺序解析
        const regexes = Object.entries(regexes_per).sort((a, b) => {
            const posA = processedText.search(a[1]);
            const posB = processedText.search(b[1]);
            return posA < 0 ? 1 : posB < 0 ? -1 : posA - posB;
        });

        // 初始化结果对象 - 人物:职位数组
        const personRoleMap = {};

        // 第一轮解析：提取各职位对应的人物
        const rolePersonMap = {};
        regexes.forEach(([role, regex]) => {
            const matches = processedText.match(regex);
            // 清理之前职位中可能包含当前职位名称的部分
            for (const existingRole in rolePersonMap) {
                rolePersonMap[existingRole] = rolePersonMap[existingRole].map(person =>
                    trimCommas(person.replaceAll(regexes_role_per[role], ""))
                );
            }

            rolePersonMap[role] = matches ? matches.map(x => trimCommas(x)) : [];
        });

        // 第二轮解析：进一步清理职位名称残留
        regexes.forEach(([role, regex]) => {
            for (const existingRole in rolePersonMap) {
                rolePersonMap[existingRole] = rolePersonMap[existingRole].map(person =>
                    trimCommas(person.replaceAll(regexes_role_per[role], ""))
                );
            }
        });

        // 去重处理并构建人物:职位映射
        for (const [role, persons] of Object.entries(rolePersonMap)) {
            const uniquePersons = [...new Set(persons.filter(name => name.trim() !== ''))];

            uniquePersons.forEach(personGroup => {
                // 按顿号分割多个姓名
                const individualPersons = splitPersonGroup(personGroup);

                individualPersons.forEach(person => {
                    // 修正姓名中间的空格
                    const cleanPerson = removeSpacesFromName(person);

                    if (!personRoleMap[cleanPerson]) {
                        personRoleMap[cleanPerson] = [];
                    }
                    if (!personRoleMap[cleanPerson].includes(role)) {
                        personRoleMap[cleanPerson].push(role);
                    }
                });
            });
        }

        return personRoleMap;
    }

    // 辅助函数 - 分割姓名组（按顿号分隔）
    function splitPersonGroup(personGroup) {
        if (typeof personGroup !== 'string') return [personGroup];

        // 按顿号分割，但排除括号内的顿号
        const persons = [];
        let currentPerson = '';
        let inBrackets = false;

        for (let i = 0; i < personGroup.length; i++) {
            const char = personGroup[i];

            if (char === '（' || char === '(') {
                inBrackets = true;
                currentPerson += char;
            } else if (char === '）' || char === ')') {
                inBrackets = false;
                currentPerson += char;
            } else if (char === '、' && !inBrackets) {
                // 顿号且不在括号内，分割
                if (currentPerson.trim()) {
                    persons.push(currentPerson.trim());
                }
                currentPerson = '';
            } else {
                currentPerson += char;
            }
        }

        // 添加最后一个姓名
        if (currentPerson.trim()) {
            persons.push(currentPerson.trim());
        }

        return persons;
    }

    // 辅助函数 - 去除首尾顿号和空格
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

    // 辅助函数 - 移除姓名中间的空格
    function removeSpacesFromName(name) {
        if (typeof name !== 'string') return name;

        // 移除所有空格（半角和全角）
        let cleanName = name.replace(/[ 　]/g, '');

        // 如果移除空格后是2-5个字符的日文名，使用这个版本
        if (cleanName.length >= 2 && cleanName.length <= 5) {
            return cleanName;
        }

        return name;
    }
})();