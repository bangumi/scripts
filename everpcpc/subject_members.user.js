// ==UserScript==
// @name         Bangumi添加好友在看、看过
// @namespace    com.everpcpc.bgm
// @version      1.2.8
// @description  条目页面添加好友信息
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @encoding     utf-8
// ==/UserScript==


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

function createFriendNode(uid, friend) {
    var member_url = location.protocol + '//' + location.hostname + '/user/' + uid;
    return $('<a class="avatar" href="${member_url}" title="${member_name}"><span class="avatarNeue avatarSize32 ll" style="margin:3px 3px 0 0;background-image:url(\'${member_img}\')"></span></a>'.replace('${member_url}',member_url).replace('${member_name}',friend.name).replace('${member_img}',friend.img.replace('/lain.bgm.tv/pic/user/m/','/lain.bgm.tv/pic/user/s/')));
}

function get_members(members_url, type_) {
    $.get(members_url, function(data) {
        $('.userContainer a.avatar', $(data)).each(function() {
            var elem = $(this);
            var uid = elem.attr('href').split('/')[2];
            var friend = new Object({});
            friend.name = elem.text().trim();
            friend.img = elem.find('.avatar').attr('src');
            $('#friend_' + type_).append(createFriendNode(uid, friend));
        });
    });
}


function update_members() {
    var doings_url = location.href + '/doings?filter=friends';
    var collections_url = location.href + '/collections?filter=friends';
    $('#friend_collections').empty();
    $('#friend_doings').empty();
    get_members(collections_url, 'collections');
    get_members(doings_url, 'doings');
}


function main() {
    var words = getStatusWords();
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2>哪些好友${words}？</h2><ul id="friend_doings" class="groupsLine"></ul>'.replace('${words}', words[0]));
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2>哪些好友${words}？</h2><ul id="friend_collections" class="groupsLine"></ul>'.replace('${words}', words[1]));
    update_members();
}


// check if user has logged in and subject exists
if ($('#badgeUserPanel').length > 0 && $('#bangumiInfo').length > 0) {
    var subject_id = location.pathname.split('/')[2];
    main();
}
