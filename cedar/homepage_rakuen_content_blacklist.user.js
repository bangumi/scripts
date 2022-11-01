// ==UserScript==
// @name        Bangumi多页面内容屏蔽
// @namespace   tv.bgm.cedar.bangumicontentblacklist
// @version     2.4
// @description 根据指定关键词或ID屏蔽首页热门条目, 小组讨论
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/rakuen(/topiclist)?(\?.*)?$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/group/discover/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/group/topic/\d+/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/subject/topic/\d+/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/settings/privacy$/
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
/* === 超展开、帖子等页面的屏蔽按钮 === */
.content-blacklist-button {
  display: none;
  cursor: pointer;
  margin: 0 10px 0 0;
  padding: 0;
  color: #0084B4;
  border: none;
  font-size: 12px;
  background: none;
  float: right;
}
.content-blacklist-button::before {
  content: '[';
}
.content-blacklist-button::after {
  content: ']';
}
li:hover .content-blacklist-button, /* 超展开页面的按钮 */
h1:hover .content-blacklist-button, /* 小组帖子页面的按钮 */
#header:hover .content-blacklist-button /* 条目讨论页面的按钮 */{
  display: inline-block;
}
/* === config页面 === */
/* 列表的wrapper */
.content-blacklist-wrapper {
  padding: 0 20px;
  font-size: 13px;
  white-space: nowrap;
}
/* 标题 */
.content-blacklist-wrapper h2.subtitle {
  padding: 8px 5px;
}
/* 列表采用flex布局 (好像默认布局也是一样的效果) */
.content-blacklist-config {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
}
/* 每个列表项也采用flex布局, 给列表项添加下边框, 还要给第一项增加上边框
   针对移动端屏幕窄的情况, 要允许 .action 换行并自动靠右,
   所以添加 flex-wrap: wrap; justify-content: flex-end; */
