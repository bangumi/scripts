// ==UserScript==
// @name         TinyGrail Helper
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      1.5.1
// @description  为小圣杯增加一些小功能：角色页面显示角色发行价，显示拍卖情况，突出显示自己圣殿，显示各级圣殿数量，关注角色，关注竞拍，查看往期竞拍，自动拆单,合并相同时间订单；股息高于低保隐藏签到
// @author       Liaune,Cedar
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(user|character|rakuen\/topiclist|rakuen\/home|rakuen\/topic\/crt).*
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
ul.timelineTabs li a {
margin: 2px 0 0 0;
padding: 5px 10px 5px 10px;
}

#TB_window img.cover{
max-height: 90vmin;
}

img.cover {
background-color: transparent;
}

.assets .my_temple.item .card {
box-shadow: 3px 3px 5px #FFEB3B;
border: 1px solid #FFC107;
}

html[data-theme='dark'] .assets .my_temple.item .card {
box-shadow: 0px 0px 15px #FFEB3B;
border: 1px solid #FFC107;
}

.assets .my_temple.item .name a {
font-weight: bold;
color: #0084b4;
}

#grail .temple_list .item {
margin: 5px 5px 5px 0;
width: 107px;
}

.assets_box .item {
margin: 5px 5px 5px 0;
width: 90px;
}

#lastTemples .assets .item {
margin: 5px 5px 5px 0;
width: 107px;
}

.item .card {
width: 105px;
height: 140px;
}

.assets_box .item .card {
width: 90px;
height: 120px;
}

.my_auction {
color: #ffa7cc;
margin-right: 5px;
}

.user_auction {
color: #a7e3ff;
margin-right: 5px;
}

html[data-theme='dark'] #grailBox .title {
background-color: transparent;
}

