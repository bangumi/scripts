// ==UserScript==
// @name         bangumi列表显示增强
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.8
// @description  在有条目列表的页面，显示条目的排名，站内评分和评分人数，好友评分和评分人数，并提供排序功能
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(.+?/list|.+?/tag|.+?/browser|subject_search|index)(/|\?).+$/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle(`
.bgm_userjs_rank_excellent{
background-color: #0033CC!important;
}
.bgm_userjs_rank_recommended{
background-color: #3ed715!important;
}
.bgm_userjs_rank_justsoso{
background-color: #FF6600!important;
}
.bgm_userjs_rank_refuse{
background-color: #f2050587!important;
}
.bgm_userjs_rank_undefined{
background-color: #0000001a!important;
}
.bgm_userjs_rank_btn{
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
.bgm_userjs_rank_btn:hover {
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
    // 检测 indexedDB 兼容性，因为只有新版本浏览器支持
    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    // 初始化 indexedDB
    const dbName = 'Bangumi_Subject_Info';
    const tableName = 'info';
    const indexName = 'id';
    if (indexedDB) {
        let request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = evt => {
            let db = evt.target.result;
            let objectStore = db.createObjectStore(tableName, {keyPath: indexName});
        }
        request.onsuccess = evt => {
            removeCache();
        }
    }
    // 用来记录已经被使用的缓存列表
    let cacheLists = [];
    // 获取本地缓存
    function getCache(itemId, callback) {
        let request = indexedDB.open(dbName, 1);
        request.onsuccess = evt => {
            let db = evt.target.result;
            let transaction = db.transaction([tableName], 'readonly');
            let objectStore = transaction.objectStore(tableName);
            let reqInfo = objectStore.get(itemId);
            reqInfo.onsuccess = evt => {
                let result = evt.target.result;
                if(!!result) {
                    cacheLists.push(itemId);
                    callback(true, result.value.content);
                } else {
                    callback(false);
                }
            }
            reqInfo.onerror = evt => {
                callback(false);
            }
        };
    }
    // 记录到本地缓存
    function setCache(itemId, data) {
        let request = indexedDB.open(dbName, 1);
        request.onsuccess = evt => {
            let db = evt.target.result;
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let cache = {
                content: data,
                created: new Date()
            };
            let reqInfo = objectStore.put({id: itemId, value: cache})
            reqInfo.onerror = evt => {
                //console.log('Error', evt.target.error.name);
            }
            reqInfo.onsuccess = evt => {}
        };
    }
    // 清除和更新缓存
    function removeCache() {
        let request = indexedDB.open(dbName, 1);
        request.onsuccess = evt => {
            let db = evt.target.result;
            let transaction = db.transaction([tableName], 'readwrite'),
                store = transaction.objectStore(tableName),
                twoWeek = 1209600000;
            store.openCursor().onsuccess = evt => {
                let cursor = evt.target.result;
                if (cursor) {
                    if (cacheLists.indexOf(cursor.value.name) !== -1) {
                        cursor.value.created = new Date();
                        cursor.update(cursor.value);
                    } else {
                        let now = new Date(),
                            last = cursor.value.created;
                        if (now - last > twoWeek) {
                            cursor.delete();
                        }
                    }
                    cursor.continue();
                }
            }
        };
    }

    let itemsList = document.querySelectorAll('#browserItemList li.item');
    let sortstyleByRank = -1, sortstyleByVote = 1,sortstyleByFriendPoint = 1,sortstyleByFriendVotes = 1,sortstyleByTime = -1,sortstyleByMyPoint = 1,count=0,update=0;

    //按排名排序
    let sortByRankBtn = createElement('a','chiiBtn','javascript:;','排名排序'); sortByRankBtn.addEventListener('click', sortByRank);
    //按评分人数排序
    let sortByVoteBtn = createElement('a','chiiBtn','javascript:;','人数排序'); sortByVoteBtn.addEventListener('click', sortByVote);
    //按好友评分排序
    let sortByFriendPointBtn = createElement('a','chiiBtn','javascript:;','好友评分'); sortByFriendPointBtn.addEventListener('click', sortByFriendPoint);
    //按好友评分人数排序
    let sortByFriendVotesBtn = createElement('a','chiiBtn','javascript:;','友评人数'); sortByFriendVotesBtn.addEventListener('click', sortByFriendVotes);
    //按自己评分排序
    let sortByMyPointBtn = createElement('a','chiiBtn','javascript:;','我的评分'); sortByMyPointBtn.addEventListener('click', sortByMyPoint);
    //按时间排序
    let sortByTimeBtn = createElement('a','chiiBtn','javascript:;','时间排序'); sortByTimeBtn.addEventListener('click', sortByTime);
    //更新缓存数据
    let updateInfoBtn = createElement('a','chiiBtn','javascript:;','更新'); updateInfoBtn.addEventListener('click', updateInfo);
    //显示菜单按钮
    let showProcessBtn = createElement('a','chiiBtn','javascript:;','Show'); showProcessBtn.addEventListener('click', showProcess);

    const You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    const User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;
    //为应对分页
    if(window.location.href.match(/\/index\//)){
        document.querySelector('#indexCatBox ul.cat').append(showProcessBtn);
        document.querySelector('#indexCatBox ul.cat').append(updateInfoBtn); $(updateInfoBtn).hide();
    }
    else{
        document.querySelector('#browserTools').append(showProcessBtn);
        document.querySelector('#browserTools').append(updateInfoBtn); $(updateInfoBtn).hide();
    }

    $('#browserItemList').sortable({
        handle: ".cover"
    });

    function createElement(type,className,href,textContent){
        let Element = document.createElement(type);
        Element.className = className;
        Element.href = href;
        Element.textContent = textContent;
        return Element;
    }

    function showProcess(){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        process();
    }
    //Main Program
    function process(){
        if(itemsList.length){
            let fetchList = [];
            itemsList.forEach( (elem, index) => {
                let href = elem.querySelector('a.subjectCover').href;
                let ID = href.split('/subject/')[1];
                getCache(ID, function(success, result) {
                    if (success) {
                        displayStatus(elem,result);
                    }
                    else{
                        fetchList.push(elem);
                    }
                });
            });
            let i = 0;
            let getitemsList= setInterval(function(){
                let elem = fetchList[i];
                if(!elem) console.log(i);
                else{
                    let href = elem.querySelector('a.subjectCover').href;
                    getStatus(href,elem);
                    i++;
                    //console.log(i);
                }
                if(count >= itemsList.length){
                    clearInterval(getitemsList);
                }
            },300);
        }
    }

    function updateInfo(){
        update=1;
        count=0;
        itemsList = document.querySelectorAll('#browserItemList li.item');
        if(itemsList.length){
            let i = 0;
            let getitemsList= setInterval(function(){
                let elem = itemsList[i];
                let href = elem.querySelector('a.subjectCover').href;
                getStatus(href,elem);
                i++;
                if(count >= itemsList.length){
                    clearInterval(getitemsList);
                }
            },300);
        }
    }

    function getStatus(href,elem){
        let xhr = new XMLHttpRequest();
        xhr.open( "GET", href );
        xhr.withCredentials = true;
        xhr.responseType = "document";
        xhr.send();
        xhr.onload = function(){
            let d = xhr.responseXML;
            let nameinfo = d.querySelector('#infobox li');
            let name_cn = nameinfo.innerText.match(/中文名: (\.*)/)?nameinfo.innerText.match(/中文名: (\.*)/)[1]:null;
            //获取排名
            let ranksp = d.querySelector('#panelInterestWrapper .global_score small.alarm');
            let rank = ranksp ? ranksp.innerText.match(/\d+/)[0]:null;
            //获取站内评分和评分人数
            let score = d.querySelector('#panelInterestWrapper .global_score span.number').innerText;
            let votes = d.querySelector('#ChartWarpper small.grey span').innerText;
            //获取好友评分和评分人数
            let frdScore = d.querySelector('#panelInterestWrapper .frdScore');
            let score_f = frdScore ? frdScore.querySelector('span.num').innerText:null;
            let votes_f = frdScore ? frdScore.querySelector('a.l').innerText.match(/\d+/)[0]:null;
            //获取自己评分
            let score_u=0;
            if(location.pathname.match(/list/)){
                let User_rate=elem.querySelector('.inner .starlight') ? elem.querySelector('.inner .starlight').className: null;
                score_u =User_rate ? (User_rate.match(/stars(\d+)/)?User_rate.match(/stars(\d+)/)[1]:null):null;
            }
            let info = {"name_cn":name_cn,"rank":rank,"score":score,"votes":votes,"score_f":score_f,"votes_f":votes_f,"score_u":score_u};
            let ID = href.split('/subject/')[1];
            setCache(ID,info);
            displayStatus(elem,info);
            if(update){
                $(updateInfoBtn).text('更新中... (' + count + '/' + itemsList.length +')');
                if(count==itemsList.length){
                    $(updateInfoBtn).text('更新完毕！');
                }
            }
        };
    }

    function displayStatus(elem,info){
        //显示排名
        let rankSp = createElement('span','rank');
        let rankNum = parseInt(info.rank);
        if (rankNum >= 3000)      {rankSp.classList.add('bgm_userjs_rank_refuse');     }
        else if (rankNum >= 2000) {rankSp.classList.add('bgm_userjs_rank_justsoso');   }
        else if (rankNum >= 1000) { }
        else if (rankNum >= 100)  {rankSp.classList.add('bgm_userjs_rank_recommended');}
        else if ( rankNum >0)     {rankSp.classList.add('bgm_userjs_rank_excellent');  }
        else                      {rankSp.classList.add('bgm_userjs_rank_undefined');  }

        $(rankSp).append(`<small>Rank </small>${rankNum}`);

        if(window.location.href.match(/\/(list|index)\//))
            elem.querySelector('.inner').append(rankSp);

        //显示站内评分和评分人数
        let rateInfo = createElement('p',"rateInfo");
        let PointSm = createElement('small',"fade");  PointSm.innerHTML = info.score;
        let starstop = createElement('span',"starstop-s");
        let sstars = createElement('span');
        let Point = info.score ? Math.round(info.score) : null;
        if(Point) sstars.setAttribute("class","starlight stars"+ Point);
        starstop.appendChild(sstars);
        let tip_j = createElement('span',"tip_j");   tip_j.innerHTML = "("+ info.votes +"人评分)";

        if(window.location.href.match(/\/(list|index)\//)){
            elem.querySelector('.inner').append(rateInfo);
            if(rateInfo){
                rateInfo.appendChild(starstop);
                rateInfo.appendChild(PointSm);
                rateInfo.appendChild(tip_j);
            }
        }
        else rateInfo = elem.querySelector('.inner .rateInfo');

        //显示好友评分和评分人数
        let Pointfr = createElement('small',"friend_vote");
        let Point_f = info.score_f ? info.score_f : '-';
        let Votes_f = info.votes_f ? info.votes_f :'-';
        let Point_M = info.score_u ? "我的评分："+info.score_u :'';
        Pointfr.innerHTML = "　好友评分："+Point_f+"　"+Votes_f+"人评分"+"　　"+Point_M;
        if(rateInfo) rateInfo.appendChild(Pointfr);


        //显示排序按钮
        count++;
        if(!update) $(showProcessBtn).text('加载中... (' + count + '/' + itemsList.length +')');
        let sortDiv = createElement('div',"clearit");
        $(sortDiv).append(sortByTimeBtn);
        $(sortDiv).append(sortByRankBtn);
        $(sortDiv).append(sortByVoteBtn);
        $(sortDiv).append(sortByFriendPointBtn);
        $(sortDiv).append(sortByFriendVotesBtn);
        $(sortDiv).append(sortByMyPointBtn);
        if(count==itemsList.length && document.querySelector('#indexCatBox ul.cat')){
            $(showProcessBtn).hide();
            $(updateInfoBtn).show();
            $(sortDiv).insertAfter(document.querySelector('#indexCatBox ul.cat'));
        }
        else if(count==itemsList.length && document.querySelector('#browserTools')){
            $(showProcessBtn).hide();
            $(updateInfoBtn).show();
            $(sortDiv).insertAfter(document.querySelector('#browserTools'));
        }
    }

    //各种排序
    function ParseRank(rankstring){
        let rank = rankstring.match(/Rank (\d{1,4})/)? rankstring.match(/Rank (\d{1,4})/)[1]: 9999;
        return rank;
    }
    function ParseVote(votestring){
        let vote = votestring.match(/(\d{1,5})人评分/)? votestring.match(/(\d{1,5})人评分/)[1]: 0;
        return vote;
    }
    function ParseFriendRank(rankstring){
        let rank = rankstring.match(/(\d+\.\d+?)/)? rankstring.match(/(\d+\.\d+?)/)[1]: 0;
        let votes = rankstring.match(/(\d+?)人/)? rankstring.match(/(\d+?)人/)[1]: 0;
        rank = parseFloat(rank);
        votes = parseInt(votes);
        let fixed = rank ? (votes / (votes+10))* rank + (10 / (votes+10)) * 7: 0;
        return [rank,votes];
        //return parseInt(fixed*10);
    }
    function ParseDate(Datestring){
        let yy = Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'1000';
        Datestring = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/);
        let year = Datestring ? Datestring[1].toString(): yy;
        let month = Datestring ? Datestring[3].toString(): '01';
        let day = Datestring ?Datestring[5].toString(): '01';
        let date= new Date(year+'/'+month+'/'+day);
        let now = new Date();
        return now.getTime()-date.getTime();
    }
    function ParseMyRank(rankstring){
        let rank = rankstring.match(/我的评分：(\d+)/)? rankstring.match(/我的评分：(\d+)/)[1]: 0;
        return rank;
    }

    function sortByRank() {
        sortstyleByRank = (sortstyleByRank==1)? -1 :1;
        sortByRankBtn.textContent = (sortByRankBtn.textContent=='排名排序↑') ? '排名排序↓':'排名排序↑';
        let container = document.querySelector('ul#browserItemList');
        /*if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';
        [].slice.call(document.querySelectorAll('#browserItemList .item .inner .rank'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (ParseRank(x[0]) - ParseRank(y[0]))*sortstyle)
            .forEach((x,n) => {x[1].parentNode.parentNode.style.order = n; x[1].parentNode.parentNode.style.width = '100%';});*/
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rank')? ParseRank(li1.querySelector('.inner .rank').textContent): 9999;
            let n2=li2.querySelector('.inner .rank')? ParseRank(li2.querySelector('.inner .rank').textContent): 9999;
            return (n1-n2)*sortstyleByRank;});
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

    function sortByVote() {
        sortstyleByVote = (sortstyleByVote==-1)? 1 :-1;
        sortByVoteBtn.textContent = (sortByVoteBtn.textContent=='人数排序↓') ? '人数排序↑':'人数排序↓';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rateInfo .tip_j')? ParseVote(li1.querySelector('.inner .rateInfo .tip_j').textContent): 0;
            let n2=li2.querySelector('.inner .rateInfo .tip_j')? ParseVote(li2.querySelector('.inner .rateInfo .tip_j').textContent): 0;
            return (n1-n2)*sortstyleByVote;});
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

    function sortByFriendPoint() {
        sortstyleByFriendPoint = (sortstyleByFriendPoint==-1)? 1 :-1;
        sortByFriendPointBtn.textContent = (sortByFriendPointBtn.textContent=='好友评分↓') ? '好友评分↑':'好友评分↓';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rateInfo .friend_vote')? ParseFriendRank(li1.querySelector('.inner .rateInfo .friend_vote').textContent)[0]: 0;
            let n2=li2.querySelector('.inner .rateInfo .friend_vote')? ParseFriendRank(li2.querySelector('.inner .rateInfo .friend_vote').textContent)[0]: 0;
            return (n1-n2)*sortstyleByFriendPoint;
        });
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

    function sortByFriendVotes() {
        sortstyleByFriendVotes = (sortstyleByFriendVotes==-1)? 1 :-1;
        sortByFriendVotesBtn.textContent = (sortByFriendVotesBtn.textContent=='友评人数↓') ? '友评人数↑':'友评人数↓';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rateInfo .friend_vote')? ParseFriendRank(li1.querySelector('.inner .rateInfo .friend_vote').textContent)[1]: 0;
            let n2=li2.querySelector('.inner .rateInfo .friend_vote')? ParseFriendRank(li2.querySelector('.inner .rateInfo .friend_vote').textContent)[1]: 0;
            return (n1-n2)*sortstyleByFriendVotes;
        });
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

    function sortByTime() {
        sortstyleByTime = (sortstyleByTime==-1)? 1 :-1;
        sortByTimeBtn.textContent = (sortByTimeBtn.textContent=='时间排序↓') ? '时间排序↑':'时间排序↓';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .info')? ParseDate(li1.querySelector('.inner .info').textContent): 0;
            let n2=li2.querySelector('.inner .info')? ParseDate(li2.querySelector('.inner .info').textContent): 0;
            return (n1-n2)*sortstyleByTime;
        });
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

    function sortByMyPoint() {
        sortstyleByMyPoint = (sortstyleByMyPoint==-1)? 1 :-1;
        sortByMyPointBtn.textContent = (sortByMyPointBtn.textContent=='我的评分↓') ? '我的评分↑':'我的评分↓';
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rateInfo .friend_vote')? ParseMyRank(li1.querySelector('.inner .rateInfo .friend_vote').textContent): 0;
            let n2=li2.querySelector('.inner .rateInfo .friend_vote')? ParseMyRank(li2.querySelector('.inner .rateInfo .friend_vote').textContent): 0;
            if(n1==n2){
                let n11=li1.querySelector('.inner .rank')? ParseRank(li1.querySelector('.inner .rank').textContent): 9999;
                let n22=li2.querySelector('.inner .rank')? ParseRank(li2.querySelector('.inner .rank').textContent): 9999;
                return (n22-n11)*sortstyleByMyPoint;
            }
            else return (n1-n2)*sortstyleByMyPoint;
        });
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

})();
