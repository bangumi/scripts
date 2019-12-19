// ==UserScript==
// @name        TinyGrail Helper CedarVer
// @namespace   tv.bgm.cedar.tinygrailhelper
// @version     1.2.6
// @description 显示角色发行价，显示拍卖情况，自动拆单，高亮自己的圣殿，股息高于低保隐藏签到，关注角色，关注竞拍，查看往期竞拍，ICO自动补款. fork自Liaune的插件
// @author      Cedar, Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(character|rakuen/topiclist|rakuen/home|rakuen/topic/crt).*/
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
.assets .my_temple.item .card {
  box-shadow: 3px 3px 5px #FFEB3B;
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
html[data-theme='dark'] .assets .my_temple.item .card {
  box-shadow: 0px 0px 15px #FFEB3B;
  border: 1px solid #FFC107;
}
img.cover, html[data-theme='dark'] img.cover,
#TB_window, html[data-theme='dark'] #TB_window {
  background-color: transparent;
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
  var d = JSON.stringify(data);
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
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.ceil(n * k) / k;
    };

  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
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

// ============================== //

async function retryPromise(callback, n=10, sleeptime=300) {
  let error;
  while(n--) {
    try {
      return await new Promise(callback);
    } catch (err) {
      error = err;
      await new Promise(resolve => setTimeout(resolve, sleeptime)); // sleep 300 ms by default
    }
  }
  throw error;
};

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

function loadFollowAuction() {
  var ids = followList.auctions;
  postData('chara/list', ids, function (d, s) {
    if (d.State === 0) {
      loadCharacterList(d.Value,'auction');
      loadUserAuctions(ids);
    }
  });
}

function loadFollowChara() {
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

function setSplitButton(type) {
  let text = type === 'bid'? '拆单买入' : '拆单卖出';
  let $splitBtn = $(document.createElement('button')).addClass(`active ${type}`).attr('id', `split_${type}Button`).html(text).hide();

  $(`.${type} .amount`).on('input',function () {
    var amount = $(`.${type} .amount`).val();
    if(amount > 500) {
      $(`#split_${type}Button`).show();
      $(`#${type}Button`).hide();
    } else {
      $(`#split_${type}Button`).hide();
      $(`#${type}Button`).show();
    }
  });
  $(`#grailBox .${type} .trade_list #${type}Button`).before($splitBtn);
}

function splitOrder(charaId) {
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
      break;
    }
  }
}

function countTempleNum(charaId) {
  getData(`chara/temple/${charaId}`, function (d) {
    let counts = {3: 0, 2: 0, 1: 0};
    d.Value.forEach(v => counts[v.Level]++);
    let $countsEl = $(document.createElement('span'))
      .addClass('sub').html(` (${counts[3]} + ${counts[2]} + ${counts[1]})`);
    $('#grailBox .assets_box .bold .sub').before($countsEl);
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
  if(followList.charas.includes(charaId)) {
    button = `<button id="followCharaButton" class="text_button">[取消关注]</button>`;
  }
  else {
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

function showAuctionHistory(charaId) {
  let $btn = $(document.createElement('button')).addClass('text_button').html('[往期拍卖]');
  $btn.on('click', () => getData(`chara/${charaId}`, d => openHistoryDialog(d.Value, 1)));
  $('#auctionHistoryButton').after($btn).hide();
  $('#auctionHistorys').on('click', () => getData(`chara/${charaId}`, d => openHistoryDialog(d.Value, 1)));
}

function openHistoryDialog(chara, page) {
  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
<div id="TB_window" class="dialog" style="display:block;max-width:640px;">
<div class="loading"></div>
<a id="TB_closeWindowButton" title="Close">X关闭</a>
</div>`;
  $('body').append(dialog);
  $('#TB_closeWindowButton').on('click', closeDialog);
  const week_ms = 7*24*3600*1000;
  new Promise(resolve => getData(`chara/charts/${chara.Id}/2019-08-08`, d => {
    let templeWeek = Math.floor((new Date() - new Date(2019, 9, 5))/week_ms + 1);
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
      openHistoryDialog(chara,page);
    });
    $('#lastweek').on('click', () => {
      page++;
      closeDialog();
      openHistoryDialog(chara,page);
    });
    resolve();
  })));
}

function hideBonusButton() {
  if(!document.getElementById('bonusButton')) return;
  getData('event/share/bonus/test', d => {
    if(d.State == 0 && d.Value.Share > 1500*7) $('#bonusButton').hide();
    //else $('#shareBonusButton').hide();
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
    const advanceInSecond = 60;
    let charaId = location.pathname.split('/').pop();
    let targetAmount = prompt('自动补款，请输入目标金额：', 100000);
    if(targetAmount === null) return;
    if(isNaN(targetAmount) || targetAmount <= 0) {
      alert('金额错误, 设置失败.');
      return;
    }
    let endTime = await retryPromise(resolve => getData(`chara/${charaId}`, d => resolve(d.Value.End)));
    let [y, m, d, hr, min, sec] = endTime.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)/).slice(1).map(x => parseInt(x, 10));
    let delay = new Date(y, m-1, d, hr, min, sec) - Date.now() - advanceInSecond*1000;
    setTimeout(this._fulfillICO, delay, charaId, targetAmount);
    this._$fulfillButton[0].disabled = true;
    this._$fulfillButton[0].innerHTML = '[已设置自动补款]';
    this._$fulfillButton.after(`目标金额：${targetAmount}`);
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

function observeBonus(mutationList, observer) {
  if(!document.querySelector('#grailBox.rakuen_home button.daily_bonus')) return;
  observer.disconnect();
  hideBonusButton();
}

let fetched = false;
function observeChara(mutationList, observer) {
  if(!document.querySelector('#grailBox .trade .money, #grailBox .assets_box')) {
    fetched = false;
    return;
  }
  if(fetched) return;
  let charaId = document.location.pathname.split('/').pop();
  if(document.querySelector('#grailBox .title')) followChara(charaId); //关注角色
  if(document.querySelector('#grailBox .assets_box')) {
    fetched = true;
    showInitialPrice(charaId);
    splitOrder(charaId);
    loadUserAuctions([charaId]);
    showAuctionHistory(charaId);
    followAuctions(charaId);
    showOwnTemple();
    countTempleNum(charaId);
  } // use '.trade .money' to detect ICO characters (instead of '.progress_bar')
  else if(document.querySelector('#grailBox .trade .money')) {
    observer.disconnect();
    new AutoFulfillICO().addButton();
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
