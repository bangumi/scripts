// ==UserScript==
// @name        bangumi new wiki helper
// @name:zh-CN  bangumi创建条目助手
// @namespace   https://github.com/22earth
// @description assist to create new subject
// @description:zh-cn 辅助创建Bangumi条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/www\.amazon\.co\.jp\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @author      22earth
// @version     0.0.5
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://cdn.staticfile.org/fuse.js/2.6.2/fuse.min.js
// ==/UserScript==


/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function gmFetchBinary(url, TIMEOUT) {
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      method: "GET",
      timeout: TIMEOUT || 10 * 1000,
      url: url,
      overrideMimeType: "text\/plain; charset=x-user-defined",
      onreadystatechange: function onreadystatechange(response) {
        if (response.readyState === 4 && response.status === 200) {
          resolve(response.responseText);
        }
      },
      onerror: function onerror(err) {
        reject(err);
      },
      ontimeout: function ontimeout(err) {
        reject(err);
      }
    });
  });
}

function gmFetch(url, TIMEOUT) {
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      method: "GET",
      timeout: TIMEOUT || 10 * 1000,
      url: url,
      onreadystatechange: function onreadystatechange(response) {
        if (response.readyState === 4 && response.status === 200) {
          resolve(response.responseText);
        }
      },
      onerror: function onerror(err) {
        reject(err);
      },
      ontimeout: function ontimeout(err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  gmFetch: gmFetch,
  gmFetchBinary: gmFetchBinary
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var gmFetchBinary = __webpack_require__(0).gmFetchBinary;

function getImageSuffix(url) {
  var m = url.match(/png|jpg|jpeg|gif|bmp/);
  if (m) {
    switch (m[0]) {
      case 'png':
        return 'png';
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
    }
  }
  return '';
}

function getImageBase64(url) {
  return gmFetchBinary(url).then(function (info) {
    var binary = '';
    for (var i = 0; i < info.length; i++) {
      binary += String.fromCharCode(info.charCodeAt(i) & 0xff);
    }
    return 'data:image/' + getImageSuffix(url) + ';base64,' + btoa(binary);
  });
}

module.exports = getImageBase64;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fetchBangumiDataBySearch = __webpack_require__(3).fetchBangumiDataBySearch;
var getImageBase64 = __webpack_require__(1);
var dealImageWidget = __webpack_require__(6);
var getInfoTool = __webpack_require__(8);
var configModels = __webpack_require__(9);
var fillInfoBox = __webpack_require__(11);

function setDomain() {
  bgm_domain = prompt('预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv', 'bgm.tv');
  GM_setValue('bgm', bgm_domain);
  return bgm_domain;
}
var bgm_domain = GM_getValue('bgm') || '';
if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|bgm\.tv/)) {
  bgm_domain = setDomain();
  bgm_domain = GM_getValue('bgm');
}
if (GM_registerMenuCommand) {
  GM_registerMenuCommand('\u8BBE\u7F6E\u57DF\u540D', setDomain, 'b');
}
var addStyle = function addStyle(css) {
  if (css) {
    GM_addStyle(css);
  } else {
    GM_addStyle('\n.e-wiki-new-character,.e-wiki-new-subject,.e-wiki-search-subject,.e-wiki-fill-form{color: rgb(0, 180, 30) !important;margin-left: 4px !important;}\n.e-wiki-new-subject {\n  margin-left: 8px;\n}\n.e-wiki-new-character:hover,.e-wiki-new-subject:hover,.e-wiki-search-subject:hover,.e-wiki-fill-form:hover{color:red !important;cursor:pointer;}\n');
  }
};

/**
 * 插入脚本
 *
 */
function injectScript(fn, data) {
  var selfInvokeScript = document.createElement("script");
  selfInvokeScript.innerHTML = '(' + fn.toString() + ')(' + data + ');';
  document.body.appendChild(selfInvokeScript);
}

// 变更url的域名
function changeDomain(url, domain) {
  if (url.match(domain)) return url;
  if (domain === 'bangumi.tv') {
    return url.replace('https', 'http').replace('bgm.tv', domain);
  }
}

async function handleClick(config, checkFlag) {
  var subjectInfoList = config.itemList.map(function (i) {
    return getInfoTool.getWikiItem(i);
  });
  console.info('fetch info: ', subjectInfoList);
  var queryInfo = getInfoTool.getQueryInfo(subjectInfoList);
  var type = config.newSubjectType;
  var result = null;
  if (checkFlag) {
    result = await checkSubjectExist(queryInfo, type);
  }
  if (result && result.subjectURL) {
    GM_openInTab(changeDomain(result.subjectURL, bgm_domain));
  } else {
    var coverInfo = getInfoTool.getCoverURL(config.cover);
    var subjectCover = '';
    if (coverInfo && coverInfo.coverURL) {
      subjectCover = await getImageBase64(coverInfo.coverURL);
    }
    var subType = getInfoTool.getSubType(config.subType);
    GM_setValue('subjectData', JSON.stringify({
      subjectInfoList: subjectInfoList,
      subjectCover: subjectCover,
      subType: subType
    }));
    GM_openInTab(changeDomain('https://bgm.tv/new_subject/' + type, bgm_domain));
  }
}

