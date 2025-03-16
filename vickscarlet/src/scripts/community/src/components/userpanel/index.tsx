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
            setBio({ bio })
        })
        // Promise.all(
        //     [
        //         async () => {
        //             // 屏蔽按钮
        //             const blocked = await User.isBlocked(id);
        //             if (!this.#isShow || id != this.#id) return;
        //             if (blocked) unblockBtn.replaceWith(blockedBtn);
        //             blockedBtn.addEventListener('click', async () => {
        //                 if (await User.unblock(id)) blockedBtn.replaceWith(unblockBtn);
        //             });
        //             unblockBtn.addEventListener('click', async () => {
        //                 if (await User.block(id)) unblockBtn.replaceWith(blockedBtn);
        //             });
        //             this.#resize();
        //         },
        //         async () => {
        //             // 标签
        //             const e = tags;
        //             const edit = create(
        //                 'div',
        //                 { class: ['svg-icon', 'action', 'normal'] },
        //                 SvgIcon.edit(),
        //                 ['span', '编辑']
        //             );
        //             const ok = create(
        //                 'div',
        //                 { class: ['svg-icon', 'action', 'edit'] },
        //                 SvgIcon.ok(),
        //                 ['span', '保存']
        //             );
        //             const close = create(
        //                 'div',
        //                 { class: ['svg-icon', 'action', 'edit'] },
        //                 SvgIcon.close(),
        //                 ['span', '取消']
        //             );
        //             const content = create('ul', { class: 'normal' });
        //             const textarea = create('textarea', { class: 'edit' });
        //             const wrapper = create('div', { class: 'wrapper' }, content, textarea);
        //             const actions = create('div', { class: ['actions'] }, edit, ok, close);
        //             append(e, wrapper, actions);
        //             this.#niceIt(content);
        //             this.#niceIt(textarea);
        //             const render = async (save = false, value) => {
        //                 removeAllChildren(content);
        //                 e.classList.add('loading');
        //                 e.classList.remove('editing');
        //                 const tags = save
        //                     ? await User.setTags(
        //                           id,
        //                           value.split('\n').map((tag) => tag.trim())
        //                       )
        //                     : await User.getTags(id);
        //                 if (!this.#isShow || id != this.#id) return;
        //                 e.classList.remove('loading');
        //                 append(content, ...map(tags, (tag) => ['li', tag]));
        //                 this.#resize();
        //             };
        //             edit.addEventListener('click', () => {
        //                 e.classList.add('editing');
        //                 textarea.value = Array.from(content.children, (e) => e.innerText).join(
        //                     '\n'
        //                 );
        //                 textarea.focus();
        //                 textarea.setSelectionRange(0, 0);
        //                 NiceScroll.to(textarea, { x: 0, y: 0 });
        //             });
        //             ok.addEventListener('click', () => render(true, textarea.value));
        //             close.addEventListener('click', () => render());
        //             await render();
        //         },
        //         async () => {
        //             // 备注
        //             const e = note;
        //             const edit = create(
        //                 'div',
        //                 { class: ['svg-icon', 'action', 'normal'] },
        //                 SvgIcon.edit(),
        //                 ['span', '编辑']
        //             );
        //             const ok = create(
        //                 'div',
        //                 { class: ['svg-icon', 'action', 'edit'] },
        //                 SvgIcon.ok(),
        //                 ['span', '保存']
        //             );
        //             const close = create(
        //                 'div',
        //                 { class: ['svg-icon', 'action', 'edit'] },
        //                 SvgIcon.close(),
        //                 ['span', '取消']
        //             );
        //             const content = create('div', { class: 'normal' }, ['span']);
        //             const textarea = create('textarea', { class: 'edit' });
        //             const wrapper = create('div', { class: 'wrapper' }, content, textarea);
        //             const actions = create('div', { class: ['actions'] }, edit, ok, close);
        //             append(e, wrapper, actions);
        //             this.#niceIt(content);
        //             this.#niceIt(textarea);
        //             const render = async (save = false, value = '') => {
        //                 removeAllChildren(content);
        //                 e.classList.add('loading');
        //                 e.classList.remove('editing');
        //                 const note = save ? await User.setNote(id, value) : await User.getNote(id);
        //                 if (!this.#isShow || id != this.#id) return;
        //                 e.classList.remove('loading');
        //                 append(content, ['span', note ?? '']);
        //                 this.#resize();
        //             };
        //             edit.addEventListener('click', () => {
        //                 e.classList.add('editing');
        //                 textarea.value = content.innerText;
        //                 textarea.focus();
        //                 textarea.setSelectionRange(0, 0);
        //                 NiceScroll.to(textarea, { x: 0, y: 0 });
        //             });
        //             ok.addEventListener('click', () => render(true, textarea.value));
        //             close.addEventListener('click', () => render());
        //             await render();
        //         },
        //     ].map((fn) => fn())
        // )
    }, [id])
    return (
        <div id="community-helper-user-panel">
            <div className="v-close-mask" onClick={onClose}></div>
            <div
                className="v-container"
                ref={ref}
                onResize={() => resize(ref.current)}
            >
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
