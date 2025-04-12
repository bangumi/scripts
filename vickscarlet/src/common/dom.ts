export function matches(e: Element, selector: string) {
    if (!e.matches) return false
    return e.matches(selector)
}

export function addStyle(...styles: string[]) {
    const style = document.createElement('style')
    style.append(document.createTextNode(styles.join('\n')))
    document.head.appendChild(style)
    return style
}

export async function waitElement<E extends Element>(parent: Element | Document, selector: string) {
    return new Promise<E | null>((resolve) => {
        let isDone = false
        const done = (fn: () => void) => {
            if (isDone) return
            isDone = true
            fn()
        }
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations)
                for (const node of mutation.addedNodes)
                    if (node instanceof Element)
                        if (node.matches(selector))
                            return done(() => {
                                observer.disconnect()
                                resolve(node as E)
                            })
        })
        observer.observe(parent, { childList: true, subtree: true })

        const node = parent.querySelector<E>(selector)
        if (node)
            return done(() => {
                observer.disconnect()
                resolve(node)
            })
        if (document.readyState === 'complete')
            return done(() => {
                observer.disconnect()
                resolve(null)
            })
        document.addEventListener('readystatechange', () => {
            if (document.readyState !== 'complete') return
            done(() => {
                observer.disconnect()
                resolve(parent.querySelector<E>(selector))
            })
        })
    })
}

export function observeChildren(element: Element, callback: (e: Element) => void) {
    new MutationObserver((mutations) => {
        for (const mutation of mutations)
            for (const node of mutation.addedNodes)
                if (node.nodeType === Node.ELEMENT_NODE) callback(node as Element)
    }).observe(element, { childList: true })
    for (const child of element.children) callback(child)
}

export function resizeObserver(callback: Parameters<Array<ResizeObserverEntry>['forEach']>[0]) {
    return new ResizeObserver((entries) => entries.forEach(callback))
}

export function intersectionObserver(
    callback: Parameters<Array<IntersectionObserverEntry>['forEach']>[0],
    options?: IntersectionObserverInit
) {
    return new IntersectionObserver((entries) => entries.forEach(callback), options)
}

export async function newTab(href: string) {
    const a = document.createElement('a')
    a.href = href
    a.target = '_blank'
    a.click()
}

export function removeAllChildren(element: Element) {
    while (element.firstChild) element.removeChild(element.firstChild)
    return element
}

export const loadScript = (() => {
    type Reslove = (value?: unknown) => void
    const loaded = new Set()
    const pedding = new Map<string, Reslove[]>()
    return async (src: string) => {
        if (loaded.has(src)) return
        const list = pedding.get(src) ?? []
        const p = new Promise((resolve) => list.push(resolve))
        if (!pedding.has(src)) {
            pedding.set(src, list)
            const script = document.createElement('script')
            script.src = src
            script.type = 'text/javascript'
            script.onload = () => {
                loaded.add(src)
                list.forEach((resolve) => resolve())
            }
            document.body.appendChild(script)
        }
        return p
    }
})()
