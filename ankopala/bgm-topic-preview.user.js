// ==UserScript==
// @name         Bangumi 发帖预览
// @namespace    https://github.com/bangumi/scripts/tree/master/ankopala
// @version      0.4.2
// @description  小组发新话题页：点「预览」让正文框原地变成预览，按官方 BBCode 规则渲染，配色跟随站点主题
// @author       ankopala
// @license      MIT
// @homepageURL  https://github.com/bangumi/scripts/tree/master/ankopala
// @supportURL   https://github.com/bangumi/scripts/issues/new
// @match        https://bgm.tv/group/*
// @match        https://bangumi.tv/group/*
// @match        https://chii.in/group/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * 渲染规则来自官方帮助页 https://bgm.tv/help/bbcode 的「显示效果」列，
 * 是站点渲染器实际吐出来的 HTML，所以预览和发帖后的结果一致：
 *
 *   [b]      → <strong>
 *   [i]      → <em>
 *   [u]      → <span style="text-decoration:underline;">
 *   [s]      → <span style="text-decoration:line-through;">
 *   [mask]   → <span style="background-color:#555;color:#555;border:1px solid #555">
 *   [color=] → <span style="color:X">
 *   [size=]  → <span style="font-size:Npt">
 *   [url]    → <a href="X" class="l">X</a>
 *   [url=X]  → <a href="X" class="l">文本</a>
 *   [img]    → <img src="X" class="code">
 *   换行     → <br />
 *   裸 URL   → 自动变成 <a class="l">
 *
 * 预览区用 class="topic_content"，直接吃站点自己的 CSS，字号行距都和真实话题页一样。
 */

