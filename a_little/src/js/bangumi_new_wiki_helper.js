const fetchBangumiDataBySearch = require('../utils/searchBangumiSubject').fetchBangumiDataBySearch;
const getImageBase64 = require('../utils/getImageBase64');
const dealImageWidget = require('../utils/dealImageWidget');
const getInfoTool = require('../modules/bnwh/getInfoTool');
const configModels = require('../modules/bnwh/models');
const fillInfoBox = require('../utils/fillInfoBox');

function setDomain() {
  bgm_domain = prompt(
    '预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv',
    'bgm.tv'
  );
  GM_setValue('bgm', bgm_domain);
  return bgm_domain;
}
function setProtocol() {
  var p = prompt(
    `预设的 bangumi 页面协议是https 根据需要输入 http`,
    'https'
  );
  GM_setValue('E_USERJS_protocol', p);
}
var bgm_domain = GM_getValue('bgm') || '';
if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|bgm\.tv/)) {
  bgm_domain = setDomain();
  bgm_domain = GM_getValue('bgm');
}
if (GM_registerMenuCommand) {
  GM_registerMenuCommand("\u8bbe\u7f6e\u57df\u540d", setDomain, 'b');
  GM_registerMenuCommand("新建条目页面(http 或者 https)", setProtocol, 'h');
}
var addStyle = function (css) {
  if (css) {
    GM_addStyle(css);
  } else {
    GM_addStyle(`
.e-wiki-new-character,.e-wiki-new-subject,.e-wiki-search-subject,.e-wiki-fill-form{color: rgb(0, 180, 30) !important;margin-left: 4px !important;}
.e-wiki-new-subject {
  margin-left: 8px;
}
.e-wiki-new-character:hover,.e-wiki-new-subject:hover,.e-wiki-search-subject:hover,.e-wiki-fill-form:hover{color:red !important;cursor:pointer;}
`);
  }
};

/**
 * 插入脚本
 *
 */
function injectScript(fn, data) {
  var selfInvokeScript = document.createElement("script");
  selfInvokeScript.innerHTML = `(${fn.toString()})(${data});`;
  document.body.appendChild(selfInvokeScript);
}

// 变更url的域名
function changeDomain(url, domain) {
  if (url.match(domain)) return url;
  if (domain === 'bangumi.tv') {
    // bangumi.tv https 和 http 登录状态不统一。采取的临时方案
    let p = GM_getValue('E_USERJS_protocol');
    if (p && p === 'http') {
      return url.replace(/^https/, 'http').replace('bgm.tv', domain);
    }
    return url.replace('bgm.tv', domain);
  }
}

async function handleClick(config, checkFlag) {
  var subjectInfoList = config.itemList.map(i => getInfoTool.getWikiItem(i));
  console.info('fetch info: ', subjectInfoList);
  var queryInfo = getInfoTool.getQueryInfo(subjectInfoList);
  const type = config.newSubjectType;
  let result = null;
  if (checkFlag) {
    result = await checkSubjectExist(queryInfo, type);
  }
  if (result && result.subjectURL) {
    GM_openInTab(changeDomain(result.subjectURL, bgm_domain));
  } else {
    var coverInfo = getInfoTool.getCoverURL(config.cover);
    let subjectCover = '';
    if (coverInfo && coverInfo.coverURL) {
      subjectCover = await getImageBase64(coverInfo.coverURL);
    }
    var subType = getInfoTool.getSubType(config.subType);
    // 重置自动填表
    GM_setValue('disableAutofill', 0);
    GM_setValue('subjectData', JSON.stringify({
      subjectInfoList,
      subjectCover,
      subType
    }));
    GM_openInTab(changeDomain(`https://bgm.tv/new_subject/${type}`, bgm_domain));
  }
}


