// ==UserScript==
// @name         Bangumi Bgmlist Integrator
// @description  将你的"在看"与 bgmlist.com 的放送数据优雅整合!
// @namespace    bangumi.scripts.prevails.bgmlistintegrator
// @version      1.2.4
// @author       "Donuts."
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @include      /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/$/
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      bgmlist.com
// @grant        GM_addStyle
// ==/UserScript==

const addOnSources = {
////////////////////////////////////////////////////////////////
// 可自行添加播放源超链接  以京吹2(http://bgm.tv/subject/152091)为例
////////////////////////////////////////////////////////////////

// 152091: [
//     "https://www.biliplus.com/video/av6556317/",
//     "http://www.dilidili.com/anime/euphonium2/",
// ],

////////////////////////////////////////////////////////////////
};

const TIME_ZONE = 'CN';
// valid value: 'CN', 'JP'

// if not login, exit
if (!document.getElementById('badgeUserPanel')) {
    return;
}

function getOneWeekRange(lastDayDate, endTime = '2359') {
    const end = new Date(lastDayDate);
    end.setHours(endTime.substr(0, 2));
    end.setMinutes(endTime.substr(2, 2), 59, 999);
    const begin = new Date(end.getTime());
    begin.setTime(begin.getTime() - 1000 * 60 * 60 * 24 * 7 + 1);
    return [begin, end];
}

const now = new Date();
const lastWeekRange = getOneWeekRange(now);
const WEEK_DAY = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
];

const bgmlist = GM_getValue('bgmlist') || {};

class Bangumi {
    constructor(id, a) {
        this.id = Number(id);
        this.bgm = bgmlist[this.id];
        this.a = a;
        if (addOnSources && addOnSources[this.id]) {
            this.bgm.onAirSite = addOnSources[this.id].concat(this.bgm.onAirSite);
        }
    }
    getTime() {
        const isSameDay = this.bgm.weekDayJP === this.bgm.weekDayCN;
        let time = '';
        const tcn = this.bgm.timeCN && this.bgm.timeCN.slice(0, 2) + ':' + this.bgm.timeCN.slice(2);
        const tjp = this.bgm.timeJP.slice(0, 2) + ':' + this.bgm.timeJP.slice(2);
        if (TIME_ZONE === 'JP') {
            time += tjp;
        } else {
            time += 'CN ' + (tcn || '无');
            time += '\n';
            time += 'JP ' + (isSameDay ? tjp : ('前日' + tjp));
        }
        return time;
    }
    get$Html() {
        const $re = $(this.a).clone();
        $re.find('img').removeAttr('class');
        $re.find('span').remove();
        $re.attr('title', this.bgm.titleCN + '\n'+ this.bgm.titleJP + '\n播放时间:\n' + this.getTime());
        $re.attr('alt', this.bgm.titleCN + '<br>' + this.bgm.titleJP);
        $re.data('onAirSite', this.bgm.onAirSite);
        return $re;
    }
    getShowDate() {
        return new Date(this.bgm.showDate || 0);
    }
    getEndDate() {
        return new Date(this.bgm.endDate || 0xfffffffffffff);
    }
    isInRange([begin, end]) {
        const showBegin = this.getShowDate();
        const showEnd = this.getEndDate();
        if (showBegin <= begin && showEnd >= end) {
            return true;
        }
        if (begin <= showBegin && showBegin <= end) {
            return true;
        }
        if (begin <= showEnd && showEnd <= end) {
            return true;
        }
        return false;
    }
}

const myBangumis = $('#prgSubjectList > [subject_type=2] > .thumbTip')
        .toArray().map(i => new Bangumi(i.getAttribute('subject_id'), i)).filter(i => i.bgm);

$('.tooltip').hide();
$('.week:eq(1)').remove();

for (let i = 1; i < 7; i++) {
    const day = WEEK_DAY[(now.getDay() - i + 7) % 7];
    const html = `
        <li class="clearit week ${day}">
            <h3><p><small>${day}</small></p></h3>
            <div class="coverList clearit"></div>
        </li>
    `;
    const $li = $(html);
    $('.calendarMini .tip').before($li);
}

