import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { rootPortal } from '@/utils'
import { Switch } from '@/components/common'
import './SickyReply.css'

export interface Props {
    wrapper: Element
    before: Element
}

function isSicky() {
    return localStorage.getItem('sickyReplySwitch') != '0'
}

export function SickyReply({ wrapper, before }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const [sicky, setSicky] = useState(isSicky)
    const [placehold] = useState(() => document.createElement('div'))
    useEffect(() => {
        if (!ref.current) return
        before.parentElement?.insertBefore(ref.current, before)
    }, [before, ref.current])
    useEffect(() => {
        if (!ref.current) return
        if (sicky) {
            localStorage.setItem('sickyReplySwitch', '1')
            wrapper.replaceWith(placehold)
            ref.current.append(wrapper)
        } else {
            localStorage.setItem('sickyReplySwitch', '0')
            placehold.replaceWith(wrapper)
        }
    }, [sicky, ref.current])
    return (
        <div className="v-sicky-reply" ref={ref}>
            {createPortal(
                <Switch
                    defaultEnabled={sicky}
                    onEnable={() => setSicky(true)}
                    onDisable={() => setSicky(false)}
                />,
                wrapper
            )}
        </div>
    )
}
export default SickyReply

export function sickyIt(wrapper?: Element | null) {
    if (!wrapper) return
    const container = wrapper.parentElement!
    container
        .querySelector<HTMLElement>('#sliderContainer')
        ?.style.setProperty('display', 'none', 'important')
    const before =
        container.querySelector(':scope>.clearit') ||
        container.querySelector(':scope>#comment_list') ||
        wrapper
    rootPortal(<SickyReply wrapper={wrapper} before={before} />, container)
}
