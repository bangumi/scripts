// ==UserScript==
// @name         bangumi 敏感词检测
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @description   在发表新话题、日志、吐槽时进行敏感词检测
// @version      0.1
// @author       Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// @grant        none
// ==/UserScript==

(function() {
    let Sensitive_words = ["手枪","步枪","医院","皮肤病","精神病","香烟","大麻","摇头丸","可卡因","海洛因","冰毒","春药","妓女","嫖娼","援交","找小姐","找小妹","上门服务","特殊服务","商铺","批发","发票","贷款","作弊","代考","代开","办证","窃听器"];
    //发表新话题
    if(location.href.match(/new_topic|topic\/\d+\/edit/)){
        $("#title").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#title").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#title").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
        $("#content").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#content").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#content").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
    }
    //发表新日志
    if(location.href.match(/blog\/create|blog\/\d+\/edit/)){
        $("#title").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#title").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#title").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
        $("#tpc_content").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#tpc_content").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#tpc_content").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
    }
    //发表新的条目吐槽或讨论
    if(location.href.match(/subject\/\d+/)){
        $("#title").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#title").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#title").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
        $("#content").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#content").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#content").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
        $("#comment").on('blur keyup input', function() {
            Sensitive_words.forEach( (el) => {
                let patt = new RegExp(el,"g");
                let text = $("#comment").val();
                if(patt.exec(text)){
                    let r = confirm("发现敏感词："+el+",是否删除该词？");
                    if(r){
                        $("#comment").val(text.replace(el,''));
                    }
                    else {
                        Sensitive_words.splice(Sensitive_words.indexOf(el), 1);
                    }
                }
            });
        });
    }
})();
