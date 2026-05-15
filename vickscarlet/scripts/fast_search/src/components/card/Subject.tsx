import { ItemDetialProp } from '.'
import './Subject.css'

function formatCnt(cnt: string) {
    cnt = cnt.replace('(', '')
    cnt = cnt.replace('少于', '<')
    cnt = cnt.replace('人评分)', '')
    return cnt
}

export function SubjectCard({
    item: { id, title, catalog, titleSub, cover, rank, mark, extra, rate, ratePeople },
}: ItemDetialProp<'subject'>) {
    return (
        <li
            className="v-search-item-card"
            data-catalog={catalog}
            data-item="subject"
            data-id={id}
            key={id}
        >
            <div className="background">{cover && <img src={cover} alt="" />}</div>
            <a className="avatar" href={`/subject/${id}`}>
                {cover && <img className="avatar" src={cover} alt={title} />}
            </a>
            <div className="info">
                <div className="title">
                    <a href={`/subject/${id}`}>{title}</a>
                    <small>{titleSub}</small>
                </div>
                <div className="extra">
                    <ul className="tips">
                        {extra.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                    <div className="mark">{mark}</div>
                </div>
            </div>
            <div className="judge">
                {rank && <div className="rank">{rank}</div>}
                {rate && <div className="rate">{rate}</div>}
                {ratePeople && <div className="cnt">{formatCnt(ratePeople)}</div>}
            </div>
        </li>
    )
}

export default SubjectCard
