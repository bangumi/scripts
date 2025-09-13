import fs from 'fs';
import path from 'path';
import { parse } from 'userscript-meta';
import { fileURLToPath } from 'url';
import openFile from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

// 读取当前目录下所有 .user.js 文件
const getUserScripts = () => {
    return fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.user.js'))
        .map(file => path.join(__dirname, file));
};

// 解析 user.js 元数据（包括@gf    和@gadget）
const parseUserScript = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // 匹配 UserScript 元数据块
        const metaBlockRegex = /\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/;
        const metaMatch = content.match(metaBlockRegex);
        if (!metaMatch) return null;

        // 使用userscript-meta包解析元数据
        const meta = parse(metaMatch[1]);

        // 提取所需字段（直接使用解析结果，不做[0]截断）
        return {
            name: meta.name ? String(meta.name).trim() : null,
            description: meta.description ? String(meta.description).trim() : null,
            version: meta.version ? String(meta.version).trim() : null,
            namespace: meta.namespace ? String(meta.namespace).trim() : null,
            homepage: meta.homepage ? String(meta.homepage).trim() : null,
            support: meta.support ? String(meta.support).trim() : null,
            gf: meta.gf ? String(meta.gf).trim() : null,
            gadget: meta.gadget ? String(meta.gadget).trim() : null,
            filename: path.basename(filePath)
        };
    } catch (error) {
        console.warn(`解析 ${path.basename(filePath)} 出错:`, error.message);
        return null;
    }
};

// 提取链接最后的数字
const getLinkNumber = (url) => {
    if (!url) return '';
    // 匹配链接中最后一段的数字（支持多种格式）
    const match = url.match(/(\d+)\/*$/);
    return match ? match[1] : '链接';
};

// 生成 README.md 内容
const generateREADME = (scripts) => {
    let content = `# [inchei](https://bgm.tv/user/inchei)\n\n`;

    if (scripts.length === 0) {
        content += `暂无脚本，请添加 .user.js 文件后重新生成。\n`;
        return content;
    }

    scripts.forEach(script => {
        if (!script.name) return;

        const githubUrl = `https://github.com/bangumi/scripts/blob/master/inchei/${script.filename}?raw=true`;
        const githubNum = script.filename;
        const gfNum = script.gf ? getLinkNumber(script.gf) : '无';
        const gadgetNum = script.gadget ? getLinkNumber(script.gadget) : '无';

        // 添加脚本标题
        content += `## ${script.name} \`${script.version}\`\n`;

        // 添加描述
        if (script.description) {
            content += `${script.description}\n\n`;
        }

        // 添加讨论页;
        const topicUrl = [script.namespace, script.homepage, script.support].find(url => url?.includes('/group/topic'));
        if (topicUrl) {
            content += `- 讨论页：${topicUrl}\n\n`;
        }

        // 添加链接表格
        content += `| 载点 | 链接 |\n`;
        content += `|------|------|\n`;
        content += `| GitHub | [${githubNum}](${githubUrl}) |\n`;
        content += `| Greasy Fork | ${script.gf ? `[${gfNum}](${script.gf})` : gfNum} |\n`;
        content += `| 组件 | ${script.gadget ? `[${gadgetNum}](${script.gadget})` : gadgetNum} |\n\n`;
    });

    return content;
};

// 主函数
const main = () => {
    const scripts = getUserScripts()
        .map(file => parseUserScript(file))
        .filter(Boolean);  // 过滤解析失败的脚本

    const readmeContent = generateREADME(scripts);
    const readmePath = path.join(__dirname, 'README.md');
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log(`README.md 生成成功！共处理 ${scripts.length} 个脚本`);

    openFile(readmePath);
};

main();