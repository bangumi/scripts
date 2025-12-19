import type { Command, CommandMap } from '@/api'
import * as card from './card'
import './SearchItemList.css'

export interface SearchItemProps<K extends Command = Command> {
    item: CommandMap[K]['item']
}

function SearchItem<K extends Command>({ item }: SearchItemProps<K>) {
    switch (item.catalog) {
        case 'user':
            return <card.User item={item} />
        case 'group':
            return <card.Group item={item} />
        case 'topic':
            return <card.Topic item={item} />
        case 'reply':
            return <card.Reply item={item} />
        case 'anime':
        case 'book':
        case 'music':
        case 'game':
        case 'real':
            return <card.Subject item={item} />
        case 'character':
        case 'person':
            return <card.Mono item={item} />
        default:
            return null
    }
}

export interface SearchItemListProps<K extends Command = Command> {
    command: K
    items: CommandMap[K]['item'][]
}

export function SearchItemList({ command, items }: SearchItemListProps) {
    if (!items || items.length === 0) {
        return <h1 className="v-search-no-items">🙁没有搜索结果</h1>
    }
    return (
        <ul className="v-search-item-list" data-command={command}>
            {items.map((item, i) => (
                <SearchItem item={item} key={item.catalog + i} />
            ))}
        </ul>
    )
}

export default SearchItemList
