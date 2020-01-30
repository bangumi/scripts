// ==UserScript==
// @name         TinyGrail Helper
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      1.9.7.1
// @description  为小圣杯增加一些小功能
// @author       Liaune,Cedar
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
borderList: 1px solid #FFC107;
}

html[data-theme='dark'] .assets .my_temple.item .card {
box-shadow: 0px 0px 15px #FFEB3B;
borderList: 1px solid #FFC107;
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

.result {
max-height: 500px;
overflow: auto;
}
`);
const api = 'https://tinygrail.com/api/';
let lastEven = false;

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

function renderBadge(item, withCrown, withNew, withLevel) {
	let badge = '';

	if (withLevel){
		badge = `<span class="badge level lv${item.Level}">lv${item.Level}</span>`;
	}
	if (item.Type == 1 && withNew) {
		badge += `<span class="badge new" title="+${formatNumber(item.Rate, 1)}新番加成剩余${item.Bonus}期">×${item.Bonus}</span>`;
	}
	if (item.State > 0 && withCrown){
		badge += `<span class="badge crown" title="获得${item.State}次萌王">×${item.State}</span>`;
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
	let price = 0;
	let amount = 0;
	let next = 100000;
	let nextUser = 15;

	//人数等级
	let heads = ico.Users;
	let headLevel = Math.floor((heads - 10) / 5);
	if (headLevel < 0) headLevel = 0;

	//资金等级
	while (ico.Total >= next && level < headLevel) {
		level += 1;
		next += Math.pow(level + 1, 2) * 100000;
	}
	if(level){
		amount = 10000 + (level - 1) * 7500;
		price = ico.Total / amount;
	}
	nextUser = (level + 1) * 5 + 10;

	return { Level: level, Next: next, Price: price, Amount: amount, Users: nextUser - ico.Users };
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
//关注列表
let followList = JSON.parse(localStorage.getItem('TinyGrail_followList')) || {"user":'',"charas":[], "ico":[], "auctions":[]};
//设置
let settings = JSON.parse(localStorage.getItem('TinyGrail_settings')) ||
	{"pre_temple":"on","hide_grail":"off","auction_num":"one","merge_order":"on","get_bonus":"on","gallery":"off","scratch":"new"};
//自动建塔
let autoTempleList = JSON.parse(localStorage.getItem('TinyGrail_autoTempleList')) || [];
setInterval(function(){
	autoTempleList = JSON.parse(localStorage.getItem('TinyGrail_autoTempleList'));
	if(autoTempleList.length) autoBuildTemple(autoTempleList);
},10*60*1000);
//关注ICO自动凑人头
setInterval(function(){
	followList = JSON.parse(localStorage.getItem('TinyGrail_followList'));
	let icoList = followList.ico,joinList = [];
	if(icoList.length){
		for(let i = 0; i < icoList.length; i++){
			let endTime = icoList[i].End;
			let leftTime = (new Date(endTime).getTime() - new Date().getTime())/1000; //剩余时间：秒
			console.log(`ico check#${icoList[i].CharacterId} -「${icoList[i].Name}」 ${leftTime}s left`);
			if(leftTime < 60*60){
				joinList.push(icoList[i]);
			}
		}
		autoJoinICO(joinList);
	}
},60*60*1000);
//ico自动补款
let fillicoList = JSON.parse(localStorage.getItem('TinyGrail_fillicoList')) || [];
setInterval(function(){
	fillicoList = JSON.parse(localStorage.getItem('TinyGrail_fillicoList')) || [];
	let icoList = [];
	for(let i = 0; i < fillicoList.length; i++){
		let endTime = fillicoList[i].end;
		let leftTime = (new Date(endTime).getTime() - new Date().getTime())/1000; //剩余时间：秒
		console.log(`ico check#${fillicoList[i].charaId} -「${fillicoList[i].name}」 目标金额:₵${fillicoList[i].target} ${leftTime}s left`);
		if(leftTime < 60){
			icoList.push(fillicoList[i]);
			delete fillicoList[i];
		}
	}
	fillicoList = remove_empty(fillicoList);
	localStorage.setItem('TinyGrail_fillicoList',JSON.stringify(fillicoList));
	fullfillICO(icoList);
},60*1000);

let charas_list = [];

function getData(url) {
	if (!url.startsWith('http')) url = api + url;
	return new Promise((resovle, reject) => {
		$.ajax({
			url: url,
			type: 'GET',
			xhrFields: { withCredentials: true },
			success: res => {resovle(res)},
			error: err => {reject(err)}
		});
	});
}

function postData(url, data) {
	let d = JSON.stringify(data);
	if(!url.startsWith('http')) url = api + url;
	return new Promise((resovle, reject) => {
		$.ajax({
			url: url,
			type: 'POST',
			contentType: 'application/json',
			data: d,
			xhrFields: { withCredentials: true },
			success: res => {resovle(res)},
			error: err => {reject(err)}
		});
	});
}

function retry(fn, times=10, delay=1000) {
	let err = null;
	return new Promise(function(resolve, reject) {
		let attempt = function() {
			fn.then(resolve)
				.catch((err)=> {
				console.log(`Attempt #${times} failed`);
				if (0 == times) reject(err);
				else {
					times--;
					setTimeout(()=>{attempt()}, delay);
				}
			});
		};
		attempt();
	});
};

