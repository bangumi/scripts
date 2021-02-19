// ==UserScript==
// @name         bgmnote
// @namespace    xd.cedar.bgmnote
// @description  简易备注
// @author       niR, Cedar
// @version      1.0
// @encoding     UTF-8
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/group/topic/.*/
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/subject/topic/.*/
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/rakuen/topic/group/.*/
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/rakuen/topic/ep/.*/
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/blog/.*/
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/ep/.*/
// @include      /https://(bgm\.tv|bangumi\.tv|chii\.in)/user/.*/
// @exclude      /https://(bgm\.tv|bangumi\.tv|chii\.in)/user/.*/.*/
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


/* 关键是处理好 默认ID(numberID) 和 修改后的ID(username) 之间的关系
 * 两者的区别为: 是否以数字开头
 * 两种ID储存的记录均为 {numberID, username, note, timestamp}
 * 比如
 * GM_setValue('111111', {numberID: '111111', username: null, note: 'test note 1', timestamp: 1013744751241}) // numberID
   GM_setValue('222222', {numberID: '222222', username: 'mytest', note: null, timestamp: null}) // numberID
   GM_setValue('mytest', {numberID: '222222', username: 'mytest', note: 'test note 2', timestamp: 101374475124}) // username
 * 注意到如果该用户有username, 则note和timestamp仅存储在username的项中. 而numberID中的note设为null
 */
class Database {
  static _isNumberID(key) {
    return /^\d+$/.test(key);
  }

  static _isUsername(key) {
    return /^[a-zA-Z]\w*$/.test(key);
  }

  static _isLinked(record) {
    return record.numberID && record.username;
  }

  /* 创建函数. 默认会添加一个timestamp */
  static _createRecord({numberID, username = null, note = null, addTimestamp = true}) {
    return {numberID, username, note, timestamp: (addTimestamp ? Date.now() : null)};
  }

  /* 从旧版本更新时优先调用这个函数 */
  static updateFromOldVersion() {
    const CURRENT_VERSION = 1;
    let version = GM_getValue('!currentVersion!');
    if(version && version >= CURRENT_VERSION) return;
    let keys = GM_listValues();
    for (let k of keys) {
      let v = GM_getValue(k);
      let newKey = k.slice(6); // 旧版保存的key是形如"/user/123456"的url
      if (this._isNumberID(newKey)) {
        GM_setValue(newKey, this._createRecord({numberID: newKey, username: null, note: v, addTimestamp: false}));
      } else if (this._isUsername(newKey)) {
        GM_setValue(newKey, this._createRecord({numberID: null, username: newKey, note: v, addTimestamp: false}));
      } else {
        throw new Error(`update failed! ${newKey} is not a valid ID`);
      }
      GM_deleteValue(k);
    }
    GM_setValue('!currentVersion!', CURRENT_VERSION);
  }

  /* 把numberID与username关联起来的函数
   * 必然会获得两条record
   */
  static linkRecords(numberID, username) {
    // 判断有效性
    if (!this._isNumberID(numberID)) throw `${numberID} is not a numberID!`;
    if (!this._isUsername(username)) throw `${username} is not a username!`;
    // 获取record, 如果不存在则创建
    let nidRecord = GM_getValue(numberID) || this._createRecord({numberID, username, note: null, addTimestamp: false});
    let usrRecord = GM_getValue(username) || this._createRecord({numberID, username, note: "", addTimestamp: false});
    this._linkRecords(nidRecord, usrRecord);
  }

  /* 把nidRecord与usrRecord关联起来的函数
   * nidRecord与usrRecord是两条记录
   */
  static _linkRecords(nidRecord, usrRecord) {
    if (this._isLinked(nidRecord) && this._isLinked(usrRecord)) return;
    // 处理备注内容的冲突
    this._handleConfilct(nidRecord, usrRecord);
    // 设置link并保存
    nidRecord.username = usrRecord.username;
    usrRecord.numberID = nidRecord.numberID;
    GM_setValue(nidRecord.numberID, nidRecord);
    GM_setValue(usrRecord.username, usrRecord);
  }

