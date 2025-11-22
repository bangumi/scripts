// ==UserScript==
// @name         Bangumi BBCode to HTML
// @namespace    bbcode.bangumi
// @version      1.1.0
// @description  将 bangumi BBCode 转为 HTML
// @author       you
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function bbcodeToHtml(bbcode, depth = 0, maxDepth = 10) {
        if (!depth) {
            const gifIds = new Set([11, 23, 500, 501, 505, 515, 516, 517, 518, 519, 521, 522, 523]);
            bbcode = bbcode
                .replace(/\(bgm(\d+)\)/g, (_, n) => {
                    const num = +n;
                    const url = num < 23
                        ? `/img/smiles/bgm/${num}.${gifIds.has(num) ? 'gif' : 'png'}`
                        : num < 200
                            ? `/img/smiles/tv/${(num - 23).toString().padStart(2, '0')}.gif`
                            : num < 500
                                ? `/img/smiles/tv_vs/bgm_${num}.png`
                                : `/img/smiles/tv_500/bgm_${num}.${gifIds.has(num) ? 'gif' : 'png'}`;
                    return `<img src="${url}" smileid="${num + 16}" alt="(bgm${num})"${[124, 125].includes(num) ? ' width="21"' : ''}>`;
                })
                .replace(/\(bmo([A-Za-z0-9-]+)\)/g, (_, code) => {
                    return `<span class="bmo" data-code="(bmo${code})"><canvas class="bmoji-canvas" style="width: 21px; height: 21px;" width="63" height="63"></canvas></span>`;
                })
                .replace(/\[img(?:=(\d+),(\d+))?\]([^[]+)\[\/img\]/g, (_, w, h, url) =>
                    `<img class="code" src="${url.trim()}" rel="noreferrer" referrerpolicy="no-referrer" alt="${url.trim()}" loading="lazy"${w && h ? ` width="${w}" height="${h}"` : ''}>`
                )
                .replace(/\[photo\]([^[]+)\[\/photo\]/g, (_, c) =>
                    `<img class="code" src="//lain.bgm.tv/pic/photo/l/${c}" rel="noreferrer" referrerpolicy="no-referrer" alt="photo" loading="lazy">`
                )
                .replace(/\n/g, '<br>');
        }

        if (depth >= maxDepth) return bbcode;

        const tags = {
            'float': (v, c) => `<span style="float:${v}">${c}</span>`,
            'size': (v, c) => `<span style="font-size:${v}px">${c}</span>`,
            'url': (v, c) => `<a class="l" href="${v}" target="_blank" rel="nofollow external noopener noreferrer">${c ?? v}</a>`,
            'align': (v, c) => `<p align="${v}">${c}</p>`,
            'color': (v, c) => `<span style="color:${v};">${c}</span>`,
            'b': c => `<span style="font-weight:bold">${c}</span>`,
            'i': c => `<span style="font-style:italic">${c}</span>`,
            'u': c => `<span style="text-decoration:underline">${c}</span>`,
            's': c => `<span style="text-decoration:line-through">${c}</span>`,
            'mask': c => `<span class="text_mask" style="background-color:#555;color:#555;border:1px solid #555;"><span class="inner">${c}</span></span>`,
            'quote': c => `<div class="quote"><q>${c}</q></div>`,
            'left': c => `<p style="text-align:left">${c}</p>`,
            'right': c => `<p style="text-align:right">${c}</p>`,
            'center': c => `<p style="text-align:center">${c}</p>`
        };

        let updated = false;
        const processed = bbcode
            .replace(/\[([a-z]+)=([^\]]+)\]([\s\S]*?)\[\/\1\]/gi, (m, t, v, c) => {
                if (tags[t]) {
                    updated = true;
                    return tags[t](v, bbcodeToHtml(c, depth + 1, maxDepth));
                }
                return m;
            })
            .replace(/\[([a-z]+)\]([\s\S]*?)\[\/\1\]/gi, (m, t, c) => {
                if (tags[t]) {
                    updated = true;
                    return tags[t](bbcodeToHtml(c, depth + 1, maxDepth));
                }
                return m;
            });

        return updated ? bbcodeToHtml(processed, depth + 1, maxDepth) : processed;
    }

    window.bbcodeToHtml = bbcodeToHtml;
})();
