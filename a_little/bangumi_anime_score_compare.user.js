// ==UserScript==
// @name        bangumi anime score compare
// @name:zh-CN  bangumi动画和豆瓣及MAL评分对比
// @namespace   https://github.com/22earth
// @description show subject score information of douban and MAL in bangumi.tv
// @description:zh-cn bangumi动画页面显示豆瓣和MAL的评分
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/subject\/.*$/
// @include     https://movie.douban.com/subject/*
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bangumi_anime_score_compare.user.js
// @version     0.3.0
// @note        0.2.0 支持豆瓣上显示Bangumi评分,暂时禁用豆瓣上显示MAL的评分功能以及修改过滤方式
// @note        0.2.4 豆瓣 api 失效，使用搜索页面查询结果
// @TODO        统一豆瓣和Bangumi的缓存数据信息,
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceURL
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_addValueChangeListener
// @require     https://cdn.staticfile.org/fuse.js/6.4.0/fuse.min.js
// @resource    bangumi_favicon https://bgm.tv/img/favicon.ico
// @resource    douban_favicon https://img3.doubanio.com/favicon.ico
// @resource    myanimelist_favicon https://cdn.myanimelist.net/images/favicon.ico
// ==/UserScript==


var SubjectTypeId;
(function (SubjectTypeId) {
    SubjectTypeId[SubjectTypeId["book"] = 1] = "book";
    SubjectTypeId[SubjectTypeId["anime"] = 2] = "anime";
    SubjectTypeId[SubjectTypeId["music"] = 3] = "music";
    SubjectTypeId[SubjectTypeId["game"] = 4] = "game";
    SubjectTypeId[SubjectTypeId["real"] = 6] = "real";
    SubjectTypeId["all"] = "all";
})(SubjectTypeId || (SubjectTypeId = {}));

