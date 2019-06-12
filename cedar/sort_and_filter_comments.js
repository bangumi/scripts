// ==UserScript==
// @name        吐槽列表排序
// @namespace   tv.bgm.cedar.sortcomments
// @version     1.1
// @description 排序吐槽列表
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*comments.*/
// ==/UserScript==

(function() {
  'use strict';

  let commentInDescendOrder = true;
  let dateInDescendOrder = false;
  let scoreInDescendOrder = true;
  let $commentBox = $('#comment_box');
  const getComments = () => Array.prototype.slice.call(document.querySelectorAll('#comment_box div.item'));

  const $sortButton = $(document.createElement('a'));
  $sortButton.addClass('chiiBtn').attr('href', 'javascript:;');

  const resetButton = $sortButton.clone();
  const sortByCommentButton = $sortButton.clone();
  const sortByDateButton = $sortButton.clone();
  const sortByScoreButton = $sortButton.clone();

  resetButton.on('click', resetOrder).text("初始顺序");
  sortByCommentButton.on('click', sortByCommentWordCount).text("字数顺序");
  sortByScoreButton.on('click', sortByScore).text("评分顺序");
  sortByDateButton.on('click', sortByDate).text("时间顺序");
  $commentBox.before(resetButton, sortByCommentButton, sortByScoreButton, sortByDateButton);

  function resetOrder() {
    dateInDescendOrder = true;
    sortByDate();
    commentInDescendOrder = true;
    scoreInDescendOrder = true;
    sortByCommentButton.text("字数顺序");
    sortByScoreButton.text("评分顺序");
    sortByDateButton.text("时间顺序");
  }

  function sortByCommentWordCount() {
    let comments = getComments();
    comments.sort((left, right) => {
      let leftN = left.querySelector('p').innerText.length;
      let rightN = right.querySelector('p').innerText.length;
      return commentInDescendOrder? rightN - leftN: leftN - rightN;
    });
    $commentBox.append(comments);
    sortByCommentButton.text(commentInDescendOrder? "字数顺序↓": "字数顺序↑");
    commentInDescendOrder = !commentInDescendOrder;
  }

  function sortByScore() {
    let comments = getComments();
    comments.sort((left, right) => {
      let leftN = left.querySelector('.starsinfo');
      leftN = leftN? leftN.className.slice(6,8): 0;
      let rightN = right.querySelector('.starsinfo');
      rightN = rightN? rightN.className.slice(6,8): 0;
      return scoreInDescendOrder? rightN - leftN: leftN - rightN;
    });
    $commentBox.append(comments);
    sortByScoreButton.text(scoreInDescendOrder? "评分顺序↓": "评分顺序↑");
    scoreInDescendOrder = !scoreInDescendOrder;
  }

  function sortByDate() {
    let comments = getComments();
    comments.sort((left, right) => {
      let leftN = parseDate(left.querySelector('small').innerText.slice(2));
      let rightN = parseDate(right.querySelector('small').innerText.slice(2));
      return dateInDescendOrder? rightN - leftN: leftN - rightN;
    });
    $commentBox.append(comments);
    sortByDateButton.text(dateInDescendOrder? "时间顺序↓": "时间顺序↑");
    dateInDescendOrder = !dateInDescendOrder;
  }

  function parseDate(date) {
    if (date.includes('ago')) {
      const convert = (t) => t? parseInt(t.toString().slice(0,-1)): 0;
      let s = convert(date.match(/\d+s/));
      let m = convert(date.match(/\d+m/));
      let h = convert(date.match(/\d+h/));
      let d = convert(date.match(/\d+d/));
      return new Date() - ((((d*24+h)*60+m)*60+s)*1000);
    }
    else {
      let m = date.match(/-\d{1,2}-/).toString();
      let mindex = m.replace(m, m-1);
      date.replace(m, mindex); // month starts with 0.
      return new Date(date).getTime();
    }
  }
}) ();

/** version:
 *  ver 1.1     可以按评分顺序排序.
 *  ver 1.0     初始版本.
 */
