// ==UserScript==
// @name         修改卡片标题和副标题
// @namespace    https://bgm.tv/group/topic/388766
// @version      0.3
// @description  交换所有 .card 元素中的 .title 和 .subtitle 文本
// @author       默沨
// @match        https://bangumi.tv/*
// @match        https://bgm.tv/*
// @match        https://chii.in/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const style = document.createElement("style");

  style.innerHTML = `
        #timeline ul li .card .inner .title small.grey {
            display: block;
        }
        #timeline ul li .card.card_tiny .inner .title small.grey {
            display: none;
        }
        #timeline ul li .card.card_tiny:hover .inner .title small.grey {
            display: inline;
        }
        #timeline ul li .card.card_tiny:hover .inner .title small.grey {
            display: block;
        }
        #timeline ul li.tml_item .card.card_tiny {
            max-height: unset;
        }
        #timeline ul li.tml_item .card.card_tiny .info {
            display: none;
        }
        #timeline ul li.tml_item .card.card_tiny:hover .info {
            display: block;
        }
    `;

  document.getElementsByTagName("head")[0].appendChild(style);

  function swapTitlesAndSubtitles() {
    const cardElements = document.querySelectorAll(".card:not([data-swapped])");

    cardElements.forEach((card) => {
      const titleElement = card.querySelector(".title");
      const subtitleElement = titleElement.querySelector(".subtitle");

      if (titleElement && subtitleElement) {
        const linkElement = titleElement.querySelector("a");

        if (linkElement) {
          const linkHref = linkElement.getAttribute("href");
          const fullTitleText = linkElement.textContent.trim();
          const subtitleText = subtitleElement.textContent.trim();

          if (subtitleText === "") {
            card.setAttribute("data-swapped", "true");
          } else {
            const pureTitleText = fullTitleText.replace(subtitleText, "").trim();

            linkElement.innerHTML = `${subtitleText} <small class="grey">${pureTitleText}</small>`;

            card.setAttribute("data-swapped", "true");
          }
        }
      }
    });
  }

  swapTitlesAndSubtitles();

  const observer = new MutationObserver(function (mutations) {
    swapTitlesAndSubtitles();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
