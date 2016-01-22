// ==UserScript==
// @name         bangumi tracking improvement
// @namespace    BTI.chaucerling.bangumi
// @version      0.2.4
// @description  tracking more than 50 subjects on bangumi index page
// @author       chaucerling
// @include      http://bangumi.tv/
// @include      https://bgm.tv/
// @include      http://bgm.tv/
// @include      http://chii.in/
// ==/UserScript==

/* jshint loopfunc:true */
/* jshint esversion:6 */

var $ = unsafeWindow.jQuery;
var index_ids = [];
var refresh = false;
var extra_progress_changed = false;
var extra_subjects = [];
var subjects_size = 0;
const LS_SCOPE = 'BTI.extra_subjects';

var cache_extra_subjects = function() {
  if (localStorage[LS_SCOPE] === undefined){
    return [];
  }
  return JSON.parse(localStorage[LS_SCOPE]);
};

var cache_extra_anime_subjects = function() {
  return cache_extra_subjects().filter(function(x) {
    return x.type === 2;
  });
};

var cache_extra_real_subjects = function() {
  return cache_extra_subjects().filter(function(x) {
    return x.type === 6;
  });
};

var cache_extra_book_subjects = function() {
  return cache_extra_subjects().filter(function(x) {
    return x.type === 1;
  });
};

function GM_addStyle(style) {
  $('head').append(`<style>${style}</style>`);
}

GM_addStyle(`
  #ti-alert {
    display:none;
    font-size: 14px;
    text-align: center;
    padding: 5px;
    background-color: #fcf8e3;
  }
  #ti-pages.categoryTab {
      padding: 5px;
  }
  #ti-pages.categoryTab a.focus {
      color: #FFF;
      background: #F09199;
  }
  #ti-pages.categoryTab a.refresh {
      color: #FFF;
      background: #4EB1D4;
  }
  #ti-pages.categoryTab a.refresh.disabled {
      cursor: not-allowed;
      opacity: 0.6
  }
  #ti-pages.categoryTab a {
      display: inline-block;
      box-sizing: border-box;
      min-width: 50px;
      padding: 3px 10px;
      color: #555;
      font-size: 13px;
      text-align: center;
      border-radius: 15px;
      background: #F0F0F0;
  }
`);

function Subject() {
  var info = arguments[0];
  this.id = info.id;
  this.title = info.title;
  this.progress = info.progress;
  this.prg_list_html = info.prg_list_html;
  this.prg_content_html = info.prg_content_html;
  this.thumb = info.thumb;
  this.extra = info.extra; //boolean
  this.type = info.type; // 1: book, 2: amine, 6: real
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
  $('.infoWrapper_tv > div').show();
  $('#ti-pages').hide();
}

