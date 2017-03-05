// ==UserScript==
// @name         Bangumi 条目页添加好友在看/看过
// @namespace    com.everpcpc.bgm
// @version      1.3.0
// @description  条目页面添加好友信息
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @encoding     utf-8
// ==/UserScript==

var STATUS = ['wishes', 'collections', 'doings'];

function getStatusWords() {
    var t = $('.focus.chl').text().trim();
    var a_dict = {
        '动画': {'doings': '在看', 'collections': '看过', 'wishes': '想看'},
        '书籍': {'doings': '在读', 'collections': '读过', 'wishes': '想读'},
        '音乐': {'doings': '在听', 'collections': '听过', 'wishes': '想听'},
        '游戏': {'doings': '在玩', 'collections': '玩过', 'wishes': '想玩'},
        '三次元': {'doings': '在看', 'collections': '看过', 'wishes': '想看'}
    };
    if (a_dict.hasOwnProperty(t)) {
        return a_dict[t];
    } else {
        return a_dict['动画'];
    }
}

function createFriendNode(uid, friend) {
    var member_url = '//' + location.hostname + '/user/' + uid;
    return $(`<a class="avatar" href="${member_url}" title="${friend.name}"><span class="avatarNeue avatarSize32 ll" style="margin:3px 3px 0 0;background-image:url(\'${friend.img}\')"></span></a>`);
}

function createFriendDetail(uid, friend) {
}

function get_members(members_url, type_) {
    $.get(members_url, function(data) {
        $('.userContainer a.avatar', $(data)).each(function() {
            var elem = $(this);
            var uid = elem.attr('href').split('/')[2];
            var friend = new Object({});
            friend.name = elem.text().trim();
            friend.img = elem.find('.avatar').attr('src').replace('/lain.bgm.tv/pic/user/m/','/lain.bgm.tv/pic/user/s/');
            $('#friend_' + type_).append(createFriendNode(uid, friend));
        });
    });
}


function main() {
    var words = getStatusWords();
    for (i = 0; i < STATUS.length; i++) {
        var st = STATUS[i];  // status type
        var status_url = location.href + '/' + st + '?filter=friends';
        $('#columnSubjectHomeA').append(`<div class="SimpleSidePanel"><h2>哪些好友${words[st]}？</h2><ul id="friend_${st}" class="groupsLine"></ul>`);
        $('#friend_' + st).empty();
        get_members(status_url, st);
    }
}


// check if user has logged in and subject exists
if ($('#badgeUserPanel').length > 0 && $('#bangumiInfo').length > 0) {
    var subject_id = location.pathname.split('/')[2];
    main();
}
