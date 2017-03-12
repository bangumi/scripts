// ==UserScript==
// @name         friendsPowerUp
// @namespace    fifth26.com
// @version      1.1.0
// @description  好友头像信息增强，了解你的TA
// @author       fifth
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/
// @encoding     utf-8
// ==/UserScript==

const CURRENT_VERSION = '1.1.0';

const LOADING_IMG_URL = 'http://bgm.tv/img/loadingAnimation.gif';

const MAX_SUBJECTS_ON_ONE_PAGE = 24;

const SUBJECT_TYPE = ['anime', 'book', 'music', 'game', 'real'];

const ACTIONS = ['wish', 'collect', 'do', 'on_hold', 'dropped'];

let starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let cache = {};

let me;
let body;
if (location.pathname !== '/rakuen') {
    me = $('div.idBadgerNeue a.avatar').attr('href').match(/\w+$/)[0];
    localStorage.setItem('fifth_bgm_user_userjs_me', me);
    body = $('body');
}
else {
    me = localStorage.getItem('fifth_bgm_user_userjs_me');
    body = $(document.getElementById('right').contentDocument.getElementsByTagName('body'));
}

let missions = {};
let currentMission = '';
let userInfo = {};

let isDisplaying = false;

let infoBox;
let infoBoxUserInfo;
let infoBoxUserData;
let infoBoxSeeMore;
let infoBoxLoading;
let p_name;
let p_tl;
let p_sync;
let p_scores;

function fetchInfo(uid, adjust = false) {
    userInfo = {};
    if (!cache[uid] && !missions[uid]) {
        missions[uid] = true;
        $.get(`${location.origin}/user/${uid}`, function (data) {
            let name = data.match(/<a href="\/user\/\w+">[\s\S]+?<\/a>/)[0];
            name = $(name).text();
            let isFriend = data.match(/<span id="friend_flag">[\s\S]*?<\/span>/)[0];
            isFriend = !!$(isFriend).text();
            let latestTL = data.match(/<ul class="timeline">[\s\S]+?<\/ul>/)[0];
            latestTL = $(latestTL).find('li:first small.time').text().replace(/\s{2,}/g, ' ')
                .replace('d', '天').replace('h', '小时').replace('m', '分钟').replace('s', '秒').replace('ago', '前');
            let sync = data.match(/<div class="userSynchronize">[\s\S]+?<\/div>/)[0];
            let syncNum = $(sync).find('small').text().match(/\d+/)[0];
            let syncPercent = $(sync).find('span.percent_text').text();
            userInfo = {
                uid: uid,
                name: name,
                isFriend: isFriend,
                latestTL: latestTL,
                syncNum: syncNum,
                syncPercent: syncPercent
            };
            cache[uid] = userInfo;
            if (uid === currentMission || !currentMission) {
                updateUserInfo(userInfo, adjust);
            }
        });
    }
    else {
        userInfo = cache[uid];
        updateUserInfo(userInfo, adjust);
    }

}

body.on('mouseenter', 'a', function(event){
    let self = $(this);
    if (!self.attr('href').match(/^(https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv))?\/user\/\w+$/)) {
        return;
    }
    let uid = self.attr('href').match(/\w+$/);
    if (!uid || self.attr('class') === 'l noPop' || uid[0] === me) {
        return;
    }
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

    if (!infoBox) {
        createInfoBox();
    }

    infoBoxUserInfo.hide();
    infoBoxUserData.hide();
    infoBoxSeeMore.hide();
    infoBoxLoading.show();
    infoBox.css({
        top: adjust.toTop ? `${top - infoBox.height() - 20}px` : `${top + 20}px`,
        left: adjust.toLeft ? `${left - infoBox.width() - 20}px` : `${left + 20}px`
    }).fadeIn();

    fetchInfo(uid, adjust);

    infoBox.mouseleave(hidePopup);
});

function hidePopup() {
    infoBox.fadeOut();
    infoBoxSeeMore.hide();
    p_scores.text('');
    currentMission = '';
}

