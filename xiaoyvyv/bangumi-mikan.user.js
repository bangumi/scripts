// ==UserScript==
// @name         班固米-蜜柑计划映射插件
// @namespace    xiaoyvyv
// @version      1.0.0
// @description  班固米-蜜柑计划映射插件
// @author       1223414335@qq.com
// @match        https://bgm.tv/subject/*
// @match        https://bangumi.tv/subject/*
// @match        https://chii.in/subject/*
// @grant        none
// ==/UserScript==


function init() {
    console.log("班固米-蜜柑计划映射插件：初始化");
    const regex = /\d+/;
    const matches = location.href.match(regex);
    const bgmId = matches[0] || '';
    if (bgmId.length === 0) return;

    console.log(`班固米-蜜柑计划映射插件：当前条目ID -> ${bgmId}`);

    // 读取缓存
    const map = JSON.parse(localStorage.getItem("mikan-id") || '{}');
    let mikanId = queryMikanIdByBgmId(bgmId, map);
    if (mikanId.length === 0) {
        console.log("班固米-蜜柑计划映射插件：当前条目没有蜜柑数据");
    } else {
        console.log(`班固米-蜜柑计划映射插件：当前条目对应蜜柑计划 ID -> ${mikanId}`);
        injectMikanTab(mikanId);
    }

    // 拉取最新数据
    updateMaps().then(data => {
        console.log("班固米-蜜柑计划映射插件：更新映射表成功！");

        localStorage.setItem("mikan-id", JSON.stringify(data));

        // 针对缓存没有，但是同步后数据有了的情况再进行注入
        if (mikanId.length === 0) {
            mikanId = queryMikanIdByBgmId(bgmId, data);
            if (mikanId.length !== 0) {
                console.log(`班固米-蜜柑计划映射插件：当前条目对应蜜柑计划 ID -> ${mikanId}`);
                injectMikanTab(mikanId);
            }
        }
    });
}

/**
 * 查询蜜柑ID
 *
 * @param bgmId
 * @param mikanMap
 */
function queryMikanIdByBgmId(bgmId, mikanMap) {
    let targetMikanId = '';
    for (let key in mikanMap) {
        if (mikanMap[key] === bgmId) {
            targetMikanId = key;
        }
    }
    return targetMikanId;
}

function injectMikanTab(mikanId) {
    try {
        const navTabs = document.querySelector(".subjectNav > .navTabs");
        const newListItem = document.createElement("li");
        const newLink = document.createElement("a");
        newLink.textContent = "蜜柑计划";
        newLink.href = `https://mikanime.tv/Home/Bangumi/${mikanId}`;
        newLink.target = "_blank";
        newListItem.appendChild(newLink);
        navTabs.appendChild(newListItem);
    } catch (e) {
        console.log(e);
    }
}

function updateMaps() {
    return fetch("https://raw.githubusercontent.com/xiaoyvyv/bangumi-data/main/data/mikan/bangumi-mikan.json")
        .then((res) => res.json())
        .catch(() => ({}));
}

function main() {
    init();
}

main();
