// ==UserScript==
// @name         bangumi寿星名单
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.0.2
// @description  把目录里的角色或人物的生日添加到localstorge 并在生日当天显示
// @author       Yonjar
// @match        https://bgm.tv/*
// @match        https://bangumi.tv/*
// @grant        GM_addStyle
// ==/UserScript==

// const birthdaySet = {
//   1: {
//     22: [
//       {
//         name: "山下瞳月",
//         birthday: "2005年1月22日",
//         year: 2005,
//         bio: "山下 瞳月（やました しづき、2005年1月22日 - ）は、櫻坂46のメンバー。京都府出身。Seed & Flower合同会社所属。",
//         -path: "/person/57739",
//         -avatar:
//           "https://lain.bgm.tv/r/400/pic/crt/l/ec/68/57739_prsn_3qF2o.jpg?r=1738559969",
//       },
//     ],
//   },
// };

// console.log(birthdayList["1"]["22"][0].name); // 输出: 山下瞳月

GM_addStyle(`
    #yonjar_happy_birthday_everyday .timeline{
        max-height: 400px;
        overflow: auto;
    }
    #yonjar_happy_birthday_everyday .year_old {
        background-color: lavender;
        padding: 0px 4px;
        margin-left: 5px;
        border: 1px solid blueviolet;
        border-radius: 6px;
        opacity: 0.5;
    }`);

const host = location.host;
const birthdaySet =
  JSON.parse(localStorage.getItem("yonjar_birthdaySet")) || {};

const date = new Date(); // 创建当前时间的 Date 对象

const year = date.getFullYear(); // 年（四位数，如 2023）
const month = date.getMonth() + 1; // 月（0~11，需 +1 转为实际月份）
const day = date.getDate(); // 日（1~31）

console.log(`当前日期：${year}-${month}-${day}`);

class HomePage {
  constructor() {
    this.sideInner = document.querySelector("#columnHomeB > div.sideInner");
    this.home_calendar = document.querySelector("#home_calendar");
  }

  init() {
    let col_elem =
      document.querySelector("#yonjar_happy_birthday_everyday") ||
      document.createElement("div");
    let listStr = "";
    let todayList = birthdaySet[month]?.[day] || [];
    for (let col of todayList) {
      listStr += `
                <li>
                    <a href="https://${host}/mono_search/${
        col.name
      }?cat=all" title="${col.bio}" class="l" target="_blank">${col.name}</a>
                <span class='year_old'>${year - col.year}岁</span></li>
            `;
    }
    col_elem.innerHTML = `
            <div id="yonjar_happy_birthday_everyday" class="halfPage">
                <div class="sidePanelHome">
                    <h2 class="subtitle">今日寿星(${todayList.length})</h2>
                    <ul class="timeline" style="margin:0 5px">
                        ${
                          todayList.length < 1
                            ? "<li>今日暂无寿星</li>"
                            : listStr
                        }
                    </ul>
                </div>
            </div>
        `;

    this.sideInner.insertBefore(col_elem, this.home_calendar);
  }
}

class ProfilePage {
  constructor() {
    this.name = document.querySelector(".nameSingle a").textContent.trim();
    this.birthday = parseDate(
      document.querySelector("#infobox").textContent.trim()
    );
    this.year = this.birthday ? this.birthday.getFullYear() : null;
    this.month = this.birthday ? this.birthday.getMonth() + 1 : null; // 月份从0开始
    this.day = this.birthday ? this.birthday.getDate() : null;
    this.bio =
      document.querySelector("#columnCrtB .detail") != undefined
        ? document
            .querySelector("#columnCrtB .detail")
            .textContent.slice(0, 40) + "..."
        : "暂无简介";
    this.avatar = document.querySelector(".infobox img.cover").src;
    this.path = location.pathname;

    this.container = document.querySelector(
      "#headerSubject > div > ul > li.collect"
    );
  }

  init() {
    let btn = this.isInBirthdaySet()
      ? `<span class="collect"><a id="removeFromBirthdaySet" class="break">关闭生日提醒</a></span>`
      : `<span class="collect"><a id="addToBirthdaySet">添加到生日提醒</a></span>`;

    this.container.innerHTML += btn;

    if (!this.isInBirthdaySet()) {
      document
        .querySelector("#addToBirthdaySet")
        .addEventListener("click", () => {
          this.addToBirthdaySet();
          location.reload(); // 重新加载页面以更新按钮状态
        });
    } else {
      document
        .querySelector("#removeFromBirthdaySet")
        .addEventListener("click", () => {
          this.removeFromBirthdaySet();
          location.reload(); // 重新加载页面以更新按钮状态
        });
    }
  }

