// ==UserScript==
// @name         Bangumi 组件弃用提醒
// @namespace    b38.dev
// @version      1.0.0
// @author       神戸小鳥 @vickscarlet
// @description  组件弃用提醒
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/scripts/gadget_deprecated_notify
// @match        *://bgm.tv/*
// @match        *://bangumi.tv/*
// @match        *://chii.in/*
// ==/UserScript==

(function () {
  'use strict';

  const svgTags = [
    "svg",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "path",
    "text",
    "g",
    "defs",
    "use",
    "symbol",
    "image",
    "clipPath",
    "mask",
    "pattern"
  ];
  function setEvents(element, events) {
    for (const [event, listener] of Object.entries(events)) {
      element.addEventListener(event, listener);
    }
    return element;
  }
  function setProps(element, props) {
    if (!props || typeof props !== "object") return element;
    for (const [key, value] of Object.entries(props)) {
      if (value == null) continue;
      if (key === "events") {
        setEvents(element, value);
      } else if (key === "class") {
        addClass(element, value);
      } else if (key === "style" && typeof value === "object") {
        setStyle(element, value);
      } else if (key.startsWith("data-")) {
        element.setAttribute(key, String(value));
      } else {
        element[key] = value;
      }
    }
    return element;
  }
  function addClass(element, value) {
    element.classList.add(...[value].flat());
    return element;
  }
  function setStyle(element, styles) {
    for (let [k, v] of Object.entries(styles)) {
      if (typeof v === "number" && v !== 0 && !["zIndex", "fontWeight"].includes(k)) {
        v = v + "px";
      }
      element.style[k] = v;
    }
    return element;
  }
  function create(name, props, ...childrens) {
    if (name == null) return null;
    const isSVG = name === "svg" || typeof name === "string" && svgTags.includes(name);
    if (isSVG) return createSVG(name, props, ...childrens);
    const element = name instanceof Element ? name : document.createElement(name);
    if (props === void 0) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== "object") {
      return append(element, props, ...childrens);
    }
    return append(setProps(element, props), ...childrens);
  }
  function append(element, ...childrens) {
    const tag = element.tagName.toLowerCase();
    if (svgTags.includes(tag)) {
      return appendSVG(element, ...childrens);
    }
    for (const child of childrens) {
      if (Array.isArray(child)) {
        element.append(create(...child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.append(document.createTextNode(String(child)));
      }
    }
    return element;
  }
  function createSVG(name, props, ...childrens) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (name === "svg") element.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    if (props === void 0) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== "object") {
      return appendSVG(element, props, ...childrens);
    }
    return appendSVG(setProps(element, props), ...childrens);
  }
  function appendSVG(element, ...childrens) {
    for (const child of childrens) {
      if (Array.isArray(child)) {
        element.append(createSVG(...child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.append(document.createTextNode(String(child)));
      }
    }
    return element;
  }
  function addStyle(...styles) {
    const style = document.createElement("style");
    style.append(document.createTextNode(styles.join("\n")));
    document.head.appendChild(style);
    return style;
  }
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
    #hot = new Set();
    #last = new Set();
    #pedding = new Set();
    #cache = new Map();
    #times = new Map();
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
        if (counter.cnt > up.cnt) this.#hotList.sort((a, b) => b.cnt - a.cnt);
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
    #cache;
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
            request.addEventListener("success", () => resolve(request.result));
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
      const handler = () => this.transaction((store) => this.#index(store, index).get(key));
      if (this.#cache && this.#options?.keyPath && !index && typeof key == "string") {
        return this.#cache.get(key, handler);
      }
      return handler();
    }
    async getAll(key, count, index) {
      return this.transaction((store) => this.#index(store, index).getAll(key, count));
    }
    async getAllKeys(key, count, index) {
      return this.transaction((store) => this.#index(store, index).getAllKeys(key, count));
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
      return this.transaction((store) => store.put(data), "readwrite").then((_) => true);
    }
    async delete(key) {
      return this.transaction((store) => store.delete(key), "readwrite").then((_) => true);
    }
    async clear() {
      if (this.#cache) this.#cache.clear();
      return this.transaction((store) => store.clear(), "readwrite").then((_) => true);
    }
  }
  class Database {
    constructor({ dbName, version: version2, collections, blocked }) {
      this.#dbName = dbName;
      this.#version = version2;
      this.#blocked = blocked || { alert: false };
      for (const options of collections) {
        this.#collections.set(options.collection, new Collection(this, options));
      }
    }
    #dbName;
    #version;
    #collections = new Map();
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
              store = request.result.createObjectStore(collection, options);
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
  const version = 1;
  const db = new Database({
    dbName: "VGadgetDeprecatedNotify",
    version,
    collections: [
      {
        collection: "values",
        options: { keyPath: "key" },
        indexes: [{ name: "key", keyPath: "key", unique: true }]
      }
    ],
    blocked: {
      alert: true,
      message: "[Bangumi 组件弃用提示] 数据库有更新，请先关闭所有班固米标签页再刷新试试"
    }
  });
  function getGh() {
    return document.querySelector(
      `ul#badgeUserPanel > li > a[onclick="return confirm('登出 Bangumi 账户？')"]`
    )?.href.split("/").pop();
  }
  const css$1 = '#gadget-deprecated-notify-settings{ul{list-style:none;margin:0;padding:0;gap:8px;display:flex;flex-direction:column}button{position:relative;transition:all .3s ease;padding:8px 12px;border:none;border-radius:50px;height:32px;color:#fff;cursor:pointer;background:linear-gradient(45deg,#3effcc,var(--primary-color),#6214ff)}button:before{transition:all .3s ease;content:"";display:block;border-radius:50px;width:calc(100% + 24px);height:32px;margin:-8px -12px -24px;background-color:var(--primary-color,#f09199)}button:hover:before{width:calc(100% + 16px);height:24px;margin:-4px -8px -20px}button:active{transform:scale(.9)}}';
  function addSettingPanel() {
    addStyle(css$1);
    chiiLib.ukagaka.addPanelTab({
      tab: "gadget-deprecated-notify",
      label: "组件弃用提醒",
      type: "custom",
      customContent: () => `<div id="gadget-deprecated-notify-settings">
                <ul>
                    <li><button id="gadget-deprecated-notify-clear-dismiss"><span>清除已忽略记录</span></button></li>
                    <li><button id="gadget-deprecated-notify-clear-cache"><span>清除缓存</span></button></li>
                </ul>
            </div>`,
      onInit: (_, $el) => {
        const s = "gadget-deprecated-notify-";
        $el.find(`#${s}clear-dismiss`).on("click", async () => {
          await db.delete("values", "dismissed");
          await db.delete("values", "notified");
        });
        $el.find(`#${s}clear-cache`).on(
          "click",
          () => db.delete("values", "gadgets")
        );
      }
    });
  }
  const css = "html[data-theme=dark]{#vgdn-container{--bg-primary: #2e2e2ee0;--border-color: #444444e0;--link-color: #4a90e2;--text-primary: #eee;--btn-bg: #888;--btn-danger: #f47268}}html{#vgdn-container{--bg-primary: #ffffffe0;--border-color: #dddddde0;--link-color: #1a0dab;--text-primary: #444;--btn-bg: #ddd;--btn-danger: #f47268}}#vgdn-container{transition:all .3s ease;position:fixed;top:60px;right:16px;width:480px;max-width:calc(100% - 32px);max-height:400px;overflow-y:auto;background-color:var(--bg-primary);border:1px solid var(--border-color);backdrop-filter:blur(10px);border-radius:8px;box-shadow:0 4px 12px #00000026;z-index:10000;font-family:var(--font-family);color:var(--text-primary);button{padding:0;margin:0;transition:all .3s ease;color:var(--text-primary)}button:hover{background-color:var(--primary-color,#f09199);color:#fff;transition:all .3s ease}.vgdn-today-dismiss-btn{position:absolute;top:12px;right:46px;background:transparent;border:none;font-size:14px;line-height:14px;cursor:pointer}.vgdn-close-btn{position:absolute;top:0;right:0;background:transparent;border:none;font-size:28px;height:42px;width:42px;border-radius:0 8px 0 0;cursor:pointer;transition:all .3s ease}.vgdn-btn-danger{background-color:var(--btn-danger);color:#fff}.vgdn-btn-normal{background-color:var(--btn-bg)}.vgdn-title{font-size:16px;font-weight:700;padding:12px 16px;color:var(--primary-color,#f09199);border-bottom:1px solid var(--border-color)}.vgdn-list{list-style:none;margin:0;padding:0}.vgdn-gadget{display:flex;justify-content:space-between;gap:4px;font-size:14px;align-items:center;padding:8px 16px;border-bottom:1px solid var(--border-color)}.vgdn-gadget:last-child{border-bottom:none}.vgdn-gadget-id{display:inline-block;font-size:12px;margin-left:4px}.vgdn-actions{display:flex;gap:4px;margin-left:auto;flex:0 0 auto;align-items:center}.vgdn-action{transition:all .3s ease;border-radius:50px;padding:2px 10px;font-size:12px;border:none;cursor:pointer;flex:0 0 auto}}";
  async function getGadgets() {
    let key = "gadgets";
    let cache = await db.get("values", key);
    if (cache && Date.now() < cache.updated + 36e5) return cache;
    const ret = await fetch("/settings/gadgets");
    if (!ret.ok) throw new Error("无法获取小工具列表");
    const html = await ret.text();
    const element = document.createElement("html");
    element.innerHTML = html;
    const gadgets = Array.from(element.querySelectorAll("ul.list_collected > li")).map((li) => {
      const a = li.querySelector("a.title");
      if (!a) return null;
      const title = a.textContent?.trim() || "";
      const id = a.getAttribute("href")?.split("/").pop() || "";
      return { id, title };
    }).filter((v) => !!v);
    const updated = Date.now();
    const data = { gadgets, updated };
    await db.put("values", { key, ...data });
    return data;
  }
  function isDeprecated(title) {
    title = title.toLowerCase();
    const deprecatedMarks = [
      "deprecated",
      "已弃用",
      "请停止使用",
      "已无用",
      "寿终正寝了",
      "停止更新",
      "停止维护",
      "不再维护",
      "废弃"
    ];
    for (const mark of deprecatedMarks) {
      if (title.includes(mark)) return true;
    }
    return false;
  }
  async function disableGadget(id, gh) {
    const ret = await fetch(`/dev/app/${id}/disable?gh=${gh}&ajax=1`);
    if (!ret.ok) return false;
    const data = await ret.json().catch(() => ({}));
    const success = data.status == "ok";
    if (success) {
      const { gadgets, updated } = await getGadgets();
      const newGadgets = gadgets.filter((gadget) => gadget.id !== id);
      await db.put("values", { key: "gadgets", gadgets: newGadgets, updated });
    }
    return success;
  }
  async function dismissGadget(gadget) {
    const dismissed = (await db.get("values", "dismissed"))?.dismissed || new Map();
    dismissed.set(gadget.id, gadget.title);
    await db.put("values", { key: "dismissed", dismissed });
  }
  async function main() {
    addSettingPanel();
    const notified = await db.get("values", "notified");
    if (notified && Date.now() < notified.time + 864e5) return;
    let gh = getGh();
    if (!gh) return;
    const { gadgets } = await getGadgets();
    const { dismissed } = await db.get("values", "dismissed") ?? {
      dismissed: new Map()
    };
    const notify = [];
    for (const gadget of gadgets) {
      if (dismissed.has(gadget.id)) continue;
      if (!isDeprecated(gadget.title)) continue;
      notify.push(gadget);
    }
    if (notify.length === 0) return;
    addStyle(css);
    const container = create("div", { id: "vgdn-container" });
    const title = create("div", { class: "vgdn-title", textContent: "组件弃用提醒" });
    const closeBtn = create("button", {
      class: "vgdn-close-btn",
      textContent: "×",
      onclick: () => container.remove()
    });
    const todayDismissBtn = create("button", {
      class: ["vgdn-action", "vgdn-btn-normal", "vgdn-today-dismiss-btn"],
      textContent: "今日不再提醒",
      onclick: async () => {
        await db.put("values", { key: "notified", time: Date.now() });
        container.remove();
      }
    });
    const list = create("ul", { class: "vgdn-list" });
    append(
      list,
      ...notify.map((gadget) => {
        const item = create("li", { class: "vgdn-gadget" });
        const title2 = create("span", {
          class: "vgdn-gadget-title",
          textContent: gadget.title
        });
        const id = create("span", {
          class: ["vgdn-gadget-id", "tip"],
          textContent: ` App ID: ${gadget.id}`
        });
        const disableBtn = create("button", {
          class: ["vgdn-action", "vgdn-btn-danger"],
          textContent: "禁用",
          onclick: async () => {
            const success = await disableGadget(gadget.id, gh);
            if (success) item.remove();
            if (list.children.length === 0) container.remove();
          }
        });
        const dismissBtn = create("button", {
          class: ["vgdn-action", "vgdn-btn-normal"],
          textContent: "忽略",
          onclick: async () => {
            await dismissGadget(gadget);
            item.remove();
            if (list.children.length === 0) container.remove();
          }
        });
        const actions = create("div", { class: "vgdn-actions" }, disableBtn, dismissBtn);
        const info = create("div", { class: "vgdn-gadget-info" }, [
          "a",
          { href: `/dev/app/${gadget.id}`, target: "_blank" },
          title2,
          id
        ]);
        append(item, info, actions);
        return item;
      })
    );
    append(container, todayDismissBtn, closeBtn, title, list);
    append(document.body, container);
  }
  main();

})();