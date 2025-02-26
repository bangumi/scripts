/**merge:js=_common.bangumi.js**//**merge**/
function whoami() {
    // 超展开在 iframe 中， 可以用 window.parent 获得父级窗口
    const nid = window.parent.CHOBITS_UID ?? 0;
    const dockA = window.parent.document.querySelector('#dock li.first a');
    if (dockA) {
        const id = dockA.href.split('/').pop();
        return { id, nid };
    }
    const bannerAvatar = window.parent.document.querySelector('.idBadgerNeue> .avatar');
    if (bannerAvatar) {
        const id = bannerAvatar.href.split('/').pop();
        return { id, nid };
    }
    return null;
}