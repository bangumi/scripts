// ==UserScript==
// @name         班固米代码高亮
// @namespace    https://bgm.tv/group/topic/409276
// @version      1.8
// @description  使用 highlight.js 高亮和检测代码块的语言，添加一键复制按钮
// @author       mvm
// @match        https://bgm.tv/http*://bgm.tv/group/topic/*
// @match        https://bangumi.tv/http*://bgm.tv/group/topic/*
// @match        https://chii.in/http*://bgm.tv/group/topic/*
// @grant        none
// @license      MIT
// @greasy       https://greasyfork.org/zh-CN/scripts/516547
// @gadget       https://bgm.tv/dev/app/3377

// ==/UserScript==

(async function () {
    'use strict';

    // 加载 highlight.js 样式
    function loadHighlightJSCSS() {
        const dayLink = document.createElement('link');
        dayLink.rel = 'stylesheet';
        dayLink.id = 'highlight-css-day';
        dayLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/github.min.css';
        document.head.appendChild(dayLink);

        const nightLink = document.createElement('link');
        nightLink.rel = 'stylesheet';
        nightLink.id = 'highlight-css-night';
        nightLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/github-dark.min.css';
        nightLink.disabled = true;
        document.head.appendChild(nightLink);

        // 添加自定义样式
        const customStyles = document.createElement('style');
        customStyles.textContent = /* css */`
            .codeHighlight {
                position: relative;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
            }
            html[data-theme="dark"] .codeHighlight {
                border: 1px solid #444;
            }
            .codeHighlight pre {
                line-height: 1.5 !important;
                border-radius: 0 0 5px 5px;
                font-family: monospace;
                scrollbar-width: thin;
            }
            .codeHighlight .top-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 10px;
                font-size: 12px;
            }
            .codeHighlight pre {
                counter-reset: line;
                position: relative;
                display: block;
                max-height: 400px;
                padding-right: 100px !important;
            }
            .codeHighlight .copy-button {
                position: absolute;
                top: 6px;
                right: 15px;
                padding: 5px 10px;
                cursor: pointer;
                border: none;
                background-color: #eee;
                color: #444;
                font-size: 12px;
                border-radius: 2px;
                z-index: 1;
                transition: all .3s ease-in-out;
            }
            @media (hover: hover) and (pointer: fine) {
                .codeHighlight pre {
                    padding-right: unset;
                }
                .codeHighlight .copy-button {
                    opacity: 0;
                }
                .codeHighlight:hover .copy-button,
                .copy-button:focus {
                    opacity: 1;
                }
            }
            .copy-button:hover {
                background-color: #dedede;
            }
            html[data-theme="dark"] .copy-button {
                background-color: #333;
                color: #eee;
            }
            html[data-theme="dark"] .copy-button:hover {
                background-color: #444;
            }
        `;
        document.head.appendChild(customStyles);
    }

    // 切换 highlight.js 样式
    function switchHighlightJSCSS(theme) {
        const dayLink = document.getElementById('highlight-css-day');
        const nightLink = document.getElementById('highlight-css-night');

        if (theme === 'dark') {
            dayLink.disabled = true;
            nightLink.disabled = false;
        } else {
            dayLink.disabled = false;
            nightLink.disabled = true;
        }
    }

    // 加载 highlight.js
    function loadHighlightJS() {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/highlight.min.js';
        script.onload = async () => {
            await initializeHighlightJS();
            switchHighlightJSCSS(document.documentElement.getAttribute('data-theme') || 'light');
        };
        document.head.appendChild(script);
    }

    // 复制代码到剪贴板
    function copyToClipboard(text, button) {
        if (navigator.clipboard && window.isSecureContext) {
            // 使用 Clipboard API
            navigator.clipboard.writeText(text).then(() => {
                button.textContent = '已复制';
            }).catch(err => {
                console.error('无法复制文本：', err);
                button.textContent = '复制失败';
            });
        } else {
            // 使用回退方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                button.textContent = '已复制';
            } catch (err) {
                console.error('无法复制文本：', err);
                button.textContent = '复制失败';
            }
            document.body.removeChild(textArea);
        }

        setTimeout(() => { button.textContent = '复制代码'; }, 3000);
    }

    // 初始化 highlight.js
    async function initializeHighlightJS() {
        return new Promise((resolve, reject) => {
            document.querySelectorAll('.codeHighlight').forEach(blockWrapper => {
                blockWrapper.innerHTML = blockWrapper.innerHTML.replace('<pre><br>', '<pre>');
                const block = blockWrapper.querySelector('pre');
                const result = hljs.highlightAuto(block.textContent);

                // 创建复制按钮
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button';
                copyButton.tabIndex = 0;
                copyButton.textContent = '复制代码';
                copyButton.addEventListener('click', () => {
                    copyToClipboard(block.textContent, copyButton);
                });

                block.parentNode.insertBefore(copyButton, block);

                block.classList.add(`language-${result.language ?? 'plaintext'}`);
                hljs.highlightElement(block);
            });
            resolve(0);
        })
    }

    const oldUpdateTheme = chiiLib.ukagaka.updateTheme;
    chiiLib.ukagaka.updateTheme = function (style, remember) {
        oldUpdateTheme.call(this, style, remember);
        switchHighlightJSCSS(style);
    }

    // 初始加载 highlight.js 样式和脚本，并应用当前主题
    loadHighlightJSCSS();
    loadHighlightJS();

})();