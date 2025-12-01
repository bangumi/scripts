// ==UserScript==
// @name         从引进出版社网站获取班固米书籍版本
// @namespace    wiki.import.book.version
// @version      0.2.1
// @description  支持东立、长鸿、东贩、台角、青文、尖端、玉皇朝、豆瓣、当当、京东、天猫，暴露window.getBgmVersion(url)方法
// @author       你
// @match        https://www.tongli.com.tw/*
// @match        https://www.egmanga.com.tw/*
// @match        https://www.tohan.com.tw/*
// @match        https://www.kadokawa.com.tw/*
// @match        https://www.ching-win.com.tw/*
// @match        https://www.spp.com.tw/*
// @match        https://jd-intl.com/*
// @match        https://*.douban.com/*
// @match        https://*.jd.com/*
// @match        https://*.dangdang.com/*
// @match        https://*.tmall.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      tongli.com.tw
// @connect      egmanga.com.tw
// @connect      tohan.com.tw
// @connect      kadokawa.com.tw
// @connect      ching-win.com.tw
// @connect      spp.com.tw
// @connect      jd-intl.com
// @connect      book.douban.com
// @connect      item.jd.com
// @connect      product.dangdang.com
// @connect      detail.tmall.com
// @license      MIT
// @require      https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js
// @gf           https://greasyfork.org/zh-CN/scripts/556109
// ==/UserScript==

/* global OpenCC */
/* eslint-disable no-irregular-whitespace */

