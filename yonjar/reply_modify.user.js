// ==UserScript==
// @name         dd楼回复预处理
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  try to take over the world!
// @author       Yonjar
// @match        https://*.tv/group/topic/344154
// @match        https://*.tv/rakuen/topic/group/344154
// @match        https://*.tv/group/topic/367737
// @match        https://*.tv/rakuen/topic/group/367737
// @match        https://*.tv/group/topic/372994
// @match        https://*.tv/rakuen/topic/group/372994
// @match        https://*.tv/group/topic/379990
// @match        https://*.tv/rakuen/topic/group/379990
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Your code here...

  //回复框
  let textarea = document.querySelector("#content");

  //regx: String.prototype.replace()的第一个参数, 可以是个字符串或 RegExp 对象
  //substitute: String.prototype.replace()的第二个参数, 可以是个字符串或函数
  let parameters = [
    {
      regx: "_哔哩哔哩_bilibili",
      substitute: "",
    },
    // {
    //     regx: /(\/?\?p=\d+)?[&\?]\S+$/,
    //     substitute: '$1'
    // },
    {
      regx: /\/\?\S+$/,
      substitute: "",
    },
    {
      regx: /\&\S+$/,
      substitute: "",
    },
    {
      regx: /(\([^\(]*?(字|中|熟)[^\(]*?\))|(（[^（]*?(字|中|熟)[^（]*?）)|(\[[^\[]*?(字|中|熟)[^\[]*?\])|(【[^【]*?(字|中|熟)[^【]*?】)/,
      substitute: "",
    },
    {
      regx: " - ",
      substitute: "\n",
    },
  ];

  //事件处理函数 回复框失去焦点时触发
  textarea.addEventListener("blur", () => {
    for (let a of parameters) {
      textarea.value = textarea.value.replace(a.regx, a.substitute);
    }
    textarea.value.trim();
  });
})();
