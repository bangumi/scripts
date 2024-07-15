// ==UserScript==
// @name        简评字数统计
// @namespace   tv.bgm.cedar.wordcounter
// @version     1.6.1
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

'use strict';

function createWordCounter(dom = document) {
  const LIMIT_NUM = 380;
  const comment = dom.querySelector('#comment');

  const limit = document.createElement('span');
  limit.style.padding = '0 5px';
  limit.textContent = LIMIT_NUM;
  const wordcounter = limit.cloneNode(true);
  wordcounter.textContent = comment.value.length;
  wordcounter.classList.add('word-counter');
  wordcounter.dataset.limit = LIMIT_NUM;
  const wrapper = document.createElement('div');
  wrapper.style.fontWeight = 'bold';
  wrapper.append(wordcounter, '/', limit);
  comment.insertAdjacentElement('afterend', wrapper);

  comment.addEventListener('input', e => {
    let count = e.target.value.length;
    const wordcounter = e.target.closest('.cell').querySelector('.word-counter');
    wordcounter.textContent = count;
    wordcounter.style.color = count > wordcounter.dataset.limit ? "#F09199" : null;
  });
}

function mutationCallback(_, observer) {
  const iframe = document.querySelector('#TB_iframeContent');
  let ready = iframe?.contentDocument.body.querySelector('#comment');
  if (!ready) return;
  observer.disconnect();
  createWordCounter(iframe.contentDocument.body);
};

function eventHandler() {
  new MutationObserver(mutationCallback).observe(document.body, {'childList': true});
};

function main() {
  if (location.pathname.startsWith("/subject/")) createWordCounter();
  // return false 害人!
  // 本想靠 e.currentTarget 和 e.target 筛选, 减少事件监听器数量,
  // 因为 bangumi 在它自己的函数里加了个 return false, 现在只能每个按键加上一个事件监听器了..
  else if (location.pathname == "/") {
    document.querySelectorAll('.progress_percent_text > a').forEach(x => x.addEventListener('click', eventHandler));
  } else {
    document.querySelectorAll('a.thickbox').forEach(x => x.addEventListener('click', eventHandler));
  }
}

main();
