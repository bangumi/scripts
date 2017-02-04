// ==UserScript==
// @name        bt_search_for_bgm
// @namespace   http://bangumi.tv/user/a_little
// @description add search icons in bangumi.tv for search anime 
// @include     /^https?://(bangumi|bgm|chii)\.(tv|in)/(subject|index|anime|game|book|subject_search)/.*$/
// @include     /^https?://(bangumi|bgm|chii).(tv|in)/$/
// @resource    apis  https://gist.githubusercontent.com/22earth/11859ea67a97b4df940350ce0f8052d5/raw/2609aeab9e42ad81d66fdb0b9721b76d4e12eacb/searchapis.json
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bt_search_for_bgm.user.js
// @version     0.13.4
// @grant       GM_addStyle
// @grant       GM_getResourceText
// ==/UserScript==

(function() {
  if (!localStorage.getItem('searchEngines') || typeof JSON.parse(localStorage.getItem('searchEngines')) !== 'object') {
    localStorage.setItem('searchEngines', JSON.stringify(['dmhy', 'google', 'torrentproject']));
  }
  var ENABLE_EXTERNAL_TEXT = true;
  var deprecatedEngines = ["btdigg", "camoe", "btcherry"];
  var allSearchEngineLists = [
    ["dmhy"],  // CN
    ["google", "sukebei", "tokyotosho", "torrentproject"],  // JP
  ];

  // Data format and order like this: name : ["title", "icon", "searchapi"].
  // In "searchapi", query string should indead by {searchTerms}.
  var searchAPIsUser = {
    google : [
      "Download Search",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABWUlEQVQ4jaXTPUvDQBgH8HyzkiCVdlBcFD+CDgUn0bU5rUMRS6mD4BuCVgfFKmitCl0s+FKhvoEgVvsyWKuRS9JLcvm7tcplSHW44e6e5/c8x91JAaKFZJXWFELRzZBVWgsQLST9JfknInlt9ExRJLMMqSOG67ID7gLb5xbG100h1hNIFyzM51gbu61wnN7Znl14Al+GC7LTas9nMi20bPgHPnUXmatOxbE1E89v3D8wd8DAbGBiw0R/XMfupY3RJcM/oBCKkUUDiUMGF/h1HN+AQiiC0xSa4aL04mBgVvcPTKZNbBYspHIMy3mGJnXx+s4xmBARAVg4Ybh4ctAb66wNJXSUGxx7RfEqBaDa5EgdMSEwmWXIlnwA+Qcb5QbHcLLTbjBGcfboILLq4yX2xXVsFSzUP1zcVzmOb2zsF21EVsRkhVD89zPVJTmqhWWV1rsGVFqRo1r4G6iM33AbQTj+AAAAAElFTkSuQmCC",
      "https://www.google.com/cse?q=&newwindow=1&cx=006100883259189159113%3Atwgohm0sz8q#gsc.tab=0&gsc.sort=&gsc.ref=more%3Ap2p&gsc.q={searchTerms}"
    ]
  };

  var searchAPIsResource = null;
  try {
    if (ENABLE_EXTERNAL_TEXT)
      searchAPIsResource = JSON.parse(GM_getResourceText("apis").replace(/\'/ig,'"'));
  } catch (e) {
    console.log("Pare JSON:", e);
  }
  var searchAPIs = Object.assign({}, searchAPIsResource, searchAPIsUser);

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
      b.style.height = '500px';  // as high as posible to activate mouse hover event.
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
}());
