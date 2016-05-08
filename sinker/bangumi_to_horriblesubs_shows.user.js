// ==UserScript==
// @name        Bangumi to Horriblesubs Shows
// @namespace   15cm
// @description Add link to horriblesubs shows for bangumi
// @include     *://bgm.tv/
// @include     http://bangumi.tv/
// @version     1
// @grant       none
// @require http://cdn.bootcss.com/jquery/2.2.0/jquery.min.js
// ==/UserScript==


this.$ = this.jQuery = jQuery.noConflict(true);
$('head').append('<style type="text/css">.roma_input{ margin-left: 5%; } .roma_btn{ margin-left: 2%; } .hs_link{ margin-left: 5%; }</style>');
var pair = JSON.parse(localStorage.getItem('bgm-id-name'));
if (!pair){pair = {};}
function save(){
    localStorage.setItem('bgm-id-name',JSON.stringify(pair));
}
// function addPair(id,name){
//     pair[id] = name;
//     localStorage.setItem('bgm-id-name',JSON.stringify(pair));
// }
$('div.epGird small[id="prgsPercentNum"]').each(function(){
    var percent = $(this);
    var latest = /\d+/.exec(percent.text())[0];
    console.log(latest);
    var prevPercent = percent.prev();
    var nextPercent = percent.next();
    var id = /\d+/.exec(prevPercent.attr('href'))[0]
    if(!pair[id]){
        prevPercent.attr('style','display: none');
        nextPercent.after(`<input id="roma_${id}" class="roma_input"/>`);
        let input = nextPercent.siblings('.roma_input');
        input.after(`<button id="btn_add_roma_${id}" class = "roma_btn">Add Roma</button>`);
        let btn = input.siblings('.roma_btn');
        btn.click(function(){
            pair[id] = input.val();
            save();
            btn.remove();
            input.remove();
            prevPercent.removeAttr('style');
            nextPercent.append(`<span class="hs_link"><a href="http://horriblesubs.info/shows/${pair[id]}?latest=${latest}" target="_blank" >HS</a></span>`);
        });
    }else{
        nextPercent.append(`<span class="hs_link"><a href="http://horriblesubs.info/shows/${pair[id]}?latest=${latest}" target="_blank" >HS</a></span>`);
    }
});
