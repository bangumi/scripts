// ==UserScript==
// @name         首页RSS订阅班友收藏
// @namespace    https://bgm.tv/group/topic/414787
// @version      0.0.1
// @description  在班固米首页显示关注的班友的收藏RSS，我会一直看着你
// @author       oov
// @include      http*://bgm.tv/
// @include      http*://chii.in/
// @include      http*://bangumi.tv/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @grant        none
// @license      MIT
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
  style.textContent = `
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

  /* 夜间模式 */
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
  .nickname-skeleton {
    width: min(8em, 50%);
    height: 16px;
    display: inline-block;
  }
  .comment-skeleton {
    max-width: 500px;
    height: 16px;
    margin-top: 5px;
  }
  .card-skeleton {
    max-width: 500px;
    margin-top: 10px;
    height: 70px;
  }

  .rssID-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 5px;
  }
  .rssID {
    display: inline-block;
    background-color: #e0e0e0;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 1em;
    cursor: pointer;
  }
  .rssID:hover {
    background-color: #d0d0d0;
  }
  .rssID-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1em;
    padding: 2px;
    background: transparent;
  }

  /* 夜间模式 */
  html[data-theme="dark"] .rssID-container {
    background-color: #333;
  }
  html[data-theme="dark"] .rssID {
    background-color: #555;
    color: #fff;
  }
  html[data-theme="dark"] .rssID:hover {
    background-color: #666;
  }
  html[data-theme="dark"] .rssID-input {
    color: #fff;
  }
  html[data-theme="dark"] .rssID-input::placeholder {
    color: #aaa;
  }
  `;
  document.head.appendChild(style);

  const RSS_LIST = JSON.parse(localStorage.getItem('incheijs_rss_list') || '[]');
  const rssIdToUrl = (id) => `/feed/user/${id}/interests`;

  const CONCURRENCY_LIMIT = 3;
  const TTL = 720; // 默认缓存时间（分钟）

  let lastUpdate = localStorage.getItem('incheijs_rss_last_update');
  const lastUpdateStr = (lastUpdate) => lastUpdate ? timestampToText(lastUpdate) : '从未';
  function updateLastDate() {
    lastUpdate = Date.now();
    localStorage.setItem('incheijs_rss_last_update', lastUpdate);
    document.getElementById('rss-last-date').textContent = lastUpdateStr(lastUpdate);
  }

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

  // #region 右侧栏
  const sideInner = document.querySelector('.sideInner');
  sideInner.insertAdjacentHTML(
    'beforeend',
    `
    <div id="home_rss" class="halfPage">
      <div class="sidePanelHome">
        <h2 class="subtitle">RSS订阅
        <br><span style="font-size: 12px">上次更新：<span id="rss-last-date">${lastUpdateStr(lastUpdate)}</span>
          <span class="clear-button" style="cursor:pointer" title="刷新缓存"></span>
          <span class="import-button" style="cursor:pointer" title="导入 RSS 列表"></span>
          <span class="export-button" style="cursor:pointer" title="导出 RSS 列表"></span>
        </span>
        </h2>
        <div id="rss-list" class="rssID-container" contenteditable="false">
          ${RSS_LIST.map((id) => `
            <span class="rssID" id="rssID-${id}">${id}</span>
          `).join('')}
          <input type="text" class="rssID-input" placeholder="ID⏎">
        </div>
      </div>
    </div>
  `
  );

  let feedItems = await getFeedItems(RSS_LIST);
  const rssListContainer = document.getElementById('rss-list');
  const rssIDInput = rssListContainer.querySelector('.rssID-input');

  function saveRSSList() {
    localStorage.setItem('incheijs_rss_list', JSON.stringify(RSS_LIST));
  }

  rssIDInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const id = rssIDInput.value.trim().replace(/\s+/g, ''); // 去除空格
      if (id) {
        if (!id || RSS_LIST.includes(id)) return;

        const rssID = document.createElement('span');
        rssID.className = 'rssID';
        rssID.textContent = id;
        rssListContainer.insertBefore(rssID, rssIDInput);

        RSS_LIST.push(id);
        saveRSSList();
        rssIDInput.value = '';
      }
    }
  });

  rssListContainer.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('rssID') || e.target.classList.contains('confirm')) return;
    const rssID = e.target;
    const id = rssID.textContent;

    const link = document.createElement('a');
    link.textContent = '';
    link.href = `/user/${id}`;
    link.target = '_blank';
    link.style.marginLeft = '5px';

    const del = document.createElement('span');
    del.textContent = '';
    del.onclick = () => {
      RSS_LIST.splice(RSS_LIST.indexOf(id), 1);
      rssID.remove();
      saveRSSList();
    };

    rssID.append(link, del);
    rssID.classList.add('confirm');
  });

  const clearButton = document.querySelector('.clear-button');
  clearButton.addEventListener('click', async function listener() {
    document.querySelectorAll('.rssID-fail').forEach((span) => span.remove());
    clearButton.textContent = '';
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('incheijs_rss_xml')) {
        localStorage.removeItem(key);
      }
    });
    try {
      feedItems = await getFeedItems(RSS_LIST);
      document.querySelector('#timelineTabs .focus')?.click();
      clearButton.textContent = '';
    } catch (error) {
      console.error('更新失败:', error);
      clearButton.textContent = '';
    } finally {
      setTimeout(() => {
        clearButton.textContent = '';
      }, 3000);
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
            rssListContainer.innerHTML = RSS_LIST.map((id) => `
              <span class="rssID" id="rssID-${id}">${id}</span>
            `).join('') + '<input type="text" class="rssID-input" placeholder="ID⏎">';

            feedItems = await getFeedItems(RSS_LIST);
            document.querySelector('#timelineTabs .focus')?.click(); // 刷新 RSS Tab
            alert('导入成功！');
          } else {
            alert('导入的文件格式不正确！');
          }
        } catch (error) {
          console.error('导入失败:', error);
          alert('导入失败，请检查文件格式！');
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

  // #region RSS Tab
  const menu = document.querySelector('#timelineTabs');
  const tmlContent = document.querySelector('#tmlContent');
  const rssTab = document.createElement('li');
  rssTab.innerHTML = '<a href="javascript:">RSS</a>';
  menu.appendChild(rssTab);

  rssTab.addEventListener('click', async () => {
    tmlContent.innerHTML = '<div class="loading"><img src="/img/loadingAnimation.gif"></div>';
    [...menu.querySelectorAll('a.focus')].forEach((e) => e.classList.remove('focus'));
    rssTab.querySelector('a').className = 'focus';

    let feedLisCopy = [...feedItems].map(({ li }) => li);

    const sentinel = document.createElement('div');
    const ul = document.createElement('ul');
    tmlContent.innerHTML = '';
    const timeline = document.createElement('div');
    timeline.id = 'timeline';
    timeline.appendChild(ul);
    tmlContent.appendChild(timeline);
    appendLis();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!feedLisCopy.length) {
              observer.disconnect();
              ul.insertAdjacentHTML('beforeend', '<li style="text-align:center">到底啦</li>');
              return;
            }
            appendLis();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);

    function appendLis() {
      const toAppend = feedLisCopy.slice(0, 20);
      const frag = document.createDocumentFragment();
      frag.append(...toAppend);
      ul.append(frag, sentinel);
      lazyLoadLis(toAppend);
      feedLisCopy = feedLisCopy.slice(20);
    }
  });
  // #endregion

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
    const { id, name, name_cn, date, images, score, rank, collection_total } = subject;

    let formattedDate = '';
    if (date) {
      // 去掉个位数日期前面的 0
      const [year, month, day] = date.split('-');
      formattedDate = `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    const cardHTML = `
      <div class="card">
        <div class="container">
          <a href="https://bgm.tv/subject/${id}">
            <span class="cover">
              <img src="${images.large}" loading="lazy">
            </span>
          </a>
          <div class="inner">
            <p class="title">
              <a href="https://bgm.tv/subject/${id}">${name} <small class="subtitle grey">${name_cn}</small></a>
            </p>
            ${formattedDate ? `<p class="info tip">${formattedDate}</p>` : ''}
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

    const userInfo = await fetchUserInfo(userId);
    const { avatar: userAvatar, nickname: userNickname } = userInfo;

    const collectionInfo = await fetchUserCollection(userInfo.username, subjectId);
    const { rate, comment } = collectionInfo;

    if (!comment && document.querySelector('#timelineTabs .focus').textContent === '简评') {
      li.remove();
      return;
    }

    const avatarContainer = li.querySelector('.avatar');
    const nicknameContainer = li.querySelector('.nickname-skeleton');
    const commentContainer = li.querySelector('.comment-skeleton');
    const cardContainer = li.querySelector('.card-skeleton');

    if (avatarContainer) {
      avatarContainer.innerHTML = `
        <a href="${userInfo.link}" class="avatar">
          <span class="avatarNeue avatarReSize40 ll" style="background-image:url('${userAvatar}')"></span>
        </a>
      `;
    }

    if (nicknameContainer) {
      nicknameContainer.outerHTML = `
        <a href="${userInfo.link}" class="l">${userNickname}</a>
      `;
    }

    if (commentContainer) {
      commentContainer.outerHTML = `
        ${comment ? '<div class="comment">' : ''}
          ${rate !== null ? `<span class="starstop-s"><span class="starlight stars${rate}"></span></span>` : ''}
          ${comment || ''}
        ${comment ? '</div>' : ''}
      `;
    }

    if (cardContainer) {
      const cardHTML = createSubjectCard(collectionInfo);
      cardContainer.outerHTML = cardHTML;
    }
  }

  // #region 在原有的时间线上插入 RSS 项
  const shouldInsert = (focused) => ['tab_all', 'tab_subject'].includes(focused.id) || focused.textContent === '简评';
  let feedItemsCopy = [...feedItems];

  const originalToRSSLis = {};
  function insertRSSItems(feedItemsCopy, originalItems) {
    const rssItems = [...feedItemsCopy];

    originalItems.forEach((originalLi) => {
      const lisToLazyLoad = originalToRSSLis[originalLi.id] ?? [];
      const titleTip = originalLi.querySelector('.titleTip');
      let timeStr = titleTip.dataset.originalTitle
                 ?? titleTip.title // 兼容筛选简评
                 ?? titleTip.textContent; // 兼容绝对时间
      const originalTime = +new Date(timeStr);

      if (lisToLazyLoad.length > 0) {
        originalLi.before(...lisToLazyLoad);
      } else {
        while (rssItems.length > 0 && rssItems[0].date > originalTime) {
          const { li } = rssItems.shift();
          originalLi.before(li);
          lisToLazyLoad.push(li);
        }
        originalToRSSLis[originalLi.id] = lisToLazyLoad;
      }

      lazyLoadLis(lisToLazyLoad);
    });

    return rssItems;
  }

  tmlContent.addEventListener('click', (e) => {
    if (!e.target.classList.contains('p')) return;
    const text = e.target.textContent;

    let toObserve, getLis;
    if (['下一页 ››', '‹‹上一页'].includes(text)) {
      toObserve = tmlContent;
      getLis = (addedNodes) => [...addedNodes].find((node) => node.id === 'timeline')?.querySelectorAll('li');
    } else if (['加载更多', '再来点'].includes(text)) { // 兼容加载更多、筛选简评
      toObserve = document.querySelector('#timeline');
      getLis = (addedNodes) => [...addedNodes].filter((node) => node.tagName === 'UL').flatMap((ul) => [...ul.children]);
    } else {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const focused = document.querySelector('#timelineTabs .focus');
      if (!shouldInsert(focused)) return;
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

  if (shouldInsert(document.querySelector('#timelineTabs .focus'))) {
    feedItemsCopy = insertRSSItems(feedItemsCopy, [...document.querySelectorAll('#timeline li')]);
  }

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
    if (e.target.tagName !== 'A' || !shouldInsert(e.target)) return;
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
    feedItemsCopy = [...feedItems];
    feedItemsCopy = insertRSSItems(feedItems, originalItems);
  }, true);
  // #endregion

  // #region 工具函数
  async function getFeedItems(rssList) {
    const feedItems = [];

    // 并发获取 RSS 数据
    const hasCache = rssList.every((rss) => storage.getItem('xml', rss));
    if (!hasCache) {
      document.querySelector('#rss-last-date').textContent = '更新中';
    }
    const rssPromises = rssList.map((rss) => fetchRSS(rss));
    const rssResults = await runWithConcurrency(rssPromises, CONCURRENCY_LIMIT);
    if (!hasCache) updateLastDate();

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

        const li = document.createElement('li');
        li.className = 'clearit tml_item';
        li.innerHTML = `
          <span class="avatar">
            <div class="avatar-skeleton skeleton"></div>
          </span>
          <span class="info clearit">
            <div class="nickname-skeleton skeleton"></div>
            ${prefix} <a href="${subjectLink}" class="l">${titleText}</a>
            <div class="collectInfo">
              <div class="comment-skeleton skeleton"></div>
            </div>
            <div class="card-skeleton skeleton"></div>
            <div class="post_actions date">
              <span title="" class="titleTip" data-original-title="${formatTimestamp(date)}">${timestampToText(date)}</span> · RSS
            </div>
          </span>
        `;

        li.dataset.userId = userId;
        li.dataset.subjectId = subjectID;

        feedItems.push({ li, date });
      }
    }

    // 按日期从新到旧排序
    feedItems.sort((a, b) => b.date - a.date);

    return feedItems;
  }

  async function fetchRSS(id) {
    const cachedRSS = storage.getItem('xml', id);
    if (cachedRSS) return cachedRSS;

    try {
      const response = await fetch(rssIdToUrl(id));
      if (!response.ok) throw new Error(`RSS fetch ${response.status}`);
      const rssText = await response.text();
      storage.setItem('xml', id, rssText);
      console.log(id + ' fetched');
      return rssText;
    } catch (error) {
      console.error('获取 RSS 失败:', error);
      document.querySelector(`#rssID-${id}`).insertAdjacentHTML('<span style="margin-left:5px" class="rssID-fail"></span>');
      return null;
    }
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
        username: userData.username,
        link: `https://bgm.tv/user/${userId}`,
      };

      sessionStorage.setItem(cacheKey, JSON.stringify(userInfo));
      return userInfo;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        avatar: '//lain.bgm.tv/pic/user/l/icon.jpg',
        nickname: userId,
        username: userId,
        link: `https://bgm.tv/user/${userId}`,
      };
    }
  }

  async function fetchUserCollection(username, subjectId) {
    const cacheKey = `${username}_${subjectId}`;
    const cachedCollection = storage.getItem('collection', cacheKey);
    if (cachedCollection) return cachedCollection;

    try {
      const response = await fetch(`https://api.bgm.tv/v0/users/${username}/collections/${subjectId}`);
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

  async function runWithConcurrency(reqs = [], num = 2) {
    const results = [];

    if (reqs.length) {
      await Promise.all(
        new Array(num).fill(0).map(async () => {
          while (reqs.length) {
            try {
              const result = await reqs.shift();
              results.push(result);
            } catch (e) {
              console.error(e);
            }
          }
        })
      );
    }
    return results;
  }

  function timestampToText(timestamp) {
    const now = Date.now();
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
  // #endregion

})();