async function checkSubjectExist(queryInfo = {}, newSubjectType) {
  let searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType, queryInfo.isbn13);
  console.info(`First: search result of bangumi: `, searchResult);
  if (searchResult && searchResult.subjectURL) {
    return searchResult;
  }

  searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType, queryInfo.isbn);
  console.info('Second: search result of bangumi: ', searchResult);
  if (searchResult && searchResult.subjectURL) {
    return searchResult;
  }

  // 默认使用名称搜索
  searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType);
  console.info('Third: search result of bangumi: ', searchResult);
  return searchResult;
}
var amazon = {
  init: function () {
    var configKey = this.getConfigKey();
    if (!configKey) return;
    addStyle();
    var $title = document.querySelector('#title');
    this.insertBtn($title, configKey);
  },
  getConfigKey: function () {
    var $nav = document.querySelector('#nav-subnav .nav-a-content') || {};
    var $navAll = document.querySelector('#wayfinding-breadcrumbs_container') || {};
    // kindle 没有图书信息
    if (/kindle/i.test($navAll.textContent) || /kindle/i.test($nav.textContent)) return;
    if (/本/.test($nav.textContent) || /本|コミック/.test($navAll.textContent)) return 'amazon_jp_book';
  },
  insertBtn: function ($t, configKey) {
    var $s = document.createElement('span');
    $s.classList.add('e-wiki-new-subject');
    $s.innerHTML = '新建';
    var $search = $s.cloneNode();
    $search.innerHTML = '新建并查重';
    $t.appendChild($s);
    $t.appendChild($search);
    $s.addEventListener('click', () => {
      var config = configModels[configKey];
      handleClick(config, false);
    }, false);
    $search.addEventListener('click', async () => {
      if ($search.innerHTML !== '新建并查重') return;
      $search.innerHTML = '查重中...';
      var config = configModels[configKey];
      await handleClick(config, true);
      $search.innerHTML = '新建并查重';
    }, false);
  }
}

var bangumi = {
  init: function () {
    var re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
    var page = document.location.href.match(re);
    if (page) {
      addStyle();
      switch (page[0]) {
        case 'new_subject':
          // 非添加新书页面返回
          if (!/new_subject\/1/.test(document.location.pathname)) return;
          var $t = document.querySelector('form[name=create_subject] [name=subject_title]').parentElement
          this.insertBtn($t);
          const disableAutofill = GM_getValue('disableAutofill');
          if (disableAutofill) return;
          setTimeout(() => {
            let subjectData = JSON.parse(GM_getValue('subjectData'));
            fillInfoBox(subjectData);
            GM_setValue('disableAutofill', 1);
          }, 300);
          break;
        case 'add_related':
          // this.addRelated();
          break;
        case 'character\/new':
          // this.newCharacter();
          break;
        case 'upload_img':
          addStyle(`
.e-wiki-cover-container {
  margin-top: 1rem;
}
.e-wiki-cover-container img {
  display: 'none';
}
#e-wiki-cover-amount {
  padding-left: 10px;
  border: 0;
  color: #f6931f;
  font-size: 20px;
  font-weight: bold;
}
#e-wiki-cover-reset {
  display: inline-block;
  text-align: center;
  width: 60px;
  height: 30px;
  line-height: 30px;
  font-size: 18px;
  background-color: #f09199;
  text-decoration: none;
  color: #fff;
  margin-left: 50px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow:1px 1px 2px #333;
}
#e-wiki-cover-preview {
  margin-top: 0.5rem;
}
#e-wiki-cover-preview:active {
  cursor: crosshair;
}
#e-wiki-cover-preview {
  display: block;
}
.e-wiki-cover-blur-loading {
  width: 208px;
  height: 13px;
  background-image: url("https://bgm.tv/img/loadingAnimation.gif");
}
.e-wiki-search-cover {
  width: 84px;
  height: auto;
}
          `)
          let subjectData = JSON.parse(GM_getValue('subjectData'));
          dealImageWidget(document.querySelector('form[name=img_upload]'), subjectData.subjectCover);
          // this.addSubjectCover();
          break;
      }
    }
  },
  insertBtn: function ($t) {
    var $s = document.createElement('span');
    $s.classList.add('e-wiki-fill-form');
    $s.innerHTML = 'wiki 填表';
    $t.appendChild($s);
    $s.addEventListener('click', () => {
      let subjectData = JSON.parse(GM_getValue('subjectData'));
      fillInfoBox(subjectData);
    }, false);

    var $cancel = $s.cloneNode();
    $cancel.innerHTML = '清空';
    $cancel.addEventListener('click', () => {
    document.querySelectorAll('input[name=platform]').forEach(element => {
      element.checked = false;
    });
    var $wikiMode = document.querySelector('table small a:nth-of-type(1)[href="javascript:void(0)"]');
    $wikiMode.click();
    document.querySelector('#subject_infobox').value = `{{Infobox animanga/Manga
|中文名=
|作者= * 
|出版社= *
|价格=
|作画=
|其他出版社=
|连载杂志=
|发售日=
|页数=
|话数=
|其他=
}}
      `;
      document.querySelector('#columnInSubjectA [name=subject_title]').value = '';
      document.querySelector('#subject_summary').value = '';
    });
    $t.appendChild($cancel);
  }
}

var init = function () {
  var re = new RegExp(['getchu', 'bangumi', 'bgm', 'amazon'].join('|'));
  var page = document.location.host.match(re);
  if (page) {
    switch (page[0]) {
      case 'amazon':
        amazon.init();
        break;
      case 'bangumi':
      case 'bgm':
        bangumi.init();
        break;
      default:
        // bangumi.init();
    }
  }
};
init();
