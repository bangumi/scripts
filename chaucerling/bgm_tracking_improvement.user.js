// ==UserScript==
// @name         bangumi tracking improvement
// @namespace    BTI.chaucerling.bangumi
// @version      0.1.2
// @description  tracking more than 50 subjects on bangumi index page
// @author       chaucerling
// @include      http://bangumi.tv/
// @include      https://bgm.tv/
// @include      http://bgm.tv/
// @include      http://chii.in/
// @grant        unsafeWindow
// ==/UserScript==

var $ = unsafeWindow.jQuery;
var index_ids = [];
var refresh = false;
var extra_subjects = [];
var subjects_size = 0;

var cache_extra_subjects = (function() {
  if (localStorage['extra_watching_animes'] === undefined){
    return [];
  }

  return JSON.parse(localStorage['extra_watching_animes']);
})();

$("body").prepend("<style>\
#ti-pages.categoryTab {\
    padding: 5px;\
}\
#ti-pages.categoryTab a.focus {\
    color: #FFF;\
    background: #F09199;\
}\
#ti-pages.categoryTab a.refresh {\
    color: #FFF;\
    background: #4EB1D4;;\
}\
#ti-pages.categoryTab a.refresh.disabled {\
    cursor: not-allowed;\
    opacity: 0.6\
}\
#ti-pages.categoryTab a {\
    display: inline-block;\
    box-sizing: border-box;\
    min-width: 50px;\
    padding: 3px 10px;\
    color: #555;\
    font-size: 13px;\
    text-align: center;\
    border-radius: 15px;\
    background: #F0F0F0;\
}\
</style>");

function Subject() {
  var info = arguments[0];
  this.id = info.id;
  this.title = info.title;
  this.progress = info.progress;
  this.prg_list_html = info.prg_list_html;
  this.prg_content_html = info.prg_content_html;
  this.thumb = info.thumb;
  this.order = info.order;
  this.extra = info.extra; //boolean
}

function remove_img_src(str){
  return str.replace(/<img src=\S+/ig, "<img src=''");
}

function get_display_subject_type() {
  return $("#prgCatrgoryFilter > li > a.focus").atrr('subject_type');
}

function change_dispaly(){
  $('#prgCatrgoryFilter a[subject_type="0"],a[subject_type="6"]').hide();
  $('#prgCatrgoryFilter a').removeClass('focus');
  $('#prgCatrgoryFilter a[subject_type="2"]').addClass('focus');

  $('#switchNormalManager').removeClass();
  $('#switchNormalManager').hide();
  $('#switchTinyManager').addClass('active');

  $('.cloumnSubjects').hide();
  $('#cloumnSubjectInfo .infoWrapper').removeClass('blockMode', 'info_hidden').addClass('tinyMode');
  $('#cloumnSubjectInfo').css('width', '100%');
  $('#prgManagerMain').css('height', 'auto').removeClass('blockModeWrapper').addClass('tinyModeWrapper');
  $.cookie('prg_display_mode', 'tiny', {expires: 2592000});

  $('#ti-pages').show();
}

function recover_dispaly(){
  $('#prgCatrgoryFilter a').show();
  $('#switchNormalManager').show();
  $('.infoWrapper_tv div.infoWrapper').show();
  $('#ti-pages').hide();
}

// function get_all_display_subjects(subject_type) {
//   switch(subject_type) {
//     case "0": //all
//       return 0;
//     case "1": //book
//       return 1;
//     case "2": //anime
//       return 2;
//     case "6": //real
//       return 6;
//     default:
//       return -1;
//   }
// }

