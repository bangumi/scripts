// ==UserScript==
// @name         收藏页标签眼睛
// @namespace    https://bgm.tv/
// @version      1.0.0
// @description  在收藏页侧栏的每个标签旁加一个眼睛按钮，点一下即可隐藏含该标签的收藏
// @author       ankopala
// @license      MIT
// @match        https://bgm.tv/*/list/*/*
// @match        https://bangumi.tv/*/list/*/*
// @match        https://chii.in/*/list/*/*
// @match        https://bgm.tv/list/*/*
// @match        https://bangumi.tv/list/*/*
// @match        https://chii.in/list/*/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  /* ---------------- 基础状态 ---------------- */

  // 从 URL 解析收藏类型与用户名，用于区分动画/书籍/音乐各自的屏蔽表
  // /anime/list/ankopala/collect -> ["anime", "ankopala"]
  // /list/ankopala/collect       -> [undefined, "ankopala"]
  var pm = location.pathname.match(/\/(?:([a-z]+)\/)?list\/([^\/]+)\//);
  var KEY = 'bgm-tag-eye:' + (pm && pm[1] ? pm[1] : 'all') + ':' + (pm && pm[2] ? pm[2] : 'me');

  var excluded = new Set(loadHidden());
  var knownTags = new Set();
  var tagCache = new WeakMap();
  var scheduled = false;

  function loadHidden() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveHidden() {
    try {
      localStorage.setItem(KEY, JSON.stringify(Array.from(excluded)));
    } catch (e) { /* 隐私模式下可能失败，忽略 */ }
  }

  /* ---------------- 图标与样式 ---------------- */

  var EYE_OPEN =
    '<svg class="eye-open" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
    '<path d="M8 3.2C4.6 3.2 1.8 5.7 1 8c.8 2.3 3.6 4.8 7 4.8s6.2-2.5 7-4.8c-.8-2.3-3.6-4.8-7-4.8z" ' +
    'fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.1" fill="currentColor"/></svg>';

  var EYE_OFF =
    '<svg class="eye-off" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
    '<path d="M1.6 6.2c1.6 2 3.9 3.2 6.4 3.2s4.8-1.2 6.4-3.2M3.2 9.6l-1.4 1.9M8 10.2v2.3M12.8 9.6l1.4 1.9" ' +
    'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  var CSS = ''
    + '.bgm-tag-eye-btn{display:inline-flex;align-items:center;justify-content:center;'
    + 'width:17px;height:17px;margin-left:3px;padding:0;border:0;background:none;'
    + 'cursor:pointer;opacity:.32;color:inherit;vertical-align:middle;'
    + 'transition:opacity .12s,color .12s}'
    + '.bgm-tag-eye-btn:hover{opacity:.95}'
    + '.bgm-tag-eye-btn.is-on{opacity:1;color:#e74c3c}'
    + '.bgm-tag-eye-btn .eye-off{display:none}'
    + '.bgm-tag-eye-btn.is-on .eye-open{display:none}'
    + '.bgm-tag-eye-btn.is-on .eye-off{display:block}'
    + '#bgm-tag-eye-banner{margin:0 0 10px;padding:5px 9px;font-size:12px;line-height:1.6;'
    + 'color:#c0392b;background:rgba(231,76,60,.08);border-left:3px solid #e74c3c;border-radius:2px}'
    + '#bgm-tag-eye-clear{float:right;margin-top:-1px;padding:0 6px;font-size:11px;line-height:17px;'
    + 'cursor:pointer;color:#888;background:none;border:1px solid #ccc;border-radius:3px}'
    + '#bgm-tag-eye-clear:hover{color:#e74c3c;border-color:#e74c3c}';

  function injectStyle() {
    if (document.getElementById('bgm-tag-eye-style')) return;
    var s = document.createElement('style');
    s.id = 'bgm-tag-eye-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------------- 解析标签 ---------------- */

  // 侧栏 #userTagList li 里的标签名。
  // 优先从 href="?tag=xxx" 取，最可靠；取不到再退回文本。
  function tagNameOf(li) {
    var a = li.querySelector('a.l') || li.querySelector('a[href*="tag="]');
    if (!a) return '';
    var href = a.getAttribute('href') || '';
    var m = href.match(/[?&]tag=([^&#]+)/);
    if (m) {
      try { return decodeURIComponent(m[1]); } catch (e) { /* 继续 */ }
    }
    for (var i = a.childNodes.length - 1; i >= 0; i--) {
      var n = a.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) return n.textContent.trim();
    }
    return a.textContent.replace(/^\d+/, '').trim();
  }

  function collectKnownTags() {
    var set = new Set();
    var lis = document.querySelectorAll('#userTagList li');
    for (var i = 0; i < lis.length; i++) {
      var t = tagNameOf(lis[i]);
      if (t) set.add(t);
    }
    return set;
  }

  // 把被空白切碎的片段按已知标签合并回去，兼容 "Science Fiction" 这类带空格的标签。
  // 不做"子串包含"匹配，避免把「日本动画」误拆成「日本」+「动画」。
  function mergeTokens(tokens) {
    if (!knownTags.size || tokens.length < 2) return tokens;
    var out = [];
    var i = 0;
    while (i < tokens.length) {
      var matched = false;
      var maxN = Math.min(4, tokens.length - i);
      for (var n = maxN; n >= 2; n--) {
        var cand = tokens.slice(i, i + n).join(' ');
        if (knownTags.has(cand)) {
          out.push(cand);
          i += n;
          matched = true;
          break;
        }
      }
      if (!matched) { out.push(tokens[i]); i++; }
    }
    return out;
  }

  // 收藏条目的标签：优先读 .collectInfo 里带「标签:」的 .tip，
  // 读不到再从指向标签页的链接兜底。
  function parseItemTags(li) {
    var info = li.querySelector('.collectInfo');
    if (!info) return [];

    var raw = '';
    var tips = info.querySelectorAll('.tip');
    for (var i = 0; i < tips.length; i++) {
      if (/标签[:：]/.test(tips[i].textContent)) { raw = tips[i].textContent; break; }
    }

    if (!raw) {
      var fromLinks = [];
      var links = info.querySelectorAll('a[href*="/tags"], a[href*="tag="]');
      for (var j = 0; j < links.length; j++) {
        var t = links[j].textContent.trim();
        if (t) fromLinks.push(t);
      }
      return fromLinks;
    }

    var m = raw.match(/标签[:：]\s*([\s\S]*)$/);
    if (!m) return [];
    var tokens = m[1].trim().split(/\s+/).filter(Boolean);
    return mergeTokens(tokens);
  }

  function tagsOf(li) {
    if (tagCache.has(li)) return tagCache.get(li);
    var tags = parseItemTags(li);
    tagCache.set(li, tags);
    return tags;
  }

  /* ---------------- 过滤与渲染 ---------------- */

  function apply() {
    var list = document.getElementById('browserItemList');
    if (!list) return;

    var hiddenCount = 0;
    var items = list.children;
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      var tags = tagsOf(li);
      var hit = false;
      for (var k = 0; k < tags.length; k++) {
        if (excluded.has(tags[k])) { hit = true; break; }
      }
      var want = hit ? 'none' : '';
      if (li.style.display !== want) li.style.display = want;
      if (hit) hiddenCount++;
    }

    syncButtons();
    updateBanner(hiddenCount, list);
    updateClearButton();
  }

  function syncButtons() {
    var btns = document.querySelectorAll('.bgm-tag-eye-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var tag = b.getAttribute('data-tag');
      var on = excluded.has(tag);
      if (b.classList.contains('is-on') !== on) b.classList.toggle('is-on', on);
      var title = on ? '恢复显示「' + tag + '」' : '不看含「' + tag + '」的条目';
      if (b.title !== title) b.title = title;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function updateBanner(count, list) {
    var el = document.getElementById('bgm-tag-eye-banner');
    if (!el) {
      if (!list.parentNode) return;
      el = document.createElement('div');
      el.id = 'bgm-tag-eye-banner';
      list.parentNode.insertBefore(el, list);
    }
    var text = '已屏蔽 ' + count + ' 项（共 ' + excluded.size + ' 个标签）';
    if (el.textContent !== text) el.textContent = text;
    var display = (count || excluded.size) ? '' : 'none';
    if (el.style.display !== display) el.style.display = display;
  }

  function updateClearButton() {
    var btn = document.getElementById('bgm-tag-eye-clear');
    if (!btn) return;
    var display = excluded.size ? '' : 'none';
    if (btn.style.display !== display) btn.style.display = display;
  }

  /* ---------------- 注入按钮 ---------------- */

  function enhanceTags() {
    var lis = document.querySelectorAll('#userTagList li');
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i];
      if (li.querySelector('.bgm-tag-eye-btn')) continue;

      var a = li.querySelector('a.l') || li.querySelector('a[href*="tag="]');
      if (!a) continue;

      var tag = tagNameOf(li);
      if (!tag) continue;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bgm-tag-eye-btn';
      btn.setAttribute('data-tag', tag);
      btn.innerHTML = EYE_OPEN + EYE_OFF;

      // 闭包捕获当前 tag，避免循环变量问题
      btn.addEventListener('click', makeToggle(tag));

      if (a.nextSibling) {
        a.parentNode.insertBefore(btn, a.nextSibling);
      } else {
        a.parentNode.appendChild(btn);
      }
    }
  }

  function makeToggle(tag) {
    return function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (excluded.has(tag)) excluded.delete(tag);
      else excluded.add(tag);
      saveHidden();
      apply();
    };
  }

  function ensureClearButton() {
    var panel = document.querySelector('.SimpleSidePanel');
    if (!panel) return;
    if (document.getElementById('bgm-tag-eye-clear')) return;

    var header = panel.querySelector('h2');
    if (!header) return;

    var btn = document.createElement('button');
    btn.id = 'bgm-tag-eye-clear';
    btn.type = 'button';
    btn.textContent = '清空';
    btn.title = '清除全部屏蔽';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      excluded.clear();
      saveHidden();
      apply();
    });
    header.appendChild(btn);
  }

  /* ---------------- 启动 ---------------- */

  function boot() {
    if (!document.getElementById('browserItemList')) return;
    injectStyle();
    knownTags = collectKnownTags();
    enhanceTags();
    ensureClearButton();
    apply();
  }

  // 自家节点引起的 DOM 变化不触发重跑，避免自我循环
  function isOwnNode(node) {
    var el = node && node.nodeType === 1 ? node : (node && node.parentNode);
    if (!el || !el.closest) return false;
    return !!el.closest('.bgm-tag-eye-btn, #bgm-tag-eye-banner, #bgm-tag-eye-clear');
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (!isOwnNode(mutations[i].target)) return schedule();
    }
  });

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      boot();
    }, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
