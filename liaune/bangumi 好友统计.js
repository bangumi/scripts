// ==UserScript==
// @name         bangumi 好友统计
// @namespace    https://bgm.tv/user/liaune
// @version      0.3
// @description  显示好友的最近一条Timeline时间，显示总好友数、活跃好友数，3天内有更新Timeline的：Active，100天内有更新Timeline的：Alive，100天以上没更新Timeline的：M.I.T(Missing In Time)；显示好友的注册时间，08-10：Senior，11-13：Junior，14-16：Sophomore，17-：Freshman；显示好友与自己的共同爱好数量和同步率，根据一定的公式计算出高同步率的好友。
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/user\/.*\/(friends|rev_friends)
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    GM_addStyle(`
.dead{
background-color: rgba(11, 12, 12, 0.8)!important;
color:white;
}
.alive{
background-color: rgba(234, 195, 53, 0.8)!important;
color:red;
}
.active{
background-color: rgba(26, 244, 43, 0.8)!important;
color:white;
}
.senior{
background-color: rgba(253, 62, 80, 0.8)!important;
color:blue;
}
.junior{
background-color: rgba(138, 149, 254, 0.8)!important;
color:blue;
}
.sophomore{
background-color: rgba(138, 254, 185, 0.8)!important;
color:blue;
}
.freshman{
background-color: rgba(255, 214, 218, 0.8)!important;
color:blue;
}
`);
    let active_friends=0, alive_friends=0, dead_friends=0, similar_friends=0,count_simi=0,senior=0,junior=0,sophomore=0,freshman=0,sortstyle=1,update=0,count=0,args=0;
    const itemsList = document.querySelectorAll('#memberUserList  li.user');
    document.querySelector('#friend_flag').innerHTML =itemsList.length+"个好友&nbsp;&nbsp;&nbsp;";
    //统计好友活跃状态
    const showBtn = document.createElement('a');
    showBtn.addEventListener('click', ShowTime.bind(), false);
    showBtn.className = 'chiiBtn';
    showBtn.href='javascript:;';
    showBtn.textContent = '活跃状态';
    document.querySelector('#friend_flag').append(showBtn);
    //统计好友注册时间
    const showBtn1 = document.createElement('a');
    showBtn1.addEventListener('click', showsignup.bind(), false);
    showBtn1.className = 'chiiBtn';
    showBtn1.href='javascript:;';
    showBtn1.textContent = '注册时间';
    document.querySelector('#friend_flag').append(showBtn1);
    //统计好友与自己的同步率
    const showBtn2 = document.createElement('a');
    showBtn2.addEventListener('click', showSimilar.bind(), false);
    showBtn2.className = 'chiiBtn';
    showBtn2.href='javascript:;';
    showBtn2.textContent = '与我的同步率';
    document.querySelector('#friend_flag').append(showBtn2);
    //排序
    const showBtn3 = document.createElement('a');
    showBtn3.addEventListener('click', mySort);
    showBtn3.className = 'chiiBtn';
    showBtn3.href='javascript:;';
    showBtn3.textContent = '排序';
    //更新缓存数据
    const showBtn4 = document.createElement('a');
    showBtn4.addEventListener('click', Update);
    showBtn4.className = 'chiiBtn';
    showBtn4.href='javascript:;';
    showBtn4.textContent = '更新';

    function Update(){
        update=1;
        active_friends=0; alive_friends=0;dead_friends=0;similar_friends=0;count_simi=0;senior=0;junior=0;sophomore=0;freshman=0;
        if(args==1) ShowTime();
        else if(args==2) showsignup();
        else if(args==3) showSimilar();

    }

    function mySort() {
        sortstyle = (sortstyle==1)? -1 :1;
        showBtn3.textContent = (showBtn3.textContent=='倒序') ? '正序':'倒序';
        var container = document.querySelector('ul#memberUserList');
        if (container) container.style.cssText = 'display: flex; flex-flow: row wrap;';

        function myParseDate (dateString) {
            if(dateString.match(/\d{4}/)){
                let date = new Date(dateString);
                let now = new Date();
                return now.getTime()-date.getTime();}
            else if(dateString.match(/%/)){
                let Percent = dateString.match(/(\d{1,2}\.\d{1,2})%/)[1];
                let Similar = dateString.match(/(\d+)/)[1];
                let Similarity = Percent / (170*Math.pow(Similar,-0.35));
                return parseInt(Similarity*100);}
            else{
                let d = dateString.match(/(\d{1,2})d/)?dateString.match(/(\d{1,2})d/)[1]:0;
                let h = dateString.match(/(\d{1,2})h/)?dateString.match(/(\d{1,2})h/)[1]:0;
                let m = dateString.match(/(\d{1,2})m/)?dateString.match(/(\d{1,2})m/)[1]:0;
                let time=d*24*60*60*1000+h*60*60*1000+m*60*1000;
                return time;
            }
        }
        [].slice.call(document.querySelectorAll('li.user span.rank:last-child small'), 0)
            .map(x => [x.textContent, x])
            .sort((x,y) => (myParseDate(x[0]) - myParseDate(y[0]))*sortstyle)
            .forEach((x,n) => x[1].parentNode.parentNode.parentNode.style.order = n);
    }

    function showsignup(){
        showBtn1.style.display="none";
        showBtn3.style.display="none";
        args=2;
        if(!update) showBtn4.style.display="none";
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.avatar').href;
            let ID = href.split('/user/')[1];
            if(localStorage.getItem('User'+ID+'Signtime') && !update)
                Displaysignup(localStorage.getItem('User'+ID+'Signtime'));
            else{
                fetch(href,{credentials: "include"})
                    .then( data => data.text() )
                    .then(targetStr => {
                    let myMatch = targetStr.match(/Bangumi<\/span> <span class="tip">(\d{4}-\d{1,2}-\d{1,2}) 加入<\/span><\/li>/);
                    let signtime = myMatch ? myMatch[1].toString() : null;
                    if(signtime) localStorage.setItem('User'+ID+'Signtime',signtime);
                    if(!update) Displaysignup(signtime);
                    else{
                        count+=1;
                        showBtn4.textContent='更新中... (' + count + '/' + itemsList.length +')';
                        if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}
                    }

                });
            }
            function Displaysignup(signtime){
                let signuptime = document.createElement('span');
                signuptime.className = 'rank';

                let year = signtime.match(/\d{4}/);
                if(year<=2010){signuptime.classList.add('senior');senior+=1;}
                else if(year<=2013){signuptime.classList.add('junior');junior+=1;}
                else if(year<=2016){signuptime.classList.add('sophomore');sophomore+=1;}
                else {signuptime.classList.add('freshman');freshman+=1;}

                signuptime.innerHTML = `<p></p><small>${signtime}</small>`;
                document.querySelector('#friend_flag').childNodes[0].nodeValue =itemsList.length+"个好友   "+" Senior:"+senior+" Junior:"+junior+" Sophomore:"+sophomore+" Freshman:"+freshman+" ";
                document.querySelectorAll('#memberUserList  li.user div.userContainer')[index].append(signuptime);
                if((senior+junior+sophomore+freshman)==itemsList.length){
                    showBtn3.textContent = '排序';
                    showBtn3.style.display="inline-block";
                    document.querySelector('#friend_flag').append(showBtn3);
                    showBtn4.style.display="inline-block";
                    document.querySelector('#friend_flag').append(showBtn4);}
            }

        });

    }

    function ShowTime(){
        showBtn.style.display="none";
        showBtn3.style.display="none";
        args=1;
        if(!update) showBtn4.style.display="none";
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.avatar').href;
            let ID = href.split('/user/')[1];
            if(localStorage.getItem('User'+ID+'Lasttime') && !update)
                DisplayTime(localStorage.getItem('User'+ID+'Lasttime'));
            else{
                fetch(href,{credentials: "include"})
                    .then( data => data.text() )
                    .then(targetStr => {
                    let myMatch = targetStr.match(/small class="time">(.+?)<\/small><\/li>/);
                    let lasttime = myMatch ? myMatch[1] : null;
                    if(lasttime)  localStorage.setItem('User'+ID+'Lasttime',lasttime);
                    if(!update) DisplayTime(lasttime);

                    else{
                        count+=1;
                        showBtn4.textContent='更新中... (' + count + '/' + itemsList.length +')';
                        if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}
                    }

                });
            }
            function DisplayTime(lasttime){
                let myMatch2 = lasttime.match(/\d{4}/);
                let activtime = document.createElement('span');
                activtime.className = 'rank';
                if (myMatch2) {
                    let date = new Date(lasttime);
                    let now = new Date();
                    let durtime = parseInt((now.getTime() - date.getTime())/(24 * 60 * 60 * 1000));
                    if(durtime>=100){ activtime.classList.add('dead'); dead_friends+=1;}
                    else { activtime.classList.add('alive'); alive_friends+=1;}
                }
                else {
                    activtime.classList.add('active');
                    active_friends+=1;
                }
                if(!lasttime) {
                    activtime.classList.add('dead');
                    dead_friends+=1;
                }
                activtime.innerHTML = `<p></p><small>${lasttime}</small>`;
                document.querySelector('#friend_flag').childNodes[0].nodeValue =itemsList.length+"个好友   "+" Active:"+active_friends+" Alive:"+alive_friends+" M.I.T:"+dead_friends+" ";
                document.querySelectorAll('#memberUserList  li.user div.userContainer')[index].append(activtime);
                if((dead_friends+alive_friends+active_friends)==itemsList.length){
                    showBtn3.textContent = '排序';
                    showBtn3.style.display="inline-block";
                    document.querySelector('#friend_flag').append(showBtn3);
                    showBtn4.style.display="inline-block";
                    document.querySelector('#friend_flag').append(showBtn4);}
            }
        });
    }

    function showSimilar(){
        showBtn2.style.display="none";
        showBtn3.style.display="none";
        args=3;
        if(!update) showBtn4.style.display="none";
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.avatar').href;
            let ID = href.split('/user/')[1];
            if(localStorage.getItem('User'+ID+'Similarity') && !update)
                DisplaySimilar(localStorage.getItem('User'+ID+'Similarity'),localStorage.getItem('User'+ID+'Similarity_percent'));
            else{
                fetch(href,{credentials: "include"})
                    .then(data => {
                    return new Promise(function (resovle, reject) {
                        let targetStr = data.text();
                        resovle(targetStr);
                    });
                })
                    .then(targetStr => {
                    let Similar = targetStr.match(/<small class="hot">\/ (\d{1,3})个共同喜好<\/small>/);
                    let Similarity = Similar ? Similar[1]: null;
                    if(Similarity) localStorage.setItem('User'+ID+'Similarity',Similarity);
                    let Similar_percent = targetStr.match(/<span class="percent_text rr">((-?\d+)(\.\d+)?)%<\/span>/);
                    let Similarity_percent = Similar_percent ? Similar_percent[1] : null;
                    if(Similarity_percent) localStorage.setItem('User'+ID+'Similarity_percent',Similarity_percent);
                    if(!update) DisplaySimilar(Similarity,Similarity_percent);
                    else{
                        count+=1;
                        showBtn4.textContent='更新中... (' + count + '/' + itemsList.length +')';
                        if(count==itemsList.length){ location.reload(); showBtn4.textContent='更新完毕！';}
                    }

                });}
            function DisplaySimilar(Similarity,Similarity_percent){
                let show_similar =  document.createElement('span');
                show_similar.className = 'rank';
                if(Similarity>=20 && Similarity_percent >= 170*Math.pow(Similarity,-0.35)) {
                    show_similar.style.color='blue';
                    show_similar.style.fontWeight='bold';
                    similar_friends+=1;
                }
                let show_similarity = ''+Similarity+' / '+Similarity_percent+'%';
                show_similar.innerHTML = `<p></p><small>${show_similarity}</small>`;
                document.querySelector('#friend_flag').childNodes[0].nodeValue =itemsList.length+"个好友   "+" 和我同步率高的好友:"+similar_friends;
                document.querySelectorAll('#memberUserList  li.user div.userContainer')[index].append(show_similar);
                count_simi+=1;
                if(count_simi==itemsList.length){
                    showBtn3.textContent = '排序';
                    showBtn3.style.display="inline-block";
                    document.querySelector('#friend_flag').append(showBtn3);
                    showBtn4.style.display="inline-block";
                    document.querySelector('#friend_flag').append(showBtn4);}
            }
        });
    }
})();
