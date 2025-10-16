import type { editor } from 'monaco-editor'

function validate(model: editor.ITextModel) {
    const text = model.getValue()
    const markers = []

    const lines = text.split(/\r?\n/)
    let cnt = 0
    let superblock = null
    let array = null
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]
        if (/^\s*$/.test(line)) continue
        let startLineNumber = i + 1
        let block = /^\s*{{\s*Infobox(?<type>\s+\S+)?\s*$/.exec(line)
        if (block) {
            let startColumn = line.indexOf('{{') + 1
            if (!superblock) {
                superblock = {
                    startLineNumber,
                    startColumn,
                    endLineNumber: startLineNumber,
                    endColumn: startColumn + 9,
                }
                if (!block.groups?.type) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Warning,
                        message: '没有类型',
                        ...superblock,
                    })
                }

                cnt++
                if (cnt > 1) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Error,
                        message: "只允许一个 '{{Infobox'",
                        ...superblock,
                    })
                }
                continue
            } else {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "没有匹配的 '}}'",
                    ...superblock,
                })
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "意外的 '{{Infobox'\n上一个 '{{Infobox' 没有匹配的 '}}'",
                    startLineNumber,
                    startColumn,
                    endLineNumber: startLineNumber,
                    endColumn: startColumn + 9,
                })
            }
            continue
        }
        if (/^\s*}}\s*$/.test(line)) {
            if (!superblock) {
                let startColumn = line.indexOf('}}') + 1
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "多余的 '}}'\n可能是漏了 '{{Infobox'",
                    startLineNumber,
                    startColumn,
                    endLineNumber: startLineNumber,
                    endColumn: startColumn + 2,
                })
            } else {
                superblock = null
            }
            continue
        }
        if (/^\s*\|/.test(line)) {
            let field =
                /^(?<start>\s*\|\s*)(?<key>[^=]+?)?(?<operator>\s*=\s*)(?<value>.+?)?\s*$/.exec(
                    line
                )
            if (!field) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: '错误的字段格式',
                    startLineNumber,
                    startColumn: line.search(/\S/) + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
                continue
            }
            if (array) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "缺少匹配的 '}'",
                    ...array,
                })
                array = null
            }
            let { start, key, operator, value } = field.groups ?? {}
            if (value && value.trim() == '{') {
                let startColumn = start.length + key.length + operator.length + 1
                array = {
                    startLineNumber,
                    startColumn,
                    endLineNumber: startLineNumber,
                    endColumn: startColumn + 1,
                }
            }
            continue
        }
        if (/^\s*}\s*$/.test(line)) {
            if (!array) {
                let startColumn = line.indexOf('}') + 1
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "多余的 '}'\n可能是漏了 '{'",
                    startLineNumber,
                    startColumn,
                    endLineNumber: startLineNumber,
                    endColumn: startColumn + 1,
                })
            } else {
                array = null
            }
            continue
        }
        let item = /^(?<start>\s*)(?<open>\[)?(?<content>.*?)(?<close>\])?\s*$/.exec(line)
        if (item) {
            if (!array) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "意外的数组项\n可能是漏了 '{'",
                    startLineNumber,
                    startColumn: line.search(/\S/) + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
            }
            if (!item.groups?.open) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "缺少 '['",
                    startLineNumber,
                    startColumn: item.groups?.start?.length ?? 0 + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
            }
            if (!item.groups?.close) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "缺少 ']'",
                    startLineNumber,
                    startColumn: item.groups?.start?.length ?? 0 + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
            }
            continue
        }
        markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '未知内容',
            startLineNumber,
            startColumn: line.search(/\S/) + 1,
            endLineNumber: startLineNumber,
            endColumn: line.length,
        })
    }
    if (superblock) {
        markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: "缺少匹配的 '}}'",
            ...superblock,
        })
    }
    monaco.editor.setModelMarkers(model, 'wiki-check', markers)
}

