import { gmFetch } from '../utils/gmFetch';
import { infoOutdated, clearInfoStorage } from '../utils/index';

const USERJS_PREFIX = 'E_USERJS_SEARCH_';
const API_STR = USERJS_PREFIX + 'SEARCH_APIS';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000 * 30;
const VERSION = '1.0.1';
const SEARCH_APIS_URL = 'https://raw.githubusercontent.com/22earth/gm_scripts/master/searchapis.json'; 

if (GM_registerMenuCommand) {
  // 用户脚本命令清除缓存信息
  GM_registerMenuCommand('获取最新搜索引擎列表', () => clearInfoStorage(USERJS_PREFIX), 'f');
}

async function getSearchAPIs(str) {
  var searchAPIsResource = localStorage.getItem(str);
  if (!searchAPIsResource || infoOutdated(USERJS_PREFIX, UPDATE_INTERVAL, VERSION)) {
    console.log('begin fetch apis');
    searchAPIsResource = await gmFetch(SEARCH_APIS_URL);
    localStorage.setItem(str, searchAPIsResource);

    localStorage.setItem(USERJS_PREFIX + 'VERSION', VERSION);
    localStorage.setItem(USERJS_PREFIX + 'LATEST_UPDATE_TIME', new Date().getTime());
  }
  return await JSON.parse(searchAPIsResource);
}

async function init() {
  const deprecatedEngines = ["btdigg", "camoe", "btcherry"];
  const allSearchEngineLists = [
    ["dmhy"],  // CN
    ["google", "sukebei", "tokyotosho", "torrentproject"],  // JP
  ];

  if (!localStorage.getItem('searchEngines') || typeof JSON.parse(localStorage.getItem('searchEngines')) !== 'object') {
    localStorage.setItem('searchEngines', JSON.stringify(['dmhy', 'google', 'shousibaocai']));
  }
  // Data format and order like this: name : ["title", "icon", "searchapi"].
  // In "searchapi", query string should indead by {searchTerms}.
  var searchAPIsUser = {
  };

  var searchAPIs = await getSearchAPIs(API_STR);

  for (var i = 0, len = deprecatedEngines.length; i < len; i++) {
    delete searchAPIs[deprecatedEngines[i]];
  }
  var searchEngineLists = Object.keys(searchAPIs);
  var searchEngines = JSON.parse(localStorage.getItem('searchEngines'));
  searchEngines = searchEngines.filter(function(e) {
    if (searchEngineLists.indexOf(e) !== -1)
      return true;
  });


  var addSearchIcon = {
    init: function() {
      if (window.location.href.match("/subject/") && document.getElementById("navMenuNeue").children[2].children[0].className !== "focus chl")
        this.addIcon1();
      else if (window.location.href.match("/anime|index|game|book|subject_search/"))
        this.addIcon2();

    },
    createLink: function(link) {
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
        searchIconImg.src = searchAPIs[domain][1];
      }
      return searchIcon;
    },

    getChineseName: function(title) {
      if (window.location.href.match(/subject_search|index/))
        return title.getElementsByClassName("l")[0].textContent;
      if (title.getElementsByTagName("a")[0].title)
        return title.children[0].title;
      return title.children[0].textContent;
    },

    getJanpaneseName: function(title) {
      if (window.location.href.match(/subject_search/)) {
        if (title.getElementsByClassName("grey").length)
          return title.getElementsByClassName("grey")[0].textContent;
        else
          return title.getElementsByClassName("l")[0].textContent;
      }
      if (title.tagName === "H3" && title.children[1] !== undefined) {
        return title.children[1].textContent;
      }
      else if (title.tagName === "H1")
        return title.children[0].textContent;
      return "";
    },
    getLink: function(engineName, animeName) {
      return searchAPIs[engineName][2].replace(/\{searchTerms\}/, encodeURIComponent(animeName));
    },
    addIcon1: function() {
      // add search icon in subject page
      var h1 = document.getElementsByTagName("h1")[0];
      if (h1) {
        for (var i = 0, len = searchEngines.length; i < len; i++) {
          var animeName = this.getJanpaneseName(h1);
          var engineName = searchEngines[i];
          if (allSearchEngineLists[0].indexOf(engineName) > -1 || !animeName.length)
            animeName = this.getChineseName(h1);

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
          if (allSearchEngineLists[0].indexOf(engineName) > -1 || !animeName.length)
            animeName = this.getChineseName(h3);
          h3.appendChild(this.createLink(this.getLink(engineName, animeName)));
        }
      }
    },
  };

  var searchSwitch = {
    init: function() {
      if (this.isHomepge()) {
        this.addStyle();
        this.insertStatus();
        this.insertSearchEngineSwitch();
      }
    },
    isHomepge: function() {
      return window.location.pathname === '/' && document.getElementById('columnTimelineInnerWrapper')? true : false;
    },
    addStyle: function(css) {

      if (css) {
        GM_addStyle(css);
      } else {
        GM_addStyle([
          '.search-switches {display:none;}',
          '*:hover > .search-switches {display:block;}',
          '.search-status {padding: 5px 15px 0;}',
          '.search-switches {overflow:hidden;}',
          '.search-switches a {display:inline-block;float:left;margin:5px 5px;padding:5px 5px;border-radius:4px;box-shadow:1px 1px 2px #333;}',
          '.search-switches a.engine-off {background:#ccffcc none repeat scroll 0 0;color:#333;}',
          '.search-switches a.engine-on {background:#f09199 none repeat scroll 0 0;color:#fff;}'
        ].join(''));
      }
    },
    insertStatus: function() {
      // move to sidepanel because of confliction of default function
      var colB = document.querySelector('#columnHomeB');
      var b = document.createElement('div');
      // b.style.height = '500px';  // as high as posible to activate mouse hover event.
      colB.appendChild(b);
      // main div to show status and toggle search engine
      var status = document.createElement('div');
      status.className = 'search-status';
      status.textContent = '已开启'+ searchEngines.length + '个搜索引擎';
      b.appendChild(status);
      var div = document.createElement('div');
      div.className = 'search-switches';
      b.appendChild(div);
      b.innerHTML += '<br />';
    },
    insertSearchEngineSwitch: function() {
      var div = document.querySelector('.search-switches');
      for (var i = 0; i < searchEngineLists.length; i += 1) {
        if (searchEngines.indexOf(searchEngineLists[i]) > -1) {
          div.appendChild(this.createSwitch(searchEngineLists[i], 'engine-on'));
        } else {
          div.appendChild(this.createSwitch(searchEngineLists[i], 'engine-off'));
        }
      }
    },
    createSwitch: function(name, aclass) {
      var a = document.createElement('a');
      a.className = aclass;
      a.textContent = name;
      a.href = '#';
      a.addEventListener('click', function(e) {
        var engines = searchEngines;
        if (e.target.className === 'engine-on') {
          e.target.className = 'engine-off';
          var index = engines.indexOf(e.target.textContent);
          if (index > -1) engines.splice(index, 1);
        } else {
          e.target.className = 'engine-on';
          engines.push(e.target.textContent);
        }
        var status = document.querySelector('.search-status');
        status.textContent = '已开启'+ document.querySelectorAll('.engine-on').length + '个搜索引擎';
        localStorage.setItem('searchEngines', JSON.stringify(engines));
        e.preventDefault();
      });
      return a;
    },
    registerEvent: function () {

    }
  };

  try {
    searchSwitch.init();
    addSearchIcon.init();
  } catch (e) {
    console.log(e);
  }
}


init();