async function checkSubjectExist(queryInfo, newSubjectType) {
  var searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType);
  console.info('First: search result of bangumi: ', searchResult);
  if (searchResult && searchResult.subjectURL) {
    return searchResult;
  }
  if (queryInfo.isbn) {
    queryInfo.isbn = undefined;
    searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType);
    console.info('Second: search result of bangumi: ', searchResult);
    return searchResult;
  }
}
var amazon = {
  init: function init() {
    var configKey = this.getConfigKey();
    if (!configKey) return;
    addStyle();
    var $title = document.querySelector('#title');
    this.insertBtn($title, configKey);
  },
  getConfigKey: function getConfigKey() {
    var $nav = document.querySelector('#nav-subnav .nav-a-content');
    if (/本/.test($nav.textContent)) return 'amazon_jp_book';
  },
  insertBtn: function insertBtn($t, configKey) {
    var $s = document.createElement('span');
    $s.classList.add('e-wiki-new-subject');
    $s.innerHTML = '新建';
    var $search = $s.cloneNode();
    $search.innerHTML = '新建并查重';
    $t.appendChild($s);
    $t.appendChild($search);
    $s.addEventListener('click', function () {
      var config = configModels[configKey];
      handleClick(config, false);
    }, false);
    $search.addEventListener('click', function () {
      var config = configModels[configKey];
      handleClick(config, true);
    }, false);
  }
};

var bangumi = {
  init: function init() {
    var re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
    var page = document.location.href.match(re);
    if (page) {
      addStyle();
      switch (page[0]) {
        case 'new_subject':
          var $t = document.querySelector('form[name=create_subject] [name=subject_title]').parentElement;
          this.insertBtn($t);
          break;
        case 'add_related':
          // this.addRelated();
          break;
        case 'character\/new':
          // this.newCharacter();
          break;
        case 'upload_img':
          addStyle('\n.e-wiki-cover-container {\n  margin-top: 1rem;\n}\n.e-wiki-cover-container img {\n  display: \'none\';\n}\n#e-wiki-cover-amount {\n  padding-left: 10px;\n  border: 0;\n  color: #f6931f;\n  font-size: 20px;\n  font-weight: bold;\n}\n#e-wiki-cover-reset {\n  display: inline-block;\n  text-align: center;\n  width: 60px;\n  height: 30px;\n  line-height: 30px;\n  font-size: 18px;\n  background-color: #f09199;\n  text-decoration: none;\n  color: #fff;\n  margin-left: 50px;\n  margin-bottom: 30px;\n  border-radius: 5px;\n  box-shadow:1px 1px 2px #333;\n}\n#e-wiki-cover-preview {\n  margin-top: 0.5rem;\n}\n#e-wiki-cover-preview:active {\n  cursor: crosshair;\n}\n#e-wiki-cover-preview {\n  display: block;\n}\n.e-wiki-cover-blur-loading {\n  width: 208px;\n  height: 13px;\n  background-image: url("https://bgm.tv/img/loadingAnimation.gif");\n}\n.e-wiki-search-cover {\n  width: 84px;\n  height: auto;\n}\n          ');
          var subjectData = JSON.parse(GM_getValue('subjectData'));
          dealImageWidget(document.querySelector('form[name=img_upload]'), subjectData.subjectCover);
          // this.addSubjectCover();
          break;
      }
    }
  },
  insertBtn: function insertBtn($t) {
    var $s = document.createElement('span');
    $s.classList.add('e-wiki-fill-form');
    $s.innerHTML = 'wiki 填表';
    $t.appendChild($s);
    $s.addEventListener('click', function () {
      var subjectData = JSON.parse(GM_getValue('subjectData'));
      fillInfoBox(subjectData);
    }, false);
  }
};

var init = function init() {
  var re = new RegExp(['getchu', 'bangumi', 'bgm', 'amazon'].join('|'));
  var page = document.location.host.match(re);
  if (page) {
    switch (page[0]) {
      case 'amazon':
        amazon.init();
        break;
      case 'bangumi':
      case 'bgm':
        bangumi.init();
        break;
      default:
      // bangumi.init();
    }
  }
};
init();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var gmFetch = __webpack_require__(0).gmFetch;
var delayPromise = __webpack_require__(4);
var filterResults = __webpack_require__(5);

function dealDate(dateStr) {
  return dateStr.replace(/年|月|日/g, '/').replace(/\/$/, '');
}

function htmlToElement(html) {
  var template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}
/**
 * @return {array}
 */
