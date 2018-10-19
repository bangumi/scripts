// ==UserScript==
// @name         bangumi条目角色显示增强
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.0
// @description  显示条目页面角色的收藏情况
// @author       Liaune
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
.Collect{
-webkit-box-shadow: 1px 0px 1px 1px #ff0000;
-moz-box-shadow: 1px 0px 1px 1px #ff0000;
box-shadow: 1px 0px 1px 1px rgba(185, 195, 38, 0.7);
border-color: red;
border-style: solid;
border-width: 2px;
border-radius: 5px;
}
`);
(function() {
    let localData = localStorage.getItem('bgm_user_detail_by_yonjar');
    if (!localData) {
        return console.warn('此功能依赖user_detail.user.js, 请先安装');
    }

    let userDetail = JSON.parse(localData);
    let charactersList = userDetail.characters;
    let personsList = userDetail.persons;

    let charasList = document.querySelectorAll('#browserItemList li a.avatar');
    charasList.forEach( (elem, index) => {
        let charaId = elem.href.split('/character/')[1];
        if (charactersList.includes(charaId)){
            elem.style.background="rgb(140, 244, 244)";
            elem.style.color="#0000ff";
            elem.querySelector('span.userImage').classList.add('Collect');
        }
    });
    let cvList = document.querySelectorAll('#browserItemList li span.tip_j');
    cvList.forEach( (elem, index) => {
        if(!elem.querySelector('a')) return;
        let personID = elem.querySelector('a').href.split('/person/')[1];
        if (personsList.includes(personID)){
            elem.querySelector('a').style.background="rgb(140, 244, 244)";
            elem.querySelector('a').style.color="#0000ff";
        }
    });
    let staffList = document.querySelectorAll('#infobox li a');
    staffList.forEach( (elem, index) => {
        let personID = elem.href.split('/person/')[1];
        if (personsList.includes(personID)){
            elem.style.background="rgb(140, 244, 244)";
            elem.style.color="#0000ff";
        }
    });
})();