#grailBox .trade_box button {
min-width: 50px;
padding: 0 9px;
}
`);
const api = 'https://tinygrail.com/api/';
let lastEven = false;

function getData(url, callback) {
	if (!url.startsWith('http'))
		url = api + url;
	$.ajax({
		url: url,
		type: 'GET',
		xhrFields: { withCredentials: true },
		success: callback
	});
}

function postData(url, data, callback) {
	let d = JSON.stringify(data);
	if (!url.startsWith('http'))
		url = api + url;
	$.ajax({
		url: url,
		type: 'POST',
		contentType: 'application/json',
		data: d,
		xhrFields: { withCredentials: true },
		success: callback
	});
}

function renderCharacterDepth(chara) {
	var depth = `<small class="raise">+${formatNumber(chara.Bids, 0)}</small><small class="fall">-${formatNumber(chara.Asks, 0)}</small><small class="even">${formatNumber(chara.Change, 0)}</small>`
	return depth;
}

function renderCharacterTag(chara, item) {
	var id = chara.Id;
	var flu = '--';
	var tclass = 'even';
	if (chara.Fluctuation > 0) {
		tclass = 'raise';
		flu = `+${formatNumber(chara.Fluctuation * 100, 2)}%`;
	} else if (chara.Fluctuation < 0) {
		tclass = 'fall';
		flu = `${formatNumber(chara.Fluctuation * 100, 2)}%`;
	}

	var tag = `<div class="tag ${tclass}" title="₵${formatNumber(chara.MarketValue, 0)} / ${formatNumber(chara.Total, 0)}">₵${formatNumber(chara.Current, 2)} ${flu}</div>`
	return tag;
}

function renderBadge(item) {
	var badge = '';
	if (item.Level > 1) {
		if (item.Type == 1)
			badge = `<span class="badge" title="${formatNumber(item.Rate, 1)}倍分红剩余${item.Bonus}期">lv${item.Level}</span>`;
		else
			badge = `<span class="badge">lv${item.Level}</span>`;
	} else if (item.Type == 1) {
		badge = `<span class="badge new" title="${formatNumber(item.Rate, 1)}倍分红剩余${item.Bonus}期">×${item.Bonus}</span>`;
	}
	return badge;
}

function listItemClicked() {
	var link = $(this).find('a.avatar').attr('href');
	if (link) {
		if (parent.window.innerWidth < 1200) {
			$(parent.document.body).find("#split #listFrameWrapper").animate({ left: '-450px' });
		}
		window.open(link, 'right');
	}
}

function normalizeAvatar(avatar) {
	if (!avatar) return '//lain.bgm.tv/pic/user/l/icon.jpg';

	if (avatar.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
		return avatar + "!w120";

	var a = avatar.replace("http://", "//");
	return a;
}

function caculateICO(ico) {
	var level = 0;
	var price = 10;
	var amount = 10000;
	var total = 0;
	var next = 100000;

	if (ico.Total < 100000 || ico.Users < 10) {
		return { Level: level, Next: next, Price: 0, Amount: 0 };
	}

	level = Math.floor(Math.sqrt(ico.Total / 100000));
	amount = 10000 + (level - 1) * 7500;
	price = ico.Total / amount;
	next = Math.pow(level + 1, 2) * 100000;

	return { Level: level, Next: next, Price: price, Amount: amount };
}

function formatDate(date) {
	date = new Date(date);
	return date.format('yyyy-MM-dd hh:mm:ss');
}

function formatTime(timeStr) {
	var now = new Date();
	var time = new Date(timeStr) - (new Date().getTimezoneOffset() + 8 * 60) * 60 * 1000;

	var times = (time - now) / 1000;
	var day = 0;
	var hour = 0;
	var minute = 0;
	var second = 0;
	if (times > 0) {
		day = Math.floor(times / (60 * 60 * 24));
		hour = Math.floor(times / (60 * 60)) - Math.floor(times / (60 * 60 * 24)) * 24;
		minute = Math.floor(times / 60) - Math.floor(times / (60 * 60)) * 60;

		if (day > 0) return `剩余${day}天${hour}小时`;
		else if (hour > 0) return `剩余${hour}小时${minute}分钟`;
		else return `即将结束 剩余${minute}分钟`;
		//return '即将结束';
	} else {
		times = Math.abs(times);
		day = Math.floor(times / (60 * 60 * 24));
		hour = Math.floor(times / (60 * 60));
		minute = Math.floor(times / 60);
		second = Math.floor(times);

		if (minute < 1) {
			return `${second}s ago`;
		} else if (minute < 60) {
			return `${minute}m ago`;
		} else if (hour < 24) {
			return `${hour}h ago`;
		}

		if (day > 1000)
			return 'never';

		return `${day}d ago`;
	}
}

function formatNumber(number, decimals, dec_point, thousands_sep) {
	number = (number + '').replace(/[^0-9+-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
		sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
		dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
		s = '';
	// toFixedFix = function (n, prec) {
	//   var k = Math.pow(10, prec);
	//   return '' + Math.ceil(n * k) / k;
	// };

	//s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	s = (prec ? n.toFixed(prec) : '' + Math.round(n)).split('.');
	var re = /(-?\d+)(\d{3})/;
	while (re.test(s[0])) {
		s[0] = s[0].replace(re, "$1" + sep + "$2");
	}

	if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	}
	return s.join(dec);
}

function closeDialog() {
	$('#TB_overlay').remove();
	$('#TB_window').remove();
}

//=======================================================================================================//

let followList = JSON.parse(localStorage.getItem('TinyGrail_followList')) || {"user":'',"charas":[], "auctions":[]};
let path = document.location.pathname;


function loadFollowMenu() {
	var item = `<li><a href="#" id="followMenu" class="top">关注</a>
<ul>
<li><a href="#" id="followAuction">关注竞拍</a></li>
<li><a href="#" id="followChara">关注角色</a></li>
</ul>
</li>`;
	$('.timelineTabs').append(item);

	$('#followAuction').on('click', function () {
		menuItemClicked(loadFollowAuction);
	});

	$('#followChara').on('click', function () {
		menuItemClicked(loadFollowChara);
	});
}

function loadFollowAuction(){
	var ids = followList.auctions;
	postData('chara/list', ids, function (d, s) {
		if (d.State === 0) {
			console.log(d.Value);
			loadCharacterList(d.Value,'auction');
			loadUserAuctions(ids);
		}
	});
}

function loadFollowChara(){
	var ids = followList.charas;
	console.log(ids);
	postData('chara/list', ids, function (d, s) {
		if (d.State === 0) {
			loadCharacterList(d.Value,'chara');
		}
	});
}

function menuItemClicked(callback) {
	$('.timelineTabs a').removeClass('focus');
	$('.timelineTabs a').removeClass('top_focus');
	$('#followMenu').addClass('focus');
	if (callback) callback(1);
}

function loadCharacterList(list,type) {
	$('#eden_tpc_list ul .load_more').remove();
	$('#eden_tpc_list ul').html('');
	for (let i = 0; i < list.length; i++) {
		var item = list[i];
		//console.log(item);
		var chara = renderCharacter(item, type, lastEven);
		lastEven = !lastEven;
		$('#eden_tpc_list ul').prepend(chara);
	}
	$('.cancel_auction').on('click', (e) => {
		//if (!confirm('确定取消关注？')) return;
		var id = $(e.target).data('id').toString();
		if(type == 'auction') followList.auctions.splice(followList.auctions.indexOf(id),1);
		else if(type == 'chara') followList.charas.splice(followList.charas.indexOf(id),1);
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
		$(`#eden_tpc_list li[data-id=${id}]`).remove();
	});

	$('#eden_tpc_list .item_list').on('click', listItemClicked);
}

