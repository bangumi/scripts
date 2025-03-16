// ==UserScript==
// @name         Bangumi 挖坟人探测器
// @version      1.0.6
// @namespace    b38.dev
// @description  Bangumi 挖坟人探测器, 看看是谁在挖坟，在日志和小组里生效
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/bangumi_necrobumping_detector.user.js
// @match        *://bgm.tv/*
// @match        *://chii.in/*
// @match        *://bangumi.tv/*
// ==/UserScript==
(() => {
    const column = document.querySelector('#columnInSubjectA');
    if (!column) return;
    const nodes = column.querySelectorAll('.clearit');
    if (!nodes) return;
    /**merge:js=common/dom.style.js**/
    function addStyle(...styles) { const style = document.createElement('style'); style.append(document.createTextNode(styles.join('\n'))); document.head.appendChild(style); return style; }
    /**merge**/
    addStyle(/**merge:css=bangumi_necrobumping_detector.user.css**/`.flexColumn {display: flex;flex-direction: column;}.menuSticky {position: sticky;top: 0;align-self: flex-start;}.necrobumpingTip {background: #6fe5cc;padding: 8px;color: #444;border-radius: 4px 4px 0 0;}.necrobumpingList {position: relative;gap: 5px;padding: 8px;border-radius: 4px;li {display: inline-block;color: #444;span {color:#6fe5cc}}}@media(max-width:640px) {.menuSticky {align-self: auto;}}`/**merge**/)
    const posts = [];
    nodes.forEach(node => {
        const id = node.id;
        if (!id || !id.startsWith('post_')) return;
        const small = node.querySelector('small:has(>a.floor-anchor)');
        if (!small) return;
        const [f, t] = small.textContent.split(' - ')
        posts.push([new Date(t).getTime(), t, id, f]);
    })
    posts.sort(([a], [b]) => a - b)
    const day = 24 * 60 * 60 * 1000;
    const convert = t => {
        t = t / day / 30;
        if (t > 12) return `间隔${Math.floor(t / 12)}年`
        else return `间隔${Math.floor(t)}月`
    }
    const timing = 30 * day;
    let l = posts.shift()[0];
    const list = []
    for (const [a, t, p, f] of posts) {
        const d = a - l;
        if (d > timing) list.push([p, f, t, d])
        l = a
    }
    if (list.length < 1) return;
    const clB = document.querySelector('#columnInSubjectB');
    clB.classList.add('flexColumn');
    clB.classList.add('menuSticky');
    const box = document.createElement('div');
    box.classList.add('flexColumn');
    box.classList.add('borderNeue');
    clB.append(box);

    const tip = document.createElement('div');
    tip.innerHTML = `⚠️ 本贴被挖坟${list.length}次(一个月以上算挖坟)`;
    tip.classList.add('necrobumpingTip');
    box.append(tip);

    const ul = document.createElement('ul');
    ul.classList.add('flexColumn');
    ul.classList.add('necrobumpingList');
    box.append(ul);
    for (const [p, f, t, d] of list.reverse()) {
        const post = document.querySelector('#' + p);
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${p}">${f} - ${t} <span>${convert(d)}</span></a>`;
        li.onclick = () => {
            document.querySelector('.reply_highlight')?.classList.remove('reply_highlight')
            post.classList.add('reply_highlight')
        };
        ul.append(li);
    }
})();