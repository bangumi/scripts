// ==UserScript==
// @name        Bangumi 首页条目名中文化
// @namespace   org.upsuper.bangumi
// @grant       none
// @include     http://bangumi.tv/
// @include     http://bangumi.tv/?*
// @include     http://bangumi.tv/timeline*
// @include     http://bangumi.tv/subject/*
// @exclude     http://bangumi.tv/subject/*/*
// @include     http://bangumi.tv/user/*/timeline*
// @include     http://bgm.tv/
// @include     http://bgm.tv/?*
// @include     http://bgm.tv/timeline*
// @include     http://bgm.tv/subject/*
// @exclude     http://bgm.tv/subject/*/*
// @include     http://bgm.tv/user/*/timeline*
// @include     http://chii.in/
// @include     http://chii.in/?*
// @include     http://chii.in/timeline*
// @include     http://chii.in/subject/*
// @exclude     http://chii.in/subject/*/*
// @include     http://chii.in/user/*/timeline*
// @version     5.2.3
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

  function updateTimeline(side) {
    var $anchors;
    var tlSel = side ? '#home_tml' : '#timeline';

    $anchors = $a(tlSel + ' .info_sub>a.tip[href*="/subject/"]');
    displayChineseName($anchors, function (ch) {
      var origin = this.innerHTML;
      if (!ch) return;
      if (displayMode) {
        this.title = ch;
        if (!side)
          this.innerHTML += ' <small>' + ch + '</small>';
      } else {
        this.title = this.textContent;
        if (side)
          this.innerHTML = ch;
        else
          this.innerHTML = ch + ' <small>' + origin + '</small>';
      }
    });

    $anchors = $a(tlSel + ' .info>a.l[href*="/subject/"], ' +
                  tlSel + ' .info_full>a.l[href*="/subject/"]');
    var alist = [];
    for (var i = 0; i < $anchors.length; i++) {
      var $anchor = $anchors[i];
      if ($anchor.href.indexOf('doujin') < 0)
        alist.push($anchor);
    }
    displayChineseName(alist, function (ch) {
      if (!ch) return;
      if (displayMode) {
        this.title = ch;
      } else {
        this.title = this.textContent;
        this.innerHTML = ch;
      }
    });
  }
  function updateManager() {
    var $anchors = $a('#prgSubjectList>li>a.title');
    var pattern = '#subjectPanel_{0} .tinyHeader>a[href^="/subject/"]',
    pattern2 = '#subjectPanel_{0} .headerInner>h3>a',
    pattern3 = '#prgSubjectList a.subjectItem[subject_id="{0}"]';
    displayChineseName($anchors, function (ch) {
      if (!ch) return;

      var $span = this.getElementsByTagName('span')[0];
      var id = this.attributes.subject_id.value;
      var $a1 = $(pattern.u$format(id)),
      $a2 = $(pattern2.u$format(id)),
      $a3 = $(pattern3.u$format(id));

      if (displayMode) {
        this.title = ch;
        $a1.title = ch;
        $a2.title = ch;
      } else {
        $span.innerHTML = ch;
        $a1.innerHTML = ch;
        $a2.title = $a2.textContent;
        $a2.innerHTML = ch;
        var orig = $a3.dataset.originalTitle;
        $a3.dataset.originalTitle =
          '{0} {1}'.u$format(ch, orig.split(' ').pop());
      }
    });
  }
  function updateTopics() {
    var $anchors = $a('#home_subject_tpc .grey>a');
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

  // insert style
  var $style = $c('style');
  $style.textContent = '\
  #timeline .info_sub>a.tip>small { color: #aaa; } \
  #timeline .info_sub>a.tip>small::before { content: "「"; } \
  #timeline .info_sub>a.tip>small::after { content: "」"; }';
  document.body.appendChild($style);

  // create switcher
  var $logout = $('#dock a[href*="/logout/"]'),
      $dock = $logout.parentNode;
  if ($logout) {
    var $switcher = $c('a');
    $switcher.href = '#';
    $switcher.textContent = displayMode ?  '◇' : '◆';
    $switcher.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage[localPrefix + 'mode'] = !displayMode ? 1 : 0;
      location.href = location.href;
    });
    $dock.insertBefore($switcher, $logout);
    $dock.insertBefore($t(' | '), $logout);
  }

  // update timeline
  var $tmlContent = $('#tmlContent');
  if ($tmlContent) {
    $tmlContent.addEventListener('DOMSubtreeModified', function (e) {
      if (e.target.id == 'tmlContent')
        updateTimeline(false);
    });
    updateTimeline(false);
  } else {
    updateTimeline(true);
  }

  // update ep manager && topics
  updateManager();
  updateTopics();

})();
