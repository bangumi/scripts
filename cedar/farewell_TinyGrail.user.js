// ==UserScript==
// @name        Farewell TinyGrail
// @namespace   xd.cedar.farewellTinyGrail
// @version     1.2
// @description 小圣杯一键退坑
// @author      Cedar
// @include     /^https?://(bgm\.tv|bangumi\.tv)/user/.+$/
// ==/UserScript==

// throw "I'm not gonna leave!";

if(location.pathname.split('user/')[1] !== document.querySelector('#dock .first a').href.split('user/')[1]) return;


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

function renderUserCharacter(chara) {
  var title = `₵${formatNumber(chara.Current, 2)} / +${formatNumber(chara.Fluctuation * 100, 2)}%`;
  if (chara.Fluctuation <= 0)
    title = `₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Fluctuation * 100, 2)}%`;

  var amount = formatNumber(chara.State, 0);
  if (chara.State == 0)
    amount = "--";

  var item = `<li title="${title}"><a href="/character/${chara.Id}" target="_blank" class="avatar"><span class="groupImage"><img src="${normalizeAvatar(chara.Icon)}"></span></a>
      <div class="inner"><a href="/character/${chara.Id}" target="_blank" class="avatar name">${chara.Name}</a><br>
        <small class="feed" title="持股数量 / 固定资产">${amount} / ${formatNumber(chara.Sacrifices, 0)}</small></div></li>`;
  return item;
}

