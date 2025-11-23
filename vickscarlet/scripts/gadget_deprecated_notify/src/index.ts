import { addStyle, dom } from '@b38dev/dom'
import { db } from './db'
import { getGh } from '@b38dev/bangumi'
import { addSettingPanel } from './setting'
import css from './index.css?inline'

interface Gadget {
    id: string
    title: string
}

type GadgetList = Gadget[]
type GadgetMap = Map<string, string>

interface Gadgets {
    gadgets: GadgetList
    updated: number
}

async function getGadgets() {
    let key = 'gadgets'
    let cache = await db.get<Gadgets>('values', key)
    if (cache && Date.now() < cache.updated + 3600_000) return cache
    const ret = await fetch('/settings/gadgets')
    if (!ret.ok) throw new Error('无法获取小工具列表')
    const html = await ret.text()
    const element = document.createElement('html')
    element.innerHTML = html
    const gadgets = Array.from(element.querySelectorAll('ul.list_collected > li'))
        .map((li) => {
            const a = li.querySelector('a.title')
            if (!a) return null
            const title = a.textContent?.trim() || ''
            const id = a.getAttribute('href')?.split('/').pop() || ''
            return { id, title } as Gadget
        })
        .filter((v) => !!v)
    const updated = Date.now()
    const data = { gadgets, updated } as Gadgets
    await db.put('values', { key, ...data })
    return data
}

function isDeprecated(title: string) {
    title = title.toLowerCase()
    const deprecatedMarks = [
        'deprecated',
        '已弃用',
        '请停止使用',
        '已无用',
        '寿终正寝了',
        '停止更新',
        '停止维护',
        '不再维护',
        '废弃',
    ]
    for (const mark of deprecatedMarks) {
        if (title.includes(mark)) return true
    }
    return false
}

async function disableGadget(id: string, gh: string) {
    const ret = await fetch(`/dev/app/${id}/disable?gh=${gh}&ajax=1`)
    if (!ret.ok) return false
    const data = await ret.json().catch(() => ({}))
    const success = data.status == 'ok'
    if (success) {
        const { gadgets, updated } = await getGadgets()
        const newGadgets = gadgets.filter((gadget) => gadget.id !== id)
        await db.put('values', { key: 'gadgets', gadgets: newGadgets, updated })
    }
    return success
}

async function dismissGadget(gadget: Gadget) {
    const dismissed = (await db.get<Dismissed>('values', 'dismissed'))?.dismissed || new Map()
    dismissed.set(gadget.id, gadget.title)
    await db.put('values', { key: 'dismissed', dismissed })
}

interface Notified {
    time: number
}

interface Dismissed {
    dismissed: GadgetMap
}

async function main() {
    addSettingPanel()
    const notified = await db.get<Notified>('values', 'notified')
    if (notified && Date.now() < notified.time + 86400000) return
    let gh = getGh()
    if (!gh) return
    const { gadgets } = await getGadgets()
    const { dismissed } = (await db.get<Dismissed>('values', 'dismissed')) ?? {
        dismissed: new Map(),
    }
    const notify = []
    for (const gadget of gadgets) {
        if (dismissed.has(gadget.id)) continue
        if (!isDeprecated(gadget.title)) continue
        notify.push(gadget)
    }
    if (notify.length === 0) return
    addStyle(css)
    const container = dom.create('div', { id: 'vgdn-container' })
    const title = dom.create('div', { class: 'vgdn-title', textContent: '组件弃用提醒' })
    const closeBtn = dom.create('button', {
        class: 'vgdn-close-btn',
        textContent: '×',
        onclick: () => container.remove(),
    })
    const todayDismissBtn = dom.create('button', {
        class: ['vgdn-action', 'vgdn-btn-normal', 'vgdn-today-dismiss-btn'],
        textContent: '今日不再提醒',
        onclick: async () => {
            await db.put('values', { key: 'notified', time: Date.now() })
            container.remove()
        },
    })
    const list = dom.create('ul', { class: 'vgdn-list' })
    dom.append(
        list,
        ...notify.map((gadget) => {
            const item = dom.create('li', { class: 'vgdn-gadget' })
            const title = dom.create('span', {
                class: 'vgdn-gadget-title',
                textContent: gadget.title,
            })
            const id = dom.create('span', {
                class: ['vgdn-gadget-id', 'tip'],
                textContent: ` App ID: ${gadget.id}`,
            })
            const disableBtn = dom.create('button', {
                class: ['vgdn-action', 'vgdn-btn-danger'],
                textContent: '禁用',
                onclick: async () => {
                    const success = await disableGadget(gadget.id, gh)
                    if (success) item.remove()
                    if (list.children.length === 0) container.remove()
                },
            })
            const dismissBtn = dom.create('button', {
                class: ['vgdn-action', 'vgdn-btn-normal'],
                textContent: '忽略',
                onclick: async () => {
                    await dismissGadget(gadget)
                    item.remove()
                    if (list.children.length === 0) container.remove()
                },
            })
            const actions = dom.create('div', { class: 'vgdn-actions' }, disableBtn, dismissBtn)
            const info = dom.create('div', { class: 'vgdn-gadget-info' }, [
                'a',
                { href: `/dev/app/${gadget.id}`, target: '_blank' },
                title,
                id,
            ])
            dom.append(item, info, actions)
            return item
        })
    )
    dom.append(container, todayDismissBtn, closeBtn, title, list)
    dom.append(document.body, container)
}

main()
