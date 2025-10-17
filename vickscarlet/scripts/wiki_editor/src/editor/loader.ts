import { loadScript } from '@b38dev/dom'
export type Monaco = typeof import('monaco-editor')
export interface Require {
    config: (params: any) => void
    (modules: string[], callback: (...args: any[]) => void): void
}

export async function load(monacoBase: string) {
    await loadScript(`${monacoBase}vs/loader.js`)
    return new Promise<Monaco>((resolve) => {
        const require = (window as any).require as Require
        require.config({
            paths: { vs: `${monacoBase}vs` },
            'vs/nls': { availableLanguages: { '*': 'zh-cn' } },
        })
        require(['vs/editor/editor.main'], () => resolve((window as any).monaco))
    })
}

export function monaco() {
    let monaco = (window as any).monaco as Monaco
    if (!monaco) throw new Error('Monaco 未加载')
    return monaco
}

export default load