function updateUserInfo(userInfo, adjust = {toLeft: false, toTop: false}) {
    if (!userInfo) {
        return;
    }
    let oldOffset = infoBox.offset();
    let oldSize = {
        width: infoBox.width(),
        height: infoBox.height()
    };
    p_name.html(`<a href="/user/${userInfo.uid}" class="l noPop">${userInfo.name}</a>  ${userInfo.isFriend ? '已经是' : '还不是'}你的好友`);
    p_tl.text(`TA的最后一条时间胶囊更新时间是在 ${userInfo.latestTL}`);
    p_sync.text(`你们之间有${userInfo.syncNum}个共同喜好 / 同步率 ${userInfo.syncPercent}`);

    infoBoxLoading.fadeOut();
    infoBoxUserInfo.fadeIn();
    infoBoxSeeMore.fadeIn();
    infoBox.css({
        top: adjust.toTop ? `${oldOffset.top - infoBox.height() + oldSize.height}px` : oldOffset.top,
        left: adjust.toLeft ? `${oldOffset.left - infoBox.width() + oldSize.width}px` : oldOffset.left
    });
}

function createInfoBox() {
    body.append(`
        <div id="fifth_bgm_infoBox">
            <div class="fifth_bgm_userInfo">
                <p class="fifth_bgm_name"></p>
                <p class="fifth_bgm_tl"></p>
                <p class="fifth_bgm_sync"></p>
            </div>
            <div class="fifth_bgm_seeMore">--- 查看更多 ---</div>
            <div class="fifth_bgm_userData">
                <p class="fifth_bgm_scores"></p>
            </div>
            <div class="fifth_bgm_loading"></div>
        </div>
    `);
    infoBox = $('div#fifth_bgm_infoBox');
    infoBoxUserInfo = infoBox.find('div.fifth_bgm_userInfo');
    infoBoxUserData = infoBox.find('div.fifth_bgm_userData');
    infoBoxSeeMore = infoBox.find('div.fifth_bgm_seeMore');
    infoBoxLoading = infoBox.find('div.fifth_bgm_loading');
    p_name = infoBoxUserInfo.find('p.fifth_bgm_name');
    p_tl = infoBoxUserInfo.find('p.fifth_bgm_tl');
    p_sync = infoBoxUserInfo.find('p.fifth_bgm_sync');
    p_scores = infoBoxUserData.find('p.fifth_bgm_scores');
    infoBox.css({
        display: 'none',
        position: 'absolute',
        opacity: '.85',
        'background-color': '#fff',
        'border-radius': '5px',
        'box-shadow': '0px 0px 20px #ccc'
    });
    infoBox.find('div').css({
        margin: '5px',
        display: 'none'
    });
    infoBoxLoading.css({
        width: '210px',
        height: '15px',
        display: 'none',
        'background-image': `url(${LOADING_IMG_URL})`,
        'background-repeat': 'no-repeat'
    });
    infoBoxSeeMore.css({
        display: 'none',
        cursor: 'pointer',
        'text-align': 'center'
    });
    infoBoxSeeMore.mouseenter(function () {
        infoBoxSeeMore.css({
            'background-color': '#eee'
        });
    });
    infoBoxSeeMore.mouseleave(function () {
        infoBoxSeeMore.css({
            'background-color': '#fff'
        });
    });

    infoBoxSeeMore.click(function () {
        let uid = infoBoxUserInfo.find('a').attr('href').split('/')[2];
        p_scores.text('读取中...');
        infoBoxUserData.show();
        infoBoxSeeMore.fadeOut();
        starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        fetchData(uid);
    });
}

function sumUp(e, isWeighted) {
    // sumUp(starsCounts, true) 加权
    // sumUp(starsCounts, false) 不加权
    let total = 0;
    e.forEach(function (elem, index) {
        total += elem * (isWeighted ? index : 1);
    });
    return total;
}

