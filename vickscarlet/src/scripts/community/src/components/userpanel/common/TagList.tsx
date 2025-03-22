import { cn } from '@/utils'
import './TagList.css'

export type Props = React.JSX.IntrinsicElements['ul'] & {
    tags?: Iterable<string | number> | null
}

export function TagList({ tags, children, className, ...props }: Props) {
    const lis = []
    for (const tag of tags ?? []) lis.push(<li>{tag}</li>)
    return (
        <ul className={cn('v-tag-list', className)} {...props}>
            {children}
            {lis}
        </ul>
    )
}
export default TagList
