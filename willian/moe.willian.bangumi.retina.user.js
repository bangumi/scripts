// ==UserScript==
// @name         Bangumi Retina Index
// @namespace    moe.willian.bangumi.retina
// @version      0.9.9
// @description  Retinize Index Page for retina
// @author       Willian
// @include     http://bangumi.tv/
// @include     http://bgm.tv/
// @include     https://bgm.tv/
// @include     http://chii.in/
// @run-at       document-end
// ==/UserScript==

function retinize(){
    const $ = q => document.querySelector(q);
    const $All = q => document.querySelectorAll(q);

    // const size = jQuery($('#cloumnSubjectInfo .tinyCover img')).innerHeight();
    const re = /(\/pic\/cover\/)[gs](\/)/;

    let images = $All('#cloumnSubjectInfo .tinyCover img.grid');
    for(const img of images){
        let src = img.getAttribute('src');

        if(re.test(src)){
            src = src.replace(re, '$1c$2');

            img.classList.add('willian-retina-img-fix', 'willian-size-1' ,'willian-retina-img-border');
            img.removeAttribute('src');

            img.style['background-image'] = `url(${src})`;
        }
    }

    images = $All('ul#prgSubjectList li img.grid');
    for(const img of images){
        let src = img.getAttribute('src');

        if(re.test(src)){
            src = src.replace(re, '$1c$2');

            img.classList.add('willian-retina-img-fix', 'willian-size-2','willian-retina-img-border');
            img.removeAttribute('src');

            img.style['background-image'] = `url(${src})`;
        }
    }

    images = $All('#cloumnSubjectInfo div.blockMode > .header > a > span > .image > img');
    for(const img of images){
        let src = img.getAttribute('src');

        if(re.test(src)){
            src = src.replace(re, '$1c$2');

            img.classList.add('willian-retina-img-fix', 'willian-size-3');
            img.setAttribute('src', src);
        }
    }
    images = $All('#home_calendar .coverList > a > img');
    for(const img of images){
        let src = img.getAttribute('src');

        if(re.test(src)){
            src = src.replace(re, '$1c$2');

            img.classList.add('willian-retina-img-fix', 'willian-size-4');
            img.removeAttribute('src');

            img.style['background-image'] = `url(${src})`;
        }
    }

}
$(document).ready(retinize);
