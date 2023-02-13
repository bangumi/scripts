// ==UserScript==
// @name         bgmnote
// @namespace    xd.cedar.bgmnote
// @description  简易备注
// @author       niR, Cedar
// @version      1.1.3
// @match        *://bgm.tv/blog/*
// @match        *://bgm.tv/ep/*
// @match        *://bgm.tv/group/topic/*
// @match        *://bgm.tv/rakuen/topic/ep/*
// @match        *://bgm.tv/rakuen/topic/group/*
// @match        *://bgm.tv/rakuen/topic/subject/*
// @match        *://bgm.tv/subject/topic/*
// @match        *://bgm.tv/user/*
// @match        *://bangumi.tv/blog/*
// @match        *://bangumi.tv/ep/*
// @match        *://bangumi.tv/group/topic/*
// @match        *://bangumi.tv/rakuen/topic/ep/*
// @match        *://bangumi.tv/rakuen/topic/group/*
// @match        *://bangumi.tv/rakuen/topic/subject/*
// @match        *://bangumi.tv/subject/topic/*
// @match        *://bangumi.tv/user/*
// @match        *://chii.in/blog/*
// @match        *://chii.in/ep/*
// @match        *://chii.in/group/topic/*
// @match        *://chii.in/rakuen/topic/ep/*
// @match        *://chii.in/rakuen/topic/group/*
// @match        *://chii.in/rakuen/topic/subject/*
// @match        *://chii.in/subject/topic/*
// @match        *://chii.in/user/*
// @exclude      *://bgm.tv/user/*/*
// @exclude      *://bangumi.tv/user/*/*
// @exclude      *://chii.in/user/*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==


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


/* 用户存在 默认ID(numberID) 和 修改后的ID(username), 两者的区别是否以数字开头
 * 在数据库中采用 ~numberID -> username 的方式标识其对应关系.
 * 即存储方式 GM_setValue(`~${numberID}`, username)

 * 一条数据称为一个记录(Record), 内容包括一条备注(note)和一个时间戳(timestamp)
 * Record的储存方式为 {note, timestamp}

 * 比如
 * GM_setValue('111111', {note: 'test note 1', timestamp: 1013744751241}) // numberID
 * GM_setValue('~22222', 'mytest') // link
 * GM_setValue('mytest', {note: 'test note 2', timestamp: 101374475124}) // username
 * 注意如果该用户有username, 则note和timestamp仅存储在username的项中
 */
class Database {
  /* 从旧版本更新时优先调用这个函数 */
  static updateFromOldVersion() {
    const CURRENT_VERSION = 1;
    let version = GM_getValue('!currentVersion!');
    if(version && version >= CURRENT_VERSION) return;
    let keys = GM_listValues();
    for (let k of keys) {
      let v = GM_getValue(k);
      let newKey = k.slice(6); // 旧版保存的key是形如"/user/123456"的url
      GM_setValue(newKey, this._createRecord(v, false));
      GM_deleteValue(k);
    }
    GM_setValue('!currentVersion!', CURRENT_VERSION);
  }

  static getRecord(key) {
    key = this._getMainKey(key);
    let record = GM_getValue(key);
    return record || null;
  }
  
  static setNote(key, note) {
    key = this._getMainKey(key);
    let record = GM_getValue(key);
    // 首次添加
    if (!record) {
      record = this._createRecord(note);
      GM_setValue(key, record);
      return;
    }
    // 无需修改
    if (record.note === note) return;
    // 实际修改
    record.note = note;
    record.timestamp = Date.now();
    GM_setValue(key, record);
  }

  /* 把numberID与username关联起来的函数
   * 必然会获得两条record
   */
  static linkRecords(numberID, username) {
    // 判断有效性
    if (!this.isNumberID(numberID)) throw new Error(`${numberID} is not a numberID!`);
    if (!this.isUsername(username)) throw new Error(`${username} is not a username!`);
    let u = GM_getValue(`~${numberID}`);
    if (u && u !== username) throw new Error(`${numberID} has ambiguous links ${username} and ${u}!`);
    // 建立link
    GM_setValue(`~${numberID}`, username);
    // 处理record的冲突
    this._handleConfilct(numberID, username);
  }

