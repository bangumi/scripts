import { rootPortal } from '@/utils'
import { TipItem } from './common'
import Login from '@common/svg/login.svg?react'
import SignUp from '@common/svg/signup.svg?react'
import User from '@common/svg/user.svg?react'
import Notify from '@common/svg/notify.svg?react'
import Message from '@common/svg/message.svg?react'
import Setting from '@common/svg/setting.svg?react'
import Logout from '@common/svg/logout.svg?react'
import Light from '@common/svg/light.svg?react'
import Robot from '@common/svg/robot.svg?react'
import Up from '@common/svg/up.svg?react'
import './IconDock.css'

export interface Props {
    name: string
    home: string
    logout: string
}

export function IconDock({ name, home, logout }: Props) {
    return (
        <>
            {home.endsWith('/login') ? (
                <>
                    <li className="first" style={{ order: -2 }}>
                        <TipItem as="a" href="/login" tip="登录">
                            <Login />
                        </TipItem>
                    </li>
                    <li className="first" style={{ order: -1 }}>
                        <TipItem as="a" href="/signup" tip="注册">
                            <SignUp />
                        </TipItem>
                    </li>
                </>
            ) : (
                <>
                    <li className="first" style={{ order: -2 }}>
                        <TipItem as="a" href={home} tip={name}>
                            <User />
                        </TipItem>
                    </li>
                    <li style={{ order: -1 }}>
                        <TipItem as="a" href="/notify/all" tip="提醒">
                            <Notify />
                        </TipItem>
                    </li>
                    <li style={{ order: -1 }}>
                        <TipItem as="a" href="/pm" tip="短信">
                            <Message />
                        </TipItem>
                    </li>
                    <li style={{ order: -1 }}>
                        <TipItem as="a" href="/settings" tip="设置">
                            <Setting />
                        </TipItem>
                    </li>
                    <li style={{ order: -1 }}>
                        <TipItem as="a" href={logout} target="_self" tip="登出">
                            <Logout />
                        </TipItem>
                    </li>
                </>
            )}

            <li style={{ order: 1 }}>
                <TipItem
                    as="a"
                    tip="回顶部"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <Up />
                </TipItem>
            </li>
            <li style={{ order: 1 }}>
                <TipItem as="a" tip="开关灯" onClick={() => chiiLib.ukagaka.toggleTheme()}>
                    <Light />
                </TipItem>
            </li>
            <li className="last" style={{ order: 2 }}>
                <TipItem as="a" tip="春菜" onClick={() => chiiLib.ukagaka.toggleDisplay()}>
                    <Robot />
                </TipItem>
            </li>
        </>
    )
}
export default IconDock

export function replaceDock(dock?: HTMLElement | null) {
    if (!dock) return
    const userElement = dock.children[0]!.children[0]!.children[0]!
        .children[0]! as HTMLAnchorElement
    const home = userElement.href
    const name = userElement.innerText
    const logoutElement = dock.children[0]!.children[0]!.children[1]!
        .lastElementChild! as HTMLAnchorElement
    const logout = logoutElement.href
    const ul = dock.children[0]!.children[0]!
    ul.querySelectorAll('li.first,li.last,li:not(:has(*:only-child))').forEach(
        (e) => ((e as HTMLLIElement).style.display = 'none')
    )
    rootPortal(<IconDock name={name} home={home} logout={logout} />, ul)
}
