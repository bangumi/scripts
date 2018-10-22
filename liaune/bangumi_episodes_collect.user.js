// ==UserScript==
// @name         Bangumi episodes collect
// @namespace    https://github.com/bangumi/scripts/edit/master/liaune
// @version      1.1
// @description  在章节页面标题后面添加收藏到自己的目录的图标，将动画、音乐、三次元的章节收藏到对应的目录，使用之前请先定义目录地址。（取消收藏并不能将章节从目录中移除，要移除需要前往目录删除）
// @author       Liaune
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*
// @grant        none
// ==/UserScript==

(function() {
    ////////////////先定义动画、音乐、三次元收藏目录//////////////////////
    let ep_index = {"ep_anime":"https://bgm.tv/index/24971",
                    "ep_music":"https://bgm.tv/index/26559",
                    "ep_real":""
                   };
    //////////////////////////////////////////////////////////////////////
    let securitycode = $('#badgeUserPanel a')[11].href.split('/logout/')[1].toString();
    let localData;
    if(!JSON.parse(localStorage.getItem('bgm_index_collected')))
        localData = {"ep_anime":[],"ep_music":[],"ep_real":[]};
    else
        localData = JSON.parse(localStorage.getItem('bgm_index_collected'));
    let ep_class = document.querySelector('#navMenuNeue a.focus').href.match(/(anime|music|real)/);

    if(document.location.href.match(/ep\/\d+/)){
        let epid = location.href.split('/ep/')[1].toString();
        let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';
        document.querySelector('#columnEpA h2.title').insertBefore(showBtn,document.querySelector('#columnEpA h2 small'));
        let epclass = 'ep_'+ ep_class[1];
        if(localData[epclass].includes(epid)){
            let flag = 1;
            $(showBtn).css({"font-size":"12px","color":"red"});
            showBtn.addEventListener('click',function(){
                flag = flag==1?0:1;
                if(flag){
                    if(ep_index[epclass]!="")
                        $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                    localData[epclass].push(epid);
                    $(showBtn).css({"font-size":"12px","color":"red"});
                }
                else{
                    localData[epclass].splice(localData[epclass].indexOf(epid),1);
                    $(showBtn).css({"font-size":"12px","color":"grey"});
                }
                localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
            });
        }
        else{
            let flag = 0;
            $(showBtn).css({"font-size":"12px","color":"grey"});
            showBtn.addEventListener('click', function(){
                flag = flag==1?0:1;
                if(flag){
                    if(ep_index[epclass]!="")
                        $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                    localData[epclass].push(epid);
                    $(showBtn).css({"font-size":"12px","color":"red"});
                }
                else{
                    localData[epclass].splice(localData[epclass].indexOf(epid),1);
                    $(showBtn).css({"font-size":"12px","color":"grey"});
                }
                localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
            });
        }
    }
    else if(document.location.href.match(/subject\/\d+\/ep/)){
        let eplist = document.querySelectorAll('#columnInSubjectA .line_detail .line_list li');
        eplist.forEach( (elem, index) => {
            let ep = elem.querySelector('a');
            if(ep){
                let epid = ep.href.match(/ep\/(\d+)/)[1].toString();
                let epclass = 'ep_'+ ep_class[1];
                if(localData[epclass].includes(epid)){
                    let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';$(ep).append(showBtn);
                    let flag = 1;
                    $(showBtn).css({"font-size":"12px","color":"red"});
                    showBtn.addEventListener('click',function(){
                        flag = flag==1?0:1;
                        if(flag){
                            if(ep_index[epclass]!="")
                                $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                            localData[epclass].push(epid);
                            $(showBtn).css({"font-size":"12px","color":"red"});
                        }
                        else{
                            localData[epclass].splice(localData[epclass].indexOf(epid),1);
                            $(showBtn).css({"font-size":"12px","color":"grey"});
                        }
                        localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
                    });
                }
                else{
                    let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';$(ep).append(showBtn);
                    let flag = 0;
                    $(showBtn).css({"font-size":"12px","color":"grey"});
                    showBtn.addEventListener('click',function(){
                        flag = flag==1?0:1;
                        if(flag){
                            if(ep_index[epclass]!="")
                                $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                            localData[epclass].push(epid);
                            $(showBtn).css({"font-size":"12px","color":"red"});
                        }
                        else{
                            localData[epclass].splice(localData[epclass].indexOf(epid),1);
                            $(showBtn).css({"font-size":"12px","color":"grey"});
                        }
                        localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
                    });
                }
            }
        });
    }
    else if(document.location.href.match(/subject\/\d+/)){
        let eplist = document.querySelectorAll('#subject_detail .prg_list li');
        eplist.forEach( (elem, index) => {
            let epid = elem.querySelector('a').href.split('/ep/')[1].toString();
            let epclass = 'ep_'+ ep_class[1];
            if(localData[epclass].includes(epid))
                $(elem.querySelector('a')).attr("class","epBtnQueue");
        });
        let music_eplist = document.querySelectorAll('#subject_detail .line_detail .line_list_music li');
        music_eplist.forEach( (elem, index) => {
            let ep = elem.querySelector('a');
            if(ep){
                let epid = ep.href.match(/ep\/(\d+)/)[1].toString();
                let epclass = 'ep_'+ ep_class[1];
                if(localData[epclass].includes(epid)){
                    let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';$(ep).append(showBtn);
                    let flag = 1;
                    $(showBtn).css({"font-size":"12px","color":"red"});
                    showBtn.addEventListener('click',function(){
                        flag = flag==1?0:1;
                        if(flag){
                            if(ep_index[epclass]!="")
                                $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                            localData[epclass].push(epid);
                            $(showBtn).css({"font-size":"12px","color":"red"});
                        }
                        else{
                            localData[epclass].splice(localData[epclass].indexOf(epid),1);
                            $(showBtn).css({"font-size":"12px","color":"grey"});
                        }
                        localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
                    });
                }
                else{
                    let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';$(ep).append(showBtn);
                    let flag = 0;
                    $(showBtn).css({"font-size":"12px","color":"grey"});
                    showBtn.addEventListener('click',function(){
                        flag = flag==1?0:1;
                        if(flag){
                            if(ep_index[epclass]!="")
                                $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                            localData[epclass].push(epid);
                            $(showBtn).css({"font-size":"12px","color":"red"});
                        }
                        else{
                            localData[epclass].splice(localData[epclass].indexOf(epid),1);
                            $(showBtn).css({"font-size":"12px","color":"grey"});
                        }
                        localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
                    });
                }
            }
        });
    }
})();
