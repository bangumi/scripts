// ==UserScript==
// @name         维基关联历史对比差异
// @namespace    bgm.wiki.rel.diff
// @version      0.2.1
// @description  比较条目-人物/角色、人物-条目关联项目的增删修改
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*/add_related/person
// @match        http*://bgm.tv/subject/*/add_related/character
// @match        http*://bgm.tv/person/*/add_related/anime
// @match        http*://bgm.tv/person/*/add_related/book
// @match        http*://bgm.tv/person/*/add_related/music
// @match        http*://bgm.tv/person/*/add_related/game
// @match        http*://bgm.tv/person/*/add_related/real
// @match        http*://bangumi.tv/subject/*/add_related/person
// @match        http*://bangumi.tv/subject/*/add_related/character
// @match        http*://bangumi.tv/person/*/add_related/anime
// @match        http*://bangumi.tv/person/*/add_related/book
// @match        http*://bangumi.tv/person/*/add_related/music
// @match        http*://bangumi.tv/person/*/add_related/game
// @match        http*://bangumi.tv/person/*/add_related/real
// @match        http*://chii.in/subject/*/add_related/person
// @match        http*://chii.in/subject/*/add_related/character
// @match        http*://chii.in/person/*/add_related/anime
// @match        http*://chii.in/person/*/add_related/book
// @match        http*://chii.in/person/*/add_related/music
// @match        http*://chii.in/person/*/add_related/game
// @match        http*://chii.in/person/*/add_related/real
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/554524
// @gadget       https://bgm.tv/dev/app/5040
// ==/UserScript==

