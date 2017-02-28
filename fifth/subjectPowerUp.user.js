// ==UserScript==
// @name         subjectPowerUp
// @namespace    fifth26.com
// @version      1.2.1
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
let loadingElementHTML = `<li class="clearit" style="background-image: url(${loadingImgUrl});
                                                    height: 4px;
                                                    background-repeat: no-repeat;"></li>`;
const addOnsHTML = `<div class="rr">
                        <h2 style="display: inline; cursor: pointer;">设置</h2>
                        <h2 style="display: inline">只看好友</h2>
                        <input id="toggle_friend_only" type="checkbox" name="friends_only" />
                    </div>`;
let toggleBox;
let settingsMenu;

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
    panel.find('a.l').each(function (index) {
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
    let aL = panel.find('[href="/subject/' + currentPathInfo.sid + '/' + action + '"]');
    if (friendsNum[action] > 0) {
        aL.html(aL.html().replace(allNum[action], friendsNum[action]));
        aL.attr('href', '/subject/' + currentPathInfo.sid + '/' + action + '?filter=friends');
    }
    else {
        aL.html('');
    }
    checkBoxLock += 1;
    if (checkBoxLock >= 5) {
        toggleBox.removeAttr('disabled');
    }
}

function switchToAll() {
    panel.find('ul.groupsLine').html(allInfo.ul);
    panel.find('span.tip_i').html(allInfo.span);
    toggleBox.attr('checked', null);
    toggleBox.removeAttr('disabled');
}

function switchToFriendsOnly() {
    if (friendsInfo.ul || friendsInfo.span) {
        panel.find('ul.groupsLine').html(friendsInfo.ul);
        panel.find('span.tip_i').html(friendsInfo.span);
        toggleBox.attr('checked', 'checked');
        toggleBox.removeAttr('disabled');
        return;
    }

    panel.find('ul.groupsLine').html(loadingElementHTML);
    for (let action of ACTIONS) {
        countFriendsNum(currentPathInfo.sid, action, 1);
    }
    listRequest('doings');
    listRequest('collections');
}

function listRequest(action, page = 1, limit = settings[action + 'Num']) {
    let url = `${location.origin}/subject/${currentPathInfo.sid}/${action}?filter=friends&page=${page}`;
    $.get(url, function (data) {
        let count = 0;
        let infoList = $('ul#memberUserList', $(data)).find('li');
        infoList.each(function () {
            if (count >= limit) {
                return;
            }
            let starInfo = $(this).find('span.starstop').attr('class');
            let commentInfo = $(this).find('div.userContainer').html().split('</p>')[1];
            if (settings.starredOnly && !starInfo) {
                return;
            }
            if (settings.commentedOnly && !commentInfo) {
                return;
            }
            tops[action].push({
                uid: $(this).find('a').attr('href').split('/')[2],
                img: $(this).find('img').attr('src').replace('/m/', '/s/'),
                name: $(this).find('a').text(),
                time: $(this).find('p.info').text(),
                star: starInfo,
                comment: commentInfo
            });
            count += 1;
        });
        if (infoList.length >= 20) {
            listRequest(action, page + 1, limit - count);
        }
        else {
            isReady[action] = true;
            if (isReady.doings && isReady.collections) {
                buildList(tops.doings, tops.collections);
            }
        }
    });
}

function buildList(doingsTops, collectionsTops) {
    panel.find('ul').empty();
    if (doingsTops.length > 0) {
        panel.find('ul').append(buildListTitle('现在', lang[0]));
        let startIndex = panel.find('ul li').length - 1;
        doingsTops.forEach(function (item) {
            panel.find('ul').append(buildElement(item, 0));
        });
        let endIndex = panel.find('ul li').length - 1;
        panel.find('ul li').eq(startIndex).css({
            'cursor': 'pointer'
        });
        panel.find('ul li').eq(startIndex).toggle(
            function () {
                panel.find(`ul li:gt(${startIndex}):lt(${endIndex})`).slideUp();
                $(this).css({
                    'background-color': '#eee',
                })
            },
            function () {
                panel.find(`ul li:gt(${startIndex}):lt(${endIndex})`).slideDown();
                $(this).css({
                    'background-color': '#fff',
                })
            }
        );
        if (settings.defaultFold) {
            panel.find('ul li').eq(startIndex).click();
        }
    } else {
        panel.find('ul').append(buildListTitle('没有', lang[0]));
    }
    if (collectionsTops.length > 0) {
        panel.find('ul').append(buildListTitle('已经', lang[1]));
        let startIndex = panel.find('ul li').length - 1;
        collectionsTops.forEach(function (item) {
            panel.find('ul').append(buildElement(item, 0));
        });
        let endIndex = panel.find('ul li').length - 1;
        panel.find('ul li').eq(startIndex).css({
            'cursor': 'pointer'
        });
        panel.find('ul li').eq(startIndex).toggle(
            function () {
                panel.find(`ul li:gt(${startIndex}):lt(${endIndex})`).slideUp();
                $(this).css({
                    'background-color': '#eee',
                })
            },
            function () {
                panel.find(`ul li:gt(${startIndex}):lt(${endIndex})`).slideDown();
                $(this).css({
                    'background-color': '#fff',
                })
            }
        );
        if (settings.defaultFold) {
            panel.find('ul li').eq(startIndex).click();
        }
    } else {
        panel.find('ul').append(buildListTitle('没有', lang[1]));
    }
    toggleBox.attr('checked', 'checked');
}

function buildListTitle(yet, action) {
    return `<li class="clearit">
                <div style="padding: 0px 5px; text-align: center;">
                    ${yet}${action}的好友
                </div>
            </li>`;
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
    allInfo.ul = panel.find('ul.groupsLine').html();
    allInfo.span = panel.find('span.tip_i').html();
}

function cacheFriendsInfo() {
    friendsInfo.ul = panel.find('ul.groupsLine').html();
    friendsInfo.span = panel.find('span.tip_i').html();
}

function addFriendsOnlyToggle() {
    panel.prepend(addOnsHTML);
    toggleBox = $('input#toggle_friend_only');
    toggleBox.css({
        'height': '15px',
        'width': '15px',
        'position': 'relative',
        'top': '4px',
        'right': '3px'
    });
    toggleBox.change(function (event) {
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

function addSettingsMenu() {
    let menuContentHTML = `<div class="settings">
                              <div>设置中心，请设置成合理的值</div>
                              <div>
                                  进行好友数量
                                  <input id="doingsNum" type="text" value="${settings.doingsNum}">
                              </div>
                              <div>
                                  完成好友数量
                                  <input id="collectionsNum" type="text" value="${settings.collectionsNum}">
                              </div>
                              <div>
                                  只看打分好友
                                  <input id="starredOnly" type="checkbox" ${settings.starredOnly ? 'checked' : ''}>
                              </div>
                              <div>
                                  只看评论好友
                                  <input id="commentedOnly" type="checkbox" ${settings.commentedOnly ? 'checked' : ''}>
                              </div>
                              <div>
                                  默认折叠列表
                                  <input id="defaultFold" type="checkbox" ${settings.defaultFold ? 'checked' : ''}>
                              </div>
                              <a id="settings_save" class="l">保存并刷新</a>
                              <a id="settings_cancel" class="l">取消并退出</a>
                              <a id="settings_default" class="l">填写默认值</a>
                          </div>`;
    panel.before(menuContentHTML);
    settingsMenu = $('div.settings');
    panel.find('div.rr h2:first').toggle(
        function () {
            settingsMenu.slideDown();
        },
        function () {
            settingsMenu.slideUp();
        }
    );
    settingsMenu.css({
        'margin-bottom': '5px',
        'display': 'none'
    });
    settingsMenu.find('div:first').css({
        'text-align': 'center',
        'color': '#0084b4'
    });
    settingsMenu.find('div:gt(0)').css({
        'margin-left': '55px'
    });
    settingsMenu.find('[type="text"]').css({
        'display': 'inline',
        'width': '25px'
    });
    settingsMenu.find('[type="checkbox"]').css({
        'display': 'inline',
        'top': '3px',
        'position': 'relative'
    });
    settingsMenu.find('a').css({
        'margin-left': '10px',
        'cursor': 'pointer'
    });
    settingsMenu.find('a').click(function () {
        switch ($(this).attr('id')) {
            case 'settings_save':
                settings = {
                    doingsNum: parseInt($('input#doingsNum').val(), 10),
                    collectionsNum: parseInt($('input#collectionsNum').val(), 10),
                    starredOnly: $('input#starredOnly').attr('checked') ? true : false,
                    commentedOnly: $('input#commentedOnly').attr('checked') ? true : false,
                    defaultFold: $('input#defaultFold').attr('checked') ? true : false
                };
                localStorage.setItem('bgm_subject_settings', JSON.stringify(settings));
                location.reload();
                break;
            case 'settings_cancel':
                settingsMenu.slideUp();
                $('input#doingsNum').val(settings.doingsNum);
                $('input#collectionsNum').val(settings.collectionsNum);
                if (settings.starredOnly) {
                    $('input#starredOnly').attr('checked', 'checked');
                }
                else {
                    $('input#starredOnly').removeAttr('checked');
                }
                if (settings.commentedOnly) {
                    $('input#commentedOnly').attr('checked', 'checked');
                }
                else {
                    $('input#commentedOnly').removeAttr('checked');
                }
                if (settings.defaultFold) {
                    $('input#defaultFold').attr('checked', 'checked');
                }
                else {
                    $('input#defaultFold').removeAttr('checked');
                }
                break;
            case 'settings_default':
                $('input#doingsNum').val(5);
                $('input#collectionsNum').val(10);
                $('input#starredOnly').removeAttr('checked');
                $('input#commentedOnly').removeAttr('checked');
                $('input#defaultFold').removeAttr('checked');
                break;
            default:
                break;
        }
    });
}

let currentPathInfo = getCurrentPathInfo();
let subjectType = $('.focus.chl').text().trim();
let lang = ACTION_LANG.hasOwnProperty(subjectType) ? ACTION_LANG[subjectType] : ['在看', '看过'];
let panel = $('div.SimpleSidePanel:eq(1)');
let settings = {
    doingsNum: 5,
    collectionsNum: 10,
    starredOnly: false,
    commentedOnly: false,
    defaultFold: false
};
if (localStorage.getItem('bgm_subject_settings')) {
    settings = JSON.parse(localStorage.getItem('bgm_subject_settings'));
}
else {
    localStorage.setItem('bgm_subject_settings', JSON.stringify(settings));
}

countAllNum();
addFriendsOnlyToggle();
addSettingsMenu();

if (localStorage.getItem('bgm_subject_friends_only')
    && localStorage.getItem('bgm_subject_friends_only') === 'friends_only'
) {
    toggleBox.click();
}

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
// let isOnAir = checkIsOnAir();

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
// let queryInfo = getQueryInfo();
