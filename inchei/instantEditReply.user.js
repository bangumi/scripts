// // ==UserScript==
// // @name         发完评论立刻修改、评论或删除
// // @namespace    bangumi.instant.edit.reply
// // @version      0.0.1
// // @description  发完评论立刻修改、评论或删除
// // @author       you
// // @icon         https://bgm.tv/img/favicon.ico
// // @match        http*://bgm.tv/group/topic/*
// // @match        http*://chii.in/group/topic/*
// // @match        http*://bangumi.tv/group/topic/*
// // @grant        none
// // @license      MIT
// // @gf
// // @gadget
// // ==/UserScript==

// (function () {
//   'use strict';

//   const topic_id = location.pathname.split('/').pop();
//   if (!topic_id.match(/\d+/)) return;

//   /*
//   {
//     "pst_id": "3829576",
//     "pst_mid": "455187",
//     "pst_uid": "1221392",
//     "pst_content": "test",
//     "username": "1221392",
//     "nickname": "柏",
//     "sign": "",
//     "avatar": "//lain.bgm.tv/pic/user/l/icon.jpg",
//     "dateline": "2026-4-13 16:32",
//     "model": "group",
//     "is_self": true
//   }
//   subReply('group', 455187, 3829576, 0, 1221392, 1221392, 0)
//   */
//   const formhash = document.querySelector('a.logout')?.href.split('/').pop();
//   chiiLib.ajax_reply.insertMainComments = function (list_id, json) {
//     if (json.posts.main) {
//       var posts = json.posts.main,
//         html = '',
//         $list = $(list_id);
//       var bg_class = ($list.find('div.row_reply:last').hasClass('light_odd')) ? 'light_odd' : 'light_even';
//       for (var i in posts) {
//         if ($('#post_' + i).length == 0) {
//           console.log(i);
//           console.dir(posts[i]);
//           var bg_class = (bg_class == 'light_even') ? 'light_odd' : 'light_even';
//           var topic_tool = /* html */`
//           <div class="action">
//             <a href="javascript:void(0);" onclick="subReply('group', ${posts[i].pst_mid}, ${posts[i].pst_id}, 0, ${CHOBITS_UID}, ${CHOBITS_UID}, 0)" class="icon">
//               <span class="ico ico_reply">回复</span>
//             </a>
//           </div>
//           <div class="action dropdown ">
//             <a href="javascript:void(0);" class="icon like_dropdown" data-like-type="8"
//               data-like-main-id="${posts[i].pst_mid}"
//               data-like-related-id="${posts[i].pst_id}" data-like-tpl-id="likes_reaction_menu">
//               <span class="ico ico_like">&nbsp;</span>
//               <span class="title">贴贴</span>
//             </a>
//           </div>
//           <div class="action dropdown">
//             <a href="javascript:void(0);" class="icon"><span class="ico ico_more">...</span></a>
//             <ul>
//               <li><a href="/group/reply/${posts[i].pst_id}/edit">编辑</a></li>
//               <li><a id="erase_${posts[i].pst_id}" href="/erase/group/reply/${posts[i].pst_id}?gh=${formhash}" class="erase_post">删除</a></li>
//               <li><a href="/report?type=8&amp;id=${posts[i].pst_id}&amp;keepThis=false&amp;TB_iframe=true&amp;height=215&amp;width=450" title="报告疑虑" class="thickbox">报告疑虑</a></li>
//             </ul>
//           </div>`;
//           html += '<div id="post_' + posts[i].pst_id + '" class="' + bg_class + ' row_reply clearit"><div class="post_actions re_info"><div class="action"><small>' + posts[i].dateline + '</small></div>' + topic_tool + '</div><a href="' + SITE_URL + '/user/' + posts[i].username + '" class="avatar"><span class="avatarNeue avatarReSize40 ll" style="background-image:url(\'' + posts[i].avatar + '\');"></span></a><div class="inner"><strong><a href="' + SITE_URL + '/user/' + posts[i].username + '" class="l post_author_' + posts[i].pst_id + '">' + posts[i].nickname + '</a></strong><span class="tip_j">' + posts[i].sign + '</span><div class="reply_content"><div class="message">' + posts[i].pst_content + '</div></div></div></div>';
//         }
//       }
//       if (html != '') {
//         const r = $(html);
//         if (typeof (REPLY_PREPEND) != 'undefined') {
//           r.hide().prependTo(list_id).fadeIn();
//         } else {
//           r.hide().appendTo(list_id).fadeIn();
//         }
//         init(r);
//       }
//     }
//   };

