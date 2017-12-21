// ==UserScript==
// @name         bangumi收藏列表显示增强
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.2
// @description  在用户的收藏列表下显示作品的排名并高亮显示，显示站内评分和评分人数，显示好友评分和评分人数
// @author       Yonjar，Liaune
// @match        http://bgm.tv/*/list/*
// @match        http://bgm.tv/index/*
// @match        https://bgm.tv/index/*
// @match        http://bangumi.tv/*/list/*
// @match        http://chii.in/*/list/*
// @match        https://bgm.tv/*/list/*
// @match        https://bangumi.tv/*/list/*
// @match        https://chii.in/*/list/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle(`
.yonjar_bgm_userjs_rank_excellent{
background-color: #0033CC!important;
}
.yonjar_bgm_userjs_rank_recommended{
background-color: #3ed715!important;
}

.yonjar_bgm_userjs_rank_justsoso{
background-color: #FF6600!important;
}
.yonjar_bgm_userjs_rank_refuse{
background-color: red!important;
}

.yonjar_bgm_userjs_rank_undefined{
background-color: black!important;
}

.yonjar_bgm_userjs_vote_0{
background-color: rgba(11, 12, 12, 0.59)!important;
color:white;
}

.yonjar_bgm_userjs_vote_500{
background-color: rgba(128, 255, 255, 0.8)!important;
color:red;
}
.yonjar_bgm_userjs_vote_1000{
background-color: rgba(128, 144, 255, 0.8)!important;
color:white;
}
.yonjar_bgm_userjs_vote_2000{
background-color: rgba(209, 80, 205, 0.58)!important;
color:blue;
}
.yonjar_bgm_userjs_vote_4000{
background-color: rgba(250, 0, 0, 0.75)!important;
color:white;
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
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : 'NULL';
            let rankSp = document.createElement('span');
            rankSp.className = 'rank';
            if (rankNum <= 100) {
                rankSp.classList.add('yonjar_bgm_userjs_rank_excellent');
            }
            else if (rankNum <= 1000) {
                rankSp.classList.add('yonjar_bgm_userjs_rank_recommended');
            }
            else if (rankNum >= 3000) {
                rankSp.classList.add('yonjar_bgm_userjs_rank_refuse');
            }
            else if (rankNum >= 2000) {
                rankSp.classList.add('yonjar_bgm_userjs_rank_justsoso');
            }
            else if (rankNum === 'NULL') {
                rankSp.classList.add('yonjar_bgm_userjs_rank_undefined');
            }

            rankSp.innerHTML = `<small>Rank </small>${rankNum}`;

            document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rankSp, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);

            //显示站内评分和评分人数
            let Match1 = targetStr.match(/<span class="number" property="v:average">(\S+?)<\/span>/);
            let Point = Match1? parseFloat(Match1[1]) : 'NULL';
            let Point1 = Point? parseInt(Point) : 'NULL';

            let Match2 = targetStr.match(/<span property="v:votes">(\S+?)<\/span>/);
            let votes = Match2? parseInt(Match2[1]) : 'NULL';
            let rateInfo = document.createElement('p');
            rateInfo.setAttribute("class","rateInfo");
            let PointSm = document.createElement('small');
            PointSm.innerHTML = Point;
            PointSm.setAttribute("class","fade");
            let sstars = document.createElement('span');
            sstars.setAttribute("class","sstars"+ Point1+ " starsinfo");
            let tip_j = document.createElement('span');
            tip_j.setAttribute("class","tip_j");
            tip_j.innerHTML = "("+ votes +"人评分)";
            if(votes>=4000) tip_j.classList.add('yonjar_bgm_userjs_vote_4000');
            else if(votes>=2000) tip_j.classList.add('yonjar_bgm_userjs_vote_2000');
            else if(votes>=1000) tip_j.classList.add('yonjar_bgm_userjs_vote_1000');
            else if(votes>=500) tip_j.classList.add('yonjar_bgm_userjs_vote_500');
            if(votes<500) tip_j.classList.add('yonjar_bgm_userjs_vote_0');
            document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rateInfo, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);
            rateInfo.appendChild(sstars);
            rateInfo.appendChild(PointSm);
            rateInfo.appendChild(tip_j);
            //显示好友评分和评分人数
            let Match3 = targetStr.match(/<span class="num">(\S+?)<\/span>/);
            let Point3 = Match3? parseFloat(Match3[1]) : 'NULL';
            let Match4 = targetStr.match(/class="l">(\S+?) 人评分<\/a>/);
            let Votes3 = Match4? parseFloat(Match4[1]) : 'NULL';
            let Pointfr = document.createElement('small');
            Pointfr.innerHTML = "好友评分："+Point3+"　　"+Votes3+"人评分";
            Pointfr.setAttribute("class","fade");
            rateInfo.appendChild(Pointfr);

        });
    }

    itemsList.forEach( (elem, index) => {
        let href = elem.querySelector('a.subjectCover').href;
        //    let container = elem.querySelector('.inner ul.collectMenu') || elem.querySelector('.inner .collectBlock');
        //    let li = document.createElement('li');
        //    let showBtn = document.createElement('button');
        showRank(href,index);
        //    showBtn.addEventListener('click', showRank.bind(this, href, index), false);
        //    showBtn.addEventListener('click', removeSelf, false);
        //    showBtn.className = 'yonjar_bgm_userjs_rank_btn';
        //    showBtn.textContent = 'Rank';
        //    li.append(showBtn);
        //    container.append(li);
    });
})();