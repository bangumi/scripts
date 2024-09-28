// ==UserScript==
// @name         bangumi tracking improvement
// @namespace    BTI.chaucerling.bangumi
// @version      0.4.2.1
// @description  tracking more than 50 subjects on bangumi index page
// @author       chaucerling
// @include      /https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/$/
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
var auto_refresh = false; // 进入首页自动刷新extra项目进度

var watching_list = [];
var refresh = false;
var progress_changed = false;
var subjects_size = 0;
const LS_SCOPE = 'BTI.extra_subjects';

// const DB_SCOPE = 'BTI';
// const DB_VERSION = '1';
// indexedDB
// In the following line, you should include the prefixes of implementations you want to test.
// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// // DON'T use "var indexedDB = ..." if you're not in a function.
// // Moreover, you may need references to some window.IDB* objects:
// window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
// window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
// // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
// var db;
// var request = window.indexedDB.open(DB_SCOPE, DB_VERSION);
// request.onerror = function(event) {
//   console.log("access IndexedDB fail");
// };
// request.onsuccess = function(event) {
//   db = event.target.result;
// };
// request.onupgradeneeded = function(event){
//   db = event.target.result;
//   if(!db.objectStoreNames.contains("subjects")){
//     db.createObjectStore("subjects", {keyPath:"subject_id"});
//   }
// };
// var transaction = db.transaction("subjects", "readwrite");

function GM_addStyle(style) {
  $('head').append(`<style>${style}</style>`);
}

//#region [超合金组件]首页按星期分组/排序(https://bangumi.tv/dev/app/1083/gadget/851)
function sortElements(childs, compareFunction) {
  if (!childs.length) {
    return;
  }
  var parent = childs[0].parentNode;
  var sorting = [];
  for (var i = childs.length - 1; i >= 0; --i) {
    sorting.push(childs[i]);
    parent.removeChild(childs[i]);
  }
  sorting.sort(compareFunction);
  for (let child of sorting) {
    parent.appendChild(child);
  }
}

Number.prototype.zeroPad = function (length) {
  var s = (this || "0").toString();
  while (s.length < length) {
    s = "0" + s;
  }
  return s;
};

String.prototype.trim = function () {
  return this.replace(/^[ \t]+|[ \t]+$/g, "");
};

String.prototype.extractDate = function () {
  return (this.match(/(20\d\d-\d{1,2}-\d{1,2})/) || [])[1] || NaN;
};

