// ==UserScript==
// @name         Bangumi 年鉴
// @description  根据Bangumi的时光机数据生成年鉴
// @namespace    syaro.io
// @version      1.3.14
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/bangumi_report.user.js
// @match        *://bgm.tv/user/*
// @match        *://chii.in/user/*
// @match        *://bangumi.tv/user/*
// ==/UserScript==
(async () => {
    /**merge:js=common/dom.script.js**/
    class LoadScript { static #loaded = new Set(); static #pedding = new Map(); static async load(src) { if (this.#loaded.has(src)) return; const list = this.#pedding.get(src) ?? []; const pedding = new Promise((resolve) => list.push(resolve)); if (!this.#pedding.has(src)) { this.#pedding.set(src, list); const script = create('script', { src, type: 'text/javascript' }); script.onload = () => { this.#loaded.add(src); list.forEach((resolve) => resolve()); }; document.body.appendChild(script); } return pedding; } }
    /**merge**/
    /**merge:js=common/dom.style.js**/
    function addStyle(...styles) { const style = document.createElement('style'); style.append(document.createTextNode(styles.join('\n'))); document.head.appendChild(style); return style; }
    /**merge**/
    /**merge:js=common/dom.js**/
    function setEvents(element, events) { for (const [event, listener] of events) { element.addEventListener(event, listener); } return element; }
    function setProps(element, props) { if (!props || typeof props !== 'object') return element; const events = []; for (const [key, value] of Object.entries(props)) { if (typeof value === 'boolean') { element[key] = value; continue; } if (key === 'events') { if (Array.isArray(value)) { events.push(...value); } else { for (const event in value) { events.push([event, value[event]]); } } } else if (key === 'class') { addClass(element, value); } else if (key === 'style' && typeof value === 'object') { setStyle(element, value); } else if (key.startsWith('on')) { events.push([key.slice(2).toLowerCase(), value]); } else { element.setAttribute(key, value); } } setEvents(element, events); return element; }
    function addClass(element, value) { element.classList.add(...[value].flat()); return element; }
    function setStyle(element, styles) { for (let [k, v] of Object.entries(styles)) { if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k)) v += 'px'; element.style[k] = v; } return element; }
    function create(name, props, ...childrens) { if (name == null) return null; if (name === 'svg') return createSVG(name, props, ...childrens); const element = name instanceof Element ? name : document.createElement(name); if (props === undefined) return element; if (Array.isArray(props) || props instanceof Node || typeof props !== 'object') return append(element, props, ...childrens); return append(setProps(element, props), ...childrens); }
    function append(element, ...childrens) { if (element.name === 'svg') return appendSVG(element, ...childrens); for (const child of childrens) { if (Array.isArray(child)) element.append(create(...child)); else if (child instanceof Node) element.appendChild(child); else element.append(document.createTextNode(child)); } return element; }
    function createSVG(name, props, ...childrens) { const element = document.createElementNS('http://www.w3.org/2000/svg', name); if (name === 'svg') element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink'); if (props === undefined) return element; if (Array.isArray(props) || props instanceof Node || typeof props !== 'object') return append(element, props, ...childrens); return appendSVG(setProps(element, props), ...childrens); }
    function appendSVG(element, ...childrens) { for (const child of childrens) { if (Array.isArray(child)) element.append(createSVG(...child)); else if (child instanceof Node) element.appendChild(child); else element.append(document.createTextNode(child)); } return element; }
    function removeAllChildren(element) { while (element.firstChild) element.removeChild(element.firstChild); return element; }
    function createTextSVG(text, fontClass) { const testWidthElement = create('span', { class: fontClass, style: { fontSize: '10px', position: 'absolute', opacity: 0 }, }, text); append(document.body, testWidthElement); const w = testWidthElement.offsetWidth; testWidthElement.remove(); return createSVG('svg', { class: fontClass, fill: 'currentColor', viewBox: `0 0 ${w} 10` }, ['text', { 'font-size': 10 }, text,]); }
    async function newTab(href) { create('a', { href, target: '_blank' }).click(); }
    /**merge**/
    /**merge:js=common/util.js**/
    function callWhenDone(fn) { let done = true; return async () => { if (!done) return; done = false; await fn(); done = true; }; }
    function callNow(fn) { fn(); return fn; }
    function map(list, fn, ret = []) { let i = 0; for (const item of list) { const result = fn(item, i, list); ret.push(result); i++; } return ret; }
    /**merge**/
    /**merge:js=common/database.js**/
    class Cache { constructor({ hot, last }) { this.#hotLimit = hot ?? 0; this.#lastLimit = last ?? 0; this.#cacheLimit = this.#hotLimit + this.#lastLimit; } #hotLimit; #lastLimit; #cacheLimit; #hotList = []; #hot = new Set(); #last = new Set(); #pedding = new Set(); #cache = new Map(); #times = new Map(); #cHot(key) { if (!this.#hotLimit) return false; const counter = this.#times.get(key) || { key, cnt: 0 }; counter.cnt++; this.#times.set(key, counter); if (this.#hot.size == 0) { this.#hotList.push(counter); this.#hot.add(key); this.#pedding.delete(key); return true; } const i = this.#hotList.indexOf(counter); if (i == 0) return true; if (i > 0) { const up = this.#hotList[i - 1]; if (counter.cnt > up.cnt) this.#hotList.sort((a, b) => b.cnt - a.cnt); return true; } if (this.#hot.size < this.#hotLimit) { this.#hotList.push(counter); this.#hot.add(key); this.#pedding.delete(key); return true; } const min = this.#hotList.at(-1); if (counter.cnt <= min.cnt) return false; this.#hotList.pop(); this.#hot.delete(min.key); if (!this.#last.has(min.key)) this.#pedding.add(min.key); this.#hotList.push(counter); this.#hot.add(key); this.#pedding.delete(key); return true; } #cLast(key) { if (!this.#lastLimit) return false; this.#last.delete(key); this.#last.add(key); this.#pedding.delete(key); if (this.#last.size <= this.#lastLimit) return true; const out = this.#last.values().next().value; this.#last.delete(out); if (!this.#hot.has(out)) this.#pedding.add(out); return true; } async get(key, query) { const data = this.#cache.get(key) ?? (await query()); const inHot = this.#cHot(key); const inLast = this.#cLast(key); if (inHot || inLast) this.#cache.set(key, data); let i = this.#cache.size - this.#cacheLimit; if (!i) return data; for (const key of this.#pedding) { if (!i) return data; this.#cache.delete(key); this.#pedding.delete(key); i--; } return data; } update(key, value) { if (!this.#cache.has(key)) this.#cache.set(key, value); } clear() { this.#cache.clear(); } }
    class Collection { constructor(master, { collection, options, indexes, cache }) { this.#master = master; this.#collection = collection; this.#options = options; this.#indexes = indexes; if (cache && cache.enabled) { this.#cache = new Cache(cache); } } #master; #collection; #options; #indexes; #cache = null; get collection() { return this.#collection; } get options() { return this.#options; } get indexes() { return this.#indexes; } async transaction(handler, mode) { return this.#master.transaction(this.#collection, async (store) => { const request = await handler(store); return new Promise((resolve, reject) => { request.addEventListener('error', (e) => reject(e)); request.addEventListener('success', () => resolve(request.result)); }); }, mode); } #index(store, index = '') { if (!index) return store; return store.index(index); } async get(key, index) { const handler = () => this.transaction((store) => this.#index(store, index).get(key)); if (this.#cache && this.#options.keyPath && !index) return this.#cache.get(key, handler); return handler(); } async getAll(key, count, index) { return this.transaction((store) => this.#index(store, index).getAll(key, count)); } async getAllKeys(key, count, index) { return this.transaction((store) => this.#index(store, index).getAllKeys(key, count)); } async put(data) { if (this.#cache) { let key; if (Array.isArray(this.#options.keyPath)) { key = []; for (const path of this.#options.keyPath) { key.push(data[path]); } key = key.join('/'); } else { key = data[this.#options.keyPath]; } this.#cache.update(key, data); } return this.transaction((store) => store.put(data), 'readwrite').then((_) => true); } async delete(key) { return this.transaction((store) => store.delete(key), 'readwrite').then((_) => true); } async clear() { if (this.#cache) this.#cache.clear(); return this.transaction((store) => store.clear(), 'readwrite').then((_) => true); } }
    class Database { constructor({ dbName, version, collections, blocked }) { this.#dbName = dbName; this.#version = version; this.#blocked = blocked || { alert: false }; for (const options of collections) { this.#collections.set(options.collection, new Collection(this, options)); } } #dbName; #version; #collections = new Map(); #db; #blocked; async init() { this.#db = await new Promise((resolve, reject) => { const request = window.indexedDB.open(this.#dbName, this.#version); request.addEventListener('error', () => reject({ type: 'error', message: request.error })); request.addEventListener('blocked', () => { const message = this.#blocked?.message || 'indexedDB is blocked'; if (this.#blocked?.alert) alert(message); reject({ type: 'blocked', message }); }); request.addEventListener('success', () => resolve(request.result)); request.addEventListener('upgradeneeded', () => { for (const c of this.#collections.values()) { const { collection, options, indexes } = c; let store; if (!request.result.objectStoreNames.contains(collection)) store = request.result.createObjectStore(collection, options); else store = request.transaction.objectStore(collection); if (!indexes) continue; for (const { name, keyPath, unique } of indexes) { if (store.indexNames.contains(name)) continue; store.createIndex(name, keyPath, { unique }); } } }); }); return this; } async transaction(collection, handler, mode = 'readonly') { if (!this.#db) await this.init(); return new Promise(async (resolve, reject) => { const transaction = this.#db.transaction(collection, mode); const store = transaction.objectStore(collection); const result = await handler(store); transaction.addEventListener('error', (e) => reject(e)); transaction.addEventListener('complete', () => resolve(result)); }); } async get(collection, key, index) { return this.#collections.get(collection).get(key, index); } async getAll(collection, key, count, index) { return this.#collections.get(collection).getAll(key, count, index); } async getAllKeys(collection, key, count, index) { return this.#collections.get(collection).getAllKeys(key, count, index); } async put(collection, data) { return this.#collections.get(collection).put(data); } async delete(collection, key) { return this.#collections.get(collection).delete(key); } async clear(collection) { return this.#collections.get(collection).clear(); } async clearAll() { for (const c of this.#collections.values()) await c.clear(); return true; } }
    /**merge**/
    /**merge:js=common/event.js**/
    class Event { static #listeners = new Map(); static on(event, listener) { if (!this.#listeners.has(event)) this.#listeners.set(event, new Set()); this.#listeners.get(event).add(listener); } static emit(event, ...args) { if (!this.#listeners.has(event)) return; for (const listener of this.#listeners.get(event).values()) listener(...args); } static off(event, listener) { if (!this.#listeners.has(event)) return; this.#listeners.get(event).delete(listener); } }
    /**merge**/
    addStyle(/**merge:css=bangumi_report.user.css**/`.btn { user-select: none; cursor: pointer; }.btn.primary { background: #fc899488; }.btn.primary:hover { background: #fc8994; }.btn.danger { background: #fc222288; }.btn.danger:hover { background: #fc2222; }.btn.success { background: #22fc2288; }.btn.success:hover { background: #22fc22; }.btn.warning { background: #fcb12288; }.btn.warning:hover { background: #fcb122; }#kotori-report-canvas::-webkit-scrollbar, #kotori-report .scroll::-webkit-scrollbar { display: none; }#kotori-report-menu::before {position: absolute;content: "菜单";padding: 0 20px;top: -1px;right: -1px;left: -1px;height: 30px;line-height: 30px;background: #fc8994;backdrop-filter: blur(4px);border-radius: 10px 10px 0 0;}#kotori-report-menu {color: #fff;position: fixed;display: flex;flex-direction: column;top: 50%;left: 50%;transform: translate(-50%, -50%);padding: 20px;padding-top: 50px;background: #0d111788;backdrop-filter: blur(4px);border-radius: 10px;box-shadow: 2px 2px 10px #00000088;border: 1px solid #fc899422;min-width: 150px;> li:first-child { margin-top: 0; }> li {margin-top: 10px;> .btn-group {display: flex;gap: 10px;> .btn {width: 100%;padding: 10px 0;text-align: center;border-radius: 5px;transition: all 0.3s;font-size: 16px;font-weight: bold;}> .btn:hover {width: 100%;padding: 10px 0;text-align: center;border-radius: 5px;transition: all 0.3s;}}}> li:last-child {height: 20px;}fieldset {display: flex;gap: 5px;min-inline-size: min-content;margin-inline: 1px;border-width: 1px;border-style: groove;border-color: threedface;border-image: initial;padding-block: 0.35em 0.625em;padding-inline: 0.75em;> div {display: flex;gap: 2px;justify-content: center;}}}#kotori-report {color: #fff;position: fixed;top: 0;left: 0;right: 0;bottom: 0;> .close {position: absolute;top: 0;right: 0;left: 0;bottom: 0;background: rgba(0,0,0,0.3);backdrop-filter: blur(2px);}> .save {position: absolute;top: 10px;right: 10px;width: 40px;height: 40px;background: #fc8994;border-radius: 40px;border: 4px solid #fc8994;cursor: pointer;box-shadow: 2px 2px 10px #00000088;user-select: none;line-height: 40px;background-size: 40px;background-image: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMzMwIDMzMCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTE2NSwwQzc0LjAxOSwwLDAsNzQuMDE4LDAsMTY1YzAsOTAuOTgsNzQuMDE5LDE2NSwxNjUsMTY1czE2NS03NC4wMiwxNjUtMTY1QzMzMCw3NC4wMTgsMjU1Ljk4MSwwLDE2NSwweiBNMTY1LDMwMGMtNzQuNDM5LDAtMTM1LTYwLjU2MS0xMzUtMTM1UzkwLjU2MSwzMCwxNjUsMzBzMTM1LDYwLjU2MSwxMzUsMTM1UzIzOS40MzksMzAwLDE2NSwzMDB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTIxMS42NjcsMTI3LjEyMWwtMzEuNjY5LDMxLjY2NlY3NWMwLTguMjg1LTYuNzE2LTE1LTE1LTE1Yy04LjI4NCwwLTE1LDYuNzE1LTE1LDE1djgzLjc4N2wtMzEuNjY1LTMxLjY2NmMtNS44NTctNS44NTctMTUuMzU1LTUuODU3LTIxLjIxMywwYy01Ljg1OCw1Ljg1OS01Ljg1OCwxNS4zNTUsMCwyMS4yMTNsNTcuMjcxLDU3LjI3MWMyLjkyOSwyLjkzLDYuNzY4LDQuMzk1LDEwLjYwNiw0LjM5NWMzLjgzOCwwLDcuNjc4LTEuNDY1LDEwLjYwNy00LjM5M2w1Ny4yNzUtNTcuMjcxYzUuODU3LTUuODU3LDUuODU4LTE1LjM1NSwwLjAwMS0yMS4yMTVDMjI3LjAyMSwxMjEuMjY0LDIxNy41MjQsMTIxLjI2NCwyMTEuNjY3LDEyNy4xMjF6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTE5NSwyNDBoLTYwYy04LjI4NCwwLTE1LDYuNzE1LTE1LDE1YzAsOC4yODMsNi43MTYsMTUsMTUsMTVoNjBjOC4yODQsMCwxNS02LjcxNywxNS0xNUMyMTAsMjQ2LjcxNSwyMDMuMjg0LDI0MCwxOTUsMjQweiIvPjwvc3ZnPg==);opacity: 0.8;z-index: 9999999999999;}> .scroll {position: absolute;top: 0;bottom: 0;left: 50%;transform: translateX(-50%);overflow: scroll;> .content {display: flex;flex-direction: column;gap: 5px;width: 1078px;margin: 0 auto;.banner {height: 110px;background: #fc899488;backdrop-filter: blur(2px);color: #fff;text-shadow: 0 0 5px #000;h1 {position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);font-size: 36px;line-height: 36px;text-align: center;}.uid {position: absolute;top: 5px;left: 5px;font-size: 20px;}ul.bars {position: absolute;display: flex;flex-direction: column;justify-content: space-evenly;> li {position: relative;justify-content: center;> div:last-child {position: absolute;width: 60px;top: 50%;transform: translateY(-50%);height: 3px;transition: all 0.3s;> div {position: absolute;top: 0;height: 100%;background: #fff;}}}}ul.lb {align-items: flex-end;> li {> div:first-child {text-align: left;padding-left: 65px;}> div:last-child {left: 0;> div { right: 0; }}}}ul.rb {align-items: flex-start;> li {> div:first-child {text-align: right;padding-right: 65px;}> div:last-child {right: 0;> div { left: 0; }}}}ul.total-time {font-family: consolas, 'courier new', monospace, courier;bottom: 0;left: 0;> li > div:first-child {width: 150px;}}ul.includes {top: 0;right: 0;> li > div:first-child {width: 80px;}}}ul.year-cover {display: flex;flex-direction: column;gap: 5px;> li {position: relative;> h2 {position: relative;padding: 2px;text-align: center;background: #fc899488;backdrop-filter: blur(2px);color: #fff;font-weight: bold;text-shadow: 0 0 4px #000;> span {position: absolute;top: 50%;right: 10px;transform: translateY(-50%);font-size: 14px;color: #ffde20;}}}> li:before {content: "";display: block;position: absolute;top: 0;right: 0;bottom: 0;left: 0;border: 1px solid #fc8994;box-sizing: border-box;}}> .bar-group {display: flex;justify-content: space-between;align-items: flex-end;ul.bars {display: flex;flex-direction: column;gap: 2px;position: relative;width: calc(50% - 1px);> li {display: block;position: relative;width: 100%;height: 20px;background: #0008;margin: 0;line-height: 20px;backdrop-filter: blur(2px);> span {position: absolute;left: 5px;text-shadow: 0 0 2px #000;}> span:nth-child(2) {position: absolute;left: 50%;transform: translateX(-50%);}> div {display: inline-block;height: 100%;background: #fc8994aa;margin: 0;}}}}ul.covers[type="music"] > li { height: 150px; }ul.covers {line-height: 0;> li {display: inline-block;position: relative;width: 150px;height: 220px;margin: 2px;overflow: hidden;border-width: 1px;border-style: solid;border-color: #fc8994;box-sizing: border-box;img {max-height: 100%;position: absolute;top: 0;left: 50%;transform: translateX(-50%);}> span {width: 50px;height: 30px;position: absolute;top: 0;left: 0;line-height: 30px;text-align: center;font-size: 18px;background: #8c49548c;backdrop-filter: blur(2px);}.star {display: block;position: absolute;bottom: 3px;right: 3px;width: 20px;height: 20px;padding: 5px;background: none;> img {opacity: 0.85;}> span {position: absolute;top: 50%;left: 50%;color: #f4a;font-family: consolas, 'courier new', monospace, courier;font-size: 18px;font-weight: bold;text-shadow: 0 0 2px #fff;transform: translate(-50%, -50%);}}}}}}}#kotori-report-canvas {color: #fff;position: fixed;top: 0;left: 0;right: 0;bottom: 0;background: rgba(0,0,0,0.3);backdrop-filter: blur(2px);overflow: scroll;padding: 30px;scrollbar-width: none;-ms-overflow-style: none;> div {position: absolute;top: 0;right: 0;left: 0;bottom: 0;background: rgba(0,0,0,0.3);backdrop-filter: blur(2px);}> canvas {position: absolute;top: 0;left: 50%;transform: translateX(-50%);}}@media screen and (min-width: 616px) { #kotori-report .content { width: 616px !important; } }@media screen and (min-width: 830px) { #kotori-report .content { width: 770px !important; } }@media screen and (min-width: 924px) { #kotori-report .content { width: 924px !important; } }@media screen and (min-width: 1138px) { #kotori-report .content { width: 1078px !important; } }`/**merge**/)

    const uid = /\/user\/(.+)?(\/.*)?/.exec(window.location.href)?.[1];
    const PRG = ['|', '/', '-', '\\'];
    const STAR_PATH = 'M60.556381,172.206 C60.1080307,172.639 59.9043306,173.263 60.0093306,173.875 L60.6865811,177.791 C60.8976313,179.01 59.9211306,180 58.8133798,180 C58.5214796,180 58.2201294,179.931 57.9282291,179.779 L54.3844766,177.93 C54.1072764,177.786 53.8038262,177.714 53.499326,177.714 C53.1958758,177.714 52.8924256,177.786 52.6152254,177.93 L49.0714729,179.779 C48.7795727,179.931 48.4782224,180 48.1863222,180 C47.0785715,180 46.1020708,179.01 46.3131209,177.791 L46.9903714,173.875 C47.0953715,173.263 46.8916713,172.639 46.443321,172.206 L43.575769,169.433 C42.4480682,168.342 43.0707186,166.441 44.6289197,166.216 L48.5916225,165.645 C49.211123,165.556 49.7466233,165.17 50.0227735,164.613 L51.7951748,161.051 C52.143775,160.35 52.8220755,160 53.499326,160 C54.1776265,160 54.855927,160.35 55.2045272,161.051 L56.9769285,164.613 C57.2530787,165.17 57.7885791,165.556 58.4080795,165.645 L62.3707823,166.216 C63.9289834,166.441 64.5516338,168.342 63.423933,169.433 L60.556381,172.206 Z';
    const STAR_SVG = `<svg fill="#ffde20" width="800px" height="800px" viewBox="43 159.5 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="${STAR_PATH}"></path></svg>`;
    const STAR_URL = URL.createObjectURL(new Blob([STAR_SVG], { type: 'image/svg+xml' }));

    const Types = {
        anime: { sort: 1, value: 'anime', name: '动画', action: '看', unit: '部' },
        game: { sort: 2, value: 'game', name: '游戏', action: '玩', unit: '部' },
        music: { sort: 3, value: 'music', name: '音乐', action: '听', unit: '张' },
        book: { sort: 4, value: 'book', name: '图书', action: '读', unit: '本' },
        real: { sort: 5, value: 'real', name: '三次元', action: '看', unit: '部' },
    }
    const SubTypes = {
        collect: { sort: 1, value: 'collect', name: '$过', checked: true },
        do: { sort: 2, value: 'do', name: '在$', checked: false },
        dropped: { sort: 3, value: 'dropped', name: '抛弃', checked: false },
        on_hold: { sort: 4, value: 'on_hold', name: '搁置', checked: false },
        wish: { sort: 5, value: 'wish', name: '想$', checked: false },
    };
    const AnimeTypeTimes = {
        WEB: 23 * 60 + 40,
        TV: 23 * 60 + 40,
        OVA: 45 * 60,
        OAD: 45 * 60,
        剧场版: 90 * 60,
    }

    function formatSubType(subType, type) {
        const action = Types[type].action;
        return SubTypes[subType].name.replace('$', action);
    }
    const db = new Database({
        dbName: 'VReport',
        version: 6,
        collections: [
            { collection: 'pages', options: { keyPath: 'url' }, indexes: [{ name: 'url', keyPath: 'url', unique: true }] },
            { collection: 'times', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }] }
        ]
    });

    function easeOut(curtime, begin, end, duration) {
        let x = curtime / duration;
        let y = -x * x + 2 * x;
        return begin + (end - begin) * y;
    }

    /**
     * @template T
     * @template U
     * @param {Iterable<T>} list 数据列表
     * @param {string|(item:T)=>U} group
     * @param {Map<U,T>} defaultMap
     * @returns {Map<U,T[]>}
     */
    function groupBy(list, group) {
        const groups = new Map();
        for (const item of list) {
            const key = typeof group == 'function' ? group(item) : item[group];
            if (groups.has(key)) groups.get(key).push(item);
            else groups.set(key, [item]);
        }
        return groups;
    }

    function countMap(length) {
        return new Map(new Array(length).fill(0).map((_, i) => [i, 0]));
    }

    /**
     * @template T
     * @template U
     * @param {Iterable<T>} list 数据列表
     * @param {string|(item:T)=>U} group
     * @param {Map<U,number>} defaultMap
     * @returns {Map<U,number>}
     */
    function groupCount(list, group, defaultMap) {
        const groups = defaultMap || new Map();
        for (const item of list) {
            const key = typeof group == 'function' ? group(item) : item[group];
            groups.set(key, (groups.get(key) || 0) + 1);
        }
        return groups;
    }

    // LOAD DATA START
    /**
     * 获取页面Element
     * @param {string} url 网址
    */
    async function f(url) {
        Event.emit('process', { type: 'fetch', data: { url } });
        const html = await fetch(window.location.origin + '/' + url).then(res => res.text());
        if (html.includes('503 Service Temporarily Unavailable')) return null;
        const e = create('html');
        e.innerHTML = html.replace(/<img (.*)\/?>/g, '<span class="img" $1></span>');
        return e;
    };

    /**
     * 获取页面数据
     * @typedef {{
     *  id: string
     *  name: string
     *  title: string
     *  jp_title: string
     *  img: string
     *  time: Date
     *  year: number
     *  month: number
     *  star: number
     *  tags: string[]
     *  subType: string
     * }} Item
     * @typedef {{
     *  url:string
     *  list: Item[]
     *  max: number
     *  time: number
     *  tags?: string[]
     * }} Result
     * @param {string} type 类型
     * @param {string} subType 子类
     * @param {number} p 页码
     * @param {number} expire 过期时间
     */
    async function fl(type, subType, p = 1, expire = 30) {
        Event.emit('process', { type: 'parse', data: { type, subType, p } });
        const url = `${type}/list/${uid}/${subType}?page=${p}`;
        /** @type {Result} */
        let data = await db.get('pages', url);
        if (data && data.time + expire * 60000 > Date.now()) return data;

        const e = await f(url);
        /** @type {Item[]} */
        const list = Array
            .from(e.querySelectorAll('#browserItemList > li'))
            .map(li => {
                const data = { subType };
                data.id = li.querySelector('a').href.split('/').pop();
                const title = li.querySelector('h3');
                data.title = title.querySelector('a').innerText;
                data.jp_title = title.querySelector('small')?.innerText;
                data.img = li.querySelector('span.img')
                    ?.getAttribute('src').replace('cover/c', 'cover/l')
                    || '//bgm.tv/img/no_icon_subject.png';
                data.time = new Date(li.querySelector('span.tip_j').innerText);
                data.year = data.time.getFullYear();
                data.month = data.time.getMonth();
                data.star = parseInt(li.querySelector('span.starlight')?.className.match(/stars(\d{1,2})/)[1]) || 0;
                data.tags = li.querySelector('span.tip')?.textContent.trim().match(/标签:\s*(.*)/)?.[1].split(/\s+/) || [];
                return data;
            });
        const edge = e.querySelector('span.p_edge');
        let max;
        if (edge) {
            max = Number(edge.textContent.match(/\/\s*(\d+)\s*\)/)?.[1] || 1);
        } else {
            const ap = e.querySelectorAll('a.p');
            if (ap.length == 0) {
                max = 1;
            } else {
                let cursor = ap[ap.length - 1];
                if (cursor.innerText == '››')
                    cursor = cursor.previousElementSibling;
                max = Number(cursor.textContent) || 1;
            }
        }
        const time = Date.now();
        data = { url, list, max, time };
        if (p == 1) {
            const tags = Array
                .from(e.querySelectorAll('#userTagList > li > a.l'))
                .map(l => l.childNodes[1].textContent);
            data.tags = tags;
        }
        await db.put('pages', data);
        return data;
    }

    /**
     * 根据类型获取tag列表
     * @param {string} type 类型
     */
    async function ft(type) {
        Event.emit('process', { type: 'tags', data: { type } });
        const { tags } = await fl(type, 'collect')
        return tags
    }

    // calc time
    function calcTime(s) {
        let m = /[时片]长:\s*(\d{2}):(\d{2}):(\d{2})/.exec(s);
        if (m) return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
        m = /[时片]长:\s*(\d{2}):(\d{2})/.exec(s);
        if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
        m = /[时片]长:\s*(\d+)\s*[m分]/.exec(s);
        if (m) return parseInt(m[1]) * 60;
        return 0;
    };

    async function ftime(id) {
        let data = await db.get('times', id);
        if (data) {
            if (data.time) return { type: 1, time: data.time, a: true };
            else return { time: data.eps * AnimeTypeTimes[data.type] || 0, a: false }
        }
        const e = await f(`subject/${id}/ep`);
        const c = l => Array.from(l).reduce((a, e) => a + calcTime(e.innerText), 0)
        let time = c(e.querySelectorAll('ul.line_list > li > small.grey'));
        if (time) {
            data = { id, time };
            await db.put('times', data);
            return { time, a: true };
        }
        const se = await f(`subject/${id}`);
        time = c(se.querySelectorAll('ul#infobox > li'));
        if (time) {
            data = { id, time };
            await db.put('times', data);
            return { time, a: true };
        }
        const type = se.querySelector('h1.nameSingle > small')?.textContent;
        const eps = e.querySelectorAll('ul.line_list > li > h6').length;

        data = { id, type, eps };
        await db.put('times', data);
        return { time: eps * AnimeTypeTimes[type] || 0, a: false }
    }

    /**
     * @param {Iterable<Item>} list
    */
    async function totalTime(list) {
        const total = {
            total: { name: '总计', time: 0, count: 0 },
            normal: { name: '精确', time: 0, count: 0 },
            guess: { name: '推测', time: 0, count: 0 },
            unknown: { name: '未知', time: 0, count: 0 },
        };
        Event.emit('process', { type: 'totalTime', data: { total: list.length } });
        for (const { id } of list) {
            Event.emit('process', { type: 'totalTimeItem', data: { id, count: total.total.count + 1 } });
            const { time, a } = await ftime(id);
            if (a) {
                total.normal.count++;
                total.normal.time += time;
            } else if (time) {
                total.guess.count++;
                total.guess.time += time;
            } else {
                total.unknown.count++;
            }
            total.total.count++;
            total.total.time += time;
        }
        return total;
    }

    /**
     * 二分搜索年份页面范围
     * 使用尽可能减少请求次数的算法
     * @param {string} type 类型
     * @param {string} subtype 子类
     * @param {string|number} year 年份
     */
    async function bsycs(type, subtype, year) {
        const { max } = await fl(type, subtype);
        let startL = 1;
        let startR = 1;
        let endL = max;
        let endR = max;
        let dL = false;
        let dR = false;

        while (startL <= endL && startR <= endR) {
            const mid = startL < endL
                ? Math.max(Math.min(Math.floor((startL + endL) / 2), endL), startL)
                : Math.max(Math.min(Math.floor((startR + endR) / 2), endR), startR)
            Event.emit('process', { type: 'bsycs', data: { type, subtype, p: mid } });
            const { list } = await fl(type, subtype, mid);
            if (list.length == 0) return [1, 1];
            const first = list[0].year;
            const last = list[list.length - 1].year;
            if (first > year && last < year) return [mid, mid];

            if (last > year) {
                if (!dL) startL = Math.min(mid + 1, endL);
                if (!dR) startR = Math.min(mid + 1, endR);
            } else if (first < year) {
                if (!dL) endL = Math.max(mid - 1, startL);
                if (!dR) endR = Math.max(mid - 1, startR);
            } else if (first == last) {
                if (!dL) endL = Math.max(mid - 1, startL);
                if (!dR) startR = Math.min(mid + 1, endR);
            } else if (first == year) {
                startR = endR = mid;
                if (!dL) endL = Math.min(mid + 1, endR);
            } else if (last == year) {
                startL = endL = mid;
                if (!dR) startR = Math.min(mid + 1, endR);
            }
            if (startL == endL) dL = true;
            if (startR == endR) dR = true;
            if (dL && dR) return [startL, startR];
        }
    }

    /**
     * 获取指定类型的数据列表
     * @param {string} type 类型
     * @param {string} subtype 子类
     * @param {string | number} year 年份 0为全部
     */
    async function cbt(type, subtype, year = 0) {
        if (!year) return cbtAll(type, subtype);
        return cbtYear(type, subtype, year);
    };

    /**
     * 获取指定类型与年份的数据列表
     * @param {string} type 类型
     * @param {string} subtype 子类
     * @param {string | number} year 年份
     */
    async function cbtYear(type, subtype, year) {
        const [start, end] = await bsycs(type, subtype, year);
        Event.emit('process', { type: 'collZone', data: { zone: [start, end] } });
        const ret = [];
        for (let i = start; i <= end; i++) {
            const { list } = await fl(type, subtype, i);
            ret.push(list);
        }
        return ret.flat();
    }

    /**
     * 获取指定类型的数据列表
     * @param {string} type 类型
     * @param {string} subtype 子类
     */
    async function cbtAll(type, subtype) {
        const { list, max } = await fl(type, subtype, 1);
        Event.emit('process', { type: 'collZone', data: { zone: [1, max] } });
        const ret = [list];
        for (let i = 2; i <= max; i++) {
            const { list } = await fl(type, subtype, i);
            ret.push(list);
        }
        return ret.flat();
    }

    /**
     * 根据参数获取数据列表
     * 根据 tag 过滤数据
     * 根据 time 进行排序
     * @param {{
     *  type: string
     *  subType: string
     *  tag?: string
     *  year?: string | number
     * }} param0
     */
    async function collects({ type, subTypes, tag, year }) {
        const ret = [];
        for (const subtype of subTypes) {
            Event.emit('process', { type: 'collSubtype', data: { subtype } });
            const list = await cbt(type, subtype, year);
            ret.push(list);
        }
        const fset = new Set();
        return ret.flat()
            .filter(({ id, year: y, tags }) => {
                if (year && year != y) return false;
                if (tag && !tags.includes(tag)) return false;
                if (fset.has(id)) return false;
                fset.add(id);
                return true;
            })
            .sort(({ time: a }, { time: b }) => b - a);
    }
    // LOAD DATA END

    // SAVE IMAGE START
    /**
     * 元素转为 canvas
     * @param {Element} element 元素
     * @param {Function} done 完成回调
     * @returns {Promise<void>}
     */
    async function element2Canvas(element, done) {
        await LoadScript.load('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
        const canvas = await html2canvas(element, { allowTaint: true, logging: false, backgroundColor: '#1c1c1c' })
        const close = create('div', { style: { height: canvas.style.height } });
        const main = create('div', { id: 'kotori-report-canvas' }, close, canvas);
        close.addEventListener('click', () => main.remove());
        document.body.appendChild(main);
        done();
    }
    // SAVE IMAGE END

    // REPORT START
    function pad02(n) { return n.toString().padStart(2, '0') }
    function timeFormat(time, day = false) {
        const s = time % 60;
        const m = (time - s) / 60 % 60;
        if (!day) {
            const h = (time - s - m * 60) / 3600;
            return `${h}:${pad02(m)}:${pad02(s)}`;
        }
        const h = (time - s - m * 60) / 3600 % 24;
        const d = (time - s - m * 60 - h * 3600) / 86400;
        if (d) return `${d}天${pad02(h)}:${pad02(m)}:${pad02(s)}`;
        return `${h}:${pad02(m)}:${pad02(s)}`;
    };

    function pw(v, m) {
        return { style: { width: v * 100 / m + '%' } }
    }

    /**
     * 生成题头时间统计
     * @param {Awaited<ReturnType<typeof totalTime>>} param0
     * @returns {AppendParams}
    */
    function buildTotalTime({ total, normal, guess, unknown }) {
        const list = [total, normal, guess, unknown].sort((a, b) => b.time - a.time)
        const format = ({ name, count, time }) => `${timeFormat(time, true)} (${count})${name}`
        const buildItem = (item) => ['li', ['div', format(item)], ['div', ['div', pw(item.time, total.time)]]];
        return ['ul', { class: ['total-time', 'bars', 'rb'] }, ...list.map(buildItem)]
    }
    /**
     * 生成题头统计数据
     * @param {Iterable<[any,number]>} list
     * @param {string} type 类型
     * @returns {AppendParams}
     */
    function buildIncludes(list, type) {
        list = Array.from(list).map(([k, v]) => [formatSubType(k, type), v]);
        const total = list.reduce((sum, [_, v]) => sum + v, 0)
        list.unshift(['总计', total])
        list.sort((a, b) => b[1] - a[1])
        const format = (k, v) => k + ':' + (('' + v).padStart(5, ' ')) + Types[type].unit
        const buildItem = ([k, v]) => ['li', ['div', format(k, v)], ['div', ['div', pw(v, total)]]];
        return ['ul', { class: ['includes', 'bars', 'lb'] }, ...list.map(buildItem)];
    }

    /**
     * 生成条形图
     * @param {Iterable<[number,string|number,number]>} list
     * @returns {AppendParams}
     */
    function buildBarList(list) {
        list = Array.from(list).sort(([, , a], [, , b]) => a - b);
        const m = Math.max(...list.map(([v]) => v));
        const buildItem = ([v, t]) => ['li', ['span', t], ['span', v], ['div', pw(v, m)]]
        return ['ul', { class: 'bars' }, ...list.map(buildItem)];
    }

    /**
     * 生成封面列表
     * @param {Iterable<Item>} list
     * @param {string} type 类型
     * @returns {AppendParams}
     */
    function buildCoverList(list, type) {
        let last = -1;
        const covers = [];
        for (const { img, month, star } of list) {
            const childs = [['img', { src: img }]];
            if (month != last) {
                childs.push(['span', month + 1 + '月']);
                last = month;
            }
            if (star)
                childs.push(['div', { class: 'star' }, ['img', { src: STAR_URL }], ['span', star]]);
            covers.push(['li', ...childs]);
        }
        return ['ul', { class: 'covers', type }, ...covers]
    }

    /**
     * 根据参数生成生涯总览
     * 根据 tag 过滤数据
     * @param {{
     *  type: string
     *  subType: string
     *  tag?: string
     * }} param0
     */
    async function buildLifeTimeReport({ type, tag, subTypes, totalTime: ttt }) {
        const list = await collects({ type, subTypes, tag });
        const time = ttt ? await totalTime(list) : null;

        const buildYearCover = ([year, l]) => ['li', ['h2', year + '年', ['span', l.length]], buildCoverList(l, type)];
        const banner = ['div', { class: 'banner' },
            ['h1', `Bangumi ${Types[type].name}生涯总览`],
            ['span', { class: 'uid' }, '@' + uid],
            buildIncludes(groupCount(list, 'subType').entries(), type)
        ];
        if (time) banner.push(buildTotalTime(time));
        const countList = buildBarList(groupCount(list, 'month', countMap(12)).entries().map(([k, v]) => [v, k + 1 + '月', k]));
        const starList = buildBarList(groupCount(list, 'star', countMap(11)).entries().map(([k, v]) => [v, k ? k + '星' : '未评分', k]));
        const barGroup = ['div', { class: 'bar-group' }, countList, starList];
        const yearCover = ['ul', { class: 'year-cover' }, ...groupBy(list, 'year').entries().map(buildYearCover)];

        return create('div', { class: 'content' }, banner, barGroup, yearCover);
    }

    /**
     * 根据参数生成年鉴
     * 根据 tag 过滤数据
     * @param {{
     *  year: string | number
     *  type: string
     *  subType: string
     *  tag?: string
     * }} param0
     */
    async function buildYearReport({ year, type, tag, subTypes, totalTime: ttt }) {
        const list = await collects({ type, subTypes, tag, year });
        const time = ttt ? await totalTime(list) : null;

        const banner = ['div', { class: 'banner' },
            ['h1', `${year}年 Bangumi ${Types[type].name}年鉴`],
            ['span', { class: 'uid' }, '@' + uid],
            buildIncludes(groupCount(list, 'subType').entries(), type)
        ];
        if (time) banner.push(buildTotalTime(time));
        const countList = buildBarList(groupCount(list, 'month', countMap(12)).entries().map(([k, v]) => [v, k + 1 + '月', k]));
        const starList = buildBarList(groupCount(list, 'star', countMap(11)).entries().map(([k, v]) => [v, k ? k + '星' : '未评分', k]));
        const barGroup = ['div', { class: 'bar-group' }, countList, starList];

        return create('div', { class: 'content' }, banner, barGroup, buildCoverList(list, type));
    }

    /**
     * 根据参数生成报告
     * 根据 tag 过滤数据
     * isLifeTime 为 true 时生成生涯报告否则生成年鉴
     * @param {{
     *  isLifeTime: false
     *  year: string | number
     *  type: string
     *  subType: string
     *  tag?: string
     * } | {
     *  isLifeTime: true
     *  type: string
     *  subType: string
     *  tag?: string
     * }} options
     * @returns {Promise<void>}
     */
    async function buildReport(options) {
        Event.emit('process', { type: 'start', data: options });
        const content = await (options.isLifeTime ? buildLifeTimeReport(options) : buildYearReport(options));
        Event.emit('process', { type: 'done' });
        const close = create('div', { class: 'close' });
        const scroll = create('div', { class: 'scroll' }, content);
        const save = create('div', { class: 'save' });
        const report = create('div', { id: 'kotori-report' }, close, scroll, save);

        const saveFn = () => {
            save.onclick = null;
            element2Canvas(content, () => save.onclick = saveFn)
        };
        let ly = scroll.scrollTop || 0;
        let my = ly;
        let ey = ly;
        let interval = null;
        const scrollFn = (iey) => {
            ey = Math.max(Math.min(iey, scroll.scrollHeight - scroll.offsetHeight), 0);
            ly = my;
            if (interval) clearInterval(interval);
            let times = 1;
            interval = setInterval(() => {
                if (times > 50) {
                    clearInterval(interval);
                    interval = null;
                    return;
                }
                my = easeOut(times, ly, ey, 50);
                scroll.scroll({ top: my })
                times++;
            }, 1)
        };
        const wheelFn = e => {
            e.preventDefault();
            scrollFn(ey + e.deltaY);
        }
        const keydownFn = e => {
            e.preventDefault();
            if (e.key == 'Escape') close.click();
            if (e.key == 'Home') scrollFn(0);
            if (e.key == 'End') scrollFn(scroll.scrollHeight - scroll.offsetHeight);
            if (e.key == 'ArrowUp') scrollFn(ey - 100);
            if (e.key == 'ArrowDown') scrollFn(ey + 100);
            if (e.key == 'PageUp') scrollFn(ey - scroll.offsetHeight);
            if (e.key == 'PageDown') scrollFn(ey + scroll.offsetHeight);
        };
        scroll.addEventListener('wheel', wheelFn);
        close.addEventListener('wheel', wheelFn)
        save.addEventListener('wheel', wheelFn)
        document.addEventListener('keydown', keydownFn);
        save.addEventListener('click', saveFn);
        close.addEventListener('click', () => {
            document.removeEventListener('keydown', keydownFn);
            report.remove()
        });
        document.body.appendChild(report);
    }
    // REPORT END

    // MENU START
    /**
     * 生成菜单
     */
    function buildMenu() {
        const year = new Date().getFullYear();

        const buildSubTypeCheck = ([_, { value, name, checked }]) => ['div', { value },
            ['input', { type: 'checkbox', id: 'yst_' + value, name, value, checked }],
            ['label', { for: 'yst_' + value }, name]
        ];
        const lifeTimeCheck = create('input', { type: 'checkbox', id: 'lftc' });
        const totalTimeCheck = create('input', { type: 'checkbox', id: 'tltc' });
        const yearSelect = create('select', ...new Array(year - 2007).fill(0).map((_, i) => ['option', { value: year - i }, year - i]));
        const typeSelect = create('select', ...Object.entries(Types).map(([_, { value, name }]) => ['option', { value }, name]));
        const tagSelect = create('select', ['option', { value: '' }, '不筛选']);
        const btnGo = create('div', { class: ['btn', 'primary'] }, '生成');
        const btnClr = create('div', { class: ['btn', 'warning'] }, '清理缓存');
        const btnGroup = ['div', { class: 'btn-group' }, btnGo, btnClr];
        const additionField = ['fieldset', ['legend', '附加选项'], ['div', lifeTimeCheck, ['label', { for: 'lftc' }, '生涯报告']], ['div', totalTimeCheck, ['label', { for: 'tltc' }, '看过时长(耗时)']]];
        const ytField = ['fieldset', ['legend', '选择年份与类型'], yearSelect, typeSelect];
        const tagField = ['fieldset', ['legend', '选择过滤标签'], tagSelect];
        const subtypeField = create('fieldset', ['legend', '选择包括的状态'], ...Object.entries(SubTypes).map(buildSubTypeCheck))
        const eventInfo = create('li')
        const menu = create('ul', { id: 'kotori-report-menu' }, ['li', additionField], ['li', ytField], ['li', tagField], ['li', subtypeField], ['li', btnGroup], eventInfo);

        Event.on('process', (() => {
            let type;
            let zone = [0, 0];
            let subtype;
            let subtypes;
            let pz = false;
            let totalTimeCount = 0;

            return ({ type: t, data }) => {
                switch (t) {
                    case 'start':
                        type = data.type;
                        subtypes = data.subTypes;
                        eventInfo.innerText = '';
                        pz = false;
                        break;
                    case 'collSubtype':
                        subtype = data.subtype;
                        pz = false;
                        break;
                    case 'bsycs':
                        eventInfo.innerText = `二分搜索[${formatSubType(subtype, type)}] (${data.p})`;
                        break;
                    case 'collZone':
                        zone = data.zone;
                        pz = true;
                        break;
                    case 'parse':
                        if (!pz) return;
                        eventInfo.innerText = `正在解析[${formatSubType(subtype, type)}] (`
                            + (data.p - zone[0] + 1) + '/' + (zone[1] - zone[0] + 1) + ')('
                            + (subtypes.indexOf(subtype) + 1) + '/' + subtypes.length + ')'
                        break;
                    case 'done':
                        eventInfo.innerText = '';
                        pz = false;
                        break;
                    case 'tags':
                        eventInfo.innerText = `获取标签 [${Types[data.type].name}]`;
                        break;
                    case 'totalTime':
                        totalTimeCount = data.total;
                        break;
                    case 'totalTimeItem':
                        eventInfo.innerText = `获取条目时长 (${data.count}/${totalTimeCount}) (id: ${data.id})`;
                        break;
                    default:
                        return;
                }
            }
        })());

        lifeTimeCheck.addEventListener('change', () => {
            if (lifeTimeCheck.checked) yearSelect.disabled = true;
            else yearSelect.disabled = false;
        })
        typeSelect.addEventListener('change', callNow(async () => {
            const type = typeSelect.value;
            if (!type) return;
            totalTimeCheck.disabled = type !== 'anime';
            subtypeField.querySelectorAll('div').forEach(e => {
                const name = formatSubType(e.getAttribute('value'), type);
                e.querySelector('input').setAttribute('name', name);
                e.querySelector('label').innerText = name;
            });
            const tags = await ft(type);
            if (type != typeSelect.value) return;
            const last = tagSelect.value;
            removeAllChildren(tagSelect);
            tagSelect.append(create('option', { value: '' }, '不筛选'));
            append(tagSelect, ...tags.map(t => ['option', { value: t }, t]));
            if (tags.includes(last)) tagSelect.value = last;
        }));
        btnGo.addEventListener('click', callWhenDone(async () => {
            const type = typeSelect.value || 'anime';
            await buildReport({
                type,
                subTypes: Array.from(subtypeField.querySelectorAll('input:checked')).map(e => e.value),
                isLifeTime: lifeTimeCheck.checked,
                totalTime: type === 'anime' && totalTimeCheck.checked,
                year: parseInt(yearSelect.value) || year,
                tag: tagSelect.value,
            });
            menuToggle();
        }));
        btnClr.addEventListener('click', callWhenDone(async () => {
            let i = 0;
            const id = setInterval(() => btnClr.innerText = `清理缓存中[${PRG[i++ % 4]}]`, 50);
            await db.clear('pages');
            clearInterval(id);
            btnClr.innerText = '清理缓存';
        }))

        document.body.appendChild(menu);
        return menu;
    }

    let menu = null;
    /**
     * 切换菜单显隐
     */
    function menuToggle() {
        if (!menu) menu = buildMenu();
        menu.style.display = menu.style.display == 'block' ? 'none' : 'block';
    }
    // MENU END
    (async () => {
        await db.init();
        const btn = create('a', { class: 'chiiBtn', href: 'javascript:void(0)', title: '生成年鉴' }, ['span', '生成年鉴']);
        btn.addEventListener('click', menuToggle);
        document.querySelector('#headerProfile .actions').append(btn);
    })();
})();