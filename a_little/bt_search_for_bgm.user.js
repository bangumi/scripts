// ==UserScript==
// @name        bt_search_for_bgm
// @name:zh-CN  bangumi 辅助搜索
// @namespace   https://bgm.tv/user/a_little
// @description add search icons in bangumi.tv for search anime
// @description:zh-cn 条目页面、合集页面增加搜索图标，辅助搜索
// @include     /^https?://(bangumi|bgm|chii)\.(tv|in)/(subject|index|anime|game|book|subject_search)/.*$/
// @include     /^https?://(bangumi|bgm|chii).(tv|in)/$/
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bt_search_for_bgm.user.js
// @author      22earth
// @version     1.1.0
// @note        1.0.0 使用定期更新搜索引擎列表的方式
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
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
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _gmFetch = __webpack_require__(1);

var _index = __webpack_require__(2);

var USERJS_PREFIX = "E_USERJS_SEARCH_";
var API_STR = USERJS_PREFIX + "SEARCH_APIS";
var UPDATE_INTERVAL = 24 * 60 * 60 * 1000 * 30;
var VERSION = "1.1.0";
var SEARCH_APIS_URL = "https://raw.githubusercontent.com/22earth/gm_scripts/master/searchapis.json";

if (GM_registerMenuCommand) {
  // 用户脚本命令清除缓存信息
  GM_registerMenuCommand("获取最新搜索引擎列表", function () {
    return (0, _index.clearInfoStorage)(USERJS_PREFIX);
  }, "f");
}

async function getSearchAPIs(str) {
  var searchAPIsResource = localStorage.getItem(str);
  if (!searchAPIsResource || (0, _index.infoOutdated)(USERJS_PREFIX, UPDATE_INTERVAL, VERSION)) {
    console.log("begin fetch apis");
    searchAPIsResource = await (0, _gmFetch.gmFetch)(SEARCH_APIS_URL);
    var myRules = JSON.parse(searchAPIsResource);
    var magnetWRules = await getMagnetWRule();
    var apis = Object.assign({}, magnetWRules, myRules);
    localStorage.setItem(str, JSON.stringify(apis));

    localStorage.setItem(USERJS_PREFIX + "VERSION", VERSION);
    localStorage.setItem(USERJS_PREFIX + "LATEST_UPDATE_TIME", new Date().getTime());
    return apis;
  } else if (searchAPIsResource) {
    return JSON.parse(searchAPIsResource);
  } else {
    (0, _index.clearInfoStorage)(USERJS_PREFIX);
    return {};
  }
}
async function getMagnetWRule() {
  var URL = "https://magnetw.app/rule.json";

  var rules = JSON.parse((await (0, _gmFetch.gmFetch)(URL)));
  var myRules = {};
  rules.forEach(function (obj) {
    var url = obj.url;
    if (obj.paths && obj.paths.preset) {
      var preset = obj.paths.preset.replace("{k}", "{searchTerms}").replace("{p}", "1");
      url = "" + url + preset;
      myRules[obj.id] = [obj.name, obj.icon || obj.url + "/favicon.ico", url];
    }
  });
  return myRules;
}

