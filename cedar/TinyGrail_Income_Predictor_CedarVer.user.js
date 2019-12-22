// ==UserScript==
// @name         TinyGrail Income Predictor CedarVer
// @namespace    Cedar.chitanda.TinyGrailIncomePredictor
// @version      1.6.5
// @description  Calculate income for tiny Grail, add more information
// @author       Cedar, chitanda, mucc
// @include      /^https?://(bgm\.tv|bangumi\.tv)/user/.+$/
// @grant        GM_addStyle
// ==/UserScript==

'use strict';


GM_addStyle(`
/* 角色等级相关: 左上角圆圈 名字颜色 删除线 半透明 圣殿角标 */
/* default */
#grail .chara_list .grail_list li {
  position:relative;
}
#grail .chara_list .grail_list span.charaLevelBox {
  width: 20px;
  height: 20px;
  position: absolute;
  top: -10px;
  left: -10px;
  border-radius: 50%;
  background-color: rgba(255, 115, 115, 0.7);
  text-align: center;
  line-height: 20px;
  padding: 2px;
  color: white;
  font-weight:bold;
}
.chara_list .grail_list .feed>span {
  margin-left: 3px;
}
/* no-level character */
#grail .chara_list li.noLevelChara img {
  filter: opacity(0.5);
}
#grail .chara_list li.noLevelChara span.charaLevelBox {
  visibility: hidden;
}
.chara_list li.noLevelChara .feed>span {
  text-decoration: line-through;
}
/* high-level character */
#grail .chara_list .grail_list li.highLevelChara span.charaLevelBox {
  background-color: rgba(255, 0, 0, 0.7);
}
#grail .chara_list li.highLevelChara a.avatar.name {
  font-weight: bold;
  color: dodgerblue;
}
#grail .chara_list li.highLevelChara a.avatar.name:hover {
  color: blueviolet;
}
html[data-theme='dark'] #grail .chara_list li.highLevelChara a.avatar.name {
  font-weight:bold;
  color: lightblue;
}
html[data-theme='dark'] #grail .chara_list li.highLevelChara a.avatar.name:hover {
  color: lightgreen;
}
/* no-level temple */
.temple_list div.noLevelTemple .tag {
  filter: grayscale(1);
}
.temple_list div.noLevelTemple .buff {
  text-decoration: line-through;
}

/*相关按钮与数据显示*/
#grail .horizontalOptions ul li, #grail .item .templePrice {
  cursor: pointer;
}
#grail .grailInfoBox .chiiBtn {
  margin: 2px;
}
#grail .grailInfoBox {
  padding: 10px 0;
  border-top: 1px solid #CCC;
  display: flex;
  justify-content: left;
  flex-wrap: wrap;
}
#grail .grailInfoBox>span {
  font-weight: bold;
  font-size: 14px;
  flex-basis: 25%;
  min-width: 160px;
}
#grail .grailInfoBox>.levelCounter {
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
}
#grail .grailInfoBox>.levelCounter>span {
  flex: 1;
  margin-right: 5px;
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
  background-color: rgba(0,0,0,0.5);
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
    this._mybgmId = document.getElementById('dock').querySelector('li.first>a').href.split('user/')[1];

    let numEl = document.createElement('span'); numEl.innerHTML = '-';
    this._totalCharaStockNumEl = numEl.cloneNode(true);
    this._totalCharaIncomeEl = numEl.cloneNode(true);
    this._totalTempleStockNumEl = numEl.cloneNode(true);
    this._totalTempleIncomeNumEl = numEl.cloneNode(true);
    this._totalIncomeEl = numEl.cloneNode(true);
    this._totalTaxEl = numEl.cloneNode(true);
    this._afterTaxIncomeEl = numEl.cloneNode(true);

    let $levelCounterEl = $(document.createElement('span')).addClass('levelCounter');
    this._$charaLevelEl = $levelCounterEl.clone().html("各级角色数：").append(numEl.cloneNode(true)).attr('title', '角色等级=下取整(流通股数量/7500). 仅统计有塔的角色.');
    this._$templeLevelStockEl = $levelCounterEl.clone().html("各级献祭量：").append(numEl.cloneNode(true)).attr('title', '各等级角色的塔内持股量');

    let elWrapper = $(document.createElement('span'));
    this.$stockEl = $(document.createElement('div'))
      .addClass('grailInfoBox')
      .append(
          elWrapper.clone().html("角色持股：").append(this._totalCharaStockNumEl).attr('title', '流通股总量'),
          elWrapper.clone().html("角色股息：").append(this._totalCharaIncomeEl),
          elWrapper.clone().html("圣殿持股：").append(this._totalTempleStockNumEl).attr('title', '塔内持股总量'),
          elWrapper.clone().html("圣殿股息：").append(this._totalTempleIncomeNumEl).attr('title', '圣殿股产生的总股息. 各圣殿股息=圣殿股数×股息加成×角色等级/2'),
          elWrapper.clone().html("税前股息：").append(this._totalIncomeEl),
          elWrapper.clone().html("应缴税额：").append(this._totalTaxEl),
          elWrapper.clone().html("税后股息：").append(this._afterTaxIncomeEl),
          this._$charaLevelEl, this._$templeLevelStockEl,
      );

    this._canvasEl = document.createElement('canvas'); this._canvasEl.width = this._canvasEl.height = 500;
    this.$chartEl = $(document.createElement('div')).attr('id', 'grailChart');

    this._charaIncome = 0;
    this._templeIncome = 0;

    this._charaInfo = null;
    this._templeInfo = null;
    this._mycharaInfo = null;

    this._charaListEl = null;
    this._templeListEl = null;
  }

  // ===== 统计数据 ===== //
  doStatistics(callback) {
    this._prepare();
    Promise.all([
      this._charaFetch()
      .then(() => {
        this._calcCharaInfo();
      })
      .then(() => {
        this._renderCharaPage();
      }),

      this._templeFetch()
      .then(() => {
        this._countTempleLevel();
        this._calcTempleInfo();
      })
      .then(() => {
        this._renderTemplePage();
      })
    ])
    .then(() => {
      this._calcRealIncome();
    })
    .then(() => {
      this._updateChart();
    })
    .then(() => {
      if(callback) callback();
    });
  }

  _prepare() {
    $('#grail .chara_list .grail_list').remove();
    $(`#grail .temple_list .grail_list`).remove();
    $('#pager1').remove();
    $('#pager2').remove();
    $('#grail .chara_list .loading').show();
    $(`#grail .temple_list .loading`).show();

    //清除之前的数据
    this._$charaLevelEl.children('span:not(:first)').remove();
    this._$templeLevelStockEl.children('span:not(:first)').remove();
    $('#grail .grailInfoBox span>span').html('-');
  }

  _charaFetch() {
    return new Promise(resolve =>
      getData(`chara/user/chara/${this._bgmId}/1/2000`, d => {
        console.log('got charaInfo');
        if (d.State !== 0) return;
        this._charaInfo = d.Value.Items;
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
        resolve();
      })
    );
  }

  // 计算的是圣殿对应的角色等级
  _countTempleLevel() {
    let levelCounter = Array(20).fill(0);
    this._templeInfo.forEach(temple => {levelCounter[temple.CharacterLevel]++});
    this._$charaLevelEl.children('span').remove();
    this._$charaLevelEl.append(levelCounter.map((x, i) => x? $(document.createElement('span')).html(`LV${i}:${x}`): null).filter(x => x));

    let templeStockCounter = Array(20).fill(0);
    this._templeInfo.forEach(temple => {templeStockCounter[temple.CharacterLevel] += temple.Assets});
    this._$templeLevelStockEl.children('span').remove();
    this._$templeLevelStockEl.append(templeStockCounter.map((x, i) => x? $(document.createElement('span')).html(`LV${i}:${x}`): null).filter(x => x));
    this._totalTempleStockNumEl.innerHTML = templeStockCounter.reduce((sum, x) => sum + x, 0);
  }

  _calcCharaInfo() {
    this._totalCharaStockNumEl.innerHTML = this._charaInfo.reduce((sum, chara) => sum + chara.State, 0);
    this._charaIncome = this._charaInfo.reduce((sum, chara) => sum + chara.State*chara.Rate, 0);
    this._totalCharaIncomeEl.innerHTML = this._charaIncome.toFixed(2);
  }

  _calcTempleInfo() {
    this._templeIncome = this._templeInfo.reduce((sum, chara) => sum + chara.CharacterLevel*chara.Rate*chara.Assets/2, 0);
    this._totalTempleIncomeNumEl.innerHTML = this._templeIncome.toFixed(2);
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

  _renderCharaPage() {
    let $page = $(document.createElement('ul')).addClass('grail_list page1')
      .append(this._charaInfo.map(renderUserCharacter));
    this._charaListEl = $page[0];
    $('#grail .chara_list').append($page);
    $('#grail .chara_list .loading').hide();
    $(document.createElement('span')).addClass('charaLevelBox').prependTo($page.find('li'));
    this._renderCharaLevelStock();
  }

  _renderTemplePage() {
    let $page = $(document.createElement('ul')).addClass('grail_list page1')
      .append(this._templeInfo.map(renderTemple));
    this._templeListEl = $page[0];
    $('#grail .temple_list').append($page);
    $('#grail .temple_list .loading').hide();
    this._addTempleCover();
    this._renderCharaLevelTemple();
  }

  _addTempleCover() {
    $('#grail .temple_list .item .card').on('click', e => {
      let cid = $(e.srcElement).data('id');
      let temple = this._templeInfo.find(t => t.CharacterId == cid);
      showTemple(temple, null);
    });
  }

  _renderCharaLevelStock() {
    let charaRateBox = this._charaListEl.querySelectorAll('.feed');
    let charaLevelBox = this._charaListEl.getElementsByClassName('charaLevelBox');
    this._charaInfo.forEach((chara, i) => {
      let charaRate = document.createElement('span');
      charaRate.innerHTML = `×${chara.Rate.toFixed(2)}`;
      charaRateBox[i].appendChild(charaRate);
      charaLevelBox[i].innerHTML = chara.Level;
      if(chara.Level == 1) return;
      this._charaListEl.children[i].classList.add(chara.Level? 'highLevelChara': 'noLevelChara');
    });
  }

  _renderCharaLevelTemple() {
    this._templeInfo.forEach((temple, i) => {
      if(!temple.CharacterLevel)
        this._templeListEl.children[i].classList.add('noLevelTemple');
    });
  }

  // ===== 获取拍卖底价 ===== //
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

  // ===== 绘图 ===== //
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
    [labels, data] = this._arrangeChartData(this._templeInfo, x => x.Name, x => x.Assets)
    config = this._chartConfig(labels, data, chartType, '圣殿持股分布', '圣殿持股量', findNthLargest(data, 3));
    let templeStockNumChartEl = this._canvasEl.cloneNode(true);
    this.$chartEl.append(templeStockNumChartEl);
    createChart(templeStockNumChartEl, config);

    // temple income chart
    [labels, data] = this._arrangeChartData(this._templeInfo, x => x.Name, x => x.CharacterLevel*x.Rate*x.Assets/2)
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
    const offset = 0; // shift 0deg
    // using currying to access the previous value, then calculate hue value
    const stepColor = (weights, s, l, a) => weights.map((sum => value => sum += value)(-weights[0])).map(x => `hsla(${parseInt((360/total*x+offset)%360)},${s},${l},${a})`);

    //chartData[i] >= threshold 时, 其 legend 才会在右侧显示出来. 最多显示10项.
    const legendFilterFunc = (legendItem, data) => data.datasets[0].data[legendItem.index] >= threshold && legendItem.index < 10;

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

  // ===== 显示共有角色 ===== //
  compareChara(hide, successCallback, rejectCallback) {
    if(!this._charaInfo) {
      alert('请先获取数据');
      if(rejectCallback) rejectCallback();
      return;
    }
    if(hide) {
      new Promise(resolve => {
        if(this._mycharaInfo) {
          resolve();
        } else if(this._bgmId == this._mybgmId) {
          this._mycharaInfo = this._charaInfo;
          resolve();
        } else {
          getData(`chara/user/chara/${this._mybgmId}/1/2000`, d => {
            console.log('got my charaInfo');
            if (d.State !== 0) return;
            this._mycharaInfo = d.Value.Items;
            resolve();
          })
        }
      }).then(() => {
        let mycharaInfo = this._mycharaInfo.reduce((m, x) => Object.assign(m, {[x.Id]: x}), {});
        this._charaInfo.forEach((x, i) => {
          if(!mycharaInfo[x.Id]) this._charaListEl.children[i].style.visibility = 'hidden';
        });
      }).then(() => {if(successCallback) successCallback()});
    } else {
      Array.from(this._charaListEl.children).forEach(x => x.style.visibility = null);
      if(successCallback) successCallback();
    }
  }
}

