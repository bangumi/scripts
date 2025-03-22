import { useEffect, useState } from 'react'
import {
    ActionsBoard,
    type Action,
    type Props as ActionsBoardProps,
} from './ActionsBoard'
import Edit from '@common/svg/edit.svg?react'
import Confirm from '@common/svg/confirm.svg?react'
import Close from '@common/svg/close.svg?react'
import './EditableBoard.css'

export type Props = ActionsBoardProps & {
    value?: string
    onSave?: (content: string) => Promise<void> | void
}

export function EditableBoard({
    value = '',
    onSave,
    actions = [],
    children,
    ...props
}: Props) {
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState<string>(value)
    const acts = [...actions]
    if (editing) {
        acts.push(
            {
                icon: <Confirm />,
                tip: '确定',
                action: () => {
                    onSave?.(editValue)
                    setEditing(false)
                },
            },
            {
                icon: <Close />,
                tip: '取消',
                action: () => {
                    setEditValue(value)
                    setEditing(false)
                },
            }
        )
    } else {
        acts.push({
            icon: <Edit />,
            tip: '编辑',
            action: () => {
                setEditValue(value)
                setEditing(true)
            },
        })
    }
    return (
        <ActionsBoard actions={acts} {...props}>
            {editing && (
                <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                />
            )}
            {children}
        </ActionsBoard>
    )
}
export default EditableBoard
