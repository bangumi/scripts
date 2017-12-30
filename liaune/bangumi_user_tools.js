// ==UserScript==
// @name         Bangumi 用户个性化脚本
// @namespace    https://github.com/bangumi/scripts/liaune
// @description    “共同爱好对比”“动画推荐”“动画打分统计”
// @version      1.1
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/(user)\/.*/
// ==/UserScript==
(function() {
    const ID=window.location.href.split('/user/')[1];
    const You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    //两人共同爱好的对比展示 http://bgm.tv/group/topic/344128
    $("div[class='rr']").append("<a href='http://39.106.63.71/bgmtools/contrast/anime@"+ID+"&"+You+"' target='_blank' class='chiiBtn'><span>共同爱好对比</span></a>");

    //基于用户评分的针对性动画推荐工具 http://bgm.tv/group/topic/343652
    let URL='https://bgm.exz.me/user/'+ID;
    $("div[class='rr']").append("<a href="+URL+" target='_blank' class='chiiBtn'><span>动画推荐</span></a>");

    //动画打分统计 http://bgm.tv/group/topic/32536
    const $anime = $('#anime');
    if ($anime.length === 0) {
        return;
    }
    let URL2='http://netaba.re/profile/'+ID;
    const $button = $(`
<li>
<a href="`+URL2+`" target='_blank'>打分统计</a>
</li>`);
    $anime.find('.horizontalOptions ul').append($button);
})();
