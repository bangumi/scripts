// ==UserScript==
// @name         bangumi寿星名单
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.0.1
// @description  把目录里的角色或人物的生日添加到localstorge 并在生日当天显示
// @author       Yonjar
// @match        https://bgm.tv/
// @match        https://bangumi.tv/
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

(function () {
  let cur_url = location.href;
  if (/^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/$/.test(cur_url)) {
    let hp = new HomePage();
    hp.init();
    return;
  }
})();
