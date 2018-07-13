// ==UserScript==
// @name         bangumi评论显示是否为好友
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.1
// @description  在主题下的评论高亮自己的好友的用户名, 本脚本功能依赖user_detail.user.js, 请先安装设置
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(blog|ep|character|person|(group|subject)\/topic|rakuen\/topic\/(ep|crt|group|subject|prsn))\/\d+(\?.*)?(#.*)?$/
// @grant        none
// ==/UserScript==

let localData = localStorage.getItem('bgm_user_detail_by_yonjar');
let user_detail = JSON.parse(localData);
let friends_list = user_detail.friends;

let commentUsers = document.querySelectorAll('#comment_list div.inner strong a');

commentUsers.forEach( e => {
    let userId = e.href.split('user/')[1];
    if(friends_list.includes(userId)){
        e.style.color = '#a9975b';
        e.style.border = 'solid 1px #ebd280';
    }
});