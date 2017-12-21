// ==UserScript==
// @name           bgm_item_note
// @namespace      http://bgm.tv/user/liaune
// @description    条目备注
// @author         niR,Liaune
// @version        1.0
// @license        MIT License
// @encoding       utf-8
// @require        http://code.jquery.com/jquery-2.1.1.js
// @grant          GM_setClipboard
// @grant          GM_getResourceText
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_listValues
// @grant          GM_registerMenuCommand
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// ==/UserScript==


var addBtn, addNotes, appendStyle, base64toutf8, confirmHiding, exportData, exportPlainText, formatNum, getTm, getVal, hideNote, importData, main, readFile, replaceNlc, saveFile, showNote, updateNote, utf8tobase64;

getVal = function() {
  var itemlink, val;
  itemlink = $('#headerSubject .nameSingle > a').attr('href');
  val = GM_getValue(itemlink, '');
  return val;
};

updateNote = function() {
  var itemlink, val;
  val = $('#bgmnote textarea').val();
  itemlink = $('#headerSubject .nameSingle > a').attr('href');
  GM_setValue(itemlink, val);
  return hideNote();
};

confirmHiding = function() {
  var answer, new_val, val;
  val = getVal();
  new_val = $('#bgmnote textarea').val();
  if (val === new_val) {
    return hideNote();
  } else {
    answer = confirm('备注似乎已经被更改，是否保存更改？');
    if (answer) {
      return updateNote();
    } else {
      return hideNote();
    }
  }
};

showNote = function() {
  var val;
  $('#headerSubject .subjectNav').html(function(i, old) {
    var nvct;
    nvct = '<div id="bgmnote" style="margin:0 200px auto;"><textarea name="bgmnote" class="reply" style="width:500px; height: 50px;"></textarea><div id="submitBtnO"><input id="updatenote" class="inputBtn" value="写好了" name="submit" type="submit">&nbsp;&nbsp; <a id="cancelbtn" href="javascript:;">取消</a></div></div>';
    return nvct + old;
  });
  val = getVal();
  $('#bgmnote textarea').val(val);
  $('body').off('click.show_n');
  $('body').on('click.textarea', '#bgmnotebtn', confirmHiding);
  $('body').on('click.textarea', '#cancelbtn', hideNote);
  return $('body').on('click.textarea', '#updatenote', updateNote);
};

hideNote = function() {
  $('body').off('click.textarea');
  $('#bgmnote').remove();
  return $('body').on('click.show_n', '#bgmnotebtn', showNote);
};

addBtn = function() {
  var new_btn, rr;
  var val = getVal();
  var path= '<span class="tip">'+val+'</span>';
  rr = $('#headerSubject .nameSingle');
  new_btn = '<a href="javascript:;" class="chiiBtn" id="bgmnotebtn"><span>备注</span></a>';
  rr.html(rr.html() + new_btn+ path);
  return $('body').on('click.show_n', '#bgmnotebtn', showNote);
};

addNotes = function() {
  return $('a.subjectCover').each(function() {
    var note, itemlink;
    itemlink = this.attr('href');
    note = GM_getValue(itemlink, '');
    return this.setAttribute('title', note);
  });
};

replaceNlc = function(str) {
  var _str, new_str;
  _str = str.replace(/>[\n\s]*</g, '><');
  new_str = _str.replace(/(>|^)([^<]*)\n([^>]*)(<|$)/g, function(s) {
    return s.replace(/\n/g, '<br>');
  });
  return new_str;
};

utf8tobase64 = function(str) {
  return btoa(unescape(encodeURIComponent(str)));
};

base64toutf8 = function(str) {
  return decodeURIComponent(escape(atob(str)));
};

exportData = function() {
  var b64str, i, j, len, pairs, ref, value;
  pairs = [];
  ref = GM_listValues();
  for (j = 0, len = ref.length; j < len; j++) {
    i = ref[j];
    value = GM_getValue(i);
    if (!value.trim()) {
      continue;
    }
    pairs.push([utf8tobase64(i), utf8tobase64(value)].join(':'));
  }
  b64str = pairs.join(';');
  console.log(b64str);
  GM_setClipboard(b64str);
  return alert('已复制到剪贴板');
};

