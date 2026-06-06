// ==UserScript==
// @name         排行榜筛选工具：筛选已标记条目，并按时间或话数区间筛选作品
// @namespace    http://bgm.tv/
// @version      1.2
// @author       KunimiSaya
// @match        https://bgm.tv/*/browser*
// @match        https://bangumi.tv/*/browser*
// @match        https://chii.in/*/browser*
// @match        https://bgm.tv/*/tag/*
// @match        https://bangumi.tv/*/tag/*
// @match        https://chii.in/*/tag/*
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
    'use strict';

    // 存储键名
    const STORAGE_KEY_HIDE_COLLECTED = 'bgm_filter_hide_collected';
    const STORAGE_KEY_HIDE_NO_EP = 'bgm_filter_hide_no_ep';

    let isHidingEnabled = true;
    let startDate = null;
    let endDate = null;
    let minEpisodes = null;
    let maxEpisodes = null;
    let isHideNoEpisodes = false;

    // 加载保存的设置
    function loadSettings() {
        const savedHideCollected = localStorage.getItem(STORAGE_KEY_HIDE_COLLECTED);
        if (savedHideCollected !== null) {
            isHidingEnabled = savedHideCollected === 'true';
        }
        const savedHideNoEp = localStorage.getItem(STORAGE_KEY_HIDE_NO_EP);
        if (savedHideNoEp !== null) {
            isHideNoEpisodes = savedHideNoEp === 'true';
        }
    }

    // 保存设置
    function saveHideCollectedState() {
        localStorage.setItem(STORAGE_KEY_HIDE_COLLECTED, isHidingEnabled);
    }

    function saveHideNoEpState() {
        localStorage.setItem(STORAGE_KEY_HIDE_NO_EP, isHideNoEpisodes);
    }

    // 更新按钮文本（无背景色）
    function updateToggleButton(btn) {
        if (isHidingEnabled) {
            btn.textContent = '隐藏已收藏条目 （已开启）';
        } else {
            btn.textContent = '隐藏已收藏条目 （已关闭）';
        }
    }

    function updateHideNoEpButton(btn) {
        if (isHideNoEpisodes) {
            btn.textContent = '隐藏话数不明条目 （已开启）';
        } else {
            btn.textContent = '隐藏话数不明条目 （已关闭）';
        }
    }

    function injectStyles() {
        const css = `
        #filterControls .bs-control-row {
            margin-top: 10px;
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            align-items:center;
        }
        #filterControls .bs-filter-control { margin-left:6px; box-sizing:border-box; }
        #filterControls input[type="number"],
        #filterControls input[type="month"],
        #filterControls select,
        #filterControls .bs-month-wrap {
            border: 1px solid #d0d0d0;
            border-radius: 6px;
            padding: 6px 8px;
            height: 34px;
            font-size: 13px;
            background: #fff;
            -webkit-appearance: none;
            appearance: none;
            box-sizing: border-box;
        }
        #filterControls a.chiiBtn { margin-left:6px; }
        #filterControls .bs-error {
            color: #c0392b;
            font-size: 12px;
            margin-left: 6px;
            min-height: 18px;
            align-self: center;
        }
        #filterControls .bs-month-wrap {
            display:inline-flex;
            gap:6px;
            align-items:center;
        }
        #filterControls .bs-month-wrap select {
            height:34px;
            padding:6px 8px;
            border-radius:6px;
            border:1px solid #d0d0d0;
            background:#fff;
        }
        #filterControls .bs-toggle-row {
            margin-top: 12px;
            margin-bottom: 4px;
        }
        #filterControls .bs-single-btn-row {
            margin-top:6px;
            margin-bottom:4px;
        }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    function extractDate(infoText) {
        const datePatterns = [
            /(\d{4})年(\d{1,2})月/,
            /(\d{4})-(\d{2})-(\d{2})/,
            /(\d{4})-(\d{2})/,
            /(\d{4})/,
        ];
        for (const pattern of datePatterns) {
            const match = infoText.match(pattern);
            if (match) {
                const year = parseInt(match[1], 10);
                const month = match[2] ? parseInt(match[2], 10) : 1;
                return new Date(year, month - 1);
            }
        }
        return null;
    }

    function extractEpisodes(infoText) {
        const match = infoText.match(/(\d+)(话|集)/);
        return match ? parseInt(match[1], 10) : null;
    }

    function filterCollectedItems(items) {
        items.forEach(item => {
            const isCollected = item.querySelector('.collectModify');
            if (isHidingEnabled && isCollected) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });
    }

    function filterByDate(items) {
        items.forEach(item => {
            const info = item.querySelector('.info');
            if (!info) return;
            const date = extractDate(info.textContent);
            if (date) {
                if ((startDate && date < startDate) || (endDate && date > endDate)) {
                    item.style.display = 'none';
                }
            }
        });
    }

    function filterByEpisodes(items) {
        items.forEach(item => {
            const info = item.querySelector('.info');
            if (!info) return;
            const episodes = extractEpisodes(info.textContent);
            if (episodes !== null) {
                if ((minEpisodes !== null && episodes < minEpisodes) ||
                    (maxEpisodes !== null && episodes > maxEpisodes)) {
                    item.style.display = 'none';
                }
            }
        });
    }

    function filterByNoEpisodes(items) {
        items.forEach(item => {
            const info = item.querySelector('.info');
            if (!info) return;
            const episodes = extractEpisodes(info.textContent);
            if (isHideNoEpisodes && episodes === null) {
                item.style.display = 'none';
            }
        });
    }

    function applyFilters() {
        const items = document.querySelectorAll('.item');
        items.forEach(item => item.style.display = '');
        filterCollectedItems(items);
        filterByDate(items);
        filterByEpisodes(items);
        filterByNoEpisodes(items);
    }

    function supportsInputType(type) {
        const input = document.createElement('input');
        input.setAttribute('type', type);
        return input.type === type;
    }

    function createMonthControl(placeholder) {
        const isMonthSupported = supportsInputType('month');
        if (isMonthSupported) {
            const input = document.createElement('input');
            input.type = 'month';
            input.placeholder = placeholder || '';
            input.classList.add('bs-filter-control');
            input.style.width = '120px';
            return {
                el: input,
                getDate: () => input.value ? new Date(input.value + '-01') : null,
                setValueFromDate: (d) => { input.value = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}` : ''; }
            };
        }

        const wrap = document.createElement('span');
        wrap.className = 'bs-month-wrap bs-filter-control';

        const yearSelect = document.createElement('select');
        const monthSelect = document.createElement('select');

        const currentYear = new Date().getFullYear();
        const minYear = 1900;
        const maxYear = currentYear + 5;

        for (let y = maxYear; y >= minYear; y--) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            yearSelect.appendChild(opt);
        }

        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '--';
        monthSelect.appendChild(emptyOpt);

        for (let m = 1; m <= 12; m++) {
            const opt = document.createElement('option');
            opt.value = String(m).padStart(2, '0');
            opt.textContent = String(m).padStart(2, '0');
            monthSelect.appendChild(opt);
        }

        wrap.appendChild(yearSelect);
        wrap.appendChild(monthSelect);

        return {
            el: wrap,
            getDate: () => (!yearSelect.value || !monthSelect.value) ? null : new Date(parseInt(yearSelect.value,10), parseInt(monthSelect.value,10)-1,1),
            setValueFromDate: (d) => { yearSelect.value = d ? String(d.getFullYear()) : String(currentYear); monthSelect.value = d ? String(d.getMonth()+1).padStart(2,'0') : ''; }
        };
    }

    function addControls() {
        const sideInner = document.querySelector('.sideInner');
        if (!sideInner) return;
        if (document.getElementById('filterControls')) return;

        injectStyles();

        const controls = document.createElement('div');
        controls.id = 'filterControls';
        controls.style.marginTop = '20px';

        const title = document.createElement('h2');
        title.className = 'subtitle';
        title.textContent = '筛选工具';
        controls.appendChild(title);

        const toggleRow = document.createElement('div');
        toggleRow.className = 'bs-toggle-row';

        const toggleButton = document.createElement('a');
        toggleButton.className = 'chiiBtn bs-filter-control';
        toggleButton.href = 'javascript:void(0);';
        updateToggleButton(toggleButton);
        toggleButton.onclick = () => {
            isHidingEnabled = !isHidingEnabled;
            saveHideCollectedState();
            updateToggleButton(toggleButton);
            applyFilters();
        };
        toggleRow.appendChild(toggleButton);
        controls.appendChild(toggleRow);

        const dateControlsRow = document.createElement('div');
        dateControlsRow.className = 'bs-control-row';

        const startMonth = createMonthControl('起始日期');
        startMonth.el.style.width = '120px';
        const endMonth = createMonthControl('结束日期');
        endMonth.el.style.width = '120px';

        const dateFilterButton = document.createElement('a');
        dateFilterButton.className = 'chiiBtn bs-filter-control';
        dateFilterButton.href = 'javascript:void(0);';
        dateFilterButton.textContent = '按时间区间筛选';
        dateFilterButton.onclick = () => {
            startDate = startMonth.getDate();
            endDate = endMonth.getDate();
            if (startDate && endDate && startDate > endDate) { const temp = startDate; startDate = endDate; endDate = temp; }
            applyFilters();
        };

        const cancelDateFilterButton = document.createElement('a');
        cancelDateFilterButton.className = 'chiiBtn bs-filter-control';
        cancelDateFilterButton.href = 'javascript:void(0);';
        cancelDateFilterButton.textContent = '取消时间区间筛选';
        cancelDateFilterButton.onclick = () => {
            startDate = null;
            endDate = null;
            if (startMonth.setValueFromDate) startMonth.setValueFromDate(null);
            if (endMonth.setValueFromDate) endMonth.setValueFromDate(null);
            applyFilters();
        };

        dateControlsRow.appendChild(startMonth.el);
        dateControlsRow.appendChild(endMonth.el);
        dateControlsRow.appendChild(dateFilterButton);
        dateControlsRow.appendChild(cancelDateFilterButton);
        controls.appendChild(dateControlsRow);

        const episodesControlsRow = document.createElement('div');
        episodesControlsRow.className = 'bs-control-row';

        const minEpisodesInput = document.createElement('input');
        minEpisodesInput.type = 'number';
        minEpisodesInput.placeholder = '最小话数';
        minEpisodesInput.className = 'bs-filter-control';
        minEpisodesInput.style.width = '120px';
        minEpisodesInput.min = '1';

        const maxEpisodesInput = document.createElement('input');
        maxEpisodesInput.type = 'number';
        maxEpisodesInput.placeholder = '最大话数';
        maxEpisodesInput.className = 'bs-filter-control';
        maxEpisodesInput.style.width = '120px';

        const episodesFilterButton = document.createElement('a');
        episodesFilterButton.className = 'chiiBtn bs-filter-control';
        episodesFilterButton.href = 'javascript:void(0);';
        episodesFilterButton.textContent = '按话数区间筛选';

        const cancelEpisodesFilterButton = document.createElement('a');
        cancelEpisodesFilterButton.className = 'chiiBtn bs-filter-control';
        cancelEpisodesFilterButton.href = 'javascript:void(0);';
        cancelEpisodesFilterButton.textContent = '取消话数区间筛选';
        cancelEpisodesFilterButton.onclick = () => {
            minEpisodes = null;
            maxEpisodes = null;
            minEpisodesInput.value = '';
            maxEpisodesInput.value = '';
            applyFilters();
        };

        const episodesError = document.createElement('div');
        episodesError.className = 'bs-error';

        episodesFilterButton.onclick = () => {
            episodesError.textContent = '';
            const minRaw = minEpisodesInput.value;
            const maxRaw = maxEpisodesInput.value;
            const minVal = minRaw ? parseInt(minRaw, 10) : null;
            const maxVal = maxRaw ? parseInt(maxRaw, 10) : null;
            if (minVal !== null && minVal < 1) { episodesError.textContent = '最小话数不得小于 1。'; return; }
            if (minVal !== null && maxVal !== null && maxVal <= minVal) { episodesError.textContent = '最大话数必须大于最小话数。'; return; }
            minEpisodes = minVal; maxEpisodes = maxVal;
            applyFilters();
        };

        episodesControlsRow.appendChild(minEpisodesInput);
        episodesControlsRow.appendChild(maxEpisodesInput);
        episodesControlsRow.appendChild(episodesFilterButton);
        episodesControlsRow.appendChild(cancelEpisodesFilterButton);
        episodesControlsRow.appendChild(episodesError);
        controls.appendChild(episodesControlsRow);

        const hideNoEpisodesRow = document.createElement('div');
        hideNoEpisodesRow.className = 'bs-single-btn-row';

        const hideNoEpisodesButton = document.createElement('a');
        hideNoEpisodesButton.className = 'chiiBtn bs-filter-control';
        hideNoEpisodesButton.href = 'javascript:void(0);';
        updateHideNoEpButton(hideNoEpisodesButton);
        hideNoEpisodesButton.onclick = () => {
            isHideNoEpisodes = !isHideNoEpisodes;
            saveHideNoEpState();
            updateHideNoEpButton(hideNoEpisodesButton);
            applyFilters();
        };

        hideNoEpisodesRow.appendChild(hideNoEpisodesButton);
        controls.appendChild(hideNoEpisodesRow);

        sideInner.appendChild(controls);
    }

    function observePageChanges() {
        const observer = new MutationObserver(() => {
            if (!document.getElementById('filterControls')) addControls();
            applyFilters();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        loadSettings();
        addControls();
        applyFilters();
        observePageChanges();
    }

    init();
})();