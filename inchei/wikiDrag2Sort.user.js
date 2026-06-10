// ==UserScript==
// @name         关联条目/角色拖拽排序（手柄拖动版）
// @namespace    bangumi.wiki.drag.to.sort
// @version      0.5
// @description  左侧手柄拖动排序，无需激活按钮，支持动态新增条目
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*/add_related/subject/*
// @match        http*://bgm.tv/subject/*/add_related/character
// @match        http*://bangumi.tv/subject/*/add_related/subject/*
// @match        http*://bangumi.tv/subject/*/add_related/character
// @match        http*://chii.in/subject/*/add_related/subject/*
// @match        http*://chii.in/subject/*/add_related/character
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/5410
// ==/UserScript==

/* global Sortable */

(function() {
  'use strict';

  const style = document.createElement('style');
  const cssText = `
    .drag-handle {
      width: 10px;
      height: 40px;
      margin-right: 6px;
      cursor: grab;
      vertical-align: middle;
      background-image: linear-gradient(#999, #999), linear-gradient(#999, #999), linear-gradient(#999, #999);
      background-size: 8px 2px;
      background-position: center 4px, center 8px, center 12px;
      background-repeat: no-repeat;
      float: left;
    }
    .drag-handle:active {
      cursor: grabbing;
      background-image: linear-gradient(#555, #555), linear-gradient(#555, #555), linear-gradient(#555, #555);
    }
  `;
  style.appendChild(document.createTextNode(cssText));
  document.head.appendChild(style);

  const sortableScript = document.createElement('script');
  sortableScript.src = 'https://cdn.jsdmirror.com/npm/sortablejs@1.15.0/Sortable.min.js';
  sortableScript.async = false;
  document.body.appendChild(sortableScript);

  // 给单个 li 添加手柄
  function addHandleToLi(li) {
    if (li.classList.contains('has-handle')) return;
    if (li.querySelector('.drag-handle')) return;

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    li.prepend(handle);
    li.classList.add('has-handle');
  }

  function initSortable() {
    const $list = $('#crtRelateSubjects');
    if (!$list.length) return;
    const list = $list[0];

    // 初始条目添加手柄
    $list.children('li').each((i, li) => addHandleToLi(li));

    // 初始化拖拽
    new Sortable(list, {
      scroll: true,
      animation: 150,
      handle: '.drag-handle',
      draggable: 'li',
      onEnd: function() {
        $list.find('.item_sort').each((i, input) => {
          input.value = i + 1;
        });
      }
    });

    // 监听动态新增的 li（核心：自动给新条目加手柄）
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.tagName === 'LI') {
            addHandleToLi(node);
          }
        });
      });
    });

    observer.observe(list, {
      childList: true,
      subtree: false
    });
  }

  // 等待 Sortable 加载完成后初始化
  sortableScript.onload = () => {
    $(initSortable);
  };
})();
