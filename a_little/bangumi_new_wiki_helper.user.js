// ==UserScript==
// @name        bangumi new wiki helper
// @name:zh-CN  bangumi 创建条目助手
// @namespace   https://github.com/22earth
// @description assist to create new subject
// @description:zh-cn 辅助创建 bangumi.tv 上的条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/www\.amazon\.co\.jp\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @match      *://*/*
// @author      22earth
// @homepage    https://github.com/22earth/bangumi-new-wiki-helper
// @version     0.3.2
// @note        0.3.0 使用 typescript 重构，浏览器扩展和脚本使用公共代码
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://cdn.staticfile.org/fuse.js/6.4.0/fuse.min.js
// ==/UserScript==

var __enable_header = ''; // 避免 header 被清除的 hack
console.info(__enable_header);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

var SubjectTypeId;
(function (SubjectTypeId) {
    SubjectTypeId[SubjectTypeId["book"] = 1] = "book";
    SubjectTypeId[SubjectTypeId["anime"] = 2] = "anime";
    SubjectTypeId[SubjectTypeId["music"] = 3] = "music";
    SubjectTypeId[SubjectTypeId["game"] = 4] = "game";
    SubjectTypeId[SubjectTypeId["real"] = 6] = "real";
    SubjectTypeId["all"] = "all";
})(SubjectTypeId || (SubjectTypeId = {}));

// TODO: 区分 kindle 页面和 纸质书页面
const amazonSubjectModel = {
    key: 'amazon_jp_book',
    host: ['amazon.co.jp'],
    description: '日亚图书',
    type: SubjectTypeId.book,
    pageSelectors: [
        {
            selector: '#nav-subnav .nav-a:first-child',
            subSelector: '.nav-a-content',
            keyWord: '(?<!Kindle)本'
        },
        {
            selector: '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
            subSelector: '.a-link-normal',
            keyWord: '(?<!Kindle)本'
        }
    ],
    controlSelector: {
        selector: '#title',
    },
    itemList: []
};
amazonSubjectModel.itemList.push({
    name: '名称',
    selector: {
        selector: '#productTitle',
    },
    category: 'subject_title'
}, {
    name: 'cover',
    selector: {
        selector: 'img#imgBlkFront',
    },
    // selector: 'img#igImage'
    category: 'cover'
}, {
    name: 'ASIN',
    selector: {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
        keyWord: 'ISBN-10',
        separator: ':',
    },
    category: 'ASIN'
}, {
    name: 'ISBN',
    selector: {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
        keyWord: 'ISBN-13',
        separator: ':',
    },
    category: 'ISBN'
}, {
    name: '发售日',
    selector: {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
        keyWord: '発売日',
        separator: ':',
    },
    category: 'date'
}, {
    name: '作者',
    selector: [
        {
            selector: '#byline .author span.a-size-medium'
        },
        {
            selector: '#bylineInfo .author > a'
        },
        {
            selector: '#bylineInfo .contributorNameID'
        },
    ]
}, {
    name: '出版社',
    selector: {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
        separator: ':',
        keyWord: '出版社'
    }
}, {
    name: '页数',
    selector: {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
        separator: ':',
        keyWord: 'ページ'
    },
}, {
    name: '价格',
    selector: [
        {
            selector: '.swatchElement.selected .a-color-base .a-size-base'
        },
        {
            selector: '.swatchElement.selected .a-color-base'
        }
    ]
}, {
    name: '内容简介',
    selector: [
        {
            selector: '#productDescription',
            subSelector: 'h3',
            sibling: true,
            keyWord: ['内容紹介', '内容'],
        },
        {
            selector: '#bookDesc_iframe',
            subSelector: '#iframeContent',
            isIframe: true
        }
    ],
    category: 'subject_summary'
});

const getchuGameModel = {
    key: 'getchu_game',
    description: 'Getchu游戏',
    host: ['getchu.com'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.genretab.current',
            subSelector: 'a',
            keyWord: 'ゲーム'
        }
    ],
    controlSelector: {
        selector: '#soft-title'
    },
    itemList: []
};
const commonSelector = {
    selector: '#soft_table table',
    subSelector: 'td',
    sibling: true
};
const dict = {
    "定価": "售价",
    "発売日": "发行日期",
    "ジャンル": "游戏类型",
    "ブランド": "开发",
    "原画": "原画",
    "音楽": "音乐",
    "シナリオ": "剧本",
    "アーティスト": "主题歌演出",
    "作詞": "主题歌作词",
    "作曲": "主题歌作曲",
};
const configArr = Object.keys(dict).map(key => {
    const r = {
        name: dict[key],
        selector: Object.assign({ 
            // 匹配关键字开头 2020/03/18
            keyWord: '^' + key }, commonSelector)
    };
    if (key === '発売日') {
        r.category = 'date';
    }
    return r;
});
getchuGameModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#soft-title',
    },
    category: 'subject_title'
}, {
    name: 'cover',
    selector: {
        selector: '#soft_table .highslide',
    },
    category: 'cover'
}, ...configArr, {
    name: '游戏简介',
    selector: [
        {
            selector: '#wrapper',
            subSelector: '.tabletitle',
            sibling: true,
            keyWord: 'ストーリー',
        },
        {
            selector: '#wrapper',
            subSelector: '.tabletitle',
            sibling: true,
            keyWord: '商品紹介',
        }
    ],
    category: 'subject_summary'
});
getchuGameModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform'
    }
];

/**
 * 为页面添加样式
 * @param style
 */
/**
 * 获取节点文本
 * @param elem
 */
function getText(elem) {
    if (!elem)
        return '';
    return elem.textContent || elem.innerText || '';
}
/**
 * dollar 选择单个
 * @param {string} selector
 */
function $q(selector) {
    if (window._parsedEl) {
        return window._parsedEl.querySelector(selector);
    }
    return document.querySelector(selector);
}
/**
 * dollar 选择所有元素
 * @param {string} selector
 */
function $qa(selector) {
    if (window._parsedEl) {
        return window._parsedEl.querySelectorAll(selector);
    }
    return document.querySelectorAll(selector);
}
/**
 * 查找包含文本的标签
 * @param {string} selector
 * @param {string} text
 */
function contains(selector, text, $parent) {
    let elements;
    if ($parent) {
        elements = $parent.querySelectorAll(selector);
    }
    else {
        elements = $qa(selector);
    }
    let t;
    if (typeof text === 'string') {
        t = text;
    }
    else {
        t = text.join('|');
    }
    return [].filter.call(elements, function (element) {
        return new RegExp(t, 'i').test(getText(element));
    });
}
function findElementByKeyWord(selector, $parent) {
    let res = null;
    const targets = contains(selector.subSelector, selector.keyWord, $parent ? $parent : $q(selector.selector));
    if (targets && targets.length) {
        let $t = targets[targets.length - 1];
        // 相邻节点
        if (selector.sibling) {
            $t = targets[targets.length - 1].nextElementSibling;
        }
        return $t;
    }
    return res;
}
function findElement(selector, $parent) {
    var _a;
    let r = null;
    if (selector) {
        if (selector instanceof Array) {
            let i = 0;
            let targetSelector = selector[i];
            while (targetSelector && !(r = findElement(targetSelector))) {
                targetSelector = selector[++i];
            }
        }
        else {
            if (!selector.subSelector) {
                r = $parent
                    ? $parent.querySelector(selector.selector)
                    : $q(selector.selector);
            }
            else if (selector.isIframe) {
                // iframe 暂时不支持 parent
                const $iframeDoc = (_a = $q(selector.selector)) === null || _a === void 0 ? void 0 : _a.contentDocument;
                r = $iframeDoc === null || $iframeDoc === void 0 ? void 0 : $iframeDoc.querySelector(selector.subSelector);
            }
            else {
                r = findElementByKeyWord(selector, $parent);
            }
            if (selector.nextSelector) {
                const nextSelector = selector.nextSelector;
                r = findElement(nextSelector, r);
            }
        }
    }
    return r;
}

