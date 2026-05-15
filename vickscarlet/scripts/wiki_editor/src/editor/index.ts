export { load } from './loader'
import { config } from './config'
export { config }

import { monaco } from './loader'
import { validate } from './validate'
import { tokensProvider } from './tokens'
import { themes } from './theme'
import { completionProvider } from './completion'
import { languageConfiguration } from './configuration'

export function create(element: HTMLElement, init: string, onChange?: (value: string) => void) {
    const WIKI = 'bangumi-wiki'
    const LIGHT = WIKI
    const DARK = WIKI + '-dark'
    const m = monaco()
    m.languages.register({ id: WIKI })
    m.languages.setMonarchTokensProvider(WIKI, tokensProvider)
    m.editor.defineTheme(LIGHT, themes.light)
    m.editor.defineTheme(DARK, themes.dark)
    m.languages.registerCompletionItemProvider(WIKI, completionProvider)
    m.languages.setLanguageConfiguration(WIKI, languageConfiguration)
    const uri = m.Uri.parse('inmemory://infobox.wiki')
    const model = m.editor.createModel(init, WIKI, uri)
    const editor = m.editor.create(element, {
        theme: config.isDark ? DARK : LIGHT,
        language: WIKI,
        model,
        automaticLayout: true,
        lineNumbers: config.showLineNumber ? 'on' : 'off',
        wordWrap: config.wordWrap ? 'on' : 'off',
        minimap: {
            enabled: config.showMiniMap,
            showRegionSectionHeaders: false,
        },
    })
    validate(model)
    model.onDidChangeContent(() => {
        validate(model)
        onChange?.(model.getValue())
    })
    config.on('showLineNumber', (value) => {
        editor.updateOptions({ lineNumbers: value ? 'on' : 'off' })
    })
    config.on('showMiniMap', (value) => {
        editor.updateOptions({
            minimap: { enabled: value, showRegionSectionHeaders: false },
        })
    })
    config.on('wordWrap', (value) => {
        editor.updateOptions({ wordWrap: value ? 'on' : 'off' })
    })
    config.on('isDark', (value) => {
        editor.updateOptions({ theme: value ? DARK : LIGHT })
    })
    return (value: string) => {
        let old = model.getValue()
        if (old === value) return
        model.setValue(value)
    }
}

export default create
