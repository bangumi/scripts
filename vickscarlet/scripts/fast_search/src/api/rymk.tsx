import type { SearchQueryWithPage, CommandValue, ApiProviders, Result, PageExtra } from '.'
import { SchemaToType, toURLSearchParams } from '@/util/param'
import { fetchJson } from '.'
/**
 * @link https://bgm.ry.mk/search/docs
 */
const RYMK_API_BASE = 'https://bgm.ry.mk'

/** API Command Defined Start **/
export enum RymkCommandEnum {
    user = 'user',
    group = 'group',
    topic = 'topic',
    reply = 'reply',
}
export interface RymkCommandValue {
    user: CommandValue<User, SearchUserParameters, Extra>
    group: CommandValue<Group, SearchGroupParameters, Extra>
    topic: CommandValue<Topic, SearchTopicParameters, Extra>
    reply: CommandValue<Reply, SearchReplyParameters, Extra>
}
export type RymkCommandMap = {
    [K in RymkCommand]: RymkCommandValue[K]
}
export type RymkCommand = keyof typeof RymkCommandEnum
export type RymkCatalog = RymkCommand
/** API Command Defined End **/

/** API Response Item Start **/
export interface RawUser {
    /** 用户 id */
    uid: number
    /** 用户名 */
    username: string
    /** 昵称 */
    nickname: string
    /** 头像 URL */
    avatar_url: string
    /** 签名 */
    sign?: string | null
    /** 爬取时间 */
    crawled_at: string
    /** 搜索向量 */
    search_vector: string
}
export type User = RawUser & {
    /** @catalog 用户 */
    catalog: 'user'
}
export interface RawTopic {
    /** 话题 id */
    id: number
    /** 话题标题 */
    title: string
    /** 话题内容 */
    content: string
    /** 话题回复数 */
    reply_count: number
    /** 最后回复时间 时间戳 */
    last_replied_at: number
    /** 话题更新时间 时间戳 */
    updated_at: number
    /** 话题创建时间 时间戳 */
    created_at: number
    /** 话题 URL */
    url: string
    /** 话题创建者信息 */
    creator: {
        /** 用户id */
        uid: number
        /** 用户名 */
        username: string
        /** 昵称 */
        nickname: string
        /** 头像 URL */
        avatar_url: string
        /** 签名 */
        sign?: string | null
    }
    /** 话题所属小组信息 */
    group: {
        /** 小组 id */
        slug: string
        /** 小组名称 */
        title: string
        /** 小组图标 URL */
        icon_url: string
    }
}
export type Topic = RawTopic & {
    /** @catalog 话题 */
    catalog: 'topic'
}
export interface RawGroup {
    /** 小组 id */
    slug: string
    /** 小组名称 */
    title: string
    /** 小组成员数 */
    member_count: number
    /** 小组图标 URL */
    icon_url: string
    /** 小组描述 */
    description?: string | null
    /** 爬取时间 */
    crawled_at: string
    /** 搜索向量 */
    search_vector: string
    /** 是否 NSFW */
    nsfw: boolean
}
export type Group = RawGroup & {
    /** @catalog 小组 */
    catalog: 'group'
}
export interface RawReply {
    /** 回复 id */
    id: number
    /** 回复内容 */
    content: string
    /** 回复创建时间 时间戳 */
    created_at: number
    /** 回复 URL */
    url: string
    /** 回复给 */
    reply_to: number
    /** 回复所在话题信息 */
    topic: {
        /** 话题 id */
        id: number
        /** 话题标题 */
        title: string
        /** 话题所在小组 id */
        group_slug: string
    }
    /** 回复创建者信息 */
    creator: {
        /** 用户id */
        uid: number
        /** 用户名 */
        username: string
        /** 昵称 */
        nickname: string
        /** 头像 URL */
        avatar_url: string
    }
}
export type Reply = RawReply & {
    /** @catalog 回复 */
    catalog: 'reply'
}
export interface RymkItemValue {
    user: {
        raw: RawUser
        item: User
    }
    topic: {
        raw: RawTopic
        item: Topic
    }
    group: {
        raw: RawGroup
        item: Group
    }
    reply: {
        raw: RawReply
        item: Reply
    }
}
export type RymkItemMap = {
    [K in RymkCommand]: RymkItemValue[K]
}
/** API Response Item End **/

/** API Response Common Start **/
export interface RymkError {
    detail: {
        loc: (string | number)[]
        msg: string
        type: string
    }[]
}
export interface RymkExtra {
    /** 总数 */
    total: number
    /** 限制 */
    limit: number
    /** 偏移 */
    offset: number
    /** 执行时间 毫秒 */
    execution_time_ms: number
}
export type Extra = RymkExtra & PageExtra
export interface RymkData<T> extends RymkExtra {
    /** 数据 */
    data: T[]
}
export type RymkResponse<T> = RymkData<T> | RymkError
/** API Response Common End **/

