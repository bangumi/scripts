// ==UserScript==
// @name         bangumi收藏列表显示增强
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.4.3
// @description  在用户的收藏列表和目录页面下显示条目的排名，站内评分和评分人数，好友评分和评分人数，并提供排名功能
// @author       Yonjar，Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(.+?/list|index)/.+$/
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
background-color: rgba(253, 62, 80, 0.8)!important;
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
    //按排名排序
    var sortstyle = -1, sortstyle1 = 1,sortstyle2 = 1,sortstyle3 = -1,count=0,update=0;
    var showBtn = document.createElement('a');
    showBtn.addEventListener('click', SortByRank);
    showBtn.className = 'chiiBtn';
    showBtn.href='javascript:;';
    showBtn.textContent = '排名排序';

    //按评分人数排序
    var showBtn1 = document.createElement('a');
    showBtn1.addEventListener('click', SortByVote);
    showBtn1.className = 'chiiBtn';
    showBtn1.href='javascript:;';
    showBtn1.textContent = '人数排序';

    //按好友评价排序
    var showBtn2 = document.createElement('a');
    showBtn2.addEventListener('click', SortByFriend);
    showBtn2.className = 'chiiBtn';
    showBtn2.href='javascript:;';
    showBtn2.textContent = '好友评价排序';

    //按时间排序
    var showBtn3 = document.createElement('a');
    showBtn3.addEventListener('click', SortByTime);
    showBtn3.className = 'chiiBtn';
    showBtn3.href='javascript:;';
    showBtn3.textContent = '时间排序';
    if(document.querySelector('#indexCatBox ul.cat'))
        document.querySelector('#indexCatBox ul.cat').append(showBtn3);

    //更新缓存数据
    var showBtn4 = document.createElement('a');
    showBtn4.addEventListener('click', Update);
    showBtn4.className = 'chiiBtn';
    showBtn4.href='javascript:;';
    showBtn4.textContent = '更新';

    itemsList.forEach( (elem, index) => {
        var href = elem.querySelector('a.subjectCover').href;
        var ID = href.split('/subject/')[1];
        if(localStorage.getItem(ID+'Point')){
            var info = {"rankNum": localStorage.getItem(ID+'Rank'),"Point": localStorage.getItem(ID+'Point'),"votes": localStorage.getItem(ID+'Votes'),"Point_f": localStorage.getItem(ID+'Point_f'),"Votes_f": localStorage.getItem(ID+'Votes_f')};
            DisplayStatus(index,info);
        }
        else
            FetchStatus(href,index);

    });

    function Update(){
        update=1;
        count=0;
        itemsList.forEach( (elem, index) => {
            var href = elem.querySelector('a.subjectCover').href;
            FetchStatus(href,index);
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
            //显示排名
            let canMatch = targetStr.match(/<small class="alarm">#(\S+?)<\/small>/);
            let rankNum =  canMatch ? parseInt(canMatch[1], 10) : 'NULL';
            if(canMatch)  localStorage.setItem(ID+'Rank',rankNum);

            //显示站内评分和评分人数
            let Match1 = targetStr.match(/<span class="number" property="v:average">(\S+?)<\/span>/);
            let Point = Match1? parseFloat(Match1[1]) : 'NULL';
            if(Match1)  localStorage.setItem(ID+'Point',Point);
            let Match2 = targetStr.match(/<span property="v:votes">(\S+?)<\/span>/);
            let votes = Match2? parseInt(Match2[1]) : 'NULL';
            if(Match2)  localStorage.setItem(ID+'Votes',votes);

            //显示好友评分和评分人数
            let Match3 = targetStr.match(/<span class="num">(\S+?)<\/span>/);
            let Point_f = Match3? parseFloat(Match3[1]).toFixed(1) : 'NULL';
            if(Match3)  localStorage.setItem(ID+'Point_f',Point_f);
            let Match4 = targetStr.match(/class="l">(\S+?) 人评分<\/a>/);
            let Votes_f = Match4? parseFloat(Match4[1]) : 'NULL';
            if(Match4) localStorage.setItem(ID+'Votes_f',Votes_f);

            var info = {"rankNum": rankNum,"Point": Point,"votes": votes,"Point_f": Point_f,"Votes_f": Votes_f};
            if(!update)  DisplayStatus(index,info);
            else{
                count+=1;
                showBtn4.textContent='更新中... (' + count + '/' + itemsList.length +')';
                if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}
            }
        });
    }

    function DisplayStatus(index,info){
        var rankNum=info["rankNum"],Point=info["Point"],votes=info["votes"],Point_f=info["Point_f"],Votes_f=info["Votes_f"];
        //显示排名
        let rankSp = document.createElement('span');
        rankSp.className = 'rank';
        if (rankNum <= 100 && rankNum >0) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_excellent');
        }
        else if (rankNum <= 1000 && rankNum >0) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_recommended');
        }
        else if (rankNum >= 3000) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_refuse');
        }
        else if (rankNum >= 2000) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_justsoso');
        }
        else if (rankNum === 'NULL'|| rankNum ==null) {
            rankSp.classList.add('yonjar_bgm_userjs_rank_undefined');
        }

        rankSp.innerHTML = `<small>Rank </small>${rankNum}`;

        document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rankSp, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);

        //显示站内评分和评分人数
        let rateInfo = document.createElement('p');
        rateInfo.setAttribute("class","rateInfo");
        let PointSm = document.createElement('small');
        PointSm.innerHTML = Point;
        PointSm.setAttribute("class","fade");
        let sstars = document.createElement('span');
        let Point1 = Point ? parseInt(Point) : 'NULL';
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

        document.querySelectorAll('#browserItemList .item .inner')[index].insertBefore(rateInfo, document.querySelectorAll('#browserItemList .item .inner .info.tip')[index]);
        rateInfo.appendChild(sstars);
        rateInfo.appendChild(PointSm);
        rateInfo.appendChild(tip_j);

        //显示好友评分和评分人数
        let Pointfr = document.createElement('small');
        Pointfr.innerHTML = "好友评分："+Point_f+"　　"+Votes_f+"人评分";
        Pointfr.setAttribute("class","fade");
        rateInfo.appendChild(Pointfr);

        //显示排序按钮
        count+=1;
        if(count==itemsList.length && document.querySelector('#indexCatBox ul.cat')){
            document.querySelector('#indexCatBox ul.cat').append(showBtn);
            document.querySelector('#indexCatBox ul.cat').append(showBtn1);
            //document.querySelector('#indexCatBox ul.cat').append(showBtn2);
            document.querySelector('#indexCatBox ul.cat').append(showBtn4);
            $('.chiiBtn').css({padding:'0 5px'});
            $('ul.cat li').css({padding:'0 5px 0 0'});
        }
        else if(count==itemsList.length && document.querySelector('#browserTools'))
            document.querySelector('#browserTools').append(showBtn4);
    }
    function SortByRank() {
        sortstyle = (sortstyle==1)? -1 :1;
        showBtn.textContent = (showBtn.textContent=='排名排序↑') ? '排名排序↓':'排名排序↑';
        var container = document.querySelector('ul#browserItemList');
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
        var container = document.querySelector('ul#browserItemList');
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
        showBtn2.textContent = (showBtn2.textContent=='好友评价排序↓') ? '好友评价排序↑':'好友评价排序↓';
        var container = document.querySelector('ul#browserItemList');
        function ParseFriendRank(rankstring){
            let rank = rankstring.match(/(\d{1}.\d{1})/)? rankstring.match(/(\d{1}).\d{1}/)[1]: 0;
            return parseFloat(rank);
        }
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .rateInfo .fade'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseFriendRank(x[0]) - ParseFriendRank(y[0]))*sortstyle2)
            .forEach((x,n) => {x[1].parentNode.parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.parentNode.style.width = '100%';});
    }

    function SortByTime() {
        sortstyle3 = (sortstyle3==-1)? 1 :-1;
        showBtn3.textContent = (showBtn3.textContent=='时间排序↓') ? '时间排序↑':'时间排序↓';
        var container = document.querySelector('ul#browserItemList');
        function ParseDate(Datestring){
            let yy=Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'1000';
            let year = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[1].toString(): yy;
            let month = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[3].toString(): '01';
            let day = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)?Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[5].toString(): '01';
            var date= new Date(year+'/'+month+'/'+day);
            var now = new Date();
            return now.getTime()-date.getTime();
        }
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .info'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseDate(x[0]) - ParseDate(y[0]))*sortstyle3)
            .forEach((x,n) => {x[1].parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.style.width = '100%';});
    }


})();
