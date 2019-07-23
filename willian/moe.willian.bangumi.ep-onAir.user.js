// ==UserScript==
// @name         Bangumi Episode On Air
// @namespace    moe.willian.bangumi.ep-onAir
// @version      0.0.1
// @description  Identify if a scheduled episode is still on air from play history
// @author       Willian
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)//
// @run-at       document-end
// ==/UserScript==

const lowerLimit = 3;
const factor = 5;

// median
function median(values) {
    values = values.slice(0).sort( function(a, b) {return a - b; } );

    return middle(values);
}

function middle(values) {
    var len = values.length;
    var half = Math.floor(len / 2);

    if(len % 2)
        return (values[half - 1] + values[half]) / 2.0;
    else
        return values[half];
}

// 本番
/* jshint jquery: false */
function onAir(){
    const $ = q => document.querySelector(q);
    const $All = q => document.querySelectorAll(q);

    const getComment = function getCommentCountFromRel(rel){
        return +$(rel).querySelector('span.tip > .cmt > .na').textContent.slice(1,-1);
        // throw Error(`Cannot get comments from rel: ${rel}`);
    };

    const callObserveForChange = (observee, selectors, func, args, should_not_call_rightaway=false)=>{
        if(!should_not_call_rightaway){
            let images = observee.querySelectorAll(selectors);
            func.apply(null, [images].concat(args));
        }

        if(window.MutationObserver){
            let observer = new MutationObserver((mutationsList, observer) => {
                for(let mutation of mutationsList) {
                    if (mutation.type == 'childList') {
                        images = observee.querySelectorAll(selectors);
                        func.apply(null, [images].concat(args));
                    }
                }
            });
    
            const config = { attributes: false, childList: true, subtree: false };
            observer.observe(observee, config);
    
            window.addEventListener('beforeunload', (event) => {
                observer.disconnect();
            });
        }
    };
    if(!window.MutationObserver){
        console.warn('[moe.willian.bangumi.retina] Browser does not support MutationObserver!');
    }
    
    const onLoad = function onLoad(){
        /* jshint jquery: true */
        const programs = $All('.prg_list');
        for(const prg of programs){
            const buttoms = Array.from(prg.querySelectorAll('li > .load-epinfo'));
            const airs = buttoms.filter(b=>b.classList.contains('epBtnAir'));
            if(airs.length > 0){
                console.log('should detect on air', prg);
                const medium = middle(
                    buttoms
                        .filter(b=> b.classList.contains('epBtnWatched') || b.classList.contains('epBtnAir') )
                        .filter(b=> b.hasAttribute('rel'))
                        .map(b=>getComment(b.getAttribute('rel')))
                        .sort()
                )
                const threshold = Math.min(medium/factor, lowerLimit);

                for(const btn of airs){
                    console.log(getComment(btn.getAttribute('rel')), threshold);
                    
                    if(getComment(btn.getAttribute('rel')) < threshold){
                        btn.classList.add('willian-epBtnOnAir');
                    }
                }
            }
            
        }
    }
    onLoad();
}
$(document).ready(onAir);