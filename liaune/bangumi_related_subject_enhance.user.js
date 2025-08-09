// ==UserScript==
// @name         Bangumi Related Subject Enhance
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.6.4
// @description  显示条目页面关联条目的收藏情况，显示关联条目的排名，单行本设为全部已读/取消全部已读
// @author       Liaune
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @grant        GM_addStyle
// ==/UserScript==
(function () {
  GM_addStyle(`
.relate_rank{
padding: 2px 5px 1px 5px;
background: #b4b020;
color: #FFF;
-webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-border-radius: 4px;
-webkit-border-radius: 4px;
border-radius: 4px;
position: relative;
top: 10px;
}
.relate_rank_1{
padding: 2px 5px 1px 5px;
background: #15d7b3;
color: #FFF;
-webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-border-radius: 4px;
-webkit-border-radius: 4px;
border-radius: 4px
}
.relate_wish{
border-color: #fd59a9;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_collect{
border-color: #3838e6;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_do{
border-color: #15d748;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_on_hold{
border-color: #f6af45;
border-style: solid;
border-width:2px;
border-radius: 4px
}
.relate_dropped{
border-color: #5a5855;
border-style: solid;
border-width:2px;
border-radius: 4px
}

.subCheckIn{
display:block;
top: -20px;
left: 5px;
opacity: 0.5;
position: relative;
padding: 0 2px;
width: 16px;
height: 18px;
background: no-repeat url(/img/ico/ico_eye.png) 50% top;
}

/* 控制面板样式 */
.bangumi-control-panel {
margin: 10px 0;
padding: 10px;
background: #f8f8f8;
border-radius: 4px;
border: 1px solid #ddd;
}

.bangumi-help-text {
margin-top: 8px;
font-size: 12px;
color: #666;
}

/* 关灯模式支持 */
[data-theme="dark"] .bangumi-control-panel {
background: #2a2a2a;
border-color: #444;
}

[data-theme="dark"] .bangumi-help-text {
color: #aaa;
}
`);
  // 检测 indexedDB 兼容性，因为只有新版本浏览器支持
  let indexedDB =
    window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
  // 初始化 indexedDB
  const dbName = "Bangumi_Subject_Info";
  const tableName = "info";
  const indexName = "id";
  if (indexedDB) {
    let request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = (evt) => {
      let db = evt.target.result;
      let objectStore = db.createObjectStore(tableName, { keyPath: indexName });
    };
    request.onsuccess = (evt) => {
      removeCache();
    };
  }
  // 用来记录已经被使用的缓存列表
  let cacheLists = [];
  // 获取本地缓存
  function getCache(itemId, callback) {
    let request = indexedDB.open(dbName, 1);
    request.onsuccess = (evt) => {
      let db = evt.target.result;
      let transaction = db.transaction([tableName], "readonly");
      let objectStore = transaction.objectStore(tableName);
      let reqInfo = objectStore.get(itemId);
      reqInfo.onsuccess = (evt) => {
        let { result } = evt.target;
        if (!!result) {
          cacheLists.push(itemId);
          callback(true, result.value.content);
        } else {
          callback(false);
        }
      };
      reqInfo.onerror = (evt) => {
        callback(false);
      };
    };
  }
  // 记录到本地缓存
  function setCache(itemId, data) {
    let request = indexedDB.open(dbName, 1);
    request.onsuccess = (evt) => {
      let db = evt.target.result;
      let transaction = db.transaction([tableName], "readwrite");
      let objectStore = transaction.objectStore(tableName);
      let cache = {
        content: data,
        created: new Date(),
      };
      let reqInfo = objectStore.put({ id: itemId, value: cache });
      reqInfo.onerror = (evt) => {
        // //console.log('Error', evt.target.error.name);
      };
      reqInfo.onsuccess = (evt) => {};
    };
  }
  // 清除和更新缓存
  function removeCache() {
    let request = indexedDB.open(dbName, 1);
    request.onsuccess = (evt) => {
      let db = evt.target.result;
      let transaction = db.transaction([tableName], "readwrite"),
        store = transaction.objectStore(tableName),
        twoWeek = 1209600000;
      store.openCursor().onsuccess = (evt) => {
        let cursor = evt.target.result;
        if (cursor) {
          if (cacheLists.indexOf(cursor.value.name) !== -1) {
            cursor.value.created = new Date();
            cursor.update(cursor.value);
          } else {
            let now = new Date(),
              last = cursor.value.created;
            if (now - last > twoWeek) {
              cursor.delete();
            }
          }
          cursor.continue();
        }
      };
    };
  }

  let collectStatus,
    securitycode,
    privacy,
    update = 0,
    count = 0,
    count1 = 0,
    flag = 0;

  // 修正选择器以适配新 UI
  let itemsList1 = document.querySelectorAll(
    ".subject_section ul.browserCoverMedium li"
  );
  let itemsList2 = document.querySelectorAll(
    ".subject_section ul.coversSmall li"
  );
  let itemsList3 = document.querySelectorAll(
    ".subject_section ul.browserCoverSmall li"
  );

  let itemsList = [];
  for (let i = 0; i < itemsList1.length; i++) itemsList.push(itemsList1[i]);
  for (let i = 0; i < itemsList2.length; i++) itemsList.push(itemsList2[i]);

  if (localStorage.getItem("bangumi_subject_collectStatus")) {
    collectStatus = JSON.parse(
      localStorage.getItem("bangumi_subject_collectStatus")
    );
  } else {
    collectStatus = {};
  }

  let badgeUserPanel = document.querySelectorAll("#badgeUserPanel a");
  badgeUserPanel.forEach((elem) => {
    if (elem.href.match(/logout/)) {
      securitycode = elem.href.split("/logout/")[1].toString();
    }
  });

  // 找到所有相关的单行本区域
  let targetSections = document.querySelectorAll(".subject_section");
  let mangaSection = null;

  // 查找包含单行本的区域
  targetSections.forEach((section) => {
    let subtitle = section.querySelector(".subtitle");
    if (subtitle && subtitle.textContent.includes("单行本")) {
      mangaSection = section;
    }
  });

  // 如果没找到，使用第一个包含列表的区域
  if (!mangaSection) {
    targetSections.forEach((section) => {
      if (section.querySelector("ul.browserCoverMedium")) {
        mangaSection = section;
      }
    });
  }

  //更新缓存数据
  const updateBtn = createElement("a", "chiiBtn", "javascript:;", "更新");
  updateBtn.addEventListener("click", updateInfo);
  updateBtn.style.marginRight = "10px";

  // 创建控制面板容器
  let controlPanel = document.createElement("div");
  controlPanel.className = "bangumi-control-panel";

  // 私密选项
  let privateLabel = document.createElement("label");
  privateLabel.style.cssText = "margin-right: 15px; cursor: pointer;";
  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.style.marginRight = "5px";
  privateLabel.appendChild(checkbox);
  privateLabel.appendChild(document.createTextNode("私密收藏"));

  checkbox.onclick = function () {
    privacy = checkbox.checked ? 1 : 0;
  };

  // 全部标为已读按钮
  let allCollect = createElement(
    "a",
    "chiiBtn",
    "javascript:;",
    "全部标为已读"
  );
  allCollect.style.marginRight = "10px";
  allCollect.onclick = function () {
    if (
      !confirm(
        `确定要${allCollect.textContent}吗？\n\n${
          privacy ? "将以私密方式收藏" : "将以公开方式收藏"
        }`
      )
    ) {
      return;
    }

    let targetItems = itemsList3.length ? itemsList3 : itemsList;
    if (targetItems.length === 0) {
      alert("没有找到可操作的条目");
      return;
    }

    let i = 0;
    flag = flag == 1 ? 0 : 1;
    allCollect.textContent =
      flag == 1
        ? `全部取消已读 (${targetItems.length})`
        : `全部标为已读 (${targetItems.length})`;
    allCollect.style.backgroundColor = flag ? "#dc3545" : "#28a745";

    let processInterval = setInterval(function () {
      if (i >= targetItems.length) {
        clearInterval(processInterval);
        allCollect.textContent = flag ? "全部标为已读" : "全部取消已读";
        allCollect.style.backgroundColor = "";
        alert("操作完成！");
        return;
      }

      let elem = targetItems[i];
      let avatarLink =
        elem.querySelector("a.avatar") || elem.querySelector("a");
      if (!avatarLink) {
        i++;
        return;
      }

      let { href } = avatarLink;
      let ID = href.split("/subject/")[1];
      let avatarNeue = elem.querySelector("span.avatarNeue");

      if (flag) {
        collectStatus[ID] = "collect";
        if (avatarNeue) {
          avatarNeue.classList.add("relate_collect");
        }
        $.post(`/subject/${ID}/interest/update?gh=${securitycode}`, {
          status: "collect",
          privacy: privacy || 0,
        });
      } else {
        delete collectStatus[ID];
        if (avatarNeue) {
          avatarNeue.classList.remove("relate_collect");
        }
        $.post(`/subject/${ID}/remove?gh=${securitycode}`);
      }

      // 更新按钮文本显示进度
      allCollect.textContent = `${
        (flag ? "标记中... " : "取消中... ") + (i + 1)
      }/${targetItems.length}`;

      i++;
      localStorage.setItem(
        "bangumi_subject_collectStatus",
        JSON.stringify(collectStatus)
      );
    }, 300);
  };

  // 组装控制面板
  controlPanel.appendChild(updateBtn);
  controlPanel.appendChild(privateLabel);
  controlPanel.appendChild(allCollect);

  // 添加说明文字
  let helpText = document.createElement("div");
  helpText.className = "bangumi-help-text";
  helpText.textContent =
    '提示：批量操作会将当前页面所有条目标记为"已收藏"状态，请谨慎使用';
  controlPanel.appendChild(helpText);

  // 插入控制面板
  if (mangaSection) {
    let subtitle = mangaSection.querySelector(".subtitle");
    if (subtitle) {
      subtitle.parentNode.insertBefore(controlPanel, subtitle.nextSibling);
    } else {
      mangaSection.insertBefore(controlPanel, mangaSection.firstChild);
    }
  }

  getInfo(update);
  function updateInfo() {
    count = 0;
    update = 1;
    updateBtn.textContent = "更新中...";
    updateBtn.disabled = true;
    getInfo(update);
  }

  function createElement(type, className, href, textContent) {
    let Element = document.createElement(type);
    Element.className = className;
    Element.href = href;
    Element.textContent = textContent;
    return Element;
  }

  function showCheckIn(elem, ID) {
    // 检查是否已经存在 checkIn 按钮，避免重复添加
    let avatarLink = elem.querySelector("a.avatar") || elem.querySelector("a");
    if (!avatarLink) {
      return;
    }

    let existingCheckIn = avatarLink.querySelector(".subCheckIn");
    if (existingCheckIn) {
      return; // 如果已经存在，直接返回
    }

    let checkIn = createElement("a", "subCheckIn", "javascript:;");
    let flag = 0;
    let avatarNeue = elem.querySelector("span.avatarNeue");
    checkIn.addEventListener("click", function () {
      flag = flag == 1 ? 0 : 1;
      if (flag) {
        checkIn.style.backgroundPosition = "bottom left";
        collectStatus[ID] = "collect";
        if (avatarNeue) {
          avatarNeue.classList.add("relate_collect");
        }
        $.post(`/subject/${ID}/interest/update?gh=${securitycode}`, {
          status: "collect",
          privacy: privacy || 0,
        });
      } else {
        checkIn.style.backgroundPosition = "top left";
        delete collectStatus[ID];
        if (avatarNeue) {
          avatarNeue.classList.remove("relate_collect");
        }
        $.post(`/subject/${ID}/remove?gh=${securitycode}`);
      }
      localStorage.setItem(
        "bangumi_subject_collectStatus",
        JSON.stringify(collectStatus)
      );
    });

    avatarLink.appendChild(checkIn);
  }

  function getInfo(update) {
    if (itemsList.length) {
      let fetchList = [],
        fetchList1 = [];
      itemsList.forEach((elem) => {
        // 检查元素是否在单行本区域内，如果不是才设置固定高度
        let isInMangaSection = mangaSection && mangaSection.contains(elem);
        if (!isInMangaSection) {
          elem.style.height = "200px";
        }

        let avatarLink =
          elem.querySelector("a.avatar") || elem.querySelector("a");
        if (!avatarLink) {
          return;
        }

        let { href } = avatarLink;
        let href1 = href.replace(/subject/, "update");
        let ID = href.split("/subject/")[1];
        getCache(ID, function (success, result) {
          if (success && !update) {
            displayRank(result.rank, elem);
          } else {
            fetchList.push(elem);
          }
        });
        if (collectStatus[ID] != "collect") {
          showCheckIn(elem, ID);
        }
        if (collectStatus[ID] && !update) {
          displayCollect(collectStatus[ID], elem);
        } else {
          fetchList1.push(elem);
        }
      });
      let i = 0,
        j = 0;
      let getitemsList = setInterval(function () {
        let elem = fetchList[i];
        if (!elem) {
          console.log(i);
        } else {
          let avatarLink =
            elem.querySelector("a.avatar") || elem.querySelector("a");
          if (avatarLink) {
            let { href } = avatarLink;
            showRank(href, elem);
          }
          i++;
          //console.log(i);
        }
        if (count >= itemsList.length) {
          clearInterval(getitemsList);
        }
      }, 500);
      let getitemsList1 = setInterval(function () {
        let elem = fetchList1[j];
        if (!elem) {
          console.log(j);
        } else {
          let avatarLink =
            elem.querySelector("a.avatar") || elem.querySelector("a");
          if (avatarLink) {
            let { href } = avatarLink;
            let href1 = href.replace(/subject/, "update");
            showCollect(href1, elem);
          }
          j++;
          //console.log(j);
        }
        if (count1 >= itemsList.length) {
          clearInterval(getitemsList1);
        }
      }, 500);
    }
    if (itemsList3.length) {
      itemsList3.forEach((elem) => {
        let avatarLink =
          elem.querySelector("a.avatar") || elem.querySelector("a");
        if (!avatarLink) {
          return;
        }

        let { href } = avatarLink;
        let ID = href.split("/subject/")[1];
        if (collectStatus[ID]) {
          displayCollect(collectStatus[ID], elem);
        } else if (collectStatus[ID] != "collect") {
          showCheckIn(elem, ID);
        }
      });
    }

    let thisItem = window.location.href.replace(/subject/, "update");
    fetch(thisItem, { credentials: "include" })
      .then((data) => {
        return new Promise(function (resovle, reject) {
          let targetStr = data.text();
          resovle(targetStr);
        });
      })
      .then((targetStr) => {
        let Match = targetStr.match(
          /"GenInterestBox\('(\S+?)'\)" checked="checked"/
        );
        let interest = Match ? Match[1] : null;
        let ID = thisItem.split("/update/")[1];
        if (interest) {
          collectStatus[ID] = interest;
        } else if (collectStatus[ID]) {
          delete collectStatus[ID];
        }
        localStorage.setItem(
          "bangumi_subject_collectStatus",
          JSON.stringify(collectStatus)
        );
      });
  }

  function showCollect(href, elem) {
    fetch(href, { credentials: "include" })
      .then((data) => {
        return new Promise(function (resovle, reject) {
          let targetStr = data.text();
          resovle(targetStr);
        });
      })
      .then((targetStr) => {
        let Match = targetStr.match(
          /"GenInterestBox\('(\S+?)'\)" checked="checked"/
        );
        let interest = Match ? Match[1] : null;
        let ID = href.split("/update/")[1];
        if (Match) {
          collectStatus[ID] = "collect";
          localStorage.setItem(
            "bangumi_subject_collectStatus",
            JSON.stringify(collectStatus)
          );
        }
        if (!update) {
          displayCollect(interest, elem);
        }
      });
  }

  function displayCollect(interest, elem) {
    let avatarNeue = elem.querySelector("span.avatarNeue");
    if (!avatarNeue) {
      return;
    }

    // 先清除所有收藏状态的 CSS 类，避免重复添加
    avatarNeue.classList.remove(
      "relate_wish",
      "relate_collect",
      "relate_do",
      "relate_on_hold",
      "relate_dropped"
    );

    if (interest == "wish") {
      avatarNeue.classList.add("relate_wish");
    } else if (interest == "collect") {
      avatarNeue.classList.add("relate_collect");
    } else if (interest == "do") {
      avatarNeue.classList.add("relate_do");
    } else if (interest == "on_hold") {
      avatarNeue.classList.add("relate_on_hold");
    } else if (interest == "dropped") {
      avatarNeue.classList.add("relate_dropped");
    }
    count1++;
  }

  function showRank(href, elem) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", href);
    xhr.withCredentials = true;
    xhr.responseType = "document";
    xhr.send();
    xhr.onload = function () {
      let d = xhr.responseXML;
      let nameinfo = d.querySelector("#infobox li");
      let name_cn =
        nameinfo && nameinfo.innerText.match(/中文名: (\.*)/)
          ? nameinfo.innerText.match(/中文名: (\.*)/)[1]
          : null;
      //获取排名
      let ranksp = d.querySelector(
        "#panelInterestWrapper .global_score small.alarm"
      );
      let rank = ranksp ? ranksp.innerText.match(/\d+/)[0] : null;
      //获取站内评分和评分人数
      let scoreElement = d.querySelector(
        "#panelInterestWrapper .global_score span.number"
      );
      let score = scoreElement ? scoreElement.innerText : null;
      let votesElement = d.querySelector("#ChartWarpper small.grey span");
      let votes = votesElement ? votesElement.innerText : null;
      //获取好友评分和评分人数
      let frdScore = d.querySelector("#panelInterestWrapper .frdScore");
      let score_f = frdScore
        ? frdScore.querySelector("span.num").innerText
        : null;
      let votes_f = frdScore
        ? frdScore.querySelector("a.l").innerText.match(/\d+/)[0]
        : null;
      let score_u = 0;
      let info = {
        name_cn: name_cn,
        rank: rank,
        score: score,
        votes: votes,
        score_f: score_f,
        votes_f: votes_f,
        score_u: score_u,
      };
      let ID = href.split("/subject/")[1];
      setCache(ID, info);
      if (!update) {
        displayRank(rank, elem);
      } else {
        count += 1;
        updateBtn.textContent = `更新中... (${count}/${itemsList.length})`;
        if (count == itemsList.length) {
          updateBtn.textContent = "更新完毕！";
          updateBtn.disabled = false;
          setTimeout(() => {
            updateBtn.textContent = "更新";
          }, 2000);
        }
      }
    };
  }

  function displayRank(rank, elem) {
    // 检查是否已经存在排名标签，避免重复添加
    let existingRank = elem.querySelector(".rank");
    if (existingRank) {
      // 如果已经存在，更新内容而不是添加新的
      if (rank) {
        existingRank.className = "rank";
        if (rank <= 1500) {
          existingRank.classList.add("relate_rank_1");
        } else {
          existingRank.classList.add("relate_rank");
        }
        existingRank.innerHTML = `<small>Rank </small>${rank}`;
        let isInMangaSection = mangaSection && mangaSection.contains(elem);
        if (isInMangaSection) {
          existingRank.style.top = "0";
        }
      }
      count++;
      return;
    }

    let rankSp = createElement("span", "rank");
    if (rank) {
      if (rank <= 1500) {
        rankSp.classList.add("relate_rank_1");
      } else {
        rankSp.classList.add("relate_rank");
      }
      rankSp.innerHTML = `<small>Rank </small>${rank}`;
      elem.appendChild(rankSp);
      let isInMangaSection = mangaSection && mangaSection.contains(elem);
      if (isInMangaSection) {
        rankSp.style.top = "0";
      }
    }
    count++;
  }
})();
