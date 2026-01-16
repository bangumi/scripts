// ==UserScript==
// @name         关联条目/角色拖拽排序
// @namespace    bangumi.wiki.drag.to.sort
// @version      0.0.1
// @description  修改自 biota
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*/add_related/subject/*
// @match        http*://bgm.tv/subject/*/add_related/character
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/5410
// ==/UserScript==

(function() {
  'use strict';
  // 动态引入jquery-ui
  const script = document.createElement('script');
  script.src = 'https://code.jquery.com/ui/1.11.4/jquery-ui.min.js';
  script.async = false;
  document.body.appendChild(script);

  // 动态创建.sort-active样式类
  const style = document.createElement('style');
  const cssText = `
    a.chiiBtn.sort-active {
      text-shadow: none;
      -webkit-box-shadow: 0 0 3px #eee,inset 0 -1px 5px rgba(0,0,0,.1);
      -moz-box-shadow: 0 0 3px #eee,inset 0 -1px 5px rgba(0,0,0,.1);
      box-shadow: 0 0 3px #eee,inset 0 -1px 5px rgba(0,0,0,.1);
      color: #fff;
      background-image: -webkit-linear-gradient(top,#5fa3db 0,#72b6e3 100%);
      background-image: -o-linear-gradient(top,#5fa3db 0,#72b6e3 100%);
      background-image: linear-gradient(to bottom,#5fa3db 0,#72b6e3 100%);
      background-repeat: repeat-x;
    }
  `;
  style.appendChild(document.createTextNode(cssText));
  document.head.appendChild(style);

  // 核心业务逻辑
  $(function() {
    // 兜底创建按钮
    if (!$('#modifyOrder').length) {
      $('.inputBtn').after('<a href="javascript:void(0);" id="modifyOrder" class="chiiBtn rr">排序</a>');
    }

    let clickCount = 0;
    $('#modifyOrder').on('click', function() {
      clickCount++;
      const $btn = $(this);
      const $crtRelateSubjects = $('#crtRelateSubjects');

      if (clickCount % 2 === 1) {
        // 单数点击：启用排序 + 添加样式
        $crtRelateSubjects.sortable({
          update: function() {
            $(this).find('.item_sort').each(function(i) {
              $(this).val(i + 1);
            });
          }
        });
        $btn.addClass('sort-active');
      } else {
        // 双数点击：销毁排序 + 移除样式
        $crtRelateSubjects.sortable('destroy');
        $btn.removeClass('sort-active');
      }
    });
  });
})();
