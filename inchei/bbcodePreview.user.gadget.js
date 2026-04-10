// ==UserScript==
// @name         bbcode预览
// @namespace    bangumi.bbcode.preview
// @version      0.0.1
// @description  bbcode预览
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @grant        none
// @license      MIT
// @gf
// ==/UserScript==

(function () {
  'use strict';

  // #region bbcodeToHtml
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
        return `<div class="codeHighlight" style="max-width:700px"><pre>${escaped.replaceAll('\n', '\n<br>')}</pre></div>`;
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
  // #endregion

  const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
  const style = document.createElement('style');
  style.textContent = css`
    .bbcodePreview {
      font-size: 14px;
      margin-block: 10px;
      font-family: 'SF Pro SC','SF Pro Display','PingFang SC','Lucida Grande','Helvetica Neue',Helvetica,Arial,Verdana,sans-serif,"Hiragino Sans GB";
    }
    .bbcodePreviewBtn a {
      background-position: center;
      background-repeat: no-repeat;
      background-size: 16px;
      filter: invert(100%) brightness(.6);
      background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzc1NjI5OTkyMjUwIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE4MjQiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTUxMiAzNTJhMTYwIDE2MCAwIDEgMCAwIDMyMCAxNjAgMTYwIDAgMCAwIDAtMzIwek00NTguNjY2NjY3IDUxMmE1My4zMzMzMzMgNTMuMzMzMzMzIDAgMSAxIDEwNi42NjY2NjYgMCA1My4zMzMzMzMgNTMuMzMzMzMzIDAgMCAxLTEwNi42NjY2NjYgMHoiIHAtaWQ9IjE4MjUiPjwvcGF0aD48cGF0aCBkPSJNNTEyIDIwMi42NjY2NjdjLTEzNi40MDUzMzMgMC0yNTUuMTA0IDczLjM4NjY2Ny0zMzUuNzQ0IDE0MC4yODhhOTM0LjE4NjY2NyA5MzQuMTg2NjY3IDAgMCAwLTEyMy42NDggMTI0LjQxNmMtMy4xMTQ2NjcgMy44NC03LjE2OCA5LjA0NTMzMy03LjE2OCA5LjA0NTMzM2wtNy4yNTMzMzMgOS4wNDUzMzNhNDIuNjY2NjY3IDQyLjY2NjY2NyAwIDAgMCAwIDUzLjA3NzMzNGw3LjI1MzMzMyA5LjA0NTMzM3M0LjA1MzMzMyA1LjIwNTMzMyA3LjE2OCA5LjA0NTMzM2E5MzQuNDg1MzMzIDkzNC40ODUzMzMgMCAwIDAgMTIzLjY0OCAxMjQuNDU4NjY3QzI1Ni44OTYgNzQ3Ljg2MTMzMyAzNzUuNTk0NjY3IDgyMS4zMzMzMzMgNTEyIDgyMS4zMzMzMzNzMjU1LjEwNC03My4zODY2NjcgMzM1Ljc0NC0xNDAuMjg4YTkzNC40IDkzNC40IDAgMCAwIDEyMy42NDgtMTI0LjQxNmMzLjExNDY2Ny0zLjg0IDUuNTQ2NjY3LTYuODY5MzMzIDcuMjEwNjY3LTkuMDQ1MzMzbDEuOTYyNjY2LTIuNTYgNS4wNzczMzQtNi4zNTczMzNhNDIuNjY2NjY3IDQyLjY2NjY2NyAwIDAgMCAwLjEyOC01My4xMmwtNS4yMDUzMzQtNi41NzA2NjctMS45NjI2NjYtMi41NmE4MTQuNzIgODE0LjcyIDAgMCAwLTMzLjc5Mi00MC4xMDY2NjcgOTM0LjEwMTMzMyA5MzQuMTAxMzMzIDAgMCAwLTk3LjA2NjY2Ny05My4zNTQ2NjZDNzY3LjEwNCAyNzYuMDUzMzMzIDY0OC40MDUzMzMgMjAyLjY2NjY2NyA1MTIgMjAyLjY2NjY2N3ogbS0zNTMuNDkzMzMzIDMxMy42NDI2NjZhNzQ5LjIyNjY2NyA3NDkuMjI2NjY3IDAgMCAxLTMuODQtNC4zMDkzMzNsMy44NC00LjMwOTMzM2E4MjcuMzA2NjY3IDgyNy4zMDY2NjcgMCAwIDEgODUuODQ1MzMzLTgyLjY0NTMzNEMzMTguMTIyNjY3IDM2My45NDY2NjcgNDEyLjc1NzMzMyAzMDkuMzMzMzMzIDUxMiAzMDkuMzMzMzMzYzk5LjI0MjY2NyAwIDE5My44NzczMzMgNTQuNjEzMzMzIDI2Ny42NDggMTE1LjcxMkE4MjcuNDM0NjY3IDgyNy40MzQ2NjcgMCAwIDEgODY5LjMzMzMzMyA1MTJsLTMuODQgNC4zMDkzMzNhODI3LjM0OTMzMyA4MjcuMzQ5MzMzIDAgMCAxLTg1Ljg0NTMzMyA4Mi42NDUzMzRDNzA1Ljg3NzMzMyA2NjAuMDUzMzMzIDYxMS4yNDI2NjcgNzE0LjY2NjY2NyA1MTIgNzE0LjY2NjY2N2MtOTkuMjQyNjY3IDAtMTkzLjg3NzMzMy01NC42MTMzMzMtMjY3LjY0OC0xMTUuNzEyQTgyNy4yNjQgODI3LjI2NCAwIDAgMSAxNTguNTA2NjY3IDUxNi4yNjY2Njd6IiBwLWlkPSIxODI2Ij48L3BhdGg+PC9zdmc+");
    }
    .bbcodePreviewBtn a:hover {
      filter: invert(100%) brightness(.3);
    }
    .bbcodePreviewBtn.disabled a {
      background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzc1NjI5OTk2OTA3IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE5NzUiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTI2Mi4xNDQgODIuMDQ4YTUzLjMzMzMzMyA1My4zMzMzMzMgMCAwIDAtMTkuNDk4NjY3IDcyLjg3NDY2N2w0NDMuMDkzMzM0IDc2Ny40ODhhNTMuMzMzMzMzIDUzLjMzMzMzMyAwIDAgMCA5Mi4zNzMzMzMtNTMuMzMzMzM0TDMzNS4wMTg2NjcgMTAxLjU4OTMzM2E1My4zMzMzMzMgNTMuMzMzMzMzIDAgMCAwLTcyLjg3NDY2Ny0xOS41NDEzMzN6TTE3Ni4yNTYgMzQyLjk1NDY2N2E3NTEuNTMwNjY3IDc1MS41MzA2NjcgMCAwIDEgOTcuOTItNjkuMjQ4bDUzLjMzMzMzMyA5Mi4zNzMzMzNjLTI5Ljc4MTMzMyAxNy41Nzg2NjctNTcuNzI4IDM3Ljg4OC04My4yIDU4Ljk2NTMzM0E4MjcuMzA2NjY3IDgyNy4zMDY2NjcgMCAwIDAgMTU0LjY2NjY2NyA1MTJsMy44ODI2NjYgNC4zMDkzMzNjMjAuMzA5MzMzIDIyLjYxMzMzMyA0OS43MDY2NjcgNTIuNjkzMzMzIDg1Ljg0NTMzNCA4Mi42NDUzMzRDMzE4LjEyMjY2NyA2NjAuMDUzMzMzIDQxMi43NTczMzMgNzE0LjY2NjY2NyA1MTIgNzE0LjY2NjY2N2M1LjUwNCAwIDExLjAwOC0wLjE3MDY2NyAxNi40NjkzMzMtMC41MTJsNTcuNzcwNjY3IDEwMC4wNTMzMzNhMzk2LjU4NjY2NyAzOTYuNTg2NjY3IDAgMCAxLTc0LjI0IDcuMTI1MzMzYy0xMzYuNDA1MzMzIDAtMjU1LjEwNC03My4zODY2NjctMzM1Ljc0NC0xNDAuMjg4YTkzNC40ODUzMzMgOTM0LjQ4NTMzMyAwIDAgMS0xMjMuNjQ4LTEyNC40MTZsLTcuMjEwNjY3LTkuMDQ1MzMzLTcuMTY4LTkuMDQ1MzMzYTQyLjY2NjY2NyA0Mi42NjY2NjcgMCAwIDEgMC01My4wNzczMzRsNy4xNjgtOS4wNDUzMzMgNy4yMTA2NjctOS4wNDUzMzNjNi4xODY2NjctNy41OTQ2NjcgMTUuMTQ2NjY3LTE4LjMwNCAyNi41ODEzMzMtMzEuMDYxMzM0YTkzNC4xODY2NjcgOTM0LjE4NjY2NyAwIDAgMSA5Ny4wNjY2NjctOTMuMzU0NjY2eiIgcC1pZD0iMTk3NiI+PC9wYXRoPjxwYXRoIGQ9Ik0zNTIgNTEyYzAtMjYuMjgyNjY3IDYuMzU3MzMzLTUxLjExNDY2NyAxNy41Nzg2NjctNzMuMDAyNjY3bDEzNC40IDIzMi43ODkzMzRBMTYwIDE2MCAwIDAgMSAzNTIgNTEyek01MTkuOTM2IDM1Mi4yMTMzMzNsMTM0LjQgMjMyLjgzMmExNjAgMTYwIDAgMCAwLTEzNC40NDI2NjctMjMyLjg3NDY2NnoiIHAtaWQ9IjE5NzciPjwvcGF0aD48cGF0aCBkPSJNNzc5LjY0OCA1OTguOTU0NjY3Yy0yNS40NzIgMjEuMTItNTMuNDE4NjY3IDQxLjM4NjY2Ny04My4yIDU5LjAwOGw1My4zMzMzMzMgOTIuMzczMzMzYTc1MS44NzIgNzUxLjg3MiAwIDAgMCA5Ny45NjI2NjctNjkuMjkwNjY3IDkzNC44MjY2NjcgOTM0LjgyNjY2NyAwIDAgMCAxMjMuNjQ4LTEyNC40MTZjMy4xMTQ2NjctMy44NCA1LjU0NjY2Ny02Ljg2OTMzMyA3LjE2OC05LjA0NTMzM2wyLjAwNTMzMy0yLjU2IDUuMDc3MzM0LTYuMzU3MzMzYTQyLjY2NjY2NyA0Mi42NjY2NjcgMCAwIDAgMC4xMjgtNTMuMTJsLTUuMjA1MzM0LTYuNTcwNjY3LTIuMDA1MzMzLTIuNTZhODE0LjcyIDgxNC43MiAwIDAgMC0zMy43OTItNDAuMTA2NjY3IDkzNC41MjggOTM0LjUyOCAwIDAgMC05Ny4wMjQtOTMuMzU0NjY2Yy04MC42NC02Ni44NTg2NjctMTk5LjMzODY2Ny0xNDAuMjg4LTMzNS43ODY2NjctMTQwLjI4OC0yNS4zODY2NjcgMC01MC4xNzYgMi41Ni03NC4yNCA3LjEyNTMzM2w1Ny43NzA2NjcgMTAwLjA1MzMzM2M1LjQ2MTMzMy0wLjM0MTMzMyAxMC45NjUzMzMtMC41MTIgMTYuNTEyLTAuNTEyIDk5LjI0MjY2NyAwIDE5My44NzczMzMgNTQuNjEzMzMzIDI2Ny42NDggMTE1LjcxMkE4MjcuODE4NjY3IDgyNy44MTg2NjcgMCAwIDEgODY5LjMzMzMzMyA1MTJsLTMuODQgNC4zMDkzMzNhODI3Ljc3NiA4MjcuNzc2IDAgMCAxLTg1Ljg0NTMzMyA4Mi42NDUzMzR6IiBwLWlkPSIxOTc4Ij48L3BhdGg+PC9zdmc+");
    }
  `;
  document.head.append(style);

  let defaultPreview = chiiApp.cloud_settings.get('bbcodePreview') !== 'off';

  chiiLib.ukagaka.addGeneralConfig({
    title: '默认开启 BBCode 预览',
    name: 'bbcodePreview',
    type: 'radio',
    defaultValue: 'on',
    getCurrentValue: () => chiiApp.cloud_settings.get('bbcodePreview') || 'on',
    onChange: v => {
      chiiApp.cloud_settings.update({ bbcodePreview: v });
      defaultPreview = v;
    },
    options: [
      { value: 'on', label: '开启' },
      { value: 'off', label: '关闭' }
    ]
  });

  function loadPreview(board, bbcode) {
    console.log(bbcode);
    board.innerHTML = bbcodeToHtml(bbcode);
    renderBMO(board);
  }

  function addPreview() {
    document.querySelectorAll('.markItUpHeader').forEach(header => {
      if (header.querySelector('.bbcodePreviewBtn')) return;

      const textarea = header.parentElement.querySelector('textarea');

      const board = document.createElement('div');
      board.className = 'bbcodePreview';
      board.hidden = true;
      header.parentElement.parentElement.after(board);

      let debounceTimer = null;
      let isComposing = false;

      const handleInput = () => {
        if (isComposing) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const bbcode = textarea.value;
          loadPreview(board, bbcode);
        }, 500);
      };

      const handleToolbarClick = (e) => {
        if (e.target.closest('.markItUpButton')) {
          setTimeout(() => {
            if (!isComposing) {
              const bbcode = textarea.value;
              loadPreview(board, bbcode);
            }
          }, 10);
        }
      };

      const handleCompositionStart = () => {
        isComposing = true;
      };

      const handleCompositionEnd = () => {
        isComposing = false;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const bbcode = textarea.value;
          loadPreview(board, bbcode);
        }, 500);
      };

      const li = document.createElement('li');
      li.className = 'markItUpButton expand tool-ico bbcodePreviewBtn disabled';
      li.innerHTML = '<a href="javascript:" title="预览"></a>';
      li.addEventListener('click', () => {
        const hidden = board.hidden;
        board.hidden = !hidden;
        li.classList.toggle('disabled');

        if (hidden) {
          header.addEventListener('click', handleToolbarClick, true);
          textarea.addEventListener('input', handleInput);
          textarea.addEventListener('change', handleInput);
          textarea.addEventListener('compositionstart', handleCompositionStart);
          textarea.addEventListener('compositionend', handleCompositionEnd);
          const bbcode = textarea.value;
          loadPreview(board, bbcode);
        } else {
          header.removeEventListener('click', handleToolbarClick, true);
          textarea.removeEventListener('input', handleInput);
          textarea.removeEventListener('change', handleInput);
          textarea.removeEventListener('compositionstart', handleCompositionStart);
          textarea.removeEventListener('compositionend', handleCompositionEnd);
          clearTimeout(debounceTimer);
        }
      });
      header.firstElementChild.append(li);

      if (defaultPreview) {
        li.click();
      }
    });
  }

  addPreview();

  const observer = new MutationObserver(() => addPreview());
  observer.observe(document.body, { childList: true, subtree: true });
})();