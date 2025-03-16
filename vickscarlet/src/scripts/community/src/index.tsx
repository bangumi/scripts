import { updateDatabase } from '@/modules/database'
import { dock, commentList, replyWrapper } from '@/inject'
await updateDatabase()
await Promise.all([dock(), commentList(), replyWrapper()])