(function () {
  'use strict';

  var LOG = '[topic-preview]';
  var BTN_ATTR = 'data-bgmtp';

  /* ---------------- 渲染 ---------------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function linkTag(href, text) {
    return '<a class="l" href="' + href + '" target="_blank" ' +
           'rel="nofollow external noopener noreferrer">' + text + '</a>';
  }

  function render(src) {
    var h = esc(src);
    var holds = [];   // 先占位，避免自动链接把 <a href> 里的 URL 再包一层

    function hold(html) {
      holds.push(html);
      return '\u0001' + (holds.length - 1) + '\u0001';
    }

    // 成对标签（非贪婪，允许跨行）
    var pairs = [
      ['b',     function (t) { return '<strong>' + t + '</strong>'; }],
      ['i',     function (t) { return '<em>' + t + '</em>'; }],
      ['u',     function (t) { return '<span style="text-decoration:underline;">' + t + '</span>'; }],
      ['s',     function (t) { return '<span style="text-decoration:line-through;">' + t + '</span>'; }],
      ['mask',  function (t) {
        return '<span style="background-color:#555;color:#555;border:1px solid #555;">' + t + '</span>';
      }]
    ];
    pairs.forEach(function (p) {
      var re = new RegExp('\\[' + p[0] + '\\]([\\s\\S]*?)\\[\\/' + p[0] + '\\]', 'gi');
      h = h.replace(re, function (_, t) { return hold(p[1](t)); });
    });

    // 带参数的
    h = h.replace(/\[color=([#\w]+)\]([\s\S]*?)\[\/color\]/gi, function (_, c, t) {
      return hold('<span style="color:' + c + '">' + t + '</span>');
    });
    h = h.replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, function (_, n, t) {
      return hold('<span style="font-size:' + n + 'pt">' + t + '</span>');
    });

    // 链接与图片
    h = h.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, function (_, u) {
      u = u.trim();
      return hold(linkTag(u, u));
    });
    h = h.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, function (_, u, t) {
      return hold(linkTag(u.trim(), t));
    });
    h = h.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, function (_, u) {
      return hold('<img class="code" src="' + u.trim() + '" alt="" loading="lazy">');
    });

    // 裸 URL 自动成链（站点行为）
    h = h.replace(/https?:\/\/[^\s<>"\u0001]+/g, function (u) {
      return hold(linkTag(u, u));
    });

    // 还原占位
    h = h.replace(/\u0001(\d+)\u0001/g, function (_, i) { return holds[+i]; });

    // 换行
    h = h.replace(/\r\n|\r|\n/g, '<br />');

    return h;
  }

  /* ---------------- 找编辑框 ---------------- */

  // 只在「发新话题」的场景挂载：回复框、吐槽框一律跳过
  function isNewTopicContext(form) {
    var act = (form && form.getAttribute('action') || '').toLowerCase();
    if (/new_reply|reply|say|comment\/new/.test(act)) return false;
    if (/topic\/new|new_topic/.test(act)) return true;
    if (/new_topic/.test(location.pathname)) return true;
    // 站内弹窗的表单没有 action 时，用它所在的容器 id 判断
    if (form && form.closest('#rakuen_new_topic, [id*="new_topic"]')) return true;
    return false;
  }

  function findEditor() {
    var cands = Array.prototype.slice.call(
      document.querySelectorAll('textarea[name="content"], [contenteditable="true"]')
    );

    // 面积最大的优先，避免抓到小号的搜索框
    cands = cands.filter(function (el) { return el.offsetParent !== null || el.offsetHeight; });
    cands.sort(function (a, b) {
      return (b.offsetHeight * b.offsetWidth) - (a.offsetHeight * a.offsetWidth);
    });

    for (var i = 0; i < cands.length; i++) {
      var el = cands[i];
      var form = el.closest('form');
      if (!isNewTopicContext(form)) continue;
      var isTa = el.tagName === 'TEXTAREA';
      return {
        el: el,
        kind: isTa ? 'textarea' : 'contenteditable',
        why: (isTa ? 'textarea' : 'contenteditable') +
             '（表单 action=' + ((form && form.getAttribute('action')) || '无') + '）'
      };
    }
    return null;
  }

  function readValue(ed) {
    return ed.kind === 'textarea' ? ed.el.value : ed.el.innerText;
  }

  /* ---------------- 界面 ---------------- */

  var CSS = ''
    // 配色全部走 CSS 变量，变量由 applyTheme() 从正文框的真实计算样式抄过来：
    // 底色、边框、圆角、内边距一律与 textarea 一致，不做任何提亮/降亮，
    // 否则深色下会偏灰、浅色下会偏"面板白"，看起来就不是同一个东西。
    + '.bgmtp-view{display:none;box-sizing:border-box;width:auto;max-width:100%;'
    + '  flex:1 1 auto;min-width:0;overflow:auto;'
    + '  border:1px solid var(--bgmtp-bd,rgba(0,0,0,.12));border-radius:var(--bgmtp-r,2px);'
    + '  background:var(--bgmtp-bg,#fff);color:var(--bgmtp-fg,#333);}'
    + '.bgmtp-view.bgmtp-on{display:block}'
    + '.bgmtp-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 10px;'
    + '  position:sticky;top:0;z-index:2;'
    + '  border-bottom:1px solid var(--bgmtp-bd,rgba(0,0,0,.12));'
    + '  background:var(--bgmtp-bg,#fff);'
    + '  font-size:12px;color:var(--bgmtp-dim,#666);}'
    + '.bgmtp-bar b{font-weight:600;color:var(--bgmtp-fg,#444)}'
    + '.bgmtp-bar .bgmtp-hint{color:var(--bgmtp-dim,#aaa);min-width:0}'
    + '.bgmtp-bar .bgmtp-sp{flex:1}'
    + '.bgmtp-bar button{font:inherit;font-size:11px;color:var(--bgmtp-link,#0084b4);'
    + '  background:var(--bgmtp-btn,rgba(0,0,0,.035));'
    + '  border:1px solid var(--bgmtp-btnbd,rgba(0,132,180,.35));'
    + '  border-radius:3px;padding:2px 9px;cursor:pointer;}'
    + '.bgmtp-bar button:hover{filter:brightness(.94)}'
    + '.bgmtp-body{padding:var(--bgmtp-pad,10px 8px 12px)}'
    + '.bgmtp-body .topic_content{max-width:none;padding:0;font-size:15px;line-height:160%;'
    + '  color:var(--bgmtp-fg,#333);word-wrap:break-word;}'
    + '.bgmtp-body .topic_content img{max-width:100%;vertical-align:bottom}'
    + '.bgmtp-body .topic_content a{color:var(--bgmtp-link,#0084b4);text-decoration:none}'
    + '.bgmtp-body .topic_content a:hover{text-decoration:underline}'
    + '.bgmtp-empty{color:var(--bgmtp-dim,#bbb);font-size:13px}'
    + '.bgmtp-jump{font-size:12px;color:var(--bgmtp-link,#0084b4);cursor:pointer;margin-right:8px;'
    + '  text-decoration:none;border-bottom:1px dotted currentColor}'
    + '.bgmtp-jump:hover{filter:brightness(1.15)}';

  function injectCss() {
    if (document.getElementById('bgmtp-style')) return;
    var st = document.createElement('style');
    st.id = 'bgmtp-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- 跟随站点主题 ----------------
   * 不猜 prefers-color-scheme：直接读编辑框（以及它祖先）的实际底色，
   * 这样无论是站点原生深色模式，还是 Dark Reader / Night Eye 这类
   * 用 !important 改写的深色方案，都能对上。
   *
   * 读到的颜色原封不动地交给预览块，不提亮也不混白：
   * 预览块就是正文框的替身，两边必须一模一样，多一档就是"灰面板"。
   * 文字色、边框色、圆角、左右内边距同样从 textarea 的计算样式抄。
   */

  function parseRGB(str) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/
      .exec(str || '');
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }

  function luminance(c) {
    return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  }

  function toRgba(c, a) {
    var r = Math.round(c.r), g = Math.round(c.g), b = Math.round(c.b);
    var alpha = a === undefined ? (c.a === undefined ? 1 : c.a) : a;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function nearColor(a, b) {
    return Math.abs(a.r - b.r) < 6 && Math.abs(a.g - b.g) < 6 && Math.abs(a.b - b.b) < 6;
  }

  // 一路向上收集带 alpha 的底色，再由外向内叠加，得到"眼睛看到的那一层颜色"。
  // 正文框自己是透明的（bgm 就有这种情况）时，结果才是正确的白/深。
  function probeBg(el) {
    var cur = el, stack = [], i, c;
    for (i = 0; i < 8 && cur; i++) {
      c = parseRGB(getComputedStyle(cur).backgroundColor);
      if (c && c.a > 0.01) {
        stack.push(c);
        if (c.a >= 1) break;
      }
      cur = cur.parentElement;
    }
    if (!stack.length) return null;   // 一路透明，交给调用方用白色兜底
    var out = { r: 255, g: 255, b: 255 };
    for (i = stack.length - 1; i >= 0; i--) {
      c = stack[i];
      out.r = c.r * c.a + out.r * (1 - c.a);
      out.g = c.g * c.a + out.g * (1 - c.a);
      out.b = c.b * c.a + out.b * (1 - c.a);
    }
    return out;
  }

  var lastTheme = null;

  function applyTheme() {
    if (!editor) return;
    var cs = getComputedStyle(editor.el);

    // 预览态正文框是 display:none，部分浏览器对隐藏元素返回 auto/空值，
    // 再算一遍会把已经对好的颜色冲掉，所以隐藏时沿用上一次的结果。
    if (cs.display === 'none' && lastTheme) return;

    var bg = probeBg(editor.el) || { r: 255, g: 255, b: 255, a: 1 };
    var dark = luminance(bg) < 0.5;

    // 关键：预览块就用正文框的真实底色，不 shift、不混白，两边严丝合缝
    var bgCss = toRgba(bg, 1);

    var fg = parseRGB(cs.color) || (dark ? { r: 221, g: 221, b: 221 } : { r: 51, g: 51, b: 51 });
    var fgCss = toRgba(fg, fg.a);

    // 边框同样抄正文框；透明或与底色几乎同色时，给一个刚好能看见的兜底
    var bd = parseRGB(cs.borderTopColor);
    var bdCss = (!bd || bd.a < 0.2 || nearColor(bd, bg))
      ? (dark ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.12)')
      : toRgba(bd, bd.a);

    // 左右内边距照抄正文框（起笔位置一致），上下留出正文该有的呼吸感
    var pl = parseFloat(cs.paddingLeft) || 0;
    var pr = parseFloat(cs.paddingRight) || 0;
    var pad = Math.max(parseFloat(cs.paddingTop) || 0, 10) + 'px ' + pr + 'px '
      + Math.max(parseFloat(cs.paddingBottom) || 0, 12) + 'px ' + pl + 'px';

    var v = {
      bg: bgCss,
      head: bgCss,
      btn: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.035)',
      fg: fgCss,
      dim: toRgba(fg, dark ? 0.45 : 0.55),
      bd: bdCss,
      btnbd: dark ? 'rgba(255,255,255,.22)' : 'rgba(0,132,180,.35)',
      link: dark ? '#79c0e8' : '#0084b4',
      pad: pad,
      radius: cs.borderTopLeftRadius || '0px'
    };
    lastTheme = v;

    var root = document.documentElement.style;
    var map = {
      '--bgmtp-bg': v.bg, '--bgmtp-head': v.head, '--bgmtp-btn': v.btn,
      '--bgmtp-fg': v.fg, '--bgmtp-dim': v.dim,
      '--bgmtp-bd': v.bd, '--bgmtp-btnbd': v.btnbd, '--bgmtp-link': v.link,
      '--bgmtp-pad': v.pad, '--bgmtp-r': v.radius
    };
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) root.setProperty(k, map[k]);
    }
    if (root.getPropertyValue('--bgmtp-dark') !== (dark ? '1' : '0')) {
      root.setProperty('--bgmtp-dark', dark ? '1' : '0');
      console.log(LOG, '主题：' + (dark ? '深色' : '浅色') + '（正文框底色 ' +
        'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')' +
        '，预览块已照抄同一颜色）');
    }
  }

  /* ---------------- 编辑 / 预览 切换 ---------------- */

  var SUBMIT_SEL = 'input[type="submit"], button[type="submit"]';
  var editor, view, body, jumpLink;
  var previewing = false;
  var notedHeight = 0;   // 正文框在可见状态下量到的高度，用来对齐预览块
  var boundEl = null;
  var obsTimer = null;
  var timer = null;

  function build() {
    view = document.createElement('div');
    view.className = 'bgmtp-view';
    view.innerHTML =
      '<div class="bgmtp-bar">' +
        '<b>预览</b>' +
        '<span class="bgmtp-hint">按官方 BBCode 规则渲染</span>' +
        '<span class="bgmtp-sp"></span>' +
        '<button type="button" data-act="back">返回编辑</button>' +
      '</div>' +
      '<div class="bgmtp-body"></div>';

    body = view.querySelector('.bgmtp-body');
    view.querySelector('button[data-act="back"]').addEventListener('click', function () {
      setPreview(false);
    });

    // 紧贴在正文框后面：切换时把 textarea 藏起来，它正好占住那块地方
    editor.el.parentNode.insertBefore(view, editor.el.nextSibling);
  }

  function refresh() {
    if (!view || !previewing) return;
    applyTheme();
    var v = readValue(editor);
    body.innerHTML = v.trim()
      ? '<div class="topic_content">' + render(v) + '</div>'
      : '<div class="bgmtp-empty">正文还是空的</div>';
  }

  function refreshSoon() {
    if (!previewing) return;
    clearTimeout(timer);
    timer = setTimeout(refresh, 150);
  }

  function setPreview(on) {
    if (!view) return;

    if (on) {
      applyTheme();
      // 高度对齐正文框，避免切换时页面跳一下
      var h = Math.max(180, notedHeight || editor.el.offsetHeight || 0);
      view.style.minHeight = h + 'px';
      previewing = true;
      refresh();
      view.classList.add('bgmtp-on');
      editor.el.style.display = 'none';
      try { view.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    } else {
      previewing = false;
      view.classList.remove('bgmtp-on');
      editor.el.style.display = '';
      try { editor.el.focus(); } catch (e) {}
    }

    if (jumpLink) jumpLink.textContent = on ? '返回编辑' : '预览';
    console.log(LOG, on ? '进入预览' : '回到编辑');
  }

  function addJump(ed) {
    var form = ed.el.closest('form') || document;
    var submit = form.querySelector(SUBMIT_SEL);
    if (!submit || submit.hasAttribute(BTN_ATTR)) return;
    submit.setAttribute(BTN_ATTR, '1');

    jumpLink = document.createElement('a');
    jumpLink.className = 'bgmtp-jump';
    jumpLink.textContent = '预览';
    jumpLink.addEventListener('click', function (e) {
      e.preventDefault();
      setPreview(!previewing);
    });
    submit.parentNode.insertBefore(jumpLink, submit);
  }

  /* ---------------- 启动 ---------------- */

  function boot() {
    // 已经挂好了就别重来（预览时 textarea 是隐藏的，重找会找丢）
    if (view && boundEl && document.contains(boundEl)) return true;

    var ed = findEditor();
    if (!ed) return false;

    if (view && view.parentNode) view.parentNode.removeChild(view);
    if (boundEl && boundEl.style) boundEl.style.display = '';
    view = body = jumpLink = null;
    previewing = false;

    injectCss();
    editor = ed;
    boundEl = ed.el;
    applyTheme();

    build();
    addJump(ed);
    notedHeight = ed.el.offsetHeight || ed.el.getBoundingClientRect().height || 0;

    ed.el.addEventListener('input', refreshSoon);
    ed.el.addEventListener('keyup', refreshSoon);
    ed.el.addEventListener('paste', function () { setTimeout(refresh, 60); });

    console.log(LOG, '已就绪（正文框来自 ' + ed.why + '），点提交按钮左边的「预览」切换');
    return true;
  }

  var tries = 0;
  (function attempt() {
    if (boot()) return;
    if (++tries > 10) {
      console.log(LOG, '这个页面没找到「发新话题」的编辑框，什么也没做。');
      return;
    }
    setTimeout(attempt, tries < 4 ? 200 : 600);
  })();

  // 站内的发帖弹窗是点按钮才插入的，用 observer 兜住
  try {
    new MutationObserver(function () {
      clearTimeout(obsTimer);
      obsTimer = setTimeout(boot, 120);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
})();
