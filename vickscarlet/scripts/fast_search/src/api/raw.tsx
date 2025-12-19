import type { SearchQueryWithPage, CommandValue, ApiProviders, Result } from '.'
import { SchemaToType, toURLSearchParams } from '@/util/param'
import { fetchText } from '.'

/** API Command Defined Start **/
export enum SubjectCommandEnum {
    subject = 'subject',
    anime = 'anime',
    book = 'book',
    music = 'music',
    game = 'game',
    real = 'real',
}
export enum SubjectCatalogEnum {
    subject = 'all',
    anime = '2',
    book = '1',
    music = '3',
    game = '4',
    real = '6',
}
export enum MonoCommandEnum {
    mono = 'mono',
    character = 'character',
    person = 'person',
}
export enum MonoCatalogEnum {
    mono = 'all',
    character = 'crt',
    person = 'prsn',
}
export interface SubjectCommandValue {
    // 全部 all
    subject: CommandValue<Subject, SearchSubjectParameters, SubjectExtra>
    // 动画 2
    anime: CommandValue<Subject, SearchSubjectParameters, SubjectExtra>
    // 书籍 1
    book: CommandValue<Subject, SearchSubjectParameters, SubjectExtra>
    // 音乐 3
    music: CommandValue<Subject, SearchSubjectParameters, SubjectExtra>
    // 游戏 4
    game: CommandValue<Subject, SearchSubjectParameters, SubjectExtra>
    // 三次元 6
    real: CommandValue<Subject, SearchSubjectParameters, SubjectExtra>
}
export interface MonoCommandValue {
    // 全部 all
    mono: CommandValue<Mono, SearchMonoParameters, MonoExtra>
    // 角色 crt
    character: CommandValue<Mono, SearchMonoParameters, MonoExtra>
    // 人物 prsn
    person: CommandValue<Mono, SearchMonoParameters, MonoExtra>
}
export type SubjectCommandMap = {
    [K in SubjectCommand]: SubjectCommandValue[K]
}
export type MonoCommandMap = {
    [K in MonoCommand]: MonoCommandValue[K]
}
export type RawCommandMap = SubjectCommandMap & MonoCommandMap
export type SubjectCommand = keyof typeof SubjectCommandEnum
export type MonoCommand = keyof typeof MonoCommandEnum
export type RawCommand = SubjectCommand | MonoCommand
export type SubjectCatalog = Exclude<SubjectCommand, 'subject'>
export type MonoCatalog = Exclude<MonoCommand, 'mono'>
export type RawCatalog = SubjectCatalog | MonoCatalog
/** API Command Defined End **/

/** API Response Item Start **/
export interface Subject {
    id: number
    catalog: SubjectCatalog
    title: string
    extra: string[]
    mark: SubjectMarkEnum
    titleSub?: string
    cover?: string
    rank?: number
    rate?: number
    ratePeople?: string
}
export interface PageExtra {
    page: {
        current: number
        total: number
    }
}
export interface SubjectExtra extends PageExtra {}

export interface Mono {
    id: number
    name: string
    chineseName?: string
    avatar?: string
    extra: string[]
    comment: number
    catalog: MonoCatalog
}
export interface MonoExtra extends PageExtra {}
/** API Response Item End **/

/** API Response Common Start **/
export enum SubjectMarkEnum {
    wish = 'wish',
    collect = 'collect',
    doing = 'doing',
    on_hold = 'on_hold',
    dropped = 'dropped',
}
/** API Response Common End **/

/** API Parameters Schema Start **/
export const SearchSubjectParametersSchema = {
    exact: { type: 'boolean', optional: true, description: '开启精准匹配', rename: 'legacy' },
} as const
export type SearchSubjectParameters = SchemaToType<typeof SearchSubjectParametersSchema>

export const SearchMonoParametersSchema = {} as const
export type SearchMonoParameters = SchemaToType<typeof SearchMonoParametersSchema>
/** API Parameters Schema End **/