  /* 处理note可能存在冲突的两条record,
   * 会把numberID对应的记录保存到username中
   * 保证二者没有冲突, 并修正时间戳 */
  static _handleConfilct(numberID, username) {
    let numRec = GM_getValue(numberID);
    let usrRec = GM_getValue(username);
    // 真值表 (看清楚这里的numRec, 尤其是第二行 numRec=T usrRec=F 的情况！)
    // numRec usrRec 行为
    //   T      T    this._mergeRecords(); GM_deleteValue(numberID);
    //   T      F    GM_setValue(username, numRec); GM_deleteValue(numberID);
    //   F      -    -
    if (!numRec) return;
    if (usrRec) this._mergeRecords(numRec, usrRec);
    else GM_setValue(username, numRec);
    GM_deleteValue(numberID);
  }

  /* 用来处理numberID和username的记录的冲突
   * 会把numberID对应的记录保存到username中
   * 但不会影响到数据库
   * 请保证输入的nRec和uRec均有值
   * numRec = numberID Record, usrRec = username Record */
  static _mergeRecords(numRec, usrRec) {
    // 二者有冲突
    if (numRec.note && usrRec.note && numRec.note !== usrRec.note) {
      const displayTime = timestamp => `修改时间：${timestamp ? new Date(timestamp).toLocaleString("zh-CN") : "未知"}`;
      const makeTitle = (title, timestamp) => `===== ${title} (${displayTime(timestamp)}) =====`;
      usrRec.note = "备注有冲突！"
        + "\n\n" + makeTitle("版本1", numRec.timestamp)
        + "\n" + numRec.note
        + "\n\n" + makeTitle("版本2", usrRec.timestamp)
        + "\n" + usrRec.note
      // timestamp 记录为最新修改时间 (null在比较时会被当作0, 所以已涵盖时间戳为null的情况)
      if (usrRec.timestamp < numRec.timestamp) {
        usrRec.timestamp = numRec.timestamp;
      }
    } // 没冲突则看看 numberID 下有没有 note
    else if (numRec.note) {
      usrRec.note = numRec.note;
      // timestamp 记录为旧的修改时间 (注意处理时间戳为null的情况)
      if (usrRec.timestamp === null
        || numRec.timestamp !== null && usrRec.timestamp > numRec.timestamp) {
        usrRec.timestamp = numRec.timestamp;
      }
    }
  }

  /* 创建函数. 默认会添加一个timestamp */
  static _createRecord(note="", addTimestamp=true) {
    return {note, timestamp: (addTimestamp ? Date.now() : null)};
  }

  static isNumberID(key) {
    return /^\d+$/.test(key);
  }

  static isUsername(key) {
    return /^[a-zA-Z]\w*$/.test(key);
  }

  static _isLinked(numberID, username) {
    return GM_getValue(`~${numberID}`) == username;
  }

  static _getMainKey(key) {
    if (this.isNumberID(key)) {
      let username = GM_getValue(`~${key}`);
      return username || key;
    } else if (this.isUsername(key)) {
      return key;
    } else {
      throw new Error(`key ${key} is not a numberID or a username!`);
    }
  }


  // ====== 导入导出 ======
  static IMPORT_TYPE = {
    KEEP: 0,
    OVERWRITE: 1,
    NEWEST: 2,
    BOTH: 3,

    humanize(type) {
      switch (type) {
        case this.KEEP:
          return "保留原数据";
        case this.OVERWRITE:
          return "覆盖原数据";
        case this.NEWEST:
          return "保存新修改的数据";
        case this.BOTH:
          return "两份都保留";
      }
    }
  };

  static exportRecords() {
    let keys = GM_listValues();
    let notes = {};
    for (let k of keys) {
      let v = GM_getValue(k);
      notes[k] = v;
    }
    return notes;
  }

