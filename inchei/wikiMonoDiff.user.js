// ==UserScript==
// @name         人物/角色维基修订历史对比差异
// @namespace    bangumi.wiki.mono.diff
// @version      0.0.1
// @description  显示人物/角色维基修订历史
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/character/*/edit
// @match        http*://bangumi.tv/character/*/edit
// @match        http*://chii.in/character/*/edit
// @match        http*://bgm.tv/character/*/upload_img
// @match        http*://bangumi.tv/character/*/upload_img
// @match        http*://chii.in/character/*/upload_img
// @match        http*://bgm.tv/person/*/edit
// @match        http*://bangumi.tv/person/*/edit
// @match        http*://chii.in/person/*/edit
// @match        http*://bgm.tv/person/*/upload_img
// @match        http*://bangumi.tv/person/*/upload_img
// @match        http*://chii.in/person/*/upload_img
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.min.js
// @require      https://cdn.jsdmirror.com/npm/diff2html/bundles/js/diff2html-ui-base.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.0/jquery.fancybox.min.js
// @resource      DIFF2HTML_CSS https://cdn.jsdmirror.com/npm/diff2html/bundles/css/diff2html.min.css
// @resource      FANCYBOX_CSS https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.0/jquery.fancybox.min.css
// @connect      next.bgm.tv
// @connect      lain.bgm.tv
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const monoId = location.pathname.split('/')[2];
    if (!/\d+/.test(monoId)) return;

    const monos = `${location.pathname.split('/')[1]}s`; // characters or persons

    const groupsLine = document.querySelector('.groupsLine');
    const simpleSidePanel = document.querySelector('.SimpleSidePanel');
    if (!groupsLine || !simpleSidePanel) return;

    const versionCache = new Map();
    let historySummaryData = null;
    let isHistorySummaryFetched = false;

    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
    const diff2htmlCSS = GM_getResourceText('DIFF2HTML_CSS');
    GM_addStyle(diff2htmlCSS);
    const fancyboxCSS = GM_getResourceText('FANCYBOX_CSS');
    GM_addStyle(fancyboxCSS);
    const customStyle = css`
        #wikiMonoDiff {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 60vw;
            width: 800px;
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
        #wikiMonoDiff .diff-tip-header {
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, .2);
        }
        #wikiMonoDiff .diff-tip-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: inherit;
        }
        #wikiMonoDiff .diff-warning-section {
            padding: 10px 12px;
            margin: 0 0 16px;
            background: rgba(255, 248, 225, 0.6);
            border: 1px solid rgba(255, 153, 0, 0.3);
            border-radius: 8px;
            color: #856404;
            overflow-wrap: break-word;
        }
        #wikiMonoDiff .diff-error-section {
            padding: 10px 12px;
            margin: 0 0 16px;
            background: rgba(255, 224, 178, 0.6);
            border: 1px solid rgba(255, 99, 71, 0.3);
            border-radius: 8px;
            color: #8B0000;
        }
        #wikiMonoDiff .diff-warning-title, #wikiMonoDiff .diff-error-title {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        #wikiMonoDiff .diff-tip-content {
            padding: 12px 16px;
            max-height: calc(80vh - 100px);
            overflow-y: auto;
            font-size: 13px;
        }
        #wikiMonoDiff .d2h-file-diff {
            width: 100% !important;
            overflow-x: auto !important;
        }
        .img-compare-container {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
            margin: 8px 0 24px;
        }
        .img-compare-item {
            flex: 1;
            text-align: center;
        }
        .img-compare-item img {
            max-width: 100%;
            max-height: 200px;
            border-radius: 4px;
            border: 1px solid #ddd;
            object-fit: contain;
            cursor: zoom-in;
        }
        .img-placeholder {
            width: 100%;
            height: 200px;
            line-height: 200px;
            border-radius: 4px;
            border: 1px dashed #ddd;
            background: #f5f5f5;
            color: #999;
            font-size: 14px;
        }
        .img-compare-label {
            font-size: 12px;
            margin-top: 4px;
            color: #666;
        }
        .version-compare-h2 {
            position: sticky;
            top: 0;
            background: var(--dollars-bg);
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
        html[data-theme="dark"] .compare-btn {
            background: rgba(70, 90, 120, 0.6);
            color: #c5d4e3;
        }
        html[data-theme="dark"] .compare-btn:hover {
            background: rgba(90, 110, 140, 0.8);
        }
        .SimpleSidePanel:not(:has(input[name="versionA"]:checked):has(input[name="versionB"]:checked)) .compare-btn {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
        .version-radio-group:has(input[name="versionA"]:checked) input[name="versionB"],
        .version-radio-group:has(input[name="versionB"]:checked) input[name="versionA"] {
            visibility: hidden;
        }
        html[data-theme="dark"] #wikiMonoDiff {
            background: rgba(40, 40, 40, .95);
            color: #fff;
            box-shadow: 0 5px 30px 10px rgba(0, 0, 0, .2);
        }
        html[data-theme="dark"] #wikiMonoDiff .diff-warning-section {
            background: rgba(50, 30, 70, 0.4);
            border-color: rgba(153, 102, 255, 0.5);
            color: #d8bfff;
        }
        html[data-theme="dark"] #wikiMonoDiff .diff-error-section {
            background: rgba(80, 0, 0, 0.4);
            border-color: rgba(255, 99, 71, 0.5);
            color: #ffb6c1;
        }
        html[data-theme="dark"] #wikiMonoDiff .diff-tip-header {
            border-bottom-color: rgba(255, 255, 255, .05);
        }
        html[data-theme="dark"] .img-compare-item img {
            border-color: #555;
        }
        html[data-theme="dark"] .img-placeholder {
            background: #2a2a2a;
            border-color: #555;
            color: #ccc;
        }
        html[data-theme="dark"] .img-compare-label {
            color: #aaa;
        }
        #wikiMonoDiff .d2h-wrapper {
            text-align: left;
            transform: translateZ(0);
            width: 100%;
        }
        #wikiMonoDiff .d2h-file-header.d2h-sticky-header {
            display: none !important;
        }
        #wikiMonoDiff .hljs {
            background: unset;
        }
        #wikiMonoDiff .d2h-code-line-ctn {
            white-space: pre-wrap;
        }
        /* fancybox适配 */
        .fancybox-container {
            z-index: 99999 !important;
        }
    `;
    GM_addStyle(customStyle);

    async function fetchHistorySummary() {
        const apiUrl = `https://next.bgm.tv/p1/wiki/${monos}/${monoId}/history-summary`;
        try {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300) {
                            const data = JSON.parse(response.responseText);
                            historySummaryData = data.data || [];
                            resolve(historySummaryData);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (error) => reject(new Error(error.message)),
                    ontimeout: () => reject(new Error('请求超时'))
                });
            });
        } catch (error) {
            console.error('历史摘要获取失败:', error);
            alert(`修订历史获取失败：${error.message}`);
            return [];
        }
    }

    function matchDomWithApiData() {
        if (!historySummaryData || historySummaryData.length === 0) return;

        const revisionItems = Array.from(document.querySelectorAll('.groupsLine li'));
        const matchLength = Math.min(revisionItems.length, historySummaryData.length);

        for (let index = 0; index < matchLength; index++) {
            const li = revisionItems[index];
            const apiRevision = historySummaryData[index];
            li.dataset.revisionId = apiRevision.id;
        }
    }

    async function extractVersionData(revisionId) {
        if (!revisionId) throw new Error('无效的修订ID');

        const cacheKey = `revision_${revisionId}`;
        if (versionCache.has(cacheKey)) {
            return versionCache.get(cacheKey);
        }

        const apiUrl = `https://next.bgm.tv/p1/wiki/${monos}/-/revisions/${revisionId}`;
        try {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300) {
                            const resData = JSON.parse(response.responseText);
                            const wikiPayload = resData || {};

                            const compareText = JSON.stringify(wikiPayload, null, 2).replaceAll('\\n', '\n').replaceAll('\\r', '');
                            const result = {
                                compareText,
                                img: resData.extra?.img
                            };
                            versionCache.set(cacheKey, result);
                            resolve(result);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (error) => reject(new Error(error.message)),
                    ontimeout: () => reject(new Error('请求超时'))
                });
            });
        } catch (error) {
            console.error('版本数据提取失败:', error);
            throw error;
        }
    }

    function createImgCompareSection(imgA, imgB) {
        // 只要两张图不同（包括一有一无），就生成对比栏
        if (imgA === imgB) return null;

        // 构建图片地址：有图则拼接高清/缩略图，无图则为空
        const imgFullUrlA = imgA ? `https://lain.bgm.tv/pic/crt/l/${imgA}` : '';
        const imgFullUrlB = imgB ? `https://lain.bgm.tv/pic/crt/l/${imgB}` : '';
        const imgThumbUrlA = imgA ? `//lain.bgm.tv/r/400/pic/crt/l/${imgA}` : '';
        const imgThumbUrlB = imgB ? `//lain.bgm.tv/r/400/pic/crt/l/${imgB}` : '';

        const getImgItemHtml = (imgThumb, imgFull, label) => {
            if (imgThumb) {
                return `
                    <a data-fancybox="char-portrait" data-caption="${label}" href="${imgFull}">
                        <img src="${imgThumb}" alt="${label}">
                    </a>
                `;
            } else {
                return `<div class="img-placeholder">无图片</div>`;
            }
        };

        const section = document.createElement('div');
        section.innerHTML = `
            <div class="img-compare-container">
                <div class="img-compare-item">
                    ${getImgItemHtml(imgThumbUrlA, imgFullUrlA, '旧')}
                    <div class="img-compare-label">旧</div>
                </div>
                <div class="img-compare-item">
                    ${getImgItemHtml(imgThumbUrlB, imgFullUrlB, '新')}
                    <div class="img-compare-label">新</div>
                </div>
            </div>
        `;
        return section;
    }

    function createComparePopup() {
        const existing = document.querySelector('#wikiMonoDiff');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'wikiMonoDiff';
        popup.innerHTML = `
            <div class="diff-tip-header">
                <h3 class="diff-tip-title">${monos === 'characters' ? '角色' : '人物'}修订历史对比</h3>
                <button class="diff-tip-close">&times;</button>
            </div>
            <div class="diff-tip-content">
                <div class="diff-warning-section">
                    <div class="diff-warning-title">注意</div>
                    <p>受限于系统，肖像总落后于实际版本一个版本，欲查看肖像变化，请参考新一个版本（<a class="l" href="https://bgm.tv/group/topic/448054" target="_blank">参考</a>）</p>
                </div>
                <div id="diff-results">请选择两个版本进行对比</div>
            </div>
        `;
        document.body.appendChild(popup);
        popup.querySelector('.diff-tip-close').addEventListener('click', () => popup.remove());
        return popup;
    }

    async function compareVersions(revisionIdA, revisionIdB) {
        const popup = createComparePopup();
        const resultContainer = popup.querySelector('#diff-results');
        resultContainer.innerHTML = '正在获取并对比数据...';

        try {
            const [versionA, versionB] = await Promise.all([
                extractVersionData(revisionIdA),
                extractVersionData(revisionIdB)
            ]);

            if (!window.Diff || !window.Diff2HtmlUI) {
                throw new Error('对比库加载失败，请刷新页面');
            }

            resultContainer.innerHTML = '';

            const imgCompareSection = createImgCompareSection(versionA.img, versionB.img);
            if (imgCompareSection) {
                resultContainer.appendChild(imgCompareSection);
            }

            const diffContainer = document.createElement('div');
            resultContainer.appendChild(diffContainer);

            const theme = document.documentElement.dataset.theme || 'light';
            const diffStr = window.Diff.createPatch(
                `修订对比（旧 ↔ 新）`,
                versionA.compareText,
                versionB.compareText
            );

            new window.Diff2HtmlUI(diffContainer, diffStr, {
                highlight: false,
                drawFileList: false,
                fileListToggle: false,
                fileContentToggle: false,
                colorScheme: theme === 'dark' ? 'dark' : 'light',
                matching: 'lines',
                outputFormat: 'side-by-side',
            }).draw();
        } catch (error) {
            resultContainer.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'diff-error-section';
            errorDiv.innerHTML = `
                <div class="diff-error-title">对比错误</div>
                <p>${error.message}</p>
            `;
            resultContainer.appendChild(errorDiv);
        }
    }

    const h2Element = document.querySelector('.SimpleSidePanel h2');
    if (!h2Element) return;

    h2Element.classList.add('version-compare-h2');
    const compareBtn = document.createElement('a');
    compareBtn.className = 'l compare-btn';
    compareBtn.textContent = '对比选中版本';
    h2Element.appendChild(compareBtn);

    const revisionItems = document.querySelectorAll('.groupsLine li');
    revisionItems.forEach(li => {
        const radioGroup = document.createElement('div');
        radioGroup.className = 'version-radio-group';
        li.prepend(radioGroup);

        const radioA = document.createElement('input');
        radioA.type = 'radio';
        radioA.name = 'versionA';
        radioA.className = 'version-radio';
        radioA.dataset.revisionId = li.dataset.revisionId || '';
        radioGroup.appendChild(radioA);

        const radioB = document.createElement('input');
        radioB.type = 'radio';
        radioB.name = 'versionB';
        radioB.className = 'version-radio';
        radioB.dataset.revisionId = li.dataset.revisionId || '';
        radioGroup.appendChild(radioB);
    });

    compareBtn.addEventListener('click', async () => {
        if (!isHistorySummaryFetched) {
            const tempPopup = createComparePopup();
            const tempResult = tempPopup.querySelector('#diff-results');
            tempResult.innerHTML = '正在获取修订历史摘要...（首次对比需加载，稍候）';

            try {
                await fetchHistorySummary();
                matchDomWithApiData();
                isHistorySummaryFetched = true;

                document.querySelectorAll('.version-radio').forEach(radio => {
                    const li = radio.closest('.groupsLine li');
                    radio.dataset.revisionId = li.dataset.revisionId || '';
                });

                tempPopup.remove();
            } catch (error) {
                tempResult.innerHTML = '';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'diff-error-section';
                errorDiv.innerHTML = `
                    <div class="diff-error-title">历史数据获取失败</div>
                    <p>${error.message}</p>
                `;
                tempResult.appendChild(errorDiv);
                return;
            }
        }

        const versionAId = document.querySelector('input[name="versionA"]:checked')?.dataset.revisionId;
        const versionBId = document.querySelector('input[name="versionB"]:checked')?.dataset.revisionId;

        if (versionAId && versionBId && versionAId !== versionBId) {
            compareVersions(versionAId, versionBId);
        } else if (versionAId === versionBId) {
            alert('请选择两个不同的修订版本');
        } else {
            alert('请先选中两个需要对比的修订版本');
        }
    });

})();