  isInBirthdaySet() {
    if (!this.month || !this.day) return false;
    return (
      birthdaySet[this.month] &&
      birthdaySet[this.month][this.day] &&
      birthdaySet[this.month][this.day].some((col) => col.name === this.name)
    );
  }

  addToBirthdaySet() {
    if (!this.month || !this.day) return;
    if (!birthdaySet[this.month]) {
      birthdaySet[this.month] = {};
    }
    if (!birthdaySet[this.month][this.day]) {
      birthdaySet[this.month][this.day] = [];
    }
    // 检查是否已存在
    if (
      !birthdaySet[this.month][this.day].some((col) => col.name === this.name)
    ) {
      birthdaySet[this.month][this.day].push({
        name: this.name,
        birthday:
          (this.year ? `${this.year}年` : "") + `${this.month}月${this.day}日`,
        year: this.year,
        bio: this.bio,
        path: this.path,
        avatar: this.avatar,
      });
      localStorage.setItem("yonjar_birthdaySet", JSON.stringify(birthdaySet));
    }
  }

  removeFromBirthdaySet() {
    if (!this.month || !this.day) return;
    if (
      birthdaySet[this.month] &&
      birthdaySet[this.month][this.day] &&
      birthdaySet[this.month][this.day].length > 0
    ) {
      birthdaySet[this.month][this.day] = birthdaySet[this.month][
        this.day
      ].filter((col) => col.name !== this.name);
      // 如果当天没有寿星了，删除该日期
      // if (birthdaySet[this.month][this.day].length === 0) {
      //   delete birthdaySet[this.month][this.day];
      // }
    }
    // 如果该月没有寿星了，删除该月
    // if (Object.keys(birthdaySet[this.month]).length === 0) {
    //   delete birthdaySet[this.month];
    // }
    localStorage.setItem("yonjar_birthdaySet", JSON.stringify(birthdaySet));
  }
}

function parseDate(str) {
  const patterns = [
    // 格式：2025年5月24日
    {
      regex: /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      handler: (match) => ({
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
      }),
    },
    // 格式：2025/5/24 或 2025-5-24
    {
      regex: /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/,
      handler: (match) => ({
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
      }),
    },
    // 格式：5/14 或 5-14（补充当前年份）
    {
      regex: /(\d{1,2})[\/-](\d{1,2})/,
      handler: (match) => ({
        year: new Date().getFullYear(),
        month: parseInt(match[1], 10),
        day: parseInt(match[2], 10),
      }),
    },
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern.regex);
    if (match) {
      const parts = pattern.handler(match);
      // 基础验证月份和日期范围
      if (
        parts.month < 1 ||
        parts.month > 12 ||
        parts.day < 1 ||
        parts.day > 31
      ) {
        return null;
      }
      // 创建Date对象（月份从0开始）
      const date = new Date(parts.year, parts.month - 1, parts.day);
      // 验证日期是否有效
      if (
        date.getFullYear() === parts.year &&
        date.getMonth() === parts.month - 1 &&
        date.getDate() === parts.day
      ) {
        return date;
      }
    }
  }
  return null; // 格式不匹配或日期无效
}

// 测试用例
// const testCases = [
//   "2025年5月24日",
//   "2025/5/24",
//   "2025-1-24",
//   "5/14",
//   "2025-05-21",
//   "5-14",        // 月-日格式
//   "13/32",       // 无效月日
//   "2025-02-30", // 无效日期
// ];

// testCases.forEach((str) => {
//   const date = parseDate(str);
//   console.log(`输入: "${str}" →`, date ? date.toISOString() : "无效日期");
// });

(function () {
  let cur_url = location.href;

  if (
    /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(person|character)\/\d+/.test(
      cur_url
    )
  ) {
    let pp = new ProfilePage();
    pp.init();
    return;
  }

  if (/^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/$/.test(cur_url)) {
    let hp = new HomePage();
    hp.init();
    return;
  }
})();
