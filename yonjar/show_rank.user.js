// ==UserScript==
// @name         bangumi收藏列表显示Rank
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.2
// @description  在用户的收藏列表下显示作品的排名并高亮显示 1000以内背景为绿色 1000~2000为蓝色 2000外为红色 没上榜的为黑色
// @author       Yonjar
// @match        bgm.tv/*/list/*
// @match        bangumi.tv/*/list/*
// @match        chii.in/*/list/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    .yonjar_bgm_userjs_rank_recommended{
        background-color: #3ed715!important;
    }

    .yonjar_bgm_userjs_rank_refuse{
        background-color: red!important;
    }

    .yonjar_bgm_userjs_rank_undefined{
        background-color: black!important;
    }

    .yonjar_bgm_userjs_rank_btn{
        display: inline-block;
        color: #666;
        text-shadow: 0px 1px 2px #FFF;
        text-decoration: none;
        line-height: 20px;
        margin: 0 5px 5px 0;
        padding: 0 12px;
        border: 1px solid #DDD;
        background: -webkit-gradient(linear,left top,left bottom,from(#FCFCFC),to(#F1F1F1));
        background: -moz-linear-gradient(top,#FCFCFC,#F1F1F1);
        background: -o-linear-gradient(top,#FCFCFC,#F1F1F1);
        -webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        -moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        -moz-border-radius: 4px;
        -webkit-border-radius: 4px;
        border-radius: 4px
    }
    .yonjar_bgm_userjs_rank_btn:hover {
        color: #FFF;
        text-shadow: none;
        background: #4F93CF;
        background: -moz-linear-gradient(top,#6BA6D8,#4F93CF);
        background: -o-linear-gradient(top,#6BA6D8,#4F93CF);
        background: -webkit-gradient(linear,left top,left bottom,from(#5FA3DB),to(#72B6E3));
        -webkit-box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1);
        -moz-box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1);
        box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1)
    }
`);
let itemsList = document.querySelectorAll('#browserItemList li.item');

function removeSelf(){
    this.parentNode.removeChild(this);
}

function showRank(href, index){
    fetch(href)
        .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
        .then(targetStr => {
            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : 'undefined';
            let rankSp = document.createElement('span');
            rankSp.className = 'rank';

            if (rankNum <= 1000) {
                rankSp.classList.add('yonjar_bgm_userjs_rank_recommended');
            }
            else if (rankNum >= 2000) {
                rankSp.classList.add('yonjar_bgm_userjs_rank_refuse');
            }
            else if (rankNum === 'undefined') {
                rankSp.classList.add('yonjar_bgm_userjs_rank_undefined');
            }

            rankSp.innerHTML = `<small>Rank </small>${rankNum}`;

            document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rankSp, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);
        });
}

itemsList.forEach( (elem, index) => {
    let href = elem.querySelector('a.subjectCover').href;
    let container = elem.querySelector('.inner ul.collectMenu') || elem.querySelector('.inner .collectBlock');
    let li = document.createElement('li');
    let showBtn = document.createElement('button');

    showBtn.addEventListener('click', showRank.bind(this, href, index), false);
    showBtn.addEventListener('click', removeSelf, false);
    showBtn.className = 'yonjar_bgm_userjs_rank_btn';
    showBtn.textContent = 'Rank';

    li.append(showBtn);
    container.append(li);
});
