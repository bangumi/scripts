// ==UserScript==
// @name        bangumi collection export tool
// @name:zh-CN  bangumi 收藏导出工具
// @namespace   https://github.com/22earth
// @description 导出 Bangumi 收藏
// @description:en-US export collection on bangumi.tv
// @description:zh-CN 导出 Bangumi 收藏
// @author      22earth
// @homepage    https://github.com/22earth/gm_scripts
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/\w+\/list\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/index\/\d+/
// @version     0.0.4
// @note        0.0.4 添加导入功能。注意：不支持是否对自己可见的导入
// @grant       GM_xmlhttpRequest
// @require     https://cdn.staticfile.org/jschardet/1.4.1/jschardet.min.js
// @run-at      document-end
// ==/UserScript==


function formatDate(time, fmt = 'yyyy-MM-dd') {
    const date = new Date(time);
    var o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(), //毫秒
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
let retryCounter = 0;
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
                        retryCounter = 0;
                        reject(404);
                    }
                    else if (res.status === 302 && retryCounter < 5) {
                        retryCounter++;
                        resolve(fetchInfo(res.finalUrl, type, opts, TIMEOUT));
                    }
                    if (opts.decode && type === 'arraybuffer') {
                        retryCounter = 0;
                        let decoder = new TextDecoder(opts.decode);
                        resolve(decoder.decode(res.response));
                    }
                    else {
                        retryCounter = 0;
                        resolve(res.response);
                    }
                }, onerror: (e) => {
                    retryCounter = 0;
                    reject(e);
                } }, gmXhrOpts));
        });
    }
}
function fetchText(url, opts = {}, TIMEOUT = 10 * 1000) {
    return fetchInfo(url, 'text', opts, TIMEOUT);
}

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

// @TODO 听和读没有区分开
const typeIdDict = {
    dropped: {
        name: '抛弃',
        id: '5',
    },
    on_hold: {
        name: '搁置',
        id: '4',
    },
    do: {
        name: '在看',
        id: '3',
    },
    collect: {
        name: '看过',
        id: '2',
    },
    wish: {
        name: '想看',
        id: '1',
    },
};
// 默认返回 2， 表示看过
function getInterestTypeIdByName(name) {
    let type = '2';
    if (!name)
        return type;
    let key;
    for (key in typeIdDict) {
        if (typeIdDict[key].name === name) {
            return typeIdDict[key].id;
        }
    }
    return type;
}
function getInterestTypeId(type) {
    return typeIdDict[type].id;
}
function getInterestTypeName(type) {
    return typeIdDict[type].name;
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
function insertLogInfo($sibling, txt) {
    const $log = document.createElement('div');
    $log.classList.add('e-wiki-log-info');
    // $log.setAttribute('style', 'color: tomato;');
    $log.innerHTML = txt;
    $sibling.parentElement.insertBefore($log, $sibling);
    $sibling.insertAdjacentElement('afterend', $log);
    return $log;
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
    const collectInfo = {};
    const $comment = $item.querySelector('#comment_box');
    if ($comment) {
        collectInfo.comment = $comment.textContent.trim();
    }
    if ($collectInfo) {
        const textArr = $collectInfo.textContent.split('/');
        collectInfo.date = textArr[0].trim();
        textArr.forEach((str) => {
            if (str.match('标签')) {
                collectInfo.tags = str.replace(/标签:/, '').trim();
            }
        });
        const $starlight = $collectInfo.querySelector('.starlight');
        if ($starlight) {
            $starlight.classList.forEach((s) => {
                if (/stars\d/.test(s)) {
                    collectInfo.score = s.replace('stars', '');
                }
            });
        }
    }
    if (Object.keys(collectInfo).length) {
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
    const pList = $multipage === null || $multipage === void 0 ? void 0 : $multipage.querySelectorAll('.page_inner>.p');
    if (pList && pList.length) {
        let tempNum = parseInt(pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]);
        totalPageNum = parseInt(pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]);
        totalPageNum = totalPageNum > tempNum ? totalPageNum : tempNum;
    }
    return totalPageNum;
}
function loadIframe($iframe, subjectId) {
    return new Promise((resolve, reject) => {
        $iframe.src = `/update/${subjectId}`;
        let timer = setTimeout(() => {
            timer = null;
            reject('bangumi iframe timeout');
        }, 5000);
        $iframe.onload = () => {
            clearTimeout(timer);
            $iframe.onload = null;
            resolve(null);
        };
    });
}
async function getUpdateForm(subjectId) {
    const iframeId = 'e-userjs-update-interest';
    let $iframe = document.querySelector(`#${iframeId}`);
    if (!$iframe) {
        $iframe = document.createElement('iframe');
        $iframe.style.display = 'none';
        $iframe.id = iframeId;
        document.body.appendChild($iframe);
    }
    await loadIframe($iframe, subjectId);
    const $form = $iframe.contentDocument.querySelector('#collectBoxForm');
    return $form;
    // return $form.action;
}
/**
 * 更新用户收藏
 * @param subjectId 条目 id
 * @param data 更新数据
 */
