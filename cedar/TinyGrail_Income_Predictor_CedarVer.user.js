// ==UserScript==
// @name         TinyGrail Income Predictor CedarVer
// @namespace    Cedar.chitanda.TinyGrailIncomePredictor
// @version      1.5.4
// @description  Calculate income for tiny Grail, add more temple info
// @author       Cedar, chitanda, mucc
// @include      /^https?://(bgm\.tv|bangumi\.tv)/user/.+$/
// @grant        GM_addStyle
// ==/UserScript==

'use strict';


GM_addStyle(`
/*新番股左上角的圆圈以及名字颜色*/
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
html[data-theme='dark'] a.badgeName {
  font-weight:bold;
  color: lightblue;
}
html[data-theme='dark'] a.badgeName:hover {
  color: lightgreen;
}

/*相关按钮与数据*/
#grail .horizontalOptions ul li, #grail .item .templePrice {
  cursor: pointer;
}
#grail .grailInfoBox {
  padding: 10px 0;
  border-top: 1px solid #CCC;
}
#grail .grailInfoBox .chiiBtn {
  margin: 0 3px;
}
#grail .grailInfoBox div>span {
  font-weight: bold;
  font-size: 14px;
  margin-right: 5px;
  min-width: 160px;
  display: inline-block;
}

/*图表相关*/
#grailChartWrapper {
  overflow: auto;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100vmin;
  height: 95vmin;
  margin: auto;
  background-color: rgba(0,0,0,0.7);
  border-radius: 5px;
  z-index: 102;
}
#grailChart {
  width: 95%;
  margin: auto;
  overflow: auto;
}
#closeGrailChartBtn {
  background: url(/img/ico/closebox.png);
  width: 30px;
  height: 30px;
  cursor: pointer;
  position: fixed;
}
`);


