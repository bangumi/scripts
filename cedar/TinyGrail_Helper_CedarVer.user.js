// ==UserScript==
// @name         TinyGrail Helper CedarVer
// @namespace    tv.bgm.cedar.tinygrailhelper
// @version      1.8.3
// @description  为小圣杯增加一些小功能
// @author       Cedar, Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(user|character|rakuen\/topiclist|rakuen\/home|rakuen\/topic\/crt).*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
ul.timelineTabs li a {
  margin: 2px 0 0 0;
  padding: 5px 10px 5px 10px;
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
.result {
  max-height: 500px;
  overflow: auto;
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
	let depth = `<small class="raise">+${formatNumber(chara.Bids, 0)}</small><small class="fall">-${formatNumber(chara.Asks, 0)}</small><small class="even">${formatNumber(chara.Change, 0)}</small>`
	return depth;
}

function renderCharacterTag(chara, item) {
	let id = chara.Id;
	let flu = '--';
	let tclass = 'even';
	if (chara.Fluctuation > 0) {
		tclass = 'raise';
		flu = `+${formatNumber(chara.Fluctuation * 100, 2)}%`;
	} else if (chara.Fluctuation < 0) {
		tclass = 'fall';
		flu = `${formatNumber(chara.Fluctuation * 100, 2)}%`;
	}

	let tag = `<div class="tag ${tclass}" title="₵${formatNumber(chara.MarketValue, 0)} / ${formatNumber(chara.Total, 0)}">₵${formatNumber(chara.Current, 2)} ${flu}</div>`
	return tag;
}

function renderBadge(item) {
	let badge = '';
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
	let link = $(this).find('a.avatar').attr('href');
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

	let a = avatar.replace("http://", "//");
	return a;
}

function getWeeklyShareBonus(callback) {
	if (!confirm('已经周六了，还没领取股息吗？请注意，领取股息分红之后本周将不能再领取登录奖励，股息预测小于₵10,000建议每日签到。')) return;

	getData(`event/share/bonus`, (d) => {
		if (d.State == 0)
			alert(d.Value);
		else
			alert(d.Message);

		callback();
	});
}

function caculateICO(ico) {
	let level = 0;
	let price = 10;
	let amount = 10000;
	let total = 0;
	let next = 100000;

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
	let now = new Date();
	let time = new Date(timeStr) - (new Date().getTimezoneOffset() + 8 * 60) * 60 * 1000;

	let times = (time - now) / 1000;
	let day = 0;
	let hour = 0;
	let minute = 0;
	let second = 0;
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
		s = '';
	// toFixedFix = function (n, prec) {
	//   let k = Math.pow(10, prec);
	//   return '' + Math.ceil(n * k) / k;
	// };

	//s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	s = (prec ? n.toFixed(prec) : '' + Math.round(n)).split('.');
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

function menuItemClicked(callback) {
	$('.timelineTabs a').removeClass('focus');
	$('.timelineTabs a').removeClass('top_focus');
	$('#helperMenu').addClass('focus');
	if (callback) callback(1);
}

function closeDialog() {
	$('#TB_overlay').remove();
	$('#TB_window').remove();
}

//=======================================================================================================//

let followList = JSON.parse(localStorage.getItem('TinyGrail_followList')) || {"user":'',"charas":[], "auctions":[]};
let settings = JSON.parse(localStorage.getItem('TinyGrail_settings')) || {"pre_temple":"on","hide_grail":"off","auction_num":"one","merge_order":"on","get_bonus":"on"};

let path = document.location.pathname;


function loadHelperMenu() {
	let item = `<li><a href="#" id="helperMenu" class="top">助手</a>
<ul>
<li><a href="#" id="followAuction">关注竞拍</a></li>
<li><a href="#" id="followChara">关注角色</a></li>
<li><a href="#" id="myICO">我的ICO</a></li>
<li><a href="#" id="myTemple">我的圣殿</a></li>
<li><a href="#" id="settings">设置</a></li>
</ul>
</li>`;
	$('.timelineTabs').append(item);

	$('#followAuction').on('click', function () {
		menuItemClicked(loadFollowAuction);
	});

	$('#followChara').on('click', function () {
		menuItemClicked(loadFollowChara);
	});

	$('#myICO').on('click', function () {
		menuItemClicked(loadMyICO);
	});

	$('#myTemple').on('click', function () {
		menuItemClicked(loadMyTemple);
	});
	/*
	$('#withdrawAuctionMenu').on('click', function () {
		menuItemClicked(withdrawAuction);
	});
	$('#withdrawBidMenu').on('click', function () {
		menuItemClicked(withdrawBid);
	});
	*/
	$('#settings').on('click', function () {
		menuItemClicked(openSettings);
	});
}

function loadFollowAuction(page){
	let start = 50 * (page - 1);
	let ids = followList.auctions.slice(start, start+50);
	let totalPages = Math.ceil(followList.auctions.length / 50);
	postData('chara/list', ids, (d) =>  {
		if (d.State === 0) {
			console.log(d.Value);
			loadCharacterList(d.Value, page, totalPages, loadFollowAuction, 'auction');
			loadUserAuctions(ids);
		}
	});
}

function loadFollowChara(page){
	let start = 50 * (page - 1);
	let ids = followList.charas.slice(start, start+50);
	let totalPages = Math.ceil(followList.charas.length / 50);
	postData('chara/list', ids, (d) =>  {
		if (d.State === 0) {
			loadCharacterList(d.Value, page, totalPages, loadFollowChara, 'chara');
		}
	});
}

function loadMyICO(page){
	getData(`chara/user/initial/0/${page}/50`, (d) => {
		if (d.State == 0) {
			loadCharacterList(d.Value.Items,d.Value.CurrentPage, d.Value.TotalPages, loadMyICO, 'ico');
		}
	});
}

function loadMyTemple(page){
	getData(`chara/user/temple/0/${page}/50`, (d) => {
		if (d.State == 0) {
			loadCharacterList(d.Value.Items,d.Value.CurrentPage, d.Value.TotalPages, loadMyTemple, 'temple');
		}
	});
}

/*
function withdrawAuction(){//取消拍卖(非周六时间)以提取现金，记录原订单，再次点击存回
	$('#eden_tpc_list ul').html('');
	getData(`chara/user/assets`,(d) => {
		let Balance = d.Value.Balance;
		getData(`chara/user/auction/1/500`, (d) => {
			let charas = [];
			for(let i = 0; i< d.Value.Items.length; i++){
				charas.push(d.Value.Items[i]);
			}
			withdrawAuctions(charas, Balance);
		});
	});
}
function withdrawBid(){//取消买单以提取现金，记录原订单，再次点击存回
	$('#eden_tpc_list ul').html('');
	getData(`chara/user/assets`,(d) => {
		let Balance = d.Value.Balance;
		getData(`chara/bids/0/1/1000`, (d) => {
			let charas = [];
			for(let i = 0; i< d.Value.Items.length; i++){
				charas.push(d.Value.Items[i]);
			}
			withdrawBids(charas, Balance);
		});
	});
}
async function withdrawAuctions(charas, Balance){
	for(let i = 0; i< charas.length; i++){
		let charaId = charas[i].CharacterId.toString();
		let Id = charas[i].Id.toString();
		let name = charas[i].Name;
		let state = charas[i].State;
		let price = charas[i].Price;
		let amount = charas[i].Amount;
		Balance += price * amount;
		if(state == 0 && price && amount){
			let line = 'line_even';
			if (i%2==0) line = 'line_odd';
			//postData(`chara/auction/cancel/${Id}`, null, (d) => {
			let message = `<li class="${line} item_list item_log" data-id="${charaId}"><span class="tag raise">+${formatNumber(price*amount,2)}</span>
₵${formatNumber(Balance,2)}<span class="row"><small class="time">取消拍卖(${Id}) #${charaId} 「${name}」 ${price}*${amount}</small></span></li>`
			$('#eden_tpc_list ul').prepend(message);
			//});
		}
	}
}
async function withdrawBids(charas, Balance){
	for(let i = 0; i< charas.length; i++){
		let charaId = charas[i].Id.toString();
		let name = charas[i].Name;
		await retryPromise(resolve => getData(`chara/user/${charaId}`, (d) => {
			for(let i = 0; i< d.Value.Bids.length; i++){
				let line = 'line_even';
				if (i%2==0) line = 'line_odd';
				let tid = d.Value.Bids[i].Id;
				let price = d.Value.Bids[i].Price;
				let amount = d.Value.Bids[i].Amount;
				Balance += price * amount;
				//postData(`chara/bid/cancel/${tid}`, null, (d) => {
					let message = `<li class="${line} item_list item_log" data-id="${charaId}"><span class="tag raise">+${formatNumber(price*amount,2)}</span>
₵${formatNumber(Balance,2)}<span class="row"><small class="time">取消买单(${tid}) #${charaId} 「${name}」 ${price}*${amount}</small></span></li>`
					$('#eden_tpc_list ul').prepend(message);
				//});
			}
			resolve();
		}));
	}
}
*/

function openSettings(){
	closeDialog();
	//settings = JSON.parse(localStorage.getItem('TinyGrail_settings'));
	let dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;max-width:640px;min-width:400px;">
<table align="center" width="98%" cellspacing="0" cellpadding="5" class="settings">
<tbody><tr><td valign="top" width="50%">主页显示/隐藏小圣杯</td><td valign="top">
<select id="set1"><option value="off" selected="selected">显示</option><option value="on">隐藏</option></select></td></tr>
<tr><td valign="top" width="50%">将自己圣殿排到第一个显示</td><td valign="top">
<select id="set2"><option value="on" selected="selected">是</option><option value="off">否</option></td></tr>
<tr><td valign="top" width="50%">默认拍卖数量</td><td valign="top">
<select id="set3"><option value="one" selected="selected">1</option><option value="all">全部</option></td></tr>
<tr><td valign="top" width="50%" title="合并同一时间同一价格的历史订单记录">合并历史订单</td><td valign="top">
<select id="set4"><option value="on" selected="selected">是</option><option value="off">否</option></td></tr>
<tr><td valign="top" width="50%">周六自动提醒领取股息</td><td valign="top">
<select id="set5"><option value="on" selected="selected">是</option><option value="off">否</option></td></tr>
<tr><td valign="top" width="12%"><input class="inputBtn" value="保存" id="submit_setting" type="submit"></td><td valign="top"></td></tr>
</tbody></table>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>
</div>`;
	$('body').append(dialog);
	$('#TB_closeWindowButton').on('click', closeDialog);
	$('#TB_overlay').on('click', closeDialog);
	$('#set1').val(settings.hide_grail);
	$('#set2').val(settings.pre_temple);
	$('#set3').val(settings.auction_num);
	$('#set4').val(settings.merge_order);
	$('#set5').val(settings.get_bonus);
	$('#submit_setting').on('click', () => {
		settings.hide_grail = $('#set1').val();
		settings.pre_temple = $('#set2').val();
		settings.auction_num = $('#set3').val();
		settings.merge_order = $('#set4').val();
		settings.get_bonus = $('#set5').val();
		localStorage.setItem('TinyGrail_settings',JSON.stringify(settings));
		$('#submit_setting').val('已保存');
	});
}

function loadCharacterList(list, page, total, more, type) {
	$('#eden_tpc_list ul .load_more').remove();
	if (page === 1) $('#eden_tpc_list ul').html('');
	for (let i = 0; i < list.length; i++) {
		let item = list[i];
		//console.log(item);
		let chara = renderCharacter(item, type, lastEven);
		lastEven = !lastEven;
		$('#eden_tpc_list ul').append(chara);
	}
	$('.cancel_auction').on('click', (e) => {
		//if (!confirm('确定取消关注？')) return;
		let id = $(e.target).data('id').toString();
		if(type == 'auction') followList.auctions.splice(followList.auctions.indexOf(id),1);
		else if(type == 'chara') followList.charas.splice(followList.charas.indexOf(id),1);
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
		$(`#eden_tpc_list li[data-id=${id}]`).remove();
	});

	$('#eden_tpc_list .item_list').on('click', listItemClicked);
	if (page != total && total > 0) {
		var loadMore = `<li class="load_more"><button id="loadMoreButton" class="load_more_button" data-page="${page + 1}">[加载更多]</button></li>`;
		$('#eden_tpc_list ul').append(loadMore);
		$('#loadMoreButton').on('click', function () {
			var page = $(this).data('page');
			if (more) more(page);
		});
	} else {
		var noMore = '暂无数据';
		if (total > 0)
			noMore = '加载完成';

		$('#eden_tpc_list ul').append(`<li class="load_more sub">[${noMore}]</li>`);
	}
}