function agentWithMonaco(element: HTMLElement, init: string, onChange?: (value: string) => void) {
    monaco.languages.register({ id: 'bangumi-wiki' })
    monaco.languages.setMonarchTokensProvider('bangumi-wiki', {
        defaultToken: 'invalid',
        tokenPostfix: '.wiki',
        brackets: [
            { open: '{', close: '}', token: 'delimiter.bracket' },
            { open: '[', close: ']', token: 'delimiter.square' },
            { open: '{{', close: '}}', token: 'delimiter.doubleCurly' },
        ],
        keywords: ['Infobox'],
        operators: ['='],
        prefix: /Infobox/,
        nbstr: /[^|]+?/,
        nsstr: /[^\s]+?/,
        str: /.+?/,
        all: /.*?/,
        W: /\s+/,
        w: /\s*/,
        tokenizer: {
            root: [
                [
                    /({{)(@prefix)(@W?)(@nsstr?)(@w)$/,
                    [
                        'delimiter.bracket',
                        { token: 'keyword', next: '@superblock' },
                        '',
                        'type.identifier',
                        '',
                    ],
                ],
                [/.*/, 'invaild'],
            ],
            superblock: [
                [/^@w(}})@w$/, 'delimiter.bracket', '@pop'],
                [
                    /^(@w)(\|)(@w)(@str?)(@w)(=)(@w)(@all)(@w)$/,
                    [
                        '',
                        'delimiter',
                        '',
                        'identifier',
                        '',
                        'operator.symbol',
                        '',
                        {
                            cases: {
                                '{': { token: 'delimiter.curly', next: '@array' },
                                '@default': { token: 'string.unquoted' },
                            },
                        },
                        '',
                    ],
                ],
                [/.*/, 'invaild'],
            ],
            array: [
                [/^@w(})@w$/, 'delimiter.curly', '@pop'],
                [/^(@w)(\[)(@w)(\])(@w)$/, ['', 'delimiter.square', '', 'delimiter.square', '']],
                [
                    /^(@w)(\[)(@w)(@nbstr?)(@w)(\])(@w)$/,
                    ['', 'delimiter.square', '', 'string.unquoted', '', 'delimiter.square', ''],
                ],
                [
                    /^(@w)(\[)(@w)(@nbstr?)(@w)(\|)(@w)(\])(@w)$/,
                    [
                        '',
                        'delimiter.square',
                        '',
                        'identifier',
                        '',
                        'delimiter.squarekey',
                        '',
                        'delimiter.square',
                        '',
                    ],
                ],
                [
                    /^(@w)(\[)(@w)(@nbstr?)(@w)(\|)(@w)(@str?)(@w)(\])(@w)$/,
                    [
                        '',
                        'delimiter.square',
                        '',
                        'identifier',
                        '',
                        'delimiter.squarekey',
                        '',
                        'string.unquoted',
                        '',
                        'delimiter.square',
                        '',
                    ],
                ],
                [/.*/, 'invaild'],
            ],
        },
    })
    monaco.editor.defineTheme('bangumi-wiki', {
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
    })
    monaco.editor.defineTheme('bangumi-wiki-dark', {
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
    })
    monaco.languages.registerCompletionItemProvider('bangumi-wiki', {
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
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: ['{{Infobox $1', '|$2=$3', '}}'].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Wiki Block',
                    range: range,
                },
            ]
            return { suggestions: suggestions }
        },
    })
    monaco.languages.setLanguageConfiguration('bangumi-wiki', {
        folding: {
            markers: { start: /{/, end: /}/ },
        },
    })

    const uri = monaco.Uri.parse('inmemory://infobox.wiki')
    const model = monaco.editor.createModel(init, 'bangumi-wiki', uri)
    let isDark = document.children?.[0].getAttribute('data-theme') === 'dark'
    monaco.editor.create(element, {
        theme: isDark ? 'bangumi-wiki-dark' : 'bangumi-wiki',
        language: 'bangumi-wiki',
        model,
        automaticLayout: true,
        minimap: {
            enabled: false,
            showRegionSectionHeaders: false,
        },
    })
    validate(model)
    model.onDidChangeContent(() => {
        validate(model)
        onChange?.(model.getValue())
    })
    return (value: string) => {
        let old = model.getValue()
        if (old === value) return
        model.setValue(value)
    }
}

async function loadMonaco() {
    const getMonacoUrl = `https://cdn.jsdelivr.net/npm/monaco-editor/min/`
    await new Promise((resolve) => {
        let script = document.createElement('script')
        script.src = `${getMonacoUrl}vs/loader.js`
        script.onload = () => resolve(null)
        document.head.appendChild(script)
    })
    await new Promise((resolve) => {
        require.config({
            paths: {
                vs: `${getMonacoUrl}vs`,
            },
            'vs/nls': {
                availableLanguages: {
                    '*': 'zh-cn',
                },
            },
        })
        require(['vs/editor/editor.main'], () => resolve(null))
    })
}

async function main() {
    const element: HTMLTextAreaElement | null =
        document.querySelector('#subject_infobox') ?? document.querySelector('#subject_summary')
    if (!element) return

    await loadMonaco()
    let style = document.createElement('style')
    style.append(
        document.createTextNode(`
        .wiki-enhance-editor + #subject_infobox,
        .wiki-enhance-editor + #subject_summary{
            display:none !important;
        }
    `)
    )
    document.head.append(style)

    const resizeable = document.createElement('div')
    const editor = document.createElement('div')
    const resize = document.createElement('div')
    resizeable.append(editor)
    resizeable.append(resize)
    resizeable.classList.add('wiki-enhance-editor')
    editor.style.width = '100%'
    editor.style.height = '300px'
    resize.style.height = '300px'
    resize.style.resize = 'vertical'
    resize.style.overflow = 'auto'
    resize.style.width = '5px'
    resizeable.style.display = 'flex'
    resize.addEventListener('resize', () => {
        editor.style.height = resize.style.height
    })
    const obStyle = {
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: true,
        childList: false,
        characterData: false,
        subtree: false,
        characterDataOldValue: false,
    }
    new MutationObserver(() => {
        editor.style.height = resize.style.height
    }).observe(resize, obStyle)
    element.parentElement!.insertBefore(resizeable, element)
    resizeable.style.display = element.getAttribute('style')?.includes('display: none')
        ? 'none'
        : 'flex'
    let update = agentWithMonaco(editor, element.value, (value) => {
        if (element.value === value) return
        element.value = value
    })
    new MutationObserver((mutations) => {
        let oldValue = mutations[0].oldValue
        if (oldValue?.includes('display: none')) {
            resizeable.style.display = 'flex'
            update(element.value)
        } else {
            resizeable.style.display = 'none'
        }
    }).observe(element, obStyle)
}

main()
