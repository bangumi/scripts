// ==UserScript==
// @name         TinyGrail_New_Bangumi_Character_Update
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.1
// @description  小圣杯角色新番buff更新
// @author       Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)\/(character\/\d+)
// @grant        none
// ==/UserScript==
var api = 'https://tinygrail.com/api/';

var id = location.href.match(/character\/(\d+)/)[1];
var url = api + 'chara/update/' + id;
$('#headerSubject .subjectNav .navTabs') .append(`<li><a href="${url}" target='_blank'>更新小圣杯buff</a></li>`);
