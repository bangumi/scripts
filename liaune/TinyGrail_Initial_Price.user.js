// ==UserScript==
// @name         TinyGrail Initial Price
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.2.1
// @description  小圣杯显示角色发行价
// @author       Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(character|rakuen\/topic\/crt).*
// @grant        GM_addStyle
// ==/UserScript==
var api = 'https://tinygrail.com/api/';

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
if(document.location.href.match(/rakuen\/topic\/crt/)){
    setTimeout(function(){
        var charaId=document.location.pathname.split('crt/')[1];
        getData(`chara/charts/${charaId}/2019-08-08`, function (d, s) {
            if (d.State === 0) {
                var price = d.Value[0].Begin;
                price = parseFloat(price).toFixed(2);
                $('#grailBox .title .text').append(`<span>发行价：${price}</span>`);
            }
        });
    },1000);
}
else if(document.location.href.match(/character\/(\d+)/)){
    setTimeout(function(){
        var charaId=document.location.href.match(/character\/(\d+)/)[1];
        getData(`chara/charts/${charaId}/2019-08-09`, function (d, s) {
            if (d.State === 0) {
                var price = d.Value[0].Begin;
                price = parseFloat(price).toFixed(2);
                $('#grailBox .trade .value').append(`<span>发行价：${price}</span>`);
            }
        });
    },1000);
}
