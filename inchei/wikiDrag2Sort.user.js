// ==UserScript==
// @name         关联条目/角色拖拽排序
// @namespace    bangumi.wiki.drag.to.sort
// @version      0.0.2
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

  const sortableScript = document.createElement('script');
  sortableScript.src = 'https://cdn.jsdmirror.com/npm/sortablejs@1.15.0/Sortable.min.js';
  sortableScript.async = false;
  sortableScript.onload = initSortableWithJquery;
  document.body.appendChild(sortableScript);
  /* global Sortable */

  let sortableInstance = null;
  function initSortableWithJquery() {
    $(function() {
      if (!$('#modifyOrder').length) {
        $('.inputBtn').after('<a href="javascript:void(0);" id="modifyOrder" class="chiiBtn rr">排序</a>');
      }

      let clickCount = 0;
      $('#modifyOrder').on('click', function() {
        clickCount++;
        const $btn = $(this);
        const $crtRelateSubjects = $('#crtRelateSubjects');
        const crtRelateSubjectsDom = $crtRelateSubjects[0];

        if (clickCount % 2 === 1) {
          $btn.addClass('sort-active');
          sortableInstance = new Sortable(crtRelateSubjectsDom, {
            animation: 150,
            handle: null,
            onEnd: function() {
              $crtRelateSubjects.find('.item_sort').each(function(i) {
                $(this).val(i + 1);
              });
            }
          });
        } else {
          $btn.removeClass('sort-active');
          if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
          }
        }
      });
    });
  }
})();
