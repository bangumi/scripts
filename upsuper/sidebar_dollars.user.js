// ==UserScript==
// @name        Bangumi 侧栏 Dollars
// @namespace   org.upsuper.bangumi
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(rakuen|(pm|blog|index|wiki|magi|user|group|anime|book|music|game|real|subject|ep|mono|person|character|timeline)(/.*)?)?(\?.*)?$/
// @version     1.3.4
// @grant       GM_addStyle
// ==/UserScript==

const MAX_ITEMS = 200;

const PREFIX = '__u_dollars_';
const ITEM_PREFIX = `${PREFIX}chat_`;
const SIDEBAR_ID = `${PREFIX}sidebar`;

GM_addStyle(`
#${SIDEBAR_ID} {
  position: fixed;
  width: 350px;
  left: 0; top: 0; bottom: 0;
  z-index: 5;
  border-right: 1px solid #dfdfdf;
  box-shadow: 0px 0px 0px 2px rgba(0, 0, 0, 0.04);
  margin-left: -353px;
  transition: margin-left 0.5s;
  background: #fcfcfc;
}
#${SIDEBAR_ID}.show {
  margin-left: 0px;
}
#${SIDEBAR_ID}>.switch {
  position: absolute;
  width: 80px; height: 30px;
  line-height: 30px;
  right: -82px; top: 50px;
  background: #fcfcfc;
  border: 1px solid #dfdfdf;
  border-bottom: 0 none;
  transform: rotate(-270deg);
  transform-origin: bottom left;
  cursor: pointer;
  font-size: 14px;
  color: #777;
  text-align: center;
  border-radius: 10px 10px 0 0;
  box-shadow: 0px 0px 0px 2px rgba(0, 0, 0, 0.04);
  text-shadow: 1px 1px 1px;
}
#${SIDEBAR_ID}>.badge {
  position: absolute;
  width: 20px; height: 20px;
  top: 75px; right: -40px;
  background: #f09199;
  color: white;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  border-radius: 10px;
}
#${SIDEBAR_ID}>.input {
  width: 320px;
  box-sizing: border-box;
  background: #fdfdfd;
  font-size: 12px;
  color: #777;
  height: 40px; line-height: 17px;
  padding: 2px 5px;
  resize: none;
  transition: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 10px;
  border: 1px solid #999;
  border-color: #999 #ccc #ddd #999;
  border-radius: 5px;
}
#${SIDEBAR_ID}>.input:disabled {
  background: #fff url(/img/loading_s.gif) no-repeat 95% 50%;
}
#${SIDEBAR_ID}>.history {
  overflow: scroll;
  height: 100%;
  box-sizing: border-box;
  border-bottom: 64px solid transparent;
  position: relative;
  background: #fcfcfc;
}
#${SIDEBAR_ID}>.history>li {
  padding: 10px 10px 10px 55px;
  border-bottom: 1px solid #ddd;
  color: #666;
  position: relative;
}
#${SIDEBAR_ID}>.history>li.new {
  border-bottom: 3px double #ddd;
}
#${SIDEBAR_ID}>.history>li.highlight {
  background: #faf0e6;
}
#${SIDEBAR_ID}>.history>li .avt {
  width: 32px; height: 32px;
  position: absolute;
  top: 12px; left: 12px;
  border-radius: 5px;
  box-shadow: inset #BBB 0px 0 2px 0px;
  transition: box-shadow linear 0.2s;
}
#${SIDEBAR_ID}>.history>li .avt:hover {
  box-shadow: #0187C5 0px 0px 2px 0px;
}
#${SIDEBAR_ID}>.history>li>.color {
  width: 8px; height: 8px;
  border-radius: 4px;
  margin-right: 5px;
  display: inline-block;
}
#${SIDEBAR_ID}>.history>li>.user {
  font-weight: bold;
  color: #0084b4;
  cursor: pointer;
}
#${SIDEBAR_ID}>.history>li>.user:hover {
  text-decoration:underline;
}
#${SIDEBAR_ID}>.history>li>.timestamp {
  margin-left: 5px;
  color: #999;
  font-size: 10px;
}
#${SIDEBAR_ID}>.history>li>.content {
  margin-top: 3px;
  padding-right: 15px;
  word-wrap: break-word;
}
`);

