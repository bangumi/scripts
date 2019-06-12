// ==UserScript==
// @name        代码块超进化！
// @namespace   tv.bgm.cedar.codeblockSuperEvolution!
// @version     2.0
// @description 进化！超代码块
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#post_\d+$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#;$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*\?.*/
// @grant        GM_addStyle
// ==/UserScript==

(function () {

  GM_addStyle(`
#code-block-settings {
	margin-top: 20px;
	font-size: 16px;
}
#code-block-settings input {
	margin-top: 10px;
	height: 24px;
	line-height: 24px;
	border: 1px solid #aaa;
	outline: none;
	padding: 0 5px;
	font-size: 16px;
}
#code-block-settings span {
	margin-right: 10px;
}
#code-block-settings a {
	cursor: pointer;
}
.code-block-settings-save {
	margin-right: 10px;
	cursor: pointer;
	display: inline-block;
}
.code-block-settings-save+span {
	display: inline-block;
	width: 16px;
	height: 8px;
	border: 5px solid limegreen;
	border-top: none;
	border-right: none;
	transform: rotate(-45deg);
}
`);

  let code = document.querySelectorAll(".codeHighlight>pre");
  let fontSettings = JSON.parse(localStorage['bgmcodeblockfont'] || "{}");
  let userfontfamily = fontSettings.fontfamily || "";
  let userfontsize = fontSettings.fontsize || "";

  const validCollapseCode = h => (h.startsWith('!===') && h.endsWith('===!') || h.startsWith('===') && h.endsWith('==='));
  const keywords = ['font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', 'font-family'];

  if (code.length) {
    let defaultfontfamily = $(code[0]).css('font-family');

    //const collapseBtn = $(document.createElement('button'))
    const collapseBtn = $(document.createElement('a'))
      .addClass("chiiBtn")
      .attr('href', 'javascript:;')
      .css('margin', '5px')
      .text("展开/折叠")
      .on("click", function() {
        $(this.nextElementSibling).fadeToggle("fast");
      });
    const codeTitle = $(document.createElement('span')).css('font-weight', 'bold');

    //remove block and handle code head
    for (let i = 0; i < code.length; i++) {
      code[i].innerHTML = code[i].innerHTML.replace(/<br>\n/g, "<br>");
      tryMakeCollapseCode(code[i]);
      tryAddLocalFontStyle(code[i]);
    }

    //add user-defined font style
    if (userfontfamily || userfontsize) {
      let style = document.createElement('style'); style.type = "text/css";
      style.innerHTML = ".codeHighlight>pre {"
        + (userfontfamily? "font-family:"+userfontfamily+","+defaultfontfamily+";": "")
        + (userfontsize? "font-size:"+userfontsize+"px;": "")
        + "}";
      document.head.appendChild(style);
    }

    //utility functions
    function tryMakeCollapseCode(codeblock) {
      let head = codeblock.innerHTML.split("<br>", 1)[0];
      if (!validCollapseCode(head))
        return;

      let title = parseTitle(head) || "折叠区域";
      $(codeblock).before(codeTitle.clone().text(title), collapseBtn.clone(true));

      //注意处理没有<br>的代码块: [code]===[/code]
      let i = codeblock.innerHTML.indexOf("<br>");
      if (i != -1)
        codeblock.innerHTML = codeblock.innerHTML.slice(i+4);

      if (head.startsWith('=')) //Note: code validity has been confirmed
        $(codeblock).hide();
    }

    function tryAddLocalFontStyle(codeblock) {
      let head = codeblock.innerHTML.split("<br>", 1)[0];
      let style = parseLocalFontStyle(head);
      if (style) $(codeblock).css(style);
    }

    function parseTitle(line) {
      if (line.startsWith('===') && line.endsWith('==='))
        return line.replace(/^=+$/, "").replace(/^=+\s*(.*?)\s*=+$/, "$1");
      if (line.startsWith('!===') && line.endsWith('===!'))
        return line.replace(/^!=+!$/, "").replace(/^!=+\s*(.*?)\s*=+!$/, "$1");
    }

    function parseLocalFontStyle(line) {
      if (!line.startsWith("font") && !line.startsWith("line-height"))
        return null;

      let testEl = document.createElement('span');
      testEl.setAttribute('style', line);
      let fontStyles = {};
      for (let k of keywords) {
        let style = testEl.style[k];
        if (style) fontStyles[k] = style;
      }
      if ('font-family' in fontStyles)
        fontStyles['font-family'] += ","+ (userfontfamily? userfontfamily+",": "")+defaultfontfamily;
      return fontStyles;
    }
  }

  if (location.pathname=="/settings") {
    let $settings = $(document.createElement('div')).attr('id', 'code-block-settings');
    let input = document.createElement('input'); input.type = "text"; input.maxLength = 100;
    let $fontFamily = $(input).clone().val(userfontfamily).css('width', '120px');
    let $fontSize = $(input).clone().val(userfontsize).css('width', '20px');

    $settings.append($(document.createElement('h2')).addClass('subtitle').text("Code块自定义"))
      .append( $(document.createElement('div')).append(
          $(document.createElement('span')).text('font-family:'), $fontFamily) )
      .append( $(document.createElement('div')).append(
          $(document.createElement('span')).text('font-size:'), $fontSize, $(document.createElement('span')).text('px'),
          $(document.createElement('a')).addClass("code-block-settings-save chiiBtn").text("保存").on("click", saveSettings),
          $(document.createElement('span')).hide()) );
    $('#columnB').append($settings);

    function saveSettings() {
      fontSettings.fontfamily = $fontFamily.val();
      fontSettings.fontsize = $fontSize.val();
      localStorage['bgmcodeblockfont'] = JSON.stringify(fontSettings);
      $(".code-block-settings-save+span").fadeIn("fast").fadeTo(300, 1).fadeOut("slow");
    }
  }
}) ();
