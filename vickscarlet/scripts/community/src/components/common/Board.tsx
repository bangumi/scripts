import { useEffect, useRef } from 'react'
import { cn } from '@/utils'
import { LoadingBox, type Props as LoadingBoxProps } from './LoadingBox'
import './Board.css'

export type Props = LoadingBoxProps & {
    background?: string
}

export function Board({ className, background, ref: r, ...props }: Props) {
    const ref = useRef<HTMLElement>(null)
    useEffect(() => {
        if (ref.current) ref.current.style.setProperty('--board-before-bg', background ?? '')
    }, [ref.current, background])
    return (
        <LoadingBox
            className={cn('v-board', className)}
            ref={
                ((node: HTMLElement) => {
                    ref.current = node
                    if (!r) return
                    if (r instanceof Function) {
                        r(node as any)
                    } else {
                        r.current = node
                    }
                }) as React.Ref<any>
            }
            {...props}
        />
    )
}
export default Board
