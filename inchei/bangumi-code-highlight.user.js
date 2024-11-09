// ==UserScript==
// @name         班固米代码高亮
// @namespace    https://bgm.tv/group/topic/409276
// @version      1.0
// @description  使用 highlight.js 高亮和检测代码块的语言，添加一键复制按钮
// @author       mvm
// @include     /^https?:\/\/(((fast\.)?bgm\.tv)|chii\.in|bangumi\.tv)\/(group|subject)\/topic\/*/
// @include     /^https?:\/\/(((fast\.)?bgm\.tv)|chii\.in|bangumi\.tv)\/(ep|person|character|blog)\/*/
// @grant        none
// @license      MIT
// ==/UserScript==

(async function() {
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
        customStyles.textContent = `
            .codeHighlight {
                position: relative;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 20px;
            }
            html[data-theme="dark"] .codeHighlight {
                border: 1px solid #444;
            }
            .codeHighlight pre {
                line-height: unset !important;
                border-radius: 0 0 5px 5px;
            }
            .codeHighlight .top-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 10px;
                font-size: 12px;
            }
            .codeHighlight .top-bar-light {
                background-color: #f7f7f7;
            }
            .codeHighlight .top-bar-dark {
                background-color: #2d2d2d;
                color: #fff;
            }
            .codeHighlight .top-bar button {
                background-color: transparent;
                font-size: 12px;
                padding: 5px 10px;
                cursor: pointer;
                border: none;
                border-radius: 5px;
            }
            .codeHighlight .top-bar button:hover {
                background-color: #eee;
            }
            html[data-theme="dark"] .codeHighlight .top-bar button:hover {
                background-color: #555;
            }
            .codeHighlight pre {
                counter-reset: line;
            }
            .codeHighlight pre code {
                position: relative;
                display: block;
            }
            .codeHighlight pre code:before {
                counter-increment: line;
                content: counter(line);
                display: inline-block;
                border-right: 1px solid #ddd;
                padding: 0 .5em;
                margin-right: .5em;
                color: #888;
                text-align: right;
                width: 2em;
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

        document.querySelectorAll('.codeHighlight .top-bar').forEach(bar => {
            console.log(theme)
            if (theme === 'dark') {
                bar.classList.remove('top-bar-light');
                bar.classList.add('top-bar-dark');
            } else {
                bar.classList.remove('top-bar-dark');
                bar.classList.add('top-bar-light');
            }
        });
    }

    // 加载 highlight.js
    async function loadHighlightJS() {
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
                const language = result.language || 'plaintext';

                // 创建显示语言名称和复制按钮的横条
                const topBar = document.createElement('div');
                const theme = document.documentElement.getAttribute('data-theme') || 'light';
                topBar.className = `top-bar top-bar-${theme}`;

                const langDiv = document.createElement('div');
                langDiv.textContent = `${language[0].toUpperCase() + language.slice(1)}`;

                const copyButton = document.createElement('button');
                copyButton.textContent = '复制代码';
                copyButton.addEventListener('click', () => {
                    copyToClipboard(block.textContent, copyButton);
                });

                topBar.appendChild(langDiv);
                topBar.appendChild(copyButton);
                block.parentNode.insertBefore(topBar, block);

                block.classList.add(`language-${language}`);
                hljs.highlightElement(block);
            });
            resolve(0);
        })
    }

    // 监听 #toggleTheme 按钮的点击事件
    document.getElementById('toggleTheme').addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        switchHighlightJSCSS(theme);
    });

    // 初始加载 highlight.js 样式和脚本，并应用当前主题
    loadHighlightJSCSS();
    loadHighlightJS();

})();
