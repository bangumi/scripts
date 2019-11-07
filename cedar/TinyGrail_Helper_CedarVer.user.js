// ==UserScript==
// @name        TinyGrail Helper CedarVer
// @namespace   tv.bgm.cedar.tinygrailhelper
// @version     0.9
// @description 显示角色发行价，显示拍卖情况，高亮自己的圣殿，股息高于低保隐藏签到
// @author      Cedar, Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(character|rakuen\/home|rakuen\/topic\/crt).*
// @grant       GM_addStyle
// ==/UserScript==

GM_addStyle(`
.assets .my_temple.item .card {
  box-shadow: 0px 0px 5px #FFEB3B;
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
}`);

const api = 'https://tinygrail.com/api/';

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

function showInitialPrice(charaId) {
  getData(`chara/charts/${charaId}/2019-08-08`, function (d, s) {
    if (d.State === 0) {
      let price = parseFloat(d.Value[0].Begin).toFixed(2);
      $('#grailBox .title .text').append(`<span>发行价：${price}</span>`);
    }
  });
}

function showOwnTemple() {
  let temples = document.querySelectorAll('#grailBox .assets_box .assets .item');
  let me = document.querySelector('#new_comment .reply_author a').href;
  for(let i = 0; i < temples.length; i++) {
    if(temples[i].querySelector('.name a').href == me) {
      temples[i].classList.add('my_temple');
      break;
    }
  }
}

function loadUserAuctions(ids) {
  postData('chara/auction/list', ids, (d) => {
    if (d.State == 0) {
      d.Value.forEach((a) => {
        if (a.State != 0) {
          var userAuction = `<span class="user_auction" title="竞拍人数 / 竞拍数量">${formatNumber(a.State, 0)} / ${formatNumber(a.Type, 0)}</span>`;
          $(`#auctionHistoryButton`).before(userAuction);
        }
        if (a.Price != 0) {
          var myAuction = `<span class="my_auction" title="出价 / 数量">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>`;
          $(`#auctionHistoryButton`).before(myAuction);
        }
      });
    }
  });
}

function hideBonusButton() {
  getData('event/share/bonus/test', (d) => {
    if(d.State == 0 && d.Value.Share > 1500*7) $('#bonusButton').hide();
    //else $('#shareBonusButton').hide();
  });
}

let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
let observer = new MutationObserver(function() {
  // use '.progress_bar' to skip ICO characters
  if(!$('#grailBox .progress_bar, #grailBox .assets_box, #grailBox.rakuen_home button.daily_bonus').length) return;
  observer.disconnect();
  if($('#grailBox .assets_box').length) {
    let charaId = document.location.pathname.split('/').pop();
    showInitialPrice(charaId);
    loadUserAuctions([charaId]);
    showOwnTemple();
  }
  else if($('#grailBox.rakuen_home #bonusButton').length) {
    hideBonusButton();
  }
});
let parentNode = location.pathname.startsWith('/rakuen/topic/crt')? document.getElementById('subject_info'): document.body;
observer.observe(parentNode, {'childList': true, 'subtree': true});
