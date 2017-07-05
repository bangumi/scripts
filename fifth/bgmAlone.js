// ==UserScript==
// @name         bgm alone
// @namespace    fifth26.com
// @version      1.0.0
// @description  单机版bgm
// @author       fifth
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/
// @grant        GM_addStyle
// @encoding     utf-8
// ==/UserScript==

const CURRENT_VERSION = '1.0.0';

var current_path = location.pathname;
var child;
if (current_path == '/') {
    child = document.querySelector('#columnHomeB');
    child.parentNode.removeChild(child);
    child = document.querySelector('#home_tml');
    child.parentNode.removeChild(child);
    child = document.querySelector('#footer');
    child.parentNode.removeChild(child);
    child = document.querySelector('#dock');
    child.parentNode.removeChild(child);
    child = document.querySelector('#headerNeue2');
    child.parentNode.removeChild(child);
    var node = document.createTextNode('，您正在使用单机版BGM。对的，您将不能使用除了点格子以外的所有功能');
    document.querySelector('#main h1').appendChild(node);
}
else if (current_path.match(/^\/subject\/\d+(\/ep|\/characters|\/persons)?$/)){
    child = document.querySelector('#subjectPanelIndex');
    child.parentNode.removeChild(child);
    child = document.querySelector('#subjectPanelCollect');
    child.parentNode.removeChild(child);
    child = document.querySelector('.global_rating');
    child.parentNode.removeChild(child);
    child = document.querySelector('.horizontalChart');
    child.parentNode.removeChild(child);
    child = document.querySelector('.frdScore');
    child.parentNode.removeChild(child);
    child = document.querySelector('.chart_desc');
    child.parentNode.removeChild(child);
    child = document.querySelector('#comment_box').parentNode;
    child.parentNode.removeChild(child);
    child = document.querySelector('.topic_list').parentNode;
    child.parentNode.removeChild(child);
    child = document.querySelector('#entry_list').parentNode.parentNode;
    child.parentNode.removeChild(child);
    child = document.querySelector('#footer');
    child.parentNode.removeChild(child);
    child = document.querySelector('#headerNeue2');
    child.parentNode.removeChild(child);
}
else {
    // child = document.querySelector('body');
    // child.parentNode.removeChild(child);
    var a = document.createElement('a');
    a.text = '回到首页';
    a.setAttribute('href', 'https://bgm.tv');
    a.className = 'l';
    child = document.querySelector('#wrapperNeue');
    child.parentNode.removeChild(child);
    document.querySelector('body').appendChild(a);
}
