// ==UserScript==
// @name        bangumi new wiki helper
// @name:zh-CN  bangumi 创建条目助手
// @namespace   https://github.com/zhifengle
// @description assist to create new subject
// @description:zh-cn 辅助创建 bangumi.tv 上的条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/www\.amazon\.co\.jp\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @match      *://*/*
// @author      zhifengle
// @homepage    https://github.com/zhifengle/bangumi-new-wiki-helper
// @version     0.7.2
// @note        支持从 VGMdb 艺术家 / 组织页面新建现实人物，可先查重
// @note        0.4.27 支持音乐条目曲目列表
// @note        0.3.0 使用 typescript 重构，浏览器扩展和脚本使用公共代码
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==

(function () {
  'use strict';

  function defineSiteIntegration(integration) {
      return integration;
  }
  function definePersonIntegration(integration) {
      return integration;
  }

  var SubjectTypeId;
  (function (SubjectTypeId) {
      SubjectTypeId[SubjectTypeId["book"] = 1] = "book";
      SubjectTypeId[SubjectTypeId["anime"] = 2] = "anime";
      SubjectTypeId[SubjectTypeId["music"] = 3] = "music";
      SubjectTypeId[SubjectTypeId["game"] = 4] = "game";
      SubjectTypeId[SubjectTypeId["real"] = 6] = "real";
      SubjectTypeId["all"] = "all";
  })(SubjectTypeId || (SubjectTypeId = {}));

  const adultComicSubject = {
      key: 'adultcomic',
      description: 'adultcomic',
      host: ['adultcomic.dbsearch.net'],
      type: SubjectTypeId.book,
      pageSelectors: [
          {
              selector: '#pankuz > ol > li:nth-child(1) > a[href*="adultcomic.dbsearch.net"]',
          },
      ],
      controlSelector: [
          {
              selector: '#h2-icon-bk',
          },
          {
              selector: 'h2-icon-wk',
          },
      ],
      itemList: [],
  };
  const commonSelectors$3 = [
      {
          selector: '#info-table > div.info-box > dl',
          subSelector: 'dt',
          sibling: true,
      },
  ];
  const genSelectors = (keyWord) => commonSelectors$3.map((s) => {
      return {
          ...s,
          keyWord,
      };
  });
  adultComicSubject.itemList.push({
      name: '名称',
      selector: {
          selector: '#h2-icon-bk',
      },
      category: 'subject_title',
  }, 
  // 图片使用的懒加载. 在 hook 里面读取 data-src
  {
      name: 'cover',
      selector: [
          {
              selector: '#sample-image > figure > a',
          },
          {
              selector: '#info-table > .img-box > img',
          },
      ],
      category: 'cover',
  }, {
      name: 'ISBN',
      selector: genSelectors('ISBN'),
      category: 'ISBN',
  }, {
      name: '发售日',
      selector: genSelectors('発売日'),
      category: 'date',
      pipes: ['k', 'date'],
  }, {
      name: '出版社',
      selector: genSelectors('出版社'),
  }, {
      name: '书系',
      selector: genSelectors(['レーベル']),
  }, {
      name: '页数',
      selector: genSelectors(['ページ']),
      pipes: ['num'],
  }, {
      name: '作者',
      selector: [
          {
              selector: '#info-table > div.info-box .author-list > li',
          },
          ...genSelectors('漫画家'),
      ],
      category: 'creator',
  }, {
      name: '价格',
      selector: genSelectors('本体価格'),
  }, {
      name: '内容简介',
      selector: [
          {
              selector: '#comment-clist > .iteminfo-box',
              subSelector: 'h4',
              sibling: true,
              keyWord: ['内容紹介'],
          },
      ],
      category: 'subject_summary',
  });

  const adultComicTools = {
      hooks: {
          async afterGetWikiData(infos) {
              const res = [];
              for (const info of infos) {
                  let newInfo = { ...info };
                  if (info.name === '作者') {
                      const lists = document.querySelectorAll('#info-table > div.info-box .author-list > li');
                      if (lists && lists.length > 1) {
                          newInfo.value = Array.from(lists)
                              .map((node) => node.textContent.trim())
                              .join(', ');
                      }
                  }
                  if (newInfo) {
                      res.push({
                          ...newInfo,
                      });
                  }
              }
              // getCover 判断 data-src。这里就禁用了
              // const $img = document.querySelector('#sample-image > figure > img');
              // if ($img) {
              //   const info: SingleInfo = {
              //     category: 'cover',
              //     name: 'cover',
              //     value: {
              //       url: $img.getAttribute('data-src'),
              //       dataUrl: $img.getAttribute('data-src'),
              //     },
              //   };
              //   res.push(info);
              // }
              return res;
          },
      },
  };

  const adultcomicIntegration = defineSiteIntegration({
      site: adultComicSubject,
      tools: adultComicTools,
  });

  // TODO: 区分 kindle 页面和 纸质书页面
  const amazonJpBookSubject = {
      key: 'amazon_jp_book',
      host: ['amazon.co.jp', 'www.amazon.co.jp'],
      description: '日亚图书',
      type: SubjectTypeId.book,
      pageSelectors: [
          {
              selector: '#nav-subnav .nav-a:first-child',
              subSelector: '.nav-a-content',
              keyWord: ['本', '书', '漫画', 'マンガ', 'Kindle', 'Audible'],
          },
          {
              selector: '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
              subSelector: '.a-link-normal',
              keyWord: ['本', '书', '漫画', 'マンガ', 'Kindle', 'Audible'],
          },
          {
              selector: '#wayfinding-breadcrumbs_feature_div .a-unordered-list .a-list-item:first-child',
              subSelector: '.a-link-normal',
              keyWord: ['本', '书', '漫画', 'マンガ', 'Kindle', 'Audible'],
          },
      ],
      controlSelector: [
          {
              selector: '#title',
          },
          {
              selector: '#productTitle',
          },
      ],
      itemList: [],
  };
  const commonSelectors$2 = [
      // 2021-05 日亚改版
      {
          selector: '#richProductInformation_feature_div',
          subSelector: 'ol.a-carousel li',
      },
      {
          selector: '#detailBullets_feature_div .detail-bullet-list',
          subSelector: 'li .a-list-item',
      },
      {
          selector: '#detail_bullets_id .bucket .content',
          subSelector: 'li',
      },
  ];
  amazonJpBookSubject.itemList.push({
      name: '名称',
      selector: {
          selector: '#productTitle',
      },
      category: 'subject_title',
  }, 
  // 在 afterGetWikiData 获取封面
  // {
  //   name: 'cover',
  //   selector: [
  //     {
  //       selector: 'img#igImage',
  //     },
  //   ],
  //   category: 'cover',
  // },
  {
      name: 'ASIN',
      selector: commonSelectors$2.map((s) => {
          return {
              ...s,
              keyWord: ['ASIN', 'ISBN-10'],
          };
      }),
      category: 'ASIN',
  }, {
      name: 'ISBN',
      selector: commonSelectors$2.map((s) => {
          return {
              ...s,
              keyWord: 'ISBN-13',
          };
      }),
      category: 'ISBN',
      pipes: ['k', 'ta'],
  }, {
      name: '发售日',
      selector: commonSelectors$2.map((s) => {
          return {
              ...s,
              keyWord: ['発売日', '出版日期', '配信日'],
          };
      }),
      category: 'date',
      pipes: ['ta', 'k', 'p', 'date'],
  }, {
      name: '出版社',
      selector: [
          {
              selector: '#bylineInfo',
              subSelector: '.author',
              keyWord: /\(出版社\)/,
              nextSelector: [
                  {
                      selector: '.a-link-normal',
                  },
                  {
                      selector: 'a',
                  },
              ],
          },
          ...commonSelectors$2.map((s) => {
              return {
                  ...s,
                  keyWord: '出版社',
              };
          }),
      ],
  }, {
      name: '页数',
      selector: commonSelectors$2.map((s) => {
          return {
              ...s,
              keyWord: ['ページ', '页'],
          };
      }),
      pipes: ['num'],
  }, 
  // 有声书
  {
      name: '播放时长',
      selector: commonSelectors$2.map((s) => {
          return {
              ...s,
              keyWord: ['再生時間'],
          };
      }),
  }, {
      name: '演播',
      selector: commonSelectors$2.map((s) => {
          return {
              ...s,
              keyWord: ['ナレーター'],
          };
      }),
      pipes: ['ta', 'k'],
  }, {
      name: '作者',
      selector: [
          {
              selector: '#bylineInfo',
              subSelector: '.author',
              keyWord: /\(著\)/,
              nextSelector: [
                  {
                      selector: '.contributorNameID',
                  },
                  {
                      selector: 'a',
                  },
              ],
          },
          {
              selector: '#byline .author span.a-size-medium',
          },
          {
              selector: '#bylineInfo .author > a',
          },
          {
              selector: '#bylineInfo .contributorNameID',
          },
      ],
      category: 'creator',
  }, {
      name: '插图',
      selector: [
          {
              selector: '#bylineInfo',
              subSelector: '.author',
              keyWord: 'イラスト',
              nextSelector: [
                  {
                      selector: '.contributorNameID',
                  },
                  {
                      selector: 'a',
                  },
              ],
          },
      ],
      category: 'creator',
  }, {
      name: '价格',
      selector: [
          {
              selector: '#tmmSwatches .a-button-selected .slot-price',
          },
          {
              selector: '#tmmSwatches [aria-checked="true"] .slot-price',
          },
          {
              selector: '#tmmSwatches .swatchElement.selected .slot-price',
          },
          {
              selector: '#Northstar-Buybox .a-button-selected .slot-price',
          },
          {
              selector: '#tmm-grid-swatch-PAPERBACK .slot-price',
          },
          {
              selector: '#Northstar-Buybox .a-accordion-active .a-price .a-offscreen',
          },
          {
              selector: '#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen',
          },
          {
              selector: '#corePrice_feature_div .priceToPay .a-offscreen',
          },
          {
              selector: '#apex_desktop .priceToPay .a-offscreen',
          },
          {
              selector: '#price_inside_buybox',
          },
      ],
      pipes: ['ta'],
  }, {
      name: '内容简介',
      selector: [
          {
              selector: '#productDescription',
              subSelector: 'h3',
              sibling: true,
              keyWord: ['内容紹介', '内容'],
          },
          {
              selector: '#bookDescription_feature_div .a-expander-content',
          },
          {
              selector: '#bookDesc_iframe',
              subSelector: '#iframeContent',
              isIframe: true,
          },
      ],
      category: 'subject_summary',
  });

  function getStringValue(value, fallback = '') {
      if (typeof value === 'string') {
          return value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
      }
      return fallback;
  }
  function isCoverValue(value) {
      return (typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          ('url' in value || 'dataUrl' in value));
  }
  function getCoverValue(value) {
      if (isCoverValue(value)) {
          return value;
      }
      return undefined;
  }

  // support GM_XMLHttpRequest
  function getGMRequest() {
      return globalThis.GM_xmlhttpRequest;
  }
  function isSuccessfulHttpStatus(status) {
      return status >= 200 && status < 300;
  }
  class HttpStatusError extends Error {
      status;
      constructor(status, url) {
          super(`Request failed with status ${status}: ${url}`);
          this.status = status;
      }
  }
  function resolveRequestBody(method, body, data) {
      if (method === 'POST') {
          return data ?? body ?? null;
      }
      return body ?? null;
  }
  function fetchInfo(url, type, opts = {}, TIMEOUT = 10 * 1000) {
      const method = opts?.method?.toUpperCase() || 'GET';
      const gmRequest = getGMRequest();
      if (gmRequest) {
          const { decode, method: _method, body, data, ...restOpts } = opts;
          const requestBody = resolveRequestBody(method, body, data);
          const responseType = decode ? 'arraybuffer' : type;
          return new Promise((resolve, reject) => {
              gmRequest({
                  method,
                  timeout: TIMEOUT,
                  url,
                  responseType,
                  ...(requestBody ? { data: requestBody } : {}),
                  onload(res) {
                      if (!isSuccessfulHttpStatus(res.status)) {
                          reject(new HttpStatusError(res.status, url));
                          return;
                      }
                      if (decode && responseType === 'arraybuffer') {
                          const decoder = new TextDecoder(decode);
                          resolve(decoder.decode(res.response));
                      }
                      else {
                          resolve(res.response);
                      }
                  },
                  onerror: reject,
                  ontimeout: () => reject(new Error('fetch timeout')),
                  ...restOpts,
              });
          });
      }
      const { decode, method: _method, body, data, ...restOpts } = opts;
      const requestBody = resolveRequestBody(method, body, data);
      return internalFetch(fetch(url, {
          ...restOpts,
          method,
          body: requestBody,
      }), TIMEOUT)
          .then(async (response) => {
          if (!isSuccessfulHttpStatus(response.status)) {
              throw new HttpStatusError(response.status, url);
          }
          if (decode) {
              const buffer = await response.arrayBuffer();
              const decoder = new TextDecoder(decode);
              return decoder.decode(buffer);
          }
          switch (type) {
              case 'text':
                  return response.text();
              case 'json':
                  return response.json();
              case 'blob':
                  return response.blob();
              case 'arraybuffer':
                  return response.arrayBuffer();
          }
          throw new Error(`Unsupported response type: ${type}`);
      })
          .catch((err) => {
          console.log('fetch err: ', err);
          throw err;
      });
  }
  function fetchBinary(url, opts = {}) {
      return fetchInfo(url, 'blob', opts);
  }
  function fetchText(url, opts = {}, TIMEOUT = 10 * 1000) {
      return fetchInfo(url, 'text', opts, TIMEOUT);
  }
  function fetchJson(url, opts = {}) {
      return fetchInfo(url, 'json', opts);
  }
  function internalFetch(fetchPromise, TIMEOUT) {
      return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
              reject(new Error('fetch timeout'));
          }, TIMEOUT);
          fetchPromise.then((response) => {
              clearTimeout(timer);
              resolve(response);
          }, (error) => {
              clearTimeout(timer);
              reject(error);
          });
      });
  }

  function canvasToBlob(canvas) {
      return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
              if (blob) {
                  resolve(blob);
              }
              else {
                  reject(new Error('failed to encode canvas image'));
              }
          }, 'image/png');
      });
  }
  function getImageDataByURL(url, opts = {}) {
      if (!url) {
          return Promise.reject(new Error('invalid img url'));
      }
      return new Promise(async (resolve, reject) => {
          try {
              const blob = await fetchBinary(url, opts);
              if (blob.type && !blob.type.toLowerCase().startsWith('image/')) {
                  throw new Error(`unexpected image response type: ${blob.type}`);
              }
              const reader = new FileReader();
              reader.onloadend = function () {
                  if (typeof reader.result === 'string') {
                      resolve(reader.result);
                      return;
                  }
                  reject(new Error('failed to convert blob to data url'));
              };
              reader.readAsDataURL(blob);
              reader.onerror = () => {
                  reject(reader.error ?? new Error('failed to read image blob'));
              };
          }
          catch (e) {
              reject(e);
          }
      });
  }
  /**
   * convert to img Element to base64 string
   * @param $img
   */
  function convertImgToBase64($img) {
      const canvas = document.createElement('canvas');
      canvas.width = $img.width;
      canvas.height = $img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          throw new Error('canvas 2d context is unavailable');
      }
      ctx.drawImage($img, 0, 0, $img.width, $img.height);
      const dataURL = canvas.toDataURL('image/png');
      return dataURL;
  }

  const amazonCoverSelectors = [
      '#imgTagWrapperId > img',
      '#landingImage',
      '#main-image-container img[data-a-image-name="landingImage"]',
      '#imageBlock img[data-a-dynamic-image]',
  ];
  function isAmazonImageUrl(url) {
      try {
          const parsedUrl = new URL(url);
          return ((parsedUrl.hostname === 'm.media-amazon.com' ||
              parsedUrl.hostname.endsWith('.ssl-images-amazon.com') ||
              parsedUrl.hostname === 'images.amazon.com') &&
              parsedUrl.pathname.startsWith('/images/'));
      }
      catch (error) {
          return false;
      }
  }
  function toAmazonAcSl1500ImageUrl(url) {
      if (!isAmazonImageUrl(url)) {
          return url;
      }
      return url.replace(/(?:\._[^/.]+_)?\.(jpe?g)(\?.*)?$/i, '._AC_SL1500_.$1$2');
  }
  function getLargestDynamicImageUrl($cover) {
      const value = $cover.getAttribute('data-a-dynamic-image');
      if (!value)
          return '';
      try {
          const images = JSON.parse(value);
          return Object.entries(images).reduce((largest, [url, dimensions]) => {
              const [width = 0, height = 0] = Array.isArray(dimensions)
                  ? dimensions.map(Number)
                  : [];
              const area = width * height;
              return area > largest.area ? { url, area } : largest;
          }, { url: '', area: -1 }).url;
      }
      catch (error) {
          return '';
      }
  }
  function getAmazonCoverUrl($cover) {
      return ($cover.getAttribute('data-old-hires')?.trim() ||
          getLargestDynamicImageUrl($cover) ||
          $cover.currentSrc ||
          $cover.getAttribute('src') ||
          '');
  }
  function findAmazonCover(root) {
      for (const selector of amazonCoverSelectors) {
          const $cover = root.querySelector(selector);
          if ($cover)
              return $cover;
      }
  }
  function toHalfWidthDigits(str) {
      return str.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
  }
  function normalizeVolumeParenthesis(str) {
      return str.replace(/([\s　]*)[（(]\s*([0-9０-９]+)\s*[）)]/g, (_, spacing, volume) => {
          return `${spacing}(${toHalfWidthDigits(volume)})`;
      });
  }
  const amazonUtils = {
      dealTitle(str = '') {
          str = normalizeVolumeParenthesis(str.trim().split('\n')[0].trim());
          return str
              .replace(/[\s　]*\((?!\s*[0-9]+\s*\))[^()]*\)$/, '')
              .replace(/[\s　]*（(?!\s*[0-9０-９]+\s*）)[^（）]*）$/, '')
              .trim();
      }};
  async function getAmazonCoverInfo(res, options = {}, root = document) {
      const $cover = findAmazonCover(root);
      if ($cover && !res.find((obj) => obj.name === 'cover')) {
          let url = getAmazonCoverUrl($cover);
          if (!url)
              return;
          const originalUrl = url;
          if (url && options.imageUrlTransform) {
              url = options.imageUrlTransform(url);
          }
          let dataUrl = url;
          try {
              if (url) {
                  dataUrl = await getImageDataByURL(url);
              }
          }
          catch (error) { }
          if (dataUrl === url && originalUrl && originalUrl !== url) {
              try {
                  dataUrl = await getImageDataByURL(originalUrl);
                  url = originalUrl;
              }
              catch (error) { }
          }
          const info = {
              category: 'cover',
              name: 'cover',
              value: {
                  url,
                  dataUrl,
              },
          };
          return info;
      }
  }

  const currentUsedBuyboxReg = /中古品\s*[:：]|中古商品\s*[:：]|コンディション\s*[:：]?\s*(?:中古|非全新品)|コレクター商品\s*[:：]|非全新品\s*[:：]/i;
  const kindleFormatReg = /Kindle|電子書籍|电子书/i;
  function getText$1(selector, root = document) {
      return root.querySelector(selector)?.textContent ?? '';
  }
  function isCurrentAmazonJpBookOfferUsed(root = document) {
      const selectedFormatText = getText$1('#tmmSwatches .a-button-selected, #tmmSwatches [aria-checked="true"]', root);
      if (kindleFormatReg.test(selectedFormatText)) {
          return false;
      }
      const currentBuyboxText = getText$1('#Northstar-Buybox .a-accordion-active', root);
      if (currentUsedBuyboxReg.test(currentBuyboxText)) {
          return true;
      }
      // if (
      //   document.querySelector(
      //     '#usedOnlyBuybox, #used_buybox_desktop, #usedBuySection'
      //   )
      // ) {
      //   return true;
      // }
      return false;
  }
  function getBookFormatSwatches() {
      const $swatches = document.querySelector('#tmmSwatches');
      if (!$swatches) {
          return [];
      }
      const formatSwatches = $swatches.querySelectorAll('[id^="tmm-grid-swatch-"]');
      if (formatSwatches.length) {
          return Array.from(formatSwatches);
      }
      return Array.from($swatches.querySelectorAll('.swatchElement'));
  }
  function getTitleAnchor() {
      const $title = document.querySelector('#title');
      if ($title) {
          return $title;
      }
      const $productTitle = document.querySelector('#productTitle');
      return $productTitle?.closest('h1') ?? $productTitle;
  }
  const amazonJpBookTools = {
      filters: [
          {
              category: 'subject_title',
              dealFunc: amazonUtils.dealTitle,
          },
      ],
      hooks: {
          async beforeCreate() {
              const $t = getTitleAnchor();
              const formatSwatches = getBookFormatSwatches();
              if ($t &&
                  !document.querySelector('.e-wiki-amazon-book-format-warning') &&
                  formatSwatches.length > 1) {
                  const $div = document.createElement('div');
                  $div.className = 'e-wiki-amazon-book-format-warning';
                  const $s = document.createElement('span');
                  $s.style.color = 'red';
                  $s.style.fontWeight = '600';
                  $s.innerHTML = '注意: ';
                  const $txt = document.createElement('span');
                  $txt.innerHTML =
                      '书籍存在多种版本，请优先选择实体书创建。(辅助创建脚本)';
                  $div.appendChild($s);
                  $div.appendChild($txt);
                  $div.style.padding = '6px 0';
                  $t.insertAdjacentElement('afterend', $div);
              }
              return true;
          },
          async afterGetWikiData(infos, _model, root = document) {
              const res = [];
              for (const info of infos) {
                  let newInfo = { ...info };
                  const stringValue = getStringValue(info.value);
                  if (info.name === '页数') {
                      const val = stringValue.trim().replace(/ページ|页/, '');
                      if (val && val.length < 8 && val.indexOf('予約商品') === -1) {
                          newInfo.value = val;
                      }
                      else {
                          newInfo = null;
                      }
                  }
                  else if (info.name === '播放时长') {
                      newInfo.value = stringValue.replace('時間', '小时').replace(/ /g, '');
                  }
                  else if (info.name === '价格') {
                      newInfo.value = stringValue.replace(/来自|より/, '').trim();
                      if (isCurrentAmazonJpBookOfferUsed(root)) {
                          newInfo = null;
                      }
                  }
                  if (newInfo) {
                      res.push({
                          ...newInfo,
                      });
                  }
              }
              const coverInfo = await getAmazonCoverInfo(res, {
                  imageUrlTransform: toAmazonAcSl1500ImageUrl,
              }, root);
              if (coverInfo) {
                  res.push(coverInfo);
              }
              return res;
          },
      },
  };

  const amazonJpBookIntegration = defineSiteIntegration({
      site: amazonJpBookSubject,
      tools: amazonJpBookTools,
  });

  // ref links
  // https://www.amazon.co.jp/dp/B07FQ5WPM3/
  // https://www.amazon.co.jp/dp/B0D456FXL4
  // https://www.amazon.co.jp/dp/B07GQXDHLN
  const amazonJpMusicSubject = {
      key: 'amazon_jp_music',
      description: 'amazon jp music',
      host: ['amazon.co.jp', 'www.amazon.co.jp'],
      type: SubjectTypeId.music,
      pageSelectors: [
          {
              selector: '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
              subSelector: '.a-link-normal',
              keyWord: ['ミュージック', 'Music', 'MUSIC', '音楽'],
          },
          {
              selector: '#nav-subnav .nav-a:first-child img[alt="デジタルミュージック"]',
          },
          {
              selector: '#detailBullets_feature_div + .a-unordered-list',
              subSelector: '.a-list-item',
              keyWord: ['ミュージック', '音楽'],
          },
      ],
      controlSelector: {
          selector: '#title',
      },
      itemList: [],
  };
  const commonSelectors$1 = [
      // 2021-05 日亚改版
      {
          selector: '#richProductInformation_feature_div',
          subSelector: 'ol.a-carousel li',
      },
      {
          selector: '#detailBullets_feature_div .detail-bullet-list',
          subSelector: 'li .a-list-item',
      },
      {
          selector: '#detail_bullets_id .bucket .content',
          subSelector: 'li',
      },
  ];
  amazonJpMusicSubject.itemList.push({
      name: '名称',
      selector: {
          selector: '#productTitle',
      },
      category: 'subject_title',
  }, {
      name: '艺术家',
      selector: [
          {
              selector: '#bylineInfo',
              subSelector: '.author',
              keyWord: /\(アーティスト\)/,
              nextSelector: [
                  {
                      selector: '.contributorNameID',
                  },
                  {
                      selector: 'a',
                  },
              ],
          },
          {
              selector: '#byline .author span.a-size-medium',
          },
          {
              selector: '#bylineInfo .author > a',
          },
          {
              selector: '#bylineInfo .contributorNameID',
          },
      ],
      category: 'creator',
      pipes: ['k'],
  }, {
      name: '碟片数量',
      selector: commonSelectors$1.map((s) => {
          return {
              ...s,
              keyWord: ['ディスク枚数'],
          };
      }),
  }, {
      name: '内容简介',
      selector: [
          {
              selector: '#productDescription',
              subSelector: 'h3',
              sibling: true,
              keyWord: ['内容紹介', '内容'],
          },
          {
              selector: '#productDescription',
          },
      ],
      category: 'subject_summary',
  }, {
      name: '价格',
      selector: [
          {
              selector: '#corePrice_feature_div > div > div > span.a-price.aok-align-center > span.a-offscreen',
          },
          {
              selector: '#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen',
          },
          {
              selector: '#declarative_ > table > tbody > tr > td.a-text-right.dp-new-col > span > a > span',
          },
      ],
  });

  const amazonJpMusicTools = {
      hooks: {
          async afterGetWikiData(infos, _model, root = document) {
              const res = [];
              for (const item of infos) {
                  if (item.name === '艺术家') {
                      item.value = getStringValue(item.value).replace(/\//g, '、');
                  }
                  res.push(item);
              }
              const date = root.querySelector('#declarative_ .title-text > span');
              if (date) {
                  const m = date.innerHTML.trim().match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                  if (m) {
                      res.push({
                          name: '发售日期',
                          value: `${m[1]}-${m[2]}-${m[3]}`,
                      });
                  }
              }
              const coverInfo = await getAmazonCoverInfo(res, {
                  imageUrlTransform: toAmazonAcSl1500ImageUrl,
              }, root);
              if (coverInfo) {
                  res.push(coverInfo);
              }
              const $tracks = root.querySelector('#music-tracks');
              if ($tracks) {
                  const discArr = [...$tracks.querySelectorAll('h4 + .a-row table')].map((table) => {
                      return [...table.querySelectorAll('tr > td:nth-child(2)')].map((td) => {
                          return {
                              title: td.innerHTML.trim(),
                          };
                      });
                  });
                  res.push({
                      category: 'ep',
                      name: '',
                      value: discArr,
                  });
              }
              return res;
          },
      },
  };

  const amazonJpMusicIntegration = defineSiteIntegration({
      site: amazonJpMusicSubject,
      tools: amazonJpMusicTools,
  });

  const dangdangBookSubject = {
      key: 'dangdang_book',
      host: ['product.dangdang.com'],
      description: '当当图书',
      type: SubjectTypeId.book,
      pageSelectors: [
          {
              selector: '#breadcrumb',
              subSelector: 'a',
              keyWord: '图书',
          },
      ],
      controlSelector: {
          selector: '.name_info h1',
      },
      itemList: [],
  };
  const infoSelector = {
      selector: '.messbox_info',
      subSelector: 'span',
  };
  const descSelector$1 = {
      selector: '#detail_describe',
      subSelector: 'li',
  };
  dangdangBookSubject.itemList.push({
      name: '名称',
      selector: {
          selector: '.name_info h1',
      },
      category: 'subject_title',
  }, 
  // {
  //   name: 'cover',
  //   selector: {
  //     selector: 'img#largePic',
  //   },
  //   category: 'cover',
  // },
  {
      name: 'ISBN',
      selector: {
          ...descSelector$1,
          keyWord: '国际标准书号ISBN',
      },
      category: 'ISBN',
  }, {
      name: '发售日',
      selector: {
          ...infoSelector,
          keyWord: '出版时间',
      },
      category: 'date',
  }, {
      name: '作者',
      selector: [
          {
              ...infoSelector,
              keyWord: '作者',
          },
      ],
  }, {
      name: '出版社',
      selector: {
          ...infoSelector,
          keyWord: '出版社',
      },
  }, {
      name: '内容简介',
      selector: [
          {
              selector: '#content .descrip',
          },
      ],
      category: 'subject_summary',
  });

  function trimParenthesis$1(str) {
      const textList = ['\\([^\\d]*?\\)', '（[^\\d]*?）']; // 去掉多余的括号信息
      return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
  }

  function genRandomStr(len) {
      return Array.apply(null, Array(len))
          .map(function () {
          return (function (chars) {
              return chars.charAt(Math.floor(Math.random() * chars.length));
          })('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
      })
          .join('');
  }
  function formatDate(time, fmt = 'yyyy-MM-dd') {
      const date = new Date(time);
      const components = {
          'M+': date.getMonth() + 1, // Month
          'd+': date.getDate(), // Day
          'h+': date.getHours(), // Hour
          'm+': date.getMinutes(), // Minute
          's+': date.getSeconds(), // Second
          'q+': Math.floor((date.getMonth() + 3) / 3), // Quarter
          S: date.getMilliseconds(), // Millisecond
      };
      // Replace year
      fmt = fmt.replace(/(y+)/i, (_, yearMatch) => (date.getFullYear() + '').slice(4 - yearMatch.length));
      // Replace other components
      for (const [key, value] of Object.entries(components)) {
          fmt = fmt.replace(new RegExp(`(${key})`, 'i'), (_, match) => match.length === 1 ? value.toString() : String(value).padStart(match.length, '0'));
      }
      return fmt;
  }
  function dealDate(input) {
      // Regular expressions to match various date formats
      const regexPatterns = [
          { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日?/, format: '$1-$2-$3' }, // yyyy年mm月dd日
          { pattern: /(\d{4})年(\d{1,2})月/, format: '$1-$2' }, // yyyy年mm月
          { pattern: /(\d{4})[/-](\d{1,2})$/, format: '$1-$2' }, // yyyy/mm
          { pattern: /.*?(\d{4})\/(\d{1,2})\/(\d{1,2}).*?/, format: '$1-$2-$3' }, // mixed with other text
      ];
      for (const { pattern, format } of regexPatterns) {
          const match = input.replace(/\s/g, '').match(pattern);
          if (match) {
              return format.replace(/\$(\d+)/g, (_, number) => String(match[number]).padStart(2, '0'));
          }
      }
      // input is not a valid date
      if (isNaN(Date.parse(input))) {
          return input;
      }
      return formatDate(input);
  }
  function isEqualDate(d1, d2) {
      const resultDate = new Date(d1);
      const originDate = new Date(d2);
      if (resultDate.getFullYear() === originDate.getFullYear() &&
          resultDate.getMonth() === originDate.getMonth() &&
          resultDate.getDate() === originDate.getDate()) {
          return true;
      }
      return false;
  }

  const dangdangBookTools = {
      filters: [
          {
              category: 'date',
              dealFunc(str) {
                  return dealDate(str.replace(/出版时间[:：]/, '').trim());
              },
          },
          {
              category: 'subject_title',
              dealFunc(str) {
                  return trimParenthesis$1(str);
              },
          },
      ],
  };

  const dangdangBookIntegration = defineSiteIntegration({
      site: dangdangBookSubject,
      tools: dangdangBookTools,
  });

  const dlsiteChara = {
      key: 'dlsite_game_chara',
      siteKey: 'dlsite_game',
      description: 'dlsite游戏角色',
      host: ['dlsite.com', 'www.dlsite.com'],
      type: SubjectTypeId.game,
      itemSelector: {
          selector: '.work_parts_multiimage_item',
      },
      toolbarSelector: [
          {
              selector: '.work_parts.type_multiimages *:first-child',
          },
          {
              selector: '#work_name',
          },
      ],
      itemList: [],
  };
  // 限定父节点
  dlsiteChara.itemList.push({
      name: 'cover',
      selector: {
          selector: '.image img',
      },
      category: 'crt_cover',
  });

  const dlsiteSubject = {
      key: 'dlsite_game',
      description: 'dlsite游戏',
      host: ['dlsite.com', 'www.dlsite.com'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '.floorTab-item.type-doujin.is-active',
          },
          {
              selector: '.floorTab-item.type-com.is-active',
          },
      ],
      controlSelector: [
          {
              selector: '#work_name',
          },
      ],
      itemList: [],
  };
  const commonSelector$2 = {
      selector: '#work_outline',
      subSelector: 'th',
      sibling: true,
  };
  const arrDict$1 = [
      {
          name: '发行日期',
          key: ['販売日', '贩卖日', '販賣日'],
          categrory: 'date',
      },
      // {
      //   name: '游戏类型',
      //   key: ['ジャンル', '分类'],
      // },
      {
          name: '作者',
          key: ['作者'],
      },
      {
          name: '原画',
          key: ['イラスト', '插画'],
      },
      {
          name: '剧本',
          key: ['シナリオ', '剧情'],
      },
      {
          name: '声优',
          key: ['声優', '声优'],
      },
      {
          name: '音乐',
          key: ['音乐', '音楽'],
      },
  ];
  const configArr$3 = arrDict$1.map((obj) => {
      const r = {
          name: obj.name,
          selector: {
              keyWord: obj.key,
              ...commonSelector$2,
          },
      };
      if (obj.categrory) {
          r.category = obj.categrory;
      }
      return r;
  });
  dlsiteSubject.itemList.push({
      name: '游戏名',
      selector: {
          selector: '#work_name',
      },
      category: 'subject_title',
  }, {
      // name: '社团名',
      name: '开发',
      selector: [
          {
              selector: '#work_maker .maker_name a',
          },
      ],
  }, ...configArr$3, {
      name: 'cover',
      selector: [
          {
              selector: '#work_left  div.slider_body_inner.swiper-container-horizontal > ul > li.slider_item:first-child > picture > img',
          },
      ],
      category: 'cover',
  }, {
      name: '游戏简介',
      selector: [
          {
              selector: '.work_parts_container',
              subSelector: '.work_parts_heading',
              keyWord: 'あらすじ',
              sibling: true,
          },
          {
              selector: '#intro-title + div',
          },
      ],
      category: 'subject_summary',
  }, {
      name: 'website',
      selector: [
          {
              selector: '#work_name > a',
          },
      ],
      category: 'website',
  });
  dlsiteSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
      {
          name: 'subject_nsfw',
          value: '1',
          category: 'checkbox',
      },
  ];

  const dlsiteTools = {
      hooks: {
          async afterGetWikiData(infos) {
              const res = [];
              for (const info of infos) {
                  let val = info.value;
                  const stringValue = getStringValue(info.value);
                  if (stringValue &&
                      !/http/.test(stringValue) &&
                      ['原画', '剧本', '音乐', '游戏类型', '声优', '作者'].includes(info.name)) {
                      const v = stringValue.split('/');
                      if (v && v.length > 1) {
                          val = v.map((s) => s.trim()).join(', ');
                      }
                  }
                  if (info.name === 'website' && stringValue) {
                      const url = stringValue.startsWith('/')
                          ? location.origin + stringValue
                          : stringValue;
                      res.push({
                          ...info,
                          name: '链接',
                          value: `DLsite|${url}`,
                          category: 'listItem',
                      });
                      continue;
                  }
                  res.push({
                      ...info,
                      value: val,
                  });
              }
              if (location.hostname.includes('dlsite.com') &&
                  !res.some((info) => info.name === '链接')) {
                  res.push({
                      name: '链接',
                      value: `DLsite|${location.origin + location.pathname}`,
                      category: 'listItem',
                  });
              }
              const cover = infos.find((obj) => obj.name === 'cover');
              if (!cover) {
                  let url = document.querySelector('meta[property="og:image"]')?.content;
                  if (url) {
                      let dataUrl = url;
                      try {
                          if (url) {
                              dataUrl = await getImageDataByURL(url, {
                                  headers: {
                                      Referer: url,
                                  },
                              });
                          }
                      }
                      catch (error) { }
                      res.push({
                          category: 'cover',
                          name: 'cover',
                          value: {
                              url,
                              dataUrl,
                          },
                      });
                  }
              }
              return res;
          },
      },
      filters: [
          {
              category: 'date',
              dealFunc(str) {
                  if (/年/.test(str)) {
                      return dealDate(str.replace(/日.+$/, '日'));
                  }
                  return str;
              },
          },
      ],
  };
  const dlsiteCharaTools = {
      hooks: {
          async afterGetWikiData(infos, model, el) {
              const res = [...infos];
              const txt = el.querySelector('p')?.textContent || '';
              res.push({
                  name: '姓名',
                  value: txt.split('\n')[0],
                  category: 'crt_name',
              });
              res.push({
                  name: 'CV',
                  value: (txt.split('\n').find((s) => s.includes('CV')) || '')
                      .replace('CV:', '')
                      .trim(),
              });
              let idx = txt.indexOf('\n\n');
              if (idx === -1) {
                  idx = 0;
              }
              else {
                  idx = idx + 2;
              }
              res.push({
                  name: '人物简介',
                  value: txt.slice(idx),
                  category: 'crt_summary',
              });
              return res;
          },
      },
  };

  const dlsiteIntegration = defineSiteIntegration({
      site: dlsiteSubject,
      tools: dlsiteTools,
      characters: [
          {
              model: dlsiteChara,
              tools: dlsiteCharaTools,
          },
      ],
  });

  const modernCharacterSectionSelector = {
      selector: '#detailGuide .detailGuide__content',
      subSelector: '.detailGuide__capt',
      keyWord: 'キャラクター',
      sibling: true,
  };
  const modernCharacterToolbarSelector = {
      selector: '#detailGuide .detailGuide__content',
      subSelector: '.detailGuide__capt',
      keyWord: 'キャラクター',
  };
  const modernCharacterItemSelector = {
      ...modernCharacterSectionSelector,
      nextSelector: {
          selector: '.detailGuide__box-chr',
      },
  };
  const dmmChara = {
      key: 'dmm_game_chara',
      siteKey: 'dmm_game',
      description: 'dmm 游戏角色',
      type: SubjectTypeId.game,
      itemSelector: modernCharacterItemSelector,
      presenceSelector: modernCharacterItemSelector,
      toolbarSelector: modernCharacterToolbarSelector,
      itemList: [],
  };
  // 限定父节点
  dmmChara.itemList.push({
      name: '姓名',
      selector: {
          selector: '.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt',
      },
      category: 'crt_name',
      pipes: ['p', 'ta'],
  }, {
      name: 'cover',
      selector: {
          selector: 'img',
      },
      category: 'crt_cover',
  });

  const modernTitleSelector = {
      selector: 'h1.productTitle__item--headline',
  };
  const modernControlSelector = {
      ...modernTitleSelector,
      closest: '.productTitle',
  };
  const dmmSubject = {
      key: 'dmm_game',
      description: 'dmm游戏',
      host: ['dlsoft.dmm.co.jp'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '.ntgnav-mainItem.is-active',
              subSelector: 'span',
              keyWord: 'ゲーム',
          },
          modernTitleSelector,
      ],
      controlSelector: [{ selector: 'h1#title' }, modernControlSelector],
      itemList: [],
  };
  const legacyInfoSelector = {
      selector: '.main-area-center .container02 table',
      subSelector: 'tr',
      nextSelector: {
          selector: '.type-right',
      },
  };
  const modernInfoSelector = {
      selector: '.productLayout__secondaryColumn',
      subSelector: '.contentsDetailTop__tableDataLeft > p, .contentsDetailBottom__tableDataLeft > p',
      closest: '.contentsDetailTop__tableRow, .contentsDetailBottom__tableRow',
      nextSelector: {
          selector: '.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight',
      },
  };
  function createInfoSelector(keyWord) {
      return [
          {
              ...legacyInfoSelector,
              keyWord,
              nextSelector: {
                  selector: '.type-right',
              },
          },
          {
              ...modernInfoSelector,
              keyWord,
              nextSelector: {
                  selector: '.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight',
              },
          },
      ];
  }
  const arrDict = [
      {
          name: '发行日期',
          key: ['配信開始日'],
          category: 'date',
      },
      {
          name: '游戏类型',
          key: ['ゲームジャンル'],
      },
      {
          name: '原画',
          key: ['原画'],
      },
      {
          name: '剧本',
          key: ['シナリオ', '剧情'],
      },
      // {
      //   name: '声优',
      //   key: ['声優', '声优'],
      // },
      // {
      //   name: '音乐',
      //   key: ['音乐', '音楽'],
      // },
  ];
  const configArr$2 = arrDict.map((obj) => {
      const r = {
          name: obj.name,
          selector: createInfoSelector(obj.key),
      };
      if (obj.category) {
          r.category = obj.category;
      }
      return r;
  });
  dmmSubject.itemList.push({
      name: '游戏名',
      selector: [
          {
              selector: '#title',
          },
          modernTitleSelector,
          {
              selector: 'meta[property="og:title"]',
          },
      ],
      category: 'subject_title',
  }, {
      name: '开发',
      selector: createInfoSelector(['ブランド']),
  }, ...configArr$2, 
  // 部分页面的图片是预览图，不少封面。所以改在 hook 里面，提取图片。
  // {
  //   name: 'cover',
  //   selector: [
  //     {
  //       ...contentIframe,
  //       nextSelector: {
  //         selector: '#guide-head > img',
  //       },
  //     },
  //   ],
  //   category: 'cover',
  // },
  {
      name: '游戏简介',
      selector: {
          selector: '.read-text-area .text-overflow',
      },
      category: 'subject_summary',
  });
  dmmSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
      {
          name: 'subject_nsfw',
          value: '1',
          category: 'checkbox',
      },
  ];

  function isTextPattern(value) {
      return typeof value === 'string' || value instanceof RegExp;
  }
  function toTextPatterns(input) {
      if (!input) {
          return [];
      }
      if (Array.isArray(input)) {
          return input.filter(isTextPattern);
      }
      return isTextPattern(input) ? [input] : [];
  }
  function escapeRegExp$1(text) {
      return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function mergeFlags(patternFlags, extraFlags = '') {
      return Array.from(new Set(`${patternFlags}${extraFlags}`.split(''))).join('');
  }
  function getTextPatternSource(pattern) {
      return pattern instanceof RegExp ? pattern.source : escapeRegExp$1(pattern);
  }
  function toRegExp(pattern, extraFlags = '') {
      if (pattern instanceof RegExp) {
          return new RegExp(pattern.source, mergeFlags(pattern.flags, extraFlags));
      }
      return new RegExp(getTextPatternSource(pattern), extraFlags);
  }
  function replaceTextPatterns(text, patterns, extraFlags = 'g') {
      return patterns.reduce((current, pattern) => {
          return current.replace(toRegExp(pattern, extraFlags), '');
      }, text);
  }
  function matchesTextPatterns(text, patterns, extraFlags = '') {
      return patterns.some((pattern) => toRegExp(pattern, extraFlags).test(text));
  }
  function createStartsWithPattern(text) {
      return new RegExp(`^${escapeRegExp$1(text)}`);
  }

  /**
   * 获取节点文本
   * @param elem
   */
  function getText(elem) {
      if (!elem)
          return '';
      if (elem instanceof HTMLMetaElement) {
          return elem.content;
      }
      if (elem instanceof HTMLInputElement ||
          elem instanceof HTMLTextAreaElement ||
          elem instanceof HTMLSelectElement) {
          return elem.value;
      }
      return elem.textContent || (elem instanceof HTMLElement ? elem.innerText : '') || '';
  }
  function getInnerText(elem) {
      if (!elem)
          return '';
      return elem.innerText || elem.textContent || '';
  }
  /**
   * dollar 选择单个
   * @param {string} selector
   */
  function $q(selector, $parent) {
      return ($parent ?? document).querySelector(selector);
  }
  /**
   * dollar 选择所有元素
   * @param {string} selector
   */
  function $qa(selector, $parent) {
      return ($parent ?? document).querySelectorAll(selector);
  }
  /**
   * 查找包含文本的标签
   * @param {string} selector
   * @param {string} text
   */
  function contains(selector, text, $parent) {
      const elements = Array.from($qa(selector, $parent));
      const patterns = toTextPatterns(text);
      if (!patterns.length) {
          return [];
      }
      return elements.filter((element) => {
          return matchesTextPatterns(getText(element), patterns, 'i');
      });
  }
  function isDocumentNode(node) {
      return !!node && node.nodeType === Node.DOCUMENT_NODE;
  }
  function getIframeContext(selector, $parent) {
      if ($parent instanceof HTMLIFrameElement) {
          return $parent.contentDocument ?? null;
      }
      const $iframe = $parent?.querySelector(selector.selector);
      if ($iframe?.contentDocument) {
          return $iframe.contentDocument;
      }
      if (isDocumentNode($parent)) {
          return $parent;
      }
      return $q(selector.selector, $parent)?.contentDocument ?? null;
  }
  function findElementByKeyWord(selector, $parent) {
      let res = null;
      if ($parent) {
          $parent = $q(selector.selector, $parent);
      }
      else {
          $parent = $q(selector.selector);
      }
      if (!$parent)
          return res;
      const targets = contains(selector.subSelector, selector.keyWord, $parent);
      if (targets && targets.length) {
          let $t = targets[targets.length - 1];
          // 相邻节点
          if (selector.sibling) {
              $t = targets[targets.length - 1].nextElementSibling;
          }
          return $t;
      }
      return res;
  }
  function isElement(element) {
      return element !== null;
  }
  function findElement(selector, $parent) {
      let r = null;
      if (selector) {
          if (selector instanceof Array) {
              let i = 0;
              let targetSelector = selector[i];
              while (targetSelector && !(r = findElement(targetSelector, $parent))) {
                  targetSelector = selector[++i];
              }
          }
          else {
              if (!selector.subSelector) {
                  r = $q(selector.selector, $parent);
              }
              else if (selector.isIframe) {
                  const $iframeDoc = getIframeContext(selector, $parent);
                  r = $iframeDoc?.querySelector(selector.subSelector) ?? null;
              }
              else {
                  r = findElementByKeyWord(selector, $parent);
              }
              if (selector.closest && r) {
                  r = r.closest(selector.closest);
              }
              // recursive
              if (r && selector.nextSelector) {
                  const nextSelector = selector.nextSelector;
                  r = findElement(nextSelector, r);
              }
          }
      }
      return r;
  }
  function findAllElement(selector, $parent) {
      let res = [];
      if (selector instanceof Array) {
          let i = 0;
          let targetSelector = selector[i];
          while (targetSelector) {
              const arr = findAllElement(targetSelector, $parent);
              if (arr.length) {
                  res.push(...arr);
                  break;
              }
              targetSelector = selector[++i];
          }
      }
      else {
          // 没有下一步的选择器
          if (!selector.nextSelector) {
              // 没子选择器
              if (!selector.subSelector) {
                  res = Array.from($qa(selector.selector, $parent));
              }
              else if (selector.isIframe) {
                  const $iframeDoc = getIframeContext(selector, $parent);
                  res = Array.from($iframeDoc?.querySelectorAll(selector.subSelector) ?? []);
              }
              else {
                  $parent = $q(selector.selector, $parent);
                  if (!$parent)
                      return res;
                  res = contains(selector.subSelector, selector.keyWord, $parent);
                  if (selector.sibling) {
                      res = res.map(($t) => $t.nextElementSibling).filter(isElement);
                  }
              }
              // closest
              if (selector.closest) {
                  res = res.map((r) => r.closest(selector.closest)).filter(isElement);
              }
          }
          else {
              // 有下一步的选择器时，selector 是用来定位父节点的
              const localSel = { ...selector };
              delete localSel.nextSelector;
              const parents = findAllElement(localSel, $parent);
              res = parents.flatMap(($p) => findAllElement(selector.nextSelector, $p));
          }
      }
      return res;
  }

  /**
   * 载入 iframe
   * @param $iframe iframe DOM
   * @param src iframe URL
   * @param TIMEOUT time out
   */
  function loadIframe($iframe, src, TIMEOUT = 10000) {
      return new Promise((resolve, reject) => {
          $iframe.src = src;
          const timer = setTimeout(() => {
              $iframe.onload = undefined;
              reject(new Error('iframe timeout'));
          }, TIMEOUT);
          $iframe.onload = () => {
              clearTimeout(timer);
              $iframe.onload = null;
              resolve(undefined);
          };
      });
  }

  /**
   * @param {String} HTML 字符串
   * @return {Element}
   */
  function htmlToElement(html) {
      const template = document.createElement('template');
      html = html.trim();
      template.innerHTML = html;
      const firstElement = template.content.firstElementChild;
      if (!firstElement) {
          throw new Error('htmlToElement requires a root element');
      }
      return firstElement;
  }

  /**
   * 下载内容
   * https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
   * @example
   * download(csvContent, 'dowload.csv', 'text/csv;encoding:utf-8');
   * BOM: data:text/csv;charset=utf-8,\uFEFF
   * @param content 内容
   * @param fileName 文件名
   * @param mimeType 文件类型
   */
  function downloadFile(content, fileName, mimeType = 'application/octet-stream') {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(new Blob(Array.isArray(content) ? content : [content], {
          type: mimeType,
      }));
      a.href = objectUrl;
      a.style.display = 'none';
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
  }

  function normalizeDmmCharacterName(name) {
      return name.replace(/※.*$/, '').trim();
  }
  const dmmNoticeKeywordRe = /更新内容|パッチ|配布中|修正|適用|ダウンロード|バージョン|ver\.?\d|体験版・無料ダウンロード|公式サイト|こちらの商品はVer|update|patch|download|version|apply|fix|notice|※/i;
  function looksLikeDmmNoticeBlock(block) {
      const head = block.trim().slice(0, 300);
      return /^\d{4}\/\d{1,2}\/\d{1,2}/.test(head) || dmmNoticeKeywordRe.test(head);
  }
  function isSummaryDividerLine(line) {
      const trimmed = line.trim();
      return trimmed.length >= 6 && /^[^\p{L}\p{N}]+$/u.test(trimmed);
  }
  function splitSummaryBlocks(summary) {
      const blocks = [];
      let current = [];
      const flush = () => {
          const block = current.join('\n').trim();
          if (block) {
              blocks.push(block);
          }
          current = [];
      };
      for (const line of summary.split('\n')) {
          if (isSummaryDividerLine(line)) {
              flush();
              continue;
          }
          current.push(line);
      }
      flush();
      return blocks;
  }
  function cleanupDmmSubjectSummary(summary) {
      const normalized = summary.trim();
      const head = normalized.slice(0, 300);
      if (!looksLikeDmmNoticeBlock(head)) {
          return normalized;
      }
      const parts = splitSummaryBlocks(normalized);
      if (parts.length <= 1) {
          return normalized;
      }
      for (let i = parts.length - 1; i >= 0; i -= 1) {
          if (!looksLikeDmmNoticeBlock(parts[i])) {
              return parts[i];
          }
      }
      return normalized;
  }
  function getDmmCharacterNameElement($el) {
      return $el.querySelector('.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt');
  }
  function getDmmCharacterSummary($el) {
      return Array.from($el.querySelectorAll('.detailGuide__box-date p'))
          .filter(($p) => !$p.querySelector('.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt'))
          .map(($p) => getInnerText($p).trim())
          .filter(Boolean)
          .join('\n');
  }
  const dmmTools = {
      hooks: {
          async afterGetWikiData(infos) {
              const res = [];
              const hasCover = infos.some((info) => info.category == 'cover');
              for (const info of infos) {
                  let val = info.value;
                  if (info.category === 'subject_summary' && typeof val === 'string') {
                      val = cleanupDmmSubjectSummary(val);
                  }
                  res.push({
                      ...info,
                      value: val,
                  });
              }
              if (!hasCover) {
                  // 使用 slider 里面的第一个图片。slick 初始化前，页面上也会先有静态 li。
                  const slides = Array.from($qa('.image-slider li'));
                  if (slides.length) {
                      let url = '';
                      let dataUrl = '';
                      const targetSlide = slides.find((slide) => slide.dataset.slickIndex === '0') || slides[0];
                      url = targetSlide.querySelector('img')?.getAttribute('src') || '';
                      if (url) {
                          try {
                              dataUrl = await getImageDataByURL(url);
                          }
                          catch (error) {
                              dataUrl = url;
                          }
                          res.push({
                              name: 'cover',
                              category: 'cover',
                              value: {
                                  url,
                                  dataUrl,
                              },
                          });
                      }
                  }
              }
              return res;
          },
      },
      filters: [
          {
              category: 'date',
              dealFunc(str) {
                  const re = /\d{4}\/\d{1,2}(\/\d{1,2})?/;
                  const m = str.match(re);
                  if (m) {
                      return dealDate(m[0]);
                  }
                  return str;
              },
          },
      ],
  };
  const dmmCharaTools = {
      hooks: {
          async afterGetWikiData(infos, model, $el) {
              const res = infos.map((info) => {
                  if (info.category === 'crt_name' && typeof info.value === 'string') {
                      return {
                          ...info,
                          value: normalizeDmmCharacterName(info.value),
                      };
                  }
                  return info;
              });
              const $nameTxt = getDmmCharacterNameElement($el);
              if ($nameTxt) {
                  // （きのみや なのか）
                  const nameTxt = $nameTxt.textContent?.trim() || '';
                  const kanaMatch = nameTxt.match(/（(.*)）/);
                  if (kanaMatch) {
                      res.push({
                          name: '纯假名',
                          value: kanaMatch[1],
                      });
                  }
                  const cvSource = $nameTxt.parentElement?.textContent?.replace(nameTxt, '') || '';
                  const cvMatch = cvSource.match(/CV[：:]\s*([^\n\r]+)/);
                  if (cvMatch) {
                      res.push({
                          name: 'CV',
                          value: cvMatch[1].replace(/\s/g, ''),
                      });
                  }
              }
              const summary = getDmmCharacterSummary($el);
              if (summary) {
                  res.push({
                      name: '人物简介',
                      value: summary,
                      category: 'crt_summary',
                  });
              }
              return res;
          },
      },
  };

  const dmmIntegration = defineSiteIntegration({
      site: dmmSubject,
      tools: dmmTools,
      characters: [
          {
              model: dmmChara,
              tools: dmmCharaTools,
          },
      ],
  });

  const doubanGameSubject = {
      key: 'douban_game',
      description: 'douban game',
      host: ['douban.com', 'www.douban.com'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '#content h1',
          },
      ],
      controlSelector: {
          selector: '#content h1',
      },
      itemList: [],
  };
  const gameAttr$1 = {
      selector: '#content .thing-attr',
      subSelector: 'dt',
      sibling: true,
  };
  doubanGameSubject.itemList.push({
      name: '游戏名',
      selector: {
          selector: '#content h1',
      },
      category: 'subject_title',
  }, {
      name: '发行日期',
      selector: [
          {
              ...gameAttr$1,
              keyWord: '发行日期',
          },
          {
              ...gameAttr$1,
              keyWord: '预计上市时间',
          },
      ],
      category: 'date',
  }, 
  // 平台特殊处理
  // {
  //   name: '平台',
  //   selector: {
  //     ...gameAttr,
  //     keyWord: '平台',
  //   },
  //   category: 'platform',
  // },
  {
      name: '别名',
      selector: {
          ...gameAttr$1,
          keyWord: '别名',
      },
      category: 'alias',
  }, {
      name: '游戏类型',
      selector: {
          ...gameAttr$1,
          keyWord: '类型',
      },
  }, {
      name: '开发',
      selector: {
          ...gameAttr$1,
          keyWord: '开发商',
      },
  }, {
      name: '发行',
      selector: {
          ...gameAttr$1,
          keyWord: '发行商',
      },
  }, 
  // {
  //   name: 'website',
  //   selector: {
  //     selector: '.responsive_apppage_details_left.game_details',
  //   },
  //   category: 'website',
  // },
  {
      name: '游戏简介',
      selector: [
          {
              selector: '.mod.item-desc',
              subSelector: 'h2',
              keyWord: '简介',
              sibling: true,
          },
      ],
      category: 'subject_summary',
  }, {
      name: 'cover',
      selector: {
          selector: '#content .item-subject-info .pic > a',
      },
      category: 'cover',
  });

  const DOUBAN_GAME_PLATFORM_MAP = {
      ARC: 'Arcade',
      NES: 'FC',
      红白机: 'FC',
      街机: 'Arcade',
  };
  const DOUBAN_MUSIC_FIELD_MAP = {
      又名: {
          name: '别名',
          category: 'alias',
      },
      发行时间: {
          name: '发售日期',
          category: 'date',
      },
      介质: {
          name: '版本特性',
      },
      唱片数: {
          name: '碟片数量',
      },
      流派: {
          name: '流派',
      },
      出版者: {
          name: '厂牌',
      },
      表演者: {
          name: '艺术家',
      },
      条形码: {
          name: '条形码',
      },
  };
  function getDoubanModifyUrl() {
      return document.querySelector('.th-modify > a')?.href;
  }
  function splitInfoValues(info, delimiter, valueMap = {}) {
      if (typeof info.value !== 'string') {
          return [{ ...info }];
      }
      return info.value
          .split(delimiter)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((value) => ({
          ...info,
          value: valueMap[value] ?? value,
      }));
  }
  function normalizeSlashDelimitedValue(value) {
      if (typeof value !== 'string') {
          return value;
      }
      const parts = value
          .split('/')
          .map((item) => item.trim())
          .filter(Boolean);
      if (parts.length > 1) {
          return parts.join(', ');
      }
      return value.trim();
  }
  function normalizeCommaDelimitedValue(value) {
      if (typeof value !== 'string') {
          return value;
      }
      return value.replace(/,(?!\s)/g, ', ');
  }
  function hasCoverUrl(value) {
      return (typeof value === 'object' &&
          value !== null &&
          'url' in value &&
          typeof value.url === 'string');
  }
  function getDoubanPlatformLinks() {
      const platformContainer = findElement({
          selector: '#content .game-attr',
          subSelector: 'dt',
          sibling: true,
          keyWord: '平台',
      });
      if (!platformContainer) {
          return [];
      }
      return Array.from(platformContainer.querySelectorAll('a'));
  }
  function getDoubanDescriptionInfos() {
      const result = [];
      const inputList = document.querySelectorAll('input[name="target"][type="hidden"]');
      inputList.forEach(($input) => {
          if ($input.value !== 'description') {
              return;
          }
          const $target = $input
              .closest('form')
              ?.querySelector('.desc-form-item #thing_desc_options_0');
          if ($target) {
              result.push({
                  name: '游戏简介',
                  value: $target.value,
                  category: 'subject_summary',
              });
          }
      });
      return result;
  }
  function getDoubanMusicFieldValue($field) {
      const anchors = Array.from($field.querySelectorAll('a'));
      if (anchors.length) {
          return anchors
              .map((anchor) => anchor.textContent?.trim() ?? '')
              .filter(Boolean)
              .join('、');
      }
      const nextNode = $field.nextSibling;
      if (nextNode?.nodeType === Node.TEXT_NODE) {
          return nextNode.textContent?.trim() ?? '';
      }
      return '';
  }
  function getDoubanMusicTracks() {
      const durationReg = /\s*\d{1,2}:\d{1,2}$/;
      return Array.from(document.querySelectorAll('.track-list ul.track-items > li'))
          .map((item) => {
          const order = Number.parseInt(item.getAttribute('data-track-order') ?? '0', 10);
          const titleRaw = item.textContent?.trim() ?? '';
          const durationMatch = titleRaw.match(durationReg);
          if (durationMatch) {
              return {
                  title: titleRaw.replace(durationReg, '').trim(),
                  duration: durationMatch[0].trim(),
                  order: Number.isNaN(order) ? 0 : order,
              };
          }
          return {
              title: titleRaw,
              order: Number.isNaN(order) ? 0 : order,
          };
      })
          .filter((track) => track.title);
  }
  function groupDoubanTracksByDisc(tracks) {
      const discList = [];
      let currentDisc = [];
      for (const track of tracks) {
          if (track.order === 0) {
              if (currentDisc.length) {
                  discList.push(currentDisc);
                  currentDisc = [];
              }
              continue;
          }
          currentDisc.push(track);
      }
      if (currentDisc.length) {
          discList.push(currentDisc);
      }
      return discList;
  }

  const doubanGameTools = {
      hooks: {
          async beforeCreate() {
              const href = window.location.href;
              if (/\/game\//.test(href) && !/\/game\/\d+\/edit/.test(href)) {
                  const modifyUrl = getDoubanModifyUrl();
                  if (!modifyUrl) {
                      return;
                  }
                  return {
                      payload: {
                          auxSite: {
                              url: modifyUrl,
                              prefs: {
                                  originNames: ['平台', '发行日期'],
                                  targetNames: 'all',
                              },
                          },
                      },
                  };
              }
          },
          async afterGetWikiData(infos) {
              const result = [];
              for (const info of infos) {
                  if (['平台', '别名'].includes(info.name)) {
                      result.push(...splitInfoValues(info, '/'));
                      continue;
                  }
                  if (info.category === 'cover') {
                      result.push({ ...info });
                      continue;
                  }
                  const normalizedValue = normalizeSlashDelimitedValue(info.value);
                  const nextValue = info.name === '游戏类型' && typeof normalizedValue === 'string'
                      ? normalizedValue.replace(/^游戏,\s*/, '').trim()
                      : normalizedValue;
                  result.push({
                      ...info,
                      value: nextValue,
                  });
              }
              for (const link of getDoubanPlatformLinks()) {
                  result.push({
                      name: '平台',
                      value: link.textContent?.replace(/\/.*/, '').trim() ?? '',
                      category: 'platform',
                  });
              }
              return result;
          },
      },
      filters: [],
  };

  const doubanGameIntegration = defineSiteIntegration({
      site: doubanGameSubject,
      tools: doubanGameTools,
  });

  const doubanGameEditSubject = {
      key: 'douban_game_edit',
      description: 'douban game edit',
      host: ['douban.com', 'www.douban.com'],
      urlRules: [/\/game\/\d+\/edit/],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '#content h1',
          },
      ],
      controlSelector: {
          selector: '#content h1',
      },
      itemList: [],
  };
  const gameAttr = {
      selector: '#thing-modify',
      subSelector: '.thing-item .desc-item .label',
      sibling: true,
  };
  doubanGameEditSubject.itemList.push({
      name: '游戏名',
      selector: [
          {
              ...gameAttr,
              keyWord: '原名',
          },
          {
              ...gameAttr,
              keyWord: '中文名',
          },
      ],
      category: 'subject_title',
  }, {
      name: '发行日期',
      selector: [
          {
              ...gameAttr,
              keyWord: '发行日期',
          },
          {
              ...gameAttr,
              keyWord: '预计上市时间',
          },
      ],
      category: 'date',
  }, {
      name: '平台',
      selector: {
          ...gameAttr,
          keyWord: '平台',
      },
      category: 'platform',
  }, {
      name: '中文名',
      selector: {
          ...gameAttr,
          keyWord: '中文名',
      },
      category: 'alias',
  }, {
      name: '别名',
      selector: {
          ...gameAttr,
          keyWord: '别名',
      },
      category: 'alias',
  }, {
      name: '游戏类型',
      selector: {
          ...gameAttr,
          keyWord: '类型',
      },
  }, {
      name: '开发',
      selector: {
          ...gameAttr,
          keyWord: '开发商',
      },
  }, {
      name: '发行',
      selector: {
          ...gameAttr,
          keyWord: '发行商',
      },
  }, 
  // {
  //   name: '游戏简介',
  //   selector: [
  //     {
  //       selector: '#thing_desc_options_0',
  //     },
  //   ],
  //   category: 'subject_summary',
  // },
  {
      name: 'cover',
      selector: {
          ...gameAttr,
          keyWord: '图标',
          nextSelector: {
              selector: 'img',
          },
      },
      category: 'cover',
  });

  const doubanGameEditTools = {
      hooks: {
          async beforeCreate() {
              const href = window.location.href;
              return /\/game\/\d+\/edit/.test(href);
          },
          async afterGetWikiData(infos) {
              const result = [];
              for (const info of infos) {
                  if (['平台', '别名'].includes(info.name)) {
                      result.push(...splitInfoValues(info, ',', DOUBAN_GAME_PLATFORM_MAP));
                      continue;
                  }
                  if (info.category === 'cover' && hasCoverUrl(info.value)) {
                      try {
                          const url = info.value.url.replace('/spic/', '/lpic/');
                          const dataUrl = await getImageDataByURL(url);
                          result.push({
                              ...info,
                              value: {
                                  dataUrl,
                                  url,
                              },
                          });
                      }
                      catch (error) {
                          console.error(error);
                      }
                      continue;
                  }
                  if (info.name === '游戏类型' || info.name === '开发') {
                      result.push({
                          ...info,
                          value: normalizeCommaDelimitedValue(info.value),
                      });
                      continue;
                  }
                  result.push({ ...info });
              }
              result.push(...getDoubanDescriptionInfos());
              return result;
          },
      },
      filters: [],
  };

  const doubanGameEditIntegration = defineSiteIntegration({
      site: doubanGameEditSubject,
      tools: doubanGameEditTools,
  });

  // ref links
  // https://music.douban.com/subject/36072428/
  // https://music.douban.com/subject/34956124/
  const doubanMusicSubject = {
      key: 'douban_music',
      description: 'douban music',
      host: ['music.douban.com'],
      type: SubjectTypeId.music,
      pageSelectors: [
          {
              selector: '#db-nav-music',
          },
      ],
      controlSelector: {
          selector: '#wrapper h1',
      },
      itemList: [],
  };
  doubanMusicSubject.itemList.push({
      name: '音乐名',
      selector: {
          selector: '#wrapper h1',
      },
      category: 'subject_title',
  }, 
  // textNode silbing 暂时不支持
  /*
  {
    name: '发售日期',
    selector: [
      {
        ...attr,
        keyWord: '发行时间',
      },
    ],
    category: 'date',
  },
  {
    name: '艺术家',
    selector: [
      {
        ...attr,
        keyWord: '表演者',
      }
    ]
  },
  {
    name: '流派',
    selector: {
      ...attr,
      keyWord: '流派',
    },
  },
  {
    name: '别名',
    selector: {
      ...attr,
      keyWord: '又名',
    },
    category: 'alias',
  },
  {
    name: '版本特性',
    selector: {
      ...attr,
      keyWord: '介质',
    },
  },
  {
    name: '碟片数量',
    selector: {
      ...attr,
      keyWord: '唱片数',
    },
  },
  {
    name: '厂牌',
    selector: {
      ...attr,
      keyWord: '出版者',
    },
  },
  */
  {
      name: '音乐简介',
      selector: [
          {
              selector: '.related_info',
              subSelector: 'h2',
              keyWord: '简介',
              sibling: true,
          },
      ],
      category: 'subject_summary',
  }, {
      name: 'cover',
      selector: {
          selector: '#mainpic > span > a > img',
      },
      category: 'cover',
  });

  const doubanMusicTools = {
      hooks: {
          async afterGetWikiData(infos) {
              const result = [...infos];
              const $info = document.querySelector('#info');
              if ($info) {
                  $info.querySelectorAll('.pl').forEach(($field) => {
                      const key = $field.textContent?.trim().split(':')[0] ?? '';
                      const target = DOUBAN_MUSIC_FIELD_MAP[key];
                      const value = getDoubanMusicFieldValue($field);
                      if (!target || !value) {
                          return;
                      }
                      result.push({
                          ...target,
                          value,
                      });
                  });
              }
              const discCountValue = result.find((item) => item.name === '碟片数量')?.value;
              const discCount = Number.parseInt(String(discCountValue ?? '1'), 10) || 1;
              const discList = groupDoubanTracksByDisc(getDoubanMusicTracks());
              if (discList.length && discList.length === discCount) {
                  result.push({
                      category: 'ep',
                      name: '',
                      value: discList,
                  });
              }
              else {
                  console.warn('碟片数量不匹配', discCount, discList);
              }
              return result;
          },
      },
      filters: [],
  };

  const doubanMusicIntegration = defineSiteIntegration({
      site: doubanMusicSubject,
      tools: doubanMusicTools,
  });

  const erogamescapeSubject = {
      key: 'erogamescape',
      description: 'erogamescape',
      host: ['erogamescape.org', 'erogamescape.dyndns.org'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '#soft-title',
          },
      ],
      controlSelector: {
          selector: '#soft-title',
      },
      itemList: [],
  };
  erogamescapeSubject.itemList.push({
      name: '游戏名',
      selector: {
          selector: '#soft-title > span',
      },
      category: 'subject_title',
  }, {
      name: '开发',
      selector: {
          selector: '#brand a',
      },
  }, {
      name: '发行日期',
      selector: {
          selector: '#sellday a',
      },
      category: 'date',
  }, {
      name: 'cover',
      selector: {
          selector: '#image_and_basic_infomation img',
      },
      category: 'cover',
  }, {
      name: 'website',
      selector: [
          {
              selector: '#links',
              subSelector: 'a',
              keyWord: 'game_OHP',
          },
          {
              selector: '#bottom_inter_links_main',
              subSelector: 'a',
              keyWord: 'game_OHP',
          },
      ],
      category: 'website',
  }, {
      name: '原画',
      selector: {
          selector: '#genga > td:last-child',
      },
  }, {
      name: '剧本',
      selector: {
          selector: '#shinario > td:last-child',
      },
  }, {
      name: '歌手',
      selector: {
          selector: '#kasyu > td:last-child',
      },
  });
  erogamescapeSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
      {
          name: 'subject_nsfw',
          value: '1',
          category: 'checkbox',
      },
  ];

  var ErogamescapeCategory;
  (function (ErogamescapeCategory) {
      ErogamescapeCategory["game"] = "game";
      ErogamescapeCategory["brand"] = "brand";
      ErogamescapeCategory["creater"] = "creater";
      ErogamescapeCategory["music"] = "music";
      ErogamescapeCategory["pov"] = "pov";
      ErogamescapeCategory["character"] = "character";
  })(ErogamescapeCategory || (ErogamescapeCategory = {}));
  const erogamescapeTools = {
      hooks: {
          async beforeCreate() {
              const $el = findElement([
                  {
                      selector: '#links',
                      subSelector: 'a',
                      keyWord: 'Getchu.com',
                  },
                  {
                      selector: '#bottom_inter_links_main',
                      subSelector: 'a',
                      keyWord: 'Getchu.com',
                  },
              ]);
              const softQuery = $el?.getAttribute('href')?.match(/\?id=\d+$/);
              if (softQuery) {
                  return {
                      payload: {
                          auxSite: {
                              url: `http://www.getchu.com/soft.phtml${softQuery[0]}`,
                              opts: {
                                  cookie: 'getchu_adalt_flag=getchu.com',
                                  decode: 'EUC-JP',
                              },
                              prefs: {
                                  originNames: ['游戏名'],
                                  targetNames: ['cover'],
                              },
                          },
                      },
                  };
              }
              return true;
          },
      },
      filters: [],
  };

  const erogamescapeIntegration = defineSiteIntegration({
      site: erogamescapeSubject,
      tools: erogamescapeTools,
  });

  const getchuChara = {
      key: 'getchu_game_chara',
      siteKey: 'getchu_game',
      description: 'Getchu 游戏角色',
      host: ['getchu.com', 'www.getchu.com'],
      controlMode: 'inline',
      type: SubjectTypeId.game,
      itemSelector: {
          selector: '.chara-text .chara-name',
      },
      presenceSelector: {
          selector: '#wrapper',
          subSelector: '.tabletitle',
          sibling: true,
          keyWord: ['キャラクター', '角色'],
      },
      itemList: [],
  };

  const getchuSubject = {
      key: 'getchu_game',
      description: 'Getchu游戏',
      host: ['getchu.com', 'www.getchu.com'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '.genretab.current',
              subSelector: 'a',
              keyWord: ['ゲーム', '同人'],
          },
      ],
      controlSelector: [
          {
              selector: '#soft-title',
          },
      ],
      itemList: [],
  };
  const commonSelector$1 = {
      selector: '#soft_table table',
      subSelector: 'td',
      sibling: true,
  };
  const dict = {
      定価: '售价',
      発売日: '发行日期',
      ジャンル: '游戏类型',
      ブランド: '开发',
      原画: '原画',
      音楽: '音乐',
      シナリオ: '剧本',
      アーティスト: '主题歌演出',
      作詞: '主题歌作词',
      作曲: '主题歌作曲',
  };
  const configArr$1 = Object.keys(dict).map((key) => {
      const r = {
          name: dict[key],
          selector: {
              // 匹配关键字开头 2020/03/18
              keyWord: createStartsWithPattern(key),
              ...commonSelector$1,
          },
      };
      if (key === '発売日') {
          r.category = 'date';
      }
      return r;
  });
  getchuSubject.itemList.push({
      name: '游戏名',
      selector: {
          selector: '#soft-title',
      },
      category: 'subject_title',
  }, {
      name: 'cover',
      selector: [
          {
              selector: '#soft_table .highslide',
          },
          {
              selector: '#soft_table .highslide img',
          },
      ],
      category: 'cover',
  }, ...configArr$1, {
      name: '游戏简介',
      selector: [
          {
              selector: '#wrapper',
              subSelector: '.tabletitle',
              sibling: true,
              keyWord: 'ストーリー',
          },
          {
              selector: '#wrapper',
              subSelector: '.tabletitle',
              sibling: true,
              keyWord: ['作品紹介', 'あらすじ'],
          },
          {
              selector: '#wrapper',
              subSelector: '.tabletitle',
              sibling: true,
              keyWord: '商品紹介',
          },
      ],
      category: 'subject_summary',
  });
  getchuSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
      {
          name: 'subject_nsfw',
          value: '1',
          category: 'checkbox',
      },
  ];

  const GETCHU_CHARA_NAME_SELECTOR = '.chara-name';
  const getchuCharacterInfoNameDict = {
      誕生日: '生日',
      '3サイズ': 'BWH',
      スリーサイズ: 'BWH',
      身長: '身高',
      血液型: '血型',
  };
  function getCharacterNameElement($t) {
      if ($t.matches(GETCHU_CHARA_NAME_SELECTOR)) {
          return $t;
      }
      return $t.closest('dt')?.querySelector(GETCHU_CHARA_NAME_SELECTOR) ?? null;
  }
  function normalizeCharacterName(rawName) {
      return rawName.split(/（|\(|\sCV|新建角色/)[0];
  }
  const getchuTools = {
      dealTitle(str = '') {
          str = str.trim().split('\n')[0];
          str = str
              .split('＋')[0]
              .replace(/（このタイトルの関連商品）/, '')
              .trim();
          return str.replace(/\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし).*?$|＜.*＞$/g, '');
      },
      getExtraCharaInfo(txt) {
          const re = /[^\s]+?[:：]/g;
          const matchedArr = txt.match(re);
          if (!matchedArr)
              return [];
          const infoArr = txt.split(re);
          const res = [];
          matchedArr.forEach((item, idx) => {
              const val = (infoArr[idx + 1] || '').trim();
              if (val) {
                  res.push({
                      name: item.replace(/:|：/, ''),
                      value: val,
                  });
              }
          });
          return res;
      },
      getCharacterInfo($t) {
          const charaData = [];
          const $name = getCharacterNameElement($t);
          if (!$name)
              return charaData;
          const $dt = $name.closest('dt');
          if (!$dt)
              return charaData;
          let name;
          if ($name.querySelector('charalist')) {
              const $charalist = $name.querySelector('charalist');
              name = getText($charalist);
          }
          else {
              if ($name.classList.contains('chara-name') && $name.querySelector('br')) {
                  const brText = $name.querySelector('br')?.nextSibling?.textContent || getText($name);
                  name = normalizeCharacterName(brText);
              }
              else {
                  name = normalizeCharacterName(getText($name));
              }
          }
          charaData.push({
              name: '姓名',
              value: name.replace(/\s/g, ''),
              category: 'crt_name',
          });
          charaData.push({
              name: '日文名',
              value: name,
          });
          const nameTxt = getText($name);
          const kanaMatch = nameTxt.match(/（(.+?)）/);
          if (kanaMatch) {
              charaData.push({
                  name: '纯假名',
                  value: kanaMatch[1],
              });
          }
          const cvMatch = nameTxt.match(/CV[：:]\s*(.+)$/);
          if (cvMatch) {
              charaData.push({
                  name: 'CV',
                  value: cvMatch[1].replace(/\s/g, ''),
              });
          }
          const $img = $t.closest('tr')?.querySelector('td > img');
          if ($img) {
              charaData.push({
                  name: 'cover',
                  value: convertImgToBase64($img),
                  category: 'crt_cover',
              });
          }
          // 处理杂项 参考 id=1074002 id=735329 id=1080370
          // id=1080431
          // id=840936
          // dd tag
          const $dd = $dt.nextElementSibling;
          if (!$dd) {
              return charaData;
          }
          const $clonedDd = $dd.cloneNode(true);
          Array.prototype.forEach.call($clonedDd.querySelectorAll('span[style^="font-weight"]'), (node) => {
              const t = getText(node).trim();
              t.split(/\n/g).forEach((el) => {
                  const extraInfo = getchuTools.getExtraCharaInfo(el);
                  if (extraInfo.length) {
                      charaData.push(...extraInfo);
                  }
                  else {
                      const c = el.match(/B.*W.*H\d+/);
                      if (c) {
                          charaData.push({
                              name: 'BWH',
                              value: c[0],
                          });
                      }
                  }
              });
              node.remove();
          });
          charaData.push({
              name: '人物简介',
              value: getText($clonedDd).trim(),
              category: 'crt_summary',
          });
          charaData.forEach((item) => {
              if (getchuCharacterInfoNameDict[item.name]) {
                  item.name = getchuCharacterInfoNameDict[item.name];
              }
          });
          return charaData;
      },
  };
  const getchuCharaTools = {
      hooks: {
          async afterGetWikiData(infos, _model, $el) {
              return [...infos, ...getchuTools.getCharacterInfo($el)];
          },
      },
  };
  const getchuSubjectTools = {
      hooks: {
          async beforeCreate() {
              const $t = document.querySelector('#soft-title');
              if (!$t)
                  return false;
              const rawTitle = $t.textContent.trim();
              if (/［同人グッズ|同人誌|同人音楽］/.test(rawTitle))
                  return false;
              return true;
          },
      },
      filters: [
          {
              category: 'subject_title',
              dealFunc: getchuTools.dealTitle,
          },
      ],
  };

  const getchuIntegration = defineSiteIntegration({
      site: getchuSubject,
      tools: getchuSubjectTools,
      characters: [
          {
              model: getchuChara,
              tools: getchuCharaTools,
          },
      ],
  });

  const jdBookSubject = {
      key: 'jd_book',
      host: ['item.jd.com'],
      description: '京东图书',
      type: SubjectTypeId.book,
      pageSelectors: [
          {
              selector: '#crumb-wrap',
              subSelector: '.item > a',
              keyWord: '图书',
          },
      ],
      controlSelector: {
          selector: '#name .sku-name',
      },
      itemList: [],
  };
  const descSelector = {
      selector: '#parameter2',
      subSelector: 'li',
  };
  jdBookSubject.itemList.push({
      name: '名称',
      selector: {
          selector: '#name .sku-name',
      },
      category: 'subject_title',
  }, 
  // {
  //   name: 'cover',
  //   selector: {
  //     selector: '#preview img',
  //   },
  //   category: 'cover',
  // },
  {
      name: 'ISBN',
      selector: {
          ...descSelector,
          keyWord: 'ISBN',
      },
      category: 'ISBN',
  }, {
      name: '发售日',
      selector: {
          ...descSelector,
          keyWord: '出版时间',
      },
      category: 'date',
  }, {
      name: '作者',
      selector: [
          {
              selector: '#p-author',
              keyWord: '著',
          },
      ],
  }, {
      name: '出版社',
      selector: {
          ...descSelector,
          keyWord: '出版社',
      },
  }, {
      name: '内容简介',
      selector: [
          {
              selector: '.book-detail-item',
              subSelector: '.item-mt',
              keyWord: '内容简介',
              sibling: true,
          },
      ],
      category: 'subject_summary',
  });

  const jdBookTools = {
      filters: [
          {
              category: 'subject_title',
              dealFunc(str) {
                  return trimParenthesis$1(str);
              },
          },
      ],
  };

  const jdBookIntegration = defineSiteIntegration({
      site: jdBookSubject,
      tools: jdBookTools,
  });

  const moepediaSubject = {
      key: 'moepedia',
      description: 'moepedia.net',
      host: ['moepedia.net'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '.gme-Contents > .gme-Body',
          },
      ],
      controlSelector: [
          {
              selector: '.body-top_info_title > h2',
          },
      ],
      itemList: [],
  };
  const topTableSelector = {
      selector: 'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > table',
      subSelector: 'tr > th',
      sibling: true,
  };
  const middleTableSelector = {
      selector: 'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-middle',
      subSelector: 'tr > th',
      sibling: true,
  };
  moepediaSubject.itemList.push({
      name: '游戏名',
      selector: {
          selector: 'div.gme-Contents h2',
      },
      category: 'subject_title',
  }, {
      name: '发行日期',
      selector: [
          {
              ...topTableSelector,
              keyWord: '発売日',
          },
      ],
      pipes: ['date'],
      category: 'date',
  }, {
      name: '售价',
      selector: [
          {
              ...topTableSelector,
              keyWord: '価格',
          },
      ],
      pipes: ['p'],
  }, {
      name: 'website',
      selector: [
          {
              selector: 'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > div > a',
          },
      ],
      category: 'website',
  }, {
      name: 'cover',
      selector: [
          {
              selector: 'div.gme-Contents div.body-top > div.body-top_image img',
          },
      ],
      category: 'cover',
  }, {
      name: '原画',
      selector: {
          ...middleTableSelector,
          keyWord: ['原画'],
      },
  }, {
      name: '开发',
      selector: {
          ...middleTableSelector,
          keyWord: ['ブランド'],
      },
  }, {
      name: '剧本',
      selector: {
          ...middleTableSelector,
          keyWord: ['シナリオ'],
      },
  }, {
      name: '游戏类型',
      selector: {
          ...middleTableSelector,
          keyWord: ['ジャンル'],
      },
  }, {
      name: '音乐',
      selector: {
          ...middleTableSelector,
          keyWord: ['音楽'],
      },
  }, {
      name: '主题歌演唱',
      selector: {
          ...middleTableSelector,
          keyWord: ['歌手'],
      },
  });
  moepediaSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
      {
          name: 'subject_nsfw',
          value: '1',
          category: 'checkbox',
      },
  ];

  function dealTitle(str) {
      str = str.trim().split('\n')[0];
      return str.replace(/\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし|パッケージ版).*?$|＜.*＞$/g, '');
  }
  const moepediaTools = {
      hooks: {
          async beforeCreate() {
              const $el = findElement([
                  {
                      selector: '.body-shop_list > .body-shop_item > a[href*="www.getchu.com/soft.phtml?id="]',
                  },
              ]);
              const url = $el?.getAttribute('href');
              if (url) {
                  return {
                      payload: {
                          auxSite: {
                              url,
                              opts: {
                                  cookie: 'getchu_adalt_flag=getchu.com',
                                  decode: 'EUC-JP',
                              },
                              prefs: {
                                  originNames: ['游戏名'],
                                  targetNames: ['游戏简介'],
                              },
                          },
                      },
                  };
              }
              return true;
          },
          async afterGetWikiData(infos) {
              const res = [];
              for (const info of infos) {
                  if (info.category === 'cover') {
                      res.push({ ...info });
                      continue;
                  }
                  let val = getStringValue(info.value);
                  if (info.name === '游戏名') {
                      val = dealTitle(val);
                  }
                  else if (['原画', '剧本', '音乐', '主题歌演唱', '游戏类型'].includes(info.name)) {
                      val = val.replace(/\n\s*/g, ', ');
                  }
                  else if (info.name === '售价') {
                      val = val.replace(/.*¥/, '¥');
                  }
                  res.push({
                      ...info,
                      value: val,
                  });
              }
              return res;
          },
      },
  };

  const moepediaIntegration = defineSiteIntegration({
      site: moepediaSubject,
      tools: moepediaTools,
  });

  const steamSubject = {
      key: 'steam_game',
      description: 'steam',
      host: ['store.steampowered.com'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '.apphub_AppName',
          },
      ],
      controlSelector: {
          selector: '.apphub_AppName',
      },
      itemList: [],
  };
  steamSubject.itemList.push({
      name: '游戏名',
      selector: {
          selector: '.apphub_AppName',
      },
      category: 'subject_title',
  }, {
      name: '发行日期',
      selector: {
          selector: '.release_date .date',
      },
      category: 'date',
  }, {
      name: '开发',
      selector: {
          selector: '.glance_ctn_responsive_left .user_reviews',
          subSelector: '.dev_row .subtitle',
          keyWord: ['开发商', 'DEVELOPER'],
          sibling: true,
      },
  }, {
      name: '发行',
      selector: {
          selector: '.glance_ctn_responsive_left .user_reviews',
          subSelector: '.dev_row .subtitle',
          keyWord: ['发行商', 'PUBLISHER'],
          sibling: true,
      },
  }, {
      name: 'website',
      selector: {
          selector: '.responsive_apppage_details_left.game_details',
          subSelector: '.details_block > .linkbar',
          keyWord: ['访问网站', 'Visit the website'],
      },
      category: 'website',
  }, {
      name: '游戏简介',
      selector: [
          {
              selector: '.game_description_snippet',
          },
          {
              selector: 'head meta[name="description"]',
          },
          {
              selector: '#game_area_description',
          },
      ],
      category: 'subject_summary',
  });
  steamSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
  ];

  const steamTools = {
      hooks: {
          async beforeCreate() {
              return {
                  payload: {
                      disableDate: true,
                  },
              };
          },
          async afterGetWikiData(infos) {
              const res = [];
              for (const info of infos) {
                  const newInfo = { ...info };
                  if (info.name === 'website') {
                      const arr = getStringValue(newInfo.value).split('?url=');
                      newInfo.value = arr[1] || '';
                      newInfo.category = 'website,listItem';
                  }
                  res.push({
                      ...newInfo,
                  });
              }
              if (location.hostname === 'store.steampowered.com') {
                  res.push({
                      name: '链接',
                      value: `Steam|${location.origin + location.pathname}`,
                      category: 'listItem',
                  });
              }
              return res;
          },
      },
      filters: [
          {
              category: 'date',
              dealFunc(str) {
                  if (/年/.test(str)) {
                      return dealDate(str.replace(/\s/g, ''));
                  }
                  return formatDate(str);
              },
          },
      ],
  };

  const steamIntegration = defineSiteIntegration({
      site: steamSubject,
      tools: steamTools,
  });

  const steamdbSubject = {
      key: 'steamdb_game',
      description: 'steamdb',
      host: ['steamdb.info'],
      type: SubjectTypeId.game,
      pageSelectors: [
          {
              selector: '.pagehead h1',
          },
      ],
      controlSelector: {
          selector: '.pagehead',
      },
      itemList: [],
  };
  const commonSelector = {
      selector: '.scope-app .app-row table',
      subSelector: 'td',
      sibling: true,
  };
  const dictArr = [
      {
          name: '发行日期',
          keyWord: 'Release Date',
      },
      {
          name: '开发',
          keyWord: 'Developer',
      },
      {
          name: '发行',
          keyWord: 'Publisher',
      },
      {
          name: '游戏引擎',
          keyWord: 'Technologies',
      }
  ];
  const configArr = dictArr.map((item) => {
      const r = {
          name: item.name,
          selector: {
              keyWord: item.keyWord,
              ...commonSelector,
          },
      };
      if (item.name === '发行日期') {
          r.category = 'date';
      }
      return r;
  });
  const detailsTableSelector = {
      selector: '#info table',
      subSelector: 'td',
      sibling: true,
  };
  const subTableSelector = {
      selector: 'table.web-assets',
      subSelector: 'td',
      sibling: true,
  };
  const assetsTableSelector = {
      selector: '#js-assets-table',
      subSelector: 'td',
      sibling: true,
  };
  steamdbSubject.itemList.push({
      name: '游戏名',
      selector: [
          // 默认使用日文名称，当条目名称
          {
              ...detailsTableSelector,
              keyWord: 'name_localized',
              nextSelector: {
                  ...subTableSelector,
                  keyWord: 'japanese',
              },
          },
          {
              selector: '.pagehead h1',
          },
      ],
      category: 'subject_title',
  }, {
      name: '中文名',
      selector: [
          {
              ...detailsTableSelector,
              keyWord: 'name_localized',
              nextSelector: {
                  ...subTableSelector,
                  keyWord: 'schinese',
              },
          },
          {
              ...detailsTableSelector,
              keyWord: 'name_localized',
              nextSelector: {
                  ...subTableSelector,
                  keyWord: 'tchinese',
              },
          },
      ],
      category: 'alias',
  }, {
      name: '游戏类型',
      selector: [
          {
              ...detailsTableSelector,
              keyWord: 'Primary Genre',
          }
      ],
      pipes: ['ta', 'p'],
  }, {
      name: 'cover',
      selector: [
          {
              ...assetsTableSelector,
              keyWord: 'library_assets',
              nextSelector: {
                  selector: 'table.web-assets',
                  subSelector: 'td',
                  keyWord: 'library_capsule',
                  sibling: true,
                  nextSelector: {
                      selector: 'a',
                  },
              },
          },
          {
              ...assetsTableSelector,
              keyWord: 'Web Assets',
              nextSelector: {
                  selector: 'table.web-assets',
                  subSelector: 'td > a',
                  keyWord: 'library_600x900',
              },
          },
      ],
      category: 'cover',
  }, ...configArr, {
      name: '游戏简介',
      selector: [
          {
              selector: '.scope-app .header-description',
          },
          {
              selector: 'head meta[name="description"]',
          },
      ],
      category: 'subject_summary',
  });
  steamdbSubject.defaultInfos = [
      {
          name: '平台',
          value: 'PC',
          category: 'platform',
      },
  ];

  const steamdbTools = {
      hooks: {
          async beforeCreate() {
              return {
                  payload: {
                      disableDate: true,
                  },
              };
          },
          async afterGetWikiData(infos) {
              const res = [];
              for (const info of infos) {
                  let newInfo = { ...info };
                  const stringValue = getStringValue(info.value);
                  if (info.name === '游戏引擎') {
                      newInfo.value = stringValue.replace(/^Engine\./g, '');
                  }
                  if (info.name === '游戏简介') {
                      if (stringValue.match(/\n.*?Steam charts, data, update history\.$/)) {
                          newInfo.value = stringValue.split('\n')[0];
                      }
                  }
                  if (info.name === 'cover') {
                      const coverValue = getCoverValue(info.value);
                      if (coverValue?.url) {
                          const a = coverValue.url;
                          const h = a.lastIndexOf('?');
                          const m = a.substring((h === -1 ? a.length : h) - 4);
                          const scaleUrl = a.substring(0, a.length - m.length) + '_2x' + m;
                          let dataUrl = '';
                          try {
                              dataUrl = await getImageDataByURL(scaleUrl);
                          }
                          catch (error) { }
                          if (dataUrl) {
                              newInfo.value = {
                                  url: scaleUrl,
                                  dataUrl,
                              };
                          }
                      }
                  }
                  if (newInfo) {
                      res.push({
                          ...newInfo,
                      });
                  }
              }
              const $appInstall = document.querySelector('#js-app-install');
              const appId = $appInstall?.href.match(/steam:\/\/(?:install|launch)\/(\d+)/)?.[1];
              if (appId) {
                  res.push({
                      name: '链接',
                      value: `Steam|https://store.steampowered.com/app/${appId}`,
                      category: 'listItem',
                  });
              }
              [...document.querySelectorAll('#info > table > tbody > tr > td.span3')].forEach((item) => {
                  const sibling = item.nextElementSibling;
                  if (sibling.innerHTML.includes('General Mature Content')) {
                      res.push({
                          name: 'subject_nsfw',
                          value: '1',
                          category: 'checkbox',
                      });
                      return;
                  }
                  if (item.innerHTML.includes('name_localized')) {
                      const names = [...sibling.querySelectorAll('table > tbody > tr')].map((tr) => {
                          const name = tr.querySelector('td:nth-child(1)').textContent.trim();
                          const value = tr.querySelector('td:nth-child(2)').textContent.trim();
                          return {
                              name,
                              value,
                          };
                      });
                      const gameName = res.find((info) => info.name === '游戏名');
                      const enName = names.find((name) => name.name === 'english');
                      const jpName = names.find((name) => name.name === 'japanese');
                      if (enName && gameName) {
                          if (getStringValue(gameName.value) !== enName.value) {
                              res.push({
                                  name: '别名',
                                  value: `英文|${enName.value}`,
                              });
                          }
                      }
                      if (jpName && gameName) {
                          if (getStringValue(gameName.value) !== jpName.value) {
                              res.push({
                                  name: '别名',
                                  value: `日文|${jpName.value}`,
                              });
                          }
                      }
                      const tchName = names.find((name) => name.name === 'tchinese');
                      if (tchName) {
                          res.push({
                              name: '别名',
                              value: `繁中|${tchName.value}`,
                          });
                      }
                  }
              });
              return res;
          },
      },
      filters: [
          {
              category: 'date',
              dealFunc(str) {
                  const arr = str.split('–');
                  if (!arr[0])
                      return '';
                  return formatDate(arr[0].trim());
              },
          },
      ],
  };

  const steamdbIntegration = defineSiteIntegration({
      site: steamdbSubject,
      tools: steamdbTools,
  });

  // ref links
  // https://vgmdb.net/artist/1
  // https://vgmdb.net/artist/2
  // https://vgmdb.net/artist/3
  // 左栏资料行形如 <b>Birthdate</b><br>Mar 18, 1977；关键字命中 <b> 后回到整行
  function rowSelector(keyWord) {
      return {
          selector: '#leftfloat',
          subSelector: 'div > b',
          keyWord,
          closest: 'div',
      };
  }
  const vgmdbArtist = {
      key: 'vgmdb_artist',
      description: 'VGMdb 艺术家',
      host: ['vgmdb.net'],
      urlRules: [/vgmdb\.net\/artist\/\d+/],
      pageSelectors: {
          selector: '#innermain',
          nextSelector: { selector: '#leftfloat' },
      },
      controlSelector: {
          selector: '#innermain > span[style*="1.5em"]',
      },
      role: 1,
      professions: ['artist'],
      // 多值行（Aliases、Variations、Organizations）与姓名、简介、外链在 personTools 的 hook 里处理。
      // 自由文本行只剥掉行首标签（k）和空白（t），默认管道会误删括号与冒号前的内容。
      itemList: [
          {
              name: '生日',
              selector: rowSelector('Birthdate'),
              category: 'date',
          },
          {
              name: '血型',
              selector: rowSelector('Bloodtype'),
              pipes: ['k', 't'],
          },
          {
              name: '出生地',
              selector: rowSelector('Birthplace'),
              pipes: ['k', 't'],
          },
          {
              name: '毕业院校',
              selector: rowSelector('Education'),
              pipes: ['k', 't'],
          },
          {
              name: '肖像',
              selector: { selector: '#leftfloat a.highslide' },
              category: 'crt_cover',
          },
      ],
  };

  // ref links
  // https://vgmdb.net/org/1
  const vgmdbOrg = {
      key: 'vgmdb_org',
      description: 'VGMdb 组织',
      host: ['vgmdb.net'],
      urlRules: [/vgmdb\.net\/org\/\d+/],
      pageSelectors: {
          selector: 'dl',
          nextSelector: { selector: 'dt.label' },
      },
      controlSelector: {
          selector: 'h1[style*="display: inline"]',
      },
      role: 2,
      professions: ['producer'],
      // 名称、人物类型（按 Type 判断）与外链在 personTools 的 hook 里处理
      itemList: [
          {
              name: '人物简介',
              selector: {
                  selector: 'dl',
                  subSelector: 'dt',
                  keyWord: 'Description',
                  sibling: true,
              },
              category: 'crt_summary',
          },
          {
              name: '肖像',
              selector: { selector: 'a.highslide' },
              category: 'crt_cover',
          },
      ],
  };

  const MONTHS = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12,
  };
  // VGMdb 只给出已知的部分（可能缺年或缺月日），按 Bangumi 惯用的 年月日 写法输出
  function formatBangumiBirthday(raw) {
      const text = raw.trim();
      let m = text.match(/^([A-Z][a-z]{2})[a-z]*\s+(\d{1,2}),\s*(\d{4})$/);
      if (m && MONTHS[m[1]]) {
          return `${m[3]}年${MONTHS[m[1]]}月${Number(m[2])}日`;
      }
      m = text.match(/^([A-Z][a-z]{2})[a-z]*\s+(\d{4})$/);
      if (m && MONTHS[m[1]]) {
          return `${m[2]}年${MONTHS[m[1]]}月`;
      }
      m = text.match(/^([A-Z][a-z]{2})[a-z]*\s+(\d{1,2})$/);
      if (m && MONTHS[m[1]]) {
          return `${MONTHS[m[1]]}月${Number(m[2])}日`;
      }
      m = text.match(/^(\d{4})$/);
      if (m) {
          return `${m[1]}年`;
      }
      m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m) {
          return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
      }
      return text;
  }
  const JAPANESE_CHARS = /[぀-ヿ㐀-䶿一-鿿]/;
  // "折戸 伸治 (おりと しんじ)" → 姓名去空格，假名原样；不含日文字符的一律当作没有日文名
  function parseJapaneseName(raw) {
      const text = raw.replace(/ /g, ' ').trim();
      if (!text || !JAPANESE_CHARS.test(text)) {
          return { name: '', kana: '' };
      }
      const m = text.match(/^(.+?)\s*[（(]\s*(.+?)\s*[)）]\s*$/);
      const name = (m ? m[1] : text).replace(/\s+/g, '');
      const kana = m ? m[2].trim() : '';
      return { name, kana };
  }
  // Bangumi 的罗马字是姓在前；VGMdb 显示名是名在前，两个词时对调
  function toBangumiRomaji(displayName, hasJapaneseName) {
      const text = displayName.trim();
      const parts = text.split(/\s+/);
      if (parts.length === 2) {
          return `${parts[1]} ${parts[0]}`;
      }
      return text;
  }
  // person/new 的人物类型：同人社团、乐队组合算「组合」，其余按「公司」
  function resolveOrgRole(type) {
      if (/doujin|circle|unit|group|band/i.test(type)) {
          return 3;
      }
      return 2;
  }
  // VGMdb 外链形如 /redirect/<n>/<目标地址>，目标地址可能不带协议
  function cleanRedirectUrl(href) {
      let url = href.replace(/^(?:https?:\/\/(?:www\.)?vgmdb\.net)?\/redirect\/\d+\//, '');
      if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
      }
      return url;
  }
  function cleanText(text) {
      return (text ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  }
  function isHidden(el) {
      const style = el.getAttribute('style') ?? '';
      return /display\s*:\s*none/i.test(style);
  }
  // 链接文字优先取可见的英文名 span；没有的话只收可见文本，避免把隐藏的日文变体一起带出来
  function readLabel(el) {
      const visible = el.querySelector('span[lang="en"]');
      return cleanText(visible ? visible.textContent : textWithLineBreaks(el));
  }
  // 读取 <b>标签</b><br>值 这类信息行里的所有值：按 <br> 切分文本，链接与子块各算一条
  function readRowValues(row) {
      const values = [];
      let buffer = '';
      const flush = () => {
          const value = cleanText(buffer);
          if (value)
              values.push(value);
          buffer = '';
      };
      const walk = (node) => {
          if (node.nodeType === 3) {
              buffer += node.textContent ?? '';
              return;
          }
          if (node.nodeType !== 1)
              return;
          const el = node;
          const tag = el.tagName;
          if (tag === 'B' || tag === 'IMG' || tag === 'EM' || isHidden(el))
              return;
          if (tag === 'BR') {
              flush();
              return;
          }
          if (tag === 'A' || tag === 'DIV') {
              flush();
              const label = readLabel(el);
              if (label)
                  values.push(label);
              return;
          }
          el.childNodes.forEach(walk);
      };
      row.childNodes.forEach(walk);
      flush();
      return values;
  }
  function findRow(root, label) {
      return Array.from(root.querySelectorAll('#leftfloat > div')).find((div) => {
          const b = div.querySelector('b');
          return !!b && b.parentElement === div && cleanText(b.textContent) === label;
      });
  }
  function textWithLineBreaks(el) {
      let out = '';
      const walk = (node) => {
          if (node.nodeType === 3) {
              out += node.textContent ?? '';
              return;
          }
          if (node.nodeType !== 1)
              return;
          const child = node;
          if (isHidden(child))
              return;
          if (child.tagName === 'BR') {
              out += '\n';
              return;
          }
          child.childNodes.forEach(walk);
      };
      el.childNodes.forEach(walk);
      return out.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim();
  }
  function readNotes(root) {
      const heading = Array.from(root.querySelectorAll('#rightfloat h3')).find((h3) => cleanText(h3.textContent) === 'Notes');
      const body = heading?.parentElement?.nextElementSibling?.querySelector('.smallfont');
      if (!body)
          return '';
      const text = textWithLineBreaks(body);
      if (/^No notes available/i.test(text))
          return '';
      return text;
  }
  const LINK_GROUPS_KEPT = new Set(['Official', 'Personal']);
  // Official 组第一条进官方网站，其余 Official 与 Personal 进链接块；X 统一写成 [X|url]
  function collectLinkInfos(root) {
      const res = [];
      let officialDone = false;
      for (const label of Array.from(root.querySelectorAll('b.label'))) {
          const group = cleanText(label.textContent);
          if (!LINK_GROUPS_KEPT.has(group))
              continue;
          const container = label.parentElement;
          if (!container)
              continue;
          for (const anchor of Array.from(container.querySelectorAll('span.link_doc a[rel="nofollow"]'))) {
              const href = anchor.getAttribute('href');
              if (!href)
                  continue;
              const url = cleanRedirectUrl(href);
              if (/web\.archive\.org/i.test(url))
                  continue;
              const text = cleanText(anchor.textContent);
              if (/^https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\//i.test(url)) {
                  res.push({ name: '链接', value: `X|${url}`, category: 'listItem' });
                  continue;
              }
              if (group === 'Official' && !officialDone) {
                  officialDone = true;
                  res.push({ name: '官方网站', value: url });
                  continue;
              }
              res.push({
                  name: '链接',
                  value: `${text || url}|${url}`,
                  category: 'listItem',
              });
          }
      }
      return res;
  }
  function collectArtistInfos(root) {
      const res = [];
      const displayName = cleanText(root.querySelector('#innermain > span[style*="1.5em"]')?.textContent);
      const jp = parseJapaneseName(root.querySelector('#leftfloat > span[style*="9pt"]')?.textContent ?? '');
      if (jp.name) {
          res.push({ name: '姓名', value: jp.name, category: 'crt_name' });
          res.push({ name: '日文名', value: jp.name });
          if (displayName && displayName !== jp.name) {
              res.push({ name: '罗马字', value: toBangumiRomaji(displayName) });
          }
      }
      else if (displayName) {
          res.push({ name: '姓名', value: displayName, category: 'crt_name' });
      }
      if (jp.kana) {
          res.push({ name: '纯假名', value: jp.kana });
      }
      const genderIcon = root.querySelector('#leftfloat img.inlineimg[title]');
      const gender = cleanText(genderIcon?.getAttribute('title'));
      if (/^male$/i.test(gender)) {
          res.push({ name: '性别', value: '男' });
      }
      else if (/^female$/i.test(gender)) {
          res.push({ name: '性别', value: '女' });
      }
      for (const label of ['Aliases', 'Variations']) {
          const row = findRow(root, label);
          if (!row)
              continue;
          for (const value of readRowValues(row)) {
              res.push({ name: '别名', value, category: 'listItem' });
          }
      }
      const orgRow = findRow(root, 'Organizations');
      if (orgRow) {
          for (const value of readRowValues(orgRow)) {
              res.push({ name: '所属公司', value, category: 'listItem' });
          }
      }
      const notes = readNotes(root);
      if (notes) {
          res.push({ name: '人物简介', value: notes, category: 'crt_summary' });
      }
      res.push(...collectLinkInfos(root));
      return res;
  }
  function readOrgType(root) {
      const dt = Array.from(root.querySelectorAll('dl dt.label')).find((item) => cleanText(item.textContent) === 'Type');
      return cleanText(dt?.nextElementSibling?.textContent);
  }
  function collectOrgInfos(root) {
      const res = [];
      const name = cleanText(root.querySelector('h1[style*="display: inline"]')?.textContent);
      if (name) {
          res.push({ name: '姓名', value: name, category: 'crt_name' });
      }
      res.push({
          name: 'crt_role',
          value: String(resolveOrgRole(readOrgType(root))),
          category: 'select',
      });
      res.push(...collectLinkInfos(root));
      return res;
  }
  function resolveRoot(root) {
      return root ?? document;
  }
  // 生日在抽取时已按 年月日 整理完，去掉 date 类目，
  // 否则填表时 convertInfoValue 会再用 dealDate 把它改回 ISO 格式
  function dropDateCategory(infos) {
      return infos.map((info) => info.category === 'date' ? { name: info.name, value: info.value } : info);
  }
  const vgmdbArtistTools = {
      hooks: {
          async afterGetWikiData(infos, _model, root) {
              return [
                  ...collectArtistInfos(resolveRoot(root)),
                  ...dropDateCategory(infos),
              ];
          },
      },
      filters: [{ category: 'date', dealFunc: formatBangumiBirthday }],
  };
  const vgmdbOrgTools = {
      hooks: {
          async afterGetWikiData(infos, _model, root) {
              return [
                  ...collectOrgInfos(resolveRoot(root)),
                  ...dropDateCategory(infos),
              ];
          },
      },
      filters: [{ category: 'date', dealFunc: formatBangumiBirthday }],
  };

  // ref links
  // https://vgmdb.net/album/9683
  // https://vgmdb.net/album/134285
  // https://vgmdb.net/album/122607
  // https://vgmdb.net/album/86808
  const vgmdbSubject = {
      key: 'vgmdb',
      description: 'vgmdb',
      host: ['vgmdb.net'],
      type: SubjectTypeId.music,
      pageSelectors: [
          {
              selector: '#innermain > h1',
          },
      ],
      controlSelector: {
          selector: '#innermain > h1',
      },
      itemList: [],
  };
  const commonSelectors = {
      selector: '#album_infobit_large',
      subSelector: 'tr > td:first-child',
      sibling: true,
  };
  const creditsSelectors = {
      selector: '#collapse_credits table',
      subSelector: 'tr > td:first-child',
      sibling: true,
  };
  vgmdbSubject.itemList.push(
  // ---- Info table fields ----
  {
      name: '厂牌',
      selector: [
          {
              ...commonSelectors,
              keyWord: 'Label',
          },
      ],
      pipes: ['ti'],
  }, {
      name: '条形码',
      selector: [
          {
              ...commonSelectors,
              keyWord: 'Barcode',
          },
      ],
      pipes: ['t'],
  }, {
      name: '发售日期',
      selector: [
          {
              ...commonSelectors,
              keyWord: 'Release Date',
              nextSelector: {
                  selector: 'a',
              },
          },
      ],
      pipes: ['date'],
  }, {
      name: '价格',
      selector: [
          {
              ...commonSelectors,
              keyWord: 'Price',
          },
      ],
  }, {
      name: '版本特性',
      selector: [
          {
              ...commonSelectors,
              keyWord: 'Media Format',
          },
      ],
  }, {
      name: '播放时长',
      selector: [
          {
              selector: '#tracklist',
              subSelector: 'span.smallfont',
              sibling: true,
              keyWord: 'Total length',
          },
          {
              selector: '#tracklist',
              subSelector: 'span.smallfont',
              sibling: true,
              keyWord: 'Disc length',
          },
      ],
  }, 
  // ---- Credits fields ----
  {
      name: '艺术家',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Performer', 'Vocalist'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '作曲',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Composer', 'Music Written by', 'Composed by', 'Music by'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '作词',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Lyricist', 'Lyrics', 'Lyrics Written by', 'Words by'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '编曲',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Arranger', 'Arranged by', 'Arrangement'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '声乐',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Vocal', 'Vocals', 'Chorus'],
          },
      ],
      pipes: ['ti'],
  }, 
  // 乐器: handled in afterGetWikiData (multiple credit rows)
  {
      name: '录音',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Recording', 'Recording Engineer', 'Recorded by'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '混音',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Mixing', 'Mixing Engineer', 'Mixed by'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '母带制作',
      selector: [
          {
              ...creditsSelectors,
              keyWord: ['Mastering', 'Mastering Engineer', 'Mastered by'],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '制作人',
      selector: [
          {
              ...creditsSelectors,
              keyWord: [
                  'Producer', 'Executive Producer', 'Music Producer',
                  'Produced by', 'All Songs Produced by',
              ],
          },
      ],
      pipes: ['ti'],
  }, {
      name: '插图',
      selector: [
          {
              ...creditsSelectors,
              keyWord: [
                  'Illustrator', 'Illustration', 'Jacket Design',
                  'Jacket Illustration', 'Cover Art', 'Art Direction',
              ],
          },
      ],
      pipes: ['ti'],
  });

  const vgmdbTools = {
      hooks: {
          async beforeCreate() {
              const $t = document.querySelector('#innermain h1 > .albumtitle[lang=ja]');
              if ($t && $t.style.display === 'none') {
                  const $div = document.createElement('div');
                  const $s = document.createElement('span');
                  $s.style.color = 'red';
                  $s.style.fontWeight = '600';
                  $s.innerHTML = '注意: ';
                  const $txt = document.createElement('span');
                  $txt.innerHTML =
                      '请设置 Title / Name Language 为 Original。(辅助创建脚本)';
                  $div.appendChild($s);
                  $div.appendChild($txt);
                  $div.style.padding = '6px 0';
                  $t.parentElement.insertAdjacentElement('afterend', $div);
              }
              // Clean up credits DOM before extraction:
              // 1. Remove reference markers: <span title="Referenced">*</span>
              // 2. Remove group affiliations: " (feel)" text nodes after <a> tags
              const credits = document.querySelector('#collapse_credits');
              if (credits) {
                  credits
                      .querySelectorAll('span[title="Referenced"]')
                      .forEach((el) => el.remove());
                  for (const td of credits.querySelectorAll('tr > td:nth-child(2)')) {
                      for (const node of [...td.childNodes]) {
                          if (node.nodeType === Node.TEXT_NODE) {
                              node.textContent = node.textContent.replace(/\s*\([^)]*\)/g, '');
                          }
                      }
                  }
              }
              return true;
          },
          async afterGetWikiData(infos) {
              const res = [];
              const $h1 = document.querySelector('#innermain > h1');
              res.push({
                  name: '唱片名',
                  value: $h1.innerText,
                  category: 'subject_title',
              });
              // Alternative titles as aliases
              const titleSpans = document.querySelectorAll('h1 span.albumtitle');
              const primaryText = $h1.innerText.trim();
              const seen = new Set([primaryText]);
              for (const span of titleSpans) {
                  const text = span.textContent
                      .replace(/^\s*\/\s*/, '')
                      .trim();
                  if (text && !seen.has(text)) {
                      res.push({
                          name: '别名',
                          value: text,
                          category: 'alias',
                      });
                      seen.add(text);
                  }
              }
              for (const item of infos) {
                  const stringValue = getStringValue(item.value);
                  if (item.name === '价格' && stringValue.includes('Not for Sale')) {
                      continue;
                  }
                  if (item.name === '版本特性' && /\d+/.test(stringValue)) {
                      res.push({
                          ...item,
                          value: stringValue.replace(/\d+/, '').trim(),
                      });
                      continue;
                  }
                  if (item.name === '目录编号') {
                      res.push({
                          ...item,
                          value: stringValue.trim().split(' ')[0].trim(),
                      });
                      continue;
                  }
                  res.push(item);
              }
              // Publisher (出版方) — only if different from Label
              const labelValue = infos.find((i) => i.name === '厂牌')?.value || '';
              const infoTable = document.querySelector('#rightfloat');
              if (infoTable) {
                  for (const tr of infoTable.querySelectorAll('tr.maincred')) {
                      const labelTd = tr.querySelector('td:first-child');
                      if (labelTd && labelTd.textContent.trim() === 'Publisher') {
                          const valueTd = tr.querySelector('td:nth-child(2)');
                          if (valueTd) {
                              const pubValue = valueTd.innerText.trim();
                              if (pubValue && pubValue !== labelValue) {
                                  res.push({ name: '出版方', value: pubValue });
                              }
                          }
                      }
                  }
              }
              // Instruments — collect all matching credit rows
              const instrumentKeywords = /^(Guitars?|Electric Guitars?|Acoustic Guitars?|Bass|Electric Bass|Drums?|Percussion|Piano|Acoustic Piano|Keyboard|Keyboards|Synthesizer|Synth|Violin|Viola|Cello|Strings|Flute|Oboe|Trumpet|Saxophone|Harmonica|All Instruments|All Other Instruments|Instruments)$/i;
              const creditSection = document.querySelector('#collapse_credits table');
              if (creditSection) {
                  const instrumentists = [];
                  for (const tr of creditSection.querySelectorAll('tr.maincred, tr.extracred')) {
                      const roleTd = tr.querySelector('td:first-child');
                      if (!roleTd)
                          continue;
                      // Use the en span's title for role matching to avoid mixed-language textContent
                      const enSpan = roleTd.querySelector('.artistname[lang="en"]');
                      const roleText = enSpan
                          ? (enSpan.title || enSpan.textContent).trim()
                          : roleTd.innerText.trim();
                      if (instrumentKeywords.test(roleText)) {
                          const valueTd = tr.querySelector('td:nth-child(2)');
                          if (valueTd) {
                              const names = valueTd.innerText.trim();
                              if (names)
                                  instrumentists.push(names);
                          }
                      }
                  }
                  if (instrumentists.length) {
                      res.push({ name: '乐器', value: instrumentists.join('、') });
                  }
              }
              // Disc count
              const tracklist = document.querySelector('#tracklist');
              if (tracklist) {
                  const discHeaders = tracklist.querySelectorAll('.tl b');
                  let discCount = 0;
                  discHeaders.forEach((b) => {
                      if (/^Disc\s+\d+$/i.test(b.textContent.trim()))
                          discCount++;
                  });
                  if (discCount > 0) {
                      res.push({ name: '碟片数量', value: String(discCount) });
                  }
              }
              // VGMdb link
              const canonical = document.querySelector('link[rel="canonical"]');
              const vgmdbUrl = canonical?.href || location.href.replace(/\?.*$/, '');
              if (vgmdbUrl) {
                  res.push({ name: '链接', value: vgmdbUrl, category: 'listItem' });
              }
              // Cover image
              let url = document.querySelector('meta[property="og:image"]')?.content;
              if (!url) {
                  try {
                      url = document.querySelector('#coverart').style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)[1];
                  }
                  catch (error) { }
              }
              if (url) {
                  let dataUrl = url;
                  try {
                      if (url) {
                          dataUrl = await getImageDataByURL(url, {
                              headers: {
                                  Referer: url,
                              },
                          });
                      }
                  }
                  catch (error) { }
                  res.push({
                      category: 'cover',
                      name: 'cover',
                      value: {
                          url,
                          dataUrl,
                      },
                  });
              }
              // Tracklist (episodes)
              if (tracklist) {
                  let tableList = tracklist.querySelectorAll('.tl > table');
                  document.querySelectorAll('#tlnav > li > a')?.forEach((item) => {
                      if (item.innerHTML.includes('Japanese')) {
                          const rel = item.getAttribute('rel');
                          tableList = document.querySelectorAll(`#${rel} > table`);
                      }
                  });
                  const discArr = [...tableList].map((table) => {
                      return [...table.querySelectorAll('tr')].map((item) => {
                          const $tds = item.querySelectorAll('td');
                          return {
                              title: $tds[1].innerText.trim(),
                              duration: $tds[2].innerText.trim(),
                          };
                      });
                  });
                  res.push({
                      category: 'ep',
                      name: '',
                      value: discArr,
                  });
              }
              return res;
          },
      },
  };

  const vgmdbIntegration = defineSiteIntegration({
      site: vgmdbSubject,
      tools: vgmdbTools,
  });
  const vgmdbArtistIntegration = definePersonIntegration({
      model: vgmdbArtist,
      tools: vgmdbArtistTools,
  });
  const vgmdbOrgIntegration = definePersonIntegration({
      model: vgmdbOrg,
      tools: vgmdbOrgTools,
  });

  const siteIntegrations = [
      getchuIntegration,
      dlsiteIntegration,
      dmmIntegration,
      amazonJpBookIntegration,
      amazonJpMusicIntegration,
      dangdangBookIntegration,
      jdBookIntegration,
      doubanGameIntegration,
      doubanGameEditIntegration,
      doubanMusicIntegration,
      erogamescapeIntegration,
      steamIntegration,
      steamdbIntegration,
      adultcomicIntegration,
      moepediaIntegration,
      vgmdbIntegration,
  ];
  const characterIntegrations = siteIntegrations.flatMap((integration) => integration.characters ?? []);
  // 人物页面来源独立于条目站点注册，方便接入没有条目模型的站点。
  const personIntegrations = [
      vgmdbArtistIntegration,
      vgmdbOrgIntegration,
  ];
  function buildSiteToolsMap(integrations) {
      return integrations.reduce((acc, integration) => {
          if (integration.tools) {
              acc[integration.site.key] = integration.tools;
          }
          return acc;
      }, {});
  }
  function buildCharacterToolsMap(integrations) {
      return integrations.reduce((acc, integration) => {
          if (integration.tools) {
              acc[integration.model.key] = integration.tools;
          }
          return acc;
      }, {});
  }
  function buildPersonToolsMap(integrations) {
      return integrations.reduce((acc, integration) => {
          if (integration.tools) {
              acc[integration.model.key] = integration.tools;
          }
          return acc;
      }, {});
  }
  // 条目与人物模型的 category 过滤器合并成一张按 ModelKey 索引的表，
  // 供核心抽取层按任意模型 key 查询。
  function buildFiltersMap(sites, persons) {
      const acc = {};
      for (const integration of sites) {
          if (integration.tools?.filters) {
              acc[integration.site.key] = integration.tools.filters;
          }
      }
      for (const integration of persons) {
          if (integration.tools?.filters) {
              acc[integration.model.key] = integration.tools.filters;
          }
      }
      return acc;
  }
  const siteToolsMap = buildSiteToolsMap(siteIntegrations);
  const characterToolsMap = buildCharacterToolsMap(characterIntegrations);
  const personToolsMap = buildPersonToolsMap(personIntegrations);
  const filtersMap = buildFiltersMap(siteIntegrations, personIntegrations);
  const noOpBeforeCreate = async () => true;
  const noOpSubjectAfterGetWikiData = async (infos) => infos;
  const noOpCharacterAfterGetWikiData = async (infos) => infos;
  const noOpPersonBeforeCreate = async () => true;
  const noOpPersonAfterGetWikiData = async (infos) => infos;
  function identity(x) {
      return x;
  }
  function findModelByHost(host) {
      return siteIntegrations
          .map((integration) => integration.site)
          .filter((model) => model.host.includes(host));
  }
  function getCharacterModels(key) {
      return characterIntegrations
          .filter((integration) => integration.model.siteKey === key)
          .map((integration) => integration.model);
  }
  // host 命中且 urlRules（若有）命中当前页面地址的人物模型
  function findPersonModels(host, href) {
      return personIntegrations
          .map((integration) => integration.model)
          .filter((model) => model.host.includes(host))
          .filter((model) => !model.urlRules?.length ||
          model.urlRules.some((rule) => rule.test(href)));
  }
  function getSiteTools(key) {
      return siteToolsMap[key];
  }
  function getCharacterTools(key) {
      return characterToolsMap[key];
  }
  function getPersonTools(key) {
      return personToolsMap[key];
  }
  function getSubjectHooks(siteConfig, timing) {
      const hooks = getSiteTools(siteConfig.key)?.hooks;
      if (!hooks) {
          return timing === 'beforeCreate'
              ? noOpBeforeCreate
              : noOpSubjectAfterGetWikiData;
      }
      return hooks[timing] || (timing === 'beforeCreate'
          ? noOpBeforeCreate
          : noOpSubjectAfterGetWikiData);
  }
  function getCharacterHooks(config, timing = 'afterGetWikiData') {
      const hooks = getCharacterTools(config.key)?.hooks;
      if (!hooks) {
          return noOpCharacterAfterGetWikiData;
      }
      return hooks[timing] || noOpCharacterAfterGetWikiData;
  }
  function getPersonHooks(model, timing) {
      const hooks = getPersonTools(model.key)?.hooks;
      const fallback = timing === 'beforeCreate'
          ? noOpPersonBeforeCreate
          : noOpPersonAfterGetWikiData;
      return hooks?.[timing] || fallback;
  }
  function dealFuncByCategory(key, category) {
      const filter = category
          ? filtersMap[key]?.find((item) => item.category === category)
          : undefined;
      if (filter?.dealFunc) {
          return filter.dealFunc;
      }
      return (str = '') => identity((str ?? '').trim());
  }

  const DEFAULT_CONTROL_LABELS = {
      create: '新建',
      createWithCheck: '新建并查重',
  };
  const EXPORT_LABEL = '调试数据';
  const EXPORTING_LABEL = '提取中...';
  let showExportButtons = false;
  function syncExportButton(button) {
      button.hidden = !showExportButtons;
      if (showExportButtons)
          button.style.removeProperty('display');
      else
          button.style.setProperty('display', 'none', 'important');
  }
  function setExportButtonsVisible(visible) {
      showExportButtons = visible;
      document
          .querySelectorAll('.e-wiki-export-json')
          .forEach(syncExportButton);
  }
  /**
   * 插入控制的按钮
   * @param $t 父节点
   * @param cb 返回 Promise 的回调
   * @param labels 按钮文案，人物等其他来源可以换掉默认的条目文案
   */
  function insertControlBtn($t, cb, labels = DEFAULT_CONTROL_LABELS) {
      if (!$t)
          return;
      const $div = document.createElement('div');
      const $s = document.createElement('span');
      $s.classList.add('e-wiki-new-subject');
      $s.innerHTML = labels.create;
      const $search = $s.cloneNode();
      $search.innerHTML = labels.createWithCheck;
      $div.appendChild($s);
      $div.appendChild($search);
      $t.insertAdjacentElement('afterend', $div);
      $s.addEventListener('click', async (e) => {
          await cb(e);
      });
      $search.addEventListener('click', async (e) => {
          if ($search.innerHTML !== labels.createWithCheck)
              return;
          $search.innerHTML = '查重中...';
          try {
              await cb(e, true);
          }
          catch (e) {
              if (e === 'notmatched') {
                  $search.innerHTML = '未查到条目';
              }
              console.error(e);
          }
          finally {
              if ($search.innerHTML === '查重中...') {
                  $search.innerHTML = labels.createWithCheck;
              }
          }
      });
      return $div;
  }
  /**
   * 在控制按钮容器里追加「调试数据」按钮
   * @param $container insertControlBtn 等返回的容器
   * @param cb 返回 Promise 的回调
   */
  function appendExportBtn($container, cb) {
      if (!$container)
          return;
      const $s = document.createElement('span');
      $s.classList.add('e-wiki-new-subject', 'e-wiki-export-json');
      $s.textContent = EXPORT_LABEL;
      syncExportButton($s);
      $container.appendChild($s);
      $s.addEventListener('click', async (e) => {
          if (!showExportButtons || $s.textContent !== EXPORT_LABEL)
              return;
          $s.textContent = EXPORTING_LABEL;
          try {
              await cb(e);
          }
          catch (error) {
              console.error(error);
          }
          finally {
              $s.textContent = EXPORT_LABEL;
          }
      });
      return $s;
  }
  /**
   * 插入新建角色控制的按钮
   * @param $t 父节点
   * @param cb 返回 Promise 的回调
   */
  function insertControlBtnChara($t, cb) {
      if (!$t)
          return;
      const $div = document.createElement('div');
      const $s = document.createElement('a');
      $s.classList.add('e-wiki-new-character');
      // $s.setAttribute('target', '_blank')
      $s.innerHTML = '添加新虚拟角色';
      $div.appendChild($s);
      $t.insertAdjacentElement('afterend', $div);
      $s.addEventListener('click', async (e) => {
          await cb(e);
      });
      return $div;
  }
  function addCharaUI($t, names, cb) {
      if (!$t)
          return;
      if (!names.length) {
          console.warn('没有虚拟角色可用');
          return;
      }
      // @TODO 增加全部
      // <option value="all">全部</option>
      const btn = `<a class="e-wiki-new-character">添加新虚拟角色</a>`;
      const $div = htmlToElement(`
  <div class="e-bnwh-add-chara-wrap">
  ${btn}
<select class="e-bnwh-select">
${names.map((n) => `<option value="${n}">${n}</option>`)}
</select>
  </div>
  `);
      $t.insertAdjacentElement('afterend', $div);
      const $button = $div.querySelector('.e-wiki-new-character');
      const $sel = $div.querySelector('.e-bnwh-select');
      if (!$button || !$sel) {
          return $div;
      }
      $button.addEventListener('click', async (e) => {
          await cb(e, $sel.value);
      });
      return $div;
  }

  function createSelectorCheck(name, root) {
      return {
          name,
          scope: root?.nodeType === 1 ? '局部节点' : '页面',
          result: 'missed',
          attempts: [],
      };
  }
  function resolveSelectorMatch(selector, root, attempts) {
      if (selector instanceof Array) {
          for (const candidate of selector) {
              const match = resolveSelectorMatch(candidate, root, attempts);
              if (match) {
                  return match;
              }
          }
          return;
      }
      const attempt = attempts && {
          rule: JSON.stringify(selector, (_key, value) => value instanceof RegExp ? String(value) : value),
          result: 'error',
      };
      if (attempt && attempts)
          attempts.push(attempt);
      const element = findElement(selector, root);
      if (attempt) {
          attempt.result = element ? 'matched' : 'missed';
          if (element) {
              const id = element.id ? `#${element.id}` : '';
              const classes = [...element.classList].slice(0, 3).map((name) => `.${name}`);
              attempt.node = [element.localName, id, ...classes].join('').slice(0, 160);
          }
      }
      if (!element) {
          return;
      }
      return {
          element,
          selector,
      };
  }
  function getSelectorKeyWords(selector) {
      return toTextPatterns(selector.keyWord);
  }

  const pipeFnDict = {
      // t: 去除开头和结尾的空格
      t: trimSpace,
      // ta: 去除所有空格
      ta: trimAllSpace,
      // ti: 去除空格，在 getWikiItem 里面，使用 innerText 取文本
      ti: trimSpace,
      // k: 去除关键字;
      k: (pipe, keyWords = []) => trimKeywords(pipe, Array.isArray(keyWords) ? keyWords.filter(isTextPattern) : []),
      // p: 括号
      p: trimParenthesis,
      // pn: 括号不含数字
      pn: trimParenthesisN,
      // num: 提取数字
      num: getNum,
      date: getDate,
      // label: 去掉前缀标签，例如 “作者:”
      label: trimLeadingLabel,
  };
  function getStr(pipe) {
      return (pipe.out ?? pipe.rawInfo).trim();
  }
  function trim(pipe, patterns) {
      let str = getStr(pipe);
      if (!patterns.length) {
          return {
              ...pipe,
              out: str,
          };
      }
      return {
          ...pipe,
          out: replaceTextPatterns(str, patterns),
      };
  }
  function trimAllSpace(pipe) {
      let str = getStr(pipe);
      return {
          ...pipe,
          out: str.replace(/\s/g, ''),
      };
  }
  function trimSpace(pipe) {
      let str = getStr(pipe);
      return {
          ...pipe,
          out: str.trim(),
      };
  }
  function trimParenthesis(pipe) {
      return trim(pipe, [/\(.*?\)/, /（.*?）/]);
  }
  // 保留括号里面的数字. 比如一些图书的 1 2 3
  function trimParenthesisN(pipe) {
      return trim(pipe, [/\([^\d]*?\)/, /（[^\d]*?）/]);
  }
  function createKeywordPatterns(keyWords = []) {
      return keyWords.map((pattern) => {
          if (pattern instanceof RegExp) {
              const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
              return new RegExp(`${pattern.source}\\s*?(:|：)?`, flags);
          }
          return new RegExp(`${getTextPatternSource(pattern)}\\s*?(:|：)?`, 'g');
      });
  }
  function trimKeywords(pipe, keyWords = []) {
      return trim(pipe, createKeywordPatterns(keyWords));
  }
  function trimLeadingLabel(pipe) {
      return {
          ...pipe,
          out: getStr(pipe).replace(/[^\d:]+?(:|：)/, '').trim(),
      };
  }
  function getNum(pipe) {
      let str = getStr(pipe);
      const m = str.match(/\d+/);
      return {
          rawInfo: pipe.rawInfo,
          out: m ? m[0] : '',
      };
  }
  function getDate(pipe) {
      let dataStr = getStr(pipe);
      return {
          rawInfo: pipe.rawInfo,
          out: dealDate(dataStr),
      };
  }
  /**
   *
   * @param str 原字符串
   * @param pipes 管道
   * @returns 处理后的字符串
   */
  function dealTextByPipe(str, pipes, argsDict = {}) {
      let current = { rawInfo: str };
      pipes = pipes || [];
      for (const p of pipes) {
          if (p instanceof Function) {
              // @TODO 支持传递参数
              current = p(current);
          }
          else {
              if (argsDict[p]) {
                  current = pipeFnDict[p](current, ...argsDict[p]);
              }
              else {
                  current = pipeFnDict[p](current);
              }
          }
      }
      return current.out ?? str;
  }

  function getCurrentPageUrl() {
      return typeof location === 'undefined' ? '' : location.href;
  }
  async function getCover($d, site, context = {}) {
      let url;
      let dataUrl = '';
      if ($d.tagName.toLowerCase() === 'a') {
          url = $d.getAttribute('href');
      }
      else if ($d.tagName.toLowerCase() === 'img') {
          url = $d.getAttribute('src');
          const dataSrc = $d.getAttribute('data-src');
          if (dataSrc) {
              url = dataSrc;
          }
      }
      if (!url)
          return;
      try {
          const currentPageUrl = getCurrentPageUrl();
          if (!/^https?:/.test(url) && (context.sourceUrl || currentPageUrl)) {
              url = new URL(url, context.sourceUrl || currentPageUrl).href;
          }
          // 跨域的图片不能用这种方式
          let opts = {};
          if (site.includes('getchu')) {
              const referer = context.imageReferer || currentPageUrl;
              opts.headers = referer
                  ? {
                      Referer: referer,
                  }
                  : undefined;
          }
          dataUrl = await getImageDataByURL(url, opts);
          if (dataUrl) {
              return {
                  url,
                  dataUrl,
              };
          }
      }
      catch (error) {
          return {
              url,
              dataUrl: url,
          };
      }
  }

  const preservedCategories = new Set([
      'subject_title',
      'subject_summary',
      'alias',
      'crt_name',
      'crt_summary',
  ]);
  function createKeywordPipeArgsDict(keyWords = []) {
      return keyWords.length
          ? {
              k: [keyWords],
          }
          : {};
  }
  function normalizePreservedText(str) {
      return dealTextByPipe(str, ['t']);
  }
  function normalizeInfoText(str, keyWords = []) {
      return dealTextByPipe(str, ['p', 'k', 'label', 't'], createKeywordPipeArgsDict(keyWords));
  }
  function normalizeTextByCategory(str, category = '', keyWords = []) {
      if (preservedCategories.has(category)) {
          return normalizePreservedText(str);
      }
      return normalizeInfoText(str, keyWords);
  }

  function isSummaryCategory(category) {
      return category === 'subject_summary' || category === 'crt_summary';
  }
  function transformTextValue(rawText, infoConfig, site, category, keyWords) {
      const pipeArgsDict = createKeywordPipeArgsDict(keyWords);
      if (infoConfig.pipes?.length) {
          return dealTextByPipe(rawText, infoConfig.pipes, pipeArgsDict);
      }
      const normalizedText = normalizeTextByCategory(rawText, category, keyWords);
      if (category === 'date') {
          return dealFuncByCategory(site, category)(normalizedText);
      }
      if (category === 'subject_title' ||
          category === 'alias' ||
          isSummaryCategory(category)) {
          return dealFuncByCategory(site, category)(normalizedText);
      }
      return normalizedText;
  }

  function isCoverCategory(category) {
      return category === 'cover' || category === 'crt_cover';
  }
  function shouldUseInnerText(category, infoConfig) {
      return isSummaryCategory(category) || Boolean(infoConfig.pipes?.includes('ti'));
  }
  function readRawText(element, category, infoConfig) {
      const target = element;
      if (shouldUseInnerText(category, infoConfig)) {
          const innerText = getInnerText(target);
          if (innerText || infoConfig.pipes?.includes('ti')) {
              return innerText;
          }
      }
      return getText(target);
  }
  function postProcessValue(category, value) {
      if (category === 'creator') {
          return dealTextByPipe(getStringValue(value), ['ta']);
      }
      return value;
  }
  async function extractItemValue(infoConfig, site, context, element, keyWords) {
      const category = infoConfig.category || '';
      if (isCoverCategory(category)) {
          return getCover(element, site, context);
      }
      if (category === 'website') {
          return dealFuncByCategory(site, 'website')(element.getAttribute('href'));
      }
      const rawText = readRawText(element, category, infoConfig);
      const value = transformTextValue(rawText, infoConfig, site, category, keyWords);
      return postProcessValue(category, value);
  }

  function isSingleInfo(info) {
      return Boolean(info);
  }
  async function getWikiItem(infoConfig, site, context = {}, check) {
      if (!infoConfig)
          return;
      const match = resolveSelectorMatch(infoConfig.selector, context.root, check?.attempts);
      if (!match)
          return;
      const keyWords = getSelectorKeyWords(match.selector);
      const val = await extractItemValue(infoConfig, site, context, match.element, keyWords);
      if (check)
          check.result = val ? 'matched' : 'empty';
      if (val) {
          return {
              name: infoConfig.name,
              value: val,
              category: infoConfig.category,
          };
      }
  }
  async function getWikiItems(itemList, site, context) {
      const report = context.reportSelectorCheck;
      const checks = report && itemList.map((item) => createSelectorCheck(item?.name ?? '', context.root));
      const results = await Promise.allSettled(itemList.map((item, index) => getWikiItem(item, site, context, checks?.[index])));
      return results.flatMap((result, index) => {
          const check = checks?.[index];
          if (check && report) {
              if (result.status === 'rejected') {
                  check.result = 'error';
                  check.error = String(result.reason).slice(0, 300);
              }
              report(check);
          }
          if (result.status === 'fulfilled') {
              return isSingleInfo(result.value) ? [result.value] : [];
          }
          console.error(`[extract] failed to get wiki item: ${itemList[index]?.name}`, result.reason);
          return [];
      });
  }

  function applyHookResult(rawInfo, hookRes) {
      return Array.isArray(hookRes) ? hookRes : rawInfo;
  }
  async function getWikiData(siteConfig, context = {}) {
      const rawInfo = await getWikiItems(siteConfig.itemList, siteConfig.key, context);
      const defaultInfos = siteConfig.defaultInfos || [];
      const hookRes = await getSubjectHooks(siteConfig, 'afterGetWikiData')(rawInfo, siteConfig, context.root);
      return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
  }
  async function getCharaData(model, context = {}) {
      const rawInfo = await getWikiItems(model.itemList, model.siteKey, context);
      const defaultInfos = model.defaultInfos || [];
      const hookRes = await getCharacterHooks(model, 'afterGetWikiData')(rawInfo, model, context.root);
      return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
  }
  async function getPersonData(model, context = {}) {
      const rawInfo = await getWikiItems(model.itemList, model.key, context);
      const defaultInfos = model.defaultInfos || [];
      const hookRes = await getPersonHooks(model, 'afterGetWikiData')(rawInfo, model, context.root);
      return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
  }

  /**
   * Fuse.js v7.5.0 - Lightweight fuzzy-search (http://fusejs.io)
   *
   * Copyright (c) 2026 Kiro Risk (http://kiro.me)
   * All Rights Reserved. Apache Software License 2.0
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   */
  //#region src/helpers/typeGuards.ts
  function isArray(value) {
  	return !Array.isArray ? getTag(value) === "[object Array]" : Array.isArray(value);
  }
  function baseToString(value) {
  	if (typeof value == "string") return value;
  	if (typeof value === "bigint") return value.toString();
  	const result = value + "";
  	return result == "0" && 1 / value == -Infinity ? "-0" : result;
  }
  function toString(value) {
  	return value == null ? "" : baseToString(value);
  }
  function isString(value) {
  	return typeof value === "string";
  }
  function isNumber(value) {
  	return typeof value === "number";
  }
  function isBoolean(value) {
  	return value === true || value === false || isObjectLike(value) && getTag(value) == "[object Boolean]";
  }
  function isObject(value) {
  	return typeof value === "object";
  }
  function isObjectLike(value) {
  	return isObject(value) && value !== null;
  }
  function isDefined(value) {
  	return value !== void 0 && value !== null;
  }
  function isBlank(value) {
  	return !value.trim().length;
  }
  function getTag(value) {
  	return value == null ? value === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(value);
  }

  //#endregion
  //#region src/core/errorMessages.ts
  const INCORRECT_INDEX_TYPE = "Incorrect 'index' type";
  const INVALID_DOC_INDEX = "Invalid doc index: must be a non-negative integer within the bounds of the docs array";
  const LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) => `Invalid value for key ${key}`;
  const PATTERN_LENGTH_TOO_LARGE = (max) => `Pattern length exceeds max of ${max}.`;
  const MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;
  const INVALID_KEY_WEIGHT_VALUE = (key) => `Property 'weight' in key '${key}' must be a positive integer`;
  const FUSE_MATCH_TOKEN_SEARCH_UNSUPPORTED = "Fuse.match does not support useTokenSearch: token search requires corpus-level statistics (df, fieldCount) that a one-off string comparison does not have. Use new Fuse(...).search(...) instead.";

  //#endregion
  //#region src/tools/KeyStore.ts
  const hasOwn = Object.prototype.hasOwnProperty;
  var KeyStore = class {
  	constructor(keys) {
  		this._keys = [];
  		this._keyMap = {};
  		let totalWeight = 0;
  		keys.forEach((key) => {
  			const obj = createKey(key);
  			this._keys.push(obj);
  			this._keyMap[obj.id] = obj;
  			totalWeight += obj.weight;
  		});
  		this._keys.forEach((key) => {
  			key.weight /= totalWeight;
  		});
  	}
  	get(keyId) {
  		return this._keyMap[keyId];
  	}
  	keys() {
  		return this._keys;
  	}
  	toJSON() {
  		return JSON.stringify(this._keys);
  	}
  };
  function createKey(key) {
  	let path = null;
  	let id = null;
  	let src = null;
  	let weight = 1;
  	let getFn = null;
  	if (isString(key) || isArray(key)) {
  		src = key;
  		path = createKeyPath(key);
  		id = createKeyId(key);
  	} else {
  		if (!hasOwn.call(key, "name")) throw new Error(MISSING_KEY_PROPERTY("name"));
  		const name = key.name;
  		src = name;
  		if (hasOwn.call(key, "weight") && key.weight !== void 0) {
  			weight = key.weight;
  			if (weight <= 0) throw new Error(INVALID_KEY_WEIGHT_VALUE(createKeyId(name)));
  		}
  		path = createKeyPath(name);
  		id = createKeyId(name);
  		getFn = key.getFn ?? null;
  	}
  	return {
  		path,
  		id,
  		weight,
  		src,
  		getFn
  	};
  }
  function createKeyPath(key) {
  	return isArray(key) ? key : key.split(".");
  }
  function createKeyId(key) {
  	return isArray(key) ? key.join(".") : key;
  }

  //#endregion
  //#region src/helpers/get.ts
  function get(obj, path) {
  	const list = [];
  	let arr = false;
  	const deepGet = (obj, path, index, arrayIndex) => {
  		if (!isDefined(obj)) return;
  		if (!path[index]) list.push(arrayIndex !== void 0 ? {
  			v: obj,
  			i: arrayIndex
  		} : obj);
  		else {
  			const value = obj[path[index]];
  			if (!isDefined(value)) return;
  			if (index === path.length - 1 && (isString(value) || isNumber(value) || isBoolean(value) || typeof value === "bigint")) list.push(arrayIndex !== void 0 ? {
  				v: toString(value),
  				i: arrayIndex
  			} : toString(value));
  			else if (isArray(value)) {
  				arr = true;
  				for (let i = 0, len = value.length; i < len; i += 1) deepGet(value[i], path, index + 1, i);
  			} else if (path.length) deepGet(value, path, index + 1, arrayIndex);
  		}
  	};
  	deepGet(obj, isString(path) ? path.split(".") : path, 0);
  	return arr ? list : list[0];
  }

  //#endregion
  //#region src/core/config.ts
  const MatchOptions = {
  	includeMatches: false,
  	findAllMatches: false,
  	minMatchCharLength: 1
  };
  const BasicOptions = {
  	isCaseSensitive: false,
  	ignoreDiacritics: false,
  	includeScore: false,
  	keys: [],
  	shouldSort: true,
  	sortFn: (a, b) => a.score === b.score ? a.idx < b.idx ? -1 : 1 : a.score < b.score ? -1 : 1
  };
  const FuzzyOptions = {
  	location: 0,
  	threshold: .6,
  	distance: 100
  };
  const AdvancedOptions = {
  	useExtendedSearch: false,
  	useTokenSearch: false,
  	tokenize: void 0,
  	tokenMatch: "any",
  	getFn: get,
  	ignoreLocation: false,
  	ignoreFieldNorm: false,
  	fieldNormWeight: 1
  };
  const Config = Object.freeze({
  	...BasicOptions,
  	...MatchOptions,
  	...FuzzyOptions,
  	...AdvancedOptions
  });

  //#endregion
  //#region src/tools/fieldNorm.ts
  function isWordSeparator(code) {
  	return code >= 9 && code <= 13 || code === 32 || code === 160;
  }
  function norm(weight = 1, mantissa = 3) {
  	const cache = /* @__PURE__ */ new Map();
  	const m = Math.pow(10, mantissa);
  	return {
  		get(value) {
  			let numTokens = 0;
  			let inWord = false;
  			for (let i = 0; i < value.length; i++) if (!isWordSeparator(value.charCodeAt(i))) {
  				if (!inWord) {
  					numTokens++;
  					inWord = true;
  				}
  			} else inWord = false;
  			if (numTokens === 0) numTokens = 1;
  			if (cache.has(numTokens)) return cache.get(numTokens);
  			const n = Math.round(m / Math.pow(numTokens, .5 * weight)) / m;
  			cache.set(numTokens, n);
  			return n;
  		},
  		clear() {
  			cache.clear();
  		}
  	};
  }

  //#endregion
  //#region src/tools/FuseIndex.ts
  var FuseIndex = class {
  	constructor({ getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  		this.norm = norm(fieldNormWeight, 3);
  		this.getFn = getFn;
  		this.isCreated = false;
  		this.docs = [];
  		this.keys = [];
  		this._keysMap = {};
  		this.setIndexRecords();
  	}
  	setSources(docs = []) {
  		this.docs = docs;
  	}
  	setIndexRecords(records = []) {
  		this.records = records;
  	}
  	setKeys(keys = []) {
  		this.keys = keys;
  		this._keysMap = {};
  		keys.forEach((key, idx) => {
  			this._keysMap[key.id] = idx;
  		});
  	}
  	create() {
  		if (this.isCreated || !this.docs.length) return;
  		this.isCreated = true;
  		const len = this.docs.length;
  		this.records = new Array(len);
  		let recordCount = 0;
  		if (isString(this.docs[0])) for (let i = 0; i < len; i++) {
  			const record = this._createStringRecord(this.docs[i], i);
  			if (record) this.records[recordCount++] = record;
  		}
  		else for (let i = 0; i < len; i++) this.records[recordCount++] = this._createObjectRecord(this.docs[i], i);
  		this.records.length = recordCount;
  		this.norm.clear();
  	}
  	add(doc, docIndex) {
  		if (!Number.isInteger(docIndex) || docIndex < 0) throw new Error(INVALID_DOC_INDEX);
  		if (isString(doc)) {
  			const record = this._createStringRecord(doc, docIndex);
  			if (record) this.records.push(record);
  			return record;
  		}
  		const record = this._createObjectRecord(doc, docIndex);
  		this.records.push(record);
  		return record;
  	}
  	removeAt(idx) {
  		if (!Number.isInteger(idx) || idx < 0) throw new Error(INVALID_DOC_INDEX);
  		for (let i = 0, len = this.records.length; i < len; i += 1) if (this.records[i].i === idx) {
  			this.records.splice(i, 1);
  			break;
  		}
  		for (let i = 0, len = this.records.length; i < len; i += 1) if (this.records[i].i > idx) this.records[i].i -= 1;
  	}
  	removeAll(indices) {
  		const toRemove = /* @__PURE__ */ new Set();
  		for (const v of indices) if (Number.isInteger(v) && v >= 0) toRemove.add(v);
  		if (toRemove.size === 0) return;
  		this.records = this.records.filter((r) => !toRemove.has(r.i));
  		const sorted = Array.from(toRemove).sort((a, b) => a - b);
  		for (const record of this.records) {
  			let lo = 0;
  			let hi = sorted.length;
  			while (lo < hi) {
  				const mid = lo + hi >>> 1;
  				if (sorted[mid] < record.i) lo = mid + 1;
  				else hi = mid;
  			}
  			record.i -= lo;
  		}
  	}
  	getValueForItemAtKeyId(item, keyId) {
  		return item[this._keysMap[keyId]];
  	}
  	size() {
  		return this.records.length;
  	}
  	_createStringRecord(doc, docIndex) {
  		if (!isDefined(doc) || isBlank(doc)) return null;
  		return {
  			v: doc,
  			i: docIndex,
  			n: this.norm.get(doc)
  		};
  	}
  	_createObjectRecord(doc, docIndex) {
  		const record = {
  			i: docIndex,
  			$: {}
  		};
  		for (let keyIndex = 0, keyLen = this.keys.length; keyIndex < keyLen; keyIndex++) {
  			const key = this.keys[keyIndex];
  			const value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path);
  			if (!isDefined(value)) continue;
  			if (isArray(value)) {
  				const subRecords = [];
  				for (let i = 0, len = value.length; i < len; i += 1) {
  					const item = value[i];
  					if (!isDefined(item)) continue;
  					if (isString(item)) {
  						if (!isBlank(item)) {
  							const subRecord = {
  								v: item,
  								i,
  								n: this.norm.get(item)
  							};
  							subRecords.push(subRecord);
  						}
  					} else if (isDefined(item.v)) {
  						const text = isString(item.v) ? item.v : toString(item.v);
  						if (!isBlank(text)) {
  							const subRecord = {
  								v: text,
  								i: item.i,
  								n: this.norm.get(text)
  							};
  							subRecords.push(subRecord);
  						}
  					}
  				}
  				record.$[keyIndex] = subRecords;
  			} else if (isString(value) && !isBlank(value)) {
  				const subRecord = {
  					v: value,
  					n: this.norm.get(value)
  				};
  				record.$[keyIndex] = subRecord;
  			}
  		}
  		return record;
  	}
  	toJSON() {
  		return {
  			keys: this.keys.map(({ getFn, ...key }) => key),
  			records: this.records
  		};
  	}
  };
  function createIndex(keys, docs, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  	const myIndex = new FuseIndex({
  		getFn,
  		fieldNormWeight
  	});
  	myIndex.setKeys(keys.map(createKey));
  	myIndex.setSources(docs);
  	myIndex.create();
  	return myIndex;
  }
  function parseIndex(data, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  	const { keys, records } = data;
  	const myIndex = new FuseIndex({
  		getFn,
  		fieldNormWeight
  	});
  	myIndex.setKeys(keys);
  	myIndex.setIndexRecords(records);
  	return myIndex;
  }

  //#endregion
  //#region src/search/bitap/convertMaskToIndices.ts
  function convertMaskToIndices(matchmask = [], minMatchCharLength = Config.minMatchCharLength) {
  	const indices = [];
  	let start = -1;
  	let end = -1;
  	let i = 0;
  	for (let len = matchmask.length; i < len; i += 1) {
  		const match = matchmask[i];
  		if (match && start === -1) start = i;
  		else if (!match && start !== -1) {
  			end = i - 1;
  			if (end - start + 1 >= minMatchCharLength) indices.push([start, end]);
  			start = -1;
  		}
  	}
  	if (matchmask[i - 1] && i - start >= minMatchCharLength) indices.push([start, i - 1]);
  	return indices;
  }

  //#endregion
  //#region src/search/bitap/search.ts
  function search(text, pattern, patternAlphabet, { location = Config.location, distance = Config.distance, threshold = Config.threshold, findAllMatches = Config.findAllMatches, minMatchCharLength = Config.minMatchCharLength, includeMatches = Config.includeMatches, ignoreLocation = Config.ignoreLocation } = {}) {
  	if (pattern.length > 32) throw new Error(PATTERN_LENGTH_TOO_LARGE(32));
  	const patternLen = pattern.length;
  	const textLen = text.length;
  	const expectedLocation = Math.max(0, Math.min(location, textLen));
  	let currentThreshold = threshold;
  	let bestLocation = expectedLocation;
  	const calcScore = (errors, currentLocation) => {
  		const accuracy = errors / patternLen;
  		if (ignoreLocation) return accuracy;
  		const proximity = Math.abs(expectedLocation - currentLocation);
  		if (!distance) return proximity ? 1 : accuracy;
  		return accuracy + proximity / distance;
  	};
  	const computeMatches = minMatchCharLength > 1 || includeMatches;
  	const matchMask = computeMatches ? Array(textLen) : [];
  	let index;
  	while ((index = text.indexOf(pattern, bestLocation)) > -1) {
  		const score = calcScore(0, index);
  		currentThreshold = Math.min(score, currentThreshold);
  		bestLocation = index + patternLen;
  		if (computeMatches) {
  			let i = 0;
  			while (i < patternLen) {
  				matchMask[index + i] = 1;
  				i += 1;
  			}
  		}
  	}
  	bestLocation = -1;
  	let lastBitArr = [];
  	let finalScore = 1;
  	let bestErrors = 0;
  	let binMax = patternLen + textLen;
  	const mask = 1 << patternLen - 1;
  	for (let i = 0; i < patternLen; i += 1) {
  		let binMin = 0;
  		let binMid = binMax;
  		while (binMin < binMid) {
  			if (calcScore(i, expectedLocation + binMid) <= currentThreshold) binMin = binMid;
  			else binMax = binMid;
  			binMid = Math.floor((binMax - binMin) / 2 + binMin);
  		}
  		binMax = binMid;
  		let start = Math.max(1, expectedLocation - binMid + 1);
  		const finish = findAllMatches ? textLen : Math.min(expectedLocation + binMid, textLen) + patternLen;
  		const bitArr = Array(finish + 2);
  		bitArr[finish + 1] = (1 << i) - 1;
  		for (let j = finish; j >= start; j -= 1) {
  			const currentLocation = j - 1;
  			const charMatch = patternAlphabet[text[currentLocation]];
  			bitArr[j] = (bitArr[j + 1] << 1 | 1) & charMatch;
  			if (i) bitArr[j] |= (lastBitArr[j + 1] | lastBitArr[j]) << 1 | 1 | lastBitArr[j + 1];
  			if (bitArr[j] & mask) {
  				finalScore = calcScore(i, currentLocation);
  				if (finalScore <= currentThreshold) {
  					currentThreshold = finalScore;
  					bestLocation = currentLocation;
  					bestErrors = i;
  					if (bestLocation <= expectedLocation) break;
  					start = Math.max(1, 2 * expectedLocation - bestLocation);
  				}
  			}
  		}
  		if (calcScore(i + 1, expectedLocation) > currentThreshold) break;
  		lastBitArr = bitArr;
  	}
  	if (computeMatches && bestLocation >= 0) {
  		const matchEnd = Math.min(textLen - 1, bestLocation + patternLen - 1 + bestErrors);
  		for (let k = bestLocation; k <= matchEnd; k += 1) if (patternAlphabet[text[k]]) matchMask[k] = 1;
  	}
  	const result = {
  		isMatch: bestLocation >= 0,
  		score: Math.max(.001, finalScore)
  	};
  	if (computeMatches) {
  		const indices = convertMaskToIndices(matchMask, minMatchCharLength);
  		if (!indices.length) result.isMatch = false;
  		else if (includeMatches) result.indices = indices;
  	}
  	return result;
  }

  //#endregion
  //#region src/search/bitap/createPatternAlphabet.ts
  function createPatternAlphabet(pattern) {
  	const mask = {};
  	for (let i = 0, len = pattern.length; i < len; i += 1) {
  		const char = pattern.charAt(i);
  		mask[char] = (mask[char] || 0) | 1 << len - i - 1;
  	}
  	return mask;
  }

  //#endregion
  //#region src/helpers/mergeIndices.ts
  function mergeIndices(indices) {
  	if (indices.length <= 1) return indices;
  	indices.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  	const merged = [indices[0]];
  	for (let i = 1, len = indices.length; i < len; i += 1) {
  		const last = merged[merged.length - 1];
  		const curr = indices[i];
  		if (curr[0] <= last[1] + 1) last[1] = Math.max(last[1], curr[1]);
  		else merged.push(curr);
  	}
  	return merged;
  }

  //#endregion
  //#region src/helpers/diacritics.ts
  const NON_DECOMPOSABLE_MAP = {
  	"ł": "l",
  	"Ł": "L",
  	"đ": "d",
  	"Đ": "D",
  	"ø": "o",
  	"Ø": "O",
  	"ħ": "h",
  	"Ħ": "H",
  	"ŧ": "t",
  	"Ŧ": "T",
  	"ı": "i",
  	"ß": "ss"
  };
  const NON_DECOMPOSABLE_RE = new RegExp("[" + Object.keys(NON_DECOMPOSABLE_MAP).join("") + "]", "g");
  const stripDiacritics = typeof String.prototype.normalize === "function" ? (str) => str.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "").replace(NON_DECOMPOSABLE_RE, (ch) => NON_DECOMPOSABLE_MAP[ch]) : (str) => str;

  //#endregion
  //#region src/search/bitap/index.ts
  var BitapSearch = class {
  	constructor(pattern, { location = Config.location, threshold = Config.threshold, distance = Config.distance, includeMatches = Config.includeMatches, findAllMatches = Config.findAllMatches, minMatchCharLength = Config.minMatchCharLength, isCaseSensitive = Config.isCaseSensitive, ignoreDiacritics = Config.ignoreDiacritics, ignoreLocation = Config.ignoreLocation } = {}) {
  		this.options = {
  			location,
  			threshold,
  			distance,
  			includeMatches,
  			findAllMatches,
  			minMatchCharLength,
  			isCaseSensitive,
  			ignoreDiacritics,
  			ignoreLocation
  		};
  		pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
  		pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
  		this.pattern = pattern;
  		this.chunks = [];
  		if (!this.pattern.length) return;
  		const addChunk = (pattern, startIndex) => {
  			this.chunks.push({
  				pattern,
  				alphabet: createPatternAlphabet(pattern),
  				startIndex
  			});
  		};
  		const len = this.pattern.length;
  		if (len > 32) {
  			let i = 0;
  			const remainder = len % 32;
  			const end = len - remainder;
  			while (i < end) {
  				addChunk(this.pattern.substr(i, 32), i);
  				i += 32;
  			}
  			if (remainder) {
  				const startIndex = len - 32;
  				addChunk(this.pattern.substr(startIndex), startIndex);
  			}
  		} else addChunk(this.pattern, 0);
  	}
  	searchIn(text) {
  		const { isCaseSensitive, ignoreDiacritics, includeMatches } = this.options;
  		text = isCaseSensitive ? text : text.toLowerCase();
  		text = ignoreDiacritics ? stripDiacritics(text) : text;
  		if (this.pattern === text) {
  			if (text.length < this.options.minMatchCharLength) return {
  				isMatch: false,
  				score: 1
  			};
  			const result = {
  				isMatch: true,
  				score: 0
  			};
  			if (includeMatches) result.indices = [[0, text.length - 1]];
  			return result;
  		}
  		const { location, distance, threshold, findAllMatches, minMatchCharLength, ignoreLocation } = this.options;
  		const allIndices = [];
  		let totalScore = 0;
  		let hasMatches = false;
  		this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
  			const { isMatch, score, indices } = search(text, pattern, alphabet, {
  				location: location + startIndex,
  				distance,
  				threshold,
  				findAllMatches,
  				minMatchCharLength,
  				includeMatches,
  				ignoreLocation
  			});
  			if (isMatch) hasMatches = true;
  			totalScore += score;
  			if (isMatch && indices) allIndices.push(...indices);
  		});
  		const result = {
  			isMatch: hasMatches,
  			score: hasMatches ? totalScore / this.chunks.length : 1
  		};
  		if (hasMatches && includeMatches) result.indices = mergeIndices(allIndices);
  		return result;
  	}
  };

  //#endregion
  //#region src/search/extended/matchers.ts
  const MULTI_MATCH_TYPES = new Set(["fuzzy", "include"]);
  function isInverse(type) {
  	return type.startsWith("inverse");
  }
  const matchers = [
  	{
  		type: "exact",
  		multiRegex: /^="(.*)"$/,
  		singleRegex: /^=(.*)$/,
  		create: (pattern) => ({
  			type: "exact",
  			search(text) {
  				const isMatch = text === pattern;
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices: [0, pattern.length - 1]
  				};
  			}
  		})
  	},
  	{
  		type: "include",
  		multiRegex: /^'"(.*)"$/,
  		singleRegex: /^'(.*)$/,
  		create: (pattern) => ({
  			type: "include",
  			search(text) {
  				let location = 0;
  				let index;
  				const indices = [];
  				const patternLen = pattern.length;
  				while ((index = text.indexOf(pattern, location)) > -1) {
  					location = index + patternLen;
  					indices.push([index, location - 1]);
  				}
  				const isMatch = !!indices.length;
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices
  				};
  			}
  		})
  	},
  	{
  		type: "prefix-exact",
  		multiRegex: /^\^"(.*)"$/,
  		singleRegex: /^\^(.*)$/,
  		create: (pattern) => ({
  			type: "prefix-exact",
  			search(text) {
  				const isMatch = text.startsWith(pattern);
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices: [0, pattern.length - 1]
  				};
  			}
  		})
  	},
  	{
  		type: "inverse-prefix-exact",
  		multiRegex: /^!\^"(.*)"$/,
  		singleRegex: /^!\^(.*)$/,
  		create: (pattern) => ({
  			type: "inverse-prefix-exact",
  			search(text) {
  				const isMatch = !text.startsWith(pattern);
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices: [0, text.length - 1]
  				};
  			}
  		})
  	},
  	{
  		type: "inverse-suffix-exact",
  		multiRegex: /^!"(.*)"\$$/,
  		singleRegex: /^!(.*)\$$/,
  		create: (pattern) => ({
  			type: "inverse-suffix-exact",
  			search(text) {
  				const isMatch = !text.endsWith(pattern);
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices: [0, text.length - 1]
  				};
  			}
  		})
  	},
  	{
  		type: "suffix-exact",
  		multiRegex: /^"(.*)"\$$/,
  		singleRegex: /^(.*)\$$/,
  		create: (pattern) => ({
  			type: "suffix-exact",
  			search(text) {
  				const isMatch = text.endsWith(pattern);
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices: [text.length - pattern.length, text.length - 1]
  				};
  			}
  		})
  	},
  	{
  		type: "inverse-exact",
  		multiRegex: /^!"(.*)"$/,
  		singleRegex: /^!(.*)$/,
  		create: (pattern) => ({
  			type: "inverse-exact",
  			search(text) {
  				const isMatch = text.indexOf(pattern) === -1;
  				return {
  					isMatch,
  					score: isMatch ? 0 : 1,
  					indices: [0, text.length - 1]
  				};
  			}
  		})
  	},
  	{
  		type: "fuzzy",
  		multiRegex: /^"(.*)"$/,
  		singleRegex: /^(.*)$/,
  		create: (pattern, options = {}) => {
  			const bitap = new BitapSearch(pattern, {
  				location: options.location ?? Config.location,
  				threshold: options.threshold ?? Config.threshold,
  				distance: options.distance ?? Config.distance,
  				includeMatches: options.includeMatches ?? Config.includeMatches,
  				findAllMatches: options.findAllMatches ?? Config.findAllMatches,
  				minMatchCharLength: options.minMatchCharLength ?? Config.minMatchCharLength,
  				isCaseSensitive: options.isCaseSensitive ?? Config.isCaseSensitive,
  				ignoreDiacritics: options.ignoreDiacritics ?? Config.ignoreDiacritics,
  				ignoreLocation: options.ignoreLocation ?? Config.ignoreLocation
  			});
  			return {
  				type: "fuzzy",
  				search(text) {
  					return bitap.searchIn(text);
  				}
  			};
  		}
  	}
  ];

  //#endregion
  //#region src/search/extended/parseQuery.ts
  const matchersLen = matchers.length;
  const ESCAPED_PIPE = "\0";
  const OR_TOKEN = "|";
  function tokenize(pattern) {
  	const tokens = [];
  	const len = pattern.length;
  	let i = 0;
  	while (i < len) {
  		while (i < len && pattern[i] === " ") i++;
  		if (i >= len) break;
  		let j = i;
  		while (j < len && pattern[j] !== " " && pattern[j] !== "\"") j++;
  		if (j < len && pattern[j] === "\"") {
  			j++;
  			while (j < len) {
  				if (pattern[j] === "\"") {
  					const next = j + 1;
  					if (next >= len || pattern[next] === " ") {
  						j++;
  						break;
  					}
  					if (pattern[next] === "$" && (next + 1 >= len || pattern[next + 1] === " ")) {
  						j += 2;
  						break;
  					}
  				}
  				j++;
  			}
  			tokens.push(pattern.substring(i, j));
  			i = j;
  		} else {
  			while (j < len && pattern[j] !== " ") j++;
  			tokens.push(pattern.substring(i, j));
  			i = j;
  		}
  	}
  	return tokens;
  }
  function getMatch(pattern, exp) {
  	const matches = pattern.match(exp);
  	return matches ? matches[1] : null;
  }
  function parseQuery(pattern, options = {}) {
  	return pattern.replace(/\\\|/g, ESCAPED_PIPE).split(OR_TOKEN).map((item) => {
  		const query = tokenize(item.replace(/\u0000/g, "|").trim()).filter((item) => item && !!item.trim());
  		const results = [];
  		for (let i = 0, len = query.length; i < len; i += 1) {
  			const queryItem = query[i];
  			let found = false;
  			let idx = -1;
  			while (!found && ++idx < matchersLen) {
  				const def = matchers[idx];
  				const token = getMatch(queryItem, def.multiRegex);
  				if (token) {
  					results.push(def.create(token, options));
  					found = true;
  				}
  			}
  			if (found) continue;
  			idx = -1;
  			while (++idx < matchersLen) {
  				const def = matchers[idx];
  				const token = getMatch(queryItem, def.singleRegex);
  				if (token) {
  					results.push(def.create(token, options));
  					break;
  				}
  			}
  		}
  		return results;
  	});
  }

  //#endregion
  //#region src/search/extended/index.ts
  var ExtendedSearch = class {
  	constructor(pattern, { isCaseSensitive = Config.isCaseSensitive, ignoreDiacritics = Config.ignoreDiacritics, includeMatches = Config.includeMatches, minMatchCharLength = Config.minMatchCharLength, ignoreLocation = Config.ignoreLocation, findAllMatches = Config.findAllMatches, location = Config.location, threshold = Config.threshold, distance = Config.distance } = {}) {
  		this.query = null;
  		this.options = {
  			isCaseSensitive,
  			ignoreDiacritics,
  			includeMatches,
  			minMatchCharLength,
  			findAllMatches,
  			ignoreLocation,
  			location,
  			threshold,
  			distance
  		};
  		pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
  		pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
  		this.pattern = pattern;
  		this.query = parseQuery(this.pattern, this.options);
  	}
  	static condition(_, options) {
  		return options.useExtendedSearch;
  	}
  	searchIn(text) {
  		const query = this.query;
  		if (!query) return {
  			isMatch: false,
  			score: 1
  		};
  		const { includeMatches, isCaseSensitive, ignoreDiacritics } = this.options;
  		text = isCaseSensitive ? text : text.toLowerCase();
  		text = ignoreDiacritics ? stripDiacritics(text) : text;
  		let numMatches = 0;
  		const allIndices = [];
  		let totalScore = 0;
  		let hasInverse = false;
  		for (let i = 0, qLen = query.length; i < qLen; i += 1) {
  			const searchers = query[i];
  			allIndices.length = 0;
  			numMatches = 0;
  			hasInverse = false;
  			for (let j = 0, pLen = searchers.length; j < pLen; j += 1) {
  				const matcher = searchers[j];
  				const { isMatch, indices, score } = matcher.search(text);
  				if (isMatch) {
  					numMatches += 1;
  					totalScore += score;
  					if (isInverse(matcher.type)) hasInverse = true;
  					if (includeMatches) if (MULTI_MATCH_TYPES.has(matcher.type)) allIndices.push(...indices);
  					else allIndices.push(indices);
  				} else {
  					totalScore = 0;
  					numMatches = 0;
  					allIndices.length = 0;
  					hasInverse = false;
  					break;
  				}
  			}
  			if (numMatches) {
  				const result = {
  					isMatch: true,
  					score: totalScore / numMatches
  				};
  				if (hasInverse) result.hasInverse = true;
  				if (includeMatches) result.indices = mergeIndices(allIndices);
  				return result;
  			}
  		}
  		return {
  			isMatch: false,
  			score: 1
  		};
  	}
  };

  //#endregion
  //#region src/core/register.ts
  const registeredSearchers = [];
  function register(...args) {
  	registeredSearchers.push(...args);
  }
  function createSearcher(pattern, options) {
  	for (let i = 0, len = registeredSearchers.length; i < len; i += 1) {
  		const searcherClass = registeredSearchers[i];
  		if (searcherClass.condition(pattern, options)) return new searcherClass(pattern, options);
  	}
  	return new BitapSearch(pattern, options);
  }

  //#endregion
  //#region src/core/queryParser.ts
  const LogicalOperator = {
  	AND: "$and",
  	OR: "$or"
  };
  const KeyType = {
  	PATH: "$path",
  	PATTERN: "$val"
  };
  const isExpression = (query) => !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);
  const isPath = (query) => !!query[KeyType.PATH];
  const isLeaf = (query) => !isArray(query) && isObject(query) && !isExpression(query);
  const convertToExplicit = (query) => ({ [LogicalOperator.AND]: Object.keys(query).map((key) => ({ [key]: query[key] })) });
  function parse(query, options, { auto = true } = {}) {
  	const next = (query) => {
  		if (isString(query)) {
  			const obj = {
  				keyId: null,
  				pattern: query
  			};
  			if (auto) obj.searcher = createSearcher(query, options);
  			return obj;
  		}
  		const keys = Object.keys(query);
  		const isQueryPath = isPath(query);
  		if (!isQueryPath && keys.length > 1 && !isExpression(query)) return next(convertToExplicit(query));
  		if (isLeaf(query)) {
  			const key = isQueryPath ? query[KeyType.PATH] : keys[0];
  			const pattern = isQueryPath ? query[KeyType.PATTERN] : query[key];
  			if (!isString(pattern)) throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key));
  			const obj = {
  				keyId: createKeyId(key),
  				pattern
  			};
  			if (auto) obj.searcher = createSearcher(pattern, options);
  			return obj;
  		}
  		const node = {
  			children: [],
  			operator: keys[0]
  		};
  		keys.forEach((key) => {
  			const value = query[key];
  			if (isArray(value)) value.forEach((item) => {
  				node.children.push(next(item));
  			});
  		});
  		return node;
  	};
  	if (!isExpression(query)) query = convertToExplicit(query);
  	return next(query);
  }

  //#endregion
  //#region src/core/computeScore.ts
  function computeScoreSingle(matches, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
  	let totalScore = 1;
  	matches.forEach(({ key, norm, score }) => {
  		const weight = key ? key.weight : null;
  		totalScore *= Math.pow(score === 0 && weight ? Number.EPSILON : score, (weight || 1) * (ignoreFieldNorm ? 1 : norm));
  	});
  	return totalScore;
  }
  function computeScore(results, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
  	results.forEach((result) => {
  		result.score = computeScoreSingle(result.matches, { ignoreFieldNorm });
  	});
  }

  //#endregion
  //#region src/tools/MaxHeap.ts
  var MaxHeap = class {
  	constructor(limit, comparator) {
  		this.limit = limit;
  		this.heap = [];
  		this.comparator = comparator;
  	}
  	get size() {
  		return this.heap.length;
  	}
  	insert(item) {
  		if (this.size < this.limit) {
  			this.heap.push(item);
  			this._bubbleUp(this.size - 1);
  		} else if (this.comparator(item, this.heap[0]) < 0) {
  			this.heap[0] = item;
  			this._sinkDown(0);
  		}
  	}
  	extractSorted() {
  		return this.heap.sort(this.comparator);
  	}
  	_bubbleUp(i) {
  		const heap = this.heap;
  		while (i > 0) {
  			const parent = i - 1 >> 1;
  			if (this.comparator(heap[i], heap[parent]) <= 0) break;
  			const tmp = heap[i];
  			heap[i] = heap[parent];
  			heap[parent] = tmp;
  			i = parent;
  		}
  	}
  	_sinkDown(i) {
  		const heap = this.heap;
  		const len = heap.length;
  		let largest = i;
  		do {
  			i = largest;
  			const left = 2 * i + 1;
  			const right = 2 * i + 2;
  			if (left < len && this.comparator(heap[left], heap[largest]) > 0) largest = left;
  			if (right < len && this.comparator(heap[right], heap[largest]) > 0) largest = right;
  			if (largest !== i) {
  				const tmp = heap[i];
  				heap[i] = heap[largest];
  				heap[largest] = tmp;
  			}
  		} while (largest !== i);
  	}
  };

  //#endregion
  //#region src/core/formatMatches.ts
  function formatMatches(result) {
  	const matches = [];
  	result.matches.forEach((match) => {
  		if (!isDefined(match.indices) || !match.indices.length) return;
  		const obj = {
  			indices: match.indices,
  			value: match.value
  		};
  		if (match.key) obj.key = match.key.id;
  		if (match.idx > -1) obj.refIndex = match.idx;
  		matches.push(obj);
  	});
  	return matches;
  }

  //#endregion
  //#region src/core/format.ts
  function format(results, docs, { includeMatches = Config.includeMatches, includeScore = Config.includeScore } = {}) {
  	return results.map((result) => {
  		const { idx } = result;
  		const data = {
  			item: docs[idx],
  			refIndex: idx
  		};
  		if (includeMatches) data.matches = formatMatches(result);
  		if (includeScore) data.score = result.score;
  		return data;
  	});
  }

  //#endregion
  //#region src/search/token/analyzer.ts
  const DEFAULT_TOKEN = /[\p{L}\p{M}\p{N}_]+/gu;
  const warned = /* @__PURE__ */ new WeakSet();
  function warnNonGlobal(regex) {
  	if (!warned.has(regex)) {
  		warned.add(regex);
  		console.warn(`[Fuse] tokenize regex ${regex} lacks the global flag; only the first match per text will be returned. Add the 'g' flag.`);
  	}
  }
  function resolveTokenize(tokenize) {
  	if (typeof tokenize === "function") {
  		let validated = false;
  		return (text) => {
  			const result = tokenize(text);
  			if (!validated) {
  				validated = true;
  				if (!Array.isArray(result) || result.some((t) => typeof t !== "string")) throw new Error(`[Fuse] tokenize function must return string[]; received ${Array.isArray(result) ? "array containing non-strings" : typeof result}.`);
  			}
  			return result;
  		};
  	}
  	if (tokenize instanceof RegExp) {
  		if (!tokenize.global) warnNonGlobal(tokenize);
  		return (text) => text.match(tokenize) || [];
  	}
  	return (text) => text.match(DEFAULT_TOKEN) || [];
  }
  function createAnalyzer({ isCaseSensitive = false, ignoreDiacritics = false, tokenize } = {}) {
  	const tokenizeFn = resolveTokenize(tokenize);
  	return { tokenize(text) {
  		if (!isCaseSensitive) text = text.toLowerCase();
  		if (ignoreDiacritics) text = stripDiacritics(text);
  		return tokenizeFn(text);
  	} };
  }
  var TokenSearch = class {
  	static condition(_, options) {
  		return options.useTokenSearch;
  	}
  	constructor(pattern, options) {
  		this.options = options;
  		this.analyzer = createAnalyzer({
  			isCaseSensitive: options.isCaseSensitive,
  			ignoreDiacritics: options.ignoreDiacritics,
  			tokenize: options.tokenize
  		});
  		const queryTerms = this.analyzer.tokenize(pattern);
  		const { df, fieldCount } = options._invertedIndex;
  		this.termSearchers = [];
  		this.idfWeights = [];
  		for (const term of queryTerms) {
  			this.termSearchers.push(new BitapSearch(term, {
  				location: options.location,
  				threshold: options.threshold,
  				distance: options.distance,
  				includeMatches: options.includeMatches,
  				findAllMatches: options.findAllMatches,
  				minMatchCharLength: options.minMatchCharLength,
  				isCaseSensitive: options.isCaseSensitive,
  				ignoreDiacritics: options.ignoreDiacritics,
  				ignoreLocation: true
  			}));
  			const docFreq = df.get(term) || 0;
  			const idf = Math.log(1 + (fieldCount - docFreq + .5) / (docFreq + .5));
  			this.idfWeights.push(idf);
  		}
  		this.combineAll = options.tokenMatch === "all";
  		this.numTerms = this.termSearchers.length;
  		this.useMask = this.numTerms <= 31;
  	}
  	searchIn(text) {
  		if (!this.termSearchers.length) return {
  			isMatch: false,
  			score: 1
  		};
  		const allIndices = [];
  		let weightedScore = 0;
  		let maxPossibleScore = 0;
  		let matchedCount = 0;
  		let matchedMask = 0;
  		const matchedTerms = this.combineAll && !this.useMask ? /* @__PURE__ */ new Set() : null;
  		for (let i = 0; i < this.termSearchers.length; i++) {
  			const result = this.termSearchers[i].searchIn(text);
  			const idf = this.idfWeights[i];
  			maxPossibleScore += idf;
  			if (result.isMatch) {
  				matchedCount++;
  				weightedScore += idf * (1 - result.score);
  				if (result.indices) allIndices.push(...result.indices);
  				if (this.combineAll) if (this.useMask) matchedMask |= 1 << i;
  				else matchedTerms.add(i);
  			}
  		}
  		if (matchedCount === 0) return {
  			isMatch: false,
  			score: 1
  		};
  		const normalized = maxPossibleScore > 0 ? 1 - weightedScore / maxPossibleScore : 0;
  		const searchResult = {
  			isMatch: true,
  			score: Math.max(.001, normalized)
  		};
  		if (this.options.includeMatches && allIndices.length) searchResult.indices = mergeIndices(allIndices);
  		if (this.combineAll) {
  			if (this.useMask) searchResult.matchedMask = matchedMask;
  			else searchResult.matchedTerms = matchedTerms;
  			searchResult.termCount = this.numTerms;
  		}
  		return searchResult;
  	}
  };

  //#endregion
  //#region src/search/token/InvertedIndex.ts
  function addField(index, text, docIdx, analyzer) {
  	const tokens = analyzer.tokenize(text);
  	if (!tokens.length) return;
  	index.fieldCount++;
  	index.docFieldCount.set(docIdx, (index.docFieldCount.get(docIdx) || 0) + 1);
  	const distinctTerms = new Set(tokens);
  	let perDocTerms = index.docTermFieldHits.get(docIdx);
  	if (!perDocTerms) {
  		perDocTerms = /* @__PURE__ */ new Map();
  		index.docTermFieldHits.set(docIdx, perDocTerms);
  	}
  	for (const term of distinctTerms) {
  		perDocTerms.set(term, (perDocTerms.get(term) || 0) + 1);
  		index.df.set(term, (index.df.get(term) || 0) + 1);
  	}
  }
  function ingestRecord(index, record, keyCount, analyzer) {
  	const { i: docIdx, v, $: fields } = record;
  	if (v !== void 0) {
  		addField(index, v, docIdx, analyzer);
  		return;
  	}
  	if (!fields) return;
  	for (let keyIdx = 0; keyIdx < keyCount; keyIdx++) {
  		const value = fields[keyIdx];
  		if (!value) continue;
  		if (Array.isArray(value)) for (const sub of value) addField(index, sub.v, docIdx, analyzer);
  		else addField(index, value.v, docIdx, analyzer);
  	}
  }
  function buildInvertedIndex(records, keyCount, analyzer) {
  	const index = {
  		fieldCount: 0,
  		df: /* @__PURE__ */ new Map(),
  		docFieldCount: /* @__PURE__ */ new Map(),
  		docTermFieldHits: /* @__PURE__ */ new Map()
  	};
  	for (const record of records) ingestRecord(index, record, keyCount, analyzer);
  	return index;
  }
  function addToInvertedIndex(index, record, keyCount, analyzer) {
  	ingestRecord(index, record, keyCount, analyzer);
  }
  function removeFromInvertedIndex(index, docIdx) {
  	const fieldCount = index.docFieldCount.get(docIdx);
  	if (fieldCount === void 0) return;
  	index.fieldCount -= fieldCount;
  	index.docFieldCount.delete(docIdx);
  	const perDocTerms = index.docTermFieldHits.get(docIdx);
  	if (!perDocTerms) return;
  	for (const [term, hits] of perDocTerms) {
  		const next = (index.df.get(term) || 0) - hits;
  		if (next <= 0) index.df.delete(term);
  		else index.df.set(term, next);
  	}
  	index.docTermFieldHits.delete(docIdx);
  }
  function removeAndShiftInvertedIndex(index, removedIndices) {
  	if (removedIndices.length === 0) return;
  	const sorted = Array.from(new Set(removedIndices)).sort((a, b) => a - b);
  	for (const idx of sorted) removeFromInvertedIndex(index, idx);
  	const shift = (oldIdx) => {
  		let lo = 0;
  		let hi = sorted.length;
  		while (lo < hi) {
  			const mid = lo + hi >>> 1;
  			if (sorted[mid] < oldIdx) lo = mid + 1;
  			else hi = mid;
  		}
  		return oldIdx - lo;
  	};
  	const firstRemoved = sorted[0];
  	const shiftedDocFieldCount = /* @__PURE__ */ new Map();
  	for (const [oldKey, count] of index.docFieldCount) shiftedDocFieldCount.set(oldKey > firstRemoved ? shift(oldKey) : oldKey, count);
  	index.docFieldCount = shiftedDocFieldCount;
  	const shiftedDocTermFieldHits = /* @__PURE__ */ new Map();
  	for (const [oldKey, terms] of index.docTermFieldHits) shiftedDocTermFieldHits.set(oldKey > firstRemoved ? shift(oldKey) : oldKey, terms);
  	index.docTermFieldHits = shiftedDocTermFieldHits;
  }

  //#endregion
  //#region src/core/index.ts
  var Fuse = class {
  	constructor(docs, options, index) {
  		this.options = {
  			...Config,
  			...options
  		};
  		if (this.options.useExtendedSearch && false);
  		if (this.options.useTokenSearch && false);
  		this._keyStore = new KeyStore(this.options.keys);
  		this._docs = docs;
  		this._myIndex = null;
  		this._invertedIndex = null;
  		this.setCollection(docs, index);
  		this._lastQuery = null;
  		this._lastSearcher = null;
  	}
  	_getSearcher(query) {
  		if (this._lastQuery === query) return this._lastSearcher;
  		const searcher = createSearcher(query, this._invertedIndex ? {
  			...this.options,
  			_invertedIndex: this._invertedIndex
  		} : this.options);
  		this._lastQuery = query;
  		this._lastSearcher = searcher;
  		return searcher;
  	}
  	setCollection(docs, index) {
  		this._docs = docs;
  		if (index && !(index instanceof FuseIndex)) throw new Error(INCORRECT_INDEX_TYPE);
  		this._myIndex = index || createIndex(this.options.keys, this._docs, {
  			getFn: this.options.getFn,
  			fieldNormWeight: this.options.fieldNormWeight
  		});
  		if (this.options.useTokenSearch) {
  			const analyzer = createAnalyzer({
  				isCaseSensitive: this.options.isCaseSensitive,
  				ignoreDiacritics: this.options.ignoreDiacritics,
  				tokenize: this.options.tokenize
  			});
  			this._invertedIndex = buildInvertedIndex(this._myIndex.records, this._myIndex.keys.length, analyzer);
  		}
  		this._invalidateSearcherCache();
  	}
  	add(doc) {
  		if (!isDefined(doc)) return;
  		this._docs.push(doc);
  		const record = this._myIndex.add(doc, this._docs.length - 1);
  		if (this._invertedIndex && record) {
  			const analyzer = createAnalyzer({
  				isCaseSensitive: this.options.isCaseSensitive,
  				ignoreDiacritics: this.options.ignoreDiacritics,
  				tokenize: this.options.tokenize
  			});
  			addToInvertedIndex(this._invertedIndex, record, this._myIndex.keys.length, analyzer);
  		}
  		this._invalidateSearcherCache();
  	}
  	remove(predicate = () => false) {
  		const results = [];
  		const indicesToRemove = [];
  		for (let i = 0, len = this._docs.length; i < len; i += 1) if (predicate(this._docs[i], i)) {
  			results.push(this._docs[i]);
  			indicesToRemove.push(i);
  		}
  		if (indicesToRemove.length) {
  			if (this._invertedIndex) removeAndShiftInvertedIndex(this._invertedIndex, indicesToRemove);
  			const toRemove = new Set(indicesToRemove);
  			this._docs = this._docs.filter((_, i) => !toRemove.has(i));
  			this._myIndex.removeAll(indicesToRemove);
  			this._invalidateSearcherCache();
  		}
  		return results;
  	}
  	removeAt(idx) {
  		if (!Number.isInteger(idx) || idx < 0 || idx >= this._docs.length) throw new Error(INVALID_DOC_INDEX);
  		if (this._invertedIndex) removeAndShiftInvertedIndex(this._invertedIndex, [idx]);
  		const doc = this._docs.splice(idx, 1)[0];
  		this._myIndex.removeAt(idx);
  		this._invalidateSearcherCache();
  		return doc;
  	}
  	_invalidateSearcherCache() {
  		this._lastQuery = null;
  		this._lastSearcher = null;
  	}
  	getIndex() {
  		return this._myIndex;
  	}
  	_normalizedKeys() {
  		return this._myIndex.keys.map((key) => this._keyStore.get(key.id) || key);
  	}
  	search(query, options) {
  		const { limit = -1 } = options || {};
  		const { includeMatches, includeScore, shouldSort, sortFn, ignoreFieldNorm } = this.options;
  		if (isString(query) && !query.trim()) {
  			let docs = this._docs.map((item, idx) => ({
  				item,
  				refIndex: idx
  			}));
  			if (isNumber(limit) && limit > -1) docs = docs.slice(0, limit);
  			return docs;
  		}
  		const useHeap = shouldSort && isNumber(limit) && limit > 0 && isString(query);
  		const comparator = sortFn;
  		const stable = (a, b) => comparator(a, b) || a.idx - b.idx;
  		let results;
  		if (useHeap) {
  			const heap = new MaxHeap(limit, stable);
  			if (isString(this._docs[0])) this._searchStringList(query, {
  				heap,
  				ignoreFieldNorm
  			});
  			else this._searchObjectList(query, {
  				heap,
  				ignoreFieldNorm
  			});
  			results = heap.extractSorted();
  		} else {
  			results = isString(query) ? isString(this._docs[0]) ? this._searchStringList(query) : this._searchObjectList(query) : this._searchLogical(query);
  			computeScore(results, { ignoreFieldNorm });
  			if (shouldSort) results.sort(isString(query) ? stable : comparator);
  			if (isNumber(limit) && limit > -1) results = results.slice(0, limit);
  		}
  		return format(results, this._docs, {
  			includeMatches,
  			includeScore
  		});
  	}
  	_searchStringList(query, { heap, ignoreFieldNorm } = {}) {
  		const searcher = this._getSearcher(query);
  		const requireAllTokens = this.options.useTokenSearch && this.options.tokenMatch === "all";
  		const { records } = this._myIndex;
  		const results = heap ? null : [];
  		records.forEach(({ v: text, i: idx, n: norm }) => {
  			if (!isDefined(text)) return;
  			const searchResult = searcher.searchIn(text);
  			if (searchResult.isMatch) {
  				const match = {
  					score: searchResult.score,
  					value: text,
  					norm,
  					indices: searchResult.indices
  				};
  				if (requireAllTokens) {
  					match.matchedMask = searchResult.matchedMask;
  					match.matchedTerms = searchResult.matchedTerms;
  					match.termCount = searchResult.termCount;
  				}
  				const matches = [match];
  				if (!requireAllTokens || this._coversAllTokens(matches)) {
  					const result = {
  						item: text,
  						idx,
  						matches
  					};
  					if (heap) {
  						result.score = computeScoreSingle(result.matches, { ignoreFieldNorm });
  						heap.insert(result);
  					} else results.push(result);
  				}
  			}
  		});
  		return results;
  	}
  	_searchLogical(query) {
  		const expression = parse(query, this.options);
  		const keys = this._normalizedKeys();
  		const evaluate = (node, item, idx) => {
  			if (!("children" in node)) {
  				const { keyId, searcher } = node;
  				let matches;
  				if (keyId === null) {
  					matches = [];
  					keys.forEach((key, keyIndex) => {
  						matches.push(...this._findMatches({
  							key,
  							value: item[keyIndex],
  							searcher
  						}));
  					});
  				} else matches = this._findMatches({
  					key: this._keyStore.get(keyId),
  					value: this._myIndex.getValueForItemAtKeyId(item, keyId),
  					searcher
  				});
  				if (matches && matches.length) return [{
  					idx,
  					item,
  					matches
  				}];
  				return [];
  			}
  			const { children, operator } = node;
  			const res = [];
  			for (let i = 0, len = children.length; i < len; i += 1) {
  				const child = children[i];
  				const result = evaluate(child, item, idx);
  				if (result.length) res.push(...result);
  				else if (operator === LogicalOperator.AND) return [];
  			}
  			return res;
  		};
  		const records = this._myIndex.records;
  		const resultMap = /* @__PURE__ */ new Map();
  		const results = [];
  		records.forEach(({ $: item, i: idx }) => {
  			if (isDefined(item)) {
  				const expResults = evaluate(expression, item, idx);
  				if (expResults.length) {
  					if (!resultMap.has(idx)) {
  						resultMap.set(idx, {
  							idx,
  							item,
  							matches: []
  						});
  						results.push(resultMap.get(idx));
  					}
  					expResults.forEach(({ matches }) => {
  						resultMap.get(idx).matches.push(...matches);
  					});
  				}
  			}
  		});
  		return results;
  	}
  	_searchObjectList(query, { heap, ignoreFieldNorm } = {}) {
  		const searcher = this._getSearcher(query);
  		const requireAllTokens = this.options.useTokenSearch && this.options.tokenMatch === "all";
  		const { records } = this._myIndex;
  		const keys = this._normalizedKeys();
  		const results = heap ? null : [];
  		records.forEach(({ $: item, i: idx }) => {
  			if (!isDefined(item)) return;
  			const matches = [];
  			let anyKeyFailed = false;
  			let hasInverse = false;
  			keys.forEach((key, keyIndex) => {
  				const keyMatches = this._findMatches({
  					key,
  					value: item[keyIndex],
  					searcher
  				});
  				if (keyMatches.length) {
  					matches.push(...keyMatches);
  					if (keyMatches[0].hasInverse) hasInverse = true;
  				} else anyKeyFailed = true;
  			});
  			if (hasInverse && anyKeyFailed) return;
  			if (matches.length && (!requireAllTokens || this._coversAllTokens(matches))) {
  				const result = {
  					idx,
  					item,
  					matches
  				};
  				if (heap) {
  					result.score = computeScoreSingle(result.matches, { ignoreFieldNorm });
  					heap.insert(result);
  				} else results.push(result);
  			}
  		});
  		return results;
  	}
  	_findMatches({ key, value, searcher }) {
  		if (!isDefined(value)) return [];
  		const matches = [];
  		if (isArray(value)) value.forEach(({ v: text, i: idx, n: norm }) => {
  			if (!isDefined(text)) return;
  			const searchResult = searcher.searchIn(text);
  			if (searchResult.isMatch) {
  				const match = {
  					score: searchResult.score,
  					key,
  					value: text,
  					idx,
  					norm,
  					indices: searchResult.indices,
  					hasInverse: searchResult.hasInverse
  				};
  				if (searchResult.termCount !== void 0) {
  					match.matchedMask = searchResult.matchedMask;
  					match.matchedTerms = searchResult.matchedTerms;
  					match.termCount = searchResult.termCount;
  				}
  				matches.push(match);
  			}
  		});
  		else {
  			const { v: text, n: norm } = value;
  			const searchResult = searcher.searchIn(text);
  			if (searchResult.isMatch) {
  				const match = {
  					score: searchResult.score,
  					key,
  					value: text,
  					norm,
  					indices: searchResult.indices,
  					hasInverse: searchResult.hasInverse
  				};
  				if (searchResult.termCount !== void 0) {
  					match.matchedMask = searchResult.matchedMask;
  					match.matchedTerms = searchResult.matchedTerms;
  					match.termCount = searchResult.termCount;
  				}
  				matches.push(match);
  			}
  		}
  		return matches;
  	}
  	_coversAllTokens(matches) {
  		const termCount = matches.length ? matches[0].termCount : void 0;
  		if (termCount === void 0) return true;
  		if (termCount <= 31) {
  			let coverage = 0;
  			for (let i = 0; i < matches.length; i++) coverage |= matches[i].matchedMask || 0;
  			return coverage === 2 ** termCount - 1;
  		}
  		const coverage = /* @__PURE__ */ new Set();
  		for (let i = 0; i < matches.length; i++) {
  			const terms = matches[i].matchedTerms;
  			if (terms) for (const t of terms) coverage.add(t);
  		}
  		return coverage.size === termCount;
  	}
  };

  //#endregion
  //#region src/entry.ts
  Fuse.version = "7.5.0";
  Fuse.createIndex = createIndex;
  Fuse.parseIndex = parseIndex;
  Fuse.config = Config;
  Fuse.match = function(pattern, text, options) {
  	if (options && options.useTokenSearch) throw new Error(FUSE_MATCH_TOKEN_SEARCH_UNSUPPORTED);
  	return createSearcher(pattern, {
  		...Config,
  		...options
  	}).searchIn(text);
  };
  Fuse.parseQuery = parse;
  register(ExtendedSearch);
  register(TokenSearch);
  Fuse.use = function(...plugins) {
  	plugins.forEach((plugin) => register(plugin));
  };
  var entry_default = Fuse;

  const DEFAULT_SEARCH_OPTIONS = {
      includeScore: true,
      ignoreDiacritics: true,
      ignoreLocation: true,
      threshold: 0.35,
      keys: [
          { name: 'name', weight: 0.7 },
          { name: 'greyName', weight: 0.3 },
      ],
  };
  function normalizeSearchName(name) {
      return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }
  function hasSameSearchName(candidate, name) {
      const normalizedName = normalizeSearchName(name);
      return !!normalizedName && [candidate.name, candidate.greyName ?? '']
          .some((candidateName) => normalizeSearchName(candidateName) === normalizedName);
  }
  /**
   * 排序搜索引擎召回的候选。精确标题始终优先，Fuse 只负责相似标题的
   * 召回和排序，不参与“是否为同一条目”的最终判断。
   */
  function rankSearchResults(items, searchName, opts = {}) {
      const name = searchName.trim();
      if (!name || !items.length)
          return [];
      const exact = items.filter((item) => hasSameSearchName(item, name));
      const exactUrls = new Set(exact.map(({ url }) => url));
      const fuzzy = new entry_default(items, { ...DEFAULT_SEARCH_OPTIONS, ...opts })
          .search(name)
          .map(({ item }) => item)
          .filter(({ url }) => !exactUrls.has(url));
      return [...exact, ...fuzzy];
  }
  /**
   * 过滤搜索结果： 通过名称以及日期
   * @param items
   * @param subjectInfo
   * @param opts
   */
  function filterResults(items, subjectInfo, opts = {}) {
      const searchName = subjectInfo.name?.trim();
      if (!searchName)
          return;
      const results = rankSearchResults(items, searchName, opts);
      if (!results.length)
          return;
      if (subjectInfo.releaseDate) {
          const sameDate = results.find(({ releaseDate }) => releaseDate && isEqualDate(releaseDate, subjectInfo.releaseDate));
          if (sameDate)
              return sameDate;
      }
      return results[0];
  }
  function toStringValue(value) {
      if (value === null || value === undefined) {
          return undefined;
      }
      return String(value);
  }
  function getQueryInfo(items) {
      const info = {};
      items.forEach((item) => {
          const value = toStringValue(item.value);
          if (!value) {
              return;
          }
          if (item.category === 'subject_title') {
              info.name = value;
          }
          if (item.category === 'date') {
              info.releaseDate = value;
          }
          if (item.category === 'ASIN') {
              info.asin = value;
          }
          if (item.category === 'ISBN') {
              info.isbn = value;
          }
      });
      return info;
  }

  // This file is generated by bin/sync-version.js.
  const APP_VERSION = '0.7.2';

  const platformSans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  const simplifiedChinese = '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC"';
  const UI_FONT_STACK = `${platformSans}, ${simplifiedChinese}, system-ui, sans-serif`;
  const JAPANESE_FONT_STACK = `${platformSans}, "Hiragino Sans", "Yu Gothic UI", Meiryo, "Noto Sans CJK JP", "Noto Sans JP", system-ui, sans-serif`;
  const MONOSPACE_FONT_STACK = `"Cascadia Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", ${simplifiedChinese}, ui-monospace, monospace`;

  // Kept inline in the dialog's shadow root for both browser builds.
  const debugDialogStyle = `
  :host { all: initial !important; display: contents !important; }
  [hidden] { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }

  .e-bnwh-debug-dialog {
    --ink: #172235;
    --muted: #526278;
    --line: #dce4ee;
    --surface: #f5f7fb;
    --accent: #174db5;
    --accent-bg: #ebf2ff;
    --gutter: 24px;
    --mono: ${MONOSPACE_FONT_STACK};
    width: min(940px, calc(100vw - 32px));
    max-width: none;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    margin: auto;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: 0 24px 72px rgb(12 25 47 / 24%);
    background: #fff;
    color: var(--ink);
    color-scheme: light;
    font: 14px/1.55 ${UI_FONT_STACK};
    text-align: start;
  }
  .e-bnwh-debug-dialog::backdrop { background: rgb(16 29 50 / 50%); }
  .e-bnwh-debug-shell {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto minmax(128px, 1fr) auto;
    height: min(740px, calc(100vh - 34px));
    height: min(740px, calc(100dvh - 34px));
  }
  .e-bnwh-debug-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 18px var(--gutter) 14px;
  }
  .e-bnwh-debug-heading { min-width: 0; }
  .e-bnwh-debug-title { margin: 0; font-size: 20px; font-weight: 700; line-height: 1.35; }
  .e-bnwh-debug-title:focus { outline: none; }
  .e-bnwh-debug-context {
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--muted);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .e-bnwh-debug-close-icon {
    flex: none;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
    color: var(--muted);
    font: inherit;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  .e-bnwh-debug-close-icon:hover { background: var(--surface); color: var(--ink); }

  .e-bnwh-debug-findings {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 18px;
    row-gap: 6px;
    margin: 0;
    padding: 9px var(--gutter);
    border-block: 1px solid var(--line);
    background: var(--surface);
  }
  .e-bnwh-debug-findings-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
  }
  .e-bnwh-debug-findings-title::before {
    content: "";
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .e-bnwh-debug-findings[data-level="ok"] .e-bnwh-debug-findings-title { color: #166746; }
  .e-bnwh-debug-findings[data-level="warning"] .e-bnwh-debug-findings-title { color: #8a4506; }
  .e-bnwh-debug-findings[data-level="error"] .e-bnwh-debug-findings-title { color: #a52231; }
  .e-bnwh-debug-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 3px 16px;
    margin: 0 0 0 auto;
    font-size: 12px;
  }
  .e-bnwh-debug-summary > div { display: flex; align-items: baseline; gap: 5px; min-width: 0; }
  .e-bnwh-debug-summary dt { color: var(--muted); white-space: nowrap; }
  .e-bnwh-debug-summary dd {
    margin: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-summary .e-bnwh-debug-site { font-family: var(--mono); }
  .e-bnwh-debug-issues {
    flex-basis: 100%;
    max-height: 68px;
    margin: 0;
    padding-inline-start: 23px;
    overflow: auto;
    color: var(--muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .e-bnwh-debug-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    padding-inline: var(--gutter);
    border-bottom: 1px solid var(--line);
  }
  .e-bnwh-debug-tabs { display: flex; min-width: 0; gap: 14px; }
  .e-bnwh-debug-tab {
    position: relative;
    padding: 11px 4px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    cursor: pointer;
  }
  .e-bnwh-debug-tab:hover { color: var(--ink); }
  .e-bnwh-debug-tab[aria-selected="true"] { color: var(--accent); font-weight: 700; }
  .e-bnwh-debug-tab[aria-selected="true"]::after {
    content: "";
    position: absolute;
    inset: auto 0 -1px;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
  }
  .e-bnwh-debug-source-wrap { min-width: 0; margin-left: auto; padding-block: 4px; }
  .e-bnwh-debug-source {
    width: auto;
    max-width: min(250px, 100%);
    min-height: 32px;
    padding: 4px 8px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 13px;
  }

  .e-bnwh-debug-panel { min-width: 0; min-height: 0; padding: 14px var(--gutter); overflow: auto; }
  .e-bnwh-debug-panel[data-panel="fields"] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
    overflow: hidden;
  }
  .e-bnwh-debug-filter { display: flex; align-items: center; gap: 10px; }
  .e-bnwh-debug-search {
    flex: 1;
    min-width: 0;
    max-width: 360px;
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
  }
  .e-bnwh-debug-search::placeholder { color: var(--muted); opacity: 1; }
  .e-bnwh-debug-results {
    margin-left: auto;
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .e-bnwh-debug-table-scroll {
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
  }
  .e-bnwh-debug-table { width: 100%; border-spacing: 0; table-layout: fixed; }
  .e-bnwh-debug-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
    color: var(--muted);
    text-align: start;
    font-size: 13px;
    font-weight: 600;
  }
  .e-bnwh-debug-table td {
    padding: 9px 10px;
    border-bottom: 1px solid #edf1f6;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-table tr:nth-child(even) { background: #fafbfd; }
  .e-bnwh-debug-table tr.is-problem { background: #fff7ed; }
  .e-bnwh-debug-table tr:last-child td { border-bottom: 0; }
  .e-bnwh-debug-table th:nth-child(1) { width: 44px; }
  .e-bnwh-debug-table th:nth-child(2) { width: 19%; }
  .e-bnwh-debug-table th:nth-child(3) { width: 18%; }
  .e-bnwh-debug-table td:first-child {
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .e-bnwh-debug-table td:nth-child(2) { font-weight: 600; }
  .e-bnwh-debug-table td:nth-child(3) { color: var(--muted); font: 13px/1.55 var(--mono); }
  .e-bnwh-debug-table td:last-child { line-height: 1.65; white-space: pre-wrap; }
  .e-bnwh-debug-table td:last-child:lang(ja) { font-family: ${JAPANESE_FONT_STACK}; }
  .e-bnwh-debug-mobile-category { display: none; }
  .e-bnwh-debug-empty { margin: 0; padding: 24px 12px; color: var(--muted); text-align: center; }

  .e-bnwh-debug-selector-note { margin: 0 0 10px; color: var(--muted); font-size: 12px; }
  .e-bnwh-debug-selector-list { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .e-bnwh-debug-selector-list details + details { border-top: 1px solid var(--line); }
  .e-bnwh-debug-selector-list summary {
    padding: 9px 12px;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-selector-list summary:hover,
  .e-bnwh-debug-selector-list details[open] summary { background: var(--surface); }
  .e-bnwh-debug-selector-status { color: var(--muted); font-weight: 600; }
  [data-result="matched"] .e-bnwh-debug-selector-status { color: #166746; }
  [data-result="empty"] .e-bnwh-debug-selector-status { color: #8a4506; }
  [data-result="error"] .e-bnwh-debug-selector-status { color: #a52231; }
  .e-bnwh-debug-selector-list pre {
    margin: 0;
    padding: 10px 14px;
    border-top: 1px solid var(--line);
    background: #fafbfd;
    font: 13px/1.6 var(--mono);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-panel[data-panel="json"] { display: flex; overflow: hidden; }
  .e-bnwh-debug-json {
    width: 100%;
    min-height: 0;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    font: 13px/1.65 var(--mono);
    resize: none;
  }

  .e-bnwh-debug-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px 8px;
    padding: 10px var(--gutter);
    border-top: 1px solid var(--line);
    background: var(--surface);
  }
  .e-bnwh-debug-privacy { margin: 0 auto 0 0; color: var(--muted); font-size: 12px; }
  .e-bnwh-debug-button {
    min-height: 34px;
    padding: 4px 11px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
  }
  .e-bnwh-debug-button:hover { border-color: #a7b6ce; background: var(--accent-bg); }
  .e-bnwh-debug-button-primary { border-color: var(--accent); background: var(--accent); color: #fff; }
  .e-bnwh-debug-button-primary:hover { border-color: #123b88; background: #123b88; }
  :is(button, input, select, textarea, summary, [tabindex="0"]):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .e-bnwh-debug-selector-list summary:focus-visible { outline-offset: -2px; }

  @media (max-width: 620px) {
    .e-bnwh-debug-dialog {
      --gutter: 12px;
      width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
      max-height: calc(100dvh - 16px);
    }
    .e-bnwh-debug-shell {
      height: min(740px, calc(100vh - 18px));
      height: min(740px, calc(100dvh - 18px));
    }
    .e-bnwh-debug-header { padding-block: 14px 10px; }
    .e-bnwh-debug-title { font-size: 18px; }
    .e-bnwh-debug-summary { margin-left: 0; gap: 3px 12px; }
    .e-bnwh-debug-tabs { gap: 10px; }
    .e-bnwh-debug-source-wrap { margin-left: 0; }
    .e-bnwh-debug-table :is(th, td) { padding: 7px 5px; }
    .e-bnwh-debug-table th:nth-child(1) { width: 29px; }
    .e-bnwh-debug-table th:nth-child(2) { width: 29%; }
    .e-bnwh-debug-table :is(th, td):nth-child(3) { display: none; }
    .e-bnwh-debug-mobile-category {
      display: block;
      margin-top: 2px;
      color: var(--muted);
      font: 12px/1.45 var(--mono);
    }
    .e-bnwh-debug-privacy { flex-basis: 100%; }
    .e-bnwh-debug-footer { justify-content: flex-start; }
    .e-bnwh-debug-button { flex: 1 0 auto; }
  }

  @media (max-width: 620px) and (max-height: 650px) {
    .e-bnwh-debug-header { padding-block: 10px 8px; }
    .e-bnwh-debug-findings { padding-block: 6px; row-gap: 3px; }
    .e-bnwh-debug-issues { max-height: 40px; }
    .e-bnwh-debug-toolbar { row-gap: 2px; }
    .e-bnwh-debug-tab { padding-block: 8px; }
    .e-bnwh-debug-panel { padding-block: 9px; }
    .e-bnwh-debug-panel[data-panel="fields"] { gap: 7px; }
    .e-bnwh-debug-footer { padding-block: 7px; }
  }
`;

  const EXPORT_FORMAT = 'bnwh-export/1';
  const DEBUG_FAILURE_FORMAT = 'bnwh-diagnostics/1';
  const KIND_LABELS = {
      subject: '条目',
      character: '角色',
      person: '人物',
  };
  const COPY_REPORT_LABEL = '复制排查报告';
  const COPY_JSON_LABEL = '复制 JSON';
  const COPIED_LABEL = '已复制';
  const DEBUG_HOST_CLASS = 'e-bnwh-debug-host';
  const debugSources = new Map();
  let currentView;
  function buildExportPayload(input) {
      return {
          format: EXPORT_FORMAT,
          helperVersion: APP_VERSION,
          kind: input.kind,
          site: input.site,
          sourceUrl: input.sourceUrl,
          exportedAt: (input.exportedAt ?? new Date()).toISOString(),
          data: input.data,
      };
  }
  function getExportFileName(payload) {
      const stamp = payload.exportedAt
          .replace(/[-:]/g, '')
          .replace(/\.\d{3}Z$/, 'Z');
      return `bnwh-${payload.kind}-${payload.site}-${stamp}.json`;
  }
  function isEmptyValue(value) {
      if (value === null || value === undefined)
          return true;
      if (typeof value === 'string')
          return value.trim() === '';
      if (Array.isArray(value))
          return value.length === 0;
      if (typeof value === 'object')
          return Object.keys(value).length === 0;
      return false;
  }
  function inspectExportPayload(payload) {
      const { infos } = payload.data;
      const issues = [];
      if (!infos.length) {
          issues.push({
              severity: 'error',
              code: 'no-fields',
              message: '没有提取到任何字段，请检查页面结构或来源配置。',
          });
          return issues;
      }
      const primaryCategory = payload.kind === 'subject' ? 'subject_title' : 'crt_name';
      const primaryLabel = payload.kind === 'subject' ? '主标题' : '姓名';
      const hasPrimary = infos.some((info) => info.category === primaryCategory && !isEmptyValue(info.value));
      if (!hasPrimary) {
          issues.push({
              severity: 'error',
              code: 'missing-primary-field',
              message: `缺少有效的${primaryLabel}字段（${primaryCategory}）。`,
          });
      }
      const seen = new Map();
      infos.forEach((info, fieldIndex) => {
          const isCover = info.category === 'cover' || info.category === 'crt_cover';
          if (isEmptyValue(info.value) && !isCover) {
              issues.push({
                  severity: 'warning',
                  code: 'empty-field',
                  fieldIndex,
                  message: `字段“${info.name}”没有值。`,
              });
          }
          if (isCover &&
              !getCoverValue(info.value)?.url &&
              !getCoverValue(info.value)?.dataUrl &&
              !getStringValue(info.value).trim()) {
              issues.push({
                  severity: 'warning',
                  code: 'empty-cover',
                  fieldIndex,
                  message: `封面字段“${info.name}”不包含可用的图片地址或数据。`,
              });
          }
          const key = `${info.name}\u0000${info.category ?? ''}\u0000${JSON.stringify(info.value)}`;
          const previousIndex = seen.get(key);
          if (previousIndex !== undefined) {
              issues.push({
                  severity: 'warning',
                  code: 'duplicate-field',
                  fieldIndex,
                  message: `字段“${info.name}”与第 ${previousIndex + 1} 项完全重复。`,
              });
          }
          else {
              seen.set(key, fieldIndex);
          }
      });
      return issues;
  }
  function registerDebugSource(source) {
      debugSources.set(source.id, source);
      return () => {
          if (debugSources.get(source.id) === source)
              debugSources.delete(source.id);
      };
  }
  function registerPageDebugFallback(source, model) {
      const matchesUrl = model.urlRules?.some((rule) => rule.test(location.href));
      registerDebugSource({
          ...source,
          menuFallback: matchesUrl ? 'url-match' : 'host-match',
          collect: async (report) => {
              const anchors = [
                  ['页面识别', model.pageSelectors],
                  ['按钮挂载位置', model.controlSelector],
              ];
              for (const [name, selector] of anchors) {
                  const check = createSelectorCheck(name);
                  try {
                      if (resolveSelectorMatch(selector, undefined, check.attempts)) {
                          check.result = 'matched';
                      }
                  }
                  catch (error) {
                      check.result = 'error';
                      check.error = String(error).slice(0, 300);
                  }
                  report(check);
                  if (check.result !== 'matched') {
                      throw new Error(`${name}未通过，请查看选择器诊断。`);
                  }
              }
              throw new Error('页面和挂载位置均已命中，但此来源的页面按钮尚未初始化。');
          },
      });
  }
  function serializeError(error) {
      if (error instanceof Error) {
          return { name: error.name, message: error.message, stack: error.stack };
      }
      return { name: 'Error', message: String(error) };
  }
  function buildFailureReport(source, error) {
      return {
          format: DEBUG_FAILURE_FORMAT,
          helperVersion: APP_VERSION,
          source: { id: source.id, label: source.label },
          sourceUrl: location.href,
          capturedAt: new Date().toISOString(),
          error: serializeError(error),
      };
  }
  async function openDebugSource(source) {
      const selectorChecks = [];
      try {
          const payload = await source.collect((check) => selectorChecks.push(check));
          showExportDialog(payload, source.id, selectorChecks);
      }
      catch (error) {
          console.error('bnwh diagnostic collection failed:', error);
          showFailureDialog(buildFailureReport(source, error), source.id, selectorChecks);
      }
  }
  async function showCurrentPageDebugTool() {
      const sources = [...debugSources.values()];
      const source = sources.find((entry) => !entry.menuFallback) ??
          sources.find((entry) => entry.menuFallback === 'url-match') ??
          sources[0];
      if (!source) {
          window.alert('当前页面没有可调试的数据来源。请打开受支持的来源详情页后重试。');
          return;
      }
      await openDebugSource(source);
  }
  function getDebugDialog() {
      const host = document.querySelector(`.${DEBUG_HOST_CLASS}`);
      const dialog = host?.shadowRoot?.querySelector('.e-bnwh-debug-dialog');
      return host && dialog ? { host, dialog } : undefined;
  }
  function openDialog(dialog) {
      if (typeof dialog.showModal === 'function') {
          if (!dialog.open)
              dialog.showModal();
          return;
      }
      dialog.setAttribute('open', '');
  }
  function closeDialog(dialog) {
      if (typeof dialog.close === 'function')
          dialog.close();
      else
          dialog.removeAttribute('open');
  }
  async function copyText(text) {
      if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
  }
  function formatBytes(size) {
      if (size < 1024)
          return `${size} B`;
      if (size < 1024 * 1024)
          return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
  function summarizeDataUrl(value) {
      if (!/^data:[^,\s]*,/i.test(value))
          return value;
      return `[Data URL · ${formatBytes(new Blob([value]).size)} · 已省略]`;
  }
  function formatValue(value) {
      if (typeof value === 'string')
          return summarizeDataUrl(value) || '（空）';
      const cover = getCoverValue(value);
      if (cover) {
          const urls = new Set([cover.url, cover.dataUrl].filter((url) => typeof url === 'string' && url.length > 0));
          return [...urls].map(summarizeDataUrl).join(' · ') || '（空）';
      }
      if (value === undefined)
          return '（undefined）';
      return JSON.stringify(value) ?? String(value);
  }
  function selectorCheckStatus(check) {
      switch (check.result) {
          case 'matched':
              return check.attempts.length > 1 ? '后备规则命中' : '命中';
          case 'missed':
              return '未命中';
          case 'empty':
              return '命中但未提取到值';
          case 'error':
              return check.attempts.some((attempt) => attempt.result === 'error')
                  ? '选择器报错'
                  : '取值报错';
      }
  }
  function selectorAttemptLines(check) {
      const labels = { matched: '命中', missed: '未命中', error: '报错' };
      const lines = check.attempts.map(({ rule, result, node }, index) => `${index + 1}. ${labels[result]} ${rule}${node ? ` → ${node}` : ''}`);
      if (check.error)
          lines.push(check.error);
      return lines;
  }
  function buildDiagnosticReport(view) {
      const errors = view.issues.filter((issue) => issue.severity === 'error').length;
      const warnings = view.issues.length - errors;
      const issueLines = view.issues.length
          ? view.issues.map((issue) => `- [${issue.severity === 'error' ? '错误' : '提醒'}] ${issue.message}`)
          : ['- 未发现明显的数据结构问题。'];
      return [
          '# Bangumi New Wiki Helper 排查报告',
          '',
          `- 助手版本：${APP_VERSION}`,
          `- 数据来源：${view.context}`,
          `- 页面地址：${view.sourceUrl}`,
          `- 捕获时间：${view.capturedAt}`,
          `- 字段数量：${view.infos.length}`,
          `- 检查结果：${errors} 个错误，${warnings} 个提醒`,
          '',
          '## 检查结果',
          '',
          ...issueLines,
          ...(view.selectorChecks.length ? [
              '',
              '## 选择器诊断',
              '',
              ...view.selectorChecks.flatMap((check) => [
                  `- ${check.name}（${check.scope}）：${selectorCheckStatus(check)}`,
                  ...selectorAttemptLines(check).map((line) => `  ${line}`),
              ]),
          ] : []),
          '',
          '## 提取数据',
          '',
          '```json',
          JSON.stringify(view.raw, (_key, value) => typeof value === 'string' ? summarizeDataUrl(value) : value, 2),
          '```',
      ].join('\n');
  }
  function createDebugDialog() {
      const host = document.createElement('div');
      host.className = DEBUG_HOST_CLASS;
      const shadow = host.attachShadow({ mode: 'open' });
      const dialog = htmlToElement(`
<dialog class="e-bnwh-debug-dialog" lang="zh-Hans" aria-labelledby="e-bnwh-debug-title">
  <style>${debugDialogStyle}</style>
  <div class="e-bnwh-debug-shell">
    <header class="e-bnwh-debug-header">
      <div class="e-bnwh-debug-heading">
        <h2 class="e-bnwh-debug-title" id="e-bnwh-debug-title" tabindex="-1" autofocus>数据调试工具</h2>
        <p class="e-bnwh-debug-context"></p>
      </div>
      <button type="button" class="e-bnwh-debug-close-icon" aria-label="关闭">×</button>
    </header>
    <section class="e-bnwh-debug-findings" aria-label="检查概况">
      <p class="e-bnwh-debug-findings-title" role="status"></p>
      <dl class="e-bnwh-debug-summary">
        <div><dt>来源</dt><dd class="e-bnwh-debug-site"></dd></div>
        <div><dt>字段</dt><dd class="e-bnwh-debug-field-count"></dd></div>
        <div><dt>JSON</dt><dd class="e-bnwh-debug-size"></dd></div>
        <div><dt>版本</dt><dd>${APP_VERSION}</dd></div>
      </dl>
      <ul class="e-bnwh-debug-issues"></ul>
    </section>
    <div class="e-bnwh-debug-toolbar">
      <div class="e-bnwh-debug-tabs" role="tablist" aria-label="调试视图">
        <button type="button" class="e-bnwh-debug-tab" data-panel="fields" role="tab" aria-selected="true" id="e-bnwh-tab-fields" aria-controls="e-bnwh-panel-fields">字段检查</button>
        <button type="button" class="e-bnwh-debug-tab" data-panel="selectors" role="tab" aria-selected="false" id="e-bnwh-tab-selectors" aria-controls="e-bnwh-panel-selectors">选择器诊断</button>
        <button type="button" class="e-bnwh-debug-tab" data-panel="json" role="tab" aria-selected="false" id="e-bnwh-tab-json" aria-controls="e-bnwh-panel-json">原始 JSON</button>
      </div>
      <div class="e-bnwh-debug-source-wrap"><select class="e-bnwh-debug-source" aria-label="切换调试数据来源"></select></div>
    </div>
    <section class="e-bnwh-debug-panel" data-panel="fields" role="tabpanel" id="e-bnwh-panel-fields" aria-labelledby="e-bnwh-tab-fields">
      <div class="e-bnwh-debug-filter">
        <input class="e-bnwh-debug-search" type="search" placeholder="搜索字段名、分类或内容" aria-label="搜索字段">
        <output class="e-bnwh-debug-results" aria-label="匹配字段数量" hidden></output>
      </div>
      <div class="e-bnwh-debug-table-scroll" tabindex="0" role="region" aria-label="提取字段">
        <table class="e-bnwh-debug-table">
          <thead><tr><th scope="col">#</th><th scope="col">字段</th><th scope="col">分类</th><th scope="col">提取值</th></tr></thead>
          <tbody></tbody>
        </table>
        <p class="e-bnwh-debug-empty" hidden></p>
      </div>
    </section>
    <section class="e-bnwh-debug-panel" data-panel="selectors" role="tabpanel" id="e-bnwh-panel-selectors" aria-labelledby="e-bnwh-tab-selectors" tabindex="0" hidden>
      <p class="e-bnwh-debug-selector-note">显示本次检查实际尝试的候选规则。可选字段未命中可能是页面没有对应内容。站点后处理后的值请看「字段检查」。</p>
      <div class="e-bnwh-debug-selector-list"></div>
    </section>
    <section class="e-bnwh-debug-panel" data-panel="json" role="tabpanel" id="e-bnwh-panel-json" aria-labelledby="e-bnwh-tab-json" hidden>
      <textarea class="e-bnwh-debug-json" aria-label="原始 JSON 内容" readonly spellcheck="false" wrap="off"></textarea>
    </section>
    <footer class="e-bnwh-debug-footer">
      <p class="e-bnwh-debug-privacy">排查报告省略内嵌图片数据。</p>
      <button type="button" class="e-bnwh-debug-button e-bnwh-debug-button-primary e-bnwh-debug-copy-report">${COPY_REPORT_LABEL}</button>
      <button type="button" class="e-bnwh-debug-button e-bnwh-debug-copy-json">${COPY_JSON_LABEL}</button>
      <button type="button" class="e-bnwh-debug-button e-bnwh-debug-download">下载 JSON</button>
    </footer>
  </div>
</dialog>`);
      const query = (selector) => dialog.querySelector(selector);
      const setCopied = (button, defaultLabel) => {
          button.textContent = COPIED_LABEL;
          setTimeout(() => { button.textContent = defaultLabel; }, 1500);
      };
      const copyReport = query('.e-bnwh-debug-copy-report');
      const copyJson = query('.e-bnwh-debug-copy-json');
      copyReport.addEventListener('click', async () => {
          if (!currentView)
              return;
          try {
              await copyText(buildDiagnosticReport(currentView));
              setCopied(copyReport, COPY_REPORT_LABEL);
          }
          catch (error) {
              console.error('bnwh diagnostic report copy failed:', error);
          }
      });
      copyJson.addEventListener('click', async () => {
          if (!currentView)
              return;
          try {
              await copyText(JSON.stringify(currentView.raw, null, 2));
              setCopied(copyJson, COPY_JSON_LABEL);
          }
          catch (error) {
              console.error('bnwh diagnostic JSON copy failed:', error);
          }
      });
      query('.e-bnwh-debug-download').addEventListener('click', () => {
          if (!currentView)
              return;
          downloadFile(JSON.stringify(currentView.raw, null, 2), currentView.fileName, 'application/json');
      });
      query('.e-bnwh-debug-close-icon').addEventListener('click', () => closeDialog(dialog));
      dialog.addEventListener('click', (event) => { if (event.target === dialog)
          closeDialog(dialog); });
      const tabs = Array.from(dialog.querySelectorAll('.e-bnwh-debug-tab'));
      tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => selectDebugPanel(dialog, tab.dataset.panel));
          tab.addEventListener('keydown', (event) => {
              let nextIndex;
              switch (event.key) {
                  case 'ArrowLeft':
                      nextIndex = (index + tabs.length - 1) % tabs.length;
                      break;
                  case 'ArrowRight':
                      nextIndex = (index + 1) % tabs.length;
                      break;
                  case 'Home':
                      nextIndex = 0;
                      break;
                  case 'End':
                      nextIndex = tabs.length - 1;
                      break;
                  default: return;
              }
              event.preventDefault();
              const next = tabs[nextIndex];
              selectDebugPanel(dialog, next.dataset.panel);
              next.focus();
          });
      });
      query('.e-bnwh-debug-source').addEventListener('change', (event) => {
          const source = debugSources.get(event.currentTarget.value);
          if (source)
              void openDebugSource(source);
      });
      query('.e-bnwh-debug-search').addEventListener('input', () => renderFields(dialog));
      shadow.appendChild(dialog);
      document.body.appendChild(host);
      return { host, dialog };
  }
  function selectDebugPanel(dialog, panel) {
      dialog.querySelectorAll('[data-panel]').forEach((element) => {
          const selected = element.dataset.panel === panel;
          if (element.classList.contains('e-bnwh-debug-tab')) {
              element.setAttribute('aria-selected', String(selected));
              element.tabIndex = selected ? 0 : -1;
          }
          else {
              element.hidden = !selected;
          }
      });
  }
  function renderSelectorChecks(dialog, checks) {
      const list = dialog.querySelector('.e-bnwh-debug-selector-list');
      list.replaceChildren();
      if (!checks.length) {
          const empty = document.createElement('p');
          empty.className = 'e-bnwh-debug-empty';
          empty.textContent = '本次没有记录到配置选择器的执行。';
          list.append(empty);
          return;
      }
      for (const check of checks) {
          const details = document.createElement('details');
          details.dataset.result = check.result;
          const summary = document.createElement('summary');
          const status = document.createElement('span');
          status.className = 'e-bnwh-debug-selector-status';
          status.textContent = selectorCheckStatus(check);
          summary.append(check.name, ' · ', status, ` · ${check.scope}`);
          const attempts = document.createElement('pre');
          attempts.textContent = selectorAttemptLines(check).join('\n');
          details.append(summary, attempts);
          list.append(details);
      }
  }
  function renderFields(dialog) {
      if (!currentView)
          return;
      const sourceLanguage = document.documentElement.lang;
      const query = dialog.querySelector('.e-bnwh-debug-search').value.trim().toLocaleLowerCase();
      const tbody = dialog.querySelector('tbody');
      const problemIndexes = new Set(currentView.issues.map((issue) => issue.fieldIndex).filter((index) => index !== undefined));
      tbody.replaceChildren();
      currentView.infos.forEach((info, index) => {
          const value = formatValue(info.value);
          if (query && !`${info.name} ${info.category ?? ''} ${value}`.toLocaleLowerCase().includes(query))
              return;
          const row = document.createElement('tr');
          if (problemIndexes.has(index))
              row.className = 'is-problem';
          [String(index + 1), info.name, info.category || '—', value].forEach((text, column) => {
              const cell = row.insertCell();
              cell.textContent = text;
              if (column === 3 && sourceLanguage)
                  cell.lang = sourceLanguage;
              if (column === 1 && info.category) {
                  const category = document.createElement('small');
                  category.className = 'e-bnwh-debug-mobile-category';
                  category.textContent = info.category;
                  cell.append(category);
              }
          });
          tbody.appendChild(row);
      });
      const matches = tbody.rows.length;
      const count = dialog.querySelector('.e-bnwh-debug-results');
      count.textContent = `${matches} / ${currentView.infos.length} 项`;
      count.hidden = !query;
      const empty = dialog.querySelector('[data-panel="fields"] .e-bnwh-debug-empty');
      empty.textContent = query ? '没有匹配的字段。' : '本次没有提取到字段。';
      empty.hidden = matches > 0;
      tbody.closest('.e-bnwh-debug-table-scroll').scrollTop = 0;
  }
  function renderSourceSelect(dialog) {
      const wrap = dialog.querySelector('.e-bnwh-debug-source-wrap');
      const select = dialog.querySelector('.e-bnwh-debug-source');
      select.replaceChildren();
      debugSources.forEach((source) => {
          const option = document.createElement('option');
          option.value = source.id;
          option.textContent = source.label;
          option.selected = source.id === currentView?.sourceId;
          select.appendChild(option);
      });
      wrap.hidden = debugSources.size < 2;
  }
  function showDiagnosticView(view) {
      currentView = view;
      const { dialog } = getDebugDialog() ?? createDebugDialog();
      const rawJson = JSON.stringify(view.raw, null, 2);
      const errors = view.issues.filter((issue) => issue.severity === 'error').length;
      const warnings = view.issues.length - errors;
      dialog.querySelector('.e-bnwh-debug-title').textContent = `数据调试工具 · ${view.context}`;
      const context = dialog.querySelector('.e-bnwh-debug-context');
      context.textContent = context.title = view.sourceUrl;
      dialog.querySelector('.e-bnwh-debug-site').textContent = view.site;
      dialog.querySelector('.e-bnwh-debug-field-count').textContent = `${view.infos.length} 项`;
      dialog.querySelector('.e-bnwh-debug-size').textContent = formatBytes(new Blob([rawJson]).size);
      dialog.querySelector('.e-bnwh-debug-json').value = rawJson;
      dialog.querySelector('.e-bnwh-debug-search').value = '';
      const findings = dialog.querySelector('.e-bnwh-debug-findings');
      findings.dataset.level = errors ? 'error' : warnings ? 'warning' : 'ok';
      findings.querySelector('.e-bnwh-debug-findings-title').textContent = errors
          ? `发现 ${errors} 个错误、${warnings} 个提醒`
          : warnings ? `发现 ${warnings} 个需要确认的提醒` : '未发现明显的数据结构问题';
      const issueList = findings.querySelector('.e-bnwh-debug-issues');
      issueList.replaceChildren();
      issueList.hidden = !view.issues.length;
      view.issues.forEach((issue) => {
          const item = document.createElement('li');
          item.textContent = issue.message;
          issueList.appendChild(item);
      });
      renderSourceSelect(dialog);
      renderFields(dialog);
      renderSelectorChecks(dialog, view.selectorChecks);
      const panel = view.raw.format === DEBUG_FAILURE_FORMAT && view.selectorChecks.length
          ? 'selectors'
          : 'fields';
      selectDebugPanel(dialog, panel);
      dialog.querySelector('.e-bnwh-debug-copy-report').textContent = COPY_REPORT_LABEL;
      dialog.querySelector('.e-bnwh-debug-copy-json').textContent = COPY_JSON_LABEL;
      openDialog(dialog);
  }
  function showExportDialog(payload, sourceId, selectorChecks = []) {
      showDiagnosticView({
          context: KIND_LABELS[payload.kind],
          site: payload.site,
          sourceUrl: payload.sourceUrl,
          capturedAt: payload.exportedAt,
          infos: payload.data.infos,
          issues: inspectExportPayload(payload),
          raw: payload,
          fileName: getExportFileName(payload),
          sourceId,
          selectorChecks,
      });
  }
  function showFailureDialog(report, sourceId, selectorChecks) {
      const stamp = report.capturedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      showDiagnosticView({
          context: '提取失败',
          site: report.source.label,
          sourceUrl: report.sourceUrl,
          capturedAt: report.capturedAt,
          infos: [],
          issues: [{ severity: 'error', code: 'no-fields', message: `${report.error.name}: ${report.error.message}` }],
          raw: report,
          fileName: `bnwh-diagnostics-error-${stamp}.json`,
          sourceId,
          selectorChecks,
      });
  }

  function normalizeHookResult(hookRes) {
      if (!hookRes) {
          return false;
      }
      if (hookRes === true) {
          return {
              payload: {},
          };
      }
      return {
          payload: hookRes.payload || {},
      };
  }
  // 新建与导出共用同一份抽取结果，保证导出的就是会填进表单的数据
  async function collectSubjectData(siteConfig, runtime, reportSelectorCheck) {
      const infos = await getWikiData(siteConfig, { reportSelectorCheck });
      await runtime.hydrateSubjectCover?.(infos);
      console.info('wiki info list: ', infos);
      return {
          type: siteConfig.type,
          subtype: siteConfig.subType || 0,
          infos,
      };
  }
  async function initSourceSubject(siteConfig, runtime) {
      const debugSource = {
          id: `subject:${siteConfig.key}`,
          label: `条目 · ${siteConfig.description}`,
          collect: async (report) => buildExportPayload({
              kind: 'subject',
              site: siteConfig.key,
              sourceUrl: location.href,
              data: await collectSubjectData(siteConfig, runtime, report),
          }),
      };
      registerPageDebugFallback(debugSource, siteConfig);
      const $page = findElement(siteConfig.pageSelectors);
      if (!$page)
          return;
      const $title = findElement(siteConfig.controlSelector);
      if (!$title)
          return;
      const normalizedHookRes = normalizeHookResult(await getSubjectHooks(siteConfig, 'beforeCreate')());
      if (!normalizedHookRes)
          return;
      const { payload } = normalizedHookRes;
      console.info(siteConfig.description, ' content script init');
      const $controls = insertControlBtn($title, async (_e, shouldCheckDup) => {
          const wikiData = await collectSubjectData(siteConfig, runtime);
          await runtime.submitSubjectCreation({
              siteConfig,
              wikiData,
              queryInfo: getQueryInfo(wikiData.infos),
              payload,
              shouldCheckDup: !!shouldCheckDup,
          });
      });
      if (!$controls)
          return;
      registerDebugSource(debugSource);
      appendExportBtn($controls, () => openDebugSource(debugSource));
  }

  // ═══════════════════════════════════════════════════════
  // 语言检测（纯函数，无副作用）
  // ═══════════════════════════════════════════════════════
  const JP_RE = /[\u3040-\u309F\u30A0-\u30FFー]/;
  const CN_RE = /^[\u4e00-\u9fa5]+/;
  const isJp = (s) => JP_RE.test(s);
  const isCn = (s) => CN_RE.test(s) && !isJp(s);
  // ═══════════════════════════════════════════════════════
  // 各字段合并策略
  // ═══════════════════════════════════════════════════════
  /** 优先偏好：直接取指定侧 */
  const preferOriginStrategy = ({ current }) => [{ ...current }];
  const preferTargetStrategy = ({ other }) => [{ ...other }];
  /**
   * subject_title 策略
   *
   * 语言优先级：日文 > 中文 > 其他
   * 主标题 → 优先级最高的语言
   * 中文名 → 若有中文且不是主标题
   * 别名   → 剩余有值的字符串
   */
  const subjectTitleStrategy = ({ current, other }) => {
      const cv = getStringValue(current.value);
      const ov = getStringValue(other.value);
      const titleObj = { ...current };
      const cnName = { name: '中文名', value: '' };
      const alias = { name: '别名', value: '', category: 'alias' };
      const jpVal = isJp(cv) ? cv : isJp(ov) ? ov : '';
      const cnVal = isCn(cv) ? cv : isCn(ov) ? ov : '';
      if (jpVal) {
          // 日文作主标题
          titleObj.value = jpVal;
          if (cnVal) {
              // 中日：中文存 cnName
              cnName.value = cnVal;
          }
          else {
              // 只有日文：另一个存别名
              alias.value = jpVal === cv ? ov : cv;
          }
      }
      else if (cnVal) {
          // 只有中文：中文存 cnName，另一个作主标题
          cnName.value = cnVal;
          titleObj.value = cnVal === cv ? ov : cv;
      }
      else {
          // 都不是：取较长值
          titleObj.value = cv.length >= ov.length ? cv : ov;
      }
      return [titleObj, cnName, alias];
  };
  /** 保留原始值（游戏简介/开发/发行等不宜被覆盖的字段） */
  const keepOriginStrategy = ({ current }) => [{ ...current }];
  function isCoverField(info) {
      return info.category === 'cover' || info.category === 'crt_cover';
  }
  function hasCoverValue(info) {
      const cover = getCoverValue(info.value);
      if (cover) {
          return Boolean(cover.dataUrl || cover.url);
      }
      return Boolean(getStringValue(info.value).trim());
  }
  /** cover 可能是结构化对象，不能按字符串长度比较。 */
  const coverValueStrategy = ({ current, other }) => {
      const currentHasValue = hasCoverValue(current);
      const otherHasValue = hasCoverValue(other);
      if (!currentHasValue && otherHasValue)
          return [{ ...other }];
      if (currentHasValue)
          return [{ ...current }];
      return [{ ...current }];
  };
  /** 默认策略：取较长值 */
  const longerValueStrategy = ({ current, other }) => {
      const cv = getStringValue(current.value);
      const ov = getStringValue(other.value);
      return [{ ...current, ...other, value: cv.length >= ov.length ? cv : ov }];
  };
  // ═══════════════════════════════════════════════════════
  // 策略选择器
  // ═══════════════════════════════════════════════════════
  const KEEP_ORIGIN_NAMES = new Set(['游戏简介', '开发', '发行']);
  function selectStrategy(ctx) {
      const { current, other, auxPrefs } = ctx;
      const { originNames, targetNames } = auxPrefs;
      // 偏好优先级最高
      if (originNames === 'all' ||
          (Array.isArray(originNames) && originNames.includes(current.name))) {
          return preferOriginStrategy;
      }
      if (targetNames === 'all' ||
          (Array.isArray(targetNames) && targetNames.includes(other.name))) {
          return preferTargetStrategy;
      }
      // 按字段特征选策略
      if (isCoverField(current) || isCoverField(other))
          return coverValueStrategy;
      if (current.category === 'subject_title')
          return subjectTitleStrategy;
      if (KEEP_ORIGIN_NAMES.has(current.name))
          return keepOriginStrategy;
      return longerValueStrategy;
  }
  /**
   * 多值字段（平台/别名）允许同名多条，其余字段 name 唯一匹配。
   * targetNames 中的字段以 other 侧为准，origin 侧跳过；
   * originNames 中的字段以 origin 侧为准，other 侧在 combineObj 内处理。
   */
  function groupFields(infoList, otherInfoList, auxPrefs) {
      const MULTI_FIELDS = new Set(['平台', '别名']);
      const { targetNames = [] } = auxPrefs;
      const targetNamesSet = new Set(Array.isArray(targetNames) ? targetNames : []);
      // 非多值字段建索引
      const otherIndex = new Map();
      for (const item of otherInfoList) {
          if (!MULTI_FIELDS.has(item.name) && !otherIndex.has(item.name)) {
              otherIndex.set(item.name, item);
          }
      }
      const groups = [];
      const matchedOtherNames = new Set();
      for (const item of infoList) {
          if (MULTI_FIELDS.has(item.name)) {
              groups.push({ kind: 'origin-only', item });
              continue;
          }
          // targetNames 优先：此字段交给 other 侧
          if (targetNamesSet.has(item.name))
              continue;
          const otherItem = otherIndex.get(item.name);
          if (otherItem) {
              groups.push({ kind: 'both', current: item, other: otherItem });
              matchedOtherNames.add(item.name);
          }
          else {
              groups.push({ kind: 'origin-only', item });
          }
      }
      // other 侧未匹配的字段（含多值字段）
      for (const item of otherInfoList) {
          if (MULTI_FIELDS.has(item.name)) {
              groups.push({ kind: 'other-only', item });
          }
          else if (!matchedOtherNames.has(item.name)) {
              groups.push({ kind: 'other-only', item });
          }
      }
      return groups;
  }
  // ═══════════════════════════════════════════════════════
  // Step 2：按组应用策略，展平为 SingleInfo[]
  // ═══════════════════════════════════════════════════════
  function applyStrategies(groups, auxPrefs) {
      const { originNames = [], targetNames = [] } = auxPrefs;
      const originNamesSet = new Set(Array.isArray(originNames) ? originNames : []);
      const prefersAllOrigin = originNames === 'all';
      const prefersAllTarget = targetNames === 'all';
      const result = [];
      for (const group of groups) {
          if (group.kind === 'origin-only') {
              if (prefersAllTarget &&
                  !prefersAllOrigin &&
                  !originNamesSet.has(group.item.name)) {
                  continue;
              }
              result.push(group.item);
              continue;
          }
          if (group.kind === 'other-only') {
              // originNames 优先：other 侧对应字段跳过
              if (prefersAllOrigin || originNamesSet.has(group.item.name))
                  continue;
              result.push(group.item);
              continue;
          }
          // kind === 'both'：走策略选择
          const ctx = {
              current: group.current,
              other: group.other,
              auxPrefs,
          };
          result.push(...selectStrategy(ctx)(ctx));
      }
      return result;
  }
  // ═══════════════════════════════════════════════════════
  // Step 3：去空值 + 去重
  // ═══════════════════════════════════════════════════════
  function dedup(items) {
      // 非别名字段：name+value 唯一
      // 别名字段：value 全局唯一（防止与主标题等重复）
      const nonAliasValues = new Set(items
          .filter((v) => v.name !== '别名' && v.value)
          .map((v) => String(v.value)));
      const seen = new Set();
      const aliasValueSeen = new Set();
      return items.filter((v) => {
          if (!v.value)
              return false;
          const val = String(v.value);
          if (v.name === '别名') {
              if (nonAliasValues.has(val))
                  return false;
              if (aliasValueSeen.has(val))
                  return false;
              aliasValueSeen.add(val);
              return true;
          }
          const key = `${v.name}::${val}`;
          if (seen.has(key))
              return false;
          seen.add(key);
          return true;
      });
  }
  // ═══════════════════════════════════════════════════════
  // 公开 API
  // ═══════════════════════════════════════════════════════
  /**
   * 结合不同网站的条目信息
   * @param infoList      当前的条目信息
   * @param otherInfoList 参考的条目信息
   * @param auxPrefs      合并偏好
   */
  function combineInfoList(infoList, otherInfoList, auxPrefs = {}) {
      if (!otherInfoList?.length)
          return infoList;
      if (!infoList?.length)
          return otherInfoList;
      const groups = groupFields(infoList, otherInfoList, auxPrefs);
      const merged = applyStrategies(groups, auxPrefs);
      return dedup(merged);
  }

  function createWikiExtractContext(root, pageContext = {}) {
      return root
          ? {
              ...pageContext,
              root,
          }
          : { ...pageContext };
  }
  function createRemoteWikiPageContext(url) {
      return {
          sourceUrl: url,
          imageReferer: url,
      };
  }

  // 后台抓取其它网站的 wiki 信息
  async function getWikiDataByURL(url, opts = {}) {
      const urlObj = new URL(url);
      const models = findModelByHost(urlObj.hostname);
      if (models && models.length) {
          const rawText = await fetchText(url, opts, 4 * 1000);
          let $doc = new DOMParser().parseFromString(rawText, 'text/html');
          let model = models[0];
          if (models.length > 1) {
              for (const m of models) {
                  if (m.urlRules && m.urlRules.some((r) => r.test(url))) {
                      model = m;
                  }
              }
          }
          try {
              // 查找标志性的元素
              const $page = findElement(model.pageSelectors, $doc);
              if (!$page)
                  return [];
              const $title = findElement(model.controlSelector, $doc);
              if (!$title)
                  return [];
              return await getWikiData(model, createWikiExtractContext($doc, createRemoteWikiPageContext(url)));
          }
          catch (error) {
              return [];
          }
      }
      return [];
  }

  async function updateSubjectDraftFromAuxSite(payload, runtime) {
      const { url: auxSite, opts: auxSiteOpts = {}, prefs: auxPrefs = {}, mergeOrder = 'origin', } = payload;
      try {
          await runtime.notifier.notify({
              type: 'info',
              message: '正在抓取第三方网站信息…',
              link: auxSite,
              duration: 0,
          });
          console.info('the start of updating aux data');
          const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
          console.info('auxiliary data: ', auxData);
          if (!auxData || (auxData && auxData.length === 0)) {
              await runtime.notifier.notify({
                  type: 'error',
                  message: '未抓取到信息。请确认来源页面可访问且有资料，再重试。',
                  link: auxSite,
                  cmd: 'dismissNotError',
              });
          }
          else {
              await runtime.notifier.notify({
                  type: 'info',
                  message: '抓取第三方网站信息成功。',
                  link: auxSite,
                  cmd: 'dismissNotError',
              });
          }
          const wikiData = await runtime.storage.loadSubjectDraft();
          if (!wikiData) {
              throw new Error('wikiData is empty');
          }
          let infos = mergeOrder === 'aux'
              ? combineInfoList(auxData, wikiData.infos, auxPrefs)
              : combineInfoList(wikiData.infos, auxData, auxPrefs);
          await runtime.storage.saveSubjectDraft({
              type: wikiData.type,
              subtype: wikiData.subtype || 0,
              infos,
          });
          console.info('the end of updating aux data');
      }
      catch (error) {
          console.error(error);
          await runtime.notifier.notify({
              type: 'error',
              message: '抓取信息失败。请确认来源页面可访问，再重试。',
              link: auxSite,
              cmd: 'dismissNotError',
          });
      }
  }

  // 人物查重走新版 API，匿名即可调用，与 bgm.tv / chii.in 的站点域名无关
  const PERSON_SEARCH_URL = 'https://api.bgm.tv/v0/search/persons?limit=10';
  function isPersonSearchHit(value) {
      if (!value || typeof value !== 'object')
          return false;
      const hit = value;
      return ((typeof hit.id === 'number' || typeof hit.id === 'string') &&
          typeof hit.name === 'string');
  }
  async function searchPersonCandidates(name) {
      const keyword = name.trim();
      if (!keyword) {
          return [];
      }
      const response = await fetchJson(PERSON_SEARCH_URL, {
          method: 'POST',
          data: JSON.stringify({ keyword }),
          headers: { 'Content-Type': 'application/json' },
      });
      const hits = Array.isArray(response?.data) ? response.data : [];
      return hits.filter(isPersonSearchHit).map((hit) => ({
          name: hit.name,
          greyName: hit.name_cn ?? '',
          url: `/person/${hit.id}`,
      }));
  }

  async function checkPersonAndOpenEntry(payload, runtime) {
      const name = payload.name?.trim() ?? '';
      if (!name) {
          await runtime.openNewPerson();
          return;
      }
      await runtime.notify({
          type: 'info',
          message: `搜索中…\n${name}`,
          duration: 0,
      });
      let result;
      try {
          const candidates = await searchPersonCandidates(name);
          result = filterResults(candidates, { name }, {
              keys: ['name', 'greyName'],
          });
          await runtime.notify({ type: 'info', message: '', cmd: 'dismissNotError' });
      }
      catch (error) {
          console.error('person search failed:', error);
          await runtime.notify({
              type: 'error',
              message: `Bangumi 人物搜索失败\n${name}`,
              cmd: 'dismissNotError',
          });
          throw error;
      }
      console.info('person search result: ', result);
      if (result?.url) {
          await runtime.discardPersonDraft();
          await runtime.openExistingPerson(result.url);
          return;
      }
      await runtime.openNewPerson();
  }

  function sleep(num) {
      return new Promise((resolve) => {
          setTimeout(resolve, num);
      });
  }

  const CJK_SCRIPT = /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Hangul}]/u;
  function hasCjkBoundary(mainTitle, subtitle) {
      const before = mainTitle.match(/(\p{L})\P{L}*$/u)?.[1];
      const after = subtitle.match(/\p{L}/u)?.[0];
      return !!before && !!after && CJK_SCRIPT.test(before + after);
  }
  function getSubtitleBoundaries(name) {
      const title = name.normalize('NFKC').trim();
      const closing = title.at(-1);
      if (closing !== '-' && closing !== '~' && closing !== '〜')
          return [];
      const beforeClosing = title.slice(0, -1);
      const delimiter = closing === '-' ? /-/g : /[~〜]/g;
      const boundaries = [];
      for (const { index } of beforeClosing.matchAll(delimiter)) {
          const mainTitle = beforeClosing.slice(0, index).trim();
          const subtitle = beforeClosing.slice(index + 1).trim();
          if (!mainTitle || !/[\p{L}\p{N}]/u.test(subtitle))
              continue;
          if (closing === '-' && (mainTitle.endsWith('-') || subtitle.startsWith('-')))
              continue;
          const spaced = /\s/.test(title.charAt(index - 1) + title.charAt(index + 1));
          // 两侧没有空格时，至少一侧最近的字母或文字须为中日韩文字。
          if (closing === '-' && !spaced && !hasCjkBoundary(mainTitle, subtitle))
              continue;
          boundaries.push({ mainTitle, spaced });
      }
      return boundaries;
  }
  function getSubjectSearchKeyword(name, type) {
      return type === SubjectTypeId.book
          ? name.replace(/\s*[（(][^0-9０-９()（）]+[）)]$/, '').trim() || name
          : name;
  }
  function hasSameSubjectMainTitle(candidate, name) {
      const nameBoundaries = getSubtitleBoundaries(name);
      return [candidate.name, candidate.greyName ?? ''].some((candidateName) => {
          const candidateBoundaries = getSubtitleBoundaries(candidateName);
          // 比较一方的完整标题，避免把同系列的两个副标题并为同一候选。
          if (nameBoundaries.length && candidateBoundaries.length)
              return false;
          const [boundaries, shortTitle] = nameBoundaries.length
              ? [nameBoundaries, candidateName]
              : [candidateBoundaries, name];
          const normalizedTitle = normalizeSearchName(shortTitle);
          return boundaries.some(({ mainTitle }) => normalizeSearchName(mainTitle) === normalizedTitle);
      });
  }
  function getTitleRetryQuery(candidates, name) {
      const boundaries = getSubtitleBoundaries(name);
      // 有多个可能的边界时，优先采用唯一带空格的边界。
      const choices = boundaries.length > 1 ? boundaries.filter(({ spaced }) => spaced) : boundaries;
      if (choices.length !== 1 || candidates.some((candidate) => hasSameSearchName(candidate, name) || hasSameSubjectMainTitle(candidate, name)))
          return;
      return choices[0].mainTitle;
  }

  const API_BASE = 'https://api.bgm.tv/v0';
  class BangumiAccessTokenError extends Error {
      constructor() {
          super('Bangumi rejected the configured access token');
          this.name = 'BangumiAccessTokenError';
      }
  }
  function getApiHeaders(accessToken) {
      return {
          'User-Agent': `zhifengle/bangumi-new-wiki-helper/${APP_VERSION}`,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };
  }
  function rethrowApiError(error) {
      if (error instanceof HttpStatusError &&
          (error.status === 401 || error.status === 403)) {
          throw new BangumiAccessTokenError();
      }
      throw error;
  }
  async function verifyBangumiAccessToken(accessToken) {
      try {
          const account = await fetchJson(`${API_BASE}/me`, {
              headers: getApiHeaders(accessToken),
          });
          if (!Number.isSafeInteger(account?.id) || account.id <= 0) {
              throw new Error('Invalid Bangumi account response');
          }
      }
      catch (error) {
          rethrowApiError(error);
      }
  }
  async function searchAuthenticatedSubject(keyword, type, accessToken) {
      let response;
      try {
          response = await fetchJson(`${API_BASE}/search/subjects?limit=20`, {
              method: 'POST',
              headers: { ...getApiHeaders(accessToken), 'Content-Type': 'application/json' },
              data: JSON.stringify({ keyword, sort: 'match', filter: { type: [type] } }),
          });
      }
      catch (error) {
          rethrowApiError(error);
      }
      if (!Array.isArray(response?.data) ||
          !response.data.every((hit) => hit && Number.isSafeInteger(hit.id) && hit.id > 0 &&
              typeof hit.type === 'number' && typeof hit.name === 'string')) {
          throw new Error('Invalid Bangumi API search response');
      }
      return response.data.filter((hit) => hit.type === type).map((hit) => ({
          name: hit.name,
          greyName: hit.name_cn,
          releaseDate: hit.date ?? undefined,
          url: `/subject/${hit.id}`,
      }));
  }
  async function getSubjectISBNs(subjectId, accessToken) {
      const response = await fetchJson(`${API_BASE}/subjects/${subjectId}`, { headers: getApiHeaders(accessToken) });
      return (response?.infobox ?? []).flatMap(({ key, value }) => /^ISBN(?:[ -]?(?:10|13))?$/i.test(key.trim()) && typeof value === 'string'
          ? [value]
          : []);
  }

  var BangumiDomain;
  (function (BangumiDomain) {
      BangumiDomain["chii"] = "chii.in";
      BangumiDomain["bgm"] = "bgm.tv";
      BangumiDomain["bangumi"] = "bangumi.tv";
  })(BangumiDomain || (BangumiDomain = {}));
  var Protocol;
  (function (Protocol) {
      Protocol["http"] = "http";
      Protocol["https"] = "https";
  })(Protocol || (Protocol = {}));
  /** Bangumi HTML 搜索页使用约 60 秒的搜索冷却 Cookie。 */
  const HTML_SEARCH_INTERVAL_MS = 60 * 1000;
  const JSON_SEARCH_TYPES = {
      [SubjectTypeId.book]: 'book',
      [SubjectTypeId.music]: 'music',
      [SubjectTypeId.game]: 'game',
  };
  let lastHtmlSearchAt = 0;
  class InvalidBangumiSearchResponseError extends Error {
      constructor() {
          super('Invalid Bangumi search response: result list not found');
          this.name = 'InvalidBangumiSearchResponseError';
      }
  }
  class UnauthenticatedBangumiSearchError extends Error {
      constructor() {
          super('Bangumi search response is unauthenticated');
          this.name = 'UnauthenticatedBangumiSearchError';
      }
  }
  function isBangumiJsonSearchItem(value) {
      if (!value || typeof value !== 'object')
          return false;
      const item = value;
      return (/^(?:[1-9]\d*)$/.test(String(item.id)) &&
          (typeof item.type_id === 'string' || typeof item.type_id === 'number') &&
          typeof item.name === 'string');
  }
  function dealJsonSearchResults(info, expectedType) {
      // Bangumi JSON 搜索在没有结果时返回 null。
      if (info === null) {
          return [];
      }
      if (!Array.isArray(info) || !info.every(isBangumiJsonSearchItem)) {
          throw new Error('Invalid Bangumi JSON search response');
      }
      return info
          .filter((item) => Number(item.type_id) === Number(expectedType) &&
          (!item.url_mod || item.url_mod === 'subject'))
          .map((item) => ({
          name: item.name,
          greyName: item.name_cn?.trim() ?? '',
          releaseDate: typeof item.date === 'string' ? item.date : undefined,
          url: `/subject/${item.id}`,
      }));
  }
  async function fetchHtmlSearchResults(url) {
      const waitTime = HTML_SEARCH_INTERVAL_MS - (Date.now() - lastHtmlSearchAt);
      if (lastHtmlSearchAt && waitTime > 0) {
          await sleep(waitTime);
      }
      lastHtmlSearchAt = Date.now();
      return dealSearchResults(await fetchText(url));
  }
  /**
   * 处理搜索页面的 html
   * @param info 字符串 html
   */
  function dealSearchResults(info) {
      const results = [];
      let $doc = new DOMParser().parseFromString(info, 'text/html');
      const isUnauthenticated = /\bCHOBITS_UID\s*=\s*['"]?0\b/.test(info) ||
          !!$doc.querySelector('.guest.login[href*="/login"]');
      if (isUnauthenticated) {
          throw new UnauthenticatedBangumiSearchError();
      }
      const $resultList = $doc.querySelector('#browserItemList');
      if (!$resultList) {
          throw new InvalidBangumiSearchResponseError();
      }
      let items = $resultList.querySelectorAll('li>div.inner');
      // get number of page
      let numOfPage = 1;
      let pList = $doc.querySelectorAll('.page_inner>.p');
      if (pList.length >= 2) {
          const secondLastPage = pList[pList.length - 2]
              .getAttribute('href')
              ?.match(/page=(\d+)/)?.[1];
          const lastPage = pList[pList.length - 1]
              .getAttribute('href')
              ?.match(/page=(\d+)/)?.[1];
          const tempNum = Number.parseInt(secondLastPage ?? '1', 10);
          numOfPage = Number.parseInt(lastPage ?? '1', 10);
          numOfPage = Math.max(numOfPage, tempNum);
      }
      if (items && items.length) {
          for (const item of Array.prototype.slice.call(items)) {
              const $subjectTitle = item.querySelector('h3>a.l');
              const href = $subjectTitle?.getAttribute('href') ?? '';
              const subjectUrl = href.match(/^\/subject\/[1-9]\d*(?=$|[?#/])/)?.[0];
              if (!$subjectTitle || !subjectUrl) {
                  throw new InvalidBangumiSearchResponseError();
              }
              let itemSubject = {
                  name: $subjectTitle.textContent.trim(),
                  // url 没有协议和域名
                  url: subjectUrl,
                  greyName: item.querySelector('h3>.grey')
                      ? item.querySelector('h3>.grey').textContent.trim()
                      : '',
              };
              let matchDate = item
                  .querySelector('.info')
                  ?.textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
              if (matchDate) {
                  itemSubject.releaseDate = dealDate(matchDate[0]);
              }
              let $rateInfo = item.querySelector('.rateInfo');
              if ($rateInfo) {
                  if ($rateInfo.querySelector('.fade')) {
                      itemSubject.score = $rateInfo.querySelector('.fade').textContent;
                      itemSubject.count = $rateInfo
                          .querySelector('.tip_j')
                          .textContent.replace(/[^0-9]/g, '');
                  }
                  else {
                      itemSubject.score = '0';
                      itemSubject.count = '少于10';
                  }
              }
              else {
                  itemSubject.score = '0';
                  itemSubject.count = '0';
              }
              results.push(itemSubject);
          }
      }
      return [results, numOfPage];
  }
  async function searchSiteCandidates(query, options, title) {
      const { host = 'https://bgm.tv', type, fallbackToWebSearch = false, } = options;
      const htmlQuery = type === SubjectTypeId.book ? `"${query}"` : query;
      const url = `${host}/subject_search/${encodeURIComponent(htmlQuery)}?cat=${type}`;
      const jsonSearchType = JSON_SEARCH_TYPES[type];
      let candidates = [];
      if (jsonSearchType) {
          async function searchJson(keyword) {
              const jsonUrl = `${host}/json/search-${jsonSearchType}/${encodeURIComponent(keyword)}`;
              console.info('search bangumi subject JSON URL: ', jsonUrl);
              return dealJsonSearchResults(await fetchJson(jsonUrl), type);
          }
          try {
              candidates = await searchJson(query);
              const retryQuery = title && getTitleRetryQuery(candidates, title);
              if (retryQuery)
                  candidates.push(...await searchJson(retryQuery));
              if (candidates.length || !fallbackToWebSearch)
                  return candidates;
              console.info('Bangumi JSON search returned no candidates, falling back to HTML');
          }
          catch (error) {
              console.warn('Bangumi JSON search failed, falling back to HTML:', error);
          }
      }
      console.info('search bangumi subject HTML URL: ', url);
      const [htmlCandidates] = await fetchHtmlSearchResults(url);
      return [...candidates, ...htmlCandidates];
  }
  function normalizeISBN(isbn) {
      return isbn.normalize('NFKC').replace(/[\s-]/g, '').toUpperCase();
  }
  function uniqueByUrl(candidates) {
      const byUrl = new Map();
      for (const candidate of candidates) {
          const first = byUrl.get(candidate.url);
          byUrl.set(candidate.url, first ? {
              ...first,
              greyName: first.greyName || candidate.greyName,
              releaseDate: first.releaseDate || candidate.releaseDate,
          } : candidate);
      }
      return [...byUrl.values()];
  }
  async function verifyISBN(candidate, isbn, token) {
      try {
          const candidateISBNs = await getSubjectISBNs(candidate.url.slice('/subject/'.length), token);
          return candidateISBNs.some((value) => normalizeISBN(value) === isbn);
      }
      catch (error) {
          // 详情无法访问时仅保留候选，不把搜索索引的命中当成 ISBN 一致。
          console.warn('Bangumi ISBN verification failed:', error);
          return false;
      }
  }
  async function verifiedISBNUrls(candidates, isbn, token) {
      const checks = await Promise.all(candidates.map(async (candidate) => ({
          url: candidate.url,
          matches: await verifyISBN(candidate, isbn, token),
      })));
      return new Set(checks.filter(({ matches }) => matches).map(({ url }) => url));
  }
  /**
   * 已验证 ISBN 或唯一的完整标题与日期组合可以自动命中。
   * 主标题和相似标题只作为人工复核候选。
   */
  function matchSubjectCandidates(candidates, subjectInfo, options = {}) {
      const items = uniqueByUrl(candidates);
      const verifiedUrls = options.verifiedISBNUrls ?? new Set();
      const verified = items.filter(({ url }) => verifiedUrls.has(url));
      if (verified.length === 1)
          return verified[0];
      if (verified.length > 1)
          return { candidates: verified };
      const name = subjectInfo.name?.trim() ?? '';
      const exact = items.filter((candidate) => hasSameSearchName(candidate, name));
      const sourceDate = subjectInfo.releaseDate && dealDate(subjectInfo.releaseDate);
      const sameDate = sourceDate
          ? exact.filter(({ releaseDate }) => releaseDate && dealDate(releaseDate) === sourceDate)
          : [];
      // 提供 ISBN 却未验证一致时，不允许较弱的标题/日期覆盖这个冲突信号。
      if (!subjectInfo.isbn && sameDate.length === 1)
          return sameDate[0];
      const mainTitleMatches = items.filter((candidate) => hasSameSubjectMainTitle(candidate, name));
      const ranked = new Set([
          ...sameDate,
          ...exact,
          ...mainTitleMatches,
          ...rankSearchResults(items, name),
          ...items.filter(({ url }) => options.isbnCandidateUrls?.has(url)),
      ]);
      return ranked.size ? { candidates: [...ranked] } : undefined;
  }
  /**
   * 查找条目是否存在
   * @param subjectInfo 条目基本信息
   * @param options 搜索配置
   */
  async function checkSubjectExit(subjectInfo, options) {
      const { type, accessToken } = options;
      if (type === SubjectTypeId.all)
          throw new Error('Subject type is missing');
      const name = subjectInfo.name?.trim() ?? '';
      const isbn = type === SubjectTypeId.book ? normalizeISBN(subjectInfo.isbn ?? '') : '';
      if (!name && !isbn)
          throw new Error('Subject title and ISBN are missing');
      const isbnCandidates = isbn ? uniqueByUrl(await searchSiteCandidates(isbn, options)) : [];
      const isbnCandidateUrls = new Set(isbnCandidates.map(({ url }) => url));
      let matchingISBNUrls = isbn
          ? await verifiedISBNUrls(isbnCandidates, isbn, accessToken)
          : new Set();
      if (matchingISBNUrls.size) {
          return matchSubjectCandidates(isbnCandidates, subjectInfo, {
              isbnCandidateUrls,
              verifiedISBNUrls: matchingISBNUrls,
          });
      }
      const keyword = getSubjectSearchKeyword(name, type);
      let titleCandidates = [];
      if (keyword && accessToken) {
          // 搜索接口也接受匿名请求，先验证一次令牌，再执行所有标题查询。
          await verifyBangumiAccessToken(accessToken);
          titleCandidates = await searchAuthenticatedSubject(keyword, type, accessToken);
          const retryQuery = getTitleRetryQuery(titleCandidates, name);
          if (retryQuery) {
              titleCandidates.push(...await searchAuthenticatedSubject(retryQuery, type, accessToken));
          }
      }
      else if (keyword) {
          titleCandidates = await searchSiteCandidates(keyword, options, name);
      }
      const candidates = uniqueByUrl([...titleCandidates, ...isbnCandidates]);
      if (!candidates.length)
          return;
      if (isbn) {
          const uncheckedExact = candidates.filter((candidate) => !isbnCandidateUrls.has(candidate.url) && hasSameSearchName(candidate, name));
          matchingISBNUrls = await verifiedISBNUrls(uncheckedExact, isbn, accessToken);
      }
      return matchSubjectCandidates(candidates, subjectInfo, {
          isbnCandidateUrls,
          verifiedISBNUrls: matchingISBNUrls,
      });
  }

  function getBgmHost() {
      return `${location.protocol}//${location.host}`;
  }
  function getSubjectId(url) {
      const m = url.match(/(?:subject|character)\/(\d+)/);
      if (!m)
          return '';
      return m[1];
  }
  function genLinkText(url, text = '地址') {
      const $div = document.createElement('div');
      const $link = document.createElement('a');
      $link.href = url;
      $link.innerText = text;
      $div.appendChild($link);
      return $div.innerHTML;
  }

  function insertLogInfo($sibling, txt) {
      const $log = document.createElement('div');
      $log.classList.add('e-wiki-log-info');
      $log.innerHTML = txt;
      if ($sibling.parentElement) {
          $sibling.parentElement.insertBefore($log, $sibling.nextElementSibling);
      }
      return $log;
  }

  /**
   * 通过 iframe 获取表单
   * @param url 链接地址
   * @param formSelector 表单的 iframe
   * @returns Promise<HTMLFormElement>
   */
  async function getFormByIframe(url, formSelector) {
      const iframeId = 'e-userjs-iframe';
      let $iframe = document.querySelector(`#${iframeId}`);
      if (!$iframe) {
          $iframe = document.createElement('iframe');
          $iframe.style.display = 'none';
          $iframe.id = iframeId;
          document.body.appendChild($iframe);
      }
      await loadIframe($iframe, url, 20000);
      const $form = $iframe.contentDocument?.querySelector(formSelector);
      if (!$form) {
          throw new Error(`form not found: ${formSelector}`);
      }
      return $form;
  }

  async function createNewSubjectEntry(payload, runtime) {
      if (payload.auxSite) {
          await runtime.updateAuxData(payload.auxSite);
      }
      await runtime.openNewSubject(payload.type);
  }
  /** 清除当前非错误通知（如 loading 提示） */
  function dismissNotification() {
      return { type: 'info', message: '', cmd: 'dismissNotError' };
  }
  async function searchExistingSubject(payload, runtime) {
      const subjectInfo = payload.subjectInfo;
      await runtime.notify({
          type: 'info',
          message: 'Bangumi 条目搜索中…',
          duration: 0,
      });
      try {
          const result = await checkSubjectExit(payload.disableDate
              ? { ...subjectInfo, releaseDate: undefined }
              : subjectInfo, {
              ...runtime.bangumi,
              type: payload.type,
          });
          console.info('search results: ', result);
          await runtime.notify(dismissNotification());
          return result;
      }
      catch (error) {
          console.error('search request failed:', error);
          const isUnauthenticatedSearch = error instanceof Error &&
              error.name === 'UnauthenticatedBangumiSearchError';
          const isInvalidSearchPage = error instanceof Error &&
              error.name === 'InvalidBangumiSearchResponseError';
          await runtime.notify({
              type: 'error',
              message: error instanceof BangumiAccessTokenError
                  ? 'Bangumi 拒绝了 Access Token。请在「条目助手设置」中更新或清除 Token 后重试。'
                  : isUnauthenticatedSearch
                      ? 'Bangumi 搜索请求丢失了登录状态。请在 Bangumi 重新登录，再返回当前页面重试。'
                      : isInvalidSearchPage
                          ? 'Bangumi 返回了异常的搜索页面。请确认登录状态，并等待至少 60 秒后再试。'
                          : 'Bangumi 搜索请求失败，请重试。',
              link: isUnauthenticatedSearch || isInvalidSearchPage ? runtime.bangumi.host : undefined,
              cmd: 'dismissNotError',
          });
          throw error;
      }
  }
  async function checkSubjectAndOpenEntry(payload, runtime) {
      const name = payload.subjectInfo?.name?.trim();
      const isbn = payload.type === SubjectTypeId.book && payload.subjectInfo?.isbn?.trim();
      if (!name && !isbn) {
          await runtime.notify({ type: 'error', message: '缺少条目名称或 ISBN，无法查重。' });
          return;
      }
      const result = await searchExistingSubject(payload, runtime);
      if (result && 'url' in result) {
          await runtime.saveSubjectId(getSubjectId(result.url));
          await runtime.openExistingSubject(result.url);
          return;
      }
      if (result && 'candidates' in result) {
          const choice = await runtime.chooseSubject?.({
              name: name || isbn || '',
              candidates: result.candidates,
          });
          if (!choice)
              return;
          if (choice.kind === 'open') {
              const candidate = result.candidates.find(({ url }) => url === choice.url);
              if (candidate) {
                  await runtime.saveSubjectId(getSubjectId(candidate.url));
                  await runtime.openExistingSubject(candidate.url);
              }
              return;
          }
          if (choice.kind !== 'create')
              return;
      }
      if (payload.draft)
          await runtime.saveSubjectDraft?.(payload.draft);
      await createNewSubjectEntry({ type: payload.type, auxSite: payload.auxSite }, runtime);
  }

  let stack;
  const active = new Set();
  async function getStack() {
      if (!document.body && document.readyState === 'loading') {
          await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
      }
      if (!document.body)
          return;
      if (stack?.isConnected)
          return stack;
      const host = document.createElement('div');
      const root = host.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = `
    :host {
      position: fixed; inset: 16px 16px auto auto; z-index: 2147483647;
      width: min(360px, calc(100vw - 32px)); pointer-events: none;
    }
    .stack {
      display: grid;
      gap: 8px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      font: 14px/1.55 ${UI_FONT_STACK};
    }
    .toast {
      display: flex; gap: 8px; align-items: start; justify-content: space-between;
      padding: 10px 12px; pointer-events: auto; background: #fff; color: #18181b;
      border: 1px solid #d4d4d8; border-inline-start: 4px solid #a83a61;
      border-radius: 6px; overflow-wrap: anywhere;
    }
    .toast[data-type="error"] { border-inline-start-color: #b91c1c; }
    .toast[data-type="succuss"] { border-inline-start-color: #15803d; }
    .message { min-width: 0; white-space: pre-line; }
    a { display: block; margin-top: 4px; color: #1d4ed8; }
    button { border: 0; padding: 0 4px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
  `;
      stack = document.createElement('div');
      stack.className = 'stack';
      stack.lang = 'zh-Hans';
      root.append(style, stack);
      document.body.appendChild(host);
      return stack;
  }
  async function logMessage(request) {
      if (request.cmd) {
          for (const toast of active) {
              if (request.cmd === 'dismissAll' || toast.type !== 'error')
                  toast.dismiss();
          }
      }
      if (!request.message)
          return;
      const container = await getStack();
      if (!container)
          return;
      const tile = document.createElement('div');
      tile.className = 'toast';
      tile.dataset.type = request.type;
      const region = document.createElement('div');
      region.className = 'message';
      region.setAttribute('role', request.type === 'error' ? 'alert' : 'status');
      tile.append(region);
      container.append(tile);
      region.textContent = request.message;
      if (request.link && /^https?:\/\//i.test(request.link)) {
          const link = document.createElement('a');
          link.href = request.link;
          link.textContent = request.link;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          region.append(link);
      }
      let timer;
      const toast = {
          type: request.type,
          dismiss() {
              clearTimeout(timer);
              tile.remove();
              active.delete(toast);
          },
      };
      active.add(toast);
      const duration = request.duration ?? (request.type === 'error' ? 0 : 3000);
      if (duration > 0) {
          timer = setTimeout(toast.dismiss, duration);
      }
      else {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = '×';
          button.setAttribute('aria-label', '关闭提示');
          button.addEventListener('click', toast.dismiss);
          tile.append(button);
      }
  }

  let activeDialog;
  function renderCandidate(candidate) {
      const row = htmlToElement(`
    <li>
      <button type="submit" class="candidate">
        <span class="candidate-name"></span>
        <span class="candidate-alias"></span>
        <span class="candidate-details"></span>
        <span class="candidate-action">打开 <span aria-hidden="true">↗</span></span>
      </button>
    </li>
  `);
      const button = row.querySelector('button');
      button.value = candidate.url;
      row.querySelector('.candidate-name').textContent = candidate.name;
      const alias = row.querySelector('.candidate-alias');
      const alternateName = candidate.greyName?.trim();
      alias.hidden = !alternateName || alternateName === candidate.name.trim();
      alias.textContent = alternateName ?? '';
      row.querySelector('.candidate-details').textContent = [
          candidate.releaseDate,
          `#${candidate.url.split('/').pop()}`,
      ].filter(Boolean).join(' · ');
      return row;
  }
  function chooseSubjectCandidate({ name, candidates, }) {
      activeDialog?.close();
      const host = document.createElement('div');
      host.style.display = 'contents';
      const shadow = host.attachShadow({ mode: 'open' });
      const dialog = htmlToElement(`
<dialog lang="zh-Hans" aria-labelledby="title" aria-describedby="source-title">
  <style>
    * { box-sizing: border-box; }
    dialog {
      --surface: #fff;
      --subtle: #f6f7f9;
      --text: #20242d;
      --muted: #555e6e;
      --line: #d6dbe3;
      --accent: #9b285a;
      --hover: #fff3f8;
      color-scheme: light;
      inline-size: min(580px, calc(100% - 24px));
      max-block-size: calc(100dvh - 24px);
      margin: auto;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      color: var(--text);
      padding: 0;
      box-shadow: 0 16px 48px #0003;
      font: 14px/1.55 ${UI_FONT_STACK};
    }
    @media (prefers-color-scheme: dark) {
      dialog {
        color-scheme: dark;
        --surface: #1b2028;
        --subtle: #242a34;
        --text: #eff1f6;
        --muted: #b5becd;
        --line: #485261;
        --accent: #ffb4d2;
        --hover: #362735;
      }
    }
    dialog::backdrop { background: #161b2580; }
    form {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      max-block-size: min(680px, calc(100dvh - 26px));
      margin: 0;
    }
    h2, h3, p, ul { margin: 0; }
    header, .results { padding: 16px 20px; }
    h2 { font-size: 18px; line-height: 1.3; }
    h2:focus { outline: none; }
    .source {
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--subtle);
      border-radius: 8px;
    }
    .source-label, .candidate-details { color: var(--muted); font-size: 12px; }
    #source-title {
      overflow-wrap: anywhere;
      max-block-size: 5.8em;
      overflow: auto;
      margin-top: 3px;
    }
    .results { overflow-y: auto; padding-top: 0; }
    h3 { margin-bottom: 8px; font-size: 13px; font-weight: 600; }
    ul { display: grid; gap: 8px; padding: 0; list-style: none; }
    button {
      appearance: none;
      min-block-size: 40px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -3px;
    }
    .candidate {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 12px;
      row-gap: 3px;
      align-items: center;
      inline-size: 100%;
      padding: 10px 12px;
      text-align: start;
      overflow-wrap: anywhere;
    }
    .candidate:hover { border-color: var(--accent); background: var(--hover); }
    .candidate-name { font-weight: 600; }
    .candidate-alias { color: var(--muted); font-size: 13px; }
    .candidate-name, .candidate-alias, .candidate-details { grid-column: 1; }
    .candidate-action {
      grid-column: 2;
      grid-row: 1 / span 3;
      color: var(--accent);
      font-size: 13px;
      white-space: nowrap;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 20px;
      border-top: 1px solid var(--line);
    }
    footer button { padding: 6px 12px; }
    footer button:hover { background: var(--subtle); }
    .cancel { border-color: transparent; color: var(--muted); }
    [hidden] { display: none; }
  </style>
  <form method="dialog">
    <header>
      <h2 id="title" tabindex="-1" autofocus>Bangumi 查重</h2>
      <div class="source">
        <p class="source-label">待查条目</p>
        <p id="source-title"></p>
      </div>
    </header>
    <section class="results" aria-labelledby="results-heading">
      <h3 id="results-heading"></h3>
      <ul></ul>
    </section>
    <footer>
      <button type="submit" class="cancel" value="cancel">取消</button>
      <button type="submit" value="create">没有匹配，继续新建</button>
    </footer>
  </form>
</dialog>
`);
      dialog.querySelector('#source-title').textContent = name;
      dialog.querySelector('#results-heading').textContent = `候选条目（${candidates.length}）`;
      dialog.querySelector('ul').append(...candidates.map(renderCandidate));
      shadow.appendChild(dialog);
      document.body.appendChild(host);
      activeDialog = dialog;
      const choice = new Promise((resolve) => {
          dialog.addEventListener('close', () => {
              const value = dialog.returnValue;
              if (activeDialog === dialog)
                  activeDialog = undefined;
              host.remove();
              if (value === 'create')
                  resolve({ kind: 'create' });
              else if (candidates.some(({ url }) => url === value)) {
                  resolve({ kind: 'open', url: value });
              }
              else {
                  resolve(null);
              }
          }, { once: true });
      });
      dialog.showModal();
      return choice;
  }

  // 配置变量
  const SCRIPT_PREFIX = 'E_USERJS_';
  const AUTO_FILL_FORM = SCRIPT_PREFIX + 'autofill';
  const WIKI_DATA = SCRIPT_PREFIX + 'wiki_data';
  const CHARA_DATA = SCRIPT_PREFIX + 'chara_data';
  const PERSON_DATA = SCRIPT_PREFIX + 'person_data';
  const PROTOCOL = SCRIPT_PREFIX + 'protocol';
  const BGM_DOMAIN = SCRIPT_PREFIX + 'bgm_domain';
  const BGM_ACCESS_TOKEN = SCRIPT_PREFIX + 'bgm_access_token';
  const SUBJECT_ID = SCRIPT_PREFIX + 'subject_id';
  const FALLBACK_TO_WEB_SEARCH = SCRIPT_PREFIX + 'fallback_to_web_search';
  const SHOW_EXPORT_BUTTONS = SCRIPT_PREFIX + 'show_export_buttons';

  const userScriptDraftStore = {
      async saveSubjectDraft(wikiData) {
          GM_setValue(WIKI_DATA, JSON.stringify(wikiData));
      },
      async loadSubjectDraft() {
          return JSON.parse(GM_getValue(WIKI_DATA) || 'null');
      },
      async saveCharacterDraft(charaData) {
          GM_setValue(CHARA_DATA, JSON.stringify(charaData));
      },
      async loadCharacterDraft() {
          return JSON.parse(GM_getValue(CHARA_DATA) || 'null');
      },
      async savePersonDraft(personData) {
          GM_setValue(PERSON_DATA, JSON.stringify(personData));
      },
      async loadPersonDraft() {
          return JSON.parse(GM_getValue(PERSON_DATA) || 'null');
      },
      async clearPersonDraft() {
          GM_deleteValue(PERSON_DATA);
      },
      async saveSubjectId(subjectId) {
          GM_setValue(SUBJECT_ID, subjectId);
      },
      async loadSubjectId() {
          return GM_getValue(SUBJECT_ID);
      },
      async loadBangumiPageState() {
          return {
              wikiData: JSON.parse(GM_getValue(WIKI_DATA) || 'null'),
              charaData: JSON.parse(GM_getValue(CHARA_DATA) || 'null'),
              personData: JSON.parse(GM_getValue(PERSON_DATA) || 'null'),
              subjectId: GM_getValue(SUBJECT_ID),
              shouldAutoFill: GM_getValue(AUTO_FILL_FORM) == 1,
              autoFillDelay: 300,
          };
      },
      async clearBangumiPageState() {
          GM_deleteValue(AUTO_FILL_FORM);
          GM_deleteValue(WIKI_DATA);
          GM_deleteValue(CHARA_DATA);
          GM_deleteValue(PERSON_DATA);
          GM_deleteValue(SUBJECT_ID);
      },
      async consumeAutoFill() {
          GM_setValue(AUTO_FILL_FORM, 0);
      },
  };

  const userScriptRuntimeCapabilities = {
      transport: {
          fetchHtml(url) {
              return fetchText(url);
          },
      },
      storage: userScriptDraftStore,
      navigator: {
          async openTab(url) {
              GM_openInTab(url);
          },
      },
      notifier: {
          notify(message) {
              return logMessage(message);
          },
      },
  };

  function getBangumiHost() {
      const protocol = GM_getValue(PROTOCOL) || 'https';
      const bgmDomain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
      return `${protocol}://${bgmDomain}`;
  }
  const defaultOpenTab = async (url) => {
      GM_openInTab(url);
  };
  function getOpenTab() {
      return userScriptRuntimeCapabilities.navigator?.openTab ?? defaultOpenTab;
  }
  async function updateAuxData(payload) {
      await updateSubjectDraftFromAuxSite(payload, {
          storage: userScriptRuntimeCapabilities.storage,
          notifier: {
              notify: userScriptRuntimeCapabilities.notifier?.notify ?? logMessage,
          },
      });
  }
  async function openNewSubject(type, delay = 200) {
      const openTab = getOpenTab();
      GM_setValue(AUTO_FILL_FORM, 1);
      setTimeout(() => {
          openTab(`${getBangumiHost()}/new_subject/${type}`);
      }, delay);
  }
  async function submitSubjectCreation({ wikiData, queryInfo, payload, shouldCheckDup, }) {
      const host = getBangumiHost();
      const subjectCreationRuntime = createUserScriptSubjectCreationRuntime(host);
      if (shouldCheckDup) {
          await checkSubjectAndOpenEntry({
              subjectInfo: queryInfo,
              type: wikiData.type,
              disableDate: payload?.disableDate,
              auxSite: payload?.auxSite,
              draft: wikiData,
          }, subjectCreationRuntime);
          return;
      }
      await userScriptRuntimeCapabilities.storage.saveSubjectDraft(wikiData);
      await createNewSubjectEntry({
          type: wikiData.type,
          auxSite: payload?.auxSite,
      }, subjectCreationRuntime);
  }
  async function submitCharacterCreation({ charaData, }) {
      GM_setValue(AUTO_FILL_FORM, 1);
      await userScriptRuntimeCapabilities.storage.saveCharacterDraft(charaData);
      await sleep(200);
      GM_openInTab(`${getBangumiHost()}/character/new`);
  }
  function createUserScriptSubjectCreationRuntime(host) {
      const notify = userScriptRuntimeCapabilities.notifier?.notify ?? logMessage;
      const openTab = getOpenTab();
      return {
          bangumi: {
              host,
              accessToken: GM_getValue(BGM_ACCESS_TOKEN)?.trim(),
              fallbackToWebSearch: GM_getValue(FALLBACK_TO_WEB_SEARCH) || false,
          },
          notify,
          chooseSubject: chooseSubjectCandidate,
          updateAuxData,
          saveSubjectDraft: (draft) => userScriptRuntimeCapabilities.storage.saveSubjectDraft(draft),
          saveSubjectId(subjectId) {
              return userScriptRuntimeCapabilities.storage.saveSubjectId(subjectId);
          },
          async openExistingSubject(url) {
              await sleep(100);
              await openTab(host + url);
          },
          openNewSubject(type) {
              return openNewSubject(type);
          },
      };
  }
  function createUserScriptPersonCreationRuntime(host) {
      const notify = userScriptRuntimeCapabilities.notifier?.notify ?? logMessage;
      const openTab = getOpenTab();
      return {
          bangumi: {
              host,
          },
          notify,
          discardPersonDraft() {
              return userScriptRuntimeCapabilities.storage.clearPersonDraft();
          },
          async openExistingPerson(url) {
              await sleep(100);
              await openTab(host + url);
          },
          async openNewPerson() {
              GM_setValue(AUTO_FILL_FORM, 1);
              await sleep(200);
              await openTab(`${host}/person/new`);
          },
      };
  }
  async function submitPersonCreation({ personData, queryInfo, shouldCheckDup, }) {
      const host = getBangumiHost();
      const personCreationRuntime = createUserScriptPersonCreationRuntime(host);
      await userScriptRuntimeCapabilities.storage.savePersonDraft(personData);
      if (shouldCheckDup) {
          await checkPersonAndOpenEntry({ name: queryInfo.name }, personCreationRuntime);
          return;
      }
      await personCreationRuntime.openNewPerson();
  }
  const userScriptRuntimeAdapter = {
      fetchHtml(url) {
          return userScriptRuntimeCapabilities.transport.fetchHtml(url);
      },
      submitSubjectCreation,
      submitCharacterCreation,
      submitPersonCreation,
  };

  async function initCommon(siteConfig) {
      return initSourceSubject(siteConfig, userScriptRuntimeAdapter);
  }
  function addStyle() {
      GM_addStyle(`
.e-wiki-new-character, .e-wiki-new-subject, .e-wiki-search-subject, .e-wiki-fill-form {
  color: rgb(0, 180, 30) !important;
  margin-left: 4px !important;
}

.e-wiki-new-subject {
  margin-left: 8px;
}

.e-wiki-new-character:hover,
.e-wiki-new-subject:hover,
.e-wiki-search-subject:hover,
.e-wiki-fill-form:hover {
  color: red !important;
  cursor: pointer;
}

/* upload img */
.e-wiki-cover-container {
  margin-top: 1rem;
}

.e-wiki-cover-container img {
  display: none;
}

#e-wiki-cover-amount {
  padding-left: 10px;
  border: 0;
  color: #f6931f;
  font-size: 20px;
  font-weight: bold;
}

#e-wiki-cover-reset {
  display: inline-block;
  text-align: center;
  width: 60px;
  height: 30px;
  line-height: 30px;
  font-size: 18px;
  background-color: #f09199;
  text-decoration: none;
  color: #fff;
  margin-left: 50px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 1px 1px 2px #333;
}

#e-wiki-cover-preview {
  margin-top: 0.5rem;
}

#e-wiki-cover-preview:active {
  cursor: crosshair;
}

#e-wiki-cover-preview {
  display: block;
}

.e-wiki-cover-blur-loading {
  width: 208px;
  height: 13px;
  background-image: url("https://bgm.tv/img/loadingAnimation.gif");
}

.e-wiki-search-cover {
  width: 84px;
  height: auto;
}

.preview-fetch-img-link {
  margin-left: 8px;
  font-weight: 500;
  color: #149bff !important;
  text-decoration: none;
}
.e-bnwh-add-chara-wrap {
  margin-top: 6px;
  margin-bottom: 6px;
}
.e-bnwh-related-id {
  margin-left: 12px;
  display: inline-block;
  vertical-align: -5px;
}
  `);
  }

  function getMousePos(canvas, evt) {
      const rect = canvas.getBoundingClientRect();
      return {
          x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
          y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
      };
  }
  function getBlurControlState($width, $radius) {
      return {
          width: +$width.value,
          radius: +$radius.value,
      };
  }
  function getBlurAmountText(state) {
      return `${state.width}, ${state.radius}`;
  }
  function getPasteTipsText(isMouseInPasteArea) {
      return isMouseInPasteArea
          ? '可粘贴图片（Ctrl+V）'
          : '鼠标移入此区域后粘贴图片生效';
  }
  function resolveInitialPreviewSource(base64Data) {
      if (!base64Data) {
          return {
              kind: 'empty',
          };
      }
      if (/^http/.test(base64Data)) {
          return {
              kind: 'external_url',
              url: base64Data,
          };
      }
      return {
          kind: 'data_url',
          dataUrl: base64Data,
      };
  }
  function resolveResetSource(initialSource, hasFile, hasFillForm) {
      if (initialSource.kind !== 'empty')
          return 'initial';
      if (hasFile)
          return 'file';
      if (hasFillForm)
          return 'fill_form';
      return 'none';
  }
  function hasValidCanvasSize($canvas) {
      return $canvas.width > 8 && $canvas.height > 10;
  }

  const previewObjectUrls = new WeakMap();
  function releasePreviewObjectUrl($image) {
      const url = previewObjectUrls.get($image);
      if (url) {
          URL.revokeObjectURL(url);
          previewObjectUrls.delete($image);
      }
  }
  function clearPreviewImage(refs) {
      refs.previewImage.removeAttribute('src');
      releasePreviewObjectUrl(refs.previewImage);
      refs.previewCanvas.width = 0;
      refs.previewCanvas.height = 0;
  }
  function removePreviewFetchLink(refs) {
      refs.previewFetchLink?.remove();
      refs.previewFetchLink = null;
  }
  function ensurePreviewFetchLink(refs, url) {
      if (refs.previewFetchLink?.href === url) {
          return;
      }
      removePreviewFetchLink(refs);
      const link = document.createElement('a');
      link.classList.add('preview-fetch-img-link');
      link.href = url;
      link.setAttribute('rel', 'noopener noreferrer nofollow');
      link.setAttribute('target', '_blank');
      link.innerText = '查看抓取封面';
      refs.container.insertBefore(link, refs.previewCanvas);
      refs.previewFetchLink = link;
  }
  function getPreviewImageSize($img) {
      return {
          width: $img.naturalWidth || $img.width,
          height: $img.naturalHeight || $img.height,
      };
  }
  function renderPreviewImage(refs) {
      const ctx = refs.previewCanvas.getContext('2d');
      if (!ctx) {
          return;
      }
      const { width, height } = getPreviewImageSize(refs.previewImage);
      if (!width || !height) {
          return;
      }
      refs.previewCanvas.width = width;
      refs.previewCanvas.height = height;
      ctx.drawImage(refs.previewImage, 0, 0);
      window.dispatchEvent(new Event('resize'));
  }
  function loadPreviewImageSource(refs, source) {
      const $image = refs.previewImage;
      if (typeof source === 'string' && $image.src === source) {
          renderPreviewImage(refs);
          return;
      }
      releasePreviewObjectUrl($image);
      if (typeof source === 'string') {
          $image.src = source;
      }
      else {
          const url = URL.createObjectURL(source);
          previewObjectUrls.set($image, url);
          $image.src = url;
      }
  }
  function applyInitialPreviewData(initialSource, refs) {
      if (initialSource.kind === 'empty') {
          removePreviewFetchLink(refs);
          return;
      }
      if (initialSource.kind === 'external_url') {
          // 跨域和 refer 的问题，暂时改成链接
          ensurePreviewFetchLink(refs, initialSource.url);
          clearPreviewImage(refs);
      }
      else {
          removePreviewFetchLink(refs);
          loadPreviewImageSource(refs, initialSource.dataUrl);
      }
  }
  function bindPreviewFileImage($file, refs) {
      const handleImageLoad = () => {
          renderPreviewImage(refs);
      };
      const handleFileChange = () => {
          const file = $file?.files?.[0];
          if (file) {
              loadPreviewImageSource(refs, file);
          }
      };
      refs.previewImage.addEventListener('load', handleImageLoad);
      $file?.addEventListener('change', handleFileChange);
      return () => {
          refs.previewImage.removeEventListener('load', handleImageLoad);
          $file?.removeEventListener('change', handleFileChange);
          clearPreviewImage(refs);
      };
  }
  function bindPreviewControls(initialSource, $file, refs) {
      const handleReset = (e) => {
          // wiki 填表按钮
          const $fillForm = document.querySelector('.e-wiki-fill-form');
          const resetSource = resolveResetSource(initialSource, Boolean($file?.files?.[0]), Boolean($fillForm));
          if (resetSource === 'initial') {
              applyInitialPreviewData(initialSource, refs);
          }
          else if (resetSource === 'file') {
              $file?.dispatchEvent(new Event('change'));
          }
          else if (resetSource === 'fill_form') {
              $fillForm?.dispatchEvent(new Event('click'));
          }
          e.preventDefault();
      };
      const handleClear = (e) => {
          clearPreviewImage(refs);
          e.preventDefault();
      };
      refs.resetButton.addEventListener('click', handleReset);
      refs.clearButton.addEventListener('click', handleClear);
      return () => {
          refs.resetButton.removeEventListener('click', handleReset);
          refs.clearButton.removeEventListener('click', handleClear);
      };
  }
  function bindPastePreview(refs) {
      // 标记：鼠标是否在目标元素内（初始为false）
      let isMouseInPasteArea = false;
      // 监听鼠标进入/离开，更新状态 + 视觉反馈
      const handleMouseEnter = () => {
          isMouseInPasteArea = true;
          refs.pasteTips.textContent = getPasteTipsText(true);
      };
      const handleMouseLeave = () => {
          isMouseInPasteArea = false;
          refs.pasteTips.textContent = getPasteTipsText(false);
      };
      const handlePaste = (e) => {
          if (!refs.container.isConnected) {
              document.body.removeEventListener('paste', handlePaste);
              return;
          }
          if (!isMouseInPasteArea)
              return;
          e.preventDefault();
          let imageFile = e.clipboardData?.files?.[0];
          if (!imageFile) {
              for (const item of e.clipboardData?.items ?? []) {
                  if (item.kind === 'file' && item.type.startsWith('image/')) {
                      imageFile = item.getAsFile();
                      if (imageFile)
                          break;
                  }
              }
          }
          if (!imageFile) {
              refs.pasteTips.textContent = '未检测到图片！';
              return;
          }
          loadPreviewImageSource(refs, imageFile);
      };
      refs.container.addEventListener('mouseenter', handleMouseEnter);
      refs.container.addEventListener('mouseleave', handleMouseLeave);
      document.body.addEventListener('paste', handlePaste);
      return () => {
          refs.container.removeEventListener('mouseenter', handleMouseEnter);
          refs.container.removeEventListener('mouseleave', handleMouseLeave);
          document.body.removeEventListener('paste', handlePaste);
      };
  }

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  /**
  * StackBlur - a fast almost Gaussian Blur For Canvas
  *
  * In case you find this class useful - especially in commercial projects -
  * I am not totally unhappy for a small donation to my PayPal account
  * mario@quasimondo.de
  *
  * Or support me on flattr:
  * {@link https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript}
  * @module StackBlur
  * @version 0.5
  * @author Mario Klingemann
  * Contact: mario@quasimondo.com
  * Website: {@link http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html}
  * Twitter: @quasimondo
  *
  * @copyright (c) 2010 Mario Klingemann
  *
  * Permission is hereby granted, free of charge, to any person
  * obtaining a copy of this software and associated documentation
  * files (the "Software"), to deal in the Software without
  * restriction, including without limitation the rights to use,
  * copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the
  * Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  * OTHER DEALINGS IN THE SOFTWARE.
  */
  var mulTable = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
  var shgTable = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];
  /**
   * @param {string|HTMLCanvasElement} canvas
   * @param {Integer} topX
   * @param {Integer} topY
   * @param {Integer} width
   * @param {Integer} height
   * @throws {Error|TypeError}
   * @returns {ImageData} See {@link https://html.spec.whatwg.org/multipage/canvas.html#imagedata}
   */


  function getImageDataFromCanvas(canvas, topX, topY, width, height) {
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }

    if (!canvas || _typeof(canvas) !== 'object' || !('getContext' in canvas)) {
      throw new TypeError('Expecting canvas with `getContext` method in processCanvasRGB(A) calls!');
    }

    var context = canvas.getContext('2d');

    try {
      return context.getImageData(topX, topY, width, height);
    } catch (e) {
      throw new Error('unable to access image data: ' + e);
    }
  }
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Integer} topX
   * @param {Integer} topY
   * @param {Integer} width
   * @param {Integer} height
   * @param {Float} radius
   * @returns {undefined}
   */


  function processCanvasRGBA(canvas, topX, topY, width, height, radius) {
    if (isNaN(radius) || radius < 1) {
      return;
    }

    radius |= 0;
    var imageData = getImageDataFromCanvas(canvas, topX, topY, width, height);
    imageData = processImageDataRGBA(imageData, topX, topY, width, height, radius);
    canvas.getContext('2d').putImageData(imageData, topX, topY);
  }
  /**
   * @param {ImageData} imageData
   * @param {Integer} topX
   * @param {Integer} topY
   * @param {Integer} width
   * @param {Integer} height
   * @param {Float} radius
   * @returns {ImageData}
   */


  function processImageDataRGBA(imageData, topX, topY, width, height, radius) {
    var pixels = imageData.data;
    var x, y, i, p, yp, yi, yw, rSum, gSum, bSum, aSum, rOutSum, gOutSum, bOutSum, aOutSum, rInSum, gInSum, bInSum, aInSum, pr, pg, pb, pa, rbs;
    var div = 2 * radius + 1; // const w4 = width << 2;

    var widthMinus1 = width - 1;
    var heightMinus1 = height - 1;
    var radiusPlus1 = radius + 1;
    var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
    var stackStart = new BlurStack();
    var stack = stackStart;
    var stackEnd;

    for (i = 1; i < div; i++) {
      stack = stack.next = new BlurStack();

      if (i === radiusPlus1) {
        stackEnd = stack;
      }
    }

    stack.next = stackStart;
    var stackIn = null;
    var stackOut = null;
    yw = yi = 0;
    var mulSum = mulTable[radius];
    var shgSum = shgTable[radius];

    for (y = 0; y < height; y++) {
      rInSum = gInSum = bInSum = aInSum = rSum = gSum = bSum = aSum = 0;
      rOutSum = radiusPlus1 * (pr = pixels[yi]);
      gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
      bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);
      aOutSum = radiusPlus1 * (pa = pixels[yi + 3]);
      rSum += sumFactor * pr;
      gSum += sumFactor * pg;
      bSum += sumFactor * pb;
      aSum += sumFactor * pa;
      stack = stackStart;

      for (i = 0; i < radiusPlus1; i++) {
        stack.r = pr;
        stack.g = pg;
        stack.b = pb;
        stack.a = pa;
        stack = stack.next;
      }

      for (i = 1; i < radiusPlus1; i++) {
        p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
        rSum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
        gSum += (stack.g = pg = pixels[p + 1]) * rbs;
        bSum += (stack.b = pb = pixels[p + 2]) * rbs;
        aSum += (stack.a = pa = pixels[p + 3]) * rbs;
        rInSum += pr;
        gInSum += pg;
        bInSum += pb;
        aInSum += pa;
        stack = stack.next;
      }

      stackIn = stackStart;
      stackOut = stackEnd;

      for (x = 0; x < width; x++) {
        pixels[yi + 3] = pa = aSum * mulSum >> shgSum;

        if (pa !== 0) {
          pa = 255 / pa;
          pixels[yi] = (rSum * mulSum >> shgSum) * pa;
          pixels[yi + 1] = (gSum * mulSum >> shgSum) * pa;
          pixels[yi + 2] = (bSum * mulSum >> shgSum) * pa;
        } else {
          pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
        }

        rSum -= rOutSum;
        gSum -= gOutSum;
        bSum -= bOutSum;
        aSum -= aOutSum;
        rOutSum -= stackIn.r;
        gOutSum -= stackIn.g;
        bOutSum -= stackIn.b;
        aOutSum -= stackIn.a;
        p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;
        rInSum += stackIn.r = pixels[p];
        gInSum += stackIn.g = pixels[p + 1];
        bInSum += stackIn.b = pixels[p + 2];
        aInSum += stackIn.a = pixels[p + 3];
        rSum += rInSum;
        gSum += gInSum;
        bSum += bInSum;
        aSum += aInSum;
        stackIn = stackIn.next;
        rOutSum += pr = stackOut.r;
        gOutSum += pg = stackOut.g;
        bOutSum += pb = stackOut.b;
        aOutSum += pa = stackOut.a;
        rInSum -= pr;
        gInSum -= pg;
        bInSum -= pb;
        aInSum -= pa;
        stackOut = stackOut.next;
        yi += 4;
      }

      yw += width;
    }

    for (x = 0; x < width; x++) {
      gInSum = bInSum = aInSum = rInSum = gSum = bSum = aSum = rSum = 0;
      yi = x << 2;
      rOutSum = radiusPlus1 * (pr = pixels[yi]);
      gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
      bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);
      aOutSum = radiusPlus1 * (pa = pixels[yi + 3]);
      rSum += sumFactor * pr;
      gSum += sumFactor * pg;
      bSum += sumFactor * pb;
      aSum += sumFactor * pa;
      stack = stackStart;

      for (i = 0; i < radiusPlus1; i++) {
        stack.r = pr;
        stack.g = pg;
        stack.b = pb;
        stack.a = pa;
        stack = stack.next;
      }

      yp = width;

      for (i = 1; i <= radius; i++) {
        yi = yp + x << 2;
        rSum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
        gSum += (stack.g = pg = pixels[yi + 1]) * rbs;
        bSum += (stack.b = pb = pixels[yi + 2]) * rbs;
        aSum += (stack.a = pa = pixels[yi + 3]) * rbs;
        rInSum += pr;
        gInSum += pg;
        bInSum += pb;
        aInSum += pa;
        stack = stack.next;

        if (i < heightMinus1) {
          yp += width;
        }
      }

      yi = x;
      stackIn = stackStart;
      stackOut = stackEnd;

      for (y = 0; y < height; y++) {
        p = yi << 2;
        pixels[p + 3] = pa = aSum * mulSum >> shgSum;

        if (pa > 0) {
          pa = 255 / pa;
          pixels[p] = (rSum * mulSum >> shgSum) * pa;
          pixels[p + 1] = (gSum * mulSum >> shgSum) * pa;
          pixels[p + 2] = (bSum * mulSum >> shgSum) * pa;
        } else {
          pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
        }

        rSum -= rOutSum;
        gSum -= gOutSum;
        bSum -= bOutSum;
        aSum -= aOutSum;
        rOutSum -= stackIn.r;
        gOutSum -= stackIn.g;
        bOutSum -= stackIn.b;
        aOutSum -= stackIn.a;
        p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;
        rSum += rInSum += stackIn.r = pixels[p];
        gSum += gInSum += stackIn.g = pixels[p + 1];
        bSum += bInSum += stackIn.b = pixels[p + 2];
        aSum += aInSum += stackIn.a = pixels[p + 3];
        stackIn = stackIn.next;
        rOutSum += pr = stackOut.r;
        gOutSum += pg = stackOut.g;
        bOutSum += pb = stackOut.b;
        aOutSum += pa = stackOut.a;
        rInSum -= pr;
        gInSum -= pg;
        bInSum -= pb;
        aInSum -= pa;
        stackOut = stackOut.next;
        yi += width;
      }
    }

    return imageData;
  }
  /**
   *
   */


  var BlurStack = function BlurStack() {
    _classCallCheck(this, BlurStack);

    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.next = null;
  };

  function queryRequiredElement(root, selector) {
      const element = root.querySelector(selector);
      if (!element) {
          throw new Error(`missing imageWidget element: ${selector}`);
      }
      return element;
  }
  function drawRec($width, $canvas) {
      const ctx = $canvas.getContext('2d');
      if (!ctx) {
          return;
      }
      const width = Number($width.value);
      $canvas.width = width * 1.4;
      $canvas.height = width * 1.4;
      ctx.strokeStyle = '#f09199';
      ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
      // resize page
      window.dispatchEvent(new Event('resize'));
  }
  function changeInfo($info, $width, $radius) {
      const state = getBlurControlState($width, $radius);
      $info.value = getBlurAmountText(state);
  }
  function createImageWidgetEditor($target) {
      const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn submit-btn" value="上传处理后的图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100">
    <canvas class="blur-width-preview"></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">
    <br>
    <div class="canvas-btn-container" style="display: flex; align-items: center; gap: 10px; margin-top: 10px">
      <input class="inputBtn reset-btn" value="重置" type="button">
      <input class="inputBtn clear-btn" value="清除" type="button">
    </div>
    <div class="paste-tips" style="margin-top: 10px; color: #999;font-size: 12px">${getPasteTipsText(false)}</div>
    <img class="preview" src="" alt="" style="display:none;">
  `;
      const $info = document.createElement('div');
      $info.classList.add('e-wiki-cover-container');
      $info.innerHTML = rawHTML;
      if (!$target.parentElement) {
          return null;
      }
      $target.parentElement.insertBefore($info, $target.nextElementSibling);
      const refs = {
          container: $info,
          submitButton: queryRequiredElement($info, '.submit-btn'),
          previewCanvas: queryRequiredElement($info, '#e-wiki-cover-preview'),
          amountInput: queryRequiredElement($info, '#e-wiki-cover-amount'),
          widthSlider: queryRequiredElement($info, '#e-wiki-cover-slider-width'),
          widthPreviewCanvas: queryRequiredElement($info, '.blur-width-preview'),
          radiusSlider: queryRequiredElement($info, '#e-wiki-cover-slider-radius'),
          resetButton: queryRequiredElement($info, '.reset-btn'),
          clearButton: queryRequiredElement($info, '.clear-btn'),
          pasteTips: queryRequiredElement($info, '.paste-tips'),
          previewImage: queryRequiredElement($info, 'img.preview'),
          previewFetchLink: null,
      };
      drawRec(refs.widthSlider, refs.widthPreviewCanvas);
      changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
      refs.widthSlider.addEventListener('input', () => {
          drawRec(refs.widthSlider, refs.widthPreviewCanvas);
          changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
      });
      refs.radiusSlider.addEventListener('input', () => {
          changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
      });
      return refs;
  }
  /**
   * blur canvas
   * @param el target canvas
   * @param width blur rect width
   * @param radius blur rect height
   */
  function bindCanvasBlur(refs) {
      let isDrawing = false;
      const ctx = refs.previewCanvas.getContext('2d');
      if (!ctx) {
          return () => undefined;
      }
      const handleMouseDown = (e) => {
          isDrawing = true;
          const pos = getMousePos(refs.previewCanvas, e);
          ctx.moveTo(pos.x, pos.y);
      };
      const handleMouseMove = (e) => {
          if (isDrawing) {
              const pos = getMousePos(refs.previewCanvas, e);
              const { width, radius } = getBlurControlState(refs.widthSlider, refs.radiusSlider);
              // stack blur operation
              processCanvasRGBA(refs.previewCanvas, pos.x - width / 2, pos.y - width / 2, width, width, radius);
          }
      };
      const stopDrawing = () => {
          isDrawing = false;
      };
      refs.previewCanvas.addEventListener('mousedown', handleMouseDown);
      refs.previewCanvas.addEventListener('mousemove', handleMouseMove);
      refs.previewCanvas.addEventListener('mouseup', stopDrawing);
      refs.previewCanvas.addEventListener('mouseleave', stopDrawing);
      window.addEventListener('mouseup', stopDrawing);
      return () => {
          refs.previewCanvas.removeEventListener('mousedown', handleMouseDown);
          refs.previewCanvas.removeEventListener('mousemove', handleMouseMove);
          refs.previewCanvas.removeEventListener('mouseup', stopDrawing);
          refs.previewCanvas.removeEventListener('mouseleave', stopDrawing);
          window.removeEventListener('mouseup', stopDrawing);
      };
  }

  function appendFormItem(fd, item) {
      if (item.filename) {
          fd.set(item.name, item.value, item.filename);
          return;
      }
      if (item.value instanceof Blob) {
          fd.set(item.name, item.value);
          return;
      }
      fd.set(item.name, String(item.value));
  }
  function sendFormImg($form, image) {
      const $file = $form.querySelector('input[type=file]');
      return sendForm($form, [
          {
              name: $file?.name || 'picfile',
              value: image,
              filename: `${genRandomStr(5)}.png`,
          },
      ]);
  }
  /**
   * send form as xhr promise
   * TODO: return type
   * @param $form
   * @param extraInfo
   */
  function sendForm($form, extraInfo = []) {
      return new Promise((resolve, reject) => {
          const fd = new FormData($form);
          extraInfo.forEach((item) => {
              appendFormItem(fd, item);
          });
          const $submit = $form.querySelector('[name=submit]');
          if ($submit?.name && $submit.value) {
              fd.set($submit.name, $submit.value);
          }
          const xhr = new XMLHttpRequest();
          xhr.open(($form.method || 'POST').toUpperCase(), $form.action, true);
          xhr.onload = function () {
              if (xhr.status !== 200) {
                  reject(new Error(`request failed with status ${xhr.status}`));
                  return;
              }
              if (xhr.responseURL) {
                  resolve(xhr.responseURL);
                  return;
              }
              reject(new Error('no location'));
          };
          xhr.onerror = function () {
              reject(new Error('request failed'));
          };
          xhr.send(fd);
      });
  }

  function insertLoading($sibling) {
      const $loading = document.createElement('div');
      $loading.setAttribute('style', 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");');
      $sibling.parentElement.insertBefore($loading, $sibling);
      return $loading;
  }
  function bindUploadButton($file, $inputBtn, $canvas, $form) {
      if ($file) {
          const handleClick = async (e) => {
              e.preventDefault();
              if (!hasValidCanvasSize($canvas)) {
                  return;
              }
              const $el = e.target;
              $el.style.display = 'none';
              const $loading = insertLoading($el);
              try {
                  const $wikiMode = document.querySelector('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                  $wikiMode?.click();
                  await sleep(200);
                  const image = await canvasToBlob($canvas);
                  const url = await sendFormImg($form, image);
                  location.assign(url);
              }
              catch (e) {
                  console.log('send form err: ', e);
              }
              finally {
                  $el.style.display = '';
                  $loading.remove();
              }
          };
          $inputBtn.addEventListener('click', handleClick, false);
          return () => {
              $inputBtn.removeEventListener('click', handleClick, false);
          };
      }
      $inputBtn.value = '处理图片';
      return () => undefined;
  }

  const imageWidgetInstances = new WeakMap();
  function removeImageWidget($form) {
      const instance = imageWidgetInstances.get($form);
      if (instance) {
          instance.dispose();
          instance.container.remove();
          imageWidgetInstances.delete($form);
      }
  }
  /**
   * 初始化上传处理图片组件
   * @param {Object} $form - 包含 input file 的 DOM
   * @param {string} base64Data - 图片链接或者 base64 信息
   */
  function initImageWidget($form, base64Data) {
      const currentInstance = imageWidgetInstances.get($form);
      if (currentInstance?.container.isConnected) {
          return;
      }
      removeImageWidget($form);
      if (document.querySelector('.e-wiki-cover-container'))
          return;
      const refs = createImageWidgetEditor($form);
      if (!refs) {
          return;
      }
      const initialSource = resolveInitialPreviewSource(base64Data);
      const $file = $form.querySelector('input[type = file]');
      const disposePreviewFile = bindPreviewFileImage($file, refs);
      applyInitialPreviewData(initialSource, refs);
      const disposeCanvasBlur = bindCanvasBlur(refs);
      const disposePreviewControls = bindPreviewControls(initialSource, $file, refs);
      const disposePastePreview = bindPastePreview(refs);
      const disposeUploadButton = bindUploadButton($file, refs.submitButton, refs.previewCanvas, $form);
      imageWidgetInstances.set($form, {
          container: refs.container,
          dispose: () => {
              disposePreviewFile();
              disposeCanvasBlur();
              disposePreviewControls();
              disposePastePreview();
              disposeUploadButton();
          },
      });
  }

  function hasCategory(info, category) {
      if (info.category === category) {
          return true;
      }
      return (info.category &&
          info.category.includes(',') &&
          info.category.split(',').includes(category));
  }
  // ─── 常量 ────────────────────────────────────────────────────────────────────
  const MULTI_VALUE_FIELDS = new Set(['website']);
  const BLOCK_FIELDS = new Set(['别名', '链接', '平台']);
  // ─── 工具函数 ─────────────────────────────────────────────────────────────────
  function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function isEmptyFieldLine(line, fieldName) {
      return new RegExp(`^\\|\\s*${escapeRegExp(fieldName)}\\s*=\\s*$`).test(line.split('\n')[0].trim());
  }
  function isBlockStartLine(line, fieldName) {
      const namePattern = fieldName ? escapeRegExp(fieldName) : '.+?';
      return new RegExp(`^\\|\\s*${namePattern}\\s*=\\s*\\{\\s*$`).test(line.split('\n')[0].trim());
  }
  function extractFieldName(line) {
      const m = line.match(/(?:\||\[)(.+?)([|=])/);
      return m && m.length >= 2 ? m[1].trim() : null;
  }
  function ensureBlockSyntax(arr, fieldName) {
      const blockMarker = `|${fieldName}={`;
      const existingBlockIdx = arr.findIndex((v) => isBlockStartLine(v, fieldName));
      if (existingBlockIdx > -1) {
          const result = [...arr];
          result[existingBlockIdx] = blockMarker;
          return result;
      }
      const idx = arr.findIndex((v) => isEmptyFieldLine(v, fieldName));
      if (idx > -1) {
          const result = [...arr];
          result[idx] = blockMarker;
          return [...result.slice(0, idx + 1), '}', ...result.slice(idx + 1)];
      }
      return [...arr.slice(0, -1), blockMarker, '}', ...arr.slice(-1)];
  }
  function normaliseValue(info) {
      let d = getStringValue(info.value);
      if (info.category === 'date')
          d = dealDate(d);
      if (info.category === 'ISBN')
          d = d.replace(/-/g, '');
      return d;
  }
  function mergeInfoIntoLine(line, info, originValue) {
      const n = extractFieldName(line);
      if (n !== info.name)
          return null;
      const d = normaliseValue(info);
      // [英文名|] 格式
      if (/\[.+\|\]/.test(line)) {
          return line.replace(']', '') + d + ']';
      }
      // |平台={ 块格式，避免重复插入
      if (isBlockStartLine(line, info.name)) {
          const infoValue = getStringValue(info.value);
          if (!originValue.includes(`[${infoValue}]`) && !line.includes(`[${infoValue}]`)) {
              return `${line}\n[${infoValue}]`;
          }
          return line;
      }
      // 普通 |字段=值 格式
      return line.replace(/\s*=.*/, '=') + d;
  }
  function applyBlockFormats(arr, infoArr) {
      let result = [...arr];
      // 1. 模板规范字段（别名、链接、平台等）
      for (const fieldName of BLOCK_FIELDS) {
          const hasInfoForField = infoArr.some((info) => info.name === fieldName);
          if (hasInfoForField &&
              result.some((v) => isEmptyFieldLine(v, fieldName) || isBlockStartLine(v, fieldName))) {
              result = ensureBlockSyntax(result, fieldName);
          }
      }
      // 2. 允许多值的字段（website 等）
      for (const fieldName of MULTI_VALUE_FIELDS) {
          const infos = infoArr.filter((i) => i.name === fieldName);
          if (infos.length > 1) {
              result = ensureBlockSyntax(result, fieldName);
          }
      }
      // 3. 标记为 listItem 的字段
      for (const info of infoArr) {
          if (hasCategory(info, 'listItem')) {
              result = ensureBlockSyntax(result, info.name);
          }
      }
      return result;
  }
  function reorderAuthorBeforePress(lines) {
      let pressIdx = -1;
      let authorIdx = -1;
      for (let i = 0; i < lines.length; i++) {
          if (/\|(\s*)出版社(\s*)=/.test(lines[i]))
              pressIdx = i;
          if (/作者/.test(lines[i]))
              authorIdx = i;
      }
      if (pressIdx === -1 || authorIdx === -1 || authorIdx <= pressIdx)
          return null;
      const result = [...lines];
      const [author] = result.splice(authorIdx, 1);
      result.splice(pressIdx, 0, author);
      return result;
  }
  // ─── 主函数 ───────────────────────────────────────────────────────────────────
  function convertInfoValue(originValue, infoArr) {
      // 1. 初始化行数组
      let arr = originValue
          .trim()
          .split('\n')
          .filter(Boolean);
      // 2. 统一处理块格式字段
      arr = applyBlockFormats(arr, infoArr);
      // 3. 将 infoArr 中的值合并进 arr
      const unmatchedLines = [];
      for (const info of infoArr) {
          let matched = false;
          for (let i = 0; i < arr.length; i++) {
              const updated = mergeInfoIntoLine(arr[i], info, originValue);
              if (updated !== null) {
                  arr[i] = updated;
                  matched = true;
                  break;
              }
          }
          // 未匹配的字段（asin 除外）追加到末尾
          if (!matched && info.name && !['asin', 'ASIN'].includes(info.name)) {
              unmatchedLines.push(`|${info.name}=${getStringValue(info.value)}`);
          }
      }
      // 4. 移除末尾的 }}
      arr.pop();
      // 5. 组合最终行数组
      const finalLines = [...arr, ...unmatchedLines, '}}'];
      // 6. animanga/Book：作者排在出版社之前
      if (/animanga/.test(arr[0])) {
          const reordered = reorderAuthorBeforePress(finalLines);
          if (reordered)
              return reordered.join('\n');
      }
      return finalLines.join('\n');
  }

  /**
   * 插入控制填表的按钮
   * @param $t 插入按钮的父元素
   * @param cb 填表回调
   * @param cancelCb 清空表单回调
   */
  function insertFillFormBtn($t, cb, cancelCb) {
      // 存在节点后，不再插入
      const clx = 'e-wiki-fill-form';
      if ($qa('.' + clx).length >= 2)
          return;
      const $s = document.createElement('span');
      $s.classList.add(clx);
      $s.innerHTML = 'wiki 填表';
      $t.appendChild($s);
      $s.addEventListener('click', cb);
      const $cancel = $s.cloneNode();
      $cancel.innerHTML = '清空';
      $cancel.classList.add(clx + '-cancel');
      $cancel.addEventListener('click', cancelCb);
      $t.appendChild($cancel);
  }

  function getBangumiSubjectTypeName(typeId) {
      const typeDict = {
          [SubjectTypeId.game]: 'game',
          [SubjectTypeId.anime]: 'anime',
          [SubjectTypeId.music]: 'music',
          [SubjectTypeId.book]: 'book',
          [SubjectTypeId.real]: 'real',
          [SubjectTypeId.all]: 'all',
      };
      return typeDict[typeId];
  }
  function isDiscTrackList(value) {
      return Array.isArray(value) && value.every((disc) => Array.isArray(disc));
  }
  async function uploadSubjectCover(subjectId, image, bgmHost = '') {
      if (!bgmHost) {
          bgmHost = `${location.protocol}//${location.host}`;
      }
      const url = `${bgmHost}/subject/${subjectId}/upload_img`;
      const $hash = document.querySelector('form > input[name="formhash"]');
      if ($hash) {
          const fd = new FormData();
          fd.set('formhash', $hash.value);
          fd.set('picfile', image, genRandomStr(5) + '.png');
          fd.set('submit', '上传图片');
          return await fetch(url, {
              body: fd,
              method: 'post',
          });
      }
      else {
          const rawText = await fetchText(url);
          const $doc = new DOMParser().parseFromString(rawText, 'text/html');
          const $form = $doc.querySelector('form[name=img_upload]');
          if (!$form) {
              console.error('获取封面表单失败');
              return;
          }
          await sendFormImg($form, image);
      }
  }
  async function addMusicEp(subjectId, wikiInfo, log = (str) => console.log(str)) {
      if (location.pathname !== '/new_subject/3') {
          return;
      }
      // 音乐条目，添加ep
      const discInfo = wikiInfo.infos.find((item) => item.category === 'ep');
      if (discInfo && isDiscTrackList(discInfo.value)) {
          for (let i = 0; i < discInfo.value.length; i++) {
              const track = discInfo.value[i];
              const songlist = track.map((obj) => obj.title).join('\n');
              await addSonglist(subjectId, songlist, String(i + 1));
              log(`Disc${i + 1}: 添加曲目成功`);
              await sleep(500);
          }
      }
  }
  async function addSonglist(subjectId, songlist, disc = '1') {
      const $hash = document.querySelector('form > input[name="formhash"]');
      if ($hash) {
          const fd = new FormData();
          fd.set('formhash', $hash.value);
          fd.set('songlist', songlist);
          fd.set('disc', disc);
          fd.set('submit', '加上去');
          const res = await fetch(`/subject/${subjectId}/songlist/new`, {
              body: fd,
              method: 'post',
          });
          // if (res.status === 302) {
          //   const location = res.headers.get('Location');
          //   console.log('Redirected to:', location);
          //   return await fetch(location);
          // }
          return res;
      }
      else {
          const rawText = await fetchText(`/subject/${subjectId}/ep`);
          const $doc = new DOMParser().parseFromString(rawText, 'text/html');
          const $form = $doc.querySelector('form[name=new_songlist]');
          if (!$form) {
              console.error('获取封面表单失败');
              return;
          }
          await sendForm($form, [
              {
                  name: 'songlist',
                  value: songlist,
              },
              {
                  name: 'disc',
                  value: disc,
              },
              {
                  name: 'submit',
                  value: '加上去',
              },
          ]);
      }
  }
  async function searchCVByName(name, charaId = '') {
      const bgmHost = getBgmHost();
      let url = `${bgmHost}/json/search-cv_person/${name.replace(/\s/g, '')}`;
      if (charaId) {
          url = `${url}?character_id=${charaId}`;
      }
      const res = await fetchJson(url);
      return Object.keys(res)[0];
  }
  // 添加角色的关联条目
  async function addPersonRelatedSubject(subjectIds, charaId, typeId, charaType = 1) {
      const bgmHost = `${location.protocol}//${location.host}`;
      const type = getBangumiSubjectTypeName(typeId);
      const url = `${bgmHost}/character/${charaId}/add_related/${type}`;
      const $form = await getFormByIframe(url, '.mainWrapper form');
      const extroInfo = [];
      // 1 主角 2 配角 3 客串
      subjectIds.forEach((v, i) => {
          extroInfo.push({
              name: `infoArr[n${i}][crt_type]`,
              value: charaType,
          });
          extroInfo.push({
              name: `infoArr[n${i}][subject_id]`,
              value: v,
          });
      });
      // {name: 'submit', value: '保存关联数据'}
      await sendForm($form, [...extroInfo]);
  }
  // 未设置域名的兼容，只能在 Bangumi 本身上面使用
  // 添加角色的关联 CV
  async function addPersonRelatedCV(subjectId, charaId, personIds, typeId) {
      const bgmHost = `${location.protocol}//${location.host}`;
      const type = getBangumiSubjectTypeName(typeId);
      const url = `${bgmHost}/character/${charaId}/add_related/person/${type}`;
      const rawText = await fetchText(url);
      const $doc = new DOMParser().parseFromString(rawText, 'text/html');
      const $form = $doc.querySelector('.mainWrapper form');
      if (!$form) {
          throw new Error('related person form not found');
      }
      const personInfo = personIds.map((v, i) => ({
          name: `infoArr[n${i}][prsn_id]`,
          value: v,
      }));
      // {name: 'submit', value: '保存关联数据'}
      await sendForm($form, [
          {
              name: 'infoArr[n0][subject_id]',
              value: subjectId,
          },
          {
              name: 'infoArr[n0][subject_type_id]',
              value: typeId,
          },
          ...personInfo,
      ]);
  }

  function getSubmitBtnText(wikiInfo) {
      let text = '添加条目并上传封面';
      if (location.pathname === '/new_subject/3') {
          // 音乐条目，添加ep
          const discInfo = wikiInfo.infos.find((item) => item.category === 'ep');
          if (discInfo) {
              text = '添加条目并上传封面、添加曲目';
          }
      }
      return text;
  }
  function initSubjectSubmit(wikiInfo) {
      setTimeout(() => {
          const $form = $q('form[name=create_subject]');
          const $input = $q('.e-wiki-cover-container [name=submit]');
          const $clonedInput = $input.cloneNode(true);
          if ($clonedInput) {
              $clonedInput.value = getSubmitBtnText(wikiInfo);
          }
          $input.insertAdjacentElement('afterend', $clonedInput);
          $input.remove();
          const $canvas = $q('#e-wiki-cover-preview');
          $clonedInput.addEventListener('click', async (e) => {
              e.preventDefault();
              const $el = e.target;
              $el.style.display = 'none';
              $clonedInput.style.display = 'none';
              const $loading = insertLoading($el);
              try {
                  const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                  $wikiMode && $wikiMode.click();
                  await sleep(200);
                  const image = $canvas && hasValidCanvasSize($canvas)
                      ? await canvasToBlob($canvas)
                      : null;
                  const url = await sendForm($form);
                  const subjectId = getSubjectId(url);
                  if (subjectId && image) {
                      await uploadSubjectCover(subjectId, image);
                  }
                  await sleep(200);
                  await addMusicEp(subjectId, wikiInfo, (str) => {
                      insertLogInfo($el, str);
                  });
                  $loading.remove();
                  $el.style.display = '';
                  $clonedInput.style.display = '';
                  location.assign(url);
              }
              catch (e) {
                  console.log('send form err: ', e);
              }
          });
      }, 300);
  }
  function initCharacterSubmit(wikiInfo) {
      setTimeout(() => {
          const $form = $q('form[name=new_character]');
          const $input = $q('.e-wiki-cover-container [name=submit]');
          const $clonedInput = $input.cloneNode(true);
          if ($clonedInput) {
              $clonedInput.value = '添加人物并上传肖像';
          }
          $input.insertAdjacentElement('afterend', $clonedInput);
          $input.remove();
          // 2021-05-19 关联条目 id.
          const $relatedInput = htmlToElement(`
<span class="e-bnwh-related-id">
<span title="为空时不做关联操作">关联条目 id:</span>
<input type="number" placeholder="输入关联条目 id" />
</span>
      `);
          $clonedInput.insertAdjacentElement('afterend', $relatedInput);
          const $canvas = $q('#e-wiki-cover-preview');
          $clonedInput.addEventListener('click', async (e) => {
              e.preventDefault();
              if (hasValidCanvasSize($canvas)) {
                  const $el = e.target;
                  $el.style.display = 'none';
                  $clonedInput.style.display = 'none';
                  const $loading = insertLoading($el);
                  try {
                      const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                      $wikiMode && $wikiMode.click();
                      await sleep(200);
                      const currentHost = getBgmHost();
                      const image = await canvasToBlob($canvas);
                      const url = await sendFormImg($form, image);
                      insertLogInfo($el, `新建角色成功: ${genLinkText(url, '角色地址')}`);
                      const charaId = getSubjectId(url);
                      // subject id
                      const subjectId = $relatedInput.querySelector('input')?.value || '';
                      if (charaId && subjectId) {
                          insertLogInfo($el, '存在条目 id, 开始关联条目');
                          await addPersonRelatedSubject([subjectId], charaId, wikiInfo.type);
                          insertLogInfo($el, `关联条目成功: ${genLinkText(`${currentHost}/subject/${subjectId}`, '条目地址')}`);
                          const cvInfo = wikiInfo.infos.filter((item) => item.name.toUpperCase() === 'CV')[0];
                          if (cvInfo) {
                              const cvId = await searchCVByName(getStringValue(cvInfo.value), charaId);
                              cvId &&
                                  (await addPersonRelatedCV(subjectId, charaId, [cvId], wikiInfo.type));
                              insertLogInfo($el, `关联 CV 成功: ${genLinkText(`${currentHost}/person/${cvId}`)}`);
                          }
                      }
                      $loading.remove();
                      $el.style.display = '';
                      $clonedInput.style.display = '';
                      location.assign(url);
                  }
                  catch (e) {
                      console.log('send form err: ', e);
                      insertLogInfo($el, `出错了: ${e}`);
                  }
              }
          });
      }, 300);
  }
  // 人物页没有关联条目与 CV 的步骤；没有肖像时也允许直接提交表单
  function initPersonSubmit(deps = {}) {
      const navigate = deps.navigate ?? ((url) => location.assign(url));
      setTimeout(() => {
          const $form = $q('form[name=new_character]');
          const $input = $q('.e-wiki-cover-container [name=submit]');
          if (!$form || !$input)
              return;
          const $clonedInput = $input.cloneNode(true);
          $clonedInput.value = '添加人物并上传肖像';
          $input.insertAdjacentElement('afterend', $clonedInput);
          $input.remove();
          const $canvas = $q('#e-wiki-cover-preview');
          $clonedInput.addEventListener('click', async (e) => {
              e.preventDefault();
              const $el = e.target;
              $el.style.display = 'none';
              $clonedInput.style.display = 'none';
              const $loading = insertLoading($el);
              try {
                  const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
                  $wikiMode?.click();
                  await sleep(200);
                  const url = $canvas && hasValidCanvasSize($canvas)
                      ? await sendFormImg($form, await canvasToBlob($canvas))
                      : await sendForm($form);
                  insertLogInfo($el, `新建人物成功: ${genLinkText(url, '人物地址')}`);
                  $loading.remove();
                  $el.style.display = '';
                  $clonedInput.style.display = '';
                  navigate(url);
              }
              catch (e) {
                  console.log('send form err: ', e);
                  insertLogInfo($el, `出错了: ${e}`);
                  $loading.remove();
                  $el.style.display = '';
                  $clonedInput.style.display = '';
              }
          });
      }, 300);
  }

  const SUBJECT_TYPE_INPUT_SELECTOR = 'table tr:nth-of-type(2) > td:nth-of-type(2) input';
  const SUBJECT_TITLE_SELECTOR = 'input[name=subject_title]';
  const SUBJECT_SUMMARY_SELECTOR = '#subject_summary';
  const CHARACTER_SUMMARY_SELECTOR = '#crt_summary';
  const CHARACTER_NAME_SELECTOR = '#crt_name';
  const WIKI_MODE_SELECTOR = 'table small a:nth-of-type(1)[href="javascript:void(0)"]';
  const NEWBIE_MODE_SELECTOR = 'table small a:nth-of-type(2)[href="javascript:void(0)"]';
  const SUBJECT_INFOBOX_SELECTOR = '#subject_infobox';
  const SUBJECT_TITLE_RESET_SELECTOR = '#columnInSubjectA [name=subject_title]';
  const CHARACTER_NAME_RESET_SELECTOR = '#columnInSubjectA #crt_name';
  const COVER_CLEAR_BUTTON_SELECTOR = '.e-wiki-cover-container .clear-btn';
  const COVER_SUBMIT_SELECTOR = '.e-wiki-cover-container [name=submit]';
  const SUBJECT_FORM_SELECTOR = 'form[name=create_subject]';
  const CHARACTER_FORM_SELECTOR = 'form[name=new_character]';
  const UPLOAD_FORM_SELECTOR = 'form[name=img_upload]';
  const FORM_TITLE_PARENT_SELECTOR = 'form[name=create_subject] [name=subject_title]';
  const CHARACTER_TITLE_PARENT_SELECTOR = 'form[name=new_character] #crt_name';
  const SUBJECT_NAME_MAP = {
      誕生日: '生日',
      スリーサイズ: 'BWH',
  };
  function getInput(selector) {
      return $q(selector);
  }
  // 表单字段名可能带方括号（如 prsn_pro[artist]），必须放进带引号的属性选择器里
  function escapeAttrValue(value) {
      return value.replace(/["\\]/g, '\\$&');
  }
  function getFieldByName(tag, name) {
      return $q(`${tag}[name="${escapeAttrValue(name)}"]`);
  }
  function getTextArea(selector) {
      return $q(selector);
  }
  function getElement(selector) {
      return $q(selector);
  }
  function clickIfPresent(selector) {
      getElement(selector)?.click();
  }
  function setInputValue(selector, value) {
      const input = getInput(selector);
      if (input) {
          input.value = value;
      }
  }
  function setTextAreaValue(selector, value) {
      const textArea = getTextArea(selector);
      if (textArea) {
          textArea.value = value;
      }
  }
  function getInfoBoxValue() {
      return getTextArea(SUBJECT_INFOBOX_SELECTOR)?.value ?? '';
  }
  function clearPlatformInputs() {
      $qa('input[name=platform]').forEach((element) => {
          element.checked = false;
      });
  }
  function dispatchClearInfoEvent() {
      window.dispatchEvent(new CustomEvent('scriptMessage', {
          detail: {
              type: 'clearInfo',
          },
      }));
  }
  function resetSubjectForm(defaultVal) {
      clearPlatformInputs();
      clickIfPresent(WIKI_MODE_SELECTOR);
      setTextAreaValue(SUBJECT_INFOBOX_SELECTOR, defaultVal);
      setInputValue(SUBJECT_TITLE_RESET_SELECTOR, '');
      setInputValue(SUBJECT_SUMMARY_SELECTOR, '');
      getInput(COVER_CLEAR_BUTTON_SELECTOR)?.click();
      setInputValue('#editSummary', '');
      dispatchClearInfoEvent();
      const submitInput = getInput(COVER_SUBMIT_SELECTOR);
      if (submitInput) {
          submitInput.value = '添加条目并上传封面';
      }
  }
  function resetCharacterForm(defaultVal) {
      clickIfPresent(WIKI_MODE_SELECTOR);
      setTextAreaValue(SUBJECT_INFOBOX_SELECTOR, defaultVal);
      setInputValue(CHARACTER_NAME_RESET_SELECTOR, '');
      setInputValue(CHARACTER_SUMMARY_SELECTOR, '');
      const form = getElement(CHARACTER_FORM_SELECTOR);
      if (form) {
          removeImageWidget(form);
      }
  }
  /**
   * 填写 wiki 表单
   * TODO: 使用 MutationObserver 实现
   * @param wikiData
   */
  async function fillInfoBox(wikiData) {
      const { infos } = wikiData;
      const subType = Number(wikiData.subtype);
      const infoArray = [];
      // 只有条目草稿才有类型单选；角色、人物页面的表格第二行是别的输入框
      const typeInputs = wikiData.type === undefined
          ? []
          : Array.from($qa(SUBJECT_TYPE_INPUT_SELECTOR));
      if (typeInputs.length) {
          typeInputs[0]?.click();
          if (!Number.isNaN(subType)) {
              typeInputs[subType]?.click();
          }
      }
      await sleep(100);
      const wikiMode = getElement(WIKI_MODE_SELECTOR);
      const newbieMode = getElement(NEWBIE_MODE_SELECTOR);
      for (let i = 0, len = infos.length; i < len; i++) {
          const currentInfo = infos[i];
          const infoValue = getStringValue(currentInfo.value).trim();
          if (currentInfo.category === 'subject_title') {
              setInputValue(SUBJECT_TITLE_SELECTOR, infoValue);
              continue;
          }
          if (currentInfo.category === 'subject_summary') {
              setInputValue(SUBJECT_SUMMARY_SELECTOR, infoValue);
              continue;
          }
          if (currentInfo.category === 'crt_summary') {
              setInputValue(CHARACTER_SUMMARY_SELECTOR, infoValue);
              continue;
          }
          if (currentInfo.category === 'crt_name') {
              setInputValue(CHARACTER_NAME_SELECTOR, infoValue);
              continue;
          }
          if (currentInfo.category === 'checkbox') {
              const target = getFieldByName('input', currentInfo.name);
              if (target) {
                  target.checked = Boolean(currentInfo.value);
              }
              continue;
          }
          if (currentInfo.category === 'select') {
              const target = getFieldByName('select', currentInfo.name);
              if (target) {
                  target.value = infoValue;
              }
              continue;
          }
          // 有名称并且category不在特定列表里面
          if (currentInfo.name &&
              !['cover', 'crt_cover', 'ep'].includes(currentInfo.category ?? '')) {
              const name = currentInfo.name;
              if (Object.prototype.hasOwnProperty.call(SUBJECT_NAME_MAP, name)) {
                  infoArray.push({
                      ...currentInfo,
                      name: SUBJECT_NAME_MAP[name],
                  });
              }
              else {
                  infoArray.push(currentInfo);
              }
          }
      }
      wikiMode?.click();
      await sleep(200);
      const infoBox = getTextArea(SUBJECT_INFOBOX_SELECTOR);
      if (infoBox) {
          infoBox.value = convertInfoValue(infoBox.value, infoArray);
      }
      await sleep(200);
      newbieMode?.click();
  }
  function initNewSubject(wikiInfo) {
      const titleInput = getElement(FORM_TITLE_PARENT_SELECTOR);
      const parent = titleInput?.parentElement;
      if (!parent) {
          return;
      }
      const defaultVal = getInfoBoxValue();
      insertFillFormBtn(parent, async () => {
          await fillInfoBox(wikiInfo);
          setInputValue('#editSummary', '新条目');
      }, () => {
          resetSubjectForm(defaultVal);
      });
      const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
      const dataUrl = getCoverValue(coverInfo?.value)?.dataUrl || '';
      const subjectForm = getElement(SUBJECT_FORM_SELECTOR);
      if (subjectForm) {
          initImageWidget(subjectForm, dataUrl);
      }
      initSubjectSubmit(wikiInfo);
  }
  function initNewCharacter(wikiInfo, _subjectId) {
      const titleInput = getElement(CHARACTER_TITLE_PARENT_SELECTOR);
      const parent = titleInput?.parentElement;
      if (!parent) {
          return;
      }
      const defaultVal = getInfoBoxValue();
      insertFillFormBtn(parent, async () => {
          await fillInfoBox(wikiInfo);
      }, () => {
          resetCharacterForm(defaultVal);
      });
      const coverInfo = wikiInfo.infos.filter((item) => item.category === 'crt_cover')[0];
      let dataUrl = '';
      if (coverInfo && coverInfo.value) {
          if (isCoverValue(coverInfo.value)) {
              dataUrl = getCoverValue(coverInfo.value)?.dataUrl || '';
          }
          else {
              dataUrl = getStringValue(coverInfo.value);
          }
      }
      const characterForm = getElement(CHARACTER_FORM_SELECTOR);
      if (characterForm) {
          initImageWidget(characterForm, dataUrl);
      }
      initCharacterSubmit(wikiInfo);
  }
  function getPortraitDataUrl(infos) {
      const coverInfo = infos.find((item) => item.category === 'crt_cover');
      if (!coverInfo || !coverInfo.value) {
          return '';
      }
      if (isCoverValue(coverInfo.value)) {
          return getCoverValue(coverInfo.value)?.dataUrl || '';
      }
      return getStringValue(coverInfo.value);
  }
  // person/new 与 character/new 共用 form[name=new_character]，字段名也相同
  function initNewPerson(wikiInfo) {
      const titleInput = getElement(CHARACTER_TITLE_PARENT_SELECTOR);
      const parent = titleInput?.parentElement;
      if (!parent) {
          return;
      }
      const defaultVal = getInfoBoxValue();
      insertFillFormBtn(parent, async () => {
          await fillInfoBox(wikiInfo);
      }, () => {
          resetCharacterForm(defaultVal);
      });
      const dataUrl = getPortraitDataUrl(wikiInfo.infos);
      const personForm = getElement(CHARACTER_FORM_SELECTOR);
      if (personForm) {
          initImageWidget(personForm, dataUrl);
      }
      initPersonSubmit();
  }
  function initUploadImg(wikiInfo) {
      const coverInfo = wikiInfo.infos.filter((item) => item.category === 'cover')[0];
      const uploadForm = getElement(UPLOAD_FORM_SELECTOR);
      if (uploadForm) {
          initImageWidget(uploadForm, getCoverValue(coverInfo?.value)?.dataUrl);
      }
  }

  function getPageType() {
      const re = new RegExp([
          'new_subject',
          'add_related',
          'character/new',
          'person/new',
          'upload_img',
      ].join('|'));
      return document.location.href.match(re)?.[0] || '';
  }
  function getEmptySubjectInfo() {
      return {
          type: +window.location.pathname.split('/')[2] || 1,
          infos: [],
      };
  }
  function registerClearListener(runtime) {
      window.addEventListener('scriptMessage', async (event) => {
          const detail = event.detail;
          if (detail?.type === 'clearInfo') {
              console.info('clear info');
              await runtime.clearInfo();
          }
      });
  }
  function triggerAutoFill(runtime, delay = 200) {
      setTimeout(async () => {
          const $fillForm = $q('.e-wiki-fill-form');
          if (!$fillForm)
              return;
          $fillForm.click();
          await runtime.markAutoFillConsumed?.();
      }, delay);
  }
  async function initBangumiPage(runtime) {
      const pageType = getPageType();
      if (!pageType)
          return;
      const state = await runtime.loadPageState();
      registerClearListener(runtime);
      switch (pageType) {
          case 'new_subject':
              if (state.wikiData) {
                  initNewSubject(state.wikiData);
                  if (state.shouldAutoFill) {
                      triggerAutoFill(runtime, state.autoFillDelay);
                  }
              }
              else {
                  initNewSubject(getEmptySubjectInfo());
              }
              break;
          case 'add_related':
              break;
          case 'character/new':
              if (state.charaData) {
                  initNewCharacter(state.charaData, state.subjectId);
                  if (state.shouldAutoFill) {
                      triggerAutoFill(runtime, state.autoFillDelay);
                  }
              }
              break;
          case 'person/new':
              if (state.personData) {
                  initNewPerson(state.personData);
                  if (state.shouldAutoFill) {
                      triggerAutoFill(runtime, state.autoFillDelay);
                  }
              }
              break;
          case 'upload_img':
              if (state.wikiData) {
                  initUploadImg(state.wikiData);
              }
              break;
      }
  }

  const userScriptBangumiRuntimeAdapter = {
      loadPageState() {
          return userScriptDraftStore.loadBangumiPageState();
      },
      clearInfo() {
          return userScriptDraftStore.clearBangumiPageState();
      },
      markAutoFillConsumed() {
          return userScriptDraftStore.consumeAutoFill();
      },
  };

  const bangumi = {
      init() {
          return initBangumiPage(userScriptBangumiRuntimeAdapter);
      },
  };

  function getIframeSelector(itemSelector) {
      if (itemSelector instanceof Array) {
          return itemSelector.find((item) => item.isIframe === true)?.selector || '';
      }
      return itemSelector.isIframe ? itemSelector.selector : '';
  }
  async function getIframeDoc(itemSelector, runtime) {
      const iframeSel = getIframeSelector(itemSelector);
      if (!iframeSel) {
          return null;
      }
      const url = findElement({
          selector: iframeSel,
      })?.getAttribute('src');
      if (!url) {
          return null;
      }
      console.log('fetch html by runtime adapter');
      const rawHtml = await runtime.fetchHtml(url);
      return new DOMParser().parseFromString(rawHtml, 'text/html');
  }
  async function collectCharacterData(siteConfig, runtime, charaInfo) {
      if (!charaInfo.length)
          return null;
      await runtime.hydrateCharacterCover?.(charaInfo);
      console.info('character info list: ', charaInfo);
      return {
          type: siteConfig.type,
          infos: charaInfo,
      };
  }
  async function submitCharacter(siteConfig, runtime, charaInfo) {
      const charaData = await collectCharacterData(siteConfig, runtime, charaInfo);
      if (!charaData)
          return;
      await runtime.submitCharacterCreation({
          siteConfig,
          charaData,
      });
  }
  async function buildCharacterPayload(siteConfig, runtime, charaInfo) {
      const charaData = await collectCharacterData(siteConfig, runtime, charaInfo);
      if (!charaData)
          throw new Error('没有提取到角色信息。');
      return buildExportPayload({
          kind: 'character',
          site: siteConfig.key,
          sourceUrl: location.href,
          data: charaData,
      });
  }
  async function initCharacterModel(siteConfig, runtime, characterModel) {
      const presenceSelector = characterModel.presenceSelector;
      if (presenceSelector && !findElement(presenceSelector))
          return;
      const iframeDoc = getIframeSelector(characterModel.itemSelector)
          ? await getIframeDoc(characterModel.itemSelector, runtime)
          : null;
      const itemArr = iframeDoc
          ? findAllElement(characterModel.itemSelector, iframeDoc)
          : findAllElement(characterModel.itemSelector);
      if (!itemArr.length)
          return;
      const extractCharacter = ($target, reportSelectorCheck) => getCharaData(characterModel, { root: $target, reportSelectorCheck });
      if ((characterModel.controlMode ?? 'select') === 'inline') {
          itemArr.forEach(($target, index) => {
              const $controls = insertControlBtnChara($target, async () => {
                  await submitCharacter(siteConfig, runtime, await extractCharacter($target));
              });
              if (!$controls)
                  return;
              const debugSource = {
                  id: `character:${characterModel.key}:${index}`,
                  label: `角色 ${index + 1} · ${characterModel.description}`,
                  collect: async (report) => buildCharacterPayload(siteConfig, runtime, await extractCharacter($target, report)),
              };
              registerDebugSource(debugSource);
              appendExportBtn($controls, () => openDebugSource(debugSource));
          });
          return;
      }
      const toolbarSelector = characterModel.toolbarSelector;
      if (!toolbarSelector)
          return;
      const $toolbarEl = findElement(toolbarSelector);
      if (!$toolbarEl)
          return;
      const nameConfig = characterModel.itemList.find((item) => item.category == 'crt_name');
      if (!nameConfig)
          return;
      const names = await Promise.all(itemArr.map(async ($target) => {
          const infos = await getCharaData({
              ...characterModel,
              itemList: [nameConfig],
          }, createWikiExtractContext($target));
          return getStringValue(infos.find((item) => item.category === 'crt_name')?.value);
      }));
      const resolveTargets = (selectedName) => {
          if (selectedName === 'all') {
              // @TODO 一次性新建全部
              // return [...itemArr];
              return [];
          }
          const idx = names.indexOf(selectedName);
          return idx === -1 ? [] : itemArr.slice(idx, idx + 1);
      };
      const $ui = addCharaUI($toolbarEl, names, async (_e, selectedName) => {
          for (const $target of resolveTargets(selectedName)) {
              await submitCharacter(siteConfig, runtime, await extractCharacter($target));
          }
      });
      const $select = $ui?.querySelector('.e-bnwh-select');
      if (!$ui || !$select)
          return;
      const debugSource = {
          id: `character:${characterModel.key}:selected`,
          label: `角色（当前选择）· ${characterModel.description}`,
          collect: async (report) => {
              const [$target] = resolveTargets($select.value);
              if (!$target)
                  throw new Error('没有找到当前选择的角色。');
              return buildCharacterPayload(siteConfig, runtime, await extractCharacter($target, report));
          },
      };
      registerDebugSource(debugSource);
      appendExportBtn($ui, () => openDebugSource(debugSource));
  }
  async function initSourceCharacter(siteConfig, runtime) {
      const $page = findElement(siteConfig.pageSelectors);
      if (!$page)
          return;
      const characterModels = getCharacterModels(siteConfig.key);
      if (!characterModels.length)
          return;
      for (const characterModel of characterModels) {
          await initCharacterModel(siteConfig, runtime, characterModel);
      }
  }

  async function initChara(siteConfig) {
      return initSourceCharacter(siteConfig, userScriptRuntimeAdapter);
  }

  const PERSON_BUTTON_LABELS = {
      create: '新建人物',
      createWithCheck: '新建人物并查重',
  };
  // 站点 hook 没给的项才补默认值：人物类型下拉、职业勾选、引用来源
  function withDefaults(infos, model) {
      const res = [...infos];
      if (model.role !== undefined && !res.some((info) => info.name === 'crt_role')) {
          res.push({ name: 'crt_role', value: String(model.role), category: 'select' });
      }
      if (!res.some((info) => info.category === 'checkbox')) {
          for (const profession of model.professions ?? []) {
              res.push({
                  name: `prsn_pro[${profession}]`,
                  value: true,
                  category: 'checkbox',
              });
          }
      }
      if (!res.some((info) => info.name === '引用来源')) {
          // 只记页面本身的地址，去掉查询串与锚点
          res.push({
              name: '引用来源',
              value: location.origin + location.pathname,
              category: 'listItem',
          });
      }
      return res;
  }
  function getPersonName(infos) {
      return getStringValue(infos.find((info) => info.category === 'crt_name')?.value).trim();
  }
  async function collectPersonData(model, runtime, reportSelectorCheck) {
      const infos = withDefaults(await getPersonData(model, { root: document, reportSelectorCheck }), model);
      // 人物允许没有肖像；补抓失败只降级为不带图，不中断新建
      try {
          await runtime.hydratePersonCover?.(infos);
      }
      catch (error) {
          console.warn('person portrait hydration failed, continuing without it:', error);
      }
      console.info('person info list: ', infos);
      return { infos };
  }
  async function initSourcePerson(model, runtime) {
      const debugSource = {
          id: `person:${model.key}`,
          label: `人物 · ${model.description}`,
          collect: async (report) => buildExportPayload({
              kind: 'person',
              site: model.key,
              sourceUrl: location.href,
              data: await collectPersonData(model, runtime, report),
          }),
      };
      registerPageDebugFallback(debugSource, model);
      const $page = findElement(model.pageSelectors);
      if (!$page)
          return;
      const $control = findElement(model.controlSelector);
      if (!$control)
          return;
      const canCreate = await getPersonHooks(model, 'beforeCreate')();
      if (!canCreate)
          return;
      console.info(model.description, ' person content script init');
      const $controls = insertControlBtn($control, async (_e, shouldCheckDup) => {
          const personData = await collectPersonData(model, runtime);
          await runtime.submitPersonCreation({
              siteConfig: model,
              personData,
              queryInfo: { name: getPersonName(personData.infos) },
              shouldCheckDup: !!shouldCheckDup,
          });
      }, PERSON_BUTTON_LABELS);
      if (!$controls)
          return;
      registerDebugSource(debugSource);
      appendExportBtn($controls, () => openDebugSource(debugSource));
  }

  async function initPerson(model) {
      return initSourcePerson(model, userScriptRuntimeAdapter);
  }

  const BANGUMI_DOMAINS = ['bgm.tv', 'bangumi.tv', 'chii.in'];
  const TOKEN_SETTINGS_HASH = '#bnwh-token-settings';
  const TOKEN_ISSUE_URL = 'https://next.bgm.tv/demo/access-token';
  const SETTINGS_HOST_CLASS = 'e-bnwh-config-host';
  function getSettingsDialog() {
      return document
          .querySelector(`.${SETTINGS_HOST_CLASS}`)
          ?.shadowRoot?.querySelector('.e-bnwh-config-dialog');
  }
  function canEditToken() {
      const { protocol, hostname } = window.location;
      return window.top === window && protocol === 'https:' &&
          BANGUMI_DOMAINS.some((domain) => domain === hostname);
  }
  function openLinkedTokenSettings() {
      const { hash, pathname, search } = window.location;
      if (hash !== TOKEN_SETTINGS_HASH || !canEditToken())
          return;
      window.history.replaceState(window.history.state, '', pathname + search);
      showSettingsDialog(true);
  }
  function showSettingsDialog(focusToken = false) {
      const existing = getSettingsDialog();
      if (existing) {
          if (!existing.open)
              existing.showModal();
          if (focusToken)
              existing.querySelector('#e-bnwh-token')?.focus();
          return;
      }
      const currentDomain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
      const useHttps = (GM_getValue(PROTOCOL) || 'https') === 'https';
      const fallbackToWebSearch = GM_getValue(FALLBACK_TO_WEB_SEARCH) || false;
      const showExportButtons = GM_getValue(SHOW_EXPORT_BUTTONS) === true;
      const hasAccessToken = Boolean(GM_getValue(BGM_ACCESS_TOKEN));
      const editTokenHere = canEditToken();
      const tokenSettingsHost = BANGUMI_DOMAINS.find((domain) => domain === currentDomain) ?? 'bgm.tv';
      const domainOptions = BANGUMI_DOMAINS.map((domain) => `<option value="${domain}"${domain === currentDomain ? ' selected' : ''}>${domain}</option>`).join('');
      const $host = document.createElement('div');
      $host.className = SETTINGS_HOST_CLASS;
      const $shadow = $host.attachShadow({ mode: 'open' });
      const $dialog = htmlToElement(`
<dialog class="e-bnwh-config-dialog" lang="zh-Hans" aria-labelledby="e-bnwh-config-title">
  <style>
    :host {
      all: initial !important;
      display: contents !important;
    }
    .e-bnwh-config-dialog {
      box-sizing: border-box;
      width: min(460px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      margin: auto;
      padding: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
      font: 14px/1.55 ${UI_FONT_STACK};
      color-scheme: light;
    }
    .e-bnwh-config-dialog::backdrop {
      background: rgba(15, 23, 42, 0.42);
    }
    .e-bnwh-config-content {
      box-sizing: border-box;
      padding: 20px;
    }
    .e-bnwh-config-header {
      margin-bottom: 14px;
    }
    .e-bnwh-config-title {
      margin: 0;
      color: #09090b;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.4;
    }
    .e-bnwh-config-row-desc,
    .e-bnwh-config-status {
      color: #71717a;
      font-size: 12px;
      line-height: 1.45;
    }
    .e-bnwh-config-section {
      display: grid;
      gap: 8px;
      padding: 14px 0;
      border-top: 1px solid #e5e7eb;
    }
    .e-bnwh-config-row {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 44px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .e-bnwh-config-row:hover {
      border-color: #d4d4d8;
      background: #f8fafc;
    }
    .e-bnwh-config-row-text {
      display: grid;
      gap: 3px;
      min-width: 0;
    }
    .e-bnwh-config-row-title {
      color: #09090b;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.35;
    }
    .e-bnwh-config-row-desc {
      margin: 0;
    }
    .e-bnwh-config-switch {
      appearance: none;
      position: relative;
      flex: 0 0 auto;
      width: 38px;
      height: 22px;
      margin: 0;
      border: 1px solid transparent;
      border-radius: 999px;
      background: #e4e4e7;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .e-bnwh-config-switch::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
      transition: transform 0.15s ease;
    }
    .e-bnwh-config-switch:checked {
      background: #18181b;
    }
    .e-bnwh-config-switch:checked::after {
      transform: translateX(16px);
    }
    .e-bnwh-config-select {
      box-sizing: border-box;
      min-width: 120px;
      height: 36px;
      padding: 0 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      font: inherit;
      font-size: 13px;
    }
    .e-bnwh-config-switch:focus-visible,
    .e-bnwh-config-select:focus-visible,
    .e-bnwh-config-input:focus-visible,
    .e-bnwh-config-button:focus-visible {
      outline: 2px solid #18181b;
      outline-offset: 2px;
    }
    .e-bnwh-config-status {
      margin: 0;
    }
    .e-bnwh-config-status[data-error] {
      color: #b91c1c;
    }
    .e-bnwh-config-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    .e-bnwh-config-button {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      padding: 0 14px;
      border: 1px solid #18181b;
      border-radius: 8px;
      color: #fff;
      background: #18181b;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }
    .e-bnwh-config-button:hover {
      background: #27272a;
    }
    .e-bnwh-config-button:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .e-bnwh-config-button[hidden] { display: none; }
    .e-bnwh-config-button-secondary {
      border-color: #d4d4d8;
      background: #fff;
      color: #18181b;
    }
    .e-bnwh-config-button-secondary:hover {
      background: #f4f4f5;
      color: #18181b;
    }
    .e-bnwh-config-token-header,
    .e-bnwh-config-token-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .e-bnwh-config-token-header { justify-content: space-between; }
    .e-bnwh-config-token-header h2 { margin: 0; }
    .e-bnwh-config-token-state { display: block; margin-top: 2px; }
    .e-bnwh-config-token-form { display: grid; gap: 8px; margin: 0; }
    .e-bnwh-config-input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      min-height: 40px;
      padding: 8px 10px;
      border: 1px solid #d4d4d8;
      border-radius: 8px;
      background: #fff;
      color: #18181b;
      font: inherit;
    }
  </style>
  <div class="e-bnwh-config-content">
    <div class="e-bnwh-config-header">
      <p id="e-bnwh-config-title" class="e-bnwh-config-title">条目助手设置</p>
    </div>
    <div class="e-bnwh-config-section">
      <div class="e-bnwh-config-token-header">
        <div>
          <h2 id="e-bnwh-token-title" class="e-bnwh-config-row-title">Bangumi Access Token</h2>
          <span class="e-bnwh-config-row-desc e-bnwh-config-token-state">${hasAccessToken ? '已配置' : '未配置'}</span>
        </div>
        <a class="e-bnwh-config-button e-bnwh-config-button-secondary" href="${TOKEN_ISSUE_URL}" target="_blank" rel="noopener noreferrer">获取 Token ↗</a>
      </div>
      <p id="e-bnwh-token-help" class="e-bnwh-config-row-desc">${editTokenHere
        ? '粘贴令牌后验证保存。查重时可搜索账号有权查看的 R18 条目。'
        : '请在 Bangumi 页面粘贴并验证令牌。'}</p>
      ${editTokenHere ? `
      <form class="e-bnwh-config-token-form">
        <input id="e-bnwh-token" class="e-bnwh-config-input" type="password" autocomplete="off" spellcheck="false" placeholder="${hasAccessToken ? '粘贴新 Token 以替换' : '粘贴 Access Token'}" aria-labelledby="e-bnwh-token-title" aria-describedby="e-bnwh-token-help" required>
        <div class="e-bnwh-config-token-actions">
          <button class="e-bnwh-config-button" type="submit">验证并保存</button>
          <button class="e-bnwh-config-button e-bnwh-config-button-secondary e-bnwh-config-clear-token" type="button"${hasAccessToken ? '' : ' hidden'}>清除 Token</button>
        </div>
        <p class="e-bnwh-config-status e-bnwh-config-token-feedback" role="status"></p>
      </form>
      ` : `
      <div class="e-bnwh-config-token-actions">
        <a class="e-bnwh-config-button" href="https://${tokenSettingsHost}/${TOKEN_SETTINGS_HASH}" target="_blank" rel="noopener noreferrer">去 Bangumi 配置 ↗</a>
      </div>
      `}
    </div>
    <div class="e-bnwh-config-section">
      <label class="e-bnwh-config-row" for="e-bnwh-domain">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">Bangumi 域名</span>
          <span class="e-bnwh-config-row-desc">新建条目与查重请求使用的站点</span>
        </span>
        <select class="e-bnwh-config-select" id="e-bnwh-domain">${domainOptions}</select>
      </label>
      <label class="e-bnwh-config-row" for="e-bnwh-use-https">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">使用 HTTPS</span>
          <span class="e-bnwh-config-row-desc">关闭后使用 HTTP 访问所选域名</span>
        </span>
        <input class="e-bnwh-config-switch" type="checkbox" id="e-bnwh-use-https"${useHttps ? ' checked' : ''}>
      </label>
    </div>
    <div class="e-bnwh-config-section">
      <label class="e-bnwh-config-row" for="e-bnwh-web-search-fallback">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">启用网页搜索回退</span>
          <span class="e-bnwh-config-row-desc">默认关闭。旧版 JSON 搜索无结果时，再请求站内搜索页查重。</span>
        </span>
        <input class="e-bnwh-config-switch" type="checkbox" id="e-bnwh-web-search-fallback"${fallbackToWebSearch ? ' checked' : ''}>
      </label>
      <label class="e-bnwh-config-row" for="e-bnwh-show-export">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">显示数据调试按钮</span>
          <span class="e-bnwh-config-row-desc">在来源页面显示条目、人物和角色的快捷调试入口</span>
        </span>
        <input class="e-bnwh-config-switch" type="checkbox" id="e-bnwh-show-export"${showExportButtons ? ' checked' : ''}>
      </label>
    </div>
    <div class="e-bnwh-config-footer">
      <p class="e-bnwh-config-status e-bnwh-config-general-status" role="status"></p>
      <button class="e-bnwh-config-button e-bnwh-config-close" type="button" autofocus>完成</button>
    </div>
  </div>
</dialog>
`);
      const $status = $dialog.querySelector('.e-bnwh-config-general-status');
      const setStatus = (message) => {
          $status.textContent = message;
      };
      const tokenInput = initTokenForm($dialog);
      $dialog
          .querySelector('#e-bnwh-domain')
          .addEventListener('change', (event) => {
          const value = event.currentTarget.value;
          GM_setValue(BGM_DOMAIN, value);
          setStatus(`Bangumi 域名已保存为 ${value}。`);
      });
      $dialog
          .querySelector('#e-bnwh-use-https')
          .addEventListener('change', (event) => {
          const checked = event.currentTarget.checked;
          GM_setValue(PROTOCOL, checked ? 'https' : 'http');
          setStatus(`HTTPS 已${checked ? '开启' : '关闭'}。`);
      });
      $dialog
          .querySelector('#e-bnwh-web-search-fallback')
          .addEventListener('change', (event) => {
          const checked = event.currentTarget.checked;
          GM_setValue(FALLBACK_TO_WEB_SEARCH, checked);
          setStatus(`网页搜索回退已${checked ? '开启' : '关闭'}。`);
      });
      $dialog
          .querySelector('#e-bnwh-show-export')
          .addEventListener('change', (event) => {
          const checked = event.currentTarget.checked;
          GM_setValue(SHOW_EXPORT_BUTTONS, checked);
          setExportButtonsVisible(checked);
          setStatus(`数据调试按钮已${checked ? '显示' : '隐藏'}。`);
      });
      const refreshTokenState = () => {
          $dialog.querySelector('.e-bnwh-config-token-state').textContent =
              GM_getValue(BGM_ACCESS_TOKEN) ? '已配置' : '未配置';
      };
      if (!editTokenHere)
          window.addEventListener('focus', refreshTokenState);
      $dialog
          .querySelector('.e-bnwh-config-close')
          .addEventListener('click', () => $dialog.close());
      $dialog.addEventListener('close', () => {
          window.removeEventListener('focus', refreshTokenState);
          $host.remove();
      }, { once: true });
      $dialog.addEventListener('click', (event) => {
          if (event.target === $dialog)
              $dialog.close();
      });
      $shadow.appendChild($dialog);
      document.body.appendChild($host);
      $dialog.showModal();
      if (focusToken)
          tokenInput?.focus();
  }
  function initTokenForm(dialog) {
      const form = dialog.querySelector('.e-bnwh-config-token-form');
      if (!form)
          return;
      const input = form.querySelector('#e-bnwh-token');
      const submit = form.querySelector('button[type="submit"]');
      const clear = form.querySelector('.e-bnwh-config-clear-token');
      const feedback = form.querySelector('.e-bnwh-config-token-feedback');
      const state = dialog.querySelector('.e-bnwh-config-token-state');
      const setFeedback = (message, error = false) => {
          feedback.toggleAttribute('data-error', error);
          feedback.textContent = message;
      };
      const updateState = (configured) => {
          state.textContent = configured ? '已配置' : '未配置';
          input.value = '';
          input.placeholder = configured ? '粘贴新 Token 以替换' : '粘贴 Access Token';
          clear.hidden = !configured;
      };
      form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (submit.disabled)
              return;
          const token = input.value.trim();
          if (!token) {
              setFeedback('请先粘贴 Access Token。', true);
              input.focus();
              return;
          }
          input.readOnly = submit.disabled = clear.disabled = true;
          setFeedback('正在验证 Token…');
          try {
              await verifyBangumiAccessToken(token);
              if (!dialog.isConnected || !dialog.open)
                  return;
              GM_setValue(BGM_ACCESS_TOKEN, token);
              updateState(true);
              setFeedback('验证通过，Token 已保存。');
          }
          catch (error) {
              setFeedback(error instanceof BangumiAccessTokenError
                  ? 'Bangumi 拒绝了此 Token。请检查是否复制完整，或重新获取。'
                  : '暂时无法验证 Token。请检查网络后重试。', true);
          }
          finally {
              input.readOnly = submit.disabled = clear.disabled = false;
          }
      });
      clear.addEventListener('click', () => {
          GM_deleteValue(BGM_ACCESS_TOKEN);
          updateState(false);
          setFeedback('Token 已清除。');
          input.focus();
      });
      return input;
  }

  if (GM_registerMenuCommand) {
      GM_registerMenuCommand('条目助手设置', () => showSettingsDialog());
      GM_registerMenuCommand('调试当前页面数据', () => void showCurrentPageDebugTool());
  }
  const init = async () => {
      const host = window.location.hostname;
      let styled = false;
      const ensureStyle = () => {
          if (!styled) {
              addStyle();
              styled = true;
          }
      };
      const modelArr = findModelByHost(host);
      const personModels = findPersonModels(host, window.location.href);
      if (modelArr.length || personModels.length) {
          const syncExportButtons = () => setExportButtonsVisible(GM_getValue(SHOW_EXPORT_BUTTONS) === true);
          syncExportButtons();
          window.addEventListener('focus', syncExportButtons);
      }
      if (modelArr && modelArr.length) {
          ensureStyle();
          modelArr.forEach((m) => {
              initCommon(m);
              initChara(m);
          });
      }
      if (personModels.length) {
          ensureStyle();
          personModels.forEach((m) => {
              initPerson(m);
          });
      }
      if (['bangumi.tv', 'chii.in', 'bgm.tv'].includes(host)) {
          ensureStyle();
          openLinkedTokenSettings();
          bangumi.init();
      }
  };
  init();

})();
