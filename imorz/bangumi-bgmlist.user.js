// ==UserScript==
// @name        Bangumi 国内放送站点链接
// @description 为 Bangumi 动画条目页左侧添加来自 bgmlist.tv 的国内放送站点及下载搜索链接
// @namespace   org.sorz.bangumi
// @grant       none
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @version     0.1.1
// ==/UserScript==

var OLDEST_MONTH = 1310;
var BGMLIST_URL = 'https://bgmlist.sorz.org/json/bangumi-';
var DOWNLOAD_DMHY_URL = "http://share.dmhy.org/topics/list?keyword=";
var DOWNLOAD_POPGO_URL = "http://share.popgo.org/search.php?title=";
var DOWNLOAD_NYAA_URL = "http://www.nyaa.se/?page=search&term=";
var SITES = {
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
var DOWNLOAD_SEARCH_ENABLED = true;

var $infobox = $('#infobox');

function $a(href, text) {
  return $('<a>').addClass('l').attr('href', href).text(text);
}

function currentBgmId() {
  return location.pathname.match(/\/subject\/(\d+)/)[1];
}
  
function findOnAirMonth(callback) {
  $infobox.find('.tip').each(function() {
    var $this = $(this);
    if ($this.text().startsWith('放送开始')) {
      var groups = $this.parent().text().match(/\d{2}(\d{2})年(\d{1,2})月/);
      if (groups == null)
        return;
      callback(parseInt(groups[1]) * 100 + parseInt(groups[2]));
    }
  });
}

function getBgmList(month, callback) {
  var url = BGMLIST_URL + month + '.json';
  $.getJSON(url, function(list) {
    var bgms = {};
    for (var key in list) {
      var bgm = list[key];
      var id = bgm.bgmId;
      if (id == undefined)
        continue;
      bgms[id] = bgm;
    }
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

findOnAirMonth(function(month) {
  if (month < OLDEST_MONTH || month > 6000)
    return;
  getBgmList(month, function(list) {
    var bgm = list[currentBgmId()];
    if (bgm == undefined)
      return;
    
    addOnAirSites(bgm);
    if (DOWNLOAD_SEARCH_ENABLED)
      addDownloadSearchLinks(bgm);
  });
});
