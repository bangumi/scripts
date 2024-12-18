// ==UserScript==
// @name         条目讨论页显示用户评价
// @namespace    https://bgm.tv/group/topic/411796
// @version      1.0.0
// @description  也可以干别的
// @author       mmv
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(subject/topic|blog|ep|character|person|group/topic)/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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

    let userLinks = [];
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
        } finally {
            lazyRender(userLinks, subject_id, fallbackName);
        }
    }

    const ongoingRequests = new Map();

    async function getUserData(username, subject_id) {
        const cacheKey = `userData_${username}_${subject_id}`;

        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) return JSON.parse(cachedData);
        if (ongoingRequests.has(cacheKey)) return ongoingRequests.get(cacheKey);

        const requestPromise = (async() => {
            const response = await fetch(`https://api.bgm.tv/v0/users/${username}/collections/${subject_id}`);
            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else if (response.status === 404) {
                const data = { notFound: true }
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else {
                throw new Error('Network response was not ok: ', response);
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

        const loader = document.createElement('div');
        loader.classList.add('loader');
        userLink.after(loader);

        const wrapper = document.createElement('span');
        wrapper.classList.add('ccf-wrapper');
        userLink.after(wrapper);

        try {
            const data = await getUserData(username, subject_id);

            if (data.notFound) {
                const html = fallbackName ? `未标记<a href="/subject/${subject_id}" class="l">${fallbackName}</a>` : '未标记该条目';
                wrapper.innerHTML = `<span class="ccf-status">${html}</span>`;
            } else {
                const { subject_type, rate, type, ep_status, vol_status, comment, subject } = data;
                const name = subject?.name;
                const verb = ['读', '看', '听', '玩', '', '看'][subject_type - 1];
                let html = '';

                if (rate && rate !== 0) {
                    html += `<span class="ccf-star starstop-s"><span class="starlight stars${rate}"></span></span>`;
                }
                if (type) {
                    html += `<span class="ccf-status">${[`想${verb}`, `${verb}过`, `在${verb}`, '搁置', '抛弃'][type-1]}${
                        fallbackName && `<a href="/subject/${subject_id}" class="l">${name}</a>` || ''
                    }</span>`;
                }
                if (ep_status) {
                    html += `<span class="ccf-status">${verb}到ep${ep_status}</span>`;
                }
                if (vol_status) {
                    html += `<span class="ccf-status">${verb}到vol${ep_status}</span>`;
                }
                if (comment) {
                    html += `<span class="ccf-comment" data-comment="${comment.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')}">💬</span>`;
                }

                wrapper.innerHTML = html;
            }

        } catch (error) {
            console.error('Error fetching user data:', error);

            const reloadBtn = document.createElement('span');
            reloadBtn.classList.add('ccf-status');
            reloadBtn.innerHTML = `<a href="/subject/${subject_id}" class="l">${fallbackName}</a>加载失败`;
            reloadBtn.style.cursor = 'pointer';
            reloadBtn.addEventListener('click', event => {
                if (event.target !== event.currentTarget) return;
                const username = userLink.href.split('/').pop();
                sessionStorage.removeItem(`userData_${username}_${subject_id}`);
                reloadBtn.parentNode.remove();
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
        for (const userLink of userLinks) observer.observe(userLink);
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
            btn.addEventListener('click', function() {
                const status = document.createElement('span');
                status.classList.add('ccf-status');
                status.textContent = '已显示本作评价';
                this.after(status);
                this.remove();
                lazyRender(userLinks, subjectLink.href.split('/').pop(), subjectLink.textContent);
            });
            subjectLink.after(br, btn);
        }
    }

})();
