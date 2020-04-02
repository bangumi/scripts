// ==UserScript==
// @name        吐槽列表排序与筛选
// @namespace   tv.bgm.cedar.sortandfiltercomments
// @version     1.5
// @description 排序与筛选吐槽列表
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*comments.*/
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

const createButton = text => $(document.createElement('a')).addClass('chiiBtn').text(text);
const pz = (p, s) => (p+s).slice(-p.length); // a function to patch zeros before positive integer

function parseDateString(date) {
  // input date string -> output milliseconds in numeric value
  if (date.includes('ago')) {
    const convert = t => t? parseInt(t.toString().slice(0,-1)): 0;
    let s = convert(date.match(/\d+s/));
    let m = convert(date.match(/\d+m/));
    let h = convert(date.match(/\d+h/));
    let d = convert(date.match(/\d+d/));
    return Date.now() - ((((d*24+h)*60+m)*60+s)*1000);
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
    const compareFn = this._inDescendOrder
    ? (lft, ryt) => this._itemParser(ryt) - this._itemParser(lft)
    : (lft, ryt) => this._itemParser(lft) - this._itemParser(ryt);
    Array.from(this._parentNode.children)
      .map(x => this._parentNode.removeChild(x))
      .sort(compareFn)
      .forEach(x => this._parentNode.appendChild(x));
    this._inDescendOrder = !this._inDescendOrder;
    return !this._inDescendOrder; //return true if sorted in descend order
  }

  // return something that parse items to feed 'compareFn' in this.sort
  //_itemParser() {}
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

  constructor(sorters, resetWorker) {
    // sorters: 是由 Sorter 类构成的数组.
    // resetWorker: 一个 SortWorker 类(因为重置排序时还要对其他按钮进行操作, 所以选择了这个只会进行排序的类). 当需要重置顺序时被调用. 让元素以指定的顺序排序 作为默认顺序.
    this._sorters = sorters;
    this._resetWorker = resetWorker;
    this.$sortBtnWrapper = $(document.createElement('span'))
      .append(
        createButton('初始顺序').on('click', () => this.resetAll()),
        this._sorters.map(x => x.$sortButton));
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
    inputType,  // should be 'number' or 'datetime-local'
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
    let n = this._valueParser(this._elParser(el));
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
    return parseInt(v);
  }
}

class DateFilterer extends Filterer {
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
      c.style.display = 'block';
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

  constructor(sortController, filterController) {
    this._sortController = sortController;
    this._filterController = filterController;

    this.$mainWrapper = $(document.createElement('div'))
      .addClass('main-wrapper')
      .append(
        $(document.createElement('div'))
        .addClass('button-wrapper')
        .append(
          this._sortController.$sortBtnWrapper,
          $(document.createElement('span')).append(this._filterController.$showBtn)
        ),
        this._filterController.$filterWrapper.addClass('filter-wrapper').hide()
      );
  }
}


// 吐槽页 /subject/{id}/comments
class CommentsParser {
  static parseLen = el => el.querySelector('p').innerText.length;
  static parseDate = el => parseDateString(el.querySelector('small').innerText.slice(2));

  static parseScore(el) {
    let e = el.querySelector('.starlight');
    return e? parseInt(e.classList[1].slice(5)): 0;
  }

  static parseUserId(el) {
    //this function will also add a class to fail-to-parse users.
    let uid = el.querySelector('.avatarNeue').style.backgroundImage.match(/\d+\.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //default icon user
    uid = el.querySelector('a').href.match(/\d+/)
    if (uid) return parseInt((uid.toString()));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return Infinity;
  }
}


function main() {
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

  let dateSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: CommentsParser.parseDate,
  });
  let dateSorter = new Sorter('时间顺序', dateSortWorker);

  let userIdSortWorker = new SortWorker({
    descendOrderFirst: false,
    parentNode: parentNode,
    itemParser: CommentsParser.parseUserId,
  });
  let userIdSorter = new Sorter('注册顺序', userIdSortWorker);

  let dateResetWorker = new SortWorker({
    descendOrderFirst: true,
    parentNode: parentNode,
    itemParser: CommentsParser.parseDate,
  });

  let sortController = new SortController([commentSorter, scoreSorter, dateSorter, userIdSorter], dateResetWorker);


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
  let dateFilter = new DateFilterer({
    elParser: CommentsParser.parseDate,
    titleStr: '时间',
    min: '1970-01-01T00:00',
    max: '2999-01-01T00:00',
    //lftDft: '1970',
    //rytDft: '2999',
    width: null,
    setPlaceholder: false
  });
  let useridFilter = new NumberFilterer({
    elParser: CommentsParser.parseUserId,
    titleStr: 'UID',
    min: 0, max: 99999999,
    width: '70px',
    setPlaceholder: false
  });
  let filterController = new FilterController(parentNode, [commentFilter, scoreFilter, useridFilter, dateFilter]);

  let mainController = new MainController(sortController, filterController);

  $(parentNode).before(mainController.$mainWrapper);
}

main();
