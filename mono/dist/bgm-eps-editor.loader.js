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

  script.src = "https://rawgit.com/bangumi/scripts/master/mono/bgm-eps-editor.min.user.js";
  script.integrity = "sha384-zqTbGecQ6gArPITvoVHEOpjC106CyxOqk63b/Dy79t5Dg5r6kpoNvp+Py+I/IeRU";

  document.head.appendChild(script);
})();
