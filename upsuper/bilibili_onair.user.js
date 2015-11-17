// ==UserScript==
// @name        Bangumi Bilibili 放送标志
// @namespace   org.upsuper.bangumi
// @grant       GM_xmlhttpRequest
// @include     http://bgm.tv/
// @include     http://bgm.tv/subject/*
// @exclude     http://bgm.tv/subject/*/*
// @include     https://bgm.tv/
// @include     https://bgm.tv/subject/*
// @exclude     https://bgm.tv/subject/*/*
// @include     http://chii.in/
// @include     http://chii.in/subject/*
// @exclude     http://chii.in/subject/*/*
// @include     http://bangumi.tv/
// @include     http://bangumi.tv/subject/*
// @exclude     http://bangumi.tv/subject/*/*
// @version     3.4
// ==/UserScript==

var _$ = q => document.querySelectorAll(q);
var $ = typeof NodeList.prototype[Symbol.iterator] == "function" ?
  _$ : q => Array.prototype.slice.call(_$(q));

var APPKEY = 'ea99bbc2531c97c0';
var CACHE_INTERVAL = 15 * 60 * 1000; // 15min
var localStorage = window.localStorage
  , onairVerAttr = 'u_OnAir_Ver'
  , biliSPPrefix = 'BilibiliSP_'
  , biliBgmPrefix = 'BilibiliBgm_';
var bangumis = {};

// upgrade local storage
if (localStorage[onairVerAttr] != '3.3.2') {
  for (var k in localStorage) {
    if (k.startsWith(biliSPPrefix) || k.startsWith(biliBgmPrefix)) {
      localStorage.removeItem(k);
    }
  }
  console.log(`Cleared data from old version ${localStorage[onairVerAttr]}`);
  localStorage[onairVerAttr] = '3.3.2';
}

