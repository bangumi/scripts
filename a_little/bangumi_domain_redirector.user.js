// ==UserScript==
// @name        bangumi domain redirector
// @namespace   https://github.com/22earth
// @description choose the domain of bangumi that you like, redirect to it
// @description:zh-CN 重定向番组计划(Bangumi)域名为个人常用域名
// @icon        http://bgm.tv/img/favicon.ico
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @version     0.1
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @run-at      document-start
// ==/UserScript==


(function() {
  function setDomain() {
    bgm_domain = prompt (
      '预设bangumi的域名是 "' + 'bangumi.tv' + '". 根据需要输入chii.in或者bgm.tv',
      'bangumi.tv'
    );
    GM_setValue('bgm', bgm_domain);
    return bgm_domain;
  }

  var bgm_domain = GM_getValue('bgm') || '';
  var current_url = window.location.href;
  var host = window.location.hostname;
  var domains = ['bangumi.tv', 'bgm.tv', 'chii.in'];
  if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|chii\.in|bgm\.tv/)) {
    bgm_domain = setDomain();
    bgm_domain = GM_getValue('bgm');
  }
  //console.log(bgm_domain);
  var index = domains.indexOf(bgm_domain);
  if (index > -1) domains.splice(index, 1);
  if (host.match(new RegExp(domains.join('|')))) {
    var URI = current_url.replace(/((?:bgm|bangumi)\.tv|chii\.in)/, bgm_domain);
    window.location.href = URI;
  }
  if (GM_registerMenuCommand) {
    GM_registerMenuCommand('设置常用域名', setDomain, 's');
  }
})();
