// ==UserScript==
// @name         Bangumi 条目页添加好友在看/看过
// @namespace    com.everpcpc.bgm
// @version      1.4.8
// @description  条目页面添加好友信息
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @grant        GM_addStyle
// @encoding     utf-8
// ==/UserScript==

GM_addStyle ( `
    #friend_watch_detail .userContainer strong span.userImage {
        float: left;
        margin: 0 0 0 -60px;
    }
    #friend_watch_detail div.userContainer strong {
        display: block;
        border-bottom: 1px solid #CCC;
    }
    #friend_watch_detail div.userContainer {
        background: white;
        position: absolute;
        border-radius: 5px;
        box-shadow: 0 0 5px grey;
        padding: 10px 10px 5px 70px;
        max-width: 270px;
        display: none;
    }
` );


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
    return $(`
        <a id="${friend.node_id}" class="avatar" href="${member_url}">
          <span class="avatarNeue avatarSize32 ll" style="margin:3px 3px 0 0;background-image:url(\'${friend.img}\')" ></span>
        </a>`);
}

function createMoreNode(st) {
    return $(`
        <a class="avatar" href="${location.href}/${st}?filter=friends">
          <span class="avatarNeue ll" style="margin:16px 0 0 0; padding:1px 9px" >-></span>
        </a>`);
}

function get_members(members_url, st) {
    var members_box_id = '#friend_' + st;
    $.get(members_url, function(data) {
        var counter = 0;
        $('.userContainer', $(data)).each(function() {
            var friend = new Object({});
            var elem = $($(this).find('a.avatar'));
            var uid = elem.attr('href').split('/')[2];
            friend.node_id = st + '_node_' + uid;
            friend.detail_id = st + "_detail_" + uid;
            friend.name = elem.text().trim();
            // use small avatar
            friend.img = elem.find('.avatar').attr('src').replace('/lain.bgm.tv/pic/user/m/','/lain.bgm.tv/pic/user/s/');
            $(members_box_id).append(createFriendNode(uid, friend));
            $('#friend_watch_detail').append(
                $(this).attr('id', friend.detail_id)
            );
            $('#' + friend.node_id).mouseover(function(e){
                $('#' + friend.detail_id)
                    .css('left', e.pageX + 32)
                    .css('top', e.pageY - 32)
                    .show();
            }).mouseout(function(e){
                $('#' + friend.detail_id).hide();
            });
            counter ++;
        });
        if (counter >= 20) {
            $(members_box_id).append(createMoreNode(st));
        }
    });
}


function main() {
    var words = getStatusWords();
    $('body').append('<div id="friend_watch_detail" style="display:hide;"></div>');
    for (i = 0; i < STATUS.length; i++) {
        var st = STATUS[i];  // status type
        var status_url = location.href + '/' + st + '?filter=friends';
        $('#columnSubjectHomeA').append(`
            <div class="SimpleSidePanel">
              <h2>
                <a href="${location.href}/${st}?filter=friends">
                  哪些好友${words[st]}？
                </a>
              </h2>
            <ul id="friend_${st}" class="groupsLine">
            </ul>
            </div>`);
        $('#friend_' + st).empty();
        get_members(status_url, st);
    }
}


// check if user has logged in and subject exists
if ($('#badgeUserPanel').length > 0 && $('#bangumiInfo').length > 0) {
    main();
}
