// ==UserScript==
// @name         Bangumi 不同类型收藏状态比例条图
// @namespace    https://bgm.tv/group/topic/422194
// @version      1.3.2
// @description  在用户页面显示收藏状态分布彩色条
// @author       owho
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/user/*
// @match        http*://bangumi.tv/user/*
// @match        http*://chii.in/user/*
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/534247
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

    // 添加样式（包含tooltip样式）
    const style = document.createElement('style');
    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
    style.textContent = css`
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
        .status-bar {
            display: flex;
            height: 10px;
            border-radius: 3px;
            overflow: hidden;
            transition: width 0.3s;
            min-width: 10px; /* 设置最小宽度，确保圆角显示 */
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

        /* 自定义Tooltip样式 */
        .custom-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.1s ease; /* 缩短过渡时间，减少闪烁感知 */
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        /* 暗色主题适配 */
        html[data-theme="dark"] .custom-tooltip {
            background: rgba(255, 255, 255, 0.8);
            color: #333;
        }
    `;
    document.head.appendChild(style);

    // 自定义Tooltip实现（修复闪烁问题）
    function initTooltips() {
        // 1. 全局状态管理：记录当前hover的元素和隐藏定时器，避免重复操作
        let currentHoverElement = null;
        let hideTimer = null;

        // 2. 创建全局唯一tooltip元素
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // 3. 统一的显示tooltip函数
        function showTooltip(element) {
            // 清除之前的隐藏定时器（关键：避免前一个元素的隐藏操作生效）
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }

            // 获取当前元素的提示文本
            const titleText = element.getAttribute('data-tooltip');
            if (!titleText) return;

            // 更新tooltip内容和位置
            tooltip.textContent = titleText;
            tooltip.style.display = 'block';

            // 计算居中位置（基于元素自身位置）
            const rect = element.getBoundingClientRect();
            const tooltipHeight = tooltip.offsetHeight || 20; // 兼容未渲染完成的情况
            tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
            tooltip.style.top = `${rect.top - tooltipHeight - 5}px`;

            // 立即显示（缩短过渡时间，减少闪烁）
            setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 10);

            // 更新当前hover元素
            currentHoverElement = element;
        }

        // 4. 统一的隐藏tooltip函数（延迟执行，给元素切换留时间）
        function hideTooltip() {
            // 延迟30ms隐藏，避免鼠标快速切换时的闪烁
            hideTimer = setTimeout(() => {
                // 确认当前没有hover的元素，再隐藏
                if (!currentHoverElement) {
                    tooltip.style.opacity = '0';
                    setTimeout(() => {
                        tooltip.style.display = 'none';
                    }, 100); // 匹配opacity过渡时间
                }
            }, 30);
        }

        // 5. 为所有状态段绑定事件
        document.querySelectorAll('.status-segment.titleTip').forEach(element => {
            // 存储提示文本到data-tooltip，移除原生title避免冲突
            const titleText = element.getAttribute('title');
            element.setAttribute('data-tooltip', titleText);
            element.removeAttribute('title');

            // 鼠标进入：显示当前元素的tooltip
            element.addEventListener('mouseenter', () => {
                showTooltip(element);
            });

            // 鼠标离开：标记当前元素为空，并触发隐藏（延迟执行）
            element.addEventListener('mouseleave', () => {
                // 只有当离开的是当前hover的元素时，才触发隐藏
                if (currentHoverElement === element) {
                    currentHoverElement = null;
                    hideTooltip();
                }
            });

            // 鼠标移动：调整tooltip位置（避免溢出视口）
            element.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'none') return;

                const viewportWidth = window.innerWidth;
                const tooltipWidth = tooltip.offsetWidth || 80;
                let left = e.pageX - tooltipWidth / 2;

                // 边界处理：避免tooltip超出视口左右侧
                if (left + tooltipWidth > viewportWidth) {
                    left = viewportWidth - tooltipWidth - 10;
                }
                if (left < 10) {
                    left = 10;
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${e.pageY - (tooltip.offsetHeight || 20) - 10}px`;
            });
        });
    }

    // 等待页面加载完成
    $(document).ready(function () {
        // 获取所有分类数据
        const categories = ['anime', 'book', 'game', 'music', 'real'];
        const container = $('<div class="status-bars-container"></div>');

        let maxTotal = 0;
        const categoryTotals = {};

        // 先计算每个分类的总数，并找出最大值
        categories.forEach(category => {
            const selector = `#${category} .num`;
            const items = $(selector);

            if (items.length === 0) return; // 跳过没有数据的分类

            const total = items.toArray().reduce((sum, num) => {
                return sum + +num.textContent;
            }, 0);

            categoryTotals[category] = total;
            if (total > maxTotal) {
                maxTotal = total;
            }
        });

        categories.forEach(category => {
            const selector = `#${category} .num`;
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
                const count = +$(this).text();
                const statusText = $(this).prev().text();
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

        // 初始化自定义工具提示（修复后版本）
        initTooltips();

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
