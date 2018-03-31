/**
 * dollar 选择符
 * @param {string} selector 
 */
function $qs(selector) {
  return document.querySelector(selector);
}
/**
 * 获取查找条目需要的信息
 * @param {Object[]} items
 */
function getQueryInfo(items) {
  var info = {};
  items.forEach((item) => {
    if (item.category === 'subject_title') {
      info.subjectName = item.data;
    }
    if (item.category === 'date') {
      info.startDate = item.data;
    }
    if (item.category === 'ISBN') {
      info.isbn = item.data;
    }
    if (item.category === 'ISBN-13') {
      info.isbn13 = item.data;
    }
  });
  if (info.subjectName) {
    return info;
  }
  return;
}
function getCoverURL(coverConfig) {
  if (!coverConfig) return;
  var $cover = $qs(coverConfig.selector);
  if ($cover) {
    return {
      coverURL: $cover.getAttribute('src'),
      height: $cover.height,
      width: $cover.width
    };
  }
}
function getSubType(itemConfig) {
  if (!itemConfig) return;
  const dict = {
    'コミック': 0
  };
  var $t;
  if (itemConfig.selector && !itemConfig.subSelector) {
    $t = $qs(itemConfig.selector);
  } else if (itemConfig.keyWord) {  // 使用关键字搜索节点
    $t = getDOMByKeyWord(itemConfig);
  }
  if ($t) {
    let m = $t.innerText.match(new RegExp(Object.keys(dict).join('|')));
    if (m) return dict[m[0]];
  }
}
/**
 * 生成wiki的项目
 * @param {Object} itemConfig 
 * @returns {Object}
 */
function getWikiItem(itemConfig) {
  var data = getItemData(itemConfig);
  if (data) {
    return {
      name: itemConfig.name,
      data,
      category: itemConfig.category
    };
  }
  return {};
}
/**
 * 生成wiki的项目数据
 * @param {Object} itemConfig 
 * @returns {string}
 */
function getItemData(itemConfig) {
  var $t;
  if (itemConfig.selector && !itemConfig.subSelector) {
    $t = $qs(itemConfig.selector);
  } else if (itemConfig.keyWord) {  // 使用关键字搜索节点
    $t = getDOMByKeyWord(itemConfig);
  }
  if ($t) {
    return dealRawText($t.innerText, [itemConfig.keyWord], itemConfig);
  } else if (!$t && itemConfig.otherRules && itemConfig.otherRules.length) {
    let rule = itemConfig.otherRules.pop()
    return getItemData(Object.assign(itemConfig, rule));
  }
}
/**
 * 处理无关字符
 * @param {string} str 
 * @param {Object[]} filterArry
 */
function dealRawText(str, filterArray = [], itemConfig) {
  if (itemConfig && itemConfig.category === 'subject_summary') {
    return str;
  }
  if (itemConfig && itemConfig.category === 'subject_title') {
    return str.replace(/(?:(\d+))(\)|）).*$/, '$1$2');
  }
  if (itemConfig && itemConfig.separator) {
    str = splitText(str, itemConfig);
  }
  const textList = ['\\(.*\\)', '（.*）', ...filterArray];
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}
/**
 * 通过关键字查找DOM
 * @param {Object} itemConfig 
 * @returns {Object[]}
 */
function getDOMByKeyWord(itemConfig) {
  let targets;
  // 有父节点, 基于二级选择器
  if (itemConfig.selector) {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord, $qs(itemConfig.selector));
  } else {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord);
  }
  if (targets && targets.length) {
    var $t = targets[targets.length - 1];
    // 相邻节点
    if (itemConfig.sibling) {
      $t = targets[targets.length - 1].nextElementSibling;
    }
    return $t;
  }
}
function splitText(text, itemConfig) {
  const s = {
    ':': ':|：',
    ',': ',|，'
  };
  var t = text.split(new RegExp(s[itemConfig.separator]));
  return t[t.length - 1].trim();
}
/**
 * 查找包含文本的标签
 * @param {string} selector 
 * @param {string} text 
 */
function contains(selector, text, $parent) {
  var elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = $qs(selector);
  }
  if (Array.isArray(text)) {
    text = text.join('|');
  }
  return [].filter.call(elements, function (element) {
    return new RegExp(text).test(element.innerText);
  });
}

module.exports = {
  getCoverURL,
  getWikiItem,
  getQueryInfo,
  getSubType
};
