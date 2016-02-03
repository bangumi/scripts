// ==UserScript==
// @name        Bangumi Homepage Calendar
// @namespace   org.binota.scripts.bangumi.bhc
// @description Generate Github-like Homepage Calendar in Bangumi
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\//
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==

const COLOURS = ['#CCC', '#FFAFB7', '#FE8A95', '#E26470', '#BB4956'];
const SHAPE = '▩';
const WEEKNAME = ['日', '月', '火', '水', '木', '金', '土'];
const FONT_COLOUR = '#777';
const DOMAIN = `${window.location.protocol}//${window.location.hostname}`;
const USER = (function() {
  var h = document.querySelector('.idBadgerNeue .avatar');
  if(typeof h === "undefined") return;
  return h.href.toString().match(/\/user\/(.+)/)[1];
})();
const STORAGE_PREFIX = 'binota_bhc_';
const NSECS_IN_DAY = 1000 * 60 * 60 * 24;
const DAYS_IN_YEAR = 365;
const DAYS_IN_WEEK = 7;
var formhash = '';
  
var $ = function() { return document.querySelector(arguments[0]); }
var get = function(url, sync = true) {
  var req = GM_xmlhttpRequest({
    method: "GET",
    url: `${DOMAIN}${url}`,
    synchronous: sync
  });
  
  return req.responseText;
}
var post = function(url, data = {}, sync = true) {
  postdata = [];
  for(i in data) {
    postdata.push(`${encodeURI(i)}=${encodeURI(data[i])}`);
  }
  var req = GM_xmlhttpRequest({
    method: "POST",
    url: `${DOMAIN}${url}`,
    data: postdata.join('&'),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    synchronous: sync
  });
  
  return req.responseText;
}
var chiiLib = unsafeWindow.chiiLib;

