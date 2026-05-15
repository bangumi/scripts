import { ItemDetialProp } from '.'
import { Time } from '@/components/Time'
import BBCode from '@bbob/react'
import { plugins, options } from '@/util/bbcode'
import './Reply.css'

export function ReplyCard({
    item: { id, content, creator, topic, created_at },
}: ItemDetialProp<'reply'>) {
    const url = `/group/topic/${topic.id}#post_${id}`
    const uid = creator.uid || creator.username
    const avatar = creator.avatar_url || 'https://lain.bgm.tv/pic/user/l/icon.jpg'
    return (
        <li className="v-search-item-card" data-catalog="reply" data-id={id} key={id}>
            <div className="background">
                <img src={avatar} alt={creator.nickname} />
            </div>
            <a className="avatar" href={url}>
                <img src={avatar} alt={creator.nickname} />
            </a>
            <div className="info">
                <div className="title">
                    <a className="topic" href={url}>
                        <span>{topic.title}</span>
                    </a>
                    <a className="group" href={`/group/${topic.group_slug}`}>
                        <small>@{topic.group_slug}</small>
                    </a>
                </div>
                <div className="content">
                    <BBCode plugins={plugins} options={options}>
                        {content}
                    </BBCode>
                </div>
                <div className="extra">
                    <a className="creator" href={`/user/${uid}`}>
                        <span>{creator.nickname}</span>
                    </a>
                    <span>·</span>
                    <Time time={created_at} />
                </div>
            </div>
        </li>
    )
}

export default ReplyCard
