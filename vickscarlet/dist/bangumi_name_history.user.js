// ==UserScript==
// @name         Bangumi 用户曾用名
// @namespace    b38.dev
// @version      1.0.0
// @author       神戸小鳥 @vickscarlet
// @description  Bangumi 用户曾用名, 显示用户的历史用户名
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/scripts/name_history
// @match        *://bgm.tv/user/*
// @match        *://chii.in/user/*
// @match        *://bangumi.tv/user/*
// ==/UserScript==

(function () {
  'use strict';

  const BASE = "https://api.b38.dev/v1";
  async function fetchUserNameHistoryRaw(id) {
    const res = await fetch(`${BASE}/user/name-history?uid=${id}`);
    const data = await res.json();
    return data;
  }
  async function fetchUserNameHistory(id) {
    const result = await fetchUserNameHistoryRaw(id);
    if ("error" in result) {
      throw new Error(`fetch name history failed: ${result.error}`);
    }
    const data = result.data;
    if (!data.name_history) {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const res = await fetchUserNameHistory(id);
          resolve(res);
        }, 2e3);
      });
    }
    const { name_history, state } = data;
    return {
      state,
      update: new Date(name_history.update_at).getTime(),
      names: new Set(name_history.names)
    };
  }
  const style = 'html[data-theme=dark]{.v-name-history-tool{--color-bg: #38282888;--color-shadow: #2118}}.v-name-history-tool{z-index:10;--color-bg: #dfd8c88;--color-shadow: #0004;display:inline-block;margin-left:8px;position:relative;>button{border:none;width:1em;height:1em;padding:0;margin:0;text-align:center;background:none;cursor:pointer}>div{visibility:hidden;display:flex;flex-direction:column-reverse;position:absolute;background:var(--color-bg);padding:5px 15px;font-size:12px;gap:8px;border-radius:8px;backdrop-filter:blur(4px);box-shadow:0 0 10px var(--color-shadow);text-shadow:1px 1px 4px rgb(from var(--primary-color,#f09199) r g b / .5);>span{flex:0 0 auto;text-wrap:nowrap;width:100%;text-align:right}>span:before{content:"*"}>ul{display:flex;flex-direction:column;flex:0 0 auto;gap:4px;max-height:50vh;overflow-y:auto;>li{flex:0 0 auto;text-wrap:nowrap;width:100%}}}}.v-name-history-tool.v-show-history-name{>div{visibility:visible}}.v-name-history-tool.v-show-history-name.v-loading-history-name{>div{>span>ul{visibility:hidden}}}.v-name-history-tool.v-loading-history-name{>div>span>ul{visibility:hidden}>div:before{content:"";display:inline-block;width:1em;height:1em;border-radius:50%;border:2px solid var(--primary-color,#f09199);border-top-color:transparent;border-bottom-color:transparent;animation:v-loading-spin 1s linear infinite}}@keyframes v-loading-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}';
  async function fetchByUid(uid) {
    try {
      const ret = await fetchUserNameHistory(uid);
      const updated = new Date(ret.update).toLocaleString();
      const names = Array.from(ret.names).map((name) => `<li>${name}</li>`);
      return `<span>${updated}</span><ul>${names.join("")}</ul>`;
    } catch (e) {
      console.error(e);
      return `<div class="item">获取曾用名失败，请稍后重试</div>`;
    }
  }
  (async () => {
    const nameElement = document.querySelector(
      "#headerProfile .subjectNav .headerContainer .inner .name a"
    );
    if (!nameElement) return;
    const username = nameElement.href.split("/").pop();
    if (!username) return;
    document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);
    const tool = document.createElement("div");
    tool.classList.add("v-name-history-tool");
    const btn = document.createElement("button");
    const container = document.createElement("div");
    btn.textContent = "▾";
    tool.append(btn);
    tool.append(container);
    let show = false;
    let loaded = false;
    btn.onclick = async () => {
      if (show = !show) {
        tool.classList.add("v-show-history-name");
      } else {
        tool.classList.remove("v-show-history-name");
        return;
      }
      if (loaded) return;
      tool.classList.add("v-loading-history-name");
      container.innerHTML = await fetchByUid(username);
      tool.classList.remove("v-loading-history-name");
      loaded = true;
    };
    nameElement.after(tool);
  })();

})();