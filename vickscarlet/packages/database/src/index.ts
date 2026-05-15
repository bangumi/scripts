export interface Index {
    name: string
    keyPath: string | string[]
    unique?: boolean
}

export interface CacheOptions {
    enabled?: boolean
    hot?: number
    last?: number
}

export interface CollectionOptions {
    collection: string
    options?: IDBObjectStoreParameters
    indexes?: Index[]
    cache?: CacheOptions
}

export interface DatabaseOptions {
    dbName: string
    version: number
    collections: CollectionOptions[]
    blocked?: {
        alert?: boolean
        message?: string
    }
}

export interface BaseData {
    [key: string]: unknown
}

interface Counter {
    key: string
    cnt: number
}

class Cache {
    constructor({ hot, last }: CacheOptions) {
        this.#hotLimit = hot ?? 0
        this.#lastLimit = last ?? 0
        this.#cacheLimit = this.#hotLimit + this.#lastLimit
    }

    #hotLimit: number
    #lastLimit: number
    #cacheLimit: number

    #hotList: Counter[] = []
    #hot = new Set()
    #last = new Set()
    #pedding = new Set()
    #cache = new Map()
    #times = new Map<string, Counter>()

    #cHot(key: string) {
        if (!this.#hotLimit) return false
        const counter = this.#times.get(key) || { key, cnt: 0 }
        counter.cnt++
        this.#times.set(key, counter)
        // 热点为空
        if (this.#hot.size == 0) {
            this.#hotList.push(counter)
            this.#hot.add(key)
            this.#pedding.delete(key)
            return true
        }
        const i = this.#hotList.indexOf(counter)
        // 在最热
        if (i == 0) return true
        // 在热点中
        if (i > 0) {
            const up = this.#hotList[i - 1]
            // 需要重排
            if (counter.cnt > up.cnt) this.#hotList.sort((a, b) => b.cnt - a.cnt)
            return true
        }
        // 不在热点中
        // 热点未满
        if (this.#hot.size < this.#hotLimit) {
            this.#hotList.push(counter)
            this.#hot.add(key)
            this.#pedding.delete(key)
            return true
        }
        // 热点已满
        const min = this.#hotList.at(-1)
        // 小于最低热
        if (counter.cnt <= min!.cnt) return false
        // 替换最低热

        // 之前最低热出列
        this.#hotList.pop()
        this.#hot.delete(min!.key)
        // 也不在最近数据中, 就标记为待删除
        if (!this.#last.has(min!.key)) this.#pedding.add(min!.key)

        // 当前最低热入列
        this.#hotList.push(counter)
        this.#hot.add(key)
        this.#pedding.delete(key)

        return true
    }
    #cLast(key: string) {
        if (!this.#lastLimit) return false
        this.#last.delete(key)
        this.#last.add(key)
        this.#pedding.delete(key)
        if (this.#last.size <= this.#lastLimit) return true
        const out = this.#last.values().next().value
        this.#last.delete(out)
        // 也不在热点数据中, 就标记为待删除
        if (!this.#hot.has(out)) this.#pedding.add(out)
        return true
    }

    async get<T>(key: string, query: () => T) {
        const data = this.#cache.get(key) ?? (await query())
        const inHot = this.#cHot(key)
        const inLast = this.#cLast(key)
        if (inHot || inLast) this.#cache.set(key, data)
        let i = this.#cache.size - this.#cacheLimit
        if (!i) return data as T
        for (const key of this.#pedding) {
            if (!i) return data as T
            this.#cache.delete(key)
            this.#pedding.delete(key)
            i--
        }
        return data as T
    }
    update<T>(key: string, value: T) {
        if (!this.#cache.has(key)) this.#cache.set(key, value)
    }
    clear() {
        this.#cache.clear()
    }
}

class Collection {
    constructor(master: Database, { collection, options, indexes, cache }: CollectionOptions) {
        this.#master = master
        this.#collection = collection
        this.#options = options
        this.#indexes = indexes
        if (options?.keyPath && cache && cache.enabled) {
            this.#cache = new Cache(cache)
        }
    }
    #master: Database
    #collection: string
    #options?: IDBObjectStoreParameters
    #indexes?: Index[]
    #cache?: Cache

    get collection() {
        return this.#collection
    }
    get options() {
        return this.#options
    }
    get indexes() {
        return this.#indexes
    }

    async transaction<T>(
        handler: (store: IDBObjectStore) => Promise<IDBRequest<T>> | IDBRequest<T>,
        mode?: 'readonly' | 'readwrite'
    ) {
        return this.#master.transaction(
            this.#collection,
            async (store) => {
                const request = await handler(store)
                return new Promise<T>((resolve, reject) => {
                    request.addEventListener('error', (e) => reject(e))
                    request.addEventListener('success', () => resolve(request.result))
                })
            },
            mode
        )
    }

    #index(store: IDBObjectStore, index = '') {
        if (!index) return store
        return store.index(index)
    }

    async get<T>(key: IDBValidKey | IDBKeyRange, index?: string) {
        const handler = () =>
            this.transaction<T | null>((store) => this.#index(store, index).get(key))
        if (this.#cache && this.#options?.keyPath && !index && typeof key == 'string') {
            return this.#cache.get(key, handler)
        }
        return handler()
    }

    async getAll<T>(key?: IDBValidKey | IDBKeyRange, count?: number, index?: string) {
        return this.transaction<T[]>((store) => this.#index(store, index).getAll(key, count))
    }

    async getAllKeys(key?: IDBValidKey | IDBKeyRange, count?: number, index?: string) {
        return this.transaction((store) => this.#index(store, index).getAllKeys(key, count))
    }

    async put<T extends BaseData>(data: T) {
        if (this.#cache) {
            let key
            if (Array.isArray(this.#options!.keyPath)) {
                key = []
                for (const path of this.#options!.keyPath) {
                    key.push(data[path])
                }
                key = key.join('/')
            } else {
                key = data[this.#options!.keyPath as keyof T]
            }
            this.#cache.update(key as string, data)
        }
        return this.transaction((store) => store.put(data), 'readwrite').then((_) => true)
    }

    async delete(key: IDBValidKey | IDBKeyRange) {
        return this.transaction((store) => store.delete(key), 'readwrite').then((_) => true)
    }

    async clear() {
        if (this.#cache) this.#cache.clear()
        return this.transaction((store) => store.clear(), 'readwrite').then((_) => true)
    }
}

export class Database {
    constructor({ dbName, version, collections, blocked }: DatabaseOptions) {
        this.#dbName = dbName
        this.#version = version
        this.#blocked = blocked || { alert: false }

        for (const options of collections) {
            this.#collections.set(options.collection, new Collection(this, options))
        }
    }

    #dbName: string
    #version: number
    #collections = new Map<string, Collection>()
    #db: IDBDatabase | null = null
    #blocked?: { alert?: boolean; message?: string }

    async init() {
        this.#db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.#dbName, this.#version)
            request.addEventListener('error', () =>
                reject({ type: 'error', message: request.error })
            )
            request.addEventListener('blocked', () => {
                const message = this.#blocked?.message || 'indexedDB is blocked'
                if (this.#blocked?.alert) alert(message)
                reject({ type: 'blocked', message })
            })
            request.addEventListener('success', () => resolve(request.result))
            request.addEventListener('upgradeneeded', () => {
                for (const c of this.#collections.values()) {
                    const { collection, options, indexes } = c
                    let store
                    if (!request.result.objectStoreNames.contains(collection))
                        store = request.result.createObjectStore(collection, options)
                    else store = request.transaction!.objectStore(collection)
                    if (!indexes) continue
                    for (const { name, keyPath, unique } of indexes) {
                        if (store.indexNames.contains(name)) continue
                        store.createIndex(name, keyPath, { unique })
                    }
                }
            })
        })
        return this
    }

    async transaction<T>(
        collection: string,
        handler: (store: IDBObjectStore) => Promise<T>,
        mode: 'readwrite' | 'readonly' = 'readonly'
    ) {
        if (!this.#db) await this.init()
        return new Promise<T>(async (resolve, reject) => {
            const transaction = this.#db!.transaction(collection, mode)
            const store = transaction.objectStore(collection)
            const result = await handler(store)
            transaction.addEventListener('error', (e) => reject(e))
            transaction.addEventListener('complete', () => resolve(result))
        })
    }

    async get<T>(collection: string, key: IDBValidKey | IDBKeyRange, index?: string) {
        return this.#collections.get(collection)!.get<T>(key, index)
    }

    async getAll<T>(
        collection: string,
        key?: IDBValidKey | IDBKeyRange,
        count?: number,
        index?: string
    ) {
        return this.#collections.get(collection)!.getAll<T>(key, count, index)
    }

    async getAllKeys(
        collection: string,
        key?: IDBValidKey | IDBKeyRange,
        count?: number,
        index?: string
    ) {
        return this.#collections.get(collection)!.getAllKeys(key, count, index)
    }

    async put<T extends BaseData>(collection: string, data: T) {
        return this.#collections.get(collection)!.put<T>(data)
    }

    async delete(collection: string, key: IDBValidKey | IDBKeyRange) {
        return this.#collections.get(collection)!.delete(key)
    }

    async clear(collection: string) {
        return this.#collections.get(collection)!.clear()
    }

    async clearAll() {
        for (const c of this.#collections.values()) await c.clear()
        return true
    }
}