function renderCharacter(item,type,even) {
	var line = 'line_odd';
	if (even) line = 'line_even';
	var amount = '';

	if (item.State != 0) {
		amount = `<small title="持有股份 / 固定资产">${formatNumber(item.State, 0)} / ${formatNumber(item.Sacrifices, 0)}</small>`;
	} else {
		amount = `<small title="固定资产">${formatNumber(item.Sacrifices, 0)}</small>`;
	}

	var tag = renderCharacterTag(item);
	var depth = renderCharacterDepth(item);
	var id = item.Id;
	if(item.CharacterId) id = item.CharacterId;
	var time = item.LastOrder;
	var avatar = `<a href="/rakuen/topic/crt/${id}?trade=true" class="avatar l" target="right"><span class="avatarNeue avatarReSize32 ll" style="background-image:url('${normalizeAvatar(item.Icon)}')"></span></a>`;
	var cancel = `<span><small data-id="${id}" class="cancel_auction">[取消]</small></span>`;
	var badge = renderBadge(item);
	var chara;
	if(type=='auction'){
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${item.Rate.toFixed(2)})</small>
<div class="row"><small class="time">${formatTime(time)}</small>
${cancel}</div></div>${tag}</li>`
	}
	//ICO
	else if (item.CharacterId) {
		var pre = caculateICO(item);
		console.log(item);
		//var percent = formatNumber(item.Total / pre.Next * 100, 0);
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(ICO进行中: lv${pre.Level})</small>
<div class="row"><small class="time">${formatTime(item.End)}</small><span><small>${formatNumber(item.Users, 0)}人 / ${formatNumber(item.Total, 1)} / ₵${formatNumber(pre.Price, 2)}</small></span>
${cancel}</div></div><div class="tags tag lv${pre.Level}">ICO进行中</div></li>`
	}
	else{
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${item.Rate.toFixed(2)} / ${formatNumber(item.Total, 0)} / ₵${formatNumber(item.MarketValue, 0)})</small>
<div class="row"><small class="time">${formatTime(time)}</small>${amount}<span title="买入 / 卖出 / 成交">${depth}</span>
${cancel}</div></div>${tag}</li>`
	}
	return chara;
}

function showInitialPrice(charaId){
	getData(`chara/charts/${charaId}/2019-08-08`, function (d, s) {
		if (d.State === 0) {
			let price = d.Value[0].Begin.toFixed(2);
			$('#kChartButton').after(`<span>发行价：${price}</span>`);
		}
	});
}

function splitAmount(amount) {
	let splitter = 500;
	let len = Math.ceil(amount / splitter);
	let splitAmounts = Array(len).fill(splitter);
	if(len == 1) {
		splitAmounts[len-1] = amount;
	} else if(amount % splitter >= 100) {
		splitAmounts[splitAmounts.length-1] = amount % splitter;
	} else if(amount % splitter > 0) {
		splitAmounts[splitAmounts.length-2] -= 100;
		splitAmounts[splitAmounts.length-1] = amount % splitter + 100;
	}
	return splitAmounts;
}

async function retryPromise(callback, n=10) {
	let error;
	while(n--) {
		try {
			return await new Promise(callback);
		} catch (err) {
			error = err;
			await new Promise(resolve => setTimeout(resolve, 300)); // sleep 300 ms
		}
	}
	throw error;
};

function setSplitButton(type){
	let text = (type == 'bid') ? '拆单买入' : '拆单卖出';
	$(`#grailBox .trade_box .${type} .trade_list`).append(`<div style="display:none"><div class="label total">0</div><button id="split_${type}Button" class="active ${type}">${text}</button></div>`);

	$(`.${type} .amount`).on('input',function () {
		var amount = $(`.${type} .amount`).val();
		if(amount>500){
			$($(`#split_${type}Button`).parent()).show();
			$($(`#${type}Button`).parent()).hide();
		}
		else{
			$($(`#split_${type}Button`).parent()).hide();
			$($(`#${type}Button`).parent()).show();
		}
	});
}

