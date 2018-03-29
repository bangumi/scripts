var amazonSubjectModel = {
  key: 'amazon_jp_book',
  description: '日亚图书',
  newSubjectType: 1,
  entrySelector: 'xx',
  targetURL: 'xxx',
  cover: {
    selector: 'img#imgBlkFront'
    // selector: 'img#igImage'
  },
  subType: {
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    separator: ':',
    keyWord: 'ページ'
  },
  itemList: []
}

amazonSubjectModel.itemList.push(
  {
    name: '名称',
    selector: '#productTitle',
    keyWord: '',
    category: 'subject_title'
  },
  {
    name: 'ISBN',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: 'ISBN-10',
    separator: ':',
    category: 'ISBN'
  },
  {
    name: 'ISBN-13',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: 'ISBN-13',
    separator: ':',
    category: 'ISBN-13'
  },
  {
    name: '发售日',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: '発売日',
    separator: ':',
    category: 'date'
  },
  {
    name: '作者',
    selector: '#bylineInfo .author span.a-size-medium'
  },
  {
    name: '出版社',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    separator: ':',
    keyWord: '出版社'
  },
  {
    name: '页数',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    separator: ':',
    keyWord: 'ページ'
  },
  {
    name: '价格',
    selector: '.swatchElement.selected .a-color-base'
  },
  {
    name: '内容简介',
    selector: '#productDescription',
    subSelector: 'h3',
    sibling: true,
    keyWord: ['内容紹介', '内容'],
    category: 'subject_summary'
  }
)

module.exports = amazonSubjectModel;
