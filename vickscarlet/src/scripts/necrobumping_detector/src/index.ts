import { addStyle } from '@common/dom'
import css from './index.css?inline'
;(() => {
    const column = document.querySelector('#columnInSubjectA')
    if (!column) return
    const nodes = column.querySelectorAll('.clearit')
    if (!nodes) return
    addStyle(css)
    const posts: [number, string, string, string][] = []
    nodes.forEach((node) => {
        const id = node.id
        if (!id || !id.startsWith('post_')) return
        const small = node.querySelector<HTMLElement>(
            'small:has(>a.floor-anchor)'
        )
        if (!small) return
        const [f, t] = small.textContent!.split(' - ')
        posts.push([new Date(t).getTime(), t, id, f])
    })
    posts.sort(([a], [b]) => a - b)
    const day = 24 * 60 * 60 * 1000
    const convert = (t: number) => {
        t = t / day / 30
        if (t > 12) return `间隔${Math.floor(t / 12)}年`
        else return `间隔${Math.floor(t)}月`
    }
    const timing = 30 * day
    let l = posts.shift()![0]
    const list: [string, string, string, number][] = []
    for (const [a, t, p, f] of posts) {
        const d = a - l
        if (d > timing) list.push([p, f, t, d])
        l = a
    }
    if (list.length < 1) return
    const clB = document.querySelector<HTMLDivElement>('#columnInSubjectB')
    clB?.classList.add('flexColumn')
    clB?.classList.add('menuSticky')
    const box = document.createElement('div')
    box.classList.add('flexColumn')
    box.classList.add('borderNeue')
    clB?.append(box)

    const tip = document.createElement('div')
    tip.innerHTML = `⚠️ 本贴被挖坟${list.length}次(一个月以上算挖坟)`
    tip.classList.add('necrobumpingTip')
    box.append(tip)

    const ul = document.createElement('ul')
    ul.classList.add('flexColumn')
    ul.classList.add('necrobumpingList')
    box.append(ul)
    for (const [p, f, t, d] of list.reverse()) {
        const post = document.querySelector('#' + p)
        const li = document.createElement('li')
        li.innerHTML = `<a href="#${p}">${f} - ${t} <span>${convert(
            d
        )}</span></a>`
        li.onclick = () => {
            document
                .querySelector('.reply_highlight')
                ?.classList.remove('reply_highlight')
            post?.classList.add('reply_highlight')
        }
        ul.append(li)
    }
})()
