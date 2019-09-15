// ==UserScript==
// @name         Bangumi Character ICO Check
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.2
// @description  检测角色的小圣杯状态，已上市的角色显示市场价，正在ICO的角色显示已募集金额
// @author       Liaune
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*
// @grant        none
// ==/UserScript==
let api = 'https://www.tinygrail.com/api/';
let characterlist;
let i=0;
let showBtn = document.createElement('a');
showBtn.className = 'chiiBtn';
showBtn.href='javascript:;';
showBtn.textContent = 'ICO检测';
$(showBtn).css({"font-size":"12px","margin-left":"5px"});
showBtn.addEventListener('click', checkup);
if(document.location.href.match(/mono\/character/)){
    characterlist = document.querySelectorAll('#columnA .section ul li');
    document.querySelector('#columnA .section h2').append(showBtn);
}
else if(document.location.href.match(/subject\/\d+\/characters/)){
    characterlist = document.querySelectorAll('#columnInSubjectA .clearit h2');
    document.querySelector('#columnInSubjectB').append(showBtn);
}
else if(document.location.href.match(/subject\/\d+/)){
    characterlist = document.querySelectorAll('#browserItemList .user');
    document.querySelector('#columnSubjectHomeB .subject_section h2 ').append(showBtn);
}
else if(document.location.href.match(/character/)){
    characterlist = document.querySelectorAll('#columnCrtBrowserB .browserCrtList h3');
    document.querySelector('#columnCrtBrowserB .crtTools').append(showBtn);
}

function checkICO(elem,id) {
    let url = api + `chara/`+id;
    $.get(url, function (d, s) {
        $(elem.querySelector('a.l')).css({"font-size":"13px"});
        if(d.State==0){
            if(d.Value.Current){
                elem.querySelector('a.l').style.color = '#fa8792';
                $(elem.querySelector('a.l')).append( '₵'+d.Value.Current);
            }
            else{
                elem.querySelector('a.l').style.color = '#eefa87';
                $(elem.querySelector('a.l')).append( '₵'+d.Value.Total);
            }
        }
    });
}
function checkup(){
    let timer= setInterval(function(){
        let elem = characterlist[i];
        let href = elem.querySelector('a.l').href;
        let id = href.split('/character/')[1].toString();
        checkICO(elem,id);
        i++;
        if(i >= characterlist.length){
            clearInterval(timer);
        }
    },300);
}
