// ==UserScript==
// @name        bangumi new wiki helper
// @name:zh-CN  bangumi 创建条目助手
// @namespace   https://github.com/zhifengle
// @description assist to create new subject
// @description:zh-cn 辅助创建 bangumi.tv 上的条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/www\.amazon\.co\.jp\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @match      *://*/*
// @author      zhifengle
// @homepage    https://github.com/zhifengle/bangumi-new-wiki-helper
// @version     0.4.35
// @note        0.4.27 支持音乐条目曲目列表
// @note        0.3.0 使用 typescript 重构，浏览器扩展和脚本使用公共代码
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @resource    NOTYF_CSS https://cdnjs.cloudflare.com/ajax/libs/notyf/3.10.0/notyf.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.0/fuse.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/notyf/3.10.0/notyf.min.js
// ==/UserScript==


let contextDom = null;
function setCtxDom(dom) {
    contextDom = dom;
}
function getCtxDom() {
    return contextDom;
}
function clearCtxDom() {
    setCtxDom(undefined);
}
/**
 * 获取节点文本
 * @param elem
 */
function getText(elem) {
    if (!elem)
        return '';
    if (elem.tagName.toLowerCase() === 'meta') {
        return elem.content;
    }
    if (elem.tagName.toLowerCase() === 'input') {
        return elem.value;
    }
    return elem.textContent || elem.innerText || '';
}
function getInnerText(elem) {
    if (!elem)
        return '';
    return elem.innerText || elem.textContent || '';
}
/**
 * dollar 选择单个
 * @param {string} selector
 */
function $q(selector) {
    const ctxDom = getCtxDom();
    if (ctxDom) {
        return ctxDom.querySelector(selector);
    }
    return document.querySelector(selector);
}
/**
 * dollar 选择所有元素
 * @param {string} selector
 */
function $qa(selector) {
    const ctxDom = getCtxDom();
    if (ctxDom) {
        return ctxDom.querySelectorAll(selector);
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
    if ($parent) {
        $parent = $parent.querySelector(selector.selector);
    }
    else {
        $parent = $q(selector.selector);
    }
    if (!$parent)
        return res;
    const targets = contains(selector.subSelector, selector.keyWord, $parent);
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
            while (targetSelector && !(r = findElement(targetSelector, $parent))) {
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
            if (selector.closest) {
                r = r.closest(selector.closest);
            }
            // recursive
            if (r && selector.nextSelector) {
                const nextSelector = selector.nextSelector;
                r = findElement(nextSelector, r);
            }
        }
    }
    return r;
}
function findAllElement(selector, $parent) {
    var _a, _b;
    let res = [];
    if (selector instanceof Array) {
        let i = 0;
        let targetSelector = selector[i];
        while (targetSelector) {
            const arr = findAllElement(targetSelector, $parent);
            if (arr.length) {
                res.push(...arr);
                break;
            }
            targetSelector = selector[++i];
        }
    }
    else {
        // 没有下一步的选择器
        if (!selector.nextSelector) {
            // 没子选择器
            if (!selector.subSelector) {
                res = Array.from($parent
                    ? $parent.querySelectorAll(selector.selector)
                    : $qa(selector.selector));
            }
            else if (selector.isIframe) {
                const $iframeDoc = (_a = $q(selector.selector)) === null || _a === void 0 ? void 0 : _a.contentDocument;
                res = Array.from($iframeDoc === null || $iframeDoc === void 0 ? void 0 : $iframeDoc.querySelectorAll(selector.subSelector));
            }
            else {
                if (selector.isIframe) {
                    const $iframeDoc = (_b = $q(selector.selector)) === null || _b === void 0 ? void 0 : _b.contentDocument;
                    // iframe 时不需要 keyWord
                    $parent = $iframeDoc === null || $iframeDoc === void 0 ? void 0 : $iframeDoc.querySelector(selector.subSelector);
                }
                else {
                    $parent = $parent ? $parent : $q(selector.selector);
                }
                if (!$parent)
                    return res;
                res = contains(selector.subSelector, selector.keyWord, $parent);
                if (selector.sibling) {
                    res = res.map(($t) => $t.nextElementSibling);
                }
            }
            // closest
            if (selector.closest) {
                res = res.map((r) => r.closest(selector.closest));
            }
        }
        else {
            // 有下一步的选择器时，selector 是用来定位父节点的
            const localSel = Object.assign({}, selector);
            delete localSel.nextSelector;
            const $p = findElement(localSel);
            if ($p) {
                res = findAllElement(selector.nextSelector, $p);
            }
        }
    }
    return res;
}
/**
 * @param {String} HTML 字符串
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    // template.content.childNodes;
    return template.content.firstChild;
}
/**
 * 载入 iframe
 * @param $iframe iframe DOM
 * @param src iframe URL
 * @param TIMEOUT time out
 */
function loadIframe($iframe, src, TIMEOUT = 10000) {
    return new Promise((resolve, reject) => {
        $iframe.src = src;
        let timer = setTimeout(() => {
            timer = null;
            $iframe.onload = undefined;
            reject('iframe timeout');
        }, TIMEOUT);
        $iframe.onload = () => {
            clearTimeout(timer);
            $iframe.onload = null;
            resolve(null);
        };
    });
}
function genAnonymousLinkText(url, text) {
    return `<a
      target="_blank"
      href="${url}"
      rel="noopener noreferrer nofollow">
      ${text}</a>
    `;
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

const getchuGameModel = {
    key: 'getchu_game',
    description: 'Getchu游戏',
    host: ['getchu.com', 'www.getchu.com'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.genretab.current',
            subSelector: 'a',
            keyWord: ['ゲーム', '同人'],
        },
    ],
    controlSelector: [
        {
            selector: '#soft-title',
        },
    ],
    itemList: [],
};
const commonSelector = {
    selector: '#soft_table table',
    subSelector: 'td',
    sibling: true,
};
const dict = {
    定価: '售价',
    発売日: '发行日期',
    ジャンル: '游戏类型',
    ブランド: '开发',
    原画: '原画',
    音楽: '音乐',
    シナリオ: '剧本',
    アーティスト: '主题歌演出',
    作詞: '主题歌作词',
    作曲: '主题歌作曲',
};
const configArr = Object.keys(dict).map((key) => {
    const r = {
        name: dict[key],
        selector: Object.assign({ 
            // 匹配关键字开头 2020/03/18
            keyWord: '^' + key }, commonSelector),
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
    category: 'subject_title',
}, {
    name: 'cover',
    selector: [
        {
            selector: '#soft_table .highslide',
        },
        {
            selector: '#soft_table .highslide img',
        },
    ],
    category: 'cover',
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
            keyWord: '作品紹介',
        },
        {
            selector: '#wrapper',
            subSelector: '.tabletitle',
            sibling: true,
            keyWord: '商品紹介',
        },
    ],
    category: 'subject_summary',
});
getchuGameModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
    {
        name: 'subject_nsfw',
        value: '1',
        category: 'checkbox',
    },
];

// TODO: 区分 kindle 页面和 纸质书页面
const amazonSubjectModel = {
    key: 'amazon_jp_book',
    host: ['amazon.co.jp', 'www.amazon.co.jp'],
    description: '日亚图书',
    type: SubjectTypeId.book,
    pageSelectors: [
        {
            selector: '#nav-subnav .nav-a:first-child',
            subSelector: '.nav-a-content',
            keyWord: ['本', '书', '漫画', 'マンガ', 'Audible'],
        },
        {
            selector: '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
            subSelector: '.a-link-normal',
            keyWord: ['本', '书', '漫画', 'マンガ', 'Audible'],
        },
    ],
    controlSelector: {
        selector: '#title',
    },
    itemList: [],
};
const commonSelectors = [
    // 2021-05 日亚改版
    {
        selector: '#richProductInformation_feature_div',
        subSelector: 'ol.a-carousel li',
    },
    {
        selector: '#detailBullets_feature_div .detail-bullet-list',
        subSelector: 'li .a-list-item',
    },
    {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
    },
];
amazonSubjectModel.itemList.push({
    name: '名称',
    selector: {
        selector: '#productTitle',
    },
    category: 'subject_title',
}, 
// 在 afterGetWikiData 获取封面
// {
//   name: 'cover',
//   selector: [
//     {
//       selector: 'img#igImage',
//     },
//   ],
//   category: 'cover',
// },
{
    name: 'ASIN',
    selector: commonSelectors.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: ['ASIN', 'ISBN-10'] });
    }),
    category: 'ASIN',
}, {
    name: 'ISBN',
    selector: commonSelectors.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: 'ISBN-13' });
    }),
    category: 'ISBN',
    pipes: ['k', 'ta'],
}, {
    name: '发售日',
    selector: commonSelectors.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: ['発売日', '出版日期', '配信日'] });
    }),
    category: 'date',
    pipes: ['ta', 'k', 'p', 'date'],
}, {
    name: '出版社',
    selector: [
        {
            selector: '#bylineInfo',
            subSelector: '.author',
            keyWord: '\\(出版社\\)',
            nextSelector: [
                {
                    selector: '.a-link-normal',
                },
                {
                    selector: 'a',
                },
            ],
        },
        ...commonSelectors.map((s) => {
            return Object.assign(Object.assign({}, s), { keyWord: '出版社' });
        }),
    ],
}, {
    name: '页数',
    selector: commonSelectors.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: ['ページ', '页'] });
    }),
    pipes: ['num'],
}, 
// 有声书
{
    name: '播放时长',
    selector: commonSelectors.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: ['再生時間'] });
    }),
}, {
    name: '演播',
    selector: commonSelectors.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: ['ナレーター'] });
    }),
    pipes: ['ta', 'k'],
}, {
    name: '作者',
    selector: [
        {
            selector: '#bylineInfo',
            subSelector: '.author',
            keyWord: '\\(著\\)',
            nextSelector: [
                {
                    selector: '.contributorNameID',
                },
                {
                    selector: 'a',
                },
            ],
        },
        {
            selector: '#byline .author span.a-size-medium',
        },
        {
            selector: '#bylineInfo .author > a',
        },
        {
            selector: '#bylineInfo .contributorNameID',
        },
    ],
    category: 'creator',
}, {
    name: '插图',
    selector: [
        {
            selector: '#bylineInfo',
            subSelector: '.author',
            keyWord: 'イラスト',
            nextSelector: [
                {
                    selector: '.contributorNameID',
                },
                {
                    selector: 'a',
                },
            ],
        },
    ],
    category: 'creator',
}, {
    name: '价格',
    selector: [
        {
            selector: '#tmmSwatches .a-button-selected .slot-price',
        },
        {
            selector: '#tmm-grid-swatch-OTHER .slot-price',
        },
        {
            selector: '#tmm-grid-swatch-PAPERBACK .slot-price',
        },
        {
            selector: '#tmmSwatches > div > div:last-child .slot-price',
        },
    ],
    pipes: ['ta'],
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
            selector: '#bookDescription_feature_div .a-expander-content',
        },
        {
            selector: '#bookDesc_iframe',
            subSelector: '#iframeContent',
            isIframe: true,
        },
    ],
    category: 'subject_summary',
});

const erogamescapeModel = {
    key: 'erogamescape',
    description: 'erogamescape',
    host: ['erogamescape.org', 'erogamescape.dyndns.org'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '#soft-title',
        },
    ],
    controlSelector: {
        selector: '#soft-title',
    },
    itemList: [],
};
erogamescapeModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#soft-title > span',
    },
    category: 'subject_title',
}, {
    name: '开发',
    selector: {
        selector: '#brand a',
    },
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
    category: 'cover',
}, {
    name: 'website',
    selector: [
        {
            selector: '#links',
            subSelector: 'a',
            keyWord: 'game_OHP',
        },
        {
            selector: '#bottom_inter_links_main',
            subSelector: 'a',
            keyWord: 'game_OHP',
        },
    ],
    category: 'website',
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
erogamescapeModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
    {
        name: 'subject_nsfw',
        value: '1',
        category: 'checkbox',
    },
];

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
        selector: '.pagehead',
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
    {
        name: '游戏引擎',
        keyWord: 'Technologies',
    }
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
const assetsTableSelector = {
    selector: '#js-assets-table',
    subSelector: 'td',
    sibling: true,
};
steamdbModel.itemList.push({
    name: '游戏名',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'japanese' }) }),
        {
            selector: '.pagehead h1',
        },
    ],
    category: 'subject_title',
}, {
    name: '中文名',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'schinese' }) }),
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'name_localized', nextSelector: Object.assign(Object.assign({}, subTableSelector), { keyWord: 'tchinese' }) }),
    ],
    category: 'alias',
}, {
    name: '游戏类型',
    selector: [
        Object.assign(Object.assign({}, detailsTableSelector), { keyWord: 'Primary Genre' })
    ],
    pipes: ['ta', 'p'],
}, {
    name: 'cover',
    selector: [
        Object.assign(Object.assign({}, assetsTableSelector), { keyWord: 'library_assets', nextSelector: {
                selector: 'table.web-assets',
                subSelector: 'td',
                keyWord: 'library_capsule',
                sibling: true,
                nextSelector: {
                    selector: 'a',
                },
            } }),
        Object.assign(Object.assign({}, assetsTableSelector), { keyWord: 'Web Assets', nextSelector: {
                selector: 'table.web-assets',
                subSelector: 'td > a',
                keyWord: 'library_600x900',
            } }),
    ],
    category: 'cover',
}, ...configArr$1, {
    name: '游戏简介',
    selector: [
        {
            selector: '.scope-app .header-description',
        },
        {
            selector: 'head meta[name="description"]',
        },
    ],
    category: 'subject_summary',
});
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
            selector: '.game_description_snippet',
        },
        {
            selector: 'head meta[name="description"]',
        },
        {
            selector: '#game_area_description',
        },
    ],
    category: 'subject_summary',
});
steamModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
];

const dangdangBookModel = {
    key: 'dangdang_book',
    host: ['product.dangdang.com'],
    description: '当当图书',
    type: SubjectTypeId.book,
    pageSelectors: [
        {
            selector: '#breadcrumb',
            subSelector: 'a',
            keyWord: '图书',
        },
    ],
    controlSelector: {
        selector: '.name_info h1',
    },
    itemList: [],
};
const infoSelector = {
    selector: '.messbox_info',
    subSelector: 'span',
};
const descSelector = {
    selector: '#detail_describe',
    subSelector: 'li',
};
dangdangBookModel.itemList.push({
    name: '名称',
    selector: {
        selector: '.name_info h1',
    },
    category: 'subject_title',
}, 
// {
//   name: 'cover',
//   selector: {
//     selector: 'img#largePic',
//   },
//   category: 'cover',
// },
{
    name: 'ISBN',
    selector: Object.assign(Object.assign({}, descSelector), { keyWord: '国际标准书号ISBN' }),
    category: 'ISBN',
}, {
    name: '发售日',
    selector: Object.assign(Object.assign({}, infoSelector), { keyWord: '出版时间' }),
    category: 'date',
}, {
    name: '作者',
    selector: [
        Object.assign(Object.assign({}, infoSelector), { keyWord: '作者' }),
    ],
}, {
    name: '出版社',
    selector: Object.assign(Object.assign({}, infoSelector), { keyWord: '出版社' }),
}, {
    name: '内容简介',
    selector: [
        {
            selector: '#content .descrip',
        },
    ],
    category: 'subject_summary',
});

const jdBookModel = {
    key: 'jd_book',
    host: ['item.jd.com'],
    description: '京东图书',
    type: SubjectTypeId.book,
    pageSelectors: [
        {
            selector: '#crumb-wrap',
            subSelector: '.item > a',
            keyWord: '图书',
        },
    ],
    controlSelector: {
        selector: '#name .sku-name',
    },
    itemList: [],
};
const descSelector$1 = {
    selector: '#parameter2',
    subSelector: 'li',
};
jdBookModel.itemList.push({
    name: '名称',
    selector: {
        selector: '#name .sku-name',
    },
    category: 'subject_title',
}, 
// {
//   name: 'cover',
//   selector: {
//     selector: '#preview img',
//   },
//   category: 'cover',
// },
{
    name: 'ISBN',
    selector: Object.assign(Object.assign({}, descSelector$1), { keyWord: 'ISBN' }),
    category: 'ISBN',
}, {
    name: '发售日',
    selector: Object.assign(Object.assign({}, descSelector$1), { keyWord: '出版时间' }),
    category: 'date',
}, {
    name: '作者',
    selector: [
        {
            selector: '#p-author',
            keyWord: '著',
        },
    ],
}, {
    name: '出版社',
    selector: Object.assign(Object.assign({}, descSelector$1), { keyWord: '出版社' }),
}, {
    name: '内容简介',
    selector: [
        {
            selector: '.book-detail-item',
            subSelector: '.item-mt',
            keyWord: '内容简介',
            sibling: true,
        },
    ],
    category: 'subject_summary',
});

const doubanGameModel = {
    key: 'douban_game',
    description: 'douban game',
    host: ['douban.com', 'www.douban.com'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '#content h1',
        },
    ],
    controlSelector: {
        selector: '#content h1',
    },
    itemList: [],
};
const gameAttr = {
    selector: '#content .thing-attr',
    subSelector: 'dt',
    sibling: true,
};
doubanGameModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#content h1',
    },
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: [
        Object.assign(Object.assign({}, gameAttr), { keyWord: '发行日期' }),
        Object.assign(Object.assign({}, gameAttr), { keyWord: '预计上市时间' }),
    ],
    category: 'date',
}, 
// 平台特殊处理
// {
//   name: '平台',
//   selector: {
//     ...gameAttr,
//     keyWord: '平台',
//   },
//   category: 'platform',
// },
{
    name: '别名',
    selector: Object.assign(Object.assign({}, gameAttr), { keyWord: '别名' }),
    category: 'alias',
}, {
    name: '游戏类型',
    selector: Object.assign(Object.assign({}, gameAttr), { keyWord: '类型' }),
}, {
    name: '开发',
    selector: Object.assign(Object.assign({}, gameAttr), { keyWord: '开发商' }),
}, {
    name: '发行',
    selector: Object.assign(Object.assign({}, gameAttr), { keyWord: '发行商' }),
}, 
// {
//   name: 'website',
//   selector: {
//     selector: '.responsive_apppage_details_left.game_details',
//   },
//   category: 'website',
// },
{
    name: '游戏简介',
    selector: [
        {
            selector: '.mod.item-desc',
            subSelector: 'h2',
            keyWord: '简介',
            sibling: true,
        },
    ],
    category: 'subject_summary',
}, {
    name: 'cover',
    selector: {
        selector: '#content .item-subject-info .pic > a',
    },
    category: 'cover',
});

