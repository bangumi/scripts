// ==UserScript==
// @name         维基修订历史对比差异补完
// @namespace    bangumi.wiki.mono.diff
// @version      0.1.1
// @description  显示人物/角色、条目-条目、人物/角色-*维基修订历史差异，可恢复版本
// @author       you
// @homepage     https://bgm.tv/group/topic/448515
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/character/*/edit
// @match        http*://bangumi.tv/character/*/edit
// @match        http*://chii.in/character/*/edit
// @match        http*://bgm.tv/character/*/upload_img
// @match        http*://bangumi.tv/character/*/upload_img
// @match        http*://chii.in/character/*/upload_img
// @match        http*://bgm.tv/character/*/add_related/*
// @match        http*://bangumi.tv/character/*/add_related/*
// @match        http*://chii.in/character/*/add_related/*
// @match        http*://bgm.tv/character/*/add_related/person/*
// @match        http*://bangumi.tv/character/*/add_related/person/*
// @match        http*://chii.in/character/*/add_related/person/*
// @match        http*://bgm.tv/person/*/edit
// @match        http*://bangumi.tv/person/*/edit
// @match        http*://chii.in/person/*/edit
// @match        http*://bgm.tv/person/*/upload_img
// @match        http*://bangumi.tv/person/*/upload_img
// @match        http*://chii.in/person/*/upload_img
// @match        http*://bgm.tv/person/*/add_related/character/*
// @match        http*://bangumi.tv/person/*/add_related/character/*
// @match        http*://chii.in/person/*/add_related/character/*
// @match        http*://bgm.tv/subject/*/add_related/subject/*
// @match        http*://bangumi.tv/subject/*/add_related/subject/*
// @match        http*://chii.in/subject/*/add_related/subject/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.min.js
// @require      https://cdn.jsdmirror.com/npm/diff2html/bundles/js/diff2html-ui-base.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.0/jquery.fancybox.min.js
// @resource      DIFF2HTML_CSS https://cdn.jsdmirror.com/npm/diff2html/bundles/css/diff2html.min.css
// @resource      FANCYBOX_CSS https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.0/jquery.fancybox.min.css
// @connect      next.bgm.tv
// @connect      lain.bgm.tv
// @license      MIT
// @updateURL    https://github.com/bangumi/scripts/raw/master/inchei/wikiMonoDiff.user.js
// ==/UserScript==

/* 测试用
 * https://chii.in/character/1/add_related/person/anime
 * https://chii.in/character/1/add_related/anime
 * https://chii.in/subject/9622/add_related/subject/anime
 * https://chii.in/person/3818/add_related/character/anime
*/

