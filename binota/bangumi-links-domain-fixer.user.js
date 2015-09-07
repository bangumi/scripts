// ==UserScript==
// @name        Bangumi-Links-Domain-Fixer
// @namespace   BLDF
// @description Fix the domain of links in Bangumi
// @include     /^https?:\/\/((bgm|bangumi)\.tv|chii\.in)/
// @version     0.0.1
// @grant       none
// ==/UserScript==

(function() {
  //Get the domain now using.
  var domain = window.location.host;
  var protocal = window.location.protocol;

  var links = document.getElementsByTagName('a');

  for(j = 0, len = links.length; j < len; j++) {
    i = links[j];
    if (i.href.match(/https?:\/\/((bgm|bangumi)\.tv|chii\.in)/)) {
      i.href = i.href.replace(/https?:\/\/((bgm|bangumi)\.tv|chii\.in)/, protocal + '//' + domain);
      i.innerHTML = i.innerHTML.replace(/https?:\/\/((bgm|bangumi)\.tv|chii\.in)/, protocal + '//' + domain);
    }
  }
})();

