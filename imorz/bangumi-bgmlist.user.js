// ==UserScript==
// @name        Bangumi 国内放送站点链接
// @description 为 Bangumi 动画条目页左侧添加来自 bgmlist.tv 的国内放送站点链接
// @namespace   org.sorz.bangumi
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @version     0.3.3
// ==/UserScript==

const OLDEST_YEAR = 2013;
// The original link (without cache control):
// const BGMLIST_URL = 'https://bgmlist.com/tempapi/bangumi/$Y/$M/json';
// Reverse proxy with cache:
const BGMLIST_URL = 'https://bgmlist.sorz.org/bangumi/$Y/$M.json';
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

async function getBgmList(year, month) {
  const url = BGMLIST_URL.replace('$Y', year).replace('$M', month);
  let resp = await fetch(url, { referrerPolicy: "no-referrer" });
  if (!resp.ok) throw "fail to fetch bgmlist: " + resp.status;
  let list = await resp.json();
  bgms = new Map(
    Object.values(list)
      .map(b => [`${b.bgmId}`, b])
      .filter(([bgmId, _]) => bgmId != undefined)
  );
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
});

