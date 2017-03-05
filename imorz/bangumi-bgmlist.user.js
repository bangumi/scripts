// ==UserScript==
// @name        Bangumi 国内放送站点链接
// @description 为 Bangumi 动画条目页左侧添加来自 bgmlist.tv 的国内放送站点及下载搜索链接
// @namespace   org.sorz.bangumi
// @grant       GM_setValue
// @grant       GM_getValue
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @require     http://code.jquery.com/jquery-3.1.1.min.js
// @version     0.2.0
// ==/UserScript==

const OLDEST_YEAR = 2013;
const CACHE_EXPIRE_SECS = 24 * 3600;
const BGMLIST_URL = 'https://bgmlist.com/tempapi/bangumi/$Y/$M/json';
const DOWNLOAD_DMHY_URL = "http://share.dmhy.org/topics/list?keyword=";
const DOWNLOAD_NYAA_URL = "http://www.nyaa.se/?page=search&term=";
const SITES = {
  'acfun'   : { name: 'A站' },
  'bilibili': { name: 'B站' },
  'tucao'   : { name: 'C站' },
  'sohu'    : { name: '搜狐' },
  'youku'   : { name: '优酷' },
  'qq'      : { name: '腾讯' },
  'iqiyi'   : { name: '爱奇艺'},
  'letv'    : { name: '乐视'}, 
  'pptv'    : { name: 'PPTV'},
  'tudou'   : { name: '土豆'}, 
  'movie'   : { name: '迅雷'}
}

// Change to false to disable download search links:
const DOWNLOAD_SEARCH_ENABLED = true;

let $infobox = $('#infobox');

function $a(href, text) {
  return $('<a>').addClass('l').attr('href', href).text(text);
}

function currentBgmId() {
  return location.pathname.match(/\/subject\/(\d+)/)[1];
}
  
function findOnAirYearMonth(callback) {
  $infobox.find('.tip').each(function() {
    var $this = $(this);
    if ($this.text().startsWith('放送开始')) {
      var groups = $this.parent().text().match(/(\d{4})年(\d{1,2})月/);
      if (groups == null)
        return;
      callback(parseInt(groups[1]), parseInt(groups[2]));
    }
  });
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

function getBgmList(year, month, callback) {
  const cacheKey = `bgms-${year}-${month}`;
  const bgms = getCachedValue(cacheKey);
  if (bgms)
    return callback(bgms);
  const url = BGMLIST_URL.replace('$Y', year).replace('$M', month);
  $.getJSON(url, function(list) {
    var bgms = {};
    for (var key in list) {
      var bgm = list[key];
      var id = bgm.bgmId;
      if (id == undefined)
        continue;
      bgms[id] = bgm;
    }
    setCachedValue(cacheKey, bgms);
    callback(bgms);
  });
}

function addInfo(title, value) {
  $title = $('<span>').addClass('tip').text(title + ': ');
  return $('<li>').append($title).append(value).appendTo($infobox);
}

function addDownloadSearchLinks(bgm) {
  var cn = bgm.titleCN ? bgm.titleCN : bgm.titleJP;
  var en = bgm.titleEN ? bgm.titleEN : bgm.titleJP;
  addInfo('下载')
    .append($a(DOWNLOAD_DMHY_URL + cn, '花园')).append('、')
    .append($a(DOWNLOAD_NYAA_URL + en, 'Nyaa'));
}

function addOnAirSites(bgm) {
  $info = addInfo('放送站点');
  var added = false;
  for (var i in bgm.onAirSite) {
    var url = bgm.onAirSite[i];
    var domain = url.match(/https?:\/\/\w+\.(\w+)\./)[1];
    var name = SITES[domain].name;
    name == undefined ? domain : name;
    if (name == undefined)
      continue;
    if (added)
      $info.append("、");
    $a(url, name).appendTo($info);
    added = true;
  }
  if (!added)
    $info.remove();
}

findOnAirYearMonth((year, month) => {
  if (year < OLDEST_YEAR)
    return;
  getBgmList(year, month, (list) => {
    var bgm = list[currentBgmId()];
    if (bgm == undefined)
      return;
    
    addOnAirSites(bgm);
    if (DOWNLOAD_SEARCH_ENABLED)
      addDownloadSearchLinks(bgm);
  });
});
