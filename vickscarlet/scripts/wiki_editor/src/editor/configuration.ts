import { type languages } from 'monaco-editor'
export const languageConfiguration: languages.LanguageConfiguration = {
    folding: {
        markers: { start: /{/, end: /}/ },
    },
}

export default languageConfiguration
