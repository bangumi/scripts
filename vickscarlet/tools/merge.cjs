const { readFile, writeFile } = require('fs/promises');
const { dirname, join } = require('path');

const replaceAsync = async (str, regex, asyncReplacer) => {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        promises.push(asyncReplacer(match, ...args));
        return match;
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
};

const merge = async (file) => {
    const content = await readFile(file, 'utf-8');
    const result = await replaceAsync(
        content,
        /\/\*\*merge:(.+?)=(.+?)\*\*\/[\s\S]*?\/\*\*merge\*\*\//g,
        async (match, type, path) => {
            if (!type || !path) return match;
            const content = await readFile(join(dirname(file), path), 'utf-8');
            const lf = content.includes('\r\n') ? '\r\n' : '\n';
            switch (type) {
                case 'css':
                    return `/**merge:${type}=${path}**/\`${content.replace(
                        /\s*\n\s*/g,
                        ''
                    )}\`/**merge**/`;
                case 'js':
                    return `/**merge:${type}=${path}**/${content
                        .replace(/\/\*[\s\S]+?\*\//g, '')
                        .replace(/[^:]\/{2}[\s\S]*?\n/g, '')
                        .replace(/\s*\n\s*/g, ' ')
                        .replace(/ ((async )?function|class[^:])/g, lf + '    $1')
                        .replace(/ ([\)\]])/g, '$1')
                        .replace(/([\(\[]) /g, '$1')
                        .replace(/,\s/g, ', ')
                        .replace(/\s$/, '')}${lf}    /**merge**/`;
                case 'jsmin':
                    return `/**merge:${type}=${path}**/${lf}    ${content
                        .replace(/\/\*[\s\S]+?\*\//g, '')
                        .replace(/[^:]\/{2}[\s\S]*?\n/g, '')
                        .replace(/\s*\n\s*/g, ' ')
                        .replace(/ ([\)\}\]])/g, '$1')
                        .replace(/([\(\[]) /g, '$1')
                        .replace(/,\s/g, ', ')
                        .replace(/\s$/, '')}${lf}    /**merge**/`;
            }
        }
    );
    if (result !== content) {
        await writeFile(file, result);
    }
};

(async () => {
    const [, , ...files] = process.argv;
    for (const file of files) await merge(file);
})();
