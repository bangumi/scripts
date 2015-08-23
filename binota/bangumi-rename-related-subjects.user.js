// ==UserScript==
// @name        Bangumi-Rename-Related-Subjects
// @namespace   BRRS
// @description Quickly rename all related subjects at the same time.
// @include     /^https?:\/\/((bgm|bangumi)\.tv|chii\.in)\/subject\/\d+\/add_related\/subject/
// @version     0.0.4
// @grant       none
// ==/UserScript==

var platforms = {
  book: [{id: 1001, name: '漫画', meta: 'Manga'},
         {id: 1002, name: '小说', meta: 'Novel'},
         {id: 1003, name: '画集', meta: 'Book'},
         {id: 0, name: '其它', meta: 'Book'}],
  anime: [{id: 1, name: 'TV', meta: 'TVAnime'},
          {id: 2, name: 'OVA', meta: 'OVA'},
          {id: 3, name: '剧场版', meta: 'Movie'},
          {id: 0, name: '其它', meta: 'Anime'}],
  music: [],
  game: [],
  real: [{id: 1, name: '日剧', meta: 'Television'},
         {id: 2, name: '欧美剧', meta: 'Television'},
         {id: 3, name: '华语剧', meta: 'Television'},
         {id: 0, name: '其它', meta: 'Television'}]
};
var subjects = [];
var saving = 0;
var editCount = 0;
var editSummary = '标题修正+类型修正 by BRRS批量修改';
var formhash = $('input[name="formhash"]').val();

//Check platform type by url:

//Preparing workspace:
$('<div id="brrs-workspace" class="columns clearit" style="display: none; padding: 10px 0;">' +
      '<style>' +
          '#brrs-subject-list { width: 100%; }' +
          '#brrs-subject-list .inputtext { width: calc(100% - 20px); height: 15px }' +
          '#brrs-subject-list tr { height: 40px; background: #F9F9F9; border-bottom: 1px solid #E0E0E0; padding: 5px 10px; }' +
          '#brrs-subject-list label { padding: 0 7px; }' +
      '</style>' +
      '<table id="brrs-subject-list"></table>' +
      '<input type="hidden" id="subject_infobox" style="display:none;">' +
      '<input id="brrs-save" type="button" class="inputBtn" value="批量保存">' +
      '<small class="grey clearit rr">Powered by <a href="https://github.com/bangumi/scripts/tree/master/binota" target="_blank">BRRS</a>.</small>' +
  '</div>').insertBefore('.mainWrapper .columns');
$('<a class="chiiBtn rr" id="brrs-launcher" href="#">BRRS 批量修改</a>').insertAfter('#modifyOrder');

//Detect the type of platform:
var platform = window.location.href.match(/add_related\/subject\/(anime|book|music|game|real)/)[1];

//Get subjects:
$('#crtRelateSubjects > li').each(function() {
  var subject = {};
  subject.id = $(this).attr('item_id');
  subject.title = $(this).find('.title a').html().trim();
  subjects.push(subject);
});