function dealRawHTML(info) {
  var rawInfoList = [];
  var $doc = new DOMParser().parseFromString(info, "text/html");

  var items = $doc.querySelectorAll('#browserItemList>li>div.inner');
  // get number of page
  var numOfPage = 1;
  var pList = $doc.querySelectorAll('.page_inner>.p');
  if (pList && pList.length) {
    var tempNum = parseInt(pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]);
    numOfPage = parseInt(pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]);
    numOfPage = numOfPage > tempNum ? numOfPage : tempNum;
  }
  if (items && items.length) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var item = _step.value;

        var $subjectTitle = item.querySelector('h3>a.l');
        var itemSubject = {
          subjectTitle: $subjectTitle.textContent.trim(),
          subjectURL: 'https://bgm.tv' + $subjectTitle.getAttribute('href'),
          subjectGreyTitle: item.querySelector('h3>.grey') ? item.querySelector('h3>.grey').textContent.trim() : ''
        };
        var matchDate = item.querySelector('.info').textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
        if (matchDate) {
          itemSubject.startDate = dealDate(matchDate[0]);
        }
        var $rateInfo = item.querySelector('.rateInfo');
        if ($rateInfo) {
          if ($rateInfo.querySelector('.fade')) {
            itemSubject.averageScore = $rateInfo.querySelector('.fade').textContent;
            itemSubject.ratingsCount = $rateInfo.querySelector('.tip_j').textContent.replace(/[^0-9]/g, '');
          } else {
            itemSubject.averageScore = '0';
            itemSubject.ratingsCount = '少于10';
          }
        } else {
          itemSubject.averageScore = '0';
          itemSubject.ratingsCount = '0';
        }
        rawInfoList.push(itemSubject);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } else {
    return [];
  }
  return [rawInfoList, numOfPage];
}

/**
 * 搜索bgm条目
 * @param {Object} subjectInfo
 * @param {number} typeNumber
 */
function fetchBangumiDataBySearch(subjectInfo, typeNumber) {
  var startDate;
  if (subjectInfo && subjectInfo.startDate) {
    startDate = subjectInfo.startDate;
  }
  typeNumber = typeNumber || 'all';
  var query = subjectInfo.subjectName;
  console.log(subjectInfo);
  // if (subjectInfo.isbn13) {
  //   query = subjectInfo.isbn13;
  // }
  if (subjectInfo.isbn) {
    query = subjectInfo.isbn;
  }
  if (!query) {
    console.info('Query string is empty');
    return Promise.resolve();
  }
  var url = 'https://bgm.tv/subject_search/' + encodeURIComponent(query) + '?cat=' + typeNumber;
  console.info('seach bangumi subject URL: ', url);
  return gmFetch(url).then(function (info) {
    var rawInfoList = dealRawHTML(info)[0] || [];
    // 使用ISBN 搜索时，不再使用名称过滤
    if (subjectInfo.isbn) {
      return rawInfoList[0];
    }
    return filterResults(rawInfoList, subjectInfo.subjectName, {
      keys: ['subjectTitle', 'subjectGreyTitle'],
      startDate: startDate
    });
  });
}

function fetchBangumiDataByDate(subjectInfo, pageNumber, type, allInfoList) {
  if (!subjectInfo || !subjectInfo.startDate) throw 'no date info';
  var startDate = new Date(subjectInfo.startDate);
  var SUBJECT_TYPE = type || 'game';
  var sort = startDate.getDate() > 15 ? 'sort=date' : '';
  var page = pageNumber ? 'page=' + pageNumber : '';
  var query = '';
  if (sort && page) {
    query = '?' + sort + '&' + page;
  } else if (sort) {
    query = '?' + sort;
  } else if (page) {
    query = '?' + page;
  }
  var url = 'https://bgm.tv/' + SUBJECT_TYPE + '/browser/airtime/' + startDate.getFullYear() + '-' + (startDate.getMonth() + 1) + query;

  console.log('uuuuuuuu', url);
  return gmFetch(url).then(function (info) {
    var _dealRawHTML = dealRawHTML(info),
        _dealRawHTML2 = _slicedToArray(_dealRawHTML, 2),
        rawInfoList = _dealRawHTML2[0],
        numOfPage = _dealRawHTML2[1];

    pageNumber = pageNumber || 1;

    if (allInfoList) {
      numOfPage = 3;
      allInfoList = [].concat(_toConsumableArray(allInfoList), _toConsumableArray(rawInfoList));
      if (pageNumber < numOfPage) {
        return delayPromise(1000).then(function () {
          return fetchBangumiDataByDate(subjectInfo, pageNumber + 1, SUBJECT_TYPE, allInfoList);
        });
      }
      return allInfoList;
    }

    var result = filterResults(rawInfoList, subjectInfo.subjectName, {
      keys: ['subjectTitle', 'subjectGreyTitle'],
      startDate: subjectInfo.startDate
    });
    pageNumber = pageNumber || 1;
    if (!result) {
      if (pageNumber < numOfPage) {
        return delayPromise(300).then(function () {
          return fetchBangumiDataByDate(subjectInfo, pageNumber + 1, SUBJECT_TYPE);
        });
      } else {
        throw 'notmatched';
      }
    }
    return result;
  });
}

