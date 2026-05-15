import { callNow, callWhenDone } from '@b38dev/util'
import { dom } from '@b38dev/dom'
import { addStyle, removeAllChildren } from '@b38dev/dom'
import { Event } from '@b38dev/event'
import { database, db } from './database'
import { formatSubType, SubTypes, Types, uid } from './config'
import { countMap, easeOut, groupBy, groupCount, timeFormat } from './utils'
import { element2Canvas } from './third-party'
import { collects, ft, totalTime } from './data'
import css from './index.css?inline'
import Star from './star.svg?inline'
addStyle(css)

const PRG = ['|', '/', '-', '\\']

async function showCanvas(element: Element) {
    const canvas = await element2Canvas(element)
    const close = dom.create('div', { style: { height: canvas.style.height } })!
    const main = dom.create('div', { id: 'kotori-report-canvas' }, close, canvas)!
    close.addEventListener('click', () => main.remove())
    document.body.appendChild(main)
}
function pw(v: number, m: number) {
    return { style: { width: (v * 100) / m + '%' } }
}

interface FormatItem {
    name: string
    count: number
    time: number
}
interface BTO {
    total: FormatItem
    normal: FormatItem
    guess: FormatItem
    unknown: FormatItem
}

/** 生成题头时间统计 **/
function buildTotalTime({ total, normal, guess, unknown }: BTO): dom.AppendParams {
    const list = [total, normal, guess, unknown].sort((a, b) => b.time - a.time)
    const format = ({ name, count, time }: FormatItem) =>
        `${timeFormat(time, true)} (${count})${name}`
    const buildItem = (item: FormatItem): dom.AppendParams => [
        'li',
        ['div', format(item)],
        ['div', ['div', pw(item.time, total.time)]],
    ]
    return ['ul', { class: ['total-time', 'bars', 'rb'] }, ...list.map(buildItem)]
}

/** 生成题头统计数据 **/
function buildIncludes(list: Iterable<[SubTypes, number]>, type: Types) {
    type FormattedItem = [string, number]
    const l = Array.from(list).map<FormattedItem>(([k, v]) => [formatSubType(k, type), v])
    const total = l.reduce((sum, [_, v]) => sum + v, 0)
    l.unshift(['总计', total])
    l.sort((a, b) => b[1] - a[1])
    const format = (k: string, v: number) => k + ':' + ('' + v).padStart(5, ' ') + Types[type].unit
    const buildItem = ([k, v]: FormattedItem): dom.AppendParams => [
        'li',
        ['div', format(k, v)],
        ['div', ['div', pw(v, total)]],
    ]
    return ['ul', { class: ['includes', 'bars', 'lb'] }, ...l.map(buildItem)] as dom.AppendParams
}

type BarItem = [number, string | number, number]
/** 生成条形图 **/
function buildBarList(list: Iterable<BarItem>): dom.AppendParams {
    const l = Array.from(list).sort(([, , a], [, , b]) => a - b)
    const m = Math.max(...l.map(([v]) => v))
    const buildItem = ([v, t]: BarItem) =>
        ['li', ['span', t], ['span', v], ['div', pw(v, m)]] as dom.AppendParams
    return ['ul', { class: 'bars' }, ...l.map(buildItem)] as dom.AppendParams
}

/** 生成封面列表 **/
function buildCoverList(list: database.PageItem[], type: Types): dom.AppendParams {
    let last = -1
    const covers = [] as dom.AppendParams[]
    for (const { img, month, star } of list) {
        const childs = [['img', { src: img }]] as dom.AppendParams[]
        if (month != last) {
            childs.push(['span', month + 1 + '月'] as dom.AppendParams)
            last = month
        }
        if (star)
            childs.push([
                'div',
                { class: 'star' },
                ['img', { src: Star }],
                ['span', star],
            ] as dom.AppendParams)
        covers.push(['li', ...childs])
    }
    return ['ul', { class: 'covers', type }, ...covers]
}

interface LTR {
    type: Types
    subTypes: SubTypes[]
    tag?: string
    totalTime?: boolean
}
/**
 * 根据参数生成生涯总览
 * 根据 tag 过滤数据
 */
