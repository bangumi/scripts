export const STORAGE_KEY = 'wiki-enhance-editor-config'
export class Config {
    private inner: Record<string, any> = {}
    private inner_: Record<string, any> = {}
    private listeners: Record<string, Set<(value: any) => void>> = {}
    constructor() {
        const html = document.children?.[0]
        this.isDark = html.getAttribute('data-theme') === 'dark'
        new MutationObserver(() => {
            const isDark = html.getAttribute('data-theme') === 'dark'
            if (this.isDark === isDark) return
            this.isDark = isDark
        }).observe(html, {
            attributes: true,
            attributeFilter: ['data-theme'],
            attributeOldValue: true,
            childList: false,
            characterData: false,
            subtree: false,
            characterDataOldValue: false,
        })
        this.load()
    }

    get showLineNumber() {
        return this.inner.showLineNumber ?? true
    }

    set showLineNumber(value: boolean) {
        this.inner.showLineNumber = value
        this.call('showLineNumber', value)
        this.dump()
    }

    get showMiniMap() {
        return this.inner.showMiniMap ?? false
    }

    set showMiniMap(value: boolean) {
        this.inner.showMiniMap = value
        this.call('showMiniMap', value)
        this.dump()
    }

    get wordWrap() {
        return this.inner.wordWrap ?? false
    }

    set wordWrap(value: boolean) {
        this.inner.wordWrap = value
        this.call('wordWrap', value)
        this.dump()
    }

    get isDark() {
        return this.inner_.isDark ?? false
    }

    set isDark(value: boolean) {
        this.inner_.isDark = value
        this.call('isDark', value)
    }

    on<K extends keyof Config>(key: K, cb: (value: Config[K]) => void) {
        this.listeners[key] = this.listeners[key] || new Set()
        this.listeners[key].add(cb)
    }

    off<K extends keyof Config>(key: K, cb: (value: Config[K]) => void) {
        this.listeners[key]?.delete(cb)
    }

    private call<key extends keyof Config>(key: key, value: Config[key]) {
        this.listeners[key]?.forEach((cb) => cb(value))
    }

    private dump() {
        const json = JSON.stringify(this.inner)
        localStorage.setItem(STORAGE_KEY, json)
    }

    private load() {
        const stored = localStorage.getItem(STORAGE_KEY)
        this.inner = stored ? JSON.parse(stored) : {}
    }
}

export const config = new Config()
export default config
