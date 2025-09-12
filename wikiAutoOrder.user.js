// ==UserScript==
// @name         BGM 关联书籍排序工具
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动提取关联书籍的数字并按顺序排序
// @author       你的名字
// @match        https://bgm.tv/subject/*/add_related/subject/book
// @match        https://bangumi.tv/subject/*/add_related/subject/book
// @match        https://chii.in/subject/*/add_related/subject/book
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 创建处理按钮
    const button = document.createElement('button');
    button.textContent = '自动排序';

    // 添加按钮到页面
    const browserTools = document.querySelector('.browserTools');
    if (browserTools && button) {
        browserTools.appendChild(button);
    }

    // 按钮点击事件处理
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        // 选择所有关系类型为1003（单行本）的条目
        const targetItems = document.querySelectorAll('#crtRelateSubjects li:has([value="1003"][selected])');
        if (targetItems.length === 0) return;

        const itemsWithNumbers = Array.from(targetItems).map(li => {
            const linkText = li.querySelector('a.l')?.textContent || '';
            const numberMatch = linkText.match(/\d+/);
            const number = numberMatch ? parseInt(numberMatch[0], 10) : null;

            const input = li.querySelector('input');
            if (input && number !== null) {
                input.value = number;
                input.style.display = 'inline-block';
            }

            return {
                element: li,
                number: number !== null ? number : Infinity
            };
        });

        // 按数字排序
        itemsWithNumbers.sort((a, b) => a.number - b.number);

        // 重新排列DOM元素
        const parent = document.querySelector('#crtRelateSubjects');
        if (parent) {
            for (const item of itemsWithNumbers) {
                parent.appendChild(item.element);
            }
        }
    });
})();
