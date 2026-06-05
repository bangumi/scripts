// ==UserScript==
// @name         首页进度管理看过下一集
// @version      0.1
// @match        https://bgm.tv/
// @match        https://bangumi.tv/
// @match        https://chi.in/
// ==/UserScript==

(function() {
    'use strict';

    function isSpecialEpisode(li) {
        let prev = li.previousElementSibling;
        while (prev) {
            if (prev.classList && prev.classList.contains('subtitle')) {
                const span = prev.querySelector('span');
                return span && span.textContent.trim() === 'SP';
            }
            prev = prev.previousElementSibling;
        }
        return false;
    }

    // 存储每个条目对应的下一集信息
    const nextEpMap = new Map(); // key: subject_id, value: { nextEpId, nextEpText, isSp }

    const panels = document.querySelectorAll('div[id^="subjectPanel_"]');
    panels.forEach(panel => {
        const subjectId = panel.id.replace('subjectPanel_', '');
        const epListUl = panel.querySelector('ul.prg_list');
        if (!epListUl) return;

        const lis = epListUl.children; 
        if (!lis.length) return;

        let lastWatchedIndex = -1;

        for (let i = 0; i < lis.length; i++) {
            const li = lis[i];
            const watchedLink = li.querySelector('a.epBtnWatched');
            if (watchedLink) {
                lastWatchedIndex = i;
            }
        }

        if (lastWatchedIndex === -1) return; 

        let nextLink = null;
        let nextLi = null;
        for (let i = lastWatchedIndex + 1; i < lis.length; i++) {
            const li = lis[i];
            const link = li.querySelector('a[href^="/ep/"]');
            if (link) {
                nextLink = link;
                nextLi = li;
                break;
            }
        }

        if (!nextLink || !nextLi) return; 

        const nextEpId = nextLink.id.replace('prg_', '');
        const nextEpText = nextLink.textContent.trim(); 
        const isSp = isSpecialEpisode(nextLi); 

        nextEpMap.set(subjectId, { nextEpId, nextEpText, isSp });

        const checkInButtons = panel.querySelectorAll('.prgCheckIn');
        checkInButtons.forEach(btn => {
            btn.setAttribute('ep_id', nextEpId);

            const prefix = isSp ? 'sp' : 'ep';
            btn.innerHTML = btn.innerHTML.replace(/(ep|sp)\.\d+(\.\d+)?/, `${prefix}.${nextEpText}`);

            if (btn.dataset.originalTitle) {
                btn.dataset.originalTitle = btn.dataset.originalTitle.replace(/(ep|sp)\.\d+(\.\d+)?/, `${prefix}.${nextEpText}`);
            }
        });
    });

    const leftButtons = document.querySelectorAll('#prgSubjectList .prgCheckIn');
    leftButtons.forEach(btn => {
        const subjectId = btn.getAttribute('subject_id');
        if (!subjectId) return;
        const data = nextEpMap.get(subjectId);
        if (data) {
            const prefix = data.isSp ? 'sp' : 'ep';
            btn.setAttribute('ep_id', data.nextEpId);
            btn.innerHTML = btn.innerHTML.replace(/(ep|sp)\.\d+(\.\d+)?/, `${prefix}.${data.nextEpText}`);
            if (btn.dataset.originalTitle) {
                btn.dataset.originalTitle = btn.dataset.originalTitle.replace(/(ep|sp)\.\d+(\.\d+)?/, `${prefix}.${data.nextEpText}`);
            }
        }
    });
})();