// ==UserScript==
// @name         bangumi条目图表增强
// @namespace    https://github.com/bangumi/scripts/yonjar
// @require      http://echarts.baidu.com/dist/echarts.common.min.js
// @version      0.1.1
// @description  动画条目下的ep、vote、tags和观看情况数据的简单可视化
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/subject\/\d+(\?.*)?(#.*)?$/
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
        .yonjar_chartContainer{
            bottom: 0;
            left: 0;
            overflow: auto;
            position: fixed;
            right: 0;
            top: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 99;
        }
        .yonjar_chartContainer .main{
            margin: 20px auto;
            width: 1000px;
            background-color: white;
            overflow: auto;
            border-radius: 10px;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            z-index: 101;
        }

        .yonjar_chartContainer .header{
            border-bottom: #fdcccc 1px solid;
            height: 45px;
            width: 100%;
        }

        .yonjar_chartContainer .header h1{
            text-align: center;
            line-height: 45px;
        }

        .yonjar_chartContainer .chart{
            margin: 20px 10px;
            border: #fdcccc 1px solid;
            height: 400px;
        }
        
        .yonjar_chartContainer .mask{
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
        }
`);

class Util{
    static fetchHTMLString(url, fetchMethod = 'GET'){
        let fetchInit = {
            method: fetchMethod,
            cache: 'default',
            credentials: 'include',
        };

        let aRequest = new Request(url, fetchInit);

        return fetch(aRequest).then(resp => resp.text(), err => Promise.reject(err));
    }

    static extractHTMLData(HTMLString, matchRegExp){
        return HTMLString.match(matchRegExp);
    }

    static parseToDOM(str) {
        if (typeof str !== 'string') {
            return;
        }
        let div = document.createElement('div');
        div.innerHTML = str;
        return div.firstChild;
    }
}

class Subject{
    constructor(){
        this._epInfoData = {
            xAxis: [],
            data: []
        };
        this._votesInfoData = {
            xAxis: ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
            data: []
        };
        this._tagsInfoData = {
            data: []
        };
        this._watchInfoData = {
            data: []
        };
    }

    epInit(){
        return new Promise(resolve => {
            // ep init
            Util.fetchHTMLString(location.pathname + '/ep')
                .then(text => {
                    let domStr = Util.extractHTMLData(text, /<div class="line_detail">\s*(<ul class="line_list">[\S\s]*?<\/ul>)\s*<\/div>/)[1];
                    let eps = Util.parseToDOM(domStr);
                    for (let ep of eps.querySelectorAll('li')){
                        if (ep.querySelector('h6')){
                            this._epInfoData.xAxis.push(ep.querySelector('h6 a').textContent.split('.')[0]);
                            this._epInfoData.data.push(ep.querySelector('small:nth-child(5)').textContent.split('+')[1] - 0);
                        }
                    }
                    console.table(this.epInfoData);
                    resolve(this.epInfoData);
                });
        });
    }

    votesInit(){
        // votes init
        return new Promise(resolve => {
            let votesLi = document.querySelectorAll('.horizontalChart li');
            for (let vo of votesLi){
                // this._votesInfoData.xAxis.push(vo.querySelector('.label').textContent);
                this._votesInfoData.data.push(vo.querySelector('a').title.split('人评分')[0]);
            }
            console.table(this.votesInfoData);
            resolve(this.votesInfoData);
        });
    }

    tagsInit(){
        // tags init
        return new Promise(resolve => {
            let tags = document.querySelectorAll('.subject_tag_section .inner .l');
            for (let tag of tags){
                this._tagsInfoData.data.push({
                    name: tag.querySelector('span').textContent,
                    value: tag.querySelector('small').textContent - 0
                });
            }

            let removed = this._tagsInfoData.data.splice(9); // 合并tags
            if (removed.length > 1) {
                this._tagsInfoData.data.push(removed.reduce((prev, curr) => ({
                    name: '其他',
                    value: prev.value + curr.value
                })));
            }

            console.table(this.tagsInfoData);
            resolve(this.tagsInfoData);
        });
    }

    watchInit(){
        // watch init
        return new Promise(resolve => {
            let watchLi = document.querySelectorAll('#subjectPanelCollect span a');
            for (let li of watchLi){
                let item = li.textContent.split('人');
                this._watchInfoData.data.push({
                    name: item[1],
                    value: item[0] - 0
                });
            }
            console.table(this.watchInfoData);
            resolve(this.watchInfoData);
        });
    }

    get epInfoData() {
        return this._epInfoData;
    }

    set epInfoData(value) {
        this._epInfoData = value;
    }

    get votesInfoData() {
        return this._votesInfoData;
    }

    set votesInfoData(value) {
        this._votesInfoData = value;
    }

    get tagsInfoData() {
        return this._tagsInfoData;
    }

    set tagsInfoData(value) {
        this._tagsInfoData = value;
    }

    get watchInfoData() {
        return this._watchInfoData;
    }

    set watchInfoData(value) {
        this._watchInfoData = value;
    }
}

class Chart{
    constructor(){
        this.sub = new Subject();
        this.hasInit = false;
    }

    UI_init(){
        let navTabs = document.querySelector('#headerSubject > div > ul');
        let newLi = Util.parseToDOM('<li><a href="javascript:void(0)" onclick="">图表</a></li>');
        newLi.addEventListener('click', e => {
            document.querySelector('.yonjar_chartContainer').style.display = 'block';
            this.chart_init();
        }, false);
        navTabs.appendChild(newLi);

        let chartContainer = `<div class="yonjar_chartContainer" style="display: none;">
                <div class="mask"></div>
                <div class="main">
                    <div class="header">
                        <h1>Charts</h1>
                    </div>
                    <div class="body">
                        <div class="epInfo chart"></div>
                        <div class="votesInfo chart"></div>
                        <div class="tagsInfo chart"></div>
                        <div class="watchInfo chart"></div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(Util.parseToDOM(chartContainer));

        let mask =  document.querySelector('.yonjar_chartContainer .mask');
        mask.addEventListener('click', e => document.querySelector('.yonjar_chartContainer').style.display = 'none');
        mask.addEventListener('mousewheel', e => e.preventDefault());
    }

    epChartInit(){
        this.sub.epInit()
            .then(epData => {
                let epInfoChart = echarts.init(document.querySelector('.epInfo'));

                let option = {
                    title: {
                        text: '各集讨论情况'
                    },
                    tooltip: {},
                    legend: {
                        data:['讨论数']
                    },
                    xAxis: {
                        data: epData.xAxis
                    },
                    yAxis: {},
                    series: [{
                        name: '讨论数',
                        type: 'line',
                        data: epData.data
                    }]
                };

                epInfoChart.setOption(option);
            });
    }

    votesChartInit(){
        this.sub.votesInit()
            .then(votesData => {
                let votesInfoChart = echarts.init(document.querySelector('.votesInfo'));

                let option = {
                    title: {
                        text: '评分投票情况'
                    },
                    tooltip: {},
                    legend: {
                        data:['分级']
                    },
                    xAxis: {
                        data: votesData.xAxis
                    },
                    yAxis: {},
                    series: [{
                        name: '投票数',
                        type: 'bar',
                        data: votesData.data
                    }]
                };

                votesInfoChart.setOption(option);
            });
    }

    tagsChartInit(){
        this.sub.tagsInit()
            .then(tagsData => {
                let tagsInfoChart = echarts.init(document.querySelector('.tagsInfo'));

                let option = {
                    title: {
                        text: 'TAGs',
                        left: 'left'
                    },

                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },

                    visualMap: {
                        show: false,
                        min: 80,
                        max: 600,
                        inRange: {
                            colorLightness: [0, 1]
                        }
                    },

                    series: [
                        {
                            name:'tag',
                            type:'pie',
                            radius : '70%',
                            center: ['50%', '50%'],
                            roseType : 'area',
                            data: tagsData.data,
                            label: {
                                normal: {
                                    textStyle: {
                                        color: 'rgba(0, 0, 0, 0.8)'
                                    }
                                }
                            },
                            labelLine: {
                                normal: {
                                    lineStyle: {
                                        color: 'rgba(0, 0, 0, 0.8)'
                                    },
                                    smooth: 0.2,
                                    length: 10,
                                    length2: 20
                                }
                            },

                            animationType: 'scale',
                            animationEasing: 'elasticOut',
                            animationDelay: function (idx) {
                                return Math.random() * 200;
                            }
                        }
                    ]
                };

                tagsInfoChart.setOption(option);
            });
    }

    watchChartInit(){
        this.sub.watchInit()
            .then(watchData => {
                let watchInfoChart = echarts.init(document.querySelector('.watchInfo'));

                let option = {
                    title: {
                        text: '观看情况',
                        left: 'left'
                    },

                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },

                    visualMap: {
                        show: false,
                        min: 80,
                        max: 600,
                        inRange: {
                            colorLightness: [0, 1]
                        }
                    },

                    series: [
                        {
                            name:'观看情况',
                            type:'pie',
                            radius : '70%',
                            center: ['50%', '50%'],
                            data: watchData.data,
                            label: {
                                normal: {
                                    textStyle: {
                                        color: 'rgba(0, 0, 0, 0.8)'
                                    }
                                }
                            },
                            labelLine: {
                                normal: {
                                    lineStyle: {
                                        color: 'rgba(0, 0, 0, 0.8)'
                                    },
                                    smooth: 0.2,
                                    length: 10,
                                    length2: 20
                                }
                            },

                            animationType: 'scale',
                            animationEasing: 'elasticOut',
                            animationDelay: function (idx) {
                                return Math.random() * 200;
                            }
                        }
                    ]
                };

                watchInfoChart.setOption(option);
            });
    }

    chart_init(){
        if (this.hasInit) {
            return;
        }
        // epInfo chart
        this.epChartInit();

        // votesInfo chart
        this.votesChartInit();

        // tagsInfo chart
        this.tagsChartInit();

        // watchInfo chart
        this.watchChartInit();

        this.hasInit = true;
    }
}

// 判断是否为动画条目
if (document.querySelector('#headerSubject > div > ul > li:nth-child(2) > a').textContent === '章节') {
    let chart = new Chart();
    chart.UI_init();
}