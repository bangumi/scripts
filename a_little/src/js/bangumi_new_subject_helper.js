const searchBangumiSubject = require('../utils/searchBangumiSubject');
const getImageBase64 = require('../utils/getImageBase64');

;(function () {
  if (window.top != window.self) return;
  function setDomain() {
    bgm_domain = prompt(
      '预设bangumi的域名是 "' + 'bangumi.tv' + '". 根据需要输入chii.in或者bgm.tv',
      'bangumi.tv'
    );
    GM_setValue('bgm', bgm_domain);
    return bgm_domain;
  }
  var bgm_domain = GM_getValue('bgm') || '';
  if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|chii\.in|bgm\.tv/)) {
    bgm_domain = setDomain();
    bgm_domain = GM_getValue('bgm');
  }
  if (GM_registerMenuCommand) {
    GM_registerMenuCommand("\u8bbe\u7f6e\u57df\u540d", setDomain, 'b');
  }
  var addStyle = function (css) {
    if (css) {
      GM_addStyle(css);
    }
    else {
      GM_addStyle([
        '.new-character,.new-subject,.search-subject,.fill-form{color: rgb(0, 180, 30) !important;margin-left: 4px !important;}',
        '.new-character:hover,.new-subject:hover,.search-subject:hover,.fill-form:hover{color:red !important;cursor:pointer;}',
      ].join(''));
    }
  };
  var getchu = {
    init: function () {
      if (getchu.isGamepage()) {
        addStyle();
        this.addNode();
        registerEvent(this);
        //GM_setValue('subjectData', JSON.stringify(this.getSubjectInfo()));
      }
    },
    isGamepage: function () {
      if ($('.genretab.current').length && $('.genretab.current'))
        return true;
    },
    getSubjectInfo: function () {
      var info = {};
      var adict = [
        {
          "定価": "售价",
          "発売日": "发行日期",
          "ジャンル": "游戏类型",
        },
        {
          "ブランド": "开发",
          "原画": "原画",
          "音楽": "音乐",
          "シナリオ": "剧本",
          "アーティスト": "主题歌演出",
          "作詞": "主题歌作词",
          "作曲": "主题歌作曲",
        }
      ];
      info.subjectName = $('#soft-title').text().split('\n')[1].replace(/＜?初回.*$|廉価.*$/g, '').trim();
      var $infoTable = $('#soft_table table').eq(0).find('tr');
      $infoTable.each(function (index, element) {
        var alist = [];
        var elem = $(element);
        if (index === 0) {
          alist[0] = 'ブランド';
          alist[1] = elem.text().split('\n')[0].replace('ブランド：', '');
        }
        if (index === 2) {
          alist = elem.text().replace(/\s*/g, '').split('：');
        }
        if (!alist.length) {
          alist = elem.text().split('：');
        }
        if (index > 8 && alist[0].match(/作詞\/作曲/)) {
          var templist1 = alist[0].split('/');
          var templist2 = alist[1].split('／');
          info[templist1[0]] = templist2[0];
          info[templist1[1]] = templist2[1] ? templist2[1] : templist2[0];
        }
        if (!adict[0].hasOwnProperty(alist[0]) && !adict[1].hasOwnProperty(alist[0])) {
          return;
        }
        if (alist.length) {
          info[alist[0]] = alist[1];
        }
      });
      $('div.tabletitle:lt(4)').each(function (index, element) {
        var elem = $(element);
        if (index === 0 && elem.text().match(/商品紹介/)) {
          info.subjectStory = $(this).next().text().replace(/^\s*[\r\n]/gm, '');
        }
        if (elem.text().match(/ストーリー/)) {
          info.subjectStory = $(this).next().text().replace(/^\s*[\r\n]/gm, '');
        }
      });
      var cvlist = [];
      $('.chara-name').each(function (index, element) {
        var elem = $(element);
        if (elem.text().match("CV")) {
          cvlist.push(elem.text().replace(/.*CV：|新建角色/g, ''));
        }
      });
      info.cv = cvlist.join(',');
      //console.log(info);
      // store img data
      var $a = $('#soft_table .highslide').eq(0)
      if ($a.length) {
        info.subjectCoverURL = $a[0].href
      }
      return info;
    },
    addNode: function () {
      // new subject
      var $th = $('#soft-title').parent();
      $th.append($('<a>').attr({
        class: 'new-subject',
        target: '_blank',
        href: 'http://' + bgm_domain + '/new_subject/4',
      }).text('\u65b0\u5efa\u6761\u76ee'));
      // search subject
      $th.append($('<a>').attr({
        class: 'search-subject e-userjs-search-cse',
        target: '_blank',
        href: 'https://cse.google.com/cse/home?cx=008561732579436191137:pumvqkbpt6w',
      }).text('Google CSE\u641c\u7d22\u6761\u76ee'));
      // new search method
      $th.append($('<a>').attr({
        class: 'search-subject e-userjs-search-subject',
        title: '检测条目是否存在',
        href: '#',
      }).text('检测条目是否存在'));
      // add new character
      $('h2.chara-name').append($('<a>').attr({
        class: 'new-character',
        target: '_blank',
        href: 'http://' + bgm_domain + '/character/new',
      }).text('\u65b0\u5efa\u89d2\u8272'));
    },
    getCharacterInfo: function (target) {
      var charaData = {};
      var $target = $(target);
      var name = $target.parent().find('charalist').text();
      charaData.characterName = name.replace(/\s/, '');
      charaData['日文名'] = name;
      var $p = $target.parent().parent().parent();
      var intro = $p.next('dd');
      charaData.characterIntro = intro.text();
      var node = intro.children().eq(0);
      //separately deal BWH
      if (node.text().match(/B.*W.*H\d\d/))
        charaData['スリーサイズ'] = node.text().match(/B.*W.*H\d\d/);
      // remove flag g to improve ability
      if (node || node.text().match('：')) {
        node.text().split(/\s|\n/).forEach(function (element) {
          if (!element.length)
            return;
          var alist = element.trim().split('：');
          if (alist.length === 2 && alist[0] !== 'スリーサイズ')
            charaData[alist[0]] = alist[1];
        });
      }
      /*
        var templist = node.text().match(/1.*cm|B.*W.*H\d\d|\d{1,2}月\d{1,2}日|\w型/);
        if (templist) {
          templist = node.text().match(/1.*cm|B.*W.*H\d\d|\d{1,2}月\d{1,2}日|\w型/g);
          charaData['身高'] = templist[0];
          charaData.BWH = templist[1];
          charaData['生日'] = templist[2];
          charaData['血型'] = templist[3];
          charaData.characterIntro = introtext.replace(/.*\n/,'');
        }
        */
      // get hiragana name, cv
      var charatext = $p.text();
      if (charatext.match(/（(.*)）/))
        charaData.hiraganaName = charatext.match(/（(.*)）/)[1];
      if (charatext.match("CV")) {
        charaData.CV = charatext.replace(/.*CV：|新建角色/g, '');
      }
      // store img data
      var $img = $target.closest('tr').find('td>img');
      var getBase64Image = function (img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL;
      };
      if ($img.length) {
        charaData.characterImg = getBase64Image($img[0]);
      }
      return charaData
    },
  };

  function registerEvent(self) {
    $('.e-userjs-search-cse').click(function (e) {
      e.preventDefault();
      var s = self.getSubjectInfo()
      var name = encodeURIComponent(s.subjectName)
      GM_openInTab('https://cse.google.com/cse/publicurl?cx=008561732579436191137:pumvqkbpt6w&query=' + name)
    })
    $('.e-userjs-search-subject').click(function (e) {
      e.preventDefault();
      var subject = self.getSubjectInfo();
      var subjectInfo = {
        subjectName: subject.subjectName,
        startDate: subject['発売日']
      };
      searchBangumiSubject.fetchBangumiDataBySearch(subjectInfo)
        .then((i) => {
          if (i) return i;
          return searchBangumiSubject.fetchBangumiDataByDate(subjectInfo)
        })
        .then((i) => {
          console.log('搜索结果: ', i);
          let $search = $('.e-userjs-search-subject');
          $search.text('条目存在');
          $search.attr('href', i.subjectURL);
          $search.attr('target', '_blank');
          $search.unbind('click');
          GM_openInTab(i.subjectURL);
        })
        .catch((r) => {
          console.log(r);
        })
      //fetchBangumiData(subjectInfo);
    });
    $('.new-subject').click(function(e) {
      e.preventDefault();
      var s = self.getSubjectInfo()
      console.log('条目信息: ', s);
      GM_setValue('subjectData', JSON.stringify(s));
      //GM_setValue('subjectData', JSON.stringify(self.getSubjectInfo()));
      alert('条目信息已存储,请再次点击');
      $(this).unbind('click');
      $(this).click();
    })
    $('.new-character').click(function (event) {
      event.preventDefault();
      GM_setValue('charaData', JSON.stringify(self.getCharacterInfo(this)));
      alert('角色信息已存储,请再次点击');
      $(this).unbind('click');
      $(this).click();
    });
  }
  var google = {
    init: function () {
      var selfInvokeScript = document.createElement("script");
      selfInvokeScript.innerHTML = "(" + google.fillForm.toString() + ")(" + GM_getValue('subjectData') + ");";
      document.body.appendChild(selfInvokeScript);
    },
    fillForm: function (data) {
      // need google api load, to get elements you can use getAllElements()
      // https://developers.google.com/custom-search/docs/element#cse-element
      window.onload = function () {
        var element = google.search.cse.element.getElement("standard0");
        element.execute(data.subjectName);
      };
    }
  };
  var bangumi = {
    init: function () {
      addStyle();
      this.subjectSearch.init();
      var re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
      var page = document.location.href.match(re);
      if (page) {
        switch (page[0]) {
          case 'new_subject':
            this.newSubject();
            break;
          case 'add_related':
            this.addRelated();
            break;
          case 'character\/new':
            this.newCharacter();
            break;
          case 'upload_img':
            this.addSubjectCover();
            break;
        }
      }
    },
    fillForm: function (data) {
      var pNode = $('.settings .inputtext').eq(0);
      if (data.subjectName && pNode) {
        pNode.val(data.subjectName);
      }
      if (data.subjectStory) {
        $('#subject_summary').val(data.subjectStory);
      }
      setTimeout(function () { $('#showrobot').click(); }, 300);
      console.log($('.fill-form').text());
      $('.fill-form').click(function () {
        window.NormaltoWCODE();
        setTimeout(function () {
          if ($('#subject_infobox')) {
            var infobox = ["{{Infobox Game", "|中文名=", "|平台={", "[PC]", "}", "|游玩人数=1"];
            var infodict = {
              "ブランド": "开发",
              "原画": "原画",
              "音楽": "音乐",
              "シナリオ": "剧本",
              "アーティスト": "主题歌演出",
              "作詞": "主题歌作词",
              "作曲": "主题歌作曲",
              "発売日": "发行日期",
              "ジャンル": "游戏类型",
              "定価": "售价",
            };
            for (var prop in infodict) {
              if (data[prop]) {
                infobox.push("|item=".replace("item", infodict[prop]) + data[prop]);
              }
            }
            infobox.push("}}");
            $('#subject_infobox').val(infobox.join('\n'));
            window.WCODEtoNormal();
          }
        }, 1000);
      });
    },
    // another way to fill form, this way is directly
    fillFormAnother: function (data) {
      var pNode = $('.settings .inputtext').eq(0);
      if (data.subjectName && pNode) {
        pNode.val(data.subjectName);
      }
      if (data.subjectStory) {
        $('#subject_summary').val(data.subjectStory);
      }
      setTimeout(function () { $('#showrobot').click(); }, 300);
      console.log($('.fill-form').text());
      $('.fill-form').click(function () {
        var inputtext = $('#infobox_normal').find('.inputtext.prop');
        if (data['ジャンル']) {
          inputtext.eq(3).get(0).value = data['ジャンル'];
        }
        if (data['発売日']) {
          inputtext.eq(6).get(0).value = data['発売日'];
        }
        if (data['ブランド']) {
          $('#infobox_normal').find('.inputtext.id').eq(9).attr('value', '开发');
          inputtext.eq(9).attr('value', data['ブランド']);
        }
      });
    },
    fillFormCharacter: function (data) {
      var pNode = $('.settings .inputtext').eq(0);
      if (data.characterName && pNode) {
        pNode.val(data.characterName);
      }
      if (data.characterIntro) {
        $('#crt_summary').val(data.characterIntro);
      }
      setTimeout(function () { $('#showrobot').click(); }, 300);
      $('.fill-form').click(function () {
        window.NormaltoWCODE();
        if ($('#preview')) {
          var canvas = document.getElementById('preview');
          var ctx = canvas.getContext('2d');
          var image = new Image();
          image.onload = function () {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
          };
          image.src = data.characterImg;
        }
        setTimeout(function () {
          if ($('#subject_infobox')) {
            // ["{{Infobox Crt", "|简体中文名= ", "|别名={", "[第二中文名|]", "[英文名|]", "[日文名|]", "[纯假名|]", "[罗马字|]", "[昵称|]", "}", "|性别= ", "|生日= ", "|血型= ", "|身高= ", "|体重= ", "|BWH= ", "|引用来源= ", "}}"]
            var infobox = ["{{Infobox Crt", "|简体中文名= ", "|别名={", "[第二中文名|]", "[英文名|]"];
            var crt_infodict = {
              '誕生日': '生日',
              '血液型': '血型',
              '身長': '身高',
              'スリーサイズ': 'BWH'
            };
            infobox.push("[日文名|" + data['日文名'] + "]");
            if (data.hiraganaName) {
              infobox.push("[纯假名|" + data.hiraganaName + "]");
            }
            infobox = infobox.concat(["[罗马字|]", "[昵称|]", "}", "|性别= "]);
            // basic information
            for (var prop in crt_infodict) {
              if (data[prop]) {
                infobox.push("|item=".replace("item", crt_infodict[prop]) + data[prop]);
              }
            }
            infobox.push("|体重= ");
            // deal additional information and remove that has pushed in array
            for (prop in data) {
              if (!crt_infodict[prop] && ['characterName', 'hiraganaName', 'characterIntro', '日文名', 'characterImg'].indexOf(prop) === -1)
                infobox.push("|item=".replace("item", prop) + data[prop]);
            }
            infobox.push("|引用来源= ");
            infobox.push("}}");
            $('#subject_infobox').val(infobox.join('\n'));
            window.WCODEtoNormal();
          }
        }, 1000);
        /*
         * solution one: fill basic information
         var $text = $('.inputtext.prop');
         $text.eq(4).val(data['日文名']);
         if (data.hiraganaName)
         $text.eq(5).val(data.hiraganaName);
         var alist = ['性别', '生日', '血型', '身高', '体重', 'BWH', '引用来源'];
         var inputtext = $text.filter(':gt(7)');
         alist.forEach(function(element, index) {
         if (data[element]) {
         inputtext.eq(index).val(data[element]);
         }
         });
         */
      });
    },
    addNode: function () {
      $('<span>').attr({ class: 'fill-form' }).text('填表').insertAfter($('.settings .alarm').eq(0));
    },
    newSubject: function () {
      this.addNode();
      //$('body').append($('<script>').html("(" + bangumi.fillForm.toString() + ")(" + GM_getValue('subjectData') + ");"));
      var selfInvokeScript = document.createElement("script");
      var prop = 'fillForm';
      if (GM_getValue('fillFormAnother') === 'wikipedia') {
        prop = 'fillFormAnother';
        GM_setValue('fillFormAnother', '');
      }
      selfInvokeScript.innerHTML = "(" + this[prop].toString() + ")(" + GM_getValue('subjectData') + ");";
      document.body.appendChild(selfInvokeScript);
    },
    createTable: function (data) {
      var html = '';
      // first td
      var html1 = '<td style="width:100px;" align="right" valign="top">';
      // second td
      var html2 = '<td style="width:auto;" align="top">';
      var filterDict = {
        "subjectName": "游戏",
        "ブランド": "开发",
        "原画": "原画",
        "音楽": "音乐",
        "シナリオ": "剧本",
        "アーティスト": "主题歌演出",
        "作詞": "主题歌作词",
        "作曲": "主题歌作曲",
        "cv": "声优"
      };
      for (var prop in data) {
        if (filterDict[prop]) {
          html += '<tr>' + html1 + filterDict[prop] + '：</td>';
          var td2;
          if (data[prop].match('、')) {
            td2 = data[prop].split('、').map(function (item) {
              return '<span>' + item + '</span>';
            }).join(',');
          } else if (data[prop].match(',')) {
            td2 = data[prop].split(',').map(function (item) {
              return '<span>' + item + '</span>';
            }).join(',');
          }
          else {
            td2 = '<span>' + data[prop] + '</span>';
          }
          html += html2 + td2 + '</td></tr>';
        }
      }
      return html;
    },
    addRelated: function () {
      addStyle([
        '.a-table{float:right;margin-top:20px;width:320px;}',
        '.a-table span:hover{color:red;cursor:pointer;}',
        '.a-table span{color:rgb(0,180,30);}'
      ].join(''));
      $('#columnCrtRelatedA').append($('<table>').addClass('a-table').html(this.createTable(JSON.parse(GM_getValue('subjectData')))));
      $('.a-table span').each(function (index, element) {
        $(this).click(function () {
          var searchtext = $(this).text().replace(/\(.*\)/, '');
          console.log(searchtext);
          $('#subjectName').val(searchtext);
          window.setTimeout(function () {
            $('#findSubject').click();
          }, 300);
        });
      });
    },
    newCharacter: function () {
      this.addNode();
      var selfInvokeScript = document.createElement("script");
      selfInvokeScript.innerHTML = "(" + this.fillFormCharacter.toString() + ")(" + GM_getValue('charaData') + ");";
      document.body.appendChild(selfInvokeScript);
      //$('body').append($('<script>').html("(" + this.fillFormCharacter.toString() + ")(" + GM_getValue('charaData') + ");"));
    },
    subjectSearch: {
      init: function () {
        this.addIcon();
        this.registerEvent();
      },
      creadIcon: function (prop, imgsrc) {
        var icon = $('<a>');
        var img = $('<img>');
        img.attr({ src: imgsrc, style: 'display:inline-block;border:none;height:16px;width:16px;' });
        if (typeof prop === "object") {
          icon.attr(prop);
        }
        return icon.append(img);
      },
      addIcon: function () {
        this.creadIcon({ href: "", target: "_blank", class: 'search-baidu' }, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACoklEQVQ4jZ2T6UuUURSHzz9QRhCpJJVZERUFmVmp7bZYZiUttpiEVliEtCctJtGHPgQGEm1EUbQHUlCBWSI1NbagJfheX3XG1LSmhWL0NTtPH6ZmEulLF86XcznPPb/7O0eksAYprEEK3iKHqpED1Uj+a2TvK2TXC2SHG8lzIVufILkVyKZyJLsMySpF1t1HpLCG/z2ScQ+Rgre9LqzaTj1S0K7VVR0KYKxOtY2jvQAr7iBysLpH0nGUPTvaGBVTp5kZzWobh2mTGzVljldt4/QEpJcgsr8qmPj8qRuAXXltTB7fQE5mC26Xn7hx9cyd4cHt8vcEpN1GZN9rADyNXWxY26y5Oa1668ZXcjJbKC7yAVBc5KO4yIfb5cfr6QoBFt1EZPdLAK5d+sKQgZYmxjUogG0cOjtCsm3jsGrZO1YuadLWlh8BwPxriOysBOC5y09CbANLFzZxt+QbtnHYvKGFvC2t2Mbh2NGPTBpfT0ykwe3yK4DMvYLI9mcAdHfDjatftbjIp7ZxSE326ogoo2NibNYsf6e2cViW6iVtvlcb6gOOyKxLiGx7Gmyzo+MntnFIm+dlZJTR6HDDn1ixuElt4/D44XfltzKZfhGR3Iog4E1VJymzvYwYVMffxdHhhnHDbbIymrHrQlZK4nlENpUDoAqH89t18ACjQweaXoDBA4yOHWbzqPR78Gdl6jlEssuCgKMFHzS8r6WR/SwiwywN71OrEWEWUf0tHdTf0mERhssXvoQA8WcRySoNtuRp7GJLdivJSR7SU5o4cdzHieM+Zk1tJHZ0PRvXN9P2/kdIQtxpRNY9+Hu4FKgEnvwjKntM4sRTiKy+F1iK9BJkyW0k9Say4HrA49mXkZkXkaQLSMJ5ZMo5JP5M4OXYU8iEk/wC6ZkDX3ssK20AAAAASUVORK5CYII=").insertBefore($('#headerSearch .search'));
        this.creadIcon({ href: "https://cse.google.com/cse/home?cx=008561732579436191137:pumvqkbpt6w", target: "_blank", class: 'search-google' }, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB5klEQVQ4jYWTzWsTYRCH9yLYePL/EAlisEQvtlC13irUVagHBUX0omAv3oQqHiooTeiiudTvtaiIVZGqlHoRtB+StrE9yYK0mw8ipLG7mcnjIdmYL8nA7/bOM/Obd8YwmsL3/T0iYqnqmqr6Va2KyDgQbn5fCyAkIgk6hIhYjuN0tUueBSh7HsXJh+TOD5HuP4B7KEru7Ek2n05Q9rwAMtMACSqru07ujInbG2mr/PDF+k7Ga56DytnTg7i9EdJH9lO4F8P/Po+fXKSQiJM9NYA4P5sdhQ0RsQBK83fIDOzD7evGTy60mldtN4+4oaprAPIlgvcqRPHBhU5zrGNqylBVH6D0cQel6W2UM28aHvWMFFp01f4TALx/gA+hCiA91RFw5VEjYBXg9+ddZKd38nJx9L8tX3u+Rc9IgdGprQCwYlQ3jG/LNzlsH6XbHmTOXWpJTv1S+m5UOphNSTDEMQMIA3jic/ztJfY+OUbUNrm9MMHXjSRz7jJ3kzb99y0OXs9zLlGkXK5APc/bHSySBbCxmcGsQtrJfHGL9Xw5qB6rbaLjOF0iMgPgqc/jH68Zej9M9JlJ1DY58e4yiaVJiqWtIPkTsL3hHqoQq8PXIyKxluSmwwqLSFxVU6rqVbUiImM1z3XxF/9k+3A9su/8AAAAAElFTkSuQmCC").insertBefore($('#headerSearch .search'));
      },
      registerEvent: function () {
        $('.search-baidu').mouseover(function () {
          if ($('#search_text').val()) {
            $(this).attr('href', "http://www.baidu.com/s?&ie=UTF-8&oe=UTF-8&cl=3&rn=100&wd=%20%20" + encodeURIComponent($("#search_text").val()) + " site:bangumi.tv");
          }
        });
        $('.search-google').mouseover(function () {
          if ($('#search_text').val()) {
            GM_setValue({ "subjectData": JSON.stringify({ subjectName: $('#search_text').val() }) });
          }
        });
      },
    },
    redirect: function () {
      window.location.href.replace(/((?:bgm|bangumi)\.tv|chii\.in)/, bgm_domain);
    },
    addSubjectCover: function () {
      var $form = $('form[name=img_upload]')
      var $btn = $('<input class="inputBtn" style="margin-top: 10px;" value="获取游戏封面" name="fetchImage" type="button">')
      $form.after($btn)
      $btn.click(function() {
        var $blur = $('.blur-info');
        if (!$blur.length) {
          alert('该功能需要配合bangumi_blur_image.user.js才能使用');
          return;
        }
        var subjectData = JSON.parse(GM_getValue('subjectData'));
        getImageBase64(subjectData.subjectCoverURL).then((data) => {
          console.log('cover: ', subjectData);
          var $canvas = document.querySelector('#preview');
          var ctx = $canvas.getContext('2d');
          var $img = new Image();
          $img.addEventListener('load', function () {
            $canvas.width = $img.width;
            $canvas.height = $img.height;
            ctx.drawImage($img, 0, 0);
              window.dispatchEvent(new Event('resize'));  // let img cut tool at right position
            }, false);
          $img.src = data
        });
      })
    }
  };
  var erogamescape = {
    init: function () {
      if (erogamescape.isGamepage()) {
        addStyle();
        this.addNode(erogamescape.softtitle());
        registerEvent(this);
        //GM_setValue('subjectData', JSON.stringify(this.getSubjectInfo()));
      }
    },
    isGamepage: function () {
      if (window.location.search.match('game')) {
        return true;
      }
    },
    addNode: function () {
      // new subject
      $('#soft-title').append($('<a>').attr({
        class: 'new-subject',
        target: '_blank',
        href: 'http://' + bgm_domain + '/new_subject/4',
      }).text('\u65b0\u5efa\u6761\u76ee'));
      // search subject
      $('#soft-title').append($('<a>').attr({
        class: 'search-subject e-userjs-search-cse',
        target: '_blank',
        href: 'https://cse.google.com/cse/home?cx=008561732579436191137:pumvqkbpt6w',
      }).text('\u641c\u7d22\u6761\u76ee'));
      $('#soft-title').append($('<a>').attr({
        class: 'search-subject e-userjs-search-subject',
        title: '检测条目是否存在',
        href: '#',
      }).text('检测条目是否存在'));
    },
    softtitle: function () {
      return document.getElementById("soft-title");
    },
    getSubjectInfo: function () {
      var info = {};
      var title = $('#soft-title');
      info.subjectName = title.find('span').eq(0).text().trim();
      info['ブランド'] = title.find('a').eq(0).text();
      if (title.text().match(/\d{4}-\d\d-\d\d/)) {
        info['発売日'] = title.text().match(/\d{4}-\d\d-\d\d/)[0];
      }
      if (document.getElementById('genga')) {
        info['原画'] = $('#genga td').text();
      }
      if (document.getElementById('shinario')) {
        info['シナリオ'] = $('#shinario td').text();
      }
      if (document.getElementById('ongaku')) {
        info['音楽'] = $('#ongaku td').text();
      }
      if (document.getElementById('kasyu')) {
        info['アーティスト'] = $('#kasyu td').text();
      }
      //console.log(info);
      return info;
    },
  };
  var dmm = {
    init: function () {
      if (dmm.isGamepage()) {
        dmm.getSubjectInfo();
        addStyle();
        dmm.addNode();
      }
    },
    isGamepage: function () {
      if (window.location.pathname.match('pcgame')) {
        return true;
      }
    },
    getSubjectInfo: function () {
      var info = {};
      var adict = {
        "原画": "原画",
        "シナリオ": "剧本",
        "ブランド": "开发",
      };
      if ($('#title').length)
        info.subjectName = $('h1#title').text().replace(/新建.*$/, '').trim();
      if ($('.mg-b20.lh4').length)
        info.subjectStory = $('.mg-b20.lh4').text();
      if ($('table.mg-b20').length) {
        var infoTable = $('table.mg-b20 tr');
        infoTable.each(function (index, element) {
          var alist = $(element).text().split('：').map(String.trim);
          if (alist[0] === "配信開始日") info['発売日'] = alist[1];
          if (alist[0] === "ゲームジャンル") info['ジャンル'] = alist[1];
          if (alist.length === 2 && adict.hasOwnProperty(alist[0])) {
            info[alist[0]] = alist[1];
          }
        });
      }
      var astr = JSON.stringify(info);
      GM_setValue('subjectData', astr);
      console.log(astr);
      return info;
    },
    addNode: function () {
      $('h1#title').append($('<a>').attr({
        class: 'new-subject',
        target: '_blank',
        href: 'http://' + bgm_domain + '/new_subject/4',
      }).text('新建条目'));
      $('h1#title').append($('<a>').attr({
        class: 'search-subject',
        target: '_blank',
        href: 'https://cse.google.com/cse/home?cx=008561732579436191137:pumvqkbpt6w',
      }).text('搜索条目'));
    }
  };
  var wikipedia = {
    init: function () {
      // wikipedia use different way to fill form
      GM_setValue('fillFormAnother', 'wikipedia');
      addStyle();
      this.addNode();
      GM_setValue('subjectData', JSON.stringify(this.getSubjectInfo()));
    },
    getSubjectInfo: function () {
      var info = {};
      var adict = {
        '開発元': 'ブランド',
        'Developer(s)': 'ブランド',
        'ジャンル': 'ジャンル',
        'Genre(s)': 'ジャンル',
        'Release date(s)': '発売日',
        '発売日': '発売日'
      };
      info.subjectName = $('#firstHeading').text().replace(/新建.*$/, '');
      var $infotable = $('.infobox tbody').eq(0).find('tr');
      $infotable.each(function (index, element) {
        var alist = [],
          elem = $(element);
        alist = elem.text().trim().split('\n');
        if (alist.length === 2 && adict.hasOwnProperty(alist[0])) {
          info[adict[alist[0]]] = alist[1];
        }
      });
      return info;
    },
    addNode: function () {
      // new subject
      $('#firstHeading').append($('<a>').attr({
        class: 'new-subject',
        target: '_blank',
        href: 'http://' + bgm_domain + '/new_subject/4',
      }).text('\u65b0\u5efa\u6761\u76ee'));
      // search subject
      $('#firstHeading').append($('<a>').attr({
        class: 'search-subject',
        target: '_blank',
        href: 'https://cse.google.com/cse/home?cx=008561732579436191137:pumvqkbpt6w',
      }).text('\u641c\u7d22\u6761\u76ee'));
    },
  };

  var init = function () {
    var re = new RegExp(['getchu', 'google', 'bangumi', 'bgm', 'chii', 'erogamescape', 'dmm', '219\.66', 'wikipedia'].join('|'));
    var page = document.location.href.match(re);
    if (page) {
      switch (page[0]) {
        case 'getchu':
          getchu.init();
          break;
        case 'google':
          google.init();
          break;
        case 'erogamescape':
          erogamescape.init();
          break;
        case '219\.66':
          erogamescape.init();
          break;
        case 'dmm':
          dmm.init();
          break;
        case 'wikipedia':
          wikipedia.init();
          break;
        default:
          bangumi.init();
      }
    }
  };
  init();
})();
