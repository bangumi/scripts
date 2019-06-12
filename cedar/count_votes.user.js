// ==UserScript==
// @name        评分人数统计plus
// @namespace   tv.bgm.cedar.countVotes
// @version     1.0
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
}
.horizontalChart .chart-column-selected a .count {
  background: #2D7BB2;
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
}) ();
