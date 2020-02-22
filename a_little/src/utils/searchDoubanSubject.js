const gmFetch = require('./gmFetch').gmFetch;

searchSubject({
  startDate: '2002-01-01',
  subjectName: ''
})
function searchSubject(subjectInfo, cat = '1002') {
  let query = (subjectInfo.subjectName || '').trim()
  // .replace(/（[^0-9]+?）|\([^0-9]+?\)$/, '');
  if (!query) {
    console.info('Query string is empty')
    return Promise.resolve()
  }
  const url = `https://www.douban.com/search?cat=${cat}&q=${encodeURIComponent(query)}`
  return gmFetch(url).then(info => {
    const list = dealRawHTML(info)
    const options = {
      threshold: 0.3,
      location: 0,
      distance: 50,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        "subjectCast"
      ]
    };
    var result = (new Fuse(list, options)).search(query);
    if (subjectInfo.startDate && result.length > 1) {
      const year = new Date(subjectInfo.startDate).getFullYear()
      if (year) {
        options.keys = ['year']
        console.info('previous fuse result: ', result)
        console.info('fuse search by year: ', year)
        result = (new Fuse(result, options)).search(year+'');
      }
    }
    return Promise.resolve(result[0])
  })
}

function dealRawHTML(txt) {
  const $doc = new DOMParser().parseFromString(txt, 'text/html')
  const items = $doc.querySelectorAll(
    '.search-result > .result-list > .result > .content'
  )
  const dealHref = href => {
    const urlParam = href.split('?url=')[1]
    if (urlParam) {
      return decodeURIComponent(urlParam.split('&')[0])
    } else {
      throw 'invalid href'
    }
  }
  return Array.prototype.slice.call(items).map(item => {
    const href = dealHref(
      item.querySelector('.title h3 > a').getAttribute('href')
    )
    const $ratingNums = item.querySelector('.rating-info > .rating_nums')
    let ratingsCount = 0
    let averageScore = 0
    if ($ratingNums) {
      ratingsCount = ($ratingNums.nextElementSibling.innerText.match(/\d+/) || [
        0
      ])[0]
      averageScore = $ratingNums.innerText
    }
    const subjectCast = item.querySelector('.subject-cast').innerText;
    return {
      subjectCast,
      year: (subjectCast.match(/\d{4}$/) || [])[0],
      subjectURL: href,
      averageScore,
      ratingsCount
    }
  })
}
// copy(dealRawHTML(document.body.innerHTML))
