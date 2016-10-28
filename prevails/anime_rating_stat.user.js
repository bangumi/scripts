// ==UserScript==
// @name         Bangumi 动画打分统计
// @encoding     utf-8
// @namespace    bangumi.scripts.prevails.animeratingstatistic
// @version      1.1.0
// @include      /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/user\/\w+$/
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @grant        GM_addStyle
// ==/UserScript==

const $anime = $('#anime');
if ($anime.length === 0) {
    return;
}

const html = `
<div class="rating-statistic-container">
    <div class="rating-bar-container star1">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star2">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star3">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star4">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star5">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star6">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star7">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star8">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star9">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-bar-container star10">
        <div class="rating-bar rating-bar-all"></div>
        <div class="rating-bar rating-bar-dropped"></div>
        <div class="rating-bar rating-bar-on_hold"></div>
        <div class="rating-bar rating-bar-do"></div>
    </div>
    <div class="rating-tag">1</div>
    <div class="rating-tag">2</div>
    <div class="rating-tag">3</div>
    <div class="rating-tag">4</div>
    <div class="rating-tag">5</div>
    <div class="rating-tag">6</div>
    <div class="rating-tag">7</div>
    <div class="rating-tag">8</div>
    <div class="rating-tag">9</div>
    <div class="rating-tag">10</div>
</div>
`;
GM_addStyle(`
.rating-statistic-container {
    width: 100%;
    clear: right;
}
.rating-bar-container {
    float: left;
    width: 10%;
    height: 200px;
    background: #99ccff;
}
.rating-tag {
    float: left;
    width: 10%;
    text-align: center;
    font-size: 16px;
    line-height: 30px;
    color: #666;
}
.rating-bar {
    width: 100%;
}
.rating-bar-all {
    height: 200px;
    background: #eee;
}
.rating-bar-container:hover .rating-bar-all {
    background: #dedede;
}

.rating-bar-do {
    background: #99ff99;
}
.rating-bar-on_hold {
    background: #ffbf80;
}
.rating-bar-dropped {
    background: #ff9999;
}


@media (min-width: 1366px) {
    .rating-bar-container {
        height: 300px;
    }
    .rating-bar-all {
        height: 300px;
    }
}
@media (min-width: 1861px) {
    .rating-bar-container {
        height: 350px;
    }
    .rating-bar-all {
        height: 350px;
    }
}

#collect_progress {color: #99ccff}
#do_progress {color: #99ff99}
#on_hold_progress {color: #ffbf80}
#dropped_progress {color: #ff9999}
`);

const voidArr = '0000000000'.split('').map(Number);

const stat = {
    "collect": {
        arr: voidArr.slice(),
        re: /\d+(?=部看过)/
    },
    "do": {
        arr: voidArr.slice(),
        re: /\d+(?=部在看)/
    },
    "on_hold": {
        arr: voidArr.slice(),
        re: /\d+(?=部搁置)/
    },
    "dropped": {
        arr: voidArr.slice(),
        re: /\d+(?=部抛弃)/
    },
};

let flag = false;
function start(){
    if (flag) {
        console.log(JSON.stringify(stat));
        return;
    }
    $button.find('a').html(`统计中 
    <span id="collect_progress">▁</span><span id="do_progress">▁</span><span id="on_hold_progress">▁</span><span id="dropped_progress">▁</span>`);
    $button[0].title = '再次点击可将当前结果输出到控制台(F12 -> Console)';
    showTbWindow(html);
    flag = true;

    const ultext = $('.horizontalOptions ul', $anime).text();
    const user = location.href.split('/').pop();

    for (let key in stat) {
        const n = (ultext.match(stat[key].re) || [-1])[0];
        const pageCount = Math.floor(n / 24) + 1;
        const urlprefix = `/anime/list/${user}/${key}?orderby=rate&page=`;
        
        const g = fetchControl(urlprefix, pageCount, key);
        deal(g, g.next());
    }
}

function* fetchControl(urlprefix, pageCount, key) {
    const data = stat[key];
    for (let i = 0; i < pageCount; i++) {
        const text = yield fetch(urlprefix + (i + 1));
        showProgress(i / pageCount, key);
        const pageStatArr = Array(10);
        for (let k = 0; k < 10; k++) {
            pageStatArr[k] = (text.match(RegExp(`sstars${k + 1}(?!0)`, 'g')) || []).length;
        }
        total = pageStatArr.reduce((a, b) => a + b);
        if (total === 0) {
            break;
        }
        for (let j = 0; j < 10; j++) {
            data.arr[j] += pageStatArr[j];
        }
        if (total < 24) {
            break;
        }
        showStat();
    }
    showProgress(1.0, key);
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

function addHeights(heights, barclass, $div) {
    for (let i = 0; i < 10; i++) {
        const $starBar = $div.find(`.star${i + 1} .${barclass}`);
        $starBar.attr('style', `height:${heights[i]}%`);
    }
}

function showStat() {
    const all = voidArr.slice();
    for (let i in all) {
        for (let k in stat) {
            all[i] += stat[k].arr[i];
        }
    }
    const k = n => n * 90 / Math.max.apply(this, all);
    const $div = $('.rating-statistic-container');
    addHeights(all.map(i => 100 - k(i)), 'rating-bar-all', $div);
    addHeights(stat.do.arr.map(k), 'rating-bar-do', $div);
    addHeights(stat.dropped.arr.map(k), 'rating-bar-dropped', $div);
    addHeights(stat.on_hold.arr.map(k), 'rating-bar-on_hold', $div);
}

const carr = '▁▂▃▅▆▇'.split('');
function showProgress(progressf, key) {
    const c = carr[Math.floor(progressf * 6) - 1] || carr[0];
    document.getElementById(key + '_progress').innerText = c;
}

function rmTbWindow() {
    $('#TB_window.userscript_rating_statistic').fadeOut('fast', function () {
        $(this).remove();
    });
}
function showTbWindow(html, style) {
    rmTbWindow();
    $('body').append(`
        <div id="TB_window" class="userscript_rating_statistic"${style ? ` style="${style}"` : ''}>
            <small class="grey close" style="float:right"><a href="javascript:;">关闭</a></small>
            ${html}
        </div>`);
    $('#TB_window.userscript_rating_statistic .close').click(rmTbWindow);
}
GM_addStyle('#TB_window.userscript_rating_statistic{display:block;left:75%;top:20px;width:23%;}');

const $button = $(`
<li style="float:right;">
    <a href="javascript:;">打分统计</a>
</li>`);
$anime.find('.horizontalOptions ul').append($button);
$button.click(start);
