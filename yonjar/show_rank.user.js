// ==UserScript==
// @name         bangumi收藏列表显示Rank
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.1
// @description  在用户的收藏列表下显示作品的排名并高亮显示 1000以内背景为绿色 1000~2000为蓝色 2000外为红色 没上榜的为黑色
// @author       Yonjar
// @match        http://bgm.tv/*/list/*
// @match        http://bangumi.tv/*/list/*
// @match        http://chii.in/*/list/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    #yonjar_bgm_userjs_rank_recommended{
        background-color: #3ed715;
    }

    #yonjar_bgm_userjs_rank_refuse{
        background-color: red;
    }

    #yonjar_bgm_userjs_rank_undefined{
        background-color: black;
    }
`);
let itemsList = document.querySelectorAll('#browserItemList .item h3>a.l');

itemsList.forEach( (elem, index) => {
    fetch(elem.href)
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
                rankSp.id = 'yonjar_bgm_userjs_rank_recommended';
            }
            else if (rankNum >= 2000) {
                rankSp.id = 'yonjar_bgm_userjs_rank_refuse';
            }
            else if (rankNum === 'undefined') {
                rankSp.id = 'yonjar_bgm_userjs_rank_undefined';
            }

            rankSp.innerHTML = `<small>Rank </small>${rankNum}`;

            document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rankSp, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);
        });
});
