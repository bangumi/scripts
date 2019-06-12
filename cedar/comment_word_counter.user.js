// ==UserScript==
// @name        简评字数统计
// @namespace   https://bgm.tv/dev/app/592
// @version     1.0
// @description 统计简评字数
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/subject/.*$/
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
