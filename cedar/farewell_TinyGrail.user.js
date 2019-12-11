// ==UserScript==
// @name        Farewell TinyGrail
// @namespace   xd.cedar.farewellTinyGrail
// @version     1.0.1
// @description 小圣杯一键退坑
// @author      Cedar
// @include     /^https?://(bgm\.tv|bangumi\.tv)/user/.+$/
// ==/UserScript==

// throw "I'm not gonna leave!";

if(location.pathname.split('user/')[1] !== document.querySelector('#dock .first a').href.split('user/')[1]) return;


const api = 'https://tinygrail.com/api/'
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

  var item = `<li title="${title}"><a href="/character/${chara.Id}" target="_blank" class="avatar"><span class="groupImage"><img src="${normalizeAvatar(chara.Icon)}"></span></a>
      <div class="inner"><a href="/character/${chara.Id}" target="_blank" class="avatar name">${chara.Name}</a><br>
        <small class="feed" title="持股数量 / 固定资产">${formatNumber(chara.State, 0)} / ${formatNumber(chara.Sacrifices, 0)}</small></div></li>`;
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

function cancelAsk(id, callback) {
  postData(`chara/ask/cancel/${id}`, null, callback);
}

function cancelBid(id, callback) {
  postData(`chara/bid/cancel/${id}`, null, callback);
}

function sacrificeCharacter(id, count, captial, callback) {
  postData(`chara/sacrifice/${id}/${count}/${captial}`, null, (d) => {
    if (callback) { callback(d); }
  });
}

// ============================== //

async function retryPromise(callback, n=10) {
  let error;
  while(n--) {
    try {
      return await new Promise(callback);
    } catch(e) {
      error = e;
      await new Promise(resolve => setTimeout(resolve, 200)); // sleep a couple of miliseconds
    }
  }
  throw error;
};

class Farewell {
  constructor(captial) {
    this._bgmId = location.pathname.split('user/')[1];
    this._charaInfo = null;
    this._captial = captial;
    this._charaInfoEl = null;
    this.$farewellInfoEl = $(document.createElement('div')).css('display', 'inline-block');
  }

  _prepare() {
    $('#grail .chara_list .grail_list').remove();
    $('#pager2').remove();
    $('#grail .chara_list .loading').show();
    $('#grail #charaTab').click();
  }

  _charaFetch() {
    return new Promise(resolve =>
      getData(`chara/user/chara/${this._bgmId}/1/2000`, d => {
        console.log('got charaInfo');
        if (d.State !== 0) return;
        this._charaInfo = d.Value.Items.filter(x => x.State).reverse(); // 去除无活股的角色并倒序排列
        resolve();
      })
    );
  }

  _renderCharaPage() {
    this._charaInfoEl = this._charaInfo.map(x => $(renderUserCharacter(x)));
    let $page = $(document.createElement('ul')).addClass('grail_list page1')
      .append(this._charaInfoEl);
    $('#grail .chara_list').append($page);
    $('#grail .chara_list .loading').hide();
  }

  _getTradeInfo(charaId) {
    return retryPromise(resolve => getData(`chara/user/${charaId}`, d => resolve(d.Value)));
  }

  async _cancelTrades(tradeInfo) {
    let askIds = tradeInfo.Asks.map(x => x.Id);
    for(let id of askIds) {
      await retryPromise(resolve => cancelAsk(id, resolve));
      //console.log(`fake cancel, ask Id: ${id}`);
    }
    let bidIds = tradeInfo.Bids.map(x => x.Id);
    for(let id of bidIds) {
      await retryPromise(resolve => cancelBid(id, resolve));
      //console.log(`fake cancel, bid Id: ${id}`);
    }
  }

  async farewell() {
    this._prepare();
    await this._charaFetch();
    this._renderCharaPage();
    let $farewellCharaEl = $(document.createElement('span')).html('各位');
    this.$farewellInfoEl.append('再见，', $farewellCharaEl, '！');
    for(let i = 0; i < this._charaInfo.length; i++) {
      let chara = this._charaInfo[i];
      $farewellCharaEl.html(chara.Name);
      let tradeInfo = await this._getTradeInfo(chara.Id);
      await this._cancelTrades(tradeInfo);
      await retryPromise(resolve => sacrificeCharacter(chara.Id, chara.State, this._captial, resolve));
      //console.log(`fake sacrifice, chara Id: ${chara.Id}`);
      // 等待角色消失..有点仪式感..不然感觉像清理垃圾..
      //this._charaInfoEl[i].fadeOut(1000, function() {$(this).remove()});
      //await new Promise(resolve => setTimeout(resolve, 250));
      await new Promise(resolve => this._charaInfoEl[i].fadeOut(300, function() {
        $(this).remove(); resolve();
      }));
    }
    $farewellCharaEl.html('各位');
  }
}


let observer = new MutationObserver(function() {
  let $grailOptions = $('#grail .horizontalOptions');
  if(!$grailOptions.length) return;
  observer.disconnect();

  // farewell button
  let $captialEl = $(`<label style="margin-right: 10px;"><input type="checkbox" name="captial" id="captial">无塔献祭</label>`)
  let $farewellBtn = $(document.createElement('a'))
    .attr('href', "javascript:void(0)")
    .addClass("chiiBtn").html('一键退坑')
    .on('click', function() {
      if(!confirm('确定退坑吗？本操作无法反悔！\n如果误操作了，请及时关闭页面、刷新页面或者断开网络，以拯救暂未献祭的股票。')) return;
      let farewell = new Farewell(document.querySelector('#captial').checked);
      $farewellBtn.html('退坑中…').off('click');
      $captialEl.children('input').prop('disabled', true);
      $captialEl.after(farewell.$farewellInfoEl);
      farewell.farewell();
    });
  $grailOptions.append(
    $(document.createElement('div'))
      //.addClass('grailInfoBox') // 另一个组件里有这个class的CSS. 毕竟是一次性脚本, 不想重新写CSS了, 没启用那个组件也无所谓.
      .append($farewellBtn, $captialEl)
  );
});
observer.observe(document.getElementById('user_home'), {'childList': true, 'subtree': true});