  /* 导入数据. note的数据类型与 this.exportRecords 获得的数据类型相同.
   * 导入时根据IMPORT_TYPE判断保留哪份数据.
   * 导入操作十分麻烦! 因为需要处理一种特殊情况:
   *   原数据是有冲突的两份note, 因为新数据有link信息才被发现. 这时就需要处理三份数据.
   *   同理, 也有可能新数据是有冲突的两份note, 因为原数据的link信息才被发现. 这时也要处理三份数据.
   * 目前的处理策略是:
   *   先结合原数据和新数据的link信息, 分别填补原数据和新数据缺少的link信息,
   *   并且合并冲突, 最后再进行导入操作.
   * 返回值是导入失败的项和原因.
   */
  static importRecords(notes, type) {
    // 处理版本更新
    if (notes['!currentVersion!'] !== GM_getValue('!currentVersion!')) {
      throw new Error("导入版本与当前版本不符！请将脚本更新到最新版后再进行导入导出！");
    }
    delete notes['!currentVersion!'];

    let errors = [];
    function tryBlock(callBack) {
      try {
        callBack();
      } catch (e) {
        console.error(e);
        errors.push(e.message);
      }
    }

    // 利用新数据填补原数据缺少的link信息
    let keys = Object.keys(notes).filter(x => /^~\d+$/.test(x));
    for (let k of keys) {
      tryBlock(() => this.linkRecords(k.slice(1), notes[k]));
    }
    // 利用原数据填补新数据缺少的link信息
    keys = GM_listValues().filter(x => /^~\d+$/.test(x));
    for (let k of keys) {
      tryBlock(() => this._handleImportLink(notes, k.slice(1), GM_getValue(k)));
    }

    // 保证数据之间都有正确的link后, 根据type设置函数, 进行逐条导入
    let chooseRecord;
    switch (type) {
      case this.IMPORT_TYPE.KEEP:
        chooseRecord = (origRec, _) => origRec; break;
      case this.IMPORT_TYPE.OVERWRITE:
        chooseRecord = (_, newRec) => newRec; break;
      case this.IMPORT_TYPE.NEWEST:
        chooseRecord = (origRec, newRec) => origRec.timestamp > newRec.timestamp ? origRec : newRec; break;
      case this.IMPORT_TYPE.BOTH:
        chooseRecord = (origRec, newRec) => {
          // 这个调用很微妙, 小心不要写错了, 应该更新到origRec里去并返回
          this._mergeRecords(newRec, origRec);
          return origRec;
        };
        break;
    }
    for (let k in notes) {
      if (!this.isNumberID(k) && !this.isUsername(k)) continue;
      let origRec = this.getRecord(k);
      let newRec = notes[k];
      tryBlock(() => {
        let best = newRec;
        // 如果有冲突的话处理冲突
        if (origRec && origRec.note && newRec.note && origRec.note !== newRec.note) {
          best = chooseRecord(origRec, newRec);
        }
        GM_setValue(k, best);
      });
    }
    return errors.length ? errors : null;
  }

  /* 处理导入数据的link信息, 基本就是 this.linkRecords 的微调版本 */
  static _handleImportLink(notes, numberID, username) {
    // 判断有效性
    if (!this.isNumberID(numberID)) throw new Error(`${numberID} is not a numberID!`);
    if (!this.isUsername(username)) throw new Error(`${username} is not a username!`);
    let u = notes[`~${numberID}`];
    if (u && u !== username) throw new Error(`${numberID} has ambiguous links ${username} and ${u}!`);
    // 建立link
    notes[`~${numberID}`] = username;
    // 处理record的冲突
    let numRec = notes[numberID];
    let usrRec = notes[username];
    if (!numRec) return;
    if (usrRec) this._mergeRecords(numRec, usrRec);
    else notes[username] = numRec;
    delete notes[numberID];
  }
}

/* 这里采用 delegation 的方式控制各个按钮
 * 设计理念见 https://javascript.info/event-delegation#delegation-example-actions-in-markup
 * ( 注意关键代码是 this.onClick.bind(this) 所在的那句)
 * 不过因为代码的特殊性, 只需要static函数即可完成任务
 */
class UserPageUI {
  static _decorateElement(el) {
    el.addEventListener('click', this.onClick.bind(this));
  }

