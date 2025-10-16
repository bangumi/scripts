// ==UserScript==
// @name         班固米人物别名本地 API
// @namespace    https://bgm.tv/
// @version      1.1
// @description  从 wiki archive 自动生成，使用脚本同步
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
// @require      https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js
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

    // 注册主菜单
    function registerMainMenu() {
        if (menuCommandId !== undefined) {
            GM_unregisterMenuCommand(menuCommandId);
        }
        menuCommandId = GM_registerMenuCommand("更新人物别名映射表", startUpdate);
    }

    // 显示GM通知（无图片）
    function showGMNotification(options) {
        GM.notification({
            text: options.text,
            title: options.title || "人物别名映射表",
            onclick: options.onclick || function() {},
            ondone: options.ondone || function() {}
        });
    }

    // 开始更新
    async function startUpdate() {
        // 更新菜单为"获取中..."
        menuCommandId = GM_registerMenuCommand("获取中...", () => {});
        showGMNotification({
            text: "更新人物别名数据中……"
        });

        try {
            // 获取最新发布
            const release = await getLatestRelease();
            if (!release) throw new Error("无法获取最新发布信息");

            // 查找压缩文件
            const asset = release.assets.find(a => a.name === CONFIG.compressedFile);
            if (!asset) throw new Error(`未找到文件: ${CONFIG.compressedFile}`);

            // 下载并解压
            const data = await downloadAndDecompress(asset.browser_download_url);

            // 导入数据库
            await importToIndexedDB(data);

            // 记录版本
            const prevVersion = GM_getValue('lastPersonAliasVersion', '从未更新');
            GM_setValue('lastPersonAliasVersion', release.tag_name);

            registerMainMenu();

            // 显示成功通知（无图片）
            showGMNotification({
                title: "人物别名更新成功",
                text: `旧版本: ${prevVersion}\n新版本: ${release.tag_name}\n共导入 ${data[1] ? Object.keys(data[1]).length : 0} 条别名记录`
            });

        } catch (err) {
            // 恢复菜单并显示错误通知
            registerMainMenu();

            // 显示错误通知（无图片）
            showGMNotification({
                title: "人物别名更新失败",
                text: `错误详情: ${err.message}`
            });

            // 同时在控制台输出完整错误
            console.error(err);
        }
    }

    // 获取最新发布
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
                    reject(new Error(`请求发布信息出错: ${err.error || '未知错误'}`));
                }
            });
        });
    }

    // 下载并解压文件
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

    // 初始化数据库
    function initDB(force = false) {
        if (dbInitialized && !force) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
            request.onupgradeneeded = e => {
                const db = e.target.result;
                const oldVersion = e.oldVersion;

                // 如果是从旧版本升级，删除旧的数据存储
                if (oldVersion > 0 && oldVersion < CONFIG.dbVersion) {
                    if (db.objectStoreNames.contains(CONFIG.storeName)) {
                        db.deleteObjectStore(CONFIG.storeName);
                    }
                }

                // 创建新的数据存储结构
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

    // 导入数据到IndexedDB
    function importToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            initDB().then(() => {
                const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
                request.onsuccess = e => {
                    const db = e.target.result;
                    const tx = db.transaction(['persons', 'aliases'], 'readwrite');

                    const personsStore = tx.objectStore('persons');
                    const aliasesStore = tx.objectStore('aliases');

                    // 清空现有数据
                    personsStore.clear();
                    aliasesStore.clear();

                    const [persons, aliases] = data;

                    // 导入人物数据
                    if (persons && Array.isArray(persons)) {
                        persons.forEach((person, index) => {
                            if (Array.isArray(person) && person.length >= 2) {
                                const personObj = {
                                    index: index,
                                    name: person[0], // name
                                    id: person[1]    // id
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

    // 暴露查询接口 - 通过别名查询人物信息
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

                // 首先在别名表中查找
                const aliasReq = aliasesStore.get(aliasName);

                aliasReq.onsuccess = () => {
                    if (aliasReq.result) {
                        // 找到别名，通过索引查找人物信息
                        const personIndex = aliasReq.result.personIndex;
                        const personReq = personsStore.get(personIndex);

                        personReq.onsuccess = () => {
                            db.close();
                            if (personReq.result) {
                                resolve({
                                    name: personReq.result.name,
                                    id: personReq.result.id
                                });
                            } else {
                                resolve(null);
                            }
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

    // 初始化
    initDB().catch(err => console.log("数据库初始化:", err));
    registerMainMenu();
})();