// support GM_XMLHttpRequest
function fetchText(url, TIMEOUT = 10 * 1000) {
    // @ts-ignore
    {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            GM_xmlhttpRequest({
                method: "GET",
                timeout: TIMEOUT || 10 * 1000,
                url: url,
                // @ts-ignore
                onreadystatechange: function (response) {
                    if (response.readyState === 4 && response.status === 200) {
                        resolve(response.responseText);
                    }
                },
                // @ts-ignore
                onerror: function (err) {
                    reject(err);
                },
                // @ts-ignore
                ontimeout: function (err) {
                    reject(err);
                }
            });
        });
    }
}

/**
 * convert base64/URLEncoded data component to raw binary data held in a string
 * https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
 * @param dataURI
 */
function dataURItoBlob(dataURI) {
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = decodeURI(dataURI.split(',')[1]); // instead of unescape
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
}
function getImageDataByURL(url) {
    if (!url)
        return Promise.reject('invalid img url');
    return new Promise((resolve) => {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            var reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    });
}
/**
 * convert to img Element to base64 string
 * @param $img
 */
function convertImgToBase64($img) {
    const canvas = document.createElement("canvas");
    canvas.width = $img.width;
    canvas.height = $img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage($img, 0, 0, $img.width, $img.height);
    const dataURL = canvas.toDataURL("image/png");
    return dataURL;
}

function genRandomStr(len) {
    return Array.apply(null, Array(len))
        .map(function () {
        return (function (chars) {
            return chars.charAt(Math.floor(Math.random() * chars.length));
        })('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
    })
        .join('');
}
function formatDate(time, fmt = 'yyyy-MM-dd') {
    const date = new Date(time);
    var o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
    };
    if (/(y+)/i.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')', 'i').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
        }
    }
    return fmt;
}
function dealDate(dataStr) {
    // 2019年12月19
    let l = [];
    if (/\d{4}年\d{1,2}月(\d{1,2}日?)?/.test(dataStr)) {
        l = dataStr
            .replace('日', '')
            .split(/年|月/)
            .filter((i) => i);
    }
    else if (/\d{4}\/\d{1,2}(\/\d{1,2})?/.test(dataStr)) {
        l = dataStr.split('/');
    }
    else if (/\d{4}-\d{1,2}(-\d{1,2})?/.test(dataStr)) {
        return dataStr;
    }
    else {
        return dataStr;
    }
    return l
        .map((i) => {
        if (i.length === 1) {
            return `0${i}`;
        }
        return i;
    })
        .join('-');
}
function isEqualDate(d1, d2) {
    const resultDate = new Date(d1);
    const originDate = new Date(d2);
    if (resultDate.getFullYear() === originDate.getFullYear() &&
        resultDate.getMonth() === originDate.getMonth() &&
        resultDate.getDate() === originDate.getDate()) {
        return true;
    }
    return false;
}

const getchuTools = {
    dealTitle(str) {
        str = str.trim().split('\n')[0];
        str = str.split('＋')[0].replace(/（このタイトルの関連商品）/, '').trim();
        return str.replace(/\s[^ ]*?(限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし).*?$|＜.*＞$/g, '');
    },
    getCharacterInfo($t) {
        const charaData = [];
        const $name = $t.previousElementSibling;
        let name;
        if ($name.querySelector('charalist')) {
            const $charalist = $name.querySelector('charalist');
            name = getText($charalist);
        }
        else {
            name = getText($name).split(/（|\(|\sCV|新建角色/)[0];
        }
        charaData.push({
            name: '姓名',
            value: name.replace(/\s/g, ''),
            category: 'crt_name'
        });
        charaData.push({
            name: '日文名',
            value: name
        });
        const nameTxt = getText($name);
        if (nameTxt.match(/（(.*)）/)) {
            charaData.push({
                name: '纯假名',
                value: nameTxt.match(/（(.*)）/)[1]
            });
        }
        const cvMatch = nameTxt.match(/(?<=CV[：:]).+/);
        if (cvMatch) {
            charaData.push({
                name: 'CV',
                value: cvMatch[0]
            });
        }
        const $img = $t.closest('tr').querySelector('td > img');
        if ($img) {
            charaData.push({
                name: 'cover',
                value: convertImgToBase64($img),
                category: 'crt_cover'
            });
        }
        // 处理杂项 参考 id=1074002 id=735329
        // id=1080431
        // dd tag
        const $dd = $t.closest('dt').nextElementSibling;
        const $clonedDd = $dd.cloneNode(true);
        Array.prototype.forEach.call($clonedDd.querySelectorAll('span[style^="font-weight"]'), (node) => {
            const t = getText(node).trim();
            t.split(/\n/g).forEach((el) => {
                const alist = el.trim().split(/：|:/);
                if (alist && alist.length === 2) {
                    charaData.push({
                        name: alist[0].trim(),
                        value: alist[1]
                    });
                }
                else {
                    const c = el.match(/B.*W.*H\d+/);
                    if (c) {
                        charaData.push({
                            name: 'BWH',
                            value: c[0]
                        });
                    }
                }
            });
            node.remove();
        });
        charaData.push({
            name: '人物简介',
            value: getText($clonedDd).trim(),
            category: 'crt_summary'
        });
        return charaData;
    }
};

const amazonTools = {
    dealTitle(str) {
        str = str.trim().split('\n')[0].trim();
        // str = str.split(/\s[(（][^0-9)）]+?[)）]/)[0]
        // 去掉尾部括号的内容, (1) （1） 这类不处理
        return str.replace(/\s[(（][^0-9)）]+?[)）]$/g, '').trim();
        // return str.replace(/(?:(\d+))(\)|）).*$/, '$1$2').trim();
    }
};

const dealUtils = {
    steam_game: [
        {
            category: 'website',
            dealFunc(str) {
                // https://steamcommunity.com/linkfilter/?url=https://www.koeitecmoamerica.com/ryza/
                const arr = str.split('?url=');
                return arr[1] || '';
            },
        },
        {
            category: 'date',
            dealFunc(str) {
                if (/年/.test(str)) {
                    return dealDate(str);
                }
                return formatDate(str);
            },
        },
    ],
    steamdb_game: [
        {
            category: 'date',
            dealFunc(str) {
                const arr = str.split('–');
                if (!arr[0])
                    return '';
                return formatDate(arr[0].trim());
            },
        },
    ],
    getchu_game: [
        {
            category: 'subject_title',
            dealFunc: getchuTools.dealTitle,
        },
    ],
    amazon_jp_book: [
        {
            category: 'subject_title',
            dealFunc: amazonTools.dealTitle,
        },
    ],
};
function dealFuncByCategory(key, category) {
    let fn;
    if (dealUtils[key]) {
        const obj = dealUtils[key].find((x) => x.category === category);
        fn = obj && obj.dealFunc;
    }
    if (fn) {
        return fn;
    }
    else {
        return (str) => str.trim();
    }
}

/**
 * 处理单项 wiki 信息
 * @param str
 * @param category
 * @param keyWords
 */
