// ==UserScript==
// @name         subjectPowerUp
// @namespace    fifth26.com
// @version      1.1.1
// @description  subject page power up ver2.0
// @author       fifth | everpcpc
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
let isOnAir = false;

function checkIsOnAir() {
    let today = new Date();
    let startDay = new Date();
    let totalNum = {};
    $('ul#infobox li').each(function () {
        let currentLine = $(this).text().split(': ');
        if (currentLine[0] === '话数') {
            totalNum = currentLine[1];
        }
        if (currentLine[0] === '放送开始') {
            let start = currentLine[1].match(/\d+/g);
            startDay.setFullYear(start[0]);
            startDay.setMonth(start[1] - 1);
            startDay.setDate(start[2]);
        }
    });
    if (totalNum && totalNum !== '*') {
        isOnAir = today.getTime() - startDay.getTime() < totalNum * 7 * 24 * 60 * 60 * 1000;
    }
    else {
        isOnAir = false;
    }
}

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

function getCurrentPathInfo() {
    let info = location.pathname.split('/');
    let sid = info[2] || 0;
    // let action = info[3] || 'collections';
    // let queryInfo = getQueryInfo();
    return {
        sid: sid,
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
    let urlWithFilter = location.origin + '/subject/' + currentPathInfo.sid + '/' + action + '?filter=friends&page=' + page;
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
    let a_l = $('div.SimpleSidePanel').eq(1).find('[href="/subject/' + currentPathInfo.sid + '/' + action + '"]');
    if (friendsNum[action] > 0) {
        a_l.html(a_l.html().replace(allNum[action], friendsNum[action]));
        a_l.attr('href', '/subject/' + currentPathInfo.sid + '/' + action + '?filter=friends');
    }
    else {
        a_l.html('');
    }
}

function switchToFriendsOnly() {
    if (friendsInfo.ul) {
        $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html(friendsInfo.ul);
        $('div.SimpleSidePanel').eq(1).find('span.tip_i').html(friendsInfo.span);
        $('#toggle_friend_only').attr("checked","checked");
        return;
    }

    for (let action of ACTIONS) {
        countFriendsNum(currentPathInfo.sid, action, 1);
    }
    let url = location.origin + '/subject/' + currentPathInfo.sid + '/{action}?filter=friends'
        .replace('{action}', isOnAir ? 'doings' : 'collections');
    let tops = [];
    $.get(url, function (data) {
        let info = $('ul#memberUserList', $(data)).find('li:lt(10)');
        info.each(function () {
            tops.push({
                uid: $(this).find('a').attr('href').split('/')[2],
                img: $(this).find('img').attr('src').replace('/m/', '/s/'),
                name: $(this).find('a').text(),
                time: $(this).find('p.info').text(),
                star: $(this).find('span.starstop').attr('class'),
                comment: $(this).find('div.userContainer').html().split('</p>')[1]
            });
        });
        let panel = $('div.SimpleSidePanel').eq(1);
        panel.find('ul').empty();
        tops.forEach(function (item) {
            panel.find('ul').append(buildElement(item));
        });
        $('#toggle_friend_only').attr("checked","checked");
    });
}

function switchToAll() {
    $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html(allInfo.ul);
    $('div.SimpleSidePanel').eq(1).find('span.tip_i').html(allInfo.span);
    $('#toggle_friend_only').attr("checked",null);

}

function buildElement(info) {
    return '<li class="clearit"><a href="/user/{user_id}" class="avatar"><span class="avatarNeue avatarSize32 ll" style="background-image:url(\'{user_image}\')"></span></a><div class="innerWithAvatar"><a href="/user/{user_id}" class="avatar">{user_name}</a>{user_star}<br><small class="grey">{user_time}</small></div><div style="padding: 0px 5px;">{user_comment}</div></li>'
        .replace(/\{user\_id\}/g, info.uid)
        .replace(/\{user\_name\}/g, info.name)
        .replace(/\{user\_image\}/g, info.img)
        .replace(/\{user\_star\}/g, info.star ? '<span class="s{stars} starsinfo"></span>'.replace('{stars}', info.star.split(' ')[0]) : '')
        .replace(/\{user\_time\}/g, info.time + ' ' + (isOnAir ? '在看' : '看过'))
        .replace(/\{user\_comment\}/g, info.comment);
}

function cacheAllInfo() {
    allInfo.ul = $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html();
    allInfo.span = $('div.SimpleSidePanel').eq(1).find('span.tip_i').html();
    console.log(allInfo.span);
}

function cacheFriendsInfo() {
    friendsInfo.ul = $('div.SimpleSidePanel').eq(1).find('ul.groupsLine').html();
    friendsInfo.span = $('div.SimpleSidePanel').eq(1).find('span.tip_i').html();
    console.log(friendsInfo.span);
}

function addFriendsOnlyToggle() {
    $('div.SimpleSidePanel').eq(1).prepend('<div class="rr"><h2 style="display: inline-block">只看好友</h2><input id="toggle_friend_only" type="checkbox" name="friends_only"></input></div>');
    $('input#toggle_friend_only').css({
        'height': '15px',
        'width': '15px',
        'position': 'relative',
        'top': '4px',
        'right': '3px'
    });
    $('#toggle_friend_only').change(function (event) {
        if (event.target.checked) {
            if (!allInfo.ul) {
                cacheAllInfo();
            }
            switchToFriendsOnly();
        } else {
            if (!friendsInfo.ul) {
                cacheFriendsInfo();
            }
            switchToAll();
        }
    });
}

let currentPathInfo = getCurrentPathInfo();
checkIsOnAir();
countAllNum();
addFriendsOnlyToggle();
