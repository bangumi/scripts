import { type editor } from 'monaco-editor'

export const lightTheme: editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    colors: {},
    rules: [
        { token: 'delimiter.bracket', foreground: '#ca565f' },
        { token: 'keyword', foreground: '#ca565f' },
        { token: 'delimiter', foreground: '#004dc0' },
        { token: 'operator', foreground: '#004dc0' },
        { token: 'type.identifier', foreground: '#2dabff' },
        { token: 'identifier', foreground: '#7839af' },
        { token: 'string', foreground: '#339900' },
    ],
}

export const darkTheme: editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    colors: {},
    rules: [
        { token: 'delimiter.bracket', foreground: '#f09199' },
        { token: 'keyword', foreground: '#f09199' },
        { token: 'delimiter', foreground: '#7bb0ff' },
        { token: 'operator', foreground: '#7bb0ff' },
        { token: 'type.identifier', foreground: '#aaddff' },
        { token: 'identifier', foreground: '#ca9ce6' },
        { token: 'string', foreground: '#a9d861' },
    ],
}

export const themes = {
    light: lightTheme,
    dark: darkTheme,
}

export default themes
