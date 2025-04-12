import { useState, useEffect, useRef } from 'react'
import { it, resize } from '@/utils/nicescroll'
import { homepage } from '@/modules/user'
import { Avatar, type Data as AvatarData } from './Avatar'
import { Actions, type Data as ActionsData } from './Actions'
import { Stats, type Data as StatsData } from './Stats'
import { Chart, type Data as ChartData } from './Chart'
import { Bio, type Data as BioData } from './Bio'
import { UsedName } from './UsedName'
import { Tags } from './Tags'
import { Note } from './Note'
import './index.css'

export interface UserPanelProps {
    id: string
    onClose?: () => PromiseLike<void> | void
}

export function UserPanel({ id, onClose }: UserPanelProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [avatar, setAvatar] = useState<AvatarData | null>(null)
    const [actions, setActions] = useState<ActionsData | null>(null)
    const [stats, setStats] = useState<StatsData | null>(null)
    const [chart, setChart] = useState<ChartData | null>(null)
    const [bio, setBio] = useState<BioData | null>(null)
    useEffect(() => {
        if (ref.current) it(ref.current)
    }, [ref.current])
    useEffect(() => {
        homepage(id).then((data) => {
            if (!data) return
            const { type, name, src, nid, gh, stats, chart, bio } = data
            setAvatar({ id, name, src })
            setActions({ type, id, nid, gh })
            setStats(stats)
            setChart(chart)
            setBio({ bio, background: `url(${src})` })
        })
    }, [id])
    return (
        <div id="community-helper-user-panel">
            <div className="v-close-mask" onClick={onClose}></div>
            <div className="v-container" ref={ref} onResize={() => resize(ref.current)}>
                <Avatar data={avatar} />
                <Actions data={actions} />
                <Stats data={stats} />
                <Chart data={chart} />
                <Bio data={bio} />
                <UsedName id={id} />
                <Tags id={id} />
                <Note id={id} />
            </div>
        </div>
    )
}
export default UserPanel
