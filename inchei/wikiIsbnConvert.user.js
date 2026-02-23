// ==UserScript==
// @name         维基粘贴自动转换ISBN-10为ISBN-13
// @namespace    wiki.isbn.convert
// @version      0.0.1
// @description  在班固米维基粘贴 ISBN-10 时自动转为 ISBN-13，支持普通输入框 & Monaco Editor
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
// ==/UserScript==

(function () {
    'use strict';

    let isProcessing = false;

    function isbn10to13(isbn10) {
        let clean = isbn10.replace(/[^0-9X]/gi, '');
        if (clean.length !== 10) return null;
        if (!/^[0-9]{9}[0-9X]$/.test(clean)) return null;

        // 避免误处理已转换的13位
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

    function isProbablyISBN10(text) {
        if (typeof text !== 'string' || text.length < 8) return false;
        const clean = text.replace(/[^0-9X]/gi, '');
        return clean.length === 10 && /^[0-9]{9}[0-9X]$/.test(clean);
    }

    // 尝试获取当前焦点所在的 monaco 编辑器实例
    function getCurrentMonacoEditor(target) {
        if (!window.monaco || !window.monaco.editor) return null;

        // 最常见的方式：找离 target 最近的 .monaco-editor 容器
        let el = target;
        while (el && !el.classList?.contains('monaco-editor')) {
            el = el.parentElement;
        }
        if (!el) return null;

        // 通过 monaco API 获取该 DOM 对应的 editor 实例
        const editors = window.monaco.editor.getEditors();
        for (const editor of editors) {
            if (editor.getDomNode() === el || editor.getDomNode().contains(el)) {
                return editor;
            }
        }
        return null;
    }

    document.addEventListener('paste', function (e) {
        if (isProcessing) return;

        const target = e.target;
        if (!target) return;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
        if (target.readOnly || target.disabled) return;

        const pasteText = (e.clipboardData || window.clipboardData)?.getData('text');
        if (!pasteText || !isProbablyISBN10(pasteText)) return;

        const isbn13 = isbn10to13(pasteText);
        if (!isbn13) return;

        isProcessing = true;
        e.preventDefault();
        e.stopPropagation();   // 尽量阻止冒泡

        const start = target.selectionStart ?? 0;
        const end   = target.selectionEnd   ?? start;

        try {
            const editor = getCurrentMonacoEditor(target);

            if (editor) {
                // ── 在 Monaco Editor 中使用 executeEdits ───────────────
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
                        text: isbn13,
                        forceMoveMarkers: true
                    }]);

                    // 可选：把光标移到插入文本后
                    const lines = isbn13.split('\n');
                    const lastLineLen = lines[lines.length - 1].length;
                    editor.setPosition({
                        lineNumber: range.startLineNumber + lines.length - 1,
                        column: range.startColumn + lastLineLen
                    });

                    console.log('[ISBN Monaco] 10→13:', pasteText.trim(), '→', isbn13);
                }
            } else {
                // 普通 textarea / input
                const value = target.value || '';
                target.value = value.slice(0, start) + isbn13 + value.slice(end);
                target.selectionStart = target.selectionEnd = start + isbn13.length;

                // 触发事件让页面知道值变了
                target.dispatchEvent(new Event('input',  { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));

                console.log('[ISBN Normal] 10→13:', pasteText.trim(), '→', isbn13);
            }
        } catch (err) {
            console.warn('[ISBN Auto] 处理出错:', err);
            // 出错时至少把原始粘贴放回去（fallback）
            if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
                target.value += pasteText;
            }
        } finally {
            setTimeout(() => { isProcessing = false; }, 50);
        }
    }, true);  // capture 阶段，尽早拦截

})();