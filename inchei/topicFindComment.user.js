// ==UserScript==
// @name         条目讨论页显示用户评价
// @namespace    https://bgm.tv/group/topic/411796
// @version      1.1.9
// @description  也可以干别的
// @author       mmv
// @match        http*://bgm.tv/subject/topic/*
// @match        http*://bgm.tv/blog/*
// @match        http*://bgm.tv/ep/*
// @match        http*://bgm.tv/character/*
// @match        http*://bgm.tv/person/*
// @match        http*://bgm.tv/group/topic/*
// @match        http*://bangumi.tv/subject/topic/*
// @match        http*://bangumi.tv/blog/*
// @match        http*://bangumi.tv/ep/*
// @match        http*://bangumi.tv/character/*
// @match        http*://bangumi.tv/person/*
// @match        http*://bangumi.tv/group/topic/*
// @match        http*://chii.in/subject/topic/*
// @match        http*://chii.in/blog/*
// @match        http*://chii.in/ep/*
// @match        http*://chii.in/character/*
// @match        http*://chii.in/person/*
// @match        http*://chii.in/group/topic/*
// @icon         https://bgm.tv/img/favicon.ico
// @license      MIT
// @grant        none
// @gf           https://greasyfork.org/zh-CN/scripts/520506
// @gadget       https://bgm.tv/dev/app/3437

// ==/UserScript==

