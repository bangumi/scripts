// ==UserScript==
// @name        Bangumi Homepage Calendar
// @namespace   org.binota.scripts.bangumi.bhc
// @description Generate Github-like Homepage Calendar in Bangumi
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)/
// @version     0.1.3
// @grant       none
// ==/UserScript==
/*jshint esnext: true*/
/*
localStorage.setItem('binota_bhc_binota_lastUpdate', (new Date( (new Date()).getTime() )) - (1000 * 60 * 60 * 24));
*/
"use strict";

const COLOURS = ['#CCC', '#FFAFB7', '#FE8A95', '#E26470', '#BB4956'];
const SHAPE = '■';
const SHAPE_SIZE = '19';
const WEEKNAME_JAPANESE = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKNAME_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];
const FONT_COLOUR = '#777';
const DOMAIN = `${window.location.protocol}//${window.location.hostname}`;
const USER = (function() {
  var h = document.querySelector('.idBadgerNeue .avatar');
  if(typeof h === "undefined") return;
  return h.href.match(/\/user\/(.+)/)[1];
})();
const STORAGE_PREFIX = `binota_bhc_${USER}_`;
const NSECS_IN_DAY = 1000 * 60 * 60 * 24;
const DAYS_IN_YEAR = 365;
const DAYS_IN_WEEK = 7;
const LOC_BIO = '0';
const LOC_BLOG = '1';
const DEFAULT_CONFIG = {
      colours: COLOURS,
      show_weekname: 'japanese',
      show_weekday: true,
      show_wiki: true,
      show_tml: true,
      shape: SHAPE,
      save_loc: LOC_BIO,
      shape_size: SHAPE_SIZE,
      font_colour: FONT_COLOUR
    };
var formhash = '';
  
var $ = function() { return document.querySelector(arguments[0]); };
var get = url => fetch(url, { credentials: 'same-origin' }).then(response => response.text());
var post = function() {
  var url = arguments[0];
  var data = (typeof arguments[1] === 'undefined') ? {} : arguments[1];
  var sync = (typeof arguments[2] === 'undefined') ? true : arguments[2];
  var postdata = [];
  for(let i in data) {
    postdata.push(`${encodeURI(i)}=${encodeURI(data[i])}`);
  }
  var req = new XMLHttpRequest();
  req.open('POST', url, false);
  req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  req.send(postdata.join('&'));
  
  if(req.status === 200) return req.responseText;
};

var wait = time => new Promise((resolve, reject) => setTimeout(resolve, time));

