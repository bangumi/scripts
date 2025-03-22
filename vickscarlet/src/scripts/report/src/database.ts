import { Database, type BaseData } from '@common/database'
import { type AnimeTypes } from './config'
export const db = new Database({
    dbName: 'VReport',
    version: 6,
    collections: [
        {
            collection: 'pages',
            options: { keyPath: 'url' },
            indexes: [{ name: 'url', keyPath: 'url', unique: true }],
        },
        {
            collection: 'times',
            options: { keyPath: 'id' },
            indexes: [{ name: 'id', keyPath: 'id', unique: true }],
        },
    ],
})

export namespace database {
    export interface PageItem {
        id: string
        title: string
        jp_title?: string
        img: string
        time: Date
        year: number
        month: number
        star: number
        tags: string[]
        subType: string
    }

    export interface Page extends BaseData {
        url: string
        list: PageItem[]
        max: number
        time: number
        tags?: string[]
    }

    export type Time = CacluatedTime | TypedTime

    export interface CacluatedTime extends BaseData {
        id: string
        time: number
    }

    export interface TypedTime extends BaseData {
        id: string
        eps: number
        type: AnimeTypes
    }
}
