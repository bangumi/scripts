// ==UserScript==
// @name        Bangumi 人物名日文汉字标音
// @include     /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(character|person)\/\d+(\/collections)?$/
// @namespace   bangumi.scripts.prevails.mononamerubytag
// @version     1.0.1
// @author      "Donuts."
// @grant       none
// ==/UserScript==

function getRuby(kanji, kana) {
    return `<ruby><rb>${kanji}</rb><rp>（</rp><rt>${kana}</rt><rp>）</rp></ruby>`;
}

let kana;
for (let i of document.querySelectorAll('#infobox > li')) {
    const desc = i.getElementsByClassName('tip')[0].innerText;
    if (RegExp('^(别名: )?$').test(desc)) {
        const otherName = i.childNodes[1].wholeText.trim();
        if (/^[\u3040-\u30ff]+[ 　]+[\u3040-\u30ff]+$/.test(otherName)) {
            // 假名 中间空格 假名, 高度符合, 直接跳出循环
            kana = otherName;
            break;
        } else if (/^[\u3040-\u309f]+[ 　]*[\u3040-\u30ff]+$/.test(otherName)) {
            // 平假名 [中间空格] 平假名或片假名, 可能符合(也可能是其它别名字段...), 继续找
            kana = otherName;
        }
    } else if ('纯假名: ' === desc) { // 极少见
        kana = i.childNodes[1].wholeText.trim();
        break;
    }
}

if (!kana) {
    return;
}

const [myoujiKana, namaeKana] = kana.split(/[ 　]+/); // namaeKana may be undefined

const nameAnchor = document.querySelector('.nameSingle > a');
const name = nameAnchor.innerText.trim();

const KANJI_MYOUJI = '[\u4e00-\u9fa5ヶノ々\ufa0e\ufa0f\ufa11\ufa13\ufa14\ufa1f\ufa21\ufa23\ufa24\ufa27\ufa28\ufa29]+';
const KANJI_NAMAE = '[\u4e00-\u9fa5々\ufa0e\ufa0f\ufa11\ufa13\ufa14\ufa1f\ufa21\ufa23\ufa24\ufa27\ufa28\ufa29]+';

if (RegExp(`^${KANJI_MYOUJI}$`).test(name)) { // 全汉字 无空格, 无法分词
    nameAnchor.innerHTML = getRuby(name, kana);
} else if (RegExp(`^${KANJI_MYOUJI}[ 　]+${KANJI_NAMAE}$`).test(name)) { // 全汉字 中间空格
    if (namaeKana) {
        const [myouji, namae] = name.split(/[ 　]+/);
        nameAnchor.innerHTML = getRuby(myouji, myoujiKana) + ' ' + getRuby(namae, namaeKana);
    } else {
        nameAnchor.innerHTML = getRuby(name, kana);
    }
} else if (RegExp(`^${KANJI_MYOUJI}[ 　]*[\u3040-\u309f子]+$`).test(name)) { // 汉字[空格]平假名
    const myouji = name.match(RegExp(KANJI_MYOUJI))[0];
    const namae = name.match(/[\u3040-\u309f子]+/)[0];
    if (namaeKana) {
        nameAnchor.innerHTML = getRuby(myouji, myoujiKana) + ' ' + namae;
    } else {
        const namaeIndex = kana.lastIndexOf(namae);
        if (namaeIndex !== -1) {
            const myoujiKana = kana.slice(0, namaeIndex);
            nameAnchor.innerHTML = getRuby(myouji, myoujiKana) + ' ' + namae;
        } else {
            nameAnchor.innerHTML = getRuby(name, kana);
        }
    }
} else if (RegExp(`^${KANJI_MYOUJI}[ 　]*[\u30a0-\u30ff子]+$`).test(name)) { // 汉字[空格]片假名
    const myouji = name.match(RegExp(KANJI_MYOUJI))[0];
    const namae = name.match(/[\u30a0-\u30ff子]{2,}/)[0];
    if (namaeKana) {
        nameAnchor.innerHTML = getRuby(myouji, myoujiKana) + ' ' + namae;
    } else {
        const namaeIndex = kana.lastIndexOf(namae || '蛤');
        if (namaeIndex !== -1) {
            const myoujiKana = kana.slice(0, namaeIndex);
            nameAnchor.innerHTML = getRuby(myouji, myoujiKana) + ' ' + namae;
        } else {
            nameAnchor.innerHTML = getRuby(name, kana);
        }
    }
}