module.exports = {
  fetchBangumiDataByDate: fetchBangumiDataByDate,
  fetchBangumiDataBySearch: fetchBangumiDataBySearch
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function delayPromise(t) {
  var max = 400;
  var min = 200;
  t = t || Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

module.exports = delayPromise;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function filterResults(items, searchstring, opts) {
  if (!items) return;
  var results = new Fuse(items, opts).search(searchstring);
  if (!results.length) return;
  if (opts.startdate) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = results[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var result = _step.value;

        if (result.startdate && new date(result.startdate) - new date(opts.startdate) === 0) {
          return result;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } else {
    return results[0];
  }
}

module.exports = filterResults;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var StackBlur = __webpack_require__(7);

var _require = __webpack_require__(0),
    gmFetch = _require.gmFetch;

var getImageBase64 = __webpack_require__(1);

function insertBlurInfo($target) {
  var rawHTML = '\n    <input style="vertical-align: top;" class="inputBtn" value="\u4E0A\u4F20\u5904\u7406\u540E\u7684\u56FE\u7247" name="submit" type="button">\n    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>\n    <br>\n    <label for="e-wiki-cover-amount">Blur width and radius:</label>\n    <input id="e-wiki-cover-amount" type="text" readonly>\n    <br>\n    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100"><canvas></canvas>\n    <br>\n    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">\n    <br>\n    <a href="javascript:void(0)" id="e-wiki-cover-reset">reset</a>\n    <img src="" alt="" style="display:none;">\n  ';
  var $info = document.createElement('div');
  $info.classList.add('e-wiki-cover-container');
  $info.innerHTML = rawHTML;
  $target.parentElement.insertBefore($info, $target.nextElementSibling);
  var $width = document.querySelector('#e-wiki-cover-slider-width');
  var $radius = document.querySelector('#e-wiki-cover-slider-radius');
  drawRec($width);
  changeInfo($width, $radius);
  $width.addEventListener('change', function (e) {
    drawRec($width);
    changeInfo($width, $radius);
  });
  $radius.addEventListener('change', function (e) {
    changeInfo($width, $radius);
  });
}

function drawRec($width) {
  var $canvas = $width.nextElementSibling;
  var ctx = $canvas.getContext('2d');
  var width = Number($width.value);
  $canvas.width = width * 1.4;
  $canvas.height = width * 1.4;
  ctx.strokeStyle = '#f09199';
  ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
  window.dispatchEvent(new Event('resize'));
}

function previewSelectedImage($file, $canvas) {
  var $img = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Image();

  var ctx = $canvas.getContext('2d');
  // var $img = new Image();
  $img.addEventListener('load', function () {
    $canvas.width = $img.width;
    $canvas.height = $img.height;
    ctx.drawImage($img, 0, 0);
    window.dispatchEvent(new Event('resize')); // let img cut tool at right position
  }, false);
  function loadImgData() {
    var file = $file.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      $img.src = reader.result;
    }, false);
    if (file) {
      reader.readAsDataURL(file);
    }
  }
  if ($file) {
    $file.addEventListener('change', loadImgData, false);
  }
}

function blur(el, $width, $radius) {
  var isDrawing;
  var ctx = el.getContext('2d');
  el.onmousedown = function (e) {
    isDrawing = true;
    var pos = getMousePos(el, e);
    ctx.moveTo(pos.x, pos.y);
  };
  el.onmousemove = function (e) {
    if (isDrawing) {
      //ctx.lineTo(e.layerX, e.layerY);
      //ctx.stroke();
      var width = Number($width.value);
      var radius = Number($radius.value);
      var pos = getMousePos(el, e);
      StackBlur.canvasRGBA(el, pos.x - width / 2, pos.y - width / 2, width, width, radius);
    }
  };
  el.onmouseup = function () {
    isDrawing = false;
  };
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

function changeInfo($width, $radius) {
  var $info = document.querySelector('#e-wiki-cover-amount');
  var radius = $radius.value;
  var width = $width.value;
  $info.value = width + ', ' + radius;
}

function sendFormDataPic($form, dataURL) {
  var genString = Array.apply(null, Array(5)).map(function () {
    return function (charset) {
      return charset.charAt(Math.floor(Math.random() * charset.length));
    }('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }).join('');
  function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) byteString = atob(dataURI.split(',')[1]);else byteString = decodeURI(dataURI.split(',')[1]); // instead of unescape
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
  }
  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
  // loading
  var $submit = $form.querySelector('[type=submit]');
  $submit.style.display = 'none';
  var $loading = document.createElement('div');
  $loading.style = 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");';
  $form.appendChild($loading);

  // ajax
  var fd = new FormData($form);
  var $file = $form.querySelector('input[type=file]');
  var inputFileName = $file.name ? $file.name : 'picfile';
  fd.set(inputFileName, dataURItoBlob(dataURL), genString + '.jpg');
  if ($submit && $submit.name && $submit.value) {
    fd.set($submit.name, $submit.value);
  }
  console.info('pic file: ', fd.get(inputFileName));
  var xhr = new XMLHttpRequest();
  xhr.open($form.method.toLowerCase(), $form.action, true);
  xhr.onreadystatechange = function () {
    var _location;
    if (xhr.readyState === 2 && xhr.status === 200) {
      _location = xhr.responseURL;
      $loading.remove();
      $submit.style.display = '';
      if (_location) {
        location.assign(_location);
      }
    }
  };
  xhr.send(fd);
}

async function uploadTargetCover(subjectId) {
  var d = await gmFetch('/' + subjectId + '/upload_img', 3000);
  var $canvas = document.querySelector('#e-wiki-cover-preview');

  var $doc = new DOMParser().parseFromString(d, "text/html");
  var $form = $doc.querySelector('form[name=img_upload]');
  if (!$form) return;

  if ($canvas.width > 8 && $canvas.height > 10) {
    sendFormDataPic($form, $canvas.toDataURL('image/jpg', 1));
  }
}

function blobToBase64(myBlob) {
  return new Promise(function (resolve, reject) {
    var reader = new window.FileReader();
    reader.readAsDataURL(myBlob);
    reader.onloadend = function () {
      resolve(reader.result);
    };
    reader.onerror = reject;
  });
}

async function getImageDataByURL(url) {
  var myBlob = await gmFetchBinary(url);
  console.info('Content: cover pic: ', myBlob);
  return await blobToBase64(myBlob);
}

/**
 * 初始化上传处理图片组件
 * @param {Object} $form - 包含 input file 的 DOM
 * @param {string} base64Data - 图片链接或者 base64 信息 
 */
function dealImageWidget($form, base64Data) {
  if (document.querySelector('.e-wiki-cover-container')) return;
  insertBlurInfo($form);
  var $canvas = document.querySelector('#e-wiki-cover-preview');
  var $img = document.querySelector('.e-wiki-cover-container img');
  if (base64Data) {
    if (base64Data.match(/^http/)) {
      // base64Data = getImageDataByURL(base64Data);
      base64Data = getImageBase64(base64Data);
    }
    $img.src = base64Data;
  }
  var $file = $form.querySelector('input[type = file]');
  previewSelectedImage($file, $canvas, $img);

  var $width = document.querySelector('#e-wiki-cover-slider-width');
  var $radius = document.querySelector('#e-wiki-cover-slider-radius');
  blur($canvas, $width, $radius);
  document.querySelector('#e-wiki-cover-reset').addEventListener('click', function (e) {
    var $fillForm = document.querySelector('.fill-form');
    if (base64Data) {
      $img.dispatchEvent(new Event('load'));
    } else if ($file && $file.files[0]) {
      $file.dispatchEvent(new Event('change'));
    } else if ($fillForm) {
      $fillForm.dispatchEvent(new Event('click'));
    }
  }, false);
  var $inputBtn = document.querySelector('.e-wiki-cover-container .inputBtn');
  if ($file) {
    $inputBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if ($canvas.width > 8 && $canvas.height > 10) {
        sendFormDataPic($form, $canvas.toDataURL('image/jpg', 1));
      }
    }, false);
  } else {
    $inputBtn.value = '处理图片';
  }
}

module.exports = dealImageWidget;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

/*
    StackBlur - a fast almost Gaussian Blur For Canvas

    Version:     0.5
    Author:        Mario Klingemann
    Contact:     mario@quasimondo.com
    Website:    http://www.quasimondo.com/StackBlurForCanvas
    Twitter:    @quasimondo

    In case you find this class useful - especially in commercial projects -
    I am not totally unhappy for a small donation to my PayPal account
    mario@quasimondo.de

    Or support me on flattr:
    https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

    Copyright (c) 2010 Mario Klingemann

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    */


var mul_table = [
    512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
    454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
    482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
    437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
    497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
    320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
    446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
    329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
    505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
    399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
    324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
    268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
    451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
    385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
    332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
    289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];


var shg_table = [
    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];


function processImage(img, canvas, radius, blurAlphaChannel)
{
    if (typeof(img) == 'string') {
        var img = document.getElementById(img);
    }
    else if (typeof HTMLImageElement !== 'undefined' && !img instanceof HTMLImageElement) {
        return;
    }
    var w = img.naturalWidth;
    var h = img.naturalHeight;

    if (typeof(canvas) == 'string') {
        var canvas = document.getElementById(canvas);
    }
    else if (typeof HTMLCanvasElement !== 'undefined' && !canvas instanceof HTMLCanvasElement) {
        return;
    }

    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = w;
    canvas.height = h;

    var context = canvas.getContext('2d');
    context.clearRect(0, 0, w, h);
    context.drawImage(img, 0, 0);

    if (isNaN(radius) || radius < 1) return;

    if (blurAlphaChannel)
        processCanvasRGBA(canvas, 0, 0, w, h, radius);
    else
        processCanvasRGB(canvas, 0, 0, w, h, radius);
}

function getImageDataFromCanvas(canvas, top_x, top_y, width, height)
{
    if (typeof(canvas) == 'string')
        var canvas  = document.getElementById(canvas);
    else if (typeof HTMLCanvasElement !== 'undefined' && !canvas instanceof HTMLCanvasElement)
        return;

    var context = canvas.getContext('2d');
    var imageData;

    try {
        try {
            imageData = context.getImageData(top_x, top_y, width, height);
        } catch(e) {
            throw new Error("unable to access local image data: " + e);
            return;
        }
    } catch(e) {
        throw new Error("unable to access image data: " + e);
    }

    return imageData;
}

function processCanvasRGBA(canvas, top_x, top_y, width, height, radius)
{
    if (isNaN(radius) || radius < 1) return;
    radius |= 0;

    var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);

    imageData = processImageDataRGBA(imageData, top_x, top_y, width, height, radius);

    canvas.getContext('2d').putImageData(imageData, top_x, top_y);
}

