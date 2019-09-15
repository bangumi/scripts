// ==UserScript==
// @name         Bangumi Character ICO Check
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.3
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
if(document.location.href.match(/mono\/character/))
    document.querySelector('#columnA .section h2').append(showBtn);
else if(document.location.href.match(/subject\/\d+\/characters/))
    document.querySelector('#columnInSubjectB').append(showBtn);
else if(document.location.href.match(/subject\/\d+/))
    document.querySelector('#columnSubjectHomeB .subject_section h2 ').append(showBtn);
else if(document.location.href.match(/character/))
    document.querySelector('#columnCrtBrowserB .crtTools').append(showBtn);

function postData(url, data, callback) {
  var d = JSON.stringify(data);
  if (!url.startsWith('http'))
    url = api + url;
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: d,
    xhrFields: { withCredentials: true },
    success: callback
  });
}

function checkup(){
    let ids = [];
    let list = {};
    if(document.location.href.match(/mono\/character/))
        characterlist = document.querySelectorAll('#columnA .section ul li');
    else if(document.location.href.match(/subject\/\d+\/characters/))
        characterlist = document.querySelectorAll('#columnInSubjectA .clearit h2');
    else if(document.location.href.match(/subject\/\d+/))
        characterlist = document.querySelectorAll('#browserItemList .user');
    else if(document.location.href.match(/character/))
        characterlist = document.querySelectorAll('#columnCrtBrowserB .browserCrtList h3');

    characterlist.forEach( (elem, index) => {
        let href = elem.querySelector('a.l').href;
        let id = href.split('/character/')[1].toString();
        ids.push(parseInt(id));
        list[id] = elem;
    });
    postData('chara/list', ids, function (d, s) {
    if (d.State === 0) {
        for (i = 0; i < d.Value.length; i++) {
            var item = d.Value[i];
            if (item.CharacterId) {
                var id = item.CharacterId;
                list[id].querySelector('a.l').style.color = '#eefa87';
                $(list[id].querySelector('a.l')).append( '₵'+d.Value[i].Total);
            }
            else{
                var id = item.Id;
                list[id].querySelector('a.l').style.color = '#fa8792';
                $(list[id].querySelector('a.l')).append( '₵'+d.Value[i].Current);
            }
        }
    }
  });
}