function fetchData(uid, type = 'anime', action = 'collect', page = 1, totalNum = 0) {
    if (uid !== currentMission) {
        return;
    }
    console.log(`fetch page: ${page}`);
    $.get(`${location.origin}/${type}/list/${uid}/${action}?page=${page}`, function (data) {
        let total = totalNum;
        if (!total || total <= 0) {
            total = data.match(/<ul class="navSubTabs">[\s\S]+?<\/ul>/)[0]
                               .match(/<span>看过[\s\S]*?\(\d+?\)<\/span>/)[0]
                               .match(/\d{1,}/)[0];
            total = parseInt(total, 10);
        }
        if (page === 1) {
            let cachedScores = JSON.parse(localStorage.getItem('fifth_bgm_user_userjs_scores')) || {};
            if (cachedScores.hasOwnProperty(uid)) {
                let currentUserData = cachedScores[uid];
                if (currentUserData && currentUserData.count == total) {
                    updateUserData(uid, currentUserData.scores, total)
                    return;
                }
            }
        }
        p_scores.text(`读取中：${page} / ${Math.ceil(total / MAX_SUBJECTS_ON_ONE_PAGE)}`);
        let stars = data.match(/<span class="sstars\d{1,2} starsinfo"><\/span>/g);
        if (stars) {
            stars.forEach(function (elem) {
                starsCounts[elem.match(/\d{1,2}/)[0]] += 1;
            });
        }
        if (MAX_SUBJECTS_ON_ONE_PAGE * page < total) {
            fetchData(uid, type, action, page + 1, total);
        }
        else {
            starsCounts[0] = total - sumUp(starsCounts, false);
            updateUserData(uid, starsCounts, total);
        }
    });
}

function updateUserData(uid, scores, total) {
    p_scores.text(`TA一共看过 ${total} 部动画，平均打分为 ${(sumUp(scores, true) / total).toFixed(2)}`);
    let cachedScores = JSON.parse(localStorage.getItem('fifth_bgm_user_userjs_scores')) || {};
    cachedScores[uid] = {
        count: total,
        scores: scores
    }
    localStorage.setItem('fifth_bgm_user_userjs_scores', JSON.stringify(cachedScores));
    // console.log(scores, sumUp(scores, false), sumUp(scores, true) / total);
}

// fetchData(location.pathname.split('/')[3]);

function drawChart(e) {
    let maxium = e[0];
    e.forEach(function (elem) {
        if (elem > maxium) {
            maxium = elem;
        }
    });
}

// functiong backup
//
// ----- 1 -----
// collect data fetch
//
// $.get(`${location.origin}/anime/list/${uid}/collect`, function (data) {
//     if (!missions[missionId]) {
//         return;
//     }
//     userInfo.animeCollectNum = parseInt($('ul.navSubTabs a.focus span', $(data)).text().match(/\d+/)[0], 10);
//     for (let i = 1; i <= Math.ceil(userInfo.animeCollectNum / MAX_SUBJECTS_ON_ONE_PAGE); i++) {
//         if (!missions[missionId]) {
//             return;
//         }
//         $.get(`${location.origin}/anime/list/${userInfo.uid}/collect?page=${i}`, function (data) {
//             if (!missions[missionId]) {
//                 return;
//             }
//             console.log(missions);
//             $('ul#browserItemList li.item', $(data)).each(function () {
//                 let starsinfo = $(this).find('p.collectInfo span.starsinfo');
//                 console.log(starsinfo.attr('class').match(/\d+/)[0]);
//                 if (starsinfo.length > 0) {
//                     starsCounts[starsinfo.attr('class').match(/\d+/)[0]] += 1;
//                 }
//                 else {
//                     starsCounts[0] += 1;
//                 }
//             });
//             console.log(starsCounts);
//             if (checkTotal(starsCounts) === userInfo.animeCollectNum) {
//                 console.log(starsCounts);
//                 console.log(Math.round(calculateAverage(starsCounts) / userInfo.animeCollectNum * 100) / 100);
//             }
//         });
//     }
// });
