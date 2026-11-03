// ==UserScript==
// @name         创建条目重名检查
// @namespace    bangumi.new.subject.dup.check
// @version      0.2.0
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

  // 页面顶部 secTab 的选中项即当前条目类型，如 /new_subject/1
  const secTabHref = document.querySelector('ul.secTab a.selected')?.getAttribute('href') || location.pathname;
  const subjectType = Number(secTabHref.split('/').pop());
  const titleInput = form.querySelector('[name="subject_title"]');
  const submitBtn = form.querySelector('[name=submit]');
  if (!titleInput) return;

  // 按钮"查重中……"指示
  const statusEl = document.createElement('span');
  statusEl.id = 'dupCheckStatus';
  statusEl.textContent = '';
  if (submitBtn) submitBtn.insertAdjacentElement('afterend', statusEl);

  // 旧API结果为空时会发生CORS错误，见 quickSearch；旧索引收录慢，新建条目可能搜不到（如 anime "LOVE"）。
  // 故先查旧 API，无完全同名再查新 API 补漏；新 API 用 POST，空结果也不会触发 CORS 错误
  const nameEq = (title) => (item) => norm(item.name) === norm(title) || norm(item.name_cn) === norm(title);
  async function searchLegacy(keyword, type) {
    try {
      const res = await fetch(`https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=${type}&max_results=25`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).list || [];
    } catch (e) {
      console.warn('重名检查：旧 API 搜索失败', e);
      return [];
    }
  }

  async function searchNeo(keyword, filter) {
    try {
      const res = await fetch('https://api.bgm.tv/v0/search/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, filter })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).data || [];
    } catch (e) {
      console.warn('重名检查：新 API 搜索失败', e);
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

  // 提示重名结果；输入"仍然创建"则继续提交，否则拦截
  function alertBlock(message, list, allowProceed = false) {
    const lines = list.slice(0, 10).map((item) => {
      const extra = [
        item.name_cn && item.name_cn !== item.name ? item.name_cn : '',
        item.date || ''
      ].filter(Boolean).join(' · ');
      return `${location.origin}/subject/${item.id} ${item.name || ''}${extra ? `（${extra}）` : ''}`;
    });
    if (!allowProceed) {
      alert(`${message}\n\n${lines.join('\n')}`);
      return;
    }
    const input = prompt(`${message}\n\n${lines.join('\n')}\n\n如仍要创建，请输入"仍然创建"：`);
    if (input?.trim() === '仍然创建') {
      passChecked = true;
      submitForm();
    }
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
    statusEl.textContent = '查重中……';
    try {
      // 搜索时已按类型过滤，同名即视为重名；旧 API 未命中完全同名再查新 API 补漏
      const nameHits = dedupe(await searchLegacy(title, subjectType)).filter(nameEq(title));
      if (!nameHits.length) {
        const neoHits = dedupe(await searchNeo(title, { type: [subjectType] })).filter(nameEq(title));
        if (neoHits.length) nameHits.push(...neoHits);
      }
      if (nameHits.length) {
        // 重名一律拦截，不提供"仍然创建"
        alertBlock('已存在同名条目，请修改条目名后再创建：', nameHits);
        return;
      }
      if (subjectType === 1) {
        const isbns = extractIsbns();
        // 新 API 不能按 ISBN 搜索：ISBN 未建关键字索引，filter.isbn 也不生效（实测连 subject 1
        // 的 ISBN 都搜不到），且旧 API 为关键字匹配可能混入误报，结果交由用户自行打开确认
        const lists = await Promise.all(isbns.map((isbn) => searchLegacy(isbn, 1)));
        const isbnHits = dedupe(lists.flat());
        if (isbnHits.length) {
          alertBlock('疑似存在相同 ISBN 的条目，请修改条目名后再创建：', isbnHits, true);
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
      statusEl.textContent = '';
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
