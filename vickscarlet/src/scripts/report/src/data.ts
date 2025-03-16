import { Event } from '@common/event'
import { db, database } from './database'
import { uid, AnimeTypeTimes, type AnimeTypes } from './config'

/** 获取页面Element **/
export async function f(url: string) {
    Event.emit('process', { type: 'fetch', data: { url } })
    const html = await fetch(window.location.origin + '/' + url).then((res) => res.text())
    if (html.includes('503 Service Temporarily Unavailable')) return null
    const e = document.createElement('html')
    e.innerHTML = html.replace(/<img (.*)\/?>/g, '<span class="img" $1></span>')
    return e
}

/** 获取页面数据 **/
export async function fl(type: string, subType: string, p = 1, expire = 30) {
    Event.emit('process', { type: 'parse', data: { type, subType, p } })
    const url = `${type}/list/${uid}/${subType}?page=${p}`
    let data = await db.get<database.Page>('pages', url)
    if (data && data.time + expire * 60000 > Date.now()) return data

    const e = await f(url)
    if (!e) return null
    const list = Array.from(e.querySelectorAll('#browserItemList > li')).map(
        (li): database.PageItem => {
            const id = li.querySelector<HTMLAnchorElement>('a')!.href.split('/').pop()!
            const t = li.querySelector('h3')!
            const title = t.querySelector<HTMLAnchorElement>('a')!.innerText
            const jp_title = t.querySelector<HTMLElement>('small')?.innerText
            const img =
                li.querySelector('span.img')?.getAttribute('src')!.replace('cover/c', 'cover/l') ||
                '//bgm.tv/img/no_icon_subject.png'
            const time = new Date(li.querySelector<HTMLSpanElement>('span.tip_j')!.innerText)
            const year = time.getFullYear()
            const month = time.getMonth()
            const star =
                parseInt(
                    li.querySelector('span.starlight')?.className.match(/stars(\d{1,2})/)![1]!
                ) || 0
            const tags =
                li
                    .querySelector('span.tip')
                    ?.textContent!.trim()
                    .match(/标签:\s*(.*)/)?.[1]
                    .split(/\s+/) || []
            return { id, subType, title, jp_title, img, time, year, month, star, tags }
        }
    )
    const edge = e.querySelector('span.p_edge')
    let max
    if (edge) {
        max = Number(edge.textContent!.match(/\/\s*(\d+)\s*\)/)?.[1] || 1)
    } else {
        const ap = e.querySelectorAll<HTMLAnchorElement>('a.p')
        if (ap.length == 0) {
            max = 1
        } else {
            let cursor = ap[ap.length - 1]
            if (cursor.innerText == '››')
                cursor = cursor.previousElementSibling as HTMLAnchorElement
            max = Number(cursor.textContent) || 1
        }
    }
    const time = Date.now()
    data = { url, list, max, time } as database.Page
    if (p == 1) {
        const tags = Array.from(e.querySelectorAll('#userTagList > li > a.l')).map(
            (l) => l.childNodes[1].textContent!
        )
        data.tags = tags
    }
    await db.put('pages', data)
    return data
}

/** 根据类型获取tag列表 **/
export async function ft(type: string) {
    Event.emit('process', { type: 'tags', data: { type } })
    const data = await fl(type, 'collect')
    return data?.tags
}

// calc time
export function calcTime(s: string) {
    let m = /[时片]长:\s*(\d{2}):(\d{2}):(\d{2})/.exec(s)
    if (m) return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3])
    m = /[时片]长:\s*(\d{2}):(\d{2})/.exec(s)
    if (m) return parseInt(m[1]) * 60 + parseInt(m[2])
    m = /[时片]长:\s*(\d+)\s*[m分]/.exec(s)
    if (m) return parseInt(m[1]) * 60
    return 0
}

export async function ftime(id: string) {
    let data = (await db.get<database.Time>('times', id))!
    if (data) {
        if (data.time) {
            const { time } = data as database.CacluatedTime
            return { a: true, time }
        } else {
            const { eps, type } = data as database.TypedTime
            const time = eps * AnimeTypeTimes[type] || 0
            return { a: false, time }
        }
    }
    const e = (await f(`subject/${id}/ep`))!
    const c = <L extends NodeListOf<HTMLElement>>(l: L) =>
        Array.from(l).reduce((a, e) => a + calcTime(e.innerText), 0)
    let time = c(e.querySelectorAll<HTMLElement>('ul.line_list > li > small.grey'))
    if (time) {
        data = { id, time }
        await db.put('times', data)
        return { time, a: true }
    }
    const se = (await f(`subject/${id}`))!
    time = c(se.querySelectorAll<HTMLLIElement>('ul#infobox > li'))
    if (time) {
        data = { id, time }
        await db.put('times', data)
        return { time, a: true }
    }
    const type = se.querySelector('h1.nameSingle > small')?.textContent! as AnimeTypes
    const eps = e.querySelectorAll('ul.line_list > li > h6').length

    data = { id, type, eps }
    await db.put('times', data)
    return { time: eps * AnimeTypeTimes[type] || 0, a: false }
}

