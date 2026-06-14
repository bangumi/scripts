// ==UserScript==
// @name         Bookoff 添加条目到 bangumi
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  在Bookoff商品页添加同步链接，点击后自动填充数据到BGM.tv新条目页面
// @author       You
// @match        *://shopping.bookoff.co.jp/used/*
// @match        *://bgm.tv/new_subject/1
// @match        *://bangumi.tv/new_subject/1
// @match        *://chii.in/new_subject/1
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @license      MIT
// ==/UserScript==

(function() {
  'use strict';

  // 书系映射表：后缀 → 完整书系名
  const SERIES_MAP = {
    'マーガレットC': 'マーガレットコミックス',
    'マーガレットレインボー': 'マーガレットレインボーコミックス',
    'なかよしC': 'なかよしコミックス',
    'りぼんC': 'りぼんコミックス',
    'サンデーC': 'サンデーコミックス',
    'マガジンC': 'マガジンコミックス'
  };

  // 图片转DataURL
  function imageUrlToDataUrl(url, callback) {
    if (!url) {
      callback('');
      return;
    }
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      onload: function(response) {
        try {
          const base64 = btoa(new Uint8Array(response.response).reduce((data, byte) => data + String.fromCharCode(byte), ''));
          callback(`data:image/jpeg;base64,${base64}`);
        } catch (e) {
          console.error('图片转换失败:', e);
          callback('');
        }
      },
      onerror: function() {
        callback('');
      }
    });
  }

  // 日期格式化 YYYY-MM-DD
  function processDate(dateText) {
    if (!dateText) return '';
    return dateText.replace(/\//g, '-').trim();
  }

  // ==================== Bookoff 商品页面逻辑 ====================
  if (window.location.host === 'shopping.bookoff.co.jp') {
    // 添加按钮到标题旁
    function addButton() {
      const titleEl = document.querySelector('.productInformation__title');
      if (!titleEl || titleEl.nextElementSibling?.classList.contains('bookoff-bgm-link')) return;

      const btn = document.createElement('a');
      btn.href = 'javascript:';
      btn.textContent = '→ 添加到 bangumi';
      btn.className = 'bookoff-bgm-link';
      btn.style.marginLeft = '10px';
      btn.style.color = '#007bff';
      btn.style.cursor = 'pointer';

      btn.addEventListener('click', handleClick);
      titleEl.after(btn);
    }

    // 点击按钮：采集数据
    function handleClick() {
      // 1. 抓取页面元素
      const imgSrc = document.querySelector('.productInformation__image img')?.src || '';
      const title = document.querySelector('.productInformation__title')?.textContent.trim() || '';
      const author = document.querySelector('.productInformation__author a')?.textContent.trim() || '';
      const publisher = document.querySelector('#js-company a')?.textContent.trim() || '';
      const dateText = document.querySelector('.productDetail__table tr:nth-child(3) td')?.textContent.trim() || '';
      const isbn = document.querySelector('.productDetail__table tr:nth-child(4) td')?.textContent.trim() || '';
      const genreText = document.querySelector('.breadcrumbs__item a[href*="genre/1102"]')?.textContent.trim() || '';
      // 抓取定价
      const priceRaw = document.querySelector('.productInformation__regularPrice')?.textContent.trim() || '';
      let price = '';
      if (priceRaw) {
        const priceNum = priceRaw.replace(/[^0-9]/g, '');
        if (priceNum) price = `JP¥${priceNum}`;
      }

      // 2. 处理标题和书系
      let mainTitle = title;
      let series = '';
      const titleParts = title.split(' ');
      const lastPart = titleParts[titleParts.length - 1] || '';

      // 匹配书系后缀
      for (const [suffix, seriesName] of Object.entries(SERIES_MAP)) {
        if (lastPart.includes(suffix)) {
          series = seriesName;
          mainTitle = titleParts.slice(0, -1).join(' ');
          break;
        }
      }

      // 3. 处理标签
      let tags = '漫画 日本';
      if (genreText.includes('少女')) tags += ' 少女';
      if (genreText.includes('少年')) tags += ' 少年';
      if (genreText.includes('青年')) tags += ' 青年';
      if (genreText.includes('女性')) tags += ' 女性';

      // 4. 转换图片并存储数据
      imageUrlToDataUrl(imgSrc, (dataUrl) => {
        GM_setValue('bookoffData', JSON.stringify({
          title: mainTitle,
          series: series,
          author: author,
          publisher: publisher,
          releaseDate: processDate(dateText),
          isbn: isbn.replace(/[^0-9]/g, ''),
          tags: tags,
          imgDataUrl: dataUrl,
          price: price
        }));
        // 打开BGM新建页面
        GM_openInTab('https://bgm.tv/new_subject/1', { active: true });
      });
    }

    // 初始化 + 监听页面变化
    addButton();
    const observer = new MutationObserver(addButton);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ==================== BGM 新建条目页面逻辑 ====================
  else if (window.location.pathname === '/new_subject/1') {
    // 等待元素加载
    function waitForElement(selector, callback) {
      const el = document.querySelector(selector);
      if (el) {
        callback(el);
        return;
      }
      const observer = new MutationObserver(() => {
        const elem = document.querySelector(selector);
        if (elem) {
          observer.disconnect();
          callback(elem);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // 填充表单
    function fillForm(data) {
      // 填充标题
      const titleInput = document.querySelector('input[name="subject_title"]');
      if (titleInput) titleInput.value = data.title;

      // 填充标签
      const tagsInput = document.querySelector('input#tags');
      if (tagsInput && !data.title.match(/\(\d+\)/)) tagsInput.value = data.tags;

      // 构建 infobox 模板，填入价格
      const template = `{{Infobox animanga/Book
|中文名=
|别名=
|作者= ${data.author}
|作画=
|脚本=
|原作=
|插图=
|出版社= ${data.publisher}
|价格= ${data.price}
|其他出版社=
|连载杂志=
|发售日= ${data.releaseDate}
|页数=
|ISBN= ${data.isbn}
|书系= ${data.series}
|链接=
}}`;

      // 填充内容框
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.value = template;

      // 设置封面
      if (data.imgDataUrl) {
        waitForElement('img.preview', (img) => img.src = data.imgDataUrl);
      }

      // 自动选择漫画分类
      waitForElement('#cat_comic', (cat) => cat.click());
    }

    // 读取并使用数据
    const stored = GM_getValue('bookoffData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        fillForm(data);
        GM_deleteValue('bookoffData');
      } catch (e) {
        console.error('数据解析失败', e);
        GM_deleteValue('bookoffData');
      }
    }
  }
})();
