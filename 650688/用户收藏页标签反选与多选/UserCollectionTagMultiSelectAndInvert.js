// ==UserScript==
// @name         用户收藏页标签反选与多选
// @namespace    https://bgm.tv/
// @version      1919.1919
// @match        *://bgm.tv/*/list/*/*
// @match        *://bangumi.tv/*/list/*/*
// @match        *://chii.in/*/list/*/*
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // 存储当前反选状态
    let excludedTags = new Set();
    // 存储当前多选状态
    let includedTags = new Set();
    
    // 扩展侧栏宽度，但不要覆盖其他脚本可能设置的宽度
    function adjustSidebarWidth() {
        const sidePanel = document.querySelector('.SimpleSidePanel');
        if (sidePanel) {
            const currentWidth = sidePanel.style.width;
            // 只在宽度为190px（默认值）时调整，避免覆盖其他脚本的设置
            if (!currentWidth || currentWidth === '190px') {
                sidePanel.style.width = '280px';
            }
        }
    }
    
    // 获取条目标签
    function getItemTags(itemElement) {
        const collectInfo = itemElement.querySelector('.collectInfo');
        if (!collectInfo) return new Set();
        
        const tagSpan = collectInfo.querySelector('.tip');
        if (!tagSpan) return new Set();
        
        const text = tagSpan.textContent;
        const tagMatch = text.match(/标签:\s*(.+)/);
        if (!tagMatch) return new Set();
        
        const tags = tagMatch[1].split(/\s+/).filter(tag => tag.trim());
        return new Set(tags);
    }
    
    // 过滤条目显示
    function filterItems() {
        const items = document.querySelectorAll('#browserItemList > li');
        
        items.forEach(item => {
            const itemTags = getItemTags(item);
            
            // 检查是否有被排除的标签
            let hasExcludedTag = false;
            for (const excludedTag of excludedTags) {
                if (itemTags.has(excludedTag)) {
                    hasExcludedTag = true;
                    break;
                }
            }
            
            // 检查是否包含任意一个多选标签
            let hasAnyIncludedTag = false;
            if (includedTags.size > 0) {
                for (const includedTag of includedTags) {
                    if (itemTags.has(includedTag)) {
                        hasAnyIncludedTag = true;
                        break;
                    }
                }
            }
            
            // 显示条件：
            // 1. 没有排除标签
            // 2. 如果没有多选标签，显示所有；如果有，只显示包含任意一个多选标签的
            const shouldShow = !hasExcludedTag && 
                              (includedTags.size === 0 || hasAnyIncludedTag);
            
            item.style.display = shouldShow ? '' : 'none';
        });
    }
    
    // 更新清除所有按钮状态
    function updateClearAllButtons() {
        const clearExcludeButton = document.getElementById('clearAllExclusions');
        const clearIncludeButton = document.getElementById('clearAllInclusions');
        
        if (clearExcludeButton) {
            clearExcludeButton.style.display = excludedTags.size > 0 ? 'inline-block' : 'none';
        }
        if (clearIncludeButton) {
            clearIncludeButton.style.display = includedTags.size > 0 ? 'inline-block' : 'none';
        }
    }
    
    // 创建清除所有反选和多选按钮
    function createClearAllButtons() {
        const header = document.querySelector('.SimpleSidePanel h2');
        if (!header) return;
        
        // 创建按钮容器
        let buttonContainer = document.getElementById('clearAllButtonsContainer');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.id = 'clearAllButtonsContainer';
            buttonContainer.style.cssText = `
                margin-top: 5px;
                margin-bottom: 10px;
            `;
            header.parentNode.insertBefore(buttonContainer, header.nextSibling);
        }
        
        // 创建清除所有反选按钮
        if (!document.getElementById('clearAllExclusions')) {
            const clearExcludeButton = document.createElement('button');
            clearExcludeButton.id = 'clearAllExclusions';
            clearExcludeButton.textContent = '清空反选';
            clearExcludeButton.style.cssText = `
                margin-right: 10px;
                padding: 2px 8px;
                font-size: 12px;
                background: #e74c3c;
                color: white;
                border: 1px solid #c0392b;
                border-radius: 3px;
                cursor: pointer;
                display: none;
            `;
            
            clearExcludeButton.addEventListener('click', () => {
                excludedTags.clear();
                document.querySelectorAll('.tag-toggle-button.exclude').forEach(button => {
                    button.style.background = 'transparent';
                    button.style.color = 'inherit';
                    button.style.borderColor = 'rgba(204, 204, 204, 0.7)';
                    button.textContent = '反选';
                });
                
                filterItems();
                updateClearAllButtons();
            });
            
            buttonContainer.appendChild(clearExcludeButton);
        }
        
        // 创建清除所有多选按钮
        if (!document.getElementById('clearAllInclusions')) {
            const clearIncludeButton = document.createElement('button');
            clearIncludeButton.id = 'clearAllInclusions';
            clearIncludeButton.textContent = '清空多选';
            clearIncludeButton.style.cssText = `
                padding: 2px 8px;
                font-size: 12px;
                background: #3498db;
                color: white;
                border: 1px solid #2980b9;
                border-radius: 3px;
                cursor: pointer;
                display: none;
            `;
            
            clearIncludeButton.addEventListener('click', () => {
                includedTags.clear();
                document.querySelectorAll('.tag-toggle-button.include').forEach(button => {
                    button.style.background = 'transparent';
                    button.style.color = 'inherit';
                    button.style.borderColor = 'rgba(204, 204, 204, 0.7)';
                    button.textContent = '多选';
                });
                
                filterItems();
                updateClearAllButtons();
            });
            
            buttonContainer.appendChild(clearIncludeButton);
        }
        
        updateClearAllButtons();
    }
    
    // 获取标签名称 - 兼容"标签批量管理"脚本的版本
    function getTagName(li) {
        const a = li.querySelector('a.l');
        if (!a) return '';
        
        // 方法1：尝试获取最后一个文本节点
        const children = a.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
            if (children[i].nodeType === Node.TEXT_NODE && children[i].textContent.trim()) {
                return children[i].textContent.trim();
            }
        }
        
        // 方法2：如果上面没找到，使用整个文本内容并移除数字部分
        let tagText = a.textContent.replace(/^\d+/, '').trim();
        
        // 方法3：如果仍然为空，尝试从href中提取
        if (!tagText) {
            const href = a.getAttribute('href');
            const tagMatch = href.match(/tag=([^&]+)/);
            if (tagMatch) {
                tagText = decodeURIComponent(tagMatch[1]);
            }
        }
        
        return tagText;
    }
    
    // 为每个标签添加反选和多选按钮 - 兼容其他脚本的版本
    function enhanceTags() {
        const tagListItems = document.querySelectorAll('#userTagList li');
        tagListItems.forEach(li => {
            const tagText = getTagName(li);
            if (!tagText) return;

            // 创建按钮容器
            let buttonContainer = li.querySelector('.tag-buttons');
            if (!buttonContainer) {
                buttonContainer = document.createElement('span');
                buttonContainer.className = 'tag-buttons';
                buttonContainer.style.cssText = 'margin-left: 4px; display: inline-block;';
                
                // 兼容其他脚本：将按钮容器插入在标签链接之后，但在可能的评分信息之前
                const tagScore = li.querySelector('.tag-score');
                const tagLink = li.querySelector('a.l');
                
                if (tagScore) {
                    // 如果有评分信息，将按钮容器插入在评分信息之前
                    tagScore.before(buttonContainer);
                } else if (tagLink) {
                    // 否则直接插入在链接之后
                    tagLink.after(buttonContainer);
                } else {
                    // 如果找不到链接，插入在li的最后
                    li.appendChild(buttonContainer);
                }
            }
            
            // 创建反选按钮（如果不存在）
            if (!li.querySelector('.tag-toggle-button.exclude')) {
                const excludeBtn = document.createElement('button');
                excludeBtn.textContent = excludedTags.has(tagText) ? '取消反选' : '反选';
                excludeBtn.className = 'tag-toggle-button exclude';
                
                // 设置按钮样式 - 兼容夜间模式
                if (excludedTags.has(tagText)) {
                    // 选中状态：使用原色背景和白色文字
                    excludeBtn.style.cssText = `
                        font-size: 10px;
                        padding: 1px 4px;
                        cursor: pointer;
                        background: #e74c3c;
                        color: white;
                        border: 1px solid #c0392b;
                        border-radius: 3px;
                        margin-right: 4px;
                    `;
                } else {
                    // 未选中状态：透明背景，继承文字颜色
                    excludeBtn.style.cssText = `
                        font-size: 10px;
                        padding: 1px 4px;
                        cursor: pointer;
                        background: transparent;
                        color: inherit;
                        border: 1px solid rgba(204, 204, 204, 0.7);
                        border-radius: 3px;
                        margin-right: 4px;
                    `;
                }

                excludeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (excludedTags.has(tagText)) {
                        excludedTags.delete(tagText);
                        excludeBtn.textContent = '反选';
                        // 未选中状态：透明背景，继承文字颜色
                        excludeBtn.style.background = 'transparent';
                        excludeBtn.style.color = 'inherit';
                        excludeBtn.style.borderColor = 'rgba(204, 204, 204, 0.7)';
                    } else {
                        excludedTags.add(tagText);
                        excludeBtn.textContent = '取消反选';
                        // 选中状态：使用原色背景和白色文字
                        excludeBtn.style.background = '#e74c3c';
                        excludeBtn.style.color = 'white';
                        excludeBtn.style.borderColor = '#c0392b';
                    }
                    
                    filterItems();
                    updateClearAllButtons();
                });

                buttonContainer.appendChild(excludeBtn);
            }
            
            // 创建多选按钮（如果不存在）
            if (!li.querySelector('.tag-toggle-button.include')) {
                const includeBtn = document.createElement('button');
                includeBtn.textContent = includedTags.has(tagText) ? '取消多选' : '多选';
                includeBtn.className = 'tag-toggle-button include';
                
                // 设置按钮样式 - 兼容夜间模式
                if (includedTags.has(tagText)) {
                    // 选中状态：使用原色背景和白色文字
                    includeBtn.style.cssText = `
                        font-size: 10px;
                        padding: 1px 4px;
                        cursor: pointer;
                        background: #3498db;
                        color: white;
                        border: 1px solid #2980b9;
                        border-radius: 3px;
                    `;
                } else {
                    // 未选中状态：透明背景，继承文字颜色
                    includeBtn.style.cssText = `
                        font-size: 10px;
                        padding: 1px 4px;
                        cursor: pointer;
                        background: transparent;
                        color: inherit;
                        border: 1px solid rgba(204, 204, 204, 0.7);
                        border-radius: 3px;
                    `;
                }

                includeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (includedTags.has(tagText)) {
                        includedTags.delete(tagText);
                        includeBtn.textContent = '多选';
                        // 未选中状态：透明背景，继承文字颜色
                        includeBtn.style.background = 'transparent';
                        includeBtn.style.color = 'inherit';
                        includeBtn.style.borderColor = 'rgba(204, 204, 204, 0.7)';
                    } else {
                        includedTags.add(tagText);
                        includeBtn.textContent = '取消多选';
                        // 选中状态：使用原色背景和白色文字
                        includeBtn.style.background = '#3498db';
                        includeBtn.style.color = 'white';
                        includeBtn.style.borderColor = '#2980b9';
                    }
                    
                    filterItems();
                    updateClearAllButtons();
                });

                buttonContainer.appendChild(includeBtn);
            }
        });
        
        createClearAllButtons();
    }

    // 初始化函数
    function init() {
        adjustSidebarWidth();
        enhanceTags();
        filterItems();
    }

    // 监听页面 DOM 更新（分页后刷新标签处理）
    const observer = new MutationObserver(() => {
        enhanceTags();
        filterItems();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 初始化
    init();
})();