(function () {
    'use strict';

    let userLinks = [];
    const ongoingRequests = new Map();
    let accessToken;
    const fallbackNames = {};
    const sfwSubjects = new Set(JSON.parse(sessionStorage.getItem('ccf_sfw') || '[]'));
    const sfwq = '，受限条目？';

    const styleSheet = document.createElement("style");
    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
    styleSheet.innerText = css`
        .ccf-wrapper ~ .ccf-wrapper::before { /* 用 ~ 不用 + 避免与其他组件冲突 */
            content: "·";
            color: #999;
            font-size: 10px;
            margin-left: 5px;
        }
        .ccf-star { margin-left: 5px; }
        .ccf-status {
            margin-left: 5px;
            color: #999;
            font-size: 12px;
            font-weight: normal;
        }
        button.ccf-status {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            user-select: text;
        }
        button.ccf-status[disabled] {
            cursor: text;
        }
        .ccf-comment {
            margin-left: 5px;
            position: relative;
            cursor: help;
        }
        .ccf-comment-popup {
            position: absolute;
            top: 100%;
            background-color: rgba(254, 254, 254, 0.9);
            box-shadow: inset 0 1px 1px hsla(0, 0%, 100%, 0.3), inset 0 -1px 0 hsla(0, 0%, 100%, 0.1), 0 2px 4px hsla(0, 0%, 0%, 0.2);
            backdrop-filter: blur(5px);
            border-radius: 5px;
            padding: 5px;
            max-width: 20em;
            width: max-content;
            z-index: 1000;
            font-weight: normal;
            font-size: 12px;
            color: rgba(0, 0, 0, .7);
            cursor: text;
            display: none;
        }
        html[data-theme="dark"] .ccf-comment-popup {
            background: rgba(80, 80, 80, 0.7);
            color: rgba(255, 255, 255, .7);
        }
        .ccf-comment:hover .ccf-comment-popup,
        .ccf-comment:focus .ccf-comment-popup,
        .ccf-comment:active .ccf-comment-popup {
            display: block;
            opacity: 0;
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

        userLinks = [document.querySelector('.title a'), ...document.querySelectorAll('#columnA .inner strong a')];
        const relatedSubjects = document.querySelectorAll('.entry-related-subjects .title a');
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

    window.ccf = async (subject_id) => lazyRender(userLinks, subject_id, true);

    document.addEventListener('click', e => {
        if (e.target.classList.contains('ccf-comment')) e.target.focus();
    }, true);

    async function getUserData(username, subject_id) {
        const cacheKey = `userData_${username}_${subject_id}`;

        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            const data = JSON.parse(cachedData);
            return data;
        }
        if (ongoingRequests.has(cacheKey)) return ongoingRequests.get(cacheKey);

        const requestPromise = (async () => {
            const headers = {};
            if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
            const response = await fetch(`https://api.bgm.tv/v0/users/${username}/collections/${subject_id}`, { headers });
            if (response.ok) {
                const data = await response.json();
                if (!accessToken) updSfw(subject_id);
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else if (response.status === 404) {
                const data = { notFound: true, borne: !!accessToken };
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else if (response.status === 401) {
                const data = { authFailed: true };
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } else {
                throw new Error(`API request ${response.status} ${response.statusText}`);
            }
        })();

        ongoingRequests.set(cacheKey, requestPromise);

        try {
            return await requestPromise;
        } finally {
            ongoingRequests.delete(cacheKey);
        }
    }

    async function renderUserData(userLink, subject_id, showName = false) {
        const username = userLink.href.split('/').pop();
        const cacheKey = `userData_${username}_${subject_id}`;

        const loader = document.createElement('div');
        loader.classList.add('loader');
        userLink.after(loader);

        const wrapper = document.createElement('span');
        wrapper.classList.add('ccf-wrapper');
        userLink.after(wrapper);

        const subjectHTML = showName ? `<a href="/subject/${subject_id}" class="l${fallbackNames[subject_id] ? '' : ` ccf-name-tbd-${subject_id}`
            }" target="_blank">${fallbackNames[subject_id] || subject_id
            }</a>` : '';

        try {
            const data = await getUserData(username, subject_id);

            if (data.notFound || data.authFailed) {
                const needBear = !sfwSubjects.has(subject_id) && data.notFound && !data.borne;
                const needToken = needBear || data.authFailed;
                const tag = needToken ? 'button' : 'span';
                const status = document.createElement(tag);
                status.classList.add('ccf-status');
                status.innerHTML = `未找到公开${subjectHTML}收藏`;

                if (needToken) {
                    status.classList.add('ccf-unborne');
                    status.dataset.cacheKey = cacheKey;
                    if (needBear) {
                        status.innerHTML += sfwq;
                        status.classList.add(`ccf-sfw-tbd-${subject_id}`);
                    } else if (data.authFailed) {
                        status.textContent = '个人令牌认证失败';
                    }
                    status.onclick = e => {
                        if (e.target !== e.currentTarget) return;
                        status.insertAdjacentHTML('afterend', `<span class="ccf-status ccf-at-${subject_id}">试试<a class="l" href="https://next.bgm.tv/demo/access-token/create" target="_blank">创建</a>并<a class="l ccf-at" href="javascript:">填写</a>个人令牌？</span>`);
                        status.disabled = true;
                        status.nextElementSibling?.querySelector('.ccf-at')?.addEventListener('click', () => {
                            accessToken = prompt('请填写个人令牌');
                            if (!accessToken) return;
                            if (!accessToken.match(/^[a-zA-Z0-9]+$/)) {
                                accessToken = null;
                                alert('格式错误，请重新填写');
                                return;
                            }

                            const unbornes = document.querySelectorAll('.ccf-unborne');
                            const [idLinkMap, cacheKeys2Rm] = [...unbornes].reduce(([map, keys], unborne) => {
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
                            for (const [subject_id, links] of Object.entries(idLinkMap)) {
                                lazyRender(links, subject_id, showName);
                            }
                        });
                    };
                }

                wrapper.append(status);
            } else {
                const { subject_type, rate, type, ep_status, vol_status, comment, subject } = data;
                const name = subject?.name;
                if (showName && name) updName(subject_id, name);
                const verb = ['读', '看', '听', '玩', '', '看'][subject_type - 1];
                let html = '';

                if (rate && rate !== 0) {
                    html += `<span class="ccf-star starstop-s"><span class="starlight stars${rate}"></span></span>`;
                }
                if (type) {
                    html += `<span class="ccf-status">${[`想${verb}`, `${verb}过`, `在${verb}`, '搁置', '抛弃'][type - 1]}${showName && `<a href="/subject/${subject_id}" class="l" target="_blank">${name}</a>` || ''
                        }</span>`;
                }
                if (ep_status) {
                    html += `<span class="ccf-status">${verb}到ep${ep_status}</span>`;
                }
                if (vol_status) {
                    html += `<span class="ccf-status">${ep_status ? '' : `${verb}到`}vol${vol_status}</span>`;
                }

                wrapper.innerHTML = html;

                if (comment) {
                    const popupBtn = document.createElement('span');
                    popupBtn.classList.add('ccf-comment');
                    popupBtn.role = 'button';
                    popupBtn.tabIndex = 0;
                    popupBtn.innerHTML = '💬';
                    const popup = document.createElement('div');
                    popup.classList.add('ccf-comment-popup');
                    popup.innerHTML = comment;
                    popupBtn.append(popup);
                    wrapper.append(popupBtn);

                    // waiting for CSS Anchor Positioning
                    const adjustPos = () => {
                        const rect = popupBtn.getBoundingClientRect();
                        const popupRect = popup.getBoundingClientRect();
                        const windowWidth = window.innerWidth;
                        if (rect.left + popupRect.width > windowWidth) {
                            popup.style.left = `${windowWidth - rect.left - popupRect.width}px`;
                        } else {
                            popup.style.left = '0';
                            popup.style.right = 'auto';
                        }
                        popup.style.opacity = '1';
                    };
                    popupBtn.addEventListener('mouseenter', adjustPos);
                    popupBtn.addEventListener('click', adjustPos);
                }
            }

        } catch (error) {
            console.error('Error fetching user data:', error);

            const reloadBtn = document.createElement('button');
            reloadBtn.classList.add('ccf-status');
            reloadBtn.innerHTML = `${subjectHTML}加载失败`;
            reloadBtn.addEventListener('click', e => {
                if (e.target !== e.currentTarget) return;
                sessionStorage.removeItem(cacheKey);
                reloadBtn.parentElement.remove();
                renderUserData(userLink, subject_id);
            });

            wrapper.append(reloadBtn);
        } finally {
            loader.remove();
        }
    }

    function inView(elem) {
        const isHidden = elem.closest('.sub_reply_bg')?.style.display === 'none' // (折叠长楼层)(https://bgm.tv/dev/app/2214)
            || elem.closest('.row_reply')?.hidden; // (只看好友/自己参与的评论)[https://bgm.tv/dev/app/3587]
        const rect = elem.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom >= 0 && !isHidden;
    }

    function lazyRender(userLinks, subject_id, showName) {
        const observer = new IntersectionObserver(async (entries) => {
            if (entries[0].intersectionRatio <= 0) return;
            for (const { isIntersecting, target } of entries) {
                if (!isIntersecting || !inView(target)) continue;
                if (target.closest('.sub_reply_bg')?.style.overflow === 'hidden') {
                    // (折叠长楼层)(https://bgm.tv/dev/app/2214)
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
                observer.unobserve(target);
                renderUserData(target, subject_id, showName);
            }
        });
        for (const userLink of userLinks) {
            if (inView(userLink)) {
                renderUserData(userLink, subject_id, showName);
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
                lazyRender(userLinks, subject_id, true);
            });
            subjectLink.after(br, btn);
        }
    }

    function updSfw(subject_id) {
        if (sfwSubjects.has(subject_id)) return;
        sfwSubjects.add(subject_id);
        sessionStorage.setItem('ccf_sfw', JSON.stringify([...sfwSubjects]));
        document.querySelectorAll(`.ccf-sfw-tbd-${subject_id}`).forEach(status => {
            status.innerHTML = status.innerHTML.slice(0, -sfwq.length);
            status.disabled = true;
            status.classList.remove('ccf-unborne');
        });
        document.querySelectorAll(`.ccf-at-${subject_id}`).forEach(status => status.remove());
    }

    function updName(subject_id, name) {
        if (fallbackNames[subject_id]) return;
        fallbackNames[subject_id] = name;
        document.querySelectorAll(`.ccf-name-tbd-${subject_id}`).forEach(status => {
            status.textContent = name;
        });
    }

})();