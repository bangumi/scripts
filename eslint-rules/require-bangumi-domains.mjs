import userscript from 'userscript-meta';

// 定义需要检查的三个域名
const REQUIRED_DOMAINS = ['bgm.tv', 'bangumi.tv', 'chii.in'];

export default {
    meta: {
        type: "problem",
        docs: {
            description: "确保包含所有 bangumi 相关域名的 match 规则",
            category: "Best Practices",
            recommended: true
        },
        fixable: "code",
        schema: []
    },

    create(context) {
        return {
            Program() {
                // 获取脚本内容
                const sourceCode = context.getSourceCode();
                const code = sourceCode.getText();

                // 查找 UserScript 元数据块
                const metaCommentMatch = code.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
                if (!metaCommentMatch) return;

                const [fullMetaBlock, metaContent] = metaCommentMatch;
                const meta = userscript.parse(metaContent);

                // 处理 match 规则（单条规则为字符串，多条为数组）
                let existingMatches = [];
                if (Array.isArray(meta.match)) {
                    existingMatches = [...meta.match];
                } else if (typeof meta.match === 'string') {
                    existingMatches = [meta.match];
                }

                // 检查是否有任何相关域名的 match 规则
                const hasRelatedMatch = existingMatches.some(match =>
                    REQUIRED_DOMAINS.some(domain => match.includes(domain))
                );
                if (!hasRelatedMatch) return;

                // 提取现有路径和协议
                const paths = new Set();
                const protocols = new Set();

                existingMatches.forEach(match => {
                    // 提取协议（支持 http*://、https:// 等）
                    const protocolMatch = match.match(/^https?\*?:\/\//i);
                    if (protocolMatch) {
                        protocols.add(protocolMatch[0]);
                    }

                    // 提取路径
                    REQUIRED_DOMAINS.forEach(domain => {
                        const domainIndex = match.indexOf(domain);
                        if (domainIndex !== -1) {
                            const path = match.slice(domainIndex + domain.length);
                            if (path) paths.add(path);
                        }
                    });
                });

                // 默认协议
                if (protocols.size === 0) {
                    protocols.add('http*://');
                }

                // 查找缺失的 match 规则
                const missingMatches = [];
                if (paths.size > 0) {
                    REQUIRED_DOMAINS.forEach(domain => {
                        paths.forEach(path => {
                            protocols.forEach(protocol => {
                                const fullMatch = `${protocol}${domain}${path}`;
                                if (!existingMatches.includes(fullMatch)) {
                                    missingMatches.push(fullMatch);
                                }
                            });
                        });
                    });
                }

                // 报告问题并修复
                if (missingMatches.length > 0) {
                    const lines = fullMetaBlock.split('\n');
                    const matchLineIndices = lines
                        .map((line, index) => ({ line, index }))
                        .filter(({ line }) => line.trim().startsWith('// @match'))
                        .map(({ index }) => index);

                    // 确定插入位置（最后一个 match 规则后）
                    const insertLineIndex = matchLineIndices.length > 0
                        ? matchLineIndices[matchLineIndices.length - 1] + 1
                        : lines.findIndex(line => line.trim().startsWith('// @')) + 1;

                    // 计算对齐格式
                    let alignmentLength = '// @match'.length + 2; // 默认对齐长度
                    if (matchLineIndices.length > 0) {
                        alignmentLength = Math.max(...matchLineIndices.map(idx => {
                            const match = lines[idx].match(/^\/\/ @match\s+/);
                            return match ? match[0].length : alignmentLength;
                        }));
                    }

                    // 生成要插入的行
                    const linesToAdd = missingMatches.map(match =>
                        `// @match`.padEnd(alignmentLength, ' ') + match
                    );

                    // 创建新的元数据块内容
                    const newLines = [...lines];
                    newLines.splice(insertLineIndex, 0, ...linesToAdd);
                    const newMetaBlock = newLines.join('\n');

                    // 计算元数据块的起始和结束位置
                    const metaBlockStart = metaCommentMatch.index;
                    const metaBlockEnd = metaBlockStart + fullMetaBlock.length;

                    context.report({
                        // 使用第一个节点作为报告位置
                        node: context.getSourceCode().ast,
                        message: `缺少 bangumi 相关域名的 match 规则: ${missingMatches.join(', ')}`,
                        fix(fixer) {
                            return fixer.replaceTextRange(
                                [metaBlockStart, metaBlockEnd],
                                newMetaBlock
                            );
                        }
                    });
                }
            }
        };
    }
};