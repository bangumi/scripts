// ==UserScript==
// @name         bgm-eps-editor
// @namespace    https://github.com/bangumi/scripts/tree/master/mono
// @version      7
// @description  章节列表编辑器
// @author       mono <momocraft@gmail.com>
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/subject\/\d+\/ep\/edit_batch/
// @grant        none
// ==/UserScript==
(function() {
  var script = document.createElement("script");
  script.crossOrigin = "anonymous";

  script.src = "https://cdn.rawgit.com/bangumi/scripts/f425267e44da6c8f6dbfa592a50602984a2e23e9/mono/dist/bgm-eps-editor.min.user.js";
  script.integrity = "sha384-DtKD6X1yw6ZTTQUTHy2yhkRbzj9548i6CNVKalN/SPTM7EFGal8+K3k6Rjb9MdMi";

  document.head.appendChild(script);
})();
