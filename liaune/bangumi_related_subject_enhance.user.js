// ==UserScript==
// @name         Bangumi Related Subject Enhance
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.5.1
// @description  显示条目页面关联条目的收藏情况,显示关联条目的排名，单行本设为全部已读/取消全部已读
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
.relate_wish{
border-color: #fd59a9;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_collect{
border-color: #3838e6;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_do{
border-color: #15d748;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_on_hold{
border-color: #f6af45;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_dropped{
border-color: #5a5855;
border-style: solid;
border-width:2px;
border-radius: 4px
}

.subCheckIn{
display:block;
top: -20px;
left: 5px;
opacity: 0.5;
position: relative;
padding: 0 2px;
width: 16px;
height: 18px;
background: no-repeat url(/img/ico/ico_eye.png) 50% top;
}

`);
    let collectStatus;
    let itemsList = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li');
    let itemsList2 = document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li');
    let itemsList3 = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverSmall li');
    let TotalItems=itemsList.length + itemsList2.length;
    if(localStorage.getItem('bangumi_subject_collectStatus'))
        collectStatus = JSON.parse(localStorage.getItem('bangumi_subject_collectStatus'));
    else
        collectStatus = {};
    let securitycode;
    let badgeUserPanel=document.querySelectorAll('#badgeUserPanel a');
    badgeUserPanel.forEach( (elem, index) => {
        if(elem.href.match(/logout/))
            securitycode = elem.href.split('/logout/')[1].toString();
    });

    //更新缓存数据
    const showBtn = document.createElement('a');
    showBtn.addEventListener('click', Update);
    showBtn.className = 'chiiBtn';
    showBtn.href='javascript:;';
    showBtn.textContent = '更新';
    if(itemsList3.length)
        document.querySelectorAll('#columnSubjectHomeB .subject_section .clearit')[1].append(showBtn);
    else
        document.querySelectorAll('#columnSubjectHomeB .subject_section .clearit')[0].append(showBtn);

    let update=0,count=0;
    GetInfo(update);
    function Update(){
        count=0;
        update=1;
        GetInfo(update);
    }
    let privacy;
    let privatebox = document.createElement('a');
    privatebox.textContent = '私密';
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    privatebox.appendChild(checkbox);
    if(itemsList3.length)
        $(privatebox).insertAfter(document.querySelectorAll('#columnSubjectHomeB .subject_section .subtitle')[1]);
    checkbox.onclick = function (){
        if (checkbox.checked) privacy = 1;
        else privacy = 0;
    };
    const allCollect = document.createElement('a');
    allCollect.className = 'chiiBtn';
    allCollect.href='javascript:;';
    allCollect.textContent = '全部标为已读';
    let flag = 0;
    allCollect.onclick = function (){
        let i = 0;
        flag = (flag==1)?0:1;
        allCollect.textContent =(flag==1)? '全部取消已读':'全部标为已读';
        let getitemsList3= setInterval(function(){
            let elem = itemsList3[i];
            let href = elem.querySelector('a.avatar').href;
            let ID = href.split('/subject/')[1];
            let avatarNeue = elem.querySelector('span.avatarNeue');
            if(flag){
                collectStatus[ID] = 'collect';
                avatarNeue.classList.add('collect');
                $.post('/subject/' + ID + '/interest/update?gh=' + securitycode, { status: 'collect',privacy:privacy});
            }
            else{
                delete collectStatus[ID];
                avatarNeue.classList.remove('collect');
                $.post('/subject/' + ID + '/remove?gh=' + securitycode);
            }
            localStorage.setItem('bangumi_subject_collectStatus',JSON.stringify(collectStatus));
            i++;
            if(i >= itemsList3.length){
                clearInterval(getitemsList3);
            }
        },300);
    };
    if(itemsList3.length)
        $(allCollect).insertAfter(document.querySelectorAll('#columnSubjectHomeB .subject_section .subtitle')[1]);

    function ShowCheckIn(elem,ID){
        let checkIn = document.createElement('a');
        checkIn.className = 'subCheckIn';
        checkIn.href='javascript:;';
        checkIn.addEventListener('click', function(){
            checkIn.style.backgroundPosition= "bottom left";
            let avatarNeue = elem.querySelector('span.avatarNeue');
            avatarNeue.classList.add('collect');
            collectStatus[ID] = 'collect';
            localStorage.setItem('bangumi_subject_collectStatus',JSON.stringify(collectStatus));
            $.post('/subject/' + ID + '/interest/update?gh=' + securitycode, { status: 'collect',privacy:privacy});
        });
        elem.querySelector('a.avatar').append(checkIn);
    }

    function GetInfo(update){
        itemsList.forEach( (elem, index) => {
            elem.style.height="150px";
        });
        itemsList2.forEach( (elem, index) => {
            elem.style.height="150px";
            //elem.style.width="82px";
        });
        if(itemsList.length){
            let i = 0;
            let getitemsList= setInterval(function(){
                let elem = itemsList[i];
                let index = i;
                let href = elem.querySelector('a.avatar').href;
                let href1 = href.replace(/subject/,"update");
                let ID = href.split('/subject/')[1];
                if(localStorage.getItem('Subject'+ID+'Status') && !update){
                    let info = JSON.parse(localStorage.getItem('Subject'+ID+'Status'));
                    DisplayRank(info.rankNum,index,1);
                }
                else ShowRank(href,index,1);
                if(collectStatus[ID]!='collect')
                    ShowCheckIn(elem,ID);
                if(collectStatus[ID] && !update)
                    DisplayCollect(collectStatus[ID],index,1);
                else ShowCollect(href1,index,1);
                i++;
                if(i >= itemsList.length){
                    clearInterval(getitemsList);
                }
            },300);}
        if(itemsList2.length){
            let j = 0;
            let getitemsList2= setInterval(function(){
                let elem = itemsList2[j];
                let index = j;
                let href = elem.querySelector('a').href;
                let href1 = href.replace(/subject/,"update");
                let ID = href.split('/subject/')[1];
                if(localStorage.getItem('Subject'+ID+'Status') && !update){
                    let info = JSON.parse(localStorage.getItem('Subject'+ID+'Status'));
                    DisplayRank(info.rankNum,index,0);
                }
                else ShowRank(href,index,0);
                if(collectStatus[ID]!='collect')
                    ShowCheckIn(elem,ID);
                if(collectStatus[ID] && !update)
                    DisplayCollect(collectStatus[ID],index,0);
                else  ShowCollect(href1,index,0);
                j++;
                if(j >= itemsList2.length){
                    clearInterval(getitemsList2);
                }
            },300)
            }
        itemsList3.forEach( (elem, index) => {
            let href = elem.querySelector('a').href;
            let ID = href.split('/subject/')[1];
            if(collectStatus[ID])
                DisplayCollect(collectStatus[ID],index,2);
            else if(collectStatus[ID]!='collect')
                ShowCheckIn(elem,ID);
        });

        let thisItem = window.location.href.replace(/subject/,"update");
        fetch(thisItem,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/"GenInterestBox\('(\S+?)'\)" checked="checked"/);
            let interest = Match ? Match[1] : null;
            let ID = thisItem.split('/update/')[1];
            if(interest) collectStatus[ID] = interest;
            else if(collectStatus[ID]) delete collectStatus[ID];
            localStorage.setItem('bangumi_subject_collectStatus',JSON.stringify(collectStatus));
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
            if(Match){
                collectStatus[ID] = 'collect';
                localStorage.setItem('bangumi_subject_collectStatus',JSON.stringify(collectStatus));
            }
            if(!update) DisplayCollect(interest,index,args);
            else{
                count+=1;
                showBtn.textContent='更新中... (' + count + '/' + TotalItems +')';
                if(count==TotalItems){ location.reload(); showBtn.textContent='更新完毕！';}
            }
        });
    }

    function DisplayCollect(interest,index,args){
        let avatarNeue;
        if(args==0)
            avatarNeue = document.querySelectorAll('#columnSubjectHomeB  ul.coversSmall li')[index].querySelector('span.avatarNeue');
        else if(args==1)
            avatarNeue= document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverMedium li')[index].querySelector('span.avatarNeue');
        else if(args==2)
            avatarNeue = document.querySelectorAll('#columnSubjectHomeB  ul.browserCoverSmall li')[index].querySelector('span.avatarNeue');
        if(interest=='wish'){
            avatarNeue.classList.add('relate_wish');
        }
        else if(interest=='collect'){
            avatarNeue.classList.add('relate_collect');
        }
        else if(interest=='do'){
            avatarNeue.classList.add('relate_do');
        }
        else if(interest=='on_hold'){
            avatarNeue.classList.add('relate_on_hold');
        }
        else if(interest=='dropped'){
            avatarNeue.classList.add('relate_dropped');
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
            let ID = href.split('/subject/')[1];
            //获取排名
            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : null;

            //获取站内评分和评分人数
            let Match1 = targetStr.match(/<span class="number" property="v:average">(\S+?)<\/span>/);
            let Point = Match1? parseFloat(Match1[1]) : null;

            let Match2 = targetStr.match(/<span property="v:votes">(\S+?)<\/span>/);
            let votes = Match2? parseInt(Match2[1]) : null;

            //获取好友评分和评分人数
            let Match3 = targetStr.match(/<span class="num">(\S+?)<\/span>/);
            let Point_f = Match3? parseFloat(Match3[1]).toFixed(1) : null;

            let Match4 = targetStr.match(/class="l">(\S+?) 人评分<\/a>/);
            let Votes_f = Match4? parseFloat(Match4[1]) : null;

            let info = {"rankNum": rankNum,"Point": Point,"Votes": votes,"Point_f": Point_f,"Votes_f": Votes_f};
            localStorage.setItem('Subject'+ID+'Status',JSON.stringify(info));

            if(!update) DisplayRank(rankNum,index,args);
            else{
                showBtn.textContent='更新中... (' + count + '/' + TotalItems +')';
                if(count==itemsList.length){ location.reload(); showBtn.textContent='更新完毕！';}
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
    }

})();

