// ==UserScript==
// @name         章节讨论吐槽加强
// @version      0.1.0
// @description  章节讨论中置顶显示自己的吐槽，高亮回复过的章节格子
// @author       inchei
// @include      http*://bgm.tv/*
// @include      http*://chii.in/*
// @include      http*://bangumi.tv/*
// @license      MIT
// ==/UserScript==

(async function () {

    async function getDOM(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('HTTP request failed');
            const html = await response.text();
            const dom = new DOMParser().parseFromString(html, 'text/html');
            return dom;
        } catch (error) {
            console.error('章节讨论置顶自己的吐槽: Error fetching and parsing page:', error);
        }
    }

    // Microsoft Copilot start
    function randomDelay() {
        return new Promise(resolve => {
            setTimeout(resolve, Math.random() * 2000 + 1000);
        });
    }

    function waitForElm(elem) {
        return new Promise(resolve => {
            if (elem) {
                return resolve(elem);
            }

            const observer = new MutationObserver(mutations => {
                if (elem) {
                    resolve(elem);
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    const cacheHandler = {
        get(target, key) {
            const data = JSON.parse(localStorage.getItem(target.storageKey) || '{}');
            const now = Date.now();

            if (data[key] && now < data[key].expiry) {
                return data[key].value;
            } else {
                delete data[key];
                localStorage.setItem(target.storageKey, JSON.stringify(data));
                return undefined;
            }
        },
        set(target, key, value) {
            const now = Date.now();
            const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
            const expiry = now + threeMonths;

            const data = JSON.parse(localStorage.getItem(target.storageKey) || '{}');
            data[key] = { value, expiry };
            localStorage.setItem(target.storageKey, JSON.stringify(data));

            return true;
        }
    };
    const cache = new Proxy({ storageKey: 'incheijs_ep_cache' }, cacheHandler);
    // end

    // 章节讨论页
    if (location.pathname.startsWith('/ep')) {
        let replies = getRepliesFromDOM(document);
        //console.log(replies)
        const id = location.pathname.split('/')[2];
        if (replies[0]) {
            document.getElementById('reply_wrapper').before(...replies.map(elem => {
                const clone = elem.cloneNode(true);
                clone.id += '_clone';
                return clone;
            }));
            cache[id] = true;
        } else {
            cache[id] = false;
        }
        // 点击回复按钮
        document.querySelector('.inputBtn').addEventListener('click', async () => {
            replies = await waitForElm(getRepliesFromDOM(document));
            if (replies[0]) cache[id] = true;
        });
        // 侧栏其他章节，无法直接判断是否看过，只取缓存不检查
        const epElems = document.querySelectorAll('.sideEpList li a');
        for (const elem of epElems) {
            const url = elem.href;
            const id = url.split('/')[4];
            //console.log(cache[id])
            if (cache[id] === true) elem.style.color = 'blueviolet';
            //console.log(elem + 'rendered')
        }
    }

    function getRepliesFromDOM(dom) {
        return [...dom.querySelectorAll('#comment_list .row_reply')].filter(comment => comment.dataset.itemUser === dom.querySelector('.avatar').href.split('/').at(-1));
    }

    // 动画条目页
    const subjectID = location.pathname.match(/(?<=subject\/)\d+/)?.[0];
    if (subjectID) {
        const type = document.querySelector('.focus').href.split('/')[3];
        if (type === 'anime') {
            renderChecks();
        }
    }

    // 首页
    if (location.pathname === '/') {
        renderChecks();
    }

    async function renderChecks() {
        console.log('rendering...')
        const watchedEpElems = document.querySelectorAll('.load-epinfo.epBtnWatched');
        for (const elem of watchedEpElems) {
            const url = elem.href;
            const id = url.split('/')[4];
            if (cache[id] === true) {
                mark(elem);
            } else if (cache[id] !== false) {
                const dom = await getDOM(url);
                if (getRepliesFromDOM(dom)[0]) {
                    mark(elem);
                    cache[id] = true;
                } else {
                    cache[id] = false;
                }
                await randomDelay();
            }
            console.log(elem + ' rendered')
        }
        function mark(elem) {
            elem.style.background = 'blueviolet';
            elem.style.borderColor = 'blueviolet';
            //elem.addEventListener('mouseenter', () => {
            //    const popup = document.querySelector('#cluetip-inner .tip');
            //    console.log(popup);
            //})
        }
    }

})();
