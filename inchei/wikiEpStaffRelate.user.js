// ==UserScript==
// @name         根据章节简介关联制作人员参与
// @namespace    wiki.ep.staff.replate
// @homepage     https://bgm.tv/group/topic/439326
// @version      0.2.8
// @description  从章节页或人物关联页根据章节简介关联制作人员参与
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/ep/*
// @match        http*://bgm.tv/subject/*/add_related/person*
// @match        http*://bgm.tv/person/new*
// @match        http*://bangumi.tv/ep/*
// @match        http*://bangumi.tv/subject/*/add_related/person*
// @match        http*://chii.in/ep/*
// @match        http*://chii.in/subject/*/add_related/person*
// @match        http*://bangumi.tv/person/new*
// @match        http*://chii.in/person/new*
// @grant        none
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/552493
// @gadget       https://bgm.tv/dev/app/4948
// ==/UserScript==

/* global OpenCC */
/* global openccCN */
// window.personAliasQuery

(async function () {
  'use strict';

  // #region vars
  let epsCache;

  async function personAliasFallback(name) {
    const provider = localStorage.getItem('wikiMissingPositionsProvider') || 'https://bgq.iccci.cc.cd';
    try {
      const res = await fetch(`${provider}/api/aliases/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.error('personAliasFallback API error:', e);
    }
    const all = await window.personAliasQueryAll?.(name);
    if (all && all.length > 0) return all;
    if (all !== undefined) return [];
    const single = await window.personAliasQuery?.(name);
    if (single) return [single];
    return [];
  }
  const roleIdMap = [...document.querySelectorAll('#prsnPos_0 option')].reduce((map, option) => {
    map[option.textContent.split(' /')[0]] = option.value;
    return map;
  }, {});

  // #region
  const regions = ['cn', 'tw', 'hk', 'jp'];
  let converters = {}, loading;
  // #endregion

  function refinedToCN(str) {
    // Keep ノ (U+30CE) as-is for match-friendly candidates: stash it out of the
    // pipeline (the library maps ノ→之, which hurts matching against the page's
    // original 東ノ助 spelling), then restore after conversion.
    const KEEP = '\uE000';
    const stashed = str.includes('ノ') ? str.replace(/ノ/g, KEEP) : str;
    const out = openccCN.refinedToCN(stashed, {
      jp2t: converters['jp-tw'] || OpenCC.Converter({ from: 'jp', to: 'tw' }),
      t2s: converters['tw-cn'] || OpenCC.Converter({ from: 'tw', to: 'cn' }),
      tw2s: converters['tw-cn'] || OpenCC.Converter({ from: 'tw', to: 'cn' }),
      hk2s: converters['hk-cn'] || OpenCC.Converter({ from: 'hk', to: 'cn' }),
      t2jp: converters['tw-jp'] || OpenCC.Converter({ from: 'tw', to: 'jp' }),
    });
    return str.includes('ノ') ? out.replace(new RegExp(KEEP, 'g'), 'ノ') : out;
  }

  // #region
  const SEP = '(?:\\uff1a|\\u003A|】|\\/|／|·|-、|・|･|、|=|＝|＆|\\u0026|•|♦|◆|■|◎|×|\\[|\\s?\\]|\\s(?![×\\]:：]))';

  const POSITIONS = [
    { name: '脚本', pattern: '(?:脚本|シナリオ|剧本|编剧|プロット|大纲)' },
    { name: '分镜', pattern: '(?:分镜|コンテ|ストーリーボード|絵コンテ|画コンテ)' },
    { name: '演出', pattern: '(?<!チーフ|OP・ED[ 　]|アニメーション|コンテ・)(?:演出)' },
    { name: '构图', pattern: '(?:レイアウト|构图|layout|レイアウター)' },
    { name: '作画监督', pattern: '(?<!総|总|アクション|メカ|ニック|エフェクト|动作|机械|特效|プロップ|キャラクター|レイアウト|特技)(?:作監|作画監督|作监|作画监督|作艦|アニメーション演出)' },
    { name: '总作画监督', pattern: '(?:(?:総|总)(?:作監|作画監督|作监|作画监督|作艦)|作画総監督|チーフ作画監督)' },
    { name: '动作作画监督', pattern: '(?:アクション|动作)(?:作監|作画監督|作监|作画监督|作艦)' },
    { name: '机械作画监督', pattern: '(?:メカ|メカニック|机械)(?:作監|作画監督|作监|作画监督|作艦)' },
    { name: '特效作画监督', pattern: '(?:エフェクト|特效|特技)(?:作監|作画監督|作监|作画监督|作艦)' },
    { name: '原画', pattern: '(?<!第二)(?:原画|作画)' },
    { name: '第二原画', pattern: '(?:第二原画|二原|原画協力)' },
    { name: '作画监督助理', pattern: '(?<!総|总)(?:作監|作画監督|作监|作画监督|作艦)(?:補|補佐|补佐|协力|協力|辅佐|辅助|助理)' },
    { name: '演出助理', pattern: '演出(?:補|補佐|补佐|协力|協力|辅佐|辅助|助理|助手)' },
    { name: '監督補佐', pattern: '(?:助監督|(?<!作画)監督(?:補|補佐|补佐|协力|協力|辅佐|辅助|助理|助手))' }, // bangumi无此职位，仅用于识别（≠副导演）
    { name: '剪辑', pattern: '(?<!オンライン|オフライン|台詞)(?:剪辑|編集)' },
    { name: '3DCG 导演', pattern: '(?:3DCGディレクター|3DCG导演|3DCG監督)' },
    { name: 'CG 导演', pattern: '(?:CGディレクター|CG导演|CG監督)' },
    { name: '美术监督', pattern: '(?:美術監督|美术监督|アートディレクション|背景監督)' },
    { name: '美术', pattern: '(?:美術|美术)' },
    { name: '背景美术', pattern: '(?:背景)' },
    { name: '制作进行', pattern: '(?:制作进行|制作進行)' },
    { name: '设定制作', pattern: '(?:设定制作|設定制作|制作設定)' },
    { name: '制作管理', pattern: '(?:制作デスク|制作管理|制作主任|制作マネージャー|制作担当|制作班長)' },
    { name: '制作协力', pattern: '(?:制作協力|制作协力|協力プロダクション|作品協力)' },
    { name: '总作画监督助理', pattern: '(?:(?:総|总)(?:作監|作画監督|作监|作画监督|作艦)|作画総監督)(?:補|補佐|补佐|协力|協力|辅佐|辅助|助理)' },
    { name: '色彩脚本', pattern: '(?:カラースクリプト)' },
    { name: '印象板', pattern: '(?:イメージボード)' },
    { name: '动画检查', pattern: '(?:動画検査|动画检查|動检|動画チェック)' },
    { name: '特效', pattern: '(?:特殊効果)' },
    { name: '导演', pattern: '(?<!美術|美术|音響|音响|撮影|摄影|作画|総|总|アクション|メカ|メカニック|エフェクト|动作|机械|特效|3DCG|CG|助)(?:監督|导演|ディレクター|シリーズ監督)' },
    { name: '人物设定', pattern: '(?:キャラクターデザイン|キャラ設定|人物設定|人物设计|人物设定|キャラデザ|人设)' },
    { name: '系列构成', pattern: '(?<!副)(?:シリーズ構成|系列构成|系列構成|シナリオディレクター|構成|脚本構成)' },
    { name: '色彩设计', pattern: '(?:色彩設計|色彩设计|色彩設定|カラーデザイン)' },
    { name: '摄影监督', pattern: '(?:撮影|摄影)(?:監督|监督)' },
    { name: '音响监督', pattern: '(?:音響|音响)(?:監督|监督)' },
    { name: '原作', pattern: '(?:原作)' },
    { name: '音乐', pattern: '(?:音楽|音乐|楽曲)' },
    { name: '3DCG', pattern: '(?:3DCG|3D ?CG)' },
    { name: '原案', pattern: '(?<!キャラ|人物)(?:原案)' },
    { name: '配音监督', pattern: '(?:配音)(?:監督|监督|导演)' },
    { name: '选曲', pattern: '(?:選曲|选曲)' },
    { name: '监修', pattern: '(?<!作画|レイアウト)(?:監修|监修|シリーズ監修|スーパーバイザー)' },
    { name: '录音', pattern: '(?:録音|录音)' },
    { name: '音效', pattern: '(?:音響効果|効果音|音效)' },
    { name: '企画', pattern: '(?:企画|企划|プランニング|企画開発)' },
    { name: '分镜协力', pattern: '(?:コンテ協力|分镜协力|分鏡協力|絵コンテ協力)' },
    { name: '上色', pattern: '(?:仕上|仕上げ|上色)' },
    { name: '主动画师', pattern: '(?:メインアニメーター|主動畫師|主动画师)' },
    { name: '插画', pattern: '(?:イラスト|插画|挿絵|片尾插画)' },
    { name: '道具设计', pattern: '(?:プロップデザイン|道具設計|道具设计|小物設定)' },
    { name: '美术设计', pattern: '(?:美術設定|美术设定|美術設計|美术设计)' },
    { name: '色彩指定', pattern: '(?:色彩指定|色指定)' },
    { name: '上色检查', pattern: '(?:仕上検查|仕上検査|上色检查|仕上げ検査)' },
    { name: '色彩检查', pattern: '(?:色検查|色検査|色彩检查)' },
    { name: '补间动画', pattern: '(?:動画|补间动画)' },
    { name: '摄影', pattern: '(?:撮影|摄影)' },
    { name: '设定', pattern: '(?<!キャラ|人物|色彩|小物|美術|美术|メカニック|机械|機械|衣装|基本|場面|背景|制作)(?:設定|设定)' },
    { name: '制作', pattern: '(?<!设定|設定|动画|アニメーション|アニメ|音乐|楽曲|音楽)(?:製作|制作)' },
    { name: '音响', pattern: '(?:音響|音声|音响)' },
    { name: '人物原案', pattern: '(?:キャラ原案|人物原案)' },
    { name: '机械设定', pattern: '(?:メカニック設定|机械设定|機械設定)' },
    { name: '总导演', pattern: '(?:(?<!作画)総監督|チーフディレクター|总导演)' },
    { name: '分镜抄写', pattern: '(?:絵コンテ清書|コンテ清書|分镜抄写)' },
    { name: '动画制作', pattern: '(?:アニメーション制作|アニメ制作|动画制作)' },
    { name: '脚本协力', pattern: '(?:脚本協力|脚本协力)' },
    { name: '协力', pattern: '(?<!作監|作画監督|作监|作画监督|作艦|演出|原画|制作|コンテ|絵コンテ|分镜|分鏡|脚本|友情|設定|设定|デザイン|制作進行|制作进行|作品)(?:協力|协力)(?!プロダクション)' },
    { name: '特别鸣谢', pattern: '(?:友情協力|特别鸣谢)' },
    { name: 'OP・ED 分镜', pattern: '(?:OP・ED(?:の)?分鏡|OP・ED(?:の)?分镜|OP絵コンテ)' },
    { name: '美术板', pattern: '(?:美術ボード|美术板)' },
    { name: '美术监督助理', pattern: '(?:美術監督補佐|美术监督助理)' },
    { name: '设定协力', pattern: '(?:設定協力|デザイン協力|设定协力)' },
    { name: '道具作画监督', pattern: '(?:プロップ作画監督|プロップ作監|道具作画监督)' },
    { name: '角色作画监督', pattern: '(?:キャラクター作画監督|角色作画监督)' },
    { name: '作画监修', pattern: '(?:作画監修|作画监修)' },
    { name: '构图监修', pattern: '(?:レイアウト監修|构图监修)' },
    { name: '构图作画监督', pattern: '(?:レイアウト作画監督|レイアウト作監|构图作画监督)' },
    { name: '服装设计', pattern: '(?:衣装デザイン|衣装設定|服装设计|服裝設計)' },
    { name: '概念设计', pattern: '(?:コンセプトデザイン|概念设计)' },
    { name: '背景设定', pattern: '(?:基本設定|場面設定|場面設計|背景设定)' },
    { name: '主演出', pattern: '(?:チーフ演出|主演出)' },
    { name: '视觉导演', pattern: '(?:ビジュアルディレクター|视觉导演)' },
    { name: '音乐监督', pattern: '(?:音楽ディレクター|音乐监督)' },
    { name: '录音助理', pattern: '(?:録音アシスタント|録音助手|录音助理)' },
    { name: '制作进行协力', pattern: '(?:制作進行協力|制作进行协力)' },
    { name: '音乐制作', pattern: '(?:楽曲制作|音楽制作|音乐制作)' },
    { name: '摄影监督助理', pattern: '(?:撮影監督補佐|摄影监督助理)' },
    { name: '色彩设计助理', pattern: '(?:色彩設計補佐|色彩设计助理)' },
    { name: '制作管理助理', pattern: '(?:制作デスク補佐|制作管理助理)' },
    { name: '设定制作助理', pattern: '(?:設定制作補佐|设定制作助理)' },
    { name: '动作导演', pattern: '(?:アクション監督|动作导演)' },
    { name: '制作助理', pattern: '(?:制作アシスタント|制作補佐|製作補|制作助理)' },
    { name: '制作协调', pattern: '(?:制作コーディネーター|制作协调)' },
    { name: '构成协力', pattern: '(?:構成協力|构成协力)' },
    { name: '企画协力', pattern: '(?:企画協力|企画协力)' },
    { name: '在线剪辑', pattern: '(?:オンライン編集|在线剪辑)' },
    { name: '离线剪辑', pattern: '(?:オフライン編集|离线剪辑)' },
    { name: '剧本协调', pattern: '(?:シナリオコーディネーター|剧本协调)' },
    { name: '副系列构成', pattern: '(?:副シリーズ構成|副系列构成)' },
    { name: 'OP・ED 演出', pattern: '(?:OP・ED 演出|OP・ED演出)' },
    { name: '特摄效果', pattern: '(?:特撮|特摄效果)' },
    { name: '视觉效果', pattern: '(?:ビジュアルエフェクト|视觉效果)' },
    { name: '录音工作室', pattern: '(?:録音スタジオ|录音工作室)' },
    { name: '整音', pattern: '(?:整音)' },
    { name: '台词编辑', pattern: '(?:台詞編集|台词编辑)' },
    { name: '制片人', pattern: '(?<!チーフ|アソシエイト|ライン|美術|音響)(?:プロデュース|プロデューサー|制片人)' },
    { name: '宣传', pattern: '(?:パブリシティ|宣伝|広告宣伝|番組宣伝|宣传)' },
    { name: '标题设计', pattern: '(?:タイトルデザイン|标题设计)' },
    { name: '总制片人', pattern: '(?:チーフプロデューサー|チーフ制作|総合プロデューサー|总制片人)' },
    { name: '执行制片人', pattern: '(?:製作総指揮|执行制片人)' },
    { name: '副制片人', pattern: '(?:アソシエイトプロデューサー|副制片人)' },
    { name: '现场制片人', pattern: '(?:ラインプロデューサー|现场制片人)' },
    { name: '创意总监', pattern: '(?:クリエイティブスーパーバイザー|クリエイティブディレクター|创意总监)' },
    { name: '制作统括', pattern: '(?:制作統括|制作统括)' },
    { name: '监制', pattern: '(?:监制)' },
    { name: '概念艺术', pattern: '(?:コンセプトアート|概念艺术)' },
    { name: '画面设计', pattern: '(?:画面設計|画面设计)' },
    { name: '美术制作人', pattern: '(?:美術プロデューサー|美术制作人)' },
    { name: '音响制作人', pattern: '(?:音響プロデューサー|音响制作人)' },
  ];

  const [regexes_per, regexes_role_per, regexes_role] = (() => {
    const per = {}, rolePer = {}, role = {};
    const tolerateIWS = p => {
      // 只在最后一个 (?: 之后（关键字部分）插入可选全角空格，不动 (?<!...) 等前置断言
      const i = p.lastIndexOf('(?:');
      return i < 0 ? p : p.slice(0, i) + p.slice(i).replace(/([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3005\u30fc])/g, '$1\\u3000?');
    };
    for (const { name, pattern } of POSITIONS) {
      const tp = tolerateIWS(pattern);
      const kw = tp + '\\s*?' + SEP;
      const nameCapture = '(\\W|\\w)+?(?=\\n|$|\\s*\\|)';
      per[name] = new RegExp('(?<=[\\u3040-\\u9fa5]*?' + kw + ')' + nameCapture, 'g');
      rolePer[name] = new RegExp(kw + nameCapture, 'g');
      role[name] = new RegExp(kw, 'g');
    }
    return [per, rolePer, role];
  })();
  const regex_sym = /[\uff1a\u003A【】（）()/／、、＆\u0026♦◆■=]/g;
  // #endregion

  // #region
  const staffSet = new Set(), repeatSet = new Set();
  const bgmIdMap = {
    'KADOKAWA': 19306, '斉藤壮馬': 14604, '週刊ビッグコミックスピリッツ': 7620, 'あきやまえんま': 30863, 'しづ': 12529, 'タチ': 12008, '優': 18233, 'ホリ': 46769, 'Koi': 13864, 'KEI': 8295, 'tomomi': 45315, 'はらだ': 16346, 'LAM': 40914, 'lack': 30250, 'Ruki': 90718, 'ヒロユキ': 3404, 'かわく': 90716, 'あきやま': 30863, 'さと': 14236, 'かおり': 14760, 'NON': 10778, 'うめ': 8559, 'すか': 16242, 'フライ': 28795
  };
  const failedRequests = new Map();
  const failedKeywords = new Set();
  const unmatchedKeywords = new Set();
  const RETRY_INTERVAL = 500;
  const MAX_RETRIES = 3;
  // #endregion
  // #endregion

  if (location.pathname.match(/^\/ep\/\d+$/)) {
    const subjectId = document.querySelector('.nameSingle a').href.split('/').pop();
    const epLabel = parseEpLabel(document.title);
    const epDesc = document.querySelector('.epDesc')?.textContent;
    if (!epDesc) return;

    const [sfaffInfo] = extractStaffInfo({ [epLabel]: epDesc });
    const staffJSON = JSON.stringify(sfaffInfo);
    if (staffJSON === '{}') return;

    document.querySelector('.title').insertAdjacentHTML(
      'beforeend',
      `<small><a class="l staff-link" href="/subject/${subjectId}/add_related/person?source=${epLabel}&staffs=${encodeURIComponent(staffJSON)}">[关联制作人员参与]</a></small>`
    );

  } if (location.pathname.match(/^\/person\/new$/)) {
    const params = new URLSearchParams(location.search);
    if (!params.has('name')) return;
    const name = params.get('name');
    document.querySelector('#crt_name').value = name;
  } else if (location.pathname.match(/^\/subject\/\d+\/add_related\/person$/)) {
    if (!document.querySelector('.focus').classList.contains('anime')) return;

    const style = document.createElement('style');
    const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');
    style.textContent = css`
      #crtRelateSubjects li:target {
        background-color: rgba(165, 255, 165, 0.4) !important;
        scroll-margin-block-start: 60px;
      }

      /* 提示框容器样式 */
      #wikiEpRelate.staff-tip-box {
        position: fixed;
        width: min(380px, 100vw);
        backdrop-filter: blur(10px);
        background: rgba(254, 254, 254, .8);
        color: #000;
        border-radius: 15px;
        background-clip: padding-box;
        border: 1px solid rgba(255, 255, 255, .3);
        box-shadow: 0 5px 30px 10px rgba(80, 80, 80, .5);
        z-index: 9999;
        overflow: hidden;
      }

      /* 警告提示样式 */
      #wikiEpRelate .staff-warning-section {
        padding: 10px 12px;
        margin: 0 0 16px;
        background: rgba(255, 248, 225, 0.6);
        border: 1px solid rgba(255, 153, 0, 0.3);
        border-radius: 8px;
        color: #856404;
        overflow-wrap: break-word;
      }
      #wikiEpRelate .staff-warning-title {
        font-size: 14px;
        font-weight: 500;
      }

      /* 提示框拖动手柄 */
      #wikiEpRelate .staff-tip-handle {
        height: 36px;
        line-height: 36px;
        padding: 0 16px;
        background: rgba(255, 255, 255, .2);
        border-bottom: 1px solid rgba(255, 255, 255, .1);
        border-top-left-radius: 15px;
        border-top-right-radius: 15px;
        font-size: 14px;
        font-weight: 500;
        color: inherit;
        cursor: move;
        user-select: none;
      }

      /* 提示框内容容器 */
      #wikiEpRelate .staff-tip-content {
        padding: 12px 16px;
        max-height: 400px;
        overflow-y: auto;
        font-size: 13px;
      }

      /* 提示框标题 */
      #wikiEpRelate .staff-tip-title {
        margin: 0 0 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, .2);
        font-size: 14px;
        color: inherit;
      }
      #wikiEpRelate .staff-tip-title.new { color: #0a6e1e; }
      #wikiEpRelate .staff-tip-title.existing { color: #0d5b68; }
      #wikiEpRelate .staff-tip-title.unmatched { color: #a0222e; }

      /* 记录列表容器 */
      #wikiEpRelate .staff-record-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }

      /* 统一记录项基础样式 */
      #wikiEpRelate .staff-record-item {
        padding: 8px 12px;
        border-radius: 8px;
        backdrop-filter: blur(5px);
        color: inherit !important;
        text-decoration: none;
        transition: background 0.2s ease;
        overflow-wrap: break-word;
        position: relative;
      }

      /* 新增参与项 */
      #wikiEpRelate .staff-record-item.new {
        background: rgba(240, 255, 244, .6);
        border: 1px solid rgba(40, 167, 69, .2);
      }
      #wikiEpRelate .staff-record-item.new:hover {
        background: rgba(230, 255, 233, .8);
      }

      /* 已有参与项 */
      #wikiEpRelate .staff-record-item.existing {
        background: rgba(240, 248, 255, .6);
        border: 1px solid rgba(23, 162, 184, .2);
      }
      #wikiEpRelate .staff-record-item.existing:hover {
        background: rgba(230, 242, 255, .8);
      }

      /* 未匹配记录项 */
      #wikiEpRelate .staff-record-item.unmatched {
        padding: 8px 12px;
        border-radius: 8px;
        backdrop-filter: blur(5px);
        background: rgba(255, 248, 248, .6);
        color: #a0222e;
        border: 1px solid rgba(220, 53, 69, .2);
        transition: background 0.2s ease;
      }
      #wikiEpRelate .staff-record-item.unmatched:hover {
        background: rgba(255, 235, 235, .8);
      }

      /* 记录项名称强调 */
      #wikiEpRelate .staff-person-name {
        font-weight: 500;
        color: inherit;
      }

      #wikiEpRelate .staff-tip-content > details > details {
        margin-left: 1.5em;
      }

      /* 夜间模式适配 */
      html[data-theme="dark"] #wikiEpRelate.staff-tip-box {
        background: rgba(40, 40, 40, .8);
        color: #fff;
        box-shadow: 0 5px 30px 10px rgba(0, 0, 0, .2);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-warning-section {
        background: rgba(60, 40, 0, 0.4);
        border-color: rgba(255, 153, 0, 0.5);
        color: #ffd700;
      }
      html[data-theme="dark"] #wikiEpRelate .staff-tip-handle {
        background: rgba(0, 0, 0, .2);
        border-bottom-color: rgba(255, 255, 255, .05);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-tip-title {
        border-bottom-color: rgba(255, 255, 255, .05);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-tip-title.new { color: #51cf66; }
      html[data-theme="dark"] #wikiEpRelate .staff-tip-title.existing { color: #4dd0e1; }
      html[data-theme="dark"] #wikiEpRelate .staff-tip-title.unmatched { color: #e57373; }
      html[data-theme="dark"] #wikiEpRelate .staff-record-item.new {
        background: rgba(25, 65, 35, 0.4);
        border-color: rgba(76, 175, 80, 0.4);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-record-item.new:hover {
        background: rgba(25, 65, 35, 0.6);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-record-item.existing {
        background: rgba(30, 45, 65, 0.4);
        border-color: rgba(33, 150, 243, 0.4);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-record-item.existing:hover {
        background: rgba(30, 45, 65, 0.6);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-record-item.unmatched {
        background: rgba(65, 30, 35, 0.4);
        border-color: rgba(244, 67, 54, 0.4);
      }
      html[data-theme="dark"] #wikiEpRelate .staff-record-item.unmatched:hover {
        background: rgba(65, 30, 35, 0.6);
      }`;
    document.head.appendChild(style);

    const subjectId = location.pathname.split('/')[2];
    const btn = document.createElement('button');
    btn.textContent = '获取章节简介填写参与';
    btn.id = 'epDescStaff';
    btn.style = 'margin:5px;float:right';
    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        btn.textContent = '获取章节中……';

        const allEps = [];
        let offset = 0;
        const limit = 100;

        while (true) {
          const eps = await getEps(subjectId, offset);
          if (!eps || eps.length === 0) break;

          allEps.push(...eps);
          if (eps.length < limit) break;

          offset += limit;
        }

        if (!allEps.length) throw new Error('未获取到章节数据');

        const epData = {}, epDescs = {};
        for (const ep of allEps) {
          const epTypes = ['', 'SP', 'OP', 'ED'];
          const epLabel = `${epTypes[ep.type]}${ep.sort}`;

          epData[epLabel] = ep;
          epDescs[epLabel] = ep.desc;
        }
        epsCache = epData;

        btn.textContent = '解析参与中……';
        const [staffInfo, noStaffEps] = extractStaffInfo(epDescs);

        if (Object.keys(staffInfo).length || noStaffEps.length) {
          await updAppearEps(staffInfo, noStaffEps);
        } else {
          throw new Error('未解析到任何集数的人员信息');
        }

        btn.textContent = `解析完成！共处理 ${allEps.length} 集`;
      } catch (e) {
        btn.textContent = `获取失败：${e.message}，点击重试`;
        btn.disabled = false;
      }
    });
    document.querySelector('#indexCatBox').after(btn);

    const params = new URLSearchParams(location.search);
    if (params.has('staffs')) {
      try {
        const staffInfo = JSON.parse(params.get('staffs'));

        let cancelled = false;
        document.addEventListener('click', () => {
          cancelled = true;
        }, { capture: true, once: true });
        const waitRelate = () => {
          if (cancelled) return Promise.resolve(false);
          if (document.querySelector('#crtRelateSubjects')) return Promise.resolve(true);
          return new Promise(resolve => setTimeout(() => resolve(waitRelate()), 200));
        };
        if (!(await waitRelate())) return;

        btn.disabled = true;
        btn.textContent = '解析参与中……';
        await updAppearEps(staffInfo, []);
        btn.textContent = '解析完成！点击获取全部章节';
        btn.disabled = false;
      } catch (e) {
        console.error(`参数解析错误：${e.message}`);
      }
    }
  }

  async function getEps(subjectId, offset = 0) {
    const response = await fetch(`https://api.bgm.tv/v0/episodes?subject_id=${subjectId}&offset=${offset}`);
    if (!response.ok) throw new Error(`API请求失败：HTTP ${response.status}`);
    const data = await response.json();
    return data.data || [];
  }

  function parseEpLabel(input) {
    if (!input) return '';
    const trimmed = input.trim();
    const match = trimmed.match(/^([a-zA-Z]+)\.(\d+(\.\d+)?)/);
    if (!match) return trimmed;

    const [, type, number] = match;
    return type.toLowerCase() === 'ep' ? number : `${type}${number}`;
  }

  function isStrictInt(str) {
    return /^-?\d+$/.test(str);
  }
  function sortAppearEps(eps) {
    return eps.sort((a, b) => {
      const isANum = isStrictInt(a);
      const isBNum = isStrictInt(b);
      if (isANum && isBNum) return Number(a) - Number(b);
      if (isANum) return -1;
      if (isBNum) return 1;
      return a.localeCompare(b);
    });
  }

  function parseAppearEps(input) {
    if (!input) return [];

    const rawSegments = input.split(',')
      .map(seg => seg.trim())
      .filter(seg => seg);

    const resultSet = new Set();

    rawSegments.forEach(seg => {
      if (seg.includes('-')) {
        const [s, e] = seg.split('-').map(p => p.trim());
        if (isStrictInt(s) && isStrictInt(e)) {
          const min = Math.min(Number(s), Number(e));
          const max = Math.max(Number(s), Number(e));
          for (let i = min; i <= max; i++) {
            resultSet.add(i.toString());
          }
        } else {
          resultSet.add(seg);
        }
      } else {
        resultSet.add(seg);
      }
    });

    return sortAppearEps(Array.from(resultSet));
  }

  function genAppearEps(epArr) {
    epArr = sortAppearEps([...new Set(epArr)]);
    const isStrictInt = str => /^-?\d+$/.test(str);

    const integers = epArr.filter(isStrictInt).map(Number);
    const others = epArr.filter(e => !isStrictInt(e));

    const rangeParts = [];

    if (integers.length > 0) {
      let start = integers[0];
      let prev = integers[0];

      for (let i = 1; i <= integers.length; i++) {
        const curr = integers[i];
        if (i < integers.length && curr === prev + 1) {
          prev = curr;
        } else {
          rangeParts.push(start === prev ? `${start}` : `${start}-${prev}`);
          if (i < integers.length) {
            start = curr;
            prev = curr;
          }
        }
      }
    }

    return [...rangeParts, ...others].join(',');
  }

  async function updAppearEps(staffInfo, noStaffEps) {
    const groupedRecords = {
      new: {},         // 本次新增的参与记录
      existing: {},    // 已存在的参与记录
      unmatched: {}    // 未匹配记录
    };
    const oldLis = [...document.querySelectorAll('#crtRelateSubjects li')];

    const allEpLabels = new Set();
    const roleEpMap = {};

    const indicator = document.querySelector('#epDescStaff');
    const staffInfoEntries = Object.entries(staffInfo);
    const total = staffInfoEntries.length;
    let i = 0;
    for (const [originalName, roles] of staffInfoEntries) {
      i++;
      indicator.textContent = `解析参与中（${i}/${total}）……`;
      for (const [role, epLabels] of Object.entries(roles)) {
        epLabels.forEach(ep => allEpLabels.add(ep));
        if (!roleEpMap[role]) roleEpMap[role] = new Set();
        epLabels.forEach(ep => roleEpMap[role].add(ep));

        const roleId = roleIdMap[role];
        if (!roleId) continue;

        let aliased = false;
        const sameRole = li => li.querySelector('select').value === roleId;
        const sameName = name => li => {
          const liName = li.querySelector('.title a').textContent;
          return normalize(liName) === normalize(name);
        };
        const similarName = name => li => {
          const liName = li.querySelector('.title a').textContent;
          return isSimilarOrContained(normalize(name), normalize(liName));
        };
        const sameId = id => li => {
          const liId = li.querySelector('.title a').href.split('/').pop();
          return liId == id;
        };
        const matchOldLi = name => oldLis.find(li => sameName(name)(li) && sameRole(li));

        let matchedLiFuzzy;
        const memOldLiFuzzy = name => matchedLiFuzzy ||= oldLis.find(li => similarName(name)(li) && sameRole(li));
        let matchedLi, name = originalName;

        async function* candidateNames() {
          const yielded = new Set([originalName]);
          const yieldUnique = v => {
            if (yielded.has(v)) return false;
            yielded.add(v);
            return true;
          };

          yield originalName;
          aliased = true;

          const aliasedResults = await personAliasFallback(originalName);
          for (const a of aliasedResults) {
            if (yieldUnique(a.name)) yield a.name;
          }

          for (const name of await getConvertedNames(originalName)) {
            if (yieldUnique(name)) yield name;
          }

          for (const name of await getConvertedNames(originalName)) {
            const aliasedResults = await personAliasFallback(name);
            for (const a of aliasedResults) {
              if (yieldUnique(a.name)) yield a.name;
            }
          }

        }

        for await (const candidate of candidateNames()) {
          matchedLi = matchOldLi(candidate);
          if (!matchedLi) {
            memOldLiFuzzy(candidate);
            continue;
          }
          name = candidate;
          break;
        }
        if (!matchedLi) {
          if (matchedLiFuzzy) {
            matchedLi = matchedLiFuzzy;
            name = matchedLi.querySelector('.title a').textContent;
            aliased = true;
          }
        }

        let matchedLis;
        if (!matchedLi) {
          aliased = false;
          for await (const candidate of candidateNames()) {
            const searchResult = await autoSearchAndRelate(candidate, role);
            if (!searchResult) continue;
            const { ids, name: resultName } = searchResult;
            const newLiList = [...document.querySelectorAll('#crtRelateSubjects li:not(.old)')];

            if (ids.length === 1) {
              matchedLi = newLiList.find(li => sameId(ids[0])(li) && sameRole(li));
            } else {
              matchedLis = newLiList.filter(li => ids.some(id => sameId(id)(li)) && sameRole(li));
            }

            if (name !== resultName) aliased = true;
            name = resultName;
            break;
          }
        }
        let groupKey = `${name}-${role}`;
        let liId = `staff-${name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;

        if (matchedLi) {
          handleMatched(matchedLi);
        } else if (matchedLis) {
          matchedLis.forEach(handleMatched);
        } else if (await tryReSplit()) {
          // handled by tryReSplit
        } else {
          groupedRecords.unmatched[groupKey] ||= { name: originalName, role, epLabels: new Set(epLabels) };
        }

        async function tryReSplit() {
          const trySearch = async (token) => {
            const sr = await autoSearchAndRelate(token, role);
            if (!sr) return null;
            const { ids, name: resultName } = sr;
            const allLis = [...document.querySelectorAll('#crtRelateSubjects li')];
            const li = allLis.find(l => ids.some(id => sameId(id)(l)) && sameRole(l));
            return li ? { name: resultName, li } : null;
          };

          // 1. 按空格重新拆分（仅对含 CJK/假名的 token，排除纯英文）
          if (/[ 　]/.test(originalName)) {
            const tokens = originalName.split(/[ 　]+/).filter(Boolean);
            const cjkTokens = tokens.filter(t => /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3005\u30fc]/.test(t));
            if (cjkTokens.length > 1) {
              const matched = [];
              for (const token of cjkTokens) {
                let li = matchOldLi(token);
                if (li) {
                  matched.push({ name: token, li, token }); continue;
                }
                const sr = await trySearch(token);
                if (sr) {
                  matched.push({ name: sr.name, li: sr.li, token });
                }
              }
              if (matched.length) {
                for (const m of matched) {
                  name = m.name;
                  groupKey = `${m.name}-${role}`; liId = `staff-${m.name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;
                  handleMatched(m.li);
                }
                const matchedSet = new Set(matched.map(m => m.token));
                const rest = cjkTokens.filter(t => !matchedSet.has(t));
                if (rest.length) {
                  const restName = rest.join(' ');
                  groupedRecords.unmatched[`${restName}-${role}`] ||= { name: restName, role, epLabels: new Set(epLabels) };
                }
                return true;
              }
            }
          }
          // 2. 按软分隔符重新拆分（原始拆分可能因英文上下文而保留）
          if (/[・•·･]/.test(originalName)) {
            const tokens = originalName.split(/[・•·･]+/).filter(Boolean);
            const matched = [];
            for (const token of tokens) {
              let li = matchOldLi(token);
              if (li) {
                matched.push({ name: token, li, token }); continue;
              }
              const sr = await trySearch(token);
              if (sr) {
                matched.push({ name: sr.name, li: sr.li, token });
              }
            }
            if (matched.length) {
              for (const m of matched) {
                name = m.name;
                groupKey = `${m.name}-${role}`; liId = `staff-${m.name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;
                handleMatched(m.li);
              }
              const matchedSet = new Set(matched.map(m => m.token));
              const rest = tokens.filter(t => !matchedSet.has(t));
              if (rest.length) {
                const restName = rest.join('・');
                groupedRecords.unmatched[`${restName}-${role}`] ||= { name: restName, role, epLabels: new Set(epLabels) };
              }
              return true;
            }
          }
          // 3. 从原文复原空格边界后拆分（extractStaffInfo 末尾合并了 CJK 姓名间的空格）
          {
            const desc = epsCache?.[epLabels[0]]?.desc || '';
            if (desc) {
              const esc = originalName.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
              const m = desc.match(new RegExp(esc));
              if (m && /\s/.test(m[0])) {
                const parts = m[0].split(/\s+/).filter(Boolean);
                // 若有段落是单个汉字（如拆出了姓），说明是中文姓名内空格，不应拆分
                if (parts.length > 1 && !parts.some(p => p.length === 1 && /[\u4e00-\u9fff]/.test(p))) {
                  const matched = [];
                  for (const part of parts) {
                    let li = matchOldLi(part);
                    if (!li) {
                      const sr = await trySearch(part); if (sr) li = sr.li;
                    }
                    if (li) matched.push({ name: part, li });
                  }
                  if (matched.length) {
                    aliased = false;
                    for (const m2 of matched) {
                      name = m2.name;
                      groupKey = `${m2.name}-${role}`; liId = `staff-${m2.name.replace(/\s/g, '')}-${role.replace(/\s/g, '')}`;
                      handleMatched(m2.li);
                    }
                    const matchedSet = new Set(matched.map(m2 => m2.name));
                    const rest = parts.filter(p => !matchedSet.has(p));
                    if (rest.length) {
                      const restName = rest.join(' ');
                      groupedRecords.unmatched[`${restName}-${role}`] ||= { name: restName, role, epLabels: new Set(epLabels) };
                    }
                    return true;
                  }
                }
              }
            }
          }
          return false;
        }

        function handleMatched(matchedLi) {
          matchedLi.id = liId;

          const input = matchedLi.querySelector('[name$="[appear_eps]"]');
          const existingSet = new Set(parseAppearEps(input.value));

          const labelsToAdd = [];

          for (const epLabel of epLabels) {
            const wasExisting = existingSet.has(epLabel);

            if (!wasExisting) {
              labelsToAdd.push(epLabel);
              if (matchedLi.classList.contains('old')) {
                matchedLi.style.background = document.documentElement.getAttribute('data-theme') === 'dark'
                  ? 'rgba(255, 248, 165, 0.08)' : 'rgba(255, 248, 165, 0.2)';
              }
            }

            const targetGroup = wasExisting ? 'existing' : 'new';
            groupedRecords[targetGroup][groupKey] ||= {
              name,
              role,
              epLabels: new Set(),
              aliases: {},
              liId
            };
            const record = groupedRecords[targetGroup][groupKey];
            record.epLabels.add(epLabel);
            if (aliased) {
              record.aliases[originalName] ||= [];
              record.aliases[originalName].push(epLabel);
            }
          }

          if (labelsToAdd.length) {
            input.value = genAppearEps([...existingSet, ...labelsToAdd]);
          }
        }
      }
    }

    const roleMissingEps = {};
    Object.entries(roleEpMap).forEach(([role, presentEps]) => {
      const missingEps = [];
      allEpLabels.forEach(ep => {
        if (!presentEps.has(ep)) {
          missingEps.push(ep);
        }
      });
      if (missingEps.length && missingEps.length < allEpLabels.size) {
        roleMissingEps[role] = missingEps;
      }
    });

    createDraggableTipBox(
      formatRecords(groupedRecords.new),
      formatRecords(groupedRecords.existing),
      formatRecords(groupedRecords.unmatched),
      noStaffEps,
      roleMissingEps
    );

    const editSummaryInput = document.querySelector('#editSummary');
    const epLabelsStr = new URLSearchParams(location.search).get('source') || '';
    editSummaryInput.value = `根据${epLabelsStr}章节简介填写参与`;
  }

  // function addRelatedPerson({ id, name }, roleId) {
  //     subjectList[id] = { id, name, url_mod: 'person' }
  //     addRelateSubject(id, 'submitForm');
  //     $('#crtRelateSubjects select').eq(0).val(roleId);
  // }

  // 按照职位排序，集数排序
  function formatRecords(records) {
    const processedRecords = Object.values(records).map(item => ({
      ...item,
      epLabels: Array.from(item.epLabels).sort((a, b) => {
        const typeOrder = { '': 0, 'SP': 1, 'OP': 2, 'ED': 3 };
        const aType = a.match(/^(SP|OP|ED)/)?.[0] || '';
        const bType = b.match(/^(SP|OP|ED)/)?.[0] || '';
        if (aType !== bType) return typeOrder[aType] - typeOrder[bType];
        const aNum = parseFloat(a.replace(/[A-Za-z]/g, '')) || 0;
        const bNum = parseFloat(b.replace(/[A-Za-z]/g, '')) || 0;
        return aNum - bNum;
      })
    }));

    return processedRecords.sort((a, b) => {
      if (a.role === undefined || a.role === null) return -1;
      if (b.role === undefined || b.role === null) return 1;
      return a.role.localeCompare(b.role);
    });
  }


  function createDraggableTipBox(newRecords, existingRecords, unMatchedRecords, noStaffEps, roleMissingEps) {
    document.querySelector('.staff-tip-box')?.remove();

    const tipBox = document.createElement('div');
    tipBox.className = 'staff-tip-box';
    tipBox.id = 'wikiEpRelate';
    tipBox.setAttribute('aria-hidden', 'true');

    const dragHandle = document.createElement('div');
    dragHandle.className = 'staff-tip-handle';
    const handleLabel = document.createElement('span');
    handleLabel.textContent = '制作人员参与填写结果';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = true;
    toggle.style.cssText = 'margin:0 0 0 8px;vertical-align:middle;cursor:pointer';
    toggle.title = '切换面板内容是否参与页面搜索（Ctrl+F 是否命中此面板）';
    toggle.addEventListener('change', () => {
      tipBox.setAttribute('aria-hidden', toggle.checked);
      const w = document.createTreeWalker(contentBox, NodeFilter.SHOW_TEXT, null, false);
      while (w.nextNode()) {
        const raw = w.currentNode.data.replace(/\u200B/g, '');
        w.currentNode.data = toggle.checked ? raw.split('').join('\u200B') : raw;
      }
    });
    dragHandle.append(handleLabel, toggle);
    const contentBox = document.createElement('div');
    contentBox.className = 'staff-tip-content';
    tipBox.append(dragHandle, contentBox);

    contentBox.innerHTML = `
        ${noStaffEps?.length ? `<div class="staff-warning-section">
        <div class="staff-warning-title">以下${noStaffEps.length}个集数未匹配到任何制作人员信息：</div>
        ${noStaffEps.map(ep => `<span title="${escapeAttr(epsCache?.[ep]?.desc || '')}"><a class="l" href="/ep/${epsCache?.[ep]?.id}" target="_blank">${ep}</a></span>`).join(',')}
        </div>` : ''}
        ${Object.entries(roleMissingEps).map(([role, missingEps]) => `
            <div class="staff-warning-section">
                <div class="staff-warning-title">职位「${role}」在以下${missingEps.length}个集数中未出现：</div>
                ${missingEps.map(ep => `<span title="${escapeAttr(epsCache?.[ep]?.desc || '')}"><a class="l" href="/ep/${epsCache?.[ep]?.id}" target="_blank">${ep}</a></span>`).join(',')}
            </div>
        `).join('')}
        ${repeatSet.size ? `<div class="staff-warning-section">
            <div class="staff-warning-title">以下${repeatSet.size}个新关联的同名制作人员需要检查：</div>
            ${[...repeatSet].map(repeat => `<a class="l" href="#staff-${repeat}">${repeat.replace(/-(.+)$/, '（$1）')}</a>`).join('、')}
            </div>` : ''}
        ${recordSection(newRecords, '新增参与（点击跳转）', 'new')}
        ${recordSection(existingRecords, '已有参与（点击跳转）', 'existing')}
        ${recordSection(unMatchedRecords, '未匹配', 'unmatched')}
        ${ (() => {
    if (!epsCache) return '';
    const epCacheEntries = Object.entries(epsCache);
    return `<details><summary>各集详情</summary>${epCacheEntries.map(([epLabel, { desc }]) => `
                <details><summary>${epLabel}</summary>${desc.replaceAll('\n', '<br>')}</details>`
    ).join('')}</details>`;
  })() }`;
    contentBox.querySelectorAll(':scope .search-again').forEach(a => a.addEventListener('click', () => {
      document.querySelector('#subjectName').value = a.dataset.keyword;
      findSubjectFunc();
    }));

    function recordSection(records, text, className) {
      if (!records.length) return '';
      const itemTag = className === 'unmatched' ? 'div' : 'a';
      return /* html */`
        <div class="staff-record-list">
            <h4 class="staff-tip-title ${className}">${text}</h4>
            ${records.map(({ name, role, epLabels, aliases, liId }) => `
                <${ itemTag } class="staff-record-item ${className}" ${liId ? `href="#${escapeAttr(liId)}"` : ''}>
                    <span class="staff-person-name">${name}</span>
                    ${ (() => {
    if (!aliases) return '';
    const aliasesEntries = Object.entries(aliases);
    return aliasesEntries.length ? `[${aliasesEntries.map(([alias, eps]) => {
      return `<span title="${eps.join(',')}">${alias}</span>`;
    }).join('、')}]` : '';
  })() }
                    （${role}）-
                    ${epLabels.map(ep => `<span title="${escapeAttr(epsCache?.[ep]?.desc || '')}">${ep}</span>`).join(',')}
                    ${ className === 'unmatched' ? `→ <a class="l" href="/person/new?name=${escapeAttr(name)}" target="blank">创建</a>
                    ${ failedKeywords.has(name) ? ` / 自动搜索失败，<a class="l search-again" data-keyword="${name}" href="javascript:">点击再次搜索</a>` : '' }
                    ${ unmatchedKeywords.has(name) ? ` / <a class="l search-again" data-keyword="${name}" href="javascript:">查看搜索结果</a>` : '' }` : ''}
                </${ itemTag }>`).join('')}
        </div>`;
    }

    tipBox.style.opacity = '0';
    document.body.appendChild(tipBox);

    let isDragging = false;
    let startX, startY, offsetX, offsetY;

    const boxWidth = tipBox.offsetWidth;
    const boxHeight = tipBox.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let targetRight = 50;
    let targetBottom = 50;

    const maxRight = windowWidth - boxWidth;
    targetRight = Math.min(targetRight, maxRight);
    targetRight = Math.max(targetRight, 0);

    const maxBottom = windowHeight - boxHeight;
    targetBottom = Math.min(targetBottom, maxBottom);
    targetBottom = Math.max(targetBottom, 0);

    tipBox.style.bottom = `${targetBottom}px`;
    tipBox.style.right = `${targetRight}px`;
    tipBox.style.opacity = '';

    function handleMove(clientX, clientY) {
      const moveX = clientX - startX;
      const moveY = clientY - startY;
      const newX = offsetX + moveX;
      const newY = offsetY + moveY;

      tipBox.style.left = `${newX}px`;
      tipBox.style.top = `${newY}px`;
      tipBox.style.right = 'auto';
      tipBox.style.bottom = 'auto';
    }

    // 鼠标事件
    dragHandle.addEventListener('mousedown', (e) => {
      if (e.target === toggle) return; // 避开 checkbox，让它自己处理点击
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      offsetX = tipBox.offsetLeft;
      offsetY = tipBox.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      handleMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) isDragging = false;
    });

    // 触摸屏事件
    dragHandle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      offsetX = tipBox.offsetLeft;
      offsetY = tipBox.offsetTop;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isDragging) isDragging = false;
    });
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function getConvertedNames(str) {
    if (!loading && !Object.keys(converters).length) {
      loading = new Promise(resolve => {
        const srcs = [
          'https://cdn.jsdmirror.com/npm/opencc-js@1.0.5/dist/umd/full.js',
          'https://cdn.jsdmirror.com/npm/opencc-cn-name@0.1.1/dist/umd/opencc-cn-name.js',
        ];
        let remaining = srcs.length;
        let ok = true;
        srcs.forEach(src => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => {
            if (--remaining === 0) {
              if (ok && typeof OpenCC !== 'undefined') {
                regions.forEach(from => regions.forEach(to => {
                  if (from !== to) converters[`${from}-${to}`] = OpenCC.Converter({ from, to });
                }));
              }
              resolve(ok);
            }
          };
          script.onerror = () => {
            ok = false;
            if (--remaining === 0) resolve(false);
          };
          document.head.appendChild(script);
        });
      });
    }
    const success = await loading;
    if (!success || typeof openccCN === 'undefined') return [];

    const converted = new Set();
    regions.forEach(from => regions.forEach(to => {
      if (from !== to) converted.add(converters[`${from}-${to}`](str));
    }));
    // refined JP→CN conversion (handles variant/obsolete chars OpenCC misses)
    const refined = refinedToCN(str);
    if (refined !== str) converted.add(refined);
    return Array.from(converted);
  }

  function isSimilarOrContained(str1, str2) {
    if (!str1 || !str2) return false;

    str1 = str1.trim();
    str2 = str2.trim();

    // 包含关系
    if (str2.includes(str1)) {
      return true;
    }

    // 长度差大于1，直接返回false
    if (Math.abs(str1.length - str2.length) > 1) {
      return false;
    }

    // 计算差异字符数
    let diff = 0;
    for (let i = 0, j = 0; i < str1.length && j < str2.length; i++, j++) {
      if (str1[i] !== str2[j]) {
        diff++;
        if (diff > 1) return false;
        if (str1.length > str2.length) j--; // str1更长，str2指针回退
        else if (str1.length < str2.length) i--; // str2更长，str1指针回退
      }
    }

    return diff <= 1;
  }

  // #region https://bgm.tv/dev/app/3265 MIT modified
  /**
   * 从动画章节简介中提取制作人员信息
   * @param {Record<string, string>} epDescs - 章节数据，键为集数名（如 "1"），值为简介文本
   * @returns {[
   *   Record<string, Record<string, string[]>>,
   *   string[]
   * ]} [制作人员信息：{ 人物名称: { 职位名称: [对应集数名数组] } }, 未匹配到任何人员的集数名数组]
   */
  function extractStaffInfo(epDescs) {
    const result = {};
    const noStaffEps = [];

    for (const [epLabel, desc] of Object.entries(epDescs)) {
      let processedDesc = desc.replaceAll('\r', '').replaceAll(regex_sym, '、');

      // 按正则表达式位置排序，确保先匹配长的职位名称
      const regexes = Object.entries(regexes_per).sort((a, b) => {
        const posA = processedDesc.search(a[1]);
        const posB = processedDesc.search(b[1]);
        return posA < 0 ? 1 : posB < 0 ? -1 : posA - posB;
      });

      const episodeStaff = {};
      regexes.forEach(([role, regex]) => {
        const matches = processedDesc.match(regex);

        // 清理之前已匹配的人员名称中的职位前缀
        for (const existingRole in episodeStaff) {
          episodeStaff[existingRole] = episodeStaff[existingRole].map(name => {
            const replaced = trimCommas(name.replaceAll(regexes_role_per[role], ''));
            if (replaced[0] !== name[0]) {
              return trimCommas(name.replaceAll(regexes_role[role], ''));
            } else {
              return replaced;
            }
          });
        }

        episodeStaff[role] = [];
        if (matches) {
          episodeStaff[role] = matches.map(name => trimCommas(name));
        }
      });

      regexes.forEach(([role]) => {
        for (const existingRole in episodeStaff) {
          episodeStaff[existingRole] = episodeStaff[existingRole].map(name => {
            const replaced = trimCommas(name.replaceAll(regexes_role_per[role], ''));
            if (replaced[0] !== name[0]) {
              return trimCommas(name.replaceAll(regexes_role[role], ''));
            } else {
              return replaced;
            }
          });
        }
      });

      for (const role in episodeStaff) {
        const seenNames = new Set();
        const newStaffList = [];

        for (const name of episodeStaff[role]) {
          if (!name || name.trim() === '') continue;

          // 定义三类分隔符
          const separatorGroups = [
            ['、', ',', '，', '､'],  // 第一类：始终作为分隔符
            ['・', '•', '·', '･'],  // 第二类：前后不都是preservedchar时作为分隔符
            ['　', ' ']             // 第三类：空格
          ];

          let currentNames = [name.trim()];

          // 按优先级处理三类分隔符
          for (let groupIndex = 0; groupIndex < separatorGroups.length; groupIndex++) {
            const separators = separatorGroups[groupIndex];
            const newNames = [];

            for (const currentName of currentNames) {
              // 如果当前名称已经被分割过（不是原始名称），且不是第一组分隔符，则跳过
              if (groupIndex > 0 && currentNames.length > 1) {
                newNames.push(currentName);
                continue;
              }

              // 对于空格分隔符，检查长度条件
              if (groupIndex === 2) {
                const japaneseRegex = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3005\u30fc]/;
                const hasJapaneseCharacters = japaneseRegex.test(currentName);
                const hasKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(currentName);

                // 检查是否满足空格分割的长度条件
                const shouldSplitBySpace = hasJapaneseCharacters && (
                  hasKana ? currentName.length > 10 : currentName.length > 7
                );

                if (!shouldSplitBySpace) {
                  newNames.push(currentName);
                  continue;
                }
              }

              let tempName = '';
              const splitResult = [];
              let hasValidSeparator = false; // 标记是否有不满足跳过条件的分隔符

              for (let i = 0; i < currentName.length; i++) {
                const char = currentName[i];
                const prevChar = i > 0 ? currentName[i - 1] : '';
                const nextChar = i < currentName.length - 1 ? currentName[i + 1] : '';

                const isSeparator = separators.includes(char);

                if (isSeparator) {
                  // 对于第一组分隔符，始终分割
                  if (groupIndex === 0) {
                    if (tempName.trim()) {
                      splitResult.push(trimCommas(tempName));
                    }
                    tempName = '';
                    hasValidSeparator = true;
                  } else if (groupIndex === 1) {
                    // 对于第二组分隔符，检查上下文
                    const isEnglishContext =
                                            (isPreservedChar(prevChar) || !prevChar) &&
                                            (isPreservedChar(nextChar) || !nextChar);

                    if (!isEnglishContext) {
                      // 非英文上下文，进行分割
                      if (tempName.trim()) {
                        splitResult.push(trimCommas(tempName));
                      }
                      tempName = '';
                      hasValidSeparator = true; // 标记有不满足跳过条件的分隔符
                    } else {
                      // 英文上下文，保留分隔符
                      tempName += char;
                    }
                  } else if (groupIndex === 2) {
                    // 对于第三组分隔符（空格），检查上下文
                    const isEnglishContext =
                                            isPreservedChar(prevChar) &&
                                            isPreservedChar(nextChar);

                    if (!isEnglishContext) {
                      // 非英文上下文，进行分割
                      if (tempName.trim()) {
                        splitResult.push(trimCommas(tempName));
                      }
                      tempName = '';
                    } else {
                      // 英文上下文，保留空格
                      tempName += char;
                    }
                  }
                } else {
                  tempName += char;
                }
              }

              // 添加最后一个名称片段
              if (tempName.trim()) {
                splitResult.push(trimCommas(tempName));
              }

              // 如果没有被分割，保持原样
              if (splitResult.length === 0) {
                newNames.push(currentName);
              } else {
                // 空格拆分后，合并被空格拆散的汉字姓名（如 赵 小玲 → 赵小玲，梅田 香 → 梅田香）
                if (groupIndex === 2) {
                  const cjk1 = t => t.length === 1 && /[\u4e00-\u9fff]/.test(t);
                  const han = t => /^[\u4e00-\u9fff]+$/.test(t);
                  const sc = splitResult.filter(t => cjk1(t));
                  if (sc.length) {
                    const merged = [];
                    for (let i = 0; i < splitResult.length; i++) {
                      const c = splitResult[i];
                      const n = splitResult[i + 1];
                      if (cjk1(c) && n && han(n) && n.length >= 2) {
                        // 1+2: 单汉字姓 + 多字名 → 向前合并
                        merged.push(c + n);
                        i++;
                      } else if (n && cjk1(n) && c.length >= 2 && han(c)) {
                        // 2+1: 多字姓 + 单汉字名 → 向后合并（仅纯汉字）
                        merged.push(c + n);
                        i++;
                      } else if (cjk1(c) && n && cjk1(n)) {
                        // 1+1: 两单汉字 → 合并为一个双字名
                        merged.push(c + n);
                        i++;
                      } else {
                        merged.push(c);
                      }
                    }
                    newNames.push(...merged);
                  } else {
                    newNames.push(...splitResult);
                  }
                } else {
                  newNames.push(...splitResult);
                }

                // 对于第二类分隔符，如果有不满足跳过条件的分隔符，则重新处理所有片段
                if (groupIndex === 1 && hasValidSeparator) {
                  // 移除当前名称的所有片段
                  newNames.splice(newNames.length - splitResult.length, splitResult.length);

                  // 重新处理当前名称，忽略跳过条件
                  const reSplitResult = [];
                  let reTempName = '';

                  for (let i = 0; i < currentName.length; i++) {
                    const char = currentName[i];
                    const isSeparator = separators.includes(char);

                    if (isSeparator) {
                      if (reTempName.trim()) {
                        reSplitResult.push(trimCommas(reTempName));
                      }
                      reTempName = '';
                    } else {
                      reTempName += char;
                    }
                  }

                  // 添加最后一个名称片段
                  if (reTempName.trim()) {
                    reSplitResult.push(trimCommas(reTempName));
                  }

                  // 添加重新分割的结果
                  newNames.push(...reSplitResult.filter(n => n && n.trim() !== ''));
                }
              }
            }

            currentNames = newNames.filter(n => n && n.trim() !== '');
          }

          // 添加到最终结果
          currentNames.forEach(singleName => {
            if (singleName && singleName.trim() !== '') {
              newStaffList.push(singleName.trim());
            }
          });
        }

        // 去重处理
        episodeStaff[role] = newStaffList.filter(name => {
          if (seenNames.has(name) || !name || name.trim() === '') {
            return false;
          }
          seenNames.add(name);
          return true;
        });
      }

      let hasStaff = false;
      for (const [role, staffList] of Object.entries(episodeStaff)) {
        for (const name of staffList) {
          // eslint-disable-next-line no-irregular-whitespace
          const staffName = name.replace(/^([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3005\u30fc]{1,4})[ 　]+([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3005\u30fc]{1,4})$/g, '$1$2');
          result[staffName] ||= {};
          result[staffName][role] ||= [];
          if (!result[staffName][role].includes(epLabel)) {
            result[staffName][role].push(epLabel);
            hasStaff = true;
          }
        }
      }

      if (!hasStaff) noStaffEps.push(epLabel);
    }

    // 返回结果和没有匹配到人员的集数数组
    return [ result, noStaffEps ];
  }

  function isPreservedChar(char) {
    return /[a-zA-Z\u30a0-\u30ff\u3005\u30fc]/.test(char);
  }

  // 辅助函数
  function trimCommas(x) {
    if (typeof x === 'string') {
      x = x.trim();
      while (x.startsWith('、')) {
        x = x.replace('、', '').trimStart();
      }
      while (x.endsWith('、')) {
        x = x.split('').reverse().join('').replace('、', '').trimStart().split('').reverse().join('');
      }
    }
    return x;
  }
  // #endregion

  // #region https://bgm.tv/dev/app/2827 MIT modified
  /**
   * 自动搜索人物并关联到条目
   * @param {string} name - 要搜索的人物名称
   * @param {number} role - 职位ID
   * @returns { { ids: [], name: string } | void }
   */
  async function autoSearchAndRelate(name, role) {
    try {
      const bgmIdMap = getLastestMap();
      const searchResult = await searchPerson(name);
      let ids = new Set();
      let displayName;

      if (!searchResult) {
        failedKeywords.add(name);
        return;
      }

      if (Object.keys(searchResult).length) {
        for (let id in searchResult) {
          const resultName = searchResult[id].name;
          if (normalize(name) === normalize(resultName) || bgmIdMap[name] == id
                    || (await personAliasFallback(name)).some(a => a.id == id)) {
            await addPersonToRelate(role, normalize(name), id, searchResult[id]);
            ids.add(id);
            displayName ||= resultName;
          } else {
            unmatchedKeywords.add(name);
          }
        }
      }

      if (!displayName) return;
      return { ids: [...ids], name: displayName };
    } catch (error) {
      console.error('autoSearchAndRelate failed:', error);
    }
  }

  function normalize(name) {
    return name
      .replace(/\s/g, '').replaceAll('-', '')
      .replace(/々/g, function (m, offset, str) {
        return offset > 0 ? str[offset - 1] : '';
      })
      .replace(/[\u30A1-\u30F6]/g, function(match) {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
      })
      .replace(/[\uFF21-\uFF5A]/g, function(match) {
        return String.fromCharCode(match.charCodeAt(0) - 0xfee0);
      }).toLowerCase();
  }


  function getLastestMap() {
    let json = localStorage.getItem('localPrsnMap');
    let mergedMap = { ...bgmIdMap };

    try {
      if (json) {
        let obj = JSON.parse(json);
        mergedMap = { ...mergedMap, ...obj };
      }
    } catch (e) {
      console.warn('Failed to parse localPrsnMap:', e);
    }

    return mergedMap;
  }

  function searchPerson(query) {
    return new Promise(resolve => {
      const q = trans(query);
      const key = q;

      const execute = () => {
        $.ajax({
          type: 'GET',
          url: `/json/search-person/${encodeURIComponent(q)}`,
          dataType: 'json',
          success: res => {
            failedRequests.delete(key);
            resolve(res || {});
          },
          error: (xhr, status, error) => {
            const retries = (failedRequests.get(key) || 0) + 1;

            if (retries > MAX_RETRIES) {
              console.error('请求错误:', error, '查询:', query);
              failedRequests.delete(key);
              resolve(null);
              return;
            }

            failedRequests.set(key, retries);
            console.log(`"${query}" 将于 ${RETRY_INTERVAL}ms 后重试(${retries}/${MAX_RETRIES})`);
            setTimeout(execute, RETRY_INTERVAL);
          }
        });
      };

      execute();
    });
  }

  function trans(staff) {
    let id = bgmIdMap[staff];
    return id ? ('bgm_id=' + id) : staff;
  }

  async function addPersonToRelate(role, name, personId, personData) {
    const roleId = roleIdMap[role];
    if (!staffSet.has(roleId + '/' + personId)) {
      const existing = [...document.querySelectorAll('#crtRelateSubjects li')]
        .some(li => li.querySelector('.title a').href.split('/').pop() == personId
          && li.querySelector('select').value === roleId);
      if (existing) return false;

      staffSet.add(roleId + '/' + personId);
      staffSet.has(roleId + name) ? repeatSet.add(name + '-' + role) : staffSet.add(roleId + name);

      subjectList[personId] = personData;
      addRelateSubject(personId, 'searchResult');
      $('#crtRelateSubjects select').eq(0).val(roleId);
      addSbjListener();
      colorSbjList();
      return true;
    }
    return false;
  }

  function colorSbjList(item) {
    let map = new Map();
    $('#crtRelateSubjects li.clearit').each(function(idx) {
      let job = $(this).find('option:checked').text().split(' /')[0];
      let staff = $(this).find('.l').text();
      let key = staff + '-' + job;
      map.get(key) instanceof Array ? map.get(key).push(idx) : map.set(key, [idx]);

      if (!item) {
        let arr = map.get(key);
        let len = arr.length;
        if (len == 2) {
          colorItem(arr[0], true);
          colorItem(arr[1], true);
        } else if (len > 2) {
          colorItem(arr[len - 1], true);
        }
      }
    });
    if (item && map.get(item).length == 2) {
      colorItem(map.get(item)[0]);
      colorItem(map.get(item)[1]);
      repeatSet.delete(item);
    }
  }

  function colorItem(idx, flag) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('#crtRelateSubjects .clearit').eq(idx).css('background-color', flag ? (isDark ? '#3a3a2a' : '#eef4c9') : '');
  }

  function addSbjListener() {
    $('#crtRelateSubjects .rr').off('click').on('click', function() {
      let li = $(this).parents('li.clearit');
      let job = li.find('option:checked').text().split(' /')[0];
      let staff = li.find('.l').text();
      let item = staff + '-' + job;
      colorSbjList(item);
      li.remove();
    });
  }
  // #endregion

})();