function pad(x) {
  x = x.toString();
  if (x.length == 1)
    return '0' + x;
  else
    return x;
}
function htmlDecode(text) {
  var e = document.createElement('div');
  e.innerHTML = text;
  return e.textContent;
}
function parseTitles(text) {
  var re = /<li><span class="tip"(?: style="visibility:hidden;")?>(?:中文名|别名): <\/span>(.+?)<\/li>/g;
  var titles = [];
  var maintitles = [];
  var match;
  while ((match = re.exec(text)) !== null) {
    var title = match[1];
    titles.push(title);
    var season = /\s*第.[期季]/g.exec(title);
    if (season) {
      maintitles.push(title.substring(0, season.index));
    }
  }
  re = /<title>(.+?) \| Bangumi 番组计划<\/title>/;
  titles.push(re.exec(text)[1]);
  return titles.concat(maintitles);
}
function queryTitles(subject_id, callback) {
  var path = '/subject/' + subject_id;
  if (location.pathname == path) {
    callback(parseTitles(document.documentElement.innerHTML));
  } else {
    GM_xmlhttpRequest({
      method: 'GET',
      url: path,
      onload: resp => {
        callback(parseTitles(resp.responseText));
      }
    });
  }
}
function queryBilibiliSP(titles, callback) {
  if (titles.length == 0) {
    callback('', '', '');
    return;
  }
  var title = titles[0]
    , seasonId = '';
  if (title.includes('#S-')) {
    [title, seasonId] = title.split('#S-');
  }
  console.log(`query title ${title}`);
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://api.bilibili.cn/sp?type=json&appkey=' + APPKEY +
          '&title=' + encodeURIComponent(title) + '&_=' + Date.now(),
    onload: resp => {
      function retry() {
        setTimeout(function () {
          queryBilibiliSP(titles, callback);
        }, 500 + Math.random() * 4500);
      }
      if (!resp.responseText) {
        retry();
        return;
      }
      var sp = JSON.parse(resp.responseText);
      if (sp.code == -404 || sp.code == -403) {
        titles.shift();
        retry();
      } else if (sp.code == -302 && sp.error.startsWith('alias for ')) {
        titles[0] = sp.error.substr(10);
        queryBilibiliSP(titles, callback);
      } else if (sp.code == -503) {
        retry();
      } else if (sp.spid) {
        if (sp.alias_spid !== undefined)
          sp.spid = sp.alias_spid;
        if (!sp.spid) {
          titles.shift();
          retry();
        } else {
          if (sp.season_id !== undefined)
            seasonId = sp.season_id;
          if (!seasonId) {
            if (sp.season) {
              for (var season of sp.season) {
                var id = season.season_id;
                if (season.default) {
                  seasonId = id;
                  break;
                }
                if (id > seasonId)
                  seasonId = id;
              }
            }
          }
          callback(sp.spid, seasonId, sp.title);
        }
      } else {
        console.log(sp);
        titles.shift();
        retry();
      }
    }
  });
}
function getBilibiliSP(subject_id, callback) {
  var sp = localStorage[biliSPPrefix + subject_id]
    , spInfo;
  if (sp)
    spInfo = /^(.*);(\d*);(\d+)?$/.exec(sp);
  if (spInfo) {
    var title = spInfo[1]
      , spid = spInfo[2]
      , seasonId = spInfo[3];
    if (!spid || !title) {
      return;
    }
    if (callback) {
      setTimeout(() => callback(spid, seasonId, title), 0);
    }
  } else {
    queryTitles(subject_id, titles => {
      queryBilibiliSP(titles, (spid, seasonId, title) => {
        var spinfo = title + ';' + spid + ';' + seasonId;
        localStorage[biliSPPrefix + subject_id] = spinfo;
        if (callback)
          callback(spid, seasonId, title);
      });
    });
  }
}
function parseBilibiliBgmPage(content) {
  var anchors = /<a class="t" href="(\/video\/av(\d+)\/)" target="_blank" title="([^\"]*)">\s+第(\d+)集\s+<\/a>/gm
    , maxAv = 0
    , resultUrl, resultTitle, resultEp
    , anchor;

  while ((anchor = anchors.exec(content)) !== null) {
    var av = parseInt(anchor[2]);
    if (av > maxAv) {
      resultUrl = anchor[1];
      resultTitle = anchor[3];
      resultEp = anchor[4];
      maxAv = av;
    }
  }

  if (!resultUrl || !resultTitle) {
    return null;
  }
  return {
    url: 'http://www.bilibili.com' + resultUrl,
    title: resultTitle,
    ep: resultEp
  };
}
function getBilibiliLink(spid, seasonId, lastupdate, callback) {
  var key = `${biliBgmPrefix}${spid}_${seasonId ? seasonId : ''}`
    , bgm = localStorage[key];
  if (bgm) {
    var bgminfo = /^(\d+);(.*?);(\d+);(.*)$/.exec(bgm);
    if (lastupdate == bgminfo[1] && bgminfo[2] && bgminfo[4])
      return callback(bgminfo[2], bgminfo[3], bgminfo[4]);
  }

  var url = 'http://www.bilibili.com/sppage/' +
            'bangumi-' + spid + (seasonId ? '-' + seasonId : '') +
            '-1.html?_=' + Date.now();
  GM_xmlhttpRequest({
    method: 'GET',
    url: url,
    onload: resp => {
      var info = parseBilibiliBgmPage(resp.responseText);
      if (!info) {
        info = {url: '', title: '', ep: 0};
      }
      localStorage[key] = `${lastupdate};${info.url};${info.ep};${info.title}`;
      callback(info.url, info.ep, info.title);
    }
  });
}
function insertLink(subject_id, url, title, old) {
  var $header = $(`#subjectPanel_${subject_id}>.header`)[0]
    , $a = document.createElement('a')
    , $span = document.createElement('span');
  $a.href = url;
  $a.title = htmlDecode(title);
  $a.target = '_blank';
  $span.className = 'onAir rr';
  $span.textContent = 'Bilibili 放送中';
  if (old) {
    $span.style.backgroundPosition = 'left bottom';
  }
  $a.appendChild($span);
  $header.insertBefore($a, $header.firstChild);
}
function updateEpBtn(subject_id, bgmep, old) {
  function setEpBtn($prg, status) {
    var classList = $prg.classList;
    if (classList.contains('epBtnWatched') ||
        classList.contains('epBtnQueue') ||
        classList.contains('epBtnDrop') ||
        classList.contains(status))
      return;
    for (var cls of classList) {
      if (cls.startsWith('epBtn')) {
        classList.remove(cls);
      }
    }
    classList.add(status);
  }

  var $subject = $('#subjectPanel_' + subject_id)[0]
    , $prg_list = $subject.querySelectorAll('ul.prg_list>li>a');
  var found = false;
  for (var $elem of $prg_list) {
    if (found) {
      setEpBtn($elem, 'epBtnNA');
    } else if ($elem.textContent == bgmep) {
      if (!old)
        setEpBtn($elem, 'epBtnToday');
      found = true;
    }
  }
}
function updateBangumi(subject_id, $title) {
  getBilibiliSP(subject_id, (spid, seasonId, title) => {
    if (!spid) return;
    var bgm = bangumis[spid] || {new: false, lastupdate: 0};
    getBilibiliLink(spid, seasonId, bgm.lastupdate, (url, ep, title) => {
      if (url && title) {
        insertLink(subject_id, url, title, !bgm.new);
        updateEpBtn(subject_id, pad(ep), !bgm.new);
      }
    });

    if (bgm.new)
      $title.parentNode.classList.add('onAir');
  });
}
if (location.pathname == '/') {
  var $titles = $('#prgSubjectList>li[subject_type="2"] a.title[subject_id]');
  var time_for_request = Math.floor(Date.now() / CACHE_INTERVAL);
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://api.bilibili.cn/bangumi?' +
         `type=json&appkey=${APPKEY}&_=${time_for_request}`,
    onload: resp => {
      for (var item of JSON.parse(resp.responseText).list) {
        bangumis[item.spid] = item;
        if (item.alias_spid)
          bangumis[item.alias_spid] = item;
      }
      for (var $title of $titles) {
        var subject_id = $title.attributes.subject_id.value;
        updateBangumi(subject_id, $title);
      }
    }
  });

  // clean up all onair icons
  for (var $elem of $('#prgSubjectList>li.onAir')) {
    $elem.classList.remove('onAir');
  }
  for (var $btn of $('#cloumnSubjectInfo .epBtnToday')) {
    $btn.classList.remove('epBtnToday');
    $btn.classList.add('epBtnNA');
  }
  for (var $rr of $('#cloumnSubjectInfo .onAir.rr')) {
    $rr.parentNode.removeChild($rr);
  }
} else {
  var subject_id = location.pathname.split('/')[2]
    , key = biliSPPrefix + subject_id;
  if (localStorage[key]) {
    // we do not want to truly remove the value,
    // just hope to give it a chance to be updated
    // if possible.
    var old_val = localStorage[key];
    localStorage.removeItem(key);
    getBilibiliSP(subject_id);
    localStorage[key] = old_val;
  }
}
