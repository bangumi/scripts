// ==UserScript==
// @name         Bangumi目录收藏状态批量修改工具
// @namespace    https://github.com/liang0721gs/bangumi-batch-update
// @version      1.5.0
// @description  在Bangumi目录页面批量修改动画、书籍、音乐等条目的收藏状态（含删除功能）
// @author       liang0721gs
// @homepage     https://github.com/liang0721gs/bangumi-batch-update
// @supportURL   https://github.com/liang0721gs/bangumi-batch-update/issues
// @match        https://bgm.tv/index/*
// @match        https://bangumi.tv/index/*
// @match        http://bgm.tv/index/*
// @match        http://bangumi.tv/index/*
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #batch-edit-float-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #3498db;
            color: white;
            border: none;
            font-size: 16px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        #batch-edit-float-btn:hover {
            background: #2980b9;
            transform: scale(1.1);
        }
        
        /* 控制面板 */
        .batch-edit-container {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 320px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 9998;
            padding: 20px;
            display: none;
        }
        
        .batch-edit-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .batch-edit-title {
            font-weight: bold;
            font-size: 16px;
            color: #2c3e50;
        }
        
        .close-batch-panel {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #7f8c8d;
        }
        
        /* 分类控制 */
        .batch-controls {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .category-control label {
            display: block;
            margin-bottom: 5px;
            font-size: 13px;
            color: #34495e;
            font-weight: 500;
        }
        
        .category-control select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: white;
            font-size: 13px;
        }
        
        /* 按钮区域 */
        .batch-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        
        .batch-button {
            padding: 10px;
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            font-weight: 500;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: all 0.2s;
        }
        
        .batch-button:hover {
            opacity: 0.9;
            transform: translateY(-2px);
        }
        
        .batch-button.update {
            background: #2ecc71;
        }
        
        .batch-button.delete {
            background: #e74c3c;
        }
        
        .batch-button.select {
            background: #3498db;
        }
        
        .batch-button.cancel {
            background: #95a5a6;
        }
        
        /* 全选区域 */
        .select-all-container {
            display: flex;
            align-items: center;
            padding-top: 10px;
            border-top: 1px dashed #ddd;
            margin-top: 10px;
        }
        
        /* 处理中遮罩 */
        .batch-processing {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            color: white;
            flex-direction: column;
        }
        
        .processing-spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* 条目复选框 */
        .batch-checkbox {
            margin-right: 10px;
            cursor: pointer;
        }
        
        /* 删除确认对话框 */
        .confirmation-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 10px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 5px 25px rgba(0,0,0,0.3);
            display: none;
            width: 300px;
            text-align: center;
        }
        
        .confirmation-text {
            margin-bottom: 20px;
            line-height: 1.5;
            color: #2c3e50;
        }
        
        .confirmation-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        
        .confirm-btn {
            padding: 8px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .confirm-btn.yes {
            background: #e74c3c;
            color: white;
        }
        
        .confirm-btn.no {
            background: #bdc3c7;
            color: #2c3e50;
        }
    `);

    const STATUS_MAP = {
        'anime': {
            '想看': 'wish',
            '看过': 'collect',
            '在看': 'do',
            '搁置': 'on_hold',
            '抛弃': 'dropped'
        },
        'book': {
            '想读': 'wish',
            '读过': 'collect',
            '在读': 'do',
            '搁置': 'on_hold',
            '抛弃': 'dropped'
        },
        'music': {
            '想听': 'wish',
            '听过': 'collect',
            '在听': 'do',
            '搁置': 'on_hold',
            '抛弃': 'dropped'
        },
        'game': {
            '想玩': 'wish',
            '玩过': 'collect',
            '在玩': 'do',
            '搁置': 'on_hold',
            '抛弃': 'dropped'
        },
        'real': {
            '想看': 'wish',
            '看过': 'collect',
            '在看': 'do',
            '搁置': 'on_hold',
            '抛弃': 'dropped'
        }
    };

    // 创建UI元素
    function createUI() {
        // 添加浮动按钮
        const floatBtn = document.createElement('button');
        floatBtn.id = 'batch-edit-float-btn';
        floatBtn.textContent = '批';
        floatBtn.title = '批量编辑条目状态';
        document.body.appendChild(floatBtn);

        // 添加控制面板
        const panel = document.createElement('div');
        panel.className = 'batch-edit-container';
        panel.id = 'batch-edit-panel';
        panel.innerHTML = `
            <div class="batch-edit-header">
                <div class="batch-edit-title">批量编辑</div>
                <button class="close-batch-panel" title="关闭">&times;</button>
            </div>
            <div class="batch-controls">
                <div class="category-control">
                    <label for="anime-status">动画</label>
                    <select id="anime-status">
                        <option value="">保持原状</option>
                        <option value="想看">想看</option>
                        <option value="看过">看过</option>
                        <option value="在看">在看</option>
                        <option value="搁置">搁置</option>
                        <option value="抛弃">抛弃</option>
                    </select>
                </div>
                <div class="category-control">
                    <label for="book-status">书籍</label>
                    <select id="book-status">
                        <option value="">保持原状</option>
                        <option value="想读">想读</option>
                        <option value="读过">读过</option>
                        <option value="在读">在读</option>
                        <option value="搁置">搁置</option>
                        <option value="抛弃">抛弃</option>
                    </select>
                </div>
                <div class="category-control">
                    <label for="music-status">音乐</label>
                    <select id="music-status">
                        <option value="">保持原状</option>
                        <option value="想听">想听</option>
                        <option value="听过">听过</option>
                        <option value="在听">在听</option>
                        <option value="搁置">搁置</option>
                        <option value="抛弃">抛弃</option>
                    </select>
                </div>
                <div class="category-control">
                    <label for="game-status">游戏</label>
                    <select id="game-status">
                        <option value="">保持原状</option>
                        <option value="想玩">想玩</option>
                        <option value="玩过">玩过</option>
                        <option value="在玩">在玩</option>
                        <option value="搁置">搁置</option>
                        <option value="抛弃">抛弃</option>
                    </select>
                </div>
            </div>
            <div class="batch-buttons">
                <button class="batch-button select" id="select-all">
                    <i class="fas fa-check-square"></i> 全选
                </button>
                <button class="batch-button select" id="select-none">
                    <i class="fas fa-times-circle"></i> 取消
                </button>
                <button class="batch-button update" id="apply-batch">
                    <i class="fas fa-sync-alt"></i> 更新状态
                </button>
                <button class="batch-button delete" id="delete-batch">
                    <i class="fas fa-trash-alt"></i> 删除条目
                </button>
            </div>
            <div class="select-all-container">
                <input type="checkbox" id="toggle-all" checked>
                <label for="toggle-all">全选本页</label>
            </div>
        `;
        document.body.appendChild(panel);

        // 添加处理遮罩
        const processing = document.createElement('div');
        processing.className = 'batch-processing';
        processing.id = 'batch-processing';
        processing.innerHTML = `
            <div class="processing-spinner"></div>
            <div id="processing-text">处理中: 0/0</div>
        `;
        document.body.appendChild(processing);

        // 添加删除确认对话框
        const confirmation = document.createElement('div');
        confirmation.className = 'confirmation-dialog';
        confirmation.id = 'delete-confirmation';
        confirmation.innerHTML = `
            <div class="confirmation-text">
                <i class="fas fa-exclamation-triangle" style="color:#e74c3c;font-size:24px;margin-bottom:10px;"></i>
                <div>确定要删除选中的 <span id="delete-count">0</span> 个条目吗？</div>
                <div style="font-size:13px;margin-top:10px;color:#7f8c8d;">此操作不可撤销！</div>
            </div>
            <div class="confirmation-buttons">
                <button class="confirm-btn yes" id="confirm-delete">确认删除</button>
                <button class="confirm-btn no" id="cancel-delete">取消</button>
            </div>
        `;
        document.body.appendChild(confirmation);

        addCheckboxesToItems();
        setupEventListeners();
    }

    // 添加复选框到每个条目
    function addCheckboxesToItems() {
        const items = document.querySelectorAll('#browserItemList .item, .browserItemList .item');

        items.forEach(item => {
            if (item.querySelector('.batch-checkbox')) return;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'batch-checkbox';
            checkbox.checked = true;

            const header = item.querySelector('h3');
            if (header) {
                header.insertBefore(checkbox, header.firstChild);
            } else {
                item.insertBefore(checkbox, item.firstChild);
            }
        });
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 浮动按钮点击事件
        document.getElementById('batch-edit-float-btn').addEventListener('click', function() {
            const panel = document.getElementById('batch-edit-panel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });

        // 关闭面板按钮
        document.querySelector('.close-batch-panel').addEventListener('click', function() {
            document.getElementById('batch-edit-panel').style.display = 'none';
        });

        // 全选按钮
        document.getElementById('select-all').addEventListener('click', function() {
            document.querySelectorAll('.batch-checkbox').forEach(cb => cb.checked = true);
            document.getElementById('toggle-all').checked = true;
        });

        // 取消全选按钮
        document.getElementById('select-none').addEventListener('click', function() {
            document.querySelectorAll('.batch-checkbox').forEach(cb => cb.checked = false);
            document.getElementById('toggle-all').checked = false;
        });

        // 全选本页切换
        document.getElementById('toggle-all').addEventListener('change', function() {
            document.querySelectorAll('.batch-checkbox').forEach(cb => cb.checked = this.checked);
        });

        // 更新状态按钮
        document.getElementById('apply-batch').addEventListener('click', applyBatchChanges);

        // 删除条目按钮
        document.getElementById('delete-batch').addEventListener('click', function() {
            const selected = document.querySelectorAll('.batch-checkbox:checked');
            if (selected.length === 0) {
                alert('请至少选择一个条目！');
                return;
            }

            document.getElementById('delete-count').textContent = selected.length;
            document.getElementById('delete-confirmation').style.display = 'block';
        });

        // 确认删除按钮
        document.getElementById('confirm-delete').addEventListener('click', deleteSelectedItems);

        // 取消删除按钮
        document.getElementById('cancel-delete').addEventListener('click', function() {
            document.getElementById('delete-confirmation').style.display = 'none';
        });
    }

    function getItemType(item) {
        const typeIcon = item.querySelector('.collectInfo .tip');
        if (!typeIcon) return null;

        const classes = typeIcon.className.split(' ');
        const typeClass = classes.find(cls => cls.startsWith('subject_type_'));
        if (!typeClass) return null;

        const typeMap = {
            'subject_type_1': 'anime',
            'subject_type_2': 'book',
            'subject_type_3': 'music',
            'subject_type_4': 'game',
            'subject_type_6': 'real'
        };

        return typeMap[typeClass] || 'other';
    }

    // 应用批量更改
    function applyBatchChanges() {
        const animeStatus = document.getElementById('anime-status').value;
        const bookStatus = document.getElementById('book-status').value;
        const musicStatus = document.getElementById('music-status').value;
        const gameStatus = document.getElementById('game-status').value;

        const statusConfig = {
            'anime': animeStatus,
            'book': bookStatus,
            'music': musicStatus,
            'game': gameStatus
        };

        const selectedItems = document.querySelectorAll('.batch-checkbox:checked');
        if (selectedItems.length === 0) {
            alert('请至少选择一个条目！');
            return;
        }

        // 显示处理遮罩
        const processing = document.getElementById('batch-processing');
        const processingText = document.getElementById('processing-text');
        processing.style.display = 'flex';
        processingText.textContent = `处理中: 0/${selectedItems.length}`;

        let processed = 0;
        const total = selectedItems.length;

        // 处理每个条目
        const processNext = () => {
            if (processed >= total) {
                processing.style.display = 'none';
                GM_notification({
                    title: '操作完成',
                    text: `成功更新了 ${processed} 个条目的状态！`,
                    timeout: 3000
                });
                return;
            }

            const checkbox = selectedItems[processed];
            const item = checkbox.closest('.item');
            const type = getItemType(item);

            if (type && statusConfig[type] && statusConfig[type] !== '') {
                const newStatus = statusConfig[type];
                const statusBtn = item.querySelector('.collectStatus a');

                if (statusBtn) {
                    const statusKey = STATUS_MAP[type][newStatus];
                    const subjectId = statusBtn.href.match(/subject\/(\d+)/)[1];

                    // 更新状态
                    updateStatus(subjectId, statusKey).then(() => {
                        processed++;
                        processingText.textContent = `处理中: ${processed}/${total}`;

                        // 更新UI
                        const textSpan = statusBtn.querySelector('span');
                        if (textSpan) {
                            textSpan.textContent = newStatus;
                        }

                        // 继续处理下一个
                        setTimeout(processNext, 300);
                    }).catch(() => {
                        processed++;
                        processingText.textContent = `处理中: ${processed}/${total}`;
                        setTimeout(processNext, 300);
                    });
                } else {
                    processed++;
                    processingText.textContent = `处理中: ${processed}/${total}`;
                    setTimeout(processNext, 100);
                }
            } else {
                processed++;
                processingText.textContent = `处理中: ${processed}/${total}`;
                setTimeout(processNext, 100);
            }
        };

        processNext();
    }

    // 更新状态
    function updateStatus(subjectId, status) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('referer', `https://bgm.tv/subject/${subjectId}`);

            fetch(`/subject/${subjectId}/update`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            }).then(response => {
                if (response.ok) {
                    resolve();
                } else {
                    reject();
                }
            }).catch(error => {
                reject();
            });
        });
    }

    // 删除选中条目
    function deleteSelectedItems() {
        document.getElementById('delete-confirmation').style.display = 'none';

        const selected = document.querySelectorAll('.batch-checkbox:checked');
        if (selected.length === 0) return;

        // 显示处理遮罩
        const processing = document.getElementById('batch-processing');
        const processingText = document.getElementById('processing-text');
        processing.style.display = 'flex';
        processingText.textContent = `删除中: 0/${selected.length}`;

        let deleted = 0;
        const total = selected.length;

        // 删除每个条目
        const deleteNext = () => {
            if (deleted >= total) {
                processing.style.display = 'none';
                GM_notification({
                    title: '删除完成',
                    text: `成功删除了 ${deleted} 个条目！`,
                    timeout: 3000
                });
                return;
            }

            const checkbox = selected[deleted];
            const item = checkbox.closest('.item');
            const removeForm = item.querySelector('form.remove');
            
            if (removeForm) {
                const formData = new FormData(removeForm);
                
                // 发送删除请求
                fetch(removeForm.action, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                }).then(response => {
                    if (response.ok) {
                        // 从DOM中移除
                        item.style.opacity = '0';
                        item.style.height = '0';
                        item.style.padding = '0';
                        item.style.margin = '0';
                        item.style.overflow = 'hidden';
                        item.style.transition = 'all 0.3s';
                        
                        setTimeout(() => {
                            item.remove();
                            deleted++;
                            processingText.textContent = `删除中: ${deleted}/${total}`;
                            deleteNext();
                        }, 300);
                    } else {
                        deleted++;
                        processingText.textContent = `删除中: ${deleted}/${total}`;
                        setTimeout(deleteNext, 300);
                    }
                }).catch(() => {
                    deleted++;
                    processingText.textContent = `删除中: ${deleted}/${total}`;
                    setTimeout(deleteNext, 300);
                });
            } else {
                deleted++;
                processingText.textContent = `删除中: ${deleted}/${total}`;
                setTimeout(deleteNext, 100);
            }
        };

        deleteNext();
    }

    window.addEventListener('load', function() {
        if (window.location.pathname.startsWith('/index/')) {
            createUI();
        }
    });
})();