function parsePageNumber(inner?: HTMLDivElement | null): PageExtra['page'] {
    if (!inner) {
        return { current: 1, total: 1 }
    }
    const p_edge = inner.querySelector<HTMLSpanElement>('span.p_edge')?.innerText
    if (p_edge) {
        const [current, total] = p_edge
            .match(/(\d+)\s*\/\s*(\d+)/)
            ?.slice(1)
            .map(Number) as [number, number]
        return { current, total }
    }
    const current = Number(inner.querySelector<HTMLSpanElement>('.p_cur')?.innerText) || 1
    const total =
        Array.from(inner.querySelectorAll<HTMLAnchorElement>('a.p'))
            .map((a) => {
                return Number(a.href.split('page=')[1]?.split('&')[0])
            })
            .sort((a, b) => b - a)[0] || current
    return { current, total }
}

interface RawSearchResult<T extends Element = Element> {
    items: T[]
    extra: PageExtra
}

async function fetchSearchPage<T extends Element = Element>(
    uri: string,
    itemSelector: string
): Promise<Result<RawSearchResult<T>>> {
    const res = await fetchText(uri)
    if (!res.success) return res
    const html = document.createElement('html')
    html.innerHTML = res.data
    const items = Array.from(html.querySelectorAll<T>(itemSelector))
    const extra = {
        page: parsePageNumber(html.querySelector<HTMLDivElement>('#multipage > .page_inner')),
    }
    return { success: true, data: { items, extra } }
}

const subjectCatalogMapping = new Map<string, SubjectCatalog>([
    ['1', 'book'],
    ['2', 'anime'],
    ['3', 'music'],
    ['4', 'game'],
    ['6', 'real'],
])

function revState(state = ''): SubjectMarkEnum | null {
    switch (state.match(/(想|过|在|搁|抛)/)?.[1]) {
        case '想':
            return SubjectMarkEnum.wish
        case '过':
            return SubjectMarkEnum.collect
        case '在':
            return SubjectMarkEnum.doing
        case '搁':
            return SubjectMarkEnum.on_hold
        case '抛':
            return SubjectMarkEnum.dropped
    }
    return null
}

async function parseSubjectPage<T extends SubjectCommand>(
    keyword: string,
    params: URLSearchParams
): Promise<SubjectCommandMap[T]['result']> {
    const res = await fetchSearchPage<HTMLElement>(
        `/subject_search/${encodeURIComponent(keyword)}?${params.toString()}`,
        '#browserItemList .item'
    )
    if (!res.success) return res
    const items = res.data.items.map((item) => {
        const id = Number(item.id.replace('item_', ''))
        const h3 = item.querySelector<HTMLHeadingElement>('.inner > h3')
        const cat = h3
            ?.querySelector<HTMLSpanElement>('.ico_subject_type')
            ?.className.match(/subject_type_(\d)/)?.[1]
        const catalog = subjectCatalogMapping.get(cat ?? '')
        const title = h3?.querySelector<HTMLAnchorElement>('a')?.innerText || ''
        const titleSub = h3?.querySelector<HTMLSpanElement>('small')?.innerText

        const cover = item.querySelector<HTMLImageElement>('.cover img')?.src
        const extra =
            item
                .querySelector<HTMLParagraphElement>('.inner > .info.tip')
                ?.innerText?.split(' / ')
                .map((s) => s.trim())
                .filter((s) => !!s) || []
        const rank = item.querySelector<HTMLSpanElement>('.rank')?.lastChild?.textContent
        const state = revState(
            item.querySelector<HTMLAnchorElement>('.collectModify a.thickbox')?.innerText
        )
        const rate = item.querySelector<HTMLSpanElement>('p.rateInfo small.fade')?.innerText
        const ratePeople = item.querySelector<HTMLSpanElement>('p.rateInfo span.tip_j')?.innerText
        return {
            id,
            catalog,
            title,
            titleSub,
            cover,
            extra,
            rank: rank ? Number(rank) : undefined,
            mark: state,
            rate: rate ? Number(rate) : undefined,
            ratePeople,
        } as Subject
    })

    return { success: true, data: { items, extra: res.data.extra } }
}

