// ==UserScript==
// @name        Bangumi BBCode to HTML
// @namespace   bbcode.bangumi
// @version     2.0.0
// @description 将 bangumi BBCode 转为 HTML
// @author      you
// @license     MIT
// @grant       none
// ==/UserScript==

(function () {
  'use strict';

  const musumeCN = {
    '10': '紧张 1',
    '11': '紧张 2',
    '12': '惊吓',
    '13': '汗',
    '14': '生气',
    '15': '庆祝',
    '16': '自我安慰',
    '17': '哭 1',
    '18': '哭 2',
    '19': '哭 3',
    '20': '死亡',
    '21': '头晕',
    '22': '呆 1',
    '23': '呆 2',
    '24': '呆 3',
    '25': '呆(贴纸) 1',
    '26': '呆(贴纸) 2',
    '27': '呆(贴纸) 3',
    '28': '催眠',
    '29': '笑',
    '30': '笑(指)',
    '31': '害羞 1',
    '32': '害羞 2',
    '33': '睡觉(普通)',
    '34': '睡觉(准备阶段1)',
    '35': '睡觉(准备阶段2)',
    '36': '睡觉 (UU)',
    '37': '闲置',
    '38': '闲置 2',
    '39': '说话',
    '40': '说话 2',
    '41': '期待',
    '42': '唱歌',
    '43': '到达',
    '44': '到达(拿筷子)',
    '45': '到达(拿勺子)',
    '46': '摇铃',
    '47': '敲头',
    '48': '蛋糕',
    '49': '抓拍(手机)',
    '50': '抓拍(摄像机)',
    '51': '驾驶',
    '52': '喝(饮料杯)',
    '53': '馋(筷子)',
    '54': '馋(刀叉)',
    '55': '撬棍 1',
    '56': '撬棍 2',
    '57': '撬棍 3',
    '58': '坐牢 1',
    '59': '坐牢 2',
    '60': '刀 1',
    '61': '刀 2',
    '62': '荧光棒 1',
    '63': '荧光棒 2',
    '64': '冒泡 1',
    '65': '冒泡 2',
    '66': '爱心 1',
    '67': '爱心 2',
    '68': '爱心 3',
    '69': '静音 1',
    '70': '静音 2',
    '71': '记录 1',
    '72': '记录 2',
    '73': '红包 1',
    '74': '红包 2',
    '75': '玫瑰',
    '76': '情书',
    '77': '钱',
    '78': '要米',
    '79': '摸头',
    '80': '说教',
    '81': '指',
    '82': '吃',
    '83': '画板',
    '84': '反向点赞',
    '85': '点赞',
    '86': '行',
    '87': '打字(普通)',
    '88': '打字(生气)',
    '89': '打字(恼怒)',
    '90': '工作(普通)',
    '91': '工作(生气)',
    '92': '工作(小睡)',
    '93': '工作(疲倦)',
    '94': 'Raid 1',
    '95': 'Raid 2',
    '96': '舔舔',
    '99': 'Bug',
    '100': '加油',
    '101': '复活节',
    '102': '枪',
    '103': '扩音器',
    '104': '带薪拉屎(简单模式)',
    '105': '带薪拉屎(困难模式)',
    '106': '加载',
    '107': '喷剂',
    '108': '停止工作',
    '109': '墨镜',
    '110': '像素墨镜',
    '111': '墨镜拿下来',
    '112': '拍蝇',
    '113': '胶带',
    '114': '垃圾桶',
    '115': '垃圾桶(闲置)',
    '116': '垃圾桶(说话)',
    '117': '垃圾桶(说教)',
    '118': '主意',
    '06': '叹号',
    '07': '问号',
    '08': '点头',
    '09': '摇头',
    '01': 'Bits',
    '02': '硬币',
    '03': '喜欢',
    '04': '点赞',
    '05': '收藏'
  };

  function bbcodeToHtml(bbcode, depth = 0, maxDepth = 10) {
    const codeBlocks = [];
    if (!depth) {
      bbcode = bbcode.replace(/\[code\]([\s\S]*?)\[\/code\]/g, (_, content) => {
        codeBlocks.push(content);
        return `\x01CODE_${codeBlocks.length - 1}_CODE\x01`;
      });
      const p = [];
      bbcode = bbcode.replace(/\[(img|url)(?:=[^\]]*)?\].*?\[\/(img|url)\]/g, m => `\x00${p.push(m)-1}\x00`)
        .replace(/https?:\/\/[^\s[\]]+/g, '[url=$&]$&[/url]')
      // eslint-disable-next-line no-control-regex
        .replace(/\x00(\d+)\x00/g, (_, i) => p[i]);
      const gifIds = new Set([11, 23, 500, 501, 505, 515, 516, 517, 518, 519, 521, 522, 523]);
      bbcode = bbcode
        .replace(/\(bgm(\d+)\)/g, (_, n) => {
          const num = +n;
          const url = num <= 23
            ? `/img/smiles/bgm/${num.toString().padStart(2, '0')}.${gifIds.has(num) ? 'gif' : 'png'}`
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
        .replace(/\((musume|blake)_(\d+)\)/g, (_, role, num) => {
          const padded = num.toString().padStart(2, '0');
          return `<img src="//lain.bgm.tv/img/smiles/${role}/${role}_${padded}.gif" class="smile smile-dynamic smile-musume" smileid="${role}_${padded}" alt="(${role}_${padded})" title="${
            musumeCN[padded]
          }" />`;
        })
        .replace(/\[img(?:=(\d+),(\d+))?\]([^[]+)\[\/img\]/g, (_, w, h, url) =>
          `<img class="code" src="${url.trim()}" rel="noreferrer" referrerpolicy="no-referrer" alt="${url.trim()}" loading="lazy"${w && h ? ` width="${w}" height="${h}"` : ''}>`
        )
        .replace(/\[photo(?:=\d+)?\]([^[]+)\[\/photo\]/g, (_, c) =>
          `<img class="code" src="//lain.bgm.tv/pic/photo/l/${c}" rel="noreferrer" referrerpolicy="no-referrer" alt="photo" loading="lazy">`
        )
        .replace(/\n/g, '<br>');
    }

    if (depth >= maxDepth) return bbcode;

    const tags = {
      'float': (v, c) => `<span style="float:${v}">${c}</span>`,
      'size': (v, c) => `<span style="font-size:${v}px">${c}</span>`,
      'url': (v, c) => {
        const reg = /^https?:\/\/(chii\.in|bgm\.tv|bangumi\.tv)/;
        v = v.replace(reg, location.origin);
        c &&= c.replace(reg, location.origin);
        return `<a class="l" href="${v}" target="_blank" rel="nofollow external noopener noreferrer">${c ?? v}</a>`;
      },
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
      'center': c => `<p style="text-align:center">${c}</p>`,
      'code': c => `<div class="codeHighlight"><pre>${c}</pre></div>`,
    };

    let updated = false;
    let processed = bbcode
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

    if (!depth) {
      // eslint-disable-next-line no-control-regex
      processed = processed.replace(/\x01CODE_(\d+)_CODE\x01/g, (_, i) => {
        console.log(codeBlocks[i]);
        const escaped = codeBlocks[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="codeHighlight"><pre>${escaped.replaceAll('\n', '\n<br>')}</pre></div>`;
      });
    }

    return updated ? bbcodeToHtml(processed, depth + 1, maxDepth) : processed;
  }

  async function renderBMO(root) {
    if (!window.Bmoji) {
      const version = window.CHOBITS_VER;
      const script = document.createElement('script');
      script.src = `/js/lib/bmo/bmo.js${version ? `?${version}` : ''}`;
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = () => {
          resolve();
        };
        script.onerror = () => {
          reject(new Error('failed to load bmo'));
        };
      });
    }
    window.Bmoji.renderAll(root);
  }

  window.bbcodeToHtml = bbcodeToHtml;
  window.renderBMO = renderBMO;
})();
