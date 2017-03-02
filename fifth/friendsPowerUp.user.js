// ==UserScript==
// @name         friendsPowerUp
// @namespace    fifth26.com
// @version      1.0.0
// @description  好友头像信息增强，了解你的TA
// @author       fifth
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/
// @encoding     utf-8
// ==/UserScript==

const CURRENT_VERSION = '1.0.0';
const MAX_SUBJECTS_ON_ONE_PAGE = 24;
const LOADING_IMG_URL = 'http://bgm.tv/img/loadingAnimation.gif';

let missions = [];

let userInfo = {};

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

function fetch(uid, missionId) {

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
            name: $('h1.nameSingle div.inner a', $(data)).text(),
            isFriend: $('h1.nameSingle div.rr a:first span', $(data)).text() === '解除好友',
            latestTL: $('ul.timeline li:eq(0) small:last', $(data)).text(),
            syncNum: $('div.userSynchronize small.hot', $(data)).text().match(/\d+/)[0],
            syncPercent: $('div.userSynchronize span.percent_text', $(data)).text()
        };
        updateInfoBox(userInfo);
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

$('a.avatar').mouseenter(function () {
    let self = $(this).find('span');
    if (self.offset().left > window.innerWidth / 2) {
        infoBox.css({
            display: 'block',
            top: `${self.offset().top}px`,
            // right: `${self.offset().left - 10}px`
            left: `${self.offset().left - 250}px`
        });
    } else {
        infoBox.css({
            display: 'block',
            top: `${self.offset().top}px`,
            left: `${self.offset().left + self.width() + 10}px`
        });
    }
    infoBox.find('div.fifth_bgm_loading').css({
        display: 'block'
    });
    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'none'
    });

    let uid = $(this).attr('href').match(/\w+$/)[0];
    missions.push(true);
    fetch(uid, missions.length - 1);
});
$('a.avatar').mouseout(function () {
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
        width: '240px',
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
        'margin-left': '15px',
        width: '210px',
        height: '15px',
        display: 'none',

    });
}

function updateInfoBox(userInfo) {
    infoBox.find('p.fifth_bgm_name').text(`${userInfo.name}  ${userInfo.isFriend ? '已经是' : '还不是'}你的好友`);
    infoBox.find('p.fifth_bgm_tl').text(`TA最后一条TimeLine在 ${userInfo.latestTL}`);
    infoBox.find('p.fifth_bgm_sync').text(`你们之间有${userInfo.syncNum}个共同喜好 / 同步率 ${userInfo.syncPercent}`);

    infoBox.find('div.fifth_bgm_loading').css({
        display: 'none'
    });
    infoBox.find('div.fifth_bgm_userInfo').css({
        display: 'block'
    });
    // infoBox.find('p.fifth_bgm_anime').text(`collected anime: ${userInfo.animeCollectNum}.`);
    // infoBox.find('p.fifth_bgm_score').text(`average score: ${calculateAverage(starsCounts) / userInfo.animeCollectNum}`);
}
