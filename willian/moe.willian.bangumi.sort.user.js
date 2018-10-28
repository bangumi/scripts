// ==UserScript==
// @name         Bangumi Sort Index
// @namespace    moe.willian.bangumi.sort
// @version      0.7.0
// @description  Sort Bangumi Slots
// @author       Willian
// @include     http://bangumi.tv/
// @include     http://bgm.tv/
// @include     https://bgm.tv/
// @include     http://chii.in/
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

    const listbox = $('#listWrapper ul#prgSubjectList');
    const list_original = listbox.querySelectorAll('#prgSubjectList > li');

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

    const getDate = function getDateTimeFromRel(rel){
        let castDate = Array.from($(rel).querySelector('span.tip').childNodes)
            .filter(e => e.nodeType == Node.TEXT_NODE)
            .map(e => e.textContent)
            .filter(t => t.includes(castKeyword));
        if(castDate.length){
            castDate = castDate[0];
            castDate = castDate.replace(`${castKeyword}:`, '');
            castDate = new Date(castDate);
            return castDate;
        }else{
            throw Error(`Cannot get date from rel: ${rel}`);
        }
    };

    const getOrder = function getFlatModeUIsInOrderOf(mode = 'smart'){
        let notCondidate = [];

        const ordered = Array.from(original).map(div => {
            let someEps = div.querySelectorAll('.prg_list .load-epinfo');
            let targetEp;
            if(mode == 'smart'){
                // remove watched
                someEps = Array.from(someEps).filter(d => !d.classList.contains("epBtnWatched"));
                if(someEps.length){
                    targetEp = someEps[0];
                }
            }else if(mode == 'update'){
                someEps = Array.from(someEps).filter(ep => {
                    const rel = ep.getAttribute('rel');
                    try{
                        const castDate = getDate(rel);
                        return castDate < perpared;
                    }catch(e){}
                    return false;
                });
                if(someEps.length){
                    targetEp = someEps.pop();
                }
            }

            if(targetEp){
                const rel = targetEp.getAttribute('rel');
                try{
                    const castDate = getDate(rel);
                    const orderTime = perpared - castDate;
                    if(orderTime > 0){
                        div.orderTime = orderTime;
                        return div;
                    }
                }catch(e){}
            }
            
            // Fallback
            notCondidate.push(div);
            return null;
        }).filter(d=>d).sort((a, b) => a.orderTime - b.orderTime);

        return [ordered, notCondidate];
    };
    const reorder = function getListModeUIsWithFlatUI(ordered){
        let orderDict = {};
        ordered.map((div, i)=>{
            const node = div.querySelector('.header .headerInner h3 a');
            if(node){
                orderDict[node.dataset.subjectId] = i;
            }
        });

        let notCondidate = [];
        const reordered = Array.from(list_original).map(div => {
            const node = div.querySelector('.title.textTip')
            if(node){
                const id = node.dataset.subjectId;
                if(id && orderDict.hasOwnProperty(id)){
                    div.orderIndice = orderDict[id];
                    return div;
                }
            }
            notCondidate.push(div);
            return null;
        }).filter(d=>d).sort((a, b) => a.orderIndice - b.orderIndice);

        return [reordered, notCondidate];
    };
    const orderIt = function smartOrUpdateOrderIt(mode){
        const [ordered , notCondidate] = getOrder(mode);

        for(const div of original){
            div.remove();
        }

        reset();
        for(const div of ordered){
            append(div);
        }
        for(const div of notCondidate){
            append(div);
        }

        //
        const [reordered, reNotCondidate] = reorder(ordered);

        for(const div of list_original){
            div.remove();
        }

        for(const div of reordered){
            listbox.appendChild(div);
        }
        for(const div of reNotCondidate){
            listbox.appendChild(div);
        }
    };
    const normal = function normalOrderIt(){
        for(const div of original){
            div.remove();
        }

        reset();
        for(const div of original){
            append(div);
        }

        //
        for(const div of list_original){
            div.remove();
        }

        for(const div of list_original){
            listbox.appendChild(div);
        }
    };
    const onLoad = function onLoad(){
        /* jshint jquery: true */
        // prgManagerMain.classList.contains('tinyModeWrapper')

        const orderUI = jQuery('<ul id="prgManagerOrder" class="categoryTab clearit rr"></ul>')[0];

        const normalUI = jQuery('<li><a href="javascript:void(0);" id="switchNormalOrder" title="修改順序" data-key="normal"><span>標準</span></a></li>')[0];
        const smartUI  = jQuery('<li><a href="javascript:void(0);" id="switchSmartOrder"  title="智障順序" data-key="smart" ><span>智能</span></a></li>')[0];
        const updateUI = jQuery('<li><a href="javascript:void(0);" id="switchUpdateOrder" title="更新順序" data-key="update"><span>更新</span></a></li>')[0];

        orderUI.appendChild(normalUI);
        orderUI.appendChild(smartUI);
        orderUI.appendChild(updateUI);

        prgManagerHeader.appendChild(orderUI);
        
        if(!localStorage['index-sort-order']){
            localStorage['index-sort-order'] = 'smart';
        }
        
        const optionUIs = jQuery(orderUI).find('li');
        const click = function onClick(mode){
            optionUIs.find('a').removeClass('focus'); //jQ
            let a;

            const firstTime = (typeof mode == 'string');
            if(firstTime){
                a = orderUI.querySelector(`a[data-key=${mode}]`);
            }else{
                a = this.querySelector(`a`);
                mode = a.dataset.key;
            }
            
            localStorage['index-sort-order'] = mode;
            switch(mode){
                case 'smart':  orderIt('smart');  break;
                case 'update': orderIt('update');  break;
                case 'normal': default: 
                    if(!firstTime) normal();
            }

            if(a) a.classList.add('focus');
        };

        optionUIs.click(click);
        
        const mode = localStorage['index-sort-order'];
        click(mode);
        
    }

    onLoad();
}

$(document).ready(bangumi_sort_index);

