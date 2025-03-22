// ==UserScript==
// @name         条目讨论页显示用户评价
// @namespace    https://bgm.tv/group/topic/411796
// @version      1.1.1
// @description  也可以干别的
// @author       mmv
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(subject/topic|blog|ep|character|person|group/topic)/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let userLinks = [];
    const ongoingRequests = new Map();
    let accessToken;
    const fallbackNames = {};

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .ccf-wrapper ~ .ccf-wrapper::before { /* 用 ~ 不用 + 避免与其他组件冲突 */
            content: "·";
            color: #999;
            font-size: 10px;
            margin-left: 5px;
        }
        .ccf-star { margin-left: 5px; }
        .ccf-status { margin-left: 5px; color: #999; font-size: 12px; font-weight: normal; }
        .ccf-comment {
            margin-left: 5px;
            position: relative;
            cursor: help;
        }
        .ccf-comment::after {
            content: attr(data-comment);
            position: absolute;
            top: 100%;
            left: 0;
            background-color: rgba(254, 254, 254, 0.9);
            box-shadow: inset 0 1px 1px hsla(0, 0%, 100%, 0.3), inset 0 -1px 0 hsla(0, 0%, 100%, 0.1), 0 2px 4px hsla(0, 0%, 0%, 0.2);
            backdrop-filter: blur(5px);
            border-radius: 5px;
            padding: 5px;
            width: 250px;
            z-index: 1000;
            font-weight: normal;
            font-size: 12px;
            color: rgba(0, 0, 0, .7);
            cursor: text;
            transform: scale(0);
        }
        .ccf-comment:hover::after {
            transform: scale(1);
        }
        html[data-theme="dark"] .ccf-comment::after {
            background: rgba(80, 80, 80, 0.7);
            color: rgba(255, 255, 255, .7);
        }
        .loader {
            margin-left: 5px;
            border: 2px solid transparent;
            border-top: 2px solid #F09199;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            animation: spin 2s linear infinite;
            display: inline-block;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleSheet);

    if (location.pathname.startsWith('/subject/topic') || location.pathname.startsWith('/ep')) {

        userLinks = document.querySelectorAll('.inner strong a');
        const subject_id = document.querySelector('#subject_inner_info a').href.split('/').pop();
        if (!userLinks || !subject_id) return;
        lazyRender(userLinks, subject_id);

    } else if (location.pathname.startsWith('/blog')) {

        userLinks = [document.querySelector('#pageHeader a'), ...document.querySelectorAll('#columnA .inner strong a')];
        const relatedSubjects = document.querySelectorAll('#related_subject_list .ll a');
        if (!userLinks || !relatedSubjects) return;
        multiSubjectsRender(userLinks, relatedSubjects);

    } else if (location.pathname.startsWith('/character') || location.pathname.startsWith('/person')) {

        userLinks = document.querySelectorAll('.inner strong a');
        const castSubjects = document.querySelectorAll('.browserList .inner a[href^="/subject/"]');
        if (!userLinks || !castSubjects) return;
        multiSubjectsRender(userLinks, castSubjects);

    } else if (location.pathname.startsWith('/group/topic')) {

        userLinks = document.querySelectorAll('#columnInSubjectA .inner strong a');
        if (!userLinks) return;

    }

    window.ccf = async (subject_id) => {
        let fallbackName = subject_id;
        try {
            fallbackName = (await (await fetch(`https://api.bgm.tv/v0/subjects/${subject_id}`)).json()).name;
            fallbackNames[subject_id] = fallbackName;
        } finally {
            lazyRender(userLinks, subject_id, fallbackName);
        }
    }

    async function getUserData(username, subject_id) {
        const cacheKey = `userData_${username}_${subject_id}`;

        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) return JSON.parse(cachedData);
        if (ongoingRequests.has(cacheKey)) return ongoingRequests.get(cacheKey);

        const requestPromise = (async() => {
            const headers = {};
            if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
            const response = await fetch(`https://api.bgm.tv/v0/users/${username}/collections/${subject_id}`, { headers });
            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else if (response.status === 404) {
                const data = { notFound: true, borne: !!headers.Authorization };
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else if (response.status === 401) {
                const data = { authFailed: true };
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else {
                throw new Error(`API request ${ response.status } ${ response.statusText }`);
            }
        })();

        ongoingRequests.set(cacheKey, requestPromise);

        try {
            return await requestPromise;
        } finally {
            ongoingRequests.delete(cacheKey);
        }
  }

  async function renderUserData(userLink, subject_id, fallbackName='') {
        const username = userLink.href.split('/').pop();
        const cacheKey = `userData_${username}_${subject_id}`;

        const loader = document.createElement('div');
        loader.classList.add('loader');
        userLink.after(loader);

        const wrapper = document.createElement('span');
        wrapper.classList.add('ccf-wrapper');
        userLink.after(wrapper);

        const subjectHTML = `<a href="/subject/${subject_id}" class="l" target="_blank">${fallbackName}</a>`;

        try {
            const data = await getUserData(username, subject_id);

            if (data.notFound || data.authFailed) {
                const status = document.createElement('span');
                status.classList.add('ccf-status');
                status.innerHTML = fallbackName ? `未标记${subjectHTML}` : '未标记该条目';
                if (data.notFound && !data.borne || data.authFailed) {
                    status.classList.add('ccf-unborne');
                    status.dataset.cacheKey = cacheKey;
                    status.dataset.fallbackName = fallbackName;
                    if (data.notFound && !data.borne) {
                        status.innerHTML += '？';
                    } else if (data.authFailed) {
                        status.textContent = '个人令牌认证失败';
                    }
                    status.style.cursor = 'pointer';
                    status.onclick = e => {
                        if (e.target !== e.currentTarget) return;
                        status.insertAdjacentHTML('afterend', '<span class="ccf-status">试试<a class="l" href="https://next.bgm.tv/demo/access-token/create" target="_blank">创建</a>并<a class="l" href="javascript:" id="incheiat">填写</a>个人令牌？</span>');
                        status.onclick = null;
                        status.style.cursor = 'auto';
                        status.nextElementSibling?.querySelector('#incheiat')?.addEventListener('click', () => {
                            accessToken = prompt('请填写个人令牌');
                            if (!accessToken) return;
                            if (!accessToken.match(/^[a-zA-Z0-9]+$/)) {
                                accessToken = null;
                                alert('格式错误，请重新填写');
                                return;
                            }

                            const unbornes = document.querySelectorAll('.ccf-unborne');
                            const [unborneMap, cacheKeys2Rm] = [...unbornes].reduce(([map, keys], unborne) => {
                                const subject_id = unborne.dataset.cacheKey.split('_').pop();
                                const link = unborne.parentNode.parentNode.querySelector('a');
                                if (map[subject_id]) {
                                    map[subject_id].push(link);
                                } else {
                                    map[subject_id] = [link];
                                }
                                keys.add(unborne.dataset.cacheKey);

                                unborne.parentNode.remove();
                                return [map, keys];
                            }, [{}, new Set()]);

                            for (const cacheKeyRm of cacheKeys2Rm) sessionStorage.removeItem(cacheKeyRm);
                            for (const [subject_id, links] of Object.entries(unborneMap)) {
                                lazyRender(links, subject_id, fallbackNames[subject_id]);
                            }
                        });
                    };
                }

                wrapper.append(status);
            } else {
                const { subject_type, rate, type, ep_status, vol_status, comment, subject } = data;
                const name = subject?.name;
                const verb = ['读', '看', '听', '玩', '', '看'][subject_type - 1];
                let html = '';

                if (rate && rate !== 0) {
                    html += `<span class="ccf-star starstop-s"><span class="starlight stars${rate}"></span></span>`;
                }
                if (type) {
                    html += `<span class="ccf-status">${[`想${verb}`, `${verb}过`, `在${verb}`, '搁置', '抛弃'][type - 1]}${
                        fallbackName && `<a href="/subject/${subject_id}" class="l">${name}</a>` || ''
                    }</span>`;
                }
                if (ep_status) {
                    html += `<span class="ccf-status">${verb}到ep${ep_status}</span>`;
                }
                if (vol_status) {
                    html += `<span class="ccf-status">${ ep_status ? '' : `${verb}到` }vol${vol_status}</span>`;
                }
                if (comment) {
                    html += `<span class="ccf-comment" data-comment="${comment.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")}">💬</span>`;
                }

                wrapper.innerHTML = `${html}`;
            }

        } catch (error) {
            console.error('Error fetching user data:', error);

            const reloadBtn = document.createElement('span');
            reloadBtn.classList.add('ccf-status');
            reloadBtn.innerHTML = `${subjectHTML}加载失败`;
            reloadBtn.style.cursor = 'pointer';
            reloadBtn.addEventListener('click', e => {
                if (e.target !== e.currentTarget) return;
                sessionStorage.removeItem(cacheKey);
                userLink.parentNode.remove();
                renderUserData(userLink, subject_id, fallbackName);
            });

            wrapper.append(reloadBtn);
        } finally {
            loader.remove();
        }
    }

    function lazyRender(userLinks, subject_id, fallbackName) {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].intersectionRatio <= 0) return;
            for (const { isIntersecting, target } of entries) {
                if (!isIntersecting) continue;
                observer.unobserve(target);
                renderUserData(target, subject_id, fallbackName);
            }
        });
        for (const userLink of userLinks) {
            const rect = userLink.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                renderUserData(userLink, subject_id, fallbackName);
            } else {
                observer.observe(userLink);
            }
        }
    }

    function multiSubjectsRender(userLinks, subjectLinks) {
        if (subjectLinks.length === 1) {
            lazyRender(userLinks, subjectLinks[0].href.split('/').pop());
            return;
        }
        for (const subjectLink of subjectLinks) {
            const br = document.createElement('br');
            const btn = document.createElement('a');
            btn.href = 'javascript:;';
            btn.textContent = '显示评价';
            btn.classList.add('l');
            btn.addEventListener('click', () => {
                const status = document.createElement('span');
                status.classList.add('ccf-status');
                status.textContent = '已显示本作评价';
                btn.replaceWith(status);

                const subject_id = subjectLink.href.split('/').pop();
                const fallbackName = subjectLink.textContent;
                fallbackNames[subject_id] = fallbackName;
                lazyRender(userLinks, subject_id, fallbackName);
            });
            subjectLink.after(br, btn);
        }
    }

})();