function get_watching_list(){
  extra_subjects = []; subjects_size = 0;
  var animes_path = $("#navMenuNeue > li:nth-child(1) > ul > li > a.nav")[5].getAttribute('href');
  var reals_path = $("#navMenuNeue > li:nth-child(5) > ul > li > a.nav")[5].getAttribute('href');
  var books_path = $("#navMenuNeue > li:nth-child(2) > ul > li > a.nav")[4].getAttribute('href');
  var animes_size = 0, reals_size = 0, books_size = 0;
  var list = [], _temp_list;

  var page, max_page;
  for (page = 1, max_page = 2; page <= max_page; page++){
    $.ajax({
      method: "GET",
      url: animes_path + "?page=" + page,
      async: false,
      success: function(data, textStatus, jqXHR) {
        console.log(page);
        var html = remove_img_src(data);
        if (page === 1) {
          animes_size = parseInt($(html).find('.navSubTabs a.focus').text().match(/\d+/));
          max_page = parseInt(animes_size/24) + 1;
        }
        _temp_list = $(html).find('#browserItemList > li');
        list = $.merge(list, _temp_list);
      }
    });
    if (_temp_list.length < 0) break;
  }
  for (page = 1, max_page = 2; page <= max_page; page++){
    $.ajax({
      method: "GET",
      url: reals_path + "?page=" + page,
      async: false,
    }).success(function(data, textStatus, jqXHR) {
      console.log(page);
      var html = remove_img_src(data);
      if (page === 1) {
        reals_size = parseInt($(html).find('.navSubTabs a.focus').text().match(/\d+/));
        max_page = parseInt(reals_size/24) + 1;
      }
      _temp_list = $(html).find('#browserItemList > li');
      list = $.merge(list, _temp_list);
    });
    if (_temp_list.length < 24) break;
  }
  for (page = 1, max_page = 2; page <= max_page; page++){
    $.ajax({
      method: "GET",
      url: books_path + "?page=" + page,
      async: false,
    }).success(function(data, textStatus, jqXHR) {
      console.log(page);
      var html = remove_img_src(data);
      if (page === 1) {
        books_size = parseInt($(html).find('.navSubTabs a.focus').text().match(/\d+/));
        max_page = parseInt(books_size/24) + 1;
      }
      _temp_list = $(html).find('#browserItemList > li');
      list = $.merge(list, _temp_list);
    });
    if (_temp_list.length < 24) break;
  }
  // console.log(list);

  subjects_size = animes_size + reals_size + books_size;
  if (animes_size + reals_size > 50 || books_size > 50) {
    $('#ti-alert').text(`Watching ${animes_size} animes, ${reals_size} reals and ${books_size} books, loading extra subjects' progress.(click to close)`);
    change_dispaly();
    $.each(list, function (index, element) {
      var type = index < animes_size ? 2 : ((index < animes_size + reals_size) ? 6 : 1);
      get_subject_progress($(element).attr('id').split("_")[1], type);
    });
  } else {
    recover_dispaly();
    $('#ti-alert').show();
    $('#ti-alert').text(`Watching ${animes_size} animes, ${reals_size} reals and ${books_size} books.(click to close)`);
  }
}

