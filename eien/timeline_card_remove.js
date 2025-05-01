// ==UserScript ==
// @name         移除卡片
// @namespace    https://bgm.tv/group/topic/388766
// @version      0.1
// @description  移除所有 .card 元素
// @author       默沨
// @match        https://bangumi.tv/*
// @match        https://bgm.tv/*
// @match        https://chii.in/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function removeCards() {
    let cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      let parent = card.parentElement;
      let anchor = parent.querySelector("a[data-subject-id]");
      if (!anchor || !anchor.getAttribute("data-subject-id")) {
        card.parentNode.removeChild(card);
      }
    });
  }

  var observer = new MutationObserver(function (mutations) {
    removeCards();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
