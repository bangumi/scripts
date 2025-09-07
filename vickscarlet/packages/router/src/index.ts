export type RouterHandler<Params extends {} = any> = (
    params: Params,
    path: string,
    pattern: string
) => void

export interface RouterLayer<Params extends {} = any> {
    pattern: string
    children?: RouterLayer[]
    handler?: RouterHandler<Params>
    fallback?: boolean
}

interface InnerPart {
    raw: string
    key?: string
    enum?: Set<string>
}
interface InnerLayer {
    part: InnerPart
    child: InnerLayer[]
    handler?: RouterHandler
    fallback?: boolean
}

export class Router {
    #root = { part: { raw: '', enum: new Set(['']) }, child: [] } as InnerLayer

    #parsePart(raw: string) {
        raw = raw.trim()
        const part = { raw } as InnerPart
        if (raw.at(-1) == ')' && raw.includes('(')) {
            const split = raw.split('(')
            raw = split[0]
            const enums = split[1].replace(')', '').split('|')
            part.enum = new Set(enums.map((s) => s.trim()))
        }
        switch (raw[0]) {
            case ':':
                part.key = raw.slice(1)
            case '*':
                break
            default:
                if (raw) part.enum = new Set([raw])
        }
        return part
    }
    #find({ child }: InnerLayer, part: string) {
        for (const layer of child) if (layer.part.raw === part) return layer
        return null
    }

    #deep(layer: InnerLayer, parts: string[]) {
        for (const part of parts) {
            const findLayer = this.#find(layer, part)
            if (!findLayer) {
                const newLayer = { part: this.#parsePart(part), child: [] }
                layer.child.push(newLayer)
                layer = newLayer
            } else {
                layer = findLayer
            }
        }
        return layer
    }

    #useSingle(
        layer: InnerLayer,
        pattern: string,
        children?: RouterLayer[],
        handler?: RouterHandler,
        fallback?: boolean
    ) {
        const parts = pattern.trim().split('/')
        if (parts.at(0) === '') parts.shift()
        if (parts.at(-1) === '') parts.pop()
        const child = this.#deep(layer, parts)
        child.handler = handler
        child.fallback = fallback
        if (!children) return
        for (const options of children) this.#use(child, options)
    }

    #use(layer: InnerLayer, { pattern, handler, children, fallback }: RouterLayer) {
        for (const p of [pattern].flat()) this.#useSingle(layer, p, children, handler, fallback)
    }

    use(options: RouterLayer) {
        this.#use(this.#root, options)
        return this
    }

    #deepMatch(
        layer: InnerLayer,
        [path, ...paths]: string[],
        params: Record<string, any> = {},
        [...pattern]: string[] = []
    ) {
        interface MatchObject {
            pattern: string
            params: Record<string, any>
            handler?: RouterHandler
        }
        const { part, child, handler, fallback } = layer
        pattern.push(part.raw)
        if (part.enum && !part.enum.has(path)) return null
        if (part.key) params[part.key] = path
        if (paths.length) {
            for (const c of child) {
                const match = this.#deepMatch(c, paths, params, pattern) as MatchObject
                if (match) return match
            }
            if (!fallback) return null
        }
        if (!handler) return null
        return { handler, params, pattern: pattern.join('/') || '/' } as MatchObject
    }

    #match(path: string) {
        const parts = path.trim().split('/')
        if (parts.at(-1) == '') parts.pop()
        if (parts.at(0) !== '') parts.unshift('')
        return this.#deepMatch(this.#root, parts)
    }

    active(path: string) {
        const match = this.#match(path)
        if (!match) return null
        const { handler, params, pattern } = match
        if (!handler) return null
        return handler(params, path, pattern)
    }
}
