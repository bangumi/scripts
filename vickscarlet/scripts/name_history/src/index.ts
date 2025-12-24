import { fetchUserNameHistory } from '@b38dev/api/name_history'
import style from './index.css?inline'

async function fetchByUid(uid: string) {
    try {
        const ret = await fetchUserNameHistory(uid)
        const updated = new Date(ret.update).toLocaleString()
        const names = Array.from(ret.names).map((name) => `<li>${name}</li>`)
        return `<span>${updated}</span><ul>${names.join('')}</ul>`
    } catch (e) {
        console.error(e)
        return `<div class="item">获取曾用名失败，请稍后重试</div>`
    }
}

;(async () => {
    const nameElement = document.querySelector<HTMLAnchorElement>(
        '#headerProfile .subjectNav .headerContainer .inner .name a'
    )
    if (!nameElement) return
    const username = nameElement.href.split('/').pop()
    if (!username) return
    document.head.insertAdjacentHTML('beforeend', `<style>${style}</style>`)
    const tool = document.createElement('div')
    tool.classList.add('v-name-history-tool')
    const btn = document.createElement('button')
    const container = document.createElement('div')
    btn.textContent = '▾'
    tool.append(btn)
    tool.append(container)
    let show = false
    let loaded = false
    btn.onclick = async () => {
        if ((show = !show)) {
            tool.classList.add('v-show-history-name')
        } else {
            tool.classList.remove('v-show-history-name')
            return
        }
        if (loaded) return
        tool.classList.add('v-loading-history-name')
        container.innerHTML = await fetchByUid(username)
        tool.classList.remove('v-loading-history-name')
        loaded = true
    }
    nameElement.after(tool)
})()
