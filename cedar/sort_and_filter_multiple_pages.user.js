// ==UserScript==
// @name        Bangumi多种类页面排序与筛选
// @namespace   tv.bgm.cedar.sortandfiltermultiplepages
// @version     2.0
// @description 为多种不同的页面添加排序与筛选功能
// @author      Cedar
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/comments.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/reviews.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/index.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/board.*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/subject/\d+/(wishes|collections|doings|on_hold|dropped).*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/rakuen/topiclist.*/
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
.main-wrapper a.chiiBtn {
  min-width: max-content;
}
.main-wrapper a.chiiBtn:hover {
  cursor: pointer;
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
.unknown-registration-time {
  background-color: bisque;
}
`);

'use strict';

/** 基本思路
 * SortWorker 实现功能
 * Sorter 添加按钮等过页面元素
 * SortController 统领全部Sorter, 添加重置功能与按钮
 * Filterer 构建与页面元素关联的筛选模块
 * FilterController 统领全部Filterer, 添加重置功能与按钮
 */


/** === 页面统计 ===

 o 超展开 /rakuen/topiclist
 * 小组讨论 /group/{name}/forum
 * 全部目录 /index/browser
 * //全部日志(没什么信息, 不做) /blog, (anime|book|music|game|real)/blog
 * //分类浏览(信息填写不规范 难以提取, 不做) (anime|book|music|game)/browser, real/browser/platform/(jp|en)
 * //目录(没什么信息, 不做) index/{id}

 * --- 条目页 ---
 * 角色页(不做) /subject/{id}/characters
 * 制作人员(不做) /subject/{id}/persons
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
 * //个人日志(不做) /user/{uid}/blog
 * //各类收藏页(信息填写不规范 难以提取, 不做) /(anime|book|music|game|real)/list/313469/(do|collect|wish|on_hold|dropped)
 */

const createButton = text => $(document.createElement('a')).addClass('chiiBtn').text(text);
const pz = (p, s) => (p+s).slice(-p.length); // a function to patch zeros before positive integer

function parseDatetimeString(date) {
  // input date string ('10m ago' or '2019-01-01') -> output milliseconds in numeric value
  if (date.includes('ago')) {
    const convert = t => t? parseInt(t.toString().slice(0,-1)): 0;
    let s = convert(date.match(/\d+s/));
    let m = convert(date.match(/\d+m/));
    let h = convert(date.match(/\d+h/));
    let d = convert(date.match(/\d+d/));

    //console.log(date, `${d}d${h}h${m}m${s}s`, ((((d*24+h)*60+m)*60+s)*1000));

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

class SortWorker {
  constructor({
    descendOrderFirst, //sort by descend order first if true
    parentNode, //all Nodes under parentNode will get sorted
    itemParser,  //should return something that parse items to feed 'compareFunction' in this.sort
  }) {
    this._descendOrderFirst = descendOrderFirst;
    this._parentNode = parentNode;
    this._itemParser = itemParser;

    this._inDescendOrder = null;
    this.resetOrder();
  }

  setDescendOrder(order) {
    this._inDescendOrder = order;
  }

  resetOrder() {
    this._inDescendOrder = this._descendOrderFirst;
  }

  sort() {
    // compareFn 不直接相减是为了适配字符串比较
    const compareFn = this._inDescendOrder
    ? (lft, ryt) => this._itemParser(ryt) > this._itemParser(lft)? 1: (this._itemParser(ryt) == this._itemParser(lft)? 0: -1)
    : (lft, ryt) => this._itemParser(lft) > this._itemParser(ryt)? 1: (this._itemParser(lft) == this._itemParser(ryt)? 0: -1);
    Array.from(this._parentNode.children)
      .map(x => this._parentNode.removeChild(x))
      .sort(compareFn)
      .forEach(x => this._parentNode.appendChild(x));
    this._inDescendOrder = !this._inDescendOrder;
    return !this._inDescendOrder; //return true if sorted in descend order
  }
}

class Sorter {
  $sortButton;

  constructor(text, sortWorker) {
    this._text = text;
    this._sortWorker = sortWorker;
    this.$sortButton = createButton(this._text).on('click', () => this.doSort());
  }

  doSort() {
    let inDescendOrder = this._sortWorker.sort();
    this.$sortButton.text(this._text + (inDescendOrder? '↓': '↑'));
  }

  resetOrder() {
    this._sortWorker.resetOrder();
    this.$sortButton.text(this._text);
  }
}

class SortController {
  $sortBtnWrapper;

  constructor(sorters, resetWorker=null) {
    // sorters: 是由 Sorter 类构成的数组.
    // resetWorker: 一个 SortWorker 类. 当需要重置顺序时被调用. 让元素以指定的顺序排序 作为默认顺序. 不添加的话则没法恢复初始顺序.
    //              (因为重置排序时还要对其他按钮进行操作, 所以选择了只会进行排序的SortWorker, 而没有选择 Sorter类)
    this._sorters = sorters;

    this.$sortBtnWrapper = $(document.createElement('span'));
    if(resetWorker) {
      this._resetWorker = resetWorker;
      this.$sortBtnWrapper.append(
        createButton('初始顺序').on('click', () => this.resetAll()),
        this._sorters.map(x => x.$sortButton));
    } else {
      this.$sortBtnWrapper.append(this._sorters.map(x => x.$sortButton));
    }
  }

  resetAll() {
    this._resetWorker.resetOrder();
    this._resetWorker.sort();
    this._sorters.forEach(x => x.resetOrder());
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
    if(this._sortController) {
      buttonWrapper.append(this._sortController.$sortBtnWrapper);
    }
    if(this._filterController) {
      buttonWrapper.append($(document.createElement('span')).append(this._filterController.$showBtn));
      this.$mainWrapper.append(this._filterController.$filterWrapper.addClass('filter-wrapper').hide());
    }
  }
}

// 吐槽页 /subject/{id}/comments
class CommentsParser {
  static parseLen = el => el.querySelector('p').innerText.length;
  static parseDatetime = el => parseDatetimeString(el.querySelector('small').innerText.slice(2));

  static parseScore(el) {
    let e = el.querySelector('.starlight');
    return e? parseInt(e.classList[1].slice(5)): 0;
  }

  static parseUserId(el) {
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

  let commentSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CommentsParser.parseLen,
  });
  let commentSorter = new Sorter('字数顺序', commentSortWorker);

  let scoreSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CommentsParser.parseScore,
  });
  let scoreSorter = new Sorter('评分顺序', scoreSortWorker);

  let datetimeSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: CommentsParser.parseDatetime,
  });
  let datetimeSorter = new Sorter('时间顺序', datetimeSortWorker);

  let userIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: CommentsParser.parseUserId,
  });
  let userIdSorter = new Sorter('注册顺序', userIdSortWorker);

  let datetimeResetWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CommentsParser.parseDatetime,
  });

  let sortController = new SortController([commentSorter, scoreSorter, datetimeSorter, userIdSorter], datetimeResetWorker);


  let commentFilter = new NumberFilterer({
    elParser: CommentsParser.parseLen,
    titleStr: '字数',
    min: 0, max: 200,
    width: '40px',
    setPlaceholder: true
  });
  let scoreFilter = new NumberFilterer({
    elParser: CommentsParser.parseScore,
    titleStr: '评分',
    min: 0, max: 10,
    width: '35px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: CommentsParser.parseDatetime,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: CommentsParser.parseUserId,
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
  static parseBlogId = el => parseInt(el.querySelector('.title a').href.match(/\d+/).toString());
  static parseDatetime = el => parseDatetimeString(el.querySelector('small.time').innerText);
  static parseReplyNum = el => parseInt(el.querySelector('div.time .orange').innerText.match(/\d+/).toString());

  static parseUserId(el) {
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

  let replySortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: ReviewsParser.parseReplyNum,
  });
  let replySorter = new Sorter('回复数量', replySortWorker);

  let blogIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: ReviewsParser.parseBlogId,
  });
  let blogIdSorter = new Sorter('发布顺序', blogIdSortWorker);

  let userIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: ReviewsParser.parseUserId,
  });
  let userIdSorter = new Sorter('注册顺序', userIdSortWorker);

  let blogIdResetWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: ReviewsParser.parseBlogId,
  });

  let sortController = new SortController([replySorter, blogIdSorter, userIdSorter], blogIdResetWorker);


  let replyNumFilter = new NumberFilterer({
    elParser: ReviewsParser.parseReplyNum,
    titleStr: '回复',
    min: 0, max: null,
    rytDft: Infinity,
    width: '40px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: ReviewsParser.parseDatetime,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: ReviewsParser.parseUserId,
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
  static parseIndexId = el => parseInt(el.id.slice(5));
  static parseUpdateDate = el => parseDatetimeString(el.querySelector('.tip_j .tip').innerText);

  static parseUserId(el) {
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

  let indexIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: IndexParser.parseIndexId,
  });
  let indexIdSorter = new Sorter('目录ID', indexIdSortWorker);

  let updateDateSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: IndexParser.parseUpdateDate,
  });
  let updateDateSorter = new Sorter('更新时间', updateDateSortWorker);

  let userIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: IndexParser.parseUserId,
  });
  let userIdSorter = new Sorter('注册顺序', userIdSortWorker);

  let sortController = new SortController([indexIdSorter, updateDateSorter, userIdSorter]);


  let indexIdFilter = new NumberFilterer({
    elParser: IndexParser.parseIndexId,
    titleStr: '目录ID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let updateDatetimeFilter = new DatetimeFilterer({
    elParser: IndexParser.parseUpdateDatetime,
    titleStr: '更新时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: IndexParser.parseUserId,
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
  static parseTopicId = el => parseInt(el.querySelector('.subject a.l').href.match(/\d+/).toString());
  static parseName = el => el.children[1].innerText;
  static parseReplyNum = el => parseInt(el.children[2].innerText.split(' ', 1)[0]);
  static parseDate = el => parseDatetimeString(el.children[3].innerText);
}

function subjectBoard() {
  let parentNode = document.querySelector('.topic_list>tbody');

  let topicIdSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: SubjectBoardParser.parseTopicId,
  });
  let topicIdSorter = new Sorter('发布顺序', topicIdSortWorker);

  let nameSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: SubjectBoardParser.parseName,
  });
  let nameSorter = new Sorter('用户名', nameSortWorker);

  let replyNumSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: SubjectBoardParser.parseReplyNum,
  });
  let replyNumSorter = new Sorter('回复数量', replyNumSortWorker);

  let dateSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: SubjectBoardParser.parseDate,
  });
  let dateSorter = new Sorter('最后回复', dateSortWorker);

  let sortController = new SortController([topicIdSorter, nameSorter, replyNumSorter, dateSorter]);


  let replyNumFilter = new NumberFilterer({
    elParser: SubjectBoardParser.parseReplyNum,
    titleStr: '回复数量',
    min: 0, max: null,
    rytDft: Infinity,
    width: '40px',
    setPlaceholder: true
  });
  let dateFilter = new DateFilterer({
    elParser: SubjectBoardParser.parseDate,
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
  static parseDatetime = el => parseDatetimeString(el.querySelector('p.info').innerText);

  static parseLen(el) {
    let commentNode = el.querySelector('.userContainer').lastChild;
    if(commentNode.nodeType == Node.TEXT_NODE) return commentNode.length;
    return 0;
  }

  static parseScore(el) {
    let e = el.querySelector('.starlight');
    return e? parseInt(e.classList[1].slice(5)): 0;
  }

  static parseUserId(el) {
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

  let commentSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CollectParser.parseLen,
  });
  let commentSorter = new Sorter('字数顺序', commentSortWorker);

  let scoreSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CollectParser.parseScore,
  });
  let scoreSorter = new Sorter('评分顺序', scoreSortWorker);

  let datetimeSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: CollectParser.parseDatetime,
  });
  let datetimeSorter = new Sorter('时间顺序', datetimeSortWorker);

  let userIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: CollectParser.parseUserId,
  });
  let userIdSorter = new Sorter('注册顺序', userIdSortWorker);

  let datetimeResetWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CollectParser.parseDatetime,
  });

  let sortController = new SortController([commentSorter, scoreSorter, datetimeSorter, userIdSorter], datetimeResetWorker);


  let commentFilter = new NumberFilterer({
    elParser: CollectParser.parseLen,
    titleStr: '字数',
    min: 0, max: 200,
    width: '40px',
    setPlaceholder: true
  });
  let scoreFilter = new NumberFilterer({
    elParser: CollectParser.parseScore,
    titleStr: '评分',
    min: 0, max: 10,
    width: '35px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: CollectParser.parseDatetime,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let userIdFilter = new NumberFilterer({
    elParser: CollectParser.parseUserId,
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
  static parseReplyNum = el => parseInt(el.querySelector('small.grey').innerText.slice(2, -1));
  static parseDatetime = el => parseDatetimeString(el.querySelector('small.time').innerText.replace('...', ''));

  static parseItemId(el) {
    return parseInt(el.id.split('_')[2]);
    // 本想把 subject group ep crt prsn 等前缀字符串直接加入比较, 然而只有Python能正确对array进行比较
    //let id = el.id.split('_')[2];
    //id[1] = Number(id[1]);
    //return id;
  }

  static parseUserId(el) {
    // this function will also add a class to fail-to-parse users.
    if(!/subject|group/.test(el.id)) return Infinity; // 不是小组帖子或条目讨论 自然没有UserId
    let uid = el.querySelector('.avatarNeue').style.backgroundImage.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }

  static parseType(el) {
    // 提取出groupID subjectID(章节讨论/条目讨论) 角色ID 人物ID (角色ID/人物ID 跟ItemId相同)
    let keyEl = el.querySelector('.row a') || el.querySelector('a.avatar');
    return new URL(keyEl.href).pathname;
  }
}

function rakuen() {
  let parentNode = document.querySelector('#eden_tpc_list>ul');

  let replyNumSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: RakuenParser.parseReplyNum,
  });
  let replyNumSorter = new Sorter('回复', replyNumSortWorker);

  let datetimeSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: RakuenParser.parseDatetime,
  });
  let datetimeSorter = new Sorter('活跃', datetimeSortWorker);

  let itemIdSortWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: RakuenParser.parseItemId,
  });
  let itemIdSorter = new Sorter('发布', itemIdSortWorker);

  let userIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: RakuenParser.parseUserId,
  });
  let userIdSorter = new Sorter('UID', userIdSortWorker);

  let typeSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: RakuenParser.parseType,
  });
  let typeSorter = new Sorter('类型', typeSortWorker);

  let datetimeResetWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: RakuenParser.parseDatetime,
  });

  let sortController;
  if(!location.search) { //超展开的"全部"栏
    sortController = new SortController([replyNumSorter, datetimeSorter, userIdSorter, typeSorter], datetimeResetWorker);
  } else if(/group|subject/.test(location.search)) { //超展开的小组帖子与条目讨论可以根据item编号排序
    sortController = new SortController([replyNumSorter, datetimeSorter, itemIdSorter, userIdSorter, typeSorter], datetimeResetWorker);
  } else { // 章节(ep) 角色(crt) 人物(prsn) 没有 UserId
    sortController = new SortController([replyNumSorter, datetimeSorter, itemIdSorter, typeSorter], datetimeResetWorker);
  }

  let replyNumFilter = new NumberFilterer({
    elParser: RakuenParser.parseReplyNum,
    titleStr: '回复数量',
    min: 0, max: null,
    rytDft: Infinity,
    width: '40px',
    setPlaceholder: true
  });
  let userIdFilter = new NumberFilterer({
    elParser: RakuenParser.parseUserId,
    titleStr: '用户ID',
    min: 0, max: null,
    rytDft: Infinity,
    width: '70px',
    setPlaceholder: true
  });
  let datetimeFilter = new DatetimeFilterer({
    elParser: RakuenParser.parseDatetime,
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
  console.log('start');
  if(/subject\/\d+\/comments/.test(location.pathname)) subjectComments();
  else if(/subject\/\d+\/reviews/.test(location.pathname)) subjectReviews();
  else if(/subject\/\d+\/index/.test(location.pathname)) subjectIndex();
  else if(/subject\/\d+\/board/.test(location.pathname)) subjectBoard();
  else if(/subject\/\d+\/(wishes|collections|doings|on_hold|dropped)/.test(location.pathname)) subjectCollect();
  else if(/rakuen\/topiclist/.test(location.pathname)) rakuen();
}

main();
