/**
 * 元素事件映射
 */

export type HTMLElementEventMapKeys = keyof HTMLElementEventMap
export type ElementEventMap<E extends Element> = E extends HTMLElement
    ? HTMLElementEventMap
    : E extends SVGElement
    ? SVGElementEventMap
    : Record<string, Event>

export type Styles = Partial<Record<keyof CSSStyleDeclaration, string | number>>

// export type Props<E extends Element = Element> = {
//     class?: string | string[]
//     style?: E extends HTMLElement ? Styles : never
//     events?: E extends HTMLElement
//         ?
//               | EventEntry<E>[]
//               | Partial<{ [K in keyof ElementEventMap<E>]: (e: ElementEventMap<E>[K]) => void }>
//         : never
// } & {
//     /** 避免重复 key */
//     [K in keyof E as K extends 'class' | 'style' ? never : K]?: any
// } & Record<string, string | number | boolean>
export type Events<E extends Element, Map = ElementEventMap<E>> = Partial<{
    [K in keyof Map]: (e: Map[K]) => void
}>

type AddPrefix<T, P extends string> = {
    [K in keyof T as `${P}${string & K}`]: T[K]
}

export type Props<E extends Element> = (Partial<Omit<E, 'style' | 'class'>> & {
    class?: string | string[]
    style?: Partial<CSSStyleDeclaration>
    events?: Events<E>
}) &
    AddPrefix<Record<string, string>, 'data-'>

export type KnownHTMLName = keyof HTMLElementTagNameMap
export type KnownSvgTagName = keyof SVGElementTagNameMap
export type KnownTagName = KnownHTMLName | KnownSvgTagName
export type ElementFromTag<T extends KnownTagName> = T extends KnownHTMLName
    ? HTMLElementTagNameMap[T]
    : T extends KnownSvgTagName
    ? SVGElementTagNameMap[T]
    : Element

export type CreateSvgParams<K extends KnownSvgTagName = KnownSvgTagName> =
    | [K, Props<ElementFromTag<K>>, ...AppendSvgParams[]]
    | [K, ...AppendSvgParams[]]
export type AppendSvgParams =
    | CreateParams
    | string
    | number
    | Node
    | HTMLElement
    | SVGElement
    | Element

export type CreateHTMLParams<T extends KnownHTMLName = KnownHTMLName> =
    | [T, Props<HTMLElementTagNameMap[T]>, ...AppendParams[]]
    | [T, ...AppendParams[]]

export type CreateParams<T extends KnownTagName = KnownTagName> = T extends KnownHTMLName
    ? CreateHTMLParams<T>
    : T extends KnownSvgTagName
    ? CreateSvgParams<T>
    : never

export type AppendParams =
    | string
    | number
    | Node
    | HTMLElement
    | SVGElement
    | Element
    | CreateParams
    | AppendSvgParams

const svgTags = [
    'svg',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
    'path',
    'text',
    'g',
    'defs',
    'use',
    'symbol',
    'image',
    'clipPath',
    'mask',
    'pattern',
] as const

export function setEvents<E extends Element>(element: E, events: Events<E>): E {
    for (const [event, listener] of Object.entries(events)) {
        element.addEventListener(event, listener as EventListener)
    }
    return element
}

export function setProps<E extends Element>(element: E, props: Props<E>): E {
    if (!props || typeof props !== 'object') return element

    for (const [key, value] of Object.entries(props)) {
        if (value == null) continue
        if (key === 'events') {
            setEvents(element, value as Events<E>)
        } else if (key === 'class') {
            addClass(element, value as string | string[])
        } else if (key === 'style' && typeof value === 'object') {
            setStyle(element as unknown as HTMLElement, value as Styles)
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, String(value))
        } else {
            element[key as keyof E] = value as E[keyof E]
        }
    }
    return element
}

export function addClass(element: Element, value: string | string[]): Element {
    element.classList.add(...[value].flat())
    return element
}

export function setStyle<E extends HTMLElement>(element: E, styles: Styles): E {
    for (let [k, v] of Object.entries(styles)) {
        if (typeof v === 'number' && v !== 0 && !['zIndex', 'fontWeight'].includes(k)) {
            v = v + 'px'
        }
        ;(element.style as any)[k] = v
    }
    return element
}

export function create<K extends keyof HTMLElementTagNameMap>(
    name: K,
    props?: Props<HTMLElementTagNameMap[K]> | AppendParams,
    ...childrens: AppendParams[]
): HTMLElementTagNameMap[K]

export function create<K extends keyof SVGElementTagNameMap>(
    name: K,
    props?: Props<SVGElementTagNameMap[K]> | AppendParams,
    ...childrens: AppendParams[]
): SVGElementTagNameMap[K]

export function create<K extends KnownTagName>(
    name: K | Element,
    props?: Props<ElementFromTag<K>> | AppendParams,
    ...childrens: AppendParams[]
): Element {
    if (name == null) return null as any
    const isSVG = name === 'svg' || (typeof name === 'string' && svgTags.includes(name as any))
    if (isSVG) return createSVG(name as keyof SVGElementTagNameMap, props as any, ...childrens)

    const element = name instanceof Element ? name : document.createElement(name)
    if (props === undefined) return element

    // 如果 props 是数组 / Node / 非对象，直接 append
    if (Array.isArray(props) || props instanceof Node || typeof props !== 'object') {
        return append(element, props as AppendParams, ...childrens)
    }

    // 否则先 setProps 再 append children
    return append(setProps(element, props as any), ...childrens)
}

export function append<E extends Element>(element: E, ...childrens: AppendParams[]): E {
    // 判断 SVG 标签
    const tag = element.tagName.toLowerCase()
    if (svgTags.includes(tag as any)) {
        return appendSVG(element as unknown as SVGElement, ...childrens) as any as E
    }

    for (const child of childrens) {
        if (Array.isArray(child)) {
            element.append(create(...(child as [any])))
        } else if (child instanceof Node) {
            element.appendChild(child)
        } else {
            element.append(document.createTextNode(String(child)))
        }
    }
    return element
}

export function createSVG<K extends KnownSvgTagName>(
    name: K,
    props?: Props<SVGElementTagNameMap[K]> | AppendSvgParams,
    ...childrens: AppendSvgParams[]
): SVGElementTagNameMap[K] {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name)
    if (name === 'svg') element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

    if (props === undefined) return element
    if (Array.isArray(props) || props instanceof Node || typeof props !== 'object') {
        return appendSVG(element, props, ...childrens)
    }
    return appendSVG(setProps(element, props as any), ...childrens)
}

export function appendSVG<E extends SVGElement>(element: E, ...childrens: AppendSvgParams[]): E {
    for (const child of childrens) {
        if (Array.isArray(child)) {
            element.append(createSVG(...(child as Parameters<typeof createSVG>)))
        } else if (child instanceof Node) {
            element.appendChild(child)
        } else {
            element.append(document.createTextNode(String(child)))
        }
    }
    return element
}
