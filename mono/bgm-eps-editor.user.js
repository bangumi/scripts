// ==UserScript==
// @name         bgm-eps-editor
// @namespace    https://github.com/bangumi/scripts/tree/master/mono
// @version      3
// @description  章节列表编辑器
// @author       mono <momocraft@gmail.com>
// @match        /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/subject\/\d+\/ep\/edit_batch/
// @grant        none
// ==/UserScript==
(function(a){function b(d){if(c[d])return c[d].exports;var e=c[d]={i:d,l:!1,exports:{}};return a[d].call(e.exports,e,e.exports,b),e.l=!0,e.exports}var c={};return b.m=a,b.c=c,b.d=function(a,c,d){b.o(a,c)||Object.defineProperty(a,c,{configurable:!1,enumerable:!0,get:d})},b.n=function(a){var c=a&&a.__esModule?function(){return a['default']}:function(){return a};return b.d(c,'a',c),c},b.o=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)},b.p='',b(b.s=0)})([function(a,b,c){'use strict';Object.defineProperty(b,'__esModule',{value:!0});var d,e=c(1),g=c(2),f=c.n(g);(function(a){function b(){var a=document.createElement('style');a.textContent='\ntable.episodes-editor-mono {\n    table-layout: fixed;\n    width: 45em;\n}\n\ntable.episodes-editor-mono input {\n    width: 100%;\n}\n\ntable.episodes-editor-mono input:invalid {\n    background-color: pink;\n}\n\ntable.episodes-editor-mono th:nth-child(1),\ntable.episodes-editor-mono td:nth-child(1) {\n    width: 3em;\n}\n\ntable.episodes-editor-mono th:nth-child(2),\ntable.episodes-editor-mono td:nth-child(2),\ntable.episodes-editor-mono th:nth-child(3),\ntable.episodes-editor-mono td:nth-child(3) {\n    width: 10em;\n}\n\ntable.episodes-editor-mono th:nth-child(4),\ntable.episodes-editor-mono td:nth-child(4) {\n    width: 2.5em;\n}\n\ntable.episodes-editor-mono th:nth-child(5),\ntable.episodes-editor-mono td:nth-child(5) {\n    width: 4em;\n}\n'.trim(),document.head.appendChild(a)}function c(){function a(){1<j.length&&(j.pop(),c(j[j.length-1]))}function b(a){for(a!==j[j.length-1]&&j.push(a);20<j.length;)j.shift();c(a)}function c(c){console.log('applying',c),g.render(g.h(i,{current:c,pushState:b,popState:a}),h,h.firstElementChild),e.value=d(f(c))}var e=document.querySelector('#summary');if(!e)return void console.error('BgmEpisodesEditor: textarea#summary not found');var h=document.createElement('div');e.parentElement.insertBefore(h,e),e.addEventListener('input',function(a){a.isTrusted&&setTimeout(function(){return b(e.value)})});var j=[];b(e.value)}var d=function(a){return a.map(function(a){return[a.no||'',a.titleRaw||'',a.titleZh||'',a.duration||'',a.airDate||''].join('|')}).join('\n')},f=function(a){return a.split(/\n+/).map(function(a){return a.trim()}).filter(function(a){return a}).map(function(a){var b=a.split('|'),c=b[0],d=b[1],e=b[2],f=b[3],g=b[4];return{no:c,titleRaw:d,titleZh:e,duration:f,airDate:g}})},h=['no','titleRaw','titleZh','duration','airDate'],i=function(a){function b(){var b=null!==a&&a.apply(this,arguments)||this;return b.onkeydown=function(a){'z'!==a.key||!a.ctrlKey||a.altKey||a.shiftKey||(a.preventDefault(),b.props.popState())},b.onPaste=function(a,c){return function(e){var f=e&&e.clipboardData&&e.clipboardData.getData('text')||'';if(f){var g=f.split('\n');if(!(2>g.length)){e.preventDefault();for(var h,i=b.decodeEPs(),j=a;j<i.length&&g.length;j++)h=i[j],h[c]=g.shift();b.props.pushState(d(i))}}}},b.onInput=function(a,c){return function(e){var f=e&&e.target&&e.target.value||'';if(-1===f.indexOf('|')){var g=b.decodeEPs();g[a][c]=f,b.props.pushState(d(g))}}},b}return e.a(b,a),b.prototype.th=function(){return g.h('tr',null,g.h('th',null,'\u7AE0\u8282\u7F16\u53F7'),g.h('th',null,'\u539F\u6587\u6807\u9898'),g.h('th',null,'\u7B80\u4F53\u4E2D\u6587\u6807\u9898'),g.h('th',null,'\u65F6\u957F'),g.h('th',null,'\u653E\u9001\u65E5\u671F'))},b.prototype.decodeEPs=function(){return f(this.props.current)},b.prototype.tr=function(){var a=this;return this.decodeEPs().map(function(b,c){return g.h('tr',null,h.map(function(d){return g.h('td',null,g.h('input',{pattern:'[^|]*',value:b[d]||'',onKeyDown:a.onkeydown,onPaste:a.onPaste(c,d),onInput:a.onInput(c,d)}))}))})},b.prototype.render=function(){return g.h('table',{class:'episodes-editor-mono'},this.th(),this.tr())},b}(g.Component);a.init=function(){b(),c()}})(d||(d={})),setTimeout(d.init)},function(a,b){'use strict';b.a=function(a,d){function b(){this.constructor=a}c(a,d),a.prototype=null===d?Object.create(d):(b.prototype=d.prototype,new b)};var c=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,c){a.__proto__=c}||function(a,c){for(var b in c)c.hasOwnProperty(b)&&(a[b]=c[b])},d=Object.assign||function(a){for(var b,c=1,d=arguments.length;c<d;c++)for(var e in b=arguments[c],b)Object.prototype.hasOwnProperty.call(b,e)&&(a[e]=b[e]);return a}},function(a){!function(){'use strict';function b(){}function c(a,c){var d,e,f,g,h=G;for(g=arguments.length;2<g--;)F.push(arguments[g]);for(c&&null!=c.children&&(!F.length&&F.push(c.children),delete c.children);F.length;)if((e=F.pop())&&void 0!==e.pop)for(g=e.length;g--;)F.push(e[g]);else(!0===e||!1===e)&&(e=null),(f='function'!=typeof a)&&(null==e?e='':'number'==typeof e?e+='':'string'!=typeof e&&(f=!1)),f&&d?h[h.length-1]+=e:h===G?h=[e]:h.push(e),d=f;var i=new b;return i.nodeName=a,i.children=h,i.attributes=null==c?void 0:c,i.key=null==c?void 0:c.key,void 0!==E.vnode&&E.vnode(i),i}function d(a,b){for(var c in b)a[c]=b[c];return a}function e(a){!a.__d&&(a.__d=!0)&&1==I.push(a)&&(E.debounceRendering||setTimeout)(f)}function f(){var a,b=I;for(I=[];a=b.pop();)a.__d&&A(a)}function g(a,b,c){return'string'==typeof b||'number'==typeof b?void 0!==a.splitText:'string'==typeof b.nodeName?!a._componentConstructor&&i(a,b.nodeName):c||a._componentConstructor===b.nodeName}function i(a,b){return a.__n===b||a.nodeName.toLowerCase()===b.toLowerCase()}function j(a){var b=d({},a.attributes);b.children=a.children;var c=a.nodeName.defaultProps;if(void 0!==c)for(var e in c)void 0===b[e]&&(b[e]=c[e]);return b}function k(a,b){var c=b?document.createElementNS('http://www.w3.org/2000/svg',a):document.createElement(a);return c.__n=a,c}function l(a){a.parentNode&&a.parentNode.removeChild(a)}function m(a,b,c,d,e){if('className'===b&&(b='class'),'key'===b);else if('ref'===b)c&&c(null),d&&d(a);else if('class'===b&&!e)a.className=d||'';else if('style'===b){if(d&&'string'!=typeof d&&'string'!=typeof c||(a.style.cssText=d||''),d&&'object'==typeof d){if('string'!=typeof c)for(var f in c)f in d||(a.style[f]='');for(var f in d)a.style[f]='number'==typeof d[f]&&!1===H.test(f)?d[f]+'px':d[f]}}else if('dangerouslySetInnerHTML'===b)d&&(a.innerHTML=d.__html||'');else if('o'==b[0]&&'n'==b[1]){var g=b!==(b=b.replace(/Capture$/,''));b=b.toLowerCase().substring(2),d?!c&&a.addEventListener(b,o,g):a.removeEventListener(b,o,g),(a.__l||(a.__l={}))[b]=d}else if('list'!==b&&'type'!==b&&!e&&b in a)n(a,b,null==d?'':d),(null==d||!1===d)&&a.removeAttribute(b);else{var h=e&&b!==(b=b.replace(/^xlink\:?/,''));null==d||!1===d?h?a.removeAttributeNS('http://www.w3.org/1999/xlink',b.toLowerCase()):a.removeAttribute(b):'function'!=typeof d&&(h?a.setAttributeNS('http://www.w3.org/1999/xlink',b.toLowerCase(),d):a.setAttribute(b,d))}}function n(a,b,c){try{a[b]=c}catch(a){}}function o(a){return this.__l[a.type](E.event&&E.event(a)||a)}function p(){for(var a;a=J.pop();)E.afterMount&&E.afterMount(a),a.componentDidMount&&a.componentDidMount()}function q(a,b,c,d,e,f){K++||(L=null!=e&&void 0!==e.ownerSVGElement,M=null!=a&&!('__preactattr_'in a));var g=r(a,b,c,d,f);return e&&g.parentNode!==e&&e.appendChild(g),--K||(M=!1,!f&&p()),g}function r(a,b,c,d,e){var f=a,g=L;if(null==b&&(b=''),'string'==typeof b)return a&&void 0!==a.splitText&&a.parentNode&&(!a._component||e)?a.nodeValue!=b&&(a.nodeValue=b):(f=document.createTextNode(b),a&&(a.parentNode&&a.parentNode.replaceChild(f,a),t(a,!0))),f.__preactattr_=!0,f;if('function'==typeof b.nodeName)return B(a,b,c,d);if(L='svg'===b.nodeName||'foreignObject'!==b.nodeName&&L,(!a||!i(a,b.nodeName+''))&&(f=k(b.nodeName+'',L),a)){for(;a.firstChild;)f.appendChild(a.firstChild);a.parentNode&&a.parentNode.replaceChild(f,a),t(a,!0)}var h=f.firstChild,j=f.__preactattr_||(f.__preactattr_={}),l=b.children;return!M&&l&&1===l.length&&'string'==typeof l[0]&&null!=h&&void 0!==h.splitText&&null==h.nextSibling?h.nodeValue!=l[0]&&(h.nodeValue=l[0]):(l&&l.length||null!=h)&&s(f,l,c,d,M||null!=j.dangerouslySetInnerHTML),v(f,b.attributes,j),L=g,f}function s(a,b,d,e,f){var h,j,c,k,m=a.childNodes,n=[],o={},p=0,q=0,s=m.length,u=0,v=b?b.length:0;if(0!==s)for(var w=0;w<s;w++){var i=m[w],x=i.__preactattr_,y=v&&x?i._component?i._component.__k:x.key:null;null==y?(x||(void 0===i.splitText?f:!f||i.nodeValue.trim()))&&(n[u++]=i):(p++,o[y]=i)}if(0!==v)for(var w=0;w<v;w++){c=b[w],k=null;var y=c.key;if(null!=y)p&&void 0!==o[y]&&(k=o[y],o[y]=void 0,p--);else if(!k&&q<u)for(h=q;h<u;h++)if(void 0!==n[h]&&g(j=n[h],c,f)){k=j,n[h]=void 0,h===u-1&&u--,h===q&&q++;break}k=r(k,c,d,e),k&&k!==a&&(w>=s?a.appendChild(k):k!==m[w]&&(k===m[w+1]?l(m[w]):a.insertBefore(k,m[w]||null)))}if(p)for(var w in o)void 0!==o[w]&&t(o[w],!1);for(;q<=u;)void 0!==(k=n[u--])&&t(k,!1)}function t(a,b){var c=a._component;c?C(c):(null!=a.__preactattr_&&a.__preactattr_.ref&&a.__preactattr_.ref(null),(!1===b||null==a.__preactattr_)&&l(a),u(a))}function u(a){for(a=a.lastChild;a;){var b=a.previousSibling;t(a,!0),a=b}}function v(a,b,c){for(var d in c)b&&null!=b[d]||null==c[d]||m(a,d,c[d],c[d]=void 0,L);for(d in b)'children'===d||'innerHTML'===d||d in c&&b[d]===('value'===d||'checked'===d?a[d]:c[d])||m(a,d,c[d],c[d]=b[d],L)}function w(a){var b=a.constructor.name;(N[b]||(N[b]=[])).push(a)}function x(a,b,c){var d,e=N[a.name];if(a.prototype&&a.prototype.render?(d=new a(b,c),D.call(d,b,c)):(d=new D(b,c),d.constructor=a,d.render=y),e)for(var f=e.length;f--;)if(e[f].constructor===a){d.__b=e[f].__b,e.splice(f,1);break}return d}function y(a,b,c){return this.constructor(a,c)}function z(a,b,c,d,f){a.__x||(a.__x=!0,(a.__r=b.ref)&&delete b.ref,(a.__k=b.key)&&delete b.key,!a.base||f?a.componentWillMount&&a.componentWillMount():a.componentWillReceiveProps&&a.componentWillReceiveProps(b,d),d&&d!==a.context&&(!a.__c&&(a.__c=a.context),a.context=d),!a.__p&&(a.__p=a.props),a.props=b,a.__x=!1,0!==c&&(1!==c&&!1===E.syncComponentUpdates&&a.base?e(a):A(a,1,f)),a.__r&&a.__r(a))}function A(a,b,c,e){if(!a.__x){var f,g,h,i=a.props,k=a.state,l=a.context,m=a.__p||i,n=a.__s||k,o=a.__c||l,r=a.base,s=a.__b,u=r||s,v=a._component,w=!1;if(r&&(a.props=m,a.state=n,a.context=o,2!==b&&a.shouldComponentUpdate&&!1===a.shouldComponentUpdate(i,k,l)?w=!0:a.componentWillUpdate&&a.componentWillUpdate(i,k,l),a.props=i,a.state=k,a.context=l),a.__p=a.__s=a.__c=a.__b=null,a.__d=!1,!w){f=a.render(i,k,l),a.getChildContext&&(l=d(d({},l),a.getChildContext()));var y,B,D=f&&f.nodeName;if('function'==typeof D){var F=j(f);g=v,g&&g.constructor===D&&F.key==g.__k?z(g,F,1,l,!1):(y=g,a._component=g=x(D,F,l),g.__b=g.__b||s,g.__u=a,z(g,F,0,l,!1),A(g,1,c,!0)),B=g.base}else h=u,y=v,y&&(h=a._component=null),(u||1===b)&&(h&&(h._component=null),B=q(h,f,l,c||!r,u&&u.parentNode,!0));if(u&&B!==u&&g!==v){var G=u.parentNode;G&&B!==G&&(G.replaceChild(B,u),!y&&(u._component=null,t(u,!1)))}if(y&&C(y),a.base=B,B&&!e){for(var H=a,I=a;I=I.__u;)(H=I).base=B;B._component=H,B._componentConstructor=H.constructor}}if(!r||c?J.unshift(a):!w&&(p(),a.componentDidUpdate&&a.componentDidUpdate(m,n,o),E.afterUpdate&&E.afterUpdate(a)),null!=a.__h)for(;a.__h.length;)a.__h.pop().call(a);K||e||p()}}function B(a,b,d,e){for(var f=a&&a._component,c=f,g=a,h=f&&a._componentConstructor===b.nodeName,i=h,k=j(b);f&&!i&&(f=f.__u);)i=f.constructor===b.nodeName;return f&&i&&(!e||f._component)?(z(f,k,3,d,e),a=f.base):(c&&!h&&(C(c),a=g=null),f=x(b.nodeName,k,d),a&&!f.__b&&(f.__b=a,g=null),z(f,k,1,d,e),a=f.base,g&&a!==g&&(g._component=null,t(g,!1))),a}function C(a){E.beforeUnmount&&E.beforeUnmount(a);var b=a.base;a.__x=!0,a.componentWillUnmount&&a.componentWillUnmount(),a.base=null;var c=a._component;c?C(c):b&&(b.__preactattr_&&b.__preactattr_.ref&&b.__preactattr_.ref(null),a.__b=b,l(b),w(a),u(b)),a.__r&&a.__r(null)}function D(a,b){this.__d=!0,this.context=b,this.props=a,this.state=this.state||{}}var E={},F=[],G=[],H=/acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i,I=[],J=[],K=0,L=!1,M=!1,N={};d(D.prototype,{setState:function(a,b){var c=this.state;this.__s||(this.__s=d({},c)),d(c,'function'==typeof a?a(c,this.props):a),b&&(this.__h=this.__h||[]).push(b),e(this)},forceUpdate:function(a){a&&(this.__h=this.__h||[]).push(a),A(this,2)},render:function(){}});var O={h:c,createElement:c,cloneElement:function(a,b){return c(a.nodeName,d(d({},a.attributes),b),2<arguments.length?[].slice.call(arguments,2):a.children)},Component:D,render:function(a,b,c){return q(c,a,{},!1,b,!1)},rerender:f,options:E};a.exports=O}()}]);
//# sourceMappingURL=bgm-eps-editor.min.map