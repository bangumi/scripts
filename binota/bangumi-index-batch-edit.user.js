// ==UserScript==
// @name        Bangumi-Index-Batch-Edit
// @namespace   BIBE
// @description Batch edit comments in your index, and easily sort them by dragging.
// @include     /^https?:\/\/((bgm|bangumi)\.tv|chii\.in)\/index\/\d+/
// @version     0.0.1
// @grant       none
// @require     https://code.jquery.com/ui/1.11.4/jquery-ui.min.js
// ==/UserScript==

//Check the owner of index, then insert the button for modify orders
if($('.idBadgerNeue a.avatar').attr('href').search($('.grp_box a.avatar').attr('href')) >= 0)
    $('.grp_box .tip_j').append(' / <a id="modifyOrder" class="chiiBtn" href="#">批量编辑</a>');

//Get formhash
var formhash = $('input[name="formhash"]').val();

$('#modifyOrder').click(function() {
  $('#browserItemList').sortable({
    handle: ".cover"
  });
  $('#browserItemList .tools').each(function() {
    if($(this).parent().find('.text').length == 0)
      $('<div id="comment_box"><div class="item"><div style="float:none;" class="text_main_even"><div class="text"><br></div><div class="text_bottom"></div></div></div></div>').insertBefore($(this));
  });
  $('#browserItemList .text').attr('contenteditable', 'true');
  $(this).remove();

  $('.grp_box .tip_j').append('<a id="saveOrder" class="chiiBtn" href="#">保存修改</a>');
  $('#saveOrder').click(function() {
    if(!confirm('确定要保存么？')) return;
    $(this).attr('disabled', 'disabled');
    $(this).html('保存中...');
    $('#browserItemList > li').each(function(i) {
      var postData = {content: '', formhash: '', order: ''};
      postData.content = $(this).find('.text').html();
      if(typeof postData.content === "undefined") postData.content = '';
      postData.content = postData.content.trim();
      
      postData.formhash = formhash;
      postData.order = i;
      postData.submit = '提交';
      
      console.log($(this));
      var itemid = $(this).find('.tools :first-child').attr('id').match(/modify_(\d+)/)[1];

      $.ajaxSetup({timeOut: 10});
      $.post('/index/related/' + itemid + '/modify', postData);
    });
    $(this).html('保存完毕...！');
  });
});
