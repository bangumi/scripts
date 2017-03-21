// ==UserScript==
// @name         friendsPowerUp
// @namespace    fifth26.com
// @version      1.2.0
// @description  好友头像信息增强，了解你的TA
// @author       fifth
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/
// @grant        GM_addStyle
// @encoding     utf-8
// ==/UserScript==

const CURRENT_VERSION = '1.2.0';

const LOADING_IMG_URL = 'http://bgm.tv/img/loadingAnimation.gif';

const MAX_SUBJECTS_ON_ONE_PAGE = 24;

const SUBJECT_TYPE = ['anime', 'book', 'music', 'game', 'real'];

const ACTIONS = ['wish', 'collect', 'do', 'on_hold', 'dropped'];

const ACTION_ORDER = {
    do: 0,
    collect: 1,
    wish: 2,
    on_hold: 3,
    dropped: 4
};

const LANG = [
    '当你窥视深渊的时候，深渊也在窥视着你...',
    '警察叔叔，就是这个人！',
    '道歉的时候，要露出胸部才是常识',
    '无路赛！无路赛！无路赛！',
    'RUA!!!',
    '年轻人好好撸管，不要做白日梦了',
    '我能怎么办，我也很绝望啊',
    '真好啊...真好啊...',
    '这种事根本就不会存在',
    '<img src="http://bgm.tv/img/smiles/tv/15.gif">',
    '不被发现就不算犯罪哦~',
    '我好兴奋啊！！！',
    '这么可爱一定是男孩子',
    '今天的风儿好喧嚣啊',
    '男人变态有什么错！',
    '在虚构的故事当中寻求真实感的人脑袋一定有问题',
    'そのあと滅茶苦茶セックスした',
    '異議あり！',
    '连我爸爸都没有打过我！',
    '这个时候只要<span style="background-color: black">微笑</span>bgm38就好了',
    '德意志科学技术世界第一！',
    '没有人能在我的BGM里面打败我',
    '你真是怠惰呢~',
    '教练，我想打篮球',
    '小学生真是太棒了！',
    '和我签订契约，成为魔法少女吧！',
    '人被杀，就会死',
    'おとといは兎を見たの。昨日は鹿、今日は…あなた',
    'niconiconi',
    '禁則事項です。',
    '我已经看到结局了',
    '你为什么这么熟练啊！',
    '敌羞，吾去脱她衣！',
    '前方高能反应',
    '我已经看到结局了',
    '等战争结束，我就要回老家结婚了',
    '贫乳是稀有价值',
    '少女祈祷中...',
    '今夜は月が綺麗ですね',
    '呀啦那一卡？',
    '少女的裙底有什么？',
    '真実はいつも一つ！'
];

const LOCAL_STORAGE_KEYS = {
    me: 'fifth_bgm_user_userjs_me',
    scores: 'fifth_bgm_user_userjs_scores',
    settings: 'fifth_bgm_user_userjs_settings',
    version: 'fifth_bgm_user_userjs_version'
};

const DEFAULT_SETTINGS = {
    noTL: false,
    noSync: false,
    noScores: false,
    includeDropped: false,
    calculateSD: false,
    noTsukkomi: false
};

let starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let me;
let body;
if (location.pathname !== '/rakuen') {
    me = $('div.idBadgerNeue a.avatar');
    if (me.length > 0) {
        me = me.attr('href').match(/\w+$/)[0];
        localStorage.setItem(LOCAL_STORAGE_KEYS.me, me);
    }
    else {
        me = localStorage.getItem(LOCAL_STORAGE_KEYS.me);
    }
    body = $('body');
}
else {
    me = localStorage.getItem(LOCAL_STORAGE_KEYS.me);
    body = $(document.getElementById('right').contentDocument.getElementsByTagName('body'));
}

let missions = {};
let currentMission = '';
let cache = {};

let element_mainBox;
let element_settings;
let element_tsukkomi;
let element_name;
let element_tl;
let element_animeCount;
let element_sync;
let element_seeMore;
let element_scores;
let element_chart;
let element_loading;

