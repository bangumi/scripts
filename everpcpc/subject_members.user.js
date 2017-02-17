// ==UserScript==
// @name         Bangumi添加好友在看、看过
// @namespace    com.everpcpc.bgm
// @version      1.2.0
// @description  条目页面添加好友信息
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/\d+$/
// @encoding     utf-8
// ==/UserScript==

var subject_id = $(location).attr('href').split('/',5)[4];


function get_members(members_url) {
    $('#btn_update_members').html("更新中，请稍等~");
    $.get(members_url, function(data) {
        if (data.error) {
            $('#btn_update_members').html(data.error);
        } else {
            if (data.msg) {
                console.log(data.msg);
                $('#btn_update_members').html(data.msg);
            }
            doings = data.doings;
            collections = data.collections;
            var friends_url = $('#badgeUserPanel').children()[6].children[0].href;
            $.get(friends_url, function(data) {
                member_list = $('#memberUserList', $(data)).children();
                for (i = 0; i < member_list.length; i++) {
                    members = $(member_list[i]);
                    member_url = members.find('a.avatar')[0].href;
                    member = member_url.split('/',5)[4];
                    if (doings.includes(member)) {
                        $('#friend_doings').append('<a id="doings_'+member+'" href="'+member_url+'"></a>');
                        $('#doings_'+member).append(members.find('.userImage'));
                    } else if (collections.includes(member)) {
                        $('#friend_collections').append('<a id="collections_'+member+'" href="'+member_url+'"></a>');
                        $('#collections_'+member).append(members.find('.userImage'));
                    }
                }
                $('#btn_update_members').html("手动更新↓");
            });
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
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2><a id="btn_update_members" href="javascript:void(0);" style="color:white;"></a></h2>');
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2>哪些好友在看？</h2><ul id="friend_doings" class="groupsLine"></ul>');
    $('#columnSubjectHomeA').append('<div class="SimpleSidePanel"><h2>哪些好友看过？</h2><ul id="friend_collections" class="groupsLine"></ul>');
    var members_url = 'https://bgm.everpcpc.com/api/subject/' + subject_id + '/';
    $('#btn_update_members').click(update_members);
    get_members(members_url);
}


// check if user has logged in and subject exists
if ($('#badgeUserPanel').length > 0 && $('#bangumiInfo').length > 0) {
    main();
}
