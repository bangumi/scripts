// ==UserScript==
// @name        Bangumi 小组坟贴标记
// @namespace   org.upsuper.bangumi
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/group/topic/\d+(#.*)?$/
// @version     1.2
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle("\
.__u_old_mark { \
  background-color: #ff1493; \
  position: absolute; \
  top: 0; right: 0; \
  width: 3px; height: 100%; \
} \
.sub_reply_bg>.__u_old_mark { \
  right: -7px; \
} \
.sub_reply_bg.reply_highlight > .__u_old_mark { \
  right: -9px; \
} \
.postTopic, .row_reply, .sub_reply_bg { \
  position: relative; \
} \
#sliderContainer.sticky { \
  z-index: 100; \
} \
");

function dateToDay(date) {
  return Math.floor(date.getTime() / (24 * 3600 * 1000));
}

function parseDate(date) {
  const arr = date.split('-');
  const year = parseInt(arr[0]);
  const month = parseInt(arr[1]);
  const day = parseInt(arr[2]);
  return dateToDay(new Date(year, month - 1, day));
}

function getToday() {
  const date = new Date();
  return parseDate(date.getFullYear() + '-' +
                   (date.getMonth() + 1) + '-' +
                   date.getDate());
}

function f(n) {
  const A = 0.993237065109;
  return A * Math.log(n + 2) + (1 - A) * n;
}

const D = f(365 * 5);
const today = getToday();
const infos = document.querySelectorAll('.re_info');
Array.prototype.forEach.call(infos, function (elem) {
  const text = elem.textContent;
  const day = parseDate(/\d{4}-\d{1,2}-\d{1,2}/.exec(text)[0]);
  var $mark = document.createElement('div');
  $mark.className = "__u_old_mark";
  $mark.style.opacity = f(today - day) / D;
  elem.parentNode.appendChild($mark);
});