function priceWarning(){
	let price = $(`.bid .price`).val();
	let amount = $(`.bid .amount`).val();
	$(`#grailBox .trade_box .bid .trade_list`).append(`<div style="display:none"><div class="label total">0</div><button id="confirm_bidButton" class="active bid">买入</button></div>`);
	$(`.bid .price`).on('input',function () {
		let price_now = $(`.bid .price`).val();
		if(price_now > price * 3){
			$(`.bid .price`).css({"color":"red"});
			$($(`#confirm_bidButton`).parent()).show();
			$($(`#bidButton`).parent()).hide();
		}
		else{
			$($(`#confirm_bidButton`).parent()).hide();
			$($(`#bidButton`).parent()).show();
			$(`.bid .price`).css({"color":"inherit"});
		}
	});
	$('#confirm_bidButton').on('click', function(){
		price = $(`.bid .price`).val();
		amount = $(`.bid .amount`).val();
		if (confirm(`买入价格过高提醒！\n确定以${price}的价格买入${amount}股？`)) {
			$(`#bidButton`).click();
        }
	});
}

function splitOrder(charaId){
	setSplitButton('bid');
	setSplitButton('ask');

	async function doSplit(type) {
		let price = $(`.${type} .price`).val();
		let amount = $(`.${type} .amount`).val();
		let splitAmounts = splitAmount(amount);
		$(`#split_${type}Button`).attr('disabled', true);
		for(let x of splitAmounts) {
			await retryPromise(resolve => postData(`chara/${type}/${charaId}/${price}/${x}`, null, function(d, s) {
				if(d.Message) alert(d.Message);
				resolve();
			}))
		}
		location.reload();
	};

	$('#split_bidButton').on('click', () => doSplit('bid'));
	$('#split_askButton').on('click', () => doSplit('ask'));
}

function showOwnTemple() {
	let temples = document.querySelectorAll('#grailBox .assets_box .assets .item');
	let me  = followList.user;
	if(!me){
		me = $('#new_comment .reply_author a')[0].href.split('/').pop();
		followList.user = me;
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
	}
	for(let i = 0; i < temples.length; i++) {
		let user = temples[i].querySelector('.name a').href.split('/').pop();
		if(user === me) {
			temples[i].classList.add('my_temple');
			$('#grailBox .assets_box .assets').prepend(temples[i]);
			break;
		}
	}
}

function countTempleNum(charaId){
	getData(`chara/temple/${charaId}`, function (d) {
		var templeAll = {1:0,2:0,3:0};
		for (let i = 0; i < d.Value.length; i++) {
			templeAll[d.Value[i].Level]++;
		}
		$('#grailBox .assets_box .bold .sub').before(`<span class="sub"> (${templeAll[3]} + ${templeAll[2]} + ${templeAll[1]})</span>`);
	});
}

function mergeOrder(orderHistory){
	let mergedOrder = [], i = 0;
	mergedOrder.push(orderHistory[0]);
	for(let j = 1; j < orderHistory.length; j++){
		if((orderHistory[j].Price == mergedOrder[i].Price) && Math.abs(new Date(orderHistory[j].TradeTime) - new Date(mergedOrder[i].TradeTime))<10*1000){
			//10s内同价格订单合并
			mergedOrder[i].Amount += orderHistory[j].Amount;
		}
		else{
			mergedOrder.push(orderHistory[j]);
			i++;
		}
	}
	return mergedOrder;
}

