// ==UserScript==
// @name         创建条目重名检查
// @namespace    bangumi.new.subject.dup.check
// @version      0.1.0
// @description  创建条目前用搜索 API 查重，存在同名条目时要求先修改条目名；书籍另用 ISBN 查重
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/new_subject/*
// @match        http*://bangumi.tv/new_subject/*
// @match        http*://chii.in/new_subject/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const form = document.querySelector('form[name=create_subject]');
  if (!form || !/^\/new_subject\/\d+$/.test(location.pathname)) return;

  // 1=书籍 2=动画 3=音乐 4=游戏 6=现实
  const subjectType = Number(location.pathname.split('/').pop());
  const titleInput = form.querySelector('[name="subject_title"]');
  const submitBtn = form.querySelector('[name=submit]');
  if (!titleInput) return;

  async function searchV0(keyword, type) {
    const res = await fetch('https://api.bgm.tv/v0/search/subjects', {
      method: 'POST',
      body: JSON.stringify({ keyword, filter: { type: [type] }, limit: 25 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).data || [];
  }

  // 旧API结果为空时会发生CORS错误，见 quickSearch
  async function searchLegacy(keyword, type) {
    const res = await fetch(`https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=${type}&max_results=25`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).list || [];
  }

  async function searchSubjects(keyword, type) {
    try {
      return await searchV0(keyword, type);
    } catch (e) {
      console.warn('重名检查：v0 搜索失败，改用旧 API', e);
    }
    try {
      return await searchLegacy(keyword, type);
    } catch (e) {
      console.warn('重名检查：旧 API 搜索失败', e);
      return [];
    }
  }

  // 旧 API 对 ISBN 检索更可靠，失败再试 v0
  async function searchIsbn(keyword) {
    try {
      return await searchLegacy(keyword, 1);
    } catch (e) {
      console.warn('重名检查：ISBN 旧 API 搜索失败，改用 v0', e);
    }
    try {
      return await searchV0(keyword, 1);
    } catch (e) {
      console.warn('重名检查：ISBN v0 搜索失败', e);
      return [];
    }
  }

  function extractIsbns() {
    const infobox = document.querySelector('#subject_infobox')?.value || '';
    const raw = [...infobox.matchAll(/^\|ISBN\s*=\s*(.+)$/gim)]
      .flatMap((m) => m[1].split(/[\s,，;；、]+/))
      .map((s) => s.replace(/-/g, '').trim())
      .filter((s) => /^[0-9Xx]{10,13}$/.test(s));
    return [...new Set(raw)];
  }

  const norm = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');

  function dedupe(list) {
    const seen = new Set();
    return list.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
  }

  function alertBlock(message, list) {
    const lines = list.slice(0, 10).map((item) => {
      const extra = [
        item.name_cn && item.name_cn !== item.name ? item.name_cn : '',
        item.date || ''
      ].filter(Boolean).join(' · ');
      return `${location.origin}/subject/${item.id} ${item.name || ''}${extra ? `（${extra}）` : ''}`;
    });
    alert(`${message}\n\n${lines.join('\n')}`);
  }

  function submitForm() {
    if (form.requestSubmit) {
      form.requestSubmit(submitBtn);
    } else if (submitBtn) {
      submitBtn.click();
    }
  }

  let checking = false;
  let passChecked = false;

  async function check(title) {
    checking = true;
    try {
      // 同名且 type 相同才算重名
      const nameHits = dedupe(await searchSubjects(title, subjectType))
        .filter((item) => item.type === subjectType
          && (norm(item.name) === norm(title) || norm(item.name_cn) === norm(title)));
      if (nameHits.length) {
        alertBlock('已存在同名条目，请修改条目名后再创建：', nameHits);
        return;
      }
      if (subjectType === 1) {
        const isbns = extractIsbns();
        const lists = await Promise.all(isbns.map((isbn) => searchIsbn(isbn)));
        const isbnHits = dedupe(lists.flat()).filter((item) => item.type === subjectType);
        if (isbnHits.length) {
          alertBlock('已存在相同 ISBN 的条目，请修改条目名后再创建：', isbnHits);
          return;
        }
      }
      passChecked = true;
      submitForm();
    } catch (e) {
      // 查重接口异常时不阻塞创建
      console.warn('重名检查失败：', e);
      passChecked = true;
      submitForm();
    } finally {
      checking = false;
    }
  }

  document.addEventListener('submit', (e) => {
    if (e.target !== form) return;
    if (passChecked) {
      passChecked = false;
      return;
    }
    if (checking) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const title = titleInput.value.trim();
    if (!title) return; // 空标题交给页面自身校验

    // 文档捕获阶段先于表单上的其他脚本监听，拦截后查重再放行
    e.preventDefault();
    e.stopPropagation();
    check(title);
  }, true);
})();
