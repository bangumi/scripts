import { type languages } from 'monaco-editor'
export const tokensProvider: languages.IMonarchLanguage = {
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
            [/.*/, 'invalid'],
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
            [/.*/, 'invalid'],
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
            [/.*/, 'invalid'],
        ],
    },
}
export default tokensProvider
