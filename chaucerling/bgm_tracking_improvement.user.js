// ==UserScript==
// @name         bangumi tracking improvement
// @namespace    BTI.chaucerling.bangumi
// @version      0.3.4
// @description  tracking more than 50 subjects on bangumi index page
// @author       chaucerling
// @include      http://bangumi.tv/
// @include      https://bgm.tv/
// @include      http://bgm.tv/
// @include      http://chii.in/
// @grant        none
// ==/UserScript==

/* jshint loopfunc:true */
/* jshint esversion:6 */

// var $ = unsafeWindow.jQuery; // use to access 'chiiLib.home' and '$.cluetip'
var origin_tv_queue = []; // max size 50
var origin_book_queue = []; // max size 50
var extra_tv_queue = [];
var extra_book_queue = [];
var watching_subjects = {};
var extra_watching_subjects = {};
var animes_size = 0,
  reals_size = 0,
  books_size = 0;

var watching_list = [];
var refresh = false;
var progress_changed = false;
var subjects_size = 0;
const LS_SCOPE = 'BTI.extra_subjects';

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
  #ti-pages.categoryTab a.refresh-btn, #ti-pages.categoryTab a.clear-btn {
      color: #FFF;
      background: #4EB1D4;
  }
  #ti-pages.categoryTab a.refresh-btn.disabled, #ti-pages.categoryTab a.clear-btn.disabled {
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

function remove_img_src(str) {
  return str.replace(/<img src=\S+/ig, "<img src=''");
}

function get_display_subject_type() {
  return $("#prgCatrgoryFilter > li > a.focus").atrr('subject_type');
}

function change_mode() {
  $('#switchNormalManager').removeClass();
  $('#switchNormalManager').hide();
  $('#switchTinyManager').addClass('active');

  $('.cloumnSubjects').hide();
  $('#cloumnSubjectInfo .infoWrapper').removeClass('blockMode', 'info_hidden').addClass('tinyMode');
  $('#cloumnSubjectInfo').css('width', '100%');
  $('#prgManagerMain').css('height', 'auto').removeClass('blockModeWrapper').addClass('tinyModeWrapper');
  $.cookie('prg_display_mode', 'tiny', {
    expires: 2592000
  });

  $('#ti-pages').show();
}

function recover_mode() {
  // $('#prgCatrgoryFilter a').show();
  $('#switchNormalManager').show();
  $('.infoWrapper_tv > div').show();
  $('#ti-pages').hide();
}

function get_path_and_size_of_all_type() {
  animes_size = -1;
  reals_size = -1;
  books_size = -1;
  return [{
      value: 2,
      path: $("#navMenuNeue > li:nth-child(1) > ul > li > a.nav")[5].getAttribute('href'),
      size: function() {
        return animes_size;
      },
      set_size: function(value) {
        animes_size = value;
      }
    },
    {
      value: 6,
      path: $("#navMenuNeue > li:nth-child(5) > ul > li > a.nav")[5].getAttribute('href'),
      size: function() {
        return reals_size;
      },
      set_size: function(value) {
        reals_size = value;
      }
    },
    {
      value: 1,
      path: $("#navMenuNeue > li:nth-child(2) > ul > li > a.nav")[4].getAttribute('href'),
      size: function() {
        return books_size;
      },
      set_size: function(value) {
        books_size = value;
      }
    }
  ];
}

function in_origin_queue(subject_id){
  return origin_tv_queue.indexOf(subject_id) >= 0 || origin_book_queue.indexOf(subject_id)
}

// 解析在看第一页的数据，获取在看数目和条目html
function get_watching_list() {
  watching_list = [];
  subjects_size = 0;
  watching_subjects = {};
  extra_tv_queue = [];
  extra_book_queue = [];
  console.log('getting first page of all type');
  get_path_and_size_of_all_type().forEach(function(type, index, array) {
    $.get(type.path + "?page=1", function(data) {
      var html = remove_img_src(data);
      type.set_size(parseInt($(html).find('.navSubTabs a.focus').text().match(/\d+/) || 0));
      console.log(`subjects_list: ${type.value}, size: ${type.size()}`);
      var max_page = parseInt(type.size() / 24) + 1;
      var _temp_list = $(html).find('#browserItemList > li').attr('item_type', type.value);
      watching_list = $.merge(watching_list, _temp_list);
      for (var i = 2; i <= max_page; i++) {
        parse_watching_page(type.path + "?page=" + i, type.value);
      }
    });
  });
}

