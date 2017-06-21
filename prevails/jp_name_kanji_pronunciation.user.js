// ==UserScript==
// @name        Bangumi 人物名日文汉字标音
// @include     /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(character|person)\/\d+(\/(collections|works(\/voice)?))?$/
// @namespace   bangumi.scripts.prevails.mononamerubytag
// @version     1.0.4
// @author      "Donuts."
// @grant       none
// ==/UserScript==

function getRuby(kanji, kana) {
    return `<ruby><rb>${kanji}</rb><rp>（</rp><rt>${kana}</rt><rp>）</rp></ruby>`;
}

const found_h = []; // 高度符合
const found_l = []; // 可能符合

for (let i of document.querySelectorAll('#infobox > li')) {
    const desc = i.getElementsByClassName('tip')[0].innerText;
    if (RegExp('^(别名: )?$').test(desc)) {
        const otherName = i.childNodes[1].wholeText.trim();
        if (/^[\u3040-\u30ff]+[ 　]+[\u3040-\u30ff]+$/.test(otherName)) {
            // 假名 中间空格 假名, 高度符合
            found_h.push(otherName);
        } else if (/^[\u3040-\u309f]+[ 　]*[\u3040-\u30ff]+$/.test(otherName)) {
            // 平假名 [中间空格] 平假名或片假名, 可能符合(也可能是其它别名字段...)
            found_l.push(otherName);
        }
    } else if ('纯假名: ' === desc) { // 极少见
        found_h.push(i.childNodes[1].wholeText.trim());
        break;
    }
}

let kana;
if (found_h.length) {
    kana = found_h.pop(); // 因为 Bangumi 固定别名字段在自定义别名字段的后面, 故默认取最后一个
} else if (found_l.length) {
    kana = found_l.pop(); // 规则维持
} else return;

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
} else if (RegExp(`^${KANJI_MYOUJI}[ 　]*[\u3040-\u309f][\u3040-\u309f子乃]*$`).test(name)) { // 汉字[空格]平假名
    const myouji = name.match(RegExp(KANJI_MYOUJI))[0];
    const namae = name.match(/[\u3040-\u309f][\u3040-\u309f子乃]*/)[0];
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
} else if (RegExp(`^${KANJI_MYOUJI}[ 　]*[\u30a0-\u30ff][\u30a0-\u30ff子乃]*$`).test(name)) { // 汉字[空格]片假名
    const myouji = name.match(RegExp(KANJI_MYOUJI))[0];
    const namae = name.match(/[\u30a0-\u30ff][\u30a0-\u30ff子乃]*/g).pop(); // "ヶノ" match both KANJI_MYOUJI and \u30a0-\u30ff
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