function renderCharacter(item,type,even) {
	let line = 'line_odd';
	if (even) line = 'line_even';
	let amount = '';

	if (item.State != 0) {
		amount = `<small title="持有股份 / 固定资产">${formatNumber(item.State, 0)} / ${formatNumber(item.Sacrifices, 0)}</small>`;
	} else {
		amount = `<small title="固定资产">${formatNumber(item.Sacrifices, 0)}</small>`;
	}

	let tag = renderCharacterTag(item);
	let depth = renderCharacterDepth(item);
	let id = item.Id;
	if(item.CharacterId) id = item.CharacterId;
	let time = item.LastOrder;
	let avatar = `<a href="/rakuen/topic/crt/${id}?trade=true" class="avatar l" target="right"><span class="avatarNeue avatarReSize32 ll" style="background-image:url('${normalizeAvatar(item.Icon)}')"></span></a>`;
	let cancel = `<span><small data-id="${id}" class="cancel_auction">[取消]</small></span>`;
	let badge = renderBadge(item);
	let chara;
	if(type=='auction'){
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${item.Rate.toFixed(2)})</small>
<div class="row"><small class="time">${formatTime(time)}</small>
${cancel}</div></div>${tag}</li>`
	}
	else if (type=='ico'){
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a>
<div class="row"><small class="time">${formatTime(item.End)}</small><span><small>${formatNumber(item.State, 0)} / ${formatNumber(item.Total, 1)}</small></span>
</div></div><div class="tags tag lv1">ICO进行中</div></li>`
	}
	else if (type=='temple'){
		avatar = `<a href="/rakuen/topic/crt/${id}?trade=true" class="avatar l" target="right"><span class="avatarNeue avatarReSize32 ll" style="background-image:url('${normalizeAvatar(item.Cover)}')"></span></a>`;
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}<span class="badge lv${item.CharacterLevel}">lv${item.CharacterLevel}</span></a> <small class="grey">(+${item.Rate.toFixed(2)})</small>
<div class="row"><small class="time">创建时间：${formatTime(item.Create)}</small><small title="固有资产 / 献祭值">${item.Assets} / ${item.Sacrifices}</small></div>
<div class="tag lv${item.Level}">${item.Level}级圣殿</div></li>`
	}
	else if (item.CharacterId) {
		let pre = caculateICO(item);
		//let percent = formatNumber(item.Total / pre.Next * 100, 0);
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(ICO进行中: lv${pre.Level})</small>
<div class="row"><small class="time">${formatTime(item.End)}</small><span><small>${formatNumber(item.Users, 0)}人 / ${formatNumber(item.Total, 1)} / ₵${formatNumber(pre.Price, 2)}</small></span>
${cancel}</div></div><div class="tags tag lv${pre.Level}">ICO进行中</div></li>`
	}
	else{
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${item.Rate.toFixed(2)} / ${formatNumber(item.Total, 0)} / ₵${formatNumber(item.MarketValue, 0)})</small>
<div class="row"><small class="time">${formatTime(item.LastOrder)}</small>${amount}<span title="买入 / 卖出 / 成交">${depth}</span>
${cancel}</div></div>${tag}</li>`
	}
	return chara;
}

function showInitialPrice(charaId){
	getData(`chara/charts/${charaId}/2019-08-08`, (d) => {
		if (d.State === 0) {
			let price = d.Value[0].Begin.toFixed(2);
			let time = d.Value[0].Time.replace('T',' ');
			$('#kChartButton').after(`<span title="上市时间:${time}">发行价：${price}</span>`);
		}
	});
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

/*
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
function setSplitButton(type){
	let text = (type == 'bid') ? '拆单买入' : '拆单卖出';
	$(`#grailBox .trade_box .${type} .trade_list`).append(`<div style="display:none"><div class="label total">0</div><button id="split_${type}Button" class="active ${type}">${text}</button></div>`);
	$(`.${type} .amount`).on('input',function () {
		let amount = $(`.${type} .amount`).val();
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
function splitorderList(charaId){
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
*/
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

function showOwnTemple() {
	let pre_temple = settings.pre_temple;
	let temples = document.querySelectorAll('#grailBox .assets_box .assets .item');
	let me = followList.user;
	if(!me){
		me = $('#new_comment .reply_author a')[0].href.split('/').pop();
		followList.user = me;
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
	}
	for(let i = 0; i < temples.length; i++) {
		let user = temples[i].querySelector('.name a').href.split('/').pop();
		if(user === me) {
			temples[i].classList.add('my_temple');
			if(pre_temple == 'on') $('#grailBox .assets_box .assets').prepend(temples[i]);
			break;
		}
	}
}

function countTempleNum(charaId) {
	getData(`chara/temple/${charaId}`, (d)=> {
		let templeAll = {1:0,2:0,3:0};
		d.Value.forEach(x => {templeAll[x.Level]++});
		/*
		let $myTemple = $('#grailBox .assets_box .assets .item.my_temple');
		if($myTemple.length) {
			let my_temple_level = 1 + ['silver', 'gold', 'purple'].findIndex(x => $myTemple.hasClass(x));
			templeAll[my_temple_level] = $(document.createElement('span')).css({
				'color': '#0084B4',
				'text-decoration': 'underline',
				'font-weight': 'bold'
			}).html(templeAll[my_temple_level])[0].outerHTML;
		}*/
		$('#grailBox .assets_box .bold .sub').before(`<span class="sub"> (${templeAll[3]} + ${templeAll[2]} + ${templeAll[1]})</span>`);
		showTempleRate(charaId); //显示圣殿股息
	});
}

function showTempleRate(charaId){
	getData(`chara/${charaId}`, (d)=> {
		let templeRate = d.Value.Rate * (d.Value.Level+1) * 0.3;
		$('#grailBox .assets_box .bold').append(`<span class="sub" title="圣殿持股单股股息"> (${formatNumber(templeRate,2)})</span>`);
	});
}

function mergeorderList(orderListHistory){
	let mergedorderList = [], i = 0;
	mergedorderList.push(orderListHistory[0]);
	for(let j = 1; j < orderListHistory.length; j++){
		if((orderListHistory[j].Price == mergedorderList[i].Price) && Math.abs(new Date(orderListHistory[j].TradeTime) - new Date(mergedorderList[i].TradeTime))<10*1000){
			//10s内同价格订单合并
			mergedorderList[i].Amount += orderListHistory[j].Amount;
		}
		else{
			mergedorderList.push(orderListHistory[j]);
			i++;
		}
	}
	return mergedorderList;
}

function mergeorderListHistory(charaId){
	getData(`chara/user/${charaId}`, (d) =>  {
		if (d.State === 0 && d.Value) {
			$(`.ask .ask_list li[class!=ask]`).hide();
			let askHistory = mergeorderList(d.Value.AskHistory);
			for (let i = 0; i < askHistory.length; i++) {
				let ask = askHistory[i];
				if(ask) $('.ask .ask_list').prepend(`<li title="${formatDate(ask.TradeTime)}">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel">[成交]</span></li>`);
			}
			$(`.bid .bid_list li[class!=bid]`).hide();
			let bidHistory = mergeorderList(d.Value.BidHistory);
			for (let i = 0; i < bidHistory.length; i++) {
				let bid = bidHistory[i];
				if(bid) $('.bid .bid_list').prepend(`<li title="${formatDate(bid.TradeTime)}">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel">[成交]</span></li>`);
			}

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
	if($('#kChartButton').length){
		$('#kChartButton').before(button);
	}
	else{
		$('#grailBox .title .text').after(button);
	}

	$('#followCharaButton').on('click', () => {
		if(followList.charas.includes(charaId)){
			followList.charas.splice(followList.charas.indexOf(charaId),1);
			$('#followCharaButton').text('[关注角色]');
		}
		else{
			followList.charas.unshift(charaId);
			$('#followCharaButton').text('[取消关注]');
		}
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
	});
}

function showEndTime(charaId){
	getData(`chara/${charaId}`, (d) => {
		if(d.State == 0){
			let endTime = (d.Value.End).slice(0,19);
			$('#grailBox .title .text').append(`<div class="sub" style="margin-left: 20px">结束时间: ${endTime}</div>`);
		}
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
					followList.auctions.unshift(charaId);
					$('#followAuctionButton').text('[取消关注]');
				}
				localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
			});
		}
	});
}

function loadUserAuctions(ids) {
	$('.auction_tip').hide();
	$('#cancelAuctionButton').hide();
	$('#bidAuctionButton').attr({'disabled': true, 'class': 'inactive'});
	postData('chara/auction/list', ids, (d) => {
		$('#bidAuctionButton').attr({'disabled': false, 'class': 'active'});
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
					$('.trade.auction .price').val(a.Price);
					$('.trade.auction .amount').val(a.Amount);
					let total = formatNumber(a.Price * a.Amount, 2);
					$("#TB_window .label .total").text(`合计 -₵${total}`);
					$('#cancelAuctionButton').show();
				}
			});
		}
	});
}

