// ==UserScript==
// @name         全站动态&好友动态切换完全版
// @namespace    tv.bgm.cedar.timelinePerfectSwitcher
// @version      1.0
// @description  完美切换全站动态&好友动态. 全标签页适配. 长按可修改默认行为.
// @author       Cedar
// @include      /^https?://((bgm|bangumi)\.tv|chii\.in)/(timeline)?$/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';

  GM_addStyle(`
#columnTimelineInnerWrapper ul.timelineTabs li a.global-timeline-focus,
#columnTimelineInnerWrapper ul.timelineTabs li a.global-timeline-on {
  color: white;
  /*background: dodgerblue;*/
  background: #4F93CF;
}
#columnTimelineInnerWrapper ul.timelineTabs li a.global-timeline-off {
  color: white;
  background: #F09199;
}
`);

  let $TLtabsWrapper = $('#timelineTabs');
  let $TLtabs = $TLtabsWrapper.children('li');

  // 注意设置 event listener 时适配触屏
  // 全站动态的对应按钮
  let $globalTLtabs = $TLtabs.clone().hide();
  $globalTLtabs.children('a').removeAttr('id').removeClass('focus');
  $globalTLtabs.find('a:not(.top)').on('click touchend', switch_globalTLtabs); // :not(.top)剔除的是"更多"按钮. 它是个菜单, 不应该添加.
  $TLtabsWrapper.append($globalTLtabs);

  // 切换按钮. 用于切换全站动态与好友动态
  let $globalTLSwitchBtn = $(document.createElement('a'))
    .attr('href', 'javascript:void(0);')
    .addClass('global-timeline-off')
    .text('好友动态').on('click touchend', toggle_globalTLtabs);
  $TLtabsWrapper.prepend($(document.createElement('li')).append($globalTLSwitchBtn));

  // 如果长按切换按钮, 可以修改默认设置
  let longPressTimer;
  $globalTLSwitchBtn.on('mousedown touchstart', function(e) {
    e.preventDefault();
    longPressTimer = setTimeout(() => {localStorage.setItem("global_timeline_switch_on", confirm("默认切换为全站动态？"))}, 750);
  })
    .on('mouseleave mouseup touchend', function(e) {
    e.preventDefault();
    clearTimeout(longPressTimer);
  })

  // 读取设置判断是否默认显示全站动态
  let default_global = localStorage.getItem("global_timeline_switch_on") || 'false';
  if(default_global == 'true') $globalTLSwitchBtn.trigger('click');

  function switch_globalTLtabs(e) {
    e.preventDefault();
    set_globalTL_focus(e.target);
    fetch_global_timeline(e.target.href);
  }

  function set_globalTL_focus(el) {
    $globalTLtabs.find('a').removeClass('global-timeline-focus');
    el.classList.add('global-timeline-focus');
    let tag_more = el.parentElement.parentElement.previousElementSibling;
    if(tag_more) tag_more.classList.add('global-timeline-focus');
  }

  function fetch_global_timeline(url) {
    let tmlContent = document.getElementById('tmlContent');
    tmlContent.innerHTML = '<div class="loading"><img src="/img/loadingAnimation.gif" /></div>';
    fetch(url, {credentials: "omit"})
      .then(r => r.text())
      .then(html => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, 'text/html');
        let globalTmlContent = doc.getElementById('tmlContent');
        tmlContent.innerHTML = globalTmlContent.innerHTML;
        if(chiiLib) chiiLib.tml.prepareAjax();
      });
  }

  function toggle_globalTLtabs(e) {
    e.preventDefault();
    $globalTLSwitchBtn.toggleClass('global-timeline-on global-timeline-off');
    $globalTLtabs.toggle();
    $TLtabs.toggle();
    let globalOn = $globalTLSwitchBtn.hasClass('global-timeline-on');
    if(globalOn) { // toggled to on
      $globalTLSwitchBtn.text('全站动态');
      $TLtabs.find('.focus').removeClass('focus');
      $globalTLtabs.first().children().trigger('click');
    } else {
      $globalTLSwitchBtn.text('好友动态');
      $globalTLtabs.find('.global-timeline-focus').removeClass('global-timeline-focus');
      $TLtabs.first().children().trigger('click');
    }
  }
})();