exportPlainText = function() {
  var i, j, len, n, pairs, plain_text, ref, sub, subl, subr, sup, supl, supr, t, value;
  n = 3;
  sup = '♀';
  sub = '♂';
  t = n + 1;
  supl = Array(t).join(sup) + ' ';
  supr = ' ' + Array(t).join(sup);
  subl = Array(t).join(sub) + ' ';
  subr = ' ' + Array(t).join(sub);
  pairs = [];
  ref = GM_listValues();
  for (j = 0, len = ref.length; j < len; j++) {
    i = ref[j];
    value = GM_getValue(i);
    if (!value.trim()) {
      continue;
    }
    pairs.push([supl + i.slice(6) + supr, value, subl + i.slice(6) + subr].join('\n'));
  }
  plain_text = pairs.join('\n\n');
  console.log(plain_text);
  GM_setClipboard(plain_text);
  return alert('已复制到剪贴板');
};

importData = function(b64str) {
  var error, i, j, key, len, pair, pairs, results, value;
  pairs = b64str.split(';');
  results = [];
  for (j = 0, len = pairs.length; j < len; j++) {
    i = pairs[j];
    pair = i.split(':');
    try {
      key = base64toutf8(pair[0]);
      value = base64toutf8(pair[1]);
    } catch (_error) {
      error = _error;
      console.log(error);
      continue;
    }
    results.push(GM_setValue(key, value));
  }
  return results;
};

formatNum = function(n) {
  if (n < 10) {
    return "0" + n;
  }
  return "" + n;
};

getTm = function() {
  var d, day, m, y;
  day = new Date();
  y = day.getFullYear();
  m = formatNum(day.getMonth() + 1);
  d = formatNum(day.getDate());
  return "" + y + m + d;
};

saveFile = function() {
  var blob, day, j, key, len, pairs, ref, text, value;
  pairs = [];
  ref = GM_listValues();
  for (j = 0, len = ref.length; j < len; j++) {
    key = ref[j];
    value = GM_getValue(key);
    if (!value.trim()) {
      continue;
    }
    pairs.push([key, value]);
  }
  text = JSON.stringify(pairs);
  blob = new Blob([data], {
    type: "text/plain;charset=utf-8"
  });
  day = getTm();
  return saveAs(blob, "bgmnote_" + day + ".txt");
};

readFile = function(evt) {
  var file, reader;
  if (!(window.File && window.FileReader && window.FileList)) {
    alert("浏览器不支持");
    return false;
  }
  file = evt.target.files[0];
  reader = new FileReader();
  reader.onload = function(e) {
    var j, len, pair, pairs, results, text;
    console.log(typeof e.target.result);
    text = e.target.result.trim();
    pairs = JSON.parse(text);
    results = [];
    for (j = 0, len = pairs.length; j < len; j++) {
      pair = pairs[j];
      results.push(GM_setValue(pair[0], pair[1]));
    }
    return results;
  };
  return reader.readAsText(file);
};

appendStyle = function() {
  return $('head').append('<style type="text/css">\n  .ui-helper-hidden {\n    display: none;\n  }\n  .ui-helper-hidden-accessible {\n    border: 0;\n    clip: rect(0 0 0 0);\n    height: 1px;\n    margin: -1px;\n    overflow: hidden;\n    padding: 0;\n    position: absolute;\n    width: 1px;\n  }\n  .ui-helper-reset {\n    margin: 0;\n    padding: 0;\n    border: 0;\n    outline: 0;\n    line-height: 1.3;\n    text-decoration: none;\n    font-size: 100%;\n    list-style: none;\n  }\n  .ui-helper-clearfix:before,\n  .ui-helper-clearfix:after {\n    content: "";\n    display: table;\n    border-collapse: collapse;\n  }\n  .ui-helper-clearfix:after {\n    clear: both;\n  }\n  .ui-helper-clearfix {\n    min-height: 0; /* support: IE7 */\n  }\n  .ui-helper-zfix {\n    width: 100%;\n    height: 100%;\n    top: 0;\n    left: 0;\n    position: absolute;\n    opacity: 0;\n    filter:Alpha(Opacity=0);\n  }\n  .ui-front {\n    z-index: 100;\n  }\n  .ui-tooltip {\n    padding: 8px;\n    position: absolute;\n    z-index: 9999;\n    max-width: 500px;\n    -webkit-box-shadow: 0 0 5px #aaa;\n    box-shadow: 0 0 5px #aaa;\n  }\n  body .ui-tooltip {\n    border-width: 2px;\n  }\n</style>');
};

(function(){
  if (location.href.indexOf('subject') > 0) {
    addBtn();
    return GM_registerMenuCommand('导出注释', exportPlainText);
  } else {
    appendStyle();
    addNotes();
/*     $('a.subjectCover').tooltip({
      track: true,
      items: '[title]',
      content: function() {
        return replaceNlc(this.title);
      }
    });*/
  }
})();

