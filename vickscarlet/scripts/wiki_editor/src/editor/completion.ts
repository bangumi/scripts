import { type languages } from 'monaco-editor'
import { monaco } from './loader'
export const completionProvider: languages.CompletionItemProvider = {
    provideCompletionItems: (model, position) => {
        var word = model.getWordUntilPosition(position)
        var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        }
        var suggestions = [
            {
                label: 'wiki',
                kind: monaco().languages.CompletionItemKind.Snippet,
                insertText: ['{{Infobox $1', '|$2=$3', '}}'].join('\n'),
                insertTextRules: monaco().languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Wiki Block',
                range: range,
            },
        ]
        return { suggestions: suggestions }
    },
}

export default completionProvider
