// ==UserScript==
// @name         新增关联条目可同时修改顺序
// @namespace    bangumi.wiki.relate.new.order
// @version      0.0.1
// @description  新增关联条目时即可排序，无需两次关联
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        https://bgm.tv/subject/*/add_related/subject/*
// @match        https://bangumi.tv/subject/*/add_related/subject/*
// @match        https://chii.in/subject/*/add_related/subject/*
// @grant        none
// @license      MIT
// @gf
// @gadget       https://bgm.tv/dev/app/5719
// ==/UserScript==

(function () {
    'use strict';

    (new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (!n.matches?.('li:not(.old)')) continue;
                if (n.querySelector('.item_sort')) continue;
                const s = n.querySelector('select');
                const prefix = s.name?.match(/^(infoArr\[[^\]]+\])/)?.[1];
                s.insertAdjacentHTML('afterend',
                    `<input type="text" name="${prefix}[order]" value="0" class="inputtext item_sort" onfocus="this.select()" onmouseover="this.focus()" autocomplete="off" style="display: inline-block;">`
                );
            }
        }
    })).observe(document.querySelector('#crtRelateSubjects'), {
        childList: true,
        subtree: true
    });
})();
