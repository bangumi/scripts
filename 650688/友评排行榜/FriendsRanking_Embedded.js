// ==UserScript==
// @name         友评排行榜
// @namespace    KunimiSaya
// @version      1.1
// @description  生成好友共同评分排行榜，支持加权评分和多种排序方式
// @author       KunimiSaya
// @match        https://bgm.tv/user/*/friends
// @match        https://bangumi.tv/user/*/friends
// @match        https://chii.in/user/*/friends
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
        .ranking-container {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
            font-size: 14px;
        }
        .ranking-controls {
            margin-bottom: 12px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
        }
        .control-group {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .control-label {
            font-weight: bold;
            white-space: nowrap;
        }
        .ranking-controls input, .ranking-controls select, .ranking-controls button {
            padding: 4px 8px;
            font-size: 14px;
        }
        .ranking-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
        }
        .ranking-table th, .ranking-table td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: left;
        }
        .ranking-table th {
            background-color: #f8f9fa;
        }
        .ranking-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .loading {
            text-align: center;
            padding: 15px;
            font-size: 14px;
        }
        .error {
            color: red;
            padding: 8px;
            font-size: 14px;
        }
        .hidden {
            display: none;
        }
        .status-info {
            margin-top: 8px;
            font-size: 13px;
        }
    `;
    document.head.appendChild(style);

    // 主函数
    function init() {
        // 获取当前用户ID
        const currentUrl = window.location.href;
        const userIdMatch = currentUrl.match(/\/user\/([^\/]+)\/friends/);
        if (!userIdMatch) return;
        
        const userId = userIdMatch[1];
        
        // 创建容器
        const container = document.createElement('div');
        container.className = 'ranking-container';
        container.innerHTML = `
            <h3>好友共同评分榜</h3>
            <div class="ranking-controls">
                <button id="generateRanking">生成评分榜</button>
                <div id="status"></div>
            </div>
            <div id="rankingResults" class="hidden">
                <div class="ranking-controls">
                    <div class="control-group">
                        <span class="control-label">加权参数m:</span>
                        <input type="number" id="mThreshold" min="0" value="1">
                    </div>
                    <div class="control-group">
                        <span class="control-label">排序方式:</span>
                        <select id="sortMethod">
                            <option value="weighted">加权评分</option>
                            <option value="average">平均分</option>
                            <option value="votes">评分人数</option>
                        </select>
                    </div>
                    <button id="updateRanking">更新排名</button>
                    <button id="filterByVotes">隐藏低人数条目</button>
                    <button id="showAll">显示所有条目</button>
                    <button id="saveToFile">保存到文件</button>
                </div>
                <div id="rankingTableContainer"></div>
            </div>
        `;
        
        // 插入到页面中
        const friendsList = document.querySelector('.user_list');
        if (friendsList) {
            friendsList.parentNode.insertBefore(container, friendsList);
        } else {
            document.body.insertBefore(container, document.body.firstChild);
        }
        
        // 添加事件监听
        document.getElementById('generateRanking').addEventListener('click', () => {
            generateRanking(userId);
        });
        
        document.getElementById('updateRanking').addEventListener('click', updateRanking);
        document.getElementById('filterByVotes').addEventListener('click', filterByVotes);
        document.getElementById('showAll').addEventListener('click', showAll);
        document.getElementById('saveToFile').addEventListener('click', saveToFile);
    }

    // 获取好友列表
    function getFriendIds(userId) {
        const friendIds = [userId]; // 包括自己
        
        const users = document.querySelectorAll('ul.usersMedium li.user a[href^="/user/"]');
        
        users.forEach(user => {
            const href = user.getAttribute('href');
            const friendId = href.substring(href.lastIndexOf('/') + 1);
            friendIds.push(friendId);
        });
        
        return friendIds;
    }

    // 获取用户评分数据
    async function fetchUserRatings(friendId) {
        const currentDomain = window.location.hostname;
        const ratings = [];
        let page = 1;
        let hasMorePages = true;
        
        while (hasMorePages) {
            const url = `https://${currentDomain}/anime/list/${friendId}/collect?orderby=rate&page=${page}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const items = doc.querySelectorAll('#browserItemList li.item');
                if (items.length === 0) {
                    hasMorePages = false;
                    break;
                }
                
                for (const item of items) {
                    try {
                        // 获取条目链接和ID
                        const link = item.querySelector('a.subjectCover[href^="/subject/"]');
                        const ratingElement = item.querySelector('span.starstop-s > span.starlight');
                        
                        if (ratingElement && link) {
                            const href = link.getAttribute('href');
                            const entryId = href.substring(href.lastIndexOf('/') + 1);
                            
                            // 修正：正确解析条目名称
                            const innerDiv = item.querySelector('.inner');
                            let title = '';
                            let subTitle = '';
                            
                            if (innerDiv) {
                                const h3 = innerDiv.querySelector('h3');
                                if (h3) {
                                    // 获取中文名称（第一个a标签）
                                    const titleLink = h3.querySelector('a.l');
                                    if (titleLink) {
                                        title = titleLink.textContent.trim();
                                    }
                                    
                                    // 获取原名（small.grey标签）
                                    const subTitleElement = h3.querySelector('small.grey');
                                    if (subTitleElement) {
                                        subTitle = subTitleElement.textContent.trim();
                                    }
                                }
                            }
                            
                            const rating = extractRating(ratingElement);
                            
                            ratings.push({
                                subjectId: parseInt(entryId),
                                score: rating,
                                subjectName: subTitle || title, // 原名作为主要名称
                                subjectNameCN: title // 中文名作为副名称
                            });
                        }
                    } catch (error) {
                        console.error('解析单个条目失败:', error);
                    }
                }
                
                page++;
                
                // 添加延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`获取用户 ${friendId} 第 ${page} 页数据失败:`, error);
                hasMorePages = false;
            }
        }
        
        return ratings;
    }

    // 提取评分
    function extractRating(ratingElement) {
        const classAttribute = ratingElement.className;
        const ratingText = classAttribute.substring(classAttribute.lastIndexOf('stars') + 5);
        return parseInt(ratingText);
    }

    // 生成评分榜
    async function generateRanking(userId) {
        const statusEl = document.getElementById('status');
        statusEl.innerHTML = '<div class="loading">正在获取好友列表...</div>';
        
        try {
            // 获取好友列表
            const friendIds = getFriendIds(userId);
            statusEl.innerHTML = `<div class="loading">发现 ${friendIds.length} 位用户，正在获取评分数据...</div>`;
            
            // 获取所有用户的评分数据
            const animationMap = new Map();
            
            for (let i = 0; i < friendIds.length; i++) {
                const friendId = friendIds[i];
                statusEl.innerHTML = `<div class="loading">正在获取用户 ${i+1}/${friendIds.length} (${friendId}) 的评分数据...</div>`;
                
                try {
                    const ratings = await fetchUserRatings(friendId);
                    
                    ratings.forEach(rating => {
                        let animation = animationMap.get(rating.subjectId);
                        if (!animation) {
                            animation = {
                                subjectId: rating.subjectId,
                                subjectName: rating.subjectName,
                                subjectNameCN: rating.subjectNameCN,
                                friendRatings: new Map()
                            };
                            animationMap.set(rating.subjectId, animation);
                        }
                        animation.friendRatings.set(friendId, rating.score);
                    });
                    
                } catch (error) {
                    console.error(`处理用户 ${friendId} 数据时出错:`, error);
                }
            }
            
            // 计算平均分并排序
            const animations = calculateAndSortAverage(animationMap);
            
            // 显示结果
            displayRanking(animations);
            document.getElementById('rankingResults').classList.remove('hidden');
            statusEl.innerHTML = `<div class="status-info">数据处理完成！有效动画条目数量: ${animations.length}</div>`;
            
        } catch (error) {
            statusEl.innerHTML = `<div class="error">错误: ${error.message}</div>`;
            console.error(error);
        }
    }

    // 计算平均分并排序
    function calculateAndSortAverage(animationMap) {
        const animations = Array.from(animationMap.values());
        
        animations.forEach(animation => {
            const ratings = Array.from(animation.friendRatings.values());
            if (ratings.length > 0) {
                const sum = ratings.reduce((a, b) => a + b, 0);
                animation.averageScore = sum / ratings.length;
            } else {
                animation.averageScore = 0;
            }
        });
        
        return animations.sort((a, b) => b.averageScore - a.averageScore);
    }

    // 显示评分榜
    function displayRanking(animations) {
        // 计算全局平均分C
        let totalSum = 0;
        let totalVotes = 0;
        animations.forEach(animation => {
            totalSum += animation.averageScore * animation.friendRatings.size;
            totalVotes += animation.friendRatings.size;
        });
        const C = totalVotes > 0 ? totalSum / totalVotes : 0;
        
        // 存储数据供后续使用
        window.rankingData = {
            animations,
            C,
            // 保存原始数据，用于恢复显示
            originalAnimations: [...animations]
        };
        
        // 生成表格
        updateRanking();
    }

    // 更新排名
    function updateRanking() {
        if (!window.rankingData) return;
        
        const { animations, C } = window.rankingData;
        const m = parseInt(document.getElementById('mThreshold').value) || 0;
        const sortMethod = document.getElementById('sortMethod').value;
        
        // 计算加权分数
        animations.forEach(animation => {
            const v = animation.friendRatings.size;
            const r = animation.averageScore;
            const weighted = (v / (v + m)) * r + (m / (v + m)) * C;
            animation.weightedScore = parseFloat(weighted.toFixed(6));
        });
        
        // 排序
        let sortedAnimations;
        switch (sortMethod) {
            case 'weighted':
                sortedAnimations = [...animations].sort((a, b) => b.weightedScore - a.weightedScore);
                break;
            case 'average':
                sortedAnimations = [...animations].sort((a, b) => b.averageScore - a.averageScore);
                break;
            case 'votes':
                sortedAnimations = [...animations].sort((a, b) => b.friendRatings.size - a.friendRatings.size);
                break;
        }
        
        // 过滤可见条目
        const visibleAnimations = sortedAnimations.filter(animation => 
            !animation.hidden
        );
        
        // 生成表格HTML
        let tableHTML = `
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>加权排名</th>
                        <th>条目原名</th>
                        <th>中文名称</th>
                        <th>评分人数</th>
                        <th>平均分</th>
                        <th>加权分数</th>
                        <th>条目链接</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        visibleAnimations.forEach((animation, index) => {
            const currentDomain = window.location.hostname;
            
            tableHTML += `
                <tr data-id="${animation.subjectId}">
                    <td>${index + 1}</td>
                    <td>${escapeHtml(animation.subjectName)}</td>
                    <td>${escapeHtml(animation.subjectNameCN)}</td>
                    <td>${animation.friendRatings.size}</td>
                    <td>${animation.averageScore.toFixed(4)}</td>
                    <td>${animation.weightedScore.toFixed(4)}</td>
                    <td><a href="https://${currentDomain}/subject/${animation.subjectId}" target="_blank">查看详情</a></td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
            <div class="status-info">当前显示: ${visibleAnimations.length} / ${animations.length} 个条目</div>
        `;
        
        document.getElementById('rankingTableContainer').innerHTML = tableHTML;
    }

    // 隐藏低人数条目
    function filterByVotes() {
        if (!window.rankingData) return;
        
        const m = parseInt(document.getElementById('mThreshold').value) || 0;
        const { animations } = window.rankingData;
        
        animations.forEach(animation => {
            animation.hidden = animation.friendRatings.size < m;
        });
        
        updateRanking();
    }

    // 显示所有条目
    function showAll() {
        if (!window.rankingData) return;
        
        const { animations, originalAnimations } = window.rankingData;
        
        // 恢复所有条目的显示状态
        animations.length = 0;
        originalAnimations.forEach(anim => {
            anim.hidden = false;
            animations.push(anim);
        });
        
        updateRanking();
    }

    // 保存到文件
    function saveToFile() {
        if (!window.rankingData) return;
        
        const { animations, C } = window.rankingData;
        const m = parseInt(document.getElementById('mThreshold').value) || 0;
        const sortMethod = document.getElementById('sortMethod').value;
        const currentDomain = window.location.hostname;
        
        // 计算当前可见的动画
        const visibleAnimations = animations.filter(animation => !animation.hidden);
        
        // 生成CSV内容
        let csvContent = "排名,条目原名,中文名称,评分人数,平均分,加权分数,条目链接\n";
        
        visibleAnimations.forEach((animation, index) => {
            const row = [
                index + 1,
                `"${animation.subjectName.replace(/"/g, '""')}"`,
                `"${(animation.subjectNameCN || '').replace(/"/g, '""')}"`,
                animation.friendRatings.size,
                animation.averageScore.toFixed(4),
                animation.weightedScore.toFixed(4),
                `https://${currentDomain}/subject/${animation.subjectId}`
            ].join(",");
            
            csvContent += row + "\n";
        });
        
        // 添加元数据
        csvContent += `\n生成时间,${new Date().toLocaleString()}\n`;
        csvContent += `加权参数m,${m}\n`;
        csvContent += `排序方式,${sortMethod}\n`;
        csvContent += `全局平均分C,${C.toFixed(4)}\n`;
        csvContent += `条目总数,${animations.length}\n`;
        csvContent += `显示条目数,${visibleAnimations.length}\n`;
        
        // 下载文件
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bangumi_ranking_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // 辅助函数：HTML转义
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();