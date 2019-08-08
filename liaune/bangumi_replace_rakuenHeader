// ==UserScript==
// @name         替换超展开顶部菜单
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.0
// @description  替换超展开顶部菜单，缩小超展开左侧宽度
// @author       Liaune
// @include        /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/rakuen
// @grant        none
// ==/UserScript==

(function() {
    $('#listFrameWrapper').css({"width":"30%"});
    $('#contentFrameWrapper').css({"width":"70%"});
    let xhr = new XMLHttpRequest();
    xhr.open( "GET", document.location.origin );
    xhr.onabort = xhr.onabort = xhr.onerror = function(){ clearTimeout(1000); };
    xhr.onload = function(){ processPage( xhr.responseXML ); };
    xhr.responseType = "document";
    xhr.send();

    function processPage( newDoc ){
        $('#rakuenHeader').hide();
        //document.querySelector('body').insertBefore(newDoc.querySelector('#headerNeue2'),document.querySelector('#rakuenHeader'));
        $(newDoc.querySelector('#headerNeue2')).insertAfter($('#rakuenHeader'));
    }
})();
