// ==UserScript==
// @name         bangumi table list
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.2
// @description  在条目列表点击表格图标可以表格形式显示列表
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle(`
table.gridtable {
font-family: verdana,arial,sans-serif;
font-size:11px;
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
    $(table).css({"background-repeat": "no-repeat","background-image": "url(//lain.bgm.tv/pic/photo/l/17/7f/133075_9C090.jpg)","background-size": "20px 13px","background-position": "2px 2px"});
    table.href='javascript:;';
    if(document.querySelectorAll('#browserTypeSelector li')[0])
        document.querySelector('#browserTypeSelector').insertBefore(showBtn, document.querySelectorAll('#browserTypeSelector li')[0]);
    showBtn.appendChild(table);

    const You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    const User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;

    let itemsList = document.querySelectorAll('#browserItemList li.item');
    let tablehide=0;

    function ShowTable(){
        let count=0,count1=0,DXY=0;
        if(tablehide){
            $('#columnSubjectBrowserA').css('width','700px');
            $('table.gridtable').remove();
            $('#columnSubjectBrowserB').show();
            $('#browserItemList').show();}
        if(!tablehide){
            $('#columnSubjectBrowserA').css('width','auto');
            $('#columnSubjectBrowserB').hide();
            $('#browserItemList').hide();
            itemsList = document.querySelectorAll('#browserItemList li.item');

            let tb=document.createElement('table');
            tb.className="gridtable";

            if(window.location.href.match(/\/(list|index)\//))
                if(User && User!=You) tb.innerHTML =  `<tbody><tr><th>ID</th><th>中文名</th><th>话数</th><th>发售日</th><th>排名</th><th>评分</th><th>人数</th><th>友评</th><th>人数</th><th>我的打分</th><th>打分</th><th>评论</th></tr></tbody>`;
                else tb.innerHTML =  `<tbody><tr><th>ID</th><th>中文名</th><th>话数</th><th>发售日</th><th>排名</th><th>评分</th><th>人数</th><th>友评</th><th>人数</th><th>打分</th><th>评论</th></tr></tbody>`;
            else
                tb.innerHTML =  `<tbody><tr><th>ID</th><th>中文名</th><th>话数</th><th>发售日</th><th>排名</th><th>评分</th><th>人数</th><th>友评</th><th>人数</th><th>打分</th></tr></tbody>`;
            document.querySelector('#browserItemList').parentNode.insertBefore(tb,document.querySelector('#browserItemList'));

            itemsList.forEach( (elem, index) => {
                let href = elem.querySelector('a.subjectCover').href;
                let ID = href.split('/subject/')[1];
                let title = elem.querySelectorAll('.inner h3 a')[0].innerHTML;
                let name = elem.querySelectorAll('.inner h3 small.grey')[0] ? elem.querySelectorAll('.inner h3 small.grey')[0].innerHTML : title;
                let date = elem.querySelectorAll('.inner .info')[0].textContent;
                let ep = date.match(/(\d+)话/) ? date.match(/(\d+)话/)[1] :'';
                function ParseDate(Datestring){
                    let yy=Datestring.match(/(\d{4})/)? Datestring.match(/(\d{4})/)[1].toString():'';
                    let year = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[1].toString(): yy;
                    let month = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)? Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[3].toString(): '';
                    let day = Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)?Datestring.match(/(\d{4})(年|-)(\d{1,2})(月|-)(\d{1,2})/)[5].toString(): '';
                    let time = year? (month? (year+'/'+month+'/'+day):year):'';
                    return time;
                }
                date = ParseDate(date);
                let info = JSON.parse(localStorage.getItem('Subject'+ID+'Status'));
                let rankNum = info ? info.rankNum : '';
                let Point = info ? info.Point : '';
                let Votes = info ? info.Votes :'';
                let Point_f = info ? info.Point_f : '';
                let Votes_f = info ? info.Votes_f :'';
                let User_rate=elem.querySelectorAll('.inner .collectInfo .starlight')[0] ? elem.querySelectorAll('.inner .collectInfo .starlight')[0].className: null;
                let User_Point=User_rate ? (User_rate.match(/stars(\d+)/)?User_rate.match(/stars(\d+)/)[1]:''):'';
                let My_Point=localStorage.getItem(You+'Point'+ID) ? localStorage.getItem(You+'Point'+ID) :'';
                if(My_Point=='null') My_Point='';
                if(My_Point!=='' && User_Point!==''){
                    count1+= 1;
                    DXY+= Math.pow((My_Point-User_Point),2);
                }
                let comment_box=elem.querySelector('#comment_box .item .text');
                let comment = comment_box ? comment_box.innerHTML :'';
                let tr=document.createElement('tr');
                if(window.location.href.match(/\/(list|index)\//)){
                    if(User && User!=You){
                        tr.innerHTML=`<td><a href=${href} class="l">${ID}</a></td><td>${title}</td><td>${ep}</td><td>${date}</td><td>${rankNum}</td><td>${Point}</td><td>${Votes}</td><td>${Point_f}</td><td>${Votes_f}</td><td>${My_Point}</td><td>${User_Point}</td><td>${comment}</td>`;
                        if(My_Point!=='' && User_Point!=='' && Math.pow((My_Point-User_Point),2)>4){tr.style.color="#ff0000";}
                        if(My_Point!=='' && User_Point!=='' && Math.pow((Point-User_Point),2)>1 && My_Point==User_Point){tr.style.color="#2ea6ff";}
                        //if(User_Point!=='' && User_Point-Point>1){tr.style.color="#ff00ff";}
                        //if(User_Point!=='' && Point-User_Point>1){tr.style.color="#c59c01";}
                    }
                    else {tr.innerHTML=`<td><a href=${href} class="l">${ID}</a></td><td>${title}</td><td>${ep}</td><td>${date}</td><td>${rankNum}</td><td>${Point}</td><td>${Votes}</td><td>${Point_f}</td><td>${Votes_f}</td><td>${My_Point}</td><td>${comment}</td>`;
                         if(My_Point!=='' && My_Point-Point>1){tr.style.color="#ff00ff";}
                         if(My_Point!=='' && Point-My_Point>1){tr.style.color="#c59c01";}
                         }
                }
                else
                    tr.innerHTML=`<td><a href=${href} class="l">${ID}</a></td><td>${title}</td><td>${ep}</td><td>${date}</td><td>${rankNum}</td><td>${Point}</td><td>${Votes}</td><td>${Point_f}</td><td>${Votes_f}</td><td>${My_Point}</td>`;
                tb.appendChild(tr);
                count+=1;
                if(window.location.href.match(/\/(list|index)\//)){
                    if(User && User!=You){
                        if(count==itemsList.length){
                            let average = parseFloat(DXY/count1).toFixed(2);
                            let record = document.createElement('a');
                            record.className='chiiBtn';
                            record.href='javascript:;';
                            record.innerHTML = 'Record';
                            record.addEventListener('click', function(){
                                if(count1) localStorage.setItem(User+'CommenRated',count1);
                                if(average) localStorage.setItem(User+'RateDiff',average);
                                console.log(count1+average);
                                record.innerHTML = record.innerHTML == 'Record'?'Recorded':'Record';
                            });
                            tr.innerHTML=`<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>${count1}</td><td>${average}</td><td></td>`;
                            
                            tb.appendChild(tr);
                            tb.appendChild(record);
                        }
                    }
                }

            });
        }
        tablehide=!tablehide;

    }


})();
