// ==UserScript==
// @name        Bangumi-Reply-Extend
// @namespace   BRE
// @description Edit/delete your reply, no refresh required.
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/((group|subject)\/topic|ep|index)\/\d+/
// @version     0.0.1
// @grant       none
// ==/UserScript==

var eraseUrl = ''; //need to append "?gh={formhash}" when using it.
var editUrl = '';
var needShuffix = false;

//Replace the events that binding on the submit button.
$(function() {
  //Clean the original binding: https://stackoverflow.com/questions/19469881/javascript-remove-all-event-listeners-of-specific-type#19470348
  $('#ReplyForm')[0].parentNode.replaceChild($('#ReplyForm')[0].cloneNode(true), $('#ReplyForm')[0]);

  switch(true) {
    case (window.location.href.search('group') > 0):
      eraseUrl = '/erase/group/reply/';
      editUrl = '/group/reply/'; //need to append "/edit" when using it.
      needShuffix = true;
      break
    case (window.location.href.search('subject') > 0):
      eraseUrl = '/erase/subject/reply/';
      editUrl = '/subject/reply/'; //need to append "/edit" when using it.
      needShuffix = true;
      break;
    case (window.location.href.search('ep') > 0):
      eraseUrl = '/erase/reply/ep/';
      editUrl = '/subject/ep/edit_reply/';
    case (window.location.href.search('index') > 0):
      eraseUrl = '/erase/reply/index/';
      editUrl = '/index/edit_reply/';
      break;
  }

  //The modified event, clone from bgm.tv
  $('#ReplyForm').submit(function () {
    var $form = $(this),
    message = $('#content').val(),
    related_photo = $('#related_photo').val(),
    $lastview_timestamp = $form.find('[name=lastview]'),
    $formhash = $(this).find('[name=formhash]').val();
    if (message != '') {
      submitTip();
      if (related_photo == undefined) {
        related_photo = 0;
      }
      $.ajax({
        type: 'POST',
        url: $(this).attr('action') + '?ajax=1',
        data: ({
          content: message,
          related_photo: related_photo,
          lastview: $lastview_timestamp.val(),
          formhash: $formhash,
          submit: 'submit'
        }),
        dataType: 'json',
        success: function (json) {
          chiiLib.ajax_reply.insertJsonComments('#comment_list', json);
          $lastview_timestamp.val(json.timestamp);
          //== MOD =================
          for(i in json.posts.main) {
            //the variable i is post id
            $('#post_' + i + ' .re_info small').append(' / <a id="erase_' + i + '" class="erase_post" href="' + eraseUrl + i + '?gh=' + $('input[name="formhash"]').val() + '">del</a> / <a href="' + editUrl + i + (needShuffix ? '/edit' : '') + '">edit</a>');
            //binding erase confirm
            $('#erase_' + i).click(function () {
              if (confirm(AJAXtip['eraseReplyConfirm'])) {
                var post_id = $(this).attr('id').split('_') [1];
                $('#robot').fadeIn(500);
                $('#robot_balloon').html(AJAXtip['wait'] + AJAXtip['eraseingReply']);
                $.ajax({
                  type: 'GET',
                  url: (this) + '&ajax=1',
                  success: function (html) {
                    $('#post_' + post_id).fadeOut(500);
                    $('#robot_balloon').html(AJAXtip['eraseReply']);
                    $('#robot').animate({
                      opacity: 1
                    }, 1000).fadeOut(500);
                  },
                  error: function (html) {
                    $('#robot_balloon').html(AJAXtip['error']);
                    $('#robot').animate({
                      opacity: 1
                    }, 1000).fadeOut(500);
                  }
                });
              }
              return false;
            });
          }
          //========================
          $('#content').val('');
          if (typeof (REPLY_SUBMIT_TITLE) != 'undefined') {
            var submit_title = REPLY_SUBMIT_TITLE;
          } else {
            var submit_title = '写好了';
          }
          $('#submitBtnO').html('<input class="inputBtn" value="' + submit_title + '" name="submit" type="submit">&nbsp;&nbsp;<span class="tip">使用Ctrl+Enter或Alt+S快速提交</span>');
        },
        error: function (json) {
          submitError();
        }
      });
    }
    return false;
  });
});