const doubanGameEditModel = {
    key: 'douban_game_edit',
    description: 'douban game edit',
    host: ['douban.com', 'www.douban.com'],
    urlRules: [/\/game\/\d+\/edit/],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '#content h1',
        },
    ],
    controlSelector: {
        selector: '#content h1',
    },
    itemList: [],
};
const gameAttr$1 = {
    selector: '#thing-modify',
    subSelector: '.thing-item .desc-item .label',
    sibling: true,
};
doubanGameEditModel.itemList.push({
    name: '游戏名',
    selector: [
        Object.assign(Object.assign({}, gameAttr$1), { keyWord: '原名' }),
        Object.assign(Object.assign({}, gameAttr$1), { keyWord: '中文名' }),
    ],
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: [
        Object.assign(Object.assign({}, gameAttr$1), { keyWord: '发行日期' }),
        Object.assign(Object.assign({}, gameAttr$1), { keyWord: '预计上市时间' }),
    ],
    category: 'date',
}, {
    name: '平台',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '平台' }),
    category: 'platform',
}, {
    name: '中文名',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '中文名' }),
    category: 'alias',
}, {
    name: '别名',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '别名' }),
    category: 'alias',
}, {
    name: '游戏类型',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '类型' }),
}, {
    name: '开发',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '开发商' }),
}, {
    name: '发行',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '发行商' }),
}, 
// {
//   name: '游戏简介',
//   selector: [
//     {
//       selector: '#thing_desc_options_0',
//     },
//   ],
//   category: 'subject_summary',
// },
{
    name: 'cover',
    selector: Object.assign(Object.assign({}, gameAttr$1), { keyWord: '图标', nextSelector: {
            selector: 'img',
        } }),
    category: 'cover',
});

const dlsiteGameModel = {
    key: 'dlsite_game',
    description: 'dlsite游戏',
    host: ['dlsite.com', 'www.dlsite.com'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.floorTab-item.type-doujin.is-active',
        },
        {
            selector: '.floorTab-item.type-com.is-active',
        },
    ],
    controlSelector: [
        {
            selector: '#work_name',
        },
    ],
    itemList: [],
};
const commonSelector$2 = {
    selector: '#work_outline',
    subSelector: 'th',
    sibling: true,
};
const arrDict = [
    {
        name: '发行日期',
        key: ['販売日', '贩卖日', '販賣日'],
        categrory: 'date',
    },
    // {
    //   name: '游戏类型',
    //   key: ['ジャンル', '分类'],
    // },
    {
        name: '作者',
        key: ['作者'],
    },
    {
        name: '原画',
        key: ['イラスト', '插画'],
    },
    {
        name: '剧本',
        key: ['シナリオ', '剧情'],
    },
    {
        name: '声优',
        key: ['声優', '声优'],
    },
    {
        name: '音乐',
        key: ['音乐', '音楽'],
    },
];
const configArr$2 = arrDict.map((obj) => {
    const r = {
        name: obj.name,
        selector: Object.assign({ keyWord: obj.key }, commonSelector$2),
    };
    if (obj.categrory) {
        r.category = obj.categrory;
    }
    return r;
});
dlsiteGameModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#work_name',
    },
    category: 'subject_title',
}, {
    // name: '社团名',
    name: '开发',
    selector: [
        {
            selector: '#work_maker .maker_name a',
        },
    ],
}, ...configArr$2, {
    name: 'cover',
    selector: [
        {
            selector: '#work_left  div.slider_body_inner.swiper-container-horizontal > ul > li.slider_item:first-child > picture > img',
        },
    ],
    category: 'cover',
}, {
    name: '游戏简介',
    selector: [
        {
            selector: '.work_parts_container',
            subSelector: '.work_parts_heading',
            keyWord: 'あらすじ',
            sibling: true,
        },
        {
            selector: '#intro-title + div',
        },
    ],
    category: 'subject_summary',
}, {
    name: 'website',
    selector: [
        {
            selector: '#work_name > a',
        },
    ],
    category: 'website',
});
dlsiteGameModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
    {
        name: 'subject_nsfw',
        value: '1',
        category: 'checkbox',
    },
];

const dmmGameModel = {
    key: 'dmm_game',
    description: 'dmm游戏',
    host: ['dlsoft.dmm.co.jp'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.ntgnav-mainItem.is-active',
            subSelector: 'span',
            keyWord: 'ゲーム',
        },
    ],
    controlSelector: [
        {
            selector: 'h1#title',
        },
    ],
    itemList: [],
};
const commonSelector$3 = {
    selector: '.main-area-center .container02 table',
    subSelector: 'tr',
    nextSelector: {
        selector: '.type-right',
    },
};
const contentIframe = {
    selector: '#if_view',
    isIframe: true,
    subSelector: 'body',
};
const arrDict$1 = [
    {
        name: '发行日期',
        key: ['配信開始日'],
        category: 'date',
    },
    {
        name: '游戏类型',
        key: ['ゲームジャンル'],
    },
    {
        name: '原画',
        key: ['原画'],
    },
    {
        name: '剧本',
        key: ['シナリオ', '剧情'],
    },
];
const configArr$3 = arrDict$1.map((obj) => {
    const r = {
        name: obj.name,
        selector: Object.assign({ keyWord: obj.key }, commonSelector$3),
    };
    if (obj.category) {
        r.category = obj.category;
    }
    return r;
});
dmmGameModel.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#title',
    },
    category: 'subject_title',
}, {
    name: '开发',
    selector: [
        {
            selector: '.ranking-and-brand .brand',
            subSelector: 'td',
            keyWord: 'ブランド',
            sibling: true,
        },
    ],
}, ...configArr$3, 
// 部分页面的图片是预览图，不少封面。所以改在 hook 里面，提取图片。
// {
//   name: 'cover',
//   selector: [
//     {
//       ...contentIframe,
//       nextSelector: {
//         selector: '#guide-head > img',
//       },
//     },
//   ],
//   category: 'cover',
// },
{
    name: '游戏简介',
    selector: [
        Object.assign(Object.assign({}, contentIframe), { nextSelector: {
                selector: '#guide-content',
                subSelector: '.guide-capt',
                keyWord: '作品紹介',
                sibling: true,
            } }),
        {
            selector: '.read-text-area .text-overflow',
        },
    ],
    category: 'subject_summary',
});
dmmGameModel.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
    {
        name: 'subject_nsfw',
        value: '1',
        category: 'checkbox',
    },
];

const dlsiteGameCharaModel = {
    key: 'dlsite_game_chara',
    siteKey: 'dlsite_game',
    description: 'dlsite游戏角色',
    host: ['dlsite.com', 'www.dlsite.com'],
    type: SubjectTypeId.game,
    itemSelector: {
        selector: '.work_parts_multiimage_item',
    },
    controlSelector: [
        {
            selector: '.work_parts.type_multiimages *:first-child',
        },
        {
            selector: '#work_name',
        },
    ],
    itemList: [],
};
// 限定父节点
dlsiteGameCharaModel.itemList.push({
    name: 'cover',
    selector: {
        selector: '.image img',
    },
    category: 'crt_cover',
});

const dmmGameCharaModel = {
    key: 'dmm_game_chara',
    siteKey: 'dmm_game',
    description: 'dmm 游戏角色',
    type: SubjectTypeId.game,
    itemSelector: {
        selector: '#if_view',
        isIframe: true,
        subSelector: 'body',
        nextSelector: {
            selector: '.guide-sect .guide-box-chr',
        },
    },
    controlSelector: [
        {
            selector: '#title',
        },
    ],
    itemList: [],
};
// 限定父节点
dmmGameCharaModel.itemList.push({
    name: '姓名',
    selector: {
        selector: '.guide-tx16.guide-bold.guide-lin-hgt',
    },
    category: 'crt_name',
    pipes: ['p', 'ta'],
}, {
    name: 'cover',
    selector: {
        selector: 'img',
    },
    category: 'crt_cover',
});

const adultComicModel = {
    key: 'adultcomic',
    description: 'adultcomic',
    host: ['adultcomic.dbsearch.net'],
    type: SubjectTypeId.book,
    pageSelectors: [
        {
            selector: '#pankuz > ol > li:nth-child(1) > a[href*="adultcomic.dbsearch.net"]',
        },
    ],
    controlSelector: [
        {
            selector: '#h2-icon-bk',
        },
        {
            selector: 'h2-icon-wk',
        },
    ],
    itemList: [],
};
const commonSelectors$1 = [
    {
        selector: '#info-table > div.info-box > dl',
        subSelector: 'dt',
        sibling: true,
    },
];
const genSelectors = (keyWord) => commonSelectors$1.map((s) => {
    return Object.assign(Object.assign({}, s), { keyWord });
});
adultComicModel.itemList.push({
    name: '名称',
    selector: {
        selector: '#h2-icon-bk',
    },
    category: 'subject_title',
}, 
// 图片使用的懒加载. 在 hook 里面读取 data-src
{
    name: 'cover',
    selector: [
        {
            selector: '#sample-image > figure > a',
        },
        {
            selector: '#info-table > .img-box > img',
        },
    ],
    category: 'cover',
}, {
    name: 'ISBN',
    selector: genSelectors('ISBN'),
    category: 'ISBN',
}, {
    name: '发售日',
    selector: genSelectors('発売日'),
    category: 'date',
    pipes: ['k', 'date'],
}, {
    name: '出版社',
    selector: genSelectors('出版社'),
}, {
    name: '书系',
    selector: genSelectors(['レーベル']),
}, {
    name: '页数',
    selector: genSelectors(['ページ']),
    pipes: ['num'],
}, {
    name: '作者',
    selector: [
        {
            selector: '#info-table > div.info-box .author-list > li',
        },
        ...genSelectors('漫画家'),
    ],
    category: 'creator',
}, {
    name: '价格',
    selector: genSelectors('本体価格'),
}, {
    name: '内容简介',
    selector: [
        {
            selector: '#comment-clist > .iteminfo-box',
            subSelector: 'h4',
            sibling: true,
            keyWord: ['内容紹介'],
        },
    ],
    category: 'subject_summary',
});

const moepedia = {
    key: 'moepedia',
    description: 'moepedia.net',
    host: ['moepedia.net'],
    type: SubjectTypeId.game,
    pageSelectors: [
        {
            selector: '.gme-Contents > .gme-Body',
        },
    ],
    controlSelector: [
        {
            selector: '.body-top_info_title > h2',
        },
    ],
    itemList: [],
};
const topTableSelector = {
    selector: 'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > table',
    subSelector: 'tr > th',
    sibling: true,
};
const middleTableSelector = {
    selector: 'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-middle',
    subSelector: 'tr > th',
    sibling: true,
};
moepedia.itemList.push({
    name: '游戏名',
    selector: {
        selector: 'div.gme-Contents h2',
    },
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: [
        Object.assign(Object.assign({}, topTableSelector), { keyWord: '発売日' }),
    ],
    pipes: ['date'],
}, {
    name: '售价',
    selector: [
        Object.assign(Object.assign({}, topTableSelector), { keyWord: '価格' }),
    ],
    pipes: ['p'],
}, {
    name: 'website',
    selector: [
        {
            selector: 'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > div > a',
        },
    ],
    category: 'website',
}, {
    name: 'cover',
    selector: [
        {
            selector: 'div.gme-Contents div.body-top > div.body-top_image img',
        },
    ],
    category: 'cover',
}, {
    name: '原画',
    selector: Object.assign(Object.assign({}, middleTableSelector), { keyWord: ['原画'] }),
}, {
    name: '开发',
    selector: Object.assign(Object.assign({}, middleTableSelector), { keyWord: ['ブランド'] }),
}, {
    name: '剧本',
    selector: Object.assign(Object.assign({}, middleTableSelector), { keyWord: ['シナリオ'] }),
}, {
    name: '游戏类型',
    selector: Object.assign(Object.assign({}, middleTableSelector), { keyWord: ['ジャンル'] }),
}, {
    name: '音乐',
    selector: Object.assign(Object.assign({}, middleTableSelector), { keyWord: ['音楽'] }),
}, {
    name: '主题歌演唱',
    selector: Object.assign(Object.assign({}, middleTableSelector), { keyWord: ['歌手'] }),
});
moepedia.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
    {
        name: 'subject_nsfw',
        value: '1',
        category: 'checkbox',
    },
];

// ref links
// https://vgmdb.net/album/9683
// https://vgmdb.net/album/134285
// https://vgmdb.net/album/122607
// https://vgmdb.net/album/86808
const vgmdbModel = {
    key: 'vgmdb',
    description: 'vgmdb',
    host: ['vgmdb.net'],
    type: SubjectTypeId.music,
    pageSelectors: [
        {
            selector: '#innermain > h1',
        },
    ],
    controlSelector: {
        selector: '#innermain > h1',
    },
    itemList: [],
};
const commonSelectors$2 = {
    selector: '#album_infobit_large',
    subSelector: 'tr > td:first-child',
    sibling: true,
};
const creditsSelectors = {
    selector: '#collapse_credits table',
    subSelector: 'tr > td:first-child',
    sibling: true,
};
vgmdbModel.itemList.push(
// afterGetWikiData 里面
// {
//   name: '唱片名',
//   selector: {
//     selector: '#innermain > h1 > [lang=ja]',
//   },
//   category: 'subject_title',
// },
{
    name: '录音',
    selector: [
        Object.assign(Object.assign({}, commonSelectors$2), { keyWord: 'Organizations' }),
    ],
}, 
/*
{
  name: '目录编号',
  selector: [
    {
      ...commonSelectors,
      keyWord: 'Catalog Number',
    },
  ],
  pipes: ['t']
},
*/
{
    name: '条形码',
    selector: [
        Object.assign(Object.assign({}, commonSelectors$2), { keyWord: 'Barcode' }),
    ],
    pipes: ['t']
}, {
    name: '发售日期',
    selector: [
        Object.assign(Object.assign({}, commonSelectors$2), { keyWord: 'Release Date', nextSelector: {
                selector: 'a',
            } }),
    ],
    pipes: ['date']
}, {
    name: '价格',
    selector: [
        Object.assign(Object.assign({}, commonSelectors$2), { keyWord: 'Price' }),
    ],
}, {
    name: '版本特性',
    selector: [
        Object.assign(Object.assign({}, commonSelectors$2), { keyWord: 'Media Format' }),
    ],
}, {
    name: '播放时长',
    selector: [
        {
            selector: '#tracklist',
            subSelector: 'span.smallfont',
            sibling: true,
            keyWord: 'Total length',
        },
        {
            selector: '#tracklist',
            subSelector: 'span.smallfont',
            sibling: true,
            keyWord: 'Disc length',
        },
    ],
}, {
    name: '艺术家',
    selector: [
        Object.assign(Object.assign({}, creditsSelectors), { keyWord: ['Performer', 'Vocalist'] }),
    ],
    pipes: ['ti'],
}, {
    name: '作曲',
    selector: [
        Object.assign(Object.assign({}, creditsSelectors), { keyWord: 'Composer' }),
    ],
    pipes: ['ti'],
}, {
    name: '作词',
    selector: [
        Object.assign(Object.assign({}, creditsSelectors), { keyWord: ['Lyricist', 'Lyrics'] }),
    ],
    pipes: ['ti'],
}, {
    name: '编曲',
    selector: [
        Object.assign(Object.assign({}, creditsSelectors), { keyWord: 'Arranger' }),
    ],
    pipes: ['ti'],
});

// ref links
// https://www.amazon.co.jp/dp/B07FQ5WPM3/
// https://www.amazon.co.jp/dp/B0D456FXL4
// https://www.amazon.co.jp/dp/B07GQXDHLN
const amazonJpMusicModel = {
    key: 'amazon_jp_music',
    description: 'amazon jp music',
    host: ['amazon.co.jp', 'www.amazon.co.jp'],
    type: SubjectTypeId.music,
    pageSelectors: [
        {
            selector: '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
            subSelector: '.a-link-normal',
            keyWord: ['ミュージック', 'Music', 'MUSIC', '音楽'],
        },
        {
            selector: '#nav-subnav .nav-a:first-child img[alt="デジタルミュージック"]',
        },
        {
            selector: '#detailBullets_feature_div + .a-unordered-list',
            subSelector: '.a-list-item',
            keyWord: ['ミュージック', '音楽'],
        },
    ],
    controlSelector: {
        selector: '#title',
    },
    itemList: [],
};
const commonSelectors$3 = [
    // 2021-05 日亚改版
    {
        selector: '#richProductInformation_feature_div',
        subSelector: 'ol.a-carousel li',
    },
    {
        selector: '#detailBullets_feature_div .detail-bullet-list',
        subSelector: 'li .a-list-item',
    },
    {
        selector: '#detail_bullets_id .bucket .content',
        subSelector: 'li',
    },
];
amazonJpMusicModel.itemList.push({
    name: '名称',
    selector: {
        selector: '#productTitle',
    },
    category: 'subject_title',
}, {
    name: '艺术家',
    selector: [
        {
            selector: '#bylineInfo',
            subSelector: '.author',
            keyWord: '\\(アーティスト\\)',
            nextSelector: [
                {
                    selector: '.contributorNameID',
                },
                {
                    selector: 'a',
                },
            ],
        },
        {
            selector: '#byline .author span.a-size-medium',
        },
        {
            selector: '#bylineInfo .author > a',
        },
        {
            selector: '#bylineInfo .contributorNameID',
        },
    ],
    category: 'creator',
    pipes: ['k'],
}, {
    name: '碟片数量',
    selector: commonSelectors$3.map((s) => {
        return Object.assign(Object.assign({}, s), { keyWord: ['ディスク枚数'] });
    }),
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
            selector: '#productDescription',
        },
    ],
    category: 'subject_summary',
}, {
    name: '价格',
    selector: [
        {
            selector: '#corePrice_feature_div > div > div > span.a-price.aok-align-center > span.a-offscreen',
        },
        {
            selector: '#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen',
        },
        {
            selector: '#declarative_ > table > tbody > tr > td.a-text-right.dp-new-col > span > a > span',
        },
    ],
});

