// ==UserScript==
// @name        Bangumi 标签批量管理
// @namespace   org.upsuper.bangumi
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/(anime|book|music|game|real)/list/.+$/
// @version     2.5.1
// @grant       GM_addStyle
// ==/UserScript==

const TIMEOUT = 3000;
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 1000;
const ITEMS_PER_PAGE = 24;

let $ = (q, e) => (e ? e : document).querySelector(q);
let $a = (q, e) => (e ? e : document).querySelectorAll(q);
let $c = t => document.createElement(t);
let delay = t => new Promise(r => setTimeout(r, t));

function runAsync(iter) {
  return new Promise((resolve, reject) => {
    function iterate() {
      let next = iter.next();
      if (!next.done) {
        next.value.then(iterate);
      } else {
        resolve(next.value);
      }
    }
    iterate();
  });
}

// check username
let username = $('.idBadgerNeue a.avatar').href.split('/').pop();
let urlPieces = location.href.split(/[\/\?]/);
if (username !== urlPieces[5]) {
  return;
}
let urlBase = urlPieces.slice(0, 7).join('/');

// insert style
GM_addStyle(`
#userTagList>li>a.l {
  margin-right: 32px;
}
#userTagList>li>a.__u_edit,
#userTagList>li>a.__u_del {
  width: 16px; height: 16px;
  padding: 4px 0; float: right;
  text-align: center; color: #aaa;
  line-height: 16px; font-size: 10px;
}
a.__u_add {
  width: 16px; height: 16px;
  padding: 3px 0; float: right;
  text-align: center; color: #fff;
  line-height: 16px; font-size: 10px;
}
#__u_pb {
  position: fixed;
  top: 0;
  width: 100%;
}
#__u_pb[max="0"] {
  display: none;
}
`);

// add progress bar
let $pb = $c('progress');
$pb.id = '__u_pb';
$pb.max = $pb.value = 0;
document.body.appendChild($pb);

let workingJobs = 0;
function increaseWorkingJobs(num) {
  workingJobs++;
  $pb.max += num;
}
function decreaseWorkingJobs() {
  workingJobs--;
  if (workingJobs == 0)
    location.reload();
}
function progress() {
  $pb.value++;
}

