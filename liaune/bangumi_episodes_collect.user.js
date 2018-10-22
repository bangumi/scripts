// ==UserScript==
// @name         Bangumi episodes collect
// @namespace    https://github.com/bangumi/scripts/edit/master/liaune
// @version      1.2
// @description  在章节页面标题后面添加收藏到自己的目录的图标，将动画、音乐、三次元的章节收藏到对应的目录，使用之前请先到个人设置页面定义目录地址。（取消收藏并不能将章节从目录中移除，要移除需要前往目录删除）
// @author       Liaune
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*
// @grant        none
// ==/UserScript==

(function() {
    let ep_index;
    if(localStorage.getItem('bgm_index_collected_ep'))
        ep_index = JSON.parse(localStorage.getItem('bgm_index_collected_ep'));
    else
        ep_index = {"ep_anime":"","ep_music":"","ep_real":""};

    let securitycode = $('#badgeUserPanel a')[11].href.split('/logout/')[1].toString();
    let localData;
    if(!JSON.parse(localStorage.getItem('bgm_index_collected')))
        localData = {"ep_anime":[],"ep_music":[],"ep_real":[]};
    else
        localData = JSON.parse(localStorage.getItem('bgm_index_collected'));

    if(document.location.href.match(/settings/)){
        $("#header ul").append('<li><a id="epcolletSetBtn" href="javascript:void(0);"><span>章节收藏</span></a></li>');
        $("#epcolletSetBtn").on("click", function() {
            $("#header").find("[class='selected']").removeClass("selected");
            $("#epcolletSetBtn").addClass("selected");
            let ep_anime = "",ep_music = "",ep_real = "";
            if(ep_index.ep_anime) ep_anime = ep_index.ep_anime;
            if(ep_index.ep_music) ep_music = ep_index.ep_music;
            if(ep_index.ep_real) ep_real = ep_index.ep_real;
            let  html = '<form>' +
                '<span class="text">' +
                '<table align="center" width="98%" cellspacing="0" cellpadding="5" class="settings">' +
                '<tbody>' +
                '<tr><td valign="top" width="23%">动画章节收藏目录</td>' +
                '<td valign="top"><input id="ep_anime" class="inputtext" type="text" value="' + ep_anime + '"></td></tr>' +
                '<tr><td valign="top" width="23%">音乐章节收藏目录</td>' +
                '<td valign="top"><input id="ep_music" class="inputtext" type="text" value="' + ep_music + '"></td></tr>' +
                '<tr><td valign="top" width="23%">三次元章节收藏目录</td>' +
                '<td valign="top"><input id="ep_real" class="inputtext" type="text" value="' + ep_real + '"></td></tr>' +
                '<td valign="top"><input id="submitBtn" class="inputBtn" value="确定" readonly unselectable="on" style="width:26px">' +
                '<a id="alert_submit" style="color: #F09199; font-size: 14px; padding: 20px"></a></td></tr>' +
                '</tbody></table>' +
                '</span>' +
                '</form>';
            $("#columnA").html(html);
            $("input[readonly]").on('focus', function() {
                $(this).trigger('blur');
            });
            $("#submitBtn").on("click", function() {
                ep_index.ep_anime = $("#ep_anime").attr("value");
                ep_index.ep_music = $("#ep_music").attr("value");
                ep_index.ep_real = $("#ep_real").attr("value");
                localStorage.setItem('bgm_index_collected_ep',JSON.stringify(ep_index));
                alert('保存成功！');
            });
        });
    }

    if(document.location.href.match(/ep\/\d+/)){
        let epid = location.href.match(/ep\/(\d+)/)[1].toString();
        let epclass = 'ep_'+ document.querySelector('#navMenuNeue a.focus').href.match(/(anime|music|real)/)[1];
        if(localData[epclass].includes(epid)){
            let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';
            document.querySelector('#columnEpA').insertBefore(showBtn,document.querySelector('#columnEpA h2'));
            let flag = 1;
            $(showBtn).css({"font-size":"18px","color":"red"});
            showBtn.addEventListener('click',function(){
                flag = flag==1?0:1;
                if(flag){
                    if(ep_index[epclass]!="")
                        $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                    localData[epclass].push(epid);
                    $(showBtn).css({"font-size":"18px","color":"red"});
                }
                else{
                    localData[epclass].splice(localData[epclass].indexOf(epid),1);
                    $(showBtn).css({"font-size":"18px","color":"grey"});
                }
                localStorage.setItem('bgm_index_collected',JSON.stringify(localData));
            });
        }
        else{
            let showBtn = document.createElement('a');showBtn.className = 'l';showBtn.href='javascript:;';showBtn.textContent = '❤';
            document.querySelector('#columnEpA').insertBefore(showBtn,document.querySelector('#columnEpA h2'));
            let flag = 0;
            $(showBtn).css({"font-size":"18px","color":"grey"});
            showBtn.addEventListener('click',function(){
                flag = flag==1?0:1;
                if(flag){
                    if(ep_index[epclass]!="")
                        $.post(ep_index[epclass]+"/add_related", {add_related: location.origin+"/ep/"+ epid, formhash: securitycode, submit: '添加新关联'});
                    localData[epclass].push(epid);
                    $(showBtn).css({"font-size":"18px","color":"red"});
                }
                else{
                    localData[epclass].splice(localData[epclass].indexOf(epid),1);
                    $(showBtn).css({"font-size":"18px","color":"grey"});
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
                let epclass = 'ep_'+ document.querySelector('#navMenuNeue a.focus').href.match(/(anime|music|real)/)[1];
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
            let epclass = 'ep_'+ document.querySelector('#navMenuNeue a.focus').href.match(/(anime|music|real)/)[1];
            if(localData[epclass].includes(epid))
                $(elem.querySelector('a')).attr("class","epBtnQueue");
        });
        let music_eplist = document.querySelectorAll('#subject_detail .line_detail .line_list_music li');
        music_eplist.forEach( (elem, index) => {
            let ep = elem.querySelector('a');
            if(ep){
                let epid = ep.href.match(/ep\/(\d+)/)[1].toString();
                let epclass = 'ep_'+ document.querySelector('#navMenuNeue a.focus').href.match(/(anime|music|real)/)[1];
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
