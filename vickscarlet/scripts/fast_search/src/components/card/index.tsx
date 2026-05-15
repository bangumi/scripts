import type { CommandMap } from '@/api'
import './index.css'

export interface ItemDetialProp<T extends keyof CommandMap = keyof CommandMap> {
    item: CommandMap[T]['item']
}

export { UserCard, default as User } from './User'
export { GroupCard, default as Group } from './Group'
export { TopicCard, default as Topic } from './Topic'
export { ReplyCard, default as Reply } from './Reply'
export { SubjectCard, default as Subject } from './Subject'
export { MonoCard, default as Mono } from './Mono'
