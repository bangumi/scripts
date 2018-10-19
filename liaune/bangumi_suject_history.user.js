// ==UserScript==
// @name         Bangumi 条目评分排名历史记录
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.4
// @description  在浏览条目列表时记录条目的评分排名信息，在Rank上显示
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(.+?/tag|.+?/browser|subject_search)(/|\?).+/
// @grant        none
// ==/UserScript==

(function() {

    const You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    let itemsList = document.querySelectorAll('#browserItemList li.item');
    itemsList.forEach( (elem, index) => {
        let href = elem.querySelector('a.subjectCover').href;
        let ID = href.split('/subject/')[1];
        let rank = elem.querySelector('.inner span.rank');
        if(rank && localStorage.getItem(ID+'Records')) rank.setAttribute('title', localStorage.getItem(ID+'Records'));
    });
    function process(){
        let itemsList = document.querySelectorAll('#browserItemList li.item');

        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];
            let rank = elem.querySelector('.inner span.rank');
            let rankNum = rank ? rank.innerHTML.match(/\d{1,5}/) : null;

            let rate = elem.querySelector('.inner .fade');
            let Point = rate ? parseFloat(rate.innerHTML) : null;

            let vote=elem.querySelector('.inner .tip_j');
            let re = new RegExp("\\d+", "");
            let Votes = vote ? re.exec(vote.innerHTML) : null;

            let info = JSON.parse(localStorage.getItem('Subject'+ID+'Status'));
            info.rankNum = rankNum; info.Point = Point; info.Votes = Votes;
            localStorage.setItem('Subject'+ID+'Status',JSON.stringify(info));

            //加入历史记录
            let date = new Date();
            let time = date.getFullYear()+"-" + (date.getMonth()+1) + "-" + date.getDate();
            let lastime = localStorage.getItem(ID+'Lastime');
            let Record = time + ' Rank #' + rankNum + ' 评分:'+ Point + ' '+ Votes + ' 人评分';
            let History = localStorage.getItem(ID+'Records');
            //if(History.split('\n').length>10)
            if(Record && time != lastime)
                History = History + '\n'+ Record;
            if(History)
                History = Trim(History.split('\n'));

            if(Votes && History){
                localStorage.setItem(ID+'Lastime',time);
                localStorage.setItem(ID+'Records',History);}

            if(rank) rank.setAttribute('title', localStorage.getItem(ID+'Records'));
        });
    }

    //每条记录时间间隔3天
    function Trim(Records){
        let N=3;
        let n = Records.length;
        let Select = [],count=1;
        for(i=0;i<n;i++){
            if(!Records[i])     Records.splice(i,1);
            else if(Records[i]=='null')  Records.splice(i,1);
        }
        n = Records.length;
        Select[0] = Records[0];
        let Start = new Date(Records[0].match(/\d{4}-\d{1,2}-\d{1,2}/)[0]);
        //let End = new Date(Records[n-1].match(/\d{4}-\d{1,2}-\d{1,2}/)[0]);
        //let Day = parseFloat((End.getTime() - Start.getTime())/(24 * 60 * 60 * 1000* N));
        for(i=1;i<n;i++){
            let Time = new Date(Records[i].match(/\d{4}-\d{1,2}-\d{1,2}/)[0]);
            let Day1 = parseInt((Time.getTime() - Start.getTime())/(24 * 60 * 60 * 1000));
            if(Day1>=N) {
                Select[count] = Records[i];
                Start = Time;
                count+=1;}
        }
        return Select.join('\n');
    }

    //记录数据
    const showBtn4 = document.createElement('a');
    showBtn4.addEventListener('click', process);
    showBtn4.className = 'chiiBtn';
    showBtn4.href='javascript:;';
    showBtn4.textContent = '记录';
    document.querySelector('#browserTools').append(showBtn4);

})();
