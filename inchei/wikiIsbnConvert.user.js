// ==UserScript==
// @name         维基粘贴自动转换ISBN-10为ISBN-13 & 日期&日元格式
// @namespace    wiki.isbn.convert
// @version      0.1.0
// @description  在班固米维基粘贴时自动处理：ISBN-10转13、ISBN-13去横杠、日期标准化为YYYY-MM-DD、円转换为JP¥
// @author       groky
// @match        https://bgm.tv/new_subject/*
// @match        https://bgm.tv/subject/*/edit_detail
// @match        https://bangumi.tv/new_subject/*
// @match        https://bangumi.tv/subject/*/edit_detail
// @match        https://chii.in/new_subject/*
// @match        https://chii.in/subject/*/edit_detail
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @license      MIT
// @gadget       https://chii.in/dev/app/5504
// ==/UserScript==

(function () {
  'use strict';

  let isProcessing = false;

  // ====================== ISBN 相关处理 ======================
  function isbn10to13(isbn10) {
    let clean = isbn10.replace(/[^0-9X]/gi, '');
    if (clean.length !== 10) return null;
    if (!/^[0-9]{9}[0-9X]$/.test(clean)) return null;
    if (clean.startsWith('978') || clean.startsWith('979')) return null;

    let digits = '978' + clean.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let d = parseInt(digits[i], 10);
      sum += (i % 2 === 0) ? d : d * 3;
    }
    let check = (10 - (sum % 10)) % 10;
    return digits + check;
  }

  function cleanIsbn13(isbn13) {
    const clean = isbn13.replace(/[^0-9]/gi, '');
    if (clean.length === 13 && /^[0-9]{13}$/.test(clean)) {
      return clean;
    }
    return null;
  }

  function isProbablyISBN10(text) {
    if (typeof text !== 'string' || text.length < 8) return false;
    if (!/^[0-9Xx-]+$/.test(text)) return false;
    const clean = text.replace(/[^0-9X]/gi, '');
    return clean.length === 10 && /^[0-9]{9}[0-9X]$/.test(clean);
  }

  function isProbablyISBN13(text) {
    if (typeof text !== 'string' || text.length < 10) return false;
    if (!/^[0-9-]+$/.test(text)) return false;
    const clean = text.replace(/[^0-9]/gi, '');
    return clean.length === 13 && /^[0-9]{13}$/.test(clean);
  }

  // ====================== 日期相关处理 ======================
  function normalizeDate(dateText) {
    // 去除中文年月日字符
    const cleanDate = dateText.replace(/年|月|日/g, '-').replace(/\/|-/g, '-').trim();
    // 按横杠分割成年、月、日
    const [year, month, day] = cleanDate.split('-').map(item => item.trim());

    // 基础校验：必须有年、月、日三个部分，且年份为4位数字
    if (!year || !month || !day || year.length !== 4 || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      return null;
    }

    // 转换为数字并补零（月份/日期不足两位补0）
    const y = parseInt(year, 10);
    const m = parseInt(month, 10).toString().padStart(2, '0');
    const d = parseInt(day, 10).toString().padStart(2, '0');

    // 校验月份和日期的合法性
    if (parseInt(m) < 1 || parseInt(m) > 12 || parseInt(d) < 1 || parseInt(d) > 31) {
      return null;
    }

    return `${y}-${m}-${d}`;
  }

  function isProbablyDate(text) {
    if (typeof text !== 'string' || text.length < 8 || text.length > 20) return false;
    // 匹配 YYYY年MM月DD日 / YYYY/M/D / YYYY-M-D 等核心格式
    const dateRegex = /^\d{4}([年/-]\d{1,2})([月/-]\d{1,2})日?$/;
    return dateRegex.test(text.trim());
  }

  function convertYen(yenText) {
    // 提取数字部分（支持带千位分隔符的数字，如 1,234円）
    const numMatch = yenText.trim().match(/(\d{1,3}(,\d{3})*|\d+)/);
    if (!numMatch) return null;
    // 去除千位分隔符并转换为纯数字
    const cleanNum = numMatch[0].replace(/,/g, '');
    if (Number.isNaN(cleanNum) || cleanNum.length === 0) return null;
    return `JP¥${cleanNum}`;
  }

  function isProbablyYen(text) {
    if (typeof text !== 'string') return false;
    // 匹配 数字+円（支持数字和円之间有空格）
    const yenRegex = /^\s*\d+(,\d{3})*\s*円\s*$/;
    return yenRegex.test(text);
  }

  // ====================== 通用工具函数 ======================
  function getCurrentMonacoEditor(target) {
    if (!window.monaco || !window.monaco.editor) return null;

    let el = target;
    while (el && !el.classList?.contains('monaco-editor')) {
      el = el.parentElement;
    }
    if (!el) return null;

    const editors = window.monaco.editor.getEditors();
    for (const editor of editors) {
      if (editor.getDomNode() === el || editor.getDomNode().contains(el)) {
        return editor;
      }
    }
    return null;
  }

  function insertText(target, editor, textToInsert, start, end) {
    try {
      if (editor) {
        const model = editor.getModel();
        if (model) {
          const range = editor.getSelection() || {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
          };

          editor.executeEdits('isbn-convert', [{
            range: range,
            text: textToInsert,
            forceMoveMarkers: true
          }]);

          const lines = textToInsert.split('\n');
          const lastLineLen = lines[lines.length - 1].length;
          editor.setPosition({
            lineNumber: range.startLineNumber + lines.length - 1,
            column: range.startColumn + lastLineLen
          });
        }
      } else {
        const value = target.value || '';
        target.value = value.slice(0, start) + textToInsert + value.slice(end);
        target.selectionStart = target.selectionEnd = start + textToInsert.length;

        target.dispatchEvent(new Event('input',  { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    } catch (err) {
      console.warn('[ISBN Auto] 插入文本出错:', err);
      return false;
    }
  }

  // ====================== 粘贴事件处理 ======================
  document.addEventListener('paste', function (e) {
    if (isProcessing) return;

    const target = e.target;
    if (!target) return;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
    if (target.readOnly || target.disabled) return;

    const pasteText = (e.clipboardData || window.clipboardData)?.getData('text')?.trim();
    if (!pasteText) return;

    let textToInsert = null;
    let logType = '';

    // 处理优先级：日期 > ISBN10 > ISBN13 > 日元（可根据需求调整）
    if (isProbablyDate(pasteText)) {
      textToInsert = normalizeDate(pasteText);
      logType = '日期标准化';
    } else if (isProbablyISBN10(pasteText)) {
      textToInsert = isbn10to13(pasteText);
      logType = 'ISBN10→13';
    } else if (isProbablyISBN13(pasteText)) {
      textToInsert = cleanIsbn13(pasteText);
      logType = 'ISBN13去横杠';
    } else if (isProbablyYen(pasteText)) {
      textToInsert = convertYen(pasteText);
      logType = '日元格式转换';
    }

    if (!textToInsert) return;

    isProcessing = true;
    e.preventDefault();
    e.stopPropagation();

    const start = target.selectionStart ?? 0;
    const end   = target.selectionEnd   ?? start;
    const editor = getCurrentMonacoEditor(target);

    try {
      const insertSuccess = insertText(target, editor, textToInsert, start, end);
      if (insertSuccess) {
        console.log(`[ISBN Auto] ${logType}:`, pasteText, '→', textToInsert);
      } else {
        throw new Error('插入处理失败');
      }
    } catch (err) {
      console.warn('[ISBN Auto] 处理出错:', err);
      // 出错回退：粘贴原始内容
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        target.value = (target.value || '').slice(0, start) + pasteText + (target.value || '').slice(end);
        target.selectionStart = target.selectionEnd = start + pasteText.length;
      }
    } finally {
      setTimeout(() => {
        isProcessing = false;
      }, 50);
    }
  }, true);

})();