function createInfoBox() {
    body.append(`
        <div id="fifth_bgm_userjs_friendsPowerUp">
            <div id="fifth_bgm_settings"></div>
            <div id="fifth_bgm_tsukkomi"></div>
            <div id="fifth_bgm_name"></div>
            <div id="fifth_bgm_tl"></div>
            <div id="fifth_bgm_animeCount"></div>
            <div id="fifth_bgm_sync"></div>
            <div id="fifth_bgm_seeMore"></div>
            <div id="fifth_bgm_scores"></div>
            <div id="fifth_bgm_chart"></div>
            <div id="fifth_bgm_loading"></div>
        </div>
    `);

    element_mainBox = $('div#fifth_bgm_userjs_friendsPowerUp');
    element_settings = $('div#fifth_bgm_settings');
    element_tsukkomi = $('div#fifth_bgm_tsukkomi');
    element_name = $('div#fifth_bgm_name');
    element_tl = $('div#fifth_bgm_tl');
    element_animeCount = $('div#fifth_bgm_animeCount');
    element_sync = $('div#fifth_bgm_sync');
    element_seeMore = $('div#fifth_bgm_seeMore');
    element_scores = $('div#fifth_bgm_scores');
    element_chart = $('div#fifth_bgm_chart');
    element_loading = $('div#fifth_bgm_loading');

    element_settings.html(`
        <div>不看时间线<input id="setting_noTL" type="checkbox"/></div>
        <div>不看同步率<input id="setting_noSync" type="checkbox"/></div>
        <div>不看平均分<input id="setting_noScores" type="checkbox"/></div>
        <div>评分含抛弃<input id="setting_includeDropped" type="checkbox"/></div>
        <div>计算标准差<input id="setting_calculateSD" type="checkbox"/></div>
        <div>不显示吐槽<input id="setting_noTsukkomi" type="checkbox"/></div>
    `);
    // <div>自定义吐槽<input id="setting_customTsukkomi" type="text"/></div>

    element_seeMore.html('--- 查看更多 ---');

    GM_addStyle(`
        #fifth_bgm_userjs_friendsPowerUp {
            position: absolute;
            padding: 5px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0px 0px 20px #ccc;
        }
        #fifth_bgm_settings {
            display: none;
            position: absolute;
            border-radius: 5px;
            box-shadow: 0px 0px 20px #ccc;
            left: 0;
            top: 0;
            padding: 5px;
            background-color: #fff;
        }
        #fifth_bgm_settings>div {
            width: 80px;
        }
        #fifth_bgm_settings input {
            margin-left: 5px;
            top: 2px;
            position: relative;
        }
        #fifth_bgm_tsukkomi {
            display: none;
            text-align: center;
            font-style: oblique;
            margin-bottom: 5px;
        }
        #fifth_bgm_animeCount>span {
            color: #0084B4;
            float: right;
            cursor: pointer;
            margin-left: 20px;
        }
        #fifth_bgm_seeMore {
            display: none;
            cursor: pointer;
            text-align: center;
            margin-top: 5px;
        }
        #fifth_bgm_seeMore:hover {
            background-color: #eee;
        }
        #fifth_bgm_scores {
            margin-top: 5px;
        }
        #fifth_bgm_prograss {
            height: 10px;
            width: 1%;
            background-color: #F09199;
            border-radius: 5px;
        }
        #fifth_bgm_chart {
            display: none;
            height: 120px;
            margin: 0px;
            border-radius: 5px;
            border-width: 2px;
            border-style: solid;
            border-color: #eee;
        }
        #fifth_bgm_chart .chart-bar {
            height: 100px;
            position: absolute;
            margin-top: 5px;
        }
        #fifth_bgm_chart .back {
            background-color: #F09199;
            border-radius: 3px;
        }
        #fifth_bgm_chart .back:hover {
            background-color: #f7bbc0;
        }
        #fifth_bgm_chart .idx {
            height: 10px;
            text-align: center;
        }
        #fifth_bgm_loading {
            display: none;
            width: 210px;
            height: 15px;
            background-image: url(${LOADING_IMG_URL});
            background-repeat: no-repeat;
        }
    `);

    element_seeMore.click(function () {
        let uid = element_name.find('a');
        if (uid.length > 0) {
            uid = uid.attr('href').split('/')[2];
        }
        else {
            uid = localStorage.getItem(LOCAL_STORAGE_KEYS.me);
        }

        element_scores.html(`<div id="fifth_bgm_prograss"></div>`);
        showDOM([
            element_scores
        ]);
        hideDOM([
            element_seeMore
        ]);

        let cachedScores = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.scores)) || {};
        let total = cache[uid].animeCount[ACTION_ORDER.collect] + cache[uid].animeCount[ACTION_ORDER.dropped];
        if (!!cachedScores[uid]) {
            let currentUserData = cachedScores[uid];
            if (currentUserData && currentUserData.collectCount + currentUserData.droppedCount == total) {
                element_scores.find('#fifth_bgm_prograss').animate({
                    width: '100%'
                });
                updateUserData(uid);
                return;
            }
        }
        starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        let allPage = Math.ceil(cache[uid].animeCount[ACTION_ORDER.collect] / MAX_SUBJECTS_ON_ONE_PAGE) + Math.ceil(cache[uid].animeCount[ACTION_ORDER.dropped] / MAX_SUBJECTS_ON_ONE_PAGE);
        fetchData(uid, 'anime', 'collect', 1, 1, allPage);
    });

    applySettings();
}

