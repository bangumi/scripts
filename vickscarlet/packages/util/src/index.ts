export function callWhenDone(fn: () => Promise<any> | any) {
    let done = true
    return async () => {
        if (!done) return
        done = false
        await fn()
        done = true
    }
}

export function callNow(fn: () => any) {
    fn()
    return fn
}

export function map<T, I, L extends Iterable<I>>(
    list: L,
    fn: (item: I, index: number, list: L) => T,
    ret: T[] = []
) {
    let i = 0
    for (const item of list) {
        const result = fn(item, i, list)
        ret.push(result)
        i++
    }
    return ret
}
