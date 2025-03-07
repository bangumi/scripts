// ==UserScript==
// @name         Bangumi 社区助手 preview
// @version      0.1.11
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
    /**merge:js=common/dom.utils.js**/
    async function waitElement(parent, id, timeout = 1000) { return new Promise((resolve) => { let isDone = false; const done = (fn) => { if (isDone) return; isDone = true; fn(); }; const observer = new MutationObserver((mutations) => { for (const mutation of mutations) { for (const node of mutation.addedNodes) { if (node.id == id) { done(() => { observer.disconnect(); resolve(node); }); return; } } } }); observer.observe(parent, { childList: true, subtree: true }); const node = parent.querySelector('#' + id); if (node) return done(() => { observer.disconnect(); resolve(node); }); setTimeout(() => done(() => { observer.disconnect(); resolve(parent.querySelector('#' + id)); }), timeout); }); }
    function observeChildren(element, callback) { new MutationObserver((mutations) => { for (const mutation of mutations) for (const node of mutation.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) callback(node); }).observe(element, { childList: true }); for (const child of Array.from(element.children)) callback(child); }
    function observerEach(Observer, callback, options) { return new Observer((entries) => entries.forEach(callback), options); }
    /**merge**/
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
    /**merge:js=common/router.js**/
    class Router { #root = { part: { raw: '', enum: new Set(['']) }, child: [] }; #parsePart(raw) { raw = raw.trim(); const part = { raw }; if (raw.at(-1) == ')' && raw.includes('(')) { const split = raw.split('('); raw = split[0]; const enums = split[1].replace(')', '').split('|'); part.enum = new Set(enums.map((s) => s.trim())); } switch (raw[0]) { case ':': part.key = raw.slice(1); case '*': break; default: if (raw) part.enum = new Set([raw]); } return part; } #find({ child }, part) { for (const layer of child) if (layer.part.raw === part) return layer; return null; } #deep(layer, parts) { for (const part of parts) { const findLayer = this.#find(layer, part); if (!findLayer) { const newLayer = { part: this.#parsePart(part), child: [] }; layer.child.push(newLayer); layer = newLayer; } else { layer = findLayer; } } return layer; } #useSingle(layer, pattern, children, handler, fallback) { const parts = pattern.trim().split('/'); if (parts.at(0) === '') parts.shift(); if (parts.at(-1) === '') parts.pop(); const child = this.#deep(layer, parts); child.handler = handler; child.fallback = fallback; if (!children) return; for (const options of children) this.#use(child, options); } #use(layer, { pattern, handler, children, fallback }) { for (const p of [pattern].flat()) this.#useSingle(layer, p, children, handler, fallback); } use(options) { this.#use(this.#root, options); return this; } #deepMatch(layer, [path, ...paths], params = {}, [...pattern] = []) { const { part, child, handler, fallback } = layer; pattern.push(part.raw); if (part.enum && !part.enum.has(path)) return null; if (part.key) params[part.key] = path; if (paths.length) { for (const c of child) { const match = this.#deepMatch(c, paths, params, pattern); if (match) return match; } if (!fallback) return null; } if (!handler) return null; return { handler, params, pattern: pattern.join('/') || '/' }; } #match(path) { const parts = path.trim().split('/'); if (parts.at(-1) == '') parts.pop(); if (parts.at(0) !== '') parts.unshift(''); return this.#deepMatch(this.#root, parts); } active(path) { const match = this.#match(path); if (!match) return null; const { handler, params, pattern } = match; return handler(params, path, pattern); } }
    /**merge**/
    /**merge:js=common/svgicon.js**/
    class SvgIcon { static #base(size=14, viewBox="0 0 16 16") { return { viewBox, fill: 'currentColor', width: size, height: size }; } static #hfws(size, viewBox) { return { ...this.#base(size, viewBox), stroke: 'currentColor', "stroke-width": 1, "stroke-linecap": "round", "stroke-linejoin": "round" }; } static #nfws(size, viewBox) { return { ...this.#hfws(size, viewBox), fill: "none", "stroke-width": 2 }; } static collapse(size) {   return ["svg", this.#base(size), ["path", { d: "M10.896 2H8.75V.75a.75.75 0 0 0-1.5 0V2H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0l2.896-2.896A.25.25 0 0 0 10.896 2ZM8.75 15.25a.75.75 0 0 1-1.5 0V14H5.104a.25.25 0 0 1-.177-.427l2.896-2.896a.25.25 0 0 1 .354 0l2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25Zm-6.5-6.5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z" }]];} static expand(size) {     return ["svg", this.#base(size), ["path", { d: "m8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z" }]];} static logout(size) {     return ["svg", this.#base(size), ["path", { d: "M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z" }]];} static setting(size) {    return ["svg", this.#base(size), ["path", { d: "M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z" }]];} static message(size) {    return ["svg", this.#base(size), ["path", { d: "M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z" }]];} static light(size) {      return ["svg", this.#base(size), ["path", { d: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" }]];} static notify(size) {     return ["svg", this.#base(size), ["path", { d: "M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" }]];} static info(size) {       return ["svg", this.#base(size), ["path", { d: "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" }]];} static unnotify(size) {   return ["svg", this.#base(size), ["path", { d: "m4.182 4.31.016.011 10.104 7.316.013.01 1.375.996a.75.75 0 1 1-.88 1.214L13.626 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947V5.305L.31 3.357a.75.75 0 1 1 .88-1.214Zm7.373 7.19L4.5 6.391v1.556c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01c0 .005.002.009.005.012l.006.004.007.001ZM8 1.5c-.997 0-1.895.416-2.534 1.086A.75.75 0 1 1 4.38 1.55 5 5 0 0 1 13 5v2.373a.75.75 0 0 1-1.5 0V5A3.5 3.5 0 0 0 8 1.5ZM8 16a2 2 0 0 1-1.985-1.75c-.017-.137.097-.25.235-.25h3.5c.138 0 .252.113.235.25A2 2 0 0 1 8 16Z" }]];} static robot(size) {      return ["svg", this.#base(size), ["path", { d: "M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" }], ["path", { d: "M6.25 0h2A.75.75 0 0 1 9 .75V3.5h3.25a2.25 2.25 0 0 1 2.25 2.25V8h.75a.75.75 0 0 1 0 1.5h-.75v2.75a2.25 2.25 0 0 1-2.25 2.25h-8.5a2.25 2.25 0 0 1-2.25-2.25V9.5H.75a.75.75 0 0 1 0-1.5h.75V5.75A2.25 2.25 0 0 1 3.75 3.5H7.5v-2H6.25a.75.75 0 0 1 0-1.5ZM3 5.75v6.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75Z" }]];} static tag(size) {        return ["svg", this.#base(size), ["path", { d: "M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" }]];} static edit(size) {       return ["svg", this.#base(size), ["path", { d: "M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" }]];} static link(size) {       return ["svg", this.#base(size), ["path", { d: "m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z" }]];} static star(size) {       return ["svg", this.#base(size), ["path", { d: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z" }]];} static clock(size) {      return ["svg", this.#base(size), ["path", { d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" }]];} static edit(size) {       return ["svg", this.#base(size), ["path", { d: "M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" }]];} static history(size) {    return ["svg", this.#base(size), ["path", { d: "m.427 1.927 1.215 1.215a8.002 8.002 0 1 1-1.6 5.685.75.75 0 1 1 1.493-.154 6.5 6.5 0 1 0 1.18-4.458l1.358 1.358A.25.25 0 0 1 3.896 6H.25A.25.25 0 0 1 0 5.75V2.104a.25.25 0 0 1 .427-.177ZM7.75 4a.75.75 0 0 1 .75.75v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5A.75.75 0 0 1 7.75 4Z" }]];} static detail(size) {     return ["svg", this.#base(size), ["path", { d: "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L10.69 8 9.22 6.53a.75.75 0 0 1 0-1.06ZM6.78 6.53 5.31 8l1.47 1.47a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-2-2a.75.75 0 0 1 0-1.06l2-2a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" }]];} static note(size) {       return ["svg", this.#base(size), ["path", { d: "M5 8.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 5 8.25ZM4 10.5A.75.75 0 0 0 4 12h4a.75.75 0 0 0 0-1.5H4Z" }], ["path", { d: "M13-.005c1.654 0 3 1.328 3 3 0 .982-.338 1.933-.783 2.818-.443.879-1.028 1.758-1.582 2.588l-.011.017c-.568.853-1.104 1.659-1.501 2.446-.398.789-.623 1.494-.623 2.136a1.5 1.5 0 1 0 2.333-1.248.75.75 0 0 1 .834-1.246A3 3 0 0 1 13 16H3a3 3 0 0 1-3-3c0-1.582.891-3.135 1.777-4.506.209-.322.418-.637.623-.946.473-.709.923-1.386 1.287-2.048H2.51c-.576 0-1.381-.133-1.907-.783A2.68 2.68 0 0 1 0 2.995a3 3 0 0 1 3-3Zm0 1.5a1.5 1.5 0 0 0-1.5 1.5c0 .476.223.834.667 1.132A.75.75 0 0 1 11.75 5.5H5.368c-.467 1.003-1.141 2.015-1.773 2.963-.192.289-.381.571-.558.845C2.13 10.711 1.5 11.916 1.5 13A1.5 1.5 0 0 0 3 14.5h7.401A2.989 2.989 0 0 1 10 13c0-.979.338-1.928.784-2.812.441-.874 1.023-1.748 1.575-2.576l.017-.026c.568-.853 1.103-1.658 1.501-2.448.398-.79.623-1.497.623-2.143 0-.838-.669-1.5-1.5-1.5Zm-10 0a1.5 1.5 0 0 0-1.5 1.5c0 .321.1.569.27.778.097.12.325.227.74.227h7.674A2.737 2.737 0 0 1 10 2.995c0-.546.146-1.059.401-1.5Z" }]];} static user(size) {       return ["svg", this.#base(size), ["path", { d: "M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" }]];} static mark(size) {       return ["svg", this.#base(size), ["path", { d: "M3 2.75C3 1.784 3.784 1 4.75 1h6.5c.966 0 1.75.784 1.75 1.75v11.5a.75.75 0 0 1-1.227.579L8 11.722l-3.773 3.107A.751.751 0 0 1 3 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.91l3.023-2.489a.75.75 0 0 1 .954 0l3.023 2.49V2.75a.25.25 0 0 0-.25-.25Z" }]];} static disconnect(size) { return ["svg", this.#base(size,"0 0 32 32"), ["path", { d: "M29.323,28.000 L31.610,30.293 C31.999,30.684 31.999,31.316 31.610,31.707 C31.415,31.902 31.160,32.000 30.905,32.000 C30.649,32.000 30.394,31.902 30.200,31.707 L27.913,29.414 L25.627,31.707 C25.432,31.902 25.177,32.000 24.922,32.000 C24.667,32.000 24.412,31.902 24.217,31.707 C23.827,31.316 23.827,30.684 24.217,30.293 L26.503,28.000 L24.217,25.707 C23.827,25.316 23.827,24.684 24.217,24.293 C24.606,23.902 25.237,23.902 25.627,24.293 L27.913,26.586 L30.200,24.293 C30.589,23.902 31.220,23.902 31.610,24.293 C31.999,24.684 31.999,25.316 31.610,25.707 L29.323,28.000 ZM21.638,22.294 C22.028,22.684 22.028,23.317 21.638,23.707 C21.249,24.097 20.618,24.098 20.228,23.706 L19.231,22.706 C19.031,22.505 18.925,22.229 18.940,21.947 C18.956,21.664 19.089,21.400 19.308,21.222 C22.876,18.321 23.000,13.053 23.000,13.000 L23.000,7.000 C22.444,4.024 18.877,2.035 16.019,2.001 L15.948,2.003 C13.076,2.003 9.529,4.087 8.968,7.087 L8.964,12.994 C8.964,13.045 9.019,18.324 12.587,21.225 C12.845,21.435 12.982,21.761 12.952,22.093 C12.922,22.425 12.728,22.720 12.436,22.880 L1.988,28.594 L1.988,30.000 L20.933,30.000 C21.484,30.000 21.930,30.448 21.930,31.000 C21.930,31.552 21.484,32.000 20.933,32.000 L1.988,32.000 C0.888,32.000 -0.007,31.103 -0.007,30.000 L-0.007,28.000 C-0.007,27.634 0.193,27.297 0.513,27.122 L10.274,21.785 C7.005,18.239 7.000,13.232 7.000,13.000 L7.000,7.000 L6.987,6.832 C7.672,2.777 12.112,0.043 15.865,0.003 L15.948,-0.000 C19.718,-0.000 24.219,2.744 24.908,6.829 L24.922,6.996 L24.926,12.990 C24.926,13.227 24.888,18.479 21.380,22.034 L21.638,22.294 Z" }]];} static connect(size) {    return ["svg", this.#base(size,"0 0 32 32"), ["path", { d: "M2.002 27.959c0-0.795 0.597-1.044 0.835-1.154l8.783-4.145c0.63-0.289 1.064-0.885 1.149-1.573s-0.193-1.37-0.733-1.803c-2.078-1.668-3.046-5.334-3.046-7.287v-4.997c0-2.090 3.638-4.995 7.004-4.995 3.396 0 6.997 2.861 6.997 4.995v4.998c0 1.924-0.8 5.604-2.945 7.292-0.547 0.43-0.831 1.115-0.749 1.807 0.082 0.692 0.518 1.291 1.151 1.582l2.997 1.422 0.494-1.996-2.657-1.243c2.771-2.18 3.708-6.463 3.708-8.864v-4.997c0-3.31-4.582-6.995-8.998-6.995s-9.004 3.686-9.004 6.995v4.997c0 2.184 0.997 6.602 3.793 8.846l-8.783 4.145s-1.998 0.89-1.998 1.999v3.001c0 1.105 0.895 1.999 1.998 1.999h21.997v-2l-21.996 0.001v-2.029zM30.998 25.996h-3v-3c0-0.552-0.448-1-1-1s-1 0.448-1 1v3h-3c-0.552 0-1 0.448-1 1s0.448 1 1 1h3v3c0 0.552 0.448 1 1 1s1-0.448 1-1v-3h3c0.552 0 1-0.448 1-1s-0.448-1-1-1z" }]];} static ok(size) {         return ["svg", this.#base(size,"3 3 18 18"), ["path", { d: "M19.3,5.3L9,15.6l-4.3-4.3l-1.4,1.4l5,5L9,18.4l0.7-0.7l11-11L19.3,5.3z" }]];} static close(size) {      return ["svg", this.#base(size,"4 4 16 16"), ["path", { d: "M5.6,4.2L4.2,5.6l6.4,6.4l-6.4,6.4l1.4,1.4l6.4-6.4l6.4,6.4l1.4-1.4L13.4,12l6.4-6.4l-1.4-1.4L12,10.6L5.6,4.2z" }]];} static block(size) {      return ["svg", this.#nfws(size,"1 1 22 22"), ["path", { d: "M5.63605 5.63603L18.364 18.364M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" }]];} static refresh(size) {    return ["svg", this.#nfws(size,"1 1 22 22"), ["path", { d: "M3 3V8M3 8H8M3 8L6 5.29168C7.59227 3.86656 9.69494 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.71683 21 4.13247 18.008 3.22302 14" }]];} static home(size) {       return ["svg", this.#hfws(size,"-1 -1 34 34"), ["path", { d: "M31.772 16.043l-15.012-15.724c-0.189-0.197-0.449-0.307-0.721-0.307s-0.533 0.111-0.722 0.307l-15.089 15.724c-0.383 0.398-0.369 1.031 0.029 1.414 0.399 0.382 1.031 0.371 1.414-0.029l1.344-1.401v14.963c0 0.552 0.448 1 1 1h6.986c0.551 0 0.998-0.445 1-0.997l0.031-9.989h7.969v9.986c0 0.552 0.448 1 1 1h6.983c0.552 0 1-0.448 1-1v-14.968l1.343 1.407c0.197 0.204 0.459 0.308 0.722 0.308 0.249 0 0.499-0.092 0.692-0.279 0.398-0.382 0.411-1.015 0.029-1.413zM26.985 14.213v15.776h-4.983v-9.986c0-0.552-0.448-1-1-1h-9.965c-0.551 0-0.998 0.445-1 0.997l-0.031 9.989h-4.989v-15.777c0-0.082-0.013-0.162-0.032-0.239l11.055-11.52 10.982 11.507c-0.021 0.081-0.036 0.165-0.036 0.252z" }]];} }
    /**merge**/
    /**merge:js=common/bangumi.js**/
    function whoami() { let nid; try { nid = window.CHOBITS_UID ?? window.parent.CHOBITS_UID ?? CHOBITS_UID ?? 0; } catch (e) { nid = 0; } const dockA = window.parent.document.querySelector('#dock li.first a'); if (dockA) { const id = dockA.href.split('/').pop(); return { id, nid }; } const bannerAvatar = window.parent.document.querySelector('.idBadgerNeue> .avatar'); if (bannerAvatar) { const id = bannerAvatar.href.split('/').pop(); return { id, nid }; } return null; }
    /**merge**/
    addStyle(
        /**merge:css=bangumi_community.user.keyframes.css**/`@keyframes loading-spine {to{transform: rotate(.5turn)}}`/**merge**/,
        /**merge:css=bangumi_community.user.colors.light.css**/`html {--color-base: #ffffff;--color-base-2: #e8e8e8;--color-base-bg: #eaeffba0;--color-base-font: #282828;--color-gray-1: #e8e8e8;--color-gray-2: #cccccc;--color-gray-3: #aaaaaa;--color-gray-4: #969696;--color-gray-11: #cccccc;--color-bangumi-2: #AB515D;--color-bangumi-font: rgb(from var(--color-bangumi) calc(r - 50) calc(g - 50) calc(b - 50));--color-yellow-font: rgb(from var(--color-yellow) calc(r - 50) calc(g - 50) calc(b - 50));--color-purple-font: rgb(from var(--color-purple) calc(r - 50) calc(g - 50) calc(b - 50));--color-blue-font: rgb(from var(--color-blue) calc(r - 50) calc(g - 50) calc(b - 50));--color-green-font: rgb(from var(--color-green) calc(r - 50) calc(g - 50) calc(b - 50));--color-red-font: rgb(from var(--color-red) calc(r - 50) calc(g - 50) calc(b - 50));}`/**merge**/,
        /**merge:css=bangumi_community.user.colors.dark.css**/`html[data-theme='dark'] {--color-base: #000000;--color-base-2: #1f1f1f;--color-base-bg: #23262ba0;--color-base-font: #e8e8e8;--color-gray-1: #444444;--color-gray-2: #555555;--color-gray-3: #6a6a6a;--color-gray-4: #888888;--color-gray-11: #cccccc;--color-bangumi-2: #ffb6bd;--color-bangumi-font: rgb(from var(--color-bangumi) calc(r + 50) calc(g + 50) calc(b + 50));--color-yellow-font: rgb(from var(--color-yellow) calc(r + 50) calc(g + 50) calc(b + 50));--color-purple-font: rgb(from var(--color-purple) calc(r + 50) calc(g + 50) calc(b + 50));--color-blue-font: rgb(from var(--color-blue) calc(r + 50) calc(g + 50) calc(b + 50));--color-green-font: rgb(from var(--color-green) calc(r + 50) calc(g + 50) calc(b + 50));--color-red-font: rgb(from var(--color-red) calc(r + 50) calc(g + 50) calc(b + 50));}`/**merge**/,
        /**merge:css=bangumi_community.user.colors.css**/`html {--color-bangumi: #fd8a96;--color-white: #ffffff;--color-black: #000000;--color-yellow: #f9c74c;--color-purple: #a54cf9;--color-blue: #02a3fb;--color-green: #95eb89;--color-red: #f94144;--color-skyblue: #7ed2ff;--color-dock-sp: var(--color-gray-2);--color-switch-border: var(--color-gray-2);--color-switch-on: var(--color-green);--color-switch-off: var(--color-gray-4);--color-switch-bar-border: var(--color-white);--color-switch-bar-inner: var(--color-gray-11);--color-hover: var(--color-blue);--color-icon-btn-bg: rgb(from var(--color-bangumi) r g b / .25);--color-icon-btn-color: var(--color-white);--color-reply-sp: var(--color-gray-1);--color-reply-tips: var(--color-gray-3);--color-reply-normal: var(--color-bangumi);--color-reply-owner: var(--color-yellow);--color-reply-floor: var(--color-purple);--color-reply-friend: var(--color-green);--color-reply-self: var(--color-blue);--color-sicky-bg: rgb(from var(--color-base) r g b / .125);--color-sicky-border: rgb(from var(--color-bangumi) r g b / .25);--color-sicky-shadow: rgb(from var(--color-base) r g b / .05);--color-sicky-textarea: rgb(from var(--color-base) r g b / .8);--color-sicky-hover-bg: rgb(from var(--color-bangumi) r g b / .125);--color-sicky-hover-border: var(--color-bangumi);--color-sicky-hover-shadow: var(--color-bangumi);--color-primary: var(--color-bangumi);--color-secondary: var(--color-blue);--color-success: var(--color-green);--color-info: var(--color-blue);--color-important: var(--color-purple);--color-warning: var(--color-yellow);--color-danger: var(--color-red);}`/**merge**/,
        /**merge:css=bangumi_community.user.1.css**/`html, html[data-theme='dark'] {#dock {li {position: relative;height: 18px;display: flex;align-items: center;justify-content: center;}li:not(:last-child) {border-right: 1px solid var(--color-dock-sp);}}.columns {> #columnInSubjectB {> * { margin: 0; }display: flex;gap: 10px;flex-direction: column;position: sticky;top: 0;align-self: flex-start;max-height: 100vh;overflow-y: auto;}}*:has(>#comment_list) {.postTopic {border-bottom: none;.inner.tips {display: flex;height: 40px;align-items: center;gap: 8px;color: var(--color-reply-tips);}}.avatar:not(.tinyCover) {img,.avatarNeue {border-radius: 50% !important;}}.clearit:not(.message) {transition: all 0.3s ease;box-sizing: border-box;border-bottom: none !important;border-top: 1px dashed var(--color-reply-sp);.inner.tips {display: flex;height: 40px;align-items: center;gap: 8px;color: var(--color-reply-tips);}.sub_reply_collapse .inner.tips { height: auto; }--color-reply: var(--color-bangumi);}.clearit.friend { --color-reply: var(--color-green); }.clearit.owner { --color-reply: var(--color-yellow); }.clearit.floor { --color-reply: var(--color-purple); }.clearit.self { --color-reply: var(--color-blue); }.clearit.friend, .clearit.owner, .clearit.floor, .clearit.self {border-top: 1px solid var(--color-reply) !important;background: linear-gradient(rgb(from var(--color-reply) r g b / .125) 1px, #00000000 60px) !important;> .inner > :first-child > strong::before, > .inner > strong::before {padding: 1px 4px;margin-right: 4px;border-radius: 2px;background: rgb(from var(--color-bangumi) r g b /.5);}}.clearit.reply_highlight {border: 1px solid var(--color-reply) !important;background: rgb(from var(--color-reply) r g b / .125) !important;box-shadow: 0 0 4px rgb(from var(--color-reply) r g b / .5);border-radius: 0 !important;}.clearit:not(:has(.clearit:not(.message):hover), .message):hover {border-top: 1px solid var(--color-reply) !important;background: linear-gradient(rgb(from var(--color-reply) r g b / .125) 1px, #00000000 60px) !important;box-shadow: 0 0 4px rgb(from var(--color-reply) r g b / .5);}.clearit.self { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自'; } }.clearit.friend { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友'; } }.clearit.owner { > .inner > :first-child > strong::before, > .inner > strong::before { content: '楼'; } }.clearit.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '层'; } }.clearit.friend.owner { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友 楼'; } }.clearit.friend.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友 层'; } }.clearit.owner.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '楼 层'; } }.clearit.self.owner { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自 楼'; } }.clearit.self.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自 层'; } }.clearit.friend.owner.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '友 楼 层'; } }.clearit.self.owner.floor { > .inner > :first-child > strong::before, > .inner > strong::before { content: '自 楼 层'; } }}#comment_list {box-sizing: border-box;.row:nth-child(odd), .row:nth-child(even) { background: transparent; }> .clearit:first-child { border-top: 1px solid transparent; }div.reply_collapse { padding: 5px 10px; }}@media (max-width: 640px) {.columns { > .column:last-child { align-self: auto !important; } }}}`/**merge**/,
        /**merge:css=bangumi_community.user.2.css**/`html, html[data-theme='dark'] {.tip-item,.svg-icon {position: relative;display: flex !important;align-items: center !important;justify-content: center !important;cursor: pointer;.tip, span {visibility: hidden;position: absolute;top: 0;left: 50%;transform: translate(-50%, calc(-100% - 10px));padding: 2px 5px;border-radius: 5px;background: rgb(from var(--color-black) r g b / 0.6);white-space: nowrap;color: var(--color-white);}.tip::after, span::after {content: '';position: absolute !important;bottom: 0;left: 50%;border-top: 5px solid rgb(from var(--color-black) r g b / 0.6);border-right: 5px solid transparent;border-left: 5px solid transparent;backdrop-filter: blur(5px);transform: translate(-50%, 100%);}}.tip-item:hover, .svg-icon:hover { .tip, span { visibility: visible; } }.switch {display: inline-block;position: relative;cursor: pointer;border-radius: 50px;height: 12px;width: 40px;border: 1px solid var(--color-switch-border);}.switch::before {content: '';display: block;position: absolute;pointer-events: none;height: 12px;width: 40px;top: 0px;border-radius: 24px;background-color: var(--color-switch-off);}.switch::after {content: '';display: block;position: absolute;pointer-events: none;top: 0;left: 0;height: 12px;width: 24px;border-radius: 24px;box-sizing: border-box;background-color: var(--color-switch-bar-inner);border: 5px solid var(--color-switch-bar-border);}.switch[switch="1"]::before {background-color: var(--color-switch-on);}.switch[switch="1"]::after {left: 16px;}.topic-box {#comment_list {.icon {color: var(--color-gray-11);}}.block {display: none;}.sicky-reply {background-color: var(--color-sicky-bg);border: 1px solid var(--color-sicky-border);box-shadow: 0px 0px 0px 2px var(--color-sicky-shadow);textarea {background-color: var(--color-sicky-textarea);}}.sicky-reply:has(:focus),.sicky-reply:hover {grid-template-rows: 1fr;background-color: var(--color-sicky-hover-bg);border: 1px solid var(--color-sicky-hover-border);box-shadow: 0 0 4px var(--color-sicky-hover-shadow);}#reply_wrapper {position: relative;padding: 5px;min-height: 50px;margin: 0;textarea.reply {width: 100% !important;}.switch {position: absolute;right: 10px;top: 10px;}.tip.rr + .switch {top: 35px;}}.sicky-reply {position: sticky;top: 0;z-index: 2;display: grid;height: auto;grid-template-rows: 0fr;border-radius: 4px;backdrop-filter: blur(5px);transition: all 0.3s ease;width: calc(100% - 1px);overflow: hidden;#slider {position: absolute;right: 5px;top: 13px;max-width: 100%;}}.svg-box {display: flex;justify-content: center;align-items: center;}}.vcomm {ul {white-space: nowrap;justify-content: center;align-items: center;}a {display: flex;align-items: center;gap: 0.5em;}}}`/**merge**/,
        /**merge:css=bangumi_community.user.3.css**/`html, html[data-theme='dark'] {.vc-serif {font-family: source-han-serif-sc, source-han-serif-japanese, 宋体, 新宋体;font-weight: 900;}#community-helper-user-panel {position: fixed !important;z-index: 9999;display: grid;place-items: center;top: 0;right: 0;bottom: 0;left: 0;> .close-mask {position: absolute;z-index: -100;display: grid;place-items: center;top: 0;right: 0;bottom: 0;left: 0;background: rgb(from var(--color-base) r g b / 0.5);cursor: pointer;backdrop-filter: blur(5px);}> .container {max-width: 1280px;min-height: 390px;max-height: 600px;width: calc(100% - 60px);height: calc(100vh - 60px);> fieldset.board {padding-top: 24px;legend {position: absolute;font-weight: bold;top: 5px;left: 5px;padding: 0;line-height: 12px;font-size: 12px;display: flex;align-items: center;gap: 0.5em;color: var(--color-bangumi-font);> svg {width: 14px;height: 14px;}}}> .tags-field {ul {display: flex;flex-wrap: wrap;gap: 4px;li {padding: 0 5px;border-radius: 50px;background: rgb(from var(--color-font) r g b / .25);border: 1px solid var(--color-font);box-sizing: border-box;white-space: pre;}}}display: grid;grid-template-columns: auto auto auto 1fr auto;grid-template-rows: 180px 34px 36px 40px calc(100% - 310px);gap: 5px 5px;padding: 30px 5px 5px 5px;margin-bottom: 25px;grid-template-areas:"avatar note note note bio""actions note note note bio""stats note note note bio""chart note note note bio""usedname usedname tags tags bio";> .board {--loading-size: 50px;--color-font: var(--color-bangumi-font);--color-from: var(--color-base-2);--color-to: var(--color-base-2);--color-alpha: 0.05;color: var(--color-font);padding: 10px;position: relative;border-radius: 4px;> .actions,> .action {color: var(--color-base-font);position: absolute;top: 5px;right: 5px;cursor: pointer;}> .actions{cursor: none;display: flex;gap: 8px;> .action { cursor: pointer; }}}> .board::after,> .board::before {content: '';position: absolute;border-radius: 4px;top: 0;left: 0;right: 0;bottom: 0;background-size: cover;z-index: -10;}> .board::before { opacity: 0.2; }> .failed,> .loading::before,> .board::after {opacity: 1;background: linear-gradient(150deg, rgb(from var(--color-from) r g b / var(--color-alpha)), rgb(from var(--color-to) r g b / var(--color-alpha)) 75%);box-shadow: 0 0 1px rgb(from var(--color-bangumi-2) r g b / .5);backdrop-filter: blur(10px);}> .loading::after,> .failed::before,> .failed::after {background: none !important;box-shadow: none !important;backdrop-filter: none !important;}> .loading::after {width: var(--loading-size);height: var(--loading-size);top: calc(50% - calc(var(--loading-size) / 2));left: calc(50% - calc(var(--loading-size) / 2));aspect-ratio: 1;border-radius: 50%;border: calc(var(--loading-size) / 6.25) solid;box-sizing: border-box;border-color: var(--color-bangumi) transparent;animation: loading-spine 1s infinite;}> .failed::before,> .failed::after {width: var(--loading-size);;height: calc(var(--loading-size) / 6.25);top: calc(50% - calc(var(--loading-size) / 2));left: calc(50% - calc(var(--loading-size) / 12.5));}> .failed::after { transform: rotate(45deg); }> .failed::before { transform: rotate(-45deg); }> .editable:not(.editing) {.edit, textarea { display: none !important; }}> .editable.editing {.normal { display: none !important; }textarea {width: 100%;height: 100%;resize: vertical;border: none;padding: 0;box-sizing: border-box;background: rgb(from var(--color-base) r g b / .1);border-radius: 4px;max-height: 100%;font-size: 12px;line-height: 18px;color: var(--color-font);overscroll-behavior: contain;}textarea:focus, textarea:hover {border: none;box-shadow: 0 0 1px rgb(from var(--color-bangumi) r g b / .5);}}> .avatar {grid-area: avatar;--color-font: var(--color-bangumi);--color-from: var(--color-bangumi);--color-alpha: .25;min-width: 120px;max-width: 280px;display: flex;flex-direction: column;justify-content: center;align-items: center;gap: 5px;img {width: 100px;height: 100px;border-radius: 100px;object-fit: cover;}span {position: absolute;top: 5px;right: 0;transform: translate(100%) rotate(90deg);transform-origin: 0% 0%;}span::before {content: '@';}svg {width: 100%;height: 50px;text {transform: translate(50%, 0.18em);text-anchor: middle;dominant-baseline: hanging;}}}> .actions {grid-area: actions;--loading-size: 24px;--color-from: var(--color-yellow);--color-font: var(--color-yellow-font);display: grid;padding: 0;grid-template-columns: repeat(4, 1fr);grid-template-areas: "one two three four";> * {position: relative;display: grid;place-items: center;width: 100%;padding: 10px 0;}> .home { grid-area: one; }> .pm { grid-area: two; }> .friend { grid-area: three; }> .block { grid-area: four; }> *:not(.block)::after {position: absolute;content: '';width: 2px;height: calc(100% - 10px);top: 5px;right: -1px;background: rgb(from var(--color-from) r g b / .25);}}> .stats {grid-area: stats;--loading-size: 24px;--color-font: var(--color-base-font);padding: 0;display: grid;grid-template-columns: repeat(3, 1fr);grid-template-rows: repeat(2, 1fr);> .stat {line-height: 14px;font-size: 14px;font-weight: bold;padding: 2px 5px;background: rgb(from var(--color-stat) r g b / .25);}> .stat:hover { background: rgb(from var(--color-stat) r g b / .5); }> .stat:first-child {border-radius: 4px 0 0 0;}> .stat:nth-child(3) {border-radius: 0 4px 0 0;}> .stat:last-child {border-radius: 0 0 4px 0;}> .stat:nth-child(4) {border-radius: 0 0 0 4px;}> .coll {--color-stat: var(--color-bangumi);}> .done {--color-stat: var(--color-green);}> .rate {--color-stat: var(--color-skyblue);}> .avg  {--color-stat: var(--color-yellow);}> .std  {--color-stat: var(--color-purple);}> .cnt  {--color-stat: var(--color-blue);}}> .chart {grid-area: chart;--loading-size: 24px;--color-font: var(--color-base-font);padding: 0;display: grid;grid-template-rows: repeat(10, 4px);> * {display: flex;justify-content: flex-start !important;width: 100%;.bar {height: 2px;background: rgb(from var(--color-bangumi) r g b / .65);transition: all 0.3s ease;}}> *:first-child::before, *:first-child>.bar { border-radius: 4px 4px 0 0; }> *:last-child::before, *:last-child>.bar { border-radius: 0 0 4px 4px; }> *::before {content: '';position: absolute;top: 1px;left: 0;width: 100%;height: 2px;background: rgb(from var(--color-bangumi) r g b / .15);z-index: -1;transition: all 0.3s ease;}> *:hover::before { background: rgb(from var(--color-bangumi) r g b / .3); }> *:hover > .bar { background: rgb(from var(--color-bangumi) r g b / 1); }}> .tags {grid-area: tags;min-width: 200px;--color-from: var(--color-blue);--color-font: var(--color-blue-font);> .wrapper {height: 100%;> * { max-height: 100%; }}}> .note {grid-area: note;min-width: 200px;--color-from: var(--color-green);--color-font: var(--color-green-font);white-space: pre-wrap;> .wrapper {height: 100%;> * { max-height: 100%; }}}> .usedname {grid-area: usedname;--color-from: var(--color-purple);--color-font: var(--color-purple-font);max-width: 400px;min-width: 200px;> ul { max-height: 100%; }}> .bio {grid-area: bio;--color-from: var(--color-bangumi);--color-font: var(--color-base-font);max-width: 505px;min-width: 300px;max-height: calc(100% - 34px);> div { height: calc(100% + 2px); }}}}@media (max-width: 850px) {#community-helper-user-panel > .container {grid-template-columns: auto auto auto 1fr;grid-template-rows: 180px 34px 36px 40px auto auto;max-height: 900px;grid-template-areas:"avatar note note note""actions note note note""stats note note note""chart note note note""usedname usedname tags tags""bio bio bio bio";> .tags,> .usedname {max-height: 300px;}> .bio {max-width: 100%;max-height: 100%;}}}@media (max-width: 520px) {#community-helper-user-panel > .container {grid-template-columns: 1fr;grid-template-rows: 180px 34px 36px 40px auto auto auto auto;max-height: 1100px;grid-template-areas:"avatar""actions""stats""chart""note""usedname""tags""bio";> .board { min-width: 130px; width: calc(100% - 20px); max-width: calc(100% - 20px); }> .actions, > .stats, > .chart { width: 100%; max-width: 100%; }> .note { max-height: 200px; }> .tags, > .usedname { max-height: 150px; }> .bio { max-height: 100%; }}}}`/**merge**/,
    )
    const version = 12;
    const db = new Database({
        dbName: 'VCommunity', version, collections: [
            { collection: 'values', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }] },
            { collection: 'friends', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }], cache: { enabled: true, last: 1 } },
            { collection: 'usednames', options: { keyPath: 'id' }, indexes: [{ name: 'id', keyPath: 'id', unique: true }], cache: { enabled: true, last: 3 } },
            { collection: 'images', options: { keyPath: 'uri' }, indexes: [{ name: 'uri', keyPath: 'uri', unique: true }] },
            { collection: 'users', options: { keyPath: 'id' }, indexes: [
                { name: 'id', keyPath: 'id', unique: true },
                { name: 'blocked', keyPath: 'blocked', unique: false }
            ], cache: { enabled: true, last: 5, hot: 5 } },
        ],
        blocked: { alert: true, message: 'Bangumi 社区助手 preview 数据库有更新，请先关闭所有班固米标签页再刷新试试' },
    });

    async function updateDatabase() {
        if (localStorage.getItem('VCommunity') == version.toString()) return;
        const lastVersion = (await db.get('values', 'version'))?.version || 0;
        if (lastVersion < 5) {
            // V5 update
            const users = await db.getAll('users');
            for (const { id, names, namesUpdate: update, namesTml: tml, block, note, tags } of users) {
                if (names && tml) {
                    names.delete('');
                    await db.put('usednames', { id, names, update, tml });
                }
                if (!block && !note && !(tags && (tags.size || tags.length))) {
                    await db.delete('users', id);
                } else {
                    const user = { id };
                    if (block) user.blocked = 1;
                    if (note) user.note = note;
                    if (tags) user.tags = tags;
                    await db.put('users', user);
                }
            }
        } else if (lastVersion < 12) {
            const usednames = await db.getAll('usednames');
            for (const { id, names, update, tml } of usednames) {
                if (!names || !tml) {
                    await db.delete('usednames', id);
                } else {
                    names.delete('');
                    await db.put('usednames', { id, names, update, tml });
                }
            }
        }
        await db.put('values', { id: 'version', version });
        localStorage.setItem('VCommunity', version.toString());
    }
    await updateDatabase();

    class User {
        static #blockeds = null;
        static async getBlockeds() {
            if (this.#blockeds) return this.#blockeds;
            const list = await db.getAllKeys('users', 1, null, 'blocked');
            return this.#blockeds = new Set(list);
        }

        static async isBlocked(id) {
            const data = await db.get('users', id) || {};
            const isBlocked = !!data.blocked;
            if (isBlocked) this.#blockeds.add(id);
            else this.#blockeds.delete(id);
            return isBlocked;
        }

        static async block(id) {
            if (!confirm('确定要屏蔽吗？')) return false;
            const { blocked: _, ...data } = await db.get('users', id) || { id };
            await db.put('users', { blocked: 1, ...data });
            if (this.#blockeds) this.#blockeds.add(id);
            return true
        }

        static async unblock(id) {
            if (!confirm('确定要解除屏蔽吗？')) return false;
            const { id: _, blocked: __, ...data } = await db.get('users', id) || {};
            if (Object.keys(data).length) await db.put('users', { id, ...data });
            else await db.delete('users', id);
            if (this.#blockeds) this.#blockeds.delete(id);
            return true
        }

        static async connect(nid, gh) {
            if (!confirm('真的要加好友吗？')) return false;
            const ret = await fetch(`/connect/${nid}?gh=${gh}`);
            return ret.ok
        }

        static async disconnect(nid, gh) {
            if (!confirm('真的要解除好友吗？')) return false;
            const ret = await fetch(`/disconnect/${nid}?gh=${gh}`);
            return ret.ok
        }

        static async usednames(id) {
            const data = await db.get('usednames', id) || { id, names: new Set() };
            if (data.update < Date.now() - 3600_000) return data.names;
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
            const { ret, tml } = await getUsedNames(data.tml);
            const update = Date.now();
            const names = new Set(ret).union(data.names);
            names.delete('');
            await db.put('usednames', { id, names, update, tml });
            return names;
        }

        static async homepage(id) {
            const res = await fetch('/user/' + id);
            const me = whoami();
            if (!res.ok) return null;
            const html = await res.text();
            const element = document.createElement('html');
            element.innerHTML = html.replace(/<(img|script|link)/g, '<noload');
            const nameSingle = element.querySelector('#headerProfile .nameSingle');
            const bio = element.querySelector('.bio') ?? '';
            const name = nameSingle.querySelector('.name a').innerText;
            const src = nameSingle.querySelector('.headerAvatar .avatar span').style.backgroundImage.replace('url("', '').replace('")', '');
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
            if (me.nid == 0) return { type: 'guest', name, src, bio, stats, chart };
            if (me.id == id) return { type: 'self', name, src, bio, stats, chart };
            const actions = nameSingle.querySelectorAll('#headerProfile .actions a.chiiBtn');
            const nid = actions[1].href.split('/').pop().replace('.chii', '')
            const friend = actions[0].innerText == '解除好友';
            const gh = friend
                ? actions[0].getAttribute('onclick').split(',').pop().split(/['"]/)[1]
                : actions[0].href.split('gh=').pop();
            if (bio) bio.classList.remove('bio');
            const type = friend ? 'friend' : 'normal';
            return { type, name, src, bio, nid, gh, stats, chart }
        }

        static async getNote(id) {
            const data = await db.get('users', id) || {};
            return data.note || '';
        }

        static async setNote(id, note) {
            const { id: _, note: __, ...data } = await db.get('users', id) || {};
            if (note) await db.put('users', { id, note, ...data });
            else if (Object.keys(data).length == 0) await db.delete('users', id);
            return note;
        }

        static async getTags(id) {
            const data = await db.get('users', id) || {};
            return data.tags || new Set();
        }

        static async setTags(id, tags) {
            tags = new Set(tags);
            tags.delete('');
            const { id: _, tags: __, ...data } = await db.get('users', id) || {};
            if (tags.size) await db.put('users', { id, tags, ...data });
            else if (Object.keys(data).length == 0) await db.delete('users', id);
            return tags;
        }
    }

    class Friends {
        static #peddings = null;
        static async get() {
            const peddings = this.#peddings ?? [];
            const pedding = new Promise(resolve => peddings.push(resolve));
            if (!this.#peddings) {
                this.#peddings = peddings;
                this.#trigger();
            }
            return pedding;
        }
        static async #get() {
            const user = whoami();
            if (!user) return new Set();
            const id = user.id;
            const cache = await db.get('friends', id);
            if (cache && cache.timestamp > Date.now() - 3600_000) return cache.friends;
            const friends = await this.#fetch(id);
            await db.put('friends', { id, friends, timestamp: Date.now() });
            return friends;
        }
        static async #fetch(id) {
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
            return friends;
        }

        static async #trigger() {
            const friends = await this.#get();
            for (const pedding of this.#peddings) pedding(friends);
            this.#peddings = null;
        }
    }

    class NiceScroll {
        static #getNice(element) {
            return $(element).getNiceScroll?.(0)
        }

        static async it(element) {
            const nice = this.#getNice(element);
            if (nice) return nice;
            await LoadScript.load('https://cdn.jsdelivr.net/npm/jquery.nicescroll@3.7/jquery.nicescroll.min.js');
            return $(element).niceScroll({ cursorcolor: "rgb(from var(--color-bangumi) r g b / .5)", cursorwidth: "4px", cursorborder: "none" });
        }

        static to(element, { x, y, d }) {
            const nice = this.#getNice(element);
            if (!nice) return;
            if (typeof x === 'number') nice.doScrollLeft(x, d ?? 0);
            if (typeof y === 'number') nice.doScrollTop(y, d ?? 0);
        }

        static resize(element) {
            this.#getNice(element)?.resize();
        }
    }

    class UserPanel {
        static #id;
        static #isShow = false;
        static #panel = create('div', { id: 'community-helper-user-panel' }, ['div', { class: 'close-mask', onClick: () => this.close() }]);
        static #style = addStyle()
        static #onResize = new Set();
        static #resize() {
            for (const e of this.#onResize) NiceScroll.resize(e);
        }
        static #bfbgi(src) {
            const randomClass = 'v-rand-' + Math.floor(Math.random() * 100000 + 100000).toString(16);
            this.#style.innerText = `.${randomClass}::before {background-image: url("${src}");}`
            return randomClass
        }
        static async #niceIt(element) {
            await NiceScroll.it(element);
            this.#onResize.add(element);
        }
        static close() {
            window.removeEventListener('resize', this.#resize.bind(this));
            this.#isShow = false;
            this.#panel.remove();
            this.#onResize.clear();
            const close = this.#panel.firstElementChild;
            while (this.#panel.lastElementChild != close) {
                this.#panel.lastElementChild.remove();
            }
        }
        static async show(id) {
            window.addEventListener('resize', this.#resize.bind(this));
            this.#id = id;
            this.#isShow = true;
            const avatar = create('div', { class: ['avatar', 'board', 'loading'] });
            const bio = create('fieldset', { class: ['bio', 'board', 'loading'] }, ['legend', SvgIcon.user(), 'Bio']);
            const usedname = create('fieldset', { class: ['usedname', 'board', 'loading', 'tags-field'] }, ['legend', SvgIcon.history(), '曾用名']);
            const tags = create('fieldset', { class: ['tags', 'board', 'loading', 'editable', 'tags-field'] }, ['legend', SvgIcon.tag(), '标签']);
            const note = create('fieldset', { class: ['note', 'board', 'loading', 'editable'] }, ['legend', SvgIcon.note(), '备注']);
            const stats = create('ul', { class: ['stats', 'board', 'loading'] });
            const chart = create('ul', { class: ['chart', 'board', 'loading'] });

            const homeBtn = create('li', { class: ['home', 'svg-icon'], onClick: () => newTab('/user/' + id) }, SvgIcon.home(), ['span', '主页']);
            const pmBtn = create('li', { class: ['pm', 'svg-icon'] }, SvgIcon.message(), ['span', '私信']);
            const connectBtn = create('li', { class: ['friend', 'svg-icon'] }, SvgIcon.connect(), ['span', '加好友']);
            const disconnectBtn = create('li', { class: ['friend', 'svg-icon'] }, SvgIcon.disconnect(), ['span', '解除好友']);
            const blockedBtn = create('li', { class: ['block', 'svg-icon'] }, SvgIcon.block(), ['span', '解除屏蔽']);
            const unblockBtn = create('li', { class: ['block', 'svg-icon'] }, SvgIcon.notify(), ['span', '屏蔽']);
            const actions = create('ul', { class: ['actions', 'board'] }, homeBtn, pmBtn, connectBtn, unblockBtn);

            const container = create('div', { class: 'container' }, avatar, actions, stats, chart, note, usedname, tags, bio);
            append(document.body, [this.#panel, container]);
            this.#niceIt(container);
            await Promise.all([
                async () => {
                    // 头像、昵称、简介、统计、图表、PM
                    const homepage = await User.homepage(id);
                    if (!this.#isShow || id != this.#id) return;
                    avatar.classList.remove('loading');
                    bio.classList.remove('loading');
                    stats.classList.remove('loading');
                    chart.classList.remove('loading');
                    if (!homepage) {
                        avatar.classList.add('failed');
                        bio.classList.add('failed');
                    }
                    const { type, name, src, friend, nid, gh, bio: rbio, stats: sts, chart: cht } = homepage;
                    bio.classList.add(this.#bfbgi(src))
                    append(avatar, ['img', { src }], createTextSVG(name, 'vc-serif'), ['span', id]);
                    append(bio, rbio);
                    if (rbio) this.#niceIt(rbio);
                    append(stats, ...map(sts, v => ['li', { class: ['stat', 'tip-item', v.type] }, ['div', v.value], ['span', v.name]]));
                    const max = Math.max(...cht.map(v => v.value));
                    append(chart, ...map(cht, v => ['li', { class: 'tip-item' }, ['span', `${v.label}分: ${v.value}`],
                        ['div', { class: 'bar', style: { width: (v.value / max * 100).toFixed(2) + '%' } }],
                    ]));
                    this.#resize();
                    switch (type) {
                        case 'guest': {
                            const act = () => confirm('暂未登录，是否打开登录页面') && newTab('/login');
                            pmBtn.addEventListener('click', act);
                            connectBtn.addEventListener('click', act);
                            break;
                        }
                        case 'self': {
                            const act = () => alert('这是自己');
                            pmBtn.addEventListener('click', act);
                            connectBtn.addEventListener('click', act);
                            break;
                        }
                        case 'friend':
                            connectBtn.replaceWith(disconnectBtn)
                        default:
                            pmBtn.addEventListener('click', () => newTab('/pm/compose/' + nid + '.chii'));
                            if (friend) connectBtn.replaceWith(disconnectBtn)
                            connectBtn.addEventListener('click', async () => {
                                if (await User.connect(nid, gh)) connectBtn.replaceWith(disconnectBtn);
                            });
                            disconnectBtn.addEventListener('click', async () => {
                                if (await User.disconnect(nid, gh)) disconnectBtn.replaceWith(connectBtn);
                            });
                    }
                },
                async () => {
                    // 曾用名
                    const names = await User.usednames(id);
                    if (!this.#isShow || id != this.#id) return;
                    usedname.classList.remove('loading');
                    const usednameUl = create('ul', ...map(names, v => ['li', v]));;
                    append(usedname, usednameUl);
                    this.#niceIt(usednameUl);
                    this.#resize();
                },
                async () => {
                    // 屏蔽按钮
                    const blocked = await User.isBlocked(id);
                    if (!this.#isShow || id != this.#id) return;
                    if (blocked) unblockBtn.replaceWith(blockedBtn)
                    blockedBtn.addEventListener('click', async () => {
                        if (await User.unblock(id)) blockedBtn.replaceWith(unblockBtn);
                    });
                    unblockBtn.addEventListener('click', async () => {
                        if (await User.block(id)) unblockBtn.replaceWith(blockedBtn);
                    });
                    this.#resize();
                },
                async () => {
                    // 标签
                    const e = tags;
                    const edit = create('div', { class: ['svg-icon', 'action', 'normal'] }, SvgIcon.edit(), ['span', '编辑']);
                    const ok = create('div', { class: ['svg-icon', 'action', 'edit'] }, SvgIcon.ok(), ['span', '保存']);
                    const close = create('div', { class: ['svg-icon', 'action', 'edit'] }, SvgIcon.close(), ['span', '取消']);
                    const content = create('ul', { class: 'normal' });
                    const textarea = create('textarea', { class: 'edit' });
                    const wrapper = create('div', { class: 'wrapper' }, content, textarea);
                    const actions = create('div', { class: ['actions'] }, edit, ok, close);
                    append(e, wrapper, actions);
                    this.#niceIt(content);
                    this.#niceIt(textarea);
                    const render = async (save = false, value) => {
                        removeAllChildren(content);
                        e.classList.add('loading');
                        e.classList.remove('editing');
                        const tags = save
                            ? await User.setTags(id, value.split('\n').map(tag => tag.trim()))
                            : await User.getTags(id);
                        if (!this.#isShow || id != this.#id) return;
                        e.classList.remove('loading');
                        append(content, ...map(tags, tag => ['li', tag]));
                        this.#resize();
                    }
                    edit.addEventListener('click', () => {
                        e.classList.add('editing');
                        textarea.value = Array.from(content.children, e => e.innerText).join('\n');
                        textarea.focus();
                        textarea.setSelectionRange(0, 0);
                        NiceScroll.to(textarea, { x: 0, y: 0 });
                    });
                    ok.addEventListener('click', () => render(true, textarea.value))
                    close.addEventListener('click', () => render())
                    await render();
                },
                async () => {
                    // 备注
                    const e = note;
                    const edit = create('div', { class: ['svg-icon', 'action', 'normal'] }, SvgIcon.edit(), ['span', '编辑']);
                    const ok = create('div', { class: ['svg-icon', 'action', 'edit'] }, SvgIcon.ok(), ['span', '保存']);
                    const close = create('div', { class: ['svg-icon', 'action', 'edit'] }, SvgIcon.close(), ['span', '取消']);
                    const content = create('div', { class: 'normal' }, ['span']);
                    const textarea = create('textarea', { class: 'edit' });
                    const wrapper = create('div', { class: 'wrapper' }, content, textarea);
                    const actions = create('div', { class: ['actions'] }, edit, ok, close);
                    append(e, wrapper, actions);
                    this.#niceIt(content);
                    this.#niceIt(textarea);
                    const render = async (save = false, value = '') => {
                        removeAllChildren(content);
                        e.classList.add('loading');
                        e.classList.remove('editing');
                        const note = save ? await User.setNote(id, value) : await User.getNote(id);
                        if (!this.#isShow || id != this.#id) return;
                        e.classList.remove('loading');
                        append(content, ['span', note ?? ''])
                        this.#resize();
                    }
                    edit.addEventListener('click', () => {
                        e.classList.add('editing');
                        textarea.value = content.innerText;
                        textarea.focus();
                        textarea.setSelectionRange(0, 0);
                        NiceScroll.to(textarea, { x: 0, y: 0 });
                    });
                    ok.addEventListener('click', () => render(true, textarea.value))
                    close.addEventListener('click', () => render())
                    await render();
                },
            ].map(fn => fn()));
        }
    }

    class Menu {
        static #id;
        static #menu = create('ul',
            ['li', { onClick: () => User.block(this.#id) }, ['a', { href: 'javascript:void(0)' }, SvgIcon.block(), '屏蔽发言']],
            ['li', { onClick: () => UserPanel.show(this.#id) }, ['a', { href: 'javascript:void(0)' }, SvgIcon.detail(), '详细信息']]
        );
        static id(id) { this.#id = id; return this.#menu; }
    }

    class Inject {
        static async dock() {
            const dock = await waitElement(document, 'dock');
            if (!dock) return;
            const robotBtn = await waitElement(dock, 'showrobot');
            if (!robotBtn) return;
            robotBtn.style.display = 'none';
            robotBtn.parentElement.append(create('a', {
                class: ['showrobot', 'svg-icon'],
                href: 'javascript:void(0)',
                onClick: () => chiiLib.ukagaka.toggleDisplay()
            }, SvgIcon.robot(), ['span', '春菜']));
            const dockUl = robotBtn.parentElement.parentElement;

            const toggleTheme = dockUl.querySelector('#toggleTheme');
            toggleTheme.style.display = 'none';
            toggleTheme.parentElement.append(create('a', {
                class: ['showrobot', 'svg-icon'],
                href: 'javascript:void(0)',
                onClick: () => chiiLib.ukagaka.toggleTheme()
            }, SvgIcon.light(), ['span', '开关灯']));
            toggleTheme.parentElement.classList.remove('last');

            const actions = dockUl.children[1];
            for (const action of Array.from(actions.children)) {
                let icon;
                switch (action.innerText) {
                    case '提醒': icon = SvgIcon.notify(); break;
                    case '短信': icon = SvgIcon.message(); break;
                    case '设置': icon = SvgIcon.setting(); break;
                    case '登出': icon = SvgIcon.logout(); break;
                }
                if (icon) {
                    const title = action.innerText
                    removeAllChildren(action);
                    action.classList.add('svg-icon');
                    append(action, icon, ['span', title]);
                }
                dockUl.insertBefore(create('li', action), actions);
            }
            actions.remove();
        }
        static async commentList() {
            const commentList = await waitElement(document, 'comment_list');
            if (!commentList) return;
            const e = commentList.parentElement;
            if (!e) return;
            e.classList.add('topic-box');
            const first = e.querySelector(':scope>.clearit')
            const friends = await Friends.get();
            const blockeds = await User.getBlockeds();
            const observer = observerEach(IntersectionObserver, entry => {
                const clearit = entry.target;
                if (!entry.isIntersecting) return;
                if (clearit._vc?.never) return;
                if (!clearit._vc) clearit._vc = {};
                const id = clearit.getAttribute('data-item-user')
                if (!id) return clearit._vc.never = true;
                if (!clearit._vc.done) {
                    clearit._vc.done = true;
                    const icon = create('a', { class: ['icon', 'svg-icon'], href: 'javascript:void(0)' }, SvgIcon.mark());
                    const action = create('div', { class: ['action', 'dropdown', 'vcomm'] }, icon);
                    icon.addEventListener('mouseenter', () => append(action, Menu.id(id)));
                    const actionBox = clearit.querySelector('.post_actions');
                    actionBox.insertBefore(action, actionBox.lastElementChild);
                }
                if (clearit._vc.blocked && !blockeds.has(id)) {
                    const { inner, placeholder, display } = clearit._vc.blocked;
                    if (!display) placeholder.replaceWith(inner);
                    delete clearit._vc.blocked;
                } else if (!clearit._vc.blocked && blockeds.has(id)) {
                    const inner = clearit.querySelector('.inner');
                    const btn = create('div', { class: 'svg-box' }, SvgIcon.expand())
                    const tip = create('span', { class: 'svg-box' }, SvgIcon.collapse(), '已折叠')
                    const placeholder = create('div', { class: ['inner', 'tips'] }, tip, btn);
                    btn.addEventListener('click', () => {
                        clearit._vc.blocked.display = true;
                        delete clearit._vc.inner;
                        delete clearit._vc.placeholder;
                        placeholder.replaceWith(inner)
                    });
                    inner.replaceWith(placeholder);
                    clearit._vc.blocked = { inner, placeholder };
                }
            });
            if (first) observer.observe(first);
            const ownerItem = e.querySelector('.postTopic');
            const owner = ownerItem?.getAttribute('data-item-user');
            const self = whoami()?.id;
            if (friends.has(owner)) ownerItem.classList.add('friend')
            if (owner === self) first.classList.add('self');
            observeChildren(commentList, async item => {
                observer.observe(item)
                const floor = item.getAttribute('data-item-user');
                if (friends.has(floor)) item.classList.add('friend')
                if (floor === owner) item.classList.add('owner');
                if (floor === self) item.classList.add('self');
                const subReply = await waitElement(item, 'topic_reply_' + item.id.substr(5));
                if (!subReply) return;
                observeChildren(subReply, item => {
                    observer.observe(item);
                    const user = item.getAttribute('data-item-user');
                    if (friends.has(user)) item.classList.add('friend')
                    if (user === owner) item.classList.add('owner');
                    if (user === floor) item.classList.add('floor');
                    if (user === self) item.classList.add('self');
                })
            })
        }
        static async replyWrapper() {
            const replyWrapper = await waitElement(document, 'reply_wrapper');
            if (!replyWrapper) return;
            const placeholder = create('div');
            const e = replyWrapper.parentElement;
            if (!e) return;
            replyWrapper.replaceWith(placeholder);
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
                    e.insertBefore(c, e.querySelector(':scope>.clearit') || e.querySelector(':scope>#comment_list') || placeholder);
                    return c;
                })();
                if (s) {
                    sicky.style.visibility = 'visible';
                    replyWrapper.replaceWith(placeholder);
                    sicky.append(replyWrapper);
                } else {
                    sicky.style.visibility = 'hidden';
                    placeholder.replaceWith(replyWrapper);
                }

            }).bind(this, () => {
                const s = (getSwitch() + 1) % 2;
                localStorage.setItem('sickyReplySwitch', s)
                return s;
            }));
            append(replyWrapper, swBtn);
        }
    }

    Inject.dock();
    const debug = info => () => console.debug(info);
    const common = info => () => {
        console.debug(info);
        Inject.commentList();
        Inject.replyWrapper();
    }
    const router = new Router().use({pattern: '/', handler: debug('首页'),children: [
        { pattern: '/group', handler: debug('我参加的小组的最近话题'), children: [
            { pattern: '/all', handler: debug('所有小组') },
            { pattern: '/discover', handler: debug('小组发现(随便看看)') },
            { pattern: '/topic/*', handler: common('小组话题') },
            { pattern: '/*', handler: debug('小组信息'), children: [
                { pattern: '/forum', handler: debug('小组帖子列表') }
            ]},
        ]},
        { pattern: '/subject/topic/*', handler: common('条目讨论') },
        { pattern: '/(character|person)/topic/*', handler: common('角色或人物页面') },
        { pattern: '/blog/*', handler: common('日志页面') },
        { pattern: '/ep/*', handler: common('章节吐槽') },
    ]});
    router.active(location.pathname)
    if (localStorage.getItem('VCommunityENV') === 'development') {
        unsafeWindow.vcomm = { create, append, version, db, router, User, UserPanel, Friends, Menu, Inject, NiceScroll }
    }
    // localStorage.setItem('VCommunityENV', 'development');
})();