function parse_watching_page(url, type) {
  $.get(url, function(data) {
    var html = remove_img_src(data);
    var _temp_list = $(html).find('#browserItemList > li').attr('item_type', type);
    watching_list = $.merge(watching_list, _temp_list);
    check_get_all_pages_finished();
  });
}

// 检查解析所有类型的在看条目列表页是否已完成
function check_get_all_pages_finished() {
  if (typeof this.counter1 === "undefined") this.counter1 = 0;
  this.counter1++;
  if (animes_size === -1 || reals_size === -1 || books_size === -1 ||
    this.counter1 < parseInt(animes_size / 24) + parseInt(reals_size / 24) + parseInt(books_size / 24)) {
    console.log(`current_processing_watching_list_size: ${watching_list.length}`);
    return false;
  }

  this.counter1 = 0;
  subjects_size = watching_list.length;
  console.log('gettting all pages finished');
  console.log(`watching_list_size: ${watching_list.length}`);
  if (animes_size + reals_size > 50 || books_size > 50) {
    $('#ti-alert').show();
    $('#ti-alert').text(`Watching ${animes_size} animes, ${reals_size} reals and ${books_size} books, loading extra subjects' progress.(click to close)`);
    change_mode();
    $.each(watching_list, function(index, element) {
      get_subject_progress($(element).attr('id').split("_")[1], parseInt($(element).attr('item_type')));
    });
  } else {
    recover_mode();
    $('#ti-alert').show();
    $('#ti-alert').text(`Watching ${animes_size} animes, ${reals_size} reals and ${books_size} books.(click to close)`);
  }
}

function get_subject_progress(subject_id, type) {
  // 在50列表里，不用去详情页抓取进度
  if (in_origin_queue(subject_id) >= 0) {
    // 解析首页html
    var prg_list_html, prg_content_html;
    var html = $(`#subjectPanel_${subject_id}`);
    var title = $(html).find('.tinyCover').attr('title');
    if (type !== 1) {
      prg_list_html = $(html).find('.prg_list').html();
      prg_content_html = null;
    } else {
      prg_list_html = $(html).find('.epGird .prgText').map(function(index, element) {
        return element.outerHTML;
      }).toArray().join('\n');
      prg_content_html = null;
    }
    var thumb = ($(html).find('.tinyCover .grid').attr('src') || '');
    var subject = new Subject({
      id: subject_id,
      title: title,
      prg_list_html: prg_list_html,
      prg_content_html: prg_content_html,
      thumb: thumb,
      type: type,
      extra: false
    });
    watching_subjects[subject_id] = subject;
    check_get_all_extra_subjects_finished();
    return;
  }

  if (type === 1) {
    extra_book_queue.push(subject_id);
  } else {
    extra_tv_queue.push(subject_id);
  }
  $.get('/subject/' + subject_id, function(data) {
    var prg_list_html, prg_content_html;
    var html = remove_img_src(data);
    var progress = $(html).find('#watchedeps').text().split("/")[0];
    var title = $(html).find('.nameSingle > a').text();
    if (type !== 1) {
      prg_list_html = $(html).find('.prg_list').addClass("clearit").html() || '';
      prg_content_html = $(html).find('#subject_prg_content').html() || '';
    } else {
      prg_list_html = $(html).find('.prgText').map(function(index, element) {
        $(element).append('<a href="javascript:void(0)" class="input_plus plus">+</a>');
        return element.outerHTML;
      }).toArray().join('\n');
      prg_content_html = null;
    }
    var thumb = ($(html).find('a.thickbox.cover').attr('href') || '').replace('/l/', '/g/');
    var subject = new Subject({
      id: subject_id,
      title: title,
      progress: progress,
      prg_list_html: prg_list_html,
      prg_content_html: prg_content_html,
      thumb: thumb,
      type: type,
      extra: true
    });
    watching_subjects[subject_id] = subject;
    check_get_all_extra_subjects_finished();
  });
}

// 检查解析所有类型的额外的在看条目详情页是否已完成
function check_get_all_extra_subjects_finished() {
  if (typeof this.counter2 === "undefined") this.counter2 = 0;
  this.counter2++;
  if (this.counter2 < subjects_size) {
    return false;
  }

  this.counter2 = 0;
  add_extra_subjects();
  localStorage[LS_SCOPE] = JSON.stringify({
    watching_subjects: watching_subjects,
    extra_book_queue: extra_book_queue,
    extra_tv_queue: extra_tv_queue,
    animes_size: animes_size,
    reals_size: reals_size,
    books_size: books_size
  });
}

