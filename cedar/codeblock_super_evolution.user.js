// ==UserScript==
// @name        代码块超进化！
// @namespace   tv.bgm.cedar.codeblockSuperEvolution!
// @version     3.0.3
// @description 进化！超代码块
// @author      Cedar
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#post_\d+$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*#;$/
// @include     /^https?://((bangumi|bgm)\.tv|chii\.in)/.*\?.*/
// @grant        GM_addStyle
// ==/UserScript==

'use strict';

GM_addStyle(`
/* for settings page */
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

/* for code collapse */
.code-block-collapse-wrapper {
  padding: 10px;
  border: 2px solid #EEE;
  background-color: #FEFBFC;
  border-radius: 5px;
}

html[data-theme='dark'] .code-block-collapse-wrapper {
  border: 2px solid #444;
  background-color: #302E30;
}

.code-block-collapse-wrapper pre {
  padding-top: 10px;
  border-top: 2px solid #EEE;
  margin-top: 10px;
}

html[data-theme='dark'] .code-block-collapse-wrapper pre {
  border-top: 2px solid #444;
}
`);

function loadSettings() {
  return JSON.parse(localStorage['bgmcodeblockfont'] || `{"fontfamily": "","fontsize": ""}`);
}

function saveSettings(fontfamily, fontsize) {
  fontSettings.fontfamily = fontfamily;
  fontSettings.fontsize = fontsize;
  localStorage['bgmcodeblockfont'] = JSON.stringify(fontSettings);
  $(".code-block-settings-save+span").fadeIn("fast").fadeTo(300, 1).fadeOut("slow");
}

const fontSettings = loadSettings();
let defaultfontfamily = null;

function validFontStyleLine(line) {
  return line.startsWith("font") || line.startsWith("line-height");
}

function tryMakeCollapseCode(preNode) {
  const header = preNode.textContent.split("\n", 1)[0]; // 得到 "=== title ==="
  const config = parseCodeBlockHeader(header)
  if (!config.isValid)
    return;

  // 注意处理没有换行的单行代码块：[code]===[/code]
  let i = preNode.textContent.indexOf("\n");
  if (i != -1)
    preNode.textContent = preNode.textContent.slice(i + 1); // 去掉开头的 === title ===\n

  const collapseWrapper = getCollapseEl(config.title);
  preNode.insertAdjacentElement('beforebegin', collapseWrapper);
  collapseWrapper.append(preNode);
  if (config.openByDefault)
    collapseWrapper.setAttribute("open", "");
}

function parseCodeBlockHeader(str) {
  const invalidResult = { isValid: false, openByDefault: false, title: null };

  // 两侧有感叹号表示默认展开，如 `!===!`
  const startWithExclamation = str.startsWith('!');
  const endWithExclamation = str.endsWith('!');
  // 感叹号必须对称
  if (startWithExclamation !== endWithExclamation) return invalidResult;

  // 剥离两端的感叹号
  const innerStr = startWithExclamation ? str.slice(1, -1) : str;
  // 必须以至少3个等号开头，如 `===`
  const leftEqualsCount = (innerStr.match(/^=+/) ?? [''])[0].length;
  if (leftEqualsCount < 3) return invalidResult;
  // 左右等号数量要一致
  const rightEqualsCount = (innerStr.match(/=+$/) ?? [''])[0].length;
  if (leftEqualsCount !== rightEqualsCount) return invalidResult;

  // 剥离两端的等号
  // 注意：如果字符串全是等号，如 `===`，slice 之后会得到空字符串 `""`
  const titlePart = innerStr.slice(leftEqualsCount, -leftEqualsCount);
  // 解析标题。标题不能只有空格，即 `=== ===` 非法。如果无标题，则只能写为形如 `===` 或者 `!===!` 的形式
  const title = titlePart.trim();
  if (titlePart.length > 0 && title === "") return invalidResult;

  return {
    isValid: true,
    openByDefault: startWithExclamation,
    title: title || "展开 / 折叠"
  };
}

// 用于组装折叠元素
function getCollapseEl(title) {
  const summaryEl = document.createElement('summary');
  summaryEl.style.fontWeight = "bold";
  summaryEl.style.cursor = "pointer";
  summaryEl.textContent = title;
  const collapseWrapper = document.createElement("details");
  collapseWrapper.classList.add("code-block-collapse-wrapper");
  collapseWrapper.append(summaryEl);

  return collapseWrapper;
}

function tryAddLocalFontStyle(preNode) {
  // 注意调用该函数前必须先把标题处理好
  let head = preNode.textContent.split("\n", 1)[0];
  let style = parseLocalFontStyle(head);
  if (style) {
    Object.assign(preNode.style, style);
  }
}

const fontStyleKeywords = ['font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', 'font-family'];

