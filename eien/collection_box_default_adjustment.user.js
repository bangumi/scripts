// ==UserScript==
// @name         收藏箱默认动画/三次元/书籍
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  收藏箱默认动画/三次元/书籍
// @author       默沨
// @match        https://bangumi.tv/
// @match        https://bgm.tv/
// @match        https://chii.in/
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    chiiLib.ukagaka.addGeneralConfig({
        title: '收藏箱默认选项',
        name: 'collection_box_default',
        type: 'radio',
        defaultValue: 'anime',
        getCurrentValue: function () { return chiiApp.cloud_settings.get('collection_box_default') || 'anime'; },
        onChange: function (value) { chiiApp.cloud_settings.update({ 'collection_box_default': value }); chiiApp.cloud_settings.save(); },
        options: [
            { value: 'anime', label: '动画' },
            { value: 'real', label: '三次元' },
            { value: 'book', label: '书籍' }
        ]
    });

    const filterList = document.getElementById('prgCatrgoryFilter');
    if (!filterList) return;

    let targetLink = null;
    switch (chiiApp.cloud_settings.get('collection_box_default')) {
        case 'anime':
            targetLink = filterList.querySelector('a[subject_type="2"]');
            break;
        case 'real':
            targetLink = filterList.querySelector('a[subject_type="6"]');
            break;
        case 'book':
            targetLink = filterList.querySelector('a[subject_type="1"]');
            break;
        default:
            return;
    }

    const allFocus = filterList.querySelectorAll('.focus');
    allFocus.forEach(el => el.classList.remove('focus'));

    if (targetLink) {
        targetLink.classList.add('focus');
        targetLink.click();
    }

})();