async function subjectSearch<T extends SubjectCommand>({
    query: { keywords, parameters, command },
    page = 1,
}: SearchQueryWithPage<T>) {
    const query = toURLSearchParams(parameters, { page, cat: SubjectCatalogEnum[command] })
    return parseSubjectPage(keywords.join(' '), query)
}

const monoCatalogMapping = new Map<string, MonoCatalog>([
    ['character', 'character'],
    ['person', 'person'],
])

async function parseMonoPage<T extends MonoCommand>(
    keyword: string,
    params: URLSearchParams
): Promise<MonoCommandMap[T]['result']> {
    const res = await fetchSearchPage<HTMLElement>(
        `/mono_search/${encodeURIComponent(keyword)}?${params.toString()}`,
        '#columnSearchB > div.clearit.light_odd'
    )
    if (!res.success) return res
    const items = res.data.items
        .map((item) => {
            const a = item.querySelector<HTMLAnchorElement>('div>h2>a.l')
            if (!a) return null
            const u = a.href.split('/').filter((s) => s)
            const id = Number(u.pop())
            const catalog = monoCatalogMapping.get(u.pop() ?? '')
            const chineseName = a.querySelector<HTMLSpanElement>('span.tip')?.textContent
            let name = a.childNodes[0].textContent || ''
            if (chineseName) name = name.substring(0, name.length - 3)
            const avatar = item.querySelector<HTMLImageElement>('img.avatar')?.src
            const extra =
                item
                    .querySelector<HTMLSpanElement>('div.prsn_info > .tip')
                    ?.innerText?.split(' / ')
                    .map((s) => s.trim())
                    .filter((s) => !!s) || []
            let comment =
                Number(
                    item
                        .querySelector<HTMLSpanElement>('div>small.na')
                        ?.innerText.replace('(+', '')
                        .replace(')', '')
                ) || 0

            return {
                catalog,
                id,
                name,
                chineseName,
                avatar,
                extra,
                comment,
            } as Mono
        })
        .filter((i): i is Mono => i !== null)

    return { success: true, data: { items, extra: res.data.extra } }
}

async function monoSearch<T extends MonoCommand>({
    query: { keywords, parameters, command },
    page = 1,
}: SearchQueryWithPage<T>) {
    const query = toURLSearchParams(parameters, { page, cat: MonoCatalogEnum[command] })
    return parseMonoPage(keywords.join(' '), query)
}

const subjectApi: ApiProviders<SubjectCommand> = {
    subject: {
        description: '条目',
        search: subjectSearch,
        schema: SearchSubjectParametersSchema,
    },
    anime: {
        description: '动画',
        search: subjectSearch,
        schema: SearchSubjectParametersSchema,
    },
    book: {
        description: '书籍',
        search: subjectSearch,
        schema: SearchSubjectParametersSchema,
    },
    music: {
        description: '音乐',
        search: subjectSearch,
        schema: SearchSubjectParametersSchema,
    },
    game: {
        description: '游戏',
        search: subjectSearch,
        schema: SearchSubjectParametersSchema,
    },
    real: {
        description: '三次元',
        search: subjectSearch,
        schema: SearchSubjectParametersSchema,
    },
}

const monoApi: ApiProviders<MonoCommand> = {
    mono: {
        description: '人物',
        search: monoSearch,
        schema: SearchMonoParametersSchema,
    },
    character: {
        description: '虚拟角色',
        search: monoSearch,
        schema: SearchMonoParametersSchema,
    },
    person: {
        description: '现实人物',
        search: monoSearch,
        schema: SearchMonoParametersSchema,
    },
}

export const api: ApiProviders<RawCommand> = Object.assign({}, subjectApi, monoApi)

export default api
