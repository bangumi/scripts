// ==UserScript==
// @name         Bangumi 点抛弃时自动勾选“仅自己可见”
// @namespace    bangumi.scripts.prevails.setprivacyondrop
// @author       "Donuts."
// @description  在所有你主动点"抛弃"的时刻, 自动勾选"仅自己可见".
// @version      1
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

[
    document.getElementById('dropped'),
    document.querySelector('#SecTab [onclick*=dropped]'),
].forEach(i => {
    if (i) {
        i.addEventListener('click', () => setPrivacy(true));
    }
});

const collectTypeLabels = document.querySelectorAll('.collectType label');
// 想看 看过 在看 搁置 | 抛弃
//  0    1    2   3      4
for (let i = 0; i < 4; i++) {
    collectTypeLabels[i].addEventListener('click', () => setPrivacy(remain));
}

if (/collect_type=5\D?/.test(location.search)) {
    setPrivacy(true);
}
