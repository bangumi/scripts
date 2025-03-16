import { useEffect, useRef, useState } from 'react'
import { it, resize } from '@/utils/nicescroll'
import { getNote, setNote } from '@/modules/user'
import { EditableBoard } from './common'
import NoteIcon from '@common/svg/note.svg?react'

export interface Props {
    id: string
    onChange?: () => void
}

export function Note({ id, onChange }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const [content, setContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (ref.current) it(ref.current)
    }, [ref.current])
    useEffect(() => {
        getNote(id).then((content) => {
            setLoading(false)
            setContent(content)
        })
    }, [id])
    useEffect(() => {
        resize(ref.current!)
        onChange?.()
    }, [content])
    return (
        <EditableBoard
            className="v-note"
            loading={loading}
            name={
                <>
                    <NoteIcon /> 备注
                </>
            }
            value={content ?? ''}
            onSave={async (content) => {
                await setNote(id, content).then(setContent)
            }}
            onResize={() => resize(ref.current)}
        >
            <div className="v-wrapper" ref={ref}>
                {content}
            </div>
        </EditableBoard>
    )
}
export default Note
