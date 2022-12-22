// ==UserScript==
// @name         Bangumi 年鉴
// @description  根据Bangumi的时光机数据生成年鉴
// @namespace    syaro.io
// @version      1.1.7
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/(user)\/.*/
// ==/UserScript==
(async ()=>{
const origin = window.location.origin;
const uid = window.location.href.match(/\/user\/(.+)?(\/.*)?/)[1];
const year = new Date().getFullYear();
const ce = name=>document.createElement(name);
const types = {
    'anime': '动画',
    'game': '游戏',
    'music': '音乐',
    'book': '图书',
    'real': '三次元',
};

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
    const e = ce('html');
    e.innerHTML = html.replace(/<img (.*)\/?>/g, '<span class="img" $1></span>');
    return e;
});

const collects = async (type, p=1) => {
    const e = await f(`${origin}/${type}/list/${uid}/collect?page=${p}`, 30);
    console.info(`collects page ${p} loaded`);
    const list = Array
        .from(e.querySelectorAll('#browserItemList > li'))
        .map(li=>{
            const data = {};
            data.id = li.querySelector('a').href.split('/').pop();
            const title = li.querySelector('h3');
            data.title = title.querySelector('a').innerText;
            data.jp_title = title.querySelector('small')?.innerText;
            data.img = li.querySelector('span.img')
                ?.getAttribute('src').replace('cover/c', 'cover/l')
                || '//bgm.tv/img/no_icon_subject.png';
            data.time = new Date(li.querySelector('span.tip_j').innerText);
            data.year = data.time.getFullYear();
            data.month = data.time.getMonth();
            data.star = parseInt(li.querySelector('span.starlight')?.className.match(/stars(\d{1,2})/)[1])||0;
            data.tags = li.querySelector('span.tip')?.textContent.trim().match(/标签:\s*(.*)/)[1].split(/\s+/)||[];
            return data;
        });
    const next = Array
        .from(e.querySelectorAll('#multipage a.p'))
        .pop()?.href.match(/page=(\d+)/)[1];
    if(!next || p >= next) return list;
    return collects(type, p+1).then(next=>list.concat(next));
};

const menu = ce('ul');
document.body.appendChild(menu);
const ma = name=>menu.appendChild(ce('li')).appendChild(ce(name));
menu.id = 'kotori-report-menu';
const msw = {
    _: true,
    get(){return this._},
    set(v){this._ = v; menu.style.display = v ? 'block' : 'none';},
    toggle(){this.set(!this.get());},
};
msw.toggle();
const btn = ce('a');
btn.onclick = ()=>msw.set(true);
btn.className = 'chiiBtn';
btn.href = 'javascript:void(0)';
btn.title = '生成年鉴';
btn.innerHTML = '<span>生成年鉴</span';

const yearSelect = ma('select');
yearSelect.innerHTML = new Array(year-2007).fill(0)
    .map((_,i)=>`<option value="${year-i}">${year-i}</option>`).join('');
const typeSelect = ma('select');
typeSelect.innerHTML = Object.entries(types)
    .map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
const tagSelect = ma('select');
    tagSelect.innerHTML = `<option value="">不筛选</option>`;
const changeType = async ()=>{
    const type = typeSelect.value;
    const e = await f(`${origin}/${type}/list/${uid}/collect?page=${1}`, 30);
    const tags = Array
        .from(e.querySelectorAll('#userTagList > li > a.l'))
        .map(l=>l.childNodes[1].textContent);
    if(type != typeSelect.value) return;
    const last = tagSelect.value;
    const options = tags.map(t=>`<option value="${t}">${t}</option>`).join('');
    tagSelect.innerHTML = `<option value="">不筛选</option>${options}`;
    if(tags.includes(last)) tagSelect.value = last;
};
typeSelect.onchange = changeType;
changeType();

