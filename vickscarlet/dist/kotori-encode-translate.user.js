// ==UserScript==
// @name         加密通信翻译
// @namespace    kotorichan_app
// @version      0.0.1
// @description  Bangumi 加密通信翻译
// @author       Vick Scarlet ([BGM] 神戸小鳥＠vickscarlet)
// @include      /^https?://(bgm.tv|bangumi.tv|chii.in)*
// @grant        none
// ==/UserScript==
// jshint esversion: 6

class DC {
    constructor() {
        const dcv = (arr,dict,s)=>arr.forEach((v,i)=>dict[v]=s?""+i:i);

        // 歪比吧卜
        dcv(
            (this.wbc1=["歪", "比", "吧"]),
            (this.wbc2={}),
            true
        );

        // 篝语
        dcv(
            (this.kc1=["██","█▉","█▊","█▋","█▌","█▍","█▎","█▏","▉█","▉▉","▉▊","▉▋","▉▌","▉▍","▉▎","▉▏","▊█","▊▉","▊▊","▊▋","▊▌","▊▍","▊▎","▊▏","▋█","▋▉","▋▊","▋▋","▋▌","▋▍","▋▎","▋▏","▌█","▌▉","▌▊","▌▋","▌▌","▌▍","▌▎","▌▏","▍█","▍▉","▍▊","▍▋","▍▌","▍▍","▍▎","▍▏","▎█","▎▉","▎▊","▎▋","▎▌","▎▍","▎▎","▎▏","▏█","▏▉","▏▊","▏▋","▏▌","▏▍","▏▎","▏▏","▓▓"]),
            (this.kc2={})
        );
    }

    get raw() { return ''+this._raw; }
    set raw(v='') { this._raw = v; }

    // 歪比吧卜
    get waibi() {
        let str = this.raw;
        let len = str.length;
        let res = '';
        const charWaibi = (c) => {
            const dic = this.wbc1;
            let l = c.length;
            let r = "";
            for (let i = 0; i < l; i++) {
                r += dic[c[i]];
            }
            return r;
        };
        for (let i = 0; i < len; i++) {
            let tmp = str[i].charCodeAt(0).toString(3);
            res += charWaibi(tmp) + "卜";
        }
        return res;
    }

    set waibi(v='') {
        const charWaibi = (c) => {
            const dic = this.wbc2;
            let l = c.length;
            let r = "";
            for (let i = 0; i < l; i++) {
                r += dic[c[i]] || "";
            }
            return r;
        };
        let arr = v.split("卜");
        arr.pop();
        let res = arr.reduce((a, c) => {
            if (c) {
                let code = parseInt(charWaibi(c) || 0, 3);
                return a + String.fromCharCode(code);
            } else {
                return a;
            }
        }, '');
        this.raw = res;
    }

    // 篝语
    get kagari() {
        let t = [], n, r, i, s, o, u, a, f = 0,
        e = (e =>{
            e = e.replace(/rn/g, "n");
            let t = "";
            for (let n = 0; n < e.length; n++) {
                let r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r);
                } else if (r > 127 && r < 2048) {
                    t += String.fromCharCode(r >> 6 | 192);
                    t += String.fromCharCode(r & 63 | 128);
                } else {
                    t += String.fromCharCode(r >> 12 | 224);
                    t += String.fromCharCode(r >> 6 & 63 | 128);
                    t += String.fromCharCode(r & 63 | 128);
                }
            }
            return t;
        })(this.raw);
        const kc = this.kc1;
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64;
            } else if (isNaN(i)) {
                a = 64;
            }
            t +=kc[s]+
                kc[o]+
                kc[u]+
                kc[a];
        }
        return t;
    }
    set kagari(e='') {
        let t = "", n, r, i,s, o, u, a, f = 0;
        const kc = this.kc2;
        while (f < e.length) {
            s = kc[e.charAt(f++)+e.charAt(f++)];
            o = kc[e.charAt(f++)+e.charAt(f++)];
            u = kc[e.charAt(f++)+e.charAt(f++)];
            a = kc[e.charAt(f++)+e.charAt(f++)];
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r);
            }
            if (a != 64) {
                t = t + String.fromCharCode(i);
            }
        }

        this.raw = (e => {
            let t = "", n = 0, r = 0, c1 = 0, c2 = 0, c3;
            while (n < e.length) {
                r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r);
                    n++;
                } else if (r > 191 && r < 224) {
                    c2 = e.charCodeAt(n + 1);
                    t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                    n += 2;
                } else {
                    c2 = e.charCodeAt(n + 1);
                    c3 = e.charCodeAt(n + 2);
                    t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                    n += 3;
                }
            }
            return t;
        })(t);
    }

}

const dc = new DC();

const handler = element => {
    let html = $(element).html();
    const decode = (html,regex,type) =>{
        let match = null;
        while((match=regex.exec(html))) {
            const matchStr = match[0];
            dc[type] = matchStr;
            html = html.replace(matchStr,`<span class="kotoridecode" kotoridecode="${type}">${dc.raw}</span>`);
        }
        return html;
    };

    html = decode(html,/[歪比吧卜]+/g,'waibi');
    html = decode(html,/([█▉▊▋▌▍▎▏]{2})+(▓▓)*/g,'kagari');
    $(element).html(html);
};

const selectHandler = selecter => $(selecter).each((idx,element)=>handler(element));

$(document).ready(function(){
    selectHandler(".topic_content");
    selectHandler(".message");
    selectHandler(".cmt_sub_content");
});