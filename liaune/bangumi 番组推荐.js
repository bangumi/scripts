// ==UserScript==
// @name         bangumi 番组推荐
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.0
// @description  面包番组推荐
// @author       Liaune
// @include     /^https?:\/\/((bangumi|bgm)\.tv|chii.in)\/subject\/\d+$/
// ==/UserScript==
(function() {
    const ID=window.location.href.split('/subject/')[1];
    let URL='https://search.bakery.moe/item/'+ID;
    const $anime = $('#columnSubjectHomeB');
    const $button = $(`
<h2 class="subtitle">
<a href="`+URL+`" target='_blank' class="l">面包番组推荐</a>
</h2>`);
   // $anime.find('.subject_section .subtitle').append($button);
    $button.insertAfter($anime.find('.subject_section .subtitle')[2]);
})();