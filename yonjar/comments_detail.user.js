// ==UserScript==
// @name         bangumi评论统计
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.5
// @description  显示某主题下的评论情况 有多少用户发表过评论 自己是否评论过 鼠标移到id上查看评论次数
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(blog|ep|character|person|(group|subject)\/topic|rakuen\/topic\/(ep|crt|group|subject|prsn))\/\d+(\?.*)?(#.*)?$/
// @grant        none
// ==/UserScript==

class commentDetail {
    constructor() {
        this.usersMap = new Map();
        this.myName = window.top.document.querySelector('#dock > div > ul > li.first > a');
        this.commentList = document.querySelector('#comment_list');
        this.commentUsers = document.querySelectorAll('#comment_list div.inner strong a');
    }

    get count() {
        return this.usersMap.size;
    }

    init () {
        for (let elem of this.commentUsers){
            let username = elem.textContent;
            if (!this.usersMap.has(username)) {
                this.usersMap.set(username, 0);
            }
            this.usersMap.set(username, this.usersMap.get(username)+1);
        }

        this.commentList.addEventListener('mouseover', (e) => {
            let elem = e.target;
            if (elem.tagName.toUpperCase() === 'A' &&
                elem.classList.contains('l') &&
                elem.parentNode.tagName.toUpperCase() === 'STRONG') {
                elem.setAttribute('title', `${elem.textContent === this.myName ? '您' : elem.textContent}在该主题评论了${this.usersMap.get(elem.textContent)}次`);
            }
        }, false);
    }

    robotWork (time) {
        let status = window.top.document.querySelector('#showrobot').textContent !== '显示春菜 ▲';
        if (status) {
            window.top.chiiLib.ukagaka.presentSpeech(`<p>当前主题下共有${this.count}位用户参与评论 ${ this.usersMap.has(this.myName) ? '您已评论过了哦' : '您尚未评论哦'}</p>`);
            return;
        }
        window.top.chiiLib.ukagaka.toggleDisplay();
        window.top.chiiLib.ukagaka.presentSpeech(`<p>当前主题下共有${this.count}位用户参与评论 ${ this.usersMap.has(this.myName) ? '您已评论过了哦' : '您尚未评论哦'}</p><p>(本提醒将在${time}秒后关闭)</p>`);
        setTimeout(function () {
            window.top.chiiLib.ukagaka.toggleDisplay();
        }, time*1000);
    }
}



let main = () => {
    let cd = new commentDetail();
    cd.init();
    cd.robotWork(5);
};

main();