const gmFetch = require('./gmFetch').gmFetch;
const delayPromise = require('./delayPromise');
const filterResults = require('./filterResults');

function dealDate(dateStr) {
  return dateStr.replace(/年|月|日/g, '/').replace(/\/$/, '');
}

function htmlToElement(html) {
  var template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}
/**
 * @return {array}
 */
function dealRawHTML(info) {
  var rawInfoList = [];
  let $doc = (new DOMParser()).parseFromString(info, "text/html");
  
  let items = $doc.querySelectorAll('#browserItemList>li>div.inner');
  // get number of page
  let numOfPage = 1;
  let pList = $doc.querySelectorAll('.page_inner>.p');
  if (pList && pList.length) {
    let tempNum = parseInt(pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]);
    numOfPage = parseInt(pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]);
    numOfPage = numOfPage > tempNum ? numOfPage : tempNum;
  }
  if (items && items.length) {
    for (var item of items) {
      let $subjectTitle = item.querySelector('h3>a.l');
      let itemSubject = {
        subjectTitle: $subjectTitle.textContent.trim(),
        subjectURL: 'https://bgm.tv' + $subjectTitle.getAttribute('href'),
        subjectGreyTitle: item.querySelector('h3>.grey') ?
          item.querySelector('h3>.grey').textContent.trim() : '',
      };
      let matchDate = item.querySelector('.info').textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
      if (matchDate) {
        itemSubject.startDate = dealDate(matchDate[0]);
      }
      let $rateInfo = item.querySelector('.rateInfo');
      if ($rateInfo) {
        if ($rateInfo.querySelector('.fade')) {
          itemSubject.averageScore = $rateInfo.querySelector('.fade').textContent;
          itemSubject.ratingsCount = $rateInfo.querySelector('.tip_j').textContent.replace(/[^0-9]/g, '');
        } else {
          itemSubject.averageScore = '0';
          itemSubject.ratingsCount = '少于10';
        }
      } else {
        itemSubject.averageScore = '0';
        itemSubject.ratingsCount = '0';
      }
      rawInfoList.push(itemSubject);
    }
  } else {
    return [];
  }
  return [rawInfoList, numOfPage];
}

/**
 * 搜索bgm条目
 * @param {Object} subjectInfo
 * @param {number} typeNumber
 */
function fetchBangumiDataBySearch(subjectInfo, typeNumber) {
  var startDate;
  if (subjectInfo && subjectInfo.startDate) {
    startDate = subjectInfo.startDate;
  }
  typeNumber = typeNumber || 'all';
  var query = subjectInfo.subjectName;
  console.log(subjectInfo);
  // if (subjectInfo.isbn13) {
  //   query = subjectInfo.isbn13;
  // }
  if (subjectInfo.isbn) {
    query = subjectInfo.isbn;
  }
  if (!query) {
    console.info('Query string is empty');
    return Promise.resolve();
  }
  const url = `https://bgm.tv/subject_search/${encodeURIComponent(query)}?cat=${typeNumber}`;
  console.info('seach bangumi subject URL: ', url);
  return gmFetch(url).then((info) => {
    var [rawInfoList, numOfPage] = dealRawHTML(info);
    return filterResults(rawInfoList, subjectInfo.subjectName, {
      keys: ['subjectTitle', 'subjectGreyTitle'],
      startDate: startDate
    });
  });
}


function fetchBangumiDataByDate(subjectInfo, pageNumber, type, allInfoList) {
  if (!subjectInfo || !subjectInfo.startDate) throw 'no date info';
  const startDate = new Date(subjectInfo.startDate);
  const SUBJECT_TYPE = type || 'game';
  const sort = startDate.getDate() > 15 ? 'sort=date' : '';
  const page = pageNumber ? `page=${pageNumber}` : '';
  let query = '';
  if (sort && page) {
    query = '?' + sort + '&' + page;
  } else if (sort) {
    query = '?' + sort;
  } else if (page) {
    query = '?' + page;
  }
  const url = `https://bgm.tv/${SUBJECT_TYPE}/browser/airtime/${startDate.getFullYear()}-${startDate.getMonth() + 1}${query}`;

  console.log('uuuuuuuu', url)
  return gmFetch(url).then((info) => {
    var [rawInfoList, numOfPage] = dealRawHTML(info);
    pageNumber = pageNumber || 1;

    if (allInfoList) {
      numOfPage = 3
      allInfoList = [...allInfoList, ...rawInfoList];
      if (pageNumber < numOfPage) {
        return delayPromise(1000).then(() => {
          return fetchBangumiDataByDate(subjectInfo, pageNumber + 1, SUBJECT_TYPE, allInfoList)
        })
      }
      return allInfoList;
    }

    let result = filterResults(rawInfoList, subjectInfo.subjectName, {
      keys: ['subjectTitle', 'subjectGreyTitle'],
      startDate: subjectInfo.startDate
    });
    pageNumber = pageNumber || 1;
    if (!result) {
      if (pageNumber < numOfPage) {
        return delayPromise(300).then(() => {
          return fetchBangumiDataByDate(subjectInfo, pageNumber + 1, SUBJECT_TYPE);
        });
      } else {
        throw 'notmatched';
      }
    }
    return result;
  });
}

module.exports = {
  fetchBangumiDataByDate,
  fetchBangumiDataBySearch
};
