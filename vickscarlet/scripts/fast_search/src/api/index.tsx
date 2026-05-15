import * as rymk from './rymk'
import * as raw from './raw'
import * as param from '@/util/param'
import * as tips from '@/components/CommandTips'

/** API Result Common Start **/
export interface Notify {
    banner?: React.ReactNode
    tips?: React.ReactNode
}
export interface Success<T> extends Notify {
    success: true
    data: T
}
export interface Failed extends Notify {
    success: false
    details?: Error
}
export type Result<T = unknown> = Success<T> | Failed
/** API Result Common End **/

/** API Search Common Start **/
export type ItemCatalog = raw.RawCatalog | rymk.RymkCatalog
export interface ItemWithCatalog {
    catalog: ItemCatalog
}
export interface PageExtra {
    /** 页数信息 */
    page: {
        /** 当前页 */
        current: number
        /** 总页数 */
        total: number
    }
}
export interface SearchResult<T extends ItemWithCatalog, E extends PageExtra = PageExtra> {
    /** 搜索结果 */
    items: T[]
    /** 额外数据 */
    extra: E
}
export interface SearchQuery<T extends Command = Command> {
    command: T
    keywords: string[]
    parameters: CommandMap[T]['params']
}
export interface SearchQueryWithPage<T extends Command = Command> {
    query: SearchQuery<T>
    page?: number
    limit?: number
}
/** API Search Common End **/

/** API Provider Start **/
export interface ApiProvider<T extends Command, S extends Record<string, param.SchemaRule> = any> {
    description: string
    search: (parameters: SearchQueryWithPage<T>) => Promise<CommandMap[T]['result']>
    schema: param.Schema<S>
    kempty?: boolean
}
export type ApiProviders<C extends Command, S extends Record<string, param.SchemaRule> = any> = {
    [K in C]: ApiProvider<K, S>
}

export const api: ApiProviders<Command> = Object.assign({}, raw.api, rymk.api)
/** API Provider End **/

/** API Command Defined Start **/
export type CommandMap = raw.RawCommandMap & rymk.RymkCommandMap
export type Command = raw.RawCommand | rymk.RymkCommand
export interface CommandValue<
    T extends ItemWithCatalog,
    P = {},
    E extends PageExtra = PageExtra,
    S = SearchResult<T, E>,
    R = Result<S>
> {
    /** 项目类型 */
    item: T
    /** 搜索结果 */
    result: R
    /** 搜索结果数据 */
    search: S
    /** 搜索参数 */
    params: P
    /** 搜索结果额外数据 */
    extra: E
}
export interface CommandDescription {
    commands: string[]
    description: string
    isDefault: boolean
}
const commandTable = new Map<string, Command | 'help'>([
    ['/h', 'help'],
    ['/he', 'help'],
    ['/hel', 'help'],
    ['/help', 'help'],
])
export const commandDescription = new Map<Command, CommandDescription>()
;(() => {
    const setCommand = (command: Command) => {
        const full = `/${command}`
        const description = api[command].description
        const commands: string[] = []
        let isDefault = false
        for (let l = full.length; l > 0; l--) {
            const sub = full.slice(0, l)
            if (commandTable.has(sub)) break
            if (sub.length == 2) commands.push(sub)
            if (sub === '/') isDefault = true
            commandTable.set(sub, command)
        }
        commands.push(full)
        commandDescription.set(command, { commands, description, isDefault })
    }
    Object.values(raw.SubjectCommandEnum).forEach(setCommand)
    Object.values(raw.MonoCommandEnum).forEach(setCommand)
    Object.values(rymk.RymkCommandEnum).forEach(setCommand)
})()
/** API Command Defined End **/

async function fetchRaw(url: string, init?: RequestInit): Promise<Result<Response>> {
    // console.debug(url)
    const res = await fetch(url, init)
    if (!res.ok) {
        console.error(`Failed to fetch users: ${res.status} ${res.statusText}`)
        return { success: false, banner: `网络错误` }
    }
    return { success: true, data: res }
}

