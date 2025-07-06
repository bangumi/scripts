// ==UserScript==
// @name         移除动态评分
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  移除 card 中的 .rateInfo元素
// @author       默沨
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @match        https://bangumi.tv/user/*/timeline
// @match        https://bgm.tv/user/*/timeline
// @match        https://chii.in/user/*/timeline
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  function removeRateInfo() {
    document.querySelectorAll('.card .rateInfo').forEach(rateInfo => {
      rateInfo.remove();
    });
  }

  function debounce(func, delay) {
    let timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, arguments), delay);
    };
  }
  const debouncedRemove = debounce(removeRateInfo, 100);
  var observer = new MutationObserver(debouncedRemove);
  observer.observe(document.body, { childList: true, subtree: true });

  removeRateInfo();
})();
