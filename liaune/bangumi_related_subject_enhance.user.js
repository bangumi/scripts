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
.rank-badge {
padding: 2px 5px;
color: #FFF;
-webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
-moz-border-radius: 4px;
-webkit-border-radius: 4px;
border-radius: 4px;
position: relative;
top: -12px;
display: inline-block;
}
.rank-badge--high {
background: #15d7b3;
}
.rank-badge--normal {
background: #b4b020;
}
.collect-status {
border: 2px solid;
border-radius: 4px;
box-sizing: border-box;
}
.collect-status--wish {
border-color: #fd59a9;
}
.collect-status--collect {
border-color: #3838e6;
}
.collect-status--do {
border-color: #15d748;
}
.collect-status--on-hold {
border-color: #f6af45;
}
.collect-status--dropped {
border-color: #5a5855;
}

.collect-toggle {
display: block;
top: -20px;
left: 5px;
opacity: 0.5;
position: relative;
padding: 0 2px;
width: 16px;
height: 18px;
background: no-repeat url(/img/ico/ico_eye.png) 50% top;
}

/* 单行本控制面板样式 */
.manga-control-panel {
margin: 10px 0;
padding: 10px;
background: #f8f8f8;
border-radius: 4px;
border: 1px solid #ddd;
width: 205px;
}

/* 关灯模式支持 */
[data-theme="dark"] .manga-control-panel {
background: #2a2a2a;
border-color: #444;
}