async function updateInterest(subjectId, data) {
    // gh 暂时不知道如何获取，直接拿 action 了
    const $form = await getUpdateForm(subjectId);
    const formData = new FormData($form);
    const obj = Object.assign({ referer: 'ajax', tags: '', comment: '', update: '保存' }, data);
    for (let [key, val] of Object.entries(obj)) {
        if (!formData.has(key)) {
            formData.append(key, val);
        }
        else {
            // 标签和吐槽可以直接清空
            if (['tags', 'comment', 'rating'].includes(key)) {
                formData.set(key, val);
            }
            else if (!formData.get(key) && val) {
                formData.set(key, val);
            }
        }
    }
    await fetch($form.action, {
        method: 'POST',
        body: formData,
    });
}

/**
 * 为页面添加样式
 * @param style
 */
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

// 目前写死
const CSV_HEADER = '名称,别名,发行日期,地址,封面地址,收藏日期,我的评分,标签,吐槽,其它信息';
const WATCH_STATUS_STR = '观看状态';
const interestTypeArr = [
    'wish',
    'collect',
    'do',
    'on_hold',
    'dropped',
];
function genListUrl(t) {
    let u = location.href.replace(/[^\/]+?$/, '');
    return u + t;
}
function clearLogInfo($container) {
    $container
        .querySelectorAll('.e-wiki-log-info')
        .forEach((node) => node.remove());
}
// 通过 URL 获取收藏的状态
function getInterestTypeByUrl(url) {
    let m = url.match(/[^\/]+?$/);
    return m[0].split('#')[0];
}
async function getCollectionInfo(url) {
    const rawText = await fetchText(url);
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
        await sleep(500);
        console.info('fetch info: ', reqUrl);
        const rawText = await fetchText(reqUrl);
        const $doc = new DOMParser().parseFromString(rawText, 'text/html');
        res.push(...getItemInfos($doc));
        page += 1;
    }
    return res;
}
function genCSVHeader(type = false) {
    let csvHeader = `\ufeff${CSV_HEADER}`;
    // 添加 想看 在看 搁置
    if (type) {
        csvHeader += `,${WATCH_STATUS_STR}`;
    }
    return csvHeader;
}
function genCSVContent(res, status) {
    const hostUrl = getBgmHost();
    let csvContent = '';
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
        if (status) {
            csvContent += `,${status}`;
        }
    });
    return csvContent;
}
function genAllExportBtn(filename) {
    const btnStr = `<li><a href="javascript:void(0);"><span style="color:tomato;">导出所有收藏</span></a></li>`;
    const $node = htmlToElement(btnStr);
    $node.addEventListener('click', async (e) => {
        const $text = $node.querySelector('span');
        $text.innerText = '导出中...';
        $node.style.pointerEvents = 'none';
        let csvContent = '';
        for (const t of interestTypeArr) {
            const res = await getCollectionInfo(genListUrl(t));
            csvContent += genCSVContent(res, getInterestTypeName(t));
        }
        const csv = genCSVHeader(true) + csvContent;
        $text.innerText = '完成所有导出';
        $node.style.pointerEvents = 'auto';
        downloadFile(csv, filename);
    });
    return $node;
}
function genExportBtn(filename) {
    const btnStr = `<li><a href="javascript:void(0);"><span style="color:tomato;">导出收藏</span></a></li>`;
    const $node = htmlToElement(btnStr);
    $node.addEventListener('click', async (e) => {
        const $text = $node.querySelector('span');
        $text.innerText = '导出中...';
        $node.style.pointerEvents = 'none';
        const res = await getCollectionInfo(location.href);
        const csv = genCSVHeader() + genCSVContent(res);
        $text.innerText = '导出完成';
        $node.style.pointerEvents = 'auto';
        downloadFile(csv, filename);
    });
    return $node;
}
function handleInputChange() {
    const file = this.files[0];
    const $parent = this.closest('li');
    const reader = new FileReader();
    const detectReader = new FileReader();
    detectReader.onload = function (e) {
        const contents = this.result;
        const arr = contents.split(/\r\n|\n/);
        // 检测文件编码
        reader.readAsText(file, jschardet.detect(arr[0].toString()).encoding);
    };
    reader.onload = async function (e) {
        var _a;
        const contents = this.result;
        var contentsArr = contents.split(/\r\n|\n/);
        const $container = document.querySelector('#columnSubjectBrowserB');
        clearLogInfo($container);
        $parent.style.pointerEvents = 'none';
        $parent.querySelector('a > span').innerHTML = '导入中...';
        const $menu = document.querySelector('#columnSubjectBrowserB .menu_inner');
        for (let i = 0; i < contentsArr.length; i++) {
            const str = contentsArr[i];
            if (i === 0) {
                // 为了避免错误，暂时只支持导出格式的 csv.
                if (!str.includes(CSV_HEADER)) {
                    alert(`只支持 csv 文件\r\n文件开头为:\r\n"${CSV_HEADER}"`);
                    break;
                }
                console.log('==========Header==========');
                console.log(str);
                continue;
            }
            console.log(str);
            if (!str.includes(',')) {
                continue;
            }
            try {
                // @TODO 硬编码的索引
                const arr = str.split(',');
                const subjectId = getSubjectId(arr[3]);
                let interest = '2';
                // 为空时，取 URL 的
                if (!arr[10]) {
                    interest = getInterestTypeId(getInterestTypeByUrl(location.href));
                }
                else {
                    interest = getInterestTypeIdByName(arr[10]);
                }
                if (subjectId) {
                    const data = {
                        interest: interest,
                        rating: arr[6],
                        tags: arr[7],
                        // 剔除多余引号
                        comment: (_a = arr[8]) === null || _a === void 0 ? void 0 : _a.replace(/^"|"$/g, ''),
                    };
                    const nameStr = `<span style="color:tomato">《${arr[0]}》</span>`;
                    insertLogInfo($menu, `更新收藏 ${nameStr} 中...`);
                    await updateInterest(subjectId, data);
                    insertLogInfo($menu, `更新收藏 ${nameStr} 成功`);
                    await randomSleep(2000, 1000);
                }
            }
            catch (error) {
                console.error('导入错误: ', error);
            }
        }
        $parent.querySelector('a > span').innerHTML = '导入完成';
        $parent.style.pointerEvents = 'auto';
    };
    detectReader.readAsBinaryString(file);
}
function genImportControl() {
    const btnStr = `<li title="只支持和导出格式一致的 csv 文件">
  <a href="javascript:void(0);"><span style="color:tomato;"><label for="e-userjs-import-csv-file">导入收藏</label></span></a>
  <input type="file" id="e-userjs-import-csv-file" style="display:none" />
</li>`;
    const $node = htmlToElement(btnStr);
    const $file = $node.querySelector('#e-userjs-import-csv-file');
    $file.addEventListener('change', handleInputChange);
    return $node;
}
function addExportBtn() {
    var _a;
    const $nav = $q('#headerProfile .navSubTabs');
    if (!$nav)
        return;
    const type = ((_a = $nav.querySelector('.focus')) === null || _a === void 0 ? void 0 : _a.textContent) || '';
    const $username = $q('.nameSingle .inner>a');
    let name = '导出收藏';
    if ($username) {
        name = $username.textContent;
    }
    const filename = `${name}-${type}-${formatDate(new Date())}.csv`;
    $nav.appendChild(genAllExportBtn(`${name}-${formatDate(new Date())}.csv`));
    // 判断是否在单个分类页面
    const interestType = getInterestTypeByUrl(location.href);
    if (interestTypeArr.includes(interestType)) {
        $nav.appendChild(genExportBtn(filename));
    }
    $nav.appendChild(genImportControl());
}
// 索引
if (location.href.match(/index\/\d+/)) {
    const $header = $q('#header');
    const title = $header.querySelector('h1').textContent.trim();
    $header.appendChild(genExportBtn(`${title}.csv`));
}
if (location.href.match(/\w+\/list\//)) {
    addExportBtn();
}
