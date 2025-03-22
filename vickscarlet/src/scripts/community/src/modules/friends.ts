import { db, database } from './database'
import { whoami } from '@common/bangumi'
export const get = (() => {
    let peddings: ((friends: Set<string>) => void)[] | null = null

    const net = async (id: string) => {
        const res = await fetch(`/user/${id}/friends`)
        if (!res.ok) console.warn(`Error fetching friends: ${res.status}`)
        const html = await res.text()
        const element = document.createElement('html')
        element.innerHTML = html.replace(/<(img|script|link)/g, '<noload')
        const friends = new Set<string>()
        for (const a of element.querySelectorAll<HTMLAnchorElement>(
            '#memberUserList a.avatar'
        )) {
            const id = a.href.split('/').pop() ?? ''
            friends.add(id)
        }
        return friends
    }
    const get = async () => {
        const user = whoami()
        if (!user) return new Set<string>()
        const id = user.id
        const cache = await db.get<database.Friend>('friends', id)
        if (cache && cache.timestamp > Date.now() - 3600_000)
            return cache.friends
        const friends = await net(id)
        await db.put('friends', { id, friends, timestamp: Date.now() })
        return friends
    }

    const trigger = async () => {
        const friends = await get()
        for (const pedding of peddings!) pedding(friends)
        peddings = null
    }
    return async () => {
        const p = peddings ?? []
        const pedding = new Promise<Set<string>>((resolve) => p.push(resolve))
        if (!peddings) {
            peddings = p
            trigger()
        }
        return pedding
    }
})()