function loadHelperMenu() {
	let item = `<li><a href="#" id="helperMenu" class="top">助手</a>
<ul>
<li><li><a href="#" id="followChara">关注角色</a></li>
<a href="#" id="followICO">关注ICO</a></li>
<a href="#" id="followAuction">关注竞拍</a></li>
<li><a href="#" id="myICO">我的ICO</a></li>
<li><a href="#" id="myTemple">我的圣殿</a></li>
<li><a href="#" id="autoBuild">自动建塔</a></li>
<li><a href="#" id="autoICO">自动补款</a></li>
<li><a href="#" id="temporaryList">临时列表</a></li>
<li><a href="#" id="scratch">刮刮乐</a></li>
<li><a href="#" id="settings">设置</a></li>
</ul>
</li>`;
	$('.timelineTabs').append(item);

	$('#followChara').on('click', function () {
		menuItemClicked(loadFollowChara);
	});

	$('#followICO').on('click', function () {
		menuItemClicked(loadFollowICO);
	});

	$('#followAuction').on('click', function () {
		menuItemClicked(loadFollowAuction);
	});

	$('#myICO').on('click', function () {
		menuItemClicked(loadMyICO);
	});

	$('#myTemple').on('click', function () {
		menuItemClicked(loadMyTemple);
	});

	$('#autoBuild').on('click', function () {
		menuItemClicked(loadAutoBuild);
	});

	$('#autoICO').on('click', function () {
		menuItemClicked(loadAutoFillICO);
	});

	$('#temporaryList, #helperMenu').on('click', function () {
		menuItemClicked(creatTemporaryList);
	});

	$('#scratch').on('click', function () {
		menuItemClicked(loadscratchResult);
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
	followList = JSON.parse(localStorage.getItem('TinyGrail_followList'));
	let start = 50 * (page - 1);
	let ids = followList.auctions.slice(start, start+50);
	let totalPages = Math.ceil(followList.auctions.length / 50);
	postData('chara/list', ids).then((d)=>{
		if (d.State === 0) {
			console.log(d.Value);
			loadCharacterList(d.Value, page, totalPages, loadFollowAuction, 'auction',true);
			loadUserAuctions(ids);
		}
	});
}

function loadFollowChara(page){
	followList = JSON.parse(localStorage.getItem('TinyGrail_followList'));
	let start = 50 * (page - 1);
	let ids = followList.charas.slice(start, start+50);
	let totalPages = Math.ceil(followList.charas.length / 50);
	postData('chara/list', ids).then((d)=>{
		if (d.State === 0) {
			loadCharacterList(d.Value, page, totalPages, loadFollowChara, 'chara',true);
		}
	});
}

function loadFollowICO(page){
	followList = JSON.parse(localStorage.getItem('TinyGrail_followList'));
	let start = 50 * (page - 1);
	let charas = [],icoList = followList.ico ||[];
	for(let i = 0; i < icoList.length; i++) charas.push(icoList[i].CharacterId);
	let ids = charas.slice(start, start+50);
	let totalPages = Math.ceil(charas.length / 50);
	postData('chara/list', ids).then((d)=>{
		if (d.State === 0) {
			loadCharacterList(d.Value, page, totalPages, loadFollowICO, 'chara_ico',true);
		}
	});
}

function loadMyICO(page){
	getData(`chara/user/initial/0/${page}/50`).then((d)=>{
		if (d.State == 0) {
			loadCharacterList(d.Value.Items,d.Value.CurrentPage, d.Value.TotalPages, loadMyICO, 'ico',false);
		}
	});
}

function loadMyTemple(page){
	getData(`chara/user/temple/0/${page}/50`).then((d)=>{
		if (d.State == 0) {
			loadCharacterList(d.Value.Items,d.Value.CurrentPage, d.Value.TotalPages, loadMyTemple, 'temple',false);
		}
	});
}

function loadAutoBuild(page){
	autoTempleList = JSON.parse(localStorage.getItem('TinyGrail_autoTempleList'));
	let charas = [];
	for(let i = 0; i < autoTempleList.length; i++) charas.push(autoTempleList[i].charaId);
	let start = 50 * (page - 1);
	let ids = charas.slice(start, start+50);
	let totalPages = Math.ceil(charas.length / 50);
	postData('chara/list', ids).then((d)=>{
		if (d.State === 0) {
			loadCharacterList(d.Value, page, totalPages, loadAutoBuild, 'chara',false);
		}
	});
}

function loadAutoFillICO(page){
	fillicoList = JSON.parse(localStorage.getItem('TinyGrail_fillicoList'));
	let charas = [];
	for(let i = 0; i < fillicoList.length; i++) charas.push(fillicoList[i].charaId);
	let start = 50 * (page - 1);
	let ids = charas.slice(start, start+50);
	let totalPages = Math.ceil(charas.length / 50);
	postData('chara/list', ids).then((d)=>{
		if (d.State === 0) {
			loadCharacterList(d.Value, page, totalPages, loadAutoBuild, 'chara_ico',false);
		}
	});
}

function creatTemporaryList(page){
	closeDialog();
	let dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;max-width:640px;min-width:400px;">
<div class="bibeBox" style="padding:10px">
<label>在超展开左边创建角色列表 请输入角色url或id，如 https://bgm.tv/character/29282 或 29282，一行一个</label>
<textarea rows="10" class="quick" name="urls"></textarea>
<input class="inputBtn" value="创建临时列表" id="submit_list" type="submit"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>
</div>`;
	$('body').append(dialog);
	$('#TB_closeWindowButton').on('click', closeDialog);
	$('#TB_overlay').on('click', closeDialog);
	$('#submit_list').on('click', () => {
		charas_list = [];
		let charas = $('.bibeBox textarea').val().split('\n');
		for(let i = 0; i < charas.length; i++){
			try{
				let charaId = charas[i].match(/(character\/)?(\d+)/)[2];
				charas_list.push(charaId);
			}catch(e) {};
		}
		loadTemperaryList(1);
		closeDialog();
	});
}

function loadTemperaryList(page){
	let start = 50 * (page - 1);
	let ids = charas_list.slice(start, start+50);
	console.log(ids);
	let totalPages = Math.ceil(charas_list.length / 50);
	postData('chara/list', ids).then((d)=>{
		if (d.State === 0) {
			loadCharacterList(d.Value, page, totalPages, loadTemperaryList, 'chara',false);
		}
	});
}

function loadscratchResult(){
	let ids = [],amounts=[];
	scratch();
	function scratch(){
		getData('event/scratch/bonus2').then((d) => {
			if (d.State == 0) {
				for(let i = 0; i < d.Value.length; i++){
					ids.push(d.Value[i].Id);
					amounts.push(d.Value[i].Amount);
				}
				scratch();
			} else {
				postData('chara/list', ids).then((d)=>{
					for(let i = 0; i < d.Value.length; i++){
						d.Value[i].Sacrifices = amounts[i];
					}
					loadCharacterList(d.Value, 1, 1, loadscratchResult , 'chara',false);
				});
			}
		});
	}
}

/*
function withdrawAuction(){//取消拍卖(非周六时间)以提取现金，记录原订单，再次点击存回
	$('#eden_tpc_list ul').html('');
	getData(`chara/user/assets`).then((d)=>{
		let Balance = d.Value.Balance;
		getData(`chara/user/auction/1/500`).then((d)=>{
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
	getData(`chara/user/assets`).then((d)=>{
		let Balance = d.Value.Balance;
		getData(`chara/bids/0/1/1000`).then((d)=>{
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
			//postData(`chara/auction/cancel/${Id}`, null).then((d)=>{
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
		await retry(getData(`chara/user/${charaId}`).then((d)=>{
			for(let i = 0; i< d.Value.Bids.length; i++){
				let line = 'line_even';
				if (i%2==0) line = 'line_odd';
				let tid = d.Value.Bids[i].Id;
				let price = d.Value.Bids[i].Price;
				let amount = d.Value.Bids[i].Amount;
				Balance += price * amount;
				//postData(`chara/bid/cancel/${tid}`, null).then((d)=>{
					let message = `<li class="${line} item_list item_log" data-id="${charaId}"><span class="tag raise">+${formatNumber(price*amount,2)}</span>
₵${formatNumber(Balance,2)}<span class="row"><small class="time">取消买单(${tid}) #${charaId} 「${name}」 ${price}*${amount}</small></span></li>`
					$('#eden_tpc_list ul').prepend(message);
				//});
			}
		}));
	}
}
*/

