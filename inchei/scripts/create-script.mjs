#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';
import openFile from './utils.mjs';

const scriptName = process.argv[2];

if (!scriptName) {
    process.exit(1);
}

const safeFileName = scriptName
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
const filePath = path.resolve(process.cwd(), `${safeFileName}.user.js`);

if (fs.existsSync(filePath)) {
    console.error(`文件已存在！`);
    process.exit(1);
}

// 生成默认脚本内容
const scriptContent = `// ==UserScript==
// @name         ${scriptName}
// @namespace    
// @version      0.0.1
// @description  ${scriptName}
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
