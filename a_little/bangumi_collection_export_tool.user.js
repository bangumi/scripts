// ==UserScript==
// @name        bangumi collection export tool
// @name:zh-CN  bangumi 收藏导出工具
// @namespace   https://github.com/22earth
// @description 导出和导入 Bangumi 收藏为 Excel
// @description:en-US export or import collection on bangumi.tv
// @description:zh-CN 导出和导入 Bangumi 收藏为 Excel
// @author      22earth
// @homepage    https://github.com/22earth/gm_scripts
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/\w+\/list\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/index\/\d+/
// @version     0.0.6
// @note        0.0.6 导出格式改为 excel 和支持 excel 的导入。
// @note        0.0.4 添加导入功能。注意：不支持是否对自己可见的导入
// @grant       GM_xmlhttpRequest
// @require     https://cdn.staticfile.org/jschardet/1.4.1/jschardet.min.js
// @require     https://cdn.staticfile.org/xlsx/0.18.5/xlsx.full.min.js
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
function getInterestTypeName(type) {
    return typeIdDict[type].name;
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
function getRowItem(item) {
    const dict = {
        name: '名称',
        greyName: '别名',
        releaseDate: '发行日期',
        url: '地址',
        cover: '封面地址',
        rawInfos: '其它信息',
    };
    const dictCollection = {
        date: '收藏日期',
        score: '我的评分',
        tags: '标签',
        comment: '吐槽',
        interestType: WATCH_STATUS_STR,
    };
    const res = {};
    for (const [key, value] of Object.entries(dict)) {
        // @ts-ignore
        res[value] = item[key] || '';
    }
    for (const [key, value] of Object.entries(dictCollection)) {
        const collect = item.collectInfo || {};
        if (key === 'interestType') {
            res[value] = getInterestTypeName(item.collectInfo.interestType) || '';
            continue;
        }
        // @ts-ignore
        res[value] = collect[key] || '';
    }
    return res;
}
function downloadExcel(filename, items) {
    const rows = items.map((item) => getRowItem(item));
    // @TODO 采用分步写入的方式
    const header = CSV_HEADER.split(',');
    header.push(WATCH_STATUS_STR);
    const worksheet = XLSX.utils.json_to_sheet(rows, {
        header,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户收藏');
    XLSX.writeFile(workbook, filename);
}
function genAllExportBtn(filename) {
    const btnStr = `<li><a href="javascript:void(0);"><span style="color:tomato;">导出所有收藏</span></a></li>`;
    const $node = htmlToElement(btnStr);
    $node.addEventListener('click', async (e) => {
        const $text = $node.querySelector('span');
        $text.innerText = '导出中...';
        $node.style.pointerEvents = 'none';
        let infos = [];
        for (const t of interestTypeArr) {
            let res = [];
            try {
                res = await getCollectionInfo(genListUrl(t));
            }
            catch (error) {
                console.error('抓取错误: ', error);
            }
            infos = infos.concat(res.map((item) => {
                item.collectInfo.interestType = t;
                return item;
            }));
        }
        downloadExcel(filename, infos);
        $text.innerText = '完成所有导出';
        $node.style.pointerEvents = 'auto';
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
        let res = [];
        try {
            res = await getCollectionInfo(location.href);
        }
        catch (error) {
            console.error('抓取错误: ', error);
        }
        const interestType = getInterestTypeByUrl(location.href);
        downloadExcel(filename, res.map((item) => {
            item.collectInfo.interestType = interestType;
            return item;
        }));
        $text.innerText = '导出完成';
        $node.style.pointerEvents = 'auto';
    });
    return $node;
}
async function updateUserInterest(subject, data, $infoDom) {
    const nameStr = `<span style="color:tomato">《${subject.name}》</span>`;
    try {
        const subjectId = getSubjectId(subject.url);
        if (!subjectId) {
            throw new Error('条目地址无效');
        }
        insertLogInfo($infoDom, `更新收藏 ${nameStr} 中...`);
        await updateInterest(subjectId, data);
        insertLogInfo($infoDom, `更新收藏 ${nameStr} 成功`);
        await randomSleep(2000, 1000);
    }
    catch (error) {
        insertLogInfo($infoDom, `导入 ${nameStr} 错误: ${error}`);
        console.error('导入错误: ', error);
    }
}
function readCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const detectReader = new FileReader();
        detectReader.readAsBinaryString(file);
        detectReader.onload = function (e) {
            const contents = this.result;
            const arr = contents.split(/\r\n|\n/);
            // 检测文件编码
            reader.readAsText(file, jschardet.detect(arr[0].toString()).encoding);
        };
        reader.onload = function (e) {
            resolve(this.result);
        };
        reader.onerror = function (e) {
            reject(e);
        };
    });
}
async function handleFileAsync(e) {
    const target = e.target;
    const $parent = this.closest('li');
    const file = target.files[0];
    let workbook;
    if (file.name.includes('.csv')) {
        const data = await readCSV(file);
        workbook = XLSX.read(data, { type: 'string' });
    }
    else {
        const data = await file.arrayBuffer();
        workbook = XLSX.read(data);
    }
    var first_sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[first_sheet_name];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    const $menu = document.querySelector('#columnSubjectBrowserB .menu_inner');
    for (const item of jsonData) {
        try {
            const subject = {
                name: item['名称'],
                url: item['地址'],
            };
            if (!subject.name || !subject.url) {
                throw new Error('没有条目信息');
            }
            const info = {
                interest: getInterestTypeIdByName(item[WATCH_STATUS_STR]),
                rating: item['我的评分'],
                comment: item['吐槽'],
                tags: item['标签'],
            };
            await updateUserInterest(subject, info, $menu);
        }
        catch (error) {
            console.error('导入错误: ', error);
        }
    }
    $parent.querySelector('a > span').innerHTML = '导入完成';
    $parent.style.pointerEvents = 'auto';
}
function genImportControl() {
    const btnStr = `<li title="支持和导出表头相同的 csv 和 xlsx 文件">
  <a href="javascript:void(0);"><span style="color:tomato;"><label for="e-userjs-import-csv-file">导入收藏</label></span></a>
  <input type="file" id="e-userjs-import-csv-file" style="display:none" />
</li>`;
    const $node = htmlToElement(btnStr);
    const $file = $node.querySelector('#e-userjs-import-csv-file');
    // $file.addEventListener('change', handleInputChange);
    $file.addEventListener('change', handleFileAsync);
    return $node;
}
function addExportBtn(ext = 'xlsx') {
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
    const filename = `${name}-${type}-${formatDate(new Date())}.${ext}`;
    $nav.appendChild(genAllExportBtn(`${name}-${formatDate(new Date())}.${ext}`));
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
    $header.appendChild(genExportBtn(`${title}.xlsx`));
}
if (location.href.match(/\w+\/list\//)) {
    addExportBtn();
}
