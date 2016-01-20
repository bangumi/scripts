// ==UserScript==
// @name         bangumi tracking improvement
// @namespace    BTI.chaucerling.bangumi
// @version      0.2.0
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

var cache_extra_subjects = function() {
  if (localStorage['extra_subjects'] === undefined){
    return [];
  }

  return JSON.parse(localStorage['extra_subjects']);
}

var cache_extra_animes_subjects = function() {
  return cache_extra_subjects().filter(function(x) {
  	return x.type === 2
  })
}

var cache_extra_reals_subjects = function() {
  return cache_extra_subjects().filter(function(x) {
  	return x.type === 6
  })
}

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
  this.extra = info.extra; //boolean
	this.type = info.type; // 2: amine, 6: real
}

function remove_img_src(str){
  return str.replace(/<img src=\S+/ig, "<img src=''");
}

function get_display_subject_type() {
  return $("#prgCatrgoryFilter > li > a.focus").atrr('subject_type');
}

function change_dispaly(){
  // $('#prgCatrgoryFilter a[subject_type="0"],a[subject_type="6"]').hide();
  // $('#prgCatrgoryFilter a').removeClass('focus');
  // $('#prgCatrgoryFilter a[subject_type="2"]').addClass('focus');

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
  // $('#prgCatrgoryFilter a').show();
  $('#switchNormalManager').show();
  $('.infoWrapper_tv div.infoWrapper').show();
  $('#ti-pages').hide();
}

function get_watching_animes_and_reals(){
  var anime_list_path = location.protocol+'//'+location.hostname + $("#navMenuNeue > li:nth-child(1) > ul > li > a.nav")[5].getAttribute('href');
	var real_list_path = location.protocol+'//'+location.hostname + $("#navMenuNeue > li:nth-child(5) > ul > li > a.nav")[5].getAttribute('href');
  var wathcing_anime_list = [];
	var wathcing_real_list = [];
  var page = 1;
	var temp_page_list;
  extra_subjects = [];

  for (page = 1;page < 5;page++){
    $.ajax({
      method: "GET",
      url: anime_list_path + "?page=" + page,
      async: false,
    }).success(function(data, textStatus, jqXHR) {
      console.log(page);
      var html = remove_img_src(data);
			temp_page_list = $(html).find('#browserItemList > li');
      wathcing_anime_list = $.merge(wathcing_anime_list, temp_page_list);
    });
    if (temp_page_list.length === 0) break;
  }
	for (page = 1;page < 5;page++){
    $.ajax({
      method: "GET",
      url: real_list_path + "?page=" + page,
      async: false,
    }).success(function(data, textStatus, jqXHR) {
      console.log(page);
      var html = remove_img_src(data);
			temp_page_list = $(html).find('#browserItemList > li');
      wathcing_real_list = $.merge(wathcing_real_list, temp_page_list);
    });
    if (temp_page_list.length < 24) break;
  }

  subjects_size = wathcing_anime_list.length + wathcing_real_list.length
  if (wathcing_anime_list.length + wathcing_real_list.length > 50) {
    $('#ti-alert').text("Watching "+wathcing_anime_list.length+" animes and "+wathcing_real_list.length+" reals, \
			loading extra subjects' progress (click to close).");
    change_dispaly();
    $.each(wathcing_anime_list.concat(wathcing_real_list), function (index, value) {
      get_subject_progress($(value).attr('id').split("_")[1], (index - wathcing_anime_list.length < 0) ? 2 : 6);
    })
  } else {
    recover_dispaly();
    $('#ti-alert').show();
    $('#ti-alert').text("Watching "+wathcing_anime_list.length+" animes and "+wathcing_real_list.length+" reals (click to close).");
  }
}

