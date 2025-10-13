// ==UserScript==
// @name         根据单集简介关联制作人员参与
// @namespace    wiki.ep.staff.replate
// @version      0.0.1
// @description  根据单集简介关联制作人员参与
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/ep/*
// @match        http*://bgm.tv/subject/*/add_related/person*
// @match        http*://chii.in/ep/*
// @match        http*://bangumi.tv/ep/*
// @grant        none
// @license      MIT
// ==/UserScript==

(async function () {
    'use strict';

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
            `<small><a class="l" href="/subject/${subjectId}/add_related/person?epLabel=${encodeURIComponent(epLabel)}&personRoles=${encodeURIComponent(personRoleJson)}">[关联制作人员参与]</a></small>`
        );

    } else if (location.pathname.match(/^\/subject\/\d+\/add_related\/person$/)) {
        const subjectId = location.pathname.split('/')[2];
        const btn = document.createElement('button');
        btn.textContent = '获取章节简介填写参与';
        btn.addEventListener('click', async () => {
            try {
                btn.disabled = true;
                btn.textContent = '获取章节中……';
                const eps = await getEps(subjectId);
                if (!eps.length) throw new Error('未获取到章节数据');
                
                btn.textContent = '解析参与中……';
                const epLabelRoleMap = {};
                for (const ep of eps) {
                    const { desc, sort, type } = ep;
                    if (!desc) continue;

                    const epTypes = ['', 'SP', 'OP', 'ED'];
                    const epLabel = `${epTypes[type]}${sort}`

                    const personRoleMap = parsePersonRoleMap(desc);
                    if (Object.keys(personRoleMap).length) {
                        epLabelRoleMap[epLabel] = personRoleMap;
                    }
                }

                if (Object.keys(epLabelRoleMap).length) {
                    updAppearEps(epLabelRoleMap);
                } else {
                    throw new Error('未解析到人员信息');
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
                updAppearEps({ [epLabel]: personRoleMap });
            } catch (e) {
                alert(`参数解析错误：${e.message}`);
            }
        }
    }
})();

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

    const allEps = input
        .split(',')
        .map(seg => seg.trim())
        .filter(seg => seg)
        .flatMap(seg => {
            if (seg.includes('-')) {
                const [s, e] = seg.split('-').map(p => p.trim()).filter(isNum);
                if (s && e) {
                    const [min, max] = [Math.min(s, e), Math.max(s, e)].map(parseFloat);
                    const step = Number.isInteger(min) && Number.isInteger(max) ? 1 : 0.5;
                    return Array.from({ length: Math.ceil((max - min) / step) + 1 }, (_, i) => {
                        const num = min + i * step;
                        return Number.isInteger(num) ? parseInt(num) : num;
                    });
                }
            }
            return isNum(seg) ? (Number.isInteger(parseFloat(seg)) ? parseInt(seg) : parseFloat(seg)) : seg;
        });

    return Array.from(new Set(allEps));
}

/**
 * 批量更新人员参与集数（优化：整合集数+固定唯一ID）
 * @param {Object} epLabelRoleMap - {epLabel:personRoleMap} 格式数据
 */
