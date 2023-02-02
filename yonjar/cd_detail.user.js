// ==UserScript==
// @name         cd detail
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Yonjar
// @match        https://sakurazaka46.com/s/s46/discography/*
// @match        https://www.nogizaka46.com/s/n46/discography/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sakurazaka46.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  const getText = function (selector) {
    let e = document.querySelector(selector);
    return e.textContent;
  };

  // Your code here...
  const sakurazaka = function () {
    const TITLE = getText("h3.title").replace(/【\S+】/g, "");
    const TYPE = getText("p.type");
    const DATE = getText("p.date").replace(/\./g, "-");
    const ARTIST = "櫻坂46";
    const LYRICIST = "秋元康";
    const INFO = document
      .querySelector("div.free-txt.block-list > ul:nth-child(2) li")
      .innerHTML.split("<br>")[0];

    const DETAIL = {
      TITLE,
      TYPE,
      DATE,
      ARTIST,
      INFO,
      LYRICIST,
    };

    console.log(JSON.stringify(DETAIL));
    prompt("CTRL+C", JSON.stringify(DETAIL));
    // return JSON.stringify(DETAIL);
  };

  const nogizaka = function () {
    const TITLE = getText("#js-cont > main > header > div > h1");
    const TYPE =
      getText("p.js-apidiscodetail-cat") === "シングル"
        ? "Single"
        : getText("p.js-apidiscodetail-cat") === "アルバム"
        ? "Album"
        : "";
    const DATE = getText("p.js-apidiscodetail-date").replace(/\./g, "-");
    const PRICE = getText("p.js-apidiscodetail-num").match(
      /¥[\d,]+ \(税込\)/
    )[0];
    const ARTIST = "乃木坂46";
    const LYRICIST = "秋元康";
    const INFO = document
      .querySelector(
        "#js-cont > main > div.dd--ct > div.dd--de > div > div.dd--edit"
      )
      .innerHTML.split("<br>")[0];

    const DETAIL = {
      TITLE,
      TYPE,
      DATE,
      ARTIST,
      INFO,
      LYRICIST,
      PRICE,
    };

    console.log(JSON.stringify(DETAIL));
    prompt("CTRL+C", JSON.stringify(DETAIL));
    // return JSON.stringify(DETAIL);
  };

  // 櫻坂46
  if (/sakurazaka/.test(location.href)) {
    document
      .querySelector("h3.title")
      .addEventListener("click", sakurazaka, false);
  }

  // 乃木坂46
  if (/nogizaka/.test(location.href)) {
    document
      .querySelector("#js-cont > main > header > div > h1")
      .addEventListener("click", nogizaka, false);
  }
})();
