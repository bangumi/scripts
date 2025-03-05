/**merge:js=_common.event.js**/ /**merge**/
class Event {
    static #listeners = new Map();
    static on(event, listener) {
        if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
        this.#listeners.get(event).add(listener);
    }
    static emit(event, ...args) {
        if (!this.#listeners.has(event)) return;
        for (const listener of this.#listeners.get(event).values()) listener(...args);
    }
    static off(event, listener) {
        if (!this.#listeners.has(event)) return;
        this.#listeners.get(event).delete(listener);
    }
}
