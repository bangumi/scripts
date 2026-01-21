// ==UserScript==
// @name         Bangumi Bgmlist Integrator
// @description  将你的"在看"与 bgmlist.com 的放送数据优雅整合!
// @namespace    bangumi.scripts.prevails.bgmlistintegrator
// @version      1.3.1
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

const DEBUG = false;
const CACHE_VERSION = 1;
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

const TB_WINDOW_WIDTH = 250;

const bgmlist = GM_getValue('bgmlist') || {};

class Bangumi {
    constructor(id, a) {
        this.id = Number(id);
        this.bgm = bgmlist[this.id];
        this.a = a;
        if (addOnSources && addOnSources[this.id]) {
            this.bgm.onAirSite = addOnSources[this.id].map(url => ({ title: url.replace(/https?:\/\/.+?\./, '').split('/')[0], url: url })).concat(this.bgm.onAirSite);
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
        $re.find('img').removeAttr('class').attr('width', 48);
        $re.find('span').remove();
        $re.attr('title', this.bgm.titleCN + '\n' + this.bgm.titleJP + '\n播放时间:\n' + this.getTime());
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
    $('#TB_window.userscript_bgmlist_integrator').mouseleave(rmTbWindow);
}

$week.find('.thumbTip').click(function () {
    const $this = $(this);
    const $img = $this.find('img');
    const style = `position:absolute;top:${$img.offset().top}px;left:${$img.offset().left - TB_WINDOW_WIDTH - 10}px;`;
    const onAirSite = $this.data('onAirSite');
    showTbWindow(`
        <small class="grey"><a href="${$this.attr('href')}">${$this.attr('alt')}</a></small>
        <ul class="line_list">
            ${onAirSite.map((v, i) => `
                <li class="line_${i % 2 ? 'odd' : 'even'}">
                    <h6><a target="_blank" href="${v.url}">${v.title}</a></h6>
                </li>
                `.trim()).join('')}
        </ul>`, style);
    return false;
});

GM_addStyle('#TB_window.userscript_bgmlist_integrator{display:block;width:' + TB_WINDOW_WIDTH + 'px;padding:8px;}');

const CHECK_UPDATE_INTERVAL = 1000 * 60 * 60 * 8; // 8h

function getLast(obj) {
    let last;
    for (let i in obj) {
        last = i;
    }
    return obj[last];
}

const LANG_TO_REGIONS = {
    'ja': ['JP'],
    'zh-Hans': ['CN'],
    'zh-Hant': ['TW', 'MO', 'HK'],
    'en': [],
}

async function update({ paths, version }) {
    const items = (await Promise.all(paths.split(',').map(path => request(path)))).reduce((r, it) => r.concat(it.items), []);

    const siteInfoMap = await request('https://bgmlist.com/api/v1/bangumi/site');
    // 不需要bangumi的站点信息, 删掉它
    delete siteInfoMap.bangumi;

    const bgmlist = {};
    for (let item of items) {
        for (const site of item.sites) {
            if (site.site == 'bangumi') {
                const titleTranslate = {
                    [item.lang]: [item.title],
                    ...item.titleTranslate,
                }
                const allSites = [
                    ...item.sites
                        .filter(it => it.site !== 'bangumi')
                        .map((site) => ({
                            site: site.site,
                            id: site.id,
                            url: site.url,
                            begin: site.begin,
                            end: site.end ?? '',
                            broadcast: site.broadcast,
                            regions: site.regions ?? siteInfoMap[site.site]?.regions ?? [],
                        })),
                    {
                        site: 'origin',
                        id: undefined,
                        url: undefined,
                        begin: item.begin,
                        end: item.end ?? '',
                        broadcast: item.broadcast,
                        // 为空的regions是特殊值, 表示该site支持所有区域
                        regions: LANG_TO_REGIONS[item.lang] ?? [],
                    },
                ]
                const cnSites = allSites.filter(it => it.regions.length == 0 || it.regions.some(r => ['CN', 'TW', 'MO', 'HK'].includes(r)));
                const jpSites = allSites.filter(it => it.regions.length == 0 || it.regions.includes('JP'));
                const getBeginDate = (sites) => sites.filter(it => it.broadcast || it.begin).map(it => new Date(it.broadcast?.split('/')[1] ?? it.begin)).sort((a, b) => a - b)[0];
                const cnDate = getBeginDate(cnSites);
                const jpDate = getBeginDate(jpSites);
                const getWeek = (date) => WEEK_DAY.indexOf(date.toDateString().substr(0, 3))
                const getTime = (date) => `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;

                // 将新的播放信息转换成旧的播放信息...
                // 参考: https://github.com/bangumi-data/bangumi-data/blob/master/CONTRIBUTING.md/#%E7%95%AA%E7%BB%84%E6%95%B0%E6%8D%AE
                bgmlist[site.id] = {
                    _source: DEBUG ? item : undefined,
                    titleCN: [...(titleTranslate['zh-Hans'] ?? []), ...(titleTranslate['zh-Hant'] ?? [])]?.join('/') ?? '',
                    titleJP: titleTranslate['ja']?.join('/') ?? '',
                    titleEn: titleTranslate['en']?.join('/') ?? '',
                    weekDayJP: getWeek(jpDate),
                    weekDayCN: getWeek(cnDate ?? jpDate),
                    timeJP: getTime(jpDate),
                    timeCN: cnDate != null ? getTime(cnDate) : '',
                    onAirSite: item.sites.map((site) => ({
                        title: siteInfoMap[site.site]?.title ?? site.site,
                        url: site.url ?? siteInfoMap[site.site]?.urlTemplate.replace('{{id}}', site.id)
                    })).filter(it => it.url),
                    officalSite: item.officalSite,
                    bgmId: +site.id,
                    showDate: item.begin,
                    endDate: item.end,
                    newBgm: false,
                };
                break;
            }
        }
    }
    GM_setValue('bgmlist', bgmlist);
    GM_setValue('paths', paths);
    GM_setValue('version', version);
    GM_setValue('cacheVersion', CACHE_VERSION)

    showTbWindow('bgmlist 数据更新成功! 请<a class="l" href="javascript:location.reload();">刷新页面</a><br>',
        'left:80%;top:20px;width:18%;');
    setTimeout(rmTbWindow, 5000);
}

function checkUpdate() {
    const forceUpdate = (GM_getValue('cacheVersion') || 0) !== CACHE_VERSION;
    const lastCheckUpdate = GM_getValue('lastCheckUpdate') || 0;
    if (new Date().getTime() - lastCheckUpdate < CHECK_UPDATE_INTERVAL && !forceUpdate && !DEBUG) {
        return;
    }
    request('https://bgmlist.com/api/v1/bangumi/season/?start=2020q1')
        .then((archive) => {
            const version = archive.version

            // 拉取最近两年的数据
            const paths = archive.items.slice(-8).map(it => `https://bgmlist.com/api/v1/bangumi/archive/${it}`).join(',');
            const oldPaths = GM_getValue('paths');
            const oldVersion = GM_getValue('version');
            if (!oldPaths || !oldVersion || paths != oldPaths || version != oldVersion || forceUpdate || DEBUG) {
                update({ paths: paths, version: version });
            }
            GM_setValue('lastCheckUpdate', new Date().getTime());
        })
}

setTimeout(checkUpdate, 500);

function request(url, { showError = true } = {}) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function (response) {
                if (response.status === 200) {
                    resolve(JSON.parse(response.responseText));
                } else {
                    if (showError) {
                        showTbWindow(`Error, status code: ${response.status}<br>`,
                            'left:80%;top:20px;width:18%;');
                        setTimeout(rmTbWindow, 5000);
                    }
                    reject(response);
                }
            }
        });
    });
}
