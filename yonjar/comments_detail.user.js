// ==UserScript==
// @name         bangumi评论统计
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.2
// @description  显示某主题下的评论情况 有多少用户发表过评论 自己是否评论过 鼠标移到id上查看评论次数
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(blog|ep|character|person|(group|subject)\/topic|rakuen\/topic\/(ep|crt|group|subject|prsn))\/\d+(\?.*)?(#.*)?$/
// @grant        none
// ==/UserScript==

let myName = document.querySelector('#new_comment .reply_author a').textContent;
let commentUsers = document.querySelectorAll('#comment_list div.inner strong a');
let usersObj = {};

for (let elem of commentUsers){
    let username = elem.textContent;
    if (!(username in usersObj)) {
        usersObj[username] = 0;
    }
    usersObj[username]++;
}

for (let elem of commentUsers){
    elem.setAttribute('title', `${elem.textContent === myName ? '您' : elem.textContent}在该主题评论了${usersObj[elem.textContent]}次`);
}

let getLength = (obj) => {
    let count = 0;
    for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
            count++;
        }
    }
    return count;
};

let robotWork = (status, time) => {
    if (status) {
        window.top.chiiLib.ukagaka.presentSpeech(`<p>当前主题下共有${getLength(usersObj)}位用户参与评论 ${ myName in usersObj ? '您已评论过了哦' : '您尚未评论哦'}</p>`);
        return;
    }
    window.top.chiiLib.ukagaka.toggleDisplay();
    window.top.chiiLib.ukagaka.presentSpeech(`<p>当前主题下共有${getLength(usersObj)}位用户参与评论 ${ myName in usersObj ? '您已评论过了哦' : '您尚未评论哦'}</p><p>(本提醒将在${time}秒后关闭)</p>`);
    setTimeout(function () {
        window.top.chiiLib.ukagaka.toggleDisplay();
    }, time*1000);
};

let isRobotDisplay = window.top.document.querySelector('#showrobot').textContent !== '显示春菜 ▲';
robotWork(isRobotDisplay, 5);