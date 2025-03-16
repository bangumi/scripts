declare global {
    var CHOBITS_UID: number
    interface Window {
        CHOBITS_UID: number
    }
}

export const whoami = (() => {
    let cache: { id: string; nid: number } | null = null
    return () => {
        if (cache) return cache
        // 超展开在 iframe 中， 可以用 window.parent 获得父级窗口
        let nid
        try {
            nid =
                window.CHOBITS_UID ??
                window.parent.CHOBITS_UID ??
                CHOBITS_UID ??
                0
        } catch (e) {
            nid = 0
        }
        const dockA =
            window.parent.document.querySelector<HTMLAnchorElement>(
                '#dock li.first a'
            )
        if (dockA) {
            const id = dockA.href.split('/').pop()!
            return (cache = { id, nid })
        }
        const bannerAvatar =
            window.parent.document.querySelector<HTMLAnchorElement>(
                '.idBadgerNeue> .avatar'
            )
        if (bannerAvatar) {
            const id = bannerAvatar.href.split('/').pop()!
            return (cache = { id, nid })
        }
        return null
    }
})()
export function isMe(id?: string | null) {
    if (!id) return false
    return id == whoami()?.id
}