// ref links
// https://music.douban.com/subject/36072428/
// https://music.douban.com/subject/34956124/
const doubanMusicModel = {
    key: 'douban_music',
    description: 'douban music',
    host: ['music.douban.com'],
    type: SubjectTypeId.music,
    pageSelectors: [
        {
            selector: '#db-nav-music',
        },
    ],
    controlSelector: {
        selector: '#wrapper h1',
    },
    itemList: [],
};
doubanMusicModel.itemList.push({
    name: '音乐名',
    selector: {
        selector: '#wrapper h1',
    },
    category: 'subject_title',
}, 
// textNode silbing 暂时不支持
/*
{
  name: '发售日期',
  selector: [
    {
      ...attr,
      keyWord: '发行时间',
    },
  ],
  category: 'date',
},
{
  name: '艺术家',
  selector: [
    {
      ...attr,
      keyWord: '表演者',
    }
  ]
},
{
  name: '流派',
  selector: {
    ...attr,
    keyWord: '流派',
  },
},
{
  name: '别名',
  selector: {
    ...attr,
    keyWord: '又名',
  },
  category: 'alias',
},
{
  name: '版本特性',
  selector: {
    ...attr,
    keyWord: '介质',
  },
},
{
  name: '碟片数量',
  selector: {
    ...attr,
    keyWord: '唱片数',
  },
},
{
  name: '厂牌',
  selector: {
    ...attr,
    keyWord: '出版者',
  },
},
*/
{
    name: '音乐简介',
    selector: [
        {
            selector: '.related_info',
            subSelector: 'h2',
            keyWord: '简介',
            sibling: true,
        },
    ],
    category: 'subject_summary',
}, {
    name: 'cover',
    selector: {
        selector: '#mainpic > span > a > img',
    },
    category: 'cover',
});

// 新增的 site model 需要在这里配置
const configs = {
    [getchuGameModel.key]: getchuGameModel,
    [erogamescapeModel.key]: erogamescapeModel,
    [amazonSubjectModel.key]: amazonSubjectModel,
    [steamdbModel.key]: steamdbModel,
    [steamModel.key]: steamModel,
    [dangdangBookModel.key]: dangdangBookModel,
    [jdBookModel.key]: jdBookModel,
    [doubanGameModel.key]: doubanGameModel,
    [doubanGameEditModel.key]: doubanGameEditModel,
    [dlsiteGameModel.key]: dlsiteGameModel,
    [dmmGameModel.key]: dmmGameModel,
    [adultComicModel.key]: adultComicModel,
    [moepedia.key]: moepedia,
    [vgmdbModel.key]: vgmdbModel,
    [amazonJpMusicModel.key]: amazonJpMusicModel,
    [doubanMusicModel.key]: doubanMusicModel,
};
const charaModelDict = {
    [dlsiteGameCharaModel.key]: dlsiteGameCharaModel,
    [dmmGameCharaModel.key]: dmmGameCharaModel,
};
function findModelByHost(host) {
    const keys = Object.keys(configs);
    const models = [];
    for (let i = 0; i < keys.length; i++) {
        const hosts = configs[keys[i]].host;
        if (hosts.includes(host)) {
            models.push(configs[keys[i]]);
            // return configs[keys[i]];
        }
    }
    return models;
}
function getCharaModel(key) {
    const keys = Object.keys(charaModelDict);
    const targetKey = keys.find((k) => { var _a; return ((_a = charaModelDict[k]) === null || _a === void 0 ? void 0 : _a.siteKey) == key; });
    if (!targetKey)
        return null;
    return charaModelDict[targetKey];
}

// support GM_XMLHttpRequest
function fetchInfo(url, type, opts = {}, TIMEOUT = 10 * 1000) {
    var _a;
    const method = ((_a = opts === null || opts === void 0 ? void 0 : opts.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'GET';
    // @ts-ignore
    {
        const gmXhrOpts = Object.assign({}, opts);
        if (method === 'POST' && gmXhrOpts.body) {
            gmXhrOpts.data = gmXhrOpts.body;
        }
        if (opts.decode) {
            type = 'arraybuffer';
        }
        return new Promise((resolve, reject) => {
            // @ts-ignore
            GM_xmlhttpRequest(Object.assign({ method, timeout: TIMEOUT, url, responseType: type, onload: function (res) {
                    if (res.status === 404) {
                        reject(404);
                    }
                    if (opts.decode && type === 'arraybuffer') {
                        let decoder = new TextDecoder(opts.decode);
                        resolve(decoder.decode(res.response));
                    }
                    else {
                        resolve(res.response);
                    }
                }, onerror: reject }, gmXhrOpts));
        });
    }
}
function fetchBinary(url, opts = {}) {
    return fetchInfo(url, 'blob', opts);
}
function fetchText(url, opts = {}, TIMEOUT = 10 * 1000) {
    return fetchInfo(url, 'text', opts, TIMEOUT);
}
function fetchJson(url, opts = {}) {
    return fetchInfo(url, 'json', opts);
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
    const components = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
    };
    // Replace year
    fmt = fmt.replace(/(y+)/i, (_, yearMatch) => (date.getFullYear() + '').slice(4 - yearMatch.length));
    // Replace other components
    for (const [key, value] of Object.entries(components)) {
        fmt = fmt.replace(new RegExp(`(${key})`, 'i'), (_, match) => match.length === 1 ? value.toString() : String(value).padStart(match.length, '0'));
    }
    return fmt;
}
function dealDate(input) {
    // Regular expressions to match various date formats
    const regexPatterns = [
        { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日?/, format: '$1-$2-$3' },
        { pattern: /(\d{4})年(\d{1,2})月/, format: '$1-$2' },
        { pattern: /(\d{4})[/-](\d{1,2})$/, format: '$1-$2' },
        { pattern: /.*?(\d{4})\/(\d{1,2})\/(\d{1,2}).*?/, format: '$1-$2-$3' },
    ];
    for (const { pattern, format } of regexPatterns) {
        const match = input.replace(/\s/g, '').match(pattern);
        if (match) {
            return format.replace(/\$(\d+)/g, (_, number) => String(match[number]).padStart(2, '0'));
        }
    }
    // input is not a valid date
    if (isNaN(Date.parse(input))) {
        return input;
    }
    return formatDate(input);
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

const pipeFnDict = {
    // t: 去除开头和结尾的空格
    t: trimSpace,
    // ta: 去除所有空格
    ta: trimAllSpace,
    // ti: 去除空格，在 getWikiItem 里面，使用 innerText 取文本
    ti: trimSpace,
    // k: 去除关键字;
    k: trimKeywords,
    // p: 括号
    p: trimParenthesis,
    // pn: 括号不含数字
    pn: trimParenthesisN,
    // num: 提取数字
    num: getNum,
    date: getDate,
};
function getStr(pipe) {
    return (pipe.out || pipe.rawInfo).trim();
}
function trim(pipe, textList) {
    let str = getStr(pipe);
    return Object.assign(Object.assign({}, pipe), { out: str.replace(new RegExp(textList.join('|'), 'g'), '') });
}
function trimAllSpace(pipe) {
    let str = getStr(pipe);
    return Object.assign(Object.assign({}, pipe), { out: str.replace(/\s/g, '') });
}
function trimSpace(pipe) {
    let str = getStr(pipe);
    return Object.assign(Object.assign({}, pipe), { out: str.trim() });
}
function trimParenthesis(pipe) {
    const textList = ['\\(.*?\\)', '（.*?）'];
    // const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
    return trim(pipe, textList);
}
// 保留括号里面的数字. 比如一些图书的 1 2 3
function trimParenthesisN(pipe) {
    // const textList = ['\\(.*?\\)', '（.*?）'];
    const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
    return trim(pipe, textList);
}
function trimKeywords(pipe, keyWords) {
    return trim(pipe, keyWords.map((k) => `${k}\s*?(:|：)?`));
}
function getNum(pipe) {
    let str = getStr(pipe);
    const m = str.match(/\d+/);
    return {
        rawInfo: pipe.rawInfo,
        out: m ? m[0] : '',
    };
}
function getDate(pipe) {
    let dataStr = getStr(pipe);
    return {
        rawInfo: pipe.rawInfo,
        out: dealDate(dataStr),
    };
}
/**
 *
 * @param str 原字符串
 * @param pipes 管道
 * @returns 处理后的字符串
 */
function dealTextByPipe(str, pipes, argsDict = {}) {
    let current = { rawInfo: str };
    pipes = pipes || [];
    for (const p of pipes) {
        if (p instanceof Function) {
            // @TODO 支持传递参数
            current = p(current);
        }
        else {
            if (argsDict[p]) {
                current = pipeFnDict[p](current, ...argsDict[p]);
            }
            else {
                current = pipeFnDict[p](current);
            }
        }
    }
    return current.out || str;
}

const adultComicTools = {
    hooks: {
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                let newInfo = Object.assign({}, info);
                if (info.name === '作者') {
                    const lists = document.querySelectorAll('#info-table > div.info-box .author-list > li');
                    if (lists && lists.length > 1) {
                        newInfo.value = Array.from(lists)
                            .map((node) => node.textContent.trim())
                            .join(', ');
                    }
                }
                if (newInfo) {
                    res.push(Object.assign({}, newInfo));
                }
            }
            // getCover 判断 data-src。这里就禁用了
            // const $img = document.querySelector('#sample-image > figure > img');
            // if ($img) {
            //   const info: SingleInfo = {
            //     category: 'cover',
            //     name: 'cover',
            //     value: {
            //       url: $img.getAttribute('data-src'),
            //       dataUrl: $img.getAttribute('data-src'),
            //     },
            //   };
            //   res.push(info);
            // }
            return res;
        },
    },
};

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
function getImageDataByURL(url, opts = {}) {
    if (!url)
        return Promise.reject('invalid img url');
    return new Promise(async (resolve, reject) => {
        try {
            const blob = await fetchBinary(url, opts);
            var reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };
            reader.readAsDataURL(blob);
            reader.onerror = reject;
        }
        catch (e) {
            reject(e);
        }
    });
}
/**
 * convert to img Element to base64 string
 * @param $img
 */
function convertImgToBase64($img) {
    const canvas = document.createElement('canvas');
    canvas.width = $img.width;
    canvas.height = $img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage($img, 0, 0, $img.width, $img.height);
    const dataURL = canvas.toDataURL('image/png');
    return dataURL;
}