function dealItemText(str, category = '', keyWords = []) {
    const separators = [':', '：'];
    if (['subject_summary', 'subject_title'].indexOf(category) !== -1) {
        return str;
    }
    const textList = ['\\(.*?\\)', '（.*?）']; // 去掉多余的括号信息
    // const keyStr = keyWords.sort((a, b) => b.length - a.length).join('|')
    // `(${keyStr})(${separators.join('|')})?`
    return str
        .replace(new RegExp(textList.join('|'), 'g'), '')
        .replace(new RegExp(keyWords.join('|')), '')
        .replace(new RegExp(`^.*?${separators.join('|')}`), '')
        .trim();
}
function getWikiItem(infoConfig, site) {
    return __awaiter(this, void 0, void 0, function* () {
        const sl = infoConfig.selector;
        let $d;
        let targetSelector;
        if (sl instanceof Array) {
            let i = 0;
            targetSelector = sl[i];
            while (!($d = findElement(targetSelector)) && i < sl.length) {
                targetSelector = sl[++i];
            }
        }
        else {
            targetSelector = sl;
            $d = findElement(targetSelector);
        }
        if (!$d)
            return;
        let keyWords;
        if (targetSelector.keyWord instanceof Array) {
            keyWords = targetSelector.keyWord;
        }
        else {
            keyWords = [targetSelector.keyWord];
        }
        let val;
        const txt = getText($d);
        switch (infoConfig.category) {
            case 'cover':
                let url;
                if ($d.tagName.toLowerCase() === 'a') {
                    url = $d.getAttribute('href');
                    val = {
                        url: url,
                        dataUrl: url,
                    };
                }
                else if ($d.tagName.toLowerCase() === 'img') {
                    url = $d.getAttribute('src');
                    val = {
                        url: url,
                        dataUrl: yield getImageDataByURL(url),
                        height: $d.clientHeight,
                        width: $d.clientWidth,
                    };
                }
                break;
            case 'alias':
            case 'subject_title':
                val = dealFuncByCategory(site, infoConfig.category)(txt);
                break;
            case 'website':
                val = dealFuncByCategory(site, 'website')($d.getAttribute('href'));
                break;
            case 'date':
                if (!['amazon_jp_book', 'getchu_game'].includes(site)) {
                    val = dealFuncByCategory(site, infoConfig.category)(txt);
                    break;
                }
            default:
                val = dealItemText(txt, infoConfig.category, keyWords);
        }
        if (val) {
            return {
                name: infoConfig.name,
                value: val,
                category: infoConfig.category,
            };
        }
    });
}
function getWikiData(siteConfig, el) {
    return __awaiter(this, void 0, void 0, function* () {
        if (el) {
            window._parsedEl = el;
        }
        else {
            window._parsedEl = null;
        }
        const r = yield Promise.all(siteConfig.itemList.map((item) => getWikiItem(item, siteConfig.key)));
        delete window._parsedEl;
        const defaultInfos = siteConfig.defaultInfos || [];
        return [...r.filter((i) => i), ...defaultInfos];
    });
}
/**
 * 过滤搜索结果： 通过名称以及日期
 * @param items
 * @param subjectInfo
 * @param opts
 */
function filterResults(items, subjectInfo, opts = {}, isSearch = true) {
    var _a;
    if (!items)
        return;
    // 只有一个结果时直接返回, 不再比较日期
    if (items.length === 1 && isSearch) {
        const result = items[0];
        return result;
        // if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
        // }
    }
    let results = new Fuse(items, Object.assign({}, opts)).search(subjectInfo.name);
    if (!results.length)
        return;
    // 有参考的发布时间
    if (subjectInfo.releaseDate) {
        for (const item of results) {
            const result = item.item;
            if (result.releaseDate) {
                if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
                    return result;
                }
            }
        }
    }
    // 比较名称
    const nameRe = new RegExp(subjectInfo.name.trim());
    for (const item of results) {
        const result = item.item;
        if (nameRe.test(result.name) || nameRe.test(result.greyName)) {
            return result;
        }
    }
    return (_a = results[0]) === null || _a === void 0 ? void 0 : _a.item;
}
function getQueryInfo(items) {
    let info = {};
    items.forEach((item) => {
        if (item.category === 'subject_title') {
            info.name = item.value;
        }
        if (item.category === 'date') {
            info.releaseDate = item.value;
        }
        if (item.category === 'ASIN') {
            info.asin = item.value;
        }
        if (item.category === 'ISBN') {
            info.isbn = item.value;
        }
    });
    return info;
}
/**
 * 插入控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
function insertControlBtn($t, cb) {
    if (!$t)
        return;
    const $s = document.createElement('span');
    $s.classList.add('e-wiki-new-subject');
    $s.innerHTML = '新建';
    const $search = $s.cloneNode();
    $search.innerHTML = '新建并查重';
    $t.appendChild($s);
    $t.appendChild($search);
    $s.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
        yield cb(e);
    }));
    $search.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
        if ($search.innerHTML !== '新建并查重')
            return;
        $search.innerHTML = '查重中...';
        try {
            yield cb(e, true);
            $search.innerHTML = '新建并查重';
        }
        catch (e) {
            if (e === 'notmatched') {
                $search.innerHTML = '未查到条目';
            }
            console.error(e);
        }
    }));
}
/**
 * 插入新建角色控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
function insertControlBtnChara($t, cb) {
    if (!$t)
        return;
    const $s = document.createElement('a');
    $s.classList.add('e-wiki-new-character');
    // $s.setAttribute('target', '_blank')
    $s.innerHTML = '添加新虚拟角色';
    $t.appendChild($s);
    $s.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
        yield cb(e);
    }));
}

function sleep(num) {
    return new Promise(resolve => {
        setTimeout(resolve, num);
    });
}

const subjectTypeDict = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: "anime",
    [SubjectTypeId.music]: "music",
    [SubjectTypeId.book]: "book",
    [SubjectTypeId.real]: "real",
    [SubjectTypeId.all]: "all",
};
var BangumiDomain;
(function (BangumiDomain) {
    BangumiDomain["chii"] = "chii.in";
    BangumiDomain["bgm"] = "bgm.tv";
    BangumiDomain["bangumi"] = "bangumi.tv";
})(BangumiDomain || (BangumiDomain = {}));
var Protocol;
(function (Protocol) {
    Protocol["http"] = "http";
    Protocol["https"] = "https";
})(Protocol || (Protocol = {}));
/**
 * 处理搜索页面的 html
 * @param info 字符串 html
 */
function dealSearchResults(info) {
    const results = [];
    let $doc = (new DOMParser()).parseFromString(info, "text/html");
    let items = $doc.querySelectorAll('#browserItemList>li>div.inner');
    // get number of page
    let numOfPage = 1;
    let pList = $doc.querySelectorAll('.page_inner>.p');
    if (pList && pList.length) {
        let tempNum = parseInt(pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]);
        numOfPage = parseInt(pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]);
        numOfPage = numOfPage > tempNum ? numOfPage : tempNum;
    }
    if (items && items.length) {
        for (const item of Array.prototype.slice.call(items)) {
            let $subjectTitle = item.querySelector('h3>a.l');
            let itemSubject = {
                name: $subjectTitle.textContent.trim(),
                // url 没有协议和域名
                url: $subjectTitle.getAttribute('href'),
                greyName: item.querySelector('h3>.grey') ?
                    item.querySelector('h3>.grey').textContent.trim() : '',
            };
            let matchDate = item.querySelector('.info').textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
            if (matchDate) {
                itemSubject.releaseDate = dealDate(matchDate[0]);
            }
            let $rateInfo = item.querySelector('.rateInfo');
            if ($rateInfo) {
                if ($rateInfo.querySelector('.fade')) {
                    itemSubject.score = $rateInfo.querySelector('.fade').textContent;
                    itemSubject.count = $rateInfo.querySelector('.tip_j').textContent.replace(/[^0-9]/g, '');
                }
                else {
                    itemSubject.score = '0';
                    itemSubject.count = '少于10';
                }
            }
            else {
                itemSubject.score = '0';
                itemSubject.count = '0';
            }
            results.push(itemSubject);
        }
    }
    else {
        return [];
    }
    return [results, numOfPage];
}
/**
 * 搜索条目
 * @param subjectInfo
 * @param type
 * @param uniqueQueryStr
 */
