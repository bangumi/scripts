// ==UserScript==
// @name        本页楼层跳转支持
// @namespace   tv.bgm.cedar.makeInternalLink
// @version     1.1.1
// @description 支持本页楼层跳转
// @author      Cedar
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*(ep|blog|group|subject|comments|character|person).*/
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/rakuen/topic/.*/
// ==/UserScript==

/** include解释:
 *  ep       : 单集评论
 *  blog     : 日志
 *  group    : 小组帖子
 *  subject  : 条目讨论
 *  comments : 目录评论页
 *  character: 虚拟角色页
 *  person   : 现实人物页
 *  rakuen/topic/(crt|prsn): 超展开的虚拟角色和现实人物页
 *  rakuen/topic/(ep|group|subject): 超展开的单集评论 小组帖子 条目讨论.
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
    if (!url.hash || !/^bangumi\.tv|bgm\.tv|chii\.in$/.test(url.hostname)) return false;
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
    if (isInternalLink(a)) {
      a.href = a.hash;
      a.target = "_self";
    }
  }

  document.querySelectorAll(".message a, .cmt_sub_content a").forEach(makeInternal); //所有回复 (ep和comments页面只需适配所有回复)
  if (window.location.pathname.includes("blog"))  //日志
    document.querySelectorAll(".blog_entry a").forEach(makeInternal);
  else if (/group|subject/.test(window.location.pathname)) //小组帖子 & 条目讨论 (已包括超展开)
    document.querySelectorAll(".topic_content a").forEach(makeInternal);
}) ();
