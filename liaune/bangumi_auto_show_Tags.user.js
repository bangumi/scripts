// ==UserScript==
// @name         Bangumi Autoshow Tags
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.7.1
// @description  在条目收藏列表显示条目的常用标签，双击标签栏可以修改；在右边显示统计,点击标签可在列表上方显示相应的条目；标签搜索，多个标签请用空格隔开，支持逻辑搜索
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/\S+\/list\/.*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle(`
.tag_d{
padding: 4px 0;
font-size: 10px;
width: 5px;
float: right;
}
.horizontalChart{
height: 20em;
}
.horizontalChart li{
height: 18em;
}
.horizontalChart li a .count{
background: #2D7BB2;
}
.horizontalChart li a:hover .count{
background: #f4ac09;
}
input.searchTagInputL {
border: 2px solid #CCC;
font-size: 14px;
padding: 2px 5px;
width: 180px;
-moz-border-radius: 5px;
-webkit-border-radius: 5px;
}
input.searchTagBtnL {
font-size: 13px;
border: none;
background: #4EB1D4;
color: #FFF;
padding: 3px 10px;
-moz-border-radius: 5px;
-webkit-border-radius: 5px;
}
`);
    // 检测 indexedDB 兼容性，因为只有新版本浏览器支持
    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    // 初始化 indexedDB
    const dbName = 'Bangumi_Subject_Tags';
    const tableName = 'tags';
    const indexName = 'id';
    if (indexedDB) {
        let request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = evt => {
            let db = evt.target.result;
            let objectStore = db.createObjectStore(tableName, {keyPath: indexName});
        }
        request.onsuccess = evt => {
            //removeCache();
        }
    }
    // 用来记录已经被使用的缓存列表
    let cacheLists = [];
    // 获取本地缓存
    function getCache(itemId, callback) {
        let request = indexedDB.open(dbName, 1);
        request.onsuccess = evt => {
            let db = evt.target.result;
            let transaction = db.transaction([tableName], 'readonly');
            let objectStore = transaction.objectStore(tableName);
            let reqInfo = objectStore.get(itemId);
            reqInfo.onsuccess = evt => {
                let result = evt.target.result;
                if(!!result) {
                    cacheLists.push(itemId);
                    callback(true, result.value.content);
                } else {
                    callback(false);
                }
            }
            reqInfo.onerror = evt => {
                callback(false);
            }
        };
    }
    // 记录到本地缓存
    function setCache(itemId, data) {
        let request = indexedDB.open(dbName, 1);
        request.onsuccess = evt => {
            let db = evt.target.result;
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let cache = {
                content: data,
                created: new Date()
            };
            let reqInfo = objectStore.put({id: itemId, value: cache})
            reqInfo.onerror = evt => {
                // console.log('Error', evt.target.error.name);
            }
            reqInfo.onsuccess = evt => {}
        };
    }
    // 清除和更新缓存
    function removeCache() {
        let request = indexedDB.open(dbName, 1);
        request.onsuccess = evt => {
            let db = evt.target.result;
            let transaction = db.transaction([tableName], 'readwrite'),
                store = transaction.objectStore(tableName),
                twoWeek = 1209600000;
            store.openCursor().onsuccess = evt => {
                let cursor = evt.target.result;
                if (cursor) {
                    if (cacheLists.indexOf(cursor.value.name) !== -1) {
                        cursor.value.created = new Date();
                        cursor.update(cursor.value);
                    } else {
                        let now = new Date(),
                            last = cursor.value.created;
                        if (now - last > twoWeek) {
                            cursor.delete();
                        }
                    }
                    cursor.continue();
                }
            }
        };
    }

    let itemsList,count=0,update=0,stop=0,readonly=0;
    let AllTags=[],JsonTags={},TagsAll=[],RatesAll={},YearsAll=[];
    const Display_Tag_Num = 10;  //每个条目下展示的标签数量
    const Min_Tag_Vote = 10;    //有效标签需要的标记数下限
    const Tag_Bar_Num = 50;    //标签统计栏默认显示的标签数量
    //标签消歧义
    const filter = {"TVA":"TV","漫改":"漫画改","漫画改编":"漫画改","轻改":"轻小说改","轻小说改编":"轻小说改","原创动画":"原创","京都动画":"京阿尼","京都":"京阿尼","京都アニメーション":"京阿尼","ProductionI.G":"Production.I.G","Production_I.G":"Production.I.G","Production.IG":"Production.I.G","ProductionIG":"Production.I.G","I.G":"Production.I.G","key社":"key","骨头社":"BONES","日升":"SUNRISE","GANAIX":"GAINAX"," 東映アニメーション":"东映","国产动画":"国产","日本动画":"日本","日本漫画":"日本","SF":"科幻","治愈系":"治愈","泡面":"泡面番","宫崎峻":"宫崎骏","花澤香菜":"花泽香菜","香菜":"花泽香菜","钉宫":"钉宫理惠","钉宫病":"钉宫理惠","冈田磨里":"冈田麿里","奈须きのこ":"奈须蘑菇","名侦探柯南":"柯南","コミック":"漫画","マンガ":"漫画","成年コミック":"成人漫画","BLコミック":"BL漫画","少女漫画":"少女漫","东方":"東方","東方project":"東方","东方project":"東方","講談社":"讲谈社","漫画単行本":"漫画单行本","西尾維新":"西尾维新","同人音乐":"同人","同人音樂":"同人","澤野弘之":"泽野弘之","梶浦由記":"梶浦由记","石黒正数":"石黑正数","劇場版":"剧场版","动画剧场版":"剧场版","剧场版动画":"剧场版","劇場版アニメ":"剧场版","アニメ劇場版":"剧场版"};

    let menu = location.pathname.match(/(anime|book|music|game|real)/)[1];
    let state = location.pathname.match(/(wish|collect|do|on_hold|dropped)/)[1];

    $('#browserTools').append(`<a id="showBtn" class="chiiBtn" href="javascript:;">Show Tags</a>`);
    $('#showBtn').on('click', function () {
        showProcess();
    });
    $('#browserTools').append(`<a id="updateBtn" class="chiiBtn" href="javascript:;">更新 Tags</a>`);
    $('#updateBtn').hide();
    $('#updateBtn').on('click', function () {
        updateTags();
    });
    $('#browserTools').append(`<a id="stopLoadBtn" class="chiiBtn" href="javascript:;" title="点击停止加载">停止加载</a>`);
    $('#stopLoadBtn').hide();
    $('#stopLoadBtn').on('click', function () {
        stopLoadTag();
    });
    $('#columnSubjectBrowserB').append(`<div id="showLastResult" class="SimpleSidePanel"><h2><a href="#">显示上次标签统计结果</a></h2></div>`);
    $('#showLastResult').on('click', function () {
        showLastResult();
    });

    const User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;
    let record = {"anime":{"wish":{},"collect":{},"do":{},"on_hold":{},"dropped":{}},"book":{"wish":{},"collect":{},"do":{},"on_hold":{},"dropped":{}},"music":{"wish":{},"collect":{},"do":{},"on_hold":{},"dropped":{}},"game":{"wish":{},"collect":{},"do":{},"on_hold":{},"dropped":{}},"real":{"wish":{},"collect":{},"do":{},"on_hold":{},"dropped":{}}};

    function updateTags(){
        update=1;
        count=0;
        TagsAll=[];JsonTags={};AllTags=[];
        itemsList = document.querySelectorAll('#browserItemList li.item');
        if(itemsList.length){
            let i = 0;
            let getitemsList= setInterval(function(){
                let elem = itemsList[i];
                let index = i;
                let href = elem.querySelector('a.subjectCover').href;
                let ID = href.split('/subject/')[1];
                getStatus(href,elem);
                i++;
                if(i >= itemsList.length){
                    clearInterval(getitemsList);
                }
            },300);
        }
    }
    function stopLoadTag(){
        stop = 1;
        $('#stopLoadBtn').hide();
        $('#updateBtn').show();
        $('#updateBtn').text('更新Tags');
        for (let i = 0; i < AllTags.length; i++) {
            JsonTags[AllTags[i]] = (JsonTags[AllTags[i]] + 1) || 1;
        }
        TagsAll = Object.keys(JsonTags)
            .map(function(key){return {TagName:key, Value:JsonTags[key]};})
            .sort(function(x, y){return y.Value - x.Value;});
        /* for (var key in JsonTags){
                let temp_tag = {TagName:key,Value:JsonTags[key]};
                AllTags.push(temp_tag);
            }
            AllTags.sort(function (x,y){return y.Value - x.Value;});*/
        saveRecord();
        showTagSearchPanel();
        showSidePanelTag(TagsAll);
    }
    function showLastResult(){
        if(localStorage.getItem(User+'Bangumi_Tag_Record')){
            readonly = 1;
            $('#showLastResult').hide();
            $('#columnSubjectBrowserB .SimpleSidePanel').hide();
            $('#columnSubjectBrowserB .menu_inner').hide();
            let record = JSON.parse(localStorage.getItem(User+'Bangumi_Tag_Record'));
            let RatesAll = record[menu][state].Rates;
            let YearsAll = record[menu][state].Years;
            let TagsAll = record[menu][state].Tags;
            showSidePanelRate(RatesAll);
            showSidePanelYear(YearsAll);
            showSidePanelTag(TagsAll);
        }
        else alert('没有记录哦');
    }

    function saveRecord(){
        let saverecordBtn = document.createElement('a');
        saverecordBtn.href = "javascript:;"; saverecordBtn.textContent = "保存本次结果"; saverecordBtn.className = 'chiiBtn';
        $(saverecordBtn).on('click', function () {
            if (!confirm("确认要保存结果吗？")) {
                return;
            }
            record[menu][state].Rates = RatesAll;
            record[menu][state].Years = YearsAll;
            record[menu][state].Tags = TagsAll;
            localStorage.setItem(User+'Bangumi_Tag_Record',JSON.stringify(record));
        });
        $('#columnSubjectBrowserB').append(saverecordBtn);
    }
    //Main Program
    function showProcess(){
        readonly = 0;
        $('#showBtn').hide();
        $('#columnSubjectBrowserB .SimpleSidePanel').hide();
        $('#columnSubjectBrowserB .menu_inner').hide();
        itemsList = document.querySelectorAll('#browserItemList li.item');
        if(itemsList.length){
            let fetchList = [];
            itemsList.forEach( (elem, index) => {
                let href = elem.querySelector('a.subjectCover').href;
                let ID = href.split('/subject/')[1];
                /* //为每个条目添加单独刷新
                let showBtn_Re = document.createElement('a'); showBtn_Re.className = 'l'; showBtn_Re.href='javascript:;'; showBtn_Re.textContent = '↺';
                showBtn_Re.addEventListener('click', getStatus.bind(this,href,elem),false);
                elem.querySelector('.inner h3').appendChild(showBtn_Re);*/
                getCache(ID, function(success, result) {
                    if (success) {
                        displayStatus(elem,result);
                    }
                    else{
                        fetchList.push(elem);
                    }
                });
            });
            let i = 0;
            let getitemsList= setInterval(function(){
                let elem = fetchList[i];
                if(!elem) console.log(i);
                else{
                    let href = elem.querySelector('a.subjectCover').href;
                    getStatus(href,elem);
                    i++;
                    console.log(i);
                }
                if(fetchList.length && i >= fetchList.length){
                    clearInterval(getitemsList);
                }
            },500);
        }
        createRateSidePannel();
        createYearSidePannel();
    }

    function checkTag(Tag){
        function parseDate(Datestring){
            let yy=Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'';
            let year = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[1].toString(): yy;
            let month = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[3].toString(): '';
            let day = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)?Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[5].toString(): '';
            let time = year? (month? (year+'/'+month+'/'+day):year):'';
            return time;
        }
        if(!Tag) return false;
        else if(parseDate(Tag)!='') return false;
        else return true;
    }

    function getStatus(href,elem){
        let xhr = new XMLHttpRequest();
        xhr.open( "GET", href );
        xhr.withCredentials = true;
        xhr.responseType = "document";
        xhr.send();
        xhr.onload = function(){
            let d = xhr.responseXML;
            let tagList = d.querySelectorAll('#subject_detail .subject_tag_section .inner a.l');
            let tagsAll = {"tag":[],"vote":[]};
            for(let i=0;i<tagList.length;i++){
                tagsAll.tag.push(tagList[i].querySelector('span').textContent);
                tagsAll.vote.push(tagList[i].querySelector('small').textContent);
            }
            let Tags = [];
            for(let i=0;i<tagsAll.tag.length;i++){
                if(checkTag(tagsAll.tag[i]) && parseInt(tagsAll.vote[i])>= Math.min(Min_Tag_Vote,parseInt(tagsAll.vote[0])/10))
                    Tags.push(tagsAll.tag[i]);
            }
            Tags = filterTags(Tags);
            Tags = Tags.slice(0,Math.min(Display_Tag_Num,Tags.length));
            let ID = href.split('/subject/')[1];
            setCache(ID,Tags);
            displayStatus(elem,Tags);
            if(update){
                $('#updateBtn').text('更新中... (' + count + '/' + itemsList.length +')');
                if(count==itemsList.length){
                    $('#updateBtn').text('更新完毕！');
                }
            }
        }
    }

    function filterTags(Tags){
        for(let TagName in filter){
            if (Tags.includes(TagName)) {
                Tags.splice(Tags.indexOf(TagName),1,filter[TagName]);
            }
        }
        for(let i=0;i<Tags.length;i++){
            if(Tags[i].match(/『(\S+)』/)) Tags[i] = Tags[i].match(/『(\S+)』/)[1];
        }
        Tags = distinct(Tags);
        return Tags;
    }

    function addDivTags(elem,Tags){
        let DivTags = document.createElement('div');
        let href = elem.querySelector('a.subjectCover').href;
        let ID = href.split('/subject/')[1];
        DivTags.id = "DivTags";
        for(let i=0;i<Tags.length;i++){
            let Atags = document.createElement('a');
            //Atags.href = "/anime/tag/"+Tags[i];
            //Atags.target="_blank";
            Atags.className = 'l';
            if(i==Tags.length-1) Atags.innerHTML=Tags[i];
            else Atags.innerHTML=Tags[i]+"&nbsp;&nbsp;";
            //Atags.addEventListener('click', findTag.bind(this,Tags[i]),false);
            DivTags.appendChild(Atags);
        }
        if(elem.querySelector('#DivTags'))
            $(elem.querySelector('#DivTags')).remove();
        $(DivTags).insertAfter(elem.querySelector('.inner .collectInfo'));
        DivTags.addEventListener('dblclick', function (){
            DivTags.contentEditable = true;
        });
        DivTags.addEventListener('blur', function (){
            let Tags = DivTags.textContent.split("  ");
            setCache(ID,Tags);

        });
    }

    function displayStatus(elem,Tags){
        let href = elem.querySelector('a.subjectCover').href;
        let ID = href.split('/subject/')[1];
        AllTags = AllTags.concat(Tags);
        addDivTags(elem,Tags);

        count++;
        if(!update && !stop){
            $('#stopLoadBtn').show();
            $('#stopLoadBtn').text('加载中... (' + count + '/' + itemsList.length +')');
        }
        if(count==itemsList.length && !stop){
            $('#stopLoadBtn').hide();
            $('#updateBtn').show();
            $('#updateBtn').text('更新Tags');
            for (let i = 0; i < AllTags.length; i++) {
                JsonTags[AllTags[i]] = (JsonTags[AllTags[i]] + 1) || 1;
            }
            TagsAll = Object.keys(JsonTags)
                .map(function(key){return {TagName:key, Value:JsonTags[key]};})
                .sort(function(x, y){return y.Value - x.Value;});
            /* for (var key in JsonTags){
                let temp_tag = {TagName:key,Value:JsonTags[key]};
                AllTags.push(temp_tag);
            }
            AllTags.sort(function (x,y){return y.Value - x.Value;});*/
            record[menu][state].Tags = TagsAll;
            saveRecord();
            $('#TagSearchSidePanel').remove();
            showTagSearchPanel();
            $('#TagAllSidePanel').remove();
            showSidePanelTag(TagsAll);
        }

    }

    function showTagSearchPanel(){
        let SimpleSidePanel = document.createElement('div');
        SimpleSidePanel.id = "TagSearchSidePanel";
        SimpleSidePanel.className = "SimpleSidePanel";
        $(SimpleSidePanel).append(`<h2>标签搜索</h2>`);
        $(SimpleSidePanel).append(`<input type="text" id="tagName" value="" class="searchTagInputL">`);
        let searchTag_a = document.createElement('a');
        searchTag_a.href = '#';
        let searchTag = document.createElement('input');
        searchTag.type = 'button';
        searchTag.value = '查询';
        searchTag.className = 'searchTagBtnL';
        $(searchTag).on('click', function () {
            findTag($('#tagName').val());
        });
        $(searchTag_a).append(searchTag);
        $(SimpleSidePanel).append(searchTag_a);
        $('#columnSubjectBrowserB').append(SimpleSidePanel);
    }

    function showSidePanelTag(TagsAll){
        let SimpleSidePanel = document.createElement('div');
        SimpleSidePanel.id = "TagAllSidePanel";
        SimpleSidePanel.className = "SimpleSidePanel";
        SimpleSidePanel.style.width = "190px";
        $(SimpleSidePanel).append(`<h2>标签统计</h2>`);
        let tagList = document.createElement('ul');
        tagList.className = "tagList";
        function showMoreTags(start,end,hide){
            if(hide) $(showmoreTags).hide();
            for(let i=start; i<end; i++){
                let tagli = document.createElement('li');
                let taglia = document.createElement('a');
                if(!readonly) taglia.href='#';
                taglia.textContent = TagsAll[i].TagName;
                if(!readonly) taglia.addEventListener('click', findTag.bind(this,TagsAll[i].TagName),false);
                $(taglia).append(`<small>${TagsAll[i].Value}</small>`);
                //添加删除按钮
                let tag_del = document.createElement('a');
                tag_del.href='javascript:;';tag_del.textContent = 'x';tag_del.title = '删除';tag_del.classList.add('tag_d');
                tag_del.addEventListener('click', deleteTag.bind(this,tagli,TagsAll[i].TagName),false);
                if(!readonly) tagli.appendChild(tag_del);
                //添加重命名按钮
                let tag_rename = document.createElement('a');
                tag_rename.href='javascript:;';tag_rename.textContent = '#';tag_rename.title = '重命名';tag_rename.classList.add('tag_d');
                tag_rename.addEventListener('click', renameTag.bind(this,taglia,TagsAll[i].TagName),false);
                if(!readonly) tagli.appendChild(tag_rename);
                tagli.appendChild(taglia);
                tagList.appendChild(tagli);
            }
        }
        showMoreTags(0,Math.min(Tag_Bar_Num,TagsAll.length),0);
        $(SimpleSidePanel).append($(tagList));
        let showmoreTags = document.createElement('a');
        showmoreTags.href='javascript:;';
        showmoreTags.textContent = '/ 展开全部标签';
        showmoreTags.addEventListener('click', showMoreTags.bind(this,Math.min(Tag_Bar_Num,TagsAll.length),TagsAll.length,1),false);
        $(SimpleSidePanel).append($(showmoreTags));
        $('#columnSubjectBrowserB').append(SimpleSidePanel);
    }

    function findTag(TagName){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        let count_t = 0;
        let Tags = TagName.trim().split(' ');
        itemsList.forEach( (elem, index) => {
            let match = 1;
            elem.style.border="none";
            let TagsList = elem.querySelector('#DivTags').textContent.split("  ");
            for(let i=0;i<Tags.length;i++){
                if(Tags[i].match(/\-(\S+)/)){
                    if(TagsList.includes(Tags[i].match(/\-(\S+)/)[1])) match = 0;
                }
                else if(Tags[i].match(/\|/)){
                    let tages = Tags[i].trim().split('|');
                    match = 0;
                    for(let j=0;j<tages.length;j++){
                        if(TagsList.includes(tages[j])) match = 1;
                    }
                }
                else if(!TagsList.includes(Tags[i])) match = 0;
            }
            if (match) {
                if(count_t %2 == 0) elem.setAttribute('class', 'item odd clearit');
                else elem.setAttribute('class', 'item even clearit');
                elem.style.border="1px solid #5ebee3";
                document.querySelector('#browserItemList').insertBefore(elem,document.querySelector('#browserItemList li.item'));
                count_t+=1;
            }
        });
    }
    function showThisRate(Rate){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        let count_t = 0;
        itemsList.forEach( (elem, index) => {
            elem.style.border="none";
            let User_rate=elem.querySelectorAll('.inner .collectInfo .starlight')[0] ? elem.querySelectorAll('.inner .collectInfo .starlight')[0].className: null;
            User_rate =User_rate ? (User_rate.match(/stars(\d+)/)?User_rate.match(/stars(\d+)/)[1]:0):0;
            if (User_rate == Rate) {
                if(count_t %2 == 0) elem.setAttribute('class', 'item odd clearit');
                else elem.setAttribute('class', 'item even clearit');
                elem.style.border="1px solid #5ebee3";
                document.querySelector('#browserItemList').insertBefore(elem,document.querySelector('#browserItemList li.item'));
                count_t+=1;
            }
        });
    }

    function parseDate(Datestring){
        let yy=Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'';
        let year = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[1].toString(): yy;
        let month = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[3].toString(): '';
        let day = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)?Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[5].toString(): '';
        let time = year? (month? (year+'/'+month+'/'+day):year):'';
        return year;
    }

    function showThisYear(Year){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        let count_t = 0;
        itemsList.forEach( (elem, index) => {
            elem.style.border="none";
            let date = elem.querySelectorAll('.inner .info')[0].textContent;
            date = parseDate(date);
            if (date == Year) {
                if(count_t %2 == 0) elem.setAttribute('class', 'item odd clearit');
                else elem.setAttribute('class', 'item even clearit');
                elem.style.border="1px solid #5ebee3";
                document.querySelector('#browserItemList').insertBefore(elem,document.querySelector('#browserItemList li.item'));
                count_t+=1;
            }
        });
    }

    Array.prototype.remove = function(val) {
        var a = this.indexOf(val);
        if (a >= 0) {
            this.splice(a, 1);
            return true;
        }
        return false;
    };

    function refreshTagsAll(){
        JsonTags = {};
        for (let i = 0; i < AllTags.length; i++) {
            JsonTags[AllTags[i]] = (JsonTags[AllTags[i]] + 1) || 1;
        }
        TagsAll = Object.keys(JsonTags)
            .map(function(key){return {TagName:key, Value:JsonTags[key]};})
            .sort(function(x, y){return y.Value - x.Value;});
    }

    function deleteTag(tagli,TagName){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        AllTags = [];
        if (!confirm(`确认要删除标签“${TagName}”吗？`)) {
            return;
        }
        let i=0;
        $(tagli).remove();
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];
            let TagsList = elem.querySelector('#DivTags').textContent.split("  ");
            if (TagsList.includes(TagName)) {
                TagsList.remove(TagName);
                setCache(ID,TagsList);
                addDivTags(elem,TagsList);
            }
            AllTags = AllTags.concat(TagsList);
            i++;
            if(i==itemsList.length) refreshTagsAll();
        });
    }
    function distinct(arr) {
        let result = [];
        let obj = {};
        for (let i of arr) {
            if (!obj[i]) {
                result.push(i);
                obj[i] = 1;
            }
        }
        return result;
    }

    function renameTag(taglia,TagName){
        itemsList = document.querySelectorAll('#browserItemList li.item');
        AllTags = [];
        let name = prompt('重命名为：',TagName);
        if (!name || name=='') {
            return;
        }
        let num = taglia.querySelector('small').textContent;
        let i=0;
        $(taglia).text(name);
        $(taglia).append(`<small>${num}</small>`);
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];
            let TagsList = elem.querySelector('#DivTags').textContent.split("  ");
            if (TagsList.includes(TagName)) {
                TagsList.splice(TagsList.indexOf(TagName),1,name);
                TagsList = distinct(TagsList);
                setCache(ID,TagsList);
                addDivTags(elem,TagsList);
            }
            AllTags = AllTags.concat(TagsList);
            i++;
            if(i==itemsList.length) refreshTagsAll();
        });
    }

    function createRateSidePannel(elem){
        let AllRates = [];
        itemsList.forEach( (elem, index) => {
            let User_rate=elem.querySelectorAll('.inner .collectInfo .starlight')[0] ? elem.querySelectorAll('.inner .collectInfo .starlight')[0].className: null;
            let Rate =User_rate ? (User_rate.match(/stars(\d+)/)?User_rate.match(/stars(\d+)/)[1]:0):0;
            AllRates = AllRates.concat(Rate);
        });
        for (let i = 0; i < AllRates.length; i++) {
            RatesAll[AllRates[i]] = (RatesAll[AllRates[i]] + 1) || 1;
        }
        record[menu][state].Rates = RatesAll;
        showSidePanelRate(RatesAll);
    }
    function showSidePanelRate(RatesAll){
        let SimpleSidePanel = document.createElement('div');
        SimpleSidePanel.id = "RateSidePanel";
        SimpleSidePanel.className = "SimpleSidePanel";
        SimpleSidePanel.style.width = "190px";
        let tagList = document.createElement('ul');
        tagList.className = "tagList";
        let RateSum = 0, count_t=0;
        for(let i=10; i>=0; i--){
            let vote = RatesAll[i] ? parseInt(RatesAll[i]) : 0;
            if(vote){
                let tagli = document.createElement('li');
                let taglia = document.createElement('a');
                if(!readonly) taglia.href='#';
                taglia.textContent = i+"分";
                if(i==0) taglia.textContent = "未评分";
                if(!readonly) taglia.addEventListener('click', showThisRate.bind(this,i),false);
                $(taglia).append(`<small>${vote}</small>`);
                tagli.appendChild(taglia);
                tagList.appendChild(tagli);
                //不计未评分
                if(i){
                    RateSum += i * vote;
                    count_t += vote}
            }
        }
        $(SimpleSidePanel).append($("<h2>打分统计<small style='float:right'>平均："+ parseFloat(RateSum/count_t).toFixed(2)+"</small></h2>"));
        $(SimpleSidePanel).append($(tagList));
        $('#columnSubjectBrowserB').append(SimpleSidePanel);
        showChartPanelRate(RatesAll);
    }
    function showChartPanelRate(RatesAll){
        /*let AllVotes = [], JsonAllVotes = {},votes = 0,sum = 0;
        itemsList = document.querySelectorAll('#browserItemList li.item');
        itemsList.forEach( (elem, index) => {
            let User_rate=elem.querySelectorAll('.inner .collectInfo .starlight')[0] ? elem.querySelectorAll('.inner .collectInfo .starlight')[0].className: null;
            User_rate =User_rate ? (User_rate.match(/stars(\d+)/)?User_rate.match(/stars(\d+)/)[1]:0):0;
            let stars = parseInt(User_rate);
            if(stars){
                votes += 1;
                sum += stars;
            }
            AllVotes = AllVotes.concat(stars);
        });
        let average = parseFloat(sum/votes).toFixed(3);
        for (let i = 0; i < AllVotes.length; i++) {
            JsonAllVotes[AllVotes[i]] = (JsonAllVotes[AllVotes[i]] + 1) || 1;
        }*/
        let SimpleSidePanel = document.createElement('div');
        SimpleSidePanel.id = "ChartPanelRate";
        SimpleSidePanel.className = "SimpleSidePanel";
        let largest=0,votes=0,vote0=0;
        vote0 = RatesAll[0] ? parseInt(RatesAll[0]) : 0;
        for(let i=0;i<=10;i++) {
            let vote = RatesAll[i] ? parseInt(RatesAll[i]) : 0;
            votes += vote;
            if(i && vote>largest) largest = vote;
        }
        $(SimpleSidePanel).append(`已打分: ${votes-vote0} / ${votes}`);
        let chart = document.createElement('ul');
        chart.className = "horizontalChart";
        for(let i=1; i<=10; i++){
            let tagli = document.createElement('li');
            let taglia = document.createElement('a');
            if(!readonly) taglia.addEventListener('click', showThisRate.bind(this,i),false);
            let v_votes = RatesAll[i] ? parseInt(RatesAll[i]) : 0;
            let height = parseFloat(v_votes/largest*100).toFixed(2).toString();
            taglia.title = v_votes + '  '+ height +'%';
            $(taglia).append(`<span class="label">${i}</span><span class="count" style="height: ${height}%;"></span>`);
            tagli.appendChild(taglia);
            chart.appendChild(tagli);
        }
        $(SimpleSidePanel).append($(chart));
        $('#columnSubjectBrowserB').append($(SimpleSidePanel));
    }

    function createYearSidePannel(){
        let AllYears = [], JsonAllYears = {};
        itemsList.forEach( (elem, index) => {
            let date = elem.querySelectorAll('.inner .info')[0].textContent;
            date = parseDate(date);
            AllYears = AllYears.concat(date);
        });
        for (let i=0;i<AllYears.length;i++) {
            JsonAllYears[AllYears[i]] = (JsonAllYears[AllYears[i]] + 1) || 1;
        }
        console.log(JsonAllYears);
        YearsAll = Object.keys(JsonAllYears)
            .map(function(key){return {Year:key, Value:JsonAllYears[key]};})
            .sort(function(x, y){return y.Year - x.Year;});
        record[menu][state].Years = YearsAll;
        showSidePanelYear(YearsAll);
    }

    function showSidePanelYear(YearsAll){
        let SimpleSidePanel = document.createElement('div');
        SimpleSidePanel.id = "YearSidePanel";
        SimpleSidePanel.className = "SimpleSidePanel";
        SimpleSidePanel.style.width = "190px";
        let tagList = document.createElement('ul');
        tagList.className = "tagList";
        function showMoreTags(start,end,hide){
            if(hide) $(showmoreTags).hide();
            for(let i=start; i<end; i++){
                let tagli = document.createElement('li');
                let taglia = document.createElement('a');
                if(!readonly) taglia.href='#';
                taglia.textContent = YearsAll[i].Year;
                if(!readonly) taglia.addEventListener('click', showThisYear.bind(this,YearsAll[i].Year),false);
                $(taglia).append(`<small>${YearsAll[i].Value}</small>`);
                tagli.appendChild(taglia);
                tagList.appendChild(tagli);
            }
        }
        showMoreTags(0,Math.min(15,YearsAll.length),0);
        $(SimpleSidePanel).append($("<h2>时间统计</h2>"));
        $(SimpleSidePanel).append($(tagList));
        let showmoreTags = document.createElement('a');
        showmoreTags.href='javascript:;';
        showmoreTags.textContent = '/ 展开全部年份';
        $(SimpleSidePanel).append($(showmoreTags));
        showmoreTags.addEventListener('click', showMoreTags.bind(this,Math.min(15,YearsAll.length),YearsAll.length,1),false);
        $('#columnSubjectBrowserB').append(SimpleSidePanel);
    }

})();
