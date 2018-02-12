// ==UserScript==
// @name        Bangumi 国内放送站点链接
// @description 为 Bangumi 动画条目页左侧添加来自 bgmlist.tv 的国内放送站点及下载搜索链接
// @namespace   org.sorz.bangumi
// @grant       GM_setValue
// @grant       GM_getValue
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @version     0.3.2
// ==/UserScript==

// Change to false to disable download search links:
const DOWNLOAD_SEARCH_ENABLED = true;

const OLDEST_YEAR = 2013;
const CACHE_EXPIRE_SECS = 24 * 3600;
const BGMLIST_URL = 'https://bgmlist.com/tempapi/bangumi/$Y/$M/json';
const DOWNLOAD_DMHY_URL = "https://share.dmhy.org/topics/list?keyword=";
const DOWNLOAD_NYAA_URL = "https://nyaa.si/?page=search&term=";
const SITE_NAMES = {
  'acfun'   : 'A站',
  'bilibili': 'B站',
  'tucao'   : 'C站',
  'sohu'    : '搜狐',
  'youku'   : '优酷',
  'qq'      : '腾讯',
  'iqiyi'   : '爱奇艺',
  'letv'    : '乐视',
  'le'      : '乐视',
  'pptv'    : 'PPTV',
  'tudou'   : '土豆',
  'movie'   : '迅雷',
  'mgtv'    : '芒果'
};
const $ = selector => document.querySelector(selector);
  
function getOnAirYearMonth() {
  let dates = Array.from(document.querySelectorAll('#infobox .tip'))
    .filter(t => t.textContent.startsWith('放送开始'))
    .map(t => t.parentElement.textContent.match(/(\d{4})年(\d{1,2})月/))
    .filter(t => t != null)
    .map(t => [parseInt(t[1]), parseInt(t[2])]);
  if (dates) return dates[0];
  else throw "on-air date not found";
}

function getCachedValue(key, maxAge=CACHE_EXPIRE_SECS) {
  const item = JSON.parse(GM_getValue(key, "{}"));
  if (!item.cache_store_at ||
      Date.now() - item.cache_store_at > maxAge * 1000)
    return;
  return item.value;
}

function setCachedValue(key, value) {
  const item = {
    'cache_store_at': Date.now(),
    'value': value
  };
  GM_setValue(key, JSON.stringify(item));
}

async function getBgmList(year, month) {
  const cacheKey = `bgms-${year}-${month}`;
  let bgms = getCachedValue(cacheKey);
  if (bgms)
    return new Map(bgms);
  const url = BGMLIST_URL.replace('$Y', year).replace('$M', month);
  let resp = await fetch(url);
  if (!resp.ok) throw "fail to fetch bgmlist: " + resp.status;
  let list = await resp.json();
  bgms = new Map(
    Object.values(list)
      .map(b => [`${b.bgmId}`, b])
      .filter(([bgmId, _]) => bgmId != undefined)
  );
  setCachedValue(cacheKey, [...bgms]);
  return bgms;
}

function addInfoRow(title, links) {
  let tli = document.createElement('template');
  tli.innerHTML = '<li><span class="tip"></span></li>';
  let li = tli.content.firstChild;
  li.firstChild.textContent = `${title}：`;
  let ta = document.createElement('template');
  ta.innerHTML = '<a class="l"></a>';
  let a = ta.content.firstChild;
  let dot = document.createTextNode("、");
 
  links.forEach(([href, title]) => {
    a.href = href;
    a.innerText = title;
    li.appendChild(a.cloneNode(true));
    li.appendChild(dot.cloneNode());
  });
  li.lastChild.remove();
  
  let row = document.importNode(tli.content, true);
  $("#infobox").appendChild(row);
}

function addDownloadSearchLinks(bgm) {
  var cn = bgm.titleCN ? bgm.titleCN : bgm.titleJP;
  var en = bgm.titleEN ? bgm.titleEN : bgm.titleJP;
  addInfoRow('下载',[
    [DOWNLOAD_DMHY_URL + cn, '花园'],
    [DOWNLOAD_NYAA_URL + en, 'Nyaa']
  ]);
}

function addOnAirSites(bgm) {
  let links = bgm.onAirSite.map(url => {
    let site = url.match(/https?:\/\/\w+\.(\w+)\./)[1];
    let name = site in SITE_NAMES ? SITE_NAMES[site] : site;
    return [url, name];
  });
  if (links)
    addInfoRow('放送站点', links);
}

window.addEventListener('load', async () => {
  let [year, month] = await getOnAirYearMonth();
  if (year < OLDEST_YEAR) return;
  
  let bgms = await getBgmList(year, month);
  let id = location.pathname.match(/\/subject\/(\d+)/)[1];
  let bgm = bgms.get(id);
  if (!bgm) throw `bangumi #${id} not found in bgmlist`;
  
  addOnAirSites(bgm);
  if (DOWNLOAD_SEARCH_ENABLED)
    addDownloadSearchLinks(bgm);
});
