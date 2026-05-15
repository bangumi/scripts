export function toBoolean(value: string | undefined): boolean {
    if (!value) return false
    return value === '1' || value.toLowerCase() === 'true'
}

export function toURLSearchParams(
    parameters: Record<string, string | number | boolean | undefined | string[]>,
    parameters2?: Record<string, string | number | boolean | undefined | string[]>,
    boolValues = ['1', '0']
): URLSearchParams {
    const params = new URLSearchParams()
    const allParams = parameters2 ? { ...parameters, ...parameters2 } : parameters
    for (const key in allParams) {
        const value = allParams[key]
        if (value !== undefined) {
            if (typeof value === 'boolean') {
                params.append(key, value ? boolValues[0] : boolValues[1])
            } else if (Array.isArray(value)) {
                if (value.length > 0) params.append(key, value.join(' '))
            } else {
                params.append(key, String(value))
            }
        }
    }
    return params
}
export interface SchemaRuleOptional {
    readonly optional?: true
}
export interface SchemaRuleDescription {
    readonly description?: string
}
export interface SchemaRuleDescription {
    readonly description?: string
}
export interface SchemaRuleRename {
    readonly rename?: string
}
export type SchemaRuleBase = SchemaRuleOptional & SchemaRuleDescription & SchemaRuleRename

export interface SchemaRuleBoolean extends SchemaRuleBase {
    readonly type: 'boolean'
}
export interface SchemaRuleNumber extends SchemaRuleBase {
    readonly type: 'number'
}
export interface SchemaRuleString extends SchemaRuleBase {
    readonly type: 'string'
}
export interface SchemaRuleEnum extends SchemaRuleBase {
    readonly type: 'enum'
    readonly values: readonly (string | number | boolean)[]
}
export type SchemaRule = SchemaRuleBoolean | SchemaRuleNumber | SchemaRuleString | SchemaRuleEnum
export type Schema<T extends Record<string, SchemaRule>> = {
    readonly [K in keyof T]: T[K]
}
export type RuleToType<R extends SchemaRule> = R extends { type: 'boolean' }
    ? boolean
    : R extends { type: 'number' }
    ? number
    : R extends { type: 'string' }
    ? string
    : R extends { type: 'enum'; values: readonly (infer V)[] }
    ? V
    : never

export type IsOptional<T> = 'optional' extends keyof T ? true : false
export type OptionalKeys<S> = {
    [K in keyof S]: IsOptional<S[K]> extends true ? K : never
}[keyof S]
export type RequiredKeys<S> = Exclude<keyof S, OptionalKeys<S>>
// export type SchemaToType<S extends Record<string, SchemaRule>> = {
//     -readonly [K in RequiredKeys<S>]: RuleToType<S[K]>
// } & {
//     -readonly [K in OptionalKeys<S>]?: RuleToType<S[K]>
// }
export type RenameKey<K extends PropertyKey, R> = R extends { rename: infer N extends PropertyKey }
    ? N
    : K
export type SchemaToType<S extends Record<string, SchemaRule>> = {
    -readonly [K in keyof S as IsOptional<S[K]> extends true
        ? never
        : RenameKey<K, S[K]>]: RuleToType<S[K]>
} & {
    -readonly [K in keyof S as IsOptional<S[K]> extends true
        ? RenameKey<K, S[K]>
        : never]?: RuleToType<S[K]>
}

export interface ParseError {
    success: false
    err: 'required' | 'invalid' | 'enum' | 'key' | 'duplicate'
    type: 'boolean' | 'number' | 'string' | 'enum'
    key: string
    extra?: any
}
export interface ParseSuccess<T> {
    success: true
    data: T
}
export type ParseResult<T> = ParseError | ParseSuccess<T>

const schemaMapCache = new WeakMap<Schema<any>, Map<string, string>>()

function getSchemaMap<T extends Record<string, SchemaRule>, S extends Schema<T>>(
    schema: S
): Map<string, keyof S> {
    let map = schemaMapCache.get(schema)
    if (map) return map
    const nmap = new Map<string, string>()
    for (const key in schema) {
        let skey: string = key
        nmap.set(skey, key)
        for (let i = key.length - 1; i > 0; i--) {
            skey = skey.slice(0, i)
            if (nmap.has(skey)) break
            nmap.set(skey, key)
        }
    }
    schemaMapCache.set(schema, nmap)
    return nmap
}

export function parse<T extends Record<string, SchemaRule>, S extends Schema<T>>(
    raw: Record<string, string>,
    schema: S
): ParseResult<SchemaToType<S>> {
    const map = getSchemaMap<T, S>(schema)
    const data: any = {}

    for (const k in raw) {
        const key = map.get(k) as string
        if (!key) return { success: false, err: 'key', type: 'string', key: k }
        const rule = schema[key]
        const rawValue = raw[k]
        const finalKey = rule.rename || key

        if (!rawValue) continue
        if (finalKey in data) {
            return { success: false, err: 'duplicate', type: rule.type, key }
        }
        switch (rule.type) {
            case 'boolean':
                if (rawValue === 'true' || rawValue === '1') data[finalKey] = true
                else if (rawValue === 'false' || rawValue === '0') data[finalKey] = false
                else return { success: false, err: 'invalid', type: 'boolean', key }
                break

            case 'number': {
                const n = Number(rawValue)
                if (Number.isNaN(n)) return { success: false, err: 'invalid', type: 'number', key }
                data[finalKey] = n
                break
            }

            case 'string':
                data[finalKey] = rawValue
                break

            case 'enum':
                if (!(rule as SchemaRuleEnum).values.includes(rawValue as any)) {
                    return {
                        success: false,
                        err: 'enum',
                        type: 'enum',
                        key,
                        extra: (rule as SchemaRuleEnum).values,
                    }
                }
                data[finalKey] = rawValue
                break
        }
    }

    for (const key in schema) {
        const rule = schema[key]
        const finalKey = rule.rename || key
        if (finalKey in data) continue
        if (!rule.optional) return { success: false, err: 'required', type: rule.type, key }
    }

    return { success: true, data }
}
