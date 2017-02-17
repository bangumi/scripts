// ==UserScript==
// @name         Bangumi添加好友在看、看过
// @namespace    com.everpcpc.bgm
// @version      1.2.4
// @description  条目页面添加好友信息
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @encoding     utf-8
// ==/UserScript==

if (localStorage.getItem('bgm_friends_date') === null || isOneDayAgo()) {
    localStorage.setItem('bgm_friends_date', (new Date()).valueOf());
    storageFriendsList();
}

if (localStorage.getItem('bgm_friends') === null) {
    storageFriendsList();
}
function isOneDayAgo() {
    var d = localStorage.getItem('bgm_friends_date');
    return (new Date() -  new Date(parseInt(d, 10))) > 1000*60*60*24;
}

function getStatusWords() {
    var t = $('.focus.chl').text().trim();
    var a_dict = {
        '动画': ['在看', '看过'],
        '书籍': ['在读', '读过'],
        '音乐': ['在听', '听过'],
        '游戏': ['在玩', '玩过'],
        '三次元': ['在看', '看过'],
    };
    if (a_dict.hasOwnProperty(t)) {
        return a_dict[t];
    } else {
        return ['在看', '看过'];
    }
}

function createFriendNode(friend) {
    var member_url = location.protocol + '//' + location.hostname + '/user/' + friend.member_id;
    // ES6 syntax
    //return $(`<a class="avatar" href="${member_url}" title="${friend.member_name}"><span class="userImage"><img src="${friend.member_img}" class="avatar"></span></a>`);
    return $('<a class="avatar" href="${member_url}" title="${member_name}"><span class="userImage"><img src="${member_img}" class="avatar"></span></a>'.replace('${member_url}',
        member_url).replace('${member_name}',
            friend.member_name).replace('${member_img}',
                friend.member_img));
}

function storageFriendsList() {
    var friends_url = $('#badgeUserPanel').find('li>a').eq(6).attr('href');
    $.get(friends_url, function(data) {
        var member_list = [];
        $('.userContainer a.avatar', $(data)).each(function() {
            var $elem = $(this);
            var member = {
                'member_id': $elem.attr('href').replace(/\/.*\//, ''), 
                'member_name': $elem.text().trim(),
                'member_img': $elem.find('.avatar').attr('src'),
            };
            member_list.push(member);
        });
        localStorage.setItem('bgm_friends', JSON.stringify(member_list));
    });
}

function get_members(members_url) {
    $('#btn_update_members').text("更新中，请稍等~");
    $('#btn_update_members').off("click");
    $.get(members_url, function(data) {
        if (data.error) {
            $('#btn_update_members').text(data.error);
        } else {
            if (data.msg) {
                $('#btn_update_members').text(data.msg);
            }
            doings = data.doings;
            collections = data.collections;
            try {
                var member_list = JSON.parse(localStorage.getItem('bgm_friends'));
                member_list.forEach(function(elem) {
                    if ($.inArray(elem.member_id, doings) > -1) {
                        $('#friend_doings').append(createFriendNode(elem));
                    } else if ($.inArray(elem.member_id, collections) > -1) {
                        $('#friend_collections').append(createFriendNode(elem));
                    }
                });
                $('#btn_update_members').text("手动更新↓");
                $('#btn_update_members').click(update_members);

            } catch (e) {
                $('#btn_update_members').text('好友信息解析出错, 刷新一下重试: ' + e.message);
            }
        }
    });
}


function update_members() {
    var members_url = 'https://bgm.everpcpc.com/api/subject/' + subject_id + '/?update=1';
    $('#friend_collections').empty();
    $('#friend_doings').empty();
    get_members(members_url);
}


function main() {
    var words = getStatusWords();
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2><a id="btn_update_members" href="javascript:void(0);" style="color:white;"></a></h2>');
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2>哪些好友${words}？</h2><ul id="friend_doings" class="groupsLine"></ul>'.replace('${words}', words[0]));
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2>哪些好友${words}？</h2><ul id="friend_collections" class="groupsLine"></ul>'.replace('${words}', words[1]));
    var members_url = 'https://bgm.everpcpc.com/api/subject/' + subject_id + '/';
    $('#btn_update_members').click(update_members);
    get_members(members_url);
}


// check if user has logged in and subject exists
if ($('#badgeUserPanel').length > 0 && $('#bangumiInfo').length > 0) {
    var subject_id = location.pathname.split('/')[2];
    main();
}