function processImageDataRGBA(imageData, top_x, top_y, width, height, radius)
{
    var pixels = imageData.data;

    var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
        r_out_sum, g_out_sum, b_out_sum, a_out_sum,
        r_in_sum, g_in_sum, b_in_sum, a_in_sum,
        pr, pg, pb, pa, rbs;

    var div = radius + radius + 1;
    var w4 = width << 2;
    var widthMinus1  = width - 1;
    var heightMinus1 = height - 1;
    var radiusPlus1  = radius + 1;
    var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

    var stackStart = new BlurStack();
    var stack = stackStart;
    for (i = 1; i < div; i++)
    {
        stack = stack.next = new BlurStack();
        if (i == radiusPlus1) var stackEnd = stack;
    }
    stack.next = stackStart;
    var stackIn = null;
    var stackOut = null;

    yw = yi = 0;

    var mul_sum = mul_table[radius];
    var shg_sum = shg_table[radius];

    for (y = 0; y < height; y++)
    {
        r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++)
        {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[p+2])) * rbs;
            a_sum += (stack.a = (pa = pixels[p+3])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;

            stack = stack.next;
        }


        stackIn = stackStart;
        stackOut = stackEnd;
        for (x = 0; x < width; x++)
        {
            pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
            if (pa != 0)
            {
                pa = 255 / pa;
                pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
                pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
            } else {
                pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
            }

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;

            p =  (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p+1]);
            b_in_sum += (stackIn.b = pixels[p+2]);
            a_in_sum += (stackIn.a = pixels[p+3]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;
            a_sum += a_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);
            a_out_sum += (pa = stackOut.a);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;

            stackOut = stackOut.next;

            yi += 4;
        }
        yw += width;
    }


    for (x = 0; x < width; x++)
    {
        g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }

        yp = width;

        for (i = 1; i <= radius; i++)
        {
            yi = (yp + x) << 2;

            r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;
            a_sum += (stack.a = (pa = pixels[yi+3])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;

            stack = stack.next;

            if(i < heightMinus1)
            {
                yp += width;
            }
        }

        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;
        for (y = 0; y < height; y++)
        {
            p = yi << 2;
            pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
            if (pa > 0)
            {
                pa = 255 / pa;
                pixels[p]   = ((r_sum * mul_sum) >> shg_sum) * pa;
                pixels[p+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                pixels[p+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
            } else {
                pixels[p] = pixels[p+1] = pixels[p+2] = 0;
            }

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;

            p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

            r_sum += (r_in_sum += (stackIn.r = pixels[p]));
            g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
            b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));
            a_sum += (a_in_sum += (stackIn.a = pixels[p+3]));

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);
            a_out_sum += (pa = stackOut.a);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;

            stackOut = stackOut.next;

            yi += width;
        }
    }
    return imageData;
}