function fixAuctions(charaId){
	getData(`chara/${charaId}`, (d) => {
		let chara = d.Value;
		getData(`chara/user/${chara.Id}/valhalla@tinygrail.com/false`, (d) => {
			if (d.State == 0) {
				chara.Price = d.Value.Price;
				chara.State = d.Value.Amount;
				let button = `<button id="auctionButton2" class="text_button">[参与竞拍]</button>`;
				if(d.Value.Amount == 0) button = `<button id="auctionButton2" class="text_button">[萌王投票]</button>`;
				$('#buildButton').before(button);
				$('#auctionButton').hide();
				$('#auctionButton2').on('click', () => {
					openAuctionDialog(chara);
				});
			}
		});
	});
}

function cancelAuction(chara){
	let message = '确定取消竞拍？';
	let Day = new Date().getDay();
	if(Day == 6) message = '周六取消竞拍将收取20%税，确定取消竞拍？';
	if (!confirm(message)) return;
	$("#TB_window .loading").show();
	$('#TB_window .label').hide();
	$("#TB_window .desc").hide();
	$("#TB_window .trade").hide();
	getData(`chara/user/auction/1/100`,(d) => {
		let id = 0;
		for(let i = 0;i < d.Value.Items.length; i++){
			if(chara.Id == d.Value.Items[i].CharacterId){
				id = d.Value.Items[i].Id;
				break;
			}
		}
		if(id){
			postData(`chara/auction/cancel/${id}`, null, (d) => {
				$("#TB_window .loading").hide();
				$('#TB_window .label').show();
				$("#TB_window .desc").show();
				$("#TB_window .trade").show();
				if (d.State == 0){
					$('#TB_window .trade').hide();
					$('#TB_window .label').hide();
					$('#TB_window .desc').text('取消竞拍成功');
				}
				else alert(d.Message);
			});
		}
		else{
			$("#TB_window .loading").hide();
			$('#TB_window .desc').text('未找到竞拍角色');
		}
	});
}

