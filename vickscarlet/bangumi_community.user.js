// ==UserScript==
// @name         Bangumi 社区助手 preview
// @version      0.0.2
// @namespace    b38.dev
// @description  社区助手预览版
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/*
// @run-at       document-start
// ==/UserScript==
(async () => {
    /**
     * 返回一个函数，该函数在调用时会等待上一个调用完成后再执行
     * @param {Function} fn
     */
    function callWhenDone(fn) {
        let done = true;
        return async () => {
            if (!done) return;
            done = false;
            await fn();
            done = true;
        }
    }

    /**
     * 立刻调用一次函数并返回函数本体
     * @param {Function} fn
     */
    function callNow(fn) {
        fn();
        return fn;
    }

    // DOM API HELPERS START
    /**
     * 设置属性
     * @typedef {Record<string, string | number | boolean | Styles>} Props
     * @param {Element} element 元素
     * @param {Props} props 属性
     */
    function setProps(element, props) {
        if (!props || typeof props !== 'object') return element;

        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'boolean') {
                element[key] = value;
                continue;
            }
            if (key === 'class') addClass(element, value);
            else if (key === 'style' && typeof value === 'object') setStyle(element, value);
            else element.setAttribute(key, value);
        }
        return element;
    }

    /**
     * 添加类名
     * @param {Element} element 元素
     * @param {string} value 类名
     */
    function addClass(element, value) {
        element.classList.add(...[value].flat());
        return element;
    }

    /**
     * 设置样式
     * @typedef {Record<string, string | number>} Styles
     * @param {Element} element 元素
     * @param {Styles} styles
     */
    function setStyle(element, styles) {
        for (let [k, v] of Object.entries(styles)) {
            if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k))
                v += 'px';
            element.style[k] = v;
        }
        return element;
    }

    /**
     * @typedef {[string, Props | AppendParams, ...AppendParams[]]} CreateParams
     * @typedef {CreateParams | string | Element} AppendParams
     */

    /**
     * @param {string} name HTML标签
     * @param {Props | AppendParams} props 属性
     * @param {...AppendParams} childrens 子元素
     */
    function create(name, props, ...childrens) {
        if (name === 'svg') return createSVG(name, props, ...childrens);
        const element = document.createElement(name);
        if (props === undefined) return element;
        if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
            return append(element, props, ...childrens);
        return append(setProps(element, props), ...childrens)
    }

    /**
     * @param {Element} element 元素
     * @param {...AppendParams} childrens 子元素
     */
    function append(element, ...childrens) {
        if (element.name === 'svg') return appendSVG(element, ...childrens);
        for (const child of childrens) {
            if (Array.isArray(child)) element.append(create(...child));
            else if (child instanceof Node) element.appendChild(child);
            else element.append(document.createTextNode(child));
        }
        return element;
    }

    /**
     * @param {string} name HTML标签
     * @param {Props | AppendParams} props 属性
     * @param {...AppendParams} childrens 子元素
     */
    function createSVG(name, props, ...childrens) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', name);
        if (name === 'svg') element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        if (props === undefined) return element;
        if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
            return append(element, props, ...childrens);
        return appendSVG(setProps(element, props), ...childrens)
    }

    /**
     * @param {Element} element 元素
     * @param {...AppendParams} childrens 子元素
     */
    function appendSVG(element, ...childrens) {
        for (const child of childrens) {
            if (Array.isArray(child)) element.append(createSVG(...child));
            else if (child instanceof Node) element.appendChild(child);
            else element.append(document.createTextNode(child));
        }
        return element;
    }

    /**
     * @template T
     * @template R
     * @param {Iterable<T>} list
     * @param {(item: T, index: number, list: Iterable<T>) => R} fn
     * @param {R[]} ret
     * @return {R[]}
     */
    function map(list, fn, ret = []) {
        let i = 0;
        for (const item of list) {
            const result = fn(item, i, list);
            ret.push(result);
            i++;
        }
        return ret
    }

    /**
     * @param {Element} element 元素
     */
    function removeAllChildren(element) {
        while (element.firstChild) element.removeChild(element.firstChild);
        return element;
    }

    function unDisplayAllChildren(element) {
        for (const child of element.children)
            child.style.display = 'none';

        return element;
    }

    // DOM API HELPERS END

    // indexedDB cache
    class Collection {
        constructor(master, collection, keyPath) {
            this.#master = master;
            this.#collection = collection;
            this.#keyPath = keyPath;
        }
        /** @type {DB} */
        #master;
        #collection;
        #keyPath;

        get collection() { return this.#collection; }
        get keyPath() { return this.#keyPath; }

        /**
         * @template T
         * @param {(store:IDBObjectStore)=>Promise<IDBRequest>} handler
         * @param {Parameters<typeof DB.prototype.transaction>[2]} mode
         */
        async transaction(handler, mode) {
            const storeHandler = store => new Promise(async (resolve, reject) => {
                const request = await handler(store);
                request.addEventListener('error', e => reject(e));
                request.addEventListener('success', _ => resolve(request.result));
            })
            return this.#master.transaction(this.#collection, storeHandler, mode);
        }

        /**
         * @template T
         * @param {string|number} key
         * @param {string} index
         * @returns {T}
         */
        async get(key, index = '') {
            return this.transaction(store => (index ? store.index(index) : store).get(key));
        }

        /**
         * @template T
         * @param {T} data
         * @returns {Promise<boolean>}
         */
        async put(data) {
            return this.transaction(store => store.put(data), 'readwrite').then(_ => true);
        }

        /**
         * @returns {Promise<boolean>}
         */
        async clear() {
            return this.transaction(store => store.clear(), 'readwrite').then(_ => true);
        }
    }
    class DB {
        /**
         * @typedef {{
         *      dbName: string,
         *      version: number,
         *      collections: {
         *          collection: string,
         *          keyPath: string | string[],
         *      }[],
         *  }} Options
         * @param {Options} param0
         */
        constructor({
            dbName,
            version,
            collections,
        }) {
            this.#dbName = dbName;
            this.#version = version;

            for (const { collection, keyPath } of collections) {
                this.#c.set(collection, new Collection(this, collection, keyPath));
            }
            this.#collectionProxy = new Proxy(this.#c, { get: (target, prop) => target.get(prop) })
        }


        #dbName;
        #version;
        /** @type {Map<string,Collection>} */
        #c = new Map();
        /** @type {IDBDatabase}  */
        #db;
        /** @type {Record<string, Collection>} */
        #collectionProxy;

        /** @type DB */
        static #gdb;
        /**
         * @param {Options} options
         */
        static async initInstance(options) {
            if (!this.#gdb) this.#gdb = await new DB(options).init();
            return this.#gdb;
        }

        static instance() {
            if (!this.#gdb) throw new Error('DB not initInstance');
            return this.#gdb;
        }

        /**
         * @return {DB}
         */
        static get i() { return this.instance() }

        get collections() { return this.#collectionProxy }
        get coll() { return this.#collectionProxy }

        async init() {
            this.#db = await new Promise((resolve, reject) => {
                const request = window.indexedDB.open(this.#dbName, this.#version);
                request.addEventListener('error', event => reject(event.target.error));
                request.addEventListener('success', event => resolve(event.target.result));
                request.addEventListener('upgradeneeded', event => {
                    for (const c of this.#c.values()) {
                        const { collection, keyPath } = c;
                        if (event.target.result.objectStoreNames.contains(collection)) continue;
                        event.target.result.createObjectStore(collection, { keyPath });
                    }
                });
            });
            return this;
        }

        /**
         * @template T
         * @param {string} collection
         * @param {<T>(store:IDBObjectStore)=>T} handler
         * @param {'readonly'|'readwrite'} mode
         * @return {Promise<T>}
         */
        async transaction(collection, handler, mode = 'readonly') {
            return new Promise(async (resolve, reject) => {
                const transaction = this.#db.transaction(collection, mode);
                const store = transaction.objectStore(collection);
                const result = await handler(store);
                transaction.addEventListener('error', e => reject(e));
                transaction.addEventListener('complete', () => resolve(result));
            });
        }


        /**
         * @template T
         * @param {string} collection
         * @param {Parameters<typeof Collection.prototype.get>[0]} key
         * @param {Parameters<typeof Collection.prototype.get>[1]} index
         * @returns {ReturnType<typeof Collection.prototype.get<T>>}
         */
        async get(collection, key, index) {
            return this.#c.get(collection).get(key, index);
        }

        /**
         * @param {string} collection
         * @param {Parameters<typeof Collection.prototype.put>[0]} data
         * @returns {ReturnType<typeof Collection.prototype.put>}
         */
        async put(collection, data) {
            return this.#c.get(collection).put(data);
        }

        /**
         * @param {string} collection
         * @returns {ReturnType<typeof Collection.prototype.clear>}
         */
        async clear(collection) {
            return this.#c.get(collection).clear();
        }

        /**
         * @returns {Promise<boolean>}
         */
        async clearAll() {
            for (const c of this.#c.values())
                await c.clear();
            return true;
        }
    }
    await DB.initInstance({
        dbName: 'VCommunity',
        version: 1,
        collections: [
            { collection: 'values', keyPath: 'id' },
            { collection: 'users', keyPath: 'id' },
        ]
    });

    /**
     * @typedef {{
     *  id: string,
     *  block?: boolean,
     *  names: Set<string>,
     * }} User
     */
    class App {
        static async inject() {
            console.log(document.readyState)
            append(document.head, ['style', this.#styles.join('\n')],)
            this.#userSeek();
            document.addEventListener('readystatechange', async () => {
                if (document.readyState !== 'complete') return;
                this.#dockInject();
                this.#hoverUserListener();
                this.#parseHasCommentList();
            })
            return this;
        }

        static #user;
        static #listeners = new Map();
        static #on(event, listener) {
            if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
            this.#listeners.get(event).add(listener);
            return this;
        }

        static #emit(event, ...args) {
            if (!this.#listeners.has(event)) return;
            for (const listener of this.#listeners.get(event).values()) listener(...args);
            return this;
        }

        static #off(event, listener) {
            if (!this.#listeners.has(event)) return;
            this.#listeners.get(event).delete(listener);
            return this;
        }

        static #menu = new class {
            constructor() {
                const blockBtn = create('li', { class: 'icon-btn' }, ['span', '🚫'])
                const editBtn = create('li', { class: 'icon-btn' }, ['span', '✏️'])
                const usednameBtn = create('li', { class: 'icon-btn' }, ['span', '🔍'])
                this.#element = create('ul', blockBtn, editBtn, usednameBtn);
                blockBtn.addEventListener('click', () => this.#block());
                editBtn.addEventListener('click', () => this.#edit());
                usednameBtn.addEventListener('click', () => this.#usedname());
            }
            #element;
            #id;

            id(id) {
                this.#id = id;
                return this.#element;
            }

            async #block() {
                if (!confirm('确定要屏蔽吗？')) return;
                const data = await DB.i.get('users', this.#id) || { id };
                data.block = true;
                await DB.i.put('users', data);
            }

            async #edit() {
                console.debug('edit', this.#id)
            }

            async #usedname() {
                const names = await this.#getUsedNames(this.#id);
                const data = await DB.i.get('users', this.#id) || { id };
                data.names = data.names.union(new Set(names));
                await DB.i.put('users', data);
            }

            async #getUsedNames(id, ret = [], page = 1) {
                const res = await fetch(`/user/${id}/timeline?type=say&ajax=1&page=${page}`);
                const html = await res.text();
                const names = Array.from(html.matchAll(/从 \<strong\>(?<from>.*?)\<\/strong\> 改名为/g), m => m.groups.from);
                ret.push(...names);
                if (!html.includes('>下一页 &rsaquo;&rsaquo;</a>'))
                    return ret;
                return this.#getUsedNames(id, ret, page + 1);
            }
        }

        static #panel = new class {
            constructor() { };
            #element;
            static inject() {

            }


        }

        static #hoverUserListener() {
            const helper = create('div', { id: 'community-helper', class: 'borderNeue' });
            const title = create('div', { class: 'title' }, 'Bangumi 社区助手');
            const container = create('div', { class: 'user-info' })
            append(helper, title, container);
            let last;
            const showUser = async (id, currentName) => {
                if (last === id) return;
                last = id;
                /** @type {User} */
                const data = await DB.i.get('users', id);
                if (!data || last !== id) return;
                removeAllChildren(container);
                append(container, ['fieldset', ['legend', '用户名'], ['ul', ['li', currentName]]]);
                data.names.delete(currentName);
                if (data.names.size) {
                    const used = ['ul', ...map(data.names, name => ['li', name])]
                    append(container, ['fieldset', ['legend', '曾用名'], used]);
                }
            }
            let timeout;
            this.#on('hover', async ({ id, currentName }) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => showUser(id, currentName), 50);
            });
            this.#on('leave', () => {
                clearTimeout(timeout)
            });
            window.addEventListener('resize', callNow(() => {
                const r = document.querySelector('#robot_balloon > .inner')
                const c = document.querySelector('.columns > .column:not(#columnSubjectHomeB,#columnHomeB):last-child')
                let inner;
                if (window.innerWidth < 640) inner = r;
                else inner = c || r;
                inner.append(helper);
            }))
        }

        static #dockInject() {
            const dock = document.querySelector('#dock');
            if (!dock) return;
            let n, o;

            o = dock.querySelector('#showrobot');
            o.style.display = 'none';
            n = create('a', { class: ['showrobot', 'svg-icon'], href: 'javascript:void(0)' }, this.#svg('robot'), ['span', '春菜']);
            n.addEventListener('click', () => chiiLib.ukagaka.toggleDisplay());
            o.parentElement.append(n);

            o = dock.querySelector('#toggleTheme');
            o.style.display = 'none';
            n = create('a', { class: ['toggleTheme', 'svg-icon'], href: 'javascript:void(0)' }, this.#svg('light'), ['span', '开关灯']);
            n.addEventListener('click', () => chiiLib.ukagaka.toggleTheme());
            o.parentElement.append(n);
            o.parentElement.classList.remove('last');

            o = null;
            dock.querySelectorAll('li').forEach(e => {
                if (!o || o.children.length < e.children.length) o = e;
            });
            o.querySelectorAll('a').forEach(a => {
                let svg;
                switch (a.innerText) {
                    case '提醒': svg = 'notify'; break;
                    case '短信': svg = 'message'; break;
                    case '设置': svg = 'setting'; break;
                    case '登出': svg = 'logout'; break;
                }
                if (svg) {
                    const title = a.innerText
                    removeAllChildren(a);
                    a.classList.add('svg-icon');
                    append(a, this.#svg(svg), ['span', title]);
                }
                o.parentElement.insertBefore(create('li', a), o);
            })
            o.remove();
        }

        static #userNid() {
            try {
                return CHOBITS_UID
            } catch (e) {
                console.error('获取 CHOITS_UID 失败', e);
                return null;
            }
        }

        static #userSeek() {
            const dockA = document.querySelector('#dock li.first a');
            if (dockA) {
                const nid = this.#userNid();
                const name = dockA.innerText;
                const id = dockA.href.split('/').pop();
                this.#user = { nid, id, name };
                return true;
            }
            return false;
        }

        static #selector(selectors) {
            for (const selector of selectors) {
                const e = document.querySelector(selector);
                if (e) return e;
            }
            return null;
        }

        static #parseHasCommentList() {
            const commentList = document.querySelector('#comment_list')
            if (!commentList) return this;
            const e = commentList.parentElement;
            if (!e) return this;
            e.classList.add('topic-box');
            const first = e.querySelector(':scope>.clearit')
            const replyWrapper = e.querySelector('#reply_wrapper');
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

            const handlerClearit = async clearit => {
                const id = clearit.getAttribute('data-item-user')
                if (!id) return;
                const data = await DB.i.get('users', id) || { id, names: new Set() };
                const inner = clearit.querySelector('.inner');
                const icon = create('a', { class: ['icon', 'svg-icon'], href: 'javascript:void(0)' }, this.#svg('mark'));
                const action = create('div', { class: ['action', 'dropdown', 'vcomm'] }, icon);
                icon.addEventListener('mouseenter', () => append(action, this.#menu.id(id)));
                const actionBox = clearit.querySelector('.post_actions');
                actionBox.insertBefore(action, actionBox.lastElementChild);
                if (!data.names) data.names = new Set();
                const currentName = inner.querySelector('strong > a').innerText;
                if (!data.names.has(currentName)) {
                    data.names.add(currentName);
                    await DB.i.put('users', data);
                }
                clearit.addEventListener('mouseenter', e => {
                    this.#emit('hover', { id, currentName })
                    e.stopPropagation();
                });
                clearit.addEventListener('mouseleave', () => this.#emit('leave', { id, currentName }));
                if (data.block) {
                    const btn = create('div', { class: ['icon-btn', 'svg-box'] }, App.#svg('expand'))
                    const tip = create('span', { class: 'svg-box' }, App.#svg('collapse'), '已折叠')
                    const tips = create('div', { class: ['inner', 'tips'] }, tip, btn);
                    btn.addEventListener('click', () => tips.replaceWith(inner));
                    inner.replaceWith(tips);
                }
            }
            if (first) handlerClearit(first);
            const owner = e.querySelector('.postTopic')?.getAttribute('data-item-user');
            for (const comment of Array.from(commentList.children)) {
                const floor = comment.getAttribute('data-item-user')
                if (floor === owner) comment.classList.add('owner');
                handlerClearit(comment)
                comment.querySelectorAll('.clearit').forEach(clearit => {
                    const user = clearit.getAttribute('data-item-user');
                    if (user === owner) clearit.classList.add('owner');
                    else if (user === floor) clearit.classList.add('floor');
                    handlerClearit(clearit);
                });
            }

            return this;
        }

        static #svg(type, size = 14) {
            return ['svg', { viewBox: '0 0 16 16', width: size, height: size, fill: 'currentColor', },
                ...[this.#d[type]].flat().map(d => ['path', { d }])
            ]
        }

        static #d = {
            collapse: 'M10.896 2H8.75V.75a.75.75 0 0 0-1.5 0V2H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0l2.896-2.896A.25.25 0 0 0 10.896 2ZM8.75 15.25a.75.75 0 0 1-1.5 0V14H5.104a.25.25 0 0 1-.177-.427l2.896-2.896a.25.25 0 0 1 .354 0l2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25Zm-6.5-6.5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z',
            expand: 'm8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z',
            logout: 'M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z',
            setting: 'M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z',
            message: 'M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z',
            light: 'M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z',
            notify: 'M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z',
            info: 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
            unnotify: 'm4.182 4.31.016.011 10.104 7.316.013.01 1.375.996a.75.75 0 1 1-.88 1.214L13.626 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947V5.305L.31 3.357a.75.75 0 1 1 .88-1.214Zm7.373 7.19L4.5 6.391v1.556c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01c0 .005.002.009.005.012l.006.004.007.001ZM8 1.5c-.997 0-1.895.416-2.534 1.086A.75.75 0 1 1 4.38 1.55 5 5 0 0 1 13 5v2.373a.75.75 0 0 1-1.5 0V5A3.5 3.5 0 0 0 8 1.5ZM8 16a2 2 0 0 1-1.985-1.75c-.017-.137.097-.25.235-.25h3.5c.138 0 .252.113.235.25A2 2 0 0 1 8 16Z',
            robot: ['M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z', 'M6.25 0h2A.75.75 0 0 1 9 .75V3.5h3.25a2.25 2.25 0 0 1 2.25 2.25V8h.75a.75.75 0 0 1 0 1.5h-.75v2.75a2.25 2.25 0 0 1-2.25 2.25h-8.5a2.25 2.25 0 0 1-2.25-2.25V9.5H.75a.75.75 0 0 1 0-1.5h.75V5.75A2.25 2.25 0 0 1 3.75 3.5H7.5v-2H6.25a.75.75 0 0 1 0-1.5ZM3 5.75v6.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75Z'],
            mark: 'M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
            edit: 'M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z',
            link: 'm7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z',
        }

        static #styles = [
            `html {
                --color-bangumi: #fd8a96;
                --color-bangumi-a20: #fd8a9620;
                --color-bangumi-a40: #fd8a9640;
                --color-bangumi-a80: #fd8a9680;

                --color-white: #ffffff;
                --color-white-ad0: #ffffffd0;
                --color-black: #000000;
                --color-black-a0f: #0000000f;
                --color-black-a20: #00000020;
                --color-black-a60: #00000060;
                --color-black-ad0: #000000d0;

                --color-yellow: #f9c74c;
                --color-yellow-a20: #f9c74c20;
                --color-yellow-a40: #f9c74c40;
                --color-yellow-a80: #f9c74c80;

                --color-purple: #a54cf9;
                --color-purple-a20: #a54cf920;
                --color-purple-a40: #a54cf940;
                --color-purple-a80: #a54cf980;

                --color-blue: #02a3fb;
                --color-blue-a20: #02a3fb20;
                --color-blue-a40: #02a3fb40;
                --color-blue-a80: #02a3fb80;

                --color-green: #95eb89;
                --color-green-a20: #95eb8920;
                --color-green-a40: #95eb8940;
                --color-green-a80: #95eb8980;
            }`,
            `html {
                --color-base: #ffffff;
                --color-base-a0f: #ffffff0f;
                --color-base-a20: #ffffff20;
                --color-base-a40: #ffffff40;
                --color-base-a80: #ffffff80;
                --color-base-ad0: #ffffffd0;

                --color-gray-1: #e8e8e8;
                --color-gray-2: #cccccc;
                --color-gray-3: #aaaaaa;
                --color-gray-4: #969696;

                --color-gray-11: #cccccc;

                --color-bangumi-2: #AB515D;
                --color-bangumi-2-a20: #AB515D20;
                --color-bangumi-2-a40: #AB515D40;
                --color-bangumi-2-a80: #AB515D80;
            }`,
            `html[data-theme='dark'] {
                --color-base: #000000;
                --color-base-a0f: #0000000f;
                --color-base-a20: #00000020;
                --color-base-a40: #00000040;
                --color-base-a80: #00000080;
                --color-base-ad0: #000000d0;

                --color-gray-1: #444444;
                --color-gray-2: #555555;
                --color-gray-3: #6a6a6a;
                --color-gray-4: #888888;

                --color-gray-11: #cccccc;

                --color-bangumi-2: #ffb6bd;
                --color-bangumi-2-a20: #ffb6bd20;
                --color-bangumi-2-a40: #ffb6bd40;
                --color-bangumi-2-a80: #ffb6bd80;
            }`,
            `html {
                --color-dock-sp: var(--color-gray-2);

                --color-switch-border: var(--color-gray-2);
                --color-switch-on: var(--color-green);
                --color-switch-off: var(--color-gray-4);
                --color-switch-bar-border: var(--color-white);
                --color-switch-bar-inner: var(--color-gray-11);

                --color-hover: var(--color-blue);
                --color-icon-btn-bg: var(--color-bangumi-a40);
                --color-icon-btn-color: var(--color-white);

                --color-reply-sp: var(--color-gray-1);
                --color-reply-tips: var(--color-gray-3);

                --color-reply-normal-top: var(--color-bangumi);
                --color-reply-normal-bg: var(--color-bangumi-a20);
                --color-reply-normal-shadow: var(--color-bangumi-a80);

                --color-reply-owner-top: var(--color-yellow);
                --color-reply-owner-bg: var(--color-yellow-a20);
                --color-reply-owner-shadow: var(--color-yellow-a80);

                --color-reply-floor-top: var(--color-purple);
                --color-reply-floor-bg: var(--color-purple-a20);
                --color-reply-floor-shadow: var(--color-purple-a80);

                --color-sicky-bg: var(--color-base-a20);
                --color-sicky-border: var(--color-bangumi-a40);
                --color-sicky-shadow: var(--color-base-a0f);
                --color-sicky-textarea: var(--color-base-ad0);

                --color-sicky-hover-bg: var(--color-bangumi-a20);
                --color-sicky-hover-border: var(--color-bangumi);
                --color-sicky-hover-shadow: var(--color-bangumi);
            }`,
            `html {
                .columns {
                    > .column:not(#columnSubjectHomeB,#columnHomeB):last-child {
                        > * { margin: 0; }
                        display: flex;
                        gap: 10px;
                        flex-direction: column;
                        position: sticky;
                        top: 0;
                        align-self: flex-start;
                        max-height: 100vh;
                        overflow-y: auto;
                    }
                }
                .avatar:not(.tinyCover) {
                    img,
                    .avatarNeue {
                        border-radius: 50% !important;
                    }
                }
                .postTopic {
                    border-bottom: none;
                    .inner.tips {
                        display: flex;
                        height: 40px;
                        align-items: center;
                        gap: 8px;
                        color: var(--color-reply-tips);
                    }
                }
                #comment_list {
                    box-sizing: border-box;

                    .row:nth-child(odd),
                    .row:nth-child(even) {
                        background: transparent;
                    }
                    > .clearit:first-child {
                        border-top: 1px solid transparent;
                    }
                    > .clearit,
                    .topic_sub_reply > .clearit {
                        box-sizing: border-box;
                        border-bottom: none !important;
                        border-top: 1px dashed var(--color-reply-sp);
                        .inner.tips {
                            display: flex;
                            height: 40px;
                            align-items: center;
                            gap: 8px;
                            color: var(--color-reply-tips);
                        }
                        .sub_reply_collapse .inner.tips {
                            height: auto;
                        }
                    }

                    > .clearit:not(:has(.topic_sub_reply > .clearit:hover)):hover,
                    .topic_sub_reply > .clearit:hover {
                        position: relative;
                        z-index: 1;
                        backdrop-filter: blur(5px);
                    }

                    > .clearit:not(:has(.topic_sub_reply > .clearit:hover)):hover,
                    .topic_sub_reply > .clearit:hover {
                        border-top: 1px solid var(--color-reply-normal-top) !important;
                        background: linear-gradient(var(--color-reply-normal-bg) 1px, #00000000 60px) !important;
                        box-shadow: 0 0 4px var(--color-reply-normal-shadow);
                    }
                    .clearit.owner {
                        border-top: 1px solid var(--color-reply-owner-top) !important;
                        background: linear-gradient(var(--color-reply-owner-bg) 1px, #00000000 60px) !important;
                    }
                    .clearit.owner:not(:has(.clearit:hover)):hover {
                        border-top: 1px solid var(--color-reply-owner-top) !important;
                        background: linear-gradient(var(--color-reply-owner-bg) 1px, #00000000 60px) !important;
                        box-shadow: 0 0 4px var(--color-reply-owner-shadow);
                    }
                    .clearit.floor {
                        border-top: 1px solid var(--color-reply-floor-top) !important;
                        background: linear-gradient(var(--color-reply-floor-bg) 1px, #00000000 60px) !important;
                    }
                    .clearit.floor:not(:has(.clearit:hover)):hover {
                        border-top: 1px solid var(--color-reply-floor-top) !important;
                        background: linear-gradient(var(--color-reply-floor-bg) 1px, #00000000 60px) !important;
                        box-shadow: 0 0 4px var(--color-reply-floor-shadow);
                    }

                    div.reply_collapse {
                        padding: 5px 10px;
                    }
                }

                @media (max-width: 640px) {
                    .columns {
                        > .column:last-child {
                            align-self: auto !important;
                        }
                    }
                }
            }`,
            `html, html[data-theme='dark'] {
                #dock {
                    li {
                        position: relative;
                        height: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    li:not(:last-child) {
                        border-right: 1px solid var(--color-dock-sp);
                    }
                }

                .svg-icon {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    span {
                        visibility: hidden;
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translate(-50%, calc(-100% - 10px));
                        padding: 2px 5px;
                        border-radius: 5px;
                        background: rgba(0, 0, 0, 0.6);
                        white-space: nowrap;
                        color: #fff;
                    }
                    span::after {
                        content: '';
                        position: absolute !important;
                        bottom: 0;
                        left: 50%;
                        border-top: 5px solid rgba(0, 0, 0, 0.6);
                        border-right: 5px solid transparent;
                        border-left: 5px solid transparent;
                        backdrop-filter: blur(5px);
                        transform: translate(-50%, 100%);
                    }
                }
                .svg-icon:hover {
                    span {
                        visibility: visible;
                    }
                }
                .switch {
                    display: inline-block;
                    position: relative;
                    cursor: pointer;
                    border-radius: 50px;
                    height: 12px;
                    width: 40px;
                    border: 1px solid var(--color-switch-border);
                }

                .switch::before {
                    content: '';
                    display: block;
                    position: absolute;
                    pointer-events: none;
                    height: 12px;
                    width: 40px;
                    top: 0px;
                    border-radius: 24px;
                    background-color: var(--color-switch-off);
                }

                .switch::after {
                    content: '';
                    display: block;
                    position: absolute;
                    pointer-events: none;
                    top: 0;
                    left: 0;
                    height: 12px;
                    width: 24px;
                    border-radius: 24px;
                    box-sizing: border-box;
                    background-color: var(--color-switch-bar-inner);
                    border: 5px solid var(--color-switch-bar-border);
                }

                .switch[switch="1"]::before {
                    background-color: var(--color-switch-on);
                }
                .switch[switch="1"]::after {
                    left: 16px;
                }

                .clearit {
                    transition: all 0.3s ease;
                }

                .topic-box {
                    #comment_list {
                        .icon {
                            color: var(--color-gray-11);
                        }
                    }
                    .block {
                        display: none;
                    }
                    .sicky-reply {
                        background-color: var(--color-sicky-bg);
                        border: 1px solid var(--color-sicky-border);
                        box-shadow: 0px 0px 0px 2px var(--color-sicky-shadow);
                        textarea {
                            background-color: var(--color-sicky-textarea);
                        }
                        opacity: 0.6;
                    }
                    .sicky-reply:has(:focus),
                    .sicky-reply:hover {
                        opacity: 1;
                        grid-template-rows: 1fr;
                        background-color: var(--color-sicky-hover-bg);
                        border: 1px solid var(--color-sicky-hover-border);
                        box-shadow: 0 0 4px var(--color-sicky-hover-shadow);
                    }
                    #reply_wrapper {
                        position: relative;
                        padding: 5px;
                        min-height: 50px;
                        margin: 0;
                        textarea.reply {
                            width: 100% !important;
                        }
                        .switch {
                            position: absolute;
                            right: 10px;
                            top: 10px;
                        }
                    }
                    .sicky-reply {
                        position: sticky;
                        top: 0;
                        z-index: 2;
                        display: grid;
                        height: auto;
                        grid-template-rows: 0fr;
                        border-radius: 4px;
                        backdrop-filter: blur(5px);
                        transition: all 0.3s ease;
                        width: calc(100% - 1px);
                        overflow: hidden;
                        #slider {
                            position: absolute;
                            right: 5px;
                            top: 13px;
                            max-width: 100%;
                        }
                    }
                    .icon-btn {
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 30px;
                        height: 24px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        display: flex;
                        backdrop-filter: blur(5px);
                        border-radius: 22px;
                        transition: all 0.3s ease;
                        background-color: var(--color-icon-btn-bg);
                        color: var(--color-icon-btn-color);
                    }
                    .icon-btn:hover {
                        background-color: var(--color-hover);
                    }
                    .svg-box {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                }

                .vcomm {
                    ul {
                        width: auto;
                        min-width: auto;
                        height: auto;
                        display: flex;
                        gap: 8px;
                        justify-content: center;
                        padding: 4px;
                    }
                }
                .vcomm:hover {
                    ul {
                        display: flex;
                    }
                }
                #community-helper {
                    border-radius: 5px;
                    display: flex;
                    flex-direction: column;
                    > .title {
                        background: var(--color-bangumi);
                        padding: 8px;
                        color: var(--color-base-ad0);
                        border-radius: 4px 4px 0 0;
                    }
                    > .user-info {
                        padding: 10px;
                        color: var(--color-bangumi-2);
                        fieldset {
                            padding-left: 10px;
                            legend {
                                font-weight: bold;
                                margin-left: -10px;
                            }
                            legend::after {
                                content: ':';
                            }
                        }
                        ul {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 4px;
                            li {
                                padding: 0 5px;
                                border-radius: 50px;
                                background: var(--color-bangumi-a40);
                                border: 1px solid var(--color-bangumi);
                                box-sizing: border-box;
                            }
                        }
                    }
                }

                #community-helper:has(.user-info:empty) {
                    visibility: hidden;
                }
                #robot_balloon {
                    padding: 10px;
                    .speech {
                        ul {
                            display: flex;
                            flex-wrap: wrap;
                        }

                    }
                    > .inner {
                        padding: 0;
                        max-height: 318px;
                        background: none;
                        overflow-y: scroll;
                        scrollbar-width: none;
                        ::-webkit-scrollbar {
                            display: none;
                        }
                    }

                    #community-helper {
                        padding: 0;
                        box-shadow: none;
                        > .title {
                            display: none;
                        }
                        > .user-info {
                            padding: 0;
                            color: unset;
                        }
                    }
                }

                #robot_balloon::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 10px;
                    background: url(/img/ukagaka/balloon_pink.png) no-repeat top left;
                    background-size: 100% auto;
                    z-index: -1;
                }
                .ukagaka_balloon_pink_bottom {
                    position: absolute;
                    height: 10px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100% !important;
                    background-size: 100% auto;
                    z-index: -1;
                }
                @media (max-width: 640px) {
                    #robot_balloon > .inner {
                        max-height: 125px;
                    }
                }
            }`
        ];
    }

    App.inject();

})();