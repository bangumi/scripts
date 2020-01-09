/* jQuery v@1.8.0 jquery.com | jquery.org/license */
(function(a, b) {
    function G(a) {
        var b = F[a] = {};
        return p.each(a.split(s), function(a, c) {
            b[c] = !0
        }),
        b
    }
    function J(a, c, d) {
        if (d === b && a.nodeType === 1) {
            var e = "data-" + c.replace(I, "-$1").toLowerCase();
            d = a.getAttribute(e);
            if (typeof d == "string") {
                try {
                    d = d === "true" ? !0 : d === "false" ? !1 : d === "null" ? null : +d + "" === d ? +d : H.test(d) ? p.parseJSON(d) : d
                } catch (f) {}
                p.data(a, c, d)
            } else
                d = b
        }
        return d
    }
    function K(a) {
        var b;
        for (b in a) {
            if (b === "data" && p.isEmptyObject(a[b]))
                continue;
            if (b !== "toJSON")
                return !1
        }
        return !0
    }
    function ba() {
        return !1
    }
    function bb() {
        return !0
    }
    function bh(a) {
        return !a || !a.parentNode || a.parentNode.nodeType === 11
    }
    function bi(a, b) {
        do
            a = a[b];
        while (a && a.nodeType !== 1);return a
    }
    function bj(a, b, c) {
        b = b || 0;
        if (p.isFunction(b))
            return p.grep(a, function(a, d) {
                var e = !!b.call(a, d, a);
                return e === c
            });
        if (b.nodeType)
            return p.grep(a, function(a, d) {
                return a === b === c
            });
        if (typeof b == "string") {
            var d = p.grep(a, function(a) {
                return a.nodeType === 1
            });
            if (be.test(b))
                return p.filter(b, d, !c);
            b = p.filter(b, d)
        }
        return p.grep(a, function(a, d) {
            return p.inArray(a, b) >= 0 === c
        })
    }
    function bk(a) {
        var b = bl.split("|")
          , c = a.createDocumentFragment();
        if (c.createElement)
            while (b.length)
                c.createElement(b.pop());
        return c
    }
    function bC(a, b) {
        return a.getElementsByTagName(b)[0] || a.appendChild(a.ownerDocument.createElement(b))
    }
    function bD(a, b) {
        if (b.nodeType !== 1 || !p.hasData(a))
            return;
        var c, d, e, f = p._data(a), g = p._data(b, f), h = f.events;
        if (h) {
            delete g.handle,
            g.events = {};
            for (c in h)
                for (d = 0,
                e = h[c].length; d < e; d++)
                    p.event.add(b, c, h[c][d])
        }
        g.data && (g.data = p.extend({}, g.data))
    }
    function bE(a, b) {
        var c;
        if (b.nodeType !== 1)
            return;
        b.clearAttributes && b.clearAttributes(),
        b.mergeAttributes && b.mergeAttributes(a),
        c = b.nodeName.toLowerCase(),
        c === "object" ? (b.parentNode && (b.outerHTML = a.outerHTML),
        p.support.html5Clone && a.innerHTML && !p.trim(b.innerHTML) && (b.innerHTML = a.innerHTML)) : c === "input" && bv.test(a.type) ? (b.defaultChecked = b.checked = a.checked,
        b.value !== a.value && (b.value = a.value)) : c === "option" ? b.selected = a.defaultSelected : c === "input" || c === "textarea" ? b.defaultValue = a.defaultValue : c === "script" && b.text !== a.text && (b.text = a.text),
        b.removeAttribute(p.expando)
    }
    function bF(a) {
        return typeof a.getElementsByTagName != "undefined" ? a.getElementsByTagName("*") : typeof a.querySelectorAll != "undefined" ? a.querySelectorAll("*") : []
    }
    function bG(a) {
        bv.test(a.type) && (a.defaultChecked = a.checked)
    }
    function bX(a, b) {
        if (b in a)
            return b;
        var c = b.charAt(0).toUpperCase() + b.slice(1)
          , d = b
          , e = bV.length;
        while (e--) {
            b = bV[e] + c;
            if (b in a)
                return b
        }
        return d
    }
    function bY(a, b) {
        return a = b || a,
        p.css(a, "display") === "none" || !p.contains(a.ownerDocument, a)
    }
    function bZ(a, b) {
        var c, d, e = [], f = 0, g = a.length;
        for (; f < g; f++) {
            c = a[f];
            if (!c.style)
                continue;
            e[f] = p._data(c, "olddisplay"),
            b ? (!e[f] && c.style.display === "none" && (c.style.display = ""),
            c.style.display === "" && bY(c) && (e[f] = p._data(c, "olddisplay", cb(c.nodeName)))) : (d = bH(c, "display"),
            !e[f] && d !== "none" && p._data(c, "olddisplay", d))
        }
        for (f = 0; f < g; f++) {
            c = a[f];
            if (!c.style)
                continue;
            if (!b || c.style.display === "none" || c.style.display === "")
                c.style.display = b ? e[f] || "" : "none"
        }
        return a
    }
    function b$(a, b, c) {
        var d = bO.exec(b);
        return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b
    }
    function b_(a, b, c, d) {
        var e = c === (d ? "border" : "content") ? 4 : b === "width" ? 1 : 0
          , f = 0;
        for (; e < 4; e += 2)
            c === "margin" && (f += p.css(a, c + bU[e], !0)),
            d ? (c === "content" && (f -= parseFloat(bH(a, "padding" + bU[e])) || 0),
            c !== "margin" && (f -= parseFloat(bH(a, "border" + bU[e] + "Width")) || 0)) : (f += parseFloat(bH(a, "padding" + bU[e])) || 0,
            c !== "padding" && (f += parseFloat(bH(a, "border" + bU[e] + "Width")) || 0));
        return f
    }
    function ca(a, b, c) {
        var d = b === "width" ? a.offsetWidth : a.offsetHeight
          , e = !0
          , f = p.support.boxSizing && p.css(a, "boxSizing") === "border-box";
        if (d <= 0) {
            d = bH(a, b);
            if (d < 0 || d == null)
                d = a.style[b];
            if (bP.test(d))
                return d;
            e = f && (p.support.boxSizingReliable || d === a.style[b]),
            d = parseFloat(d) || 0
        }
        return d + b_(a, b, c || (f ? "border" : "content"), e) + "px"
    }
    function cb(a) {
        if (bR[a])
            return bR[a];
        var b = p("<" + a + ">").appendTo(e.body)
          , c = b.css("display");
        b.remove();
        if (c === "none" || c === "") {
            bI = e.body.appendChild(bI || p.extend(e.createElement("iframe"), {
                frameBorder: 0,
                width: 0,
                height: 0
            }));
            if (!bJ || !bI.createElement)
                bJ = (bI.contentWindow || bI.contentDocument).document,
                bJ.write("<!doctype html><html><body>"),
                bJ.close();
            b = bJ.body.appendChild(bJ.createElement(a)),
            c = bH(b, "display"),
            e.body.removeChild(bI)
        }
        return bR[a] = c,
        c
    }
    function ch(a, b, c, d) {
        var e;
        if (p.isArray(b))
            p.each(b, function(b, e) {
                c || cd.test(a) ? d(a, e) : ch(a + "[" + (typeof e == "object" ? b : "") + "]", e, c, d)
            });
        else if (!c && p.type(b) === "object")
            for (e in b)
                ch(a + "[" + e + "]", b[e], c, d);
        else
            d(a, b)
    }
    function cy(a) {
        return function(b, c) {
            typeof b != "string" && (c = b,
            b = "*");
            var d, e, f, g = b.toLowerCase().split(s), h = 0, i = g.length;
            if (p.isFunction(c))
                for (; h < i; h++)
                    d = g[h],
                    f = /^\+/.test(d),
                    f && (d = d.substr(1) || "*"),
                    e = a[d] = a[d] || [],
                    e[f ? "unshift" : "push"](c)
        }
    }
    function cz(a, c, d, e, f, g) {
        f = f || c.dataTypes[0],
        g = g || {},
        g[f] = !0;
        var h, i = a[f], j = 0, k = i ? i.length : 0, l = a === cu;
        for (; j < k && (l || !h); j++)
            h = i[j](c, d, e),
            typeof h == "string" && (!l || g[h] ? h = b : (c.dataTypes.unshift(h),
            h = cz(a, c, d, e, h, g)));
        return (l || !h) && !g["*"] && (h = cz(a, c, d, e, "*", g)),
        h
    }
    function cA(a, c) {
        var d, e, f = p.ajaxSettings.flatOptions || {};
        for (d in c)
            c[d] !== b && ((f[d] ? a : e || (e = {}))[d] = c[d]);
        e && p.extend(!0, a, e)
    }
    function cB(a, c, d) {
        var e, f, g, h, i = a.contents, j = a.dataTypes, k = a.responseFields;
        for (f in k)
            f in d && (c[k[f]] = d[f]);
        while (j[0] === "*")
            j.shift(),
            e === b && (e = a.mimeType || c.getResponseHeader("content-type"));
        if (e)
            for (f in i)
                if (i[f] && i[f].test(e)) {
                    j.unshift(f);
                    break
                }
        if (j[0]in d)
            g = j[0];
        else {
            for (f in d) {
                if (!j[0] || a.converters[f + " " + j[0]]) {
                    g = f;
                    break
                }
                h || (h = f)
            }
            g = g || h
        }
        if (g)
            return g !== j[0] && j.unshift(g),
            d[g]
    }
    function cC(a, b) {
        var c, d, e, f, g = a.dataTypes.slice(), h = g[0], i = {}, j = 0;
        a.dataFilter && (b = a.dataFilter(b, a.dataType));
        if (g[1])
            for (c in a.converters)
                i[c.toLowerCase()] = a.converters[c];
        for (; e = g[++j]; )
            if (e !== "*") {
                if (h !== "*" && h !== e) {
                    c = i[h + " " + e] || i["* " + e];
                    if (!c)
                        for (d in i) {
                            f = d.split(" ");
                            if (f[1] === e) {
                                c = i[h + " " + f[0]] || i["* " + f[0]];
                                if (c) {
                                    c === !0 ? c = i[d] : i[d] !== !0 && (e = f[0],
                                    g.splice(j--, 0, e));
                                    break
                                }
                            }
                        }
                    if (c !== !0)
                        if (c && a["throws"])
                            b = c(b);
                        else
                            try {
                                b = c(b)
                            } catch (k) {
                                return {
                                    state: "parsererror",
                                    error: c ? k : "No conversion from " + h + " to " + e
                                }
                            }
                }
                h = e
            }
        return {
            state: "success",
            data: b
        }
    }
    function cK() {
        try {
            return new a.XMLHttpRequest
        } catch (b) {}
    }
    function cL() {
        try {
            return new a.ActiveXObject("Microsoft.XMLHTTP")
        } catch (b) {}
    }
    function cT() {
        return setTimeout(function() {
            cM = b
        }, 0),
        cM = p.now()
    }
    function cU(a, b) {
        p.each(b, function(b, c) {
            var d = (cS[b] || []).concat(cS["*"])
              , e = 0
              , f = d.length;
            for (; e < f; e++)
                if (d[e].call(a, b, c))
                    return
        })
    }
    function cV(a, b, c) {
        var d, e = 0, f = 0, g = cR.length, h = p.Deferred().always(function() {
            delete i.elem
        }), i = function() {
            var b = cM || cT()
              , c = Math.max(0, j.startTime + j.duration - b)
              , d = 1 - (c / j.duration || 0)
              , e = 0
              , f = j.tweens.length;
            for (; e < f; e++)
                j.tweens[e].run(d);
            return h.notifyWith(a, [j, d, c]),
            d < 1 && f ? c : (h.resolveWith(a, [j]),
            !1)
        }, j = h.promise({
            elem: a,
            props: p.extend({}, b),
            opts: p.extend(!0, {
                specialEasing: {}
            }, c),
            originalProperties: b,
            originalOptions: c,
            startTime: cM || cT(),
            duration: c.duration,
            tweens: [],
            createTween: function(b, c, d) {
                var e = p.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
                return j.tweens.push(e),
                e
            },
            stop: function(b) {
                var c = 0
                  , d = b ? j.tweens.length : 0;
                for (; c < d; c++)
                    j.tweens[c].run(1);
                return b ? h.resolveWith(a, [j, b]) : h.rejectWith(a, [j, b]),
                this
            }
        }), k = j.props;
        cW(k, j.opts.specialEasing);
        for (; e < g; e++) {
            d = cR[e].call(j, a, k, j.opts);
            if (d)
                return d
        }
        return cU(j, k),
        p.isFunction(j.opts.start) && j.opts.start.call(a, j),
        p.fx.timer(p.extend(i, {
            anim: j,
            queue: j.opts.queue,
            elem: a
        })),
        j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always)
    }
    function cW(a, b) {
        var c, d, e, f, g;
        for (c in a) {
            d = p.camelCase(c),
            e = b[d],
            f = a[c],
            p.isArray(f) && (e = f[1],
            f = a[c] = f[0]),
            c !== d && (a[d] = f,
            delete a[c]),
            g = p.cssHooks[d];
            if (g && "expand"in g) {
                f = g.expand(f),
                delete a[d];
                for (c in f)
                    c in a || (a[c] = f[c],
                    b[c] = e)
            } else
                b[d] = e
        }
    }
    function cX(a, b, c) {
        var d, e, f, g, h, i, j, k, l = this, m = a.style, n = {}, o = [], q = a.nodeType && bY(a);
        c.queue || (j = p._queueHooks(a, "fx"),
        j.unqueued == null && (j.unqueued = 0,
        k = j.empty.fire,
        j.empty.fire = function() {
            j.unqueued || k()
        }
        ),
        j.unqueued++,
        l.always(function() {
            l.always(function() {
                j.unqueued--,
                p.queue(a, "fx").length || j.empty.fire()
            })
        })),
        a.nodeType === 1 && ("height"in b || "width"in b) && (c.overflow = [m.overflow, m.overflowX, m.overflowY],
        p.css(a, "display") === "inline" && p.css(a, "float") === "none" && (!p.support.inlineBlockNeedsLayout || cb(a.nodeName) === "inline" ? m.display = "inline-block" : m.zoom = 1)),
        c.overflow && (m.overflow = "hidden",
        p.support.shrinkWrapBlocks || l.done(function() {
            m.overflow = c.overflow[0],
            m.overflowX = c.overflow[1],
            m.overflowY = c.overflow[2]
        }));
        for (d in b) {
            f = b[d];
            if (cO.exec(f)) {
                delete b[d];
                if (f === (q ? "hide" : "show"))
                    continue;
                o.push(d)
            }
        }
        g = o.length;
        if (g) {
            h = p._data(a, "fxshow") || p._data(a, "fxshow", {}),
            q ? p(a).show() : l.done(function() {
                p(a).hide()
            }),
            l.done(function() {
                var b;
                p.removeData(a, "fxshow", !0);
                for (b in n)
                    p.style(a, b, n[b])
            });
            for (d = 0; d < g; d++)
                e = o[d],
                i = l.createTween(e, q ? h[e] : 0),
                n[e] = h[e] || p.style(a, e),
                e in h || (h[e] = i.start,
                q && (i.end = i.start,
                i.start = e === "width" || e === "height" ? 1 : 0))
        }
    }
    function cY(a, b, c, d, e) {
        return new cY.prototype.init(a,b,c,d,e)
    }
    function cZ(a, b) {
        var c, d = {
            height: a
        }, e = 0;
        for (; e < 4; e += 2 - b)
            c = bU[e],
            d["margin" + c] = d["padding" + c] = a;
        return b && (d.opacity = d.width = a),
        d
    }
    function c_(a) {
        return p.isWindow(a) ? a : a.nodeType === 9 ? a.defaultView || a.parentWindow : !1
    }
    var c, d, e = a.document, f = a.location, g = a.navigator, h = a.jQuery, i = a.$, j = Array.prototype.push, k = Array.prototype.slice, l = Array.prototype.indexOf, m = Object.prototype.toString, n = Object.prototype.hasOwnProperty, o = String.prototype.trim, p = function(a, b) {
        return new p.fn.init(a,b,c)
    }, q = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source, r = /\S/, s = /\s+/, t = r.test(" ") ? /^[\s\xA0]+|[\s\xA0]+$/g : /^\s+|\s+$/g, u = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/, v = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, w = /^[\],:{}\s]*$/, x = /(?:^|:|,)(?:\s*\[)+/g, y = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g, z = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g, A = /^-ms-/, B = /-([\da-z])/gi, C = function(a, b) {
        return (b + "").toUpperCase()
    }, D = function() {
        e.addEventListener ? (e.removeEventListener("DOMContentLoaded", D, !1),
        p.ready()) : e.readyState === "complete" && (e.detachEvent("onreadystatechange", D),
        p.ready())
    }, E = {};
    p.fn = p.prototype = {
        constructor: p,
        init: function(a, c, d) {
            var f, g, h, i;
            if (!a)
                return this;
            if (a.nodeType)
                return this.context = this[0] = a,
                this.length = 1,
                this;
            if (typeof a == "string") {
                a.charAt(0) === "<" && a.charAt(a.length - 1) === ">" && a.length >= 3 ? f = [null, a, null] : f = u.exec(a);
                if (f && (f[1] || !c)) {
                    if (f[1])
                        return c = c instanceof p ? c[0] : c,
                        i = c && c.nodeType ? c.ownerDocument || c : e,
                        a = p.parseHTML(f[1], i, !0),
                        v.test(f[1]) && p.isPlainObject(c) && this.attr.call(a, c, !0),
                        p.merge(this, a);
                    g = e.getElementById(f[2]);
                    if (g && g.parentNode) {
                        if (g.id !== f[2])
                            return d.find(a);
                        this.length = 1,
                        this[0] = g
                    }
                    return this.context = e,
                    this.selector = a,
                    this
                }
                return !c || c.jquery ? (c || d).find(a) : this.constructor(c).find(a)
            }
            return p.isFunction(a) ? d.ready(a) : (a.selector !== b && (this.selector = a.selector,
            this.context = a.context),
            p.makeArray(a, this))
        },
        selector: "",
        jquery: "1.8.0",
        length: 0,
        size: function() {
            return this.length
        },
        toArray: function() {
            return k.call(this)
        },
        get: function(a) {
            return a == null ? this.toArray() : a < 0 ? this[this.length + a] : this[a]
        },
        pushStack: function(a, b, c) {
            var d = p.merge(this.constructor(), a);
            return d.prevObject = this,
            d.context = this.context,
            b === "find" ? d.selector = this.selector + (this.selector ? " " : "") + c : b && (d.selector = this.selector + "." + b + "(" + c + ")"),
            d
        },
        each: function(a, b) {
            return p.each(this, a, b)
        },
        ready: function(a) {
            return p.ready.promise().done(a),
            this
        },
        eq: function(a) {
            return a = +a,
            a === -1 ? this.slice(a) : this.slice(a, a + 1)
        },
        first: function() {
            return this.eq(0)
        },
        last: function() {
            return this.eq(-1)
        },
        slice: function() {
            return this.pushStack(k.apply(this, arguments), "slice", k.call(arguments).join(","))
        },
        map: function(a) {
            return this.pushStack(p.map(this, function(b, c) {
                return a.call(b, c, b)
            }))
        },
        end: function() {
            return this.prevObject || this.constructor(null)
        },
        push: j,
        sort: [].sort,
        splice: [].splice
    },
    p.fn.init.prototype = p.fn,
    p.extend = p.fn.extend = function() {
        var a, c, d, e, f, g, h = arguments[0] || {}, i = 1, j = arguments.length, k = !1;
        typeof h == "boolean" && (k = h,
        h = arguments[1] || {},
        i = 2),
        typeof h != "object" && !p.isFunction(h) && (h = {}),
        j === i && (h = this,
        --i);
        for (; i < j; i++)
            if ((a = arguments[i]) != null)
                for (c in a) {
                    d = h[c],
                    e = a[c];
                    if (h === e)
                        continue;
                    k && e && (p.isPlainObject(e) || (f = p.isArray(e))) ? (f ? (f = !1,
                    g = d && p.isArray(d) ? d : []) : g = d && p.isPlainObject(d) ? d : {},
                    h[c] = p.extend(k, g, e)) : e !== b && (h[c] = e)
                }
        return h
    }
    ,
    p.extend({
        noConflict: function(b) {
            return a.$ === p && (a.$ = i),
            b && a.jQuery === p && (a.jQuery = h),
            p
        },
        isReady: !1,
        readyWait: 1,
        holdReady: function(a) {
            a ? p.readyWait++ : p.ready(!0)
        },
        ready: function(a) {
            if (a === !0 ? --p.readyWait : p.isReady)
                return;
            if (!e.body)
                return setTimeout(p.ready, 1);
            p.isReady = !0;
            if (a !== !0 && --p.readyWait > 0)
                return;
            d.resolveWith(e, [p]),
            p.fn.trigger && p(e).trigger("ready").off("ready")
        },
        isFunction: function(a) {
            return p.type(a) === "function"
        },
        isArray: Array.isArray || function(a) {
            return p.type(a) === "array"
        }
        ,
        isWindow: function(a) {
            return a != null && a == a.window
        },
        isNumeric: function(a) {
            return !isNaN(parseFloat(a)) && isFinite(a)
        },
        type: function(a) {
            return a == null ? String(a) : E[m.call(a)] || "object"
        },
        isPlainObject: function(a) {
            if (!a || p.type(a) !== "object" || a.nodeType || p.isWindow(a))
                return !1;
            try {
                if (a.constructor && !n.call(a, "constructor") && !n.call(a.constructor.prototype, "isPrototypeOf"))
                    return !1
            } catch (c) {
                return !1
            }
            var d;
            for (d in a)
                ;
            return d === b || n.call(a, d)
        },
        isEmptyObject: function(a) {
            var b;
            for (b in a)
                return !1;
            return !0
        },
        error: function(a) {
            throw new Error(a)
        },
        parseHTML: function(a, b, c) {
            var d;
            return !a || typeof a != "string" ? null : (typeof b == "boolean" && (c = b,
            b = 0),
            b = b || e,
            (d = v.exec(a)) ? [b.createElement(d[1])] : (d = p.buildFragment([a], b, c ? null : []),
            p.merge([], (d.cacheable ? p.clone(d.fragment) : d.fragment).childNodes)))
        },
        parseJSON: function(b) {
            if (!b || typeof b != "string")
                return null;
            b = p.trim(b);
            if (a.JSON && a.JSON.parse)
                return a.JSON.parse(b);
            if (w.test(b.replace(y, "@").replace(z, "]").replace(x, "")))
                return (new Function("return " + b))();
            p.error("Invalid JSON: " + b)
        },
        parseXML: function(c) {
            var d, e;
            if (!c || typeof c != "string")
                return null;
            try {
                a.DOMParser ? (e = new DOMParser,
                d = e.parseFromString(c, "text/xml")) : (d = new ActiveXObject("Microsoft.XMLDOM"),
                d.async = "false",
                d.loadXML(c))
            } catch (f) {
                d = b
            }
            return (!d || !d.documentElement || d.getElementsByTagName("parsererror").length) && p.error("Invalid XML: " + c),
            d
        },
        noop: function() {},
        globalEval: function(b) {
            b && r.test(b) && (a.execScript || function(b) {
                a.eval.call(a, b)
            }
            )(b)
        },
        camelCase: function(a) {
            return a.replace(A, "ms-").replace(B, C)
        },
        nodeName: function(a, b) {
            return a.nodeName && a.nodeName.toUpperCase() === b.toUpperCase()
        },
        each: function(a, c, d) {
            var e, f = 0, g = a.length, h = g === b || p.isFunction(a);
            if (d) {
                if (h) {
                    for (e in a)
                        if (c.apply(a[e], d) === !1)
                            break
                } else
                    for (; f < g; )
                        if (c.apply(a[f++], d) === !1)
                            break
            } else if (h) {
                for (e in a)
                    if (c.call(a[e], e, a[e]) === !1)
                        break
            } else
                for (; f < g; )
                    if (c.call(a[f], f, a[f++]) === !1)
                        break;
            return a
        },
        trim: o ? function(a) {
            return a == null ? "" : o.call(a)
        }
        : function(a) {
            return a == null ? "" : a.toString().replace(t, "")
        }
        ,
        makeArray: function(a, b) {
            var c, d = b || [];
            return a != null && (c = p.type(a),
            a.length == null || c === "string" || c === "function" || c === "regexp" || p.isWindow(a) ? j.call(d, a) : p.merge(d, a)),
            d
        },
        inArray: function(a, b, c) {
            var d;
            if (b) {
                if (l)
                    return l.call(b, a, c);
                d = b.length,
                c = c ? c < 0 ? Math.max(0, d + c) : c : 0;
                for (; c < d; c++)
                    if (c in b && b[c] === a)
                        return c
            }
            return -1
        },
        merge: function(a, c) {
            var d = c.length
              , e = a.length
              , f = 0;
            if (typeof d == "number")
                for (; f < d; f++)
                    a[e++] = c[f];
            else
                while (c[f] !== b)
                    a[e++] = c[f++];
            return a.length = e,
            a
        },
        grep: function(a, b, c) {
            var d, e = [], f = 0, g = a.length;
            c = !!c;
            for (; f < g; f++)
                d = !!b(a[f], f),
                c !== d && e.push(a[f]);
            return e
        },
        map: function(a, c, d) {
            var e, f, g = [], h = 0, i = a.length, j = a instanceof p || i !== b && typeof i == "number" && (i > 0 && a[0] && a[i - 1] || i === 0 || p.isArray(a));
            if (j)
                for (; h < i; h++)
                    e = c(a[h], h, d),
                    e != null && (g[g.length] = e);
            else
                for (f in a)
                    e = c(a[f], f, d),
                    e != null && (g[g.length] = e);
            return g.concat.apply([], g)
        },
        guid: 1,
        proxy: function(a, c) {
            var d, e, f;
            return typeof c == "string" && (d = a[c],
            c = a,
            a = d),
            p.isFunction(a) ? (e = k.call(arguments, 2),
            f = function() {
                return a.apply(c, e.concat(k.call(arguments)))
            }
            ,
            f.guid = a.guid = a.guid || f.guid || p.guid++,
            f) : b
        },
        access: function(a, c, d, e, f, g, h) {
            var i, j = d == null, k = 0, l = a.length;
            if (d && typeof d == "object") {
                for (k in d)
                    p.access(a, c, k, d[k], 1, g, e);
                f = 1
            } else if (e !== b) {
                i = h === b && p.isFunction(e),
                j && (i ? (i = c,
                c = function(a, b, c) {
                    return i.call(p(a), c)
                }
                ) : (c.call(a, e),
                c = null));
                if (c)
                    for (; k < l; k++)
                        c(a[k], d, i ? e.call(a[k], k, c(a[k], d)) : e, h);
                f = 1
            }
            return f ? a : j ? c.call(a) : l ? c(a[0], d) : g
        },
        now: function() {
            return (new Date).getTime()
        }
    }),
    p.ready.promise = function(b) {
        if (!d) {
            d = p.Deferred();
            if (e.readyState === "complete" || e.readyState !== "loading" && e.addEventListener)
                setTimeout(p.ready, 1);
            else if (e.addEventListener)
                e.addEventListener("DOMContentLoaded", D, !1),
                a.addEventListener("load", p.ready, !1);
            else {
                e.attachEvent("onreadystatechange", D),
                a.attachEvent("onload", p.ready);
                var c = !1;
                try {
                    c = a.frameElement == null && e.documentElement
                } catch (f) {}
                c && c.doScroll && function g() {
                    if (!p.isReady) {
                        try {
                            c.doScroll("left")
                        } catch (a) {
                            return setTimeout(g, 50)
                        }
                        p.ready()
                    }
                }()
            }
        }
        return d.promise(b)
    }
    ,
    p.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(a, b) {
        E["[object " + b + "]"] = b.toLowerCase()
    }),
    c = p(e);
    var F = {};
    p.Callbacks = function(a) {
        a = typeof a == "string" ? F[a] || G(a) : p.extend({}, a);
        var c, d, e, f, g, h, i = [], j = !a.once && [], k = function(b) {
            c = a.memory && b,
            d = !0,
            h = f || 0,
            f = 0,
            g = i.length,
            e = !0;
            for (; i && h < g; h++)
                if (i[h].apply(b[0], b[1]) === !1 && a.stopOnFalse) {
                    c = !1;
                    break
                }
            e = !1,
            i && (j ? j.length && k(j.shift()) : c ? i = [] : l.disable())
        }, l = {
            add: function() {
                if (i) {
                    var b = i.length;
                    (function d(b) {
                        p.each(b, function(b, c) {
                            p.isFunction(c) && (!a.unique || !l.has(c)) ? i.push(c) : c && c.length && d(c)
                        })
                    }
                    )(arguments),
                    e ? g = i.length : c && (f = b,
                    k(c))
                }
                return this
            },
            remove: function() {
                return i && p.each(arguments, function(a, b) {
                    var c;
                    while ((c = p.inArray(b, i, c)) > -1)
                        i.splice(c, 1),
                        e && (c <= g && g--,
                        c <= h && h--)
                }),
                this
            },
            has: function(a) {
                return p.inArray(a, i) > -1
            },
            empty: function() {
                return i = [],
                this
            },
            disable: function() {
                return i = j = c = b,
                this
            },
            disabled: function() {
                return !i
            },
            lock: function() {
                return j = b,
                c || l.disable(),
                this
            },
            locked: function() {
                return !j
            },
            fireWith: function(a, b) {
                return b = b || [],
                b = [a, b.slice ? b.slice() : b],
                i && (!d || j) && (e ? j.push(b) : k(b)),
                this
            },
            fire: function() {
                return l.fireWith(this, arguments),
                this
            },
            fired: function() {
                return !!d
            }
        };
        return l
    }
    ,
    p.extend({
        Deferred: function(a) {
            var b = [["resolve", "done", p.Callbacks("once memory"), "resolved"], ["reject", "fail", p.Callbacks("once memory"), "rejected"], ["notify", "progress", p.Callbacks("memory")]]
              , c = "pending"
              , d = {
                state: function() {
                    return c
                },
                always: function() {
                    return e.done(arguments).fail(arguments),
                    this
                },
                then: function() {
                    var a = arguments;
                    return p.Deferred(function(c) {
                        p.each(b, function(b, d) {
                            var f = d[0]
                              , g = a[b];
                            e[d[1]](p.isFunction(g) ? function() {
                                var a = g.apply(this, arguments);
                                a && p.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f + "With"](this === e ? c : this, [a])
                            }
                            : c[f])
                        }),
                        a = null
                    }).promise()
                },
                promise: function(a) {
                    return typeof a == "object" ? p.extend(a, d) : d
                }
            }
              , e = {};
            return d.pipe = d.then,
            p.each(b, function(a, f) {
                var g = f[2]
                  , h = f[3];
                d[f[1]] = g.add,
                h && g.add(function() {
                    c = h
                }, b[a ^ 1][2].disable, b[2][2].lock),
                e[f[0]] = g.fire,
                e[f[0] + "With"] = g.fireWith
            }),
            d.promise(e),
            a && a.call(e, e),
            e
        },
        when: function(a) {
            var b = 0, c = k.call(arguments), d = c.length, e = d !== 1 || a && p.isFunction(a.promise) ? d : 0, f = e === 1 ? a : p.Deferred(), g = function(a, b, c) {
                return function(d) {
                    b[a] = this,
                    c[a] = arguments.length > 1 ? k.call(arguments) : d,
                    c === h ? f.notifyWith(b, c) : --e || f.resolveWith(b, c)
                }
            }, h, i, j;
            if (d > 1) {
                h = new Array(d),
                i = new Array(d),
                j = new Array(d);
                for (; b < d; b++)
                    c[b] && p.isFunction(c[b].promise) ? c[b].promise().done(g(b, j, c)).fail(f.reject).progress(g(b, i, h)) : --e
            }
            return e || f.resolveWith(j, c),
            f.promise()
        }
    }),
    p.support = function() {
        var b, c, d, f, g, h, i, j, k, l, m, n = e.createElement("div");
        n.setAttribute("className", "t"),
        n.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",
        c = n.getElementsByTagName("*"),
        d = n.getElementsByTagName("a")[0],
        d.style.cssText = "top:1px;float:left;opacity:.5";
        if (!c || !c.length || !d)
            return {};
        f = e.createElement("select"),
        g = f.appendChild(e.createElement("option")),
        h = n.getElementsByTagName("input")[0],
        b = {
            leadingWhitespace: n.firstChild.nodeType === 3,
            tbody: !n.getElementsByTagName("tbody").length,
            htmlSerialize: !!n.getElementsByTagName("link").length,
            style: /top/.test(d.getAttribute("style")),
            hrefNormalized: d.getAttribute("href") === "/a",
            opacity: /^0.5/.test(d.style.opacity),
            cssFloat: !!d.style.cssFloat,
            checkOn: h.value === "on",
            optSelected: g.selected,
            getSetAttribute: n.className !== "t",
            enctype: !!e.createElement("form").enctype,
            html5Clone: e.createElement("nav").cloneNode(!0).outerHTML !== "<:nav></:nav>",
            boxModel: e.compatMode === "CSS1Compat",
            submitBubbles: !0,
            changeBubbles: !0,
            focusinBubbles: !1,
            deleteExpando: !0,
            noCloneEvent: !0,
            inlineBlockNeedsLayout: !1,
            shrinkWrapBlocks: !1,
            reliableMarginRight: !0,
            boxSizingReliable: !0,
            pixelPosition: !1
        },
        h.checked = !0,
        b.noCloneChecked = h.cloneNode(!0).checked,
        f.disabled = !0,
        b.optDisabled = !g.disabled;
        try {
            delete n.test
        } catch (o) {
            b.deleteExpando = !1
        }
        !n.addEventListener && n.attachEvent && n.fireEvent && (n.attachEvent("onclick", m = function() {
            b.noCloneEvent = !1
        }
        ),
        n.cloneNode(!0).fireEvent("onclick"),
        n.detachEvent("onclick", m)),
        h = e.createElement("input"),
        h.value = "t",
        h.setAttribute("type", "radio"),
        b.radioValue = h.value === "t",
        h.setAttribute("checked", "checked"),
        h.setAttribute("name", "t"),
        n.appendChild(h),
        i = e.createDocumentFragment(),
        i.appendChild(n.lastChild),
        b.checkClone = i.cloneNode(!0).cloneNode(!0).lastChild.checked,
        b.appendChecked = h.checked,
        i.removeChild(h),
        i.appendChild(n);
        if (n.attachEvent)
            for (k in {
                submit: !0,
                change: !0,
                focusin: !0
            })
                j = "on" + k,
                l = j in n,
                l || (n.setAttribute(j, "return;"),
                l = typeof n[j] == "function"),
                b[k + "Bubbles"] = l;
        return p(function() {
            var c, d, f, g, h = "padding:0;margin:0;border:0;display:block;overflow:hidden;", i = e.getElementsByTagName("body")[0];
            if (!i)
                return;
            c = e.createElement("div"),
            c.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px",
            i.insertBefore(c, i.firstChild),
            d = e.createElement("div"),
            c.appendChild(d),
            d.innerHTML = "<table><tr><td></td><td>t</td></tr></table>",
            f = d.getElementsByTagName("td"),
            f[0].style.cssText = "padding:0;margin:0;border:0;display:none",
            l = f[0].offsetHeight === 0,
            f[0].style.display = "",
            f[1].style.display = "none",
            b.reliableHiddenOffsets = l && f[0].offsetHeight === 0,
            d.innerHTML = "",
            d.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",
            b.boxSizing = d.offsetWidth === 4,
            b.doesNotIncludeMarginInBodyOffset = i.offsetTop !== 1,
            a.getComputedStyle && (b.pixelPosition = (a.getComputedStyle(d, null) || {}).top !== "1%",
            b.boxSizingReliable = (a.getComputedStyle(d, null) || {
                width: "4px"
            }).width === "4px",
            g = e.createElement("div"),
            g.style.cssText = d.style.cssText = h,
            g.style.marginRight = g.style.width = "0",
            d.style.width = "1px",
            d.appendChild(g),
            b.reliableMarginRight = !parseFloat((a.getComputedStyle(g, null) || {}).marginRight)),
            typeof d.style.zoom != "undefined" && (d.innerHTML = "",
            d.style.cssText = h + "width:1px;padding:1px;display:inline;zoom:1",
            b.inlineBlockNeedsLayout = d.offsetWidth === 3,
            d.style.display = "block",
            d.style.overflow = "visible",
            d.innerHTML = "<div></div>",
            d.firstChild.style.width = "5px",
            b.shrinkWrapBlocks = d.offsetWidth !== 3,
            c.style.zoom = 1),
            i.removeChild(c),
            c = d = f = g = null
        }),
        i.removeChild(n),
        c = d = f = g = h = i = n = null,
        b
    }();
    var H = /^(?:\{.*\}|\[.*\])$/
      , I = /([A-Z])/g;
    p.extend({
        cache: {},
        deletedIds: [],
        uuid: 0,
        expando: "jQuery" + (p.fn.jquery + Math.random()).replace(/\D/g, ""),
        noData: {
            embed: !0,
            object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            applet: !0
        },
        hasData: function(a) {
            return a = a.nodeType ? p.cache[a[p.expando]] : a[p.expando],
            !!a && !K(a)
        },
        data: function(a, c, d, e) {
            if (!p.acceptData(a))
                return;
            var f, g, h = p.expando, i = typeof c == "string", j = a.nodeType, k = j ? p.cache : a, l = j ? a[h] : a[h] && h;
            if ((!l || !k[l] || !e && !k[l].data) && i && d === b)
                return;
            l || (j ? a[h] = l = p.deletedIds.pop() || ++p.uuid : l = h),
            k[l] || (k[l] = {},
            j || (k[l].toJSON = p.noop));
            if (typeof c == "object" || typeof c == "function")
                e ? k[l] = p.extend(k[l], c) : k[l].data = p.extend(k[l].data, c);
            return f = k[l],
            e || (f.data || (f.data = {}),
            f = f.data),
            d !== b && (f[p.camelCase(c)] = d),
            i ? (g = f[c],
            g == null && (g = f[p.camelCase(c)])) : g = f,
            g
        },
        removeData: function(a, b, c) {
            if (!p.acceptData(a))
                return;
            var d, e, f, g = a.nodeType, h = g ? p.cache : a, i = g ? a[p.expando] : p.expando;
            if (!h[i])
                return;
            if (b) {
                d = c ? h[i] : h[i].data;
                if (d) {
                    p.isArray(b) || (b in d ? b = [b] : (b = p.camelCase(b),
                    b in d ? b = [b] : b = b.split(" ")));
                    for (e = 0,
                    f = b.length; e < f; e++)
                        delete d[b[e]];
                    if (!(c ? K : p.isEmptyObject)(d))
                        return
                }
            }
            if (!c) {
                delete h[i].data;
                if (!K(h[i]))
                    return
            }
            g ? p.cleanData([a], !0) : p.support.deleteExpando || h != h.window ? delete h[i] : h[i] = null
        },
        _data: function(a, b, c) {
            return p.data(a, b, c, !0)
        },
        acceptData: function(a) {
            var b = a.nodeName && p.noData[a.nodeName.toLowerCase()];
            return !b || b !== !0 && a.getAttribute("classid") === b
        }
    }),
    p.fn.extend({
        data: function(a, c) {
            var d, e, f, g, h, i = this[0], j = 0, k = null;
            if (a === b) {
                if (this.length) {
                    k = p.data(i);
                    if (i.nodeType === 1 && !p._data(i, "parsedAttrs")) {
                        f = i.attributes;
                        for (h = f.length; j < h; j++)
                            g = f[j].name,
                            g.indexOf("data-") === 0 && (g = p.camelCase(g.substring(5)),
                            J(i, g, k[g]));
                        p._data(i, "parsedAttrs", !0)
                    }
                }
                return k
            }
            return typeof a == "object" ? this.each(function() {
                p.data(this, a)
            }) : (d = a.split(".", 2),
            d[1] = d[1] ? "." + d[1] : "",
            e = d[1] + "!",
            p.access(this, function(c) {
                if (c === b)
                    return k = this.triggerHandler("getData" + e, [d[0]]),
                    k === b && i && (k = p.data(i, a),
                    k = J(i, a, k)),
                    k === b && d[1] ? this.data(d[0]) : k;
                d[1] = c,
                this.each(function() {
                    var b = p(this);
                    b.triggerHandler("setData" + e, d),
                    p.data(this, a, c),
                    b.triggerHandler("changeData" + e, d)
                })
            }, null, c, arguments.length > 1, null, !1))
        },
        removeData: function(a) {
            return this.each(function() {
                p.removeData(this, a)
            })
        }
    }),
    p.extend({
        queue: function(a, b, c) {
            var d;
            if (a)
                return b = (b || "fx") + "queue",
                d = p._data(a, b),
                c && (!d || p.isArray(c) ? d = p._data(a, b, p.makeArray(c)) : d.push(c)),
                d || []
        },
        dequeue: function(a, b) {
            b = b || "fx";
            var c = p.queue(a, b)
              , d = c.shift()
              , e = p._queueHooks(a, b)
              , f = function() {
                p.dequeue(a, b)
            };
            d === "inprogress" && (d = c.shift()),
            d && (b === "fx" && c.unshift("inprogress"),
            delete e.stop,
            d.call(a, f, e)),
            !c.length && e && e.empty.fire()
        },
        _queueHooks: function(a, b) {
            var c = b + "queueHooks";
            return p._data(a, c) || p._data(a, c, {
                empty: p.Callbacks("once memory").add(function() {
                    p.removeData(a, b + "queue", !0),
                    p.removeData(a, c, !0)
                })
            })
        }
    }),
    p.fn.extend({
        queue: function(a, c) {
            var d = 2;
            return typeof a != "string" && (c = a,
            a = "fx",
            d--),
            arguments.length < d ? p.queue(this[0], a) : c === b ? this : this.each(function() {
                var b = p.queue(this, a, c);
                p._queueHooks(this, a),
                a === "fx" && b[0] !== "inprogress" && p.dequeue(this, a)
            })
        },
        dequeue: function(a) {
            return this.each(function() {
                p.dequeue(this, a)
            })
        },
        delay: function(a, b) {
            return a = p.fx ? p.fx.speeds[a] || a : a,
            b = b || "fx",
            this.queue(b, function(b, c) {
                var d = setTimeout(b, a);
                c.stop = function() {
                    clearTimeout(d)
                }
            })
        },
        clearQueue: function(a) {
            return this.queue(a || "fx", [])
        },
        promise: function(a, c) {
            var d, e = 1, f = p.Deferred(), g = this, h = this.length, i = function() {
                --e || f.resolveWith(g, [g])
            };
            typeof a != "string" && (c = a,
            a = b),
            a = a || "fx";
            while (h--)
                (d = p._data(g[h], a + "queueHooks")) && d.empty && (e++,
                d.empty.add(i));
            return i(),
            f.promise(c)
        }
    });
    var L, M, N, O = /[\t\r\n]/g, P = /\r/g, Q = /^(?:button|input)$/i, R = /^(?:button|input|object|select|textarea)$/i, S = /^a(?:rea|)$/i, T = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i, U = p.support.getSetAttribute;
    p.fn.extend({
        attr: function(a, b) {
            return p.access(this, p.attr, a, b, arguments.length > 1)
        },
        removeAttr: function(a) {
            return this.each(function() {
                p.removeAttr(this, a)
            })
        },
        prop: function(a, b) {
            return p.access(this, p.prop, a, b, arguments.length > 1)
        },
        removeProp: function(a) {
            return a = p.propFix[a] || a,
            this.each(function() {
                try {
                    this[a] = b,
                    delete this[a]
                } catch (c) {}
            })
        },
        addClass: function(a) {
            var b, c, d, e, f, g, h;
            if (p.isFunction(a))
                return this.each(function(b) {
                    p(this).addClass(a.call(this, b, this.className))
                });
            if (a && typeof a == "string") {
                b = a.split(s);
                for (c = 0,
                d = this.length; c < d; c++) {
                    e = this[c];
                    if (e.nodeType === 1)
                        if (!e.className && b.length === 1)
                            e.className = a;
                        else {
                            f = " " + e.className + " ";
                            for (g = 0,
                            h = b.length; g < h; g++)
                                ~f.indexOf(" " + b[g] + " ") || (f += b[g] + " ");
                            e.className = p.trim(f)
                        }
                }
            }
            return this
        },
        removeClass: function(a) {
            var c, d, e, f, g, h, i;
            if (p.isFunction(a))
                return this.each(function(b) {
                    p(this).removeClass(a.call(this, b, this.className))
                });
            if (a && typeof a == "string" || a === b) {
                c = (a || "").split(s);
                for (h = 0,
                i = this.length; h < i; h++) {
                    e = this[h];
                    if (e.nodeType === 1 && e.className) {
                        d = (" " + e.className + " ").replace(O, " ");
                        for (f = 0,
                        g = c.length; f < g; f++)
                            while (d.indexOf(" " + c[f] + " ") > -1)
                                d = d.replace(" " + c[f] + " ", " ");
                        e.className = a ? p.trim(d) : ""
                    }
                }
            }
            return this
        },
        toggleClass: function(a, b) {
            var c = typeof a
              , d = typeof b == "boolean";
            return p.isFunction(a) ? this.each(function(c) {
                p(this).toggleClass(a.call(this, c, this.className, b), b)
            }) : this.each(function() {
                if (c === "string") {
                    var e, f = 0, g = p(this), h = b, i = a.split(s);
                    while (e = i[f++])
                        h = d ? h : !g.hasClass(e),
                        g[h ? "addClass" : "removeClass"](e)
                } else if (c === "undefined" || c === "boolean")
                    this.className && p._data(this, "__className__", this.className),
                    this.className = this.className || a === !1 ? "" : p._data(this, "__className__") || ""
            })
        },
        hasClass: function(a) {
            var b = " " + a + " "
              , c = 0
              , d = this.length;
            for (; c < d; c++)
                if (this[c].nodeType === 1 && (" " + this[c].className + " ").replace(O, " ").indexOf(b) > -1)
                    return !0;
            return !1
        },
        val: function(a) {
            var c, d, e, f = this[0];
            if (!arguments.length) {
                if (f)
                    return c = p.valHooks[f.type] || p.valHooks[f.nodeName.toLowerCase()],
                    c && "get"in c && (d = c.get(f, "value")) !== b ? d : (d = f.value,
                    typeof d == "string" ? d.replace(P, "") : d == null ? "" : d);
                return
            }
            return e = p.isFunction(a),
            this.each(function(d) {
                var f, g = p(this);
                if (this.nodeType !== 1)
                    return;
                e ? f = a.call(this, d, g.val()) : f = a,
                f == null ? f = "" : typeof f == "number" ? f += "" : p.isArray(f) && (f = p.map(f, function(a) {
                    return a == null ? "" : a + ""
                })),
                c = p.valHooks[this.type] || p.valHooks[this.nodeName.toLowerCase()];
                if (!c || !("set"in c) || c.set(this, f, "value") === b)
                    this.value = f
            })
        }
    }),
    p.extend({
        valHooks: {
            option: {
                get: function(a) {
                    var b = a.attributes.value;
                    return !b || b.specified ? a.value : a.text
                }
            },
            select: {
                get: function(a) {
                    var b, c, d, e, f = a.selectedIndex, g = [], h = a.options, i = a.type === "select-one";
                    if (f < 0)
                        return null;
                    c = i ? f : 0,
                    d = i ? f + 1 : h.length;
                    for (; c < d; c++) {
                        e = h[c];
                        if (e.selected && (p.support.optDisabled ? !e.disabled : e.getAttribute("disabled") === null) && (!e.parentNode.disabled || !p.nodeName(e.parentNode, "optgroup"))) {
                            b = p(e).val();
                            if (i)
                                return b;
                            g.push(b)
                        }
                    }
                    return i && !g.length && h.length ? p(h[f]).val() : g
                },
                set: function(a, b) {
                    var c = p.makeArray(b);
                    return p(a).find("option").each(function() {
                        this.selected = p.inArray(p(this).val(), c) >= 0
                    }),
                    c.length || (a.selectedIndex = -1),
                    c
                }
            }
        },
        attrFn: {},
        attr: function(a, c, d, e) {
            var f, g, h, i = a.nodeType;
            if (!a || i === 3 || i === 8 || i === 2)
                return;
            if (e && p.isFunction(p.fn[c]))
                return p(a)[c](d);
            if (typeof a.getAttribute == "undefined")
                return p.prop(a, c, d);
            h = i !== 1 || !p.isXMLDoc(a),
            h && (c = c.toLowerCase(),
            g = p.attrHooks[c] || (T.test(c) ? M : L));
            if (d !== b) {
                if (d === null) {
                    p.removeAttr(a, c);
                    return
                }
                return g && "set"in g && h && (f = g.set(a, d, c)) !== b ? f : (a.setAttribute(c, "" + d),
                d)
            }
            return g && "get"in g && h && (f = g.get(a, c)) !== null ? f : (f = a.getAttribute(c),
            f === null ? b : f)
        },
        removeAttr: function(a, b) {
            var c, d, e, f, g = 0;
            if (b && a.nodeType === 1) {
                d = b.split(s);
                for (; g < d.length; g++)
                    e = d[g],
                    e && (c = p.propFix[e] || e,
                    f = T.test(e),
                    f || p.attr(a, e, ""),
                    a.removeAttribute(U ? e : c),
                    f && c in a && (a[c] = !1))
            }
        },
        attrHooks: {
            type: {
                set: function(a, b) {
                    if (Q.test(a.nodeName) && a.parentNode)
                        p.error("type property can't be changed");
                    else if (!p.support.radioValue && b === "radio" && p.nodeName(a, "input")) {
                        var c = a.value;
                        return a.setAttribute("type", b),
                        c && (a.value = c),
                        b
                    }
                }
            },
            value: {
                get: function(a, b) {
                    return L && p.nodeName(a, "button") ? L.get(a, b) : b in a ? a.value : null
                },
                set: function(a, b, c) {
                    if (L && p.nodeName(a, "button"))
                        return L.set(a, b, c);
                    a.value = b
                }
            }
        },
        propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
        },
        prop: function(a, c, d) {
            var e, f, g, h = a.nodeType;
            if (!a || h === 3 || h === 8 || h === 2)
                return;
            return g = h !== 1 || !p.isXMLDoc(a),
            g && (c = p.propFix[c] || c,
            f = p.propHooks[c]),
            d !== b ? f && "set"in f && (e = f.set(a, d, c)) !== b ? e : a[c] = d : f && "get"in f && (e = f.get(a, c)) !== null ? e : a[c]
        },
        propHooks: {
            tabIndex: {
                get: function(a) {
                    var c = a.getAttributeNode("tabindex");
                    return c && c.specified ? parseInt(c.value, 10) : R.test(a.nodeName) || S.test(a.nodeName) && a.href ? 0 : b
                }
            }
        }
    }),
    M = {
        get: function(a, c) {
            var d, e = p.prop(a, c);
            return e === !0 || typeof e != "boolean" && (d = a.getAttributeNode(c)) && d.nodeValue !== !1 ? c.toLowerCase() : b
        },
        set: function(a, b, c) {
            var d;
            return b === !1 ? p.removeAttr(a, c) : (d = p.propFix[c] || c,
            d in a && (a[d] = !0),
            a.setAttribute(c, c.toLowerCase())),
            c
        }
    },
    U || (N = {
        name: !0,
        id: !0,
        coords: !0
    },
    L = p.valHooks.button = {
        get: function(a, c) {
            var d;
            return d = a.getAttributeNode(c),
            d && (N[c] ? d.value !== "" : d.specified) ? d.value : b
        },
        set: function(a, b, c) {
            var d = a.getAttributeNode(c);
            return d || (d = e.createAttribute(c),
            a.setAttributeNode(d)),
            d.value = b + ""
        }
    },
    p.each(["width", "height"], function(a, b) {
        p.attrHooks[b] = p.extend(p.attrHooks[b], {
            set: function(a, c) {
                if (c === "")
                    return a.setAttribute(b, "auto"),
                    c
            }
        })
    }),
    p.attrHooks.contenteditable = {
        get: L.get,
        set: function(a, b, c) {
            b === "" && (b = "false"),
            L.set(a, b, c)
        }
    }),
    p.support.hrefNormalized || p.each(["href", "src", "width", "height"], function(a, c) {
        p.attrHooks[c] = p.extend(p.attrHooks[c], {
            get: function(a) {
                var d = a.getAttribute(c, 2);
                return d === null ? b : d
            }
        })
    }),
    p.support.style || (p.attrHooks.style = {
        get: function(a) {
            return a.style.cssText.toLowerCase() || b
        },
        set: function(a, b) {
            return a.style.cssText = "" + b
        }
    }),
    p.support.optSelected || (p.propHooks.selected = p.extend(p.propHooks.selected, {
        get: function(a) {
            var b = a.parentNode;
            return b && (b.selectedIndex,
            b.parentNode && b.parentNode.selectedIndex),
            null
        }
    })),
    p.support.enctype || (p.propFix.enctype = "encoding"),
    p.support.checkOn || p.each(["radio", "checkbox"], function() {
        p.valHooks[this] = {
            get: function(a) {
                return a.getAttribute("value") === null ? "on" : a.value
            }
        }
    }),
    p.each(["radio", "checkbox"], function() {
        p.valHooks[this] = p.extend(p.valHooks[this], {
            set: function(a, b) {
                if (p.isArray(b))
                    return a.checked = p.inArray(p(a).val(), b) >= 0
            }
        })
    });
    var V = /^(?:textarea|input|select)$/i
      , W = /^([^\.]*|)(?:\.(.+)|)$/
      , X = /(?:^|\s)hover(\.\S+|)\b/
      , Y = /^key/
      , Z = /^(?:mouse|contextmenu)|click/
      , $ = /^(?:focusinfocus|focusoutblur)$/
      , _ = function(a) {
        return p.event.special.hover ? a : a.replace(X, "mouseenter$1 mouseleave$1")
    };
    p.event = {
        add: function(a, c, d, e, f) {
            var g, h, i, j, k, l, m, n, o, q, r;
            if (a.nodeType === 3 || a.nodeType === 8 || !c || !d || !(g = p._data(a)))
                return;
            d.handler && (o = d,
            d = o.handler,
            f = o.selector),
            d.guid || (d.guid = p.guid++),
            i = g.events,
            i || (g.events = i = {}),
            h = g.handle,
            h || (g.handle = h = function(a) {
                return typeof p != "undefined" && (!a || p.event.triggered !== a.type) ? p.event.dispatch.apply(h.elem, arguments) : b
            }
            ,
            h.elem = a),
            c = p.trim(_(c)).split(" ");
            for (j = 0; j < c.length; j++) {
                k = W.exec(c[j]) || [],
                l = k[1],
                m = (k[2] || "").split(".").sort(),
                r = p.event.special[l] || {},
                l = (f ? r.delegateType : r.bindType) || l,
                r = p.event.special[l] || {},
                n = p.extend({
                    type: l,
                    origType: k[1],
                    data: e,
                    handler: d,
                    guid: d.guid,
                    selector: f,
                    namespace: m.join(".")
                }, o),
                q = i[l];
                if (!q) {
                    q = i[l] = [],
                    q.delegateCount = 0;
                    if (!r.setup || r.setup.call(a, e, m, h) === !1)
                        a.addEventListener ? a.addEventListener(l, h, !1) : a.attachEvent && a.attachEvent("on" + l, h)
                }
                r.add && (r.add.call(a, n),
                n.handler.guid || (n.handler.guid = d.guid)),
                f ? q.splice(q.delegateCount++, 0, n) : q.push(n),
                p.event.global[l] = !0
            }
            a = null
        },
        global: {},
        remove: function(a, b, c, d, e) {
            var f, g, h, i, j, k, l, m, n, o, q, r = p.hasData(a) && p._data(a);
            if (!r || !(m = r.events))
                return;
            b = p.trim(_(b || "")).split(" ");
            for (f = 0; f < b.length; f++) {
                g = W.exec(b[f]) || [],
                h = i = g[1],
                j = g[2];
                if (!h) {
                    for (h in m)
                        p.event.remove(a, h + b[f], c, d, !0);
                    continue
                }
                n = p.event.special[h] || {},
                h = (d ? n.delegateType : n.bindType) || h,
                o = m[h] || [],
                k = o.length,
                j = j ? new RegExp("(^|\\.)" + j.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
                for (l = 0; l < o.length; l++)
                    q = o[l],
                    (e || i === q.origType) && (!c || c.guid === q.guid) && (!j || j.test(q.namespace)) && (!d || d === q.selector || d === "**" && q.selector) && (o.splice(l--, 1),
                    q.selector && o.delegateCount--,
                    n.remove && n.remove.call(a, q));
                o.length === 0 && k !== o.length && ((!n.teardown || n.teardown.call(a, j, r.handle) === !1) && p.removeEvent(a, h, r.handle),
                delete m[h])
            }
            p.isEmptyObject(m) && (delete r.handle,
            p.removeData(a, "events", !0))
        },
        customEvent: {
            getData: !0,
            setData: !0,
            changeData: !0
        },
        trigger: function(c, d, f, g) {
            if (!f || f.nodeType !== 3 && f.nodeType !== 8) {
                var h, i, j, k, l, m, n, o, q, r, s = c.type || c, t = [];
                if ($.test(s + p.event.triggered))
                    return;
                s.indexOf("!") >= 0 && (s = s.slice(0, -1),
                i = !0),
                s.indexOf(".") >= 0 && (t = s.split("."),
                s = t.shift(),
                t.sort());
                if ((!f || p.event.customEvent[s]) && !p.event.global[s])
                    return;
                c = typeof c == "object" ? c[p.expando] ? c : new p.Event(s,c) : new p.Event(s),
                c.type = s,
                c.isTrigger = !0,
                c.exclusive = i,
                c.namespace = t.join("."),
                c.namespace_re = c.namespace ? new RegExp("(^|\\.)" + t.join("\\.(?:.*\\.|)") + "(\\.|$)") : null,
                m = s.indexOf(":") < 0 ? "on" + s : "";
                if (!f) {
                    h = p.cache;
                    for (j in h)
                        h[j].events && h[j].events[s] && p.event.trigger(c, d, h[j].handle.elem, !0);
                    return
                }
                c.result = b,
                c.target || (c.target = f),
                d = d != null ? p.makeArray(d) : [],
                d.unshift(c),
                n = p.event.special[s] || {};
                if (n.trigger && n.trigger.apply(f, d) === !1)
                    return;
                q = [[f, n.bindType || s]];
                if (!g && !n.noBubble && !p.isWindow(f)) {
                    r = n.delegateType || s,
                    k = $.test(r + s) ? f : f.parentNode;
                    for (l = f; k; k = k.parentNode)
                        q.push([k, r]),
                        l = k;
                    l === (f.ownerDocument || e) && q.push([l.defaultView || l.parentWindow || a, r])
                }
                for (j = 0; j < q.length && !c.isPropagationStopped(); j++)
                    k = q[j][0],
                    c.type = q[j][1],
                    o = (p._data(k, "events") || {})[c.type] && p._data(k, "handle"),
                    o && o.apply(k, d),
                    o = m && k[m],
                    o && p.acceptData(k) && o.apply(k, d) === !1 && c.preventDefault();
                return c.type = s,
                !g && !c.isDefaultPrevented() && (!n._default || n._default.apply(f.ownerDocument, d) === !1) && (s !== "click" || !p.nodeName(f, "a")) && p.acceptData(f) && m && f[s] && (s !== "focus" && s !== "blur" || c.target.offsetWidth !== 0) && !p.isWindow(f) && (l = f[m],
                l && (f[m] = null),
                p.event.triggered = s,
                f[s](),
                p.event.triggered = b,
                l && (f[m] = l)),
                c.result
            }
            return
        },
        dispatch: function(c) {
            c = p.event.fix(c || a.event);
            var d, e, f, g, h, i, j, k, l, m, n, o = (p._data(this, "events") || {})[c.type] || [], q = o.delegateCount, r = [].slice.call(arguments), s = !c.exclusive && !c.namespace, t = p.event.special[c.type] || {}, u = [];
            r[0] = c,
            c.delegateTarget = this;
            if (t.preDispatch && t.preDispatch.call(this, c) === !1)
                return;
            if (q && (!c.button || c.type !== "click")) {
                g = p(this),
                g.context = this;
                for (f = c.target; f != this; f = f.parentNode || this)
                    if (f.disabled !== !0 || c.type !== "click") {
                        i = {},
                        k = [],
                        g[0] = f;
                        for (d = 0; d < q; d++)
                            l = o[d],
                            m = l.selector,
                            i[m] === b && (i[m] = g.is(m)),
                            i[m] && k.push(l);
                        k.length && u.push({
                            elem: f,
                            matches: k
                        })
                    }
            }
            o.length > q && u.push({
                elem: this,
                matches: o.slice(q)
            });
            for (d = 0; d < u.length && !c.isPropagationStopped(); d++) {
                j = u[d],
                c.currentTarget = j.elem;
                for (e = 0; e < j.matches.length && !c.isImmediatePropagationStopped(); e++) {
                    l = j.matches[e];
                    if (s || !c.namespace && !l.namespace || c.namespace_re && c.namespace_re.test(l.namespace))
                        c.data = l.data,
                        c.handleObj = l,
                        h = ((p.event.special[l.origType] || {}).handle || l.handler).apply(j.elem, r),
                        h !== b && (c.result = h,
                        h === !1 && (c.preventDefault(),
                        c.stopPropagation()))
                }
            }
            return t.postDispatch && t.postDispatch.call(this, c),
            c.result
        },
        props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(a, b) {
                return a.which == null && (a.which = b.charCode != null ? b.charCode : b.keyCode),
                a
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(a, c) {
                var d, f, g, h = c.button, i = c.fromElement;
                return a.pageX == null && c.clientX != null && (d = a.target.ownerDocument || e,
                f = d.documentElement,
                g = d.body,
                a.pageX = c.clientX + (f && f.scrollLeft || g && g.scrollLeft || 0) - (f && f.clientLeft || g && g.clientLeft || 0),
                a.pageY = c.clientY + (f && f.scrollTop || g && g.scrollTop || 0) - (f && f.clientTop || g && g.clientTop || 0)),
                !a.relatedTarget && i && (a.relatedTarget = i === a.target ? c.toElement : i),
                !a.which && h !== b && (a.which = h & 1 ? 1 : h & 2 ? 3 : h & 4 ? 2 : 0),
                a
            }
        },
        fix: function(a) {
            if (a[p.expando])
                return a;
            var b, c, d = a, f = p.event.fixHooks[a.type] || {}, g = f.props ? this.props.concat(f.props) : this.props;
            a = p.Event(d);
            for (b = g.length; b; )
                c = g[--b],
                a[c] = d[c];
            return a.target || (a.target = d.srcElement || e),
            a.target.nodeType === 3 && (a.target = a.target.parentNode),
            a.metaKey = !!a.metaKey,
            f.filter ? f.filter(a, d) : a
        },
        special: {
            ready: {
                setup: p.bindReady
            },
            load: {
                noBubble: !0
            },
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            beforeunload: {
                setup: function(a, b, c) {
                    p.isWindow(this) && (this.onbeforeunload = c)
                },
                teardown: function(a, b) {
                    this.onbeforeunload === b && (this.onbeforeunload = null)
                }
            }
        },
        simulate: function(a, b, c, d) {
            var e = p.extend(new p.Event, c, {
                type: a,
                isSimulated: !0,
                originalEvent: {}
            });
            d ? p.event.trigger(e, null, b) : p.event.dispatch.call(b, e),
            e.isDefaultPrevented() && c.preventDefault()
        }
    },
    p.event.handle = p.event.dispatch,
    p.removeEvent = e.removeEventListener ? function(a, b, c) {
        a.removeEventListener && a.removeEventListener(b, c, !1)
    }
    : function(a, b, c) {
        var d = "on" + b;
        a.detachEvent && (typeof a[d] == "undefined" && (a[d] = null),
        a.detachEvent(d, c))
    }
    ,
    p.Event = function(a, b) {
        if (this instanceof p.Event)
            a && a.type ? (this.originalEvent = a,
            this.type = a.type,
            this.isDefaultPrevented = a.defaultPrevented || a.returnValue === !1 || a.getPreventDefault && a.getPreventDefault() ? bb : ba) : this.type = a,
            b && p.extend(this, b),
            this.timeStamp = a && a.timeStamp || p.now(),
            this[p.expando] = !0;
        else
            return new p.Event(a,b)
    }
    ,
    p.Event.prototype = {
        preventDefault: function() {
            this.isDefaultPrevented = bb;
            var a = this.originalEvent;
            if (!a)
                return;
            a.preventDefault ? a.preventDefault() : a.returnValue = !1
        },
        stopPropagation: function() {
            this.isPropagationStopped = bb;
            var a = this.originalEvent;
            if (!a)
                return;
            a.stopPropagation && a.stopPropagation(),
            a.cancelBubble = !0
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = bb,
            this.stopPropagation()
        },
        isDefaultPrevented: ba,
        isPropagationStopped: ba,
        isImmediatePropagationStopped: ba
    },
    p.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(a, b) {
        p.event.special[a] = {
            delegateType: b,
            bindType: b,
            handle: function(a) {
                var c, d = this, e = a.relatedTarget, f = a.handleObj, g = f.selector;
                if (!e || e !== d && !p.contains(d, e))
                    a.type = f.origType,
                    c = f.handler.apply(this, arguments),
                    a.type = b;
                return c
            }
        }
    }),
    p.support.submitBubbles || (p.event.special.submit = {
        setup: function() {
            if (p.nodeName(this, "form"))
                return !1;
            p.event.add(this, "click._submit keypress._submit", function(a) {
                var c = a.target
                  , d = p.nodeName(c, "input") || p.nodeName(c, "button") ? c.form : b;
                d && !p._data(d, "_submit_attached") && (p.event.add(d, "submit._submit", function(a) {
                    a._submit_bubble = !0
                }),
                p._data(d, "_submit_attached", !0))
            })
        },
        postDispatch: function(a) {
            a._submit_bubble && (delete a._submit_bubble,
            this.parentNode && !a.isTrigger && p.event.simulate("submit", this.parentNode, a, !0))
        },
        teardown: function() {
            if (p.nodeName(this, "form"))
                return !1;
            p.event.remove(this, "._submit")
        }
    }),
    p.support.changeBubbles || (p.event.special.change = {
        setup: function() {
            if (V.test(this.nodeName)) {
                if (this.type === "checkbox" || this.type === "radio")
                    p.event.add(this, "propertychange._change", function(a) {
                        a.originalEvent.propertyName === "checked" && (this._just_changed = !0)
                    }),
                    p.event.add(this, "click._change", function(a) {
                        this._just_changed && !a.isTrigger && (this._just_changed = !1),
                        p.event.simulate("change", this, a, !0)
                    });
                return !1
            }
            p.event.add(this, "beforeactivate._change", function(a) {
                var b = a.target;
                V.test(b.nodeName) && !p._data(b, "_change_attached") && (p.event.add(b, "change._change", function(a) {
                    this.parentNode && !a.isSimulated && !a.isTrigger && p.event.simulate("change", this.parentNode, a, !0)
                }),
                p._data(b, "_change_attached", !0))
            })
        },
        handle: function(a) {
            var b = a.target;
            if (this !== b || a.isSimulated || a.isTrigger || b.type !== "radio" && b.type !== "checkbox")
                return a.handleObj.handler.apply(this, arguments)
        },
        teardown: function() {
            return p.event.remove(this, "._change"),
            V.test(this.nodeName)
        }
    }),
    p.support.focusinBubbles || p.each({
        focus: "focusin",
        blur: "focusout"
    }, function(a, b) {
        var c = 0
          , d = function(a) {
            p.event.simulate(b, a.target, p.event.fix(a), !0)
        };
        p.event.special[b] = {
            setup: function() {
                c++ === 0 && e.addEventListener(a, d, !0)
            },
            teardown: function() {
                --c === 0 && e.removeEventListener(a, d, !0)
            }
        }
    }),
    p.fn.extend({
        on: function(a, c, d, e, f) {
            var g, h;
            if (typeof a == "object") {
                typeof c != "string" && (d = d || c,
                c = b);
                for (h in a)
                    this.on(h, c, d, a[h], f);
                return this
            }
            d == null && e == null ? (e = c,
            d = c = b) : e == null && (typeof c == "string" ? (e = d,
            d = b) : (e = d,
            d = c,
            c = b));
            if (e === !1)
                e = ba;
            else if (!e)
                return this;
            return f === 1 && (g = e,
            e = function(a) {
                return p().off(a),
                g.apply(this, arguments)
            }
            ,
            e.guid = g.guid || (g.guid = p.guid++)),
            this.each(function() {
                p.event.add(this, a, e, d, c)
            })
        },
        one: function(a, b, c, d) {
            return this.on(a, b, c, d, 1)
        },
        off: function(a, c, d) {
            var e, f;
            if (a && a.preventDefault && a.handleObj)
                return e = a.handleObj,
                p(a.delegateTarget).off(e.namespace ? e.origType + "." + e.namespace : e.origType, e.selector, e.handler),
                this;
            if (typeof a == "object") {
                for (f in a)
                    this.off(f, c, a[f]);
                return this
            }
            if (c === !1 || typeof c == "function")
                d = c,
                c = b;
            return d === !1 && (d = ba),
            this.each(function() {
                p.event.remove(this, a, d, c)
            })
        },
        bind: function(a, b, c) {
            return this.on(a, null, b, c)
        },
        unbind: function(a, b) {
            return this.off(a, null, b)
        },
        live: function(a, b, c) {
            return p(this.context).on(a, this.selector, b, c),
            this
        },
        die: function(a, b) {
            return p(this.context).off(a, this.selector || "**", b),
            this
        },
        delegate: function(a, b, c, d) {
            return this.on(b, a, c, d)
        },
        undelegate: function(a, b, c) {
            return arguments.length == 1 ? this.off(a, "**") : this.off(b, a || "**", c)
        },
        trigger: function(a, b) {
            return this.each(function() {
                p.event.trigger(a, b, this)
            })
        },
        triggerHandler: function(a, b) {
            if (this[0])
                return p.event.trigger(a, b, this[0], !0)
        },
        toggle: function(a) {
            var b = arguments
              , c = a.guid || p.guid++
              , d = 0
              , e = function(c) {
                var e = (p._data(this, "lastToggle" + a.guid) || 0) % d;
                return p._data(this, "lastToggle" + a.guid, e + 1),
                c.preventDefault(),
                b[e].apply(this, arguments) || !1
            };
            e.guid = c;
            while (d < b.length)
                b[d++].guid = c;
            return this.click(e)
        },
        hover: function(a, b) {
            return this.mouseenter(a).mouseleave(b || a)
        }
    }),
    p.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(a, b) {
        p.fn[b] = function(a, c) {
            return c == null && (c = a,
            a = null),
            arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b)
        }
        ,
        Y.test(b) && (p.event.fixHooks[b] = p.event.keyHooks),
        Z.test(b) && (p.event.fixHooks[b] = p.event.mouseHooks)
    }),
    function(a, b) {
        function bd(a, b, c, d) {
            var e = 0
              , f = b.length;
            for (; e < f; e++)
                Z(a, b[e], c, d)
        }
        function be(a, b, c, d, e, f) {
            var g, h = $.setFilters[b.toLowerCase()];
            return h || Z.error(b),
            (a || !(g = e)) && bd(a || "*", d, g = [], e),
            g.length > 0 ? h(g, c, f) : []
        }
        function bf(a, c, d, e, f) {
            var g, h, i, j, k, l, m, n, p = 0, q = f.length, s = L.POS, t = new RegExp("^" + s.source + "(?!" + r + ")","i"), u = function() {
                var a = 1
                  , c = arguments.length - 2;
                for (; a < c; a++)
                    arguments[a] === b && (g[a] = b)
            };
            for (; p < q; p++) {
                s.exec(""),
                a = f[p],
                j = [],
                i = 0,
                k = e;
                while (g = s.exec(a)) {
                    n = s.lastIndex = g.index + g[0].length;
                    if (n > i) {
                        m = a.slice(i, g.index),
                        i = n,
                        l = [c],
                        B.test(m) && (k && (l = k),
                        k = e);
                        if (h = H.test(m))
                            m = m.slice(0, -5).replace(B, "$&*");
                        g.length > 1 && g[0].replace(t, u),
                        k = be(m, g[1], g[2], l, k, h)
                    }
                }
                k ? (j = j.concat(k),
                (m = a.slice(i)) && m !== ")" ? B.test(m) ? bd(m, j, d, e) : Z(m, c, d, e ? e.concat(k) : k) : o.apply(d, j)) : Z(a, c, d, e)
            }
            return q === 1 ? d : Z.uniqueSort(d)
        }
        function bg(a, b, c) {
            var d, e, f, g = [], i = 0, j = D.exec(a), k = !j.pop() && !j.pop(), l = k && a.match(C) || [""], m = $.preFilter, n = $.filter, o = !c && b !== h;
            for (; (e = l[i]) != null && k; i++) {
                g.push(d = []),
                o && (e = " " + e);
                while (e) {
                    k = !1;
                    if (j = B.exec(e))
                        e = e.slice(j[0].length),
                        k = d.push({
                            part: j.pop().replace(A, " "),
                            captures: j
                        });
                    for (f in n)
                        (j = L[f].exec(e)) && (!m[f] || (j = m[f](j, b, c))) && (e = e.slice(j.shift().length),
                        k = d.push({
                            part: f,
                            captures: j
                        }));
                    if (!k)
                        break
                }
            }
            return k || Z.error(a),
            g
        }
        function bh(a, b, e) {
            var f = b.dir
              , g = m++;
            return a || (a = function(a) {
                return a === e
            }
            ),
            b.first ? function(b, c) {
                while (b = b[f])
                    if (b.nodeType === 1)
                        return a(b, c) && b
            }
            : function(b, e) {
                var h, i = g + "." + d, j = i + "." + c;
                while (b = b[f])
                    if (b.nodeType === 1) {
                        if ((h = b[q]) === j)
                            return b.sizset;
                        if (typeof h == "string" && h.indexOf(i) === 0) {
                            if (b.sizset)
                                return b
                        } else {
                            b[q] = j;
                            if (a(b, e))
                                return b.sizset = !0,
                                b;
                            b.sizset = !1
                        }
                    }
            }
        }
        function bi(a, b) {
            return a ? function(c, d) {
                var e = b(c, d);
                return e && a(e === !0 ? c : e, d)
            }
            : b
        }
        function bj(a, b, c) {
            var d, e, f = 0;
            for (; d = a[f]; f++)
                $.relative[d.part] ? e = bh(e, $.relative[d.part], b) : (d.captures.push(b, c),
                e = bi(e, $.filter[d.part].apply(null, d.captures)));
            return e
        }
        function bk(a) {
            return function(b, c) {
                var d, e = 0;
                for (; d = a[e]; e++)
                    if (d(b, c))
                        return !0;
                return !1
            }
        }
        var c, d, e, f, g, h = a.document, i = h.documentElement, j = "undefined", k = !1, l = !0, m = 0, n = [].slice, o = [].push, q = ("sizcache" + Math.random()).replace(".", ""), r = "[\\x20\\t\\r\\n\\f]", s = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+", t = s.replace("w", "w#"), u = "([*^$|!~]?=)", v = "\\[" + r + "*(" + s + ")" + r + "*(?:" + u + r + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + t + ")|)|)" + r + "*\\]", w = ":(" + s + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|((?:[^,]|\\\\,|(?:,(?=[^\\[]*\\]))|(?:,(?=[^\\(]*\\))))*))\\)|)", x = ":(nth|eq|gt|lt|first|last|even|odd)(?:\\((\\d*)\\)|)(?=[^-]|$)", y = r + "*([\\x20\\t\\r\\n\\f>+~])" + r + "*", z = "(?=[^\\x20\\t\\r\\n\\f])(?:\\\\.|" + v + "|" + w.replace(2, 7) + "|[^\\\\(),])+", A = new RegExp("^" + r + "+|((?:^|[^\\\\])(?:\\\\.)*)" + r + "+$","g"), B = new RegExp("^" + y), C = new RegExp(z + "?(?=" + r + "*,|$)","g"), D = new RegExp("^(?:(?!,)(?:(?:^|,)" + r + "*" + z + ")*?|" + r + "*(.*?))(\\)|$)"), E = new RegExp(z.slice(19, -6) + "\\x20\\t\\r\\n\\f>+~])+|" + y,"g"), F = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/, G = /[\x20\t\r\n\f]*[+~]/, H = /:not\($/, I = /h\d/i, J = /input|select|textarea|button/i, K = /\\(?!\\)/g, L = {
            ID: new RegExp("^#(" + s + ")"),
            CLASS: new RegExp("^\\.(" + s + ")"),
            NAME: new RegExp("^\\[name=['\"]?(" + s + ")['\"]?\\]"),
            TAG: new RegExp("^(" + s.replace("[-", "[-\\*") + ")"),
            ATTR: new RegExp("^" + v),
            PSEUDO: new RegExp("^" + w),
            CHILD: new RegExp("^:(only|nth|last|first)-child(?:\\(" + r + "*(even|odd|(([+-]|)(\\d*)n|)" + r + "*(?:([+-]|)" + r + "*(\\d+)|))" + r + "*\\)|)","i"),
            POS: new RegExp(x,"ig"),
            needsContext: new RegExp("^" + r + "*[>+~]|" + x,"i")
        }, M = {}, N = [], O = {}, P = [], Q = function(a) {
            return a.sizzleFilter = !0,
            a
        }, R = function(a) {
            return function(b) {
                return b.nodeName.toLowerCase() === "input" && b.type === a
            }
        }, S = function(a) {
            return function(b) {
                var c = b.nodeName.toLowerCase();
                return (c === "input" || c === "button") && b.type === a
            }
        }, T = function(a) {
            var b = !1
              , c = h.createElement("div");
            try {
                b = a(c)
            } catch (d) {}
            return c = null,
            b
        }, U = T(function(a) {
            a.innerHTML = "<select></select>";
            var b = typeof a.lastChild.getAttribute("multiple");
            return b !== "boolean" && b !== "string"
        }), V = T(function(a) {
            a.id = q + 0,
            a.innerHTML = "<a name='" + q + "'></a><div name='" + q + "'></div>",
            i.insertBefore(a, i.firstChild);
            var b = h.getElementsByName && h.getElementsByName(q).length === 2 + h.getElementsByName(q + 0).length;
            return g = !h.getElementById(q),
            i.removeChild(a),
            b
        }), W = T(function(a) {
            return a.appendChild(h.createComment("")),
            a.getElementsByTagName("*").length === 0
        }), X = T(function(a) {
            return a.innerHTML = "<a href='#'></a>",
            a.firstChild && typeof a.firstChild.getAttribute !== j && a.firstChild.getAttribute("href") === "#"
        }), Y = T(function(a) {
            return a.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>",
            !a.getElementsByClassName || a.getElementsByClassName("e").length === 0 ? !1 : (a.lastChild.className = "e",
            a.getElementsByClassName("e").length !== 1)
        }), Z = function(a, b, c, d) {
            c = c || [],
            b = b || h;
            var e, f, g, i, j = b.nodeType;
            if (j !== 1 && j !== 9)
                return [];
            if (!a || typeof a != "string")
                return c;
            g = ba(b);
            if (!g && !d)
                if (e = F.exec(a))
                    if (i = e[1]) {
                        if (j === 9) {
                            f = b.getElementById(i);
                            if (!f || !f.parentNode)
                                return c;
                            if (f.id === i)
                                return c.push(f),
                                c
                        } else if (b.ownerDocument && (f = b.ownerDocument.getElementById(i)) && bb(b, f) && f.id === i)
                            return c.push(f),
                            c
                    } else {
                        if (e[2])
                            return o.apply(c, n.call(b.getElementsByTagName(a), 0)),
                            c;
                        if ((i = e[3]) && Y && b.getElementsByClassName)
                            return o.apply(c, n.call(b.getElementsByClassName(i), 0)),
                            c
                    }
            return bm(a, b, c, d, g)
        }, $ = Z.selectors = {
            cacheLength: 50,
            match: L,
            order: ["ID", "TAG"],
            attrHandle: {},
            createPseudo: Q,
            find: {
                ID: g ? function(a, b, c) {
                    if (typeof b.getElementById !== j && !c) {
                        var d = b.getElementById(a);
                        return d && d.parentNode ? [d] : []
                    }
                }
                : function(a, c, d) {
                    if (typeof c.getElementById !== j && !d) {
                        var e = c.getElementById(a);
                        return e ? e.id === a || typeof e.getAttributeNode !== j && e.getAttributeNode("id").value === a ? [e] : b : []
                    }
                }
                ,
                TAG: W ? function(a, b) {
                    if (typeof b.getElementsByTagName !== j)
                        return b.getElementsByTagName(a)
                }
                : function(a, b) {
                    var c = b.getElementsByTagName(a);
                    if (a === "*") {
                        var d, e = [], f = 0;
                        for (; d = c[f]; f++)
                            d.nodeType === 1 && e.push(d);
                        return e
                    }
                    return c
                }
            },
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(a) {
                    return a[1] = a[1].replace(K, ""),
                    a[3] = (a[4] || a[5] || "").replace(K, ""),
                    a[2] === "~=" && (a[3] = " " + a[3] + " "),
                    a.slice(0, 4)
                },
                CHILD: function(a) {
                    return a[1] = a[1].toLowerCase(),
                    a[1] === "nth" ? (a[2] || Z.error(a[0]),
                    a[3] = +(a[3] ? a[4] + (a[5] || 1) : 2 * (a[2] === "even" || a[2] === "odd")),
                    a[4] = +(a[6] + a[7] || a[2] === "odd")) : a[2] && Z.error(a[0]),
                    a
                },
                PSEUDO: function(a) {
                    var b, c = a[4];
                    return L.CHILD.test(a[0]) ? null : (c && (b = D.exec(c)) && b.pop() && (a[0] = a[0].slice(0, b[0].length - c.length - 1),
                    c = b[0].slice(0, -1)),
                    a.splice(2, 3, c || a[3]),
                    a)
                }
            },
            filter: {
                ID: g ? function(a) {
                    return a = a.replace(K, ""),
                    function(b) {
                        return b.getAttribute("id") === a
                    }
                }
                : function(a) {
                    return a = a.replace(K, ""),
                    function(b) {
                        var c = typeof b.getAttributeNode !== j && b.getAttributeNode("id");
                        return c && c.value === a
                    }
                }
                ,
                TAG: function(a) {
                    return a === "*" ? function() {
                        return !0
                    }
                    : (a = a.replace(K, "").toLowerCase(),
                    function(b) {
                        return b.nodeName && b.nodeName.toLowerCase() === a
                    }
                    )
                },
                CLASS: function(a) {
                    var b = M[a];
                    return b || (b = M[a] = new RegExp("(^|" + r + ")" + a + "(" + r + "|$)"),
                    N.push(a),
                    N.length > $.cacheLength && delete M[N.shift()]),
                    function(a) {
                        return b.test(a.className || typeof a.getAttribute !== j && a.getAttribute("class") || "")
                    }
                },
                ATTR: function(a, b, c) {
                    return b ? function(d) {
                        var e = Z.attr(d, a)
                          , f = e + "";
                        if (e == null)
                            return b === "!=";
                        switch (b) {
                        case "=":
                            return f === c;
                        case "!=":
                            return f !== c;
                        case "^=":
                            return c && f.indexOf(c) === 0;
                        case "*=":
                            return c && f.indexOf(c) > -1;
                        case "$=":
                            return c && f.substr(f.length - c.length) === c;
                        case "~=":
                            return (" " + f + " ").indexOf(c) > -1;
                        case "|=":
                            return f === c || f.substr(0, c.length + 1) === c + "-"
                        }
                    }
                    : function(b) {
                        return Z.attr(b, a) != null
                    }
                },
                CHILD: function(a, b, c, d) {
                    if (a === "nth") {
                        var e = m++;
                        return function(a) {
                            var b, f, g = 0, h = a;
                            if (c === 1 && d === 0)
                                return !0;
                            b = a.parentNode;
                            if (b && (b[q] !== e || !a.sizset)) {
                                for (h = b.firstChild; h; h = h.nextSibling)
                                    if (h.nodeType === 1) {
                                        h.sizset = ++g;
                                        if (h === a)
                                            break
                                    }
                                b[q] = e
                            }
                            return f = a.sizset - d,
                            c === 0 ? f === 0 : f % c === 0 && f / c >= 0
                        }
                    }
                    return function(b) {
                        var c = b;
                        switch (a) {
                        case "only":
                        case "first":
                            while (c = c.previousSibling)
                                if (c.nodeType === 1)
                                    return !1;
                            if (a === "first")
                                return !0;
                            c = b;
                        case "last":
                            while (c = c.nextSibling)
                                if (c.nodeType === 1)
                                    return !1;
                            return !0
                        }
                    }
                },
                PSEUDO: function(a, b, c, d) {
                    var e = $.pseudos[a] || $.pseudos[a.toLowerCase()];
                    return e || Z.error("unsupported pseudo: " + a),
                    e.sizzleFilter ? e(b, c, d) : e
                }
            },
            pseudos: {
                not: Q(function(a, b, c) {
                    var d = bl(a.replace(A, "$1"), b, c);
                    return function(a) {
                        return !d(a)
                    }
                }),
                enabled: function(a) {
                    return a.disabled === !1
                },
                disabled: function(a) {
                    return a.disabled === !0
                },
                checked: function(a) {
                    var b = a.nodeName.toLowerCase();
                    return b === "input" && !!a.checked || b === "option" && !!a.selected
                },
                selected: function(a) {
                    return a.parentNode && a.parentNode.selectedIndex,
                    a.selected === !0
                },
                parent: function(a) {
                    return !$.pseudos.empty(a)
                },
                empty: function(a) {
                    var b;
                    a = a.firstChild;
                    while (a) {
                        if (a.nodeName > "@" || (b = a.nodeType) === 3 || b === 4)
                            return !1;
                        a = a.nextSibling
                    }
                    return !0
                },
                contains: Q(function(a) {
                    return function(b) {
                        return (b.textContent || b.innerText || bc(b)).indexOf(a) > -1
                    }
                }),
                has: Q(function(a) {
                    return function(b) {
                        return Z(a, b).length > 0
                    }
                }),
                header: function(a) {
                    return I.test(a.nodeName)
                },
                text: function(a) {
                    var b, c;
                    return a.nodeName.toLowerCase() === "input" && (b = a.type) === "text" && ((c = a.getAttribute("type")) == null || c.toLowerCase() === b)
                },
                radio: R("radio"),
                checkbox: R("checkbox"),
                file: R("file"),
                password: R("password"),
                image: R("image"),
                submit: S("submit"),
                reset: S("reset"),
                button: function(a) {
                    var b = a.nodeName.toLowerCase();
                    return b === "input" && a.type === "button" || b === "button"
                },
                input: function(a) {
                    return J.test(a.nodeName)
                },
                focus: function(a) {
                    var b = a.ownerDocument;
                    return a === b.activeElement && (!b.hasFocus || b.hasFocus()) && (!!a.type || !!a.href)
                },
                active: function(a) {
                    return a === a.ownerDocument.activeElement
                }
            },
            setFilters: {
                first: function(a, b, c) {
                    return c ? a.slice(1) : [a[0]]
                },
                last: function(a, b, c) {
                    var d = a.pop();
                    return c ? a : [d]
                },
                even: function(a, b, c) {
                    var d = []
                      , e = c ? 1 : 0
                      , f = a.length;
                    for (; e < f; e = e + 2)
                        d.push(a[e]);
                    return d
                },
                odd: function(a, b, c) {
                    var d = []
                      , e = c ? 0 : 1
                      , f = a.length;
                    for (; e < f; e = e + 2)
                        d.push(a[e]);
                    return d
                },
                lt: function(a, b, c) {
                    return c ? a.slice(+b) : a.slice(0, +b)
                },
                gt: function(a, b, c) {
                    return c ? a.slice(0, +b + 1) : a.slice(+b + 1)
                },
                eq: function(a, b, c) {
                    var d = a.splice(+b, 1);
                    return c ? a : d
                }
            }
        };
        $.setFilters.nth = $.setFilters.eq,
        $.filters = $.pseudos,
        X || ($.attrHandle = {
            href: function(a) {
                return a.getAttribute("href", 2)
            },
            type: function(a) {
                return a.getAttribute("type")
            }
        }),
        V && ($.order.push("NAME"),
        $.find.NAME = function(a, b) {
            if (typeof b.getElementsByName !== j)
                return b.getElementsByName(a)
        }
        ),
        Y && ($.order.splice(1, 0, "CLASS"),
        $.find.CLASS = function(a, b, c) {
            if (typeof b.getElementsByClassName !== j && !c)
                return b.getElementsByClassName(a)
        }
        );
        try {
            n.call(i.childNodes, 0)[0].nodeType
        } catch (_) {
            n = function(a) {
                var b, c = [];
                for (; b = this[a]; a++)
                    c.push(b);
                return c
            }
        }
        var ba = Z.isXML = function(a) {
            var b = a && (a.ownerDocument || a).documentElement;
            return b ? b.nodeName !== "HTML" : !1
        }
          , bb = Z.contains = i.compareDocumentPosition ? function(a, b) {
            return !!(a.compareDocumentPosition(b) & 16)
        }
        : i.contains ? function(a, b) {
            var c = a.nodeType === 9 ? a.documentElement : a
              , d = b.parentNode;
            return a === d || !!(d && d.nodeType === 1 && c.contains && c.contains(d))
        }
        : function(a, b) {
            while (b = b.parentNode)
                if (b === a)
                    return !0;
            return !1
        }
          , bc = Z.getText = function(a) {
            var b, c = "", d = 0, e = a.nodeType;
            if (e) {
                if (e === 1 || e === 9 || e === 11) {
                    if (typeof a.textContent == "string")
                        return a.textContent;
                    for (a = a.firstChild; a; a = a.nextSibling)
                        c += bc(a)
                } else if (e === 3 || e === 4)
                    return a.nodeValue
            } else
                for (; b = a[d]; d++)
                    c += bc(b);
            return c
        }
        ;
        Z.attr = function(a, b) {
            var c, d = ba(a);
            return d || (b = b.toLowerCase()),
            $.attrHandle[b] ? $.attrHandle[b](a) : U || d ? a.getAttribute(b) : (c = a.getAttributeNode(b),
            c ? typeof a[b] == "boolean" ? a[b] ? b : null : c.specified ? c.value : null : null)
        }
        ,
        Z.error = function(a) {
            throw new Error("Syntax error, unrecognized expression: " + a)
        }
        ,
        [0, 0].sort(function() {
            return l = 0
        }),
        i.compareDocumentPosition ? e = function(a, b) {
            return a === b ? (k = !0,
            0) : (!a.compareDocumentPosition || !b.compareDocumentPosition ? a.compareDocumentPosition : a.compareDocumentPosition(b) & 4) ? -1 : 1
        }
        : (e = function(a, b) {
            if (a === b)
                return k = !0,
                0;
            if (a.sourceIndex && b.sourceIndex)
                return a.sourceIndex - b.sourceIndex;
            var c, d, e = [], g = [], h = a.parentNode, i = b.parentNode, j = h;
            if (h === i)
                return f(a, b);
            if (!h)
                return -1;
            if (!i)
                return 1;
            while (j)
                e.unshift(j),
                j = j.parentNode;
            j = i;
            while (j)
                g.unshift(j),
                j = j.parentNode;
            c = e.length,
            d = g.length;
            for (var l = 0; l < c && l < d; l++)
                if (e[l] !== g[l])
                    return f(e[l], g[l]);
            return l === c ? f(a, g[l], -1) : f(e[l], b, 1)
        }
        ,
        f = function(a, b, c) {
            if (a === b)
                return c;
            var d = a.nextSibling;
            while (d) {
                if (d === b)
                    return -1;
                d = d.nextSibling
            }
            return 1
        }
        ),
        Z.uniqueSort = function(a) {
            var b, c = 1;
            if (e) {
                k = l,
                a.sort(e);
                if (k)
                    for (; b = a[c]; c++)
                        b === a[c - 1] && a.splice(c--, 1)
            }
            return a
        }
        ;
        var bl = Z.compile = function(a, b, c) {
            var d, e, f, g = O[a];
            if (g && g.context === b)
                return g;
            e = bg(a, b, c);
            for (f = 0; d = e[f]; f++)
                e[f] = bj(d, b, c);
            return g = O[a] = bk(e),
            g.context = b,
            g.runs = g.dirruns = 0,
            P.push(a),
            P.length > $.cacheLength && delete O[P.shift()],
            g
        }
        ;
        Z.matches = function(a, b) {
            return Z(a, null, null, b)
        }
        ,
        Z.matchesSelector = function(a, b) {
            return Z(b, null, null, [a]).length > 0
        }
        ;
        var bm = function(a, b, e, f, g) {
            a = a.replace(A, "$1");
            var h, i, j, k, l, m, p, q, r, s = a.match(C), t = a.match(E), u = b.nodeType;
            if (L.POS.test(a))
                return bf(a, b, e, f, s);
            if (f)
                h = n.call(f, 0);
            else if (s && s.length === 1) {
                if (t.length > 1 && u === 9 && !g && (s = L.ID.exec(t[0]))) {
                    b = $.find.ID(s[1], b, g)[0];
                    if (!b)
                        return e;
                    a = a.slice(t.shift().length)
                }
                q = (s = G.exec(t[0])) && !s.index && b.parentNode || b,
                r = t.pop(),
                m = r.split(":not")[0];
                for (j = 0,
                k = $.order.length; j < k; j++) {
                    p = $.order[j];
                    if (s = L[p].exec(m)) {
                        h = $.find[p]((s[1] || "").replace(K, ""), q, g);
                        if (h == null)
                            continue;
                        m === r && (a = a.slice(0, a.length - r.length) + m.replace(L[p], ""),
                        a || o.apply(e, n.call(h, 0)));
                        break
                    }
                }
            }
            if (a) {
                i = bl(a, b, g),
                d = i.dirruns++,
                h == null && (h = $.find.TAG("*", G.test(a) && b.parentNode || b));
                for (j = 0; l = h[j]; j++)
                    c = i.runs++,
                    i(l, b) && e.push(l)
            }
            return e
        };
        h.querySelectorAll && function() {
            var a, b = bm, c = /'|\\/g, d = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g, e = [], f = [":active"], g = i.matchesSelector || i.mozMatchesSelector || i.webkitMatchesSelector || i.oMatchesSelector || i.msMatchesSelector;
            T(function(a) {
                a.innerHTML = "<select><option selected></option></select>",
                a.querySelectorAll("[selected]").length || e.push("\\[" + r + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),
                a.querySelectorAll(":checked").length || e.push(":checked")
            }),
            T(function(a) {
                a.innerHTML = "<p test=''></p>",
                a.querySelectorAll("[test^='']").length && e.push("[*^$]=" + r + "*(?:\"\"|'')"),
                a.innerHTML = "<input type='hidden'>",
                a.querySelectorAll(":enabled").length || e.push(":enabled", ":disabled")
            }),
            e = e.length && new RegExp(e.join("|")),
            bm = function(a, d, f, g, h) {
                if (!g && !h && (!e || !e.test(a)))
                    if (d.nodeType === 9)
                        try {
                            return o.apply(f, n.call(d.querySelectorAll(a), 0)),
                            f
                        } catch (i) {}
                    else if (d.nodeType === 1 && d.nodeName.toLowerCase() !== "object") {
                        var j = d.getAttribute("id")
                          , k = j || q
                          , l = G.test(a) && d.parentNode || d;
                        j ? k = k.replace(c, "\\$&") : d.setAttribute("id", k);
                        try {
                            return o.apply(f, n.call(l.querySelectorAll(a.replace(C, "[id='" + k + "'] $&")), 0)),
                            f
                        } catch (i) {} finally {
                            j || d.removeAttribute("id")
                        }
                    }
                return b(a, d, f, g, h)
            }
            ,
            g && (T(function(b) {
                a = g.call(b, "div");
                try {
                    g.call(b, "[test!='']:sizzle"),
                    f.push($.match.PSEUDO)
                } catch (c) {}
            }),
            f = new RegExp(f.join("|")),
            Z.matchesSelector = function(b, c) {
                c = c.replace(d, "='$1']");
                if (!ba(b) && !f.test(c) && (!e || !e.test(c)))
                    try {
                        var h = g.call(b, c);
                        if (h || a || b.document && b.document.nodeType !== 11)
                            return h
                    } catch (i) {}
                return Z(c, null, null, [b]).length > 0
            }
            )
        }(),
        Z.attr = p.attr,
        p.find = Z,
        p.expr = Z.selectors,
        p.expr[":"] = p.expr.pseudos,
        p.unique = Z.uniqueSort,
        p.text = Z.getText,
        p.isXMLDoc = Z.isXML,
        p.contains = Z.contains
    }(a);
    var bc = /Until$/
      , bd = /^(?:parents|prev(?:Until|All))/
      , be = /^.[^:#\[\.,]*$/
      , bf = p.expr.match.needsContext
      , bg = {
        children: !0,
        contents: !0,
        next: !0,
        prev: !0
    };
    p.fn.extend({
        find: function(a) {
            var b, c, d, e, f, g, h = this;
            if (typeof a != "string")
                return p(a).filter(function() {
                    for (b = 0,
                    c = h.length; b < c; b++)
                        if (p.contains(h[b], this))
                            return !0
                });
            g = this.pushStack("", "find", a);
            for (b = 0,
            c = this.length; b < c; b++) {
                d = g.length,
                p.find(a, this[b], g);
                if (b > 0)
                    for (e = d; e < g.length; e++)
                        for (f = 0; f < d; f++)
                            if (g[f] === g[e]) {
                                g.splice(e--, 1);
                                break
                            }
            }
            return g
        },
        has: function(a) {
            var b, c = p(a, this), d = c.length;
            return this.filter(function() {
                for (b = 0; b < d; b++)
                    if (p.contains(this, c[b]))
                        return !0
            })
        },
        not: function(a) {
            return this.pushStack(bj(this, a, !1), "not", a)
        },
        filter: function(a) {
            return this.pushStack(bj(this, a, !0), "filter", a)
        },
        is: function(a) {
            return !!a && (typeof a == "string" ? bf.test(a) ? p(a, this.context).index(this[0]) >= 0 : p.filter(a, this).length > 0 : this.filter(a).length > 0)
        },
        closest: function(a, b) {
            var c, d = 0, e = this.length, f = [], g = bf.test(a) || typeof a != "string" ? p(a, b || this.context) : 0;
            for (; d < e; d++) {
                c = this[d];
                while (c && c.ownerDocument && c !== b && c.nodeType !== 11) {
                    if (g ? g.index(c) > -1 : p.find.matchesSelector(c, a)) {
                        f.push(c);
                        break
                    }
                    c = c.parentNode
                }
            }
            return f = f.length > 1 ? p.unique(f) : f,
            this.pushStack(f, "closest", a)
        },
        index: function(a) {
            return a ? typeof a == "string" ? p.inArray(this[0], p(a)) : p.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.prevAll().length : -1
        },
        add: function(a, b) {
            var c = typeof a == "string" ? p(a, b) : p.makeArray(a && a.nodeType ? [a] : a)
              , d = p.merge(this.get(), c);
            return this.pushStack(bh(c[0]) || bh(d[0]) ? d : p.unique(d))
        },
        addBack: function(a) {
            return this.add(a == null ? this.prevObject : this.prevObject.filter(a))
        }
    }),
    p.fn.andSelf = p.fn.addBack,
    p.each({
        parent: function(a) {
            var b = a.parentNode;
            return b && b.nodeType !== 11 ? b : null
        },
        parents: function(a) {
            return p.dir(a, "parentNode")
        },
        parentsUntil: function(a, b, c) {
            return p.dir(a, "parentNode", c)
        },
        next: function(a) {
            return bi(a, "nextSibling")
        },
        prev: function(a) {
            return bi(a, "previousSibling")
        },
        nextAll: function(a) {
            return p.dir(a, "nextSibling")
        },
        prevAll: function(a) {
            return p.dir(a, "previousSibling")
        },
        nextUntil: function(a, b, c) {
            return p.dir(a, "nextSibling", c)
        },
        prevUntil: function(a, b, c) {
            return p.dir(a, "previousSibling", c)
        },
        siblings: function(a) {
            return p.sibling((a.parentNode || {}).firstChild, a)
        },
        children: function(a) {
            return p.sibling(a.firstChild)
        },
        contents: function(a) {
            return p.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : p.merge([], a.childNodes)
        }
    }, function(a, b) {
        p.fn[a] = function(c, d) {
            var e = p.map(this, b, c);
            return bc.test(a) || (d = c),
            d && typeof d == "string" && (e = p.filter(d, e)),
            e = this.length > 1 && !bg[a] ? p.unique(e) : e,
            this.length > 1 && bd.test(a) && (e = e.reverse()),
            this.pushStack(e, a, k.call(arguments).join(","))
        }
    }),
    p.extend({
        filter: function(a, b, c) {
            return c && (a = ":not(" + a + ")"),
            b.length === 1 ? p.find.matchesSelector(b[0], a) ? [b[0]] : [] : p.find.matches(a, b)
        },
        dir: function(a, c, d) {
            var e = []
              , f = a[c];
            while (f && f.nodeType !== 9 && (d === b || f.nodeType !== 1 || !p(f).is(d)))
                f.nodeType === 1 && e.push(f),
                f = f[c];
            return e
        },
        sibling: function(a, b) {
            var c = [];
            for (; a; a = a.nextSibling)
                a.nodeType === 1 && a !== b && c.push(a);
            return c
        }
    });
    var bl = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video"
      , bm = / jQuery\d+="(?:null|\d+)"/g
      , bn = /^\s+/
      , bo = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi
      , bp = /<([\w:]+)/
      , bq = /<tbody/i
      , br = /<|&#?\w+;/
      , bs = /<(?:script|style|link)/i
      , bt = /<(?:script|object|embed|option|style)/i
      , bu = new RegExp("<(?:" + bl + ")[\\s/>]","i")
      , bv = /^(?:checkbox|radio)$/
      , bw = /checked\s*(?:[^=]|=\s*.checked.)/i
      , bx = /\/(java|ecma)script/i
      , by = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g
      , bz = {
        option: [1, "<select multiple='multiple'>", "</select>"],
        legend: [1, "<fieldset>", "</fieldset>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>", "</tbody></table>"],
        td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
        area: [1, "<map>", "</map>"],
        _default: [0, "", ""]
    }
      , bA = bk(e)
      , bB = bA.appendChild(e.createElement("div"));
    bz.optgroup = bz.option,
    bz.tbody = bz.tfoot = bz.colgroup = bz.caption = bz.thead,
    bz.th = bz.td,
    p.support.htmlSerialize || (bz._default = [1, "X<div>", "</div>"]),
    p.fn.extend({
        text: function(a) {
            return p.access(this, function(a) {
                return a === b ? p.text(this) : this.empty().append((this[0] && this[0].ownerDocument || e).createTextNode(a))
            }, null, a, arguments.length)
        },
        wrapAll: function(a) {
            if (p.isFunction(a))
                return this.each(function(b) {
                    p(this).wrapAll(a.call(this, b))
                });
            if (this[0]) {
                var b = p(a, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && b.insertBefore(this[0]),
                b.map(function() {
                    var a = this;
                    while (a.firstChild && a.firstChild.nodeType === 1)
                        a = a.firstChild;
                    return a
                }).append(this)
            }
            return this
        },
        wrapInner: function(a) {
            return p.isFunction(a) ? this.each(function(b) {
                p(this).wrapInner(a.call(this, b))
            }) : this.each(function() {
                var b = p(this)
                  , c = b.contents();
                c.length ? c.wrapAll(a) : b.append(a)
            })
        },
        wrap: function(a) {
            var b = p.isFunction(a);
            return this.each(function(c) {
                p(this).wrapAll(b ? a.call(this, c) : a)
            })
        },
        unwrap: function() {
            return this.parent().each(function() {
                p.nodeName(this, "body") || p(this).replaceWith(this.childNodes)
            }).end()
        },
        append: function() {
            return this.domManip(arguments, !0, function(a) {
                (this.nodeType === 1 || this.nodeType === 11) && this.appendChild(a)
            })
        },
        prepend: function() {
            return this.domManip(arguments, !0, function(a) {
                (this.nodeType === 1 || this.nodeType === 11) && this.insertBefore(a, this.firstChild)
            })
        },
        before: function() {
            if (!bh(this[0]))
                return this.domManip(arguments, !1, function(a) {
                    this.parentNode.insertBefore(a, this)
                });
            if (arguments.length) {
                var a = p.clean(arguments);
                return this.pushStack(p.merge(a, this), "before", this.selector)
            }
        },
        after: function() {
            if (!bh(this[0]))
                return this.domManip(arguments, !1, function(a) {
                    this.parentNode.insertBefore(a, this.nextSibling)
                });
            if (arguments.length) {
                var a = p.clean(arguments);
                return this.pushStack(p.merge(this, a), "after", this.selector)
            }
        },
        remove: function(a, b) {
            var c, d = 0;
            for (; (c = this[d]) != null; d++)
                if (!a || p.filter(a, [c]).length)
                    !b && c.nodeType === 1 && (p.cleanData(c.getElementsByTagName("*")),
                    p.cleanData([c])),
                    c.parentNode && c.parentNode.removeChild(c);
            return this
        },
        empty: function() {
            var a, b = 0;
            for (; (a = this[b]) != null; b++) {
                a.nodeType === 1 && p.cleanData(a.getElementsByTagName("*"));
                while (a.firstChild)
                    a.removeChild(a.firstChild)
            }
            return this
        },
        clone: function(a, b) {
            return a = a == null ? !1 : a,
            b = b == null ? a : b,
            this.map(function() {
                return p.clone(this, a, b)
            })
        },
        html: function(a) {
            return p.access(this, function(a) {
                var c = this[0] || {}
                  , d = 0
                  , e = this.length;
                if (a === b)
                    return c.nodeType === 1 ? c.innerHTML.replace(bm, "") : b;
                if (typeof a == "string" && !bs.test(a) && (p.support.htmlSerialize || !bu.test(a)) && (p.support.leadingWhitespace || !bn.test(a)) && !bz[(bp.exec(a) || ["", ""])[1].toLowerCase()]) {
                    a = a.replace(bo, "<$1></$2>");
                    try {
                        for (; d < e; d++)
                            c = this[d] || {},
                            c.nodeType === 1 && (p.cleanData(c.getElementsByTagName("*")),
                            c.innerHTML = a);
                        c = 0
                    } catch (f) {}
                }
                c && this.empty().append(a)
            }, null, a, arguments.length)
        },
        replaceWith: function(a) {
            return bh(this[0]) ? this.length ? this.pushStack(p(p.isFunction(a) ? a() : a), "replaceWith", a) : this : p.isFunction(a) ? this.each(function(b) {
                var c = p(this)
                  , d = c.html();
                c.replaceWith(a.call(this, b, d))
            }) : (typeof a != "string" && (a = p(a).detach()),
            this.each(function() {
                var b = this.nextSibling
                  , c = this.parentNode;
                p(this).remove(),
                b ? p(b).before(a) : p(c).append(a)
            }))
        },
        detach: function(a) {
            return this.remove(a, !0)
        },
        domManip: function(a, c, d) {
            a = [].concat.apply([], a);
            var e, f, g, h, i = 0, j = a[0], k = [], l = this.length;
            if (!p.support.checkClone && l > 1 && typeof j == "string" && bw.test(j))
                return this.each(function() {
                    p(this).domManip(a, c, d)
                });
            if (p.isFunction(j))
                return this.each(function(e) {
                    var f = p(this);
                    a[0] = j.call(this, e, c ? f.html() : b),
                    f.domManip(a, c, d)
                });
            if (this[0]) {
                e = p.buildFragment(a, this, k),
                g = e.fragment,
                f = g.firstChild,
                g.childNodes.length === 1 && (g = f);
                if (f) {
                    c = c && p.nodeName(f, "tr");
                    for (h = e.cacheable || l - 1; i < l; i++)
                        d.call(c && p.nodeName(this[i], "table") ? bC(this[i], "tbody") : this[i], i === h ? g : p.clone(g, !0, !0))
                }
                g = f = null,
                k.length && p.each(k, function(a, b) {
                    b.src ? p.ajax ? p.ajax({
                        url: b.src,
                        type: "GET",
                        dataType: "script",
                        async: !1,
                        global: !1,
                        "throws": !0
                    }) : p.error("no ajax") : p.globalEval((b.text || b.textContent || b.innerHTML || "").replace(by, "")),
                    b.parentNode && b.parentNode.removeChild(b)
                })
            }
            return this
        }
    }),
    p.buildFragment = function(a, c, d) {
        var f, g, h, i = a[0];
        return c = c || e,
        c = (c[0] || c).ownerDocument || c[0] || c,
        typeof c.createDocumentFragment == "undefined" && (c = e),
        a.length === 1 && typeof i == "string" && i.length < 512 && c === e && i.charAt(0) === "<" && !bt.test(i) && (p.support.checkClone || !bw.test(i)) && (p.support.html5Clone || !bu.test(i)) && (g = !0,
        f = p.fragments[i],
        h = f !== b),
        f || (f = c.createDocumentFragment(),
        p.clean(a, c, f, d),
        g && (p.fragments[i] = h && f)),
        {
            fragment: f,
            cacheable: g
        }
    }
    ,
    p.fragments = {},
    p.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(a, b) {
        p.fn[a] = function(c) {
            var d, e = 0, f = [], g = p(c), h = g.length, i = this.length === 1 && this[0].parentNode;
            if ((i == null || i && i.nodeType === 11 && i.childNodes.length === 1) && h === 1)
                return g[b](this[0]),
                this;
            for (; e < h; e++)
                d = (e > 0 ? this.clone(!0) : this).get(),
                p(g[e])[b](d),
                f = f.concat(d);
            return this.pushStack(f, a, g.selector)
        }
    }),
    p.extend({
        clone: function(a, b, c) {
            var d, e, f, g;
            p.support.html5Clone || p.isXMLDoc(a) || !bu.test("<" + a.nodeName + ">") ? g = a.cloneNode(!0) : (bB.innerHTML = a.outerHTML,
            bB.removeChild(g = bB.firstChild));
            if ((!p.support.noCloneEvent || !p.support.noCloneChecked) && (a.nodeType === 1 || a.nodeType === 11) && !p.isXMLDoc(a)) {
                bE(a, g),
                d = bF(a),
                e = bF(g);
                for (f = 0; d[f]; ++f)
                    e[f] && bE(d[f], e[f])
            }
            if (b) {
                bD(a, g);
                if (c) {
                    d = bF(a),
                    e = bF(g);
                    for (f = 0; d[f]; ++f)
                        bD(d[f], e[f])
                }
            }
            return d = e = null,
            g
        },
        clean: function(a, b, c, d) {
            var f, g, h, i, j, k, l, m, n, o, q, r, s = 0, t = [];
            if (!b || typeof b.createDocumentFragment == "undefined")
                b = e;
            for (g = b === e && bA; (h = a[s]) != null; s++) {
                typeof h == "number" && (h += "");
                if (!h)
                    continue;
                if (typeof h == "string")
                    if (!br.test(h))
                        h = b.createTextNode(h);
                    else {
                        g = g || bk(b),
                        l = l || g.appendChild(b.createElement("div")),
                        h = h.replace(bo, "<$1></$2>"),
                        i = (bp.exec(h) || ["", ""])[1].toLowerCase(),
                        j = bz[i] || bz._default,
                        k = j[0],
                        l.innerHTML = j[1] + h + j[2];
                        while (k--)
                            l = l.lastChild;
                        if (!p.support.tbody) {
                            m = bq.test(h),
                            n = i === "table" && !m ? l.firstChild && l.firstChild.childNodes : j[1] === "<table>" && !m ? l.childNodes : [];
                            for (f = n.length - 1; f >= 0; --f)
                                p.nodeName(n[f], "tbody") && !n[f].childNodes.length && n[f].parentNode.removeChild(n[f])
                        }
                        !p.support.leadingWhitespace && bn.test(h) && l.insertBefore(b.createTextNode(bn.exec(h)[0]), l.firstChild),
                        h = l.childNodes,
                        l = g.lastChild
                    }
                h.nodeType ? t.push(h) : t = p.merge(t, h)
            }
            l && (g.removeChild(l),
            h = l = g = null);
            if (!p.support.appendChecked)
                for (s = 0; (h = t[s]) != null; s++)
                    p.nodeName(h, "input") ? bG(h) : typeof h.getElementsByTagName != "undefined" && p.grep(h.getElementsByTagName("input"), bG);
            if (c) {
                q = function(a) {
                    if (!a.type || bx.test(a.type))
                        return d ? d.push(a.parentNode ? a.parentNode.removeChild(a) : a) : c.appendChild(a)
                }
                ;
                for (s = 0; (h = t[s]) != null; s++)
                    if (!p.nodeName(h, "script") || !q(h))
                        c.appendChild(h),
                        typeof h.getElementsByTagName != "undefined" && (r = p.grep(p.merge([], h.getElementsByTagName("script")), q),
                        t.splice.apply(t, [s + 1, 0].concat(r)),
                        s += r.length)
            }
            return t
        },
        cleanData: function(a, b) {
            var c, d, e, f, g = 0, h = p.expando, i = p.cache, j = p.support.deleteExpando, k = p.event.special;
            for (; (e = a[g]) != null; g++)
                if (b || p.acceptData(e)) {
                    d = e[h],
                    c = d && i[d];
                    if (c) {
                        if (c.events)
                            for (f in c.events)
                                k[f] ? p.event.remove(e, f) : p.removeEvent(e, f, c.handle);
                        i[d] && (delete i[d],
                        j ? delete e[h] : e.removeAttribute ? e.removeAttribute(h) : e[h] = null,
                        p.deletedIds.push(d))
                    }
                }
        }
    }),
    function() {
        var a, b;
        p.uaMatch = function(a) {
            a = a.toLowerCase();
            var b = /(chrome)[ \/]([\w.]+)/.exec(a) || /(webkit)[ \/]([\w.]+)/.exec(a) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a) || /(msie) ([\w.]+)/.exec(a) || a.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a) || [];
            return {
                browser: b[1] || "",
                version: b[2] || "0"
            }
        }
        ,
        a = p.uaMatch(g.userAgent),
        b = {},
        a.browser && (b[a.browser] = !0,
        b.version = a.version),
        b.webkit && (b.safari = !0),
        p.browser = b,
        p.sub = function() {
            function a(b, c) {
                return new a.fn.init(b,c)
            }
            p.extend(!0, a, this),
            a.superclass = this,
            a.fn = a.prototype = this(),
            a.fn.constructor = a,
            a.sub = this.sub,
            a.fn.init = function c(c, d) {
                return d && d instanceof p && !(d instanceof a) && (d = a(d)),
                p.fn.init.call(this, c, d, b)
            }
            ,
            a.fn.init.prototype = a.fn;
            var b = a(e);
            return a
        }
    }();
    var bH, bI, bJ, bK = /alpha\([^)]*\)/i, bL = /opacity=([^)]*)/, bM = /^(top|right|bottom|left)$/, bN = /^margin/, bO = new RegExp("^(" + q + ")(.*)$","i"), bP = new RegExp("^(" + q + ")(?!px)[a-z%]+$","i"), bQ = new RegExp("^([-+])=(" + q + ")","i"), bR = {}, bS = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, bT = {
        letterSpacing: 0,
        fontWeight: 400,
        lineHeight: 1
    }, bU = ["Top", "Right", "Bottom", "Left"], bV = ["Webkit", "O", "Moz", "ms"], bW = p.fn.toggle;
    p.fn.extend({
        css: function(a, c) {
            return p.access(this, function(a, c, d) {
                return d !== b ? p.style(a, c, d) : p.css(a, c)
            }, a, c, arguments.length > 1)
        },
        show: function() {
            return bZ(this, !0)
        },
        hide: function() {
            return bZ(this)
        },
        toggle: function(a, b) {
            var c = typeof a == "boolean";
            return p.isFunction(a) && p.isFunction(b) ? bW.apply(this, arguments) : this.each(function() {
                (c ? a : bY(this)) ? p(this).show() : p(this).hide()
            })
        }
    }),
    p.extend({
        cssHooks: {
            opacity: {
                get: function(a, b) {
                    if (b) {
                        var c = bH(a, "opacity");
                        return c === "" ? "1" : c
                    }
                }
            }
        },
        cssNumber: {
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": p.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(a, c, d, e) {
            if (!a || a.nodeType === 3 || a.nodeType === 8 || !a.style)
                return;
            var f, g, h, i = p.camelCase(c), j = a.style;
            c = p.cssProps[i] || (p.cssProps[i] = bX(j, i)),
            h = p.cssHooks[c] || p.cssHooks[i];
            if (d === b)
                return h && "get"in h && (f = h.get(a, !1, e)) !== b ? f : j[c];
            g = typeof d,
            g === "string" && (f = bQ.exec(d)) && (d = (f[1] + 1) * f[2] + parseFloat(p.css(a, c)),
            g = "number");
            if (d == null || g === "number" && isNaN(d))
                return;
            g === "number" && !p.cssNumber[i] && (d += "px");
            if (!h || !("set"in h) || (d = h.set(a, d, e)) !== b)
                try {
                    j[c] = d
                } catch (k) {}
        },
        css: function(a, c, d, e) {
            var f, g, h, i = p.camelCase(c);
            return c = p.cssProps[i] || (p.cssProps[i] = bX(a.style, i)),
            h = p.cssHooks[c] || p.cssHooks[i],
            h && "get"in h && (f = h.get(a, !0, e)),
            f === b && (f = bH(a, c)),
            f === "normal" && c in bT && (f = bT[c]),
            d || e !== b ? (g = parseFloat(f),
            d || p.isNumeric(g) ? g || 0 : f) : f
        },
        swap: function(a, b, c) {
            var d, e, f = {};
            for (e in b)
                f[e] = a.style[e],
                a.style[e] = b[e];
            d = c.call(a);
            for (e in b)
                a.style[e] = f[e];
            return d
        }
    }),
    a.getComputedStyle ? bH = function(a, b) {
        var c, d, e, f, g = getComputedStyle(a, null), h = a.style;
        return g && (c = g[b],
        c === "" && !p.contains(a.ownerDocument.documentElement, a) && (c = p.style(a, b)),
        bP.test(c) && bN.test(b) && (d = h.width,
        e = h.minWidth,
        f = h.maxWidth,
        h.minWidth = h.maxWidth = h.width = c,
        c = g.width,
        h.width = d,
        h.minWidth = e,
        h.maxWidth = f)),
        c
    }
    : e.documentElement.currentStyle && (bH = function(a, b) {
        var c, d, e = a.currentStyle && a.currentStyle[b], f = a.style;
        return e == null && f && f[b] && (e = f[b]),
        bP.test(e) && !bM.test(b) && (c = f.left,
        d = a.runtimeStyle && a.runtimeStyle.left,
        d && (a.runtimeStyle.left = a.currentStyle.left),
        f.left = b === "fontSize" ? "1em" : e,
        e = f.pixelLeft + "px",
        f.left = c,
        d && (a.runtimeStyle.left = d)),
        e === "" ? "auto" : e
    }
    ),
    p.each(["height", "width"], function(a, b) {
        p.cssHooks[b] = {
            get: function(a, c, d) {
                if (c)
                    return a.offsetWidth !== 0 || bH(a, "display") !== "none" ? ca(a, b, d) : p.swap(a, bS, function() {
                        return ca(a, b, d)
                    })
            },
            set: function(a, c, d) {
                return b$(a, c, d ? b_(a, b, d, p.support.boxSizing && p.css(a, "boxSizing") === "border-box") : 0)
            }
        }
    }),
    p.support.opacity || (p.cssHooks.opacity = {
        get: function(a, b) {
            return bL.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : b ? "1" : ""
        },
        set: function(a, b) {
            var c = a.style
              , d = a.currentStyle
              , e = p.isNumeric(b) ? "alpha(opacity=" + b * 100 + ")" : ""
              , f = d && d.filter || c.filter || "";
            c.zoom = 1;
            if (b >= 1 && p.trim(f.replace(bK, "")) === "" && c.removeAttribute) {
                c.removeAttribute("filter");
                if (d && !d.filter)
                    return
            }
            c.filter = bK.test(f) ? f.replace(bK, e) : f + " " + e
        }
    }),
    p(function() {
        p.support.reliableMarginRight || (p.cssHooks.marginRight = {
            get: function(a, b) {
                return p.swap(a, {
                    display: "inline-block"
                }, function() {
                    if (b)
                        return bH(a, "marginRight")
                })
            }
        }),
        !p.support.pixelPosition && p.fn.position && p.each(["top", "left"], function(a, b) {
            p.cssHooks[b] = {
                get: function(a, c) {
                    if (c) {
                        var d = bH(a, b);
                        return bP.test(d) ? p(a).position()[b] + "px" : d
                    }
                }
            }
        })
    }),
    p.expr && p.expr.filters && (p.expr.filters.hidden = function(a) {
        return a.offsetWidth === 0 && a.offsetHeight === 0 || !p.support.reliableHiddenOffsets && (a.style && a.style.display || bH(a, "display")) === "none"
    }
    ,
    p.expr.filters.visible = function(a) {
        return !p.expr.filters.hidden(a)
    }
    ),
    p.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(a, b) {
        p.cssHooks[a + b] = {
            expand: function(c) {
                var d, e = typeof c == "string" ? c.split(" ") : [c], f = {};
                for (d = 0; d < 4; d++)
                    f[a + bU[d] + b] = e[d] || e[d - 2] || e[0];
                return f
            }
        },
        bN.test(a) || (p.cssHooks[a + b].set = b$)
    });
    var cc = /%20/g
      , cd = /\[\]$/
      , ce = /\r?\n/g
      , cf = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i
      , cg = /^(?:select|textarea)/i;
    p.fn.extend({
        serialize: function() {
            return p.param(this.serializeArray())
        },
        serializeArray: function() {
            return this.map(function() {
                return this.elements ? p.makeArray(this.elements) : this
            }).filter(function() {
                return this.name && !this.disabled && (this.checked || cg.test(this.nodeName) || cf.test(this.type))
            }).map(function(a, b) {
                var c = p(this).val();
                return c == null ? null : p.isArray(c) ? p.map(c, function(a, c) {
                    return {
                        name: b.name,
                        value: a.replace(ce, "\r\n")
                    }
                }) : {
                    name: b.name,
                    value: c.replace(ce, "\r\n")
                }
            }).get()
        }
    }),
    p.param = function(a, c) {
        var d, e = [], f = function(a, b) {
            b = p.isFunction(b) ? b() : b == null ? "" : b,
            e[e.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b)
        };
        c === b && (c = p.ajaxSettings && p.ajaxSettings.traditional);
        if (p.isArray(a) || a.jquery && !p.isPlainObject(a))
            p.each(a, function() {
                f(this.name, this.value)
            });
        else
            for (d in a)
                ch(d, a[d], c, f);
        return e.join("&").replace(cc, "+")
    }
    ;
    var ci, cj, ck = /#.*$/, cl = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, cm = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/, cn = /^(?:GET|HEAD)$/, co = /^\/\//, cp = /\?/, cq = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, cr = /([?&])_=[^&]*/, cs = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/, ct = p.fn.load, cu = {}, cv = {}, cw = ["*/"] + ["*"];
    try {
        ci = f.href
    } catch (cx) {
        ci = e.createElement("a"),
        ci.href = "",
        ci = ci.href
    }
    cj = cs.exec(ci.toLowerCase()) || [],
    p.fn.load = function(a, c, d) {
        if (typeof a != "string" && ct)
            return ct.apply(this, arguments);
        if (!this.length)
            return this;
        var e, f, g, h = this, i = a.indexOf(" ");
        return i >= 0 && (e = a.slice(i, a.length),
        a = a.slice(0, i)),
        p.isFunction(c) ? (d = c,
        c = b) : typeof c == "object" && (f = "POST"),
        p.ajax({
            url: a,
            type: f,
            dataType: "html",
            data: c,
            complete: function(a, b) {
                d && h.each(d, g || [a.responseText, b, a])
            }
        }).done(function(a) {
            g = arguments,
            h.html(e ? p("<div>").append(a.replace(cq, "")).find(e) : a)
        }),
        this
    }
    ,
    p.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function(a, b) {
        p.fn[b] = function(a) {
            return this.on(b, a)
        }
    }),
    p.each(["get", "post"], function(a, c) {
        p[c] = function(a, d, e, f) {
            return p.isFunction(d) && (f = f || e,
            e = d,
            d = b),
            p.ajax({
                type: c,
                url: a,
                data: d,
                success: e,
                dataType: f
            })
        }
    }),
    p.extend({
        getScript: function(a, c) {
            return p.get(a, b, c, "script")
        },
        getJSON: function(a, b, c) {
            return p.get(a, b, c, "json")
        },
        ajaxSetup: function(a, b) {
            return b ? cA(a, p.ajaxSettings) : (b = a,
            a = p.ajaxSettings),
            cA(a, b),
            a
        },
        ajaxSettings: {
            url: ci,
            isLocal: cm.test(cj[1]),
            global: !0,
            type: "GET",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            processData: !0,
            async: !0,
            accepts: {
                xml: "application/xml, text/xml",
                html: "text/html",
                text: "text/plain",
                json: "application/json, text/javascript",
                "*": cw
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText"
            },
            converters: {
                "* text": a.String,
                "text html": !0,
                "text json": p.parseJSON,
                "text xml": p.parseXML
            },
            flatOptions: {
                context: !0,
                url: !0
            }
        },
        ajaxPrefilter: cy(cu),
        ajaxTransport: cy(cv),
        ajax: function(a, c) {
            function y(a, c, f, i) {
                var k, s, t, u, w, y = c;
                if (v === 2)
                    return;
                v = 2,
                h && clearTimeout(h),
                g = b,
                e = i || "",
                x.readyState = a > 0 ? 4 : 0,
                f && (u = cB(l, x, f));
                if (a >= 200 && a < 300 || a === 304)
                    l.ifModified && (w = x.getResponseHeader("Last-Modified"),
                    w && (p.lastModified[d] = w),
                    w = x.getResponseHeader("Etag"),
                    w && (p.etag[d] = w)),
                    a === 304 ? (y = "notmodified",
                    k = !0) : (k = cC(l, u),
                    y = k.state,
                    s = k.data,
                    t = k.error,
                    k = !t);
                else {
                    t = y;
                    if (!y || a)
                        y = "error",
                        a < 0 && (a = 0)
                }
                x.status = a,
                x.statusText = "" + (c || y),
                k ? o.resolveWith(m, [s, y, x]) : o.rejectWith(m, [x, y, t]),
                x.statusCode(r),
                r = b,
                j && n.trigger("ajax" + (k ? "Success" : "Error"), [x, l, k ? s : t]),
                q.fireWith(m, [x, y]),
                j && (n.trigger("ajaxComplete", [x, l]),
                --p.active || p.event.trigger("ajaxStop"))
            }
            typeof a == "object" && (c = a,
            a = b),
            c = c || {};
            var d, e, f, g, h, i, j, k, l = p.ajaxSetup({}, c), m = l.context || l, n = m !== l && (m.nodeType || m instanceof p) ? p(m) : p.event, o = p.Deferred(), q = p.Callbacks("once memory"), r = l.statusCode || {}, t = {}, u = {}, v = 0, w = "canceled", x = {
                readyState: 0,
                setRequestHeader: function(a, b) {
                    if (!v) {
                        var c = a.toLowerCase();
                        a = u[c] = u[c] || a,
                        t[a] = b
                    }
                    return this
                },
                getAllResponseHeaders: function() {
                    return v === 2 ? e : null
                },
                getResponseHeader: function(a) {
                    var c;
                    if (v === 2) {
                        if (!f) {
                            f = {};
                            while (c = cl.exec(e))
                                f[c[1].toLowerCase()] = c[2]
                        }
                        c = f[a.toLowerCase()]
                    }
                    return c === b ? null : c
                },
                overrideMimeType: function(a) {
                    return v || (l.mimeType = a),
                    this
                },
                abort: function(a) {
                    return a = a || w,
                    g && g.abort(a),
                    y(0, a),
                    this
                }
            };
            o.promise(x),
            x.success = x.done,
            x.error = x.fail,
            x.complete = q.add,
            x.statusCode = function(a) {
                if (a) {
                    var b;
                    if (v < 2)
                        for (b in a)
                            r[b] = [r[b], a[b]];
                    else
                        b = a[x.status],
                        x.always(b)
                }
                return this
            }
            ,
            l.url = ((a || l.url) + "").replace(ck, "").replace(co, cj[1] + "//"),
            l.dataTypes = p.trim(l.dataType || "*").toLowerCase().split(s),
            l.crossDomain == null && (i = cs.exec(l.url.toLowerCase()),
            l.crossDomain = !(!i || i[1] == cj[1] && i[2] == cj[2] && (i[3] || (i[1] === "http:" ? 80 : 443)) == (cj[3] || (cj[1] === "http:" ? 80 : 443)))),
            l.data && l.processData && typeof l.data != "string" && (l.data = p.param(l.data, l.traditional)),
            cz(cu, l, c, x);
            if (v === 2)
                return x;
            j = l.global,
            l.type = l.type.toUpperCase(),
            l.hasContent = !cn.test(l.type),
            j && p.active++ === 0 && p.event.trigger("ajaxStart");
            if (!l.hasContent) {
                l.data && (l.url += (cp.test(l.url) ? "&" : "?") + l.data,
                delete l.data),
                d = l.url;
                if (l.cache === !1) {
                    var z = p.now()
                      , A = l.url.replace(cr, "$1_=" + z);
                    l.url = A + (A === l.url ? (cp.test(l.url) ? "&" : "?") + "_=" + z : "")
                }
            }
            (l.data && l.hasContent && l.contentType !== !1 || c.contentType) && x.setRequestHeader("Content-Type", l.contentType),
            l.ifModified && (d = d || l.url,
            p.lastModified[d] && x.setRequestHeader("If-Modified-Since", p.lastModified[d]),
            p.etag[d] && x.setRequestHeader("If-None-Match", p.etag[d])),
            x.setRequestHeader("Accept", l.dataTypes[0] && l.accepts[l.dataTypes[0]] ? l.accepts[l.dataTypes[0]] + (l.dataTypes[0] !== "*" ? ", " + cw + "; q=0.01" : "") : l.accepts["*"]);
            for (k in l.headers)
                x.setRequestHeader(k, l.headers[k]);
            if (!l.beforeSend || l.beforeSend.call(m, x, l) !== !1 && v !== 2) {
                w = "abort";
                for (k in {
                    success: 1,
                    error: 1,
                    complete: 1
                })
                    x[k](l[k]);
                g = cz(cv, l, c, x);
                if (!g)
                    y(-1, "No Transport");
                else {
                    x.readyState = 1,
                    j && n.trigger("ajaxSend", [x, l]),
                    l.async && l.timeout > 0 && (h = setTimeout(function() {
                        x.abort("timeout")
                    }, l.timeout));
                    try {
                        v = 1,
                        g.send(t, y)
                    } catch (B) {
                        if (v < 2)
                            y(-1, B);
                        else
                            throw B
                    }
                }
                return x
            }
            return x.abort()
        },
        active: 0,
        lastModified: {},
        etag: {}
    });
    var cD = []
      , cE = /\?/
      , cF = /(=)\?(?=&|$)|\?\?/
      , cG = p.now();
    p.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var a = cD.pop() || p.expando + "_" + cG++;
            return this[a] = !0,
            a
        }
    }),
    p.ajaxPrefilter("json jsonp", function(c, d, e) {
        var f, g, h, i = c.data, j = c.url, k = c.jsonp !== !1, l = k && cF.test(j), m = k && !l && typeof i == "string" && !(c.contentType || "").indexOf("application/x-www-form-urlencoded") && cF.test(i);
        if (c.dataTypes[0] === "jsonp" || l || m)
            return f = c.jsonpCallback = p.isFunction(c.jsonpCallback) ? c.jsonpCallback() : c.jsonpCallback,
            g = a[f],
            l ? c.url = j.replace(cF, "$1" + f) : m ? c.data = i.replace(cF, "$1" + f) : k && (c.url += (cE.test(j) ? "&" : "?") + c.jsonp + "=" + f),
            c.converters["script json"] = function() {
                return h || p.error(f + " was not called"),
                h[0]
            }
            ,
            c.dataTypes[0] = "json",
            a[f] = function() {
                h = arguments
            }
            ,
            e.always(function() {
                a[f] = g,
                c[f] && (c.jsonpCallback = d.jsonpCallback,
                cD.push(f)),
                h && p.isFunction(g) && g(h[0]),
                h = g = b
            }),
            "script"
    }),
    p.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /javascript|ecmascript/
        },
        converters: {
            "text script": function(a) {
                return p.globalEval(a),
                a
            }
        }
    }),
    p.ajaxPrefilter("script", function(a) {
        a.cache === b && (a.cache = !1),
        a.crossDomain && (a.type = "GET",
        a.global = !1)
    }),
    p.ajaxTransport("script", function(a) {
        if (a.crossDomain) {
            var c, d = e.head || e.getElementsByTagName("head")[0] || e.documentElement;
            return {
                send: function(f, g) {
                    c = e.createElement("script"),
                    c.async = "async",
                    a.scriptCharset && (c.charset = a.scriptCharset),
                    c.src = a.url,
                    c.onload = c.onreadystatechange = function(a, e) {
                        if (e || !c.readyState || /loaded|complete/.test(c.readyState))
                            c.onload = c.onreadystatechange = null,
                            d && c.parentNode && d.removeChild(c),
                            c = b,
                            e || g(200, "success")
                    }
                    ,
                    d.insertBefore(c, d.firstChild)
                },
                abort: function() {
                    c && c.onload(0, 1)
                }
            }
        }
    });
    var cH, cI = a.ActiveXObject ? function() {
        for (var a in cH)
            cH[a](0, 1)
    }
    : !1, cJ = 0;
    p.ajaxSettings.xhr = a.ActiveXObject ? function() {
        return !this.isLocal && cK() || cL()
    }
    : cK,
    function(a) {
        p.extend(p.support, {
            ajax: !!a,
            cors: !!a && "withCredentials"in a
        })
    }(p.ajaxSettings.xhr()),
    p.support.ajax && p.ajaxTransport(function(c) {
        if (!c.crossDomain || p.support.cors) {
            var d;
            return {
                send: function(e, f) {
                    var g, h, i = c.xhr();
                    c.username ? i.open(c.type, c.url, c.async, c.username, c.password) : i.open(c.type, c.url, c.async);
                    if (c.xhrFields)
                        for (h in c.xhrFields)
                            i[h] = c.xhrFields[h];
                    c.mimeType && i.overrideMimeType && i.overrideMimeType(c.mimeType),
                    !c.crossDomain && !e["X-Requested-With"] && (e["X-Requested-With"] = "XMLHttpRequest");
                    try {
                        for (h in e)
                            i.setRequestHeader(h, e[h])
                    } catch (j) {}
                    i.send(c.hasContent && c.data || null),
                    d = function(a, e) {
                        var h, j, k, l, m;
                        try {
                            if (d && (e || i.readyState === 4)) {
                                d = b,
                                g && (i.onreadystatechange = p.noop,
                                cI && delete cH[g]);
                                if (e)
                                    i.readyState !== 4 && i.abort();
                                else {
                                    h = i.status,
                                    k = i.getAllResponseHeaders(),
                                    l = {},
                                    m = i.responseXML,
                                    m && m.documentElement && (l.xml = m);
                                    try {
                                        l.text = i.responseText
                                    } catch (a) {}
                                    try {
                                        j = i.statusText
                                    } catch (n) {
                                        j = ""
                                    }
                                    !h && c.isLocal && !c.crossDomain ? h = l.text ? 200 : 404 : h === 1223 && (h = 204)
                                }
                            }
                        } catch (o) {
                            e || f(-1, o)
                        }
                        l && f(h, j, l, k)
                    }
                    ,
                    c.async ? i.readyState === 4 ? setTimeout(d, 0) : (g = ++cJ,
                    cI && (cH || (cH = {},
                    p(a).unload(cI)),
                    cH[g] = d),
                    i.onreadystatechange = d) : d()
                },
                abort: function() {
                    d && d(0, 1)
                }
            }
        }
    });
    var cM, cN, cO = /^(?:toggle|show|hide)$/, cP = new RegExp("^(?:([-+])=|)(" + q + ")([a-z%]*)$","i"), cQ = /queueHooks$/, cR = [cX], cS = {
        "*": [function(a, b) {
            var c, d, e, f = this.createTween(a, b), g = cP.exec(b), h = f.cur(), i = +h || 0, j = 1;
            if (g) {
                c = +g[2],
                d = g[3] || (p.cssNumber[a] ? "" : "px");
                if (d !== "px" && i) {
                    i = p.css(f.elem, a, !0) || c || 1;
                    do
                        e = j = j || ".5",
                        i = i / j,
                        p.style(f.elem, a, i + d),
                        j = f.cur() / h;
                    while (j !== 1 && j !== e)
                }
                f.unit = d,
                f.start = i,
                f.end = g[1] ? i + (g[1] + 1) * c : c
            }
            return f
        }
        ]
    };
    p.Animation = p.extend(cV, {
        tweener: function(a, b) {
            p.isFunction(a) ? (b = a,
            a = ["*"]) : a = a.split(" ");
            var c, d = 0, e = a.length;
            for (; d < e; d++)
                c = a[d],
                cS[c] = cS[c] || [],
                cS[c].unshift(b)
        },
        prefilter: function(a, b) {
            b ? cR.unshift(a) : cR.push(a)
        }
    }),
    p.Tween = cY,
    cY.prototype = {
        constructor: cY,
        init: function(a, b, c, d, e, f) {
            this.elem = a,
            this.prop = c,
            this.easing = e || "swing",
            this.options = b,
            this.start = this.now = this.cur(),
            this.end = d,
            this.unit = f || (p.cssNumber[c] ? "" : "px")
        },
        cur: function() {
            var a = cY.propHooks[this.prop];
            return a && a.get ? a.get(this) : cY.propHooks._default.get(this)
        },
        run: function(a) {
            var b, c = cY.propHooks[this.prop];
            return this.pos = b = p.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration),
            this.now = (this.end - this.start) * b + this.start,
            this.options.step && this.options.step.call(this.elem, this.now, this),
            c && c.set ? c.set(this) : cY.propHooks._default.set(this),
            this
        }
    },
    cY.prototype.init.prototype = cY.prototype,
    cY.propHooks = {
        _default: {
            get: function(a) {
                var b;
                return a.elem[a.prop] == null || !!a.elem.style && a.elem.style[a.prop] != null ? (b = p.css(a.elem, a.prop, !1, ""),
                !b || b === "auto" ? 0 : b) : a.elem[a.prop]
            },
            set: function(a) {
                p.fx.step[a.prop] ? p.fx.step[a.prop](a) : a.elem.style && (a.elem.style[p.cssProps[a.prop]] != null || p.cssHooks[a.prop]) ? p.style(a.elem, a.prop, a.now + a.unit) : a.elem[a.prop] = a.now
            }
        }
    },
    cY.propHooks.scrollTop = cY.propHooks.scrollLeft = {
        set: function(a) {
            a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now)
        }
    },
    p.each(["toggle", "show", "hide"], function(a, b) {
        var c = p.fn[b];
        p.fn[b] = function(d, e, f) {
            return d == null || typeof d == "boolean" || !a && p.isFunction(d) && p.isFunction(e) ? c.apply(this, arguments) : this.animate(cZ(b, !0), d, e, f)
        }
    }),
    p.fn.extend({
        fadeTo: function(a, b, c, d) {
            return this.filter(bY).css("opacity", 0).show().end().animate({
                opacity: b
            }, a, c, d)
        },
        animate: function(a, b, c, d) {
            var e = p.isEmptyObject(a)
              , f = p.speed(b, c, d)
              , g = function() {
                var b = cV(this, p.extend({}, a), f);
                e && b.stop(!0)
            };
            return e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g)
        },
        stop: function(a, c, d) {
            var e = function(a) {
                var b = a.stop;
                delete a.stop,
                b(d)
            };
            return typeof a != "string" && (d = c,
            c = a,
            a = b),
            c && a !== !1 && this.queue(a || "fx", []),
            this.each(function() {
                var b = !0
                  , c = a != null && a + "queueHooks"
                  , f = p.timers
                  , g = p._data(this);
                if (c)
                    g[c] && g[c].stop && e(g[c]);
                else
                    for (c in g)
                        g[c] && g[c].stop && cQ.test(c) && e(g[c]);
                for (c = f.length; c--; )
                    f[c].elem === this && (a == null || f[c].queue === a) && (f[c].anim.stop(d),
                    b = !1,
                    f.splice(c, 1));
                (b || !d) && p.dequeue(this, a)
            })
        }
    }),
    p.each({
        slideDown: cZ("show"),
        slideUp: cZ("hide"),
        slideToggle: cZ("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(a, b) {
        p.fn[a] = function(a, c, d) {
            return this.animate(b, a, c, d)
        }
    }),
    p.speed = function(a, b, c) {
        var d = a && typeof a == "object" ? p.extend({}, a) : {
            complete: c || !c && b || p.isFunction(a) && a,
            duration: a,
            easing: c && b || b && !p.isFunction(b) && b
        };
        d.duration = p.fx.off ? 0 : typeof d.duration == "number" ? d.duration : d.duration in p.fx.speeds ? p.fx.speeds[d.duration] : p.fx.speeds._default;
        if (d.queue == null || d.queue === !0)
            d.queue = "fx";
        return d.old = d.complete,
        d.complete = function() {
            p.isFunction(d.old) && d.old.call(this),
            d.queue && p.dequeue(this, d.queue)
        }
        ,
        d
    }
    ,
    p.easing = {
        linear: function(a) {
            return a
        },
        swing: function(a) {
            return .5 - Math.cos(a * Math.PI) / 2
        }
    },
    p.timers = [],
    p.fx = cY.prototype.init,
    p.fx.tick = function() {
        var a, b = p.timers, c = 0;
        for (; c < b.length; c++)
            a = b[c],
            !a() && b[c] === a && b.splice(c--, 1);
        b.length || p.fx.stop()
    }
    ,
    p.fx.timer = function(a) {
        a() && p.timers.push(a) && !cN && (cN = setInterval(p.fx.tick, p.fx.interval))
    }
    ,
    p.fx.interval = 13,
    p.fx.stop = function() {
        clearInterval(cN),
        cN = null
    }
    ,
    p.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    },
    p.fx.step = {},
    p.expr && p.expr.filters && (p.expr.filters.animated = function(a) {
        return p.grep(p.timers, function(b) {
            return a === b.elem
        }).length
    }
    );
    var c$ = /^(?:body|html)$/i;
    p.fn.offset = function(a) {
        if (arguments.length)
            return a === b ? this : this.each(function(b) {
                p.offset.setOffset(this, a, b)
            });
        var c, d, e, f, g, h, i, j, k, l, m = this[0], n = m && m.ownerDocument;
        if (!n)
            return;
        return (e = n.body) === m ? p.offset.bodyOffset(m) : (d = n.documentElement,
        p.contains(d, m) ? (c = m.getBoundingClientRect(),
        f = c_(n),
        g = d.clientTop || e.clientTop || 0,
        h = d.clientLeft || e.clientLeft || 0,
        i = f.pageYOffset || d.scrollTop,
        j = f.pageXOffset || d.scrollLeft,
        k = c.top + i - g,
        l = c.left + j - h,
        {
            top: k,
            left: l
        }) : {
            top: 0,
            left: 0
        })
    }
    ,
    p.offset = {
        bodyOffset: function(a) {
            var b = a.offsetTop
              , c = a.offsetLeft;
            return p.support.doesNotIncludeMarginInBodyOffset && (b += parseFloat(p.css(a, "marginTop")) || 0,
            c += parseFloat(p.css(a, "marginLeft")) || 0),
            {
                top: b,
                left: c
            }
        },
        setOffset: function(a, b, c) {
            var d = p.css(a, "position");
            d === "static" && (a.style.position = "relative");
            var e = p(a), f = e.offset(), g = p.css(a, "top"), h = p.css(a, "left"), i = (d === "absolute" || d === "fixed") && p.inArray("auto", [g, h]) > -1, j = {}, k = {}, l, m;
            i ? (k = e.position(),
            l = k.top,
            m = k.left) : (l = parseFloat(g) || 0,
            m = parseFloat(h) || 0),
            p.isFunction(b) && (b = b.call(a, c, f)),
            b.top != null && (j.top = b.top - f.top + l),
            b.left != null && (j.left = b.left - f.left + m),
            "using"in b ? b.using.call(a, j) : e.css(j)
        }
    },
    p.fn.extend({
        position: function() {
            if (!this[0])
                return;
            var a = this[0]
              , b = this.offsetParent()
              , c = this.offset()
              , d = c$.test(b[0].nodeName) ? {
                top: 0,
                left: 0
            } : b.offset();
            return c.top -= parseFloat(p.css(a, "marginTop")) || 0,
            c.left -= parseFloat(p.css(a, "marginLeft")) || 0,
            d.top += parseFloat(p.css(b[0], "borderTopWidth")) || 0,
            d.left += parseFloat(p.css(b[0], "borderLeftWidth")) || 0,
            {
                top: c.top - d.top,
                left: c.left - d.left
            }
        },
        offsetParent: function() {
            return this.map(function() {
                var a = this.offsetParent || e.body;
                while (a && !c$.test(a.nodeName) && p.css(a, "position") === "static")
                    a = a.offsetParent;
                return a || e.body
            })
        }
    }),
    p.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(a, c) {
        var d = /Y/.test(c);
        p.fn[a] = function(e) {
            return p.access(this, function(a, e, f) {
                var g = c_(a);
                if (f === b)
                    return g ? c in g ? g[c] : g.document.documentElement[e] : a[e];
                g ? g.scrollTo(d ? p(g).scrollLeft() : f, d ? f : p(g).scrollTop()) : a[e] = f
            }, a, e, arguments.length, null)
        }
    }),
    p.each({
        Height: "height",
        Width: "width"
    }, function(a, c) {
        p.each({
            padding: "inner" + a,
            content: c,
            "": "outer" + a
        }, function(d, e) {
            p.fn[e] = function(e, f) {
                var g = arguments.length && (d || typeof e != "boolean")
                  , h = d || (e === !0 || f === !0 ? "margin" : "border");
                return p.access(this, function(c, d, e) {
                    var f;
                    return p.isWindow(c) ? c.document.documentElement["client" + a] : c.nodeType === 9 ? (f = c.documentElement,
                    Math.max(c.body["scroll" + a], f["scroll" + a], c.body["offset" + a], f["offset" + a], f["client" + a])) : e === b ? p.css(c, d, e, h) : p.style(c, d, e, h)
                }, c, g ? e : b, g)
            }
        })
    }),
    a.jQuery = a.$ = p,
    typeof define == "function" && define.amd && define.amd.jQuery && define("jquery", [], function() {
        return p
    })
}
)(window);
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') {
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString();
        }
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}
;
!function(a, b) {
    "use strict";
    "function" == typeof define && define.amd ? define(b) : "object" == typeof module && module.exports ? module.exports = b() : a.log = b()
}(this, function() {
    "use strict";
    function a(a, b) {
        var c = a[b];
        if ("function" == typeof c.bind)
            return c.bind(a);
        try {
            return Function.prototype.bind.call(c, a)
        } catch (b) {
            return function() {
                return Function.prototype.apply.apply(c, [a, arguments])
            }
        }
    }
    function b(b) {
        return "debug" === b && (b = "log"),
        typeof console !== h && (void 0 !== console[b] ? a(console, b) : void 0 !== console.log ? a(console, "log") : g)
    }
    function c(a, b) {
        for (var c = 0; c < i.length; c++) {
            var d = i[c];
            this[d] = c < a ? g : this.methodFactory(d, a, b)
        }
        this.log = this.debug
    }
    function d(a, b, d) {
        return function() {
            typeof console !== h && (c.call(this, b, d),
            this[a].apply(this, arguments))
        }
    }
    function e(a, c, e) {
        return b(a) || d.apply(this, arguments)
    }
    function f(a, b, d) {
        function f(a) {
            var b = (i[a] || "silent").toUpperCase();
            if (typeof window !== h) {
                try {
                    return void (window.localStorage[l] = b)
                } catch (a) {}
                try {
                    window.document.cookie = encodeURIComponent(l) + "=" + b + ";"
                } catch (a) {}
            }
        }
        function g() {
            var a;
            if (typeof window !== h) {
                try {
                    a = window.localStorage[l]
                } catch (a) {}
                if (typeof a === h)
                    try {
                        var b = window.document.cookie
                          , c = b.indexOf(encodeURIComponent(l) + "=");
                        -1 !== c && (a = /^([^;]+)/.exec(b.slice(c))[1])
                    } catch (a) {}
                return void 0 === k.levels[a] && (a = void 0),
                a
            }
        }
        var j, k = this, l = "loglevel";
        a && (l += ":" + a),
        k.name = a,
        k.levels = {
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            SILENT: 5
        },
        k.methodFactory = d || e,
        k.getLevel = function() {
            return j
        }
        ,
        k.setLevel = function(b, d) {
            if ("string" == typeof b && void 0 !== k.levels[b.toUpperCase()] && (b = k.levels[b.toUpperCase()]),
            !("number" == typeof b && b >= 0 && b <= k.levels.SILENT))
                throw "log.setLevel() called with invalid level: " + b;
            if (j = b,
            !1 !== d && f(b),
            c.call(k, b, a),
            typeof console === h && b < k.levels.SILENT)
                return "No console available for logging"
        }
        ,
        k.setDefaultLevel = function(a) {
            g() || k.setLevel(a, !1)
        }
        ,
        k.enableAll = function(a) {
            k.setLevel(k.levels.TRACE, a)
        }
        ,
        k.disableAll = function(a) {
            k.setLevel(k.levels.SILENT, a)
        }
        ;
        var m = g();
        null == m && (m = null == b ? "WARN" : b),
        k.setLevel(m, !1)
    }
    var g = function() {}
      , h = "undefined"
      , i = ["trace", "debug", "info", "warn", "error"]
      , j = new f
      , k = {};
    j.getLogger = function(a) {
        if ("string" != typeof a || "" === a)
            throw new TypeError("You must supply a name when creating a logger.");
        var b = k[a];
        return b || (b = k[a] = new f(a,j.getLevel(),j.methodFactory)),
        b
    }
    ;
    var l = typeof window !== h ? window.log : void 0;
    return j.noConflict = function() {
        return typeof window !== h && window.log === j && (window.log = l),
        j
    }
    ,
    j.getLoggers = function() {
        return k
    }
    ,
    j
});
;;(function($) {
    $.cluetip = {
        version: '1.0.3'
    };
    var $cluetip, $cluetipInner, $cluetipOuter, $cluetipTitle, $cluetipArrows, $cluetipWait, $dropShadow, imgCount;
    $.fn.cluetip = function(js, options) {
        if (typeof js == 'object') {
            options = js;
            js = null;
        }
        if (js == 'destroy') {
            return this.unbind('.cluetip');
        }
        return this.each(function(index) {
            var link = this
              , $this = $(this);
            var opts = $.extend(true, {}, $.fn.cluetip.defaults, options || {}, $.metadata ? $this.metadata() : $.meta ? $this.data() : {});
            var cluetipContents = false;
            var cluezIndex = +opts.cluezIndex;
            $this.data('thisInfo', {
                title: link.title,
                zIndex: cluezIndex
            });
            var isActive = false
              , closeOnDelay = 0;
            if (!$('#cluetip').length) {
                $(['<div id="cluetip">', '<div id="cluetip-outer">', '<h3 id="cluetip-title"></h3>', '<div id="cluetip-inner"></div>', '</div>', '<div id="cluetip-extra"></div>', '<div id="cluetip-arrows" class="cluetip-arrows"></div>', '</div>'].join(''))[insertionType](insertionElement).hide();
                $cluetip = $('#cluetip').css({
                    position: 'absolute'
                });
                $cluetipOuter = $('#cluetip-outer').css({
                    position: 'relative',
                    zIndex: cluezIndex
                });
                $cluetipInner = $('#cluetip-inner');
                $cluetipTitle = $('#cluetip-title');
                $cluetipArrows = $('#cluetip-arrows');
                $cluetipWait = $('<div id="cluetip-waitimage"></div>').css({
                    position: 'absolute'
                }).insertBefore($cluetip).hide();
            }
            var dropShadowSteps = (opts.dropShadow) ? +opts.dropShadowSteps : 0;
            if (!$dropShadow) {
                $dropShadow = $([]);
                for (var i = 0; i < dropShadowSteps; i++) {
                    $dropShadow = $dropShadow.add($('<div></div>').css({
                        zIndex: cluezIndex - 1,
                        opacity: .1,
                        top: 1 + i,
                        left: 1 + i
                    }));
                }
                ;$dropShadow.css({
                    position: 'absolute',
                    backgroundColor: '#000'
                }).prependTo($cluetip);
            }
            var tipAttribute = $this.attr(opts.attribute)
              , ctClass = opts.cluetipClass;
            if (!tipAttribute && !opts.splitTitle && !js)
                return true;
            if (opts.local && opts.localPrefix) {
                tipAttribute = opts.localPrefix + tipAttribute;
            }
            if (opts.local && opts.hideLocal) {
                $(tipAttribute + ':first').hide();
            }
            var tOffset = parseInt(opts.topOffset, 10)
              , lOffset = parseInt(opts.leftOffset, 10);
            var tipHeight, wHeight, defHeight = isNaN(parseInt(opts.height, 10)) ? 'auto' : (/\D/g).test(opts.height) ? opts.height : opts.height + 'px';
            var sTop, linkTop, posY, tipY, mouseY, baseline;
            var tipInnerWidth = parseInt(opts.width, 10) || 275, tipWidth = tipInnerWidth + (parseInt($cluetip.css('paddingLeft'), 10) || 0) + (parseInt($cluetip.css('paddingRight'), 10) || 0) + dropShadowSteps, linkWidth = this.offsetWidth, linkLeft, posX, tipX, mouseX, winWidth;
            var tipParts;
            var tipTitle = (opts.attribute != 'title') ? $this.attr(opts.titleAttribute) : '';
            if (opts.splitTitle) {
                if (tipTitle == undefined) {
                    tipTitle = '';
                }
                tipParts = tipTitle.split(opts.splitTitle);
                tipTitle = tipParts.shift();
            }
            if (opts.escapeTitle) {
                tipTitle = tipTitle.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
            }
            var localContent;
            var activate = function(event) {
                if (!opts.onActivate($this)) {
                    return false;
                }
                isActive = true;
                $cluetip.removeClass().css({
                    width: tipInnerWidth
                });
                if (tipAttribute == $this.attr('href')) {
                    $this.css('cursor', opts.cursor);
                }
                if (opts.hoverClass) {
                    $this.addClass(opts.hoverClass);
                }
                linkTop = posY = $this.offset().top;
                linkLeft = $this.offset().left;
                mouseX = event.pageX;
                mouseY = event.pageY;
                if (link.tagName.toLowerCase() != 'area') {
                    sTop = $(document).scrollTop();
                    winWidth = $(window).width();
                }
                if (opts.positionBy == 'fixed') {
                    if (linkWidth == 0) {
                        linkWidth = 20;
                    }
                    posX = linkWidth + linkLeft + lOffset;
                    $cluetip.css({
                        left: posX
                    });
                } else {
                    posX = (linkWidth > linkLeft && linkLeft > tipWidth) || linkLeft + linkWidth + tipWidth + lOffset > winWidth ? linkLeft - tipWidth - lOffset : linkWidth + linkLeft + lOffset;
                    if (link.tagName.toLowerCase() == 'area' || opts.positionBy == 'mouse' || linkWidth + tipWidth > winWidth) {
                        if (mouseX + 20 + tipWidth > winWidth) {
                            $cluetip.addClass(' cluetip-' + ctClass);
                            posX = (mouseX - tipWidth - lOffset) >= 0 ? mouseX - tipWidth - lOffset - parseInt($cluetip.css('marginLeft'), 10) + parseInt($cluetipInner.css('marginRight'), 10) : mouseX - (tipWidth / 2);
                        } else {
                            posX = mouseX + lOffset;
                        }
                    }
                    var pY = posX < 0 ? event.pageY + tOffset : event.pageY;
                    $cluetip.css({
                        left: (posX > 0 && opts.positionBy != 'bottomTop') ? posX : (mouseX + (tipWidth / 2) > winWidth) ? winWidth / 2 - tipWidth / 2 : Math.max(mouseX - (tipWidth / 2), 0),
                        zIndex: $this.data('thisInfo').zIndex
                    });
                    $cluetipArrows.css({
                        zIndex: $this.data('thisInfo').zIndex + 1
                    });
                }
                wHeight = $(window).height();
                if (js) {
                    if (typeof js == 'function') {
                        js = js(link);
                    }
                    $cluetipInner.html(js);
                    cluetipShow(pY);
                } else if (tipParts) {
                    var tpl = tipParts.length;
                    $cluetipInner.html(tipParts[0]);
                    if (tpl > 1) {
                        for (var i = 1; i < tpl; i++) {
                            $cluetipInner.append('<div class="split-body">' + tipParts[i] + '</div>');
                        }
                    }
                    cluetipShow(pY);
                } else if (!opts.local && tipAttribute.indexOf('#') != 0) {
                    if (/\.(jpe?g|tiff?|gif|png)$/i.test(tipAttribute)) {
                        $cluetipInner.html('<img src="' + tipAttribute + '" alt="' + tipTitle + '" />');
                        cluetipShow(pY);
                    } else if (cluetipContents && opts.ajaxCache) {
                        $cluetipInner.html(cluetipContents);
                        cluetipShow(pY);
                    } else {
                        var optionBeforeSend = opts.ajaxSettings.beforeSend
                          , optionError = opts.ajaxSettings.error
                          , optionSuccess = opts.ajaxSettings.success
                          , optionComplete = opts.ajaxSettings.complete;
                        var ajaxSettings = {
                            cache: false,
                            url: tipAttribute,
                            beforeSend: function(xhr) {
                                if (optionBeforeSend) {
                                    optionBeforeSend.call(link, xhr, $cluetip, $cluetipInner);
                                }
                                $cluetipOuter.children().empty();
                                if (opts.waitImage) {
                                    $cluetipWait.css({
                                        top: mouseY + 20,
                                        left: mouseX + 20,
                                        zIndex: $this.data('thisInfo').zIndex - 1
                                    }).show();
                                }
                            },
                            error: function(xhr, textStatus) {
                                if (isActive) {
                                    if (optionError) {
                                        optionError.call(link, xhr, textStatus, $cluetip, $cluetipInner);
                                    } else {
                                        $cluetipInner.html('<i>sorry, the contents could not be loaded</i>');
                                    }
                                }
                            },
                            success: function(data, textStatus) {
                                cluetipContents = opts.ajaxProcess.call(link, data);
                                if (isActive) {
                                    if (optionSuccess) {
                                        optionSuccess.call(link, data, textStatus, $cluetip, $cluetipInner);
                                    }
                                    $cluetipInner.html(cluetipContents);
                                }
                            },
                            complete: function(xhr, textStatus) {
                                if (optionComplete) {
                                    optionComplete.call(link, xhr, textStatus, $cluetip, $cluetipInner);
                                }
                                imgCount = $('#cluetip-inner img').length;
                                if (imgCount && !$.browser.opera) {
                                    $('#cluetip-inner img').bind('load error', function() {
                                        imgCount--;
                                        if (imgCount < 1) {
                                            $cluetipWait.hide();
                                            if (isActive)
                                                cluetipShow(pY);
                                        }
                                    });
                                } else {
                                    $cluetipWait.hide();
                                    if (isActive) {
                                        cluetipShow(pY);
                                    }
                                }
                            }
                        };
                        var ajaxMergedSettings = $.extend(true, {}, opts.ajaxSettings, ajaxSettings);
                        $.ajax(ajaxMergedSettings);
                    }
                } else if (opts.local) {
                    var $localContent = $(tipAttribute + (/#\S+$/.test(tipAttribute) ? '' : ':eq(' + index + ')')).clone(true).show();
                    $cluetipInner.html($localContent);
                    cluetipShow(pY);
                }
            };
            var cluetipShow = function(bpY) {
                $cluetip.addClass('cluetip-' + ctClass);
                if (opts.truncate) {
                    var $truncloaded = $cluetipInner.text().slice(0, opts.truncate) + '...';
                    $cluetipInner.html($truncloaded);
                }
                function doNothing() {}
                ;tipTitle ? $cluetipTitle.show().html(tipTitle) : (opts.showTitle) ? $cluetipTitle.show().html('&nbsp;') : $cluetipTitle.hide();
                if (opts.sticky) {
                    var $closeLink = $('<div id="cluetip-close"><a href="#">' + opts.closeText + '</a></div>');
                    (opts.closePosition == 'bottom') ? $closeLink.appendTo($cluetipInner) : (opts.closePosition == 'title') ? $closeLink.prependTo($cluetipTitle) : $closeLink.prependTo($cluetipInner);
                    $closeLink.bind('click.cluetip', function() {
                        cluetipClose();
                        return false;
                    });
                    if (opts.mouseOutClose) {
                        if ($.fn.hoverIntent && opts.hoverIntent) {
                            $cluetip.hoverIntent({
                                over: doNothing,
                                timeout: opts.hoverIntent.timeout,
                                out: function() {
                                    $closeLink.trigger('click.cluetip');
                                }
                            });
                        } else {
                            $cluetip.hover(doNothing, function() {
                                $closeLink.trigger('click.cluetip');
                            });
                        }
                    } else {
                        $cluetip.unbind('mouseout');
                    }
                }
                var direction = '';
                $cluetipOuter.css({
                    zIndex: $this.data('thisInfo').zIndex,
                    overflow: defHeight == 'auto' ? 'visible' : 'auto',
                    height: defHeight
                });
                tipHeight = defHeight == 'auto' ? Math.max($cluetip.outerHeight(), $cluetip.height()) : parseInt(defHeight, 10);
                tipY = posY;
                baseline = sTop + wHeight;
                if (opts.positionBy == 'fixed') {
                    tipY = posY - opts.dropShadowSteps + tOffset;
                } else if ((posX < mouseX && Math.max(posX, 0) + tipWidth > mouseX) || opts.positionBy == 'bottomTop') {
                    if (posY + tipHeight + tOffset > baseline && mouseY - sTop > tipHeight + tOffset) {
                        tipY = mouseY - tipHeight - tOffset;
                        direction = 'top';
                    } else {
                        tipY = mouseY + tOffset;
                        direction = 'bottom';
                    }
                } else if (posY + tipHeight + tOffset > baseline) {
                    tipY = (tipHeight >= wHeight) ? sTop : baseline - tipHeight - tOffset;
                } else if ($this.css('display') == 'block' || link.tagName.toLowerCase() == 'area' || opts.positionBy == "mouse") {
                    tipY = bpY - tOffset;
                } else {
                    tipY = posY - opts.dropShadowSteps;
                }
                if (direction == '') {
                    posX < linkLeft ? direction = 'left' : direction = 'right';
                }
                $cluetip.css({
                    top: tipY + 'px'
                }).removeClass().addClass('clue-' + direction + '-' + ctClass).addClass(' cluetip-' + ctClass);
                if (opts.arrows) {
                    var bgY = (posY - tipY - opts.dropShadowSteps);
                    $cluetipArrows.css({
                        top: (/(left|right)/.test(direction) && posX >= 0 && bgY > 0) ? bgY + 'px' : /(left|right)/.test(direction) ? 0 : ''
                    }).show();
                } else {
                    $cluetipArrows.hide();
                }
                $dropShadow.hide();
                $cluetip.hide()[opts.fx.open](opts.fx.open != 'show' && opts.fx.openSpeed);
                if (opts.dropShadow) {
                    $dropShadow.css({
                        height: tipHeight,
                        width: tipInnerWidth,
                        zIndex: $this.data('thisInfo').zIndex - 1
                    }).show();
                }
                if ($.fn.bgiframe) {
                    $cluetip.bgiframe();
                }
                if (opts.delayedClose > 0) {
                    closeOnDelay = setTimeout(cluetipClose, opts.delayedClose);
                }
                opts.onShow.call(link, $cluetip, $cluetipInner);
            };
            var inactivate = function(event) {
                isActive = false;
                $cluetipWait.hide();
                if (!opts.sticky || (/click|toggle/).test(opts.activation)) {
                    cluetipClose();
                    clearTimeout(closeOnDelay);
                }
                ;if (opts.hoverClass) {
                    $this.removeClass(opts.hoverClass);
                }
            };
            var cluetipClose = function() {
                $cluetipOuter.parent().hide().removeClass();
                opts.onHide.call(link, $cluetip, $cluetipInner);
                $this.removeClass('cluetip-clicked');
                if (tipTitle) {
                    $this.attr(opts.titleAttribute, tipTitle);
                }
                $this.css('cursor', '');
                if (opts.arrows)
                    $cluetipArrows.css({
                        top: ''
                    });
            };
            $(document).bind('hideCluetip', function(e) {
                cluetipClose();
            });
            if ((/click|toggle/).test(opts.activation)) {
                $this.bind('click.cluetip', function(event) {
                    if ($cluetip.is(':hidden') || !$this.is('.cluetip-clicked')) {
                        activate(event);
                        $('.cluetip-clicked').removeClass('cluetip-clicked');
                        $this.addClass('cluetip-clicked');
                    } else {
                        inactivate(event);
                    }
                    this.blur();
                    return false;
                });
            } else if (opts.activation == 'focus') {
                $this.bind('focus.cluetip', function(event) {
                    activate(event);
                });
                $this.bind('blur.cluetip', function(event) {
                    inactivate(event);
                });
            } else {
                $this.bind('click.cluetip', function() {
                    if ($this.attr('href') && $this.attr('href') == tipAttribute && !opts.clickThrough) {
                        return false;
                    }
                });
                var mouseTracks = function(evt) {
                    if (opts.tracking == true) {
                        var trackX = posX - evt.pageX;
                        var trackY = tipY ? tipY - evt.pageY : posY - evt.pageY;
                        $this.bind('mousemove.cluetip', function(evt) {
                            $cluetip.css({
                                left: evt.pageX + trackX,
                                top: evt.pageY + trackY
                            });
                        });
                    }
                };
                if ($.fn.hoverIntent && opts.hoverIntent) {
                    $this.hoverIntent({
                        sensitivity: opts.hoverIntent.sensitivity,
                        interval: opts.hoverIntent.interval,
                        over: function(event) {
                            activate(event);
                            mouseTracks(event);
                        },
                        timeout: opts.hoverIntent.timeout,
                        out: function(event) {
                            inactivate(event);
                            $this.unbind('mousemove.cluetip');
                        }
                    });
                } else {
                    $this.bind('mouseenter.cluetip', function(event) {
                        activate(event);
                        mouseTracks(event);
                    }).bind('mouseleave.cluetip', function(event) {
                        inactivate(event);
                        $this.unbind('mousemove.cluetip');
                    });
                }
                $this.bind('mouseenter.cluetip', function(event) {
                    $this.attr('title', '');
                }).bind('mouseleave.cluetip', function(event) {
                    $this.attr('title', $this.data('thisInfo').title);
                });
            }
        });
    }
    ;
    $.fn.cluetip.defaults = {
        width: 275,
        height: 'auto',
        cluezIndex: 97,
        positionBy: 'auto',
        topOffset: 15,
        leftOffset: 15,
        local: false,
        localPrefix: null,
        hideLocal: true,
        attribute: 'rel',
        titleAttribute: 'title',
        splitTitle: '',
        escapeTitle: false,
        showTitle: true,
        cluetipClass: 'default',
        hoverClass: '',
        waitImage: true,
        cursor: 'help',
        arrows: false,
        dropShadow: true,
        dropShadowSteps: 6,
        sticky: false,
        mouseOutClose: false,
        activation: 'hover',
        clickThrough: false,
        tracking: false,
        delayedClose: 0,
        closePosition: 'top',
        closeText: 'Close',
        truncate: 0,
        fx: {
            open: 'show',
            openSpeed: ''
        },
        hoverIntent: {
            sensitivity: 3,
            interval: 50,
            timeout: 0
        },
        onActivate: function(e) {
            return true;
        },
        onShow: function(ct, ci) {},
        onHide: function(ct, ci) {},
        ajaxCache: true,
        ajaxProcess: function(data) {
            data = data.replace(/<(script|style|title)[^<]+<\/(script|style|title)>/gm, '').replace(/<(link|meta)[^>]+>/g, '');
            return data;
        },
        ajaxSettings: {
            dataType: 'html'
        },
        debug: false
    };
    var insertionType = 'appendTo'
      , insertionElement = 'body';
    $.cluetip.setup = function(options) {
        if (options && options.insertionType && (options.insertionType).match(/appendTo|prependTo|insertBefore|insertAfter/)) {
            insertionType = options.insertionType;
        }
        if (options && options.insertionElement) {
            insertionElement = options.insertionElement;
        }
    }
    ;
}
)(jQuery);
;eval(function(p, a, c, k, e, r) {
    e = function(c) {
        return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
    }
    ;
    if (!''.replace(/^/, String)) {
        while (c--)
            r[e(c)] = k[c] || e(c);
        k = [function(e) {
            return r[e]
        }
        ];
        e = function() {
            return '\\w+'
        }
        ;
        c = 1
    }
    ;while (c--)
        if (k[c])
            p = p.replace(new RegExp('\\b' + e(c) + '\\b','g'), k[c]);
    return p
}('(7($){$.H($.2L,{17:7(d){l(!6.F){d&&d.2q&&2T.1z&&1z.52("3y 3p, 4L\'t 17, 64 3y");8}p c=$.19(6[0],\'v\');l(c){8 c}c=2w $.v(d,6[0]);$.19(6[0],\'v\',c);l(c.q.3x){6.3s("1w, 3i").1o(".4E").3e(7(){c.3b=w});l(c.q.35){6.3s("1w, 3i").1o(":2s").3e(7(){c.1Z=6})}6.2s(7(b){l(c.q.2q)b.5J();7 1T(){l(c.q.35){l(c.1Z){p a=$("<1w 1V=\'5r\'/>").1s("u",c.1Z.u).33(c.1Z.Z).51(c.U)}c.q.35.V(c,c.U);l(c.1Z){a.3D()}8 N}8 w}l(c.3b){c.3b=N;8 1T()}l(c.L()){l(c.1b){c.1l=w;8 N}8 1T()}12{c.2l();8 N}})}8 c},J:7(){l($(6[0]).2W(\'L\')){8 6.17().L()}12{p b=w;p a=$(6[0].L).17();6.P(7(){b&=a.I(6)});8 b}},4D:7(c){p d={},$I=6;$.P(c.1I(/\\s/),7(a,b){d[b]=$I.1s(b);$I.6d(b)});8 d},1i:7(h,k){p f=6[0];l(h){p i=$.19(f.L,\'v\').q;p d=i.1i;p c=$.v.36(f);23(h){1e"1d":$.H(c,$.v.1X(k));d[f.u]=c;l(k.G)i.G[f.u]=$.H(i.G[f.u],k.G);31;1e"3D":l(!k){T d[f.u];8 c}p e={};$.P(k.1I(/\\s/),7(a,b){e[b]=c[b];T c[b]});8 e}}p g=$.v.41($.H({},$.v.3Y(f),$.v.3V(f),$.v.3T(f),$.v.36(f)),f);l(g.15){p j=g.15;T g.15;g=$.H({15:j},g)}8 g}});$.H($.5p[":"],{5n:7(a){8!$.1p(""+a.Z)},5g:7(a){8!!$.1p(""+a.Z)},5f:7(a){8!a.4h}});$.v=7(b,a){6.q=$.H(w,{},$.v.3d,b);6.U=a;6.3I()};$.v.W=7(c,b){l(R.F==1)8 7(){p a=$.3F(R);a.4V(c);8 $.v.W.1Q(6,a)};l(R.F>2&&b.2c!=3B){b=$.3F(R).4Q(1)}l(b.2c!=3B){b=[b]}$.P(b,7(i,n){c=c.1u(2w 3t("\\\\{"+i+"\\\\}","g"),n)});8 c};$.H($.v,{3d:{G:{},2a:{},1i:{},1c:"3r",28:"J",2F:"4P",2l:w,3o:$([]),2D:$([]),3x:w,3l:[],3k:N,4O:7(a){6.3U=a;l(6.q.4K&&!6.4J){6.q.1K&&6.q.1K.V(6,a,6.q.1c,6.q.28);6.1M(a).2A()}},4C:7(a){l(!6.1E(a)&&(a.u 11 6.1a||!6.K(a))){6.I(a)}},6c:7(a){l(a.u 11 6.1a||a==6.4A){6.I(a)}},68:7(a){l(a.u 11 6.1a)6.I(a);12 l(a.4x.u 11 6.1a)6.I(a.4x)},39:7(a,c,b){$(a).22(c).2v(b)},1K:7(a,c,b){$(a).2v(c).22(b)}},63:7(a){$.H($.v.3d,a)},G:{15:"61 4r 2W 15.",1q:"M 2O 6 4r.",1J:"M O a J 1J 5X.",1B:"M O a J 5W.",1A:"M O a J 1A.",2j:"M O a J 1A (5Q).",1G:"M O a J 1G.",1P:"M O 5O 1P.",2f:"M O a J 5L 5I 1G.",2o:"M O 47 5F Z 5B.",43:"M O a Z 5z a J 5x.",18:$.v.W("M O 3K 5v 2X {0} 2V."),1y:$.v.W("M O 5t 5s {0} 2V."),2i:$.v.W("M O a Z 3W {0} 3O {1} 2V 5o."),2r:$.v.W("M O a Z 3W {0} 3O {1}."),1C:$.v.W("M O a Z 5j 2X 46 3M 3L {0}."),1t:$.v.W("M O a Z 5d 2X 46 3M 3L {0}.")},3J:N,5a:{3I:7(){6.24=$(6.q.2D);6.4t=6.24.F&&6.24||$(6.U);6.2x=$(6.q.3o).1d(6.q.2D);6.1a={};6.54={};6.1b=0;6.1h={};6.1f={};6.21();p f=(6.2a={});$.P(6.q.2a,7(d,c){$.P(c.1I(/\\s/),7(a,b){f[b]=d})});p e=6.q.1i;$.P(e,7(b,a){e[b]=$.v.1X(a)});7 2N(a){p b=$.19(6[0].L,"v"),3c="4W"+a.1V.1u(/^17/,"");b.q[3c]&&b.q[3c].V(b,6[0])}$(6.U).2K(":3E, :4U, :4T, 2e, 4S","2d 2J 4R",2N).2K(":3C, :3A, 2e, 3z","3e",2N);l(6.q.3w)$(6.U).2I("1f-L.17",6.q.3w)},L:7(){6.3v();$.H(6.1a,6.1v);6.1f=$.H({},6.1v);l(!6.J())$(6.U).3u("1f-L",[6]);6.1m();8 6.J()},3v:7(){6.2H();Q(p i=0,14=(6.2b=6.14());14[i];i++){6.29(14[i])}8 6.J()},I:7(a){a=6.2G(a);6.4A=a;6.2P(a);6.2b=$(a);p b=6.29(a);l(b){T 6.1f[a.u]}12{6.1f[a.u]=w}l(!6.3q()){6.13=6.13.1d(6.2x)}6.1m();8 b},1m:7(b){l(b){$.H(6.1v,b);6.S=[];Q(p c 11 b){6.S.27({1j:b[c],I:6.26(c)[0]})}6.1n=$.3n(6.1n,7(a){8!(a.u 11 b)})}6.q.1m?6.q.1m.V(6,6.1v,6.S):6.3m()},2S:7(){l($.2L.2S)$(6.U).2S();6.1a={};6.2H();6.2Q();6.14().2v(6.q.1c)},3q:7(){8 6.2k(6.1f)},2k:7(a){p b=0;Q(p i 11 a)b++;8 b},2Q:7(){6.2C(6.13).2A()},J:7(){8 6.3j()==0},3j:7(){8 6.S.F},2l:7(){l(6.q.2l){3Q{$(6.3h()||6.S.F&&6.S[0].I||[]).1o(":4N").3g().4M("2d")}3f(e){}}},3h:7(){p a=6.3U;8 a&&$.3n(6.S,7(n){8 n.I.u==a.u}).F==1&&a},14:7(){p a=6,2B={};8 $([]).1d(6.U.14).1o(":1w").1L(":2s, :21, :4I, [4H]").1L(6.q.3l).1o(7(){!6.u&&a.q.2q&&2T.1z&&1z.3r("%o 4G 3K u 4F",6);l(6.u 11 2B||!a.2k($(6).1i()))8 N;2B[6.u]=w;8 w})},2G:7(a){8 $(a)[0]},2z:7(){8 $(6.q.2F+"."+6.q.1c,6.4t)},21:7(){6.1n=[];6.S=[];6.1v={};6.1k=$([]);6.13=$([]);6.2b=$([])},2H:7(){6.21();6.13=6.2z().1d(6.2x)},2P:7(a){6.21();6.13=6.1M(a)},29:7(d){d=6.2G(d);l(6.1E(d)){d=6.26(d.u)[0]}p a=$(d).1i();p c=N;Q(Y 11 a){p b={Y:Y,2n:a[Y]};3Q{p f=$.v.1N[Y].V(6,d.Z.1u(/\\r/g,""),d,b.2n);l(f=="1S-1Y"){c=w;6g}c=N;l(f=="1h"){6.13=6.13.1L(6.1M(d));8}l(!f){6.4B(d,b);8 N}}3f(e){6.q.2q&&2T.1z&&1z.6f("6e 6b 6a 69 I "+d.4z+", 29 47 \'"+b.Y+"\' Y",e);67 e;}}l(c)8;l(6.2k(a))6.1n.27(d);8 w},4y:7(a,b){l(!$.1H)8;p c=6.q.3a?$(a).1H()[6.q.3a]:$(a).1H();8 c&&c.G&&c.G[b]},4w:7(a,b){p m=6.q.G[a];8 m&&(m.2c==4v?m:m[b])},4u:7(){Q(p i=0;i<R.F;i++){l(R[i]!==20)8 R[i]}8 20},2u:7(a,b){8 6.4u(6.4w(a.u,b),6.4y(a,b),!6.q.3k&&a.62||20,$.v.G[b],"<4s>60: 5Z 1j 5Y Q "+a.u+"</4s>")},4B:7(b,a){p c=6.2u(b,a.Y),37=/\\$?\\{(\\d+)\\}/g;l(1g c=="7"){c=c.V(6,a.2n,b)}12 l(37.16(c)){c=1F.W(c.1u(37,\'{$1}\'),a.2n)}6.S.27({1j:c,I:b});6.1v[b.u]=c;6.1a[b.u]=c},2C:7(a){l(6.q.2t)a=a.1d(a.4q(6.q.2t));8 a},3m:7(){Q(p i=0;6.S[i];i++){p a=6.S[i];6.q.39&&6.q.39.V(6,a.I,6.q.1c,6.q.28);6.2E(a.I,a.1j)}l(6.S.F){6.1k=6.1k.1d(6.2x)}l(6.q.1x){Q(p i=0;6.1n[i];i++){6.2E(6.1n[i])}}l(6.q.1K){Q(p i=0,14=6.4p();14[i];i++){6.q.1K.V(6,14[i],6.q.1c,6.q.28)}}6.13=6.13.1L(6.1k);6.2Q();6.2C(6.1k).4o()},4p:7(){8 6.2b.1L(6.4n())},4n:7(){8 $(6.S).4m(7(){8 6.I})},2E:7(a,c){p b=6.1M(a);l(b.F){b.2v().22(6.q.1c);b.1s("4l")&&b.4k(c)}12{b=$("<"+6.q.2F+"/>").1s({"Q":6.34(a),4l:w}).22(6.q.1c).4k(c||"");l(6.q.2t){b=b.2A().4o().5V("<"+6.q.2t+"/>").4q()}l(!6.24.5S(b).F)6.q.4j?6.q.4j(b,$(a)):b.5R(a)}l(!c&&6.q.1x){b.3E("");1g 6.q.1x=="1D"?b.22(6.q.1x):6.q.1x(b)}6.1k=6.1k.1d(b)},1M:7(a){p b=6.34(a);8 6.2z().1o(7(){8 $(6).1s(\'Q\')==b})},34:7(a){8 6.2a[a.u]||(6.1E(a)?a.u:a.4z||a.u)},1E:7(a){8/3C|3A/i.16(a.1V)},26:7(d){p c=6.U;8 $(4i.5P(d)).4m(7(a,b){8 b.L==c&&b.u==d&&b||4g})},1O:7(a,b){23(b.4f.4e()){1e\'2e\':8 $("3z:3p",b).F;1e\'1w\':l(6.1E(b))8 6.26(b.u).1o(\':4h\').F}8 a.F},4d:7(b,a){8 6.32[1g b]?6.32[1g b](b,a):w},32:{"5N":7(b,a){8 b},"1D":7(b,a){8!!$(b,a.L).F},"7":7(b,a){8 b(a)}},K:7(a){8!$.v.1N.15.V(6,$.1p(a.Z),a)&&"1S-1Y"},4c:7(a){l(!6.1h[a.u]){6.1b++;6.1h[a.u]=w}},4b:7(a,b){6.1b--;l(6.1b<0)6.1b=0;T 6.1h[a.u];l(b&&6.1b==0&&6.1l&&6.L()){$(6.U).2s();6.1l=N}12 l(!b&&6.1b==0&&6.1l){$(6.U).3u("1f-L",[6]);6.1l=N}},2h:7(a){8 $.19(a,"2h")||$.19(a,"2h",{2M:4g,J:w,1j:6.2u(a,"1q")})}},1R:{15:{15:w},1J:{1J:w},1B:{1B:w},1A:{1A:w},2j:{2j:w},4a:{4a:w},1G:{1G:w},49:{49:w},1P:{1P:w},2f:{2f:w}},48:7(a,b){a.2c==4v?6.1R[a]=b:$.H(6.1R,a)},3V:7(b){p a={};p c=$(b).1s(\'5H\');c&&$.P(c.1I(\' \'),7(){l(6 11 $.v.1R){$.H(a,$.v.1R[6])}});8 a},3T:7(c){p a={};p d=$(c);Q(Y 11 $.v.1N){p b=d.1s(Y);l(b){a[Y]=b}}l(a.18&&/-1|5G|5C/.16(a.18)){T a.18}8 a},3Y:7(a){l(!$.1H)8{};p b=$.19(a.L,\'v\').q.3a;8 b?$(a).1H()[b]:$(a).1H()},36:7(b){p a={};p c=$.19(b.L,\'v\');l(c.q.1i){a=$.v.1X(c.q.1i[b.u])||{}}8 a},41:7(d,e){$.P(d,7(c,b){l(b===N){T d[c];8}l(b.2R||b.2p){p a=w;23(1g b.2p){1e"1D":a=!!$(b.2p,e.L).F;31;1e"7":a=b.2p.V(e,e);31}l(a){d[c]=b.2R!==20?b.2R:w}12{T d[c]}}});$.P(d,7(a,b){d[a]=$.44(b)?b(e):b});$.P([\'1y\',\'18\',\'1t\',\'1C\'],7(){l(d[6]){d[6]=2Z(d[6])}});$.P([\'2i\',\'2r\'],7(){l(d[6]){d[6]=[2Z(d[6][0]),2Z(d[6][1])]}});l($.v.3J){l(d.1t&&d.1C){d.2r=[d.1t,d.1C];T d.1t;T d.1C}l(d.1y&&d.18){d.2i=[d.1y,d.18];T d.1y;T d.18}}l(d.G){T d.G}8 d},1X:7(a){l(1g a=="1D"){p b={};$.P(a.1I(/\\s/),7(){b[6]=w});a=b}8 a},5A:7(c,a,b){$.v.1N[c]=a;$.v.G[c]=b!=20?b:$.v.G[c];l(a.F<3){$.v.48(c,$.v.1X(c))}},1N:{15:7(c,d,a){l(!6.4d(a,d))8"1S-1Y";23(d.4f.4e()){1e\'2e\':p b=$(d).33();8 b&&b.F>0;1e\'1w\':l(6.1E(d))8 6.1O(c,d)>0;5y:8 $.1p(c).F>0}},1q:7(f,h,j){l(6.K(h))8"1S-1Y";p g=6.2h(h);l(!6.q.G[h.u])6.q.G[h.u]={};g.40=6.q.G[h.u].1q;6.q.G[h.u].1q=g.1j;j=1g j=="1D"&&{1B:j}||j;l(g.2M!==f){g.2M=f;p k=6;6.4c(h);p i={};i[h.u]=f;$.2U($.H(w,{1B:j,3Z:"2Y",3X:"17"+h.u,5w:"5u",19:i,1x:7(d){k.q.G[h.u].1q=g.40;p b=d===w;l(b){p e=k.1l;k.2P(h);k.1l=e;k.1n.27(h);k.1m()}12{p a={};p c=(g.1j=d||k.2u(h,"1q"));a[h.u]=$.44(c)?c(f):c;k.1m(a)}g.J=b;k.4b(h,b)}},j));8"1h"}12 l(6.1h[h.u]){8"1h"}8 g.J},1y:7(b,c,a){8 6.K(c)||6.1O($.1p(b),c)>=a},18:7(b,c,a){8 6.K(c)||6.1O($.1p(b),c)<=a},2i:7(b,d,a){p c=6.1O($.1p(b),d);8 6.K(d)||(c>=a[0]&&c<=a[1])},1t:7(b,c,a){8 6.K(c)||b>=a},1C:7(b,c,a){8 6.K(c)||b<=a},2r:7(b,c,a){8 6.K(c)||(b>=a[0]&&b<=a[1])},1J:7(a,b){8 6.K(b)||/^((([a-z]|\\d|[!#\\$%&\'\\*\\+\\-\\/=\\?\\^X`{\\|}~]|[\\E-\\B\\C-\\x\\A-\\y])+(\\.([a-z]|\\d|[!#\\$%&\'\\*\\+\\-\\/=\\?\\^X`{\\|}~]|[\\E-\\B\\C-\\x\\A-\\y])+)*)|((\\3S)((((\\2m|\\1W)*(\\30\\3R))?(\\2m|\\1W)+)?(([\\3P-\\5q\\45\\42\\5D-\\5E\\3N]|\\5m|[\\5l-\\5k]|[\\5i-\\5K]|[\\E-\\B\\C-\\x\\A-\\y])|(\\\\([\\3P-\\1W\\45\\42\\30-\\3N]|[\\E-\\B\\C-\\x\\A-\\y]))))*(((\\2m|\\1W)*(\\30\\3R))?(\\2m|\\1W)+)?(\\3S)))@((([a-z]|\\d|[\\E-\\B\\C-\\x\\A-\\y])|(([a-z]|\\d|[\\E-\\B\\C-\\x\\A-\\y])([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])*([a-z]|\\d|[\\E-\\B\\C-\\x\\A-\\y])))\\.)+(([a-z]|[\\E-\\B\\C-\\x\\A-\\y])|(([a-z]|[\\E-\\B\\C-\\x\\A-\\y])([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])*([a-z]|[\\E-\\B\\C-\\x\\A-\\y])))\\.?$/i.16(a)},1B:7(a,b){8 6.K(b)||/^(5h?|5M):\\/\\/(((([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])|(%[\\1U-f]{2})|[!\\$&\'\\(\\)\\*\\+,;=]|:)*@)?(((\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5]))|((([a-z]|\\d|[\\E-\\B\\C-\\x\\A-\\y])|(([a-z]|\\d|[\\E-\\B\\C-\\x\\A-\\y])([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])*([a-z]|\\d|[\\E-\\B\\C-\\x\\A-\\y])))\\.)+(([a-z]|[\\E-\\B\\C-\\x\\A-\\y])|(([a-z]|[\\E-\\B\\C-\\x\\A-\\y])([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])*([a-z]|[\\E-\\B\\C-\\x\\A-\\y])))\\.?)(:\\d*)?)(\\/((([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])|(%[\\1U-f]{2})|[!\\$&\'\\(\\)\\*\\+,;=]|:|@)+(\\/(([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])|(%[\\1U-f]{2})|[!\\$&\'\\(\\)\\*\\+,;=]|:|@)*)*)?)?(\\?((([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])|(%[\\1U-f]{2})|[!\\$&\'\\(\\)\\*\\+,;=]|:|@)|[\\5e-\\5T]|\\/|\\?)*)?(\\#((([a-z]|\\d|-|\\.|X|~|[\\E-\\B\\C-\\x\\A-\\y])|(%[\\1U-f]{2})|[!\\$&\'\\(\\)\\*\\+,;=]|:|@)|\\/|\\?)*)?$/i.16(a)},1A:7(a,b){8 6.K(b)||!/5U|5c/.16(2w 5b(a))},2j:7(a,b){8 6.K(b)||/^\\d{4}[\\/-]\\d{1,2}[\\/-]\\d{1,2}$/.16(a)},1G:7(a,b){8 6.K(b)||/^-?(?:\\d+|\\d{1,3}(?:,\\d{3})+)(?:\\.\\d+)?$/.16(a)},1P:7(a,b){8 6.K(b)||/^\\d+$/.16(a)},2f:7(b,e){l(6.K(e))8"1S-1Y";l(/[^0-9-]+/.16(b))8 N;p a=0,d=0,2g=N;b=b.1u(/\\D/g,"");Q(p n=b.F-1;n>=0;n--){p c=b.59(n);p d=58(c,10);l(2g){l((d*=2)>9)d-=9}a+=d;2g=!2g}8(a%10)==0},43:7(b,c,a){a=1g a=="1D"?a.1u(/,/g,\'|\'):"57|56?g|55";8 6.K(c)||b.65(2w 3t(".("+a+")$","i"))},2o:7(c,d,a){p b=$(a).66(".17-2o").2I("3H.17-2o",7(){$(d).J()});8 c==b.33()}}});$.W=$.v.W})(1F);(7($){p c=$.2U;p d={};$.2U=7(a){a=$.H(a,$.H({},$.53,a));p b=a.3X;l(a.3Z=="2Y"){l(d[b]){d[b].2Y()}8(d[b]=c.1Q(6,R))}8 c.1Q(6,R)}})(1F);(7($){l(!1F.1r.38.2d&&!1F.1r.38.2J&&4i.3G){$.P({3g:\'2d\',3H:\'2J\'},7(b,a){$.1r.38[a]={50:7(){6.3G(b,2y,w)},4Z:7(){6.4Y(b,2y,w)},2y:7(e){R[0]=$.1r.2O(e);R[0].1V=a;8 $.1r.1T.1Q(6,R)}};7 2y(e){e=$.1r.2O(e);e.1V=a;8 $.1r.1T.V(6,e)}})};$.H($.2L,{2K:7(d,e,c){8 6.2I(e,7(a){p b=$(a.4X);l(b.2W(d)){8 c.1Q(b,R)}})}})})(1F);', 62, 389, '||||||this|function|return|||||||||||||if||||var|settings||||name|validator|true|uFDCF|uFFEF||uFDF0|uD7FF|uF900||u00A0|length|messages|extend|element|valid|optional|form|Please|false|enter|each|for|arguments|errorList|delete|currentForm|call|format|_|method|value||in|else|toHide|elements|required|test|validate|maxlength|data|submitted|pendingRequest|errorClass|add|case|invalid|typeof|pending|rules|message|toShow|formSubmitted|showErrors|successList|filter|trim|remote|event|attr|min|replace|errorMap|input|success|minlength|console|date|url|max|string|checkable|jQuery|number|metadata|split|email|unhighlight|not|errorsFor|methods|getLength|digits|apply|classRuleSettings|dependency|handle|da|type|x09|normalizeRule|mismatch|submitButton|undefined|reset|addClass|switch|labelContainer||findByName|push|validClass|check|groups|currentElements|constructor|focusin|select|creditcard|bEven|previousValue|rangelength|dateISO|objectLength|focusInvalid|x20|parameters|equalTo|depends|debug|range|submit|wrapper|defaultMessage|removeClass|new|containers|handler|errors|hide|rulesCache|addWrapper|errorLabelContainer|showLabel|errorElement|clean|prepareForm|bind|focusout|validateDelegate|fn|old|delegate|fix|prepareElement|hideErrors|param|resetForm|window|ajax|characters|is|than|abort|Number|x0d|break|dependTypes|val|idOrName|submitHandler|staticRules|theregex|special|highlight|meta|cancelSubmit|eventType|defaults|click|catch|focus|findLastActive|button|size|ignoreTitle|ignore|defaultShowErrors|grep|errorContainer|selected|numberOfInvalids|error|find|RegExp|triggerHandler|checkForm|invalidHandler|onsubmit|nothing|option|checkbox|Array|radio|remove|text|makeArray|addEventListener|blur|init|autoCreateRanges|no|to|equal|x7f|and|x01|try|x0a|x22|attributeRules|lastActive|classRules|between|port|metadataRules|mode|originalMessage|normalizeRules|x0c|accept|isFunction|x0b|or|the|addClassRules|numberDE|dateDE|stopRequest|startRequest|depend|toLowerCase|nodeName|null|checked|document|errorPlacement|html|generated|map|invalidElements|show|validElements|parent|field|strong|errorContext|findDefined|String|customMessage|parentNode|customMetaMessage|id|lastElement|formatAndAdd|onfocusout|removeAttrs|cancel|assigned|has|disabled|image|blockFocusCleanup|focusCleanup|can|trigger|visible|onfocusin|label|slice|keyup|textarea|file|password|unshift|on|target|removeEventListener|teardown|setup|appendTo|warn|ajaxSettings|valueCache|gif|jpe|png|parseInt|charAt|prototype|Date|NaN|greater|uE000|unchecked|filled|https|x5d|less|x5b|x23|x21|blank|long|expr|x08|hidden|least|at|json|more|dataType|extension|default|with|addMethod|again|524288|x0e|x1f|same|2147483647|class|card|preventDefault|x7e|credit|ftp|boolean|only|getElementsByName|ISO|insertAfter|append|uF8FF|Invalid|wrap|URL|address|defined|No|Warning|This|title|setDefaults|returning|match|unbind|throw|onclick|checking|when|occured|onkeyup|removeAttr|exception|log|continue'.split('|'), 0, {}));
var tb_pathToImage = "/img/loadingAnimation.gif";
/*!!!!!!!!!!!!!!!! edit below this line at your own risk !!!!!!!!!!!!!!!!!!!!!!!*/
$(document).ready(function() {
    tb_init('a.thickbox, area.thickbox, input.thickbox');
    imgLoader = new Image();
    imgLoader.src = tb_pathToImage;
});
function tb_init(domChunk) {
    $(domChunk).click(function() {
        var t = this.title || this.name || null;
        var a = this.href || this.alt;
        var g = this.rel || false;
        tb_show(t, a, g);
        this.blur();
        return false;
    });
}
function tb_show(caption, url, imageGroup) {
    try {
        if (typeof document.body.style.maxHeight === "undefined") {
            $("body", "html").css({
                height: "100%",
                width: "100%"
            });
            $("html").css("overflow", "hidden");
            if (document.getElementById("TB_HideSelect") === null) {
                $("body").append("<iframe id='TB_HideSelect'></iframe><div id='TB_overlay'></div><div id='TB_window'></div>");
                $("#TB_overlay").click(tb_remove);
            }
        } else {
            if (document.getElementById("TB_overlay") === null) {
                $("body").append("<div id='TB_overlay'></div><div id='TB_window'></div>");
                $("#TB_overlay").click(tb_remove);
            }
        }
        if (tb_detectMacXFF()) {
            $("#TB_overlay").addClass("TB_overlayMacFFBGHack");
        } else {
            $("#TB_overlay").addClass("TB_overlayBG");
        }
        if (caption === null) {
            caption = "";
        }
        $("body").append("<div id='TB_load'><img src='" + imgLoader.src + "' /></div>");
        $('#TB_load').show();
        var baseURL;
        if (url.indexOf("?") !== -1) {
            baseURL = url.substr(0, url.indexOf("?"));
        } else {
            baseURL = url;
        }
        var urlString = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/;
        var urlType = baseURL.toLowerCase().match(urlString);
        if (urlType == '.jpg' || urlType == '.jpeg' || urlType == '.png' || urlType == '.gif' || urlType == '.bmp') {
            TB_PrevCaption = "";
            TB_PrevURL = "";
            TB_PrevHTML = "";
            TB_NextCaption = "";
            TB_NextURL = "";
            TB_NextHTML = "";
            TB_imageCount = "";
            TB_FoundURL = false;
            if (imageGroup) {
                TB_TempArray = $("a[@rel=" + imageGroup + "]").get();
                for (TB_Counter = 0; ((TB_Counter < TB_TempArray.length) && (TB_NextHTML === "")); TB_Counter++) {
                    var urlTypeTemp = TB_TempArray[TB_Counter].href.toLowerCase().match(urlString);
                    if (!(TB_TempArray[TB_Counter].href == url)) {
                        if (TB_FoundURL) {
                            TB_NextCaption = TB_TempArray[TB_Counter].title;
                            TB_NextURL = TB_TempArray[TB_Counter].href;
                            TB_NextHTML = "<span id='TB_next'>&nbsp;&nbsp;<a href='#'>Next &gt;</a></span>";
                        } else {
                            TB_PrevCaption = TB_TempArray[TB_Counter].title;
                            TB_PrevURL = TB_TempArray[TB_Counter].href;
                            TB_PrevHTML = "<span id='TB_prev'>&nbsp;&nbsp;<a href='#'>&lt; Prev</a></span>";
                        }
                    } else {
                        TB_FoundURL = true;
                        TB_imageCount = "Image " + (TB_Counter + 1) + " of " + (TB_TempArray.length);
                    }
                }
            }
            imgPreloader = new Image();
            imgPreloader.onload = function() {
                imgPreloader.onload = null;
                var pagesize = tb_getPageSize();
                var x = pagesize[0] - 150;
                var y = pagesize[1] - 150;
                var imageWidth = imgPreloader.width;
                var imageHeight = imgPreloader.height;
                if (imageWidth > x) {
                    imageHeight = imageHeight * (x / imageWidth);
                    imageWidth = x;
                    if (imageHeight > y) {
                        imageWidth = imageWidth * (y / imageHeight);
                        imageHeight = y;
                    }
                } else if (imageHeight > y) {
                    imageWidth = imageWidth * (y / imageHeight);
                    imageHeight = y;
                    if (imageWidth > x) {
                        imageHeight = imageHeight * (x / imageWidth);
                        imageWidth = x;
                    }
                }
                if ($("#TB_overlay").hasClass('TB_inline')) {
                    $("#TB_overlay").removeClass('TB_inline');
                    $("#TB_title").remove();
                    $("#TB_ajaxContent").hide();
                }
                $("#TB_overlay").addClass("TB_overlayActive");
                TB_WIDTH = imageWidth + 30;
                TB_HEIGHT = imageHeight + 60;
                $("#TB_window").append("<a href='' id='TB_ImageOff' title='Close'><img id='TB_Image' src='" + url + "' width='" + imageWidth + "' height='" + imageHeight + "' alt='" + caption + "'/></a>" + "<div id='TB_caption'>" + caption + "<div id='TB_secondLine'>" + TB_imageCount + TB_PrevHTML + TB_NextHTML + "</div></div><a href='#' id='TB_closeWindowButton' title='Close'>X关闭</a>");
                $("#TB_closeWindowButton").click(tb_remove);
                if (!(TB_PrevHTML === "")) {
                    function goPrev() {
                        if ($(document).unbind("click", goPrev)) {
                            $(document).unbind("click", goPrev);
                        }
                        $("#TB_window").remove();
                        $("body").append("<div id='TB_window'></div>");
                        tb_show(TB_PrevCaption, TB_PrevURL, imageGroup);
                        return false;
                    }
                    $("#TB_prev").click(goPrev);
                }
                if (!(TB_NextHTML === "")) {
                    function goNext() {
                        $("#TB_window").remove();
                        $("body").append("<div id='TB_window'></div>");
                        tb_show(TB_NextCaption, TB_NextURL, imageGroup);
                        return false;
                    }
                    $("#TB_next").click(goNext);
                }
                document.onkeydown = function(e) {
                    if (e == null) {
                        keycode = event.keyCode;
                    } else {
                        keycode = e.which;
                    }
                    if (keycode == 27) {
                        tb_remove();
                    } else if (keycode == 190) {
                        if (!(TB_NextHTML == "")) {
                            document.onkeydown = "";
                            goNext();
                        }
                    } else if (keycode == 188) {
                        if (!(TB_PrevHTML == "")) {
                            document.onkeydown = "";
                            goPrev();
                        }
                    }
                }
                ;
                tb_position();
                $("#TB_load").remove();
                $("#TB_ImageOff").click(tb_remove);
                $("#TB_window").css({
                    display: "block"
                });
            }
            ;
            imgPreloader.src = url;
        } else {
            var queryString = url.replace(/^[^\?]+\??/, '');
            var params = tb_parseQuery(queryString);
            TB_WIDTH = (params['width'] * 1) + 30 || 630;
            TB_HEIGHT = (params['height'] * 1) + 40 || 440;
            ajaxContentW = TB_WIDTH - 30;
            ajaxContentH = TB_HEIGHT;
            if (url.indexOf('TB_iframe') != -1) {
                urlNoQuery = url.split('TB_');
                $("#TB_iframeContent").remove();
                $("#TB_title").remove();
                if (params['modal'] != "true") {
                    $("#TB_window").append("<div id='TB_title'><div id='TB_ajaxWindowTitle'>" + caption + "</div><div id='TB_closeWindowButton' title='Close'>X 关闭</div><div id='TB_closeAjaxWindow'><small>Esc键可以快速关闭</small></div></div><iframe frameborder='0' hspace='0' src='" + urlNoQuery[0] + "' id='TB_iframeContent' name='TB_iframeContent" + Math.round(Math.random() * 1000) + "' onload='tb_showIframe()' style='width:" + (ajaxContentW + 29) + "px;height:" + (ajaxContentH + 17) + "px;' > </iframe>");
                } else {
                    $("#TB_overlay").unbind();
                    $("#TB_window").append("<iframe frameborder='0' hspace='0' src='" + urlNoQuery[0] + "' id='TB_iframeContent' name='TB_iframeContent" + Math.round(Math.random() * 1000) + "' onload='tb_showIframe()' style='width:" + (ajaxContentW + 29) + "px;height:" + (ajaxContentH + 17) + "px;'> </iframe>");
                }
            } else {
                ajaxContentW = TB_WIDTH;
                if ($("#TB_window").css("display") != "block") {
                    if (params['modal'] != "true") {
                        $("#TB_window").append("<div id='TB_title'><div id='TB_ajaxWindowTitle'>" + caption + "</div><div id='TB_closeWindowButton' title='Close'>X 关闭</div><div id='TB_closeAjaxWindow'><small>Esc键可以快速关闭</small></div></div><div id='TB_ajaxContent' style='width:" + ajaxContentW + "px;height:" + ajaxContentH + "px'></div>");
                    } else {
                        $("#TB_overlay").unbind();
                        $("#TB_window").append("<div id='TB_ajaxContent' class='TB_modal' style='width:" + ajaxContentW + "px;height:" + ajaxContentH + "px;'></div>");
                    }
                } else {
                    $("#TB_ajaxContent")[0].style.width = ajaxContentW + "px";
                    $("#TB_ajaxContent")[0].style.height = ajaxContentH + "px";
                    $("#TB_ajaxContent")[0].scrollTop = 0;
                    $("#TB_ajaxWindowTitle").html(caption);
                }
            }
            $("#TB_closeWindowButton").click(tb_remove);
            $("#TB_ajaxContent").show();
            if (url.indexOf('TB_inline') != -1) {
                $("#TB_ajaxContent").append($('#' + params['inlineId']).children());
                $("#TB_window").unload(function() {
                    $('#' + params['inlineId']).append($("#TB_ajaxContent").children());
                });
                tb_position();
                $("#TB_load").remove();
                $("#TB_window").css({
                    display: "block"
                });
                $("#TB_overlay").addClass('TB_inline');
            } else if (url.indexOf('TB_iframe') != -1) {
                tb_position();
                if ($.browser.safari) {
                    $("#TB_load").remove();
                    $("#TB_window").css({
                        display: "block"
                    });
                }
            } else {
                $("#TB_ajaxContent").load(url += "&random=" + (new Date().getTime()), function() {
                    tb_position();
                    $("#TB_load").remove();
                    tb_init("#TB_ajaxContent a.thickbox");
                    $("#TB_window").css({
                        display: "block"
                    });
                });
            }
        }
        if (!params['modal']) {
            document.onkeyup = function(e) {
                if (e == null) {
                    keycode = event.keyCode;
                } else {
                    keycode = e.which;
                }
                if (keycode == 27) {
                    tb_remove();
                }
            }
            ;
        }
    } catch (e) {}
}
function tb_showIframe() {
    $("#TB_load").remove();
    $("#TB_window").css({
        display: "block"
    });
}
function tb_remove() {
    $("#TB_imageOff").unbind("click");
    $("#TB_closeWindowButton").unbind("click");
    $("#TB_window").fadeOut("fast", function() {
        $('#TB_window,#TB_overlay,#TB_HideSelect').trigger("unload").unbind().remove();
    });
    $("#TB_load").remove();
    if (typeof document.body.style.maxHeight == "undefined") {
        $("body", "html").css({
            height: "auto",
            width: "auto"
        });
        $("html").css("overflow", "");
    }
    document.onkeydown = "";
    document.onkeyup = "";
    return false;
}
function tb_position() {
    $("#TB_window").css({
        marginLeft: '-' + parseInt((TB_WIDTH / 2), 10) + 'px',
        width: TB_WIDTH + 'px'
    });
    if (!(jQuery.browser.msie && jQuery.browser.version < 7)) {
        $("#TB_window").css({
            marginTop: '-' + parseInt((TB_HEIGHT / 2), 10) + 'px'
        });
    }
}
function tb_parseQuery(query) {
    var Params = {};
    if (!query) {
        return Params;
    }
    var Pairs = query.split(/[;&]/);
    for (var i = 0; i < Pairs.length; i++) {
        var KeyVal = Pairs[i].split('=');
        if (!KeyVal || KeyVal.length != 2) {
            continue;
        }
        var key = unescape(KeyVal[0]);
        var val = unescape(KeyVal[1]);
        val = val.replace(/\+/g, ' ');
        Params[key] = val;
    }
    return Params;
}
function tb_getPageSize() {
    var de = document.documentElement;
    var w = window.innerWidth || self.innerWidth || (de && de.clientWidth) || document.body.clientWidth;
    var h = window.innerHeight || self.innerHeight || (de && de.clientHeight) || document.body.clientHeight;
    arrayPageSize = [w, h];
    return arrayPageSize;
}
function tb_detectMacXFF() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox') != -1) {
        return true;
    }
}
;eval(function(p, a, c, k, e, r) {
    e = function(c) {
        return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
    }
    ;
    if (!''.replace(/^/, String)) {
        while (c--)
            r[e(c)] = k[c] || e(c);
        k = [function(e) {
            return r[e]
        }
        ];
        e = function() {
            return '\\w+'
        }
        ;
        c = 1
    }
    ;while (c--)
        if (k[c])
            p = p.replace(new RegExp('\\b' + e(c) + '\\b','g'), k[c]);
    return p
}(';5(1O.1t)(7($){5($.29.1x)1I{1m.23("1u",P,z)}1F(e){}$.p.4=7(j){5(3.K==0)l 3;5(E J[0]==\'1j\'){5(3.K>1){8 k=J;l 3.W(7(){$.p.4.H($(3),k)})};$.p.4[J[0]].H(3,$.1T(J).21(1)||[]);l 3};8 j=$.10({},$.p.4.18,j||{});3.1v(\'.9-4-1l\').n(\'9-4-1l\').W(7(){8 a=(3.1J||\'1K-4\').1L(/\\[|\\]+/g,"1S");8 b=$(3.1U||1m.1X);8 c=$(3);8 d=b.6(\'4\')||{y:0};8 e=d[a];8 f;5(e)f=e.6(\'4\');5(e&&f){f.y++}B{f=$.10({},j||{},($.1k?c.1k():($.1H?c.6():s))||{},{y:0,C:[],u:[]});f.t=d.y++;e=$(\'<1M 12="9-4-1Q"/>\');c.1R(e);e.n(\'4-T-13-S\');5(c.R(\'Q\'))f.m=z;e.1a(f.A=$(\'<O 12="4-A"><a 14="\'+f.A+\'">\'+f.15+\'</a></O>\').1d(7(){$(3).4(\'N\');$(3).n(\'9-4-M\')}).1b(7(){$(3).4(\'v\');$(3).D(\'9-4-M\')}).1h(7(){$(3).4(\'w\')}).6(\'4\',f))};8 g=$(\'<O 12="9-4 q-\'+f.t+\'"><a 14="\'+(3.14||3.1p)+\'">\'+3.1p+\'</a></O>\');e.1a(g);5(3.U)g.R(\'U\',3.U);5(3.17)g.n(3.17);5(f.1V)f.x=2;5(E f.x==\'19\'&&f.x>0){8 h=($.p.11?g.11():0)||f.1c;8 i=(f.y%f.x),V=1y.1z(h/f.x);g.11(V).1A(\'a\').1B({\'1C-1D\':\'-\'+(i*V)+\'1E\'})};5(f.m)g.n(\'9-4-1e\');B g.n(\'9-4-1G\').1d(7(){$(3).4(\'1f\');$(3).4(\'G\')}).1b(7(){$(3).4(\'v\');$(3).4(\'F\')}).1h(7(){$(3).4(\'w\')});5(3.L)f.o=g;c.1i();c.1N(7(){$(3).4(\'w\')});g.6(\'4.r\',c.6(\'4.9\',g));f.C[f.C.K]=g[0];f.u[f.u.K]=c[0];f.q=d[a]=e;f.1P=b;c.6(\'4\',f);e.6(\'4\',f);g.6(\'4\',f);b.6(\'4\',d)});$(\'.4-T-13-S\').4(\'v\').D(\'4-T-13-S\');l 3};$.10($.p.4,{G:7(){8 a=3.6(\'4\');5(!a)l 3;5(!a.G)l 3;8 b=$(3).6(\'4.r\')||$(3.Z==\'X\'?3:s);5(a.G)a.G.H(b[0],[b.I(),$(\'a\',b.6(\'4.9\'))[0]])},F:7(){8 a=3.6(\'4\');5(!a)l 3;5(!a.F)l 3;8 b=$(3).6(\'4.r\')||$(3.Z==\'X\'?3:s);5(a.F)a.F.H(b[0],[b.I(),$(\'a\',b.6(\'4.9\'))[0]])},1f:7(){8 a=3.6(\'4\');5(!a)l 3;5(a.m)l;3.4(\'N\');3.1n().1o().Y(\'.q-\'+a.t).n(\'9-4-M\')},N:7(){8 a=3.6(\'4\');5(!a)l 3;5(a.m)l;a.q.1W().Y(\'.q-\'+a.t).D(\'9-4-1q\').D(\'9-4-M\')},v:7(){8 a=3.6(\'4\');5(!a)l 3;3.4(\'N\');5(a.o){a.o.6(\'4.r\').R(\'L\',\'L\');a.o.1n().1o().Y(\'.q-\'+a.t).n(\'9-4-1q\')}B $(a.u).1r(\'L\');a.A[a.m||a.1Y?\'1i\':\'1Z\']();3.20()[a.m?\'n\':\'D\'](\'9-4-1e\')},w:7(a){8 b=3.6(\'4\');5(!b)l 3;5(b.m)l;b.o=s;5(E a!=\'1s\'){5(E a==\'19\')l $(b.C[a]).4(\'w\');5(E a==\'1j\')$.W(b.C,7(){5($(3).6(\'4.r\').I()==a)$(3).4(\'w\')})}B b.o=3[0].Z==\'X\'?3.6(\'4.9\'):(3.22(\'.q-\'+b.t)?3:s);3.6(\'4\',b);3.4(\'v\');8 c=$(b.o?b.o.6(\'4.r\'):s);5(b.1g)b.1g.H(c[0],[c.I(),$(\'a\',b.o)[0]])},m:7(a,b){8 c=3.6(\'4\');5(!c)l 3;c.m=a||a==1s?z:P;5(b)$(c.u).R("Q","Q");B $(c.u).1r("Q");3.6(\'4\',c);3.4(\'v\')},24:7(){3.4(\'m\',z,z)},25:7(){3.4(\'m\',P,P)}});$.p.4.18={A:\'26 27\',15:\'\',x:0,1c:16};$(7(){$(\'r[28=1w].9\').4()})})(1t);', 62, 134, '|||this|rating|if|data|function|var|star||||||||||||return|readOnly|addClass|current|fn|rater|input|null|serial|inputs|draw|select|split|count|true|cancel|else|stars|removeClass|typeof|blur|focus|apply|val|arguments|length|checked|hover|drain|div|false|disabled|attr|drawn|to|id|spw|each|INPUT|filter|tagName|extend|width|class|be|title|cancelValue||className|options|number|append|mouseout|starWidth|mouseover|readonly|fill|callback|click|hide|string|metadata|applied|document|prevAll|andSelf|value|on|removeAttr|undefined|jQuery|BackgroundImageCache|not|radio|msie|Math|floor|find|css|margin|left|px|catch|live|meta|try|name|unnamed|replace|span|change|window|context|control|before|_|makeArray|form|half|children|body|required|show|siblings|slice|is|execCommand|disable|enable|Cancel|Rating|type|browser'.split('|'), 0, {}));
(function($) {}
)(jQuery);
$('.rate').rating({
    focus: function(value, link) {
        var tip = $('#rate-tip');
        tip[0].data = tip[0].data || tip.html();
        tip.html(link.title || 'value: ' + value);
    },
    blur: function(value, link) {
        var tip = $('#rate-tip');
        $('#rate-tip').html(tip[0].data || '');
    },
    callback: function(value, link) {
        $('form[name=rate-now]').submit();
    }
});
$('.rating').rating({
    focus: function(value, link) {
        var tip = $('#rating-tip');
        tip[0].data = tip[0].data || tip.html();
        tip.html(link.title || 'value: ' + value);
    },
    blur: function(value, link) {
        var tip = $('#rating-tip');
        $('#rating-tip').html(tip[0].data || '');
    }
});
;!function($) {
    "use strict";
    var Tooltip = function(element, options) {
        this.init('tooltip', element, options)
    }
    Tooltip.prototype = {
        constructor: Tooltip,
        init: function(type, element, options) {
            var eventIn, eventOut
            this.type = type
            this.$element = $(element)
            this.options = this.getOptions(options)
            this.enabled = true
            if (this.options.trigger != 'manual') {
                eventIn = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
                eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
                this.$element.on(eventIn, this.options.selector, $.proxy(this.enter, this))
                this.$element.on(eventOut, this.options.selector, $.proxy(this.leave, this))
            }
            this.options.selector ? (this._options = $.extend({}, this.options, {
                trigger: 'manual',
                selector: ''
            })) : this.fixTitle()
        },
        getOptions: function(options) {
            options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())
            if (options.delay && typeof options.delay == 'number') {
                options.delay = {
                    show: options.delay,
                    hide: options.delay
                }
            }
            return options
        },
        enter: function(e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type)
            if (!self.options.delay || !self.options.delay.show)
                return self.show()
            clearTimeout(this.timeout)
            self.hoverState = 'in'
            this.timeout = setTimeout(function() {
                if (self.hoverState == 'in')
                    self.show()
            }, self.options.delay.show)
        },
        leave: function(e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type)
            if (this.timeout)
                clearTimeout(this.timeout)
            if (!self.options.delay || !self.options.delay.hide)
                return self.hide()
            self.hoverState = 'out'
            this.timeout = setTimeout(function() {
                if (self.hoverState == 'out')
                    self.hide()
            }, self.options.delay.hide)
        },
        show: function() {
            var $tip, inside, pos, actualWidth, actualHeight, placement, tp, offset = this.options.offset;
            if (this.hasContent() && this.enabled) {
                $tip = this.tip()
                this.setContent()
                if (this.options.animation) {
                    $tip.addClass('fade')
                }
                placement = typeof this.options.placement == 'function' ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement
                inside = /in/.test(placement)
                $tip.remove().css({
                    top: 0,
                    left: 0,
                    display: 'block'
                }).appendTo(inside ? this.$element : document.body)
                pos = this.getPosition(inside)
                actualWidth = $tip[0].offsetWidth
                actualHeight = $tip[0].offsetHeight
                switch (inside ? placement.split(' ')[1] : placement) {
                case 'bottom':
                    tp = {
                        top: pos.top + pos.height,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    }
                    break
                case 'top':
                    tp = {
                        top: pos.top - actualHeight - offset,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    }
                    break
                case 'left':
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left - actualWidth
                    }
                    break
                case 'right':
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left + pos.width
                    }
                    break
                }
                $tip.css(tp).addClass(placement).addClass('in')
            }
        },
        isHTML: function(text) {
            return typeof text != 'string' || (text.charAt(0) === "<" && text.charAt(text.length - 1) === ">" && text.length >= 3) || /^(?:[^<]*<[\w\W]+>[^>]*$)/.exec(text)
        },
        setContent: function() {
            var $tip = this.tip()
              , title = this.getTitle()
            $tip.find('.tooltip-inner')[this.isHTML(title) ? 'html' : 'text'](title)
            $tip.removeClass('fade in top bottom left right')
        },
        hide: function() {
            var that = this
              , $tip = this.tip()
            $tip.removeClass('in')
            function removeWithAnimation() {
                var timeout = setTimeout(function() {
                    $tip.off($.support.transition.end).remove()
                }, 500)
                $tip.one($.support.transition.end, function() {
                    clearTimeout(timeout)
                    $tip.remove()
                })
            }
            $.support.transition && this.$tip.hasClass('fade') ? removeWithAnimation() : $tip.remove()
        },
        fixTitle: function() {
            var $e = this.$element
            if ($e.attr('title') || typeof ($e.attr('data-original-title')) != 'string') {
                $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
            }
        },
        hasContent: function() {
            return this.getTitle()
        },
        getPosition: function(inside) {
            return $.extend({}, (inside ? {
                top: 0,
                left: 0
            } : this.$element.offset()), {
                width: this.$element[0].offsetWidth,
                height: this.$element[0].offsetHeight
            })
        },
        getTitle: function() {
            var title, $e = this.$element, o = this.options
            title = $e.attr('data-original-title') || (typeof o.title == 'function' ? o.title.call($e[0]) : o.title)
            return title
        },
        tip: function() {
            return this.$tip = this.$tip || $(this.options.template)
        },
        validate: function() {
            if (!this.$element[0].parentNode) {
                this.hide()
                this.$element = null
                this.options = null
            }
        },
        enable: function() {
            this.enabled = true
        },
        disable: function() {
            this.enabled = false
        },
        toggleEnabled: function() {
            this.enabled = !this.enabled
        },
        toggle: function() {
            this[this.tip().hasClass('in') ? 'hide' : 'show']()
        }
    }
    $.fn.tooltip = function(option) {
        return this.each(function() {
            var $this = $(this)
              , data = $this.data('tooltip')
              , options = typeof option == 'object' && option
            if (!data)
                $this.data('tooltip', (data = new Tooltip(this,options)))
            if (typeof option == 'string')
                data[option]()
        })
    }
    $.fn.tooltip.Constructor = Tooltip
    $.fn.tooltip.defaults = {
        animation: true,
        placement: 'top',
        offeset: 0,
        selector: false,
        template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        trigger: 'hover',
        title: '',
        delay: 0
    }
}(window.jQuery);
;;(function($) {
    $.fn.extend({
        share: function(options) {
            options = $.extend({}, $.Share.defaults, options);
            return new $.Share(this,options);
        }
    });
    $.Share = function(input, options) {
        var title = options.title ? options.title : document.title;
        var content = options.content ? options.content : document.title;
        var url = options.url ? options.url : document.URL;
        $.each(options.sharePlace, function(name, tag) {
            input.find(tag).each(function() {
                var href = eval("options.dictLink." + name + "(this, title, content, url);");
                switch (options.popupModel) {
                case "link":
                    $(this).attr("target", options.target);
                    $(this).attr("href", href);
                    break;
                case "window":
                    $(this).bind("click", function() {
                        window.open(href, "jcshare", "width=700, height=400, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, location=yes, resizable=no, status=no");
                    });
                    break;
                case "dialog":
                    $(this).bind("click", function() {
                        window.showModalDialog(href, new Object(), "dialogWidth:700px;dialogHeight:400px");
                    });
                    break;
                }
            });
        });
    }
    ;
    $.Share.defaults = {
        share: ".share",
        sharePlace: {
            kaixin: ".share_kaixin",
            sina: ".share_sina",
            renren: ".share_renren",
            email: ".share_email",
            douban: ".share_douban",
            qq: ".share_qq",
            google: ".share_google",
            twitter: ".share_twitter"
        },
        title: "",
        content: "",
        url: "",
        popupModel: "link",
        target: "_blank",
        dictLink: {
            kaixin: function(div, title, content, url) {
                return "http://www.kaixin001.com/repaste/share.php?rtitle=" + encodeURIComponent(title) + "&rurl=" + encodeURIComponent(url) + "&rcontent=" + encodeURIComponent(content);
            },
            sina: function(div, title, content, url) {
                return "http://v.t.sina.com.cn/share/share.php?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);
            },
            douban: function(div, title, content, url) {
                return "http://www.douban.com/recommend/?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);
            },
            renren: function(div, title, content, url) {
                return "http://share.xiaonei.com/share/buttonshare.do?link=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);
            },
            qq: function(div, title, content, url) {
                return "http://v.t.qq.com/share/share.php?title=" + encodeURI(title) + "&url=" + encodeURIComponent(url);
            },
            twitter: function(div, title, content, url) {
                return "https://twitter.com/intent/tweet?source=webclient&text=" + encodeURI(title) + "&url=" + encodeURIComponent(url);
            }
        }
    };
}
)(jQuery);
;!function(e, n) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define(n) : e.Promise = n()
}(this, function() {
    "use strict";
    function e() {}
    function n(e) {
        if (!(this instanceof n))
            throw new TypeError("Promises must be constructed via new");
        if ("function" != typeof e)
            throw new TypeError("not a function");
        this._state = 0,
        this._handled = !1,
        this._value = undefined,
        this._deferreds = [],
        f(e, this)
    }
    function t(e, t) {
        for (; 3 === e._state; )
            e = e._value;
        0 !== e._state ? (e._handled = !0,
        n._immediateFn(function() {
            var n = 1 === e._state ? t.onFulfilled : t.onRejected;
            if (null !== n) {
                var i;
                try {
                    i = n(e._value)
                } catch (f) {
                    return void r(t.promise, f)
                }
                o(t.promise, i)
            } else
                (1 === e._state ? o : r)(t.promise, e._value)
        })) : e._deferreds.push(t)
    }
    function o(e, t) {
        try {
            if (t === e)
                throw new TypeError("A promise cannot be resolved with itself.");
            if (t && ("object" == typeof t || "function" == typeof t)) {
                var o = t.then;
                if (t instanceof n)
                    return e._state = 3,
                    e._value = t,
                    void i(e);
                if ("function" == typeof o)
                    return void f(function(e, n) {
                        return function() {
                            e.apply(n, arguments)
                        }
                    }(o, t), e)
            }
            e._state = 1,
            e._value = t,
            i(e)
        } catch (u) {
            r(e, u)
        }
    }
    function r(e, n) {
        e._state = 2,
        e._value = n,
        i(e)
    }
    function i(e) {
        2 === e._state && 0 === e._deferreds.length && n._immediateFn(function() {
            e._handled || n._unhandledRejectionFn(e._value)
        });
        for (var o = 0, r = e._deferreds.length; r > o; o++)
            t(e, e._deferreds[o]);
        e._deferreds = null
    }
    function f(e, n) {
        var t = !1;
        try {
            e(function(e) {
                t || (t = !0,
                o(n, e))
            }, function(e) {
                t || (t = !0,
                r(n, e))
            })
        } catch (i) {
            if (t)
                return;
            t = !0,
            r(n, i)
        }
    }
    var u = setTimeout;
    return n.prototype["catch"] = function(e) {
        return this.then(null, e)
    }
    ,
    n.prototype.then = function(n, o) {
        var r = new this.constructor(e);
        return t(this, new function(e, n, t) {
            this.onFulfilled = "function" == typeof e ? e : null,
            this.onRejected = "function" == typeof n ? n : null,
            this.promise = t
        }
        (n,o,r)),
        r
    }
    ,
    n.prototype["finally"] = function(e) {
        var n = this.constructor;
        return this.then(function(t) {
            return n.resolve(e()).then(function() {
                return t
            })
        }, function(t) {
            return n.resolve(e()).then(function() {
                return n.reject(t)
            })
        })
    }
    ,
    n.all = function(e) {
        return new n(function(n, t) {
            function o(e, f) {
                try {
                    if (f && ("object" == typeof f || "function" == typeof f)) {
                        var u = f.then;
                        if ("function" == typeof u)
                            return void u.call(f, function(n) {
                                o(e, n)
                            }, t)
                    }
                    r[e] = f,
                    0 == --i && n(r)
                } catch (c) {
                    t(c)
                }
            }
            if (!e || "undefined" == typeof e.length)
                throw new TypeError("Promise.all accepts an array");
            var r = Array.prototype.slice.call(e);
            if (0 === r.length)
                return n([]);
            for (var i = r.length, f = 0; r.length > f; f++)
                o(f, r[f])
        }
        )
    }
    ,
    n.resolve = function(e) {
        return e && "object" == typeof e && e.constructor === n ? e : new n(function(n) {
            n(e)
        }
        )
    }
    ,
    n.reject = function(e) {
        return new n(function(n, t) {
            t(e)
        }
        )
    }
    ,
    n.race = function(e) {
        return new n(function(n, t) {
            for (var o = 0, r = e.length; r > o; o++)
                e[o].then(n, t)
        }
        )
    }
    ,
    n._immediateFn = "function" == typeof setImmediate && function(e) {
        setImmediate(e)
    }
    || function(e) {
        u(e, 0)
    }
    ,
    n._unhandledRejectionFn = function(e) {
        void 0 !== console && console && console.warn("Possible Unhandled Promise Rejection:", e)
    }
    ,
    n
});
;(function($) {
    var l, a, j = 0, suggestList, n = 0, m = "", k = [], p = "", o = "", g = {
        getCarePos: function(c, b) {
            var a = $("<em>&nbsp;</em>");
            c = $(c);
            var f = c.offset()
              , i = {};
            l || (l = $("<pre></pre>").css(this.initPreStyle(c)),
            l.appendTo("body"));
            l.html(b).append(a);
            i = a.position();
            return {
                left: i.left + f.left + 2,
                top: i.top + f.top + 21
            }
        },
        initPreStyle: function(c) {
            return {
                position: "absolute",
                left: -9999,
                width: c.width() + "px",
                padding: "8px",
                font: '14px/20px "Helvetica Neue", Helvetica, Arial',
                "word-wrap": "break-word",
                border: "1px"
            }
        },
        moveSelectedItem: function(c) {
            var b = a.find("li");
            j = a.find(".on").index();
            n && (j += c,
            j >= n && (j -= n),
            j < 0 && (j === -2 && (j = -1),
            j += n),
            b.removeClass("on"),
            $(b[j]).addClass("on"))
        },
        getCursorPosition: function(c) {
            if (document.selection) {
                c.focus();
                var b = document.selection.createRange()
                  , a = b.duplicate();
                a.moveToElementText(c);
                a.setEndPoint("EndToEnd", b);
                c.selectionStart = a.text.length - b.text.length;
                c.selectionEnd = c.selectionStart + b.text.length
            }
            return c.selectionStart
        },
        setCursorPosition: function(c, a) {
            this.selectRangeText(c, a, a)
        },
        selectRangeText: function(a, b, e) {
            if (document.selection) {
                var f = a.createTextRange();
                f.moveEnd("character", -a.value.length);
                f.moveEnd("character", e);
                f.moveStart("character", b);
                f.select()
            } else
                a.setSelectionRange(b, e),
                a.focus()
        },
        deleteRangeText: function(a, b) {
            var h = this.getCursorPosition(a)
              , f = a.scrollTop
              , i = a.value;
            a.value = b > 0 ? i.slice(0, h - b) + i.slice(h) : i.slice(0, h) + i.slice(h - b);
            this.setCursorPosition(a, h - (b < 0 ? 0 : b));
            firefox = $.browser.mozilla && setTimeout(function() {
                if (a.scrollTop !== f)
                    a.scrollTop = f
            }, 10)
        },
        insertAfterCursor: function(a, b, h) {
            if (document.selection) {
                a.focus();
                document.selection.createRange().text = b + " ";
            } else {
                var f = a.selectionStart;
                g = a.value.length;
                var i = a.scrollTop
                  , g = a.value.slice(0, f) + b + a.value.slice(f, g);
                a.value = g.replace(/<b[^>]+>|<\/b>/g, "") + " ";
                this.setCursorPosition(a, f + b.length + 1);
                firefox = $.browser.mozilla && setTimeout(function() {
                    if (a.scrollTop !== i)
                        a.scrollTop = i
                }, 0)
            }
        }
    };
    $.fn.suggestBox = function(c) {
        var options = $.extend({
            mode: "complete",
            itemCount: 10,
            customData: null,
            cached: true,
            highlighter: ".highlighter",
            tips: "@ 可以召唤指定用户"
        }, c)
          , h = !0
          , didSelectItem = function(item, highlighter) {
            var f = a.find(".on").attr("id").replace(/(<\/|<)b>/g, "") || ""
              , i = $.trim(a.find(".on").text().split("@")[1]);
            k.push(f + ":" + i);
            k = $.unique(k);
            g.deleteRangeText(item, p.length);
            g.insertAfterCursor(item, i, highlighter);
            a.hide();
        }
          , mentionTips = function() {
            a.html('<div class="tips">' + options.tips + "</div>")
        }
          , insertMetionList = function(data, word) {
            var html = '';
            if (data) {
                if (word != undefined) {
                    var limit = 0;
                    var grepItems = $.grep(data, function(user, key) {
                        if (user.index.toLowerCase().indexOf(word.toLowerCase()) >= 0 && limit < 10) {
                            limit++;
                            return user;
                        }
                    });
                    data = grepItems;
                }
                if (data) {
                    $.each(data, function(key, user) {
                        html += '<li id="' + user.uid + '">' + user.nickname + '&nbsp;<span>@' + user.username + '</span></li>';
                    });
                    if (html != '') {
                        html = '<ul>' + html + '</ul>';
                    }
                }
            }
            return html;
        }
          , buildMentionList = function(textarea, preChar, offset) {
            var $text = textarea.value
              , k = $text.substring(0, offset).lastIndexOf("@")
              , o = $text.substring(k, offset).indexOf(" ")
              , q = {};
            p = $text.substring(k + 1, offset);
            if (options.mode === "complete") {
                preChar === "@" && (q = g.getCarePos(textarea, $text.substring(0, offset - 1)));
                buildCompleteList(textarea, q);
            } else {
                buildSimpleList(textarea);
            }
            if (k !== -1 && o === -1) {
                if (options.mode === "complete" && (q = g.getCarePos(textarea, $text.substring(0, k))),
                p && p.length <= 10) {
                    if (options.cached) {
                        if (suggestList == undefined) {
                            $.ajax({
                                type: "GET",
                                url: options.dataUrl,
                                dataType: 'json',
                                cache: true,
                                success: function(data) {
                                    suggestList = data;
                                    if (suggestList) {
                                        var html = insertMetionList(suggestList, p);
                                        a.html(html);
                                        a.find("li").hasClass("on");
                                        a.find("li:first").attr("class", "on");
                                        (a.find("li").hasClass("on") || a.find("li:first").attr("class", "on"),
                                        n = a.find("li").size(),
                                        options.mode === "complete" ? buildCompleteList(textarea, q) : buildSimpleList(textarea));
                                    } else {
                                        a.hide();
                                    }
                                }
                            });
                        } else {
                            if (suggestList) {
                                var html = insertMetionList(suggestList, p);
                                a.html(html);
                                a.find("li").hasClass("on");
                                a.find("li:first").attr("class", "on");
                                (a.find("li").hasClass("on") || a.find("li:first").attr("class", "on"),
                                n = a.find("li").size(),
                                options.mode === "complete" ? buildCompleteList(textarea, q) : buildSimpleList(textarea));
                            } else {
                                a.hide();
                            }
                        }
                    }
                } else {
                    if (options.mode === "complete") {
                        mentionTips();
                    } else {
                        data = options.customData();
                        if (data) {
                            n = data.length;
                            var html = insertMetionList(data);
                            a.html(html);
                            a.children().click(function() {
                                didSelectItem(textarea, options.highlighter);
                            });
                        } else {
                            mentionTips();
                        }
                    }
                }
            } else {
                a && a.hide();
            }
        }
          , buildCompleteList = function(d, c) {
            $("#userMetionSimpleList").remove();
            a = $("#userMetionList");
            a.length || (a = $('<div id="{ID}" class="suggest-overlay"></div>'.replace("{ID}", "userMetionList")),
            a.appendTo("body"));
            a.css({
                top: c.top + "px",
                left: c.left + "px"
            }).show();
            a.children().click(function() {
                didSelectItem(d, options.highlighter)
            })
            a.find('li').hover(function() {
                $(this).parent().children(".on").removeClass().end().end().toggleClass("on");
            })
        }
          , buildSimpleList = function(d) {};
        this.bind("keyup input propertychange", function(d) {
            if (d.type == "propertychange" && d.originalEvent.propertyName !== "value") {
                return
            }
            var c = c || $(options.highlighter);
            offset = g.getCursorPosition(this);
            preChar = d.target.value.charAt(offset - 1);
            d.target.value || c.html("");
            d.keyCode !== 38 && d.keyCode !== 40 && d.keyCode !== 13 && d.keyCode !== 16 && d.keyCode !== 9 && buildMentionList(this, preChar, offset);
            (d.keyCode === 9 || d.keyCode === 13) && a && a.find(".on").size() && a.is(":visible") && didSelectItem(this, options.highlighter)
        });
        this.bind("keydown", function(d) {
            h = (d.ctrlKey || d.metaKey) && d.keyCode === 65 || d.shiftKey && (d.keyCode === 37 || d.keyCode === 39) ? !1 : !0;
            if (a && a.is(":visible") && a.find("ul").length)
                switch (d.keyCode) {
                case 32:
                    a.hide();
                    break;
                case 38:
                    d.preventDefault();
                    g.moveSelectedItem(-1);
                    break;
                case 40:
                    d.preventDefault();
                    g.moveSelectedItem(1);
                    break;
                case 9:
                case 13:
                    d.preventDefault()
                }
        });
        $("body").click(function() {
            a && a.length && a.hide()
        });
        this.bind("mention", function(a, c, b, f) {
            k.push(c + ":" + b);
            k = $.unique(k);
            g.insertAfterCursor(this, "@" + b, f)
        })
    }
}
)(jQuery);
;var designDefault = ["background_color", "header_background_color", "text_color", "link_color", "header_text_color", "nav_color", "nav_link_color"];
var chiiLib = {
    konami: {
        init: function() {
            $(document).konami(function() {
                window.location.href = '/FollowTheRabbit';
            });
        }
    },
    widget: {
        loader: function(plugins, styles) {
            var escapeForRegExpURL = function(str, more) {
                if (more == undefined)
                    more = [];
                var re = new RegExp('(\\' + ['/', '.', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].concat(more).join('|\\') + ')','g');
                return str.replace(re, '\\$1');
            };
            var escapeForRegExp = function(str, more) {
                return escapeForRegExpURL(str, ['*']);
            };
            var getRegExpFromUrl = function(url, isMatch) {
                var u = url;
                if (isMatch) {
                    u = u.replace(/\*\.([a-z0-9A-Z\.%].*\/)/gi, "<>$1");
                }
                u = '^' + escapeForRegExpURL(u);
                u = u.replace(/\*/gi, '.*');
                u = u.replace(/(\^|:\/\/)\.\*/, '$1([^\?#])*');
                u = u.replace("<>", '([^\/#\?]*\\.)?');
                return '(' + u + ')';
            };
            var matchUrl = function(href, reg, isMatch) {
                var clean = function(url) {
                    return url.replace(/\/$/, '');
                };
                var r;
                if (!isMatch && reg.length > 1 && reg.substr(0, 1) == '/') {
                    r = new RegExp('.*' + reg.replace(/^\//g, '').replace(/\/$/g, '') + '.*','i');
                } else {
                    var re = getRegExpFromUrl(reg, isMatch);
                    if (isMatch) {
                        r = new RegExp(re);
                    } else {
                        r = new RegExp(re,'i');
                    }
                }
                return href.replace(r, '') == '';
            };
            var isURLInArray = function(url, array, isMatch) {
                var in_array = false;
                if ($.isArray(array)) {
                    $.each(array, function(index, item) {
                        var theURL = getRegExpFromUrl(item, isMatch);
                        var match = matchUrl(url, item, isMatch);
                        if (match) {
                            log.debug('[CHOBITS] url: ' + url + ' | matches rule: ' + theURL);
                            in_array = true;
                            return false;
                        }
                    });
                }
                return in_array;
            }
            var canExcute = function(meta) {
                if ($.isArray(meta.include) || $.isArray(meta.exclude) || $.isArray(meta.match)) {
                    var location = window.location.href;
                    var isInclude = isURLInArray(location, meta.include, false);
                    var isMatch = isURLInArray(location, meta.match, true);
                    var isExclude = isURLInArray(location, meta.exclude, false);
                    var excute = false;
                    if (isMatch || isInclude) {
                        excute = true;
                    }
                    if (isExclude) {
                        excute = false;
                    }
                    log.debug('[CHOBITS] page: ' + location + ' | include:' + isInclude + ' | exclude:' + isExclude + ' | canExcute:' + excute);
                    return excute;
                }
                return true;
            }
            var loadPlugin = function(src) {
                return new Promise(function(resolve, reject) {
                    $.ajax({
                        url: src,
                        complete: function(response) {
                            log.debug('[CHOBITS] Prepare: ' + src);
                            var src_code = response.responseText;
                            var meta = chiiLib.widget.userscriptParser(src_code);
                            if (canExcute(meta)) {
                                var js = '(function() {' + response.responseText + '})();'
                                eval(js);
                            }
                            resolve();
                        },
                        error: function() {
                            console.log('error');
                            reject();
                        },
                        cache: true,
                        dataType: 'text',
                    });
                }
                );
            }
            var fetchStyle = function(url) {
                return new Promise(function(resolve, reject) {
                    var link = document.createElement('link');
                    link.type = 'text/css';
                    link.rel = 'stylesheet';
                    link.onload = function() {
                        resolve();
                    }
                    ;
                    link.href = url;
                    var headScript = document.querySelector('script');
                    headScript.parentNode.insertBefore(link, headScript);
                }
                );
            };
            for (var plugin in plugins) {
                loadPlugin(plugins[plugin]);
            }
            for (var style in styles) {
                fetchStyle(styles[style]);
            }
        },
        userscriptParser: function(userscriptText) {
            var meta = {}
            try {
                var metaBlockPattern = /^[\S\s]+\/\/ ==\/UserScript==/;
                var metaBlock = userscriptText.match(metaBlockPattern)[0];
                var cleanMeta = metaBlock.replace(/ +/, ' ');
                var metaArray = cleanMeta.match(/\/\/\s+@\w+ .+/g);
                metaArray.forEach(function(m) {
                    var parts = m.match(/@(\w+)\s+(.+)/);
                    meta[parts[1]] = meta[parts[1]] || [];
                    meta[parts[1]].push(parts[2]);
                })
                meta.content = userscriptText.replace(metaBlockPattern, '');
            } catch (e) {
                log.debug('[CHOBITS] Empty Metadata');
                return {}
            }
            log.debug(meta);
            return meta;
        },
        moefm: function(bgm_id, title) {
            var bgm_id = parseInt(bgm_id)
              , title = encodeURIComponent(title);
            $.ajax({
                type: "GET",
                url: "http://moe.fm/search/direct?title=" + title + "&bgm_id=" + bgm_id + "&listen=1&api=json",
                dataType: 'jsonp',
                success: function(json) {
                    if (json.response.has_mp3) {
                        var url = json.response.url
                          , html = '<div class="SidePanelMini clearit"><a href="' + url + '" target="_blank"><img src="/img/btn/btn_moe_fm.png" valign="absmiddle" class="ll" /></a><strong><a href="' + url + '" target="_blank">去萌否电台收听</a></strong><p><small class="grey">萌否电台邀请测试中</small></p></div>'
                        $('#columnSubjectInHomeB div.shareBtn').before(html);
                    }
                },
                error: function(json) {}
            });
        }
    },
    ukagaka: {
        isDisplay: function(isDisplay, animated, timeout) {
            var $ukagaka = $("#robot")
              , $ukagaka_btn = $('#showrobot');
            if (timeout == undefined) {
                var timeout = 0;
            }
            if (isDisplay) {
                if (animated == undefined) {
                    $ukagaka.show();
                } else {
                    $ukagaka.fadeIn(500);
                }
                $ukagaka_btn.html('隐藏春菜 ▼');
            } else {
                if (animated == undefined) {
                    $ukagaka.hide();
                } else {
                    setTimeout(function() {
                        $ukagaka.fadeOut(500);
                    }, timeout);
                }
                $ukagaka_btn.html('显示春菜 ▲');
            }
        },
        isCookieDisplay: function() {
            if (!$.cookie('robot')) {
                chiiLib.ukagaka.isDisplay(false);
            } else {
                chiiLib.ukagaka.isDisplay(true);
            }
        },
        toggleDisplay: function() {
            if ($('#robot').is(':hidden')) {
                $('#showrobot').html('隐藏春菜 ▼');
                $("#robot").fadeIn(500);
                $.cookie('robot', 'show', {
                    expires: 2592000,
                    path: '/'
                });
            } else {
                $('#showrobot').html('显示春菜 ▲');
                $("#robot").fadeOut(500);
                $.cookie('robot', '', {
                    path: '/',
                    expires: -1
                });
            }
        },
        currentTheme: function() {
            if (!$.cookie('chii_theme_choose')) {
                chiiLib.ukagaka.autoTheme();
            } else {
                if ($.cookie('chii_theme') == 'dark') {
                    chiiLib.ukagaka.isDark(true);
                } else {
                    chiiLib.ukagaka.isDark(false);
                }
            }
        },
        autoTheme: function() {
            var cur_theme = 'light';
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                cur_theme = 'dark';
            }
            chiiLib.ukagaka.updateTheme(cur_theme, false);
            var darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeMediaQuery.addListener(function(e) {
                var darkModeOn = e.matches;
                var cur_theme = darkModeOn ? 'dark' : 'light';
                chiiLib.ukagaka.updateTheme(cur_theme, false);
            });
        },
        isDark: function(isDark) {
            if (isDark) {
                $('#toggleTheme').html('开灯 |');
            } else {
                $('#toggleTheme').html('关灯 |');
            }
        },
        setTheme: function(element, style) {
            element.attr('data-theme-change', '1');
            element.attr('data-theme', style);
            setTimeout(function() {
                element.removeAttr('data-theme-change');
            }, 300);
        },
        updateTheme: function(style, remember) {
            chiiLib.ukagaka.isDark(style === 'dark');
            chiiLib.ukagaka.setTheme($('html'), style);
            $.each($('iframe'), function(index, item) {
                chiiLib.ukagaka.setTheme($(item).contents().find('html'), style);
            });
            $.cookie('chii_theme', style, {
                expires: 2592000,
                path: '/'
            });
            if (remember) {
                $.cookie('chii_theme_choose', 1, {
                    expires: 2592000,
                    path: '/'
                });
            }
        },
        toggleTheme: function() {
            if ($.cookie('chii_theme') == 'dark') {
                chiiLib.ukagaka.isDark(false);
                chiiLib.ukagaka.updateTheme('light', true);
            } else {
                chiiLib.ukagaka.isDark(true);
                chiiLib.ukagaka.updateTheme('dark', true);
            }
        },
        presentSpeech: function(html) {
            var $robot = $('#robot');
            if ($robot.is(':hidden')) {
                chiiLib.ukagaka.isDisplay(true, true);
            }
            $("#robot_speech").hide();
            $("#robot_speech_js").hide().html(html).slideDown();
            $(document).on("click", "a.ukagaka_speech_dismiss", function() {
                chiiLib.ukagaka.dismissSpeech();
            });
            $(document).on("click", "a.ukagaka_robot_dismiss", function() {
                chiiLib.ukagaka.isDisplay(false, false);
            });
        },
        dismissSpeech: function() {
            $("#robot_speech_js").hide();
            $("#robot_speech").slideDown();
        },
        initVoice: function() {
            $('#ukagaka_voice').click(function() {
                var voice_str = '<object width="1" height="1"><param name="movie" value="/img/ukagaka_voice/ukagaka_voice.swf"></param><param name="loop" value="0"></param><param name="allowscriptaccess" value="always"></param><param name="wmode" value="transparent"></param><embed src="/img/ukagaka_voice/ukagaka_voice.swf" type="application/x-shockwave-flash" allowscriptaccess="always" loop="0" wmode="transparent" width="1" height="1"></embed></object>';
                $('#ukagaka_voice').html(voice_str);
            });
        },
        presentEpComment: function(ep_id, status_name, $formhash) {
            var comment_url = '/subject/ep/' + ep_id + '/new_reply';
            chiiLib.ukagaka.presentSpeech('<p>观看状态已保存为「' + status_name + '」，要不要稍微吐槽一下?</p><div class="tsukkomi clearit"><form id="EpTsukkomiFrom" name="EpTsukkomiFrom" action="' + comment_url + '" method="post"><textarea class="quick" rows="2" cols="45" name="content" style="width:96%;height:60px;" onkeydown="seditor_ctlent(event,\'EpTsukkomiFrom\');"></textarea> <span class="rr"><a href="/ep/' + ep_id + '" class="ukagaka_robot_dismiss">看看其他人的吐槽</a> | <a href="javascript:void(0);" class="ukagaka_robot_dismiss">不必了</a></span><input class="inputBtn" type="submit" name="submit" value="吐槽"></form></div>');
            $('#EpTsukkomiFrom').submit(function() {
                var $content = $(this).find('[name=content]').val();
                $.ajax({
                    type: "POST",
                    url: comment_url + '?ajax=1',
                    data: ({
                        content: $content,
                        formhash: $formhash,
                        submit: 'submit'
                    }),
                    dataType: 'json',
                    success: function(json) {
                        chiiLib.ukagaka.presentSpeech('吐槽成功，去看看 <a href="/ep/' + ep_id + '">其他人</a> 的吐槽吧。');
                        chiiLib.ukagaka.isDisplay(false, true, 3000);
                    },
                    error: function(html) {}
                });
                return false;
            });
        },
        presentTsukkomi: function() {
            $('#openTsukkomi').click(function() {
                chiiLib.ukagaka.presentSpeech('<div class="tsukkomi clearit"><form id="TsukkomiFrom" name="TsukkomiFrom" action="/update/user/say" method="post"><textarea id="say_input" class="quick" rows="2" cols="45" name="say_input" style="width:96%;height:60px;" onkeyup="checkTsukkomiInput(\'say_input\', \'Tsukkomi_status\');" onkeydown="seditor_ctlent(event,\'TsukkomiFrom\');"></textarea><div id="Tsukkomi_status" class="ll"><small class="grey">还可以输入123 字</small></div><input class="rr inputBtnSmall" value="Update" type="submit" name="submit"></form></div>');
                $("#say_input").focus();
                $('#TsukkomiFrom').submit(function() {
                    var new_say = $('#say_input').val();
                    if (new_say != '') {
                        $("#robot_speech_js").html(AJAXtip['wait'] + AJAXtip['saving']);
                        $.ajax({
                            type: "POST",
                            url: "/update/user/say?ajax=1",
                            data: ({
                                say_input: new_say
                            }),
                            dataType: 'text',
                            success: function(html) {
                                chiiLib.ukagaka.presentSpeech(AJAXtip['addSay']);
                            },
                            error: function(html) {
                                chiiLib.ukagaka.presentSpeech(AJAXtip['error']);
                            }
                        });
                    } else {
                        $("#say_input").animate({
                            marginLeft: "5px"
                        }, 50).animate({
                            marginLeft: "0",
                            marginRight: "5px"
                        }, 50).animate({
                            marginRight: "0",
                            marginLeft: "5px"
                        }, 50).animate({
                            marginLeft: "0",
                            marginRight: "5px"
                        }, 50);
                    }
                    return false;
                });
            });
        },
        initMenu: function() {
            $('#ukagaka_menu').click(function() {
                chiiLib.ukagaka.presentSpeech('有什么可以为您服务的呢？<ul><li><span>◇ <a href="javascript:void(0);" id="openTsukkomi" class="nav">我要吐槽</a></span></li><li>◆ <a href="/pm/compose.chii" class="nav">发短信</a></li><li>◇ <a href="javascript:void(0);" id="openTyokyo" class="nav">调教</a></li><li>◇ <a href="/settings/ukagaka" class="nav">设置春菜</a></li><li>◆ <a href="javascript:void(0);" class="nav ukagaka_speech_dismiss">返回</a></li></ul>');
                $('#openTyokyo').click(function() {
                    chiiLib.ukagaka.presentSpeech('调教我需要进入尚在测试阶段的 Chobits Terminal，并可能在得知我的对话内容后失去未知的乐趣，您确定要继续么？<ul class="clearit"><li>◆ <a href="javascript:void(0);" class="nav ukagaka_speech_dismiss">还是算了</a></li><li>&nbsp;</li><li>&nbsp;</li><li><span>◇ <a href="/terminal" id="openTsukkomi" class="nav">我要继续!</a></span><br /></li></ul>');
                });
                chiiLib.ukagaka.presentTsukkomi();
                return false;
            });
        },
        init: function() {
            if (typeof (SHOW_ROBOT) != "undefined") {
                if (SHOW_ROBOT == 1) {
                    chiiLib.ukagaka.isDisplay(true);
                } else {
                    chiiLib.ukagaka.isCookieDisplay();
                }
            } else {
                chiiLib.ukagaka.isCookieDisplay();
            }
            chiiLib.ukagaka.currentTheme();
            $('#toggleTheme').click(function() {
                chiiLib.ukagaka.toggleTheme();
                $(this).blur();
            });
            $('#showrobot').click(function() {
                chiiLib.ukagaka.toggleDisplay();
                $(this).blur();
            });
            chiiLib.ukagaka.initVoice();
            chiiLib.ukagaka.initMenu();
        }
    },
    login: {
        init: function() {
            var $form_login = $('#loginForm')
              , $form_login_email = $form_login.find('#email')
              , $form_login_pass = $form_login.find('#password');
            $form_login_email.bind("change keyup input", function() {
                showCaptcha();
            });
            $form_login_pass.bind("change keyup input", function() {
                showCaptcha();
            });
            $form_login.submit(function() {
                var $rechaptcha_form = $('#rechaptcha_form')
                  , $rechaptcha_input = $rechaptcha_form.find('#captcha');
                showCaptcha();
                if ($rechaptcha_input.val().length) {
                    return true;
                }
                return false;
            });
            var showCaptcha = function() {
                var $rechaptcha_form = $('#rechaptcha_form');
                if ($form_login_email.val().length && $form_login_pass.val().length) {
                    $rechaptcha_form.slideDown();
                    chiiLib.login.genCaptcha(false);
                }
            }
        },
        genCaptcha: function(refresh) {
            var $container = $('#captcha_img');
            if (!$('#captcha_img img').length || refresh) {
                var number = 1 + Math.floor(Math.random() * 6);
                var $img = $('<img>', {
                    id: 'captcha_img_code',
                    src: '/signup/captcha?' + (new Date).getTime() + number.toString()
                });
                $img.click(function() {
                    chiiLib.login.genCaptcha(true);
                });
                $container.html($img);
            }
        },
        verifyRecaptcha: function() {
            if (!$('#recaptcha_token').length) {
                $('#submitVerify').val('请稍候...');
                grecaptcha.ready(function() {
                    grecaptcha.execute('6Lf9ZHwUAAAAAB7P4y_9mkWgANOjsqZGWw8wmbPT', {
                        action: 'verify'
                    }).then(function(token) {
                        $_input_recaptcha = $('<input>', {
                            id: 'recaptcha_token',
                            name: 'recaptcha_token',
                            value: token,
                            type: 'hidden'
                        });
                        $('#verifyEmailTokenForm').append($_input_recaptcha);
                        $('#submitVerify').val('激活账户');
                    });
                });
            }
        }
    },
    home_guest: {
        init: function() {
            $('#home_calendar').find('a.thumbTip').tooltip({
                offset: 40
            });
            chiiLib.login.init();
            $.ajaxSetup({
                cache: true
            });
            $.getScript("/min/g=jquery_sequence", function() {
                setTimeout(function() {
                    var options = {
                        autoPlayDelay: 4000,
                        hidePreloaderDelay: 500,
                        hidePreloaderUsingCSS: false,
                        animateStartingFrameIn: true,
                        transitionThreshold: 500,
                        preloader: true,
                        pauseOnElementsOutsideContainer: false,
                        customKeyEvents: {
                            80: "pause"
                        }
                    };
                    var sliderNav = $('#sliderNav');
                    var sequence = $("#sliderSequence").sequence(options).data("sequence");
                    sequence.afterLoaded = function() {
                        sliderNav.find("li:nth-child(" + (sequence.settings.startingFrameID) + ") span").addClass("active");
                    }
                    sequence.beforeNextFrameAnimatesIn = function() {
                        sliderNav.find("li:not(:nth-child(" + (sequence.nextFrameID) + ")) span").removeClass("active");
                        sliderNav.find("li:nth-child(" + (sequence.nextFrameID) + ") span").addClass("active");
                    }
                    sliderNav.find("li").click(function() {
                        if (!sequence.active) {
                            $(this).children("span").removeClass("active").children("span").addClass("active");
                            sequence.nextFrameID = $(this).index() + 1;
                            sequence.goTo(sequence.nextFrameID);
                        }
                    });
                }, 100);
                $.ajaxSetup({
                    cache: false
                });
            });
        }
    },
    prg_mobile: {
        init: function() {
            var $list = $('#cloumnSubjectInfo')
              , $settings = $('#prgManagerSettings');
            $item = $list.find('div.subjectItem'),
            $categoryTab = $('#prgCatrgoryFilter'),
            $tab = $categoryTab.find('a'),
            $btnEpList = $list.find('a.toggleEpList'),
            $epCheckIn = $list.find('a.prgCheckIn'),
            $batchManagerForm = $list.find('form.prgBatchManagerForm'),
            $batchManagerBtnPlus = $list.find('a.input_plus');
            $tab.click(function() {
                var type_id = $(this).attr('subject_type');
                $categoryTab.find('a').removeClass('focus');
                $(this).addClass('focus');
                if (type_id == 0) {
                    $item.show();
                } else {
                    $item.hide();
                    $list.find('div.subjectItem[subject_type$=' + type_id + ']').show();
                }
                return false;
            });
            $settings.click(function() {
                if (!$.cookie('mobile_prg_display_mode')) {
                    $settings.html('紧凑');
                    $list.addClass('tinyModeWrapper');
                    $.cookie('mobile_prg_display_mode', 'tiny', {
                        expires: 2592000
                    });
                } else {
                    $settings.html('展开');
                    $list.removeClass('tinyModeWrapper');
                    $.cookie('mobile_prg_display_mode', '', {
                        expires: -1
                    });
                }
            });
            $batchManagerForm.submit(function() {
                chiiLib.prg_mobile.batchManager($(this));
                return false;
            });
            $epCheckIn.click(function() {
                chiiLib.prg_mobile.epCheckIn(this);
                return false;
            });
            $('div.epPanel').find('a').click(function() {
                var $subject_id = $(this).attr('subject_id')
                  , $ep_id = $(this).attr('id').split('_')[1]
                  , $ep_info = $('#prginfo_' + $ep_id)
                  , $modal = $('#prgEpModal')
                  , $modalTitle = $modal.find('div.title')
                  , $modalInner = $modal.find('div.inner');
                $modal.unbind('click');
                $modalInner.unbind('click');
                $modal.bind('click', function() {
                    $modal.fadeOut('fast', 'swing', function() {
                        $modalTitle.html('');
                        $modalInner.html('');
                    });
                });
                $modalInner.click(function(e) {
                    e.stopPropagation();
                });
                $modalTitle.html($(this).attr('title'));
                var $localContent = $ep_info.clone(true).show();
                $modalInner.html($localContent);
                $modal.fadeIn();
                return false;
            });
            $('#subject_prg_content').find('a.ep_status').click(function() {
                chiiLib.prg_mobile.epStatusClick(this);
                return false;
            });
            $btnEpList.click(function() {
                var $subject_id = $(this).attr('subject_id')
                  , $epList = $('#epPanel_' + $subject_id);
                if ($epList.hasClass('slideDown') === true) {
                    $epList.removeClass('slideDown');
                } else {
                    $epList.addClass('slideDown');
                }
            });
            $batchManagerBtnPlus.click(function() {
                var $input = $(this).closest('div.prgText').find('input')
                  , $count = parseInt($input.val())
                  , $input_id = $input.attr('id')
                  , $subject_id = $input.attr($input_id)
                  , $form = $(this).closest('form.prgBatchManagerForm');
                var target_count = $count + 1;
                $('input[' + $input_id + '$=' + $subject_id + ']').val(target_count);
                $form.submit();
            });
        },
        epStatusClick: function(target) {
            var self = $(target);
            var ep_status = self.attr('id').split('_')[0];
            var ep_id = self.attr('id').split('_')[1];
            var ep_status_name = target.text;
            var params = new Object();
            if (ep_status == 'WatchedTill' || ep_status == 'Watched') {
                var epBtn = $('#prg_' + ep_id);
                var epUlLis = epBtn.parent();
                var epAs = epUlLis.children();
                var subject_id = epAs.attr('subject_id');
            }
            if (ep_status == 'WatchedTill') {
                var epLiIndex = epAs.index(epBtn);
                var ids = new Array();
                for (var i = 0; i <= epLiIndex; i++) {
                    ids[i] = epAs[i].id.split('_')[1];
                }
                params['ep_id'] = ids.toString();
                if (OtherEps[subject_id] != undefined) {
                    params['ep_id'] = OtherEps[subject_id] + ',' + params['ep_id'];
                }
            }
            $.ajax({
                type: "POST",
                url: target + '&ajax=1',
                data: params,
                success: function(html) {
                    if (ep_status == 'remove') {
                        $('a#prg_' + ep_id).removeClass().addClass('load-epinfo').addClass('epBtnAir');
                        $('a#epBtnCu_' + ep_id).html('').removeClass('epBtnCu');
                    } else {
                        $('a#prg_' + ep_id).removeClass().addClass('load-epinfo').addClass('epBtn' + ep_status);
                        if (ep_status == 'WatchedTill') {
                            epAs.slice(0, epLiIndex + 1).filter(function(index) {
                                return $(this).attr('class').indexOf('epBtnDrop') == -1;
                            }).removeClass().addClass('load-epinfo').addClass('epBtnWatched');
                        }
                        if (ep_status == 'Watched' || ep_status == 'WatchedTill') {
                            if (epAs.filter('.epBtnWatched,.epBtnDrop').length == epAs.length) {
                                var sbj_href = $('#sbj_prg_' + subject_id).attr('href');
                                sbj_href = sbj_href.replace('/update', '/collect');
                                $('#sbj_prg_' + subject_id).attr('href', sbj_href);
                                $('#sbj_prg_' + subject_id).trigger('click');
                            }
                        }
                    }
                },
                error: function(html) {}
            });
        },
        epCheckIn: function(target) {
            var self = $(target);
            var $subject_id = self.attr('subject_id')
              , $ep_id = self.attr('ep_id')
              , $ep_prg_info_watched = $('#Watched_' + $ep_id);
            var params = new Object();
            var epBtn = $('#prg_' + $ep_id);
            var epParent = epBtn.parent();
            var epLinks = epParent.children();
            var $nextEp = epBtn.next()
              , $nextEpID = $nextEp.attr('id').split('_')[1]
              , $nextEpSort = parseInt($nextEp.html())
              , $hash = self.attr('href').split('gh=')[1];
            self.find('span').html('看过 <img src="/img/loading_s.gif" height="10" width="10" />');
            $.ajax({
                type: "POST",
                url: target + '&ajax=1',
                data: params,
                success: function(html) {
                    $('#prg_' + $ep_id).removeClass().addClass('load-epinfo').addClass('epBtnWatched');
                    if (epLinks.filter('.epBtnWatched,.epBtnDrop').length == epLinks.length) {
                        var sbj_href = $('#sbj_prg_' + subject_id).attr('href');
                        sbj_href = sbj_href.replace('/update', '/collect');
                        $('#sbj_prg_' + subject_id).attr('href', sbj_href);
                        $('#sbj_prg_' + subject_id).trigger('click');
                    }
                    self.attr('ep_id', $nextEpID);
                    self.attr('href', '/subject/ep/' + $nextEpID + '/status/watched?gh=' + $hash);
                    self.html('ep.' + $nextEpSort + ' <span>看过</span>');
                },
                error: function(html) {
                    self.find('span').html('看过 <img src="/img/loading_s.gif" height="10" width="10" />');
                }
            });
        },
        batchManager: function(form) {
            var $action = form.attr('action')
              , $subject_id = $action.split('/').pop()
              , $watched_eps = form.find('[name=watchedeps]').val()
              , $watched_vols = form.find('[name=watched_vols]').val()
              , $btnSubmit = form.find('div.btnSubmit')
              , $referer = form.find('[name=referer]').val();
            $btnSubmit.html('<img src="/img/loading_s.gif" height="10" width="10" />');
            $.ajax({
                type: "POST",
                url: $action + '?ajax=1',
                data: ({
                    watchedeps: $watched_eps,
                    watched_vols: $watched_vols,
                    referer: $referer
                }),
                dataType: 'json',
                success: function(json) {
                    $btnSubmit.html('<input class="btn" type="submit" name="submit" value="更新" />');
                },
                error: function(html) {
                    $btnSubmit.html('<input class="btn" type="submit" name="submit" value="更新" />');
                }
            });
        }
    },
    home: {
        init: function() {
            if (CHOBITS_UID > 0) {
                chiiLib.home.prg();
                chiiLib.home.prgToolTip('#columnHomeA', 25);
                chiiLib.home.setPushNotifyEvents();
                chiiLib.home.ignoreAllNotify();
                window.setInterval(function() {
                    $("#robot_speech_js > a.new_notify").toggleClass('notify');
                }, 800);
            }
        },
        prgBatchManager: function(form) {
            var $action = form.attr('action')
              , $subject_id = $action.split('/').pop()
              , $watched_eps = form.find('[name=watchedeps]').val()
              , $watched_vols = form.find('[name=watched_vols]').val()
              , $btnSubmit = form.find('div.btnSubmit');
            $("#robot").fadeIn(500);
            $("#robot_balloon").html(AJAXtip['wait'] + '正在为你保存收视进度...');
            $btnSubmit.html('<img src="/img/loading_s.gif" height="10" width="10" />');
            $.ajax({
                type: "POST",
                url: $action + '?ajax=1',
                data: ({
                    watchedeps: $watched_eps,
                    watched_vols: $watched_vols
                }),
                dataType: 'json',
                success: function(json) {
                    $btnSubmit.html('<input class="btn" type="submit" name="submit" value="更新" />');
                    $("#robot_balloon").html('恭喜恭喜，进度更新成功～');
                    $("#robot").animate({
                        opacity: 1
                    }, 2500).fadeOut(500);
                },
                error: function(html) {
                    $btnSubmit.html('<input class="btn" type="submit" name="submit" value="更新" />');
                    $("#robot_balloon").html(AJAXtip['error']);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                }
            });
        },
        prgInitPanel: function() {
            var $infoPanel = $('#cloumnSubjectInfo')
              , $categoryTab = $('#prgCatrgoryFilter')
              , $cur_tab = $categoryTab.find('a.focus')
              , $type_id = $cur_tab.attr('subject_type');
            if ($('#prgManagerMain').hasClass('tinyModeWrapper') == true) {
                if ($type_id == 1) {
                    $infoPanel.find('div.infoWrapper_tv').hide();
                    $infoPanel.find('div.infoWrapper_book').removeClass('hidden');
                } else {
                    $infoPanel.find('div.infoWrapper_tv').show();
                    $infoPanel.find('div.infoWrapper_book').addClass('hidden');
                }
            } else {
                $infoPanel.find('div.infoWrapper_tv').show();
                $infoPanel.find('div.infoWrapper_book').addClass('hidden');
            }
        },
        epStatusClick: function(target) {
            var self = $(target)
              , ep_status = self.attr('id').split('_')[0]
              , ep_id = self.attr('id').split('_')[1]
              , ep_status_name = target.text
              , $formhash = self.attr('href').split('gh=')[1];
            if (EpBtn == 's') {
                _btn = '';
            } else {
                _btn = '';
            }
            var params = new Object();
            if (ep_status == 'WatchedTill' || ep_status == 'Watched') {
                var epLi = $('#prg_' + ep_id).parent();
                var epUlLis = epLi.parent().children();
                var epAs = epUlLis.children();
                var subject_id = epAs.attr('subject_id');
            }
            if (ep_status == 'WatchedTill') {
                var epLiIndex = epUlLis.index(epLi);
                var ids = new Array();
                for (var i = 0; i <= epLiIndex; i++) {
                    ids[i] = epAs[i].id.split('_')[1];
                }
                params['ep_id'] = ids.toString();
                if (EpBtn == 's' && OtherEps[subject_id] != undefined) {
                    params['ep_id'] = OtherEps[subject_id] + ',' + params['ep_id'];
                }
            }
            chiiLib.ukagaka.presentSpeech(AJAXtip['wait'] + '正在为你保存收视进度...');
            $.ajax({
                type: "POST",
                url: target + '&ajax=1',
                data: params,
                success: function(html) {
                    if (ep_status == 'remove') {
                        $('a#prg_' + ep_id).removeClass().addClass('load-epinfo').addClass(_btn + 'epBtnAir');
                        $('a#epBtnCu_' + ep_id).html('').removeClass('epBtnCu');
                    } else {
                        $('a#prg_' + ep_id).removeClass().addClass('load-epinfo').addClass(_btn + 'epBtn' + ep_status);
                        if (ep_status == 'WatchedTill') {
                            epAs.slice(0, epLiIndex + 1).filter(function(index) {
                                return $(this).attr('class').indexOf('epBtnDrop') == -1;
                            }).removeClass().addClass('load-epinfo').addClass(_btn + 'epBtnWatched');
                        }
                        if (ep_status == 'Watched' || ep_status == 'WatchedTill') {
                            if (epAs.filter('.' + _btn + 'epBtnWatched,.' + _btn + 'epBtnDrop').length == epUlLis.length) {
                                if (EpBtn == 's') {
                                    var sbj_href = $('#sbj_prg_' + subject_id).attr('href');
                                    sbj_href = sbj_href.replace('/update', '/collect');
                                    $('#sbj_prg_' + subject_id).attr('href', sbj_href);
                                    $('#sbj_prg_' + subject_id).trigger('click');
                                } else {
                                    $('#modifyCollect').trigger('click');
                                    $('#collect').attr('checked', 'checked');
                                }
                            }
                        }
                    }
                    if (ep_status == 'WatchedTill') {
                        chiiLib.ukagaka.presentSpeech('恭喜恭喜，你完成 1 - ' + $('#prg_' + ep_id).html() + ' 话咯～');
                        chiiLib.ukagaka.isDisplay(false, true, 2500);
                    } else {
                        chiiLib.ukagaka.presentEpComment(ep_id, ep_status_name, $formhash);
                    }
                },
                error: function(html) {
                    $("#robot_balloon").html(AJAXtip['error']);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                }
            });
        },
        prg: function() {
            $('#prgSubjectList').find('a.thumbTip').tooltip({
                offset: 40
            });
            $('#home_calendar').find('a.thumbTip').tooltip({
                offset: 40
            });
            $('#prgSubjectList').find('a.textTip').tooltip({
                offset: 0
            });
            $('#cloumnSubjectInfo').find('a.textTip').tooltip({
                offset: 0
            });
            $.ajaxSetup({
                cache: true
            });
            $.getScript("/min/g=prg", function() {
                setTimeout(function() {
                    var settings = {
                        verticalDragMinHeight: 20,
                        hideFocus: true
                    };
                    var pane = $('#listWrapper')
                    pane.jScrollPane(settings);
                    paneApi = pane.data('jsp');
                }, 100);
                $.ajaxSetup({
                    cache: false
                });
            });
            var selectors = $('#prgSubjectListSelector')
              , selector_item = selectors.find('a')
              , $list = $('#prgSubjectList')
              , $item = $list.find('a.subjectItem')
              , $infoPanel = $('#cloumnSubjectInfo')
              , $categoryTab = $('#prgCatrgoryFilter')
              , $tab = $categoryTab.find('a')
              , $modeTab = $('#prgManagerMode')
              , $mode = $modeTab.find('a')
              , $batchManagerForm = $infoPanel.find('form.prgBatchManagerForm')
              , $batchManagerBtnPlus = $infoPanel.find('a.input_plus')
              , $prgManagerMain = $('#prgManagerMain')
              , $epCheckIn = $prgManagerMain.find('a.prgCheckIn');
            $batchManagerForm.submit(function() {
                chiiLib.home.prgBatchManager($(this));
                return false;
            });
            $epCheckIn.click(function() {
                var $subject_id = $(this).attr('subject_id')
                  , $ep_id = $(this).attr('ep_id')
                  , $ep_prg_info_watched = $('#Watched_' + $ep_id);
                $ep_prg_info_watched.trigger('click');
                return false;
            });
            $batchManagerBtnPlus.click(function() {
                var $input = $(this).closest('div.prgText').find('input')
                  , $count = parseInt($input.val())
                  , $input_id = $input.attr('id')
                  , $subject_id = $input.attr($input_id)
                  , $form = $(this).closest('form.prgBatchManagerForm');
                var target_count = $count + 1;
                $('input[' + $input_id + '$=' + $subject_id + ']').val(target_count);
                $form.submit();
            });
            $item.click(function() {
                var subject_id = $(this).attr('subject_id');
                $infoPanel.find('div.info_show').removeClass('info_show').addClass('info_hidden');
                $('#subjectPanel_' + subject_id).removeClass('info_hidden').addClass('info_show');
                $('#cluetip').hide();
                return false;
            });
            $tab.click(function() {
                var type_id = $(this).attr('subject_type');
                $categoryTab.find('a').removeClass('focus');
                $(this).addClass('focus');
                if (type_id == 0) {
                    $list.find('li').removeClass('hidden');
                } else {
                    $list.find('li').addClass('hidden');
                    $list.find('li[subject_type$=' + type_id + ']').removeClass('hidden');
                }
                chiiLib.home.prgInitPanel();
                paneApi.reinitialise();
                return false;
            });
            selector_item.click(function() {
                var selector = $(this).attr('id')
                  , browserList = $('#prgSubjectList');
                selectors.find('a').removeClass();
                $(this).addClass('active');
                browserList.removeClass();
                if (selector == 'list_selector') {
                    $.cookie('prg_list_mode', 'list', {
                        expires: 2592000
                    });
                    browserList.addClass('list');
                } else if (selector == 'full_selector') {
                    $.cookie('prg_list_mode', 'full', {
                        expires: 2592000
                    });
                    browserList.addClass('full clearit');
                } else {
                    $.cookie('prg_list_mode', 'grid', {
                        expires: 2592000
                    });
                    browserList.addClass('grid clearit');
                }
                paneApi.reinitialise();
                return false;
            });
            $('#switchNormalManager').click(function() {
                if ($(this).hasClass('focus')) {
                    return false;
                }
                $('#cluetip').hide();
                $.cookie('prg_display_mode', 'normal', {
                    expires: 2592000
                });
                $(this).addClass('focus');
                $('#switchTinyManager').removeClass();
                $('div.cloumnSubjects').fadeIn(300);
                $('#listWrapper').show(0, function() {
                    paneApi.reinitialise();
                });
                $infoPanel.find('div.infoWrapper').addClass('info_hidden').removeClass('tinyMode').addClass('blockMode');
                $infoPanel.find('div.infoWrapper:first').hide().removeClass('info_hidden').addClass('info_show').fadeIn(300);
                $infoPanel.css('width', '475px');
                $prgManagerMain.css('height', '230px');
                $prgManagerMain.removeClass('tinyModeWrapper').addClass('blockModeWrapper');
                chiiLib.home.prgInitPanel();
                return false;
            });
            $('#switchTinyManager').click(function() {
                if ($(this).hasClass('focus')) {
                    return false;
                }
                $('#cluetip').hide();
                $.cookie('prg_display_mode', 'tiny', {
                    expires: 2592000
                });
                $(this).addClass('focus');
                $('#switchNormalManager').removeClass();
                $('div.cloumnSubjects').hide(0, function() {
                    $('#listWrapper').hide(0);
                    $infoPanel.find('div.infoWrapper').hide().removeClass('info_hidden').removeClass('blockMode').addClass('tinyMode').fadeIn();
                    $infoPanel.css('width', '100%');
                    $prgManagerMain.css('height', 'auto');
                    $prgManagerMain.removeClass('blockModeWrapper').addClass('tinyModeWrapper');
                    chiiLib.home.prgInitPanel();
                });
                return false;
            });
        },
        setPushNotifyEvents: function() {
            var isIE = navigator.appName.indexOf("Internet Explorer") > -1;
            var isOP = navigator.appName.indexOf("Opera") > -1;
            var isFF = navigator.userAgent.indexOf("fox") > -1;
            var isSF = navigator.userAgent.indexOf("Safari") > -1;
            if (isIE) {
                document.body.onfocus = function() {
                    chiiLib.home.togglePushNotify(true);
                }
                document.body.onblur = function() {
                    chiiLib.home.togglePushNotify(false);
                }
            } else if (isFF) {
                window.document.onfocus = function() {
                    chiiLib.home.togglePushNotify(true);
                }
                window.document.onblur = function() {
                    chiiLib.home.togglePushNotify(false);
                }
            } else if (isSF || isOP) {
                window.onblur = function() {
                    chiiLib.home.togglePushNotify(false);
                }
                window.onfocus = function() {
                    chiiLib.home.togglePushNotify(true);
                }
            } else {
                $(window).bind("blur", function() {
                    chiiLib.home.togglePushNotify(false);
                });
                $(window).bind("focus", function() {
                    chiiLib.home.togglePushNotify(true);
                });
            }
        },
        togglePushNotify: function(enable) {
            ENABLE_PUSH_NOTIFY = enable;
            if (ENABLE_PUSH_NOTIFY) {
                chiiLib.home.pushNotify();
            } else {
                if (typeof (PUSH_NOTIFY_TIMER) != "undefined") {
                    clearTimeout(PUSH_NOTIFY_TIMER);
                }
            }
        },
        simplePushNotify: function() {
            if (typeof (ENABLE_PUSH_NOTIFY) != "undefined") {
                if (ENABLE_PUSH_NOTIFY == true) {
                    var $list = $('#listFrame').contents();
                    $.ajax({
                        type: 'get',
                        dataType: 'json',
                        cache: false,
                        url: '/json/notify',
                        success: function(json) {
                            var count = json.count;
                            if (count > 0) {
                                $list.find('#simpleNotify').show().html('<a id="home_notify" href="/notify?keepThis=false&TB_iframe=true&height=300&width=550" title="电波提醒" class="thickbox_notify new_notify"><span id="notify_count">' + count + '</span> 条新提醒</a>');
                            } else {}
                        },
                        complete: function() {
                            $list.find('#simpleNotify > a.thickbox_notify').click(function() {
                                var t = this.title || this.name || null;
                                var a = this.href || this.alt;
                                var g = this.rel || false;
                                tb_show(t, a, g);
                                this.blur();
                                return false;
                            });
                            PUSH_NOTIFY_TIMER = setTimeout("chiiLib.home.simplePushNotify()", 20000);
                        },
                        error: function() {}
                    });
                }
            }
        },
        pushNotify: function() {
            if (typeof (ENABLE_PUSH_NOTIFY) != "undefined") {
                if (ENABLE_PUSH_NOTIFY == true) {
                    $.ajax({
                        type: 'get',
                        dataType: 'json',
                        cache: false,
                        url: '/json/notify',
                        success: function(json) {
                            var count = json.count;
                            if (count > 0) {
                                var $notifyURL = $('#notify_ignore_all').attr('href');
                                $("#robot").fadeIn(300);
                                $("#robot_speech").hide();
                                $("#robot_speech_js").show().html('<span class="rr"><a id="notify_ignore_all" href="' + $notifyURL + '">[知道了]</a></span> <a id="home_notify" href="/notify?keepThis=false&TB_iframe=true&height=300&width=550" title="电波提醒" class="thickbox_notify new_notify">哔啵哔啵～你有 <span id="notify_count">' + count + '</span> 条新提醒!</a>');
                            } else {}
                        },
                        complete: function() {
                            tb_init('a.thickbox_notify');
                            PUSH_NOTIFY_TIMER = setTimeout("chiiLib.home.pushNotify()", 20000);
                            chiiLib.home.ignoreAllNotify();
                        },
                        error: function() {
                            $("#robot").fadeIn(300);
                            $("#robot_balloon").html(AJAXtip['error']);
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        }
                    });
                }
            }
        },
        ignoreAllNotify: function() {
            $('#notify_ignore_all').click(function() {
                $.ajax({
                    type: "GET",
                    url: (this) + '&ajax=1',
                    success: function(html) {
                        $("#robot_speech").show();
                        $("#robot_speech_js").hide().html('已经没有新提醒咯');
                    },
                    error: function(html) {}
                });
                return false;
            });
        },
        prgToolTip: function(target, topOffset) {
            var _tipPrev = new Object();
            $(document).ready(function() {
                if ($.browser.msie) {
                    $(target).mousemove(function(e) {
                        if (e.target.tagName != 'A') {
                            return false;
                        }
                        if (_tipPrev == e.target) {
                            return false;
                        }
                        _tipPrev = e.target;
                        $(e.target).cluetip({
                            local: true,
                            dropShadow: false,
                            cursor: 'pointer',
                            sticky: true,
                            closePosition: 'title',
                            arrows: true,
                            closeText: 'X',
                            mouseOutClose: true,
                            positionBy: 'fixed',
                            cluezIndex: 79,
                            topOffset: topOffset,
                            leftOffset: 0,
                            onShow: function(ct, c) {
                                $('#cluetip-inner a.ep_status').bind('click', function(e) {
                                    chiiLib.home.epStatusClick(e.target);
                                    return false;
                                });
                            }
                        }).trigger('mouseover');
                        return false;
                    });
                } else {
                    $(target + ' a.load-epinfo').cluetip({
                        local: true,
                        dropShadow: false,
                        cursor: 'pointer',
                        sticky: true,
                        closePosition: 'title',
                        arrows: true,
                        closeText: 'X',
                        mouseOutClose: true,
                        positionBy: 'fixed',
                        topOffset: topOffset,
                        leftOffset: 0,
                        cluezIndex: 79
                    });
                    $('#subject_prg_content a.ep_status').click(function() {
                        chiiLib.home.epStatusClick(this);
                        return false;
                    });
                }
            });
        }
    },
    user: {
        currentSign: function(mode) {
            var _Sign = $('#current_sign').attr("value");
            if (_Sign == '' && mode == 'check') {
                return '(编辑个人签名)';
            } else {
                return _Sign;
            }
        },
        updateSign: function() {
            var $signInput = $("#q_sign_input");
            if ($('#q_update_sign')) {
                $signInput.addClass('pointer').text(chiiLib.user.currentSign('check'));
            }
            $signInput.click(function() {
                if ($signInput.hasClass('sign') != true) {
                    var signText = chiiLib.user.currentSign('input');
                    $signInput.html('<form id="signfrom" action="/update/user/sign" method="post"><input id="sign_input" name="sign_input" type="text" class="sign_input" value="" maxlength="30" /><input class="inputBtnSmall" value="修改" type="submit"> <a href="javascript:void(0)" id="cancelSign" class="l">x</a></form>');
                    $('#sign_input').val(signText);
                    $(this).removeClass('pointer').addClass('sign');
                    $("#sign_input").focus();
                    $('#signfrom').submit(function() {
                        var new_sign = $('#sign_input').attr('value')
                          , $currentSign = $('#current_sign');
                        $.ajax({
                            type: "POST",
                            url: "/update/user/sign?ajax=1",
                            data: ({
                                sign_input: new_sign
                            }),
                            dataType: 'text',
                            success: function(html) {
                                if (new_sign != "") {
                                    $signInput.addClass('pointer').removeClass('sign').fadeOut(300).fadeIn(100).text(new_sign);
                                    $currentSign.val(new_sign);
                                } else {
                                    $signInput.addClass('pointer').removeClass('sign').fadeOut(300).fadeIn(100).text('(编辑个人签名)');
                                    $currentSign.val('');
                                }
                            },
                            error: function(html) {
                                $("#robot").fadeIn(300);
                                $("#robot_balloon").html(AJAXtip['error']);
                                $("#robot").animate({
                                    opacity: 1
                                }, 1000).fadeOut(500);
                            }
                        });
                        return false;
                    });
                    $('#cancelSign').mousedown(function() {
                        $signInput.addClass('pointer').html(chiiLib.user.currentSign('check'));
                        $signInput.removeClass('sign');
                    });
                }
            });
        },
        badge: function() {
            var $badge = $("#idBadger")
              , $badgeUser = $badge.find('div.badgeUser')
              , $panel = $('#badgeUserPanel');
            $badgeUser.mouseover(function() {
                $panel.show();
            }).mouseleave(function() {
                $panel.hide();
            });
            chiiLib.user.updateSign();
        },
        profile: function() {
            $('#connectFrd').click(function() {
                $("#robot").fadeIn(500);
                $("#robot_balloon").html(AJAXtip['wait'] + AJAXtip['addingFrd']);
                $.ajax({
                    type: "GET",
                    url: this + '&ajax=1',
                    success: function(html) {
                        $('#connectFrd').hide();
                        $('#friend_flag').html('<small class="fade">/ 是我的好友</small>');
                        $("#robot_balloon").html(AJAXtip['addFrd']);
                        $("#robot").animate({
                            opacity: 1
                        }, 1000).fadeOut(500);
                    },
                    error: function(html) {
                        $("#robot_balloon").html(AJAXtip['error']);
                        $("#robot").animate({
                            opacity: 1
                        }, 1000).fadeOut(500);
                    }
                });
                return false;
            });
        }
    },
    blog: {
        addRelatedSubject: function() {
            $('#submit_related_subject').click(function() {
                var $add_rs = $('#add_related_subject')
                  , $subject_url = $add_rs.attr('value')
                  , $relate_list = $('#related_subject_list')
                  , $relate_value_list = $('#related_value_list');
                if ($subject_url != '') {
                    if (/\/subject\/(\d+)$/.test($subject_url)) {} else if (/^(\d+)$/.test($subject_url)) {}
                    var subject_id = RegExp.$1;
                    $.ajax({
                        type: "GET",
                        url: "/json/subject/" + subject_id,
                        dataType: 'json',
                        success: function(json) {
                            var n = $relate_list.find('li').length;
                            if (json.subject_id != "" && !$('#related_' + json.subject_id).length && n <= 4) {
                                if (json.subject_image != '') {
                                    var img = '<img src="/pic/cover/g/' + json.subject_image + '" class="avatar groupImage space ll">';
                                }
                                $relate_list.append('<li id="related_' + json.subject_id + '" class="clearit"><a id="related_del_' + json.subject_id + '" class="related_del" title="删除关联条目" href="javascript:void(0);">删除关联条目</a><a href="/subject/' + json.subject_id + '" title="' + json.subject_name + '" class="avatar ">' + img + '</a><div class="ll"><a href="/subject/' + json.subject_id + '" class="avatar">' + json.subject_name + '</a></div></li>');
                                $relate_value_list.append('<input id="related_value_' + json.subject_id + '" type="hidden" name="related_subject[]" value="' + json.subject_id + '" />');
                                $add_rs.val('');
                                chiiLib.blog.eraseRelatedSubject();
                            }
                        },
                        error: function(html) {
                            $("#robot").fadeIn(300);
                            $("#robot_balloon").html(AJAXtip['no_subject']);
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        }
                    });
                }
            });
        },
        eraseRelatedSubject: function() {
            $('a.related_del').click(function() {
                if (confirm('确认解除关联?')) {
                    var related_id = $(this).attr('id').split('_')[2];
                    $('#related_' + related_id).remove();
                    $('#related_value_' + related_id).remove();
                }
                return false;
            });
        },
        erasePhoto: function() {
            $('a.photo_del').click(function() {
                if (confirm('确认删除这张照片?')) {
                    var photo_id = $(this).attr('id').split('_')[2];
                    $('#upload_' + photo_id).remove();
                }
                return false;
            });
        },
        modify: function() {
            chiiLib.blog.addRelatedSubject();
            chiiLib.blog.eraseRelatedSubject();
            chiiLib.blog.erasePhoto();
            chiiLib.subject.mergeInputTag();
        },
        init: function() {}
    },
    tml_status: {
        init: function() {
            var $reply_form = $('#tml_reply_form_' + STATUS_ID);
            chiiLib.tml.commentsSubReply(STATUS_ID);
            $('#content_' + STATUS_ID).suggestBox({
                dataUrl: "/ajax/buddy_search"
            });
            $reply_form.submit(function() {
                chiiLib.tml.postComments(STATUS_ID, STATUS_URL);
                return false;
            });
        }
    },
    tml: {
        rm: function() {
            $("a.tml_del").hide();
            $(".tml_item").mouseover(function() {
                var tml_id = $(this).attr('id').split('_')[1];
                $('a.tml_del', this).show();
            }).mouseout(function() {
                $('a.tml_del', this).hide();
            });
            $('a.tml_del').click(function() {
                if (confirm('确认删除这条时间线？')) {
                    var tml_id = $(this).attr('id').split('_')[1];
                    $("#robot").fadeIn(500);
                    $("#robot_speech").hide();
                    $("#robot_speech_js").show().html('<img src="/img/loading_s.gif" height="10" width="10" /> 请稍候，正在删除时间线...');
                    $.ajax({
                        type: "GET",
                        url: this + '&ajax=1',
                        success: function(html) {
                            $('#tml_' + tml_id).fadeOut(500);
                            $("#robot_speech_js").html('你选择的时间线已经删除咯～');
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        },
                        error: function(html) {
                            $("#robot_speech_js").html(AJAXtip['error']);
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        }
                    });
                }
                return false;
            });
        },
        load: function(url, type, is_mobile) {
            var cur_url = ''
              , $content = $('#tmlContent');
            if (url == undefined) {
                cur_url = '/ajax/timeline?ajax=1';
            } else {
                cur_url = url + '&ajax=1';
            }
            if (type != undefined) {
                cur_url = '/ajax/timeline?type=' + type + '&ajax=1';
            }
            if (is_mobile != undefined) {
                cur_url = cur_url + '&mobile=1'
            }
            $content.html('<div class="loading"><img src="/img/loadingAnimation.gif" /></div>');
            $.ajax({
                type: "GET",
                url: cur_url,
                success: function(html) {
                    $content.html(html);
                    chiiLib.tml.prepareAjax();
                },
                error: function(html) {
                    $("#robot_speech_js").html(AJAXtip['error']);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                }
            });
        },
        tab_highlight: function(type) {
            var $list = $('#tmlTypeFilter')
              , $filter = $list.find('a');
            var $tabs = $('#timelineTabs')
              , $tab = $tabs.find('a');
            $tab.removeClass('focus');
            $filter.removeClass('on');
            switch (type) {
            default:
                $('#tab_all').addClass('focus');
                $('#filter_all').addClass('on');
                break;
            case 'say':
            case 'replies':
            case 'subject':
            case 'blog':
            case 'progress':
                $('#tab_' + type).addClass('focus');
                $('#filter_say').addClass('on');
                break;
            }
        },
        filter: function() {
            var $list = $('#tmlTypeFilter')
              , $filter = $list.find('a');
            var $tabs = $('#timelineTabs')
              , $tab = $tabs.find('a');
            $filter.click(function() {
                var $type = $(this).attr('id').split('_')[1]
                  , $link = $(this).attr('href');
                chiiLib.tml.tab_highlight($type);
                $filter.removeClass('on');
                $(this).addClass('on');
                chiiLib.tml.load($link);
                return false;
            });
            $tab.click(function() {
                var $type = $(this).attr('id').split('_')[1]
                  , $link = $(this).attr('href');
                $tab.removeClass('focus');
                chiiLib.tml.tab_highlight($type);
                chiiLib.tml.load($link);
                return false;
            });
        },
        pager: function() {
            var $pager = $('#tmlPager')
              , $page = $pager.find('a.p');
            $page.click(function() {
                var $href = $(this).attr('href').split('page=')[0]
                  , $type = $href.split('type=')[1];
                var $link = $(this).attr('href');
                var new_position = $('#columnTimelineInnerWrapper').offset();
                if (new_position != undefined) {
                    window.scrollTo(new_position.left, new_position.top);
                }
                chiiLib.tml.load($link);
                return false;
            });
        },
        updateStatus: function() {
            var $input = $('#SayInput');
            $input.suggestBox({
                dataUrl: "/ajax/buddy_search"
            });
            $('#SayFrom').submit(function() {
                var new_say = $input.val()
                  , $formhash = $(this).find('[name=formhash]').val()
                  , $is_mobile = $(this).find('[name=is_mobile]').val();
                if (new_say != '') {
                    submitTip();
                    $.ajax({
                        type: "POST",
                        url: "/update/user/say?ajax=1",
                        data: ({
                            say_input: new_say,
                            formhash: $formhash,
                            submit: 'submit'
                        }),
                        dataType: 'text',
                        success: function(html) {
                            $input.val('');
                            $('#submitBtnO').html('<input class="inputBtn" value="Update" name="submit" type="submit" />');
                            chiiLib.tml.tab_highlight('say');
                            chiiLib.tml.load('', 'say', $is_mobile);
                        },
                        error: function(html) {
                            $("#robot_speech_js").html(AJAXtip['error']);
                        }
                    });
                } else {
                    $input.animate({
                        marginLeft: "5px"
                    }, 50).animate({
                        marginLeft: "0",
                        marginRight: "5px"
                    }, 50).animate({
                        marginRight: "0",
                        marginLeft: "5px"
                    }, 50).animate({
                        marginLeft: "0",
                        marginRight: "5px"
                    }, 50);
                }
                return false;
            });
        },
        postComments: function(id, url) {
            var $form = $('#tml_reply_form_' + id)
              , $action = $form.attr('action')
              , $content = $('#content_' + id).val()
              , $formhash = $form.find('[name=formhash]').val();
            submitTip('#tml_reply_form_' + id);
            $.ajax({
                type: "POST",
                url: $action + '?ajax=1',
                data: ({
                    content: $content,
                    formhash: $formhash,
                    submit: 'submit'
                }),
                dataType: 'json',
                success: function(json) {
                    chiiLib.tml.loadComments(id, url);
                },
                error: function(html) {}
            });
        },
        commentsSubReply: function(id) {
            $reply_list = $('#tml_reply_' + id),
            $reply_item = $reply_list.find('li.reply_item'),
            $reply_to = $reply_list.find("a.cmt_reply");
            $reply_to.hide();
            $reply_item.mouseover(function() {
                $('a.cmt_reply', this).show();
            }).mouseout(function() {
                $('a.cmt_reply', this).hide();
            });
            $reply_to.click(function() {
                var replyTo = $(this).html()
                  , $textarea = $('#content_' + id)
                  , $inputContent = $textarea.val();
                $textarea.val($inputContent + replyTo + ' ').focus();
                return false;
            });
        },
        loadComments: function(id, url, callback) {
            var $item = $('#tml_' + id)
              , $placehold = $item.find('p.date');
            $.ajax({
                type: "GET",
                url: url + '?ajax=1',
                success: function(html) {
                    if (callback && typeof (callback) === "function") {
                        callback();
                    }
                    if ($('#tml_reply_' + id) != undefined) {
                        $('#tml_reply_' + id).remove();
                    }
                    $placehold.after(html);
                    var $subreply = $('#tml_reply_' + id)
                      , $reply_form = $('#tml_reply_form_' + id);
                    $subreply.find('a.closeReply').bind('click', function() {
                        $subreply.remove();
                    });
                    chiiLib.tml.commentsSubReply(id);
                    $('#content_' + id).suggestBox({
                        dataUrl: "/ajax/buddy_search"
                    });
                    $reply_form.submit(function() {
                        chiiLib.tml.postComments(id, url);
                        return false;
                    });
                },
                error: function(html) {
                    if (callback && typeof (callback) === "function") {
                        callback();
                    }
                    $("#robot_speech_js").html(AJAXtip['error']);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                }
            });
        },
        replyStatus: function() {
            var $tml_list = $('#timeline')
              , $tml_item = $tml_list.find('li.tml_item')
              , $tml_reply = $tml_list.find("a.tml_reply")
              , $tml_comment = $tml_list.find("a.tml_comment");
            $tml_reply.hide();
            $tml_item.mouseover(function() {
                $('a.tml_reply', this).show();
            }).mouseout(function() {
                $('a.tml_reply', this).hide();
            });
            $tml_reply.click(function() {
                var replyTo = $(this).html()
                  , $inputContent = $('#SayInput').val();
                $('#SayInput').val($inputContent + replyTo + ' ').focus();
                return false;
            });
            $tml_comment.click(function() {
                var id = $(this).attr('id').split('_')[1]
                  , url = $(this).attr('href')
                  , $loading = $(this).find('img')
                  , $loadingImg = $('<img />', {
                    'src': '/img/loading_s.gif',
                    'width': '10',
                    'height': '10'
                });
                $loading.remove();
                $(this).append($loadingImg);
                chiiLib.tml.loadComments(id, url, function() {
                    $loadingImg.remove();
                });
                return false;
            });
        },
        prepareAjax: function() {
            chiiLib.tml.rm();
            chiiLib.tml.pager();
            chiiLib.tml.replyStatus();
        },
        init: function() {
            chiiLib.tml.prepareAjax();
            chiiLib.tml.filter();
            chiiLib.tml.updateStatus();
        }
    },
    subject: {
        init: function() {
            chiiLib.home.prgToolTip('#subject_detail', 30);
            chiiLib.subject.mergeInputTag();
            $('a.thumbTip').tooltip({
                offset: 65
            });
            $('a.thumbTipSmall').tooltip({
                offset: 35
            });
            if ($('#subject_summary').height() < 250) {
                $('#show_summary').hide();
            }
            $('#show_summary').click(function() {
                if ($('#subject_summary').hasClass('subject_summary') != true) {
                    $(this).html('more...');
                    $("#subject_summary").removeClass('subject_summary_all').addClass('subject_summary').hide().fadeIn(500);
                } else {
                    $(this).html('X close');
                    $("#subject_summary").removeClass('subject_summary').addClass('subject_summary_all').hide().fadeIn(500);
                }
                $(this).blur();
            });
        },
        updateCollectBlock: function(subject_id, hash) {
            $block = $('#collectBlock_' + subject_id);
            $block.html('<p class="collectModify"><a href="/update/' + subject_id + '?keepThis=false&TB_iframe=true&height=350&width=500" title="修改收藏"  class="thickbox l">修改</a> | <a href="#;" onclick="eraseSubjectCollect(' + subject_id + ', \'' + hash + '\')" class="l">删除</a></p>');
            tb_init($block.find('a.thickbox'));
        },
        browser: function() {
            $(document).ready(function() {
                chiiLib.airTimeMenu.init();
            });
        },
        addTag: function(tag) {
            $("#tags").val($("#tags").val() + " " + tag + " ");
            chiiLib.subject.mergeTag();
        },
        mergeTag: function() {
            input_tag = "";
            cur_tags = new Array();
            tags = $.trim($("#tags").val()).split(" ");
            for (i = 0; i < tags.length; i++) {
                if ($.trim(tags[i]) != "") {
                    if ($.inArray(tags[i], cur_tags) == -1) {
                        cur_tags[i] = tags[i];
                        input_tag = input_tag + " " + tags[i];
                    }
                }
            }
            $("#tags").val(input_tag + " ");
        },
        mergeInputTag: function() {
            $("#tags").keyup(function(event) {
                if (event.keyCode == 32) {
                    chiiLib.subject.mergeTag();
                }
            });
        }
    },
    airTimeMenu: {
        settings: {
            'target': $("#airTimeMenu > li.airYear"),
            'yearTestRegex': /(\d{4})$/
        },
        init: function() {
            var ul = chiiLib.airTimeMenu.settings.target;
            if (ul.html() == null) {
                return;
            }
            var anchors = ul.find("a");
            var increased = 0;
            var tmoutMoveHandle;
            var tmoutOutHandle;
            chiiLib.airTimeMenu.closeFuture(anchors);
            ul.mouseout(function(event) {
                clearTimeout(tmoutMoveHandle);
                clearTimeout(tmoutOutHandle);
                tmoutOutHandle = chiiLib.airTimeMenu.tmoutEventOut();
                return false;
            });
            ul.mousemove(function(event) {
                clearTimeout(tmoutOutHandle);
                clearTimeout(tmoutMoveHandle);
                tmoutMoveHandle = chiiLib.airTimeMenu.tmoutEventMove(this);
                return false;
            });
            $("#pastAirTime").click(function(event) {
                chiiLib.airTimeMenu.updateYearAnchors('-', increased, ul, anchors);
                return false;
            });
            $("#futureAirTime").click(function(event) {
                chiiLib.airTimeMenu.updateYearAnchors('+', increased, ul, anchors);
                return false;
            });
        },
        tmoutEventMove: function(target) {
            return setTimeout(function() {
                var self = $(target);
                if (self.children().is('ul')) {
                    return false;
                }
                var prevUl = $('#airMonthMenu');
                prevUl.attr('id', 'airMonthMenuPrev');
                var ul = $("<ul>").attr('id', 'airMonthMenu');
                var baseUrl = self.find('a').attr('href');
                for (var i = 1; i < 13; i++) {
                    ul.append($("<li>").append($("<a>").text(i + '月').attr('href', baseUrl + '-' + i)));
                }
                ul.hide();
                self.append(ul);
                self.find('> a').addClass('focus')
                ul.fadeIn(50);
                prevUl.parent().find('> a').removeClass('focus');
                prevUl.fadeOut('fast', 'swing', function() {
                    prevUl.remove();
                });
            }, 5);
        },
        tmoutEventOut: function() {
            return setTimeout(function() {
                $menu = $('#airMonthMenu');
                $menu.fadeOut('fast', 'swing', function() {
                    $menu.parent().find('> a').removeClass('focus');
                    $menu.remove();
                }, 'fast');
            }, 10);
        },
        closeFuture: function(anchors) {
            var url = anchors[0].href;
            var date = new Date();
            var yearTestRegex = chiiLib.airTimeMenu.settings.yearTestRegex;
            yearTestRegex.test(url);
            if (RegExp.$1 >= date.getFullYear()) {} else {
                var ul = chiiLib.airTimeMenu.settings.target;
                increased = -parseInt((date.getFullYear() - RegExp.$1) / ul.length);
            }
        },
        updateYearAnchors: function(sign, increased, ul, anchors) {
            var url = '';
            var newYear = 0;
            var year = 0;
            sign == '+' ? increased++ : increased--;
            date = new Date();
            if (increased < 0) {
                $("#futureAirTime").css('visibility', 'visible');
            } else if (increased == 0) {
                $("#futureAirTime").css('visibility', 'hidden');
            }
            anchRoll = function(num) {
                var yearTestRegex = chiiLib.airTimeMenu.settings.yearTestRegex;
                increment = parseInt(sign + 1);
                for (var i = 0; i < ul.length; i++) {
                    url = anchors[i].href;
                    yearTestRegex.test(url);
                    year = RegExp.$1;
                    newYear = eval(parseInt(year) + increment);
                    url = url.replace(/\d{4}$/, eval(newYear));
                    anchors[i].href = url;
                    anchors[i].innerHTML = anchors[i].innerHTML.replace(/^\d{4}/, newYear);
                }
                if (--num == 0) {
                    return;
                } else {
                    setTimeout('anchRoll( ' + num + ');', 40);
                }
            }
            anchRoll(ul.length);
        }
    },
    wiki: {
        init: function() {
            chiiLib.doujinHome.setTab('#latestEntryTab', '#latestEntryMainTab', 'ul');
            chiiLib.doujinHome.setTab('#emptyEntryTab', '#emptyEntryMainTab', 'ul');
            chiiLib.doujinHome.setTab('#wikiEntryTab', '#wikiEntryMainTab', 'ul');
        }
    },
    user_index: {
        init: function() {
            $("a.ico_del").hide();
            $(".tml_item").mouseover(function() {
                $('a.ico_del', this).show();
            }).mouseout(function() {
                $('a.ico_del', this).hide();
            });
            removeListItem('a.idx_clt_del', '#item_', '确认取消收藏该目录？', '取消收藏', '你选择的目录收藏已经解除咯～');
        },
        manage: function() {
            $('a.tb_idx_rlt').click(function() {
                var $rlt_id = $(this).attr('id').split('_')[1]
                  , $order = $(this).attr('order')
                  , $content = $(this).parent().parent().find('div.text').text().trim();
                $('#ModifyRelatedForm').attr('action', '/index/related/' + $rlt_id + '/modify');
                $('#modify_order').attr('value', $order);
                $('#modify_content').attr('value', $content);
                return false;
            });
            $('a.erase_idx_rlt').click(function() {
                if (confirm('确认删除该关联条目？')) {
                    var tml_id = $(this).attr('id').split('_')[1];
                    $("#robot").fadeIn(500);
                    $("#robot_speech").hide();
                    $("#robot_speech_js").show().html('<img src="/img/loading_s.gif" height="10" width="10" /> 请稍候，正在删除关联条目...');
                    $.ajax({
                        type: "GET",
                        url: this + '&ajax=1',
                        success: function(html) {
                            $('#item_' + tml_id).fadeOut(500);
                            $("#robot_speech_js").html('你选择的关联条目经删除咯～');
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                            setTimeout(function() {
                                $("#robot_speech_js").hide(300);
                                $("#robot_speech").show(300);
                            }, 1500);
                        },
                        error: function(html) {
                            $("#robot_speech_js").html(AJAXtip['error']);
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        }
                    });
                }
                return false;
            });
        }
    },
    club: {
        init: function() {
            var list = $('#followManage').find('a[href$=follow],a[href$=unfollow]');
            $(list).click(function() {
                submitPost(this.href, 'action', 'follow-unfollow');
                return false;
            });
        }
    },
    search: {
        initSearchText: function(b) {
            var value = $(b).attr('value')
              , title = $(b).attr('title');
            if (!value || value == title) {
                $(b).addClass("tipInput");
                $(b).attr('value', title);
            }
            $(b).focus(function() {
                $(b).removeClass("tipInput");
                if ($(b).attr('value') == title) {
                    $(b).attr('value', '');
                }
            });
            $(b).blur(function() {
                if (!$(b).attr('value')) {
                    $(b).addClass("tipInput");
                    $(b).attr('value', title);
                }
            })
        }
    },
    doujinHome: {
        setTab: function(list_id, wrapper_id, wrapper_find) {
            var $tab = $(list_id).find('a.switchTab')
              , $wrapper = $(wrapper_id);
            $wrapper.find(wrapper_find).hide();
            $wrapper.find(wrapper_find + ':first-child').show();
            $tab.click(function() {
                var tab_id = $(this).attr('id').split('_')[1];
                $tab.removeClass('focus');
                $(this).addClass('focus');
                $.each($wrapper.find(wrapper_find), function() {
                    var ul_id = $(this).attr('id').split('_')[1];
                    if (ul_id == tab_id) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            });
        },
        init: function() {
            $("#hideDoujinGuide").click(function() {
                $("#doujinGuide").slideUp(600);
                $.cookie('doujin_guide', 'hide', {
                    expires: 2592000,
                    path: '/'
                });
            });
            chiiLib.login.init();
            chiiLib.doujinHome.setTab('#orginalTab', '#orginalMainTab', 'ul');
            chiiLib.doujinHome.setTab('#incomingTab', '#incomingMainTab', 'ul');
            chiiLib.doujinHome.setTab('#focusTab', '#focusMainTab', 'ul');
            chiiLib.search.initSearchText('#searchText');
        }
    },
    doujinCreate: {
        init: function() {
            $.getScript("/min/g=doujin_tag", false, true);
            chiiLib.subject.mergeInputTag();
        }
    },
    doujinRelated: {
        init: function() {}
    },
    doujinCollect: {
        init: function() {
            $('a.manageDoujinCollect').click(function(e) {
                chiiLib.doujinCollect.manage(this);
                return false;
            });
        },
        manage: function(target) {
            var self = $(target);
            var type = self.attr('id').split('_')[1]
              , subject_id = self.attr('id').split('_')[2];
            var hash = self.attr('href').split('gh=')[1];
            var loadingAlert = ''
              , successAlert = '';
            if ($('#robot').css('display') == 'none') {
                $("#robot").fadeIn(300);
            }
            $("#robot_speech").hide();
            if (type == 'add') {
                loadingAlert = AJAXtip['addingDoujinCollect'];
                successAlert = '收藏成功咯～';
            } else {
                loadingAlert = AJAXtip['rmDoujinCollect'];
                successAlert = '取消收藏成功咯～';
            }
            $("#robot_speech_js").hide().html(AJAXtip['wait'] + loadingAlert).slideDown();
            $.ajax({
                type: "GET",
                url: target + '&ajax=1',
                success: function(html) {
                    if (type == 'add') {
                        $("#collect_wrapper_" + subject_id).html('<a href="/subject/' + subject_id + '/erase_collect?gh=' + hash + '" class="l">取消收藏</a>');
                    } else {
                        $("#collect_wrapper_" + subject_id).html('<a id="collect_add_' + subject_id + '" href="/subject/' + subject_id + '/collect?gh=' + hash + '" class="manageDoujinCollect chiiBtn"><span>收藏</span></a> ');
                    }
                    $("#robot_speech_js").html(successAlert);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                    setTimeout(function() {
                        $("#robot_speech_js").hide(300);
                        $("#robot_speech").show(300);
                    }, 1500);
                },
                error: function(html) {
                    $("#robot_speech_js").html(AJAXtip['error']);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                }
            });
        }
    },
    style_design: {
        setTheme: function(themeID) {
            hasCustomBackgroundImage = false;
            var C = themes[themeID];
            $("#club_background_tile").attr("checked", C.tiled);
            $("#current_background span").css("backgroundImage", "url('" + C.swatch + "')");
            $.each(designDefault, function() {
                $("#club_" + this).val(C[this]).css("background-color");
                $("#club_" + this + "_box").css("background-color", C[this])
            });
            $("#themes").attr("class", "theme" + themeID);
            currentImage = C.image;
            chiiLib.style_design.setBackgroundImage(C.image, C.tiled);
            if (C.image != "none") {
                $("#current_background").addClass("active");
            } else {
                $("#no_background").addClass("active");
            }
            $("#club_theme_default").val(true);
            $("#club_theme").val(themeID);
        },
        isDefaultDesign: function() {
            var D = themes[$("#club_theme").val()];
            if ($("#club_use_background_image").val() == "false" || $("#club_background_tile").attr("checked") != D.tiled || hasCustomBackgroundImage) {
                return false;
            }
            var C = true;
            $.each(designDefault, function() {
                if ($("#club_" + this).val() != D[this]) {
                    alert('no');
                    C = false;
                }
            });
            if (!C) {
                return false;
            }
            return true
        },
        validateDefaultDesign: function() {
            $("#club_theme_default").val(chiiLib.style_design.isDefaultDesign());
            return false;
        },
        updateColors: function() {
            var $menu = $('div.clubMenu')
              , $a = $('a.l');
            ;var background_color = $("#club_background_color").val();
            var header_background_color = $("#club_header_background_color").val();
            var text_color = $("#club_text_color").val();
            var link_color = $("#club_link_color").val();
            var header_text_color = $("#club_header_text_color").val();
            var nav_link_color = $("#club_nav_link_color").val();
            var nav_color = $("#club_nav_color").val();
            $("body").css({
                "background-color": background_color,
                color: text_color
            });
            $("#header").css({
                "background-color": header_background_color,
                color: text_color
            });
            $a.css('color', link_color);
            $menu.find('ul li a').css('background-color', nav_color);
            $menu.find('ul li a').css('color', nav_link_color);
            $('h3.sectionTitle').css('color', header_text_color);
            $('#subHeader').find("h2").css('color', header_text_color);
            if ($("#backgrounds").css("display") != "none") {
                $("#current_tab").val("backgrounds")
            } else {
                if ($("#colors").css("display") != "none") {
                    $("#current_tab").val("colors")
                } else {
                    $("#current_tab").val("none")
                }
            }
        },
        setBackgroundImage: function(C, D) {
            if ((D === true) || (D === false)) {
                D = D
            } else {
                if ($("#club_background_tile:checked").val()) {
                    D = true
                } else {
                    D = false
                }
            }
            $("#club_use_background_image").val(C == "none" ? "false" : "true");
            $("body").css({
                "background-image": C == "none" ? "none" : "url('" + C + "')",
                "background-repeat": D ? "repeat" : "no-repeat",
                "background-attachment": D ? "scroll" : "fixed"
            });
            $("#club_background_image").val(C)
        },
        switchDesignTab: function(id) {
            var $bg = $("#modifyBgSection")
              , $header = $("#modifyHeaderSection");
            switch (id) {
            case 'modifyBG':
                $bg.show();
                $header.hide();
                break;
            case 'modifyHeader':
                $bg.hide();
                $header.show();
                break;
            }
            ;
        },
        init: function() {
            $("#themes a").click(function() {
                var theme_id = $(this).attr("id");
                chiiLib.style_design.setTheme(theme_id.substring(5));
                return false
            });
            $("#designForm a").click(chiiLib.style_design.updateColors);
            $("#modifyBgSection").hide();
            $("#modifyHeaderSection").hide();
            $("a.designTab").click(function() {
                var $cur = $(this).attr("id");
                chiiLib.style_design.switchDesignTab($cur);
            });
            $("#club_background_tile").click(function() {
                var E = $("#club_background_tile:checked").val();
                $("body").css({
                    "background-repeat": E ? "repeat" : "no-repeat",
                    "background-attachment": E ? "scroll" : "fixed"
                });
            });
            $("#club_background_center").click(function() {
                var E = $("#club_background_center:checked").val();
                $("body").css({
                    "background-position": E ? "50% 0" : "0 0"
                });
            });
        }
    },
    notify: {
        init: function() {
            var $nt_list = $('#comment_list')
              , $nt_item = $nt_list.find('div.tml_item')
              , $nt_link = $nt_list.find('a.nt_link')
              , $nt_del = $nt_list.find("a.nt_del")
              , $nt_del_all = $("#del_all")
              , $nt_hash = $nt_del_all.attr('href').split('gh=')[1]
              , $nt_del_notify = $nt_list.find('a.nt_del_notify')
              , $nt_confirm_notify = $nt_list.find('a.nt_confirm_notify')
              , $cur_count = self.parent.$('#notify_count').html()
              , $window = self.parent;
            var updateNotifyCount = function(count) {
                updateNotifyCount(count, 1);
            }
            var getNotifyCount = function(nt_id) {
                var $item = $('.notify_' + nt_id);
                var count = 0;
                if ($item.find('a.merge_count').length) {
                    var count = $item.find('a.merge_count').find('span').text();
                } else {
                    var count = $item.length;
                }
                var total_count = parseInt(count);
                return total_count;
            }
            var updateNotifyCount = function(count, auto_remove) {
                var new_count = parseInt($cur_count - count);
                if (new_count <= 0) {
                    $window.$('#home_notify').removeClass('new_notify').removeClass('notify');
                    if (auto_remove == 1) {
                        $window.tb_remove();
                    }
                    $window.$("#robot_speech_js").html('已经没有新提醒咯');
                    $window.$("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                } else {
                    $window.$('#notify_count').html(new_count);
                }
            }
            $nt_link.click(function() {
                var nt_id = $(this).attr('class').split('_')[2];
                var count = getNotifyCount(nt_id);
                $.ajax({
                    type: "GET",
                    url: '/erase/notify/' + nt_id + '?gh=' + $nt_hash + '&ajax=1',
                    success: function(html) {
                        $('#notify_' + nt_id).fadeOut(300);
                        updateNotifyCount(count, 1);
                    },
                    error: function(html) {}
                });
            });
            $nt_del.click(function() {
                var nt_id = $(this).attr('id').split('_')[1];
                var count = getNotifyCount(nt_id);
                $.ajax({
                    type: "GET",
                    url: (this) + '&ajax=1',
                    success: function(html) {
                        $('#notify_' + nt_id).fadeOut(300);
                        updateNotifyCount(count, 1);
                    },
                    error: function(html) {}
                });
                return false;
            });
            $nt_del_all.click(function() {
                $.ajax({
                    type: "GET",
                    url: (this) + '&ajax=1',
                    success: function(html) {
                        $('#comment_list').fadeOut(300);
                        updateNotifyCount($cur_count, 1);
                    },
                    error: function(html) {}
                });
                return false;
            });
            $nt_del_notify.click(function() {
                var nt_id = $(this).attr('id').split('_')[1];
                var count = $('.notify_' + nt_id).length;
                $.ajax({
                    type: "GET",
                    url: (this) + '&ajax=1',
                    success: function(html) {
                        $('.notify_' + nt_id).fadeOut(300);
                        updateNotifyCount(count, 1);
                    },
                    error: function(html) {}
                });
                return false;
            });
            $nt_confirm_notify.click(function() {
                var nt_id = $(this).attr('id').split('_')[1];
                var count = $('.notify_' + nt_id).length;
                $.ajax({
                    type: "GET",
                    url: (this) + '&ajax=1',
                    success: function(html) {
                        $('.notify_' + nt_id).find('div.reply_content').html('已成为你的好友');
                        $('.notify_' + nt_id).find('div.frd_connect').fadeOut(300);
                        updateNotifyCount(count, 0);
                    },
                    error: function(html) {}
                });
                return false;
            });
        }
    },
    rakuen_frame: {
        init: function() {
            if (CHOBITS_UID > 0) {
                chiiLib.home.togglePushNotify(true);
                chiiLib.home.ignoreAllNotify();
                window.setInterval(function() {
                    $("#robot_speech_js > a.new_notify").toggleClass('notify');
                }, 800);
            }
        }
    },
    rakuen_new_topic: {
        init: function() {
            chiiLib.doujinHome.setTab('#topicTab', '#topicTabMain', 'div');
        }
    },
    rakuen_topic_list: {
        init: function() {}
    },
    topic_history: {
        init: function() {
            var current;
            var pre;
            function highlight(elemId) {
                pre = elemId;
                var elem = $(elemId);
                elem.addClass("reply_highlight");
            }
            if (document.location.hash) {
                highlight(document.location.hash);
            }
            var isIE6 = $.browser.msie && parseFloat($.browser.version) < 7;
            if (isIE6) {
                $('#sliderContainer').hide();
            } else {
                $.ajaxSetup({
                    cache: true
                });
                $.getScript("/min/g=ui", function() {
                    setTimeout(function() {
                        var positions = playback.split(',');
                        var lastVal;
                        $(document).ready(function() {
                            lastVal = totHistory;
                            $("#slider").slider({
                                value: totHistory,
                                min: 1,
                                max: totHistory,
                                animate: true,
                                slide: function(event, ui) {
                                    if (lastVal > ui.value) {
                                        $(buildQ(lastVal, ui.value)).hide('fast').find('.subreply_textarea').remove();
                                        var query = '#post_' + positions[ui.value];
                                    } else if (lastVal < ui.value) {
                                        $(buildQ(lastVal, ui.value)).show('fast');
                                        var query = '#post_' + positions[ui.value - 1];
                                    }
                                    lastVal = ui.value;
                                    window.scrollTo(0, $(query).offset().top);
                                }
                            });
                        });
                        function buildQ(from, to) {
                            if (from > to) {
                                var tmp = to;
                                to = from;
                                from = tmp;
                            }
                            from++;
                            to++;
                            var query = '';
                            $(pre).removeClass('reply_highlight');
                            for (var i = from; i < to; i++) {
                                if (i != from)
                                    query += ',';
                                query += '#post_' + positions[i - 1];
                                if (from > to) {
                                    current = '#post_' + positions[i - 2];
                                    pre = '#post_' + positions[i - 1];
                                } else {
                                    current = '#post_' + positions[i - 1];
                                    pre = '#post_' + positions[i - 2];
                                }
                                $(pre).removeClass('reply_highlight');
                                $(current).addClass('reply_highlight');
                            }
                            return query;
                        }
                        $(function() {
                            var top = $('#sliderContainer').offset().top
                              , width = $('#sliderContainer').width();
                            $(window).scroll(function() {
                                $(document).scrollTop() > top ? $('#sliderContainer').addClass('sticky').css('width', width) : $('#sliderContainer').removeClass('sticky').css('width', 'auto');
                            });
                        });
                        $('a.floor-anchor').click(function() {
                            $(pre).removeClass('reply_highlight');
                            $(current).removeClass('reply_highlight');
                            var id = $(this).attr('href');
                            pre = id;
                            $(id).addClass('reply_highlight');
                        });
                    }, 100);
                    $.ajaxSetup({
                        cache: false
                    });
                });
            }
        }
    },
    event_location_choose: {
        init: function() {
            var city = $('#geo-city');
            var state = $('#geo-state');
            state.change(function() {
                city.empty();
                var stateCode = state.children('option:selected').val();
                $.ajax({
                    type: "GET",
                    url: '/ajax/geo-city/' + stateCode,
                    dataType: 'json',
                    success: function(cityList) {
                        city.empty();
                        for (var cityCode in cityList) {
                            city.append('<option value="' + cityCode + '">' + cityList[cityCode] + '</option>');
                        }
                    },
                    error: function(html) {}
                });
            });
        }
    },
    event_view: {
        init: function() {
            if ($('#eventDesc').height() < 250) {
                $('#showEventSummary').hide();
            }
            $('#showEventSummary').click(function() {
                if ($('#eventDesc').hasClass('eventSummary') != true) {
                    $(this).html('显示全部...');
                    $("#eventDesc").removeClass('eventSummaryAll').addClass('eventSummary').hide().fadeIn(500);
                } else {
                    $(this).html('X 收起');
                    $("#eventDesc").removeClass('eventSummary').addClass('eventSummaryAll').hide().fadeIn(500);
                }
                $(this).blur();
            });
        }
    },
    ajax_reply: {
        insertMainComments: function(list_id, json) {
            if (json.posts.main) {
                var posts = json.posts.main
                  , html = ''
                  , $list = $(list_id);
                var bg_class = ($list.find('div.row_reply:last').hasClass('light_odd')) ? 'light_odd' : 'light_even';
                for (var i in posts) {
                    if ($('#post_' + i).length == 0) {
                        var bg_class = (bg_class == 'light_even') ? 'light_odd' : 'light_even';
                        var topic_tool = '';
                        html += '<div id="post_' + posts[i].pst_id + '" class="' + bg_class + ' row_reply clearit"><div class="re_info"><small>' + posts[i].dateline + topic_tool + '</small></div><a href="' + SITE_URL + '/user/' + posts[i].username + '" class="avatar"><img src="' + posts[i].avatar + '" class="avatar ll" align="absmiddle"></a><div class="inner"><strong><a href="' + SITE_URL + '/user/' + posts[i].username + '" class="l post_author_' + posts[i].pst_id + '">' + posts[i].nickname + '</a></strong><span class="tip_j">' + posts[i].sign + '</span><div class="reply_content"><div class="message">' + posts[i].pst_content + '</div></div></div></div>';
                    }
                }
                if (html != '') {
                    if (typeof (REPLY_PREPEND) != "undefined") {
                        $(html).hide().prependTo(list_id).fadeIn();
                    } else {
                        $(html).hide().appendTo(list_id).fadeIn();
                    }
                }
            }
        },
        insertSubComments: function(list_id, json) {
            if (json.posts.sub) {
                var posts = json.posts.sub
                  , $list = $(list_id);
                $.each(posts, function(post_id, sub_posts) {
                    if (sub_posts) {
                        var $post = $('#post_' + post_id)
                          , $main_post = $post.find('div.message');
                        if (!$('#topic_reply_' + post_id).length) {
                            $main_post.after('<div id="topic_reply_' + post_id + '" class="topic_sub_reply"></div>');
                        }
                        var html = '';
                        $.each(sub_posts, function(key, val) {
                            if ($('#post_' + val.pst_id).length == 0) {
                                html += '<div id="post_' + val.pst_id + '" class="sub_reply_bg clearit"><div class="re_info"><small>' + val.dateline + '</small></div><a href="' + SITE_URL + '/user/' + val.username + '" class="avatar"><img src="' + val.avatar + '" class="avatar ll" align="absmiddle"></a><div class="inner"><strong class="userName"><a id="70110" href="' + SITE_URL + '/user/' + val.username + '" class="l">' + val.nickname + '</a></strong><div class="cmt_sub_content">' + val.pst_content + '</div></div></div>';
                            }
                        });
                        if (html != '') {
                            $(html).hide().appendTo('#topic_reply_' + post_id).fadeIn();
                        }
                    }
                });
            }
        },
        insertJsonComments: function(list_id, json) {
            chiiLib.ajax_reply.insertMainComments(list_id, json);
            chiiLib.ajax_reply.insertSubComments(list_id, json);
        },
        updateLastView: function(element) {
            var cur_timestamp = Math.round((new Date()).getTime() / 1000);
            element.val(cur_timestamp);
        },
        subReply: function(type, topic_id, post_id, sub_reply_id, sub_reply_uid, post_uid, sub_post_type) {
            var $post = $('#post_' + post_id)
              , $main_post = $post.find('div.message')
              , $last_sub_reply = $post.find('div.topic_sub_reply')
              , $sub_reply = $('#post_' + sub_reply_id)
              , $mainForm = $('#ReplyForm')
              , $form_action = $mainForm.attr('action')
              , $lastview_timestamp = $mainForm.find('[name=lastview]')
              , $formhash = $mainForm.find('[name=formhash]').val();
            if (sub_post_type == 0) {
                var $reply_to = $post.find('a.post_author_' + post_id + ' ').html();
            } else {
                var $reply_to = $post.find('a#' + sub_reply_id).html();
                var $reply_to_content = $sub_reply.find('div.cmt_sub_content').html().replace(/<div class="quote">([^^]*?)<\/div>/, '').replace(/<\/?[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\B@([^\W_][\w]*)\b/g, '＠$1');
                if ($reply_to_content.length > 100) {
                    $reply_to_content = $reply_to_content.slice(0, 100) + '...';
                }
            }
            var reply_textarea = '<div class="subreply_textarea"><span class="tip_j">回复: ' + $reply_to + '</span><form id="ReplysForm" name="new_comment" method="post" action="' + $form_action + '"><input type="hidden" name="sub_reply_uid" value="' + sub_reply_uid + '" /><input type="hidden" name="topic_id" value="' + topic_id + '" /><input type="hidden" name="post_uid" value="' + post_uid + '" /><input type="hidden" name="post_id" value="' + post_id + '" /><textarea id="content_' + post_id + '" class="reply sub_reply" name="content" cols="45" rows="6" onkeydown="seditor_ctlent(event,\'ReplysForm\');" ></textarea><div id="submitBtnO"><input class="inputBtn" value="写好了" name="submit" type="submit">&nbsp;&nbsp;<a href="javascript:void(0);" onclick="subReplycancel()">取消</a></div></form></div>';
            $('div.subreply_textarea').remove();
            if (sub_post_type == '0') {
                $main_post.after(reply_textarea);
                $('#content_' + post_id).focus();
            } else {
                $last_sub_reply.after(reply_textarea);
                $('#content_' + post_id).focus();
            }
            $('#content_' + post_id).suggestBox({
                dataUrl: "/ajax/buddy_search"
            });
            $('#ReplysForm').submit(function() {
                var sub_reply_uid = $(this).find('[name=sub_reply_uid]').val()
                  , topic_id = $(this).find('[name=topic_id]').val()
                  , post_uid = $(this).find('[name=post_uid]').val()
                  , post_id = $(this).find('[name=post_id]').val()
                  , content = $(this).find('[name=content]').val()
                  , related_photo = $('#related_photo').val()
                  , $author = $('span.reply_author').html()
                  , $avatar = $('span.reply_avatar').html();
                if ($reply_to_content == undefined) {
                    var post_content = content;
                } else {
                    var post_content = '[quote][b]' + $reply_to + '[/b] 说: ' + $reply_to_content + '[/quote]\n' + content;
                }
                if (content != '') {
                    submitTip('#ReplysForm');
                    if (related_photo == undefined) {
                        related_photo = 0;
                    }
                    $.ajax({
                        type: "POST",
                        url: $form_action + '?ajax=1',
                        data: ({
                            topic_id: topic_id,
                            related: post_id,
                            sub_reply_uid: sub_reply_uid,
                            post_uid: post_uid,
                            content: post_content,
                            related_photo: related_photo,
                            lastview: $lastview_timestamp.val(),
                            formhash: $formhash,
                            submit: 'submit'
                        }),
                        dataType: 'json',
                        success: function(json) {
                            $('div.subreply_textarea').remove();
                            chiiLib.ajax_reply.insertJsonComments('#comment_list', json);
                            $lastview_timestamp.val(json.timestamp);
                        },
                        error: function(html) {}
                    });
                } else {
                    $("textarea.sub_reply").animate({
                        marginLeft: "5px"
                    }, 50).animate({
                        marginLeft: "0",
                        marginRight: "5px"
                    }, 50).animate({
                        marginRight: "0",
                        marginLeft: "5px"
                    }, 50).animate({
                        marginLeft: "0",
                        marginRight: "5px"
                    }, 50);
                }
                return false;
            });
        },
        collapseReplies: function() {
            if (typeof (COLLAPSE_REPLIES) != "undefined") {
                var $item = $('div.sub_reply_bg');
                $item.each(function() {
                    $text = $(this).find('div.cmt_sub_content').text();
                    if (/(\+|\-|\＋)\d+$/.test($text)) {
                        $(this).addClass('sub_reply_collapse');
                        $(this).click(function() {
                            $(this).removeClass('sub_reply_collapse');
                            $(this).unbind('click');
                        });
                    }
                });
            }
        },
        mainReply: function() {
            chiiLib.ajax_reply.collapseReplies();
            $('a.erase_post').click(function() {
                if (confirm(AJAXtip['eraseReplyConfirm'])) {
                    var post_id = $(this).attr('id').split('_')[1];
                    $("#robot").fadeIn(500);
                    $("#robot_balloon").html(AJAXtip['wait'] + AJAXtip['eraseingReply']);
                    $.ajax({
                        type: "GET",
                        url: (this) + '&ajax=1',
                        success: function(html) {
                            $('#post_' + post_id).fadeOut(500);
                            $("#robot_balloon").html(AJAXtip['eraseReply']);
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        },
                        error: function(html) {
                            $("#robot_balloon").html(AJAXtip['error']);
                            $("#robot").animate({
                                opacity: 1
                            }, 1000).fadeOut(500);
                        }
                    });
                }
                return false;
            });
            $('#content').suggestBox({
                dataUrl: "/ajax/buddy_search"
            });
            $('#ReplyForm').submit(function() {
                var $form = $(this)
                  , message = $('#content').val()
                  , related_photo = $('#related_photo').val()
                  , $lastview_timestamp = $form.find('[name=lastview]')
                  , $formhash = $(this).find('[name=formhash]').val();
                if (message != '') {
                    submitTip();
                    if (related_photo == undefined) {
                        related_photo = 0;
                    }
                    $.ajax({
                        type: "POST",
                        url: $(this).attr('action') + "?ajax=1",
                        data: ({
                            content: message,
                            related_photo: related_photo,
                            lastview: $lastview_timestamp.val(),
                            formhash: $formhash,
                            submit: 'submit'
                        }),
                        dataType: 'json',
                        success: function(json) {
                            chiiLib.ajax_reply.insertJsonComments('#comment_list', json);
                            $lastview_timestamp.val(json.timestamp);
                            $('#content').val('');
                            if (typeof (REPLY_SUBMIT_TITLE) != "undefined") {
                                var submit_title = REPLY_SUBMIT_TITLE;
                            } else {
                                var submit_title = '写好了';
                            }
                            $('#submitBtnO').html('<input class="inputBtn" value="' + submit_title + '" name="submit" type="submit">&nbsp;&nbsp;<span class="tip">使用Ctrl+Enter或Alt+S快速提交</span>');
                        },
                        error: function(json) {
                            submitError();
                        }
                    });
                }
                return false;
            });
        }
    }
};
var AJAXtip = {
    wait: '<img src="/img/loading_s.gif" height="10" width="10" /> 请稍候...',
    saving: '正在保存...',
    eraseReplyConfirm: '确认删除这条回复?',
    eraseingReply: '正在删除回复...',
    eraseReply: '你选择的回复已经删除咯～',
    addingFrd: '正在添加好友...',
    addingDoujinCollect: '正在加入收藏...',
    rmDoujinCollect: '正在取消收藏...',
    addFrd: '恭喜恭喜，好友添加成功咯～',
    addSay: '恭喜恭喜，吐槽成功咯～<br />你可以在 <a href="/timeline?type=say">时光机</a> 里看到自己和好友们的吐槽哟。',
    error: '呜咕，提交出现了一些问题，请稍候再试...',
    no_subject: '呜咕，似乎没有这个条目，请检查URL是否正确或者换一个条目关联...'
}
var submitTip = function(main) {
    var waits = ["嘟嘟噜", "咪啪", "大丈夫", "锵锵", "叮咚", "嘎哦", "呜咕"];
    var wait = waits[Math.floor(Math.random() * waits.length)];
    if (main == undefined) {
        $('#submitBtnO').html('<img src="/img/loading_s.gif" height="10" width="10" align="absmiddle" /> <span class=tip_i>' + wait + '~正在发送请求</span>');
    } else {
        $(main).find('#submitBtnO').html('<img src="/img/loading_s.gif" height="10" width="10" align="absmiddle" /> <span class=tip_i>' + wait + '~正在发送请求</span>');
    }
}
var submitError = function() {
    $('#submitBtnO').html('<span class="alarm">' + AJAXtip['error'] + '</span>');
}
var removeListItem = function(btn_dom, item_prefix, tip_confirm, tip_ing, tip_done) {
    $(btn_dom).click(function() {
        if (confirm(tip_confirm)) {
            var tml_id = $(this).attr('id').split('_')[1];
            $("#robot").fadeIn(500);
            $("#robot_speech").hide();
            $("#robot_speech_js").show().html('<img src="/img/loading_s.gif" height="10" width="10" /> 请稍候，' + tip_ing + '...');
            $.ajax({
                type: "GET",
                url: this + '?ajax=1',
                success: function(html) {
                    $(item_prefix + '' + tml_id).fadeOut(500);
                    $("#robot_speech_js").html(tip_done);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                    setTimeout(function() {
                        $("#robot_speech_js").hide(300);
                        $("#robot_speech").show(300);
                    }, 1500);
                },
                error: function(html) {
                    $("#robot_speech_js").html(AJAXtip['error']);
                    $("#robot").animate({
                        opacity: 1
                    }, 1000).fadeOut(500);
                }
            });
        }
        return false;
    });
}
var submitPost = function(action, key, val) {
    var $splitAction = action.split('gh=')
      , $rawAction = $splitAction[0]
      , $formhash = $splitAction[1];
    form = $('<form>').attr('action', action).attr('method', 'post').append($('<input>').attr('type', 'hidden').attr('name', key).attr('value', val));
    $('body').append(form);
    form.submit();
    return false;
}
$.getScript = function(url, callback, cache) {
    $.ajax({
        type: "GET",
        url: url,
        success: callback,
        dataType: "script",
        cache: cache
    });
}
;
$().ready(function() {
    $("#collectBoxForm").validate({
        submitHandler: function(form) {
            submitTip();
            form.submit();
        }
    });
    $("#ModifyTopicForm").validate({
        rules: {
            title: "required",
            content: "required"
        },
        messages: {
            title: "请填写标题",
            content: "<br />请填写正文内容"
        }
    });
    $("#ModifyReplyForm").validate({
        rules: {
            content: "required"
        },
        messages: {
            content: "<br />请填写回复内容"
        }
    });
    $("#newTopicForm").validate({
        rules: {
            title: "required",
            content: "required"
        },
        messages: {
            title: "请填写标题",
            content: "<br />请填写正文内容"
        }
    });
    $("#editTopicForm").validate({
        rules: {
            title: "required",
            content: "required"
        },
        messages: {
            title: "请填写标题",
            content: "<br />请填写正文内容"
        }
    });
    $("#ReplyForm").validate({
        rules: {
            content: "required"
        },
        messages: {
            content: "<br />请填写回复内容"
        }
    });
    $("#tmlReplyForm").validate({
        rules: {
            content: "required"
        },
        messages: {
            content: "<br />请填写回复内容"
        }
    });
    $("#pmReplyForm").validate({
        rules: {
            msg_body: "required"
        },
        messages: {
            msg_body: "<br />请填写回复内容"
        }
    });
    $("#resetPasswordForm").validate({
        rules: {
            password: "required",
            password2: {
                required: true,
                minlength: 6,
                equalTo: "#password"
            }
        },
        messages: {
            password: "请输入你的密码",
            password2: {
                required: "请再次输入你的密码",
                minlength: "请设置至少 6 位以上的密码",
                equalTo: "密码验证失败，请确认两次输入相同"
            }
        }
    });
    $("#requestPasswordTokenForm").validate({
        rules: {
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            email: "请输入正确的 Email 地址"
        }
    });
    $("#loginForm").validate({
        rules: {
            password: "required",
            email: {
                required: true
            }
        },
        messages: {
            password: "请输入你的密码",
            email: "Email 还没有填写哦"
        }
    });
    $("#signupForm").validate({
        rules: {
            nickname: "required",
            password: "required",
            password2: {
                required: true,
                minlength: 6,
                equalTo: "#password"
            },
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            password: "请输入你的密码",
            email: "请输入一个正确的Email地址",
            nickname: "请输入你想使用的昵称",
            password2: {
                required: "请再次输入你的密码",
                minlength: "请设置至少 6 位以上的密码",
                equalTo: "密码验证失败，请确认两次输入相同"
            }
        }
    });
    $("#pmForm").validate({
        rules: {
            msg_receivers: "required",
            msg_title: "required",
            msg_body: "required"
        },
        messages: {
            msg_receivers: "请填写收件人",
            msg_title: "请填写短信标题",
            msg_body: "<br />请填写短信正文"
        }
    });
    $("#newGrpForm").validate({
        rules: {
            name: "required",
            title: "required"
        },
        messages: {
            name: "请填写访问地址",
            title: "请填写小组名称"
        }
    });
    $("#newClubForm").validate({
        rules: {
            name: "required",
            title: "required"
        },
        messages: {
            name: "请填写访问地址",
            title: "请填写社团名称"
        }
    });
    $("#newEventMarketForm").validate({
        rules: {
            title: "required",
            address: "required"
        },
        messages: {
            title: "请填写展会名称",
            address: "请填写详细地址"
        }
    });
    $("#newClubForm").validate({
        rules: {
            name: "required",
            title: "required"
        },
        messages: {
            name: "请填写访问地址",
            title: "请填写社团名称"
        }
    });
    $("#newIndexForm").validate({
        rules: {
            title: "required",
            desc: "required"
        },
        messages: {
            title: "请填写目录名称",
            desc: "请填写目录介绍"
        }
    });
});
var getObj = function(objId) {
    return document.all ? document.all[objId] : document.getElementById(objId);
}
var switchDisplay = function(objId) {
    obj = getObj(objId);
    if (obj.style.display != "block") {
        obj.style.display = "block";
    } else {
        obj.style.display = "none";
    }
}
var PostTo = function(subject_id, subject_name, type) {
    if (type == 'subject') {
        document.new_comment.action = '/subject/' + subject_id + '/topic/new';
    } else {
        document.new_comment.action = '/group/' + subject_id + '/topic/new';
    }
    $('#subject_name').html(decodeURIComponent(subject_name));
    $('#rakuen_new_topic').show();
}
var checkall = function(form, prefix, checkall, limit) {
    var checkall = checkall ? checkall : 'chkall';
    if (limit == undefined) {
        limit = 20;
    }
    for (var i = 0; i < form.elements.length; i++) {
        var e = form.elements[i];
        if (e.name != checkall && !e.disabled && (!prefix || (prefix && e.name.match(prefix))) && i < limit) {
            e.checked = form.elements[checkall].checked;
        }
    }
}
var seditor_ctlent = function(event, form_id) {
    if (event.ctrlKey && event.keyCode == 13 || event.altKey && event.keyCode == 83) {
        $('#' + form_id).find('input[name=submit]').click();
    }
}
var SetTips = function(value) {
    var tip = {
        cBth: "生日请按照XXXX年XX月XX日来填写，<br />例如1985年7月5日、7月5日。<br />如果不知道该角色生日可留空。",
        cHi: "身高可使用cm为单位，机体高度以官方单位为准。",
        cWe: "体重可使用kg为单位，机体高度以官方单位为准。",
        cBWH: "唔……这个……以B-W-H这样的格式添加好了。",
        cSmr: "如果介绍为多段，请确认每段开头文字为顶格，系统会自动为首行文字进行缩进。",
        RegEmail: "Email 地址将作为今后 <strong>登录验证</strong> 和保证在你忘记密码的时候能恢复你在 Bangumi 身份和数据的重要凭证。<br /><br />首次注册将会要求你通过 Email 地址接受一封验证邮件，请确保 Email 地址正确无误。<br /><br />我们承诺不会在未经你允许的情况下公开 Email 地址，也不向任何外部实体和个人透露你的 Email 地址。",
        RegNick: "昵称是作为你在 Bangumi 进行各项活动时显示的名号，昵称是可任意修改的，不必为一时不知如何取名而悲伤。",
        momo: "……唔……唔……H是不行的<br /><small>(点击那个地方我就可以说话了哟～☆)</small><br />·<a href=\"#;\" class=\"nav\" onclick=\"switchRobotSpeech();\">返回</a>"
    }
    $("#robot_speech").hide();
    $("#robot_speech_js").hide().html(tip[value]).slideDown();
}
var regSetNickName = function() {
    SetTips('RegNick');
    var $rechaptcha_form = $('#rechaptcha_form');
    if (!$rechaptcha_form.find('#rechaptcha_raw').length) {
        $('#rechaptcha_raw').appendTo('#rechaptcha_form').show();
        chiiLib.login.genCaptcha(false);
    }
}
function sizeContent(num, objname) {
    var obj = document.getElementById(objname);
    if (parseInt(obj.rows) + num >= 1) {
        obj.rows = parseInt(obj.rows) + num;
    }
    if (num > 0) {
        obj.width = "90%";
    }
}
function AddMSGreceiver(nickname) {
    var obj = getObj("msg_receivers");
    obj.value += nickname + ',';
}
function GenInterestBox(id) {
    if (id == 'wish') {
        $("#wish").attr("checked", true);
        $('#interest_rate').hide();
    } else {
        $("#" + id).attr("checked", true);
        $('#interest_rate').show();
    }
}
var MoreElement = function(type, name, id, classname) {
    var type, orz = document.getElementById(id);
    var newInput = document.createElement("input");
    newInput.type = type;
    newInput.name = name + "[]";
    newInput.id = name + "[]";
    newInput.className = classname;
    orz.appendChild(newInput);
    var newline = document.createElement("br");
    orz.appendChild(newline);
}
var eraseSubjectCollect = function(subjectID, hash) {
    if (confirm('确认删除这个条目收藏？')) {
        location.href = '/subject/' + subjectID + '/remove?gh=' + hash;
    }
}
var eraseGrpTopic = function(topicID, hash) {
    if (confirm('确认删除这个主题？')) {
        location.href = '/erase/group/topic/' + topicID + '?gh=' + hash;
    }
}
var eraseSubjectTopic = function(topicID, hash) {
    if (confirm('确认删除这个主题？')) {
        location.href = '/erase/subject/topic/' + topicID + '?gh=' + hash;
    }
}
var eraseClubTopic = function(topicID, hash) {
    if (confirm('确认删除这个主题？')) {
        location.href = '/erase/club/topic/' + topicID + '?gh=' + hash;
    }
}
var eraseEntry = function(ID, hash) {
    if (confirm('确认删除这篇日志？')) {
        location.href = '/erase/entry/' + ID + '?gh=' + hash;
    }
}
var erasePM = function(pmID, hash) {
    if (confirm('确认删除这条短信？')) {
        location.href = '/pm/erase/' + pmID + '.chii?gh=' + hash;
    }
}
var disconnectFriend = function(frdId, frdNick, hash) {
    if (confirm('确认从朋友列表中去掉 ' + decodeURIComponent(frdNick) + '?')) {
        location.href = '/disconnect/' + frdId + '?gh=' + hash;
    }
}
var checkTsukkomiInput = function(doing, status) {
    obj1 = getObj(doing);
    remain = 123 - obj1.value.length;
    obj2 = getObj(status);
    if (obj1.value.length <= 122) {
        obj2.innerHTML = '<small class="grey">还可以输入' + remain + ' 字</small>';
    } else {
        remain2 = obj1.value.length - 123;
        obj2.innerHTML = '<small class="na">还可以输入0 字</small>';
        obj1.value = obj1.value.substring(0, 123);
    }
}
function switchRobotSpeech() {
    if ($('#robot_speech').is(':hidden')) {
        $("#robot_speech_js").hide();
        $("#robot_speech").slideDown();
    } else {
        $("#robot_speech").hide();
        $("#robot_speech_js").slideDown();
    }
}
var nowmode = "wcode";
var head;
var infoboxVal = new Object();
var infoboxid;
function WikiTpl(value) {
    if (arguments.length == 2) {
        _infoboxid = arguments[1];
    } else {
        _infoboxid = 'subject_infobox';
    }
    infoboxid = '#' + _infoboxid;
    var tpl = {
        TVAnime: "{{Infobox animanga/TVAnime\n|中文名= \n|别名= {\n\n}\n|话数= * \n|放送开始= * \n|放送星期=\n|官方网站=\n|播放电视台=\n|其他电视台= \n|播放结束= \n|其他= \n|Copyright=\n}}",
        OVA: "{{Infobox animanga/OVA\n|中文名= \n|别名= {\n\n}\n|话数= * \n|发售日= * \n|官方网站=\n|开始= \n|结束= \n|其他= \n}}",
        Movie: "{{Infobox animanga/Movie\n|中文名= \n|别名= {\n\n}\n|上映年度= * \n|片长= \n|官方网站=\n|其他= \n|Copyright= \n}}",
        Anime: "{{Infobox animanga/Anime\n|中文名= \n|别名= {\n\n}\n|上映年度= * \n|片长= \n|官方网站=\n|其他= \n|Copyright= \n}}",
        Book: "{{Infobox animanga/Book\n|中文名= \n|别名= {\n\n}\n|出版社= *\n|价格=\n|其他出版社= \n|连载杂志= \n|发售日= \n|页数=\n|ISBN= \n|其他= \n}}",
        Manga: "{{Infobox animanga/Manga\n|中文名= \n|别名= {\n\n}\n|出版社= *\n|价格=\n|其他出版社= \n|连载杂志= \n|发售日= \n|册数= \n|页数=\n|话数= \n|ISBN= \n|其他= \n}}",
        Novel: "{{Infobox animanga/Novel\n|中文名= \n|别名= {\n\n}\n|出版社= * \n|价格=\n|连载杂志= \n|发售日= \n|册数= \n|页数=\n|话数= \n|ISBN= \n|其他= \n}}",
        BookSeries: "{{Infobox animanga/BookSeries\n|中文名= \n|别名= {\n\n}\n|出版社= * \n|连载杂志= \n|开始= \n|结束= \n|册数= \n |话数= \n|其他= \n}}",
        Album: "{{Infobox Album\n|中文名=\n|别名= {\n\n}\n|版本特性= \n|发售日期= \n|价格= \n|播放时长= \n|录音= \n|碟片数量= \n}}",
        Game: "{{Infobox Game\n|中文名=\n|别名= {\n\n}\n|平台= {\n\n}\n|游戏类型=\n|游戏引擎=\n|游玩人数=\n|发行日期=\n|售价=\n|website=\n}}",
        TV: "{{Infobox real/Television\n|中文名=\n|别名= {\n\n}\n|集数=\n|放送星期=\n|开始=\n|结束=\n|类型=\n|国家/地区=\n|语言=\n|每集长=\n|频道=\n|电视网=\n|电视台=\n|视频制式=\n|音频制式=\n|首播国家=\n|首播地区=\n|台湾名称=\n|港澳名称=\n|马新名称=\n|官方网站=\n|imdb_id=\n|tv_com_id=\n}} ",
        Crt: "{{Infobox Crt\n|简体中文名=\n|别名={\n[第二中文名|]\n[英文名|]\n[日文名|]\n[纯假名|]\n[罗马字|]\n[昵称|]\n}\n|性别=\n|生日=\n|血型=\n|身高=\n|体重=\n|BWH=\n|引用来源={\n}\n}}",
        doujinBook: "{{Infobox doujin/Book\n|作者={\n\n}\n|原作=\n|CP=\n|语言=\n|页数=\n|尺寸=\n|价格=\n|发售日=\n}}",
        doujinMusic: "{{Infobox doujin/Album\n|艺术家={\n\n}\n|原作=\n|语言=\n|版本特性=\n|碟片数量=\n|播放时长=\n|价格=\n|发售日=\n}}",
        doujinGame: "{{Infobox doujin/Game\n|别名= {\n\n}\n|开发者={\n\n}\n|原作=\n|平台=\n|游戏类型=\n|游戏引擎=\n|游玩人数=\n|语言=\n|价格=\n|发售日=\n}}"
    }
    NormaltoWCODE();
    var preInfoboxVal = WCODEParse($(infoboxid).val());
    for (var i in preInfoboxVal) {
        infoboxVal[i] = preInfoboxVal[i];
    }
    var newInfobox = WCODEParse(tpl[value]);
    var finalInfobox = newInfobox;
    for (var i in newInfobox) {
        if (infoboxVal[i] != undefined) {
            if ((typeof infoboxVal[i]) == 'object') {
                if (typeof finalInfobox[i] != 'object') {
                    finalInfobox[i] = new Object();
                }
                for (var j in newInfobox[i]) {
                    finalInfobox[i][j] = newInfobox[i][j];
                }
                for (var j in infoboxVal[i]) {
                    finalInfobox[i][j] = infoboxVal[i][j];
                }
            } else {
                finalInfobox[i] = infoboxVal[i];
            }
        }
    }
    for (var i in infoboxVal) {
        if (infoboxVal[i] != undefined) {
            if ((typeof infoboxVal[i]) == 'object') {
                if (typeof finalInfobox[i] != 'object') {
                    finalInfobox[i] = new Object();
                }
                for (var j in infoboxVal[i]) {
                    finalInfobox[i][j] = infoboxVal[i][j];
                }
            } else {
                infoboxVal[i] = $.trim(infoboxVal[i]);
                if (infoboxVal[i] != '' && infoboxVal[i] != '*') {
                    finalInfobox[i] = infoboxVal[i];
                }
            }
        }
    }
    finalInfobox = WCODEDump(finalInfobox);
    $(infoboxid).val(finalInfobox);
    $(infoboxid).css('height:150px');
    if ((typeof wikiDisableNormalMode == 'undefined') || wikiDisableNormalMode == false) {
        WCODEtoNormal();
    }
    multiKeyRegDel();
    stopEnterSubmit();
}
function WCODEParse(input) {
    array = new Array();
    foo = input.split("\n");
    head = "";
    for (i = 0; i < foo.length; i++) {
        line = foo[i];
        if (line.substr(0, 1) === "{") {
            head = head + line + "\n";
        } else if (line.indexOf("=") != -1) {
            key = $.trim((line.substr(1, line.indexOf("=") - 1)));
            line = $.trim(line);
            value = null;
            if (/=\s*{$/.test(line)) {
                i++;
                line = foo[i];
                line = $.trim(line);
                value = new Object();
                var subKey = 0;
                var valArr = new Array();
                while (i < foo.length && !/^}$/.test(line) && !/^\|/.test(line)) {
                    if (/^\[(.+)\]$/.test(line)) {
                        var subVal = RegExp.$1;
                        if (/^([^|]+)[|](.*)$/i.test(subVal)) {
                            value[RegExp.$1] = RegExp.$2.replace(/\\\|/g, '|');
                        } else {
                            value[subKey] = subVal.replace(/\\\|/g, '|');
                            subKey++;
                        }
                    }
                    i++;
                    line = foo[i];
                    line = $.trim(line);
                }
                line = $.trim(line);
            } else {
                value = $.trim((line.substr(line.indexOf("=") + 1)));
            }
            array[key] = value;
        }
    }
    return array;
}
function WCODEDump(array) {
    string = "";
    string = string + head;
    for (id in array) {
        value = array[id];
        if ((id !== 0) && ($.trim(id) !== "")) {
            if ((typeof value) == 'object') {
                string += "|" + id + "={\n";
                for (var eKey in value) {
                    if (!isNaN(eKey) && $.trim(value[eKey]) == '') {
                        continue;
                    }
                    if (isNaN(eKey)) {
                        string += "[" + $.trim(eKey) + '|' + value[eKey].replace(/\|/g, '\\|') + "]\n";
                    } else {
                        string += "[" + value[eKey].replace(/\|/g, '\\|') + "]\n";
                    }
                }
                string += "}\n";
            } else if ((value.indexOf("\n") == -1) || (value.indexOf("=") == -1) || (value.indexOf("-") == -1)) {
                string = string + "|" + id + "= " + value + "\n";
            }
        }
    }
    string = string + "}}";
    return string;
}
function WCODEtoNormal() {
    if (nowmode == "wcode") {
        $(infoboxid).hide();
        $("#infobox_normal").html("");
        wcode = $(infoboxid).val();
        info = WCODEParse(wcode);
        for (id in info) {
            if ((typeof info[id]) == 'object') {
                var multiInfo = '<p><input class="inputtext id multiKey" tabindex="1024" value="' + id + '" /><input class="inputtext prop multiVal" readonly="true" onclick="addSubProp(this);" value="点此增加输入框:" /><input type="button" tabindex="-1" class="multiKeyAdd" onclick="addSubProp(this);" /><br clear="all" /></p>';
                for (var eKey in info[id]) {
                    if (isNaN(eKey)) {
                        var subkey = eKey.replace(/"/g, '&quot;');
                    } else {
                        var subkey = '';
                    }
                    multiInfo += '<input class="inputtext id multiSubKey"  tabindex="1024" value="' + subkey + '" /><input class="inputtext prop multiSubVal" value="' + info[id][eKey].replace(/"/g, '&quot;') + '" /><input type="button"  tabindex="-1" class="multiKeyDel" /><br clear="all" />';
                }
                $("#infobox_normal").append(multiInfo);
            } else {
                $("#infobox_normal").append('<input class="inputtext id" tabindex="1024" value="' + id + '" /><input class="inputtext prop" value="' + info[id].replace(/"/g, '&quot;') + '" /><br clear="all" />');
            }
        }
        $("#infobox_normal").append('<input class="inputtext id" value="" onfocus="addoneprop();" /><input class="inputtext prop" value="" onfocus="addoneprop();" /><br clear="all" />');
        nowmode = "normal";
        $("#infobox_normal").show();
    }
}
function NormaltoWCODE() {
    if (nowmode == "normal") {
        $("#infobox_normal").hide();
        nowmode = "normal";
        info = new Array();
        ids = new Object();
        props = new Object();
        input_num = $("#infobox_normal input.id").length;
        ids = $("#infobox_normal input.id");
        props = $("#infobox_normal input.prop");
        for (i = 0; i < input_num; i++) {
            id = $(ids).get(i);
            prop = $(props).get(i);
            if ($(id).hasClass('multiKey')) {
                multiKey = $(id).val();
                info[multiKey] = new Object();
                var subKey = 0;
                i++;
                id = $(ids).get(i);
                prop = $(props).get(i);
                while (($(id).hasClass('multiSubKey') || $(prop).hasClass('multiSubVal')) && i < input_num) {
                    if (isNaN($(id).val())) {
                        info[multiKey][$(id).val()] = $(prop).val();
                    } else {
                        info[multiKey][subKey] = $(prop).val();
                        subKey++;
                    }
                    i++;
                    id = $(ids).get(i);
                    prop = $(props).get(i);
                }
                i--;
            } else if ($.trim($(id).val()) != "") {
                info[$(id).val()] = $(prop).val();
            }
        }
        wcode = WCODEDump(info);
        $(infoboxid).val(wcode);
        nowmode = "wcode";
        $(infoboxid).show();
    }
}
function addSubProp(obj) {
    $(obj).parent().after('<input class="inputtext id multiSubKey"  tabindex="1024" value="" /><input class="inputtext prop multiSubVal" value="" /><input type="button"  tabindex="-1" class="multiKeyDel" /><br clear="all" />');
    $("#infobox_normal > input.multiKeyDel").unbind('click');
    stopEnterSubmit();
    multiKeyRegDel();
}
function stopEnterSubmit() {
    var inputList = $("#infobox_normal > input");
    inputList.unbind('keydown');
    inputList.keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });
}
function multiKeyRegDel() {
    var delButtons = $("#infobox_normal > input.multiKeyDel");
    delButtons.unbind('click');
    delButtons.click(function() {
        var inputList = $("#infobox_normal > *");
        var index = inputList.index(this);
        inputList.slice(index - 2, index + 2).remove();
        return;
    });
    return;
}
function addoneprop() {
    $("#infobox_normal > input").removeAttr("onfocus");
    $("#infobox_normal").append('<input class="inputtext id" value="" onfocus="addoneprop();" /><input class="inputtext prop" value="" onfocus="addoneprop();" /><br clear="all" />');
    stopEnterSubmit();
}
$(document).ready(function() {
    var $list = $('#groupJoinAction').find('a[href*=bye],a[href*=join]');
    $list.click(function() {
        submitPost(this.href, 'action', 'join-bye');
        return false;
    });
});
$(document).ready(function() {
    chiiLib.ukagaka.init();
    chiiLib.user.badge();
    chiiLib.ajax_reply.mainReply();
    $('#browserTypeSelector a').click(function() {
        var selector = $(this).attr('id')
          , $browserList = $('#browserItemList')
          , $item = $browserList.find('img.cover');
        $('#list_selector').removeClass();
        $('#full_selector').removeClass();
        $('#grid_selector').removeClass();
        $(this).addClass('active');
        $browserList.removeClass();
        if (selector == 'list_selector') {
            $.cookie('list_display_mode', 'list');
            $browserList.addClass('browserList');
            $item.each(function() {
                _src = $(this).attr('src').replace(/cover\/([a-z]+)\//g, 'cover/g/');
                $(this).attr('src', _src);
            });
        } else if (selector == 'full_selector') {
            $.cookie('list_display_mode', 'full');
            $browserList.addClass('browserFull');
            $item.each(function() {
                _src = $(this).attr('src').replace(/cover\/([a-z]+)\//g, 'cover/s/');
                $(this).attr('src', _src);
            });
        } else {
            $.cookie('list_display_mode', 'grid');
            $browserList.addClass('browserGrid clearit');
            $item.each(function() {
                _src = $(this).attr('src').replace(/cover\/([a-z]+)\//g, 'cover/m/');
                $(this).attr('src', _src);
            });
        }
    });
});
var fetchInPageSubjectID = function() {
    _subject_id_list = '';
    $("#browserItemList li.item").each(function() {
        var $item_id = $(this).attr('id').split('_')[1];
        _subject_id_list = _subject_id_list + $item_id + ',';
    });
    alert(_subject_id_list);
}
var subReplycancel = function() {
    $('div.subreply_textarea').remove();
}
var subReply = function(type, topic_id, post_id, sub_reply_id, sub_reply_uid, post_uid, sub_post_type) {
    chiiLib.ajax_reply.subReply(type, topic_id, post_id, sub_reply_id, sub_reply_uid, post_uid, sub_post_type);
}