  static onClick(e) {
    let el = e.target.closest('[data-action]');
    if (!el) return;
    let action = el.dataset.action;
    this[action]();
  }

  static addNoteButton() {
    let btn = this._createNoteButton();
    let parent = document.querySelector('#headerProfile div.actions');
    parent.appendChild(btn);
  }

  static _createNoteButton() {
    let btn = createElement('a', {
      id: "bgmnotebtn",
      href: "javascript:void(0)", // 为什么bangumi还在用这么蠢的方法做按钮??
      className: "chiiBtn",
      dataset: {action: 'showNote'}
    }, [createElement('span', null, ['备注'])]);
    this._decorateElement(btn);
    return btn;
  }

  static addNoteAreaWrapper(record) {
    let wrapper = this._createNoteAreaWrapper(record);
    let parent = document.querySelector('#user_home .user_box');
    parent.insertAdjacentElement('afterbegin', wrapper);
  }

  static _createNoteAreaWrapper(record) {
    let modifiedTimeStr = !record
      ? "无"
      : record.timestamp
        ? new Date(record.timestamp).toLocaleString("zh-CN")
        : "未知";
    let notearea = createElement('div', {id: 'bgmnote'}, [
      createElement('textarea', {
        className: "reply",
        style: {height: '200px'},
        value: (record ? record.note : "")
      }, null),
      createElement('div', {style: {display: 'flex', 'align-items': 'center'}}, [
        createElement('input', {className: "inputBtn", value: "写好了", type: "submit", dataset: {action: "update"}}, null),
        createElement('a', {href: "javascript:void(0)", style: {'margin-left': '10px'}, dataset: {action: "cancel"}}, ["取消"]),
        createElement('span', {style: {'margin-left': 'auto'}}, [`修改时间：${modifiedTimeStr}`])
      ])
    ]);
    this._decorateElement(notearea);
    return notearea;
  }

  static showNote() {
    // 必须在showNote时就 linkRecords, 而不能等到update时才做, 因为要处理一种特殊情况:
    // 写备注时该用户只有numberID, 等到某一天查看备注时设置了 username.
    // 如果我们此时不link就直接getRecord, 只会获得空备注,
    // 此时修改并且update, 并在update里调用linkRecords, 则会导致旧备注直接被覆盖
    let numberID = this._getNumberID();
    let username = this._getUsername();
    if (numberID && username) Database.linkRecords(numberID, username);
    let record = Database.getRecord(username || numberID);
    this.addNoteAreaWrapper(record);
    document.getElementById('bgmnotebtn').dataset.action = 'hideNote';
  }

  static hideNote() {
    this.update();
  }

  static update() {
    let numberID = this._getNumberID();
    let username = this._getUsername();
    let wrapper = document.getElementById('bgmnote');
    let note = wrapper.querySelector('textarea').value;
    let oldRecord = Database.getRecord(username || numberID);
    // 原先无记录且有新记录 或者 原记录与新记录不同 才会写入
    if (!oldRecord && note || oldRecord && oldRecord.note !== note) {
      Database.setNote(username || numberID, note);
    }

    wrapper.parentElement.removeChild(wrapper);
    document.getElementById('bgmnotebtn').dataset.action = 'showNote';
  }

  static cancel() {
    let numberID = this._getNumberID();
    let username = this._getUsername();
    let wrapper = document.getElementById('bgmnote');
    let noteValue = wrapper.querySelector('textarea').value;
    let oldNote = Database.getRecord(username || numberID) || {note: ""};
    if (oldNote.note !== noteValue && !confirm('备注已更改，确认取消保存？')) return;
    wrapper.parentElement.removeChild(wrapper);
    document.getElementById('bgmnotebtn').dataset.action = 'showNote';
  }

