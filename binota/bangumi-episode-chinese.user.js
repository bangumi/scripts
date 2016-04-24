// ==UserScript==
// @name        Bangumi-Episode-Chinese
// @namespace   org.binota.scripts.bangumi.bec
// @description Show Chinese episode name in episode page.
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/ep\/\d+/
// @version     0.0.2
// @grant       GM_xmlhttpRequest
// ==/UserScript==
'use strict';

const STORAGE_PREFIX = `binota_bec_`;

var $ = function(query) {
  return document.querySelector(query);
};

var subject = $('h1.nameSingle a').href.match(/\/subject\/(\d+)/)[1];
var episode = window.location.href.match(/\/ep\/(\d+)/)[1];

var storage = new (function(driver) {
  this._storage = driver;

  this.set = function(key, value) {
    this._storage.setItem(`${STORAGE_PREFIX}${key}`, value);
    return value;
  };

  this.get = function(key) {
    return this._storage.getItem(`${STORAGE_PREFIX}${key}`);
  };

  this.remove = function(key) {
    this._storage.removeItem(`${STORAGE_PREFIX}${key}`);
    return key;
  };
})(localStorage);

var writeTitle = function(title) {
  $('h2.title').innerHTML = $('h2.title').innerHTML.replace('<small', ` / ${title} <small`);
  $('h2.title small').innerHTML += ` <a class="l" onclick="localStorage.removeItem('${STORAGE_PREFIX}${subject}');" href="#">[清除中文名缓存]`;
  return;
}

//check cache:
if(storage.get(subject)) {
  writeTitle(JSON.parse(storage.get(subject))[episode]);
} else {
  //Query API
  GM_xmlhttpRequest({
    method: 'GET',
    url: `http://api.bgm.tv/subject/${subject}?responseGroup=large`,
    onload: function(response) {
      var data = JSON.parse(response.response);
      //write cache
      var cacheData = {};

      for(let ep of data.eps) {
        if(ep.id == episode) {
          writeTitle(ep.name_cn);
        }
        cacheData[ep.id] = ep.name_cn;
      }

      storage.set(subject, JSON.stringify(cacheData));
    }
  });
}