function updAppearEps(epLabelRoleMap) {
    const groupedRecords = {}; // key: "人物名-职位名", value: {name, role, epLabels: [], liId: ''}
    const unMatchedRecords = [];
    const crtLiList = document.querySelectorAll('#crtRelateSubjects li');

    Object.entries(epLabelRoleMap).forEach(([epLabel, personRoleMap]) => {
        Object.entries(personRoleMap).forEach(([name, roles]) => {
            roles.forEach(role => {
                const groupKey = `${name}-${role}`;
                const matchedLi = Array.from(crtLiList).find(li => {
                    const selectedRole = li.querySelector('[name$="[prsnPos]"] option[selected]').textContent.split(' /')[0];
                    return li.textContent.includes(name) && selectedRole === role;
                });

                if (matchedLi) {
                    const liId = `staff-${name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;
                    matchedLi.id = liId;

                    const input = matchedLi.querySelector('[name$="[appear_eps]"]');
                    const existingSet = new Set(parseAppearEps(input.value));
                    if (!existingSet.has(epLabel)) {
                        input.value = `${input.value},${epLabel}`;
                    }

                    if (!groupedRecords[groupKey]) {
                        groupedRecords[groupKey] = {
                            name,
                            role,
                            epLabels: new Set(),
                            liId
                        };
                    }
                    groupedRecords[groupKey].epLabels.add(epLabel);
                } else {
                    // 未匹配记录：无需分组，直接收集
                    unMatchedRecords.push({ name, role, epLabel });
                }
            });
        });
    });

    // 4. 转换分组数据格式（Set转排序数组，便于显示）
    const matchedRecords = Object.values(groupedRecords).map(record => ({
        ...record,
        epLabels: Array.from(record.epLabels).sort((a, b) => {
            // 集数排序：优先按类型（无前缀→SP→OP→ED），再按数字
            const typeOrder = { '': 0, 'SP': 1, 'OP': 2, 'ED': 3 };
            const aType = a.match(/^(SP|OP|ED)/)?.[0] || '';
            const bType = b.match(/^(SP|OP|ED)/)?.[0] || '';
            if (aType !== bType) return typeOrder[aType] - typeOrder[bType];
            // 提取数字部分排序（支持SP1、1.5等格式）
            const aNum = parseFloat(a.replace(/[A-Za-z]/g, '')) || 0;
            const bNum = parseFloat(b.replace(/[A-Za-z]/g, '')) || 0;
            return aNum - bNum;
        })
    }));

    // 调用提示框（传入整合后的记录）
    createDraggableTipBox(matchedRecords, unMatchedRecords);
}

/**
 * 创建提示框（优化：显示整合后的集数）
 * @param {Array} matchedRecords - 整合后的已匹配记录（含epLabels数组）
 * @param {Array} unMatchedRecords - 未匹配记录
 */
function createDraggableTipBox(matchedRecords, unMatchedRecords) {
    const oldTipBox = document.getElementById('staff-matching-tip');
    if (oldTipBox) oldTipBox.remove();

    let tipHtml = `<div style="padding:8px; max-height:300px; overflow-y:auto;">`;

    // 已匹配记录：显示整合后的集数（用逗号连接）
    if (matchedRecords.length) {
        tipHtml += `
            <div style="margin-bottom:8px;">
                <p style="margin:4px 0; font-size:13px; font-weight:bold;">已匹配（点击跳转至对应条目）：</p>
                <ul style="margin:0; padding-left:20px; font-size:12px;">
        `;
        matchedRecords.forEach(({ name, role, epLabels, liId }) => {
            tipHtml += `
                <li style="margin:2px 0;">
                    ${name}（${role}）- 集数：${epLabels.join('、')} 
                    <a href="#${liId}" style="margin-left:4px;">查看</a>
                </li>
            `;
        });
        tipHtml += `</ul></div>`;
    }

    // 未匹配记录：保持原样
    if (unMatchedRecords.length) {
        tipHtml += `
            <div>
                <p style="margin:4px 0; font-size:13px; font-weight:bold; color:#dc3545;">未找到匹配条目：</p>
                <ul style="margin:0; padding-left:20px; font-size:12px; color:#666;">
        `;
        unMatchedRecords.forEach(({ name, role, epLabel }) => {
            tipHtml += `<li style="margin:2px 0;">${name}（${role}）- 集数：${epLabel}</li>`;
        });
        tipHtml += `</ul></div>`;
    }

    if (!matchedRecords.length && !unMatchedRecords.length) {
        tipHtml += `<p style="margin:0; font-size:13px; color:#666;">未处理任何记录</p>`;
    }

    tipHtml += `</div>`;

    const tipBox = document.createElement('div');
    tipBox.id = 'staff-matching-tip';
    tipBox.style.cssText = `
        position:fixed; top:50px; right:50px; width:350px; background:#fff; 
        border:1px solid #ddd; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.1);
        z-index:9999;
    `;
    tipBox.innerHTML = tipHtml;

    // 拖动功能（保持不变）
    let isDragging = false;
    let startX, startY, offsetX, offsetY;
    const dragHandle = document.createElement('div');
    dragHandle.style.cssText = `
        height:24px; line-height:24px; padding:0 8px; background:#f5f5f5; 
        border-bottom:1px solid #ddd; border-radius:4px 4px 0 0;
        font-size:13px; cursor:move;
    `;
    dragHandle.textContent = '参与填写结果';
    tipBox.insertBefore(dragHandle, tipBox.firstChild);

    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        offsetX = tipBox.offsetLeft;
        offsetY = tipBox.offsetTop;
        tipBox.style.cursor = 'grabbing';
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
        if (isDragging) {
            isDragging = false;
            tipBox.style.cursor = 'move';
        }
    });

    tipBox.addEventListener('click', (e) => {
        if (e.target === tipBox) tipBox.remove();
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position:absolute; top:2px; right:4px; width:20px; height:20px; 
        line-height:20px; padding:0; border:none; background:transparent;
        color:#666; font-size:16px; cursor:pointer;
    `;
    closeBtn.addEventListener('click', () => tipBox.remove());
    dragHandle.appendChild(closeBtn);

    document.body.appendChild(tipBox);
}

/**
 * 从文本提取人物-职位（保留原始逻辑，确保解析正常）
 * @param {string} text - 单集简介文本
 * @returns {Object} 人物-职位映射表
 */
function parsePersonRoleMap(text) {
    const regexes_per = {
        "脚本": /(?<=[\u3040-\u9fa5]*?(脚本|シナリオ|剧本|编剧|プロット|大纲)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "分镜": /(?<=[\u3040-\u9fa5]*?(分镜|コンテ)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "演出": /(?<=[\u3040-\u9fa5]*?(演出)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "构图": /(?<=[\u3040-\u9fa5]*?(レイアウト|构图|layout|レイアウター)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "作画监督":  /(?<=[\u3040-\u9fa5]*?(?<!総|总|アクション|メカ|ニック|エフェクト|动作|机械|特效)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "总作画监督": /(?<=(総|总)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "动作作画监督": /(?<=(アクション|动作)(作監|作画監督|設計|设计|ディレクター|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "机械作画监督": /(?<=(メカ|メカニック|机械)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "特效作画监督": /(?<=(エフェクト|特效|特技)(作監|作画監督|作监|作画监督|作艦)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "原画": /(?<=(原画|作画)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|･|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "作画监督助理":  /(?<=[\u3040-\u9fa5]*?(?<!総|总)(作監|作画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "演出助理": /(?<=(演出|(?<!作画)監督)(補佐|补佐|协力|協力|辅佐|辅助|助理|助手)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "剪辑": /(?<=(剪辑|編集)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "CG 导演":/(?<=(3DCGディレクター|CGディレクター|3DCG导演|CG导演)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|=|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "美术监督":/(?<=(美術|美术|美術監督|美术监督)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "背景美术":/(?<=(背景)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|･|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "制作进行":/(?<=(制作进行|制作進行)\s*?(?:\uff1a|\u003A|】|\/|／|·|･|、|・|=|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "设定制作": /(?<=(设定制作|設定制作)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "制作管理":/(?<=(制作デスク|制作管理|制作主任)\s*?(?:\uff1a|\u003A|】|\/|／|=|·|･|、|・|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "制作协力": /(?<=[\u3040-\u9fa5]*?(制作協力|制作协力|協力プロダクション)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "总作画监督助理":  /(?<=(総|总)(作監|作画画監督|作监|作画监督|作艦)(補佐|补佐|协力|協力|辅佐|辅助|助理)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|=|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "色彩演出": /(?<=(カラースクリプト)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
        "氛围稿": /(?<=(イメージボード)\s*?(?:\uff1a|\u003A|】|\/|／|·|、|・|、|=|＆|\u0026|、|・|･|、|＆|\u0026|•|♦|◆|■|\s(?!:|：)))(\W|\w)+?(?=\n|$)/g,
    };

    function trimCommas(name) {
        let trimmed = name.trim();
        while (trimmed.startsWith("、")) {
            trimmed = trimmed.replace("、", "").trimStart();
        }
        while (trimmed.endsWith("、")) {
            trimmed = trimmed.split("").reverse().join("")
                .replace("、", "").trimStart()
                .split("").reverse().join("");
        }
        return trimmed;
    }

    const regex_sym = /[\uff1a\u003A【】\/／、＆\u0026♦◆■=]/g;
    const processedText = text.replaceAll("\r", "").replaceAll(regex_sym, "、");

    const sortedRegexes = Object.entries(regexes_per).sort((a, b) => {
        const posA = processedText.search(a[1]);
        const posB = processedText.search(b[1]);
        return posA < 0 ? 1 : posB < 0 ? -1 : posA - posB;
    });

    const personRoleMap = {};
    sortedRegexes.forEach(([role, regex]) => {
        const matches = processedText.match(regex);
        if (!matches) return;

        matches.forEach(match => {
            const personNames = match.split("、")
                .map(name => trimCommas(name))
                .map(name => name.replace(/[\s　]+/g, ''))
                .filter(name => name && name !== " ");

            personNames.forEach(name => {
                if (!personRoleMap[name]) {
                    personRoleMap[name] = [];
                }
                if (!personRoleMap[name].includes(role)) {
                    personRoleMap[name].push(role);
                }
            });
        });
    });

    return personRoleMap;
}
