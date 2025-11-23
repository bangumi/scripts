import { Database } from '@b38dev/database'

export const version = 1
export const db = new Database({
    dbName: 'VGadgetDeprecatedNotify',
    version,
    collections: [
        {
            collection: 'values',
            options: { keyPath: 'key' },
            indexes: [{ name: 'key', keyPath: 'key', unique: true }],
        },
    ],
    blocked: {
        alert: true,
        message: '[Bangumi 组件弃用提示] 数据库有更新，请先关闭所有班固米标签页再刷新试试',
    },
})
