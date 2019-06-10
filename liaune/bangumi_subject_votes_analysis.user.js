// ==UserScript==
// @name         Bangumi 条目评分排序筛选与分析
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.1
// @description  对条目评分按评分、用户注册时间、评分时间、有无头像排序，并可进行筛选，并计算当前筛选条件下的平均分
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/subject\/\d+\/(wishes|collections|doings|on_hold|dropped).*/
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    GM_addStyle(`
.horizontalChart{
height: 20em;
}
.horizontalChart li{
height: 18em;
}
.horizontalChart li a .count{
background: #2D7BB2;
}
.horizontalChart li a:hover .count{
background: #f4ac09;
}
`);
    let sortstyle = -1, sortstyle1 = 1,sortstyle2 = 1,sortstyle3 = -1,sortstyle4 = 1,addedyear=1;
    let VotesSidePannel,VotesSidePannel_added = 0, YearSidePannel,YearSidePannel_added = 0;
    let itemsList = document.querySelectorAll('#memberUserList li.user');
    //取总以供筛选
    let all=[];
    //按评分排序
    const showBtn = document.createElement('a');  showBtn.addEventListener('click', SortByStars);  showBtn.className = 'chiiBtn';  showBtn.href='javascript:;';   showBtn.textContent = '评分排序';document.querySelector('#SecTab').append(showBtn);
    showBtn.title = '按评分筛选，请在左右区间分别输入0-10的整数，不填默认为0-10';
    //按评分筛选
    const starsRange = document.createElement('input');starsRange.addEventListener('blur',Select);starsRange.className = 'textfield';$(starsRange).css({"width":"20px","height":"15px"});document.querySelector('#SecTab').append(starsRange);$(starsRange).hide();
    const starsRange1 = document.createElement('input');starsRange1.addEventListener('blur',Select);starsRange1.className = 'textfield';$(starsRange1).css({"width":"20px","height":"15px"});document.querySelector('#SecTab').append(starsRange1);$(starsRange1).hide();
    //按用户注册时间
    const showBtn1 = document.createElement('a'); showBtn1.addEventListener('click', SortByAge);  showBtn1.className = 'chiiBtn'; showBtn1.href='javascript:;'; showBtn1.textContent = '注册时间';document.querySelector('#SecTab').append(showBtn1);
    showBtn1.title = '按注册时间筛选，请在左右区间分别输入2008-2019的整数年份';
    //按注册时间筛选
    const ageRange = document.createElement('input');ageRange.addEventListener('blur',Select);ageRange.className = 'textfield';$(ageRange).css({"width":"50px","height":"15px"});document.querySelector('#SecTab').append(ageRange);$(ageRange).hide();
    const ageRange1 = document.createElement('input');ageRange1.addEventListener('blur',Select);ageRange1.className = 'textfield';$(ageRange1).css({"width":"50px","height":"15px"});document.querySelector('#SecTab').append(ageRange1);$(ageRange1).hide();
    //按评分时间排序
    const showBtn2 = document.createElement('a'); showBtn2.addEventListener('click', SortByTime); showBtn2.className = 'chiiBtn'; showBtn2.href='javascript:;'; showBtn2.textContent = '时间排序';document.querySelector('#SecTab').append(showBtn2);
    showBtn2.title = '按评分时间筛选，请在左右区间分别输入和下面列表中相同格式的时间，可以省略 时:分';
    //按评分时间筛选
    const timeRange = document.createElement('input');timeRange.addEventListener('blur',Select);timeRange.className = 'textfield';$(timeRange).css({"width":"80px","height":"15px"});document.querySelector('#SecTab').append(timeRange);$(timeRange).hide();
    const timeRange1 = document.createElement('input');timeRange1.addEventListener('blur',Select);timeRange1.className = 'textfield';$(timeRange1).css({"width":"80px","height":"15px"});document.querySelector('#SecTab').append(timeRange1);$(timeRange1).hide();
    //按是否有头像排序
    const showBtn3 = document.createElement('a'); showBtn3.addEventListener('click', SortByAvatar); showBtn3.className = 'chiiBtn'; showBtn3.href='javascript:;'; showBtn3.textContent = '头像排序';document.querySelector('#SecTab').append(showBtn3);
    showBtn3.title = '按是否有头像筛选，请在左右区间分别输入0或1，0：无头像，1：有头像';
    //按评分时间筛选
    const avatarRange = document.createElement('input');avatarRange.addEventListener('blur',Select);avatarRange.className = 'textfield';$(avatarRange).css({"width":"15px","height":"15px"});document.querySelector('#SecTab').append(avatarRange);$(avatarRange).hide();
    const avatarRange1 = document.createElement('input');avatarRange1.addEventListener('blur',Select);avatarRange1.className = 'textfield';$(avatarRange1).css({"width":"15px","height":"15px"});document.querySelector('#SecTab').append(avatarRange1);$(avatarRange1).hide();

    function ParseStars(starstring){
        let stars = starstring.match(/stars(\d{1,2})/)? starstring.match(/stars(\d{1,2})/)[1]: 0;
        return parseInt(stars);
    }
    function ParseYear(num){
        num = parseInt(num);
        if(num<=1469) return 2008;
        else if(num<=7301) return 2009;
        else if(num<=13990) return 2010;
        else if(num<=65396) return 2011;
        else if(num<=113723) return 2012;
        else if(num<=178767) return 2013;
        else if(num<=226522) return 2014;
        else if(num<=272948) return 2015;
        else if(num<=315386) return 2016;
        else if(num<=391231) return 2017;
        else if(num<=451815) return 2018;
        else return 2019;
    }
    function GetYear(li){
        let id_num = li.querySelector('img.avatar').src.match(/\d+.jpg/);
        let id = li.querySelector('a.avatar').href.split("/")[4].match(/\b\d{1,6}\b/) ?li.querySelector('a.avatar').href.split("/")[4].match(/\b\d{1,6}\b/) :0;
        if(id_num) return ParseYear(id_num);
        else if(id) return ParseYear(id);
        else return 2019;
    }
    function ParseDate(Datestring){
        Datestring = Datestring.replace(/-/g,'/');
        let date= new Date(Datestring);
        let now = new Date();
        return now.getTime()-date.getTime();
    }

    function SortByStars() {
        $(starsRange).show();$(starsRange1).show();
        itemsList = document.querySelectorAll('#memberUserList li.user');
        for(let i=0;i<itemsList.length;i++){
            all[i]=itemsList[i];
            all[i].classList.remove("odd");
        }
        sortstyle = (sortstyle==1)? -1 :1;
        showBtn.textContent = (showBtn.textContent=='评分排序↑') ? '评分排序↓':'评分排序↑';
        let container = document.querySelector('ul#memberUserList');
        let arr = [];
        for(let i=0;i<itemsList.length;i++)        arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('.userContainer .starstop')? ParseStars(li1.querySelector('.userContainer .starstop').classList[0]): 0;
            let n2=li2.querySelector('.userContainer .starstop')? ParseStars(li2.querySelector('.userContainer .starstop').classList[0]): 0;
            return (n1-n2)*sortstyle;});
        for(let i=0; i<arr.length; i++){$('#memberUserList').append(arr[i]); if(i%2==0) arr[i].classList.add("odd");}
        CreateVotesSidePannel();
    }

    function SortByAge() {
        $(ageRange).show();$(ageRange1).show();
        itemsList = document.querySelectorAll('#memberUserList li.user');
        for(let i=0;i<itemsList.length;i++){
            all[i]=itemsList[i];
            all[i].classList.remove("odd");
        }
        sortstyle1 = (sortstyle1==-1)? 1 :-1;
        showBtn1.textContent = (showBtn1.textContent=='注册时间↓') ? '注册时间↑':'注册时间↓';
        let arr = [];
        for(let i=0;i<itemsList.length;i++)        arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1 = GetYear(li1);
            let n2 = GetYear(li2);
            return (n1-n2)*sortstyle1;});
        for(let i=0; i<arr.length; i++){
            $('#memberUserList').append(arr[i]);
            if(i%2==0) arr[i].classList.add("odd");
            if(addedyear) arr[i].querySelector('a.avatar').append('(' + GetYear(arr[i]) + ')');
        }
        addedyear=0;
        CreateYearSidePannel();
    }

    function SortByTime() {
        itemsList = document.querySelectorAll('#memberUserList li.user');
        for(let i=0;i<itemsList.length;i++){
            all[i]=itemsList[i];
            all[i].classList.remove("odd");
        }
        $(timeRange).show();$(timeRange1).show();
        sortstyle3 = (sortstyle3==-1)? 1 :-1;
        showBtn2.textContent = (showBtn2.textContent=='时间排序↓') ? '时间排序↑':'时间排序↓';
        let arr = [];
        for(let i=0;i<itemsList.length;i++)        arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('p.info')? ParseDate(li1.querySelector('p.info').textContent): 0;
            let n2=li2.querySelector('p.info')? ParseDate(li2.querySelector('p.info').textContent): 0;
            return (n1-n2)*sortstyle3;
        });
        for(let i=0; i<arr.length; i++){$('#memberUserList').append(arr[i]); if(i%2==0) arr[i].classList.add("odd");}
    }
    function SortByAvatar() {
        itemsList = document.querySelectorAll('#memberUserList li.user');
        for(let i=0;i<itemsList.length;i++){
            all[i]=itemsList[i];
            all[i].classList.remove("odd");
        }
        $(avatarRange).show();$(avatarRange1).show();
        sortstyle4 = (sortstyle4==-1)? 1 :-1;
        showBtn3.textContent = (showBtn3.textContent=='头像排序↓') ? '头像排序↑':'头像排序↓';
        let arr = [];
        for(let i=0;i<itemsList.length;i++)        arr[i]=itemsList[i];
        arr.sort(function(li1,li2){
            let n1=li1.querySelector('img.avatar').src.match(/\d+.jpg/)? 1: 0;
            let n2=li2.querySelector('img.avatar').src.match(/\d+.jpg/)? 1: 0;
            return (n1-n2)*sortstyle4;
        });
        for(let i=0; i<arr.length; i++){$('#memberUserList').append(arr[i]); if(i%2==0) arr[i].classList.add("odd");}
    }
    function Select(){
        itemsList = all;
        for(let i=0; i<all.length; i++) $('#memberUserList').append(all[i]);
        itemsList.forEach( (elem, index) => {
            let stars = elem.querySelector('.userContainer .starstop')? ParseStars(elem.querySelector('.userContainer .starstop').classList[0]): 0;
            let minstars = starsRange.value !="" ? parseInt(starsRange.value):0;
            let maxstars = starsRange1.value !="" ? parseInt(starsRange1.value):10;
            let time = elem.querySelector('p.info')? ParseDate(elem.querySelector('p.info').textContent): 0;
            let mintime = timeRange.value !="" ? ParseDate(timeRange.value):ParseDate("1000-1-1");
            let maxtime = timeRange1.value !="" ? ParseDate(timeRange1.value):ParseDate("3000-1-1");
            let age =  GetYear(elem);
            let minage = ageRange.value !="" ? parseInt(ageRange.value):2008;
            let maxage = ageRange1.value !="" ? parseInt(ageRange1.value):3000;
            let avatar = elem.querySelector('img.avatar').src.match(/\d+.jpg/) ? 1 : 0;
            let minavatar = avatarRange.value !="" ? parseInt(avatarRange.value):0;
            let maxavatar = avatarRange1.value !="" ? parseInt(avatarRange1.value):1;
            if(stars<minstars || stars>maxstars || time>mintime || time<maxtime || age<minage || age>maxage || avatar<minavatar || avatar>maxavatar )
                $(elem).remove();
        });
        CreateVotesSidePannel();
        CreateYearSidePannel();
    }
    function CreateVotesSidePannel(){
        let AllVotes = [], JsonAllVotes = {},votes = 0,sum = 0;
        itemsList = document.querySelectorAll('#memberUserList li.user');
        itemsList.forEach( (elem, index) => {
            let stars = elem.querySelector('.userContainer .starstop')? ParseStars(elem.querySelector('.userContainer .starstop').classList[0]): 0;
            if(stars){
                votes += 1;
                sum += stars;
            }
            AllVotes = AllVotes.concat(stars);
        });
        let average = parseFloat(sum/votes).toFixed(3);
        for (let i = 0; i < AllVotes.length; i++) {
            JsonAllVotes[AllVotes[i]] = (JsonAllVotes[AllVotes[i]] + 1) || 1;
        }
        if(VotesSidePannel_added) $(VotesSidePannel).remove();
        VotesSidePannel = document.createElement('div');
        VotesSidePannel.id = "ChartWarpper"; VotesSidePannel.align = "center";
        $(VotesSidePannel).append(`<div class="chart_desc"><small class="grey"><span property="v:votes">${votes}</span> votes</small></div>`);
        let chart = document.createElement('ul');
        chart.className = "horizontalChart";
        for(let i=10; i>=1; i--){
            let tagli = document.createElement('li');
            let taglia = document.createElement('a');
            let v_votes = JsonAllVotes[i] ? parseInt(JsonAllVotes[i]) : 0;
            let height = parseFloat(v_votes/votes*100).toFixed(2).toString();
            taglia.title = v_votes + '人评分 '+ height +'%';
            $(taglia).append(`<span class="label">${i}</span><span class="count" style="height: ${height}%;"></span>`);
            tagli.appendChild(taglia);
            chart.appendChild(tagli);
        }
        $(VotesSidePannel).append(`评分统计`);
        $(VotesSidePannel).append($(chart));
        $(VotesSidePannel).append(`平均分：${average}`);
        $('#columnInSubjectB').append($(VotesSidePannel));
        VotesSidePannel_added = 1;
    }
    function CreateYearSidePannel(){
        let AllYears = [], JsonAllYears = {};
        itemsList = document.querySelectorAll('#memberUserList li.user');
        itemsList.forEach( (elem, index) => {
            let year = GetYear(elem);
            AllYears = AllYears.concat(year);
        });
        for (let i = 0; i < AllYears.length; i++) {
            JsonAllYears[AllYears[i]] = (JsonAllYears[AllYears[i]] + 1) || 1;
        }
        if(YearSidePannel_added) $(YearSidePannel).remove();
        YearSidePannel = document.createElement('div');
        YearSidePannel.id = "ChartWarpper"; YearSidePannel.align = "center";
        let chart = document.createElement('ul');
        chart.className = "horizontalChart";

        for(let key in JsonAllYears){
            let tagli = document.createElement('li');
            let taglia = document.createElement('a');
            let old = 0;
            if(parseInt(key)<2010){
                old += parseInt(JsonAllYears[key]);
            }
            else if(parseInt(key)==2010){
                old += parseInt(JsonAllYears[key]);
                let height = parseFloat(old/itemsList.length *100).toFixed(2).toString();
                taglia.title = JsonAllYears[key] + '人'+ height +'%';
                $(taglia).append(`<span class="label">~10</span><span class="count" style="height: ${height}%;"></span>`);
                tagli.appendChild(taglia);
                chart.appendChild(tagli);
            }
            else{
                let height = parseFloat(parseInt(JsonAllYears[key])/itemsList.length *100).toFixed(2).toString();
                taglia.title = JsonAllYears[key] + '人'+ height +'%';
                $(taglia).append(`<span class="label">${key.slice(2)}</span><span class="count" style="height: ${height}%;"></span>`);
                tagli.appendChild(taglia);
                chart.appendChild(tagli);
            }
        }
        $(YearSidePannel).append(`用户注册年份统计`);
        $(YearSidePannel).append($(chart));
        $('#columnInSubjectB').append($(YearSidePannel));
        YearSidePannel_added = 1;
    }

})();
