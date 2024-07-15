// ==UserScript==
// @name         wiki helper
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.5
// @description  个人自用wiki助手
// @require      https://unpkg.com/wanakana@4.0.2/umd/wanakana.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/dayjs/1.8.29/dayjs.min.js
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)/
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // 新建人物页面
  if (/person\/new/.test(location.href)) {
    kana2romaji();
  }

  // 关联人物页面
  if (/add_related/.test(location.href)) {
    bgmIdFormat();
  }

  // 添加章节页面
  if (/ep\/create/.test(location.href)) {
    createNewEp();
  }
  // 角色页面
  if (/\/\d+\/characters/.test(location.href)) {
    addBtn("导出角色id", "click", toIDstr, true);
    addBtn("导出人物id", "click", toIDstr, false);
  }

  // 人物页面
  if (/\/\d+\/persons/.test(location.href)) {
    addBtn("导出人物id", "click", toIDstr, true);
  }

  // 新建条目页面
  if (/new_subject/.test(location.href)) {
    addBtn("导入资料", "click", importData, true);
  }

  // 加个btn
  function addBtn(
    describe,
    type,
    callback,
    arg,
    container_selector = "#columnInSubjectB"
  ) {
    let btn_prn = document.createElement("button");

    btn_prn.textContent = describe;

    btn_prn.addEventListener(
      type,
      () => {
        callback(arg);
      },
      false
    );

    document.querySelector(container_selector).append(btn_prn);

    return btn_prn;
  }

  // 加个输入框
  function addInput(id, type, describe) {
    let ipt_prn = document.createElement("input");

    ipt_prn.setAttribute("id", id);
    ipt_prn.setAttribute("type", type);

    document.querySelector("#columnInSubjectB").append(ipt_prn);

    if (type == "checkbox" || type == "radio") {
      let label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = describe;

      document.querySelector("#columnInSubjectB").append(label);
    } else {
      ipt_prn.placeholder = describe;
    }

    return ipt_prn;
  }

  // 章节页面获取最新一集的数字
  // function getBangumiRecent() {
  //   let ul_el = document.querySelector("#columnInSubjectA ul");
  //   ul_el.childElementCount;
  // }

  // local_data
  function setLocalData(data) {
    localStorage.setItem("wiki_helper_by_yonjar", JSON.stringify(data));
  }

  function getLocalData() {
    try {
      return JSON.parse(localStorage.getItem("wiki_helper_by_yonjar")) || {};
    } catch (e) {
      console.error("JSON字符串有错", e);
    }
  }
  // 导出当前页面的角色或人物的id
  // 默认导出角色的id
  function toIDstr(isChara = true) {
    let list = "";

    if (isChara) {
      list = document.querySelectorAll("h2 > a");
    } else {
      list = document.querySelectorAll("div.actorBadge a.l");
    }

    let tmp = Array.from(list).map((el) => el.href.match(/\d+/)[0]);

    let output = JSON.stringify(ids_list(tmp));
    copy(output);
    //prompt("bgm_id=", output);
  }

  // 关联条目时链接转bgm_id=\d+
  function bgmIdFormat() {
    let textarea = document.querySelector("#subjectName");
    let btn_container = document.querySelector("#subject_inner_info");
    let handler = document.createElement("button");
    handler.textContent = "冲";
    btn_container.append(handler);

    let parameters = [
      {
        regx: /\S+?\/(\d+)/,
        substitute: "bgm_id=$1",
      },
    ];

    //事件处理函数 回复框失去焦点时触发
    handler.addEventListener("click", () => {
      try {
        let data = JSON.parse(textarea.value);
        for (let i = 0; i < data.length; i++) {
          var btn = document.createElement("button");
          btn.textContent = "id分组" + i;
          btn.addEventListener("click", () => {
            textarea.value = "bgm_id=" + data[i].join(",");
          });
          btn_container.append(btn);
        }
      } catch (e) {
        for (let a of parameters) {
          textarea.value = textarea.value.replace(a.regx, a.substitute);
        }

        // 名字列表
        let map_data = JSON.parse(localStorage.getItem("bgm_cv_id"));
        // let raw = textarea.value;
        let names = textarea.value.split(/[-、\|\/&\s]/).map((e) => {
          let name = e.trim();
          return name in map_data ? map_data[name] : name;
        });
        textarea.value = JSON.stringify(ids_list(names));
      }

      // textarea.removeEventListener("click");
    });
  }

  // id数组处理
  function ids_list(list) {
    let tmp = [];

    while (list.length != 0) {
      tmp.push(list.splice(0, 10));
    }

    return tmp;
  }

  // 复制
  function copy(text) {
    let copyText = document.createElement("input");
    document.body.append(copyText);
    copyText.value = text;
    copyText.select();
    document.execCommand("Copy");
    copyText.style.display = "none";
  }

  // 导入数据
  function importData() {
    let title = document.querySelector("input[name=subject_title]");
    let infobox = document.querySelector("textarea[name=subject_infobox]");
    let summary = document.querySelector("textarea[name=subject_summary]");
    let json_data = prompt("输入json数据", "");
    let data = JSON.parse(json_data);

    title.value = data["TITLE"];
    summary.value = data["INFO"];
    infobox.value = `{{Infobox Album
|中文名=
|别名={
}
|艺术家= ${data["ARTIST"]}
|作词= ${data["LYRICIST"]}
|版本特性= ${data["TYPE"]}
|发售日期= ${data["DATE"]}
|价格= ${data["PRICE"]}
}}`;
  }

  // 添加新章节
  function createNewEp() {
    // let date = new Date();
    // let today = `${date.getFullYear()}-${
    //   date.getMonth() + 1
    // }-${date.getDate()}`;
    // document.querySelector("input[name=airdate]").value = today;

    let a = addInput("chap", "number", "章节编号");
    let b = addInput("onair", "date", "该章节的首播日期 可留空不填");
    let c = addInput("num", "number", "添加几个章节");
    let d = addInput("interval", "number", "章节间隔几天");

    let e = addInput("ep_title", "text", "默认标题");
    // let f = addInput("skip_sun", "checkbox", "跳过周日");

    // 章节首播日期默认为当天
    b.value = dayjs().format("YYYY-MM-DD");

    c.value = "";
    // 间隔默认7天
    d.value = 7;

    addBtn("添加新章节", "click", () => {
      let chap = parseInt(a.value);
      let today = dayjs(b.value);
      let num = parseInt(c.value);
      let interval = parseInt(d.value);
      let ep_title = e.value;
      let str = "";

      for (let i = 0; i < num; i++) {
        str += `${chap + i}|${ep_title}|||${
          b.value == ""
            ? ""
            : today.add(interval * i, "day").format("YYYY-MM-DD")
        }\n`;
      }
      document.querySelector("textarea[name=eplist]").value += str;
    });
  }

  // 新增人物时假名转罗马字
  function kana2romaji() {
    let kana_input = document.querySelector(
      "#infobox_normal > input:nth-child(18)"
    );
    let romaji_input = document.querySelector(
      "#infobox_normal > input:nth-child(22)"
    );

    function firstUpperCase(str) {
      return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
    }

    kana_input.addEventListener("blur", () => {
      romaji_input.value = firstUpperCase(wanakana.toRomaji(kana_input.value));
    });

    //   人物简介
    let textarea = document.querySelector("#crt_summary");

    let parameters = [
      {
        regx: /\[\d+\]/g,
        substitute: "",
      },
      {
        regx: /\[(注 )?\d+\]/g,
        substitute: "",
      },
    ];

    textarea.addEventListener("blur", () => {
      for (let a of parameters) {
        textarea.value = textarea.value.replace(a.regx, a.substitute);
      }
    });
  }
})();
