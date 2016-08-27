// ==UserScript==
// @name         Bangumi 点抛弃时自动勾选“仅自己可见”
// @namespace    bangumi.scripts.prevails.setprivacyondrop
// @author       "Donuts."
// @description  在所有你主动点"抛弃"的时刻, 自动勾选"仅自己可见".
// @version      1.0.2
// @include      /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/(update|subject)\/\d+(\?.*)?$/
// @grant        none
// @encoding     utf-8
// ==/UserScript==

const prv = document.getElementById('privacy');

let remain = prv.checked;
prv.addEventListener('click', () => remain = prv.checked);

function setPrivacy(val) {
    prv.checked = val;
}

for (let i of document.querySelectorAll('#dropped, #SecTab [onclick*=dropped]')) {
    i.addEventListener('click', () => setPrivacy(true));
}

const nonDropSelector = ['wish', 'collect', 'do', 'on_hold'].map(s => `#${s}, #SecTab [onclick*=${s}]`).join(', ');
for (let i of document.querySelectorAll(nonDropSelector)) {
    i.addEventListener('click', () => setPrivacy(remain));
}

if (/collect_type=5/.test(location.search)) {
    setPrivacy(true);
}
