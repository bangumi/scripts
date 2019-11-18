// ==UserScript==
// @name         TinyGrail Income Predictor CedarVer
// @namespace    Cedar.chitanda.TinyGrailIncomePredictor
// @version      1.3.5
// @description  Calculate income for tiny Grail, add more temple info
// @author       Cedar, chitanda
// @include      /^https?://(bgm\.tv|bangumi\.tv)/user/.+$/
// @grant       GM_addStyle
// ==/UserScript==

'use strict';


GM_addStyle(`
.grail_list li{
  position:relative;
}
span.badgeBox {
  width: 20px;
  height: 20px;
  position: absolute;
  top: -10px;
  left: -10px;
  border-radius: 50%;
  background-color: rgba(255,0,0,0.7);
  text-align: center;
  line-height: 20px;
  padding: 2px;
  color: white;
  font-weight:bold;
  visibility: hidden;
}
a.badgeName{
  font-weight:bold;
  color: dodgerblue;
}
a.badgeName:hover{
  color: blueviolet;
}
#grail .item .templePrice {
  cursor: pointer;
}
#grail .horizontalOptions ul li {
  padding: 3px 0;
  cursor: pointer;
}
`);


class IncomeAnalyser {
  constructor() {
    this._bgmId = location.pathname.split('user/')[1];

    let numEl = document.createElement('span'); numEl.innerHTML = '-';
    this._badgeCharaNumEl = numEl.cloneNode(true);
    this._badgeStockNumEl = numEl.cloneNode(true);
    this._totalCharaStockNumEl = numEl.cloneNode(true);
    this._totalCharaIncomeNumEl = numEl.cloneNode(true);
    this._totalTempleStockNumEl = numEl.cloneNode(true);
    this._totalTempleIncomeNumEl = numEl.cloneNode(true);
    this._totalStockNumEl = numEl.cloneNode(true);
    this._totalIncomeEl = numEl.cloneNode(true);
    this._totalTaxEl = numEl.cloneNode(true);
    this._afterTaxIncomeEl = numEl.cloneNode(true);
    this._avgHoldingCostEl = numEl.cloneNode(true);

    let elWrapper = $(document.createElement('span')).css({'margin-right': '5px', 'min-width': '160px', 'display': 'inline-block'});
    this.stockEl = $(document.createElement('div'))
      .css({'padding': '10px 0', 'font-weight': 'bold', 'font-size': '14px', 'border-top': '1px solid #CCC'})
      .append(
        $(document.createElement('div')).append(
          elWrapper.clone().html("新番角色数：").append(this._badgeCharaNumEl).attr('title', '新番角色在52周内有参与TV或剧场版'),
          elWrapper.clone().html("新番持股量：").append(this._badgeStockNumEl),
          elWrapper.clone().html("角色总持股：").append(this._totalCharaStockNumEl),
          elWrapper.clone().html("角色总股息：").append(this._totalCharaIncomeNumEl)
        ),
        $(document.createElement('div')).append(
          elWrapper.clone().html("计息圣殿股：").append(this._totalTempleStockNumEl).attr('title', '拥有圣殿的角色献祭的股数的一半'),
          elWrapper.clone().html("圣殿总股息：").append(this._totalTempleIncomeNumEl),
          elWrapper.clone().html("计息持股量：").append(this._totalStockNumEl).attr('title', '角色持股 + 圣殿持股'),
          elWrapper.clone().html("税前总股息：").append(this._totalIncomeEl)
        ),
        $(document.createElement('div')).append(
          elWrapper.clone().html("个人所得税：").append(this._totalTaxEl),
          elWrapper.clone().html("税后总股息：").append(this._afterTaxIncomeEl),
          // elWrapper.clone().html("持股成本均价：").append(this._avgHoldingCostEl).attr('title', '持有的所有股票的加权市价')
        )
      );

    this._badgeStockNum = 0;
    this._normalStockNum = 0;
    this._charaIncome = 0;
    this._templeStockNum = 0;
    this._templeIncome = 0;

    this._charaInfo = null;
    this._templeInfo = null;
  }