let html2canvasloaded = false;
const saveImage = (e, d)=>{
    const done = ()=>{
        html2canvasloaded = true;
        html2canvas(e,{
            'allowTaint': true, 'logging': false, 'backgroundColor': '#1c1c1c'
        }).then(canvas=>{
            const div = ce('div');
            div.id = 'kotori-report-canvas';
            div.appendChild(ce('div')).onclick = ()=>div.remove();
            div.appendChild(canvas);
            document.body.appendChild(div);
            d();
        });
    };
    if(html2canvasloaded) return done();
    const script = ce('script');
    script.type = 'text/javascript';
    script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
    script.onload = done;
    document.body.appendChild(script);
}
const go = ma('div');
go.className = 'btn';
go.innerText = '生成';
const l = ['|', '/', '-', '\\'];
const gen = async ()=>{
    go.onclick = null;
    let i = 0;
    const id = setInterval(()=>go.innerText=`抓取数据中[${l[i++%4]}]`, 50);
    const y = parseInt(yearSelect.value) || year;
    const t = typeSelect.value || 'anime';
    const g = tagSelect.value;
    const list = (await collects(t)).sort((a,b)=>b.time-a.time);
    go.onclick = gen;
    clearInterval(id);
    go.innerText = '生成';
    msw.set(false);
    const filterList = list.filter(({year, tags})=>year==y&&(!g||g&&tags.includes(g)));
    let count = new Array(12).fill(0);
    const stars = new Array(11).fill(0);
    let last = -1;
    const lis = [];
    for(const {img, month, star} of filterList) {
        count[month]++;
        stars[star]++;
        let monthTag = '';
        if(month != last) {
            monthTag = `<span>${month+1}月</span>`;
            last = month;
        }
        lis.push(`<li><img src="${img}">${monthTag}</li>`);
    }
    const eT = `<h1>${y}年 Bangumi ${types[t]}年鉴 @${uid}</h1>`;
    const eU = `<ul class="l">${lis.join('')}</ul>`;
    const bU = (l, t, d=0)=>{
        const max = Math.max(...l);
        l = l.map((c,i)=>
            `<li><span>${i+d}${t}</span><span>${c}</span><div style="width:${c*100/max}%;"></div></li>`
        ).join('');
        return `<ul class="c">${l}</ul>`;
    }

    const content = ce('div');
    content.className = 'content';
    content.innerHTML = [
        eT,
        bU(count, '月', 1),
        bU(stars, '星'),
        eU
    ].join('');
    const close = ce('div');
    close.className = 'close';
    close.onclick = ()=>div.remove();
    const save = ce('div');
    save.className = 'save';
    const s = ()=>{
        save.onclick = null;
        saveImage(content, ()=>save.onclick=s)
    };
    save.onclick = s;
    const div = ce('div');
    div.appendChild(close);
    div.appendChild(content);
    div.appendChild(save);
    div.id = 'kotori-report';
    document.body.appendChild(div);
};

go.onclick = gen;

document.querySelector('#headerProfile h1.nameSingle > .rr').appendChild(btn);

