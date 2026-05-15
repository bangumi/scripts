import { ItemDetialProp } from '.'
import './Mono.css'

export function MonoCard({
    item: { id, catalog, name, chineseName, avatar, extra, comment },
}: ItemDetialProp<'mono'>) {
    const url = `/${catalog}/${id}`
    return (
        <li
            className="v-search-item-card"
            data-item="mono"
            data-catalog={catalog}
            data-id={id}
            key={id}
        >
            <div className="background">
                <img
                    className="avatar"
                    src={avatar || 'https://lain.bgm.tv/pic/user/l/icon.jpg'}
                    alt={name}
                />
            </div>
            <a className="avatar" href={url}>
                <img src={avatar || 'https://lain.bgm.tv/pic/user/l/icon.jpg'} alt={name} />
            </a>
            <div className="info">
                <div className="title">
                    <a href={url}>{name}</a>
                    <small>{chineseName}</small>
                </div>
                <div className="extra">
                    <ul className="tips">
                        {extra.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                    {!!comment && <div className="comment wide">{comment}</div>}
                </div>
            </div>
        </li>
    )
}

export default MonoCard