// update tag list
for (let $tag of $a('#userTagList>li')) {
  $anchor = $tag.getElementsByTagName('a')[0];

  let $button = $c('a');
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
for (let $item of $a('#browserItemList>li')) {
  let $modify = $('.collectModify', $item);
  let $checkbox = $c('input');
  $checkbox.type = 'checkbox';
  $modify.insertBefore($checkbox, $modify.firstChild);
}

// add new tag button
let $panel = $('#userTagList').parentNode;
let $newtag = $c('a');
$newtag.href = '#';
$newtag.className = '__u_add';
$newtag.title = '添加';
$newtag.textContent = '+';
$newtag.addEventListener('click', evt => {
  evt.preventDefault();
  let ids = [];
  for (let $item of $a('#browserItemList>li')) {
    $chk = $('input[type=checkbox]', $item);
    if ($chk.checked) {
      ids.push($item.id.substr(5));
    }
  }
  if (!ids.length) {
    alert('请先选择条目');
    return;
  }
  let newTag = prompt('请输入新标签名：');
  if (newTag) {
    increaseWorkingJobs(ids.length);
    batchChangeTag(ids, null, newTag).then(decreaseWorkingJobs);
  }
});
$panel.insertBefore($newtag, $panel.firstChild);

// bind event
$('#userTagList').addEventListener('click', evt => {
  let className = evt.target.className;
  if (className != '__u_edit' && className != '__u_del') {
    return;
  }
  let $li = evt.target.parentNode;
  let oldTag = decodeURIComponent($('a.l', $li).href.split('=')[1]);
  let newTag;
  evt.preventDefault();
  if (className == '__u_del') {
    if (!confirm(`确认要删除标签“${oldTag}”吗？`)) {
      return;
    }
    newTag = '';
  } else {
    newTag = prompt('请输入新的标签名：');
    if (!newTag) {
      return;
    }
  }
  changeTagName(oldTag, newTag, $li);
}, true);

// process
function changeTagName(oldTag, newTag, $li) {
  let $anchor = $('a.l', $li);
  let num = parseInt($('small', $anchor).textContent);
  let pageNum = Math.ceil(num / ITEMS_PER_PAGE);
  let url = `${urlBase}?tag=${encodeURIComponent(oldTag)}&page=`;
  increaseWorkingJobs(num + pageNum);
  getIds(url, pageNum)
    .then(ids => batchChangeTag(ids, oldTag, newTag))
    .then(decreaseWorkingJobs);
}

function fetchWithTimeout(url) {
  return new Promise((resolve, reject) => {
    let watchdog = setTimeout(() => {
      watchdog = 0;
      reject("timeout");
    }, TIMEOUT);
    fetch(url).then(resp => {
      // We have timeouted, abandon this request.
      // TODO We really want to abort the request earlier like what
      //      we could do with XHR. But fetch doesn't have that yet.
      if (!watchdog) {
        throw "timeout";
      }
      if (!resp.ok) {
        throw `request failed with ${resp.status}`;
      }
      clearTimeout(watchdog);
      return resp.text();
    }).then(resolve).catch(reject);
  });
}

function getIds(urlBase, pageNum) {
  function* iterator() {
    let ids = [];
    for (let page = 1; page <= pageNum; page++) {
      let url = `${urlBase}${page}`;
      let done = false;
      for (let tries = 0; !done && tries < MAX_RETRIES; tries++) {
        yield fetchWithTimeout(url).then(content => {
          let regex = /<li id="item_(\d+)"/g;
          let match;
          while (match = regex.exec(content)) {
            ids.push(match[1]);
          }
          done = true;
        }).catch(e => {
          console.error(e);
          return delay(RETRY_INTERVAL);
        });
      }
      if (!done) {
        console.error(`exceeded max retry times for page ${page}`);
      }
      progress();
    }
    return ids;
  }
  return runAsync(iterator());
}

function batchChangeTag(ids, oldTag, newTag) {
  function* iterator() {
    let $iframe = $c('iframe');
    $iframe.style.display = 'none';
    document.body.appendChild($iframe);
    for (let id of ids) {
      yield changeTag(id, oldTag, newTag, $iframe);
      progress();
    }
  }
  return runAsync(iterator());
}

function changeTag(id, oldTag, newTag, $iframe) {
  function waitForIframeLoad() {
    return new Promise((resolve, reject) => {
      let watchdog = setTimeout(() => {
        $iframe.onload = undefined;
        reject();
      }, TIMEOUT);
      $iframe.onload = () => {
        clearTimeout(watchdog);
        $iframe.onload = undefined;
        resolve();
      };
    });
  }
  let url = `/update/${id}`;
  function* iterator() {
    let done = false;
    for (let tries = 0; !done && tries < MAX_RETRIES; tries++) {
      yield Promise.resolve().then(() => {
        $iframe.src = url;
        return waitForIframeLoad();
      }).then(() => {
        let doc = $iframe.contentDocument;
        let $tags = doc.getElementById('tags');
        if (!$tags) {
          throw "unexpected document";
        }
        if (oldTag) {
          $tags.value = $tags.value.trim().split(/\s+/).map(value => {
            if (value.toLowerCase() == oldTag.toLowerCase())
              return newTag;
            return value;
          }).join(' ');
        } else {
          $tags.value += ' ' + newTag;
        }
        doc.forms[0].submit();
        return waitForIframeLoad();
      }).then(() => {
        done = true;
      }).catch(e => {
        console.log(e);
        url += '?';
        return delay(RETRY_INTERVAL);
      });
    }
    if (!done) {
      throw `exceeded max retry times for item ${id}`;
    }
  }
  return runAsync(iterator());
}
