// ==UserScript==
// @name         Bangumi 年鉴
// @description  根据Bangumi的时光机数据生成年鉴
// @namespace    syaro.io
// @version      1.3.6
// @author       神戸小鳥 @vickscarlet
// @license      MIT
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/(user)\/.*/
// ==/UserScript==
(async () => {
    const uid = /\/user\/(.+)?(\/.*)?/.exec(window.location.href)?.[1];
    const PRG = ['|', '/', '-', '\\'];
    const STAR_PATH = 'M60.556381,172.206 C60.1080307,172.639 59.9043306,173.263 60.0093306,173.875 L60.6865811,177.791 C60.8976313,179.01 59.9211306,180 58.8133798,180 C58.5214796,180 58.2201294,179.931 57.9282291,179.779 L54.3844766,177.93 C54.1072764,177.786 53.8038262,177.714 53.499326,177.714 C53.1958758,177.714 52.8924256,177.786 52.6152254,177.93 L49.0714729,179.779 C48.7795727,179.931 48.4782224,180 48.1863222,180 C47.0785715,180 46.1020708,179.01 46.3131209,177.791 L46.9903714,173.875 C47.0953715,173.263 46.8916713,172.639 46.443321,172.206 L43.575769,169.433 C42.4480682,168.342 43.0707186,166.441 44.6289197,166.216 L48.5916225,165.645 C49.211123,165.556 49.7466233,165.17 50.0227735,164.613 L51.7951748,161.051 C52.143775,160.35 52.8220755,160 53.499326,160 C54.1776265,160 54.855927,160.35 55.2045272,161.051 L56.9769285,164.613 C57.2530787,165.17 57.7885791,165.556 58.4080795,165.645 L62.3707823,166.216 C63.9289834,166.441 64.5516338,168.342 63.423933,169.433 L60.556381,172.206 Z';
    const STAR_SVG = `<svg fill="#ffde20" width="800px" height="800px" viewBox="43 159.5 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="${STAR_PATH}"></path></svg>`;
    const STAR_URL = URL.createObjectURL(new Blob([STAR_SVG], { type: 'image/svg+xml' }));

    const Types = {
        anime: { sort: 1, value: 'anime', name: '动画', action: '看', unit: '部' },
        game: { sort: 2, value: 'game', name: '游戏', action: '玩', unit: '部' },
        music: { sort: 3, value: 'music', name: '音乐', action: '听', unit: '张' },
        book: { sort: 4, value: 'book', name: '图书', action: '读', unit: '本' },
        real: { sort: 5, value: 'real', name: '三次元', action: '看', unit: '部' },
    }
    const SubTypes = {
        collect: { sort: 1, value: 'collect', name: '$过', checked: true },
        do: { sort: 2, value: 'do', name: '在$', checked: false },
        dropped: { sort: 3, value: 'dropped', name: '抛弃', checked: false },
        on_hold: { sort: 4, value: 'on_hold', name: '搁置', checked: false },
        wish: { sort: 5, value: 'wish', name: '想$', checked: false },
    };

    function formatSubType(subType, type) {
        const action = Types[type].action;
        return SubTypes[subType].name.replace('$', action);
    }

    function callWhenDone(fn) {
        let done = true;
        return async () => {
            if (!done) return;
            done = false;
            await fn();
            done = true;
        }
    }
    async function callNow(fn) {
        await fn();
        return fn;
    }

    // DOM API HELPERS START
    function setProps(element, props) {
        if (!props || typeof props !== 'object') return;

        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'boolean') {
                element[key] = value;
                continue;
            }
            if (key === 'class') addClass(element, value);
            else if (key === 'style' && typeof value === 'object') setStyle(element, value);
            else element.setAttribute(key, value);
        }
    }

    function addClass(element, value) {
        element.classList.add(...[value].flat());
    }

    function setStyle(element, styles) {
        for (let [k, v] of Object.entries(styles)) {
            if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k))
                v += 'px';
            element.style[k] = v;
        }
    }

    function create(name, props, ...childrens) {
        const element = document.createElement(name);
        if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
            return append(element, props, ...childrens);
        setProps(element, props);
        return append(element, ...childrens)
    }

    function append(element, ...childrens) {
        for (const child of childrens) {
            if (Array.isArray(child)) element.append(create(...child));
            else if (child instanceof Node) element.appendChild(child);
            else element.append(document.createTextNode(child));
        }
        return element;
    }

    function removeAllChildren(element) {
        while (element.firstChild) element.removeChild(element.firstChild);
    }
    // DOM API HELPERS END

    // indexedDB cache
    class DB {
        #dbName = 'mcache';
        #version = 1;
        #collection = 'pages';
        #keyPath = 'url';
        #db;

        static #gdb;

        static async initInstance() {
            if (!this.#gdb) this.#gdb = await new DB().init();
            return this.#gdb;
        }

        static instance() {
            if (!this.#gdb) throw new Error('DB not initInstance');
            return this.#gdb;
        }

        async init() {
            this.#db = await new Promise((resolve, reject) => {
                const request = window.indexedDB.open(this.#dbName, this.#version);
                request.onerror = event => reject(event.target.error);
                request.onsuccess = event => resolve(event.target.result);
                request.onupgradeneeded = event => {
                    if (event.target.result.objectStoreNames.contains(this.#collection)) return;
                    event.target.result.createObjectStore(this.#collection, { keyPath: this.#keyPath });
                };
            });
            return this;
        }

        async #store(handle, mode = 'readonly') {
            return new Promise((resolve, reject) => {
                const transaction = this.#db.transaction(this.#collection, mode);
                const store = transaction.objectStore(this.#collection);
                let result;
                new Promise((rs, rj) => handle(store, rs, rj))
                    .then(ret => result = ret)
                    .catch(reject);
                transaction.onerror = () => reject(new Error('Transaction error'));
                transaction.oncomplete = () => resolve(result);
            });
        }

        async get(key, index) {
            return this.#store((store, resolve, reject) => {
                if (index) store = store.index(index);
                const request = store.get(key);
                request.onerror = reject;
                request.onsuccess = () => resolve(request.result);
            })
                .catch(null);
        }

        async put(data) {
            return this.#store((store, resolve, reject) => {
                const request = store.put(data);
                request.onerror = reject;
                request.onsuccess = () => resolve(true);
            }, 'readwrite')
                .catch(false);
        }

        async clear() {
            return this.#store((store, resolve, reject) => {
                const request = store.clear();
                request.onerror = reject;
                request.onsuccess = () => resolve(true);
            }, 'readwrite')
                .catch(false);
        }
    }
    await DB.initInstance();

    function easeOut(curtime, begin, end, duration) {
        let x = curtime / duration;
        let y = -x * x + 2 * x;
        return begin + (end - begin) * y;
    }

    function groupBy(list, group) {
        const groups = new Map();
        for (const item of list) {
            const key = typeof group == 'function' ? group(item) : item[group];
            if (groups.has(key)) groups.get(key).push(item);
            else groups.set(key, [item]);
        }
        return groups;
    }

    function countMap(length) {
        return new Map(new Array(length).fill(0).map((_, i) => [i, 0]));
    }

    function groupCount(list, group, defaultMap) {
        const groups = defaultMap || new Map();
        for (const item of list) {
            const key = typeof group == 'function' ? group(item) : item[group];
            groups.set(key, (groups.get(key) || 0) + 1);
        }
        return groups;
    }

    // LOAD DATA START
    async function f(url) {
        const html = await fetch(window.location.origin + '/' + url).then(res => res.text());
        if (html.includes('503 Service Temporarily Unavailable')) return null;
        const e = create('html');
        e.innerHTML = html.replace(/<img (.*)\/?>/g, '<span class="img" $1></span>');
        return e;
    };

    async function fl(type, subType, p = 1, expire = 30) {
        const url = `${type}/list/${uid}/${subType}?page=${p}`;
        let data = await DB.instance().get('0x1@' + url);
        if (data && data.time + expire * 60000 > Date.now()) return data;

        const e = await f(url);
        const list = Array
            .from(e.querySelectorAll('#browserItemList > li'))
            .map(li => {
                const data = { subType };
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
                data.star = parseInt(li.querySelector('span.starlight')?.className.match(/stars(\d{1,2})/)[1]) || 0;
                data.tags = li.querySelector('span.tip')?.textContent.trim().match(/标签:\s*(.*)/)?.[1].split(/\s+/) || [];
                return data;
            });
        const edge = e.querySelector('span.p_edge');
        let max;
        if (edge) {
            max = Number(edge.textContent.match(/\/\s*(\d+)\s*\)/)?.[1] || 1);
        } else {
            const ap = e.querySelectorAll('a.p');
            if (ap.length == 0) {
                max = 1;
            } else {
                let cursor = ap[ap.length - 1];
                if (cursor.innerText == '››')
                    cursor = cursor.previousElementSibling;
                max = Number(cursor.textContent) || 1;
            }
        }
        const time = Date.now();
        data = { url: '0x1@' + url, list, max, time };
        if (p == 1) {
            const tags = Array
                .from(e.querySelectorAll('#userTagList > li > a.l'))
                .map(l => l.childNodes[1].textContent);
            data.tags = tags;
        }
        await DB.instance().put(data);
        return data;
    }

    async function ft(type) {
        const { tags } = await fl(type, 'collect')
        return tags
    }

    async function bsycs(type, subType, year) {
        const { max } = await fl(type, subType);
        console.info('Total', type, subType, max, 'page');
        console.info('BSearch by year', year);
        let startL = 1;
        let startR = 1;
        let endL = max;
        let endR = max;
        let dL = false;
        let dR = false;

        while (startL <= endL && startR <= endR) {
            const mid = startL < endL
                ? Math.max(Math.min(Math.floor((startL + endL) / 2), endL), startL)
                : Math.max(Math.min(Math.floor((startR + endR) / 2), endR), startR)
            const { list } = await fl(type, subType, mid);
            if (list.length == 0) return [1, 1];
            const first = list[0].year;
            const last = list[list.length - 1].year;
            console.info(`\tBSearch page`, mid, ' ', '\t[', first, last, ']');
            if (first > year && last < year) return [mid, mid];

            if (last > year) {
                if (!dL) startL = Math.min(mid + 1, endL);
                if (!dR) startR = Math.min(mid + 1, endR);
            } else if (first < year) {
                if (!dL) endL = Math.max(mid - 1, startL);
                if (!dR) endR = Math.max(mid - 1, startR);
            } else if (first == last) {
                if (!dL) endL = Math.max(mid - 1, startL);
                if (!dR) startR = Math.min(mid + 1, endR);
            } else if (first == year) {
                startR = endR = mid;
                if (!dL) endL = Math.min(mid + 1, endR);
            } else if (last == year) {
                startL = endL = mid;
                if (!dL) startR = Math.min(mid + 1, endR);
            }
            if (startL == endL) dL = true;
            if (startR == endR) dR = true;
            if (dL && dR) return [startL, startR];
        }
    }

    async function cbt(type, subtype, year) {
        if (!year) return cbtAll(type, subtype);
        return cbtYear(type, subtype, year);
    };

    async function cbtYear(type, subtype, year) {
        const [start, end] = await bsycs(type, subtype, year);
        console.info('Collect pages [', start, end, ']');
        const ret = [];
        for (let i = start; i <= end; i++) {
            console.info('\tCollect page', i);
            const { list } = await fl(type, subtype, i);
            ret.push(list);
        }
        return ret.flat();
    }

    async function cbtAll(type, subtype) {
        const { list, max } = await fl(type, subtype, 1);
        console.info('Collect pages [', 1, max, ']');
        const ret = [list];
        for (let i = 2; i <= max; i++) {
            console.info('\tCollect page', i);
            const { list } = await fl(type, subtype, i);
            ret.push(list);
        }
        return ret.flat();
    }

    async function collects({ type, subTypes, tag, year }) {
        const ret = [];
        for (const subtype of subTypes) {
            const list = await cbt(type, subtype, year);
            ret.push(list);
        }
        const fset = new Set();
        return ret.flat()
            .filter(({ id, year: y, tags }) => {
                if (year && year != y) return false;
                if (tag && !tags.includes(tag)) return false;
                if (fset.has(id)) return false;
                fset.add(id);
                return true;
            })
            .sort(({ time: a }, { time: b }) => b - a);
    }
    // LOAD DATA END

    // SAVE IMAGE START
    const loaded = new Set();
    async function loadScript(src) {
        if (loaded.has(src)) return;
        return new Promise((resolve, reject) => {
            const script = create('script', { src, type: 'text/javascript' });
            script.onload = () => {
                loaded.add(src);
                resolve();
            };
            document.body.appendChild(script);
        })
    }

    async function element2Canvas(element, done) {
        await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
        const canvas = await html2canvas(element, { allowTaint: true, logging: false, backgroundColor: '#1c1c1c' })
        const close = create('div', { style: { height: canvas.style.height } });
        const main = create('div', { id: 'kotori-report-canvas' }, close, canvas);
        close.addEventListener('click', () => main.remove());
        document.body.appendChild(main);
        done();
    }
    // SAVE IMAGE END

    // REPORT START
    function pw(v, m) {
        return { style: { width: v * 100 / m + '%' } }
    }
    function buildIncludes(list, type) {
        list = Array.from(list).map(([k, v]) => [formatSubType(k, type), v]);
        const total = list.reduce((sum, [_, v]) => sum + v, 0)
        list.unshift(['总计', total])
        list.sort((a, b) => b[1] - a[1])
        const format = (k, v) => k + ':' + (('' + v).padStart(5, ' ')) + Types[type].unit
        const buildItem = ([k, v]) => ['li', ['div', format(k, v)], ['div', ['div', pw(v, total)]]];
        return ['ul', { class: 'includes' }, ...list.map(buildItem)];
    }

    function buildBarList(list) {
        list = Array.from(list).sort(([, , a], [, , b]) => a - b);
        const m = Math.max(...list.map(([v]) => v));
        const buildItem = ([v, t]) => ['li', ['span', t], ['span', v], ['div', pw(v, m)]]
        return ['ul', { class: 'bars' }, ...list.map(buildItem)];
    }

    function buildCoverList(list, type) {
        let last = -1;
        const covers = [];
        for (const { img, month, star } of list) {
            const childs = [['img', { src: img }]];
            if (month != last) {
                childs.push(['span', month + 1 + '月']);
                last = month;
            }
            if (star)
                childs.push(['div', { class: 'star' }, ['img', { src: STAR_URL }], ['span', star]]);
            covers.push(['li', ...childs]);
        }
        return ['ul', { class: 'covers', type }, ...covers]
    }

    async function buildLifeTimeReport({ type, tag, subTypes }) {
        const list = await collects({ type, subTypes, tag });

        const buildYearCover = ([year, l]) => ['li', ['h2', {}, year + '年', ['span', {}, l.length]], buildCoverList(l, type)];
        const banner = ['div', { class: 'banner' },
            ['h1', `Bangumi ${Types[type].name}生涯总览`],
            ['span', { class: 'uid' }, '@' + uid],
            buildIncludes(groupCount(list, 'subType').entries(), type)
        ];
        const countList = buildBarList(groupCount(list, 'month', countMap(12)).entries().map(([k, v]) => [v, k + 1 + '月', k]));
        const starList = buildBarList(groupCount(list, 'star', countMap(11)).entries().map(([k, v]) => [v, k ? k + '星' : '未评分', k]));
        const barGroup = ['div', { class: 'bar-group' }, countList, starList];
        const yearCover = ['ul', { class: 'year-cover' }, ...groupBy(list, 'year').entries().map(buildYearCover)];

        return create('div', { class: 'content' }, banner, barGroup, yearCover);
    }

    async function buildYearReport({ year, type, tag, subTypes }) {
        const list = await collects({ type, subTypes, tag, year });

        const banner = ['div', { class: 'banner' },
            ['h1', `${year}年 Bangumi ${Types[type].name}年鉴`],
            ['span', { class: 'uid' }, '@' + uid],
            buildIncludes(groupCount(list, 'subType').entries(), type)
        ];
        const countList = buildBarList(groupCount(list, 'month', countMap(12)).entries().map(([k, v]) => [v, k + 1 + '月', k]));
        const starList = buildBarList(groupCount(list, 'star', countMap(11)).entries().map(([k, v]) => [v, k ? k + '星' : '未评分', k]));
        const barGroup = ['div', { class: 'bar-group' }, countList, starList];

        return create('div', { class: 'content' }, banner, barGroup, buildCoverList(list, type));
    }

    async function buildReport(options) {
        const content = await (options.isLifeTime ? buildLifeTimeReport(options) : buildYearReport(options));

        const close = create('div', { class: 'close' });
        const scroll = create('div', { class: 'scroll' }, content);
        const save = create('div', { class: 'save' });
        const report = create('div', { id: 'kotori-report' }, close, scroll, save);

        const saveFn = () => {
            save.onclick = null;
            element2Canvas(content, () => save.onclick = saveFn)
        };
        let ly = scroll.scrollTop || 0;
        let my = ly;
        let ey = ly;
        let interval = null;
        const scrollFn = (iey) => {
            ey = Math.max(Math.min(iey, scroll.scrollHeight - scroll.offsetHeight), 0);
            ly = my;
            if (interval) clearInterval(interval);
            let times = 1;
            interval = setInterval(() => {
                if (times > 50) {
                    clearInterval(interval);
                    interval = null;
                    return;
                }
                my = easeOut(times, ly, ey, 50);
                scroll.scroll({ top: my })
                times++;
            }, 1)
        };
        const wheelFn = e => {
            e.preventDefault();
            scrollFn(ey + e.deltaY);
        }
        const keydownFn = e => {
            e.preventDefault();
            if (e.key == 'Escape') close.click();
            if (e.key == 'Home') scrollFn(0);
            if (e.key == 'End') scrollFn(scroll.scrollHeight - scroll.offsetHeight);
            if (e.key == 'ArrowUp') scrollFn(ey - 100);
            if (e.key == 'ArrowDown') scrollFn(ey + 100);
            if (e.key == 'PageUp') scrollFn(ey - scroll.offsetHeight);
            if (e.key == 'PageDown') scrollFn(ey + scroll.offsetHeight);
        };
        scroll.addEventListener('wheel', wheelFn);
        close.addEventListener('wheel', wheelFn)
        save.addEventListener('wheel', wheelFn)
        document.addEventListener('keydown', keydownFn);
        save.addEventListener('click', saveFn);
        close.addEventListener('click', () => {
            document.removeEventListener('keydown', keydownFn);
            report.remove()
        });
        document.body.appendChild(report);
    }
    // REPORT END

    // MENU START
    async function buildMenu() {
        const year = new Date().getFullYear();

        const buildSubTypeCheck = ([_, { value, name, checked }]) => ['div', { value },
            ['input', { type: 'checkbox', id: 'yst_' + value, name, value, checked }],
            ['label', { for: 'yst_' + value }, name]
        ];
        const lifeTimeCheck = create('input', { type: 'checkbox', id: 'lftc' });
        const yearSelect = create('select', ...new Array(year - 2007).fill(0).map((_, i) => ['option', { value: year - i }, year - i]));
        const typeSelect = create('select', ...Object.entries(Types).map(([_, { value, name }]) => ['option', { value }, name]));
        const tagSelect = create('select', ['option', { value: '' }, '不筛选']);
        const btnGo = create('div', { class: ['btn', 'primary'] }, '生成');
        const btnClr = create('div', { class: ['btn', 'warning'] }, '清理缓存');
        const btnGroup = ['div', { class: 'btn-group' }, btnGo, btnClr];
        const ytField = ['fieldset', ['legend', '选择年份与类型'], ['div', lifeTimeCheck, ['label', { for: 'lftc' }, '生涯报告']], yearSelect, typeSelect];
        const tagField = ['fieldset', ['legend', '选择过滤标签'], tagSelect];
        const subtypeField = create('fieldset', ['legend', '选择包括的状态'], ...Object.entries(SubTypes).map(buildSubTypeCheck))
        const menu = create('ul', { id: 'kotori-report-menu' }, ['li', ytField], ['li', tagField], ['li', subtypeField], ['li', btnGroup]);

        lifeTimeCheck.addEventListener('change', () => {
            if (lifeTimeCheck.checked) yearSelect.disabled = true;
            else yearSelect.disabled = false;
        })
        typeSelect.addEventListener('change', await callNow(async () => {
            const type = typeSelect.value;
            if (!type) return;
            subtypeField.querySelectorAll('div').forEach(e => {
                const name = formatSubType(e.getAttribute('value'), type);
                e.querySelector('input').setAttribute('name', name);
                e.querySelector('label').innerText = name;
            });
            const tags = await ft(type);
            if (type != typeSelect.value) return;
            const last = tagSelect.value;
            removeAllChildren(tagSelect);
            tagSelect.append(create('option', { value: '' }, '不筛选'));
            append(tagSelect, ...tags.map(t => ['option', { value: t }, t]));
            if (tags.includes(last)) tagSelect.value = last;
        }));
        btnGo.addEventListener('click', callWhenDone(async () => {
            let i = 0;
            const id = setInterval(() => btnGo.innerText = `抓取数据中[${PRG[i++ % 4]}]`, 50);
            await buildReport({
                isLifeTime: lifeTimeCheck.checked,
                year: parseInt(yearSelect.value) || year,
                type: typeSelect.value || 'anime',
                tag: tagSelect.value,
                subTypes: Array.from(subtypeField.querySelectorAll('input:checked')).map(e => e.value)
            });
            menuToggle();
            clearInterval(id);
            btnGo.innerText = '生成';
        }));
        btnClr.addEventListener('click', callWhenDone(async () => {
            let i = 0;
            const id = setInterval(() => btnGo.innerText = `清理缓存中[${PRG[i++ % 4]}]`, 50);
            await DB.instance().clear();
            clearInterval(id);
            btnClr.innerText = '清理缓存';
        }))
        document.body.appendChild(menu);
        return menu;
    }

    let menu = null;
    async function menuToggle() {
        if (!menu) menu = await buildMenu();
        menu.style.display = menu.style.display == 'block' ? 'none' : 'block';
    }
    // MENU END

    const btn = create('a', { class: 'chiiBtn', href: 'javascript:void(0)', title: '生成年鉴' }, ['span', '生成年鉴']);
    btn.addEventListener('click', menuToggle);
    document.querySelector('#headerProfile .actions').append(btn);

    // style
    document.head.appendChild(create('style', `
.btn { user-select: none; cursor: pointer; }

.btn.primary { background: #fc899488; }
.btn.primary:hover { background: #fc8994; }
.btn.danger { background: #fc222288; }
.btn.danger:hover { background: #fc2222; }
.btn.success { background: #22fc2288; }
.btn.success:hover { background: #22fc22; }
.btn.warning { background: #fcb12288; }
.btn.warning:hover { background: #fcb122; }

#kotori-report-canvas::-webkit-scrollbar, #kotori-report .scroll::-webkit-scrollbar { display: none; }

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

    > li:first-child { margin-top: 0; }
    > li {
        margin-top: 10px;
        > .btn-group {
            display: flex;
            gap: 10px;
            > .btn {
                width: 100%;
                padding: 10px 0;
                text-align: center;
                border-radius: 5px;
                transition: all 0.3s;
                font-size: 16px;
                font-weight: bold;
            }
            > .btn:hover {
                width: 100%;
                padding: 10px 0;
                text-align: center;
                border-radius: 5px;
                transition: all 0.3s;
            }
        }
    }

    fieldset {
        display: flex;
        gap: 5px;
        min-inline-size: min-content;
        margin-inline: 1px;
        border-width: 1px;
        border-style: groove;
        border-color: threedface;
        border-image: initial;
        padding-block: 0.35em 0.625em;
        padding-inline: 0.75em;

        > div {
            display: flex;
            gap: 2px;
            justify-content: center;
        }
    }
}

#kotori-report {
    color: #fff;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    > .close {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        background: rgba(0,0,0,0.3);
        backdrop-filter: blur(2px);
    }

    > .save {
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
    > .scroll {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        overflow: scroll;

        > .content {
            display: flex;
            flex-direction: column;
            gap: 5px;
            width: 1078px;
            margin: 0 auto;

            .banner {
                height: 110px;
                background: #fc899488;
                backdrop-filter: blur(2px);
                color: #fff;
                text-shadow: 0 0 5px #000;
                h1 {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 36px;
                    line-height: 36px;
                    text-align: center;
                }

                .uid {
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    font-size: 20px;
                }

                ul.includes {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    align-items: flex-end;
                    position: absolute;
                    top: 0;
                    right: 0;
                    > li {
                        position: relative;
                        justify-content: center;
                        >div:first-child {
                            text-align: left;
                            width: 80px;
                            padding-left: 105px;
                        }
                        > div:last-child {
                            position: absolute;
                            width: 100px;
                            left: 0;
                            top: 50%;
                            transform: translateY(-50%);
                            height: 3px;
                            transition: all 0.3s;
                            > div {
                                position: absolute;
                                top: 0;
                                right: 0;
                                height: 100%;
                                background: #fff;
                            }
                        }
                    }
                }
            }

            ul.year-cover {
                display: flex;
                flex-direction: column;
                gap: 5px;
                > li {
                    position: relative;
                    > h2 {
                        position: relative;
                        padding: 2px;
                        text-align: center;
                        background: #fc899488;
                        backdrop-filter: blur(2px);
                        color: #fff;
                        font-weight: bold;
                        text-shadow: 0 0 4px #000;
                        > span {
                            position: absolute;
                            top: 50%;
                            right: 10px;
                            transform: translateY(-50%);
                            font-size: 14px;
                            color: #ffde20;
                        }
                    }
                }
                > li:before {
                    content: "";
                    display: block;
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    border: 1px solid #fc8994;
                    box-sizing: border-box;
                }
            }
            > .bar-group {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;

                ul.bars {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    position: relative;
                    width: calc(50% - 1px);

                    > li {
                        display: block;
                        position: relative;
                        width: 100%;
                        height: 20px;
                        background: #0008;
                        margin: 0;
                        line-height: 20px;
                        backdrop-filter: blur(2px);

                        > span {
                            position: absolute;
                            left: 5px;
                            text-shadow: 0 0 2px #000;
                        }

                        > span:nth-child(2) {
                            position: absolute;
                            left: 50%;
                            transform: translateX(-50%);
                        }

                        > div {
                            display: inline-block;
                            height: 100%;
                            background: #fc8994aa;
                            margin: 0;
                        }
                    }
                }
            }

            ul.covers[type="music"] > li { height: 150px; }
            ul.covers {
                line-height: 0;
                > li {
                    display: inline-block;
                    position: relative;
                    width: 150px;
                    height: 220px;
                    margin: 2px;
                    overflow: hidden;
                    border-width: 1px;
                    border-style: solid;
                    border-color: #fc8994;
                    box-sizing: border-box;

                    img {
                        max-height: 100%;
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                    }

                    > span {
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

                    .star {
                        display: block;
                        position: absolute;
                        bottom: 3px;
                        right: 3px;
                        width: 20px;
                        height: 20px;
                        padding: 5px;
                        background: none;
                        > img {
                            opacity: 0.85;
                        }
                        > span {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            color: #f4a;
                            font-family: consolas, 'courier new', monospace, courier;
                            font-size: 18px;
                            font-weight: bold;
                            text-shadow: 0 0 2px #fff;
                            transform: translate(-50%, -50%);
                        }
                    }
                }
            }
        }
    }
}

#kotori-report-canvas {
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
    > div {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        background: rgba(0,0,0,0.3);
        backdrop-filter: blur(2px);
    }
    > canvas {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
    }
}

@media screen and (min-width: 616px) { #kotori-report .content { width: 616px !important; } }
@media screen and (min-width: 830px) { #kotori-report .content { width: 770px !important; } }
@media screen and (min-width: 924px) { #kotori-report .content { width: 924px !important; } }
@media screen and (min-width: 1138px) { #kotori-report .content { width: 1078px !important; } }
`));

})();