function openSettings(){ //设置
	closeDialog();
	settings = JSON.parse(localStorage.getItem('TinyGrail_settings'));
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
<tr><td valign="top" width="50%">圣殿画廊</td><td valign="top">
<select id="set6"><option value="off" selected="selected">关</option><option value="on">开</option></td></tr>
<tr><td valign="top" width="50%">刮刮乐</td><td valign="top">
<select id="set7"><option value="new" selected="selected">新版</option><option value="old">旧版</option><option value="old_auto">旧版(自动连刮)</option></td></tr>
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
	$('#set6').val(settings.gallery);
	$('#set7').val(settings.scratch);
	$('#submit_setting').on('click', () => {
		settings.hide_grail = $('#set1').val();
		settings.pre_temple = $('#set2').val();
		settings.auction_num = $('#set3').val();
		settings.merge_order = $('#set4').val();
		settings.get_bonus = $('#set5').val();
		settings.gallery = $('#set6').val();
		settings.scratch = $('#set7').val();
		localStorage.setItem('TinyGrail_settings',JSON.stringify(settings));
		$('#submit_setting').val('已保存');
		setTimeout(()=>{closeDialog();},500);
	});
}

function loadCharacterList(list, page, total, more, type,showCancel) {
	$('#eden_tpc_list ul .load_more').remove();
	if (page === 1) $('#eden_tpc_list ul').html('');
	for (let i = 0; i < list.length; i++) {
		let item = list[i];
		//console.log(item);
		let chara = renderCharacter(item, type, lastEven ,showCancel);
		lastEven = !lastEven;
		$('#eden_tpc_list ul').append(chara);
	}
	$('.cancel_auction').on('click', (e) => {
		//if (!confirm('确定取消关注？')) return;
		let id = $(e.target).data('id').toString();
		if(type == 'chara') followList.charas.splice(followList.charas.indexOf(id),1);
		else if(type == 'chara_ico') followList.ico.splice(followList.ico.indexOf(id),1);
		else if(type == 'auction') followList.auctions.splice(followList.auctions.indexOf(id),1);
		localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
		$(`#eden_tpc_list li[data-id=${id}]`).remove();
	});

	$('#eden_tpc_list .item_list').on('click', listItemClicked);
	if (page != total && total > 0) {
		let loadMore = `<li class="load_more"><button id="loadMoreButton" class="load_more_button" data-page="${page + 1}">[加载更多]</button></li>`;
		$('#eden_tpc_list ul').append(loadMore);
		$('#loadMoreButton').on('click', function () {
			let page = $(this).data('page');
			if (more) more(page);
		});
	} else {
		let noMore = '暂无数据';
		if (total > 0)
			noMore = '加载完成';

		$('#eden_tpc_list ul').append(`<li class="load_more sub">[${noMore}]</li>`);
	}
}

