// ==UserScript==
// @name         wiki helper
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1
// @description  个人自用wiki助手
// @require      https://unpkg.com/wanakana@4.0.2/umd/wanakana.min.js
// @author       Yonjar
// @match        https://bgm.tv/person/new
// @grant        none
// ==/UserScript==

(function() {
  "use strict";

  let kana_input = document.querySelector(
    "#infobox_normal > input:nth-child(18)"
  );
  let romaji_input = document.querySelector(
    "#infobox_normal > input:nth-child(22)"
  );

  function firstUpperCase(str) {
    return str.toLowerCase().replace(/( |^)[a-z]/g, L => L.toUpperCase());
  }

  kana_input.addEventListener("blur", () => {
    romaji_input.value = firstUpperCase(wanakana.toRomaji(kana_input.value));
  });

  //   人物简介
  let textarea = document.querySelector("#crt_summary");

  let parameters = [
    {
      regx: /\[\d+\]/g,
      substitute: ""
    }
  ];

  textarea.addEventListener("blur", () => {
    for (let a of parameters) {
      textarea.value = textarea.value.replace(a.regx, a.substitute);
    }
  });
})();
