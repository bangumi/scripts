// ==UserScript==
// @name        bangumi anime score compare
// @name:zh-CN  bangumi动画和豆瓣及MAL评分对比
// @namespace   https://github.com/22earth
// @description show subject score information of douban and MAL in bangumi.tv
// @description:zh-cn bangumi动画页面显示豆瓣和MAL的评分
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/subject\/.*$/
// @include     https://movie.douban.com/subject/*
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bangumi_anime_score_compare.user.js
// @version     0.2.3
// @note        0.2.0 支持豆瓣上显示Bangumi评分,暂时禁用豆瓣上显示MAL的评分功能以及修改过滤方式
// @note        0.2.3 避免再次出现兼容性问题，使用webpack+babel处理脚本
// @TODO        统一豆瓣和Bangumi的缓存数据信息,
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @require     https://cdn.staticfile.org/fuse.js/2.6.2/fuse.min.js
// @require     https://cdn.staticfile.org/bluebird/3.5.0/bluebird.min.js
// ==/UserScript==

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "http://www.example.com/build/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	'use strict';

	;(function () {
	  if (GM_registerMenuCommand) {
	    // 用户脚本命令增加清除评分信息缓存
	    GM_registerMenuCommand('\u6E05\u9664\u8BC4\u5206\u7F13\u5B58', clearInfoStorage, 'c');
	  }
	  var USERJS_PREFIX = 'E_USERJS_ANIME_SCORE_';
	  var UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
	  var CLEAR_INTERVAL = UPDATE_INTERVAL * 7;
	  var E_ENABLE_AUTO_SHOW_SCORE_INFO = true;
	  var TIMEOUT = 10 * 1000;

	  var isDouban = false;
	  var DOUBAN = null;
	  var BANGUMI = null;
	  //  if search result failed, try browser by date
	  var G_BANGUMI_RETRY_COUNT = 0;

	  var tempList = window.location.pathname.match(/subject\/(\d*)/);
	  if (!tempList) return;
	  var SUBJECT_BGM_ID = tempList[1];
	  if (window.location.host.match(/bangumi\.tv|bgm\.tv|chii\.in/)) {
	    BANGUMI = {
	      init: function init() {
	        if (!this.isAnimeSubject()) return;
	        this.initControlDOM(document.querySelector('#panelInterestWrapper h2'));
	        toggleLoading();
	        checkInfoUpdate();
	        var subjectInfo = this.getSubjectInfo();
	        var scoreInfoDouban = readScoreInfo('douban');
	        var scoreInfoMAL = readScoreInfo('mal');
	        if (!scoreInfoDouban) {
	          fetchDoubanData(subjectInfo);
	        } else {
	          this.insertScoreInfo(scoreInfoDouban.info);
	        }
	        if (!scoreInfoMAL) {
	          fetchMALData(subjectInfo);
	        } else {
	          this.insertScoreInfo(scoreInfoMAL.info);
	        }
	      },
	      isAnimeSubject: function isAnimeSubject() {
	        return document.querySelector('.focus.chl.anime');
	      },
	      initControlDOM: function initControlDOM($target) {
	        var _this = this;

	        var rawHTML = '<a title="\u5F3A\u5236\u5237\u65B0\u8C46\u74E3\u548CMAL\u8BC4\u5206" class="e-userjs-score-ctrl e-userjs-score-fresh">O</a>\n      <a title="\u6E05\u9664\u6240\u6709\u8BC4\u5206\u7F13\u5B58" class="e-userjs-score-ctrl e-userjs-score-clear">X</a>\n';
	        $target.innerHTML = $target.innerHTML + rawHTML;
	        addStyle();
	        document.querySelector('.e-userjs-score-clear').addEventListener('click', clearInfoStorage, false);
	        document.querySelector('.e-userjs-score-fresh').addEventListener('click', function () {
	          if (E_ENABLE_AUTO_SHOW_SCORE_INFO) {
	            var subjectInfo = _this.getSubjectInfo();
	            toggleLoading();
	            var $info = document.querySelectorAll('.e-userjs-score-compare');
	            for (var i = 0, len = $info.length; i < len; i++) {
	              $info[i].remove();
	            }
	            fetchDoubanData(subjectInfo);
	            fetchMALData(subjectInfo);
	          } else {
	            _this.init();
	          }
	        }, false);
	      },
	      getSubjectInfo: function getSubjectInfo() {
	        var subjectInfo = {};
	        subjectInfo.subjectName = document.querySelector('h1>a').textContent.trim();
	        var infoList = document.querySelectorAll('#infobox>li');
	        if (infoList && infoList.length) {
	          for (var i = 0, len = infoList.length; i < len; i++) {
	            var el = infoList[i];
	            if (el.innerHTML.match(/放送开始|上映年度/)) {
	              subjectInfo.startDate = dealDate(el.textContent.split(':')[1].trim());
	            }
	            if (el.innerHTML.match('播放结束')) {
	              subjectInfo.endDate = dealDate(el.textContent.split(':')[1].trim());
	            }
	          }
	        }
	        return subjectInfo;
	      },
	      insertScoreInfo: function insertScoreInfo(siteScoreInfo) {
	        var $panel = document.querySelector('.SidePanel.png_bg');
	        if ($panel) {
	          // 两位小数
	          siteScoreInfo.averageScore = parseFloat(siteScoreInfo.averageScore).toFixed(2);
	          var $div = document.createElement('div');
	          $div.classList.add('frdScore');
	          $div.classList.add('e-userjs-score-compare');
	          $div.innerHTML = siteScoreInfo.site + '\uFF1A<span class="num">' + siteScoreInfo.averageScore + '</span> <span class="desc" style="visibility:hidden">\u8FD8\u884C</span> <a href="' + siteScoreInfo.subjectURL + '" target="_blank" class="l">' + siteScoreInfo.ratingsCount + ' \u4EBA\u8BC4\u5206</a>\n';
	          toggleLoading(true);
	          $panel.appendChild($div);
	        }
	      }
	    };

	    BANGUMI.init();
	  } else if (window.location.host.match(/douban\.com/)) {
	    isDouban = true;
	    DOUBAN = {
	      init: function init() {
	        if (this.isAnimeSubject()) {
	          checkInfoUpdate();
	          var subjectInfo = this.getSubjectInfo();
	          var scoreInfoBangumi = readScoreInfo('bangumi');
	          //const scoreInfoMAL = readScoreInfo('mal');
	          if (!scoreInfoBangumi) {
	            fetchBangumiDataBySearch(subjectInfo);
	            //fetchBangumiData(subjectInfo);
	          } else {
	            this.insertScoreInfo(scoreInfoBangumi.info);
	          }
	          // 暂时禁用显示MAL评分的功能
	          //if (!scoreInfoMAL) {
	          //fetchMALData(subjectInfo);
	          //} else {
	          //this.insertScoreInfo(scoreInfoMAL.info);
	          //}
	        }
	      },
	      isAnimeSubject: function isAnimeSubject() {
	        var $tags = document.querySelector('.tags-body');
	        if ($tags) {
	          return $tags.textContent.match(/动画|动漫/);
	        }
	      },
	      getSubjectInfo: function getSubjectInfo() {
	        var subjectInfo = {};
	        var $title = document.querySelector('#content h1>span');
	        subjectInfo.subjectName = $title.textContent.replace(/第.季/, '');
	        var realeaseDate = document.querySelector('span[property="v:initialReleaseDate"]');
	        if (realeaseDate) {
	          subjectInfo.startDate = realeaseDate.textContent.replace(/\(.*\)/, '');
	        }
	        return subjectInfo;
	      },
	      /**
	       * @param {Object} siteScoreInfo - averageScore ratingsCount site subjectURL
	       */
	      insertScoreInfo: function insertScoreInfo(siteScoreInfo) {
	        var $panel = document.querySelector('#interest_sectl');
	        var $friendsRatingWrap = document.querySelector('.friends_rating_wrap');
	        if (!$friendsRatingWrap) {
	          $friendsRatingWrap = document.createElement('div');
	          $friendsRatingWrap.className = 'friends_rating_wrap clearbox';
	          $panel.appendChild($friendsRatingWrap);
	        }
	        // 小数
	        siteScoreInfo.averageScore = parseFloat(siteScoreInfo.averageScore).toFixed(1);
	        var $div = document.createElement('div');
	        var favicon = siteScoreInfo.site.match('bangumi') ? 'data:img/jpg;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALJu+f//////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsm75ELJu+cCybvn/sm75/7Ju+f+ybvn//////7Ju+f+ybvn/sm75/7Ju+f+ybvn/sm75/7Ju+f+ybvnAsm75ELJu+cCybvn/sm75/7Ju+f+ybvn/sm75////////////sm75/7Ju+f+ybvn/sm75/7Ju+f+ybvn/sm75/7Ju+cCwaPn/sGj5/9iz/P///////////////////////////////////////////////////////////9iz/P+waPn/rF/6/6xf+v//////////////////////////////////////////////////////////////////////rF/6/6lW+/+pVvv/////////////////////////////////zXn2/////////////////////////////////6lW+/+lTfz/pU38///////Nefb/zXn2/8159v//////zXn2///////Nefb//////8159v/Nefb/zXn2//////+lTfz/okT8/6JE/P//////////////////////2bb8/8159v/Nefb/zXn2/9m2/P//////////////////////okT8/546/f+eOv3//////8159v/Nefb/zXn2////////////////////////////zXn2/8159v/Nefb//////546/f+bMf7/mzH+//////////////////////////////////////////////////////////////////////+bMf7/lyj+wJco/v/Mk/7////////////////////////////////////////////////////////////Mk///lyj+wJQf/xCUH//AlB///5Qf//+UH///lB///5Qf//+aP///mj///5o///+UH///lB///5Qf//+UH///lB//wJQf/xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/5o////Nefb/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAM159v8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADNefb/AAAAAAAAAAAAAAAA+f8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/j8AAP3fAAD77wAA9/cAAA==' : 'data:img/jpg;base64,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';

	        var rawHTML = '<strong class="rating_avg">' + siteScoreInfo.averageScore + '</strong>\n                    <div class="friends">\n                            <a class="avatar" title="' + siteScoreInfo.site + '" href="javascript:;">\n                            <img src="' + favicon + '"/>\n                            </a>\n                    </div>\n                    <a href="' + siteScoreInfo.subjectURL + '" class="friends_count" target="_blank">' + siteScoreInfo.ratingsCount + '\u4EBA\u8BC4\u4EF7</a>\n';
	        $div.className = 'rating_content_wrap clearfix e-userjs-score-compare';
	        $div.innerHTML = rawHTML;
	        //toggleLoading(true);
	        $friendsRatingWrap.appendChild($div);
	      }
	    };

	    DOUBAN.init();
	  }

	  function addStyle(css) {
	    if (css) {
	      GM_addStyle(css);
	    } else {
	      GM_addStyle('\n      .e-userjs-score-ctrl {color:#f09199;font-weight:800;float:right;}\n      .e-userjs-score-ctrl:hover {cursor: pointer;}\n      .e-userjs-score-clear {margin-right: 12px;}\n      .e-userjs-score-loading { width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif"); }\n      ');
	    }
	  }

	  function toggleLoading(hidden) {
	    var $div = document.querySelector('.e-userjs-score-loading');
	    if (!$div) {
	      $div = document.createElement('div');
	      $div.classList.add('e-userjs-score-loading');
	      var $panel = document.querySelector('.SidePanel.png_bg');
	      $panel.appendChild($div);
	    }
	    if (hidden) {
	      $div.style.display = 'none';
	    } else {
	      $div.style.cssText = '';
	    }
	  }

	  function dealDate(dateStr) {
	    return dateStr.replace(/年|月|日/g, '/').replace(/\/$/, '');
	  }

	  function fetchBangumiDataBySearch(subjectInfo) {
	    if (!subjectInfo || !subjectInfo.startDate) return;
	    var startDate = new Date(subjectInfo.startDate);
	    var url = 'https://bgm.tv/subject_search/' + encodeURIComponent(subjectInfo.subjectName) + '?cat=2';
	    searchSubjectHTML(url).then(function (info) {
	      var rawInfoList = [];
	      var $doc = new DOMParser().parseFromString(info, "text/html");
	      var items = $doc.querySelectorAll('#browserItemList>li>div.inner');
	      // get number of page
	      var numOfPage = null;
	      var pList = $doc.querySelectorAll('.page_inner>.p');
	      if (pList && pList.length) {
	        numOfPage = parseInt(pList[pList.length - 1].href.split('?page=')[1]);
	      }
	      pList = null;
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
	        throw new Error("Empty results");
	      }
	      // filter results
	      var opts = {
	        keys: ['subjectTitle', 'subjectGreyTitle']
	      };
	      var results = new Fuse(rawInfoList, opts).search(subjectInfo.subjectName);
	      if (!results.length) {
	        throw new Error("No match results");
	      }
	      var finalResults = results[0];
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = results[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var result = _step2.value;

	          if (result.startDate) {
	            var d = new Date(result.startDate);
	            if (d.getFullYear() === startDate.getFullYear() && d.getDate() === startDate.getDate()) {
	              finalResults = result;
	            }
	          }
	        }
	      } catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	        } finally {
	          if (_didIteratorError2) {
	            throw _iteratorError2;
	          }
	        }
	      }

	      finalResults.site = 'bangumi';
	      DOUBAN.insertScoreInfo(finalResults);
	      localStorage.setItem(USERJS_PREFIX + 'BANGUMI' + '_' + SUBJECT_BGM_ID, JSON.stringify({
	        info: finalResults,
	        date: new Date().getTime()
	      }));
	    }).catch(function (err) {
	      console.log('err', err, 'ccccccc', G_BANGUMI_RETRY_COUNT);
	      if (!G_BANGUMI_RETRY_COUNT) {
	        fetchBangumiData(subjectInfo);
	        G_BANGUMI_RETRY_COUNT += 1;
	      }
	    });
	  }

	  /**
	   * fetch score info and insert into page
	   * @param: {Object} subjectInfo
	   * @param: {number} pageNumber
	   * @param: {string} type - anime game
	   */
	  function fetchBangumiData(subjectInfo, pageNumber, type) {
	    if (!subjectInfo || !subjectInfo.startDate) return;
	    var startDate = new Date(subjectInfo.startDate);
	    var SUBJECT_TYPE = type || 'anime';
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

	    searchSubjectHTML(url).then(function (info) {
	      var rawInfoList = [];
	      var $doc = new DOMParser().parseFromString(info, "text/html");
	      var items = $doc.querySelectorAll('#browserItemList>li>div.inner');
	      // get number of page
	      var numOfPage = null;
	      var pList = $doc.querySelectorAll('.page_inner>.p');
	      if (pList && pList.length > 1) {
	        var tempNum = parseInt(pList[pList.length - 2].href.match(/page=(\d*)/)[1]);
	        numOfPage = parseInt(pList[pList.length - 1].href.match(/page=(\d*)/)[1]);
	        numOfPage = numOfPage > tempNum ? numOfPage : tempNum;
	      }
	      pList = null;
	      //var items = document.querySelectorAll('#browserItemList>li>div.inner')
	      if (items && items.length) {
	        var _iteratorNormalCompletion3 = true;
	        var _didIteratorError3 = false;
	        var _iteratorError3 = undefined;

	        try {
	          for (var _iterator3 = items[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	            var item = _step3.value;

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
	          _didIteratorError3 = true;
	          _iteratorError3 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion3 && _iterator3.return) {
	              _iterator3.return();
	            }
	          } finally {
	            if (_didIteratorError3) {
	              throw _iteratorError3;
	            }
	          }
	        }
	      } else {
	        throw new 'empty'();
	      }
	      // filter results
	      var opts = {
	        keys: ['subjectTitle', 'subjectGreyTitle']
	      };
	      var results = new Fuse(rawInfoList, opts).search(subjectInfo.subjectName);
	      if (!results.length) {
	        if (items.length === 24 && (!pageNumber || pageNumber < numOfPage)) {
	          return fetchBangumiData(subjectInfo, pageNumber ? pageNumber + 1 : 2);
	        }
	        throw 'notmatched';
	      }
	      var finalResults = results[0];
	      var _iteratorNormalCompletion4 = true;
	      var _didIteratorError4 = false;
	      var _iteratorError4 = undefined;

	      try {
	        for (var _iterator4 = results[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	          var result = _step4.value;

	          if (result.startDate && new Date(result.startDate) - startDate === 0) {
	            finalResults = result;
	          }
	        }
	      } catch (err) {
	        _didIteratorError4 = true;
	        _iteratorError4 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion4 && _iterator4.return) {
	            _iterator4.return();
	          }
	        } finally {
	          if (_didIteratorError4) {
	            throw _iteratorError4;
	          }
	        }
	      }

	      finalResults.site = 'bangumi';
	      DOUBAN.insertScoreInfo(finalResults);
	      localStorage.setItem(USERJS_PREFIX + 'BANGUMI' + '_' + SUBJECT_BGM_ID, JSON.stringify({
	        info: finalResults,
	        date: new Date().getTime()
	      }));
	    }).catch(function (err) {
	      console.log('err', err);
	    });
	  }
	  function fetchDoubanData(subjectInfo) {
	    var url = 'https://api.douban.com/v2/movie/search?q=' + subjectInfo.subjectName;
	    searchSubjectJSON(url).then(function (info) {
	      if (info && info.subjects && info.subjects.length) {
	        var opts = {
	          keys: ['original_title', 'title']
	        };
	        var year = '';
	        if (subjectInfo.startDate) {
	          year = new Date(subjectInfo.startDate).getFullYear();
	        }
	        var results = new Fuse(info.subjects, opts).search(subjectInfo.subjectName);
	        if (year) {
	          results = new Fuse(results, { keys: ['year'] }).search(year + '');
	        }
	        if (results && results.length) {
	          var dURL = 'https://api.douban.com/v2/movie/subject/' + results[0].id;
	          return searchSubjectJSON(dURL);
	        } else {
	          throw new Error("No match results");
	        }
	      } else {
	        throw new Error("Invalid results");
	      }
	    }).then(function (info) {
	      if (info && info.original_title) {
	        var siteScoreInfo = {
	          site: '豆瓣评分',
	          averageScore: info.rating.average,
	          subjectURL: 'https://movie.douban.com/subject/' + info.id + '/',
	          ratingsCount: info.ratings_count
	        };
	        BANGUMI.insertScoreInfo(siteScoreInfo);
	        localStorage.setItem(USERJS_PREFIX + 'DOUBAN' + '_' + SUBJECT_BGM_ID, JSON.stringify({
	          info: siteScoreInfo,
	          date: new Date().getTime()
	        }));
	      } else {
	        throw new Error("Invalid results");
	      }
	    }).catch(function (err) {
	      console.log('err', err);
	    });
	  }
	  function fetchMALData(subjectInfo) {
	    var siteScoreInfo = {
	      site: 'MAL评分'
	    };
	    //var name = encodeURIComponent('xxx')
	    var url = 'https://myanimelist.net/search/prefix.json?type=anime&keyword=' + subjectInfo.subjectName + '&v=1';
	    //var myanimelistSearchURL = `https://myanimelist.net/anime.php?q=${name}`
	    searchSubjectJSON(url).then(function (info) {
	      //const opts = {
	      //keys: ['payload.aired']
	      //};
	      //let fuse = new Fuse(results, opts);
	      //results = fuse.search(year + '');
	      var startDate = null;
	      var items = info.categories[0].items;
	      var subject = items[0];
	      if (subjectInfo.startDate) {
	        startDate = new Date(subjectInfo.startDate);
	        var _iteratorNormalCompletion5 = true;
	        var _didIteratorError5 = false;
	        var _iteratorError5 = undefined;

	        try {
	          for (var _iterator5 = items[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	            var item = _step5.value;

	            var aired = null;
	            if (item.payload.aired.match('to')) {
	              aired = new Date(item.payload.aired.split('to')[0]);
	            } else {
	              aired = new Date(item.payload.aired);
	            }
	            if (startDate.getFullYear() === aired.getFullYear() && startDate.getDate() === aired.getDate()) {
	              siteScoreInfo.subjectURL = item.url;
	              return searchSubjectHTML(item.url);
	            }
	          }
	        } catch (err) {
	          _didIteratorError5 = true;
	          _iteratorError5 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion5 && _iterator5.return) {
	              _iterator5.return();
	            }
	          } finally {
	            if (_didIteratorError5) {
	              throw _iteratorError5;
	            }
	          }
	        }
	      }
	      if (subject) {
	        //const dURL = `https://myanimelist.net/includes/ajax.inc.php?t=64&id=${results[0].id}`
	        siteScoreInfo.subjectURL = subject.url;
	        return searchSubjectHTML(subject.url);
	      } else {
	        throw new Error("No match results");
	      }
	    }).then(function (info) {
	      var parser = new DOMParser();
	      var $doc = parser.parseFromString(info, "text/html");
	      var $score = $doc.querySelector('.fl-l.score');
	      if ($score) {
	        //siteScoreInfo.averageScore = parseFloat($score.textContent.trim()).toFixed(1)
	        siteScoreInfo.averageScore = $score.textContent.trim();
	        if ($score.dataset.user) {
	          siteScoreInfo.ratingsCount = $score.dataset.user.replace('users', '').trim();
	        } else {
	          throw new Error("Invalid score info");
	        }
	        if (isDouban) {
	          DOUBAN.insertScoreInfo(siteScoreInfo);
	        } else {
	          BANGUMI.insertScoreInfo(siteScoreInfo);
	        }
	        localStorage.setItem(USERJS_PREFIX + 'MAL' + '_' + SUBJECT_BGM_ID, JSON.stringify({
	          info: siteScoreInfo,
	          date: new Date().getTime()
	        }));
	      } else {
	        throw new Error("Invalid results");
	      }
	    }).catch(function (err) {
	      console.log('err', err);
	    });
	  }
	  function searchSubjectJSON(url) {
	    return new Promise(function (resolve, reject) {
	      GM_xmlhttpRequest({
	        method: "GET",
	        timeout: TIMEOUT,
	        url: url,
	        onreadystatechange: function onreadystatechange(response) {
	          if (response.readyState === 4 && response.status === 200) {
	            resolve(JSON.parse(response.responseText));
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
	  function searchSubjectHTML(url) {
	    return new Promise(function (resolve, reject) {
	      GM_xmlhttpRequest({
	        method: "GET",
	        timeout: TIMEOUT,
	        url: url,
	        onreadystatechange: function onreadystatechange(response) {
	          if (response.readyState === 4 && response.status === 200) {
	            //let parser = new DOMParser();
	            //let $doc = parser.parseFromString(response.responseText, "text/html");
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
	  function readScoreInfo(site) {
	    var scoreInfo = window.localStorage.getItem(USERJS_PREFIX + site.toUpperCase() + '_' + SUBJECT_BGM_ID);
	    if (scoreInfo) {
	      scoreInfo = JSON.parse(scoreInfo);
	      if (new Date() - new Date(scoreInfo.date) < UPDATE_INTERVAL) {
	        return scoreInfo;
	      }
	    }
	  }
	  function checkInfoUpdate() {
	    var time = localStorage.getItem(USERJS_PREFIX + 'LATEST_UPDATE_TIME');
	    var now = new Date();
	    if (!time) {
	      localStorage.setItem(USERJS_PREFIX + 'LATEST_UPDATE_TIME', now.getTime());
	      return;
	    } else if (now - new Date(time) > CLEAR_INTERVAL) {
	      clearInfoStorage();
	    }
	  }
	  function clearInfoStorage() {
	    var now = new Date();
	    for (var key in localStorage) {
	      if (key.match(USERJS_PREFIX)) {
	        console.log(localStorage.getItem(key));
	        localStorage.removeItem(key);
	      }
	    }
	  }
	})();

/***/ })
/******/ ]);