function get_subject_progress(subject_id, type){
  if (index_ids.includes(subject_id)) {
    check_get_all_subjects_finished();
    return;
  }

  $.get('/subject/' + subject_id, function(data){
      var prg_list_html, prg_content_html;
      var html = remove_img_src(data);
      var progress = $(html).find('#watchedeps').text().split("/")[0];
      var title = $(html).find('.nameSingle > a').text();
      if (type !== 1){
        prg_list_html = $(html).find('.prg_list').addClass("clearit").html();
        prg_content_html = $(html).find('#subject_prg_content').html();
      } else {
        prg_list_html = $(html).find('.prgText').map(function(index, element){
          $(element).append('<a href="javascript:void(0)" class="input_plus plus">+</a>');
          return element.outerHTML;
        }).toArray().join('\n');
        prg_content_html = null;
      }
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
  if (typeof this.counter === "undefined") this.counter= 0;
  this.counter++;
  if (this.counter < subjects_size){
    return false;
  }

  this.counter = 0;
  console.log(extra_subjects);
  localStorage[LS_SCOPE] = JSON.stringify(extra_subjects);
  add_extra_subjects(extra_subjects);
}

function add_extra_subjects(extra_subjects){
  for(var i in extra_subjects){
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

  // chiiLib.home.init();
  // chiiLib.home.prg();
  // chiiLib.home.prgToolTip('#columnHomeA', 25);
  tb_init('a.thickbox, area.thickbox, input.thickbox');

  $('#subject_prg_content a.ep_status').off('click').on('click', function() {
    chiiLib.home.epStatusClick(this);
    return false;
  });

  $('form.prgBatchManagerForm').off('submit').on('submit', function() {
    chiiLib.home.prgBatchManager($(this));
    return false;
  });

  $('a.input_plus').off('click').on('click', function() {
    var input = $(this).closest('div.prgText').find('input'),
      count = parseInt(input.val()),
      input_id = input.attr('id'),
      subject_id = input.attr(input_id),
      form = $(this).closest('form.prgBatchManagerForm');
    $(`input[${input_id}$=${subject_id}]`).val(count + 1);
    form.submit();
  });

  if (refresh === true) {
    $('#ti-pages a.refresh').removeClass('disabled');
    $('#ti-pages a.refresh').html('refresh');
  }

  show_subjects($('#prgCatrgoryFilter a.focus').attr('subject_type'), $('#ti-pages a.focus').data('page') === 'extra');
  $('#ti-alert').show();
  $('#ti-alert').text($('#ti-alert').text().replace(/load.+/, "loading finished.(click to close)"));
}

function create_subject_cell(subject){
  if (subject.type !== 1){
    $('.infoWrapper_tv').append(`
      <div id='subjectPanel_${subject.id}' subject_type='${subject.type}' class='extra clearit infoWrapper tinyMode' style='display:none;'>
        <a href='/subject/${subject.id}' title='${subject.title}' class='grid tinyCover ll'>
          <img src='${subject.thumb}' class='grid'>
        </a>
        <div class='epGird'>
          <div class='tinyHeader'>
            <a href='/subject/${subject.id}' title='${subject.title}'>${subject.title}</a>
            <small class='progress_percent_text'>
              <a href='/update/${subject.id}?keepThis=false&TB_iframe=true&height=350&width=500'
                title='修改 ${subject.title} ' class='thickbox l' id='sbj_prg_${subject.id}'>edit</a>
            </small>
          </div>
          <ul class='prg_list clearit'>${subject.prg_list_html}</ul>
        </div>
      </div>
    `);
    $('#subject_prg_content').append(subject.prg_content_html);
  } else {
    $('.infoWrapper_book').append(`
      <div id='subjectPanel_${subject.id}' subject_type='${subject.type}' class='extra clearit infoWrapper tinyMode' style='display:none;'>
        <a href='/subject/${subject.id}' title='${subject.title}' class='grid tinyCover ll'>
          <img src='${subject.thumb}' class='grid'>
        </a>
        <div class='epGird'>
          <div class='tinyHeader'>
            <a href='/subject/${subject.id}' title='${subject.title}'>${subject.title}</a>
            <small class='progress_percent_text'>
              <a href='/update/${subject.id}?keepThis=false&TB_iframe=true&height=350&width=500'
                title='修改 ${subject.title} ' class='thickbox l' id='sbj_prg_${subject.id}'>edit</a>
            </small>
          </div>
          <div class="tinyManager">
            <form method="post" name="batch" class="prgBatchManagerForm" action="/subject/set/watched/${subject.id}">
              <input type="hidden" name="home" value="subject">
              <div class="btnSubmit rr"><input class="btn" type="submit" name="submit" value="更新"></div>
              ${subject.prg_list_html}
            </form>
          </div>
          <ul class="prg_list clearit"></ul>
        </div>
      </div>
    `);
  }
}

function show_subjects(subject_type, extra){
  console.log(subject_type, extra);
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
      if (extra){
        $('.infoWrapper_book > div').hide();
        $('.infoWrapper_book > div[subject_type="1"].extra').show();
      } else {
        $('.infoWrapper_book > div').hide();
        $('.infoWrapper_book > div[subject_type="1"]').show();
        $('.infoWrapper_book > div[subject_type="1"].extra').hide();
      }
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
      break;
    default:
      break;
  }
  reset_odd_even();
}

function reset_odd_even(){
  $.each($('.infoWrapper_tv > div:visible, .infoWrapper_book > div:visible'), function(index, item) {
    $(item).removeClass("even odd");
    $(item).addClass((index % 2) ? "even" : "odd");
  });
}

// 上限50是动画和三次元加起来的，这里返回的会包含三次元的条目
function all_ids_on_index(){
  return $('.infoWrapper_tv > div, .infoWrapper_book > div').map(function(index, element) {
    return $(element).attr('id').split("_")[1];
  }).toArray();
}

function tv_subjects_size_on_index(){
  return $('.infoWrapper_tv > div').length;
}

function anime_subjects_size_on_index(){
  return $('.infoWrapper_tv > div[subject_type="2"]').length;
}

function real_subjects_size_on_index(){
  return $('.infoWrapper_tv > div[subject_type="6"]').length;
}

function book_subjects_size_on_index(){
  return $('.infoWrapper_book > div').length;
}

// init
$(document).ready(function(){
  if (location.pathname !== "/") return;
  $("#cloumnSubjectInfo").prepend("<div id='ti-alert'/>");
  $('#cloumnSubjectInfo').prepend(`<div id='ti-pages' class='categoryTab' style='display:none;'>
    <a type='button' data-page='50' class='focus' href='javascript:void(0);'><span>50</span></a>
    <a type='button' data-page='extra' href='javascript:void(0);'><span>extra</span></a>
    <a type='button' data-page='refresh' class='refresh' href='javascript:void(0);'><span>refresh</span></a>
  </div>`);

  var size1 = anime_subjects_size_on_index();
  var size2 = real_subjects_size_on_index();
  var size3 = book_subjects_size_on_index();
  if (size1 + size2 <= 49 && size3 <= 49){
    $('#ti-alert').show();
    $('#ti-alert').text(`Watching ${size1} animes, ${size2} reals, ${size3} books.(click to close)`);
    localStorage.removeItem(LS_SCOPE);
    return;
  }

  if (cache_extra_subjects().length > 0){
    $('#ti-alert').show();
    $('#ti-alert').text(`Maybe watching ${size1 + cache_extra_anime_subjects().length} animes,
      ${size2 + cache_extra_real_subjects().length} reals, ${size3 + cache_extra_book_subjects().length} books,
      load form localStorage.(click to close)
    `);
    change_dispaly();
    add_extra_subjects(cache_extra_subjects());
  } else {
    $('#ti-alert').show();
    $('#ti-alert').text(`Maybe watching more than 50 animes and reals, ${size3} books, loading to comfirm.(click to close)`);

    index_ids = all_ids_on_index();
    console.log(index_ids);
    setTimeout(function () {
      get_watching_list();
    }, 10);
  }
});

// bind events
$(document).on('click', '#ti-alert', function(e){
  $('#ti-alert').hide();
});

$(document).on('click', 'a.disabled', function(e){
  e.preventDefault();
});

$(document).on('click', '#ti-pages a', function(e){
  if ($(this).data('page') !== 'refresh'){
    $('#ti-pages a').removeClass('focus');
    $(this).addClass('focus');
    show_subjects($('#prgCatrgoryFilter a.focus').attr('subject_type'), $(this).data('page') === 'extra');
  } else {
    $(this).addClass('disabled');
    $(this).html('refreshing');

    localStorage.removeItem(LS_SCOPE);
    $('.infoWrapper_tv > div.extra, .infoWrapper_book > div.extra').remove();

    refresh = true;
    index_ids = all_ids_on_index();
    setTimeout(function () {
      get_watching_list();
    }, 10);
  }
});

$('#prgCatrgoryFilter a').on('click', function(e){
  show_subjects($(this).attr('subject_type'), $('#ti-pages a.focus').data('page') === 'extra');
});

// restore extra subjects' progress
$(window).on('pagehide', function(e){
  var subjects = cache_extra_subjects();
  if (subjects.length <= 0 || extra_progress_changed === false) return;

  for (var i in subjects){
    if (subjects[i].type !== 1){
      subjects[i].prg_list_html = $(`#subjectPanel_${subjects[i].id} .prg_list`).html();
    } else {
      subjects[i].prg_list_html = $(`#subjectPanel_${subjects[i].id} .prgText`).map(function(index, element){
        $(element).find('input').map(function(index1, element2){
          $(element2).attr('value', element2.value);
        });
        return element.outerHTML;
      }).toArray().join('\n');
    }
  }
  localStorage[LS_SCOPE] = JSON.stringify(subjects);
  console.log('restore');
});

$(document).on('ajaxSuccess', function(event, xhr, options){
  var link = document.createElement("a");
  link.href = options.url;
  var tv_match = link.pathname.match(/^\/subject\/ep\/(\d+)\/status/);
  var book_match = link.pathname.match(/^\/subject\/set\/watched\/\d+/);
  if ((tv_match !== null && !index_ids.includes(tv_match[1])) || (book_match !== null && !index_ids.includes(book_match[1]))) {
    extra_progress_changed = true;
  }
});
