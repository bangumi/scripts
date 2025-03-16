import { Board } from '@/components/common/Board'
import { TextSVG } from '@common/svg/TextSvg'
import './Avatar.css'
export interface Data {
    id: string
    name: string
    src: string
}

export interface Props {
    data?: Data | null
}

export function Avatar({ data }: Props) {
    if (!data) return <Board className="v-avatar" loading />
    return (
        <Board className="v-avatar">
            <img src={data.src} />
            <TextSVG text={data.name} className="v-serif" />
            <span>{data.id}</span>
        </Board>
    )
}
export default Avatar
