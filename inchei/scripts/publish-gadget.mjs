#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';
import { createServer } from 'http';
import { parse } from 'userscript-meta';
import process from 'process';

const PORT = 3000;
const dir = 'inchei/';
const gadgets = [];

function getModifiedUserScriptFiles() {
    try {
        const output = execSync('git diff --name-only --diff-filter=AM origin/master...HEAD', {
            encoding: 'utf8'
        });
        const files = output.split('\n').filter(file => file.startsWith(dir) && file.endsWith('.user.js'))
            .map(file => resolve(file.slice(dir.length))).filter(file => existsSync(file))
            .filter(file => {
                const gadget = file.replace('.user.js', '.gadget.js');
                return existsSync(gadget) ? gadget : file;
            });
        return files;
    } catch (error) {
        console.error('获取修改文件错误:', error.message);
        return [];
    }
}

function getFileCommitHistory(filePath) {
    try {
        const relPath = relative(process.cwd(), filePath);
        const output = execSync(`git log --oneline --since="last push" -- "${relPath}"`, {
            encoding: 'utf8'
        });
        return output.split('\n')
            .filter(line => line.trim())
            .map(line => line.substring(line.indexOf(' ') + 1))
            .join('；');
    } catch {
        return '自动更新';
    }
}

const modifiedFiles = getModifiedUserScriptFiles();

console.log('即将提交的组件:');

for (const file of modifiedFiles) {
    try {
        const content = readFileSync(file, 'utf8');
        const meta = parse(content);
        const { name, gadget: url, version } = meta;
        if (!url || !version) continue;

        gadgets.push({
            name, url,
            version,
            content: content,
            editSummary: getFileCommitHistory(file)
        });
        console.log(`  - ${name}`);
    } catch (error) {
        console.error('解析文件错误:', file, error.message);
    }
}

if (!gadgets.length) {
    process.exit(0);
}

const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/gadgets' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, data: gadgets }));
        server.close(() => {
            process.exit(0);
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    // execSync(`"C:\\Program Files\\Mozilla Firefox\\firefox.exe" "${gadgets[0].url}"`);
    execSync(`"/mnt/c/Program Files/Mozilla Firefox/firefox.exe" "${gadgets[0].url}"`);
});