function hideDOM(params, useFade = false) {
    for (let elem of params) {
        if (useFade) {
            elem.fadeOut();
        }
        else {
            elem.hide();
        }
    }
}

function showDOM(params, useFade = false) {
    for (let elem of params) {
        if (elem.attr('class') != 'noDisplay') {
            if (useFade) {
                elem.fadeIn();
            }
            else {
                elem.show();
            }
        }
    }
}

function fetchInfo(uid, adjust = {toLeft: false, toTop: false}) {
    if (missions[uid]) {
        return;
    }

    missions[uid] = true;
    let userInfo = {};
    $.get(`${location.origin}/user/${uid}`, function (data) {
        let name = data.match(/<a href="\/user\/\w+">[\s\S]+?<\/a>/)[0];
        name = $(name).text();
        let latestTL = data.match(/<ul class="timeline">[\s\S]+?<\/ul>/)[0];
        latestTL = $(latestTL).find('li:first small.time').text()
                              .replace(/\s{2,}/g, ' ').replace('d', '天').replace('h', '小时')
                              .replace('m', '分钟').replace('s', '秒').replace('ago', '前');
        let animeCount = [0, 0, 0, 0, 0];
        let anime = data.match(/<div id="anime"[\s\S]*?<div class="horizontalOptions clearit">[\s\S]*?<\/div>/);
        if (anime) {
            anime = anime[0];
            anime.match(/\d{1,}[\u4e00-\u9fa5]{3}/g).forEach(function (elem, index) {
                animeCount[index] = parseInt(elem.match(/\d{1,}/)[0], 10);
            });
        }
        userInfo = {
            uid: uid,
            name: name,
            latestTL: latestTL,
            animeCount: animeCount
        };
        if (uid !== me) {
            let isFriend = data.match(/<span id="friend_flag">[\s\S]*?<\/span>/)[0];
            isFriend = !!$(isFriend).text();
            let sync = data.match(/<div class="userSynchronize">[\s\S]+?<\/div>/)[0];
            let syncNum = $(sync).find('small').text().match(/\d+/)[0];
            let syncPercent = $(sync).find('span.percent_text').text();
            userInfo.isFriend = isFriend;
            userInfo.syncNum = syncNum;
            userInfo.syncPercent = syncPercent;
        }

        cache[uid] = userInfo;
        if (uid === currentMission || !currentMission) {
            updateUserInfo(userInfo, adjust);
        }
    });
}

