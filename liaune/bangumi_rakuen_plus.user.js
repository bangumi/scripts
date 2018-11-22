// ==UserScript==
// @name         bangumi_rakuen_plus
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      1.0
// @description  为超展开菜单加入更多探索功能，如：dollars、timeline、magi、wiki等
// @author       Liaune
// @include        /^https?://(bgm\.tv|chii\.in|bangumi\.tv)\/rakuen
// @grant        none
// ==/UserScript==

(function() {
    $('#rakuenTab').find('.timelineTabs').append(`<li>
<a href="/dollars" class="top" target="right">更多</a>
<ul>
<li><a href="/dollars" target="right">Dollars</a></li>
<li><a href="/timeline" target="right">时空管理局</a></li>
<li><a href="/magi" target="right">MAGI 问答</a></li>
<li><a href="/wiki" target="right">维基人</a></li>
<li><a href="/help/bbcode" target="right">BBCode 标签指南</a></li>
<li><a href="/about" target="right">关于我们</a></li>
<li><a href="/about/guideline" target="right">社区指导原则</a></li>
</ul></li>`);
})();
