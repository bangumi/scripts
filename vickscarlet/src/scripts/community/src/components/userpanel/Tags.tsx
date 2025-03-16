import { useEffect, useRef, useState } from 'react'
import { it, resize } from '@/utils/nicescroll'
import { getTags, setTagsByString } from '@/modules/user'
import { EditableBoard, TagList } from './common'
import Tag from '@common/svg/tag.svg?react'
import './TagListBoard.css'

export interface Props {
    id: string
    onChange?: () => void
}

export function Tags({ id, onChange }: Props) {
    const ref = useRef<HTMLUListElement>(null)
    const [content, setContent] = useState<Set<string> | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (ref.current) it(ref.current)
    }, [ref.current])
    useEffect(() => {
        getTags(id).then((content) => {
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
            className="v-tags"
            loading={loading}
            name={
                <>
                    <Tag /> 标签
                </>
            }
            value={Array.from(content ?? []).join('\n')}
            onSave={async (content) => {
                await setTagsByString(id, content).then(setContent)
            }}
            onResize={() => resize(ref.current)}
        >
            <TagList className="v-wrapper" tags={content} ref={ref} />
        </EditableBoard>
    )
}
export default Tags