function get_watching_animes(){
  // <a href="/anime/list/chaucerling/do" class="nav">在看</a>
  var path = location.protocol+'//'+location.hostname + $("#navMenuNeue > li > ul > li > a.nav")[5].getAttribute('href');
  var wathcing_list = [];
  var page = 1;
  extra_subjects = [];
  for (page = 1;page < 5; page++){
    $.ajax({
      method: "GET",
      accepts: "html",
      dataType: "html",
      url: path + "?page=" + page,
      async: false,
    }).success(function(data, textStatus, jqXHR) {
      console.log(page)
      var html = remove_img_src(data)
      wathcing_list = $.merge(wathcing_list, $(html).find('#browserItemList > li'))
    });
    if (wathcing_list.length !== 0 && wathcing_list.length % 24 !== 0){
      break;
    }
  }
  subjects_size = wathcing_list.length
  if (subjects_size > 50) {
    $('#ti-alert').text("Watching "+subjects_size+" animes, loading extra animes' progress (click to close).");
    change_dispaly();
    $.each(wathcing_list, function (index, value) {
      get_subject_progress($(value).attr('id').split("_")[1], parseInt(index));
    })
  } else {
    recover_dispaly();
    $('#ti-alert').show();
    $('#ti-alert').text("Watching "+subjects_size+" animes (click to close).");
  }
}

function get_subject_progress(subject_id, order){
  if (index_ids.includes(subject_id)) {
    check_get_all_subjects_finished();
    return;
  }

  $.get('/subject/' + subject_id, function(data){
      var html = data;
      var progress = $(html).find('#watchedeps').text().split("/")[0];
      var title = $(html).find('.nameSingle > a').text();
      var prg_list_html = $(html).find('.prg_list').addClass("clearit").html();
      var prg_content_html = $(html).find('#subject_prg_content').html();
      var thumb = $(html).find('a.thickbox.cover').attr('href').replace('/l/','/g/');
      var subject = new Subject({id: subject_id,
                                 title: title,
                                 progress: progress,
                                 prg_list_html: prg_list_html,
                                 prg_content_html: prg_content_html,
                                 thumb: thumb,
                                 order: order,
                                 extra: true});
      extra_subjects.push(subject);
      check_get_all_subjects_finished();
  });
}

function check_get_all_subjects_finished(){
  if(typeof this.counter === "undefined") this.counter= 0;
  this.counter++;
  if (this.counter < subjects_size){
    return false;
  }

  this.counter = 0;
  localStorage['extra_watching_animes'] = JSON.stringify(extra_subjects);
  add_extra_subjects(extra_subjects);
}

function add_extra_subjects(extra_subjects){
  for(i in extra_subjects){
    create_subject_cell(extra_subjects[i], (i % 2) ? "event" : "odd");
  }

  $('.infoWrapper_tv a.load-epinfo').cluetip({
    local: true,
    dropShadow: false,
    cursor: 'pointer',
    sticky: true,
    closePosition: 'title',
    arrows: true,
    closeText: 'X',
    mouseOutClose: true,
    positionBy: 'fixed',
    topOffset: 30,
    leftOffset: 0,
    cluezIndex: 79
  });

  $('#subject_prg_content a.ep_status').click(function() {
    chiiLib.home.epStatusClick(this);
		console.log('click');
    return false;
  });

  if (refresh === true) {
    $('.infoWrapper_tv div.infoWrapper').hide();
    $('.infoWrapper_tv div.infoWrapper.extra').show();
    $('#ti-pages a').removeClass('focus');
    $('#ti-pages a[data-page="extra"]').addClass('focus');
    $('#ti-pages a.refresh').removeClass('disabled');
    $('#ti-pages a.refresh').html('refresh');
  }
}

function create_subject_cell(subject, odd){
  var extra = subject.extra ? " extra" : "";
  $('.infoWrapper_tv').append("<div id='subjectPanel_"+subject.id+"' subject_type='2' class='"+odd+extra+" clearit infoWrapper tinyMode' \
    style='display:none;'>\
    <a href='/subject/"+subject.id+"' title='"+subject.title+"' class='grid tinyCover ll'>\
      <img src='"+subject.thumb+"' class='grid'>\
    </a>\
    <div class='epGird'>\
      <div class='tinyHeader'>\
        <a href='/subject/"+subject.id+"' title='"+subject.title+"'>"+subject.title+"</a>\
        <small class='progress_percent_text'><a href='/update/"+subject.id+"?keepThis=false&TB_iframe=true&height=350&width=500'\
          title='修改 "+subject.title+" ' class='thickbox l' id='sbj_prg_"+subject.id+"'>edit</a></small>\
      </div>\
      <ul class='prg_list clearit'>"+subject.prg_list_html+"</ul>\
    </div></div>"
  );
  $('#subject_prg_content').append(subject.prg_content_html);
}

