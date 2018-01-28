// ==UserScript==
// @name        Bangumi 人物名日文汉字标音
// @include     /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(character|person)\/\d+(\/(collections|works(\/voice)?))?$/
// @namespace   bangumi.scripts.prevails.mononamerubytag
// @version     1.0.6
// @author      "Donuts."
// @grant       none
// ==/UserScript==

function ruby(kanji, kana) {
    return `<ruby><rb>${kanji}</rb><rp>（</rp><rt>${kana}</rt><rp>）</rp></ruby>`;
}

const found_h = []; // 高度符合
const found_l = []; // 可能符合

for (let i of document.querySelectorAll('#infobox > li')) {
    const desc = i.getElementsByClassName('tip')[0].innerText;
    if (RegExp('^(别名: )?$').test(desc)) {
        const otherName = i.childNodes[1].wholeText.trim();
        if (/^[\u3040-\u30ff]+\s+[\u3040-\u30ff]+$/.test(otherName)) {
            // 假名 中间空格 假名, 高度符合
            found_h.push(otherName);
        } else if (/^[\u3040-\u309f]+\s*[\u3040-\u30ff]+$/.test(otherName)) {
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

const nameAnchor = document.querySelector('.nameSingle > a');
const characterName = nameAnchor.innerText.trim();

const KANJI_MYOUJI = '[\u4e00-\u9fa5ヶノ々\ufa0e\ufa0f\ufa11\ufa13\ufa14\ufa1f\ufa21\ufa23\ufa24\ufa27\ufa28\ufa29]+';
const KANJI_NAMAE = '[\u4e00-\u9fa5々\ufa0e\ufa0f\ufa11\ufa13\ufa14\ufa1f\ufa21\ufa23\ufa24\ufa27\ufa28\ufa29]+';

function genRuby(name, kana) {
    const [myoujiKana, namaeKana] = kana.split(/\s+/); // namaeKana may be undefined
    if (namaeKana) kana = myoujiKana + ' ' + namaeKana;

    let re;
    if (RegExp(`^${KANJI_MYOUJI}$`).test(name)) { // 全汉字 无空格, 无法分词
        return ruby(name, kana);
    } else if (!!(re = RegExp(`^(${KANJI_MYOUJI})\\s+(${KANJI_NAMAE})$`).exec(name))) { // 全汉字 中间空格, beloved
        if (namaeKana) {
            const myouji = re[1];
            const namae = re[2];
            return ruby(myouji, myoujiKana) + ' ' + ruby(namae, namaeKana);
        } else {
            return ruby(name, kana);
        }
    } else if (!!(re = RegExp(`^(${KANJI_MYOUJI})\\s*(([\u3040-\u309f]+|[\u30a0-\u30ff]+)[子乃]?)$`).exec(name))) { // 汉字[空格]假名
        const myouji = re[1];
        const namae = re[2];
        if (namaeKana) {
            return ruby(myouji, myoujiKana) + ' ' + namae;
        } else {
            const namaeIndex = kana.lastIndexOf(namae);
            if (namaeIndex !== -1) {
                const myoujiKana = kana.slice(0, namaeIndex);
                return ruby(myouji, myoujiKana) + ' ' + namae;
            } else {
                return ruby(name, kana);
            }
        }
    } else if (!!(re = RegExp(`^([\u3040-\u309f]+|[\u30a0-\u30ff]+)\\s*(${KANJI_NAMAE})$`).exec(name))) { // 假名[空格]汉字
        const myouji = re[1];
        const namae = re[2];
        if (namaeKana) {
            return myouji + ' ' + ruby(namae, namaeKana);
        } else {
            const myoujiIndex = kana.lastIndexOf(myouji);
            if (myoujiIndex === 0) {
                const namaeKana = kana.slice(myouji.length);
                return myouji + ' ' + ruby(namae, namaeKana);
            } else {
                return ruby(name, kana);
            }
        }
    } else if (name === '澤村・スペンサー・英梨々') // eriri branch
        return ruby('澤村', 'さわむら') + '・スペンサー・' + ruby('英梨々', 'えりり');
}

const out = genRuby(characterName, kana);
if (out) {
    nameAnchor.innerHTML = out;
}
