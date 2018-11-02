// ==UserScript==
// @name        Bangumi_Collect_Easy_Edit
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @author       liaune
// @description  简易修改收藏条目
// @include     /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/\S+\/list\/\S+\/(collect).*$/
// @version     1.1
// @grant       none
// ==/UserScript==

(function() {
    let You=document.querySelectorAll('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1];
    let User =window.location.href.match(/\/list\/(\S+)\//)? window.location.href.match(/\/list\/(\S+)\//)[1]: null;
    if(You != User) return;
    const securitycode = $('#badgeUserPanel a')[11].href.split('/logout/')[1].toString();
    $('#browserTools').append('<a id="modifyCollect" class="chiiBtn" href="#">Edit</a>');
    let totalItems = 0,savedItems = 0;
    $('#modifyCollect').click(function() {
        $(this).remove();
        let itemsList = document.querySelectorAll('#browserItemList li.item');
        itemsList.forEach( (elem, i) => {
            let itemid = elem.querySelector('a.subjectCover').href.split('/subject/')[1];
            //rating
            let User_rate = elem.querySelectorAll('.inner .collectInfo span')[0].className;
            let User_Point=User_rate ? (User_rate.match(/sstars(\d+)/)? User_rate.match(/sstars(\d+)/)[1]:''):'';
            let showrating = document.createElement('span');showrating.className = 'tip_j';showrating.textContent = "评分：";
            elem.querySelector('.inner .collectInfo').insertBefore(showrating,elem.querySelector('.inner .collectInfo span.tip_j'));
            let rating = document.createElement('input');rating.id='rating';rating.type='text';$(rating).css({width:'30px',border:'solid 1px #E1E1E1'});
            rating.value=User_Point;
            $(rating).insertAfter(showrating);
            rating.addEventListener('blur',function(){
                $.post('/subject/' + itemid + '/interest/update?gh=' + securitycode, {status: 'collect',rating: rating.value});
            });
            $(elem.querySelector('.inner .collectInfo .starsinfo')).remove();
            //tags
            let tags = elem.querySelector('.inner .collectInfo .tip');
            let tags1 = document.createElement('input');tags1.type='text';$(tags1).css({width:'200px',height:'20px',border:'solid 1px #E1E1E1',borderRadius: '5px'});
            if(!tags){
                tags=document.createElement('span');tags.className = 'tip';tags.textContent = " 标签： ";
                $(elem).find('.collectInfo').append('<span class="tip_i">/</span>');
                $(elem).find('.collectInfo').append(tags);
                $(elem).find('.collectInfo').append(tags1);
            }
            else{
                 let b=tags.textContent.split(' '),a = '';
                 for(i=2;i<b.length-1;i++) a = a + b[i] + ' ';
                 tags.textContent = " 标签： ";
                 tags1.value = a;
                 $(elem).find('.collectInfo').append(tags1);
            }
            tags1.addEventListener('blur',function(){
                $.post('/subject/' + itemid + '/interest/update?gh=' + securitycode, { status: 'collect', rating: rating.value, tags: tags1.value.trim() });
            });
            //comment
            if($(elem).find('.text').length === 0)
                $(elem).find('.inner').append('<div id="comment_box"><div class="item"><div style="float:none;" class="text_main_even"><div class="text"><br></div><div class="text_bottom"></div></div></div></div>');
            let comment = $(elem).find('.text')[0];
            $(comment).attr('contenteditable', 'true');
            comment.addEventListener('blur',function(){
                $.post('/subject/' + itemid + '/interest/update?gh=' + securitycode, { status: 'collect',rating: rating.value,tags: tags1.value.trim(),comment: $(comment).text().trim()});
            });
        });
    });
})();