$('#brrs-launcher').click(function() {
  $('#brrs-workspace').show();
  //Insert them into workspace:
  for(i in subjects) {
    var li = '<tr data-listid="' + i + '" data-edited="0">';
    li += '<td width="65%">';
    li += '<input class="inputtext renameSubject" '+
                 'name="brrs_titles[' + subjects[i].id + ']" ' +
                 'data-id="' + subjects[i].id + '" ' +
                 'data-title="' + subjects[i].title + '" ' +
                 'value="' + subjects[i].title + '"' +
                 'onchange="$(this.parentNode.parentNode).attr(\'data-edited\',\'1\')">';
    li += '</td><td>';
    $.get('/subject/' + subjects[i].id + '/edit_detail', function(data) {
      var subject_id = data.match(/<a href="\/subject\/(\d+)" title="[^"]*" property="v:itemre/)[1];
      var $i = null;
      for($i in subjects) {
        if(subjects[$i].id == subject_id) break;
      }
      
      subjects[$i].platform = data.match(/value="(\d+)" onclick="WikiTpl\('[^']+'\)" checked>/)[1];
      subjects[$i].infobox = data.match(/subject_infobox"[^>]+>([\S\s]*?)<\/textarea>/m)[1];
      subjects[$i].summary = data.match(/subject_summary"[^>]+>([\S\s]*?)<\/textarea>/m)[1];
      $('input[name="platform[' + subject_id + ']"][value=' + subjects[$i].platform + ']').attr('checked', 'true');
      
      var editbox = '';
      editbox += '<div style="padding: 10px">';
      editbox += '<h4>Infobox</h4>';
      editbox += '<textarea name="infobox" class="quick" rows="15">' + subjects[$i].infobox + '</textarea>';
      editbox += '<h4>Summary</h4>';
      editbox += '<textarea name="summary" class="quick" rows="7">' + subjects[$i].summary + '</textarea><br>';
      editbox += '<input type="button" class="inputBtn" value="确定" onclick="saveTbSubject(' + $i + ')">';
      editbox += '</div>';
      $('#brrs-subject-details-' + subject_id).html(editbox);
    });

    for(j in platforms[platform]) {
      li += '<input class="platform radio" ' +
                   'type="radio" ' +
                   'value="' + platforms[platform][j].id + '" ' +
                   'name="platform[' + subjects[i].id + ']"' +
                   'onchange="$(this.parentNode.parentNode).attr(\'data-edited\',\'1\');changeSubjectType(' + i + ', \'' + platforms[platform][j].meta + '\');">';
      li += '<label for="platform[' + subjects[i].id + ']">' + platforms[platform][j].name + '</label>';
    }
    li += '</td><td>';
    li += '<a class="chiiBtn thickbox" href="#TB_inline?tb&height=500&width=500&inlineId=brrs-subject-details-' + subjects[i].id + '">编辑详细信息</a>';
    li += '<div id="brrs-subject-details-' + subjects[i].id + '" style="display:none;"></div>';
    li += '</td>';
    li += '</tr>';
    $('#brrs-subject-list').append(li);
  }

  //Re-init thickbox
  tb_init('a.thickbox');
});


window.saveTbSubject = function(i) {
  $('#brrs-subject-list tr[data-listid=' + i + ']').attr('data-edited', '1');
  subjects[i].infobox = $('#TB_window textarea[name=infobox]').val();
  subjects[i].summary = $('#TB_window textarea[name=summary]').val();
  tb_remove();
}

window.changeSubjectType = function(i, platform) {
  $('#subject_infobox').val(subjects[i].infobox);
  WikiTpl(platform);
  subjects[i].infobox = $('#subject_infobox').val();
  $('#brrs-subject-details-' + subjects[i].id + ' textarea[name="infobox"]').val($('#subject_infobox').val());
  $('#subject_infobox').val('');
  console.log(subjects);
}

//Save:

$("#brrs-save").click(function() {
  if(!confirm('这样就好了吗？')) return;
  editSummary = prompt('请输入编辑摘要', editSummary);
  saving = 0;
  editCount = 0;
  //Get platforms:
  $('#brrs-subject-list tr[data-edited=1]').each(function() {
    editCount++;
    chiiLib.ukagaka.presentSpeech('保存中...(' + saving + '/' + editCount + ')');
    var postData = {};
    postData.formhash = formhash;
    postData.platform = $(this).find('input:checked').val();
    postData.subject_title = $(this).find('input.renameSubject').val();
    postData.subject_infobox = subjects[$(this).attr('data-listid')].infobox;
    postData.subject_summary = subjects[$(this).attr('data-listid')].summary;
    postData.editSummary = editSummary;
    postData.submit = '提交修改';
    $.post('/subject/' + subjects[$(this).attr('data-listid')].id + '/new_revision', postData, function() {
      saving++;
      chiiLib.ukagaka.presentSpeech('保存中...(' + saving + '/' + editCount + ')');
      if(saving >= editCount) chiiLib.ukagaka.presentSpeech('保存完毕~☆');
    })
  });
});

