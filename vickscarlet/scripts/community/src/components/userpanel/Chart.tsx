import { Board, TipItem } from '@/components/common'
import type { Chart } from '@/modules/user'
import './Chart.css'

export type Data = Chart[]

export interface Props {
    readonly data?: Data | null
}

export function Chart({ data }: Props) {
    if (!data) return <Board className="v-chart" loading />
    const max = Math.max(...data.map((v) => v.value))
    return (
        <Board as="ul" className="v-chart">
            {data.map(({ label, value }) => (
                <TipItem key={label} as="li" tip={`${label}分: ${value}`}>
                    <div
                        className="v-bar"
                        style={{
                            width: ((value / max) * 100).toFixed(2) + '%',
                        }}
                    />
                </TipItem>
            ))}
        </Board>
    )
}
export default Chart
