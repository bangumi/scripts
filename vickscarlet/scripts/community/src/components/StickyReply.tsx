import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { rootPortal } from '@/utils'
import { Switch } from '@/components/common'
import './StickyReply.css'

export interface Props {
    wrapper: Element
    before: Element
}

function isSticky() {
    return localStorage.getItem('stickyReplySwitch') != '0'
}

export function StickyReply({ wrapper, before }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const [sticky, setSticky] = useState(isSticky)
    const [placehold] = useState(() => document.createElement('div'))
    useEffect(() => {
        if (!ref.current) return
        before.parentElement?.insertBefore(ref.current, before)
    }, [before, ref.current])
    useEffect(() => {
        if (!ref.current) return
        if (sticky) {
            localStorage.setItem('stickyReplySwitch', '1')
            wrapper.replaceWith(placehold)
            ref.current.append(wrapper)
        } else {
            localStorage.setItem('stickyReplySwitch', '0')
            placehold.replaceWith(wrapper)
        }
    }, [sticky, ref.current])
    return (
        <div className="v-sticky-reply" ref={ref}>
            {createPortal(
                <Switch
                    defaultEnabled={sticky}
                    onEnable={() => setSticky(true)}
                    onDisable={() => setSticky(false)}
                />,
                wrapper
            )}
        </div>
    )
}
export default StickyReply

export function stickyIt(wrapper?: Element | null) {
    if (!wrapper) return
    const container = wrapper.parentElement!
    container
        .querySelector<HTMLElement>('#sliderContainer')
        ?.style.setProperty('display', 'none', 'important')
    const before =
        container.querySelector(':scope>.clearit') ||
        container.querySelector(':scope>#comment_list') ||
        wrapper
    rootPortal(<StickyReply wrapper={wrapper} before={before} />, container)
}
