// ==UserScript==
// @name         只看未完成条目
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.4
// @description  显示列表条目的完成状态，以不同的颜色区分。只看未完成条目，隐藏已完成和抛弃的列表条目，再次点击可完全显示。
// @author       Liaune
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
.subject_wish{
border-color: #fd59a9;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.subject_collect{
border-color: #3838e6;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.subject_do{
border-color: #15d748;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.subject_on_hold{
border-color: #f6af45;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.subject_dropped{
border-color: #5a5855;
border-style: solid;
border-width:2px;
border-radius: 4px
}
`);
(function() {

    let itemsList = document.querySelectorAll('#browserItemList li.item');
    let see =0;

    const showBtn = document.createElement('li');
    const select = document.createElement('a');
    select.style.backgroundImage="url(//bgm.tv/img/ico/ico_eye.png)";
    select.style.backgroundSize= "100% 200%";
    select.addEventListener('click', GetInfo);
    select.href='javascript:;';
    document.querySelector('#browserTypeSelector').insertBefore(showBtn, document.querySelectorAll('#browserTypeSelector li')[0]);
    showBtn.appendChild(select);

    function GetInfo(){
        itemsList = document.querySelectorAll('#browserItemList li.item');

        see = (see==1)? 0 :1;
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let href1 = href.replace(/subject/,"update");
            let ID = href.split('/subject/')[1];
            if(localStorage.getItem(ID+'Interest')=='collect' || localStorage.getItem(ID+'Interest')=='dropped')
                DisplayCollect(localStorage.getItem(ID+'Interest'),elem);
            else  ShowCollect(href1,elem);
        });

        let thisItem = window.location.href.replace(/subject/,"update");
        fetch(thisItem,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/"GenInterestBox\('(\S+?)'\)" checked="checked"/);
            let interest = Match ? Match[1] : null;
            let ID = thisItem.split('/update/')[1];
            if(Match)  localStorage.setItem(ID+'Interest',interest);
        });
    }

    function ShowCollect(href,elem){
        fetch(href,{credentials: "include"})
            .then(data => {
            return new Promise(function (resovle, reject) {
                let targetStr = data.text();
                resovle(targetStr);
            });
        })
            .then(targetStr => {
            let Match = targetStr.match(/"GenInterestBox\('(\S+?)'\)" checked="checked"/);
            let interest = Match ? Match[1] : null;
            let ID = href.split('/update/')[1];
            if(Match)  localStorage.setItem(ID+'Interest',interest);
            DisplayCollect(interest,elem);
        });
    }

    function DisplayCollect(interest,elem){
        let avatarNeue = elem.querySelector('a.subjectCover');
        if(see) {
          select.style.backgroundPosition= "bottom left";}
        else  {
          select.style.backgroundPosition= "top left";}
        if(interest=='wish'){
            avatarNeue.classList.add('subject_wish');
        }
        else if(interest=='collect'){
             avatarNeue.classList.add('subject_collect');
             if(see) {$(elem).hide(); }
             else  {$(elem).show();  }
        }
        else if(interest=='do'){
            avatarNeue.classList.add('subject_do');
        }
        else if(interest=='on_hold'){
            avatarNeue.classList.add('subject_on_hold');
        }
        else if(interest=='dropped'){
           avatarNeue.classList.add('subject_dropped');
           if(see) {$(elem).hide();}
            else  {$(elem).show();}
        }
    }

})();
