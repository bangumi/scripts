import { useEffect, useRef, useState } from 'react'
import { it, resize } from '@/utils/nicescroll'
import { usednames } from '@/modules/user'
import { NamedBoard, TagList } from './common'
import History from '@common/svg/history.svg?react'
import './TagListBoard.css'

export interface Props {
    id: string
    onChange?: () => void
}

export function UsedName({ id, onChange }: Props) {
    const ref = useRef<HTMLUListElement>(null)
    const [content, setContent] = useState<Set<string> | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (ref.current) it(ref.current)
    }, [ref.current])
    useEffect(() => {
        usednames(id).then((content) => {
            setLoading(false)
            setContent(content)
            resize(ref.current)
            onChange?.()
        })
    }, [id])
    return (
        <NamedBoard
            className="v-usedname"
            loading={loading}
            name={
                <>
                    <History /> 曾用名
                </>
            }
            onResize={() => resize(ref.current)}
        >
            <TagList className="v-wrapper" tags={content} ref={ref} />
        </NamedBoard>
    )
}
export default UsedName
