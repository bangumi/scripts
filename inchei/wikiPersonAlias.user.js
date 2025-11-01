// ==UserScript==
// @name         班固米人物别名本地 API
// @namespace    https://bgm.tv/
// @version      1.3
// @description  从 wiki archive 自动生成，支持远程更新和本地 .json.gz 文件导入，与其他脚本联合使用
// @author       Your Name
// @match        http*://bgm.tv/*
// @match        http*://bangumi.tv/*
// @match        http*://chii.in/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.notification
// @grant        unsafeWindow
// @connect      github.com
// @connect      api.github.com
// @connect      objects.githubusercontent.com
// @require      https://cdn.jsdmirror.com/npm/pako@2.1.0/dist/pako.min.js
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/552759
// ==/UserScript==

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        githubRepo: "inchei/bangumi-wiki-scripts",
        dbName: "bangumiPersonDB",
        storeName: "personAlias",
        dbVersion: 2,
        compressedFile: "person_alias.json.gz"
    };

    let menuCommandId;
    let dbInitialized = false;
    let fileInput = null; // 全局存储文件选择器，避免重复创建

    const normalize = name => name
      .replace(/[\s-]/g, '') // 去空格/连字符
      .replace(/[\uFF66-\uFF9D]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFBE0)) // 窄假名→平假名
      .replace(/[\uFF21-\uFF5A]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)) // 全角字母→半角
      .replace(/[\u30A1-\u30F6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)) // 全角片假名→平假名
      .toLowerCase(); // 字母统一小写

    // -------------------------- 关键修复：可见按钮触发文件选择 --------------------------
    /**
     * 创建可见的临时按钮（用户主动点击触发文件选择，规避浏览器禁用）
     * 按钮点击后自动移除，避免页面干扰
     */
    function createVisibleTriggerButton() {
        // 先移除已存在的按钮（防止重复）
        const oldBtn = document.getElementById('personAliasImportBtn');
        if (oldBtn) oldBtn.remove();

        // 创建可见按钮
        const btn = document.createElement('button');
        btn.id = 'personAliasImportBtn';
        btn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 12px 24px;
            font-size: 16px;
            background: #2c83fb;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        btn.textContent = "点击选择 .json.gz 别名文件（选择后按钮自动消失）";

        // 初始化文件选择器（隐藏）
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json.gz';
            fileInput.style.display = 'none';
            // 绑定文件选择后的处理逻辑
            fileInput.onchange = handleFileSelect;
            document.body.appendChild(fileInput);
        }

        // 按钮点击 → 触发文件选择器（用户主动操作，规避禁用）
        btn.onclick = () => {
            fileInput.click();
            btn.remove(); // 点击后移除按钮，不干扰页面
        };

        // 点击页面其他区域也移除按钮
        const handleDocClick = (e) => {
            if (e.target !== btn && e.target !== fileInput) {
                btn.remove();
                document.removeEventListener('click', handleDocClick);
            }
        };
        document.addEventListener('click', handleDocClick);

        document.body.appendChild(btn);
    }

    /**
     * 文件选择后的统一处理逻辑
     */
    async function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 重置文件选择器（允许重复选择同一文件）
        fileInput.value = '';

        // 更新菜单状态 + 显示处理通知
        menuCommandId = GM_registerMenuCommand("处理中...", () => {});
        showGMNotification({ text: `正在处理文件: ${file.name}...` });

        try {
            // 读取并解析本地文件
            const data = await readLocalGzFile(file);
            // 导入数据库
            await importToIndexedDB(data);

            // 记录本地导入版本（与远程更新区分）
            const prevVersion = GM_getValue('lastPersonAliasVersion', '从未更新');
            const localVersion = `本地导入_${new Date().toLocaleString()}`;
            GM_setValue('lastPersonAliasVersion', localVersion);

            // 恢复菜单 + 显示成功通知
            registerMainMenu();
            showGMNotification({
                title: "本地导入成功",
                text: `旧版本: ${prevVersion}\n新版本: ${localVersion}\n共导入 ${data[1] ? Object.keys(data[1]).length : 0} 条别名记录`
            });

        } catch (err) {
            // 恢复菜单 + 显示错误通知
            registerMainMenu();
            showGMNotification({
                title: "本地导入失败",
                text: `错误详情: ${err.message}`
            });
            console.error("本地导入错误:", err);
        }
    }
    // -------------------------- 修复结束 --------------------------


    // 读取本地 .json.gz 文件并解析（逻辑不变）
    function readLocalGzFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    // 解压文件（依赖pako库）
                    const decompressed = pako.inflate(e.target.result);
                    // 解码为JSON字符串并解析
                    const jsonStr = new TextDecoder('utf-8').decode(decompressed);
                    const data = JSON.parse(jsonStr);

                    // 严格验证数据格式（必须与远程数据结构一致：[persons数组, aliases对象]）
                    if (!Array.isArray(data) || data.length !== 2) {
                        throw new Error("文件格式错误：需为 [persons数组, aliases对象] 结构");
                    }
                    if (!Array.isArray(data[0]) || typeof data[1] !== 'object') {
                        throw new Error("文件内容错误：persons需为数组，aliases需为对象");
                    }

                    resolve(data);
                } catch (e) {
                    if (e instanceof pako.ZlibError) {
                        reject(new Error(`文件解压失败: ${e.message}`));
                    } else if (e instanceof SyntaxError) {
                        reject(new Error(`JSON解析失败: ${e.message}`));
                    } else {
                        reject(new Error(`文件验证失败: ${e.message}`));
                    }
                }
            };

            reader.onerror = () => reject(new Error("文件读取失败（可能是文件损坏或无读取权限）"));
            reader.readAsArrayBuffer(file); // 二进制读取压缩文件
        });
    }

    // 注册菜单（远程更新 + 本地导入，逻辑不变）
    function registerMainMenu() {
        // 先移除旧菜单，避免重复
        if (menuCommandId !== undefined) {
            GM_unregisterMenuCommand(menuCommandId);
        }
        // 1. 远程更新菜单（原有功能）
        menuCommandId = GM_registerMenuCommand("更新人物别名映射表（远程）", startUpdate);
        // 2. 本地导入菜单（点击后创建可见触发按钮）
        GM_registerMenuCommand("手动导入 .json.gz 文件", createVisibleTriggerButton);
    }

    // 显示GM通知（原有功能，逻辑不变）
    function showGMNotification(options) {
        GM.notification({
            text: options.text,
            title: options.title || "人物别名映射表",
            onclick: options.onclick || function() {},
            ondone: options.ondone || function() {}
        });
    }

    // 远程更新（原有功能，逻辑不变）
    async function startUpdate() {
        menuCommandId = GM_registerMenuCommand("获取中...", () => {});
        showGMNotification({ text: "更新人物别名数据中……" });

        try {
            const release = await getLatestRelease();
            if (!release) throw new Error("无法获取最新发布信息");

            const asset = release.assets.find(a => a.name === CONFIG.compressedFile);
            if (!asset) throw new Error(`未找到文件: ${CONFIG.compressedFile}`);

            const data = await downloadAndDecompress(asset.browser_download_url);
            await importToIndexedDB(data);

            const prevVersion = GM_getValue('lastPersonAliasVersion', '从未更新');
            GM_setValue('lastPersonAliasVersion', release.tag_name);

            registerMainMenu();
            showGMNotification({
                title: "远程更新成功",
                text: `旧版本: ${prevVersion}\n新版本: ${release.tag_name}\n共导入 ${data[1] ? Object.keys(data[1]).length : 0} 条别名记录`
            });

        } catch (err) {
            registerMainMenu();
            showGMNotification({
                title: "远程更新失败",
                text: `错误详情: ${err.message}`
            });
            console.error("远程更新错误:", err);
        }
    }

    // 获取GitHub最新发布（原有功能，逻辑不变）
    function getLatestRelease() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.github.com/repos/${CONFIG.githubRepo}/releases/latest`,
                headers: { "Accept": "application/vnd.github.v3+json" },
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            resolve(JSON.parse(res.responseText));
                        } catch (e) {
                            reject(new Error(`解析发布信息失败: ${e.message}`));
                        }
                    } else {
                        reject(new Error(`获取发布信息失败 (HTTP ${res.status}): ${res.responseText.substring(0, 100)}`));
                    }
                },
                onerror: (err) => {
                    reject(new Error(`请求发布信息出错: ${err}`));
                }
            });
        });
    }

    // 下载并解压远程文件（原有功能，逻辑不变）
    function downloadAndDecompress(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "arraybuffer",
                onload: (res) => {
                    if (res.status !== 200) {
                        reject(new Error(`下载文件失败 (HTTP ${res.status})`));
                        return;
                    }

                    try {
                        const decompressed = pako.inflate(res.response);
                        const jsonStr = new TextDecoder().decode(decompressed);
                        const data = JSON.parse(jsonStr);
                        resolve(data);
                    } catch (e) {
                        if (e instanceof pako.ZlibError) {
                            reject(new Error(`解压失败: ${e.message}`));
                        } else if (e instanceof SyntaxError) {
                            reject(new Error(`解析JSON失败: ${e.message}`));
                        } else {
                            reject(new Error(`处理数据失败: ${e.message}`));
                        }
                    }
                },
                onerror: (err) => {
                    reject(new Error(`下载请求出错: ${err.error || '未知错误'}`));
                },
                ontimeout: () => {
                    reject(new Error("下载超时"));
                }
            });
        });
    }

    // 初始化数据库（原有功能，逻辑不变）
    function initDB(force = false) {
        if (dbInitialized && !force) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
            request.onupgradeneeded = e => {
                const db = e.target.result;
                const oldVersion = e.oldVersion;

                // 版本升级时删除旧存储
                if (oldVersion > 0 && oldVersion < CONFIG.dbVersion) {
                    if (db.objectStoreNames.contains(CONFIG.storeName)) {
                        db.deleteObjectStore(CONFIG.storeName);
                    }
                }

                // 创建新存储结构
                if (!db.objectStoreNames.contains('persons')) {
                    const personsStore = db.createObjectStore('persons', { keyPath: 'index' });
                    personsStore.createIndex('by_index', 'index', { unique: true });
                }
                if (!db.objectStoreNames.contains('aliases')) {
                    db.createObjectStore('aliases', { keyPath: 'alias' });
                }
            };
            request.onsuccess = e => {
                e.target.result.close();
                dbInitialized = true;
                resolve();
            };
            request.onerror = e => {
                reject(new Error(`数据库初始化失败: ${e.target.error.message}`));
            };
        });
    }

    // 导入数据到IndexedDB（原有功能，逻辑不变）
    function importToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            initDB().then(() => {
                const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
                request.onsuccess = e => {
                    const db = e.target.result;
                    const tx = db.transaction(['persons', 'aliases'], 'readwrite');

                    const personsStore = tx.objectStore('persons');
                    const aliasesStore = tx.objectStore('aliases');

                    // 清空现有数据（避免冲突）
                    personsStore.clear();
                    aliasesStore.clear();

                    const [persons, aliases] = data;

                    // 导入人物数据
                    if (persons && Array.isArray(persons)) {
                        persons.forEach((person, index) => {
                            if (Array.isArray(person) && person.length >= 2) {
                                const personObj = {
                                    index: index,
                                    name: person[0],
                                    id: person[1]
                                };
                                personsStore.put(personObj);
                            }
                        });
                    }

                    // 导入别名数据
                    if (aliases && typeof aliases === 'object') {
                        Object.entries(aliases).forEach(([alias, personIndex]) => {
                            aliasesStore.put({
                                alias: alias,
                                personIndex: personIndex
                            });
                        });
                    }

                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                    tx.onerror = (e) => {
                        reject(new Error(`数据库写入失败: ${tx.error?.message || e.target.error}`));
                    };
                };
                request.onerror = e => {
                    reject(new Error(`打开数据库失败: ${e.target.error.message}`));
                };
            }).catch(reject);
        });
    }

    // 暴露查询接口（原有功能，逻辑不变）
    unsafeWindow.personAliasQuery = async function(aliasName) {
        if (!dbInitialized) {
            await initDB();
        }

        return new Promise(resolve => {
            const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
            request.onsuccess = e => {
                const db = e.target.result;
                const tx = db.transaction(['aliases', 'persons'], 'readonly');
                const aliasesStore = tx.objectStore('aliases');
                const personsStore = tx.objectStore('persons');

                const aliasReq = aliasesStore.get(normalize(aliasName));

                aliasReq.onsuccess = () => {
                    if (aliasReq.result) {
                        const personIndex = aliasReq.result.personIndex;
                        const personReq = personsStore.get(personIndex);

                        personReq.onsuccess = () => {
                            db.close();
                            resolve(personReq.result ? {
                                name: personReq.result.name,
                                id: personReq.result.id
                            } : null);
                        };

                        personReq.onerror = () => {
                            db.close();
                            resolve(null);
                            console.error("查询人物信息失败:", personReq.error);
                        };
                    } else {
                        db.close();
                        resolve(null);
                    }
                };

                aliasReq.onerror = () => {
                    db.close();
                    resolve(null);
                    console.error("查询别名失败:", aliasReq.error);
                };
            };
            request.onerror = () => {
                resolve(null);
                console.error("打开数据库出错:", request.error);
            };
        });
    };

    // 脚本初始化（原有逻辑，不变）
    initDB().catch(err => console.log("数据库初始化:", err));
    registerMainMenu();
})();