async function init() {
  var deprecatedEngines = ["btdigg", "camoe", "btcherry"];
  var allSearchEngineLists = [["dmhy"], // CN
  ["google", "sukebei", "tokyotosho"]];

  if (!localStorage.getItem("searchEngines") || _typeof(JSON.parse(localStorage.getItem("searchEngines"))) !== "object") {
    localStorage.setItem("searchEngines", JSON.stringify(["dmhy", "google"]));
  }
  // Data format and order like this: name : ["title", "icon", "searchapi"].
  // In "searchapi", query string should indead by {searchTerms}.
  var searchAPIsUser = {};

  var searchAPIs = await getSearchAPIs(API_STR);

  for (var i = 0, len = deprecatedEngines.length; i < len; i++) {
    delete searchAPIs[deprecatedEngines[i]];
  }
  var searchEngineLists = Object.keys(searchAPIs);
  var searchEngines = JSON.parse(localStorage.getItem("searchEngines"));
  searchEngines = searchEngines.filter(function (e) {
    if (searchEngineLists.indexOf(e) !== -1) return true;
  });

  var addSearchIcon = {
    init: function init() {
      if (window.location.href.match("/subject/") && document.getElementById("navMenuNeue").children[2].children[0].className !== "focus chl") this.addIcon1();else if (window.location.href.match("/anime|index|game|book|subject_search/")) this.addIcon2();
    },
    createLink: function createLink(link) {
      var searchIcon = document.createElement("a");
      searchIcon.href = link;
      searchIcon.target = "_blank";
      searchIcon.className = "searchicon";
      var searchIconImg = document.createElement("img");
      searchIconImg.style.cssText = "display:inline-block;border:none;height:12px;width:14px;margin-left:2px";
      searchIcon.appendChild(searchIconImg);
      // add title and icon
      var re = new RegExp(searchEngineLists.join("|"));
      if (link.match(re)) {
        var domain = link.match(re)[0];
        searchIcon.title = searchAPIs[domain][0];
        var iconURL = searchAPIs[domain][1];
        searchIconImg.src = iconURL;
      }
      return searchIcon;
    },

    getChineseName: function getChineseName(title) {
      if (window.location.href.match(/subject_search|index/)) return title.getElementsByClassName("l")[0].textContent;
      if (title.getElementsByTagName("a")[0].title) return title.children[0].title;
      return title.children[0].textContent;
    },

    getJanpaneseName: function getJanpaneseName(title) {
      if (window.location.href.match(/subject_search/)) {
        if (title.getElementsByClassName("grey").length) return title.getElementsByClassName("grey")[0].textContent;else return title.getElementsByClassName("l")[0].textContent;
      }
      if (title.tagName === "H3" && title.children[1] !== undefined) {
        return title.children[1].textContent;
      } else if (title.tagName === "H1") return title.children[0].textContent;
      return "";
    },
    getLink: function getLink(engineName, animeName) {
      return searchAPIs[engineName][2].replace(/\{searchTerms\}/, encodeURIComponent(animeName));
    },
    addIcon1: function addIcon1() {
      // add search icon in subject page
      var h1 = document.getElementsByTagName("h1")[0];
      if (h1) {
        for (var i = 0, len = searchEngines.length; i < len; i++) {
          var animeName = this.getJanpaneseName(h1);
          var engineName = searchEngines[i];
          if (allSearchEngineLists[0].indexOf(engineName) > -1 || !animeName.length) animeName = this.getChineseName(h1);

          h1.appendChild(this.createLink(this.getLink(engineName, animeName)));
        }
      }
    },

    addIcon2: function addSearchIcon2() {
      // add search icon in anime or index page
      //    if (window.location.href.match(/subject_search/))
      for (var i = 0, len = document.getElementsByTagName("h3").length; i < len; i++) {
        var h3 = document.getElementsByTagName("h3")[i];
        for (var j = 0; j < searchEngines.length; j++) {
          var animeName = this.getJanpaneseName(h3);
          var engineName = searchEngines[j];
          if (allSearchEngineLists[0].indexOf(engineName) > -1 || !animeName.length) animeName = this.getChineseName(h3);
          h3.appendChild(this.createLink(this.getLink(engineName, animeName)));
        }
      }
    }
  };

  var searchSwitch = {
    init: function init() {
      if (this.isHomepge()) {
        this.addStyle();
        this.insertStatus();
        this.insertSearchEngineSwitch();
      }
    },
    isHomepge: function isHomepge() {
      return window.location.pathname === "/" && document.getElementById("columnTimelineInnerWrapper") ? true : false;
    },
    addStyle: function addStyle(css) {
      if (css) {
        GM_addStyle(css);
      } else {
        GM_addStyle([".search-switches {display:none;}", "*:hover > .search-switches {display:block;}", ".search-status {padding: 5px 15px 0;}", ".search-switches {overflow:hidden;}", ".search-switches a {display:inline-block;float:left;margin:5px 5px;padding:5px 5px;border-radius:4px;box-shadow:1px 1px 2px #333;}", ".search-switches a.engine-off {background:#ccffcc none repeat scroll 0 0;color:#333;}", ".search-switches a.engine-on {background:#f09199 none repeat scroll 0 0;color:#fff;}"].join(""));
      }
    },
    insertStatus: function insertStatus() {
      // move to sidepanel because of confliction of default function
      var colB = document.querySelector("#columnHomeB");
      var b = document.createElement("div");
      // b.style.height = '500px';  // as high as posible to activate mouse hover event.
      colB.appendChild(b);
      // main div to show status and toggle search engine
      var status = document.createElement("div");
      status.className = "search-status";
      status.textContent = "已开启" + searchEngines.length + "个搜索引擎";
      b.appendChild(status);
      var div = document.createElement("div");
      div.className = "search-switches";
      b.appendChild(div);
      b.innerHTML += "<br />";
    },
    insertSearchEngineSwitch: function insertSearchEngineSwitch() {
      var div = document.querySelector(".search-switches");
      for (var i = 0; i < searchEngineLists.length; i += 1) {
        if (searchEngines.indexOf(searchEngineLists[i]) > -1) {
          div.appendChild(this.createSwitch(searchEngineLists[i], "engine-on"));
        } else {
          div.appendChild(this.createSwitch(searchEngineLists[i], "engine-off"));
        }
      }
    },
    createSwitch: function createSwitch(name, aclass) {
      var a = document.createElement("a");
      a.className = aclass;
      a.textContent = name;
      a.href = "#";
      a.addEventListener("click", function (e) {
        var engines = searchEngines;
        if (e.target.className === "engine-on") {
          e.target.className = "engine-off";
          var index = engines.indexOf(e.target.textContent);
          if (index > -1) engines.splice(index, 1);
        } else {
          e.target.className = "engine-on";
          engines.push(e.target.textContent);
        }
        var status = document.querySelector(".search-status");
        status.textContent = "已开启" + document.querySelectorAll(".engine-on").length + "个搜索引擎";
        localStorage.setItem("searchEngines", JSON.stringify(engines));
        e.preventDefault();
      });
      return a;
    },
    registerEvent: function registerEvent() {}
  };

  try {
    searchSwitch.init();
    addSearchIcon.init();
  } catch (e) {
    console.log(e);
  }
}

init();

/***/ }),
/* 1 */
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
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function infoOutdated(prefix, interval, version) {
  var localVersion = localStorage.getItem(prefix + 'VERSION');
  var time = localStorage.getItem(prefix + 'LATEST_UPDATE_TIME');
  if (!localVersion || !time || localVersion !== version) {
    return true;
  }
  var now = new Date();
  if (now - new Date(time) > interval) {
    clearInfoStorage(prefix);
    return true;
  }
}

function clearInfoStorage(prefix) {
  var now = new Date();
  for (var key in localStorage) {
    if (key.match(prefix)) {
      console.log(localStorage.getItem(key));
      localStorage.removeItem(key);
    }
  }
}

module.exports = {
  infoOutdated: infoOutdated,
  clearInfoStorage: clearInfoStorage
};

/***/ })
/******/ ]);