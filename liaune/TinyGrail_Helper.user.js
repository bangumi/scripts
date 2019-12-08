// ==UserScript==
// @name         TinyGrail Helper
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      1.2.0
// @description  为小圣杯增加一些小功能：角色页面显示角色发行价，显示拍卖情况，突出显示自己圣殿，显示各级圣殿数量，关注角色，关注竞拍，查看往期竞拍，自动拆单,合并相同时间订单；股息高于低保隐藏签到
// @author       Liaune,Cedar
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(character|rakuen\/topiclist|rakuen\/home|rakuen\/topic\/crt).*
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
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
.assets .item .card {
background-size: cover;
width: 90px;
height: 120px;
border-radius: 5px;
box-shadow: 3px 3px 5px #d8d8d8;
border: 1px solid #e0e0e0;
overflow: hidden;
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
	let n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
		sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
		dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
		s = '',
		toFixedFix = function (n, prec) {
			let k = Math.pow(10, prec);
			return '' + Math.ceil(n * k) / k;
		};

	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	let re = /(-?\d+)(\d{3})/;
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

//###################################################################################################//

let followList = JSON.parse(localStorage.getItem('TinyGrail_followList')) || {"charas":[], "auctions":[]};
let path = document.location.pathname;
if (path.startsWith('/rakuen/topiclist')) loadFollowMenu();

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
		var id = $(e.target).data('id');
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
	var cancel = `<span><small data-id="${id}" class="cancel_auction">[取消关注]</small></span>`;
	var badge = '';
	if (item.Type === 1) badge = `<span class="badge" title="${formatNumber(item.Rate, 1)}倍分红剩余${item.Bonus}期">×${item.Bonus}</span>`;
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
		//var percent = formatNumber(item.Total / pre.Next * 100, 0);
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(ICO进行中: lv${pre.Level})</small>
<div class="row"><small class="time">${formatTime(item.End)}</small><span><small> ${formatNumber(item.Total, 0)}/100,000 </small></span>
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
			$('#grailBox .title .text').append(`<span>发行价：${price}</span>`);
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
	let me = document.querySelector('#new_comment .reply_author a').href;
	for(let i = 0; i < temples.length; i++) {
		if(temples[i].querySelector('.name a').href === me) {
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
		if((orderHistory[j].Price == mergedOrder[i].Price) && (new Date(orderHistory[j].TradeTime) - new Date(mergedOrder[i].TradeTime))<10*1000){
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
			$('.ask .ask_list').html(``);
			let askHistory = mergeOrder(d.Value.AskHistory);
			let bidHistory = mergeOrder(d.Value.BidHistory);
			for (let i = 0; i < askHistory.length; i++) {
				let ask = askHistory[i];
				$('.ask .ask_list').prepend(`<li title="${formatDate(ask.TradeTime)}">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel">[成交]</span></li>`);
			}
			for (let i = 0; i < d.Value.Asks.length; i++) {
				let ask = d.Value.Asks[i];
				$('.ask .ask_list').append(`<li title="${formatDate(ask.Begin)}" class="ask">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel" data-id="${ask.Id}">[取消]</span></li>`);
			}
			$('.bid .ask_list').html(``);
			for (let i = 0; i < bidHistory.length; i++) {
				let bid = bidHistory[i];
				$('.bid .bid_list').prepend(`<li title="${formatDate(bid.TradeTime)}">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel">[成交]</span></li>`);
			}
			for (let i = 0; i < d.Value.Bids.length; i++) {
				let bid = d.Value.Bids[i];
				$('.bid .bid_list').append(`<li title="${formatDate(bid.Begin)}" class="bid">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel" data-id="${bid.Id}">[取消]</span></li>`);
			}

		}
	});
}

function loadUserAuctions(ids) {
	postData('chara/auction/list', ids, (d) => {
		if (d.State == 0) {
			d.Value.forEach((a) => {
				if (a.State != 0) {
					let userAuction = `<span class="user_auction" title="竞拍人数 / 竞拍数量">${formatNumber(a.State, 0)} / ${formatNumber(a.Type, 0)}</span>`;
					$(`.item_list[data-id=${a.CharacterId}] .time`).after(userAuction);
					$(`#auctionHistoryButton`).before(userAuction);
				}
				if (a.Price != 0) {
					let myAuction = `<span class="my_auction" title="出价 / 数量">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>`;
					$(`.item_list[data-id=${a.CharacterId}] .time`).after(myAuction);
					$(`#auctionHistoryButton`).before(myAuction);
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
	$('#grailBox .title .text').append(button);

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
<div id="TB_window" class="dialog" style="display:block;max-width:640px;">
<div class="loading"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);
	$('#TB_window').css("margin-left", $('#TB_window').width() / -2);
	$('#TB_window').css("margin-top", $('#TB_window').height() / -2);
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
		$('#TB_window').css("margin-left", $('#TB_window').width() / -2);
		$('#TB_window').css("margin-top", $('#TB_window').height() / -2);
	});
}

function hideBonusButton() {
	if(!$('#bonusButton').length) return;
	getData('event/share/bonus/test', d => {
		if(d.State == 0 && d.Value.Share > 1500*7) $('#bonusButton').hide();
		//else $('#shareBonusButton').hide();
	});
}

function observeBonus(mutationList) {
	if(!$('#grailBox.rakuen_home button.daily_bonus').length) return;
	observer.disconnect();
	hideBonusButton();
}

let fetched = false;
function observeChara(mutationList) {
	if(!$('#grailBox .progress_bar, #grailBox .assets_box').length) {
		fetched = false;
		return;
	}
	if(fetched) return;
	let charaId = document.location.pathname.split('/').pop();
	if($('#grailBox .title').length) followChara(charaId);  //关注角色
	if($('#grailBox .assets_box').length) {
		fetched = true;
		showInitialPrice(charaId);  //显示发行价
		splitOrder(charaId);  //拆单避税
		mergeOrderHistory(charaId);  //合并同一时间订单历史记录

		loadUserAuctions([charaId]);  //显示竞拍情况
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
	observer = new MutationObserver(observeBonus);
}

observer.observe(parentNode, {'childList': true, 'subtree': true});
