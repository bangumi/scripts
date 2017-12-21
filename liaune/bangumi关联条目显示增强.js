// ==UserScript==
// @name         bangumi关联条目显示增强
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.0
// @description  显示条目页面关联条目的完成度
// @author       Liaune
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    GM_addStyle(`
.rank{
padding: 2px 5px 1px 5px;
background: #7AB2DC;
color: #FFF;
-webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-border-radius: 4px;
-webkit-border-radius: 4px;
border-radius: 4px
}
.rank_1{
padding: 2px 5px 1px 5px;
background: #3ed715;
color: #FFF;
-webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-border-radius: 4px;
-webkit-border-radius: 4px;
border-radius: 4px
}
.Collect{
-webkit-box-shadow: 0px 0px 2px 2px #ff0000;
-moz-box-shadow: 0px 0px 2px 2px #ff0000;
box-shadow: 0px 0px 2px 2px #ff0000;
border-color: red;
border-style: solid;
border-width:2px;
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
    /*    let charasList = document.querySelectorAll('#browserItemList li a.avatar');
    charasList.forEach( (elem, index) => {
        let href = elem.href;
        ShowCollectCharas(href,index);
    });
    function ShowCollectCharas(href,index){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/<a href="(\S+?)" class="break">取消收藏<\/a>/);
            let avatarNeue = document.querySelectorAll('#browserItemList li a.avatar')[index];
            if(Match){
                avatarNeue.style.color="blue";
            }
        });
    }
    let cvList = document.querySelectorAll('#browserItemList li span.tip_j');
    cvList.forEach( (elem, index) => {
        if(!elem.querySelector('a')) return;
        let href = elem.querySelector('a').href;
        ShowCollectcv(href,index);
    });
    function ShowCollectcv(href,index){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/<a href="(\S+?)" class="break">取消收藏<\/a>/);
            let cv=document.querySelectorAll('#browserItemList li span.tip_j')[index].querySelector('a');
            if(Match){
                cv.style.color="red";
            }
        });
    }
    */
    let itemsList = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li');
    itemsList.forEach( (elem, index) => {
        elem.style.height="150px";
        let href = elem.querySelector('a.avatar').href;
        ShowCollect(href,index);
    });
    let itemsList2 = document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li');
    itemsList2.forEach( (elem, index) => {
        elem.style.height="150px";
        elem.style.width="82px";
        let href = elem.querySelector('a').href;
        ShowCollect2(href,index);
    });
    function ShowCollect(href,index){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/<span class="interest_now">(\S+?)<\/span\>/);
            let avatarNeue = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li')[index].querySelector('span.avatarNeue');
            if(Match){
                avatarNeue.classList.add('Collect');
            }

            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : 'NULL';
            let rankSp = document.createElement('span');
            rankSp.className = 'rank';
            if (rankNum!='NULL') {
                if(rankNum<=1500) rankSp.classList.add('rank_1');
                else rankSp.classList.add('rank');
                rankSp.innerHTML = `<small>Rank </small>${rankNum}`;
            }
            else rankSp.style.display="none";

            document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li')[index].append(rankSp);
        });
    }
    function ShowCollect2(href,index){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/<span class="interest_now">(\S+?)<\/span\>/);
            let pictureFrameGroup = document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li')[index].querySelector('span.pictureFrameGroup');
            if(Match){
                pictureFrameGroup.classList.add('Collect');
            }

            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : 'NULL';
            let rankSp = document.createElement('span');
            rankSp.className = 'rank';
            if (rankNum!='NULL') {
                if(rankNum<=1500) rankSp.classList.add('rank_1');
                else rankSp.classList.add('rank');
                rankSp.innerHTML = `<small>Rank </small>${rankNum}`;
            }
            else rankSp.style.display="none";

            document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li')[index].append(rankSp);
        });
    }

})();