// ==UserScript==
// @name         Bangumi 用户备注与屏蔽
// @icon         https://kotorichan.me/favicon.ico
// @namespace    kotorichan_app.remark
// @version      0.1.0
// @description  给用户添加备注，防止改名不认识
// @author       Vick Scarlet <[BGM] 神戸小鳥＠vickscarlet> <https://github.com/VickScarlet> <scarlet_vick@outlook.com>
// @include      *://bgm.tv/*
// @include      *://bangumi.tv/*
// @include      *://chii.in/*
// @grant        none
// ==/UserScript==

const target = (function(){
    // jshint -W067
    return this || (0, eval)('this');
})();
const namespace = `kotorichan_app`;
(function(namespace) {
"use struct";

namespace.author = `Vick Scarlet <[BGM] 神戸小鳥＠vickscarlet> <https://github.com/VickScarlet> <scarlet_vick@outlook.com>`;

(function(){
function $(fn, ...args) {
    return fn instanceof Function? fn(...args): void 0;
}

$.keys = function(o) {
    if(o==null) return;
    if(!o) return [];
    if(o.keys instanceof Function) {
        const keysI = o.keys();
        if(keysI) {
            if(keysI.next) {
                const ks = [];
                let key;
                while(!(key=keysI.next()).done) ks.push(key.value);
                return ks;
            }
            return keysI;
        }
    }
    if(Object.values) return Object.values(o);
    const keys = [];
    for(const key in o) keys.push(key);
    return keys;
};

$.values = function(o) {
    if(o==null) return;
    if(!o) return [];
    if(o.values instanceof Function) {
        const valuesI = o.values();
        if(valuesI) {
            if(valuesI.next) {
                const vs = [];
                let value;
                while(!(value=valuesI.next()).done) vs.push(value.value);
                return vs;
            }
            return valuesI;
        }
    }
    if(Object.values) return Object.values(o);
    const values = [];
    for(const key in o) values.push(o[key]);
    return values;
};

$.random = function(n) {
    // jshint -W014
    return Number.isFinite(n)
        ? Math.random() * n
        : Math.random()
        ;
};

$.pick = function(o) {
    const values = $.values(o);
    if(!values) return;
    return values[Math.floor($.random(values.length))%values.length];
};

$.call = function(fn, thisArgs, ...argsArray) {
    return fn instanceof Function? fn.call(thisArgs, argsArray): void 0;
};

$.ready = (()=>{
    let funcs = document.readyState === 'complete'? null: [];
    if(!!funcs) {
        const handler = e=>{
            if(!funcs) return;
            if(e.type === 'onreadystatechange' && document.readyState !== 'complete') return;
            const fns = funcs;
            funcs = null;
            fns.forEach(fn=>$.call(fn, document));
        };

        if(document.addEventListener) {
            document.addEventListener('DOMContentLoaded', handler, false);
            document.addEventListener('readystatechange', handler, false);
            window.addEventListener('load', handler, false);
        } else if(document.attachEvent) {
            document.attachEvent('onreadystatechange', handler);
            window.attachEvent('onload', handler);
        }
    }
    // jshint -W030
    return fn => { !funcs? $.call(fn, document): funcs.push(fn); };
})();

$.addStyle = function(style) {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = style||"";
    document.head.append(styleElement);
};

$.global = function() {
    return (function(){
        // jshint -W067
        return this || (0, eval)('this');
    })();
};

namespace.$ = namespace.common = $;
})();

namespace.$.addStyle(`
/* 最外层 */
#kotorichan_app_remark_main_window {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
}

/* 中部窗口 */
#kotorichan_app_remark_center {
  display: block;
  position: absolute;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(5px);
  top: 50%;
  left: 50%;
  width: 500px;
  max-width: calc(100% - 20px);
  height: 300px;
  transform: translate(-50%,-50%);
  border-radius: 4px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
}

/* dark mode */
html[data-theme='dark'] #kotorichan_app_remark_center {
  background: rgba(59,59,59,0.7);
}

/* 窗口中的标签组 */
#kotorichan_app_remark_tabs {
  display: block;
  position: absolute;
  left: 10px;
  top: 0;
  width: 480px;
  width: calc(100% - 20px);
  height: 30px;
  border: 0 #F09199 solid;
  border-bottom-width: 3px;
}

/* 窗口中的内容区 */
#kotorichan_app_remark_content {
  display: block;
  position: absolute;
  left: 10px;
  bottom: 10px;
  width: 478px;
  width: calc(100% - 22px);
  height: 256px;
  height: calc(100% - 44px);
  border: 1px #369CF8 solid;
  border-top-width: 0;
}

/* 底部菜单边框 */
#kotorichan_app_remark_dock_menu {
  position: absolute;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(5px);
  top: 100%;
  transform: translateY(0%);
  border-radius: 4px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
  z-index: -1;
  transition: all 0.5s;
  opacity: 0;
}

/* dark mode */
html[data-theme='dark'] #kotorichan_app_remark_dock_menu {
  background: rgba(59,59,59,0.7);
}

/* 底部菜单栏在鼠标经过时弹出 */
#kotorichan_app_remark_dock:hover #kotorichan_app_remark_dock_menu {
  top: -4px;
  opacity: 1;
  transform: translateY(-100%);
}

/* 底部菜单标签 */
.kotorichan_app_remark_dock_menu_tab {
  display: block !important;
  float: none !important;
  border: 0 !important;
  border-bottom-width: 1px !important;
  padding: 5px !important;
}

/* 底部菜单标签鼠标经过 */
.kotorichan_app_remark_dock_menu_tab:hover {
  color: #369CF8;
}

/* 窗口中标签 */
.kotorichan_app_remark_tab {
  display: list-item;
  height: 100%;
  float: left;
  line-height: 30px;
  padding: 0 10px;
  margin: 0 10px;
  color: #444;
}

/* dark mode */
html[data-theme='dark'] .kotorichan_app_remark_tab {
  color: #e9e9e9;
}

/* 窗口中标签鼠标经过 */
.kotorichan_app_remark_tab:hover {
  color: #369CF8;
  border-bottom: 3px #369CF8 solid;
}

/* 窗口中被选中的标签 */
.kotorichan_app_remark_tab_selected {
  border-bottom: 3px #369CF8;
  color: #ffffff;
  background: #369CF8;
  border-bottom: 3px #369CF8 solid;
}

/* 窗口中被选中的标签鼠标经过 */
.kotorichan_app_remark_tab_selected:hover {
  color: #ffffff !important;
  border-bottom: 3px #369CF8 solid;
}

.kotorichan_app_remark_data_textarea {
  width: 100%;
  height: 100%;
  outline:none;
  resize: none;
}

.kotorichan_app_remark_data_submit {
  position: absolute;
  right: 15px;
  bottom: 1px;
}

.kotorichan_app_remark_friend_list {
  height: 100%;
  width: 100%;
  overflow-x:hidden;
  overflow-y:auto;
}

.kotorichan_app_remark_friend_item {
  position: relative;
  display: block;
  height: 40px;
  width: 100%;
  padding: 0 10px;
  margin: 15px 0;
  transition: all 0.5s;
}

.kotorichan_app_remark_friend_item:hover {
  background: rgba(54, 158, 248, 0.2);
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
}

.kotorichan_app_remark_friend_item img {
  height: 30px;
  width: 30px;
  margin: 5px 10px 5px 30px;
  border-radius: 30px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
}


.kotorichan_app_remark_friend_item small,
.kotorichan_app_remark_friend_item strong {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
.kotorichan_app_remark_friend_item small {
  color: #A8A8A8;
}

/* dark mode */
html[data-theme='dark'] .kotorichan_app_remark_friend_item small {
  color: #F7F7F7;
}

.kotorichan_app_remark_friend_ext {
  display: block;
  position: fixed;
  text-align: center;
  max-width: 220px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(5px);
  border-radius: 4px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
  z-index: 999999;
  transition: all 0.5s;
}

/* dark mode */
html[data-theme='dark'] .kotorichan_app_remark_friend_ext {
  background: rgba(59,59,59,0.7);
}

#kotorichan_app_remark_block_mask ul li,
.kotorichan_app_remark_friend_ext li {
  display: block;
  padding: 5px 10px;
}

.kotorichan_app_remark_friend_ext li img {
  display: block;
  width: 40px;
  height: 40px;
  margin: 5px auto;
  border-radius: 40px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
}

#kotorichan_app_remark_block_mask ul li a,
.kotorichan_app_remark_friend_ext li a {
  margin: 5px 10px;
}

#kotorichan_app_remark_block_mask ul li strong,
.kotorichan_app_remark_friend_ext li strong {
  color: #369CF8;
  padding: 2px;
  margin: 0 auto;
}

a.kotorichan_app_remark_a_friend,
a.kotorichan_app_remark_a_friend:link,
a.kotorichan_app_remark_a_friend:visited,
a.kotorichan_app_remark_a_friend:active,
html[data-theme='dark'] a.kotorichan_app_remark_a_friend,
html[data-theme='dark'] a.kotorichan_app_remark_a_friend:link,
html[data-theme='dark'] a.kotorichan_app_remark_a_friend:visited,
html[data-theme='dark'] a.kotorichan_app_remark_a_friend:active {
  color: orange;
}

#kotorichan_app_remark_block_mask {
  display: block;
  position: fixed;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(5px);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99998;
}

html[data-theme='dark'] .kotorichan_app_remark_bio .bio,
html[data-theme='dark'] #kotorichan_app_remark_block_mask {
  background: rgba(59,59,59,0.85);
}

#kotorichan_app_remark_block_mask ul {
  display: block;
  position: fixed;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
}

#kotorichan_app_remark_block_mask ul li img {
  display: block;
  width: 80px;
  height: 80px;
  margin: 5px auto;
  border-radius: 80px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
}

.kotorichan_app_remark_bio {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100000;
}

.kotorichan_app_remark_bio .bio {
  display: block;
  position: fixed;
  padding: 20px;
  width: 500px;
  max-width: 90%;
  max-width: calc(100% - 60px);
  height: 800px;
  max-height: 80%;
  max-height: calc(100% - 160px);
  top: 50%;
  left: 50%;
  overflow-x:hidden;
  overflow-y:auto;
  transform: translate(-50%,-50%);
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(5px);
  border-radius: 4px;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.2);
}

.kotorichan_app_remark_bio .bio .avatarNeue {
  display: block;
  margin: 30px auto;
  text-align: center;
  border-radius: 100px;
}

.kotorichan_app_remark_bio .bio .kotorichan_username {
  display: block;
  margin: 30px auto;
  text-align: center;
  font-size: 40px;
  line-height: 50px;
}
`);

(function(app){

(function(){
class AppBase {
    constructor() {
        const initRet = this.init();
        if(initRet instanceof Promise) {
            initRet.then(async()=>await this.enter());
        } else {
            this.enter();
        }
    }
    static get version() {return "1.0.0";}
    static get ver() {return this.version;}
    static get v() {return this.version;}
    get version() {return this.constructor.version;}
    get ver() {return this.constructor.version;}
    get v() {return this.constructor.version;}
    async init() {}
    async enter() {}
}

app.AppBase = AppBase;
})();

(function(){
const common = namespace.common;

/**
 * 备注插件
 * @class Remark
 * @module Remark
 * @extends app.AppBase
 * @version 0.1.0
 * @namespace kotorichan_app
 */
// jshint -W107
class Remark extends app.AppBase {
    constructor() {
        super();
    }
    static get version() {return "0.1.0";}
    /**
     * 初始化
     */
    enter() {
        this.m_remarks = this.__getRemarks()||{};
        if(typeof $ == "undefined"){
            // console.log('kotorichan remark init error');
            return false;
        }
        // delete localStorage.kotorichan_remarks;
        this.checkLoop();
        this.__initUI();
        this.__startParsePage();
        return true;
    }


    /**
     * 刷新好友列表信息
     * @param {function} onFlushOver 刷新完成后回调
     */
    flushFriendsInfomation(onFlushOver) {
        // console.log("kotorichan_app.Remark.flushFriendsInfomation");
        this.__ajaxGetFriendPage(res => {
            this.__clearFriends();
            // parse page
            $(res)
            .find("#memberUserList li")
            .each((idx,target) => {
                let friend_id = $(target).find('strong a').attr('href').split('/').pop();
                let friend_name = $(target).find('strong a').text().replace('\n','').trim();
                this.__addUsedName(friend_id, friend_name);
                this.__setFriend(friend_id, true);
            });
            // this.__saveRemarks();
            if(onFlushOver) onFlushOver(res);
            // kotorichan_app.remark.showFriendsRemark();
        });
    }

    /**
     * 循环刷新好友数据 5分钟一次
     */
    checkLoop(){
        // console.log("kotorichan_app.Remark.checkLoop");
        let loop = () => {
            console.log("kotorichan_app.Remark.checkLoop loop");
            let time = new Date().getTime();
            if(this.m_remarks.time != undefined && time - 300000 > this.m_remarks.time) return;
            this.m_remarks.time = time;
            this.flushFriendsInfomation();
        };
        setInterval(loop,300000);
        loop();
    }

    /**
     * 开始解析页面
     */
    __startParsePage() {
        const url = window.location.href;
        const matchs = {
            /**
             * 主页
             * @link https://bgm.tv
             */
            home: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/?$/g,
            /**
             * 用户页
             * @link https://bgm.tv/user/username
             * @link https://bgm.tv/anime/list/username
             */
            userPage: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/(user\/|anime\/list\/).+/g,
            /**
             * 频道/日志
             * @link https://bgm.tv/blog
             * @link https://bgm.tv/anime
             * @link https://bgm.tv/book
             * @link https://bgm.tv/music
             * @link https://bgm.tv/game
             * @link https://bgm.tv/real
             * @link https://bgm.tv/anime/blog
             * @link https://bgm.tv/book/blog
             * @link https://bgm.tv/music/blog
             * @link https://bgm.tv/game/blog
             * @link https://bgm.tv/real/blog
             */
            channelBlog: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/(blog|(anime|book|music|game|real)(\/blog)?)$/g,
            /**
             * 日志
             * @link https://bgm.tv/blog/blogid
             */
            blogPage: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/blog\/[0-9]+/g,
            /**
             * 目录留言
             * @link https://bgm.tv/index/indexid/comments
             */
            indexCommon: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/index\/[0-9]+\/comments/g,
            /**
             * 章节讨论
             * @link https://bgm.tv/ep/epid
             */
            epCommon: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/ep\/[0-9]+/g,
            /**
             * 小组讨论
             * @link https://bgm.tv/group/topic/topicid
             */
            groupTopic: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/group\/topic\/[0-9]+/g,
            /**
             * 条目界面
             * @link https://bgm.tv/subject/subjectid
             */
            subject: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/subject\/[0-9]+/g,
            /**
             * 条目界面吐槽
             * @link https://bgm.tv/subject/subjectid/comments
             */
            subjectComments: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/subject\/[0-9]+\/comments/g,
            /**
             * 条目界面评论
             * @link https://bgm.tv/subject/subjectid/reviews
             */
            subjectReviews: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/subject\/[0-9]+\/reviews/g,
            /**
             * 条目讨论版评论
             * @link https://bgm.tv/subject/subjectid/board
             */
            subjectBoard: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/subject\/[0-9]+\/board/g,
            /**
             * 条目讨论
             * @link https://bgm.tv/subject/topic/topicid
             */
            subjectTopic: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/subject\/topic\/[0-9]+/g,
            /**
             * 人物/角色页面
             * @link https://bgm.tv/character/characterid
             * @link https://bgm.tv/person/characterid
             */
            character: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/(character|person)\/[0-9]+/g,
            /**
             * 目录页面
             * @link https://bgm.tv/index
             * @link https://bgm.tv/index/browser
             */
            index: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/index(\/browser)?$/g,
            /**
             * 小组主页面
             * @link https://bgm.tv/group
             */
            groupMain: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/group$/g,
            /**
             * 小组页面
             * @link https://bgm.tv/group/groupid
             */
            group: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/group\/[0-9a-zA-Z_-].+(\/forum)?/g,
            /**
             * 超展开讨论
             * @link https://bgm.tv/rakuen/topic/(group|subject|ep|prsn|crt)/topicid
             */
            rakuenTopic: /^https?:\/\/(bgm.tv|bangumi.tv|chii.in)\/rakuen\/topic\/(group|subject|ep|prsn|crt)\/[0-9]+/g,
        };
        for(var page in matchs){
            const match = matchs[page];
            if(url.search(match)==-1) continue;
            switch(page){
                case 'home': {
                    this.__parseHomePage();
                    return;
                }
                case 'userPage': {
                    this.__parseUserPage();
                    return;
                }
                case 'channelBlog': {
                    this.__parseChannelBlog();
                    return;
                }
                case 'blogPage':
                case 'indexCommon':
                case 'epCommon':
                case 'groupTopic':
                case 'character':
                case 'subjectTopic':
                case 'rakuenTopic': {
                    this.__parseDisscussLikePage();
                    return;
                }
                case 'subject': {
                    this.__parseReviewLikePage();
                    this.__parseBoardLikePage();
                    this.__parseCommonBoxLikePage();
                    return;
                }
                case 'subjectReviews': {
                    this.__parseReviewLikePage();
                    return;
                }
                case 'subjectBoard': {
                    this.__parseBoardLikePage();
                    return;
                }
                case 'subjectComments': {
                    this.__parseCommonBoxLikePage();
                    return;
                }
                case 'index': {
                    this.__parseIndexLikePage();
                    return;
                }
                case 'groupMain': {
                    this.__parseGroupMainLikePage();
                    return;
                }
                case 'group': {
                    if(url.search(/group\/(my_reply|my_topic)+$/)!=-1) return;
                    this.__parseGroupLikePage();
                    return;
                }
                default: break;
            }
        }
    }

    /**
     * 解析主页
     */
    __parseHomePage() {
        console.log('主页');
        $('#timeline ul li').each((idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('span.info a')[0]);
            if(nameTarget.length<1) return;
            if(nameTarget.find('img').length>0){
                nameTarget = $(block.find('span.info a')[1]);
                if(nameTarget.length<1) return;
            }
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('span.avatar a');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        });

        $('ul.sideTpcList li').each((idx, target) => {
            let block = $(target);
            let head = $(block.find('a.avatar')[0]);
            if(head.length<1) return;
            let match = $(head.find('img')[0]).attr('src').match(/.*\/([0-9]+)\.jpg.*/);
            if(!match || match.length < 2) return;
            let userid = match[1];
            if(this.__getBlock(userid)){
                block.remove();
                return;
            }
            this.__onHoverShow(userid,head,0,()=>{
                block.remove();
            });
            head.attr('href','javascript:void(0)');
        });
    }

    /**
     * 解析用户页面
     */
    __parseUserPage() {
        console.log('用户页');
        $('#headerProfile').each((idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('.nameSingle div.inner a')[0]);
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                this.__showBlockMask(userid);
                // block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('div.headerAvatar a');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        });
    }

    /**
     * 解析频道/日志
     */
    __parseChannelBlog() {
        console.log('频道/日志');
        $('#news_list .item').each((idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('.time a')[0]);
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('p.cover.ll a');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        });

        $('.topic_list tr').each((idx, target) => {
            if(idx == 0) return;
            let block = $(target);
            let nameTarget = $($(block.find('td')[1]).find('a')[0]);
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            this.__onHoverShow(userid,nameTarget,0,()=>{
                block.remove();
            });
            nameTarget.attr('href','javascript:void(0)');
        });
    }

    /**
     * 解析类似讨论页的页面
     */
    __parseDisscussLikePage() {
        console.log('类似讨论页的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('strong a')[0]);
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('a.avatar');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('#comment_list > div.row_reply').each(process);
        $('#comment_list div.topic_sub_reply > div').each(process);
    }

    /**
     * 解析类似吐槽箱的页面
     */
    __parseCommonBoxLikePage() {
        console.log('类似吐槽箱的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('div.text a')[0]);
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('a.avatar');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('#comment_box > div.item').each(process);
    }

    /**
     * 解析类似评论的页面
     */
    __parseReviewLikePage() {
        console.log('类似评论的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('div.entry div.time span.tip_j a')[0]);
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('p.cover.ll a');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('#entry_list > div.item').each(process);
    }

    /**
     * 解析类似讨论版的页面
     */
    __parseBoardLikePage() {
        console.log('类似讨论版的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('td a')[1]);
            if(nameTarget.length<1) return;
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover = nameTarget;
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('table.topic_list tr').each(process);
    }

    /**
     * 解析类似目录的页面
     */
    __parseIndexLikePage() {
        console.log('类似目录的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('span.tip_i a')[0]);
            if(nameTarget.length<1) return;
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('.avatar a');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('#timeline ul li').each(process);
    }

    /**
     * 解析类似小组话题的页面
     */
    __parseGroupMainLikePage() {
        console.log('类似小组话题的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('td small.sub_title a')[0]);
            if(nameTarget.length<1) return;
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover;
            let head = block.find('img.avatar');
            if(head.length > 0){
                hover = $(head[0]);
            } else {
                hover = nameTarget;
            }
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('.topic_list tr').each(process);
    }

    /**
     * 解析类似小组的页面
     */
    __parseGroupLikePage() {
        console.log('类似小组的页面');
        let process = (idx, target) => {
            let block = $(target);
            let nameTarget = $(block.find('td.author a')[0]);
            if(nameTarget.length<1) return;
            let userid = nameTarget.attr('href').split('/').pop();
            if(this.__getBlock(userid)){
                block.remove();
                return;
            } else if(this.__getFriend(userid)) {
                nameTarget.addClass('kotorichan_app_remark_a_friend');
            }
            let hover = nameTarget;
            this.__onHoverShow(userid,hover,0,()=>{
                block.remove();
            });
            hover.attr('href','javascript:void(0)');
        };
        $('.topic_list tr').each(process);
    }

    /**
     * 初始化 UI
     */
    __initUI() {
        // console.log("kotorichan_app.Remark.__initUI");
        const mainWindowId = "kotorichan_app_remark_main_window";
        const mainWindowCenterId = "kotorichan_app_remark_center";
        const mainWindowTabGroupId = "kotorichan_app_remark_tabs";
        const mainWindowContentId = "kotorichan_app_remark_content";
        const mainWindowTabClass = "kotorichan_app_remark_tab";
        const mainWindowTabSelectClass = "kotorichan_app_remark_tab_selected";
        const dockId = "kotorichan_app_remark_dock";
        const dockMenuId = "kotorichan_app_remark_dock_menu";
        const dockMenuTabClass = "kotorichan_app_remark_dock_menu_tab";
        const mainWindowDataTextareaClass = "kotorichan_app_remark_data_textarea";
        const mainWindowDataSubmitClass = "kotorichan_app_remark_data_submit";
        const mainWindowFriendListClass = "kotorichan_app_remark_friend_list";
        const mainWindowFriendItemClass = "kotorichan_app_remark_friend_item";
        const tabs = {
            friends: {
                name: "好友列表",
                params:{
                    listClass: mainWindowFriendListClass,
                    itemClass: mainWindowFriendItemClass,
                }
            },
            blocks: {
                name: "屏蔽列表",
                params:{
                    listClass: mainWindowFriendListClass,
                    itemClass: mainWindowFriendItemClass,
                }
            },
            export: {
                name: "导出数据",
                params: {
                    textareaClass: mainWindowDataTextareaClass,
                    description: "复制出文本框中的内容保存"
                }
            },
            import: {
                name: "导入数据",
                params:{
                    textareaClass: mainWindowDataTextareaClass,
                    submitClass: mainWindowDataSubmitClass,
                    description: "将保存的内容贴入文本框",
                    submit: "导入",
                    question: "确定要导入吗, 将会把现有的数据覆盖",
                    error: "贴入的数据不正确哦",
                    success: "导入成功",
                }
            },
        };


        // 初始化主窗口
        this.__initMainWindow(mainWindowId, mainWindowCenterId, mainWindowTabGroupId, mainWindowContentId);
        // 初始化Dock
        this.__initDock(dockId,dockMenuId);
        // 初始化标签
        this.__initTabs(tabs, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass);
    }

    /**
     * 初始化组建主窗口
     * @param {string} mainWindowId 主窗口Id
     * @param {string} mainWindowCenterId 主窗口中心Id
     * @param {string} mainWindowTabGroupId 主窗口标签组Id
     * @param {string} mainWindowContentId 主窗口内容Id
     */
    __initMainWindow(mainWindowId, mainWindowCenterId, mainWindowTabGroupId, mainWindowContentId) {
        let mainWindow = $(
`<div id="${mainWindowId}">
    <div id="${mainWindowCenterId}">
        <ul id="${mainWindowTabGroupId}"></ul>
        <div id="${mainWindowContentId}"></div>
    </div>
</div>`);
        $('body').append(mainWindow);
        this.m_mainWindowShow = false;
        mainWindow.hide();
        this.m_mainWindowSwitch = (tab) => {
            if(this.m_mainWindowShow) {
                mainWindow.hide();
                this.m_mainWindowShow = false;
            } else {
                mainWindow.show();
                tab = tab || 0;
                $($(`#${mainWindowTabGroupId} > li`)[tab]).click();
                this.m_mainWindowShow = true;
            }
        };
        mainWindow.click(event => this.m_mainWindowSwitch());
        mainWindow.find(`#${mainWindowCenterId}`).click(() => { return false; });
    }

    /**
     * 初始化Dock菜单
     * @param {string} dockId DockId
     * @param {string} dockMenuId Dock菜单Id
     */
    __initDock(dockId, dockMenuId) {
        let dock_content = $(
`<li id="${dockId}">
    <a href="javascript:void(0);">屏蔽用户列表</a>
    <ul id="${dockMenuId}"></ul>
</li>`);
        dock_content.find('a').click(event => this.m_mainWindowSwitch());
        dock_content.insertAfter('#dock ul>li.first');
    }

    /**
     * 切换标签
     * @param {number}
     */
    __onTabChange(idx, mainWindowTabSelectClass, mainWindowTabGroupId) {
        // console.log("__onTabChange",idx);
        $(`.${mainWindowTabSelectClass}`).removeClass(mainWindowTabSelectClass);
        $($(`#${mainWindowTabGroupId} > li`)[idx]).addClass(mainWindowTabSelectClass);
    }

    /**
     * 初始化组建主窗口标签
     * @param {string} tabs 初始化的标签
     * @param {string} dockMenuId Dock菜单Id
     * @param {string} mainWindowTabGroupId 主窗口标签组Id
     * @param {string} mainWindowContentId 主窗口内容Id
     * @param {string} mainWindowTabClass 主窗口标签Class
     * @param {string} dockMenuTabClass Dock标签Class
     * @param {string} mainWindowTabSelectClass 主窗口内标签选中Class
     */
    __initTabs(tabs, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass) {
        const tabIniter = {
            friends: this.__initFriendTab.bind(this),
            blocks: this.__initBlockTab.bind(this),
            export: this.__initExporeTab.bind(this),
            import: this.__initImportTab.bind(this),
        };
        let idx = 0;
        for(const tab in tabs){
            if(!tabIniter[tab]) continue;
            tabIniter[tab](idx++, tabs[tab].name, tabs[tab].params, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass);
        }
    }

    /**
     * 初始化好友列表标签
     */
    __initFriendTab(idx, tabName, tabParams, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass) {
        let dockMenu = $(`#${dockMenuId}`);
        let mainWindowTabGroup = $(`#${mainWindowTabGroupId}`);
        let dockMenuTab = $(`<li class="${dockMenuTabClass}">${tabName}</li>`);
        let mainWindowTab = $(`<li class="${mainWindowTabClass}">${tabName}</li>`);
        dockMenu.append(dockMenuTab);
        mainWindowTabGroup.append(mainWindowTab);
        dockMenuTab.click(event => this.m_mainWindowSwitch(idx));
        mainWindowTab.click(()=>{
            this.__onTabChange(idx,mainWindowTabSelectClass,mainWindowTabGroupId);
            let mainWindowContent = $(`#${mainWindowContentId}`);
            mainWindowContent.find('*').remove();
            let friendList = $(`<ul class="${tabParams.listClass}"></ul>`);
            mainWindowContent.append(friendList);
            this.flushFriendsInfomation(fpage => $(fpage).find("ul#memberUserList li.user").each((idx,userContent) => {
                userContent = $(userContent);

                let userid = userContent.find('strong a').attr('href').split('/').pop();
                let username = userContent.find('strong').text().trim();
                let img = userContent.find('img').attr('src');

                let item = $(`<li class="${tabParams.itemClass}"></li>`);
                let num = $(`<small>${idx+1}</small>`);
                let head = $(`<img src="${img}" />`);
                let name = $(`<strong>${username}</strong>`);
                this.__onHoverShow(userid,head);
                item.append(num);
                item.append(head);
                item.append(name);
                friendList.append(item);
                // console.log(idx,userContent);
            }));
        });
    }

    /**
     * 初始化屏蔽列表标签
     */
    __initBlockTab(idx, tabName, tabParams, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass) {
        let dockMenu = $(`#${dockMenuId}`);
        let mainWindowTabGroup = $(`#${mainWindowTabGroupId}`);
        let dockMenuTab = $(`<li class="${dockMenuTabClass}">${tabName}</li>`);
        let mainWindowTab = $(`<li class="${mainWindowTabClass}">${tabName}</li>`);
        dockMenu.append(dockMenuTab);
        mainWindowTabGroup.append(mainWindowTab);
        dockMenuTab.click(event => this.m_mainWindowSwitch(idx));
        mainWindowTab.click(()=>{
            this.__onTabChange(idx,mainWindowTabSelectClass,mainWindowTabGroupId);
            let mainWindowContent = $(`#${mainWindowContentId}`);
            mainWindowContent.find('*').remove();
            let blockList = $(`<ul class="${tabParams.listClass}"></ul>`);
            mainWindowContent.append(blockList);

            this.__getBlocks().forEach( (userid, idx) => {
                let item = $(`<li class="${tabParams.itemClass}"></li>`);
                let num = $(`<small>${idx+1}</small>`);
                let head = $(`<img src="//lain.bgm.tv/pic/user/m/icon.jpg" />`);
                let name = $(`<strong>${userid}</strong>`);
                this.__ajaxGetUserInfo(userid,data => {
                    name.text(data.nickname);
                    head.attr('src',data.avatar.medium.replace("http:",window.location.protocol));
                });
                this.__onHoverShow(userid,head,1,()=>{
                    item.remove();
                });
                item.append(num);
                item.append(head);
                item.append(name);
                blockList.append(item);
            });
        });
    }

    /**
     * 初始化导出数据标签
     */
    __initExporeTab(idx, tabName, tabParams, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass) {
        let dockMenu = $(`#${dockMenuId}`);
        let mainWindowTabGroup = $(`#${mainWindowTabGroupId}`);
        let dockMenuTab = $(`<li class="${dockMenuTabClass}">${tabName}</li>`);
        let mainWindowTab = $(`<li title="${tabParams.description}" class="${mainWindowTabClass}">${tabName}</li>`);
        dockMenu.append(dockMenuTab);
        mainWindowTabGroup.append(mainWindowTab);
        dockMenuTab.click(event => this.m_mainWindowSwitch(idx));
        // 主要逻辑
        mainWindowTab.click(()=>{
            this.__onTabChange(idx,mainWindowTabSelectClass,mainWindowTabGroupId);
            let mainWindowContent = $(`#${mainWindowContentId}`);
            mainWindowContent.find('*').remove();
            // 在content中增加一个textarea置入序列号后的本地数据
            mainWindowContent.append(`<textarea title="${tabParams.description}" class="${tabParams.textareaClass}">${JSON.stringify(this.m_remarks)}</textarea>`);
        });
    }

    /**
     * 初始化导入数据标签
     */
    __initImportTab(idx, tabName, tabParams, dockMenuId, mainWindowTabGroupId, mainWindowContentId, mainWindowTabClass, dockMenuTabClass, mainWindowTabSelectClass) {
        let dockMenu = $(`#${dockMenuId}`);
        let mainWindowTabGroup = $(`#${mainWindowTabGroupId}`);
        let dockMenuTab = $(`<li class="${dockMenuTabClass}">${tabName}</li>`);
        let mainWindowTab = $(`<li title="${tabParams.description}" class="${mainWindowTabClass}">${tabName}</li>`);
        dockMenu.append(dockMenuTab);
        mainWindowTabGroup.append(mainWindowTab);
        // 主要逻辑
        dockMenuTab.click(event => this.m_mainWindowSwitch(idx));
        mainWindowTab.click(()=>{
            this.__onTabChange(idx,mainWindowTabSelectClass,mainWindowTabGroupId);
            let mainWindowContent = $(`#${mainWindowContentId}`);
            mainWindowContent.find('*').remove();
            // 在content中增加一个textarea
            mainWindowContent.append(`<textarea title="${tabParams.description}" placeholder="${tabParams.description}" class="${tabParams.textareaClass}"></textarea>`);
            let submit = $(`<a href="javascript:void(0)" class="chiiBtn rr ${tabParams.submitClass}">${tabParams.submit}</a>`);
            submit.click(()=>{
                let answer = confirm(tabParams.question);
                // 用户确定了要导入
                if(answer) {
                    let inputData = $(mainWindowContent.find(`.${tabParams.textareaClass}`)[0]).val();
                    // console.log(inputData);
                    try {
                        inputData = JSON.parse(inputData);
                        // 数据不完整
                        if( typeof inputData.relationship_emui != 'object' ||
                            typeof inputData.people!= 'object' ||
                            typeof inputData.friends!= 'object' ||
                            typeof inputData.blocks!= 'object'
                        ){
                            throw new Error('Remark Content Error');
                        }
                        // 导入数据
                        this.m_remarks = inputData;
                        this.__saveRemarks();
                        alert(tabParams.success);
                    } catch (error) {
                        // JSON解析出错
                        alert(tabParams.error);
                    }
                }
            });
            mainWindowContent.append(submit);
        });
    }

    /**
     * 鼠标经过悬浮窗
     * @param {string} userid 用户id
     * @param {jQueryHTMLElemeent} target HTML节点
     * @param {number} showBlock 显示屏蔽按钮类型
     * @param {function} onBlockAlert 屏蔽状态改变回调
     */
    __onHoverShow(userid, target, showBlock, onBlockAlert) {
        const extClass = "kotorichan_app_remark_friend_ext";
        const bioClass = "kotorichan_app_remark_bio";

        $(target).hover(ev => {
            let ext = $(`<ul class="${extClass}"></ul>`);
            ext.hover(()=>{},()=>{
                ext.remove();
            });
            $(`.${extClass}`).remove();
            $('body').append(ext);
            let remark = this.__getRemark(userid);
            let usedNames = this.__getUsedName(userid);

            let head = $(`<img src="" />`);
            let quickRemark = $(`<strong>${userid}</strong>`);
            let pm = $(`<a class="chiiBtn" href="javascript:void(0)">PM</a></li>`);
            ext.append($("<li></li>").append(head));
            ext.append($("<li></li>").append(quickRemark));
            ext.append($("<li></li>").append(pm));
            this.__ajaxGetUserInfo(userid,data=>{
                head.attr("src",data.avatar.medium.replace("http:",window.location.protocol));
                quickRemark.text(data.nickname);
                quickRemark.click(()=>{
                    let conf = confirm(`将Ta快速备注为"${data.nickname}"?`);
                    if(conf) {
                        this.__setRemark(userid,data.nickname);
                    }
                });
                pm.attr("href",`/pm/compose/${data.id}.chii`);
            });

            head.click(()=>{
                $.get(`${window.location.origin}/user/${userid}`,ret => {
                    ret = $(ret);
                    let bio = ret.find("#user_home .intro .bio");
                    if(bio.length<1) return;
                    bio = $(bio);
                    $(`.${bioClass}`).remove();
                    let bioMask = $(`<div class="${bioClass}"></div>`);
                    $('body').append(bioMask);
                    bioMask.append(bio);
                    if(this.__getFriend(userid)) {
                        bio.prepend(ret.find(".nameSingle .inner a").attr("class","kotorichan_app_remark_a_friend kotorichan_username"));
                    } else {
                        bio.prepend(ret.find(".nameSingle .inner a").attr("class","kotorichan_username"));
                    }
                    bio.prepend(ret.find(".nameSingle .headerAvatar a span"));
                    bio.click((e)=>{
                        e.stopPropagation();
                    });
                    bioMask.click(()=>{
                        bioMask.remove();
                    });
                });
            });
            let gotoUserPage = $(`<a class="chiiBtn" href="/user/${userid}">查看主页</a>`);
            ext.append($("<li></li>").append(gotoUserPage));
            switch(showBlock){
                case 0:{
                    let blockBtn = $(`<a class="chiiBtn" href="javascript:void(0)">屏蔽Ta</a>`);
                    ext.append($("<li></li>").append(blockBtn));
                    blockBtn.click(()=>{
                        let conf = confirm("真的要屏蔽吗？");
                        if(conf) {
                            this.__setBlock(userid,true);
                            if(onBlockAlert) onBlockAlert(true);
                        }
                    });
                    break;
                }
                case 1:{
                    let blockBtn = $(`<a class="chiiBtn" href="javascript:void(0)">取消屏蔽</a>`);
                    ext.append($("<li></li>").append(blockBtn));
                    blockBtn.click(()=>{
                        let conf = confirm("真的要取消屏蔽吗？");
                        if(conf) {
                            this.__setBlock(userid,false);
                            if(onBlockAlert) onBlockAlert(false);
                        }
                    });
                    this.__FixPos(ext,ev.clientX,ev.clientY);
                    return;
                }
                default: break;
            }
            let btn;
            if(remark) {
                ext.append(`<li><strong>备注</strong></li>`);
                btn = $(`<li>${remark}</li>`);
                ext.append(btn);
            } else {
                btn = $(`<a class="chiiBtn" href="javascript:void(0)">添加备注</a>`);
                ext.append($("<li></li>").append(btn));
            }
            btn.click(()=>{
                let judge = prompt("备注:",remark);
                if(judge) {
                    this.__setRemark(userid,judge);
                }
            });

            if(usedNames.length >0) {
                ext.append(`<li><strong>曾用名</strong></li>`);
                for(const usedName of usedNames){
                    ext.append(`<li>${usedName}</li>`);
                }
            }
            this.__FixPos(ext,ev.clientX,ev.clientY);
        },()=>{ });
    }

    /**
     * 修复悬浮框在屏幕中的位置
     * @param {jQueryHTMLElemeent} ui HTML节点
     * @param {number} x x轴
     * @param {number} y y轴
     */
    __FixPos(ui,x,y) {
        const mfix = 8;
        x -= mfix;
        y -= mfix;
        let zoom = $(window);
        if(ui.height() + y >= zoom.height()){
            ui.css("bottom", 0);
        } else {
            ui.css("top", y);
        }
        if(ui.width() + x >= zoom.width()){
            ui.css("right", 0);
        } else {
            ui.css("left", x);
        }
    }

    /**
     * 显示屏蔽用户蒙板
     * @param {string} userid 用户id
     */
    __showBlockMask(userid) {
        const maskId = "kotorichan_app_remark_block_mask";

        let mask = $(`<ul></ul>`);
        $('body').append($(`<div id="${maskId}"></div>`).append(mask));
        let head = $(`<img src="" />`);
        let quickRemark = $(`<strong>${userid}</strong>`);
        mask.append($("<li></li>").append(head));
        mask.append($("<li></li>").append(quickRemark));
        this.__ajaxGetUserInfo(userid,data=>{
            head.attr("src",data.avatar.large.replace("http:",window.location.protocol));
            quickRemark.text(data.nickname);
        });
        let blockBtn = $(`<a class="chiiBtn" href="javascript:void(0)">取消屏蔽</a>`);
        mask.append($("<li></li>").append(blockBtn));
        blockBtn.click(()=>{
            let conf = confirm("真的要取消屏蔽吗？");
            if(conf) {
                this.__setBlock(userid,false);
                $("#kotorichan_app_remark_block_mask").remove();
            }
        });

        let close = $(`<a class="chiiBtn" href="javascript:void(0)">关闭蒙版</a>`);
        mask.append($("<li></li>").append(close));
        close.click(()=>{
            $("#kotorichan_app_remark_block_mask").remove();
        });
    }

    /**
     * ajax api 获取用户信息
     * @param {string} userid 用户id
     * @param {function} onSuccess 获取成功回调
     * @param {function} onError 获取失败回调
     */
    __ajaxGetUserInfo(userid, onSuccess, onError) {
        if(!onSuccess) onSuccess = () => {};
        if(!onError) onError = () => {};
        $.ajax({
            url:'https://api.bgm.tv/user/'+userid,
            method:'GET',
            dataType:'json',
            success:res => onSuccess(res),
            error: ()=>onError()
        });
    }

    /**
     * Ajax 获取好友列表页面
     * @param {function} onSuccess 成功时回调
     */
    __ajaxGetFriendPage(onSuccess) {
        // console.log("kotorichan_app.Remark.__ajaxGetFriendPage");
        // ajax require friends page
        if(!onSuccess) onSuccess = () => {};
        $.ajax({
            url:$("#dock a")[0].href+'/friends',
            method:'GET',
            dataType:'text',
            success:res => onSuccess(res)
        });
    }

    /**
     * 获取屏蔽列表
     * @returns {array} 屏蔽列表
     */
    __getBlocks() {
        // console.log("kotorichan_app.Remark.__getBlocks");
        return this.m_remarks.blocks;
    }

    /**
     * 获取屏蔽关系
     * @param {string} userid 用户id
     * @returns {boolean} 是否为屏蔽
     */
    __getBlock(userid) {
        // console.log("kotorichan_app.Remark.__getBlock(",userid,')');
        return this.m_remarks.blocks.indexOf(userid) != -1;
    }

    /**
     * 设置屏蔽关系
     * @param {string} userid 用户id
     * @param {boolean} isBlock 是否为屏蔽
     */
    __setBlock(userid, isBlock) {
        // console.log("kotorichan_app.Remark.__setBlock(",userid,isBlock,')');
        let inBlocks = this.__getBlock(userid);
        if(isBlock) {
            if(!inBlocks) {
                this.m_remarks.blocks.push(userid);
                this.__saveRemarks();
            }
        } else {
            if(inBlocks) {
                this.m_remarks.blocks.splice(this.m_remarks.blocks.indexOf(userid),1);
                this.__saveRemarks();
            }
        }
    }

    /**
     * 获取好友列表
     * @returns {array} 好友列表
     */
    __getFriends() {
        // console.log("kotorichan_app.Remark.__getFriends");
        return this.m_remarks.friends;
    }

    /**
     * 获取好友关系
     * @param {string} userid 用户id
     * @returns {boolean} 是否为好友
     */
    __getFriend(userid) {
        // console.log("kotorichan_app.Remark.__getFriend(",userid,')');
        return this.m_remarks.friends.indexOf(userid) != -1;
    }

    /**
     * 设置好友关系
     * @param {string} userid 用户id
     * @param {boolean} isFriend 是否为好友
     */
    __setFriend(userid, isFriend) {
        // console.log("kotorichan_app.Remark.__setFriend(",userid,isFriend,')');
        let inFriends = this.__getFriend(userid);
        if(isFriend) {
            if(!inFriends) {
                this.m_remarks.friends.push(userid);
                this.__saveRemarks();
            }
        } else {
            if(inFriends) {
                this.m_remarks.friends.splice(this.m_remarks.friends.indexOf(userid),1);
                this.__saveRemarks();
            }
        }
    }

    /**
     * 清空好友列表
     */
    __clearFriends() {
        // console.log("kotorichan_app.Remark.__clearFriends");
        this.m_remarks.friends = [];
        this.__saveRemarks();
    }

    /**
     * 获取备注
     * @param {string} userid 用户id
     * @returns {string} 备注, 默认 undefined
     */
    __getRemark(userid) {
        // console.log("kotorichan_app.Remark.__getRemark(",userid,')');
        return this.m_remarks.people[userid]?this.m_remarks.people[userid].m:void 0;
    }

    /**
     * 设置备注
     * @param {string} userid 用户id
     * @param {string} remark 备注
     */
    __setRemark(userid, remark) {
        // console.log("kotorichan_app.Remark.__setRemark(",userid,remark,')');
        if(!this.m_remarks.people[userid]) {
            this.__newPeople(userid);
        }
        this.m_remarks.people[userid].m = remark;
        this.__saveRemarks();
    }

    /**
     * 获取曾用名列表
     * @param {string} userid 用户id
     * @returns {array} 用户曾用名列表默认空数组
     */
    __getUsedName(userid) {
        // console.log("kotorichan_app.Remark.__getUsedName(",userid,')');
        return this.m_remarks.people[userid]?this.m_remarks.people[userid].u:[];
    }

    /**
     * 增加一个曾用名
     * @param {string} userid 用户id
     * @param {string} name 用户名
     */
    __addUsedName(userid, name) {
        // console.log("kotorichan_app.Remark.__addUsedName(",userid,name,')');
        if(!this.m_remarks.people[userid]) {
            this.__newPeople(userid, name);
        } else if (this.m_remarks.people[userid].u.indexOf(name) == -1) {
            this.m_remarks.people[userid].u.push(name);
            this.__saveRemarks();
        }
    }

    /**
     * 新建一个用户数据
     * @param {string} userid 用户id
     * @param {string} name 用户名
     * @returns {object} 用户数据
     */
    __newPeople(userid, name) {
        // console.log("kotorichan_app.Remark.__newPeople(",userid,name,')');
        if(!this.m_remarks.people[userid]) {
            this.m_remarks.people[userid] = {
                u: [],  // 曾用名列表
            };
            if(name) this.m_remarks.people[userid].u.push(name);
        } else if(name){
            this.__addUsedName(userid, name);
        }
        this.__saveRemarks();
        return this.m_remarks.people[userid];
    }

    /**
     * 从 localStorage 中获取数据如果没有数据会自动初始化
     */
    __getRemarks() {
        // console.log("kotorichan_app.Remark.__getRemarks");
        return localStorage.kotorichan_remarks
            ? JSON.parse(localStorage.kotorichan_remarks)
            : {
                relationship_emui:{
                    FRIEND:0,
                    UNFAMILIAR:1,
                },
                people:{},  // 用户信息
                friends:[], // 好友列表
                blocks:[],  // 屏蔽列表
                v: this.v
            };
    }

    /**
     * 保存数据到 localStorage
     */
    __saveRemarks() {
        // console.log("kotorichan_app.Remark.__saveRemarks");
        localStorage.kotorichan_remarks=JSON.stringify(this.m_remarks);
    }
}

app.Remark = Remark;
common.ready(()=>new Remark());
})();

})(namespace.app||(namespace.app={}));

})(target[namespace]||(target[namespace]={}));