  static _getNumberID() {
    // 用户的numberID并不好找..举例: @aasp2
    // 目前只发现以下几处地方有可能存在:
    // * 没改过username的用户的域名中 (改了就没有了)
    // * 头像的URL (如果他没改头像则无法获取)
    // * 私信链接, '发送短消息'按钮的URL (如果不登录或者本人主页则没有这个按钮)
    // * 日志配图的URL (如果没写过日志/日志没有配图/日志栏移到侧边导致不显示图片, 则没有图片)
    let numberID = location.pathname.split('/').pop();
    if (Database.isNumberID(numberID)) return numberID;
    let el = document.querySelector('#headerProfile span.avatarNeue');
    numberID = el && el.style.backgroundImage.match(/(\d+)\.jpg/);
    if (numberID && Database.isNumberID(numberID[1])) return numberID[1];
    el = document.querySelector('#headerProfile .actions a[href^="/pm/compose"]');
    numberID = el && el.pathname.match(/(\d+)\.chii/);
    if (numberID && Database.isNumberID(numberID[1])) return numberID[1];
    el = document.getElementById('blog');
    if (el) el = el.querySelector('#entry_list .pictureFrameGroup img');
    if (el) numberID = el.src.match(/\/(\d+)_.+\.jpg/);
    if (numberID && Database.isNumberID(numberID[1])) return numberID[1];
    return null;
  }

  static _getUsername() {
    let pathname = location.pathname;
    let index = pathname.lastIndexOf('/');
    let username = pathname.slice(index+1);
    return Database.isUsername(username) ? username : null;
  }
}


/* 给人物头像添加备注 顺便试着link一下有备注的用户
 * 因为一个用户可能在同一个页面出现多次, 所以利用 Map 减少访问数据库的次数 */
function prepareAvatarNotes() {
  let m = new Map();
  for (let el of document.querySelectorAll('div[id^=post_] > a.avatar')) {
    let id = el.pathname.slice(6);
    // Map中有此id说明运行过一次, 后续代码就不需要再运行了
    if (m.has(id)) {
      let record = m.get(id);
      if (record) el.title = record.note;
      continue;
    }

    //判断id的类型, 如果是numberID说明该用户没有username, 直接记录并返回
    if (Database.isNumberID(id)) {
      let record = Database.getRecord(id);
      if (record) el.title = record.note;
      m.set(id, record);
    }
    // id是username时才有link的希望
    else if (Database.isUsername(id)) {
      let username = id;
      // 尝试获取numberID
      let numberID = el.querySelector('span.avatarNeue').style.backgroundImage.match(/(\d+)\.jpg/);
      if (numberID) numberID = numberID[1];
      // 用两个id都尝试获取一下数据
      let record = Database.getRecord(username) || numberID && Database.getRecord(numberID);
      // 如果最终成功获取数据, 那么添加title并link, 更新Map中id对应的值
      if (record) {
        el.title = record.note;
        m.set(id, record);
        Database.linkRecords(numberID, username);
      }
    }
  }
}

function exportNotesTest() {
  let notes = Database.exportRecords();
  console.log(notes);
}

function exportNotes() {
  let notes = Database.exportRecords();
  console.log(notes);
  GM_setClipboard(JSON.stringify(notes, null, 2));
  alert('已复制到剪贴板');
}

/* 导入用函数 因为懒得设计UI了 所以写得比较简陋 */
function importNotes() {
  let notes = prompt('请将导入数据粘贴于此处');
  if (!notes) return;
  let types = Object.values(Database.IMPORT_TYPE).filter(v => !(v instanceof Function));
  let type = prompt(
    "备注有冲突时怎么处理？\n请输入数字选择(懒得做UI)：\n"
    + types.map((v, i) => `${i}: ${Database.IMPORT_TYPE.humanize(v)}`).join('\n')
    + "\n取消：放弃导入"
  );
  if (!type) return;
  let errors = Database.importRecords(JSON.parse(notes), types[type]);
  if (errors) {
    console.error(errors);
    alert('出错了！部分数据导入成功。请前往控制台查看错误。');
  } else {
    alert('导入成功！');
  }
}

function main() {
  Database.updateFromOldVersion();
  GM_registerMenuCommand('导出备注', exportNotes);
  //GM_registerMenuCommand('导出备注（测试）', exportNotesTest);
  GM_registerMenuCommand('导入备注', importNotes);
  if (location.pathname.startsWith('/user/')) {
    UserPageUI.addNoteButton();
  } else {
    prepareAvatarNotes();
  }
}

main();
