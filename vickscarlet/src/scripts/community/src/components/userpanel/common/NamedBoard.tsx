import { Board, type BoardProps } from '@/components/common'
import './NamedBoard.css'

export type Props = BoardProps & {
    name?: React.ReactNode
}

export function NamedBoard({ name, children, ...props }: Props) {
    return (
        <Board as="fieldset" {...props}>
            <legend>{name}</legend>
            {children}
        </Board>
    )
}
export default NamedBoard
