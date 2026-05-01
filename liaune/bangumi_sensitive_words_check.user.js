// ==UserScript==
// @name         bangumi 敏感词检测
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @description   在发表新话题、日志、吐槽时进行敏感词检测
// @version      0.4.3
// @author       Liaune
// @license      Liaune
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/*
// @grant        none
// ==/UserScript==

(function() {
	let Sensitive_words = [
		"白粉",
		"办证","辦證",
		"毕业证","畢業證",
		"冰毒",
		"步枪","步槍",
		"春药","春藥",
		"大发","大發",
		"大麻",
		"代开","代開",
		"代考",
		"贷款","貸款",
		"发票","發票",
		"海洛因",
		"妓女",
		"精神病",
		"可卡因",
		"批发","批發",
		"皮肤病","皮膚病",
		"嫖娼",
		"窃听器","竊聽器",
		"上门服务","上門服務",
		"商铺","商鋪",
		"手枪","手槍",
		"铁枪","鐵槍",
		"钢枪","鋼槍",
		"特殊服务","特殊服務",
		"騰訊",
		"香烟","香煙",
		"学位证","學位證",
		"摇头丸","搖頭丸",
		"医院","醫院",
		"隐形眼镜",
		"聊天记录",
		"援交",
		"找小姐",
		"找小妹",
		"作弊",
		"v信"];

	function sensitive_check(obj){
		obj.on('blur keyup input', function() {
			Sensitive_words.forEach( (el) => {
				let patt = new RegExp(el,"g");
				let text = obj.val();
				if(patt.exec(text)){
					if (confirm("发现敏感词："+el+",是否替换？")){
						let r = prompt("敏感词："+el+",替换为：", el);
						obj.val(text.replace(el,r));
					}
					else Sensitive_words.splice(Sensitive_words.indexOf(el),1);
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