function processCanvasRGB(canvas, top_x, top_y, width, height, radius)
{
    if (isNaN(radius) || radius < 1) return;
    radius |= 0;

    var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);
    imageData = processImageDataRGB(imageData, top_x, top_y, width, height, radius);

    canvas.getContext('2d').putImageData(imageData, top_x, top_y);
}

function processImageDataRGB(imageData, top_x, top_y, width, height, radius)
{
    var pixels = imageData.data;

    var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
        r_out_sum, g_out_sum, b_out_sum,
        r_in_sum, g_in_sum, b_in_sum,
        pr, pg, pb, rbs;

    var div = radius + radius + 1;
    var w4 = width << 2;
    var widthMinus1  = width - 1;
    var heightMinus1 = height - 1;
    var radiusPlus1  = radius + 1;
    var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

    var stackStart = new BlurStack();
    var stack = stackStart;
    for (i = 1; i < div; i++)
    {
        stack = stack.next = new BlurStack();
        if (i == radiusPlus1) var stackEnd = stack;
    }
    stack.next = stackStart;
    var stackIn = null;
    var stackOut = null;

    yw = yi = 0;

    var mul_sum = mul_table[radius];
    var shg_sum = shg_table[radius];

    for (y = 0; y < height; y++)
    {
        r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++)
        {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[p+2])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;

            stack = stack.next;
        }


        stackIn = stackStart;
        stackOut = stackEnd;
        for (x = 0; x < width; x++)
        {
            pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
            pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
            pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;

            p =  (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p+1]);
            b_in_sum += (stackIn.b = pixels[p+2]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;

            stackOut = stackOut.next;

            yi += 4;
        }
        yw += width;
    }


    for (x = 0; x < width; x++)
    {
        g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack = stack.next;
        }

        yp = width;

        for (i = 1; i <= radius; i++)
        {
            yi = (yp + x) << 2;

            r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;

            stack = stack.next;

            if(i < heightMinus1)
            {
                yp += width;
            }
        }

        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;
        for (y = 0; y < height; y++)
        {
            p = yi << 2;
            pixels[p]   = (r_sum * mul_sum) >> shg_sum;
            pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
            pixels[p+2] = (b_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;

            p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

            r_sum += (r_in_sum += (stackIn.r = pixels[p]));
            g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
            b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;

            stackOut = stackOut.next;

            yi += width;
        }
    }

    return imageData;
}