function get_watching_animes_on_index(){
  // 上限50是动画和三次元加起来的， 这里返回的会包含三次元的条目
  return $('.infoWrapper_tv > div');
}

function get_watching_animes_and_reals_on_index(){
  return $('.infoWrapper_tv > div[subject_type="2"]');
}

// init
$(document).ready(function(){
  $("#cloumnSubjectInfo").prepend("<div id='ti-alert'\
  style='font-size: 14px;text-align: center;padding: 5px;background-color: #fcf8e3;display:none;'>\
  </div>");
  $('#cloumnSubjectInfo').prepend("<div id='ti-pages' class='categoryTab' style='display:none;'>\
    <a type='button' data-page='50' class='focus' href='javascript:void(0);'><span>50</span></a>\
    <a type='button' data-page='extra' href='javascript:void(0);'><span>extra</span></a>\
    <a type='button' data-page='refresh' class='refresh' href='javascript:void(0);'><span>refresh</span></a>\
    </div>");

  var ary = get_watching_animes_and_reals_on_index();
  var ary2 = get_watching_animes_on_index();
  if (ary.length <= 49){
    $('#ti-alert').show();
    $('#ti-alert').text("Watching "+(ary2.length)+" animes. (click to close).");
    localStorage.removeItem('extra_watching_animes');
    return;
  }

  if (cache_extra_subjects.length > 0){
    $('#ti-alert').show();
    $('#ti-alert').text("Maybe watching "+(ary2.length+cache_extra_subjects.length)+" animes, load form localStorage. (click to close).");
    change_dispaly();
    add_extra_subjects(cache_extra_subjects);
  } else {
    index_ids = [];
    $.each(ary, function (index, value) {
      index_ids.push($(value).attr('id').split("_")[1]);
    });
    console.log(index_ids);
    $('#ti-alert').show();
    $('#ti-alert').text("Maybe more than 50 watching animes, loading to comfirm. (click to close).");
    setTimeout(function () {
      get_watching_animes();
    }, 10);
  }
});

// bind events
$(document).on('click', '#ti-alert', function(e){
  $('#ti-alert').hide();
});

$('body').on('click', 'a.disabled', function(e){
  event.preventDefault()
})

$(document).on('click', '#ti-pages a', function(e){
  $('#ti-pages a').removeClass('focus');
  if ($(this).data('page') == '50'){
    $(this).addClass('focus');
    $('.infoWrapper_tv div.infoWrapper').show();
    $('.infoWrapper_tv div.infoWrapper.extra').hide();
  } else if ($(this).data('page') == 'extra') {
    $(this).addClass('focus');
    $('.infoWrapper_tv div.infoWrapper').hide();
    $('.infoWrapper_tv div.infoWrapper.extra').show();
  } else if ($(this).data('page') == 'refresh') {

    $(this).addClass('disabled');
    $(this).html('refreshing');
    localStorage.removeItem('extra_watching_animes');
    $('.infoWrapper_tv div.extra').remove();
    var ary = get_watching_animes_and_reals_on_index();
    index_ids = [];
    $.each(ary, function (index, value) {
      index_ids.push($(value).attr('id').split("_")[1]);
    });
    refresh = true
    setTimeout(function () {
      get_watching_animes();
    }, 10);
  }
})

// restore extra subjects' progress
$(window).unload(function() {
	if (cache_extra_subjects.length <= 0) return;
	for (i in cache_extra_subjects){
		cache_extra_subjects[i].prg_list_html = $("#subjectPanel_" + cache_extra_subjects[i].id + " .prg_list").html();
	}
	localStorage['extra_watching_animes'] = JSON.stringify(cache_extra_subjects);
})
