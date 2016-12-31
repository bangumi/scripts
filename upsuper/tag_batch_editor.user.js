// ==UserScript==
// @name        Bangumi 标签批量管理
// @namespace   org.upsuper.bangumi
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/(anime|book|music|game|real)/list/.+$/
// @version     4.0
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
@font-face {
  font-family: '_u FontAwesome';
  src: url('https://netdna.bootstrapcdn.com/font-awesome/3.2.1/font/fontawesome-webfont.woff') format('woff');
}
#__u_cb_all {
  float: right;
  margin-right: 5px;
  height: 17px;
}
#userTagList>li>a.l {
  margin-right: 32px;
}
.__u_add::before {
  content: '+';
}
.__u_set_priv::before {
  /* icon eye closed */
  font-family: '_u FontAwesome';
  content: '\\f070';
}
.__u_clear_priv::before {
  /* icon eye open */
  font-family: '_u FontAwesome';
  content: '\\f06e';
}
.__u_edit::before {
  content: '#';
}
.__u_del::before {
  content: 'x';
}
#wrapperNeue .__u_top_btn,
#wrapperNeue .__u_tag_btn {
  width: 16px; height: 16px;
  line-height: 16px;
  float: right; text-align: center;
}
#wrapperNeue .__u_top_btn {
  padding: 3px 0;
  color: #fff;
  margin: -2px 3px 0 0;
  font-size: 12px;
}
#wrapperNeue .__u_top_btn:first-of-type {
  margin-right: -7px;
}
#wrapperNeue .__u_tag_btn {
  padding: 4px 0;
  color: #aaa;
  font-size: 10px;
}
#__u_pb {
  position: fixed;
  top: 0; border: 0 none;
  width: 100%; height: 1px;
}
`);

// add progress bar
let $pb = $c('progress');
$pb.id = '__u_pb';
$pb.value = 0;
$pb.max = Number.MIN_VALUE;
$pb.hidden = true;
document.body.appendChild($pb);

let workingTasks = 0;
function workOnTask(num, func) {
  workingTasks++;
  $pb.hidden = false;
  $pb.max += num;
  func().then(() => {
    workingTasks--;
    if (workingTasks == 0) {
      location.reload();
    }
  });
}
function progress() {
  $pb.value++;
}

// 为标签添加动作按钮
for (let $tag of $a('#userTagList>li')) {
  $anchor = $tag.getElementsByTagName('a')[0];
  let createTagButton = (cls, title) => {
    let $btn = $c('a');
    $btn.href = '#';
    $btn.classList.add('__u_tag_btn', cls);
    $btn.title = title;
    $tag.insertBefore($btn, $anchor);
  };
  createTagButton('__u_del', '删除');
  createTagButton('__u_edit', '编辑');
}
// 标签动作按钮的事件
$('#userTagList').addEventListener('click', evt => {
  let classList = evt.target.classList;
  if (!classList.contains('__u_tag_btn')) {
    return;
  }
  let $li = evt.target.parentNode;
  let oldTag = decodeURIComponent($('a.l', $li).href.split('=')[1]);
  let newTag;
  evt.preventDefault();
  if (classList.contains('__u_del')) {
    if (!confirm(`确认要删除标签“${oldTag}”吗？`)) {
      return;
    }
    newTag = '';
  } else if (classList.contains('__u_edit')) {
    newTag = prompt('请输入新的标签名：');
    if (!newTag) {
      return;
    }
  } else {
    console.error('未知标签按钮');
    return;
  }
  changeTagName(oldTag, newTag, $li);
}, true);


// 给条目添加复选框
let checkboxes = [];
for (let $item of $a('#browserItemList>li')) {
  let $modify = $('.collectModify', $item);
  let $checkbox = $c('input');
  $checkbox.type = 'checkbox';
  checkboxes.push($checkbox);
  $modify.insertBefore($checkbox, $modify.firstChild);
}
// 添加复选框批量选择
let lastChangedIndex = -1;
$('#browserItemList').addEventListener('click', evt => {
  let index = checkboxes.indexOf(evt.target);
  if (index == -1) {
    return;
  }
  if (evt.shiftKey && lastChangedIndex >= 0) {
    let items;
    if (lastChangedIndex < index) {
      items = checkboxes.slice(lastChangedIndex + 1, index + 1);
    } else if (lastChangedIndex > index) {
      items = checkboxes.slice(index, lastChangedIndex);
    }
    if (items) {
      // 等待事件默认处理结束
      setTimeout(() => {
        let checked = evt.target.checked;
        for (let item of items) {
          item.checked = checked;
        }
      }, 0);
    }
  }
  lastChangedIndex = index;
});
// 添加全选复选框
let $checkboxAll = $c('input');
$checkboxAll.id = '__u_cb_all';
$checkboxAll.type = 'checkbox';
$checkboxAll.title = '全选';
$checkboxAll.addEventListener('change', evt => {
  for (let $checkbox of checkboxes) {
    $checkbox.checked = evt.target.checked;
  }
});
$('#browserTools').appendChild($checkboxAll);
// 添加顶部动作按钮
let $top = $('h2', $('#userTagList').parentNode);
function createTopButton(cls, title, func) {
  let $btn = document.createElement('a');
  $btn.href = '#';
  $btn.classList.add('__u_top_btn', cls);
  $btn.title = title;
  $top.insertBefore($btn, $top.firstChild);
}
createTopButton('__u_clear_priv', '取消仅自己可见');
createTopButton('__u_set_priv', '设置仅自己可见');
createTopButton('__u_add', '添加');
// 顶部动作按钮的事件
$top.addEventListener('click', evt => {
  let classList = evt.target.classList;
  if (!classList.contains('__u_top_btn')) {
    return;
  }
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
  let func;
  if (classList.contains('__u_add')) {
    let newTag = prompt('请输入新标签名：');
    if (newTag) {
      func = () => batchChangeTag(ids, null, newTag);
    }
  } else if (classList.contains('__u_set_priv')) {
    func = () => batchChangePrivacy(ids, true);
  } else if (classList.contains('__u_clear_priv')) {
    func = () => batchChangePrivacy(ids, false);
  } else {
    console.error('未知顶部按钮');
  }
  if (func) {
    workOnTask(ids.length, func);
  }
});

// process
function changeTagName(oldTag, newTag, $li) {
  let $anchor = $('a.l', $li);
  let num = parseInt($('small', $anchor).textContent);
  let pageNum = Math.ceil(num / ITEMS_PER_PAGE);
  let url = `${urlBase}?tag=${encodeURIComponent(oldTag)}&page=`;
  workOnTask(num + pageNum, () => {
    return getIds(url, pageNum).then(ids => {
      return batchChangeTag(ids, oldTag, newTag);
    });
  });
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

function changeItem(id, $iframe, func) {
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
        func(doc);
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

function batchChangeItems(ids, func) {
  function* iterator() {
    let $iframe = $c('iframe');
    $iframe.style.display = 'none';
    document.body.appendChild($iframe);
    for (let id of ids) {
      yield changeItem(id, $iframe, func);
      progress();
    }
  }
  return runAsync(iterator());
}

function batchChangeTag(ids, oldTag, newTag) {
  return batchChangeItems(ids, doc => {
    let $tags = doc.getElementById('tags');
    if (!$tags) {
      throw '异常文档';
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
  });
}

function batchChangePrivacy(ids, privacy) {
  return batchChangeItems(ids, doc => {
    let $privacy = doc.getElementById('privacy');
    if (!$privacy) {
      throw '异常文档';
    }
    $privacy.checked = privacy;
  });
}
