// ==UserScript==
// @name        Bangumi多种类页面排序与筛选
// @namespace   tv.bgm.cedar.sortandfiltermultiplepages
// @version     2.2.4
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
/*sort buttons*/
.cedar-sort-and-filter-plugin-main-wrapper .button-wrapper {
  display: flex;
  justify-content: space-between;
}
.cedar-sort-and-filter-plugin-main-wrapper a.chiiBtn {
  min-width: max-content;
}
.cedar-sort-and-filter-plugin-main-wrapper a.chiiBtn:hover {
  cursor: pointer;
}
.cedar-sort-and-filter-plugin-main-wrapper a.chiiBtn[data-order="descend"]::after {
  content: '↓';
}
.cedar-sort-and-filter-plugin-main-wrapper a.chiiBtn[data-order="ascend"]::after {
  content: '↑';
}
/* filters
 * 这里必须用 flex-wrap: wrap 否则不知为啥toggle函数会没反应 */
.cedar-sort-and-filter-plugin-main-wrapper .filter-ui-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  font-size: 14px;
  /* 后几项是为slide效果做准备 */
  overflow: hidden;
  transition: height 0.3s ease-out;
  height: auto;
}
.cedar-sort-and-filter-plugin-main-wrapper .filter-unit-wrapper {
  display: flex;
  flex-wrap: wrap;
}
.cedar-sort-and-filter-plugin-main-wrapper .filter-unit-wrapper>div {
  margin: 0 0.2em;
}
.cedar-sort-and-filter-plugin-main-wrapper .filter-unit-wrapper input {
  margin: 0.2em;
  padding: 3px;
}
/* 筛选结果的显示 */
ul.usersLarge .cedar-sort-and-filter-plugin-hide-this, /* 新 UI 的评分页如 subject/{id}/collections 的 CSS 会把这个样式覆盖，为了获得高优先级，添加了一个 ul.userLarge 的父选择器 */
.cedar-sort-and-filter-plugin-hide-this {
  display: none;
}
.unknown-registration-time, html[data-theme='dark'] .unknown-registration-time {
  background-color: rgba(255,46,61,0.2);
}
`);

'use strict';

/** 基本思路
 * 针对各页面适配各类Parser
 * SortController 控制排序
 * FilterController 控制筛选
 * MainController 整合二者
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
 * @param {object} parsers - contains some parser like datetimeParser or scoreParser,
 * and they will be called internally later like parsers['scoreParser'](element)
 *
 * @example
 * let s = new SortController(document.querySelector('ul.my-list'), CommentsParser);
 * s.addResetButton(...); // see those functions for detail
 * s.addSortButton(...);
 * let ui = s.getSorterUI();
 */
class SortController {
  constructor(parentNode, parsers) {
    this._parentNode = parentNode;
    this._parsers = parsers;
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

/**
 * @param {HTMLElement} parentNode
 * @param {object} elParsers - contains some parser like datetimeParser or scoreParser,
 * and they will be called internally later like elParsers['scoreParser'](element)
 * @param {object} inputParsers - contains some parser like datetimeParser or numberParser,
 * and they will be called internally later like inputParsers['numberParser'](document.querySelector('input'))
 *
 * @example
 * let s = new FilterController(document.querySelector('ul.my-list'));
 * s.addFilterItem(...); // see those functions for detail
 * let ui = s.getFilterUI();
 */
class FilterController {
  constructor(parentNode, elParsers, inputParsers) {
    this._parentNode = parentNode;
    this._elParsers = elParsers;
    this._inputParsers = inputParsers;
    this._toggleButton = null;
    this._filterUnitWrapper = null;
    this._filterUI = null;

    this._createToggleButton();
    this._createFilterUI();
  }

  _createToggleButton() {
    this._toggleButton = createElement('div', null, [
      createElement('a', {
        className: 'chiiBtn',
        dataset: {collapsed: true, action: 'toggle'}
      }, ['筛选'], {click: this})
    ]);
  }

  /**
   * UI结构类似这样 注意波浪号是全角符号:
   * <div class="filter-ui-wrapper">
   *   <div class="filter-unit-wrapper">
   *     <div data-el-parser="lengthParser" data-input-parser="numberParser">
   *       <label>字数<input type="number" min="0" placeholder="0" style="width: 4em;"></label>
   *       <label>～<input type="number" min="0" style="width: 4em;"></label>
   *     </div>
   *     <div data-el-parser="scoreParser" data-input-parser="numberParser">
   *       <label>评分<input type="number" min="0" max="10" placeholder="0" style="width: 2em;"></label>
   *       <label>～<input type="number" min="0" max="10" placeholder="0" style="width: 2em;"></label>
   *     </div>
   *     <div data-el-parser="datetimeParser" data-input-parser="datetimeParser">
   *       <label>时间<input type="datetime-local" min="1970-01-01T00:00" max="2999-01-01T00:00"></label>
   *       <label>～<input type="datetime-local" min="1970-01-01T00:00" max="2999-01-01T00:00"></label>
   *     </div>
   *     ......
   *   </div>
   *
   *   <div>
   *     <a class="chiiBtn" data-action="reset">重置</a>
   *   </div>
   * </div>
   */
  _createFilterUI() {
    this._filterUnitWrapper = createElement('div', {
      className: 'filter-unit-wrapper',
      dataset: {action: "filter"}
    }, null, {
      focusout: this,
      keydown: this
    });
    let resetWrapper = createElement('div', null, [
      createElement('a', {className: 'chiiBtn', dataset: {action: "reset"}}, ["重置"])
    ], {click: this});
    this._filterUI = createElement('div', {
      className: 'filter-ui-wrapper',
      style: {display: "none"}
    }, [this._filterUnitWrapper, resetWrapper]);
  }

  getToggleButton() {
    return this._toggleButton;
  }

  getFilterUI() {
    return this._filterUI;
  }

  handleEvent(e) {
    let action = e.target.dataset.action;
    if (action) {
      e.stopPropagation();
      // 要特别处理一下 "回车触发筛选" 的情况
      if (e.type !== "keydown" || !e.isComposing && e.keyCode === 13) {
        this[action](e.target);
      }
    }
  }

  /**
   * @param {string} name
   * @param {string} elParserName - 要在 this._elParsers 中有对应项
   * @param {string} inputParserName - 要在 this._inputParsers 中有对应项
   * @param {object} leftInputAttr - 左侧 input 的属性, 不能有 leftInputAttr.dataset.action 属性
   * @param {object} rightInputAttr - 右侧 input 的属性, 不能有 rightInputAttr.dataset.action 属性
   *
   * @example
   * class CommentsParser {
   *   static userIdParser(s) { ... }
   * }
   * const InputParser = {
   *   numberParser(inputEl) { return Number(inputEl.value || inputEl.dataset.default) }
   * }
   * let s = new FilterController(document.querySelector('ul.my-list'), CommentsParser, InputParser);
   * s.addFilterUnit(
   *   '用户ID', 'userIdParser', 'numberParser',
   *   {min: 1, max: 999999, type='number', style: {width: '5em'}, dataset: {default: 0}, placeholder: '1'},
   *   {min: 1, max: 999999, type='number', style: {width: '5em'}, dataset: {default: Infinity}}
   * );
   * s.addFilterUnit(...);
   * s.addFilterUnit(...);
   * let toggler = s.getToggleButton();
   * let ui = s.getFilterUI();
   */
  addFilterUnit(name, elParserName, inputParserName, leftInputAttr, rightInputAttr) {
    leftInputAttr = Object.assign({}, leftInputAttr); // 相当于copy
    leftInputAttr.dataset = Object.assign({}, leftInputAttr.dataset); // Object.assign 能处理 dataset 不存在的情况
    leftInputAttr.dataset.action = 'filter'; // 这样写能兼容leftInputAttr本就存在键"dataset"的情况
    let leftLabel = createElement('label', null, [
      name, createElement('input', leftInputAttr, null)
    ]);
    rightInputAttr = Object.assign({}, rightInputAttr);
    rightInputAttr.dataset = Object.assign({}, rightInputAttr.dataset);
    rightInputAttr.dataset.action = 'filter';
    let rightLabel = createElement('label', null, [
      '～', createElement('input', rightInputAttr, null)
    ]);

    let wrapper = createElement('div', {
      dataset: {
        elParser: elParserName,
        inputParser: inputParserName
      }
    }, [leftLabel, rightLabel]);
    this._filterUnitWrapper.appendChild(wrapper);
  }

  toggle(button) {
    // 写法修改自 https://css-tricks.com/using-css-transitions-auto-dimensions/
    function collapseSection(element) {
      requestAnimationFrame(function () {
        element.style.height = element.scrollHeight + 'px';
        requestAnimationFrame(function () {
          element.style.height = 0;
          // 动画播放完毕后把height和display设置为想要的值
          element.addEventListener('transitionend', function () {
            element.style.height = null;
            element.style.display = 'none';
          }, {once: true});
        });
      });
    }

    function expandSection(element) {
      element.style.display = null;
      element.style.height = 0;
      requestAnimationFrame(function () {
        element.style.height = element.scrollHeight + 'px';
        element.addEventListener('transitionend', function () {
          element.style.height = null;
        }, {once: true});
      });
    }

    if (button.dataset.collapsed === "true") {
      expandSection(this._filterUI);
      button.dataset.collapsed = false;
    } else {
      collapseSection(this._filterUI);
      button.dataset.collapsed = true;
    }
  }

  filter(_) {
    let filters = Array.from(this._filterUnitWrapper.children)
      .map(unit => {
        const elParser = this._elParsers[unit.dataset.elParser];
        const inputParser = this._inputParsers[unit.dataset.inputParser];
        let min = inputParser(unit.querySelector('label>input'));
        let max = inputParser(unit.querySelector('label+label>input'));
        return {elParser, min, max};
      });
    const match = function (filter, element) {
      let value = filter.elParser(element);
      return filter.min <= value && value <= filter.max;
    }
    for (let c of this._parentNode.children) {
      if (filters.some(f => !match(f, c))) {
        c.classList.add('cedar-sort-and-filter-plugin-hide-this');
      } else {
        c.classList.remove('cedar-sort-and-filter-plugin-hide-this');
      }
    }
  }

  reset(_) {
    this._filterUnitWrapper.querySelectorAll('input').forEach(el => {el.value = null});
    this.filter();
  }
}

class InputParser {
  static numberParser = input => Number(input.value || input.dataset.default);
  static dateParser = input => input.value ? new Date(input.value).getTime() : Number(input.dataset.default);
  static datetimeParser = input => input.value ? new Date(input.value).getTime() : Number(input.dataset.default);
}

class MainController {
  $mainWrapper;

  constructor(sortController = null, filterController = null) {
    this._sortController = sortController;
    this._filterController = filterController;
    this._mainWrapper = this._createMainWrapper();
  }

  _createMainWrapper() {
    let buttonWrapper = createElement('div', {className: 'button-wrapper'}, null);
    let mainWrapper = createElement('div', {className: 'cedar-sort-and-filter-plugin-main-wrapper'}, [buttonWrapper]);
    if (this._sortController) {
      buttonWrapper.appendChild(this._sortController.getSorterUI()); 
    }
    if (this._filterController) {
      buttonWrapper.appendChild(this._filterController.getToggleButton()); 
      mainWrapper.appendChild(this._filterController.getFilterUI());
    }
    return mainWrapper;
  }

  getMainWrapper() {
    return this._mainWrapper;
  }
}

// 吐槽页 /subject/{id}/comments
class CommentsParser {
  static lengthParser = el => el.querySelector('p').innerText.length;
  static datetimeParser = el => parseDatetimeString(el.querySelector('small+small').innerText.slice(2));

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

  let filterController = new FilterController(parentNode, CommentsParser, InputParser);
  filterController.addFilterUnit(
    '字数', 'lengthParser', 'numberParser',
    {min: 0, max: 200, type: 'number', style: {width: '3em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, max: 200, type: 'number', style: {width: '3em'}, dataset: {default: 200}, placeholder: 200}
  );
  filterController.addFilterUnit(
    '评分', 'scoreParser', 'numberParser',
    {min: 0, max: 10, type: 'number', style: {width: '2.5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, max: 10, type: 'number', style: {width: '2.5em'}, dataset: {default: 10}, placeholder: 10}
  );
  filterController.addFilterUnit(
    'UID', 'userIdParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '时间', 'datetimeParser', 'datetimeParser',
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: 0}},
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: Infinity}}
  );

  let mainController = new MainController(sortController, filterController);
  parentNode.insertAdjacentElement('beforebegin', mainController.getMainWrapper());
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

  let filterController = new FilterController(parentNode, ReviewsParser, InputParser);
  filterController.addFilterUnit(
    '回复', 'replyNumParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '4em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '4em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    'UID', 'userIdParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: 0}},
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '时间', 'datetimeParser', 'datetimeParser',
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: 0}},
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: Infinity}}
  );

  let mainController = new MainController(sortController, filterController);
  parentNode.insertAdjacentElement('beforebegin', mainController.getMainWrapper());
}

// 目录页 /subject/{id}/index
class IndexParser {
  static indexIdParser = el => parseInt(el.id.slice(5));
  static updateDatetimeParser = el => parseDatetimeString(el.querySelector('.tip_j .tip').innerText);

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
  sortController.addSortButton('最后更新', 'updateDatetimeParser', 'descend');
  sortController.addSortButton('注册顺序', 'userIdParser', 'ascend');

  let filterController = new FilterController(parentNode, IndexParser, InputParser);
  filterController.addFilterUnit(
    '目录ID', 'indexIdParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '4.5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '4.5em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    'UID', 'userIdParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '更新时间', 'updateDatetimeParser', 'datetimeParser',
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: 0}},
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: Infinity}}
  );

  let mainController = new MainController(sortController, filterController);
  document.getElementById('timeline').insertAdjacentElement('beforebegin', mainController.getMainWrapper());
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
  sortController.addSortButton('发布顺序', 'topicIdParser', 'descend');
  sortController.addSortButton('用户名', 'nameParser', 'ascend');
  sortController.addSortButton('回复数量', 'replyNumParser', 'descend');
  sortController.addSortButton('最后回复', 'dateParser', 'descend');

  let filterController = new FilterController(parentNode, SubjectBoardParser, InputParser);
  filterController.addFilterUnit(
    '回复数量', 'replyNumParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '4em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '4em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '最后回复', 'dateParser', 'dateParser',
    {min: '1970-01-01', max: '2999-01-01', type: 'date', dataset: {default: 0}},
    {min: '1970-01-01', max: '2999-01-01', type: 'date', dataset: {default: Infinity}}
  );

  let mainController = new MainController(sortController, filterController);
  document.querySelector('.topic_list').insertAdjacentElement('beforebegin', mainController.getMainWrapper());
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

function subjectCollect() {
  let parentNode = document.getElementById('memberUserList');

  let sortController = new SortController(parentNode, CollectParser);
  sortController.addResetButton('初始顺序', 'datetimeParser', 'descend');
  sortController.addSortButton('字数顺序', 'lengthParser', 'descend');
  sortController.addSortButton('评分顺序', 'scoreParser', 'descend');
  sortController.addSortButton('时间顺序', 'datetimeParser', 'ascend');
  sortController.addSortButton('注册顺序', 'userIdParser', 'ascend');

  let filterController = new FilterController(parentNode, CollectParser, InputParser);
  filterController.addFilterUnit(
    '字数', 'lengthParser', 'numberParser',
    {min: 0, max: 200, type: 'number', style: {width: '3em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, max: 200, type: 'number', style: {width: '3em'}, dataset: {default: 200}, placeholder: 200}
  );
  filterController.addFilterUnit(
    '评分', 'scoreParser', 'numberParser',
    {min: 0, max: 10, type: 'number', style: {width: '2.5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, max: 10, type: 'number', style: {width: '2.5em'}, dataset: {default: Infinity}, placeholder: 10}
  );
  filterController.addFilterUnit(
    'UID', 'userIdParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '时间', 'datetimeParser', 'datetimeParser',
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: 0}},
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: Infinity}}
  );

  let mainController = new MainController(sortController, filterController);
  parentNode.insertAdjacentElement('beforebegin', mainController.getMainWrapper());
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
    let avatar = el.querySelector('.avatarNeue');
    let uid = avatar.dataset.user;
    if (/^\d+$/.test(uid)) return parseInt(uid);
    uid = avatar.style.backgroundImage.match(/\d+\.jpg/);
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

  let filterController = new FilterController(parentNode, RakuenParser, InputParser);
  filterController.addFilterUnit(
    '回复数量', 'replyNumParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '4em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '4em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '用户ID', 'userIdParser', 'numberParser',
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: 0}, placeholder: 0},
    {min: 0, type: 'number', style: {width: '5em'}, dataset: {default: Infinity}}
  );
  filterController.addFilterUnit(
    '最近活跃', 'datetimeParser', 'datetimeParser',
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: 0}},
    {min: '1970-01-01T00:00', max: '2999-01-01T00:00', type: 'datetime-local', dataset: {default: Infinity}}
  );

  let mainController = new MainController(sortController, filterController);
  document.getElementById('rakuenTab').insertAdjacentElement('beforebegin', mainController.getMainWrapper());
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
