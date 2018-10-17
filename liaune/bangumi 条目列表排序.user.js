// ==UserScript==
// @name         Bangumi 条目排序
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.3
// @description  对条目列表进行按排名、人数、评分、时间排序,并可以按人数、时间筛选
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(.+?/tag|.+?/browser|subject_search)(/|\?).+/
// @grant        none
// ==/UserScript==

(function() {

    let sortstyle = -1, sortstyle1 = 1,sortstyle2 = 1,sortstyle3 = -1;
    //按排名排序
    const showBtn = document.createElement('a');  showBtn.addEventListener('click', SortByRank);  showBtn.className = 'chiiBtn';  showBtn.href='javascript:;';   showBtn.textContent = '排名排序';document.querySelector('#browserTools').append(showBtn);
    //按评分人数排序
    const showBtn1 = document.createElement('a'); showBtn1.addEventListener('click', SortByVote);  showBtn1.className = 'chiiBtn'; showBtn1.href='javascript:;'; showBtn1.textContent = '人数排序';document.querySelector('#browserTools').append(showBtn1);
    //按人数筛选
    const voteRange = document.createElement('input');voteRange.addEventListener('blur',Select);voteRange.className = 'textfield';$(voteRange).css({"width":"30px","height":"15px"});document.querySelector('#browserTools').append(voteRange);$(voteRange).hide();
    const voteRange1 = document.createElement('input');voteRange1.addEventListener('blur',Select);voteRange1.className = 'textfield';$(voteRange1).css({"width":"30px","height":"15px"});document.querySelector('#browserTools').append(voteRange1);$(voteRange1).hide();
    //按评分排序
    //const showBtn2 = document.createElement('a'); showBtn2.addEventListener('click', SortByPoint); showBtn2.className = 'chiiBtn'; showBtn2.href='javascript:;'; showBtn2.textContent = '评分排序';document.querySelector('#browserTools').append(showBtn2);
    //按时间排序
    const showBtn3 = document.createElement('a'); showBtn3.addEventListener('click', SortByTime); showBtn3.className = 'chiiBtn'; showBtn3.href='javascript:;'; showBtn3.textContent = '时间排序';document.querySelector('#browserTools').append(showBtn3);
    //按时间筛选
    const timeRange = document.createElement('input');timeRange.addEventListener('blur',Select);timeRange.className = 'textfield';$(timeRange).css({"width":"60px","height":"15px"});document.querySelector('#browserTools').append(timeRange);$(timeRange).hide();
    const timeRange1 = document.createElement('input');timeRange1.addEventListener('blur',Select);timeRange1.className = 'textfield';$(timeRange1).css({"width":"60px","height":"15px"});document.querySelector('#browserTools').append(timeRange1);$(timeRange1).hide();
    function ParseRank(rankstring){
        let rank = rankstring.match(/Rank (\d{1,4})/)? rankstring.match(/Rank (\d{1,4})/)[1]: 9999;
        return rank;
    }
    function ParseVote(votestring){
        let vote = votestring.match(/(\d{1,5})人评分/)? votestring.match(/(\d{1,5})人评分/)[1]: 0;
        return vote;
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

    function SortByRank() {
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        sortstyle = (sortstyle==1)? -1 :1;
        showBtn.textContent = (showBtn.textContent=='排名排序↑') ? '排名排序↓':'排名排序↑';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rank')? ParseRank(li1.querySelector('.inner .rank').textContent): 9999;
            let n2=li2.querySelector('.inner .rank')? ParseRank(li2.querySelector('.inner .rank').textContent): 9999;
            return (n1-n2)*sortstyle;});
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }

    function SortByVote() {
        $(voteRange).show();$(voteRange1).show();
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        sortstyle1 = (sortstyle1==-1)? 1 :-1;
        showBtn1.textContent = (showBtn1.textContent=='人数排序↓') ? '人数排序↑':'人数排序↓';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .rateInfo .tip_j')? ParseVote(li1.querySelector('.inner .rateInfo .tip_j').textContent): 0;
            let n2=li2.querySelector('.inner .rateInfo .tip_j')? ParseVote(li2.querySelector('.inner .rateInfo .tip_j').textContent): 0;
            return (n1-n2)*sortstyle1;});
        for(let i=0; i<arr.length; i++)      $('#browserItemList').append(arr[i]);
    }

    function SortByPoint() {
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        sortstyle2 = (sortstyle2==-1)? 1 :-1;
        showBtn2.textContent = (showBtn2.textContent=='评分排序↓') ? '评分排序↑':'评分排序↓';
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .fade')? parseFloat(li1.querySelector('.inner .fade').innerHTML): 0;
            let n2=li2.querySelector('.inner .fade')? parseFloat(li2.querySelector('.inner .fade').innerHTML): 0;
            if(n1==n2){
                let n11=li1.querySelector('.inner .rank')? ParseRank(li1.querySelector('.inner .rank').textContent): 9999;
                let n22=li2.querySelector('.inner .rank')? ParseRank(li2.querySelector('.inner .rank').textContent): 9999;
                return (n22-n11)*sortstyle2;
            }
            else return (n1-n2)*sortstyle2;
        });
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }
    function SortByTime() {
        $(timeRange).show();$(timeRange1).show();
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        sortstyle3 = (sortstyle3==-1)? 1 :-1;
        showBtn3.textContent = (showBtn3.textContent=='时间排序↓') ? '时间排序↑':'时间排序↓';
        let container = document.querySelector('ul#browserItemList');
        let arr=[];
        for(let i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.inner .info')? ParseDate(li1.querySelector('.inner .info').textContent): 0;
            let n2=li2.querySelector('.inner .info')? ParseDate(li2.querySelector('.inner .info').textContent): 0;
            return (n1-n2)*sortstyle3;
        });
        for(let i=0; i<arr.length; i++)     $('#browserItemList').append(arr[i]);
    }
    function Select(){
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        itemsList.forEach( (elem, index) => {
             $(elem).show();
            let time = elem.querySelector('.inner .info')? ParseDate(elem.querySelector('.inner .info').textContent): 0;
            let mintime = timeRange.value !="" ? ParseDate(timeRange.value):ParseDate("1000-1-1");
            let maxtime = timeRange1.value !="" ? ParseDate(timeRange1.value):ParseDate("3000-1-1");
            let vote = elem.querySelector('.inner .rateInfo .tip_j')? ParseVote(elem.querySelector('.inner .rateInfo .tip_j').textContent): 0;
            let minvote = voteRange.value !="" ? parseInt(voteRange.value):0;
            let maxvote = voteRange1.value !="" ? parseInt(voteRange1.value):20000;
            if(time>mintime || time<maxtime || vote<minvote || vote>maxvote)
                $(elem).hide();
        });
    }

})();
