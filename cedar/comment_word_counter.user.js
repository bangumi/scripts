// ==UserScript==
// @name        简评字数统计
// @namespace   tv.bgm.cedar.wordcounter
// @version     1.0.1
// @description 统计简评字数
// @author      Cedar
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/subject/\d+(#;)?$/
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
#wordcountwrapper {
  margin: 0 0 8px 0;
}
#wordcountwrapper>span {
  padding: 0 5px;
}
`);

const total = 200;
var counter = $("#comment").val().length;
$("#collectBoxForm>.clearit").before(
	`<div id="wordcountwrapper"><span id="wordcounter">${counter}</span>/<span>${total}</span></div>`
);

// "input" event for paste action on mobile.
$("#comment").on('blur keyup input', function() {
	counter = $("#comment").val().length;
	$("#wordcounter").text(counter);
	if(counter > total)
		$("#wordcounter").css("color","red");
	else
		$("#wordcounter").css("color","");
});

/** version:
 *  ver 1.0.1   修改metadata(@include @namespace)
 *  ver 1.0     初始版本.
 */