const amazonUtils = {
    dealTitle(str) {
        str = str.trim().split('\n')[0].trim();
        // str = str.split(/\s[(（][^0-9)）]+?[)）]/)[0]
        // 去掉尾部括号的内容, (1) （1） 这类不处理
        const textList = [
            '\\([^0-9]+?\\)$',
            '（[^0-9]+?）$',
            '\\(.+?\\d+.+?\\)$',
            '（.+?\\d+.+?）$',
        ]; // 去掉多余的括号信息
        str = str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
        // return str.replace(/\s[(（][^0-9)）]+?[)）]$/g, '').trim();
        return str;
    },
    // 获取 URL 的 dp
    getUrlDp(str) {
        const m = str.match(/\/dp\/(.*?)\//);
        if (m) {
            return m[1];
        }
        return '';
    },
};
const amazonJpBookTools = {
    filters: [
        {
            category: 'subject_title',
            dealFunc: amazonUtils.dealTitle,
        },
    ],
    hooks: {
        async beforeCreate() {
            const $t = document.querySelector('#title');
            const bookTypeList = document.querySelectorAll('#tmmSwatches ul > li.swatchElement');
            const books = document.querySelectorAll('#tmmSwatches > .a-row div');
            if ($t &&
                ((bookTypeList && bookTypeList.length > 1) ||
                    (books && books.length > 1))) {
                const $div = document.createElement('div');
                const $s = document.createElement('span');
                $s.style.color = 'red';
                $s.style.fontWeight = '600';
                $s.innerHTML = '注意: ';
                const $txt = document.createElement('span');
                $txt.innerHTML =
                    '书籍存在多种版本，请优先选择实体书创建。(辅助创建脚本)';
                $div.appendChild($s);
                $div.appendChild($txt);
                $div.style.padding = '6px 0';
                $t.insertAdjacentElement('afterend', $div);
                // 没有简介时，使用 kindle 版本的介绍
                const $desc = document.querySelector('#bookDescription_feature_div .a-expander-content');
                if (!$desc) {
                    const btns = document.querySelectorAll('#tmmSwatches ul > li.swatchElement .a-button-text');
                    if (btns && btns.length) {
                        const url = Array.from(btns)
                            .map((a) => a.href)
                            .filter((h) => h.match(/^http/))[0];
                        if (url) {
                            return {
                                payload: {
                                    auxSite: {
                                        url,
                                        prefs: {
                                            originNames: ['ISBN', '名称'],
                                        },
                                    },
                                },
                            };
                        }
                    }
                }
            }
            return true;
        },
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                let newInfo = Object.assign({}, info);
                if (info.name === '页数') {
                    let val = (info.value || '').trim().replace(/ページ|页/, '');
                    if (val && val.length < 8 && val.indexOf('予約商品') === -1) {
                        newInfo.value = val;
                    }
                    else {
                        newInfo = null;
                    }
                }
                else if (info.name === '播放时长') {
                    newInfo.value = info.value.replace('時間', '小时').replace(/ /g, '');
                }
                else if (info.name === '价格') {
                    let val = (info.value || '').replace(/来自|より/, '').trim();
                    newInfo.value = val;
                }
                if (newInfo) {
                    res.push(Object.assign({}, newInfo));
                }
            }
            const $cover = document.querySelector('#imgTagWrapperId>img');
            if ($cover && !res.find((obj) => obj.name === 'cover')) {
                let url = '';
                if ($cover.hasAttribute('data-old-hires')) {
                    url = $cover.getAttribute('data-old-hires');
                }
                else if ($cover.hasAttribute('data-a-dynamic-image')) {
                    try {
                        const obj = JSON.parse($cover.getAttribute('data-a-dynamic-image'));
                        const urlArr = Object.keys(obj).sort().reverse();
                        if (urlArr && urlArr.length > 0) {
                            url = urlArr[0];
                        }
                    }
                    catch (error) { }
                }
                // 如果还是没有图片链接
                if (!url) {
                    url = $cover.src;
                }
                let dataUrl = url;
                try {
                    if (url) {
                        dataUrl = await getImageDataByURL(url);
                    }
                }
                catch (error) { }
                const info = {
                    category: 'cover',
                    name: 'cover',
                    value: {
                        url,
                        dataUrl,
                    },
                };
                res.push(info);
            }
            return res;
        },
    },
};
async function getCoverInfo(res) {
    const $cover = document.querySelector('#imgTagWrapperId>img');
    if ($cover && !res.find((obj) => obj.name === 'cover')) {
        let url = '';
        if ($cover.hasAttribute('data-old-hires')) {
            url = $cover.getAttribute('data-old-hires');
        }
        else if ($cover.hasAttribute('data-a-dynamic-image')) {
            try {
                const obj = JSON.parse($cover.getAttribute('data-a-dynamic-image'));
                const urlArr = Object.keys(obj).sort().reverse();
                if (urlArr && urlArr.length > 0) {
                    url = urlArr[0];
                }
            }
            catch (error) { }
        }
        // 如果还是没有图片链接
        if (!url) {
            url = $cover.src;
        }
        let dataUrl = url;
        try {
            if (url) {
                dataUrl = await getImageDataByURL(url);
            }
        }
        catch (error) { }
        const info = {
            category: 'cover',
            name: 'cover',
            value: {
                url,
                dataUrl,
            },
        };
        return info;
    }
}
const amazonJpMusicTools = {
    hooks: {
        async afterGetWikiData(infos) {
            const res = [];
            for (const item of infos) {
                if (item.name === '艺术家') {
                    item.value = item.value.replace(/\//g, '、');
                }
                res.push(item);
            }
            const date = document.querySelector('#declarative_ .title-text > span');
            if (date) {
                const m = date.innerHTML.trim().match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                if (m) {
                    res.push({
                        name: '发售日期',
                        value: `${m[1]}-${m[2]}-${m[3]}`,
                    });
                }
            }
            const coverInfo = await getCoverInfo(res);
            if (coverInfo) {
                res.push(coverInfo);
            }
            const $tracks = document.querySelector('#music-tracks');
            if ($tracks) {
                const discArr = [...$tracks.querySelectorAll('h4 + .a-row table')].map((table) => {
                    return [...table.querySelectorAll('tr > td:nth-child(2)')].map((td) => {
                        return {
                            title: td.innerHTML.trim(),
                        };
                    });
                });
                res.push({
                    category: 'ep',
                    // 名字留空
                    name: '',
                    value: discArr,
                });
            }
            return res;
        },
    },
};

const dlsiteTools = {
    hooks: {
        async afterGetWikiData(infos) {
            var _a;
            const res = [];
            for (const info of infos) {
                let val = info.value;
                if (val &&
                    typeof val === 'string' &&
                    !/http/.test(val) &&
                    ['原画', '剧本', '音乐', '游戏类型', '声优', '作者'].includes(info.name)) {
                    const v = info.value.split('/');
                    if (v && v.length > 1) {
                        val = v.map((s) => s.trim()).join(', ');
                    }
                }
                res.push(Object.assign(Object.assign({}, info), { value: val }));
            }
            if (location.hostname.includes('dlsite.com')) {
                res.push({
                    name: 'website',
                    value: `DLsite|${location.origin + location.pathname}`,
                    category: 'listItem',
                });
            }
            const cover = infos.find((obj) => obj.name === 'cover');
            if (!cover) {
                let url = (_a = document.querySelector('meta[property="og:image"]')) === null || _a === void 0 ? void 0 : _a.content;
                if (url) {
                    let dataUrl = url;
                    try {
                        if (url) {
                            dataUrl = await getImageDataByURL(url, {
                                headers: {
                                    Referer: url,
                                },
                            });
                        }
                    }
                    catch (error) { }
                    res.push({
                        category: 'cover',
                        name: 'cover',
                        value: {
                            url,
                            dataUrl,
                        },
                    });
                }
            }
            return res;
        },
    },
    filters: [
        {
            category: 'date',
            dealFunc(str) {
                if (/年/.test(str)) {
                    return dealDate(str.replace(/日.+$/, '日'));
                }
                return str;
            },
        },
    ],
};
const dlsiteCharaTools = {
    hooks: {
        async afterGetWikiData(infos, model, el) {
            var _a;
            const res = [...infos];
            const txt = ((_a = el.querySelector('p')) === null || _a === void 0 ? void 0 : _a.textContent) || '';
            res.push({
                name: '姓名',
                value: txt.split('\n')[0],
                category: 'crt_name',
            });
            res.push({
                name: 'CV',
                value: (txt.split('\n').find((s) => s.includes('CV')) || '')
                    .replace('CV:', '')
                    .trim(),
            });
            let idx = txt.indexOf('\n\n');
            if (idx === -1) {
                idx = 0;
            }
            else {
                idx = idx + 2;
            }
            res.push({
                name: '人物简介',
                value: txt.slice(idx),
                category: 'crt_summary',
            });
            return res;
        },
    },
};

async function getCover($d, site) {
    let url;
    let dataUrl = '';
    if ($d.tagName.toLowerCase() === 'a') {
        url = $d.getAttribute('href');
    }
    else if ($d.tagName.toLowerCase() === 'img') {
        url = $d.getAttribute('src');
        const dataSrc = $d.getAttribute('data-src');
        if (dataSrc) {
            url = dataSrc;
        }
    }
    if (!url)
        return;
    try {
        // 在其它网站上获取的相对路径的链接
        // @TODO 这里临时使用的全局变量来处理
        if (!/^https?:/.test(url)) {
            let baseUrl = window._fetch_url_bg || location.href;
            url = new URL(url, baseUrl).href;
        }
        // 跨域的图片不能用这种方式
        // dataUrl = convertImgToBase64($d as any);
        let opts = {};
        if (site.includes('getchu')) {
            opts.headers = {
                Referer: location.href,
            };
            if (!location.href.includes('getchu.com') && window._fetch_url_bg) {
                opts.headers.Referer = window._fetch_url_bg;
            }
        }
        dataUrl = await getImageDataByURL(url, opts);
        if (dataUrl) {
            return {
                url,
                dataUrl,
            };
        }
    }
    catch (error) {
        return {
            url,
            dataUrl: url,
        };
    }
}
const charaInfoDict = {
    趣味: '爱好',
    誕生日: '生日',
    '3サイズ': 'BWH',
    スリーサイズ: 'BWH',
    身長: '身高',
    血液型: '血型',
};

const dmmTools = {
    hooks: {
        async afterGetWikiData(infos) {
            var _a;
            const res = [];
            const hasCover = infos.some((info) => info.category == 'cover');
            for (const info of infos) {
                let val = info.value;
                res.push(Object.assign(Object.assign({}, info), { value: val }));
            }
            if (!hasCover) {
                // 使用 slider 里面的第一个图片
                const slides = $qa('.image-slider.slick-slider li.slick-slide');
                if (slides) {
                    let url;
                    let dataUrl = '';
                    const targetSlide = Array.from(slides).find((slide) => slide.dataset.slickIndex === '0');
                    url = (_a = targetSlide.querySelector('img')) === null || _a === void 0 ? void 0 : _a.getAttribute('src');
                    if (url) {
                        try {
                            dataUrl = await getImageDataByURL(url);
                        }
                        catch (error) {
                            dataUrl = url;
                        }
                        res.push({
                            name: 'cover',
                            category: 'cover',
                            value: {
                                url,
                                dataUrl,
                            },
                        });
                    }
                }
                else {
                    const coverInfo = await getWikiItem({
                        name: 'cover',
                        selector: [
                            {
                                selector: '#if_view',
                                isIframe: true,
                                subSelector: 'body',
                                nextSelector: {
                                    selector: '#guide-head > img',
                                },
                            },
                        ],
                        category: 'cover',
                    }, 'dmm_game');
                    coverInfo && res.push(coverInfo);
                }
            }
            return res;
        },
    },
    filters: [
        {
            category: 'date',
            dealFunc(str) {
                const re = /\d{4}\/\d{1,2}(\/\d{1,2})?/;
                const m = str.match(re);
                if (m) {
                    return dealDate(m[0]);
                }
                return str;
            },
        },
    ],
};
const dmmCharaTools = {
    hooks: {
        async afterGetWikiData(infos, model, $el) {
            const res = [...infos];
            const $nameTxt = $el.querySelector('.guide-tx16.guide-bold.guide-lin-hgt');
            if ($nameTxt) {
                // （きのみや なのか）
                const nameTxt = $nameTxt.textContent;
                if (nameTxt.match(/（(.*)）/)) {
                    res.push({
                        name: '纯假名',
                        value: nameTxt.match(/（(.*)）/)[1],
                    });
                }
                const cvTxt = $nameTxt.nextSibling.textContent;
                if (/CV/.test(cvTxt)) {
                    res.push({
                        name: 'CV',
                        value: cvTxt.replace(/CV：/, '').replace(/\s/g, ''),
                    });
                }
            }
            const boxArr = Array.from($el.querySelectorAll('.box'));
            for (const $box of boxArr) {
                const txtArr = $box.textContent
                    .trim()
                    .split(/：|:/)
                    .map((s) => s.trim());
                if (charaInfoDict[txtArr[0]]) {
                    res.push({
                        name: charaInfoDict[txtArr[0]],
                        value: txtArr[1],
                    });
                }
                else {
                    res.push({
                        name: txtArr[0],
                        value: txtArr[1],
                    });
                }
            }
            const $summary = $nameTxt.closest('div').cloneNode(true);
            $summary.firstElementChild.remove();
            res.push({
                name: '人物简介',
                value: $summary.textContent,
                category: 'crt_summary',
            });
            return res;
        },
    },
};

const doubanTools = {
    hooks: {
        async beforeCreate() {
            const href = window.location.href;
            if (/\/game\//.test(href) && !/\/game\/\d+\/edit/.test(href)) {
                return {
                    payload: {
                        auxSite: {
                            url: document.querySelector('.th-modify > a').href,
                            prefs: {
                                originNames: ['平台', '发行日期'],
                                targetNames: 'all',
                            },
                        },
                    },
                };
            }
        },
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                if (['平台', '别名'].includes(info.name)) {
                    const pArr = info.value.split('/').map((i) => {
                        return Object.assign(Object.assign({}, info), { value: i.trim() });
                    });
                    res.push(...pArr);
                }
                else if (info.category === 'cover') {
                    res.push(Object.assign({}, info));
                }
                else {
                    let val = info.value;
                    if (val && typeof val === 'string') {
                        const v = info.value.split('/');
                        if (v && v.length > 1) {
                            val = v.map((s) => s.trim()).join(', ');
                        }
                    }
                    if (info.name === '游戏类型' && val) {
                        val = val.replace('游戏, ', '').trim();
                    }
                    res.push(Object.assign(Object.assign({}, info), { value: val }));
                }
            }
            // 特殊处理平台
            const $plateform = findElement({
                selector: '#content .game-attr',
                subSelector: 'dt',
                sibling: true,
                keyWord: '平台',
            });
            if ($plateform) {
                const aList = $plateform.querySelectorAll('a') || [];
                for (const $a of aList) {
                    res.push({
                        name: '平台',
                        value: getText($a).replace(/\/.*/, '').trim(),
                        category: 'platform',
                    });
                }
            }
            return res;
        },
    },
    filters: [],
};
const doubanGameEditTools = {
    hooks: {
        async beforeCreate() {
            const href = window.location.href;
            return /\/game\/\d+\/edit/.test(href);
        },
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                const arr = Object.assign({}, info);
                if (['平台', '别名'].includes(info.name)) {
                    const plateformDict = {
                        ARC: 'Arcade',
                        NES: 'FC',
                        红白机: 'FC',
                        街机: 'Arcade',
                    };
                    const pArr = info.value.split(',').map((i) => {
                        let v = i.trim();
                        if (plateformDict[v]) {
                            v = plateformDict[v];
                        }
                        return Object.assign(Object.assign({}, info), { value: v });
                    });
                    res.push(...pArr);
                }
                else if (arr.category === 'cover' && arr.value && arr.value.url) {
                    try {
                        const url = arr.value.url.replace('/spic/', '/lpic/');
                        const dataUrl = await getImageDataByURL(url);
                        const coverItem = Object.assign(Object.assign({}, arr), { value: {
                                dataUrl,
                                url,
                            } });
                        res.push(coverItem);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
                else if (arr.name === '游戏类型') {
                    arr.value = arr.value.replace(/,(?!\s)/g, ', ');
                    res.push(arr);
                }
                else if (arr.name === '开发') {
                    arr.value = arr.value.replace(/,(?!\s)/g, ', ');
                    res.push(arr);
                }
                else {
                    res.push(arr);
                }
            }
            // 描述
            const inputList = document.querySelectorAll('input[name="target"][type="hidden"]');
            inputList.forEach(($input) => {
                const val = $input.value;
                if (val === 'description') {
                    const $target = $input
                        .closest('form')
                        .querySelector('.desc-form-item #thing_desc_options_0');
                    if ($target) {
                        res.push({
                            name: '游戏简介',
                            value: $target.value,
                            category: 'subject_summary',
                        });
                    }
                }
            });
            return res;
        },
    },
    filters: [],
};
const doubanMusicTools = {
    hooks: {
        async afterGetWikiData(infos) {
            var _a;
            const res = [];
            for (const item of infos) {
                res.push(item);
            }
            const $info = document.querySelector('#info');
            if ($info) {
                const nameDict = {
                    又名: {
                        name: '别名',
                        category: 'alias',
                    },
                    发行时间: {
                        name: '发售日期',
                        category: 'date',
                    },
                    介质: {
                        name: '版本特性',
                    },
                    唱片数: {
                        name: '碟片数量',
                    },
                    流派: {
                        name: '流派',
                    },
                    出版者: {
                        name: '厂牌',
                    },
                    表演者: {
                        name: '艺术家',
                    },
                    条形码: {
                        name: '条形码',
                    }
                };
                $info.querySelectorAll('.pl').forEach((pl) => {
                    let val = '';
                    if (pl.nextSibling.TEXT_NODE === 3) {
                        val = pl.nextSibling.textContent.trim();
                    }
                    let key = pl.textContent.trim().split(':')[0];
                    const anchors = pl.querySelectorAll('a');
                    if (anchors && anchors.length) {
                        val = [...anchors].map((a) => a.textContent.trim()).join('、');
                    }
                    if (!val) {
                        return;
                    }
                    if (key in nameDict) {
                        const target = nameDict[key];
                        res.push(Object.assign(Object.assign({}, target), { value: val }));
                    }
                });
            }
            const discNum = ((_a = res.find((item) => item.name === '碟片数量')) === null || _a === void 0 ? void 0 : _a.value) || 1;
            const tracks = [
                ...document.querySelectorAll('.track-list ul.track-items > li'),
            ].map((item) => {
                const order = item.getAttribute('data-track-order');
                const orderNum = order ? parseInt(order) : 0;
                const titleRaw = item.textContent.trim();
                const durationReg = /\s*\d{1,2}:\d{1,2}$/;
                if (durationReg.test(titleRaw)) {
                    const m = titleRaw.match(durationReg);
                    return {
                        title: titleRaw.replace(durationReg, ''),
                        duration: m[0].trim(),
                        order: orderNum,
                    };
                }
                return {
                    title: item.textContent.trim(),
                    order: orderNum,
                };
            });
            const discArr = [];
            let curDisc = [];
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (track.order === 0) {
                    if (curDisc.length) {
                        discArr.push(curDisc);
                        curDisc = [];
                    }
                    continue;
                }
                curDisc.push(track);
            }
            if (curDisc.length) {
                discArr.push(curDisc);
            }
            if (discArr.length && discArr.length == discNum) {
                res.push({
                    category: 'ep',
                    name: '',
                    value: discArr,
                });
            }
            else {
                console.warn('碟片数量不匹配', discNum, discArr);
            }
            return res;
        },
    },
    filters: [],
};

var ErogamescapeCategory;
(function (ErogamescapeCategory) {
    ErogamescapeCategory["game"] = "game";
    ErogamescapeCategory["brand"] = "brand";
    ErogamescapeCategory["creater"] = "creater";
    ErogamescapeCategory["music"] = "music";
    ErogamescapeCategory["pov"] = "pov";
    ErogamescapeCategory["character"] = "character";
})(ErogamescapeCategory || (ErogamescapeCategory = {}));
const erogamescapeTools = {
    hooks: {
        async beforeCreate() {
            var _a;
            const $el = findElement([
                {
                    selector: '#links',
                    subSelector: 'a',
                    keyWord: 'Getchu.com',
                },
                {
                    selector: '#bottom_inter_links_main',
                    subSelector: 'a',
                    keyWord: 'Getchu.com',
                },
            ]);
            const softQuery = (_a = $el === null || $el === void 0 ? void 0 : $el.getAttribute('href')) === null || _a === void 0 ? void 0 : _a.match(/\?id=\d+$/);
            if (softQuery) {
                return {
                    payload: {
                        auxSite: {
                            url: `http://www.getchu.com/soft.phtml${softQuery[0]}`,
                            opts: {
                                cookie: 'getchu_adalt_flag=getchu.com',
                                decode: 'EUC-JP',
                            },
                            prefs: {
                                originNames: ['游戏名'],
                                targetNames: ['cover'],
                            },
                        },
                    },
                };
            }
            return true;
        },
    },
    filters: [],
};

const getchuTools = {
    dealTitle(str) {
        str = str.trim().split('\n')[0];
        str = str
            .split('＋')[0]
            .replace(/（このタイトルの関連商品）/, '')
            .trim();
        return str.replace(/\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし).*?$|＜.*＞$/g, '');
    },
    getExtraCharaInfo(txt) {
        const re = /[^\s]+?[:：]/g;
        const matchedArr = txt.match(re);
        if (!matchedArr)
            return [];
        const infoArr = txt.split(re);
        const res = [];
        matchedArr.forEach((item, idx) => {
            const val = (infoArr[idx + 1] || '').trim();
            if (val) {
                res.push({
                    name: item.replace(/:|：/, ''),
                    value: val,
                });
            }
        });
        return res;
    },
    getCharacterInfo($t) {
        const charaData = [];
        const $name = $t.closest('dt').querySelector('h2');
        let name;
        if ($name.querySelector('charalist')) {
            const $charalist = $name.querySelector('charalist');
            name = getText($charalist);
        }
        else {
            if ($name.classList.contains('chara-name') && $name.querySelector('br')) {
                name = $name
                    .querySelector('br')
                    .nextSibling.textContent.split(/（|\(|\sCV|新建角色/)[0];
            }
            else {
                name = getText($name).split(/（|\(|\sCV|新建角色/)[0];
            }
        }
        charaData.push({
            name: '姓名',
            value: name.replace(/\s/g, ''),
            category: 'crt_name',
        });
        charaData.push({
            name: '日文名',
            value: name,
        });
        const nameTxt = getText($name);
        if (nameTxt.match(/（(.*)）/)) {
            charaData.push({
                name: '纯假名',
                value: nameTxt.match(/（(.*)）/)[1],
            });
        }
        const cvMatch = nameTxt.match(/(?<=CV[：:]).+/);
        if (cvMatch) {
            charaData.push({
                name: 'CV',
                value: cvMatch[0].replace(/\s/g, ''),
            });
        }
        const $img = $t.closest('tr').querySelector('td > img');
        if ($img) {
            charaData.push({
                name: 'cover',
                value: convertImgToBase64($img),
                category: 'crt_cover',
            });
        }
        // 处理杂项 参考 id=1074002 id=735329 id=1080370
        // id=1080431
        // id=840936
        // dd tag
        const $dd = $t.closest('dt').nextElementSibling;
        const $clonedDd = $dd.cloneNode(true);
        Array.prototype.forEach.call($clonedDd.querySelectorAll('span[style^="font-weight"]'), (node) => {
            const t = getText(node).trim();
            t.split(/\n/g).forEach((el) => {
                const extraInfo = getchuTools.getExtraCharaInfo(el);
                if (extraInfo.length) {
                    charaData.push(...extraInfo);
                }
                else {
                    const c = el.match(/B.*W.*H\d+/);
                    if (c) {
                        charaData.push({
                            name: 'BWH',
                            value: c[0],
                        });
                    }
                }
            });
            node.remove();
        });
        charaData.push({
            name: '人物简介',
            value: getText($clonedDd).trim(),
            category: 'crt_summary',
        });
        const dict = {
            誕生日: '生日',
            '3サイズ': 'BWH',
            スリーサイズ: 'BWH',
            身長: '身高',
            血液型: '血型',
        };
        charaData.forEach((item) => {
            if (dict[item.name]) {
                item.name = dict[item.name];
            }
        });
        return charaData;
    },
};
const getchuSiteTools = {
    hooks: {
        async beforeCreate() {
            const $t = document.querySelector('#soft-title');
            if (!$t)
                return false;
            const rawTitle = $t.textContent.trim();
            if (/［同人グッズ|同人誌|同人音楽］/.test(rawTitle))
                return false;
            return true;
        },
    },
    filters: [
        {
            category: 'subject_title',
            dealFunc: getchuTools.dealTitle,
        },
    ],
};
const getchuCharaTools = {
    hooks: {
        async afterGetWikiData(infos, model, $el) {
            const res = [...infos];
            const $chara = $el.querySelector('h2.chara-name');
            if ($chara) {
                res.push(...getchuTools.getCharacterInfo($chara));
            }
            return res;
        },
    },
};

function dealTitle(str) {
    str = str.trim().split('\n')[0];
    return str.replace(/\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし|パッケージ版).*?$|＜.*＞$/g, '');
}
const moepediaTools = {
    hooks: {
        async beforeCreate() {
            const $el = findElement([
                {
                    selector: '.body-shop_list > .body-shop_item > a[href*="www.getchu.com/soft.phtml?id="]',
                },
            ]);
            const url = $el === null || $el === void 0 ? void 0 : $el.getAttribute('href');
            if (url) {
                return {
                    payload: {
                        auxSite: {
                            url,
                            opts: {
                                cookie: 'getchu_adalt_flag=getchu.com',
                                decode: 'EUC-JP',
                            },
                            prefs: {
                                originNames: ['游戏名'],
                                targetNames: ['游戏简介'],
                            },
                        },
                    },
                };
            }
            return true;
        },
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                let val = info.value;
                if (info.name === '游戏名') {
                    val = dealTitle(val);
                }
                else if (['原画', '剧本', '音乐', '主题歌演唱', '游戏类型'].includes(info.name)) {
                    val = val.replace(/\n\s*/g, ', ');
                }
                else if (info.name === '售价') {
                    val = val.replace(/.*¥/, '¥');
                }
                res.push(Object.assign(Object.assign({}, info), { value: val }));
            }
            return res;
        },
    },
};

