// ==UserScript==
// @name         friendsPowerUp
// @namespace    fifth26.com
// @version      1.0.4
// @description  好友头像信息增强，了解你的TA
// @author       fifth
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/
// @encoding     utf-8
// ==/UserScript==

const CURRENT_VERSION = '1.0.4';
const MAX_SUBJECTS_ON_ONE_PAGE = 24;
const LOADING_IMG_URL = 'http://bgm.tv/img/loadingAnimation.gif';
const ME = $('div.idBadgerNeue a.avatar').attr('href').match(/\w+$/)[0];

let missions = [];

let userInfo = {};

let isDisplaying = false;

// let starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// function checkTotal(e) {
//     let total = 0;
//     e.forEach(function (elem) {
//         total += elem;
//     });
//     return total;
// }
// function calculateAverage(e) {
//     let total = 0;
//     e.forEach(function (elem, index) {
//         total += elem * index;
//     });
//     return total;
// }

function fetch(uid, missionId, adjust = false) {

    userInfo = {};
    // starsCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    if (!missions[missionId]) {
        return;
    }

    $.get(`${location.origin}/user/${uid}`, function (data) {
        if (!missions[missionId]) {
            return;
        }
        userInfo = {
            uid: uid,
            name: $('h1.nameSingle div.inner a', $(data)).text().trim(),
            isFriend: $('h1.nameSingle div.rr a:first span', $(data)).text().trim() === '解除好友',
            latestTL: $('ul.timeline li:eq(0) small:last', $(data)).text().trim(),
            syncNum: $('div.userSynchronize small.hot', $(data)).text().trim().match(/\d+/)[0],
            syncPercent: $('div.userSynchronize span.percent_text', $(data)).text().trim()
        };
        $.get(`${location.origin}/user/${uid}/timeline`, function (data) {
            if (!missions[missionId]) {
                return;
            }
            userInfo.latestTL = $('div#timeline li:first p.date', $(data)).text().trim();
            updateInfoBox(userInfo, adjust);
        });
    });

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

}

$('a').mouseover(function () {
    let self = $(this);
    if ($(this).find('span').length > 0) {
        self = $(this).find('span');
    }
    else if ($(this).find('img').length > 0) {
        self = $(this).find('img')
    }
    if (!$(this).attr('href').match(/\/user\//)) {
        return;
    }
    if (isDisplaying) {
        return;
    }
    isDisplaying = true;
    let uid = $(this).attr('href').match(/\w+$/)[0];
    if (uid === ME) {
        return;
    }
    infoBox.find('div.fifth_bgm_loading').css({
        display: 'block'
    });
    let adjust = false;
    if (self.offset().left + self.width() > window.innerWidth / 2) {
        infoBox.css({
            display: 'block',
            top: `${self.offset().top}px`,
            left: `${self.offset().left - infoBox.width() -10}px`
        });
        adjust = true;
    } else {
        infoBox.css({
            display: 'block',
            top: `${self.offset().top}px`,
            left: `${self.offset().left + self.width() + 10}px`
        });
    }
    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'none'
    });

    missions.push(true);
    fetch(uid, missions.length - 1, adjust);
});
$('a').mouseout(function () {
    if (!$(this).attr('href').match(/\/user\//)) {
        return;
    }
    infoBox.css({
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_loading').css({
        display: 'none'
    });
    missions[missions.length - 1] = false;
    isDisplaying = false;
});

let infoBox;
if (!infoBox) {
    createInfoBox();
}

function createInfoBox() {
    $('body').append(`
        <div id="fifth_bgm_infoBox" style="
            ">
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
        display: 'none',
        position: 'absolute',
        'background-color': '#fff',
        'border-radius': '5px',
        'box-shadow': '0px 0px 20px #ccc',
        opacity: '.85'
    });
    infoBox.find('div').css({
        margin: '5px',
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_loading').css({
        'background-image': `url(${LOADING_IMG_URL})`,
        'background-repeat': 'no-repeat',
        width: '210px',
        height: '15px',
        display: 'none',

    });
}

function updateInfoBox(userInfo, adjust = false) {
    let oldLeft = infoBox.offset().left;
    let oldWidth = infoBox.width();
    infoBox.find('p.fifth_bgm_name').html(`<a href="#" class="l">${userInfo.name}</a>  ${userInfo.isFriend ? '已经是' : '还不是'}你的好友`);
    infoBox.find('p.fifth_bgm_tl').text(`TA的时间胶囊最后更新时间是在 ${userInfo.latestTL}`);
    infoBox.find('p.fifth_bgm_sync').text(`你们之间有${userInfo.syncNum}个共同喜好 / 同步率 ${userInfo.syncPercent}`);

    infoBox.find('div.fifth_bgm_loading').css({
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'block'
    });
    if (adjust) {
        infoBox.css({
            left: `${oldLeft - infoBox.width() + oldWidth}px`
        });
    }
    // infoBox.find('p.fifth_bgm_anime').text(`collected anime: ${userInfo.animeCollectNum}.`);
    // infoBox.find('p.fifth_bgm_score').text(`average score: ${calculateAverage(starsCounts) / userInfo.animeCollectNum}`);
}
