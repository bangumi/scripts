// ==UserScript==
// @name        折叠Bangumi
// @namespace   tv.bgm.cedar.spoilerFakeBBcode
// @version     1.1
// @description 折叠Bangumi
// @author      Cedar
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*(ep|blog|group|subject|comments|character).*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/rakuen/topic/.*/
// @grant       GM_addStyle
// ==/UserScript==

/** include解释:
 *  ep       : 单集评论
 *  blog     : 日志
 *  group    : 小组主题
 *  subject  : 条目讨论
 *  comments : 目录评论页
 *  character: 角色页
 *  rakuen/topic/: 超展开
 */

(function() {
  'use strict';

  GM_addStyle{`
.spoiler-content {
  padding: 10px;
  border: 2px solid #EEE;
  background-color: #FEFBFC;
  border-radius: 5px;
}

html[data-theme='dark'] .spoiler-content {
  padding: 10px;
  border: 2px solid #444;
  background-color: #302E30;
  border-radius: 5px;
}
`};

  const SEARCHING_HEAD = 0;
  const COLLECTING_DATA = 1;
  const ASSEMBLING_SPOILER = 2;

  // wrapper and button
  const $collapseWrapper = $(document.createElement("div")).addClass("spoiler-content").hide();
  const $collapseBtn = $(document.createElement('button'))
    .attr("type", "button")
    .css('margin', '5px')
    .on("click", function(e) {$(this.nextElementSibling).fadeToggle("fast")});

  const keywords = /spoiler|fold|hide/i;
  const validHead = /^\s*\[(spoiler|fold|hide)(=(.*))?\]\s*$/i;
  const validTail = /^\s*\[\/(spoiler|fold|hide)\]\s*$/i;
  const getTitle = s => s.match(validHead)[3];
  const isBr = el => el && el.nodeType === Node.ELEMENT_NODE && el.tagName === "BR";

  function collapse(content) {
    if (!keywords.test(content.innerHTML)) return;
    let flag, startNode, endNode, title, collapseNodes = [];
    const reset = () => {flag = SEARCHING_HEAD, startNode = endNode = title = null, collapseNodes.length = 0};
    reset();

    let node = content.firstChild;
    while (node) {
      switch (flag) {
        case SEARCHING_HEAD:
          if(node.nodeType === Node.TEXT_NODE && validHead.test(node.wholeText)) {
            startNode = node;
            title = getTitle(node.wholeText) || "展开 / 折叠";
            flag = COLLECTING_DATA;
          }
          node = node.nextSibling;
          break;
        case COLLECTING_DATA:
          if(node.nodeType === Node.TEXT_NODE && validTail.test(node.wholeText)) {
            endNode = node;
            flag = ASSEMBLING_SPOILER;
          }
          else {
            collapseNodes.push(node);
            node = node.nextSibling;
          }
          break;
        case ASSEMBLING_SPOILER:
          if(isBr(collapseNodes[0])) content.removeChild(collapseNodes.shift());
          if(isBr(collapseNodes[collapseNodes.length-1])) content.removeChild(collapseNodes.pop());
          $(endNode).after(
            $(document.createElement("div")).append(
              $collapseBtn.clone(true).text(title),
              $collapseWrapper.clone().append(collapseNodes)
            )
          )
          node = node.nextSibling; //摆前面, 因为removeChild后就没有nextSibling了
          content.removeChild(startNode);
          content.removeChild(endNode);
          reset();
          break;
      }
    }
  }

  //所有回复
  document.querySelectorAll(".message, .cmt_sub_content").forEach(collapse);
  if (location.pathname.includes("blog"))  //日志
    document.querySelectorAll(".blog_entry").forEach(collapse);
  else if (location.pathname.includes("group") || location.pathname.includes("subject")) //小组主题 & 条目讨论
    document.querySelectorAll(".topic_content").forEach(collapse);
}) ();
