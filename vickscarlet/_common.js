
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
/**
 * @typedef {{
 *  name: string
 *  keyPath: string | string[]
 *  unique?: boolean
 * }} Index
 * @typedef {{
 *  collection: string
 *  options?: IDBObjectStoreParameters
 *  indexes?: Index[]
 * }} CollectionOptions
 * @typedef {{
 *  dbName: string
 *  version: number
 *  collections: CollectionOptions[]
 * }} Options
 */
class Collection {
    /**
     * @param {Database} master 
     * @param {CollectionOptions} param1
     */
    constructor(master, { collection, options, indexes }) {
        this.#master = master;
        this.#collection = collection;
        this.#options = options
        this.#indexes = indexes
    }
    /** @type {Database} */
    #master;
    #collection;
    #options
    #indexes

    get collection() { return this.#collection }
    get options() { return this.#options }
    get indexes() { return this.#indexes }

    /**
     * @param {<T=unknown>(store:IDBObjectStore)=>Promise<IDBRequest<T>>} handler
     * @param {Parameters<typeof Database.prototype.transaction>[2]} [mode=null]
     * @returns {ReturnType<typeof handler>}
     */
    async transaction(handler, mode) {
        return this.#master.transaction(
            this.#collection,
            async store => {
                const request = await handler(store)
                return new Promise((resolve, reject) => {
                    request.addEventListener('error', e => reject(e))
                    request.addEventListener('success', () =>
                        resolve(request.result)
                    )
                })
            },
            mode
        )
    }

    /**
     * @template T
     * @param {IDBValidKey | IDBKeyRange} key
     * @param {string} [index='']
     * @returns {Promise<T|null>}
     */
    async get(key, index = '') {
        return this.transaction(store => (index ? store.index(index) : store).get(key));
    }

    /**
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
class Database {
    /**
     * @param {Options} param0
     */
    constructor({ dbName, version, collections }) {
        this.#dbName = dbName;
        this.#version = version;

        for (const options of collections) {
            this.#collections.set(options.collection, new Collection(this, options));
        }
    }

    #dbName;
    #version;
    /** @type {Map<string,Collection>} */
    #collections = new Map();
    /** @type {IDBDatabase}  */
    #db;

    async init() {
        this.#db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.#dbName, this.#version);
            request.addEventListener('error', event => reject(event.target.error));
            request.addEventListener('success', event => resolve(event.target.result));
            request.addEventListener('upgradeneeded', event => {
                for (const c of this.#collections.values()) {
                    const { collection, options, indexes } = c
                    let store
                    if (!request.result.objectStoreNames.contains(collection))
                        store = request.result.createObjectStore(collection, options)
                    else store = request.transaction.objectStore(collection)
                    if (!indexes) continue
                    for (const { name, keyPath, unique } of indexes) {
                        if (store.indexNames.contains(name)) continue
                        store.createIndex(name, keyPath, { unique })
                    }
                }
            });
        });
        return this;
    }

    /**
     * @param {string} collection
     * @param {<T=unknown>(store:IDBObjectStore)=>Promise<T>} handler
     * @param {'readonly'|'readwrite'} mode
     * @returns {ReturnType<typeof handler>}
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
        return this.#collections.get(collection).get(key, index);
    }

    /**
     * @param {string} collection
     * @returns {ReturnType<typeof Collection.prototype.put>}
     */
    async put(collection, data) {
        return this.#collections.get(collection).put(data);
    }

    /**
     * @param {string} collection
     * @returns {ReturnType<typeof Collection.prototype.clear>}
     */
    async clear(collection) {
        return this.#collections.get(collection).clear();
    }

    /**
     * @returns {Promise<boolean>}
     */
    async clearAll() {
        for (const c of this.#collections.values())
            await c.clear();
        return true;
    }
}