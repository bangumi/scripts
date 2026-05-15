export type Tags = keyof React.JSX.IntrinsicElements
export type Props<Tag extends Tags = Tags> =
    React.JSX.IntrinsicElements[Tag] & {
        as?: Tag
    }

export function AsElement({ as, ...other }: Props) {
    const Type = as || ('div' as React.ElementType)
    return <Type className="tip-item" {...other} />
}
export default AsElement