const BGM_SMILES = ["",
  "/img/smiles/bgm/01.png",
  "/img/smiles/bgm/02.png",
  "/img/smiles/bgm/03.png",
  "/img/smiles/bgm/04.png",
  "/img/smiles/bgm/05.png",
  "/img/smiles/bgm/06.png",
  "/img/smiles/bgm/07.png",
  "/img/smiles/bgm/08.png",
  "/img/smiles/bgm/09.png",
  "/img/smiles/bgm/10.png",
  "/img/smiles/bgm/11.gif",
  "/img/smiles/bgm/12.png",
  "/img/smiles/bgm/13.png",
  "/img/smiles/bgm/14.png",
  "/img/smiles/bgm/15.png",
  "/img/smiles/bgm/16.png",
  "/img/smiles/bgm/17.png",
  "/img/smiles/bgm/18.png",
  "/img/smiles/bgm/19.png",
  "/img/smiles/bgm/20.png",
  "/img/smiles/bgm/21.png",
  "/img/smiles/bgm/22.png",
  "/img/smiles/bgm/23.gif",
  "/img/smiles/tv/01.gif",
  "/img/smiles/tv/02.gif",
  "/img/smiles/tv/03.gif",
  "/img/smiles/tv/04.gif",
  "/img/smiles/tv/05.gif",
  "/img/smiles/tv/06.gif",
  "/img/smiles/tv/07.gif",
  "/img/smiles/tv/08.gif",
  "/img/smiles/tv/09.gif",
  "/img/smiles/tv/10.gif",
  "/img/smiles/tv/11.gif",
  "/img/smiles/tv/12.gif",
  "/img/smiles/tv/13.gif",
  "/img/smiles/tv/14.gif",
  "/img/smiles/tv/15.gif",
  "/img/smiles/tv/16.gif",
  "/img/smiles/tv/17.gif",
  "/img/smiles/tv/18.gif",
  "/img/smiles/tv/19.gif",
  "/img/smiles/tv/20.gif",
  "/img/smiles/tv/21.gif",
  "/img/smiles/tv/22.gif",
  "/img/smiles/tv/23.gif",
  "/img/smiles/tv/24.gif",
  "/img/smiles/tv/25.gif",
  "/img/smiles/tv/26.gif",
  "/img/smiles/tv/27.gif",
  "/img/smiles/tv/28.gif",
  "/img/smiles/tv/29.gif",
  "/img/smiles/tv/30.gif",
  "/img/smiles/tv/31.gif",
  "/img/smiles/tv/32.gif",
  "/img/smiles/tv/33.gif",
  "/img/smiles/tv/34.gif",
  "/img/smiles/tv/35.gif",
  "/img/smiles/tv/36.gif",
  "/img/smiles/tv/37.gif",
  "/img/smiles/tv/38.gif",
  "/img/smiles/tv/39.gif",
  "/img/smiles/tv/40.gif",
  "/img/smiles/tv/41.gif",
  "/img/smiles/tv/42.gif",
  "/img/smiles/tv/43.gif",
  "/img/smiles/tv/44.gif",
  "/img/smiles/tv/45.gif",
  "/img/smiles/tv/46.gif",
  "/img/smiles/tv/47.gif",
  "/img/smiles/tv/48.gif",
  "/img/smiles/tv/49.gif",
  "/img/smiles/tv/50.gif",
  "/img/smiles/tv/51.gif",
  "/img/smiles/tv/52.gif",
  "/img/smiles/tv/53.gif",
  "/img/smiles/tv/54.gif",
  "/img/smiles/tv/55.gif",
  "/img/smiles/tv/56.gif",
  "/img/smiles/tv/57.gif",
  "/img/smiles/tv/58.gif",
  "/img/smiles/tv/59.gif",
  "/img/smiles/tv/60.gif",
  "/img/smiles/tv/61.gif",
  "/img/smiles/tv/62.gif",
  "/img/smiles/tv/63.gif",
  "/img/smiles/tv/64.gif",
  "/img/smiles/tv/65.gif",
  "/img/smiles/tv/66.gif",
  "/img/smiles/tv/67.gif",
  "/img/smiles/tv/68.gif",
  "/img/smiles/tv/69.gif",
  "/img/smiles/tv/70.gif",
  "/img/smiles/tv/71.gif",
  "/img/smiles/tv/72.gif",
  "/img/smiles/tv/73.gif",
  "/img/smiles/tv/74.gif",
  "/img/smiles/tv/75.gif",
  "/img/smiles/tv/76.gif",
  "/img/smiles/tv/77.gif",
  "/img/smiles/tv/78.gif",
  "/img/smiles/tv/79.gif",
  "/img/smiles/tv/80.gif",
  "/img/smiles/tv/81.gif",
  "/img/smiles/tv/82.gif",
  "/img/smiles/tv/83.gif",
  "/img/smiles/tv/84.gif",
  "/img/smiles/tv/85.gif",
  "/img/smiles/tv/86.gif",
  "/img/smiles/tv/87.gif",
  "/img/smiles/tv/88.gif",
  "/img/smiles/tv/89.gif",
  "/img/smiles/tv/90.gif",
  "/img/smiles/tv/91.gif",
  "/img/smiles/tv/92.gif",
  "/img/smiles/tv/93.gif",
  "/img/smiles/tv/94.gif",
  "/img/smiles/tv/95.gif",
  "/img/smiles/tv/96.gif",
  "/img/smiles/tv/97.gif",
  "/img/smiles/tv/98.gif",
  "/img/smiles/tv/99.gif",
  "/img/smiles/tv/100.gif",
  "/img/smiles/tv/101.png",
];

