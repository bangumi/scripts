/**merge:js=_common.database.js**//**merge**/
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
        this.#options = options;
        this.#indexes = indexes;
    }
    /** @type {Database} */
    #master;
    #collection;
    #options;
    #indexes;

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
                const request = await handler(store);
                return new Promise((resolve, reject) => {
                    request.addEventListener('error', e => reject(e));
                    request.addEventListener('success', () =>
                        resolve(request.result)
                    );
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
            request.addEventListener('error', () => reject({ type: 'error', message: request.error }));
            request.addEventListener('blocked', () => reject({ type: 'blocked' }));
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
