// ==UserScript==
// @name         全站动态&好友动态切换完全版
// @namespace    tv.bgm.cedar.timelinePerfectSwitcher
// @version      1.2
// @description  完美切换全站动态&好友动态. 全标签页适配. 长按可修改默认行为.
// @author       Cedar
// @match        *://bgm.tv/
// @match        *://bgm.tv/timeline
// @match        *://bgm.tv/timeline?*
// @match        *://bangumi.tv/
// @match        *://bangumi.tv/timeline
// @match        *://bangumi.tv/timeline?*
// @match        *://chii.in/
// @match        *://chii.in/timeline
// @match        *://chii.in/timeline?*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';

  GM_addStyle(`
#columnTimelineInnerWrapper ul.timelineTabs li a.global-timeline-focus,
#columnTimelineInnerWrapper ul.timelineTabs li a.global-timeline-on {
  color: white;
  background: var(--secondary-color, #02a3fb);
}
#columnTimelineInnerWrapper ul.timelineTabs li a.global-timeline-off {
  color: white;
  background: var(--primary-color, #f09199);
}
`);

  // 好友动态对应的按钮
  let $TLtabsWrapper = $('#timelineTabs');
  let $TLtabs = $TLtabsWrapper.children('li');

  // (注意设置 event listener 时适配触屏)
  // 全站动态对应的按钮
  let $globalTLtabs = $TLtabs.clone().hide();
  $globalTLtabs.find('a:not(.top)').removeAttr('id').removeClass('focus')  // 用:not(.top)剔除"更多"按钮. 它只是个菜单.
    .on('click touchend', switch_globalTLtabs);
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

  // 确定次要主题色，作为全站动态按钮的背景色
  function getSecondaryThemeColor() {
    /* 点开右下角个性化面板后，可通过如下代码确认每种主题色对应的 hex 颜色值。
    const elements = document.querySelectorAll('#customize-panel .color-options .color-preview');
    themeColors = Array.from(elements).map(el => {
      const rgbcolor = getComputedStyle(el).backgroundColor; // 返回值形如 'rgb(240, 145, 253)'
      const match = /(\d+),\s*(\d+),\s*(\d+)/.exec(rgbcolor);
      const [r, g, b] = match.slice(1).map(Number);
      const hexcolor = "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
      return `${el.classList.value}: ${hexcolor}`;
    });
    console.log(themeColors);
    */
    const themeColors = {
      // secondaryColor 的选择要提高按钮区分度
      'pink': {color: '#f09199', secondaryColor: 'blue'},
      'blue': {color: '#02a3fb', secondaryColor: 'pink'},
      'green': {color: '#89bd88', secondaryColor: 'red'},
      'purple': {color: '#a987ec', secondaryColor: 'orange'},
      'orange': {color: '#f37d4b', secondaryColor: 'purple'},
      'red': {color: '#e24658', secondaryColor: 'green'},
    };

    const themeColorConfig = chiiLib.ukagaka.getDefaultGeneralConfig().find(config => config.name == "themeColor"); // bangumi 官方 API
    const currentThemeColorName = themeColorConfig.getCurrentValue();
    const themeColor = themeColors[currentThemeColorName] || themeColors[themeColorConfig.defaultValue];
    if (!themeColor) return themeColors['pink'].color;
    return themeColors[themeColor.secondaryColor].color;
  }

  function switch_globalTLtabs(e) {
    e.preventDefault();
    // 要用currentTarget而不是target, 单击"更多"菜单下的按钮时可能会按到 a>span 上..
    set_globalTL_focus(e.currentTarget);
    fetch_global_timeline(e.currentTarget .href);
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
    fetch(url+'&ajax=1', {credentials: "omit"})
      .then(r => r.text())
      .then(html => {
        const fragment = document.createRange().createContextualFragment(html); // 解析为文档片段才能激活内部的 script，记录贴贴数据
        tmlContent.replaceChildren(fragment);
        chiiLib.tml.prepareAjax();
      })
      .catch(() => {
        $("#robot_speech_js").html(AJAXtip['error']);
        $("#robot").animate({opacity: 1}, 1000).fadeOut(500);
      });
  }

  function toggle_globalTLtabs(e) {
    e.preventDefault();
    $globalTLSwitchBtn.toggleClass('global-timeline-on global-timeline-off');
    $TLtabsWrapper[0].style.setProperty('--secondary-color', getSecondaryThemeColor());
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