function BlurStack()
{
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.next = null;
}

module.exports = {
    image: processImage,
    canvasRGBA: processCanvasRGBA,
    canvasRGB: processCanvasRGB,
    imageDataRGBA: processImageDataRGBA,
    imageDataRGB: processImageDataRGB
};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * dollar 选择符
 * @param {string} selector 
 */
function $qs(selector) {
  return document.querySelector(selector);
}
/**
 * 获取查找条目需要的信息
 * @param {Object[]} items
 */
function getQueryInfo(items) {
  var info = {};
  items.forEach(function (item) {
    if (item.category === 'subject_title') {
      info.subjectName = item.data;
    }
    if (item.category === 'date') {
      info.startDate = item.data;
    }
    if (item.category === 'ISBN') {
      info.isbn = item.data;
    }
    if (item.category === 'ISBN-13') {
      info.isbn13 = item.data;
    }
  });
  if (info.subjectName) {
    return info;
  }
  return;
}
function getCoverURL(coverConfig) {
  if (!coverConfig) return;
  var $cover = $qs(coverConfig.selector);
  if ($cover) {
    return {
      coverURL: $cover.getAttribute('src'),
      height: $cover.height,
      width: $cover.width
    };
  }
}
function getSubType(itemConfig) {
  if (!itemConfig) return;
  var dict = {
    'コミック': 0
  };
  var $t;
  if (itemConfig.selector && !itemConfig.subSelector) {
    $t = $qs(itemConfig.selector);
  } else if (itemConfig.keyWord) {
    // 使用关键字搜索节点
    $t = getDOMByKeyWord(itemConfig);
  }
  if ($t) {
    var m = $t.innerText.match(new RegExp(Object.keys(dict).join('|')));
    if (m) return dict[m[0]];
  }
}
/**
 * 生成wiki的项目
 * @param {Object} itemConfig 
 * @returns {Object}
 */
function getWikiItem(itemConfig) {
  var data = getItemData(itemConfig);
  if (data) {
    return {
      name: itemConfig.name,
      data: data,
      category: itemConfig.category
    };
  }
  return {};
}
/**
 * 生成wiki的项目数据
 * @param {Object} itemConfig 
 * @returns {string}
 */
function getItemData(itemConfig) {
  var $t;
  if (itemConfig.selector && !itemConfig.subSelector) {
    $t = $qs(itemConfig.selector);
  } else if (itemConfig.keyWord) {
    // 使用关键字搜索节点
    $t = getDOMByKeyWord(itemConfig);
  }
  if ($t) {
    return dealRawText($t.innerText, [itemConfig.keyWord], itemConfig);
  } else if (!$t && itemConfig.otherRules && itemConfig.otherRules.length) {
    var rule = itemConfig.otherRules.pop();
    return getItemData(Object.assign(itemConfig, rule));
  }
}
/**
 * 处理无关字符
 * @param {string} str 
 * @param {Object[]} filterArry
 */
function dealRawText(str) {
  var filterArray = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var itemConfig = arguments[2];

  if (itemConfig && itemConfig.category === 'subject_summary') {
    return str;
  }
  if (itemConfig && itemConfig.category === 'subject_title') {
    return str.replace(/(?:(\d+))(\)|）).*$/, '$1$2');
  }
  if (itemConfig && itemConfig.separator) {
    str = splitText(str, itemConfig);
  }
  var textList = ['\\(.*\\)', '（.*）'].concat(_toConsumableArray(filterArray));
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}
/**
 * 通过关键字查找DOM
 * @param {Object} itemConfig 
 * @returns {Object[]}
 */
function getDOMByKeyWord(itemConfig) {
  var targets = void 0;
  // 有父节点, 基于二级选择器
  if (itemConfig.selector) {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord, $qs(itemConfig.selector));
  } else {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord);
  }
  if (targets && targets.length) {
    var $t = targets[targets.length - 1];
    // 相邻节点
    if (itemConfig.sibling) {
      $t = targets[targets.length - 1].nextElementSibling;
    }
    return $t;
  }
}
function splitText(text, itemConfig) {
  var s = {
    ':': ':|：',
    ',': ',|，'
  };
  var t = text.split(new RegExp(s[itemConfig.separator]));
  return t[t.length - 1].trim();
}
/**
 * 查找包含文本的标签
 * @param {string} selector 
 * @param {string} text 
 */
