/**
 * dollar 选择符
 * @param {string} selector 
 */
function $(selector) {
  return document.querySelector(selector);
}

function sleep(t) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(t);
    }, t);
  });
}

/**
 * 填写条目信息
 * @param {Object[]} info
 */
async function fillInfoBox(data) {

  const info = data.subjectInfoList;
  const subType = data.subType;
  var infoArray = [];
  var $typeInput = document.querySelectorAll('table tr:nth-of-type(2) > td:nth-of-type(2) input');
  if ($typeInput) {
    $typeInput[0].click();
    if (!isNaN(subType)) {
      $typeInput[subType].click();
    }
  }
  await sleep(100);

  var $wikiMode = $('table small a:nth-of-type(1)[href="javascript:void(0)"]');
  var $newbeeMode = $('table small a:nth-of-type(2)[href="javascript:void(0)"]');
  for (var i = 0, len = info.length; i < len; i++) {
    if (info[i].category === 'subject_title') {
      let $title = $('input[name=subject_title]');
      $title.value = info[i].data;
      continue;
    }
    if (info[i].category === 'subject_summary') {
      let $summary = $('#subject_summary');
      $summary.value = info[i].data;
      continue;
    }
    // 有名称并且category不在制定列表里面
    if (info[i].name && ['cover'].indexOf(info[i].category) === -1) {
      infoArray.push(info[i]);
    }
  }
  $wikiMode.click();
  setTimeout(async () => {
    _fillInfoBox(infoArray);
    await sleep(300);
    $newbeeMode.click();
  }, 100);

}

function dealDate(dataStr) {
  let l = dataStr.split('/');
  return l.map((i) => {
    if (i.length === 1){
      return `0${i}`;
    }
    return i;
  }).join('-');
}

function _fillInfoBox(infoArray) {
  var $infobox = $('#subject_infobox');
  var arr = $infobox.value.split('\n');
  var newArr = [];
  for (var info of infoArray) {
    let isDefault = false;
    for (var i = 0, len = arr.length; i < len; i++) {
      let n = arr[i].replace(/\||=.*/g, '');
      if (n === info.name) {
        let d = info.data;
        if (info.category === 'date') {
          d = dealDate(d);
        }
        arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
        isDefault = true;
        break;
      }
    }
    if (!isDefault && info.name) {
      newArr.push(`|${info.name}=${info.data}`);
    }
  }
  arr.pop();
  $infobox.value = [...arr, ...newArr, '}}'].join('\n');
}
module.exports = fillInfoBox;
