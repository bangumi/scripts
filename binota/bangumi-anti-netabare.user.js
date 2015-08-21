// ==UserScript==
// @name        Bangumi Anti-Netabare
// @namespace   BAN
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/(ep|blog)\/.+/
// @version     0.0.7
// @grant       none
// @description 屏蔽未看过话播出时间以前的讨论、并在日志页面提示对关联条目的关注状态
// ==/UserScript==

//---- Actions on ep. page --------------------------------

//Get the first on air date.
var getOnAirDate = function() {
  return (new Date($('.epDesc .tip').html().match(/首播:(\d{4}\-\d{1,2}\-\d{1,2})/).slice(1)[0])).valueOf() / 1000;
}


var getFloorDate = function($el) {
  var match = $el.html().match(/(\d{4})\-(\d{1,2})\-(\d{1,2}) (\d{1,2}):(\d{1,2})/);
  if(match === null) return new Date(0);
  match = match.slice(1);
  //The month start from 0
  return (new Date(match[0], match[1] - 1, match[2], match[3], match[4])).valueOf() / 1000;
}

//Check whether the date in .re_info is out of the date first on air.
var checkDate = function(floorDate, filterDate) {
  return (floorDate > filterDate);
}

var getSubjectUrl = function() {
  return $('#subject_inner_info a').attr('href');
}


//---- Actions on subject page ----------------------------
var getFirstUnwachedEpDate = function(page) {
  var match = page.match(/load-epinfo (epBtnAir|epBtnNA)" title=".*?" rel="#prginfo_(\d+)/);
  if(match === null) return false;
  match = match.slice(2)[0];
  //496541" class="ep_status">抛弃</a></div><span class="tip">中文标题:你多么耀眼<br />首播:2015-04-19
  var $date = page.match((new RegExp(match + '" class="ep_status.+?首播:(\\d{4}\\-\\d{1,2}\\-\\d{1,2})'))).slice(1)[0];
  return (new Date($date)).valueOf() / 1000;
}

var getInterestStatus = function(page) {
  //<span class="interest_now">我在看这部动画</span>
  var match = page.match(/interest_now">(.+?)<\/span/);
  if(match === null) return '';
  return match.slice(1)[0];
}

//---- Actions on blog page -------------------------------
var getSubjectUrls = function() {
  var urls = [];
  $('#related_subject_list a').each(function() {
    urls.push($(this).attr('href'));
  });
  return urls;
}

//---- Here we go~ ----------------------------------------

$(function() {
  switch(true) {
    case (window.location.href.search(/ep/) >= 0):
      //var epOnAirDate = getOnAirDate();
      var subjectPage = getSubjectUrl();
      $.get(subjectPage, function(subjectPageContent) {
        var filterDate = getFirstUnwachedEpDate(subjectPageContent);
        if(filterDate) {
          $('.re_info').each(function() {
            if(checkDate(getFloorDate($(this)), filterDate)) {
              //Hide this floor
              $(this).parent().children('.inner').children('.reply_content,.cmt_sub_content').css({opacity: 0});
              $(this).parent().css({background: "#DDDFFF"});
              $(this).parent().addClass('banFloor');
            }
          });
          $('.banFloor').click(function() {
            $(this).children('.inner').children('.reply_content,.cmt_sub_content').animate({
              opacity: 1
            }, 500);
          });
        }
      });
      break;
    case (window.location.href.search(/blog/) >= 0):
      $('#related_subject_list li > a').each(function() {
        var url = $(this).attr('href');
        var subjectId = url.match(/subject\/(\d+)/).slice(1)[0];
        $.get(url, function(subjectPageContent) {
          var status = getInterestStatus(subjectPageContent);
          $('#related_' + subjectId).append($('<br><p class="interest_now">' + status + '</p>'));
        })
      });
      break;
  }
});

