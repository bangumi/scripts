import { updateDatabase } from '@/modules/database'
import { commentList, replyWrapper } from '@/inject'
import './styles/common.css'
await updateDatabase()
await Promise.all([commentList(), replyWrapper()])
