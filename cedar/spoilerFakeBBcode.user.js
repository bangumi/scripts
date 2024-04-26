// ==UserScript==
// @name        折叠Bangumi
// @namespace   tv.bgm.cedar.spoilerFakeBBcode
// @version     2.0.2
// @description 折叠Bangumi
// @author      Cedar
// @match       *://bgm.tv/*
// @match       *://bangumi.tv/*
// @match       *://chii.in/*
// @grant       GM_addStyle
// ==/UserScript==

/** include解释:
 *  ep       : 单集评论
 *  blog     : 日志
 *  group    : 小组主题
 *  subject  : 条目讨论
 *  index    : 目录页
 *  index/\d+/comments : 目录评论页
 *  character: 角色页
 *  rakuen/topic/: 超展开
 */

'use strict';

if (!/^\/.*(ep|blog|group|subject|index|index\/\d+\/comments|character|rakuen\/topic\/).*/.test(location.pathname)) return;

GM_addStyle(`
.spoiler-wrapper {
  padding: 10px;
  border: 2px solid #EEE;
  background-color: #FEFBFC;
  border-radius: 5px;
}

html[data-theme='dark'] .spoiler-wrapper {
  border: 2px solid #444;
  background-color: #302E30;
}

.spoiler-content {
  padding-top: 10px;
  border-top: 2px solid #EEE;
  margin-top: 10px;
}

html[data-theme='dark'] .spoiler-content {
  border-top: 2px solid #444;
}
`);

const SEARCHING_HEAD = 0;
const COLLECTING_DATA = 1;
const ASSEMBLING_SPOILER = 2;

const keywords = /spoiler|fold|hide/i;
const validHead = /^\s*\[(spoiler|fold|hide)(=(.*))?\]\s*$/i;
const validTail = /^\s*\[\/(spoiler|fold|hide)\]\s*$/i;
const getTitle = s => s.match(validHead)[3];

function isBr(el) {
  return el && el.nodeType === Node.ELEMENT_NODE && el.tagName === "BR";
}

// 用于组装折叠元素
function getCollapseEl(title, collapseNodes) {
  const summaryEl = document.createElement('summary');
  summaryEl.style.fontWeight = "bold";
  summaryEl.style.cursor = "pointer";
  summaryEl.innerText = title;
  const contentEl = document.createElement("div");
  contentEl.classList.add("spoiler-content");
  contentEl.append(...collapseNodes);
  const collapseWrapper = document.createElement("details");
  collapseWrapper.classList.add("spoiler-wrapper");
  collapseWrapper.append(summaryEl, contentEl);

  return collapseWrapper;
}

function collapse(parentEl) {
  if (!keywords.test(parentEl.innerHTML)) return;

  let flag, startNode, endNode, title, collapseNodes = [];

  const reset = () => {
    flag = SEARCHING_HEAD;
    startNode = endNode = title = null;
    collapseNodes.length = 0
  };
  reset();

  let node = parentEl.firstChild;
  while (node) {
    switch (flag) {
      case SEARCHING_HEAD: {
        if(node.nodeType === Node.TEXT_NODE && validHead.test(node.wholeText)) {
          startNode = node;
          title = getTitle(node.wholeText) || "展开 / 折叠";
          flag = COLLECTING_DATA;
        }
        node = node.nextSibling;
        break;
      }
      case COLLECTING_DATA: {
        if(node.nodeType === Node.TEXT_NODE && validTail.test(node.wholeText)) {
          endNode = node;
          flag = ASSEMBLING_SPOILER;
        }
        else {
          collapseNodes.push(node);
          node = node.nextSibling;
        }
        break;
      }
      case ASSEMBLING_SPOILER: {
        if(isBr(collapseNodes[0])) parentEl.removeChild(collapseNodes.shift());
        if(isBr(collapseNodes[collapseNodes.length-1])) parentEl.removeChild(collapseNodes.pop());

        const collapseWrapper = getCollapseEl(title, collapseNodes);
        endNode.after(collapseWrapper);

        node = node.nextSibling; //摆前面, 因为removeChild后就没有nextSibling了
        parentEl.removeChild(startNode);
        parentEl.removeChild(endNode);
        reset();
        break;
      }
    }
  }
}

//所有回复
document.querySelectorAll(".message, .cmt_sub_content").forEach(collapse);
if (location.pathname.includes("blog")) { //日志
  document.querySelectorAll(".blog_entry").forEach(collapse);
} else if (location.pathname.includes("group") || location.pathname.includes("subject")) { //小组主题 & 条目讨论
  document.querySelectorAll(".topic_content").forEach(collapse);
} else if (location.pathname.startsWith("/index")) { // 目录简介页
  document.querySelectorAll("#columnSubjectBrowserA > div.grp_box > div > div > span").forEach(collapse);
}
