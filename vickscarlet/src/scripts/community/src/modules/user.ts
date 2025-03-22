import { db, database } from '@/modules/database'
import { whoami } from '@common/bangumi'
import { newTab } from '@common/dom'
let blockeds: Set<string> | null = null

export const getBlockeds = (() => {
    let peddings: ((blockeds: Set<string>) => void)[] | null = null

    const queryDB = async () => {
        const list = await db.getAllKeys('users', 1, void 0, 'blocked')
        blockeds = new Set(list as string[])
        for (const pedding of peddings!) pedding(blockeds)
        peddings = null
    }
    return async () => {
        if (blockeds) return blockeds
        const p = peddings ?? []
        const pedding = new Promise<Set<string>>((resolve) => p.push(resolve))
        if (!peddings) {
            peddings = p
            queryDB()
        }
        return pedding
    }
})()

export async function isBlocked(id: string) {
    const data = await db.get<database.User>('users', id)
    const isBlocked = !!data?.blocked
    if (!blockeds) return isBlocked
    if (isBlocked) blockeds.add(id)
    else blockeds.delete(id)
    return isBlocked
}

export async function block(id: string) {
    if (!confirm('确定要屏蔽吗？')) return false
    const data = (await db.get<database.User>('users', id)) ?? { id }
    await db.put('users', { ...data, blocked: 1 })
    if (blockeds) blockeds.add(id)
    return true
}

export async function unblock(id: string) {
    if (!confirm('确定要解除屏蔽吗？')) return false
    const data = await db.get<database.User>('users', id)
    if (!data) return true
    delete data.blocked
    if (Object.keys(data).length > 1) await db.put('users', data)
    else await db.delete('users', id)
    if (blockeds) blockeds.delete(id)
    return true
}

export async function connect(nid: string, gh: string) {
    if (!confirm('真的要加好友吗？')) return false
    const ret = await fetch(`/connect/${nid}?gh=${gh}`)
    return ret.ok
}

export async function disconnect(nid: string, gh: string) {
    if (!confirm('真的要解除好友吗？')) return false
    const ret = await fetch(`/disconnect/${nid}?gh=${gh}`)
    return ret.ok
}

export async function usednames(id: string) {
    const data =
        (await db.get<database.UsedName>('usednames', id)) ||
        ({
            id,
            names: new Set(),
        } as database.UsedName)
    if (data.update < Date.now() - 3600_000) return data.names
    const getUsedNames = async (
        end: string,
        tml?: string,
        ret: string[] = [],
        page = 1
    ) => {
        const res = await fetch(
            `/user/${id}/timeline?type=say&ajax=1&page=${page}`
        )
        const html = await res.text()
        const names = Array.from(
            html.matchAll(/从 \<strong\>(?<from>.*?)\<\/strong\> 改名为/g),
            (m) => m.groups?.from ?? ''
        )
        const tmls = Array.from(
            html.matchAll(
                /\<h4 class="Header"\>(?<tml>\d{4}\-\d{1,2}\-\d{1,2})\<\/h4\>/g
            ),
            (m) => m.groups?.tml ?? ''
        )
        if (!tml) tml = tmls[0]
        ret.push(...names)
        if (
            tmls.includes(end) ||
            !html.includes('>下一页 &rsaquo;&rsaquo;</a>')
        )
            return { ret, tml }
        return getUsedNames(end, tml, ret, page + 1)
    }
    const { ret, tml } = await getUsedNames(data.tml)
    const update = Date.now()
    const names = new Set(ret).union(data.names)
    names.delete('')
    await db.put('usednames', { id, names, update, tml })
    return names
}

interface StatWithValue {
    value: string
}
interface StatColl extends StatWithValue {
    type: 'coll'
    name: '收藏'
}
interface StatDone extends StatWithValue {
    type: 'done'
    name: '完成'
}
interface StatRate extends StatWithValue {
    type: 'rate'
    name: '完成率'
}
interface StatAvg extends StatWithValue {
    type: 'avg'
    name: '平均分'
}
interface StatStd extends StatWithValue {
    type: 'std'
    name: '标准差'
}
interface StatCnt extends StatWithValue {
    type: 'cnt'
    name: '评分数'
}
export type Stat = StatColl | StatDone | StatRate | StatAvg | StatStd | StatCnt
export interface Chart {
    label: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
    value: number
}
export interface BaseHomePage {
    name: string
    src: string
    bio: Element | null
    stats: Stat[]
    chart: Chart[]
    nid?: string
    gh?: string
}
export interface LessHomePage extends BaseHomePage {
    type: 'guest' | 'self'
    nid: undefined
    gh: undefined
}