(function () {
  'use strict';

  const pathname = location.pathname;
  const monoId = pathname.split('/')[2];
  if (!/\d+/.test(monoId)) return;

  const monosCN = {
    characters: '角色',
    persons: '人物',
    subjects: '条目',
  };
  const mono = pathname.split('/')[1];
  const monos = `${mono}s`; // characters | persons | subjects

  const typeCN = typeID => ['书籍', '动画', '音乐', '游戏', '', '三次元'][typeID - 1];
  const typeEN = typeID => ['book', 'anime', 'music', 'game', '', 'real'][typeID - 1];
  const isRelating = pathname.includes('add_related');
  const apiBaseAffix = isRelating ? `/${
    pathname.includes('/add_related/person') ? 'casts' :
      pathname.includes('/add_related/character') ? 'casts' :
        pathname.includes('/add_related/subject') ? 'relations' : 'subjects'
  }` : '';
  const relatingCast = apiBaseAffix === '/casts';
  const relatedType = isRelating ? ({
    anime: 2,
    book: 1,
    music: 3,
    game: 4,
    real: 6,
  })[document.querySelector('.selected').href.split('/').pop()] : null;
  const relatingEditor = document.querySelector('#crtRelateSubjects');
  const typeMapping = unsafeWindow.genPrsnStaffList ? [...genPrsnStaffList().matchAll(/value="(\d+)">([^</\s]+)/g)]
    .reduce((acc, [, k, v]) => {
      acc[k] = v;
      return acc;
    }, {}) : {};

  const groupsLine = document.querySelector('.groupsLine');
  const simpleSidePanel = document.querySelector('.SimpleSidePanel');
  if (!groupsLine || !simpleSidePanel) return;

  const revisionCache = new Map();
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
        .revision-compare-h2 {
            position: sticky;
            top: 0;
            background: var(--dollars-bg);
        }
        html[data-nav-mode="fixed"] .revision-compare-h2 {
            top: 60px;
        }
        .revision-radio {
            cursor: pointer;
        }
        .revision-radio-group {
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
        .SimpleSidePanel:not(:has(input[name="revisionA"]:checked):has(input[name="revisionB"]:checked)) .compare-btn {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
        .revision-radio-group:has(input[name="revisionA"]:checked) input[name="revisionB"],
        .revision-radio-group:has(input[name="revisionB"]:checked) input[name="revisionA"] {
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
    const LIMIT = 100;
    let allData = [];

    // 先获取第一页知道总数
    const firstPage = await fetchPage(0);
    const total = firstPage.total || 0;
    const totalPages = Math.ceil(total / LIMIT);

    allData.push(...firstPage.data);

    // 并行获取剩余页面
    const pagePromises = [];
    for (let page = 1; page < totalPages; page++) {
      pagePromises.push(fetchPage(page));
    }

    const results = await Promise.all(pagePromises);
    results.forEach(result => {
      allData.push(...result.data);
    });

    historySummaryData = allData;

    async function fetchPage(pageNum) {
      const url = `https://next.bgm.tv/p1/wiki/${monos}/${monoId}${apiBaseAffix}/history-summary?limit=${LIMIT}&offset=${pageNum * LIMIT}`;

      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              resolve(JSON.parse(response.responseText));
            } else {
              reject(new Error(`HTTP ${response.status}`));
            }
          },
          onerror: reject
        });
      });
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

  async function extractRevisionData(revisionId) {
    if (!revisionId) throw new Error('无效的修订ID');

    const cacheKey = `revision_${revisionId}`;
    if (revisionCache.has(cacheKey)) {
      return revisionCache.get(cacheKey);
    }

    const apiUrl = `https://next.bgm.tv/p1/wiki/${monos}/-${apiBaseAffix}/revisions/${revisionId}`;
    try {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: apiUrl,
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              const resData = JSON.parse(response.responseText);
              const wikiPayload = resData || {};
              let typeID;
              if (isRelating) {
                const relatedMono =
                                    pathname.includes('/add_related/person') ? 'person' :
                                      pathname.includes('/add_related/character') ? 'character' : null;
                wikiPayload.sort((a, b) => {
                  const subjectSort = a.subject.id - b.subject.id;
                  if (subjectSort === 0 && relatedMono) {
                    return a[relatedMono].id - b[relatedMono].id;
                  }
                  return subjectSort;
                });

                typeID = resData[0].subject.typeID;
                const revertBtn = document.querySelector(`[data-revision-id="${revisionId}"] .revertBtn`);
                revertBtn?.insertAdjacentText('beforebegin', `${typeCN(typeID)} `);
                if (typeID !== relatedType) revertBtn?.remove();
              }

              const result = {
                raw: wikiPayload,
                img: resData.extra?.img,
                typeID,
              };
              revisionCache.set(cacheKey, result);
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

  const updateCaption = async (fullUrl, thumbElement, labelElement, labelText) => {
    if (!fullUrl) return;

    const img = new Image();
    img.onload = () => {
      const size = `${img.width}×${img.height}`;
      thumbElement.dataset.caption = `${labelText} - ${size}`;
      labelElement.textContent = `${labelText} (${size})`;
    };
    img.src = fullUrl;
  };

  function createImgCompareSection(imgA, imgB) {
    if ((!imgA && !imgB) || imgA === imgB) return null;

    const imgFullUrlA = imgA ? `//lain.bgm.tv/pic/crt/l/${imgA}` : '';
    const imgFullUrlB = imgB ? `//lain.bgm.tv/pic/crt/l/${imgB}` : '';
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
        return '<div class="img-placeholder">无图片</div>';
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

    const oldLink = section.querySelector('[data-caption="旧"]');
    const newLink = section.querySelector('[data-caption="新"]');
    const oldLabel = section.querySelector('.img-compare-item:first-child .img-compare-label');
    const newLabel = section.querySelector('.img-compare-item:last-child .img-compare-label');

    if (imgFullUrlA && oldLink && oldLabel) {
      updateCaption(imgFullUrlA, oldLink, oldLabel, '旧');
    }
    if (imgFullUrlB && newLink && newLabel) {
      updateCaption(imgFullUrlB, newLink, newLabel, '新');
    }

    return section;
  }

  function createComparePopup() {
    const existing = document.querySelector('#wikiMonoDiff');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'wikiMonoDiff';
    popup.innerHTML = `
            <div class="diff-tip-header">
                <h3 class="diff-tip-title">${monosCN[monos]}修订历史对比</h3>
                <button class="diff-tip-close">&times;</button>
            </div>
            <div class="diff-tip-content">
                ${ isRelating ? `
                <div class="diff-warning-section">
                    <div class="diff-warning-title">注意</div>
                    <p>两次修订间差异不完全等于新修订造成的差异，期间反向关联带来的差异也会显示</p>
                </div>` : `
                <div class="diff-warning-section">
                    <div class="diff-warning-title">注意</div>
                    <p>受限于系统，肖像总落后于实际版本一个版本，欲查看肖像变化，请参考新一个版本（<a class="l" href="https://bgm.tv/group/topic/448054" target="_blank">参考</a>）</p>
                </div>
                `}
                <div id="diff-results">请选择两个版本进行对比</div>
            </div>
        `;
    document.body.appendChild(popup);
    popup.querySelector('.diff-tip-close').addEventListener('click', () => popup.remove());
    return popup;
  }

  async function compareRevisions(revisionIdA, revisionIdB) {
    const popup = createComparePopup();
    const resultContainer = popup.querySelector('#diff-results');
    resultContainer.innerHTML = '正在获取并对比数据...';

    try {
      const [revisionA, revisionB] = await Promise.all([
        extractRevisionData(revisionIdA),
        extractRevisionData(revisionIdB)
      ]);

      if (!window.Diff || !window.Diff2HtmlUI) {
        throw new Error('对比库加载失败，请刷新页面');
      }

      resultContainer.innerHTML = '';

      if (isRelating) {
        const typeA = revisionA.typeID;
        const typeB = revisionB.typeID;
        if (typeA && typeB && typeA !== typeB) {
          throw new Error(`版本类型不一致，无法进行对比
当前版本类型：左侧${typeCN(typeA)}，右侧${typeCN(typeB)}`);
        }
        if (typeA !== relatedType && unsafeWindow.genPrsnStaffList) {
          document.querySelector('#diff-results').insertAdjacentHTML('beforebegin', `
                    <div class="diff-warning-section">
                        <div class="diff-warning-title">注意</div>
                        <p>对比类型与当前关联类型不一致，无法获取关联中文，欲查看关联中文，请切换至<a href="${
  location.pathname.replace(/(book|anime|music|game|real)$/, typeEN(typeA))
  }" class="l" target="_blank">${typeCN(typeA)}关联</a></p>
                    </div>
                    `);
        }
      } else {
        const imgCompareSection = createImgCompareSection(revisionA.img, revisionB.img);
        if (imgCompareSection) {
          resultContainer.appendChild(imgCompareSection);
        }
      }

      const diffContainer = document.createElement('div');
      resultContainer.appendChild(diffContainer);

      const theme = document.documentElement.dataset.theme || 'light';
      const diffStr = window.Diff.createPatch(
        '修订对比（旧 ↔ 新）',
        getCompareText(revisionIdA),
        getCompareText(revisionIdB)
      );

      new window.Diff2HtmlUI(diffContainer, diffStr, {
        highlight: false,
        drawFileList: false,
        fileListToggle: false,
        fileContentToggle: false,
        colorScheme: theme === 'dark' ? 'dark' : 'light',
        matching: 'lines',
        outputFormat: unsafeWindow.innerWidth < 640 ? 'line-by-line' : 'side-by-side',
      }).draw();
    } catch (error) {
      console.error(error);
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

  const h2Element = document.querySelector('.SimpleSidePanel h2:not(.alert)');
  if (!h2Element) return;

  const nameInput = document.querySelector('[name="crt_name"]');
  const infoboxInput = document.querySelector('#subject_infobox');
  const summaryInput = document.querySelector('#crt_summary');
  const editSummaryInput = document.querySelector('#editSummary');

  h2Element.classList.add('revision-compare-h2');
  const compareBtn = document.createElement('a');
  compareBtn.className = 'l compare-btn';
  compareBtn.textContent = '对比选中版本';
  h2Element.appendChild(compareBtn);

  const revisionItems = document.querySelectorAll('.groupsLine li');
  revisionItems.forEach(li => {
    const radioGroup = document.createElement('div');
    radioGroup.className = 'revision-radio-group';
    li.prepend(radioGroup);

    const createRadio = (id) => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = id;
      radio.className = 'revision-radio';
      radio.dataset.revisionId = li.dataset.revisionId || '';
      return radio;
    };

    radioGroup.append(createRadio('revisionA'), createRadio('revisionB'));

    const revertBtn = document.createElement('a');
    revertBtn.classList.add('l', 'revertBtn');
    revertBtn.href = 'javascript:';
    revertBtn.textContent = '恢复';
    revertBtn.addEventListener('click', async () => {
      document.querySelectorAll('.revertBtn').forEach(b => {
        b.style.pointerEvents = 'none';
        b.style.opacity = '.6';
      });
      revertBtn.textContent = '加载中...';
      try {
        if (!isHistorySummaryFetched) {
          await fetchHistorySummary();
          matchDomWithApiData();
          isHistorySummaryFetched = true;
          document.querySelectorAll('.revision-radio').forEach(radio => {
            const li = radio.closest('.groupsLine li');
            radio.dataset.revisionId = li.dataset.revisionId || '';
          });
        }

        const revisionLi = revertBtn.closest('.groupsLine li');
        const revisionId = revisionLi.dataset.revisionId;
        const revision = await extractRevisionData(revisionId);
        const revisionObj = revision.raw;

        if (isRelating) {
          if (relatedType !== revision.typeID) {
            const message = `版本类型${typeCN(revision.typeID)}与当前不一致`;
            alert(message);
            throw new Error(message);
          }
          relatingEditor.innerHTML = '';
          addedSubjects = [];
          const otherMono = relatingCast ? (mono === 'person' ? 'character' : 'person') : null;
          subjectList = relatingCast ? revisionObj.reduce((l, o) => {
            const s = o.subject;
            const p = o[otherMono];
            l[p.id] ??= {
              id: p.id,
              img: '',
              name: p.name,
              name_cn: p.nameCN,
              relatSubjects: [],
              url_mod: mono,
            };
            l[p.id].relatSubjects.push({
              id: s.id,
              img: '',
              name: s.name,
              name_cn: s.nameCN,
              type_id: relatedType,
              url_mod: 'subject',
            });
            return l;
          }, {}) : revisionObj.map(o => ({
            id: o.subject.id,
            type_id: relatedType,
            name: o.subject.name,
            name_cn: o.subject.nameCN,
            url_mod: 'subject',
          }));

          if (relatingCast) {
            for (const [pid, p] of Object.entries(subjectList)) {
              const subjects = p.relatSubjects;
              for (let i = 0; i < subjects.length; i++) {
                const sid = subjects[i].id;
                const data = revisionObj.find(o => o.subject.id == sid && o[otherMono].id == pid);
                addRelateSubject(`${pid},${i}`, 'submitForm');
                afterAdd(data);
              }
            }
          } else {
            for (let i = 0; i < subjectList.length; i++) {
              addRelateSubject(i, 'submitForm');
              afterAdd(revisionObj[i]);
            }
          }
        } else {
          nameInput.value = revisionObj.name;
          summaryInput.value = revisionObj.summary;

          if (nowmode === 'normal') {
            NormaltoWCODE();
            infoboxInput.value = revisionObj.infobox;
            WCODEtoNormal();
          } else if (document.querySelector('.wiki-enhance-editor')) {
            unsafeWindow.monaco?.editor.getEditors()?.[0].setValue(revisionObj.infobox);
          } else {
            infoboxInput.value = revisionObj.infobox;
          }
        }

        editSummaryInput.value = `恢复版本${revisionId}（${
          revisionLi.querySelector('small').textContent.split(' / ')[0].trim() // 时间
        }）`;
        revertBtn.textContent = '已恢复';
        setTimeout(() => {
          revertBtn.textContent = '恢复';
        }, 2000);
      } catch (error) {
        console.error(error);
        revertBtn.textContent = '恢复失败，点击重试';
        return;
      } finally {
        document.querySelectorAll('.revertBtn').forEach(b => {
          b.style.pointerEvents = 'auto';
          b.style.opacity = '1';
        });
      }
    });
    li.querySelector('small').append(document.createTextNode(' / '), revertBtn);
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

        document.querySelectorAll('.revision-radio').forEach(radio => {
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

    const revisionAId = document.querySelector('input[name="revisionA"]:checked')?.dataset.revisionId;
    const revisionBId = document.querySelector('input[name="revisionB"]:checked')?.dataset.revisionId;

    if (revisionAId && revisionBId && revisionAId !== revisionBId) {
      compareRevisions(revisionAId, revisionBId);
    } else if (revisionAId === revisionBId) {
      alert('请选择两个不同的修订版本');
    }
  });

  function afterAdd(data) {
    const li = relatingEditor.firstChild;
    const select = li.querySelector('select');
    data.type && (select.value = data.type);
    if (!isNaN(data.order)) {
      if (!document.querySelector('#modifyOrder')) return;
      let sort = li.querySelector('.item_sort');
      if (!sort) {
        const prefix = select.name?.match(/^(infoArr\[[^\]]+\])/)?.[1];
        select.insertAdjacentHTML('afterend',
          `<input type="text" name="${prefix}[order]" value="0" class="inputtext item_sort" onfocus="this.select()" onmouseover="this.focus()" autocomplete="off" style="display: inline-block;">`
        );
        sort = li.querySelector('.item_sort');
      }
      sort.value = data.order;
    }
  }

  function getCompareText(revisionId) {
    const cacheKey = `revision_${revisionId}`;
    const revision = revisionCache.get(cacheKey);
    if (!revision) return '';
    if (revision.compareText) return revision.compareText;
    const raw = revision.raw;
    if (isRelating) {
      for (const o of raw) {
        delete o.subject.typeID;
        o.type &&= typeMapping[o.type] || o.type;
      }
    }
    revision.compareText = JSON.stringify(raw, null, 2).replaceAll('\\r', '').replaceAll('\\n', '\n');
    revisionCache.set(cacheKey, revision);
    return revision.compareText;
  }

})();