function searchSubject(subjectInfo, bgmHost = 'https://bgm.tv', type = SubjectTypeId.all, uniqueQueryStr = '') {
    return __awaiter(this, void 0, void 0, function* () {
        let releaseDate;
        if (subjectInfo && subjectInfo.releaseDate) {
            releaseDate = subjectInfo.releaseDate;
        }
        let query = (subjectInfo.name || '').trim();
        if (type === SubjectTypeId.book) {
            // 去掉末尾的括号并加上引号
            query = query.replace(/（[^0-9]+?）|\([^0-9]+?\)$/, '');
            query = `"${query}"`;
        }
        if (uniqueQueryStr) {
            query = `"${uniqueQueryStr}"`;
        }
        if (!query) {
            console.info('Query string is empty');
            return [];
        }
        const url = `${bgmHost}/subject_search/${encodeURIComponent(query)}?cat=${type}`;
        console.info('search bangumi subject URL: ', url);
        const rawText = yield fetchText(url);
        const rawInfoList = dealSearchResults(rawText)[0] || [];
        // 使用指定搜索字符串如 ISBN 搜索时, 并且结果只有一条时，不再使用名称过滤
        if (uniqueQueryStr && rawInfoList && rawInfoList.length === 1) {
            return rawInfoList[0];
        }
        const options = {
            keys: [
                "name",
                "greyName"
            ]
        };
        return filterResults(rawInfoList, subjectInfo, options);
    });
}
/**
 * 通过时间查找条目
 * @param subjectInfo 条目信息
 * @param pageNumber 页码
 * @param type 条目类型
 */
function findSubjectByDate(subjectInfo, bgmHost = 'https://bgm.tv', pageNumber = 1, type) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!subjectInfo || !subjectInfo.releaseDate || !subjectInfo.name) {
            throw new Error('invalid subject info');
        }
        const releaseDate = new Date(subjectInfo.releaseDate);
        if (isNaN(releaseDate.getTime())) {
            throw `invalid releasedate: ${subjectInfo.releaseDate}`;
        }
        const sort = releaseDate.getDate() > 15 ? 'sort=date' : '';
        const page = pageNumber ? `page=${pageNumber}` : '';
        let query = '';
        if (sort && page) {
            query = '?' + sort + '&' + page;
        }
        else if (sort) {
            query = '?' + sort;
        }
        else if (page) {
            query = '?' + page;
        }
        const url = `${bgmHost}/${type}/browser/airtime/${releaseDate.getFullYear()}-${releaseDate.getMonth() + 1}${query}`;
        console.info('find subject by date: ', url);
        const rawText = yield fetchText(url);
        let [rawInfoList, numOfPage] = dealSearchResults(rawText);
        const options = {
            threshold: 0.3,
            keys: [
                "name",
                "greyName"
            ]
        };
        let result = filterResults(rawInfoList, subjectInfo, options, false);
        if (!result) {
            if (pageNumber < numOfPage) {
                yield sleep(300);
                return yield findSubjectByDate(subjectInfo, bgmHost, pageNumber + 1, type);
            }
            else {
                throw 'notmatched';
            }
        }
        return result;
    });
}
function checkBookSubjectExist(subjectInfo, bgmHost = 'https://bgm.tv', type) {
    return __awaiter(this, void 0, void 0, function* () {
        let searchResult = yield searchSubject(subjectInfo, bgmHost, type, subjectInfo.isbn);
        console.info(`First: search book of bangumi: `, searchResult);
        if (searchResult && searchResult.url) {
            return searchResult;
        }
        searchResult = yield searchSubject(subjectInfo, bgmHost, type, subjectInfo.asin);
        console.info('Second: search book of bangumi: ', searchResult);
        if (searchResult && searchResult.url) {
            return searchResult;
        }
        // 默认使用名称搜索
        searchResult = yield searchSubject(subjectInfo, bgmHost, type);
        console.info('Third: search book of bangumi: ', searchResult);
        return searchResult;
    });
}
/**
 * 查找条目是否存在： 通过名称搜索或者日期加上名称的过滤查询
 * @param subjectInfo 条目基本信息
 * @param bgmHost bangumi 域名
 * @param type 条目类型
 */
function checkExist(subjectInfo, bgmHost = 'https://bgm.tv', type) {
    return __awaiter(this, void 0, void 0, function* () {
        let searchResult = yield searchSubject(subjectInfo, bgmHost, type);
        console.info(`First: search result of bangumi: `, searchResult);
        if (searchResult && searchResult.url) {
            return searchResult;
        }
        searchResult = yield findSubjectByDate(subjectInfo, bgmHost, 1, subjectTypeDict[type]);
        console.info(`Second: search result by date: `, searchResult);
        return searchResult;
    });
}
function checkSubjectExit(subjectInfo, bgmHost = 'https://bgm.tv', type) {
    return __awaiter(this, void 0, void 0, function* () {
        let result;
        switch (type) {
            case SubjectTypeId.book:
                result = yield checkBookSubjectExist(subjectInfo, bgmHost, type);
                break;
            case SubjectTypeId.game:
                result = yield checkExist(subjectInfo, bgmHost, type);
                break;
            case SubjectTypeId.anime:
            case SubjectTypeId.real:
            case SubjectTypeId.music:
            default:
                console.info('not support type: ', type);
        }
        return result;
    });
}

// 配置变量
const SCRIPT_PREFIX = 'E_USERJS_';
const AUTO_FILL_FORM = SCRIPT_PREFIX + 'autofill';
const WIKI_DATA = SCRIPT_PREFIX + 'wiki_data';
const CHARA_DATA = SCRIPT_PREFIX + 'wiki_data';
const PROTOCOL = SCRIPT_PREFIX + 'protocol';
const BGM_DOMAIN = SCRIPT_PREFIX + 'bgm_domain';

function initCommon(siteConfig, subtype = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        const $page = findElement(siteConfig.pageSelectors);
        if (!$page)
            return;
        const $title = findElement(siteConfig.controlSelector);
        if (!$title)
            return;
        insertControlBtn($title.parentElement, (e, flag) => __awaiter(this, void 0, void 0, function* () {
            const protocol = GM_getValue(PROTOCOL) || 'https';
            const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
            const bgmHost = `${protocol}://${bgm_domain}`;
            console.info('init');
            const infoList = yield getWikiData(siteConfig);
            console.info('wiki info list: ', infoList);
            const wikiData = {
                type: siteConfig.type,
                subtype,
                infos: infoList,
            };
            GM_setValue(WIKI_DATA, JSON.stringify(wikiData));
            if (flag) {
                const result = yield checkSubjectExit(getQueryInfo(infoList), bgmHost, wikiData.type);
                console.info('search results: ', result);
                if (result && result.url) {
                    GM_openInTab(bgmHost + result.url);
                }
                else {
                    // 重置自动填表
                    GM_setValue(AUTO_FILL_FORM, 1);
                    setTimeout(() => {
                        GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`);
                    }, 200);
                }
            }
            else {
                // 重置自动填表
                GM_setValue(AUTO_FILL_FORM, 1);
                setTimeout(() => {
                    GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`);
                }, 200);
            }
        }));
    });
}
function addStyle() {
    GM_addStyle(`
.e-wiki-new-character, .e-wiki-new-subject, .e-wiki-search-subject, .e-wiki-fill-form {
  color: rgb(0, 180, 30) !important;
  margin-left: 4px !important;
}

.e-wiki-new-subject {
  margin-left: 8px;
}

.e-wiki-new-character:hover,
.e-wiki-new-subject:hover,
.e-wiki-search-subject:hover,
.e-wiki-fill-form:hover {
  color: red !important;
  cursor: pointer;
}

/* upload img */
.e-wiki-cover-container {
  margin-top: 1rem;
}

.e-wiki-cover-container img {
  display: none;
}

#e-wiki-cover-amount {
  padding-left: 10px;
  border: 0;
  color: #f6931f;
  font-size: 20px;
  font-weight: bold;
}

#e-wiki-cover-reset {
  display: inline-block;
  text-align: center;
  width: 60px;
  height: 30px;
  line-height: 30px;
  font-size: 18px;
  background-color: #f09199;
  text-decoration: none;
  color: #fff;
  margin-left: 50px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 1px 1px 2px #333;
}

#e-wiki-cover-preview {
  margin-top: 0.5rem;
}

#e-wiki-cover-preview:active {
  cursor: crosshair;
}

#e-wiki-cover-preview {
  display: block;
}

.e-wiki-cover-blur-loading {
  width: 208px;
  height: 13px;
  background-image: url("https://bgm.tv/img/loadingAnimation.gif");
}

.e-wiki-search-cover {
  width: 84px;
  height: auto;
}

.preview-fetch-img-link {
  margin-left: 8px;
  font-weight: 500;
  color: #149bff !important;
  text-decoration: none;
}
  `);
}

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
* StackBlur - a fast almost Gaussian Blur For Canvas
*
* In case you find this class useful - especially in commercial projects -
* I am not totally unhappy for a small donation to my PayPal account
* mario@quasimondo.de
*
* Or support me on flattr:
* {@link https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript}
* @module StackBlur
* @version 0.5
* @author Mario Klingemann
* Contact: mario@quasimondo.com
* Website: {@link http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html}
* Twitter: @quasimondo
*
* @copyright (c) 2010 Mario Klingemann
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/
var mulTable = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
var shgTable = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];
/**
 * @param {string|HTMLCanvasElement} canvas
 * @param {Integer} topX
 * @param {Integer} topY
 * @param {Integer} width
 * @param {Integer} height
 * @throws {Error|TypeError}
 * @returns {ImageData} See {@link https://html.spec.whatwg.org/multipage/canvas.html#imagedata}
 */