.content-blacklist-config .item {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #EEEEEE;
  line-height: 30px;
}
.content-blacklist-config .item:first-of-type {
  border-top: 1px solid #EEEEEE;
}
.content-blacklist-config .item > .type {
  width: 80px;
}
.content-blacklist-config .item > .id,
.content-blacklist-config .item > .match {
  flex-grow: 1;
}
/* 所有config按钮的共同样式 模仿排行榜页面右侧的“收藏”按钮样式 */
.content-blacklist-config .action,
.content-blacklist-config .new {
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  background-color: rgba(254, 254, 254, 0.9);
  overflow: hidden;
  display: flex;
  margin: 5px;
}
.content-blacklist-config button {
  cursor: pointer;
  text-decoration: none;
  padding: 5px 10px;
  color: black;
  border: none;
  background: none;
}
/* action中的按钮样式 */
.content-blacklist-config .action button:hover {
  background-color: #369CF8;
}
.content-blacklist-config .action button[data-action="delete"]:hover {
  background-color: #F09199;
}
/* "新增"按钮样式, 填满整行 */
.content-blacklist-config .new button {
/*   background-color: #369CF8; */
  background-image: linear-gradient(to bottom, #397de8 0%, #3072dc 100%);
  flex-grow: 1;
  color: #EEEEEE;
}
.content-blacklist-config .new button:hover {
  background-image: linear-gradient(to bottom, #369CF8 0%, #0884F3 100%);
}
/* 添加新项的编辑栏的样式, 因为HTML嵌套太多了导致CSS不好理解
   实际HTML标签的嵌套关系大概为 .item > .edit-wrapper > form > label > [span+select, span+input]
   做法是让 .edit-wrapper 填满多余空间 (.item 已经是 flex 布局)
   把 form 设为 flex 布局, 让后一项 label (即包含 input 的那一项) 填满剩余空间
   再把 label 设为 flex 布局, 让其中的 input 尽量长, 填满剩余空间
   另外, input 有个默认的 size 属性, 导致其在移动端的宽度太长, 把 button 的位置挤没了.
   所以为了适配移动端, 要给 input 个比较短的 width 覆盖掉默认的 size
*/
.content-blacklist-config .item .edit-wrapper {
  flex-grow: 1;
  margin: 0 5px;
}
.content-blacklist-config .item .edit-wrapper form {
  display: flex;
  column-gap: 10px;
}
.content-blacklist-config .item .edit-wrapper label {
  display: flex;
}
.content-blacklist-config .item .edit-wrapper label:last-of-type {
  flex-grow: 1;
}
.content-blacklist-config .item .edit-wrapper input {
  flex-grow: 1;
  width: 80px;
}
.content-blacklist-config .action button[data-action="cancelAdd"]:hover {
  background-color: #F09199;
}
/* === 夜间模式 === */
/* 按钮背景改为深色 边框颜色变深 */
html[data-theme='dark'] .content-blacklist-config .action,
html[data-theme='dark'] .content-blacklist-config .new {
  background-color: rgba(80, 80, 80, 0.7);
  border-color: #6e6e6e;
}
/* 按钮文字颜色变浅 */
html[data-theme='dark'] .content-blacklist-button,
html[data-theme='dark'] .content-blacklist-config button {
  color: #DDDDDD;
}
/* config页面分隔线变深 */
html[data-theme='dark'] .content-blacklist-config .item {
  border-bottom-color: #444444;
}
`);


'use strict';

const DB_NAME = "xdcedar.contentBlacklist";
const DB_VERSION = 1;


/* 创建一个元素.
 * 用法举例(紧凑写法):
   createElement(
     'button', {
       id: 'confirm-button',
       className: 'button active',
       style: {borderRadius: '5px'}, // 或者 {'border-radius': '5px'}
       dataset: {clicked: 'false'}
     },
     ['确定'], {
       click: function(e) { ... }
     }
   )
 */
function createElement(tagName, options, subElements, eventHandlers=null) {
  let el = document.createElement(tagName);
  if (options) {
    for (let opt in options) {
      if (opt === 'dataset' || opt === 'style') {
        for (let k in options[opt]) {
          el[opt][k] = options[opt][k];
        }
      } else {
        el[opt] = options[opt];
      }
    }
  }
  if (subElements) {
    updateSubElements(el, subElements, false);
  }
  if (eventHandlers) {
    for (let e in eventHandlers) {
      el.addEventListener(e, eventHandlers[e]);
    }
  }
  return el;
}

/* 更新 parent 元素的内容 */
function updateSubElements(parent, subElements, isReplace) {
  if (isReplace) parent.innerHTML = '';
  if (!subElements) return parent;
  if (typeof subElements === 'string') subElements = [subElements];
  for (let e of subElements) {
    parent.appendChild(typeof e === 'string'? document.createTextNode(e): e);
  }
  return parent;
}

const ID_TYPE = {
  GROUP: "id.group", //小组ID
  SUBJECT: "id.subject", //条目ID
  GROUP_TOPIC: "id.group_topic", //小组帖子的ID
  SUBJECT_TOPIC: "id.subject_topic", //条目讨论的ID
  EP: "id.ep", //单集评论
  PERSON: "id.person", //现实人物
  CHARACTER: "id.character", //虚拟角色

  toReadableString(idType) {
    switch (idType) {
      case this.GROUP:
        return '小组';
      case this.SUBJECT:
        return '条目';
      case this.GROUP_TOPIC:
        return '小组帖子ID';
      case this.SUBJECT_TOPIC:
        return '条目讨论ID';
      case this.EP:
        return '单集评论';
      case this.PERSON:
        return '现实人物';
      case this.CHARACTER:
        return '虚拟角色';
      default:
        return '';
    }
  },

  /* url 可以是个 URL 类型的元素, 或者是个 string */
  fromURL(url) {
    let pathname = url.pathname || new URL(url).pathname;
    let index = pathname.lastIndexOf('/');
    let id = pathname.slice(index+1);
    let urltype = pathname.slice(0, index+1);
    switch(urltype) {
      case '/group/':
        return {type: this.GROUP, id: id};
      case '/subject/':
        return {type: this.SUBJECT, id: id};
      case '/group/topic/':
        return {type: this.GROUP_TOPIC, id: id};
      case '/subject/topic/':
        return {type: this.SUBJECT_TOPIC, id: id};
      case '/ep/':
        return {type: this.EP, id: id};
      case '/person/':
        return {type: this.PERSON, id: id};
      case '/character/':
        return {type: this.CHARACTER, id: id};
      default:
        return {};
    }
  },

  toURL(type, id) {
    switch(type) {
      case this.GROUP:
        return `${location.origin}/group/${id}`;
      case this.SUBJECT:
        return `${location.origin}/subject/${id}`;
      case this.GROUP_TOPIC:
        return `${location.origin}/group/topic/${id}`;
      case this.SUBJECT_TOPIC:
        return `${location.origin}/subject/topic/${id}`;
      case this.EP:
        return `${location.origin}/ep/${id}`;
      case this.PERSON:
        return `${location.origin}/person/${id}`;
      case this.CHARACTER:
        return `${location.origin}/character/${id}`;
      default:
        return "";
    }
  },

  /* url 可以是个 URL 类型的元素, 或者是个 string */
  fromRakuenURL(url) {
    let pathname = url.pathname || new URL(url).pathname;
    let index = pathname.lastIndexOf('/');
    let id = pathname.slice(index+1);
    let urltype = pathname.slice(0, index+1);
    switch(urltype) {
      case '/group/':
        return {type: this.GROUP, id: id};
      case '/subject/':
        return {type: this.SUBJECT, id: id};
      case '/rakuen/topic/group/':
        return {type: this.GROUP_TOPIC, id: id};
      case '/rakuen/topic/subject/':
        return {type: this.SUBJECT_TOPIC, id: id};
      case '/rakuen/topic/ep/':
        return {type: this.EP, id: id};
      case '/rakuen/topic/prsn/':
        return {type: this.PERSON, id: id};
      case '/rakuen/topic/crt/':
        return {type: this.CHARACTER, id: id};
      default:
        return {};
    }
  },

  toRakuenURL(type, id) {
    switch(type) {
      case this.GROUP:
        return `${location.origin}/group/${id}`;
      case this.SUBJECT:
        return `${location.origin}/subject/${id}`;
      case this.GROUP_TOPIC:
        return `${location.origin}/rakuen/topic/group/${id}`;
      case this.SUBJECT_TOPIC:
        return `${location.origin}/rakuen/topic/subject/${id}`;
      case this.EP:
        return `${location.origin}/rakuen/topic/ep/${id}`;
      case this.PERSON:
        return `${location.origin}/rakuen/topic/prsn/${id}`;
      case this.CHARACTER:
        return `${location.origin}/rakuen/topic/crt/${id}`;
      default:
        return "";
    }
  },
};

const KW_TYPE = {
  GROUP_TOPIC: "kw.group_topic", //小组帖子的关键词
  SUBJECT_TOPIC: "kw.subject_topic", //条目讨论的关键词

  toReadableString(idType) {
    switch(idType) {
      case this.GROUP_TOPIC:
        return '小组帖子';
      case this.SUBJECT_TOPIC:
        return '条目讨论';
      default:
        return null;
    }
  },

  /* 根据url判断其对应的标题的类型. url 可以是个 URL 类型的元素, 或者是个 string */
  fromURL(url) {
    let pathname = url.pathname || new URL(url).pathname;
    let index = pathname.lastIndexOf('/');
    let urltype = pathname.slice(0, index+1);
    switch(urltype) {
      case '/group/':
      case '/group/topic/':
        return this.GROUP_TOPIC;
      case '/subject/':
      case '/subject/topic/':
        return this.SUBJECT_TOPIC;
      default:
        return {};
    }
  },

  /* 根据url判断其对应的标题的类型. url 可以是个 URL 类型的元素, 或者是个 string */
  fromRakuenURL(url) {
    let pathname = url.pathname || new URL(url).pathname;
    let index = pathname.lastIndexOf('/');
    let urltype = pathname.slice(0, index+1);
    switch(urltype) {
      case '/group/':
      case '/rakuen/topic/group/':
        return this.GROUP_TOPIC;
      case '/subject/':
      case '/rakuen/topic/subject/':
        return this.SUBJECT_TOPIC;
      default:
        return {};
    }
  },
};

// 一些Parser.
// 函数的参数为el, 输入是homepage或rakuen或discover中的HTML元素, 输出是对应的type和ID 或 type和title
const Parser = {
  homepage: {
    idParser(el) {
      return ID_TYPE.fromURL(el.querySelector('p a'));
    },

    topicIdParser(el) {
      return ID_TYPE.fromURL(el.querySelector('a'));
    },

    titleParser(el) {
      let a = el.querySelector('.inner>a');
      let type = KW_TYPE.fromURL(a);
      return {type, title: a.innerHTML};
    },

    /* input: 一个元素 el
     * output: 一个object, 包括
       {
         node: el,
         id: {type, id},
         topicId: {type, id},
         title: {type, title}
       }
     */
    parseAll(el) {
      return {
        node: el,
        id: this.idParser(el),
        topicId: this.topicIdParser(el),
        title: this.titleParser(el)
      };
    },
  },

  rakuen: {
    idParser(el) {
      // id 实际指小组group和条目subject的id,
      // 而person, character之类的没有id, 所以return前需要判断
      let a = el.querySelector('.row>a');
      return a? ID_TYPE.fromRakuenURL(a): null;
    },

    topicIdParser(el) {
      return ID_TYPE.fromRakuenURL(el.querySelector('a'));
      // return el.id.slice(el.id.lastIndexOf('_')+1); // 这个写法其实比解析url要简洁, 但判断type比较麻烦
    },

    titleParser(el) {
      let a = el.querySelector('.inner>a');
      let type = KW_TYPE.fromRakuenURL(a);
      return {type, title: a.innerHTML};
    },

    /* input: 一个元素 el
     * output: 一个object, 包括
       {
         node: el,
         id: {type, id},
         topicId: {type, id},
         title: {type, title}
       }
     */
    parseAll(el) {
      return {
        node: el,
        id: this.idParser(el),
        topicId: this.topicIdParser(el),
        title: this.titleParser(el)
      };
    },
  },

  // 对应 group/discover 页面
  discover: {
    // id 在此指小组group的id, subject的id在本页面没有出现
    idParser(el) {
      return ID_TYPE.fromURL(el.querySelector('td:nth-of-type(2) a'));
    },

    topicIdParser(el) {
      return ID_TYPE.fromURL(el.querySelector('td:nth-of-type(1) a'));
    },

    titleParser(el) {
      let a = el.querySelector('td:nth-of-type(1) a');
      let type = KW_TYPE.fromURL(a);
      return {type, title: a.innerHTML};
    },

    /* input: 一个元素 el
     * output: 一个object, 包括
       {
         node: el,
         id: {type, id},
         topicId: {type, id},
         title: {type, title}
       }
     */
    parseAll(el) {
      return {
        node: el,
        id: this.idParser(el),
        topicId: this.topicIdParser(el),
        title: this.titleParser(el)
      };
    },
  },
}


// 部分代码参考 https://bgm.tv/dev/app/258/gadget/938
class Database {
  constructor(db) {
    if(! db instanceof IDBOpenDBRequest) throw new Error("wrong database instance");
    this._db = db;
  }

  static open(dbname=DB_NAME, dbversion=DB_VERSION) {
    return new Promise((resolve, reject) => {
      let request = window.indexedDB.open(dbname, dbversion);
      request.onerror = evt => reject(evt.target.errorCode);
      request.onsuccess = evt => resolve(new Database(evt.target.result));
      request.onupgradeneeded = evt => {
        this._upgradeDatabase(evt.target.result, evt.oldVersion);
      };
    });
  }

  static _upgradeDatabase(db, oldVersion) {
    /* ====== 存储结构 ======
    旧版本 (localStorage)
    localStorage.bangumi_homepage_rakuen_blacklist
    {
      "groupIDs": [...],
      "groupTitleKeywords": [...],
      "subjectIDs": [...],
      "subjectTitleKeywords": [...],
    }
    存储结构v1 (indexedDB)
    DB_NAME = "xdcedar.contentBlacklist"
    {
      // 两个对象仓库 IDs, keywords. ["type", "id"]或["type", "match"] 共同作为单个的key
      "IDs": [
        {"type": type, "id": string}, // type作为Index
        {"type": type, "id": string},
        ...
      ],
      "keywords": [
        {"type": type, "match": string}, // type作为Index
        {"type": type, "match": string}, // 以后再考虑支持正则
        ...
      ],
    }
    // ID中的type由 ID_TYPE 定义.
    // keywords中的type 由 KW_TYPE 定义.
    */
    if (oldVersion < 1) {
      // create new object stores
      let IDsStore = db.createObjectStore("IDs", {keyPath: ["type", "id"]});
      IDsStore.createIndex("type", "type", {unique: false});
      let keywordsStore = db.createObjectStore("keywords", {keyPath: ["type", "match"]});
      keywordsStore.createIndex("type", "type", {unique: false});

      // import data from old script
      let oldDB = JSON.parse(localStorage.getItem('bangumi_homepage_rakuen_blacklist') || "{}");
      //IDsStore.transaction.oncomplete = _ => { /* ... */ } // 不能这么写..一定要写在同一个transaction.oncomplete里, 而且无论是IDsStore还是keywordsStore都可以..为啥??
      keywordsStore.transaction.oncomplete = _ => {
        let request = db.transaction(["IDs", "keywords"], "readwrite");
        let idStore = request.objectStore("IDs");
        if (oldDB.groupIDs) for (let id of oldDB.groupIDs) { idStore.add({type: ID_TYPE.GROUP, id}); }
        if (oldDB.subjectIDs) for (let id of oldDB.subjectIDs) { idStore.add({type: ID_TYPE.SUBJECT, id}); }

        let kwStore = request.objectStore("keywords");
        if (oldDB.groupTitleKeywords) for (let kw of oldDB.groupTitleKeywords) { kwStore.add({type: KW_TYPE.GROUP_TOPIC, match: kw}); }
        if (oldDB.subjectTitleKeywords) for (let kw of oldDB.subjectTitleKeywords) { kwStore.add({type: KW_TYPE.SUBJECT_TOPIC, match: kw}); }
      }
      localStorage.removeItem("bangumi_homepage_rakuen_blacklist");
    } else {
      throw new Error("Unexpected old version");
    }
  }

  _getActiveStore(storename, mode) {
    let transaction = this._db.transaction(storename, mode);
    return transaction.objectStore(storename);
  }

  _querySingleStore({storename, mode, onrequest, onsuccess}) {
    return new Promise((resolve, reject) => {
      let store = this._getActiveStore(storename, mode);
      let request = onrequest(store);
      if (request) {
        request.onerror = evt => reject(evt.target.error);
        request.onsuccess = evt => resolve(onsuccess? onsuccess(evt.target.result): evt.target.result);
      } else {
       resolve(null);
      }
    });
  }

  hasID({type, id}) {
    return this._querySingleStore({
      storename: "IDs",
      mode: "readonly",
      onrequest: store => store.count([type, id]),
      onsuccess: result => result >= 1
    });
  }

  getID({type, id}) {
    return this._querySingleStore({
      storename: "IDs",
      mode: "readonly",
      onrequest: store => store.get([type, id]),
      onsuccess: result => result || null
    });
  }

  /* 不输入type或type==null则会获得全部ID */
  getAllIDs(type=null) {
    const onrequest = type
      ? store => store.index("type").getAll(IDBKeyRange.only(type))
      : store => store.getAll();
    return this._querySingleStore({
      storename: "IDs",
      mode: "readonly",
      onrequest: onrequest,
      onsuccess: result => result || null
    });
  }

  getAllKeywords(type=null) {
    const onrequest = type
      ? store => store.index("type").getAll(IDBKeyRange.only(type))
      : store => store.getAll();
    return this._querySingleStore({
      storename: "keywords",
      mode: "readonly",
      onrequest: onrequest,
      onsuccess: result => result || null
    });
  }

  addID({type, id}) {
    return this._querySingleStore({
      storename: "IDs",
      mode: "readwrite",
      onrequest: store => store.add({type, id}), // 用add()能在重复添加时报错
      onsuccess: null
    });
  }

  putID({type, id}) {
    return this._querySingleStore({
      storename: "IDs",
      mode: "readwrite",
      onrequest: store => store.put({type, id}), // 用put()能在重复添加时执行覆盖操作
      onsuccess: null
    });
  }

  addKeyword({type, match}) {
    return this._querySingleStore({
      storename: "keywords",
      mode: "readwrite",
      onrequest: store => store.add({type, match}),
      onsuccess: null
    });
  }

  deleteID({type, id}) {
    return this._querySingleStore({
      storename: "IDs",
      mode: "readwrite",
      onrequest: store => store.delete([type, id]),
      onsuccess: null
    });
  }

  deleteKeyword({type, match}) {
    return this._querySingleStore({
      storename: "keywords",
      mode: "readwrite",
      onrequest: store => store.delete([type, match]),
      onsuccess: null
    });
  }

  /* 暂时没有config, 将来有了config后再来修改这段代码
  getConfig(key) {
    return this._querySingleStore({
      storename: "config",
      onrequest: config => config.get(key),
      onsuccess: entry => entry.value,
    });
  }
  setConfig(key, value) {
    let config = this._getActiveStore("config", "readwrite");
    config.put({key, value});
  }
  */
}


class Model {
  constructor(db) {
    this._db = db;
  }

  static async build() {
    let db = await Database.open();
    return new Model(db);
  }

  /* input: IDList 是个 object array, 里面的元素为 {type, id} 或者 null;
   *        type 是这些id的种类, 如果type==null, 则认为列表元素的type不唯一, 取屏蔽列表项时会取全部type的项
   *        checktype 表示比较时是否会比较type, 因为有时传进来的IDList会包含多个type
   * output: Array中符合条件的项的index
   */
  async IDFilter(IDList, type, checktype=false) {
    let idx = [];
    if (!IDList) return idx;
    let IDs = await this.getAllIDs(type);
    if (!IDs.length) return idx;
    const checkfunc = checktype
      ? (key, item) => item && item.type === key.type && item.id === key.id
      : (key, item) => item && item.id === key.id;
    for (let i = 0; i < IDList.length; i++) {
      if (IDs.some(k => checkfunc(k, IDList[i])))
        idx.push(i);
    }
    return idx;
  }

  /* input: matchList 是个 object array, 里面的元素为{type, title} 或者 null;
   *        type 是这些match的种类, 如果type==null, 则判断时会根据matchList中各元素的type判断
   *        checktype 表示比较时是否会比较type, 因为有时传进来的IDList会包含多个type
   * output: Array中符合条件的项的index
   */
  async keywordFilter(matchList, type, checktype=false) {
    let idx = [];
    if (!matchList) return idx;
    let keywords = await this.getAllKeywords(type);
    if (!keywords.length) return idx;
    const checkfunc = checktype
      ? (key, item) => item && item.type === key.type && item.title.includes(key.match)
      : (key, item) => item && item.title.includes(key.match);
    for (let i = 0; i < matchList.length; i++) {
      if (keywords.some(k => checkfunc(k, matchList[i])))
        idx.push(i);
    }
    return idx;
  }

  /* 以下函数只有一句，没做其他事，所以不需要用 async/await 再包一层 */

  hasID({type, id}) {
    return this._db.hasID({type, id});
  }

  getID({type, id}) {
    return this._db.getID({type, id});
  }

  getAllIDs(type) {
    return this._db.getAllIDs(type);
  }

  getAllKeywords(type) {
    return this._db.getAllKeywords(type);
  }

  addID({type, id}) {
    this._db.addID({type, id});
  }

  addKeyword({type, match}) {
    this._db.addKeyword({type, match});
  }

  deleteID({type, id}) {
    this._db.deleteID({type, id});
  }

  deleteKeyword({type, match}) {
    this._db.deleteKeyword({type, match});
  }
}

// homepage side panel filter 筛选首页右上角
async function homepageFilter() {
  let model = await Model.build();
  let parsedList, indexes;

  // 筛选小组
  let group = document.querySelectorAll('#home_grp_tpc .sideTpcList>:not(.tools)');
  group = Array.from(group).map(x => Parser.homepage.parseAll(x));

  // 筛选小组的ID
  parsedList = group.map(x => x.id);
  indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP);
  for (let idx of indexes) {
    group[idx].node.style.display = "none";
  }

  // 筛选小组讨论的ID
  parsedList = group.map(x => x.topicId);
  indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP_TOPIC);
  for (let idx of indexes) {
    group[idx].node.style.display = "none";
  }

  // 筛选小组讨论的标题关键词
  parsedList = group.map(x => x.title);
  indexes = await model.keywordFilter(parsedList, KW_TYPE.GROUP_TOPIC);
  for (let idx of indexes) {
    group[idx].node.style.display = "none";
  }

  // 筛选条目
  let subject = document.querySelectorAll('#home_subject_tpc .sideTpcList>li');
  subject = Array.from(subject).map(x => Parser.homepage.parseAll(x));

  // 筛选条目的ID
  parsedList = subject.map(x => x.id);
  indexes = await model.IDFilter(parsedList, ID_TYPE.SUBJECT);
  for (let idx of indexes) {
    subject[idx].node.style.display = "none";
  }

  // 筛选条目讨论的ID
  parsedList = subject.map(x => x.topicId);
  indexes = await model.IDFilter(parsedList, ID_TYPE.SUBJECT_TOPIC);
  for (let idx of indexes) {
    subject[idx].node.style.display = "none";
  }

  // 筛选条目讨论的标题关键词
  parsedList = subject.map(x => x.title);
  indexes = await model.keywordFilter(parsedList, KW_TYPE.SUBJECT_TOPIC);
  for (let idx of indexes) {
    subject[idx].node.style.display = "none";
  }
}

// rakuen filter 筛选超展开
async function rakuenFilter() {
  let model = await Model.build();

  let itemList = document.querySelectorAll('#eden_tpc_list>ul>li');
  itemList = Array.from(itemList).map(x => Parser.rakuen.parseAll(x));
  let rakuenType = new URLSearchParams(location.search).get('type');
  let filteredList, parsedList, indexes;

  // 写法上都有微妙的不同, 不好合并..
  switch(rakuenType) {
    case null:
      // 全部类型都有
      // 筛选小组的ID
      filteredList = itemList.filter(x => x.id && x.id.type === ID_TYPE.GROUP);
      parsedList = filteredList.map(x => x.id);
      indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }

      // 筛选条目的ID
      filteredList = itemList.filter(x => x.id && x.id.type === ID_TYPE.SUBJECT);
      parsedList = filteredList.map(x => x.id);
      indexes = await model.IDFilter(parsedList, ID_TYPE.SUBJECT);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }

      // 筛选全部topicID
      filteredList = itemList;
      parsedList = filteredList.map(x => x.topicId);
      indexes = await model.IDFilter(parsedList, null, true);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }

      // 筛选小组的标题关键词
      filteredList = itemList.filter(x => x.title.type === KW_TYPE.GROUP_TOPIC);
      parsedList = filteredList.map(x => x.title);
      indexes = await model.keywordFilter(parsedList, KW_TYPE.GROUP_TOPIC);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }

      // 筛选条目的标题关键词
      filteredList = itemList.filter(x => x.title.type === KW_TYPE.SUBJECT_TOPIC);
      parsedList = filteredList.map(x => x.title);
      indexes = await model.keywordFilter(parsedList, KW_TYPE.SUBJECT_TOPIC);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      break;
    case "group":
    case "my_group":
      // 筛选小组的ID
      filteredList = itemList.filter(x => x.id.type === ID_TYPE.GROUP);
      parsedList = filteredList.map(x => x.id);
      indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      // 筛选小组讨论的ID
      filteredList = itemList.filter(x => x.topicId.type === ID_TYPE.GROUP_TOPIC);
      parsedList = filteredList.map(x => x.topicId);
      indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP_TOPIC);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      // 筛选小组的标题关键词
      filteredList = itemList.filter(x => x.title.type === KW_TYPE.GROUP_TOPIC);
      parsedList = filteredList.map(x => x.title);
      indexes = await model.keywordFilter(parsedList, KW_TYPE.GROUP_TOPIC);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      break;
    case "subject":
      // 筛选条目的ID
      filteredList = itemList.filter(x => x.id.type === ID_TYPE.SUBJECT);
      parsedList = filteredList.map(x => x.id);
      indexes = await model.IDFilter(parsedList, ID_TYPE.SUBJECT);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      // 筛选条目讨论的ID
      filteredList = itemList.filter(x => x.topicId.type === ID_TYPE.SUBJECT_TOPIC);
      parsedList = filteredList.map(x => x.topicId);
      indexes = await model.IDFilter(parsedList, ID_TYPE.SUBJECT_TOPIC);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      // 筛选条目的标题关键词
      filteredList = itemList.filter(x => x.title.type === KW_TYPE.SUBJECT_TOPIC);
      parsedList = filteredList.map(x => x.title);
      indexes = await model.keywordFilter(parsedList, KW_TYPE.SUBJECT_TOPIC);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      break;
    case "ep":
      // 筛选条目的ID
      filteredList = itemList.filter(x => x.id.type === ID_TYPE.SUBJECT);
      parsedList = filteredList.map(x => x.id);
      indexes = await model.IDFilter(parsedList, ID_TYPE.SUBJECT);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      // 筛选单集讨论的ID
      filteredList = itemList.filter(x => x.topicId.type === ID_TYPE.EP);
      parsedList = filteredList.map(x => x.topicId);
      indexes = await model.IDFilter(parsedList, ID_TYPE.EP);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      break;
    case "mono":
      // 筛选现实人物的ID
      filteredList = itemList.filter(x => x.topicId.type === ID_TYPE.PERSON);
      parsedList = filteredList.map(x => x.topicId);
      indexes = await model.IDFilter(parsedList, ID_TYPE.PERSON);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      // 筛选虚拟人物的ID
      filteredList = itemList.filter(x => x.topicId.type === ID_TYPE.CHARACTER);
      parsedList = filteredList.map(x => x.topicId);
      indexes = await model.IDFilter(parsedList, ID_TYPE.CHARACTER);
      for (let idx of indexes) {
        filteredList[idx].node.style.display = "none";
      }
      break;
  }
}

// discover filter 筛选“随便看看”
async function discoverFilter() {
  let model = await Model.build();

  let itemList = document.querySelectorAll('#columnA table.topic_list>tbody:nth-of-type(2)>tr');
  itemList = Array.from(itemList).map(x => Parser.discover.parseAll(x));
  let parsedList, indexes;

  // 筛选小组的ID
  parsedList = itemList.map(x => x.id);
  indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP);
  for (let idx of indexes) {
    itemList[idx].node.style.display = "none";
  }

  // 筛选小组讨论的ID
  parsedList = itemList.map(x => x.topicId);
  indexes = await model.IDFilter(parsedList, ID_TYPE.GROUP_TOPIC);
  for (let idx of indexes) {
    itemList[idx].node.style.display = "none";
  }

  // 筛选小组讨论的标题关键词
  parsedList = itemList.map(x => x.title);
  indexes = await model.keywordFilter(parsedList, KW_TYPE.GROUP_TOPIC);
  for (let idx of indexes) {
    itemList[idx].node.style.display = "none";
  }
}

/* 这里采用 delegation 的方式控制各个按钮
 * 设计理念见 https://javascript.info/event-delegation#delegation-example-actions-in-markup
 * ( 注意关键代码是 addEventListener('click', this.onClick.bind(this)) )
 * 实际使用时会利用继承
 * 子类需要实现
 * this._getTitleEl(), this._getItemsfromDB(), this._toConfigItemEl(item),
 * 以及各种操作(action)
 */
class ConfigUI {
  constructor(model) {
    this._model = model;
  }

  static async build() {
    let model = await Model.build();
    return new this(model); // 必须用 new this() 而非 new ConfigUI() (其中this指代当前的Class), 否则其子类调用build时会获得父类对象
  }

  onClick(e) {
    let action = e.target.dataset.action;
    if (action) {
      let el = e.target.closest('.content-blacklist-config>li');
      if (el) this[`_action_${action}`](el);
    }
  }

  async getConfigUI() {
    let configUI = await this._createConfigUI();
    configUI.querySelector('ul').addEventListener('click', this.onClick.bind(this));
    return configUI;
  }

  /* 构建的是最外层的 wrapper.
   * 采用简单的列表布局:
     <div class='content-blacklist-wrapper'>
       <h2 class='subtitle'>标题</h2>
       <ul class='content-blacklist-config'>
         <li class='item'> ... </li>
         <li class='item'> ... </li>
         <li class='item'> ... </li>
         <li class='new'><button class='new-button' data-action='new'>新增</button></li>
       </ul>
     </div>
     li内的布局见子类的 this._toConfigItemEl()
   */
  async _createConfigUI() {
    let items = await this._getItemsfromDB();
    let itemListEl = createElement('ul', {className: 'content-blacklist-config'}, [
      ...items.map(this._toConfigItemEl),
      createElement('li', {className: 'new'}, [
        createElement('button', {
          className: 'new-button',
          dataset: {action: 'new'},
          textContent: '新增',
        })
      ])
    ]);
    return createElement(
      'div', {className: 'content-blacklist-wrapper'},
      [this._getTitleEl(), itemListEl]
    );
  }
}


class IDConfigUI extends ConfigUI {
  _getTitleEl() {
    return createElement('h2', {className: 'subtitle', textContent: '内容ID屏蔽列表'}, null, null);
  }

  async _getItemsfromDB() {
    return await this._model.getAllIDs();
  }

  /* UIElement里每个项目的HTML布局
   * 如果需要编辑时，可以通过在 <li> 中添加 'editing' class 结合 CSS 来修改
   * 不过，注意！目前的功能还比较简单，暂时不需要“编辑”“更新”“取消”按钮, 也不需要edit-wrapper
   * 只需要删除功能
   * 布局如下
     <li class='item' data-type='id.group_topic' data-id='123456'>
       <div class='edit-wrapper'>
         <!-- 暂时不需要与编辑相关的元素
         <form>
           <label>
             <span>链接：</span>
             <input name='url' class='edit-input'>
           </label>
         </form>
         -->
       </div>
       <div class='type'>小组帖子ID</div>
       <div class='id'>
         <a href='/group/topic/123456'>123456</a></div>
       </div>
       <div class='action'>
         <button class='update-button' data-action='update'>更新</button>
         <button class='cancel-button' data-action='cancel'>取消</button>
         <button class='edit-button' data-action='edit'>编辑</button>
         <button class='delete-button' data-action='delete'>删除</button>
       </div>
     </li>
   */
  _toConfigItemEl(item) {
    let url = ID_TYPE.toURL(item.type, item.id);

    /* 暂时不需要
       let editWrapper = createElement(
         'div', {className: 'edit-wrapper'},
         [
           createElement('form', null, [
             createElement('label', null, [
               createElement('span', {textContent: '链接：'}}, null, null),
               createElement('input', {name: 'url', className: 'edit-input', val: url})
             ], null)
           ], null)
         ], null
       );
    */
    let typeWrapper = createElement('div', {
      className: 'type',
      textContent: ID_TYPE.toReadableString(item.type)
    });

    let idWrapper = createElement(
      'div', {className: 'id'},
      [createElement('a', {href: url, target: '_blank', rel: 'noreferrer noopener', textContent: item.id})]
    );

    let actionWrapper = createElement( 'div', {className: 'action'}, [
      // 暂时不需要跟编辑相关的按钮
      //createElement('button', {className: 'update-button', dataset: {action: 'update'}, textContent: '更新'}),
      //createElement('button', {className: 'cancel-button', dataset: {action: 'cancel'}, textContent: '取消'}),
      //createElement('button', {className: 'edit-button', dataset: {action: 'edit'}, textContent: '编辑'}),
      createElement('button', {className: 'delete-button', dataset: {action: 'delete'}, textContent: '删除'}),
    ]);

    let li = createElement(
      'li', {className: 'item', dataset: {type: item.type, id: item.id}},
      [typeWrapper, idWrapper, actionWrapper]
    );
    return li;
  }

  /* 需要创建新项时调用这个函数,
   * 会返回一个用于创建新项目的li元素
   * 布局如下
     <li class='item'>
       <div class='edit-wrapper'>
         <form>
           <label>
             <span>链接：</span>
             <input name='url' type='url' class='edit-input'>
           </label>
         </form>
       </div>
       <div class='action'>
         <button class='add-button' data-action='add'>添加</button>
         <button class='cancel-add-button' data-action='cancelAdd'>取消</button>
       </div>
     </li>
   */
  _getAddNewEl() {
    let editWrapper = createElement('div', {className: 'edit-wrapper'}, [
      createElement('form', null, [
        createElement('label', null, [
          createElement('span', {textContent: '链接：'}),
          createElement('input', {name: 'url', type: 'url', className: 'edit-input'})
        ])
      ])
    ]);

    let actionWrapper = createElement( 'div', {className: 'action'}, [
      createElement('button', {className: 'add-button', dataset: {action: 'add'}, textContent: '添加'}),
      createElement('button', {className: 'cancel-add-button', dataset: {action: 'cancelAdd'}, textContent: '取消'}),
    ]);

    let li = createElement('li', {className: 'item'}, [editWrapper, actionWrapper]);
    return li;
  }

  _action_new(li) {
    let el = this._getAddNewEl();
    li.insertAdjacentElement('beforebegin', el);
    //li.parentElement.removeChild(li);
  }

  async _action_add(li) {
    let buttons = li.querySelectorAll('button');
    buttons.forEach(btn => {btn.disabled = true;});
    let url = new FormData(li.querySelector('.edit-wrapper form')).get('url');
    let item;
    try {
      item = url.includes('rakuen')? ID_TYPE.fromRakuenURL(url): ID_TYPE.fromURL(url); // 这条语句要摆在里面, 因为用户可能输入错误的URL
      if (!item) throw new Error("Invalid bangumi url");
      await this._model.addID(item);
    } catch(e) {
      console.error(e);
      if (e.name === "ConstraintError") {
        alert("已存在，添加失败！");
      } else {
        alert("添加失败！请检查输入是否错误！");
      }
      buttons.forEach(btn => {btn.disabled = false;});
      return;
    }
    let itemEl = this._toConfigItemEl(item);
    li.insertAdjacentElement('beforebegin', itemEl);
    li.parentElement.removeChild(li);
  }

  _action_cancelAdd(li) {
    li.parentElement.removeChild(li);
  }

  async _action_delete(li) {
    let buttons = li.querySelectorAll('button');
    buttons.forEach(btn => {btn.disabled = true;});
    let type = li.dataset.type;
    let id = li.dataset.id;
    try {
      await this._model.deleteID({type, id});
    } catch(e) {
      console.error(e);
      alert("删除失败！");
      buttons.forEach(btn => {btn.disabled = false;});
      return;
    }
    li.parentElement.removeChild(li);
  }
}


class KeywordConfigUI extends ConfigUI {
  _getTitleEl() {
    return createElement('h2', {className: 'subtitle', textContent: '内容关键词屏蔽列表'});
  }

  async _getItemsfromDB() {
    return await this._model.getAllKeywords();
  }

  /* UIElement里每个项目的HTML布局
   * 如果需要编辑时，可以通过在 <li> 中添加 'editing' class 结合 CSS 来修改
   * 不过，注意！目前的功能还比较简单，暂时不需要“编辑”“更新”“取消”按钮, 也不需要edit-wrapper
   * 只需要删除功能
   * 布局如下
     <li data-type='kw.group_topic' data-match='里番'>
       <!-- 暂时不需要与编辑相关的元素
       <div class='edit-wrapper'>
         <label>
           <span>关键词：</span>
           <input name='match' class='edit-input'>
         </label>
       </div>
       -->
       <div class='type'>小组帖子</div>
       <div class='match'>里番</div>
       <div class='action'>
         <button class='update-button' data-action='update'>更新</button>
         <button class='cancel-button' data-action='cancel'>取消</button>
         <button class='edit-button' data-action='edit'>编辑</button>
         <button class='delete-button' data-action='delete'>删除</button>
       </div>
     </li>
   */
  _toConfigItemEl(item) {
    // 暂时不需要
    // let editWrapper = createElement('div', {className: 'edit-wrapper'}, [
    //   createElement( 'label', null, [
    //     createElement('span', {textContent: '链接：'}),
    //     createElement('input', {name: 'url', className: 'edit-input', val: url})
    //   ])
    // ]);
    let typeWrapper = createElement('div', {
      className: 'type',
      textContent: KW_TYPE.toReadableString(item.type)
    });

    let kwWrapper = createElement('div', {className: 'match', textContent: item.match});

    let actionWrapper = createElement( 'div', {className: 'action'}, [
      // 暂时不需要与编辑相关的按钮
      //createElement('button', {className: 'update-button', dataset: {action: 'update'}, textContent: '更新'}),
      //createElement('button', {className: 'cancel-button', dataset: {action: 'cancel'}, textContent: '取消'}),
      //createElement('button', {className: 'edit-button', dataset: {action: 'edit'}, textContent: '编辑'}),
      createElement('button', {className: 'delete-button', dataset: {action: 'delete'}, textContent: '删除'}),
    ]);

    let li = createElement(
      'li',
      {className: 'item', dataset: {type: item.type, match: item.match}},
      [typeWrapper, kwWrapper, actionWrapper]);
    return li;
  }


  /* 需要创建新项时调用这个函数,
   * 会返回一个用于创建新项目的li元素
   * 布局如下
     <li class='item'>
       <div class='edit-wrapper'>
         <form>
           <label>
             <span>类型：</span>
             <select name="type">
               <option value="kw.group_topic">小组帖子</option>
               <option value="kw.subject_topic">条目讨论</option>
               <option value="...">可能将来会有新类型</option>
             </select>
           </label>
           <label>
             <span>关键词：</span>
             <input name='match' class='edit-input'>
           </label>
         </form>
       </div>
       <div class='action'>
         <button class='add-button' data-action='add'>添加</button>
         <button class='cancel-add-button' data-action='cancelAdd'>取消</button>
       </div>
     </li>
   */
  _getAddNewEl() {
    let optionEl = createElement(
      'select', {name: 'type'},
      Object.values(KW_TYPE).filter(v => !(v instanceof Function))
        .map(v => createElement('option', {value: v, textContent: KW_TYPE.toReadableString(v)}))
    );
    let editWrapper = createElement('div', {className: 'edit-wrapper'}, [
      createElement('form', null, [
        createElement('label', null, [createElement('span', {textContent: '类型：'}), optionEl]),
        createElement('label', null, [
          createElement('span', {textContent: '关键词：'}),
          createElement('input', {name: 'match', className: 'edit-input'})
        ])
      ])
    ]);

    let actionWrapper = createElement( 'div', {className: 'action'}, [
      createElement('button', {className: 'add-button', dataset: {action: 'add'}, textContent: '添加'}),
      createElement('button', {className: 'cancel-add-button', dataset: {action: 'cancelAdd'}, textContent: '取消'}),
    ]);

    let li = createElement('li', {className: 'item'}, [editWrapper, actionWrapper]);
    return li;
  }

  _action_new(li) {
    let el = this._getAddNewEl();
    li.insertAdjacentElement('beforebegin', el);
    //li.parentElement.removeChild(li);
  }

  async _action_add(li) {
    let buttons = li.querySelectorAll('button');
    buttons.forEach(btn => {btn.disabled = true;});
    let fd = new FormData(li.querySelector('.edit-wrapper form'));
    let type = fd.get('type');
    let match = fd.get('match');
    let item = {type, match};
    try {
      if (!item.match) throw new Error('empty keywords');
      await this._model.addKeyword(item);
    } catch(e) {
      console.error(e);
      if (e.name === "ConstraintError") {
        alert("已存在，添加失败！");
      } else {
        alert("添加失败！输入为空或无效输入！");
      }
      buttons.forEach(btn => {btn.disabled = false;});
      return;
    }
    let itemEl = this._toConfigItemEl(item);
    li.insertAdjacentElement('beforebegin', itemEl);
    li.parentElement.removeChild(li);
  }

  _action_cancelAdd(li) {
    li.parentElement.removeChild(li);
  }

  async _action_delete(li) {
    let buttons = li.querySelectorAll('button');
    buttons.forEach(btn => {btn.disabled = true;});
    let type = li.dataset.type;
    let match = li.dataset.match;
    try {
      await this._model.deleteKeyword({type, match});
    } catch(e) {
      console.error(e);
      alert("删除失败！");
      buttons.forEach(btn => {btn.disabled = false;});
      return;
    }
    li.parentElement.removeChild(li);
  }
}


/* 这里采用 delegation 的方式控制各个按钮，类似 ConfigUI
 * 父类用于在各个按钮界面一键屏蔽
 * 子类需要实现 TODO
 * this._getActiveEl(), this._getItemListRoot(), this._getItemList(), this._insertButton()
 * 因为各页面都有微妙不同，还没想好怎么合并，先注释掉了
 */
// class ButtonUI {
//   constructor(model) {
//     this._model = model;
//   }

//   static async build() {
//     let model = await Model.build();
//     return new this(model); // 必须用 new this() 而非 new ConfigUI() (其中this指代当前的Class), 否则其子类调用build时会获得父类对象
//   }

//   onClick(e) {
//     let action = e.target.dataset.action;
//     if (action) {
//       let el = this._getActiveEl(e.target);
//       if (el) this[`_action_${action}`](el);
//     }
//   }

//   /* 给允许屏蔽的项目添加屏蔽按钮 */
//   addButtons() {
//     let itemListRoot = this._getItemListRoot();
//     this._getItemList().forEach(el => {
//       const button = createElement('button', {
//         className: 'content-blacklist-button',
//         dataset: {action: 'ban'},
//         textContent: '屏蔽',
//       });
//       this._insertButton(el, button);
//     });
//     itemListRoot.addEventListener('click', this.onClick.bind(this));
//   }

//   async _action_ban(el) {
//     let buttons = el.querySelectorAll('button.content-blacklist-button');
//     buttons.forEach(btn => {btn.disabled = true;});
//     let item = Parser.rakuen.topicIdParser(el);
//     try {
//       await this._model.addID(item);
//     } catch(e) {
//       console.error(e);
//       if (e.name !== "ConstraintError") {
//         alert("添加失败！");
//         buttons.forEach(btn => {btn.disabled = false;});
//         return;
//       }
//     }
//     el.style.display = 'none';
//   }
// }

/* 超展开页面的屏蔽按钮 */
class RakuenButtonUI {
  constructor(model) {
    this._model = model;
  }

  static async build() {
    let model = await Model.build();
    return new this(model); // 必须用 new this() 而非 new ConfigUI() (其中this指代当前的Class), 否则其子类调用build时会获得父类对象
  }

  //_getItemListRoot() { return document.querySelectorAll("#eden_tpc_list>ul"); }
  //_getItemList() { return document.querySelectorAll("#eden_tpc_list .item_list"); }
  //_insertButton(el, button) { el.querySelector('.inner .row').appendChild(button); }

  addButtons() {
    let rakuenList = document.getElementById("eden_tpc_list");
    rakuenList.querySelectorAll('.item_list').forEach(el => {
      let button = createElement('button', {
        className: 'content-blacklist-button',
        dataset: {action: 'ban'},
        textContent: '屏蔽',
      });
      el.querySelector('.inner .row').appendChild(button);
    })
    rakuenList.querySelector('ul').addEventListener('click', this.onClick.bind(this));
  }

  onClick(e) {
    let action = e.target.dataset.action;
    if (action) {
      let el = e.target.closest('li');
      if (el) this[`_action_${action}`](el);
    }
  }

  async _action_ban(li) {
    let buttons = li.querySelectorAll('button.content-blacklist-button');
    buttons.forEach(btn => {btn.disabled = true;});
    let item = Parser.rakuen.topicIdParser(li);
    try {
      await this._model.addID(item);
    } catch(e) {
      console.error(e);
      if (e.name !== "ConstraintError") {
        alert("添加失败！");
        buttons.forEach(btn => {btn.disabled = false;});
        return;
      }
    }
    li.style.display = 'none';
  }
}

/* 特定小组讨论页(如/group/topic/123456)的屏蔽按钮 */
class TopicPageButtonUI {
  constructor(model) {
    this._model = model;
  }

  static async build() {
    let model = await Model.build();
    return new this(model); // 必须用 new this() 而非 new ConfigUI() (其中this指代当前的Class), 否则其子类调用build时会获得父类对象
  }

  onClick(e) {
    let action = e.target.dataset.action;
    if (action) {
      let el = e.target.closest('h1');
      if (el) this[`_action_${action}`](el);
    }
  }

  async addButtons() {
    let item = ID_TYPE.fromURL(location.href);
    let hasBlocked;
    try {
      hasBlocked = await this._model.hasID(item);
    } catch (e) {
      console.error(e);
      return;
    }
    let title = document.querySelector("#pageHeader h1");
    let button = createElement('button', {
      className: 'content-blacklist-button',
      dataset: {action: hasBlocked? 'unban': 'ban'},
      textContent: hasBlocked? '取消屏蔽': '屏蔽本帖',
    });
    title.appendChild(button);
    button.addEventListener('click', this.onClick.bind(this));
  }

  async _action_ban(h1) {
    let button = h1.querySelector('button.content-blacklist-button');
    button.disabled = true;
    let item = ID_TYPE.fromURL(location.href);
    try {
      await this._model.addID(item);
    } catch(e) {
      console.error(e);
      if (e.name !== "ConstraintError") {
        alert("添加失败！");
        button.disabled = false;
        return;
      }
    }
    button.disabled = false;
    button.textContent = "取消屏蔽";
    button.dataset.action = "unban";
  }

  async _action_unban(h1) {
    let button = h1.querySelector('button.content-blacklist-button');
    button.disabled = true;
    let item = ID_TYPE.fromURL(location.href);
    try {
      await this._model.deleteID(item);
    } catch (e) {
      console.error(e);
      alert("取消失败！");
      button.disabled = false;
      return;
    }
    button.disabled = false;
    button.textContent = "屏蔽本帖";
    button.dataset.action = "ban";
  }
}

/* 特定条目讨论页(如/subject/topic/123456)的屏蔽按钮 */
class SubjectPageButtonUI {
  constructor(model) {
    this._model = model;
  }

  static async build() {
    let model = await Model.build();
    return new this(model); // 必须用 new this() 而非 new ConfigUI() (其中this指代当前的Class), 否则其子类调用build时会获得父类对象
  }

  onClick(e) {
    let action = e.target.dataset.action;
    if (action) {
      let el = e.target.closest('h1');
      if (el) this[`_action_${action}`](el);
    }
  }

  async addButtons() {
    let item = ID_TYPE.fromURL(location.href);
    let hasBlocked;
    try {
      hasBlocked = await this._model.hasID(item);
    } catch (e) {
      console.error(e);
      return;
    }
    let title = document.querySelector("#header h1");
    let button = createElement('button', {
      className: 'content-blacklist-button',
      dataset: {action: hasBlocked? 'unban': 'ban'},
      textContent: hasBlocked? '取消屏蔽': '屏蔽本帖',
    });
    title.appendChild(button);
    button.addEventListener('click', this.onClick.bind(this));
  }

  async _action_ban(h1) {
    let button = h1.querySelector('button.content-blacklist-button');
    button.disabled = true;
    let item = ID_TYPE.fromURL(location.href);
    try {
      await this._model.addID(item);
    } catch(e) {
      console.error(e);
      if (e.name !== "ConstraintError") {
        alert("添加失败！");
        button.disabled = false;
        return;
      }
    }
    button.disabled = false;
    button.textContent = "取消屏蔽";
    button.dataset.action = "unban";
  }

  async _action_unban(h1) {
    let button = h1.querySelector('button.content-blacklist-button');
    button.disabled = true;
    let item = ID_TYPE.fromURL(location.href);
    try {
      await this._model.deleteID(item);
    } catch (e) {
      console.error(e);
      alert("取消失败！");
      button.disabled = false;
      return;
    }
    button.disabled = false;
    button.textContent = "屏蔽本帖";
    button.dataset.action = "ban";
  }
}


async function main() {
  if (location.pathname === '/rakuen/topiclist') {
    let rakuenbtnui = await RakuenButtonUI.build();
    rakuenbtnui.addButtons();
    await rakuenFilter();
  } else if (location.pathname.startsWith('/group/topic/')) {
    let topicpagebtnui = await TopicPageButtonUI.build();
    topicpagebtnui.addButtons();
  } else if (location.pathname.startsWith('/subject/topic/')) {
    let subjectpagebtnui = await SubjectPageButtonUI.build();
    subjectpagebtnui.addButtons();
  } else if (location.pathname === '/') {
    await homepageFilter();
  } else if (location.pathname === '/group/discover') {
    await discoverFilter();
  } else if (location.pathname === '/settings/privacy') {
    let idconfigui = await IDConfigUI.build();
    let kwconfigui = await KeywordConfigUI.build();
    let idui = await idconfigui.getConfigUI();
    let kwui = await kwconfigui.getConfigUI();
    let ui = createElement('div', {id: 'content-blacklist'}, [idui, kwui]);
    document.getElementById("columnA").appendChild(ui);
  }
}

main();