export interface DetialHomePage extends BaseHomePage {
    type: 'normal' | 'friend'
    nid: string
    gh: string
}

export type HomePage = LessHomePage | DetialHomePage

export async function homepage(id: string) {
    const res = await fetch('/user/' + id)
    const me = whoami()
    if (!res.ok) return null
    const html = await res.text()
    const element = document.createElement('html')
    element.innerHTML = html.replace(/<(img|script|link)/g, '<noload')
    const nameSingle = element.querySelector('#headerProfile .nameSingle')
    const bio = element.querySelector('.bio')
    bio?.classList.remove('bio')
    const name = nameSingle!.querySelector<HTMLElement>('.name a')!.innerText
    const src = nameSingle!
        .querySelector<HTMLElement>('.headerAvatar .avatar span')!
        .style!.backgroundImage.replace('url("', '')
        .replace('")', '')
    const pinnedLayout = element.querySelector('#pinnedLayout')
    const stats = Array.from(
        pinnedLayout!.querySelectorAll('.gridStats > .item'),
        (e) => {
            const name = (e!.lastElementChild! as HTMLElement).innerText
            let type
            switch (name) {
                case '收藏':
                    type = 'coll'
                    break
                case '完成':
                    type = 'done'
                    break
                case '完成率':
                    type = 'rate'
                    break
                case '平均分':
                    type = 'avg'
                    break
                case '标准差':
                    type = 'std'
                    break
                case '评分数':
                    type = 'cnt'
                    break
            }
            return {
                type,
                name,
                value: (e!.firstElementChild! as HTMLElement).innerText,
            } as Stat
        }
    )
    const chart = Array.from(
        pinnedLayout!.querySelectorAll('#ChartWarpper li > a'),
        (e) => {
            return {
                label: (e!.firstElementChild! as HTMLElement).innerText,
                value: parseInt(
                    (e!.lastElementChild! as HTMLElement).innerText.replace(
                        /[\(\)]/g,
                        ''
                    )
                ),
            } as Chart
        }
    )
    if (me!.nid == 0)
        return { type: 'guest', name, src, bio, stats, chart } as HomePage
    if (me!.id == id)
        return { type: 'self', name, src, bio, stats, chart } as HomePage
    const actions = nameSingle!.querySelectorAll<HTMLAnchorElement>(
        '#headerProfile .actions a.chiiBtn'
    )

    const nid = actions[1].href.split('/').pop()?.replace('.chii', '') ?? ''
    const friend = actions[0].innerText == '解除好友'
    const gh = friend
        ? actions[0].getAttribute('onclick')?.split(',').pop()?.split(/['"]/)[1]
        : actions[0].href.split('gh=').pop()
    const type = friend ? 'friend' : 'normal'
    return { type, name, src, bio, nid, gh: gh ?? '', stats, chart } as HomePage
}

export async function getNote(id: string) {
    return (await db.get<database.User>('users', id))?.note || ''
}

export async function setNote(id: string, note: string) {
    const data = await db.get<database.User>('users', id)
    if (!data) {
        if (note) await db.put('users', { id, note })
        return note
    }
    if (note) data.note = note
    else delete data.note

    if (Object.keys(data).length > 1) await db.put('users', data)
    else await db.delete('users', id)

    return note
}

export async function getTags(id: string) {
    return (await db.get<database.User>('users', id))?.tags || new Set()
}

export async function setTagsByString(id: string, tags: string) {
    return setTags(
        id,
        tags.split('\n').map((tag) => tag.trim())
    )
}

export async function setTags(id: string, tags: Iterable<string>) {
    const tagset = new Set(tags)
    tagset.delete('')

    const data = await db.get<database.User>('users', id)
    if (!data) {
        if (tagset.size) await db.put('users', { id, tags: tagset })
        return tagset
    }
    if (tagset.size) data.tags = tagset
    else delete data.tags

    if (Object.keys(data).length > 1) await db.put('users', data)
    else await db.delete('users', id)

    return tagset
}

export function goHome(id: string) {
    newTab('/user/' + id)
}

export function goPm(nid: string) {
    newTab('/pm/compose/' + nid + '.chii')
}

export function goLogin() {
    newTab('/login')
}
