// ==UserScript==
// @name         Bangumi Sort Index
// @namespace    moe.willian.bangumi.sort
// @version      0.4.2
// @description  Sort Bangumi Slots
// @author       Willian
// @match        http*://bgm.tv/
// @run-at       document-end
// ==/UserScript==


// OPTIONS
const castKeyword = '首播';
const perpareDuraion = 24; // hours

// POLYFILL
if(!Date.prototype.addHours){
    Date.prototype.addHours= function(h){
        this.setHours(this.getHours()+h);
        return this;
    }
}
if (!window.localStorage) {
    Object.defineProperty(window, "localStorage", new (function () {
      var aKeys = [], oStorage = {};
      Object.defineProperty(oStorage, "getItem", {
        value: function (sKey) { return this[sKey] ? this[sKey] : null; },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "key", {
        value: function (nKeyId) { return aKeys[nKeyId]; },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "setItem", {
        value: function (sKey, sValue) {
          if(!sKey) { return; }
          document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "length", {
        get: function () { return aKeys.length; },
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "removeItem", {
        value: function (sKey) {
          if(!sKey) { return; }
          document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "clear", {
        value: function () {
          if(!aKeys.length) { return; }
          for (var sKey in aKeys) {
            document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          }
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
      this.get = function () {
        var iThisIndx;
        for (var sKey in oStorage) {
          iThisIndx = aKeys.indexOf(sKey);
          if (iThisIndx === -1) { oStorage.setItem(sKey, oStorage[sKey]); }
          else { aKeys.splice(iThisIndx, 1); }
          delete oStorage[sKey];
        }
        for (aKeys; aKeys.length > 0; aKeys.splice(0, 1)) { oStorage.removeItem(aKeys[0]); }
        for (var aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++) {
          aCouple = aCouples[nIdx].split(/\s*=\s*/);
          if (aCouple.length > 1) {
            oStorage[iKey = unescape(aCouple[0])] = unescape(aCouple[1]);
            aKeys.push(iKey);
          }
        }
        return oStorage;
      };
      this.configurable = false;
      this.enumerable = true;
    })());
}
// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode !== null)
            this.parentNode.removeChild(this);
        }
      });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);


// 本番
/* jshint jquery: false */
function bangumi_sort_index(){
    const $ = q => document.querySelector(q);
    const $All = q => document.querySelectorAll(q);

    const infobox = $('#cloumnSubjectInfo > .infoWrapper_tv');
    const original = infobox.querySelectorAll('[id^=subjectPanel_]');
    const prgManagerHeader = $('#prgManagerHeader');
    const prgManagerMain = $('#prgManagerMain');

    const now = new Date();
    const perpared = now.addHours(perpareDuraion);

    let odd = true;
    const reset = function resetOddEven(){
        odd = true;
    };
    const append = function appendDivTo(div, container = infobox){
        div.classList.remove('odd', 'even')
        div.classList.add(odd? 'odd':'even')
        container.appendChild(div);
        odd = !odd;
    };

    const smart = function smartOrderIt(mode = 'smart'){
        let notCondidate = [];

        const ordered = Array.from(original).map(div => {
            div.remove();
            let someEps = div.querySelectorAll('.prg_list .load-epinfo');
            if(mode == 'smart'){
                // remove watched
                someEps = Array.from(someEps).filter(d => !d.classList.contains("epBtnWatched"));
            }

            if(someEps.length){
                const rel = someEps[0].getAttribute('rel');
                let castDate = Array.from($(rel).querySelector('span.tip').childNodes)
                    .filter(e => e.nodeType == Node.TEXT_NODE)
                    .map(e => e.textContent)
                    .filter(t => t.includes(castKeyword));
                if(castDate.length){
                    castDate = castDate[0];
                    castDate = castDate.replace(`${castKeyword}:`, '');
                    castDate = new Date(castDate);
                    const orderTime = perpared - castDate;
                    if(orderTime > 0){
                        div.orderTime = orderTime;
                        return div;
                    }
                }
            }
            // Fallback
            notCondidate.push(div);
            return null;
        }).filter(d=>d).sort((a, b) => a.orderTime - b.orderTime);

        reset();
        for(const div of ordered){
            append(div);
        }
        for(const div of notCondidate){
            append(div);
        }
    }
    const normal = function normalOrderIt(){
        for(const div of original){
            div.remove();
        }

        reset();
        for(const div of original){
            append(div);
        }
    };
    const onLoad = function onLoad(){
        /* jshint jquery: true */
        if(prgManagerMain.classList.contains('tinyModeWrapper')){

            const orderUI = jQuery('<ul id="prgManagerOrder" class="categoryTab clearit rr"></ul>');
    
            const normalUI = jQuery('<li><a href="javascript:void(0);" id="switchNormalOrder" title="修改順序" data-key="normal"><span>標準</span></a></li>');
            const smartUI  = jQuery('<li><a href="javascript:void(0);" id="switchSmartOrder"  title="智障順序" data-key="smart" ><span>智能</span></a></li>');
    
            normalUI.appendTo(orderUI);
            smartUI.appendTo(orderUI);
            orderUI.appendTo(prgManagerHeader);
            
            if(!localStorage['index-sort-order']){
                localStorage['index-sort-order'] = 'smart';
            }
            
            const optionUIs = orderUI.find('li');
            optionUIs.click(function(){
                optionUIs.find('a').removeClass('focus');

                const a = this.querySelector('a');
                const mode = a.dataset.key;
                localStorage['index-sort-order'] = mode;
                switch(mode){
                    case 'smart': smart(); break;
                    case 'normal': default: normal(); break;
                }
                a.classList.add('focus');
            });
            
            const mode = localStorage['index-sort-order'];
            optionUIs.find(`a[data-key=${mode}]`).click();
        }
    }

    onLoad();
}

$(document).ready(bangumi_sort_index);

