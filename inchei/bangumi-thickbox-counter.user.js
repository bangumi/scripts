// ==UserScript==
// @name         Bangumi Thickbox Counter
// @namespace    https://github.com/bangumi/scripts/tree/master/inchei
// @version      0.11
// @description  Counting the rest number of your words in thickbox
// @icon         https://bgm.tv/img/favicon.ico
// @author       inchei
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        none
// ==/UserScript==

(function() {
    function main(textarea, tip) {
        var TB = document.querySelectorAll(".thickbox");
        for (var i = 0; i < TB.length; i++) {
            TB[i].addEventListener("click", function() {
                textarea.onkeyup = function() {
                    var restNum = 200 - textarea.value.length;
                    if (restNum >= 0)
                        tip.innerText = "吐槽 (简评，剩余 " + restNum + " 字):";
                    else
                        tip.innerText = "吐槽 (简评，超出 " + -restNum + " 字):";
                }
            })
        }
    }
    var winHrefKey = new RegExp("^https?://((bgm|bangumi).tv|chii.in)/subject/*");

    if (!winHrefKey.test(window.location.href)) {
        for (i=0; i<20; i++) { //每隔 500 毫秒檢測 thickbox 是否加載完成，重複 10 秒
            setTimeout(function(){
                if (document.querySelector("#TB_iframeContent")) {
                    main(document.querySelector("#TB_iframeContent").contentWindow.document.querySelector("textarea#comment.quick"), document.querySelector("#TB_iframeContent").contentWindow.document.querySelector("[for='comment']"));
                }
            }, 500);
        }
    } else {
        main(document.querySelector("textarea#comment.quick"), document.querySelector("[for='comment']"));
    }
})();