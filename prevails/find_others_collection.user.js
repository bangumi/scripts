// ==UserScript==
// @name         Bangumi 查找他人收藏
// @namespace    bangumi.scripts.prevails.findotherscollection
// @version      1.1
// @description  在他人的收藏中找到你想查看的特定条目，了解 ta 对这部作品的评价如何
// @author       "Donuts."
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(anime|game|book|music|real)\/list\/\w+?\/(collect|do|wish|on_hold|dropped)/
// @exclude      /tag=/
// @grant        none
// @encoding     utf-8
// ==/UserScript==
(function() {
const avatarhref = $('.idBadgerNeue>.avatar').attr('href');
if (avatarhref && avatarhref.replace(location.origin, '') === $('.headerAvatar>.avatar').attr('href')) { // login myself
    return;
}

// copy from https://bgm.tv/js/imgcut.js on Feb 12th, 2017, modified by "Donuts."
var findSubjectFunc = function() {
    var subject_name = $('#subjectName').attr('value');
    $('#subjectList').html('<tr><td>正在检索条目中...</td></tr>');
    var search_mod = location.pathname.match(/[^\/]+(?=\/)/)[0];
    $.ajax({
        type: "GET",
        url: '/json/search-' + search_mod + '/' + encodeURIComponent(subject_name),
        dataType: 'json',
        success: function(subjects) {
            var html = '';
            if ($(subjects).size() > 0) {
                subjectList = subjects;
                for (var i in subjects) {
                    html += genSubjectList(subjects[i], i, 'searchResult');
                }
            } else {
                $("#robot").fadeIn(300);
                $("#robot_balloon").html('呜っ似乎没有找到相关结果');
                $("#robot").animate({
                    opacity: 1
                }, 1000).fadeOut(2000);
                html = '';
            }
            $('#subjectList').html(html);
        },
        error: function(msg) {
            var html = '';
            $("#robot").fadeIn(300);
            $("#robot_balloon").html('通信错误，您是不是重复查询太快了？');
            $("#robot").animate({
                opacity: 1
            }, 1000).fadeOut(2000);
            $('#subjectList').html(html);
        }
    });
};

function genSubjectList(subject, key, target) {
    var html = '';
    var links_start = '<a href="/' + subject.url_mod + '/' + subject.id + '" class="avatar h">';
    html += '<li class="clearit">';
    html += links_start + '<img src="' + subject.img + '" class="avatar ll" /></a>';
    html += '<div class="inner">';
    for (var i in subject.extra) {
        html += '<small class="grey rr">' + subject.extra[i] + '</small>';
    }
    html += '<p>' + links_start + subject.name + '</a></p>';
    html += '<small class="tip">' + subject.name_cn + '</small>';
    html += '</div>';
    html += '</li>';
    return html;
}
/////////////// COPY END ////////////////

const cl = document.getElementById('columnSubjectBrowserB');
cl.innerHTML = `
    <div id="collection_search" style="margin-bottom: 5px">
        <input type="text" id="subjectName" value="" class="searchInputL" style="width:107px;" placeholder="搜索条目">
        <input type="button" id="findSubject" class="searchBtnL" value="查询">
        <div class="subjectListWrapper">
            <ul id="subjectList" class="subjectList ajaxSubjectList">
            </ul>
        </div>
    </div>` + cl.innerHTML;

function ukagakaPop(msg) {
    chiiLib.ukagaka.presentSpeech(msg);
}

function findInPage(id, $doc) {
    return $doc.find('#item_' + id).length !== 0;
}

function getFirstLastSubject($doc) {
    const $ul = $doc.find('#browserItemList');
    return [$ul.find('h3>a:first'), $ul.find('h3>a:last')].map(i => {
        if (i.next()[0]) {
            return i.next().text().trim();
        }
        return i.text().trim();
    });
}

function deal(g, next) {
    if (next.done) {
        return;
    }
    next.value.then(re => re.text())
    .then(text => {
        deal(g, g.next(text));
    });
}

function findCollection(id, name) {
    if (findInPage(id, $(document))) {
        ukagakaPop(name + ' 就在<b>当前页面</b>');
        return;
    }
    const others = $('.navSubTabs a:not(.focus)').toArray().map(i => i.innerText.replace(/\s+/g, '')).join(', ');
    const cannotBeFoundMsg = '这边没有找到 ' + name + '，请尝试在 <b>' + others + '</b> 中查找';
    if ($('.p').length === 0) {
        ukagakaPop(cannotBeFoundMsg);
        return;
    }
    ukagakaPop('正在查找 ' + name + ' ，请稍等...');
    const pages = $('.p').toArray().map(a => Number(a.href.match(/page=\d+/)[0].replace('page=', '')));
    pages.push(Number($('.p_cur').text()));
    const maxPage = pages.reduce((a, b) => a > b ? a : b);
    const urlprefix = location.origin + location.pathname + '?orderby=title&page=';

    // const maxCount = Math.floor(Math.log2(maxPage)) + 1;

    const g = (function* () {
        let a = 1;
        let b = maxPage;
        // let count = 0;
        while (a <= b) {
            // ukagakaPop('正在查找 ' + name + ' ，请稍等...' + (count++) + '/' + maxCount);
            const page = Math.floor((a + b) / 2);
            const url = urlprefix + page;
            const text = yield fetch(url); // fetch(url, {credentials: 'include'}) // with cookies
            const html = text.replace(/<img src=".+?" class="cover" \/>/g, '').replace(/<script.+?<\/script>/g, ''); // remove imgs and scripts
            const $doc = $(html);
            if (findInPage(id, $doc)) {
                ukagakaPop(`<b>${name} 找到了！ <a href="${url}#item_${id}">点这里前往！</a></b>`);
                return;
            } else {
                const [first, last] = getFirstLastSubject($doc);
                if (name < first) {
                    b = page - 1;
                } else if (name > last) {
                    a = page + 1;
                } else {
                    break;
                }
            }
        }
        ukagakaPop(cannotBeFoundMsg);
        return;
    })();
    deal(g, g.next());
}

$('#subjectList').on('click', '.inner a', function(event) {
    var subject_id = event.target.href.match(/\d+/)[0];
    var subject_name = event.target.innerText.trim();
    findCollection(subject_id, subject_name);
    return false;
});

document.getElementById('findSubject').addEventListener('click', findSubjectFunc);
})();