function updateUserInfo(userInfo, adjust = {toLeft: false, toTop: false}) {
    if (!userInfo) {
        return;
    }
    let oldOffset = element_mainBox.offset();
    let oldSize = {
        width: element_mainBox.width(),
        height: element_mainBox.height()
    };

    hideDOM([
        element_loading
    ]);

    if (userInfo.uid != me) {
        element_name.html(`<a href="/user/${userInfo.uid}" class="l noPop">${userInfo.name}</a>  ${userInfo.isFriend ? '已经是' : '还不是'}你的好友`);
        element_sync.html(`你们之间有${userInfo.syncNum}个共同喜好 / 同步率 ${userInfo.syncPercent}`);
    }

    let person = userInfo.uid === me ? '你' : 'TA';
    const LANG_SELECTED = LANG[Math.floor(Math.random() * LANG.length)];
    element_tsukkomi.html(`「  ${LANG_SELECTED}  」`);
    element_tl.html(`${person}的最后一条时间胶囊更新时间是在 ${userInfo.latestTL}`);

    let collect = userInfo.animeCount[ACTION_ORDER.collect];
    let dropped = userInfo.animeCount[ACTION_ORDER.dropped];

    if (collect > 0 && dropped > 0) {
        element_animeCount.html(`${person}一共看过了 ${collect} 部动画，抛弃了 ${dropped} 部动画`);
    }
    else if (collect > 0) {
        element_animeCount.html(`${person}一共看过了 ${collect} 部动画`);
    }
    else {
        element_animeCount.html(`${person}没有看过动画...`);
    }

    element_animeCount.append('<span>设置</span>');
    let settingBtn = element_animeCount.find('span');
    settingBtn.click(function () {
        checkSettings();
        showDOM([
            element_settings
        ], true);
        // hideDOM([
        //     settingBtn
        // ]);
        element_settings.css('left', `${element_mainBox.width() + 10}px`);
        element_settings.find('input').change(function() {
            let self = $(this);
            let key = self.attr('id').substr(8);
            let value = !!self.attr('checked');
            settings[key] = value;
            settingsChanged = true;
        });
    });

    showDOM([
        element_tsukkomi,
        element_tl,
        element_animeCount,
        element_seeMore
    ]);
    if (userInfo.uid != me) {
        showDOM([
            element_name,
            element_sync
        ]);
    }
    hideDOM([
        element_loading
    ]);

    element_mainBox.css({
        top: adjust.toTop ? `${oldOffset.top - element_mainBox.height() + oldSize.height}px` : oldOffset.top,
        left: adjust.toLeft ? `${oldOffset.left - element_mainBox.width() + oldSize.width}px` : oldOffset.left
    });
}

function checkSettings() {
    for (let key in settings) {
        let elem = element_settings.find(`input#setting_${key}`);
        if (settings[key]) {
            elem.attr('checked', 'checked');
        }
        else {
            elem.removeAttr('checked');
        }
    }
}

function applySettings() {
    element_tl.attr('class', settings.noTL ? 'noDisplay' : '');
    element_sync.attr('class', settings.noSync ? 'noDisplay' : '');
    element_seeMore.attr('class', settings.noScores ? 'noDisplay' : '');
    element_tsukkomi.attr('class', settings.noTsukkomi ? 'noDisplay' : '');
    // settings.calculateSD
    // settings.includeDropped
}

function fetchData(uid, type = 'anime', action = 'collect', page = 1, currentPage = 1, allPage = 1) {
    if (uid !== currentMission) {
        return;
    }

    let total = cache[uid].animeCount[ACTION_ORDER[action]];
    $.get(`${location.origin}/${type}/list/${uid}/${action}?page=${page}`, function (data) {
        let prograss = currentPage / allPage;
        element_scores.find('#fifth_bgm_prograss').animate({
            width: `${prograss * 100}%`
        });

        let stars = data.match(/<span class="sstars\d{1,2} starsinfo"><\/span>/g);
        if (stars) {
            stars.forEach(function (elem) {
                starsCounts[elem.match(/\d{1,2}/)[0]] += 1;
            });
        }
        if (MAX_SUBJECTS_ON_ONE_PAGE * page < total) {
            fetchData(uid, type, action, page + 1, currentPage + 1, allPage);
        }
        else {
            starsCounts[0] = total - sumUp(starsCounts, false);
            let cachedScores = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.scores)) || {};
            if (!cachedScores[uid]) {
                cachedScores[uid] = {};
            }
            Object.assign(cachedScores[uid], {
                [action + 'Count']: total,
                [action]: starsCounts
            });
            localStorage.setItem(LOCAL_STORAGE_KEYS.scores, JSON.stringify(cachedScores));
            if (action == 'collect') {
                starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                fetchData(uid, type, 'dropped', 1, currentPage + 1, allPage);
            }
            else {
                updateUserData(uid);
            }
        }
    });
}

function updateUserData(uid) {
    let person = uid === me ? '你' : 'TA';
    let cachedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.scores));
    let total = cachedData[uid].collectCount;
    let scores = cachedData[uid].collect;
    if (settings.includeDropped) {
        total = cachedData[uid].collectCount + cachedData[uid].droppedCount;
        scores = addUp(cachedData[uid].collect, cachedData[uid].dropped);
    }
    if (total - scores[0] <= 0) {
        element_scores.html(`${person}没有评过分...`);
        return;
    }
    let mean = sumUp(scores, true, true) / (total - scores[0]);
    element_scores.html(`${person}为 ${total - scores[0]} 部动画评了分，平均分为 ${mean.toFixed(2)}`);
    if (settings.calculateSD) {
        element_scores.append(`，标准差为${calculateSD(scores, mean, total).toFixed(2)}`);
    }
    drawChart(scores);
}

