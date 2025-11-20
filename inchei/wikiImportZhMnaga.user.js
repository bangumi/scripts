// ==UserScript==
// @name         从引进漫画出版社网站获取班固米版本
// @namespace    wiki.publisher.version
// @version      0.1
// @description  统一处理日期和ISBN格式化，东贩版支持多标题添加按钮，版本名缺省自动处理
// @author       你
// @match        https://www.tongli.com.tw/BooksDetail.aspx*
// @match        https://www.egmanga.com.tw/comic/only.jsp*
// @match        https://www.tohan.com.tw/product.php*
// @match        https://www.kadokawa.com.tw/products/*
// @match        https://www.ching-win.com.tw/product-detail/*
// @match        https://www.spp.com.tw/SalePage/Index/*
// @match        https://jd-intl.com/product/*
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/556109
// ==/UserScript==

/* eslint-disable no-irregular-whitespace */

(function() {
    'use strict';

    // 通用工具函数
    const utils = {
        formatDate(dateText) {
            if (!dateText) return '';
            const parts = dateText.split('/').map(part => {
                const num = parseInt(part.trim(), 10);
                return isNaN(num) ? part : num.toString().padStart(2, '0');
            });
            return parts.length === 3 ? parts.join('-') : dateText;
        },
        formatISBN(isbnText) {
            return (isbnText || '').replace(/\D/g, '');
        },
        getByRegex(text, regex) {
            return (text.match(regex) || [])[1]?.trim() || '';
        },
        getText(el) {
            if (!el) return '';
            if (typeof el === 'string') el = document.querySelector(el);
            el = el.cloneNode(true);
            el.querySelectorAll('p').forEach(p => p.after(document.createTextNode('\n')));
            return (el.textContent || '').trim();
        },
        createBtn(text) {
            const btn = document.createElement('a');
            btn.href = 'javascript:';
            btn.style = 'font-size:13px;font-weight:bold;color:blue;margin-left:10px;cursor:pointer;';
            btn.textContent = text;
            btn.dataset.copyBtn = 'true';
            return btn;
        },
        getCleanTitle(el) {
            if (!el) return '';
            const clone = el.cloneNode(true);
            clone.querySelector('[data-copy-btn]')?.remove();
            return clone.textContent.trim() || '';
        }
    };

    // 核心配置表（无需手动配置版本名，缺省自动处理）
    const configs = {
        '东立版': { // https://www.tongli.com.tw/BooksDetail.aspx?Bd=JC1146001
            match: 'tongli.com.tw',
            titleSelector: '.bi_title',
            detailsSelector: '.bi_c',
            fields: {
                // 自定义版本名（特殊需求时显式配置）
                '版本名': () => {
                    const title = utils.getText('#ContentPlaceHolder1_CBookName');
                    const seq = utils.getText('#ContentPlaceHolder1_SEQ');
                    return seq ? `${title} ${seq}` : title;
                },
                '价格': () => {
                    const price = utils.getText('#ContentPlaceHolder1_Price').replace(/\D/g, '');
                    return price ? `NT$${price}` : '';
                },
                '出版社': '東立出版社',
                '发售日': /出版日期：\s*([^ ]+)/,
                'ISBN': /ISBN：\s*([^ ]+)/,
                '译者': /譯者：\s*([^ ]+)/,
            }
        },
        '长鸿版': { // https://www.egmanga.com.tw/comic/only.jsp?id1=BH0396
            match: 'egmanga.com.tw',
            titleSelector: '.caption.col-xs-7 h4',
            detailsSelector: '.caption.col-xs-7',
            fields: {
                '价格': /定價：\s*([^ \n]+)/,
                '出版社': '長鴻出版社',
                '发售日': /上市日期：\s*([^ \n]+)/,
                '页数': /頁數：\s*([^ \n]+)/,
                'ISBN': /ISBN：\s*([^ \n]+)/
            }
        },
        '东贩版': { // https://www.tohan.com.tw/product.php?act=view&id=8355
            match: 'tohan.com.tw',
            titleSelector: '.book-name',
            detailsSelector: '.col.details',
            fields: {
                '价格': /定價\n *([^ ]+)/,
                '出版社': '台灣東販',
                '发售日': /出版日期\n +([^ ]+)/,
                '页数': () => utils.getByRegex(utils.getText('#menu3'), /頁數：(\d+)頁/),
                'ISBN': /ISBN\n *([^ ]+)/,
                '译者': /譯者\n *([^ ]+)/
            }
        },
        '角川版': { // https://www.kadokawa.com.tw/products/9786264356435
            match: 'kadokawa.com.tw',
            titleSelector: '.Product-title',
            detailsSelector: '.Product-summary',
            fields: {
                '价格': () => utils.getText('.price-regular.js-price') || utils.getText('.js-price'),
                '出版社': '台灣角川',
                '发售日': /上市日期：\s*([^ ]+)/,
                'ISBN': /ISBN：\s*([^ ]+)/
            }
        },
        '青文版': { // https://www.ching-win.com.tw/product-detail/10510315A
            match: 'www.ching-win.com.tw',
            titleSelector: '.productTitle .title',
            detailsSelector: '.linebox',
            fields: {
                '价格': (doc) => {
                    const priceEl = doc.querySelector('.pricebox.line .font-red');
                    if (!priceEl) return '';

                    const priceText = priceEl.textContent.trim();
                    const discountPrice = priceText.match(/NT\$(\d+)/)?.[1];
                    if (!discountPrice) return '';

                    const discountRate = priceText.match(/(\d+)折/)?.[1];
                    if (!discountRate) return '';

                    const originalPrice = Math.round(parseInt(discountPrice) / parseInt(discountRate) * 100);

                    return `NT$${originalPrice}`;
                },
                '出版社': '青文出版社',
                '发售日': /出版日期：\s*([^ \n]+)/,
                'ISBN': /ISBN：\s*([^ \n]+)/,
                '译者': /譯者：\s*([^ \n]+)/,
                '页数': /頁數：\s*([^ \n]+)/,
            }
        },
        '尖端版': { // https://www.spp.com.tw/SalePage/Index/11300169
            match: 'www.spp.com.tw',
            titleSelector: '.salepage-title',
            detailsSelector: '.salepage-short-description',
            fields: {
                '价格': () => utils.getText('.salepage-suggestprice'),
                '出版社': '尖端出版',
                '发售日': /上市日：\s*([^ ]+)/,
                'ISBN': /條　碼：\s*([^ ]+)/,
                '译者': /譯　者：\s*([^ ]+)/,
            }
        },
        '玉皇朝版': { // https://jd-intl.com/product/%e9%9d%92%e4%b9%8b%e8%98%86%e8%91%a6-%e7%ac%ac40%e6%9c%9f-%e5%ae%8c/
            match: 'jd-intl.com',
            titleSelector: '.product_title',
            detailsSelector: '.woocommerce-product-details__short-description',
            fields: {
                '价格': () => {
                    const shortDesc = utils.getText('.woocommerce-product-details__short-description');
                    const priceNum = utils.getByRegex(shortDesc, /售價：\s*[^0-9]*(\d+)/);
                    return priceNum ? `HK$${priceNum}` : '';
                },
                '出版社': '玉皇朝',
                '发售日': () => {
                    const metaEl = document.querySelector('meta[property="article:modified_time"]');
                    const dateStr = metaEl?.content || '';
                    const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
                    return match ? match[1] : '';
                },
                'ISBN': /ISBN\s*([^ \n]+)/
            }
        }
    };

    // 初始化当前站点配置
    const currentUrl = window.location.href;
    const [version, config] = Object.entries(configs).find(([_, c]) => currentUrl.includes(c.match)) || [];

    if (config) {
        // 生成复制内容的通用函数（新增版本名缺省处理）
        const generateOutput = (titleEl) => {
            const detailsText = config.detailsSelector
                ? utils.getText(config.detailsSelector)
                : '';

            const baseFields = {
                '别名': '',
                '语言': '繁体中文',
                '出品方': '',
                '页数': '',
                '译者': ''
            };
            // 合并配置字段 + 版本名缺省处理
            const fields = {
                ...baseFields,
                ...config.fields,
                // 版本名缺省：未配置时自动使用通用逻辑
                '版本名': config.fields['版本名'] || (() => utils.getCleanTitle(titleEl))
            };

            // 解析所有字段原始值（兼容东贩版多标题元素）
            const rawValues = Object.fromEntries(
                Object.entries(fields).map(([key, value]) => {
                    let result = '';
                    if (typeof value === 'function') {
                        // 传递 titleEl 参数（适配缺省逻辑和自定义逻辑）
                        result = value(document, detailsText, titleEl) || '';
                    } else if (value instanceof RegExp) {
                        result = utils.getByRegex(detailsText, value);
                    } else {
                        result = value || '';
                    }
                    return [key, result.trim()];
                })
            );

            // 统一格式化
            return {
                ...rawValues,
                '发售日': utils.formatDate(rawValues['发售日']),
                'ISBN': utils.formatISBN(rawValues['ISBN'])
            };
        };

        // 添加按钮的通用函数
        const addButtonToElement = (titleEl) => {
            if (!titleEl) return false;

            // 避免重复添加按钮
            if (titleEl.querySelector('[data-copy-btn]')) return true;

            const btn = utils.createBtn(`复制${version}`);
            titleEl.appendChild(btn);

            // 点击事件（自动传递当前标题元素给版本名处理）
            btn.addEventListener('click', () => {
                const values = generateOutput(titleEl);
                const output = `|版本:${version}={
[版本名|${values['版本名'].replace(/(完結?|\(完\)|END)$/, '').trim()}]
[别名|${values['别名']}]
[语言|${values['语言']}]
[价格|${values['价格']}]
[出品方|${values['出品方']}]
[出版社|${values['出版社']}]
[发售日|${values['发售日']}]
[页数|${values['页数']}]
[ISBN|${values['ISBN']}]
[译者|${values['译者']}]
}`;

                navigator.clipboard.writeText(output).then(() => {
                    const original = btn.textContent;
                    btn.textContent = '已复制!';
                    setTimeout(() => btn.textContent = original, 1500);
                });
            });
            return true;
        };

        // 处理多元素场景（主要针对东贩版）
        const initButtons = () => {
            const titleElements = document.querySelectorAll(config.titleSelector);
            if (!titleElements.length) return false;

            // 为每个标题元素添加按钮
            let allAdded = true;
            titleElements.forEach(el => {
                if (!addButtonToElement(el)) allAdded = false;
            });
            return allAdded;
        };

        // 初始化按钮（带动态检测）
        if (!initButtons()) {
            const timer = setInterval(() => {
                if (initButtons()) clearInterval(timer);
            }, 100);
            setTimeout(() => clearInterval(timer), 5000);
        }
    }
})();