export async function totalTime(list: database.PageItem[]) {
    const total = {
        total: { name: '总计', time: 0, count: 0 },
        normal: { name: '精确', time: 0, count: 0 },
        guess: { name: '推测', time: 0, count: 0 },
        unknown: { name: '未知', time: 0, count: 0 },
    }
    Event.emit('process', { type: 'totalTime', data: { total: list.length } })
    for (const { id } of list) {
        Event.emit('process', {
            type: 'totalTimeItem',
            data: { id, count: total.total.count + 1 },
        })
        const { time, a } = await ftime(id)
        if (a) {
            total.normal.count++
            total.normal.time += time
        } else if (time) {
            total.guess.count++
            total.guess.time += time
        } else {
            total.unknown.count++
        }
        total.total.count++
        total.total.time += time
    }
    return total
}

/**
 * 二分搜索年份页面范围
 * 使用尽可能减少请求次数的算法
 */
export async function bsycs(type: string, subtype: string, year: number) {
    const data = await fl(type, subtype)
    if (!data) return [1, 1]
    const { max } = data
    let startL = 1
    let startR = 1
    let endL = max
    let endR = max
    let dL = false
    let dR = false

    while (startL <= endL && startR <= endR) {
        const mid =
            startL < endL
                ? Math.max(Math.min(Math.floor((startL + endL) / 2), endL), startL)
                : Math.max(Math.min(Math.floor((startR + endR) / 2), endR), startR)
        Event.emit('process', {
            type: 'bsycs',
            data: { type, subtype, p: mid },
        })
        const data = await fl(type, subtype, mid)
        if (!data) return [1, 1]
        const { list } = data
        if (list.length == 0) return [1, 1]
        const first = list[0].year
        const last = list[list.length - 1].year
        if (first > year && last < year) return [mid, mid]

        if (last > year) {
            if (!dL) startL = Math.min(mid + 1, endL)
            if (!dR) startR = Math.min(mid + 1, endR)
        } else if (first < year) {
            if (!dL) endL = Math.max(mid - 1, startL)
            if (!dR) endR = Math.max(mid - 1, startR)
        } else if (first == last) {
            if (!dL) endL = Math.max(mid - 1, startL)
            if (!dR) startR = Math.min(mid + 1, endR)
        } else if (first == year) {
            startR = endR = mid
            if (!dL) endL = Math.min(mid + 1, endR)
        } else if (last == year) {
            startL = endL = mid
            if (!dR) startR = Math.min(mid + 1, endR)
        }
        if (startL == endL) dL = true
        if (startR == endR) dR = true
        if (dL && dR) return [startL, startR]
    }
    return [1, 1]
}

/** 获取指定类型的数据列表 **/
export async function cbt(type: string, subtype: string, year = 0) {
    if (!year) return cbtAll(type, subtype)
    return cbtYear(type, subtype, year)
}

/** 获取指定类型与年份的数据列表 **/
export async function cbtYear(type: string, subtype: string, year: number) {
    const [start, end] = await bsycs(type, subtype, year)
    Event.emit('process', { type: 'collZone', data: { zone: [start, end] } })
    const ret = []
    for (let i = start; i <= end; i++) {
        const data = await fl(type, subtype, i)
        if (data) ret.push(data.list)
    }
    return ret.flat()
}

/** 获取指定类型的数据列表 **/
export async function cbtAll(type: string, subtype: string) {
    const data = await fl(type, subtype, 1)
    if (!data) return []
    const { list, max } = data
    Event.emit('process', { type: 'collZone', data: { zone: [1, max] } })
    const ret = [list]
    for (let i = 2; i <= max; i++) {
        const data = await fl(type, subtype, i)
        if (data) ret.push(data.list)
    }
    return ret.flat()
}

export interface CollectOptions {
    type: string
    subTypes: string[]
    tag?: string
    year?: number
}
/**
 * 根据参数获取数据列表
 * 根据 tag 过滤数据
 * 根据 time 进行排序
 */
export async function collects({ type, subTypes, tag, year }: CollectOptions) {
    const ret = []
    for (const subtype of subTypes) {
        Event.emit('process', { type: 'collSubtype', data: { subtype } })
        const list = await cbt(type, subtype, year)
        ret.push(list)
    }
    const fset = new Set()
    return ret
        .flat()
        .filter(({ id, year: y, tags }) => {
            if (year && year != y) return false
            if (tag && !tags.includes(tag)) return false
            if (fset.has(id)) return false
            fset.add(id)
            return true
        })
        .sort(({ time: a }, { time: b }) => b.getTime() - a.getTime())
}
