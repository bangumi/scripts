// ==UserScript==
// @name         Bangumi Moveable Thickbox
// @namespace    https://github.com/bangumi/scripts/inchei
// @version      1.0.1
// @description  使bangumi的thickbnox可移动
// @author       inchei
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant       GM_addStyle
// @require https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
// @require https://cdn.bootcss.com/jqueryui/1.12.1/jquery-ui.min.js
// ==/UserScript==
GM_addStyle( `
    #TB_title {
        cursor: move;
        transition: all 0 ease 0;
        -webkit-transition: all 0 ease 0;
    }
` );
(function() {
    var TB = document.querySelectorAll(".thickbox");
    var winHref = window.location.href;
    var winHrefKey = new RegExp("^https?://((bgm|bangumi).tv|chii.in)/(.*(wish|collect|do|on_hold|dropped|works))?$");
    for (var i = 0; i < TB.length; i++) {
        TB[i].addEventListener("click", function() {
            if (winHrefKey.test(winHref))
                $("#TB_window").draggable();
            else {
                var params = {
                    left: 0,
                    top: 0,
                    currentX: 0,
                    currentY: 0,
                    flag: false
                };
                var getCss = function(o, key) {
                    return o.currentStyle ? o.currentStyle[key] : document.defaultView.getComputedStyle(o, false)[key];
                };
                var startDrag = function(bar, target) {
                    if (getCss(target, "left") !== "auto") {
                        params.left = getCss(target, "left");
                    }
                    if (getCss(target, "top") !== "auto") {
                        params.top = getCss(target, "top");
                    }
                    bar.onmousedown = function(event) {
                        params.flag = true;
                        if (!event) {
                            event = window.event;
                            bar.onselectstart = function() {
                                return false;
                            };
                        }
                        var e = event;
                        params.currentX = e.clientX;
                        params.currentY = e.clientY;
                    };
                    document.onmouseup = function() {
                        params.flag = false;
                        if (getCss(target, "left") !== "auto") {
                            params.left = getCss(target, "left");
                        }
                        if (getCss(target, "top") !== "auto") {
                            params.top = getCss(target, "top");
                        }
                    };
                    document.onmousemove = function(event) {
                        var e = event ? event : window.event;
                        if (params.flag) {
                            var nowX = e.clientX,
                                nowY = e.clientY;
                            var disX = nowX - params.currentX,
                                disY = nowY - params.currentY;
                            target.style.left = parseInt(params.left) + disX + "px";
                            target.style.top = parseInt(params.top) + disY + "px";
                            if (event.preventDefault) {
                                event.preventDefault();
                            }
                            return false;
                        }
                    };
                };
                var oBox = document.getElementById("TB_window");
                var oBar = document.getElementById("TB_title");
                startDrag(oBar, oBox);
            }
        });

    }
})();