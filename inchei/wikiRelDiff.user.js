// ==UserScript==
// @name         维基关联历史对比差异
// @namespace    bgm.wiki.rel.diff
// @version      0.1.0
// @description  比较条目-人物/角色关联项目的增删修改
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*/add_related/person
// @match        http*://bgm.tv/subject/*/add_related/character
// @match        http*://bangumi.tv/subject/*/add_related/person
// @match        http*://bangumi.tv/subject/*/add_related/character
// @match        http*://chii.in/subject/*/add_related/person
// @match        http*://chii.in/subject/*/add_related/character
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/5040
// ==/UserScript==

(function () {
    'use strict';

    // 仅在有历史版本的页面执行
    const hasHistory = document.querySelector('.groupsLine [href*="?undo="]');
    if (!hasHistory) return;

    // 字段中文映射
    const FIELD_MAPPING = {
        "id": "ID",
        "name": "名称",
        // "url_mod": "类型",
        "crt_type": "角色类型",
        "prsn_position": "人员职位",
        "crt_spoiler": "剧透",
        "crt_appear_eps": "参与集数",
        "crt_order": "排序",
        "prsn_appear_eps": "参与集数"
    };

    // 页面配置（统一使用crtRelateSubjects选择器）
    const pageType = window.location.pathname.includes('/person') ? 'person' : 'character';
    const typeField = pageType === 'person' ? 'prsn_position' : 'crt_type'; // 对应数据字段名
    const typeSelector = '#crtRelateSubjects li option'; // 统一选择器

    // 类型/职位中文映射（直接加载当前页面所需，无分类讨论）
    const typeMapping = {};
    document.querySelectorAll(typeSelector).forEach(option => {
        typeMapping[option.value] = option.textContent.split(' /')[0].trim();
    });

    // 版本数据缓存（保留）
    const versionCache = new Map();

    // 加载依赖资源
    function loadDependencies() {
        // 加载diff2html样式
        const diff2htmlCSS = document.createElement('link');
        diff2htmlCSS.rel = 'stylesheet';
        diff2htmlCSS.href = 'https://cdn.jsdmirror.com/npm/diff2html/bundles/css/diff2html.min.css';
        document.head.appendChild(diff2htmlCSS);

        // 加载jsdiff核心库
        const jsDiffScript = document.createElement('script');
        jsDiffScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.min.js';
        document.head.appendChild(jsDiffScript);

        // 加载diff2html UI库
        const diff2htmlUIScript = document.createElement('script');
        diff2htmlUIScript.src = 'https://unpkg.com/diff2html/bundles/js/diff2html-ui.min.js';
        document.head.appendChild(diff2htmlUIScript);

        // 加载自定义样式（纯CSS控制单选框互斥和按钮状态）
        const style = document.createElement('style');
        style.textContent = `
            #wikiRelDiff {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 60vw;
                width: 600px;
                max-width: 100vw;
                max-height: 80vh;
                backdrop-filter: blur(10px);
                background: rgba(254, 254, 254, .95);
                color: #000;
                border-radius: 15px;
                border: 1px solid rgba(255, 255, 255, .3);
                box-shadow: 0 5px 30px 10px rgba(80, 80, 80, .5);
                z-index: 9999;
                overflow: hidden;
            }
            #wikiRelDiff .staff-tip-header {
                padding: 10px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, .2);
            }
            #wikiRelDiff .staff-tip-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: inherit;
            }
            #wikiRelDiff .staff-warning-section {
                padding: 10px 12px;
                margin: 0 0 16px;
                background: rgba(255, 248, 225, 0.6);
                border: 1px solid rgba(255, 153, 0, 0.3);
                border-radius: 8px;
                color: #856404;
                word-break: break-word;
            }
            #wikiRelDiff .staff-warning-title {
                font-size: 14px;
                font-weight: 500;
            }
            #wikiRelDiff .staff-tip-content {
                padding: 12px 16px;
                max-height: calc(80vh - 100px);
                overflow-y: auto;
                font-size: 13px;
            }
            .version-compare-h2 {
                position: sticky;
                top: 0;
                background: var(--bgm-bg);
            }
            html[data-nav-mode="fixed"] .version-compare-h2 {
                top: 60px;
            }
            .version-radio {
                cursor: pointer;
            }
            .version-radio-group {
                display: inline-flex;
                margin-right: 10px;
                gap: 5px;
                vertical-align: text-bottom;
            }
            .compare-btn {
                display: inline-block;
                margin-left: 12px;
                padding: 2px 8px;
                font-size: 12px;
                line-height: 1.4;
                cursor: pointer;
            }
            /* 纯CSS控制按钮状态：未同时选中A和B时禁用 */
            .SimpleSidePanel:not(:has(input[name="versionA"]:checked):has(input[name="versionB"]:checked)) .compare-btn {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }
            /* 纯CSS控制单选框互斥隐藏：选中当前A/B时，隐藏同组的B/A */
            .version-radio-group:has(input[name="versionA"]:checked) input[name="versionB"],
            .version-radio-group:has(input[name="versionB"]:checked) input[name="versionA"] {
                visibility: hidden;
            }
            html[data-theme="dark"] #wikiRelDiff {
                background: rgba(40, 40, 40, .95);
                color: #fff;
                box-shadow: 0 5px 30px 10px rgba(0, 0, 0, .2);
            }
            html[data-theme="dark"] #wikiRelDiff .staff-warning-section {
                background: rgba(60, 40, 0, 0.4);
                border-color: rgba(255, 153, 0, 0.5);
                color: #ffd700;
            }
            html[data-theme="dark"] #wikiRelDiff .staff-tip-header {
                border-bottom-color: rgba(255, 255, 255, .05);
            }
            #wikiRelDiff .d2h-code-linenumber,
            #wikiRelDiff .d2h-code-side-linenumber {
                position: relative !important;
                display: table-cell !important;
            }
            #wikiRelDiff .d2h-code-line,
            #wikiRelDiff .d2h-code-side-line {
                padding: 0 0.5em !important;
            }
            #wikiRelDiff .d2h-file-header.d2h-sticky-header {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 提取版本原始数据（带缓存）
    async function extractVersionData(url) {
        if (versionCache.has(url)) {
            return versionCache.get(url);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('获取版本失败');
            const html = await response.text();
            const match = /^\s*var subjectCrtRelations = (.*?);\s*$/gm.exec(html);
            const data = match ? match[1] : '[]';
            versionCache.set(url, data); // 存入缓存
            return data;
        } catch (error) {
            console.error('版本数据提取失败:', error);
            return '[]';
        }
    }

    // 格式化数据（中文键名+类型转换+ID排序）
    function formatData(rawDataStr) {
        try {
            const data = JSON.parse(rawDataStr);

            // 数组按ID排序
            const sortedData = Array.isArray(data)
                ? [...data].sort((a, b) => (Number(a.id) || a.id) - (Number(b.id) || b.id))
                : data;

            // 递归格式化（替换键名和类型值）
            const formatItem = (item) => {
                if (Array.isArray(item)) return item.map(formatItem);
                if (typeof item !== 'object' || item === null) return item;

                const formatted = {};
                for (const key of Object.keys(item)) {
                    if (key === 'url_mod') continue;

                    const chineseKey = FIELD_MAPPING[key] || key;
                    let value = item[key];

                    // 替换类型/职位ID为中文（根据页面类型匹配对应字段）
                    if (key === typeField && typeMapping[value]) {
                        value = typeMapping[value];
                    }

                    formatted[chineseKey] = formatItem(value);
                }
                return formatted;
            };

            return JSON.stringify(formatItem(sortedData), null, 2);
        } catch (error) {
            console.error('数据格式化失败:', error);
            return rawDataStr;
        }
    }

    // 创建对比弹窗
    function createComparePopup() {
        const existing = document.querySelector('#wikiRelDiff');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'wikiRelDiff';
        popup.innerHTML = `
            <div class="staff-tip-header">
                <h3 class="staff-tip-title">${pageType === 'person' ? '人物' : '角色'}关联历史对比</h3>
                <button class="staff-tip-close">&times;</button>
            </div>
            <div class="staff-tip-content">
                <div id="diff-results">请选择两个版本进行对比</div>
            </div>
        `;
        document.body.appendChild(popup);

        // 关闭按钮事件
        popup.querySelector('.staff-tip-close').addEventListener('click', () => popup.remove());

        // 人物页面警告
        if (pageType === 'person') {
            const warning = document.createElement('div');
            warning.className = 'staff-warning-section';
            warning.innerHTML = `
                <div class="staff-warning-title">注意</div>
                <p>受限于系统，人物关联历史无法获得参与信息（<a class="l" href="https://bgm.tv/group/topic/441402" target="_blank">参考</a>）</p>
            `;
            popup.querySelector('.staff-tip-content').prepend(warning);
        }

        return popup;
    }

    // 执行版本对比
    async function compareVersions(versionAUrl, versionBUrl) {
        const popup = createComparePopup();
        const resultContainer = popup.querySelector('#diff-results');
        resultContainer.innerHTML = '正在计算差异...';

        try {
            // 并行获取版本数据（带缓存）
            const [rawA, rawB] = await Promise.all([
                extractVersionData(versionAUrl),
                extractVersionData(versionBUrl)
            ]);

            // 格式化数据
            const formattedA = formatData(rawA);
            const formattedB = formatData(rawB);

            // 等待diff库加载完成
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (window.Diff && window.Diff2HtmlUI) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });

            // 渲染差异
            resultContainer.innerHTML = '';
            const diffContainer = document.createElement('div');
            resultContainer.appendChild(diffContainer);

            const theme = document.documentElement.dataset.theme || 'light';
            const diffStr = window.Diff.createPatch(
                `${pageType === 'person' ? '人物' : '角色'}关联差异`,
                formattedA,
                formattedB
            );

            new window.Diff2HtmlUI(diffContainer, diffStr, {
                drawFileList: false,
                fileListToggle: false,
                fileContentToggle: false,
                colorScheme: theme === 'dark' ? 'dark' : 'light',
                matching: 'lines'
            }).draw();

        } catch (error) {
            resultContainer.innerHTML = `对比失败: ${error.message}`;
            console.error(error);
        }
    }

    // 初始化控制UI（单选框和对比按钮）
    function initControlUI() {
        const groupsLine = document.querySelector('.groupsLine');
        const h2Element = groupsLine.previousElementSibling;
        if (!h2Element || h2Element.tagName !== 'H2') return;

        // 吸顶标题 + 控制容器（用于CSS选择器定位）
        h2Element.classList.add('version-compare-h2');

        // 对比按钮
        const compareBtn = document.createElement('a');
        compareBtn.className = 'l compare-btn';
        compareBtn.textContent = '对比选中版本';
        h2Element.appendChild(compareBtn);

        // 为每个版本添加单选框组
        const versionItems = document.querySelectorAll('.groupsLine li');
        versionItems.forEach(li => {
            const undoLink = li.querySelector('[href*="?undo="]');
            if (!undoLink) return;

            // 单选框组（用于CSS互斥控制）
            const radioGroup = document.createElement('div');
            radioGroup.className = 'version-radio-group';
            li.prepend(radioGroup);

            // 版本A单选框
            const radioA = document.createElement('input');
            radioA.type = 'radio';
            radioA.name = 'versionA';
            radioA.className = 'version-radio';
            radioA.dataset.url = undoLink.href;
            radioGroup.appendChild(radioA);

            // 版本B单选框
            const radioB = document.createElement('input');
            radioB.type = 'radio';
            radioB.name = 'versionB';
            radioB.className = 'version-radio';
            radioB.dataset.url = undoLink.href;
            radioGroup.appendChild(radioB);
        });

        // 对比按钮点击事件（获取选中的两个版本URL）
        compareBtn.addEventListener('click', () => {
            const versionAUrl = document.querySelector('input[name="versionA"]:checked')?.dataset.url;
            const versionBUrl = document.querySelector('input[name="versionB"]:checked')?.dataset.url;
            if (versionAUrl && versionBUrl) {
                compareVersions(versionAUrl, versionBUrl);
            }
        });
    }

    // 初始化执行
    loadDependencies();
    initControlUI();
})();
