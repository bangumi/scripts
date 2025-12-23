// ==UserScript==
// @name         Bangumi 关联人物职位查询
// @namespace    https://bangumi.tv
// @version      0.1.1
// @description  在关联人物编辑页面快速查看人物最近参与的职位信息
// @author       aaa
// @match        https://bgm.tv/subject/*/add_related/person
// @match        https://bangumi.tv/subject/*/add_related/person
// @match        https://chii.in/subject/*/add_related/person
// @run-at       document-idle
// @license      MIT
// @gadget       https://bgm.tv/dev/app/4966
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式
    const style = document.createElement('style');
    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
    style.textContent = css`
        .position-helper-container {
            margin: 10px 0;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .position-control {
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            border: 1px solid;
            white-space: nowrap;
            box-sizing: border-box;
            line-height: 1.4;
            display: inline-flex;
            align-items: center;
        }

        .position-btn {
            background-color: #f5f5f5;
            color: #333;
            border-color: #ddd;
            cursor: pointer;
            transition: all 0.3s;
        }
        .position-btn.fetching {
            background-color: #f5f5f5;
            color: #999;
            border-color: #ddd;
        }
        .position-btn.fetching:hover {
            background-color: #ffebee;
            color: #c62828;
            border-color: #ffcdd2;
        }

        .position-single-btn {
            margin-left: 6px;
            background-color: #f0f0f0;
            color: #666;
            border-color: #ddd;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .position-single-btn:hover {
            background-color: #e6f2ff;
            color: #0066cc;
            border-color: #b8d9ff;
        }
        .position-single-btn.fetching {
            background-color: #fff8e1;
            color: #ff8f00;
            border-color: #ffe082;
            cursor: not-allowed;
        }

        .position-tags {
            display: flex;
            flex-wrap: nowrap;
            margin-left: 5px;
            max-width: 70%;
            overflow: hidden;
            align-items: center;
            gap: 5px;
        }

        .position-tag {
            background-color: #e6f2ff;
            color: #0066cc;
            border-color: #b8d9ff;
            flex: 0 0 auto;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .position-tag.unmatched {
            background-color: #f0f0f0;
            color: #666;
            border-color: #ddd;
        }
        .position-tag.matched-selected {
            background-color: #e8f5e9;
            color: #2e7d32;
            border-color: #a5d6a7;
            font-weight: bold;
        }

        .position-indicator {
            margin-left: 5px;
            min-width: 60px;
            text-align: center;
        }
        .position-indicator.error {
            background-color: #ffebee;
            color: #c62828;
            border-color: #ffcdd2;
        }
        .position-indicator.loading {
            background-color: #fff8e1;
            color: #ff8f00;
            border-color: #ffe082;
        }

        .matched-position {
            color: #0066cc;
            font-weight: bold;
        }
        .selected-position {
            color: #2e7d32;
            font-weight: bold;
        }

        .position-more {
            background-color: #f0f0f0;
            color: #666;
            border-color: #ddd;
            cursor: pointer;
            flex: 0 0 auto;
        }

        .position-popup {
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
            font-size: 12px;
            line-height: 1.5;
        }
        .position-popup ul {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .position-popup li {
            padding: 3px 0;
            border-bottom: 1px solid #eee;
        }
        .position-popup li:last-child {
            border-bottom: none;
        }

        .crtRelatedLeft li .title {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            position: relative;
        }
    `;
    document.head.appendChild(style);

    // 创建辅助容器
    const createHelperContainer = () => {
        const container = document.createElement('div');
        container.className = 'position-helper-container';
        container.innerHTML = `
            <button id="fetchPositions" class="position-btn position-control">获取职位</button>
            <button id="fetchNewPositions" class="position-btn position-control">获取新关联职位</button>
        `;
        return container;
    };

    // 获取人物ID
    const getPersonId = link => link.href.match(/person\/(\d+)/)?.[1] || null;

    // 全局变量
    let currentPopup = null;
    const positionCache = new Map();
    // 用于跟踪批量查询状态的变量
    let isBatchFetching = false;
    let stopBatchFetch = false;

    // 关闭所有弹出层
    const closeAllPopups = () => {
        currentPopup?.remove();
        currentPopup = null;
        document.removeEventListener('click', closeAllPopups);
    };

    // 显示职位详情弹出层
    const showPositionPopup = (positions, targetElement) => {
        closeAllPopups();

        const popup = document.createElement('div');
        popup.className = 'position-popup';
        popup.innerHTML = `<ul>${positions.map(pos =>
            `<li>${pos.name} (${pos.count}次)</li>`
        ).join('')}</ul>`;

        const { left, bottom } = targetElement.getBoundingClientRect();
        popup.style.left = `${left}px`;
        popup.style.top = `${bottom + 5}px`;

        document.body.appendChild(popup);
        currentPopup = popup;

        setTimeout(() => document.addEventListener('click', closeAllPopups), 100);
        popup.addEventListener('click', e => e.stopPropagation());
    };

    // 移除单个人物的查询按钮
    const removeSingleButton = titleElement =>
        titleElement.querySelector('.position-single-btn')?.remove();

    // 获取人物职位信息
    const fetchPersonPosition = async (personId, titleElement, singleBtn) => {
        // 创建状态指示器
        let positionSpan = titleElement.querySelector('.position-indicator')
            ?? titleElement.appendChild(document.createElement('span'));
        positionSpan.className = 'position-indicator position-control loading';
        positionSpan.textContent = '加载中...';

        // 检查缓存
        if (positionCache.has(personId)) {
            processPositionData(positionCache.get(personId), titleElement, singleBtn);
            return;
        }

        // 设置按钮状态
        singleBtn?.classList.add('fetching');

        try {
            // 发送请求
            const res = await fetch(`https://bgm.tv/person/${personId}/works`, {
                credentials: 'same-origin',
                headers: { 'Accept': 'text/html' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // 解析职位数据
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = await res.text();
            const positions = parsePositionGroups(tempDiv);
            positionCache.set(personId, positions);

            positions.length
                ? processPositionData(positions, titleElement, singleBtn)
                : (() => {
                    positionSpan.textContent = '无职位信息';
                    positionSpan.className = 'position-indicator position-control error';
                    removeSingleButton(titleElement);
                  })();
        } catch (e) {
            console.error('查询失败:', e);
            positionSpan.textContent = '请求失败';
            positionSpan.className = 'position-indicator position-control error';
            singleBtn?.classList.remove('fetching');
        }
    };

    // 处理职位数据并更新UI
    const processPositionData = (positions, titleElement, singleBtn) => {
        // 移除加载指示器
        titleElement.querySelector('.position-indicator')?.remove();

        // 创建标签容器
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'position-tags';
        titleElement.appendChild(tagsContainer);

        // 获取下拉框信息
        const liElement = titleElement.closest('li');
        const selectElement = liElement.querySelector('select[name^="infoArr"]');
        const selectedOption = selectElement.querySelector('option:checked');
        const selectedText = selectedOption ? selectedOption.text.split('/')[0].trim() : '';
        const positionOptions = Array.from(selectElement.options).map(
            opt => opt.text.split('/')[0].trim()
        );

        // 分类并排序职位
        const [matched, unmatched] = positions.reduce(([m, u], pos) =>
            (positionOptions.includes(pos.name) ? m : u).push(pos) && [m, u], [[], []]);
        matched.sort((a, b) => b.count - a.count);
        unmatched.sort((a, b) => b.count - a.count);
        const allPositions = [...matched, ...unmatched];

        // 标记选中的匹配职位
        const selectedMatchedPos = matched.find(pos => pos.name === selectedText);

        // 创建职位标签
        const fragment = document.createDocumentFragment();
        const displayCount = Math.min(2, allPositions.length);

        // 优先显示选中的匹配职位（置顶）
        if (selectedMatchedPos) {
            const tag = document.createElement('span');
            tag.className = 'position-tag position-control matched-selected';
            tag.textContent = selectedMatchedPos.name.length > 20
                ? `${selectedMatchedPos.name.substring(0, 18)}...`
                : selectedMatchedPos.name;
            tag.title = selectedMatchedPos.name;
            fragment.appendChild(tag);
        }

        // 添加其他职位标签
        allPositions
            .filter(pos => !selectedMatchedPos || pos.name !== selectedMatchedPos.name)
            .slice(0, selectedMatchedPos ? displayCount - 1 : displayCount)
            .forEach(pos => {
                const tag = document.createElement('span');
                tag.className = `position-tag position-control ${
                    positionOptions.includes(pos.name) ? '' : 'unmatched'
                }`;
                tag.textContent = pos.name.length > 20
                    ? `${pos.name.substring(0, 18)}...`
                    : pos.name;
                tag.title = pos.name;
                fragment.appendChild(tag);
            });

        // 添加更多按钮
        const remaining = allPositions.length - displayCount;
        if (remaining > 0) {
            const moreTag = document.createElement('span');
            moreTag.className = 'position-more position-control';
            moreTag.textContent = `+${remaining}更多`;
            moreTag.addEventListener('click', e => {
                e.stopPropagation();
                showPositionPopup(allPositions, moreTag);
            });
            fragment.appendChild(moreTag);
        }

        tagsContainer.appendChild(fragment);
        updatePositionSelect(selectElement, matched, selectedText);
        singleBtn?.remove();
    };

    // 解析职位信息
    const parsePositionGroups = container => {
        const counts = {};
        container.querySelectorAll('#browserItemList .badge_job').forEach(tag => {
            const name = tag.textContent.trim();
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    };

    // 更新下拉框选项
    const updatePositionSelect = (select, matchedPositions, selectedText) => {
        const selectedValue = select.value;
        const options = Array.from(select.options);
        const optionMap = new Map(options.map(opt =>
            [opt.text.split('/')[0].trim(), opt]
        ));

        // 构建新选项列表
        const newOptions = [];

        // 1. 添加选中项（置顶）
        if (selectedValue) {
            const selectedOpt = options.find(opt => opt.value === selectedValue);
            if (selectedOpt) {
                const opt = document.createElement('option');
                opt.value = selectedOpt.value;
                opt.text = selectedOpt.text;
                opt.className = matchedPositions.some(p => p.name === selectedText)
                    ? 'selected-position'
                    : '';
                newOptions.push(opt);
            }
        }

        // 2. 添加其他匹配项
        matchedPositions
            .filter(pos => !selectedValue || optionMap.get(pos.name)?.value !== selectedValue)
            .forEach(pos => {
                const opt = optionMap.get(pos.name);
                const newOpt = document.createElement('option');
                newOpt.value = opt.value;
                newOpt.text = opt.text;
                newOpt.className = 'matched-position';
                newOptions.push(newOpt);
            });

        // 3. 添加未匹配项
        options.forEach(opt => {
            const text = opt.text.split('/')[0].trim();
            if (!matchedPositions.some(p => p.name === text) && opt.value !== selectedValue) {
                const newOpt = document.createElement('option');
                newOpt.value = opt.value;
                newOpt.text = opt.text;
                newOptions.push(newOpt);
            }
        });

        // 更新下拉框
        select.innerHTML = '';
        newOptions.forEach(opt => select.appendChild(opt));
        if (selectedValue) select.value = selectedValue;
    };

    // 添加单个人物查询按钮
    const addSingleQueryBtn = item => {
        const titleElement = item.querySelector('p.title');
        // 跳过已处理或有错误的条目
        if (!titleElement ||
            titleElement.querySelector('.position-single-btn') ||
            titleElement.querySelector('.position-tags') ||
            titleElement.querySelector('.position-indicator.error')) {
            return;
        }

        const link = titleElement.querySelector('a.l');
        const personId = getPersonId(link);
        if (!personId) return;

        // 创建查询按钮
        const singleBtn = document.createElement('button');
        singleBtn.className = 'position-single-btn position-control';
        singleBtn.textContent = '查职位';

        // 绑定点击事件
        singleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!singleBtn.classList.contains('fetching')) {
                await fetchPersonPosition(personId, titleElement, singleBtn);
            }
        });

        titleElement.appendChild(singleBtn);
    };

    // 批量获取所有职位 - 修复暂停功能
    const fetchAllPositions = async btn => {
        // 如果正在查询，就停止
        if (isBatchFetching) {
            stopBatchFetch = true;
            return;
        }

        // 开始新的查询
        isBatchFetching = true;
        stopBatchFetch = false;
        btn.classList.add('fetching');
        btn.textContent = '获取中... (点击停止)';

        try {
            const items = document.querySelectorAll('#crtRelateSubjects > li');

            for (const item of items) {
                // 检查是否需要停止
                if (stopBatchFetch) break;

                const titleElement = item.querySelector('p.title');
                if (!titleElement) continue;

                removeSingleButton(titleElement);

                const link = titleElement.querySelector('a.l');
                if (!link) continue;

                const personId = getPersonId(link);
                if (!personId) continue;

                if (titleElement.querySelector('.position-tags')) continue;

                await fetchPersonPosition(personId, titleElement);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } finally {
            // 无论如何都要重置状态
            isBatchFetching = false;
            btn.textContent = '获取职位';
            btn.classList.remove('fetching');
        }
    };

    // 获取新关联职位 - 修复暂停功能
    const fetchNewPositions = async btn => {
        // 如果正在查询，就停止
        if (isBatchFetching) {
            stopBatchFetch = true;
            return;
        }

        // 开始新的查询
        isBatchFetching = true;
        stopBatchFetch = false;
        btn.classList.add('fetching');
        btn.textContent = '获取中... (点击停止)';

        try {
            const items = document.querySelectorAll('#crtRelateSubjects > li:not(.old)');

            for (const item of items) {
                // 检查是否需要停止
                if (stopBatchFetch) break;

                const titleElement = item.querySelector('p.title');
                if (!titleElement) continue;

                removeSingleButton(titleElement);

                const link = titleElement.querySelector('a.l');
                if (!link) continue;

                const personId = getPersonId(link);
                if (!personId) continue;

                if (titleElement.querySelector('.position-tags')) continue;

                await fetchPersonPosition(personId, titleElement);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } finally {
            // 无论如何都要重置状态
            isBatchFetching = false;
            btn.textContent = '获取新关联职位';
            btn.classList.remove('fetching');
        }
    };

    // 初始化脚本
    const init = () => {
        const editSummary = document.getElementById('editSummary');
        if (!editSummary) return;

        let container = editSummary.closest('.clearit');
        if (!container) return;

        // 添加辅助按钮容器
        container.appendChild(createHelperContainer());

        // 绑定批量查询事件 - 使用更可靠的事件处理
        document.getElementById('fetchPositions').addEventListener('click', e => {
            e.preventDefault();
            fetchAllPositions(e.target);
        });

        // 绑定新关联职位查询事件
        document.getElementById('fetchNewPositions').addEventListener('click', e => {
            e.preventDefault();
            fetchNewPositions(e.target);
        });

        // 为初始人物添加查询按钮
        document.querySelectorAll('#crtRelateSubjects > li').forEach(addSingleQueryBtn);
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 监听新添加的人物条目
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                const fetchBtn = document.getElementById('fetchPositions');

                // 批量查询中添加的新条目自动查询
                if (fetchBtn?.classList.contains('fetching') && isBatchFetching && !stopBatchFetch) {
                    const lastItem = [...document.querySelectorAll('#crtRelateSubjects > li')].pop();
                    if (lastItem) {
                        const titleElement = lastItem.querySelector('p.title');
                        if (titleElement) {
                            removeSingleButton(titleElement);
                            const link = titleElement.querySelector('a.l');
                            if (link) {
                                const personId = getPersonId(link);
                                if (personId) {
                                    fetchPersonPosition(personId, titleElement);
                                }
                            }
                        }
                    }
                }

                // 为新添加的条目添加查询按钮
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'LI' && node.parentElement.id === 'crtRelateSubjects') {
                        addSingleQueryBtn(node);
                    }
                });
            }
        });
    });

    // 启动观察器
    const crtRelateSubjects = document.getElementById('crtRelateSubjects');
    if (crtRelateSubjects) {
        observer.observe(crtRelateSubjects, { childList: true });
    }
})();
