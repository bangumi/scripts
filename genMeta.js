const fs = require('fs');
const path = require('path');

// 目标域名列表
const DOMAINS = ['bgm.tv', 'bangumi.tv', 'chii.in'];

/**
 * 提取规则中的路径部分（去除域名）
 * @param {string} matchRule - 原始@match规则
 * @returns {string} 路径部分
 */
const extractPathFromMatch = (matchRule) => {
    // 移除协议和域名，保留路径
    const path = matchRule
        .replace(/^https?:\/\/[^/]+/, '') // 移除 https://域名
        .trim();

    // 确保路径格式正确
    return path || '/*';
};

/**
 * 为指定域名生成对应的@match规则
 * @param {string} domain - 域名
 * @param {string} pathPattern - 路径模式
 * @returns {string} 完整的@match规则
 */
const generateMatchForDomain = (domain, pathPattern) => {
    // 确保路径以/开头
    const normalizedPath = pathPattern.startsWith('/') ? pathPattern : `/${pathPattern}`;
    // 确保包含通配符
    return `https://${domain}${normalizedPath.includes('*') ? normalizedPath : `${normalizedPath}*`}`;
};

/**
 * 处理元数据块，确保三个域名的@match规则都存在
 * @param {string} metaBlock - 原始元数据块
 * @returns {string} 处理后的元数据块
 */
const ensureAllDomainsInMatches = (metaBlock) => {
    const lines = metaBlock.split('\n').map(line => line.trimEnd());
    const otherLines = []; // 非@match的行
    const existingMatches = []; // 现有的@match规则

    // 分离现有@match和其他行
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('// @match')) {
            existingMatches.push(trimmed.replace('// @match', '').trim());
        } else {
            otherLines.push(line);
        }
    });

    // 确定路径模式（基于现有@match，没有则用默认）
    const pathPattern = existingMatches.length > 0
        ? extractPathFromMatch(existingMatches[0])
        : '/*';

    // 生成三个域名的目标规则
    const targetMatches = DOMAINS.map(domain =>
        generateMatchForDomain(domain, pathPattern)
    );

    // 检查是否已有所有必要规则
    const hasAllDomains = DOMAINS.every(domain =>
        existingMatches.some(match => match.includes(domain))
    );

    if (hasAllDomains) {
        return metaBlock; // 已有所有域名，无需修改
    }

    // 找到@match的插入位置（原@match位置或合适位置）
    const firstMatchIndex = lines.findIndex(line => line.trim().startsWith('// @match'));
    const insertPosition = firstMatchIndex !== -1 ? firstMatchIndex : otherLines.length;

    // 确定缩进格式
    let indentation = '    '; // 默认缩进
    if (insertPosition < lines.length) {
        const indentMatch = lines[insertPosition].match(/^\s*/);
        if (indentMatch) indentation = indentMatch[0];
    }

    // 构建新行数组
    const newLines = [];
    let matchesInserted = false;

    otherLines.forEach((line, index) => {
        // 在指定位置插入新的@match规则
        if (index === insertPosition && !matchesInserted) {
            targetMatches.forEach(match => {
                newLines.push(`${indentation}// @match       ${match}`);
            });
            matchesInserted = true;
        }
        newLines.push(line);
    });

    // 如果没有插入（所有行处理完），添加到末尾
    if (!matchesInserted) {
        targetMatches.forEach(match => {
            newLines.push(`${indentation}// @match       ${match}`);
        });
    }

    return newLines.join('\n');
};

/**
 * 处理单个脚本文件
 * @param {string} filePath - 文件路径
 */
const processScriptFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const metaBlockRegex = /(\/\/ ==UserScript==[\s\S]*?)\/\/ ==\/UserScript==/;
        const metaMatch = content.match(metaBlockRegex);

        if (!metaMatch) {
            console.warn(`跳过 ${path.basename(filePath)}: 未找到元数据块`);
            return;
        }

        const originalMetaBlock = metaMatch[1];
        const newMetaBlock = ensureAllDomainsInMatches(originalMetaBlock);

        if (originalMetaBlock !== newMetaBlock) {
            const newContent = content.replace(
                metaBlockRegex,
                `${newMetaBlock}\n// ==/UserScript==`
            );
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`已更新: ${path.basename(filePath)} - 补充三个域名的@match规则`);
        } else {
            console.log(`未变更: ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.error(`处理 ${path.basename(filePath)} 出错:`, error.message);
    }
};

// 主函数
const main = () => {
    const scriptFiles = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.user.js'))
        .map(file => path.join(__dirname, file));

    if (scriptFiles.length === 0) {
        console.log('未找到任何.user.js文件');
        return;
    }

    console.log(`找到 ${scriptFiles.length} 个脚本文件，开始处理...\n`);
    scriptFiles.forEach(processScriptFile);
    console.log('\n所有脚本处理完成，已确保三个域名的@match规则都存在');
};

main();
