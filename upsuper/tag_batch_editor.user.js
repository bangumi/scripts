// ==UserScript==
// @name        Bangumi 标签批量管理
// @namespace   org.upsuper.bangumi
// @include     /^http://(bgm\.tv|chii\.in|bangumi\.tv)/(anime|book|music|game|real)/list/.+$/
// @version     2.3
// @grant       GM_addStyle
// ==/UserScript==

var TIMEOUT = 3000,
    RETRY_INTERVAL = 1000;

function $(q, e) { return (e ? e : document).querySelector(q); }
function $a(q, e) { return (e ? e : document).querySelectorAll(q); }
function $c(t) { return document.createElement(t); }
String.prototype.u$format = function () {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function (match, i) {
    return args[i] !== undefined ? args[i] : match;
  });
};

// check username
var username = $('.idBadgerNeue a.avatar').href.split('/').pop();
var urlPieces = location.href.split(/[\/\?]/);
if (username !== urlPieces[5])
  return;
var urlBase = urlPieces.slice(0, 7).join('/');

// insert style
GM_addStyle('\
#userTagList>li>a.l { margin-right: 32px; } \
#userTagList>li>a.__u_edit, #userTagList>li>a.__u_del { \
  width: 16px; height: 16px; \
  padding: 4px 0; float: right; \
  text-align: center; color: #aaa; \
  line-height: 16px; font-size: 10px; \
} \
a.__u_add { \
  width: 16px; height: 16px; \
  padding: 3px 0; float: right; \
  text-align: center; color: #fff; \
  line-height: 16px; font-size: 10px; \
} \
#__u_pb { \
  position: fixed; \
  top: 0; \
  width: 100%; \
} \
#__u_pb[max="0"] { \
  display: none; \
} \
');

// add progress bar
var $pb = $c('progress');
var workingJobs = 0;
$pb.id = '__u_pb';
$pb.max = $pb.value = 0;
document.body.appendChild($pb);

// update tag list
var $tags = $a('#userTagList>li');
for (var i = 0; i < $tags.length; i++) {
  var $tag = $tags[i],
  $anchor = $tag.getElementsByTagName('a')[0];
  var $button;

  $button = $c('a');
  $button.href = '#';
  $button.className = '__u_del';
  $button.title = '删除';
  $button.textContent = 'x';
  $tag.insertBefore($button, $anchor);

  $button = $c('a');
  $button.href = '#';
  $button.className = '__u_edit';
  $button.title = '编辑';
  $button.textContent = '#';
  $tag.insertBefore($button, $anchor);
}

// add checkboxes to item list
var $items = $a('#browserItemList>li');
for (var i = 0; i < $items.length; i++) {
  var $item = $items[i],
  $modify = $('.collectModify', $item);

  var $checkbox = $c('input');
  $checkbox.type = 'checkbox';
  $modify.insertBefore($checkbox, $modify.firstChild);
}

// add new tag button
var $panel = $('#userTagList').parentNode;
var $newtag = $c('a');
$newtag.href = '#';
$newtag.className = '__u_add';
$newtag.title = '添加';
$newtag.textContent = '+';
$newtag.addEventListener('click', function (evt) {
  var ids = [];
  evt.preventDefault();

  var $items = $a('#browserItemList>li');
  for (var i = 0; i < $items.length; i++) {
    var $item = $items[i],
    $chk = $('input[type=checkbox]', $item);
    if ($chk.checked)
      ids.push($item.id.substr(5));
  }

  if (!ids.length) {
    alert('请先选择条目');
    return;
  }

  var newTag = prompt('请输入新标签名：');
  if (!newTag) return;
  batchChangeTag(ids, null, newTag, function (id) {
    //$('#item_{0} input[type=checkbox]'.u$format(id)).checked = false;
  });
});
$panel.insertBefore($newtag, $panel.firstChild);

// bind event
$('#userTagList').addEventListener('click', function (evt) {
  var className = evt.target.className;
  if (className != '__u_edit' && className != '__u_del')
    return;

  var $li = evt.target.parentNode;
  var oldTag = decodeURIComponent($('a.l', $li).href.split('=')[1]);
  var newTag;
  evt.preventDefault();
  if (className == '__u_del') {
    if (!confirm('确认要删除标签“{0}”吗？'.u$format(oldTag)))
    return;
    newTag = '';
  } else {
    newTag = prompt('请输入新的标签名：');
    if (!newTag) return;
  }

  changeTagName(oldTag, newTag, $li);
}, true);

// process
function changeTagName(oldTag, newTag, $li) {
  var $anchor = $('a.l', $li);
  var num = parseInt($('small', $anchor).textContent)
    , pageNum = Math.ceil(num / 24);
  var ids = [];
  var url = urlBase + '?tag=' + encodeURIComponent(oldTag) + '&page=';
  $pb.max += num + pageNum;
  workingJobs++;

  getListPage(1, function () {
    batchChangeTag(ids, oldTag, newTag, updateProcessBar);
  });

  function updateProcessBar() {
    $pb.value++;
  }

  function getListPage(page, callback) {
    var xhr = new XMLHttpRequest();
    var received = false;

    var watchdog = setTimeout(function () {
      watchdog = 0;
      if (received) return;
      xhr.abort();
      getListPage(page, callback);
    }, TIMEOUT);

    xhr.open('GET', url + page, true);
    xhr.send(null);
    xhr.onreadystatechange = function () {
      if (this.readyState != 4 || this.status != 200)
        return;
      received = true;
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = 0;
      }

      var content = this.responseText;
      var regx = /<li id="item_(\d+)"/g, match;
      while (match = regx.exec(content))
        ids.push(match[1]);

      updateProcessBar();
      if (page < pageNum)
        getListPage(page + 1, callback);
      else
        callback();
    };
  }
}

function batchChangeTag(ids, oldTag, newTag, updateProcessBar) {
  var $iframe = $c('iframe');
  $iframe.style.display = 'none';
  document.body.appendChild($iframe);

  function nextItem() {
    var id = ids.shift();
    if (id) {
      changeTag(id, oldTag, newTag,
                $iframe, updateProcessBar, nextItem);
    } else {
      workingJobs--;
      if (workingJobs == 0)
        location.reload();
    }
  }
  nextItem();
}

function changeTag(id, oldTag, newTag,
                   $iframe, updateProcessBar, callback) {
  var url = '/update/' + id;
  var watchdog;
  stage0();

  function stage0() {
    $iframe.src = url;
    $iframe.onload = stage1;
    finished = false;
    watchdog = setTimeout(function () {
      if ($iframe.onload != stage1)
        return;
      url += '?';
      stage0();
    }, TIMEOUT);
  }
  function stage1() {
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = 0;
    }

    var doc = $iframe.contentDocument;
    var $tags = doc.getElementById('tags');
    if (!$tag)
      setTimeout(stage0, RETRY_INTERVAL);

    if (oldTag) {
      var tags = $tags.value.trim().split(/\s+/);
      for (var i = 0; i < tags.length; i++)
      if (tags[i].toLowerCase() == oldTag.toLowerCase())
        tags[i] = newTag;
      $tags.value = tags.join(' ');
    } else {
      $tags.value += ' ' + newTag;
    }

    doc.forms[0].submit();
    $iframe.onload = stage2;
    watchdog = setTimeout(function () {
      if ($iframe.onload != stage2)
        return;
      doc.forms[0].submit();
    }, TIMEOUT);
  }
  function stage2() {
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = 0;
    }

    $iframe.onload = undefined;
    updateProcessBar(id);
    callback();
  }
}
