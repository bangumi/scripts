// ==UserScript==
// @name        Bangumi-Green-Block-Improve
// @namespace   org.binota.scripts.bangumi.bgbi
// @description Draw green block with 30Jikansei
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/?$/
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/subject\/\d+$/
// @version     0.0.1
// @grant       GM_addStyle
// ==/UserScript==
"use strict";

//日本人的一天有 30 小時。

const BTN_YESTERDAY_COLOR = '#723C08';
const BTN_YESTERDAY_BG = '#F9B38C';

GM_addStyle(`
a.epBtnYesterday {
  background: ${BTN_YESTERDAY_BG};
  border: 1px solid ${BTN_YESTERDAY_COLOR};
  color: ${BTN_YESTERDAY_COLOR};
}
a.epBtnYesterday:hover {
  border-top: 2px solid ${BTN_YESTERDAY_COLOR};
}
`);

//Get now time.
var now = new Date();
var enabled = (now.getUTCHours() >= 15 && now.getUTCHours() <= 21);
var inSubject = window.location.href.includes("/subject");

var today = new Date();
var yesterday = new Date();
yesterday.setUTCDate(today.getUTCDate() - 1);

function getEpDate(id) {
  var mch = document.querySelector(`#prginfo_${id}`).innerText.match(/\d{4}\-\d{2}\-\d{2}/);
  if (mch === null) return mch;
  return mch[0];
}

function setEpStatus(id, status) {
  switch (status) {
    case 'NA':
    case 'Air':
    case 'Watched':
    case 'Yesterday':
    case 'Today':
      $epBtn = document.querySelector(`#prg_${id}`);
      $epBtn.classList.remove('epBtnNA');
      $epBtn.classList.remove('epBtnAir');
      $epBtn.classList.remove('epBtnWatched');
      $epBtn.classList.remove('epBtnToday');
      $epBtn.classList.remove('epBtnYesterday');
      $epBtn.classList.add(`epBtn${status}`);
      break;
  }
}

//Loop over blocks
var $blocks = document.querySelectorAll('.load-epinfo');
var $onAirIcons = document.querySelectorAll('.onAir.rr');
var onAirIcon = document.createElement('span');
onAirIcon.classList.add('onAir');
onAirIcon.classList.add('rr');

//Remove onAirIcons
for (let i = 0; i < $onAirIcons.length; i++) {
  $onAirIcons[i].remove();
}

for (let i = 0; i < $blocks.length; i++) {
  var block = $blocks[i];
  var id = block.id.match(/\d+/)[0];
  var watched = block.classList.contains('epBtnWatched');

  //Convert to a Date implementation.
  var date = new Date(`${getEpDate(id)}T00:00:00`);

  //Clear block

  //@TODO: DRY
  //普通な時間
  if ((date.toDateString() == today.toDateString()) ||
      (enabled && (date.toDateString() == yesterday.toDateString()))) {
    //Light onAir button
    if (!inSubject)    
      block.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('header')[0].prepend(onAirIcon);
    
    //Change to green block
    if (!watched)
      setEpStatus(id, 'Today');
  } else if (date.toDateString() == yesterday.toDateString()) {
    if (!inSubject)    
      block.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('header')[0].prepend(onAirIcon);

    if (!watched)
      setEpStatus(id, 'Yesterday');
  }
}