const steamTools = {
    hooks: {
        async beforeCreate() {
            return {
                payload: {
                    disableDate: true,
                },
            };
        },
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                let newInfo = Object.assign({}, info);
                if (info.name === 'website') {
                    // https://steamcommunity.com/linkfilter/?url=https://www.koeitecmoamerica.com/ryza/
                    const arr = newInfo.value.split('?url=');
                    newInfo.value = arr[1] || '';
                    newInfo.category = 'website,listItem';
                }
                res.push(Object.assign({}, newInfo));
            }
            if (location.hostname === 'store.steampowered.com') {
                res.push({
                    name: 'website',
                    value: `Steam|${location.origin + location.pathname}`,
                    category: 'website,listItem',
                });
            }
            return res;
        }
    },
    filters: [
        {
            category: 'date',
            dealFunc(str) {
                if (/年/.test(str)) {
                    return dealDate(str.replace(/\s/g, ''));
                }
                return formatDate(str);
            },
        },
    ],
};
const steamdbTools = {
    hooks: {
        async beforeCreate() {
            return {
                payload: {
                    disableDate: true,
                },
            };
        },
        async afterGetWikiData(infos) {
            var _a;
            const res = [];
            for (const info of infos) {
                let newInfo = Object.assign({}, info);
                if (info.name === '游戏引擎') {
                    newInfo.value = info.value.replace(/^Engine\./g, '');
                }
                if (info.name === '游戏简介') {
                    if (info.value.match(/\n.*?Steam charts, data, update history\.$/)) {
                        newInfo.value = info.value.split('\n')[0];
                    }
                }
                // if (info.name === '游戏类型') {
                //   newInfo.value = info.value.split(',').map((s) => s.trim()).join('、');
                // }
                if (info.name === 'cover') {
                    if (info.value.url) {
                        const a = info.value.url;
                        const h = a.lastIndexOf('?');
                        const m = a.substring((h === -1 ? a.length : h) - 4);
                        const scaleUrl = a.substring(0, a.length - m.length) + '_2x' + m;
                        let dataUrl = '';
                        try {
                            dataUrl = await getImageDataByURL(scaleUrl);
                        }
                        catch (error) { }
                        if (dataUrl) {
                            newInfo.value = {
                                url: scaleUrl,
                                dataUrl,
                            };
                        }
                    }
                }
                if (newInfo) {
                    res.push(Object.assign({}, newInfo));
                }
            }
            const $appInstall = document.querySelector('#js-app-install');
            const appId = (_a = $appInstall === null || $appInstall === void 0 ? void 0 : $appInstall.href.match(/steam:\/\/launch\/(\d+)/)) === null || _a === void 0 ? void 0 : _a[1];
            if (appId) {
                res.push({
                    name: 'website',
                    value: `Steam|https://store.steampowered.com/app/${appId}`,
                    category: 'listItem',
                });
            }
            // 额外信息
            [...document.querySelectorAll('#info > table > tbody > tr > td.span3')].forEach(item => {
                const sibling = item.nextElementSibling;
                if (sibling.innerHTML.includes('General Mature Content')) {
                    res.push({
                        name: 'subject_nsfw',
                        value: '1',
                        category: 'checkbox',
                    });
                    return;
                }
                if (item.innerHTML.includes('name_localized')) {
                    const names = [...sibling.querySelectorAll('table > tbody > tr')].map((tr) => {
                        const name = tr.querySelector('td:nth-child(1)').textContent.trim();
                        const value = tr.querySelector('td:nth-child(2)').textContent.trim();
                        return {
                            name,
                            value,
                        };
                    });
                    const gameName = res.find(info => info.name === '游戏名');
                    const enName = names.find(name => name.name === 'english');
                    const jpName = names.find(name => name.name === 'japanese');
                    if (enName && gameName) {
                        if (gameName.value !== enName.value) {
                            res.push({
                                name: '别名',
                                value: `英文|${enName.value}`,
                            });
                        }
                    }
                    if (jpName && gameName) {
                        if (gameName.value !== jpName.value) {
                            res.push({
                                name: '别名',
                                value: `日文|${jpName.value}`,
                            });
                        }
                    }
                    const tchName = names.find(name => name.name === 'tchinese');
                    if (tchName) {
                        res.push({
                            name: '别名',
                            value: `繁中|${tchName.value}`,
                        });
                    }
                }
            });
            return res;
        },
    },
    filters: [
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
};

const vgmdbTools = {
    hooks: {
        async beforeCreate() {
            const $t = document.querySelector('#innermain h1 > .albumtitle[lang=ja]');
            if ($t && $t.style.display === 'none') {
                const $div = document.createElement('div');
                const $s = document.createElement('span');
                $s.style.color = 'red';
                $s.style.fontWeight = '600';
                $s.innerHTML = '注意: ';
                const $txt = document.createElement('span');
                $txt.innerHTML =
                    '请设置 Title / Name Language 为 Original。(辅助创建脚本)';
                $div.appendChild($s);
                $div.appendChild($txt);
                $div.style.padding = '6px 0';
                $t.parentElement.insertAdjacentElement('afterend', $div);
            }
            return true;
        },
        async afterGetWikiData(infos) {
            var _a, _b;
            const res = [];
            const $h1 = document.querySelector('#innermain > h1');
            res.push({
                name: '唱片名',
                value: $h1.innerText,
                category: 'subject_title',
            });
            for (const item of infos) {
                if (item.name === '价格' && item.value.includes('Not for Sale')) {
                    continue;
                }
                // 替换数字
                if (item.name === '版本特性' && /\d+/.test(item.value)) {
                    res.push(Object.assign(Object.assign({}, item), { value: item.value.replace(/\d+/, '').trim() }));
                    continue;
                }
                if (item.name === '目录编号') {
                    res.push(Object.assign(Object.assign({}, item), { value: item.value.trim().split(' ')[0].trim() }));
                    continue;
                }
                res.push(item);
            }
            /*
            for (const $td of document.querySelectorAll(
              '#album_infobit_large td:first-child'
            )) {
              const label = ($td as HTMLElement).innerText;
              const links = $td.nextElementSibling.querySelectorAll('a');
              let value = '';
              if ($td.nextElementSibling.querySelector('.artistname[lang=ja]')) {
                value = [...links]
                  .map(
                    (node) => node.querySelector('.artistname[lang=ja]').textContent
                  )
                  .join('、');
              } else {
                value = [...links].map((node) => node.innerText).join('、');
              }
              let name = '';
              if (label.includes('Performer')) {
                name = '艺术家';
              } else if (label.includes('Composer')) {
                name = '作曲';
              } else if (label.includes('Arranger')) {
                name = '编曲';
              } else if (label.includes('Lyricist')) {
                name = '作词';
              }
              if (name) {
                res.push({
                  name,
                  value,
                });
              }
            }
            */
            let url = (_a = document.querySelector('meta[property="og:image"]')) === null || _a === void 0 ? void 0 : _a.content;
            if (!url) {
                try {
                    url = document.querySelector('#coverart').style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)[1];
                }
                catch (error) { }
            }
            if (url) {
                let dataUrl = url;
                try {
                    if (url) {
                        dataUrl = await getImageDataByURL(url, {
                            headers: {
                                Referer: url,
                            },
                        });
                    }
                }
                catch (error) { }
                res.push({
                    category: 'cover',
                    name: 'cover',
                    value: {
                        url,
                        dataUrl,
                    },
                });
            }
            // 曲目列表
            const tracklist = document.querySelector('#tracklist');
            if (tracklist) {
                let tableList = tracklist.querySelectorAll('.tl > table');
                (_b = document.querySelectorAll('#tlnav > li > a')) === null || _b === void 0 ? void 0 : _b.forEach((item) => {
                    if (item.innerHTML.includes('Japanese')) {
                        const rel = item.getAttribute('rel');
                        tableList = document.querySelectorAll(`#${rel} > table`);
                    }
                });
                const discArr = [...tableList].map((table) => {
                    return [...table.querySelectorAll('tr')].map((item) => {
                        const $tds = item.querySelectorAll('td');
                        return {
                            title: $tds[1].innerText.trim(),
                            duration: $tds[2].innerText.trim(),
                        };
                    });
                });
                res.push({
                    category: 'ep',
                    // 名字留空
                    name: '',
                    value: discArr,
                });
            }
            return res;
        },
    },
};

function trimParenthesis$1(str) {
    const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
    return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}
function identity(x) {
    return x;
}
const noOps = () => Promise.resolve(true);
function getHooks(siteConfig, timing) {
    var _a;
    const hooks = ((_a = sitesFuncDict[siteConfig.key]) === null || _a === void 0 ? void 0 : _a.hooks) || {};
    return hooks[timing] || noOps;
}
function getCharaHooks(config, timing) {
    var _a;
    const hooks = ((_a = charaFuncDict[config.key]) === null || _a === void 0 ? void 0 : _a.hooks) || {};
    return hooks[timing] || noOps;
}
function dealFuncByCategory(key, category) {
    var _a;
    let fn;
    if ((_a = sitesFuncDict[key]) === null || _a === void 0 ? void 0 : _a.filters) {
        const obj = sitesFuncDict[key].filters.find((x) => x.category === category);
        fn = obj && obj.dealFunc;
    }
    if (fn) {
        return fn;
    }
    else {
        return (str = '') => identity(str.trim());
    }
}
const sitesFuncDict = {
    amazon_jp_book: amazonJpBookTools,
    dangdang_book: {
        filters: [
            {
                category: 'date',
                dealFunc(str) {
                    return dealDate(str.replace(/出版时间[:：]/, '').trim());
                },
            },
            {
                category: 'subject_title',
                dealFunc(str) {
                    return trimParenthesis$1(str);
                },
            },
        ],
    },
    jd_book: {
        filters: [
            {
                category: 'subject_title',
                dealFunc(str) {
                    return trimParenthesis$1(str);
                },
            },
        ],
    },
    getchu_game: getchuSiteTools,
    erogamescape: erogamescapeTools,
    steam_game: steamTools,
    steamdb_game: steamdbTools,
    douban_game: doubanTools,
    douban_game_edit: doubanGameEditTools,
    dlsite_game: dlsiteTools,
    dmm_game: dmmTools,
    adultcomic: adultComicTools,
    moepedia: moepediaTools,
    vgmdb: vgmdbTools,
    amazon_jp_music: amazonJpMusicTools,
    douban_music: doubanMusicTools,
};
// 存储新建角色的钩子函数和 filters
const charaFuncDict = {
    dlsite_game_chara: dlsiteCharaTools,
    dmm_game_chara: dmmCharaTools,
    getchu_chara: getchuCharaTools,
};

/**
 * 处理单项 wiki 信息
 * @param str
 * @param category
 * @param keyWords
 */
function dealItemText(str, category = '', keyWords = []) {
    if (['subject_summary', 'subject_title'].indexOf(category) !== -1) {
        return str;
    }
    const textList = ['\\(.*?\\)', '（.*?）']; // 去掉多余的括号信息
    // const keyStr = keyWords.sort((a, b) => b.length - a.length).join('|')
    // `(${keyStr})(${separators.join('|')})?`
    return str
        .replace(new RegExp(textList.join('|'), 'g'), '')
        .replace(new RegExp(keyWords.map((k) => `${k}\s*?(:|：)?`).join('|'), 'g'), '')
        .replace(/[^\d:]+?(:|：)/, '')
        .trim();
}
async function getWikiItem(infoConfig, site) {
    var _a;
    if (!infoConfig)
        return;
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
    let txt = getText($d);
    if ((_a = infoConfig.pipes) === null || _a === void 0 ? void 0 : _a.includes('ti')) {
        txt = getInnerText($d);
    }
    const pipeArgsDict = {
        k: [keyWords],
    };
    switch (infoConfig.category) {
        case 'cover':
        case 'crt_cover':
            val = await getCover($d, site);
            break;
        case 'subject_summary':
            // 优先使用 innerText
            const innerTxt = getInnerText($d);
            if (innerTxt) {
                txt = innerTxt;
            }
        case 'alias':
        case 'subject_title':
            // 有管道优先使用管道处理数据. 兼容之前使用写法
            if (infoConfig.pipes) {
                val = dealTextByPipe(txt, infoConfig.pipes, pipeArgsDict);
            }
            else {
                val = dealFuncByCategory(site, infoConfig.category)(txt);
            }
            break;
        case 'website':
            val = dealFuncByCategory(site, 'website')($d.getAttribute('href'));
            break;
        case 'date':
            // 有管道优先使用管道处理数据. 兼容之前使用写法
            if (infoConfig.pipes) {
                val = dealTextByPipe(txt, infoConfig.pipes, pipeArgsDict);
            }
            else {
                // 日期预处理，不能删除
                val = dealItemText(txt, infoConfig.category, keyWords);
                val = dealFuncByCategory(site, infoConfig.category)(val);
            }
            break;
        default:
            // 有管道优先使用管道处理数据. 兼容之前使用写法
            if (infoConfig.pipes) {
                val = dealTextByPipe(txt, infoConfig.pipes, pipeArgsDict);
            }
            else {
                val = dealItemText(txt, infoConfig.category, keyWords);
            }
    }
    // 信息后处理
    if (infoConfig.category === 'creator') {
        val = val.replace(/\s/g, '');
    }
    if (val) {
        return {
            name: infoConfig.name,
            value: val,
            category: infoConfig.category,
        };
    }
}
async function getWikiData(siteConfig, el) {
    el ? setCtxDom(el) : clearCtxDom();
    const r = await Promise.all(siteConfig.itemList.map((item) => getWikiItem(item, siteConfig.key)));
    clearCtxDom();
    const defaultInfos = siteConfig.defaultInfos || [];
    let rawInfo = r.filter((i) => i);
    const hookRes = await getHooks(siteConfig, 'afterGetWikiData')(rawInfo, siteConfig);
    if (Array.isArray(hookRes) && hookRes.length) {
        rawInfo = hookRes;
    }
    return [...rawInfo, ...defaultInfos];
}
async function getCharaData(model, el) {
    el ? setCtxDom(el) : clearCtxDom();
    const r = await Promise.all(model.itemList.map((item) => getWikiItem(item, model.key)));
    clearCtxDom();
    const defaultInfos = model.defaultInfos || [];
    let rawInfo = r.filter((i) => i);
    const hookRes = await getCharaHooks(model, 'afterGetWikiData')(rawInfo, model, el);
    if (Array.isArray(hookRes) && hookRes.length) {
        rawInfo = hookRes;
    }
    return [...rawInfo, ...defaultInfos];
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
    const $div = document.createElement('div');
    const $s = document.createElement('span');
    $s.classList.add('e-wiki-new-subject');
    $s.innerHTML = '新建';
    const $search = $s.cloneNode();
    $search.innerHTML = '新建并查重';
    $div.appendChild($s);
    $div.appendChild($search);
    $t.insertAdjacentElement('afterend', $div);
    $s.addEventListener('click', async (e) => {
        await cb(e);
    });
    $search.addEventListener('click', async (e) => {
        if ($search.innerHTML !== '新建并查重')
            return;
        $search.innerHTML = '查重中...';
        try {
            await cb(e, true);
            $search.innerHTML = '新建并查重';
        }
        catch (e) {
            if (e === 'notmatched') {
                $search.innerHTML = '未查到条目';
            }
            console.error(e);
        }
    });
}
/**
 * 插入新建角色控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
function insertControlBtnChara($t, cb) {
    if (!$t)
        return;
    const $div = document.createElement('div');
    const $s = document.createElement('a');
    $s.classList.add('e-wiki-new-character');
    // $s.setAttribute('target', '_blank')
    $s.innerHTML = '添加新虚拟角色';
    $div.appendChild($s);
    $t.insertAdjacentElement('afterend', $div);
    $s.addEventListener('click', async (e) => {
        await cb(e);
    });
}
function addCharaUI($t, names, cb) {
    if (!$t)
        return;
    if (!names.length) {
        console.warn('没有虚拟角色可用');
        return;
    }
    // @TODO 增加全部
    // <option value="all">全部</option>
    const btn = `<a class="e-wiki-new-character">添加新虚拟角色</a>`;
    const $div = htmlToElement(`
  <div class="e-bnwh-add-chara-wrap">
  ${btn}
<select class="e-bnwh-select">
${names.map((n) => `<option value="${n}">${n}</option>`)}
</select>
  </div>
  `);
    $t.insertAdjacentElement('afterend', $div);
    $div
        .querySelector('.e-wiki-new-character')
        .addEventListener('click', async (e) => {
        // 获取下拉选项
        const $sel = $div.querySelector('.e-bnwh-select');
        const val = $sel.value;
        await cb(e, val);
    });
}
function isChineseStr(str) {
    return /^[\u4e00-\u9fa5]+/i.test(str) && !hasJpStr(str);
}
function hasJpStr(str) {
    var pHiragana = /[\u3040-\u309Fー]/;
    var pKatakana = /[\u30A0-\u30FF]/;
    return pHiragana.test(str) || pKatakana.test(str);
}
function getTargetStr(str1, str2, checkFunc) {
    if (checkFunc(str1))
        return str1;
    if (checkFunc(str2))
        return str2;
    return '';
}
// 综合两个单项信息
function combineObj(current, target, auxPrefs = {}) {
    if (auxPrefs.originNames === 'all' ||
        (auxPrefs.originNames && auxPrefs.originNames.includes(current.name))) {
        return [Object.assign({}, current)];
    }
    else if (auxPrefs.targetNames === 'all' ||
        (auxPrefs.targetNames && auxPrefs.targetNames.includes(target.name))) {
        return [Object.assign({}, target)];
    }
    const obj = Object.assign(Object.assign({}, current), target);
    if (current.category === 'subject_title') {
        // 中日  日英  中英
        let cnName = { name: '中文名', value: '' };
        let titleObj = Object.assign({}, current);
        let otherName = { name: '别名', value: '', category: 'alias' };
        let chineseStr = getTargetStr(current.value, target.value, isChineseStr);
        let jpStr = getTargetStr(current.value, target.value, hasJpStr);
        // TODO 状态机？
        if (chineseStr) {
            cnName.value = chineseStr;
            if (current.value === chineseStr) {
                titleObj.value = target.value;
            }
            else {
                titleObj.value = current.value;
            }
        }
        if (jpStr) {
            titleObj.value = jpStr;
            if (!chineseStr) {
                if (current.value === jpStr) {
                    otherName.value = target.value;
                }
                else {
                    otherName.value = current.value;
                }
            }
        }
        return [titleObj, cnName, otherName];
    }
    if (['游戏简介', '开发', '发行'].includes(current.name)) {
        return [Object.assign({}, current)];
    }
    if (current.value.length < target.value.length) {
        obj.value = target.value;
    }
    else {
        obj.value = current.value;
    }
    return [obj];
}
/**
 * 结合不用网站的信息
 * @param infoList 当前的条目信息
 * @param otherInfoList 参考的条目信息
 */