let observer = new MutationObserver(function() {
  let $grailOptions = $('#grail .horizontalOptions');
  if(!$grailOptions.length) return;
  observer.disconnect();

  let analyser = new IncomeAnalyser();

  // buttons
  let $btn = $(document.createElement('a')).attr('href', "javascript:void(0)").addClass("chiiBtn");
  let $countBtn = $btn.clone().html('获取数据').on('click', () => {analyser.doStatistics(() => {$hideTagBtn.html('显示角标').trigger('click')})});
  let $chartBtn = $btn.clone().html('显示图表').on('click', () => {$grailChartWrapper.show()});
  let $auctionBtn = $btn.clone().html('参与竞拍').on('click', () => {analyser.getTemplePrice()}).attr('title', '点击圣殿下方数字可直接参与股权拍卖');
  let $ghostBtn = $btn.clone().html('隐藏幽灵').on('click', () => {
    let $ghostChara = $(Array.from(document.querySelectorAll('#grail .chara_list .grail_list li'))
      .filter(x => x.querySelector('small.feed').innerText.startsWith('-- /')));
    if($ghostBtn.html() === '显示幽灵') {
      $ghostChara.show();
      $ghostBtn.html('隐藏幽灵');
    } else {
      $ghostChara.hide();
      $ghostBtn.html('显示幽灵');
    }
  }).attr('title', '幽灵指无持股但重组过的角色股');
  let $compareBtn = $btn.clone().html('共有角色').on('click', () => {
    if($compareBtn.html() == '共有角色') {
      $compareBtn.html('统计中…');
      analyser.compareChara(true, () => {$compareBtn.html('显示全部')}, () => {$compareBtn.html('共有角色')});
    } else {
      $compareBtn.html('共有角色');
      analyser.compareChara(false);
    }
  }).attr('title', '查看你与该玩家共同持有的角色');
  let $hideTagBtn = $btn.clone().html('隐藏角标').on('click', () => {
    if($hideTagBtn.html() === '隐藏角标') {
      $('.temple_list .grail_list .tag, .temple_list .grail_list .buff').hide();
      $('.temple_list')
        .on('mouseenter touchstart', '.grail_list .item .card', function() {$(this).find('.tag, .buff').show()})
        .on('mouseleave touchend', '.grail_list .item .card', function() {$(this).find('.tag, .buff').hide()});
      $hideTagBtn.html('显示角标');
    } else {
      $('.temple_list').off('mouseenter touchstart mouseleave touchend', '.grail_list .item .card');
      $('.temple_list .grail_list .tag, .temple_list .grail_list .buff').show();
      $hideTagBtn.html('隐藏角标');
    }
  }).attr('title', '显示或隐藏圣殿的角标');
  let $grailInfoBtns = $(document.createElement('div'))
    .addClass('grailInfoBox').append($countBtn, $chartBtn, $auctionBtn, $ghostBtn, $compareBtn, $hideTagBtn);

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

  var amount = formatNumber(chara.State, 0);
  if (chara.State == 0)
    amount = "--";

  var item = `<li title="${title}"><a href="/character/${chara.Id}" target="_blank" class="avatar"><span class="groupImage"><img src="${normalizeAvatar(chara.Icon)}"></span></a>
      <div class="inner"><a href="/character/${chara.Id}" target="_blank" class="avatar name">${chara.Name}</a><br>
        <small class="feed" title="持股数量 / 固定资产">${amount} / ${formatNumber(chara.Sacrifices, 0)}</small></div></li>`;
  return item;
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
                <div class="label"><span class="input">价格</span><span class="input">数量</span><span class="total">合计 -₵${total}</span></div>
                <div class="trade auction">
                  <input class="price" type="number" min="${price}" value="${price}">
                    <input class="amount" type="number" min="1" max="${chara.State}" value="${chara.State}">
                      <button id="bidAuctionButton" class="active">确定</button><button id="cancelDialogButton">取消</button></div>
                    <div class="loading" style="display:none"></div>
                    <a id="TB_closeWindowButton" title="Close">X关闭</a>
  </div>`;
  $('body').append(dialog);
  var ids = [chara.Id];
  loadUserAuctions(ids);
  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
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
      if (d.Value.Type >= 999 || d.Value.Id == 702) {
        $('#resetCoverButton').show();
      }
    }
  });

  var position = '';
  if (cover.indexOf('//lain.') >= 0)
    position = 'background-position:top;';

  //var image=`<div class="card" style="background-image:url(${cover});${position}">`;
  var image = `<img class="cover" src='${cover}' />`;

  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog temple" style="display:block;">
      ${image}
      ${action}
      <div class="loading" style="display:none;"></div>
      <a id="TB_closeWindowButton" title="Close">X关闭</a>
    </div>
  </div>`;
  $('body').append(dialog);

  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#TB_window.temple img.cover').on('click', closeDialog);
  $('#TB_window.temple').on('click', '.card', closeDialog);

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

      var newImage = `<div class="card" style="background-image:url(${data})">`;
      $('#TB_window img.cover').hide();
      $('#TB_window').prepend(newImage);
      $('#TB_window .action').hide();
      $('#TB_window .loading').show();

      if (!/image+/.test(file.type)) {
        alert("请选择图片文件。");
        return;
      }

      var reader = new FileReader();
      reader.onload = ev => {
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