async function buildLifeTimeReport({ type, tag, subTypes, totalTime: ttt }: LTR) {
    const list = await collects({ type, subTypes, tag })
    const time = ttt ? await totalTime(list) : null

    const buildYearCover = ([year, l]: [number, database.PageItem[]]) =>
        ['li', ['h2', year + '年', ['span', l.length]], buildCoverList(l, type)] as dom.AppendParams
    const banner = [
        'div',
        { class: 'banner' },
        ['h1', `Bangumi ${Types[type].name}生涯总览`],
        ['span', { class: 'uid' }, '@' + uid],
        buildIncludes(groupCount<SubTypes>(list, 'subType').entries(), type),
    ] as dom.CreateParams
    if (time) banner.push(buildTotalTime(time))
    const countList = buildBarList(
        groupCount<number>(list, 'month', countMap(12))
            .entries()
            .map(([k, v]) => [v, k + 1 + '月', k])
    )
    const starList = buildBarList(
        groupCount<number>(list, 'star', countMap(11))
            .entries()
            .map(([k, v]) => [v, k ? k + '星' : '未评分', k])
    )
    const barGroup = ['div', { class: 'bar-group' }, countList, starList] as dom.AppendParams
    const yearCover = [
        'ul',
        { class: 'year-cover' },
        ...groupBy<number>(list, 'year').entries().map(buildYearCover),
    ] as dom.AppendParams

    return dom.create('div', { class: 'content' }, banner, barGroup, yearCover)
}

interface YR {
    year: number
    type: Types
    subTypes: SubTypes[]
    tag?: string
    totalTime?: boolean
}
/**
 * 根据参数生成年鉴
 * 根据 tag 过滤数据
 */
async function buildYearReport({ year, type, tag, subTypes, totalTime: t }: YR) {
    const list = await collects({ type, subTypes, tag, year })
    const time = t ? await totalTime(list) : null

    const banner = [
        'div',
        { class: 'banner' },
        ['h1', `${year}年 Bangumi ${Types[type].name}年鉴`],
        ['span', { class: 'uid' }, '@' + uid],
        buildIncludes(groupCount(list, 'subType').entries(), type),
    ] as dom.CreateParams
    if (time) banner.push(buildTotalTime(time))
    const countList = buildBarList(
        groupCount(list, 'month', countMap(12))
            .entries()
            .map(([k, v]) => [v, k + 1 + '月', k])
    ) as dom.AppendParams
    const starList = buildBarList(
        groupCount(list, 'star', countMap(11))
            .entries()
            .map(([k, v]) => [v, k ? k + '星' : '未评分', k])
    ) as dom.AppendParams
    const barGroup = ['div', { class: 'bar-group' }, countList, starList] as dom.AppendParams

    return dom.create('div', { class: 'content' }, banner, barGroup, buildCoverList(list, type))
}

/**
 * 根据参数生成报告
 * 根据 tag 过滤数据
 * isLifeTime 为 true 时生成生涯报告否则生成年鉴
 * @returns {Promise<void>}
 */
