import type { PresetTagsDefinition, BBobPluginFunction, NodeContent } from '@bbob/types'
import { isStringNode } from '@bbob/plugin-helper'
import { createTree } from '@bbob/core'
import presetReact from '@bbob/preset-react'

const EMOJI_REG = /\(bgm(\d+)\)/g

const range = (start: number, end: number): number[] =>
    new Array(end - start + 1).fill(0).map((_, i) => start + i)

const smileMapping = new Map<string, string>([
    ...range(1, 10).map((n) => [`(bgm0${n})`, `/img/smiles/bgm/0${n}.png`] as const),
    ['(bgm11)', '/img/smiles/bgm/11.gif'],
    ...range(12, 22).map((n) => [`(bgm${n})`, `/img/smiles/bgm/${n}.png`] as const),
    ['(bgm23)', '/img/smiles/bgm/23.gif'],
    ...range(24, 33).map((n) => [`(bgm0${n - 23})`, `/img/smiles/tv/0${n - 23}.gif`] as const),
    ...range(34, 125).map((n) => [`(bgm${n - 23})`, `/img/smiles/tv/${n - 23}.gif`] as const),
    ...range(200, 238).map((n) => [`(bgm${n})`, `/img/smiles/tv_vs/bgm_${n}.png`] as const),
    ['(bgm500)', 'https://bgm.tv/img/smiles/tv_500/bgm_500.gif'],
    ['(bgm501)', 'https://bgm.tv/img/smiles/tv_500/bgm_501.gif'],
    ...range(502, 504).map((n) => [`(bgm${n})`, `/img/smiles/tv_500/bgm_${n}.png`] as const),
    ['(bgm505)', 'https://bgm.tv/img/smiles/tv_500/bgm_505.gif'],
    ...range(506, 514).map((n) => [`(bgm${n})`, `/img/smiles/tv_500/bgm_${n}.png`] as const),
    ...range(515, 519).map((n) => [`(bgm${n})`, `/img/smiles/tv_500/bgm_${n}.gif`] as const),
    ['(bgm520)', 'https://bgm.tv/img/smiles/tv_500/bgm_520.png'],
    ...range(521, 523).map((n) => [`(bgm${n})`, `/img/smiles/tv_500/bgm_${n}.gif`] as const),
    ...range(524, 529).map((n) => [`(bgm${n})`, `/img/smiles/tv_500/bgm_${n}.png`] as const),
])

const handleEmoji = (node: NodeContent): NodeContent[] => {
    if (typeof node !== 'string') return [node]
    let text = node
    if (!EMOJI_REG.test(text)) return [node]

    const result = []
    let lastIndex = 0

    text.replace(EMOJI_REG, (alt, _id, index) => {
        if (index > lastIndex) result.push(text.slice(lastIndex, index))
        const src = smileMapping.get(alt)
        if (!src) result.push(alt)
        else result.push({ tag: 'img', attrs: { src, alt, className: 'smile' } })
        lastIndex = index + alt.length
        return alt
    })

    // 尾部文本
    if (lastIndex < text.length) result.push(text.slice(lastIndex))

    return result
}

export const options = {
    onlyAllowTags: [
        'user',
        'size',
        'mask',
        'b',
        'i',
        'u',
        's',
        'url',
        'img',
        'quote',
        'code',
        'list',
        // '*',
        'color',
        'size',
        'font',
        'align',
        'spoiler',
        // 'br',
        'left',
        'center',
        'right',
        'float',
        'table',
        'tr',
        'td',
        'th',
        'tbody',
    ],
    contextFreeTags: ['code', 'pre'],
}

export const preset = presetReact.extend<PresetTagsDefinition>((tags) => ({
    ...tags,
    user: (node) => {
        const id = Object.values(node.attrs || {})[0]
        const content = `@${node.content}`
        if (!id) return { tag: 'span', content }
        return { tag: 'a', href: `/user/${id}`, content }
    },
    size: (node) => {
        const size = Object.values(node.attrs || {})[0]
        const fontSize = size ? size + 'px' : '1em'
        node.attrs = {}
        return {
            tag: 'span',
            attrs: { style: { fontSize } },
            content: node.content!,
        }
    },
    mask: (node) => {
        node.attrs = {}
        return {
            tag: 'span',
            attrs: {
                className: 'text_mask',
                style: {
                    backgroundColor: '#555',
                    color: '#555',
                    border: '1px solid #555',
                },
            },
            content: node.content!,
        }
    },
    align: (node) => {
        const align = Object.values(node.attrs || {})[0]
        node.attrs = {}
        return {
            tag: 'span',
            attrs: { style: { textAlign: align } },
            content: node.content!,
        }
    },
    left: (node) => {
        return {
            tag: 'span',
            attrs: { style: { float: 'left' } },
            content: node.content!,
        }
    },
    center: (node) => {
        return {
            tag: 'span',
            attrs: { style: { float: 'center' } },
            content: node.content!,
        }
    },
    right: (node) => {
        return {
            tag: 'span',
            attrs: { style: { float: 'right' } },
            content: node.content!,
        }
    },
    spoiler: (node) => {
        const summary = Object.values(node.attrs || {})[0] as string
        node.attrs = {}
        const content = {
            tag: 'summary',
            content: [summary || ''],
        }
        if (!node.content) return { tag: 'details', content: [content] }
        if (Array.isArray(node.content))
            return { tag: 'details', content: [content, ...node.content] }
        return { tag: 'details', content: [content, node.content] }
    },
    float: (node) => {
        const float = Object.values(node.attrs || {})[0]
        node.attrs = {}
        return {
            tag: 'span',
            attrs: { style: { float } },
            content: node.content!,
        }
    },
    // img: (node) => {
    //     const src = node.content
    //     if (typeof src !== 'string') {
    //         debugger
    //         return node
    //     }
    //     return {
    //         tag: 'img',
    //         attrs: { src, alt: src },
    //     }
    // },
    // code: (node) => {
    //     if (!node.content) return { tag: 'pre', content: '' }
    //     let s
    //     if (typeof node.content === 'string') {
    //         s = node.content
    //     } else if (Array.isArray(node.content)) {
    //         s = node.content.join('')
    //     } else {
    //         return { tag: 'pre', content: node.content }
    //     }
    //     return {
    //         tag: 'pre',
    //         content: s.split('\n').map((content) => ({
    //             tag: 'code',
    //             content,
    //         })),
    //     }
    // },
}))

const customPlugin: BBobPluginFunction = (tree, options) => {
    const newTree: NodeContent[] = []
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i]
        if (!node) continue
        if (isStringNode(node)) {
            newTree.push(...handleEmoji(node))
            continue
        }
        if (node.tag === 'code' || node.tag === 'pre' || !node.content) {
            newTree.push(node)
            continue
        }
        if (typeof node.content === 'string') {
            newTree.push({ ...node, content: handleEmoji(node.content) })
            continue
        }
        if (Array.isArray(node.content)) {
            newTree.push({ ...node, content: node.content.map(handleEmoji).flat() })
            continue
        }
        newTree.push(node)
    }
    return createTree(newTree, options)
}

export const plugins = [preset(), customPlugin]

export default preset
// rep :t=345373