function renderCharacter(item,type,even,showCancel) {
	let line = 'line_odd';
	if (even) line = 'line_even';
	let amount = `<small title="固定资产">${formatNumber(item.Sacrifices, 0)}</small>`;

	let tag = renderCharacterTag(item);
	let depth = renderCharacterDepth(item);
	let id = item.Id;
	if(item.CharacterId) id = item.CharacterId;
	let time = item.LastOrder;
	let avatar = `<a href="/rakuen/topic/crt/${id}?trade=true" class="avatar l" target="right"><span class="avatarNeue avatarReSize32 ll" style="background-image:url('${normalizeAvatar(item.Icon)}')"></span></a>`;
	let cancel = '';
	if(showCancel) cancel = `<span><small data-id="${id}" class="cancel_auction">[取消]</small></span>`;
	let badge = renderBadge(item, true, true, true);
	let chara;

	if(type=='auction'){
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${item.Rate.toFixed(2)})</small>
<div class="row"><small class="time">${formatTime(time)}</small>
${cancel}</div></div>${tag}</li>`
	}
	else if (type=='ico'){
		badge = renderBadge(item, false, false, false);
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
		badge = renderBadge(item, false, false, false);
		//let percent = formatNumber(item.Total / pre.Next * 100, 0);
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(ICO进行中: lv${pre.Level})</small>
<div class="row"><small class="time">${formatTime(item.End)}</small><span><small>${formatNumber(item.Users, 0)}人 / ${formatNumber(item.Total, 1)} / ₵${formatNumber(pre.Price, 2)}</small></span>
${cancel}</div></div><div class="tags tag lv${pre.Level}">ICO进行中</div></li>`
	}
	else {
		chara = `<li class="${line} item_list" data-id="${id}">${avatar}<div class="inner">
<a href="/rakuen/topic/crt/${id}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${item.Rate.toFixed(2)} / ${formatNumber(item.Total, 0)} / ₵${formatNumber(item.MarketValue, 0)})</small>
<div class="row"><small class="time">${formatTime(item.LastOrder)}</small>${amount}<span title="买入 / 卖出 / 成交">${depth}</span>
${cancel}</div></div>${tag}</li>`
	}

	return chara;
}

function showInitialPrice(charaId){
	getData(`chara/charts/${charaId}/2019-08-08`).then((d)=>{
		let init_price = d.Value[0].Begin.toFixed(2);
		let time = d.Value[0].Time.replace('T',' ');
		$($('#grailBox .info .text')[1]).append(`<span title="上市时间:${time}">发行价：${init_price}</span>`);
	});
}

function showPrice(charaId){
	getData(`chara/${charaId}`).then((d)=>{
		let price = d.Value.Price.toFixed(2);
		$($('#grailBox .info .text')[1]).append(`<span>评估价：${price}</span>`);
	});
}


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
			await retry(postData(`chara/${type}/${charaId}/${price}/${x}`, null).then((d)=>{
				if(d.Message) alert(d.Message);
			}))
		}
		location.reload();
	};

	$('#split_bidButton').on('click', () => doSplit('bid'));
	$('#split_askButton').on('click', () => doSplit('ask'));
}
*/

function showGallery(){//显示画廊
	if(settings.gallery == 'on'){
		let index = 0;
		$('body').on('keydown', function(e) {
			switch(event.keyCode ){
				case 37:
					closeDialog();
					$(`.item .card`)[index-1].click();
					break;
				case 39:
					closeDialog();
					$(`.item .card`)[index+1].click();
					break;
			}
		});
		$('body').on('touchstart', '#TB_window.temple', function(e) {
			let touch = e.originalEvent;
			let	startX = touch.changedTouches[0].pageX;
			$(this).on('touchmove', function(e) {
				e.preventDefault();
				touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				if (touch.pageX - startX > 20) {//向左
					closeDialog();
					$(`.item .card`)[index-1].click();
					$(this).off('touchmove');
				} else if (touch.pageX - startX < -20) {//向右
					closeDialog();
					$(`.item .card`)[index+1].click();
					$(this).off('touchmove');
				};
			});
		}).on('touchend', function() {
			$(this).off('touchmove');
		});
		setInterval(function (){
			$(`.item .card`).on('click', (e) => {
				index = $(`.item .card`).index(e.currentTarget);
				gallery_mode = true;
			});
		},1000);
	}
}

