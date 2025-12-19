import type { Schema, SchemaRule } from '@/util/param'
import { keyShortcut } from '@/App'
import { commandDescription } from '@/api'
import './CommandTips.css'

export interface ParametersProps<T extends Record<string, SchemaRule>> {
    schema: Schema<T>
}

export function Parameters<T extends Record<string, SchemaRule>>({ schema }: ParametersProps<T>) {
    if (!Object.keys(schema).length)
        return (
            <ul>
                <li>
                    <code>无</code>
                </li>
            </ul>
        )
    return (
        <ul>
            {Object.entries(schema).map(([name, rule]) => (
                <li key={name}>
                    <code>{rule.optional ? '可选' : '必需'}</code>
                    <code>{name}</code>:<code>{renderType(rule)}</code>
                    {rule.description}
                </li>
            ))}
        </ul>
    )
}

function renderType(rule: SchemaRule): string {
    switch (rule.type) {
        case 'string':
        case 'boolean':
        case 'number':
            return rule.type
        case 'enum':
            return rule.values.map((v) => JSON.stringify(v)).join(' | ')
    }
}

export interface CommandTipsProps<
    T extends Record<string, SchemaRule> = Record<string, SchemaRule>
> {
    kempty?: boolean
    schema: Schema<T>
}

export function CommandTips({ kempty, schema }: CommandTipsProps) {
    return (
        <>
            <li>
                <span>关键词:</span>
                <ul>
                    <li>
                        <code>{kempty ? '可选' : '必需'}</code>
                    </li>
                </ul>
            </li>
            <li>
                <span>参数:</span>
                <Parameters schema={schema} />
            </li>
        </>
    )
}

export function MainTips() {
    return (
        <>
            <li>
                <span>快捷键</span>
                <ul>
                    {keyShortcut.map(({ shortcuts, description }) => (
                        <li key={description}>
                            {shortcuts.map(({ key, ctrl }) => (
                                <code key={key + (ctrl ? '_ctrl' : '')}>
                                    {ctrl ? 'Ctrl-' : ''}
                                    {key}
                                </code>
                            ))}
                            {description}
                        </li>
                    ))}
                </ul>
            </li>
            <li>
                <span>参数</span>
                <ul>
                    <li>
                        <code>:</code>开头
                        <code>=</code>赋值
                    </li>
                    <li>
                        示例:<code>:u=sai</code>或<code>:u sai</code>
                        <br />
                        表示<code>u</code>参数为<code>sai</code>
                    </li>
                </ul>
            </li>
            <li>
                <span>命令</span>
                <ul>
                    {Array.from(commandDescription.entries()).map(
                        ([command, { commands, description, isDefault }]) => (
                            <li key={command}>
                                {commands.map((cmd) => (
                                    <code key={cmd}>{cmd}</code>
                                ))}
                                {description} {isDefault && <code>(默认)</code>}
                            </li>
                        )
                    )}
                </ul>
            </li>
        </>
    )
}

export interface TipsProps {
    tips?: React.ReactNode | null
}

export function Tips(props: TipsProps) {
    return <ul className="v-search-command-tips">{props.tips}</ul>
}
export default Tips
