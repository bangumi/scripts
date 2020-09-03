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