function combineInfoList(infoList, otherInfoList, auxPrefs = {}) {
    // 合并数组为空时
    if (!otherInfoList || !otherInfoList.length) {
        return infoList;
    }
    if (!infoList || !infoList.length) {
        return otherInfoList;
    }
    const multipleNames = ['平台', '别名'];
    const { targetNames = [], originNames = [] } = auxPrefs;
    const res = [];
    const idxSetOther = new Set();
    for (let i = 0; i < infoList.length; i++) {
        const current = infoList[i];
        const targetFirst = targetNames.includes(current.name);
        if (targetFirst) {
            continue;
        }
        else if (!targetFirst && multipleNames.includes(current.name)) {
            res.push(current);
            continue;
        }
        const idxOther = otherInfoList.findIndex((info) => info.name === current.name);
        if (idxOther === -1) {
            res.push(current);
        }
        else {
            const objArr = combineObj(current, otherInfoList[idxOther], auxPrefs);
            res.push(...objArr);
            idxSetOther.add(idxOther);
        }
    }
    for (let j = 0; j < otherInfoList.length; j++) {
        const other = otherInfoList[j];
        const originFirst = originNames.includes(other.name);
        if (originFirst) {
            continue;
        }
        else if (!originFirst && multipleNames.includes(other.name)) {
            res.push(other);
            continue;
        }
        if (idxSetOther.has(j))
            continue;
        res.push(other);
    }
    const noEmptyArr = res.filter((v) => v.value);
    // ref: https://stackoverflow.com/questions/2218999/remove-duplicates-from-an-array-of-objects-in-javascript
    return noEmptyArr
        .filter((v, i, a) => a.findIndex((t) => t.value === v.value && t.name === v.name) === i)
        .filter((v, i, a) => {
        if (v.name !== '别名')
            return true;
        else {
            return a.findIndex((t) => t.value === v.value) === i;
        }
    });
}
// 后台抓取其它网站的 wiki 信息
async function getWikiDataByURL(url, opts = {}) {
    const urlObj = new URL(url);
    const models = findModelByHost(urlObj.hostname);
    if (models && models.length) {
        const rawText = await fetchText(url, opts, 4 * 1000);
        let $doc = new DOMParser().parseFromString(rawText, 'text/html');
        let model = models[0];
        if (models.length > 1) {
            for (const m of models) {
                if (m.urlRules && m.urlRules.some((r) => r.test(url))) {
                    model = m;
                }
            }
        }
        try {
            // 查找标志性的元素
            const $page = findElement(model.pageSelectors, $doc);
            if (!$page)
                return [];
            const $title = findElement(model.controlSelector, $doc);
            if (!$title)
                return [];
            return await getWikiData(model, $doc);
        }
        catch (error) {
            return [];
        }
    }
    return [];
}

function sleep(num) {
    return new Promise((resolve) => {
        setTimeout(resolve, num);
    });
}

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
    let $doc = new DOMParser().parseFromString(info, 'text/html');
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
                greyName: item.querySelector('h3>.grey')
                    ? item.querySelector('h3>.grey').textContent.trim()
                    : '',
            };
            let matchDate = item
                .querySelector('.info')
                .textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
            if (matchDate) {
                itemSubject.releaseDate = dealDate(matchDate[0]);
            }
            let $rateInfo = item.querySelector('.rateInfo');
            if ($rateInfo) {
                if ($rateInfo.querySelector('.fade')) {
                    itemSubject.score = $rateInfo.querySelector('.fade').textContent;
                    itemSubject.count = $rateInfo
                        .querySelector('.tip_j')
                        .textContent.replace(/[^0-9]/g, '');
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
async function searchSubject(subjectInfo, bgmHost = 'https://bgm.tv', type = SubjectTypeId.all, uniqueQueryStr = '') {
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
        query = `"${uniqueQueryStr || ''}"`;
    }
    if (!query || query === '""') {
        console.info('Query string is empty');
        return;
    }
    const url = `${bgmHost}/subject_search/${encodeURIComponent(query)}?cat=${type}`;
    console.info('search bangumi subject URL: ', url);
    const rawText = await fetchText(url);
    const rawInfoList = dealSearchResults(rawText)[0] || [];
    // 使用指定搜索字符串如 ISBN 搜索时, 并且结果只有一条时，不再使用名称过滤
    if (uniqueQueryStr && rawInfoList && rawInfoList.length === 1) {
        return rawInfoList[0];
    }
    const options = {
        keys: ['name', 'greyName'],
    };
    return filterResults(rawInfoList, subjectInfo, options);
}
/**
 * 通过时间查找条目
 * @param subjectInfo 条目信息
 * @param pageNumber 页码
 * @param type 条目类型
 */
async function findSubjectByDate(subjectInfo, bgmHost = 'https://bgm.tv', pageNumber = 1, type) {
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
    const rawText = await fetchText(url);
    let [rawInfoList, numOfPage] = dealSearchResults(rawText);
    const options = {
        threshold: 0.3,
        keys: ['name', 'greyName'],
    };
    let result = filterResults(rawInfoList, subjectInfo, options, false);
    if (!result) {
        if (pageNumber < numOfPage) {
            await sleep(300);
            return await findSubjectByDate(subjectInfo, bgmHost, pageNumber + 1, type);
        }
        else {
            throw 'notmatched';
        }
    }
    return result;
}
async function checkBookSubjectExist(subjectInfo, bgmHost = 'https://bgm.tv', type) {
    const numISBN = subjectInfo.isbn.replace(/-/g, '');
    let searchResult = await searchSubject(subjectInfo, bgmHost, type, numISBN);
    console.info(`First: search book of bangumi: `, searchResult);
    if (searchResult && searchResult.url) {
        return searchResult;
    }
    // 判断一下是否重复
    if (numISBN !== subjectInfo.isbn) {
        searchResult = await searchSubject(subjectInfo, bgmHost, type, subjectInfo.isbn);
        console.info(`Second: search book by ${subjectInfo.isbn}: `, searchResult);
        if (searchResult && searchResult.url) {
            return searchResult;
        }
    }
    // 默认使用名称搜索
    searchResult = await searchSubject(subjectInfo, bgmHost, type);
    console.info('Third: search book of bangumi: ', searchResult);
    return searchResult;
}
/**
 * 查找条目是否存在： 通过名称搜索或者日期加上名称的过滤查询
 * @param subjectInfo 条目基本信息
 * @param bgmHost bangumi 域名
 * @param type 条目类型
 */
async function checkExist(subjectInfo, bgmHost = 'https://bgm.tv', type, disabelDate) {
    const subjectTypeDict = {
        [SubjectTypeId.game]: 'game',
        [SubjectTypeId.anime]: 'anime',
        [SubjectTypeId.music]: 'music',
        [SubjectTypeId.book]: 'book',
        [SubjectTypeId.real]: 'real',
        [SubjectTypeId.all]: 'all',
    };
    let searchResult = await searchSubject(subjectInfo, bgmHost, type);
    console.info(`First: search result of bangumi: `, searchResult);
    if (searchResult && searchResult.url) {
        return searchResult;
    }
    if (disabelDate) {
        return;
    }
    searchResult = await findSubjectByDate(subjectInfo, bgmHost, 1, subjectTypeDict[type]);
    console.info(`Second: search result by date: `, searchResult);
    return searchResult;
}
async function checkSubjectExit(subjectInfo, bgmHost = 'https://bgm.tv', type, disableDate) {
    let result;
    switch (type) {
        case SubjectTypeId.book:
            result = await checkBookSubjectExist(subjectInfo, bgmHost, type);
            break;
        case SubjectTypeId.game:
            result = await checkExist(subjectInfo, bgmHost, type, disableDate);
            break;
        case SubjectTypeId.music:
            result = await checkExist(subjectInfo, bgmHost, type, true);
            break;
        case SubjectTypeId.anime:
        case SubjectTypeId.real:
        default:
            console.info('not support type: ', type);
    }
    return result;
}

// 配置变量
const SCRIPT_PREFIX = 'E_USERJS_';
const AUTO_FILL_FORM = SCRIPT_PREFIX + 'autofill';
const WIKI_DATA = SCRIPT_PREFIX + 'wiki_data';
const CHARA_DATA = SCRIPT_PREFIX + 'wiki_data';
const PROTOCOL = SCRIPT_PREFIX + 'protocol';
const BGM_DOMAIN = SCRIPT_PREFIX + 'bgm_domain';
const SUBJECT_ID = SCRIPT_PREFIX + 'subject_id';

function getBgmHost() {
    return `${location.protocol}//${location.host}`;
}
function getSubjectId(url) {
    const m = url.match(/(?:subject|character)\/(\d+)/);
    if (!m)
        return '';
    return m[1];
}
function genLinkText(url, text = '地址') {
    const $div = document.createElement('div');
    const $link = document.createElement('a');
    $link.href = url;
    $link.innerText = text;
    $div.appendChild($link);
    return $div.innerHTML;
}
function insertLogInfo($sibling, txt) {
    const $log = document.createElement('div');
    $log.classList.add('e-wiki-log-info');
    // $log.setAttribute('style', 'color: tomato;');
    $log.innerHTML = txt;
    $sibling.parentElement.insertBefore($log, $sibling);
    $sibling.insertAdjacentElement('afterend', $log);
    return $log;
}
/**
 * 通过 iframe 获取表单
 * @param url 链接地址
 * @param formSelector 表单的 iframe
 * @returns Promise<HTMLFormElement>
 */
async function getFormByIframe(url, formSelector) {
    const iframeId = 'e-userjs-iframe';
    let $iframe = document.querySelector(`#${iframeId}`);
    if (!$iframe) {
        $iframe = document.createElement('iframe');
        $iframe.style.display = 'none';
        $iframe.id = iframeId;
        document.body.appendChild($iframe);
    }
    await loadIframe($iframe, url, 20000);
    return $iframe.contentDocument.querySelector(formSelector);
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var NotyfNotification = /** @class */ (function () {
    function NotyfNotification(options) {
        this.options = options;
        this.listeners = {};
    }
    NotyfNotification.prototype.on = function (eventType, cb) {
        var callbacks = this.listeners[eventType] || [];
        this.listeners[eventType] = callbacks.concat([cb]);
    };
    NotyfNotification.prototype.triggerEvent = function (eventType, event) {
        var _this = this;
        var callbacks = this.listeners[eventType] || [];
        callbacks.forEach(function (cb) { return cb({ target: _this, event: event }); });
    };
    return NotyfNotification;
}());
var NotyfArrayEvent;
(function (NotyfArrayEvent) {
    NotyfArrayEvent[NotyfArrayEvent["Add"] = 0] = "Add";
    NotyfArrayEvent[NotyfArrayEvent["Remove"] = 1] = "Remove";
})(NotyfArrayEvent || (NotyfArrayEvent = {}));
var NotyfArray = /** @class */ (function () {
    function NotyfArray() {
        this.notifications = [];
    }
    NotyfArray.prototype.push = function (elem) {
        this.notifications.push(elem);
        this.updateFn(elem, NotyfArrayEvent.Add, this.notifications);
    };
    NotyfArray.prototype.splice = function (index, num) {
        var elem = this.notifications.splice(index, num)[0];
        this.updateFn(elem, NotyfArrayEvent.Remove, this.notifications);
        return elem;
    };
    NotyfArray.prototype.indexOf = function (elem) {
        return this.notifications.indexOf(elem);
    };
    NotyfArray.prototype.onUpdate = function (fn) {
        this.updateFn = fn;
    };
    return NotyfArray;
}());

var NotyfEvent;
(function (NotyfEvent) {
    NotyfEvent["Dismiss"] = "dismiss";
    NotyfEvent["Click"] = "click";
})(NotyfEvent || (NotyfEvent = {}));
var DEFAULT_OPTIONS = {
    types: [
        {
            type: 'success',
            className: 'notyf__toast--success',
            backgroundColor: '#3dc763',
            icon: {
                className: 'notyf__icon--success',
                tagName: 'i',
            },
        },
        {
            type: 'error',
            className: 'notyf__toast--error',
            backgroundColor: '#ed3d3d',
            icon: {
                className: 'notyf__icon--error',
                tagName: 'i',
            },
        },
    ],
    duration: 2000,
    ripple: true,
    position: {
        x: 'right',
        y: 'bottom',
    },
    dismissible: false,
};

var NotyfView = /** @class */ (function () {
    function NotyfView() {
        this.notifications = [];
        this.events = {};
        this.X_POSITION_FLEX_MAP = {
            left: 'flex-start',
            center: 'center',
            right: 'flex-end',
        };
        this.Y_POSITION_FLEX_MAP = {
            top: 'flex-start',
            center: 'center',
            bottom: 'flex-end',
        };
        // Creates the main notifications container
        var docFrag = document.createDocumentFragment();
        var notyfContainer = this._createHTMLElement({ tagName: 'div', className: 'notyf' });
        docFrag.appendChild(notyfContainer);
        document.body.appendChild(docFrag);
        this.container = notyfContainer;
        // Identifies the main animation end event
        this.animationEndEventName = this._getAnimationEndEventName();
        this._createA11yContainer();
    }
    NotyfView.prototype.on = function (event, cb) {
        var _a;
        this.events = __assign(__assign({}, this.events), (_a = {}, _a[event] = cb, _a));
    };
    NotyfView.prototype.update = function (notification, type) {
        if (type === NotyfArrayEvent.Add) {
            this.addNotification(notification);
        }
        else if (type === NotyfArrayEvent.Remove) {
            this.removeNotification(notification);
        }
    };
    NotyfView.prototype.removeNotification = function (notification) {
        var _this = this;
        var renderedNotification = this._popRenderedNotification(notification);
        var node;
        if (!renderedNotification) {
            return;
        }
        node = renderedNotification.node;
        node.classList.add('notyf__toast--disappear');
        var handleEvent;
        node.addEventListener(this.animationEndEventName, (handleEvent = function (event) {
            if (event.target === node) {
                node.removeEventListener(_this.animationEndEventName, handleEvent);
                _this.container.removeChild(node);
            }
        }));
    };
    NotyfView.prototype.addNotification = function (notification) {
        var node = this._renderNotification(notification);
        this.notifications.push({ notification: notification, node: node });
        // For a11y purposes, we still want to announce that there's a notification in the screen
        // even if it comes with no message.
        this._announce(notification.options.message || 'Notification');
    };
    NotyfView.prototype._renderNotification = function (notification) {
        var _a;
        var card = this._buildNotificationCard(notification);
        var className = notification.options.className;
        if (className) {
            (_a = card.classList).add.apply(_a, className.split(' '));
        }
        this.container.appendChild(card);
        return card;
    };
    NotyfView.prototype._popRenderedNotification = function (notification) {
        var idx = -1;
        for (var i = 0; i < this.notifications.length && idx < 0; i++) {
            if (this.notifications[i].notification === notification) {
                idx = i;
            }
        }
        if (idx !== -1) {
            return this.notifications.splice(idx, 1)[0];
        }
        return;
    };
    NotyfView.prototype.getXPosition = function (options) {
        var _a;
        return ((_a = options === null || options === void 0 ? void 0 : options.position) === null || _a === void 0 ? void 0 : _a.x) || 'right';
    };
    NotyfView.prototype.getYPosition = function (options) {
        var _a;
        return ((_a = options === null || options === void 0 ? void 0 : options.position) === null || _a === void 0 ? void 0 : _a.y) || 'bottom';
    };
    NotyfView.prototype.adjustContainerAlignment = function (options) {
        var align = this.X_POSITION_FLEX_MAP[this.getXPosition(options)];
        var justify = this.Y_POSITION_FLEX_MAP[this.getYPosition(options)];
        var style = this.container.style;
        style.setProperty('justify-content', justify);
        style.setProperty('align-items', align);
    };
    NotyfView.prototype._buildNotificationCard = function (notification) {
        var _this = this;
        var options = notification.options;
        var iconOpts = options.icon;
        // Adjust container according to position (e.g. top-left, bottom-center, etc)
        this.adjustContainerAlignment(options);
        // Create elements
        var notificationElem = this._createHTMLElement({ tagName: 'div', className: 'notyf__toast' });
        var ripple = this._createHTMLElement({ tagName: 'div', className: 'notyf__ripple' });
        var wrapper = this._createHTMLElement({ tagName: 'div', className: 'notyf__wrapper' });
        var message = this._createHTMLElement({ tagName: 'div', className: 'notyf__message' });
        message.innerHTML = options.message || '';
        var mainColor = options.background || options.backgroundColor;
        // Build the icon and append it to the card
        if (iconOpts) {
            var iconContainer = this._createHTMLElement({ tagName: 'div', className: 'notyf__icon' });
            if (typeof iconOpts === 'string' || iconOpts instanceof String)
                iconContainer.innerHTML = new String(iconOpts).valueOf();
            if (typeof iconOpts === 'object') {
                var _a = iconOpts.tagName, tagName = _a === void 0 ? 'i' : _a, className_1 = iconOpts.className, text = iconOpts.text, _b = iconOpts.color, color = _b === void 0 ? mainColor : _b;
                var iconElement = this._createHTMLElement({ tagName: tagName, className: className_1, text: text });
                if (color)
                    iconElement.style.color = color;
                iconContainer.appendChild(iconElement);
            }
            wrapper.appendChild(iconContainer);
        }
        wrapper.appendChild(message);
        notificationElem.appendChild(wrapper);
        // Add ripple if applicable, else just paint the full toast
        if (mainColor) {
            if (options.ripple) {
                ripple.style.background = mainColor;
                notificationElem.appendChild(ripple);
            }
            else {
                notificationElem.style.background = mainColor;
            }
        }
        // Add dismiss button
        if (options.dismissible) {
            var dismissWrapper = this._createHTMLElement({ tagName: 'div', className: 'notyf__dismiss' });
            var dismissButton = this._createHTMLElement({
                tagName: 'button',
                className: 'notyf__dismiss-btn',
            });
            dismissWrapper.appendChild(dismissButton);
            wrapper.appendChild(dismissWrapper);
            notificationElem.classList.add("notyf__toast--dismissible");
            dismissButton.addEventListener('click', function (event) {
                var _a, _b;
                (_b = (_a = _this.events)[NotyfEvent.Dismiss]) === null || _b === void 0 ? void 0 : _b.call(_a, { target: notification, event: event });
                event.stopPropagation();
            });
        }
        notificationElem.addEventListener('click', function (event) { var _a, _b; return (_b = (_a = _this.events)[NotyfEvent.Click]) === null || _b === void 0 ? void 0 : _b.call(_a, { target: notification, event: event }); });
        // Adjust margins depending on whether its an upper or lower notification
        var className = this.getYPosition(options) === 'top' ? 'upper' : 'lower';
        notificationElem.classList.add("notyf__toast--" + className);
        return notificationElem;
    };
    NotyfView.prototype._createHTMLElement = function (_a) {
        var tagName = _a.tagName, className = _a.className, text = _a.text;
        var elem = document.createElement(tagName);
        if (className) {
            elem.className = className;
        }
        elem.textContent = text || null;
        return elem;
    };
    /**
     * Creates an invisible container which will announce the notyfs to
     * screen readers
     */
    NotyfView.prototype._createA11yContainer = function () {
        var a11yContainer = this._createHTMLElement({ tagName: 'div', className: 'notyf-announcer' });
        a11yContainer.setAttribute('aria-atomic', 'true');
        a11yContainer.setAttribute('aria-live', 'polite');
        // Set the a11y container to be visible hidden. Can't use display: none as
        // screen readers won't read it.
        a11yContainer.style.border = '0';
        a11yContainer.style.clip = 'rect(0 0 0 0)';
        a11yContainer.style.height = '1px';
        a11yContainer.style.margin = '-1px';
        a11yContainer.style.overflow = 'hidden';
        a11yContainer.style.padding = '0';
        a11yContainer.style.position = 'absolute';
        a11yContainer.style.width = '1px';
        a11yContainer.style.outline = '0';
        document.body.appendChild(a11yContainer);
        this.a11yContainer = a11yContainer;
    };
    /**
     * Announces a message to screenreaders.
     */
    NotyfView.prototype._announce = function (message) {
        var _this = this;
        this.a11yContainer.textContent = '';
        // This 100ms timeout is necessary for some browser + screen-reader combinations:
        // - Both JAWS and NVDA over IE11 will not announce anything without a non-zero timeout.
        // - With Chrome and IE11 with NVDA or JAWS, a repeated (identical) message won't be read a
        //   second time without clearing and then using a non-zero delay.
        // (using JAWS 17 at time of this writing).
        // https://github.com/angular/material2/blob/master/src/cdk/a11y/live-announcer/live-announcer.ts
        setTimeout(function () {
            _this.a11yContainer.textContent = message;
        }, 100);
    };
    /**
     * Determine which animationend event is supported
     */
    NotyfView.prototype._getAnimationEndEventName = function () {
        var el = document.createElement('_fake');
        var transitions = {
            MozTransition: 'animationend',
            OTransition: 'oAnimationEnd',
            WebkitTransition: 'webkitAnimationEnd',
            transition: 'animationend',
        };
        var t;
        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
        // No supported animation end event. Using "animationend" as a fallback
        return 'animationend';
    };
    return NotyfView;
}());

/**
 * Main controller class. Defines the main Notyf API.
 */
var Notyf = /** @class */ (function () {
    function Notyf(opts) {
        var _this = this;
        this.dismiss = this._removeNotification;
        this.notifications = new NotyfArray();
        this.view = new NotyfView();
        var types = this.registerTypes(opts);
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), opts);
        this.options.types = types;
        this.notifications.onUpdate(function (elem, type) { return _this.view.update(elem, type); });
        this.view.on(NotyfEvent.Dismiss, function (_a) {
            var target = _a.target, event = _a.event;
            _this._removeNotification(target);
            // tslint:disable-next-line: no-string-literal
            target['triggerEvent'](NotyfEvent.Dismiss, event);
        });
        // tslint:disable-next-line: no-string-literal
        this.view.on(NotyfEvent.Click, function (_a) {
            var target = _a.target, event = _a.event;
            return target['triggerEvent'](NotyfEvent.Click, event);
        });
    }
    Notyf.prototype.error = function (payload) {
        var options = this.normalizeOptions('error', payload);
        return this.open(options);
    };
    Notyf.prototype.success = function (payload) {
        var options = this.normalizeOptions('success', payload);
        return this.open(options);
    };
    Notyf.prototype.open = function (options) {
        var defaultOpts = this.options.types.find(function (_a) {
            var type = _a.type;
            return type === options.type;
        }) || {};
        var config = __assign(__assign({}, defaultOpts), options);
        this.assignProps(['ripple', 'position', 'dismissible'], config);
        var notification = new NotyfNotification(config);
        this._pushNotification(notification);
        return notification;
    };
    Notyf.prototype.dismissAll = function () {
        while (this.notifications.splice(0, 1))
            ;
    };
    /**
     * Assigns properties to a config object based on two rules:
     * 1. If the config object already sets that prop, leave it as so
     * 2. Otherwise, use the default prop from the global options
     *
     * It's intended to build the final config object to open a notification. e.g. if
     * 'dismissible' is not set, then use the value from the global config.
     *
     * @param props - properties to be assigned to the config object
     * @param config - object whose properties need to be set
     */
    Notyf.prototype.assignProps = function (props, config) {
        var _this = this;
        props.forEach(function (prop) {
            // intentional double equality to check for both null and undefined
            config[prop] = config[prop] == null ? _this.options[prop] : config[prop];
        });
    };
    Notyf.prototype._pushNotification = function (notification) {
        var _this = this;
        this.notifications.push(notification);
        var duration = notification.options.duration !== undefined ? notification.options.duration : this.options.duration;
        if (duration) {
            setTimeout(function () { return _this._removeNotification(notification); }, duration);
        }
    };
    Notyf.prototype._removeNotification = function (notification) {
        var index = this.notifications.indexOf(notification);
        if (index !== -1) {
            this.notifications.splice(index, 1);
        }
    };
    Notyf.prototype.normalizeOptions = function (type, payload) {
        var options = { type: type };
        if (typeof payload === 'string') {
            options.message = payload;
        }
        else if (typeof payload === 'object') {
            options = __assign(__assign({}, options), payload);
        }
        return options;
    };
    Notyf.prototype.registerTypes = function (opts) {
        var incomingTypes = ((opts && opts.types) || []).slice();
        var finalDefaultTypes = DEFAULT_OPTIONS.types.map(function (defaultType) {
            // find if there's a default type within the user input's types, if so, it means the user
            // wants to change some of the default settings
            var userTypeIdx = -1;
            incomingTypes.forEach(function (t, idx) {
                if (t.type === defaultType.type)
                    userTypeIdx = idx;
            });
            var userType = userTypeIdx !== -1 ? incomingTypes.splice(userTypeIdx, 1)[0] : {};
            return __assign(__assign({}, defaultType), userType);
        });
        return finalDefaultTypes.concat(incomingTypes);
    };
    return Notyf;
}());