export async function fetchText(url: string, init?: RequestInit): Promise<Result<string>> {
    const res = await fetchRaw(url, init)
    if (!res.success) return res
    const data = await res.data.text()
    return { success: true, data }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<Result<T>> {
    const res = await fetchRaw(url, init)
    if (!res.success) return res
    const data = await res.data.json()
    return { success: true, data }
}

export function parseQuery(input: string): Result<SearchQuery> {
    const trimmed = input.trim()

    if (trimmed === '' || input === '/')
        return { success: false, banner: <h1>😊输入文字开始搜索</h1>, tips: <tips.MainTips /> }
    const parts = trimmed.split(/\s+/g).map((part) => part.trim())
    let command: Command | undefined = undefined
    const keywords = []
    const raw: Record<string, string> = {}
    let isHelp = false
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        switch (part[0]) {
            case '/': {
                const matchedCommand = commandTable.get(part)
                if (matchedCommand === 'help') {
                    isHelp = true
                    break
                }
                if (command)
                    return {
                        success: false,
                        banner: <h1>🤔多个命令</h1>,
                        tips: <tips.MainTips />,
                    }
                if (!matchedCommand)
                    return {
                        success: false,
                        banner: (
                            <>
                                <h1>🤔未知命令</h1>
                                <h3>
                                    <code>{part}</code>
                                </h3>
                            </>
                        ),
                        tips: <tips.MainTips />,
                    }
                command = matchedCommand
                break
            }
            case '-':
            case ':': {
                const paramParts = part.slice(1).split('=')
                if (paramParts.length < 2) {
                    raw[paramParts[0]] = parts[++i] || ''
                } else {
                    const paramKey = paramParts.shift()!
                    raw[paramKey] = paramParts.join('=')
                }
                break
            }
            case '\\':
                keywords.push(part.slice(1))
                break
            default:
                keywords.push(part)
        }
    }
    if (!command) {
        if (isHelp) {
            return {
                success: false,
                banner: (
                    <h1>
                        ✨<code>/help</code>
                    </h1>
                ),
                tips: <tips.MainTips />,
            }
        }
        command = 'subject'
    }
    const { schema, kempty = false } = api[command]
    const tip = <tips.CommandTips schema={schema} kempty={kempty} />
    const res = parseParameters(raw, schema)
    if (!res.success) {
        res.tips = tip
        return res
    }
    if (keywords.length === 0 && !kempty) {
        return {
            success: false,
            banner: (
                <>
                    <h1>
                        ✨<code>/{command}</code>
                    </h1>
                    <h3>{api[command].description}</h3>
                </>
            ),
            tips: tip,
        }
    }
    return {
        success: !isHelp,
        data: {
            command,
            keywords,
            parameters: res.data,
        },
        banner: (
            <>
                <h1>
                    ✨<code>/{command}</code>
                </h1>
                <h3>{api[command].description}</h3>
            </>
        ),
        tips: tip,
    }
}

export function parseParameters<
    T extends Record<string, param.SchemaRule>,
    S extends param.Schema<T>
>(raw: Record<string, string>, schema: S): Result<param.SchemaToType<S>> {
    const res = param.parse(raw, schema)
    if (res.success) return res
    switch (res.err) {
        case 'key':
            return {
                success: false,
                banner: (
                    <>
                        <h1>🤔未知参数名</h1>
                        <h3>
                            <code>{res.key}</code>
                        </h3>
                    </>
                ),
            }
        case 'duplicate':
            return {
                success: false,
                banner: (
                    <>
                        <h1>🤔重复的参数名</h1>
                        <h3>
                            <code>{res.key}</code>
                        </h3>
                    </>
                ),
            }
        case 'required':
            return {
                success: false,
                banner: (
                    <>
                        <h1>🤔缺少必选参数</h1>
                        <h3>
                            <code>{res.key}</code>
                        </h3>
                    </>
                ),
            }
        case 'invalid':
            return {
                success: false,
                banner: (
                    <>
                        <h1>🤔无效的参数类型</h1>
                        <h3>
                            <code>{res.key}</code>应为<code>{res.type}</code>
                        </h3>
                    </>
                ),
            }
        case 'enum':
            return {
                success: false,
                banner: (
                    <>
                        <h1>🤔无效的参数值</h1>
                        <h3>
                            <code>{res.key}</code>应为
                            <code>{res.extra?.map((s: string) => `"${s}"`).join(' | ')}</code>
                        </h3>
                    </>
                ),
            }
    }
}

export async function search<T extends Command>(
    query: SearchQuery<T>,
    page = 1
): Promise<CommandMap[T]['result']> {
    const command = query.command
    return api[command].search({ query, page })
}

export default api
