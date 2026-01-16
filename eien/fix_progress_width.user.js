// ==UserScript==
// @name         Bangumi 收藏箱未知话数进度条修改
// @namespace    fix_progress_width_mofeng
// @version      0.0.1
// @description  Bangumi 收藏箱中，修正未知话数（?话）条目进度条宽度显示问题
// @author       默沨
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @grant        none
// ==/UserScript==

(function () {
    const ulElement = document.getElementById('prgSubjectList');
    if (!ulElement) return;

    const listItems = ulElement.querySelectorAll('li[subject_type="2"].clearit');

    listItems.forEach(item => {
        const progressText = item.querySelector('small.rr.progress_percent_text');
        if (!progressText) return;

        const text = progressText.textContent.trim();

        const match = text.match(/\[(\d+)\/(\?\?|\d+)\]/);
        if (!match) return;

        const currentProgress = parseInt(match[1], 10);
        const totalProgress = match[2];

        if (totalProgress !== '??') return;

        const defaultTotal = 12;

        let percentage = (currentProgress / defaultTotal) * 100;

        if (percentage > 100) {
            percentage = 100;
        }

        const percentageStr = percentage.toFixed(2) + '%';
        const progressBar = item.querySelector('p.listProgress span');

        if (progressBar) {
            progressBar.style.width = percentageStr;
        }
    });
})();
