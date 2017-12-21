// ==UserScript==
// @name         bangumi 好友统计
// @namespace    https://bgm.tv/user/liaune
// @version      0.2.0
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
    var active_friends=0, alive_friends=0, dead_friends=0, similar_friends=0,senior=0,junior=0,sophomore=0,freshman=0;
    var itemsList = document.querySelectorAll('#memberUserList  li.user');
    document.querySelector('#friend_flag').innerHTML =itemsList.length+"个好友&nbsp;&nbsp;&nbsp;";
    //统计好友活跃状态
    var showBtn = document.createElement('a');
    showBtn.addEventListener('click', ShowTime.bind(), false);
    showBtn.className = 'chiiBtn';
    showBtn.href='javascript:;';
    showBtn.textContent = '活跃状态';
    document.querySelector('#friend_flag').append(showBtn);
    //统计好友注册时间
    var showBtn1 = document.createElement('a');
    showBtn1.addEventListener('click', showsignup.bind(), false);
    showBtn1.className = 'chiiBtn';
    showBtn1.href='javascript:;';
    showBtn1.textContent = '注册时间';
    document.querySelector('#friend_flag').append(showBtn1);
    //统计好友与自己的同步率
    var showBtn2 = document.createElement('a');
    showBtn2.addEventListener('click', showSimilar.bind(), false);
    showBtn2.className = 'chiiBtn';
    showBtn2.href='javascript:;';
    showBtn2.textContent = '与我的同步率';
    document.querySelector('#friend_flag').append(showBtn2);

    function showsignup(){
        itemsList.forEach( (elem, index) => {
            /*let href = elem.querySelector('img.avatar').src;
            let ID = href.match(/\/(\d{1,6}).jpg/)? parseInt(href.match(/\/(\d{1,6}).jpg/)[1]):'NULL';
            if(ID<10000){
                elem.querySelector('a').style.background="rgb(244, 140, 207)";
                elem.querySelector('a').style.color="rgb(11, 11, 242)";
            }
            else if(ID<100000){
                elem.querySelector('a').style.background="rgb(140, 244, 244)";
                elem.querySelector('a').style.color="#0000ff";
            }*/
            let href = elem.querySelector('a.avatar').href;
            fetch(href,{credentials: "include"})
                .then( data => data.text() )
                .then(targetStr => {
                var signtime;
                let signuptime = document.createElement('span');
                let myMatch = targetStr.match(/Bangumi<\/span> <span class="tip">(\d{4}-\d{1,2}-\d{1,2}) 加入<\/span><\/li>/);
                signuptime.className = 'rank';
                if (myMatch) {
                    signtime = myMatch[1].toString();
                    let year = signtime.match(/\d{4}/);
                    if(year<=2010){signuptime.classList.add('senior');senior+=1;}
                    else if(year<=2013){signuptime.classList.add('junior');junior+=1;}
                    else if(year<=2016){signuptime.classList.add('sophomore');sophomore+=1;}
                    else {signuptime.classList.add('freshman');freshman+=1;}
                }
                signuptime.innerHTML = `<p></p><small>${signtime}</small>`;
                document.querySelector('#friend_flag').innerHTML =itemsList.length+"个好友&nbsp;&nbsp;&nbsp;"+"&nbsp;Senior:"+senior+"&nbsp;Junior:"+junior+"&nbsp;Sophomore:"+sophomore+"&nbsp;Freshman:"+freshman;
                document.querySelectorAll('#memberUserList  li.user div.userContainer')[index].append(signuptime);
            });
        });
    }

    function ShowTime(){
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.avatar').href;
            fetch(href,{credentials: "include"})
                .then( data => data.text() )
                .then(targetStr => {
                var lasttime;
                let activtime = document.createElement('span');
                let myMatch = targetStr.match(/small class="time">(.+?)<\/small><\/li>/);
                activtime.className = 'rank';
                if (myMatch) {
                    let timeline = myMatch[1].toString();
                    lasttime = myMatch[1];
                    let myMatch2 = lasttime.match(/\d{4}/);
                    if (myMatch2) {
                        var date = new Date(lasttime);
                        var now = new Date();
                        var durtime = parseInt((now.getTime() - date.getTime())/(24 * 60 * 60 * 1000));
                        if(durtime>=100){ activtime.classList.add('dead'); dead_friends+=1;}
                        else { activtime.classList.add('alive'); alive_friends+=1;}
                    }
                    else {
                        activtime.classList.add('active');
                        active_friends+=1;
                    }
                }
                else {
                    lasttime = 'N/A';
                    activtime.classList.add('dead');
                    dead_friends+=1;
                }
                activtime.innerHTML = `<p></p><small>${lasttime}</small>`;
                document.querySelector('#friend_flag').innerHTML =itemsList.length+"个好友&nbsp;&nbsp;&nbsp;"+"&nbsp;Active:"+active_friends+"&nbsp;Alive:"+alive_friends+"&nbsp;M.I.T:"+dead_friends;
                document.querySelectorAll('#memberUserList  li.user div.userContainer')[index].append(activtime);
            });
        });
    }

    function showSimilar(){
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.avatar').href;
            fetch(href,{credentials: "include"})
                .then(data => {
                return new Promise(function (resovle, reject) {
                    let targetStr = data.text();
                    resovle(targetStr);
                });
            })
                .then(targetStr => {
                let Similar = targetStr.match(/<small class="hot">\/ (\d{1,3})个共同喜好<\/small>/);
                let Similarity = Similar ? Similar[1]:'NULL';
                let Similar_percent = targetStr.match(/<span class="percent_text rr">((-?\d+)(\.\d+)?)%<\/span>/);
                let Similarity_percent = Similar_percent ? Similar_percent[1] : 'NULL';
                let show_similar =  document.createElement('span');
                show_similar.className = 'rank';
                if(Similarity>=20 && Similarity_percent >= 170*Math.pow(Similarity,-0.35)) {
                    show_similar.style.color='blue';
                    show_similar.style.fontWeight='bold';
                    similar_friends+=1;
                }
                let show_similarity = ''+Similarity+'&nbsp;/&nbsp;'+Similarity_percent+'%';
                show_similar.innerHTML = `<p></p><small></small>${show_similarity}`;
                document.querySelector('#friend_flag').innerHTML =itemsList.length+"个好友&nbsp;&nbsp;&nbsp;"+"&nbsp;和我同步率高的好友:"+similar_friends;
                document.querySelectorAll('#memberUserList  li.user div.userContainer')[index].append(show_similar);
            });
        });
    }
})();