// style
const style = ce('style');
document.head.appendChild(style);
style.innerHTML = `
.btn {
    user-select: none;
    cursor: pointer;
}

#kotori-report-menu {
    color: #fff;
    position: fixed;
    display: block;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    padding-top: 50px;
    background: #0d111788;
    backdrop-filter: blur(4px);
    border-radius: 10px;
    box-shadow: 2px 2px 10px #00000088;
    border: 1px solid #fc899422;
    min-width: 150px;
}

#kotori-report-menu::before {
    position: absolute;
    content: "菜单";
    padding: 0 20px;
    top: -1px;
    right: -1px;
    left: -1px;
    height: 30px;
    line-height: 30px;
    background: #fc8994;
    backdrop-filter: blur(4px);
    border-radius: 10px 10px 0 0;
}

#kotori-report-menu > li {
    margin-top: 10px;
}

#kotori-report-menu > li:first-child {
    margin-top: 0;
}

#kotori-report-menu > li > .btn {
    width: 100%;
    padding: 10px 0;
    background: #fc899444;
    border: inset 2px solid #fc8994;
    text-align: center;
    border-radius: 5px;
    transition: all 0.3s;
    font-family: consolas, 'courier new', monospace, courier;
}

#kotori-report-menu > li > .btn:hover {
    width: 100%;
    padding: 10px 0;
    background: #fc8994;
    border: 2px solid #fc8994 inset;
    text-align: center;
    border-radius: 5px;
    transition: all 0.3s;
}

#kotori-report-canvas,
#kotori-report {
    color: #fff;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(2px);
    overflow: scroll;
    padding: 30px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

#kotori-report-canvas::-webkit-scrollbar,
#kotori-report::-webkit-scrollbar {
    display: none;
}

#kotori-report-canvas > div,
#kotori-report > .close {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
}

#kotori-report > .save {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    background: #fc8994;
    border-radius: 40px;
    border: 4px solid #fc8994;
    cursor: pointer;
    box-shadow: 2px 2px 10px #00000088;
    user-select: none;
    line-height: 40px;
    background-size: 40px;
    background-image: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMzMwIDMzMCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTE2NSwwQzc0LjAxOSwwLDAsNzQuMDE4LDAsMTY1YzAsOTAuOTgsNzQuMDE5LDE2NSwxNjUsMTY1czE2NS03NC4wMiwxNjUtMTY1QzMzMCw3NC4wMTgsMjU1Ljk4MSwwLDE2NSwweiBNMTY1LDMwMGMtNzQuNDM5LDAtMTM1LTYwLjU2MS0xMzUtMTM1UzkwLjU2MSwzMCwxNjUsMzBzMTM1LDYwLjU2MSwxMzUsMTM1UzIzOS40MzksMzAwLDE2NSwzMDB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTIxMS42NjcsMTI3LjEyMWwtMzEuNjY5LDMxLjY2NlY3NWMwLTguMjg1LTYuNzE2LTE1LTE1LTE1Yy04LjI4NCwwLTE1LDYuNzE1LTE1LDE1djgzLjc4N2wtMzEuNjY1LTMxLjY2NmMtNS44NTctNS44NTctMTUuMzU1LTUuODU3LTIxLjIxMywwYy01Ljg1OCw1Ljg1OS01Ljg1OCwxNS4zNTUsMCwyMS4yMTNsNTcuMjcxLDU3LjI3MWMyLjkyOSwyLjkzLDYuNzY4LDQuMzk1LDEwLjYwNiw0LjM5NWMzLjgzOCwwLDcuNjc4LTEuNDY1LDEwLjYwNy00LjM5M2w1Ny4yNzUtNTcuMjcxYzUuODU3LTUuODU3LDUuODU4LTE1LjM1NSwwLjAwMS0yMS4yMTVDMjI3LjAyMSwxMjEuMjY0LDIxNy41MjQsMTIxLjI2NCwyMTEuNjY3LDEyNy4xMjF6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTE5NSwyNDBoLTYwYy04LjI4NCwwLTE1LDYuNzE1LTE1LDE1YzAsOC4yODMsNi43MTYsMTUsMTUsMTVoNjBjOC4yODQsMCwxNS02LjcxNywxNS0xNUMyMTAsMjQ2LjcxNSwyMDMuMjg0LDI0MCwxOTUsMjQweiIvPjwvc3ZnPg==);
    opacity: 0.8;
    z-index: 9999999999999;
}

#kotori-report > .content {
    width: 1078px;
    margin: 0 auto;
}

#kotori-report > .content > h1 {
    padding: 30px 0;
    text-align: center;
}

#kotori-report > .content > ul.l > li {
    display: inline-block;
    position: relative;
    width: 150px;
    height: 215px;
    background: #0008;
    margin: 2px;
}

#kotori-report > .content > ul.l > li span {
    width: 50px;
    height: 30px;
    position: absolute;
    top: 0;
    left: 0;
    line-height: 30px;
    text-align: center;
    font-size: 18px;
    background: #8c49548c;
    backdrop-filter: blur(2px);
}

#kotori-report > .content > ul.l > li img {
    max-width: 150px;
    max-height: 220px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

#kotori-report > .content > ul.c {
    display: inline-block;
    position: relative;
    width: calc(50% - 4px);
    margin: 2px;
}

#kotori-report > .content > ul.c > li {
    display: block;
    position: relative;
    width: 100%;
    height: 20px;
    background: #0008;
    margin: 2px;
    line-height: 20px;
    backdrop-filter: blur(2px);
}

#kotori-report > .content > ul.c > li > span {
    position: absolute;
    left: 0;
    text-shadow: 0 0 2px #000;
}

#kotori-report > .content > ul.c > li > span:nth-child(2) {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

#kotori-report > .content > ul.c > li > div {
    display: inline-block;
    height: 100%;
    background: #fc8994aa;
    margin: 0;
}

#kotori-report-canvas > canvas {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%) scale(0.8);
}
@media screen and (min-width: 214px) {
    #kotori-report > .content {
        width: 154px;
    }
}
@media screen and (min-width: 368px) {
    #kotori-report > .content {
        width: 308px;
    }
}
@media screen and (min-width: 522px) {
    #kotori-report > .content {
        width: 462px;
    }
}
@media screen and (min-width: 616px) {
    #kotori-report > .content {
        width: 616px;
    }
}
@media screen and (min-width: 830px) {
    #kotori-report > .content {
        width: 770px;
    }
}
@media screen and (min-width: 924px) {
    #kotori-report > .content {
        width: 924px;
    }
}
@media screen and (min-width: 1138px) {
    #kotori-report > .content {
        width: 1078px;
    }
}
`;

})();