function $(query) {
  return document.querySelector(query);
}
function $c(tag, props) {
  var elem = document.createElement(tag);
  if (props) {
    function setProps(obj, items) {
      for (var key in items) {
        var item = items[key];
        if (typeof item == 'object') {
          setProps(obj[key], item);
        } else {
          obj[key] = item;
        }
      }
    }
    setProps(elem, props);
  }
  return elem;
}

const nickname = $('#dock a[href*="/user/"]').innerHTML;

var $sidebar = $c('div', {id: SIDEBAR_ID});

var $switch = $c('a', {
  className: 'switch',
  textContent: 'Dollars',
  onclick: function () {
    $sidebar.classList.toggle('show');
    if ($sidebar.classList.contains('show')) {
      setNewMsg(0);
      var lastNew = $(`#${SIDEBAR_ID} li.new`);
      if (lastNew)
        lastNew.classList.remove('new');
      var previousView = $(`#${ITEM_PREFIX}${lastView}`);
      if (previousView && previousView.previousElementSibling)
        previousView.previousElementSibling.classList.add('new');
      $input.focus();
    } else {
      if ($history.firstChild)
        lastView = $history.firstChild.dataset.id;
    }
  }
});
$sidebar.appendChild($switch);

var $badge = $c('span', {
  className: 'badge'
});
$sidebar.appendChild($badge);

var newMsg;
function setNewMsg(num) {
  if ($sidebar.classList.contains('show'))
    num = 0;
  if (num > 99)
    num = 99;
  newMsg = num;
  if (newMsg) {
    $badge.textContent = newMsg;
    $badge.style.display = 'block';
  } else {
    $badge.style.display = 'none';
  }
}
setNewMsg(0);

function createMessageFormData(msg) {
  var data = new FormData();
  data.append('message', msg);
  return data;
}

function throwIfRespNotOk(resp) {
  if (!resp.ok) {
    throw new Error(`status: ${resp.status} ${resp.statusText}`);
  }
}

var $input = $c('textarea', {
  className: 'input',
  onkeypress: function (evt) {
    if (evt.keyCode == 13) {  // enter
      $input.disabled = true;
      fetch('/dollars?ajax=1', {
        method: 'POST',
        mode: 'same-origin',
        credentials: 'same-origin',
        body: createMessageFormData($input.value)
      }).then(resp => {
        throwIfRespNotOk(resp);
        $input.value = '';
        updateMsg();
      }).catch(e => {
        console.log(`Error when posting: ${e}`);
      }).then(() => {
        $input.disabled = false;
      });
    } else if (evt.keyCode == 27) { // escape
      $switch.click();
      $input.blur();
    }
  },
});
$sidebar.appendChild($input);

