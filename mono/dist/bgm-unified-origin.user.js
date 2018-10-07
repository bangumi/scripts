// ==UserScript==
// @name         bgm-unified-origin
// @namespace    https://github.com/bangumi/scripts/tree/master/mono
// @version      1
// @description  将bangumi各域名链接统一改为当前域名
// @author       mono <momocraft@gmail.com>
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\//
// @grant        none
// ==/UserScript==

try {
  if (typeof URL !== 'function') throw "URL api not available";
  var here = new URL(location.href);
  document
    .querySelectorAll('a[href*="bgm.tv" i], a[href*="bangumi.tv" i], a[href*="chii.in" i]')
    .forEach(function (link) {
      try {
        var url = new URL(link.href);
        if (/^(bangumi\.tv|bgm\.tv|chii\.in)$/i.test(url.host)
          && (url.host !== here.host || url.protocol !== here.protocol)) {
          url.host = here.host;
          url.protocol = here.protocol;
          link.href = url.toString();
        }
      } catch (eSubst) {
        console.warn("bangumi.tv/dev/app/264 // failed to replace host in ", link);
      }
    });

} catch (e) {
  console.warn("bangumi.tv/dev/app/264 // something went wrong", e);
}
