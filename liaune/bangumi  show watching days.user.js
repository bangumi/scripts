// ==UserScript==
// @name         Bangumi Show Watching Days
// @namespace   https://github.com/bangumi/scripts/liaune
// @version      0.4.2
// @description  首页显示在看条目的已看天数,收藏页面显示条目的已看天数和完成天数，先去“在看”页面或Timeline获取时间方可正常使用，开始看的时间可以修改和保存
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/\S+\/(list|timeline)\/?.*
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/$
// @grant        none
// ==/UserScript==

(function() {

    let You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    let User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;
    //在首页显示已看天数
    if($('#prgSubjectList')){
        let watchlist = document.querySelectorAll('#prgSubjectList li.clearit');
        watchlist.forEach( (elem, index) => {
            let ID_w=elem.querySelector('a.title').href.split('/subject/')[1];
            if(localStorage.getItem(You+'Time_do'+ID_w)){
                let date = new Date(localStorage.getItem(You+'Time_do'+ID_w));
                let now = new Date();
                let durtime = parseInt((now.getTime() - date.getTime())/(24 * 60 * 60 * 1000));
                let showdurtime = document.createElement('span');
                showdurtime.className = 'tip_j';
                showdurtime.innerHTML = " (已看"+ durtime +"天) ";
                showdurtime.style.color='blue';
                if(durtime>=100) showdurtime.style.color='red';
                elem.append(showdurtime);
            }
        });
    }

    //去timeline获取时间
    function Record(){
        User = window.location.href.match(/user\/(\S+)\/timeline/)[1];
        let tml_ulList = document.querySelectorAll('#timeline ul');
        tml_ulList.forEach( (elem, index) => {
            let tml_itemsList = elem.querySelectorAll('li');
            tml_itemsList.forEach( (elem1, index1) => {
                let info = elem1.querySelector('span.info_full');
                if(info.textContent.match(/在看|在听|在玩|在读/)){
                    let a_list = elem1.querySelectorAll('a.l');
                    a_list.forEach( (elem2, index2) => {
                        let ID = elem2.href.split('/subject/')[1];
                        let time = document.querySelectorAll('#timeline h4')[index].textContent;
                        if(time.match(/\d{4}/) && !localStorage.getItem(User+'Time_do'+ID)) localStorage.setItem(User+'Time_do'+ID,time);
                    });
                }
                if(info.textContent.match(/看过|听过|玩过|读过/)){
                    let time = document.querySelectorAll('#timeline h4')[index];
                    let a_list = elem1.querySelectorAll('a.l');
                    a_list.forEach( (elem2, index2) => {
                        let ID = elem2.href.split('/subject/')[1];
                        let time = document.querySelectorAll('#timeline h4')[index].textContent;
                        if(time.match(/\d{4}/) && !localStorage.getItem(User+'Time_finish'+ID)) localStorage.setItem(User+'Time_finish'+ID,time);
                    });
                }
            });
        });
    }

    if($('#tmlContent')){
        const showBtn = document.createElement('a');
        showBtn.addEventListener('click', Record);
        showBtn.className = 'chiiBtn';
        showBtn.href='javascript:;';
        showBtn.textContent = '记录时间';
        $("#submitBtnO").append(showBtn);

    }
    //在收藏页面获取和显示已看天数和完成天数
    if($('#browserItemList li.item')){
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        itemsList.forEach( (elem, index) => {
            let href = elem.querySelector('a.subjectCover').href;
            let ID = href.split('/subject/')[1];
            if(window.location.href.match(/\/list\/(\S+)\/do|on_hold/)){
                let subject_class = window.location.href.match(/https?:\/\/(bangumi\.tv|bgm\.tv|chii\.in)\/(\S+)\/list/)[2];
                let class_subj = subject_class=='anime'? '看':(subject_class=='book'?'读':(subject_class=='music'?'听':(subject_class=='game'?'玩':'看')));
                let Time_do = elem.querySelector('.inner .collectInfo span.tip_j')? elem.querySelector('.inner .collectInfo span.tip_j').innerHTML: null;
                if(Time_do && User==You && !localStorage.getItem(User+'Time_do'+ID))
                    localStorage.setItem(User+'Time_do'+ID,Time_do);

                let showstarttime = document.createElement('span');
                showstarttime.className = 'tip';
                showstarttime.contentEditable = true;
                showstarttime.textContent = localStorage.getItem(User+'Time_do'+ID);
                elem.querySelector('.inner .collectInfo').insertBefore(showstarttime,elem.querySelector('.inner .collectInfo span.tip_j'));

                let date = new Date(localStorage.getItem(User+'Time_do'+ID)?localStorage.getItem(User+'Time_do'+ID):Time_do);
                let date1 = new Date(Time_do);
                let now = new Date();
                let durtime = parseInt((now.getTime() - date.getTime())/(24 * 60 * 60 * 1000));
                let waittime = parseInt((now.getTime() - date1.getTime())/(24 * 60 * 60 * 1000));
                let showdurtime = document.createElement('span');
                showdurtime.className = 'tip_j';
                showdurtime.innerHTML = " (已"+class_subj+ durtime +"天) ";
                showdurtime.style.color='#0058ff';
                if(durtime>=100) showdurtime.style.color='red';
                $(showdurtime).insertAfter(showstarttime);
                $('<span class="tip_j">—</span>').insertAfter(showdurtime);

                let showwaittime = document.createElement('span');
                showwaittime.className = 'tip_j';
                showwaittime.innerHTML = " ("+ waittime +"天没"+class_subj+") ";
                showwaittime.style.color='#c0690c';
                if(waittime>=30) showwaittime.style.color='red';
                elem.querySelector('.inner .collectInfo').insertBefore(showwaittime,elem.querySelector('.inner .collectInfo span.tip_i'));

                showstarttime.addEventListener('blur', function (){
                    localStorage.setItem(User+'Time_do'+ID,showstarttime.textContent);
                    date = new Date(localStorage.getItem(User+'Time_do'+ID));
                    durtime = parseInt((now.getTime() - date.getTime())/(24 * 60 * 60 * 1000));
                    showdurtime.innerHTML = " (已"+class_subj+durtime +"天) ";
                    if(durtime>=100) showdurtime.style.color='red';
                });

            }
            else if(window.location.href.match(/\/list\/(\S+)\/collect/)){
                let Time_finish = elem.querySelector('.inner .collectInfo span.tip_j')? elem.querySelector('.inner .collectInfo span.tip_j'): null;
                if(Time_finish && User==You && !localStorage.getItem(User+'Time_finish'+ID))
                    localStorage.setItem(User+'Time_finish'+ID,Time_finish.textContent);
                Time_finish.contentEditable = true;
                Time_finish.textContent = localStorage.getItem(User+'Time_finish'+ID);
                let Time_do = localStorage.getItem(User+'Time_do'+ID);
                let showstarttime = document.createElement('span');
                showstarttime.className = 'tip';
                showstarttime.contentEditable = true;
                showstarttime.textContent = Time_do ? Time_do:'';
                elem.querySelector('.inner .collectInfo').insertBefore(showstarttime,elem.querySelector('.inner .collectInfo span.tip_j'));
                $('<span class="tip_j">—</span>').insertAfter(showstarttime);
                let date = new Date(Time_finish.textContent);
                let date0 = Time_do ? new Date(Time_do): null;
                let durtime = date0 ? parseInt((date.getTime() - date0.getTime())/(24 * 60 * 60 * 1000)): null;

                let showdurtime = document.createElement('span');
                showdurtime.className = 'tip_j';
                if(durtime)     showdurtime.innerHTML = " (历时"+ durtime +"天) ";
                showdurtime.style.color='#0058ff';
                if(durtime>=100) showdurtime.style.color='red';
                elem.querySelector('.inner .collectInfo').insertBefore(showdurtime,elem.querySelector('.inner .collectInfo span.tip_i'));
                showstarttime.addEventListener('blur', function (){
                    if(showstarttime.textContent.match(/\d{4}/)){
                        localStorage.setItem(User+'Time_do'+ID,showstarttime.textContent);
                        date0 = new Date(localStorage.getItem(User+'Time_do'+ID));
                        durtime = parseInt((date.getTime() - date0.getTime())/(24 * 60 * 60 * 1000));
                        showdurtime.innerHTML = " (历时"+ durtime +"天) ";
                        if(durtime>=100) showdurtime.style.color='red';
                    }
                    else if(showstarttime.textContent!='') alert("错误的时间格式");

                });
                Time_finish.addEventListener('blur', function (){
                    if(Time_finish.textContent.match(/\d{4}/)){
                        localStorage.setItem(User+'Time_finish'+ID,Time_finish.textContent);
                        date = new Date(localStorage.getItem(User+'Time_finish'+ID));
                        durtime = parseInt((date.getTime() - date0.getTime())/(24 * 60 * 60 * 1000));
                        showdurtime.innerHTML = " (历时"+ durtime +"天) ";
                        if(durtime>=100) showdurtime.style.color='red';
                    }
                    else if(Time_finish.textContent!='') alert("错误的时间格式");

                });
            }
        });
    }
})();
