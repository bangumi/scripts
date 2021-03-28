// ==UserScript==
// @name         bangumi日志展开与折叠
// @namespace    xd.cedar.blogToggler
// @version      1.0
// @description  点击 (more) 在本页显示完整的日志/评论内容
// @author       Cedar
// @include      /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/subject/\d+$/
// @include      /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/subject/\d+/reviews$/
// @include      /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/user/.+/blog$/
// @include      /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/user/.+$/
// ==/UserScript==

'use strict';

async function getBlogElement(url) {
  let response = await fetch(url);
  let text = await response.text();
  let html = new DOMParser().parseFromString(text, "text/html");
  let blogEl = html.querySelector('#entry_content');

  let wrapper = document.createElement('span');
  wrapper.classList.add('detail');
  Array.from(blogEl.childNodes).forEach(x => { wrapper.appendChild(x) });
  return wrapper;
}


class ShowMoreUI {
  static addListener(root) {
    root.addEventListener('click', this.onClick.bind(this));
  }

  static onClick(e) {
    if (!e.target.matches('.content>small>a')) return;
    e.preventDefault();
    let action = e.target.dataset.action;
    if (!action) action = 'more';
    this[action](e.target);
  }

  static async more(button) {
    let root = button.closest('.content');
    // 修改按钮状态
    button.innerHTML = '(loading...)';
    button.dataset.action = 'loading';
    // 给summary元素包上一层span
    let summaryEl = root.querySelector('span.summary');
    if (!summaryEl) {
      summaryEl = document.createElement('span');
      summaryEl.classList.add('summary');
      summaryEl.appendChild(root.childNodes[0]);
      root.insertAdjacentElement('afterbegin', summaryEl);
    }
    // 尝试获取全文
    let blogEl = root.querySelector('span.detail');
    try {
        if (!blogEl) {
          blogEl = await getBlogElement(button.href);
          summaryEl.insertAdjacentElement('afterend', blogEl);
        }
    }
    catch(e) {
      button.innerHTML = '(retry)';
      button.dataset.action = 'retry';
      return;
    }
    // 展示全文
    blogEl.style.display = '';
    summaryEl.style.display = 'none';
    button.innerHTML = '(less)';
    button.dataset.action = 'less';
    // 如果全文内容与展示内容相同, 是否应该直接删掉按钮? 暂时决定删掉
    if (blogEl.innerHTML.replace(/<br>/g, '').trim() === summaryEl.innerHTML.trim()) {
      button.parentElement.removeChild(button);
      return;
    }
  }

  static less(button) {
    let root = button.closest('.content');
    // 调整元素的可见性
    let summaryEl = root.querySelector('span.summary');
    let blogEl = root.querySelector('span.detail');
    blogEl.style.display = 'none';
    summaryEl.style.display = '';
    button.innerHTML = '(more)';
    button.dataset.action = 'more';
    // 收起后, 如果条目不在页面下方, 则滚动页面
    // 参考 https://docs.microsoft.com/en-us/previous-versions/hh781509(v=vs.85)
    let item = root.closest('.item');
    let Y_Pos = item.getBoundingClientRect().bottom - item.scrollHeight;
    if (Y_Pos < 0) window.scrollBy(0, Y_Pos);
  }

  static loading(button) {
    // loading时点按钮的话, 啥也别做
  }

  static retry(button) {
    this.more(button);
  }
}


function main() {
  let entry_list = document.getElementById('entry_list');
  if (entry_list) ShowMoreUI.addListener(entry_list);
}

main();
