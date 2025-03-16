// ==UserScript==
// @name         Bangumi 社区助手 preview
// @namespace    b38.dev
// @version      0.1.12
// @author       神戸小鳥 @vickscarlet
// @description  社区助手预览版 with React
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/community
// @match        *://bgm.tv/*
// @match        *://chii.in/*
// @match        *://bangumi.tv/*
// @require      https://cdn.jsdelivr.net/npm/umd-react/dist/react.production.min.js
// @require      https://cdn.jsdelivr.net/npm/umd-react/dist/react-dom.production.min.js
// @require      https://cdn.jsdelivr.net/npm/umd-react/dist/react-dom.production.min.js
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(r=>{if(typeof GM_addStyle=="function"){GM_addStyle(r);return}const o=document.createElement("style");o.textContent=r,document.head.append(o)})(` @keyframes loading-spine{to{transform:rotate(.5turn)}}.v-loading{display:grid!important;place-items:center!important;grid-template:none!important;--loading-size: 50px;--loading-color: #fff;>*{display:none!important}>.v-loading-item{display:block!important;width:var(--loading-size)!important;height:var(--loading-size)!important;aspect-ratio:1!important;border-radius:50%!important;border:calc(var(--loading-size) / 6.25) solid!important;box-sizing:border-box!important;border-color:var(--loading-color) transparent!important;animation:loading-spine 1s infinite!important}>.v-loading-item:before,>.v-loading-item:after{content:none!important}}.v-board{--board-color-font: black;--board-color-from: #ccc;--board-color-to: #fff;--board-color-alpha: .05;--board-before-opacity: .2;--board-before-bg: transparent;color:var(--board-color-font);padding:10px;position:relative;border-radius:4px}.v-board:after,.v-board:before{content:"";position:absolute;border-radius:4px;inset:0;background-size:cover;z-index:-10}.v-board:before{background:var(--board-before-bg);opacity:var(--board-before-opacity)}.v-board:after{opacity:1;background:linear-gradient(150deg,rgb(from var(--board-color-from) r g b / var(--board-color-alpha)),rgb(from var(--board-color-to) r g b / var(--board-color-alpha)) 75%);box-shadow:0 0 1px rgb(from var(--color-bangumi-2) r g b / .5);backdrop-filter:blur(10px)}.v-tip-item{position:relative;cursor:pointer;>.v-tip:last-child{visibility:hidden;position:absolute;top:0;left:50%;transform:translate(-50%,calc(-100% - 10px));padding:2px 5px;border-radius:5px;background:rgb(from var(--color-black) r g b / .6);white-space:nowrap;color:var(--color-white);z-index:100}>.v-tip:last-child:after{content:"";position:absolute!important;bottom:0;left:50%;border-top:5px solid rgb(from var(--color-black) r g b / .6);border-right:5px solid transparent;border-left:5px solid transparent;transform:translate(-50%,100%)}}.v-tip-item:hover{.v-tip:last-child{visibility:visible}}.v-switch{display:inline-block;position:relative;cursor:pointer;border-radius:50px;height:12px;width:40px;border:1px solid var(--color-switch-border)}.v-switch:before{content:"";display:block;position:absolute;pointer-events:none;height:12px;width:40px;top:0;border-radius:24px;background-color:var(--color-switch-off)}.v-switch:after{content:"";display:block;position:absolute;pointer-events:none;top:0;left:0;height:12px;width:24px;border-radius:24px;box-sizing:border-box;background-color:var(--color-switch-bar-inner);border:5px solid var(--color-switch-bar-border)}.v-switch[data-enabled=enabled]:before{background-color:var(--color-switch-on)}.v-switch[data-enabled=enabled]:after{left:16px}#dock{a{position:relative;display:grid;place-items:center}li:not(:last-child){border-right:1px solid var(--color-dock-sp)}}.v-serif{font-family:source-han-serif-sc,source-han-serif-japanese,\u5B8B\u4F53,\u65B0\u5B8B\u4F53;font-weight:900}.v-avatar.v-board{min-width:120px;max-width:280px;height:180px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;img{width:100px;height:100px;border-radius:100px;object-fit:cover}span{position:absolute;top:5px;right:0;transform:translate(100%) rotate(90deg);transform-origin:0% 0%}span:before{content:"@"}svg{width:100%;height:50px;text{transform:translate(50%,.18em);text-anchor:middle;dominant-baseline:hanging}}}.v-actions.v-board{--loading-size: 24px;display:grid;padding:0;height:34px;grid-template-columns:repeat(4,1fr);grid-template-areas:"home pm friend blocked";>*{position:relative;display:grid;place-items:center;width:100%;padding:10px 0}>.v-home{grid-area:home}>.v-pm{grid-area:pm}>.v-friend{grid-area:friend}>.v-blocked{grid-area:blocked}>*:not(.v-blocked):after{position:absolute;content:"";width:2px;height:calc(100% - 10px);top:5px;right:-1px;background:rgb(from var(--board-color-from) r g b / .25)}}.v-stats{--loading-size: 24px;padding:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);>.v-stat{line-height:14px;font-size:14px;font-weight:700;padding:2px 5px;background:rgb(from var(--color-stat) r g b / .25)}>.v-stat:hover{background:rgb(from var(--color-stat) r g b / .5)}>.v-stat:first-child{border-radius:4px 0 0}>.v-stat:nth-child(3){border-radius:0 4px 0 0}>.v-stat:last-child{border-radius:0 0 4px}>.v-stat:nth-child(4){border-radius:0 0 0 4px}>.v-coll{--color-stat: var(--color-bangumi)}>.v-done{--color-stat: var(--color-green)}>.v-rate{--color-stat: var(--color-skyblue)}>.v-avg{--color-stat: var(--color-yellow)}>.v-std{--color-stat: var(--color-purple)}>.v-cnt{--color-stat: var(--color-blue)}}.v-chart{--loading-size: 24px;padding:0;display:grid;grid-template-rows:repeat(10,4px);>*{display:flex;justify-content:flex-start!important;width:100%;.v-bar{height:2px;background:rgb(from var(--color-bangumi) r g b / .65);transition:all .3s ease}}>*:first-child:before,*:first-child>.v-bar{border-radius:4px 4px 0 0}>*:last-child:before,*:last-child>.v-bar{border-radius:0 0 4px 4px}>*:before{content:"";position:absolute;top:1px;left:0;width:100%;height:2px;background:rgb(from var(--color-bangumi) r g b / .15);z-index:-1;transition:all .3s ease}>*:hover:before{background:rgb(from var(--color-bangumi) r g b / .3)}>*:hover>.bar{background:rgb(from var(--color-bangumi) r g b / 1)}}fieldset.v-board{padding-top:24px;legend{position:absolute;font-weight:700;top:5px;left:5px;padding:0;line-height:12px;font-size:12px;display:flex;align-items:center;gap:.5em;color:var(--color-bangumi-font);>svg{width:14px;height:14px}}}fieldset.v-board.v-actions-board{position:relative;>.v-actions-list{color:var(--color-base-font);position:absolute;display:flex;justify-content:center;top:5px;right:5px;gap:5px}}fieldset.v-board.v-actions-board{>textarea{width:100%;height:100%;resize:vertical;border:none;padding:0;box-sizing:border-box;background:rgb(from var(--color-base) r g b / .1);border-radius:4px;max-height:100%;font-size:12px;line-height:18px;color:var(--color-font);overscroll-behavior:contain}>textarea:focus,>textarea:hover{box-shadow:0 0 1px rgb(from var(--color-bangumi) r g b / .5)}>textarea+*{visibility:hidden}}ul.v-tag-list{display:flex;flex-wrap:wrap;gap:4px;>li{padding:0 5px;border-radius:50px;background:rgb(from var(--color-font) r g b / .25);border:1px solid var(--color-font);box-sizing:border-box;white-space:pre}}.v-board .v-tag-list{--color-font: var(--board-color-font)}html,html[data-theme=dark]{#community-helper-user-panel{position:fixed!important;z-index:9999;display:grid;place-items:center;inset:0;>.v-close-mask{position:absolute;z-index:-100;display:grid;place-items:center;inset:0;background:rgb(from var(--color-base) r g b / .5);cursor:pointer;backdrop-filter:blur(5px)}>.v-container{max-width:1280px;min-height:390px;max-height:600px;width:calc(100% - 60px);height:calc(100vh - 60px);display:grid;grid-template-columns:auto auto auto 1fr auto;grid-template-rows:180px 34px 36px 40px calc(100% - 310px);gap:5px 5px;padding:30px 5px 5px;margin-bottom:25px;grid-template-areas:"avatar note note note bio" "actions note note note bio" "stats note note note bio" "chart note note note bio" "usedname usedname tags tags bio";>.v-loading{--loading-color: var(--color-bangumi)}>.v-board{--board-color-font: var(--color-bangumi-font);--board-color-from: var(--color-base-2);--board-color-to: var(--color-base-2)}>.v-avatar{grid-area:avatar;--board-color-font: var(--color-bangumi);--board-color-from: var(--color-bangumi);--board-color-alpha: .25;min-width:120px;max-width:280px}>.v-actions{grid-area:actions;--board-color-from: var(--color-yellow);--board-color-font: var(--color-yellow-font)}>.v-stats{grid-area:stats;--board-color-font: var(--color-base-font)}>.v-chart{grid-area:chart;--board-color-font: var(--color-base-font)}>.v-tags{grid-area:tags;min-width:200px;--board-color-from: var(--color-blue);--board-color-font: var(--color-blue-font);>.v-wrapper{max-height:100%}}>.v-note{grid-area:note;min-width:200px;--board-color-from: var(--color-green);--board-color-font: var(--color-green-font);white-space:pre-wrap;>.v-wrapper{height:100%;>*{max-height:100%}}}>.v-usedname{grid-area:usedname;--board-color-from: var(--color-purple);--board-color-font: var(--color-purple-font);max-width:400px;min-width:200px;>.v-wrapper{max-height:100%}}>.v-bio{grid-area:bio;--board-color-from: var(--color-bangumi);--board-color-font: var(--color-base-font);max-width:505px;min-width:300px;max-height:calc(100% - 34px);>.v-wrapper{height:calc(100% + 2px)}}}}@media (max-width: 850px){#community-helper-user-panel>.v-container{grid-template-columns:auto auto auto 1fr;grid-template-rows:180px 34px 36px 40px auto auto;max-height:900px;grid-template-areas:"avatar note note note" "actions note note note" "stats note note note" "chart note note note" "usedname usedname tags tags" "bio bio bio bio";>.v-tags,>.v-usedname{max-height:300px}>.v-bio{max-width:100%;max-height:100%}}}@media (max-width: 520px){#community-helper-user-panel>.v-container{grid-template-columns:1fr;grid-template-rows:180px 34px 36px 40px auto auto auto auto;max-height:1100px;grid-template-areas:"avatar" "actions" "stats" "chart" "note" "usedname" "tags" "bio";>.v-board{min-width:130px;width:calc(100% - 20px);max-width:calc(100% - 20px)}>.v-actions,>.v-stats,>.v-chart{width:100%;max-width:100%}>.v-note{max-height:200px}>.v-tags,>.v-usedname{max-height:150px}>.v-bio{max-height:100%}}}}.v-sicky-reply{position:sticky;top:0;z-index:2;display:grid;height:auto;grid-template-rows:0fr;border-radius:4px;backdrop-filter:blur(5px);transition:all .3s ease;width:calc(100% - 1px);overflow:hidden;margin-bottom:5px;background-color:var(--color-sicky-bg);border:1px solid var(--color-sicky-border);box-shadow:0 0 0 2px var(--color-sicky-shadow);textarea{background-color:var(--color-sicky-textarea)}}.v-sicky-reply:has(:focus),.v-sicky-reply:hover{grid-template-rows:1fr;background-color:var(--color-sicky-hover-bg);border:1px solid var(--color-sicky-hover-border);box-shadow:0 0 4px var(--color-sicky-hover-shadow)}#reply_wrapper{position:relative;padding:5px;min-height:50px;margin:0;textarea.reply{width:100%!important}.v-switch{position:absolute;right:10px;top:10px}.tip.rr+.switch{top:35px}}html{--color-bangumi: #fd8a96;--color-white: #ffffff;--color-black: #000000;--color-yellow: #f9c74c;--color-purple: #a54cf9;--color-blue: #02a3fb;--color-green: #95eb89;--color-red: #f94144;--color-skyblue: #7ed2ff}html{--color-base: #ffffff;--color-base-2: #e8e8e8;--color-base-bg: #eaeffba0;--color-base-font: #282828;--color-gray-1: #e8e8e8;--color-gray-2: #cccccc;--color-gray-3: #aaaaaa;--color-gray-4: #969696;--color-gray-11: #cccccc;--color-bangumi-2: #AB515D;--color-bangumi-font: rgb(from var(--color-bangumi) calc(r - 50) calc(g - 50) calc(b - 50) );--color-yellow-font: rgb(from var(--color-yellow) calc(r - 50) calc(g - 50) calc(b - 50) );--color-purple-font: rgb(from var(--color-purple) calc(r - 50) calc(g - 50) calc(b - 50) );--color-blue-font: rgb(from var(--color-blue) calc(r - 50) calc(g - 50) calc(b - 50) );--color-green-font: rgb(from var(--color-green) calc(r - 50) calc(g - 50) calc(b - 50) );--color-red-font: rgb(from var(--color-red) calc(r - 50) calc(g - 50) calc(b - 50) )}html[data-theme=dark]{--color-base: #000000;--color-base-2: #1f1f1f;--color-base-bg: #23262ba0;--color-base-font: #e8e8e8;--color-gray-1: #444444;--color-gray-2: #555555;--color-gray-3: #6a6a6a;--color-gray-4: #888888;--color-gray-11: #cccccc;--color-bangumi-2: #ffb6bd;--color-bangumi-font: rgb(from var(--color-bangumi) calc(r + 50) calc(g + 50) calc(b + 50) );--color-yellow-font: rgb(from var(--color-yellow) calc(r + 50) calc(g + 50) calc(b + 50) );--color-purple-font: rgb(from var(--color-purple) calc(r + 50) calc(g + 50) calc(b + 50) );--color-blue-font: rgb(from var(--color-blue) calc(r + 50) calc(g + 50) calc(b + 50) );--color-green-font: rgb(from var(--color-green) calc(r + 50) calc(g + 50) calc(b + 50) );--color-red-font: rgb(from var(--color-red) calc(r + 50) calc(g + 50) calc(b + 50) )}html{--color-dock-sp: var(--color-gray-2);--color-switch-border: var(--color-gray-2);--color-switch-on: var(--color-green);--color-switch-off: var(--color-gray-4);--color-switch-bar-border: var(--color-white);--color-switch-bar-inner: var(--color-gray-11);--color-hover: var(--color-blue);--color-icon-btn-bg: rgb(from var(--color-bangumi) r g b / .25);--color-icon-btn-color: var(--color-white);--color-reply-sp: var(--color-gray-1);--color-reply-tips: var(--color-gray-3);--color-reply-normal: var(--color-bangumi);--color-reply-owner: var(--color-yellow);--color-reply-floor: var(--color-purple);--color-reply-friend: var(--color-green);--color-reply-self: var(--color-blue);--color-sicky-bg: rgb(from var(--color-base) r g b / .125);--color-sicky-border: rgb(from var(--color-bangumi) r g b / .25);--color-sicky-shadow: rgb(from var(--color-base) r g b / .05);--color-sicky-textarea: rgb(from var(--color-base) r g b / .8);--color-sicky-hover-bg: rgb(from var(--color-bangumi) r g b / .125);--color-sicky-hover-border: var(--color-bangumi);--color-sicky-hover-shadow: var(--color-bangumi);--color-primary: var(--color-bangumi);--color-secondary: var(--color-blue);--color-success: var(--color-green);--color-info: var(--color-blue);--color-important: var(--color-purple);--color-warning: var(--color-yellow);--color-danger: var(--color-red)}*:has(>#comment_list){.postTopic{border-bottom:none;.inner.tips{display:flex;height:40px;align-items:center;gap:8px;color:var(--color-reply-tips)}}#comment_list{box-sizing:border-box;.row:nth-child(odd),.row:nth-child(2n){background:transparent}>.clearit:first-child{border-top:1px solid transparent}div.reply_collapse{padding:5px 10px}}.clearit:not(.message){transition:all .3s ease;box-sizing:border-box;border-bottom:none!important;border-top:1px dashed var(--color-reply-sp);.inner.tips{display:flex;height:40px;align-items:center;gap:8px;color:var(--color-reply-tips)}.sub_reply_collapse .inner.tips{height:auto}--color-reply: var(--color-bangumi)}.clearit.v-friend{--color-reply: var(--color-green)}.clearit.v-owner{--color-reply: var(--color-yellow)}.clearit.v-floor{--color-reply: var(--color-purple)}.clearit.v-self{--color-reply: var(--color-blue)}.clearit.v-friend,.clearit.v-owner,.clearit.v-floor,.clearit.v-self{border-top:1px solid var(--color-reply)!important;background:linear-gradient(rgb(from var(--color-reply) r g b / .125) 1px,#0000 60px)!important;>.inner>:first-child>strong:before,>.inner>strong:before{padding:1px 4px;margin-right:4px;border-radius:2px;background:rgb(from var(--color-bangumi) r g b /.5);color:var(--color-bangumi-font)}}.clearit.reply_highlight{border:1px solid var(--color-reply)!important;background:rgb(from var(--color-reply) r g b / .125)!important;box-shadow:0 0 4px rgb(from var(--color-reply) r g b / .5);border-radius:0!important}.clearit:not(:has(.clearit:not(.message):hover),.message):hover{border-top:1px solid var(--color-reply)!important;background:linear-gradient(rgb(from var(--color-reply) r g b / .125) 1px,#0000 60px)!important;box-shadow:0 0 4px rgb(from var(--color-reply) r g b / .5)}.clearit.v-self{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u81EA"}}.clearit.v-friend{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u53CB"}}.clearit.v-owner{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u697C"}}.clearit.v-floor{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u5C42"}}.clearit.v-friend.v-owner{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u53CB \u697C"}}.clearit.v-friend.v-floor{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u53CB \u5C42"}}.clearit.v-owner.v-floor{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u697C \u5C42"}}.clearit.v-self.v-owner{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u81EA \u697C"}}.clearit.v-self.v-floor{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u81EA \u5C42"}}.clearit.v-friend.v-owner.v-floor{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u53CB \u697C \u5C42"}}.clearit.v-self.v-owner.v-floor{>.inner>:first-child>strong:before,>.inner>strong:before{content:"\u81EA \u697C \u5C42"}}.clearit.v-collapse{position:relative!important;padding:5px 10px!important;.post_actions{margin:0!important}>a.avatar{display:none!important}>.inner{line-height:18px;span.sign.tip_j,>*:not(:first-child){display:none!important}}}.clearit.sub_reply_bg.v-collapse{padding:5px 0!important}.clearit.postTopic.v-collapse{padding:10px 5px!important}.clearit.v-collapse:before{content:"";width:14px;position:absolute;display:grid;place-items:center;top:0;left:0;height:100%;padding:0 4px;font-weight:900;color:var(--color-bangumi);text-shadow:0 0 5px rgb(from var(--color-bangumi-font) r g b / .25);background:linear-gradient(to right,var(--color-bangumi) 1px,rgb(from var(--color-bangumi) r g b / .125) 1px,#00000000)!important}.clearit.v-collapse:after{content:"";mask:url("data:image/svg+xml,%3csvg%20viewBox='0%200%2016%2016'%20xmlns='http://www.w3.org/2000/svg'%20width='14px'%20height='14px'%20fill='currentColor'%20%3e%3cpath%20d='M10.896%202H8.75V.75a.75.75%200%200%200-1.5%200V2H5.104a.25.25%200%200%200-.177.427l2.896%202.896a.25.25%200%200%200%20.354%200l2.896-2.896A.25.25%200%200%200%2010.896%202ZM8.75%2015.25a.75.75%200%200%201-1.5%200V14H5.104a.25.25%200%200%201-.177-.427l2.896-2.896a.25.25%200%200%201%20.354%200l2.896%202.896a.25.25%200%200%201-.177.427H8.75v1.25Zm-6.5-6.5a.75.75%200%200%200%200-1.5h-.5a.75.75%200%200%200%200%201.5h.5ZM6%208a.75.75%200%200%201-.75.75h-.5a.75.75%200%200%201%200-1.5h.5A.75.75%200%200%201%206%208Zm2.25.75a.75.75%200%200%200%200-1.5h-.5a.75.75%200%200%200%200%201.5h.5ZM12%208a.75.75%200%200%201-.75.75h-.5a.75.75%200%200%201%200-1.5h.5A.75.75%200%200%201%2012%208Zm2.25.75a.75.75%200%200%200%200-1.5h-.5a.75.75%200%200%200%200%201.5h.5Z'%3e%3c/path%3e%3c/svg%3e");width:14px;height:14px;position:absolute;left:2px;top:50%;background:var(--color-bangumi)!important;transform:translateY(-50%);visibility:visible}.post_actions{.action{gap:4px;a.icon:hover,a.icon{color:var(--color-gray-11);display:flex;align-items:center;justify-content:center;min-width:0;padding:0 1px;box-sizing:border-box}}.dropdown ul a{display:flex;align-items:center;cursor:pointer;gap:5px}}}#timeline .tml_item,#home_grp_tpc,#home_subject_tpc,#headerNeue2,#comment_list,#reply_wrapper,#comment_box,#subjectPanelIndex,#subjectPanelCollect,#columnB .SidePanel .side_port,#memberUserList,.postTopic{.userImage,.avatar{img,.avatarNeue{border-radius:50%!important}img.avatar_mn{width:28px!important;height:28px!important;padding:0!important;border:none!important}}} `);

