// ==UserScript==
// @name        BBCode效果补丁
// @namespace   tv.bgm.cedar.BBcodePatch
// @version     1.0
// @description 支持列表BBCode效果, 增加indent关键字效果
// @author      Cedar
// @include     *
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
/*必须加上父节点, 否则会修改bangumi页面的菜单本身的样式*/
.message ul, .reply_content ul, .cmt_sub_content ul, .blog_entry ul, .topic_content ul,
.message ol, .reply_content ol, .cmt_sub_content ol, .blog_entry ol, .topic_content ol {
  list-style-position: outside;
  margin-left: 2em;
}
.message ul, .reply_content ul, .cmt_sub_content ul, .blog_entry ul, .topic_content ul {
  list-style-type: disc;
}
.message ol ul ul, .reply_content ol ul ul, .cmt_sub_content ol ul ul, .blog_entry ol ul ul, .topic_content ol ul ul,
.message ul ul, .reply_content ul ul, .cmt_sub_content ul ul, .blog_entry ul ul, .topic_content ul ul {
  list-style-type: circle;
}
.message ol ul ul ul, .reply_content ol ul ul ul, .cmt_sub_content ol ul ul ul, .blog_entry ol ul ul ul, .topic_content ol ul ul ul,
.message ul ul ul, .reply_content ul ul ul, .cmt_sub_content ul ul ul, .blog_entry ul ul ul, .topic_content ul ul ul {
  list-style-type: square;
}
body blockquote {
  margin: 1em;
}
`)

function changeTagName(srcNode, newname) {
  let destNode = document.createElement(newname);
  Array.from(srcNode.attributes).forEach(attr => destNode.setAttribute(attr.nodeName, attr.nodeValue))
  Array.from(srcNode.childNodes).forEach(el => destNode.appendChild(el));
  srcNode.parentElement.replaceChild(destNode, srcNode);
}
document.querySelectorAll('ul.litype_1, ul.litype_2, ul.litype_3').forEach(function(el) {changeTagName(el, 'ol')});