function mergeOrderHistory(charaId){
	getData(`chara/user/${charaId}`, function (d, s) {
		if (d.State === 0 && d.Value) {
			$(`.ask .ask_list li[class!=ask]`).hide();
			let askHistory = mergeOrder(d.Value.AskHistory);
			for (let i = 0; i < askHistory.length; i++) {
				let ask = askHistory[i];
				$('.ask .ask_list').prepend(`<li title="${formatDate(ask.TradeTime)}">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel">[成交]</span></li>`);
			}
			$(`.bid .bid_list li[class!=bid]`).hide();
			let bidHistory = mergeOrder(d.Value.BidHistory);
			for (let i = 0; i < bidHistory.length; i++) {
				let bid = bidHistory[i];
				$('.bid .bid_list').prepend(`<li title="${formatDate(bid.TradeTime)}">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel">[成交]</span></li>`);
			}

		}
	});
}

function loadUserAuctions(ids) {
	$('.auction_tip').hide();
	postData('chara/auction/list', ids, (d) => {
		if (d.State == 0) {
			d.Value.forEach((a) => {
				if (a.State != 0) {
					let userAuction = `<span class="user_auction auction_tip" title="竞拍人数 / 竞拍数量">${formatNumber(a.State, 0)} / ${formatNumber(a.Type, 0)}</span>`;
					$(`.item_list[data-id=${a.CharacterId}] .time`).after(userAuction);
					$(`#auctionHistoryButton`).before(userAuction);
					$('#TB_window.dialog .desc').append(userAuction);
				}
				if (a.Price != 0) {
					let myAuction = `<span class="my_auction auction_tip" title="出价 / 数量">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>`;
					$(`.item_list[data-id=${a.CharacterId}] .time`).after(myAuction);
					$(`#auctionHistoryButton`).before(myAuction);
					$('#TB_window.dialog .desc').append(myAuction);
				}
			});
		}
	});
}

function followChara(charaId){  //关注角色
	let button;
	if(followList.charas.includes(charaId)){
		button = `<button id="followCharaButton" class="text_button">[取消关注]</button>`;
	}
	else{
		button = `<button id="followCharaButton" class="text_button">[关注角色]</button>`;
	}
	if($('#kChartButton').length) $('#kChartButton').before(button);
	else $('#grailBox .title .text').after(button);

	$('#followCharaButton').on('click', () => {
		if(followList.charas.includes(charaId)){
			followList.charas.splice(followList.charas.indexOf(charaId),1);
			$('#followCharaButton').text('[关注角色]');
		}
		else{
			followList.charas.push(charaId);
			$('#followCharaButton').text('[取消关注]');
		}
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
	});
}

function followAuctions(charaId){  //关注竞拍情况
	getData(`chara/user/${charaId}/valhalla@tinygrail.com/false`, (d) => {
		if (d.State == 0 && d.Value.Amount > 0) {
			let button;
			if(followList.auctions.includes(charaId)){
				button = `<button id="followAuctionButton" class="text_button">[取消关注]</button>`;
			}
			else{
				button = `<button id="followAuctionButton" class="text_button">[关注竞拍]</button>`;
			}
			$('#buildButton').before(button);
			$('#followAuctionButton').on('click', () => {
				if(followList.auctions.includes(charaId)){
					followList.auctions.splice(followList.auctions.indexOf(charaId),1);
					$('#followAuctionButton').text('[关注竞拍]');
				}
				else{
					followList.auctions.push(charaId);
					$('#followAuctionButton').text('[取消关注]');
				}
				localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
			});
		}
	});
}

function fixAuctions(charaId){
	getData(`chara/${charaId}`, (d) => {
		var chara = d.Value;
		getData(`chara/user/${chara.Id}/valhalla@tinygrail.com/false`, (d) => {
			if (d.State == 0 && d.Value.Amount>0) {
				chara.Price = d.Value.Price;
				chara.State = d.Value.Amount;
				var button = `<button id="auctionButton2" class="text_button">[参与竞拍]</button>`;
				$('#buildButton').before(button);
				$('#auctionButton').hide();
				$('#auctionButton2').on('click', () => {
					openAuctionDialog(chara);
				});
			}
		});
	});
}

