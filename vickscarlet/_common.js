
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
 * @param {Element} element 元素
 */
function removeAllChildren(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
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

const ElementHelper = new Proxy(class ElementHelper {
    /**
     * @typedef {string | number} Style
     * @typedef {Record<string, Style>} Styles
     * @typedef {string | number | boolean | Styles} Prop
     * @typedef {Record<string, Prop>} Props
     * @typedef {(e: Event)=>void} EventHandler
     * @typedef {Record<string, EventHandler>} Events
     * @param {string} name
     * @param {Props} props
     * @param {Styles} styles
     * @param {Events} events
     */
    constructor(name, props = {}, styles = {}, events = {}) {
        this.#name = name;
        this.#props = ElementHelper.#merge(this.#props, props);
        this.#styles = ElementHelper.#merge(this.#styles, styles);
        this.#events = ElementHelper.#merge(this.#events, events);
        return this.#proxy;
    };
    /** */
    #proxy = new Proxy(this, {
        get: (target, prop) => {
            if (prop in target) return target[prop].bind(target);
            if (typeof prop !== 'string') return;
            if (prop.startsWith('set')) {
                prop = prop.charAt(3).toLowerCase() + prop.slice(4);
                return target.prop.bind(target, prop);
            }
            if (prop.startsWith('on')) {
                prop = prop.charAt(2).toLowerCase() + prop.slice(3);
                return target.event.bind(target, prop);
            }
            if (prop.startsWith('remove')) {
                prop = prop.charAt(6).toLowerCase() + prop.slice(7);
                return () => {
                    if (this.#props[prop])
                        delete this.#props[prop];
                    return this.#proxy;
                }
            }
            return (props, styles, events) => {
                const child = new ElementHelper(prop, props, styles, events)
                this.#childrens.push(child);
                return this.#proxy;
            };
        }
    });
    #name;
    #into = null;
    #props = {};
    #styles = {};
    #events = {};
    #childrens = [];
    #classes = [];
    /** @type {Element} */
    #node;
    #id;

    class(value) {
        this.#classes.push(value);
        return this.#proxy;
    }
    id(id) {
        this.#props.id = id;
        return this.#proxy;
    }

    #create() {
        if (this.#name === 'svg') {
            this.#node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.#node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            this.#node.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        } else {
            this.#node = document.createElement(this.#name);
        }
        return this;
    }

    #setProps() {
        const props = this.#props;
        if (!props || typeof props !== 'object') return this;
        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'boolean') {
                this.#node[key] = value;
                continue;
            }
            if (key === 'class')
                this.#classes.push(value);
            else if (key === 'id')
                this.#id = value;
            else if (key === 'style' && typeof value === 'object')
                this.#styles = ElementHelper.#merge(this.#styles, value);
            else this.#node.setAttribute(key, value);
        }
        return this;
    }

    #setStyles() {
        if (!this.#styles) return this;
        for (let [k, v] of Object.entries(this.#styles)) {
            if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k))
                v += 'px';
            this.#node.style[k] = v;
        }
        return this;
    }

    #setEvents() {
        if (!this.#events) return this;
        for (let [k, v] of Object.entries(this.#events)) {
            this.#node.addEventListener(k, v);
        }
        return this;
    }

    #setClass() {
        for (let c of this.#classes.flat()) {
            this.#node.classList.add(c);
        }
        return this;
    }

    #setId() {
        if (this.#id) this.#node.id = this.id;
        return this;
    }

    #createChildrens() {
        for (let child of this.#childrens) {
            if (child instanceof ElementHelper)
                this.#node.append(child.create(this.#node));
            else
                this.#node.append(child);
        }
        return this;
    }

    static #merge(a, b) {
        if (!a) a = {};
        if (!b) return null;
        return Object.assign(a, b);
    }

    /**
     * @param {string} key
     * @param {Style} value
     */
    style(key, value) {
        if (!this.#styles) this.#styles = {};
        this.#styles[key] = value;
        return this.#proxy;
    }
    /**
     * @param {Styles} styles
     */
    styles(styles) {
        this.#styles = ElementHelper.#merge(this.#styles, styles);
        return this.#proxy;
    }
    /**
     * @param {string} key
     * @param {Prop} value
     */
    prop(key, value) {
        if (!this.#props) this.#props = {};
        this.#props[key] = value;
        return this.#proxy;
    }
    /**
     * @param {Props} styles
     */
    props(props) {
        this.#props = ElementHelper.#merge(this.#props, props);
        return this.#proxy;
    }
    /**
     * @param {string} key
     * @param {EventHandler} value
     */
    event(key, value) {
        if (!this.#events) this.#events = {};
        this.#events[key] = value;
        return this.#proxy;
    }
    /**
     * @param {Events} value
     */
    events(events) {
        this.#events = ElementHelper.#merge(this.#events, events);
        return this.#proxy;
    }

    /**
     * @param {this} into
     * @returns {this}
     */
    into(into) {
        if (into) {
            this.#into = into;
            return this.#proxy;
        }
        if (this.#childrens.length == 0) return this.#proxy;
        return this.#childrens[this.#childrens.length - 1].into(this.#proxy);
    }
    /**
     * @returns {this | null}
     */
    out() {
        const into = this.#into;
        this.#into = null;
        return into;
    }
    /**
     * @param {this | Element | Node} child
     */
    append(child) {
        this.#childrens.push(child);
        return this.#proxy;
    }

    /**
     * @template T
     * @param {ArrayLike<T>} data
     * @param {(item: T, helper: ElementHelper, index: number, data: ArrayLike<T>) => ElementHelper} fn
     */
    dataEach(data, fn) {
        let i = 0;
        for (let item of data) {
            const child = fn(item, this, i, data);
            i++;
        }
        return this.#proxy;
    }

    create() {
        if (!this.#node) this.#create();
        this.#setProps()
            .#setStyles()
            .#setEvents()
            .#setClass()
            .#setId()
            .#createChildrens();
        return this.#node;
    }

    /**
     * @param {string} data
     */
    text(data) {
        this.#childrens.push(document.createTextNode(data));
        return this.#proxy;
    }
    /**
     * @param {string} data
     */
    static text(data) {
        return document.createTextNode(data);
    }
    /**
     * @param {string} type
     * @param {Props?} props
     * @param {Style?} styles
     * @param {Events?} events
     */
    static #spacialInput(type, props, styles, events) {
        props = this.#merge({ type }, props);
        return new ElementHelper('input', props, styles, events);
    }
    /**
     * @param {Props?} props
     * @param {Style?} styles
     * @param {Events?} events
     */
    static password(props, styles, events) {
        return this.#spacialInput('password', props, styles, events);
    }
    /**
     * @param {Props?} props
     * @param {Style?} styles
     * @param {Events?} events
     */
    static checkbox(props, styles, events) {
        return this.#spacialInput('checkbox', props, styles, events);
    }
    /**
     * @param {Props?} props
     * @param {Style?} styles
     * @param {Events?} events
     */
    static radio(props, styles, events) {
        return this.#spacialInput('radio', props, styles, events);
    }

    /**
     * @param {Element} element 元素
     */
    static removeAllChildren(element) {
        while (element.firstChild) element.removeChild(element.firstChild);
        return element;
    }
}, {
    get: (target, prop) => {
        if (prop in target) return target[prop];
        return (props, styles, events) => new target(prop, props, styles, events);
    }
})