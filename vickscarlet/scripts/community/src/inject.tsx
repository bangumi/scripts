import { waitElement, observeChildren } from '@b38dev/dom'
import { commentEnhance, stickyIt } from '@/components'

export async function commentList() {
    const commentList = await waitElement(document, '#comment_list')
    if (!commentList) return
    const comment = commentList.parentElement!.querySelector('.postTopic')
    if (comment) commentEnhance({ comment })
    const owner = comment?.getAttribute('data-item-user')
    observeChildren(commentList, async (comment) => {
        commentEnhance({ comment, owner })
        const floor = comment.getAttribute('data-item-user')
        const subReply = await waitElement(comment, '#topic_reply_' + comment.id.substring(5))
        if (!subReply) return
        observeChildren(subReply, (comment) => commentEnhance({ comment, owner, floor }))
    })
}

export async function replyWrapper() {
    stickyIt(await waitElement(document, '#reply_wrapper'))
}
