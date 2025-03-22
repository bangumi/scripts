// ==UserScript==
// @name         加密通信翻译
// @icon         https://kotorichan.me/favicon.ico
// @namespace    kotorichan_app
// @version      0.0.1
// @description  Bangumi 加密通信翻译
// @author       Vick Scarlet <[BGM] 神戸小鳥＠vickscarlet> <https://github.com/VickScarlet> <scarlet_vick@outlook.com>
// @include      *://bgm.tv/*
// @include      *://bangumi.tv/*
// @include      *://chii.in/*
// @grant        none
// ==/UserScript==

const target = (function(){
    // jshint -W067
    return this || (0, eval)('this');
})();
const namespace = `kotorichan_app`;
(function(namespace) {
"use struct";

namespace.author = `Vick Scarlet <[BGM] 神戸小鳥＠vickscarlet> <https://github.com/VickScarlet> <scarlet_vick@outlook.com>`;

(function(){
function $(fn, ...args) {
    return fn instanceof Function? fn(...args): void 0;
}

$.keys = function(o) {
    if(o==null) return;
    if(!o) return [];
    if(o.keys instanceof Function) {
        const keysI = o.keys();
        if(keysI) {
            if(keysI.next) {
                const ks = [];
                let key;
                while(!(key=keysI.next()).done) ks.push(key.value);
                return ks;
            }
            return keysI;
        }
    }
    if(Object.values) return Object.values(o);
    const keys = [];
    for(const key in o) keys.push(key);
    return keys;
};

$.values = function(o) {
    if(o==null) return;
    if(!o) return [];
    if(o.values instanceof Function) {
        const valuesI = o.values();
        if(valuesI) {
            if(valuesI.next) {
                const vs = [];
                let value;
                while(!(value=valuesI.next()).done) vs.push(value.value);
                return vs;
            }
            return valuesI;
        }
    }
    if(Object.values) return Object.values(o);
    const values = [];
    for(const key in o) values.push(o[key]);
    return values;
};

$.random = function(n) {
    // jshint -W014
    return Number.isFinite(n)
        ? Math.random() * n
        : Math.random()
        ;
};

$.pick = function(o) {
    const values = $.values(o);
    if(!values) return;
    return values[Math.floor($.random(values.length))%values.length];
};

$.call = function(fn, thisArgs, ...argsArray) {
    return fn instanceof Function? fn.call(thisArgs, argsArray): void 0;
};

$.ready = (()=>{
    let funcs = document.readyState === 'complete'? null: [];
    if(!!funcs) {
        const handler = e=>{
            if(!funcs) return;
            if(e.type === 'onreadystatechange' && document.readyState !== 'complete') return;
            const fns = funcs;
            funcs = null;
            fns.forEach(fn=>$.call(fn, document));
        };

        if(document.addEventListener) {
            document.addEventListener('DOMContentLoaded', handler, false);
            document.addEventListener('readystatechange', handler, false);
            window.addEventListener('load', handler, false);
        } else if(document.attachEvent) {
            document.attachEvent('onreadystatechange', handler);
            window.attachEvent('onload', handler);
        }
    }
    // jshint -W030
    return fn => { !funcs? $.call(fn, document): funcs.push(fn); };
})();

$.addStyle = function(style) {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = style||"";
    document.head.append(styleElement);
};

$.global = function() {
    return (function(){
        // jshint -W067
        return this || (0, eval)('this');
    })();
};

namespace.$ = namespace.common = $;
})();

namespace.$.addStyle(`

`);

(function(app){

(function(){
class AppBase {
    constructor() {
        const initRet = this.init();
        if(initRet instanceof Promise) {
            initRet.then(async()=>await this.enter());
        } else {
            this.enter();
        }
    }
    static get version() {return "1.0.0";}
    static get ver() {return this.version;}
    static get v() {return this.version;}
    get version() {return this.constructor.version;}
    get ver() {return this.constructor.version;}
    get v() {return this.constructor.version;}
    async init() {}
    async enter() {}
}

app.AppBase = AppBase;
})();

(function(){
const common = namespace.common;

/**
 * 加密通信翻译
 * @class EncodeTranslate
 * @module EncodeTranslate
 * @extends app.AppBase
 * @version 0.0.1
 * @namespace kotorichan_app
 */
class EncodeTranslate extends app.AppBase {
    constructor() {
        super();
    }
    static get version() {return "0.0.1";}

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

    init() {
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

    enter() {
        const handler = element => {
            let html = $(element).html();
            const decode = (html,regex,type) =>{
                let match = null;
                while((match=regex.exec(html))) {
                    const matchStr = match[0];
                    this[type] = matchStr;
                    html = html.replace(matchStr,`<span class="kotoridecode" kotoridecode="${type}">${this.raw}</span>`);
                }
                return html;
            };

            html = decode(html,/[歪比吧卜]+/g,'waibi');
            html = decode(html,/([█▉▊▋▌▍▎▏]{2})+(▓▓)*/g,'kagari');
            $(element).html(html);
        };

        const selectHandler = selecter => $(selecter).each((idx,element)=>handler(element));

        selectHandler(".topic_content");
        selectHandler(".message");
        selectHandler(".cmt_sub_content");
    }

}

app.EncodeTranslate = EncodeTranslate;
common.ready(()=>new EncodeTranslate());
})();

})(namespace.app||(namespace.app={}));

})(target[namespace]||(target[namespace]={}));