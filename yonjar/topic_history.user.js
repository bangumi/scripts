// ==UserScript==
// @name         bangumi浏览足迹
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.2
// @description  记录bangumi的话题浏览历史
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/((blog|character|person|(group|subject)\/topic|rakuen\/topic\/(crt|group|subject|prsn))\/\S+)?(\?.*)?(#.*)?$/
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    #yonjar_history_tpc .timeline{
        max-height: 400px;
        overflow: auto;
    }
    .btn_del{
        background: transparent url(/img/ico/icons.gif) no-repeat scroll -2px -33px;
        display: block;
        height: 13px;
        text-indent: -999em;
        width: 13px;
        -moz-opacity: 0.8;
        opacity: 0.8;
        filter: alpha(opacity=80);
        overflow: hidden;
        float: right;
    }
    .btn_del:hover {
        background-position: -2px -46px;
    }
    `);

class BgmHistory {
  constructor() {
    if (!localStorage.getItem("bgm_history_by_yonjar")) {
      localStorage.setItem("bgm_history_by_yonjar", JSON.stringify([]));
    }
    this.history = JSON.parse(localStorage.getItem("bgm_history_by_yonjar"));
  }

  get list() {
    return this.history;
  }

  update() {
    localStorage.setItem("bgm_history_by_yonjar", JSON.stringify(this.history));
  }

  add(topic) {
    if (this.has(topic)) this.remove(topic); //浏览过的帖子置顶

    if (this.history.length >= 7) {
      this.history.shift();
    }

    this.history.push(topic);
    this.update();
    console.log("topic_col:", "add ", topic.id);
  }

  remove(topic) {
    for (let i = 0; i < this.history.length; i++) {
      if (this.history[i].id === topic.id) {
        this.history.splice(i, 1);
        break;
      }
    }
    this.update();
    console.log("topic_col:", "remove ", topic.id);
  }

  removeAll() {
    this.history = "";
  }

  has(topic) {
    for (let li of this.history) {
      if (li.id === topic.id) {
        return true;
      }
    }
    return false;
  }
}

class Topic {
  constructor() {
    this.id = location.pathname.match(/\d+/)[0];
    this.path = this.pathTo(location.pathname);
    this.title = document.title;
    this.author = (
      document.querySelector(".postTopic > div.inner > strong > a") ||
      document.querySelector("#pageHeader > h1 > span > a.avatar.l")
    ).textContent;
  }

  init() {
    let bh = new BgmHistory();
    bh.add(this);
  }

  pathTo(path) {
    return /rakuen/.test(path)
      ? path.replace(
          /rakuen\/topic\/(\w+)\/(\d+)/,
          (match, p1, p2) => `${p1}/topic/${p2}`
        )
      : path;
  }
}

class HomePage {
  constructor() {
    this.sideInner = document.querySelector("#columnHomeB > div.sideInner");
    this.home_announcement = document.querySelector("#home_announcement");
  }

  init() {
    let bh = new BgmHistory();
    let col_elem =
      document.querySelector("#yonjar_History_tpc") ||
      document.createElement("div");
    let listStr = "";
    for (let i = bh.list.length - 1; i >= 0; i--) {
      listStr += `
                <li>
                    <a href="${bh.list[i].path}" title="楼主: ${bh.list[i].author}" class="l" target="_blank">${bh.list[i].title}</a>
                    <a title="删除" data-del-id="${bh.list[i].id}" class="btn_del" style="display: block;">del</a>
                </li>
            `;
    }
    col_elem.innerHTML = `
            <div id="yonjar_History_tpc" class="halfPage">
                <div class="sidePanelHome">
                    <h2 class="subtitle">我的足迹(${bh.list.length})</h2>
                    <ul class="timeline" style="margin:0 5px">
                        ${bh.list.length < 1 ? "<li>暂无历史</li>" : listStr}
                    </ul>
                </div>
            </div>
        `;

    this.sideInner.insertBefore(col_elem, this.home_announcement);

    col_elem.addEventListener("click", e => {
      let curr = e.target;
      console.log(curr.dataset);
      if (curr.className === "btn_del") {
        bh.remove({ id: curr.dataset.delId });
        this.init();
      }
    });
  }
}

(function() {
  let cur_url = location.href;
  if (/^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/$/.test(cur_url)) {
    let hp = new HomePage();
    hp.init();
    return;
  }

  if (
    /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/((blog|character|person|(group|subject)\/topic|rakuen\/topic\/(crt|group|subject|prsn))\/\S+)?(\?.*)?(#.*)?$/.test(
      cur_url
    )
  ) {
    let topic = new Topic();
    topic.init();
  }
})();