var Calendar = function(config = {}) {
  this._config = {
    'colours': (typeof config.colour === 'undefined') ? COLOURS : config.colours,
    'shape': (typeof config.shape === 'undefined') ? SHAPE : config.shape,
    'weekname': (typeof config.weekname === 'undefined') ? WEEKNAME : config.weekname,
    'font_colour': (typeof config.font_colour === 'undefined') ? FONT_COLOUR : config.font_colour,
    'show_weekday': (typeof config.show_weekday === 'undefined') ? true : config.show_weekday
  };

  this._data_raw = {};
  this._data = [];
  this._result = [];
  this._bbcode = '';

  this._max_count = 0;
  this._min_count = Number.MAX_SAFE_INTEGER;
  this._count_q = 0;
  this._longest_streak = 0;
  this._current_streak = 0;
  this._total_count = 0;
  
  this.data = function(date, value, rewrite = false) {
    date = date.replace(/\-/g, '/');
    if(typeof value === 'undefined') return this._data_raw[date];
    if(typeof this._data_raw[date] === 'undefined') this._data_raw[date] = 0;
    if(rewrite) {
      this._data_raw[date] = value;
    } else {
      this._data_raw[date] += value;
    }
    return this._data_raw[date];
  }

  this.fixData = function() {
    this._data = [];
    var now = new Date();
    for(let i = DAYS_IN_YEAR; i >= 0; i--) {
      var d = new Date(now - (NSECS_IN_DAY * i));
      var dt = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      var c = (typeof this._data_raw[dt] === 'undefined') ? 0 : this._data_raw[dt];
      this._data.push({date: dt, count: c});
    }
    console.log(this._data);
  }
  
  this.generate = function(force = false) {
    if(!force && this._result.length) return this._bbcode;
    this.fixData();

    var row = 0;
    var d;
    
    // Make first row
    this._result[row] = [];
    // Prepend space if first date in data is not Saturday
    d = new Date(this._data[0].date);
    if(d.getDay() != 0) {
      for(let i = 0; i < d.getDay(); i++) {
        this._result[row].push(-1);
      }
    }
    
    // Make rows
    for(let i of this._data) {
      d = new Date(i.date);
      if(d.getDay() == 0) this._result[++row] = [];
      this._result[row].push(i.count);
      this._total_count += i.count;
      if(i.count > 0) {
        this._current_streak++;
        if(i.count > this._max_count) this._max_count = i.count;
        if(i.count < this._min_count) this._min_count = i.count;
      } else {
        if(this._current_streak > this._longest_streak) this._longest_streak = this._current_streak;
        this._current_streak = 0;
      }
    }
    
    var dcolour = '';
    // Make it colourful
    for(let week in this._result) {
      for(let day in this._result[week]) {
        dcolour = this.getColour(this._result[week][day]);
        if(dcolour == this._config.colours[0]) {
          if(this._config.show_weekday) this._result[week][day] = this._config.shape;
          continue;
        }
        this._result[week][day] = '[color=' + dcolour + ']' + this._config.shape + '[/color]';
      }
    }
    
    // Make BBCode
    this._bbcode += `[color=${this._config.colours[0]}]`;
    for(let i = 0; i < DAYS_IN_WEEK; i++) {
      this._bbcode += `[color=${this._config.font_colour}]${this._config.weekname[i]}[/color] `;
      for(let week in this._result) {
        if(typeof this._result[week][i] === "undefined") this._bbcode += `[color=transparent]${this._config.shape}[/color]`;
        else this._bbcode += this._result[week][i];
      }
      this._bbcode += "\n";
    }
    this._bbcode += '[/color]';
    console.log(this._result);
    // Append Colour Refer
    this._bbcode += `[color=transparent]` + this._config.shape.repeat(this._result.length - 11) + '[/color]';
    this._bbcode += `Less [color=${this._config.colours[0]}]${this._config.shape}[/color][color=${this._config.colours[1]}]${this._config.shape}[/color][color=${this._config.colours[2]}]${this._config.shape}[/color][color=${this._config.colours[3]}]${this._config.shape}[/color][color=${this._config.colours[4]}]${this._config.shape}[/color] More\n`;
    // Append Analytic
    var dayt1 = (this._longest_streak > 1) ? 'days' : 'day';
    var dayt2 = (this._current_streak > 1) ? 'days' : 'day';
    this._bbcode += `[size=11][color=${this._config.colour}]Activities in the Last Year: ${this._total_count} | Longest Streak: ${this._longest_streak} ${dayt1} | Current Streak: ${this._current_streak} ${dayt2} | Max a Day: ${this._max_count}[/color][/size]`;
    
    console.log(this._count_q);
    console.log(this._max_count);
    console.log(this._min_count);
    
    return this._bbcode;
  }

  this.getColour = function(count) {
    if(count < 0) return 'transparent';
    if(count == 0) return this._config.colours[0];
    if(this._count_q == 0) this._count_q = (this._max_count - this._min_count) / 5;
    var retval = this._config.colours[1];
    if(count >= (this._min_count + this._count_q * 2)) retval = this._config.colours[2];
    if(count >= (this._min_count + this._count_q * 3)) retval = this._config.colours[3];
    if(count >= (this._min_count + this._count_q * 4)) retval = this._config.colours[4];
    return retval;
  }
}
var Bangumi = function() {
  return {
    User: {
      Timeline: {
        Get: function(page = 1, type = 'all') {
          console.log(`Timeline Page: ${page}`);
          var html = get(`/user/${USER}/timeline?type=${type}&page=${page}&ajax=1`).trim();
          if(html.length <= 0) return false;
          var nodes = html.match(/<h4 class="Header">.+?<\/h4>\s+<ul>[\s\S]+?<\/ul>/gm);
          var retval = {};
          var now = new Date();
          for(let node of nodes) {
            var date = (function() {
              var date = node.match(/<h4 class="Header">(.+?)</)[1].replace(/\-/g, '/');
              if(date == '今天') return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
              if(date == '昨天') {
                let d = new Date(now - NSECS_IN_DAY);
                return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
              }
              return date;
            })();
            
            // parse timelines
            var timelines = (function() {
              var list = node.match(/<li id="tm[\s\S]+?<\/li>/gm);
              var retval = [];
              for(let i of list) {
                var matches = i.match(/<li id="tml_(\d+).+?>[\s\S]*?<span.+?>([\s\S]+)<\/span>[\s\S]+?<\/li>/m);
                retval.push({id: matches[1], timeline: matches[2].replace(/<.+?>/g, '').trim()});
              }
              
              return retval;
            })();
            retval[date] = timelines;
          }
          return retval;
        }
      },
      Wiki: {
        Get: function(page = 1, type = '') {
          console.log(`Wiki, Page: ${page}`);
          var type_url = type ? `/${type}` : '';
          var html = get(`/user/${USER}/wiki${type_url}?page=${page}`);
          if(html.length <= 0) return false;
          
          var list = html.match(/<li class="line.+?>[\s\S]+?<\/li>/gm);
          if(!list) return {};

          var retval = {};
          for(let i of list) {
            var matches = i.match(/ey">(\d{4}\-\d{1,2}\-\d{1,2}) \d{2}:\d{2}<[\s\S]+?<h6>([\s\S]+?)<\/h6>/m);
            var date = matches[1].replace(/\-/g, '/');
            var data = matches[2].replace(/<.+?>/g, '').replace(/\n\s+/, ' ').trim();
            if(typeof retval[date] === 'undefined') retval[date] = [];
            retval[date].push(data);
          }
          return retval;
        }
      },
      Settings: {
        Get: function() {
          var html = get('/settings');
          var retval = {};
          formhash = html.match(/formhash" value="(.*?)"/)[1];

          retval.nickname = html.match(/nickname".+?value="(.*?)"/)[1].trim();
          retval.sign = html.match(/sign_input".+?value="(.*?)"/)[1].trim();
          retval.timezone = html.match(/value="(\d*?)" selected/)[1].trim();
          retval.website = html.match(/newsite".+?value="(.*?)"/)[1].trim();
          retval.bio = html.match(/<textarea id="newbio".+?>([\s\S]*)<\/te/m)[1].trim();
          
          retval.network = {};
          retval.network.psn = html.match(/service\[1\]".+?value="(.*?)"/)[1].trim();
          retval.network.xbox = html.match(/service\[2\]".+?value="(.*?)"/)[1].trim();
          retval.network.friendcode = html.match(/service\[3\]".+?value="(.*?)"/)[1].trim();
          retval.network.steam = html.match(/service\[4\]".+?value="(.*?)"/)[1].trim();
          retval.network.battle = html.match(/service\[5\]".+?value="(.*?)"/)[1].trim();
          retval.network.pixiv = html.match(/service\[6\]".+?value="(.*?)"/)[1].trim();
          retval.network.github = html.match(/service\[7\]".+?value="(.*?)"/)[1].trim();
          retval.network.twitter = html.match(/service\[8\]".+?value="(.*?)"/)[1].trim();
          retval.network.instagram = html.match(/service\[9\]".+?value="(.*?)"/)[1].trim();
          return retval;
        },
        Setting: function(settings) {
          console.log(settings);
          var postData = {
            formhash: formhash,
            nickname: settings.nickname,
            sign_input: settings.sign,
            timeoffsetnew: settings.timezone,
            newsite: settings.website,
            newbio: settings.bio,
            "network_service[1]": settings.network.psn,
            "network_service[2]": settings.network.xbox,
            "network_service[3]": settings.network.friendcode,
            "network_service[4]": settings.network.steam,
            "network_service[5]": settings.network.battle,
            "network_service[6]": settings.network.pixiv,
            "network_service[7]": settings.network.github,
            "network_service[8]": settings.network.twitter,
            "network_service[9]": settings.network.instagram
          };
          console.log(postData);
          var result = post('/settings', postData);
          return;
        }
      }
    }
  };
}
var Storage = function(driver) {
  this._storage = driver;
  
  this.set = function(key, value) {
    this._storage.setItem(`${STORAGE_PREFIX}${key}`, value);
    return value;
  }
  
  this.get = function(key) {
    return this._storage.getItem(`${STORAGE_PREFIX}${key}`);
  }
  
  this.remove = function(key) {
    this._storage.removeItem(`${STORAGE_PREFIX}${key}`);
    return key;
  }
}
var Application = function() {
  if(typeof USER === "undefined") return;
  
  var storage = new Storage(localStorage);
  var client = new Bangumi();
  var tmlCalendar = new Calendar();
  var wikiCalendar = new Calendar();

  //Check Last Update:
  var lastUpdate = parseInt(storage.get('lastUpdate'));
  var now = new Date();

  if(!lastUpdate) {
    storage.set('firstLock', 1);
  }
  
  var firstLock = storage.get('firstLock');
  if(firstLock == 1) {
    let page = get(`/user/${USER}`);
    let matches = page.match(/#backup_(.+?)\[\/backup\]/);
    if(matches) {
      let backup = matches[1];
      let backup_tml, backup_wiki;
      [backup_tml, backup_wiki, lastUpdate] = matches[1].split('|');
      lastUpdate = parseInt(lastUpdate);
      storage.set('cache_tml', backup_tml);
      storage.set('cache_wiki', cache_wiki);
      storage.set('firstLock', -1);
      firstLock = -1;
    } else {
      firstLock = 2;
    }
  }
  if(firstLock == 2) {
    chiiLib.ukagaka.presentSpeech('看样子你是第一次运行 BHC 呢...<br>要开始统计数据吗？<br>统计数据会需要一段时间，可能会需要数分钟至数十分钟<br><a href="#" onclick="(function() { localStorage.setItem(\'${STORAGE_PREFIX}firstLock\', -1); })()"◆ 确定运行</a>');
  }
  
  var lock = storage.get('lock');
  if(lock) {
    $('#footer .grey').innerHTML += ` - BHC 已锁定 (${now.getMonth() + 1}/${now.getDate()} ${now.toLocaleTimeString()}，
<a href="#" onclick="(function() {if(confirm(&quot;请确认是否有其它页面正在运行 BHC ，\\n确认完毕请点击确认&quot;))localStorage.removeItem(&quot;${STORAGE_PREFIX}lock&quot;);window.location.reload();})()">点击此处强制解锁并刷新页面</a>`
    return;
  }
  
  if(lastUpdate && (new Date(lastUpdate)).toDateString() === now.toDateString()) return;

  storage.set('lock', now.getTime());
  
  if(lastUpdate) {
    let cache_tml = JSON.parse(storage.get('cache_tml'));
    let cache_wiki = JSON.parse(storage.get('cache_wiki'));
    // remove the data that stored before lastUpdate
    let lu = new Date(lastUpdate);
    // count days
    for(let i = lu.getTime(); i <= now.getTime(); i += NSECS_IN_DAY) {
      let td = new Date(i);
      cache_tml[`${td.getFullYear()}/${td.getMonth() + 1}/${td.getDate()}`] = 0;
      cache_wiki[`${td.getFullYear()}/${td.getMonth() + 1}/${td.getDate()}`] = 0;
    }
    
    tmlCalendar._data_raw = cache_tml;
    wikiCalendar._data_raw = cache_wiki;
  }
  
  var checkBreakPoint = (lastUpdate) ? (new Date(lastUpdate - NSECS_IN_DAY)) : (new Date(now.getTime() - (NSECS_IN_DAY * (DAYS_IN_YEAR + 1))));
  
  //Check
  var check = function(get, calendar, tag) {
    for(let i = 1; ; i++) {
      var page = get(i);
      if(!page) return;
      console.log(page);
      chiiLib.ukagaka.presentSpeech(tag`${i}`);
      for(let j in page) {
        calendar.data(j, page[j].length);
        let checkDate = new Date(j);
        if(checkDate.getTime() <= checkBreakPoint.getTime()) return;
      }
    }
  }

  check(function(i) { return client.User.Timeline.Get(i); },
        tmlCalendar,
        function(string, ...values) { return `正在为你更新 BHC 统计图，<br>这可能会需要一点时间...<br>正在统计时空管理局的数据，目前在统计第 ${values[0]} 页...` });
  check(function(i) { return client.User.Wiki.Get(i); },
        wikiCalendar,
        function(strings, ...values) { return `正在为你更新 BHC 统计图，<br>这可能会需要一点时间...<br>正在统计你的维基编辑记录，目前正在统计第 ${values[0]} 页...` });

  chiiLib.ukagaka.presentSpeech('统计完成...<br>正在为你生成统计图...');
  //Generate Calendar
  var newTmlCalendar = tmlCalendar.generate();
  var newWikiCalendar = wikiCalendar.generate();
  
  //Update Last Update
  storage.set('lastUpdate', now.getTime());
  
  //Write Cache
  storage.set('cache_tml', JSON.stringify(tmlCalendar._data_raw));
  storage.set('cache_wiki', JSON.stringify(wikiCalendar._data_raw));
  
  //Generate Backup Script
  var backup_tml = storage.get('cache_tml');
  var backup_wiki = storage.get('cache_wiki');
  var backup_script = `[buckup][url=${DOMAIN}/user/${USER}#backup_${backup_tml}|${backup_wiki}|${now.getTime()}] [/url][/buckup]`;

  //Update bio
  chiiLib.ukagaka.presentSpeech('正在为你更新个人主页...');
  var settings = client.User.Settings.Get();
  var realbio = settings.bio.replace(/\[color=transparent\]\[bhc\]\[\/color\][\s\S]+\[\/bhc\]\[\/color\]/m, '');
  settings.bio = `${realbio}
[color=transparent][bhc][/color]
[size=18]我的 Bangumi 統計圖[/size] [size=10]（最後更新：${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}）[/size]
[size=16]Timeline 統計圖：[/size]
${newTmlCalendar}

[size=16]Wiki 編輯統計圖：[/size]
${newWikiCalendar}[color=transparent][code]${backup_script}//[/code]Powered by [url=${DOMAIN}/group/topic/123456]Bangumi-Homepage-Calendar[/url][/bhc][/color]`;
  client.User.Settings.Setting(settings);
  chiiLib.ukagaka.presentSpeech(`更新好了，<a href="${DOMAIN}/user/{$USER}">前往个人主页看看吧</a>！`);
  storage.remove('lock');
}

try {
  var BHC = new Application();
} catch (e) {
  console.log(e);
}

