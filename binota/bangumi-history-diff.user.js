// ==UserScript==
// @name        Bangumi-History-Diff
// @namespace   BHD
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/subject/\d+\/edit$/
// @include     /https?:\/\/(bgm|bangumi|chii)\.(tv|in)\/subject/\d+\/edit_detail/diff\/\d+\.\.\.\d+/
// @version     0.0.6
// @grant       none
// @require     https://code.jquery.com/jquery-2.1.1.min.js
// ==/UserScript==

var domain, func, uri, params = {};
var version1, version2;

//----------------------------------------
//---- Edit ------------------------------
//----------------------------------------
editController = function() {
  $('<div id="diff-launcher"><input type="number" name="diff-left" class="inputtext" placeholder="左对比（通常是老版本）"><input type="number" name="diff-right" class="inputtext" placeholder="右对比（通常是新版本）"><input type="button" class="inputBtn" value="对比" name="diff-launch"></div>').insertBefore($('#pagehistory'));

  $('#pagehistory li a').each(function() {
    var hrefMatch = $(this).attr('href').match(/undo\/(\d+)/);
    if(hrefMatch == null) return;
    var version = hrefMatch[1];
  
    $('<span>| <a href="#" class="l diff-add2left" data-version="' + version + '">加到左边对比</a> | <a href="#" class="l diff-add2right" data-version="' + version + '">加到右边对比</a></span>').insertAfter(this);
  });
  
  //binding events
  $('input[name="diff-launch"]').click(function() {
    window.location.href = '/subject/' + params.subject + '/edit_detail/diff/' + $('input[name="diff-left"]').val() + '...' + $('input[name="diff-right"').val();
  });
  
  $('.diff-add2left').click(function() {
    $('input[name="diff-left"]').val($(this).attr('data-version'));
  });

  $('.diff-add2right').click(function() {
    $('input[name="diff-right"]').val($(this).attr('data-version'));
  });
}

//----------------------------------------
//---- Diff ------------------------------
//----------------------------------------