var Calendar = function() {
  var config = (typeof arguments[0] === 'undefined') ? {} : arguments[0];
  this._config = {
    'colours': (typeof config.colours === 'undefined') ? COLOURS : config.colours,
    'shape': (typeof config.shape === 'undefined') ? SHAPE : config.shape,
    'shape_size': (typeof config.shape === 'undefined') ? SHAPE_SIZE : config.shape_size,
    'weekname': (typeof config.weekname === 'undefined') ? WEEKNAME_JAPANESE : config.weekname,
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
  
  this.data = function() {
    var date = arguments[0];
    var value = arguments[1];
    var rewrite = (typeof rewrite === 'undefined') ? false : rewrite;
    date = date.replace(/\-/g, '/');
    if(typeof value === 'undefined') return this._data_raw[date];
    if(typeof this._data_raw[date] === 'undefined') this._data_raw[date] = 0;
    if(rewrite) {
      this._data_raw[date] = value;
    } else {
      this._data_raw[date] += value;
    }
    return this._data_raw[date];
  };

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
  };
  
  this.generate = function() {
    var force = (typeof arguments[0] === 'undefined') ? false : arguments[0];
    if(!force && this._result.length) return this._bbcode;
    this.fixData();

    var row = 0;
    var d;
    
    // Make first row
    this._result[row] = [];
    // Prepend space if first date in data is not Saturday
    d = new Date(this._data[0].date);
    if(d.getDay() !== 0) {
      for(let i = 0; i < d.getDay(); i++) {
        this._result[row].push(-1);
      }
    }
    
    // Make rows
    for(let i of this._data) {
      d = new Date(i.date);
      if(d.getDay() === 0) this._result[++row] = [];
      this._result[row].push(i.count);
      this._total_count += i.count;
      if(i.count > 0) {
        this._current_streak++;
        if(i.count > this._max_count) this._max_count = i.count;
        if(i.count < this._min_count) this._min_count = i.count;
        if(this._current_streak > this._longest_streak) this._longest_streak = this._current_streak;
      } else {
        this._current_streak = 0;
      }
    }
    
    var dcolour = '';
    // Make it colourful
    for(let week in this._result) {
      for(let day in this._result[week]) {
        dcolour = this.getColour(this._result[week][day]);
        if(dcolour == this._config.colours[0]) {
          this._result[week][day] = this._config.shape;
          continue;
        }
        this._result[week][day] = '[color=' + dcolour + ']' + this._config.shape + '[/color]';
      }
    }
    
    // Make BBCode
    this._bbcode += `[color=${this._config.colours[0]}]`;
    for(let i = 0; i < DAYS_IN_WEEK; i++) {
      if(this._config.show_weekday) this._bbcode += `[color=${this._config.font_colour}]${this._config.weekname[i]}[/color] `;
      this._bbcode += `[size=${this._config.shape_size}]`;
      for(let week in this._result) {
        if(typeof this._result[week][i] === "undefined") this._bbcode += `[color=transparent]${this._config.shape}[/color]`;
        else this._bbcode += this._result[week][i];
      }
      this._bbcode += "[/size]\n";
    }
    this._bbcode += '[/color]';
    // Append Colour Refer
    this._bbcode += `[color=transparent][size=${this._config.shape_size}]` + this._config.shape.repeat(this._result.length - 9) + '[/size][/color]';
    this._bbcode += `Less [size=${this._config.shape_size}][color=${this._config.colours[0]}]${this._config.shape}[/color][color=${this._config.colours[1]}]${this._config.shape}[/color][color=${this._config.colours[2]}]${this._config.shape}[/color][color=${this._config.colours[3]}]${this._config.shape}[/color][color=${this._config.colours[4]}]${this._config.shape}[/color][/size] More\n`;
    // Append Analytic
    var dayt1 = (this._longest_streak > 1) ? 'days' : 'day';
    var dayt2 = (this._current_streak > 1) ? 'days' : 'day';
    this._bbcode += `[color=${this._config.colour}]Activities in the Last Year: ${this._total_count} | Longest Streak: ${this._longest_streak} ${dayt1} | Current Streak: ${this._current_streak} ${dayt2} | Max a Day: ${this._max_count}[/color]`;
    
    return this._bbcode;
  };

  this.getColour = function(count) {
    if(count < 0) return 'transparent';
    if(count === 0) return this._config.colours[0];
    if(this._count_q === 0) this._count_q = (this._max_count - this._min_count) / 5;
    var retval = this._config.colours[1];
    if(count >= (this._min_count + this._count_q * 2)) retval = this._config.colours[2];
    if(count >= (this._min_count + this._count_q * 3)) retval = this._config.colours[3];
    if(count >= (this._min_count + this._count_q * 4)) retval = this._config.colours[4];
    return retval;
  };
};
var Bangumi = function() {
  return {
    User: {
      Timeline: {
        Get: async function() {
          var page = (typeof arguments[0] === 'undefined') ? 1 : arguments[0];
          var type = (typeof arguments[1] === 'undefined') ? 'all' : arguments[2];
          console.log(`Timeline Page: ${page}`);
          var html = (await get(`/user/${USER}/timeline?type=${type}&page=${page}&ajax=1`)).trim();
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
        Get: async function() {
          var page = (typeof arguments[0] === 'undefined') ? 1 : arguments[0];
          var type = (typeof arguments[1] === 'undefined') ? '' : arguments[2];
          console.log(`Wiki, Page: ${page}`);
          var type_url = type ? `/${type}` : '';
          var html = (await get(`/user/${USER}/wiki${type_url}?page=${page}`)).trim();
          if(html.length <= 0) return false;
          
          var list = html.match(/<li class="line.+?>[\s\S]+?<\/li>/gm);
          if(!list) return false;

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
      Blog: {
        Get: async function(id) {
          var html = await get(`/blog/${id}/edit`);
          var retval = {};
          try {
            retval.formhash = html.match(/formhash" value="(.+?)"/)[1];
            retval.title = html.match(/tpc_title" name="title" class="inputtext" type="text" value="(.+?)"/)[1];
            retval.content = html.match(/editTopicForm'\);">([\s\S]+?)<\/text/m)[1];
            retval.tags = html.match(/tags" class="inputtext" type="text" style="width:450px;" value="(.*?)"/)[1];
            retval.public = html.match(/public" type="radio" checked="true" value="(\d)/)[1];
            return retval;
          } catch(e) {
            return {};
          }
        },
        Write: function(id, blog) {
          blog.submit = '加上去';
          post(`/blog/${id}/edit`, blog);
        }
      },
      Settings: {
        Get: async function() {
          var html = await get('/settings');
          var retval = {};
          formhash = html.match(/formhash" value="(.*?)"/)[1];

          retval.nickname = html.match(/nickname".+?value="(.*?)"/)[1].trim();
          retval.sign = html.match(/sign_input".+?value="(.*?)"/)[1].trim();
          retval.timezone = html.match(/value="([^"]+)" selected/)[1].trim();
          retval.website = html.match(/newsite".+?value="(.*?)"/)[1].trim();
          retval.bio = html.match(/<textarea id="newbio".+?>([\s\S]*)<\/te/m)[1].trim();
          
          retval.network = {};
          let matchMap = {
            1: 'psn',
            2: 'xbox',
            3: 'friendcode',
            4: 'steam',
            5: 'battle',
            6: 'pixiv',
            7: 'github',
            8: 'twitter',
            9: 'instagram',
            11: 'ns'
          };
          for (let i in matchMap) {
            retval.network[matchMap[i]] = (html.match(new RegExp(`service\\[${i}\\]".+?value="(.*?)"`)) || [undefined, ''])[1].trim();
          }
          return retval;
        },
        Setting: function(settings) {
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
            "network_service[9]": settings.network.instagram,
            "network_service[11]": settings.network.ns
          };
          var result = post('/settings', postData);
          return;
        }
      }
    },
    Ukagaka: {
      Say: function(str) {
        chiiLib.ukagaka.presentSpeech(str);
      }
    }
  };
};
var Storage = function(driver) {
  this._storage = driver;
  
  this.set = function(key, value) {
    this._storage.setItem(`${STORAGE_PREFIX}${key}`, value);
    return value;
  };
  
  this.get = function(key) {
    return this._storage.getItem(`${STORAGE_PREFIX}${key}`);
  };
  
  this.remove = function(key) {
    this._storage.removeItem(`${STORAGE_PREFIX}${key}`);
    return key;
  };
};
var Application = async function() {
  if(typeof USER === "undefined") return;
  
  var storage = new Storage(localStorage);
  var client = new Bangumi();

  var config = (function() {
    var tmp = storage.get('config');
    return (tmp) ? JSON.parse(tmp) : DEFAULT_CONFIG;
  })();
  var tmlCalendar = new Calendar((config) ? config : {});
  var wikiCalendar = new Calendar((config) ? config : {});

  var lastUpdate = parseInt(storage.get('lastUpdate'));
  var now = new Date();

  if(!lastUpdate) {
    //first run

    //check user page for backup
    var page = await get(`/user/${USER}`);
    var matches = page.match(/#bhc_backup_(.+?)"/);
    if(matches) {
      //restore backup and continue
      let backup = matches[1].replace(/&quot;/g, '"').split('|');
      let backup_tmp = backup[0],
          backup_wiki = backup[1];
      lastUpdate = parseInt(backup[2]);
      storage.set('lastUpdate', lastUpdate);
      storage.set('cache_tml', backup_tml);
      storage.set('cache_wiki', backup_wiki);
      storage.set('firstRun', now.getTime());
    }
  }
  
  var lock = storage.get('lock');
  //write lock notice
  if(lock) {
    $('#footer .grey').innerHTML += ` - BHC 已锁定 (${now.getMonth() + 1}/${now.getDate()} ${now.toLocaleTimeString()}，
<a href="#" onclick="(function() {if(confirm(&quot;请确认是否有其它页面正在运行 BHC ，\\n确认完毕请点击确认&quot;))localStorage.removeItem(&quot;${STORAGE_PREFIX}lock&quot;);window.location.reload();})()">点击此处强制解锁并刷新页面</a>`;
    return;
  }
  
  //if there is no need to update
  if(lastUpdate && (new Date(lastUpdate)).toDateString() === now.toDateString()) return;

  storage.set('lock', now.getTime());
  
  if(lastUpdate) {
    // check cache
    try {
      let cache_tml = JSON.parse(storage.get('cache_tml'));
      let cache_wiki = JSON.parse(storage.get('cache_wiki'));
      // remove the data that stored before lastUpdate only
      let lu = new Date(lastUpdate);
      // count days
      for(let i = lu.getTime(); i <= now.getTime(); i += NSECS_IN_DAY) {
        let td = new Date(i);
        cache_tml[`${td.getFullYear()}/${td.getMonth() + 1}/${td.getDate()}`] = 0;
        cache_wiki[`${td.getFullYear()}/${td.getMonth() + 1}/${td.getDate()}`] = 0;
      }

      tmlCalendar._data_raw = cache_tml;
      wikiCalendar._data_raw = cache_wiki;
    } catch (e) {
    }
  }
  
  var checkBreakPoint = (lastUpdate) ? (new Date(lastUpdate - NSECS_IN_DAY)) : (new Date(now.getTime() - (NSECS_IN_DAY * (DAYS_IN_YEAR + 1))));

  //Check
  var getPage = async function(get, calendar, tag) {
    for (let i = 1; ; i++) {
      // wait some time let Ukagaka show the message completely;
      var page = await Promise.all([get(i), wait(200)]).then(([resultA, noResult]) => resultA);
      if(!page) return;
      client.Ukagaka.Say(tag`${i}`);
      for(let j in page) {
        calendar.data(j, page[j].length);
        if((new Date(j)).getTime() <= checkBreakPoint.getTime()) return;
      }
    }
  };

  var newTmlCalendar, newWikiCalendar;
  if(config.show_tml === true) {
    await getPage(function(i) { return client.User.Timeline.Get(i); },
            tmlCalendar,
            function(string, values) { return `正在为你更新 BHC 统计图，<br>这可能会需要一点时间...<br>正在统计时空管理局的数据，目前在统计第 ${values} 页...`; });
    newTmlCalendar = `[size=16]Timeline 统计图[/size]
${tmlCalendar.generate()}
`;
    storage.set(`cache_tml`, JSON.stringify(tmlCalendar._data_raw));
  } else {
    newTmlCalendar = '';
  }
  if(config.show_wiki === true) {
    await getPage(function(i) { return client.User.Wiki.Get(i); },
            wikiCalendar,
            function(strings, values) { return `正在为你更新 BHC 统计图，<br>这可能会需要一点时间...<br>正在统计你的维基编辑记录，目前正在统计第 ${values} 页...`; });
    newWikiCalendar = `[size=16]Wiki 编辑统计图[/size]
${wikiCalendar.generate()}
`;
    storage.set(`cache_wiki`, JSON.stringify(wikiCalendar._data_raw));
  } else {
    newWikiCalendar = '';
  }

  //Update Last Update
  storage.set('lastUpdate', now.getTime());
  
  //Generate Backup Script
  var backup_tml = storage.get('cache_tml');
  var backup_wiki = storage.get('cache_wiki');
  var backup_script = `[url=${DOMAIN}/user/${USER}#bhc_backup_${backup_tml}|${backup_wiki}|${now.getTime()}]備份數據[/url]`;

  var bhc_content = `[color=transparent][bhc][/color]
[size=18]我的 Bangumi 統計圖[/size] [size=10]（最後更新：${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.toLocaleTimeString()}）[/size]
${newTmlCalendar}${newWikiCalendar}[color=transparent][color=${FONT_COLOUR}]Powered by [url=${DOMAIN}/group/topic/337624]Bangumi-Homepage-Calendar[/url] | ${backup_script}[/color][/bhc][/color]`;

  switch(config.save_loc) {
    case LOC_BIO:
      //Update Homepage
      client.Ukagaka.Say('正在为你更新个人主页...');
      var settings = await client.User.Settings.Get();
      var realbio = settings.bio.replace(/\[color=transparent\]\[bhc\]\[\/color\][\s\S]+\[\/bhc\]\[\/color\]/m, '').trim();
      settings.bio = `${realbio}\n${bhc_content}`;
      client.User.Settings.Setting(settings);
      client.Ukagaka.Say(`更新好了，<a href="${DOMAIN}/user/${USER}">前往个人主页看看吧</a>！`);
      break;
    case LOC_BLOG:
      var blog = await client.User.Blog.Get(config.blog_id);
      var realblog = blog.content.replace(/\[color=transparent\]\[bhc\]\[\/color\][\s\S]+\[\/bhc\]\[\/color\]/m, '').trim();
      blog.content = `${realblog}\n${bhc_content}`;
      client.User.Blog.Write(config.blog_id, blog);
      client.Ukagaka.Say(`更新好了，<a href="${DOMAIN}/blog/${config.blog_id}">前往日志页看看吧</a>！`);
  }
  storage.remove('lock');
};

var Configure = function() {
  var that = this;
  var storage = new Storage(localStorage);
  var config = (function() {
    var tmp = storage.get('config');
    return (tmp) ? JSON.parse(tmp) : DEFAULT_CONFIG;
  })();

  var configBtn = document.createElement('a');
  configBtn.classList.add('btnGraySmall');
  configBtn.href = '#bhc_config';
  configBtn.onclick = function() {
    that.showInterface();
  };

  configBtn.innerHTML = 'BHC 统计图设置';
  $(".network_service").appendChild(document.createElement('li')).appendChild(configBtn);

  var regenBtn = document.createElement('a');
  regenBtn.classList.add('btnGraySmall');
  regenBtn.href = '#bhc_config';
  regenBtn.onclick = function() {
    that.reGenerate();
  };

  regenBtn.innerHTML = '重绘 BHC 统计图';
  $(".network_service").appendChild(document.createElement('li')).appendChild(regenBtn);

  var configInterface = document.createElement('div');
  configInterface.id = "bhc-config";
  configInterface.classList.add('menu_inner');
  configInterface.style.cssText = "display:none;";
  configInterface.innerHTML = `
    <div style="font-size: 16px; font-weight: bold;">BHC 统计图设置</div>
    <table align="center" width="100%" cellspacing="0" cellpadding="5" style="border-collapse: separate; border-spacing: 10px;">
      <tbody>
        <tr>
          <td valign="top" width="20%">
            <label for="save_loc">保存位置</label>
          </td>
          <td>
            <select class="form" name="save_loc">
              <option${config.save_loc === LOC_BIO ? ' selected' : ''} value="${LOC_BIO}">保存在个人介绍里</option>
              <option${config.save_loc === LOC_BLOG ? ' selected' : ''} value="${LOC_BLOG}">保存在日志里</option>
            </select>
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="blog_id">日志 ID</label>
          </td>
          <td>
            <input class="inputtext" type="number" name="blog_id" value="${config.blog_id}">
            <p class="tip">请填写 ${DOMAIN}/blog/ 后面的数字</p>
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="show_weekname">显示星期名称</label>
          </td>
          <td>
            <select class="form" name="show_weekname">
              <option${config.show_weekname === 'none' ? ' selected' : ''} value="none">不显示</option>
              <option${config.show_weekname === 'chinese' ? ' selected' : ''} value="chinese">显示中文</option>
              <option${config.show_weekname === 'japanese' ? ' selected' : ''} value="japanese">显示日文</option>
            </select>
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="show_wiki">显示 Wiki 统计图</label>
          </td>
          <td>
            <select class="form" name="show_wiki">
              <option${config.show_wiki === false ? ' selected' : ''} value="false">不显示</option>
              <option${config.show_wiki === true ? ' selected' : ''} value="true">显示</option>
            </select>
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="show_tml">显示时空管理局统计图</label>
          </td>
          <td>
            <select class="form" name="show_tml">
              <option${config.show_tml === false ? ' selected' : ''} value="false">不显示</option>
              <option${config.show_tml === true ? ' selected' : ''} value="true">显示</option>
            </select>
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="shape">绘制图形</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="shape" value="${config.shape}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="shape_size">图形大小</label>
          </td>
          <td>
            <input class="inputtext" type="number" name="shape_size" value="${config.shape_size}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="font_colour">字体色彩</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="font_colour" value="${config.font_colour}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="colour_0">图形色彩 0</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="colour_0" value="${config.colours[0]}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="colour_1">图形色彩 1</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="colour_1" value="${config.colours[1]}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="colour_2">图形色彩 2</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="colour_2" value="${config.colours[2]}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="colour_3">图形色彩 3</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="colour_3" value="${config.colours[3]}">
          </td>
        </tr>

        <tr>
          <td valign="top">
            <label for="colour_4">图形色彩 4</label>
          </td>
          <td>
            <input class="inputtext" type="text" name="colour_4" value="${config.colours[4]}">
          </td>
        </tr>
      </tbody>
    </table>
`;
  var saveBtn = document.createElement('a');
  saveBtn.classList.add('chiiBtn');
  saveBtn.href = '#bhc_save';
  saveBtn.id = 'bhc_config_save';
  saveBtn.innerHTML = '保存设置';
  saveBtn.onclick = function() {
    var config = {
      colours: [
        $('input[name="colour_0"]').value,
        $('input[name="colour_1"]').value,
        $('input[name="colour_2"]').value,
        $('input[name="colour_3"]').value,
        $('input[name="colour_4"]').value
      ],
      show_weekname: $('select[name="show_weekname"]').value,
      show_wiki: $('select[name="show_wiki"]').value === 'true' ? true : false,
      show_tml: $('select[name="show_tml"]').value === 'true' ? true : false,
      shape: $('input[name="shape"]').value,
      save_loc: $('select[name="save_loc"]').value,
      blog_id: $('input[name="blog_id"]').value,
      shape_size: $('input[name="shape_size"]').value,
      font_colour: $('input[name="font_colour"]').value
    };
    console.log(config);
    
    that.saveConfig(config);
  };
  configInterface.appendChild(saveBtn);
  
  var resetBtn = document.createElement('a');
  resetBtn.classList.add('chiiBtn');
  resetBtn.href = '#bhc_reset';
  resetBtn.id = 'bhc_config_save';
  resetBtn.innerHTML = '还原默认设置';
  resetBtn.onclick = function() {
    storage.remove('config');
    chiiLib.ukagaka.presentSpeech('BHC 已还原默认设置。');
  };
  configInterface.appendChild(resetBtn);

  var closeBtn = document.createElement('a');
  closeBtn.classList.add('chiiBtn');
  closeBtn.href = '#bhc_close';
  closeBtn.id = 'bhc_config_close';
  closeBtn.innerHTML = '关闭';
  closeBtn.onclick = function() {
    configInterface.style.cssText = 'display: none;';
  };
  configInterface.appendChild(closeBtn);
  
  $(".user_box").appendChild(configInterface);
  
  this.saveConfig = function(newConfig) {
    switch(newConfig.show_weekname) {
      case 'none':
        newConfig.show_weekday = false;
        break;
      case 'japanese':
        newConfig.show_weekday = true;
        newConfig.weekname = WEEKNAME_JAPANESE;
        break;
      case 'chinese':
        newConfig.show_weekday = true;
        newConfig.weekname = WEEKNAME_CHINESE;
        break;
    }
    storage.set('config', JSON.stringify(newConfig));
    config = newConfig;
    chiiLib.ukagaka.presentSpeech('BHC 设置保存成功！');
  };

  this.showInterface = function() {
    configInterface.style.cssText = '';
  };

  this.reGenerate = function() {
    var now = new Date();
    storage.set('lastUpdate', now.getTime() - NSECS_IN_DAY);
    BHC = Application.call({});
  };
};

var BHC = Application.call({});
if(document.location.pathname == `/user/${USER}`) var configure = new Configure();

