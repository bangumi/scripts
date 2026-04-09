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
// @version     0.5.0
// @note        0.4.27 支持音乐条目曲目列表
// @note        0.3.0 使用 typescript 重构，浏览器扩展和脚本使用公共代码
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_getResourceText
// @resource    NOTYF_CSS https://cdnjs.cloudflare.com/ajax/libs/notyf/3.10.0/notyf.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.0/fuse.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/notyf/3.10.0/notyf.min.js
// ==/UserScript==


function defineSiteIntegration(integration) {
    return integration;
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

const adultComicSubject = {
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
const commonSelectors = [
    {
        selector: '#info-table > div.info-box > dl',
        subSelector: 'dt',
        sibling: true,
    },
];
const genSelectors = (keyWord) => commonSelectors.map((s) => {
    return {
        ...s,
        keyWord,
    };
});
adultComicSubject.itemList.push({
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

const adultComicTools = {
    hooks: {
        async afterGetWikiData(infos) {
            const res = [];
            for (const info of infos) {
                let newInfo = { ...info };
                if (info.name === '作者') {
                    const lists = document.querySelectorAll('#info-table > div.info-box .author-list > li');
                    if (lists && lists.length > 1) {
                        newInfo.value = Array.from(lists)
                            .map((node) => node.textContent.trim())
                            .join(', ');
                    }
                }
                if (newInfo) {
                    res.push({
                        ...newInfo,
                    });
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

const adultcomicIntegration = defineSiteIntegration({
    site: adultComicSubject,
    tools: adultComicTools,
});

// TODO: 区分 kindle 页面和 纸质书页面
const amazonJpBookSubject = {
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
const commonSelectors$1 = [
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
amazonJpBookSubject.itemList.push({
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
    selector: commonSelectors$1.map((s) => {
        return {
            ...s,
            keyWord: ['ASIN', 'ISBN-10'],
        };
    }),
    category: 'ASIN',
}, {
    name: 'ISBN',
    selector: commonSelectors$1.map((s) => {
        return {
            ...s,
            keyWord: 'ISBN-13',
        };
    }),
    category: 'ISBN',
    pipes: ['k', 'ta'],
}, {
    name: '发售日',
    selector: commonSelectors$1.map((s) => {
        return {
            ...s,
            keyWord: ['発売日', '出版日期', '配信日'],
        };
    }),
    category: 'date',
    pipes: ['ta', 'k', 'p', 'date'],
}, {
    name: '出版社',
    selector: [
        {
            selector: '#bylineInfo',
            subSelector: '.author',
            keyWord: /\(出版社\)/,
            nextSelector: [
                {
                    selector: '.a-link-normal',
                },
                {
                    selector: 'a',
                },
            ],
        },
        ...commonSelectors$1.map((s) => {
            return {
                ...s,
                keyWord: '出版社',
            };
        }),
    ],
}, {
    name: '页数',
    selector: commonSelectors$1.map((s) => {
        return {
            ...s,
            keyWord: ['ページ', '页'],
        };
    }),
    pipes: ['num'],
}, 
// 有声书
{
    name: '播放时长',
    selector: commonSelectors$1.map((s) => {
        return {
            ...s,
            keyWord: ['再生時間'],
        };
    }),
}, {
    name: '演播',
    selector: commonSelectors$1.map((s) => {
        return {
            ...s,
            keyWord: ['ナレーター'],
        };
    }),
    pipes: ['ta', 'k'],
}, {
    name: '作者',
    selector: [
        {
            selector: '#bylineInfo',
            subSelector: '.author',
            keyWord: /\(著\)/,
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

function getStringValue(value, fallback = '') {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return fallback;
}
function isCoverValue(value) {
    return (typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        ('url' in value || 'dataUrl' in value));
}
function getCoverValue(value) {
    if (isCoverValue(value)) {
        return value;
    }
    return undefined;
}

// support GM_XMLHttpRequest
function getGMRequest() {
    return globalThis.GM_xmlhttpRequest;
}
function resolveRequestBody(method, body, data) {
    var _a;
    if (method === 'POST') {
        return (_a = data !== null && data !== void 0 ? data : body) !== null && _a !== void 0 ? _a : null;
    }
    return body !== null && body !== void 0 ? body : null;
}
function fetchInfo(url, type, opts = {}, TIMEOUT = 10 * 1000) {
    var _a;
    const method = ((_a = opts === null || opts === void 0 ? void 0 : opts.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'GET';
    const gmRequest = getGMRequest();
    if ( gmRequest) {
        const { decode, method: _method, body, data, ...restOpts } = opts;
        const requestBody = resolveRequestBody(method, body, data);
        const responseType = decode ? 'arraybuffer' : type;
        return new Promise((resolve, reject) => {
            gmRequest({
                method,
                timeout: TIMEOUT,
                url,
                responseType,
                ...(requestBody ? { data: requestBody } : {}),
                onload(res) {
                    if (res.status === 404) {
                        reject(404);
                        return;
                    }
                    if (decode && responseType === 'arraybuffer') {
                        const decoder = new TextDecoder(decode);
                        resolve(decoder.decode(res.response));
                    }
                    else {
                        resolve(res.response);
                    }
                },
                onerror: reject,
                ...restOpts,
            });
        });
    }
    const { decode, method: _method, body, data, ...restOpts } = opts;
    const requestBody = resolveRequestBody(method, body, data);
    return internalFetch(fetch(url, {
        ...restOpts,
        method,
        body: requestBody,
    }), TIMEOUT)
        .then(async (response) => {
        if (!response.ok) {
            throw new Error('Not 2xx response');
        }
        if (decode) {
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder(decode);
            return decoder.decode(buffer);
        }
        switch (type) {
            case 'text':
                return response.text();
            case 'json':
                return response.json();
            case 'blob':
                return response.blob();
            case 'arraybuffer':
                return response.arrayBuffer();
        }
        throw new Error('Not 2xx response');
    })
        .catch((err) => {
        console.log('fetch err: ', err);
        throw err;
    });
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
function internalFetch(fetchPromise, TIMEOUT) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('fetch timeout'));
        }, TIMEOUT);
        fetchPromise.then((response) => {
            clearTimeout(timer);
            resolve(response);
        }, (error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}

/**
 * convert base64/URLEncoded data component to raw binary data held in a string
 * https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
 * @param dataURI
 */
function dataURItoBlob(dataURI) {
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = decodeURI(dataURI.split(',')[1]); // instead of unescape
    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
}
function getImageDataByURL(url, opts = {}) {
    if (!url) {
        return Promise.reject(new Error('invalid img url'));
    }
    return new Promise(async (resolve, reject) => {
        try {
            const blob = await fetchBinary(url, opts);
            const reader = new FileReader();
            reader.onloadend = function () {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                    return;
                }
                reject(new Error('failed to convert blob to data url'));
            };
            reader.readAsDataURL(blob);
            reader.onerror = () => {
                var _a;
                reject((_a = reader.error) !== null && _a !== void 0 ? _a : new Error('failed to read image blob'));
            };
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
    if (!ctx) {
        throw new Error('canvas 2d context is unavailable');
    }
    ctx.drawImage($img, 0, 0, $img.width, $img.height);
    const dataURL = canvas.toDataURL('image/png');
    return dataURL;
}

const amazonUtils = {
    dealTitle(str = '') {
        str = str.trim().split('\n')[0].trim();
        const textList = [
            '\\([^0-9]+?\\)$',
            '（[^0-9]+?）$',
            '\\(.+?\\d+.+?\\)$',
            '（.+?\\d+.+?）$',
        ];
        str = str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
        return str;
    },
    getUrlDp(str) {
        const m = str.match(/\/dp\/(.*?)\//);
        if (m) {
            return m[1];
        }
        return '';
    },
};
async function getAmazonCoverInfo(res) {
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
                let newInfo = { ...info };
                const stringValue = getStringValue(info.value);
                if (info.name === '页数') {
                    const val = stringValue.trim().replace(/ページ|页/, '');
                    if (val && val.length < 8 && val.indexOf('予約商品') === -1) {
                        newInfo.value = val;
                    }
                    else {
                        newInfo = null;
                    }
                }
                else if (info.name === '播放时长') {
                    newInfo.value = stringValue.replace('時間', '小时').replace(/ /g, '');
                }
                else if (info.name === '价格') {
                    newInfo.value = stringValue.replace(/来自|より/, '').trim();
                }
                if (newInfo) {
                    res.push({
                        ...newInfo,
                    });
                }
            }
            const coverInfo = await getAmazonCoverInfo(res);
            if (coverInfo) {
                res.push(coverInfo);
            }
            return res;
        },
    },
};

const amazonJpBookIntegration = defineSiteIntegration({
    site: amazonJpBookSubject,
    tools: amazonJpBookTools,
});

// ref links
// https://www.amazon.co.jp/dp/B07FQ5WPM3/
// https://www.amazon.co.jp/dp/B0D456FXL4
// https://www.amazon.co.jp/dp/B07GQXDHLN
const amazonJpMusicSubject = {
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
const commonSelectors$2 = [
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
amazonJpMusicSubject.itemList.push({
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
            keyWord: /\(アーティスト\)/,
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
    selector: commonSelectors$2.map((s) => {
        return {
            ...s,
            keyWord: ['ディスク枚数'],
        };
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

const amazonJpMusicTools = {
    hooks: {
        async afterGetWikiData(infos) {
            const res = [];
            for (const item of infos) {
                if (item.name === '艺术家') {
                    item.value = getStringValue(item.value).replace(/\//g, '、');
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
            const coverInfo = await getAmazonCoverInfo(res);
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
                    name: '',
                    value: discArr,
                });
            }
            return res;
        },
    },
};

const amazonJpMusicIntegration = defineSiteIntegration({
    site: amazonJpMusicSubject,
    tools: amazonJpMusicTools,
});

const dangdangBookSubject = {
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
dangdangBookSubject.itemList.push({
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
    selector: {
        ...descSelector,
        keyWord: '国际标准书号ISBN',
    },
    category: 'ISBN',
}, {
    name: '发售日',
    selector: {
        ...infoSelector,
        keyWord: '出版时间',
    },
    category: 'date',
}, {
    name: '作者',
    selector: [
        {
            ...infoSelector,
            keyWord: '作者',
        },
    ],
}, {
    name: '出版社',
    selector: {
        ...infoSelector,
        keyWord: '出版社',
    },
}, {
    name: '内容简介',
    selector: [
        {
            selector: '#content .descrip',
        },
    ],
    category: 'subject_summary',
});

function trimParenthesis(str) {
    const textList = ['\\([^\\d]*?\\)', '（[^\\d]*?）']; // 去掉多余的括号信息
    return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
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
        'M+': date.getMonth() + 1, // Month
        'd+': date.getDate(), // Day
        'h+': date.getHours(), // Hour
        'm+': date.getMinutes(), // Minute
        's+': date.getSeconds(), // Second
        'q+': Math.floor((date.getMonth() + 3) / 3), // Quarter
        S: date.getMilliseconds(), // Millisecond
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
        { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日?/, format: '$1-$2-$3' }, // yyyy年mm月dd日
        { pattern: /(\d{4})年(\d{1,2})月/, format: '$1-$2' }, // yyyy年mm月
        { pattern: /(\d{4})[/-](\d{1,2})$/, format: '$1-$2' }, // yyyy/mm
        { pattern: /.*?(\d{4})\/(\d{1,2})\/(\d{1,2}).*?/, format: '$1-$2-$3' }, // mixed with other text
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

const dangdangBookTools = {
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
                return trimParenthesis(str);
            },
        },
    ],
};

const dangdangBookIntegration = defineSiteIntegration({
    site: dangdangBookSubject,
    tools: dangdangBookTools,
});

const dlsiteChara = {
    key: 'dlsite_game_chara',
    siteKey: 'dlsite_game',
    description: 'dlsite游戏角色',
    host: ['dlsite.com', 'www.dlsite.com'],
    type: SubjectTypeId.game,
    itemSelector: {
        selector: '.work_parts_multiimage_item',
    },
    toolbarSelector: [
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
dlsiteChara.itemList.push({
    name: 'cover',
    selector: {
        selector: '.image img',
    },
    category: 'crt_cover',
});

const dlsiteSubject = {
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
const commonSelector = {
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
const configArr = arrDict.map((obj) => {
    const r = {
        name: obj.name,
        selector: {
            keyWord: obj.key,
            ...commonSelector,
        },
    };
    if (obj.categrory) {
        r.category = obj.categrory;
    }
    return r;
});
dlsiteSubject.itemList.push({
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
}, ...configArr, {
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
dlsiteSubject.defaultInfos = [
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

const dlsiteTools = {
    hooks: {
        async afterGetWikiData(infos) {
            var _a;
            const res = [];
            for (const info of infos) {
                let val = info.value;
                const stringValue = getStringValue(info.value);
                if (stringValue &&
                    !/http/.test(stringValue) &&
                    ['原画', '剧本', '音乐', '游戏类型', '声优', '作者'].includes(info.name)) {
                    const v = stringValue.split('/');
                    if (v && v.length > 1) {
                        val = v.map((s) => s.trim()).join(', ');
                    }
                }
                res.push({
                    ...info,
                    value: val,
                });
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

const dlsiteIntegration = defineSiteIntegration({
    site: dlsiteSubject,
    tools: dlsiteTools,
    characters: [
        {
            model: dlsiteChara,
            tools: dlsiteCharaTools,
        },
    ],
});

const modernCharacterSectionSelector = {
    selector: '#detailGuide .detailGuide__content',
    subSelector: '.detailGuide__capt',
    keyWord: 'キャラクター',
    sibling: true,
};
const modernCharacterToolbarSelector = {
    selector: '#detailGuide .detailGuide__content',
    subSelector: '.detailGuide__capt',
    keyWord: 'キャラクター',
};
const modernCharacterItemSelector = {
    ...modernCharacterSectionSelector,
    nextSelector: {
        selector: '.detailGuide__box-chr',
    },
};
const dmmChara = {
    key: 'dmm_game_chara',
    siteKey: 'dmm_game',
    description: 'dmm 游戏角色',
    type: SubjectTypeId.game,
    itemSelector: modernCharacterItemSelector,
    presenceSelector: modernCharacterItemSelector,
    toolbarSelector: modernCharacterToolbarSelector,
    itemList: [],
};
// 限定父节点
dmmChara.itemList.push({
    name: '姓名',
    selector: {
        selector: '.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt',
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

const modernTitleSelector = {
    selector: 'h1.productTitle__item--headline',
};
const modernControlSelector = {
    ...modernTitleSelector,
    closest: '.productTitle',
};
const dmmSubject = {
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
        modernTitleSelector,
    ],
    controlSelector: [{ selector: 'h1#title' }, modernControlSelector],
    itemList: [],
};
const legacyInfoSelector = {
    selector: '.main-area-center .container02 table',
    subSelector: 'tr',
    nextSelector: {
        selector: '.type-right',
    },
};
const modernInfoSelector = {
    selector: '.productLayout__secondaryColumn',
    subSelector: '.contentsDetailTop__tableDataLeft > p, .contentsDetailBottom__tableDataLeft > p',
    closest: '.contentsDetailTop__tableRow, .contentsDetailBottom__tableRow',
    nextSelector: {
        selector: '.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight',
    },
};
function createInfoSelector(keyWord) {
    return [
        {
            ...legacyInfoSelector,
            keyWord,
            nextSelector: {
                selector: '.type-right',
            },
        },
        {
            ...modernInfoSelector,
            keyWord,
            nextSelector: {
                selector: '.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight',
            },
        },
    ];
}
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
    // {
    //   name: '声优',
    //   key: ['声優', '声优'],
    // },
    // {
    //   name: '音乐',
    //   key: ['音乐', '音楽'],
    // },
];
const configArr$1 = arrDict$1.map((obj) => {
    const r = {
        name: obj.name,
        selector: createInfoSelector(obj.key),
    };
    if (obj.category) {
        r.category = obj.category;
    }
    return r;
});
dmmSubject.itemList.push({
    name: '游戏名',
    selector: [
        {
            selector: '#title',
        },
        modernTitleSelector,
        {
            selector: 'meta[property="og:title"]',
        },
    ],
    category: 'subject_title',
}, {
    name: '开发',
    selector: createInfoSelector(['ブランド']),
}, ...configArr$1, 
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
    selector: {
        selector: '.read-text-area .text-overflow',
    },
    category: 'subject_summary',
});
dmmSubject.defaultInfos = [
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

function isTextPattern(value) {
    return typeof value === 'string' || value instanceof RegExp;
}
function toTextPatterns(input) {
    if (!input) {
        return [];
    }
    if (Array.isArray(input)) {
        return input.filter(isTextPattern);
    }
    return isTextPattern(input) ? [input] : [];
}
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function mergeFlags(patternFlags, extraFlags = '') {
    return Array.from(new Set(`${patternFlags}${extraFlags}`.split(''))).join('');
}
function getTextPatternSource(pattern) {
    return pattern instanceof RegExp ? pattern.source : escapeRegExp(pattern);
}
function toRegExp(pattern, extraFlags = '') {
    if (pattern instanceof RegExp) {
        return new RegExp(pattern.source, mergeFlags(pattern.flags, extraFlags));
    }
    return new RegExp(getTextPatternSource(pattern), extraFlags);
}
function replaceTextPatterns(text, patterns, extraFlags = 'g') {
    return patterns.reduce((current, pattern) => {
        return current.replace(toRegExp(pattern, extraFlags), '');
    }, text);
}
function matchesTextPatterns(text, patterns, extraFlags = '') {
    return patterns.some((pattern) => toRegExp(pattern, extraFlags).test(text));
}
function createStartsWithPattern(text) {
    return new RegExp(`^${escapeRegExp(text)}`);
}

/**
 * 获取节点文本
 * @param elem
 */
function getText(elem) {
    if (!elem)
        return '';
    if (elem instanceof HTMLMetaElement) {
        return elem.content;
    }
    if (elem instanceof HTMLInputElement ||
        elem instanceof HTMLTextAreaElement ||
        elem instanceof HTMLSelectElement) {
        return elem.value;
    }
    return elem.textContent || (elem instanceof HTMLElement ? elem.innerText : '') || '';
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
function $q(selector, $parent) {
    return ($parent !== null && $parent !== void 0 ? $parent : document).querySelector(selector);
}
/**
 * dollar 选择所有元素
 * @param {string} selector
 */
function $qa(selector, $parent) {
    return ($parent !== null && $parent !== void 0 ? $parent : document).querySelectorAll(selector);
}
/**
 * 查找包含文本的标签
 * @param {string} selector
 * @param {string} text
 */
function contains(selector, text, $parent) {
    const elements = Array.from($qa(selector, $parent));
    const patterns = toTextPatterns(text);
    if (!patterns.length) {
        return [];
    }
    return elements.filter((element) => {
        return matchesTextPatterns(getText(element), patterns, 'i');
    });
}
function isDocumentNode(node) {
    return !!node && node.nodeType === Node.DOCUMENT_NODE;
}
function getIframeContext(selector, $parent) {
    var _a, _b, _c;
    if ($parent instanceof HTMLIFrameElement) {
        return (_a = $parent.contentDocument) !== null && _a !== void 0 ? _a : null;
    }
    const $iframe = $parent === null || $parent === void 0 ? void 0 : $parent.querySelector(selector.selector);
    if ($iframe === null || $iframe === void 0 ? void 0 : $iframe.contentDocument) {
        return $iframe.contentDocument;
    }
    if (isDocumentNode($parent)) {
        return $parent;
    }
    return (_c = (_b = $q(selector.selector, $parent)) === null || _b === void 0 ? void 0 : _b.contentDocument) !== null && _c !== void 0 ? _c : null;
}
function findElementByKeyWord(selector, $parent) {
    let res = null;
    if ($parent) {
        $parent = $q(selector.selector, $parent);
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
function isElement(element) {
    return element !== null;
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
                r = $q(selector.selector, $parent);
            }
            else if (selector.isIframe) {
                const $iframeDoc = getIframeContext(selector, $parent);
                r = (_a = $iframeDoc === null || $iframeDoc === void 0 ? void 0 : $iframeDoc.querySelector(selector.subSelector)) !== null && _a !== void 0 ? _a : null;
            }
            else {
                r = findElementByKeyWord(selector, $parent);
            }
            if (selector.closest && r) {
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
    var _a;
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
                res = Array.from($qa(selector.selector, $parent));
            }
            else if (selector.isIframe) {
                const $iframeDoc = getIframeContext(selector, $parent);
                res = Array.from((_a = $iframeDoc === null || $iframeDoc === void 0 ? void 0 : $iframeDoc.querySelectorAll(selector.subSelector)) !== null && _a !== void 0 ? _a : []);
            }
            else {
                $parent = $q(selector.selector, $parent);
                if (!$parent)
                    return res;
                res = contains(selector.subSelector, selector.keyWord, $parent);
                if (selector.sibling) {
                    res = res.map(($t) => $t.nextElementSibling).filter(isElement);
                }
            }
            // closest
            if (selector.closest) {
                res = res.map((r) => r.closest(selector.closest)).filter(isElement);
            }
        }
        else {
            // 有下一步的选择器时，selector 是用来定位父节点的
            const localSel = { ...selector };
            delete localSel.nextSelector;
            const parents = findAllElement(localSel, $parent);
            res = parents.flatMap(($p) => findAllElement(selector.nextSelector, $p));
        }
    }
    return res;
}
/**
 * @param {String} HTML 字符串
 * @return {Element}
 */
function htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    const firstElement = template.content.firstElementChild;
    if (!firstElement) {
        throw new Error('htmlToElement requires a root element');
    }
    return firstElement;
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
        const timer = setTimeout(() => {
            $iframe.onload = undefined;
            reject(new Error('iframe timeout'));
        }, TIMEOUT);
        $iframe.onload = () => {
            clearTimeout(timer);
            $iframe.onload = null;
            resolve(undefined);
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

function normalizeDmmCharacterName(name) {
    return name.replace(/※.*$/, '').trim();
}
const dmmNoticeKeywordRe = /更新内容|パッチ|配布中|修正|適用|ダウンロード|バージョン|ver\.?\d|体験版・無料ダウンロード|公式サイト|こちらの商品はVer|update|patch|download|version|apply|fix|notice|※/i;
function looksLikeDmmNoticeBlock(block) {
    const head = block.trim().slice(0, 300);
    return /^\d{4}\/\d{1,2}\/\d{1,2}/.test(head) || dmmNoticeKeywordRe.test(head);
}
function isSummaryDividerLine(line) {
    const trimmed = line.trim();
    return trimmed.length >= 6 && /^[^\p{L}\p{N}]+$/u.test(trimmed);
}
function splitSummaryBlocks(summary) {
    const blocks = [];
    let current = [];
    const flush = () => {
        const block = current.join('\n').trim();
        if (block) {
            blocks.push(block);
        }
        current = [];
    };
    for (const line of summary.split('\n')) {
        if (isSummaryDividerLine(line)) {
            flush();
            continue;
        }
        current.push(line);
    }
    flush();
    return blocks;
}
function cleanupDmmSubjectSummary(summary) {
    const normalized = summary.trim();
    const head = normalized.slice(0, 300);
    if (!looksLikeDmmNoticeBlock(head)) {
        return normalized;
    }
    const parts = splitSummaryBlocks(normalized);
    if (parts.length <= 1) {
        return normalized;
    }
    for (let i = parts.length - 1; i >= 0; i -= 1) {
        if (!looksLikeDmmNoticeBlock(parts[i])) {
            return parts[i];
        }
    }
    return normalized;
}
function getDmmCharacterNameElement($el) {
    return $el.querySelector('.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt');
}
function getDmmCharacterSummary($el) {
    return Array.from($el.querySelectorAll('.detailGuide__box-date p'))
        .filter(($p) => !$p.querySelector('.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt'))
        .map(($p) => getInnerText($p).trim())
        .filter(Boolean)
        .join('\n');
}
const dmmTools = {
    hooks: {
        async afterGetWikiData(infos) {
            var _a;
            const res = [];
            const hasCover = infos.some((info) => info.category == 'cover');
            for (const info of infos) {
                let val = info.value;
                if (info.category === 'subject_summary' && typeof val === 'string') {
                    val = cleanupDmmSubjectSummary(val);
                }
                res.push({
                    ...info,
                    value: val,
                });
            }
            if (!hasCover) {
                // 使用 slider 里面的第一个图片。slick 初始化前，页面上也会先有静态 li。
                const slides = Array.from($qa('.image-slider li'));
                if (slides.length) {
                    let url = '';
                    let dataUrl = '';
                    const targetSlide = slides.find((slide) => slide.dataset.slickIndex === '0') || slides[0];
                    url = ((_a = targetSlide.querySelector('img')) === null || _a === void 0 ? void 0 : _a.getAttribute('src')) || '';
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
            var _a, _b, _c;
            const res = infos.map((info) => {
                if (info.category === 'crt_name' && typeof info.value === 'string') {
                    return {
                        ...info,
                        value: normalizeDmmCharacterName(info.value),
                    };
                }
                return info;
            });
            const $nameTxt = getDmmCharacterNameElement($el);
            if ($nameTxt) {
                // （きのみや なのか）
                const nameTxt = ((_a = $nameTxt.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                const kanaMatch = nameTxt.match(/（(.*)）/);
                if (kanaMatch) {
                    res.push({
                        name: '纯假名',
                        value: kanaMatch[1],
                    });
                }
                const cvSource = ((_c = (_b = $nameTxt.parentElement) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.replace(nameTxt, '')) || '';
                const cvMatch = cvSource.match(/CV[：:]\s*([^\n\r]+)/);
                if (cvMatch) {
                    res.push({
                        name: 'CV',
                        value: cvMatch[1].replace(/\s/g, ''),
                    });
                }
            }
            const summary = getDmmCharacterSummary($el);
            if (summary) {
                res.push({
                    name: '人物简介',
                    value: summary,
                    category: 'crt_summary',
                });
            }
            return res;
        },
    },
};

const dmmIntegration = defineSiteIntegration({
    site: dmmSubject,
    tools: dmmTools,
    characters: [
        {
            model: dmmChara,
            tools: dmmCharaTools,
        },
    ],
});

const doubanGameSubject = {
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
doubanGameSubject.itemList.push({
    name: '游戏名',
    selector: {
        selector: '#content h1',
    },
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: [
        {
            ...gameAttr,
            keyWord: '发行日期',
        },
        {
            ...gameAttr,
            keyWord: '预计上市时间',
        },
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
    selector: {
        ...gameAttr,
        keyWord: '别名',
    },
    category: 'alias',
}, {
    name: '游戏类型',
    selector: {
        ...gameAttr,
        keyWord: '类型',
    },
}, {
    name: '开发',
    selector: {
        ...gameAttr,
        keyWord: '开发商',
    },
}, {
    name: '发行',
    selector: {
        ...gameAttr,
        keyWord: '发行商',
    },
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

const DOUBAN_GAME_PLATFORM_MAP = {
    ARC: 'Arcade',
    NES: 'FC',
    红白机: 'FC',
    街机: 'Arcade',
};
const DOUBAN_MUSIC_FIELD_MAP = {
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
    },
};
function getDoubanModifyUrl() {
    var _a;
    return (_a = document.querySelector('.th-modify > a')) === null || _a === void 0 ? void 0 : _a.href;
}
function splitInfoValues(info, delimiter, valueMap = {}) {
    if (typeof info.value !== 'string') {
        return [{ ...info }];
    }
    return info.value
        .split(delimiter)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((value) => {
        var _a;
        return ({
            ...info,
            value: (_a = valueMap[value]) !== null && _a !== void 0 ? _a : value,
        });
    });
}
function normalizeSlashDelimitedValue(value) {
    if (typeof value !== 'string') {
        return value;
    }
    const parts = value
        .split('/')
        .map((item) => item.trim())
        .filter(Boolean);
    if (parts.length > 1) {
        return parts.join(', ');
    }
    return value.trim();
}
function normalizeCommaDelimitedValue(value) {
    if (typeof value !== 'string') {
        return value;
    }
    return value.replace(/,(?!\s)/g, ', ');
}
function hasCoverUrl(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'url' in value &&
        typeof value.url === 'string');
}
function getDoubanPlatformLinks() {
    const platformContainer = findElement({
        selector: '#content .game-attr',
        subSelector: 'dt',
        sibling: true,
        keyWord: '平台',
    });
    if (!platformContainer) {
        return [];
    }
    return Array.from(platformContainer.querySelectorAll('a'));
}
function getDoubanDescriptionInfos() {
    const result = [];
    const inputList = document.querySelectorAll('input[name="target"][type="hidden"]');
    inputList.forEach(($input) => {
        var _a;
        if ($input.value !== 'description') {
            return;
        }
        const $target = (_a = $input
            .closest('form')) === null || _a === void 0 ? void 0 : _a.querySelector('.desc-form-item #thing_desc_options_0');
        if ($target) {
            result.push({
                name: '游戏简介',
                value: $target.value,
                category: 'subject_summary',
            });
        }
    });
    return result;
}
function getDoubanMusicFieldValue($field) {
    var _a, _b;
    const anchors = Array.from($field.querySelectorAll('a'));
    if (anchors.length) {
        return anchors
            .map((anchor) => { var _a, _b; return (_b = (_a = anchor.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; })
            .filter(Boolean)
            .join('、');
    }
    const nextNode = $field.nextSibling;
    if ((nextNode === null || nextNode === void 0 ? void 0 : nextNode.nodeType) === Node.TEXT_NODE) {
        return (_b = (_a = nextNode.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    }
    return '';
}
function getDoubanMusicTracks() {
    const durationReg = /\s*\d{1,2}:\d{1,2}$/;
    return Array.from(document.querySelectorAll('.track-list ul.track-items > li'))
        .map((item) => {
        var _a, _b, _c;
        const order = Number.parseInt((_a = item.getAttribute('data-track-order')) !== null && _a !== void 0 ? _a : '0', 10);
        const titleRaw = (_c = (_b = item.textContent) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
        const durationMatch = titleRaw.match(durationReg);
        if (durationMatch) {
            return {
                title: titleRaw.replace(durationReg, '').trim(),
                duration: durationMatch[0].trim(),
                order: Number.isNaN(order) ? 0 : order,
            };
        }
        return {
            title: titleRaw,
            order: Number.isNaN(order) ? 0 : order,
        };
    })
        .filter((track) => track.title);
}
function groupDoubanTracksByDisc(tracks) {
    const discList = [];
    let currentDisc = [];
    for (const track of tracks) {
        if (track.order === 0) {
            if (currentDisc.length) {
                discList.push(currentDisc);
                currentDisc = [];
            }
            continue;
        }
        currentDisc.push(track);
    }
    if (currentDisc.length) {
        discList.push(currentDisc);
    }
    return discList;
}

const doubanGameTools = {
    hooks: {
        async beforeCreate() {
            const href = window.location.href;
            if (/\/game\//.test(href) && !/\/game\/\d+\/edit/.test(href)) {
                const modifyUrl = getDoubanModifyUrl();
                if (!modifyUrl) {
                    return;
                }
                return {
                    payload: {
                        auxSite: {
                            url: modifyUrl,
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
            var _a, _b;
            const result = [];
            for (const info of infos) {
                if (['平台', '别名'].includes(info.name)) {
                    result.push(...splitInfoValues(info, '/'));
                    continue;
                }
                if (info.category === 'cover') {
                    result.push({ ...info });
                    continue;
                }
                const normalizedValue = normalizeSlashDelimitedValue(info.value);
                const nextValue = info.name === '游戏类型' && typeof normalizedValue === 'string'
                    ? normalizedValue.replace(/^游戏,\s*/, '').trim()
                    : normalizedValue;
                result.push({
                    ...info,
                    value: nextValue,
                });
            }
            for (const link of getDoubanPlatformLinks()) {
                result.push({
                    name: '平台',
                    value: (_b = (_a = link.textContent) === null || _a === void 0 ? void 0 : _a.replace(/\/.*/, '').trim()) !== null && _b !== void 0 ? _b : '',
                    category: 'platform',
                });
            }
            return result;
        },
    },
    filters: [],
};

const doubanGameIntegration = defineSiteIntegration({
    site: doubanGameSubject,
    tools: doubanGameTools,
});

const doubanGameEditSubject = {
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
doubanGameEditSubject.itemList.push({
    name: '游戏名',
    selector: [
        {
            ...gameAttr$1,
            keyWord: '原名',
        },
        {
            ...gameAttr$1,
            keyWord: '中文名',
        },
    ],
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: [
        {
            ...gameAttr$1,
            keyWord: '发行日期',
        },
        {
            ...gameAttr$1,
            keyWord: '预计上市时间',
        },
    ],
    category: 'date',
}, {
    name: '平台',
    selector: {
        ...gameAttr$1,
        keyWord: '平台',
    },
    category: 'platform',
}, {
    name: '中文名',
    selector: {
        ...gameAttr$1,
        keyWord: '中文名',
    },
    category: 'alias',
}, {
    name: '别名',
    selector: {
        ...gameAttr$1,
        keyWord: '别名',
    },
    category: 'alias',
}, {
    name: '游戏类型',
    selector: {
        ...gameAttr$1,
        keyWord: '类型',
    },
}, {
    name: '开发',
    selector: {
        ...gameAttr$1,
        keyWord: '开发商',
    },
}, {
    name: '发行',
    selector: {
        ...gameAttr$1,
        keyWord: '发行商',
    },
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
    selector: {
        ...gameAttr$1,
        keyWord: '图标',
        nextSelector: {
            selector: 'img',
        },
    },
    category: 'cover',
});

const doubanGameEditTools = {
    hooks: {
        async beforeCreate() {
            const href = window.location.href;
            return /\/game\/\d+\/edit/.test(href);
        },
        async afterGetWikiData(infos) {
            const result = [];
            for (const info of infos) {
                if (['平台', '别名'].includes(info.name)) {
                    result.push(...splitInfoValues(info, ',', DOUBAN_GAME_PLATFORM_MAP));
                    continue;
                }
                if (info.category === 'cover' && hasCoverUrl(info.value)) {
                    try {
                        const url = info.value.url.replace('/spic/', '/lpic/');
                        const dataUrl = await getImageDataByURL(url);
                        result.push({
                            ...info,
                            value: {
                                dataUrl,
                                url,
                            },
                        });
                    }
                    catch (error) {
                        console.error(error);
                    }
                    continue;
                }
                if (info.name === '游戏类型' || info.name === '开发') {
                    result.push({
                        ...info,
                        value: normalizeCommaDelimitedValue(info.value),
                    });
                    continue;
                }
                result.push({ ...info });
            }
            result.push(...getDoubanDescriptionInfos());
            return result;
        },
    },
    filters: [],
};

const doubanGameEditIntegration = defineSiteIntegration({
    site: doubanGameEditSubject,
    tools: doubanGameEditTools,
});

// ref links
// https://music.douban.com/subject/36072428/
// https://music.douban.com/subject/34956124/
const doubanMusicSubject = {
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
doubanMusicSubject.itemList.push({
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

const doubanMusicTools = {
    hooks: {
        async afterGetWikiData(infos) {
            var _a;
            const result = [...infos];
            const $info = document.querySelector('#info');
            if ($info) {
                $info.querySelectorAll('.pl').forEach(($field) => {
                    var _a, _b;
                    const key = (_b = (_a = $field.textContent) === null || _a === void 0 ? void 0 : _a.trim().split(':')[0]) !== null && _b !== void 0 ? _b : '';
                    const target = DOUBAN_MUSIC_FIELD_MAP[key];
                    const value = getDoubanMusicFieldValue($field);
                    if (!target || !value) {
                        return;
                    }
                    result.push({
                        ...target,
                        value,
                    });
                });
            }
            const discCountValue = (_a = result.find((item) => item.name === '碟片数量')) === null || _a === void 0 ? void 0 : _a.value;
            const discCount = Number.parseInt(String(discCountValue !== null && discCountValue !== void 0 ? discCountValue : '1'), 10) || 1;
            const discList = groupDoubanTracksByDisc(getDoubanMusicTracks());
            if (discList.length && discList.length === discCount) {
                result.push({
                    category: 'ep',
                    name: '',
                    value: discList,
                });
            }
            else {
                console.warn('碟片数量不匹配', discCount, discList);
            }
            return result;
        },
    },
    filters: [],
};

const doubanMusicIntegration = defineSiteIntegration({
    site: doubanMusicSubject,
    tools: doubanMusicTools,
});

const erogamescapeSubject = {
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
erogamescapeSubject.itemList.push({
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
erogamescapeSubject.defaultInfos = [
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

const erogamescapeIntegration = defineSiteIntegration({
    site: erogamescapeSubject,
    tools: erogamescapeTools,
});

const getchuChara = {
    key: 'getchu_game_chara',
    siteKey: 'getchu_game',
    description: 'Getchu 游戏角色',
    host: ['getchu.com', 'www.getchu.com'],
    controlMode: 'inline',
    type: SubjectTypeId.game,
    itemSelector: {
        selector: '.chara-text .chara-name',
    },
    presenceSelector: {
        selector: '#wrapper',
        subSelector: '.tabletitle',
        sibling: true,
        keyWord: ['キャラクター', '角色'],
    },
    itemList: [],
};

const getchuSubject = {
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
const commonSelector$1 = {
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
const configArr$2 = Object.keys(dict).map((key) => {
    const r = {
        name: dict[key],
        selector: {
            // 匹配关键字开头 2020/03/18
            keyWord: createStartsWithPattern(key),
            ...commonSelector$1,
        },
    };
    if (key === '発売日') {
        r.category = 'date';
    }
    return r;
});
getchuSubject.itemList.push({
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
}, ...configArr$2, {
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
            keyWord: ['作品紹介', 'あらすじ'],
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
getchuSubject.defaultInfos = [
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

const GETCHU_CHARA_NAME_SELECTOR = '.chara-name';
const getchuCharacterInfoNameDict = {
    誕生日: '生日',
    '3サイズ': 'BWH',
    スリーサイズ: 'BWH',
    身長: '身高',
    血液型: '血型',
};
function getCharacterNameElement($t) {
    var _a, _b;
    if ($t.matches(GETCHU_CHARA_NAME_SELECTOR)) {
        return $t;
    }
    return (_b = (_a = $t.closest('dt')) === null || _a === void 0 ? void 0 : _a.querySelector(GETCHU_CHARA_NAME_SELECTOR)) !== null && _b !== void 0 ? _b : null;
}
function normalizeCharacterName(rawName) {
    return rawName.split(/（|\(|\sCV|新建角色/)[0];
}
const getchuTools = {
    dealTitle(str = '') {
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
        var _a, _b, _c;
        const charaData = [];
        const $name = getCharacterNameElement($t);
        if (!$name)
            return charaData;
        const $dt = $name.closest('dt');
        if (!$dt)
            return charaData;
        let name;
        if ($name.querySelector('charalist')) {
            const $charalist = $name.querySelector('charalist');
            name = getText($charalist);
        }
        else {
            if ($name.classList.contains('chara-name') && $name.querySelector('br')) {
                const brText = ((_b = (_a = $name.querySelector('br')) === null || _a === void 0 ? void 0 : _a.nextSibling) === null || _b === void 0 ? void 0 : _b.textContent) || getText($name);
                name = normalizeCharacterName(brText);
            }
            else {
                name = normalizeCharacterName(getText($name));
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
        const kanaMatch = nameTxt.match(/（(.+?)）/);
        if (kanaMatch) {
            charaData.push({
                name: '纯假名',
                value: kanaMatch[1],
            });
        }
        const cvMatch = nameTxt.match(/CV[：:]\s*(.+)$/);
        if (cvMatch) {
            charaData.push({
                name: 'CV',
                value: cvMatch[1].replace(/\s/g, ''),
            });
        }
        const $img = (_c = $t.closest('tr')) === null || _c === void 0 ? void 0 : _c.querySelector('td > img');
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
        const $dd = $dt.nextElementSibling;
        if (!$dd) {
            return charaData;
        }
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
        charaData.forEach((item) => {
            if (getchuCharacterInfoNameDict[item.name]) {
                item.name = getchuCharacterInfoNameDict[item.name];
            }
        });
        return charaData;
    },
};
const getchuCharaTools = {
    hooks: {
        async afterGetWikiData(infos, _model, $el) {
            return [...infos, ...getchuTools.getCharacterInfo($el)];
        },
    },
};
const getchuSubjectTools = {
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

const getchuIntegration = defineSiteIntegration({
    site: getchuSubject,
    tools: getchuSubjectTools,
    characters: [
        {
            model: getchuChara,
            tools: getchuCharaTools,
        },
    ],
});

const jdBookSubject = {
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
jdBookSubject.itemList.push({
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
    selector: {
        ...descSelector$1,
        keyWord: 'ISBN',
    },
    category: 'ISBN',
}, {
    name: '发售日',
    selector: {
        ...descSelector$1,
        keyWord: '出版时间',
    },
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
    selector: {
        ...descSelector$1,
        keyWord: '出版社',
    },
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

const jdBookTools = {
    filters: [
        {
            category: 'subject_title',
            dealFunc(str) {
                return trimParenthesis(str);
            },
        },
    ],
};

const jdBookIntegration = defineSiteIntegration({
    site: jdBookSubject,
    tools: jdBookTools,
});

const moepediaSubject = {
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
moepediaSubject.itemList.push({
    name: '游戏名',
    selector: {
        selector: 'div.gme-Contents h2',
    },
    category: 'subject_title',
}, {
    name: '发行日期',
    selector: [
        {
            ...topTableSelector,
            keyWord: '発売日',
        },
    ],
    pipes: ['date'],
}, {
    name: '售价',
    selector: [
        {
            ...topTableSelector,
            keyWord: '価格',
        },
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
    selector: {
        ...middleTableSelector,
        keyWord: ['原画'],
    },
}, {
    name: '开发',
    selector: {
        ...middleTableSelector,
        keyWord: ['ブランド'],
    },
}, {
    name: '剧本',
    selector: {
        ...middleTableSelector,
        keyWord: ['シナリオ'],
    },
}, {
    name: '游戏类型',
    selector: {
        ...middleTableSelector,
        keyWord: ['ジャンル'],
    },
}, {
    name: '音乐',
    selector: {
        ...middleTableSelector,
        keyWord: ['音楽'],
    },
}, {
    name: '主题歌演唱',
    selector: {
        ...middleTableSelector,
        keyWord: ['歌手'],
    },
});
moepediaSubject.defaultInfos = [
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
                let val = getStringValue(info.value);
                if (info.name === '游戏名') {
                    val = dealTitle(val);
                }
                else if (['原画', '剧本', '音乐', '主题歌演唱', '游戏类型'].includes(info.name)) {
                    val = val.replace(/\n\s*/g, ', ');
                }
                else if (info.name === '售价') {
                    val = val.replace(/.*¥/, '¥');
                }
                res.push({
                    ...info,
                    value: val,
                });
            }
            return res;
        },
    },
};

const moepediaIntegration = defineSiteIntegration({
    site: moepediaSubject,
    tools: moepediaTools,
});

const steamSubject = {
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
steamSubject.itemList.push({
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
steamSubject.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
];

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
                const newInfo = { ...info };
                if (info.name === 'website') {
                    const arr = getStringValue(newInfo.value).split('?url=');
                    newInfo.value = arr[1] || '';
                    newInfo.category = 'website,listItem';
                }
                res.push({
                    ...newInfo,
                });
            }
            if (location.hostname === 'store.steampowered.com') {
                res.push({
                    name: 'website',
                    value: `Steam|${location.origin + location.pathname}`,
                    category: 'website,listItem',
                });
            }
            return res;
        },
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

const steamIntegration = defineSiteIntegration({
    site: steamSubject,
    tools: steamTools,
});

const steamdbSubject = {
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
const commonSelector$2 = {
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
const configArr$3 = dictArr.map((item) => {
    const r = {
        name: item.name,
        selector: {
            keyWord: item.keyWord,
            ...commonSelector$2,
        },
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
steamdbSubject.itemList.push({
    name: '游戏名',
    selector: [
        // 默认使用日文名称，当条目名称
        {
            ...detailsTableSelector,
            keyWord: 'name_localized',
            nextSelector: {
                ...subTableSelector,
                keyWord: 'japanese',
            },
        },
        {
            selector: '.pagehead h1',
        },
    ],
    category: 'subject_title',
}, {
    name: '中文名',
    selector: [
        {
            ...detailsTableSelector,
            keyWord: 'name_localized',
            nextSelector: {
                ...subTableSelector,
                keyWord: 'schinese',
            },
        },
        {
            ...detailsTableSelector,
            keyWord: 'name_localized',
            nextSelector: {
                ...subTableSelector,
                keyWord: 'tchinese',
            },
        },
    ],
    category: 'alias',
}, {
    name: '游戏类型',
    selector: [
        {
            ...detailsTableSelector,
            keyWord: 'Primary Genre',
        }
    ],
    pipes: ['ta', 'p'],
}, {
    name: 'cover',
    selector: [
        {
            ...assetsTableSelector,
            keyWord: 'library_assets',
            nextSelector: {
                selector: 'table.web-assets',
                subSelector: 'td',
                keyWord: 'library_capsule',
                sibling: true,
                nextSelector: {
                    selector: 'a',
                },
            },
        },
        {
            ...assetsTableSelector,
            keyWord: 'Web Assets',
            nextSelector: {
                selector: 'table.web-assets',
                subSelector: 'td > a',
                keyWord: 'library_600x900',
            },
        },
    ],
    category: 'cover',
}, ...configArr$3, {
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
steamdbSubject.defaultInfos = [
    {
        name: '平台',
        value: 'PC',
        category: 'platform',
    },
];

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
                let newInfo = { ...info };
                const stringValue = getStringValue(info.value);
                if (info.name === '游戏引擎') {
                    newInfo.value = stringValue.replace(/^Engine\./g, '');
                }
                if (info.name === '游戏简介') {
                    if (stringValue.match(/\n.*?Steam charts, data, update history\.$/)) {
                        newInfo.value = stringValue.split('\n')[0];
                    }
                }
                if (info.name === 'cover') {
                    const coverValue = getCoverValue(info.value);
                    if (coverValue === null || coverValue === void 0 ? void 0 : coverValue.url) {
                        const a = coverValue.url;
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
                    res.push({
                        ...newInfo,
                    });
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
            [...document.querySelectorAll('#info > table > tbody > tr > td.span3')].forEach((item) => {
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
                    const gameName = res.find((info) => info.name === '游戏名');
                    const enName = names.find((name) => name.name === 'english');
                    const jpName = names.find((name) => name.name === 'japanese');
                    if (enName && gameName) {
                        if (getStringValue(gameName.value) !== enName.value) {
                            res.push({
                                name: '别名',
                                value: `英文|${enName.value}`,
                            });
                        }
                    }
                    if (jpName && gameName) {
                        if (getStringValue(gameName.value) !== jpName.value) {
                            res.push({
                                name: '别名',
                                value: `日文|${jpName.value}`,
                            });
                        }
                    }
                    const tchName = names.find((name) => name.name === 'tchinese');
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

const steamdbIntegration = defineSiteIntegration({
    site: steamdbSubject,
    tools: steamdbTools,
});

// ref links
// https://vgmdb.net/album/9683
// https://vgmdb.net/album/134285
// https://vgmdb.net/album/122607
// https://vgmdb.net/album/86808
const vgmdbSubject = {
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
const commonSelectors$3 = {
    selector: '#album_infobit_large',
    subSelector: 'tr > td:first-child',
    sibling: true,
};
const creditsSelectors = {
    selector: '#collapse_credits table',
    subSelector: 'tr > td:first-child',
    sibling: true,
};
vgmdbSubject.itemList.push(
// ---- Info table fields ----
{
    name: '厂牌',
    selector: [
        {
            ...commonSelectors$3,
            keyWord: 'Label',
        },
    ],
    pipes: ['ti'],
}, {
    name: '条形码',
    selector: [
        {
            ...commonSelectors$3,
            keyWord: 'Barcode',
        },
    ],
    pipes: ['t'],
}, {
    name: '发售日期',
    selector: [
        {
            ...commonSelectors$3,
            keyWord: 'Release Date',
            nextSelector: {
                selector: 'a',
            },
        },
    ],
    pipes: ['date'],
}, {
    name: '价格',
    selector: [
        {
            ...commonSelectors$3,
            keyWord: 'Price',
        },
    ],
}, {
    name: '版本特性',
    selector: [
        {
            ...commonSelectors$3,
            keyWord: 'Media Format',
        },
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
}, 
// ---- Credits fields ----
{
    name: '艺术家',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Performer', 'Vocalist'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '作曲',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Composer', 'Music Written by', 'Composed by', 'Music by'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '作词',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Lyricist', 'Lyrics', 'Lyrics Written by', 'Words by'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '编曲',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Arranger', 'Arranged by', 'Arrangement'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '声乐',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Vocal', 'Vocals', 'Chorus'],
        },
    ],
    pipes: ['ti'],
}, 
// 乐器: handled in afterGetWikiData (multiple credit rows)
{
    name: '录音',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Recording', 'Recording Engineer', 'Recorded by'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '混音',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Mixing', 'Mixing Engineer', 'Mixed by'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '母带制作',
    selector: [
        {
            ...creditsSelectors,
            keyWord: ['Mastering', 'Mastering Engineer', 'Mastered by'],
        },
    ],
    pipes: ['ti'],
}, {
    name: '制作人',
    selector: [
        {
            ...creditsSelectors,
            keyWord: [
                'Producer', 'Executive Producer', 'Music Producer',
                'Produced by', 'All Songs Produced by',
            ],
        },
    ],
    pipes: ['ti'],
}, {
    name: '插图',
    selector: [
        {
            ...creditsSelectors,
            keyWord: [
                'Illustrator', 'Illustration', 'Jacket Design',
                'Jacket Illustration', 'Cover Art', 'Art Direction',
            ],
        },
    ],
    pipes: ['ti'],
});

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
            // Clean up credits DOM before extraction:
            // 1. Remove reference markers: <span title="Referenced">*</span>
            // 2. Remove group affiliations: " (feel)" text nodes after <a> tags
            const credits = document.querySelector('#collapse_credits');
            if (credits) {
                credits
                    .querySelectorAll('span[title="Referenced"]')
                    .forEach((el) => el.remove());
                for (const td of credits.querySelectorAll('tr > td:nth-child(2)')) {
                    for (const node of [...td.childNodes]) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            node.textContent = node.textContent.replace(/\s*\([^)]*\)/g, '');
                        }
                    }
                }
            }
            return true;
        },
        async afterGetWikiData(infos) {
            var _a, _b, _c;
            const res = [];
            const $h1 = document.querySelector('#innermain > h1');
            res.push({
                name: '唱片名',
                value: $h1.innerText,
                category: 'subject_title',
            });
            // Alternative titles as aliases
            const titleSpans = document.querySelectorAll('h1 span.albumtitle');
            const primaryText = $h1.innerText.trim();
            const seen = new Set([primaryText]);
            for (const span of titleSpans) {
                const text = span.textContent
                    .replace(/^\s*\/\s*/, '')
                    .trim();
                if (text && !seen.has(text)) {
                    res.push({
                        name: '别名',
                        value: text,
                        category: 'alias',
                    });
                    seen.add(text);
                }
            }
            for (const item of infos) {
                const stringValue = getStringValue(item.value);
                if (item.name === '价格' && stringValue.includes('Not for Sale')) {
                    continue;
                }
                if (item.name === '版本特性' && /\d+/.test(stringValue)) {
                    res.push({
                        ...item,
                        value: stringValue.replace(/\d+/, '').trim(),
                    });
                    continue;
                }
                if (item.name === '目录编号') {
                    res.push({
                        ...item,
                        value: stringValue.trim().split(' ')[0].trim(),
                    });
                    continue;
                }
                res.push(item);
            }
            // Publisher (出版方) — only if different from Label
            const labelValue = ((_a = infos.find((i) => i.name === '厂牌')) === null || _a === void 0 ? void 0 : _a.value) || '';
            const infoTable = document.querySelector('#rightfloat');
            if (infoTable) {
                for (const tr of infoTable.querySelectorAll('tr.maincred')) {
                    const labelTd = tr.querySelector('td:first-child');
                    if (labelTd && labelTd.textContent.trim() === 'Publisher') {
                        const valueTd = tr.querySelector('td:nth-child(2)');
                        if (valueTd) {
                            const pubValue = valueTd.innerText.trim();
                            if (pubValue && pubValue !== labelValue) {
                                res.push({ name: '出版方', value: pubValue });
                            }
                        }
                    }
                }
            }
            // Instruments — collect all matching credit rows
            const instrumentKeywords = /^(Guitars?|Electric Guitars?|Acoustic Guitars?|Bass|Electric Bass|Drums?|Percussion|Piano|Acoustic Piano|Keyboard|Keyboards|Synthesizer|Synth|Violin|Viola|Cello|Strings|Flute|Oboe|Trumpet|Saxophone|Harmonica|All Instruments|All Other Instruments|Instruments)$/i;
            const creditSection = document.querySelector('#collapse_credits table');
            if (creditSection) {
                const instrumentists = [];
                for (const tr of creditSection.querySelectorAll('tr.maincred, tr.extracred')) {
                    const roleTd = tr.querySelector('td:first-child');
                    if (!roleTd)
                        continue;
                    // Use the en span's title for role matching to avoid mixed-language textContent
                    const enSpan = roleTd.querySelector('.artistname[lang="en"]');
                    const roleText = enSpan
                        ? (enSpan.title || enSpan.textContent).trim()
                        : roleTd.innerText.trim();
                    if (instrumentKeywords.test(roleText)) {
                        const valueTd = tr.querySelector('td:nth-child(2)');
                        if (valueTd) {
                            const names = valueTd.innerText.trim();
                            if (names)
                                instrumentists.push(names);
                        }
                    }
                }
                if (instrumentists.length) {
                    res.push({ name: '乐器', value: instrumentists.join('、') });
                }
            }
            // Disc count
            const tracklist = document.querySelector('#tracklist');
            if (tracklist) {
                const discHeaders = tracklist.querySelectorAll('.tl b');
                let discCount = 0;
                discHeaders.forEach((b) => {
                    if (/^Disc\s+\d+$/i.test(b.textContent.trim()))
                        discCount++;
                });
                if (discCount > 0) {
                    res.push({ name: '碟片数量', value: String(discCount) });
                }
            }
            // VGMdb link
            const canonical = document.querySelector('link[rel="canonical"]');
            const vgmdbUrl = (canonical === null || canonical === void 0 ? void 0 : canonical.href) || location.href.replace(/\?.*$/, '');
            if (vgmdbUrl) {
                res.push({ name: '链接', value: vgmdbUrl, category: 'listItem' });
            }
            // Cover image
            let url = (_b = document.querySelector('meta[property="og:image"]')) === null || _b === void 0 ? void 0 : _b.content;
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
            // Tracklist (episodes)
            if (tracklist) {
                let tableList = tracklist.querySelectorAll('.tl > table');
                (_c = document.querySelectorAll('#tlnav > li > a')) === null || _c === void 0 ? void 0 : _c.forEach((item) => {
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
                    name: '',
                    value: discArr,
                });
            }
            return res;
        },
    },
};

const vgmdbIntegration = defineSiteIntegration({
    site: vgmdbSubject,
    tools: vgmdbTools,
});

const siteIntegrations = [
    getchuIntegration,
    dlsiteIntegration,
    dmmIntegration,
    amazonJpBookIntegration,
    amazonJpMusicIntegration,
    dangdangBookIntegration,
    jdBookIntegration,
    doubanGameIntegration,
    doubanGameEditIntegration,
    doubanMusicIntegration,
    erogamescapeIntegration,
    steamIntegration,
    steamdbIntegration,
    adultcomicIntegration,
    moepediaIntegration,
    vgmdbIntegration,
];
const characterIntegrations = siteIntegrations.flatMap((integration) => { var _a; return (_a = integration.characters) !== null && _a !== void 0 ? _a : []; });
function buildSiteToolsMap(integrations) {
    return integrations.reduce((acc, integration) => {
        if (integration.tools) {
            acc[integration.site.key] = integration.tools;
        }
        return acc;
    }, {});
}
function buildCharacterToolsMap(integrations) {
    return integrations.reduce((acc, integration) => {
        if (integration.tools) {
            acc[integration.model.key] = integration.tools;
        }
        return acc;
    }, {});
}
const siteToolsMap = buildSiteToolsMap(siteIntegrations);
const characterToolsMap = buildCharacterToolsMap(characterIntegrations);
const noOpBeforeCreate = async () => true;
const noOpSubjectAfterGetWikiData = async (infos) => infos;
const noOpCharacterAfterGetWikiData = async (infos) => infos;
function identity(x) {
    return x;
}
function findModelByHost(host) {
    return siteIntegrations
        .map((integration) => integration.site)
        .filter((model) => model.host.includes(host));
}
function getCharacterModels(key) {
    return characterIntegrations
        .filter((integration) => integration.model.siteKey === key)
        .map((integration) => integration.model);
}
function getSiteTools(key) {
    return siteToolsMap[key];
}
function getCharacterTools(key) {
    return characterToolsMap[key];
}
function getSubjectHooks(siteConfig, timing) {
    var _a;
    const hooks = (_a = getSiteTools(siteConfig.key)) === null || _a === void 0 ? void 0 : _a.hooks;
    if (!hooks) {
        return timing === 'beforeCreate'
            ? noOpBeforeCreate
            : noOpSubjectAfterGetWikiData;
    }
    return hooks[timing] || (timing === 'beforeCreate'
        ? noOpBeforeCreate
        : noOpSubjectAfterGetWikiData);
}
function getCharacterHooks(config, timing = 'afterGetWikiData') {
    var _a;
    const hooks = (_a = getCharacterTools(config.key)) === null || _a === void 0 ? void 0 : _a.hooks;
    if (!hooks) {
        return noOpCharacterAfterGetWikiData;
    }
    return hooks[timing] || noOpCharacterAfterGetWikiData;
}
function dealFuncByCategory(key, category) {
    var _a, _b;
    const filter = category
        ? (_b = (_a = getSiteTools(key)) === null || _a === void 0 ? void 0 : _a.filters) === null || _b === void 0 ? void 0 : _b.find((item) => item.category === category)
        : undefined;
    if (filter === null || filter === void 0 ? void 0 : filter.dealFunc) {
        return filter.dealFunc;
    }
    return (str = '') => identity((str !== null && str !== void 0 ? str : '').trim());
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
    const $button = $div.querySelector('.e-wiki-new-character');
    const $sel = $div.querySelector('.e-bnwh-select');
    if (!$button || !$sel) {
        return;
    }
    $button.addEventListener('click', async (e) => {
        await cb(e, $sel.value);
    });
}

const pipeFnDict = {
    // t: 去除开头和结尾的空格
    t: trimSpace,
    // ta: 去除所有空格
    ta: trimAllSpace,
    // ti: 去除空格，在 getWikiItem 里面，使用 innerText 取文本
    ti: trimSpace,
    // k: 去除关键字;
    k: (pipe, keyWords = []) => trimKeywords(pipe, Array.isArray(keyWords) ? keyWords.filter(isTextPattern) : []),
    // p: 括号
    p: trimParenthesis$1,
    // pn: 括号不含数字
    pn: trimParenthesisN,
    // num: 提取数字
    num: getNum,
    date: getDate,
    // label: 去掉前缀标签，例如 “作者:”
    label: trimLeadingLabel,
};
function getStr(pipe) {
    var _a;
    return ((_a = pipe.out) !== null && _a !== void 0 ? _a : pipe.rawInfo).trim();
}
function trim(pipe, patterns) {
    let str = getStr(pipe);
    if (!patterns.length) {
        return {
            ...pipe,
            out: str,
        };
    }
    return {
        ...pipe,
        out: replaceTextPatterns(str, patterns),
    };
}
function trimAllSpace(pipe) {
    let str = getStr(pipe);
    return {
        ...pipe,
        out: str.replace(/\s/g, ''),
    };
}
function trimSpace(pipe) {
    let str = getStr(pipe);
    return {
        ...pipe,
        out: str.trim(),
    };
}
function trimParenthesis$1(pipe) {
    return trim(pipe, [/\(.*?\)/, /（.*?）/]);
}
// 保留括号里面的数字. 比如一些图书的 1 2 3
function trimParenthesisN(pipe) {
    return trim(pipe, [/\([^\d]*?\)/, /（[^\d]*?）/]);
}
function createKeywordPatterns(keyWords = []) {
    return keyWords.map((pattern) => {
        if (pattern instanceof RegExp) {
            const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
            return new RegExp(`${pattern.source}\\s*?(:|：)?`, flags);
        }
        return new RegExp(`${getTextPatternSource(pattern)}\\s*?(:|：)?`, 'g');
    });
}
function trimKeywords(pipe, keyWords = []) {
    return trim(pipe, createKeywordPatterns(keyWords));
}
function trimLeadingLabel(pipe) {
    return {
        ...pipe,
        out: getStr(pipe).replace(/[^\d:]+?(:|：)/, '').trim(),
    };
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
    var _a;
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
    return (_a = current.out) !== null && _a !== void 0 ? _a : str;
}

function getCurrentPageUrl() {
    return typeof location === 'undefined' ? '' : location.href;
}
async function getCover($d, site, context = {}) {
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
        const currentPageUrl = getCurrentPageUrl();
        if (!/^https?:/.test(url) && (context.sourceUrl || currentPageUrl)) {
            url = new URL(url, context.sourceUrl || currentPageUrl).href;
        }
        // 跨域的图片不能用这种方式
        let opts = {};
        if (site.includes('getchu')) {
            const referer = context.imageReferer || currentPageUrl;
            opts.headers = referer
                ? {
                    Referer: referer,
                }
                : undefined;
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

const preservedCategories = new Set([
    'subject_title',
    'subject_summary',
    'alias',
    'crt_name',
    'crt_summary',
]);
function createKeywordPipeArgsDict(keyWords = []) {
    return keyWords.length
        ? {
            k: [keyWords],
        }
        : {};
}
function normalizePreservedText(str) {
    return dealTextByPipe(str, ['t']);
}
function normalizeInfoText(str, keyWords = []) {
    return dealTextByPipe(str, ['p', 'k', 'label', 't'], createKeywordPipeArgsDict(keyWords));
}
function normalizeTextByCategory(str, category = '', keyWords = []) {
    if (preservedCategories.has(category)) {
        return normalizePreservedText(str);
    }
    return normalizeInfoText(str, keyWords);
}

function resolveSelectorMatch(selector, root) {
    if (selector instanceof Array) {
        for (const candidate of selector) {
            const match = resolveSelectorMatch(candidate, root);
            if (match) {
                return match;
            }
        }
        return;
    }
    const element = findElement(selector, root);
    if (!element) {
        return;
    }
    return {
        element,
        selector,
    };
}
function getSelectorKeyWords(selector) {
    return toTextPatterns(selector.keyWord);
}
function isCoverCategory(category) {
    return category === 'cover' || category === 'crt_cover';
}
function isSummaryCategory(category) {
    return category === 'subject_summary' || category === 'crt_summary';
}
function shouldUseInnerText(category, infoConfig) {
    var _a;
    return isSummaryCategory(category) || Boolean((_a = infoConfig.pipes) === null || _a === void 0 ? void 0 : _a.includes('ti'));
}
function readRawText(element, category, infoConfig) {
    var _a;
    const target = element;
    if (shouldUseInnerText(category, infoConfig)) {
        const innerText = getInnerText(target);
        if (innerText || ((_a = infoConfig.pipes) === null || _a === void 0 ? void 0 : _a.includes('ti'))) {
            return innerText;
        }
    }
    return getText(target);
}
function transformTextValue(rawText, infoConfig, site, category, keyWords) {
    var _a;
    const pipeArgsDict = createKeywordPipeArgsDict(keyWords);
    if ((_a = infoConfig.pipes) === null || _a === void 0 ? void 0 : _a.length) {
        return dealTextByPipe(rawText, infoConfig.pipes, pipeArgsDict);
    }
    const normalizedText = normalizeTextByCategory(rawText, category, keyWords);
    if (category === 'date') {
        return dealFuncByCategory(site, category)(normalizedText);
    }
    if (category === 'subject_title' ||
        category === 'alias' ||
        isSummaryCategory(category)) {
        return dealFuncByCategory(site, category)(normalizedText);
    }
    return normalizedText;
}
function postProcessValue(category, value) {
    if (category === 'creator') {
        return dealTextByPipe(getStringValue(value), ['ta']);
    }
    return value;
}
async function extractItemValue(infoConfig, site, context, element, keyWords) {
    const category = infoConfig.category || '';
    if (isCoverCategory(category)) {
        return getCover(element, site, context);
    }
    if (category === 'website') {
        return dealFuncByCategory(site, 'website')(element.getAttribute('href'));
    }
    const rawText = readRawText(element, category, infoConfig);
    const value = transformTextValue(rawText, infoConfig, site, category, keyWords);
    return postProcessValue(category, value);
}
async function getWikiItem(infoConfig, site, context = {}) {
    if (!infoConfig)
        return;
    const match = resolveSelectorMatch(infoConfig.selector, context.root);
    if (!match)
        return;
    const keyWords = getSelectorKeyWords(match.selector);
    const val = await extractItemValue(infoConfig, site, context, match.element, keyWords);
    if (val) {
        return {
            name: infoConfig.name,
            value: val,
            category: infoConfig.category,
        };
    }
}
function isSingleInfo(info) {
    return Boolean(info);
}
async function getWikiItems(itemList, site, context) {
    const results = await Promise.allSettled(itemList.map((item) => getWikiItem(item, site, context)));
    return results.flatMap((result, index) => {
        var _a;
        if (result.status === 'fulfilled') {
            return isSingleInfo(result.value) ? [result.value] : [];
        }
        console.error(`[extract] failed to get wiki item: ${(_a = itemList[index]) === null || _a === void 0 ? void 0 : _a.name}`, result.reason);
        return [];
    });
}
function applyHookResult(rawInfo, hookRes) {
    return Array.isArray(hookRes) ? hookRes : rawInfo;
}
async function getWikiData(siteConfig, context = {}) {
    const rawInfo = await getWikiItems(siteConfig.itemList, siteConfig.key, context);
    const defaultInfos = siteConfig.defaultInfos || [];
    const hookRes = await getSubjectHooks(siteConfig, 'afterGetWikiData')(rawInfo, siteConfig);
    return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
}
async function getCharaData(model, context = {}) {
    const rawInfo = await getWikiItems(model.itemList, model.siteKey, context);
    const defaultInfos = model.defaultInfos || [];
    const hookRes = await getCharacterHooks(model, 'afterGetWikiData')(rawInfo, model, context.root);
    return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
}

/**
 * 过滤搜索结果： 通过名称以及日期
 * @param items
 * @param subjectInfo
 * @param opts
 */
function filterResults(items, subjectInfo, opts = {}, isSearch = true) {
    var _a, _b, _c;
    if (!items.length)
        return;
    // 只有一个结果时直接返回, 不再比较日期
    if (items.length === 1 && isSearch) {
        const result = items[0];
        return result;
        // if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
        // }
    }
    const searchName = (_a = subjectInfo.name) === null || _a === void 0 ? void 0 : _a.trim();
    if (!searchName) {
        return;
    }
    const results = new Fuse(items, { ...opts }).search(searchName);
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
    const nameRe = new RegExp(searchName);
    for (const item of results) {
        const result = item.item;
        if (nameRe.test(result.name) || nameRe.test((_b = result.greyName) !== null && _b !== void 0 ? _b : '')) {
            return result;
        }
    }
    return (_c = results[0]) === null || _c === void 0 ? void 0 : _c.item;
}
function toStringValue(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    return String(value);
}
function getQueryInfo(items) {
    const info = {};
    items.forEach((item) => {
        const value = toStringValue(item.value);
        if (!value) {
            return;
        }
        if (item.category === 'subject_title') {
            info.name = value;
        }
        if (item.category === 'date') {
            info.releaseDate = value;
        }
        if (item.category === 'ASIN') {
            info.asin = value;
        }
        if (item.category === 'ISBN') {
            info.isbn = value;
        }
    });
    return info;
}

function normalizeHookResult(hookRes) {
    if (!hookRes) {
        return false;
    }
    if (hookRes === true) {
        return {
            payload: {},
        };
    }
    return {
        payload: hookRes.payload || {},
    };
}
async function initSourceSubject(siteConfig, runtime) {
    const $page = findElement(siteConfig.pageSelectors);
    if (!$page)
        return;
    const $title = findElement(siteConfig.controlSelector);
    if (!$title)
        return;
    const normalizedHookRes = normalizeHookResult(await getSubjectHooks(siteConfig, 'beforeCreate')());
    if (!normalizedHookRes)
        return;
    const { payload } = normalizedHookRes;
    console.info(siteConfig.description, ' content script init');
    insertControlBtn($title, async (_e, shouldCheckDup) => {
        var _a;
        const infos = await getWikiData(siteConfig);
        await ((_a = runtime.hydrateSubjectCover) === null || _a === void 0 ? void 0 : _a.call(runtime, infos));
        console.info('wiki info list: ', infos);
        const wikiData = {
            type: siteConfig.type,
            subtype: siteConfig.subType || 0,
            infos,
        };
        await runtime.submitSubjectCreation({
            siteConfig,
            wikiData,
            queryInfo: getQueryInfo(infos),
            payload,
            shouldCheckDup: !!shouldCheckDup,
        });
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
        return [{ ...current }];
    }
    else if (auxPrefs.targetNames === 'all' ||
        (auxPrefs.targetNames && auxPrefs.targetNames.includes(target.name))) {
        return [{ ...target }];
    }
    const obj = { ...current, ...target };
    const currentValue = getStringValue(current.value);
    const targetValue = getStringValue(target.value);
    if (current.category === 'subject_title') {
        // 中日  日英  中英
        let cnName = { name: '中文名', value: '' };
        let titleObj = { ...current };
        let otherName = { name: '别名', value: '', category: 'alias' };
        let chineseStr = getTargetStr(currentValue, targetValue, isChineseStr);
        let jpStr = getTargetStr(currentValue, targetValue, hasJpStr);
        // TODO 状态机？
        if (chineseStr) {
            cnName.value = chineseStr;
            if (currentValue === chineseStr) {
                titleObj.value = targetValue;
            }
            else {
                titleObj.value = currentValue;
            }
        }
        if (jpStr) {
            titleObj.value = jpStr;
            if (!chineseStr) {
                if (currentValue === jpStr) {
                    otherName.value = targetValue;
                }
                else {
                    otherName.value = currentValue;
                }
            }
        }
        return [titleObj, cnName, otherName];
    }
    if (['游戏简介', '开发', '发行'].includes(current.name)) {
        return [{ ...current }];
    }
    if (currentValue.length < targetValue.length) {
        obj.value = targetValue;
    }
    else {
        obj.value = currentValue;
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

function createWikiExtractContext(root, pageContext = {}) {
    return root
        ? {
            ...pageContext,
            root,
        }
        : { ...pageContext };
}
function createRemoteWikiPageContext(url) {
    return {
        sourceUrl: url,
        imageReferer: url,
    };
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
            return await getWikiData(model, createWikiExtractContext($doc, createRemoteWikiPageContext(url)));
        }
        catch (error) {
            return [];
        }
    }
    return [];
}

function buildAuxSiteLink(url) {
    return genAnonymousLinkText(url, url);
}
function buildUnavailableMessage() {
    return `打开上面链接确认是否能访问以及有信息，再尝试`;
}
async function updateSubjectDraftFromAuxSite(payload, runtime) {
    const { url: auxSite, opts: auxSiteOpts = {}, prefs: auxPrefs = {}, } = payload;
    try {
        await runtime.notifier.notify({
            type: 'info',
            message: `抓取第三方网站信息中:<br/>${buildAuxSiteLink(auxSite)}`,
            duration: 0,
        });
        console.info('the start of updating aux data');
        const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
        console.info('auxiliary data: ', auxData);
        if (!auxData || (auxData && auxData.length === 0)) {
            await runtime.notifier.notify({
                type: 'error',
                message: `抓取信息为空<br/>
      ${buildAuxSiteLink(auxSite)}
      <br/>
      ${buildUnavailableMessage()}`,
                cmd: 'dismissNotError',
            });
        }
        else {
            await runtime.notifier.notify({
                type: 'info',
                message: `抓取第三方网站信息成功:<br/>${buildAuxSiteLink(auxSite)}`,
                cmd: 'dismissNotError',
            });
        }
        const wikiData = await runtime.storage.loadSubjectDraft();
        if (!wikiData) {
            throw new Error('wikiData is empty');
        }
        let infos = combineInfoList(wikiData.infos, auxData, auxPrefs);
        if (auxSite.match(/store\.steampowered\.com/)) {
            infos = combineInfoList(auxData, wikiData.infos);
        }
        await runtime.storage.saveSubjectDraft({
            type: wikiData.type,
            subtype: wikiData.subtype || 0,
            infos,
        });
        console.info('the end of updating aux data');
    }
    catch (error) {
        console.error(error);
        await runtime.notifier.notify({
            type: 'error',
            message: `抓取信息失败<br/>
      ${buildAuxSiteLink(auxSite)}
      <br/>
      ${buildUnavailableMessage()}`,
            cmd: 'dismissNotError',
        });
    }
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
    if (subjectInfo.isbn) {
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
    }
    // 默认使用名称搜索
    const searchResult = await searchSubject(subjectInfo, bgmHost, type);
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
    if ($sibling.parentElement) {
        $sibling.parentElement.insertBefore($log, $sibling.nextElementSibling);
    }
    return $log;
}
/**
 * 通过 iframe 获取表单
 * @param url 链接地址
 * @param formSelector 表单的 iframe
 * @returns Promise<HTMLFormElement>
 */
async function getFormByIframe(url, formSelector) {
    var _a;
    const iframeId = 'e-userjs-iframe';
    let $iframe = document.querySelector(`#${iframeId}`);
    if (!$iframe) {
        $iframe = document.createElement('iframe');
        $iframe.style.display = 'none';
        $iframe.id = iframeId;
        document.body.appendChild($iframe);
    }
    await loadIframe($iframe, url, 20000);
    const $form = (_a = $iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector(formSelector);
    if (!$form) {
        throw new Error(`form not found: ${formSelector}`);
    }
    return $form;
}

async function createNewSubjectEntry(payload, runtime) {
    if (payload.auxSite) {
        await runtime.updateAuxData(payload.auxSite);
    }
    await runtime.openNewSubject(payload.type);
}
async function checkSubjectAndOpenEntry(payload, runtime) {
    var _a, _b, _c, _d;
    if (!payload.subjectInfo) {
        await createNewSubjectEntry({
            type: payload.type,
            auxSite: payload.auxSite,
        }, runtime);
        return;
    }
    await runtime.notify({
        type: 'info',
        message: `搜索中...<br/>${(_b = (_a = payload.subjectInfo) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : ''}`,
        duration: 0,
    });
    let result = undefined;
    try {
        result = await checkSubjectExit(payload.subjectInfo, runtime.bgmHost, payload.type, payload.disableDate);
        console.info('search results: ', result);
        await runtime.notify({
            type: 'info',
            message: '',
            cmd: 'dismissNotError',
        });
    }
    catch (error) {
        console.log('fetch info err:', error, error === null || error === void 0 ? void 0 : error.message);
        await runtime.notify({
            type: 'error',
            message: `Bangumi 搜索匹配结果为空: <br/><b>${(_d = (_c = payload.subjectInfo) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : ''}</b>`,
            cmd: 'dismissNotError',
        });
    }
    if (result && result.url) {
        await runtime.saveSubjectId(getSubjectId(result.url));
        await runtime.openExistingSubject(result.url);
        return;
    }
    await createNewSubjectEntry({
        type: payload.type,
        auxSite: payload.auxSite,
    }, runtime);
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
            // background: '#F09199',
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

// 配置变量
const SCRIPT_PREFIX = 'E_USERJS_';
const AUTO_FILL_FORM = SCRIPT_PREFIX + 'autofill';
const WIKI_DATA = SCRIPT_PREFIX + 'wiki_data';
const CHARA_DATA = SCRIPT_PREFIX + 'chara_data';
const PROTOCOL = SCRIPT_PREFIX + 'protocol';
const BGM_DOMAIN = SCRIPT_PREFIX + 'bgm_domain';
const SUBJECT_ID = SCRIPT_PREFIX + 'subject_id';

const userScriptDraftStore = {
    async saveSubjectDraft(wikiData) {
        GM_setValue(WIKI_DATA, JSON.stringify(wikiData));
    },
    async loadSubjectDraft() {
        return JSON.parse(GM_getValue(WIKI_DATA) || 'null');
    },
    async saveCharacterDraft(charaData) {
        GM_setValue(CHARA_DATA, JSON.stringify(charaData));
    },
    async loadCharacterDraft() {
        return JSON.parse(GM_getValue(CHARA_DATA) || 'null');
    },
    async saveSubjectId(subjectId) {
        GM_setValue(SUBJECT_ID, subjectId);
    },
    async loadSubjectId() {
        return GM_getValue(SUBJECT_ID);
    },
    async loadBangumiPageState() {
        return {
            wikiData: JSON.parse(GM_getValue(WIKI_DATA) || 'null'),
            charaData: JSON.parse(GM_getValue(CHARA_DATA) || 'null'),
            subjectId: GM_getValue(SUBJECT_ID),
            shouldAutoFill: GM_getValue(AUTO_FILL_FORM) == 1,
            autoFillDelay: 300,
        };
    },
    async clearBangumiPageState() {
        GM_deleteValue(AUTO_FILL_FORM);
        GM_deleteValue(WIKI_DATA);
        GM_deleteValue(CHARA_DATA);
        GM_deleteValue(SUBJECT_ID);
    },
    async consumeAutoFill() {
        GM_setValue(AUTO_FILL_FORM, 0);
    },
};

const userScriptRuntimeCapabilities = {
    transport: {
        fetchHtml(url) {
            return fetchText(url);
        },
    },
    storage: userScriptDraftStore,
    navigator: {
        async openTab(url) {
            GM_openInTab(url);
        },
    },
    notifier: {
        notify(message) {
            return logMessage(message);
        },
    },
};

function getBangumiHost() {
    const protocol = GM_getValue(PROTOCOL) || 'https';
    const bgmDomain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
    return `${protocol}://${bgmDomain}`;
}
const defaultOpenTab = async (url) => {
    GM_openInTab(url);
};
function getOpenTab() {
    var _a, _b;
    return (_b = (_a = userScriptRuntimeCapabilities.navigator) === null || _a === void 0 ? void 0 : _a.openTab) !== null && _b !== void 0 ? _b : defaultOpenTab;
}
async function updateAuxData(payload) {
    var _a, _b;
    await updateSubjectDraftFromAuxSite(payload, {
        storage: userScriptRuntimeCapabilities.storage,
        notifier: {
            notify: (_b = (_a = userScriptRuntimeCapabilities.notifier) === null || _a === void 0 ? void 0 : _a.notify) !== null && _b !== void 0 ? _b : logMessage,
        },
    });
}
async function openNewSubject(type, delay = 200) {
    const openTab = getOpenTab();
    GM_setValue(AUTO_FILL_FORM, 1);
    setTimeout(() => {
        openTab(`${getBangumiHost()}/new_subject/${type}`);
    }, delay);
}
async function submitSubjectCreation({ wikiData, queryInfo, payload, shouldCheckDup, }) {
    const bgmHost = getBangumiHost();
    const subjectCreationRuntime = createUserScriptSubjectCreationRuntime(bgmHost);
    await userScriptRuntimeCapabilities.storage.saveSubjectDraft(wikiData);
    if (shouldCheckDup) {
        await checkSubjectAndOpenEntry({
            subjectInfo: queryInfo,
            type: wikiData.type,
            disableDate: payload === null || payload === void 0 ? void 0 : payload.disableDate,
            auxSite: payload === null || payload === void 0 ? void 0 : payload.auxSite,
        }, subjectCreationRuntime);
        return;
    }
    await createNewSubjectEntry({
        type: wikiData.type,
        auxSite: payload === null || payload === void 0 ? void 0 : payload.auxSite,
    }, subjectCreationRuntime);
}
async function submitCharacterCreation({ charaData, }) {
    GM_setValue(AUTO_FILL_FORM, 1);
    await userScriptRuntimeCapabilities.storage.saveCharacterDraft(charaData);
    await sleep(200);
    GM_openInTab(`${getBangumiHost()}/character/new`);
}
function createUserScriptSubjectCreationRuntime(bgmHost) {
    var _a, _b;
    const notify = (_b = (_a = userScriptRuntimeCapabilities.notifier) === null || _a === void 0 ? void 0 : _a.notify) !== null && _b !== void 0 ? _b : logMessage;
    const openTab = getOpenTab();
    return {
        bgmHost,
        notify,
        updateAuxData,
        saveSubjectId(subjectId) {
            return userScriptRuntimeCapabilities.storage.saveSubjectId(subjectId);
        },
        async openExistingSubject(url) {
            await sleep(100);
            await openTab(bgmHost + url);
        },
        openNewSubject(type) {
            return openNewSubject(type);
        },
    };
}
const userScriptRuntimeAdapter = {
    fetchHtml(url) {
        return userScriptRuntimeCapabilities.transport.fetchHtml(url);
    },
    submitSubjectCreation,
    submitCharacterCreation,
};

async function initCommon(siteConfig) {
    return initSourceSubject(siteConfig, userScriptRuntimeAdapter);
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
    const myCss = GM_getResourceText('NOTYF_CSS');
    GM_addStyle(myCss);
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
        y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
    };
}
function getBlurControlState($width, $radius) {
    return {
        width: +$width.value,
        radius: +$radius.value,
    };
}
function getBlurAmountText(state) {
    return `${state.width}, ${state.radius}`;
}
function getPasteTipsText(isMouseInPasteArea) {
    return isMouseInPasteArea
        ? '可粘贴图片（Ctrl+V）'
        : '鼠标移入此区域后粘贴图片生效';
}
function resolveInitialPreviewSource(base64Data) {
    if (!base64Data) {
        return {
            kind: 'empty',
        };
    }
    if (/^http/.test(base64Data)) {
        return {
            kind: 'external_url',
            url: base64Data,
        };
    }
    return {
        kind: 'data_url',
        dataUrl: base64Data,
    };
}
function resolveResetSource(initialSource, hasFile, hasFillForm) {
    if (initialSource.kind !== 'empty')
        return 'initial';
    if (hasFile)
        return 'file';
    if (hasFillForm)
        return 'fill_form';
    return 'none';
}
function hasValidCanvasSize($canvas) {
    return $canvas.width > 8 && $canvas.height > 10;
}

function clearPreviewCanvas($canvas) {
    $canvas.width = 0;
    $canvas.height = 0;
}
function removePreviewFetchLink(refs) {
    var _a;
    (_a = refs.previewFetchLink) === null || _a === void 0 ? void 0 : _a.remove();
    refs.previewFetchLink = null;
}
function ensurePreviewFetchLink(refs, url) {
    var _a;
    if (((_a = refs.previewFetchLink) === null || _a === void 0 ? void 0 : _a.href) === url) {
        return;
    }
    removePreviewFetchLink(refs);
    const link = document.createElement('a');
    link.classList.add('preview-fetch-img-link');
    link.href = url;
    link.setAttribute('rel', 'noopener noreferrer nofollow');
    link.setAttribute('target', '_blank');
    link.innerText = '查看抓取封面';
    refs.container.insertBefore(link, refs.previewCanvas);
    refs.previewFetchLink = link;
}
function getPreviewImageSize($img) {
    return {
        width: $img.naturalWidth || $img.width,
        height: $img.naturalHeight || $img.height,
    };
}
function renderPreviewImage(refs) {
    const ctx = refs.previewCanvas.getContext('2d');
    if (!ctx) {
        return;
    }
    const { width, height } = getPreviewImageSize(refs.previewImage);
    if (!width || !height) {
        return;
    }
    refs.previewCanvas.width = width;
    refs.previewCanvas.height = height;
    ctx.drawImage(refs.previewImage, 0, 0);
    window.dispatchEvent(new Event('resize'));
}
function loadPreviewImageSource(refs, dataUrl) {
    if (refs.previewImage.src === dataUrl) {
        renderPreviewImage(refs);
        return;
    }
    refs.previewImage.src = dataUrl;
}
function applyInitialPreviewData(initialSource, refs) {
    if (initialSource.kind === 'empty') {
        removePreviewFetchLink(refs);
        return;
    }
    if (initialSource.kind === 'external_url') {
        // 跨域和 refer 的问题，暂时改成链接
        ensurePreviewFetchLink(refs, initialSource.url);
        clearPreviewCanvas(refs.previewCanvas);
        refs.previewImage.removeAttribute('src');
    }
    else {
        removePreviewFetchLink(refs);
        loadPreviewImageSource(refs, initialSource.dataUrl);
    }
}
function bindPreviewFileImage($file, refs) {
    const handleImageLoad = () => {
        renderPreviewImage(refs);
    };
    refs.previewImage.addEventListener('load', handleImageLoad);
    if ($file) {
        const loadImgData = () => {
            var _a;
            const file = (_a = $file.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (typeof reader.result === 'string') {
                    loadPreviewImageSource(refs, reader.result);
                }
            });
            reader.readAsDataURL(file);
        };
        $file.addEventListener('change', loadImgData);
        return () => {
            refs.previewImage.removeEventListener('load', handleImageLoad);
            $file.removeEventListener('change', loadImgData);
        };
    }
    return () => {
        refs.previewImage.removeEventListener('load', handleImageLoad);
    };
}
function bindPreviewControls(initialSource, $file, refs) {
    const handleReset = (e) => {
        var _a;
        // wiki 填表按钮
        const $fillForm = document.querySelector('.e-wiki-fill-form');
        const resetSource = resolveResetSource(initialSource, Boolean((_a = $file === null || $file === void 0 ? void 0 : $file.files) === null || _a === void 0 ? void 0 : _a[0]), Boolean($fillForm));
        if (resetSource === 'initial') {
            applyInitialPreviewData(initialSource, refs);
        }
        else if (resetSource === 'file') {
            $file === null || $file === void 0 ? void 0 : $file.dispatchEvent(new Event('change'));
        }
        else if (resetSource === 'fill_form') {
            $fillForm === null || $fillForm === void 0 ? void 0 : $fillForm.dispatchEvent(new Event('click'));
        }
        e.preventDefault();
    };
    const handleClear = (e) => {
        clearPreviewCanvas(refs.previewCanvas);
        e.preventDefault();
    };
    refs.resetButton.addEventListener('click', handleReset);
    refs.clearButton.addEventListener('click', handleClear);
    return () => {
        refs.resetButton.removeEventListener('click', handleReset);
        refs.clearButton.removeEventListener('click', handleClear);
    };
}
function bindPastePreview(refs) {
    // 标记：鼠标是否在目标元素内（初始为false）
    let isMouseInPasteArea = false;
    // 监听鼠标进入/离开，更新状态 + 视觉反馈
    const handleMouseEnter = () => {
        isMouseInPasteArea = true;
        refs.pasteTips.textContent = getPasteTipsText(true);
    };
    const handleMouseLeave = () => {
        isMouseInPasteArea = false;
        refs.pasteTips.textContent = getPasteTipsText(false);
    };
    const handlePaste = (e) => {
        if (!refs.container.isConnected) {
            document.body.removeEventListener('paste', handlePaste);
            return;
        }
        if (!isMouseInPasteArea)
            return;
        e.preventDefault();
        let imageFile = null;
        if (e.clipboardData && e.clipboardData.files) {
            imageFile = e.clipboardData.files[0];
        }
        else if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    imageFile = item.getAsFile(); // 转换为File对象
                    break;
                }
            }
        }
        if (!imageFile) {
            refs.pasteTips.textContent = '未检测到图片！';
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            var _a;
            const pasteBase64Data = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
            if (typeof pasteBase64Data === 'string') {
                loadPreviewImageSource(refs, pasteBase64Data);
            }
        });
        reader.readAsDataURL(imageFile);
    };
    refs.container.addEventListener('mouseenter', handleMouseEnter);
    refs.container.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('paste', handlePaste);
    return () => {
        refs.container.removeEventListener('mouseenter', handleMouseEnter);
        refs.container.removeEventListener('mouseleave', handleMouseLeave);
        document.body.removeEventListener('paste', handlePaste);
    };
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

function queryRequiredElement(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
        throw new Error(`missing imageWidget element: ${selector}`);
    }
    return element;
}
function drawRec($width, $canvas) {
    const ctx = $canvas.getContext('2d');
    if (!ctx) {
        return;
    }
    const width = Number($width.value);
    $canvas.width = width * 1.4;
    $canvas.height = width * 1.4;
    ctx.strokeStyle = '#f09199';
    ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
    // resize page
    window.dispatchEvent(new Event('resize'));
}
function changeInfo($info, $width, $radius) {
    const state = getBlurControlState($width, $radius);
    $info.value = getBlurAmountText(state);
}
function createImageWidgetEditor($target) {
    const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn submit-btn" value="上传处理后的图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100">
    <canvas class="blur-width-preview"></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">
    <br>
    <div class="canvas-btn-container" style="display: flex; align-items: center; gap: 10px; margin-top: 10px">
      <input class="inputBtn reset-btn" value="重置" type="button">
      <input class="inputBtn clear-btn" value="清除" type="button">
    </div>
    <div class="paste-tips" style="margin-top: 10px; color: #999;font-size: 12px">${getPasteTipsText(false)}</div>
    <img class="preview" src="" alt="" style="display:none;">
  `;
    const $info = document.createElement('div');
    $info.classList.add('e-wiki-cover-container');
    $info.innerHTML = rawHTML;
    if (!$target.parentElement) {
        return null;
    }
    $target.parentElement.insertBefore($info, $target.nextElementSibling);
    const refs = {
        container: $info,
        submitButton: queryRequiredElement($info, '.submit-btn'),
        previewCanvas: queryRequiredElement($info, '#e-wiki-cover-preview'),
        amountInput: queryRequiredElement($info, '#e-wiki-cover-amount'),
        widthSlider: queryRequiredElement($info, '#e-wiki-cover-slider-width'),
        widthPreviewCanvas: queryRequiredElement($info, '.blur-width-preview'),
        radiusSlider: queryRequiredElement($info, '#e-wiki-cover-slider-radius'),
        resetButton: queryRequiredElement($info, '.reset-btn'),
        clearButton: queryRequiredElement($info, '.clear-btn'),
        pasteTips: queryRequiredElement($info, '.paste-tips'),
        previewImage: queryRequiredElement($info, 'img.preview'),
        previewFetchLink: null,
    };
    drawRec(refs.widthSlider, refs.widthPreviewCanvas);
    changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
    refs.widthSlider.addEventListener('input', () => {
        drawRec(refs.widthSlider, refs.widthPreviewCanvas);
        changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
    });
    refs.radiusSlider.addEventListener('input', () => {
        changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
    });
    return refs;
}
/**
 * blur canvas
 * @param el target canvas
 * @param width blur rect width
 * @param radius blur rect height
 */
function bindCanvasBlur(refs) {
    let isDrawing = false;
    const ctx = refs.previewCanvas.getContext('2d');
    if (!ctx) {
        return () => undefined;
    }
    const handleMouseDown = (e) => {
        isDrawing = true;
        const pos = getMousePos(refs.previewCanvas, e);
        ctx.moveTo(pos.x, pos.y);
    };
    const handleMouseMove = (e) => {
        if (isDrawing) {
            const pos = getMousePos(refs.previewCanvas, e);
            const { width, radius } = getBlurControlState(refs.widthSlider, refs.radiusSlider);
            // stack blur operation
            processCanvasRGBA(refs.previewCanvas, pos.x - width / 2, pos.y - width / 2, width, width, radius);
        }
    };
    const stopDrawing = () => {
        isDrawing = false;
    };
    refs.previewCanvas.addEventListener('mousedown', handleMouseDown);
    refs.previewCanvas.addEventListener('mousemove', handleMouseMove);
    refs.previewCanvas.addEventListener('mouseup', stopDrawing);
    refs.previewCanvas.addEventListener('mouseleave', stopDrawing);
    window.addEventListener('mouseup', stopDrawing);
    return () => {
        refs.previewCanvas.removeEventListener('mousedown', handleMouseDown);
        refs.previewCanvas.removeEventListener('mousemove', handleMouseMove);
        refs.previewCanvas.removeEventListener('mouseup', stopDrawing);
        refs.previewCanvas.removeEventListener('mouseleave', stopDrawing);
        window.removeEventListener('mouseup', stopDrawing);
    };
}

function appendFormItem(fd, item) {
    if (item.filename) {
        fd.set(item.name, item.value, item.filename);
        return;
    }
    if (item.value instanceof Blob) {
        fd.set(item.name, item.value);
        return;
    }
    fd.set(item.name, String(item.value));
}
/**
 * send form data with image
 * @param $form
 * @param dataURL
 */
async function sendFormImg($form, dataURL) {
    const info = [];
    const $file = $form.querySelector('input[type=file]');
    const inputFileName = ($file === null || $file === void 0 ? void 0 : $file.name) ? $file.name : 'picfile';
    info.push({
        name: inputFileName,
        value: dataURItoBlob(dataURL),
        filename: `${genRandomStr(5)}.png`,
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
        extraInfo.forEach((item) => {
            appendFormItem(fd, item);
        });
        const $submit = $form.querySelector('[name=submit]');
        if (($submit === null || $submit === void 0 ? void 0 : $submit.name) && $submit.value) {
            fd.set($submit.name, $submit.value);
        }
        const xhr = new XMLHttpRequest();
        xhr.open(($form.method || 'POST').toUpperCase(), $form.action, true);
        xhr.onload = function () {
            if (xhr.status !== 200) {
                reject(new Error(`request failed with status ${xhr.status}`));
                return;
            }
            if (xhr.responseURL) {
                resolve(xhr.responseURL);
                return;
            }
            reject(new Error('no location'));
        };
        xhr.onerror = function () {
            reject(new Error('request failed'));
        };
        xhr.send(fd);
    });
}

function insertLoading($sibling) {
    const $loading = document.createElement('div');
    $loading.setAttribute('style', 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");');
    $sibling.parentElement.insertBefore($loading, $sibling);
    return $loading;
}
function bindUploadButton($file, $inputBtn, $canvas, $form) {
    if ($file) {
        const handleClick = async (e) => {
            e.preventDefault();
            if (!hasValidCanvasSize($canvas)) {
                return;
            }
            const $el = e.target;
            $el.style.display = 'none';
            const $loading = insertLoading($el);
            try {
                const $wikiMode = document.querySelector('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                $wikiMode === null || $wikiMode === void 0 ? void 0 : $wikiMode.click();
                await sleep(200);
                const url = await sendFormImg($form, $canvas.toDataURL('image/png', 1));
                location.assign(url);
            }
            catch (e) {
                console.log('send form err: ', e);
            }
            finally {
                $el.style.display = '';
                $loading.remove();
            }
        };
        $inputBtn.addEventListener('click', handleClick, false);
        return () => {
            $inputBtn.removeEventListener('click', handleClick, false);
        };
    }
    $inputBtn.value = '处理图片';
    return () => undefined;
}

const imageWidgetInstances = new WeakMap();
/**
 * 初始化上传处理图片组件
 * @param {Object} $form - 包含 input file 的 DOM
 * @param {string} base64Data - 图片链接或者 base64 信息
 */
function initImageWidget($form, base64Data) {
    const currentInstance = imageWidgetInstances.get($form);
    if (currentInstance === null || currentInstance === void 0 ? void 0 : currentInstance.container.isConnected) {
        return;
    }
    currentInstance === null || currentInstance === void 0 ? void 0 : currentInstance.dispose();
    imageWidgetInstances.delete($form);
    if (document.querySelector('.e-wiki-cover-container'))
        return;
    const refs = createImageWidgetEditor($form);
    if (!refs) {
        return;
    }
    const initialSource = resolveInitialPreviewSource(base64Data);
    const $file = $form.querySelector('input[type = file]');
    const disposePreviewFile = bindPreviewFileImage($file, refs);
    applyInitialPreviewData(initialSource, refs);
    const disposeCanvasBlur = bindCanvasBlur(refs);
    const disposePreviewControls = bindPreviewControls(initialSource, $file, refs);
    const disposePastePreview = bindPastePreview(refs);
    const disposeUploadButton = bindUploadButton($file, refs.submitButton, refs.previewCanvas, $form);
    imageWidgetInstances.set($form, {
        container: refs.container,
        dispose: () => {
            disposePreviewFile();
            disposeCanvasBlur();
            disposePreviewControls();
            disposePastePreview();
            disposeUploadButton();
        },
    });
}

function hasCategory(info, category) {
    if (info.category === category) {
        return true;
    }
    return (info.category &&
        info.category.includes(',') &&
        info.category.split(',').includes(category));
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
                let d = getStringValue(info.value);
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
                    const infoValue = getStringValue(info.value);
                    if (!originValue.includes(`[${infoValue}]`)) {
                        // |平台={
                        arr[i] = `${arr[i]}\n[${infoValue}]`;
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
            newArr.push(`|${info.name}=${getStringValue(info.value)}`);
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

function getBangumiSubjectTypeName(typeId) {
    const typeDict = {
        [SubjectTypeId.game]: 'game',
        [SubjectTypeId.anime]: 'anime',
        [SubjectTypeId.music]: 'music',
        [SubjectTypeId.book]: 'book',
        [SubjectTypeId.real]: 'real',
        [SubjectTypeId.all]: 'all',
    };
    return typeDict[typeId];
}
function isDiscTrackList(value) {
    return Array.isArray(value) && value.every((disc) => Array.isArray(disc));
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
        return await fetch(url, {
            body: fd,
            method: 'post',
        });
    }
    else {
        const rawText = await fetchText(url);
        const $doc = new DOMParser().parseFromString(rawText, 'text/html');
        const $form = $doc.querySelector('form[name=img_upload]');
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
    if (discInfo && isDiscTrackList(discInfo.value)) {
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
        const $form = $doc.querySelector('form[name=new_songlist]');
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
            },
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
    const bgmHost = `${location.protocol}//${location.host}`;
    const type = getBangumiSubjectTypeName(typeId);
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
    const bgmHost = `${location.protocol}//${location.host}`;
    const type = getBangumiSubjectTypeName(typeId);
    const url = `${bgmHost}/character/${charaId}/add_related/person/${type}`;
    const rawText = await fetchText(url);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const $form = $doc.querySelector('.mainWrapper form');
    if (!$form) {
        throw new Error('related person form not found');
    }
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
function initSubjectSubmit(wikiInfo) {
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
                    if ($canvas.clientWidth > 8 && $canvas.clientHeight > 10) {
                        await uploadSubjectCover(subjectId, $canvas.toDataURL('image/png', 1));
                    }
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
        });
    }, 300);
}
function initCharacterSubmit(wikiInfo, dataUrl) {
    setTimeout(() => {
        const $form = $q('form[name=new_character]');
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
                            const cvId = await searchCVByName(getStringValue(cvInfo.value), charaId);
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

const SUBJECT_TYPE_INPUT_SELECTOR = 'table tr:nth-of-type(2) > td:nth-of-type(2) input';
const SUBJECT_TITLE_SELECTOR = 'input[name=subject_title]';
const SUBJECT_SUMMARY_SELECTOR = '#subject_summary';
const CHARACTER_SUMMARY_SELECTOR = '#crt_summary';
const CHARACTER_NAME_SELECTOR = '#crt_name';
const WIKI_MODE_SELECTOR = 'table small a:nth-of-type(1)[href="javascript:void(0)"]';
const NEWBIE_MODE_SELECTOR = 'table small a:nth-of-type(2)[href="javascript:void(0)"]';
const SUBJECT_INFOBOX_SELECTOR = '#subject_infobox';
const SUBJECT_TITLE_RESET_SELECTOR = '#columnInSubjectA [name=subject_title]';
const CHARACTER_NAME_RESET_SELECTOR = '#columnInSubjectA #crt_name';
const COVER_CLEAR_BUTTON_SELECTOR = '.e-wiki-cover-container .clear-btn';
const COVER_SUBMIT_SELECTOR = '.e-wiki-cover-container [name=submit]';
const SUBJECT_FORM_SELECTOR = 'form[name=create_subject]';
const CHARACTER_FORM_SELECTOR = 'form[name=new_character]';
const UPLOAD_FORM_SELECTOR = 'form[name=img_upload]';
const FORM_TITLE_PARENT_SELECTOR = 'form[name=create_subject] [name=subject_title]';
const CHARACTER_TITLE_PARENT_SELECTOR = 'form[name=new_character] #crt_name';
const SUBJECT_NAME_MAP = {
    誕生日: '生日',
    スリーサイズ: 'BWH',
};
function getInput(selector) {
    return $q(selector);
}
function getTextArea(selector) {
    return $q(selector);
}
function getElement(selector) {
    return $q(selector);
}
function clickIfPresent(selector) {
    var _a;
    (_a = getElement(selector)) === null || _a === void 0 ? void 0 : _a.click();
}
function setInputValue(selector, value) {
    const input = getInput(selector);
    if (input) {
        input.value = value;
    }
}
function setTextAreaValue(selector, value) {
    const textArea = getTextArea(selector);
    if (textArea) {
        textArea.value = value;
    }
}
function getInfoBoxValue() {
    var _a, _b;
    return (_b = (_a = getTextArea(SUBJECT_INFOBOX_SELECTOR)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
}
function clearPlatformInputs() {
    $qa('input[name=platform]').forEach((element) => {
        element.checked = false;
    });
}
function dispatchClearInfoEvent() {
    window.dispatchEvent(new CustomEvent('scriptMessage', {
        detail: {
            type: 'clearInfo',
        },
    }));
}
function resetSubjectForm(defaultVal) {
    var _a;
    clearPlatformInputs();
    clickIfPresent(WIKI_MODE_SELECTOR);
    setTextAreaValue(SUBJECT_INFOBOX_SELECTOR, defaultVal);
    setInputValue(SUBJECT_TITLE_RESET_SELECTOR, '');
    setInputValue(SUBJECT_SUMMARY_SELECTOR, '');
    (_a = getInput(COVER_CLEAR_BUTTON_SELECTOR)) === null || _a === void 0 ? void 0 : _a.click();
    setInputValue('#editSummary', '');
    dispatchClearInfoEvent();
    const submitInput = getInput(COVER_SUBMIT_SELECTOR);
    if (submitInput) {
        submitInput.value = '添加条目并上传封面';
    }
}
function resetCharacterForm(defaultVal) {
    var _a;
    clickIfPresent(WIKI_MODE_SELECTOR);
    setTextAreaValue(SUBJECT_INFOBOX_SELECTOR, defaultVal);
    setInputValue(CHARACTER_NAME_RESET_SELECTOR, '');
    setInputValue(CHARACTER_SUMMARY_SELECTOR, '');
    (_a = getElement('.e-wiki-cover-container')) === null || _a === void 0 ? void 0 : _a.remove();
}
/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
async function fillInfoBox(wikiData) {
    var _a, _b, _c;
    const { infos } = wikiData;
    const subType = Number(wikiData.subtype);
    const infoArray = [];
    const typeInputs = Array.from($qa(SUBJECT_TYPE_INPUT_SELECTOR));
    if (typeInputs.length) {
        (_a = typeInputs[0]) === null || _a === void 0 ? void 0 : _a.click();
        if (!Number.isNaN(subType)) {
            (_b = typeInputs[subType]) === null || _b === void 0 ? void 0 : _b.click();
        }
    }
    await sleep(100);
    const wikiMode = getElement(WIKI_MODE_SELECTOR);
    const newbieMode = getElement(NEWBIE_MODE_SELECTOR);
    for (let i = 0, len = infos.length; i < len; i++) {
        const currentInfo = infos[i];
        const infoValue = getStringValue(currentInfo.value).trim();
        if (currentInfo.category === 'subject_title') {
            setInputValue(SUBJECT_TITLE_SELECTOR, infoValue);
            continue;
        }
        if (currentInfo.category === 'subject_summary') {
            setInputValue(SUBJECT_SUMMARY_SELECTOR, infoValue);
            continue;
        }
        if (currentInfo.category === 'crt_summary') {
            setInputValue(CHARACTER_SUMMARY_SELECTOR, infoValue);
            continue;
        }
        if (currentInfo.category === 'crt_name') {
            setInputValue(CHARACTER_NAME_SELECTOR, infoValue);
            continue;
        }
        if (currentInfo.category === 'checkbox') {
            const target = getInput(`input[name=${currentInfo.name}]`);
            if (target) {
                target.checked = Boolean(currentInfo.value);
            }
            continue;
        }
        // 有名称并且category不在特定列表里面
        if (currentInfo.name &&
            !['cover', 'crt_cover', 'ep'].includes((_c = currentInfo.category) !== null && _c !== void 0 ? _c : '')) {
            const name = currentInfo.name;
            if (Object.prototype.hasOwnProperty.call(SUBJECT_NAME_MAP, name)) {
                infoArray.push({
                    ...currentInfo,
                    name: SUBJECT_NAME_MAP[name],
                });
            }
            else {
                infoArray.push(currentInfo);
            }
        }
    }
    wikiMode === null || wikiMode === void 0 ? void 0 : wikiMode.click();
    await sleep(200);
    const infoBox = getTextArea(SUBJECT_INFOBOX_SELECTOR);
    if (infoBox) {
        infoBox.value = convertInfoValue(infoBox.value, infoArray);
    }
    await sleep(200);
    newbieMode === null || newbieMode === void 0 ? void 0 : newbieMode.click();
}
function initNewSubject(wikiInfo) {
    var _a;
    const titleInput = getElement(FORM_TITLE_PARENT_SELECTOR);
    const parent = titleInput === null || titleInput === void 0 ? void 0 : titleInput.parentElement;
    if (!parent) {
        return;
    }
    const defaultVal = getInfoBoxValue();
    insertFillFormBtn(parent, async () => {
        await fillInfoBox(wikiInfo);
        setInputValue('#editSummary', '新条目');
    }, () => {
        resetSubjectForm(defaultVal);
    });
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
    const dataUrl = ((_a = getCoverValue(coverInfo === null || coverInfo === void 0 ? void 0 : coverInfo.value)) === null || _a === void 0 ? void 0 : _a.dataUrl) || '';
    const subjectForm = getElement(SUBJECT_FORM_SELECTOR);
    if (subjectForm) {
        initImageWidget(subjectForm, dataUrl);
    }
    initSubjectSubmit(wikiInfo);
}
function initNewCharacter(wikiInfo, _subjectId) {
    var _a;
    const titleInput = getElement(CHARACTER_TITLE_PARENT_SELECTOR);
    const parent = titleInput === null || titleInput === void 0 ? void 0 : titleInput.parentElement;
    if (!parent) {
        return;
    }
    const defaultVal = getInfoBoxValue();
    insertFillFormBtn(parent, async () => {
        await fillInfoBox(wikiInfo);
    }, () => {
        resetCharacterForm(defaultVal);
    });
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'crt_cover')[0];
    let dataUrl = '';
    if (coverInfo && coverInfo.value) {
        if (isCoverValue(coverInfo.value)) {
            dataUrl = ((_a = getCoverValue(coverInfo.value)) === null || _a === void 0 ? void 0 : _a.dataUrl) || '';
        }
        else {
            dataUrl = getStringValue(coverInfo.value);
        }
    }
    const characterForm = getElement(CHARACTER_FORM_SELECTOR);
    if (characterForm) {
        initImageWidget(characterForm, dataUrl);
    }
    initCharacterSubmit(wikiInfo, dataUrl);
}
function initUploadImg(wikiInfo) {
    var _a;
    const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
    const uploadForm = getElement(UPLOAD_FORM_SELECTOR);
    if (uploadForm) {
        initImageWidget(uploadForm, (_a = getCoverValue(coverInfo === null || coverInfo === void 0 ? void 0 : coverInfo.value)) === null || _a === void 0 ? void 0 : _a.dataUrl);
    }
}

function getPageType() {
    var _a;
    const re = new RegExp(['new_subject', 'add_related', 'character/new', 'upload_img'].join('|'));
    return ((_a = document.location.href.match(re)) === null || _a === void 0 ? void 0 : _a[0]) || '';
}
function getEmptySubjectInfo() {
    return {
        type: +window.location.pathname.split('/')[2] || 1,
        infos: [],
    };
}
function registerClearListener(runtime) {
    window.addEventListener('scriptMessage', async (event) => {
        const detail = event.detail;
        if ((detail === null || detail === void 0 ? void 0 : detail.type) === 'clearInfo') {
            console.info('clear info');
            await runtime.clearInfo();
        }
    });
}
function triggerAutoFill(runtime, delay = 200) {
    setTimeout(async () => {
        var _a;
        const $fillForm = $q('.e-wiki-fill-form');
        if (!$fillForm)
            return;
        $fillForm.click();
        await ((_a = runtime.markAutoFillConsumed) === null || _a === void 0 ? void 0 : _a.call(runtime));
    }, delay);
}
async function initBangumiPage(runtime) {
    const pageType = getPageType();
    if (!pageType)
        return;
    const state = await runtime.loadPageState();
    registerClearListener(runtime);
    switch (pageType) {
        case 'new_subject':
            if (state.wikiData) {
                initNewSubject(state.wikiData);
                if (state.shouldAutoFill) {
                    triggerAutoFill(runtime, state.autoFillDelay);
                }
            }
            else {
                initNewSubject(getEmptySubjectInfo());
            }
            break;
        case 'add_related':
            break;
        case 'character/new':
            if (state.charaData) {
                initNewCharacter(state.charaData, state.subjectId);
                if (state.shouldAutoFill) {
                    triggerAutoFill(runtime, state.autoFillDelay);
                }
            }
            break;
        case 'upload_img':
            if (state.wikiData) {
                initUploadImg(state.wikiData);
            }
            break;
    }
}

const userScriptBangumiRuntimeAdapter = {
    loadPageState() {
        return userScriptDraftStore.loadBangumiPageState();
    },
    clearInfo() {
        return userScriptDraftStore.clearBangumiPageState();
    },
    markAutoFillConsumed() {
        return userScriptDraftStore.consumeAutoFill();
    },
};

const bangumi = {
    init() {
        return initBangumiPage(userScriptBangumiRuntimeAdapter);
    },
};

function getIframeSelector(itemSelector) {
    var _a;
    if (itemSelector instanceof Array) {
        return ((_a = itemSelector.find((item) => item.isIframe === true)) === null || _a === void 0 ? void 0 : _a.selector) || '';
    }
    return itemSelector.isIframe ? itemSelector.selector : '';
}
async function getIframeDoc(itemSelector, runtime) {
    var _a;
    const iframeSel = getIframeSelector(itemSelector);
    if (!iframeSel) {
        return null;
    }
    const url = (_a = findElement({
        selector: iframeSel,
    })) === null || _a === void 0 ? void 0 : _a.getAttribute('src');
    if (!url) {
        return null;
    }
    console.log('fetch html by runtime adapter');
    const rawHtml = await runtime.fetchHtml(url);
    return new DOMParser().parseFromString(rawHtml, 'text/html');
}
async function submitCharacter(siteConfig, runtime, charaInfo) {
    var _a;
    if (!charaInfo.length)
        return;
    await ((_a = runtime.hydrateCharacterCover) === null || _a === void 0 ? void 0 : _a.call(runtime, charaInfo));
    console.info('character info list: ', charaInfo);
    const charaData = {
        type: siteConfig.type,
        infos: charaInfo,
    };
    await runtime.submitCharacterCreation({
        siteConfig,
        charaData,
    });
}
async function initCharacterModel(siteConfig, runtime, characterModel) {
    var _a;
    const presenceSelector = characterModel.presenceSelector;
    if (presenceSelector && !findElement(presenceSelector))
        return;
    const iframeDoc = getIframeSelector(characterModel.itemSelector)
        ? await getIframeDoc(characterModel.itemSelector, runtime)
        : null;
    const itemArr = iframeDoc
        ? findAllElement(characterModel.itemSelector, iframeDoc)
        : findAllElement(characterModel.itemSelector);
    if (!itemArr.length)
        return;
    if (((_a = characterModel.controlMode) !== null && _a !== void 0 ? _a : 'select') === 'inline') {
        itemArr.forEach(($target) => {
            insertControlBtnChara($target, async () => {
                const charaInfo = await getCharaData(characterModel, createWikiExtractContext($target));
                await submitCharacter(siteConfig, runtime, charaInfo);
            });
        });
        return;
    }
    const toolbarSelector = characterModel.toolbarSelector;
    if (!toolbarSelector)
        return;
    const $toolbarEl = findElement(toolbarSelector);
    if (!$toolbarEl)
        return;
    const nameConfig = characterModel.itemList.find((item) => item.category == 'crt_name');
    if (!nameConfig)
        return;
    const names = await Promise.all(itemArr.map(async ($target) => {
        var _a;
        const infos = await getCharaData({
            ...characterModel,
            itemList: [nameConfig],
        }, createWikiExtractContext($target));
        return getStringValue((_a = infos.find((item) => item.category === 'crt_name')) === null || _a === void 0 ? void 0 : _a.value);
    }));
    addCharaUI($toolbarEl, names, async (_e, selectedName) => {
        let targetList = [];
        if (selectedName === 'all') ;
        else {
            const idx = names.indexOf(selectedName);
            if (idx !== -1) {
                targetList = itemArr.slice(idx, idx + 1);
            }
        }
        for (const $target of targetList) {
            const charaInfo = await getCharaData(characterModel, createWikiExtractContext($target));
            await submitCharacter(siteConfig, runtime, charaInfo);
        }
    });
}
async function initSourceCharacter(siteConfig, runtime) {
    const $page = findElement(siteConfig.pageSelectors);
    if (!$page)
        return;
    const characterModels = getCharacterModels(siteConfig.key);
    if (!characterModels.length)
        return;
    for (const characterModel of characterModels) {
        await initCharacterModel(siteConfig, runtime, characterModel);
    }
}

async function initChara(siteConfig) {
    return initSourceCharacter(siteConfig, userScriptRuntimeAdapter);
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
    if (['bangumi.tv', 'chii.in', 'bgm.tv'].includes(host)) {
        addStyle();
        bangumi.init();
    }
};
init();
