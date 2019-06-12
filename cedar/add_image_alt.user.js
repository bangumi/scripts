// ==UserScript==
// @name        图片加载失败指示
// @namespace   tv.bgm.cedar.addImageAlt
// @version     1.0
// @description 图片加载失败时给出指示
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*(topic|ep|blog|comments).*/
// ==/UserScript==

/** include解释:
 *  topic   : 小组帖子 & 条目讨论
 *  ep      : 单集评论
 *  blog    : 日志
 *  comments: 目录评论页
 *  没有添加角色页(character), 因为角色页无法添加图片.
 *  如果以后支持了, 只需要改动include就能生效.
 */

(function() {
  function addImageAlt() {
    if (!this.getAttribute("alt"))
      this.setAttribute("alt", this.getAttribute("src"));
  };
  $(".reply_content").find("img").each(addImageAlt); //所有回复
  if (window.location.pathname.includes("blog"))
    $(".blog_entry").find("img").each(addImageAlt); //日志
  if (window.location.pathname.includes("topic"))
    $(".topic_content").find("img").each(addImageAlt); //小组
}) ();