  doStatistics() {
    this._prepare();
    Promise.all([this._charaFetch(), this._templeFetch()])
    .then(() => {
      console.log('calculating');
      this._getTemplePrice();
      this._addTempleCover();
      this._calcRealIncome();
      this._totalStockNumEl.innerHTML = this._templeStockNum/2 + this._badgeStockNum + this._normalStockNum;
    });
  }

  _prepare() {
    $('#grail .chara_list .grail_list').remove();
    $(`#grail .temple_list .grail_list`).remove();
    $('#pager1').remove();
    $('#pager2').remove();
    $('#grail .chara_list .loading').show();
    $(`#grail .temple_list .loading`).show();
  }

  _charaFetch() {
    return new Promise(resolve =>
      getData(`chara/user/chara/${this._bgmId}/1/2000`, d => {
        console.log('got charaInfo');
        if (d.State !== 0) return;
        this._charaInfo = d.Value.Items;
        let $page = $(document.createElement('ul')).addClass('grail_list page1')
          .append(this._charaInfo.map(renderUserCharacter));
        $('#grail .chara_list').append($page);
        $('#grail .chara_list .loading').hide();
        $(document.createElement('span')).addClass('badgeBox').html('0').prependTo($page.find('li'));
        this._calcStockIncome(this._charaInfo);
        this._renderBonusStock(this._charaInfo);
        // this._calcAvgHoldingCost(this._charaInfo);
        resolve();
      })
    );
  }

  _templeFetch() {
    return new Promise(resolve =>
      getData(`chara/user/temple/${this._bgmId}/1/2000`, d => {
        console.log('got templeInfo');
        if (d.State !== 0) return;
        this._templeInfo = d.Value.Items;
        let $page = $(document.createElement('ul')).addClass('grail_list page1')
          .append(this._templeInfo.map(renderTemple));
        $('#grail .temple_list').append($page);
        $('#grail .temple_list .loading').hide();
        this._calcTempleIncome(this._templeInfo);
        resolve();
      })
    );
  }

  _calcStockIncome() {
    this._badgeStockNum = this._normalStockNum = this._charaIncome = 0;
    let badgeBox = document.getElementsByClassName('badgeBox');
    let charaName = document.querySelectorAll('.chara_list .grail_list .avatar.name');
    let charaRateBox = document.querySelectorAll('.chara_list .grail_list .feed');
    this._charaInfo.forEach((chara, i) => {
      chara.Bonus? this._badgeStockNum += chara.State: this._normalStockNum += chara.State;
      this._charaIncome += chara.State * chara.Rate;
    });
    this._badgeCharaNumEl.innerHTML = this._charaInfo.filter(chara => chara.Bonus > 0).length;
    this._badgeStockNumEl.innerHTML = this._badgeStockNum;
    this._totalCharaStockNumEl.innerHTML = this._badgeStockNum + this._normalStockNum;
    this._totalCharaIncomeNumEl.innerHTML = this._charaIncome.toFixed(2);
  }

  _renderBonusStock() {
    let badgeBox = document.getElementsByClassName('badgeBox');
    let charaName = document.querySelectorAll('.chara_list .grail_list .avatar.name');
    let charaRateBox = document.querySelectorAll('.chara_list .grail_list .feed');
    this._charaInfo.forEach((chara, i) => {
      let bonusNum = chara.Bonus;
      if (bonusNum) {
        badgeBox[i].innerHTML = bonusNum;
        badgeBox[i].style.visibility = 'visible';
        charaName[i].classList.add('badgeName');
      }
      if(bonusNum && chara.Rate!==0.75 || !bonusNum && chara.Rate!==0.1) {
        let charaRate = document.createElement('span');
        charaRate.innerHTML = ` ×${chara.Rate.toFixed(2)}`;
        charaRateBox[i].appendChild(charaRate);
      }
    });
  }

  _calcAvgHoldingCost() {
    let totalHoldingCost = 0;
    this._charaInfo.forEach(chara => {
      totalHoldingCost += chara.Current * chara.State;
    });
    this._avgHoldingCostEl.innerHTML = ((totalHoldingCost / (this._badgeStockNum + this._normalStockNum)) || 0).toFixed(2);
  }