function sleep(num) {
    return new Promise((resolve) => {
        setTimeout(resolve, num);
    });
}
function randomSleep(max = 400, min = 200) {
    return sleep(randomNum(max, min));
}
function randomNum(max, min) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
function fetchText(url, opts = {}, TIMEOUT = 10 * 1000) {
    return fetchInfo(url, 'text', opts, TIMEOUT);
}
function fetchJson(url, opts = {}) {
    return fetchInfo(url, 'json', opts);
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
function roundNum(num, len = 2) {
    //@ts-ignore
    return +(Math.round(num + `e+${len}`) + `e-${len}`);
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
        return items[0];
    }
    let results = new Fuse(items, Object.assign({}, opts)).search(subjectInfo.name);
    if (!results.length)
        return;
    // 有参考的发布时间
    if (subjectInfo.releaseDate) {
        for (const item of results) {
            const result = item.item;
            // 只有年的时候
            if (result.releaseDate && result.releaseDate.length === '4') {
                if (result.releaseDate === subjectInfo.releaseDate.slice(0, 4)) {
                    return result;
                }
            }
            else if (result.releaseDate) {
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
        if (nameRe.test(result.name) ||
            nameRe.test(result.greyName) ||
            nameRe.test(result.rawName)) {
            return result;
        }
    }
    return (_a = results[0]) === null || _a === void 0 ? void 0 : _a.item;
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
    let searchResult = await searchSubject(subjectInfo, bgmHost, type, subjectInfo.isbn);
    console.info(`First: search book of bangumi: `, searchResult);
    if (searchResult && searchResult.url) {
        return searchResult;
    }
    searchResult = await searchSubject(subjectInfo, bgmHost, type, subjectInfo.asin);
    console.info(`Second: search book by ${subjectInfo.asin}: `, searchResult);
    if (searchResult && searchResult.url) {
        return searchResult;
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
async function checkSubjectExist(subjectInfo, bgmHost = 'https://bgm.tv', type = SubjectTypeId.all, disableDate) {
    let result;
    switch (type) {
        case SubjectTypeId.book:
            result = await checkBookSubjectExist(subjectInfo, bgmHost, type);
            break;
        case SubjectTypeId.all:
        case SubjectTypeId.game:
        case SubjectTypeId.anime:
            result = await checkExist(subjectInfo, bgmHost, type, disableDate);
            break;
        case SubjectTypeId.real:
        case SubjectTypeId.music:
        default:
            console.info('not support type: ', type);
    }
    return result;
}

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
    if (elem.tagName.toLowerCase() === 'meta') {
        return elem.content;
    }
    if (elem.tagName.toLowerCase() === 'input') {
        return elem.value;
    }
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

function convertHomeSearchItem($item) {
    const dealHref = (href) => {
        if (/^https:\/\/movie\.douban\.com\/subject\/\d+\/$/.test(href)) {
            return href;
        }
        const urlParam = href.split('?url=')[1];
        if (urlParam) {
            return decodeURIComponent(urlParam.split('&')[0]);
        }
        else {
            throw 'invalid href';
        }
    };
    const $title = $item.querySelector('.title h3 > a');
    const href = dealHref($title.getAttribute('href'));
    const $ratingNums = $item.querySelector('.rating-info > .rating_nums');
    let ratingsCount = '';
    let averageScore = '';
    if ($ratingNums) {
        const $count = $ratingNums.nextElementSibling;
        const m = $count.innerText.match(/\d+/);
        if (m) {
            ratingsCount = m[0];
        }
        averageScore = $ratingNums.innerText;
    }
    let greyName = '';
    const $greyName = $item.querySelector('.subject-cast');
    if ($greyName) {
        greyName = $greyName.innerText;
    }
    return {
        name: $title.textContent.trim(),
        greyName: greyName.split('/')[0].replace('原名:', '').trim(),
        releaseDate: (greyName.match(/\d{4}$/) || [])[0],
        url: href,
        score: averageScore,
        count: ratingsCount,
    };
}
/**
 * 通过首页搜索的结果
 * @param query 搜索字符串
 */
async function getHomeSearchResults(query, cat = '1002') {
    const url = `https://www.douban.com/search?cat=${cat}&q=${encodeURIComponent(query)}`;
    console.info('Douban search URL: ', url);
    const rawText = await fetchText(url);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const items = $doc.querySelectorAll('.search-result > .result-list > .result > .content');
    return Array.prototype.slice
        .call(items)
        .map(($item) => convertHomeSearchItem($item));
}
async function checkAnimeSubjectExist(subjectInfo) {
    let query = (subjectInfo.name || '').trim();
    if (!query) {
        console.info('Query string is empty');
        return Promise.reject();
    }
    let rawInfoList;
    let searchResult;
    const options = {
        keys: ['name', 'greyName'],
    };
    rawInfoList = await getHomeSearchResults(query);
    searchResult = filterResults(rawInfoList, subjectInfo, options, true);
    // if (Math.random() > 0.2) {
    //   rawInfoList = await getHomeSearchResults(query);
    //   searchResult = filterResults(rawInfoList, subjectInfo, options, true);
    // } else {
    //   rawInfoList = await getSubjectSearchResults(query);
    //   searchResult = filterResults(rawInfoList, subjectInfo, options, true);
    //   // searchResult = filterSearchResultsByYear(
    //   //   rawInfoList,
    //   //   new Date(subjectInfo.releaseDate).getFullYear() + ''
    //   // );
    // }
    console.info(`Search result of ${query} on Douban: `, searchResult);
    if (searchResult && searchResult.url) {
        return searchResult;
    }
}

async function searchAnimeData(subjectInfo) {
    const url = `https://myanimelist.net/search/prefix.json?type=anime&keyword=${encodeURIComponent(subjectInfo.name)}&v=1`;
    console.info('myanimelist search URL: ', url);
    const info = await fetchJson(url);
    await randomSleep(300, 100);
    let startDate = null;
    let items = info.categories[0].items;
    let pageUrl = '';
    let name = '';
    if (subjectInfo.releaseDate) {
        startDate = new Date(subjectInfo.releaseDate);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let aired = null;
            if (item.payload.aired.match('to')) {
                aired = new Date(item.payload.aired.split('to')[0]);
            }
            else {
                aired = new Date(item.payload.aired);
            }
            // 选择第一个匹配日期的
            if (startDate.getFullYear() === aired.getFullYear() &&
                startDate.getMonth() === aired.getMonth()) {
                pageUrl = item.url;
                name = item.name;
                break;
            }
        }
    }
    else if (items && items[0]) {
        name = items[0].name;
        pageUrl = items[0].url;
    }
    if (!pageUrl) {
        throw new Error('No match results');
    }
    let result = {
        name,
        url: pageUrl,
    };
    const content = await fetchText(pageUrl);
    const $doc = new DOMParser().parseFromString(content, 'text/html');
    let $score = $doc.querySelector('.fl-l.score');
    if ($score) {
        //siteScoreInfo.averageScore = parseFloat($score.textContent.trim()).toFixed(1)
        result.score = $score.textContent.trim();
        if ($score.dataset.user) {
            result.count = $score.dataset.user.replace(/users|,/g, '').trim();
        }
        else {
            throw new Error('Invalid score info');
        }
    }
    else {
        throw new Error('Invalid results');
    }
    console.info('myanimelist search result: ', result);
    return result;
}

const sites = ['douban', 'bangumi', 'myanimelist'];
if (GM_registerMenuCommand) {
    // 用户脚本命令增加清除评分信息缓存
    GM_registerMenuCommand('\u6e05\u9664\u8bc4\u5206\u7f13\u5b58', clearInfoStorage, 'c');
}
const USERJS_PREFIX = 'E_USERJS_ANIME_SCORE_';
const BANGUMI_LOADING = `${USERJS_PREFIX}BANGUMI_LOADING`;
const CURRENT_ID_DICT = `${USERJS_PREFIX}CURRENT_ID_DICT`;
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
// 30天清理所有数据
const CLEAR_INTERVAL = UPDATE_INTERVAL * 30;
function getSubjectId(href) {
    const m = href.match(/\/(subject|anime)\/(\d+)/);
    if (m) {
        return m[2];
    }
}
function saveValue(key, val) {
    GM_setValue(key, val);
}
function clearInfoStorage() {
    const keys = GM_listValues();
    for (const key of keys) {
        if (key.match(USERJS_PREFIX)) {
            GM_deleteValue(key);
        }
    }
}
function genScoreKey(site, id) {
    return USERJS_PREFIX + site.toUpperCase() + '_' + id;
}
function genSubjectIdDictKey(site, id) {
    return USERJS_PREFIX + site.toUpperCase() + '_DICT_ID_' + id;
}
function readScoreInfo(site, id) {
    if (!id)
        return;
    let scoreInfo = GM_getValue(genScoreKey(site, id));
    if (scoreInfo) {
        // scoreInfo = JSON.parse(scoreInfo);
        if (+new Date() - +new Date(scoreInfo.date) < UPDATE_INTERVAL) {
            return scoreInfo.info;
        }
    }
}
function readSubjectIdDict(site, id) {
    if (!id)
        return;
    const currentDict = GM_getValue(CURRENT_ID_DICT) || {};
    if (currentDict[site] === id) {
        return currentDict;
    }
    return GM_getValue(genSubjectIdDictKey(site, id));
}
async function checkInfoUpdate() {
    let time = GM_getValue(USERJS_PREFIX + 'LATEST_UPDATE_TIME');
    let now = new Date();
    if (!time) {
        GM_setValue(USERJS_PREFIX + 'LATEST_UPDATE_TIME', now.getTime());
        return;
    }
    else if (+now - +new Date(time) > CLEAR_INTERVAL) {
        clearInfoStorage();
        // 清理后延迟执行一下
        await sleep(200);
    }
}
function saveScoreInfo(info) {
    GM_setValue(genScoreKey(info.site, getSubjectId(info.url)), {
        info,
        date: +new Date(),
    });
}
async function fetchScoreInfo(name, subjectInfo) {
    let info;
    let res;
    let bgmOrigin = 'https://bgm.tv';
    GM_setValue(BANGUMI_LOADING, true);
    switch (name) {
        case 'bangumi':
            res = await checkSubjectExist(subjectInfo, bgmOrigin, SubjectTypeId.anime);
            if (!res.url.includes('http')) {
                res.url = `${bgmOrigin}${res.url}`;
            }
            break;
        case 'myanimelist':
            res = await searchAnimeData(subjectInfo);
            break;
        case 'douban':
            res = await checkAnimeSubjectExist(subjectInfo);
            break;
    }
    if (res) {
        info = Object.assign({ site: name }, res);
    }
    GM_setValue(BANGUMI_LOADING, false);
    return info;
}
const DoubanScorePage = {
    name: sites[0],
    controlSelector: [
        {
            selector: '#interest_sectl',
        },
    ],
    pageSelector: [
        {
            selector: 'body',
            subSelector: '.tags-body',
            keyWord: ['动画', '动漫'],
        },
    ],
    getSubjectInfo() {
        var _a, _b, _c, _d, _e, _f;
        const $title = $q('#content h1>span');
        const rawName = $title.textContent.trim();
        const keywords = (_b = (_a = $q('meta[name="keywords"]')) === null || _a === void 0 ? void 0 : _a.getAttribute) === null || _b === void 0 ? void 0 : _b.call(_a, 'content');
        let name = rawName;
        if (keywords) {
            // 可以考虑剔除第二个关键字里面的 Season 3
            const firstKeyword = keywords.split(',')[0];
            name = rawName.replace(firstKeyword, '').trim();
            // name: rawName.replace(/第.季/, ''),
        }
        const subjectInfo = {
            name,
            score: (_d = (_c = $q('.ll.rating_num')) === null || _c === void 0 ? void 0 : _c.textContent) !== null && _d !== void 0 ? _d : 0,
            count: (_f = (_e = $q('.rating_people > span')) === null || _e === void 0 ? void 0 : _e.textContent) !== null && _f !== void 0 ? _f : 0,
            rawName,
            url: location.href,
        };
        const $date = $q('span[property="v:initialReleaseDate"]');
        if ($date) {
            subjectInfo.releaseDate = $date.textContent.replace(/\(.*\)/, '');
        }
        return subjectInfo;
    },
    insertScoreInfo(info) {
        let $panel = $q('#interest_sectl');
        let $friendsRatingWrap = $q('.friends_rating_wrap');
        if (!$friendsRatingWrap) {
            $friendsRatingWrap = document.createElement('div');
            $friendsRatingWrap.className = 'friends_rating_wrap clearbox';
            $panel.appendChild($friendsRatingWrap);
        }
        const score = roundNum(Number(info.score || 0), 1);
        const $div = document.createElement('div');
        const favicon = GM_getResourceURL(`${info.site}_favicon`);
        const rawHTML = `<strong class="rating_avg">${score}</strong>
                    <div class="friends">
                            <a class="avatar" title="${info.site}" href="javascript:;">
                            <img src="${favicon}"/>
                            </a>
                    </div>
                    <a href="${info.url}" rel="noopener noreferrer nofollow" class="friends_count" target="_blank">${info.count || 0}人评价</a>
`;
        $div.className = 'rating_content_wrap clearfix e-userjs-score-compare';
        $div.innerHTML = rawHTML;
        //toggleLoading(true);
        $friendsRatingWrap.appendChild($div);
    },
};
const BangumiScorePage = {
    name: sites[1],
    controlSelector: [
        {
            selector: '#panelInterestWrapper h2',
        },
    ],
    pageSelector: [
        {
            selector: '.focus.chl.anime',
        },
    ],
    getSubjectInfo: function () {
        var _a, _b, _c, _d;
        let info = {
            name: $q('h1>a').textContent.trim(),
            score: (_b = (_a = $q('.global_score span[property="v:average"')) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : 0,
            count: (_d = (_c = $q('span[property="v:votes"')) === null || _c === void 0 ? void 0 : _c.textContent) !== null && _d !== void 0 ? _d : 0,
            url: location.href,
        };
        let infoList = $qa('#infobox>li');
        if (infoList && infoList.length) {
            for (let i = 0, len = infoList.length; i < len; i++) {
                let el = infoList[i];
                if (el.innerHTML.match(/放送开始|上映年度/)) {
                    info.releaseDate = dealDate(el.textContent.split(':')[1].trim());
                }
                // if (el.innerHTML.match('播放结束')) {
                //   info.endDate = dealDate(el.textContent.split(':')[1].trim());
                // }
            }
        }
        return info;
    },
    insertScoreInfo(info) {
        let $panel = $q('.SidePanel.png_bg');
        if ($panel) {
            const score = roundNum(Number(info.score || 0), 2);
            let $div = document.createElement('div');
            $div.classList.add('frdScore');
            $div.classList.add('e-userjs-score-compare');
            const convertName = (site) => {
                if (site === 'myanimelist') {
                    return 'MAL';
                }
                else if (site === 'douban') {
                    return '豆瓣';
                }
                return site;
            };
            $div.innerHTML = `${convertName(info.site)}评价：<span class="num">${score}</span> <span class="desc" style="visibility:hidden">还行</span> <a href="${info.url}" target="_blank" rel="noopener noreferrer nofollow" class="l">${info.count || 0} 人评分</a>
`;
            $panel.appendChild($div);
        }
    },
    initControlDOM($target) {
        if (!$target)
            return;
        // 已存在控件时返回
        if ($q('.e-userjs-score-ctrl'))
            return;
        const rawHTML = `<a title="强制刷新豆瓣和MAL评分" class="e-userjs-score-ctrl e-userjs-score-fresh">O</a>
      <a title="清除所有评分缓存" class="e-userjs-score-ctrl e-userjs-score-clear">X</a>
`;
        $target.innerHTML = $target.innerHTML + rawHTML;
        addStyle();
        document
            .querySelector('.e-userjs-score-clear')
            .addEventListener('click', clearInfoStorage, false);
        $q('.e-userjs-score-fresh').addEventListener('click', () => {
            init(BangumiScorePage, true);
        }, false);
    },
};
function addStyle(css) {
    if (css) {
        GM_addStyle(css);
    }
    else {
        GM_addStyle(`
      .e-userjs-score-ctrl {color:#f09199;font-weight:800;float:right;}
      .e-userjs-score-ctrl:hover {cursor: pointer;}
      .e-userjs-score-clear {margin-right: 12px;}
      .e-userjs-score-loading { width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif"); }
      `);
    }
}
// Bangumi Loading
function toggleLoading(hidden) {
    let $div = $q('.e-userjs-score-loading');
    if (!$div) {
        $div = document.createElement('div');
        $div.classList.add('e-userjs-score-loading');
        let $panel = $q('.SidePanel.png_bg');
        $panel.appendChild($div);
    }
    if (hidden) {
        $div.style.display = 'none';
    }
    else {
        $div.style.display = '';
    }
}
async function init(page, force) {
    var _a, _b;
    const $page = findElement(page.pageSelector);
    if (!$page)
        return;
    const $title = findElement(page.controlSelector);
    if (!$title)
        return;
    await checkInfoUpdate();
    (_a = page === null || page === void 0 ? void 0 : page.initControlDOM) === null || _a === void 0 ? void 0 : _a.call(page, $title);
    const curPageId = getSubjectId(location.href);
    const curPageScoreInfo = Object.assign({ site: page.name }, page.getSubjectInfo());
    saveScoreInfo(curPageScoreInfo);
    let subjectIdDict = readSubjectIdDict(page.name, curPageId);
    // 强制刷新，不使用缓存
    if (force) {
        subjectIdDict = undefined;
        // 刷新时，移除原来的数据
        (_b = $qa('.frdScore.e-userjs-score-compare')) === null || _b === void 0 ? void 0 : _b.forEach(($el) => {
            $el.remove();
        });
    }
    let dict = Object.assign({}, subjectIdDict);
    for (const s of sites) {
        let info;
        if (s !== page.name) {
            if (subjectIdDict) {
                const id = subjectIdDict[s];
                info = readScoreInfo(s, id);
            }
            // 不存在缓存数据
            if (!info) {
                info = await fetchScoreInfo(s, curPageScoreInfo);
            }
            if (info) {
                page.insertScoreInfo(info);
                saveScoreInfo(info);
                // 索引里面没有这个数据
                if (!dict[s]) {
                    dict[s] = getSubjectId(info.url);
                }
            }
        }
    }
    // 保存索引数据
    saveValue(genSubjectIdDictKey(page.name, curPageId), dict);
    saveValue(CURRENT_ID_DICT, Object.assign(Object.assign({}, dict), { [page.name]: curPageId }));
}
if (location.hostname.match(/bgm.tv|bangumi.tv|chii.in/)) {
    GM_addValueChangeListener(BANGUMI_LOADING, (n, oldValue, newValue) => {
        if (newValue === false) {
            toggleLoading(true);
        }
        else if (newValue === true) {
            toggleLoading();
        }
    });
    init(BangumiScorePage);
}
if (location.hostname.match('movie.douban.com')) {
    init(DoubanScorePage);
}
