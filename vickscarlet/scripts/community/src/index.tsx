import { updateDatabase } from '@/modules/database'
// import { dock, commentList, replyWrapper } from '@/inject'
import { commentList, replyWrapper } from '@/inject'
import './styles/common.css'
await updateDatabase()
// await Promise.all([dock(), commentList(), replyWrapper()])
await Promise.all([commentList(), replyWrapper()])
