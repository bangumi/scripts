// ==UserScript==
// @name        bangumi new game subject helper
// @name:zh-CN  bangumi创建黄油条目助手
// @namespace   https://github.com/22earth
// @description assist to create new game subject
// @description:zh-cn 辅助创建Bangumi黄油条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @include     http://bangumi.tv/subject/*/add_related/person
// @include     http://bangumi.tv/subject/*/edit_detail
// @include     https://bgm.tv/subject/*/add_related/person
// @include     https://bgm.tv/subject/*/edit_detail
// @include     https://cse.google.com/cse/home?cx=008561732579436191137:pumvqkbpt6w
// @include     /^https?:\/\/erogamescape\.(?:ddo\.jp|dyndns\.org)\/~ap2\/ero\/toukei_kaiseki\/(.*)/
// @include     http://122.219.133.135/~ap2/ero/toukei_kaiseki/*
// @include     http://www.dmm.co.jp/dc/pcgame/*
// @version     0.3.3
// @note        0.3.0 增加上传人物肖像功能，需要和bangumi_blur_image.user.js一起使用
// @note        0.3.1 增加在Getchu上点击检测条目是否功能存在，若条目存在，自动打开条目页面。
// @note        0.3.3 增加添加Getchu游戏封面的功能，需要和bangumi_blur_image.user.js一起使用
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bangumi_new_subject_helper.user.js
// @run-at      document-end
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @require     https://cdn.staticfile.org/jquery/2.1.4/jquery.min.js
// @require     https://cdn.staticfile.org/fuse.js/2.6.2/fuse.min.js
// ==/UserScript==

// /^https?:\/\/(ja|en)\.wikipedia\.org\/wiki\/.*$/