function sumUp(scores, isWeighted = false, starredOnly = false) {
    // isWeighted 是否加权
    // starredOnly 是否包含[0]
    let total = 0;
    scores.forEach(function (elem, index) {
        if (index === 0 && starredOnly) {
            return;
        }
        total += elem * (isWeighted ? index : 1);
    });
    return total;
}

function addUp(arrayA, arrayB) {
    // combine two arrays
    if (arrayA.length != arrayB.length) {
        return;
    }
    let newArray = [];
    for (let key in arrayA) {
        newArray.push(arrayA[key] + arrayB[key]);
    }
    return newArray;
}

function drawChart(scores) {
    let maxium = scores[0];
    for (let elem of scores) {
        maxium = elem > maxium ? elem : maxium;
    }
    element_chart.html('');
    let wid = element_mainBox.width() / 61;
    for (let key in scores) {
        if (key > 0) {
            let persent = (scores[key] / maxium).toFixed(2) * 100;
            element_chart.append(`<div id="star${key}" class="chart-bar" style="left: ${(key - 1) * wid * 6 + 5 + wid}px">
                                      <div class="bore" style="height: ${100 - persent}%"></div>
                                      <div class="back" style="height: ${persent}%"></div>
                                      <div class="idx">${key}</div>
                                  </div>`);
        }
    }
    element_chart.find('.chart-bar').css({
        width: `${wid * 5}px`
    });
    showDOM([
        element_chart
    ]);
    element_chart.find('.chart-bar').show();
}

function calculateSD(scores, mean, n) {
    let sd = 0;
    scores.forEach(function (elem, index) {
        if (index === 0) {
            return;
        }
        sd += (index - mean) * (index - mean) * elem;
    });
    return Math.sqrt(sd / (n - 1));
}

body.on('mouseenter', 'a', function(event){
    let self = $(this);
    if (!self.attr('href').match(/^(https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv))?\/user\/\w+$/)) {
        return;
    }
    let uid = self.attr('href').match(/\w+$/);
    if (!uid || self.attr('class') === 'l noPop' || self.text().match(/时光机/)) {
        return;
    }

    if (!element_mainBox) {
        createInfoBox();
    }
    hideDOM([
        element_settings,
        element_tsukkomi,
        element_name,
        element_tl,
        element_animeCount,
        element_sync,
        element_seeMore,
        element_scores,
        element_chart
    ]);
    showDOM([
        element_mainBox,
        element_loading
    ]);

    uid = uid[0];
    currentMission = uid;
    let top = event.pageY;
    let left = event.pageX;
    let adjust = {
        toLeft: false,
        toTop: false
    };
    adjust.toLeft = left > window.innerWidth / 2;
    adjust.toTop = event.clientY > window.innerHeight / 2;

    element_mainBox.css({
        top: adjust.toTop ? `${top - element_mainBox.height() - 20}px` : `${top + 20}px`,
        left: adjust.toLeft ? `${left - element_mainBox.width() - 20}px` : `${left + 20}px`
    });
    if (!!cache[uid]) {
        updateUserInfo(cache[uid], adjust);
    }
    else {
        fetchInfo(uid, adjust);
    }

    element_mainBox.mouseleave(function () {
        hideDOM([
            element_mainBox
        ], true);
        currentMission = '';
        if (settingsChanged) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.settings, JSON.stringify(settings));
            settingsChanged = false;
            applySettings();
        }
    });
});

let version = localStorage.getItem(LOCAL_STORAGE_KEYS.version);
if (!version || version[2] == '1' || version[2] == '0') {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.scores);
}
localStorage.setItem(LOCAL_STORAGE_KEYS.version, CURRENT_VERSION);

let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.settings));
let settingsChanged = false;
if (!settings) {
    settings = DEFAULT_SETTINGS;
    localStorage.setItem(LOCAL_STORAGE_KEYS.settings, JSON.stringify(settings));
}
