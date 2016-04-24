// ==UserScript==
// @name        Bangumi-Episode-Chinese
// @namespace   org.binota.scripts.bangumi.bec
// @description Show Chinese episode name in episode page.
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/ep\/\d+/
// @version     0.0.1
// @grant       GM_xmlhttpRequest
// ==/UserScript==
'use strict';

var $ = function(query) {
  return document.querySelector(query);
};

var subject = (function() {
  return $('h1.nameSingle a').href.match(/\/subject\/(\d+)/)[1];
})();

var episode = window.location.href.match(/\/ep\/(\d+)/)[1];

//Query API
GM_xmlhttpRequest({
  method: 'GET',
  url: `http://api.bgm.tv/subject/${subject}?responseGroup=large`,
  onload: function(response) {
    var data = JSON.parse(response.response);
    console.log(data);
    for(let ep of data.eps) {
      console.log(ep);
      if(ep.id == episode) {
        $('h2.title').innerHTML = $('h2.title').innerHTML.replace('<small', ` / ${ep.name_cn} <small`);
        break;
      }
    }
  }
});
