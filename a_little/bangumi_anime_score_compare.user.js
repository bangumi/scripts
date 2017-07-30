// ==UserScript==
// @name        bangumi anime score compare
// @name:zh-CN  bangumi动画和豆瓣及MAL评分对比
// @namespace   https://github.com/22earth
// @description show subject score information of douban and MAL in bangumi.tv
// @description:zh-cn bangumi动画页面显示豆瓣和MAL的评分
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/subject\/.*$/
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bangumi_anime_score_compare.user.js
// @version     0.1.4
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @require     https://cdn.staticfile.org/fuse.js/2.6.2/fuse.min.js
// @require     https://cdn.staticfile.org/bluebird/3.5.0/bluebird.min.js
// ==/UserScript==

(function() {
  if (!document.querySelector('.focus.chl.anime')) return;

  if (GM_registerMenuCommand) {
    GM_registerMenuCommand('\u6e05\u9664\u8bc4\u5206\u7f13\u5b58', clearInfoStorage, 'c');
  }
  const USERJS_PREFIX = 'E_USERJS_ANIME_SCORE_'
  const UPDATE_INTERVAL = 24 * 60 * 60 * 1000
  const CLEAR_INTERVAL = UPDATE_INTERVAL * 7
  const E_ENABLE_AUTO_SHOW_SCORE_INFO = true;
  const TIMEOUT = 10 * 1000;

  let tempList = window.location.pathname.match(/subject\/(\d*)/)
  if (!tempList) return;
  const SUBJECT_BGM_ID = tempList[1]

  initControlDOM(document.querySelector('#panelInterestWrapper h2'))
  toggleLoading()
  //auto fetch
  init()

  function addStyle(css) {
    if (css) {
      GM_addStyle(css);
    }
    else {
      GM_addStyle(`
      .e-userjs-score-ctrl {color:#f09199;font-weight:800;float:right;}
      .e-userjs-score-ctrl:hover {cursor: pointer;}
      .e-userjs-score-clear {margin-right: 12px;}
      .e-userjs-score-loading { width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif"); }
      `)
    }
  }
  function initControlDOM($target) {
    const rawHTML = `<a title="强制刷新豆瓣和MAL评分" class="e-userjs-score-ctrl e-userjs-score-fresh">O</a>
      <a title="清除所有评分缓存" class="e-userjs-score-ctrl e-userjs-score-clear">X</a>
`
    $target.innerHTML = $target.innerHTML + rawHTML
    addStyle()
    document.querySelector('.e-userjs-score-clear').addEventListener('click', clearInfoStorage, false)
    document.querySelector('.e-userjs-score-fresh').addEventListener('click', function() {
      if (E_ENABLE_AUTO_SHOW_SCORE_INFO) {
        const subjectInfo = getSubjectInfo()
        toggleLoading()
        let $info = document.querySelectorAll('.e-userjs-score-compare')
        for (let i = 0, len = $info.length; i < len; i++) {
          $info[i].remove()
        }
        entryDouban(subjectInfo)
        entryMAL(subjectInfo)
      } else {
        init()
      }
    }, false)
  }

  function toggleLoading(hidden) {
    let $div = document.querySelector('.e-userjs-score-loading')
    if (!$div) {
      $div = document.createElement('div')
      $div.classList.add('e-userjs-score-loading')
      let $panel = document.querySelector('.SidePanel.png_bg');
      $panel.appendChild($div)
    }
    if (hidden) {
      $div.style.display = 'none';
    } else {
      $div.style.cssText = '';
    }
  }

  function getSubjectInfo() {
    function dealDate(dateStr) {
      return dateStr.replace(/年|月|日/g, '/').replace(/\$/, '')
    }
    let subjectInfo = {}
    subjectInfo.subjectName = document.querySelector('h1>a').textContent.trim()
    let infoList = document.querySelectorAll('#infobox>li')
    if (infoList && infoList.length) {
      for (let i = 0, len = infoList.length; i < len; i++) {
        let el = infoList[i]
        if (el.innerHTML.match(/放送开始|上映年度/)) {
          subjectInfo.startDate = dealDate(el.textContent.split(':')[1].trim())
        }
        if (el.innerHTML.match('播放结束')) {
          subjectInfo.endDate = dealDate(el.textContent.split(':')[1].trim())
        }
      }
    }
    return subjectInfo
  }

  function entryDouban(subjectInfo) {
    const url = `https://api.douban.com/v2/movie/search?q=${subjectInfo.subjectName}`
    searchSubjectJSON(url).then((info) => {
      if (info && info.subjects && info.subjects.length) {
        const opts = {
          keys: ['original_title', 'year']
        }
        let fuse = new Fuse(info.subjects, opts)
        let year = ''
        if (subjectInfo.startDate) {
          year = new Date(subjectInfo.startDate).getFullYear()
        }
        let results = fuse.search(subjectInfo.subjectName + year ? ' ' + year : '')
        if (results && results.length) {
          const dURL = `https://api.douban.com/v2/movie/subject/${results[0].id}`
          return searchSubjectJSON(dURL)
        } else {
          throw new Error("No match results")
        }
      } else {
        throw new Error("Invalid results")
      }
    })
      .then((info) => {
        if (info && info.original_title) {
          let siteScoreInfo = {
            site: '豆瓣评分',
            averageScore: info.rating.average,
            subjectURL: `https://movie.douban.com/subject/${info.id}/`,
            ratingsCount: info.ratings_count,
          }
          insertScoreInfo(siteScoreInfo)
          localStorage.setItem(USERJS_PREFIX + 'DOUBAN' + '_' + SUBJECT_BGM_ID, JSON.stringify({
            info: siteScoreInfo,
            date: (new Date()).getTime()
          }))
        } else {
          throw new Error("Invalid results")
        }
      })
      .catch((err) => {
        console.log('err', err);
      })
  }

  function entryMAL(subjectInfo) {
    let siteScoreInfo = {
      site: 'MAL评分'
    }
    //var name = encodeURIComponent('xxx')
    var url = `https://myanimelist.net/search/prefix.json?type=anime&keyword=${subjectInfo.subjectName}&v=1`
    //var myanimelistSearchURL = `https://myanimelist.net/anime.php?q=${name}`

    searchSubjectJSON(url).then((info) => {
      const opts = {
        keys: ['payload.aired']
      }
      let year = ''
      let results = info.categories[0].items
      let fuse = new Fuse(results, opts)
      if (subjectInfo.startDate) {
        year = new Date(subjectInfo.startDate).getFullYear()
      }
      if (year) {
        results = fuse.search(year + '')
      }
      if (results && results.length) {
        //const dURL = `https://myanimelist.net/includes/ajax.inc.php?t=64&id=${results[0].id}`
        siteScoreInfo.subjectURL = results[0].url
        return searchSubjectHTML(results[0].url)
      } else {
        throw new Error("No match results")
      }
    })
      .then((info) => {
        let parser = new DOMParser()
        let $doc = parser.parseFromString(info, "text/html");
        let $score = $doc.querySelector('.fl-l.score')
        if ($score) {
          //siteScoreInfo.averageScore = parseFloat($score.textContent.trim()).toFixed(1)
          siteScoreInfo.averageScore =  $score.textContent.trim()
          if ($score.dataset.user) {
            siteScoreInfo.ratingsCount = $score.dataset.user.replace('users', '').trim()
          } else {
            throw new Error("Invalid score info")
          }
          insertScoreInfo(siteScoreInfo)
          localStorage.setItem(USERJS_PREFIX + 'MAL' + '_' + SUBJECT_BGM_ID, JSON.stringify({
            info: siteScoreInfo,
            date: (new Date()).getTime()
          }))
        } else {
          throw new Error("Invalid results")
        }
      })
      .catch((err) => {
        console.log('err', err);
      })
  }

  function searchSubjectJSON(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        timeout: TIMEOUT,
        url: url,
        onreadystatechange: function (response) {
          if (response.readyState === 4 && response.status === 200) {
            resolve(JSON.parse(response.responseText));
          }
        },
        onerror: function (err) {
          reject(err)
        },
        ontimeout: function (err) {
          reject(err)
        }
      });
    })
  }
  function searchSubjectHTML(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        timeout: TIMEOUT,
        url: url,
        onreadystatechange: function(response) {
          if (response.readyState === 4 && response.status === 200) {
            //let parser = new DOMParser();
            //let $doc = parser.parseFromString(response.responseText, "text/html");
            resolve(response.responseText)
          }   
        },
        onerror: function (err) {
          reject(err)
        },
        ontimeout: function (err) {
          reject(err)
        }
      });
    })
  }


  /**
   * @param {Object} siteScoreInfo
   */

  function insertScoreInfo(siteScoreInfo) {
    /*
     *siteScoreInfo = siteScoreInfo || {
     *  site: 'douban',
     *  averageScore: 6.66,
     *  subjectURL: 'https://movie.douban.com/subject/26649919/',
     *  collectionCount: 200
     *}
     */
    let $panel = document.querySelector('.SidePanel.png_bg');
    if ($panel) {
      // 两位小数
      siteScoreInfo.averageScore = parseFloat(siteScoreInfo.averageScore).toFixed(2)
      let $div = document.createElement('div')
      $div.classList.add('frdScore')
      $div.classList.add('e-userjs-score-compare')
      $div.innerHTML = `${siteScoreInfo.site}：<span class="num">${siteScoreInfo.averageScore}</span> <span class="desc" style="visibility:hidden">还行</span> <a href="${siteScoreInfo.subjectURL}" target="_blank" class="l">${siteScoreInfo.ratingsCount} 人评分</a>
`
      toggleLoading(true)
      $panel.appendChild($div)
    }
  }

  function readScoreInfo(site) {
    let scoreInfo = window.localStorage.getItem(USERJS_PREFIX + site.toUpperCase() + '_' + SUBJECT_BGM_ID)
    if (scoreInfo) {
      scoreInfo = JSON.parse(scoreInfo)
      if (new Date() - new Date(scoreInfo.date) < UPDATE_INTERVAL) {
        return scoreInfo
      }
    }
  }

  function checkInfoUpdate() {
    let time = localStorage.getItem(USERJS_PREFIX + 'LATEST_UPDATE_TIME')
    let now = new Date();
    if (!time) {
      localStorage.setItem(USERJS_PREFIX + 'LATEST_UPDATE_TIME', now.getTime())
      return
    } else if (now - new Date(time) > CLEAR_INTERVAL) {
      clearInfoStorage()
    }
  }

  function clearInfoStorage() {
    let now = new Date();
    for (var key in localStorage) {
      if (key.match(USERJS_PREFIX)) {
        console.log(localStorage.getItem(key));
        localStorage.removeItem(key)
      }
    }
    //localStorage.setItem(USERJS_PREFIX + 'LATEST_UPDATE_TIME', now.getTime())
  }

  function init() {
    checkInfoUpdate()
    const subjectInfo = getSubjectInfo()
    const scoreInfoDouban = readScoreInfo('douban')
    const scoreInfoMAL = readScoreInfo('mal')
    if (!scoreInfoDouban) {
      entryDouban(subjectInfo)
    } else {
      insertScoreInfo(scoreInfoDouban.info)
    }
    if (!scoreInfoMAL) {
      entryMAL(subjectInfo)
    } else {
      insertScoreInfo(scoreInfoMAL.info)
    }
  }
}());
