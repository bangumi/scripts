#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, relative, join } from 'path';
import { createServer } from 'http';
import { parse } from 'userscript-meta';
import process from 'process';

const PORT = 3000;
const dir = 'inchei/';
const gadgets = [];

// 解析命令行参数（前缀）
const args = process.argv.slice(2);
let targetPrefix = null;

if (args.length > 0) {
  targetPrefix = args[0];
}

// 根据前缀查找匹配的文件
function findFilesByPrefix(prefix) {
  const baseDir = resolve();
  if (!existsSync(baseDir)) {
    console.error(`目录不存在: ${baseDir}`);
    return [];
  }

  const files = [];
  const searchPatterns = ['.gadget.js', '.user.gadget.js', '.user.js'];

  try {
    const allFiles = readdirSync(baseDir);

    for (const file of allFiles) {
      // 检查文件名是否以前缀开头
      if (!file.startsWith(prefix)) continue;

      // 检查是否匹配任一后缀
      for (const pattern of searchPatterns) {
        if (file.endsWith(pattern)) {
          files.push(resolve(join(baseDir, file)));
          break;
        }
      }
    }
  } catch (error) {
    console.error(`读取目录错误: ${error.message}`);
  }

  return files;
}

function getModifiedUserScriptFiles() {
  // 如果提供了前缀，查找匹配的文件
  if (targetPrefix) {
    const files = findFilesByPrefix(targetPrefix);
    if (files.length === 0) {
      console.error(`未找到前缀为 "${targetPrefix}" 的 .gadget.js 或 .user.gadget.js 文件`);
    }
    return files;
  }

  // 否则使用 git diff 获取修改的文件
  try {
    const output = execSync('git diff --name-only --diff-filter=AM origin/master...HEAD', {
      encoding: 'utf8'
    });
    const files = output.split('\n')
      .filter(file => file.startsWith(dir) && (file.endsWith('.gadget.js') || file.endsWith('.user.gadget.js')))
      .map(file => resolve(file))
      .filter(file => existsSync(file));
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

if (!modifiedFiles.length) {
  process.exit(0);
}

for (const file of modifiedFiles) {
  try {
    const content = readFileSync(file, 'utf8');
    const meta = parse(content);
    const { name, gadget: url, version } = meta;

    if (!url || !version) {
      console.error(`跳过无效文件: ${file}`);
      continue;
    }

    gadgets.push({
      name: name || file.split('/').pop().replace(/\.(gadget|user\.gadget)\.js$/, ''),
      url: `/dev/${url.split('/dev/')[1]}`,
      version,
      content,
      editSummary: getFileCommitHistory(file)
    });
    console.log(`✓ ${gadgets[gadgets.length-1].name}`);
  } catch (error) {
    console.error(`${file}：${error}`);
  }
}

if (!gadgets.length) {
  process.exit(1);
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
    server.close(() => process.exit(0));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  execSync(`"/mnt/c/Program Files/Mozilla Firefox/firefox.exe" "https://bgm.tv${gadgets[0].url}"`);
});
