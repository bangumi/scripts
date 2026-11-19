// ==UserScript==
// @name        Bangumi 国内放送站点链接
// @description 为 Bangumi 动画条目页左侧添加来自 bgmlist.tv 的国内放送站点链接
// @namespace   org.sorz.bangumi
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @version     0.4.4
// @run-at      document-body
// ==/UserScript==

const BGMLIST_URL = 'https://bgmlist.sorz.org/data/items/$Y/$M.json';
const SITES_INFO_URL = 'https://bgmlist.sorz.org/data/sites/onair.json';
const FETCH_PARAMS = { referrerPolicy: "no-referrer" };

const $ = selector => document.querySelector(selector);


// return on-air date [year, month] of bgm in current page
function getOnAirYearMonth() {
  const date = Array.from(document.querySelectorAll('#infobox .tip'))
    .find(t => t.textContent.match(/^(放送开始|上映年度)/));
  if (date == undefined) throw "on-air date not found";
  let [_, year, month] = date.parentElement.textContent
    .match(/(\d{4})年(\d{1,2})月/);
  return [+year, +month];
}

// return full bgm list on given on-air date
async function getBgmList(year, month) {
  const url = BGMLIST_URL.replace('$Y', year.toString()).replace('$M', month.toString().padStart(2, '0'));
  const resp = await fetch(url, FETCH_PARAMS);
  if (!resp.ok) throw "fail to fetch bgmlist: " + resp.status;
  let list = await resp.json();
  let bgms = new Map(
    list.map(bgm => {
      if (!bgm.sites) return;
      const site = bgm.sites.find(s => s.site == 'bangumi');
      if (site) return [site.id, bgm];
    }).filter(b => b)
  );
  return bgms;
}

async function getSiteInfo() {
  const resp = await fetch(SITES_INFO_URL, FETCH_PARAMS);
  if (!resp.ok) throw "fail to fetch site infos: " + resp.status;
  return await resp.json();
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

function addOnAirSites(bgm, sites) {
  const links = bgm.sites.map(({ site, id, url }) => {
    const info = sites[site];
    if (!info) return;
    if (!url)
      url = info.urlTemplate.replace('{{id}}', id);
    return [url, info.title];
  }).filter(u => u);
  if (links.length)
    addInfoRow('放送站点', links);
  else
    throw 'not available on-air site';
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const bgmId = location.pathname.match(/\/subject\/(\d+)/)[1];
    const [year, month] = getOnAirYearMonth();
    let bgm = (await getBgmList(year, month)).get(bgmId)
      ?? (await getBgmList(year, month - 1)).get(bgmId)
      ?? (await getBgmList(year, month + 1)).get(bgmId);

    if (!bgm)
      throw `#${bgmId} not found in bgmlist-${year}-${month}|${month - 1}|${month + 1}`;

    const sites = await getSiteInfo();
    addOnAirSites(bgm, sites);
  } catch (err) {
    console.log(`[bgmlist] ${err}`);
  }
});

