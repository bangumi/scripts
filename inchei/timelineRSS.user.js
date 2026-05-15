// ==UserScript==
// @name         RSS订阅班友收藏
// @namespace    https://bgm.tv/group/topic/414787
// @homepage     https://bgm.tv/group/topic/414787
// @version      0.2.6
// @description  在班固米首页显示关注的班友的收藏RSS，我会一直看着你👁
// @author       oov
// @match        http*://bgm.tv/
// @match        http*://chii.in/
// @match        http*://bangumi.tv/
// @match        http*://bangumi.tv/user/*/timeline*
// @match        http*://bgm.tv/user/*/timeline*
// @match        http*://chii.in/user/*/timeline*
// @match        http*://bangumi.tv/user/*
// @match        http*://bgm.tv/user/*
// @match        http*://chii.in/user/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/524603
// @gadget       https://bgm.tv/dev/app/3526
// ==/UserScript==

/*
 * 兼容性：
 * - [加载更多](https://bgm.tv/dev/app/432)
 * - [筛选简评](https://bgm.tv/dev/app/2482)
 * - [绝对时间](https://bgm.tv/dev/app/3226)
 */

(async function () {
  'use strict';

  const style = document.createElement('style');
  const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
  style.textContent = css`
    .skeleton {
      background-color: #e0e0e0;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .skeleton::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    html[data-theme="dark"] .skeleton {
      background-color: #333;
    }
    html[data-theme="dark"] .skeleton::after {
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    }

    .avatar-skeleton {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    html[data-avatar-size="square"] .avatar-skeleton {
      border-radius: 8px;
    }
    .nickname-skeleton {
      width: min(8em, 50%);
      height: 16px;
      display: inline-block;
      vertical-align: middle;
    }
    .comment-skeleton {
      max-width: 500px;
      height: 32.4px;
      margin-top: 5px;
      margin-bottom: 5px;
      border-radius: 5px;
      border: 1px solid transparent;
    }
    .card-skeleton {
      max-width: 500px;
      height: 80px;
      border-radius: 10px;
      border: 1px solid transparent;
    }

    #home_rss button {
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      color: currentColor;
    }
    #home_rss .rssID-container {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      padding: 5px;
    }
    #home_rss .rssID {
      display: inline-block;
      background-color: #e0e0e0;
      padding-inline: 8px;
      padding-block: 4px;
      border-radius: 20px;
      font-size: 1em;
      user-select: text;
    }
    #home_rss .rssID:hover {
      background-color: #d0d0d0;
    }
    #home_rss .rssID.failed::after {
      background: linear-gradient(90deg, rgba(225, 80, 80, 0.5), transparent, rgba(225, 80, 80, 0.5));
      animation: none;
    }
    #home_rss .rssID-input {
      box-sizing: border-box;
      width: 100%;
      font-size: 12px;
      line-height: 100%;
    }
    #home_rss .import-button, .export-button {
      transition: opacity 0.2s ease;
      margin-left: .2em;
      font-size: 12px;
      opacity: .6;
    }
    #home_rss .import-button:hover, .export-button:hover {
      opacity: 1;
    }

    #home_rss .rssID-tooltip {
      position: absolute;
      background-color: rgba(254, 254, 254, 0.9);
      box-shadow: inset 0 1px 1px hsla(0, 0%, 100%, 0.3), inset 0 -1px 0 hsla(0, 0%, 100%, 0.1), 0 2px 4px hsla(0, 0%, 0%, 0.2);
      backdrop-filter: blur(5px);
      border-radius: 5px;
      padding: 5px;
      width: 200px;
      z-index: 1000;
      font-weight: normal;
      font-size: 12px;
      color: rgba(0, 0, 0, .7);
      display: flex;
      opacity: 0;
      gap: 10px;
    }
    #home_rss .info-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    #home_rss .info-container .nickname {
      font-size: 14px;
      font-weight: bold;
      width: fit-content;
    }
    #home_rss .info-container .last-update {
      font-size: 12px;
    }
    #home_rss .info-container .unsubscribe-button {
      color: rgb(255, 80, 80);
      font-size: 12px;
      opacity: .8;
      width: fit-content;
    }
    #home_rss .info-container .unsubscribe-button:hover {
      opacity: 1;
    }

    html[data-theme="dark"] #home_rss .rssID-container {
      background-color: #333;
    }
    html[data-theme="dark"] #home_rss .rssID {
      background-color: #555;
      color: #fff;
    }
    html[data-theme="dark"] #home_rss .rssID:hover {
      background-color: #666;
    }
    html[data-theme="dark"] #home_rss .rssID-tooltip {
      background-color: #333;
      color: rgba(255, 255, 255, .7);
    }
  `;
  document.head.appendChild(style);

  const [, locUser, locUserId, locTl] = location.pathname.split('/');
  const rssIdToUrl = (id) => `/feed/user/${id}/interests`;
  const lastDate = {};
  const rssCache = {};
  const menu = document.querySelector('#timelineTabs');
  const tmlContent = document.querySelector('#tmlContent');

  const RSS_LIST = locUserId ? [locUserId] : JSON.parse(localStorage.getItem('incheijs_rss_list') || '[]');
  const CONCURRENCY_LIMIT = 3;
  const TTL = 720; // 默认缓存时间（分钟）

  class LocalStorageWithExpiry {
    constructor() {
      this.prefix = 'incheijs_rss_'; // 分类前缀
      this.initialize();
    }

    // 初始化时清理过期项
    initialize() {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          const item = JSON.parse(localStorage.getItem(key));
          if (this.isExpired(item)) {
            localStorage.removeItem(key);
          }
        }
      });
    }

    isExpired(item) {
      return item && item.expiry && Date.now() > item.expiry;
    }

    setItem(category, key, value) {
      const storageKey = `${this.prefix}${category}_${key}`;
      const expiry = Date.now() + TTL * 60 * 1000;
      const item = { value, expiry };
      localStorage.setItem(storageKey, JSON.stringify(item));
    }

    getItem(category, key) {
      const storageKey = `${this.prefix}${category}_${key}`;
      const item = JSON.parse(localStorage.getItem(storageKey));
      if (this.isExpired(item)) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return item ? item.value : null;
    }

    removeItem(category, key) {
      const storageKey = `${this.prefix}${category}_${key}`;
      localStorage.removeItem(storageKey);
    }
  }
  const storage = new LocalStorageWithExpiry();
  let feedItems;

  if (!locUser) { // 首页
    const initDate = Date.now();

    // #region 右侧栏
    // #region 主体
    const rssIDHtml = () => /* html */RSS_LIST.map((id) => `
      <button class="rssID" id="rssID-${id}">${id}</button>
    `).join('');
    const sideInner = document.querySelector('.sideInner');
    sideInner.insertAdjacentHTML(
      'beforeend',
      /* html */`
      <div id="home_rss" class="halfPage">
        <div class="sidePanelHome">
          <h2 class="subtitle">RSS订阅
          <span style="font-size: 12px">
            <button class="import-button">📥导入</button>
            <button class="export-button">📤导出</button>
          </span>
          </h2>
          <div id="rss-list" class="rssID-container">
            ${rssIDHtml()}
          </div>
          <input type="text" class="rssID-input inputtext" placeholder="ID⏎">
        </div>
      </div>
    `);

    feedItems = await getFeedItems(RSS_LIST);

    const rssListContainer = document.getElementById('rss-list');
    const rssIDInput = rssListContainer.nextElementSibling;

    rssIDInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const id = rssIDInput.value.trim().replace(/\s+/g, ''); // 去除空格
        if (id) {
          if (!id || RSS_LIST.includes(id)) return;

          const rssID = document.createElement('button');
          rssID.className = 'rssID';
          rssID.id = `rssID-${id}`;
          rssID.textContent = id;
          rssListContainer.appendChild(rssID);

          RSS_LIST.push(id);
          addFeedItem(id);

          saveRSSList();
          rssIDInput.value = '';
        }
      }
    });

    const importButton = document.querySelector('.import-button');
    importButton.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const importedList = JSON.parse(event.target.result);
            if (Array.isArray(importedList)) {
              RSS_LIST.length = 0;
              RSS_LIST.push(...importedList);
              saveRSSList();

              const rssListContainer = document.getElementById('rss-list');
              rssListContainer.innerHTML = rssIDHtml();

              feedItems = await getFeedItems(RSS_LIST);
              refreshTab();
              window.chiiLib.ukagaka.presentSpeech('导入成功！', true);
            } else {
              window.chiiLib.ukagaka.presentSpeech('导入的文件格式不正确！');
            }
          } catch (error) {
            console.error('导入失败:', error);
            window.chiiLib.ukagaka.presentSpeech('导入失败，请检查文件格式！');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    const exportButton = document.querySelector('.export-button');
    exportButton.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(RSS_LIST, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'rss_list.json';
      a.click();

      URL.revokeObjectURL(url);
    });
    // #endregion

    // #region 悬浮用户信息
    const tooltip = document.createElement('div');
    tooltip.className = 'rssID-tooltip';
    tooltip.inert = true;

    let hideTimer = null;

    const showTooltip = async (target) => {
      const userId = target.textContent;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      target.after(tooltip);

      const userInfo = await fetchUserInfo(userId);
      const { avatar, nickname, link } = userInfo;
      await fetchRSS(userId);

      tooltip.innerHTML = /* html */`
        <a class="avatar" href="${link}"><span class="avatarNeue avatarReSize40 ll" style="background-image:url('${avatar}')"></span></a>
        <div class="info-container">
          <a href="${link}" class="nickname">${nickname}</a>
          <div class="last-update">最后更新：${timeDiffText(lastDate[userId])}</div>
          <button class="unsubscribe-button">取消订阅</button>
        </div>
      `;
      const unsubscribeButton = tooltip.querySelector('.unsubscribe-button');
      unsubscribeButton.addEventListener('click', () => {
        RSS_LIST.splice(RSS_LIST.indexOf(userId), 1);
        target.remove();
        feedItems = feedItems.filter(({ li }) => {
          return li().dataset.userId !== userId;
        });
        saveRSSList();
        refreshTab();
        hideTooltip();
      });

      const rect = target.getBoundingClientRect();
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      tooltip.style.left = `${Math.min(Math.max(window.scrollX + rect.left + rect.width / 2 - tooltip.offsetWidth / 2, window.scrollX), window.scrollX + window.innerWidth - scrollbarWidth - tooltip.offsetWidth)}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 5}px`;
      tooltip.style.opacity = '1';
      tooltip.inert = false;
    };

    const hideTooltip = () => {
      tooltip.style.opacity = '0';
      tooltip.inert = true;
    };

    const shouldHandleTooltip = e => e.target.classList.contains('rssID') && !e.target.classList.contains('failed');
    rssListContainer.addEventListener('mouseenter', (e) => {
      if (shouldHandleTooltip(e)) showTooltip(e.target);
    }, true);
    rssListContainer.addEventListener('click', async (e) => {
      if (shouldHandleTooltip(e)) showTooltip(e.target);
      if (e.target.classList.contains('rssID') && e.target.classList.contains('failed')) {
        e.target.classList.remove('failed');
        await addFeedItem(e.target.id.split('-').pop());
      }
    }, true);
    rssListContainer.addEventListener('mouseleave', (e) => {
      if (shouldHandleTooltip(e)) {
        hideTimer = setTimeout(() => {
          if (!tooltip.matches(':hover')) hideTooltip();
        }, 100);
      }
    }, true);
    tooltip.addEventListener('mouseenter', () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      tooltip.style.opacity = '1';
    });
    tooltip.addEventListener('mouseleave', hideTooltip);

    document.addEventListener('focusin', () => {
      if (!tooltip.contains(document.activeElement)) hideTooltip();
    });
    // #endregion
    // #endregion

    // #region 在原有的时间线上插入 RSS 项
    const shouldInsert = (focused) => ['tab_all', 'tab_subject'].includes(focused.id) || focused.textContent === '简评';
    let feedItemsCopy;
    let originalToRSSLis;
    const resetInsert = () => {
      feedItemsCopy = [...feedItems];
      originalToRSSLis = {};
    };
    resetInsert();

    function insertRSSItems(feedItemsCopy, originalItems, insDate) {
      const rssItems = [...feedItemsCopy];

      originalItems.forEach((originalLi) => {
        const lisToLazyLoad = originalToRSSLis[originalLi.id] ?? [];
        const liEles = lisToLazyLoad.map(li => li(insDate));

        const titleTip = originalLi.querySelector('.titleTip');
        const timeStr = titleTip.dataset.originalTitle
          ?? titleTip.title // 兼容筛选简评
          ?? titleTip.textContent; // 兼容绝对时间
        const originalTime = +new Date(...(a => (a.splice(1, 1, a[1] - 1), a))(timeStr.match(/\d+/g)));

        if (liEles.length > 0) {
          originalLi.before(...liEles);
        } else {
          while (rssItems.length > 0 && rssItems[0].date > originalTime) {
            const { li } = rssItems.shift();
            const liEle = li(insDate);
            originalLi.before(liEle);
            lisToLazyLoad.push(li);
            liEles.push(liEle);
          }
          originalToRSSLis[originalLi.id] = lisToLazyLoad;
        }

        lazyLoadLis(liEles);
      });

      return rssItems;
    }

    // 初始
    if (shouldInsert(document.querySelector('#timelineTabs .focus'))) {
      feedItemsCopy = insertRSSItems(feedItemsCopy, [...document.querySelectorAll('#timeline li')], initDate);
    }

    // #region 翻页
    let observePaging = true;
    tmlContent.addEventListener('click', (e) => {
      if (!observePaging || !e.target.classList.contains('p')) return;
      const text = e.target.textContent;

      let toObserve, getLis;
      if (['下一页 ››', '‹‹上一页'].includes(text)) {
        toObserve = tmlContent;
        getLis = (addedNodes) => [...addedNodes].find((node) => node.id === 'timeline')?.querySelectorAll(':scope li');
      } else if (['加载更多', '再来点'].includes(text)) { // 兼容加载更多、筛选简评
        toObserve = document.querySelector('#timeline');
        getLis = (addedNodes) => [...addedNodes].filter((node) => node.tagName === 'UL').flatMap((ul) => [...ul.children]);
      } else {
        return;
      }

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const { addedNodes } = mutation;
          const addedLis = getLis(addedNodes);
          if (!addedLis || addedLis.length === 0) continue;
          observer.disconnect();
          feedItemsCopy = insertRSSItems(feedItemsCopy, addedLis);
        }
      });
      observer.observe(toObserve, { childList: true });
    }, true);
    //#endregion

    // #region 切换Tab
    let loadedObserver, currentResolve, loaded;
    const initLoadedObserver = () => {
      if (loadedObserver) return;
      loadedObserver = new MutationObserver((mutations) => {
        if (loaded(mutations)) {
          loadedObserver.disconnect();
          currentResolve();
          currentResolve = null;
        }
      });
    };
    menu.addEventListener('click', async (e) => {
      loadedObserver?.disconnect();
      observePaging = shouldInsert(e.target);
      if (e.target.tagName !== 'A' || !observePaging) return;
      await (new Promise(resolve => {
        currentResolve = resolve;
        initLoadedObserver();
        let toObserve = tmlContent;
        if (e.target.textContent === '简评') { // 兼容筛选简评
          toObserve = tmlContent.firstElementChild;
          loaded = (mutations) => mutations.some(mutation => [...mutation.addedNodes].some(node => node.tagName === 'UL'));
        } else {
          loaded = (mutations) => mutations.some(mutation => [...mutation.removedNodes].some(node => node.classList?.contains('loading')));
        }
        loadedObserver.observe(toObserve, { childList: true });
      }));
      const originalItems = document.querySelectorAll('#timeline li');
      resetInsert();
      feedItemsCopy = insertRSSItems(feedItemsCopy, originalItems);
    }, true);
    // #endregion
    // #endregion
  }

  if (locUser) { // 时光机或时间胶囊
    document.querySelector('a[href^="/feed/"]').addEventListener('click', e => {
      e.preventDefault();
      saveRSSList([...new Set(JSON.parse(localStorage.getItem('incheijs_rss_list') || '[]')).add(locUserId)]);
      window.chiiLib.ukagaka.presentSpeech('订阅成功！', true);
    });
  }

  if (!locUser || locTl) { // 首页或时间胶囊
    // #region RSS Tab
    const rssTab = document.createElement('li');
    rssTab.innerHTML = '<a href="javascript:">RSS</a>';
    menu.appendChild(rssTab);

    rssTab.addEventListener('click', async () => {
      tmlContent.innerHTML = '<div class="loading"><img src="/img/loadingAnimation.gif"></div>';
      [...menu.querySelectorAll(':scope a.focus')].forEach((e) => e.classList.remove('focus'));
      rssTab.querySelector('a').className = 'focus';

      if (!feedItems) { // 时间胶囊点击后再加载
        feedItems = await getFeedItems(RSS_LIST);
      }
      let feedLisCopy = [...feedItems];
      let currentDate = null;

      tmlContent.innerHTML = '';
      const timeline = document.createElement('div');
      timeline.id = 'timeline';
      tmlContent.appendChild(timeline);

      if (feedLisCopy.length > 20) {
        const pager = document.createElement('div');
        pager.id = 'tmlPager';
        pager.innerHTML = '<div class="page_inner"><a class="p loadmoreBtn" style="cursor: pointer;">再来点</a></div>';
        tmlContent.appendChild(pager);

        const loadMoreBtn = pager.querySelector('.loadmoreBtn');
        loadMoreBtn.addEventListener('click', () => {
          appendLis();
          if (!feedLisCopy.length) {
            loadMoreBtn.style.display = 'none';
            pager.insertAdjacentHTML('beforeend', '<li style="text-align:center;list-style:none">到底啦</li>');
          }
        });
      }

      appendLis();

      function appendLis() {
        const toAppend = feedLisCopy.slice(0, 20);
        const frag = document.createDocumentFragment();
        let ul = document.createElement('ul');
        frag.appendChild(ul);

        for (const { li, date } of toAppend) {
          const dateobj = new Date(date);
          dateobj.setHours(0, 0, 0, 0);
          const liElem = li();
          if (currentDate === dateobj.getTime()) {
            ul.appendChild(liElem);
          } else {
            currentDate = dateobj.getTime();
            const h4 = document.createElement('h4');
            h4.className = 'Header';
            h4.textContent = getDateLabel(dateobj);
            ul = document.createElement('ul');
            ul.appendChild(liElem);
            frag.append(h4, ul);
          }
          lazyLoadLis([liElem]);
        }

        timeline.append(frag);
        feedLisCopy = feedLisCopy.slice(20);
      }
    });
    // #endregion
  }

  // #region 工具函数
  function saveRSSList(list = RSS_LIST) {
    localStorage.setItem('incheijs_rss_list', JSON.stringify(list));
  }

  function lazyLoadLis(lis) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const li = entry.target;
            loadLazyContent(li);
            observer.unobserve(li);
          }
        });
      },
      { threshold: 0.1 }
    );
    lis.forEach((li) => {
      observer.observe(li);
      $(li.querySelector('span.titleTip')).tooltip({
        offset: 0,
        container: '#timeline'
      });
    });
  }

  function createSubjectCard(collectionData) {
    const { subject } = collectionData;
    if (!subject) return '';
    const { id, name, name_cn, date, images, volumes, eps, score, rank, collection_total } = subject;

    let formattedDate = '';
    if (date) {
      // 去掉个位数日期前面的 0
      const [year, month, day] = date.split('-');
      formattedDate = `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    const cardHTML = /* html */`
      <div class="card">
        <div class="container">
          <a href="https://bgm.tv/subject/${id}">
            <span class="cover">
              <img src="${images.large}" loading="lazy">
            </span>
          </a>
          <div class="inner">
            <p class="title">
              <a href="https://bgm.tv/subject/${id}">${name_cn || name} <small class="subtitle grey">${name_cn ? name : ''}</small></a>
            </p>
            <p class="info tip">${eps ? `${eps}话` : volumes ? `${volumes}卷` : ''}
            ${(eps || volumes) && formattedDate ? ' / ' : ''}
            ${formattedDate ?? ''}</p>
            <p class="rateInfo">
              ${rank !== 0 ? `<span class="rank">#${rank}</span>` : ''}
              ${score !== 0 ? `<span class="starstop-one"><span class="starlight stars${Math.round(score)}"></span></span>` : ''}
              ${score !== 0 ? `<small class="fade">${score}</small>` : ''}
              ${collection_total !== 0 ? `<small class="rate_total">(${collection_total})</small>` : ''}
            </p>
          </div>
        </div>
      </div>
    `;

    return cardHTML;
  }

  async function loadLazyContent(li) {
    const userId = li.dataset.userId;
    const subjectId = li.dataset.subjectId;

    const avatarContainer = li.querySelector('.avatar');
    const nicknameContainer = li.querySelector('.nickname-skeleton');
    const commentContainer = li.querySelector('.comment-skeleton');
    const cardContainer = li.querySelector('.card-skeleton');

    if (!locUser) {
      const userInfo = await fetchUserInfo(userId);
      const { avatar, nickname, link } = userInfo;

      if (avatarContainer) avatarContainer.innerHTML = `
        <a href="${link}" class="avatar">
          <span class="avatarNeue avatarReSize40 ll" style="background-image:url('${avatar}')"></span>
        </a>
      `;
      if (nicknameContainer) nicknameContainer.outerHTML = `
        <a href="${link}" class="l">${nickname}</a>
      `;
    }

    const collectionInfo = await fetchUserCollection(userId, subjectId);
    const { rate, comment } = collectionInfo;

    if (!comment && document.querySelector('#timelineTabs .focus').textContent === '简评') {
      li.remove();
      return;
    }

    if (commentContainer) commentContainer.outerHTML = `
      ${comment ? '<div class="comment">' : ''}
        ${rate !== null ? `<span class="starstop-s"><span class="starlight stars${rate}"></span></span>` : ''}
        ${comment || ''}
      ${comment ? '</div>' : ''}
    `;

    const cardHTML = createSubjectCard(collectionInfo);
    if (cardContainer) cardContainer.outerHTML = cardHTML;
  }

  function refreshTab() {
    document.querySelector('#timelineTabs .focus')?.click();
  }

  async function getFeedItems(rssList) {
    const feedItems = [];

    // 并发获取 RSS 数据
    if (!locUser) {
      for (const id of rssList) {
        const button = document.querySelector(`#rssID-${id}`);
        button.classList.add('skeleton');
      }
    }
    const rssPromises = rssList.map((rss) => fetchRSS(rss));
    const rssResults = await runWithConcurrency(rssPromises, CONCURRENCY_LIMIT);

    // 解析 RSS 数据
    for (const rssText of rssResults) {
      if (!rssText) continue;

      const parser = new DOMParser();
      const rssDoc = parser.parseFromString(rssText, 'text/xml');

      const userLink = rssDoc.querySelector('channel > link').textContent;
      const userId = userLink.split('/').pop();

      const items = rssDoc.querySelectorAll('item');

      for (const item of items) {
        const title = item.querySelector('title').textContent;
        const subjectLink = item.querySelector('link').textContent;
        const subjectID = subjectLink.split('/').pop();
        const pubDate = item.querySelector('pubDate').textContent;

        const date = +new Date(pubDate);

        const [prefix, ...rest] = title.split(':');
        const titleText = rest.join(':');

        const li = (insDate) => {
          const liEle = document.createElement('li');
          liEle.className = 'clearit tml_item';
          liEle.innerHTML = /* html */`
          ${!locUser ? `
            <span class="avatar">
              <div class="avatar-skeleton skeleton"></div>
            </span>` : ''
  }
            <span class="info${locUser ? '_full' : ''} clearit">
              ${!locUser ? '<div class="nickname-skeleton skeleton"></div>' : ''}
              ${prefix} <a href="${subjectLink}" class="l">${titleText}</a>
              <div class="collectInfo">
                <div class="comment-skeleton skeleton"></div>
              </div>
              <div class="card-skeleton skeleton"></div>
              <div class="post_actions date">
                <span title="" class="titleTip" data-original-title="${formatTimestamp(date)}">${timeDiffText(date, insDate)}</span> · RSS
              </div>
            </span>
          `;

          liEle.dataset.userId = userId;
          liEle.dataset.subjectId = subjectID;

          return liEle;
        };

        feedItems.push({ li, date });
      }
    }

    // 按日期从新到旧排序
    feedItems.sort((a, b) => b.date - a.date);

    return feedItems;
  }

  async function fetchRSS(id) {
    const cachedRSS = rssCache[id];
    const button = document.querySelector(`#rssID-${id}`);
    if (cachedRSS) {
      button?.classList.remove('skeleton');
      return cachedRSS;
    }

    try {
      const response = await fetch(rssIdToUrl(id));
      if (!response.ok) throw new Error(`RSS fetch ${response.status}`);
      button?.classList.remove('skeleton');
      const rssText = await response.text();
      rssCache[id] = rssText;

      // 解析 RSS 获取最后更新时间
      const parser = new DOMParser();
      const rssDoc = parser.parseFromString(rssText, 'text/xml');
      lastDate[id] = +new Date(rssDoc.querySelector('item pubDate')?.textContent);

      return rssText;
    } catch (error) {
      console.error(id, '获取 RSS 失败:', error);
      button?.classList.add('failed');
      return null;
    }
  }

  async function addFeedItem(id) {
    const newItems = await getFeedItems([id]);
    feedItems = [...feedItems, ...newItems];
    feedItems.sort((a, b) => b.date - a.date);
    refreshTab();
  }

  async function fetchUserInfo(userId) {
    const cacheKey = `incheijs_rss_user_${userId}`;
    const cachedUserInfo = sessionStorage.getItem(cacheKey);
    if (cachedUserInfo) {
      return JSON.parse(cachedUserInfo);
    }

    try {
      const response = await fetch(`https://api.bgm.tv/v0/users/${userId}`);
      if (!response.ok) throw new Error(`UserInfo fetch ${response.status}`);
      const userData = await response.json();
      const userInfo = {
        avatar: userData.avatar.large,
        nickname: userData.nickname,
        link: `/user/${userId}`,
      };

      sessionStorage.setItem(cacheKey, JSON.stringify(userInfo));
      return userInfo;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        avatar: '//lain.bgm.tv/pic/user/l/icon.jpg',
        nickname: userId,
        link: `/user/${userId}`,
      };
    }
  }

  async function fetchUserCollection(userId, subjectId) {
    const cacheKey = `${userId}_${subjectId}`;
    const cachedCollection = storage.getItem('collection', cacheKey);
    if (cachedCollection) return cachedCollection;

    try {
      const response = await fetch(`https://api.bgm.tv/v0/users/${userId}/collections/${subjectId}`);
      if (!response.ok) throw new Error(`Collection fetch ${response.status}`);
      const collectionData = await response.json();
      const collectionInfo = {
        rate: collectionData.rate || null,
        comment: collectionData.comment || '',
        subject: collectionData.subject || null,
      };

      storage.setItem('collection', cacheKey, collectionInfo);
      return collectionInfo;
    } catch (error) {
      console.error('获取收藏信息失败:', error);
      return {
        rate: null,
        comment: '',
      };
    }
  }

  async function runWithConcurrency(reqs = [], num = 2, maxRetries = 3) {
    const results = [];
    if (!reqs.length) return results;

    await Promise.all(
      Array.from({ length: num }, async () => {
        while (reqs.length) {
          let retries = 0;
          let result;
          let success = false;
          while (retries < maxRetries && !success) {
            try {
              result = await reqs.shift();
              results.push(result);
              success = true;
            } catch (e) {
              retries++;
              console.error(`请求失败${retries < maxRetries ? `，正在进行第 ${retries} 次重试` : '，已达到最大重试次数'}:`, e);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      })
    );
    return results;
  }

  function timeDiffText(timestamp, now = Date.now()) {
    const diff = now - timestamp;

    if (diff < 1000) {
      return '刚刚';
    }

    const units = [
      { unit: '年', ms: 365 * 24 * 60 * 60 * 1000 },
      { unit: '个月', ms: 30 * 24 * 60 * 60 * 1000 }, // 近似值：1个月 ≈ 30天
      { unit: '天', ms: 24 * 60 * 60 * 1000 },
      { unit: '小时', ms: 60 * 60 * 1000 },
      { unit: '分钟', ms: 60 * 1000 },
      { unit: '秒', ms: 1000 },
    ];

    let remaining = diff;
    const result = [];

    for (let i = 0; i < units.length; i++) {
      const { unit, ms } = units[i];
      const value = Math.floor(remaining / ms);

      if (value > 0) {
        result.push(`${value}${unit}`);
        remaining -= value * ms;
      }

      if (result.length >= 2) break; // 最多显示两个单位
    }

    // 如果包含“秒”，则将“分钟”改为“分”
    const hasSeconds = result.some(item => item.includes('秒'));
    if (hasSeconds) {
      result[0] = result[0].replace('分钟', '分');
    }

    return result.join('') + '前';
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // 格式化时间为 "YYYY-M-D HH:mm"
    return `${year}-${month}-${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  function getDateLabel(dateobj) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateobj.getTime() === today.getTime()) {
      return '今天';
    } else if (dateobj.getTime() === yesterday.getTime()) {
      return '昨天';
    } else {
      return YYYYMMDD(dateobj);
    }
  }

  function YYYYMMDD(dateobj) {
    const year = dateobj.getFullYear();
    const month = dateobj.getMonth() + 1;
    const day = dateobj.getDate();
    return `${year}-${month}-${day}`;
  }
  // #endregion

})();
