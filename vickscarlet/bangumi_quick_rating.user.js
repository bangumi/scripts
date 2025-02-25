// ==UserScript==
// @name         Bangumi 收藏快速评分
// @namespace    b38.dev
// @version      1.0.1
// @description  Bangumi 收藏快速评分, 仅自己收藏页面生效
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm.tv|bangumi.tv|chii.in)/(anime|book|game|music|real)/list/[0-9a-zA-Z_-]*/(collect|do|dropped|on_hold|wish)
// @icon         https://bgm.tv/img/favicon.ico
// ==/UserScript==
(() => {
    const user = location.pathname.split('/').at(-2);
    const me = document.querySelector('#headerNeue2 a.avatar')?.href?.split('/').at(-1);
    if (user != me) return;

    const style = document.createElement('style');
    style.append(document.createTextNode(`
        ul.quick-rating {
            display: inline-flex;
            li {
                position: relative;
                cursor: pointer;
                height: 10px;
                width: 10px;
                background-position: 0 0;
                span {
                    visibility: hidden;
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translate(-50%, calc(-100% - 10px));
                    padding: 2px 5px;
                    border-radius: 5px;
                    background: rgba(0, 0, 0, 0.6);
                    white-space: nowrap;
                    color: #fff;
                }
                span::after {
                    content: '';
                    position: absolute !important;
                    bottom: 0;
                    left: 50%;
                    border-top: 5px solid rgba(0, 0, 0, 0.6);
                    border-right: 5px solid transparent;
                    border-left: 5px solid transparent;
                    backdrop-filter: blur(5px);
                    transform: translate(-50%, 100%);
                }
            }

            .star {
                background: url(/img/ico/star_2x.png) no-repeat 0 0;
                background-size: 10px 30px;
            }

            .cancel {
                background: url(/img/ico/delete.gif) no-repeat 0 0;
                background-size: 10px 20px;
            }

            li:hover span { visibility: visible; }
            li:hover, .star:has(~ li:hover) { background-position: 0 -10px !important; }
            li:hover ~ li { background-position: 0 0 !important; }
        }
        ul.quick-rating.default-star-1 > li.star:nth-child(-n+2),
        ul.quick-rating.default-star-2 > li.star:nth-child(-n+3),
        ul.quick-rating.default-star-3 > li.star:nth-child(-n+4),
        ul.quick-rating.default-star-4 > li.star:nth-child(-n+5),
        ul.quick-rating.default-star-5 > li.star:nth-child(-n+6),
        ul.quick-rating.default-star-6 > li.star:nth-child(-n+7),
        ul.quick-rating.default-star-7 > li.star:nth-child(-n+8),
        ul.quick-rating.default-star-8 > li.star:nth-child(-n+9),
        ul.quick-rating.default-star-9 > li.star:nth-child(-n+10),
        ul.quick-rating.default-star-10 > li.star:nth-child(-n+11)
        {
            background-position: 0 -20px;
        }
    `));
    document.head.append(style);

    const quickStarRating = (id, star, gh) => {
        let lastStartClass = 'default-star-' + star;
        const starRatingElement = document.createElement('ul');
        starRatingElement.innerHTML = (`
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
        `);
        starRatingElement.classList.add('quick-rating');
        starRatingElement.classList.add(lastStartClass);
        starRatingElement.addEventListener('click', async event => {
            const target = event.target;
            if (target.nodeName != 'LI') return;
            const rate = parseInt(target.getAttribute('data-value')) || 0;
            const body = rate ? new URLSearchParams({ rate }) : null;
            const response = await fetch(`/subject/${id}/rate.chii?gh=${gh}`, { method: "POST", body });
            if (response.status == 200) {
                starRatingElement.classList.remove(lastStartClass);
                lastStartClass = 'default-star-' + rating;
                starRatingElement.classList.add(lastStartClass);
            }
        })
        return starRatingElement;
    }
    const makeQuickStarRating = (item) => {
        if (!item || item.nodeName != 'LI') return;
        const modify = item.querySelector('.collectModify > a:last-child');
        if (!modify) return;
        const gh = modify.getAttribute('onclick').match(/\(\d+\s*,\s*'(.*)'\s*\)/)?.[1];
        if (!gh) return;
        let info = item.querySelector('.collectInfo');
        if (!info) return;
        const starstop = info.querySelector('.starstop-s');
        if (starstop) starstop.style.display = 'none';
        const id = item.id.substr(5)
        const star = parseInt(starstop?.children[0].className.substr(15)) || 0
        const starRatingElement = quickStarRating(id, star, gh)
        info.prepend(starRatingElement);
    }
    const list = document.querySelector('#browserItemList');
    list.addEventListener('DOMNodeInserted', event => makeQuickStarRating(event.target));
    for (const element of list.children) makeQuickStarRating(element);

})();
