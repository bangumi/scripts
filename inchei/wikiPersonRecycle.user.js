// ==UserScript==
// @name         人物回收合并
// @namespace    bangumi.wiki.person.recycle
// @version      0.1.0
// @description  将当前人物的全部关联转移到目标人物，为目标人物添加别名，并清空源人物信息标记「待回收」
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/person/*
// @match        http*://bangumi.tv/person/*
// @match        http*://chii.in/person/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// @gf
// ==/UserScript==

(function () {
  'use strict';

  const JOB_KEY = 'bgm-recycle-job';
  const TYPE_ORDER = ['anime', 'book', 'music', 'game', 'real', 'person'];
  const TYPE_CN = { anime: '动画', book: '书籍', music: '音乐', game: '游戏', real: '三次元', person: '人物' };
  const PHASE_CN = { transfer: '转移关联', alias: '添加别名', clean: '清理关联', edit: '标记待回收' };

  function readJob() {
    try {
      return JSON.parse(sessionStorage.getItem(JOB_KEY));
    } catch {
      return null;
    }
  }

  function writeJob(job) {
    sessionStorage.setItem(JOB_KEY, JSON.stringify(job));
  }

  function clearJob() {
    sessionStorage.removeItem(JOB_KEY);
  }

  function setEditSummary(text) {
    const el = document.querySelector('#editSummary');
    if (el) el.value = text;
  }

  function addAliasLine(value, aliasName) {
    const aliasLine = `[${aliasName}]`;
    const lines = value.split('\n');
    const aliasIdx = lines.findIndex((l) => /^\|别名=\{$/.test(l.trim()));
    if (aliasIdx >= 0) {
      if (lines.slice(aliasIdx + 1).some((l) => l.trim() === aliasLine)) return value;
      lines.splice(aliasIdx + 1, 0, aliasLine);
      return lines.join('\n');
    }
    const cnIdx = lines.findIndex((l) => /^\|简体中文名=/.test(l.trim()));
    const insertIdx = cnIdx >= 0 ? cnIdx + 1 : 1;
    lines.splice(insertIdx, 0, '|别名={', aliasLine, '}');
    return lines.join('\n');
  }

  function hasAlias(value, aliasName) {
    return addAliasLine(value, aliasName) === value;
  }

  const style = document.createElement('style');
  style.textContent = `
#crtRelateSubjects li.bgm-recycle-new {
  background-color: rgba(255, 224, 130, 0.45) !important;
}
#bgm-recycle-bar {
  background: #fff;
  color: #333;
  border: 1px solid #ffb300;
}
html[data-theme="dark"] #bgm-recycle-bar {
  background: #2a2a2a;
  color: #e0e0e0;
  border-color: #9a7d1e;
}
html[data-theme="dark"] #crtRelateSubjects li.bgm-recycle-new {
  background-color: rgba(180, 150, 60, 0.4) !important;
}
`;
  document.head.appendChild(style);

  function isValidPipelinePage(job) {
    const path = location.pathname;
    if (job.phase === 'transfer' || job.phase === 'clean') {
      const pid = job.phase === 'transfer' ? job.targetId : job.srcId;
      const type = job.queue[job.idx];
      return path === `/person/${pid}/add_related/${type}` || path === `/person/${pid}`;
    }
    if (job.phase === 'alias') {
      return path === `/person/${job.targetId}/edit` || path === `/person/${job.targetId}`;
    }
    if (job.phase === 'edit') {
      return path === `/person/${job.srcId}/edit` || path === `/person/${job.srcId}`;
    }
    return false;
  }

  function findModifyRow() {
    const tool = document.querySelector('.modifyTool .tip_i');
    if (!tool) return null;
    const ps = [...tool.querySelectorAll('p')];
    return ps.find((p) => p.querySelector('a[href$="/edit"]')) || ps[1] || ps[0] || tool;
  }

  function initEntry() {
    const m = location.pathname.match(/^\/person\/(\d+)$/);
    if (!m) return;
    const srcName = document.querySelector('.nameSingle a')?.textContent.trim();
    if (!srcName) return;
    const row = findModifyRow();
    if (!row) return;
    const a = document.createElement('a');
    a.className = 'l';
    a.href = 'javascript:void(0)';
    a.textContent = ' / 回收';
    a.addEventListener('click', () => startRecycle(m[1], srcName));
    row.append(a);
  }

  async function startRecycle(srcId, srcName) {
    if (readJob()) {
      if (!confirm('已存在进行中的回收任务，是否覆盖并重新开始？')) return;
      clearJob();
    }
    const raw = prompt('输入目标人物ID：');
    if (raw == null) return;
    const targetId = raw.trim();
    if (!/^\d+$/.test(targetId)) {
      alert('目标ID格式不正确');
      return;
    }
    if (targetId === srcId) {
      alert('目标人物不能是当前人物');
      return;
    }

    let targetName = null;
    try {
      const res = await fetch(`/person/${targetId}`);
      if (res.ok) {
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        targetName = doc.querySelector('.nameSingle a')?.textContent.trim() || null;
      }
    } catch {
      /* ignore */
    }
    if (!targetName) {
      alert('获取目标人物信息失败，请检查目标ID');
      return;
    }

    const job = {
      srcId,
      targetId,
      srcName,
      targetName,
      phase: 'transfer',
      queue: [],
      idx: 0,
      rows: {},
      pending: null,
    };

    let failed = false;
    const checked = {};
    for (const type of TYPE_ORDER) {
      let rows;
      try {
        rows = await collectSourceRows(srcId, type);
      } catch {
        rows = null;
      }
      if (rows === null) {
        failed = true;
        break;
      }
      job.rows[type] = rows;
      checked[type] = rows.length;
      if (rows.length) job.queue.push(type);
    }
    if (failed) {
      alert('获取关联失败：请确认已登录 bangumi 后重试');
      return;
    }
    if (!job.queue.length) {
      console.warn('[bgm-recycle] 未在源人物 add_related 页解析到任何关联行', checked);
    }

    writeJob(job);
    if (job.queue.length) {
      location.href = `/person/${targetId}/add_related/${job.queue[0]}`;
      return;
    }
    job.phase = 'alias';
    job.idx = 0;
    writeJob(job);
    location.href = `/person/${targetId}`;
  }

  async function collectSourceRows(srcId, type) {
    const res = await fetch(`/person/${srcId}/add_related/${type}`);
    if (!res.ok) return [];
    const html = await res.text();
    if (html.includes('当前操作需要您')) return null;
    const list = parseCrtRelations(html);
    if (!list) return [];
    return list.map((e) => crtRowToRow(e, type)).filter(Boolean);
  }

  function parseCrtRelations(html) {
    const m = /var\s+crtRelations\s*=\s*(\[[\s\S]*?\]);?\s*\n?/.exec(html);
    if (!m) return null;
    try {
      return JSON.parse(m[1]);
    } catch {
      return null;
    }
  }

  function crtRowToRow(e, type) {
    if (type === 'person') {
      const id = String(e.id ?? '');
      if (!/^\d+$/.test(id)) return null;
      return {
        id,
        name: e.name || '',
        urlMod: 'person',
        posValue: e.rlt_type != null ? String(e.rlt_type) : '',
        appearEps: '',
        remark: '',
        checkboxes: [{ key: 'rlt_ended', checked: e.rlt_ended === 1 }],
      };
    }
    const id = String(e.subject_id != null ? e.subject_id : (e.id ?? ''));
    if (!/^\d+$/.test(id)) return null;
    return {
      id,
      name: e.name || e.subject_name || '',
      urlMod: e.url_mod || 'subject',
      posValue: e.prsn_position != null ? String(e.prsn_position) : '',
      appearEps: e.prsn_appear_eps != null ? String(e.prsn_appear_eps) : '',
      remark: e.summary || '',
      checkboxes: [],
    };
  }

  function findTargetLi(row) {
    return [...document.querySelectorAll('#crtRelateSubjects > li')].find((li) => {
      const a = li.querySelector('.title a');
      if (!a) return false;
      if ((a.getAttribute('href') || '').split('/').pop() !== String(row.id)) return false;
      const sel = li.querySelector('select');
      if (!sel) return true;
      return sel.value === row.posValue;
    });
  }

  function addMissingRows(type, missing) {
    if (typeof addRelateSubject !== 'function' || typeof subjectList === 'undefined') return;
    const typeId = { book: 1, anime: 2, music: 3, game: 4, real: 6, person: 0 }[type];
    missing.forEach((row) => {
      subjectList = [{ id: Number(row.id), type_id: typeId, name: row.name, name_cn: '', url_mod: row.urlMod }];
      addRelateSubject(0, 'submitForm');
      const newLi = document.querySelector('#crtRelateSubjects > li');
      if (!newLi) return;
      const sel = newLi.querySelector('select[name$="[prsnPos]"]') || newLi.querySelector('select');
      if (sel && row.posValue && [...sel.options].some((o) => o.value === row.posValue)) {
        sel.value = row.posValue;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const appearInput = newLi.querySelector('input[type=text][name*="appear_eps"]');
      if (appearInput && row.appearEps) appearInput.value = row.appearEps;
      const remarkInput = [...newLi.querySelectorAll('input[type=text]')].find(
        (i) => !(i.name || '').includes('appear_eps') && !(i.className || '').includes('item_sort'),
      );
      if (remarkInput && row.remark) remarkInput.value = row.remark;
      row.checkboxes.forEach((cb) => {
        const el = [...newLi.querySelectorAll('input[type=checkbox]')].find((c) =>
          (c.name || '').endsWith(`[${cb.key}]`),
        );
        if (el) el.checked = cb.checked;
      });
      newLi.classList.add('bgm-recycle-new');
    });
  }

  function removeAllRows() {
    [...document.querySelectorAll('#crtRelateSubjects > li')].forEach((li) => {
      const x = li.querySelector('a.h.rr');
      if (x) x.click();
      if (li.isConnected) li.remove();
    });
  }

  function renderBar(job, text) {
    let bar = document.getElementById('bgm-recycle-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bgm-recycle-bar';
      bar.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;max-width:320px;padding:10px 12px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.18);font-size:12px;line-height:1.6;font-family:sans-serif;';
      document.body.appendChild(bar);
    }
    bar.innerHTML = '';
    const title = document.createElement('div');
    title.style.fontWeight = '700';
    title.textContent = `回收合并：${PHASE_CN[job.phase]}${stepSuffix(job)}`;
    const line1 = document.createElement('div');
    line1.textContent = `${job.srcName} → ${job.targetName}`;
    const line2 = document.createElement('div');
    line2.textContent = text || '';
    bar.append(title, line1, line2);
  }

  function stepSuffix(job) {
    if (job.phase === 'transfer' || job.phase === 'clean') {
      return ` · ${TYPE_CN[job.queue[job.idx]]}（${job.idx + 1}/${job.queue.length}）`;
    }
    return '';
  }

  function advance(job) {
    job.pending = null;
    if (job.phase === 'transfer') {
      job.idx++;
      writeJob(job);
      if (job.idx < job.queue.length) {
        location.href = `/person/${job.targetId}/add_related/${job.queue[job.idx]}`;
        return;
      }
      job.phase = 'alias';
      job.idx = 0;
      writeJob(job);
      location.href = `/person/${job.targetId}`;
      return;
    }
    if (job.phase === 'alias') {
      gotoClean(job);
      return;
    }
    if (job.phase === 'clean') {
      job.idx++;
      writeJob(job);
      if (job.idx < job.queue.length) {
        location.href = `/person/${job.srcId}/add_related/${job.queue[job.idx]}`;
        return;
      }
      job.phase = 'edit';
      job.idx = 0;
      writeJob(job);
      location.href = `/person/${job.srcId}/edit`;
      return;
    }
    finish();
  }

  function gotoClean(job) {
    if (!job.queue.length) {
      job.phase = 'edit';
      job.idx = 0;
      job.pending = null;
      writeJob(job);
      location.href = `/person/${job.srcId}/edit`;
      return;
    }
    job.phase = 'clean';
    job.idx = 0;
    job.pending = null;
    writeJob(job);
    location.href = `/person/${job.srcId}/add_related/${job.queue[0]}`;
  }

  function stepKey(job) {
    if (job.phase === 'transfer') return `transfer:${job.queue[job.idx]}`;
    if (job.phase === 'clean') return `clean:${job.queue[job.idx]}`;
    return job.phase;
  }

  function alreadyWorked(job) {
    return job.pending === stepKey(job);
  }

  function finish() {
    clearJob();
    alert('回收完成：关联已转移、别名已添加、源人物信息已清空并标记「待回收」');
  }

  function handleTransfer(job) {
    const type = job.queue[job.idx];
    if (location.pathname === `/person/${job.targetId}/add_related/${type}`) {
      if (alreadyWorked(job)) {
        advance(job);
        return;
      }
      handleTransferFill(job, type);
      return;
    }
    if (alreadyWorked(job)) {
      advance(job);
      return;
    }
    location.href = `/person/${job.targetId}/add_related/${type}`;
  }

  function handleTransferFill(job, type) {
    if (typeof addRelateSubject !== 'function') {
      clearJob();
      alert('关联页面加载异常，请确认已登录 bangumi 后重试');
      return;
    }
    const rows = job.rows[type] || [];
    if (!rows.length) {
      advance(job);
      return;
    }
    let cancelled = false;
    document.addEventListener('click', () => {
      cancelled = true;
    }, { capture: true, once: true });
    const run = () => {
      if (cancelled) return;
      if (!document.querySelector('#crtRelateSubjects')) {
        setTimeout(run, 200);
        return;
      }
      const missing = rows.filter((row) => !findTargetLi(row));
      const existingCount = rows.length - missing.length;
      if (missing.length === 0) {
        advance(job);
        return;
      }
      addMissingRows(type, missing);
      setEditSummary(`从${job.srcName}回收合并`);
      job.pending = `transfer:${type}`;
      writeJob(job);
      renderBar(job, `源 ${rows.length} 项 · 新增 ${missing.length} 项 · 已有 ${existingCount} 项`);
    };
    run();
  }

  function handleAlias(job) {
    if (alreadyWorked(job)) {
      gotoClean(job);
      return;
    }
    if (location.pathname === `/person/${job.targetId}`) {
      handleAliasNameCheck(job);
      return;
    }
    if (location.pathname === `/person/${job.targetId}/edit`) {
      handleAliasEdit(job);
      return;
    }
    location.href = `/person/${job.targetId}`;
  }

  function handleAliasNameCheck(job) {
    const a = document.querySelector('.nameSingle a');
    const name = a?.textContent.trim() || a?.getAttribute('title')?.trim() || '';
    if (name && job.srcName && name === job.srcName) {
      gotoClean(job);
      return;
    }
    location.href = `/person/${job.targetId}/edit`;
  }

  function handleAliasEdit(job) {
    const infoboxInput = document.querySelector('#subject_infobox');
    if (!infoboxInput) {
      gotoClean(job);
      return;
    }
    if (alreadyWorked(job)) {
      gotoClean(job);
      return;
    }
    if (job.srcName && hasAlias(infoboxInput.value, job.srcName)) {
      gotoClean(job);
      return;
    }
    fillAlias(job);
    job.pending = 'alias';
    writeJob(job);
    renderBar(job, `添加别名：${job.srcName}`);
  }

  function fillAlias(job) {
    const infoboxInput = document.querySelector('#subject_infobox');
    if (!infoboxInput) return;
    const isNormal = typeof nowmode !== 'undefined' && nowmode === 'normal';
    if (isNormal) {
      if (typeof NormaltoWCODE !== 'function') return;
      NormaltoWCODE();
    }
    infoboxInput.value = addAliasLine(infoboxInput.value, job.srcName);
    if (isNormal) {
      if (typeof WCODEtoNormal !== 'function') return;
      WCODEtoNormal();
    }
    setEditSummary(`回收合并：添加别名${job.srcName}`);
    infoboxInput.scrollIntoView({ block: 'center' });
    infoboxInput.style.outline = '2px solid #ffb300';
    setTimeout(() => {
      infoboxInput.style.outline = '';
    }, 4000);
  }

  function handleClean(job) {
    const type = job.queue[job.idx];
    if (location.pathname === `/person/${job.srcId}/add_related/${type}`) {
      handleCleanFill(job, type);
      return;
    }
    if (alreadyWorked(job)) {
      advance(job);
      return;
    }
    location.href = `/person/${job.srcId}/add_related/${type}`;
  }

  function handleCleanFill(job, type) {
    if (alreadyWorked(job)) {
      advance(job);
      return;
    }
    let cancelled = false;
    document.addEventListener('click', () => {
      cancelled = true;
    }, { capture: true, once: true });
    const run = () => {
      if (cancelled) return;
      if (!document.querySelector('#crtRelateSubjects')) {
        setTimeout(run, 200);
        return;
      }
      const lis = [...document.querySelectorAll('#crtRelateSubjects > li')];
      if (lis.length === 0) {
        advance(job);
        return;
      }
      removeAllRows();
      setEditSummary('回收清理：移除全部关联');
      job.pending = `clean:${type}`;
      writeJob(job);
      renderBar(job, `移除 ${lis.length} 项关联`);
    };
    run();
  }

  function handleEdit(job) {
    if (location.pathname === `/person/${job.srcId}/edit`) {
      handleEditForm(job);
      return;
    }
    if (alreadyWorked(job)) {
      finish();
      return;
    }
    location.href = `/person/${job.srcId}/edit`;
  }

  function handleEditForm(job) {
    if (alreadyWorked(job)) {
      finish();
      return;
    }
    const nameInput = document.querySelector('[name="crt_name"]');
    const infoInput = document.querySelector('#subject_infobox');
    if (nameInput) nameInput.value = '待回收';
    if (infoInput) fillRecycleInfobox(infoInput);
    uncheckProfession();
    setEditSummary(`回收至#${job.targetId}`);
    if (infoInput) {
      infoInput.scrollIntoView({ block: 'center' });
      infoInput.style.outline = '2px solid #ffb300';
      setTimeout(() => {
        infoInput.style.outline = '';
      }, 4000);
    }
    job.pending = 'edit';
    writeJob(job);
    renderBar(job, '填写「待回收」infobox，取消全部职业，姓名改为「待回收」');
  }

  function fillRecycleInfobox(infoInput) {
    const template = `{{Infobox Crt
|简体中文名= 
|别名={
[第二中文名|]
[英文名|]
[日文名|]
[纯假名|]
[罗马字|]
[昵称|]
}
|性别= 
|生日= 
|血型= 
|身高= 
|体重= 
|BWH= 
|引用来源={
}
}}`;
    const isNormal = typeof nowmode !== 'undefined' && nowmode === 'normal';
    if (isNormal) {
      if (typeof NormaltoWCODE !== 'function') return;
      NormaltoWCODE();
    }
    infoInput.value = template;
    if (isNormal) {
      if (typeof WCODEtoNormal !== 'function') return;
      WCODEtoNormal();
    }
  }

  function uncheckProfession() {
    [...document.querySelectorAll('input[name^="prsn_pro["]')].forEach((cb) => {
      cb.checked = false;
    });
  }

  function dispatch(job) {
    if (job.phase === 'transfer') handleTransfer(job);
    else if (job.phase === 'alias') handleAlias(job);
    else if (job.phase === 'clean') handleClean(job);
    else handleEdit(job);
  }

  const job = readJob();
  if (job) {
    if (!isValidPipelinePage(job)) {
      clearJob();
      alert('回收已中止：已离开回收流程页面');
      return;
    }
    dispatch(job);
    return;
  }
  initEntry();
})();
