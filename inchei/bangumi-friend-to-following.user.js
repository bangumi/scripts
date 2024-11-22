// ==UserScript==
// @name         “好友”改为“关注”
// @namespace    https://bgm.tv/group/topic/410150
// @version      0.0.1
// @description  将关于好友的描述修改为关注
// @author       oom
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 无限定页面
    // 右上面板
    const userPanela = document.querySelector('#badgeUserPanel a[href$="/friends"]');
    if (userPanela) userPanela.textContent = '关注';
    // 通知
    observeElement('.reply_content.tip', tip => {
        if (tip.textContent === '\n通过了你的好友请求') {
            tip.textContent = '回关了你';
        } else if (tip.textContent === '\n请求与你成为好友') {
            tip.textContent = '关注了你';
        }
    }, { once: false });
    // 春菜
    observeTextContent('#robot_speech_js', speech => {
        if (speech.textContent === '恭喜恭喜，好友添加成功咯～') {
            speech.textContent = '恭喜恭喜，关注成功咯～';
        } else if (speech.textContent === ' 请稍候...正在添加好友...') {
            speech.textContent = ' 请稍候...正在关注...';
        }
    });
    // 兼容在讨论帖子标记出楼主和好友（https://bgm.tv/dev/app/1075）
    observeElement('.friends-chip', chip => chip.title = '我的关注', { once: false });

    if (location.pathname.match(/\/user\/[^/]+/) ||
        location.pathname.match(/(anime|book|game|music|real)\/list/)) { // 个人页
        const tab = document.querySelector('.navTabs a[href$="/friends"]');
        if (tab) tab.textContent = '关注';
    }

    if (location.pathname.match(/\/user\/[^/]+$/)) { // 个人主页
        const btn = document.querySelector('.chiiBtn:not([href="/settings"]) span');
        const feeds = document.querySelectorAll('.timeline .feed');
        if (btn) btn.textContent = btn.textContent.replace('解除好友', '取消关注').replace('加为好友', '关注');
        feeds.forEach(feed => feed.innerHTML = feed.innerHTML.replace(/将(.+?)加为了好友/, '关注了$1'));

        // 添加好友后当前页面直接出现，故监视
        observeElement('#friend_flag small', flag => flag.textContent = '/ 正在关注');

        replaceFollowingBox('#friend');

        const originalConfirm = window.confirm;
        window.confirm = function(message) {
            // 兼容确认是否添加为好友（https://bgm.tv/dev/app/783）
            // 原组件疑似存在昵称获取错误
            // const newMessage = message.replace(/确定添加(.*?)为好友吗？/, '确定关注$1吗？');
            const newMessage = message.replace(/确定添加(.*?)为好友吗？/, '确定关注吗？')
                                      .replace('确认从朋友列表中去掉', '确认取消关注');
            return originalConfirm(newMessage);
        }

        // 兼容班固米马赛克瓷砖（https://bgm.tv/group/topic/344198）
        observeElement('.tab_btn[target=relation]', mosaic => mosaic.textContent = '关注');
    } else if (location.pathname.match(/\/user\/[^/]+\/friends$/)) { // 关注列表
        document.title = document.title.replace('的朋友', '的关注列表');

        // 兼容显示/一键删除单向好友（https://bgm.tv/dev/app/1942）
        observeElement('.del-friend span', span => {
            observeTextContent('.del-friend span', del => del.textContent = del.textContent.replace('好友', '关注'));
        });
    } else if (location.pathname.match(/\/user\/[^/]+\/rev_friends$/)) { // 被关注列表
        document.title = document.title.replace(/谁加(.*?)为好友/, '谁关注了$1');
    } else if (location.pathname.match(/\/subject\/\d+$/)) { // 条目页
        const frdScore = document.querySelector('.frdScore');
        if (frdScore) frdScore.innerHTML = frdScore.innerHTML.replace('好友', '关注');

        // 兼容好友看？（https://bgm.tv/dev/app/20）
        observeElement('.SimpleSidePanel', panel => {
            const titlea = panel.querySelector('h2 > a');
            if (!titlea) return;
            titlea.textContent = titlea.textContent.replace('好友', '关注');
        }, { once: false });
    } else if (location.search.includes('filter=friends')) { // 筛选后短评
        document.title = document.title.replace('好友', '关注');
    } else if (location.pathname.match(/\/subject\/\d+\/(wishes|collections|doings|on_hold|dropped)$/)) { // 短评
        const followingOnly = document.querySelector('.chiiBtn[href$="?filter=friends"] span');
        if (followingOnly) followingOnly.textContent = '只看关注';
    } else if (location.pathname.match(/\/user\/[^/]+\/timeline$/)) { // 用户时间胶囊
        const tipa = document.querySelector('.tip_j [href="/timeline"]');
        if (tipa) tipa.textContent = '前往关注列表的时间胶囊';

        replaceTimeline();
    } else if (location.pathname === '/timeline') { // 时间胶囊
        document.title = '关注列表的时间胶囊';

        const h1 = document.querySelector('#header h1');
        h1.textContent = '关注列表的时间胶囊 / 时空管理局';

        replaceTimeline();
        replaceFollowingBox('#columnTimelineB');
    } else if (location.pathname === '/') { // 主页
        replaceTimeline();
    }

    function replaceFollowingBox(parent) {
        const h2 = document.querySelector(`${parent} h2`);
        const followed = document.querySelector(`${parent} .SidePanel > a`);
        if (h2) h2.innerHTML = h2.innerHTML.replace('的朋友', '的关注');
        if (followed) followed.textContent = followed.textContent.replace(/谁加(.*?)为好友/, '谁关注了$1');
    }

    function replaceTimeline() {
        const menua = document.querySelector('#filter_relation span:not([class])');
        if (menua) menua.textContent = '关注';

        observeElement('.tml_item span', msg => {
            msg.innerHTML = msg.innerHTML.replace(/将(.+?)加为了好友/, '关注了$1');
        }, { once: false });
    }

    // Copilot
    function observeElement(selector, callback, options = { once: true }) {
        selector = `${selector}:not(.incheijs_edited)`;
        const realCallback = callback;
        callback = function(element) {
            element.classList.add('incheijs_edited');
            return realCallback(element);
        }

        const targetNodes = document.querySelectorAll(selector);
        if (targetNodes.length > 0) {
            targetNodes.forEach(element => callback(element));
            if (options.once) return;
        }

        const config = { childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList, observer) => {
            const detectedTargets = document.querySelectorAll(selector);
            if (detectedTargets[0]) {
                observer.disconnect();
                detectedTargets.forEach(element => {
                    callback(element);
                });
                if (!options.once) observer.observe(document.body, config);
            }
        });

        observer.observe(document.body, config);
    }

    function observeTextContent(selector, callback) {
        const targetNode = document.querySelector(selector);
        if (!targetNode) {
            console.error(`Element not found: ${selector}`);
            return;
        }
        callback(targetNode);

        const config = { characterData: true, childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList, observer) => {
            observer.disconnect();
            for (let mutation of mutationsList) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    callback(targetNode);
                }
            }
            observer.observe(targetNode, config);
        });

        observer.observe(targetNode, config);
    }
})();