//   /*
//   {
//     "pst_id": "3829576",
//     "pst_mid": "455187",
//     "pst_uid": "1221392",
//     "pst_content": "test",
//     "username": "1221392",
//     "nickname": "柏",
//     "sign": "",
//     "avatar": "//lain.bgm.tv/pic/user/l/icon.jpg",
//     "dateline": "2026-4-13 16:32",
//     "model": "group",
//     "is_self": true
//   }
//   subReply('group', 455187, 3829500, 3829578, 370405, 1221392, 1)
//   */
//   chiiLib.ajax_reply.insertSubComments = function (list_id, json) {
//     if (json.posts.sub) {
//       var posts = json.posts.sub,
//         $list = $(list_id);
//       $.each(
//         posts,
//         function (post_id, sub_posts) {
//           if (sub_posts) {
//             var $post = $('#post_' + post_id),
//               $main_post = $post.find('div.message');
//             if (!$('#topic_reply_' + post_id).length) {
//               $main_post.after(
//                 '<div id="topic_reply_' + post_id + '" class="topic_sub_reply"></div>'
//               );
//             }
//             var html = '';
//             $.each(
//               sub_posts,
//               function (key, val) {
//                 if ($('#post_' + val.pst_id).length == 0) {
//                   console.dir(val);
//                   var topic_tool = /* html */`
//                   <div class="action">
//                     <a href="javascript:void(0);" onclick="subReply('group', ${val.pst_mid}, ${post_id}, ${val.pst_id}, ${CHOBITS_UID}, ${CHOBITS_UID}, 1)" class="icon">
//                       <span class="ico ico_reply">回复</span>
//                     </a>
//                   </div>
//                   <div class="action dropdown ">
//                     <a href="javascript:void(0);" class="icon like_dropdown" data-like-type="8"
//                       data-like-main-id="${topic_id}"
//                       data-like-related-id="${val.pst_id}" data-like-tpl-id="likes_reaction_menu">
//                       <span class="ico ico_like">&nbsp;</span>
//                       <span class="title">贴贴</span>
//                     </a>
//                   </div>
//                   <div class="action dropdown">
//                     <a href="javascript:void(0);" class="icon"><span class="ico ico_more">...</span></a>
//                     <ul>
//                       <li><a href="/group/reply/${val.pst_id}/edit">编辑</a></li>
//                       <li><a id="erase_${val.pst_id}" href="/erase/group/reply/${val.pst_id}?gh=${formhash}" class="erase_post">删除</a></li>
//                       <li><a href="/report?type=8&amp;id=${val.pst_id}&amp;keepThis=false&amp;TB_iframe=true&amp;height=215&amp;width=450" title="报告疑虑" class="thickbox">报告疑虑</a></li>
//                     </ul>
//                   </div>`;
//                   html += '<div id="post_' + val.pst_id + '" class="sub_reply_bg clearit"><div class="post_actions re_info"><div class="action"><small>' + val.dateline + '</small></div>' + topic_tool + '</div><a href="' + SITE_URL + '/user/' + val.username + '" class="avatar"><span class="avatarNeue avatarSize32 ll" style="background-image:url(\'' + val.avatar + '\')"></span></a><div class="inner"><strong class="userName"><a href="' + SITE_URL + '/user/' + val.username + '" class="l">' + val.nickname + '</a></strong><div class="cmt_sub_content">' + val.pst_content + '</div></div></div>';
//                 }
//               }
//             );
//             if (html != '') {
//               const r = $(html);
//               r.hide().appendTo('#topic_reply_' + post_id).fadeIn();
//               init(r);
//             }
//           }
//         }
//       );
//     }
//   };

//   function init(r) {
//     r.find('div.likes_grid').tooltip({
//       animation: true,
//       offset: 0,
//       selector: 'a.item',
//       html: true,
//       delay: {
//         show: '300',
//         'hide': 5000
//       }
//     });
//     r.find('div.likes_grid a.item').on('show.bs.tooltip', function (e) {
//       $('.tooltip[aria-describedby!=\'' + $(this).attr('aria-describedby') + '\']').each(function () {
//         $(this).tooltip('hide');
//       });
//       $(this).bind('click', function () { // updateAllGrids 不含克隆，在此绑定
//         chiiLib.likes.req(this);
//         return false;
//       });
//     });
//     r.find('.likes_grid').on('mouseleave', function () {
//       $('.tooltip').each(function () {
//         $(this).tooltip('hide');
//       });
//     });
//     r.find('a.like_dropdown').bind('mouseenter', function () {
//       var $item = $(this),
//         $container = $item.closest('.dropdown'),
//         $type = $item.attr('data-like-type'),
//         $main_id = $item.attr('data-like-main-id'),
//         $related_id = $item.attr('data-like-related-id'),
//         $tpl_id = $item.attr('data-like-tpl-id');
//       if (!$container.find('ul').length) {
//         var $tpl = $('#' + $tpl_id).html();
//         $container.append($tpl.formatUnicorn({
//           type: $type,
//           main_id: $main_id,
//           related_id: $related_id,
//         }));
//         $container.find('ul a').bind('click', function () {
//           chiiLib.likes.req(this);
//           return false;
//         });
//       }
//     });
//     r.find('.erase_post').click(function () {
//       if (confirm(AJAXtip['eraseReplyConfirm'])) {
//         var post_id = $(this).attr('id').split('_')[1];
//         chiiLib.ukagaka.presentSpeech(AJAXtip['wait'] + AJAXtip['eraseingReply']);
//         $.ajax({
//           type: 'GET',
//           url: (this) + '&ajax=1',
//           success: function (html) {
//             $('#post_' + post_id).fadeOut(500);
//             chiiLib.ukagaka.presentSpeech(AJAXtip['eraseReply'], true);
//           },
//           error: function (html) {
//             chiiLib.ukagaka.presentSpeech(AJAXtip['error'], true);
//           }
//         });
//       }
//       return false;
//     });
//   }
// })();
