// ==UserScript==
// @name         半自动更新组件
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动更新 gadget 脚本
// @author       You
// @match        https://bgm.tv/dev/app/*
// @match        https://bangumi.tv/dev/app/*
// @match        https://chii.in/dev/app/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

/* global GM_xmlhttpRequest */

(async function () {
    'use strict';

    const API_BASE = 'http://localhost:3000/api';

    const submit = sessionStorage.getItem('gadgetSubmit');
    if (submit) {
        document.querySelector('.btnPink.green')?.click?.();
        sessionStorage.removeItem('gadgetSubmit');
    }

    const target = sessionStorage.getItem('gadgetsRedirect');
    if (target) {
        sessionStorage.removeItem('gadgetsRedirect');
        location.href = target;
    }

    const gadgets = JSON.parse(sessionStorage.getItem('gadgetsToPublish') || 'null') || await getGadgets();
    async function getGadgets() {
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${API_BASE}/gadgets`,
                    onload: resolve,
                    onerror: reject
                });
            });

            const gadgets = JSON.parse(response.responseText).data;
            return gadgets;
        } catch (error) {
            console.log('API check failed:', error);
            return [];
        }
    }

    if (!gadgets.length || !location.href.startsWith(gadgets[0].url)) return;

    const gadget = gadgets[0];

    const entryBtn = document.querySelector('.btnPink:not(.green)');
    if (entryBtn) {
        entryBtn.click();
        return;
    }

    const formVersion = document.querySelector('#formVersion');
    if (formVersion) {
        const formScript = document.querySelector('#formScript');
        const formEditSummary = document.querySelector('#formEditSummary');
        const form = document.querySelector('[name="app_modify"]');

        formVersion.value = gadget.version;
        formScript.value = gadget.content;
        formEditSummary.value = gadget.editSummary;

        form.addEventListener('submit', () => {
            gadgets.shift();
            if (!gadgets.length) {
                sessionStorage.removeItem('gadgetsToPublish');
            } else {
                sessionStorage.setItem('gadgetsToPublish', JSON.stringify(gadgets));
                sessionStorage.setItem('gadgetsRedirect', gadgets[0].url);
            }
            sessionStorage.setItem('gadgetSubmit', 'true');
        });
        // form.submit();
    }

    const entryAnchor = document.querySelector('.browserFull a');
    entryAnchor?.click?.();

})();