function contains(selector, text, $parent) {
  var elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = $qs(selector);
  }
  if (Array.isArray(text)) {
    text = text.join('|');
  }
  return [].filter.call(elements, function (element) {
    return new RegExp(text).test(element.innerText);
  });
}

module.exports = {
  getCoverURL: getCoverURL,
  getWikiItem: getWikiItem,
  getQueryInfo: getQueryInfo,
  getSubType: getSubType
};

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var amazon_jp_book = __webpack_require__(10);

module.exports = {
  amazon_jp_book: amazon_jp_book
};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var amazonSubjectModel = {
  key: 'amazon_jp_book',
  description: '日亚图书',
  newSubjectType: 1,
  entrySelector: 'xx',
  targetURL: 'xxx',
  cover: {
    selector: 'img#imgBlkFront'
    // selector: 'img#igImage'
  },
  subType: {
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    separator: ':',
    keyWord: 'ページ'
  },
  itemList: []
};

amazonSubjectModel.itemList.push({
  name: '名称',
  selector: '#productTitle',
  keyWord: '',
  category: 'subject_title'
}, {
  name: 'JAN',
  selector: '#detail_bullets_id .bucket .content',
  subSelector: 'li',
  keyWord: 'ISBN-10',
  separator: ':',
  category: 'ISBN'
}, {
  name: 'ISBN',
  selector: '#detail_bullets_id .bucket .content',
  subSelector: 'li',
  keyWord: 'ISBN-13',
  separator: ':',
  category: 'ISBN-13'
}, {
  name: '发售日',
  selector: '#detail_bullets_id .bucket .content',
  subSelector: 'li',
  keyWord: '発売日',
  separator: ':',
  category: 'date'
}, {
  name: '作者',
  selector: '#bylineInfo .author span.a-size-medium',
  otherRules: [{
    selector: '#bylineInfo .author > a'
  }]
}, {
  name: '出版社',
  selector: '#detail_bullets_id .bucket .content',
  subSelector: 'li',
  separator: ':',
  keyWord: '出版社'
}, {
  name: '页数',
  selector: '#detail_bullets_id .bucket .content',
  subSelector: 'li',
  separator: ':',
  keyWord: 'ページ'
}, {
  name: '价格',
  selector: '.swatchElement.selected .a-color-base'
}, {
  name: '内容简介',
  selector: '#productDescription',
  subSelector: 'h3',
  sibling: true,
  keyWord: ['内容紹介', '内容'],
  category: 'subject_summary'
});

module.exports = amazonSubjectModel;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * dollar 选择符
 * @param {string} selector 
 */
function $(selector) {
  return document.querySelector(selector);
}

function sleep(t) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(t);
    }, t);
  });
}

/**
 * 填写条目信息
 * @param {Object[]} info
 */
async function fillInfoBox(data) {

  var info = data.subjectInfoList;
  var subType = data.subType;
  var infoArray = [];
  var $typeInput = document.querySelectorAll('table tr:nth-of-type(2) > td:nth-of-type(2) input');
  if ($typeInput) {
    $typeInput[0].click();
    if (!isNaN(subType)) {
      $typeInput[subType].click();
    }
  }
  await sleep(100);

  var $wikiMode = $('table small a:nth-of-type(1)[href="javascript:void(0)"]');
  var $newbeeMode = $('table small a:nth-of-type(2)[href="javascript:void(0)"]');
  for (var i = 0, len = info.length; i < len; i++) {
    if (info[i].category === 'subject_title') {
      var $title = $('input[name=subject_title]');
      $title.value = info[i].data;
      continue;
    }
    if (info[i].category === 'subject_summary') {
      var $summary = $('#subject_summary');
      $summary.value = info[i].data;
      continue;
    }
    // 有名称并且category不在制定列表里面
    if (info[i].name && ['cover'].indexOf(info[i].category) === -1) {
      infoArray.push(info[i]);
    }
  }
  $wikiMode.click();
  setTimeout(async function () {
    _fillInfoBox(infoArray);
    await sleep(300);
    $newbeeMode.click();
  }, 100);
}

function dealDate(dataStr) {
  var l = dataStr.split('/');
  return l.map(function (i) {
    if (i.length === 1) {
      return '0' + i;
    }
    return i;
  }).join('-');
}

function _fillInfoBox(infoArray) {
  var $infobox = $('#subject_infobox');
  var arr = $infobox.value.split('\n');
  var newArr = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = infoArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var info = _step.value;

      var isDefault = false;
      for (var i = 0, len = arr.length; i < len; i++) {
        var n = arr[i].replace(/\||=.*/g, '');
        if (n === info.name) {
          var d = info.data;
          if (info.category === 'date') {
            d = dealDate(d);
          }
          arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
          isDefault = true;
          break;
        }
      }
      if (!isDefault && info.name) {
        newArr.push('|' + info.name + '=' + info.data);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  arr.pop();
  $infobox.value = [].concat(_toConsumableArray(arr), newArr, ['}}']).join('\n');
}
module.exports = fillInfoBox;

/***/ })
/******/ ]);