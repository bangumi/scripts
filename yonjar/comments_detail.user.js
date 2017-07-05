// ==UserScript==
// @name         bangumi评论统计
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.1
// @description  显示某主题下的评论情况 有多少用户发表过评论 自己是否评论过 鼠标移到id上查看评论次数
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(ep|character|person|(group|subject)\/topic|rakuen\/topic\/(ep|crt|group|subject|prsn))\/\d+(\?.*)?(#.*)?$/
// @grant        none
// ==/UserScript==

let title = document.querySelector('#pageHeader') || document.querySelector('h2.title') || document.querySelector('#headerSubject h1.nameSingle') || document.querySelector('#header');
let myName = document.querySelector('#new_comment .reply_author a').textContent;
let commentUsers = document.querySelectorAll('#comment_list div.inner strong a');
let usersObj = {};

commentUsers.forEach((elem) => {
    let username = elem.textContent;
    if (!(username in usersObj)) {
        usersObj[username] = 0;
    }
    usersObj[username]++;
});

commentUsers.forEach((elem) => {
    elem.setAttribute('title', `此用户在该主题评论了${usersObj[elem.textContent]}次`);
});

let getLength = (obj) => {
    let count = 0;
    for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
            count++;
        }
    }
    return count;
};

title.innerHTML = `<span class="tip_j rr">(当前主题下共有${getLength(usersObj)}位用户参与评论 ${ myName in usersObj ? '您已评论过' : '您尚未评论'})</span>${title.innerHTML}`;