(async function (reactDom, client, React) {
  'use strict';

  function _interopNamespaceDefault(e) {
    const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
    if (e) {
      for (const k in e) {
        if (k !== 'default') {
          const d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    }
    n.default = e;
    return Object.freeze(n);
  }

  const React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

  class Cache {
    constructor({ hot, last }) {
      this.#hotLimit = hot ?? 0;
      this.#lastLimit = last ?? 0;
      this.#cacheLimit = this.#hotLimit + this.#lastLimit;
    }
    #hotLimit;
    #lastLimit;
    #cacheLimit;
    #hotList = [];
    #hot = /* @__PURE__ */ new Set();
    #last = /* @__PURE__ */ new Set();
    #pedding = /* @__PURE__ */ new Set();
    #cache = /* @__PURE__ */ new Map();
    #times = /* @__PURE__ */ new Map();
    #cHot(key) {
      if (!this.#hotLimit) return false;
      const counter = this.#times.get(key) || { key, cnt: 0 };
      counter.cnt++;
      this.#times.set(key, counter);
      if (this.#hot.size == 0) {
        this.#hotList.push(counter);
        this.#hot.add(key);
        this.#pedding.delete(key);
        return true;
      }
      const i = this.#hotList.indexOf(counter);
      if (i == 0) return true;
      if (i > 0) {
        const up = this.#hotList[i - 1];
        if (counter.cnt > up.cnt)
          this.#hotList.sort((a, b) => b.cnt - a.cnt);
        return true;
      }
      if (this.#hot.size < this.#hotLimit) {
        this.#hotList.push(counter);
        this.#hot.add(key);
        this.#pedding.delete(key);
        return true;
      }
      const min = this.#hotList.at(-1);
      if (counter.cnt <= min.cnt) return false;
      this.#hotList.pop();
      this.#hot.delete(min.key);
      if (!this.#last.has(min.key)) this.#pedding.add(min.key);
      this.#hotList.push(counter);
      this.#hot.add(key);
      this.#pedding.delete(key);
      return true;
    }
    #cLast(key) {
      if (!this.#lastLimit) return false;
      this.#last.delete(key);
      this.#last.add(key);
      this.#pedding.delete(key);
      if (this.#last.size <= this.#lastLimit) return true;
      const out = this.#last.values().next().value;
      this.#last.delete(out);
      if (!this.#hot.has(out)) this.#pedding.add(out);
      return true;
    }
    async get(key, query) {
      const data = this.#cache.get(key) ?? await query();
      const inHot = this.#cHot(key);
      const inLast = this.#cLast(key);
      if (inHot || inLast) this.#cache.set(key, data);
      let i = this.#cache.size - this.#cacheLimit;
      if (!i) return data;
      for (const key2 of this.#pedding) {
        if (!i) return data;
        this.#cache.delete(key2);
        this.#pedding.delete(key2);
        i--;
      }
      return data;
    }
    update(key, value) {
      if (!this.#cache.has(key)) this.#cache.set(key, value);
    }
    clear() {
      this.#cache.clear();
    }
  }
  class Collection {
    constructor(master, { collection, options, indexes, cache }) {
      this.#master = master;
      this.#collection = collection;
      this.#options = options;
      this.#indexes = indexes;
      if (options?.keyPath && cache && cache.enabled) {
        this.#cache = new Cache(cache);
      }
    }
    #master;
    #collection;
    #options;
    #indexes;
    #cache = null;
    get collection() {
      return this.#collection;
    }
    get options() {
      return this.#options;
    }
    get indexes() {
      return this.#indexes;
    }
    async transaction(handler, mode) {
      return this.#master.transaction(
        this.#collection,
        async (store) => {
          const request = await handler(store);
          return new Promise((resolve, reject) => {
            request.addEventListener("error", (e) => reject(e));
            request.addEventListener(
              "success",
              () => resolve(request.result)
            );
          });
        },
        mode
      );
    }
    #index(store, index = "") {
      if (!index) return store;
      return store.index(index);
    }
    async get(key, index) {
      const handler = () => this.transaction(
        (store) => this.#index(store, index).get(key)
      );
      if (this.#cache && this.#options?.keyPath && !index && typeof key == "string") {
        return this.#cache.get(key, handler);
      }
      return handler();
    }
    async getAll(key, count, index) {
      return this.transaction(
        (store) => this.#index(store, index).getAll(key, count)
      );
    }
    async getAllKeys(key, count, index) {
      return this.transaction(
        (store) => this.#index(store, index).getAllKeys(key, count)
      );
    }
    async put(data) {
      if (this.#cache) {
        let key;
        if (Array.isArray(this.#options.keyPath)) {
          key = [];
          for (const path of this.#options.keyPath) {
            key.push(data[path]);
          }
          key = key.join("/");
        } else {
          key = data[this.#options.keyPath];
        }
        this.#cache.update(key, data);
      }
      return this.transaction((store) => store.put(data), "readwrite").then(
        (_) => true
      );
    }
    async delete(key) {
      return this.transaction((store) => store.delete(key), "readwrite").then(
        (_) => true
      );
    }
    async clear() {
      if (this.#cache) this.#cache.clear();
      return this.transaction((store) => store.clear(), "readwrite").then(
        (_) => true
      );
    }
  }
  class Database {
    constructor({ dbName, version: version2, collections, blocked }) {
      this.#dbName = dbName;
      this.#version = version2;
      this.#blocked = blocked || { alert: false };
      for (const options of collections) {
        this.#collections.set(
          options.collection,
          new Collection(this, options)
        );
      }
    }
    #dbName;
    #version;
    #collections = /* @__PURE__ */ new Map();
    #db = null;
    #blocked;
    async init() {
      this.#db = await new Promise((resolve, reject) => {
        const request = window.indexedDB.open(this.#dbName, this.#version);
        request.addEventListener(
          "error",
          () => reject({ type: "error", message: request.error })
        );
        request.addEventListener("blocked", () => {
          const message = this.#blocked?.message || "indexedDB is blocked";
          if (this.#blocked?.alert) alert(message);
          reject({ type: "blocked", message });
        });
        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("upgradeneeded", () => {
          for (const c of this.#collections.values()) {
            const { collection, options, indexes } = c;
            let store;
            if (!request.result.objectStoreNames.contains(collection))
              store = request.result.createObjectStore(
                collection,
                options
              );
            else store = request.transaction.objectStore(collection);
            if (!indexes) continue;
            for (const { name, keyPath, unique } of indexes) {
              if (store.indexNames.contains(name)) continue;
              store.createIndex(name, keyPath, { unique });
            }
          }
        });
      });
      return this;
    }
    async transaction(collection, handler, mode = "readonly") {
      if (!this.#db) await this.init();
      return new Promise(async (resolve, reject) => {
        const transaction = this.#db.transaction(collection, mode);
        const store = transaction.objectStore(collection);
        const result = await handler(store);
        transaction.addEventListener("error", (e) => reject(e));
        transaction.addEventListener("complete", () => resolve(result));
      });
    }
    async get(collection, key, index) {
      return this.#collections.get(collection).get(key, index);
    }
    async getAll(collection, key, count, index) {
      return this.#collections.get(collection).getAll(key, count, index);
    }
    async getAllKeys(collection, key, count, index) {
      return this.#collections.get(collection).getAllKeys(key, count, index);
    }
    async put(collection, data) {
      return this.#collections.get(collection).put(data);
    }
    async delete(collection, key) {
      return this.#collections.get(collection).delete(key);
    }
    async clear(collection) {
      return this.#collections.get(collection).clear();
    }
    async clearAll() {
      for (const c of this.#collections.values()) await c.clear();
      return true;
    }
  }
  const version = 12;
  const db = new Database({
    dbName: "VCommunity",
    version,
    collections: [
      {
        collection: "values",
        options: { keyPath: "id" },
        indexes: [{ name: "id", keyPath: "id", unique: true }]
      },
      {
        collection: "friends",
        options: { keyPath: "id" },
        indexes: [{ name: "id", keyPath: "id", unique: true }],
        cache: { enabled: true, last: 1 }
      },
      {
        collection: "usednames",
        options: { keyPath: "id" },
        indexes: [{ name: "id", keyPath: "id", unique: true }],
        cache: { enabled: true, last: 3 }
      },
      {
        collection: "images",
        options: { keyPath: "uri" },
        indexes: [{ name: "uri", keyPath: "uri", unique: true }]
      },
      {
        collection: "users",
        options: { keyPath: "id" },
        indexes: [
          { name: "id", keyPath: "id", unique: true },
          { name: "blocked", keyPath: "blocked", unique: false }
        ],
        cache: { enabled: true, last: 5, hot: 5 }
      }
    ],
    blocked: {
      alert: true,
      message: "Bangumi 社区助手 preview 数据库有更新，请先关闭所有班固米标签页再刷新试试"
    }
  });
  async function updateDatabase() {
    if (localStorage.getItem("VCommunity") == version.toString()) return;
    const lastVersion = (await db.get("values", "version"))?.version || 0;
    if (lastVersion < 5) {
      const users = await db.getAll("users");
      for (const {
        id,
        names,
        namesUpdate: update,
        namesTml: tml,
        block: block2,
        note,
        tags
      } of users) {
        if (names && tml) {
          names.delete("");
          await db.put("usednames", { id, names, update, tml });
        }
        if (!block2 && !note && !(tags && (tags.size || tags.length))) {
          await db.delete("users", id);
        } else {
          const user = { id };
          if (block2) user.blocked = 1;
          if (note) user.note = note;
          if (tags) user.tags = new Set(tags);
          await db.put("users", user);
        }
      }
    } else if (lastVersion < 12) {
      const usednames2 = await db.getAll("usednames");
      for (const { id, names, update, tml } of usednames2) {
        if (!names || !tml) {
          await db.delete("usednames", id);
        } else {
          names.delete("");
          await db.put("usednames", { id, names, update, tml });
        }
      }
    }
    await db.put("values", { id: "version", version });
    localStorage.setItem("VCommunity", version.toString());
  }
  async function waitElement(parent, selector) {
    return new Promise((resolve) => {
      let isDone = false;
      const done = (fn) => {
        if (isDone) return;
        isDone = true;
        fn();
      };
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations)
          for (const node2 of mutation.addedNodes)
            if (node2 instanceof Element) {
              if (node2.matches(selector))
                return done(() => {
                  observer.disconnect();
                  resolve(node2);
                });
            }
      });
      observer.observe(parent, { childList: true, subtree: true });
      const node = parent.querySelector(selector);
      if (node)
        return done(() => {
          observer.disconnect();
          resolve(node);
        });
      if (document.readyState === "complete")
        return done(() => {
          observer.disconnect();
          resolve(null);
        });
      document.addEventListener("readystatechange", () => {
        if (document.readyState !== "complete") return;
        done(() => {
          observer.disconnect();
          resolve(parent.querySelector(selector));
        });
      });
    });
  }
  function observeChildren(element, callback) {
    new MutationObserver((mutations) => {
      for (const mutation of mutations)
        for (const node of mutation.addedNodes)
          if (node.nodeType === Node.ELEMENT_NODE)
            callback(node);
    }).observe(element, { childList: true });
    for (const child of element.children) callback(child);
  }
  async function newTab(href) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.click();
  }
  function removeAllChildren(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
    return element;
  }
  const loadScript = /* @__PURE__ */ (() => {
    const loaded = /* @__PURE__ */ new Set();
    const pedding = /* @__PURE__ */ new Map();
    return async (src) => {
      if (loaded.has(src)) return;
      const list = pedding.get(src) ?? [];
      const p = new Promise((resolve) => list.push(resolve));
      if (!pedding.has(src)) {
        pedding.set(src, list);
        const script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        script.onload = () => {
          loaded.add(src);
          list.forEach((resolve) => resolve());
        };
        document.body.appendChild(script);
      }
      return p;
    };
  })();
  var jsxRuntime = { exports: {} };
  var reactJsxRuntime_production = {};
  /**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var hasRequiredReactJsxRuntime_production;
  function requireReactJsxRuntime_production() {
    if (hasRequiredReactJsxRuntime_production) return reactJsxRuntime_production;
    hasRequiredReactJsxRuntime_production = 1;
    var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
    function jsxProd(type, config, maybeKey) {
      var key = null;
      void 0 !== maybeKey && (key = "" + maybeKey);
      void 0 !== config.key && (key = "" + config.key);
      if ("key" in config) {
        maybeKey = {};
        for (var propName in config)
          "key" !== propName && (maybeKey[propName] = config[propName]);
      } else maybeKey = config;
      config = maybeKey.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== config ? config : null,
        props: maybeKey
      };
    }
    reactJsxRuntime_production.Fragment = REACT_FRAGMENT_TYPE;
    reactJsxRuntime_production.jsx = jsxProd;
    reactJsxRuntime_production.jsxs = jsxProd;
    return reactJsxRuntime_production;
  }
  var hasRequiredJsxRuntime;
  function requireJsxRuntime() {
    if (hasRequiredJsxRuntime) return jsxRuntime.exports;
    hasRequiredJsxRuntime = 1;
    {
      jsxRuntime.exports = requireReactJsxRuntime_production();
    }
    return jsxRuntime.exports;
  }
  var jsxRuntimeExports = requireJsxRuntime();
  const root = document.createElement("div");
  function rootPortal(...args) {
    client.createRoot(root).render(reactDom.createPortal(...args));
  }
  function cn(...classList) {
    return classList.filter((className) => !!className).join(" ");
  }
  function AsElement({ as, ...other }) {
    const Type = as || "div";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "tip-item", ...other });
  }
  function LoadingBox({ loading, children, className, ...others }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      AsElement,
      {
        className: cn(loading && "v-loading", className),
        ...others,
        children: [
          children,
          loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "v-loading-item" })
        ]
      }
    );
  }
  function Board({ className, ...props }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingBox, { className: cn("v-board", className), ...props });
  }
  function TipItem({ tip, className, children, ...other }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(AsElement, { className: cn("v-tip-item", className), ...other, children: [
      children,
      tip ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "v-tip", children: tip }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, {})
    ] });
  }
  function Switch({ defaultEnabled, onEnable, onDisable }) {
    const [enabled, setEnabled] = React.useState(defaultEnabled);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "v-switch",
        "data-enabled": enabled ? "enabled" : "disabled",
        onClick: () => {
          const curr = !enabled;
          setEnabled(curr);
          if (curr) onEnable?.();
          else onDisable?.();
        }
      }
    );
  }
  const SvgLogin = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "2 2 20 20", xmlns: "http://www.w3.org/2000/svg", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", width: "14px", height: "14px", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M15 9H15.01M15 15C18.3137 15 21 12.3137 21 9C21 5.68629 18.3137 3 15 3C11.6863 3 9 5.68629 9 9C9 9.27368 9.01832 9.54308 9.05381 9.80704C9.11218 10.2412 9.14136 10.4583 9.12172 10.5956C9.10125 10.7387 9.0752 10.8157 9.00469 10.9419C8.937 11.063 8.81771 11.1823 8.57913 11.4209L3.46863 16.5314C3.29568 16.7043 3.2092 16.7908 3.14736 16.8917C3.09253 16.9812 3.05213 17.0787 3.02763 17.1808C3 17.2959 3 17.4182 3 17.6627V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H6.33726C6.58185 21 6.70414 21 6.81923 20.9724C6.92127 20.9479 7.01881 20.9075 7.10828 20.8526C7.2092 20.7908 7.29568 20.7043 7.46863 20.5314L12.5791 15.4209C12.8177 15.1823 12.937 15.063 13.0581 14.9953C13.1843 14.9248 13.2613 14.8987 13.4044 14.8783C13.5417 14.8586 13.7588 14.8878 14.193 14.9462C14.4569 14.9817 14.7263 15 15 15Z" }));
  const SvgSignup = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "45.5 27.5 17 17", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", stroke: "currentColor", strokeWidth: 0.5, strokeLinecap: "round", strokeLinejoin: "round", width: "14px", height: "14px", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M57.5,41a.5.5,0,0,0-.5.5V43H47V31h2v.5a.5.5,0,0,0,.5.5h5a.5.5,0,0,0,.5-.5V31h2v.5a.5.5,0,0,0,1,0v-1a.5.5,0,0,0-.5-.5H55v-.5A1.5,1.5,0,0,0,53.5,28h-3A1.5,1.5,0,0,0,49,29.5V30H46.5a.5.5,0,0,0-.5.5v13a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5v-2A.5.5,0,0,0,57.5,41ZM50,29.5a.5.5,0,0,1,.5-.5h3a.5.5,0,0,1,.5.5V31H50Zm11.854,4.646-2-2a.5.5,0,0,0-.708,0l-6,6A.5.5,0,0,0,53,38.5v2a.5.5,0,0,0,.5.5h2a.5.5,0,0,0,.354-.146l6-6A.5.5,0,0,0,61.854,34.146ZM54,40V38.707l5.5-5.5L60.793,34.5l-5.5,5.5Zm-2,.5a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1,0-1h2A.5.5,0,0,1,52,40.5Zm0-3a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1,0-1h2A.5.5,0,0,1,52,37.5ZM54.5,35h-5a.5.5,0,0,1,0-1h5a.5.5,0,0,1,0,1Z" }));
  const SvgUser = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" }));
  const SvgNotify = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" }));
  const SvgMessage = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z" }));
  const SvgSetting = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z" }));
  const SvgLogout = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z" }));
  const SvgLight = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" }));
  const SvgRobot = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" }), /* @__PURE__ */ React__namespace.createElement("path", { d: "M6.25 0h2A.75.75 0 0 1 9 .75V3.5h3.25a2.25 2.25 0 0 1 2.25 2.25V8h.75a.75.75 0 0 1 0 1.5h-.75v2.75a2.25 2.25 0 0 1-2.25 2.25h-8.5a2.25 2.25 0 0 1-2.25-2.25V9.5H.75a.75.75 0 0 1 0-1.5h.75V5.75A2.25 2.25 0 0 1 3.75 3.5H7.5v-2H6.25a.75.75 0 0 1 0-1.5ZM3 5.75v6.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75Z" }));
  function IconDock({ name, home, logout }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "dock", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "content", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "clearit", children: [
      home.endsWith("/login") ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "first", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "a", href: "/login", tip: "登录", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgLogin, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "a", href: "/signup", tip: "注册", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgSignup, {}) }) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "first", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "a", href: home, tip: name, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgUser, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "a", href: "/notify/all", tip: "提醒", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgNotify, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "a", href: "/pm", tip: "短信", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgMessage, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "a", href: "/settings", tip: "设置", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgSetting, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TipItem,
          {
            as: "a",
            href: logout,
            target: "_self",
            tip: "登出",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgLogout, {})
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TipItem,
        {
          as: "a",
          tip: "开关灯",
          onClick: () => chiiLib.ukagaka.toggleTheme(),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgLight, {})
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "last", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TipItem,
        {
          as: "a",
          tip: "春菜",
          onClick: () => chiiLib.ukagaka.toggleDisplay(),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgRobot, {})
        }
      ) })
    ] }) }) });
  }
  function replaceDock(dock2) {
    if (!dock2) return;
    const userElement = dock2.children[0].children[0].children[0].children[0];
    const home = userElement.href;
    const name = userElement.innerText;
    const logoutElement = dock2.children[0].children[0].children[1].lastElementChild;
    const logout = logoutElement.href;
    dock2.remove();
    rootPortal(
      /* @__PURE__ */ jsxRuntimeExports.jsx(IconDock, { name, home, logout }),
      document.body
    );
  }
  function getNice(element) {
    if (!element) return null;
    return $(element).getNiceScroll?.(0);
  }
  async function it(element) {
    if (!element) return null;
    const nice = getNice(element);
    if (nice) return nice;
    await loadScript(
      "https://cdn.jsdelivr.net/npm/jquery.nicescroll@3.7/jquery.nicescroll.min.js"
    );
    return $(element).niceScroll({
      cursorcolor: "rgb(from var(--color-bangumi) r g b / .5)",
      cursorwidth: "4px",
      cursorborder: "none"
    });
  }
  function resize(element) {
    const nice = getNice(element);
    if (!nice) return;
    nice.resize();
  }
  const whoami = /* @__PURE__ */ (() => {
    let cache = null;
    return () => {
      if (cache) return cache;
      let nid;
      try {
        nid = window.CHOBITS_UID ?? window.parent.CHOBITS_UID ?? CHOBITS_UID ?? 0;
      } catch (e) {
        nid = 0;
      }
      const dockA = window.parent.document.querySelector(
        "#dock li.first a"
      );
      if (dockA) {
        const id = dockA.href.split("/").pop();
        return cache = { id, nid };
      }
      const bannerAvatar = window.parent.document.querySelector(
        ".idBadgerNeue> .avatar"
      );
      if (bannerAvatar) {
        const id = bannerAvatar.href.split("/").pop();
        return cache = { id, nid };
      }
      return null;
    };
  })();
  let blockeds = null;
  const getBlockeds = /* @__PURE__ */ (() => {
    let peddings = null;
    const queryDB = async () => {
      const list = await db.getAllKeys("users", 1, void 0, "blocked");
      blockeds = new Set(list);
      for (const pedding of peddings) pedding(blockeds);
      peddings = null;
    };
    return async () => {
      if (blockeds) return blockeds;
      const p = peddings ?? [];
      const pedding = new Promise((resolve) => p.push(resolve));
      if (!peddings) {
        peddings = p;
        queryDB();
      }
      return pedding;
    };
  })();
  async function isBlocked(id) {
    const data = await db.get("users", id);
    const isBlocked2 = !!data?.blocked;
    if (!blockeds) return isBlocked2;
    if (isBlocked2) blockeds.add(id);
    else blockeds.delete(id);
    return isBlocked2;
  }
  async function block(id) {
    if (!confirm("确定要屏蔽吗？")) return false;
    const data = await db.get("users", id) ?? { id };
    await db.put("users", { ...data, blocked: 1 });
    if (blockeds) blockeds.add(id);
    return true;
  }
  async function unblock(id) {
    if (!confirm("确定要解除屏蔽吗？")) return false;
    const data = await db.get("users", id);
    if (!data) return true;
    delete data.blocked;
    if (Object.keys(data).length > 1) await db.put("users", data);
    else await db.delete("users", id);
    if (blockeds) blockeds.delete(id);
    return true;
  }
  async function connect(nid, gh) {
    if (!confirm("真的要加好友吗？")) return false;
    const ret = await fetch(`/connect/${nid}?gh=${gh}`);
    return ret.ok;
  }
  async function disconnect(nid, gh) {
    if (!confirm("真的要解除好友吗？")) return false;
    const ret = await fetch(`/disconnect/${nid}?gh=${gh}`);
    return ret.ok;
  }
  async function usednames(id) {
    const data = await db.get("usednames", id) || {
      names: /* @__PURE__ */ new Set()
    };
    if (data.update < Date.now() - 36e5) return data.names;
    const getUsedNames = async (end, tml2, ret2 = [], page = 1) => {
      const res = await fetch(
        `/user/${id}/timeline?type=say&ajax=1&page=${page}`
      );
      const html = await res.text();
      const names2 = Array.from(
        html.matchAll(/从 \<strong\>(?<from>.*?)\<\/strong\> 改名为/g),
        (m) => m.groups?.from ?? ""
      );
      const tmls = Array.from(
        html.matchAll(
          /\<h4 class="Header"\>(?<tml>\d{4}\-\d{1,2}\-\d{1,2})\<\/h4\>/g
        ),
        (m) => m.groups?.tml ?? ""
      );
      if (!tml2) tml2 = tmls[0];
      ret2.push(...names2);
      if (tmls.includes(end) || !html.includes(">下一页 &rsaquo;&rsaquo;</a>"))
        return { ret: ret2, tml: tml2 };
      return getUsedNames(end, tml2, ret2, page + 1);
    };
    const { ret, tml } = await getUsedNames(data.tml);
    const update = Date.now();
    const names = new Set(ret).union(data.names);
    names.delete("");
    await db.put("usednames", { id, names, update, tml });
    return names;
  }
  async function homepage(id) {
    const res = await fetch("/user/" + id);
    const me = whoami();
    if (!res.ok) return null;
    const html = await res.text();
    const element = document.createElement("html");
    element.innerHTML = html.replace(/<(img|script|link)/g, "<noload");
    const nameSingle = element.querySelector("#headerProfile .nameSingle");
    const bio = element.querySelector(".bio");
    bio?.classList.remove("bio");
    const name = nameSingle.querySelector(".name a").innerText;
    const src = nameSingle.querySelector(".headerAvatar .avatar span").style.backgroundImage.replace('url("', "").replace('")', "");
    const pinnedLayout = element.querySelector("#pinnedLayout");
    const stats = Array.from(
      pinnedLayout.querySelectorAll(".gridStats > .item"),
      (e) => {
        const name2 = e.lastElementChild.innerText;
        let type2;
        switch (name2) {
          case "收藏":
            type2 = "coll";
            break;
          case "完成":
            type2 = "done";
            break;
          case "完成率":
            type2 = "rate";
            break;
          case "平均分":
            type2 = "avg";
            break;
          case "标准差":
            type2 = "std";
            break;
          case "评分数":
            type2 = "cnt";
            break;
        }
        return {
          type: type2,
          name: name2,
          value: e.firstElementChild.innerText
        };
      }
    );
    const chart = Array.from(
      pinnedLayout.querySelectorAll("#ChartWarpper li > a"),
      (e) => {
        return {
          label: e.firstElementChild.innerText,
          value: parseInt(
            e.lastElementChild.innerText.replace(
              /[\(\)]/g,
              ""
            )
          )
        };
      }
    );
    if (me.nid == 0)
      return { type: "guest", name, src, bio, stats, chart };
    if (me.id == id)
      return { type: "self", name, src, bio, stats, chart };
    const actions = nameSingle.querySelectorAll(
      "#headerProfile .actions a.chiiBtn"
    );
    const nid = actions[1].href.split("/").pop()?.replace(".chii", "") ?? "";
    const friend = actions[0].innerText == "解除好友";
    const gh = friend ? actions[0].getAttribute("onclick")?.split(",").pop()?.split(/['"]/)[1] : actions[0].href.split("gh=").pop();
    const type = friend ? "friend" : "normal";
    return { type, name, src, bio, nid, gh: gh ?? "", stats, chart };
  }
  async function getNote(id) {
    return (await db.get("users", id))?.note || "";
  }
  async function setNote(id, note) {
    const data = await db.get("users", id);
    if (!data) {
      if (note) await db.put("users", { id, note });
      return note;
    }
    if (note) data.note = note;
    else delete data.note;
    if (Object.keys(data).length > 1) await db.put("users", data);
    else await db.delete("users", id);
    return note;
  }
  async function getTags(id) {
    return (await db.get("users", id))?.tags || /* @__PURE__ */ new Set();
  }
  async function setTagsByString(id, tags) {
    return setTags(
      id,
      tags.split("\n").map((tag) => tag.trim())
    );
  }
  async function setTags(id, tags) {
    const tagset = new Set(tags);
    tagset.delete("");
    const data = await db.get("users", id);
    if (!data) {
      if (tagset.size) await db.put("users", { id, tags: tagset });
      return tagset;
    }
    if (tagset.size) data.tags = tagset;
    else delete data.tags;
    if (Object.keys(data).length > 1) await db.put("users", data);
    else await db.delete("users", id);
    return tagset;
  }
  function goHome(id) {
    newTab("/user/" + id);
  }
  function goPm(nid) {
    newTab("/pm/compose/" + nid + ".chii");
  }
  function goLogin() {
    newTab("/login");
  }
  function getWidth(text, size, className) {
    const e = document.createElement("span");
    document.body.append(e);
    e.className = className;
    e.style.fontSize = `${size}px`;
    e.style.position = "absolute";
    e.style.opacity = "0";
    e.append(document.createTextNode(text));
    const w = e.offsetWidth;
    e.remove();
    return w;
  }
  function TextSVG({ text, className }) {
    const [size] = React.useState(10);
    const [width, setWidth] = React.useState(0);
    React.useEffect(() => {
      setWidth(getWidth(text, size, className));
    }, [size, text, className]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        className,
        fill: "currentColor",
        viewBox: `0 0 ${width} ${size}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("text", { fontSize: size, children: text })
      }
    );
  }
  function Avatar({ data }) {
    if (!data) return /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { className: "v-avatar", loading: true });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Board, { className: "v-avatar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: data.src }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TextSVG, { text: data.name, className: "v-serif" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: data.id })
    ] });
  }
  const SvgHome = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "-1 -1 34 34", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", strokeWidth: 1, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M31.772 16.043l-15.012-15.724c-0.189-0.197-0.449-0.307-0.721-0.307s-0.533 0.111-0.722 0.307l-15.089 15.724c-0.383 0.398-0.369 1.031 0.029 1.414 0.399 0.382 1.031 0.371 1.414-0.029l1.344-1.401v14.963c0 0.552 0.448 1 1 1h6.986c0.551 0 0.998-0.445 1-0.997l0.031-9.989h7.969v9.986c0 0.552 0.448 1 1 1h6.983c0.552 0 1-0.448 1-1v-14.968l1.343 1.407c0.197 0.204 0.459 0.308 0.722 0.308 0.249 0 0.499-0.092 0.692-0.279 0.398-0.382 0.411-1.015 0.029-1.413zM26.985 14.213v15.776h-4.983v-9.986c0-0.552-0.448-1-1-1h-9.965c-0.551 0-0.998 0.445-1 0.997l-0.031 9.989h-4.989v-15.777c0-0.082-0.013-0.162-0.032-0.239l11.055-11.52 10.982 11.507c-0.021 0.081-0.036 0.165-0.036 0.252z" }));
  const SvgConnect = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 32 32", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M2.002 27.959c0-0.795 0.597-1.044 0.835-1.154l8.783-4.145c0.63-0.289 1.064-0.885 1.149-1.573s-0.193-1.37-0.733-1.803c-2.078-1.668-3.046-5.334-3.046-7.287v-4.997c0-2.090 3.638-4.995 7.004-4.995 3.396 0 6.997 2.861 6.997 4.995v4.998c0 1.924-0.8 5.604-2.945 7.292-0.547 0.43-0.831 1.115-0.749 1.807 0.082 0.692 0.518 1.291 1.151 1.582l2.997 1.422 0.494-1.996-2.657-1.243c2.771-2.18 3.708-6.463 3.708-8.864v-4.997c0-3.31-4.582-6.995-8.998-6.995s-9.004 3.686-9.004 6.995v4.997c0 2.184 0.997 6.602 3.793 8.846l-8.783 4.145s-1.998 0.89-1.998 1.999v3.001c0 1.105 0.895 1.999 1.998 1.999h21.997v-2l-21.996 0.001v-2.029zM30.998 25.996h-3v-3c0-0.552-0.448-1-1-1s-1 0.448-1 1v3h-3c-0.552 0-1 0.448-1 1s0.448 1 1 1h3v3c0 0.552 0.448 1 1 1s1-0.448 1-1v-3h3c0.552 0 1-0.448 1-1s-0.448-1-1-1z" }));
  const SvgDisconnect = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 32 32", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M29.323,28.000 L31.610,30.293 C31.999,30.684 31.999,31.316 31.610,31.707 C31.415,31.902 31.160,32.000 30.905,32.000 C30.649,32.000 30.394,31.902 30.200,31.707 L27.913,29.414 L25.627,31.707 C25.432,31.902 25.177,32.000 24.922,32.000 C24.667,32.000 24.412,31.902 24.217,31.707 C23.827,31.316 23.827,30.684 24.217,30.293 L26.503,28.000 L24.217,25.707 C23.827,25.316 23.827,24.684 24.217,24.293 C24.606,23.902 25.237,23.902 25.627,24.293 L27.913,26.586 L30.200,24.293 C30.589,23.902 31.220,23.902 31.610,24.293 C31.999,24.684 31.999,25.316 31.610,25.707 L29.323,28.000 ZM21.638,22.294 C22.028,22.684 22.028,23.317 21.638,23.707 C21.249,24.097 20.618,24.098 20.228,23.706 L19.231,22.706 C19.031,22.505 18.925,22.229 18.940,21.947 C18.956,21.664 19.089,21.400 19.308,21.222 C22.876,18.321 23.000,13.053 23.000,13.000 L23.000,7.000 C22.444,4.024 18.877,2.035 16.019,2.001 L15.948,2.003 C13.076,2.003 9.529,4.087 8.968,7.087 L8.964,12.994 C8.964,13.045 9.019,18.324 12.587,21.225 C12.845,21.435 12.982,21.761 12.952,22.093 C12.922,22.425 12.728,22.720 12.436,22.880 L1.988,28.594 L1.988,30.000 L20.933,30.000 C21.484,30.000 21.930,30.448 21.930,31.000 C21.930,31.552 21.484,32.000 20.933,32.000 L1.988,32.000 C0.888,32.000 -0.007,31.103 -0.007,30.000 L-0.007,28.000 C-0.007,27.634 0.193,27.297 0.513,27.122 L10.274,21.785 C7.005,18.239 7.000,13.232 7.000,13.000 L7.000,7.000 L6.987,6.832 C7.672,2.777 12.112,0.043 15.865,0.003 L15.948,-0.000 C19.718,-0.000 24.219,2.744 24.908,6.829 L24.922,6.996 L24.926,12.990 C24.926,13.227 24.888,18.479 21.380,22.034 L21.638,22.294 Z" }));
  const SvgBlocked = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "1 1 22 22", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "none", strokeWidth: 2, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M5.63605 5.63603L18.364 18.364M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" }));
  function Actions({ data }) {
    if (!data) return /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { className: "v-actions", loading: true });
    const [isGuest, setGuest] = React.useState(false);
    const [isSelf, setSelf] = React.useState(false);
    const [blocked, setBlocked] = React.useState(false);
    const [connected, setConnected] = React.useState(false);
    React.useEffect(() => {
      setGuest(data.type == "guest");
      setSelf(data.type == "self");
      setConnected(data.type == "friend");
      isBlocked(data.id).then(setBlocked);
    }, [data]);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Board, { as: "ul", className: "v-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TipItem,
        {
          as: "li",
          className: "v-home",
          tip: "主页",
          onClick: () => goHome(data.id),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgHome, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TipItem,
        {
          as: "li",
          className: "v-pm",
          tip: "私信",
          onClick: () => {
            if (isGuest)
              return confirm("暂未登录，是否打开登录页面") && goLogin();
            if (isSelf) return alert("这是自己");
            goPm(data.nid);
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgMessage, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TipItem,
        {
          as: "li",
          className: "v-friend",
          tip: connected ? "解除好友" : "加好友",
          onClick: async () => {
            if (isGuest)
              return confirm("暂未登录，是否打开登录页面") && goLogin();
            if (isSelf) return alert("这是自己");
            const action = connected ? disconnect : connect;
            const ret = await action(data.nid, data.gh);
            if (ret) setConnected(!connected);
          },
          children: isGuest && isSelf && connected ? /* @__PURE__ */ jsxRuntimeExports.jsx(SvgDisconnect, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(SvgConnect, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TipItem,
        {
          as: "li",
          className: "v-blocked",
          tip: blocked ? "解除屏蔽" : "屏蔽",
          onClick: async () => {
            const action = blocked ? unblock : block;
            const ret = await action(data.id);
            if (ret) setBlocked(!blocked);
          },
          children: blocked ? /* @__PURE__ */ jsxRuntimeExports.jsx(SvgBlocked, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(SvgNotify, {})
        }
      )
    ] });
  }
  function Stats({ data }) {
    if (!data) return /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { className: "v-stats", loading: true });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { as: "ul", className: "v-stats", children: data.map(({ type, value, name }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      TipItem,
      {
        as: "li",
        className: cn("v-stat", "v-" + type),
        tip: name,
        children: value
      }
    )) });
  }
  function Chart({ data }) {
    if (!data) return /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { className: "v-chart", loading: true });
    const max = Math.max(...data.map((v) => v.value));
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { as: "ul", className: "v-chart", children: data.map(({ label, value }) => /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { as: "li", tip: `${label}分: ${value}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "v-bar",
        style: {
          width: (value / max * 100).toFixed(2) + "%"
        }
      }
    ) })) });
  }
  function NamedBoard({ name, children, ...props }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Board, { as: "fieldset", ...props, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { children: name }),
      children
    ] });
  }
  function Bio({ data }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) it(ref.current);
    }, [ref.current]);
    React.useEffect(() => {
      if (!data?.bio || !ref.current) return;
      removeAllChildren(ref.current);
      ref.current.append(data.bio);
      resize(ref.current);
    }, [data, ref.current]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      NamedBoard,
      {
        className: "v-bio",
        loading: !data,
        name: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgUser, {}),
          " Bio"
        ] }),
        onResize: () => resize(ref.current),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "v-wrapper", ref })
      }
    );
  }
  function ActionsBoard({
    actions,
    className,
    children,
    ...props
  }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(NamedBoard, { className: cn("v-actions-board", className), ...props, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "v-actions-list", children: actions?.map(({ icon, tip, action }) => /* @__PURE__ */ jsxRuntimeExports.jsx(TipItem, { tip, onClick: action, children: icon })) }),
      children
    ] });
  }
  const SvgEdit = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" }));
  const SvgConfirm = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "3 3 18 18", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M19.3,5.3L9,15.6l-4.3-4.3l-1.4,1.4l5,5L9,18.4l0.7-0.7l11-11L19.3,5.3z" }));
  const SvgClose = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "4 4 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M5.6,4.2L4.2,5.6l6.4,6.4l-6.4,6.4l1.4,1.4l6.4-6.4l6.4,6.4l1.4-1.4L13.4,12l6.4-6.4l-1.4-1.4L12,10.6L5.6,4.2z" }));
  function EditableBoard({
    value = "",
    onSave,
    actions = [],
    children,
    ...props
  }) {
    const [editing, setEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const acts = [...actions];
    if (editing) {
      acts.push(
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgConfirm, {}),
          tip: "确定",
          action: () => {
            onSave?.(editValue);
            setEditing(false);
          }
        },
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgClose, {}),
          tip: "取消",
          action: () => {
            setEditValue(value);
            setEditing(false);
          }
        }
      );
    } else {
      acts.push({
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgEdit, {}),
        tip: "编辑",
        action: () => {
          setEditValue(value);
          setEditing(true);
        }
      });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(ActionsBoard, { actions: acts, ...props, children: [
      editing && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: editValue,
          onChange: (e) => setEditValue(e.target.value)
        }
      ),
      children
    ] });
  }
  function TagList({ tags, children, className, ...props }) {
    const lis = [];
    for (const tag of tags ?? []) lis.push(/* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: tag }));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: cn("v-tag-list", className), ...props, children: [
      children,
      lis
    ] });
  }
  const SvgHistory = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "m.427 1.927 1.215 1.215a8.002 8.002 0 1 1-1.6 5.685.75.75 0 1 1 1.493-.154 6.5 6.5 0 1 0 1.18-4.458l1.358 1.358A.25.25 0 0 1 3.896 6H.25A.25.25 0 0 1 0 5.75V2.104a.25.25 0 0 1 .427-.177ZM7.75 4a.75.75 0 0 1 .75.75v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5A.75.75 0 0 1 7.75 4Z" }));
  function UsedName({ id, onChange }) {
    const ref = React.useRef(null);
    const [content, setContent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      if (ref.current) it(ref.current);
    }, [ref.current]);
    React.useEffect(() => {
      usednames(id).then((content2) => {
        setLoading(false);
        setContent(content2);
        resize(ref.current);
        onChange?.();
      });
    }, [id]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      NamedBoard,
      {
        className: "v-usedname",
        loading,
        name: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgHistory, {}),
          " 曾用名"
        ] }),
        onResize: () => resize(ref.current),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TagList, { className: "v-wrapper", tags: content, ref })
      }
    );
  }
  const SvgTag = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" }));
  function Tags({ id, onChange }) {
    const ref = React.useRef(null);
    const [content, setContent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      if (ref.current) it(ref.current);
    }, [ref.current]);
    React.useEffect(() => {
      getTags(id).then((content2) => {
        setLoading(false);
        setContent(content2);
      });
    }, [id]);
    React.useEffect(() => {
      resize(ref.current);
      onChange?.();
    }, [content]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditableBoard,
      {
        className: "v-tags",
        loading,
        name: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgTag, {}),
          " 标签"
        ] }),
        value: Array.from(content ?? []).join("\n"),
        onSave: async (content2) => {
          await setTagsByString(id, content2).then(setContent);
        },
        onResize: () => resize(ref.current),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(TagList, { className: "v-wrapper", tags: content, ref })
      }
    );
  }
  const SvgNote = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M5 8.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 5 8.25ZM4 10.5A.75.75 0 0 0 4 12h4a.75.75 0 0 0 0-1.5H4Z" }), /* @__PURE__ */ React__namespace.createElement("path", { d: "M13-.005c1.654 0 3 1.328 3 3 0 .982-.338 1.933-.783 2.818-.443.879-1.028 1.758-1.582 2.588l-.011.017c-.568.853-1.104 1.659-1.501 2.446-.398.789-.623 1.494-.623 2.136a1.5 1.5 0 1 0 2.333-1.248.75.75 0 0 1 .834-1.246A3 3 0 0 1 13 16H3a3 3 0 0 1-3-3c0-1.582.891-3.135 1.777-4.506.209-.322.418-.637.623-.946.473-.709.923-1.386 1.287-2.048H2.51c-.576 0-1.381-.133-1.907-.783A2.68 2.68 0 0 1 0 2.995a3 3 0 0 1 3-3Zm0 1.5a1.5 1.5 0 0 0-1.5 1.5c0 .476.223.834.667 1.132A.75.75 0 0 1 11.75 5.5H5.368c-.467 1.003-1.141 2.015-1.773 2.963-.192.289-.381.571-.558.845C2.13 10.711 1.5 11.916 1.5 13A1.5 1.5 0 0 0 3 14.5h7.401A2.989 2.989 0 0 1 10 13c0-.979.338-1.928.784-2.812.441-.874 1.023-1.748 1.575-2.576l.017-.026c.568-.853 1.103-1.658 1.501-2.448.398-.79.623-1.497.623-2.143 0-.838-.669-1.5-1.5-1.5Zm-10 0a1.5 1.5 0 0 0-1.5 1.5c0 .321.1.569.27.778.097.12.325.227.74.227h7.674A2.737 2.737 0 0 1 10 2.995c0-.546.146-1.059.401-1.5Z" }));
  function Note({ id, onChange }) {
    const ref = React.useRef(null);
    const [content, setContent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      if (ref.current) it(ref.current);
    }, [ref.current]);
    React.useEffect(() => {
      getNote(id).then((content2) => {
        setLoading(false);
        setContent(content2);
      });
    }, [id]);
    React.useEffect(() => {
      resize(ref.current);
      onChange?.();
    }, [content]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditableBoard,
      {
        className: "v-note",
        loading,
        name: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgNote, {}),
          " 备注"
        ] }),
        value: content ?? "",
        onSave: async (content2) => {
          await setNote(id, content2).then(setContent);
        },
        onResize: () => resize(ref.current),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "v-wrapper", ref, children: content })
      }
    );
  }
  function UserPanel({ id, onClose }) {
    const ref = React.useRef(null);
    const [avatar, setAvatar] = React.useState(null);
    const [actions, setActions] = React.useState(null);
    const [stats, setStats] = React.useState(null);
    const [chart, setChart] = React.useState(null);
    const [bio, setBio] = React.useState(null);
    React.useEffect(() => {
      if (ref.current) it(ref.current);
    }, [ref.current]);
    React.useEffect(() => {
      homepage(id).then((data) => {
        if (!data) return;
        const { type, name, src, nid, gh, stats: stats2, chart: chart2, bio: bio2 } = data;
        setAvatar({ id, name, src });
        setActions({ type, id, nid, gh });
        setStats(stats2);
        setChart(chart2);
        setBio({ bio: bio2 });
      });
    }, [id]);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { id: "community-helper-user-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "v-close-mask", onClick: onClose }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "v-container",
          ref,
          onResize: () => resize(ref.current),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { data: avatar }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Actions, { data: actions }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stats, { data: stats }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Chart, { data: chart }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bio, { data: bio }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(UsedName, { id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tags, { id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Note, { id })
          ]
        }
      )
    ] });
  }
  function isSicky() {
    return localStorage.getItem("sickyReplySwitch") != "0";
  }
  function SickyReply({ wrapper, before }) {
    const ref = React.useRef(null);
    const [sicky, setSicky] = React.useState(isSicky);
    const [placehold] = React.useState(() => document.createElement("div"));
    React.useEffect(() => {
      if (!ref.current) return;
      before.parentElement?.insertBefore(ref.current, before);
    }, [before, ref.current]);
    React.useEffect(() => {
      if (!ref.current) return;
      if (sicky) {
        localStorage.setItem("sickyReplySwitch", "1");
        wrapper.replaceWith(placehold);
        ref.current.append(wrapper);
      } else {
        localStorage.setItem("sickyReplySwitch", "0");
        placehold.replaceWith(wrapper);
      }
    }, [sicky, ref.current]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "v-sicky-reply", ref, children: reactDom.createPortal(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Switch,
        {
          defaultEnabled: sicky,
          onEnable: () => setSicky(true),
          onDisable: () => setSicky(false)
        }
      ),
      wrapper
    ) });
  }
  function sickyIt(wrapper) {
    if (!wrapper) return;
    const container = wrapper.parentElement;
    container.querySelector("#sliderContainer")?.style.setProperty("display", "none", "important");
    const before = container.querySelector(":scope>.clearit") || container.querySelector(":scope>#comment_list") || wrapper;
    rootPortal(/* @__PURE__ */ jsxRuntimeExports.jsx(SickyReply, { wrapper, before }), container);
  }
  const get = /* @__PURE__ */ (() => {
    let peddings = null;
    const net = async (id) => {
      const res = await fetch(`/user/${id}/friends`);
      if (!res.ok) console.warn(`Error fetching friends: ${res.status}`);
      const html = await res.text();
      const element = document.createElement("html");
      element.innerHTML = html.replace(/<(img|script|link)/g, "<noload");
      const friends = /* @__PURE__ */ new Set();
      for (const a of element.querySelectorAll(
        "#memberUserList a.avatar"
      )) {
        const id2 = a.href.split("/").pop() ?? "";
        friends.add(id2);
      }
      return friends;
    };
    const get2 = async () => {
      const user = whoami();
      if (!user) return /* @__PURE__ */ new Set();
      const id = user.id;
      const cache = await db.get("friends", id);
      if (cache && cache.timestamp > Date.now() - 36e5)
        return cache.friends;
      const friends = await net(id);
      await db.put("friends", { id, friends, timestamp: Date.now() });
      return friends;
    };
    const trigger = async () => {
      const friends = await get2();
      for (const pedding of peddings) pedding(friends);
      peddings = null;
    };
    return async () => {
      const p = peddings ?? [];
      const pedding = new Promise((resolve) => p.push(resolve));
      if (!peddings) {
        peddings = p;
        trigger();
      }
      return pedding;
    };
  })();
  const SvgMark = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M3 2.75C3 1.784 3.784 1 4.75 1h6.5c.966 0 1.75.784 1.75 1.75v11.5a.75.75 0 0 1-1.227.579L8 11.722l-3.773 3.107A.751.751 0 0 1 3 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.91l3.023-2.489a.75.75 0 0 1 .954 0l3.023 2.49V2.75a.25.25 0 0 0-.25-.25Z" }));
  const SvgCollapse = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M10.896 2H8.75V.75a.75.75 0 0 0-1.5 0V2H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0l2.896-2.896A.25.25 0 0 0 10.896 2ZM8.75 15.25a.75.75 0 0 1-1.5 0V14H5.104a.25.25 0 0 1-.177-.427l2.896-2.896a.25.25 0 0 1 .354 0l2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25Zm-6.5-6.5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z" }));
  const SvgExpand = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "m8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z" }));
  const SvgDetail = (props) => /* @__PURE__ */ React__namespace.createElement("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", width: "14px", height: "14px", fill: "currentColor", ...props }, /* @__PURE__ */ React__namespace.createElement("path", { d: "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L10.69 8 9.22 6.53a.75.75 0 0 1 0-1.06ZM6.78 6.53 5.31 8l1.47 1.47a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-2-2a.75.75 0 0 1 0-1.06l2-2a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" }));
  function CommentEnhance({ comment, owner, floor }) {
    const [user] = React.useState(
      () => comment.getAttribute("data-item-user")
    );
    const menuRef = React.useRef(null);
    const [showPanel, setShowPanel] = React.useState(false);
    const [collapse, setCollapse] = React.useState(false);
    const [blocked, setBlocked] = React.useState(false);
    React.useEffect(() => {
      if (user === whoami()?.id) comment.classList.add("v-self");
      if (user === owner) comment.classList.add("v-owner");
      if (user === floor) comment.classList.add("v-floor");
      getBlockeds().then((blockeds2) => {
        if (!blockeds2.has(user)) return;
        setBlocked(true);
        setCollapse(true);
      });
      get().then((friends) => {
        if (!friends.has(user)) return;
        comment.classList.add("v-friend");
      });
      waitElement(comment, ".post_actions").then((actions) => {
        if (!actions) return;
        if (actions.children.length < 2) actions.append(menuRef.current);
        else
          actions.insertBefore(
            menuRef.current,
            actions.lastElementChild
          );
      });
    }, [comment]);
    React.useEffect(() => {
      if (collapse) comment.classList.add("v-collapse");
      else comment.classList.remove("v-collapse");
    }, [collapse, comment]);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action dropdown", ref: menuRef, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SvgMark, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { onClick: () => setCollapse(!collapse), children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { children: collapse ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgExpand, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "展开发言" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgCollapse, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "折叠发言" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "li",
          {
            onClick: async () => {
              const promise = blocked ? unblock(user) : block(user);
              if (await promise) {
                const newState = !blocked;
                setBlocked(newState);
                setCollapse(newState);
              }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { children: blocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SvgNotify, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "取消屏蔽" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SvgBlocked, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "屏蔽发言" })
            ] }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { onClick: () => setShowPanel(true), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SvgDetail, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "详细信息" })
        ] }) }),
        showPanel && reactDom.createPortal(
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            UserPanel,
            {
              id: user,
              onClose: () => setShowPanel(false)
            }
          ),
          document.body
        )
      ] })
    ] });
  }
  function commentEnhance(props) {
    rootPortal(/* @__PURE__ */ jsxRuntimeExports.jsx(CommentEnhance, { ...props }), props.comment);
  }
  async function dock() {
    const dock2 = await waitElement(document, "#dock");
    if (!dock2) return;
    const robotBtn = await waitElement(dock2, "#showrobot");
    if (!robotBtn) return;
    replaceDock(dock2);
  }
  async function commentList() {
    const commentList2 = await waitElement(document, "#comment_list");
    if (!commentList2) return;
    const comment = commentList2.parentElement.querySelector(".postTopic");
    if (comment) commentEnhance({ comment });
    const owner = comment?.getAttribute("data-item-user");
    observeChildren(commentList2, async (comment2) => {
      commentEnhance({ comment: comment2, owner });
      const floor = comment2.getAttribute("data-item-user");
      const subReply = await waitElement(
        comment2,
        "#topic_reply_" + comment2.id.substring(5)
      );
      if (!subReply) return;
      observeChildren(
        subReply,
        (comment3) => commentEnhance({ comment: comment3, owner, floor })
      );
    });
  }
  async function replyWrapper() {
    sickyIt(await waitElement(document, "#reply_wrapper"));
  }
  await( updateDatabase());
  await( Promise.all([dock(), commentList(), replyWrapper()]));

})(ReactDOM, ReactDOM, React);