// ==UserScript==
// @name         Bangumi Thickbox Counter
// @namespace    https://github.com/bangumi/scripts/tree/master/inchei
// @version      0.1
// @description  Counting the rest number of your words in thickbox
// @icon         https://bgm.tv/img/favicon.ico
// @author       inchei
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        none
// ==/UserScript==

(function() {
    var TB = document.querySelectorAll(".thickbox");
    for (var i = 0; i < TB.length; i++) {
        TB[i].addEventListener("click", function() {
            var textarea = document.querySelector("div.collectBox textarea.quick");
            textarea.onkeyup = function() {
                var restNum = 200 - textarea.value.length;
                if (restNum >= 0)
                    document.querySelector("[for='comment']").innerText = "吐槽 (简评，剩余 " + restNum + " 字):";
                else
                    document.querySelector("[for='comment']").innerText = "吐槽 (简评，超出 " + -restNum + " 字):";
            }
        })
    }
})();