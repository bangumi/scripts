// ==UserScript==
// @name         bgm.tv条目页系列索引
// @namespace    https://xizo.xyz/
// @version      1.0
// @description  在番剧条目下添加系列索引
// @author       Xizo
// @match        http://bgm.tv/subject/*
// @match        http://bangumi.tv/subject/*
// @match        https://bgm.tv/subject/*
// @match        https://bangumi.tv/subject/*
// @icon         https://bgm.tv/img/favicon.ico
// @license      MIT
// ==/UserScript==

const SeasonListLocalStorageOpenedKey = 'seasonlist-opended';

async function fetchSubjectInfo(subjectId) {
    const response = await fetch(`https://api.bgm.tv/v0/subjects/${subjectId}`);
    const data = await response.json();
    
    const platform = data.platform;
    if (platform !== 'TV' && platform !== '剧场版') {
        return [];
    }

    return {
        id: data.id,
        name: data.name,
        name_cn: data.name_cn || '',
        largeImage: data.images?.large || ''
    };
}

async function fetchRelatedSubjects(subjectId) {
    const response = await fetch(`https://api.bgm.tv/v0/subjects/${subjectId}/subjects`);
    return await response.json();
}

function findMinIdByRelation(items, relation) {
    const filtered = items.filter(item => item.relation === relation);
    if (filtered.length === 0) return null;
    return filtered.reduce((min, curr) => curr.id < min.id ? curr : min, filtered[0]);
}

async function collectSeries(initialId) {
    try {
        const initialInfo = await fetchSubjectInfo(initialId);
        const result = [initialInfo];

        let currentId = initialId;
        const predecessors = [];
        while (true) {
            const items = await fetchRelatedSubjects(currentId);
            const pre = findMinIdByRelation(items, '前传');
            if (!pre) break;
            
            predecessors.unshift({
                id: pre.id,
                name: pre.name,
                name_cn: pre.name_cn || '',
                largeImage: pre.images.common
            });
            currentId = pre.id;
        }
        result.unshift(...predecessors);

        currentId = initialId;
        const successors = [];
        while (true) {
            const items = await fetchRelatedSubjects(currentId);
            const seq = findMinIdByRelation(items, '续集');
            if (!seq) break;
            
            successors.push({
                id: seq.id,
                name: seq.name,
                name_cn: seq.name_cn || '',
                largeImage: seq.images.common
            });
            currentId = seq.id;
        }
        result.push(...successors);

        return result;

    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

(function(htmlFunc) {
    const match = location.pathname.match(/^\/subject\/(\d+)(\?|$)/);
    if (!match) return;
    const bangumiId = +match[1];

    collectSeries(bangumiId)
        .then(series => {
            const htmlText = htmlFunc({ series });

            let el = document.createElement('div');
            el.innerHTML = htmlText;
            el = el.children[0];

            if (document.querySelector('.subject_section.clearit.anitabi-bangumi-inset-section-box')) {
                let sectionOne = document.querySelector('.subject_section.clearit.anitabi-bangumi-inset-section-box');
                sectionOne.parentNode.insertBefore(el, sectionOne.nextSibling);
            } else {
                let sectionOne = document.querySelector('.subject_section:nth-child(3)');
                if (!sectionOne) sectionOne = document.querySelector('.subject_section');
                if (!sectionOne) return;
                sectionOne.parentNode.insertBefore(el, sectionOne);
            }

            el.querySelector('h2').onclick = () => {
                let opened = el.getAttribute('data-opened') === 'true';
                opened = !opened;
                el.setAttribute('data-opened', opened);
                localStorage.setItem(SeasonListLocalStorageOpenedKey, opened);
            };
            el.setAttribute('data-opened', localStorage.getItem(SeasonListLocalStorageOpenedKey) || 'true');

            $('.seasonlist-bangumi-inset-section-box *[title]').tooltip({
                offset: 0
            });
        })
        .catch(err => console.error(err));
})(({
    series,
}) => `
<div class="subject_section clearit seasonlist-bangumi-inset-section-box">
    <style>
    .seasonlist-bangumi-inset-section-box{
        overflow: hidden;
        --seasonlist-point-cover-width: 142px;
        --seasonlist-point-cover-height: 80px;
        --seasonlist-point-margin: 8px;
    }
    .seasonlist-section-head{
        line-height: 28px;
        padding-bottom: 5px;
    }
    .seasonlist-section-head .chiiBtn{
        margin: 0;
    }
    .seasonlist-section-head h2{
        line-height: inherit;
        cursor: pointer;
    }
    .seasonlist-section-head h2 .fold-btn{
        font-weight: 400;
        font-size: 12px;
        line-height: 24px;
        margin: 2px 0 0 4px;
        display: inline-block;
        vertical-align: top;
        opacity: 0.8;
        background: rgba(128,128,128,.2);
        padding: 0 10px;
        border-radius: 20px;
    }
    .seasonlist-section-head h2 .fold-btn:before{
        content: '显示';
    }
    .seasonlist-bangumi-inset-section-box[data-opened="true"] .seasonlist-section-head h2 .fold-btn:before{
        content: '折叠';
    }
    .seasonlist-bangumi-inset-section-box[data-opened="false"] .seasonlist-bangumi-info-box{
        display: none;
    }
    .seasonlist-point-info-box{
        line-height: 16px;
    }
    .seasonlist-point-info-box span{
        opacity: .5;
    }
    .seasonlist-point-info-box .ep{
        margin-right: 2px;
    }
    .seasonlist-point-info-box .s{
        opacity: .7;
    }
    </style>
    <div class="seasonlist-section-head clearit">
        <h2 class="subtitle ll">
            系列作品
            <a class="fold-btn"></a>
        </h2>
    </div>
    <div class="seasonlist-bangumi-info-box">
        <div class="content_inner">
            <ul class="browserCoverMedium clearit">
                ${series.map(item => `
                    <li style="height: 160px;">
                        <a href="/subject/${item.id}" title="${item.name_cn}" class="avatar thumbTip" data-original-title="${item.name_cn}">
                            <span class="avatarNeue avatarSize75" style="background-image:url('${item.largeImage.slice(6)}'); filter: blur(0.5px)"></span>
                        </a>
                        <a href="/subject/${item.id}" class="title" style="height: 90px !important">${item.name}</a>
                    </li>
                `).join('')}
            </ul>
        </div>
    </div>
</div>`);
