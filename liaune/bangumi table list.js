// ==UserScript==
// @name         bangumi table list
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.2
// @description  在条目列表点击表格图标可以表格形式显示列表
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(.+?/list|.+?/tag|.+?/browser|subject_search|index)(/|\?).+$/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle(`
table.gridtable {
font-family: verdana,arial,sans-serif;
font-size:11px;
color:#333333;
border-width: 1px;
border-color: #a9c6c9;
border-collapse: collapse;
}
table.gridtable th {
background-color: #9adaf2;
border-width: 1px;
padding: 8px;
border-style: solid;
border-color: #a9c6c9;
}
table.gridtable td {
border-width: 1px;
padding: 8px;
border-style: solid;
border-color: #a9c6c9;
}
`);
    const showBtn = document.createElement('li');
    const table = document.createElement('a');
    table.addEventListener('click', ShowTable);
    table.style.backgroundImage="url(//lain.bgm.tv/pic/photo/l/17/7f/133075_9C090.jpg)";
    table.style.backgroundSize= "contain";
    table.href='javascript:;';
    table.textContent = 'Table';
    document.querySelector('#browserTypeSelector').insertBefore(showBtn, document.querySelectorAll('#browserTypeSelector li')[0]);
    showBtn.appendChild(table);

    const You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    const User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;

    let itemsList = document.querySelectorAll('#browserItemList li.item');
    let tablehide=0;

    function ShowTable(){
        $('#columnSubjectBrowserA').css('width','auto');
        if(tablehide){
            $('table.gridtable').remove();
            $('#browserItemList').css('display','block');}
        if(!tablehide){
            $('#browserItemList').css('display','none');
            itemsList = document.querySelectorAll('#browserItemList li.item');
            let arr=[];
            for(i=0;i<itemsList.length;i++)   arr[i]=itemsList[i];
            if(arr[0].style.order){
                arr.sort(function(li1,li2){
                    let n1=parseInt(li1.style.order);
                    let n2=parseInt(li2.style.order);
                    return n1-n2;
                });
                for(i=0; i<arr.length; i++)
                {
                    $('#browserItemList').append(arr[i]);
                }
            }
            itemsList = document.querySelectorAll('#browserItemList li.item');

            let tb=document.createElement('table');
            tb.className="gridtable";

            if(window.location.href.match(/\/(list|index)\//))
                tb.innerHTML =  `<tbody><tr><th>ID</th><th>中文名</th><th>原名</th><th>话数</th><th>发售日</th><th>排名</th><th>评分</th><th>人数</th><th>打分</th><th>评论</th></tr></tbody>`;
            else
                tb.innerHTML =  `<tbody><tr><th>ID</th><th>中文名</th><th>原名</th><th>话数</th><th>发售日</th><th>排名</th><th>评分</th><th>人数</th><th>打分</th></tr></tbody>`;
            document.querySelector('#browserItemList').parentNode.insertBefore(tb,document.querySelector('#browserItemList'));

            itemsList.forEach( (elem, index) => {
                let href = elem.querySelector('a.subjectCover').href;
                let ID = href.split('/subject/')[1];
                let title = elem.querySelectorAll('.inner h3 a')[0].innerHTML;
                let name = elem.querySelectorAll('.inner h3 small.grey')[0] ? elem.querySelectorAll('.inner h3 small.grey')[0].innerHTML : title;
                let date = elem.querySelectorAll('.inner .info')[0].textContent;
                let ep = date.match(/(\d+)话/) ? date.match(/(\d+)话/)[1] :null;
                if(ep) localStorage.setItem(ID+'Eps',ep);
                ep = ep? ep : (localStorage.getItem(ID+'Eps') ? localStorage.getItem(ID+'Eps') : '');
                if(ep=='null') ep='';
                function ParseDate(Datestring){
                    let yy=Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'';
                    let year = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[1].toString(): yy;
                    let month = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[3].toString(): '';
                    let day = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)?Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[5].toString(): '';
                    let time = year? (month? (year+'/'+month+'/'+day):year):'';
                    return time;
                }
                date = ParseDate(date);
                let rankNum = localStorage.getItem(ID+'Rank');
                rankNum = rankNum ? rankNum : '';
                let rate = elem.querySelector('.inner .fade');
                let Point = localStorage.getItem(ID+'Point');
                Point = Point ? Point : '';
                let Votes = localStorage.getItem(ID+'Votes');
                Votes = Votes ? Votes :'';
                let User_rate=User ? elem.querySelectorAll('.inner .collectInfo span')[0].className: null;
                let User_Point=User_rate ? (User_rate.match(/sstars(\d+)/)?User_rate.match(/sstars(\d+)/)[1]:''):'';
                let My_Point=localStorage.getItem(You+'Point'+ID) ? localStorage.getItem(You+'Point'+ID) :'';
                if(My_Point=='null') My_Point='';
                let comment_box=elem.querySelector('#comment_box .item .text');
                let comment = comment_box ? comment_box.innerHTML :'';
                let tr=document.createElement('tr');
                if(window.location.href.match(/\/(list|index)\//)){
                    if(User) tr.innerHTML=`<td>${ID}</td><td>${title}</td><td>${name}</td><td>${ep}</td><td>${date}</td><td>${rankNum}</td><td>${Point}</td><td>${Votes}</td><td>${User_Point}</td><td>${comment}</td>`;
                    else tr.innerHTML=`<td>${ID}</td><td>${title}</td><td>${name}</td><td>${ep}</td><td>${date}</td><td>${rankNum}</td><td>${Point}</td><td>${Votes}</td><td>${My_Point}</td><td>${comment}</td>`;
                }
                else
                    tr.innerHTML=`<td>${ID}</td><td>${title}</td><td>${name}</td><td>${ep}</td><td>${date}</td><td>${rankNum}</td><td>${Point}</td><td>${Votes}</td><td>${My_Point}</td>`;
                tb.appendChild(tr);
            });}
        tablehide=!tablehide;

    }


})();
