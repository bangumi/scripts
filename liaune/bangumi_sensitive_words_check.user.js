// ==UserScript==
// @name         bangumi 敏感词检测
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @description   在发表新话题、日志、吐槽时进行敏感词检测
// @version      0.2
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// @grant        none
// ==/UserScript==

(function() {
    let Sensitive_words = ["手枪","步枪","医院","皮肤病","精神病","香烟","大麻","摇头丸","可卡因","海洛因","冰毒","春药","妓女","嫖娼","援交","找小姐","找小妹","上门服务","特殊服务",+
                           "商铺","批发","发票","贷款","作弊","代考","代开","办证","毕业证","学位证","窃听器"+
                           "手槍","步槍","醫院","皮膚病","精神病","香煙","大麻","搖頭丸","可卡因","海洛因","冰毒","春藥","妓女","嫖娼","援交","找小姐","找小妹","上門服務","特殊服務",+
                           "商鋪","批發","發票","貸款","作弊","代考","代開","辦證","畢業證","學位證","竊聽器"];
    function sensitive_check(obj){
        obj.on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = obj.val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        obj.val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
    }
    //发表新话题
    if(location.href.match(/new_topic|topic\/\d+\/edit/)){
        sensitive_check($("#title"));
        sensitive_check($("#content"));
    }
    //发表新日志
    if(location.href.match(/blog\/create|blog\/\d+\/edit/)){
        sensitive_check($("#title"));
        sensitive_check($("#tpc_content"));
    }
    //发表新的条目吐槽或讨论
    if(location.href.match(/subject\/\d+/)){
        sensitive_check($("#title"));
        sensitive_check($("#content"));
        sensitive_check($("#comment"));
    }
})();
