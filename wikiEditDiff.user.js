// ==UserScript==
// @name         Bangumi 编辑对比工具
// @namespace    https://bgm.tv/
// @version      0.1
// @description  在Bangumi编辑页面显示编辑前后的差异对比
// @author       You
// @match        https://bgm.tv/subject/*/edit_detail
// @match        https://bangumi.tv/subject/*/edit_detail
// @match        https://chii.in/subject/*/edit_detail
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none

// ==/UserScript==

// 加载所需CSS
const diff2htmlCSS = document.createElement('link');
diff2htmlCSS.rel = 'stylesheet';
diff2htmlCSS.href = 'https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css';
document.head.appendChild(diff2htmlCSS);

// 加载jsdiff
const jsDiffScript = document.createElement('script');
jsDiffScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.min.js';
document.head.appendChild(jsDiffScript);

// 加载diff2html UI
const diff2htmlUIScript = document.createElement('script');
diff2htmlUIScript.src = 'https://unpkg.com/diff2html/bundles/js/diff2html-ui.min.js';
document.head.appendChild(diff2htmlUIScript);

const wcodeContainer = document.getElementById('subject_infobox');
const summaryContainer = document.getElementById('subject_summary');
const tagsContainer = document.getElementById('tags');

// 存储初始值
const initialWcode = wcode;
const initialSummary = summaryContainer.value;
const initialTags = tagsContainer.value;

// 添加比较按钮
const submitButton = document.querySelector('input.inputBtn[value="提交"]');
const compareButton = submitButton.cloneNode(true);
compareButton.value = '比较差异';
submitButton.parentNode.insertBefore(compareButton, submitButton.nextSibling);

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

// 创建差异显示函数
function createDiffSection(container, fileName, oldValue, newValue) {
    const section = document.createElement('div');
    section.innerHTML = `<h4>${fileName}</h4>`;
    container.appendChild(section);

    const theme = document.documentElement.dataset.theme || 'light';
    const diffString = Diff.createPatch(fileName, oldValue, newValue);
    const configuration = {
        drawFileList: false,
        fileListToggle: false,
        colorScheme: theme === 'dark' ? 'dark' : 'light'
    };

    const diff2htmlUi = new Diff2HtmlUI(section, diffString, configuration);
    diff2htmlUi.draw();
}

// 比较按钮点击事件
compareButton.onclick = function (e) {
    e.preventDefault();
    const newWcode = getWcode();
    const newSummary = summaryContainer.value;
    const newTags = tagsContainer.value;

    let diffContainer = document.getElementById('diffContainer');
    if (!diffContainer) {
        diffContainer = document.createElement('div');
        diffContainer.id = 'diffContainer';
        diffContainer.style.marginTop = '20px';
        document.querySelector('#columnInSubjectA').appendChild(diffContainer);
    }

    diffContainer.innerHTML = '<h2>编辑差异对比</h2>';

    if (initialWcode !== newWcode) createDiffSection(diffContainer, 'WCode', initialWcode, newWcode);
    if (initialSummary !== newSummary) createDiffSection(diffContainer, '简介', initialSummary, newSummary);
    if (initialTags !== newTags) createDiffSection(diffContainer, '标签', initialTags, newTags);

    if (initialWcode === newWcode && initialSummary === newSummary && initialTags === newTags) {
        diffContainer.innerHTML += '<p>没有检测到变化</p>';
    }
};