function normalizeAvatar(avatar) {
  if (!avatar) return '//lain.bgm.tv/pic/user/l/icon.jpg';

  if (avatar.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
    return avatar + "!w120";

  var a = avatar.replace("http://", "//");

  // var index = a.indexOf("?");
  // if (index >= 0)
  //   a = a.substr(0, index);

  return a;
}

// ============================== //

const api = 'https://tinygrail.com/api/';
async function fetchGet(url) {
  if (!url.startsWith('http')) url = api + url;
  const response = await fetch(url, {
    //mode: 'no-cors',
    method: 'GET',
    credentials: 'include'
  });
  if(!response.ok) throw new Error(`[HTTP error ${response.status}] ${response.statusText}`);
  return await response.json();
}

async function fetchPost(url, data) {
  if (!url.startsWith('http')) url = api + url;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if(!response.ok) throw new Error(`[HTTP error ${response.status}] ${response.statusText}`);
  return await response.json();
}

async function retryPromise(PromiseLike, n=10, sleeptime=200) {
  let error;
  while(n--) {
    try {
      return await PromiseLike;
    } catch(e) {
      console.log(e);
      error = e;
      await new Promise(resolve => setTimeout(resolve, sleeptime)); // sleep a couple of miliseconds
    }
  }
  throw error;
}

function cancelAsk(id) {
  return retryPromise(fetchPost(`chara/ask/cancel/${id}`, null));
}

function cancelBid(id) {
  return retryPromise(fetchPost(`chara/bid/cancel/${id}`, null));
}

function cancelAuction(id) {
  return retryPromise(fetchPost(`chara/auction/cancel/${id}`, null));
}

function sacrificeCharacter(id, count, captial) {
  return retryPromise(fetchPost(`chara/sacrifice/${id}/${count}/${captial}`, null));
}

function getTradeInfo(charaId) {
  return retryPromise(fetchGet(`chara/user/${charaId}`)).then(d => d.Value);
}

function getBidsList() {
  return retryPromise(fetchGet(`chara/bids/0/1/10000`))
    .then(d => d.State === 0 && d.Value && d.Value.Items? d.Value.Items: null);
}

function getAuctionsList() {
  return retryPromise(fetchGet('chara/user/auction/1/1000'))
    .then(d => d.State === 0 && d.Value && d.Value.Items? d.Value.Items: null);
}

class Farewell {
  constructor(captial, hyperMode=false) {
    this._bgmId = location.pathname.split('user/')[1];
    this._charaInfo = null;
    this._captial = captial;
    this._hyperMode = hyperMode;
    this._charaInfoEl = null;
    this.$farewellInfoEl = $(document.createElement('div')).css('display', 'inline-block');
  }

  async farewell(callback) {
    this._prepare();
    this.$farewellInfoEl.html('准备中…');
    await this._charaFetch();
    this._renderCharaPage();
    for(let i = 0; i < this._charaInfo.length; i++) {
      await this._farewellChara(this._charaInfo[i], this._charaInfoEl[i]);
    }
    this.$farewellInfoEl.html('取消剩余买单…');
    await this._cancelMyBids();
    this.$farewellInfoEl.html('取消拍卖挂单…');
    await this._cancelMyAuctions();
    this.$farewellInfoEl.html(`再见，各位！`);
    if(callback) callback();
  }

  _prepare() {
    $('#grail .chara_list .grail_list').remove();
    $('#pager2').remove();
    $('#grail .chara_list .loading').show();
    $('#grail #charaTab').click();
  }

  // === get chara list === //
  async _charaFetch() {
    let d = await retryPromise(fetchGet(`chara/user/chara/${this._bgmId}/1/4096`));
    if (d.State !== 0) return;
    this._charaInfo = d.Value.Items.filter(x => x.State).reverse(); // 去除无活股的角色并倒序排列
    console.log('got charaInfo');
  }

  _renderCharaPage() {
    this._charaInfoEl = this._charaInfo.map(x => $(renderUserCharacter(x)));
    let $page = $(document.createElement('ul')).addClass('grail_list page1')
      .append(this._charaInfoEl);
    $('#grail .chara_list').append($page);
    $('#grail .chara_list .loading').hide();
  }

  // === remove character === //
  async _farewellChara(chara, charaEl) {
    this.$farewellInfoEl.html(`再见，${chara.Name}！`);
    let tradeInfo = await getTradeInfo(chara.Id);
    await this._cancelTrades(tradeInfo);
    await sacrificeCharacter(chara.Id, chara.State, this._captial);
    //console.log(`fake sacrifice, chara Id: ${chara.Id}`);
    // 高速模式只给很短的延迟, 以极快速度退坑
    //非高速模式则增加延迟, 慢慢等待角色消失, 增强仪式感
    const fadeElapse = this._hyperMode? 20: 300;
    await new Promise(resolve => charaEl.fadeOut(fadeElapse, function() {
      $(this).remove(); resolve();
    }));
  }

  async _cancelTrades(tradeInfo) {
    let askIds = tradeInfo.Asks.map(x => x.Id);
    for(let id of askIds) {
      await cancelAsk(id);
      //console.log(`fake cancel, ask Id: ${id}`);
    }
    let bidIds = tradeInfo.Bids.map(x => x.Id);
    for(let id of bidIds) {
      await cancelBid(id);
      //console.log(`fake cancel, bid Id: ${id}`);
    }
  }

  // === remove all bids === //
  async _cancelMyBids() {
    let bids = await getBidsList();
    if(!bids) return;
    for(let bid of bids) {
      let tradeInfo = await getTradeInfo(bid.Id);
      await this._cancelTrades(tradeInfo);
    }
  }

  // === cancel all auctions === //
  async _cancelMyAuctions() {
    let auctionItems = await getAuctionsList();
    if(!auctionItems) return;
    for(let item of auctionItems) {
      await cancelAuction(item.Id);
      //console.log(`fake cancel, auction Id: ${item.Id}`);
    }
  }
}


let observer = new MutationObserver(function() {
  let $grailOptions = $('#grail .horizontalOptions');
  if(!$grailOptions.length) return;
  observer.disconnect();

  // farewell button
  let $captialEl = $(`<label style="margin-right: 10px;"><input type="checkbox" name="captial" id="captial">无塔献祭</label>`);
  let $hyperModeEl = $(`<label style="margin-right: 10px;"><input type="checkbox" name="hypermode" id="hypermode" checked>高速模式</label>`);
  let $farewellBtn = $(document.createElement('a'))
    .attr('href', "javascript:void(0)")
    .addClass("chiiBtn").html('一键退坑')
    .on('click', function() {
      if(!confirm('确定退坑吗？本操作无法反悔！\n如果误操作了，请及时关闭页面、刷新页面或者断开网络，以拯救暂未献祭的股票。')) return;
      let farewell = new Farewell(document.querySelector('#captial').checked, document.querySelector('#hypermode').checked);

      $farewellBtn.html('退坑中…').off('click');
      $captialEl.children('input').prop('disabled', true);
      $hyperModeEl.children('input').prop('disabled', true);
      $hyperModeEl.after(farewell.$farewellInfoEl);

      farewell.farewell(() => $farewellBtn.html('退坑完成'));
    });
  $grailOptions.append(
    $(document.createElement('div'))
      //.addClass('grailInfoBox') // 另一个组件里有这个class的CSS. 毕竟是一次性脚本, 不想重新写CSS了, 没启用那个组件也无所谓.
      .append($farewellBtn, $captialEl, $hyperModeEl)
  );
});
observer.observe(document.getElementById('user_home'), {'childList': true, 'subtree': true});
