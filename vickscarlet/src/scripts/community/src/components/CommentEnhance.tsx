import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { rootPortal } from '@/utils'
import { waitElement } from '@common/dom'
import { block, getBlockeds, unblock } from '@/modules/user'
import { get as getFriends } from '@/modules/friends'
import { UserPanel } from '@/components'
import { whoami } from '@common/bangumi'
import Mark from '@common/svg/mark.svg?react'
import Collapse from '@common/svg/collapse.svg?react'
import Expand from '@common/svg/expand.svg?react'
import Blocked from '@common/svg/blocked.svg?react'
import Notify from '@common/svg/notify.svg?react'
import Detail from '@common/svg/detail.svg?react'
import './CommentEnhance.css'

export interface Props {
    comment: Element
    owner?: string | null
    floor?: string | null
}

export function CommentEnhance({ comment, owner, floor }: Props) {
    const [user] = useState(() => comment.getAttribute('data-item-user') as string)
    const menuRef = useRef<HTMLDivElement>(null)
    const [actions, setActions] = useState<Element | null>(null)
    const [showPanel, setShowPanel] = useState(false)
    const [collapse, setCollapse] = useState(false)
    const [blocked, setBlocked] = useState(false)
    useEffect(() => {
        if (!menuRef.current) return
        if (!actions) return menuRef.current.remove()
        if (actions.children.length < 2) actions.append(menuRef.current)
        else actions.insertBefore(menuRef.current, actions.lastElementChild!)
    }, [menuRef.current, actions])
    useEffect(() => {
        if (user === whoami()?.id) comment.classList.add('v-self')
        if (user === owner) comment.classList.add('v-owner')
        if (user === floor) comment.classList.add('v-floor')
        getBlockeds().then((blockeds) => {
            if (!blockeds.has(user)) return
            setBlocked(true)
            setCollapse(true)
        })
        getFriends().then((friends) => {
            if (!friends.has(user)) return
            comment.classList.add('v-friend')
        })
        waitElement(comment, '.post_actions').then(setActions)
    }, [comment])
    useEffect(() => {
        if (collapse) comment.classList.add('v-collapse')
        else comment.classList.remove('v-collapse')
    }, [collapse, comment])
    return (
        <div className="action dropdown" ref={menuRef}>
            <a className="icon">
                <Mark />
            </a>
            <ul>
                <li onClick={() => setCollapse(!collapse)}>
                    <a>
                        {collapse ? (
                            <>
                                <Expand />
                                <span>展开发言</span>
                            </>
                        ) : (
                            <>
                                <Collapse />
                                <span>折叠发言</span>
                            </>
                        )}
                    </a>
                </li>
                <li
                    onClick={async () => {
                        const promise = blocked ? unblock(user) : block(user)
                        if (await promise) {
                            const newState = !blocked
                            setBlocked(newState)
                            setCollapse(newState)
                        }
                    }}
                >
                    <a>
                        {blocked ? (
                            <>
                                <Notify />
                                <span>取消屏蔽</span>
                            </>
                        ) : (
                            <>
                                <Blocked />
                                <span>屏蔽发言</span>
                            </>
                        )}
                    </a>
                </li>
                <li onClick={() => setShowPanel(true)}>
                    <a>
                        <Detail />
                        <span>详细信息</span>
                    </a>
                </li>
                {showPanel &&
                    createPortal(
                        <UserPanel id={user} onClose={() => setShowPanel(false)} />,
                        document.body
                    )}
            </ul>
        </div>
    )
}
export default CommentEnhance

export function commentEnhance(props: Props) {
    rootPortal(<CommentEnhance {...props} />, props.comment)
}
