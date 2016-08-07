// ==UserScript==
// @name        Bangumi 放送标志调整
// @namespace   org.upsuper.bangumi
// @grant       GM_xmlhttpRequest
// @include     http://bgm.tv/
// @include     https://bgm.tv/
// @include     http://chii.in/
// @include     http://bangumi.tv/
// @version     1.0
// ==/UserScript==

const $ = q => document.querySelector(q);
const $a = q => document.querySelectorAll(q);
const $c = t => document.createElement(t);
const s = v => `${v}`;

const JAPAN_TIME = new Date(Date.now() + 9 * 3600 * 1000);
const SEASON_JP = (() => {
  let yearStr = JAPAN_TIME.getUTCFullYear() % 100;
  let month = Math.floor(JAPAN_TIME.getUTCMonth() / 3) * 3 + 1;
  let monthStr = s(month).padStart(2, '0');
  return `${yearStr}${monthStr}`;
})();
const DATE_JP = JAPAN_TIME.toISOString().split('T')[0];
const WEEKDAY_JP = JAPAN_TIME.getUTCDay();
const TIME_JP = (() => {
  let hourStr = s(JAPAN_TIME.getUTCHours()).padStart(2, '0');
  let minStr = s(JAPAN_TIME.getUTCMinutes()).padStart(2, '0');
  return `${hourStr}${minStr}`;
})();

function getBgmlistData() {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `http://bgmlist.com/json/bangumi-${SEASON_JP}.json`,
      onload: resp => {
        resolve(JSON.parse(resp.responseText));
      },
      onerror: resp => {
        reject(resp.status);
      }
    });
  });
}

// 清理现有放送中标志
for (let $elem of $a('#prgSubjectList>li.onAir')) {
  $elem.classList.remove('onAir');
}
for (let $btn of $a('#cloumnSubjectInfo .epBtnToday')) {
  $btn.classList.remove('epBtnToday');
  $btn.classList.add('epBtnNA');
}
for (let $rr of $a('#cloumnSubjectInfo .onAir.rr')) {
  $rr.parentNode.removeChild($rr);
}

let subjectSet = new Set();
let $titles = $a('#prgSubjectList>li[subject_type="2"] a.title[subject_id]');
for (let $title of $titles) {
  subjectSet.add(parseInt($title.attributes.subject_id.value));
}

// 请求Bgmlist数据并更新标志
getBgmlistData().then(data => {
  for (let item of Object.values(data)) {
    if (!subjectSet.has(item.bgmId) ||
        item.showDate > DATE_JP) {
      continue;
    }
    if ((WEEKDAY_JP == item.weekDayJP &&
         TIME_JP >= item.timeJP) ||
        (WEEKDAY_JP == (item.weekDayJP + 1) % 7 &&
         TIME_JP < item.timeJP)) {
      let $header = $(`#subjectPanel_${item.bgmId}>.header`);
      let $span = $c('span');
      $span.className = 'onAir rr';
      $span.textContent = '放送中';
      $header.insertBefore($span, $header.firstChild);
      let $title = $(`#prgSubjectList a.title[subject_id="${item.bgmId}"]`);
      $title.parentNode.classList.add('onAir');
    }
  }
});
