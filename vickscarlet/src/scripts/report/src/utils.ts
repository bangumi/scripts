export function pad02(n: number) {
    return n.toString().padStart(2, '0')
}

export function timeFormat(time: number, day = false) {
    const s = time % 60
    const m = ((time - s) / 60) % 60
    if (!day) {
        const h = (time - s - m * 60) / 3600
        return `${h}:${pad02(m)}:${pad02(s)}`
    }
    const h = ((time - s - m * 60) / 3600) % 24
    const d = (time - s - m * 60 - h * 3600) / 86400
    if (d) return `${d}天${pad02(h)}:${pad02(m)}:${pad02(s)}`
    return `${h}:${pad02(m)}:${pad02(s)}`
}

export function easeOut(curtime: number, begin: number, end: number, duration: number) {
    let x = curtime / duration
    let y = -x * x + 2 * x
    return begin + (end - begin) * y
}

export function countMap(length: number) {
    return new Map(new Array(length).fill(0).map((_, i) => [i, 0]))
}

type Grouper<K, T> = (item: T) => K
export function groupBy<K = any, T = any>(list: Iterable<T>, group: string | Grouper<K, T>) {
    const groups = new Map<K, T[]>()
    for (const item of list) {
        const key =
            typeof group == 'function' ? group(item) : ((item as Record<string, K>)[group] as K)
        if (groups.has(key)) groups.get(key)!.push(item)
        else groups.set(key, [item])
    }
    return groups
}

export function groupCount<K = any, T = any>(
    list: Iterable<T>,
    group: string | Grouper<K, T>,
    groups = new Map<K, number>()
) {
    for (const item of list) {
        const key =
            typeof group == 'function' ? group(item) : ((item as Record<string, K>)[group] as K)
        groups.set(key, (groups.get(key) || 0) + 1)
    }
    return groups
}
