// ==UserScript==
// @name         Bangumi.tv Topic Comments Reversal
// @namespace    https://github.com/bangumi/scripts
// @version      1.0.1
// @description  倒序显示讨论串
// @icon         https://bgm.tv/img/smiles/tv/15.gif
// @author       JarvieK
// @include      /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(subject|group)/topic/.+$/
// @encoding     utf-8
// ==/UserScript==

const COOKIE_COMMENT_REVERSAL_STATE_KEY = "cookie-comment-reversal-state";

/**
 * entrypoint
 */
(function () {
    'use strict';
    const slideContainer = $("#sliderContainer");
    const checkbox = $(`<input id="commentReversalCheckbox" type="checkbox" />`);
    checkbox.change(function () {
        const checked = this.checked;
        setState(checked);
        reverseCommentList();
    });
    const checkboxContainer = $(`<div>`).css({
        "display": "flex",
        "align-items": "center",
        "margin": "4px",
        "justify-content": "flex-end"
    })
        .append($(`<span>倒序显示</span>`).css({
            "margin": "0 4px"
        }))
        .append(checkbox);
    checkboxContainer.insertAfter(slideContainer);

    // set to stored state
    const state = getState();
    if (state) checkbox.prop('checked', state).change();
})();

/**
 * retrieve state store in cookies
 * @returns {boolean}
 */
function getState() {
    const value = $.cookie(COOKIE_COMMENT_REVERSAL_STATE_KEY);
    return value === "true";
}

/**
 * update comments to reversal order
 * update reversal settings in cookies
 *
 * @param checked {boolean}
 */
function setState(checked) {
    const value = checked ? "true" : "false";
    $.cookie(COOKIE_COMMENT_REVERSAL_STATE_KEY, value, { expires: new Date("3000-01-01T00:00:00Z") });
}

function reverseCommentList() {
    // top level comments
    const commentList = $("#comment_list");
    const comments = commentList.children();
    commentList.empty().append(comments.get().reverse());

    // sub replies
    $(".topic_sub_reply").each((_, reply) => {
        reply = $(reply);
        const subReplies = reply.children();
        reply.empty().append(subReplies.get().reverse());
    });
}
