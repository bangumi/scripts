// ==UserScript==
// @name        吐槽列表排序与筛选
// @namespace   tv.bgm.cedar.sortandfiltercomments
// @version     1.4.2
// @description 排序与筛选吐槽列表
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*comments.*/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';

    GM_addStyle(`
.unknown-registration-time {
  background-color: bisque;
}
#columnInSubjectA input.comments-filter-input {
  margin-top: 3px;
  margin-bottom: 3px;
  padding: 3px;
}
/*left input box*/
#columnInSubjectA span+input.comments-filter-input {
  margin-left: 4px;
  margin-right: 2px;
}
/*right input box*/
#columnInSubjectA span+input+input.comments-filter-input {
  margin-left: 2px;
  margin-right: 1em;
}
`);

  function SortingFuncFactory ({
    descendOrderFirst,  //sort by descend order first if true
    parentNode,  //all Nodes under parentNode will get sorted
    itemParser,  //should return something that parse items to feed 'compareFunction'
    afterSort    //afterSort(inDescendOrder) will be called after sorted. inDescendOrder indicate nodes are sorted in which order
  }) {
    let inDescendOrder = descendOrderFirst;
    const setDescendOrder = order => inDescendOrder = order;
    const sort = () => {
      let compareFn;
      if (inDescendOrder) compareFn = (lft, ryt) => itemParser(ryt) - itemParser(lft);
      else compareFn = (lft, ryt) => itemParser(lft) - itemParser(ryt);
      [].slice.call(parentNode.children)
        .map(x => parentNode.removeChild(x))
        .sort(compareFn)
        .forEach(x => parentNode.appendChild(x));
      afterSort(inDescendOrder);
      inDescendOrder = !inDescendOrder;
    };
    return { setDescendOrder, sort };
  }

  let commentBox = document.getElementById('comment_box');

  // === parsers ===
  const parseLen   = el => el.querySelector('p').innerText.length;
  const parseScore = el => {let e = el.querySelector('.starlight'); return e? parseInt(e.classList[1].slice(5)): 0;};
  const parseDate  = el => parseDateString(el.querySelector('small').innerText.slice(2));

  function parseUserId(el) {
    //this function will also add a class to fail-to-parse users.
    let uid = el.querySelector('.avatarNeue').style.backgroundImage.match(/\d+.jpg/);
    if (uid) return parseInt(uid.toString().slice(0,-4));
    //default icon user
    uid = el.querySelector('a').href.match(/\d+/)
    if (uid) return parseInt((uid.toString()));
    //fail-to-parse user
    el.classList.add('unknown-registration-time');
    return 99999999;
  }

  // === sort methods ===
  const sortByComment = SortingFuncFactory({
    descendOrderFirst: true,
    parentNode: commentBox,
    itemParser: parseLen,
    afterSort: inDescendOrder => $sortByCommentButton.text(inDescendOrder? "字数顺序↓": "字数顺序↑") // 多→少
  });

  const sortByScore = SortingFuncFactory({
    descendOrderFirst: true,
    parentNode: commentBox,
    itemParser: parseScore,
    afterSort: inDescendOrder => $sortByScoreButton.text(inDescendOrder? "评分顺序↓": "评分顺序↑") // 高→低
  });
  
  const sortByDate = SortingFuncFactory({
    descendOrderFirst: false,
    parentNode: commentBox,
    itemParser: parseDate,
    afterSort: inDescendOrder => $sortByDateButton.text(inDescendOrder? "时间顺序↓": "时间顺序↑") // 新→旧
  })

  const sortByUserId = SortingFuncFactory({
    descendOrderFirst: false,
    parentNode: commentBox,
    itemParser: parseUserId,
    afterSort: inDescendOrder => $sortByUserIdButton.text(inDescendOrder? "注册顺序↑": "注册顺序↓") // 早→晚
  })

  function parseDateString(date) {
    // input date string -> output milliseconds in numeric value
    if (date.includes('ago')) {
      const convert = t => t? parseInt(t.toString().slice(0,-1)): 0;
      let s = convert(date.match(/\d+s/));
      let m = convert(date.match(/\d+m/));
      let h = convert(date.match(/\d+h/));
      let d = convert(date.match(/\d+d/));
      return new Date() - ((((d*24+h)*60+m)*60+s)*1000);
    }
    return new Date(date).getTime();
  }

  function resetOrder() {
    sortByDate.setDescendOrder(true);
    sortByDate.sort();
    sortByComment.setDescendOrder(true);
    sortByScore.setDescendOrder(true);
    sortByUserId.setDescendOrder(false);
    $sortByCommentButton.text("字数顺序");
    $sortByScoreButton.text("评分顺序");
    $sortByDateButton.text("时间顺序");
    $sortByUserIdButton.text("注册顺序");
    [].slice.call(commentBox.children).forEach(item => item.classList.remove('unknown-registration-time'));
  }

  // === buttons ===
  const $chiiButton = $(document.createElement('a')).addClass('chiiBtn').attr('href', 'javascript:;');

  const $resetButton         = $chiiButton.clone().text("初始顺序").on('click', resetOrder);
  const $sortByCommentButton = $chiiButton.clone().text("字数顺序").on('click', sortByComment.sort);
  const $sortByScoreButton   = $chiiButton.clone().text("评分顺序").on('click', sortByScore.sort);
  const $sortByDateButton    = $chiiButton.clone().text("时间顺序").on('click', sortByDate.sort);
  const $sortByUserIdButton  = $chiiButton.clone().text("注册顺序").on('click', sortByUserId.sort);
  const $filterToggleButton  = $chiiButton.clone().text("筛选").css("float", "right").on('click', function() {
    $(this.parentElement.nextElementSibling).slideToggle("fast");
  })

  $(commentBox).before($(
    document.createElement('div')).append(
      $resetButton, $sortByCommentButton, $sortByScoreButton,
      $sortByDateButton, $sortByUserIdButton, $filterToggleButton
  ));

  // === filter functions ===
  function filtering({elParserList, lftParserList, rytParserList}) {
    let c = [].slice.call(commentBox.children).map(x => commentBox.removeChild(x))
    c.forEach(el => {
        for (let i = 0; i < elParserList.length; i++) {
          let n = elParserList[i](el);
          if (n < lftParserList[i]() || rytParserList[i]() < n) {
            el.style.display = 'none';
            return;
          }
        }
        el.style.display = 'block';
    })
    c.forEach(x => commentBox.appendChild(x));
  }

  function filterAll() {
    const parseIntInputOf = ($input, dft=0) => (() => {let n = parseInt($input.val()); return isNaN(n)? dft: n});
    // 下面函数的reduce是我自己想到的! 太妙了所以我不想删! (本来是 text input, 可以输入字母的. 所以必须这么处理)
    //const parseDateInput = ($input, dft) => (() => {let s = $input.val(); return new Date(/\d/.test(s)? s.replace(/\D+/g, '').match(/\d{1,2}/g).slice(0,6).reduce((r, c, i) => r += c+" -- :: "[i]): dft).getTime()});
    const parseDateInputOf = ($input, dft) => (() => {let s = $input.val();  return new Date(s? s: dft).getTime()})
    filtering({
      elParserList: [parseLen, parseScore, parseDate, parseUserId],
      lftParserList: [parseIntInputOf($commentFilter.left), parseIntInputOf($scoreFilter.left), parseDateInputOf($dateFilter.left, "1970"), parseIntInputOf($useridFilter.left)],
      rytParserList: [parseIntInputOf($commentFilter.right, 200), parseIntInputOf($scoreFilter.right, 10), parseDateInputOf($dateFilter.right, "2999"), parseIntInputOf($useridFilter.right, 99999999)],
    })
  }


  function FilterElemFactory ({
    titleStr,   // title string
    filterFunc, // triggered when 'blur' or press Enter
    inputType,  // should be 'number' or 'datetime-local'
    min, max,   // restirct the input range
    width=null, // set input width
    setPlaceholder=false  // will set placeholder with min and max if true
  }) {
    const getInputEl = () => $(document.createElement('input')).addClass('comments-filter-input');
    const keydownEvent = e => {if(!e.isComposing && e.keyCode === 13) filterFunc()};

    const title = $(document.createElement('span')).css('font-size', '14px').text(titleStr);
    const left  = getInputEl().attr({'type': inputType, 'min': min, 'max': max, 'placeholder': setPlaceholder? min: ''}).on('blur', filterFunc).on('keydown', keydownEvent);
    const right = getInputEl().attr({'type': inputType, 'min': min, 'max': max, 'placeholder': setPlaceholder? max: ''}).on('blur', filterFunc).on('keydown', keydownEvent);
    if (width) left.css('width', width), right.css('width', width);
    const wrap  = $(document.createElement('div')).css('display', 'inline-block').append(title, left, right);
    return { wrap, title, left, right };
  }

  // === filter elements ===
  const $commentFilter = FilterElemFactory({ titleStr: '字数', filterFunc: filterAll, inputType: "number", min: 0, max: 200, width: '40px', setPlaceholder: true});
  const $scoreFilter   = FilterElemFactory({ titleStr: '评分', filterFunc: filterAll, inputType: "number", min: 0, max: 10,  width: '35px', setPlaceholder: true});
  const $dateFilter    = FilterElemFactory({ titleStr: '时间', filterFunc: filterAll, inputType: "datetime-local", min: '1970-01-01T00:00', max: '2999-01-01T00:00'});
  const $useridFilter  = FilterElemFactory({ titleStr: 'UID',  filterFunc: filterAll, inputType: "number", min: 0, max: 99999999, width: '70px'});

  // === reset filters button ===
  function resetInputs() {
    for (let f of [$commentFilter, $scoreFilter, $useridFilter])
      f.left.val(''), f.right.val('');
    //dealing with default date
    $dateFilter.left.val('2008-01-01T00:00');
    const pz = (p, s) => (p+s).slice(-p.length); // a function to patch zeros before positive integer
    let d = new Date(); // Note: d.getMonth() starts with 0.
    $dateFilter.right.val(`${pz('0000', d.getFullYear())}-${pz('00', d.getMonth()+1)}-${pz('00', d.getDate())}T${pz('00', d.getHours())}:${pz('00', d.getMinutes())}`)
  }
  const $clearFilterButton = $chiiButton.clone().text("重置").on('click', () => {resetInputs(); filterAll();});

  resetInputs();
  $(commentBox).before(
    $(document.createElement('div')).hide().append($commentFilter.wrap, $scoreFilter.wrap, $useridFilter.wrap, $dateFilter.wrap, $clearFilterButton)
  );
}) ();

/** version:
 *  ver 1.4.2   适配新的星星样式
 *  ver 1.4.1   增加筛选按钮, 默认隐藏筛选界面
 *  ver 1.4     可以按字数, 时间, 评分, UID范围筛选!
 *  ver 1.3     优化代码结构.
 *  ver 1.2     可以按注册顺序排序.
 *  ver 1.1     可以按评分顺序排序.
 *  ver 1.0     初始版本.
 */
