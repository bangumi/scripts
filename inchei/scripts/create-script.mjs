#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';
import openFile from './utils.mjs';

const scriptId = process.argv[2];
const scriptName = process.argv[3];
const scriptDescription = process.argv[4];

if (!scriptId) {
    process.exit(1);
}

const safeFileName = scriptId
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
const filePath = path.resolve(process.cwd(), `${safeFileName}.user.js`);

if (fs.existsSync(filePath)) {
    console.error(`文件已存在！`);
    process.exit(1);
}

const camelToDotLower = (str) => str.replace(/([A-Z])/g, (match) => `.${match.toLowerCase()}`);

// 生成默认脚本内容
const scriptContent = `// ==UserScript==
// @name         ${scriptName || scriptId}
// @namespace    bangumi.${camelToDotLower(scriptId)}
// @version      0.0.1
// @description  ${scriptDescription || scriptName || ''}
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/*
// @match        http*://chii.in/*
// @match        http*://bangumi.tv/*
// @grant        none
// @license      MIT
// @gf
// ==/UserScript==

(function () {
    'use strict';

})();
`;

// 写入文件
try {
    fs.writeFileSync(filePath, scriptContent, 'utf8');
    openFile(filePath);
} catch (error) {
    console.error(`创建脚本失败：${error.message}`);
    process.exit(1);
}
