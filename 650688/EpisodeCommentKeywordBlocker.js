// ==UserScript==
// @name         单集评论区关键词屏蔽
// @version      2.2
// @icon         https://bgm.tv/img/favicon.ico
// @description  Bangumi单集评论区中屏蔽带关键词的楼层、楼中楼及回复。
// @author       icesword95、国见佐彩
// @license      MIT
// @match        *bgm.tv/ep/*
// @match        *bangumi.tv/ep/*
// @match        *chii.in/ep/*
// ==/UserScript==

(function () {
    'use strict';
    
    // 防抖函数，避免频繁操作
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const style = document.createElement('style');
    style.textContent = `
        .kw-panel {
            margin: 20px 0;
            padding: 12px;
            border-top: 1px solid transparent; /* 改为透明 */
            font-size: 14px;
        }

        .kw-title {
            color: #555;
            margin-bottom: 8px;
            display: inline-block;
        }

        .kw-tag {
            display: inline-flex;
            align-items: center;
            background: transparent;
            border: 1px solid rgba(204, 204, 204, 0.7);
            border-radius: 16px;
            padding: 2px 10px;
            margin: 4px 6px 4px 0;
            font-size: 13px;
            cursor: default;
        }

        .kw-tag:hover {
            background: rgba(234, 234, 240, 0.5);
        }

        .kw-tag-remove {
            font-weight: bold;
            margin-left: 6px;
            cursor: pointer;
            color: #777;
        }

        .kw-tag-remove:hover {
            color: #222;
        }

        .kw-input {
            width: 240px;
            padding: 6px 8px;
            border-radius: 6px;
            border: 1px solid rgba(204, 204, 204, 0.7);
            margin-right: 8px;
            font-size: 13px;
            background: transparent;
        }

        .kw-save-btn {
            padding: 6px 14px;
            border-radius: 6px;
            background: transparent;
            border: 1px solid rgba(204, 204, 204, 0.7);
            cursor: pointer;
            font-size: 13px;
        }

        .kw-save-btn:hover {
            background: rgba(230, 230, 230, 0.5);
        }

        /* 使用CSS类来隐藏，性能更好 */
        .kw-hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    /*** ------------------------------------------
     *  数据存储
     * ------------------------------------------ ***/
    const STORAGE_KEY = 'bgm_ep_filter_keywords';

    function loadKeywords() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        return ['原作', '奶龙', '改', '删']; // 默认关键词
    }

    function saveKeywords(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    /*** ------------------------------------------
     *  判断内容中是否包含关键词 - 增强版
     * ------------------------------------------ ***/
    function containsKeyword(element, keywords) {
        if (!element) return false;
        
        // 检查文本内容
        const textContent = element.innerText || element.textContent || '';
        if (keywords.some(k => k && textContent.includes(k))) {
            return true;
        }
        
        // 检查img标签的alt属性（用于表情包）
        const images = element.querySelectorAll('img');
        for (const img of images) {
            const altText = img.getAttribute('alt') || '';
            if (keywords.some(k => k && altText.includes(k))) {
                return true;
            }
        }
        
        return false;
    }

    /*** ------------------------------------------
     *  创建关键词标签按钮
     * ------------------------------------------ ***/
    function renderKeywordTags(container, keywords, onRemove) {
        container.innerHTML = '';

        keywords.forEach(kw => {
            const tag = document.createElement('div');
            tag.className = 'kw-tag';
            tag.innerHTML = `
                <span>${kw}</span>
                <span class="kw-tag-remove" data-k="${kw}">×</span>
            `;
            container.appendChild(tag);
        });

        container.querySelectorAll('.kw-tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const kw = btn.getAttribute('data-k');
                onRemove(kw);
            });
        });
    }

    /*** ------------------------------------------
     *  优化的过滤逻辑 - 使用CSS类和批量操作
     * ------------------------------------------ ***/
    function filterComments(keywords) {
        const commentList = document.getElementById('comment_list');
        if (!commentList) return;

        // 使用requestAnimationFrame避免阻塞UI
        requestAnimationFrame(() => {
            const topComments = commentList.querySelectorAll('.row_reply');
            
            // 批量处理，避免频繁重排
            topComments.forEach(comment => {
                const mainContent = comment.querySelector('.message.clearit');
                const shouldHide = mainContent && containsKeyword(mainContent, keywords);
                
                if (shouldHide) {
                    comment.classList.add('kw-hidden');
                } else {
                    comment.classList.remove('kw-hidden');
                    // 处理子回复
                    const replies = comment.querySelectorAll('.sub_reply_bg');
                    replies.forEach(reply => {
                        const subContent = reply.querySelector('.cmt_sub_content');
                        if (subContent && containsKeyword(subContent, keywords)) {
                            reply.classList.add('kw-hidden');
                        } else {
                            reply.classList.remove('kw-hidden');
                        }
                    });
                }
            });
        });
    }

    // 防抖的过滤函数
    const debouncedFilter = debounce(filterComments, 100);

    /*** ------------------------------------------
     *  轻量级的DOM变化监听
     * ------------------------------------------ ***/
    function setupLightweightObserver() {
        const commentList = document.getElementById('comment_list');
        if (!commentList) return;

        // 使用更高效的MutationObserver配置
        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            for (const mutation of mutations) {
                // 只关注hidden属性变化和子节点变化
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'hidden' || mutation.attributeName === 'style')) {
                    // 检查是否是其他脚本在操作显示状态
                    const target = mutation.target;
                    if (target.classList.contains('row_reply') || target.classList.contains('sub_reply_bg')) {
                        needsUpdate = true;
                        break;
                    }
                } else if (mutation.type === 'childList') {
                    // 如果有新的评论添加
                    needsUpdate = true;
                    break;
                }
            }
            
            if (needsUpdate) {
                const keywords = loadKeywords();
                debouncedFilter(keywords);
            }
        });

        // 只监听必要的属性
        observer.observe(commentList, {
            attributes: true,
            attributeFilter: ['hidden', 'style'],
            childList: true,
            subtree: true
        });

        return observer;
    }

    /*** ------------------------------------------
     *  控制面板 UI
     * ------------------------------------------ ***/
    function addControlPanel(onChange) {
        const commentList = document.getElementById('comment_list');
        if (!commentList) return;

        const panel = document.createElement('div');
        panel.className = 'kw-panel';
        panel.innerHTML = `
            <span class="kw-title">屏蔽关键词：</span>
            <div id="kwTagBox"></div>
            <div style="margin-top:8px;">
                <input id="kwInput" type="text" class="kw-input" placeholder="输入关键词后回车添加" />
                <button id="kwSaveBtn" class="kw-save-btn">保存</button>
            </div>
        `;
        commentList.appendChild(panel);

        const kwBox = panel.querySelector('#kwTagBox');
        const input = panel.querySelector('#kwInput');
        const saveButton = panel.querySelector('#kwSaveBtn');

        let keywords = loadKeywords();
        renderKeywordTags(kwBox, keywords, removeKeyword);

        function removeKeyword(kw) {
            keywords = keywords.filter(k => k !== kw);
            saveKeywords(keywords);
            renderKeywordTags(kwBox, keywords, removeKeyword);
            onChange(keywords);
        }

        /** 输入框：按下 Enter 添加关键词 */
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addKeyword();
            }
        });

        /** 输入完成后失焦也创建标签 */
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '') addKeyword();
        });

        /** 点击保存 */
        saveButton.addEventListener('click', () => {
            saveKeywords(keywords);
            onChange(keywords);
        });

        function addKeyword() {
            const val = input.value.trim();
            if (!val) return;

            const parts = val.split(/[\s,，、]+/).filter(Boolean);
            parts.forEach(p => {
                if (!keywords.includes(p)) keywords.push(p);
            });

            input.value = '';
            saveKeywords(keywords);
            renderKeywordTags(kwBox, keywords, removeKeyword);
            onChange(keywords);
        }
    }

    function start() {
        const keywords = loadKeywords();
        filterComments(keywords);

        addControlPanel((newKeywords) => {
            filterComments(newKeywords);
        });

        // 设置轻量级监听器
        setupLightweightObserver();
    }

    // 等待页面完全加载后再执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();