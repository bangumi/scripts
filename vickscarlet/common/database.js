/**merge:js=common/database.js**/ /**merge**/
/**
 * @typedef {{
 *  name: string
 *  keyPath: string | string[]
 *  unique?: boolean
 * }} Index
 * @typedef {{
 *  enabled?: boolean,
 *  hot?: number,
 *  last?: number,
 * }} Cache
 * @typedef {{
 *  collection: string
 *  options?: IDBObjectStoreParameters
 *  indexes?: Index[]
 *  cache?: Cache
 * }} CollectionOptions
 * @typedef {{
 *  dbName: string
 *  version: number
 *  collections: CollectionOptions[]
 * }} Options
 */

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
        // 热点为空
        if (this.#hot.size == 0) {
            this.#hotList.push(counter);
            this.#hot.add(key);
            this.#pedding.delete(key);
            return true;
        }
        const i = this.#hotList.indexOf(counter);
        // 在最热
        if (i == 0) return true;
        // 在热点中
        if (i > 0) {
            const up = this.#hotList[i - 1];
            // 需要重排
            if (counter.cnt > up.cnt) this.#hotList.sort((a, b) => b.cnt - a.cnt);
            return true;
        }
        // 不在热点中
        // 热点未满
        if (this.#hot.size < this.#hotLimit) {
            this.#hotList.push(counter);
            this.#hot.add(key);
            this.#pedding.delete(key);
            return true;
        }
        // 热点已满
        const min = this.#hotList.at(-1);
        // 小于最低热
        if (counter.cnt <= min.cnt) return false;
        // 替换最低热

        // 之前最低热出列
        this.#hotList.pop();
        this.#hot.delete(min.key);
        // 也不在最近数据中, 就标记为待删除
        if (!this.#last.has(min.key)) this.#pedding.add(min.key);

        // 当前最低热入列
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
        // 也不在热点数据中, 就标记为待删除
        if (!this.#hot.has(out)) this.#pedding.add(out);
        return true;
    }

    async get(key, query) {
        const data = this.#cache.get(key) ?? (await query());
        const inHot = this.#cHot(key);
        const inLast = this.#cLast(key);
        if (inHot || inLast) this.#cache.set(key, data);
        let i = this.#cache.size - this.#cacheLimit;
        if (!i) return data;
        for (const key of this.#pedding) {
            if (!i) return data;
            this.#cache.delete(key);
            this.#pedding.delete(key);
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
    /**
     * @param {Database} master
     * @param {CollectionOptions} param1
     */
    constructor(master, { collection, options, indexes, cache }) {
        this.#master = master;
        this.#collection = collection;
        this.#options = options;
        this.#indexes = indexes;
        if (cache && cache.enabled) {
            this.#cache = new Cache(cache);
        }
    }
    /** @type {Database} */
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

    /**
     * @param {<T=unknown>(store:IDBObjectStore)=>Promise<IDBRequest<T>>} handler
     * @param {Parameters<typeof Database.prototype.transaction>[2]} [mode=null]
     * @returns {ReturnType<typeof handler>}
     */
    async transaction(handler, mode) {
        return this.#master.transaction(
            this.#collection,
            async (store) => {
                const request = await handler(store);
                return new Promise((resolve, reject) => {
                    request.addEventListener('error', (e) => reject(e));
                    request.addEventListener('success', () => resolve(request.result));
                });
            },
            mode
        );
    }

    /**
     * @param {IDBObjectStore} store
     * @param {string} [index='']
     */
    #index(store, index = '') {
        if (!index) return store;
        return store.index(index);
    }

    /**
     * @template T
     * @param {IDBValidKey | IDBKeyRange} key
     * @param {string} [index='']
     * @returns {Promise<T|null>}
     */
    async get(key, index) {
        const handler = () => this.transaction((store) => this.#index(store, index).get(key));
        if (this.#cache && this.#options.keyPath && !index) return this.#cache.get(key, handler);
        return handler();
    }

    /**
     * @template T
     * @param {IDBValidKey | IDBKeyRange} key
     * @param {number} [count]
     * @param {string} [index='']
     * @returns {Promise<T[]>}
     */
    async getAll(key, count, index) {
        return this.transaction((store) => this.#index(store, index).getAll(key, count));
    }

    /**
     * @template T
     * @param {IDBValidKey | IDBKeyRange} key
     * @param {number} [count]
     * @param {string} [index='']
     * @returns {Promise<T[]>}
     */
    async getAllKeys(key, count, index) {
        return this.transaction((store) => this.#index(store, index).getAllKeys(key, count));
    }

    /**
     * @returns {Promise<boolean>}
     */
    async put(data) {
        if (this.#cache) {
            let key;
            if (Array.isArray(this.#options.keyPath)) {
                key = [];
                for (const path of this.#options.keyPath) {
                    key.push(data[path]);
                }
                key = key.join('/');
            } else {
                key = data[this.#options.keyPath];
            }
            this.#cache.update(key, data);
        }
        return this.transaction((store) => store.put(data), 'readwrite').then((_) => true);
    }

    /**
     * @template T
     * @param {IDBValidKey | IDBKeyRange} key
     * @returns {Promise<boolean>}
     */
    async delete(key) {
        return this.transaction((store) => store.delete(key), 'readwrite').then((_) => true);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async clear() {
        if (this.#cache) this.#cache.clear();
        return this.transaction((store) => store.clear(), 'readwrite').then((_) => true);
    }
}

class Database {
    /**
     * @param {Options} param0
     */
    constructor({ dbName, version, collections, blocked }) {
        this.#dbName = dbName;
        this.#version = version;
        this.#blocked = blocked || { alert: false };

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
    #blocked;

    async init() {
        this.#db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.#dbName, this.#version);
            request.addEventListener('error', () =>
                reject({ type: 'error', message: request.error })
            );
            request.addEventListener('blocked', () => {
                const message = this.#blocked?.message || 'indexedDB is blocked';
                if (this.#blocked?.alert) alert(message);
                reject({ type: 'blocked', message });
            });
            request.addEventListener('success', () => resolve(request.result));
            request.addEventListener('upgradeneeded', () => {
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

    /**
     * @param {string} collection
     * @param {<T=unknown>(store:IDBObjectStore)=>Promise<T>} handler
     * @param {'readonly'|'readwrite'} mode
     * @returns {ReturnType<typeof handler>}
     */
    async transaction(collection, handler, mode = 'readonly') {
        if (!this.#db) await this.init();
        return new Promise(async (resolve, reject) => {
            const transaction = this.#db.transaction(collection, mode);
            const store = transaction.objectStore(collection);
            const result = await handler(store);
            transaction.addEventListener('error', (e) => reject(e));
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
     * @template T
     * @param {string} collection
     * @param {Parameters<typeof Collection.prototype.getAll>[0]} key
     * @param {Parameters<typeof Collection.prototype.getAll>[1]} count
     * @param {Parameters<typeof Collection.prototype.getAll>[2]} index
     * @returns {ReturnType<typeof Collection.prototype.getAll<T>>}
     */
    async getAll(collection, key, count, index) {
        return this.#collections.get(collection).getAll(key, count, index);
    }

    /**
     * @template T
     * @param {string} collection
     * @param {Parameters<typeof Collection.prototype.getAllKeys>[0]} key
     * @param {Parameters<typeof Collection.prototype.getAllKeys>[1]} count
     * @param {Parameters<typeof Collection.prototype.getAllKeys>[2]} index
     * @returns {ReturnType<typeof Collection.prototype.getAllKeys<T>>}
     */
    async getAllKeys(collection, key, count, index) {
        return this.#collections.get(collection).getAllKeys(key, count, index);
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
     * @param {Parameters<typeof Collection.prototype.delete>[0]} key
     * @returns {ReturnType<typeof Collection.prototype.delete>}
     */
    async delete(collection, key) {
        return this.#collections.get(collection).delete(key);
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
        for (const c of this.#collections.values()) await c.clear();
        return true;
    }
}
