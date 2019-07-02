// ==UserScript==
// @name         bangumi屏蔽绝交用户的言论
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @description   将屏蔽绝交用户的帖子、回复、吐槽等
// @version      0.1
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// @grant        none
// ==/UserScript==

(function() {
    let blacklist;
    if(localStorage.getItem('bangumi_user_blacklist'))
        blacklist = JSON.parse(localStorage.getItem('bangumi_user_blacklist'));
    else
        blacklist = [];
    $('.avatarNeue').each(function (){
        let match = this.style.backgroundImage.match(/(\d+)\.jpg/);
        let ID = match ? match[1].toString() : null;
        if(blacklist.includes(ID))
            $(this.parentNode.parentNode).hide();
    })

    //设置
    if(document.location.href.match(/settings\/privacy/)){
        blacklist = [];
        $('a').each(function (){
            let match = this.href.match(/(\d+)&gh/);
            let ID = match ? match[1].toString() : null;
            if(ID){
                blacklist.push(ID);
                localStorage.setItem('bangumi_user_blacklist',JSON.stringify(blacklist));
            }
        })
    }
})();