function openAuctionDialog(chara) {
	var price = Math.ceil(chara.Price*100)/100;
	var total = formatNumber(price * chara.State, 2);
	var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;">
<div class="title" title="拍卖底价 / 竞拍数量 / 流通股份">股权拍卖 - #${chara.Id} 「${chara.Name}」 ₵${chara.Price.toFixed(2)} / ${chara.State} / ${chara.Total}</div>
<div class="desc">输入竞拍出价和数量参与竞拍</div>
<div class="label"><span class="input">价格</span><span class="input">数量</span><span class="total">合计 -₵${total}</span></div>
<div class="trade auction">
<input class="price" type="number" min="${price}" value="${price}">
<input class="amount" type="number" min="1" max="${chara.State}" value="1">
<button id="bidAuctionButton" class="active">确定</button><button id="cancelDialogButton">取消</button></div>
<div class="loading" style="display:none"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);
	var ids = [chara.Id];
	loadUserAuctions(ids);
	$('#cancelDialogButton').on('click', closeDialog);
	$('#TB_closeWindowButton').on('click', closeDialog);
	$('#TB_window .auction input').on('keyup', () => {
		var price = $('.trade.auction .price').val();
		var amount = $('.trade.auction .amount').val();
		var total = formatNumber(price * amount, 2);
		$("#TB_window .label .total").text(`合计 -₵${total}`);
	});
	$('#bidAuctionButton').on('click', function () {
		var price = $('.trade.auction .price').val();
		var amount = $('.trade.auction .amount').val();
		$("#TB_window .loading").show();
		$('#TB_window .label').hide();
		$("#TB_window .desc").hide();
		$("#TB_window .trade").hide();
		postData(`chara/auction/${chara.Id}/${price}/${amount}`, null, (d) => {
			$("#TB_window .loading").hide();
			$('#TB_window .label').show();
			$("#TB_window .desc").show();
			$("#TB_window .trade").show();
			if (d.State == 0) {
				var message = d.Value;
				$('#TB_window .trade').hide();
				$('#TB_window .label').hide();
				$('#TB_window .desc').text(message);
			} else {
				alert(d.Message);
			}
		});
	});
}

function showAuctionHistory(charaId){
	var button = `<button id="auctionHistorys" class="text_button">[往期拍卖]</button>`;
	$('#auctionHistoryButton').after(button);
	$('#auctionHistoryButton').hide();
	$('#auctionHistorys').on('click', () => {
		getData(`chara/${charaId}`, (d => {
			var chara = d.Value;
			var page = 1;
			openHistoryDialog(chara, page);
		}));
	});
}

function openHistoryDialog(chara, page) {
	var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;max-width:640px;min-width:400px;">
<div class="loading"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);
	//$('#TB_window').css("margin-left", $('#TB_window').width() / -2);
	//$('#TB_window').css("margin-top", $('#TB_window').height() / -2);
	$('#TB_closeWindowButton').on('click', closeDialog);
	const week_ms = 7*24*3600*1000;
	new Promise(resolve => getData(`chara/charts/${chara.Id}/2019-08-08`, d => {
		let templeWeek = Math.floor((new Date() - new Date('2019/10/05'))/week_ms + 1);
		let icoWeek = Math.floor((new Date() - new Date(d.Value[0].Time))/week_ms + 1);
		resolve(Math.min(templeWeek, icoWeek));
	}))
		.then(week => new Promise(resolve => getData(`chara/auction/list/${chara.Id}/${page}`, d => {
		$('#TB_window .loading').hide();
		if (d.State == 0 && d.Value.length > 0) {
			var success = 0;
			var total = 0;
			let $result = $(document.createElement('div')).addClass("result");
			d.Value.forEach((a) => {
				var state = "even";
				var name = "失败";
				if (a.State == 1) {
					success++;
					total += a.Amount;
					state = "raise";
					name = "成功";
				}
				var record =`
<div class="row"><span class="time">${formatDate(a.Bid)}</span>
<span class="user"><a target="_blank" href="/user/${a.Username}">${a.Nickname}</a></span>
<span class="price">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>
<span class="tag ${state}">${name}</span></div>`;
				$result.append(record);
			});
			let title = $(`<div class="title">上${page}周拍卖结果 - #${chara.Id} 「${chara.Name}」 ₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Total, 0)}</div>
<div class="desc">共有${d.Value.length}人参与拍卖，成功${success}人 / ${total}股</div>`);
			$('#TB_window').append(title);
			$('#TB_window').append($result);
		} else {
			var record =`<div class="desc">无拍卖数据</div>`;
			$('#TB_window').append(record);
		}
		let $page_inner = $(document.createElement('div')).addClass("page_inner");
		$('#TB_window').append($page_inner);
		if(page > 1) $page_inner.append(`<a id="nextweek" class="p" style="float: left;margin-bottom: 5px;margin-left: 50px;">后一周</a>`);
		if(page < week) $page_inner.append(`<a id="lastweek" class="p" style="float: right;margin-bottom: 5px;margin-right: 50px;">前一周</a>`);
		$('#nextweek').on('click', () => {
			page--;
			closeDialog();
			openHistoryDialog(chara, page);
		});
		$('#lastweek').on('click', () => {
			page++;
			closeDialog();
			openHistoryDialog(chara, page);
		});
		resolve();
	})))
		.then(() => {
		// should adjust window position again
		//$('#TB_window').css("margin-left", $('#TB_window').width() / -2);
		//$('#TB_window').css("margin-top", $('#TB_window').height() / -2);
	});
}