function get_subject_progress(subject_id, type){
  if (index_ids.includes(subject_id)) {
    check_get_all_subjects_finished();
    return;
  }

  $.get('/subject/' + subject_id, function(data){
      var html = remove_img_src(data);
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
                                 type: type,
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
	console.log(extra_subjects)
  localStorage['extra_subjects'] = JSON.stringify(extra_subjects);
  add_extra_subjects(extra_subjects);
}

function add_extra_subjects(extra_subjects){
  for(i in extra_subjects){
    create_subject_cell(extra_subjects[i]);
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
    return false;
  });

  if (refresh === true) {
    $('.infoWrapper_tv > div').hide();
    $('.infoWrapper_tv > div.extra').show();
    $('#ti-pages a').removeClass('focus');
    $('#ti-pages a[data-page="extra"]').addClass('focus');
    $('#ti-pages a.refresh').removeClass('disabled');
    $('#ti-pages a.refresh').html('refresh');
  }

	show_subjects($('#prgCatrgoryFilter a.focus').attr('subject_type'), $('#ti-pages a.focus').data('page') === 'extra');
}

function create_subject_cell(subject){
  var extra = subject.extra ? " extra" : "";
  $('.infoWrapper_tv').append("<div id='subjectPanel_"+subject.id+"' subject_type='"+subject.type+"' class='"+extra+" clearit infoWrapper tinyMode' \
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

function show_subjects(subject_type, extra){
	switch (subject_type) {
		case "0": //all
			if (extra){
				$('.infoWrapper_tv > div').hide();
				$('.infoWrapper_tv > div.extra').show();
			} else {
				$('.infoWrapper_tv > div').show();
				$('.infoWrapper_tv > div.extra').hide();
			}
			break;
    case "1": //book
      break;
    case "2": //anime
			if (extra){
				$('.infoWrapper_tv > div').hide();
				$('.infoWrapper_tv > div[subject_type="2"].extra').show();
			} else {
				$('.infoWrapper_tv > div').hide();
				$('.infoWrapper_tv > div[subject_type="2"]').show();
				$('.infoWrapper_tv > div[subject_type="2"].extra').hide();
			}
			break;
    case "6": //real
			if (extra){
				$('.infoWrapper_tv > div').hide();
				$('.infoWrapper_tv > div[subject_type="6"].extra').show();
			} else {
				$('.infoWrapper_tv > div').hide();
				$('.infoWrapper_tv > div[subject_type="6"]').show();
				$('.infoWrapper_tv > div[subject_type="6"].extra').hide();
			}
		default:
			break;
	}
	reset_odd_even();
}

function reset_odd_even(){
	$.each($('.infoWrapper_tv > div:visible'), function(index, item) {
		$(item).removeClass("even odd");
		$(item).addClass((index % 2) ? "even" : "odd");
	})
}

// 上限50是动画和三次元加起来的，这里返回的会包含三次元的条目
function get_watching_animes_and_reals_on_index(){
  return $('.infoWrapper_tv > div');
}

function get_watching_reals_on_index(){
  return $('.infoWrapper_tv > div[subject_type="6"]');
}

function get_watching_animes_on_index(){
  return $('.infoWrapper_tv > div[subject_type="2"]');
}

// init
$(document).ready(function(){
	if (location.pathname !== "/") return;

  $("#cloumnSubjectInfo").prepend("<div id='ti-alert'\
  style='font-size: 14px;text-align: center;padding: 5px;background-color: #fcf8e3;display:none;'>\
  </div>");
  $('#cloumnSubjectInfo').prepend("<div id='ti-pages' class='categoryTab' style='display:none;'>\
    <a type='button' data-page='50' class='focus' href='javascript:void(0);'><span>50</span></a>\
    <a type='button' data-page='extra' href='javascript:void(0);'><span>extra</span></a>\
    <a type='button' data-page='refresh' class='refresh' href='javascript:void(0);'><span>refresh</span></a>\
    </div>");

	var ary1 = get_watching_animes_on_index();
  var ary2 = get_watching_reals_on_index();
  if (ary1.length + ary2.length <= 49){
    $('#ti-alert').show();
    $('#ti-alert').text("Watching "+ary1.length+" animes, "+ary2.length+" reals (click to close).");
    localStorage.removeItem('extra_subjects');
    return;
  }

  if (cache_extra_subjects().length > 0){
    $('#ti-alert').show();
    $('#ti-alert').text("Maybe watching "+(ary1.length+cache_extra_animes_subjects().length)+" animes, \
			"+(ary2.length+cache_extra_reals_subjects().length)+" reals, \
			load form localStorage. (click to close).");
    change_dispaly();
    add_extra_subjects(cache_extra_subjects());
  } else {
    index_ids = [];
    $.each($.merge(ary1,ary2), function (index, value) {
      index_ids.push($(value).attr('id').split("_")[1]);
    });
    console.log(index_ids);
    $('#ti-alert').show();
    $('#ti-alert').text("Maybe watching more than 50 animes and reals, loading to comfirm. (click to close).");
    setTimeout(function () {
      get_watching_animes_and_reals();
    }, 10);
  }
});

// bind events
$(document).on('click', '#ti-alert', function(e){
  $('#ti-alert').hide();
});

$(document).on('click', 'a.disabled', function(e){
  event.preventDefault();
})

$(document).on('click', '#ti-pages a', function(e){
  $('#ti-pages a').removeClass('focus');
  if ($(this).data('page') !== 'refresh'){
    $(this).addClass('focus');
		show_subjects($('#prgCatrgoryFilter a.focus').attr('subject_type'), $(this).data('page') === 'extra');
  } else {
    $(this).addClass('disabled');
    $(this).html('refreshing');
    localStorage.removeItem('extra_subjects');
    $('.infoWrapper_tv div.extra').remove();
    var ary = get_watching_animes_and_reals_on_index();
    index_ids = [];
    $.each(ary, function (index, value) {
      index_ids.push($(value).attr('id').split("_")[1]);
    });
    refresh = true
    setTimeout(function () {
      get_watching_animes_and_reals();
    }, 10);
  }
})

$('#prgCatrgoryFilter a').on('click', function(e){
	show_subjects($(this).attr('subject_type'), $('#ti-pages a.focus').data('page') === 'extra')
})

// restore extra subjects' progress
$(window).unload(function() {
	if (cache_extra_subjects().length <= 0) return;

	for (i in cache_extra_subjects()){
		cache_extra_subjects()[i].prg_list_html = $("#subjectPanel_" + cache_extra_subjects()[i].id + " .prg_list").html();
	}
	localStorage['extra_subjects'] = JSON.stringify(cache_extra_subjects());
})
