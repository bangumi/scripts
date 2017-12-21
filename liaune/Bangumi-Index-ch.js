// ==UserScript==
// @name        Bangumi-Index-ch
// @namespace    https://github.com/bangumi/scripts/liaune
// @author       upsuper，Liaune
// @description  Bangumi 目录条目名中文化
// @include     /^https?:\/\/((bgm|bangumi)\.tv|chii\.in)\/index\/\d+/
// @version     1.0
// @grant       none
// ==/UserScript==

(function() {

  var localStorage = window.localStorage,
  localPrefix = 'ChineseName_',
  // displayMode: 0 => Display Chinese
  //            : 1 => Show Chinese as tip
  displayMode = parseInt(localStorage[localPrefix + 'mode']);

  function $(q) { return document.querySelector(q); }
  function $a(q) { return document.querySelectorAll(q); }
  function $c(t) { return document.createElement(t); }
  function $t(t) { return document.createTextNode(t); }
  String.prototype.u$format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, i) {
      return args[i] !== undefined ? args[i] : match;
    });
  };

  function isSubjectPage(str) {
    return /\/subject\/\d+$/.test(str);
  }
  function parseChineseName(text) {
    var re = /<li><span class="tip">中文名: <\/span>(.+?)<\/li>/;
    var result = re.exec(text);
    return result ? result[1] : '';
  }
  function setChineseName(id, ch) {
    localStorage[localPrefix + id] = ch;
    var event = new CustomEvent('_uChinese', {
      detail: {subject_id: id, chinese: ch}
    });
    window.dispatchEvent(event);
  }
  if (isSubjectPage(location)) {
    var id = location.href.split('/').pop();
    setChineseName(id, parseChineseName(document.body.innerHTML));
    return;
  }

  var titles;
  function displayChineseName($anchors, callback) {
    if (!titles) titles = {};
    function triggerDisplayCallback($anchor, ch) {
      setTimeout(function () { $anchor.u$displayCh(ch); });
    }
    function displayAll(id, ch) {
      var $anchors = titles[id];
      delete titles[id];
      setChineseName(id, ch);
      for (var i = 0; i < $anchors.length; i++)
      triggerDisplayCallback($anchors[i], ch);
    }
    function queryChineseName(id, url) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200)
          displayAll(id, parseChineseName(xhr.responseText));
      };
      xhr.open('GET', url, true);
      xhr.send(null);
    }
    for (var i = 0; i < $anchors.length; i++) {
      var $anchor = $anchors[i];
      if (!isSubjectPage($anchor.href))
        continue;
      var id = $anchor.href.split('/').pop();
      var ch = localStorage[localPrefix + id];
      $anchor.u$displayCh = callback;
      if (ch !== undefined) {
        triggerDisplayCallback($anchor, ch);
      } else {
        if (!titles[id]) {
          titles[id] = [];
          queryChineseName(id, $anchor.href);
        }
        titles[id].push($anchor);
      }
    }
  }

  function updateIndex() {
   var $anchors = $a('#browserItemList>li>div>h3>a');
    displayChineseName($anchors, function (ch) {
      if (!ch) return;
      if (displayMode) {
        this.title = ch;
      } else {
        this.title = this.textContent;
        this.innerHTML = ch;

      }
    });
  }
 updateIndex();


})();
