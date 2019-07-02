// ==UserScript==
// @name        折叠Bangumi
// @namespace   tv.bgm.cedar.spoilerFakeBBcode
// @version     0.9
// @description 折叠Bangumi
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*(topic|ep|blog|comments|character).*/
// @grant       GM_addStyle
// ==/UserScript==

/** include解释:
 *  topic    : 小组帖子 & 条目讨论
 *  ep       : 单集评论
 *  blog     : 日志
 *  comments : 目录评论页
 *  character: 角色页
 */

(function() {
  'use strict';

  GM_addStyle{`
.spoiler-content {
  border-style: inset;
  padding: 0 10px;
  border-color: lightgrey;
  background-color: snow;
}
`};

  const SEARCHING_HEAD = 0;
  const COLLECTING_DATA = 1;

  // wrapper and button
  const $collapseWrapper = $(document.createElement("div")).addClass("spoiler-content").hide();
  const $collapseBtn = $(document.createElement('button'))
    .attr("type", "button")
    .css('margin', '5px')
    .on("click", function(e) {$(this.nextElementSibling).fadeToggle("fast")});

  //const validHead = /^\s*(!?)\*===+\s*((.*?)\s*===+\*\1\s*)?$/;
  //const validTail = /^\s*(!?)\*===+\*\1\s*$/;
  //const getTitle = s => s.replace(validHead, "$3");
  const validHead = /^\s*\[(spoiler|fold|hide)(=(.*))?\]\s*$/;
  const validTail = /^\s*\[\/(spoiler|fold|hide)\]\s*$/
  const getTitle = s => s.replace(validHead, "$3");
  const isBr = el => el && el.nodeType === Node.ELEMENT_NODE && el.tagName === "BR";

  function collapse(content) {
    let flag, startNode, text, title, collapseNodes = [];
    const reset = () => {flag = SEARCHING_HEAD, startNode = text = title = null, collapseNodes.length = 0};
    reset();

    let node = content.firstChild;
    while (node) {
      switch (flag) {
        case SEARCHING_HEAD:
          if(node.nodeType === Node.TEXT_NODE) {
            text = node.wholeText;
            if(validHead.test(text)) {
              startNode = node;
              title = getTitle(text) || "展开 / 折叠";
              flag = COLLECTING_DATA;
            }
          }
          node = node.nextSibling;
          break;
        case COLLECTING_DATA:
          if(node.nodeType === Node.TEXT_NODE) {
            text = node.wholeText;
            if(validTail.test(text)) {
              if(isBr(collapseNodes[0]))
                content.removeChild(collapseNodes.shift());
              if(isBr(collapseNodes[collapseNodes.length-1]))
                content.removeChild(collapseNodes.pop());
              $(node).after(
                $(document.createElement("div")).append(
                  $collapseBtn.clone(true).text(title),
                  $collapseWrapper.clone().append(collapseNodes)
                )
              )
              let endNode = node;
              node = node.nextSibling;

              content.removeChild(endNode);
              content.removeChild(startNode);
              reset();
              break;
            }
          }
          collapseNodes.push(node);
          node = node.nextSibling;
          break;
      }
    }
  }

  const collapseAll = nodes => {for(let c of nodes) collapse(c)};
  //所有回复
  collapseAll(document.querySelectorAll(".message, .cmt_sub_content"));
  if (window.location.pathname.includes("blog"))  //日志
    collapseAll(document.querySelectorAll(".blog_entry"));
  else if (window.location.pathname.includes("topic")) //小组
    collapseAll(document.querySelectorAll(".topic_content"));
}) ();