function priceWarning(){
	let price = $(`.bid .price`).val();
	let amount = $(`.bid .amount`).val();
	$(`#grailBox .trade_box .bid .trade_list`).append(`<div style="display:none"><div class="label total">0</div><button id="confirm_bidButton" class="active bid">买入</button></div>`);
	$(`.bid .price`).on('input',function () {
		let price_now = $(`.bid .price`).val();
		if(price_now > Math.max(price * 3,30)){
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
	let temples = $('#grailBox .assets_box .assets .item');
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
			temples[i].classList.remove('replicated');
			if(pre_temple == 'on') $('#grailBox .assets_box .assets').prepend(temples[i]);
			break;
		}
	}
	$('#expandButton').on('click', () => {showOwnTemple();});
}

function showTempleRate(charaId){
	getData(`chara/${charaId}`).then((d)=>{
		let b = d.Value.Type ? 0.75 : 0;
		let rate = d.Value.Rate;
		let level = d.Value.Level;
		let price = d.Value.Price;
		getData(`chara/temple/${charaId}`).then((d)=>{
			let templeAll = {1:0,2:0,3:0};
			for (let i = 0; i < d.Value.length; i++) {
				templeAll[d.Value[i].Level]++;
			}
			let charaRate = Math.log10(1 + b + price/100 +0.1*templeAll[1] + 0.3*templeAll[2] + 0.6*templeAll[3]) * (Math.log10(level+1)*14+3);
			let templeRate = rate * (level+1) * 0.3 * 2;
			let templeRate1 = charaRate * (level+1) * 0.3 * 2;
			$('#grailBox .assets_box .bold .sub').attr('title', '活股股息:'+formatNumber(charaRate,2));
			$('#grailBox .assets_box .bold .sub').before(`<span class="sub"> (${templeAll[3]} + ${templeAll[2]} + ${templeAll[1]})</span>`);
			$('#expandButton').before(`<span class="sub" title="圣殿股息:${formatNumber(templeRate1,2)}"> (${formatNumber(templeRate,2)})</span>`);
		});
	});
}

function changeTempleCover(charaId){
	$('#grailBox .assets .item').on('click', (e) => {
		let me = followList.user;
		let temple = $(e.currentTarget).data('temple');
		let user = temple.Name;
		if(user != me) setTimeout(()=>{addButton(temple);},500);
	});
	function dataURLtoBlob(dataurl) {
		let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], { type: mime });
	}

	function getOssSignature(path, hash, type, callback) {
		postData(`chara/oss/sign/${path}/${hash}/${type}`, null, function (d) {
			if (callback) callback(d);
		});
	}
	function addButton(temple){
		$('#TB_window .action').append(`<button id="changeCoverButton2" class="text_button" title="修改圣殿封面">[修改]</button>
<button id="copyCoverButton" class="text_button" title="复制圣殿图片为自己圣殿的封面">[复制]</button>
<input style="display:none" id="picture2" type="file" accept="image/*">`);

		$('#changeCoverButton2').on('click', (e) => {
			let cover = prompt("图片url(你可以复制已有圣殿图片的url)：");
			if(cover.match(/w480/)) cover = cover.replace('!w480','');
			postData(`chara/temple/cover/${charaId}/${temple.UserId}`, cover).then((d)=> {
				if (d.State == 0) {
					alert("更换封面成功。");
					location.reload();
				} else {
					alert(d.Message);
				}
			});
		});

		$('#copyCoverButton').on('click', () => {
			let cover = $('#TB_window .container .cover').attr('src');
			if(cover.match(/tinygrail/)) cover = cover.replace('!w480','');
			postData(`chara/temple/cover/${charaId}`, cover).then((d)=> {
				if (d.State == 0) {
					alert("更换封面成功。");
					location.reload();
				} else {
					alert(d.Message);
				}
			});
		});
	}
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
	if(settings.merge_order == 'on') {
		getData(`chara/user/${charaId}`).then((d)=>{
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
}

function remove_empty(array){
	let arr = [];
	for(let i = 0; i < array.length; i++){
		if(array[i]) arr.push(array[i]);
	}
	return arr;
}

async function autoBuildTemple(charas){
	function buildTemple(chara,index,amount){
		postData(`chara/sacrifice/${chara.charaId}/${amount}/false`, null).then((d)=>{
			if (d.State == 0) {
				console.log(`#${chara.charaId} ${chara.name} 献祭${amount} 获得金额 ₵${d.Value.Balance.toFixed(2)}`);
				$('#autobuildButton').text('[自动建塔]');
				removeBuildTemple(chara.charaId);
			} else {
				console.log(`${d.Message}`);
			}
		});
	}
	function postBid(chara, price, amount){
		postData(`chara/bid/${chara.charaId}/${price}/${amount}`, null).then((d)=>{
			if(d.Message) console.log(`#${chara.charaId} ${chara.name} ${d.Message}`);
			else{
				console.log(`买入成交 #${chara.charaId} ${chara.name} ${price}*${amount}`);
				autoBuildTemple([chara]);
			}
		});
	}
	for (let i = 0; i < charas.length; i++) {
		let chara = charas[i];
		console.log(`自动建塔 check #${chara.charaId} ${chara.name}`);
		await retry(getData(`chara/user/${chara.charaId}`).then((d)=>{
			let Amount = d.Value.Amount;
			let Sacrifices = d.Value.Sacrifices;
			if(Sacrifices >= chara.target){
				removeBuildTemple(chara.charaId);
			}
			else if((Amount + Sacrifices) >= chara.target){ //持股达到数量，建塔
				buildTemple(chara, i, chara.target - Sacrifices);
			}
			else getData(`chara/depth/${chara.charaId}`).then((d)=>{
				let AskPrice = d.Value.Asks[0] ? d.Value.Asks[0].Price : 0;
				let AskAmount = d.Value.Asks[0] ? d.Value.Asks[0].Amount : 0;
				if(AskPrice && AskPrice <= chara.bidPrice){ //最低卖单低于买入上限，买入
					postBid(chara, AskPrice, Math.min(AskAmount, chara.target - Amount - Sacrifices));
				}
			});
		}));
	}
}

function removeBuildTemple(charaId){
	for(let i = 0; i < autoTempleList.length; i++){
		if(autoTempleList[i].charaId == charaId){
			autoTempleList.splice(i,1);
			break;
		}
	}
	localStorage.setItem('TinyGrail_autoTempleList',JSON.stringify(autoTempleList));
}

function openBuildDialog(chara){
	autoTempleList = JSON.parse(localStorage.getItem('TinyGrail_autoTempleList')) || [];
	let target = 500, bidPrice = 10;
	let intempleList = false, index = 0;
	for(let i = 0; i < autoTempleList.length; i++){
		if(autoTempleList[i].charaId == chara.Id){
			target = autoTempleList[i].target;
			bidPrice = autoTempleList[i].bidPrice;
			intempleList = true;
			index = i;
		}
	}
	let dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;">
<div class="title" title="目标数量 / 买入价格">
自动建塔 - #${chara.Id} 「${chara.Name}」 ${target} / ₵${bidPrice}</div>
<div class="desc"><p>当已献祭股数+持有股数达到目标数量时将自动建塔</p>
输入 目标数量 / 买入价格(不超过此价格的卖单将自动买入)</div>
<div class="label"><div class="trade build">
<input class="target" type="number" style="width:150px" title="目标数量" value="${target}">
<input class="bidPrice" type="number" style="width:150px" title="卖出下限" value="${bidPrice}">
<button id="startBuildButton" class="active">自动建塔</button><button id="cancelBuildButton">取消建塔</button></div>
<div class="loading" style="display:none"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);

	$('#TB_closeWindowButton').on('click', closeDialog);

	$('#cancelBuildButton').on('click', function(){
		if(intempleList){
			autoTempleList.splice(index,1);
			localStorage.setItem('TinyGrail_autoTempleList',JSON.stringify(autoTempleList));
			alert(`取消自动建塔${chara.Name}`);
			$('#autobuildButton').text('[自动建塔]');
		}
		closeDialog();
	});

	$('#startBuildButton').on('click', function () {
		let info = {};
		info.charaId = chara.Id.toString();
		info.name = chara.Name;
		info.target = $('.trade.build .target').val();
		info.bidPrice =  $('.trade.build .bidPrice').val();
		if(intempleList){
			autoTempleList.splice(index,1);
			autoTempleList.unshift(info);
		}
		else autoTempleList.unshift(info);
		localStorage.setItem('TinyGrail_autoTempleList',JSON.stringify(autoTempleList));
		alert(`启动自动建塔#${chara.Id} ${chara.Name}`);
		closeDialog();
		$('#autobuildButton').text('[自动建塔中]');
		autoBuildTemple(autoTempleList);
	});
}

function setBuildTemple(charaId){
	let charas = [];
	for(let i = 0; i < autoTempleList.length; i++){
		charas.push(autoTempleList[i].charaId);
	}
	let button;
	if(charas.includes(charaId)){
		button = `<button id="autobuildButton" class="text_button">[自动建塔中]</button>`;
	}
	else{
		button = `<button id="autobuildButton" class="text_button">[自动建塔]</button>`;
	}
	if($('#buildButton').length) $('#buildButton').after(button);
	else $('#grailBox .title .text').after(button);

	$('#autobuildButton').on('click', () => {
		getData(`chara/${charaId}`).then((d)=>{
			let chara = d.Value;
			openBuildDialog(chara);
		});
	});
}

function followChara(charaId){  //关注角色
	followList = JSON.parse(localStorage.getItem('TinyGrail_followList'));
	let button = `<button id="followCharaButton" class="text_button">[关注角色]</button>`;
	if(followList.charas.includes(charaId)){
		button = `<button id="followCharaButton" class="text_button">[取消关注]</button>`;
	}
	$('#kChartButton').before(button);

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

function followICO(charaId){  //关注ICO
	followList = JSON.parse(localStorage.getItem('TinyGrail_followList'));
	let charas = [],icoList = followList.ico || [];
	for(let i = 0; i < icoList.length; i++){
		charas.push(icoList[i].CharacterId.toString());
	}
	let button = `<button id="followICOButton" class="text_button" title="最后1小时人数不够时将自动凑人头">[关注ICO]</button>`;
	if(charas.includes(charaId)){
		button = `<button id="followICOButton" class="text_button">[取消关注]</button>`;
	}
	$('#grailBox .title .text').after(button);

	$('#followICOButton').on('click', () => {
		if(charas.includes(charaId)){
			icoList.splice(charas.indexOf(charaId),1);
			$('#followICOButton').text('[关注ICO]');
			followList.ico = icoList;
			localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
		}
		else{
			getData(`chara/${charaId}`).then((d)=>{
				icoList.unshift(d.Value);
				$('#followICOButton').text('[取消关注]');
				followList.ico = icoList;
				localStorage.setItem('TinyGrail_followList',JSON.stringify(followList));
			});
		}
	});
}

async function autoJoinICO(icoList){
	for (let i = 0; i < icoList.length; i++) {
		let charaId = icoList[i].CharacterId;
		await retry(getData(`chara/${charaId}`).then((d)=>{
			if (d.State == 0){
				let offer = 5000;
				let Id = d.Value.Id;
				if(d.Value.Total < 100000 && d.Value.Users < 15){
					getData(`chara/initial/${Id}`).then((d)=>{
						if(d.State == 1){
							postData(`chara/join/${Id}/${offer}`, null).then((d)=>{
								if (d.State === 0) {
									console.log(`#${charaId} 追加注资成功。`);
								}
							});
						}
					});
				}
			}
		}));
	}
}

async function fullfillICO(icoList){
	for (let i = 0; i < icoList.length; i++) {
		let Id = icoList[i].Id;
		let charaId = icoList[i].charaId;
		let target = icoList[i].target;
		await retry(getData(`chara/${charaId}`).then((d)=>{
			if (d.State == 0){
				let offer = target - d.Value.Total;
				if(offer <= 0) console.log(charaId+'总额:'+d.Value.Total+',已达标，无需补款');
				else if(d.Value.Users < 15) console.log(charaId+'人数:'+d.Value.Users+',人数不足，无需补款');
				else {
					offer = Math.max(offer, 5000);
					postData(`chara/join/${Id}/${offer}`, null).then((d)=>{
						if (d.State === 0) {
							console.log(charaId+'补款'+offer);
						} else {
							console.log(d.Message);
						}
					});
				}
			}
		}));
	}
}

function openICODialog(chara){
	fillicoList = JSON.parse(localStorage.getItem('TinyGrail_fillicoList')) || [];
	let target = 100000;
	let inorder = false, index = 0;
	for(let i = 0; i < fillicoList.length; i++){
		if(fillicoList[i].Id == chara.Id){
			target = fillicoList[i].target;
			inorder = true;
			index = i;
		}
	}
	let dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;">
<div class="title" title="目标金额">自动补款 - #${chara.CharacterId} 「${chara.Name}」 ₵${target}</div>
<div class="desc">输入目标金额</div>
<div class="label"><div class="trade ico">
<input class="target" type="number" style="width:150px" value="${target}">
<button id="startfillICOButton" class="active">自动补款</button><button id="cancelfillICOButton">取消补款</button></div>
<div class="loading" style="display:none"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
	$('body').append(dialog);

	$('#TB_closeWindowButton').on('click', closeDialog);

	$('#cancelfillICOButton').on('click', function(){
		if(inorder){
			alert(`取消自动补款${chara.Name}`);
			fillicoList.splice(index,1);
			localStorage.setItem('TinyGrail_fillicoList',JSON.stringify(fillicoList));
		}
		closeDialog();
		console.log(fillicoList);
	});

	$('#startfillICOButton').on('click', function () {
		let info = {};
		info.Id = chara.Id.toString();
		info.charaId = chara.CharacterId.toString();
		info.name = chara.Name;
		info.target = $('.trade.ico .target').val();
		info.end = chara.End;
		if(inorder){
			fillicoList[index] = info;
		}
		else fillicoList.push(info);
		localStorage.setItem('TinyGrail_fillicoList',JSON.stringify(fillicoList));
		alert(`启动自动补款#${chara.Id} ${chara.Name}`);
		closeDialog();
		console.log(fillicoList);
	});
}

function setFullFillICO(charaId){  //设置自动补款
	fillicoList = JSON.parse(localStorage.getItem('TinyGrail_fillicoList')) || [];
	let button;
	let inorder = false;
	for(let i = 0; i < fillicoList.length; i++){
		if(fillicoList[i].charaId == charaId){
			inorder = true;
		}
	}
	if(inorder){
		button = `<button id="followICOButton" class="text_button">[自动补款中]</button>`;
	}
	else{
		button = `<button id="followICOButton" class="text_button">[自动补款]</button>`;
	}
	$('#grailBox .title .text').after(button);
	$('#followICOButton').on('click', () => {
		getData(`chara/${charaId}`).then((d) => {
			let chara = d.Value;
			openICODialog(chara);
		});
	});
}

function showEndTime(charaId){
	getData(`chara/${charaId}`).then((d)=>{
		if(d.State == 0){
			let endTime = (d.Value.End).slice(0,19);
			$('#grailBox .title .text').append(`<div class="sub" style="margin-left: 20px">结束时间: ${endTime}</div>`);
		}
	});
}

function followAuctions(charaId){  //关注竞拍情况
	getData(`chara/user/${charaId}/tinygrail/false`).then((d)=>{
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
	$('#cancelAuctionButton').hide();
	$('#bidAuctionButton').attr({'disabled': true, 'class': 'inactive'});
	postData('chara/auction/list', ids).then((d)=>{
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
	getData(`chara/${charaId}`).then((d)=>{
		let chara = d.Value;
		getData(`chara/user/${chara.Id}/tinygrail/false`).then((d)=>{
			chara.Price = d.Value.Price;
			chara.State = d.Value.Amount;
			let button = `<button id="auctionButton2" class="text_button">[萌王投票]</button>`;
			if (d.State == 0 && d.Value.Amount > 0) button = `<button id="auctionButton2" class="text_button">[参与竞拍]</button>`;
			$('#buildButton').before(button);
			$('#auctionButton').hide();
			$('#auctionButton2').on('click', () => {
				openAuctionDialog(chara);
			});
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
	getData(`chara/user/auction/1/100`).then((d)=>{
		let id = 0;
		for(let i = 0;i < d.Value.Items.length; i++){
			if(chara.Id == d.Value.Items[i].CharacterId){
				id = d.Value.Items[i].Id;
				break;
			}
		}
		if(id){
			postData(`chara/auction/cancel/${id}`, null).then((d)=>{
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
	postData(`chara/auction/${chara.Id}/${price}/${amount}`, null).then((d)=>{
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
	$('.auction_tip').hide();
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
		getData(`chara/${charaId}`).then((d)=>{
			let chara = d.Value;
			let page = 1;
			openHistoryDialog(chara, page);
		});
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
	getData(`chara/charts/${chara.Id}/2019-08-08`).then((d)=>{
		let templeWeek = Math.floor((new Date() - new Date('2019/10/05'))/week_ms + 1);
		let icoWeek = Math.floor((new Date() - new Date(d.Value[0].Time))/week_ms + 1);
		let week = Math.min(templeWeek, icoWeek);
		getData(`chara/auction/list/${chara.Id}/${page}`).then((d)=>{
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
		});
	});
}

function getShareBonus() {
	let asiaTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Shanghai"});
	asiaTime = new Date(asiaTime)
	let Day = asiaTime.getDay();
	if(Day == 6){
		getData('event/share/bonus/check').then((d)=>{
			if (d.State === 0) {
				getWeeklyShareBonus();
			}
		});
	}
}

function hideBonusButton() {
	if(!$('#bonusButton').length) return;
	getData('event/share/bonus/test').then((d)=>{
		if(d.State == 0 && d.Value.Share > 1500*7) $('#bonusButton').remove();
		//else $('#shareBonusButton').hide();
	});
}

function showHideGrailBox() {
	let config = settings.hide_grail;
	if(config=='on'){
		$('#grail').hide();
		setTimeout(()=>{$('#pager1').hide();},500);
	}
}

function showTopWeek() {
	getData(`chara/topweek`).then((d)=>{
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

function oldScratch() {
	if(settings.scratch != 'new'){
		$('#scratchButton').after(`<button id="scratchButton2" class="text_button">[刮刮乐]</button>`);
		$('#scratchButton').hide();
		function scratch(){
			getData('event/scratch/bonus').then((d) => {
				if (d.State == 0) {
					alert(d.Value);
					if(settings.scratch == 'old_auto') scratch();
				} else {
					alert(d.Message);
				}
			});
		}
		$('#scratchButton2').on('click', function(){
			scratch();
		});
	}
}


function add_chara_info() {
	try{
		let charaId = $('#grailBox .title .name a')[0].href.split('/').pop();
		followChara(charaId); //关注角色
		fixAuctions(charaId); //修改默认拍卖底价和数量
		loadUserAuctions([charaId]); //显示竞拍情况
		showAuctionHistory(charaId); //历史拍卖
		followAuctions(charaId); //关注竞拍情况
		showInitialPrice(charaId); //显示发行价
		showPrice(charaId); //显示评估价
		//splitorderList(charaId);  //自动拆单 (数量税已取消)
		priceWarning(); //买入价格过高提醒
		mergeorderListHistory(charaId); //合并同一时间订单历史记录
		showOwnTemple(); //显示自己的圣殿
		showTempleRate(charaId); //显示各级圣殿数量及股息计算值
		changeTempleCover(charaId); //复制他人圣殿封面
		showGallery(); //查看画廊
		setBuildTemple(charaId); //自动建塔
	} catch (e) {};
}

function add_ico_info() {
	let charaId = location.pathname.split('/').pop();
	followICO(charaId); //关注ICO，人数不够时将自动凑人头
	showEndTime(charaId); //显示结束时间
	setBuildTemple(charaId); //自动建塔
	setFullFillICO(charaId); //自动补款
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
	launchObserver({
		parentNode: document.body,
		selector: '#lastTemples',
		successCallback: ()=>{
			hideBonusButton(); //隐藏签到
			showTopWeek(); //显示萌王榜排名数值
			showGallery(); //显示画廊
			oldScratch(); //旧版刮刮乐
		},
	});
	let chara_fetched = false;
	launchObserver({
		parentNode: document.body,
		selector: '#grailBox .assets_box',
		failCallback: () => {chara_fetched = false},
		successCallback: () => {
			if(chara_fetched) return;
			chara_fetched = true;
			add_chara_info();
		},
		stopWhenSuccess: false,
	});
}
// menu page
else if (location.pathname.startsWith('/rakuen/topiclist')) {
	setTimeout(function(){loadHelperMenu()},500);
}
// user homepage
else if (location.pathname.startsWith('/user')) {
	launchObserver({
		parentNode: document.body,
		selector: '#grail',
		successCallback: ()=>{
			showHideGrailBox();
			showGallery();
		},
	});
	let chara_fetched = false;
	launchObserver({
		parentNode: document.body,
		selector: '#grailBox .assets_box',
		failCallback: () => {chara_fetched = false},
		successCallback: () => {
			if(chara_fetched) return;
			chara_fetched = true;
			add_chara_info();
		},
		stopWhenSuccess: false,
	});
}
