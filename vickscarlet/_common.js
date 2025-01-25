
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
async function callNow(fn) {
    await fn();
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
    const element = document.createElement(name);
    if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
        return append(element, props, ...childrens);
    return append(setProps(element, props), ...childrens)
}

/**
 * @param {Element} element 元素
 * @param {...AppendParams} childrens 子元素
 */
function append(element, ...childrens) {
    for (const child of childrens) {
        if (Array.isArray(child)) element.append(create(...child));
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
                    if (event.target.result.objectStoreNames.contains(collection)) return;
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