let ChartClass;
$.getScript('https://cdn.jsdelivr.net/npm/chart.js@2.9.3/dist/Chart.bundle.min.js', function () {ChartClass = Chart;});


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

    let elWrapper = $(document.createElement('span'));
    this.$stockEl = $(document.createElement('div'))
      .addClass('grailInfoBox')
      .append(
        $(document.createElement('div')).append(
          elWrapper.clone().html("新番角色数：").append(this._badgeCharaNumEl).attr('title', '新番角色在52周内有参与TV或剧场版'),
          elWrapper.clone().html("新番持股量：").append(this._badgeStockNumEl),
          elWrapper.clone().html("角色总持股：").append(this._totalCharaStockNumEl),
          elWrapper.clone().html("角色总股息：").append(this._totalCharaIncomeNumEl)
        ),
        $(document.createElement('div')).append(
          elWrapper.clone().html("计息圣殿股：").append(this._totalTempleStockNumEl).attr('title', '拥有圣殿的角色所重组的股数的一半'),
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

    this._canvasEl = document.createElement('canvas'); this._canvasEl.width = '500'; this._canvasEl.height = '500';
    this.$chartEl = $(document.createElement('div')).attr('id', 'grailChart');

    this._badgeStockNum = 0;
    this._normalStockNum = 0;
    this._charaIncome = 0;
    this._templeStockNum = 0;
    this._templeIncome = 0;

    this._charaInfo = null;
    this._templeInfo = null;
  }

  // 统计数据
  doStatistics() {
    this._prepare();
    Promise.all([this._charaFetch(), this._templeFetch()])
    .then(() => {
      this._calcRealIncome();
      this._totalStockNumEl.innerHTML = this._templeStockNum/2 + this._badgeStockNum + this._normalStockNum;
    })
    .then(() => {
      this._updateChart();
    });
  }

  _prepare() {
    $('#grail .chara_list .grail_list').remove();
    $(`#grail .temple_list .grail_list`).remove();
    $('#pager1').remove();
    $('#pager2').remove();
    $('#grail .chara_list .loading').show();
    $(`#grail .temple_list .loading`).show();

    $('#grail .grailInfoBox span>span').html('-'); //清除之前的数据
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
        this._calcStockIncome();
        this._renderBonusStock();
        // this._calcAvgHoldingCost();
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
        this._addTempleCover();
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
    $('#grail .temple_list .item .card').on('click', e => {
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

  //获取拍卖底价
  getTemplePrice() {
    getData('chara/user/assets/valhalla@tinygrail.com/true', d => {
      if (d.State !== 0) return;
      let templeId = Array.from(document.querySelectorAll('.temple_list .grail_list .item .card')).map(x => $(x).data('id'));
      let titleSpan = document.querySelectorAll('.temple_list .grail_list .item .title>span');
      let allTempleInfo = d.Value.Characters;
      titleSpan.forEach((title, i) => {
        let idx = allTempleInfo.findIndex(x => x.Id === templeId[i]);
        if(idx < 0) {
          $(title)
            .html('Sold out')
            .attr('title', '已售罄');
        } else {
          $(title).addClass('templePrice')
            .html(`${allTempleInfo[idx].State} / ₵${allTempleInfo[idx].Price.toFixed(2)}`)
            .attr('title', '可拍数量 / 拍卖底价')
            .on('click', function() {openAuctionDialog(allTempleInfo[idx])});
        }
      });
    })
  }

  // 绘图
  _updateChart() {
    this.$chartEl.empty();

    let labels, data, config;
    let chartType = 'doughnut';

    // find Nth largest, assume array is sorted (count duplicates)
    const findNthLargest = (array, n=10) => array[n <= array.length? n-1: array.length-1];
    // hide canvas without content
    const createChart = (canvasEl, config) => {
      if(config.data.datasets[0].data.length > 0) new ChartClass(canvasEl, config);
      else canvasEl.style.display = 'none';
    }

    let charaInfo = this._charaInfo.filter(x => x.State > 0); // 去掉只有圣殿股的角色

    // chara stock num chart
    let stockNumChartEl = this._canvasEl.cloneNode(true);
    this.$chartEl.append(stockNumChartEl);
    [labels, data] = this._arrangeChartData(charaInfo, x => x.Name, x => x.State)
    config = this._chartConfig(labels, data, chartType, '角色持股分布', '角色持股量', findNthLargest(data));
    createChart(stockNumChartEl, config);

    // chara income chart
    [labels, data] = this._arrangeChartData(charaInfo, x => x.Name, x => x.State*x.Rate)
    config = this._chartConfig(labels, data.map(Math.round), chartType, '角色股息分布', '角色股息', findNthLargest(data));
    let charaIncomeChartEl = this._canvasEl.cloneNode(true);
    this.$chartEl.append(charaIncomeChartEl);
    createChart(charaIncomeChartEl, config);

    // temple stock num chart
    [labels, data] = this._arrangeChartData(this._templeInfo, x => x.Name, x => x.Sacrifices/2)
    config = this._chartConfig(labels, data, chartType, '圣殿计息持股分布', '圣殿计息持股量', findNthLargest(data, 3));
    let templeStockNumChartEl = this._canvasEl.cloneNode(true);
    this.$chartEl.append(templeStockNumChartEl);
    createChart(templeStockNumChartEl, config);

    // temple income chart
    [labels, data] = this._arrangeChartData(this._templeInfo, x => x.Name, x => x.Rate*x.Sacrifices/2)
    config = this._chartConfig(labels, data.map(Math.round), chartType, '圣殿股息分布', '圣殿股息', findNthLargest(data));
    let templeIncomeChartEl = this._canvasEl.cloneNode(true);
    this.$chartEl.append(templeIncomeChartEl);
    createChart(templeIncomeChartEl, config);
  }

  _arrangeChartData(rawData, parseLabel, parseData) {
    // return sorted data
    let d = rawData.slice().sort((lft, ryt) => parseData(ryt) - parseData(lft));
    const maxLen = 10;
    return [d.map(parseLabel).map(x => x.length>maxLen? `${x.slice(0,maxLen-3)}...`: x), d.map(parseData)];
  }

  _chartConfig(labels, chartData, chartType, titleText, labelName, threshold) {
    const total = chartData.reduce((sum, x) => sum + x, 0);
    const offset = 0;
    // using currying to access the previous value, then calculate hue value (shift 180deg)
    const stepColor = (weights, s, l, a) => weights.map((sum => value => sum += value)(-weights[0])).map(x => `hsla(${parseInt((360/total*x+offset)%360)},${s},${l},${a})`);

    //chartData[i] >= threshold 时, 其 legend 才会在右侧显示出来.
    const legendFilterFunc = (legendItem, data) => data.datasets[0].data[legendItem.index] >= threshold;

    let options = {
      responsive: true,
      maintainAspectRatio: true,
      title: {
        display: true,
        fontSize: 25,
        fontColor: '#D8D8D8',
        fontFamily: 'SimHei',
        text: titleText
      },
      legend: {
        display: true,
        position: 'right',
        labels: {
          fontSize: 14,
          fontColor: '#D8D8D8',
          fontFamily: 'SimHei',
          filter: legendFilterFunc
        }
      }
    };
    let data = {
      labels: labels,
      datasets: [{
        label: labelName,
        data: chartData,
        backgroundColor: stepColor(chartData, '98.6%', '71%', '80%'),
        borderColor: stepColor(chartData,  '80%', '71%', '80%'),
        borderWidth: 1,
        hoverBackgroundColor: stepColor(chartData, '100%', '60%', '100%'),
        hoverBorderColor: stepColor(chartData,  '100%', '60%', '100%'),
        hoverBorderWidth: 1
      }]
    };
    let config = {
      type: chartType,
      data: data,
      options: options
    };
    return config;
  }

  _getLinearGradientCanvas(beginColor, endColor) {
    let canvas = document.createElement('canvas');
    canvas.width = '400'; canvas.height = '400';
    let ctx = canvas.getContext('2d');
    let gradient = ctx.createLinearGradient(20,0, 380,0);
    gradient.addColorStop(0.1, beginColor);
    gradient.addColorStop(0.9, endColor);
    return gradient;
  }
}

let observer = new MutationObserver(function() {
  let analyser = new IncomeAnalyser();
  let $grailOptions = $('#grail .horizontalOptions');
  if(!$grailOptions.length) return;
  observer.disconnect();

  // buttons
  let $btn = $(document.createElement('a')).attr('href', "javascript:void(0)").addClass("chiiBtn");
  let $countBtn = $btn.clone().html('更新数据').on('click', () => {analyser.doStatistics(); $ghostBtn.html('隐藏幽灵');});
  let $chartBtn = $btn.clone().html('显示图表').on('click', () => {$grailChartWrapper.show()});
  let $auctionBtn = $btn.clone().html('参与竞拍').on('click', () => {analyser.getTemplePrice()}).attr('title', '点击圣殿下方数字可直接参与股权拍卖');
  let $ghostBtn = $btn.clone().html('隐藏幽灵').on('click', () => {
    let $ghostChara = $(Array.from(document.querySelectorAll('#grail .chara_list .grail_list li'))
      .filter(x => x.querySelector('small.feed').innerText.startsWith('0 /')));
    if($ghostBtn.html() === '显示幽灵') {
      $ghostChara.show();
      $ghostBtn.html('隐藏幽灵');
    } else {
      $ghostChara.hide();
      $ghostBtn.html('显示幽灵');
    }
  }).attr('title', '幽灵指无持股但重组过的角色股');
  let $grailInfoBtns = $(document.createElement('div'))
    .addClass('grailInfoBox').append($countBtn, $chartBtn, $auctionBtn, $ghostBtn);

  // chart elements
  const closeChartFunc = e => {if(e.target === e.currentTarget) $grailChartWrapper.hide()};
  let $closeGrailChartBtn = $(document.createElement('div'))
    .attr('id', 'closeGrailChartBtn').on('click', closeChartFunc);
  let $grailChartWrapper = $(document.createElement('div'))
    .attr('id', 'grailChartWrapper').hide()
    .on('click', closeChartFunc)
    .append($closeGrailChartBtn, analyser.$chartEl);

  $grailOptions.append($grailInfoBtns, analyser.$stockEl);
  $(document.body).append($grailChartWrapper);
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

function resetTempleCover(temple, callback) {
  $('#TB_window .action').hide();
  $('#TB_window .loading').show();
  postData(`chara/temple/cover/reset/${temple.CharacterId}/${temple.UserId}`, null, (d) => {
    if (d.State == 0) {
      var cover = d.Value.Cover;
      var large = getLargeCover(cover);
      $(`.assets .card[data-id=${temple.UserId}]`).css('background-image', `url(${cover})`);
      $('#TB_window .card').css('background-image', `url(${large})`);
      $('#TB_window .action').show();
      $('#TB_window .loading').hide();
      alert('重置封面完成。');
    }
  });
}

function getUserAssets(callback) {
  getData('chara/user/assets', callback);
}

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
