// ==UserScript==
// @name         首页查看书籍上次标记进度时间并高亮可能更新
// @namespace    bangumi.book.last.read
// @version      0.0.1
// @description  首页查看书籍上次标记进度时间并高亮可能更新
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/
// @match        http*://chii.in/
// @match        http*://bangumi.tv/
// @grant        none
// @license      MIT
// @gf
// @gadget       https://bgm.tv/dev/app/5412
// ==/UserScript==

(async function () {
    'use strict';

    const myUserName = document.querySelector('#dock a').href.split('/').pop();
    const res = await fetch(`https://api.bgm.tv/v0/users/${myUserName}/collections?subject_type=1&type=3&limit=50`);
    if (!res.ok) {
        console.error('获取书籍标记时间失败');
        return;
    }
    const data = (await res.json()).data;
    const ids = data.map(o => o.subject_id);
    const times = data.map(o => o.updated_at);

    const fmtTime = isoTimeStr => {
        const d = new Date(isoTimeStr);
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };
    const outdated = (isoTimeStr, days = 30) => {
        const intervalMs = days * 24 * 60 * 60 * 1000;
        const targetTime = new Date(isoTimeStr).getTime();
        const currentTime = Date.now();
        const sa = currentTime - targetTime;
        return sa > intervalMs ? Math.min(Math.floor(sa / intervalMs), 3) : null;
    };

    const intervals = chiiApp.cloud_settings.getAll();
    const deadIntervals = Object.keys(intervals).filter(i => !ids.includes(+i));
    console.debug(intervals, deadIntervals)
    if (deadIntervals.length) {
        for (const i of deadIntervals) {
            chiiApp.cloud_settings.delete(i);
        }
        chiiApp.cloud_settings.save();
    }

    const applyTimes = (selector, pos) => {
        const targets = document.querySelectorAll(selector);
        targets.forEach((t, i) => {
            const label = document.createElement('span');
            label.textContent = `上次阅读：${fmtTime(times[i])}`;
            label.style = 'font-size:11px;cursor:pointer';
            t.insertAdjacentElement(pos, label);

            const box = t.closest('.tinyMode');
            const id = ids[i];
            const upd = outdated(times[i], intervals[id]);
            if (upd) {
                box.style.backgroundColor = `rgba(50, 200, 50, .${1 + upd})`;
            }

            label.addEventListener('click', () => {
                const interval = prompt('设置更新间隔（单位：天，默认30天）', intervals[id] || 30);
                if (!interval) return;
                chiiApp.cloud_settings.update({ [id]: interval });
                chiiApp.cloud_settings.save();
                const upd = outdated(times[i], interval);
                if (upd) {
                    box.style.backgroundColor = `rgba(50, 200, 50, .${1 + upd})`;
                } else {
                    box.style.backgroundColor = '';
                }
            });
        });
    };
    applyTimes('.tinyManager', 'afterbegin');
    applyTimes('[subject_type="1"] .tip_j', 'afterend');
})();