function hideBonusButton() {
	//if(!$('#bonusButton').length) return;
	getData('event/share/bonus/test', d => {
		if(d.State == 0 && d.Value.Share > 1500*7) $('#bonusButton').remove();
		//else $('#shareBonusButton').hide();
	});
}

function observeRakuen(mutationList) {
	if(!$('#bonusButton, #grailBox .assets_box').length) {
		fetched = false;
		return;
	}
	if(fetched) return;
	if($('#bonusButton').length){
		fetched = true;
		hideBonusButton();
	}
	if($('#grailBox .assets_box').length) {
		fetched = true;
		let charaId = $('#grailBox .title .name a')[0].href.split('/').pop();
		followChara(charaId);
		showInitialPrice(charaId);  //显示发行价
		//splitOrder(charaId);  //自动拆单 (数量税已取消)
		priceWarning(); //买入价格过高提醒
		mergeOrderHistory(charaId); //合并同一时间订单历史记录

		loadUserAuctions([charaId]);  //显示竞拍情况
		fixAuctions(charaId); //修改默认拍卖底价和数量
		showAuctionHistory(charaId);  //历史拍卖
		followAuctions(charaId);  //关注竞拍情况
		showOwnTemple();  //显示自己的圣殿
		countTempleNum(charaId); //显示各级圣殿数量
	}
}

function observeMenu(mutationList) {
	if(!$('#recentMenu').length) return;
	observer.disconnect();
	loadFollowMenu();
}

let fetched = false;
function observeChara(mutationList) {
	if(!$('#grailBox .progress_bar, #grailBox .assets_box').length) {
		fetched = false;
		return;
	}
	if(fetched) return;
	let charaId = $('#grailBox .title .name a')[0].href.split('/').pop();

	if($('#grailBox .title').length){//关注角色
		followChara(charaId);
	}
	if($('#grailBox .assets_box').length) {
		fetched = true;
		showInitialPrice(charaId);  //显示发行价
		//splitOrder(charaId);  //自动拆单 (数量税已取消)
		priceWarning(); //买入价格过高提醒
		mergeOrderHistory(charaId); //合并同一时间订单历史记录

		loadUserAuctions([charaId]);  //显示竞拍情况
		fixAuctions(charaId); //修改默认拍卖底价和数量
		showAuctionHistory(charaId);  //历史拍卖
		followAuctions(charaId);  //关注竞拍情况
		showOwnTemple();  //显示自己的圣殿
		countTempleNum(charaId); //显示各级圣殿数量

	} // use '.progress_bar' to detect (and skip) ICO characters
	else if($('#grailBox .progress_bar').length) {
		observer.disconnect();
	}
}

let parentNode, observer;
if(location.pathname.startsWith('/rakuen/topic/crt')) {
	parentNode = document.getElementById('subject_info');
	observer = new MutationObserver(observeChara);
} else if(location.pathname.startsWith('/character')) {
	parentNode = document.getElementById('columnCrtB')
	observer = new MutationObserver(observeChara);
} else if (location.pathname.startsWith('/rakuen/home')) {
	parentNode = document.body;
	observer = new MutationObserver(observeRakuen);
}else if (location.pathname.startsWith('/rakuen/topiclist')) {
	parentNode = document.getElementById('rakuenTab');
	observer = new MutationObserver(observeMenu);
}

observer.observe(parentNode, {'childList': true, 'subtree': true});