  _calcTempleIncome() {
    this._templeIncome = this._templeStockNum = 0;
    this._templeInfo.forEach((temple, i) => {
      this._templeIncome += temple.Rate * temple.Sacrifices/2;
      this._templeStockNum += temple.Sacrifices;
    });
    this._totalTempleIncomeNumEl.innerHTML = this._templeIncome.toFixed(2);
    this._totalTempleStockNumEl.innerHTML = parseInt(this._templeStockNum/2);
  }

  _addTempleCover() {
    $('#grail .temple_list').on('click', '.item .card', e => {
      let cid = $(e.srcElement).data('id');
      let temple = this._templeInfo.find(t => t.CharacterId == cid);
      showTemple(temple, null);
    });
  }

  _calcRealIncome() {
    let totalIncome = this._charaIncome + this._templeIncome;
    let tax = this._collectTax(totalIncome);
    this._totalIncomeEl.innerHTML = totalIncome.toFixed(2);
    this._totalTaxEl.innerHTML = tax.toFixed(2);
    this._afterTaxIncomeEl.innerHTML = (totalIncome - tax).toFixed(2);
  }

  _collectTax(income) {
    let tax = 0;
    const taxRate = [0.75, 0.5, 0.25, 0.1];
    const threshold = [400000, 200000, 100000, 50000];
    for(let i = 0; i < taxRate.length; i++) {
      if(income > threshold[i]) {
        tax += (income - threshold[i]) * taxRate[i];
        income = threshold[i];
      }
    }
    return tax;
  }

  //获取塔的拍卖底价
  _getTemplePrice() {
    getData('chara/user/assets/valhalla@tinygrail.com/true', d => {
      if (d.State !== 0) return;
      let templeId = Array.from(document.querySelectorAll('.temple_list .grail_list .item .card')).map(x => $(x).data('id'));
      let titleSpan = document.querySelectorAll('.temple_list .grail_list .item .title>span');
      let allTempleInfo = d.Value.Characters;
      titleSpan.forEach((title, i) => {
        let idx = allTempleInfo.findIndex(x => x.Id === templeId[i]);
        if(idx < 0) {
          $(title)
            .html(`${title.title.split('/')[1].trim()} / Sold out`)
            .attr('title', '圣殿持股 / 已售罄');
        } else {
          $(title).addClass('templePrice')
            .html(`${title.title.split('/')[1].trim()} / ₵${allTempleInfo[idx].Price.toFixed(2)}`)
            .attr('title', '圣殿持股 / 拍卖底价')
            .on('click', function() {openAuctionDialog(allTempleInfo[idx])});
        }
      });
    })
  }
}

let observer = new MutationObserver(function() {
  let analyser = new IncomeAnalyser();
  let $initTab = $('#initTab');
  if(!$initTab.length) return;
  observer.disconnect();
  let $countBtn = $(document.createElement('a')).attr('href', "javascript:void(0)")
    .addClass("chiiBtn").html('计算股息').on('click', () => {analyser.doStatistics()});
  $initTab.after($countBtn);
  $("#grail .horizontalOptions").append(analyser.stockEl);
});
observer.observe(document.getElementById('user_home'), {'childList': true, 'subtree': true});


const api = 'https://tinygrail.com/api/';
function getData(url, callback) {
  if (!url.startsWith('http')) url = api + url;
  $.ajax({
    url: url,
    type: 'GET',
    xhrFields: {withCredentials: true},
    success: callback
  });
}

function postData(url, data, callback) {
  var d = JSON.stringify(data);
  if (!url.startsWith('http')) url = api + url;
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: d,
    xhrFields: {withCredentials: true},
    success: callback
  });
}

