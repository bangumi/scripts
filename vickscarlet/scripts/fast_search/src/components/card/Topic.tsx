import { ItemDetialProp } from '.'
import { Time } from '@/components/Time'
import './Topic.css'

export function TopicCard({
    item: { id, title, creator, created_at, group, reply_count },
}: ItemDetialProp<'topic'>) {
    const url = `/group/topic/${id}`
    return (
        <li className="v-search-item-card" data-catalog="topic" data-id={id} key={id}>
            <div className="background">
                <img
                    src={creator.avatar_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                    alt={creator.nickname}
                />
            </div>
            <a className="avatar" href={url}>
                {group.icon_url && <img src={group.icon_url} alt={group.title} />}
            </a>
            <div className="info">
                <div className="title">
                    <a href={url}>{title}</a>
                    <small> +{reply_count}</small>
                </div>
                <div className="extra">
                    <a className="creator" href={`/user/${creator.uid}`}>
                        <img
                            src={creator.avatar_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                            alt={creator.nickname}
                        />
                        <span>{creator.nickname}</span>
                    </a>
                    <a className="group" href={`/group/${group.slug}`}>
                        <span>{group.title}</span>
                    </a>
                    <Time time={created_at} />
                </div>
            </div>
        </li>
    )
}

export default TopicCard
