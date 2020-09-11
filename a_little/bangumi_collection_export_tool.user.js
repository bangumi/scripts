// ==UserScript==
// @name        bangumi collection export tool
// @name:zh-CN  bangumi 收藏导出工具
// @namespace   https://github.com/22earth
// @description 导出 Bangumi 收藏
// @description:en-US export collection on bangumi.tv
// @description:zh-CN 导出 Bangumi 收藏
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/\w+\/list\/.*$/
// @version     0.0.2
// @run-at      document-end
// ==/UserScript==

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

// support GM_XMLHttpRequest
function fetchInfo(url, type, opts = {}, TIMEOUT = 10 * 1000) {
    return internalFetch(fetch(url, Object.assign({ method: 'GET' }, opts)), TIMEOUT).then((response) => response[type](), (err) => console.log('fetch err: ', err));
}
function fetchText(url, TIMEOUT = 10 * 1000) {
    return fetchInfo(url, 'text', {}, TIMEOUT);
}
// TODO: promise type
function internalFetch(fetchPromise, TIMEOUT) {
    let abortFn = null;
    const abortPromise = new Promise(function (resolve, reject) {
        abortFn = function () {
            reject('abort promise');
        };
    });
    let abortablePromise = Promise.race([fetchPromise, abortPromise]);
    setTimeout(function () {
        abortFn();
    }, TIMEOUT);
    return abortablePromise;
}

function sleep(num) {
    return new Promise(resolve => {
        setTimeout(resolve, num);
    });
}

function getBgmHost() {
    return `${location.protocol}//${location.host}`;
}
function convertItemInfo($item) {
    let $subjectTitle = $item.querySelector('h3>a.l');
    let itemSubject = {
        name: $subjectTitle.textContent.trim(),
        rawInfos: $item.querySelector('.info').textContent.trim(),
        // url 没有协议和域名
        url: $subjectTitle.getAttribute('href'),
        greyName: $item.querySelector('h3>.grey')
            ? $item.querySelector('h3>.grey').textContent.trim()
            : '',
    };
    let matchDate = $item
        .querySelector('.info')
        .textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
    if (matchDate) {
        itemSubject.releaseDate = dealDate(matchDate[0]);
    }
    const $rateInfo = $item.querySelector('.rateInfo');
    if ($rateInfo) {
        const rateInfo = {};
        if ($rateInfo.querySelector('.fade')) {
            rateInfo.score = $rateInfo.querySelector('.fade').textContent;
            rateInfo.count = $rateInfo
                .querySelector('.tip_j')
                .textContent.replace(/[^0-9]/g, '');
        }
        else {
            rateInfo.score = '0';
            rateInfo.count = '少于10';
        }
        itemSubject.rateInfo = rateInfo;
    }
    const $rank = $item.querySelector('.rank');
    if ($rank) {
        itemSubject.rank = $rank.textContent.replace('Rank', '').trim();
    }
    const $collectInfo = $item.querySelector('.collectInfo');
    if ($collectInfo) {
        const collectInfo = {};
        const textArr = $collectInfo.textContent.split('/');
        collectInfo.date = textArr[0].trim();
        textArr.forEach((str) => {
            if (str.match('标签')) {
                collectInfo.tags = str.replace(/标签:/, '').trim();
            }
        });
        const $comment = $item.querySelector('#comment_box');
        if ($comment) {
            collectInfo.comment = $comment.textContent.trim();
        }
        const $starlight = $collectInfo.querySelector('.starlight');
        if ($starlight) {
            $starlight.classList.forEach((s) => {
                if (/stars\d/.test(s)) {
                    collectInfo.score = s.replace('stars', '');
                }
            });
        }
        itemSubject.collectInfo = collectInfo;
    }
    const $cover = $item.querySelector('.subjectCover img');
    if ($cover && $cover.tagName.toLowerCase() === 'img') {
        // 替换 cover/s --->  cover/l 是大图
        const src = $cover.getAttribute('src') || $cover.getAttribute('data-cfsrc');
        if (src) {
            itemSubject.cover = src.replace('pic/cover/s', 'pic/cover/l');
        }
    }
    return itemSubject;
}
function getItemInfos($doc = document) {
    const items = $doc.querySelectorAll('#browserItemList>li');
    const res = [];
    for (const item of Array.from(items)) {
        res.push(convertItemInfo(item));
    }
    return res;
}
function getTotalPageNum($doc = document) {
    const $multipage = $doc.querySelector('#multipage');
    let totalPageNum = 1;
    const pList = $multipage.querySelectorAll('.page_inner>.p');
    if (pList && pList.length) {
        let tempNum = parseInt(pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]);
        totalPageNum = parseInt(pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]);
        totalPageNum = totalPageNum > tempNum ? totalPageNum : tempNum;
    }
    return totalPageNum;
}
function getAllPageInfo(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const rawText = yield fetchText(url);
        const $doc = new DOMParser().parseFromString(rawText, 'text/html');
        const totalPageNum = getTotalPageNum($doc);
        const res = [...getItemInfos($doc)];
        let page = 2;
        while (page <= totalPageNum) {
            let reqUrl = url;
            const m = url.match(/page=(\d*)/);
            if (m) {
                reqUrl = reqUrl.replace(m[0], `page=${page}`);
            }
            else {
                reqUrl = `${reqUrl}?page=${page}`;
            }
            yield sleep(500);
            console.info('fetch info: ', reqUrl);
            const rawText = yield fetchText(reqUrl);
            const $doc = new DOMParser().parseFromString(rawText, 'text/html');
            res.push(...getItemInfos($doc));
            page += 1;
        }
        return res;
    });
}

