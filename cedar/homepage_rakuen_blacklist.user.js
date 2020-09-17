// ==UserScript==
// @name        首页热门条目与小组讨论屏蔽
// @namespace   tv.bgm.cedar.homepagerakuenblacklist
// @version     1.1
// @description 根据指定关键词或ID屏蔽首页热门条目,小组讨论以及时间线动态
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/rakuen.*$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/timeline/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/settings/privacy$/
// @grant       GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle(`
#homepage-rakuen-blacklist .inputBtn+span {
  display: inline-block;
  width: 16px;
  height: 8px;
  border: 5px solid limegreen;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg);
}
`);

  let storageKey = 'bangumi_homepage_rakuen_blacklist';
  let blacklist = JSON.parse(localStorage[storageKey] || "{}");

  // 隐私设置页面的布局
  if (location.pathname == "/settings/privacy") {
    const generateTableRow = (rowname, inputname, inputvalue) => 
      `<tr><td>${rowname}</td><td><input name="${inputname}" ${inputvalue && inputvalue.length? 'value="'+inputvalue+'" ': ""}class="inputtext" type="text"></td></tr>`;

    let formtable =
`<form id="homepage-rakuen-blacklist">
<table style="margin:auto; width:98%" class="settings">
<thead>
<tr><td colspan="2" style="text-align:left"><h2 class="subtitle">首页热门条目与小组讨论屏蔽</h2></td></tr>
<tr><td style="width:10%">屏蔽内容</td><td style="width:90%">ID或关键词</td></tr>
</thead>
<tbody>
${generateTableRow('小组ID', 'groupIDs', blacklist.groupIDs)
+ generateTableRow('小组标题', 'groupTitleKeywords', blacklist.groupTitleKeywords)
+ generateTableRow('条目ID', 'subjectIDs', blacklist.subjectIDs)
+ generateTableRow('条目标题', 'subjectTitleKeywords', blacklist.subjectTitleKeywords)}
<tr>
<td colspan="2"><input class="inputBtn" type="button" style="margin-right: 5px" value="保存"><span style="display:none"></span></td>
<td></td>
</tr>
</tbody>
</table>
</form>`;

    $(formtable).appendTo(document.getElementById("columnA"));

    let form = document.getElementById('homepage-rakuen-blacklist');
    form.getElementsByClassName("inputBtn")[0].addEventListener("click", function() {
      // 下方代码含义: 把 [["key1", "value1 value2,"], ["key2", "value3, value4"]] 变为 {"key1": ["value1", "value2"], "key2": ["value3", "value4"]}
      blacklist = Array.from(new FormData(form)).reduce((m, x) => Object.assign( m, {[x[0]]: x[1].split(/[, ]+/).filter(x => x.length)} ), {});
      localStorage[storageKey] = JSON.stringify(blacklist);
      $(this.nextElementSibling).fadeIn("fast").fadeTo(300, 1).fadeOut("slow");
    });
    return;
  }

  // observer launcher
  function launchObserver({
    parentNode,
    selector,
    failCallback=null,
    successCallback=null,
    stopWhenSuccess=true,
    config={'childList': true, 'subtree': true},
  }) {
    if(!parentNode) return;
    const observeFunc = mutationList => {
      if(!document.querySelector(selector)) {
        if(failCallback) failCallback();
        return;
      }
      if(stopWhenSuccess) observer.disconnect();
      if(successCallback) successCallback();
    }
    let observer = new MutationObserver(observeFunc);
    observer.observe(parentNode, config);
  }

  function filterItems(elemList, elemParser, keywordList, strictMode=false) {
    // Note: elemParser should return a string.
    if (!keywordList || !keywordList.length || !elemList) return;
    for (let e of elemList) {
      const s = elemParser(e);
      //console.log(e, s, keywordList, keywordList.some(strictMode? (k => s === k): (k => s.includes(k))));
      if (keywordList.some(strictMode? (k => s === k): (k => s.includes(k))))
        e.style.display = "none";
    }
  }

  let group, subject;
  let idParser, titleParser;

  // homepage side panel 首页右上角
  if (location.pathname === "/") {
    group = document.querySelectorAll('#home_grp_tpc .sideTpcList>:not(.tools)');
    subject = document.querySelectorAll('#home_subject_tpc .sideTpcList>li');

    idParser = e => e.querySelector('p a').href.split('/').pop();
    titleParser = e => e.querySelector('.inner>a').innerHTML;
  }
  // rakuen 超展开
  else if (location.pathname.startsWith("/rakuen")) {
    group = document.querySelectorAll('[id^="item_group_"]');
    subject = document.querySelectorAll('[id^="item_subject_"]');

    idParser = e => e.querySelector('.row>a').href.split('/').pop();
    titleParser = e => e.querySelector('.inner>a').innerHTML;
  }

  // group
  filterItems(group, idParser, blacklist.groupIDs, true);
  filterItems(group, titleParser, blacklist.groupTitleKeywords);
  // subject
  filterItems(subject, idParser, blacklist.subjectIDs, true);
  filterItems(subject, titleParser, blacklist.subjectTitleKeywords);

  // timeline 时间线, 这个只屏蔽指定的条目ID
  if (location.pathname === "/" || location.pathname.startsWith("/timeline")) {

    let parentNode = document.getElementById('tmlContent');
    // 因为 Parser 必须返回 string, 没办法 只能把所有subject的内容拼成一个长string
    idParser = e => Array.from(e.querySelectorAll('a')).filter(x => /subject\/\d+/.test(x.pathname)).map(x => x.pathname).join(' ');
    const runFilter = () => {
      // 先获取timeline元素然后筛选
      subject = Array.from(parentNode.querySelectorAll('ul>li')).filter(x => /subject\/\d+/.test(x.innerHTML));
      filterItems(subject, idParser, blacklist.subjectIDs)
    };

    runFilter();
    launchObserver({
      parentNode: parentNode,
      selector: '#tmlContent',
      failCallback: null,
      successCallback: runFilter,
      stopWhenSuccess: false,
    });
  }
})();