async function buildReport(options: YR & LTR & { isLifeTime: boolean }) {
    Event.emit('process', { type: 'start', data: options })
    const content = await (options.isLifeTime
        ? buildLifeTimeReport(options)
        : buildYearReport(options))
    Event.emit('process', { type: 'done' })
    const close = dom.create('div', { class: 'close' })
    const scroll = dom.create('div', { class: 'scroll' }, content!)
    const save = dom.create('div', { class: 'save' })
    const report = dom.create('div', { id: 'kotori-report' }, close, scroll, save)

    const saveFn = async () => {
        save.onclick = null
        await showCanvas(content!)
        save.onclick = saveFn
    }
    let ly = scroll.scrollTop || 0
    let my = ly
    let ey = ly
    let interval = 0
    const scrollFn = (iey: number) => {
        ey = Math.max(Math.min(iey, scroll.scrollHeight - scroll.offsetHeight), 0)
        ly = my
        if (interval) clearInterval(interval)
        let times = 1
        interval = setInterval(() => {
            if (times > 50) {
                clearInterval(interval)
                interval = 0
                return
            }
            my = easeOut(times, ly, ey, 50)
            scroll.scroll({ top: my })
            times++
        }, 1)
    }
    const wheelFn = (e: WheelEvent) => {
        e.preventDefault()
        scrollFn(ey + e.deltaY)
    }
    const keydownFn = (e: KeyboardEvent) => {
        e.preventDefault()
        if (e.key == 'Escape') close.click()
        if (e.key == 'Home') scrollFn(0)
        if (e.key == 'End') scrollFn(scroll.scrollHeight - scroll.offsetHeight)
        if (e.key == 'ArrowUp') scrollFn(ey - 100)
        if (e.key == 'ArrowDown') scrollFn(ey + 100)
        if (e.key == 'PageUp') scrollFn(ey - scroll.offsetHeight)
        if (e.key == 'PageDown') scrollFn(ey + scroll.offsetHeight)
    }
    scroll.addEventListener('wheel', wheelFn)
    close.addEventListener('wheel', wheelFn)
    save.addEventListener('wheel', wheelFn)
    document.addEventListener('keydown', keydownFn)
    save.addEventListener('click', saveFn)
    close.addEventListener('click', () => {
        document.removeEventListener('keydown', keydownFn)
        report.remove()
    })
    document.body.appendChild(report)
}
// REPORT END

// MENU START
/**
 * 生成菜单
 */
