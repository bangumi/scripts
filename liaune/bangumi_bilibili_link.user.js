// ==UserScript==
// @name         bangumi_bilibili_link
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.3
// @description  为 Bangumi 动画条目添加bilibili播放链接图标
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle(`
.media-icon{
position: relative;
z-index: 999;
display: inline-block;
background-image: url(https://i.loli.net/2018/11/04/5bdef15ba9076.png);
width: 17px;
height: 14px;
background-position: -919px -88px;
}
.video-icon{
position: relative;
z-index: 999;
display: inline-block;
background-image: url(https://i.loli.net/2018/11/04/5bdef15ba9076.png);
width: 19px;
height: 16px;
background-position: -534px -1047px;
}
.edit-icon{
position: relative;
z-index: 999;
display: inline-block;
background-image: url(https://i.loli.net/2018/11/04/5bdef15ba9076.png);
background-size: 800px 1222px;
width: 11px;
height: 11px;
background-position: -712px -170px;
}
`);
    const BGMLIST_URL = 'https://bgmlist.sorz.org/bangumi/$Y/$M.json';
    let link_list;
    if(localStorage.getItem('bangumi_bilibili_link'))
        link_list = JSON.parse(localStorage.getItem('bangumi_bilibili_link'));
    else
        link_list = {"anime":{},"media":{},"video":{}};

    function getOnAirYearMonth(Datestring){
        let yy = Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():null;
        Datestring = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/);
        let year = Datestring ? Datestring[1].toString(): yy;
        let month = Datestring ? Datestring[3].toString(): null;
        if (month) return [year, month];
        else throw "on-air date not found";
    }
    async function getBgmList(year, month) {
        const url = BGMLIST_URL.replace('$Y', year).replace('$M', month);
        let resp = await fetch(url, { referrerPolicy: "no-referrer" });
        if (!resp.ok) throw "fail to fetch bgmlist: " + resp.status;
        let list = await resp.json();
        let bgms = new Map(
            Object.values(list)
            .map(b => [`${b.bgmId}`, b])
            .filter(([bgmId, _]) => bgmId != undefined)
        );
        return bgms;
    }

    async function get_ItemList_link(elem,id){
        let [year, month] = [0,0];
        if(elem.querySelector('.inner .info'))
            [year, month] = getOnAirYearMonth(elem.querySelector('.inner .info').textContent);
        else{
            let dates = Array.from(document.querySelectorAll('#infobox .tip'))
            .filter(t => t.textContent.startsWith('放送开始'))
            .map(t => t.parentElement.textContent.match(/(\d{4})年(\d{1,2})月/))
            .filter(t => t != null)
            .map(t => [parseInt(t[1]), parseInt(t[2])]);
            if (dates) [year, month] = dates[0];
        }
        let bgms = await getBgmList(year, month);
        let bgm = bgms.get(id);
        if (!bgm) throw `bangumi #${id} not found in bgmlist`;
        let link;
        bgm.onAirSite.map(url => {
            let site = url.match(/https?:\/\/\w+\.(\w+)\./)[1];
            if(site == 'bilibili')
                link = url;
        });
        //console.log(link);
        if (!link) throw "fail to get bilibili ";
        return link;
    }
    //设置
    if(document.location.href.match(/settings/)){
        $("#header > ul").append('<li><a id="bililinkSetBtn" href="javascript:void(0);"><span>bili_link</span></a></li>');
        $("#bililinkSetBtn").on("click", function() {
            $("#header").find("[class='selected']").removeClass("selected");
            $("#bililinkSetBtn").addClass("selected");
            let data= localStorage.getItem('bangumi_bilibili_link');
            let  html = '<form>' +
                '<span class="text">以下是你所保存的番组数据，你可以编辑和替换，点击"确定"即可保存修改</span>'+
                '<textarea id="data_content" name="content" cols="45" rows="15" style="width: 1000px;" class="quick">'+data+'</textarea>'+
                '<input id="submitBtn" class="inputBtn" value="确定" readonly unselectable="on" style="width:26px">' +
                '<a id="alert_submit" style="color: #F09199; font-size: 14px; padding: 20px"></a>'+
                '</form>';
            $("#columnA").html(html);
            $("#submitBtn").on("click", function() {
                data = $("#data_content").attr("value");
                localStorage.setItem('bangumi_bilibili_link',data);
                alert('保存成功！');
            });
        });
    }

    //条目页
    if(location.href.match(/subject\/\d+/)){
        let elem = document.querySelector('#headerSubject');
        let id = location.href.match(/subject\/(\d+)/)[1];
        if(link_list.anime[id])
            $(elem).find('.nameSingle').append('<a href=https://bangumi.bilibili.com/anime/'+link_list.anime[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');
        else if(link_list.media[id])
            $(elem).find('.nameSingle').append('<a href=https://www.bilibili.com/bangumi/media/md'+link_list.media[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');
        else if(link_list.video[id])
            $(elem).find('.nameSingle').append('<a href=https://www.bilibili.com/video/av'+link_list.video[id]+' target="_blank" class="l"><i class="video-icon"></i></a>');
        else{
            get_ItemList_link(elem,id).then(link => {
                if(link){
                    $(elem).find('.nameSingle').append('<a href='+link+' target="_blank" class="l"><i class="media-icon"></i></a>');
                    link_list.anime[id] = link.match(/(\d+)/)[1];
                    localStorage.setItem('bangumi_bilibili_link',JSON.stringify(link_list));}
            });
        }
    }
    //条目列表
    let itemsList = document.querySelectorAll('#browserItemList li.item');
    if(itemsList){
        let showBtn = document.createElement('li');
        let select = document.createElement('a');
        $(select).css({"background-image": "url(https://i.loli.net/2018/11/04/5bdef15ba9076.png)","background-size": "1200px 1833px","background-position": "-1066px -255px"});
        select.href='javascript:;';
        if(document.querySelectorAll('#browserTypeSelector li')[0]) document.querySelector('#browserTypeSelector').insertBefore(showBtn, document.querySelectorAll('#browserTypeSelector li')[0]);
        showBtn.appendChild(select);
        select.addEventListener('click', function(){
            itemsList = document.querySelectorAll('#browserItemList li.item');
            itemsList.forEach( (elem, index) => {
                let href = elem.querySelector('a.subjectCover').href;
                let id = href.split('/subject/')[1];
                if(link_list.anime[id]){
                    if(!$(elem).find('.media-icon').length) {
                        $(elem).find('.inner h3').append('<a href=https://bangumi.bilibili.com/anime/'+link_list.anime[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');}}
                else if(link_list.media[id]){
                    if(!$(elem).find('.media-icon').length) {
                        $(elem).find('.inner h3').append('<a href=https://www.bilibili.com/bangumi/media/md'+link_list.media[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');}}
                else if(link_list.video[id]){
                    if(!$(elem).find('.video-icon').length) {
                        (link_list.video[id]);$(elem).find('.inner h3').append('<a href=https://www.bilibili.com/video/av'+link_list.video[id]+' target="_blank" class="l"><i class="video-icon"></i></a>');}}
                else{
                    get_ItemList_link(elem,id).then(link => {
                        if(link){
                            $(elem).find('.inner h3').append('<a href='+link+' target="_blank" class="l"><i class="media-icon"></i></a>');
                            link_list.anime[id] = link.match(/(\d+)/)[1];
                            delete link_list.media[id];
                            localStorage.setItem('bangumi_bilibili_link',JSON.stringify(link_list));}
                    });
                }
                if(!$(elem).find('.edit-icon').length)
                    $(elem).find('.inner h3').append('<a href="javascript:;" class="l"><i class="edit-icon"></i></a>');
                $(elem).find('.edit-icon')[0].addEventListener('click',function(){
                    $(elem).find('.inner').append('<div id="comment_box"><div class="item"><div style="float:none;" class="text_main_even"><div class="text"><br></div><div class="text_bottom"></div></div></div></div>');
                    let comment = $(elem).find('.text')[0];
                    if(link_list.anime[id])
                        comment.textContent = 'https://bangumi.bilibili.com/anime/'+link_list.anime[id];
                    else if(link_list.media[id])
                        comment.textContent = 'https://www.bilibili.com/bangumi/media/md'+link_list.media[id];
                    else if(link_list.video[id])
                        comment.textContent = 'https://www.bilibili.com/video/av'+link_list.video[id];
                    $(comment).attr('contenteditable', 'true');
                    comment.addEventListener('blur',function(){
                        let match = $(comment).text().trim().match(/(ss|md|av|anime\/)\d+/);
                        let anime_id = match ? match[0].match(/anime\/(\d+)/):null;
                        let media_id = match ? match[0].match(/(ss|md)(\d+)/):null;
                        let video_id = match ? match[0].match(/av(\d+)/):null;
                        if(anime_id){
                            link_list.anime[id] = anime_id[1];
                            $(elem).find('.inner h3').append('<a href=https://bangumi.bilibili.com/anime/'+link_list.anime[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');
                        }
                        else if(media_id){
                            link_list.media[id] = media_id[2];
                            $(elem).find('.inner h3').append('<a href=https://www.bilibili.com/bangumi/media/md'+link_list.media[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');
                        }
                        else if(video_id){
                            link_list.video[id] = video_id[1];
                            $(elem).find('.inner h3').append('<a href=https://www.bilibili.com/video/av'+link_list.video[id]+' target="_blank" class="l"><i class="video-icon"></i></a>');
                        }
                        else if($(comment).text().trim()==''){
                            delete link_list.media[id];  delete link_list.video[id];}
                        localStorage.setItem('bangumi_bilibili_link',JSON.stringify(link_list));
                        $(this).remove();
                    });
                });
            });
        });
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let id = href.split('/subject/')[1];
            if(link_list.anime[id]){
                $(elem).find('.inner h3').append('<a href=https://bangumi.bilibili.com/anime/'+link_list.anime[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');}
            else if(link_list.media[id])
                $(elem).find('.inner h3').append('<a href=https://www.bilibili.com/bangumi/media/md'+link_list.media[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');
            else if(link_list.video[id])
                $(elem).find('.inner h3').append('<a href=https://www.bilibili.com/video/av'+link_list.video[id]+' target="_blank" class="l"><i class="video-icon"></i></a>');
            else{
                get_ItemList_link(elem,id).then(link => {
                    if(link){
                        $(elem).find('.inner h3').append('<a href='+link+' target="_blank" class="l"><i class="media-icon"></i></a>');
                        link_list.anime[id] = link.match(/(\d+)/)[1];
                        delete link_list.media[id];
                        localStorage.setItem('bangumi_bilibili_link',JSON.stringify(link_list));}
                });
            }
        });
    }
    //首页
    let cloumnSubjectInfo = document.querySelectorAll('#cloumnSubjectInfo div.infoWrapper');
    if(cloumnSubjectInfo){
        cloumnSubjectInfo.forEach( (elem, index) => {
            let href = elem.querySelector('a').href;
            let id = href.split('/subject/')[1];
            if(link_list.anime[id]){
                $(elem).find('.headerInner h3,.tinyHeader').append('<a href=https://bangumi.bilibili.com/anime/'+link_list.anime[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');}
            else if(link_list.media[id])
                $(elem).find('.headerInner h3,.tinyHeader').append('<a href=https://www.bilibili.com/bangumi/media/md'+link_list.media[id]+' target="_blank" class="l"><i class="media-icon"></i></a>');
            else if(link_list.video[id])
                $(elem).find('.headerInner h3,.tinyHeader').append('<a href=https://www.bilibili.com/video/av'+link_list.video[id]+' target="_blank" class="l"><i class="video-icon"></i></a>');
        });
    }
})();
