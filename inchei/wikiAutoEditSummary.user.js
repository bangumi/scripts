// ==UserScript==
// @name         bangumi 自动生成编辑摘要
// @namespace    https://bgm.tv/group/topic/433505
// @version      0.5.3
// @description  自动生成Bangumi编辑摘要
// @author       You
// @icon         https://bgm.tv/img/favicon.ico
// @match        https://bgm.tv/subject/*/edit_detail
// @match        https://bgm.tv/character/*/edit
// @match        https://bgm.tv/person/*/edit
// @match        https://bgm.tv/*/add_related/*
// @match        https://bangumi.tv/subject/*/edit_detail
// @match        https://bangumi.tv/character/*/edit
// @match        https://bangumi.tv/person/*/edit
// @match        https://bangumi.tv/*/add_related/*
// @match        https://chii.in/subject/*/edit_detail
// @match        https://chii.in/character/*/edit
// @match        https://chii.in/person/*/edit
// @match        https://chii.in/*/add_related/*
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/547546
// @gadget       https://bgm.tv/dev/app/3401
// ==/UserScript==

(function () {
    'use strict';

    const editSummaryInput = document.querySelector('#editSummary');
    if (!editSummaryInput) return;

    const SPLIT_RULE = /[()[\]{}（）<>《》「」『』【】+×·→/／、,，;；：&＆\\等]/;
    const isObject = v => v !== null && typeof v === 'object';
    const short = s => s.length > 13 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s;

    // #region 获取页面类型和初始值
    let initialTitle, initialPlatform, initialPros, initialSeries, initialWcode, initialSummary, initialNsfw, initialTags;
    let titleInput, getPlatform, getPros, seriesCheckbox, summaryTextarea, nsfwCheckbox, tagsInput;

    let initialRelatedItems = [];

    let pageFeatures = {
        isRelated: false,
        hasWcode: false,
        relatedContextType: null
    };
    let autoStorageKey, lockedStorageKey;

    const path = window.location.pathname;
    pageFeatures.isRelated = path.includes('/add_related/');
    pageFeatures.hasWcode = path.match(/\/edit(_detail)?$/)

    if (pageFeatures.isRelated) {
        if (path.match(/add_related\/subject\//)) {
            pageFeatures.relatedContextType = 1;
        } else if (path.match(/(character|person)\/\d+\/add_related\/anime/) || path.match(/subject\/\d+\/add_related\/(person|character)/)) {
            pageFeatures.relatedContextType = 2;
        }

        initialRelatedItems = Array.from(document.querySelectorAll('#crtRelateSubjects li.old')).map(li => {
            return getRelItemData(li);
        });
    } else if (pageFeatures.hasWcode) {
        titleInput = document.querySelector('[name="subject_title"], [name="crt_name"]');
        getPlatform = () => document.querySelector(`[for="${[...document.querySelectorAll('input[name=platform]')].find(i => i.checked)?.id}"]`)?.textContent;
        getPros = () => [...document.querySelectorAll('[name^=prsn_pro]')].filter(c => c.checked).map(c => document.querySelector(`[for=${c.id}]`).textContent);
        seriesCheckbox = document.querySelector('#subjectSeries');
        summaryTextarea = document.querySelector('#subject_summary, #crt_summary');
        nsfwCheckbox = document.querySelector('input[name="subject_nsfw"]');
        tagsInput = document.querySelector('input#tags');

        initialTitle = titleInput?.value;
        initialPlatform = getPlatform?.();
        initialPros = getPros?.();
        initialSeries = seriesCheckbox?.checked;
        initialWcode = getWcode();
        initialSummary = summaryTextarea?.value;
        initialNsfw = nsfwCheckbox?.checked;
        initialTags = tagsInput?.value;
    }

    autoStorageKey = pageFeatures.hasWcode ? 'autoGenEditSummary' : 'autoGenRelEditSummary';
    lockedStorageKey = pageFeatures.hasWcode ? 'lockedEditSummary' : 'lockedERelditSummary';

    const lockedSummary = localStorage.getItem(lockedStorageKey);
    if (lockedSummary) editSummaryInput.value = lockedSummary;
    // #endregion

    if (pageFeatures.hasWcode) {
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.display = 'flex';
        wrapper.style.gap = '5px';
        wrapper.style.marginBlock = '5px';
        editSummaryInput.style.width = '100%';
        editSummaryInput.after(wrapper);
        wrapper.append(editSummaryInput.previousElementSibling, editSummaryInput, newGenBtn(), newLockBtn());
        wrapper.after(newAutoGenBtn());
    } else if (pageFeatures.isRelated) { // 避免批量修改关联关系造成崩坏
        editSummaryInput.after(newGenBtn(), newLockBtn(), document.createElement('br'), newAutoGenBtn());
    }

    const submitBtn = document.querySelector('input.inputBtn[name="submit"]');
    submitBtn.addEventListener('click', () => {
        localStorage.getItem(autoStorageKey) === 'true' && genEditSummary();
    }, { capture: false });

    // #region UI
    function newAutoGenBtn() {
        const autoGenBtn = document.createElement('input');
        autoGenBtn.type = 'checkbox';
        autoGenBtn.id = autoStorageKey;
        autoGenBtn.style.marginRight = '5px';
        const autoGenLabel = document.createElement('label');
        autoGenLabel.htmlFor = autoStorageKey;
        autoGenLabel.textContent = '提交时自动生成';

        autoGenBtn.onchange = function () {
            localStorage.setItem(autoStorageKey, this.checked);
        };
        autoGenBtn.checked = localStorage.getItem(autoStorageKey) === 'true';
        autoGenLabel.prepend(autoGenBtn);

        return autoGenLabel;
    }

    function newGenBtn() {
        const genBtn = document.createElement('button');
        genBtn.type = 'button';
        genBtn.style.wordBreak = 'keep-all';
        genBtn.textContent = '生成摘要';
        genBtn.onclick = genEditSummary;
        return genBtn;
    }

    function newLockBtn() {
        let isLocked = lockedSummary;
        const lockBtn = document.createElement('button');
        lockBtn.type = 'button';
        lockBtn.textContent = isLocked ? '🔒' : '🔓';
        lockBtn.title = isLocked ? '编辑摘要已锁定' : '编辑摘要未锁定';
        lockBtn.style.cursor = 'pointer';
        lockBtn.style.background = 'none';
        lockBtn.style.border = 'none';
        lockBtn.style.fontSize = '16px';
        lockBtn.style.padding = '0';

        lockBtn.onclick = function () {
            isLocked = !isLocked;
            this.textContent = isLocked ? '🔒' : '🔓';
            this.title = isLocked ? '编辑摘要已锁定' : '编辑摘要未锁定';
            localStorage.setItem(lockedStorageKey, isLocked ? editSummaryInput.value : '');
        };

        return lockBtn;
    }
    // #endregion

    // #region 生成摘要
    function genEditSummary() {
        const changes = [];

        if (pageFeatures.hasWcode) {
            const newWcode = getWcode();
            const newSummary = summaryTextarea?.value;
            const newTags = tagsInput?.value;

            if (initialTitle !== titleInput?.value) {
                changes.push(`修改标题（${initialTitle} → ${titleInput.value}）`);
            }

            const newPlatform = getPlatform?.();
            if (initialPlatform !== newPlatform) {
                changes.push(`修改类型（${initialPlatform} → ${newPlatform}）`);
            }

            const newPros = getPros?.();
            const proChanges = genArrChanges(initialPros, newPros, '职业');
            if (proChanges.length) changes.push(...proChanges);

            if (initialSeries !== seriesCheckbox?.checked) {
                changes.push(seriesCheckbox?.checked ? '标记为系列' : '取消系列标记');
            }

            const wcodeChanges = genWcodeChanges(initialWcode, newWcode);
            if (wcodeChanges.length) {
                changes.push(...wcodeChanges);
            }

            if (initialSummary !== newSummary) {
                changes.push(`${initialSummary ? '修改' : '添加'}简介`);
            }

            if (initialNsfw !== nsfwCheckbox?.checked) {
                changes.push(nsfwCheckbox?.checked ? '标记为受限内容' : '取消受限内容标记');
            }

            const tagsToArr = tags => tags ? tags.split(/\s+/).filter(t => t) : [];
            const tagChanges = genArrChanges(tagsToArr(initialTags), tagsToArr(newTags), '标签');
            if (tagChanges.length) changes.push(...tagChanges);

            if (document.querySelector('input[type=file]')?.value) {
                changes.push('新肖像');
            }
        } else if (pageFeatures.isRelated) {
            const currentLis = Array.from(document.querySelectorAll('#crtRelateSubjects li:has(.title)'));
            const currentOldLis = currentLis.filter(li => li.classList.contains('old'));
            const currentNewLis = currentLis.filter(li => !li.classList.contains('old'));

            currentOldLis.forEach(li => {
                const initialItem = initialRelatedItems.find(item => item.element === li);
                if (initialItem) {
                    const currentItem = getRelItemData(li);
                    const modifyChanges = genRelModifyChanges(initialItem, currentItem);
                    if (modifyChanges.length) {
                        changes.push(...modifyChanges);
                    }
                }
            });

            currentNewLis.forEach(li => {
                const item = getRelItemData(li);
                changes.push(genRelExsistChanges(item, '添加'));
            });

            initialRelatedItems.forEach(initialItem => {
                const stillExists = currentOldLis.some(li => li === initialItem.element);
                if (!stillExists) {
                    changes.push(genRelExsistChanges(initialItem, '删除'));
                }
            });
        }

        if (editSummaryInput && changes.length) {
            if (!editSummaryInput.dataset.userModified || editSummaryInput.value === '') {
                editSummaryInput.value = [...new Set(changes)].join('；');
            }
        } else if (editSummaryInput) {
            editSummaryInput.value = '空编辑';
        }
    }

    // #region 相关条目变化
    function genRelExsistChanges(item, verb) {
        if (item.infoName) {
            return `${verb}《${item.name}》${item.type}${item.infoName}`;
        }
        return `${verb}${item.type}${item.name}`;
    }

    function genRelModifyChanges(initial, current) {
        const changes = [];

        if (initial.type !== current.type) {
            const name = current.infoName ? `《${current.name}》${current.infoName}` : current.name;
            changes.push(`${name} ${initial.type}→${current.type}`);
        }

        if (initial.remark !== current.remark) {
            if (pageFeatures.relatedContextType === 1) {
                changes.push('排序');
            } else {
                const remarkName = pageFeatures.relatedContextType === 2 ? '参与' : '备注'
                if (current.remark && !initial.remark) {
                    changes.push(`添加${current.type}${current.name}${remarkName}`);
                } else if (!current.remark && initial.remark) {
                    changes.push(`删除${current.type}${current.name}${remarkName}`);
                } else {
                    changes.push(`${current.type}${current.name}${remarkName} ${initial.remark} → ${current.remark}`);
                }
            }
        }

        if (initial.checkboxes.length && current.checkboxes.length) {
            current.checkboxes.forEach((currentCheckbox, index) => {
                const initialCheckbox = initial.checkboxes[index];
                if (initialCheckbox && initialCheckbox.checked !== currentCheckbox.checked) {
                    changes.push(`${currentCheckbox.checked ? '标记' : '取消标记'}${current.type}${current.name}${currentCheckbox.title}`);
                }
            });
        }

        return changes;
    }
    // #endregion

    // #region wcode变化
    function genWcodeChanges(oldWcode, newWcode) {
        const oldData = parseWcode(oldWcode);
        const newData = parseWcode(newWcode);

        const getMultiData = data => Object.fromEntries(Object.entries(data).filter(([, v]) => isObject(v)));
        const oldMultiData = getMultiData(oldData);
        const newMultiData = getMultiData(newData);

        const multiKeyChanges = [];
        for (const key in oldMultiData) {
            if (key in newMultiData) {
                const subChanges = genFieldChanges(oldMultiData[key], newMultiData[key]);
                multiKeyChanges.push(...subChanges.map(change => `${key}${change}`));
                delete oldData[key];
                delete newData[key];
            }
        }

        return genFieldChanges(oldData, newData).concat(multiKeyChanges);
    }

    function genFieldChanges(oldData, newData) {
        const changes = [];
        const moves = { from: new Set(), to: new Set() };
        const movedKeys = new Set();
        const oldValueDel = (k, v) => `删除${k}${isObject(v) || v === null ? '' : `（${short(v)}）`}`;

        for (const key in oldData) {
            const oldValue = oldData[key];
            const newKey = getNewKey(oldData, newData, key);
            if (newKey) {
                if (oldData[newKey]) changes.push(oldValueDel(newKey, oldValue));
                changes.push(`${key} → ${newKey}`);
                if (newData[key]) changes.push(`添加${key}`);
                moves.from.add(key);
                moves.to.add(newKey);
                movedKeys.add(key).add(newKey);
                continue;
            }
        }
        for (const key in oldData) {
            if (key in newData || moves.from.has(key)) continue;
            changes.push(oldValueDel(key, oldData[key]));
        }
        for (const key in newData) {
            if (key in oldData || moves.to.has(key)) continue;
            changes.push(`添加${key}`);
        }

        for (const key in oldData) {
            if (movedKeys.has(key)) continue;
            if (key in newData) {
                const oldValue = oldData[key];
                const newValue = newData[key];
                if (oldValue === newValue) continue;

                if (oldValue === null) {
                    changes.push(`添加${key}`);
                } else {
                    const splitValue = value =>
                        value.split(SPLIT_RULE).flatMap(v => {
                            v = v.trim();
                            return /^\d+(:\d{2})*$/.test(v) ? v : v.split(':').map(u => u.trim()); // 时间
                        }).filter(v => v);
                    const oldSubValues = splitValue(oldValue);
                    const newSubValues = splitValue(newValue);
                    if (oldSubValues.length > 1 || newSubValues.length > 1) {
                        const subChanges = genArrChanges(oldSubValues, newSubValues, key);
                        if (subChanges.length) {
                            changes.push(...subChanges);
                            continue;
                        }
                    }
                    changes.push(`修改${key}（${oldValue} → ${newValue}）`);
                }
            }
        }

        return changes.filter(change => change);
    }

    function getNewKey(oldData, newData, key) {
        const oldValue = oldData[key];
        if (!oldValue) return null;
        if (oldValue === newData[key]) return null;
        for (const newKey in newData) {
            if (newKey !== key && newData[newKey] === oldValue && oldValue !== oldData[newKey]) {
                return newKey;
            }
        }
        return null;
    }

    function parseWcode(wcode) {
        const result = {};
        const lines = wcode.split('\n').map(l => l.trim().replace(/^[|[]/, '').replace(/]$/, ''))
            .filter(l => !['', '{{', '}}'].includes(l));

        let currentKey = null;
        let inMultiValue = false;

        for (const line of lines) {
            if (line.endsWith('={')) { // 多值字段开始
                currentKey = line.replace('={', '').trim();
                inMultiValue = true;
                continue;
            }

            if (inMultiValue && line === '}') { // 多值字段结束
                if (currentKey) {
                    currentKey = null;
                    inMultiValue = false;
                }
                continue;
            }

            if (inMultiValue) { // 多值字段内容
                const [subKey, ...subValueParts] = line.split('|');
                const subValue = subValueParts.join('|').trim();
                if (subKey.trim()) {
                    if (!result[currentKey]) result[currentKey] = {};
                    if (subValue) {
                        result[currentKey][subKey.trim()] = subValue;
                    } else if (!subValueParts.length) { // 纯值子段
                        result[currentKey][subKey.trim()] = null;
                    } // 无值但有 | 的无效字段不计入
                    continue;
                }
            }

            if (line.includes('=')) { // 普通字段
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                if (key.trim() && value) result[key.trim()] = value;
            }
        }

        return result;
    }
    // #endregion

    function genArrChanges(oldArr, newArr, label) {
        const changes = [];

        const addedItems = [...newArr].filter(item => !oldArr.includes(item));
        const removedItems = [...oldArr].filter(item => !newArr.includes(item));

        if (addedItems.length) {
            changes.push(`添加${label}${addedItems.join('、')}`);
        }
        if (removedItems.length) {
            changes.push(`删除${label}${removedItems.join('、')}`);
        }
        if (!(addedItems.length + removedItems.length) &&
            oldArr.join('') !== newArr.join('')) {
            changes.push(`调整${label}顺序`)
        }

        return changes;
    }
    // #endregion

    function getRelItemData(li) {
        return {
            name: short(li.querySelector('.title a').textContent) || '',
            infoName: li.querySelector('.info a')?.textContent || '',
            type: li.querySelectorAll('option')[li.querySelector('select').selectedIndex].textContent.split(' / ')[0],
            remark: li.querySelector('input[type=text]')?.value.trim() || '',
            checkboxes: [...li.querySelectorAll('input[type=checkbox]')].map(checkbox => ({
                checked: checkbox.checked,
                title: checkbox.previousElementSibling.textContent.slice(0, -1).trim() || ''
            })),
            element: li
        };
    }
})();

/* eslint no-undef: "off" */
function getWcode() {
    if (nowmode === 'wcode') {
        return document.getElementById('subject_infobox').value;
    } else if (nowmode === 'normal') {
        info = new Array();
        ids = new Object();
        props = new Object();
        input_num = $("#infobox_normal input.id").length;
        ids = $("#infobox_normal input.id");
        props = $("#infobox_normal input.prop");
        for (i = 0; i < input_num; i++) {
            id = $(ids).get(i);
            prop = $(props).get(i);
            if ($(id).hasClass('multiKey')) {
                multiKey = $(id).val();
                info[multiKey] = new Object();
                var subKey = 0;
                i++;
                id = $(ids).get(i);
                prop = $(props).get(i);
                while (($(id).hasClass('multiSubKey') || $(prop).hasClass('multiSubVal')) && i < input_num) {
                    if (isNaN($(id).val())) {
                        info[multiKey][subKey] = {
                            key: $(id).val(),
                            value: $(prop).val()
                        };
                    } else {
                        info[multiKey][subKey] = $(prop).val();
                    }
                    subKey++;
                    i++;
                    id = $(ids).get(i);
                    prop = $(props).get(i);
                }
                i--;
            } else if ($.trim($(id).val()) != "") {
                info[$(id).val()] = $(prop).val();
            }
        }
        return WCODEDump(info);
    }
}