function getImageDataFromCanvas(canvas, topX, topY, width, height) {
  if (typeof canvas === 'string') {
    canvas = document.getElementById(canvas);
  }

  if (!canvas || _typeof(canvas) !== 'object' || !('getContext' in canvas)) {
    throw new TypeError('Expecting canvas with `getContext` method in processCanvasRGB(A) calls!');
  }

  var context = canvas.getContext('2d');

  try {
    return context.getImageData(topX, topY, width, height);
  } catch (e) {
    throw new Error('unable to access image data: ' + e);
  }
}
/**
 * @param {HTMLCanvasElement} canvas
 * @param {Integer} topX
 * @param {Integer} topY
 * @param {Integer} width
 * @param {Integer} height
 * @param {Float} radius
 * @returns {undefined}
 */


function processCanvasRGBA(canvas, topX, topY, width, height, radius) {
  if (isNaN(radius) || radius < 1) {
    return;
  }

  radius |= 0;
  var imageData = getImageDataFromCanvas(canvas, topX, topY, width, height);
  imageData = processImageDataRGBA(imageData, topX, topY, width, height, radius);
  canvas.getContext('2d').putImageData(imageData, topX, topY);
}
/**
 * @param {ImageData} imageData
 * @param {Integer} topX
 * @param {Integer} topY
 * @param {Integer} width
 * @param {Integer} height
 * @param {Float} radius
 * @returns {ImageData}
 */


function processImageDataRGBA(imageData, topX, topY, width, height, radius) {
  var pixels = imageData.data;
  var x, y, i, p, yp, yi, yw, rSum, gSum, bSum, aSum, rOutSum, gOutSum, bOutSum, aOutSum, rInSum, gInSum, bInSum, aInSum, pr, pg, pb, pa, rbs;
  var div = 2 * radius + 1; // const w4 = width << 2;

  var widthMinus1 = width - 1;
  var heightMinus1 = height - 1;
  var radiusPlus1 = radius + 1;
  var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
  var stackStart = new BlurStack();
  var stack = stackStart;
  var stackEnd;

  for (i = 1; i < div; i++) {
    stack = stack.next = new BlurStack();

    if (i === radiusPlus1) {
      stackEnd = stack;
    }
  }

  stack.next = stackStart;
  var stackIn = null;
  var stackOut = null;
  yw = yi = 0;
  var mulSum = mulTable[radius];
  var shgSum = shgTable[radius];

  for (y = 0; y < height; y++) {
    rInSum = gInSum = bInSum = aInSum = rSum = gSum = bSum = aSum = 0;
    rOutSum = radiusPlus1 * (pr = pixels[yi]);
    gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
    bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);
    aOutSum = radiusPlus1 * (pa = pixels[yi + 3]);
    rSum += sumFactor * pr;
    gSum += sumFactor * pg;
    bSum += sumFactor * pb;
    aSum += sumFactor * pa;
    stack = stackStart;

    for (i = 0; i < radiusPlus1; i++) {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack.a = pa;
      stack = stack.next;
    }

    for (i = 1; i < radiusPlus1; i++) {
      p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
      rSum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
      gSum += (stack.g = pg = pixels[p + 1]) * rbs;
      bSum += (stack.b = pb = pixels[p + 2]) * rbs;
      aSum += (stack.a = pa = pixels[p + 3]) * rbs;
      rInSum += pr;
      gInSum += pg;
      bInSum += pb;
      aInSum += pa;
      stack = stack.next;
    }

    stackIn = stackStart;
    stackOut = stackEnd;

    for (x = 0; x < width; x++) {
      pixels[yi + 3] = pa = aSum * mulSum >> shgSum;

      if (pa !== 0) {
        pa = 255 / pa;
        pixels[yi] = (rSum * mulSum >> shgSum) * pa;
        pixels[yi + 1] = (gSum * mulSum >> shgSum) * pa;
        pixels[yi + 2] = (bSum * mulSum >> shgSum) * pa;
      } else {
        pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
      }

      rSum -= rOutSum;
      gSum -= gOutSum;
      bSum -= bOutSum;
      aSum -= aOutSum;
      rOutSum -= stackIn.r;
      gOutSum -= stackIn.g;
      bOutSum -= stackIn.b;
      aOutSum -= stackIn.a;
      p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;
      rInSum += stackIn.r = pixels[p];
      gInSum += stackIn.g = pixels[p + 1];
      bInSum += stackIn.b = pixels[p + 2];
      aInSum += stackIn.a = pixels[p + 3];
      rSum += rInSum;
      gSum += gInSum;
      bSum += bInSum;
      aSum += aInSum;
      stackIn = stackIn.next;
      rOutSum += pr = stackOut.r;
      gOutSum += pg = stackOut.g;
      bOutSum += pb = stackOut.b;
      aOutSum += pa = stackOut.a;
      rInSum -= pr;
      gInSum -= pg;
      bInSum -= pb;
      aInSum -= pa;
      stackOut = stackOut.next;
      yi += 4;
    }

    yw += width;
  }

  for (x = 0; x < width; x++) {
    gInSum = bInSum = aInSum = rInSum = gSum = bSum = aSum = rSum = 0;
    yi = x << 2;
    rOutSum = radiusPlus1 * (pr = pixels[yi]);
    gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
    bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);
    aOutSum = radiusPlus1 * (pa = pixels[yi + 3]);
    rSum += sumFactor * pr;
    gSum += sumFactor * pg;
    bSum += sumFactor * pb;
    aSum += sumFactor * pa;
    stack = stackStart;

    for (i = 0; i < radiusPlus1; i++) {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack.a = pa;
      stack = stack.next;
    }

    yp = width;

    for (i = 1; i <= radius; i++) {
      yi = yp + x << 2;
      rSum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
      gSum += (stack.g = pg = pixels[yi + 1]) * rbs;
      bSum += (stack.b = pb = pixels[yi + 2]) * rbs;
      aSum += (stack.a = pa = pixels[yi + 3]) * rbs;
      rInSum += pr;
      gInSum += pg;
      bInSum += pb;
      aInSum += pa;
      stack = stack.next;

      if (i < heightMinus1) {
        yp += width;
      }
    }

    yi = x;
    stackIn = stackStart;
    stackOut = stackEnd;

    for (y = 0; y < height; y++) {
      p = yi << 2;
      pixels[p + 3] = pa = aSum * mulSum >> shgSum;

      if (pa > 0) {
        pa = 255 / pa;
        pixels[p] = (rSum * mulSum >> shgSum) * pa;
        pixels[p + 1] = (gSum * mulSum >> shgSum) * pa;
        pixels[p + 2] = (bSum * mulSum >> shgSum) * pa;
      } else {
        pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
      }

      rSum -= rOutSum;
      gSum -= gOutSum;
      bSum -= bOutSum;
      aSum -= aOutSum;
      rOutSum -= stackIn.r;
      gOutSum -= stackIn.g;
      bOutSum -= stackIn.b;
      aOutSum -= stackIn.a;
      p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;
      rSum += rInSum += stackIn.r = pixels[p];
      gSum += gInSum += stackIn.g = pixels[p + 1];
      bSum += bInSum += stackIn.b = pixels[p + 2];
      aSum += aInSum += stackIn.a = pixels[p + 3];
      stackIn = stackIn.next;
      rOutSum += pr = stackOut.r;
      gOutSum += pg = stackOut.g;
      bOutSum += pb = stackOut.b;
      aOutSum += pa = stackOut.a;
      rInSum -= pr;
      gInSum -= pg;
      bInSum -= pb;
      aInSum -= pa;
      stackOut = stackOut.next;
      yi += width;
    }
  }

  return imageData;
}
/**
 *
 */


