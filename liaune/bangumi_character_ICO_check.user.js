// ==UserScript==
// @name         Bangumi Character ICO Check
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.4
// @description  检测角色的小圣杯状态，已上市的角色显示市场价，正在ICO的角色显示已募集金额
// @author       Liaune
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*
// @grant        GM_addStyle
// ==/UserScript==
let api = 'https://www.tinygrail.com/api/';
let characterlist;
let i=0;
let showBtn = document.createElement('a');
showBtn.className = 'chiiBtn';
showBtn.href='javascript:;';
showBtn.textContent = 'ICO检测';
$(showBtn).css({"font-size":"12px","margin-left":"5px"});
showBtn.addEventListener('click', checkup);
if(document.location.href.match(/mono\/character/))
    document.querySelector('#columnA .section h2').append(showBtn);
else if(document.location.href.match(/subject\/\d+\/characters/))
    checkup();
else if(document.location.href.match(/subject\/\d+/))
    checkup();
else if(document.location.href.match(/character/))
    document.querySelector('#columnCrtBrowserB .crtTools').append(showBtn);

function postData(url, data, callback) {
  var d = JSON.stringify(data);
  if (!url.startsWith('http'))
    url = api + url;
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: d,
    xhrFields: { withCredentials: true },
    success: callback
  });
}
function caculateICO(ico) {
  var level = 0;
  var price = 10;
  var amount = 10000;
  var total = 0;
  var next = 100000;

  if (ico.Total < 100000 || ico.Users < 10) {
    return { Level: level, Next: next, Price: 0, Amount: 0 };
  }

  level = Math.floor(Math.sqrt(ico.Total / 100000));
  amount = 10000 + (level - 1) * 7500;
  price = ico.Total / amount;
  next = Math.pow(level + 1, 2) * 100000;

  return { Level: level, Next: next, Price: price, Amount: amount };
}
function formatNumber(number, decimals, dec_point, thousands_sep) {
  number = (number + '').replace(/[^0-9+-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.ceil(n * k) / k;
    };

  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  var re = /(-?\d+)(\d{3})/;
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, "$1" + sep + "$2");
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}
function renderCharacterTag(chara, item) {
  var id = chara.Id;
  var flu = '--';
  var tclass = 'even';
  if (chara.Fluctuation > 0) {
    tclass = 'raise';
    flu = `+${formatNumber(chara.Fluctuation * 100, 2)}%`;
  } else if (chara.Fluctuation < 0) {
    tclass = 'fall';
    flu = `${formatNumber(chara.Fluctuation * 100, 2)}%`;
  }

  var tag = `<div class="tag_e ${tclass}" title="₵${formatNumber(chara.MarketValue, 0)} / ${formatNumber(chara.Total, 0)}">₵${formatNumber(chara.Current, 2)} ${flu}</div>`
  return tag;
}
function checkup(){
    let ids = [];
    let list = {};
    if(document.location.href.match(/mono\/character/))
        characterlist = document.querySelectorAll('#columnA .section ul li');
    else if(document.location.href.match(/subject\/\d+\/characters/))
        characterlist = document.querySelectorAll('#columnInSubjectA .clearit h2');
    else if(document.location.href.match(/subject\/\d+/))
        characterlist = document.querySelectorAll('#browserItemList .user');
    else if(document.location.href.match(/character/))
        characterlist = document.querySelectorAll('#columnCrtBrowserB .browserCrtList h3');

    characterlist.forEach( (elem, index) => {
        let href = elem.querySelector('a.l').href;
        let id = href.split('/character/')[1].toString();
        ids.push(parseInt(id));
        list[id] = elem;
    });
    postData('chara/list', ids, function (d, s) {
    if (d.State === 0) {
        for (i = 0; i < d.Value.length; i++) {
            var item = d.Value[i];
            var pre = caculateICO(item);
            if (item.CharacterId) {
                var id = item.CharacterId;
                var percent = formatNumber(item.Total / pre.Next * 100, 0);
                var ICOtag = `<div class="tags tag_e lv${pre.Level}" title="${formatNumber(item.Total, 2)}/lv${pre.Level} ${percent}%">ICO:₵${formatNumber(item.Total, 0)}</div>`;
                $(list[id].querySelector('a.l')).append(ICOtag);
                //$(list[id].querySelector('a.l')).append( '₵'+d.Value[i].Total);
            }
            else{
                var id = item.Id;
                //list[id].querySelector('a.l').style.color = '#fa8792';
                //$(list[id].querySelector('a.l')).append( '₵'+d.Value[i].Current);
                //var depth = renderCharacterDepth(chara);
                var tag = renderCharacterTag(item, list[id]);
                //$(item).find('.row').append(depth);
                $(list[id].querySelector('a.l')).append(tag);
            }
        }
    }
  });
}

GM_addStyle(`
.tag_e {
  padding-left: 5px;
  max-height: 20px;
  font-size: 11px;
  min-width: 80px;
  max-width: 100px;
  border-radius: 5px;
  color: white;
  text-shadow: 1px 1px 1px #000;
  font-weight: bold;
}
.predicted .tag_e, .initial_item .tag_e, .trade .tag_e, .title .tag_e {
    background: linear-gradient(#d965ff,#ffabf5);
    padding: 1px 10px;
}
.predicted .tag_e {
  margin-right: 5px;
}
.info .name .tag_e {
  margin: -2px 10px 0 0;
  padding: 1px 5px;
}
.initial_item .tag_e {
  padding: 0px;
}
.title .tag_e {
  margin-left: 5px;
}
.tag_e.lv0, .tag_e.even, .info .name .tag_e.even {
  background: linear-gradient(#d2d2d2,#e0e0e0);
}
.tag_e.lv1, .tag_e.new {
  background: linear-gradient(#40f343,#b2ffa5);
}
.tag_e.lv2 {
  background: linear-gradient(#70bbff,#9bd0ff)
}
.tag_e.lv3 {
  background: linear-gradient(#ffdc51,#ffe971);
}
.tag_e.lv4 {
  background: linear-gradient(#FF9800,#FFC107);
}
.tag_e.lv5 {
  background: linear-gradient(#d965ff,#ffabf5);
}
.tag_e.lv6 {
  background: linear-gradient(#ff5555,#ff9999);
}
.tag_e.raise, #grailBox button.bid {
  background: linear-gradient(#ff658d,#ffa7cc);
}
.tag_e.fall, #grailBox button.ask {
  background: linear-gradient(#65bcff,#a7e3ff);
}
`);
