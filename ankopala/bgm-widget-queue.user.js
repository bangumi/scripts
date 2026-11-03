// ==UserScript==
// @name         Bangumi 组件加载排队器
// @namespace    https://bgm.tv/
// @version      0.1.0
// @description  把超合金组件的并发请求改成串行 + 失败自动重试，避免 503 限流导致组件集体失效
// @author       anko
// @license      MIT
// @match        https://bgm.tv/*
// @match        https://bangumi.tv/*
// @match        https://chii.in/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// ==/UserScript==
(function () {
  'use strict';
  if (window.__bgmWidgetQueue) return;
  window.__bgmWidgetQueue = true;

  var GAP = 150;        // 相邻两个组件请求之间的间隔(ms)
  var MAX_RETRY = 5;    // 失败重试次数
  var queue = [];
  var busy = false;
  var stats = { done: 0, retry: 0, fail: 0 };

  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    var job = queue.shift();
    try { job(); } catch (e) { console.warn('[widget-queue]', e); }
    setTimeout(function () { busy = false; pump(); }, GAP);
  }

  function patchAjax() {
    var $ = window.jQuery || window.$;
    if (!$ || typeof $.ajax !== 'function' || $.__wqPatched) return;
    $.__wqPatched = true;
    var origAjax = $.ajax;

    $.ajax = function (opts) {
      var url = opts && opts.url;
      // 只接管组件资源请求，其他请求原样放行
      if (typeof url !== 'string' || url.indexOf('app_id=') === -1) {
        return origAjax.apply(this, arguments);
      }
      var user = { success: opts.success, error: opts.error, complete: opts.complete };
      var tries = 0;

      function attempt() {
        var o = {}, k;
        for (k in opts) {
          if (k !== 'success' && k !== 'error' && k !== 'complete') o[k] = opts[k];
        }
        o.success = function () {
          if (user.success) user.success.apply(this, arguments);
        };
        o.complete = function (xhr, st) {
          var code = xhr && xhr.status;
          var ok = (st !== 'error' && code >= 200 && code < 300) || code === 304;
          if (!ok && tries < MAX_RETRY &&
              (code === 0 || code === 429 || code === 502 || code === 503 || code === 504)) {
            tries++;
            stats.retry++;
            var wait = 600 * tries + Math.floor(Math.random() * 400);
            console.debug('[widget-queue] HTTP ' + code + ' 重试第 ' + tries + ' 次: ' + url);
            setTimeout(attempt, wait);
            return;
          }
          if (ok) stats.done++; else stats.fail++;
          if (!ok && user.error) user.error.call(this, xhr, st);
          if (user.complete) user.complete.call(this, xhr, st);
        };
        origAjax(o);
      }

      queue.push(attempt);
      pump();
      // loadPlugin 不使用返回值，给个空壳防止调用方报错
      return { abort: function () {}, done: function () { return this; }, fail: function () { return this; }, always: function () { return this; } };
    };
  }

  var hooked = false;

  function hookLoader(lib) {
    if (hooked || !lib || !lib.widget || typeof lib.widget.loader !== 'function') return;
    hooked = true;
    var origLoad = lib.widget.loader;
    lib.widget.loader = function () {
      patchAjax();
      console.info('[widget-queue] 已接管组件加载，串行间隔 ' + GAP + 'ms');
      return origLoad.apply(this, arguments);
    };
  }

  // 主脚本用 var chiiLib = {...} 赋值，预置 setter 可以在赋值瞬间截住它，
  // 保证比页面内联的 chiiLib.widget.loader(...) 调用更早。
  try {
    Object.defineProperty(window, 'chiiLib', {
      configurable: true,
      set: function (v) {
        Object.defineProperty(window, 'chiiLib', { value: v, writable: true, configurable: true });
        hookLoader(v);
      }
    });
  } catch (e) {
    console.warn('[widget-queue] 挂钩 chiiLib 失败，改用轮询', e);
  }

  // 兜底：挂钩失败时轮询
  var timer = setInterval(function () {
    if (hooked || (window.chiiLib && window.chiiLib.widget)) {
      hookLoader(window.chiiLib);
      if (hooked) clearInterval(timer);
    }
  }, 10);
  setTimeout(function () { clearInterval(timer); }, 15000);

  window.addEventListener('load', function () {
    setTimeout(function () {
      console.info('[widget-queue] 组件加载完成: 成功 ' + stats.done + ' / 重试 ' + stats.retry + ' / 失败 ' + stats.fail);
    }, 1500);
  });
})();
