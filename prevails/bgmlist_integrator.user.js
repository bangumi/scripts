// ==UserScript==
// @resource     bgmlist http://bgmlist.com/json/bangumi-1607.json
// @name         Bangumi Bgmlist Integrator
// @description  将你的"在看"与 bgmlist.com 的放送数据优雅整合!
// @namespace    bangumi.scripts.prevails.bgmlistintegrator
// @version      1.0.0s1607
// @author       "Donuts."
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @include      /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/$/
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

const TIME_ZONE = 'CN';
// valid value: 'CN', 'JP'

// if not login, exit
if (!document.getElementById('badgeUserPanel')) {
    return;
}

const NOW = new Date();
const WEEK_DAY = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
];

const origin = JSON.parse(GM_getResourceText('bgmlist'));
const bgmlist = {};
for (let i in origin) { // create index on bgmId
    bgmlist[origin[i].bgmId] = origin[i];
}

class Bangumi {
    constructor(id, a) {
        this.id = Number(id);
        this.bgm = bgmlist[this.id];
        this.a = a;
    }
    get$Html() {
        const $re = $(this.a).clone();
        $re.find('img').removeAttr('class');
        $re.find('span').remove();
        $re.attr('title', this.bgm.titleCN + '\n' + this.bgm.titleJP);
        $re.data('onAirSite', this.bgm.onAirSite);
        return $re;
    }
}

const myBangumis = $('#prgSubjectList > [subject_type=2] > .thumbTip')
        .toArray().map(i => new Bangumi(i.getAttribute('subject_id'), i)).filter(i => i.bgm);

$('.week:eq(1)').remove();
$('.week').data('date', NOW);

for (let i = 1; i < 7; i++) {
    const day = WEEK_DAY[(NOW.getDay() - i) % 7];
    const html = `
        <li class="clearit week ${day}">
            <h3><p><small>${day}</small></p></h3>               
            <div class="coverList clearit"></div>
        </li>
    `;
    const $li = $(html);
    const date = new Date();
    date.setDate(date.getDate() - i);
    $li.data('date', date);
    $('.calendarMini .tip').before($li);
}

const $week = $('.week')
$week.each(function () {
    const $div = $('div', this);
    const date = $(this).data('date');
    $div.html('');
    const weekDay = WEEK_DAY.indexOf(this.classList[2]); // <li class="clearit week Sat">
    myBangumis.filter(i => i.bgm['weekDay' + TIME_ZONE] === weekDay && date >= new Date(i.bgm.showDate))
            .forEach(i => $div.append(i.get$Html()));
});

function rmTbWindow() {
    $('#TB_window.userscript_bgmlist_integrator').fadeOut('fast', function () {
        $(this).remove();
    });
}

$week.find('.thumbTip').click(function () {
    rmTbWindow();
    const onAirSite = $(this).data('onAirSite');
    $('body').append(`
        <div id="TB_window" class="userscript_bgmlist_integrator">
            <small class="grey"><a href="${$(this).attr('href')}">${$(this).attr('title').replace('\n', '<br>')}</a></small>
            <ul class="line_list">
                ${onAirSite.map((v, i) => `
                    <li class="line_${i % 2 ? 'odd' : 'even'}">
                        <h6><a target="_blank" href="${v}">${v.replace(/http:\/\/.+?\./, '').split('/')[0]}</a></h6>
                    </li>
                    `).join('')}
            </ul>
            <small class="grey">本插件放送数据由 <a href="http://bgmlist.com">bgmlist.com</a> 提供</small>
        </div>`);
    $('#TB_window.userscript_bgmlist_integrator a').click(rmTbWindow);
    $('#TB_window.userscript_bgmlist_integrator').mouseleave(rmTbWindow);
    return false;
});

GM_addStyle('#TB_window.userscript_bgmlist_integrator{display:block;left:80%;top:20px;width:18%;}');
