// ==UserScript==
// @name        本页楼层跳转支持
// @namespace   tv.bgm.cedar.makeInternalLink
// @version     1.0
// @description 支持本页楼层跳转
// @author      Cedar
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*(topic|ep|blog|comments|character).*/
// ==/UserScript==

/** include解释:
 *  ep       : 单集评论
 *  blog     : 日志
 *  topic    : 小组帖子 & 条目讨论
 *  comments : 目录评论页
 *  character: 角色页
 */

(function() {
  'use strict';

  const isInternalLink = url => /^bangumi\.tv|bgm\.tv|chii\.in$/.test(url.hostname) && url.pathname == location.pathname && url.hash;
  function makeInternal(a) {
    let url = new URL(a.href);
    if (isInternalLink(url)) {
      a.href = url.hash;
      a.target = "_self";
    }
  }

  document.querySelectorAll(".message a, .cmt_sub_content a").forEach(makeInternal); //所有回复
  if (window.location.pathname.includes("blog"))  //日志
    document.querySelectorAll(".blog_entry a").forEach(makeInternal);
  else if (window.location.pathname.includes("topic")) //小组
    document.querySelectorAll(".topic_content a").forEach(makeInternal);
}) ();
