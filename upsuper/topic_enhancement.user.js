// ==UserScript==
// @name        Bangumi 讨论增强
// @namespace   org.upsuper.bangumi
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/(ep|character|(group|subject)/topic|rakuen/topic/(ep|crt|group|subject))/\d+(\?.*)?(#.*)?$/
// @grant       none
// @version     4.4.2
// ==/UserScript==

var PREFIX_POST_READ = 'PostRead_'
  , PREFIX_TOPIC_TITLE = 'TopicTitle_';

var _$ = q => document.querySelectorAll(q);
var $ = typeof NodeList.prototype[Symbol.iterator] == "function" ?
  _$ : q => Array.prototype.slice.call(_$(q));

function getTopicID(url) {
  var url = url.split('/');
  if (url[2] != 'bgm.tv' &&
      url[2] != 'chii.in' &&
      url[2] != 'bangumi.tv')
    return false;

  var topicID = url.slice(3);
  if (topicID[0] == "rakuen") {
    switch (topicID[2]) {
      case "ep":
        topicID = ["ep", topicID[3]]; break;
      case "crt":
        topicID = ["character", topicID[3]]; break;
      case "group": case "subject":
        topicID = [topicID[2], topicID[1], topicID[3]];
    }
  }

  var idPos = {ep: 1, character: 1, group: 2, subject: 2}[topicID[0]];
  if (!idPos)
    return false;
  if (idPos == 2 && topicID[1] != 'topic')
    return false;

  topicID.splice(idPos + 1);
  topicID[idPos] = parseInt(topicID[idPos]);
  topicID = topicID.join("_");
  return topicID;
}

function saveTopicTitle(topicID, title) {
  var key = PREFIX_TOPIC_TITLE + topicID;
  localStorage[key] = title;
}

var topicID = getTopicID(location.href);
saveTopicTitle(topicID, document.title);

function updateTopicTitle($link) {
  if ($link.title)
    return;

  var url = $link.href
    , topicID = getTopicID(url);
  if (!topicID)
    return;

  var key = PREFIX_TOPIC_TITLE + topicID;
  if (localStorage[key]) {
    $link.title = localStorage[key];
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var title = /<title>(.+)<\/title>/m.exec(xhr.responseText);
      if (!title)
        return;
      title = title[1];
      saveTopicTitle(topicID, title);
      $link.title = title;
    }
  };
  xhr.open('GET', url, true);
  xhr.send(null);
}

// update link title
for (var $link of $('#main a.l:not([title])')) {
  updateTopicTitle($link);
}

function getPostIDs() {
  var postIDs = [];
  for (var $reply of $('div[id^="post_"]')) {
    postIDs.push(parseInt($reply.id.substr(5)));
  }
  return postIDs;
}

// highlight new posts
var postIDs = getPostIDs()
  , key = PREFIX_POST_READ + topicID;
if (localStorage[key]) {
  var lastMaxID = parseInt(localStorage[key]);
  for (var postID of postIDs) {
    if (postID <= lastMaxID)
      continue;

    postID = '#post_' + postID;
    if ($('.reply_highlight~' + postID)[0])
      continue;
    if ($('.reply_highlight ' + postID)[0])
      continue;
    if ($('.reply_highlight~div ' + postID)[0])
      continue;
    $(postID)[0].classList.add('reply_highlight');
  }
}
setInterval(() => {
  var newValue = Math.max.apply(Math, getPostIDs());
  if (!localStorage[key] || newValue > localStorage[key]) {
    localStorage[key] = newValue;
  }
}, 5000);
