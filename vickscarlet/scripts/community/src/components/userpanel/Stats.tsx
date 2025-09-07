import { Board, TipItem } from '@/components/common'
import { cn } from '@/utils'
import { Stat } from '@/modules/user'
import './Stats.css'

export type Data = Stat[]

export interface Props {
    readonly data?: Data | null
}

export function Stats({ data }: Props) {
    if (!data) return <Board className="v-stats" loading />
    return (
        <Board as="ul" className="v-stats">
            {data.map(({ type, value, name }) => (
                <TipItem key={type} as="li" className={cn('v-stat', 'v-' + type)} tip={name}>
                    {value}
                </TipItem>
            ))}
        </Board>
    )
}
export default Stats
