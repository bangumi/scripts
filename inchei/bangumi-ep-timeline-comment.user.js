// ==UserScript==
// @name         进度时间线显示评论
// @namespace    https://bgm.tv/group/topic/
// @version      0.0.1
// @description  在班固米显示动画进度时间线的对应评论
// @author       oov
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @match        https://bangumi.tv/user/*/timeline*
// @match        https://bgm.tv/user/*/timeline*
// @match        https://chii.in/user/*/timeline*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @license      MIT
// ==/UserScript==

/*
 * 兼容性：
 * - [加载更多](https://bgm.tv/dev/app/432)
 */

(async function() {
  'use strict';

  const FACE_KEY_GIF_MAPPING = {
    "0": "44",
    "140": "101",
    "80": "41",
    "54": "15",
    "85": "46",
    "104": "65",
    "88": "49",
    "62": "23",
    "79": "40",
    "53": "14",
    "122": "83",
    "92": "53",
    "118": "79",
    "141": "102",
    "90": "51",
    "76": "37",
    "60": "21",
    "128": "89",
    "47": "08",
    "68": "29",
    "137": "98",
    "132": "93"
  };

  const dontNetabare = localStorage.getItem('incheijs_eptl_nonetabare') === 'true';
  const style = document.createElement('style');
  style.textContent = /* css */`
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
    .comment-skeleton {
      max-width: 500px;
      height: 32.4px;
      margin-top: 5px;
      margin-bottom: 5px;
      border-radius: 5px;
      border: 1px solid transparent;
    }

    .netabare-comment-container {
      max-height: 200px;
      overflow: auto;
      scrollbar-width: thin;
      ${ dontNetabare ? /* css */`
      .netabare-comment {
        filter: blur(4px);
        transition: filter 200ms cubic-bezier(1, 0, 0, 1) 100ms;
        img:not([smileid]) {
          filter: blur(3em);
          clip-path: inset(0);
          transition: filter 200ms cubic-bezier(1, 0, 0, 1) 100ms;
        }
      }` : '' }
    }
    .netabare-comment-container:hover,
    .netabare-comment-container:focus {
      ${ dontNetabare ? /* css */`
      .netabare-comment {
        filter: blur(0);
        img:not([smileid]) {
          filter: blur(0);
        }
      }` : '' }
    }
    .comment.comment-failed {
      opacity: .4;
    }
    .comment.comment-failed:hover,
    .comment.comment-failed:focus {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  class LocalStorageWithExpiry {
    constructor() {
      this.prefix = 'incheijs_eptl_';
      this.initialize();
      this.ttl = 240; // 分钟
    }

    // 初始化时清理过期项
    initialize() {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const item = JSON.parse(localStorage.getItem(key));
          if (this.isExpired(item)) localStorage.removeItem(key);
        }
      });
    }

    isExpired(item) {
      return item && item.expiry && Date.now() > item.expiry;
    }

    setItem(key, value) {
      const storageKey = `${this.prefix}${key}`;
      const expiry = Date.now() + this.ttl * 60 * 1000;
      const item = { value, expiry };
      localStorage.setItem(storageKey, JSON.stringify(item));
    }

    getItem(key) {
      const storageKey = `${this.prefix}${key}`;
      const item = JSON.parse(localStorage.getItem(storageKey));
      if (this.isExpired(item)) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return item ? item.value : null;
    }

    removeItem(key) {
      const storageKey = `${this.prefix}${key}`;
      localStorage.removeItem(storageKey);
    }
  }
  const storage = new LocalStorageWithExpiry();

  const myUsername = document.querySelector('#dock a').href.split('/').pop();
  const menu = document.querySelector('#timelineTabs');
  const tmlContent = document.querySelector('#tmlContent');

  const epExists = focused => ['tab_all', 'tab_progress'].includes(focused.id);
  const isEpTl = focused => li => li.textContent.includes('看过') && focused.id === 'tab_progress' || new URL([...li.querySelectorAll(':is(.info, .info_full) a.l')].pop().href).pathname.startsWith('/subject/ep/');
  const superGetEpComments = beDistinctConcurrentRetryCached(getEpComments);
  let loading = false; // 兼容加载更多，避免连续点击导致重复

  // 初始
  const initialTab = document.querySelector('#timelineTabs .focus');
  if (epExists(initialTab)) {
    lazyLoadLis([...tmlContent.querySelectorAll('li')].filter(isEpTl(initialTab)));
  }

  // 翻页
  tmlContent.addEventListener('click', e => {
    if (loading || !e.target.classList.contains('p')) return;
    const text = e.target.textContent;

    let toObserve, getLis;
    if (['下一页 ››', '‹‹上一页'].includes(text)) {
      superGetEpComments.abortAll();
      toObserve = tmlContent;
      getLis = addedNodes => [...addedNodes].find((node) => node.id === 'timeline')?.querySelectorAll('li');
    } else if (['加载更多', '再来点'].includes(text)) {
      // 兼容加载更多
      toObserve = document.querySelector('#timeline');
      getLis = addedNodes => [...addedNodes].filter((node) => node.tagName === 'UL').flatMap((ul) => [...ul.children]);
    } else {
      return;
    }

    const observer = new MutationObserver(mutations => {
      const focused = document.querySelector('#timelineTabs .focus');
      if (!epExists(focused)) return;
      for (const mutation of mutations) {
        const { addedNodes } = mutation;
        let addedLis = getLis(addedNodes);
        addedLis &&= [...addedLis].filter(isEpTl(focused));
        if (!addedLis || addedLis.length === 0) continue;
        observer.disconnect();
        lazyLoadLis(addedLis);
        loading = false;
      }
    });
    observer.observe(toObserve, { childList: true });
    loading = true;
  }, true);

  // 切换Tab
  let loadedObserver, currentResolve;
  const loadbarRemoved = (mutations) => mutations.some(mutation => [...mutation.removedNodes].some(node => node.classList?.contains('loading')));
  const initLoadedObserver = () => {
    if (loadedObserver) return;
    loadedObserver = new MutationObserver(mutations => {
      if (loadbarRemoved(mutations)) {
        loadedObserver.disconnect();
        currentResolve();
        currentResolve = null;
      }
    });
  };
  menu.addEventListener('click', async (e) => {
    loadedObserver?.disconnect();
    if (e.target.tagName !== 'A' || !epExists(e.target)) return;
    superGetEpComments.abortAll();
    await (new Promise(resolve => {
      currentResolve = resolve;
      initLoadedObserver();
      loadedObserver.observe(tmlContent, { childList: true });
    }));
    let originalItems = [...document.querySelectorAll('#timeline li')].filter(isEpTl(e.target));
    lazyLoadLis(originalItems);
  }, true);

  function lazyLoadLis(lis) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const li = entry.target;
            loadComments(li);
            observer.unobserve(li);
          }
        });
      },
      { threshold: 0.1 }
    );
    lis.forEach((li) => observer.observe(li));
  }

  async function loadComments(tl) {
    let comment = storage.getItem(tl.id);
    if (comment?.inexist) return;

    const epA = [...tl.querySelectorAll(':is(.info, .info_full) a.l')].pop();
    const epUrl = epA.href;
    const epId = epUrl.split('/').pop();
    const footer = tl.querySelector('.post_actions.date');
    const userId = tl.dataset.itemUser || location.pathname.split('/')?.[2];

    const skeleton = document.createElement('div');
    skeleton.className = 'comment-skeleton skeleton';
    epA.after(skeleton);

    try {
      if (!comment) {
        const data = await superGetEpComments(epId);
        const rawComment = data.find(comment => comment.user.username === userId && comment.content);
        if (!rawComment) {
          storage.setItem(tl.id, { inexist: true });
          throw new Error('No comment found');
        }
        const { content, id, reactions } = rawComment;
        comment = {
          html: bbcodeToHtml(content),
          id,
          tietie: reactions?.length ? getDataLikesList(epId, reactions) : null
        };
        storage.setItem(tl.id, comment);
      }
      const { html, id, tietie } = comment;
      epA.insertAdjacentHTML('afterend', `<div class="comment netabare-comment-container" role="button" tabindex="0"><span class="netabare-comment">${html}</span></div>`);
      epA.href = `${epUrl}#post_${id}`;
      footer.insertAdjacentHTML('beforebegin', `<div class="likes_grid" id="likes_grid_${id}"></div>`);
      footer.insertAdjacentHTML('afterbegin', /* html */`
        <div class="action dropdown dropdown_right">
        <a href="javascript:void(0);" class="icon like_dropdown"
            data-like-type="11"
            data-like-main-id="${ epId }"
            data-like-related-id="${ id }"
            data-like-tpl-id="likes_reaction_menu">
            <span class="ico ico_like">&nbsp;</span>
            <span class="title">贴贴</span>
        </a>
        </div>
      `);
      unsafeWindow.chiiLib.likes.updateGridWithRelatedID(id, tietie);
      unsafeWindow.chiiLib.likes.init();
    } catch (error) {
      if (error.message !== 'No comment found') {
        console.error(tl, error);
        const reload = document.createElement('button');
        reload.textContent = '获取章节评论失败，点击重试';
        reload.style = 'padding:0;border:none;background:none;color:unset;cursor:pointer';
        reload.onclick = () => {
          reload.parentElement.remove();
          loadComments(tl);
        }
        const container = document.createElement('div');
        container.className = 'comment comment-failed';
        epA.after(container);
        container.appendChild(reload);
      } else {
        console.log(tl, '未找到评论');
      }
    } finally {
      skeleton.remove();
    }
  }

  async function getEpComments(episodeId) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://next.bgm.tv/p1/episodes/${episodeId}/comments`,
        onload: function(response) {
          if (response.status >= 200 && response.status < 300) {
            resolve(JSON.parse(response.responseText));
          } else {
            reject(new Error(`请求失败，状态码: ${response.status}`));
          }
        },
        onerror: function(error) {
          reject(new Error(`请求出错: ${error}`));
        }
      });
    });
  }

  function bbcodeToHtml(bbcode) {
    // (bgm38)
    let html = bbcode.replace(/\(bgm(\d+)\)/g, function (_, number) {
        const newNumber = parseInt(number) - 23;
        const formattedNumber = newNumber.toString().padStart(2, '0');
        const imgUrl = `/img/smiles/tv/${formattedNumber}.gif`;
        return `<img src="${imgUrl}" smileid="${parseInt(number) + 16}" alt="(bgm${number})" width="21">`;
    });
    // [url]
    html = html.replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/g, '<a class="l" href="$1" target="_blank" rel="nofollow external noopener noreferrer">$2</a>');
    html = html.replace(/\[url\]([^[]+)\[\/url\]/g, '<a class="l" href="$1" target="_blank" rel="nofollow external noopener noreferrer">$1</a>');
    // [img]
    html = html.replace(/\[img(?:=(\d+),(\d+))?\]([^[]+)\[\/img\]/g, function (_, width, height, url) {
      const trimmedUrl = url.trim();
      return `<img class="code" src="${trimmedUrl}" rel="noreferrer" referrerpolicy="no-referrer" alt="${trimmedUrl}" loading="lazy"${width && height ? ` width="${width}" height="${height}"` : ''}>`;
    });
    // [b]
    html = html.replace(/\[b\]([^[]+)\[\/b\]/g, '<span style="font-weight:bold;">$1</span>');
    // [size]
    html = html.replace(/\[size=([^\]]+)\]([^[]+)\[\/size\]/g, '<span style="font-size:$1px; line-height:$1px;">$2</span>');
    // [mask]
    html = html.replace(/\[mask\]([^[]+)\[\/mask\]/g, '<span class="text_mask" style="background-color:#555;color:#555;border:1px solid #555;">$1</span>');
    // [s]
    html = html.replace(/\[s\]([^[]+)\[\/s\]/g, '<span style="text-decoration: line-through;">$1</span>');
    // [quote]
    html = html.replace(/\[quote\]([^[]+)\[\/quote\]/g, '<div class="quote"><q>$1</q></div>');
    // \n
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  function getDataLikesList(mainID, reactions) {
    return reactions.reduce((acc, i) => {
      acc[i.value] = {
        type: 11,
        main_id: mainID,
        value: i.value,
        total: i.users.length,
        emoji: FACE_KEY_GIF_MAPPING[i.value],
        users: i.users,
        selected: i.users.some(user => user.id === unsafeWindow.CHOBITS_UID)
      };
      return acc;
    }, {})
  }

  function beDistinctConcurrentRetryCached(requestFunction, options = {}) {
    const {
      maxConcurrency = 3,
      maxRetries = 3,
      retryDelay = 1000,
      maxCacheSize = 5
    } = options;

    const cache = new Map();
    const pendingRequests = new Map();
    const activeRequests = new Set();
    const abortControllers = new Map();

    const wrapped = async (url, ...args) => {
      if (cache.has(url)) {
        console.log(`Returning cached result for ${url}`);
        const result = cache.get(url);
        cache.delete(url);
        cache.set(url, result);
        return result;
      }

      if (pendingRequests.has(url)) {
        console.log(`Request to ${url} is already pending, waiting...`);
        return pendingRequests.get(url);
      }

      while (activeRequests.size >= maxConcurrency) {
        console.log(`Max concurrency (${maxConcurrency}) reached, waiting...`);
        await Promise.race([...activeRequests]);
      }

      try {
        const requestPromise = (async () => {
          let retries = 0;
          while (retries <= maxRetries) {
            try {
              const result = await requestFunction(url, ...args);
              if (cache.size > maxCacheSize) {
                const oldestKey = cache.keys().next().value;
                cache.delete(oldestKey);
              }
              cache.set(url, result);
              return result;
            } catch (error) {
              retries++;
              if (retries > maxRetries) {
                throw new Error(`Request to ${url} failed after ${maxRetries} retries: ${error.message}`);
              }
              console.log(`Request to ${url} failed: ${error.message}, retrying (${retries}/${maxRetries})...`);
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
          }
        })();

        const manageActiveRequests = (async () => {
          activeRequests.add(requestPromise);
          try {
            return await requestPromise;
          } finally {
            activeRequests.delete(requestPromise);
          }
        })();

        pendingRequests.set(url, manageActiveRequests);
        return await manageActiveRequests;
      } finally {
        pendingRequests.delete(url);
      }
    };

    wrapped.abortAll = () => {
      abortControllers.forEach((controller) => controller.abort());
      abortControllers.clear();
      activeRequests.clear();
      pendingRequests.clear();
    };

    return wrapped;
  }

  // 键盘操作
  document.addEventListener('click', e => {
    if (e.target.classList.contains('netabare-comment-container')) e.target.focus();
  }, true);

  // 保存贴贴变化
  const originalReq = unsafeWindow.chiiLib.likes.req;
  unsafeWindow.chiiLib.likes.req = (ele) => {
    const tlId = ele.closest('.tml_item').id;
    const comment = storage.getItem(tlId);
    if (!comment) return originalReq.call(this, ele);

    const id = new URLSearchParams(ele.href).get('id');
    const originalAjax = $.ajax;
    $.ajax = (options) => {
      const originalSuccess = options.success;
      options.success = function(json) {
        originalSuccess.call(this, json);
        const tietie = json.data?.[id];
        if (tietie) {
          comment.tietie = tietie;
        } else {
          const originalTietie = comment.tietie;
          const onlyValue = (arr, filter) => arr.length === 1 && filter(arr[0]);

          // 频繁贴贴会导致返回 undefined，此时不应该清除贴贴数据
          if (!originalTietie || onlyValue(Object.keys(originalTietie), key => onlyValue(originalTietie[key].users, user => user.username === myUsername))) {
            comment.tietie = null;
          }
        };
        storage.setItem(tlId, comment);
      };
      const result = originalAjax.call(this, options);
      $.ajax = originalAjax;
      return result;
    };
    originalReq.call(this, ele);
  };
})();
