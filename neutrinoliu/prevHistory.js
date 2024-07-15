// ==UserScript==
// @name         prevPosts
// @version      0.1
// @description  show last 10 topic posts of a postor
// @author       徒手开根号二
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/group/topic/*
// ==/UserScript==

const API_URL = "aHR0cHM6Ly9lYXN0YXNpYS5henVyZS5kYXRhLm1vbmdvZGItYXBpLmNvbS9hcHAvcHJldnBvc3QtanB6cW0vZW5kcG9pbnQvaGlzdG9yeT91c2VyPQ==";
const PAYLOAD = "eyJhcGkta2V5IiA6ICJNZjQ3eDBsMmtUajgxYVJ6QlNlelNGbHpZajVkVGdtNTV2cEFUalV5akFUeWRWRXJoQ2RjM3l3VnNock5SNEgwIiB9";
const PATH_PREFIX = "/group/topic/";
const ANCHOR = "div.postTopic";
//const ANCHOR = "#columnInSubjectB";

const postTopic = $("div.postTopic");
const posterName = postTopic.find("strong").find('a.l').html();
const posterId = postTopic.attr("data-item-user");
const postId = getPostID();
function getPostID() {
    let path = document.URL.replace("https://" + document.domain, "");
    const s = path.split("/");
    return s[1] + "/topic/" + s[3];
}
//
const STORAGE_KEY_PREFIX = "history_";
const GREET = posterName + " 最近发表的其他话题";
const GREET_fold = GREET + "&nbsp;&nbsp;► ";
const GREET_expand = GREET + "&nbsp;&nbsp;▼ ";

function fetchHistory(user){
    const key = STORAGE_KEY_PREFIX + user;
    const cache = sessionStorage.getItem(key);
    if (!cache) {
        let url = atob(API_URL) + user;
        $.ajax({
            timeout: 5000,
            crossDomain: true,
            CORS: true,
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            url: url,
            data : atob(PAYLOAD),
            success: function(resp) {
                console.log("[bgm_prevPosts] history for " + user + " fetched, " + resp.length + " records.");
                sessionStorage.setItem(key, JSON.stringify(resp));
                drawRecentDiv(genAList(resp));
            },
            error: function(resp) {
                console.warn("[bgm_prevPosts] api fails");
                const ERROR_TEXT = '<h2 id="history_loading" style="font-size:1.2em; text-align:right; margin-bottom:0px"><i>服务器正在ICU抢救中...</i></h2>';
                drawRecentDiv(ERROR_TEXT);
            }
        });
    } else {
        console.log("[bgm_prevPosts] cache hit!");
        drawRecentDiv(genAList(JSON.parse(cache)));
    }
}

function shrinkDate(date) {
    const s = date.split("-")
    return Number(s[1]) + "/" + Number(s[2]) + "/" + Number(s[0].substr(2));
}

function genAList(histDict) {
    const EMPTY_TEXT = '<h2 style="font-size:1.2em; text-align:right; margin-bottom:0px"><i>孤舟蓑笠翁，独钓寒江雪。</i></h2>';
    let ret = '';
    for (let i in histDict) {
        const p = histDict[i];
        // dont have to show current post in the post list
        if (postId === p.type + "/topic/" + p.id) {
            continue;
        }
        ret += '<a href="' + PATH_PREFIX + p.id + '" class="l"><span>' + p.title + '</sapn> <small class="grey">' + shrinkDate(p.lastpost) + '</small></a>';
    }
    if (ret == '') return EMPTY_TEXT;
    return ret;
}

function drawRecentDiv(inner) {
    const target = $("#historyList");
    target.html(inner);
}

function initDraw(){
    const text = '<h2 class="subtitle" id="slideIcon" style="font-size:1em; margin-bottom:0px;">' + GREET_fold + '</h2>';
    // const indicator = '<table><tr><td width="%5"></td><td width="20%">' + icon + '</td><td width="70%>' + text + '</td></tr></table>';
    const INIT_INNER = '<div id="historyList" style="margin-top:10px;" hidden><h2 id="history_loading" style="font-size:1em;">loading...</h2></div>';
    const father = $(ANCHOR);
    father.append('<div class="subject_tag_section inner" id="historyWrapper" style="margin-top:8px;">' + text + INIT_INNER + '</div>');
}

initDraw();
// fetchHistory(posterId);
clickevent();


function clickevent() {
    var block =$('#historyWrapper');
    block.live('click', function() {
        var historyDiv = $(this).find('#historyList');
        if (historyDiv.is(':hidden')) {
            block.find('#slideIcon').html(GREET_expand);
            if (block.find('#history_loading').html()) {
                fetchHistory(posterId);
            }
            historyDiv.slideDown();
        } else {
            block.find('#slideIcon').html(GREET_fold);
            historyDiv.slideUp();
        }
    });
}