var lastView = 0;
var $history = $c('ul', {
  className: 'history',
  onclick: function (evt) {
    var $target = evt.target;
    if ($target.className == 'user') {
      $input.focus();
      $input.value += `@${$target.parentNode.dataset.nickname} `;
      var length = $input.value.length;
      $input.setSelectionRange(length, length);
    }
  }
});
$sidebar.appendChild($history);

function generateTime(time) {
  var hours = time.getHours(),
      minutes = time.getMinutes();
  var ampm = '';
  if (hours > 12) {
    ampm = 'PM';
    hours -= 12;
  } else if (hours < 12) {
    ampm = 'AM';
  } else if (minutes > 0) {
    ampm = 'PM';
  }
  if (minutes < 10)
    minutes = '0' + minutes;
  return `${hours}:${minutes} ${ampm}`
}

function processContent(content) {
  return content.replace(/\(bgm(\d{2,})\)/g, function (match, idx) {
    var smile = BGM_SMILES[parseInt(idx)];
    return smile ? `<img src="${smile}" alt="${match}">` : match;
  });
}

function writeMsg(item) {
  var id = `${ITEM_PREFIX}${item.id}`;
  if ($(`#${id}`))
    return false;

  var $li = $c('li', {
    id: id,
    dataset: {
      id: item.id,
      uid: item.uid,
      nickname: item.nickname,
    },
  });
  var $link = $c('a', {
    href: item.uid > 0 ? `/user/${item.uid}` : '/character/10586',
  });
  var $avatar = $c('img', {
    className: 'avt',
    src: `http://lain.bgm.tv/pic/user/m/${item.avatar}`,
  });
  $link.appendChild($avatar);
  $li.appendChild($link);
  var $color = $c('span', {
    className: 'color',
    style: {
      background: item.color,
    },
  });
  $li.appendChild($color);
  var $user = $c('a', {
    className: 'user',
    textContent: item.nickname,
  });
  $li.appendChild($user);
  var time = new Date(item.timestamp * 1000);
  var $timestamp = $c('time', {
    className: 'timestamp',
    dateTime: time.toISOString(),
    textContent: `@ ${generateTime(time)}`,
  });
  $li.appendChild($timestamp);
  var $content = $c('p', {
    className: 'content',
    innerHTML: processContent(item.msg),
  });
  $li.appendChild($content);
  if (item.msg.indexOf(`@${nickname} `) >= 0)
    $li.classList.add('highlight');
  $history.insertBefore($li, $history.firstChild);
  return true;
}

var firstUpdate = true;
var lastUpdate = 0;
var updating = false;
function updateMsg() {
  if (updating)
    return;
  var timeout = false;
  updating = true;
  // Fetch doesn't support timeout yet. Setup it ourselves.
  setTimeout(() => {
    timeout = true;
    updating = false;
  }, 1000);
  function throwIfTimeout() {
    if (timeout) {
      throw new Error('timeout');
    }
  }
  fetch(`/dollars?since_id=${lastUpdate}`, {
    mode: 'same-origin',
    credentials: 'same-origin'
  }).then(resp => {
    throwIfTimeout();
    throwIfRespNotOk(resp);
    return resp.json();
  }).then(data => {
    throwIfTimeout();
    if (!data)
      return;
    var count = 0;
    for (var item of data) {
      if (writeMsg(item)) {
        count++;
      }
    }
    if (firstUpdate) {
      firstUpdate = false;
    } else {
      setNewMsg(newMsg + count);
    }
    lastUpdate = data[data.length - 1].timestamp;
    while ($history.childNodes.length > MAX_ITEMS) {
      $history.removeChild($history.lastChild);
    }
  }).catch(e => {
    console.log('Error when updating:', e);
  }).then(() => {
    if (!timeout) {
      updating = false;
    }
  });
}
setInterval(updateMsg, 1500);
updateMsg();

document.body.appendChild($sidebar);