function parseLocalFontStyle(line) {
  if (!validFontStyleLine(line))
    return null;

  // 用临时元素判定用户的 font style 有效性，并保存合法结果，更安全
  let testEl = document.createElement('span');
  testEl.setAttribute('style', line);
  let fontStyles = {};
  for (const k of fontStyleKeywords) {
    let style = testEl.style[k];
    if (style) fontStyles[k] = style;
  }
  if ('font-family' in fontStyles && fontSettings.fontfamily)
    fontStyles['font-family'] += `, ${fontSettings.fontfamily}, ${defaultfontfamily}`;
  return fontStyles;
}

function handleCodeBlock(preNodes) {
  for (const c of preNodes) {
    c.textContent = c.textContent; // bangumi 的代码 bug 会在所有 `\n` 后面添加不必要的 <br> 标签。该代码可去除 pre 元素中包括 <br> 的所有标签，只留下纯文本。
    tryMakeCollapseCode(c);
    tryAddLocalFontStyle(c);
  }
}

function addUserFontStyleNode() {
  if (fontSettings.fontfamily || fontSettings.fontsize) {
    const style = document.createElement('style');
    style.type = "text/css";
    style.textContent = ".codeHighlight pre {"
      + (fontSettings.fontfamily && `font-family: ${fontSettings.fontfamily}, ${defaultfontfamily};`)
      + (fontSettings.fontsize && `font-size: ${fontSettings.fontsize}px;`)
      + "}";
    document.head.appendChild(style);
  }
}

function addSettingsPage() {
  // 尽可能不用 jQuery 实现
  // let $settings = $(document.createElement('div')).attr('id', 'code-block-settings');
  // let input = document.createElement('input'); input.type = "text"; input.maxLength = 100;
  // let $fontFamily = $(input).clone().val(fontSettings.fontfamily).css('width', '120px');
  // let $fontSize = $(input).clone().val(fontSettings.fontsize).css('width', '20px');

  // $settings.append($(document.createElement('h2')).addClass('subtitle').text("Code块自定义"))
  //   .append($(document.createElement('div')).append(
  //     $(document.createElement('span')).text('font-family:'), $fontFamily))
  //   .append($(document.createElement('div')).append(
  //     $(document.createElement('span')).text('font-size:'), $fontSize, $(document.createElement('span')).text('px'),
  //     $(document.createElement('a')).addClass("code-block-settings-save chiiBtn").text("保存").on("click", saveSettings),
  //     $(document.createElement('span')).hide()));
  // $('#columnB').append($settings);

  // Create the settings element
  const settings = document.createElement('div');
  settings.id = 'code-block-settings';

  // Create the title (h2)
  const title = document.createElement('h2');
  title.classList.add('subtitle');
  title.textContent = "Code块自定义";

  // Create the font-family label
  const fontFamilyLabel = document.createElement('span');
  fontFamilyLabel.textContent = 'font-family:';
  // Create the input element for font-family
  const fontFamilyInput = document.createElement("input");
  fontFamilyInput.type = "text";
  fontFamilyInput.maxLength = 100;
  fontFamilyInput.value = fontSettings.fontfamily;
  fontFamilyInput.style.width = "120px";
  // Create font-family container and append input and label
  const fontFamilyContainer = document.createElement('div');
  fontFamilyContainer.append(fontFamilyLabel, fontFamilyInput);

  // Create the input element for font-size
  const fontSizeInput = fontFamilyInput.cloneNode();
  fontSizeInput.value = fontSettings.fontsize;
  fontSizeInput.style.width = "20px";
  // Create the font-size label
  const fontSizeLabel = document.createElement('span');
  fontSizeLabel.textContent = 'font-size:';
  // Create the font-size unit (px)
  const fontSizeUnit = document.createElement('span');
  fontSizeUnit.textContent = 'px';
  // Create font-family container and append input label and unit
  const fontSizeContainer = document.createElement('div');
  fontSizeContainer.append(fontSizeLabel, fontSizeInput, fontSizeUnit);

  // Create the save button and add click event listener
  const saveButton = document.createElement('a');
  saveButton.classList.add("code-block-settings-save", "chiiBtn");
  saveButton.textContent = "保存";
  saveButton.addEventListener('click', () => { saveSettings(fontFamilyInput.value, fontSizeInput.value) });

  const savedHintEl = document.createElement('span');
  savedHintEl.style.display = 'none';

  // Append the settings element to the target container
  settings.append(fontFamilyContainer, fontSizeContainer, saveButton, savedHintEl);
  document.getElementById('columnSearchC').appendChild(settings);
}

function main() {
  const preNodes = document.querySelectorAll(".codeHighlight > pre");
  if (preNodes.length) {
    defaultfontfamily = window.getComputedStyle(preNodes[0]).getPropertyValue('font-family');

    //remove block and handle code head
    handleCodeBlock(preNodes);

    //add user-defined font style
    addUserFontStyleNode();
  }

  if (location.pathname == "/settings") {
    addSettingsPage();
  }
}

main();
