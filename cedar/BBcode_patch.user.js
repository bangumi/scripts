// ==UserScript==
// @name        BBCode效果补丁
// @namespace   tv.bgm.cedar.BBcodePatch
// @version     1.1
// @description 支持列表BBCode效果, 增加indent关键字效果
// @author      Cedar
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in).*$/
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
/*调整让ul和ol的padding*/
#main ul, #main ol {
  padding-left: 2em;
}
/*让ul的list样式恢复原始状态*/
#main ul {
  list-style: revert;
}
/*添加indent样式*/
body blockquote {
  margin: 1em;
}
`)

// 修改Tag, 调整list样式
function changeTagName(srcNode, newname) {
  let destNode = document.createElement(newname);
  srcNode.childNodes.forEach(el => destNode.appendChild(el));
  Array.from(srcNode.attributes).forEach(attr => destNode.setAttribute(attr.nodeName, attr.nodeValue));
  srcNode.parentElement.replaceChild(destNode, srcNode);
}
document.querySelectorAll('ul.litype_1, ul.litype_2, ul.litype_3').forEach(function(el) {changeTagName(el, 'ol')});
