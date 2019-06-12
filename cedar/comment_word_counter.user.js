// ==UserScript==
// @name        简评字数统计
// @namespace   tv.bgm.cedar.wordcounter
// @version     1.1
// @description 统计简评字数
// @author      Cedar
// @include     /^https?://((bgm|bangumi)\.tv|chii\.in)/subject/\d+(#;)?$/
// ==/UserScript==

const total = 200;
let $comment = $('#comment');
const getCount = () => $comment.val().length;

let $total = $(document.createElement('span')).css('padding', '0 5px').text(total);
let $wordcounter = $total.clone().text(getCount());
let $wordcounterWrapper = $(document.createElement('div'))
	.css('margin-bottom', '8px').append($wordcounter, '/', $total);
$("#collectBoxForm").children('.clearit').last().before($wordcounterWrapper);

// "input" event for paste action on mobile.
$comment.on('blur keyup input', function() {
	let count = getCount();
	$wordcounter.text(count);
	if(count > total)
		$wordcounter.css("color","red");
	else
		$wordcounter.css("color","");
});

/** version:
 *  ver 1.1     实现方法优化
 *  ver 1.0.1   修改metadata(@include @namespace)
 *  ver 1.0     初始版本.
 */
