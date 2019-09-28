// ==UserScript==
// @name         bangumi过滤搜索结果
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.2
// @description  自动去除标签搜索结果中错误的结果，手动去除你认为错误的标签或关键词搜索结果，下次搜索时将自动过滤
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// @grant        none
// ==/UserScript==

(function() {
    let itemsList,blacklist,type,key,count=0,see=0;

    if(localStorage.getItem('bangumi_result_blacklist'))
        blacklist = JSON.parse(localStorage.getItem('bangumi_result_blacklist'));
    else
        blacklist = {"tag":{},"subject_search":{}};
    //let match = decodeURI(location.href).match(/(tag|subject_search)\/(\S+)(\/|.?).*/);
    let match = decodeURI(location.pathname).match(/(tag|subject_search)\/(\S+)\//);
    if(match){
        type = match[1];
        key = match[2];
        let showBtn = document.createElement('li');
        let select = document.createElement('a'); $(select).css({"background-image": "url(https://i.loli.net/2018/11/04/5bdef15ba9076.png)","background-size": "1600px 2444px","background-position": "-405px -1045px"});
        select.href='javascript:;';
        if(document.querySelectorAll('#browserTypeSelector li')[0]) document.querySelector('#browserTypeSelector').insertBefore(showBtn, document.querySelectorAll('#browserTypeSelector li')[0]);
        showBtn.appendChild(select);
        select.addEventListener('click', filter);

        filter();
        see = 0;
    }
    function filter(){
        count = 0;
        itemsList = document.querySelectorAll('#browserItemList li.item');
        see = (see==1)? 0 :1;
        if(!blacklist[type][key]) blacklist[type][key] = [];
        let fetchList = [];
        itemsList.forEach( (elem) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];
            let hideBtn = document.createElement('a');  hideBtn.href='javascript:;';  hideBtn.className = 'delet-icon'; hideBtn.textContent = '☒'; hideBtn.style.float='right';
            hideBtn.addEventListener('click', function(){
                if(blacklist[type][key].includes(ID)){
                    blacklist[type][key].splice(blacklist[type][key].indexOf(ID),1);
                    alert("已将此条目从黑名单中移除");
                    localStorage.setItem('bangumi_result_blacklist',JSON.stringify(blacklist));
                }
                else{
                    $(elem).hide();
                    blacklist[type][key].push(ID);
                    localStorage.setItem('bangumi_result_blacklist',JSON.stringify(blacklist));
                }
            });
            if(!$(elem).find('.delet-icon').length) elem.appendChild(hideBtn);
            if(blacklist[type][key].includes(ID)){
                if(see) $(elem).hide();
                else $(elem).show();
                count++;
            }
            else if(type == 'tag') fetchList.push(elem);
            else count++;
        });
        let i = 0;
        let getitemsList= setInterval(function(){
            let elem = fetchList[i];
            if(elem){
                let href = elem.querySelector('a.subjectCover').href;
                getStatus(href,elem);
                i++;
            }
            if(count >= itemsList.length){
                clearInterval(getitemsList);
            }
        },300);
    }

    function getStatus(href,elem){
        let xhr = new XMLHttpRequest();
        xhr.open( "GET", href );
        xhr.withCredentials = true;
        xhr.responseType = "document";
        xhr.send();
        xhr.onload = function(){
            let d = xhr.responseXML;
            let ID = href.split('/subject/')[1];
            let tagList = d.querySelectorAll('#subject_detail .subject_tag_section .inner a.l');
            let tagsAll = {"tag":[],"vote":[]};
            for(let i=0;i<tagList.length;i++){
                tagsAll.tag.push(tagList[i].querySelector('span').textContent);
                tagsAll.vote.push(tagList[i].querySelector('small').textContent);
            }
            let Tags = [];
            for(let i=0;i<tagsAll.tag.length;i++){
                if(parseInt(tagsAll.vote[i])>= Math.min(10,parseInt(tagsAll.vote[0])/10))
                    Tags.push(tagsAll.tag[i]);
            }
            console.log('check '+ID+':'+Tags);
            if(!Tags.includes(key)){
                blacklist[type][key].push(ID);
                localStorage.setItem('bangumi_result_blacklist',JSON.stringify(blacklist));
                $(elem).hide();
            }
            count++;
        }
    }

    //设置
    if(document.location.href.match(/settings/)){
        $("#header > ul").append('<li><a id="blacklist" href="javascript:void(0);"><span>blacklist</span></a></li>');
        $("#blacklist").on("click", function() {
            $("#header").find("[class='selected']").removeClass("selected");
            $("#blacklist").addClass("selected");
            let data= localStorage.getItem('bangumi_result_blacklist');
            let  html = '<form>' +
                '<span class="text">以下是你所保存的搜索结果过滤黑名单，你可以编辑和替换，点击"确定"即可保存修改</span>'+
                '<textarea id="data_content" name="content" cols="45" rows="15" style="width: 1000px;" class="quick">'+data+'</textarea>'+
                '<input id="submitBtn" class="inputBtn" value="确定" readonly unselectable="on" style="width:26px">' +
                '<a id="alert_submit" style="color: #F09199; font-size: 14px; padding: 20px"></a>'+
                '</form>';
            $("#columnA").html(html);
            $("#submitBtn").on("click", function() {
                data = $("#data_content").attr("value");
                localStorage.setItem('bangumi_result_blacklist',data);
                alert('保存成功！');
            });
        });
    }
})();