diffController = function() {
//Request the first version and load insert it into document.
$.get('/subject/' + params.subject + '/edit_detail/undo/' + params.ver1, function(data) {
  $('body').html(data);
  
  //Change the links in navigation bar.
  $('.navSubTabs .focus').removeClass('focus');
  $('.navSubTabs').append('<li><a class="focus" href="#">对比</a></li>');
  
  //Get all infomations we need.
  var info = {ver1: {}, ver2: {}};
  //条目标题
  info.ver1.title = $('input[name="subject_title"]').val();
  //Infobox
  info.ver1.infobox = $('#subject_infobox').val();
  //简介
  info.ver1.summary = $('#subject_summary').val();
  
  //Clean workspace
  $('#columnInSubjectA').html('<h2>/ 正在对比版本 <a href="/subject/' + params.subject + '/edit_detail/undo/' + params.ver1 + '">' + params.ver1 + '</a> 与 <a href="/subject/' + params.subject + '/edit_detail/undo/' + params.ver2 + '">' + params.ver2 + '</a>' +
                              '    <a class="chiiBtn" href="/subject/' + params.subject + '/edit_detail/diff/' + params.ver2 + '...' + params.ver1 + '"><span>交换方向</span></a></small></h2>' +
                              '<div id="diff-workspace">' +
                              '<style>#diff-workspace h1 { margin: 6px; padding: 3px; font-size: 18px; border-bottom: 1px solid #777; } .diff-added { background: #e9efe9; } .diff-deleted { background: #feebeb; } .diff-modified { background: #faffd9; } .diff-inline-add { background: rgba(0, 0, 0, .1); padding: 9px 0; } .diff-inline-delete { text-decoration: line-through; } </style>' +
                              '<h1>标题</h1> <table id="diff-title" class="settings" width="100%" cellpadding="5"><thead><tr><th>版本 #' + params.ver1 + '</th><th>版本 #' + params.ver2 + '</th></tr></thead><tbody></tbody></table>' + 
                              '<h1>Infobox</h1> <table id="diff-infobox" class="settings" width="100%" cellpadding="5"><thead><tr><th></td><th>版本 #' + params.ver1 + '</th><th></th><th>版本 #' + params.ver2 + '</th></tr></thead><tbody></tbody></table>' + 
                              '<h1>简介</h1> <table id="diff-summary" class="settings" width="100%" cellpadding="5"><thead><tr><th>版本 #' + params.ver1 + '</th><th>版本 #' + params.ver2 + '</th></tr></thead><tbody></tbody></table>' +
                              '</div>');

  //Loading another version and then diff them.
  $.get('/subject/' + params.subject + '/edit_detail/undo/' + params.ver2, function(data) {
    //Remove the input box, and add the table element for diff view.
    //[\S\s]* => See https://stackoverflow.com/questions/26929891/regex-to-match-a-multi-line-string
    info.ver2.title = data.match(/subject_title" class="inputtext" type="text" value="(.+?)" \/>/)[1];
    info.ver2.infobox = data.match(/subject_infobox"[^>]+>([\S\s]*?)<\/textarea>/m)[1];
    info.ver2.summary = data.match(/subject_summary"[^>]+>([\S\s]*?)<\/textarea>/m)[1];

    var infobox = {ver1: {}, ver2: {}};
    //clean up
    infobox.ver1 = info.ver1.infobox.replace(/\r/g, "");
    infobox.ver2 = info.ver2.infobox.replace(/\r/g, "");
    
    //Diff - Title
    var titleCompare = inlineCompare(info.ver1.title, info.ver2.title);
    $('#diff-title tbody').append('<tr><td>' + titleCompare.left + '</td><td>' + titleCompare.right + '</td></tr>');

    //Diff - Infobox
    infobox.ver1 = infobox.ver1.split(/\n/);
    infobox.ver2 = infobox.ver2.split(/\n/);

    infoboxCompare = compare(infobox.ver1, infobox.ver2);
    console.log(infoboxCompare);

    var leftPointer = 1, rightPointer = 1;
    for(i in infoboxCompare) {
      switch(infoboxCompare[i].act) {
        case 'match':
          $('#diff-infobox tbody').append('<tr class="diff-match"><td>' + (leftPointer++) + '</td><td>' + infoboxCompare[i].left.replace(/ /g, '&nbsp;') + '</td><td>' + (rightPointer++) + '</td><td>' + infoboxCompare[i].right.replace(/ /g, '&nbsp;') + '</td></tr>');
          break;
        case 'added':
          $('#diff-infobox tbody').append('<tr><td></td><td></td><td>' + (rightPointer++) + '</td><td class="diff-added">' + infoboxCompare[i].right.replace(/ /g, '&nbsp;') + '</td></tr>');
          break;
        case 'deleted':
          $('#diff-infobox tbody').append('<tr><td>' + (leftPointer++) + '</td><td class="diff-deleted">' + infoboxCompare[i].left.replace(/ /g, '&nbsp;') + '</td><td></td><td></td></tr>');
          break;
        case 'modified':
          var compareResult = inlineCompare(infoboxCompare[i].left, infoboxCompare[i].right);
          $('#diff-infobox tbody').append('<tr><td>' + (leftPointer++) + '</td><td class="diff-deleted">' + compareResult.left + '</td><td>' + (rightPointer++) + '</td><td class="diff-added">' + compareResult.right + '</td></tr>');
          break;
      }
    }
    
    //Diff - Summary
    var summaryCompare = inlineCompare(info.ver1.summary, info.ver2.summary);
    $('#diff-summary tbody').append('<tr><td>' + summaryCompare.left + '</td><td>' + summaryCompare.right + '</td></tr>');

  }); //$.get('/subj...ver2...
}); //$.get('/subj...ver1...
}
  
//----------------------------------------
//---- Functions -------------------------
//----------------------------------------
compare = function(left, right) {
  var leftPointer = 0, rightPointer = 0;
  var retval = [];

  while(leftPointer < left.length) {
    //May be they are the same...
    if(left[leftPointer] == right[rightPointer]) {
      retval.push({act: 'match', left: left[leftPointer], right: right[rightPointer]});
      leftPointer++;
      rightPointer++;
      continue;
    }
    //May be they are the same but there are some spaces...
    if(left[leftPointer].trim() == right[rightPointer].trim()) {
      retval.push({act: 'modified', left: left[leftPointer], right: right[rightPointer]});
      leftPointer++;
      rightPointer++;
      continue;
    }

    var matchShift = 0;
    var leftShift = 0, rightShift = 0;
    var leftTitleMatch = false, rightTitleMatch = false;
      
    while((rightPointer + rightShift) < right.length) {
      //for the line start with "|", we just compare their title("|title=", "|title =")
      if((left[leftPointer].length > 0 && left[leftPointer][0] == '|') &&
         (right[rightPointer + rightShift].length > 0 && right[rightPointer + rightShift][0] == '|')) {
        var leftTitle = left[leftPointer].match(/\|(.+?)=/)[1];
        var rightTitle = right[rightPointer + rightShift].match(/\|(.+?)=/)[1];
        if(leftTitle == rightTitle) {
          rightTitleMatch = true;
          break;
        }
      } else if(left[leftPointer].trim() == right[rightPointer + rightShift].trim()) break;
      rightShift++;
    } //while rightShift...
    matchShift = rightShift;

    var leftShift = 0, rightShift = 0;
    while((leftShift + leftPointer) < left.length) {
      //for the line start with "|", we just compare their title("|title=", "|title =")
      if((left[leftPointer + leftShift].length > 0 && left[leftPointer + leftShift][0] == '|') &&
         (right[rightPointer].length > 0 && right[rightPointer][0] == '|')) {
        var leftTitle = left[leftPointer + leftShift].match(/\|(.+?)=/)[1];
        var rightTitle = right[rightPointer].match(/\|(.+?)=/)[1];
        if(leftTitle == rightTitle) {
          leftTitleMatch = true;
          break;
        }
      } else if(left[leftPointer + leftShift].trim() == right[rightPointer].trim()) break;
      leftShift++;
    } //while leftShift...
    rightShift = matchShift;

    //Comparing...
      
    //Modified
    if(((leftPointer + leftShift) >= left.length - 1) && ((rightPointer + rightShift) >= right.length - 1)) {
      retval.push({act: 'deleted', left: left[leftPointer]});
      retval.push({act: 'added', right: right[rightPointer]});
      leftPointer++;
      rightPointer++;
      continue;
    }
      
    //Delete
    if(leftShift < rightShift) {
      for(var i = 0; i < leftShift; i++) {
        retval.push({act: 'deleted', left: left[leftPointer + i]});
      }
      retval.push({act: (left[leftPointer + leftShift] == right[rightPointer] ? 'match' : 'modified'), left: left[leftPointer + leftShift], right: right[rightPointer]});
      leftPointer += leftShift + 1;
      rightPointer++;
      continue;
    }

    //Add
    if(leftShift > rightShift) {
      for(var i = 0; i < rightShift; i++) {
        retval.push({act: 'added', right: right[rightPointer + i]});
      }
      retval.push({act: (left[leftPointer] == right[rightPointer + rightShift] ? 'match' : 'modified'), left: left[leftPointer], right: right[rightPointer + rightShift]});
      leftPointer++;
      rightPointer += rightShift + 1;
      continue;
    }
    
    //Else... => the title of two lines are the same
    retval.push({act: 'modified', left: left[leftPointer], right: right[rightPointer]});
    leftPointer++;
    rightPointer++;
    continue;
  } //while leftPointer...
  return retval;
}

inlineCompare = function(left, right) {
  var retval = {left: '', right: ''};
  var leftPointer = 0, rightPointer = 0;
  var modOpen = false;
  
  var cleanSp = function(char) {
    return (char == ' ') ? '&nbsp;' : char;
  }

  while(leftPointer < left.length) {
    if(left[leftPointer] == right[rightPointer]) {
      if(modOpen) { retval.left += '</span>'; retval.right += '</span>'; modOpen = false; }
      retval.left += cleanSp(left[leftPointer]);
      retval.right += cleanSp(right[rightPointer]);
      leftPointer++;
      rightPointer++;
      continue;
    }
    
    if(rightPointer >= right.length) {
      if(modOpen) { retval.left += '</span>'; retval.right += '</span>'; modOpen = false; }
      retval.left += '<span class="diff-inline-delete">';
      for(var i = 0; leftPointer + i < left.length; i++) retval.left += cleanSp(left[leftPointer + i]);
      retval.left += '</span>';
      break;
    }
    
    var leftShift = 0, rightShift = 0;
    while(rightPointer + rightShift < right.length) {
      if(left[leftPointer] == right[rightPointer + rightShift]) break;
      rightShift++;
    }

    while(leftPointer + leftShift < left.length) {
      if(left[leftPointer + leftShift] == right[rightPointer]) break;
      leftShift++;
    }
    
    console.log(leftPointer, leftShift, rightPointer, rightShift);
    //Modified
    if((leftPointer + leftShift) >= left.length && (rightPointer + rightShift) >= right.length) {
      if(!modOpen) {
        retval.left += '<span class="diff-inline-delete">';
        retval.right += '<span class="diff-inline-add">';
      }
      retval.left += cleanSp(left[leftPointer]);
      retval.right += cleanSp(right[rightPointer]);
      modOpen = true;
      leftPointer++;
      rightPointer++;
      continue;
    }
    
    //Add or Delete
    if(rightShift < leftShift) {
      if(modOpen) { retval.left += '</span>'; retval.right += '</span>'; modOpen = false; }
      retval.right += '<span class="diff-inline-add">';
      for(var i = 0; i < rightShift; i++) retval.right += cleanSp(right[rightPointer + i]);
      retval.right += '</span>';
      rightPointer += rightShift;
      continue;
    } else {
      if(modOpen) { retval.left += '</span>'; retval.right += '</span>'; modOpen = false; }
      retval.left += '<span class="diff-inline-delete">';
      for(var i = 0; i < leftShift; i++) retval.left += cleanSp(left[leftPointer + i]);
      retval.left += '</span>';
      leftPointer += leftShift;
      continue;
    }
  }
  if(rightPointer < right.length) {
    if(modOpen) { retval.left += '</span>'; retval.right += '</span>'; modOpen = false; }
    retval.right += '<span class="diff-inline-add">';
    while(rightPointer < right.length) {
      retval.right += cleanSp(right[rightPointer++]);
    }
    retval.right += '</span>';
  }

  return retval;
}

//----------------------------------------
//---- Routing & Bootstrap ---------------
//----------------------------------------

$(function() {
  var urlMatch = window.location.href.match(/\/\/(bgm|bangumi|chii).(tv|in)(\/.+)/);
  uri = urlMatch[3];

  //Domain
  switch(urlMatch[1]) {
    case 'bgm':
      domain = 'bgm.tv';
      break;
    case 'bangumi':
      domain = 'bangumi.tv';
      break;
    case 'chii':
      domain = 'chii.in';
      break;
  }
  
  //URI & Params
  switch(true) {
    case (urlMatch[3].search('diff') >= 0):
      func = 'diff';

      var matchParams = urlMatch[3].match(/\/subject\/(\d+)\/edit_detail\/diff\/(\d+)...(\d+)/);
      params = {
        subject: matchParams[1],
        ver1: matchParams[2],
        ver2: matchParams[3]
      };
      diffController();
      break;
    case (urlMatch[3].search('edit') >= 0):
      func = 'edit';

      var matchParams = urlMatch[3].match(/\/subject\/(\d+)\/edit/);
      params = {
        subject: matchParams[1]
      };
      editController();
      break;
  }
});