import { BASE } from '.'
import type { ApiResponse } from '.'

export interface Collection {
    doing?: number
    collect?: number
    wish?: number
    on_hold?: number
    dropped?: number
}

export interface Collections {
    anime?: Collection
    game?: Collection
    book?: Collection
    music?: Collection
    real?: Collection
}

export interface NameHistoryRaw {
    update_at: string
    key_point: string
    names: string[]
}

export interface NameHistory {
    state: NameState
    update: number
    names: Set<string>
}

export enum NameState {
    Active = 'active',
    Abondon = 'abandon',
    Dropped = 'dropped',
    Banned = 'banned',
}

export interface Data {
    name: string
    nid?: number
    sid?: string
    state: NameState
    join_time?: string
    last_active?: string
    update_at: string
    name_history?: NameHistoryRaw
    collections?: Collections
}

export async function fetchUserNameHistoryRaw(id: string) {
    const res = await fetch(`${BASE}/user/name-history?uid=${id}`)
    const data = await res.json()
    return data as ApiResponse<Data>
}

export async function fetchUserNameHistory(id: string) {
    const result = await fetchUserNameHistoryRaw(id)
    if ('error' in result) {
        throw new Error(`fetch name history failed: ${result.error}`)
    }
    const data = result.data
    if (!data.name_history) {
        return new Promise<NameHistory>((resolve) => {
            setTimeout(async () => {
                const res = await fetchUserNameHistory(id)
                resolve(res)
            }, 2000)
        })
    }

    const { name_history, state } = data
    return {
        state,
        update: new Date(name_history.update_at).getTime(),
        names: new Set(name_history.names),
    } as NameHistory
}

export function isExpired(state: NameState, update: number) {
    const diff = Date.now() - update
    switch (state) {
        case NameState.Dropped:
        case NameState.Banned:
            return false
        case NameState.Abondon:
            return diff > 30 * 24 * 60 * 60 * 1000
        default:
            return diff > 24 * 60 * 60 * 1000
    }
}
