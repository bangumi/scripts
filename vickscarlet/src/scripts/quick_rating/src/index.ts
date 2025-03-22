import { isMe } from '@common/bangumi'
import { addStyle, observeChildren } from '@common/dom'
import css from './index.css?inline'
;(() => {
    if (!isMe(location.pathname.split('/').at(-2))) return
    addStyle(css)
    const quickStarRating = (id: string, star: string, gh: string) => {
        let lastStartClass = 'default-star-' + star
        const starRatingElement = document.createElement('ul')
        starRatingElement.innerHTML = `
            <li class="cancel" data-value="0"><span>取消评分</span></li>
            <li class="star" data-value="1"><span>1 不忍直视</span></li>
            <li class="star" data-value="2"><span>2 很差</span></li>
            <li class="star" data-value="3"><span>3 差</span></li>
            <li class="star" data-value="4"><span>4 较差</span></li>
            <li class="star" data-value="5"><span>5 不过不失</span></li>
            <li class="star" data-value="6"><span>6 还行</span></li>
            <li class="star" data-value="7"><span>7 推荐</span></li>
            <li class="star" data-value="8"><span>8 力荐</span></li>
            <li class="star" data-value="9"><span>9 神作</span></li>
            <li class="star" data-value="10"><span>10 超神作(请谨慎评价)</span></li>
        `
        starRatingElement.classList.add('quick-rating')
        starRatingElement.classList.add(lastStartClass)
        starRatingElement.addEventListener('click', async (event) => {
            const target = event.target as HTMLLIElement
            if (target.nodeName != 'LI') return
            const rate =
                (parseInt(target.getAttribute('data-value')!) || 0) + ''
            const body = rate != '0' ? new URLSearchParams({ rate }) : null
            const response = await fetch(`/subject/${id}/rate.chii?gh=${gh}`, {
                method: 'POST',
                body,
            })
            if (response.status == 200) {
                starRatingElement.classList.remove(lastStartClass)
                lastStartClass = 'default-star-' + rate
                starRatingElement.classList.add(lastStartClass)
            }
        })
        return starRatingElement
    }
    observeChildren(
        document.querySelector<HTMLUListElement>('#browserItemList')!,
        (item: Element) => {
            if (!item || item.nodeName != 'LI') return
            const modify = item.querySelector<HTMLAnchorElement>(
                '.collectModify > a:last-child'
            )
            if (!modify) return
            const gh = modify
                .getAttribute('onclick')!
                .match(/\(\d+\s*,\s*'(.*)'\s*\)/)?.[1]
            if (!gh) return
            let info = item.querySelector('.collectInfo')
            if (!info) return
            const starstop =
                info.querySelector<HTMLAnchorElement>('.starstop-s')
            if (starstop) starstop.style.display = 'none'
            const id = item.id.substring(5)
            const star =
                (parseInt(starstop?.children[0].className.substring(15)!) ||
                    0) + ''
            const starRatingElement = quickStarRating(id, star, gh)
            info.prepend(starRatingElement)
        }
    )
})()
