// ==UserScript==
// @name         关联单行本自动排序
// @namespace    bangumi.wiki.vol.sort
// @homepage     https://bgm.tv/group/topic/454446
// @version      0.1.1
// @description  按照数字一键排序单行本（支持可配置化扩展排序方式）
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        https://bgm.tv/subject/*/add_related/subject/book
// @match        https://bangumi.tv/subject/*/add_related/subject/book
// @match        https://chii.in/subject/*/add_related/subject/book
// @grant        none
// @license      MIT
// @gadget       https://bgm.tv/dev/app/5411
// ==/UserScript==

(function() {
  'use strict';

  // ===================== 排序规则配置（核心扩展点） =====================
  // 新增排序方式只需在这个对象中添加新的key-value即可
  const SORT_RULES = {
    // 排序值: { 显示文本, 获取排序值的方法, input值填充方式（raw=原始值/sequence=连续序号） }
    number: {
      label: '按序号',
      getSortValue: (li) => {
        const linkText = li.querySelector('a.l')?.textContent || '';
        const numberMatch = linkText.match(/\d+/);
        return numberMatch ? parseInt(numberMatch[0], 10) : Infinity;
      },
      inputMode: 'raw' // 填充提取到的原始序号值
    },
    id: {
      label: '按ID',
      getSortValue: (li) => {
        const href = li.querySelector('a.l')?.href || '';
        const id = href.split('/').pop();
        return id && /^\d+$/.test(id) ? parseInt(id, 10) : Infinity;
      },
      inputMode: 'sequence' // 填充连续序号（从1开始）
    }
    // 示例：新增排序方式
    // custom: {
    //     label: '按自定义规则',
    //     getSortValue: (li) => {
    //         // 自定义提取排序值的逻辑
    //         const text = li.textContent;
    //         const customMatch = text.match(/自定义正则/);
    //         return customMatch ? parseInt(customMatch[0], 10) : Infinity;
    //     },
    //     inputMode: 'sequence' // 可选raw/sequence
    // }
  };

  // ===================== DOM元素创建 =====================
  const createSortSelect = () => {
    const select = document.createElement('select');
    // 遍历排序规则配置，生成下拉选项
    Object.entries(SORT_RULES).forEach(([value, rule]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = rule.label;
      // 默认选中第一个排序规则（按序号）
      if (value === 'number') option.selected = true;
      select.appendChild(option);
    });
    return select;
  };

  // 创建排序按钮
  const createSortButton = () => {
    const button = document.createElement('button');
    button.textContent = '自动排序';
    return button;
  };

  // ===================== 核心排序逻辑 =====================
  const handleSort = (sortType) => {
    // 1. 筛选目标条目（单行本）
    const targetItems = [
      ...document.querySelectorAll('#crtRelateSubjects li:has([value="1003"][selected])'),
      ...[...document.querySelectorAll('#crtRelateSubjects li:not(.old):has(.item_sort)')].filter(
        l => l.querySelector('select').value === '1003'
      ) // 适配 bangumi.wiki.mono.diff、bangumi.wiki.relate.new.order
    ];
    if (targetItems.length === 0) return;

    // 2. 获取当前选中的排序规则
    const currentRule = SORT_RULES[sortType];
    if (!currentRule) return;

    // 3. 处理每个条目，提取排序值
    const itemsWithSortValue = Array.from(targetItems).map(li => {
      // 提取排序值（用于排序）
      const sortValue = currentRule.getSortValue(li);
      return {
        element: li,
        sortValue: sortValue,
        rawValue: sortValue // 保存原始提取值（用于raw模式）
      };
    });

    // 4. 按排序值升序排列
    itemsWithSortValue.sort((a, b) => a.sortValue - b.sortValue);

    // 5. 根据排序规则填充input值并重新排列DOM
    const parent = document.querySelector('#crtRelateSubjects');
    if (parent) {
      itemsWithSortValue.forEach((item, index) => {
        const input = item.element.querySelector('input');
        if (input) {
          // 根据inputMode决定填充值：sequence=1开始的序号，raw=原始提取值
          const inputValue = currentRule.inputMode === 'sequence'
            ? index + 1
            : item.rawValue;

          input.value = inputValue;
          input.style.display = 'inline-block';
        }
        // 重新排列DOM元素
        parent.appendChild(item.element);
      });
    }
  };

  // ===================== 初始化 =====================
  const init = () => {
    const browserTools = document.querySelector('.browserTools');
    if (!browserTools) return;

    // 创建并添加元素
    const sortSelect = createSortSelect();
    const sortButton = createSortButton();
    browserTools.appendChild(sortSelect);
    browserTools.appendChild(sortButton);

    // 绑定点击事件
    sortButton.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedType = sortSelect.value;
      handleSort(selectedType);
    });
  };

  // 页面加载完成后初始化
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();