const notyf = new Notyf({
    duration: 3000,
    types: [
        {
            type: 'success',
        },
        {
            type: 'info',
            background: '#F09199',
        },
        {
            type: 'error',
            duration: 0,
            dismissible: true,
        },
    ],
    position: {
        x: 'right',
        y: 'top',
    },
});
const NOTYF_LIST = [];
async function logMessage(request) {
    if (request.cmd === 'dismissAll') {
        notyf.dismissAll();
        NOTYF_LIST.length = 0;
    }
    else if (request.cmd === 'dismissNotError') {
        for (const obj of NOTYF_LIST) {
            obj && notyf.dismiss(obj);
        }
        NOTYF_LIST.length = 0;
    }
    // 消息为空时
    if (request.message === '') {
        return;
    }
    let newNotyf;
    switch (request.type) {
        case 'succuss':
            newNotyf = notyf.success(request);
            break;
        case 'error':
            notyf.error(request);
            break;
        case 'info':
            newNotyf = notyf.open(request);
            // notyf.success(request.msg);
            break;
    }
    newNotyf && NOTYF_LIST.push(newNotyf);
}

async function updateAuxData(payload) {
    const { url: auxSite, opts: auxSiteOpts = {}, prefs: auxPrefs = {}, } = payload;
    try {
        logMessage({
            type: 'info',
            message: `抓取第三方网站信息中:<br/>${genAnonymousLinkText(auxSite, auxSite)}`,
            duration: 0,
        });
        console.info('the start of updating aux data');
        window._fetch_url_bg = auxSite;
        const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
        window._fetch_url_bg = null;
        if (!auxData || (auxData && auxData.length === 0)) {
            logMessage({
                type: 'error',
                message: `抓取信息为空<br/>
      ${genAnonymousLinkText(auxSite, auxSite)}
      <br/>
      打开上面链接确认是否能访问以及有信息，再尝试`,
                cmd: 'dismissNotError',
            });
        }
        else {
            logMessage({
                type: 'info',
                message: `抓取第三方网站信息成功:<br/>${genAnonymousLinkText(auxSite, auxSite)}`,
                cmd: 'dismissNotError',
            });
        }
        console.info('auxiliary data: ', auxData);
        const wikiData = JSON.parse(GM_getValue(WIKI_DATA) || null);
        let infos = combineInfoList(wikiData.infos, auxData, auxPrefs);
        if (auxSite.match(/store\.steampowered\.com/)) {
            infos = combineInfoList(auxData, wikiData.infos);
        }
        GM_setValue(WIKI_DATA, JSON.stringify({
            type: wikiData.type,
            subtype: wikiData.subType || 0,
            infos,
        }));
        console.info('the end of updating aux data');
    }
    catch (e) {
        console.error(e);
        logMessage({
            type: 'error',
            message: `抓取信息失败<br/>
      ${genAnonymousLinkText(auxSite, auxSite)}
      <br/>
      打开上面链接确认是否能访问以及有信息，再尝试`,
            cmd: 'dismissNotError',
        });
    }
}
async function initCommon(siteConfig) {
    const $page = findElement(siteConfig.pageSelectors);
    if (!$page)
        return;
    const $title = findElement(siteConfig.controlSelector);
    if (!$title)
        return;
    let bcRes = await getHooks(siteConfig, 'beforeCreate')(siteConfig);
    if (!bcRes)
        return;
    if (bcRes === true) {
        bcRes = {};
    }
    const { payload = {} } = bcRes;
    console.info(siteConfig.description, ' content script init');
    insertControlBtn($title, async (e, flag) => {
        var _a, _b;
        const protocol = GM_getValue(PROTOCOL) || 'https';
        const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
        const bgmHost = `${protocol}://${bgm_domain}`;
        console.info('init');
        const infoList = await getWikiData(siteConfig);
        console.info('wiki info list: ', infoList);
        const wikiData = {
            type: siteConfig.type,
            subtype: siteConfig.subType,
            infos: infoList,
        };
        GM_setValue(WIKI_DATA, JSON.stringify(wikiData));
        if (flag) {
            const info = getQueryInfo(infoList);
            logMessage({
                type: 'info',
                message: `搜索中...<br/>${(_a = info === null || info === void 0 ? void 0 : info.name) !== null && _a !== void 0 ? _a : ''}`,
                duration: 0,
            });
            let result = undefined;
            try {
                result = await checkSubjectExit(info, bgmHost, wikiData.type, payload === null || payload === void 0 ? void 0 : payload.disableDate);
                console.info('search results: ', result);
                logMessage({
                    type: 'info',
                    message: '',
                    cmd: 'dismissNotError',
                });
            }
            catch (error) {
                logMessage({
                    type: 'error',
                    // message: `搜索结果为空<br/>${info?.name ?? ''}`,
                    message: `Bangumi 搜索匹配结果为空: <br/><b>${(_b = info === null || info === void 0 ? void 0 : info.name) !== null && _b !== void 0 ? _b : ''}</b>`,
                    cmd: 'dismissNotError',
                });
            }
            if (result && result.url) {
                GM_setValue(SUBJECT_ID, getSubjectId(result.url));
                await sleep(100);
                GM_openInTab(bgmHost + result.url);
            }
            else {
                payload.auxSite && (await updateAuxData(payload.auxSite));
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
            payload.auxSite && (await updateAuxData(payload.auxSite));
            setTimeout(() => {
                GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`);
            }, 200);
        }
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
.e-bnwh-add-chara-wrap {
  margin-top: 6px;
  margin-bottom: 6px;
}
.e-bnwh-related-id {
  margin-left: 12px;
  display: inline-block;
  vertical-align: -5px;
}
  `);
    const my_css = GM_getResourceText('NOTYF_CSS');
    GM_addStyle(my_css);
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
async function sendFormImg($form, dataURL) {
    const info = [];
    const $file = $form.querySelector('input[type=file]');
    const inputFileName = $file.name ? $file.name : 'picfile';
    info.push({
        name: inputFileName,
        value: dataURItoBlob(dataURL),
        filename: genRandomStr(5) + '.png'
    });
    return await sendForm($form, info);
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
        x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
        y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
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
async function dealImageWidget($form, base64Data) {
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
            document
                .querySelector('.e-wiki-cover-container')
                .insertBefore(link, document.querySelector('#e-wiki-cover-preview'));
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
        $inputBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if ($canvas.width > 8 && $canvas.height > 10) {
                const $el = e.target;
                $el.style.display = 'none';
                const $loading = insertLoading($el);
                try {
                    const $wikiMode = document.querySelector('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                    $wikiMode && $wikiMode.click();
                    await sleep(200);
                    const url = await sendFormImg($form, $canvas.toDataURL('image/png', 1));
                    $el.style.display = '';
                    $loading.remove();
                    location.assign(url);
                }
                catch (e) {
                    console.log('send form err: ', e);
                }
            }
        }, false);
    }
    else {
        $inputBtn.value = '处理图片';
    }
}
function insertLoading($sibling) {
    const $loading = document.createElement('div');
    $loading.setAttribute('style', 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");');
    $sibling.parentElement.insertBefore($loading, $sibling);
    return $loading;
}

async function uploadSubjectCover(subjectId, dataUrl, bgmHost = '') {
    if (!bgmHost) {
        bgmHost = `${location.protocol}//${location.host}`;
    }
    const url = `${bgmHost}/subject/${subjectId}/upload_img`;
    const $hash = document.querySelector('form > input[name="formhash"]');
    if ($hash) {
        const fd = new FormData();
        fd.set('formhash', $hash.value);
        fd.set('picfile', dataURItoBlob(dataUrl), genRandomStr(5) + '.png');
        fd.set('submit', '上传图片');
        const res = await fetch(url, {
            body: fd,
            method: 'post',
        });
    }
    else {
        const rawText = await fetchText(url);
        const $doc = new DOMParser().parseFromString(rawText, 'text/html');
        const $form = $doc.querySelector('form[name=img_upload');
        if (!$form) {
            console.error('获取封面表单失败');
            return;
        }
        await sendFormImg($form, dataUrl);
    }
}
async function addMusicEp(subjectId, wikiInfo, log = (str) => console.log(str)) {
    if (location.pathname !== '/new_subject/3') {
        return;
    }
    // 音乐条目，添加ep
    const discInfo = wikiInfo.infos.find((item) => item.category === 'ep');
    if (discInfo) {
        for (let i = 0; i < discInfo.value.length; i++) {
            const track = discInfo.value[i];
            const songlist = track.map((obj) => obj.title).join('\n');
            await addSonglist(subjectId, songlist, String(i + 1));
            log(`Disc${i + 1}: 添加曲目成功`);
            await sleep(500);
        }
    }
}
async function addSonglist(subjectId, songlist, disc = '1') {
    const $hash = document.querySelector('form > input[name="formhash"]');
    if ($hash) {
        const fd = new FormData();
        fd.set('formhash', $hash.value);
        fd.set('songlist', songlist);
        fd.set('disc', disc);
        fd.set('submit', '加上去');
        const res = await fetch(`/subject/${subjectId}/songlist/new`, {
            body: fd,
            method: 'post',
        });
        // if (res.status === 302) {
        //   const location = res.headers.get('Location');
        //   console.log('Redirected to:', location);
        //   return await fetch(location);
        // }
        return res;
    }
    else {
        const rawText = await fetchText(`/subject/${subjectId}/ep`);
        const $doc = new DOMParser().parseFromString(rawText, 'text/html');
        const $form = $doc.querySelector('form[name=new_songlist');
        if (!$form) {
            console.error('获取封面表单失败');
            return;
        }
        await sendForm($form, [
            {
                name: 'songlist',
                value: songlist,
            },
            {
                name: 'disc',
                value: disc,
            },
            {
                name: 'submit',
                value: '加上去',
            }
        ]);
    }
}
async function searchCVByName(name, charaId = '') {
    const bgmHost = getBgmHost();
    let url = `${bgmHost}/json/search-cv_person/${name.replace(/\s/g, '')}`;
    if (charaId) {
        url = `${url}?character_id=${charaId}`;
    }
    const res = await fetchJson(url);
    return Object.keys(res)[0];
}
// 添加角色的关联条目
async function addPersonRelatedSubject(subjectIds, charaId, typeId, charaType = 1) {
    const typeDict = {
        [SubjectTypeId.game]: 'game',
        [SubjectTypeId.anime]: 'anime',
        [SubjectTypeId.music]: 'music',
        [SubjectTypeId.book]: 'book',
        [SubjectTypeId.real]: 'real',
        [SubjectTypeId.all]: 'all',
    };
    const bgmHost = `${location.protocol}//${location.host}`;
    const type = typeDict[typeId];
    const url = `${bgmHost}/character/${charaId}/add_related/${type}`;
    const $form = await getFormByIframe(url, '.mainWrapper form');
    const extroInfo = [];
    // 1 主角 2 配角 3 客串
    subjectIds.forEach((v, i) => {
        extroInfo.push({
            name: `infoArr[n${i}][crt_type]`,
            value: charaType,
        });
        extroInfo.push({
            name: `infoArr[n${i}][subject_id]`,
            value: v,
        });
    });
    // {name: 'submit', value: '保存关联数据'}
    await sendForm($form, [...extroInfo]);
}
// 未设置域名的兼容，只能在 Bangumi 本身上面使用
// 添加角色的关联 CV
async function addPersonRelatedCV(subjectId, charaId, personIds, typeId) {
    const typeDict = {
        [SubjectTypeId.game]: 'game',
        [SubjectTypeId.anime]: 'anime',
        [SubjectTypeId.music]: 'music',
        [SubjectTypeId.book]: 'book',
        [SubjectTypeId.real]: 'real',
        [SubjectTypeId.all]: 'all',
    };
    const bgmHost = `${location.protocol}//${location.host}`;
    const type = typeDict[typeId];
    const url = `${bgmHost}/character/${charaId}/add_related/person/${type}`;
    const rawText = await fetchText(url);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const $form = $doc.querySelector('.mainWrapper form');
    const personInfo = personIds.map((v, i) => ({
        name: `infoArr[n${i}][prsn_id]`,
        value: v,
    }));
    // {name: 'submit', value: '保存关联数据'}
    await sendForm($form, [
        {
            name: 'infoArr[n0][subject_id]',
            value: subjectId,
        },
        {
            name: 'infoArr[n0][subject_type_id]',
            value: typeId,
        },
        ...personInfo,
    ]);
}

function hasCategory(info, category) {
    if (info.category === category) {
        return true;
    }
    return info.category && info.category.includes(',') && info.category.split(',').includes(category);
}
/**
 * 转换 wiki 模式下 infobox 内容
 * @param originValue
 * @param infoArr
 */
function convertInfoValue(originValue, infoArr) {
    let arr = originValue
        .trim()
        .split('\n')
        .filter((v) => !!v);
    // 处理多个.
    const categories = ['website'];
    for (const cat of categories) {
        const infos = infoArr.filter((i) => i.name === cat);
        if (infos.length > 1) {
            const idx = arr.findIndex((v) => v.trim() === `|${cat}=`);
            if (arr.find((v) => v.trim() === `|${cat}={`)) {
                continue;
            }
            if (idx > -1) {
                arr[idx] = `|${cat}={`;
                // arr.splice(idx + 1, 0, '}')
                arr = [...arr.slice(0, idx + 1), '}', ...arr.slice(idx + 1)];
            }
            else {
                arr = [...arr.slice(0, -1), `|${cat}={`, '}', ...arr.slice(-1)];
            }
        }
    }
    //处理单个但是写成多个.写法有点绕，凑合用吧
    for (const info of infoArr) {
        if (hasCategory(info, 'listItem')) {
            const name = info.name;
            if (arr.find((v) => v.trim() === `|${name}={`)) {
                continue;
            }
            const idx = arr.findIndex((v) => v.trim() === `|${name}=`);
            if (idx > -1) {
                arr[idx] = `|${name}={`;
                arr = [...arr.slice(0, idx + 1), '}', ...arr.slice(idx + 1)];
            }
            else {
                arr = [...arr.slice(0, -1), `|${name}={`, '}', ...arr.slice(-1)];
            }
        }
    }
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
                // 2024-07-31 去除 ISBN 里面的短横线
                if (info.category === 'ISBN') {
                    d = d.replace(/-/g, '');
                }
                // 匹配到 [英文名|]
                if (/\[.+\|\]/.test(arr[i])) {
                    arr[i] = arr[i].replace(']', '') + d + ']';
                }
                else if (/\|.+={/.test(arr[i])) {
                    // 避免重复
                    if (!originValue.includes(`[${info.value}]`)) {
                        // |平台={
                        arr[i] = `${arr[i]}\n[${info.value}]`;
                    }
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
    // 图书条目的 infobox 作者放在出版社之前
    if (/animanga/.test(arr[0])) {
        let pressIdx;
        let authorIdx;
        let resArr = [...arr, ...newArr, '}}'];
        for (let i = 0; i < resArr.length; i++) {
            if (/\|(\s*)出版社(\s*)=/.test(resArr[i])) {
                pressIdx = i;
                continue;
            }
            if (/作者/.test(resArr[i])) {
                authorIdx = i;
                continue;
            }
        }
        if (pressIdx && authorIdx && authorIdx > pressIdx) {
            const press = resArr[pressIdx];
            const author = resArr[authorIdx];
            resArr.splice(pressIdx, 1, author, press);
            resArr.splice(authorIdx + 1, 1);
            return resArr.join('\n');
        }
    }
    return [...arr, ...newArr, '}}'].join('\n');
}
/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
async function fillInfoBox(wikiData) {
    const dict = {
        誕生日: '生日',
        スリーサイズ: 'BWH',
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
    await sleep(100);
    const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
    const $newbieMode = $q('table small a:nth-of-type(2)[href="javascript:void(0)"]');
    for (let i = 0, len = infos.length; i < len; i++) {
        const currentInfo = infos[i];
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
        if (currentInfo.category === 'checkbox') {
            const $t = $q(`input[name=${currentInfo.name}]`);
            $t.checked = currentInfo.value ? true : false;
            continue;
        }
        // 有名称并且category不在特定列表里面
        if (infos[i].name &&
            ['cover', 'crt_cover', 'ep'].indexOf(infos[i].category) === -1) {
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
    await sleep(200);
    const $infoBox = $q('#subject_infobox');
    $infoBox.value = convertInfoValue($infoBox.value, infoArray);
    await sleep(200);
    $newbieMode.click();
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
function getSubmitBtnText(wikiInfo) {
    let text = '添加条目并上传封面';
    if (location.pathname === '/new_subject/3') {
        // 音乐条目，添加ep
        const discInfo = wikiInfo.infos.find((item) => item.category === 'ep');
        if (discInfo) {
            text = '添加条目并上传封面、添加曲目';
        }
    }
    return text;
}
function initNewSubject(wikiInfo) {
    var _a;
    const $t = $q('form[name=create_subject] [name=subject_title]').parentElement;
    const defaultVal = $q('#subject_infobox').value;
    insertFillFormBtn($t, async (e) => {
        await fillInfoBox(wikiInfo);
        const $editSummary = $q('#editSummary');
        if ($editSummary) {
            $editSummary.value = '新条目';
        }
    }, () => {
        var _a;
        // 清除默认值
        $qa('input[name=platform]').forEach((element) => {
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
        // 移除上传图片
        (_a = $q('.e-wiki-cover-container')) === null || _a === void 0 ? void 0 : _a.remove();
        const $editSummary = $q('#editSummary');
        if ($editSummary) {
            $editSummary.value = '';
        }
    });
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
    const dataUrl = ((_a = coverInfo === null || coverInfo === void 0 ? void 0 : coverInfo.value) === null || _a === void 0 ? void 0 : _a.dataUrl) || '';
    if (dataUrl.match(/^data:image/)) {
        dealImageWidget($q('form[name=create_subject]'), dataUrl);
        // 修改文本
        setTimeout(() => {
            const $form = $q('form[name=create_subject]');
            const $input = $q('.e-wiki-cover-container [name=submit]');
            const $clonedInput = $input.cloneNode(true);
            if ($clonedInput) {
                $clonedInput.value = getSubmitBtnText(wikiInfo);
            }
            $input.insertAdjacentElement('afterend', $clonedInput);
            $input.remove();
            const $canvas = $q('#e-wiki-cover-preview');
            $clonedInput.addEventListener('click', async (e) => {
                e.preventDefault();
                if ($canvas.width > 8 && $canvas.height > 10) {
                    const $el = e.target;
                    $el.style.display = 'none';
                    $clonedInput.style.display = 'none';
                    const $loading = insertLoading($el);
                    try {
                        const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                        $wikiMode && $wikiMode.click();
                        await sleep(200);
                        const url = await sendForm($form);
                        const subjectId = getSubjectId(url);
                        if (subjectId) {
                            await uploadSubjectCover(subjectId, $canvas.toDataURL('image/png', 1));
                        }
                        await sleep(200);
                        await addMusicEp(subjectId, wikiInfo, (str) => {
                            insertLogInfo($el, str);
                        });
                        $loading.remove();
                        $el.style.display = '';
                        $clonedInput.style.display = '';
                        location.assign(url);
                    }
                    catch (e) {
                        console.log('send form err: ', e);
                    }
                }
            });
        }, 300);
    }
}
function initNewCharacter(wikiInfo, subjectId) {
    var _a;
    const $t = $q('form[name=new_character] #crt_name').parentElement;
    const defaultVal = $q('#subject_infobox').value;
    insertFillFormBtn($t, async (e) => {
        await fillInfoBox(wikiInfo);
    }, () => {
        var _a;
        const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
        $wikiMode && $wikiMode.click();
        // @ts-ignore
        $q('#subject_infobox').value = defaultVal;
        // @ts-ignore
        $q('#columnInSubjectA #crt_name').value = '';
        // @ts-ignore
        $q('#crt_summary').value = '';
        // 移除上传图片
        (_a = $q('.e-wiki-cover-container')) === null || _a === void 0 ? void 0 : _a.remove();
    });
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'crt_cover')[0];
    let dataUrl = '';
    if (coverInfo && coverInfo.value) {
        if (typeof coverInfo.value !== 'string') {
            dataUrl = ((_a = coverInfo === null || coverInfo === void 0 ? void 0 : coverInfo.value) === null || _a === void 0 ? void 0 : _a.dataUrl) || '';
        }
        else {
            dataUrl = coverInfo.value;
        }
    }
    if (dataUrl.match(/^data:image/)) {
        const $form = $q('form[name=new_character]');
        dealImageWidget($form, dataUrl);
        // 修改文本
        setTimeout(() => {
            const $input = $q('.e-wiki-cover-container [name=submit]');
            const $clonedInput = $input.cloneNode(true);
            if ($clonedInput) {
                $clonedInput.value = '添加人物并上传肖像';
            }
            $input.insertAdjacentElement('afterend', $clonedInput);
            $input.remove();
            // 2021-05-19 关联条目 id.
            const $relatedInput = htmlToElement(`
<span class="e-bnwh-related-id">
<span title="为空时不做关联操作">关联条目 id:</span>
<input type="number" placeholder="输入关联条目 id" />
</span>
      `);
            $clonedInput.insertAdjacentElement('afterend', $relatedInput);
            const $canvas = $q('#e-wiki-cover-preview');
            $clonedInput.addEventListener('click', async (e) => {
                var _a;
                e.preventDefault();
                if ($canvas.width > 8 && $canvas.height > 10) {
                    const $el = e.target;
                    $el.style.display = 'none';
                    $clonedInput.style.display = 'none';
                    const $loading = insertLoading($el);
                    try {
                        const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                        $wikiMode && $wikiMode.click();
                        await sleep(200);
                        const currentHost = getBgmHost();
                        const url = await sendFormImg($form, dataUrl);
                        insertLogInfo($el, `新建角色成功: ${genLinkText(url, '角色地址')}`);
                        const charaId = getSubjectId(url);
                        // subject id
                        const subjectId = ((_a = $relatedInput.querySelector('input')) === null || _a === void 0 ? void 0 : _a.value) || '';
                        if (charaId && subjectId) {
                            insertLogInfo($el, '存在条目 id, 开始关联条目');
                            await addPersonRelatedSubject([subjectId], charaId, wikiInfo.type);
                            insertLogInfo($el, `关联条目成功: ${genLinkText(`${currentHost}/subject/${subjectId}`, '条目地址')}`);
                            const cvInfo = wikiInfo.infos.filter((item) => item.name.toUpperCase() === 'CV')[0];
                            if (cvInfo) {
                                const cvId = await searchCVByName(cvInfo.value, charaId);
                                cvId &&
                                    (await addPersonRelatedCV(subjectId, charaId, [cvId], wikiInfo.type));
                                insertLogInfo($el, `关联 CV 成功: ${genLinkText(`${currentHost}/person/${cvId}`)}`);
                            }
                        }
                        $loading.remove();
                        $el.style.display = '';
                        $clonedInput.style.display = '';
                        location.assign(url);
                    }
                    catch (e) {
                        console.log('send form err: ', e);
                        insertLogInfo($el, `出错了: ${e}`);
                    }
                }
            });
        }, 300);
    }
}
function initUploadImg(wikiInfo) {
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
    if (coverInfo && coverInfo.value && coverInfo.value.dataUrl) {
        dealImageWidget($q('form[name=img_upload]'), coverInfo.value.dataUrl);
    }
}

const bangumi = {
    async init() {
        const re = new RegExp(['new_subject', 'add_related', 'character/new', 'upload_img'].join('|'));
        const page = document.location.href.match(re);
        if (!page)
            return;
        const wikiData = JSON.parse(GM_getValue(WIKI_DATA) || null);
        const charaData = JSON.parse(GM_getValue(CHARA_DATA) || null);
        const subjectId = GM_getValue(SUBJECT_ID);
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
            case 'character/new':
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
    },
};

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
            insertControlBtnChara(node, async (e) => {
                const charaInfo = getchuTools.getCharacterInfo(e.target);
                console.info('character info list: ', charaInfo);
                const charaData = {
                    type: siteConfig.type,
                    infos: charaInfo,
                };
                // 重置自动填表
                GM_setValue(AUTO_FILL_FORM, 1);
                GM_setValue(CHARA_DATA, JSON.stringify(charaData));
                // @TODO 不使用定时器
                setTimeout(() => {
                    GM_openInTab(`${bgmHost}/character/new`);
                }, 200);
            });
        });
    },
};

async function initChara(siteConfig) {
    var _a;
    // 查找标志性的元素
    const $page = findElement(siteConfig.pageSelectors);
    if (!$page)
        return;
    const charaModel = getCharaModel(siteConfig.key);
    if (!charaModel)
        return;
    const $el = findElement(charaModel.controlSelector);
    if (!$el)
        return;
    // 判断是否在 iframe 里面
    let iframeSel = '';
    let $doc;
    if (charaModel.itemSelector instanceof Array) {
        iframeSel = (_a = charaModel.itemSelector.find((i) => i.isIframe === true)) === null || _a === void 0 ? void 0 : _a.selector;
    }
    else if (charaModel.itemSelector.isIframe) {
        iframeSel = charaModel.itemSelector.selector;
    }
    if (iframeSel) {
        console.log('fetch html by background');
        const url = findElement({
            selector: iframeSel,
        }).getAttribute('src');
        if (url) {
            const rawHtml = await fetchText(url);
            $doc = new DOMParser().parseFromString(rawHtml, 'text/html');
        }
        else {
            return;
        }
    }
    const protocol = GM_getValue(PROTOCOL) || 'https';
    const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
    const bgmHost = `${protocol}://${bgm_domain}`;
    const itemArr = findAllElement(charaModel.itemSelector);
    // 获取名字列表
    let names = await Promise.all(itemArr.map(async ($t) => {
        var _a;
        const nameConfig = charaModel.itemList.find((item) => item.category == 'crt_name');
        const infos = await getCharaData(Object.assign(Object.assign({}, charaModel), { itemList: [nameConfig] }), $t);
        return (_a = infos.find((i) => i.category === 'crt_name')) === null || _a === void 0 ? void 0 : _a.value;
    }));
    addCharaUI($el, names, async (e, val) => {
        let targetList = [];
        if (val === 'all') ;
        else {
            const idx = names.indexOf(val);
            if (idx !== -1) {
                targetList = itemArr.slice(idx, idx + 1);
            }
        }
        for (const $target of targetList) {
            const charaInfo = await getCharaData(charaModel, $target);
            console.info('character info list: ', charaInfo);
            const charaData = {
                type: siteConfig.type,
                infos: charaInfo,
            };
            // 重置自动填表
            GM_setValue(AUTO_FILL_FORM, 1);
            GM_setValue(CHARA_DATA, JSON.stringify(charaData));
            // @TODO 不使用定时器
            await sleep(200);
            GM_openInTab(`${bgmHost}/character/new`);
        }
    });
}

function setDomain() {
    bgm_domain = prompt('预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv', 'bgm.tv');
    GM_setValue(BGM_DOMAIN, bgm_domain);
    return bgm_domain;
}
function setProtocol() {
    var p = prompt(`预设的 bangumi 页面协议是https 根据需要输入 http`, 'https');
    GM_setValue(PROTOCOL, p);
}
var bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
if (GM_registerMenuCommand) {
    GM_registerMenuCommand('设置 Bangumi 域名', setDomain, 'b');
    GM_registerMenuCommand('新建条目页面(http 或者 https)', setProtocol, 'h');
}
const init = async () => {
    const host = window.location.hostname;
    const modelArr = findModelByHost(host);
    if (modelArr && modelArr.length) {
        addStyle();
        modelArr.forEach((m) => {
            initCommon(m);
            initChara(m);
        });
    }
    if (['bangumi.tv', 'chii.tv', 'bgm.tv'].includes(host)) {
        addStyle();
        bangumi.init();
        // @TODO remove check
    }
    else if (host === 'www.getchu.com') {
        getchu.init(getchuGameModel);
    }
};
init();