(function() {
    'use strict';

    const utils = {
        formatDate(dateText) {
            if (!dateText) return '';
            const normalizedText = dateText.replace(/\/|年|月|日/g, '-');
            const parts = normalizedText.split('-').map(part => {
                const num = parseInt(part.trim(), 10);
                return isNaN(num) ? part : num.toString().padStart(2, '0');
            }).filter(part => part);
    
            switch (parts.length) {
                case 1:
                    return parts[0];
                case 2:
                    return `${parts[0]}-${parts[1]}`;
                case 3:
                    return `${parts[0]}-${parts[1]}-${parts[2]}`;
                default:
                    return dateText;
            }
        },
        formatISBN(isbnText) {
            return (isbnText || '').replace(/\D/g, '');
        },
        getByRegex(text, regex) {
            return (text.match(regex) || [])[1]?.trim() || '';
        },
        /**
         * @param {string | HTMLElement} el
         * @param {Document} [doc]
         * @returns {string}
         */
        getText(el, doc = document) {
            if (typeof el === 'string') el = doc.querySelector(el);
            if (!el) return '';
            el = el.cloneNode(true);
            // 当当 .t1
            el.querySelectorAll('p, div, .t1, li').forEach(p => p.after(document.createTextNode('\n')));
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
        /**
         * @param {HTMLElement} el
         * @returns {string}
         */
        getCleanTitle(el) {
            if (!el) return '';
            const clone = el.cloneNode(true);
            clone.querySelector('[data-copy-btn]')?.remove();
            return clone.textContent.trim() || '';
        },
        createDocFromHtml(html) {
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        }
    };

    /**
     * @callback ConfigFunc
     * @param {object} params
     * @param {string} params.detailsText
     * @param {HTMLElement} params.anchorEl
     * @param {Document} params.doc
     * @returns {string}
     */
    /**
     * @typedef {object} BookConfig
     * @property {string} match
     * @property {string} anchorSelector
     * @property {string} detailsSelector
     * @property {object} fields
     * @property {string | RegExp | ConfigFunc} [fields.版本名] - 缺省为 anchorSelector 文本，开头为 _ 则取“出品方/出版社 + 版”作为版本名
     * @property {string | RegExp | ConfigFunc} [fields.别名]
     * @property {string | RegExp | ConfigFunc} [fields.语言] - 缺省为繁体中文
     * @property {string | RegExp | ConfigFunc} [fields.价格]
     * @property {string | RegExp | ConfigFunc} [fields.出品方]
     * @property {string | RegExp | ConfigFunc} fields.出版社
     * @property {string | RegExp | ConfigFunc} fields.发售日
     * @property {string | RegExp | ConfigFunc} [fields.页数]
     * @property {string | RegExp | ConfigFunc} fields.ISBN
     * @property {string | RegExp | ConfigFunc} [fields.译者]
     */
    /** @type {Record<string, BookConfig>} */
    const configs = {
        '东立版': { // https://www.tongli.com.tw/BooksDetail.aspx?Bd=JC1146001
            match: 'tongli.com.tw/BooksDetail.aspx',
            anchorSelector: '.bi_title',
            detailsSelector: '.bi_c',
            fields: {
                '版本名': ({doc}) => {
                    const title = utils.getText('#ContentPlaceHolder1_CBookName', doc);
                    const seq = utils.getText('#ContentPlaceHolder1_SEQ', doc);
                    return seq ? `${title} ${seq}` : title;
                },
                '价格': ({doc}) => {
                    const price = utils.getText('#ContentPlaceHolder1_Price', doc).replace(/\D/g, '');
                    return price ? `NT$${price}` : '';
                },
                '出版社': '東立出版社',
                '发售日': /出版日期：\s*([^ ]+)/,
                'ISBN': /ISBN：\s*([^ ]+)/,
                '译者': /譯者：\s*([^ ]+)/,
            }
        },
        '长鸿版': { // https://www.egmanga.com.tw/products/ch0735
            match: 'www.egmanga.com.tw/products/',
            anchorSelector: '#product .product_info .product_content .product_title h1',
            detailsSelector: '#product .product_info .product_content .product_brief',
            fields: {
                '价格': ({doc}) => utils.getText('#price_title del', doc) || utils.getText('#price_title', doc),
                '出版社': '長鴻出版社',
                '发售日': /出版日期：\s*([^ \n]+)/,
                '页数': /頁數：\s*([^ \n]+)/,
                'ISBN': /ISBN：\s*([^ \n]+)/
            }
        },
        '东贩版': { // https://www.tohan.com.tw/product.php?act=view&cid=150&id=6658
            match: 'tohan.com.tw/product.php',
            anchorSelector: '.book-name',
            detailsSelector: '.col.details',
            fields: {
                '价格': /定價\n\n *([^ ]+)/,
                '出版社': '台灣東販',
                '发售日': /出版日期\n\n +([^ ]+)/,
                '页数': ({doc}) => utils.getByRegex(utils.getText('#menu3', doc), /頁數：(\d+)頁/),
                'ISBN': /ISBN\n\n *([^ ]+)/,
                '译者': /譯者\n\n *([^ ]+)/
            }
        },
        '台角版': { // https://www.kadokawa.com.tw/products/9786264356435
            match: 'kadokawa.com.tw/products/',
            anchorSelector: '.Product-title',
            detailsSelector: '.Product-summary',
            fields: {
                '价格': ({doc}) => utils.getText('.price-regular.js-price', doc) || utils.getText('.js-price', doc),
                '出版社': '台灣角川',
                '发售日': /上市日期：\s*([^ ]+)/,
                'ISBN': /ISBN：\s*([^ ]+)/
            }
        },
        '青文版': { // https://www.ching-win.com.tw/product-detail/10510315A
            match: 'www.ching-win.com.tw/product-detail/',
            anchorSelector: '.productTitle .title',
            detailsSelector: '.linebox',
            fields: {
                '价格': ({doc}) => {
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
            match: 'www.spp.com.tw/SalePage/Index/',
            anchorSelector: '.salepage-title',
            detailsSelector: '.salepage-short-description',
            fields: {
                '价格': ({doc}) => utils.getText('.salepage-suggestprice', doc),
                '出版社': '尖端出版',
                '发售日': /上市日：\s*([^ ]+)/,
                'ISBN': /條　碼：\s*([^ ]+)/,
                '译者': /譯　者：\s*([^ ]+)/,
            }
        },
        '玉皇朝版': { // https://jd-intl.com/product/%e9%9d%92%e4%b9%8b%e8%98%86%e8%91%a6-%e7%ac%ac40%e6%9c%9f-%e5%ae%8c/
            match: 'jd-intl.com/product/',
            anchorSelector: '.product_title',
            detailsSelector: '.woocommerce-product-details__short-description',
            fields: {
                '价格': ({detailsText}) => {
                    const priceNum = utils.getByRegex(detailsText, /售價：\s*[^0-9]*(\d+)/);
                    return priceNum ? `HK$${priceNum}` : '';
                },
                '出版社': '玉皇朝',
                '发售日': ({doc}) => {
                    const metaEl = doc.querySelector('meta[property="article:modified_time"]');
                    const dateStr = metaEl?.content || '';
                    const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
                    return match ? match[1] : '';
                },
                'ISBN': /ISBN\s*([^ \n]+)/
            }
        },
        '_豆瓣': { // https://book.douban.com/subject/36799715/
            match: 'book.douban.com/subject/',
            anchorSelector: 'h1',
            detailsSelector: '#info',
            fields: {
                '语言': ({detailsText}) => {
                    const price = utils.getByRegex(detailsText, /定价:\s*([^ ]+)/).replace('元', '');
                    return (price.includes('NT') || price.includes('HK')) ? '繁体中文' : '简体中文';
                },
                '价格': ({detailsText}) => {
                    let price = utils.getByRegex(detailsText, /定价:\s*([^ ]+)/).replace('元', '');
                    if (price && !/[$¥￥]/.test(price)) {
                        price = '¥' + price;
                    }
                    return price;
                },
                '出品方': /出品方:\s*([^ ]+)/,
                '出版社': /出版社:\s*([^ ]+)/,
                '页数': /页数:\s*([^ ]+)/,
                '发售日': /出版年:\s*([^ ]+)/,
                'ISBN': /ISBN:\s*([^ ]+)/,
                '译者': /译者:\s*([^ ]+)/,
            }
        },
        '_当当': { // https://product.dangdang.com/29886912.html
            match: 'product.dangdang.com',
            anchorSelector: 'h1',
            detailsSelector: '.messbox_info',
            fields: {
                '语言': '简体中文',
                '价格': ({doc}) => utils.getText('#original-price', doc) || utils.getText('#dd-price', doc),
                '出品方': /，([^，]+)出品/,
                '出版社': /出版社:\s*([^ \n]+)/,
                '发售日': /出版时间:\s*([^ \n]+)/,
                'ISBN': ({doc}) => {
                    const detail = utils.getText('#detail_describe', doc);
                    const isbn = utils.getByRegex(detail, /ISBN：([^ \n]+)/);
                    return isbn;
                },
                '译者': /，([^，]+)译/,
            }
        },
        '_京东': { // https://item.jd.com/14397392.html
            match: 'item.jd.com',
            anchorSelector: '#p-author',
            detailsSelector: '.goods-base',
            fields: {
                '版本名': ({doc}) => {
                    return doc.querySelector('.item.selected')?.dataset.value
                    || doc.querySelector('.sku-title-name')?.textContent || '';
                },
                '语言': '简体中文',
                '价格': ({doc}) => utils.getText('#page_hx_price', doc) || utils.getText('.p_price', doc),
                '出品方': /品牌\s*([^ ]+)/,
                '出版社': /出版社\s*([^ ]+)/,
                '页数': /页数\s*([^ ]+)/,
                '发售日': /出版时间\s*([^ ]+)/,
                'ISBN': /ISBN\s*([^ ]+)/,
                '译者': ({anchorEl}) => {
                    const authors = utils.getText(anchorEl);
                    return utils.getByRegex(authors, /，(.+)译/);
                },
            }
        },
        '_天猫': { // https://detail.tmall.com/item.htm?abbucket=7&id=952735079569
            match: 'detail.tmall.com/item.htm',
            anchorSelector: '[class^="subTitleInnerWrap"]',
            detailsSelector: '.paramsInfoArea',
            fields: {
                '版本名': ({detailsText}) => {
                    const title = utils.getByRegex(detailsText, /书名\n([^\n]+)/);
                    return title;
                },
                '语言': '简体中文',
                '价格': ({detailsText}) => {
                    const priceNum = utils.getByRegex(detailsText, /定价\n([^\n]+)/).replace('元', '');
                    return priceNum ? `￥${priceNum}` : '';
                },
                '出品方': /品牌\n([^\n]+)/,
                '出版社': /出版社名称\n([^\n]+)/,
                '页数': /页数\n([^\n]+)/,
                '发售日': /出版时间\n([^\n]+)/,
                'ISBN': /ISBN编号\n([^\n]+)/,
                '译者': /译者\n([^\n]+)/,
            }
        }
    };

    /**
     * @param {string} url - 目标URL
     * @param {Document} doc - HTML文档对象
     * @param {string} [versionKey] - 版本键名
     * @param {BookConfig} [config] - 配置项
     * @returns {string|null} 版本信息字符串，失败返回null
     */
    const coreExtractVersion = (url, doc, versionKey, config) => {
        if (!versionKey || !config) {
            [versionKey, config] = Object.entries(configs).find(([, c]) => url.includes(c.match)) || [];
        }
        if (!config) return null;

        const anchorEl = doc.querySelector(config.anchorSelector);
        if (!anchorEl) return null;

        const detailsText = config.detailsSelector
            ? utils.getText(config.detailsSelector, doc)
            : '';

        const baseFields = {
            '版本名': '',
            '别名': '',
            '语言': '繁体中文',
            '价格': '',
            '出品方': '',
            '出版社': '',
            '页数': '',
            'ISBN': '',
            '译者': '',
        };

        const fields = {
            ...baseFields,
            ...config.fields,
            '版本名': config.fields['版本名'] || (() => utils.getCleanTitle(anchorEl, doc))
        };

        const rawValues = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => {
                let result = '';
                if (typeof value === 'function') {
                    result = value({detailsText, anchorEl, doc}) || '';
                } else if (value instanceof RegExp) {
                    result = utils.getByRegex(detailsText, value);
                } else {
                    result = value || '';
                }
                return [key, result.trim()];
            })
        );

        const values = {
            ...rawValues,
            '发售日': utils.formatDate(rawValues['发售日']),
            'ISBN': utils.formatISBN(rawValues['ISBN'])
        };

        values['版本名'] = values['版本名'].replace(/^[【(]限[)】]|(完結?|\(完\)|END)$/g, '').trim();

        const versionName = versionKey.startsWith('_') 
            ? `${values['出品方'] || values['出版社']}版` 
            : versionKey;

        return `|版本:${versionName}={
[版本名|${values['版本名']}]
[别名|${values['别名'] || (() => {
    const converted = ({
        '繁体中文': (() => OpenCC.Converter({ from: 'tw', to: 'cn' })(values['版本名']))(),
        '简体中文': (() => OpenCC.Converter({ from: 'cn', to: 'tw' })(values['版本名']))(),
    })[values['语言']];
    return converted === values['版本名'] ? '' : converted;
})()}]
[语言|${values['语言']}]
[价格|${values['价格']}]
[出品方|${values['出品方']}]
[出版社|${values['出版社']}]
[发售日|${values['发售日']}]
[页数|${values['页数']}]
[ISBN|${values['ISBN']}]
[译者|${values['译者']}]
}`;
    };

    /**
     * 从URL获取班固米版本信息
     * @param {string} url - 书籍详情页URL
     * @returns {Promise<string>}
     */
    unsafeWindow.getBgmVersion = function(url) {
        return new Promise((resolve, reject) => {
            if (!url || typeof url !== 'string') {
                reject(new Error('无效的URL'));
                return;
            }

            if (url === location.href) {
                try {
                    const result = coreExtractVersion(url, document);
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('无法从当前页面提取版本信息'));
                    }
                } catch (err) {
                    reject(err);
                }
                return;
            }

            if (!url.startsWith('http')) {
                url = (new URL(url, location.href)).toString();
            }

            const isSupported = Object.values(configs).some(config => url.includes(config.match));
            if (!isSupported) {
                reject(new Error('不支持该网站的版本提取'));
                return;
            }

            // 使用GM_xmlhttpRequest跨域请求（需要@grant和@connect权限）
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            const doc = utils.createDocFromHtml(response.responseText);
                            const result = coreExtractVersion(url, doc);
                            if (result) {
                                resolve(result);
                            } else {
                                reject(new Error('无法从页面内容提取版本信息'));
                            }
                        } catch (err) {
                            reject(new Error(`解析页面失败: ${err.message}`));
                        }
                    } else {
                        reject(new Error(`请求失败，状态码: ${response.status}`));
                    }
                },
                onerror: function(error) {
                    reject(new Error(`请求错误: ${error.message}`));
                },
                ontimeout: function() {
                    reject(new Error('请求超时'));
                }
            });
        });
    };

    const currentUrl = location.href;
    const [versionKey, config] = Object.entries(configs).find(([, c]) => currentUrl.includes(c.match)) || [];

    if (config) {
        const addButtonToElement = (anchorEl) => {
            if (!anchorEl) return false;

            if (anchorEl.querySelector('[data-copy-btn]')) return true;

            const text = '复制版本'
            const btn = utils.createBtn(text);
            anchorEl.appendChild(btn);

            btn.addEventListener('click', () => {
                const output = coreExtractVersion(currentUrl, document, versionKey, config);
                if (output) {
                    navigator.clipboard.writeText(output).then(() => {
                        btn.textContent = '已复制!';
                        setTimeout(() => btn.textContent = text, 1500);
                    }).catch(err => {
                        btn.textContent = '剪贴板复制失败!';
                        console.error('剪贴板复制失败:', err);
                    }).finally(() => {
                        setTimeout(() => btn.textContent = text, 1500);
                    });
                } else {
                    btn.textContent = '提取失败!';
                    setTimeout(() => btn.textContent = text, 1500);
                }
            });
            return true;
        };

        // 处理多元素场景（主要针对东贩版）
        const initButtons = () => {
            const anchorElements = document.querySelectorAll(config.anchorSelector);
            if (!anchorElements.length) return false;

            let allAdded = true;
            anchorElements.forEach(el => {
                if (!addButtonToElement(el)) allAdded = false;
            });
            return allAdded;
        };

        // 初始化按钮（找不到元素时轮询）
        if (!initButtons()) {
            const timer = setInterval(() => {
                if (initButtons()) clearInterval(timer);
            }, 100);
            setTimeout(() => clearInterval(timer), 5000);
        }
    }
})();
