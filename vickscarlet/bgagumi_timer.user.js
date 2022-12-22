// ==UserScript==
// @name         Bangumi 看过番剧时长统计
// @description  Bangumi 统计看过番剧时长
// @namespace    syaro.io
// @version      1.5
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/(user)\/.*/
// ==/UserScript==
const ftime = (time, day=false)=>{
    const s = time % 60;
    const m = (time - s) / 60 % 60;
    if(!day) {
        const h = (time - s - m * 60) / 3600;
        return `${h}:${m}:${s}`;
    }
    const h = (time - s - m * 60) / 3600 % 24;
    const d = (time - s - m * 60 - h * 3600) / 86400;
    return `${d}天${h}:${m}:${s}`;
};

const calc = async (uid, emit)=>{
    const origin = window.location.origin;

    // indexedDB cache
    class DB {
        constructor() {}
        #dbName = 'mcache';
        #version = 1;
        #collection = 'pages';
        #keyPath = 'url';
        #db;

        async init() {
            this.#db = await new Promise((resolve, reject) => {
                const request = window.indexedDB.open(this.#dbName, this.#version);
                request.onerror = event=>reject(event.target.error);
                request.onsuccess = event=>resolve(event.target.result);
                request.onupgradeneeded = event=> {
                    if(event.target.result.objectStoreNames.contains(this.#collection)) return;
                    event.target.result.createObjectStore(this.#collection, {keyPath: this.#keyPath});
                };
            });
        }

        async #store(handle, mode='readonly') {
            return new Promise((resolve, reject) => {
                const transaction = this.#db.transaction(this.#collection, mode);
                const store = transaction.objectStore(this.#collection);
                let result;
                new Promise((rs, rj) => handle(store, rs, rj))
                    .then(ret=>result=ret)
                    .catch(reject);
                transaction.onerror = () => reject(new Error('Transaction error'));
                transaction.oncomplete = () => resolve(result);
            });
        }

        async get(key, index) {
            return this.#store((store, resolve, reject)=>{
                if(index) store = store.index(index);
                const request = store.get(key);
                request.onerror = reject;
                request.onsuccess = ()=>resolve(request.result);
            })
            .catch(null);
        }

        async put(data) {
            return this.#store((store, resolve, reject)=>{
                const request = store.put(data);
                request.onerror = reject;
                request.onsuccess = ()=>resolve(true);
            }, 'readwrite')
            .catch(false);
        }
    }

    const db = new DB();
    await db.init();
    const f = (url, expire=0)=>db.get(url).then(async ({html, time=0}={})=>{
        expire = expire * 60000;
        if(html && html.match(/503 Service Temporarily Unavailable/)) html = null;
        if(!html || time + expire < Date.now()) {
            html = await fetch(url).then(res => res.text());
            await db.put({url, html, time: Date.now()});
        }
        const e = document.createElement('html');
        e.innerHTML = html.replace(/<img .*?>/g, '');
        return e;
    });

    let c = 0;
    // watched collections
    const collects = async (p=1) => {
        const e = await f(`${origin}/anime/list/${uid}/collect?page=${p}`, 30)
        console.info(`collects page ${p} loaded`);
        const list = Array
            .from(e.querySelectorAll('#browserItemList > li > a'))
            .map(a=>a.href.split('/').pop());
        const next = Array
            .from(e.querySelectorAll('#multipage a.p'))
            .pop().href.match(/page=(\d+)$/)[1];
        c+=list.length;
        emit({sloved: 0, total: c});
        if(p >= next) return list;
        return collects(p+1).then(next=>list.concat(next));
    };

    // calc time
    const ct = s => {
        let m = s.match(/[时片]长:\s*(\d{2}):(\d{2}):(\d{2})/);
        if(m) return parseInt(m[1])*3600 + parseInt(m[2])*60 + parseInt(m[3]);
        m = s.match(/[时片]长:\s*(\d{2}):(\d{2})/);
        if(m) return parseInt(m[1])*60 + parseInt(m[2]);
        m = s.match(/[时片]长:\s*(\d+)\s*[m分]/);
        if(m) return parseInt(m[1])*60;
        return 0;
    };

    // calc all time
    const times = async s => {
        const e = await f(`${origin}/subject/${s}/ep`, 60 * 24 * 5)
        const c = l=>Array.from(l).reduce((a,e)=>a+ct(e.innerText), 0)
        let t = c(e.querySelectorAll('ul.line_list > li > small.grey'));
        if(t) return {t};
        const se = await f(`${origin}/subject/${s}`, 60 * 24 * 5);
        t = c(se.querySelectorAll('ul#infobox > li'));
        if(t) return {t};
        const type = se.querySelector('h1.nameSingle > small')?.textContent;
        const eps = e.querySelectorAll('ul.line_list > li > h6').length;
        let g = eps;
        switch(type) {
            case 'WEB':
            case 'TV':
                g *= 23 * 60 + 40; break;
            case 'OVA':
            case 'OAD':
                g *= 45 * 60; break;
            case '剧场版':
                g *= 90 * 60; break;
            default:
                g = 0;
        }
        return {g};
    };

    console.groupCollapsed('collections');
    return collects()
    .then(l=>Array.from(new Set(l)))
    .then(async l => {
        c = l.length;
        emit({sloved: 0, total: c});
        let total = 0;
        let totalc = 0;
        let guess = 0;
        let guessc = 0;
        let unknow = 0;
        let sloved = 0;
        const results = [];
        console.groupEnd('collections');
        console.groupCollapsed('subjects');
        for (const s of l) {
            const {t, g} = await times(s);
            sloved ++;
            emit({sloved, total: c});
            const r = {subject: s, url: `${origin}/subject/${s}`};
            results.push(r);
            if(t) {
                r.type = '正常';
                r.time = ftime(t);
                total += t;
                totalc ++;
                console.info(`subject ${s} time ${r.time}`);
            } else if(g) {
                r.type = '推测';
                r.time = ftime(g);
                guess += g;
                guessc ++;
                console.info(`guess subject ${s} time ${r.time}`);
            } else {
                r.type = '未知';
                r.time = '0';
                unknow ++;
                console.warn(`No time for ${s} ${origin}/subject/${s}`);
            }
        }
        console.groupEnd('subjects');

        console.groupCollapsed('result table');
        console.table(results);
        console.groupEnd('result table');
        return {total, totalc, guess, guessc, unknow, results};
    });
}

const btn = document.createElement('a');
const result = document.createElement('span');
btn.className = 'chiiBtn';
btn.href = 'javascript:void(0)';
btn.title = '推测规则:\n  TV: 23:40\n  OVA/OAD: 45:00\n  剧场版: 90:00';
const content = document.createElement('span');
btn.appendChild(content);
content.innerText = '统计看过时长';
btn.onclick = async ()=>{
    console.debug('click');
    btn.onclick = null;
    content.innerText = '统计中[0/0]';
    const uid = window.location.href.match(/\/user\/(.+)?(\/.*)?/)[1];
    const {total, totalc, guess, guessc, unknow} = await calc(uid, ({total, sloved})=>content.innerText = `统计中[${sloved}/${total}]`);
    content.innerText = `${totalc}部:${ftime(total, 1)} [推测${guessc}部:${ftime(guess, 1)}] (${unknow}部未知)`;
}

document.querySelector('#headerProfile h1.nameSingle > .rr').append(btn);