  /* 处理note可能存在冲突的两条record,
   * 把 numberID 的 record 更新到 username 的 record 中,
   * 保证二者没有冲突, 并修正时间戳 */
  static _handleConfilct(nidRecord, usrRecord) {
    // 如果存在冲突
    if (nidRecord.note && usrRecord.note && nidRecord.note !== usrRecord.note) {
      const displayTime = timestamp => `修改时间：${timestamp ? new Date(timestamp).toLocaleString("zh-CN") : "未知"}`;
      const makeTitle = (title, timestamp) => `===== ${title} (${displayTime(timestamp)}) =====`;
      usrRecord.note = "备注有冲突！"
        + "\n\n" + makeTitle("版本1", nidRecord.timestamp)
        + "\n" + nidRecord.note
        + "\n\n" + makeTitle("版本2", usrRecord.timestamp)
        + "\n" + usrRecord.note
      // timestamp 记录为最新修改时间 (已涵盖时间戳为null的情况)
      if (usrRecord.timestamp < nidRecord.timestamp) {
        usrRecord.timestamp = nidRecord.timestamp;
      }
    } // 没冲突则看看 numberID 下有没有 note
    else if (nidRecord.note) {
      usrRecord.note = nidRecord.note;
      nidRecord.note = null;
      // timestamp 记录为旧的修改时间 (注意处理时间戳为null的情况)
      if (usrRecord.timestamp === null
        || nidRecord.timestamp !== null && usrRecord.timestamp > nidRecord.timestamp) {
        usrRecord.timestamp = nidRecord.timestamp;
      }
    }
    // 最后把numberID的时间戳去掉
    nidRecord.timestamp = null;
  }

  /* 只获取note, 不会修改username或numberID */
  static getRecord(key) {
    let record = GM_getValue(key);
    if (!record) return null;
    if (this._isNumberID(key) && record.username) {
      record = GM_getValue(record.username);
    }
    return record;
  }

  /* 只修改note, 不会修改username或numberID (且只在note与原note不同时才会修改note)
   * 如果这是第一次添加note(意味着其对应项不存在), 则创建新项并写入数据库
   * (本来如果key是username的话会抛出异常的, 这样写代码时就要先调用 linkRecords() 在数据库中创建该项并构建关联,
   * 然而有些无头像却有username的人的numberID可能不好获取, 所以只能退而求其次.)
   * 否则尝试找到username对应的项并修改
   * 如果找不到, 才选择直接修改numberID对应的项
   */
  static setNote(key, note, timestamp=null) {
    let record = GM_getValue(key);
    if (!record) { // 首次添加
      if (this._isNumberID(key)) {
        record = this._createRecord({numberID: key, username: null, note});
      } else if (this._isUsername(key)) {
        record = this._createRecord({numberID: null, username: key, note});
      } else {
        throw `key ${k} is not a numberID or a username!`;
      }
      GM_setValue(key, record);
      return;
    }
    if (this._isNumberID(key) && record.username) { // 尝试寻找username对应的项
      let realRecord = GM_getValue(record.username);
      if (realRecord) {
        key = record.username;
        record = realRecord;
      }
    }
    if (record.note === note) return;
    record.note = note;
    record.timestamp = timestamp || Date.now();
    GM_setValue(key, record);
  }

  static exportNotes() {
    let keys = GM_listValues();
    let notes = {};
    for (let k of keys) {
      let v = GM_getValue(k);
      notes[k] = v;
    }
    return notes;
  }

  /* 导入数据. note的数据类型与 this.exportNotes 获得的数据类型相同.
   * 导入时要根据timestamp判断两份数据的新旧, 仅保留新数据.
   * 导入操作十分麻烦! 因为需要处理一种特殊情况:
   *   原数据是有冲突的两份note, 因为新数据有link信息才被发现. 这时就需要处理三份数据.
   *   同理, 也有可能新数据是有冲突的两份note, 因为原数据的link信息才被发现. 这时也要处理三份数据.
   * 目前的处理策略是:
   *   先结合原数据和新数据的link信息, 分别填补原数据和新数据缺少的link信息,
   *   然后合并两个数据库中冲突的note, 最后再进行导入操作.
   * 返回值是导入失败的项和原因.
   */
  static importNotes(notes) {
    delete notes['!currentVersion!'];
    let errors = {};
    let hasError = false;

    // 填补原数据和新数据缺少的link信息
    let keys = new Set([...GM_listValues(), ...Object.keys(notes)]);
    keys.delete('!currentVersion!');
    for (let k of keys) {
      let origNote = GM_getValue(k);
      let newNote = notes[k];
      let origNumberID = origNote? origNote.numberID: null;
      let origUsername = origNote? origNote.username: null;
      let newNumberID = newNote? newNote.numberID: null;
      let newUsername = newNote? newNote.username: null;
      try {
        // 处理link信息
        this._handleImportLink(notes, origNumberID, origUsername, newNumberID, newUsername);
      } catch (e) {
        console.error(e);
        errors[k] = e;
        hasError = true;
      }
      keys.delete(origNumberID);
      keys.delete(origUsername);
      keys.delete(newNumberID);
      keys.delete(newUsername);
    }

    // 逐条导入
    for (let k in notes) {
      let v = notes[k];
      try {
        this._importNote(v);
      } catch (e) {
        console.error(e);
        errors[k] = e;
        hasError = true;
      }
    }
    return hasError ? errors : null;
  }

