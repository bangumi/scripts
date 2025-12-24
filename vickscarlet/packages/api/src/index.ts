export const BASE = 'https://api.b38.dev/v1'
export interface ApiError {
    state: number
    error: string
}

export type ApiResponse<T> = ApiError | { data: T }