function buildMenu() {
    const year = new Date().getFullYear()
    const yearSelectOptions = new Array(year - 2007)
        .fill(0)
        .map((_, i) => ['option', { value: '' + (year - i) }, year - i] as dom.CreateParams)
    const lifeTimeCheck = dom.create('input', {
        type: 'checkbox',
        id: 'lftc',
    })
    const totalTimeCheck = dom.create('input', {
        type: 'checkbox',
        id: 'tltc',
    })
    const yearSelect = dom.create('select', {}, ...yearSelectOptions)
    const typeSelect = dom.create(
        'select',
        {},
        ...Object.entries(Types).map(
            ([_, { value, name }]) => ['option', { value }, name] as dom.CreateParams
        )
    )
    const tagSelect = dom.create('select', ['option', { value: '' }, '不筛选'])
    const btnGo = dom.create('div', { class: ['v-report-btn', 'primary'] }, '生成')
    const btnClr = dom.create('div', { class: ['v-report-btn', 'v-report', 'warning'] }, '清理缓存')
    const btnGroup = ['div', { class: 'btn-group' }, btnGo, btnClr] as dom.AppendParams
    const additionField = [
        'fieldset',
        ['legend', '附加选项'],
        ['div', lifeTimeCheck, ['label', { htmlFor: 'lftc' }, '生涯报告']],
        ['div', totalTimeCheck, ['label', { htmlFor: 'tltc' }, '看过时长(耗时)']],
    ] as dom.AppendParams
    const ytField = [
        'fieldset',
        ['legend', '选择年份与类型'],
        yearSelect,
        typeSelect,
    ] as dom.AppendParams
    const tagField = ['fieldset', ['legend', '选择过滤标签'], tagSelect] as dom.AppendParams
    const subtypeField = dom.create(
        'fieldset',
        ['legend', '选择包括的状态'],
        ...Object.entries(SubTypes).map(
            ([_, { value, name, checked }]) =>
                [
                    'div',
                    { 'data-value': value },
                    [
                        'input',
                        {
                            type: 'checkbox',
                            id: 'yst_' + value,
                            name,
                            value,
                            checked,
                        },
                    ],
                    ['label', { htmlFor: 'yst_' + value }, name],
                ] as dom.CreateParams
        )
    )
    const eventInfo = dom.create('li')
    const menu = dom.create(
        'ul',
        { id: 'kotori-report-menu' },
        ['li', additionField],
        ['li', ytField],
        ['li', tagField],
        ['li', subtypeField],
        ['li', btnGroup],
        eventInfo
    )

    Event.on(
        'process',
        (() => {
            let type: Types
            let zone = [0, 0]
            let subtype: SubTypes
            let subtypes: SubTypes[]
            let pz = false
            let totalTimeCount = 0

            return ({ type: t, data }) => {
                switch (t) {
                    case 'start':
                        type = data.type
                        subtypes = data.subTypes
                        eventInfo.innerText = ''
                        pz = false
                        break
                    case 'collSubtype':
                        subtype = data.subtype
                        pz = false
                        break
                    case 'bsycs':
                        eventInfo.innerText = `二分搜索[${formatSubType(subtype, type)}] (${
                            data.p
                        })`
                        break
                    case 'collZone':
                        zone = data.zone
                        pz = true
                        break
                    case 'parse':
                        if (!pz) return
                        eventInfo.innerText =
                            `正在解析[${formatSubType(subtype, type)}] (` +
                            (data.p - zone[0] + 1) +
                            '/' +
                            (zone[1] - zone[0] + 1) +
                            ')(' +
                            (subtypes.indexOf(subtype) + 1) +
                            '/' +
                            subtypes.length +
                            ')'
                        break
                    case 'done':
                        eventInfo.innerText = ''
                        pz = false
                        break
                    case 'tags':
                        eventInfo.innerText = `获取标签 [${Types[data.type as Types].name}]`
                        break
                    case 'totalTime':
                        totalTimeCount = data.total
                        break
                    case 'totalTimeItem':
                        eventInfo.innerText = `获取条目时长 (${data.count}/${totalTimeCount}) (id: ${data.id})`
                        break
                    default:
                        return
                }
            }
        })()
    )

    lifeTimeCheck.addEventListener('change', () => {
        if (lifeTimeCheck.checked) yearSelect.disabled = true
        else yearSelect.disabled = false
    })
    typeSelect.addEventListener(
        'change',
        callNow(async () => {
            const type = typeSelect.value as Types
            if (!type) return
            totalTimeCheck.disabled = type !== 'anime'
            subtypeField.querySelectorAll<HTMLDivElement>('div').forEach((e) => {
                const name = formatSubType(e.getAttribute('data-value') as SubTypes, type)
                e.querySelector('input')!.setAttribute('name', name)
                e.querySelector('label')!.innerText = name
            })
            const tags = (await ft(type))!
            if (type != typeSelect.value) return
            const last = tagSelect.value
            removeAllChildren(tagSelect)
            tagSelect.append(dom.create('option', { value: '' }, '不筛选'))
            dom.append(
                tagSelect,
                ...tags.map((t) => ['option', { value: t }, t] as dom.AppendParams)
            )
            if (tags.includes(last)) tagSelect.value = last
        })
    )
    btnGo.addEventListener(
        'click',
        callWhenDone(async () => {
            const type = (typeSelect.value as Types) || 'anime'
            await buildReport({
                type,
                subTypes: Array.from(
                    subtypeField.querySelectorAll<HTMLInputElement>('input:checked')
                ).map((e) => e.value as SubTypes),
                isLifeTime: lifeTimeCheck.checked,
                totalTime: type === 'anime' && totalTimeCheck.checked,
                year: parseInt(yearSelect.value) || year,
                tag: tagSelect.value,
            })
            menuToggle()
        })
    )
    btnClr.addEventListener(
        'click',
        callWhenDone(async () => {
            let i = 0
            const id = setInterval(() => (btnClr.innerText = `清理缓存中[${PRG[i++ % 4]}]`), 50)
            await db.clear('pages')
            clearInterval(id)
            btnClr.innerText = '清理缓存'
        })
    )

    document.body.appendChild(menu)
    return menu
}

let menu: HTMLElement | null = null
/**
 * 切换菜单显隐
 */
function menuToggle() {
    menu ??= buildMenu()
    menu.style.display = menu.style.display == 'block' ? 'none' : 'block'
}
// MENU END
;(async () => {
    await db.init()
    const btn = dom.create(
        'a',
        { class: 'chiiBtn', href: 'javascript:void(0)', title: '生成年鉴' },
        ['span', '生成年鉴']
    )!
    btn.addEventListener('click', menuToggle)
    document.querySelector('#headerProfile .actions')!.append(btn)
})()
