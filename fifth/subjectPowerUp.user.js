// ==UserScript==
// @name         subjectPowerUp
// @namespace    fifth26.com
// @version      1.2.0
// @description  条目页面优化：看看你的好友是否喜欢
// @author       fifth | aslo thanks to @everpcpc's contributions.
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @encoding     utf-8
// ==/UserScript==

const ACTIONS = [
    'wishes',
    'collections',
    'doings',
    'on_hold',
    'dropped'
];

const ACTION_LANG = {
    '动画': ['在看', '看过'],
    '书籍': ['在读', '读过'],
    '音乐': ['在听', '听过'],
    '游戏': ['在玩', '玩过'],
    '三次元': ['在看', '看过']
};

let allNum = {
    wishes: 0,
    collections: 0,
    doings: 0,
    on_hold: 0,
    dropped: 0
};

let friendsNum = {
    wishes: 0,
    collections: 0,
    doings: 0,
    on_hold: 0,
    dropped: 0
};

let allInfo = {};
let friendsInfo = {};

let settings = {
    doingsNum: 5,
    collectionsNum: 10,
    staredOnly: false,
    commentedOnly: false
};

let tops = {
    doings: [],
    collections: []
};
let isReady = {
    doings: false,
    collections: false
};

let checkBoxLock = 0;
let loadingImgUrl = 'http://bgm.tv/img/loadingAnimation.gif';
let loadingElement = `<li class="clearit"
                         style="background-image: url(${loadingImgUrl}); height: 4px; background-repeat: no-repeat;">
                     </li>`;

function getCurrentPathInfo() {
    let info = location.pathname.split('/');
    let sid = info[2] || 0;
    // let action = info[3] || 'collections';
    // let queryInfo = getQueryInfo();
    return {
        sid: sid
        // action: action,
        // filter: queryInfo.filter,
        // page: queryInfo.page
    };
}

function countAllNum() {
    $('div.SimpleSidePanel').eq(1).find('a.l').each(function (index) {
        allNum[ACTIONS[index]] = $(this).html().match(/\d+/)[0];
    });
}

function countFriendsNum(sid, action, page) {
    let urlWithFilter = `${location.origin}/subject/${currentPathInfo.sid}/${action}?filter=friends&page=${page}`;
    $.get(urlWithFilter, function (data) {
        let itemNum = $('ul#memberUserList', $(data)).find('li').length;
        if (itemNum >= 20) {
            friendsNum[action] += 20;
            countFriendsNum(sid, action, page + 1);
        }
        else {
            friendsNum[action] += itemNum;
            updatePageInfo(action);
        }
    });
}

function updatePageInfo(action) {
    let aL = $('div.SimpleSidePanel').eq(1).find('[href="/subject/' + currentPathInfo.sid + '/' + action + '"]');
    if (friendsNum[action] > 0) {
        aL.html(aL.html().replace(allNum[action], friendsNum[action]));
        aL.attr('href', '/subject/' + currentPathInfo.sid + '/' + action + '?filter=friends');
    }
    else {
        aL.html('');
    }
    checkBoxLock += 1;
    if (checkBoxLock >= 5) {
        $('#toggle_friend_only').removeAttr('disabled');
    }
}

function switchToAll() {
    $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html(allInfo.ul);
    $('div.SimpleSidePanel').eq(1).find('span.tip_i').html(allInfo.span);
    $('#toggle_friend_only').attr('checked', null);
    $('#toggle_friend_only').removeAttr('disabled');
}

function switchToFriendsOnly() {
    if (friendsInfo.ul || friendsInfo.span) {
        $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html(friendsInfo.ul);
        $('div.SimpleSidePanel').eq(1).find('span.tip_i').html(friendsInfo.span);
        $('#toggle_friend_only').attr('checked', 'checked');
        $('#toggle_friend_only').removeAttr('disabled');
        return;
    }

    $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html(loadingElement);
    for (let action of ACTIONS) {
        countFriendsNum(currentPathInfo.sid, action, 1);
    }
    listRequest('doings');
    listRequest('collections');
}

function listRequest(action) {
    let url = `${location.origin}/subject/${currentPathInfo.sid}/${action}?filter=friends`;
    $.get(url, function (data) {
        let count = 0;
        let info = $('ul#memberUserList', $(data)).find('li').each(function () {
            if (count >= settings[action + 'Num']) {
                return;
            }
            tops[action].push({
                uid: $(this).find('a').attr('href').split('/')[2],
                img: $(this).find('img').attr('src').replace('/m/', '/s/'),
                name: $(this).find('a').text(),
                time: $(this).find('p.info').text(),
                star: $(this).find('span.starstop').attr('class'),
                comment: $(this).find('div.userContainer').html().split('</p>')[1]
            });
            count += 1;
        });
        isReady[action] = true;
        if (isReady.doings && isReady.collections) {
            buildList(tops.doings, tops.collections);
        }
    });
}

function buildListTitle(yet, action) {
    return `<li class="clearit"><div style="padding: 0px 5px; text-align: center;">${yet}${action}的好友</div></li>`;
}

