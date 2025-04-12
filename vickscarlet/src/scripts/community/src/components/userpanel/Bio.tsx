import { useEffect, useRef } from 'react'
import { it, resize } from '@/utils/nicescroll'
import { removeAllChildren } from '@common/dom'
import { NamedBoard } from './common/NamedBoard'
import User from '@common/svg/user.svg?react'
import './Bio.css'

export interface Data {
    bio: Element | null
    background?: string
}

export interface Props {
    data?: Data | null
}

export function Bio({ data }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (ref.current) it(ref.current)
    }, [ref.current])
    useEffect(() => {
        if (!data?.bio || !ref.current) return
        removeAllChildren(ref.current)
        ref.current.append(data.bio)
        resize(ref.current)
    }, [data, ref.current])
    return (
        <NamedBoard
            className="v-bio"
            loading={!data}
            background={data?.background}
            name={
                <>
                    <User /> Bio
                </>
            }
            onResize={() => resize(ref.current)}
        >
            <div className="v-wrapper" ref={ref} />
        </NamedBoard>
    )
}
export default Bio
