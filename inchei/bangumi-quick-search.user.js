// ==UserScript==
// @name         班固米右上角快速搜索
// @namespace    https://bgm.tv/group/topic/409735
// @version      0.1.2
// @description  右上角搜索框输入文字后快速显示部分搜索结果
// @author       mov
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let timeoutId;
    const debounceDelay = 800; // 防抖延迟时间
    let currentRequestId = 0; // 当前请求ID
    let selectedIndex = -1; // 当前选中的结果索引
    let isComposing = false; // 是否正在输入法输入中

    const searchInput = document.querySelector('#search_text');
    const headerSearch = document.querySelector('#headerSearch');
    const siteSearchSelect = document.querySelector('#siteSearchSelect');

    if (!searchInput || !headerSearch || !siteSearchSelect) return;

    const searchClass = headerSearch.querySelector('form').action.split('/').pop();

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

    searchInput.addEventListener('compositionstart', function() {
        isComposing = true;
    });

    searchInput.addEventListener('compositionend', function() {
        isComposing = false;
        handleInput(); // 输入法结束后立即处理输入
    });

    searchInput.addEventListener('input', function() {
        if (!isComposing) handleInput();
    });

    function handleInput() {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(function() {
            const keyword = searchInput.value.trim();
            if (keyword) {
                fetchSearchSuggestions(keyword, ++currentRequestId); // 发出新请求时增加请求ID
            } else {
                suggestionBox.style.display = 'none';
                overlay.style.display = 'none';
            }
        }, debounceDelay);
    }

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

    const createFetch = method => async (url, body) => {
        const options = method === 'POST' ? { method, body: JSON.stringify(body) } : { method };
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const fetchGet = createFetch('GET');
    const fetchPost = createFetch('POST');

    const postSearch = async (cat, keyword, filter) => {
        const url = `https://api.bgm.tv/v0/search/${cat}`;
        const body = { keyword, filter };
        const result = await fetchPost(url, body);
        return result?.data;
    };

    const searchSubject = async (keyword, type) => { // 旧API结果为空时发生CORS错误，但新API搜索结果不准确，仍用旧API
        const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=${type}`;
        const result = await fetchGet(url);
        return result?.list;
    };
    // const searchSubject = (keyword, type) => postSearch('subjects', keyword, { type: [+type].filter(a => a) });
    const searchPrsn = keyword => postSearch('persons', keyword);
    const searchCrt = keyword => postSearch('characters', keyword);
    const searchPrsnCrt = async (keyword) => {
        const [prsn, crt] = await Promise.all([searchPrsn(keyword), searchCrt(keyword)]);
        return !prsn ? crt : !crt ? prsn : [...prsn, ...crt];
    };

    async function fetchSearchSuggestions(keyword, requestId) {
        if (requestId !== currentRequestId) return; // 如果请求ID不匹配，直接返回
        if (window.innerWidth < 640) return;

        overlay.style.height = getComputedStyle(suggestionBox).getPropertyValue('height');
        overlay.style.display = 'block';

        const type = siteSearchSelect.value;
        const data = searchClass === 'subject_search'
                   ? type === 'person' ? await searchPrsnCrt(keyword) : await searchSubject(keyword, type)
                   : type === 'all' ? await searchPrsnCrt(keyword)
                   : type === 'prsn' ? await searchPrsn(keyword) : await searchCrt(keyword);

        if (requestId === currentRequestId) { // 如果请求ID不匹配，直接返回
            if (data) {
                const cat = searchClass === 'subject_search'
                          ? type === 'person' ? 'person' : 'subject'
                          : type === 'prsn' ? 'person' : 'character';
                renderList(data, cat);
            } else {
                suggestionBox.innerHTML = '<div id="errorMessage">搜索失败</div>';
                suggestionBox.style.display = 'block';
            }
        }
        overlay.style.display = 'none';
    }

    function renderList(data, cat) {
        selectedIndex = -1; // 重置选中索引

        if (data.length === 0) {
            suggestionBox.style.display = 'none';
            overlay.style.display = 'none';
            return;
        }

        const html = `<ul id="subjectList" class="subjectList ajaxSubjectList">
        ${ data.reduce((m, { id, type, images, name,
                             name_cn, career, infobox }) => {
            name_cn ??= infobox?.find(({ key }) => key === '简体中文名')?.value;
            if (cat !== 'subject') cat = career ? 'person' : 'character';
            type = cat === 'subject' ? ['书籍', '动画', '音乐', '游戏', '', '三次元'][type - 1] : null;
            const grid = images?.grid;
            const exist = v => v ? v : '';
            m += `<li class="clearit">
                    <a href="/${ cat }/${ id }" class="avatar h">
                      ${ grid ? `<img src="${ grid }" class="avatar ll">` : ''}
                    </a>
                    <div class="inner">
                      <small class="grey rr">${ exist(type) }</small>
                      <p><a href="/${ cat }/${ id }" class="avatar h">${ name }</a></p>
                      <small class="tip">${ exist(name_cn) }</small>
                    </div>
                  </li>`;
            return m;
        }, '') }
        </ul>`;
        suggestionBox.innerHTML = html;
        suggestionBox.style.display = 'block';
    }

})();
