// ==UserScript==
// @name        Bangumi 任意状态启用进度管理
// @namespace   org.upsuper.bangumi
// @include     http://bangumi.tv/subject/*
// @include     http://bgm.tv/subject/*
// @include     https://bgm.tv/subject/*
// @include     http://chii.in/subject/*
// @exclude     http://bangumi.tv/subject/*/*
// @exclude     http://bgm.tv/subject/*/*
// @exclude     https://bgm.tv/subject/*/*
// @exclude     http://chii.in/subject/*/*
// @version     1.4.2
// ==/UserScript==

function $(q) { return document.querySelector(q); }
function $a(q) { return document.querySelectorAll(q); }
if ($('.load-epinfo') && !$('.epStatusTool')) {
  var toolWatched = '<div class="epStatusTool">' +
    '<p id="epBtnCu_{0}" class="epBtnCu">看过</p>' +
    '<a href="/subject/ep/{0}/status/queue?gh={1}"  ' +
    'id="Queue_{0}" class="l ep_status">想看</a> ' +
    '<a href="/subject/ep/{0}/status/drop?gh={1}"  ' +
    'id="Drop_{0}" class="l ep_status">抛弃</a> ' +
    '<a href="/subject/ep/{0}/status/remove?gh={1}"  ' +
    'id="remove_{0}" class="l ep_status">撤消</a> </div>';
  var toolNan = '<div class="epStatusTool">' +
    '<p id="epBtnCu_{0}"></p>' +
    '<a href="/subject/ep/{0}/status/watched?gh={1}" ' +
    'id="Watched_{0}" class="l ep_status">看过</a> ' +
    '<a href="/subject/ep/{0}/status/watched?gh={1}" ' +
    'id="WatchedTill_{0}" class="l ep_status">看到</a> ' +
    '<a href="/subject/ep/{0}/status/queue?gh={1}"  ' +
    'id="Queue_{0}" class="l ep_status">想看</a> ' +
    '<a href="/subject/ep/{0}/status/drop?gh={1}"  ' +
    'id="Drop_{0}" class="l ep_status">抛弃</a> </div>';
  var logout = $('a[href*="/logout/"]').href;
  var gh = logout.substr(logout.indexOf('/logout/') + 8);
  var $popups = $a('.prg_popup');
  for (var i in $popups) {
    var id = $popups[i].id.substr(8);
    var $prg = $('#prg_' + id),
    $prginfo = $('#prginfo_' + id);
    if (!$prg || !$prginfo)
      continue;
    var tool = $prg.classList.contains('epBtnWatched') ?
      toolWatched : toolNan;
    tool = tool.replace(/\{0\}/g, id).replace(/\{1\}/g, gh);
    $prginfo.innerHTML = tool + $prginfo.innerHTML;
  }
}
