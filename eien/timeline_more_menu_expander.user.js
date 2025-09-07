// ==UserScript==
// @name         展开时间线更多菜单
// @namespace    https://bgm.tv/group/topic/422469
// @version      0.0.1
// @description  把更多里的选项全部移动到了一级菜单
// @author       默沨
// @match        bangumi.tv/*
// @match        bgm.tv/*
// @match        chii.in/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const timelineTabs = document.getElementById('timelineTabs');
    if (!timelineTabs) {
        return;
    }

    const moreItem = timelineTabs.querySelector('li a.top')?.parentNode;
    if (!moreItem) {
        return;
    }

    const moreMenu = moreItem.querySelector('ul');
    if (!moreMenu) {
        return;
    }

    const subItems = Array.from(moreMenu.querySelectorAll('li'));

    subItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;

        const type = link.href.match(/type=([^&]+)/)?.[1] ||
            link.id.replace('filter_', '');

        const newItem = document.createElement('li');
        const newLink = document.createElement('a');

        newLink.id = `tab_${type}`;
        newLink.href = link.href;
        newLink.textContent = link.querySelector('span:last-child')?.textContent || link.textContent;

        newLink.addEventListener('click', function (e) {
            e.preventDefault();

            tab_highlight(type);

            loadTimelineContent(this.href);

            if (history.pushState) {
                history.pushState(null, null, this.href);
            }
        });

        newItem.appendChild(newLink);
        timelineTabs.insertBefore(newItem, moreItem);

        const tmlTypeFilter = document.getElementById('tmlTypeFilter');
        if (tmlTypeFilter) {
            const newFilter = document.createElement('a');
            newFilter.id = `filter_${type}`;
            newFilter.href = '#';
            newFilter.textContent = newLink.textContent;
            newFilter.addEventListener('click', function (e) {
                e.preventDefault();
                tab_highlight(type);
                loadTimelineContent(link.href);
            });
            tmlTypeFilter.appendChild(newFilter);
        }
    });

    moreMenu.remove();
    moreItem.remove();

    function tab_highlight(type) {
        const $list = document.getElementById('tmlTypeFilter');
        const $filter = $list?.querySelectorAll('a');
        const $tabs = document.getElementById('timelineTabs');
        const $tab = $tabs?.querySelectorAll('a');

        $tab?.forEach(tab => tab.classList.remove('focus'));
        $filter?.forEach(filter => filter.classList.remove('on'));

        switch (type) {
            default:
                document.getElementById('tab_all')?.classList.add('focus');
                document.getElementById('filter_all')?.classList.add('on');
                break;
            case 'say':
            case 'replies':
            case 'subject':
            case 'blog':
            case 'progress':
            case 'mono':
            case 'relation':
            case 'group':
            case 'wiki':
            case 'index':
            case 'doujin':
                document.getElementById(`tab_${type}`)?.classList.add('focus');
                document.getElementById(`filter_${type}`)?.classList.add('on');
                break;
        }
    }

    function loadTimelineContent(url) {
        const contentArea = document.getElementById('timeline'); // 内容区域

        if (!contentArea) {
            window.location.href = url;
            return;
        }

        contentArea.innerHTML = '<div class="loading">加载中...</div>';

        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newContent = doc.getElementById('timeline')?.innerHTML || html;

                contentArea.innerHTML = newContent;
            })
            .catch(error => {
                console.error('加载失败:', error);
                contentArea.innerHTML = '<div class="error">加载失败，<a href="' + url + '">点击重新加载</a></div>';
            });
    }

    window.addEventListener('popstate', function () {
        loadTimelineContent(window.location.href);
        const type = window.location.href.match(/type=([^&]+)/)?.[1] || 'all';
        tab_highlight(type);
    });

})();
