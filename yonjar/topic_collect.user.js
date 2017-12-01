// ==UserScript==
// @name         bangumi话题收藏
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.1
// @description  收藏bangumi的话题
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/((blog|(group|subject)\/topic)\/\d+(\?.*)?(#.*)?)?$/
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    #yonjar_collection_tpc .timeline{
        max-height: 400px;
        overflow: auto;
    }
    .yonjar_bgm_topic_col_btn{
        display: inline-block;
        color: #666;
        text-shadow: 0px 1px 2px #FFF;
        text-decoration: none;
        line-height: 20px;
        margin: 0 5px 5px 0;
        padding: 0 12px;
        border: 1px solid #DDD;
        background: -webkit-gradient(linear,left top,left bottom,from(#FCFCFC),to(#F1F1F1));
        background: -moz-linear-gradient(top,#FCFCFC,#F1F1F1);
        background: -o-linear-gradient(top,#FCFCFC,#F1F1F1);
        -webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        -moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        -moz-border-radius: 4px;
        -webkit-border-radius: 4px;
        border-radius: 4px
    }
    .yonjar_bgm_topic_col_btn:hover {
        color: #FFF;
        text-shadow: none;
        background: #4F93CF;
        background: -moz-linear-gradient(top,#6BA6D8,#4F93CF);
        background: -o-linear-gradient(top,#6BA6D8,#4F93CF);
        background: -webkit-gradient(linear,left top,left bottom,from(#5FA3DB),to(#72B6E3));
        -webkit-box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1);
        -moz-box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1);
        box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1)
    }
    `);


class BgmCollections {
    constructor(){
        if (!localStorage.getItem('bgm_collections_by_yonjar')) {
            localStorage.setItem('bgm_collections_by_yonjar', JSON.stringify([]));
        }
        this.collections = JSON.parse(localStorage.getItem('bgm_collections_by_yonjar'));
    }

    get list(){
        return this.collections;
    }

    update(){
        localStorage.setItem('bgm_collections_by_yonjar', JSON.stringify(this.collections));
    }

    add(topic){
        this.collections.push(topic);
        this.update();
        console.log('add ', topic.id);
    }

    remove(topic){
        for (let i = 0; i < this.collections.length; i++){
            if (this.collections[i].id === topic.id) {
                this.collections.splice(i, 1);
                break;
            }
        }
        this.update();
        console.log('remove ', topic.id);
    }

    has(topic){
        for (let li of this.collections){
            if (li.id === topic.id) {
                return true;
            }
        }
        return false;
    }
}

class Topic {
    constructor(){
        this.id = location.pathname.split('topic/')[1] || location.pathname.split('blog/')[1];
        this.path = location.pathname;
        this.title = document.title;
        this.author = (document.querySelector('.postTopic > div.inner > strong > a') || document.querySelector('#pageHeader > h1 > span > a.avatar.l')).textContent;
    }

    init(){
        let bc = new BgmCollections();
        let col_btn = document.createElement('button');
        col_btn.classList.add('rr');
        col_btn.classList.add('yonjar_bgm_topic_col_btn');
        col_btn.innerText = bc.has(this) ? '取消收藏' : '收藏';
        col_btn.addEventListener('click', () => {
            if (bc.has(this)) {
                bc.remove(this);
                col_btn.innerText = '收藏';
            }
            else {
                bc.add(this);
                col_btn.innerText = '取消收藏';
            }
        });

        let titleElem = document.querySelector('#pageHeader > h1') || document.querySelector('#header > h1');
        titleElem.appendChild(col_btn);
    }
}

class HomePage{
    constructor(){
        this.sideInner = document.querySelector('#columnHomeB > div.sideInner');
        this.home_announcement = document.querySelector('#home_announcement');
    }

    init(){
        let bc = new BgmCollections();
        let col_elem = document.createElement('div');
        let listStr = '';
        for (let col of bc.list) {
            listStr += `<li><a href="${col.path}" title="楼主: ${col.author}" class="l">${col.title}</a></li>`;
        }
        col_elem.innerHTML = `
            <div id="yonjar_collection_tpc" class="halfPage sort ui-draggable">
                <div class="sidePanelHome">
                    <h2 class="subtitle">收藏话题</h2>
                    <ul class="timeline" style="margin:0 5px">
                        ${bc.list.length < 1 ? '<li>暂无收藏</li>' : listStr}
                    </ul>
                </div>
            </div>
        `;
        this.sideInner.insertBefore(col_elem, this.home_announcement);
    }
}

(function () {
    let cur_url = location.href;
    if (/^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/$/.test(cur_url)) {
        let hp = new HomePage();
        hp.init();
        return;
    }

    let topic = new Topic();
    topic.init();
})();