// ==UserScript==
// @name        简评字数统计
// @namespace   tv.bgm.cedar.wordcounter
// @version     1.3
// @description 统计简评字数
// @author      Cedar
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/$/
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/subject/\d+(#;)?$/
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/index/\d+$/
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/.*(browser|tag|list|subject_search).*$/
// ==/UserScript==

/**include解释:
 * none:   首页
 * subject:条目页
 * index:  目录
 * brower: 分类浏览和排行榜
 * tag:    标签页
 * list:   个人收藏
 * update: 更新页(比如/update/124341 组件无效 放弃支持)
 * subject_search: 搜索页
 */

(function() {
  'use strict';

  function createWordCounter(dom=document) {
    const total = 200;
    let $comment = $('#comment', dom);
    const getCount = () => $comment.val().length;

    let $total = $(document.createElement('span')).css('padding', '0 5px').text(total);
    let $wordcounter = $total.clone().text(getCount());
    let $wordcounterWrapper = $(document.createElement('div'))
      .css('margin-bottom', '8px').append($wordcounter, '/', $total);
    $("#collectBoxForm", dom).children('.clearit').last().before($wordcounterWrapper);

    $comment.on('blur input', function() {
      let count = getCount();
      $wordcounter.text(count);
      if(count > total) $wordcounter.css("color","red");
      else $wordcounter.css("color","");
    });
  }

  function loop() {
    let $iframe = $('#TB_iframeContent');
    let ready = $iframe.length && $('#comment', $iframe.contents()).length;
    if(ready) createWordCounter($iframe.contents());
    else setTimeout(window.requestAnimationFrame, 100, loop);
    //else window.requestAnimationFrame(loop);
  }

  if(location.pathname.startsWith("/subject/")) createWordCounter()
  else if(location.pathname == "/") $('.progress_percent_text').children('a').on('click', function() {window.requestAnimationFrame(loop)})
  else $('a.thickbox').on('click', function() {window.requestAnimationFrame(loop)})
}) ();

/** version:
 *  ver 1.3    支持首页
 *  ver 1.2.1  少量优化
 *  ver 1.2    支持个人收藏, 目录, Tag, 搜索和排行榜页面
 *  ver 1.1    实现方法优化
 *  ver 1.0.1  修改metadata(@include @namespace)
 *  ver 1.0    初始版本.
 */
