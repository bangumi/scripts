// ==UserScript==
// @name         bgm-eps-editor
// @namespace    https://github.com/bangumi/scripts/tree/master/mono
// @version      7
// @description  章节列表编辑器
// @author       mono <momocraft@gmail.com>
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/subject\/\d+\/ep\/edit_batch/
// @grant        none
// ==/UserScript==
(function() {
	//#region src/node_modules/preact/dist/preact.module.js
	var n, l, u$1, i$1, r, o$1, e, f$1, c, s, a, p = {}, v = [], y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, d = Array.isArray;
	function w(n, l) {
		for (var u in l) n[u] = l[u];
		return n;
	}
	function g(n) {
		n && n.parentNode && n.parentNode.removeChild(n);
	}
	function _(l, u, t) {
		var i, r, o, e = {};
		for (o in u) "key" == o ? i = u[o] : "ref" == o ? r = u[o] : e[o] = u[o];
		if (arguments.length > 2 && (e.children = arguments.length > 3 ? n.call(arguments, 2) : t), "function" == typeof l && null != l.defaultProps) for (o in l.defaultProps) void 0 === e[o] && (e[o] = l.defaultProps[o]);
		return m(l, e, i, r, null);
	}
	function m(n, t, i, r, o) {
		var e = {
			type: n,
			props: t,
			key: i,
			ref: r,
			__k: null,
			__: null,
			__b: 0,
			__e: null,
			__c: null,
			constructor: void 0,
			__v: null == o ? ++u$1 : o,
			__i: -1,
			__u: 0
		};
		return null == o && null != l.vnode && l.vnode(e), e;
	}
	function k(n) {
		return n.children;
	}
	function x(n, l) {
		this.props = n, this.context = l;
	}
	function S(n, l) {
		if (null == l) return n.__ ? S(n.__, n.__i + 1) : null;
		for (var u; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) return u.__e;
		return "function" == typeof n.type ? S(n) : null;
	}
	function C(n) {
		if (n.__P && n.__d) {
			var u = n.__v, t = u.__e, i = [], r = [], o = w({}, u);
			o.__v = u.__v + 1, l.vnode && l.vnode(o), z(n.__P, o, u, n.__n, n.__P.namespaceURI, 32 & u.__u ? [t] : null, i, null == t ? S(u) : t, !!(32 & u.__u), r), o.__v = u.__v, o.__.__k[o.__i] = o, V(i, o, r), u.__e = u.__ = null, o.__e != t && M(o);
		}
	}
	function M(n) {
		if (null != (n = n.__) && null != n.__c) return n.__e = n.__c.base = null, n.__k.some(function(l) {
			if (null != l && null != l.__e) return n.__e = n.__c.base = l.__e;
		}), M(n);
	}
	function $(n) {
		(!n.__d && (n.__d = !0) && i$1.push(n) && !I.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o$1)(I);
	}
	function I() {
		try {
			for (var n, l = 1; i$1.length;) i$1.length > l && i$1.sort(e), n = i$1.shift(), l = i$1.length, C(n);
		} finally {
			i$1.length = I.__r = 0;
		}
	}
	function P(n, l, u, t, i, r, o, e, f, c, s) {
		var a, h, y, d, w, g, _, m = t && t.__k || v, b = l.length;
		for (f = A(u, l, m, f, b), a = 0; a < b; a++) null != (y = u.__k[a]) && (h = -1 != y.__i && m[y.__i] || p, y.__i = a, g = z(n, y, h, i, r, o, e, f, c, s), d = y.__e, y.ref && h.ref != y.ref && (h.ref && D(h.ref, null, y), s.push(y.ref, y.__c || d, y)), null == w && null != d && (w = d), (_ = !!(4 & y.__u)) || h.__k === y.__k ? f = H(y, f, n, _) : "function" == typeof y.type && void 0 !== g ? f = g : d && (f = d.nextSibling), y.__u &= -7);
		return u.__e = w, f;
	}
	function A(n, l, u, t, i) {
		var r, o, e, f, c, s = u.length, a = s, h = 0;
		for (n.__k = new Array(i), r = 0; r < i; r++) null != (o = l[r]) && "boolean" != typeof o && "function" != typeof o ? ("string" == typeof o || "number" == typeof o || "bigint" == typeof o || o.constructor == String ? o = n.__k[r] = m(null, o, null, null, null) : d(o) ? o = n.__k[r] = m(k, { children: o }, null, null, null) : void 0 === o.constructor && o.__b > 0 ? o = n.__k[r] = m(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : n.__k[r] = o, f = r + h, o.__ = n, o.__b = n.__b + 1, e = null, -1 != (c = o.__i = T(o, u, f, a)) && (a--, (e = u[c]) && (e.__u |= 2)), null == e || null == e.__v ? (-1 == c && (i > s ? h-- : i < s && h++), "function" != typeof o.type && (o.__u |= 4)) : c != f && (c == f - 1 ? h-- : c == f + 1 ? h++ : (c > f ? h-- : h++, o.__u |= 4))) : n.__k[r] = null;
		if (a) for (r = 0; r < s; r++) null != (e = u[r]) && 0 == (2 & e.__u) && (e.__e == t && (t = S(e)), E(e, e));
		return t;
	}
	function H(n, l, u, t) {
		var i, r;
		if ("function" == typeof n.type) {
			for (i = n.__k, r = 0; i && r < i.length; r++) i[r] && (i[r].__ = n, l = H(i[r], l, u, t));
			return l;
		}
		n.__e != l && (t && (l && n.type && !l.parentNode && (l = S(n)), u.insertBefore(n.__e, l || null)), l = n.__e);
		do
			l = l && l.nextSibling;
		while (null != l && 8 == l.nodeType);
		return l;
	}
	function T(n, l, u, t) {
		var i, r, o, e = n.key, f = n.type, c = l[u], s = null != c && 0 == (2 & c.__u);
		if (null === c && null == e || s && e == c.key && f == c.type) return u;
		if (t > (s ? 1 : 0)) {
			for (i = u - 1, r = u + 1; i >= 0 || r < l.length;) if (null != (c = l[o = i >= 0 ? i-- : r++]) && 0 == (2 & c.__u) && e == c.key && f == c.type) return o;
		}
		return -1;
	}
	function j(n, l, u) {
		"-" == l[0] ? n.setProperty(l, null == u ? "" : u) : n[l] = null == u ? "" : "number" != typeof u || y.test(l) ? u : u + "px";
	}
	function F(n, l, u, t, i) {
		var r, o;
		n: if ("style" == l) if ("string" == typeof u) n.style.cssText = u;
		else {
			if ("string" == typeof t && (n.style.cssText = t = ""), t) for (l in t) u && l in u || j(n.style, l, "");
			if (u) for (l in u) t && u[l] == t[l] || j(n.style, l, u[l]);
		}
		else if ("o" == l[0] && "n" == l[1]) r = l != (l = l.replace(f$1, "$1")), o = l.toLowerCase(), l = o in n || "onFocusOut" == l || "onFocusIn" == l ? o.slice(2) : l.slice(2), n.l || (n.l = {}), n.l[l + r] = u, u ? t ? u.u = t.u : (u.u = c, n.addEventListener(l, r ? a : s, r)) : n.removeEventListener(l, r ? a : s, r);
		else {
			if ("http://www.w3.org/2000/svg" == i) l = l.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
			else if ("width" != l && "height" != l && "href" != l && "list" != l && "form" != l && "tabIndex" != l && "download" != l && "rowSpan" != l && "colSpan" != l && "role" != l && "popover" != l && l in n) try {
				n[l] = null == u ? "" : u;
				break n;
			} catch (n) {}
			"function" == typeof u || (null == u || !1 === u && "-" != l[4] ? n.removeAttribute(l) : n.setAttribute(l, "popover" == l && 1 == u ? "" : u));
		}
	}
	function O(n) {
		return function(u) {
			if (this.l) {
				var t = this.l[u.type + n];
				if (null == u.t) u.t = c++;
				else if (u.t < t.u) return;
				return t(l.event ? l.event(u) : u);
			}
		};
	}
	function z(n, u, t, i, r, o, e, f, c, s) {
		var a, h, p, y, _, m, b, S, C, M, $, I, A, H, L, T = u.type;
		if (void 0 !== u.constructor) return null;
		128 & t.__u && (c = !!(32 & t.__u), o = [f = u.__e = t.__e]), (a = l.__b) && a(u);
		n: if ("function" == typeof T) try {
			if (S = u.props, C = T.prototype && T.prototype.render, M = (a = T.contextType) && i[a.__c], $ = a ? M ? M.props.value : a.__ : i, t.__c ? b = (h = u.__c = t.__c).__ = h.__E : (C ? u.__c = h = new T(S, $) : (u.__c = h = new x(S, $), h.constructor = T, h.render = G), M && M.sub(h), h.state || (h.state = {}), h.__n = i, p = h.__d = !0, h.__h = [], h._sb = []), C && null == h.__s && (h.__s = h.state), C && null != T.getDerivedStateFromProps && (h.__s == h.state && (h.__s = w({}, h.__s)), w(h.__s, T.getDerivedStateFromProps(S, h.__s))), y = h.props, _ = h.state, h.__v = u, p) C && null == T.getDerivedStateFromProps && null != h.componentWillMount && h.componentWillMount(), C && null != h.componentDidMount && h.__h.push(h.componentDidMount);
			else {
				if (C && null == T.getDerivedStateFromProps && S !== y && null != h.componentWillReceiveProps && h.componentWillReceiveProps(S, $), u.__v == t.__v || !h.__e && null != h.shouldComponentUpdate && !1 === h.shouldComponentUpdate(S, h.__s, $)) {
					u.__v != t.__v && (h.props = S, h.state = h.__s, h.__d = !1), u.__e = t.__e, u.__k = t.__k, u.__k.some(function(n) {
						n && (n.__ = u);
					}), v.push.apply(h.__h, h._sb), h._sb = [], h.__h.length && e.push(h);
					break n;
				}
				null != h.componentWillUpdate && h.componentWillUpdate(S, h.__s, $), C && null != h.componentDidUpdate && h.__h.push(function() {
					h.componentDidUpdate(y, _, m);
				});
			}
			if (h.context = $, h.props = S, h.__P = n, h.__e = !1, I = l.__r, A = 0, C) h.state = h.__s, h.__d = !1, I && I(u), a = h.render(h.props, h.state, h.context), v.push.apply(h.__h, h._sb), h._sb = [];
			else do
				h.__d = !1, I && I(u), a = h.render(h.props, h.state, h.context), h.state = h.__s;
			while (h.__d && ++A < 25);
			h.state = h.__s, null != h.getChildContext && (i = w(w({}, i), h.getChildContext())), C && !p && null != h.getSnapshotBeforeUpdate && (m = h.getSnapshotBeforeUpdate(y, _)), H = null != a && a.type === k && null == a.key ? q(a.props.children) : a, f = P(n, d(H) ? H : [H], u, t, i, r, o, e, f, c, s), h.base = u.__e, u.__u &= -161, h.__h.length && e.push(h), b && (h.__E = h.__ = null);
		} catch (n) {
			if (u.__v = null, c || null != o) if (n.then) {
				for (u.__u |= c ? 160 : 128; f && 8 == f.nodeType && f.nextSibling;) f = f.nextSibling;
				o[o.indexOf(f)] = null, u.__e = f;
			} else {
				for (L = o.length; L--;) g(o[L]);
				N(u);
			}
			else u.__e = t.__e, u.__k = t.__k, n.then || N(u);
			l.__e(n, u, t);
		}
		else null == o && u.__v == t.__v ? (u.__k = t.__k, u.__e = t.__e) : f = u.__e = B(t.__e, u, t, i, r, o, e, c, s);
		return (a = l.diffed) && a(u), 128 & u.__u ? void 0 : f;
	}
	function N(n) {
		n && (n.__c && (n.__c.__e = !0), n.__k && n.__k.some(N));
	}
	function V(n, u, t) {
		for (var i = 0; i < t.length; i++) D(t[i], t[++i], t[++i]);
		l.__c && l.__c(u, n), n.some(function(u) {
			try {
				n = u.__h, u.__h = [], n.some(function(n) {
					n.call(u);
				});
			} catch (n) {
				l.__e(n, u.__v);
			}
		});
	}
	function q(n) {
		return "object" != typeof n || null == n || n.__b > 0 ? n : d(n) ? n.map(q) : w({}, n);
	}
	function B(u, t, i, r, o, e, f, c, s) {
		var a, h, v, y, w, _, m, b = i.props || p, k = t.props, x = t.type;
		if ("svg" == x ? o = "http://www.w3.org/2000/svg" : "math" == x ? o = "http://www.w3.org/1998/Math/MathML" : o || (o = "http://www.w3.org/1999/xhtml"), null != e) {
			for (a = 0; a < e.length; a++) if ((w = e[a]) && "setAttribute" in w == !!x && (x ? w.localName == x : 3 == w.nodeType)) {
				u = w, e[a] = null;
				break;
			}
		}
		if (null == u) {
			if (null == x) return document.createTextNode(k);
			u = document.createElementNS(o, x, k.is && k), c && (l.__m && l.__m(t, e), c = !1), e = null;
		}
		if (null == x) b === k || c && u.data == k || (u.data = k);
		else {
			if (e = e && n.call(u.childNodes), !c && null != e) for (b = {}, a = 0; a < u.attributes.length; a++) b[(w = u.attributes[a]).name] = w.value;
			for (a in b) w = b[a], "dangerouslySetInnerHTML" == a ? v = w : "children" == a || a in k || "value" == a && "defaultValue" in k || "checked" == a && "defaultChecked" in k || F(u, a, null, w, o);
			for (a in k) w = k[a], "children" == a ? y = w : "dangerouslySetInnerHTML" == a ? h = w : "value" == a ? _ = w : "checked" == a ? m = w : c && "function" != typeof w || b[a] === w || F(u, a, w, b[a], o);
			if (h) c || v && (h.__html == v.__html || h.__html == u.innerHTML) || (u.innerHTML = h.__html), t.__k = [];
			else if (v && (u.innerHTML = ""), P("template" == t.type ? u.content : u, d(y) ? y : [y], t, i, r, "foreignObject" == x ? "http://www.w3.org/1999/xhtml" : o, e, f, e ? e[0] : i.__k && S(i, 0), c, s), null != e) for (a = e.length; a--;) g(e[a]);
			c || (a = "value", "progress" == x && null == _ ? u.removeAttribute("value") : null != _ && (_ !== u[a] || "progress" == x && !_ || "option" == x && _ != b[a]) && F(u, a, _, b[a], o), a = "checked", null != m && m != u[a] && F(u, a, m, b[a], o));
		}
		return u;
	}
	function D(n, u, t) {
		try {
			if ("function" == typeof n) {
				var i = "function" == typeof n.__u;
				i && n.__u(), i && null == u || (n.__u = n(u));
			} else n.current = u;
		} catch (n) {
			l.__e(n, t);
		}
	}
	function E(n, u, t) {
		var i, r;
		if (l.unmount && l.unmount(n), (i = n.ref) && (i.current && i.current != n.__e || D(i, null, u)), null != (i = n.__c)) {
			if (i.componentWillUnmount) try {
				i.componentWillUnmount();
			} catch (n) {
				l.__e(n, u);
			}
			i.base = i.__P = null;
		}
		if (i = n.__k) for (r = 0; r < i.length; r++) i[r] && E(i[r], u, t || "function" != typeof n.type);
		t || g(n.__e), n.__c = n.__ = n.__e = void 0;
	}
	function G(n, l, u) {
		return this.constructor(n, u);
	}
	function J(u, t, i) {
		var r, o, e, f;
		t == document && (t = document.documentElement), l.__ && l.__(u, t), o = (r = "function" == typeof i) ? null : i && i.__k || t.__k, e = [], f = [], z(t, u = (!r && i || t).__k = _(k, null, [u]), o || p, p, t.namespaceURI, !r && i ? [i] : o ? null : t.firstChild ? n.call(t.childNodes) : null, e, !r && i ? i : o ? o.__e : t.firstChild, r, f), V(e, u, f);
	}
	n = v.slice, l = { __e: function(n, l, u, t) {
		for (var i, r, o; l = l.__;) if ((i = l.__c) && !i.__) try {
			if ((r = i.constructor) && null != r.getDerivedStateFromError && (i.setState(r.getDerivedStateFromError(n)), o = i.__d), null != i.componentDidCatch && (i.componentDidCatch(n, t || {}), o = i.__d), o) return i.__E = i;
		} catch (l) {
			n = l;
		}
		throw n;
	} }, u$1 = 0, x.prototype.setState = function(n, l) {
		var u = null != this.__s && this.__s != this.state ? this.__s : this.__s = w({}, this.state);
		"function" == typeof n && (n = n(w({}, u), this.props)), n && w(u, n), null != n && this.__v && (l && this._sb.push(l), $(this));
	}, x.prototype.forceUpdate = function(n) {
		this.__v && (this.__e = !0, n && this.__h.push(n), $(this));
	}, x.prototype.render = k, i$1 = [], o$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n, l) {
		return n.__v.__b - l.__v.__b;
	}, I.__r = 0, f$1 = /(PointerCapture)$|Capture$/i, c = 0, s = O(!1), a = O(!0);
	//#endregion
	//#region src/bgm-eps-editor-variable.ts
	function getSetting() {
		const sideContent = document.getElementById("columnB")?.textContent ?? "";
		if (/章节编号/.exec(sideContent)) return new EpisodeEditor();
		else if (/曲目编号/.exec(sideContent)) return new TrackEditor();
		throw new Error("cannot decide which editor to use");
	}
	var EpisodeEditor = class {
		constructor() {
			this.getStyleText = () => episodeStyleText;
			this.getColumnHeads = () => "章节编号|原文标题|简体中文标题|时长|放送日期".split("|");
			this.getColumnOrder = () => [
				"no",
				"titleRaw",
				"titleZh",
				"duration",
				"airDate"
			];
		}
	};
	var TrackEditor = class {
		constructor() {
			this.getStyleText = () => trackStyleText;
			this.getColumnHeads = () => "光盘编号|曲目编号|原文标题|简体中文标题|时长".split("|");
			this.getColumnOrder = () => [
				"discNo",
				"titleNo",
				"titleRaw",
				"titleZh",
				"duration"
			];
		}
	};
	var episodeStyleText = `
table.episodes-editor-mono {
    table-layout: fixed;
    width: 45em;
}

table.episodes-editor-mono input {
    width: 100%;
}

table.episodes-editor-mono input:invalid {
    background-color: pink;
}

table.episodes-editor-mono th:nth-child(1),
table.episodes-editor-mono td:nth-child(1) {
    width: 2em;
}

table.episodes-editor-mono th:nth-child(2),
table.episodes-editor-mono td:nth-child(2),
table.episodes-editor-mono th:nth-child(3),
table.episodes-editor-mono td:nth-child(3) {
    width: 10em;
}

table.episodes-editor-mono th:nth-child(4),
table.episodes-editor-mono td:nth-child(4) {
    width: 3.5em;
}

table.episodes-editor-mono th:nth-child(5),
table.episodes-editor-mono td:nth-child(5) {
    width: 4em;
}
`.trim();
	var trackStyleText = `
table.episodes-editor-mono {
    table-layout: fixed;
    width: 45em;
}

table.episodes-editor-mono input {
    width: 100%;
}

table.episodes-editor-mono input:invalid {
    background-color: pink;
}

table.episodes-editor-mono th:nth-child(1),
table.episodes-editor-mono td:nth-child(1),
table.episodes-editor-mono th:nth-child(2),
table.episodes-editor-mono td:nth-child(2) {
    width: 2em;
}

table.episodes-editor-mono th:nth-child(3),
table.episodes-editor-mono td:nth-child(3),
table.episodes-editor-mono th:nth-child(4),
table.episodes-editor-mono td:nth-child(4) {
    width: 12em;
}

table.episodes-editor-mono th:nth-child(5),
table.episodes-editor-mono td:nth-child(5) {
    width: 4em;
}
`.trim(), f = 0;
	Array.isArray;
	function u(e, t, n, o, i, u) {
		t || (t = {});
		var a, c, p = t;
		if ("ref" in p) for (c in p = {}, t) "ref" == c ? a = t[c] : p[c] = t[c];
		var l$1 = {
			type: e,
			props: p,
			key: n,
			ref: a,
			__k: null,
			__: null,
			__b: 0,
			__e: null,
			__c: null,
			constructor: void 0,
			__v: --f,
			__i: -1,
			__u: 0,
			__source: i,
			__self: u
		};
		if ("function" == typeof e && (a = e.defaultProps)) for (c in a) void 0 === p[c] && (p[c] = a[c]);
		return l.vnode && l.vnode(l$1), l$1;
	}
	//#endregion
	//#region src/bgm-eps-editor.tsx
	/**
	* bgm-decodeEPs-editor: 章节列表编辑器
	*/
	function initEditor(setting) {
		const columns = setting.getColumnOrder();
		const headers = setting.getColumnHeads();
		function appendStyle() {
			const style = document.createElement("style");
			style.textContent = setting.getStyleText();
			document.head.appendChild(style);
		}
		function bindEvents() {
			const summary = document.querySelector("#summary");
			if (!summary) {
				console.error("BgmEpisodesEditor: textarea#summary not found");
				return;
			}
			const tableContainer = document.createElement("div");
			summary.parentElement.insertBefore(tableContainer, summary);
			summary.addEventListener("input", (e) => {
				if (e.isTrusted) setTimeout(() => pushState(summary.value));
			});
			const states = [];
			function popState() {
				if (states.length > 1) {
					states.pop();
					applyState(states[states.length - 1]);
				}
			}
			function pushState(newState) {
				if (newState !== states[states.length - 1]) states.push(newState);
				while (states.length > 20) states.shift();
				applyState(newState);
			}
			function applyState(state) {
				J(/* @__PURE__ */ u(EpList, {
					current: state,
					pushState,
					popState
				}), tableContainer);
				summary.value = encodeEpisodes(decodeEpisodes(state));
			}
			pushState(summary.value);
		}
		/** 将章节列表转换为用于textarea# 的字符串 */
		const encodeEpisodes = (decodeEPs) => decodeEPs.map((e) => columns.map((c) => e[c] || "").join("|")).join("\n");
		const decodeEpisodes = (text) => text.split(/\n+/).map((l) => l.trim()).filter((l) => l).map((l) => {
			return l.split("|").reduce((row, v, index) => (row[columns[index]] = v, row), {});
		});
		class EpList extends x {
			constructor(..._args) {
				super(..._args);
				this.onkeydown = (ev) => {
					if (ev.key === "z" && xor(ev.ctrlKey, ev.metaKey) && !ev.altKey && !ev.shiftKey) {
						ev.preventDefault();
						this.props.popState();
					}
				};
				this.onPaste = (row, field) => (ev) => {
					const newText = ev && ev.clipboardData && ev.clipboardData.getData("text") || "";
					if (!newText) return;
					const lines = newText.split("\n");
					if (lines.length < 2) return;
					ev.preventDefault();
					const eps = this.decodeEPs();
					for (let r = row; r < eps.length && lines.length; r++) {
						const ep = eps[r];
						ep[field] = lines.shift();
					}
					this.props.pushState(encodeEpisodes(eps));
				};
				this.onInput = (row, field) => (ev) => {
					const newText = ev && ev.target && ev.target.value || "";
					if (newText.indexOf("|") !== -1) return;
					const eps = this.decodeEPs();
					eps[row][field] = newText;
					this.props.pushState(encodeEpisodes(eps));
				};
			}
			th() {
				return /* @__PURE__ */ u("tr", { children: headers.map((h) => /* @__PURE__ */ u("th", { children: h })) });
			}
			decodeEPs() {
				return decodeEpisodes(this.props.current);
			}
			tr() {
				return this.decodeEPs().map((ep, row) => /* @__PURE__ */ u("tr", { children: columns.map((f) => /* @__PURE__ */ u("td", { children: /* @__PURE__ */ u("input", {
					pattern: "[^|]*",
					value: ep[f] || "",
					onKeyDown: this.onkeydown,
					onPaste: this.onPaste(row, f),
					onInput: this.onInput(row, f)
				}) })) }));
			}
			render() {
				return /* @__PURE__ */ u("table", {
					class: "episodes-editor-mono",
					children: [this.th(), this.tr()]
				});
			}
		}
		return function init() {
			appendStyle();
			bindEvents();
		};
	}
	setTimeout(initEditor(getSetting()));
	function xor(b1, b2) {
		return !!(~~b1 ^ ~~b2);
	}
	//#endregion
})();
