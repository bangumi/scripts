// ==UserScript==
// @name         Bangumi Related Subject Enhance
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      0.6.7
// @description  显示条目页面关联条目的收藏情况，显示关联条目的排名，单行本设为全部已读/取消全部已读
// @author       Liaune
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// @grant        GM_addStyle
// ==/UserScript==

(() => {
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
opacity: 0.5;
position: relative;
padding: 0 5px;
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

  // 常量定义
  const CONSTANTS = {
    COLLECT_STATUS_KEY: "bangumi_subject_collectStatus",
    DB_NAME: "Bangumi_Subject_Info",
    FETCH_INTERVAL: 500,
    HIGH_RANK_THRESHOLD: 1500,
    INDEX_NAME: "id",
    TABLE_NAME: "info",
    TWO_WEEKS_MS: 1209600000,
  };

  // 状态管理
  const state = {
    accessedCacheItems: [],
    collectFetchCount: 0,
    collectStatus: {},
    isAllCollected: false,
    isUpdating: false,
    privacy: 0,
    rankFetchCount: 0,
    securityCode: null,
  };

  // 获取 IndexedDB 实例
  const indexedDB =
    window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;

  // 初始化 indexedDB
  if (indexedDB) {
    const request = indexedDB.open(CONSTANTS.DB_NAME, 1);
    request.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      db.createObjectStore(CONSTANTS.TABLE_NAME, {
        keyPath: CONSTANTS.INDEX_NAME,
      });
    };
    request.onsuccess = () => {
      cleanExpiredCache();
    };
  }

  // 获取缓存数据
  const getCachedData = (subjectId, callback) => {
    const request = indexedDB.open(CONSTANTS.DB_NAME, 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([CONSTANTS.TABLE_NAME], "readonly");
      const store = transaction.objectStore(CONSTANTS.TABLE_NAME);
      const getRequest = store.get(subjectId);

      getRequest.onsuccess = (event) => {
        const { result } = event.target;
        if (result) {
          state.accessedCacheItems.push(subjectId);
          callback(true, result.value.content);
        } else {
          callback(false);
        }
      };

      getRequest.onerror = () => callback(false);
    };
  };

  // 保存缓存数据
  const setCachedData = (subjectId, data) => {
    const request = indexedDB.open(CONSTANTS.DB_NAME, 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([CONSTANTS.TABLE_NAME], "readwrite");
      const store = transaction.objectStore(CONSTANTS.TABLE_NAME);
      const cacheData = {
        content: data,
        created: new Date(),
      };
      store.put({ id: subjectId, value: cacheData });
    };
  };

  // 清理过期缓存
  const cleanExpiredCache = () => {
    const request = indexedDB.open(CONSTANTS.DB_NAME, 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([CONSTANTS.TABLE_NAME], "readwrite");
      const store = transaction.objectStore(CONSTANTS.TABLE_NAME);

      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) {
          return;
        }

        const cacheItem = cursor.value;
        if (state.accessedCacheItems.includes(cacheItem.id)) {
          cacheItem.value.created = new Date();
          cursor.update(cacheItem);
        } else {
          const now = new Date();
          const cacheAge = now - new Date(cacheItem.value.created);
          if (cacheAge > CONSTANTS.TWO_WEEKS_MS) {
            cursor.delete();
          }
        }
        cursor.continue();
      };
    };
  };

  // 创建带属性的 DOM 元素
  const createElement = (tagName, className, href, textContent) => {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (href) {
      element.href = href;
    }
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  };

  const isGuest = document.querySelector("div.guest");

  // 添加收藏切换按钮
  const addCollectToggleButton = (element, subjectId) => {
    if (isGuest || element.querySelector("a.collect-toggle")) {
      return;
    }

    const toggleButton = createElement("a", "collect-toggle", "javascript:;");
    let isCollected = state.collectStatus[subjectId] === "collect";
    const coverNeue = element.querySelector("span.coverNeue");

    toggleButton.style.backgroundPosition = isCollected
      ? "bottom left"
      : "top left";

    toggleButton.addEventListener("click", () => {
      isCollected = !isCollected;
      updateCollectStatus(subjectId, isCollected, coverNeue, toggleButton);
    });

    element.querySelector("a.avatar").append(toggleButton);
  };

  // 更新收藏状态
  const updateCollectStatus = (
    subjectId,
    isCollected,
    coverNeue,
    toggleButton
  ) => {
    const statusClass = "collect-status--collect";

    if (isCollected) {
      toggleButton.style.backgroundPosition = "bottom left";
      state.collectStatus[subjectId] = "collect";
      coverNeue.classList.add("collect-status", statusClass);

      fetch(`/subject/${subjectId}/interest/update?gh=${state.securityCode}`, {
        method: "POST",
        body: new URLSearchParams({
          status: "collect",
          privacy: state.privacy,
        }),
      });
    } else {
      toggleButton.style.backgroundPosition = "top left";
      delete state.collectStatus[subjectId];
      coverNeue.classList.remove("collect-status", statusClass);

      fetch(`/subject/${subjectId}/remove?gh=${state.securityCode}`, {
        method: "POST",
      });
    }
    saveCollectStatus();
  };

  // 保存收藏状态到本地存储
  const saveCollectStatus = () => {
    localStorage.setItem(
      CONSTANTS.COLLECT_STATUS_KEY,
      JSON.stringify(state.collectStatus)
    );
  };

  // 显示收藏状态
  const renderCollectStatus = (interest, element) => {
    const statusMap = {
      wish: "collect-status--wish",
      collect: "collect-status--collect",
      do: "collect-status--do",
      on_hold: "collect-status--on-hold",
      dropped: "collect-status--dropped",
    };

    const statusClass = statusMap[interest];
    if (statusClass) {
      const coverNeue = element.querySelector("span.coverNeue");
      coverNeue.classList.add("collect-status", statusClass);
    }
    state.collectFetchCount++;
  };

  // 显示排名徽章
  const renderRankBadge = (rank, element) => {
    if (!rank) {
      state.rankFetchCount++;
      return;
    }

    const rankSpan = createElement("span", "rank");
    rankSpan.classList.add("rank-badge");

    const badgeClass =
      rank <= CONSTANTS.HIGH_RANK_THRESHOLD
        ? "rank-badge--high"
        : "rank-badge--normal";
    rankSpan.classList.add(badgeClass);
    rankSpan.innerHTML = `<small>Rank </small>${rank}`;

    const subjectLinks = element.querySelectorAll('a[href^="/subject/"]');
    const lastSubjectLink = subjectLinks[subjectLinks.length - 1];
    lastSubjectLink.parentNode.insertBefore(rankSpan, lastSubjectLink);

    state.rankFetchCount++;
  };

  // 获取收藏数据
  const fetchCollectData = (url, element) => {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const interestMatch = html.match(
          /"GenInterestBox\('(\S+?)'\)" checked="checked"/
        );
        const interest = interestMatch ? interestMatch[1] : null;
        const subjectId = url.split("/update/")[1];

        if (interestMatch) {
          state.collectStatus[subjectId] = interest;
          saveCollectStatus();
        }

        if (!state.isUpdating) {
          renderCollectStatus(interest, element);
        }
      })
      .catch((error) => {
        console.error(`Error fetching collect data: ${url}`, error);
        state.collectFetchCount++;
      });
  };

  // 获取排名数据
  const fetchRankData = (url, element) => {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");

        // 解析条目信息
        const nameInfo = doc.querySelector("#infobox li");
        const nameCN = nameInfo?.innerText.match(/中文名: (.*)/)?.[1] || null;

        // 获取排名
        const rankElement = doc.querySelector(
          "#panelInterestWrapper .global_score small.alarm"
        );
        const rank = rankElement?.innerText.match(/\d+/)?.[0] || null;

        // 获取站内评分和评分人数
        const scoreElement = doc.querySelector(
          "#panelInterestWrapper .global_score span.number"
        );
        const score = scoreElement?.innerText;

        const votesElement = doc.querySelector("#ChartWarpper small.grey span");
        const votes = votesElement?.innerText;

        // 获取好友评分和评分人数
        const friendScoreElement = doc.querySelector(
          "#panelInterestWrapper .frdScore"
        );
        const friendScore =
          friendScoreElement?.querySelector("span.num")?.innerText || null;
        const friendVotes =
          friendScoreElement
            ?.querySelector("a.l")
            ?.innerText.match(/\d+/)?.[0] || null;

        const subjectInfo = {
          name_cn: nameCN,
          rank,
          score,
          votes,
          score_f: friendScore,
          votes_f: friendVotes,
          score_u: 0,
        };

        const subjectId = url.split("/subject/")[1];
        setCachedData(subjectId, subjectInfo);

        if (!state.isUpdating) {
          renderRankBadge(rank, element);
        } else {
          state.rankFetchCount++;
          updateProgressDisplay();
        }
      });
  };

  // 更新进度显示
  const updateProgressDisplay = () => {
    const updateButton = document.querySelector(".update-btn");
    if (!updateButton) {
      return;
    }

    const progress = `${state.rankFetchCount}/${itemsList.length}`;
    updateButton.textContent = `更新中... (${progress})`;

    if (state.rankFetchCount === itemsList.length) {
      updateButton.textContent = "更新完毕！";
      state.isUpdating = false;
      updateButton.style.opacity = "1";
      updateButton.style.pointerEvents = "auto";

      setTimeout(() => {
        updateButton.textContent = "更新排名";
      }, 1000);
    }
  };

  // 处理主列表项目
  const processMainListItems = (isUpdating) => {
    const rankFetchList = [];
    const collectFetchList = [];

    for (const elem of itemsList) {
      const { href } = elem.querySelector("a.avatar");
      const subjectId = href.split("/subject/")[1];

      getCachedData(subjectId, (success, result) => {
        if (success && !isUpdating) {
          renderRankBadge(result.rank, elem);
        } else {
          rankFetchList.push(elem);
        }
      });

      addCollectToggleButton(elem, subjectId);

      if (state.collectStatus[subjectId] && !isUpdating) {
        renderCollectStatus(state.collectStatus[subjectId], elem);
      } else {
        collectFetchList.push(elem);
      }
    }

    let rankFetchIndex = 0;
    let collectFetchIndex = 0;

    const rankFetchInterval = setInterval(() => {
      const elem = rankFetchList[rankFetchIndex];
      if (elem) {
        const { href } = elem.querySelector("a.avatar");
        fetchRankData(href, elem);
        rankFetchIndex++;
      }
      if (state.rankFetchCount >= itemsList.length) {
        clearInterval(rankFetchInterval);
      }
    }, CONSTANTS.FETCH_INTERVAL);

    const collectFetchInterval = setInterval(() => {
      const elem = collectFetchList[collectFetchIndex];
      if (elem) {
        const { href } = elem.querySelector("a.avatar");
        const collectHref = href.replace(/subject/, "update");
        fetchCollectData(collectHref, elem);
        collectFetchIndex++;
      }
      if (state.collectFetchCount >= itemsList.length) {
        clearInterval(collectFetchInterval);
      }
    }, CONSTANTS.FETCH_INTERVAL);

    for (const elem of volumeSubjects) {
      const { href } = elem.querySelector("a");
      const subjectId = href.split("/subject/")[1];

      addCollectToggleButton(elem, subjectId);

      if (state.collectStatus[subjectId]) {
        renderCollectStatus(state.collectStatus[subjectId], elem);
      }
    }

    const thisItem = window.location.href.replace(/subject/, "update");
    fetch(thisItem)
      .then((data) => data.text())
      .then((targetStr) => {
        const match = targetStr.match(
          /"GenInterestBox\('(\S+?)'\)" checked="checked"/
        );
        const interest = match ? match[1] : null;
        const subjectId = thisItem.split("/update/")[1];
        if (interest) {
          state.collectStatus[subjectId] = interest;
        } else if (state.collectStatus[subjectId]) {
          delete state.collectStatus[subjectId];
        }
        saveCollectStatus();
      })
      .catch((error) => {
        console.error("Error fetching current item status:", error);
      });
  };

  // 更新条目信息
  const updateSubjectInfo = () => {
    if (state.isUpdating) {
      return;
    }

    state.rankFetchCount = 0;
    state.isUpdating = true;
    updateBtn.style.opacity = "0.5";
    updateBtn.style.pointerEvents = "none";
    processMainListItems(true);
  };

  let updateBtn;

  // DOM 选择器
  const selectors = {
    related:
      "#columnSubjectHomeB ul.browserCoverMedium:not(.crtList) li:not(:has(a.thumbTipSmall))",
    recommended: "#columnSubjectHomeB ul.coversSmall li",
    volume: "#columnSubjectHomeB ul.browserCoverMedium li:has(a.thumbTipSmall)",
    logoutLinks: "#badgeUserPanel a",
  };

  const relatedSubjects = document.querySelectorAll(selectors.related);
  const recommendedSubjects = document.querySelectorAll(selectors.recommended);
  const volumeSubjects = document.querySelectorAll(selectors.volume);

  const itemsList = [...relatedSubjects, ...recommendedSubjects];

  // 初始化收藏状态
  state.collectStatus = JSON.parse(
    localStorage.getItem(CONSTANTS.COLLECT_STATUS_KEY) || "{}"
  );

  // 获取安全码
  const logoutLinks = document.querySelectorAll(selectors.logoutLinks);
  for (const link of logoutLinks) {
    if (link.href.includes("/logout/")) {
      state.securityCode = link.href.split("/logout/")[1];
      break;
    }
  }

  // 初始化更新按钮
  updateBtn = createElement(
    "a",
    "chiiBtn update-btn",
    "javascript:;",
    "更新排名"
  );
  updateBtn.style.margin = "10px 0";
  updateBtn.addEventListener("click", () => {
    if (!state.isUpdating) {
      updateSubjectInfo();
    }
  });

  // 添加更新按钮到页面
  if (itemsList.length > 0) {
    const relatedSubjectSection = Array.from(
      document.querySelectorAll("#columnSubjectHomeB .subject_section .clearit")
    ).find((el) => {
      const subtitleText = el.querySelector("h2.subtitle")?.textContent;
      return (
        subtitleText &&
        (subtitleText.includes("关联条目") ||
          subtitleText.includes("大概会喜欢"))
      );
    });
    relatedSubjectSection?.append(updateBtn);
  }

  // 初始化加载数据
  processMainListItems(false);

  // 初始化单行本控制面板
  if (!isGuest && volumeSubjects.length > 0) {
    const mangaControlPanel = document.createElement("div");
    mangaControlPanel.className = "manga-control-panel";

    // 私密收藏复选框
    const privateLabel = document.createElement("label");
    privateLabel.style.cssText = "margin-right: 15px; cursor: pointer;";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.marginRight = "5px";
    checkbox.addEventListener("click", () => {
      state.privacy = checkbox.checked ? 1 : 0;
    });
    privateLabel.append(checkbox, document.createTextNode("私密收藏"));

    // 检查是否全部已收藏
    const allCollected = Array.from(volumeSubjects).every((element) => {
      const { href } = element.querySelector("a.avatar");
      const subjectId = href.split("/subject/")[1];
      return state.collectStatus[subjectId] === "collect";
    });

    state.isAllCollected = allCollected;

    const allCollectButton = createElement(
      "a",
      "chiiBtn",
      "javascript:;",
      state.isAllCollected ? "全部取消已读" : "全部标为已读"
    );
    // 全部收藏/取消收藏事件
    allCollectButton.addEventListener("click", () => {
      if (!confirm(`确定要${allCollectButton.textContent}吗？`)) {
        return;
      }

      state.isAllCollected = !state.isAllCollected;
      allCollectButton.textContent = state.isAllCollected
        ? "全部取消已读"
        : "全部标为已读";

      let volumeIndex = 0;
      const volumeFetchInterval = setInterval(() => {
        if (volumeIndex >= volumeSubjects.length) {
          clearInterval(volumeFetchInterval);
          return;
        }

        const element = volumeSubjects[volumeIndex];
        const { href } = element.querySelector("a.avatar");
        const subjectId = href.split("/subject/")[1];
        const coverNeue = element.querySelector("span.coverNeue");
        const statusClass = "collect-status--collect";

        if (state.isAllCollected) {
          state.collectStatus[subjectId] = "collect";
          coverNeue.classList.add("collect-status", statusClass);

          fetch(
            `/subject/${subjectId}/interest/update?gh=${state.securityCode}`,
            {
              method: "POST",
              body: new URLSearchParams({
                status: "collect",
                privacy: state.privacy,
              }),
            }
          );
        } else {
          delete state.collectStatus[subjectId];
          coverNeue.classList.remove("collect-status", statusClass);

          fetch(`/subject/${subjectId}/remove?gh=${state.securityCode}`, {
            method: "POST",
          });
        }

        volumeIndex++;
        saveCollectStatus();
      }, CONSTANTS.FETCH_INTERVAL);
    });

    // 组装控制面板
    mangaControlPanel.append(privateLabel, allCollectButton);

    const volumeListContainer = volumeSubjects[0].parentElement;
    const volumeSectionContainer = volumeListContainer.parentElement;
    volumeSectionContainer.insertBefore(mangaControlPanel, volumeListContainer);
  }
})();
