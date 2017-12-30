// ==UserScript==
// @name         bangumi关联条目显示增强
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.4.3
// @description  显示条目页面关联条目的完成情况
// @author       Liaune
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    GM_addStyle(`
.rank{
padding: 2px 5px 1px 5px;
background: #b4b020;
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
background: #15d7b3;
color: #FFF;
-webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-border-radius: 4px;
-webkit-border-radius: 4px;
border-radius: 4px
}
.wish{
border-color: #fd59a9;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.collect{
border-color: #3838e6;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.do{
border-color: #15d748;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.on_hold{
border-color: #f6af45;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.dropped{
border-color: #5a5855;
border-style: solid;
border-width:2px;
border-radius: 4px
}

`);
    let update=0,count=0;
    const itemsList = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li');
    const itemsList2 = document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li');
    const TotalItems=itemsList.length + itemsList2.length;

    //修改柱状图高度
    let votes_subject = document.querySelectorAll('.horizontalChart li a .count');
    let vote_subject = new Array(); for(i=0;i<votes_subject.length;i++) vote_subject[i]=votes_subject[i].textContent.match(/\d+/)?votes_subject[i].textContent.match(/\d+/)[0]:0;
    let largest=0; for(i=0;i<vote_subject.length;i++) {if(parseInt(vote_subject[i])>largest) largest=parseInt(vote_subject[i]);}
    for(i=0;i<votes_subject.length;i++){height=parseFloat(parseInt(vote_subject[i])/largest*100).toFixed(2).toString(); votes_subject[i].style.height=height+'%';}

    //更新缓存数据
    const showBtn = document.createElement('a');
    showBtn.addEventListener('click', Update);
    showBtn.className = 'chiiBtn';
    showBtn.href='javascript:;';
    showBtn.textContent = '更新';

    GetInfo(update);

    function Update(){
        count=0;
        update=1;
        GetInfo(update);
    }

    function GetInfo(update){

        itemsList.forEach( (elem, index) => {
            elem.style.height="150px";
            let href = elem.querySelector('a.avatar').href;
            let href1 = href.replace(/subject/,"update");
            let ID = href.split('/subject/')[1];
            if(localStorage.getItem(ID+'Votes') && !update)
                DisplayRank(localStorage.getItem(ID+'Rank'),index,1);
            else ShowRank(href,index,1);
            if(localStorage.getItem(ID+'Interest') && !update)
                DisplayCollect(localStorage.getItem(ID+'Interest'),index,1);
            else if(localStorage.getItem(ID+'Votes')>20 || !localStorage.getItem(ID+'Votes')) ShowCollect(href1,index,1);
        });

        itemsList2.forEach( (elem, index) => {
            elem.style.height="150px";
            elem.style.width="82px";
            let href = elem.querySelector('a').href;
            let href1 = href.replace(/subject/,"update");
            let ID = href.split('/subject/')[1];
            if(localStorage.getItem(ID+'Votes') && !update)
                DisplayRank(localStorage.getItem(ID+'Rank'),index,0);
            else ShowRank(href,index,0);
            if(localStorage.getItem(ID+'Interest') && !update)
                DisplayCollect(localStorage.getItem(ID+'Interest'),index,0);
            else if(localStorage.getItem(ID+'Votes')>20 || !localStorage.getItem(ID+'Votes')) ShowCollect(href1,index,0);

        });
    }

    function ShowCollect(href,index,args){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/"GenInterestBox\('(\S+?)'\)" checked="checked"/);
            let interest = Match ? Match[1] : null;
            let ID = href.split('/update/')[1];
            if(Match)  localStorage.setItem(ID+'Interest',interest);
            if(!update) DisplayCollect(interest,index,args);
            else{
                count+=1;
                showBtn.textContent='更新中... (' + count + '/' + TotalItems +')';
                if(count==TotalItems){ location.reload(); showBtn4.textContent='更新完毕！';}
            }
        });
    }

    function DisplayCollect(interest,index,args){
        let avatarNeue,pictureFrameGroup;
        if(args) avatarNeue = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li')[index].querySelector('span.avatarNeue');
        else pictureFrameGroup = document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li')[index].querySelector('span.pictureFrameGroup');
        if(interest=='wish'){
            if(args) avatarNeue.classList.add('wish');
            else pictureFrameGroup.classList.add('wish');
        }
        else if(interest=='collect'){
            if(args) avatarNeue.classList.add('collect');
            else pictureFrameGroup.classList.add('collect');
        }
        else if(interest=='do'){
            if(args) avatarNeue.classList.add('do');
            else pictureFrameGroup.classList.add('do');
        }
        else if(interest=='on_hold'){
            if(args) avatarNeue.classList.add('on_hold');
            else pictureFrameGroup.classList.add('on_hold');
        }
        else if(interest=='dropped'){
            if(args) avatarNeue.classList.add('dropped');
            else pictureFrameGroup.classList.add('dropped');
        }
    }

    function ShowRank(href,index,args){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : null;
            let ID = href.split('/subject/')[1];
            if(canMatch)  localStorage.setItem(ID+'Rank',rankNum);

            let Match2 = targetStr.match(/<span property="v:votes">(\S+?)<\/span>/);
            let votes = Match2? parseInt(Match2[1]) : null;
            if(Match2)  localStorage.setItem(ID+'Votes',votes);

            if(!update) DisplayRank(rankNum,index,args);
            else{
                showBtn.textContent='更新中... (' + count + '/' + TotalItems +')';
                if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}
            }
        });
    }

    function DisplayRank(rankNum,index,args){
        let rankSp = document.createElement('span');
        rankSp.className = 'rank';
        if (rankNum) {
            if(rankNum<=1500) rankSp.classList.add('rank_1');
            else rankSp.classList.add('rank');
            rankSp.innerHTML = `<small>Rank </small>${rankNum}`;
        }
        else rankSp.style.display="none";

        if(args)  document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li')[index].append(rankSp);
        else document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li')[index].append(rankSp);
        count+=1;
        if(count==TotalItems && document.querySelector('#columnSubjectHomeB .subject_section .clearit'))
            document.querySelector('#columnSubjectHomeB .subject_section .clearit').append(showBtn);
    }

})();

