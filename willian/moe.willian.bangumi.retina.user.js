// ==UserScript==
// @name         Bangumi Retina Index
// @namespace    moe.willian.bangumi.retina
// @version      1.1.0
// @description  Retinize Index Page for retina
// @author       Willian
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)//
// @run-at       document-end
// ==/UserScript==

function retinize(){
    const empty_image = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    const re = /(\/pic\/(?:cover|user)\/)[gsm](\/)/;

    const $ = q => document.querySelector(q);
    const $All = q => document.querySelectorAll(q);
    // const size = jQuery($('#cloumnSubjectInfo .tinyCover img')).innerHeight();

    const getImageURL = (img) => {
        switch (img.nodeName) {
            case 'IMG':
                return img.getAttribute('src');
            case 'SPAN':
                return img.style['background-image'].slice(5, -2);
            default:
                throw TypeError('image only exept img or span element!');
        }
    }
    const retinizeImages = (images, size_fix_css, new_size='c', should_add_border=false, not_square_ok=false) => {
        for(const img of images){
            let src = getImageURL(img);
    
            if(re.test(src)){
                src = src.replace(re, `$1${new_size}$2`);
    
                img.classList.add('willian-retina-img-fix', size_fix_css);
                
                if(size_fix_css) img.classList.add(size_fix_css);
                if(should_add_border) img.classList.add('willian-retina-img-border');

                if(img.nodeName == 'IMG' && not_square_ok){
                    img.setAttribute('src', src);
                }else{
                    if(img.nodeName == 'IMG') img.setAttribute('src', empty_image);

                    img.style['background-image'] = `url(${src})`;
                }
            }
        }
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

    let info_box = $('#cloumnSubjectInfo');
    let images = info_box.querySelectorAll('.tinyCover img.grid');
    retinizeImages(images, 'willian-size-52');

    images = info_box.querySelectorAll('ul#prgSubjectList li img.grid');
    retinizeImages(images, 'willian-size-37');

    images = info_box.querySelectorAll('div.infoWrapper > .header > a > span > .image > img');
    retinizeImages(images, 'willian-size-100pa', 'c' , false, true);

    let timeline_box = $('#tmlContent')
    callObserveForChange(
        timeline_box, '#timeline li.tml_item > span.info img.rr', 
        retinizeImages, ['willian-size-48']
    );

    images = $All('#home_calendar .coverList > a > img');
    retinizeImages(images, 'willian-size-48');
    
    images = $All('#home_grp_tpc .sideTpcList > li > a.avatar > img');
    retinizeImages(images, 'willian-size-20', 'm' , false, true);

    images = $All('#home_subject_tpc .sideTpcList > li > a.avatar > img');
    retinizeImages(images, 'willian-size-20', 'm' , false, true);

    callObserveForChange(
        timeline_box, '#timeline li.tml_item > span.avatar span', 
        retinizeImages, ['.willian-size-not-decided', 'l', false, true]
    );
    
}
$(document).ready(retinize);
