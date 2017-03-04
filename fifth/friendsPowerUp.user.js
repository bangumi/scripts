// ==UserScript==
// @name         friendsPowerUp
// @namespace    fifth26.com
// @version      1.0.8
// @description  好友头像信息增强，了解你的TA
// @author       fifth
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/
// @encoding     utf-8
// ==/UserScript==

const CURRENT_VERSION = '1.0.8';
// const MAX_SUBJECTS_ON_ONE_PAGE = 24;
const LOADING_IMG_URL = 'http://bgm.tv/img/loadingAnimation.gif';

let cache = {};

let me;
let body;
if (location.pathname !== '/rakuen') {
    me = $('div.idBadgerNeue a.avatar').attr('href').match(/\w+$/)[0];
    localStorage.setItem('fifth_bgm_friends_userjs_me', me);
    body = $('body');
}
else {
    me = localStorage.getItem('fifth_bgm_friends_userjs_me');
    body = $(document.getElementById('right').contentDocument.getElementsByTagName('body'));
}

let missions = {};

let userInfo = {};

let isDisplaying = false;

let infoBox;

function fetch(uid, adjust = false) {
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
            updateInfoBox(userInfo, adjust);
        });
    }
    else {
        userInfo = cache[uid];
        updateInfoBox(userInfo, adjust);
    }

}
body.on('mouseenter', 'a', function(event){
    let self = $(this);
    let uid = self.attr('href').match(/\w+$/)[0];
    if (!self.attr('href').match(/\/user\/\w+$/)|| self.attr('class') === 'l noPop' || uid === me) {
        return;
    }

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

    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_loading').css({
        display: 'block'
    });
    infoBox.css({
        display: 'block',
        top: adjust.toTop ? `${top - infoBox.height() - 20}px` : `${top + 20}px`,
        left: adjust.toLeft ? `${left - infoBox.width() - 20}px` : `${left + 20}px`
    });


    fetch(uid, adjust);
    infoBox.mouseleave(hidePopup);
});

function hidePopup() {
    infoBox.css({
        display: 'none'
    });
}

function updateInfoBox(userInfo, adjust = {toLeft: false, toTop: false}) {
    let oldOffset = infoBox.offset();
    let oldSize = {
        width: infoBox.width(),
        height: infoBox.height()
    };
    infoBox.find('p.fifth_bgm_name').html(`<a href="/user/${userInfo.uid}" class="l noPop">${userInfo.name}</a>  ${userInfo.isFriend ? '已经是' : '还不是'}你的好友`);
    infoBox.find('p.fifth_bgm_tl').text(`TA的最后一条时间胶囊更新时间是在 ${userInfo.latestTL}`);
    infoBox.find('p.fifth_bgm_sync').text(`你们之间有${userInfo.syncNum}个共同喜好 / 同步率 ${userInfo.syncPercent}`);

    infoBox.find('div.fifth_bgm_loading').css({
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'block'
    });
    infoBox.css({
        left: adjust.toLeft ? `${oldOffset.left - infoBox.width() + oldSize.width}px` : oldOffset.left,
        top: adjust.toTop ? `${oldOffset.top - infoBox.height() + oldSize.height}px` : oldOffset.top
    });
    // infoBox.find('p.fifth_bgm_anime').text(`collected anime: ${userInfo.animeCollectNum}.`);
    // infoBox.find('p.fifth_bgm_score').text(`average score: ${calculateAverage(starsCounts) / userInfo.animeCollectNum}`);
}

function createInfoBox() {
    body.append(`
        <div id="fifth_bgm_infoBox">
            <div class="fifth_bgm_loading"></div>
            <div class="fifth_bgm_userInfo">
                <p class="fifth_bgm_name"></p>
                <p class="fifth_bgm_tl"></p>
                <p class="fifth_bgm_sync"></p>
            </div>
        </div>
    `);
    infoBox = $('div#fifth_bgm_infoBox');
    infoBox.css({
        'display': 'none',
        'position': 'absolute',
        'background-color': '#fff',
        'border-radius': '5px',
        'box-shadow': '0px 0px 20px #ccc',
        'opacity': '.85'
    });
    infoBox.find('div').css({
        margin: '5px',
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_loading').css({
        'background-image': `url(${LOADING_IMG_URL})`,
        'background-repeat': 'no-repeat',
        'width': '210px',
        'height': '15px',
        'display': 'none'
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
//
// ----- 2 -----
// array sum up with/without weighted
//
// let starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// function sumUp(e, isWeighted) {
//     let total = 0;
//     e.forEach(function (elem, index) {
//         total += elem * (isWeighted ? index : 1);
//     });
//     return total;
// }
// sumUp(starsCounts, true) 加权
// sumUp(starsCounts, false) 不加权
