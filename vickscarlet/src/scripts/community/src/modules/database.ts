import { Database, type BaseData } from '@common/database'

export namespace database {
    export interface Values extends BaseData {
        id: string
    }
    export interface VersionValue extends Values {
        version: number
    }
    export interface Friend extends BaseData {
        id: string
        timestamp: number
        friends: Set<string>
    }
    export interface User extends BaseData {
        id: string
        note?: string
        tags?: Set<string>
        blocked?: 0 | 1
    }
    export interface UsedName extends BaseData {
        id: string
        names: Set<string>
        update: number
        tml: string
    }
    export interface UserV4 extends BaseData {
        id: string
        note?: string
        tags?: Set<string> | string[]
        block?: boolean
        names?: Set<string>
        namesUpdate?: number
        namesTml?: string
    }
}

export const version = 12
export const db = new Database({
    dbName: 'VCommunity',
    version,
    collections: [
        {
            collection: 'values',
            options: { keyPath: 'id' },
            indexes: [{ name: 'id', keyPath: 'id', unique: true }],
        },
        {
            collection: 'friends',
            options: { keyPath: 'id' },
            indexes: [{ name: 'id', keyPath: 'id', unique: true }],
            cache: { enabled: true, last: 1 },
        },
        {
            collection: 'usednames',
            options: { keyPath: 'id' },
            indexes: [{ name: 'id', keyPath: 'id', unique: true }],
            cache: { enabled: true, last: 3 },
        },
        {
            collection: 'images',
            options: { keyPath: 'uri' },
            indexes: [{ name: 'uri', keyPath: 'uri', unique: true }],
        },
        {
            collection: 'users',
            options: { keyPath: 'id' },
            indexes: [
                { name: 'id', keyPath: 'id', unique: true },
                { name: 'blocked', keyPath: 'blocked', unique: false },
            ],
            cache: { enabled: true, last: 5, hot: 5 },
        },
    ],
    blocked: {
        alert: true,
        message:
            'Bangumi 社区助手 preview 数据库有更新，请先关闭所有班固米标签页再刷新试试',
    },
})

export async function updateDatabase() {
    if (localStorage.getItem('VCommunity') == version.toString()) return
    const lastVersion =
        (await db.get<database.VersionValue>('values', 'version'))?.version || 0
    if (lastVersion < 5) {
        // V5 update
        const users = await db.getAll<database.UserV4>('users')
        for (const {
            id,
            names,
            namesUpdate: update,
            namesTml: tml,
            block,
            note,
            tags,
        } of users) {
            if (names && tml) {
                names.delete('')
                await db.put('usednames', { id, names, update, tml })
            }
            if (
                !block &&
                !note &&
                !(
                    tags &&
                    ((tags as Set<string>).size || (tags as string[]).length)
                )
            ) {
                await db.delete('users', id)
            } else {
                const user = { id } as database.User
                if (block) user.blocked = 1
                if (note) user.note = note
                if (tags) user.tags = new Set(tags)
                await db.put('users', user)
            }
        }
    } else if (lastVersion < 12) {
        const usednames = await db.getAll<database.UsedName>('usednames')
        for (const { id, names, update, tml } of usednames) {
            if (!names || !tml) {
                await db.delete('usednames', id)
            } else {
                names.delete('')
                await db.put('usednames', { id, names, update, tml })
            }
        }
    }
    await db.put('values', { id: 'version', version })
    localStorage.setItem('VCommunity', version.toString())
}
