// ==UserScript==
// @name         坟贴/新贴标志
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.0
// @description  在超展开小组页面显示坟贴标志
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/.*
// @grant        none
// ==/UserScript==

(function() {
  if(location.href.match(/rakuen/)){
    let itemsList = document.querySelectorAll('#eden_tpc_list li');
    let newest1 = 0,newest2 = 0;
    itemsList.forEach( (elem, index) => {
      let topic = elem.querySelector('.inner a.avatar');
      let id_group = topic.href.split('/group/')[1];
      let id_subject = topic.href.split('/subject/')[1];
      if(parseInt(id_group)>newest1) newest1 = parseInt(id_group);
      if(parseInt(id_subject)>newest2) newest2 = parseInt(id_subject);
    });
    itemsList.forEach( (elem, index) => {
      let topic = elem.querySelector('.inner a.avatar');
      let id_group = topic.href.split('/group/')[1];
      let id_subject = topic.href.split('/subject/')[1];
      let num = elem.querySelector('.inner small').innerText.match(/\d+/);
      if(parseInt(id_group)<newest1-1000 || parseInt(id_subject)<newest2-1000) 
        $(`<span style="color: white;background-color:black;border-radius: 4px;">坟</span>`).insertAfter(elem.querySelector('.inner small'));
      else if(parseInt(id_group)>=newest1-5 || parseInt(id_subject)>=newest2-5)
        $(`<span style="color: white;background-color:#ff3ba1;border-radius: 4px;">新</span>`).insertAfter(elem.querySelector('.inner small'));
      if((parseInt(id_group)>=newest1-600 || parseInt(id_subject)>=newest2-600) && parseInt(num)>100)
        $(`<span style="color: white;background-color:red;border-radius: 4px;">火</span>`).insertAfter(elem.querySelector('.inner small'));
    });
  }
  
})();
