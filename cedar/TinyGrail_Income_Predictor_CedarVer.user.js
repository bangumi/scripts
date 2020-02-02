// ==UserScript==
// @name         TinyGrail Income Predictor CedarVer
// @namespace    Cedar.chitanda.TinyGrailIncomePredictor
// @version      1.6.11
// @description  Calculate income for tiny Grail, add more information
// @author       Cedar, chitanda, mucc
// @include      /^https?://(bgm\.tv|bangumi\.tv)/user/.+$/
// @grant        GM_addStyle
// ==/UserScript==

'use strict';


GM_addStyle(`
/* 角色等级相关: 左上角圆圈 名字颜色 删除线 半透明 */
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

/* 用于隐藏角标 */
.shouldHide {
  transition: opacity 1s;
  opacity: 0;
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
          elWrapper.clone().html("圣殿持股：").append(this._totalTempleStockNumEl).attr('title', '圣殿股总量'),
          elWrapper.clone().html("圣殿股息：").append(this._totalTempleIncomeNumEl).attr('title', '圣殿股产生的总股息'),
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

    // this._charaListEl = null; // 暂时没用到
    // this._templeListEl = null;
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
    this.$stockEl.find('span>span').html('-');
  }

  _charaFetch() {
    return new Promise(resolve =>
      getData(`chara/user/chara/${this._bgmId}/1/20000`, d => {
        console.log('got charaInfo');
        if (d.State !== 0) return;
        this._charaInfo = d.Value.Items;
        resolve();
      })
    );
  }

  _templeFetch() {
    return new Promise(resolve =>
      getData(`chara/user/temple/${this._bgmId}/1/20000`, d => {
        console.log('got templeInfo');
        if (d.State !== 0) return;
        this._templeInfo = d.Value.Items;
        resolve();
      })
    );
  }

  _countTempleLevel() {
    // 计算各角色等级的角色数 (只统计有圣殿的角色)
    let levelCounter = Array(20).fill(0);
    this._templeInfo.forEach(temple => {levelCounter[temple.CharacterLevel]++});
    this._$charaLevelEl.children('span').remove();
    this._$charaLevelEl.append(levelCounter.map((x, i) => x? $(document.createElement('span')).html(`LV${i}:${x}`): null).filter(x => x));

    // 计算各角色等级的圣殿持股数
    let templeStockCounter = Array(20).fill(0);
    this._templeInfo.forEach(temple => {templeStockCounter[temple.CharacterLevel] += temple.Assets});
    this._$templeLevelStockEl.children('span').remove();
    this._$templeLevelStockEl.append(templeStockCounter.map((x, i) => x? $(document.createElement('span')).html(`LV${i}:${x}`): null).filter(x => x));
    this._totalTempleStockNumEl.innerHTML = templeStockCounter.reduce((sum, x) => sum + x, 0);
  }

  _calcThisCharaIncome(chara) {
    return chara.State*chara.Rate;
  }

  _calcThisTempleIncome(temple) {
    // return temple.CharacterLevel*temple.Rate*temple.Assets/2;
    return temple.Assets*temple.Rate*(temple.CharacterLevel+1)*0.3;
  }

  _calcCharaInfo() {
    this._totalCharaStockNumEl.innerHTML = this._charaInfo.reduce((sum, chara) => sum + chara.State, 0);
    this._charaIncome = this._charaInfo.reduce((sum, chara) => sum + this._calcThisCharaIncome(chara), 0);
    this._totalCharaIncomeEl.innerHTML = this._charaIncome.toFixed(2);
  }

  _calcTempleInfo() {
    this._templeIncome = this._templeInfo.reduce((sum, temple) => sum + this._calcThisTempleIncome(temple), 0);
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
    return Math.max(0, (income - Math.log10(x+10000)*75000)) * 0.9;
/*
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
*/
  }

  _renderCharaPage() {
    // create elements
    let template = document.createElement('template');
    this._charaInfo.forEach(x => {
      template.innerHTML = renderUserCharacter(x).trim();
      x.Element = template.content.firstChild;
    });
    let $page = $(document.createElement('ul')).addClass('grail_list page1')
      .append(this._charaInfo.map(x => x.Element));
    // this._charaListEl = $page[0];
    $(document.createElement('span')).addClass('charaLevelBox').prependTo($page.find('li'));
    this._renderCharaLevelStock();
    $('#grail .chara_list').append($page);
    $('#grail .chara_list .loading').hide();
  }

  _renderTemplePage() {
    // create elements
    let template = document.createElement('template');
    this._templeInfo.forEach(x => {
      template.innerHTML = renderTemple(x, 'mine');
      // $(x.Element).find('.card').data('temple', x); // 源代码更新后选择用 $.data 记录 temple 的信息. 未采用. 仍是尝试获取charaterId. 见下方 _addTempleCover 函数
      x.Element = template.content.firstChild;
    });
    let $page = $(document.createElement('ul')).addClass('grail_list page1')
      .append(this._templeInfo.map(x => x.Element));
    // this._templeListEl = $page[0];
    $('#grail .temple_list').append($page);
    $('#grail .temple_list .loading').hide();
    this._addTempleCover();
  }

  _addTempleCover() {
    $('#grail .temple_list .item .card').on('click', e => {
      let cid = parseInt($(e.currentTarget).data('id').split('#')[1]);
      let temple = this._templeInfo.find(t => t.CharacterId == cid);
      showTemple(temple, null);
    });
  }

  _renderCharaLevelStock() {
    for(let chara of this._charaInfo) {
      let charaRate = document.createElement('span');
      charaRate.innerHTML = `×${chara.Rate.toFixed(2)}`;
      let charaRateBox = chara.Element.querySelector('.feed');
      charaRateBox.appendChild(charaRate);

      let charaLevelBox = chara.Element.querySelector('.charaLevelBox');
      charaLevelBox.innerHTML = chara.Level;

      if(chara.Level == 1) continue;
      chara.Element.classList.add(chara.Level? 'highLevelChara': 'noLevelChara');
    };
  }

  // ===== 获取拍卖底价 ===== //
  getTemplePrice() {
    getData('chara/user/assets/tinygrail/true', d => {
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
    [labels, data] = this._arrangeChartData(charaInfo, x => x.Name, x => this._calcThisCharaIncome(x))
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
    [labels, data] = this._arrangeChartData(this._templeInfo, x => x.Name, x => this._calcThisTempleIncome(x))
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
          font
