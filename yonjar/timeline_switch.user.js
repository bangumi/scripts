// ==UserScript==
// @name         bgm timeline switch
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.3
// @description  bgm 好友动态&全站动态切换
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(timeline)?$/
// @grant        none
// ==/UserScript==

let container = document.querySelector("#timelineTabs");
let btn = document.createElement("li");
let switchFunc = function() {
    let timelineContainer = document.querySelector("#timeline ul");

    fetch(location.origin + "/timeline", { credentials: "omit" })
        .then(resp => resp.text())
        .then(html => {
            let outer = html.match(/<ul>[\s\S]*?<\/ul>/)[0];
            timelineContainer.outerHTML = outer;
        });

    document.querySelector("#tmlPager").innerHTML = "";
};

btn.innerHTML = '<a href="javascript:void(0)">看全站动态</a>';
btn.addEventListener("click", switchFunc, false);
container.appendChild(btn);
switchFunc();