function bidAuction(chara) {
	$("#TB_window .loading").show();
	$('#TB_window .label').hide();
	$("#TB_window .desc").hide();
	$("#TB_window .trade").hide();
	let price = $('.trade.auction .price').val();
	let amount = $('.trade.auction .amount').val();
	postData(`chara/auction/${chara.Id}/${price}/${amount}`, null, (d) => {
		$("#TB_window .loading").hide();
		$('#TB_window .label').show();
		$("#TB_window .desc").show();
		$("#TB_window .trade").show();
		if (d.State == 0) {
			let message = d.Value;
			$('#TB_window .trade').hide();
			$('#TB_window .label').hide();
			$('#TB_window .desc').text(message);
		} else {
			alert(d.Message);
		}
	});
}

function openAuctionDialog(chara) {
	let auction_num = chara.State;
	if(settings.auction_num == 'one') auction_num = 1;
	let price = Math.ceil(chara.Price * 100)/100;
	let total = formatNumber(price * chara.State, 2);
	let dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;">
<div class="title" title="拍卖底价 / 竞拍数量 / 流通股份">股权拍卖 - #${chara.Id} 「${chara.Name}」 ₵${formatNumber(chara.Price, 2)} / ${formatNumber(chara.State, 0)} / ${formatNumber(chara.Total, 0)}</div>
<div class="desc">输入竞拍出价和数量参与竞拍</div>
<div class="label"><span class="input">价格</span><span class="input">数量</span><span class="total">合计 -₵${total}</span></div>
<div class="trade auction">
<input class="price" type="number" min="${price}" value="${price}">
<input class="amount" type="number" min="1" max="${chara.State}" value="${auction_num}">
<button id="bidAuctionButton" class="active">确定</button><button id="cancelAuctionButton">取消竞拍</button></div>
<div class="loading" style="display:none"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);
	let ids = [chara.Id];
	loadUserAuctions(ids);
	$('#cancelAuctionButton').on('click', function() {
		cancelAuction(chara);
	});
	$('#bidAuctionButton').on('click', function () {
		bidAuction(chara);
	});

	$('#TB_closeWindowButton').on('click', closeDialog);
	$('#TB_window .auction input').on('keyup', () => {
		let price = $('.trade.auction .price').val();
		let amount = $('.trade.auction .amount').val();
		total = formatNumber(price * amount, 2);
		$("#TB_window .label .total").text(`合计 -₵${total}`);
	});
}

