// ==UserScript==
// @name         bgm-unified-origin
// @namespace    https://github.com/bangumi/scripts/tree/master/mono
// @version      2
// @description  将bangumi各域名链接统一改为当前域名
// @author       mono <momocraft@gmail.com>
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\//
// @grant        none
// ==/UserScript==

(() => {
  const here = new URL(location.href);

  const replaceInternalLinkHref = () => {
    for (const link of document.querySelectorAll('a[href*="bgm.tv" i], a[href*="bangumi.tv" i], a[href*="chii.in" i]')) {
      const url = new URL(link.href);
      if (/^(bangumi\.tv|bgm\.tv|chii\.in)$/i.test(url.host)
        && (url.host !== here.host || url.protocol !== here.protocol)) {
        url.host = here.host;
        url.protocol = here.protocol;
        link.href = url.toString();
      }
    }
  };

  replaceInternalLinkHref();

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.type === 'childList')) {
      replaceInternalLinkHref();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
