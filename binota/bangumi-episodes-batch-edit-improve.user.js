// ==UserScript==
// @name        Bangumi Episodes Batch Edit Improve
// @namespace   org.binota.scripts.bangumi.bebei
// @description 章节批量编辑增强
// @include     /^https?:\/\/(bgm\.tv|bangumi\.tv|chii\.in)\/subject\/\d+\/ep(\/edit_batch)?/
// @version     0.1.0
// @grant       none
// @author      BinotaLIU
// ==/UserScript==

'use strict';

const $ = selector => document.querySelector(selector);
const $a = selector => document.querySelectorAll(selector);

const chunk = (input, size) => input.reduce((arr, item, idx) => idx % size === 0 ? [...arr, [item]] : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]], []);
const say = str => unsafeWindow.chiiLib.ukagaka.presentSpeech(str);

const baseUrl = `${window.location.pathname.match(/^\/subject\/\d+\/ep/).find(() => true)}/edit_batch`;
const csrfToken = $('[name=formhash]').value;

const fetchEpisodesData = async (episodes) =>
  await fetch(
    baseUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `chkall=on&submit=%E6%89%B9%E9%87%8F%E4%BF%AE%E6%94%B9&formhash=${csrfToken}&${episodes.map(ep => `ep_mod%5B%5D=${ep}`).join('&')}`,
    }
  )
    .then(res => res.text())
    .then(html => ((html || '').match(/<textarea name="ep_list"[^>]+>([\w\W]+)?<\/textarea/) || [null, ''])[1].trim());

const updateEpisodesData = async (episodes, data) =>
  await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: `formhash=${csrfToken}&rev_version=0&editSummary=${encodeURIComponent($('#editSummary').value)}&ep_ids=${episodes.join(',')}&ep_list=${encodeURIComponent(data)}&submit_eps=%E6%94%B9%E5%A5%BD%E4%BA%86`
  });

const app = async (episodes) => {
  if (episodes.length <= 20) return;

  // chunk episodes to 20
  const data = [];
  const epChunks = chunk(episodes, 20);
  say('加载章节列表中');
  for (const chunk of epChunks) {
    data.push(await fetchEpisodesData(chunk));
  }
  $('#summary').value = data.join('\n');
  $('[name=ep_ids]').value = episodes.join(',');

  $('[name=edit_ep_batch]').addEventListener('submit', (e) => {
    e.preventDefault();
    const lines = $('#summary').value.trim().split('\n').map(i => i.trim());
    if (lines.length !== episodes.length) {
      return false;
    }
    const dataChunks = chunk(lines, 20);
    (async () => {
      say('保存资料中……');
      for(const i in dataChunks) {
        await updateEpisodesData(epChunks[i], dataChunks[i].join('\n'));
      }
      say('保存完毕');
      window.location.href = window.location.pathname.match(/^\/subject\/\d+\/ep/).find(() => true);
    })();
    return false;
  });

  say('章节列表载入完毕');
}

const episodes = (window.location.hash.match(/#episodes=((\d+,)*\d+)/) || [null, ''])[1].split(',').filter(i => i.length);
if (episodes.length) {
  app(episodes);
  return;
}

const updateFormAction = () => {
  $('[name=edit_ep_batch]').action = `${baseUrl}#episodes=${[...$a('[name="ep_mod[]"]:checked')].map(i => i.value).join(',')}`;
};

[...$a('[name="ep_mod[]"]')].forEach($chkbox => {
  $chkbox.onchange = updateFormAction;
});
$('[name=chkall]').onclick = () => {
  [...$a('[name="ep_mod[]"]')].map(i => { i.checked = true });
  updateFormAction();
};