String.prototype.getPrefix = function () {
  return ((this.match(/^([^(:]*)/) || [])[1] || "").trim();
};

function changeLayout() {
  // wait for element to finish
  var unsafeWindow = window.unsafeWindow || window;
  if (!unsafeWindow.loadXML || !unsafeWindow.$ || !document.getElementById("subject_prg_content") || !document.getElementById("cluetip")) {
    setTimeout(changeLayout, 1);
    return;
  }
  var weekdayLabels = ['日', '一', '二', '三', '四', '五', '六', '??'];
  console.log("Changing layout");
  var $ = unsafeWindow.$;

  var now = new Date();
  var oldDate = now.valueOf() - 365 * 24 * 60 * 60 * 1000;
  do {
    // let subjects = $("#cloumnSubjectInfo > div:first > div").toArray();
    let subjects = $("#cloumnSubjectInfo > div:last > div").toArray();
    if (!subjects.length) {
      break;
    }

    var container = subjects[0].parentNode;
    for (let subject of subjects) {
      container.removeChild(subject);
    }
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    var days = [];
    for (let i = 0; i < 8; ++i) {
      let day = container.appendChild(document.createElement("div"));
      day.className = "day";
      day.style.overflow = "auto";
      let caption = day.appendChild(document.createElement("div"));
      caption.appendChild(document.createTextNode("周" + weekdayLabels[i]));
      day.subjects = day.appendChild(document.createElement("div"));
      day.subjects.style.cssText += "display:grid;grid-template-columns: 1fr 1fr;"
      days.push(day);
    }
    let oldDay = days[7];
    let today = days[new Date().getDay()];

    today.className += " today";
    for (let subject of subjects) {
      let tips = (function () {
        try {
          for (let ep_info of $('.load-epinfo', subject).toArray()) {
            if (!/epBtnDrop|epBtnWatched/.test(ep_info.className)) {
              return $(".tip:first", $(ep_info.rel));
            }
          }
          let ep_info = $('.load-epinfo:last', subject);
          return $(".tip:first", $(ep_info[0].rel));
        } catch (e) {
          console.log(e, subject);
        }
      })();
      if (!tips) {
        subject.sortId = 0;
        oldDay.subjects.appendChild(subject);
        continue;
      }

      let date = new Date(tips.text().extractDate());
      let title = $("> a:last", subject)[0].title;
      if (/*date.valueOf() <= oldDate ||*/ isNaN(date.valueOf())) {
        subject.sortId = title.getPrefix() + "-" + date.getYear().zeroPad(3) + date.getMonth().zeroPad(2) + "-" + title;
        if (isNaN(date.valueOf())) {
          subject.appendChild(document.createTextNode("Missing On Air Date"));
        }
        oldDay.subjects.appendChild(subject);
      }
      else {
        subject.sortId = title.getPrefix();
        days[date.getDay()].subjects.appendChild(subject);
      }
    }
    for (let day of days) {
      if (day == oldDay) {
        continue;
      }
      let nodes = day.subjects.childNodes;
      sortElements(nodes, function (a, b) {
        return a.sortId.localeCompare(b.sortId);
      });

      for (var i = 0; i < nodes.length; ++i) {
        var $obj = $(nodes[i]);
        if (i % 2 === 0) {
          $obj.removeClass('even');
          $obj.addClass('odd');
        }
        else {
          $obj.removeClass('odd');
          $obj.addClass('even');
        }
      }
    }
  } while (0);

  {
    let subjects = $("#prgSubjectList > li").toArray();
    for (let i in subjects) {
      subjects[i].sortId = $('> a:last', subjects[i])[0].title;
    }
    sortElements(subjects, function localeCompare(a, b) {
      return a.sortId.localeCompare(b.sortId);
    });
  }

  var within_24hours = now.valueOf() - 60 * 60 * 24 * 1000;
  var within_48hours = now.valueOf() - 60 * 60 * 48 * 1000;
  $.each($(".epBtnAir"), function (i, o) {
    var airDate = new Date($(".tip:first", $(o.rel)).text().extractDate()).valueOf();
    if (isNaN(airDate)) {
      $(o).removeClass("epBtnAir");
      $(o).addClass("epBtnUnknown");
    }
    else if (airDate >= within_48hours) {
      $(o).addClass(airDate >= within_24hours ? "epBtnAirNewDay1" : "epBtnAirNewDay2");
    }
  });
}

GM_addStyle(`
.day {
    overflow: auto;
}
day {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
.today {
    background: #ffffaa42;
}

a.epBtnUnknown {
    background: #ecceffb0 !important;
    color: #9932cdfc !important;
    border-color: #9932cd75 !important;
}

a.epBtnAir {
    background: #00ff007a !important;
    color: #55ae55 !important;
    border-color: #55ae55 !important;
}

html[data-theme="dark"] a.epBtnAir {
    color: lightgreen !important;
}

html[data-theme="dark"] a.epBtnToday {
    color: #229100 !important;
}

a.epBtnAirNewDay1 {
    border-color: #90ee90 !important;
    outline: 1px solid #90ee90 !important;
    color: #229100 !important;
}
a.epBtnAirNewDay2 {
    outline: 1px solid #90ee90 !important;
    color: #229100 !important;
}`)
//#endregion

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
  .infoWrapper_tv.disabled, .infoWrapper_book.disabled {
    opacity: 0.5;
    pointer-events: none;
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
  return origin_tv_queue.indexOf(subject_id) >= 0 || origin_book_queue.indexOf(subject_id) >= 0;
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
  if (in_origin_queue(subject_id)) {
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
    books_size: books_size,
    auto_refresh: auto_refresh
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

  if (localStorage[LS_SCOPE] === undefined) {
    $('#ti-alert').show();
    $('#ti-alert').text($('#ti-alert').text().replace(/load.+/, "loading finished.(click to close)"));
  }

  if (refresh === true) {
    $('#ti-pages a.refresh-btn').removeClass('disabled');
    $('#ti-pages a.refresh-btn').html('refresh');
    $('.infoWrapper_tv').removeClass('disabled');
    $('.infoWrapper_book').removeClass('disabled');
    refresh = false;
  }
  changeLayout();
}

// 构造首页条目格子
function create_subject_cell(subject_id) {
  var subject = watching_subjects[subject_id];
  if (subject.type !== 1) {
    $('.infoWrapper_tv').append(`
      <div id='subjectPanel_${subject.id}' subject_type='${subject.type}' class='clearit infoWrapper tinyMode'>
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
      <div id='subjectPanel_${subject.id}' subject_type='${subject.type}' class='clearit infoWrapper tinyMode'>
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

function show_subjects(subject_type) {
  if (subject_type == 0) {
    $('div[subject_type="1"]').show();
    $('div[subject_type="2"]').show();
    $('div[subject_type="6"]').show();
    reset_odd_even();
    return;
  }
  $('div[subject_type="1"]').hide();
  $('div[subject_type="2"]').hide();
  $('div[subject_type="6"]').hide();
  $(`div[subject_type="${subject_type}"]`).show();
  reset_odd_even();
}

function reset_odd_even() {
  $.each($('.infoWrapper_tv > div:visible, .infoWrapper_book > div:visible'), function(index, item) {
    $(item).removeClass("even odd");
    $(item).addClass((index % 2) ? "even" : "odd");
  });
}

// 上限50是动画和三次元加起来的，这里返回的会包含三次元的条目
function all_ids_on_index(html) {
  return $(html).find('.infoWrapper_tv > div, .infoWrapper_book > div').map(function(index, element) {
    return $(element).attr('id').split("_")[1];
  }).toArray();
}

function tv_subject_ids_on_index(html) {
  return $(html).find('.infoWrapper_tv > div').map(function(index, element) {
    return $(element).attr('id').split("_")[1];
  }).toArray();
}

function book_subject_ids_on_index(html) {
  return $(html).find('.infoWrapper_book > div').map(function(index, element) {
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
    <a type='button' data-page='refresh' class='refresh-btn' href='javascript:void(0);'><span>refresh</span></a>
    <label>进入首页自动刷新extra项目进度 <input class="auto-refresh-input" name="auto_refresh" type="checkbox"/></label>
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

  if (auto_refresh == false && localStorage[LS_SCOPE] !== undefined) {
    $('#ti-alert').show();
    var cache = JSON.parse(localStorage[LS_SCOPE]);
    watching_subjects = cache.watching_subjects;
    extra_book_queue = cache.extra_book_queue;
    extra_tv_queue = cache.extra_tv_queue;
    animes_size = cache.animes_size;
    reals_size = cache.reals_size;
    books_size = cache.books_size;
    auto_refresh = cache.auto_refresh || false;
    $(`.auto-refresh-input`).prop('checked', auto_refresh);
    origin_tv_queue = tv_subject_ids_on_index(document);
    origin_book_queue = book_subject_ids_on_index(document);
    if(!auto_refresh){
      $('#ti-alert').text(`Maybe watching ${animes_size} animes, ${reals_size} reals, ${books_size} books, load form localStorage.(click to close)`);
      change_mode();
      add_extra_subjects();
    } else {
      $('#ti-alert').show();
      $('#ti-alert').text(`Maybe watching more than 50 animes and reals, ${size3} books, loading to comfirm.(click to close)`);
      setTimeout(function() {
        get_watching_list();
      }, 10);
    }
  } else {
    $('#ti-alert').show();
    $('#ti-alert').text(`Maybe watching more than 50 animes and reals, ${size3} books, loading to comfirm.(click to close)`);
    setTimeout(function() {
      get_watching_list();
    }, 10);
  }
});

$('#prgManagerMain').on('click', '#ti-alert', function(e) {
  $('#ti-alert').hide();
});

$('#prgManagerMain').on('click', 'a.disabled', function(e) {
  e.preventDefault();
});

$('#prgManagerMain').on('click', '#ti-pages a.refresh-btn', function(e) {
  $(this).addClass('disabled');
  $(this).html('refreshing');

  localStorage.removeItem(LS_SCOPE);
  $('.infoWrapper_tv').addClass('disabled');
  $('.infoWrapper_book').addClass('disabled');
  $('.infoWrapper_tv').html('');
  $('.infoWrapper_book').html('');
  // $('#subject_prg_content').html('');

  refresh = true;
  $.get('/', function(data) {
    var html = data;
    $('.infoWrapper_tv').html($(html).find('.infoWrapper_tv').html());
    $('.infoWrapper_book').html($(html).find('.infoWrapper_book').html());
    $('#subject_prg_content').html($(html).find('#subject_prg_content').html());

    origin_tv_queue = tv_subject_ids_on_index(html);
    origin_book_queue = book_subject_ids_on_index(html);

    setTimeout(function() {
      get_watching_list();
    }, 10);
  });
});

// $(document).on('click', '#ti-pages a.clear-btn', function(e) {
//   $(this).addClass('disabled');
//   $(this).html('clearing');
//   localStorage.removeItem(LS_SCOPE);
//   $(this).removeClass('disabled');
//   $(this).html('clear');
// });

$('#prgManagerMain').on('change', '.auto-refresh-input', function(e) {
  auto_refresh = e.target.checked;
  progress_changed = true;
});

$('#prgCatrgoryFilter a').off('click').on('click', function(e) {
  $('#prgCatrgoryFilter a').removeClass('focus');
  $(this).addClass('focus');
  show_subjects($(this).attr('subject_type'));
});

//restore extra subjects' progress
$(window).on('pagehide', function(e) {
  if (localStorage[LS_SCOPE] === undefined || progress_changed === false) return;

  localStorage[LS_SCOPE] = JSON.stringify({
    watching_subjects: watching_subjects,
    extra_book_queue: extra_book_queue,
    extra_tv_queue: extra_tv_queue,
    animes_size: animes_size,
    reals_size: reals_size,
    books_size: books_size,
    auto_refresh: auto_refresh
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
    if (!in_origin_queue(subject_id)) {
      console.log(`extra subject ${subject_id} progress change`);
      subject.extra = false;
      subject.prg_content_html = null;
      if (type === 1) {
        index = extra_book_queue.indexOf(subject_id);
        extra_book_queue.splice(index, 1);
        origin_book_queue.unshift(subject_id);
        var origin_book_queue_last_subject_id = origin_book_queue.pop();
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
          watching_subjects[subject_id] = new Subject({
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
        var origin_tv_queue_last_subject_id = origin_tv_queue.pop();
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
          watching_subjects[subject_id] = new Subject({
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
