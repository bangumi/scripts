// ==UserScript==
// @name         Bangumi 不同类型收藏状态比例条图
// @namespace    https://bgm.tv/group/topic/422194
// @version      1.2
// @description  在用户页面显示收藏状态分布彩色条
// @author       owho
// @match        http*://bgm.tv/user/*
// @match        http*://bangumi.tv/user/*
// @match        http*://chii.in/user/*
// @grant        none
// @license      MIT
// @greasy       https://greasyfork.org/zh-CN/scripts/534247
// @gadget       https://bgm.tv/dev/app/3773
// ==/UserScript==

(function () {
    'use strict';

    const categoryMap = {
        anime: '动画',
        book: '书籍',
        game: '游戏',
        music: '音乐',
        real: '三次元'
    }

    // 添加样式
    const style = document.createElement('style');
    style.textContent = /* css */`
        html {
            --bar-bg-color: rgba(0, 0, 0, 0.05);
            --bar-color: #555;
        }
        html[data-theme="dark"] {
            --bar-bg-color: rgba(255, 255, 255, 0.05);
            --bar-color: #dcdcdc;
        }
        .status-bars-container {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-inline: 8px;
            margin-block: 5px;
        }
        .category-container {
            display: flex;
            flex-direction: column;
            cursor: pointer;
            border-radius: 5px;
            padding: 5px;
            transition: background-color 0.3s;
        }
        .category-container:hover,
        .category-container:active,
        .category-container:focus {
            background-color: var(--bar-bg-color);
        }
        .category-container:hover .status-bar,
        .category-container:active .status-bar,
        .category-container:focus .status-bar {
            width: 100%!important;
        }
        .category-title {
            color: var(--bar-color);
        }
        .status-bar {
            display: flex;
            height: 10px;
            border-radius: 3px;
            overflow: hidden;
            transition: width 0.3s;
            min-width: 10px; /* 设置最小宽度，确保圆角显示 */
        }
        .status-segment {
            height: 100%;
            transition: width 0.3s;
            position: relative;
            border: 1px solid transparent;
            box-shadow: 0px 2px 5px rgba(0,0,0,0.1);
        }

        /* 状态颜色定义 - 带渐变效果 */
        .status-wish {
            background: linear-gradient(120deg,
                rgba(255, 183, 77, 0.8) 15%,
                rgba(255, 183, 77, 0.9) 47%,
                #FFB74D 73%);
            border-color: #FFB74D;
            box-shadow: 0px 2px 5px rgba(255, 183, 77, 0.5);
        }
        .status-doing {
            background: linear-gradient(120deg,
                rgba(76, 175, 80, 0.8) 15%,
                rgba(76, 175, 80, 0.9) 47%,
                #4CAF50 73%);
            border-color: #4CAF50;
            box-shadow: 0px 2px 5px rgba(76, 175, 80, 0.5);
        }
        .status-done {
            background: linear-gradient(120deg,
                rgba(33, 150, 243, 0.8) 15%,
                rgba(33, 150, 243, 0.9) 47%,
                #2196F3 73%);
            border-color: #2196F3;
            box-shadow: 0px 2px 5px rgba(33, 150, 243, 0.5);
        }
        .status-onhold {
            background: linear-gradient(120deg,
                rgba(158, 158, 158, 0.8) 15%,
                rgba(158, 158, 158, 0.9) 47%,
                #9E9E9E 73%);
            border-color: #9E9E9E;
            box-shadow: 0px 2px 5px rgba(158, 158, 158, 0.5);
        }
        .status-dropped {
            background: linear-gradient(120deg,
                rgba(244, 67, 54, 0.8) 15%,
                rgba(244, 67, 54, 0.9) 47%,
                #F44336 73%);
            border-color: #F44336;
            box-shadow: 0px 2px 5px rgba(244, 67, 54, 0.5);
        }

        /* 悬停效果增强 */
        .status-segment:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0px 3px 8px rgba(0,0,0,0.2);
        }
        .hidden {
            display: none;
        }
    `;
    document.head.appendChild(style);

    // 等待页面加载完成
    $(document).ready(function () {
        // 获取所有分类数据
        const categories = ['anime', 'book', 'game', 'music', 'real'];
        const container = $('<div class="status-bars-container"></div>');

        let maxTotal = 0;
        const categoryTotals = {};

        // 先计算每个分类的总数，并找出最大值
        categories.forEach(category => {
            const selector = `#${category} .horizontalOptions li.current, #${category} .horizontalOptions li.current ~ li`;
            const items = $(selector);

            if (items.length === 0) return; // 跳过没有数据的分类

            const total = items.toArray().reduce((sum, li) => {
                const match = $(li).text().match(/(\d+)(.+)/);
                return match ? sum + parseInt(match[1]) : sum;
            }, 0);

            categoryTotals[category] = total;
            if (total > maxTotal) {
                maxTotal = total;
            }
        });

        categories.forEach(category => {
            const selector = `#${category} .horizontalOptions li.current, #${category} .horizontalOptions li.current ~ li`;
            const items = $(selector);

            if (items.length === 0) return; // 跳过没有数据的分类

            const total = categoryTotals[category];

            if (total === 0) return; // 跳过总数为 0 的分类

            // 创建分类容器
            const categoryContainer = $('<div class="category-container" role="button" tabindex="0"></div>');

            // 创建分类标题
            const categoryTitle = $('<div class="category-title"></div>').text(
                categoryMap[category]
            );

            // 创建状态条
            const bar = $(`<div class="status-bar ${category}-status-bar"></div>`);
            const relativeWidth = (total / maxTotal) * 100;
            bar.css('width', `${relativeWidth}%`);

            items.each(function () {
                const text = $(this).text();
                const match = text.match(/(\d+)(.+)/);
                if (!match) return;

                const count = parseInt(match[1]);
                const statusText = match[2].trim();
                const percentage = (count / total) * 100;

                // 确定状态类别
                let statusClass = '';
                if (statusText.includes('想')) statusClass = 'status-wish';
                else if (statusText.includes('在')) statusClass = 'status-doing';
                else if (statusText.includes('过')) statusClass = 'status-done';
                else if (statusText.includes('搁置')) statusClass = 'status-onhold';
                else if (statusText.includes('抛弃')) statusClass = 'status-dropped';

                if (statusClass && count > 0) {
                    const segment = $(`<div class="status-segment ${statusClass} titleTip" title="${count}${statusText}"></div>`)
                        .css('width', `${percentage}%`);
                    bar.append(segment);
                }
            });

            // 添加到容器
            categoryContainer.append(categoryTitle);
            categoryContainer.append(bar);
            container.append(categoryContainer);

            let longPressTimer;
            const handleLongPress = function () {
                bar.toggleClass('hidden');
                // 保存隐藏状态到localStorage
                const hiddenCategories = JSON.parse(localStorage.getItem('hiddenBangumiCategories') || '{}');
                hiddenCategories[category] = bar.hasClass('hidden');
                localStorage.setItem('hiddenBangumiCategories', JSON.stringify(hiddenCategories));
            };

            // 为容器添加长按事件，兼容触摸屏和非触摸屏设备
            categoryContainer.on('touchstart mousedown', function () {
                longPressTimer = setTimeout(handleLongPress, 500);
            });

            categoryContainer.on('touchend mouseup', function () {
                clearTimeout(longPressTimer);
            });
        });

        // 将容器插入到页面
        $('.userStats').append(container);

        // 初始化工具提示
        $('.status-segment.titleTip').tooltip();

        // 从localStorage加载隐藏状态
        const hiddenCategories = JSON.parse(localStorage.getItem('hiddenBangumiCategories') || '{}');
        Object.keys(hiddenCategories).forEach(category => {
            const bar = $(`.${category}-status-bar`);
            if (hiddenCategories[category] && bar.length) {
                bar.addClass('hidden');
            }
        });
    });
})();
