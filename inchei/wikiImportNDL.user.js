// ==UserScript==
// @name         NDL 添加条目到 bangumi
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  在NDL搜索页添加同步链接，点击后自动填充数据到BGM.tv新条目页面
// @author       You
// @match        https://ndlsearch.ndl.go.jp/search*
// @match        https://bgm.tv/new_subject/1
// @match        https://bangumi.tv/new_subject/1
// @match        https://chii.in/new_subject/1
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    function full2half(str) {
        let res = '';
        for (let c of str) {
            const code = c.charCodeAt(0);
            // 仅判断全宽数字并转换，其他字符直接拼接
            res += code >= 65296 && code <= 65305 ? String.fromCharCode(code - 65248) : c;
        }
        return res;
    }

    // 将图片URL转换为Data URL
    function imageUrlToDataUrl(url, callback) {
        if (!url) {
            callback('');
            return;
        }

        // 使用GM_xmlhttpRequest获取图片数据
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            onload: function(response) {
                try {
                    // 转换MIME类型
                    let mimeType = 'image/jpeg';

                    // 将arraybuffer转换为base64
                    const base64 = btoa(
                        new Uint8Array(response.response).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            ''
                        )
                    );

                    // 构建Data URL
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    callback(dataUrl);
                } catch (e) {
                    console.error('图片转换为Data URL失败:', e);
                    callback('');
                }
            },
            onerror: function(error) {
                console.error('获取图片失败:', error);
                callback('');
            }
        });
    }

    // 完善的ISBN10转ISBN13功能
    function isbn10ToIsbn13(isbn10) {
        // 移除所有非数字字符（保留X作为最后一位）
        const cleaned = isbn10.replace(/[^0-9Xx]/g, '');

        // 验证ISBN-10格式
        if (cleaned.length !== 10) {
            return null;
        }

        // 转换为ISBN-13前12位
        let isbn13 = '978' + cleaned.substring(0, 9);

        // 计算校验位
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(isbn13.charAt(i), 10);
            sum += (i % 2 === 0) ? digit * 1 : digit * 3;
        }

        // 计算校验位
        const checksum = (10 - (sum % 10)) % 10;
        isbn13 += checksum.toString();

        return isbn13;
    }

    // 处理ISBN格式（去除横杠并转换为ISBN13）
    function processIsbn(isbn) {
        if (!isbn) return '';

        // 去除所有横杠
        const cleanIsbn = isbn.replace(/-/g, '');

        // 检查是否为ISBN10，若是则转换为ISBN13
        if (cleanIsbn.length === 10) {
            const converted = isbn10ToIsbn13(cleanIsbn);
            return converted || cleanIsbn; // 转换失败时返回原始清理后的ISBN
        }

        // 对于已为ISBN13的情况，直接返回清理后的值
        if (cleanIsbn.length === 13) {
            return cleanIsbn;
        }

        // 其他情况返回清理后的值
        return cleanIsbn;
    }

    // 在NDL搜索页面的操作
    if (window.location.href.includes('ndlsearch.ndl.go.jp/search')) {
        // 为所有h3元素后添加点击链接
        function addActionLinks() {
            const h3Elements = document.querySelectorAll('h3');
            h3Elements.forEach(h3 => {
                // 检查是否已添加过链接，避免重复
                if (h3.nextElementSibling?.classList.contains('ndl-bgm-link')) return;

                // 创建链接元素
                const link = document.createElement('a');
                link.href = 'javascript:';
                link.textContent = '→ 添加到 bangumi';
                link.className = 'ndl-bgm-link';
                link.style.marginLeft = '8px';

                // 绑定点击事件
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleLinkClick(h3);
                });

                // 插入到h3后面
                h3.after(link);
            });
        }

        // 处理链接点击事件
        function handleLinkClick(h3) {
            // 获取h3中的a标签href并提取id
            const aTag = h3.querySelector('a');
            if (!aTag) return;

            const id = aTag.href.split('/').pop();
            if (!id) return;

            // 获取图片src
            const imgSrc = h3.parentElement.parentElement.querySelector('img')?.src || '';

            // 先将图片转换为Data URL
            imageUrlToDataUrl(imgSrc, (dataUrl) => {
                // 获取API数据
                const apiUrl = `https://ndlsearch.ndl.go.jp/api/bib/download/json?cs=bib&f-token=${id}`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    onload: function(response) {
                        try {
                            const data = JSON.parse(response.responseText);
                            // 存储数据供BGM页面使用（包含Data URL）
                            GM_setValue('ndlData', JSON.stringify({
                                data: data,
                                imgDataUrl: dataUrl
                            }));
                            // 打开BGM新条目页面
                            GM_openInTab('https://bgm.tv/new_subject/1', { active: true });
                        } catch (e) {
                            console.error('解析JSON失败:', e);
                        }
                    },
                    onerror: function(error) {
                        console.error('API请求失败:', error);
                    }
                });
            });
        }

        // 初始加载时添加链接
        addActionLinks();

        // 监听页面变化，动态添加链接（应对可能的分页或动态加载）
        const observer = new MutationObserver(addActionLinks);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 在BGM.tv新条目页面的操作
    else if (window.location.pathname === '/new_subject/1') {
        // 等待元素出现
        function waitForElement(selector, callback) {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                return;
            }

            // 使用MutationObserver等待元素出现
            const observer = new MutationObserver(() => {
                const elem = document.querySelector(selector);
                if (elem) {
                    observer.disconnect();
                    callback(elem);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        // 处理日期格式为YYYY-MM-DD
        function processDate(dateText) {
            if (!dateText) return '';
            const normalizedText = dateText.replace(/\/|\.|．|年|月|日/g, '-');
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
        }

        // 填充表单数据
        function fillFormData(data, imgDataUrl) {
            // 填充标题，添加卷数信息
            const titleInput = document.querySelector('input[name="subject_title"]');
            if (titleInput && data.title && data.title[0]) {
                // 基础标题
                let titleText = data.title[0].value || '';
                // 如果有卷数信息，添加到标题后
                if (data.volume && data.volume[0]) {
                    if (/^第?\d+巻?$/.test(full2half(data.volume[0]))) {
                        titleText += ` (${full2half(data.volume[0]).match(/\d+/)[0]})`;
                    } else {
                        titleText += ` ${data.volume[0]}`;
                    }
                }
                const volumeTitle = data.volumeTitle?.[0]?.value;
                if (volumeTitle) {
                    titleText += ` ${volumeTitle}`;
                }
                titleInput.value = full2half(titleText);
            }

            // 处理作者信息（去除方括号及内容）
            let author = '', painter = '', gensaku = '';
            if (data.dc_creator && data.dc_creator[0]) {
                if (data.dc_creator.length === 1) {
                    author = data.dc_creator[0].name.replace(/\[.*?\]/g, '').replace(/[／∥ /]著/, '').trim();
                } else {
                    const authors = data.dc_creator.map(c => c.name);
                    gensaku = authors.find(a => a.match(/ 作$/)).replace(/ 作$/, '');
                    painter = authors.find(a => a.match(/ 画$/)).replace(/ 画$/, '');
                    if ((gensaku && painter && authors.length > 2) || !gensaku || !painter) {
                        gensaku = painter = '';
                        author = authors.join('、');
                    }
                }
            }

            // 处理出版社信息
            const publisher = data.publisher && data.publisher[0] ? data.publisher[0].name : '';

            // 处理ISBN（使用完善的转换函数）
            let isbn = '';
            if (data.identifier && data.identifier.ISBN && data.identifier.ISBN[0]) {
                isbn = processIsbn(data.identifier.ISBN[0]);
            }

            // 处理价格（去除"円"字）
            let price = '';
            if (data.price) {
                // 去除"円"字并添加JP¥前缀
                price = `JP¥${full2half(data.price).replace('円', '').trim()}`;
            }

            // 处理发售日
            const releaseDate = processDate(full2half(data.date || data.issued));

            // 处理页数
            const pages = data.extent ? full2half(data.extent[0]).match(/\d+/)[0] || '' : '';

            // 构建模板内容
            const template = `{{Infobox animanga/Book
|中文名=
|别名= {

}
|作者= ${author}
|作画= ${painter}
|脚本=
|原作= ${gensaku}
|插图=
|出版社= ${publisher}
|价格= ${price}
|其他出版社=
|连载杂志=
|发售日= ${releaseDate}
|页数= ${pages}
|ISBN= ${isbn}
|链接= {

}
}}`;

            // 填充文本区域
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value = template;
            }

            // 设置预览图片（使用Data URL）
            if (imgDataUrl) {
                waitForElement('img.preview', (previewImg) => {
                    previewImg.src = imgDataUrl;
                });
            }

            // 自动点击#cat_comic元素
            waitForElement('#cat_comic', (catComic) => {
                catComic.click();
            });
        }

        // 尝试获取并填充数据
        const storedData = GM_getValue('ndlData');
        if (storedData) {
            try {
                const { data, imgDataUrl } = JSON.parse(storedData);
                fillFormData(data, imgDataUrl);
                // 清除已使用的数据
                GM_deleteValue('ndlData');
            } catch (e) {
                console.error('解析存储的数据失败:', e);
                GM_deleteValue('ndlData');
            }
        }
    }
})();
