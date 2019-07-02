// ==UserScript==
// @name         bgm timeline switch
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.2.1
// @description  bgm 好友动态&全站动态切换
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(timeline)?$/
// @grant        none
// ==/UserScript==

class timelineSwitch {
    constructor() {
        this.tabsContainer = document.querySelector("#timelineTabs");
        this.flag = localStorage.getItem("timeline_switch_by_yonjar");
    }

    init() {
        this.checkLocalStorage();
        this.createBtn();
        if (this.flag && this.flag !== "false") {
            this.switchFunc();
        }
    }

    checkLocalStorage() {
        if (!this.flag) {
            let f = confirm(
                "站内动态切换组件: 当前为初次使用, 请设定是否需要默认切换为全站动态?"
            );
            localStorage.setItem("timeline_switch_by_yonjar", f);
        }
    }

    createBtn() {
        let liElem = document.createElement("li");
        liElem.setAttribute("id", "gbtl-btn");
        liElem.innerHTML = '<a href="javascript:void(0)">看全站动态</a>';
        liElem.addEventListener("click", this.switchFunc, false);
        this.tabsContainer.append(liElem);
    }

    setStyle() {
        let btn = document.querySelector("#gbtl-btn");
        this.tabsContainer.querySelectorAll("a.focus").forEach((ele, idx) => {
            ele.classList.remove("focus");
        });
        btn.querySelector("a").classList.add("focus");
    }

    switchFunc() {
        //设置按钮样式
        let timelineContainer = document.querySelector("#timeline");
        let btn = document.querySelector("#gbtl-btn");
        let tabsContainer = document.querySelector("#timelineTabs");

        tabsContainer.querySelectorAll("a.focus").forEach((ele, idx) => {
            ele.classList.remove("focus");
        });
        btn.querySelector("a").classList.add("focus");

        fetch(location.origin + "/timeline", { credentials: "omit" })
            .then(resp => resp.text())
            .then(html => {
                let parser = new DOMParser();
                let doc = parser.parseFromString(html, "text/html");

                let globalTL = doc.querySelector("#timeline");
                timelineContainer.innerHTML = globalTL.innerHTML;
            });

        // 移除"下一页"按钮
        let tmlPager = document.querySelector("#tmlPager");
        tmlPager.parentNode.removeChild(tmlPager);
    }
}

// 判断域名
if (/^\/(timeline)?$/.test(location.pathname)) {
    let tl = new timelineSwitch();
    tl.init();
}
