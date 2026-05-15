import type { editor } from 'monaco-editor'
import { monaco } from './loader'

export function validate(model: editor.ITextModel) {
    const text = model.getValue()
    const markers = []
    const { editor, MarkerSeverity: severity } = monaco()
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
                        severity: severity.Warning,
                        message: '没有类型',
                        ...superblock,
                    })
                }

                cnt++
                if (cnt > 1) {
                    markers.push({
                        severity: severity.Error,
                        message: "只允许一个 '{{Infobox'",
                        ...superblock,
                    })
                }
                continue
            } else {
                markers.push({
                    severity: severity.Error,
                    message: "没有匹配的 '}}'",
                    ...superblock,
                })
                markers.push({
                    severity: severity.Error,
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
                    severity: severity.Error,
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
                    severity: severity.Error,
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
                    severity: severity.Error,
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
                    severity: severity.Error,
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
                    severity: severity.Error,
                    message: "意外的数组项\n可能是漏了 '{'",
                    startLineNumber,
                    startColumn: line.search(/\S/) + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
            }
            if (!item.groups?.open) {
                markers.push({
                    severity: severity.Error,
                    message: "缺少 '['",
                    startLineNumber,
                    startColumn: (item.groups?.start?.length ?? 0) + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
            }
            if (!item.groups?.close) {
                markers.push({
                    severity: severity.Error,
                    message: "缺少 ']'",
                    startLineNumber,
                    startColumn: (item.groups?.start?.length ?? 0) + 1,
                    endLineNumber: startLineNumber,
                    endColumn: line.length,
                })
            }
            continue
        }
        markers.push({
            severity: severity.Error,
            message: '未知内容',
            startLineNumber,
            startColumn: line.search(/\S/) + 1,
            endLineNumber: startLineNumber,
            endColumn: line.length,
        })
    }
    if (superblock) {
        markers.push({
            severity: severity.Error,
            message: "缺少匹配的 '}}'",
            ...superblock,
        })
    }
    editor.setModelMarkers(model, 'wiki-check', markers)
}
export default validate
