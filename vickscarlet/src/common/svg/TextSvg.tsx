import { useState, useEffect } from 'react'
function getWidth(text: string, size: number, className: string) {
    const e = document.createElement('span')
    document.body.append(e)
    e.className = className
    e.style.fontSize = `${size}px`
    e.style.position = 'absolute'
    e.style.opacity = '0'
    e.append(document.createTextNode(text))
    const w = e.offsetWidth
    e.remove()
    return w
}

export interface Props {
    text: string
    className: string
}

export function TextSVG({ text, className }: Props) {
    const [size] = useState(10)
    const [width, setWidth] = useState(0)
    useEffect(() => {
        setWidth(getWidth(text, size, className))
    }, [size, text, className])
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox={`0 0 ${width} ${size}`}
        >
            <text fontSize={size}>{text}</text>
        </svg>
    )
}
export default TextSVG
