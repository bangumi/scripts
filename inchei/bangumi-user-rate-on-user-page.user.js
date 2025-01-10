// ==UserScript==
// @name         时光机查询特定条目评价
// @namespace    https://bgm.tv/group/topic/411925
// @version      0.2.1
// @description  经济的同步率查询
// @author       mmv
// @include      /^https?:\/\/(((fast\.)?bgm\.tv)|chii\.in|bangumi\.tv)\/user\/[^/]+$/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.innerHTML = `
        div.userSynchronize.userSynchronizeSpecial {
            #subjectList {
                .tip {
                    color: #666;
                }
                li:hover small {
                    color: #EEE;
                }
                img.avatar {
                    border-radius: 5px;
                }
            }
            input[type=search]:focus {
                &:focus {
                    outline: none;
                }
            }
            select {
                color: #222;
            }
        }
        html[data-theme="dark"] div.userSynchronize.userSynchronizeSpecial {
            #subjectList {
                .tip {
                    color: #d8d8d8;
                }
                small {
                    color: #999;
                }
                li:hover small {
                    color: #EEE;
                }
            }
            select {
                color: #e0e0e1;
            }
        }
    `;
    document.body.append(style);

    const username = location.pathname.split('/').pop();
    const synchronize = document.querySelector('.userSynchronize');
    if (!synchronize) return;
    const frag = document.createDocumentFragment();

    const box = document.createElement('div');
    box.classList.add('userSynchronize', 'userSynchronizeSpecial');

    const inner = document.createElement('div');

    const title = document.createElement('h3');
    title.textContent = '特定同步率';

    const searchPanel = document.createElement('div');
    const dataPanel = document.createElement('div');
    const searchInputs = document.createElement('div');

    const input = document.createElement('input');
    input.classList.add('inputtext');
    input.enterkeyhint = 'search';
    input.type = 'search';
    input.autocomplete = 'false';
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') searchAndRender();
    });

    const searchResult = document.createElement('div');
    searchResult.classList.add('subjectListWrapper');
    searchResult.style = `
      max-height: 200px;
      overflow-y: scroll;
    `;
    const dataResult = document.createElement('div');

    const searchSelect = document.createElement('select');
    searchSelect.onchange = searchAndRender;

    const searchBtn = makeBtn('🔍');
    const makeSearching = () => document.createTextNode('搜索中……');
    searchBtn.onclick = searchAndRender;

    const dataBtn = makeBtn('🆔');
    dataBtn.onclick = async () => {
        const subject_id = input.value;
        if (!/\d+/.test(subject_id)) return;
        dataResult.innerHTML = '查询中……';
        const collection = await getUserCollection(subject_id);
        const name = collection.subject?.name;
        renderCollection(collection, dataResult, `/subject/${ subject_id }`, name);
    }

    frag.append(box);
    box.append(title, inner);
    inner.append(searchPanel, dataPanel);
    searchPanel.append(searchInputs, searchResult);
    searchInputs.append(searchSelect, input, searchBtn, dataBtn);
    dataPanel.append(dataResult);
    searchSelect.innerHTML = `<option value="all">全部</option>
                              <option value="2">动画</option>
                              <option value="1">书籍</option>
                              <option value="4">游戏</option>
                              <option value="3">音乐</option>
                              <option value="6">三次元</option>`;
    inner.style = `display: flex;
                   flex-wrap: wrap;`;
    searchPanel.style.flex = '0 1 300px';
    dataPanel.style.flex = '1 1 200px';
    searchInputs.style = `width: fit-content;
                          border-radius: 100px;
                          box-shadow: none;
                          border: 1px solid rgba(200, 200, 200, 0.5);
                          background-color: rgba(255, 255, 255, 0.2);`;
    searchSelect.style = `font-size: 1em;
                          padding: 4px 0 4px 5px;
                          width: fit-content;
                          border: none;
                          outline: none;
                          box-shadow: none;
                          background-color: transparent;
                          background-image: none;
                          -webkit-appearance: none;
                          -moz-appearance: none;
                          appearance: none;
                          border-radius: 0;
                          border-right: 1px solid rgba(200, 200, 200, 0.5)`;
    input.style = `font-size: 1em;
                   width: 120px;
                   -webkit-appearance: none;
                   -moz-appearance: none;
                   box-shadow: none;
                   background: transparent;
                   line-height: 20px;
                   border: none;`;

    synchronize.after(frag);

    async function searchAndRender() {
        const keyword = input.value;
        if (keyword === '') return;
        searchResult.innerHTML = '';
        const searching = makeSearching();
        searchResult.append(searching);
        const type = searchSelect.value;
        const data = await search(keyword, type);
        const list = data?.list;
        if (!list) {
            searchResult.innerText = '搜索失败';
            return;
        }
        if (list.length === 0) {
            searchResult.innerText = '未找到相关条目';
            return;
        }
        renderList(list, keyword, type, searchResult, async ({ href, textContent }) => {
            const subject_id = href.split('/').pop();
            dataResult.innerHTML = '查询中……';
            renderCollection((await getUserCollection(subject_id)), dataResult, href, textContent);
        });
        searching.remove();
    }

    function makeBtn(text) {
        const btn = document.createElement('a');
        btn.href = 'javascript:;';
        btn.innerText = text;
        btn.style = `text-wrap: nowrap;
                     border: none;
                     border-left: 1px solid rgba(200, 200, 200, 0.5);
                     padding: 4px 5px;
                     cursor: pointer;`
        return btn;
    }

    async function search(keyword, type, start=0) {
        try {
          const response = await fetch(`https://api.bgm.tv/search/subject/${encodeURI(keyword)}?type=${type}&max_results=10&start=${start}`);
          if (!response.ok) throw new Error(`API request ${ response.status } ${ response.statusText }`);
          return await response.json();
        } catch (error) {
          console.error(error);
          return null;
        }
    }

    function listHTML(list) {
        return list.reduce((m, { id, type, images, name, name_cn }) => {
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
        }, '');
    }

    function renderList(list, keyword, type, container, clickHandler) {
        const ul = document.createElement('ul');
        ul.id = 'subjectList';
        ul.classList.add('subjectList', 'ajaxSubjectList');
        ul.innerHTML = listHTML(list);

        const more = document.createElement('li');
        more.classList.add('clearit');
        more.textContent = '加载更多';
        more.style.cursor = 'pointer';
        more.style.textAlign = 'center';
        more.style.listStyle = 'none';
        more.start = list.length + 1;
        more.onclick = async () => {
            const searching = makeSearching();
            more.before(searching);
            const moreData = await search(keyword, type, more.start);
            const newlist = moreData.list;
            if (!newlist) {
                searching.remove();
                return;
            }
            more.start += newlist.length;
            ul.insertAdjacentHTML('beforeend', listHTML(newlist));
            applyHandler();
            searching.remove();
        }

        container.append(ul, more);
        applyHandler();

        function applyHandler() {
          ul.querySelectorAll('a').forEach(a => {
              a.addEventListener('click', e => {
                  e.preventDefault();
                  clickHandler(a);
              });
            });
        }
    }

    let accessToken;
    async function getUserCollection(subject_id) {
        try {
            const headers = {};
            if (accessToken) headers.Authorization = `Bearer ${ accessToken }`;
            const response = await fetch(`https://api.bgm.tv/v0/users/${username}/collections/${subject_id}`, { headers });
            if (response.ok) {
                return await response.json();
            } else if (response.status === 404) {
                return { not_found: true };
            } else if (response.status === 401) {
                return { auth_failed: true };
            } else {
              throw new Error(`API request ${ response.status } ${ response.statusText }`);
            }
        } catch (error) {
          console.error(error);
          return null;
        }
    }

    function renderCollection(data, container, fallbackLink='', fallbackName='本作') {
        if (!data) {
            container.innerHTML = '查询失败';
            return;
        }
        if (data.not_found || data.auth_failed) {
            let message = '';
            if (data.not_found) {
                message = `未找到${ fallbackLink ? `<a class="l" href="${fallbackLink}" target="_blank">${fallbackName}</a>` : fallbackName }的收藏记录`;
            } else if (data.auth_failed) {
                message = '个人令牌认证失败';
            }
            if (!accessToken || data.auth_failed) {
                message += '<br>试试<a class="l" href="javascript:" id="incheiat">填写</a>个人令牌后再试一遍？你可以在<a class="l" href="https://next.bgm.tv/demo/access-token/create" target="_blank">这里</a>创建个人令牌';
            }
            container.innerHTML = message;
            container.querySelector('#incheiat')?.addEventListener('click', () => {
                accessToken = prompt('请填写个人令牌 token');
                if (!accessToken) return;
                if (!accessToken.match(/^[a-zA-Z0-9]+$/)) {
                    accessToken = null;
                    alert('格式错误，请重新填写');
                    return;
                }
            });
            return;
        }

        const { rate, subject_type, type, comment, updated_at, ep_status, vol_status, subject } = data;
        const { id, name, name_cn, volumes, eps } = subject;
        const verb = ['读', '看', '听', '玩', '', '看'][subject_type - 1];
        const html = `<li id="item_${id}" class="item even clearit" style="list-style: none;">
                        <div class="inner" style="margin-left: 10px">
                        <h3>
                          ${ name_cn ? `<a href="/subject/${id}" class="l">${name_cn}</a> <small class="grey">${name}</small>`
                                     : `<a href="/subject/${id}" class="l">${name}</a>`
                          }
                        </h3>
                        <p class="collectInfo">
                          ${ rate ? `<span class="starstop-s"><span class="starlight stars${rate}"></span></span>`
                                  : ''
                          }
                          <span class="tip_j">${updated_at.slice(0, 10)}</span>
                          <span class="tip_i">/</span>
                          <span class="tip"> ${[`想${verb}`, `${verb}过`, `在${verb}`, '搁置', '抛弃'][type - 1]}</span>
                          ${ ep_status ? `
                          <span class="tip_i">/</span>
                          <span class="tip">
                          ${ ep_status }${ eps ? ` / ${eps}` : ''}话
                          </span>
                          ` : ''}
                          ${ vol_status ? `
                          <span class="tip_i">/</span>
                          <span class="tip">
                          ${ vol_status }${ eps ? ` / ${volumes}` : ''}卷
                          </span>
                          ` : ''}
                        </p>
                        ${ comment ? `
                          <div id="comment_box"><div class="item"><div class="text_main_even" style="float:none;width:unset">
                            <div class="text"> ${comment}</div>
                        <div class="text_bottom"></div>
                      </div></div></div></div>
                        ` : '' }
                    </li>`;
        container.innerHTML = html;
    }
})();
