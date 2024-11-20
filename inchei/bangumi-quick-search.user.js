// ==UserScript==
// @name         班固米右上角快速搜索
// @namespace    https://bgm.tv/group/topic/409735
// @version      0.0.2
// @description  右上角搜索框输入文字后快速显示部分搜索结果
// @author       mov
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let timeoutId;
    const debounceDelay = 800; // 防抖延迟时间
    let currentRequestId = 0; // 当前请求ID
    let selectedIndex = -1; // 当前选中的结果索引

    const searchInput = document.querySelector('#search_text');
    const headerSearch = document.querySelector('#headerSearch');
    const siteSearchSelect = document.querySelector('#siteSearchSelect');

    if (!searchInput || !headerSearch || !siteSearchSelect) return;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        #searchOverlay {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 91;
            display: none;
        }

        html[data-theme="dark"] #searchOverlay {
            background: rgba(80, 80, 80, 0.7);
        }

        #suggestionBox {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            max-height: 300px;
            overflow-y: auto;
            background-color: rgba(254, 254, 254, 0.9);
            box-shadow: inset 0 1px 1px hsla(0, 0%, 100%, 0.3), inset 0 -1px 0 hsla(0, 0%, 100%, 0.1), 0 2px 4px hsla(0, 0%, 0%, 0.2);
            backdrop-filter: blur(5px);
            border-radius: 0 0 5px 5px;
            z-index: 90;
            display: none;
        }

        html[data-theme="dark"] #suggestionBox {
            background: rgba(80, 80, 80, 0.7);
        }

        #suggestionBox ul.ajaxSubjectList li:hover,
        #suggestionBox ul.ajaxSubjectList li.selected {
            background: #4F93CF;
            background: -moz-linear-gradient(top, #6BA6D8, #4F93CF);
            background: -o-linear-gradient(top, #6BA6D8, #4F93CF);
            background: -webkit-gradient(linear, left top, left bottom, from(#6BA6D8), to(#4F93CF));
        }

        #suggestionBox ul.ajaxSubjectList li.selected a {
            color: #FFF;
        }

        #suggestionBox ul.ajaxSubjectList li.selected small {
            color: #eee;
        }

        #errorMessage {
            padding: 8px;
        }

        @media (max-width: 640px) {
            #suggestionBox,
            #searchOverlay {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(styleSheet);

    searchInput.autocomplete = 'off';

    const suggestionBox = document.createElement('div');
    suggestionBox.id = 'suggestionBox';
    headerSearch.appendChild(suggestionBox);

    const overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    headerSearch.appendChild(overlay);

    searchInput.addEventListener('input', function() {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(function() {
            const query = searchInput.value.trim();
            if (query) {
                fetchSearchSuggestions(query, ++currentRequestId); // 发出新请求时增加请求ID
            } else {
                suggestionBox.style.display = 'none';
                overlay.style.display = 'none';
            }
        }, debounceDelay);
    });

    siteSearchSelect.addEventListener('change', function() {
        const query = searchInput.value.trim();
        if (query) {
            fetchSearchSuggestions(query, ++currentRequestId);
        }
    });

    document.addEventListener('click', function(event) {
        if (!headerSearch.contains(event.target)) {
            suggestionBox.style.display = 'none';
            overlay.style.display = 'none';
        }
    });

    searchInput.addEventListener('focus', function() {
        if (suggestionBox.innerHTML.trim() !== '') {
            suggestionBox.style.display = 'block';
        }
    });

    searchInput.addEventListener('keydown', function(event) {
        const suggestionItems = suggestionBox.querySelectorAll('li');
        if (event.key === 'Escape') {
            suggestionBox.style.display = 'none';
            overlay.style.display = 'none';
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (selectedIndex < suggestionItems.length - 1) {
                selectedIndex++;
                updateSelection(suggestionItems);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (selectedIndex > 0) {
                selectedIndex--;
                updateSelection(suggestionItems);
            } else {
                selectedIndex = -1;
                suggestionItems[0].classList.remove('selected');
            }
        } else if (event.key === 'Enter') {
            if (selectedIndex >= 0 && selectedIndex < suggestionItems.length) {
                event.preventDefault();
                suggestionItems[selectedIndex].querySelector('a').click();
            }
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function fetchSearchSuggestions(query, requestId) {
        if (requestId !== currentRequestId) return; // 如果请求ID不匹配，直接返回
        if (window.innerWidth < 640) return;

        const searchType = siteSearchSelect.value;
        if (searchType === 'person') {
            suggestionBox.style.display = 'none';
            overlay.style.display = 'none';
            return;
        }
        const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(query)}?type=${searchType}`;

        overlay.style.height = getComputedStyle(suggestionBox).getPropertyValue('height');
        overlay.style.display = 'block';

        fetch(url)
            .then(response => response.json())
            .then(data => {
                // 仅在请求ID匹配当前请求ID时更新DOM
                if (requestId === currentRequestId) {
                    renderList(data.list);
                }
            })
            .catch(error => {
                if (requestId === currentRequestId) {
                    suggestionBox.innerHTML = '<div id="errorMessage">搜索失败</div>';
                    suggestionBox.style.display = 'block';
                }
                console.error('搜索失败:', error);
            })
            .finally(() => {
                overlay.style.display = 'none';
            });
    }

    function renderList(data) {
        selectedIndex = -1; // 重置选中索引

        if (data.length <= 0) {
            suggestionBox.style.display = 'none';
            overlay.style.display = 'none';
            return;
        }

        const html = `<ul id="subjectList" class="subjectList ajaxSubjectList">
        ${ data.reduce((m, { id, type, images, name, name_cn }) => {
            type = ['书籍', '动画', '音乐', '游戏', '', '三次元'][type - 1];
            const grid = images?.grid;
            m += `<li class="clearit">
                    <a href="/subject/${id}" class="avatar h">
                      ${grid ? `<img src="${grid}" class="avatar ll">` : ''}
                    </a>
                    <div class="inner">
                      <small class="grey rr">${type}</small>
                      <p><a href="/subject/${id}" class="avatar h">${name}</a></p>
                      <small class="tip">${name_cn}</small>
                    </div>
                  </li>`;
            return m;
        }, '') }
        </ul>`;
        suggestionBox.innerHTML = html;
        suggestionBox.style.display = 'block';
    }
})();
