import { cn } from '@/utils'
import { TipItem } from '@/components/common'
import { NamedBoard, type Props as NamedBoardProps } from './NamedBoard'
import './ActionsBoard.css'

export interface Action {
    icon: React.ReactNode
    tip?: React.ReactNode
    action?: () => void
}
export type Props = NamedBoardProps & {
    actions?: Action[]
}

export function ActionsBoard({
    actions,
    className,
    children,
    ...props
}: Props) {
    return (
        <NamedBoard className={cn('v-actions-board', className)} {...props}>
            <ul className="v-actions-list">
                {actions?.map(({ icon, tip, action }) => (
                    <TipItem tip={tip} onClick={action}>
                        {icon}
                    </TipItem>
                ))}
            </ul>
            {children}
        </NamedBoard>
    )
}
export default ActionsBoard
