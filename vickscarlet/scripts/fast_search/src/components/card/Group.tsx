import { ItemDetialProp } from '.'
import './Group.css'

export function GroupCard({ item }: ItemDetialProp<'group'>) {
    const id = item.slug
    const url = `/group/${id}`
    return (
        <li className="v-search-item-card" data-catalog="group" data-id={id} key={id}>
            <div className="background">
                <img
                    className="avatar"
                    src={item.icon_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                    alt={item.title}
                />
            </div>
            <a className="avatar" href={url}>
                <img
                    className="avatar"
                    src={item.icon_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                    alt={item.title}
                />
            </a>
            <div className="info">
                <a className="title" href={url}>
                    {item.title}
                </a>
                <div className="extra">@{id}</div>
                {item.nsfw && <div className="nsfw-badge">NSFW</div>}
                {item.description && <div className="description">{item.description}</div>}
            </div>
        </li>
    )
}

export default GroupCard
