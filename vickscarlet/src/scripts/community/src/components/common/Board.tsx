import { cn } from '@/utils'
import { LoadingBox, type Props } from './LoadingBox'
import './Board.css'
export type { Props }

export function Board({ className, ...props }: Props) {
    return <LoadingBox className={cn('v-board', className)} {...props} />
}
export default Board
