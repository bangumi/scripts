// ==UserScript==
// @name        本页楼层跳转支持
// @namespace   tv.bgm.cedar.makeInternalLink
// @version     1.1
// @description 支持本页楼层跳转
// @author      Cedar
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*(ep|blog|group|subject|comments|character).*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/rakuen/topic/.*/
// ==/UserScript==

/** include解释:
 *  ep       : 单集评论
 *  blog     : 日志
 *  group    : 小组帖子
 *  subject  : 条目讨论
 *  comments : 目录评论页
 *  character: 角色页
 *  rakuen/topic/: 超展开
 */

(function() {
  'use strict';

  function isInternalLink(url) {
    /** rakuen link <-> normal link
     *  /rakuen/topic/group/{id}   <-> /group/topic/{id}
     *  /rakuen/topic/subject/{id} <-> /subject/topic/{id}
     *  /rakuen/topic/ep/{id}      <-> /ep/{id}
     *  /rakuen/topic/prsn/{id}    <-> /person/{id}
     *  /rakuen/topic/crt/{id}     <-> /character/{id}
     */
    let valid = url.hash && /^bangumi\.tv|bgm\.tv|chii\.in$/.test(url.hostname);
    if (!valid) return false;
    if(location.pathname.startsWith("/rakuen/topic/")) {
      let [type, id] = location.pathname.split("/").slice(-2);
      switch(type) {
        case "group":
        case "subject":
          return url.pathname === `/${type}/topic/${id}`;
        case "ep":
          return url.pathname === "/ep/"+id;
        case "prsn":
          return url.pathname === "/person/"+id;
        case "crt":
          return url.pathname === "/character/"+id;
      }
    }
    return url.pathname === location.pathname;
  }
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
