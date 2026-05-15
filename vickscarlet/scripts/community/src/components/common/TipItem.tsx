import { cn } from '@/utils'
import { AsElement, Props as AsProps } from './AsElement'
import './TipItem.css'

export type Props = AsProps & {
    tip?: React.ReactNode
}

export function TipItem({ tip, className, children, ...other }: Props) {
    return (
        <AsElement className={cn('v-tip-item', className)} {...other}>
            {children}
            {tip ? <span className="v-tip">{tip}</span> : <></>}
        </AsElement>
    )
}
export default TipItem
