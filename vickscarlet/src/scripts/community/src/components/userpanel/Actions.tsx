import { useEffect, useState } from 'react'
import { Board } from '@/components/common/Board'
import { TipItem } from '@/components/common/TipItem'
import Home from '@common/svg/home.svg?react'
import Message from '@common/svg/message.svg?react'
import Connect from '@common/svg/connect.svg?react'
import DisConnect from '@common/svg/disconnect.svg?react'
import Blocked from '@common/svg/blocked.svg?react'
import Notify from '@common/svg/notify.svg?react'
import {
    isBlocked,
    goHome,
    goPm,
    goLogin,
    unblock,
    block,
    connect,
    disconnect,
} from '@/modules/user'
import './Actions.css'

export interface Data {
    type: 'normal' | 'self' | 'friend' | 'guest'
    id: string
    nid?: string
    gh?: string
}

export interface Props {
    data?: Data | null
}

export function Actions({ data }: Props) {
    if (!data) return <Board className="v-actions" loading />
    const [isGuest, setGuest] = useState(false)
    const [isSelf, setSelf] = useState(false)
    const [blocked, setBlocked] = useState(false)
    const [connected, setConnected] = useState(false)
    useEffect(() => {
        setGuest(data.type == 'guest')
        setSelf(data.type == 'self')
        setConnected(data.type == 'friend')
        isBlocked(data.id).then(setBlocked)
    }, [data])

    return (
        <Board as="ul" className="v-actions">
            <TipItem
                as="li"
                className="v-home"
                tip="主页"
                onClick={() => goHome(data.id)}
            >
                <Home />
            </TipItem>
            <TipItem
                as="li"
                className="v-pm"
                tip="私信"
                onClick={() => {
                    if (isGuest)
                        return (
                            confirm('暂未登录，是否打开登录页面') && goLogin()
                        )
                    if (isSelf) return alert('这是自己')
                    goPm(data.nid!)
                }}
            >
                <Message />
            </TipItem>
            <TipItem
                as="li"
                className="v-friend"
                tip={connected ? '解除好友' : '加好友'}
                onClick={async () => {
                    if (isGuest)
                        return (
                            confirm('暂未登录，是否打开登录页面') && goLogin()
                        )
                    if (isSelf) return alert('这是自己')
                    const action = connected ? disconnect : connect
                    const ret = await action(data.nid!, data.gh!)
                    if (ret) setConnected(!connected)
                }}
            >
                {isGuest && isSelf && connected ? <DisConnect /> : <Connect />}
            </TipItem>
            <TipItem
                as="li"
                className="v-blocked"
                tip={blocked ? '解除屏蔽' : '屏蔽'}
                onClick={async () => {
                    const action = blocked ? unblock : block
                    const ret = await action(data.id)
                    if (ret) setBlocked(!blocked)
                }}
            >
                {blocked ? <Blocked /> : <Notify />}
            </TipItem>
        </Board>
    )
}
export default Actions
