export class Event {
    static #listeners = new Map()
    static on<T extends Array<any>>(event: string, listener: (...args: T) => void) {
        if (!this.#listeners.has(event)) this.#listeners.set(event, new Set())
        this.#listeners.get(event).add(listener)
    }
    static emit<T extends Array<any>>(event: string, ...args: T) {
        if (!this.#listeners.has(event)) return
        for (const listener of this.#listeners.get(event).values()) listener(...args)
    }
    static off<T extends Array<any>>(event: string, listener: (...args: T) => void) {
        if (!this.#listeners.has(event)) return
        this.#listeners.get(event).delete(listener)
    }
}