ul.coversSmall li {
height: 100%;
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

  let relatedSubjects = document.querySelectorAll(
    "#columnSubjectHomeB ul.browserCoverMedium li:not(:has(a.thumbTipSmall))"
  );
  let recommendedSubjects = document.querySelectorAll(
    "#columnSubjectHomeB ul.coversSmall li"
  );
  let volumeSubjects = document.querySelectorAll(
    "#columnSubjectHomeB ul.browserCoverMedium li:has(a.thumbTipSmall)"
  );

  let itemsList = [...relatedSubjects, ...recommendedSubjects];

  collectStatus = JSON.parse(
    localStorage.getItem("bangumi_subject_collectStatus") || "{}"
  );

  let badgeUserPanel = document.querySelectorAll("#badgeUserPanel a");
  for (const elem of badgeUserPanel) {
    if (elem.href.match(/logout/)) {
      securitycode = elem.href.split("/logout/")[1].toString();
    }
  }

  // 更新排名数据
  let isUpdating = false;

  const updateBtn = createElement("a", "chiiBtn", "javascript:;", "更新排名");
  updateBtn.style.margin = "10px 0";
  updateBtn.addEventListener("click", () => {
    if (isUpdating) {
      return;
    }

    updateInfo();
  });

  if (volumeSubjects.length) {
    document
      .querySelectorAll("#columnSubjectHomeB .subject_section .clearit")[1]
      .append(updateBtn);
  } else {
    document
      .querySelectorAll("#columnSubjectHomeB .subject_section .clearit")[0]
      .append(updateBtn);
  }

  getInfo(update);

  function updateInfo() {
    if (isUpdating) {
      return;
    }

    count = 0;
    update = 1;
    isUpdating = true;
    updateBtn.style.opacity = "0.5";
    updateBtn.style.pointerEvents = "none";
    getInfo(update);
  }

  if (volumeSubjects.length) {
    let mangaControlPanel = document.createElement("div");
    mangaControlPanel.className = "manga-control-panel";

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

    let allCollect = createElement(
      "a",
      "chiiBtn",
      "javascript:;",
      "全部标为已读"
    );
    allCollect.onclick = function () {
      if (!confirm(`确定要${allCollect.textContent}吗？`)) {
        return;
      }

      let volumeIndex = 0;
      flag = flag == 1 ? 0 : 1;
      allCollect.textContent = flag == 1 ? "全部取消已读" : "全部标为已读";

      let getVolumeSubjects = setInterval(function () {
        let elem = volumeSubjects[volumeIndex];
        let { href } = elem.querySelector("a.avatar");
        let ID = href.split("/subject/")[1];
        let avatarNeue = elem.querySelector("span.avatarNeue");

        if (flag) {
          collectStatus[ID] = "collect";
          avatarNeue.classList.add("collect-status", "collect-status--collect");
          fetch(`/subject/${ID}/interest/update?gh=${securitycode}`, {
            method: "POST",
            body: new URLSearchParams({
              status: "collect",
              privacy: privacy,
            }),
          });
        } else {
          delete collectStatus[ID];
          avatarNeue.classList.remove(
            "collect-status",
            "collect-status--collect"
          );
          fetch(`/subject/${ID}/remove?gh=${securitycode}`, {
            method: "POST",
          });
        }

        volumeIndex++;
        localStorage.setItem(
          "bangumi_subject_collectStatus",
          JSON.stringify(collectStatus)
        );
        if (volumeIndex >= volumeSubjects.length) {
          clearInterval(getVolumeSubjects);
        }
      }, 300);
    };

    mangaControlPanel.appendChild(privateLabel);
    mangaControlPanel.appendChild(allCollect);

    const clearitElement = document.querySelector(
      "#columnSubjectHomeB .subject_section .clearit"
    );
    clearitElement.parentNode.insertBefore(mangaControlPanel, clearitElement);
  }

  function createElement(type, className, href, textContent) {
    let Element = document.createElement(type);
    Element.className = className;
    Element.href = href;
    Element.textContent = textContent;
    return Element;
  }

  function showCheckIn(elem, ID) {
    if (elem.querySelector("a.collect-toggle")) {
      return;
    }

    let checkIn = createElement("a", "collect-toggle", "javascript:;");
    let flag = collectStatus[ID] === "collect" ? 1 : 0;
    let avatarNeue = elem.querySelector("span.avatarNeue");
    checkIn.addEventListener("click", function () {
      flag = flag == 1 ? 0 : 1;
      if (flag) {
        checkIn.style.backgroundPosition = "bottom left";
        collectStatus[ID] = "collect";
        avatarNeue.classList.add("collect-status", "collect-status--collect");
        fetch(`/subject/${ID}/interest/update?gh=${securitycode}`, {
          method: "POST",
          body: new URLSearchParams({
            status: "collect",
            privacy: privacy,
          }),
        });
      } else {
        checkIn.style.backgroundPosition = "top left";
        delete collectStatus[ID];
        avatarNeue.classList.remove(
          "collect-status",
          "collect-status--collect"
        );
        fetch(`/subject/${ID}/remove?gh=${securitycode}`, {
          method: "POST",
        });
      }
      localStorage.setItem(
        "bangumi_subject_collectStatus",
        JSON.stringify(collectStatus)
      );
    });
    elem.querySelector("a.avatar").append(checkIn);
  }

  function getInfo(update) {
    if (itemsList.length) {
      let fetchList = [],
        fetchList1 = [];
      for (const elem of itemsList) {
        let { href } = elem.querySelector("a.avatar");
        let href1 = href.replace(/subject/, "update");
        let ID = href.split("/subject/")[1];
        getCache(ID, function (success, result) {
          if (success && !update) {
            displayRank(result.rank, elem);
          } else {
            fetchList.push(elem);
          }
        });

        showCheckIn(elem, ID);

        if (collectStatus[ID] && !update) {
          displayCollect(collectStatus[ID], elem);
        } else {
          fetchList1.push(elem);
        }
      }

      let rankFetchIndex = 0,
        collectFetchIndex = 0;
      let getitemsList = setInterval(function () {
        let elem = fetchList[rankFetchIndex];
        if (!elem) {
          // console.log(rankFetchIndex);
        } else {
          let { href } = elem.querySelector("a.avatar");
          showRank(href, elem);
          rankFetchIndex++;
          //console.log(rankFetchIndex);
        }
        if (count >= itemsList.length) {
          clearInterval(getitemsList);
        }
      }, 500);
      let getitemsList1 = setInterval(function () {
        let elem = fetchList1[collectFetchIndex];
        if (!elem) {
          // console.log(collectFetchIndex);
        } else {
          let { href } = elem.querySelector("a.avatar");
          let href1 = href.replace(/subject/, "update");
          showCollect(href1, elem);
          collectFetchIndex++;
          //console.log(collectFetchIndex);
        }
        if (count1 >= itemsList.length) {
          clearInterval(getitemsList1);
        }
      }, 500);
    }

    if (volumeSubjects.length) {
      for (const elem of volumeSubjects) {
        let { href } = elem.querySelector("a");
        let ID = href.split("/subject/")[1];
        if (collectStatus[ID]) {
          displayCollect(collectStatus[ID], elem);
        } else if (collectStatus[ID] != "collect") {
          showCheckIn(elem, ID);
        }
      }
    }

    let thisItem = window.location.href.replace(/subject/, "update");
    fetch(thisItem)
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
    fetch(href)
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
    if (interest == "wish") {
      avatarNeue.classList.add("collect-status", "collect-status--wish");
    } else if (interest == "collect") {
      avatarNeue.classList.add("collect-status", "collect-status--collect");
    } else if (interest == "do") {
      avatarNeue.classList.add("collect-status", "collect-status--do");
    } else if (interest == "on_hold") {
      avatarNeue.classList.add("collect-status", "collect-status--on-hold");
    } else if (interest == "dropped") {
      avatarNeue.classList.add("collect-status", "collect-status--dropped");
    }
    count1++;
  }

  function showRank(href, elem) {
    fetch(href)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const d = parser.parseFromString(html, "text/html");
        let nameinfo = d.querySelector("#infobox li");
        let name_cn = nameinfo.innerText.match(/中文名: (\.*)/)
          ? nameinfo.innerText.match(/中文名: (\.*)/)[1]
          : null;
        //获取排名
        let ranksp = d.querySelector(
          "#panelInterestWrapper .global_score small.alarm"
        );
        let rank = ranksp ? ranksp.innerText.match(/\d+/)[0] : null;
        //获取站内评分和评分人数
        let score = d.querySelector(
          "#panelInterestWrapper .global_score span.number"
        ).innerText;
        let votes = d.querySelector("#ChartWarpper small.grey span").innerText;
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
            isUpdating = false;
            updateBtn.style.opacity = "1";
            updateBtn.style.pointerEvents = "auto";
            setTimeout(() => {
              updateBtn.textContent = "更新排名";
            }, 1000);
          }
        }
      });
  }

  function displayRank(rank, elem) {
    let rankSp = createElement("span", "rank");
    if (rank) {
      rankSp.classList.add("rank-badge");
      if (rank <= 1500) {
        rankSp.classList.add("rank-badge--high");
      } else {
        rankSp.classList.add("rank-badge--normal");
      }
      rankSp.innerHTML = `<small>Rank </small>${rank}`;
      const subjectLink = [...elem.querySelectorAll('a[href^="/subject/"]')].at(
        -1
      );
      subjectLink.parentNode.insertBefore(rankSp, subjectLink);
    }
    count++;
  }
})();
