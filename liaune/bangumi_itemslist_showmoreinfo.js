// ==UserScript==
// @name         bangumi列表显示增强
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.6.6
// @description  在有条目列表的页面，显示条目的排名，站内评分和评分人数，好友评分和评分人数，并提供排序功能，鼠标移到排名处可查看历史记录
// @author       Yonjar，Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(.+?/list|.+?/tag|.+?/browser|subject_search|index)(/|\?).+$/
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
background-color: #f2050587!important;
}

.yonjar_bgm_userjs_rank_undefined{
background-color: #0000001a!important;
}

.friend_vote{
font-size: 10px;
color:#4260cb;
}
.yonjar_bgm_userjs_vote_0{
background-color: rgba(11, 12, 12, 0)!important;
color:black;
}

.yonjar_bgm_userjs_vote_500{
background-color: rgba(128, 255, 255, 0)!important;
color:#eca609;
}
.yonjar_bgm_userjs_vote_1000{
background-color: rgba(128, 144, 255, 0)!important;
color:#18a099;
}
.yonjar_bgm_userjs_vote_2000{
background-color: rgba(209, 80, 205, 0)!important;
color:blue;
}
.yonjar_bgm_userjs_vote_4000{
background-color: rgba(253, 62, 80, 0)!important;
color:red;
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
    let sortstyle = -1, sortstyle1 = 1,sortstyle2 = 1,sortstyle3 = -1,count=0,update=0;

    //按排名排序
    const showBtn = document.createElement('a');
    showBtn.addEventListener('click', SortByRank);
    showBtn.className = 'chiiBtn';
    showBtn.href='javascript:;';
    showBtn.textContent = '排名排序';

    //按评分人数排序
    const showBtn1 = document.createElement('a');
    showBtn1.addEventListener('click', SortByVote);
    showBtn1.className = 'chiiBtn';
    showBtn1.href='javascript:;';
    showBtn1.textContent = '人数排序';

    //按好友评价排序
    const showBtn2 = document.createElement('a');
    showBtn2.addEventListener('click', SortByFriend);
    showBtn2.className = 'chiiBtn';
    showBtn2.href='javascript:;';
    showBtn2.textContent = '好友评价';

    //按时间排序
    const showBtn3 = document.createElement('a');
    showBtn3.addEventListener('click', SortByTime);
    showBtn3.className = 'chiiBtn';
    showBtn3.href='javascript:;';
    showBtn3.textContent = '时间排序';
    if(document.querySelector('#indexCatBox ul.cat'))
        document.querySelector('#indexCatBox ul.cat').append(showBtn3);

    //更新缓存数据
    const showBtn4 = document.createElement('a');
    showBtn4.addEventListener('click', Update);
    showBtn4.className = 'chiiBtn';
    showBtn4.href='javascript:;';
    showBtn4.textContent = '更新';

    //更新缓存数据
    const showBtn0 = document.createElement('a');
    showBtn0.addEventListener('click', ShowProcess);
    showBtn0.className = 'chiiBtn';
    showBtn0.href='javascript:;';
    showBtn0.textContent = 'Show';

    const You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    const User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;

    if(window.location.href.match(/\/index\//)) Process();
    else {document.querySelector('#browserTools').append(showBtn0);}

    function ShowProcess(){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        showBtn0.style.display='none';
        Process();
    }
    //Main Program
    function Process(){
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];

            //为每个条目添加单独刷新
            let showBtn5 = document.createElement('a');
            showBtn5.className = 'l';
            showBtn5.href='javascript:;';
            showBtn5.textContent = '↺';
            showBtn5.addEventListener('click', FetchStatus.bind(this,href,index),false);
            elem.querySelector('.inner h3').appendChild(showBtn5);

            //获取用户评分
            let User_rate=User ? elem.querySelectorAll('.inner .collectInfo span')[0].className: null;
            let User_Point=User_rate ? (User_rate.match(/sstars(\d+)/)?User_rate.match(/sstars(\d+)/)[1]:null):null;
            if(User==You && User_Point)  localStorage.setItem(You+'Point'+ID,User_Point);
            if(localStorage.getItem(ID+'Point')){
                let info = {"rankNum": localStorage.getItem(ID+'Rank'),"Point": localStorage.getItem(ID+'Point'),"votes": localStorage.getItem(ID+'Votes'),"Point_f": localStorage.getItem(ID+'Point_f'),"Votes_f": localStorage.getItem(ID+'Votes_f')};
                DisplayStatus(ID,index,info);
            }
            else
                FetchStatus(href,index);

        });
    }

    function Update(){
        update=1;
        count=0;
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];
            //同一天只更新一次
            let date = new Date();
            let time = date.getFullYear()+"-" + (date.getMonth()+1) + "-" + date.getDate();
            let lastime = localStorage.getItem(ID+'Lastime');
            if(time != lastime)  FetchStatus(href,index);
            else {
                count+=1;
                showBtn4.textContent='更新中... (' + count + '/' + itemsList.length +')';
                if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}}
        });
    }

    function FetchStatus(href,index){
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
            if(canMatch)  localStorage.setItem(ID+'Rank',rankNum);

            //获取站内评分和评分人数
            let Match1 = targetStr.match(/<span class="number" property="v:average">(\S+?)<\/span>/);
            let Point = Match1? parseFloat(Match1[1]) : null;
            if(Match1)  localStorage.setItem(ID+'Point',Point);
            let Match2 = targetStr.match(/<span property="v:votes">(\S+?)<\/span>/);
            let votes = Match2? parseInt(Match2[1]) : null;
            if(Match2)  localStorage.setItem(ID+'Votes',votes);

            //获取好友评分和评分人数
            let Match3 = targetStr.match(/<span class="num">(\S+?)<\/span>/);
            let Point_f = Match3? parseFloat(Match3[1]).toFixed(1) : null;
            if(Match3)  localStorage.setItem(ID+'Point_f',Point_f);
            let Match4 = targetStr.match(/class="l">(\S+?) 人评分<\/a>/);
            let Votes_f = Match4? parseFloat(Match4[1]) : null;
            if(Match4) localStorage.setItem(ID+'Votes_f',Votes_f);

            //加入历史记录
            let date = new Date();
            let time = date.getFullYear()+"-" + (date.getMonth()+1) + "-" + date.getDate();
            let lastime = localStorage.getItem(ID+'Lastime');
            let Record = time + ' Rank #' + rankNum + ' 评分:'+ Point + ' '+ votes + ' 人评分'+ '\r\n';
            let History = localStorage.getItem(ID+'Records');
            if(History) Record = History + Record;
            if(Match1 && time!=lastime){
                localStorage.setItem(ID+'Lastime',time);
                localStorage.setItem(ID+'Records',Record);}

            let info = {"rankNum": rankNum,"Point": Point,"votes": votes,"Point_f": Point_f,"Votes_f": Votes_f};
            if(!update)  DisplayStatus(ID,index,info);
            else{
                count+=1;
                showBtn4.textContent='更新中... (' + count + '/' + itemsList.length +')';
                if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}
            }
        });
    }

    function DisplayStatus(ID,index,info){
        let rankNum=info.rankNum,Point=info.Point,votes=info.votes,Point_f=info.Point_f,Votes_f=info.Votes_f;
        //显示排名
        let rankSp = document.createElement('span');
        rankSp.className = 'rank';
        if (rankNum >= 3000) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_refuse');
        }
        else if (rankNum >= 2000) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_justsoso');
        }
        else if (rankNum >= 1000) {
        }
        else if (rankNum >= 100) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_recommended');
        }
        else if ( rankNum >0) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_excellent');
        }
        else {
            rankSp.classList.add('yonjar_bgm_userjs_rank_undefined');
        }

        rankSp.innerHTML = `<small>Rank </small>${rankNum}`;
        let note = localStorage.getItem(ID+'Records');
        rankSp.setAttribute('title', note);

        if(window.location.href.match(/\/(list|index)\//))
            document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rankSp, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);

        //显示站内评分和评分人数
        let rateInfo = document.createElement('p');
        rateInfo.setAttribute("class","rateInfo");
        let PointSm = document.createElement('small');
        PointSm.innerHTML = Point;
        PointSm.setAttribute("class","fade");
        let sstars = document.createElement('span');
        let Point1 = Point ? parseInt(Point) : null;
        if(Point1)
            sstars.setAttribute("class","sstars"+ Point1+ " starsinfo");
        let tip_j = document.createElement('span');
        tip_j.setAttribute("class","tip_j");
        tip_j.innerHTML = "("+ votes +"人评分)";
        if(votes>=4000)
            tip_j.classList.add('yonjar_bgm_userjs_vote_4000');
        else if(votes>=2000)
            tip_j.classList.add('yonjar_bgm_userjs_vote_2000');
        else if(votes>=1000)
            tip_j.classList.add('yonjar_bgm_userjs_vote_1000');
        else if(votes>=500)
            tip_j.classList.add('yonjar_bgm_userjs_vote_500');
        if(votes<500)
            tip_j.classList.add('yonjar_bgm_userjs_vote_0');

        if(window.location.href.match(/\/(list|index)\//)){
            document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rateInfo, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);
            rateInfo.appendChild(sstars);
            rateInfo.appendChild(PointSm);
            rateInfo.appendChild(tip_j);}
        else rateInfo = document.querySelectorAll('#browserItemList .item .inner .rateInfo')[index];

        //显示好友评分和评分人数
        let Pointfr = document.createElement('small');
        Point_f = Point_f ? Point_f : '-';
        Votes_f = Votes_f ? Votes_f :'-';
        let Point_My = localStorage.getItem(You+'Point'+ID);
        let Point_M = Point_My ? "我的评分："+Point_My :'';
        Pointfr.innerHTML = "好友评分："+Point_f+"　　"+Votes_f+"人评分"+"　　"+Point_M;
        Pointfr.setAttribute("class","friend_vote");
        rateInfo.appendChild(Pointfr);


        //显示排序按钮
        count+=1;
        if(count==itemsList.length && document.querySelector('#indexCatBox ul.cat')){
            document.querySelector('#indexCatBox ul.cat').append(showBtn);
            document.querySelector('#indexCatBox ul.cat').append(showBtn1);
            document.querySelector('#indexCatBox ul.cat').append(showBtn2);
            document.querySelector('#indexCatBox ul.cat').append(showBtn4);
            $('.chiiBtn').css({padding:'0 5px'});
            $('ul.cat li').css({padding:'0 5px 0 0'});
        }
        else if(count==itemsList.length && document.querySelector('#browserTools')){
            document.querySelector('#browserTools').append(showBtn);
            document.querySelector('#browserTools').append(showBtn1);
            document.querySelector('#browserTools').append(showBtn2);
            document.querySelector('#browserTools').append(showBtn4);
        }
    }
    function SortByRank() {
        sortstyle = (sortstyle==1)? -1 :1;
        showBtn.textContent = (showBtn.textContent=='排名排序↑') ? '排名排序↓':'排名排序↑';
        let container = document.querySelector('ul#browserItemList');
        function ParseRank(rankstring){
            let rank = rankstring.match(/Rank (\d{1,4})/)? rankstring.match(/Rank (\d{1,4})/)[1]: 9999;
            return rank;
        }
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .rank'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseRank(x[0]) - ParseRank(y[0]))*sortstyle)
            .forEach((x,n) => {x[1].parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.style.width = '100%';});
    }

    function SortByVote() {
        sortstyle1 = (sortstyle1==-1)? 1 :-1;
        showBtn1.textContent = (showBtn1.textContent=='人数排序↓') ? '人数排序↑':'人数排序↓';
        let container = document.querySelector('ul#browserItemList');
        function ParseVote(votestring){
            let vote = votestring.match(/(\d{1,5})人评分/)? votestring.match(/(\d{1,5})人评分/)[1]: 0;
            return vote;
        }
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .rateInfo .tip_j'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseVote(x[0]) - ParseVote(y[0]))*sortstyle1)
            .forEach((x,n) => {x[1].parentNode.parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.parentNode.style.width = '100%';});
    }

    function SortByFriend() {
        sortstyle2 = (sortstyle2==-1)? 1 :-1;
        showBtn2.textContent = (showBtn2.textContent=='好友评价↓') ? '好友评价↑':'好友评价↓';
        let container = document.querySelector('ul#browserItemList');
        function ParseFriendRank(rankstring){
            let rank = rankstring.match(/(\d+\.\d+?)/)? rankstring.match(/(\d+\.\d+?)/)[1]: 0;
            let votes = rankstring.match(/(\d+?)人/)? rankstring.match(/(\d+?)人/)[1]: 0;
            rank = parseFloat(rank);
            votes = parseInt(votes);
            let fixed = rank ? (votes / (votes+10))* rank + (10 / (votes+10)) * 6: 0;
            return parseInt(fixed*10);
        }
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .rateInfo .friend_vote'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseFriendRank(x[0]) - ParseFriendRank(y[0]))*sortstyle2)
            .forEach((x,n) => {x[1].parentNode.parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.parentNode.style.width = '100%';});
    }

    function SortByTime() {
        sortstyle3 = (sortstyle3==-1)? 1 :-1;
        showBtn3.textContent = (showBtn3.textContent=='时间排序↓') ? '时间排序↑':'时间排序↓';
        let container = document.querySelector('ul#browserItemList');
        function ParseDate(Datestring){
            let yy=Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'1000';
            let year = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[1].toString(): yy;
            let month = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[3].toString(): '01';
            let day = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)?Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[5].toString(): '01';
            let date= new Date(year+'/'+month+'/'+day);
            let now = new Date();
            return now.getTime()-date.getTime();
        }
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .info'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseDate(x[0]) - ParseDate(y[0]))*sortstyle3)
            .forEach((x,n) => {x[1].parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.style.width = '100%';});
    }


})();