  static _handleImportLink(notes, origNumberID, origUsername, newNumberID, newUsername) {
    if (origNumberID && newNumberID && origNumberID !== newNumberID
      || origUsername && newUsername && origUsername !== newUsername) {
      throw `${newNumberID || origNumberID || newUsername || newNumberID} has ambiguous id!`;
    }
    if (newNumberID && newUsername) {
      // 只要导入的数据里有这个link, 就马上在数据库中link这二者. (且该函数会自动创建对应条目)
      this.linkRecords(newNumberID, newUsername);
    } else if (origNumberID && origUsername) {
      // 如果原始数据有link, 则只在导入的数据的nidNote和usrnote均存在的情况下才link二者.
      let newNidNote = notes[origNumberID];
      let newUsrNote = notes[origUsername];
      if (newNidNote && newUsrNote) this._linkRecords(newNidNote, newUsrNote);
    }
  }

  /* 导入单条数据.
   * 新备注会覆盖旧备注.
   * 调用前如果不处理有冲突的内容, 则有冲突的笔记有可能因此丢失.
   */
  static _importNote(v) {
    let k = v.username || v.numberID;
    if (v.numberID && v.username) {
      this.linkRecords(v.numberID, v.username);
    }
    let note = this.getRecord(k);
    if (!note) {
      GM_setValue(k, v);
    } else if (note.timestamp <= v.timestamp) {
      this.setNote(k, v.note, v.timestamp);
    }
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
    let parent = document.querySelector('#headerProfile div.rr');
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

  static addNoteAreaWrapper(note) {
    let wrapper = this._createNoteAreaWrapper(note);
    let parent = document.querySelector('#user_home .user_box');
    parent.insertAdjacentElement('afterbegin', wrapper);
  }

  static _createNoteAreaWrapper(note) {
    let modifiedTimeStr = note ? (note.timestamp ? new Date(note.timestamp).toLocaleString("zh-CN") : "未知") : "无";
    let notearea = createElement('div', {id: 'bgmnote'}, [
      createElement('textarea', {
        className: "reply",
        style: {height: '200px'},
        value: (note ? note.note : "")
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
    // 如果我们此时不link就直接getRecord, 则会获得空备注,
    // 此时修改并且update, 并在update里调用linkRecords, 则会导致旧备注直接被覆盖
    let numberID = this._getNumberID();
    let username = this._getUsername();
    if (numberID && username) Database.linkRecords(numberID, username);
    let note = Database.getRecord(username || numberID);
    this.addNoteAreaWrapper(note);
    let bgmnotebtn = document.getElementById('bgmnotebtn');
    bgmnotebtn.dataset.action = 'hideNote';
  }

  static hideNote() {
    this.update();
    let bgmnotebtn = document.getElementById('bgmnotebtn');
    bgmnotebtn.dataset.action = 'showNote';
  }

  static update() {
    let numberID = this._getNumberID();
    let username = this._getUsername();
    let wrapper = document.getElementById('bgmnote');
    let note = wrapper.querySelector('textarea').value;
    Database.setNote(username || numberID, note);

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
    if (Database._isNumberID(numberID)) return numberID;
    let el = document.querySelector('#headerProfile span.avatarNeue');
    numberID = el && el.style.backgroundImage.match(/(\d+)\.jpg/);
    if (numberID && Database._isNumberID(numberID[1])) return numberID[1];
    el = document.querySelector('#headerProfile .rr a[href^="/pm/compose"]');
    numberID = el && el.pathname.match(/(\d+)\.chii/);
    if (numberID && Database._isNumberID(numberID[1])) return numberID[1];
    el = document.getElementById('blog');
    if (el) el = el.querySelector('#entry_list .pictureFrameGroup img');
    if (el) numberID = el.src.match(/\/(\d+)_.+\.jpg/);
    if (numberID && Database._isNumberID(numberID[1])) return numberID[1];
    return null;
  }

  static _getUsername() {
    let pathname = location.pathname;
    let index = pathname.lastIndexOf('/');
    let username = pathname.slice(index+1);
    if (Database._isUsername(username)) return username;
    else return null;
  }
}


function prepareAvatarNotes() {
  document.querySelector('div[id^=post_] > a.avatar').forEach(el => {
    let note = Database.getRecord(el.pathname.slice(6));
    if (note) el.title = note.note;
  });
}

function exportNotesTest() {
  let notes = Database.exportNotes();
  console.log(notes);
}

function exportNotes() {
  let notes = Database.exportNotes();
  console.log(notes);
  GM_setClipboard(JSON.stringify(notes, null, 2));
  alert('已复制到剪贴板');
}

/* 导入用函数 因为懒得设计UI了 所以写得比较简陋 */
function importNotes() {
  if(!confirm('确认导入？冲突项会被覆盖！')) return;
  let notes = prompt('粘贴于此处');
  let errors = Database.importNotes(JSON.parse(notes));
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
