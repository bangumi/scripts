const fs = require('fs');
const path = require('path');

// 读取当前目录下所有 .user.js 文件
const getUserScripts = () => {
    return fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.user.js'))
        .map(file => path.join(__dirname, file));
};

// 解析 user.js 元数据（包括@greasy和@gadget）
const parseUserScript = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const meta = {};

    // 匹配 UserScript 元数据块
    const metaMatch = content.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
    if (!metaMatch) return null;

    const metaLines = metaMatch[1].split('\n');
    const getMatch = (line, tag) => {
        const regex = new RegExp(`@${tag}\\s+(.+)`);
        const match = line.match(regex);
        return match ? match[1].trim() : null;
    }
    const metaToGet = ['version', 'name', 'description', 'namespace', 'greasy', 'gadget'];
    metaLines.forEach(line => {
        metaToGet.forEach(tag => {
            const value = getMatch(line, tag);
            if (value) meta[tag] = value;
        });
    });

    meta.filename = path.basename(filePath);
    return meta;
};

// 提取链接最后的数字（支持多种链接格式）
const getLinkNumber = (url) => {
    if (!url) return '';
    // 匹配链接中最后一段的数字（如ID）
    const match = url.match(/(\d+)\/*$/);
    return match ? match[1] : '链接';
};

// 生成 README.md 内容（表格形式展示链接）
const generateREADME = (scripts) => {
    let content = `# [inchei](https://bgm.tv/user/inchei)\n\n`;

    scripts.forEach(script => {
        if (!script.name) return;

        const githubUrl = `https://github.com/bangumi/scripts/blob/master/inchei/${script.filename}?raw=true`;
        const githubNum = script.filename;
        const greasyNum = script.greasy ? getLinkNumber(script.greasy) : '未发布';
        const gadgetNum = script.gadget ? getLinkNumber(script.gadget) : '无';

        content += `## ${script.name} \`${script.version}\`\n`;
        if (script.description) content += `${script.description}\n`;
        if (script.namespace?.includes('/group/topic')) content += `- 讨论页：${script.namespace}\n`;

        // 表格展示链接
        content += `\n`;
        content += `| 载点 | 链接 |\n`;
        content += `|------|------|\n`;
        content += `| GitHub | [${githubNum}](${githubUrl}) |\n`;
        content += `| Greasy Fork | ${script.greasy ? `[${greasyNum}](${script.greasy})` : greasyNum} |\n`;
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
    fs.writeFileSync(path.join(__dirname, 'README.md'), readmeContent, 'utf8');
    console.log('README.md 生成成功！');
};

main();
