// ==UserScript==
// @name         条目页好友进度
// @namespace    https://github.com/ankopala/bgm-friend-progress
// @version      0.1.12
// @description  在番剧条目页列出好友的收藏状态与集数进度（谁在看、看到第几话）
// @author       ankopala
// @match        https://bgm.tv/subject/*
// @match        https://bangumi.tv/subject/*
// @match        https://chii.in/subject/*
// @grant        GM_xmlhttpRequest
// @connect      api.bgm.tv
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  /* ==================== 配置 ==================== */

  const API = 'https://api.bgm.tv';

  const CFG = {
    maxFriends: 60,              // 单次最多查询多少位好友
    ttlFriends: 7 * 86400e3,     // 好友列表缓存 7 天
    ttlCollection: 10 * 60e3,    // 单个好友在本条目的收藏缓存 10 分钟
    concurrency: 3,              // 并发请求数
    gap: 220,                    // 每次请求之间的间隔(ms)
  };

  const STATUS = {
    1: { label: '想看', cls: 'wish' },
    2: { label: '看过', cls: 'done' },
    3: { label: '在看', cls: 'doing' },
    4: { label: '搁置', cls: 'hold' },
    5: { label: '抛弃', cls: 'drop' },
  };

  const ORDER = { 3: 0, 2: 1, 1: 2, 4: 3, 5: 4 };

  /* ==================== 小工具 ==================== */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const store = {
    get(k) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : undefined;
      } catch (e) {
        return undefined;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {
        /* 配额满了就算了 */
      }
    },
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function relTime(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    if (d < 60e3) return '刚刚';
    if (d < 3600e3) return Math.floor(d / 60e3) + ' 分钟前';
    if (d < 86400e3) return Math.floor(d / 3600e3) + ' 小时前';
    if (d < 30 * 86400e3) return Math.floor(d / 86400e3) + ' 天前';
    return new Date(ts).toLocaleDateString('zh-CN');
  }

  /* ==================== 网络 ==================== */

  /** 老式 GM_xmlhttpRequest（回调式）与新式 GM.xmlHttpRequest（Promise 式）都兼容 */
  function gmRequest(url, timeout) {
    const ms = timeout || 15000;
    const legacy = typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null;
    const modern =
      typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function'
        ? GM.xmlHttpRequest
        : null;

    if (legacy) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('请求超时')), ms);
        legacy({
          method: 'GET',
          url,
          timeout: ms,
          headers: { Accept: 'application/json' },
          onload: (r) => {
            clearTimeout(timer);
            resolve({ status: r.status, text: r.responseText });
          },
          onerror: () => {
            clearTimeout(timer);
            reject(new Error('网络错误'));
          },
          ontimeout: () => {
            clearTimeout(timer);
            reject(new Error('请求超时'));
          },
        });
      });
    }

    if (modern) {
      return Promise.race([
        Promise.resolve(
          modern({ method: 'GET', url, timeout: ms, headers: { Accept: 'application/json' } })
        ).then((r) => ({ status: r.status, text: r.responseText })),
        new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), ms)),
      ]);
    }

    return null;
  }

  async function apiGet(path, retries) {
    const max = retries == null ? 2 : retries;
    const url = API + path;
    let last = null;

    for (let i = 0; i <= max; i++) {
      try {
        let r;
        try {
          // 优先 fetch：api.bgm.tv 明确返回 Access-Control-Allow-Origin: *
          r = await fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'omit',
          }).then(async (res) => ({ status: res.status, text: await res.text() }));
        } catch (e) {
          // 被跨域策略拦下时才走 GM 通道
          const g = gmRequest(url);
          if (!g) throw e;
          r = await g;
        }

        if (r.status === 429 || r.status >= 500) {
          last = new Error('HTTP ' + r.status);
          await sleep(700 * (i + 1));
          continue;
        }
        return r;
      } catch (e) {
        last = e;
        await sleep(700 * (i + 1));
      }
    }

    throw last || new Error('请求失败');
  }

  /** 同源抓 HTML，返回状态码 / 最终地址 / 正文，供诊断用 */
  async function fetchHtml(path) {
    const r = await fetch(path, { credentials: 'same-origin' });
    const text = await r.text();
    return { status: r.status, url: r.url || path, text: text };
  }

  /** 简单的并发队列：同时最多 concurrency 个，任务之间间隔 gap */
  function createQueue(concurrency, gap) {
    let active = 0;
    const waiting = [];
    const tick = () => {
      if (active >= concurrency || !waiting.length) return;
      active++;
      const job = waiting.shift();
      job
        .fn()
        .then(job.resolve, job.reject)
        .finally(() => {
          active--;
          setTimeout(tick, gap);
        });
    };
    return (fn) =>
      new Promise((resolve, reject) => {
        waiting.push({ fn, resolve, reject });
        tick();
      });
  }

  const queue = createQueue(CFG.concurrency, CFG.gap);

  /* ==================== 站点信息 ==================== */

  // 本地预览钩子：window.__BFP_TEST__ = { me, subjectId, friends, collections }
  const TEST = typeof window !== 'undefined' ? window.__BFP_TEST__ || null : null;

  function getMe() {
    if (TEST && TEST.me) return TEST.me;

    // 手动填过的优先
    const saved = store.get('bfp:me');
    if (saved) return saved;

    // 顶部徽章 / dock：注意登录态的 href 可能是绝对地址，所以用 href*="/user/"
    const scopes = [
      '.idBadgerNeue',
      '#idBadgerNeue',
      '#dock',
      '#headerNeue2',
      '.headerNeue',
      '#header',
    ];
    for (const sel of scopes) {
      const box = document.querySelector(sel);
      if (!box) continue;
      const a = box.querySelector('a[href*="/user/"]');
      if (!a) continue;
      const m = (a.getAttribute('href') || '').match(/\/user\/([^/?#]+)/);
      if (m) return decodeURIComponent(m[1]);
    }

    // 兜底：全页只有唯一一个「用户主页」链接时才采信
    const ids = [...document.querySelectorAll('a[href*="/user/"]')]
      .map((a) => ((a.getAttribute('href') || '').match(/^\/user\/([A-Za-z0-9_%.-]+)\/?$/) || [])[1])
      .filter(Boolean);
    const uniq = [...new Set(ids)];
    if (uniq.length === 1) return decodeURIComponent(uniq[0]);

    return null;
  }

  function getSubjectId() {
    if (TEST && TEST.subjectId) return TEST.subjectId;
    const m = location.pathname.match(/^\/subject\/(\d+)\/?$/);
    return m ? Number(m[1]) : null;
  }

  function getTotalEps() {
    if (TEST && TEST.totalEps) return TEST.totalEps;
    const box = document.querySelector('#infobox');
    if (box) {
      for (const li of box.querySelectorAll('li')) {
        const txt = (li.textContent || '').trim();
        if (/话数|集数/.test(txt)) {
          const m = txt.match(/(\d+)\s*(话|集)/);
          if (m) return Number(m[1]);
        }
      }
    }
    return null;
  }

  /* ==================== 好友列表 ==================== */

  function userIdOf(a) {
    const href = a.getAttribute('href') || '';
    const m = href.match(/^(?:https?:\/\/[^/]+)?\/user\/([A-Za-z0-9_%.-]+)\/?(?:[?#]|$)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function userNameOf(a) {
    const t = a.getAttribute('title');
    if (t && t.trim()) return t.trim();
    const img = a.querySelector('img');
    if (img && img.getAttribute('alt')) return img.getAttribute('alt').trim();
    const txt = (a.textContent || '').trim();
    return txt || null;
  }

  function userAvatarOf(a) {
    const img = a.querySelector('img');
    if (img && img.getAttribute('src')) return img.getAttribute('src');
    const nested = a.querySelector('[style*="background-image"]');
    if (nested) {
      const m = (nested.getAttribute('style') || '').match(/url\(["']?([^"')]+)/);
      if (m) return m[1];
    }
    return null;
  }

  /**
   * 好友页结构可能随改版变化，这里三层兜底：
   * 1. 用户列表项一般带 data-item-user 属性，直接取最可靠；
   * 2. 否则退化为「找出包含最多 /user/xxx 链接的容器」；
   * 3. 都失败返回空数组，由上层提示。
   */
  function extractUsers(html, self) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const nodes = [...doc.querySelectorAll('[data-item-user]')].filter(
      (n) => n.getAttribute('data-item-user')
    );

    if (nodes.length >= 3) {
      const seen = new Set();
      const out = [];
      for (const n of nodes) {
        const id = n.getAttribute('data-item-user');
        if (!id || id === self || seen.has(id)) continue;
        seen.add(id);
        const links = [...n.querySelectorAll('a[href]')].filter((a) => userIdOf(a) === id);
        if (!links.length) continue; // 不是用户列表项（比如目录卡片），跳过
        const named = links.find((a) => (a.textContent || '').trim()) || links[0];
        out.push({
          id,
          name: (named && userNameOf(named)) || id,
          avatar: links.map(userAvatarOf).find(Boolean) || null,
        });
      }
      if (out.length) return out;
    }

    const anchors = [...doc.querySelectorAll('a[href]')].filter((a) => userIdOf(a));

    const buckets = new Map();
    for (const a of anchors) {
      let node = a.parentElement;
      for (let depth = 0; depth < 3 && node; depth++) {
        if (!buckets.has(node)) buckets.set(node, new Set());
        buckets.get(node).add(a);
        node = node.parentElement;
      }
    }

    let best = null;
    for (const [node, set] of buckets) {
      const uniq = new Set([...set].map(userIdOf).filter(Boolean));
      if (!best || uniq.size > best.uniq.size) best = { set, uniq };
    }
    if (!best) return [];

    const seen = new Set();
    const out = [];
    for (const a of best.set) {
      const id = userIdOf(a);
      if (!id || id === self || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, name: userNameOf(a) || id, avatar: userAvatarOf(a) });
    }
    return out;
  }

  function snippetOf(html) {
    const keys = ['id="userList"', 'class="users', 'id="columnA"', 'id="main"'];
    let i = -1;
    for (const k of keys) {
      i = html.indexOf(k);
      if (i >= 0) break;
    }
    const start = i >= 0 ? i : Math.max(0, html.indexOf('<body'));
    return (html.slice(start, start + 700) || '').replace(/\s+/g, ' ');
  }

  /** 解析条目收藏列表页的成员列表（#memberUserList） */
  function parseMemberList(html, self) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const box = doc.querySelector('#memberUserList') || doc;
    const out = [];
    const seen = new Set();
    for (const n of box.querySelectorAll('[data-item-user]')) {
      const id = n.getAttribute('data-item-user');
      if (!id || id === self || seen.has(id)) continue;
      const links = [...n.querySelectorAll('a[href]')].filter((a) => userIdOf(a) === id);
      if (!links.length) continue;
      seen.add(id);
      const named = links.find((a) => (a.textContent || '').trim()) || links[0];
      out.push({
        id: id,
        name: (named && userNameOf(named)) || id,
        avatar: links.map(userAvatarOf).find(Boolean) || null,
      });
    }
    return out;
  }

  /**
   * 从条目反查好友：/subject/{id}/{status}?filter=friends 是服务端渲染的。
   * 同时取一份不带筛选的对照，两者内容相同说明筛选未生效，整条路放弃。
   */
  async function fetchSubjectFriends(subjectId) {
    const key = 'bfp:subjfriends:' + subjectId;
    const cached = store.get(key);
    if (cached && Date.now() - cached.time < 10 * 60e3) return { list: cached.list, ok: true };

    const STATUSES = [[3, 'doings'], [2, 'collections'], [1, 'wishes'], [4, 'on_hold'], [5, 'dropped']];
    const map = new Map();
    let checked = 0;
    let applied = 0;

    for (const [type, path] of STATUSES) {
      const base = '/subject/' + subjectId + '/' + path;

      let frRes;
      try {
        frRes = await fetchHtml(base + '?filter=friends');
      } catch (e) {
        continue;
      }
      if (frRes.status !== 200) continue;
      checked++;

      const frUsers = parseMemberList(frRes.text, state.me);
      if (!frUsers.length) {
        // 空结果：可能筛选生效了、也可能本来就没人，两种情况都不用再对照
        applied++;
        continue;
      }

      // 有结果才需要证明「筛选真的生效」：取一份不筛选的对照
      let allRes;
      try {
        allRes = await fetchHtml(base);
      } catch (e) {
        continue;
      }
      if (allRes.status === 200) {
        if (frRes.text === allRes.text) continue; // 正文没变 → 没生效
        const allUsers = parseMemberList(allRes.text, state.me);
        if (allUsers.length && frUsers.length >= allUsers.length) continue;
      } else {
        continue;
      }
      applied++;

      for (const u of frUsers) {
        if (!map.has(u.id)) map.set(u.id, { id: u.id, name: u.name, avatar: u.avatar, type: type });
      }
    }

    const list = [...map.values()];
    state.friendDebug = Object.assign(state.friendDebug || {}, {
      subjectScope: checked + ' 个状态页 / 生效 ' + applied,
    });
    store.set(key, { time: Date.now(), list: list });
    return { list: list, ok: checked > 0 };
  }

  /**
   * 兜底：好友列表可能是前端渲染的，直接 fetch 拿不到。
   * 用一个隐藏 iframe 载入好友页，等它自己渲染完再读 DOM。
   */
  function friendsViaIframe(me) {
    return new Promise((resolve) => {
      const f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText =
        'position:fixed;left:-9999px;top:0;width:1200px;height:900px;border:0;opacity:0;pointer-events:none';
      f.src = '/user/' + encodeURIComponent(me) + '/friends';

      let done = false;
      const finish = (val) => {
        if (done) return;
        done = true;
        clearTimeout(hardTimer);
        try {
          f.remove();
        } catch (e) {
          /* ignore */
        }
        resolve(val);
      };

      const hardTimer = setTimeout(() => finish({ users: [], err: 'iframe 超时' }), 12000);

      f.addEventListener('load', () => {
        // 页面脚本可能还要再拉一次数据，轮询到出现人为止（最多 ~6s）
        let tries = 0;
        const poll = () => {
          if (done) return;
          let doc = null;
          try {
            doc = f.contentDocument;
          } catch (e) {
            return finish({ users: [], err: '读取失败：' + (e.message || e) });
          }
          if (!doc) return finish({ users: [], err: '无法读取 iframe 文档' });

          const users = extractUsers(doc.documentElement.outerHTML, me);
          if (users.length) return finish({ users: users, err: '' });

          if (++tries >= 12) return finish({ users: [], err: 'iframe 内仍是 0 人' });
          setTimeout(poll, 500);
        };
        poll();
      });

      document.body.appendChild(f);
    });
  }

  async function fetchFriends(me) {
    if (TEST && TEST.friends) {
      state.friendDebug = TEST.friendDebug || null;
      return TEST.friends;
    }
    const key = 'bfp:friends:' + me;
    const cached = store.get(key);
    if (cached && cached.list && Date.now() - cached.time < CFG.ttlFriends) {
      return cached.list;
    }

    // 上次失败就歇一会儿，避免每次开条目页都硬等十几秒
    const failKey = 'bfp:friendfail:' + me;
    const recentFail = store.get(failKey);
    if (recentFail && Date.now() - recentFail.time < 10 * 60e3) {
      state.friendDebug = recentFail.debug || {};
      return [];
    }

    const all = new Map();
    let first = null;

    for (let page = 1; page <= 12; page++) {
      const path = '/user/' + encodeURIComponent(me) + '/friends' + (page > 1 ? '?page=' + page : '');
      let res;
      try {
        res = await fetchHtml(path);
      } catch (e) {
        state.friendDebug = { me: me, path: path, error: e.message || String(e) };
        break;
      }
      if (page === 1) first = res;

      const before = all.size;
      for (const u of extractUsers(res.text, me)) {
        if (!all.has(u.id)) all.set(u.id, u);
      }
      if (all.size === before) break; // 没有新增，说明到末页了
    }

    if (first) {
      const t = first.text || '';
      const m = t.match(/<title>([\s\S]*?)<\/title>/i);
      const ids = new Set();
      t.replace(/\/user\/([A-Za-z0-9_%.-]+)/g, (all, id) => { ids.add(id); return all; });
      state.friendDebug = Object.assign(state.friendDebug || {}, {
        uniqUsers: ids.size,
        me: me,
        status: first.status,
        finalUrl: first.url,
        bytes: t.length,
        title: m ? m[1].trim() : '',
        diu: (t.match(/data-item-user/g) || []).length,
        links: (t.match(/href="\/user\//g) || []).length,
        guest: /class="guest login"|>登录<|>登入</.test(t),
        users: all.size,
        snippet: snippetOf(t),
      });
    }

    let list = [...all.values()];

    // 静态 HTML 里没有人 → 交给 iframe 渲染一次
    if (!list.length) {
      const fb = await friendsViaIframe(me);
      if (fb.users && fb.users.length) list = fb.users;
      if (state.friendDebug) state.friendDebug.iframe = fb.err || '成功 ' + (fb.users || []).length + ' 人';
    }

    if (list.length) store.set(key, { time: Date.now(), list });
    else if (!TEST) store.set(failKey, { time: Date.now(), debug: state.friendDebug });
    return list;
  }

  /* ==================== 收藏查询 ==================== */

  async function fetchCollection(user, subjectId) {
    if (TEST && TEST.collections) return TEST.collections[user] || null;
    const key = 'bfp:col:' + subjectId + ':' + user;
    const cached = store.get(key);
    if (cached && Date.now() - cached.time < CFG.ttlCollection) return cached.value;

    let value = null;
    try {
      const r = await apiGet('/v0/users/' + encodeURIComponent(user) + '/collections/' + subjectId);
      if (r.status === 200) {
        const j = JSON.parse(r.text);
        if (j && j.type) {
          value = {
            type: j.type,
            ep: j.ep_status || 0,
            rate: j.rate || 0,
            updated: j.updated_at ? Date.parse(j.updated_at) : 0,
          };
        }
      }
      // 404 = 没收藏 / 收藏不公开，按未收藏处理
    } catch (e) {
      return { error: e.message || String(e) };
    }

    store.set(key, { time: Date.now(), value });
    return value;
  }

  /* ==================== 界面 ==================== */

  const CSS = `
  #bfp{
    --bfp-accent: var(--primary-color, #f09199);
    --bfp-text: #333;
    --bfp-text-2: #666;
    --bfp-muted: #999;
    --bfp-line: #e8e8e8;
    --bfp-line-soft: #f4f4f4;
    --bfp-surface: #fff;
    --bfp-track: #eee;
    --bfp-hover: rgba(240,145,153,.06);
    --bfp-pre-bg: #fafafa;
    --bfp-doing-bg:#fdeadf; --bfp-doing-fg:#c4632a;
    --bfp-done-bg:#e6f2ea;  --bfp-done-fg:#3a7a52;
    --bfp-wish-bg:#eaf0fa;  --bfp-wish-fg:#4a6fa5;
    --bfp-hold-bg:#f3f0e6;  --bfp-hold-fg:#8a7b45;
    --bfp-drop-bg:#f2eded;  --bfp-drop-fg:#9a6a6a;
  }
  html[data-theme="dark"] #bfp{
    --bfp-text:#fff;
    --bfp-text-2:#c6c7c8;
    --bfp-muted:#8e8f90;
    --bfp-line:#3d3e3f;
    --bfp-line-soft:#393a3b;
    --bfp-surface:#343536;
    --bfp-track:#464748;
    --bfp-hover:rgba(255,255,255,.05);
    --bfp-pre-bg:#292a2b;
    --bfp-doing-bg:#4a3126; --bfp-doing-fg:#f0a882;
    --bfp-done-bg:#27402f;  --bfp-done-fg:#8fd3a8;
    --bfp-wish-bg:#27313f;  --bfp-wish-fg:#9dbde8;
    --bfp-hold-bg:#3a3527;  --bfp-hold-fg:#d8c68a;
    --bfp-drop-bg:#3a2f2f;  --bfp-drop-fg:#d3a0a0;
  }
  #bfp .bfp-filters{ display:flex; gap:6px; margin:2px 0 8px; flex-wrap:wrap; align-items:center; }
  #bfp a#bfp-refresh{ margin-left:auto; font-size:11px; font-weight:400; color:var(--bfp-muted);
    text-decoration:none; }
  #bfp a#bfp-refresh:hover{ color:var(--bfp-accent); }
  #bfp .bfp-meta{ font-size:11px; color:var(--bfp-muted); margin:2px 0 6px; }
  #bfp.bfp-empty-state .bfp-filters button{ display:none; }
  #bfp.bfp-empty-state .bfp-filters{ margin-bottom:2px; }
  #bfp.bfp-empty-state .bfp-msg{ padding:2px 0 4px; }
  #bfp .bfp-filters button{ font-size:12px; padding:3px 11px; border-radius:13px; cursor:pointer;
    line-height:1.4; border:1px solid var(--bfp-line); background:var(--bfp-surface);
    color:var(--bfp-text-2); }
  #bfp .bfp-filters button:hover{ border-color:var(--bfp-accent); color:var(--bfp-accent); }
  #bfp .bfp-filters button.on{ background:var(--bfp-accent); border-color:var(--bfp-accent); color:#fff; }
  #bfp ul.bfp-list{ list-style:none; margin:0; padding:0; display:grid;
    grid-template-columns:repeat(auto-fill,minmax(228px,1fr)); column-gap:20px; }
  #bfp li.bfp-row{ display:grid; grid-template-columns:16px minmax(0,96px) auto minmax(20px,1fr) 36px;
    align-items:center; gap:4px; padding:5px 0; font-size:12px; border-radius:4px; }
  #bfp li.bfp-row:hover{ background:var(--bfp-hover); }
  #bfp .bfp-ava{ width:16px; height:16px; border-radius:50%; object-fit:cover;
    background:var(--bfp-track); display:block; }
  #bfp .bfp-name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    color:var(--bfp-text); text-decoration:none; }
  #bfp .bfp-name:hover{ color:var(--bfp-accent); }
  #bfp .bfp-tag{ justify-self:start; font-size:10px; padding:0 4px; border-radius:3px; line-height:15px;
    white-space:nowrap; }
  #bfp .bfp-tag.doing{ background:var(--bfp-doing-bg); color:var(--bfp-doing-fg); }
  #bfp .bfp-tag.done{ background:var(--bfp-done-bg); color:var(--bfp-done-fg); }
  #bfp .bfp-tag.wish{ background:var(--bfp-wish-bg); color:var(--bfp-wish-fg); }
  #bfp .bfp-tag.hold{ background:var(--bfp-hold-bg); color:var(--bfp-hold-fg); }
  #bfp .bfp-tag.drop{ background:var(--bfp-drop-bg); color:var(--bfp-drop-fg); }
  #bfp .bfp-track{ height:4px; border-radius:2px; background:var(--bfp-track); overflow:hidden; }
  #bfp .bfp-track i{ display:block; height:100%; background:var(--bfp-accent); border-radius:2px; }
  #bfp .bfp-num{ font-size:11px; color:var(--bfp-text-2); font-variant-numeric:tabular-nums;
    text-align:right; }
  #bfp .bfp-msg{ font-size:12px; color:var(--bfp-text-2); padding:8px 0 2px; line-height:1.7; }
  #bfp .bfp-msg a{ color:var(--bfp-accent); }
  #bfp .bfp-me{ display:flex; gap:6px; margin:4px 0 2px; }
  #bfp .bfp-me input{ flex:1 1 auto; min-width:0; font-size:12px; padding:3px 6px;
    border:1px solid var(--bfp-line); border-radius:4px; background:var(--bfp-surface);
    color:var(--bfp-text); }
  #bfp .bfp-me input:focus{ outline:none; border-color:var(--bfp-accent); }
  #bfp .bfp-me button{ flex:0 0 auto; font-size:12px; padding:3px 10px; border-radius:4px;
    border:1px solid var(--bfp-accent); background:var(--bfp-accent); color:#fff; cursor:pointer; }
  #bfp .bfp-dbg{ font-size:11px; color:var(--bfp-muted); margin-top:4px; }
  #bfp .bfp-dbg > summary{ cursor:pointer; color:var(--bfp-muted); list-style:none; }
  #bfp .bfp-dbg > summary::-webkit-details-marker{ display:none; }
  #bfp .bfp-dbg > summary:before{ content:"› "; }
  #bfp .bfp-dbg[open] > summary:before{ content:"⌄ "; }
  #bfp .bfp-dbg > summary:hover{ color:var(--bfp-accent); }
  #bfp .bfp-dbg-body{ margin-top:4px; padding-top:5px; line-height:1.7; word-break:break-all;
    border-top:1px dashed var(--bfp-line-soft); }
  #bfp .bfp-dbg pre{ margin:4px 0 0; padding:6px; background:var(--bfp-pre-bg); border-radius:4px;
    max-height:180px; overflow:auto; font-size:10px; line-height:1.5; white-space:pre-wrap;
    word-break:break-all; color:var(--bfp-text-2); }
  `;

  let state = {
    me: null,
    subjectId: null,
    total: null,
    friends: [],
    results: [],
    filter: 'all',
    pending: 0,
    moreCount: 0,
    friendDebug: null,
    friendSource: '',
    empty: false,
    needMe: false,
    error: '',
  };

  const PANEL_BODY =
    '<div class="bfp-meta" id="bfp-meta"></div>' +
    '<div class="bfp-filters" id="bfp-filters">' +
    '  <button type="button" data-f="all" class="on">全部</button>' +
    '  <button type="button" data-f="3">在看</button>' +
    '  <button type="button" data-f="2">看过</button>' +
    '  <button type="button" data-f="4">搁置</button>' +
    '  <button type="button" data-f="5">抛弃</button>' +
    '  <a href="javascript:;" id="bfp-refresh">刷新</a>' +
    '</div>' +
    '<div id="bfp-body"><div class="bfp-msg">正在读取好友列表…</div></div>';

  /**
   * wide=true 时用条目页正栏的分区结构（.subject_section + h2.subtitle），
   * 这样字号、左边距、下边框和「角色介绍」「关联条目」完全一致；
   * 退到左栏时改用 .SimpleSidePanel，避免小栏里出现 18px 的大标题。
   */
  function makeSection(wide) {
    const el = document.createElement('div');
    el.id = 'bfp';

    if (wide) {
      el.className = 'subject_section clearit';
      el.innerHTML =
        '<div class="clearit"><h2 class="subtitle">好友进度</h2></div>' + PANEL_BODY;
    } else {
      el.className = 'SimpleSidePanel';
      el.innerHTML =
        '<h2>好友进度</h2>' + PANEL_BODY;
    }
    return el;
  }

  function mount() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // 优先：主内容栏「收藏盒」下面
    const mainCol = document.querySelector('#columnSubjectHomeB');
    const box = document.querySelector('#columnSubjectInHomeB');

    if (mainCol && box && box.parentElement === mainCol) {
      mainCol.insertBefore(makeSection(true), box.nextSibling);
      return;
    }
    if (mainCol) {
      mainCol.insertBefore(makeSection(true), mainCol.firstChild);
      return;
    }

    // 兜底：跟在「谁看这部动画?」/「推荐目录」后面（窄栏）
    const anchor =
      document.querySelector('#subjectPanelCollect') ||
      document.querySelector('#subjectPanelIndex');

    if (anchor && anchor.parentElement) {
      anchor.insertAdjacentElement('afterend', makeSection(false));
      return;
    }

    const host = document.querySelector('#columnSubjectHomeA') || document.querySelector('#wrapperNeue');
    if (host) host.appendChild(makeSection(false));
    else document.body.appendChild(makeSection(false));
  }

  function statusTag(type) {
    const s = STATUS[type];
    return s ? s.label : '未收藏';
  }

  function statusCls(type) {
    const s = STATUS[type];
    return s ? s.cls : 'drop';
  }

  function sortResults(list) {
    return list.slice().sort((a, b) => {
      const oa = a.type ? ORDER[a.type] : 9;
      const ob = b.type ? ORDER[b.type] : 9;
      if (oa !== ob) return oa - ob;
      if (oa === 0 && a.ep !== b.ep) return b.ep - a.ep;       // 在看的按进度高到低
      return (b.updated || 0) - (a.updated || 0);
    });
  }

  function visibleResults() {
    const f = state.filter;
    const list = state.results;
    if (f === 'all') return list;
    return list.filter((x) => x.type === Number(f));
  }

  function render() {
    const body = document.getElementById('bfp-body');
    const meta = document.getElementById('bfp-meta');
    if (!body || !meta) return;

    const root = document.getElementById('bfp');
    if (root) root.classList.toggle('bfp-empty-state', !!(state.empty || state.needMe));

    if (state.empty) {
      meta.textContent = '';
      body.innerHTML = '<div class="bfp-msg">这个条目还没有好友收藏。</div>';
      return;
    }

    if (state.needMe) {
      meta.textContent = '';
      body.innerHTML =
        '<div class="bfp-msg">没认出当前登录用户（页面顶部没找到可识别的用户链接）。' +
        '填一次你的 bgm 用户名，之后会记在本机：</div>' +
        '<div class="bfp-me">' +
        '<input id="bfp-me-input" type="text" placeholder="bgm 用户名" autocomplete="off" spellcheck="false">' +
        '<button id="bfp-save-me" type="button">确定</button>' +
        '</div>';
      return;
    }

    if (state.error) {
      let extra = '';
      const d = state.friendDebug;
      if (d && (d.status || d.error || d.subjectScope)) {
        const parts = [];
        if (d.error) parts.push('请求失败：' + d.error);
        if (d.status) parts.push('HTTP ' + d.status);
        if (d.bytes) parts.push(Math.round(d.bytes / 1024) + ' KB');
        if (d.title) parts.push('标题「' + d.title + '」');
        if (typeof d.diu === 'number') parts.push('data-item-user×' + d.diu);
        if (typeof d.links === 'number') parts.push('/user/ 链接×' + d.links);
        if (typeof d.uniqUsers === 'number') parts.push('去重用户×' + d.uniqUsers);
        if (d.guest) parts.push('疑似未登录');
        if (typeof d.users === 'number') parts.push('解析出 ' + d.users + ' 人');
        if (d.subjectScope) parts.push('条目反查：' + d.subjectScope);
        if (d.iframe) parts.push('iframe：' + d.iframe);
        const info = parts.join(' · ');
        extra =
          '<details class="bfp-dbg"><summary>详情</summary>' +
          '<div class="bfp-dbg-body">' + esc(info) +
          (d.finalUrl ? '<br>最终地址：' + esc(d.finalUrl) : '') +
          (d.snippet
            ? '<details><summary>页面片段</summary><pre>' + esc(d.snippet) + '</pre></details>'
            : '') +
          '</div></details>';
      }
      body.innerHTML = '<div class="bfp-msg">' + esc(state.error) + '</div>' + extra;
      meta.textContent = '';
      return;
    }

    const total = state.friends.length;
    const queried = total - state.pending;
    const doing = state.results.filter((x) => x.type === 3).length;

    meta.textContent = total
      ? '已查询 ' + queried + ' / ' + total + ' 位好友' +
        (state.friendSource === 'subject' ? '（条目内反查）' : '') +
        (state.pending ? '（进行中…）' : '') +
        (doing ? '，' + doing + ' 人在看' : '') +
        (state.moreCount ? '；另有 ' + state.moreCount + ' 位超出上限未查询' : '')
      : '';

    const list = sortResults(visibleResults());
    if (!list.length) {
      body.innerHTML = '<div class="bfp-msg">' +
        (state.pending ? '正在查询…' : '这个筛选下没有数据') + '</div>';
      return;
    }

    const totalEps = state.total;
    body.innerHTML = '<ul class="bfp-list">' + list.map((r) => {
      const tag = statusTag(r.type);
      const cls = statusCls(r.type);
      const ep = r.ep || 0;
      let bar = '';
      let num = '';
      if (r.type === 3 && ep > 0) {
        const pct = totalEps ? Math.min(100, Math.round((ep / totalEps) * 100)) : 100;
        bar = '<span class="bfp-track"><i style="width:' + pct + '%"></i></span>';
        num = totalEps ? ep + '/' + totalEps : ep + ' 话';
      } else if (r.type === 3) {
        bar = '<span class="bfp-track"><i style="width:0%"></i></span>';
        num = '0' + (totalEps ? '/' + totalEps : '');
      } else {
        bar = '<span class="bfp-track" style="visibility:hidden"></span>';
        num = r.rate ? r.rate + ' 分' : '';
      }
      const ava = r.avatar
        ? '<img class="bfp-ava" src="' + esc(r.avatar) + '" alt="" loading="lazy">'
        : '<span class="bfp-ava"></span>';
      return '<li class="bfp-row" title="' + esc(relTime(r.updated)) + '">' +
        '<a href="/user/' + encodeURIComponent(r.id) + '" target="_blank" rel="noopener">' + ava + '</a>' +
        '<a class="bfp-name" href="/user/' + encodeURIComponent(r.id) + '" target="_blank" rel="noopener">' +
        esc(r.name) + '</a>' +
        '<span class="bfp-tag ' + cls + '">' + tag + '</span>' +
        bar +
        '<span class="bfp-num">' + esc(num) + '</span>' +
        '</li>';
    }).join('') + '</ul>';
  }

  let rafPending = false;
  function renderSoon() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      render();
    });
  }

  async function load() {
    state.results = [];
    state.error = '';
    state.empty = false;
    state.pending = 0;
    state.moreCount = 0;
    state.friendDebug = {};

    if (!state.me) {
      state.needMe = true;
      state.error = '';
      return render();
    }
    state.needMe = false;
    if (!state.subjectId) return;

    let friends = [];
    let subjectOk = false;
    state.friendSource = '';

    // 1) 从条目反查：这是主路径，正常返回空列表也说明「确实没有好友收藏」
    try {
      const r = await fetchSubjectFriends(state.subjectId);
      friends = r.list || [];
      subjectOk = !!r.ok;
      if (subjectOk) state.friendSource = 'subject';
    } catch (e) {
      /* 反查本身出错，才走下面的兜底 */
    }

    // 2) 只有反查整个不可用时，才退回全局好友列表
    if (!subjectOk) {
      try {
        friends = await fetchFriends(state.me);
        if (friends.length) state.friendSource = 'global';
      } catch (e) {
        /* 都失败也不报错，下面走空态 */
      }
    }

    if (!friends.length) {
      // 空结果不是错误：不打印失败文案，也不进失败缓存
      state.empty = true;
      console.info('[好友进度] 这个条目没有好友收藏', state.friendSource, state.friendDebug);
      return render();
    }
    state.empty = false;
    console.info('[好友进度] 好友 ' + friends.length + ' 位');

    const total = friends.length;
    friends = friends.slice(0, CFG.maxFriends);
    state.friends = friends;
    state.pending = friends.length;
    state.moreCount = Math.max(0, total - friends.length);
    renderSoon();

    // 总话数：优先页面，拿不到就算了（进度条退化为纯数字）
    if (!state.total) {
      state.total = getTotalEps();
      if (!state.total) {
        try {
          const r = await apiGet('/v0/subjects/' + state.subjectId);
          if (r.status === 200) state.total = JSON.parse(r.text).eps || null;
        } catch (e) { /* 忽略 */ }
      }
    }

    await Promise.all(
      friends.map((f) =>
        queue(async () => {
          let col = null;
          try {
            col = await fetchCollection(f.id, state.subjectId);
          } catch (e) {
            col = null;
          }
          const type = (col && !col.error && col.type) || f.type || 0;
          if (type) {
            state.results.push({
              id: f.id,
              name: f.name,
              avatar: f.avatar,
              type: type,
              ep: (col && col.ep) || 0,
              rate: (col && col.rate) || 0,
              updated: (col && col.updated) || 0,
            });
          }
          state.pending--;
          renderSoon();
        })
      )
    );

    state.pending = 0;
    render();
    console.info(
      '[好友进度] 查询完成：命中 ' + state.results.length + ' 位好友收藏了本条目' +
      (state.results.length ? '' : '（可能都没收藏，或对方收藏不公开）')
    );
  }

  function bind() {
    const section = document.getElementById('bfp');
    if (!section) return;

    section.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      if (t.id === 'bfp-save-me') {
        const input = document.getElementById('bfp-me-input');
        const v = (input && input.value || '').trim().replace(/^@/, '');
        if (!v) return;
        store.set('bfp:me', v);
        state.me = v;
        state.needMe = false;
        document.getElementById('bfp-body').innerHTML =
          '<div class="bfp-msg">已记住 ' + esc(v) + '，正在查询…</div>';
        load();
        return;
      }

      if (t.id === 'bfp-refresh') {
        // 清掉本条目缓存后重来
        Object.keys(localStorage)
          .filter(
            (k) =>
              k.indexOf('bfp:col:' + state.subjectId + ':') === 0 ||
              k.indexOf('bfp:friendfail:') === 0 ||
              k.indexOf('bfp:friends:') === 0
          )
          .forEach((k) => localStorage.removeItem(k));
        document.getElementById('bfp-body').innerHTML =
          '<div class="bfp-msg">重新查询中…</div>';
        load();
        return;
      }

      const f = t.getAttribute('data-f');
      if (f) {
        state.filter = f;
        section.querySelectorAll('#bfp-filters button').forEach((b) => {
          b.classList.toggle('on', b === t);
        });
        render();
      }
    });
  }

  function bootstrap() {
    state.subjectId = getSubjectId();
    if (!state.subjectId) return;

    state.me = getMe();
    mount();
    bind();
    load();

    window.__BFP_LOADED__ = true;
    console.info(
      '[好友进度] v' + (typeof GM_info !== 'undefined' && GM_info.script ? GM_info.script.version : '0.1.1') +
      ' 已启动 · subject=' + state.subjectId + ' · me=' + state.me +
      ' · panel=' + !!document.getElementById('bfp')
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
