// ==UserScript==
// @name        Bangumi-Relationship-Person-Synchronize
// @namespace   org.binota.scripts.bangumi.brps
// @include     /https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/subject\/\d+\/edit_detail/
// @version     0.1.0
// @grant       none
// ==/UserScript==
"use strict";

const SUBJECT_ID = (window.location.pathname.match(/\/subject\/(\d+)/)[1]);

var querySelector = function(selector) {
  return document.querySelector(selector);
};

var querySelectorAll = function(selector) {
  return document.querySelectorAll(selector);
};

var Get = function(url, sync = true) {
  var req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
 
  if(req.status === 200) return req.responseText;
};

var DecodeHtml = (function() {
  var _e = document.createElement('div');
  return function(value) {
    _e.innerHTML = value;
    return _e.childNodes.length === 0 ? "" : _e.childNodes[0].nodeValue;
  };
  // https://stackoverflow.com/questions/1912501
})();

//Wcode Facade
var Wcode = function(decodeHtml) {
  
  this.html2Json = function(html) {
    const lis = html.match(/<li[^>]*>(.+?)<\/li>/g);
  
    var infobox = {};

    //For each "li" node:
    for(let li of lis) {
      //Drop all html
      li = li.replace(/<.+?>/g, '').trim();

      let field = decodeHtml(li.match(/^(.+?):/)[1].trim());
      let values = decodeHtml(li.match(/:(.+?)$/)[1].trim());
      if(typeof infobox[field] === "undefined") {
        infobox[field] = [];
      }

      infobox[field].push(values);
    }
    return infobox;
  };

  this.json2Wcode = function(json) {
    var wcode = '';
    wcode += "{{Infobox\n";
    for(let field in json) {
      wcode += `|${field}= `;
      if(json[field].length > 1) {
        wcode += "{\n";
        for(let value of json[field]) {
          wcode += `[${value}]`;
          wcode += "\n";
        }
        wcode += "}\n";
      } else {
        wcode += json[field] + "\n";
      }
    }
    wcode += "}}";
    return wcode;
  };
};

//Get Infobox from Subject Page.
//(Dependency Injection)
var getSubjectInfobox = function($, $a, get, wcode, subjectId) {
  const page = get(`/subject/${subjectId}`);

  const infoboxHtml = page.match(/<ul id="infobox">[\w\W]+?<\/ul>/m)[0];

  return wcode.html2Json(infoboxHtml);
};

//Injection UI Element
var drawUi = function() {
  //Creating Element
  var startBtn = document.createElement('a');
  startBtn.innerHTML = '[同步关联]';
  startBtn.classList.add('l');
  startBtn.href = 'javascript:void(0)';
  startBtn.onclick = function() {
    chiiLib.ukagaka.presentSpeech('正在获取条目信息中……');
    //Switch to Wiki Mode  
    NormaltoWCODE();

    //Synchronize
    var wcode = new Wcode(DecodeHtml);
    var syncJson = getSubjectInfobox(querySelector, querySelectorAll, Get, wcode, SUBJECT_ID);
    
    //Get real wcode
    var syncWcode = wcode.json2Wcode(syncJson);
    
    //Writing wcode to textarea
    querySelector('#subject_infobox').value = syncWcode;
    //Writing edition summary
    querySelector('#editSummary').value = '同步关联列表更动';

    chiiLib.ukagaka.presentSpeech('同步完成！请仔细检查 Infobox 是否有误后再提交编辑！');
  };
  
  //Injection Button
  querySelector('table.settings small').appendChild(startBtn);
};

drawUi();
