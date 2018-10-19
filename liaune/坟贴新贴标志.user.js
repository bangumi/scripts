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
    let newest= 0;
    itemsList.forEach( (elem, index) => {
      let topic = elem.querySelector('.inner a.avatar');
      let id = topic.href.split('/group/')[1]; 
      if(parseInt(id)>newest) newest = parseInt(id);
    });
    itemsList.forEach( (elem, index) => {
      let topic = elem.querySelector('.inner a.avatar');
      let id = topic.href.split('/group/')[1]; 
      if(parseInt(id)<newest-1000) 
        $(`<span style="color: white;background-color:black;border-radius: 4px;">坟</span>`).insertAfter(elem.querySelector('.inner small'));
      else if(parseInt(id)>=newest-5)
        $(`<span style="color: white;background-color:#ff3ba1;border-radius: 4px;">新</span>`).insertAfter(elem.querySelector('.inner small'));
    });
  }
  
})();
