// ==UserScript==
// @name         Bangumi 社区助手 preview
// @version      0.0.9
// @namespace    b38.dev
// @description  社区助手预览版
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/bangumi_community.user.js
// @match        *://bgm.tv/*
// @match        *://chii.in/*
// @match        *://bangumi.tv/*
// @run-at       document-start
// ==/UserScript==
(async () => {
    /**merge:js=_common.dom.script.js**/
    async function loadScript(src) { if (!this._loaded) this._loaded = new Set(); if (this._loaded.has(src)) return; if (!this._pedding) this._pedding = new Map(); const list = this._pedding.get(src) ?? []; const pedding = new Promise(resolve => list.push(resolve)); if (!this._pedding.has(src)) { this._pedding.set(src, list); const script = create('script', { src, type: 'text/javascript' }); script.onload = () => { this._loaded.add(src); list.forEach(resolve => resolve()); }; document.body.appendChild(script); } return pedding }
    /**merge**/
    /**merge:js=_common.dom.style.js**/
    function addStyle(...styles) { const style = document.createElement('style'); style.append(document.createTextNode(styles.join('\n'))); document.head.appendChild(style); return style; }
    /**merge**/
    /**merge:js=_common.dom.js**/
    function setEvents(element, events) { for (const [event, listener] of events) { element.addEventListener(event, listener); } return element; }
    function setProps(element, props) { if (!props || typeof props !== 'object') return element; const events = []; for (const [key, value] of Object.entries(props)) { if (typeof value === 'boolean') { element[key] = value; continue; } if (key === 'events') { if (Array.isArray(value)) { events.push(...value); } else { for (const event in value) { events.push([event, value[event]]); } } } else if (key === 'class') { addClass(element, value); } else if (key === 'style' && typeof value === 'object') { setStyle(element, value); } else if (key.startsWith('on')) { events.push([key.slice(2).toLowerCase(), value]); } else { element.setAttribute(key, value); } } setEvents(element, events); return element; }
    function addClass(element, value) { element.classList.add(...[value].flat()); return element; }
    function setStyle(element, styles) { for (let [k, v] of Object.entries(styles)) { if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k)) v += 'px'; element.style[k] = v; } return element; }
    function create(name, props, ...childrens) { if (name == null) return null; if (name === 'svg') return createSVG(name, props, ...childrens); const element = name instanceof Element ? name : document.createElement(name); if (props === undefined) return element; if (Array.isArray(props) || props instanceof Node || typeof props !== 'object') return append(element, props, ...childrens); return append(setProps(element, props), ...childrens); }
    function append(element, ...childrens) { if (element.name === 'svg') return appendSVG(element, ...childrens); for (const child of childrens) { if (Array.isArray(child)) element.append(create(...child)); else if (child instanceof Node) element.appendChild(child); else element.append(document.createTextNode(child)); } return element; }
    function createSVG(name, props, ...childrens) { const element = document.createElementNS('http://www.w3.org/2000/svg', name); if (name === 'svg') element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink'); if (props === undefined) return element; if (Array.isArray(props) || props instanceof Node || typeof props !== 'object') return append(element, props, ...childrens); return appendSVG(setProps(element, props), ...childrens) }
    function appendSVG(element, ...childrens) { for (const child of childrens) { if (Array.isArray(child)) element.append(createSVG(...child)); else if (child instanceof Node) element.appendChild(child); else element.append(document.createTextNode(child)); } return element; }
    function removeAllChildren(element) { while (element.firstChild) element.removeChild(element.firstChild); return element; }
    function createTextSVG(text, fontClass) { const testWidthElement = create('span', { class: fontClass, style: { fontSize: '10px', position: 'absolute', opacity: 0 } }, text); append(document.body, testWidthElement); const w = testWidthElement.offsetWidth; testWidthElement.remove(); return createSVG('svg', { class: fontClass, fill: 'currentColor', viewBox: `0 0 ${w} 10` }, ['text', { 'font-size': 10 }, text]); }
    async function newTab(href) { create('a', { href, target: '_blank' }).click(); }
    /**merge**/
    /**merge:js=_common.util.js**/
    function callWhenDone(fn) { let done = true; return async () => { if (!done) return; done = false; await fn(); done = true; } }
    function callNow(fn) { fn(); return fn; }
    function map(list, fn, ret = []) { let i = 0; for (const item of list) { const result = fn(item, i, list); ret.push(result); i++; } return ret }
    /**merge**/
    /**merge:js=_common.database.js**/
    class Collection { constructor(master, { collection, options, indexes }) { this.#master = master; this.#collection = collection; this.#options = options; this.#indexes = indexes; } #master; #collection; #options; #indexes; get collection() { return this.#collection } get options() { return this.#options } get indexes() { return this.#indexes } async transaction(handler, mode) { return this.#master.transaction(this.#collection, async store => { const request = await handler(store); return new Promise((resolve, reject) => { request.addEventListener('error', e => reject(e)); request.addEventListener('success', () => resolve(request.result)); }) }, mode) } async get(key, index = '') { return this.transaction(store => (index ? store.index(index) : store).get(key)); } async put(data) { return this.transaction(store => store.put(data), 'readwrite').then(_ => true); } async clear() { return this.transaction(store => store.clear(), 'readwrite').then(_ => true); } }
    class Database { constructor({ dbName, version, collections }) { this.#dbName = dbName; this.#version = version; for (const options of collections) { this.#collections.set(options.collection, new Collection(this, options)); } } #dbName; #version; #collections = new Map(); #db; async init() { this.#db = await new Promise((resolve, reject) => { const request = window.indexedDB.open(this.#dbName, this.#version); request.addEventListener('error', () => reject({ type: 'error', message: request.error })); request.addEventListener('blocked', () => reject({ type: 'blocked' })); request.addEventListener('success', () => resolve(request.result)); request.addEventListener('upgradeneeded', () => { for (const c of this.#collections.values()) { const { collection, options, indexes } = c; let store; if (!request.result.objectStoreNames.contains(collection)) store = request.result.createObjectStore(collection, options); else store = request.transaction.objectStore(collection); if (!indexes) continue; for (const { name, keyPath, unique } of indexes) { if (store.indexNames.contains(name)) continue; store.createIndex(name, keyPath, { unique }); } } }); }); return this; } async transaction(collection, handler, mode = 'readonly') { return new Promise(async (resolve, reject) => { const transaction = this.#db.transaction(collection, mode); const store = transaction.objectStore(collection); const result = await handler(store); transaction.addEventListener('error', e => reject(e)); transaction.addEventListener('complete', () => resolve(result)); }); } async get(collection, key, index) { return this.#collections.get(collection).get(key, index); } async put(collection, data) { return this.#collections.get(collection).put(data); } async clear(collection) { return this.#collections.get(collection).clear(); } async clearAll() { for (const c of this.#collections.values()) await c.clear(); return true; } }
    /**merge**/
    /**merge:js=_common.event.js**/
    class Event { static #listeners = new Map(); static on(event, listener) { if (!this.#listeners.has(event)) this.#listeners.set(event, new Set()); this.#listeners.get(event).add(listener); } static emit(event, ...args) { if (!this.#listeners.has(event)) return; for (const listener of this.#listeners.get(event).values()) listener(...args); } static off(event, listener) { if (!this.#listeners.has(event)) return; this.#listeners.get(event).delete(listener); } }
    /**merge**/
    /**merge:js=_common.bangumi.js**/
    function whoami() { const nid = window.parent.CHOBITS_UID ?? 0; const dockA = window.parent.document.querySelector('#dock li.first a'); if (dockA) { const id = dockA.href.split('/').pop(); return { id, nid }; } const bannerAvatar = window.parent.document.querySelector('.idBadgerNeue> .avatar'); if (bannerAvatar) { const id = bannerAvatar.href.split('/').pop(); return { id, nid }; } return null; }
    /**merge**/
    addStyle(
        /**merge:css=bangumi_community.user.keyframes.css**/`@keyframes loading-spine {to{transform: rotate(.5turn)}}`/**merge**/,
        /**merge:css=bangumi_community.user.colors.light.css**/`html {--color-base: #ffffff;--color-base-2: #e8e8e8;--color-base-bg: #eaeffba0;--color-base-font: #282828;--color-gray-1: #e8e8e8;--color-gray-2: #cccccc;--color-gray-3: #aaaaaa;--color-gray-4: #969696;--color-gray-11: #cccccc;--color-bangumi-2: #AB515D;--color-bangumi-font: rgb(from var(--color-bangumi) calc(r - 50) calc(g - 50) calc(b - 50));--color-yellow-font: rgb(from var(--color-yellow) calc(r - 50) calc(g - 50) calc(b - 50));--color-purple-font: rgb(from var(--color-purple) calc(r - 50) calc(g - 50) calc(b - 50));--color-blue-font: rgb(from var(--color-blue) calc(r - 50) calc(g - 50) calc(b - 50));--color-green-font: rgb(from var(--color-green) calc(r - 50) calc(g - 50) calc(b - 50));--color-red-font: rgb(from var(--color-red) calc(r - 50) calc(g - 50) calc(b - 50));}`/**merge**/,
        /**merge:css=bangumi_community.user.colors.dark.css**/`html[data-theme='dark'] {--color-base: #000000;--color-base-2: #1f1f1f;--color-base-bg: #23262ba0;--color-base-font: #e8e8e8;--color-gray-1: #444444;--color-gray-2: #555555;--color-gray-3: #6a6a6a;--color-gray-4: #888888;--color-gray-11: #cccccc;--color-bangumi-2: #ffb6bd;--color-bangumi-font: rgb(from var(--color-bangumi) calc(r + 50) calc(g + 50) calc(b + 50));--color-yellow-font: rgb(from var(--color-yellow) calc(r + 50) calc(g + 50) calc(b + 50));--color-purple-font: rgb(from var(--color-purple) calc(r + 50) calc(g + 50) calc(b + 50));--color-blue-font: rgb(from var(--color-blue) calc(r + 50) calc(g + 50) calc(b + 50));--color-green-font: rgb(from var(--color-green) calc(r + 50) calc(g + 50) calc(b + 50));--color-red-font: rgb(from var(--color-red) calc(r + 50) calc(g + 50) calc(b + 50));}`/**merge**/,
        /**merge:css=bangumi_community.user.colors.css**/`html {--color-bangumi: #fd8a96;--color-white: #ffffff;--color-black: #000000;--color-yellow: #f9c74c;--color-purple: #a54cf9;--color-blue: #02a3fb;--color-green: #95eb89;--color-red: #f94144;--color-skyblue: #7ed2ff;--color-dock-sp: var(--color-gray-2);--color-switch-border: var(--color-gray-2);--color-switch-on: var(--color-green);--color-switch-off: var(--color-gray-4);--color-switch-bar-border: var(--color-white);--color-switch-bar-inner: var(--color-gray-11);--color-hover: var(--color-blue);--color-icon-btn-bg: rgb(from var(--color-bangumi) r g b / .25);--color-icon-btn-color: var(--color-white);--color-reply-sp: var(--color-gray-1);--color-reply-tips: var(--color-gray-3);--color-reply-normal: var(--color-bangumi);--color-reply-owner: var(--color-yellow);--color-reply-floor: var(--color-purple);--color-reply-friend: var(--color-green);--color-reply-self: var(--color-blue);--color-sicky-bg: rgb(from var(--color-base) r g b / .125);--color-sicky-border: rgb(from var(--color-bangumi) r g b / .25);--color-sicky-shadow: rgb(from var(--color-base) r g b / .05);--color-sicky-textarea: rgb(from var(--color-base) r g b / .8);--color-sicky-hover-bg: rgb(from var(--color-bangumi) r g b / .125);--color-sicky-hover-border: var(--color-bangumi);--color-sicky-hover-shadow: var(--color-bangumi);--color-primary: var(--color-bangumi);--color-secondary: var(--color-blue);--color-success: var(--color-green);--color-info: var(--color-blue);--color-important: var(--color-purple);--color-warning: var(--color-yellow);--color-danger: var(--color-red);}`/**merge**/,
        /**merge:css=bangumi_community.user.1.css**/`html, html[data-theme='dark'] {#dock {li {position: relative;height: 18px;display: flex;align-items: center;justify-content: center;}li:not(:last-child) {border-right: 1px solid var(--color-dock-sp);}}.columns {> #columnInSubjectB {> * { margin: 0; }display: flex;gap: 10px;flex-direction: column;position: sticky;top: 0;align-self: flex-start;max-height: 100vh;overflow-y: auto;}}*:has(>#comment_list) {.postTopic {border-bottom: none;.inner.tips {display: flex;height: 40px;align-items: center;gap: 8px;color: var(--color-reply-tips);}}.avatar:not(.tinyCover) {img,.avatarNeue {border-radius: 50% !important;}}.clearit:not(.message) {transition: all 0.3s ease;box-sizing: border-box;border-bottom: none !important;border-top: 1px dashed var(--color-reply-sp);.inner.tips {display: flex;height: 40px;align-items: center;gap: 8px;color: var(--color-reply-tips);}.sub_reply_collapse .inner.tips { height: auto; }--color-reply: var(--color-bangumi);}.clearit.friend { --color-reply: var(--color-green); }.clearit.owner { --color-reply: var(--color-yellow); }.clearit.floor { --color-reply: var(--color-purple); }.clearit.self { --color-reply: var(--color-blue); }.clearit.friend, .clearit.owner, .clearit.floor, .clearit.self {border-top: 1px solid var(--color-reply) !important;background: linear-gradient(rgb(from var(--color-reply) r g b / .125) 1px, #00000000 60px) !important;> .inner > :first-child > strong::before, > .inner > strong::before {padding: 1px 4px;margin-right: 4px;border-radius: 2px;background: rgb(from var(--color-bangumi) r g b /.5);}}.clearit:not(:has(.clearit:not(.message):hover), .message):hover {border-top: 1px solid var(--color-reply) !important;background: linear-gradient(rgb(from var(--color-reply) r g b / .125) 1px, #00000000 60px) !important;box-shadow: 0 0 4px rgb(from var(--color-reply) r g b / .5);}.clearit.self { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自'; } }.clearit.friend { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友'; } }.clearit.owner { > .inner > :first-child > strong::before, > .inner > strong::before { content: '楼'; } }.clearit.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '层'; } }.clearit.friend.owner { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友 楼'; } }.clearit.friend.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友 层'; } }.clearit.owner.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '楼 层'; } }.clearit.self.owner { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自 楼'; } }.clearit.self.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自 层'; } }.clearit.friend.owner.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友 楼 层'; } }.clearit.self.owner.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自 楼 层'; } }}#comment_list {box-sizing: border-box;.row:nth-child(odd), .row:nth-child(even) { background: transparent; }> .clearit:first-child { border-top: 1px solid transparent; }div.reply_collapse { padding: 5px 10px; }}@media (max-width: 640px) {.columns { > .column:last-child { align-self: auto !important; } }}}`/**merge**/,
        /**merge:css=bangumi_community.user.2.css**/`html, html[data-theme='dark'] {.tip-item,.svg-icon {position: relative;display: flex !important;align-items: center !important;justify-content: center !important;cursor: pointer;.tip, span {visibility: hidden;position: absolute;top: 0;left: 50%;transform: translate(-50%, calc(-100% - 10px));padding: 2px 5px;border-radius: 5px;background: rgb(from var(--color-black) r g b / 0.6);white-space: nowrap;color: var(--color-white);}.tip::after, span::after {content: '';position: absolute !important;bottom: 0;left: 50%;border-top: 5px solid rgb(from var(--color-black) r g b / 0.6);border-right: 5px solid transparent;border-left: 5px solid transparent;backdrop-filter: blur(5px);transform: translate(-50%, 100%);}}.tip-item:hover, .svg-icon:hover { .tip, span { visibility: visible; } }.switch {display: inline-block;position: relative;cursor: pointer;border-radius: 50px;height: 12px;width: 40px;border: 1px solid var(--color-switch-border);}.switch::before {content: '';display: block;position: absolute;pointer-events: none;height: 12px;width: 40px;top: 0px;border-radius: 24px;background-color: var(--color-switch-off);}.switch::after {content: '';display: block;position: absolute;pointer-events: none;top: 0;left: 0;height: 12px;width: 24px;border-radius: 24px;box-sizing: border-box;background-color: var(--color-switch-bar-inner);border: 5px solid var(--color-switch-bar-border);}.switch[switch="1"]::before {background-color: var(--color-switch-on);}.switch[switch="1"]::after {left: 16px;}.topic-box {#comment_list {.icon {color: var(--color-gray-11);}}.block {display: none;}.sicky-reply {background-color: var(--color-sicky-bg);border: 1px solid var(--color-sicky-border);box-shadow: 0px 0px 0px 2px var(--color-sicky-shadow);textarea {background-color: var(--color-sicky-textarea);}}.sicky-reply:has(:focus),.sicky-reply:hover {grid-template-rows: 1fr;background-color: var(--color-sicky-hover-bg);border: 1px solid var(--color-sicky-hover-border);box-shadow: 0 0 4px var(--color-sicky-hover-shadow);}#reply_wrapper {position: relative;padding: 5px;min-height: 50px;margin: 0;textarea.reply {width: 100% !important;}.switch {position: absolute;right: 10px;top: 10px;}.tip.rr + .switch {top: 35px;}}.sicky-reply {position: sticky;top: 0;z-index: 2;display: grid;height: auto;grid-template-rows: 0fr;border-radius: 4px;backdrop-filter: blur(5px);transition: all 0.3s ease;width: calc(100% - 1px);overflow: hidden;#slider {position: absolute;right: 5px;top: 13px;max-width: 100%;}}.svg-box {display: flex;justify-content: center;align-items: center;}}.vcomm {ul {white-space: nowrap;justify-content: center;align-items: center;}a {display: flex;align-items: center;gap: 0.5em;}}}`/**merge**/,
        /**merge:css=bangumi_community.user.3.css**/`html, html[data-theme='dark'] {.vc-serif {font-family: source-han-serif-sc, source-han-serif-japanese, 宋体, 新宋体;font-weight: 900;}#community-helper-user-panel {position: fixed !important;z-index: 9999;display: grid;place-items: center;top: 0;right: 0;bottom: 0;left: 0;> .close-mask {position: absolute;z-index: -100;display: grid;place-items: center;top: 0;right: 0;bottom: 0;left: 0;background: rgb(from var(--color-base) r g b / 0.5);cursor: pointer;backdrop-filter: blur(5px);}> .container {max-width: 1280px;max-height: 580px;width: calc(100% - 60px);height: calc(100vh - 60px);> fieldset {padding-top: 24px;legend {position: absolute;font-weight: bold;top: 5px;left: 5px;padding: 0;line-height: 12px;font-size: 12px;display: flex;align-items: center;gap: 0.5em;color: var(--color-bangumi-font);> svg {width: 14px;height: 14px;}}}> .tags-field {> ul {display: flex;flex-wrap: wrap;gap: 4px;overflow: auto;li {padding: 0 5px;border-radius: 50px;background: rgb(from var(--color-font) r g b / .25);border: 1px solid var(--color-font);box-sizing: border-box;white-space: pre;}}}display: grid;grid-template-columns: auto auto 1fr 2fr;grid-template-rows: 180px auto auto auto 3fr;gap: 5px 5px;grid-template-areas:"avatar note note bio""actions note note bio""stats note note bio""chart note note bio""usedname usedname tags bio";> * {--color-font: var(--color-bangumi-font);--color-from: var(--color-base-2);--color-to: var(--color-base-2);--color-alpha: 0.05;color: var(--color-font);padding: 10px;position: relative;border-radius: 4px;> .action {color: var(--color-base-font);position: absolute;top: 5px;right: 5px;cursor: pointer;}}> *::after,> *::before {content: '';position: absolute;border-radius: 4px;top: 0;left: 0;right: 0;bottom: 0;background-size: cover;z-index: -10;}> *::before { opacity: 0.2; }> .failed,> .loading::before,> *::after {opacity: 1;background: linear-gradient(150deg, rgb(from var(--color-from) r g b / var(--color-alpha)), rgb(from var(--color-to) r g b / var(--color-alpha)) 75%);box-shadow: 0 0 1px rgb(from var(--color-bangumi-2) r g b / .5);backdrop-filter: blur(10px);}> .loading::after,> .failed::before,> .failed::after {background: none !important;box-shadow: none !important;backdrop-filter: none !important;}> .loading::after {width: 50px;height: 50px;top: calc(50% - 25px);left: calc(50% - 25px);aspect-ratio: 1;border-radius: 50%;border: 8px solid;box-sizing: border-box;border-color: var(--color-bangumi) transparent;animation: loading-spine 1s infinite;}> .failed::before,> .failed::after {width: 50px;height: 8px;top: calc(50% - 25px);left: calc(50% - 4px);}> .failed::after { transform: rotate(45deg); }> .failed::before { transform: rotate(-45deg); }> .avatar {grid-area: avatar;--color-font: var(--color-bangumi);--color-from: var(--color-bangumi);--color-alpha: .25;min-width: 120px;max-width: 280px;display: flex;flex-direction: column;justify-content: center;align-items: center;gap: 5px;img {width: 100px;height: 100px;border-radius: 100px;object-fit: cover;}span {position: absolute;top: 5px;right: 0;transform: translate(100%) rotate(90deg);transform-origin: 0% 0%;}span::before {content: '@';}svg {width: 100%;height: 50px;text {transform: translate(50%, 0.18em);text-anchor: middle;dominant-baseline: hanging;}}}> .actions {grid-area: actions;--color-from: var(--color-yellow);--color-font: var(--color-yellow-font);display: grid;padding: 0;grid-template-columns: repeat(4, 1fr);grid-template-areas: "one two three four";> * {position: relative;display: grid;place-items: center;width: 100%;padding: 10px 0;}> .home { grid-area: one; }> .pm { grid-area: two; }> .friend { grid-area: three; }> .block { grid-area: four; }> *:not(.block)::after {position: absolute;content: '';width: 1px;height: calc(100% - 10px);top: 5px;right: -0.5px;background: rgb(from var(--color-from) r g b / var(--color-alpha));}}> .stats {grid-area: stats;--color-font: var(--color-base-font);padding: 0;display: grid;grid-template-columns: repeat(3, 1fr);grid-template-rows: repeat(2, 1fr);> .stat {line-height: 14px;font-size: 14px;font-weight: bold;padding: 2px 5px;background: rgb(from var(--color-stat) r g b / .25);}> .stat:hover { background: rgb(from var(--color-stat) r g b / .5); }> .stat:first-child {border-radius: 4px 0 0 0;}> .stat:nth-child(3) {border-radius: 0 4px 0 0;}> .stat:last-child {border-radius: 0 0 4px 0;}> .stat:nth-child(4) {border-radius: 0 0 0 4px;}> .coll {--color-stat: var(--color-bangumi);}> .done {--color-stat: var(--color-green);}> .rate {--color-stat: var(--color-skyblue);}> .avg  {--color-stat: var(--color-yellow);}> .std  {--color-stat: var(--color-purple);}> .cnt  {--color-stat: var(--color-blue);}}> .chart {grid-area: chart;--color-font: var(--color-base-font);padding: 0;display: grid;grid-template-rows: repeat(10, 4px);> * {display: flex;justify-content: flex-start !important;width: 100%;.bar {height: 2px;background: rgb(from var(--color-bangumi) r g b / .65);transition: all 0.3s ease;}}> *:first-child::before, *:first-child>.bar { border-radius: 4px 4px 0 0; }> *:last-child::before, *:last-child>.bar { border-radius: 0 0 4px 4px; }> *::before {content: '';position: absolute;top: 1px;left: 0;width: 100%;height: 2px;background: rgb(from var(--color-bangumi) r g b / .15);z-index: -1;transition: all 0.3s ease;}> *:hover::before { background: rgb(from var(--color-bangumi) r g b / .3); }> *:hover > .bar { background: rgb(from var(--color-bangumi) r g b / 1); }}> .tags {grid-area: tags;min-width: 200px;--color-from: var(--color-blue);--color-font: var(--color-blue-font);}> .note {grid-area: note;min-width: 200px;--color-from: var(--color-green);--color-font: var(--color-green-font);}> .usedname {grid-area: usedname;--color-from: var(--color-purple);--color-font: var(--color-purple-font);max-width: 400px;min-width: 200px;> ul {max-height: 336px;}}> .bio {grid-area: bio;--color-from: var(--color-bangumi);--color-font: var(--color-base-font);max-width: 505px;min-width: 300px;max-height: 560px;height: calc(100vh - 80px);> div {height: 100%;overflow: auto;}}}}}`/**merge**/,
    )

    const db = new Database({
        dbName: 'VCommunity', version: 4, collections: [
            { collection: 'values', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }] },
            { collection: 'friends', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }] },
            { collection: 'users', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }] },
            { collection: 'images', options: { keyPath: 'uri' }, indexes: [{ name: 'uri', keyPath: 'uri', unique: true }] }
        ]
    });
    const menu = new class {
        constructor() { }
        #menu = create('ul',
            ['li', { onClick: () => this.#block() }, ['a', { href: 'javascript:void(0)' }, svg('block'), '屏蔽发言']],
            ['li', { onClick: () => this.#show() }, ['a', { href: 'javascript:void(0)' }, svg('detail'), '详细信息']]
        );
        #panel = create('div', { id: 'community-helper-user-panel' },
            ['div', { class: 'close-mask', onClick: () => this.#close() }],
        );
        #style = addStyle()
        #bfbgi(src) {
            const randomClass = 'v-rand-' + Math.floor(Math.random() * 100000 + 100000).toString(16);
            this.#style.innerText = `.${randomClass}::before {background-image: url("${src}");}`
            return randomClass
        }

        #id;

        id(id) {
            this.#id = id;
            return this.#menu;
        }

        async #block() {
            const id = this.#id;
            if (!confirm('确定要屏蔽吗？')) return false;
            const data = await db.get('users', id) || { id };
            data.block = true;
            await db.put('users', data);
            return true
        }

        async #unblock() {
            const id = this.#id;
            if (!confirm('确定要解除屏蔽吗？')) return false;
            const data = await db.get('users', id) || { id };
            data.block = false;
            await db.put('users', data);
            return true
        }

        async #connect(nid, gh) {
            if (!confirm('真的要加好友吗？')) return false;
            const ret = await fetch(`/connect/${nid}?gh=${gh}`);
            return ret.ok
        }

        async #disconnect(nid, gh) {
            if (!confirm('真的要解除好友吗？')) return false;
            const ret = await fetch(`/disconnect/${nid}?gh=${gh}`);
            return ret.ok
        }

        async #loadUserData(id) {
            return await db.get('users', id) || { id, names: new Set() };
        }

        async #loadUsedname(id) {
            const data = await this.#loadUserData(id);
            const { names, namesUpdate, namesTml } = data;
            if (namesUpdate < Date.now() - 3600_000) return names;
            const getUsedNames = async (end, tml, ret = [], page = 1) => {
                const res = await fetch(`/user/${id}/timeline?type=say&ajax=1&page=${page}`);
                const html = await res.text();
                const names = Array.from(html.matchAll(/从 \<strong\>(?<from>.*?)\<\/strong\> 改名为/g), m => m.groups.from);
                const tmls = Array.from(html.matchAll(/\<h4 class="Header"\>(?<tml>\d{4}\-\d{1,2}\-\d{1,2})\<\/h4\>/g), m => m.groups.tml);
                if (!tml) tml = tmls[0];
                ret.push(...names);
                if (tmls.includes(end) || !html.includes('>下一页 &rsaquo;&rsaquo;</a>'))
                    return { ret, tml };
                return getUsedNames(end, tml, ret, page + 1);
            };
            const { ret, tml } = await getUsedNames(namesTml);
            const namesN = new Set(ret).union(names);
            namesN.delete('');
            if (namesTml && names.size == namesN.size) return names;
            const save = await this.#loadUserData(id);
            save.names = namesN;
            save.namesUpdate = Date.now();
            save.namesTml = tml;
            await db.put('users', save);
            return namesN;
        }

        async #loadHomepage(id) {
            const res = await fetch('/user/' + id);
            if (!res.ok) return null;
            const html = await res.text();
            const element = document.createElement('html');
            element.innerHTML = html.replace(/<(img|script|link)/g, '<noload');
            const nameSingle = element.querySelector('#headerProfile .nameSingle');
            const bio = element.querySelector('.bio') ?? '';
            const name = nameSingle.querySelector('.name a').innerText;
            const src = nameSingle.querySelector('.headerAvatar .avatar span').style.backgroundImage.replace('url("', '').replace('")', '');
            const actions = nameSingle.querySelectorAll('#headerProfile .actions a.chiiBtn');
            const nid = actions[1].href.split('/').pop().replace('.chii', '')
            const friend = actions[0].innerText == '解除好友';
            const gh = friend
                ? actions[0].getAttribute('onclick').split(',').pop().split(/['"]/)[1]
                : actions[0].href.split('gh=').pop();
            if (bio) bio.classList.remove('bio');
            const pinnedLayout = element.querySelector('#pinnedLayout');
            const stats = Array.from(pinnedLayout.querySelectorAll('.gridStats > .item'), e => {
                const name = e.lastElementChild.innerText;
                let type;
                switch (name) {
                    case '收藏': type = 'coll'; break;
                    case '完成': type = 'done'; break;
                    case '完成率': type = 'rate'; break;
                    case '平均分': type = 'avg'; break;
                    case '标准差': type = 'std'; break;
                    case '评分数': type = 'cnt'; break;
                }
                return { type, name, value: e.firstElementChild.innerText }
            })
            const chart = Array.from(pinnedLayout.querySelectorAll('#ChartWarpper li > a'), e => {
                return {
                    label: e.firstElementChild.innerText,
                    value: parseInt(e.lastElementChild.innerText.replace(/[\(\)]/g, '')),
                }
            })

            return { name, src, bio, nid, gh, friend, stats, chart }
        }

        #isShow = false;
        #close() {
            this.#isShow = false;
            this.#panel.remove();
            const close = this.#panel.firstElementChild;
            while (this.#panel.lastElementChild != close) {
                this.#panel.lastElementChild.remove();
            }
        }

        async #show() {
            this.#isShow = true;
            const id = this.#id;
            const avatar = create('div', { class: ['avatar', 'loading'] });
            const bio = create('fieldset', { class: ['bio', 'loading'] }, ['legend', svg('user'), 'Bio']);
            const usedname = create('fieldset', { class: ['usedname', 'tags-field', 'loading'] }, ['legend', svg('history'), '曾用名']);
            const tags = create('fieldset', { class: ['tags', 'tags-field', 'loading'] }, ['legend', svg('tag'), '标签']);
            const note = create('fieldset', { class: ['note', 'loading'] }, ['legend', svg('note'), '备注']);
            const stats = create('ul', { class: 'stats' });
            const chart = create('ul', { class: 'chart' });

            const actions = create('ul', { class: 'actions' });
            const homeBtn = create('li', { class: ['home', 'svg-icon'], onClick: () => newTab('/user/' + id) }, svg('home'), ['span', '主页']);
            const pmBtn = create('li', { class: ['pm', 'svg-icon'] }, svg('message'), ['span', '私信']);
            const connectBtn = create('li', { class: ['friend', 'svg-icon'] }, svg('connect'), ['span', '加好友']);
            const disconnectBtn = create('li', { class: ['friend', 'svg-icon'] }, svg('disconnect'), ['span', '解除好友']);
            const blockedBtn = create('li', { class: ['block', 'svg-icon'] }, svg('block'), ['span', '解除屏蔽']);
            const unblockBtn = create('li', { class: ['block', 'svg-icon'] }, svg('notify'), ['span', '屏蔽']);
            append(actions, homeBtn, pmBtn, connectBtn, unblockBtn);

            append(document.body, [this.#panel, ['div', { class: 'container' }, avatar, actions, stats, bio, usedname, tags, note, chart]]);

            const nicescroll = { cursorcolor: "rgb(from var(--color-bangumi) r g b / .5)", cursorwidth: "8px", cursorborder: "none" };
            await loadScript('https://cdn.jsdelivr.net/npm/jquery.nicescroll@3.7/jquery.nicescroll.min.js');
            await Promise.all([
                async () => {
                    // 加载 用户主页内容 头像、昵称、简介、统计、图表、数字id、好友状态
                    const homepage = await this.#loadHomepage(id);
                    if (!this.#isShow || id != this.#id) return;
                    avatar.classList.remove('loading');
                    bio.classList.remove('loading');
                    if (!homepage) {
                        avatar.classList.add('failed');
                        bio.classList.add('failed');
                    }
                    const { name, src, friend, nid, gh, bio: rbio, stats: sts, chart: cht } = homepage;
                    bio.classList.add(this.#bfbgi(src))
                    append(avatar, ['img', { src }], createTextSVG(name, 'vc-serif'), ['span', id]);
                    append(bio, rbio);
                    pmBtn.addEventListener('click', () => newTab('/pm/compose/' + nid + '.chii'));
                    if (friend) connectBtn.replaceWith(disconnectBtn)
                    connectBtn.addEventListener('click', async () => {
                        if (await this.#connect(nid, gh)) connectBtn.replaceWith(disconnectBtn);
                    });
                    disconnectBtn.addEventListener('click', async () => {
                        if (await this.#disconnect(nid, gh)) disconnectBtn.replaceWith(connectBtn);
                    });
                    if (rbio) $(rbio).niceScroll(nicescroll);
                    append(stats, ...map(sts, v => ['li', { class: ['stat', 'tip-item', v.type] }, ['div', v.value], ['span', v.name]]));
                    const max = Math.max(...cht.map(v => v.value));
                    append(chart, ...map(cht, v => ['li', { class: 'tip-item' }, ['span', `${v.label}分: ${v.value}`],
                        ['div', { class: 'bar', style: { width: (v.value / max * 100).toFixed(2) + '%' } }],
                    ]));
                },
                async () => {
                    // 加载 曾用名
                    await loadScript('https://cdn.jsdelivr.net/npm/jquery.nicescroll@3.7/jquery.nicescroll.min.js');
                    const names = await this.#loadUsedname(id);
                    if (!this.#isShow || id != this.#id) return;
                    usedname.classList.remove('loading');
                    const usednameUl = this.#ul(names);
                    append(usedname, usednameUl);
                    $(usednameUl).niceScroll(nicescroll);
                },
                async () => {
                    // 加载 标签 备注
                    await loadScript('https://cdn.jsdelivr.net/npm/jquery.nicescroll@3.7/jquery.nicescroll.min.js');
                    const user = await this.#loadUserData(id);
                    if (!this.#isShow || id != this.#id) return;
                    tags.classList.remove('loading');
                    note.classList.remove('loading');
                    const editTags = create('div', { class: ['svg-icon', 'action'] }, svg('edit'), ['span', '编辑']);
                    const editNote = create('div', { class: ['svg-icon', 'action'] }, svg('edit'), ['span', '编辑']);
                    const tagsUl = this.#ul(user.tags);
                    append(tags, tagsUl, editTags);
                    append(note, user.note ?? '', editNote);
                    if (user.block) unblockBtn.replaceWith(blockedBtn)
                    blockedBtn.addEventListener('click', async () => {
                        if (await this.#unblock()) blockedBtn.replaceWith(unblockBtn);
                    });
                    unblockBtn.addEventListener('click', async () => {
                        if (await this.#block()) unblockBtn.replaceWith(blockedBtn);
                    });
                    $(tagsUl).niceScroll(nicescroll);
                },
            ].map(fn => fn()));
        }
        #ul(list) { return create('ul', ...map(list ?? [], v => ['li', v])); }
    }

    function dockInject() {
        const dock = document.querySelector('#dock');
        if (!dock) return;
        let n, o;

        o = dock.querySelector('#showrobot');
        o.style.display = 'none';
        n = create('a', { class: ['showrobot', 'svg-icon'], href: 'javascript:void(0)' }, svg('robot'), ['span', '春菜']);
        n.addEventListener('click', () => chiiLib.ukagaka.toggleDisplay());
        o.parentElement.append(n);

        o = dock.querySelector('#toggleTheme');
        o.style.display = 'none';
        n = create('a', { class: ['toggleTheme', 'svg-icon'], href: 'javascript:void(0)' }, svg('light'), ['span', '开关灯']);
        n.addEventListener('click', () => chiiLib.ukagaka.toggleTheme());
        o.parentElement.append(n);
        o.parentElement.classList.remove('last');

        o = null;
        dock.querySelectorAll('li').forEach(e => {
            if (!o || o.children.length < e.children.length) o = e;
        });
        o.querySelectorAll('a').forEach(a => {
            let icon;
            switch (a.innerText) {
                case '提醒': icon = 'notify'; break;
                case '短信': icon = 'message'; break;
                case '设置': icon = 'setting'; break;
                case '登出': icon = 'logout'; break;
            }
            if (icon) {
                const title = a.innerText
                removeAllChildren(a);
                a.classList.add('svg-icon');
                append(a, svg(icon), ['span', title]);
            }
            o.parentElement.insertBefore(create('li', a), o);
        })
        o.remove();
    }

    async function parseHasCommentList() {
        const commentList = document.querySelector('#comment_list')
        if (!commentList) return;
        const e = commentList.parentElement;
        if (!e) return;
        e.classList.add('topic-box');
        const first = e.querySelector(':scope>.clearit')
        const replyWrapper = e.querySelector('#reply_wrapper');
        if (replyWrapper) {
            e.querySelector('#sliderContainer')?.style.setProperty('display', 'none', 'important');
            const getSwitch = () => {
                const raw = localStorage.getItem('sickyReplySwitch')
                if (!raw) return 1;
                return Number(raw) || 0;
            }
            const swBtn = create('div', { class: 'switch', switch: Number(localStorage.getItem('sickyReplySwitch')) || 1 });
            swBtn.addEventListener('click', callNow(sw => {
                const s = sw ? sw() : getSwitch();
                swBtn.setAttribute('switch', s);
                const sicky = (() => {
                    const q = e.querySelector('.sicky-reply')
                    if (q) return q;
                    const c = create('div', { class: 'sicky-reply' });
                    e.insertBefore(c, first || commentList);
                    return c;
                })();
                if (s) {
                    sicky.style.visibility = 'visible';
                    sicky.append(replyWrapper);
                } else {
                    sicky.style.visibility = 'hidden';
                    e.append(replyWrapper);
                }

            }).bind(this, () => {
                const s = (getSwitch() + 1) % 2;
                localStorage.setItem('sickyReplySwitch', s)
                return s;
            }));
            append(replyWrapper, swBtn);
        }

        const handlerClearit = async clearit => {
            const id = clearit.getAttribute('data-item-user')
            if (!id) return;
            const data = await db.get('users', id) || { id, names: new Set() };
            const inner = clearit.querySelector('.inner');
            const icon = create('a', { class: ['icon', 'svg-icon'], href: 'javascript:void(0)' }, svg('tag'));
            const action = create('div', { class: ['action', 'dropdown', 'vcomm'] }, icon);
            icon.addEventListener('mouseenter', () => append(action, menu.id(id)));
            const actionBox = clearit.querySelector('.post_actions');
            actionBox.insertBefore(action, actionBox.lastElementChild);
            if (!data.names) data.names = new Set();
            const currentName = inner.querySelector('strong > a').innerText;
            if (currentName && !data.names.has(currentName)) {
                data.names.add(currentName);
                await db.put('users', data);
            }
            if (data.block) {
                const btn = create('div', { class: 'svg-box' }, svg('expand'))
                const tip = create('span', { class: 'svg-box' }, svg('collapse'), '已折叠')
                const tips = create('div', { class: ['inner', 'tips'] }, tip, btn);
                btn.addEventListener('click', () => tips.replaceWith(inner));
                inner.replaceWith(tips);
            }
        }
        if (first) handlerClearit(first);
        const owner = e.querySelector('.postTopic')?.getAttribute('data-item-user');
        const self = whoami()?.id;
        const friends = await getFriends();
        if (friends.has(owner)) first.classList.add('friend');
        if (owner == self) first.classList.add('self');
        for (const comment of Array.from(commentList.children)) {
            const floor = comment.getAttribute('data-item-user')
            if (friends.has(floor)) comment.classList.add('friend');
            if (floor === owner) comment.classList.add('owner');
            if (floor === self) comment.classList.add('self');
            handlerClearit(comment)
            comment.querySelectorAll('.clearit').forEach(clearit => {
                const user = clearit.getAttribute('data-item-user');
                if (friends.has(user)) clearit.classList.add('friend');
                if (user === owner) clearit.classList.add('owner');
                if (user === floor) clearit.classList.add('floor');
                if (user === self) clearit.classList.add('self');
                handlerClearit(clearit);
            });
        }
    }

    async function getFriends() {
        const user = whoami();
        if (!user) return new Set();
        const id = user.id;
        const cache = await db.get('friends', id);
        if (cache && cache.timestamp > Date.now() - 3600_000) return cache.friends;
        const res = await fetch(`/user/${id}/friends`);
        if (!res.ok) console.warn(`Error fetching friends: ${res.status}`);
        const html = await res.text();
        const element = document.createElement('html')
        element.innerHTML = html.replace(/<(img|script|link)/g, '<noload');
        const friends = new Set();
        for (const a of element.querySelectorAll('#memberUserList a.avatar')) {
            const id = a.href.split('/').pop();
            friends.add(id);
        }
        await db.put('friends', { id, friends, timestamp: Date.now() });
        return friends;
    }

    function svg(type, size = 14) {
        const fill = 'currentColor';
        const stroke = fill;
        const viewBox = '0 0 16 16'
        const baseParams = { width: size, height: size }
        switch (type) {
            case 'collapse': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M10.896 2H8.75V.75a.75.75 0 0 0-1.5 0V2H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0l2.896-2.896A.25.25 0 0 0 10.896 2ZM8.75 15.25a.75.75 0 0 1-1.5 0V14H5.104a.25.25 0 0 1-.177-.427l2.896-2.896a.25.25 0 0 1 .354 0l2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25Zm-6.5-6.5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z' }]
            ];
            case 'expand': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'm8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z' }]
            ];
            case 'logout': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z' }]
            ];
            case 'setting': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z' }]
            ];
            case 'message': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z' }]
            ];
            case 'light': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z' }]
            ];
            case 'notify': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z' }]
            ];
            case 'info': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z' }]
            ];
            case 'unnotify': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'm4.182 4.31.016.011 10.104 7.316.013.01 1.375.996a.75.75 0 1 1-.88 1.214L13.626 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947V5.305L.31 3.357a.75.75 0 1 1 .88-1.214Zm7.373 7.19L4.5 6.391v1.556c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01c0 .005.002.009.005.012l.006.004.007.001ZM8 1.5c-.997 0-1.895.416-2.534 1.086A.75.75 0 1 1 4.38 1.55 5 5 0 0 1 13 5v2.373a.75.75 0 0 1-1.5 0V5A3.5 3.5 0 0 0 8 1.5ZM8 16a2 2 0 0 1-1.985-1.75c-.017-.137.097-.25.235-.25h3.5c.138 0 .252.113.235.25A2 2 0 0 1 8 16Z' }]
            ];
            case 'robot': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z' }],
                ['path', { d: 'M6.25 0h2A.75.75 0 0 1 9 .75V3.5h3.25a2.25 2.25 0 0 1 2.25 2.25V8h.75a.75.75 0 0 1 0 1.5h-.75v2.75a2.25 2.25 0 0 1-2.25 2.25h-8.5a2.25 2.25 0 0 1-2.25-2.25V9.5H.75a.75.75 0 0 1 0-1.5h.75V5.75A2.25 2.25 0 0 1 3.75 3.5H7.5v-2H6.25a.75.75 0 0 1 0-1.5ZM3 5.75v6.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75Z' }]
            ];
            case 'tag': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z' }]
            ];
            case 'edit': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z' }]
            ];
            case 'link': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'm7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z' }]
            ];
            case 'star': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z' }]
            ];
            case 'clock': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z' }]
            ];
            case 'block': return ['svg', { viewBox: '1 1 22 22', fill: 'none', stroke, ...baseParams },
                ['path', { 'stroke-width': 2, 'stroke-linecap': "round", 'stroke-linejoin': "round", d: 'M5.63605 5.63603L18.364 18.364M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z' }]
            ];
            case 'edit': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z' }]
            ];
            case 'history': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'm.427 1.927 1.215 1.215a8.002 8.002 0 1 1-1.6 5.685.75.75 0 1 1 1.493-.154 6.5 6.5 0 1 0 1.18-4.458l1.358 1.358A.25.25 0 0 1 3.896 6H.25A.25.25 0 0 1 0 5.75V2.104a.25.25 0 0 1 .427-.177ZM7.75 4a.75.75 0 0 1 .75.75v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5A.75.75 0 0 1 7.75 4Z' }]
            ];
            case 'detail': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L10.69 8 9.22 6.53a.75.75 0 0 1 0-1.06ZM6.78 6.53 5.31 8l1.47 1.47a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-2-2a.75.75 0 0 1 0-1.06l2-2a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z' }]
            ];
            case 'refresh': return ['svg', { viewBox: '1 1 22 22', fill: 'none', stroke, ...baseParams },
                ['path', { 'stroke-width': 2, 'stroke-linecap': "round", 'stroke-linejoin': "round", d: 'M3 3V8M3 8H8M3 8L6 5.29168C7.59227 3.86656 9.69494 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.71683 21 4.13247 18.008 3.22302 14' }]
            ];
            case 'note': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M5 8.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 5 8.25ZM4 10.5A.75.75 0 0 0 4 12h4a.75.75 0 0 0 0-1.5H4Z' }],
                ['path', { d: 'M13-.005c1.654 0 3 1.328 3 3 0 .982-.338 1.933-.783 2.818-.443.879-1.028 1.758-1.582 2.588l-.011.017c-.568.853-1.104 1.659-1.501 2.446-.398.789-.623 1.494-.623 2.136a1.5 1.5 0 1 0 2.333-1.248.75.75 0 0 1 .834-1.246A3 3 0 0 1 13 16H3a3 3 0 0 1-3-3c0-1.582.891-3.135 1.777-4.506.209-.322.418-.637.623-.946.473-.709.923-1.386 1.287-2.048H2.51c-.576 0-1.381-.133-1.907-.783A2.68 2.68 0 0 1 0 2.995a3 3 0 0 1 3-3Zm0 1.5a1.5 1.5 0 0 0-1.5 1.5c0 .476.223.834.667 1.132A.75.75 0 0 1 11.75 5.5H5.368c-.467 1.003-1.141 2.015-1.773 2.963-.192.289-.381.571-.558.845C2.13 10.711 1.5 11.916 1.5 13A1.5 1.5 0 0 0 3 14.5h7.401A2.989 2.989 0 0 1 10 13c0-.979.338-1.928.784-2.812.441-.874 1.023-1.748 1.575-2.576l.017-.026c.568-.853 1.103-1.658 1.501-2.448.398-.79.623-1.497.623-2.143 0-.838-.669-1.5-1.5-1.5Zm-10 0a1.5 1.5 0 0 0-1.5 1.5c0 .321.1.569.27.778.097.12.325.227.74.227h7.674A2.737 2.737 0 0 1 10 2.995c0-.546.146-1.059.401-1.5Z' }],
            ];
            case 'user': return ['svg', { viewBox, fill, ...baseParams },
                ['path', { d: 'M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z' }],
            ];
            case 'home': return ['svg', { viewBox: '-1 -1 34 34', fill, stroke: fill, strokeWidth: 1, ...baseParams },
                ['path', { d: 'M31.772 16.043l-15.012-15.724c-0.189-0.197-0.449-0.307-0.721-0.307s-0.533 0.111-0.722 0.307l-15.089 15.724c-0.383 0.398-0.369 1.031 0.029 1.414 0.399 0.382 1.031 0.371 1.414-0.029l1.344-1.401v14.963c0 0.552 0.448 1 1 1h6.986c0.551 0 0.998-0.445 1-0.997l0.031-9.989h7.969v9.986c0 0.552 0.448 1 1 1h6.983c0.552 0 1-0.448 1-1v-14.968l1.343 1.407c0.197 0.204 0.459 0.308 0.722 0.308 0.249 0 0.499-0.092 0.692-0.279 0.398-0.382 0.411-1.015 0.029-1.413zM26.985 14.213v15.776h-4.983v-9.986c0-0.552-0.448-1-1-1h-9.965c-0.551 0-0.998 0.445-1 0.997l-0.031 9.989h-4.989v-15.777c0-0.082-0.013-0.162-0.032-0.239l11.055-11.52 10.982 11.507c-0.021 0.081-0.036 0.165-0.036 0.252z' }],
            ];
            case 'disconnect': return ['svg', { viewBox: '0 0 32 32', fill, ...baseParams },
                ['path', { d: 'M29.323,28.000 L31.610,30.293 C31.999,30.684 31.999,31.316 31.610,31.707 C31.415,31.902 31.160,32.000 30.905,32.000 C30.649,32.000 30.394,31.902 30.200,31.707 L27.913,29.414 L25.627,31.707 C25.432,31.902 25.177,32.000 24.922,32.000 C24.667,32.000 24.412,31.902 24.217,31.707 C23.827,31.316 23.827,30.684 24.217,30.293 L26.503,28.000 L24.217,25.707 C23.827,25.316 23.827,24.684 24.217,24.293 C24.606,23.902 25.237,23.902 25.627,24.293 L27.913,26.586 L30.200,24.293 C30.589,23.902 31.220,23.902 31.610,24.293 C31.999,24.684 31.999,25.316 31.610,25.707 L29.323,28.000 ZM21.638,22.294 C22.028,22.684 22.028,23.317 21.638,23.707 C21.249,24.097 20.618,24.098 20.228,23.706 L19.231,22.706 C19.031,22.505 18.925,22.229 18.940,21.947 C18.956,21.664 19.089,21.400 19.308,21.222 C22.876,18.321 23.000,13.053 23.000,13.000 L23.000,7.000 C22.444,4.024 18.877,2.035 16.019,2.001 L15.948,2.003 C13.076,2.003 9.529,4.087 8.968,7.087 L8.964,12.994 C8.964,13.045 9.019,18.324 12.587,21.225 C12.845,21.435 12.982,21.761 12.952,22.093 C12.922,22.425 12.728,22.720 12.436,22.880 L1.988,28.594 L1.988,30.000 L20.933,30.000 C21.484,30.000 21.930,30.448 21.930,31.000 C21.930,31.552 21.484,32.000 20.933,32.000 L1.988,32.000 C0.888,32.000 -0.007,31.103 -0.007,30.000 L-0.007,28.000 C-0.007,27.634 0.193,27.297 0.513,27.122 L10.274,21.785 C7.005,18.239 7.000,13.232 7.000,13.000 L7.000,7.000 L6.987,6.832 C7.672,2.777 12.112,0.043 15.865,0.003 L15.948,-0.000 C19.718,-0.000 24.219,2.744 24.908,6.829 L24.922,6.996 L24.926,12.990 C24.926,13.227 24.888,18.479 21.380,22.034 L21.638,22.294 Z' }],
            ];
            case 'connect': return ['svg', { viewBox: '0 0 32 32', fill, ...baseParams },
                ['path', { d: 'M2.002 27.959c0-0.795 0.597-1.044 0.835-1.154l8.783-4.145c0.63-0.289 1.064-0.885 1.149-1.573s-0.193-1.37-0.733-1.803c-2.078-1.668-3.046-5.334-3.046-7.287v-4.997c0-2.090 3.638-4.995 7.004-4.995 3.396 0 6.997 2.861 6.997 4.995v4.998c0 1.924-0.8 5.604-2.945 7.292-0.547 0.43-0.831 1.115-0.749 1.807 0.082 0.692 0.518 1.291 1.151 1.582l2.997 1.422 0.494-1.996-2.657-1.243c2.771-2.18 3.708-6.463 3.708-8.864v-4.997c0-3.31-4.582-6.995-8.998-6.995s-9.004 3.686-9.004 6.995v4.997c0 2.184 0.997 6.602 3.793 8.846l-8.783 4.145s-1.998 0.89-1.998 1.999v3.001c0 1.105 0.895 1.999 1.998 1.999h21.997v-2l-21.996 0.001v-2.029zM30.998 25.996h-3v-3c0-0.552-0.448-1-1-1s-1 0.448-1 1v3h-3c-0.552 0-1 0.448-1 1s0.448 1 1 1h3v3c0 0.552 0.448 1 1 1s1-0.448 1-1v-3h3c0.552 0 1-0.448 1-1s-0.448-1-1-1z' }],
            ];

            default: return null;
        }
    };

    document.addEventListener('readystatechange', callNow(async () => {
        if (document.readyState !== 'complete') return;
        await db.init().catch((reason) => {
            if (!reason) throw new Error('db init failed');
            switch (reason.type) {
                case 'error': throw reason.message;
                case 'blocked': {
                    alert('Bangumi 社区助手 preview 数据库有更新，请先关闭所有班固米标签页再刷新试试');
                    throw new Error('db init blocked');
                }
                default: throw reason;
            }
        });
        dockInject();
        parseHasCommentList();
    }))
})();