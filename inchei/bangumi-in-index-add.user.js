// ==UserScript==
// @name         目录内添加条目增强
// @namespace    https://bgm.tv/group/topic/409246
// @version      0.1.0
// @description  为 bangumi 增加在目录内搜索条目并添加的功能，添加后跳转至对应位置，兼容“目录批量添加与编辑”
// @author       mmm
// @include      http*://bgm.tv/index/*
// @include      http*://chii.in/index/*
// @include      http*://bangumi.tv/index/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bgm.tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const box = document.querySelector('#newIndexRelatedForm');

    const input = box.querySelector('.inputtext');
    input.style.position = 'sticky';
    input.style.top = 0;

    const result = document.createElement('div');
    result.classList.add('subjectListWrapper');
    box.append(result);

    const btn = makeBtn();
    btn.onclick = async () => {
        await btnHandler(input, result, input);
        document.querySelector('#TB_ajaxContent').style.height = '250px';
        document.querySelector('#TB_window').style.height = 'unset';
    }
    box.querySelector('#submitBtnO').append(btn);

    function makeBtn() {
        const btn = document.createElement('a');
        btn.classList.add('fancyBtn');
        btn.href = 'javascript:;';
        btn.innerText = '搜索';
        return btn;
    }

    async function btnHandler(input, result, target, append) {
        const keyword = input.value;
        if (keyword === '') return;
        result.innerText = '搜索中……';
        const list = await search(keyword);
        renderList(list, result, target, append);
    }

    async function search(keyword) {
        try {
            const response = await fetch(`https://api.bgm.tv/search/subject/${encodeURI(keyword)}`);
            if (!response.ok) throw new Error('API request failed');
            let { list } = await response.json();
            return list;
        } catch (error) {
            console.error('目录内搜索条目并添加: Error fetching subject info from API: ', error);
            result.innerText = '搜索错误，请重试！';
        }
    }

    function renderList(list, container, target, append=false) {
        const html = `<ul id="subjectList" class="subjectList ajaxSubjectList">
        ${ list.reduce((m, { id, url, type, images, name, name_cn }) => {
            type = ['书籍', '动画', '音乐', '游戏', '', '三次元'][type - 1];
            const { grid } = images;
            m += `<li class="clearit">
                    <a href="${url}" class="avatar h">
                      <img src="${grid}" class="avatar ll">
                    </a>
                    <div class="inner">
                      <small class="grey rr">${type}</small>
                      <p><a href="${url}" class="avatar h">${name}</a></p>
                      <small class="tip">${name_cn}</small>
                    </div>
                  </li>`;
            return m;
        }, '') }
        </ul>`;
        container.innerHTML = html;
        container.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                if (append) {
                    target.value += e.target.href + '\n';
                } else {
                    target.value = e.target.href;
                }
            })
        });
    }

    // 兼容“目录批量添加与编辑”（https://bgm.tv/dev/app/1037）
    const div2HTML = `<div style="width: 30%" id="indexSearchNew">
      <input class="inputtext" type="text"></input>
      <a class="fancyBtn" href="javascript:;">搜索</a>
      <div class="subjectListWrapper" style="height: 200px; overflow-y: scroll"></div>
    </div>`;
    const observer = monitorElement('.bibeBox', elem => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-evenly';
        container.style.height = '300px';
        container.style.padding = '5px';
        elem.previousSibling.after(container);
        elem.parentNode.style.marginTop = '-150px';
        const div1 = document.createElement('div');
        div1.style.width = '60%';
        div1.append(elem, document.querySelector('#submit_list'));
        container.append(div1);
        container.insertAdjacentHTML('beforeend', div2HTML);
        const div2 = document.querySelector('#indexSearchNew');
        div2.querySelector('.fancyBtn').onclick = async () => {
            await btnHandler(div2.querySelector('input'), div2.querySelector('.subjectListWrapper'), elem.querySelector('textarea'), true);
        }
    });

    // Microsoft Copilot start
    function monitorElement(selector, callback) {
        const targetNode = document.body; // 监视整个文档的变化
        const config = { childList: true, subtree: true }; // 配置监视选项

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    addedNodes.forEach(node => {
                        if (node.matches && node.matches(selector)) {
                            callback(node);
                        } else if (node.querySelectorAll) {
                            const matchingElements = node.querySelectorAll(selector);
                            matchingElements.forEach(matchingNode => callback(matchingNode));
                        }
                    });
                }
            }
        });

        observer.observe(targetNode, config);

        return observer; // 返回观察者实例，以便在需要时断开观察
    }
    // end

    // 添加后跳转
    const lastHref = sessionStorage.getItem('incheijs_indexsearch');
    if (lastHref) {
        const addedElem = document.querySelector(`a[href*="${lastHref}"]`);
        console.log(lastHref, addedElem)
        addedElem?.scrollIntoView({ behavior: 'smooth' });
        sessionStorage.removeItem('incheijs_indexsearch');
    }
    box.querySelectorAll('.inputBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = input.value.split('/').at(-1);
            if (!id) return;
            const type = ['subject', 'character', 'person', 'ep'][document.querySelector('.switchTab.focus').id[4]];
            sessionStorage.setItem('incheijs_indexsearch', `${type}/${id}`);
        });
    });

})();
