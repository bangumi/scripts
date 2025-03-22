import { loadScript } from '@common/dom'
export function getNice(element: Element | null) {
    if (!element) return null
    return $(element).getNiceScroll?.(0)
}

export async function it(element: Element | null) {
    if (!element) return null
    const nice = getNice(element)
    if (nice) return nice
    await loadScript(
        'https://cdn.jsdelivr.net/npm/jquery.nicescroll@3.7/jquery.nicescroll.min.js'
    )
    return $(element).niceScroll({
        cursorcolor: 'rgb(from var(--color-bangumi) r g b / .5)',
        cursorwidth: '4px',
        cursorborder: 'none',
    })
}

export function to(
    element: Element | null,
    { x, y, d }: { x?: number; y?: number; d?: number }
) {
    const nice = getNice(element)
    if (!nice) return
    if (typeof x === 'number') nice.doScrollLeft(x, d ?? 0)
    if (typeof y === 'number') nice.doScrollTop(y, d ?? 0)
}

export function resize(element: Element | null) {
    const nice = getNice(element)
    if (!nice) return
    nice.resize()
}
