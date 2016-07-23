// ==UserScript==
// @name        EpSpoilerFolder
// @namespace   bangumi.scripts.prevails.EpSpoilerFolder
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/((m|rakuen)\/topic\/)?ep\/\d+$/
// @require     https://code.jquery.com/jquery-2.2.4.min.js
// @version     1
// @grant       GM_addStyle
// @encoding    utf-8
// ==/UserScript==

const $reply = $('.row_reply');

const regex = /(剧透|劇透)/;
const message = '可能有剧透！单击此处显示 / 隐藏';

$reply.each(function(){
    const $div = $('.message.clearit,.cmt_sub_content', this);
    const text = $div.text();
    if (text.match(regex)) {
        const $reply_content = $('.reply_content', this);
        $reply_content.hide();
        $reply_content.before(`<a class="ep_spoiler_fold_toggle" href="javascript:;">(+${$div.length - 1}) ${message}</a>`);
    }
});

$('.ep_spoiler_fold_toggle').click(function(){
    $(this).next().slideToggle();
});

GM_addStyle("a.ep_spoiler_fold_toggle {display:block;color:#bbb;margin-top:5px}");
