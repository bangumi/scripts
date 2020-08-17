// ==UserScript==
// @name         bangumi危险名单
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.2.2
// @description  bangumi危险名单&简易屏蔽
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(user|blog|ep|character|person|(group|subject)\/topic|rakuen\/topic\/(ep|crt|group|subject|prsn))\/\S+(\?.*)?(#.*)?$/
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    .yonjar_bgm_dangerous_list_btn{
        border: 1px solid #fd1010 !important;
        cursor: pointer;
    }
    .yonjar_bgm_dangerous_list_btn:hover {
        color: #FFF !important;
        background: #fd1010 !important;
    }
    `);

class DangerousList {
  constructor() {
    if (!localStorage.getItem("dangerous_list_by_yonjar")) {
      localStorage.setItem("dangerous_list_by_yonjar", JSON.stringify([]));
    }
    this.userList = JSON.parse(
      localStorage.getItem("dangerous_list_by_yonjar")
    );
  }

  get list() {
    return this.userList;
  }

  update() {
    localStorage.setItem(
      "dangerous_list_by_yonjar",
      JSON.stringify(this.userList)
    );
  }

  add(userId) {
    this.userList.push(userId);
    this.update();
  }

  remove(userId) {
    for (let i = 0; i < this.userList.length; i++) {
      if (this.userList[i] === userId) {
        this.userList.splice(i, 1);
        break;
      }
    }
    this.update();
  }

  has(userId) {
    return this.userList.includes(userId);
  }
}

class User {
  constructor() {
    this.id = location.pathname.split("user/")[1];
    this.name = document.querySelector(
      "#headerProfile h1 > div.inner > a"
    ).textContent;
  }

  init() {
    let dl = new DangerousList();

    // 危险名单btn
    let dl_btn = document.createElement("a");
    dl_btn.classList.add("chiiBtn");
    dl_btn.classList.add("yonjar_bgm_dangerous_list_btn");
    dl_btn.innerHTML = dl.has(this.id)
      ? "<span>移出危险名单</span>"
      : "<span>加入危险名单</span>";
    dl_btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (dl.has(this.id)) {
        dl.remove(this.id);
        dl_btn.innerHTML = "<span>加入危险名单</span>";
      } else {
        dl.add(this.id);
        dl_btn.innerHTML = "<span>移出危险名单</span>";
      }
    });

    // 屏蔽btn
    let block_btn = document.createElement("a");
    block_btn.classList.add("chiiBtn");
    block_btn.classList.add("yonjar_bgm_dangerous_list_btn");
    block_btn.innerHTML = "<span>在下面生成ublock规则</span>";

    block_btn.addEventListener("click", (e) => {
      e.preventDefault();

      let block_text = document.createElement("p");
      block_text.style.whiteSpace = "pre-line";
      block_text.style.padding = "10px";

      block_text.textContent = `! ${location.host} 屏蔽首页侧边栏&超展开&小组页面的帖子
      ${location.host}##li:has(> a[title="${this.name}"])
      ${location.host}##li:has(img[title="${this.name}"])
      ${location.host}##tr:has(a[href="/user/${this.id}"])
      
      ! ${location.host} 屏蔽贴内的回复
      ${location.host}##.topic_sub_reply > div:has(> a[href="/user/${this.id}"])
      ${location.host}##.row_reply:has(> a[href="/user/${this.id}"])
      `;

      document.querySelector(".user_box").appendChild(block_text);
    });

    let titleElem = document.querySelector("div.headerContainer > h1 > div.rr");
    titleElem.appendChild(dl_btn);
    titleElem.appendChild(block_btn);
  }
}

(function () {
  let cur_url = location.href;
  if (
    /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/user\/[^\/]+$/.test(cur_url)
  ) {
    let user = new User();
    user.init();
    return;
  }

  let localData = localStorage.getItem("dangerous_list_by_yonjar");
  let dangerousList = JSON.parse(localData);

  let commentUsers = document.querySelectorAll(
    "#comment_list div.inner strong a"
  );

  commentUsers.forEach((e) => {
    let userId = e.href.split("user/")[1];
    if (dangerousList.includes(userId)) {
      e.style.color = "#e4ff00";
      e.style.background = "#ff2424";
    }
  });
})();