var BlurStack = function BlurStack() {
  _classCallCheck(this, BlurStack);

  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 0;
  this.next = null;
};

/**
 * send form data with image
 * @param $form
 * @param dataURL
 */
function sendFormImg($form, dataURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = [];
        const $file = $form.querySelector('input[type=file]');
        const inputFileName = $file.name ? $file.name : 'picfile';
        info.push({
            name: inputFileName,
            value: dataURItoBlob(dataURL),
            filename: genRandomStr(5) + '.png'
        });
        return yield sendForm($form, info);
    });
}
/**
 * send form as xhr promise
 * TODO: return type
 * @param $form
 * @param extraInfo
 */
function sendForm($form, extraInfo = []) {
    return new Promise((resolve, reject) => {
        const fd = new FormData($form);
        extraInfo.forEach(item => {
            if (item.filename) {
                fd.set(item.name, item.value, item.filename);
            }
            else {
                fd.set(item.name, item.value);
            }
        });
        const $submit = $form.querySelector('[name=submit]');
        if ($submit && $submit.name && $submit.value) {
            fd.set($submit.name, $submit.value);
        }
        const xhr = new XMLHttpRequest();
        xhr.open($form.method.toLowerCase(), $form.action, true);
        xhr.onload = function () {
            let _location;
            if (xhr.status === 200) {
                _location = xhr.responseURL;
                if (_location) {
                    resolve(_location);
                }
                else {
                    reject('no location');
                }
            }
        };
        xhr.send(fd);
    });
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}
/**
 * blur canvas
 * @param el target canvas
 * @param width blur rect width
 * @param radius blur rect height
 */
