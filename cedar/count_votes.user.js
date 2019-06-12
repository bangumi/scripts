// ==UserScript==
// @name        评分人数统计plus
// @namespace   tv.bgm.cedar.countVotes
// @version     1.2.1
// @description 通过鼠标选择各分段条形图统计不同分数的打分人数与占比
// @author      Cedar
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/subject/\d+(#;)?$/
// @grant       GM_addStyle
// ==/UserScript==


(function() {
  'use strict';

  GM_addStyle(`
#ChartWarpper>.chart_desc>small {
  font-size: 14px;
  text-align: right;
}
#ChartWarpper>.chart_desc {
  background-color: transparent;
  opacity: 1;
  pointer-events: none;
}
.horizontalChart .chart-column-selected a .count {
  /*background: #2D7BB2;*/
  background: #2DB264;
  /*background: #F4AC09;*/
}
.horizontalChart .chart-column-selected a {
  color: #02A3FB;
  background: #D6F5E3;
}
`);

  let $chart = $("#ChartWarpper ul");
  let $desc = $("#ChartWarpper>.chart_desc>small");
  let totalVotes = parseInt($desc.children('span').text());

  let $count = $(document.createElement('span'));
  let $countNode = $(document.createElement('span')).append($count, ' / ').hide();
  $desc.prepend($countNode);

  let $percent = $count.clone();
  let $percentNode = $(document.createElement('div')).append('(', $percent, '%)').hide();
  $desc.append($percentNode);

  function updateVoteCount() {
    let $selected = $chart.find('.chart-column-selected .count');
    let count = $selected.text().slice(1,-1).split(")(").map(Number).reduce((sum, i) => sum+i);
    if(count) {
      $count.text(count);
      $percent.text((count*100 / totalVotes).toFixed(2));
      $countNode.show();
      $percentNode.show();
      $desc.removeClass('grey');
    }
    else {
      $countNode.hide();
      $percentNode.hide();
      $desc.addClass('grey');
    }
  }

  // for touch device
  if('ontouchstart' in window) {
    let width = $chart.children('li').first().outerWidth(true);
    let chartX = $chart.offset().left;
    function whichChild(e) {
      //let x = e.originalEvent.targetTouches[0].pageX - chartX;
      let x = e.originalEvent.changedTouches[0].pageX - chartX;
      //let x = e.originalEvent.touches[0].pageX - chartX;
      let index = Math.floor(x / width);
      if(index < 0) return 0;
      if(index > 10) return 10;
      return index;
    }

    let prevChild = -1, startChild = -1, touchmoved = false;
    $chart.on("touchstart", function(e) {
      e.preventDefault();
      let i = whichChild(e);
      startChild = i;
      prevChild = i;
      $(this.children[i]).toggleClass('chart-column-selected');
      updateVoteCount();
    }).on("touchmove", function(e) {
      e.preventDefault();
      let i = whichChild(e);
      if(i != prevChild) {
        if (startChild <= i && i < prevChild)
          $(this.children[i+1]).toggleClass('chart-column-selected');
        else if (prevChild < i && i <= startChild)
          $(this.children[i-1]).toggleClass('chart-column-selected');
        else if (i != startChild)
          $(this.children[i]).toggleClass('chart-column-selected');
        updateVoteCount();
        prevChild = i;
        touchmoved = true;
      }
    }).on("touchend", function(e) {
      let i = whichChild(e);
      if (touchmoved && i == startChild) {
        $(this.children[i]).toggleClass('chart-column-selected');
        updateVoteCount();
      }
      prevChild = -1, startChild = -1, touchmoved = false;
    })
  }

  // for mouse selecting
  if('onmouseup' in window) {
    let $chartBars = $chart.children('li');
    //const whichChild = e => $chartBars.index(e.target);

    let selecting = false;
    let prevChild = -1, startChild = -1, mousemoved = false;

    function log(e, i) {console.log(e.target); console.log("i =", i, "prevChild =", prevChild, "startChild =", startChild);}

    $chart.on("mousedown", function(e) {
      e.preventDefault();
      selecting = true;
    }).on("mouseleave", function() {
      if (mousemoved && prevChild == startChild) {
        $(this.children[prevChild]).toggleClass('chart-column-selected');
        updateVoteCount();
      }
      selecting = false;
      prevChild = -1, startChild = -1, mousemoved = false;
    }).on("mousedown", "li", function() {
      prevChild = startChild = $chartBars.index(this);
      $(this).toggleClass('chart-column-selected');
      updateVoteCount();
    }).on("mouseover", "li", function() {
      if(selecting) {
        let i = $chartBars.index(this);
        if (startChild <= i && i < prevChild)
          log(i), console.log('toggle→'), $(this.nextElementSibling).toggleClass('chart-column-selected');
        else if (prevChild < i && i <= startChild)
          log(i), console.log('toggle←'), $(this.previousElementSibling).toggleClass('chart-column-selected');
        else if (i != startChild)
          log(i), console.log('toggle|'), $(this).toggleClass('chart-column-selected');
        prevChild = i;
        mousemoved = true;
        updateVoteCount();
      }
    }).on("mouseup", "li", function() {
      let i = $chartBars.index(this);
      if (mousemoved && i == startChild) {
        $(this).toggleClass('chart-column-selected');
        updateVoteCount();
      }
      selecting = false;
      prevChild = -1, startChild = -1, mousemoved = false;
    })
  }

  // for mouse selecting, deprecated
  /*if('onmouseup' in window) {
    let selecting = false;
    $chart.on("mousedown", function(e) {
      e.preventDefault();
      selecting = true;
    }).on("mouseup mouseleave", function() {
      selecting = false;
    }).on("mousedown", "li", function() {
      $(this).toggleClass('chart-column-selected');
      updateVoteCount();
    }).on("mouseover", "li", function() {
      if(selecting) {
        $(this).toggleClass('chart-column-selected');
        updateVoteCount();
      }
    })
  }*/
}) ();