const $week = $('.week');
$week.each(function () {
    const $div = $('div', this);
    $div.html('');
    const weekDay = WEEK_DAY.indexOf(this.classList[2]); // <li class="clearit week Sat">
    myBangumis.filter(i => i.bgm['weekDay' + TIME_ZONE] === weekDay && i.isInRange(lastWeekRange))
            .forEach(i => $div.append(i.get$Html()));
});

function rmTbWindow() {
    $('#TB_window.userscript_bgmlist_integrator').fadeOut('fast', function () {
        $(this).remove();
    });
}
function showTbWindow(html, style) {
    rmTbWindow();
    $('body').append(`
        <div id="TB_window" class="userscript_bgmlist_integrator"${style ? ` style="${style}"` : ''}>
            ${html}
            <small class="grey">本插件放送数据由 <a href="http://bgmlist.com">bgmlist.com</a> 提供</small>
        </div>`);

    let url = html.match(/\/subject\/\d+/)[0];
    let source = $(`div#home_calendar ul a[href="${url}"] img`);
    $('div#TB_window').css({
        position: 'absolute',
        top: source.offset().top,
        left: (source.offset().left - $('div#TB_window').width() - 10)
    });
    $('#TB_window.userscript_bgmlist_integrator').mouseleave(rmTbWindow);
}

$week.find('.thumbTip').click(function () {
    const onAirSite = $(this).data('onAirSite');
    showTbWindow(`
        <small class="grey"><a href="${$(this).attr('href')}">${$(this).attr('alt')}</a></small>
        <ul class="line_list">
            ${onAirSite.map((v, i) => `
                <li class="line_${i % 2 ? 'odd' : 'even'}">
                    <h6><a target="_blank" href="${v}">${v.replace(/https?:\/\/.+?\./, '').split('/')[0]}</a></h6>
                </li>
                `.trim()).join('')}
        </ul>`);
    return false;
});

GM_addStyle('#TB_window.userscript_bgmlist_integrator{display:block;left:80%;top:20px;width:18%;}');

const CHECK_UPDATE_INTERVAL = 1000 * 60 * 60 * 8; // 8h

function getLast(obj) {
    let last;
    for (let i in obj) {
        last = i;
    }
    return obj[last];
}

function createIndexOnBgmId(bgmlistOriginJson) {
    const origin = JSON.parse(bgmlistOriginJson);
    const bgmlist = {};
    for (let i in origin) {
        bgmlist[origin[i].bgmId] = origin[i];
    }
    return bgmlist;
}

function update({path, version}) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: path,
        onload: function(response) {
            if (response.status === 200) {
                GM_setValue('bgmlist', createIndexOnBgmId(response.responseText));
                GM_setValue('path', path);
                GM_setValue('version', version);
                showTbWindow('bgmlist 数据更新成功! 请<a class="l" href="javascript:location.reload();">刷新页面</a><br>');
                setTimeout(rmTbWindow, 5000);
            } else {
                showTbWindow(`Error, status code: ${response.status}<br>`);
                setTimeout(rmTbWindow, 5000);
            }
        }
    });
}

function checkUpdate() {
    const lastCheckUpdate = GM_getValue('lastCheckUpdate') || 0;
    if (new Date().getTime() - lastCheckUpdate < CHECK_UPDATE_INTERVAL) {
        return;
    }
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://bgmlist.com/tempapi/archive.json',
        data: {"__t": Date.now()},
        onload: function (response) {
            if (response.status === 200) {
                const archive = JSON.parse(response.responseText);
                const data = archive.data;
                const last = getLast(getLast(data));
                const oldPath = GM_getValue('path');
                const oldVersion = GM_getValue('version');
                if (!oldPath || !oldVersion || last.path > oldPath || last.version > oldVersion) {
                    update(last);
                }
                GM_setValue('lastCheckUpdate', new Date().getTime());
            } else {
                showTbWindow(`Error, status code: ${response.status}<br>`);
                setTimeout(rmTbWindow, 5000);
            }
        }
    });
}

setTimeout(checkUpdate, 500);