function blur(el) {
    let isDrawing = false;
    let ctx = el.getContext('2d');
    el.onmousedown = function (e) {
        isDrawing = true;
        const pos = getMousePos(el, e);
        ctx.moveTo(pos.x, pos.y);
    };
    const $width = document.querySelector('#e-wiki-cover-slider-width');
    const $radius = document.querySelector('#e-wiki-cover-slider-radius');
    el.onmousemove = function (e) {
        if (isDrawing) {
            const pos = getMousePos(el, e);
            const width = +$width.value;
            const radius = +$radius.value;
            // stack blur operation
            processCanvasRGBA(el, pos.x - width / 2, pos.y - width / 2, width, width, radius);
        }
    };
    el.onmouseup = function () {
        isDrawing = false;
    };
}
function initContainer($target) {
    const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn" value="上传处理后的图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100">
    <canvas></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">
    <br>
    <a href="javascript:void(0)" id="e-wiki-cover-reset">reset</a>
    <img class="preview" src="" alt="" style="display:none;">
  `;
    const $info = document.createElement('div');
    $info.classList.add('e-wiki-cover-container');
    $info.innerHTML = rawHTML;
    $target.parentElement.insertBefore($info, $target.nextElementSibling);
    const $width = document.querySelector('#e-wiki-cover-slider-width');
    const $radius = document.querySelector('#e-wiki-cover-slider-radius');
    drawRec($width);
    changeInfo($width, $radius);
    $width.addEventListener('change', (e) => {
        drawRec($width);
        changeInfo($width, $radius);
    });
    $radius.addEventListener('change', (e) => {
        changeInfo($width, $radius);
    });
}
function drawRec($width) {
    // TODO: canvas type
    const $canvas = $width.nextElementSibling;
    const ctx = $canvas.getContext('2d');
    const width = Number($width.value);
    $canvas.width = width * 1.4;
    $canvas.height = width * 1.4;
    ctx.strokeStyle = '#f09199';
    ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
    // resize page
    window.dispatchEvent(new Event('resize'));
}
function changeInfo($width, $radius) {
    var $info = document.querySelector('#e-wiki-cover-amount');
    var radius = $radius.value;
    var width = $width.value;
    $info.value = width + ', ' + radius;
}
function previewFileImage($file, $canvas, $img = new Image()) {
    const ctx = $canvas.getContext('2d');
    $img.addEventListener('load', function () {
        $canvas.width = $img.width;
        $canvas.height = $img.height;
        ctx.drawImage($img, 0, 0);
        window.dispatchEvent(new Event('resize')); // let img cut tool at right position
    }, false);
    function loadImgData() {
        var file = $file.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            $img.src = reader.result;
        }, false);
        if (file) {
            reader.readAsDataURL(file);
        }
    }
    if ($file) {
        $file.addEventListener('change', loadImgData, false);
    }
}
/**
 * 初始化上传处理图片组件
 * @param {Object} $form - 包含 input file 的 DOM
 * @param {string} base64Data - 图片链接或者 base64 信息
 */
function dealImageWidget($form, base64Data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (document.querySelector('.e-wiki-cover-container'))
            return;
        initContainer($form);
        const $canvas = document.querySelector('#e-wiki-cover-preview');
        const $img = document.querySelector('.e-wiki-cover-container img.preview');
        if (base64Data) {
            if (base64Data.match(/^http/)) {
                // 跨域和refer 的问题，暂时改成链接
                // base64Data = await getImageDataByURL(base64Data);
                const link = document.createElement('a');
                link.classList.add('preview-fetch-img-link');
                link.href = base64Data;
                link.setAttribute('rel', 'noopener noreferrer nofollow');
                link.setAttribute('target', '_blank');
                link.innerText = '查看抓取封面';
                document.querySelector('.e-wiki-cover-container').insertBefore(link, document.querySelector('#e-wiki-cover-preview'));
            }
            else {
                $img.src = base64Data;
            }
        }
        const $file = $form.querySelector('input[type = file]');
        previewFileImage($file, $canvas, $img);
        blur($canvas);
        document.querySelector('#e-wiki-cover-reset').addEventListener('click', (e) => {
            // wiki 填表按钮
            const $fillForm = document.querySelector('.e-wiki-fill-form');
            if (base64Data) {
                $img.dispatchEvent(new Event('load'));
            }
            else if ($file && $file.files[0]) {
                $file.dispatchEvent(new Event('change'));
            }
            else if ($fillForm) {
                $fillForm.dispatchEvent(new Event('click'));
            }
        }, false);
        const $inputBtn = document.querySelector('.e-wiki-cover-container .inputBtn');
        if ($file) {
            $inputBtn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                e.preventDefault();
                if ($canvas.width > 8 && $canvas.height > 10) {
                    const $el = e.target;
                    $el.style.display = 'none';
                    const $loading = insertLoading($el);
                    try {
                        try {
                            // 执行标准化表单，避免修改后表单没有更新
                            // @ts-ignore
                            NormaltoWCODE();
                        }
                        catch (e) {
                        }
                        const url = yield sendFormImg($form, $canvas.toDataURL('image/png', 1));
                        $el.style.display = '';
                        $loading.remove();
                        location.assign(url);
                    }
                    catch (e) {
                        console.log('send form err: ', e);
                    }
                }
            }), false);
        }
        else {
            $inputBtn.value = '处理图片';
        }
    });
}
function insertLoading($sibling) {
    const $loading = document.createElement('div');
    $loading.setAttribute('style', 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");');
    $sibling.parentElement.insertBefore($loading, $sibling);
    return $loading;
}

/**
 * 转换 wiki 模式下 infobox 内容
 * @param originValue
 * @param infoArr
 */
function convertInfoValue(originValue, infoArr) {
    const arr = originValue.trim().split('\n').filter(v => !!v);
    const newArr = [];
    for (const info of infoArr) {
        let isDefault = false;
        for (let i = 0, len = arr.length; i < len; i++) {
            //  |发行日期=  ---> 发行日期
            // [纯假名|] ---> 纯假名
            const m = arr[i].match(/(?:\||\[)(.+?)([|=])/);
            if (!m || m.length < 2)
                continue;
            const n = m[1];
            if (n === info.name) {
                let d = info.value;
                // 处理时间格式
                if (info.category === 'date') {
                    d = dealDate(d);
                }
                // 匹配到 [英文名|]
                if (/\[.+\|\]/.test(arr[i])) {
                    arr[i] = arr[i].replace(']', '') + d + ']';
                }
                else if (/\|.+={/.test(arr[i])) {
                    // |平台={
                    arr[i] = `${arr[i]}\n[${info.value}]`;
                }
                else {
                    // 拼接： |发行日期=2020-01-01
                    arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
                }
                isDefault = true;
                break;
            }
        }
        // 抹去 asin 2020/7/26
        if (!isDefault && info.name && !['asin', 'ASIN'].includes(info.name)) {
            newArr.push(`|${info.name}=${info.value}`);
        }
    }
    arr.pop();
    return [...arr, ...newArr, '}}'].join('\n');
}
/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
function fillInfoBox(wikiData) {
    return __awaiter(this, void 0, void 0, function* () {
        const dict = {
            '誕生日': '生日',
            'スリーサイズ': 'BWH'
        };
        const { infos } = wikiData;
        const subType = +wikiData.subtype;
        const infoArray = [];
        const $typeInput = $qa('table tr:nth-of-type(2) > td:nth-of-type(2) input');
        if ($typeInput) {
            // @ts-ignore
            $typeInput[0].click();
            if (!isNaN(subType)) {
                // @ts-ignore
                $typeInput[subType].click();
            }
        }
        yield sleep(100);
        const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
        const $newbieMode = $q('table small a:nth-of-type(2)[href="javascript:void(0)"]');
        for (let i = 0, len = infos.length; i < len; i++) {
            if (infos[i].category === 'subject_title') {
                let $title = $q('input[name=subject_title]');
                $title.value = (infos[i].value || '').trim();
                continue;
            }
            if (infos[i].category === 'subject_summary') {
                let $summary = $q('#subject_summary');
                $summary.value = (infos[i].value || '').trim();
                continue;
            }
            if (infos[i].category === 'crt_summary') {
                let $t = $q('#crt_summary');
                $t.value = (infos[i].value || '').trim();
                continue;
            }
            if (infos[i].category === 'crt_name') {
                let $t = $q('#crt_name');
                $t.value = (infos[i].value || '').trim();
                continue;
            }
            // 有名称并且category不在特定列表里面
            if (infos[i].name && ['cover', 'crt_cover'].indexOf(infos[i].category) === -1) {
                const name = infos[i].name;
                if (dict.hasOwnProperty(name)) {
                    infoArray.push(Object.assign(Object.assign({}, infos[i]), { name: dict[name] }));
                }
                else {
                    infoArray.push(infos[i]);
                }
            }
        }
        $wikiMode.click();
        yield sleep(200);
        const $infoBox = $q('#subject_infobox');
        $infoBox.value = convertInfoValue($infoBox.value, infoArray);
        yield sleep(200);
        $newbieMode.click();
    });
}
/**
 * 插入控制填表的按钮
 * @param $t 插入按钮的父元素
 * @param cb 填表回调
 * @param cancelCb 清空表单回调
 */
function insertFillFormBtn($t, cb, cancelCb) {
    // 存在节点后，不再插入
    const clx = 'e-wiki-fill-form';
    if ($qa('.' + clx).length >= 2)
        return;
    const $s = document.createElement('span');
    $s.classList.add(clx);
    $s.innerHTML = 'wiki 填表';
    $t.appendChild($s);
    $s.addEventListener('click', cb);
    const $cancel = $s.cloneNode();
    $cancel.innerHTML = '清空';
    $cancel.classList.add(clx + '-cancel');
    $cancel.addEventListener('click', cancelCb);
    $t.appendChild($cancel);
}
function initNewSubject(wikiInfo) {
    const $t = $q('form[name=create_subject] [name=subject_title]').parentElement;
    const defaultVal = $q('#subject_infobox').value;
    insertFillFormBtn($t, (e) => __awaiter(this, void 0, void 0, function* () {
        yield fillInfoBox(wikiInfo);
    }), () => {
        // 清除默认值
        $qa('input[name=platform]').forEach(element => {
            element.checked = false;
        });
        const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
        $wikiMode.click();
        // @ts-ignore
        $q('#subject_infobox').value = defaultVal;
        // @ts-ignore
        $q('#columnInSubjectA [name=subject_title]').value = '';
        // @ts-ignore
        $q('#subject_summary').value = '';
    });
}
function initNewCharacter(wikiInfo) {
    const $t = $q('form[name=new_character] #crt_name').parentElement;
    const defaultVal = $q('#subject_infobox').value;
    insertFillFormBtn($t, (e) => __awaiter(this, void 0, void 0, function* () {
        yield fillInfoBox(wikiInfo);
    }), () => {
        const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
        $wikiMode.click();
        // @ts-ignore
        $q('#subject_infobox').value = defaultVal;
        // @ts-ignore
        $q('#columnInSubjectA #crt_name').value = '';
        // @ts-ignore
        $q('#crt_summary').value = '';
    });
    const coverInfo = wikiInfo.infos
        .filter((item) => item.category === 'crt_cover')[0];
    if (coverInfo && coverInfo.value && coverInfo.value.match(/^data:image/)) {
        dealImageWidget($q('form[name=new_character]'), coverInfo.value);
        // 修改文本
        setTimeout(() => {
            const $input = $q('.e-wiki-cover-container [name=submit]');
            if ($input) {
                $input.value = '添加人物并上传肖像';
            }
        }, 200);
    }
}
function initUploadImg(wikiInfo) {
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
    if (coverInfo && coverInfo.value && coverInfo.value.dataUrl) {
        dealImageWidget($q('form[name=img_upload]'), coverInfo.value.dataUrl);
    }
}

const bangumi = {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
            const page = document.location.href.match(re);
            if (!page)
                return;
            const wikiData = JSON.parse(GM_getValue(WIKI_DATA) || null);
            const charaData = JSON.parse(GM_getValue(CHARA_DATA) || null);
            const autoFill = GM_getValue(AUTO_FILL_FORM);
            switch (page[0]) {
                case 'new_subject':
                    if (wikiData) {
                        initNewSubject(wikiData);
                        if (autoFill == 1) {
                            setTimeout(() => {
                                // @ts-ignore
                                $q('.e-wiki-fill-form').click();
                                GM_setValue(AUTO_FILL_FORM, 0);
                            }, 300);
                        }
                    }
                    break;
                case 'add_related':
                    break;
                case 'character\/new':
                    if (charaData) {
                        initNewCharacter(charaData);
                        if (autoFill == 1) {
                            setTimeout(() => {
                                // @ts-ignore
                                $q('.e-wiki-fill-form').click();
                                GM_setValue(AUTO_FILL_FORM, 0);
                            }, 300);
                        }
                    }
                    break;
                case 'upload_img':
                    if (wikiData) {
                        initUploadImg(wikiData);
                    }
                    break;
            }
        });
    }
};

const erogamescapeModel = {
    key: 'erogamescape',
    description: 'erogamescape',
    host: ['erogamescape.org', 'erogamescape.dyndns.org'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '#soft-title',
        }
    ],
    controlSelector: {
        selector: '#soft-title > span'
    },
    itemList: []
};
erogamescapeModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#soft-title > span',
    },
    category: 'subject_title'
}, {
    name: '开发',
    selector: {
        selector: '#brand a',
    }
}, {
    name: '发行日期',
    selector: {
        selector: '#sellday a',
    },
    category: 'date',
}, {
    name: 'cover',
    selector: {
        selector: '#image_and_basic_infomation img',
    },
    category: 'cover'
}, {
    name: 'website',
    selector: [
        {
            selector: '#links',
            subSelector: 'a',
            keyWord: 'game_OHP'
        },
        {
            selector: '#bottom_inter_links_main',
            subSelector: 'a',
            keyWord: 'game_OHP'
        }
    ],
    category: 'website'
}, {
    name: '原画',
    selector: {
        selector: '#genga > td:last-child',
    },
}, {
    name: '剧本',
    selector: {
        selector: '#shinario > td:last-child',
    },
}, {
    name: '歌手',
    selector: {
        selector: '#kasyu > td:last-child',
    },
});

const getchu = {
    init(siteConfig) {
        // 查找标志性的元素
        const $page = findElement(siteConfig.pageSelectors);
        if (!$page)
            return;
        const protocol = GM_getValue(PROTOCOL) || 'https';
        const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
        const bgmHost = `${protocol}://${bgm_domain}`;
        Array.prototype.forEach.call($qa('h2.chara-name'), (node) => {
            insertControlBtnChara(node.parentElement, (e) => __awaiter(this, void 0, void 0, function* () {
                const charaInfo = getchuTools.getCharacterInfo(e.target);
                console.info('character info list: ', charaInfo);
                const charaData = {
                    type: siteConfig.type,
                    infos: charaInfo
                };
                GM_setValue(CHARA_DATA, JSON.stringify(charaData));
                // @TODO 不使用定时器
                setTimeout(() => {
                    GM_openInTab(`${bgmHost}/character/new`);
                }, 200);
            }));
        });
    }
};