function showAuctionHistory(charaId){
	let button = `<button id="auctionHistorys" class="text_button">[往期拍卖]</button>`;
	$('#auctionHistoryButton').after(button);
	$('#auctionHistoryButton').hide();
	$('#auctionHistorys').on('click', () => {
		getData(`chara/${charaId}`, ((d) => {
			let chara = d.Value;
			let page = 1;
			openHistoryDialog(chara, page);
		}));
	});
}

function openHistoryDialog(chara, page) {
	let dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;max-width:640px;min-width:400px;">
<div class="loading"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);
	//$('#TB_window').css("margin-left", $('#TB_window').width() / -2);
	//$('#TB_window').css("margin-top", $('#TB_window').height() / -2);
	$('#TB_closeWindowButton').on('click', closeDialog);
	$('#TB_overlay').on('click', closeDialog);
	const week_ms = 7*24*3600*1000;
	new Promise(resolve => getData(`chara/charts/${chara.Id}/2019-08-08`, (d) => {
		let templeWeek = Math.floor((new Date() - new Date('2019/10/05'))/week_ms + 1);
		let icoWeek = Math.floor((new Date() - new Date(d.Value[0].Time))/week_ms + 1);
		resolve(Math.min(templeWeek, icoWeek));
	}))
		.then(week => new Promise(resolve => getData(`chara/auction/list/${chara.Id}/${page}`, (d) => {
		$('#TB_window .loading').hide();
		if (d.State == 0 && d.Value.length > 0) {
			let success = 0;
			let total = 0;
			let $result = $(document.createElement('div')).addClass("result");
			d.Value.forEach((a) => {
				let state = "even";
				let name = "失败";
				if (a.State == 1) {
					success++;
					total += a.Amount;
					state = "raise";
					name = "成功";
				}
				let record =`
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
			let record =`<div class="desc">无拍卖数据</div>`;
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

function getShareBonus() {
	let asiaTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Shanghai"});
	asiaTime = new Date(asiaTime);
	let Day = asiaTime.getDay();
	if(Day == 6){
		getData('event/share/bonus/check', (d) => {
			if (d.State === 0) {
				getWeeklyShareBonus();
			}
		});
	}
}

function hideBonusButton() {
	if(!$('#bonusButton').length) return;
	getData('event/share/bonus/test', (d) => {
		if(d.State == 0 && d.Value.Share > 1500*7) $('#bonusButton').hide();
		//else $('#shareBonusButton').hide();
	});
}

function showHideGrailBox() {
	let config = settings.hide_grail;
	if(config=='on'){
		$('#grail').hide();
		$('#pager1').hide();
	}
	/*let text = config=='on' ? '隐藏' : '显示';
	let hideGrailBtn = $(`<a href="javascript:void(0)" class="chiiBtn">${text}小圣杯</a>`);
	$(`#grail`).before(hideGrailBtn);
	showHide(config);
	function showHide(config){
		console.log(settings.hide_grail);
		if(config=='on'){
			settings.hide_grail = 'on';
			localStorage.setItem('TinyGrail_settings',JSON.stringify(settings));
			$(hideGrailBtn).text('显示小圣杯');
			$('#grail').hide();
			$('#pager1').hide();
		}
		else{
			settings.hide_grail = 'off';
			localStorage.setItem('TinyGrail_settings',JSON.stringify(settings));
			$(hideGrailBtn).text('隐藏小圣杯');
			$('#grail').show();
			$('#pager1').show();
		}
	}
	$(hideGrailBtn).on('click', () => {
		config = config=='on'?'off':'on';
		showHide(config);
	});*/
}

function showTopWeek() {
	getData(`chara/topweek`, (d) => {
		let totalExtra = 0, totalPeople = 0;
		for(let i=0; i<d.Value.length;i++){
			totalExtra += d.Value[i].Extra;
			totalPeople += d.Value[i].Type;
		}
		for(let i=0; i<d.Value.length;i++){
			let score = d.Value[i].Extra + d.Value[i].Type * totalExtra / totalPeople;
			let buff = $(`#topWeek .assets .item`)[i].querySelector('.tag');
			$(buff).attr('title','综合得分:'+formatNumber(score,2));
			let auction_button = $(`<div class="name auction" data-id="${d.Value[i].CharacterId}">
<span title="竞拍人数 / 竞拍数量 / 拍卖总数">${d.Value[i].Type} / ${d.Value[i].Assets} / ${d.Value[i].Sacrifices}</span></div>`);
			$($(`#topWeek .assets .item`)[i]).append(auction_button);
			let chara = {"Id":d.Value[i].CharacterId, "Name":d.Value[i].CharacterName, "Price":d.Value[i].Price, "State":d.Value[i].Sacrifices, "Total":0};
			auction_button.on('click', () => {openAuctionDialog(chara);});
		}
		$('#topWeek .auction_button').hide();
	});
}

class AutoFulfillICO {
	constructor() {
		this._$fulfillButton = $(document.createElement('button'))
		.addClass('text_button').css('margin', '0 10px').text('[自动补款]')
		.on('click', () => this._autoFulfill());
	}

	addButton() {
		$('#grailBox .desc').eq(2).append(this._$fulfillButton);
	}

	async _autoFulfill() {
		let charaId = location.pathname.split('/').pop();
		let targetAmount = prompt('自动补款，请输入目标金额：', 100000);
		if(targetAmount === null) return;
		if(isNaN(targetAmount) || targetAmount <= 0) {
			alert('金额错误, 设置失败.');
			return;
		}
		let advanceInSecond = prompt('请设置补款时间，ICO结束前的秒数：', 60);
		if(advanceInSecond === null) return;
		if(isNaN(advanceInSecond) || advanceInSecond <= 0) {
			alert('时间错误, 设置失败.');
			return;
		}
		let endTime = await retryPromise(resolve => getData(`chara/${charaId}`, d => resolve(d.Value.End)));
		endTime = new Date(endTime.slice(0, 19) + "+08:00");
		let delay = endTime - Date.now() - advanceInSecond*1000;
		setTimeout(this._fulfillICO, delay, charaId, targetAmount);
		this._$fulfillButton[0].disabled = true;
		this._$fulfillButton[0].innerHTML = '[已设置自动补款]';
		this._$fulfillButton.after(`目标金额：${targetAmount} 补款时间：${new Date(endTime - advanceInSecond*1000)}`);
		alert(`设置成功！\n请勿关闭或刷新本页面，并保证余额充足，网络畅通。\n在ICO结束前${advanceInSecond}秒将会自动补足到${targetAmount}cc.`);
	}

	async _fulfillICO(charaId, targetAmount) {
		let currentAmount = await retryPromise(resolve => getData(`chara/${charaId}`, d => resolve(d.Value.Total)));
		if(targetAmount < currentAmount) {
			alert('注资已超额');
			return;
		} else if(targetAmount == currentAmount) {
			alert('注资已达标');
			return;
		}
		let offer = targetAmount - currentAmount < 1000? 1000: targetAmount - currentAmount;
		await retryPromise(resolve => postData(`chara/join/${charaId}/${offer}`, null, resolve));
		location.reload();
	}
}

function add_chara_info() {
	let charaId = $('#grailBox .title .name a')[0].href.split('/').pop();
	followChara(charaId);
	fixAuctions(charaId); //修改默认拍卖底价和数量
	loadUserAuctions([charaId]); //显示竞拍情况
	showAuctionHistory(charaId); //历史拍卖
	followAuctions(charaId); //关注竞拍情况
	showInitialPrice(charaId); //显示发行价
	//splitorderList(charaId);  //自动拆单 (数量税已取消)
	priceWarning(); //买入价格过高提醒
	if(settings.merge_order == 'on') mergeorderListHistory(charaId); //合并同一时间订单历史记录
	showOwnTemple(); //显示自己的圣殿
	countTempleNum(charaId); //显示各级圣殿数量
}

function add_ico_info() {
	let charaId = location.pathname.split('/').pop();
	followChara(charaId);
	showEndTime(charaId);
	new AutoFulfillICO().addButton();
}


function launchObserver({
	parentNode,
	selector,
	failCallback=null,
	successCallback=null,
	stopWhenSuccess=true,
	config={'childList': true, 'subtree': true},
}) {
	// if parent node does not exist, return
	if(!parentNode) return;
	const observeFunc = mutationList => {
		if(!document.querySelector(selector)) {
			if(failCallback) failCallback();
			return;
		}
		if(stopWhenSuccess) observer.disconnect();
		if(successCallback) successCallback();
	}
	let observer = new MutationObserver(observeFunc);
	observer.observe(parentNode, config);
}

// character page
if(location.pathname.startsWith('/rakuen/topic/crt') || location.pathname.startsWith('/character')) {
	let parentNode = document.getElementById('subject_info') || document.getElementById('columnCrtB');
	// charater trade info
	let chara_fetched = false;
	launchObserver({
		parentNode: parentNode,
		selector: '#grailBox .assets_box',
		failCallback: () => {chara_fetched = false},
		successCallback: () => {
			if(chara_fetched) return;
			chara_fetched = true;
			add_chara_info();
		},
		stopWhenSuccess: false,
	});
	// charater ico info
	let ico_fetched = false;
	launchObserver({
		parentNode: parentNode,
		selector: '#grailBox .trade .money',
		failCallback: () => {ico_fetched = false},
		successCallback: () => {
			if(ico_fetched) return;
			ico_fetched = true;
			add_ico_info();
		},
		stopWhenSuccess: false,
	});
}
// rakuen homepage
else if (location.pathname.startsWith('/rakuen/home')) {
	//周六未领取股息则自动领取
	if(settings.get_bonus == 'on') getShareBonus();
	//隐藏签到
	launchObserver({
		parentNode: document.body,
		selector: '#grailBox2 #bonusButton',
		successCallback: hideBonusButton,
	});
	//显示萌王榜排名数值
	launchObserver({
		parentNode: document.body,
		selector: '#topWeek .assets .item',
		successCallback: showTopWeek,
	});
}
// menu page
else if (location.pathname.startsWith('/rakuen/topiclist')) {
	launchObserver({
		parentNode: document.getElementById('rakuenTab'),
		selector: '#recentMenu',
		successCallback: loadHelperMenu,
	});
}
// user homepage
else if (location.pathname.startsWith('/user')) {
	launchObserver({
		parentNode: document.body,
		selector: '#recentMenu',
		successCallback: showHideGrailBox,
	});
}