function getOssSignature(path, hash, type, callback) {
  postData(`chara/oss/sign/${path}/${hash}/${type}`, null, function (d) {
    if (callback) callback(d);
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

function renderUserCharacter(chara) {
  var title = `₵${formatNumber(chara.Current, 2)} / +${formatNumber(chara.Fluctuation * 100, 2)}%`;
  if (chara.Fluctuation <= 0)
    title = `₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Fluctuation * 100, 2)}%`;

  var item = `<li title="${title}"><a href="/character/${chara.Id}" target="_blank" class="avatar"><span class="groupImage"><img src="${normalizeAvatar(chara.Icon)}"></span></a>
      <div class="inner"><a href="/character/${chara.Id}" target="_blank" class="avatar name">${chara.Name}</a><br>
        <small class="feed" title="持股数量 / 固定资产">${formatNumber(chara.State, 0)} / ${formatNumber(chara.Sacrifices, 0)}</small></div></li>`;
  return item;
}

function getLargeCover(cover) {
  if (cover.indexOf('/crt/m/') >= 0)
    return cover.replace('/m/', '/l/');

  if (cover.indexOf('tinygrail.') >= 0)
    return cover + '!w480';

  return cover;
}

function getSmallCover(cover) {
  if (cover.indexOf('/crt/g/') >= 0)
    return cover.replace('/g/', '/m/');

  if (cover.indexOf('tinygrail.') >= 0)
    return cover + '!w150';

  return cover;
}

function renderTemple(temple) {
  var cover = getSmallCover(temple.Cover);
  var avatar = normalizeAvatar(temple.Avatar);
  var name = '光辉圣殿';
  var rate = '+0.20';
  var full = '500';

  if (temple.Level == 2) {
    name = '闪耀圣殿';
    rate = '+0.40';
    full = '2,500';
  } else if (temple.Level == 3) {
    name = '奇迹圣殿';
    rate = '+0.80';
    full = '12,500';
  }

  var card = `<div class="item">
          <div class="card" data-id="${temple.CharacterId}" style="background-image:url(${cover})">
            <div class="tag"><span>${temple.Level}</span></div>
            <div class="buff">+${formatNumber(temple.Rate, 2)}</div>
          </div>
          <div class="name" title="${temple.Name}">
            <span><a href="/character/${temple.CharacterId}" target="_blank">${temple.Name}</a></span>
          </div>
          <div class="title">
            <span title="${rate} / ${formatNumber(temple.Sacrifices, 0)} / ${full}">${name} ${formatNumber(temple.Sacrifices, 0)} / ${full}</span>
          </div>
        </div>`

  return card;
}

function closeDialog() {
  $('#TB_overlay').remove();
  $('#TB_window').remove();
}

function openAuctionDialog(chara) {
  var price = Math.ceil(chara.Price);
  var total = formatNumber(price * chara.State, 2);
  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog" style="display:block;max-width:640px;">
    <div class="title" title="拍卖底价 / 竞拍数量 / 流通股份">股权拍卖 - #${chara.Id} 「${chara.Name}」 ₵${formatNumber(chara.Price, 2)} / ${formatNumber(chara.State, 0)} / ${formatNumber(chara.Total, 0)}</div>
    <div class="desc">输入竞拍出价和数量参与竞拍</div>
    <div class="label"><span class="input">价格</span><span class="input">数量</span><span class="result">合计 -₵${total}</span></div>
    <div class="trade auction">
      <input class="price" type="number" min="${price}" value="${price}">
      <input class="amount" type="number" min="1" max="${chara.State}" value="${chara.State}">
      <button id="bidAuctionButton" class="active">确定</button><button id="cancelDialogButton">取消</button></div>
    <div class="loading" style="display:none"></div>
    <a id="TB_closeWindowButton" title="Close">X关闭</a>
  </div>`;
  $('body').append(dialog);
  $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  $('#cancelDialogButton').on('click', closeDialog);
  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#TB_window .auction input').on('keyup', () => {
    var price = $('.trade.auction .price').val();
    var amount = $('.trade.auction .amount').val();
    var total = formatNumber(price * amount, 2);
    $("#TB_window .label .result").text(`合计 -₵${total}`);
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
        $(`#valhalla .user_auction[data-id=${chara.Id}]`).text(`₵${formatNumber(price, 2)} / ${formatNumber(amount, 0)} `);
      } else {
        alert(d.Message);
      }
    });
  });
}

