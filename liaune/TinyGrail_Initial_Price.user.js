// ==UserScript==
// @name         TinyGrail Initial Price
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.1
// @description  小圣杯显示角色发行价
// @author       Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(rakuen\/topic\/crt).*
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    var api = 'https://www.tinygrail.com/api/';

    function getData(url, callback) {
        if (!url.startsWith('http'))
            url = api + url;
        $.ajax({
            url: url,
            type: 'GET',
            xhrFields: { withCredentials: true },
            success: callback
        });
    }

    setTimeout(function(){
        var charaId=document.location.pathname.split('crt/')[1];
        getData(`chara/charts/${charaId}/2019-08-09`, function (d, s) {
            if (d.State === 0) {
                var price = d.Value[0].Begin;
                price = parseFloat(price).toFixed(2);
                $('#grailBox .title .text').append(`<span>发行价：${price}</span>`);
            }
        });
    },1000);
});
