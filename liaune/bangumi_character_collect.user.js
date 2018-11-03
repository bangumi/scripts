// ==UserScript==
// @name         角色收藏
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.3.1
// @description  收藏并将角色收藏添加到 bgm_user_detail_by_yonjar
// @author       Liaune
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    GM_addStyle(`
    .Collect{
-webkit-box-shadow: 1px 0px 1px 1px #ff0000;
-moz-box-shadow: 1px 0px 1px 1px #ff0000;
box-shadow: 1px 0px 1px 1px rgba(185, 195, 38, 0.7);
border-color: #fd8a95;
border-style: solid;
border-width: 2px;
border-radius: 5px;
}
`);
(function() {
    let localData,securitycode,UID;
    let now = new Date();
    UID=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    securitycode = $('#badgeUserPanel a')[11].href.split('/logout/')[1].toString();
    if(!localStorage.getItem('bgm_user_detail_by_yonjar'))
        localData = {characters:[],friends:[],groups:[],persons:[],uid:UID,updateTime: now.getTime()};
    else
        localData= JSON.parse(localStorage.getItem('bgm_user_detail_by_yonjar'));
    if(document.location.href.match(/character\/\d+/)){
        let showBtn = document.querySelector('#headerSubject .subjectNav .navTabs li.collect .collect a');
        let charaId = document.location.href.match(/character\/(\d+)/)[1].toString();
        showBtn.href = 'javascript:;';
        showBtn.addEventListener('click', function(){
            if(localData.characters.indexOf(charaId)== -1){
                localData.characters.push(charaId);
                let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                showBtn.className='break';showBtn.textContent='取消收藏';}
            else{
                localData.characters.splice(localData.characters.indexOf(charaId),1);
                let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                showBtn.className='';showBtn.textContent='加入收藏';}
            localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
    }
    if(document.location.href.match(/person\/\d+/)){
        let showBtn = document.querySelector('#headerSubject .subjectNav .navTabs li.collect .collect a');
        showBtn.href = 'javascript:;';
        let personID = document.location.href.match(/person\/(\d+)/)[1].toString();
        showBtn.addEventListener('click', function(){
            if(localData.persons.indexOf(personID)== -1){
                localData.persons.push(personID);
                let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                showBtn.className='break';showBtn.textContent='取消收藏';}
            else{
                localData.persons.splice(localData.persons.indexOf(personID),1);
                let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                showBtn.className='';showBtn.textContent='加入收藏';}
            localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
    }
    if(document.location.href.match(/mono\/character/)){
        let showBtn = document.createElement('a');
        showBtn.className = 'chiiBtn';
        showBtn.href='javascript:;';
        showBtn.textContent = '收藏';
        $(showBtn).css({"font-size":"12px"});
        document.querySelector('#columnA .section h2').append(showBtn);
        showBtn.addEventListener('click', function (){
            let characterlist = document.querySelectorAll('#columnA .section ul li');
            characterlist.forEach( (elem, index) => {
                let href = elem.querySelector('a.l').href;
                let ID = href.split('/character/')[1].toString();
                if(localData.characters.indexOf(ID) == -1) localData.characters.push(ID);
            });
            showBtn.textContent = '收藏成功！';
            localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
        });
    }
    if(document.location.href.match(/mono\/person/)){
        let showBtn = document.createElement('a');
        showBtn.className = 'chiiBtn';
        showBtn.href='javascript:;';
        showBtn.textContent = '收藏';
        $(showBtn).css({"font-size":"12px"});
        document.querySelector('#columnA .section h2').append(showBtn);
        showBtn.addEventListener('click', function (){
            let characterlist = document.querySelectorAll('#columnA .section ul li');
            characterlist.forEach( (elem, index) => {
                let href = elem.querySelector('a.l').href;
                let ID = href.split('/person/')[1].toString();
                if(localData.persons.indexOf(ID) == -1) localData.persons.push(ID);
            });
            showBtn.textContent = '收藏成功！';
            localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
        });
    }
    if(document.location.href.match(/subject\/\.*/)){
        let charasList = document.querySelectorAll('#browserItemList li a.avatar');
        charasList.forEach( (elem, index) => {
            let charaId = elem.href.split('/character/')[1].toString();
            if (localData.characters.indexOf(charaId) == -1){
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"grey"});
                $(elem).append(showBtn);
                let flag = 0;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.characters.push(charaId);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.characters.splice(localData.characters.indexOf(charaId),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
            else{
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"red"});
                $(elem).append(showBtn);
                elem.style.color="#0000ff";
                elem.querySelector('span.userImage').classList.add('Collect');
                let flag = 1;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.characters.push(charaId);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.characters.splice(localData.characters.indexOf(charaId),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
        });
        let cvList = document.querySelectorAll('#browserItemList li span.tip_j a');
        cvList.forEach( (elem, index) => {
            let personID = elem.href.split('/person/')[1].toString();
            if (localData.persons.indexOf(personID) == -1){
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"grey"});
                $(elem).append(showBtn);
                let flag = 0;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.persons.push(personID);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.persons.splice(localData.persons.indexOf(personID),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
            else{
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"red"});
                elem.style.color="#0000ff";
                $(elem).append(showBtn);
                let flag = 1;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.persons.push(personID);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.persons.splice(localData.persons.indexOf(personID),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
        });
      let staffList = document.querySelectorAll('#infobox li a');
      staffList.forEach( (elem, index) => {
        let personID = elem.href.split('/person/')[1];
        if (localData.persons.includes(personID)){
            elem.style.background="rgb(140, 244, 244)";
            elem.style.color="#0000ff";
        }
      });
    }
    if(window.location.href.match(/characters/)){
        let charasList = document.querySelectorAll('#columnInSubjectA .light_odd');
        charasList.forEach( (elem, index) => {
            let chara = elem.querySelectorAll('.clearit h2 a')[0];
            let charaId = chara.href.split('/character/')[1].toString();
            if (localData.characters.indexOf(charaId) == -1){
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"grey"});
                $(chara).append(showBtn);
                let flag = 0;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.characters.push(charaId);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.characters.splice(localData.characters.indexOf(charaId),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
            else{
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"red"});
                $(chara).append(showBtn);
                let flag = 1;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.characters.push(charaId);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.characters.splice(localData.characters.indexOf(charaId),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
        });

        let cvList = document.querySelectorAll('.clearit .actorBadge');
        cvList.forEach( (elem,index)=> {
            let cv = elem.querySelectorAll('p a')[0];
            let personID = cv.href.split('/person/')[1].toString();
            if (localData.persons.indexOf(personID) == -1){
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"grey"});
                $(cv).append(showBtn);
                let flag = 0;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.persons.push(personID);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.persons.splice(localData.persons.indexOf(personID),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
            else{
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"red"});
                $(cv).append(showBtn);
                let flag = 1;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.persons.push(personID);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.persons.splice(localData.persons.indexOf(personID),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
        });
    }
    if(document.location.href.match(/character/)){
        let charasList = document.querySelectorAll('#columnCrtBrowserB .browserCrtList h3 a');
        charasList.forEach( (elem, index) => {
            let charaId = elem.href.split('/character/')[1].toString();
            if (localData.characters.indexOf(charaId) == -1){
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"grey"});
                $(elem).append(showBtn);
                let flag = 0;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.characters.push(charaId);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.characters.splice(localData.characters.indexOf(charaId),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
            else{
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"red"});
                $(elem).append(showBtn);
                let flag = 1;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.characters.push(charaId);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.characters.splice(localData.characters.indexOf(charaId),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/character/"+charaId+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
        });
    }
    if(document.location.href.match(/person/)){
        let cvList = document.querySelectorAll('#columnCrtBrowserB .browserCrtList h3 a');
        cvList.forEach( (elem, index) => {
            let personID = elem.href.split('/person/')[1].toString();
            if (localData.persons.indexOf(personID) == -1){
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"grey"});
                $(elem).append(showBtn);
                let flag = 0;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.persons.push(personID);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.persons.splice(localData.persons.indexOf(personID),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
            else{
                let showBtn = document.createElement('a');
                showBtn.className = 'l';
                showBtn.href='javascript:;';
                showBtn.textContent = '❤';
                $(showBtn).css({"font-size":"12px","color":"red"});
                $(elem).append(showBtn);
                let flag = 1;
                showBtn.addEventListener('click', function(){
                    flag = flag==1?0:1;
                    if(flag){
                        localData.persons.push(personID);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"red"});}
                    else{
                        localData.persons.splice(localData.persons.indexOf(personID),1);
                        let xmlhttp=new XMLHttpRequest();xmlhttp.open("GET","https://bgm.tv/person/"+personID+"/erase_collect?gh="+securitycode+"",true);xmlhttp.send();
                        $(showBtn).css({"font-size":"12px","color":"grey"});}
                    localStorage.setItem('bgm_user_detail_by_yonjar',JSON.stringify(localData));
                });
            }
        });
    }

})();