(function () {
    'use strict';

    // 仅在有历史版本的页面执行
    const hasHistory = document.querySelector('.groupsLine [href*="?undo="]');
    if (!hasHistory) return;

    // 字段中文映射
    const FIELD_MAPPING = {
        "name": "名称",
        "crt_type": "角色类型",
        "prsn_position": "人员职位",
        "crt_spoiler": "剧透",
        "crt_appear_eps": "参与集数",
        "crt_order": "排序",
        "prsn_appear_eps": "参与集数"
    };
    const TYPE_CN = {
        anime: '动画',
        book: '书籍',
        music: '音乐',
        game: '游戏',
        real: '三次元',
    }

    // 页面配置
    let pageType = '';
    if (window.location.pathname.includes('/add_related/person')) {
        pageType = 'person';
    } else if (window.location.pathname.includes('/add_related/character')) {
        pageType = 'character';
    } else {
        pageType = 'personSubject';
    }

    const typeField = pageType === 'person' ? 'prsn_position' : (pageType === 'character' ? 'crt_type' : 'type');
    const typeSelector = '#crtRelateSubjects li option';

    // 类型/职位中文映射
    const typeMapping = {};
    document.querySelectorAll(typeSelector).forEach(option => {
        typeMapping[option.value] = option.textContent.split(' /')[0].trim();
    });

    // 版本数据缓存
    const versionCache = new Map();

    // 人物-条目关联数据提取函数
    function getRelItemData(li) {
        return {
            name: li.querySelector('.title a').textContent || '',
            id: li.querySelector('.title a').href.split('/').pop(),
            infoName: li.querySelector('.info a')?.textContent || '',
            infoId: li.querySelector('.info a')?.href.split('/').pop(),
            type: li.querySelectorAll(':scope option')[li.querySelector('select').selectedIndex].textContent.split(' / ')[0],
            remark: li.querySelector('input[type=text]')?.value.trim() || '',
            checkboxes: [...li.querySelectorAll(':scope input[type=checkbox]')].map(checkbox => ({
                checked: checkbox.checked,
                title: checkbox.previousElementSibling.textContent.slice(0, -1).trim() || ''
            }))
        };
    }

    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
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
        diff2htmlUIScript.src = 'https://cdn.jsdmirror.com/npm/diff2html/bundles/js/diff2html-ui-base.min.js';
        document.head.appendChild(diff2htmlUIScript);

        // 加载自定义样式
        const style = document.createElement('style');
        style.textContent = css`
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
                overflow-wrap: break-word;
            }
            #wikiRelDiff .staff-error-section {
                padding: 10px 12px;
                margin: 0 0 16px;
                background: rgba(255, 224, 178, 0.6);
                border: 1px solid rgba(255, 99, 71, 0.3);
                border-radius: 8px;
                color: #8B0000;
                overflow-wrap: break-word;
            }
            #wikiRelDiff .staff-warning-title, #wikiRelDiff .staff-error-title {
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
            html[data-theme="dark"] #wikiRelDiff .staff-error-section {
                background: rgba(80, 0, 0, 0.4);
                border-color: rgba(255, 99, 71, 0.5);
                color: #ffb6c1;
            }
            html[data-theme="dark"] #wikiRelDiff .staff-tip-header {
                border-bottom-color: rgba(255, 255, 255, .05);
            }

            /* https://github.com/rtfpessoa/diff2html/issues/381 */
            #wikiRelDiff .d2h-wrapper {
                text-align: left;
                transform: translateZ(0);
            }
            #wikiRelDiff .d2h-file-header.d2h-sticky-header {
                display: none !important;
            }

            #wikiRelDiff .hljs {
                background: unset; /* 解决与代码高亮冲突 */
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
            if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
            const html = await response.text();

            // 对于人物-条目关联，使用DOM解析方式提取数据
            if (pageType === 'personSubject') {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // 提取cat信息
                const catElement = doc.querySelector('.cat .selected');
                if (!catElement) throw new Error('无法找到类型信息');

                const cat = catElement.href;
                if (!cat) throw new Error('类型信息为空');

                // 提取关联数据
                const items = doc.querySelectorAll('#crtRelateSubjects li.old');
                const data = Array.from(items).map(getRelItemData);

                const result = {
                    cat: cat,
                    data: data
                };

                const dataStr = JSON.stringify(result);
                versionCache.set(url, dataStr);
                return dataStr;
            } else {
                // 对于其他页面，使用原有的JSON提取方式
                const match = /^\s*var subjectCrtRelations = (.*?);\s*$/gm.exec(html);
                if (!match) throw new Error('无法找到 subjectCrtRelations 变量');

                const data = match[1];
                versionCache.set(url, data); // 存入缓存
                return data;
            }
        } catch (error) {
            console.error('版本数据提取失败:', error);
            // 不隐藏错误，而是返回错误信息
            throw error;
        }
    }

    // 格式化数据（中文键名+类型转换+ID排序）
    function formatData(rawDataStr) {
        try {
            const data = JSON.parse(rawDataStr);

            // 对于personSubject类型，我们只需要格式化data部分
            const actualData = pageType === 'personSubject' ? data.data : data;

            // 数组按ID排序
            const sortedData = Array.isArray(actualData)
                ? [...actualData].sort((a, b) => {
                    // 先按id排序
                    const idA = Number(a.id) || a.id;
                    const idB = Number(b.id) || b.id;
                    if (idA !== idB) {
                        return idA - idB;
                    }

                    // id相等时，按typeField排序（兼容数字和字符串）
                    const valA = a[typeField];
                    const valB = b[typeField];
                    
                    // 判断是否为数字（排除NaN的情况）
                    const isNumberA = typeof valA === 'number' && !isNaN(valA);
                    const isNumberB = typeof valB === 'number' && !isNaN(valB);
                    
                    if (isNumberA && isNumberB) {
                        // 都是数字，用减法比较
                        return valA - valB;
                    } else {
                        // 至少有一个不是数字，转为字符串用localeCompare比较
                        return String(valA).localeCompare(String(valB));
                    }
                    })
                : actualData;


            // 递归格式化（替换键名和类型值）
            const formatItem = (item) => {
                if (Array.isArray(item)) return item.map(formatItem);
                if (typeof item !== 'object' || item === null) return item;

                const formatted = {};
                for (const key of Object.keys(item)) {
                    // 处理人物-条目关联的特殊字段
                    if (pageType === 'personSubject') {
                        switch (key) {
                            case 'name':
                                formatted['标题'] = item[key];
                                break;
                            case 'type':
                                formatted['职位'] = item[key];
                                break;
                            case 'remark':
                                formatted['备注'] = item[key];
                                break;
                            case 'checkboxes':
                                // 将checkboxes转换为单层JSON
                                if (Array.isArray(item[key])) {
                                    item[key].forEach(checkbox => {
                                        if (checkbox.title) {
                                            formatted[checkbox.title] = checkbox.checked;
                                        }
                                    });
                                }
                                break;
                            case 'infoName':
                            case 'infoId':
                                // 不显示infoName和infoId
                                break;
                            default:
                                formatted[key] = formatItem(item[key]);
                        }
                    } else {
                        // 处理其他页面
                        if (key === 'url_mod') continue;

                        const chineseKey = FIELD_MAPPING[key] || key;
                        let value = item[key];

                        // 替换类型/职位ID为中文（根据页面类型匹配对应字段）
                        if (key === typeField && typeMapping[value]) {
                            value = typeMapping[value];
                        }

                        formatted[chineseKey] = formatItem(value);
                    }
                }
                return formatted;
            };

            return JSON.stringify(formatItem(sortedData), null, 2);
        } catch (error) {
            console.error('数据格式化失败:', error);
            throw error;
        }
    }

    // 创建对比弹窗
    function createComparePopup() {
        const existing = document.querySelector('#wikiRelDiff');
        if (existing) existing.remove();

        let popupTitle = ({
            person: '人物',
            character: '角色',
            personSubject: '条目',
        })[pageType];

        const popup = document.createElement('div');
        popup.id = 'wikiRelDiff';
        popup.innerHTML = `
            <div class="staff-tip-header">
                <h3 class="staff-tip-title">${popupTitle}关联历史对比</h3>
                <button class="staff-tip-close">&times;</button>
            </div>
            <div class="staff-tip-content">
                <div class="staff-warning-section">
                    <div class="staff-warning-title">注意</div>
                    <p>两次修订间差异不完全等于新修订造成的差异，期间反向关联带来的差异也会显示</p>
                </div>
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

            // 对于personSubject类型，需要先比较cat
            if (pageType === 'personSubject') {
                const dataA = JSON.parse(rawA);
                const dataB = JSON.parse(rawB);

                if (dataA.cat !== dataB.cat) {
                    // 显示警告，不继续比对
                    resultContainer.innerHTML = '';
                    const warning = document.createElement('div');
                    warning.className = 'staff-error-section';
                    warning.innerHTML = `
                        <div class="staff-error-title">错误</div>
                        <p>版本类型不一致，无法进行对比。</p>
                        <p>版本A类型: ${TYPE_CN[dataA.cat.split('/').pop()]}</p>
                        <p>版本B类型: ${TYPE_CN[dataB.cat.split('/').pop()]}</p>
                    `;
                    resultContainer.appendChild(warning);
                    return;
                }
            }

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
                '关联差异',
                formattedA,
                formattedB
            );

            console.log(formattedA, formattedB)

            new window.Diff2HtmlUI(diffContainer, diffStr, {
                highlight: false,
                drawFileList: false,
                fileListToggle: false,
                fileContentToggle: false,
                colorScheme: theme === 'dark' ? 'dark' : 'light',
                matching: 'lines'
            }).draw();

        } catch (error) {
            // 显示错误信息，不隐藏错误
            resultContainer.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'staff-error-section';
            errorDiv.innerHTML = `
                <div class="staff-error-title">错误</div>
                <p>对比过程中遇到错误: ${error.message}</p>
                <p>请刷新页面重试，或检查网络连接。</p>
            `;
            resultContainer.appendChild(errorDiv);
            console.error('对比失败:', error);
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
