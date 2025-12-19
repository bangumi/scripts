import { ItemDetialProp } from '.'
import './User.css'

export function UserCard({ item }: ItemDetialProp<'user'>) {
    const id = item.username ?? item.uid
    const url = `/user/${id}`
    return (
        <li className="v-search-item-card" data-catalog="user" data-id={id} key={id}>
            <div className="background">
                <img
                    className="avatar"
                    src={item.avatar_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                    alt={item.username}
                />
            </div>
            <a className="avatar" href={url}>
                <img
                    className="avatar"
                    src={item.avatar_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                    alt={item.username}
                />
            </a>
            <div className="info">
                <a className="title" href={url}>
                    {item.nickname}
                </a>
                <div className="extra">@{id}</div>
            </div>
        </li>
    )
}

export default UserCard
