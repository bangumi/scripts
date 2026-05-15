// ==UserScript==
// @name         Citing Bangumi
// @namespace    https://github.com/0And1Story
// @version      0.2.1
// @description  Cite books/games/animes/music on Bangumi.
// @author       0And1Story
// @homepage     https://bgm.tv/dev/app/5701
// @license      MIT
// @match        https://bgm.tv/subject/*
// @match        https://bangumi.tv/subject/*
// @match        https://chii.in/subject/*
// @exclude      https://*/subject/*/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

const debug = false

const mapping = {
    title: '中文名',
    author: ['作者', '剧本', '原作', '脚本', '作曲', '导演', '编剧'],
    isbn: 'ISBN',
    publisher: ['出版社', '开发', '动画制作', '厂牌', '制作'],
    date: ['发售日', '发行日期', '放送开始', '发售日期', '开始'],
    chineseTitle: '中文名',
    alias: '别名'
}

const formatMapping = {
    '书籍': 'book',
    '游戏': 'software',
    '动画': 'video',
    '音乐': 'music',
    '三次元': 'video'
}

const availableBibKeys = [
    'title',
    'author',
    'isbn',
    'publisher',
    'year',
    'month',
    'day',
    'url'
]
const keepRawBibKeys = ['title']

function parseSubContainer(li) {
    const obj = {}
    const arr = []

    const subSection = li.querySelector('.sub_section')
    const key = subSection?.querySelector('.tip')?.textContent.replace(':', '').trim()

    if (!key) return [undefined, undefined]

    const subGrid = li.querySelector('.sub_grid')
    if (subGrid) {
        const subValues = [...subGrid.querySelectorAll('.tag')].map(n => n.textContent.trim())
        arr.push(...subValues)
        return [key, arr]
    }

    const firstValue = [...subSection.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)[0]?.textContent.trim()
    if (firstValue) arr.push(firstValue)

    const subs = li.querySelectorAll('.sub')

    let isObject = [...li.querySelectorAll('.sub .tip')].filter(n => n.style.display !== 'none').length > 0

    if (isObject) {
        for (const sub of subs) {
            const tip = sub.querySelector('.tip')
            const subKey = tip.textContent.trim()
            const subValue = [...sub.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)[0]?.textContent.trim()
            obj[subKey] = subValue
        }
        return [key, obj]
    } else {
        for (const sub of subs) {
            const subValue = [...sub.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)[0]?.textContent.trim()
            arr.push(subValue)
        }
        return [key, arr]
    }
}

function getInfoKeyValue(li) {
    if (!li) return [undefined, undefined]
    if (li.classList.contains('sub_container')) return parseSubContainer(li)

    const content = li.textContent.trim()
    const index = content.indexOf(': ')
    if (index === -1) return [content, undefined]
    return [content.slice(0, index), content.slice(index + 2)]
}

function parseDate(str) {
    if (!str) return {}
    if (Array.isArray(str)) {
        let result = []
        for (const s of str) {
            result.push(parseDate(s))
        }
        return {
            year: result.map(r => r.year),
            month: result.map(r => r.month),
            day: result.map(r => r.day)
        }
    } else if (typeof str === 'object') {
        let result = {}
        for (const [key, value] of Object.entries(str)) {
            result[key] = parseDate(value)
        }
        return {
            year: Object.fromEntries(Object.entries(result).map(([key, value]) => [key, value.year])),
            month: Object.fromEntries(Object.entries(result).map(([key, value]) => [key, value.month])),
            day: Object.fromEntries(Object.entries(result).map(([key, value]) => [key, value.day]))
        }
    }

    str = str.trim()
    if (str.match(/^\d{4}$/)) return { year: str }
    if (str.match(/^\d+年\d+月\d+日$/)) str = str.replace(/^(\d+)年(\d+)月(\d+)日$/, `$1-$2-$3`)

    const date = new Date(Date.parse(str))
    if (!date.getFullYear()) return { year: str }

    return {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString(),
        day: date.getDate().toString()
    }
}

function getOriginalTitle() {
    return document.querySelector('#headerSubject > h1 > a')?.textContent
}

function getUrl() {
    return window.location.href
}

function getSubjectType() {
    return document.querySelector('#siteSearchSelect')?.selectedOptions?.[0]?.textContent
}

function getInfobox() {
    const infobox = document.querySelector('#infobox')
    if (!infobox) {
        console.error('Cannot find infobox, BibTeX generation failed.')
        return {}
    }

    let info = {}
    const lis = [...infobox.children]
    for (const li of lis) {
        const [key, value] = getInfoKeyValue(li)
        if (key) info[key] = value
    }
    return info
}

function toBibInfo(info) {
    let bib = {}

    for (const [key, value] of Object.entries(mapping)) {
        let values = value
        if (!Array.isArray(value)) values = [value]
        for (const value of values) {
            if (info.hasOwnProperty(value)) {
                bib[key] = info[value]
                break
            }
        }
    }

    const title = getOriginalTitle()
    if (title) bib.title = title
    if (bib.hasOwnProperty('date')) {
        bib = { ...bib, ...parseDate(bib.date) }
    }
    bib.url = getUrl()

    return bib
}

function filterBibInfo(bib) {
    const bibEntries = Object.entries(bib)
    .filter(([key, value]) => availableBibKeys.indexOf(key) !== -1)
    .map(([key, value]) => [key, typeof value === 'object' ? Object.values(value) : value])
    .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    return Object.fromEntries(bibEntries)
}

function toBibTex(bib) {
    let bibtex = ''
    const indent = '  '

    const filteredBib = filterBibInfo(bib)
    if (debug) console.log(filteredBib)

    bibtex += `@${formatMapping[getSubjectType()]}{${bib.chineseTitle || bib.title},\n`
    const padLength = Math.max(...Object.keys(filteredBib).map(key => key.length))
    for (const [key, value] of Object.entries(filteredBib)) {
        if (keepRawBibKeys.indexOf(key) !== -1) bibtex += `${indent}${key.padEnd(padLength)} = {{${value}}},\n`
        else bibtex += `${indent}${key.padEnd(padLength)} = {${value}},\n`
    }
    bibtex += `}`

    return bibtex
}

function displayBibTex(bibtex) {
    if (document.querySelector('#bangumi-bibtex')) return

    const box = document.querySelector('#subject_detail')
    if (!box) console.error('Cannot find subject detail box, display BibTeX failed.')

    const div = document.createElement('div')
    div.id = 'bangumi-bibtex'
    div.classList.add('subject_tag_section')

    const h2 = document.createElement('h2')
    h2.classList.add('subtitle')
    h2.textContent = 'BibTeX'

    const inner = document.createElement('div')
    inner.classList.add('inner')

    const pre = document.createElement('pre')
    pre.textContent = bibtex

    inner.appendChild(pre)
    div.appendChild(h2)
    div.appendChild(inner)
    // div.innerHTML = `<h2 class="subtitle">BibTeX</h2><div class="inner"><pre>${bibtex}</pre></div>`

    box.appendChild(div)
}

(function () {
    'use strict';

    const subjectType = getSubjectType()
    if (!(subjectType in formatMapping)) return

    const info = getInfobox()
    if (debug) console.log(info)
    const bib = toBibInfo(info)
    if (debug) console.log(bib)
    const bibtex = toBibTex(bib)
    if (debug) console.log(bibtex)
    displayBibTex(bibtex)
})();