const steamdbModel = {
    key: 'steamdb_game',
    description: 'steamdb',
    host: ['steamdb.info'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.pagehead h1',
        },
    ],
    controlSelector: {
        selector: '.pagehead h1',
    },
    itemList: [],
};
const commonSelector$1 = {
    selector: '.scope-app .app-row table',
    subSelector: 'td',
    sibling: true,
};
const dictArr = [
    {
        name: '发行日期',
        keyWord: 'Release Date',
    },
    {
        name: '开发',
        keyWord: 'Developer',
    },
    {
        name: '发行',
        keyWord: 'Publisher',
    },
];
const configArr$1 = dictArr.map((item) => {
    const r = {
        name: item.name,
        selector: Object.assign({ keyWord: item.keyWord }, commonSelector$1),
    };
    if (item.name === '发行日期') {
        r.category = 'date';
    }
    return r;
});
const detailsTableSelector = {
    selector: '#info table',
    subSelector: 'td',
    sibling: true,
};
const subTableSelector = {
    selector: 'table.web-assets',
    subSelector: 'td',
    sibling: true,
};
steamdbModel.itemList.push({
    name: '游戏名',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'japanese' }) }),
        {
            selector: '.pagehead h1',
        }
    ],
    category: 'subject_title',
}, {
    name: '中文名',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'schinese' }) }),
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'tchinese' }) }),
    ],
}, {
    name: '别名',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'english' }) }),
    ],
    category: 'alias',
}, {
    name: 'cover',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'library_assets', nextSelector: {
                selector: 'table.web-assets',
                subSelector: 'td',
                keyWord: 'library_capsule',
                sibling: true,
                nextSelector: {
                    selector: 'a',
                },
            } }),
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'Web Assets', nextSelector: {
                selector: 'table.web-assets',
                subSelector: 'td > a',
                keyWord: 'library_600x900',
            } }),
    ],
    category: 'cover',
}, ...configArr$1);
steamdbModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
];

const steamModel = {
    key: 'steam_game',
    description: 'steam',
    host: ['store.steampowered.com'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.apphub_AppName',
        },
    ],
    controlSelector: {
        selector: '.apphub_AppName',
    },
    itemList: [],
};
steamModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '.apphub_AppName',
    },
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: {
        selector: '.release_date .date',
    },
    category: 'date',
}, {
    name: '开发',
    selector: {
        selector: '.glance_ctn_responsive_left .user_reviews',
        subSelector: '.dev_row .subtitle',
        keyWord: ['开发商', 'DEVELOPER'],
        sibling: true,
    },
}, {
    name: '发行',
    selector: {
        selector: '.glance_ctn_responsive_left .user_reviews',
        subSelector: '.dev_row .subtitle',
        keyWord: ['发行商', 'PUBLISHER'],
        sibling: true,
    },
}, {
    name: 'website',
    selector: {
        selector: '.responsive_apppage_details_left.game_details',
        subSelector: '.details_block > .linkbar',
        keyWord: ['访问网站', 'Visit the website'],
    },
    category: 'website',
}, {
    name: '游戏简介',
    selector: [
        {
            selector: '#game_area_description',
        },
        {
            selector: '.game_description_snippet',
        },
    ],
    category: 'subject_summary',
}
// {
//   name: 'cover',
//   selector: {
//     selector: '#soft_table .highslide',
//   },
//   category: 'cover',
// }
);
steamModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
];

const configs = {
    [getchuGameModel.key]: getchuGameModel,
    [erogamescapeModel.key]: erogamescapeModel,
    [amazonSubjectModel.key]: amazonSubjectModel,
    [steamdbModel.key]: steamdbModel,
    [steamModel.key]: steamModel,
};
function findModelByHost(host) {
    const keys = Object.keys(configs);
    for (let i = 0; i < keys.length; i++) {
        const hosts = configs[keys[i]].host;
        if (hosts.includes(host)) {
            return configs[keys[i]];
        }
    }
}

function setDomain() {
    bgm_domain = prompt('预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv', 'bgm.tv');
    GM_setValue('bgm', bgm_domain);
    return bgm_domain;
}
function setProtocol() {
    var p = prompt(`预设的 bangumi 页面协议是https 根据需要输入 http`, 'https');
    GM_setValue(PROTOCOL, p);
}
var bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
// if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|bgm\.tv/)) {
//   bgm_domain = setDomain();
//   bgm_domain = GM_getValue(BGM_DOMAIN);
// }
if (GM_registerMenuCommand) {
    GM_registerMenuCommand('\u8bbe\u7f6e\u57df\u540d', setDomain, 'b');
    GM_registerMenuCommand('新建条目页面(http 或者 https)', setProtocol, 'h');
}
// common
const hostArr = [];
Object.keys(configs).forEach((key) => hostArr.push(...configs[key].host));
const siteRe = new RegExp([...hostArr, 'bangumi.tv', 'bgm.tv', 'chii.tv']
    .map((h) => h.replace('.', '\\.'))
    .join('|'));
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const page = document.location.host.match(siteRe);
    if (page) {
        addStyle();
        switch (page[0]) {
            case 'amazon.co.jp':
                initCommon(amazonSubjectModel);
                break;
            case 'getchu.com':
                initCommon(getchuGameModel);
                getchu.init(getchuGameModel);
                break;
            case 'erogamescape.org':
            case 'erogamescape.dyndns.org':
                initCommon(erogamescapeModel);
                break;
            case 'bangumi.tv':
            case 'chii.tv':
            case 'bgm.tv':
                bangumi.init();
                break;
            default:
                const model = findModelByHost(page[0]);
                if (model) {
                    initCommon(model);
                }
        }
    }
});
init();
