// ==UserScript==
// @name         图书复制版本合集（东立+长鸿+东贩+角川）
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  在东立、长鸿、东贩、角川图书详情页添加"复制对应版本"按钮
// @author       你
// @match        https://www.tongli.com.tw/BooksDetail.aspx*
// @match        https://www.egmanga.com.tw/comic/only.jsp*
// @match        https://www.tohan.com.tw/product.php*
// @match        https://www.kadokawa.com.tw/products/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 通用函数：创建复制按钮
    function createCopyBtn(btnText) {
        const btn = document.createElement('a');
        btn.className = 'rr';
        btn.href = 'javascript:';
        btn.style = 'font-size:13px;font-weight:bold;color:blue;margin-left:10px;cursor:pointer;';
        btn.textContent = btnText;
        btn.dataset.copyBtn = 'true'; // 用于过滤按钮文本
        return btn;
    }

    // 通用函数：格式化日期为YYYY-MM-DD（补零）
    function formatDate(dateText) {
        if (!dateText) return '';
        const parts = dateText.split('/').map(part => {
            const num = parseInt(part.trim(), 10);
            return isNaN(num) ? part : num.toString().padStart(2, '0');
        });
        return parts.length === 3 ? parts.join('-') : dateText;
    }

    // 通用函数：通过文本前缀查找元素内容（兼容多格式拆分）
    function getContentByPrefix(parent, prefix) {
        const text = parent.textContent || '';
        // 兼容换行、空格、制表符拆分
        const lines = text.split(/[\n\r\t]/).map(line => line.trim()).filter(line => line);
        for (const line of lines) {
            if (line.startsWith(prefix)) {
                return line.replace(prefix, '').trim();
            }
        }
        return '';
    }

    // 通用函数：正则提取内容（角川专用）
    function getContentByRegex(text, regex) {
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }

    // 通用函数：通过tit获取content（东贩专用）
    function getContentByTit(parent, titText) {
        const rows = parent.querySelectorAll('.book-row');
        for (const row of rows) {
            const titEl = row.querySelector('.tit');
            if (titEl && titEl.textContent.trim() === titText) {
                return row.querySelector('.content')?.textContent.trim() || '';
            }
        }
        return '';
    }

    // 1. 处理东立图书页面
    if (window.location.href.includes('tongli.com.tw')) {
        const btn = createCopyBtn('复制东立版本');
        const titleElement = document.querySelector('.bi_title');
        if (titleElement) {
            titleElement.appendChild(btn);
        }

        btn.addEventListener('click', () => {
            const bookTitle = document.getElementById('ContentPlaceHolder1_CBookName')?.textContent.trim() || '';
            const seqText = document.getElementById('ContentPlaceHolder1_SEQ')?.textContent.trim() || '';
            const translator = document.getElementById('ContentPlaceHolder1_EditorName')?.textContent.trim() || '';
            const publishDateText = document.getElementById('ContentPlaceHolder1_UplineDate')?.textContent.trim() || '';
            const isbnText = document.getElementById('ContentPlaceHolder1_ISBN')?.textContent.trim() || '';
            const priceText = document.getElementById('ContentPlaceHolder1_Price')?.textContent.trim() || '';

            const versionName = seqText ? `${bookTitle} ${seqText}` : bookTitle;
            const publishDate = formatDate(publishDateText);
            const isbn = isbnText.replace(/-/g, '');
            const priceNumber = priceText.replace(/\D/g, '');
            const price = priceNumber ? `NT$${priceNumber}` : '';

            const output = `|版本:东立版={
[版本名|${versionName}]
[别名|]
[语言|繁体中文]
[价格|${price}]
[出品方|]
[出版社|東立出版社]
[发售日|${publishDate}]
[页数|]
[ISBN|${isbn}]
[译者|${translator}]
}`;

            navigator.clipboard.writeText(output).then(() => {
                const originalText = btn.textContent;
                btn.textContent = '已复制!';
                setTimeout(() => btn.textContent = originalText, 1500);
            });
        });
    }

    // 2. 处理长鸿图书页面
    if (window.location.href.includes('egmanga.com.tw')) {
        const btn = createCopyBtn('复制长鸿版本');
        let isBtnAdded = false;
        let pollTimer = null;

        function handleEgmangaCopy() {
            const captionEl = document.querySelector('.caption.col-xs-7');
            if (!captionEl) return;

            const h4Element = captionEl.querySelector('h4');
            let bookTitle = '';
            if (h4Element) {
                const clonedH4 = h4Element.cloneNode(true);
                const btnClone = clonedH4.querySelector('[data-copy-btn="true"]');
                if (btnClone) btnClone.remove();
                bookTitle = clonedH4.textContent.trim();
            }

            const pages = getContentByPrefix(captionEl, '頁數：');
            const isbnText = getContentByPrefix(captionEl, 'ISBN：');
            const publishDateText = getContentByPrefix(captionEl, '上市日期：');
            const priceText = getContentByPrefix(captionEl, '定價：')
                .replace(/<s>|<\/s>/g, '')
                .trim();

            const publishDate = formatDate(publishDateText);
            const isbn = isbnText.replace(/-/g, '');
            const price = priceText || '';

            const output = `|版本:长鸿版={
[版本名|${bookTitle}]
[别名|]
[语言|繁体中文]
[价格|${price}]
[出品方|]
[出版社|長鴻出版社]
[发售日|${publishDate}]
[页数|${pages}]
[ISBN|${isbn}]
[译者|]
}`;

            navigator.clipboard.writeText(output).then(() => {
                const originalText = btn.textContent;
                btn.textContent = '已复制!';
                setTimeout(() => btn.textContent = originalText, 1500);
            });
        }

        function addBtnToH4() {
            const titleElement = document.querySelector('.caption.col-xs-7 h4');
            if (titleElement && !isBtnAdded) {
                titleElement.appendChild(btn);
                btn.addEventListener('click', handleEgmangaCopy);
                isBtnAdded = true;
                if (pollTimer) clearInterval(pollTimer);
            }
        }

        pollTimer = setInterval(addBtnToH4, 100);
        setTimeout(() => {
            if (pollTimer && !isBtnAdded) {
                clearInterval(pollTimer);
                addBtnToH4();
            }
        }, 5000);
    }

    // 3. 处理东贩图书页面
    if (window.location.href.includes('tohan.com.tw/product.php')) {
        const btno = createCopyBtn('复制东贩版本');
        const titleElements = document.querySelectorAll('.book-name');
        if (!titleElements.length) return;

        titleElements.forEach(t => {
            const btn = btno.cloneNode(true);
            t.appendChild(btn);
            btn.addEventListener('click', () => {
                const detailsEl = document.querySelector('.col.details');
                const menu3El = document.getElementById('menu3');
                if (!detailsEl) return;
    
                // 提取标题（过滤按钮文本）
                let bookTitle = '';
                const clonedTitle = t.cloneNode(true);
                const btnClone = clonedTitle.querySelector('[data-copy-btn="true"]');
                if (btnClone) btnClone.remove();
                bookTitle = clonedTitle.textContent.trim();
    
                // 提取核心信息
                const translator = getContentByTit(detailsEl, '譯者');
                const isbnText = getContentByTit(detailsEl, 'ISBN');
                const publishDate = getContentByTit(detailsEl, '出版日期');
                const priceText = getContentByTit(detailsEl, '定價').replace(/<s>|<\/s>/g, '').trim();
    
                // 正则提取页数
                let pages = '';
                if (menu3El) {
                    const pageMatch = menu3El.textContent.match(/頁數：(\d+)頁/);
                    pages = pageMatch ? pageMatch[1] : '';
                }
    
                // 处理格式
                const isbn = isbnText.replace(/-/g, '');
                const price = priceText || '';
    
                // 构建输出
                const output = `|版本:东贩版={
[版本名|${bookTitle}]
[别名|]
[语言|繁体中文]
[价格|${price}]
[出品方|]
[出版社|台灣東販]
[发售日|${publishDate}]
[页数|${pages}]
[ISBN|${isbn}]
[译者|${translator}]
}`;
    
                navigator.clipboard.writeText(output).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = '已复制!';
                    setTimeout(() => btn.textContent = originalText, 1500);
                });
            });
        });
    }

    // 4. 处理角川图书页面（优化ISBN和发售日提取逻辑）
    if (window.location.href.includes('kadokawa.com.tw/products/')) {
        const btn = createCopyBtn('复制角川版本');
        const titleElement = document.querySelector('.Product-title');
        if (titleElement) {
            // 清理标题多余空格
            titleElement.textContent = titleElement.textContent.trim();
            titleElement.appendChild(btn);
        }

        btn.addEventListener('click', () => {
            const summaryEl = document.querySelector('.Product-summary.Product-summary-block');
            const priceEl = document.querySelector('.price-regular.js-price') || document.querySelector('.js-price');
            if (!summaryEl) return;

            // 提取标题（过滤按钮文本）
            let bookTitle = '';
            if (titleElement) {
                const clonedTitle = titleElement.cloneNode(true);
                const btnClone = clonedTitle.querySelector('[data-copy-btn="true"]');
                if (btnClone) btnClone.remove();
                bookTitle = clonedTitle.textContent.trim();
            }

            // 提取核心信息（双重保障：前缀匹配+正则匹配）
            const summaryText = summaryEl.textContent.trim();
            const author = getContentByPrefix(summaryEl, '作者資訊：') || getContentByRegex(summaryText, /作者資訊：(.+)/);
            const publishDateText = getContentByPrefix(summaryEl, '上市日期：') || getContentByRegex(summaryText, /上市日期：(.+)/);
            const isbnText = getContentByPrefix(summaryEl, 'ISBN：') || getContentByRegex(summaryText, /ISBN：(.+)/);
            const price = priceEl?.textContent.trim() || '';

            // 处理格式
            const publishDate = formatDate(publishDateText);
            const isbn = isbnText.replace(/-/g, '');

            // 构建输出（角川无明确页数和译者信息，留空）
            const output = `|版本:角川版={
[版本名|${bookTitle}]
[别名|]
[语言|繁体中文]
[价格|${price}]
[出品方|]
[出版社|台灣角川]
[发售日|${publishDate}]
[页数|]
[ISBN|${isbn}]
[译者|]
}`;

            navigator.clipboard.writeText(output).then(() => {
                const originalText = btn.textContent;
                btn.textContent = '已复制!';
                setTimeout(() => btn.textContent = originalText, 1500);
            });
        });
    }
})();
