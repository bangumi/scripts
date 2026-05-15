import { useEffect, useRef, useState } from 'react'
import { it, resize } from '@/utils/nicescroll'
import { usednames } from '@/modules/user'
import { ActionsBoard, TagList } from './common'
import { formatTime } from '@/utils'
import History from '@b38dev/icon/svg/history.svg?react'
import './TagListBoard.css'

export interface Props {
    readonly id: string
    readonly onChange?: () => void
}

export function UsedName({ id, onChange }: Props) {
    const ref = useRef<HTMLUListElement>(null)
    const [content, setContent] = useState<Set<string> | null>(null)
    const [update, setUpdate] = useState<string>('')
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (ref.current) it(ref.current)
    }, [ref.current])
    useEffect(() => {
        usednames(id).then(({ names, update }) => {
            setLoading(false)
            setContent(names)
            setUpdate(formatTime(new Date(update)))
            resize(ref.current)
            onChange?.()
        })
    }, [id])
    return (
        <ActionsBoard
            className="v-usedname"
            loading={loading}
            name={
                <>
                    <History /> 曾用名
                </>
            }
            onResize={() => resize(ref.current)}
            actions={[
                {
                    icon: <span>{update}</span>,
                    tip: '数据最后更新时间',
                },
            ]}
        >
            <TagList className="v-wrapper" tags={content} ref={ref} />
        </ActionsBoard>
    )
}
export default UsedName
