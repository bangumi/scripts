// ==UserScript==
// @name         bgm-unified-origin
// @namespace    https://github.com/bangumi/scripts/tree/master/mono
// @version      3
// @description  将bangumi各域名链接统一改为当前域名
// @author       mono <momocraft@gmail.com>
// @include      /^https?:\/\//
// @grant        none
// ==/UserScript==

(() => {
  const here = new URL(location.href);
  const OFFICIAL_DOMAINS = ['bangumi.tv', 'bgm.tv', 'chii.in'];
  const STORAGE_KEY = 'bgm_unified_origin_custom_domains';
  const LIST_URL_STORAGE_KEY = 'bgm_unified_origin_mirror_list_url';
  const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  const DEFAULT_LIST_URL =
    'https://gist.githubusercontent.com/jokester/3b0b28e5bce4b0dd88ed1841f285f401/raw/4a242b2dcd481f03f92e5cc303eb0185d71542d2/bgm-mirror-domains.json';
  const MAX_LIST_BYTES = 1 << 20;

  /** @type {string[]} */
  let customDomains = [];
  /** @type {string} */
  let linkSelector = '';
  /** @type {boolean} */
  let replaceScheduled = false;
  /** @type {string[]} */
  let otaDomains = [];
  /** @type {'idle' | 'loading' | 'ok' | 'error' | 'manual'} */
  let otaState = 'idle';
  /** @type {string} */
  let listUrl = DEFAULT_LIST_URL;
  /** @type {() => void} */
  let refreshPanel = () => {};

  /** @returns {void} */
  function rebuildSelector() {
    const origins = [...OFFICIAL_DOMAINS, ...customDomains];
    linkSelector = origins.map((h) => `a[href*="${h}" i]`).join(', ');
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  function normalizeDomain(value) {
    let v = String(value ?? '').trim().toLowerCase();
    if (!v) return '';
    if (v.includes('://')) {
      try {
        v = new URL(v).hostname;
      } catch {
        return '';
      }
    }
    v = v.split('/')[0].split('?')[0].split('#')[0].replace(/:\d+$/, '');
    return DOMAIN_RE.test(v) ? v : '';
  }

  /**
   * @param {string} raw
   * @returns {string[]}
   */
  function parseDomains(raw) {
    try {
      const parsed = JSON.parse(raw || '[]');
      if (!Array.isArray(parsed)) return [];
      const out = [];
      for (const item of parsed) {
        const d = normalizeDomain(item);
        if (d && !OFFICIAL_DOMAINS.includes(d) && !out.includes(d)) out.push(d);
      }
      return out;
    } catch {
      return [];
    }
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  function readSetting(key) {
    if (typeof chiiApp !== 'undefined' && chiiApp?.cloud_settings) {
      try {
        return chiiApp.cloud_settings.get(key) || '';
      } catch {
        return '';
      }
    }
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   * @returns {void}
   */
  function writeSetting(key, value) {
    if (typeof chiiApp !== 'undefined' && chiiApp?.cloud_settings) {
      try {
        chiiApp.cloud_settings.update({ [key]: value });
        chiiApp.cloud_settings.save();
      } catch {}
    } else {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  function normalizeListUrl(value) {
    const v = String(value ?? '').trim();
    if (!v) return '';
    try {
      const u = new URL(v);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '';
    } catch {
      return '';
    }
  }

  /** @returns {void} */
  function loadSettings() {
    customDomains = parseDomains(readSetting(STORAGE_KEY));
    listUrl = normalizeListUrl(readSetting(LIST_URL_STORAGE_KEY)) || DEFAULT_LIST_URL;
    rebuildSelector();
  }

  /** @returns {void} */
  function applyCustomDomains() {
    writeSetting(STORAGE_KEY, JSON.stringify(customDomains));
    rebuildSelector();
    replaceInternalLinkHref();
  }

  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  function isBgmDomain(hostname) {
    const h = hostname.toLowerCase();
    return OFFICIAL_DOMAINS.includes(h) || customDomains.includes(h);
  }

  /** @returns {void} */
  function replaceInternalLinkHref() {
    if (!linkSelector) return;
    for (const link of document.querySelectorAll(linkSelector)) {
      try {
        const url = new URL(link.href);
        if (
          isBgmDomain(url.hostname)
          && (url.host !== here.host || url.protocol !== here.protocol)
        ) {
          url.host = here.host;
          url.protocol = here.protocol;
          link.href = url.toString();
        }
      } catch {}
    }
  }

  /**
   * @param {unknown} payload
   * @returns {string[]}
   */
  function extractDomains(payload) {
    const list = Array.isArray(payload) ? payload : payload?.domains;
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const item of list) {
      const d = normalizeDomain(item);
      if (d && !OFFICIAL_DOMAINS.includes(d) && !out.includes(d)) out.push(d);
    }
    return out;
  }

  /**
   * @returns {Promise<void>}
   */
  async function fetchOtaDomains() {
    if (otaState === 'loading') return;
    otaState = 'loading';
    refreshPanel();
    try {
      const res = await fetch(listUrl, { cache: 'no-store', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const declared = Number(res.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > MAX_LIST_BYTES) throw new Error('too large');
      const text = await res.text();
      if (text.length > MAX_LIST_BYTES) throw new Error('too large');
      otaDomains = extractDomains(JSON.parse(text));
      otaState = 'ok';
    } catch {
      otaDomains = [];
      otaState = 'error';
    }
    refreshPanel();
  }

  /**
   * @param {string} s
   * @returns {string}
   */
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** @returns {void} */
  function setupPanel() {
    if (typeof chiiLib === 'undefined' || !chiiLib.ukagaka || !chiiLib.ukagaka.addPanelTab) return;

    const TAB_ID = 'bgm_unified_origin';

    /** @returns {string} */
    function renderOtaResult() {
      if (otaState === 'loading') {
        return '<p style="color: #888;">正在获取…</p>';
      }
      if (otaState === 'manual') {
        return '<p style="color: #888;">自定义列表不会自动获取，请点击「获取」</p>';
      }
      if (otaState === 'idle') {
        return '';
      }
      if (otaState === 'error') {
        return '<p style="color: #888;">获取失败（网络错误、非 JSON 或内容过大）</p>';
      }

      const missing = otaDomains.filter((d) => !customDomains.includes(d));
      if (!missing.length) {
        return `<p style="color: #888;">列表中的 ${otaDomains.length} 个域名均已添加</p>`;
      }

      return `
        <p>尚未添加：${missing.map((d) => `<code>${escapeHtml(d)}</code>`).join('、')}</p>
        <button class="btnBlue" id="bgm-unified-origin-add-ota">一键添加（${missing.length}）</button>
      `;
    }

    /** @returns {string} */
    function renderOtaSection() {
      return `
        <h4>推荐镜像域名列表</h4>
        <p style="color: #888;">
          ${listUrl === DEFAULT_LIST_URL ? '当前使用默认列表，打开本面板时自动获取。' : '当前使用自定义列表，仅在点击「获取」时读取。'}
        </p>
        <div>
          <input type="text" id="bgm-unified-origin-url" value="${escapeHtml(listUrl)}" style="width: 100%; box-sizing: border-box;" />
        </div>
        <div style="margin-top: 6px;">
          <button class="btnGray" id="bgm-unified-origin-url-save">保存地址</button>
          <button class="btnGray" id="bgm-unified-origin-url-reset">恢复默认</button>
          <button class="btnBlue" id="bgm-unified-origin-fetch">获取</button>
        </div>
        <p id="bgm-unified-origin-url-status" style="margin-top: 6px; color: #666;"></p>
        ${renderOtaResult()}
      `;
    }

    /** @returns {string} */
    function renderContent() {
      const listHtml = customDomains.length
        ? customDomains.map((d, i) => `
            <li style="margin: 4px 0;">
              <code>${escapeHtml(d)}</code>
              <button class="btnGray remove-domain" data-index="${i}" style="margin-left: 8px;">删除</button>
            </li>
          `).join('')
        : '<li style="color: #888;">暂无自定义域名</li>';

      return `
        <div class="custom-content" style="padding: 12px;">
          <p>以下域名会被统一为当前页面域名（${escapeHtml(here.host)}）。</p>
          <p>默认域名：${OFFICIAL_DOMAINS.join('、')}</p>
          <h4>自定义镜像域名</h4>
          <ul id="bgm-unified-origin-list" style="list-style: none; padding: 0;">
            ${listHtml}
          </ul>
          <div style="margin-top: 12px;">
            <input type="text" id="bgm-unified-origin-input" placeholder="例如：bangumi.vip" style="width: 200px;" />
            <button class="btnBlue" id="bgm-unified-origin-add">添加</button>
          </div>
          <p id="bgm-unified-origin-status" style="margin-top: 8px; color: #666;"></p>
          <div style="margin-top: 12px; border-top: 1px solid #ddd; padding-top: 8px;">
            ${renderOtaSection()}
          </div>
        </div>
      `;
    }

    try {
      chiiLib.ukagaka.removePanelTab(TAB_ID);
    } catch {}

    chiiLib.ukagaka.addPanelTab({
      tab: TAB_ID,
      label: '统一域名',
      type: 'custom',
      customContent: renderContent,
      onInit: (tabSelector, $tabContent) => {
        refreshPanel = () => {
          if ($tabContent.closest('html').length) $tabContent.html(renderContent());
        };

        if ($tabContent.data('bgm-unified-origin-bound')) return;
        $tabContent.data('bgm-unified-origin-bound', true);

        /** @returns {void} */
        function addDomainFromInput() {
          const $input = $tabContent.find('#bgm-unified-origin-input');
          const $status = $tabContent.find('#bgm-unified-origin-status');
          const raw = String($input.val() || '').trim();

          if (!raw) {
            $status.text('');
            return;
          }

          const value = normalizeDomain(raw);
          if (!value) {
            $status.text('请输入有效的域名（如 bangumi.vip），不含 https:// 或 站内路径');
            return;
          }

          if (OFFICIAL_DOMAINS.includes(value) || customDomains.includes(value)) {
            $status.text('该域名已在列表中');
            return;
          }

          customDomains.push(value);
          applyCustomDomains();
          $tabContent.html(renderContent());
          $tabContent.find('#bgm-unified-origin-status').text(`已添加 ${value}`);
        }

        /**
         * @param {number} idx
         * @returns {void}
         */
        function removeDomainAt(idx) {
          if (idx >= 0 && idx < customDomains.length) {
            customDomains.splice(idx, 1);
            applyCustomDomains();
          }
          $tabContent.html(renderContent());
        }

        /** @returns {void} */
        function addMissingOtaDomains() {
          const missing = otaDomains.filter((d) => !customDomains.includes(d));
          if (!missing.length) return;
          customDomains.push(...missing);
          applyCustomDomains();
          $tabContent.html(renderContent());
          $tabContent.find('#bgm-unified-origin-status').text(`已添加 ${missing.join('、')}`);
        }

        /** @returns {void} */
        function saveListUrlFromInput() {
          const raw = String($tabContent.find('#bgm-unified-origin-url').val() || '').trim();
          const url = normalizeListUrl(raw) || (raw ? '' : DEFAULT_LIST_URL);
          if (!url) {
            $tabContent.find('#bgm-unified-origin-url-status').text('请输入有效的 http(s) 地址');
            return;
          }
          if (url === listUrl) {
            $tabContent.find('#bgm-unified-origin-url-status').text('地址未变更');
            return;
          }
          listUrl = url;
          writeSetting(LIST_URL_STORAGE_KEY, url === DEFAULT_LIST_URL ? '' : url);
          otaDomains = [];
          otaState = listUrl === DEFAULT_LIST_URL ? 'idle' : 'manual';
          $tabContent.html(renderContent());
          $tabContent.find('#bgm-unified-origin-url-status').text('已保存');
        }

        /** @returns {void} */
        function resetListUrl() {
          listUrl = DEFAULT_LIST_URL;
          writeSetting(LIST_URL_STORAGE_KEY, '');
          otaDomains = [];
          otaState = 'idle';
          $tabContent.html(renderContent());
          fetchOtaDomains();
        }

        $tabContent.on('click.bgm-unified-origin', '#bgm-unified-origin-add', addDomainFromInput);
        $tabContent.on('click.bgm-unified-origin', '#bgm-unified-origin-add-ota', addMissingOtaDomains);
        $tabContent.on('click.bgm-unified-origin', '#bgm-unified-origin-url-save', saveListUrlFromInput);
        $tabContent.on('click.bgm-unified-origin', '#bgm-unified-origin-url-reset', resetListUrl);
        $tabContent.on('click.bgm-unified-origin', '#bgm-unified-origin-fetch', () => fetchOtaDomains());
        $tabContent.on('keydown.bgm-unified-origin', '#bgm-unified-origin-input', (ev) => {
          if (ev.key === 'Enter') addDomainFromInput();
        });
        $tabContent.on('click.bgm-unified-origin', '.remove-domain', function () {
          removeDomainAt(parseInt(this.getAttribute('data-index'), 10));
        });
      },
    });

    if (listUrl === DEFAULT_LIST_URL) {
      fetchOtaDomains();
    } else {
      otaState = 'manual';
      refreshPanel();
    }
  }

  /**
   * @param {number} retries
   * @param {number} delay
   * @returns {Promise<boolean>}
   */
  async function waitForChiiLib(retries = 10, delay = 200) {
    for (let i = 0; i < retries; i++) {
      if (typeof chiiLib !== 'undefined' && chiiLib.ukagaka) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;
  }

  /** @returns {Promise<void>} */
  async function main() {
    loadSettings();

    const isBangumiLike = typeof chiiLib !== 'undefined' || typeof chiiApp !== 'undefined';
    if (!isBgmDomain(here.hostname) && !isBangumiLike) {
      return;
    }

    replaceInternalLinkHref();

    const observer = new MutationObserver((mutations) => {
      if (replaceScheduled || !mutations.some((m) => m.type === 'childList')) return;
      replaceScheduled = true;
      requestAnimationFrame(() => {
        replaceScheduled = false;
        replaceInternalLinkHref();
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    if (await waitForChiiLib()) {
      setupPanel();
    }
  }

  main();
})();
