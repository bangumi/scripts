// ==UserScript==
// @name         Bangumi 进度置顶
// @namespace    clauses_on_top_mofeng
// @version      0.1.2
// @description  Bangumi 进度置顶
// @author       默沨
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    // ================================================================

    // 存储管理器
    const StorageManager = {

        // ========================= 存储管理器 ============================

        // 获取置顶数据
        getData() {
            const data = chiiApp.cloud_settings.get('pinned_subjects');
            return data ? JSON.parse(data) : { pinned: {}, lastCheck: 0 };
        },

        // 保存置顶数据
        saveData(data) {
            const jsonStr = JSON.stringify(data);
            chiiApp.cloud_settings.update({ 'pinned_subjects': jsonStr });
            chiiApp.cloud_settings.save();
            return;
        },

        // ========================= 置顶操作 ============================

        // 添加置顶
        addPin(subjectId) {
            const data = this.getData();
            data.pinned[subjectId] = {
                pinnedAt: Date.now(),
                lastSeen: Date.now()
            };
            this.saveData(data);
        },

        // 移除置顶
        removePin(subjectId) {
            const data = this.getData();
            delete data.pinned[subjectId];
            this.saveData(data);
        },

        // 检查是否置顶
        isPinned(subjectId) {
            const data = this.getData();
            return !!data.pinned[subjectId];
        },

        // 获取所有置顶ID
        getPinnedIds() {
            const data = this.getData();
            return Object.keys(data.pinned);
        },

        // ========================= 数据维护 ============================

        // 更新最后看到时间
        updateLastSeen(subjectIds) {
            const data = this.getData();
            const now = Date.now();
            subjectIds.forEach(id => {
                if (data.pinned[id]) {
                    data.pinned[id].lastSeen = now;
                }
            });
            this.saveData(data);
        },

        // 清理过期数据
        cleanExpired(currentListIds) {
            const data = this.getData();
            const now = Date.now();

            // 检查是否需要执行清理（每24小时一次）
            if (now - data.lastCheck < 24 * 60 * 60 * 1000) {
                return;
            }

            const expireMs = parseInt(chiiApp.cloud_settings.get('pin_cleanup_delay') || '7', 10) * 24 * 60 * 60 * 1000;
            const toRemove = [];

            Object.keys(data.pinned).forEach(id => {
                // 如果不在当前列表中，且超过过期时间
                if (!currentListIds.includes(id) && (now - data.pinned[id].lastSeen > expireMs)) {
                    toRemove.push(id);
                }
            });

            toRemove.forEach(id => delete data.pinned[id]);
            data.lastCheck = now;
            this.saveData(data);
        }
    };

    // ================================================================

    // UI 管理器
    const UIManager = {

        // ========================= 角标样式 ============================

        // 添加角标样式
        injectPinStylesForList() {
            const style = document.createElement('style');
            style.id = 'pin-styles-list';
            style.textContent = `
                /* 置顶角标样式 */
                /*
                #prgSubjectList li.pinned-item {
                    position: relative;
                }
                #prgSubjectList li.pinned-item::before {
                    content: '📌';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    font-size: 12px;
                    z-index: 10;
                    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
                }
                */

                #prgSubjectList li.pinned-item {
                    position: relative;
                }
                #prgSubjectList li.pinned-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 0;
                    height: 0;
                    border-top: 8px solid #f09199;
                    border-right: 8px solid transparent;
                    z-index: 10;
                    border-top-left-radius: 2px;
                }
            `;
            document.head.appendChild(style);
        },

        injectPinStylesForPanel() {
            const style = document.createElement('style');
            style.id = 'pin-styles-panel'; // 添加ID便于后续管理
            style.textContent = `
                /* Info 面板置顶标记 */
                .infoWrapper.pinned-panel.tinyMode {
                    position: relative;
                }
                .infoWrapper.pinned-panel.tinyMode::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 0;
                    height: 0;
                    border-top: 12px solid #f09199;
                    border-right: 12px solid transparent;
                    z-index: 10;
                }
            `;
            document.head.appendChild(style);
        },

        // ========================= 置顶功能 ============================

        // 重新排序列表
        reorderList() {
            const list = document.getElementById('prgSubjectList');
            if (!list) return;

            const items = Array.from(list.children);
            const pinnedIds = StorageManager.getPinnedIds();

            // 分离置顶和非置顶项目
            const pinnedItems = [];
            const normalItems = [];

            items.forEach(item => {
                // 检查是否是条目元素（有 subject_type 属性）
                if (item.hasAttribute('subject_type')) {
                    const link = item.querySelector('a[subject_id]');
                    if (link) {
                        const subjectId = link.getAttribute('subject_id');
                        if (pinnedIds.includes(subjectId)) {
                            pinnedItems.push(item);
                            item.classList.add('pinned-item');
                        } else {
                            normalItems.push(item);
                            item.classList.remove('pinned-item');
                        }
                    } else {
                        normalItems.push(item);
                    }
                } else {
                    // 分隔符或其他元素，保持在普通列表中
                    normalItems.push(item);
                }
            });

            // 重新插入：先置顶项，最后普通项
            const fragment = document.createDocumentFragment();
            pinnedItems.forEach(item => fragment.appendChild(item));
            normalItems.forEach(item => fragment.appendChild(item));
            list.appendChild(fragment);
        },

        // 重新排序 #cloumnSubjectInfo 中的面板列表
        reorderInfoPanels() {
            const infoContainer = document.getElementById('cloumnSubjectInfo');
            if (!infoContainer) return;

            const pinnedIds = StorageManager.getPinnedIds();

            // 获取所有 infoWrapperContainer
            const containers = infoContainer.querySelectorAll('.infoWrapperContainer');

            containers.forEach(container => {
                const panels = Array.from(container.querySelectorAll('.infoWrapper'));
                if (panels.length === 0) return;

                // 分类面板
                const pinnedPanels = [];
                const normalPanels = [];

                panels.forEach(panel => {
                    const subjectId = panel.id.replace('subjectPanel_', '');
                    if (pinnedIds.includes(subjectId)) {
                        pinnedPanels.push(panel);
                        panel.classList.add('pinned-panel');
                    } else {
                        normalPanels.push(panel);
                        panel.classList.remove('pinned-panel');
                    }
                });

                // 重新插入：先置顶项
                const fragment = document.createDocumentFragment();
                pinnedPanels.forEach(panel => fragment.appendChild(panel));
                normalPanels.forEach(panel => fragment.appendChild(panel));
                container.appendChild(fragment);
            });
        },

        reorder() {
            if (chiiApp.cloud_settings.get('pin_range') === 'all' || chiiApp.cloud_settings.get('pin_range') === 'normal') {
                this.reorderList();
            }

            if (chiiApp.cloud_settings.get('pin_range') === 'all' || chiiApp.cloud_settings.get('pin_range') === 'tiny') {
                this.reorderInfoPanels();
            }
        },

        // ========================= 置顶按钮 ============================

        // 根据样式类型获取按钮文本
        getButtonText(isPinned, withBrackets) {
            if (withBrackets) {
                return isPinned ? '[取消置顶]' : '[置顶]';
            } else {
                return isPinned ? '取消置顶' : '置顶';
            }
        },

        // 创建置顶按钮
        createPinButton(subjectId, isPinned, withBrackets) {
            const btn = document.createElement('a');
            btn.href = 'javascript:void(0);';
            btn.className = 'l pin-toggle-btn';
            btn.textContent = this.getButtonText(isPinned, withBrackets);
            btn.dataset.subjectId = subjectId;
            btn.dataset.withBrackets = withBrackets ? 'true' : 'false';

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePin(subjectId, btn);
            });

            return btn;
        },

        // 切换置顶状态
        togglePin(subjectId, btn) {
            const isPinned = StorageManager.isPinned(subjectId);
            const withBrackets = btn.dataset.withBrackets === 'true';

            if (isPinned) {
                StorageManager.removePin(subjectId);
                btn.textContent = this.getButtonText(false, withBrackets);
            } else {
                StorageManager.addPin(subjectId);
                btn.textContent = this.getButtonText(true, withBrackets);
            }

            // 重新排序列表
            this.reorder();
        },

        // 同步所有 subject 的按钮状态
        syncButtonStates(subjectId, isPinned) {
            const buttons = document.querySelectorAll(`.pin-toggle-btn[data-subject-id="${subjectId}"]`);

            buttons.forEach(btn => {
                const withBrackets = btn.dataset.withBrackets === 'true';
                btn.textContent = this.getButtonText(isPinned, withBrackets);
            });
        },

        // 为信息面板添加置顶按钮
        addPinButtons() {
            const infoWrappers = document.querySelectorAll('#cloumnSubjectInfo .infoWrapper');

            // 一次性获取所有置顶 ID，避免多次调用
            const pinnedIds = StorageManager.getPinnedIds();

            infoWrappers.forEach(wrapper => {
                // 获取 subject_id
                const subjectId = wrapper.id.replace('subjectPanel_', '');
                if (!subjectId) return;

                const isPinned = pinnedIds.includes(subjectId);

                // 处理 blockMode 中的 [edit] 链接（带方括号样式）
                const headerEditLink = wrapper.querySelector('.header .progress_percent_text a.thickbox');
                if (headerEditLink) {
                    if (headerEditLink.parentNode.querySelector('.pin-toggle-btn')) {
                        this.syncButtonStates(subjectId, isPinned);
                        return;
                    }
                    if (chiiApp.cloud_settings.get('pin_button_display') === 'default') {
                        const spacer = document.createElement('span');
                        spacer.className = 'link-spacer';
                        spacer.textContent = ' ';
                        headerEditLink.parentNode.appendChild(spacer);
                    }
                    const btn = this.createPinButton(subjectId, isPinned, true);
                    headerEditLink.parentNode.appendChild(btn);
                }

                if (chiiApp.cloud_settings.get('pin_button_style') === 'default') {
                    // 处理 tinyHeader 中的 edit 链接（不带方括号样式）
                    const tinyHeaderEditLink = wrapper.querySelector('.tinyHeader .progress_percent_text a.thickbox');
                    if (tinyHeaderEditLink) {
                        if (tinyHeaderEditLink.parentNode.querySelector('.pin-toggle-btn')) {
                            this.syncButtonStates(subjectId, isPinned);
                            return;
                        }
                        if (chiiApp.cloud_settings.get('pin_button_display') === 'default') {
                            const spacer = document.createElement('span');
                            spacer.className = 'link-spacer';
                            spacer.textContent = ' ';
                            tinyHeaderEditLink.parentNode.appendChild(spacer);
                        }
                        const btn = this.createPinButton(subjectId, isPinned, false);
                        tinyHeaderEditLink.parentNode.appendChild(btn);
                    }
                }
            });
        },

        // ========================= 辅助功能 ============================

        // 获取当前列表中的所有 subject ID
        getCurrentListIds() {
            const list = document.getElementById('prgSubjectList');
            if (!list) return [];

            const ids = [];
            list.querySelectorAll('li[subject_type] a[subject_id]').forEach(link => {
                const id = link.getAttribute('subject_id');
                if (id && !ids.includes(id)) {
                    ids.push(id);
                }
            });
            return ids;
        }
    };

    // ================================================================

    // 主函数
    function init() {
        if (!chiiApp.cloud_settings.get('pin_feature_intro_shown')) {
            setTimeout(() => {
                alert('【本信息仅首次显示】\n\n首页收藏箱条目置顶功能已启用！\n\n点击条目信息中的[置顶]按钮可以将条目固定在顶部。\n\n置顶的条目存储在云端，支持多端同步。\n\n个性化设置可在"首页收藏箱条目置顶"选项卡中调整。');
                chiiApp.cloud_settings.update({ 'pin_feature_intro_shown': true });
                chiiApp.cloud_settings.save();
            }, 500);
        }

        // =====================================================

        // 检查是否在正确的页面
        const list = document.getElementById('prgSubjectList');
        const infoContainer = document.getElementById('cloumnSubjectInfo');

        if (!list && !infoContainer) return;

        // ========================= 初始化默认设置 ============================

        // 初始化默认设置
        if (!chiiApp.cloud_settings.get('pin_range')) {
            chiiApp.cloud_settings.update({ 'pin_range': 'all' });
        }
        if (!chiiApp.cloud_settings.get('pin_badge_display')) {
            chiiApp.cloud_settings.update({ 'pin_badge_display': 'default' });
        }
        if (!chiiApp.cloud_settings.get('pin_button_display')) {
            chiiApp.cloud_settings.update({ 'pin_button_display': 'default' });
        }
        if (!chiiApp.cloud_settings.get('pin_button_style')) {
            chiiApp.cloud_settings.update({ 'pin_button_style': 'default' });
        }
        if (!chiiApp.cloud_settings.get('pin_cleanup_delay')) {
            chiiApp.cloud_settings.update({ 'pin_cleanup_delay': '7' });
        }
        chiiApp.cloud_settings.save();

        // ========================= 添加配置面板 ============================

        chiiLib.ukagaka.addPanelTab({
            tab: 'clauses_on_top',
            label: '首页条目置顶',
            type: 'options',
            config: [
                {
                    title: '置顶条目起效范围',
                    name: 'pin_range',
                    type: 'radio',
                    defaultValue: 'all',
                    getCurrentValue: function () { return chiiApp.cloud_settings.get('pin_range') || 'all'; },
                    onChange: function (value) { chiiApp.cloud_settings.update({ 'pin_range': value }); chiiApp.cloud_settings.save(); },
                    options: [
                        { value: 'all', label: '列表+平铺模式' },
                        { value: 'normal', label: '列表模式' },
                        { value: 'tiny', label: '平铺模式' }
                    ]
                },
                {
                    title: '置顶项角标显示',
                    name: 'pin_badge_display',
                    type: 'radio',
                    defaultValue: 'default',
                    getCurrentValue: function () { return chiiApp.cloud_settings.get('pin_badge_display') || 'default'; },
                    onChange: function (value) { chiiApp.cloud_settings.update({ 'pin_badge_display': value }); chiiApp.cloud_settings.save(); },
                    options: [
                        { value: 'default', label: '显示' },
                        { value: 'normal', label: '仅列表显示' },
                        { value: 'none', label: '隐藏' }
                    ]
                },
                {
                    title: '置顶按钮样式',
                    name: 'pin_button_display',
                    type: 'radio',
                    defaultValue: 'default',
                    getCurrentValue: function () { return chiiApp.cloud_settings.get('pin_button_display') || 'default'; },
                    onChange: function (value) { chiiApp.cloud_settings.update({ 'pin_button_display': value }); chiiApp.cloud_settings.save(); },
                    options: [
                        { value: 'default', label: '宽松' },
                        { value: 'compact', label: '紧凑' }
                    ]
                },
                {
                    title: '置顶按钮显示（不影响已经置顶的条目）',
                    name: 'pin_button_style',
                    type: 'radio',
                    defaultValue: 'default',
                    getCurrentValue: function () { return chiiApp.cloud_settings.get('pin_button_style') || 'default'; },
                    onChange: function (value) { chiiApp.cloud_settings.update({ 'pin_button_style': value }); chiiApp.cloud_settings.save(); },
                    options: [
                        { value: 'default', label: '显示' },
                        { value: 'normal', label: '仅列表显示' },
                        { value: 'none', label: '隐藏' }
                    ]
                },
                {
                    title: '非在看条目清理延迟时间',
                    name: 'pin_cleanup_delay',
                    type: 'radio',
                    defaultValue: '7',
                    getCurrentValue: function () { return chiiApp.cloud_settings.get('pin_cleanup_delay') || '7'; },
                    onChange: function (value) { chiiApp.cloud_settings.update({ 'pin_cleanup_delay': value }); chiiApp.cloud_settings.save(); },
                    options: [
                        { value: '1', label: '1天' },
                        { value: '7', label: '7天' },
                        { value: '14', label: '14天' },
                        { value: '30', label: '30天' },
                    ]
                }
            ]
        });

        // ========================= 执行核心功能 ============================

        // 注入角标样式
        if (chiiApp.cloud_settings.get('pin_badge_display') === 'default') {
            UIManager.injectPinStylesForList();
            UIManager.injectPinStylesForPanel();
        } else if (chiiApp.cloud_settings.get('pin_badge_display') === 'normal') {
            UIManager.injectPinStylesForList();
        }

        // 获取当前列表 ID
        const currentIds = UIManager.getCurrentListIds();

        // 更新最后看到时间
        StorageManager.updateLastSeen(currentIds);
        StorageManager.cleanExpired(currentIds);

        // 重新排序列表
        UIManager.reorder();

        // 添加置顶按钮
        if (chiiApp.cloud_settings.get('pin_button_style') !== 'none') {
            UIManager.addPinButtons();
        }

        if (chiiApp.cloud_settings.get('pin_range') !== 'tiny') {
            if (document.querySelector('#prgManagerHeader #prgManagerMode .focus')?.id === "switchNormalManager") {
                document.querySelector('#prgManagerMain #prgSubjectList [class~="clearit"]:not([class~="hidden"]) a.subjectItem.title.textTip')?.click();
            }
        }
    }

    // ================================================================

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