/**
 * 为页面添加样式
 * @param style
 */
/**
 * 下载内容
 * https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 * @example
 * download(csvContent, 'dowload.csv', 'text/csv;encoding:utf-8');
 * BOM: data:text/csv;charset=utf-8,\uFEFF
 * @param content 内容
 * @param fileName 文件名
 * @param mimeType 文件类型
 */
function downloadFile(content, fileName, mimeType = 'application/octet-stream') {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {
        type: mimeType,
    }));
    a.style.display = 'none';
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

function genCSVContent(url = location.href) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield getAllPageInfo(url);
        const hostUrl = getBgmHost();
        let csvContent = '\ufeff名称,别名,发行日期,地址,封面地址,收藏日期,我的评分,标签,吐槽,其它信息';
        res.forEach((item) => {
            csvContent += `\r\n${item.name || ''},${item.greyName || ''},${item.releaseDate || ''}`;
            const subjectUrl = hostUrl + item.url;
            csvContent += `,${subjectUrl}`;
            const cover = item.cover || '';
            csvContent += `,${cover}`;
            const collectInfo = item.collectInfo || {};
            const collectDate = collectInfo.date || '';
            csvContent += `,${collectDate}`;
            const score = collectInfo.score || '';
            csvContent += `,${score}`;
            const tag = collectInfo.tag || '';
            csvContent += `,${tag}`;
            const comment = collectInfo.comment || '';
            csvContent += `,"${comment}"`;
            const rawInfos = item.rawInfos || '';
            csvContent += `,"${rawInfos}"`;
        });
        return csvContent;
    });
}
function addExportBtn() {
    const $nav = document.querySelector('#headerProfile .navSubTabs');
    if (!$nav)
        return;
    const btnStr = `<li><a href="#"><span style="color:tomato;">导出收藏</span></a></li>`;
    const $node = htmlToElement(btnStr);
    $node.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const $text = $node.querySelector('span');
        $text.innerText = '导出中...';
        const $username = document.querySelector('.nameSingle .inner>a');
        let name = '导出收藏';
        const type = ((_a = $nav.querySelector('.focus')) === null || _a === void 0 ? void 0 : _a.textContent) || '';
        if ($username) {
            name = $username.textContent;
        }
        const csv = yield genCSVContent();
        $text.innerText = '导出完成';
        downloadFile(csv, `${name}-${type}-${formatDate(new Date())}.csv`);
    }));
    $nav.appendChild($node);
}

addExportBtn();

