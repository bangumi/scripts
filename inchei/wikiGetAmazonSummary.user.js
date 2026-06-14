// ==UserScript==
// @name         从亚马逊获取书籍简介
// @namespace    bangumi.wiki.get.amazon.summary
// @version      0.0.1
// @description  从亚马逊获取书籍简介
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*/edit_detail
// @match        http*://chii.in/subject/*/edit_detail
// @match        http*://bangumi.tv/subject/*/edit_detail
// @match        http*://bgm.tv/new_subject/1
// @match        http*://chii.in/new_subject/1
// @match        http*://bangumi.tv/new_subject/1
// @grant        GM_xmlhttpRequest
// @connect      amazon.co.jp
// @license      MIT
// @gf
// ==/UserScript==

(function () {
  'use strict';

  if (location.pathname !== '/new_subject/1' && document.querySelector('.focus.chl').href.split('/').pop() !== 'book') return;

  const summaryInput = document.querySelector('#subject_summary');
  const button = document.createElement('button');
  button.textContent = '从亚马逊获取';
  button.type = 'button';
  button.addEventListener('click', async () => {
    const wcode = getWcode();
    const ISBN = wcode.match(/(?<=\|ISBN= )\d+/)?.[0];
    if (!ISBN) return;
    button.textContent = '获取中';
    button.disabled = true;
    try {
      const summary = await getAmazon(ISBN);
      summaryInput.value = summary;
      button.textContent = '从亚马逊获取';
    } catch (e) {
      console.error(e);
      button.textContent = '获取失败，点击重试';
    } finally {
      button.disabled = false;
    }
  });

  summaryInput.parentElement.previousElementSibling.append(button);

})();

/**
 * 通过ISBN获取亚马逊日本站的图书描述
 * @param {string} isbn - 10位或13位ISBN号
 * @returns {Promise<string>} 返回描述文本
 */
/**
 * 将13位ISBN转换为10位ISBN
 * @param {string} isbn13 - 13位ISBN
 * @returns {string} 10位ISBN
 */
function convertISBN13to10(isbn13) {
  // 移除连字符和空格
  const clean = String(isbn13).replace(/[-\s]/g, '');

  // 必须是13位且以978或979开头
  if (!/^978\d{10}$|^979\d{10}$/.test(clean)) {
    throw new Error('Invalid ISBN-13 format');
  }

  // 取前9位（去掉校验码和前缀的978/979）
  const id = clean.substring(3, 12);

  // 计算ISBN-10校验码
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(id[i]) * (10 - i);
  }
  const checkDigit = 11 - (sum % 11);
  const checkChar = checkDigit === 10 ? 'X' : (checkDigit === 11 ? '0' : checkDigit.toString());

  return `${id}${checkChar}`;
}

/**
 * 获取亚马逊日本站图书描述（使用ISBN-10）
 * @param {string} isbn - 10位或13位ISBN号
 * @returns {Promise<string>} 返回描述文本
 */
async function getAmazon(isbn) {
  // 清洗ISBN：移除连字符和空格
  let cleanIsbn = String(isbn).replace(/[-\s]/g, '');

  // 如果是13位，转换为10位
  if (cleanIsbn.length === 13) {
    if (/^978|^979/.test(cleanIsbn.substring(0, 3))) {
      cleanIsbn = convertISBN13to10(cleanIsbn);
    } else {
      throw new Error('Invalid ISBN-13: must start with 978 or 979');
    }
  }

  // 验证是否为有效的10位ISBN格式（允许末尾X）
  if (!/^\d{9}[\dX]$/i.test(cleanIsbn)) {
    throw new Error('Invalid ISBN-10 format');
  }

  // 转换为大写（处理x的情况）
  cleanIsbn = cleanIsbn.toUpperCase();

  // 构造URL（使用ISBN-10）
  const dpUrl = `https://www.amazon.co.jp/dp/${cleanIsbn}`;

  // 辅助函数：使用GM_xmlhttpRequest获取页面内容
  function fetchWithGM(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        onload: function (response) {
          if (response.status >= 200 && response.status < 300) {
            resolve(response.responseText);
          } else {
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        },
        onerror: function (err) {
          reject(new Error('Network request failed: ' + (err.error || 'Unknown error')));
        },
        ontimeout: function () {
          reject(new Error('Request timeout'));
        }
      });
    });
  }

  // 辅助函数：从HTML字符串中提取描述
  function extractDescriptionFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const descElem = doc.querySelector('#bookDescription_feature_div');
    return descElem ? descElem.textContent.trim() : '';
  }

  // 辅助函数：从HTML中提取Kindle链接
  function extractKindleUrlFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const kindleLinkElem = doc.querySelector('#tmm-grid-swatch-KINDLE a');
    if (!kindleLinkElem) return null;

    let kindleUrl = kindleLinkElem.getAttribute('href');
    if (kindleUrl && kindleUrl.startsWith('/')) {
      kindleUrl = 'https://www.amazon.co.jp' + kindleUrl;
    }
    return kindleUrl;
  }

  try {
    // 第一步：获取原始dp页面（使用ISBN-10）
    const dpHtml = await fetchWithGM(dpUrl);
    let description = extractDescriptionFromHtml(dpHtml);

    // 如果描述不为空，直接返回
    if (description) {
      return description;
    }

    // 第二步：描述为空，尝试获取Kindle版链接
    const kindleUrl = extractKindleUrlFromHtml(dpHtml);
    if (!kindleUrl) {
      return ''; // 没有Kindle链接，返回空
    }

    // 第三步：获取Kindle页面并提取描述
    const kindleHtml = await fetchWithGM(kindleUrl);
    description = extractDescriptionFromHtml(kindleHtml);

    return description;
  } catch (error) {
    console.error('Error fetching Amazon description:', error);
    throw error;
  }
}

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