function add_extra_subjects() {
  for (var i = 0; i < extra_book_queue.length; i++) {
    create_subject_cell(extra_book_queue[i]);
  }
  for (var j = 0; j < extra_tv_queue.length; j++) {
    create_subject_cell(extra_tv_queue[j]);
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

  $('.prgBatchManagerForm a.input_plus').off('click').on('click', function(e) {
    var input = $(this).closest('div.prgText').find('input'),
      count = parseInt(input.val()),
      form = $(this).closest('form.prgBatchManagerForm');
    $(input).val(count + 1);
    form.submit();
  });

  $('#ti-alert').show();
  $('#ti-alert').text($('#ti-alert').text().replace(/load.+/, "loading finished.(click to close)"));
  show_subjects($('#prgCatrgoryFilter a.focus').attr('subject_type'), $('#ti-pages a.focus').data('page') === 'extra');

  if (refresh === true) {
    $('#ti-pages a.refresh-btn').removeClass('disabled');
    $('#ti-pages a.refresh-btn').html('refresh');
    refresh = false;
  }
}

// 构造首页条目格子
function create_subject_cell(subject_id) {
  var subject = watching_subjects[subject_id];
  if (subject.type !== 1) {
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

function show_subjects(subject_type, extra) {
  console.log(`change_tab, subject_type: ${subject_type}, extra: ${extra}`);
  switch (subject_type) {
    case "0": //all
      $('.infoWrapper_tv').show();
      $('.infoWrapper_book').hide();
      if (extra) {
        $('.infoWrapper_tv > div').hide();
        $('.infoWrapper_tv > div.extra').show();
      } else {
        $('.infoWrapper_tv > div').show();
        $('.infoWrapper_tv > div.extra').hide();
      }
      break;
    case "1": //book
      $('.infoWrapper_tv').hide();
      $('.infoWrapper_book').show();
      if (extra) {
        $('.infoWrapper_book > div').hide();
        $('.infoWrapper_book > div[subject_type="1"].extra').show();
      } else {
        $('.infoWrapper_book > div').hide();
        $('.infoWrapper_book > div[subject_type="1"]').show();
        $('.infoWrapper_book > div[subject_type="1"].extra').hide();
      }
      break;
    case "2": //anime
      $('.infoWrapper_tv').show();
      $('.infoWrapper_book').hide();
      if (extra) {
        $('.infoWrapper_tv > div').hide();
        $('.infoWrapper_tv > div[subject_type="2"].extra').show();
      } else {
        $('.infoWrapper_tv > div').hide();
        $('.infoWrapper_tv > div[subject_type="2"]').show();
        $('.infoWrapper_tv > div[subject_type="2"].extra').hide();
      }
      break;
    case "6": //real
      $('.infoWrapper_tv').show();
      $('.infoWrapper_book').hide();
      if (extra) {
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

function reset_odd_even() {
  $.each($('.infoWrapper_tv > div:visible, .infoWrapper_book > div:visible'), function(index, item) {
    $(item).removeClass("even odd");
    $(item).addClass((index % 2) ? "even" : "odd");
  });
}

// 上限50是动画和三次元加起来的，这里返回的会包含三次元的条目
function all_ids_on_index() {
  return $('.infoWrapper_tv > div, .infoWrapper_book > div').map(function(index, element) {
    return $(element).attr('id').split("_")[1];
  }).toArray();
}

function tv_subject_ids_on_index() {
  return $('.infoWrapper_tv > div').map(function(index, element) {
    return $(element).attr('id').split("_")[1];
  }).toArray();
}

function book_subject_ids_on_index() {
  return $('.infoWrapper_book > div').map(function(index, element) {
    return $(element).attr('id').split("_")[1];
  }).toArray();
}

function tv_subjects_size_on_index() {
  return $('.infoWrapper_tv > div').length;
}

function anime_subjects_size_on_index() {
  return $('.infoWrapper_tv > div[subject_type="2"]').length;
}

function real_subjects_size_on_index() {
  return $('.infoWrapper_tv > div[subject_type="6"]').length;
}

function book_subjects_size_on_index() {
  return $('.infoWrapper_book > div').length;
}

// init
$(document).ready(function() {
  if (location.pathname !== "/") return;
  $("#cloumnSubjectInfo").prepend("<div id='ti-alert'/>");
  $('#cloumnSubjectInfo').prepend(`<div id='ti-pages' class='categoryTab' style='display:none;'>
    <a type='button' data-page='50' class='focus tab-btn' href='javascript:void(0);'><span>50</span></a>
    <a type='button' data-page='extra' class='tab-btn' href='javascript:void(0);'><span>extra</span></a>
    <a type='button' data-page='refresh' class='refresh-btn' href='javascript:void(0);'><span>refresh</span></a>
  </div>`);

  var size1 = anime_subjects_size_on_index();
  var size2 = real_subjects_size_on_index();
  var size3 = book_subjects_size_on_index();
  if (size1 + size2 <= 49 && size3 <= 49) {
    $('#ti-alert').show();
    $('#ti-alert').text(`Watching ${size1} animes, ${size2} reals, ${size3} books.(click to close)`);
    localStorage.removeItem(LS_SCOPE);
    return;
  }

  // 处理localStorage版本结构不匹配的问题
  if (localStorage[LS_SCOPE] !== undefined) {
    if (JSON.parse(localStorage[LS_SCOPE]).watching_subjects === undefined) {
      localStorage.removeItem(LS_SCOPE);
    }
  }

  if (localStorage[LS_SCOPE] !== undefined) {
    $('#ti-alert').show();
    var cache = JSON.parse(localStorage[LS_SCOPE]);
    watching_subjects = cache.watching_subjects;
    extra_book_queue = cache.extra_book_queue;
    extra_tv_queue = cache.extra_tv_queue;
    animes_size = cache.animes_size;
    reals_size = cache.reals_size;
    books_size = cache.books_size;
    origin_queue = all_ids_on_index();
    origin_tv_queue = tv_subject_ids_on_index();
    origin_book_queue = book_subject_ids_on_index();
    $('#ti-alert').text(`Maybe watching ${animes_size} animes, ${reals_size} reals, ${books_size} books, load form localStorage.(click to close)`);
    change_mode();
    add_extra_subjects();
  } else {
    $('#ti-alert').show();
    $('#ti-alert').text(`Maybe watching more than 50 animes and reals, ${size3} books, loading to comfirm.(click to close)`);

    // origin_queue = all_ids_on_index();
    // origin_tv_queue = tv_subject_ids_on_index();
    // origin_book_queue = book_subject_ids_on_index();
    console.log(origin_queue);
    setTimeout(function() {
      get_watching_list();
    }, 10);
  }
});

$(document).on('click', '#ti-alert', function(e) {
  $('#ti-alert').hide();
});

$(document).on('click', 'a.disabled', function(e) {
  e.preventDefault();
});

$(document).on('click', '#ti-pages a.tab-btn', function(e) {
  $('#ti-pages a').removeClass('focus');
  $(this).addClass('focus');
  show_subjects($('#prgCatrgoryFilter a.focus').attr('subject_type'), $(this).data('page') === 'extra');
});

$(document).on('click', '#ti-pages a.refresh-btn', function(e) {
  $(this).addClass('disabled');
  $(this).html('refreshing');

  localStorage.removeItem(LS_SCOPE);
  $('.infoWrapper_tv > div.extra, .infoWrapper_book > div.extra').remove();

  refresh = true;
  setTimeout(function() {
    get_watching_list();
  }, 10);
});

$(document).on('click', '#ti-pages a.clear-btn', function(e) {
  $(this).addClass('disabled');
  $(this).html('clearing');
  localStorage.removeItem(LS_SCOPE);
  $('.infoWrapper_tv > div.extra, .infoWrapper_book > div.extra').remove();
  $(this).removeClass('disabled');
  $(this).html('clear');
});

$('#prgCatrgoryFilter a').off('click').on('click', function(e) {
  $('#prgCatrgoryFilter a').removeClass('focus');
  $(this).addClass('focus');
  show_subjects($(this).attr('subject_type'), $('#ti-pages a.focus').data('page') === 'extra');
});

//restore extra subjects' progress
$(window).on('pagehide', function(e) {
  if (localStorage[LS_SCOPE] === undefined || progress_changed === true) return;

  localStorage[LS_SCOPE] = JSON.stringify({
    watching_subjects: watching_subjects,
    extra_book_queue: extra_book_queue,
    extra_tv_queue: extra_tv_queue,
    animes_size: animes_size,
    reals_size: reals_size,
    books_size: books_size
  });
  console.log('restore localStorage');
});

// 通过ajax请求事件，检查条目进度是否有变更
$(document).on('ajaxSuccess', function(event, xhr, options) {
  if (localStorage[LS_SCOPE] === undefined) return;

  var link = document.createElement("a");
  link.href = options.url;
  var tv_match = link.pathname.match(/^\/subject\/ep\/(\d+)\/status/);
  var book_match = link.pathname.match(/^\/subject\/set\/watched\/\d+/);
  if (tv_match !== null || book_match !== null) {
    var ep_id = (tv_match || [])[1] || (book_match || [])[1];
    var html = $(`#prg_${ep_id}`).parents('.infoWrapper');
    var subject_id = $(html).attr('id').split("_")[1];
    var type = parseInt($(html).attr('subject_type'));

    var subject = watching_subjects[subject_id];
    var index;
    // extra条目进度变更，需要处理队列
    if (in_origin_queue(subject_id) === -1) {
      console.log(`extra subject ${subject_id} progress change`);
      subject.extra = false;
      subject.prg_content_html = null;
      if (type === 1) {
        index = extra_book_queue.indexOf(subject_id);
        extra_book_queue.splice(index, 1);
        origin_book_queue.unshift(subject_id);
        origin_book_queue_last_subject_id = origin_book_queue.pop();
        extra_book_queue.push(origin_book_queue_last_subject_id);
        // 请求详情页，更新进度信息
        $.get('/subject/' + subject_id, function(data) {
          var prg_list_html, prg_content_html;
          var html = remove_img_src(data);
          var progress = $(html).find('#watchedeps').text().split("/")[0];
          var title = $(html).find('.nameSingle > a').text();
          if (type !== 1) {
            prg_list_html = $(html).find('.prg_list').addClass("clearit").html() || '';
            prg_content_html = $(html).find('#subject_prg_content').html() || '';
          } else {
            prg_list_html = $(html).find('.prgText').map(function(index, element) {
              $(element).append('<a href="javascript:void(0)" class="input_plus plus">+</a>');
              return element.outerHTML;
            }).toArray().join('\n');
            prg_content_html = null;
          }
          var thumb = ($(html).find('a.thickbox.cover').attr('href') || '').replace('/l/', '/g/');
          watching_subjects[origin_book_queue_last_subject_id] = new Subject({
            id: subject_id,
            title: title,
            progress: progress,
            prg_list_html: prg_list_html,
            prg_content_html: prg_content_html,
            thumb: thumb,
            type: type,
            extra: true
          });
        });
      } else {
        index = extra_tv_queue.indexOf(subject_id);
        extra_tv_queue.splice(index, 1);
        origin_tv_queue.unshift(subject_id);
        origin_tv_queue_last_subject_id = origin_tv_queue.pop();
        extra_tv_queue.push(origin_tv_queue_last_subject_id);
        // 请求详情页，更新进度信息
        $.get('/subject/' + subject_id, function(data) {
          var prg_list_html, prg_content_html;
          var html = remove_img_src(data);
          var progress = $(html).find('#watchedeps').text().split("/")[0];
          var title = $(html).find('.nameSingle > a').text();
          if (type !== 1) {
            prg_list_html = $(html).find('.prg_list').addClass("clearit").html() || '';
            prg_content_html = $(html).find('#subject_prg_content').html() || '';
          } else {
            prg_list_html = $(html).find('.prgText').map(function(index, element) {
              $(element).append('<a href="javascript:void(0)" class="input_plus plus">+</a>');
              return element.outerHTML;
            }).toArray().join('\n');
            prg_content_html = null;
          }
          var thumb = ($(html).find('a.thickbox.cover').attr('href') || '').replace('/l/', '/g/');
          watching_subjects[origin_tv_queue_last_subject_id] = new Subject({
            id: subject_id,
            title: title,
            progress: progress,
            prg_list_html: prg_list_html,
            prg_content_html: prg_content_html,
            thumb: thumb,
            type: type,
            extra: true
          });
        });
      }
      progress_changed = true;
    }
  }
});

// TODO extra更新后，refresh，条目对不上