function showTemple(temple, chara) {
  var cover = getLargeCover(temple.Cover);
  var action = `<div class="action">
      <button style="display:none" id="changeCoverButton" class="text_button">[修改]</button>
      <button style="display:none" id="resetCoverButton" class="text_button">[重置]</button>
      <input style="display:none" id="picture" type="file" accept="image/*">
    </div>`;
  // if (temple.UserId == userId) {
  //   $('#changeCoverButton').show();
  //   $('#resetCoverButton').show();
  // } else {
  //   getGameMaster((r) => {
  //     $('#resetCoverButton').show();
  //   });
  // }

  getUserAssets((d) => {
    if (d.State == 0) {
      if (d.Value.Id == temple.UserId) {
        $('#changeCoverButton').show();
        $('#resetCoverButton').show();
      }
      if (d.Value.Type == 999 || d.Value.Id == 702) {
        $('#resetCoverButton').show();
      }
    }
  });

  var position = '';
  if (cover.indexOf('//lain.') >= 0)
    position = 'background-position:top;';

  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog temple" style="display:block;">
    <div class="card" style="background-image:url(${cover});${position}">
      ${action}
      <div class="loading" style="display:none;padding-top:600px;"></div>
      <a id="TB_closeWindowButton" title="Close">X关闭</a>
    </div>
  </div>`;
  $('body').append(dialog);
  fixRightTempleImageReso();

  $('#TB_closeWindowButton').on('click', closeDialog);
  //$('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  //$('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  $('#changeCoverButton').on('click', (e) => {
    $("#picture").click();
    e.stopPropagation();
  });
  $('#resetCoverButton').on('click', (e) => {
    resetTempleCover(temple);
    e.stopPropagation();
  });
  $("#picture").on("change", function () {
    if (this.files.length > 0) {
      var file = this.files[0];
      var data = window.URL.createObjectURL(file);

      $('#TB_window .card').css('background-image', `url(${data})`);
      $('#TB_window .action').hide();
      $('#TB_window .loading').show();

      if (!/image+/.test(file.type)) {
        alert("请选择图片文件。");
        return;
      }

      var reader = new FileReader();
      reader.onload = (ev) => {
        var result = ev.target.result;
        $.getScript('https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js', function () {
          var hash = md5(result);
          var blob = dataURLtoBlob(result);
          var url = `https://tinygrail.oss-cn-hangzhou.aliyuncs.com/cover/${hash}.jpg`;

          getOssSignature('cover', hash, encodeURIComponent(file.type), function (d) {
            if (d.State === 0) {
              var xhr = new XMLHttpRequest();
              xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                  if (xhr.status == 200) {
                    postData(`chara/temple/cover/${temple.CharacterId}`, url, function (d) {
                      if (d.State == 0) {
                        alert("更换封面成功。");
                        if (chara)
                          loadTradeBox(chara);
                      } else {
                        alert(d.Message);
                      }
                    });
                  } else {
                    alert('图片上传失败。');
                  }

                  $('#TB_window .action').show();
                  $('#TB_window .loading').hide();
                }
              };

              xhr.open('PUT', url);
              xhr.setRequestHeader('Authorization', `OSS ${d.Value.Key}:${d.Value.Sign}`);
              xhr.setRequestHeader('x-oss-date', d.Value.Date);
              xhr.send(blob);
            }
          });
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

function fixRightTempleImageReso() {
  let pageWidth = window.innerWidth;
  let pageHeight = window.innerHeight;
  let imgHeight = 640;
  let imgWidth = 480;

  if (window.innerWidth <= 640) {
    imgHeight = pageHeight * 0.9;
    imgWidth = imgHeight * 2 / 3;
  }

  let styles = {
    'height': imgHeight + 'px',
    'width': imgWidth + 'px',
  };

  $('#TB_window.dialog.temple .card').css(styles);
}

function getUserAssets(callback) {
  getData('chara/user/assets', callback);
}
