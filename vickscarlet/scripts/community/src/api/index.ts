export namespace b38dev {
    const B38DEV = 'https://api.b38.dev/v1'
    export interface ApiError {
        state: number
        error: string
    }

    export type ApiResponse<T> = ApiError | { data: T }

    export namespace namehistory {
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

        export interface NameHistory {
            update_at: string
            key_point: string
            names: string[]
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
            name_history?: NameHistory
            collections?: Collections
        }
        export async function fetchUserNameHistory(id: string) {
            const res = await fetch(`${B38DEV}/user/name-history?uid=${id}`)
            const data = await res.json()
            return data as ApiResponse<Data>
        }
    }
}

export type NameState = b38dev.namehistory.NameState
const NameState = b38dev.namehistory.NameState

export type NameHistory = {
    state: NameState
    update: number
    names: Set<string>
}

export async function fetchUserNameHistory(id: string) {
    const result = await b38dev.namehistory.fetchUserNameHistory(id)
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