function buildList(doingsTops, collectionsTops) {
    let panel = $('div.SimpleSidePanel').eq(1);
    panel.find('ul').empty();
    if (doingsTops.length > 0) {
        panel.find('ul').append(buildListTitle('现在', lang[0]));
        doingsTops.forEach(function (item) {
            panel.find('ul').append(buildElement(item, 0));
        });
    } else {
        panel.find('ul').append(buildListTitle('没有', lang[0]));
    }
    if (collectionsTops.length > 0) {
        panel.find('ul').append(buildListTitle('已经', lang[1]));
        collectionsTops.forEach(function (item) {
            panel.find('ul').append(buildElement(item, 0));
        });
    } else {
        panel.find('ul').append(buildListTitle('没有', lang[1]));
    }
    $('#toggle_friend_only').attr('checked', 'checked');
}

function buildElement(info, status) {
    let starInfo = info.star ? `<span class="s${info.star.split(' ')[0]} starsinfo"></span>` : '';
    let timeInfo = info.time + ' ' + lang[status];
    return `<li class="clearit">
                <a href="/user/${info.uid}" class="avatar">
                    <span class="avatarNeue avatarSize32 ll" style="background-image:url(\'${info.img}\')"></span>
                </a>
                <div class="innerWithAvatar">
                    <a href="/user/${info.uid}" class="avatar">${info.name}</a>
                    ${starInfo}
                    <br />
                    <small class="grey">${timeInfo}</small>
                </div>
                <div style="padding: 0px 5px;">${info.comment}</div>
            </li>`;
}

function cacheAllInfo() {
    allInfo.ul = $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html();
    allInfo.span = $('div.SimpleSidePanel').eq(1).find('span.tip_i').html();
}

function cacheFriendsInfo() {
    friendsInfo.ul = $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html();
    friendsInfo.span = $('div.SimpleSidePanel').eq(1).find('span.tip_i').html();
}

function addFriendsOnlyToggle() {
    $('div.SimpleSidePanel').eq(1).prepend(`<div class="rr">
                                                <h2 style="display: inline">只看好友</h2>
                                                <input id="toggle_friend_only" type="checkbox" name="friends_only" />
                                            </div>`);
    $('input#toggle_friend_only').css({
        height: '15px',
        width: '15px',
        position: 'relative',
        top: '4px',
        right: '3px'
    });
    $('#toggle_friend_only').change(function (event) {
        $(this).attr('disabled', 'disabled');
        if (event.target.checked) {
            if (!allInfo.ul && !allInfo.span) {
                cacheAllInfo();
            }
            localStorage.setItem('bgm_subject_friends_only', 'friends_only');
            switchToFriendsOnly();
        }
        else {
            if (!friendsInfo.ul && !friendsInfo.span) {
                cacheFriendsInfo();
            }
            localStorage.removeItem('bgm_subject_friends_only');
            switchToAll();
        }
    });
}

let currentPathInfo = getCurrentPathInfo();
let subjectType = $('.focus.chl').text().trim();
let lang = ACTION_LANG.hasOwnProperty(subjectType) ? ACTION_LANG[subjectType] : ['在看', '看过'];
// let isOnAir = checkIsOnAir();

countAllNum();
addFriendsOnlyToggle();

if (localStorage.getItem('bgm_subject_friends_only')
    && localStorage.getItem('bgm_subject_friends_only') === 'friends_only'
) {
    $('#toggle_friend_only').click();
}

// 一些变量和和函数的调整
// 同时加载在看和看过的好友

// ----- 以下为目前未被使用的函数，不确定是否未来会重新启用故注释置底 -----

// -- 1 --
// 判断动画条目是否放送中，仅对动画条目有效，非动画条目可能会出错（即误判
// 若放送中则返回true， 放送结束或判断不能返回false
// 因功能改版，现已弃用
// function checkIsOnAir() {
//     let today = new Date();
//     let startDay = new Date();
//     let totalNum = {};
//     $('ul#infobox li').each(function () {
//         let currentLine = $(this).text().split(': ');
//         if (currentLine[0].search(/结束/) >= 0) {
//             return false;
//         }
//         if (currentLine[0] === '话数') {
//             totalNum = currentLine[1];
//         }
//         if (currentLine[0].search(/开始/) >= 0) {
//             let start = currentLine[1].match(/\d+/g);
//             if (start.length !== 3) {
//                 return false;
//             }
//             startDay.setFullYear(start[0]);
//             startDay.setMonth(start[1] - 1);
//             startDay.setDate(start[2]);
//         }
//     });
//     if (totalNum && totalNum !== '*' & today.getTime() > startDay.getTime()) {
//         return today.getTime() - startDay.getTime() < totalNum * 7 * 24 * 60 * 60 * 1000;
//     }
//     else {
//         return false;
//     }
// }

// -- 2 --
// 获取url请求内容，以对象形式返回，暂时用不到
// function getQueryInfo() {
//     let queryInfo = {
//         filter: '',
//         page: 1
//     };
//     if (location.search) {
//         location.search.slice(1).split('&').forEach(function (elem) {
//             queryInfo[elem.split('=')[0]] = elem.split('=')[1];
//         });
//     }
//     return queryInfo;
// }
