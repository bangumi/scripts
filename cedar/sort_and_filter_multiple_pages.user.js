// ==UserScript==
// @name        Bangumi多种类页面排序与筛选
// @namespace   tv.bgm.cedar.sortandfiltermultiplepages
// @version     2.1.1
// @description 为多种不同的页面添加排序与筛选功能
// @author      Cedar
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/comments.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/reviews.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/index.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/board.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/(wishes|collections|doings|on_hold|dropped).*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/rakuen/topiclist.*/
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
/*sorter buttons*/
.main-wrapper a.chiiBtn {
  min-width: max-content;
}
.main-wrapper a.chiiBtn:hover {
  cursor: pointer;
}
.main-wrapper a.chiiBtn[data-order="descend"]::after {
  content: '↓';
}
.main-wrapper a.chiiBtn[data-order="ascend"]::after {
  content: '↑';
}

.button-wrapper {
  display: flex;
  justify-content: space-between;
}

.filter-wrapper>div{
  display: inline-block;
}
/*filter title*/
.filter-wrapper span {
  font-size: 14px;
}
.filter-wrapper input {
  margin-top: 3px;
  margin-bottom: 3px;
  padding: 3px;
}
/*left input box*/
.filter-wrapper span+input {
  margin-left: 4px;
  margin-right: 2px;
}
/*right input box*/
.filter-wrapper span+input+input {
  margin-left: 2px;
  margin-right: 1em;
}
.unknown-registration-time, html[data-theme='dark'] .unknown-registration-time {
  background-color: rgba(255,46,61,0.2);
}
`);

'use strict';

/** Filterer的基本思路
 * Filterer 构建与页面元素关联的筛选模块
 * FilterController 统领全部Filterer, 添加重置功能与按钮
 */


/** === 页面统计 ===

 o 超展开 /rakuen/topiclist
 * 小组讨论 /group/{name}/forum
 * 全部目录 /index/browser
 x 全部日志(没什么信息, 不做) /blog, (anime|book|music|game|real)/blog
 x 分类浏览(信息填写不规范 难以提取, 不做) (anime|book|music|game)/browser, real/browser/platform/(jp|en)
 x 目录(没什么信息, 不做) index/{id}

 * --- 条目页 ---
 x 角色页(不做) /subject/{id}/characters
 x 制作人员(不做) /subject/{id}/persons
 o 吐槽页 /subject/{id}/comments
 o 评论页 /subject/{id}/reviews
 o 讨论版 /subject/{id}/board
 o 评分页 /subject/{id}/(wishes|collections|doings|on_hold|dropped)
 o 目录页 /subject/{id}/index

 * --- 与我有关 ---
 * 发表的话题 /group/my_topic
 * 回复的话题 /group/my_reply
 * 创建的目录 /user/{uid}/index
 * 收藏的目录 /user/{uid}/index/collect
 x 个人日志(不做) /user/{uid}/blog
 x 各类收藏页(信息填写不规范 难以提取, 不做) /(anime|book|music|game|real)/list/313469/(do|collect|wish|on_hold|dropped)
 */

// ===== utils =====
const createButton = text => $(document.createElement('a')).addClass('chiiBtn').text(text);
const pz = (p, s) => (p+s).slice(-p.length); // a function to patch zeros before positive integer

/**
 * input date string ('10m ago' or '2019-01-01') -> output milliseconds in numeric value
 * @param {string} date
 * @returns {int} timestamp
 */
function parseDatetimeString(date) {
  if (date.includes('ago')) {
    const convert = t => t? parseInt(t.toString().slice(0,-1)): 0;
    let s = convert(date.match(/\d+s/));
    let m = convert(date.match(/\d+m/));
    let h = convert(date.match(/\d+h/));
    let d = convert(date.match(/\d+d/));
    return Date.now() - ((((d*24+h)*60+m)*60+s)*1000);
  }

  //let offset = new Date().getTimezoneOffset()/-60;
  //offset = `${offset >= 0? '+': ''}${pz('00', offset)}:00`;
  let dateFormat;
  dateFormat = /(\d+)-(\d+)-(\d+) (\d+):(\d+)/;
  if(dateFormat.test(date)) {
    let [year, mon, day, h, m] = date.match(dateFormat).slice(1).map(Number);
    return new Date(year, mon-1, day, h, m).getTime();
  }
  dateFormat = /(\d+)-(\d+)-(\d+)/;
  if(dateFormat.test(date)) {
    let [year, mon, day] = date.match(dateFormat).slice(1).map(Number);
    return new Date(year, mon-1, day).getTime();
  }
  return new Date(date).getTime();
}

/**
 * 创建一个元素.
 *
 * @example
 * 用法举例(紧凑写法):
 * createElement(
 *   'button', {
 *     id: 'confirm-button',
 *     className: 'my-button active',
 *     style: {borderRadius: '5px'}, // 或者 {'border-radius': '5px'}
 *     dataset: {clicked: 'false'}
 *   },
 *   ['确定'], {
 *     click: function(e) { ... }
 *   }
 * )
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

/**
 * @param {HTMLElement} parentNode
 * @param {object} parserCollection - contains some parser like datetimeParser or scoreParser,
 * and they will be called internally later like parserCollection['scoreParser'](element)
 *
 * @example
 * let s = new SortController(document.querySelector('ul.my-list'));
 * s.addResetButton(...); // see those functions for detail
 * s.addSortButton(...);
 * let ui = s.getSorterUI();
 */
class SortController {
  constructor(parentNode, parserCollection) {
    this._parentNode = parentNode;
    this._parsers = parserCollection;
    this._sorterUI = this._createSorterUI();
  }

  /**
   * UI很简单 结构类似这样:
   * <div>
   *   <a class="chiiBtn" data-parser="datetimeParser" data-default-order="descend" data-action="reset">默认顺序</a>
   *   <a class="chiiBtn" data-parser="scoreParser"    data-default-order="descend" data-action="sort" >评分顺序</a>
   *   <a class="chiiBtn" data-parser="datetimeParser" data-default-order="ascend"  data-action="sort" >时间顺序</a>
   *   <a class="chiiBtn" data-parser="lengthParser"      data-default-order="descend" data-action="sort" >字数顺序</a>
   *   ......
   * </div>
   */
  _createSorterUI() {
    let wrapper = createElement('div', null, null, {click: this});
    return wrapper;
  }

  getSorterUI() {
    return this._sorterUI;
  }

  // 直接把 object 作为参数传给 addEventListener 的话,
  // 事件触发时, 该 object 的 handleEvent() 函数就会被自动调用,
  // 所以只需要写 addEventListener('click', this) 不再需要 addEventListener('click', this.onClick.bind(this)) 了
  handleEvent(e) {
    let action = e.target.dataset.action;
    if (action) {
      this[action](e.target);
      e.stopPropagation();
    }
  }

  addResetButton(name, parserName, defaultOrder) {
    let button = this._createButton(name, parserName, defaultOrder, 'reset');
    this._sorterUI.insertAdjacentElement('afterbegin', button);
  }

  addSortButton(name, parserName, defaultOrder) {
    let button = this._createButton(name, parserName, defaultOrder, 'sort');
    this._sorterUI.appendChild(button);
  }

  /**
   * create a button that will do some actions
   * @param {string} name
   * @param {string} parserName - 要在 this._parsers 中有对应项
   * @param {string} defaultOrder - "descend"/"ascend"
   * @param {string} action - "reset"/"sort"
   * @returns {Object} a button
   *
   * @example
   * let dateSortBtn = this._createButton('日期顺序', 'dateParser', 'descend', 'sort');
   */
  _createButton(name, parserName, defaultOrder, action) {
    let button = createElement('a', {
      className: 'chiiBtn',
      dataset: {parser: parserName, defaultOrder, action},
    }, name);
    return button;
  }

  sort(button) {
    const parser = this._parsers[button.dataset.parser];
    // 排序前先确定顺序. 这里的dataset.order指当前排序的order
    let sortInDescendOrder = button.dataset.order
      ? button.dataset.order === 'ascend'
      : button.dataset.defaultOrder === 'descend';
    // 如果classList里有'focused', 说明上次排序就是照着这个顺序排的,
    // 那么为性能考虑, 这次只需要reverse(), 不需要sort()
    // 不过这要求两次排序之间没有新元素添加进来, 否则新元素不会被正确排序
    let justReverseIt = button.classList.contains('focused');
    // 排序
    this._doSort(parser, sortInDescendOrder, justReverseIt);
    // 调整元素
    button.dataset.order = sortInDescendOrder ? 'descend' : 'ascend';
    this._focusThis(button);
  }

  reset(button) {
    if (button.classList.contains('focused')) return;
    const parser = this._parsers[button.dataset.parser];
    let sortInDescendOrder = button.dataset.defaultOrder === 'descend';
    this._doSort(parser, sortInDescendOrder);
    this._sorterUI.querySelectorAll('.chiiBtn').forEach(x => delete x.dataset.order);
    this._focusThis(button);
  }

  _doSort(parser, sortInDescendOrder, justReverseIt) {
    if (justReverseIt) {
    Array.from(this._parentNode.children)
      .map(x => this._parentNode.removeChild(x))
      .reverse()
      .forEach(x => {this._parentNode.appendChild(x)});
      return;
    }
    // compareFn 不直接相减是为了适配字符串比较
    const compareFn = sortInDescendOrder
      ? (lft, ryt) => {
        let lftData = parser(lft);
        let rytData = parser(ryt);
        if (rytData > lftData) return 1;
        else if (rytData == lftData) return 0;
        else return -1;
      }
      : (lft, ryt) => {
        let lftData = parser(lft);
        let rytData = parser(ryt);
        if (lftData > rytData) return 1;
        else if (lftData == rytData) return 0;
        else return -1;
      };
    // 排序
    Array.from(this._parentNode.children)
      .map(x => this._parentNode.removeChild(x))
      .sort(compareFn)
      .forEach(x => {this._parentNode.appendChild(x)});
  }

  _focusThis(button) {
    this._sorterUI.querySelectorAll('.chiiBtn.focused').forEach(x => x.classList.remove('focused'));
    button.classList.add('focused');
  }
}

class Filterer {
  $filterEl;

  constructor({
    elParser,   // parse element info when check whether it should be filtered
    titleStr,   // title string
    inputType,  // should be 'number' or 'datetime-local' or 'date'
    min, max,   // restirct the input range
    lftDft=null, // left default value. if not set, same as 'min'
    rytDft=null, // right default value. if not set, same as 'max'
    width=null, // set input width
    setPlaceholder=false  // will set placeholder with min and max if true
  }) {
    this._elParser = elParser;

    this._wrapper = Filterer.createFilterEl(
      titleStr, inputType, min, max,
      width, setPlaceholder);

    this._wrapper.$left.data('default', lftDft == null? min: lftDft);
    this._wrapper.$right.data('default', rytDft == null? max: rytDft);

    this.$filterEl = this._wrapper.$wrap;
  }

  static createFilterEl(titleStr, inputType, min, max, width=null, setPlaceholder=false) {
    const $title = $(document.createElement('span')).text(titleStr);
    const $left  = Filterer.createInputEl(inputType, min, max, width, setPlaceholder? min: null);
    const $right = Filterer.createInputEl(inputType, min, max, width, setPlaceholder? max: null);
    const $wrap  = $(document.createElement('div')).append($title, $left, $right);
    return {$wrap, $title, $left, $right};
  }

  static createInputEl(inputType, min, max, width=null, placeholder=null) {
    const attrs = {'type': inputType, min, max};
    let $input = $(document.createElement('input')).attr(attrs);
    if (width != null) {
      $input.css('width', width);
    }
    if(placeholder != null) {
      $input.attr('placeholder', placeholder);
    }
    return $input;
  }

  match(el) {
    let n = this._elParser(el);
    let min = this._valueParser(this._inputParser(this._wrapper.$left));
    let max = this._valueParser(this._inputParser(this._wrapper.$right));
    return min <= n && n <= max;
  }

  _inputParser($el) {
    // 把值从input中取出, 没有值的话则返回默认值 (默认值由子类指定)
    return $el.val() || $el.data('default');
  }

  reset() {
    this._wrapper.$left.val('');
    this._wrapper.$right.val('');
  }

  // implement this in subclass
  _valueParser() {} // 把获得的值转换为可比较的形式 (如 时间字符串->时间戳)
}

class NumberFilterer extends Filterer {
  constructor({
    elParser, titleStr, min, max,
    lftDft=null, rytDft=null, width=null, setPlaceholder=false
  }) {
    super({ elParser, titleStr, inputType: 'number',
      min, max, lftDft, rytDft, width, setPlaceholder })
  }

  _valueParser(v) {
    return Number(v);
  }
}

class DatetimeFilterer extends Filterer {
  constructor({ elParser, titleStr, min, max,
    lftDft=null, rytDft=null, width=null, setPlaceholder=false
  }) {
    super({ elParser, titleStr, inputType: 'datetime-local',
      min, max, lftDft, rytDft, width, setPlaceholder })
  }

  _valueParser(v) {
    return new Date(v).getTime();
  }

  reset() {
    this._wrapper.$left.val('');
    this._wrapper.$right.val('');
    // reset right input to current time
    //let d = new Date(); // Note: d.getMonth() starts with 0.
    //this._wrapper.$right.val(`${pz('0000', d.getFullYear())}-${pz('00', d.getMonth()+1)}-${pz('00', d.getDate())}T${pz('00', d.getHours())}:${pz('00', d.getMinutes())}`);
  }
}

class DateFilterer extends Filterer {
  constructor({ elParser, titleStr, min, max,
    lftDft=null, rytDft=null, width=null, setPlaceholder=false
  }) {
    super({ elParser, titleStr, inputType: 'date',
      min, max, lftDft, rytDft, width, setPlaceholder })
  }

  _valueParser(v) {
    return new Date(v).getTime();
  }

  reset() {
    this._wrapper.$left.val('');
    this._wrapper.$right.val('');
    // reset right input to current time
    //let d = new Date(); // Note: d.getMonth() starts with 0.
    //this._wrapper.$right.val(`${pz('0000', d.getFullYear())}-${pz('00', d.getMonth()+1)}-${pz('00', d.getDate())}T${pz('00', d.getHours())}:${pz('00', d.getMinutes())}`);
  }
}

class FilterController {
  $filterWrapper;
  $showBtn;

  constructor(parentNode, filterers) {
    // filterers: 元素为 Filterer的子类 的数组
    this._filterers = filterers;
    this._parentNode = parentNode;

    this._$resetBtn = createButton('重置').on('click', () => this.resetAll());
    this.$showBtn = createButton('筛选').on('click', () => this.$filterWrapper.slideToggle('fast'));

    this.$filterWrapper = $(document.createElement('div'))
      .append(this._filterers.map(x => x.$filterEl), this._$resetBtn)
      .on('blur', 'input', () => this.doFilter())
      .on('keydown', 'input', e => {
        if(!e.isComposing && e.keyCode === 13) this.doFilter();
      });
  }

  doFilter() {
    let items = Array.from(this._parentNode.children).map(x => this._parentNode.removeChild(x));
    for(let c of items) {
      if(this._filterers.some(x => !x.match(c))) {
        c.style.display = 'none';
        continue;
      }
      c.style.display = '';
    }
    items.forEach(x => this._parentNode.appendChild(x));
  }

  resetFilters() {
    this._filterers.forEach(x => x.reset());
  }

  resetAll() {
    this.resetFilters();
    this.doFilter();
  }
}

class MainController {
  $mainWrapper;

  constructor(sortController=null, filterController=null) {
    this._sortController = sortController;
    this._filterController = filterController;

    this.$mainWrapper = $(document.createElement('div')).addClass('main-wrapper');
    let buttonWrapper = $(document.createElement('div')).addClass('button-wrapper').appendTo(this.$mainWrapper);
    if (this._sortController) {
      buttonWrapper.append(this._sortController.getSorterUI());
    }
    if(this._filterController) {
      buttonWrapper.append($(document.createElement('span')).append(this._filterController.$showBtn));
      this.$mainWrapper.append(this._filterController.$filterWrapper.addClass('filter-wrapper').hide());
    }
  }
}

// 吐槽页 /subject/{id}/comments
class CommentsParser {
  static lengthParser = el => el.querySelector('p').innerText.length;
  static datetimeParser = el => parseDatetimeString(el.querySelector('small').innerText.slice(2));

  static scoreParser(el) {
    let e = el.querySelector('.starlight');
    return e? parseInt(e.classList[1].slice(5)): 0;
  }

  static userIdParser(el) {
    // this function will also add a class to fail-to-parse users.
    let uid = el.querySelector('.avatarNeue').style.backgroundImage.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //default icon user
    uid = el.querySelector('a').href.match(/\d+/);
    if (uid) return parseInt((uid.toString()));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }
}

function subjectComments() {
  let parentNode = document.getElementById('comment_box');

  let sortController = new SortController(parentNode, CommentsParser);
  sortController.addResetButton('初始顺序', 'datetimeParser', 'descend');
  sortController.addSortButton('字数顺序', 'lengthParser', 'descend');
  sortController.addSortButton('评分顺序', 'scoreParser', 'descend');
  sortController.addSortButton('时间顺序', 'datetimeParser', 'ascend');
  sortController.addSortButton('注册顺序', 'userIdParser', 'ascend');

  let commentFilter = new NumberFilterer({
    elParser: CommentsParser.lengthParser,
    titleStr: '字数',
    min: 0, max: 200,
    width: '40px',
    setPlaceholder: true
  });
  let scoreFilter = new NumberFilterer({
    elParser: CommentsParser.scoreParser,
    titleStr: '评分',
    min: 0, max: 10,
    width: '35px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: CommentsParser.datetimeParser,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: CommentsParser.userIdParser,
    titleStr: 'UID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let filterController = new FilterController(parentNode, [commentFilter, scoreFilter, userIdFilter, datetimeFilter]);

  let mainController = new MainController(sortController, filterController);
  $(parentNode).before(mainController.$mainWrapper);
}

// 评论页 /subject/{id}/reviews
class ReviewsParser {
  static blogIdParser = el => parseInt(el.querySelector('.title a').href.match(/\d+/).toString());
  static datetimeParser = el => parseDatetimeString(el.querySelector('small.time').innerText);
  static replyNumParser = el => parseInt(el.querySelector('div.time .orange').innerText.match(/\d+/).toString());

  static userIdParser(el) {
    // this function will also add a class to fail-to-parse users.
    let uid = el.querySelector('img').src.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //default icon user
    uid = el.querySelector('.tip_j a.l').href.match(/\d+/);
    if (uid) return parseInt((uid.toString()));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }
}

function subjectReviews() {
  let parentNode = document.getElementById('entry_list');

  let sortController = new SortController(parentNode, ReviewsParser);
  sortController.addResetButton('初始顺序', 'blogIdParser', 'descend');
  sortController.addSortButton('回复数量', 'replyNumParser', 'descend');
  sortController.addSortButton('发布顺序', 'blogIdParser', 'ascend');
  sortController.addSortButton('注册顺序', 'userIdParser', 'ascend');

  let replyNumFilter = new NumberFilterer({
    elParser: ReviewsParser.replyNumParser,
    titleStr: '回复',
    min: 0, max: null,
    rytDft: Infinity,
    width: '40px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: ReviewsParser.datetimeParser,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: ReviewsParser.userIdParser,
    titleStr: 'UID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: false
  });
  let filterController = new FilterController(parentNode, [replyNumFilter, userIdFilter, datetimeFilter]);

  let mainController = new MainController(sortController, filterController);
  $(parentNode).before(mainController.$mainWrapper);
}

// 目录页 /subject/{id}/index
class IndexParser {
  static indexIdParser = el => parseInt(el.id.slice(5));
  static updateDateParser = el => parseDatetimeString(el.querySelector('.tip_j .tip').innerText);

  static userIdParser(el) {
    // this function will also add a class to fail-to-parse users.
    let uid = el.querySelector('.avatarNeue').style.backgroundImage.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //default icon user
    uid = el.querySelector('.tip_j a.l').href.match(/\d+/);
    if (uid) return parseInt((uid.toString()));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }
}

function subjectIndex() {
  let parentNode = document.querySelector('#timeline>ul');

  let sortController = new SortController(parentNode, IndexParser);
  // 没有初始顺序 因为初始顺序是该目录加入该条目的时间 页面中没显示
  sortController.addSortButton('目录ID', 'indexIdParser', 'ascend');
  sortController.addSortButton('最后更新', 'updateDateParser', 'descend');
  sortController.addSortButton('注册顺序', 'userIdParser', 'ascend');

  let indexIdFilter = new NumberFilterer({
    elParser: IndexParser.indexIdParser,
    titleStr: '目录ID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let updateDatetimeFilter = new DatetimeFilterer({
    elParser: IndexParser.updateDatetimeParser,
    titleStr: '更新时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: IndexParser.userIdParser,
    titleStr: 'UID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let filterController = new FilterController(parentNode, [indexIdFilter, userIdFilter, updateDatetimeFilter]);

  let mainController = new MainController(sortController, filterController);
  $(document.getElementById('timeline')).before(mainController.$mainWrapper);
}

// 讨论版 /subject/{id}/board
class SubjectBoardParser {
  static topicIdParser = el => parseInt(el.querySelector('.subject a.l').href.match(/\d+/).toString());
  static nameParser = el => el.children[1].innerText;
  static replyNumParser = el => parseInt(el.children[2].innerText.split(' ', 1)[0]);
  static dateParser = el => parseDatetimeString(el.children[3].innerText);
}

function subjectBoard() {
  let parentNode = document.querySelector('.topic_list>tbody');

  let sortController = new SortController(parentNode, SubjectBoardParser);
  // 没有初始顺序 因为初始顺序是最后回复日期 但最后回复日期有可能是同一天 导致排序结果与原始顺序不同
  sortController.addSortButton('目录ID', 'indexIdParser', 'ascend');
  sortController.addSortButton('发布顺序', 'topicIdParser', 'descend');
  sortController.addSortButton('用户名', 'nameParser', 'ascend');
  sortController.addSortButton('回复数量', 'replyNumParser', 'descend');
  sortController.addSortButton('最后回复', 'dateParser', 'descend');

  let replyNumFilter = new NumberFilterer({
    elParser: SubjectBoardParser.replyNumParser,
    titleStr: '回复数量',
    min: 0, max: null,
    rytDft: Infinity,
    width: '40px',
    setPlaceholder: true
  });
  let dateFilter = new DateFilterer({
    elParser: SubjectBoardParser.dateParser,
    titleStr: '最后回复',
    min: '1970-01-01',
    max: '2999-01-01',
    width: null,
    setPlaceholder: false
  });
  let filterController = new FilterController(parentNode, [replyNumFilter, dateFilter]);

  let mainController = new MainController(sortController, filterController);
  $(document.querySelector('.topic_list')).before(mainController.$mainWrapper);
}

// 评分页 /subject/{id}/(wishes|collections|doings|on_hold|dropped)
class CollectParser {
  static datetimeParser = el => parseDatetimeString(el.querySelector('p.info').innerText);

  static lengthParser(el) {
    let commentNode = el.querySelector('.userContainer').lastChild;
    if(commentNode.nodeType == Node.TEXT_NODE) return commentNode.length;
    return 0;
  }

  static scoreParser(el) {
    let e = el.querySelector('.starlight');
    return e? parseInt(e.classList[1].slice(5)): 0;
  }

  static userIdParser(el) {
    // this function will also add a class to fail-to-parse users.
    let uid = el.querySelector('img.avatar').src.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //default icon user
    uid = el.querySelector('a.avatar').href.match(/\d+/);
    if (uid) return parseInt((uid.toString()));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }
}

function subjectCollect() {
  let parentNode = document.getElementById('memberUserList');

  let sortController = new SortController(parentNode, CollectParser);
  sortController.addResetButton('初始顺序', 'datetimeParser', 'descend');
  sortController.addSortButton('字数顺序', 'lengthParser', 'descend');
  sortController.addSortButton('评分顺序', 'scoreParser', 'descend');
  sortController.addSortButton('时间顺序', 'datetimeParser', 'ascend');
  sortController.addSortButton('注册顺序', 'userIdParser', 'ascend');

  let commentFilter = new NumberFilterer({
    elParser: CollectParser.lengthParser,
    titleStr: '字数',
    min: 0, max: 200,
    width: '40px',
    setPlaceholder: true
  });
  let scoreFilter = new NumberFilterer({
    elParser: CollectParser.scoreParser,
    titleStr: '评分',
    min: 0, max: 10,
    width: '35px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: CollectParser.datetimeParser,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: CollectParser.userIdParser,
    titleStr: 'UID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let filterController = new FilterController(parentNode, [commentFilter, scoreFilter, userIdFilter, datetimeFilter]);

  let mainController = new MainController(sortController, filterController);
  $(parentNode).before(mainController.$mainWrapper);
}

// 超展开 /rakuen/topiclist
class RakuenParser {
  static replyNumParser = el => parseInt(el.querySelector('small.grey').innerText.slice(2, -1));
  static datetimeParser = el => parseDatetimeString(el.querySelector('small.time').innerText.replace('...', ''));

  static itemIdParser(el) {
    return parseInt(el.id.split('_')[2]);
    // 本想把 subject group ep crt prsn 等前缀字符串直接加入比较, 然而只有Python能正确对array进行比较
    //let id = el.id.split('_')[2];
    //id[1] = Number(id[1]);
    //return id;
  }

  static userIdParser(el) {
    // this function will also add a class to fail-to-parse users.
    if(!/subject|group/.test(el.id)) return Infinity; // 不是小组帖子或条目讨论 自然没有UserId
    let uid = el.querySelector('.avatarNeue').style.backgroundImage.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }

  static typeParser(el) {
    // 提取出groupID subjectID(章节讨论/条目讨论) 角色ID 人物ID (角色ID/人物ID 跟ItemId相同)
    let keyEl = el.querySelector('.row a') || el.querySelector('a.avatar');
    return new URL(keyEl.href).pathname;
  }
}

function rakuen() {
  let parentNode = document.querySelector('#eden_tpc_list>ul');

  let sortController = new SortController(parentNode, RakuenParser);
  sortController.addResetButton('初始顺序', 'datetimeParser', 'descend');
  sortController.addSortButton('回复', 'replyNumParser', 'descend');
  sortController.addSortButton('活跃', 'datetimeParser', 'ascend');
  if(!location.search) { //超展开的"全部"栏无法根据item编号排序
    //sortController.addSortButton('发布', 'itemIdParser', 'descend');
    sortController.addSortButton('UID', 'userIdParser', 'ascend');
  } else if(/group|subject/.test(location.search)) { //超展开的小组帖子与条目讨论可以根据item编号排序
    sortController.addSortButton('发布', 'itemIdParser', 'descend');
    sortController.addSortButton('UID', 'userIdParser', 'ascend');
  } else { // 章节(ep) 角色(crt) 人物(prsn) 没有 UserId
    sortController.addSortButton('发布', 'itemIdParser', 'descend');
    //sortController.addSortButton('UID', 'userIdParser', 'ascend');
  }
  sortController.addSortButton('类型', 'typeParser', 'ascend');

  let replyNumFilter = new NumberFilterer({
    elParser: RakuenParser.replyNumParser,
    titleStr: '回复数量',
    min: 0, max: null,
    rytDft: Infinity,
    width: '40px',
    setPlaceholder: true
  });
  let userIdFilter = new NumberFilterer({
    elParser: RakuenParser.userIdParser,
    titleStr: '用户ID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: RakuenParser.datetimeParser,
    titleStr: '最近活跃',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let filterController = new FilterController(parentNode, [replyNumFilter, userIdFilter, datetimeFilter]);

  let mainController = new MainController(sortController, filterController);
  $(document.getElementById('rakuenTab')).before(mainController.$mainWrapper);
}

function main() {
  if(/subject\/\d+\/comments/.test(location.pathname)) subjectComments();
  else if(/subject\/\d+\/reviews/.test(location.pathname)) subjectReviews();
  else if(/subject\/\d+\/index/.test(location.pathname)) subjectIndex();
  else if(/subject\/\d+\/board/.test(location.pathname)) subjectBoard();
  else if(/subject\/\d+\/(wishes|collections|doings|on_hold|dropped)/.test(location.pathname)) subjectCollect();
  else if(/rakuen\/topiclist/.test(location.pathname)) rakuen();
}

main();
