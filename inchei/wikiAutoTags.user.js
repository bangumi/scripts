// ==UserScript==
// @name         自动填写书籍区标签
// @namespace    bangumi.wiki.auto.tags
// @version      0.0.1
// @description  自动填写书籍区标签
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*/edit_detail
// @match        http*://chii.in/subject/*/edit_detail
// @match        http*://bangumi.tv/subject/*/edit_detail
// @match        http*://bgm.tv/new_subject/1
// @match        http*://chii.in/new_subject/1
// @match        http*://bangumi.tv/new_subject/1
// @grant        none
// @license      MIT
// @gf
// ==/UserScript==

(function () {
  'use strict';

  if (location.pathname !== '/new_subject/1' && document.querySelector('.focus.chl').href.split('/').pop() !== 'book') return;

  const tagsInput = document.querySelector('#tags');
  const cats = [...document.querySelectorAll('.tag_list li:first-child a')].map(a => a.textContent);
  function fill() {
    const title = document.querySelector('[name="subject_title"]').value;
    const cat = document.querySelector(`[for="${document.querySelector('[name="platform"]:checked')?.id}"]`)?.textContent;
    const series = document.querySelector('#subjectSeries').checked;
    if (!series && title.match(/\(\d+\)|\s\d+$/)) return;
    const tags = [];
    if (cat && cat !== '其他') {
      for (const c of cats) {
        if (c === cat) continue;
        tagsInput.value = tagsInput.value.split(c).join('');
      }
      tags.push(cat);
    }
    if (series) tags.push('系列');
    const wcode = getWcode();
    if (wcode.match(/\|连载结束= ./) || wcode.match(/\|册数= \d+/)) {
      tags.push('已完结');
    }
    const isbnMatch = wcode.match(/\|ISBN= 978(\d{2,3})/);
    if (isbnMatch) {
      const code = isbnMatch[1];
      if (code.startsWith('988') || code.startsWith('962')) {
        tags.push('香港');
      } else if (code.startsWith('986') || code.startsWith('957')) {
        tags.push('台湾');
      } else if (code.startsWith('974')) {
        tags.push('泰国');
      } else if (code.startsWith('967')) {
        tags.push('马来西亚');
      } else if (code.startsWith('89')) {
        tags.push('韩国');
      } else if (code.startsWith('7')) {
        tags.push('中国');
      } else if (code.startsWith('4')) {
        tags.push('日本');
      }
    } else if (wcode.match(/\|出版社= (集英社|講談社|KADOKAWA|小学館|白泉社)/)) {
      tags.push('日本');
    }
    tags.forEach(tag => chiiLib.subject.addTag(tag));
  }

  if (tagsInput.value === '') fill();
  window.fill = fill;

  tagsInput.parentElement.previousElementSibling.insertAdjacentHTML('beforeend', `
    <button type="button" onclick="fill()">自动填充</button>
  `);

})();

/* eslint no-undef: "off" */
function getWcode() {
  if (nowmode === 'wcode') {
    return document.getElementById('subject_infobox').value;
  } else if (nowmode === 'normal') {
    info = new Array();
    ids = new Object();
    props = new Object();
    input_num = $('#infobox_normal input.id').length;
    ids = $('#infobox_normal input.id');
    props = $('#infobox_normal input.prop');
    for (i = 0; i < input_num; i++) {
      id = $(ids).get(i);
      prop = $(props).get(i);
      if ($(id).hasClass('multiKey')) {
        multiKey = $(id).val();
        info[multiKey] = new Object();
        var subKey = 0;
        i++;
        id = $(ids).get(i);
        prop = $(props).get(i);
        while (($(id).hasClass('multiSubKey') || $(prop).hasClass('multiSubVal')) && i < input_num) {
          if (Number.isNaN($(id).val())) {
            info[multiKey][subKey] = {
              key: $(id).val(),
              value: $(prop).val()
            };
          } else {
            info[multiKey][subKey] = $(prop).val();
          }
          subKey++;
          i++;
          id = $(ids).get(i);
          prop = $(props).get(i);
        }
        i--;
      } else if ($.trim($(id).val()) != '') {
        info[$(id).val()] = $(prop).val();
      }
    }
    return WCODEDump(info);
  }
}
