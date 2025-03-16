import { AsElement, Props as AsProps } from './AsElement'
import { cn } from '@/utils'
import './LoadingBox.css'
export type Props = AsProps & {
    loading?: boolean
}

export function LoadingBox({ loading, children, className, ...others }: Props) {
    return (
        <AsElement
            className={cn(loading && 'v-loading', className)}
            {...others}
        >
            {children}
            {loading && <div className="v-loading-item" />}
        </AsElement>
    )
}
export default LoadingBox
