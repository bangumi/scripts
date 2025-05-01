// ==UserScript==
// @name         移除动态评分
// @namespace    https://bgm.tv/group/topic/388766
// @version      0.1
// @description  移除所有 .rateInfo元素
// @author       默沨
// @match        https://bangumi.tv/*
// @match        https://bgm.tv/*
// @match        https://chii.in/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function removeRateInfo() {
    let cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      rateInfo.parentNode.removeChild(rateInfo);
    });
  }

  var observer = new MutationObserver(function (mutations) {
    removeRateInfo();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