/** API Parameters Schema Start **/
export type SearchUserParameters = SchemaToType<typeof SearchUserParametersSchema>
export const SearchUserParametersSchema = {} as const

export type SearchTopicParameters = SchemaToType<typeof SearchTopicParametersSchema>
export const SearchTopicParametersSchema = {
    user: { type: 'string', optional: true, description: '筛选用户', rename: 'user' },
    group: { type: 'string', optional: true, description: '筛选小组', rename: 'group' },
    sort: {
        type: 'enum',
        values: ['match', 'newest', 'oldest', 'replies'],
        optional: true,
        description: '排序方式',
        rename: 'sort',
    },
    ib: {
        type: 'boolean',
        optional: true,
        description: '是否包含被屏蔽小组',
        rename: 'include_blocked',
    },
} as const

export type SearchGroupParameters = SchemaToType<typeof SearchGroupParametersSchema>
export const SearchGroupParametersSchema = {
    sort: {
        type: 'enum',
        values: ['match', 'members'],
        optional: true,
        description: '排序方式',
        rename: 'sort',
    },
    ib: {
        type: 'boolean',
        optional: true,
        description: '是否包含被屏蔽小组',
        rename: 'include_blocked',
    },
} as const

export type SearchReplyParameters = SchemaToType<typeof SearchReplyParametersSchema>
export const SearchReplyParametersSchema = {
    user: { type: 'string', optional: true, description: '筛选用户', rename: 'user' },
    group: { type: 'string', optional: true, description: '筛选小组', rename: 'group' },
    topic: { type: 'string', optional: true, description: '筛选话题', rename: 'topic_id' },
    after: {
        type: 'string',
        optional: true,
        description: '筛选此日期之后的回复',
        rename: 'after',
    },
    sort: {
        type: 'enum',
        values: ['match', 'newest', 'oldest'],
        optional: true,
        description: '排序方式',
        rename: 'sort',
    },
    ib: {
        type: 'boolean',
        optional: true,
        description: '是否包含被屏蔽小组',
        rename: 'include_blocked',
    },
} as const
/** API Parameters Schema End **/

async function rymkFetch<C extends RymkCommand>(
    catalog: C,
    api: string,
    params: URLSearchParams,
    page = 1,
    limit = 20
): Promise<Result<{ items: RymkItemMap[C]['item'][]; extra: Extra }>> {
    params.append('limit', limit.toString())
    if (page > 1) params.append('offset', (page - 1) * limit + '')
    const url = `${RYMK_API_BASE}/search/${api}?${params.toString()}`
    const res = await fetchJson<RymkResponse<RymkItemMap[C]['raw']>>(url)
    if (!res.success) return res
    if ('detail' in res.data) {
        return {
            success: false,
            banner: (
                <>
                    <h1>🤔Api出错</h1>
                    <h3>
                        <code>{res.data.detail[0].msg}</code>
                    </h3>
                </>
            ),
        }
    }
    const { data, ...extra } = res.data
    return {
        success: true,
        data: {
            items: data.map((item) => ({ ...item, catalog } as RymkItemMap[C]['item'])),
            extra: { ...extra, page: { current: page, total: Math.ceil(extra.total / limit) } },
        },
    }
}

export const api: ApiProviders<RymkCommand> = {
    user: {
        description: '用户',
        search({ query: { keywords: q }, page, limit }: SearchQueryWithPage<'user'>) {
            return rymkFetch('user', 'users', toURLSearchParams({ q }), page, limit)
        },
        schema: SearchUserParametersSchema,
    },
    topic: {
        description: '小组话题',
        kempty: true,
        search({ query: { keywords: q, parameters }, page, limit }: SearchQueryWithPage<'topic'>) {
            return rymkFetch('topic', 'topics', toURLSearchParams(parameters, { q }), page, limit)
        },
        schema: SearchTopicParametersSchema,
    },
    group: {
        description: '小组',
        kempty: true,
        search({ query: { keywords: q, parameters }, page, limit }: SearchQueryWithPage<'group'>) {
            return rymkFetch('group', 'groups', toURLSearchParams(parameters, { q }), page, limit)
        },
        schema: SearchGroupParametersSchema,
    },
    reply: {
        description: '回复',
        kempty: true,
        search({ query: { keywords: q, parameters }, page, limit }: SearchQueryWithPage<'reply'>) {
            return rymkFetch('reply', 'replies', toURLSearchParams(parameters, { q }), page, limit)
        },
        schema: SearchReplyParametersSchema,
    },
}

export default api
