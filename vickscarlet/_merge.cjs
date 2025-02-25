const { readFile, writeFile, readdir } = require('fs/promises');

const replaceAsync = async (str, regex, asyncReplacer) => {
    const promises = []
    str.replace(regex, (match, ...args) => {
        promises.push(asyncReplacer(match, ...args))
        return match
    })
    const data = await Promise.all(promises)
    return str.replace(regex, () => data.shift())
}

const merge = async (file) => {
    const content = await readFile(file, 'utf-8');
    const result = await replaceAsync(content, /\/\*\*merge:(.+?)=(.+?)\*\*\/[\s\S]*?\/\*\*merge\*\*\//g, async (match, type, path) => {
        if (!type || !path) return match;
        const content = await readFile(path, 'utf-8');
        switch (type) {
            case 'css': return `/**merge:${type}=${path}**/\`${content.replace(/\s*\n\s*/g, '')}\`/**merge**/`
            case 'js': return `/**merge:${type}=${path}**/${content
                .replace(/\/\*[\s\S]+?\*\//g, '')
                .replace(/[^:]\/{2}[\s\S]*?\n/g, '')
                .replace(/\s*\n\s*/g, ' ')
                .replace(/(function |class )/g, '\n    $1')
                }\n    /**merge**/`
            case 'jsmin': return `/**merge:${type}=${path}**/\n    ${content
                .replace(/\/\*[\s\S]+?\*\//g, '')
                .replace(/[^:]\/{2}[\s\S]*?\n/g, '')
                .replace(/\s*\n\s*/g, ' ')
                }\n    /**merge**/`
        }
    })
    if (result !== content) {
        await writeFile(file, result)
    };
}

readdir(__dirname).then(async (files) => {
    for (const file of files) {
        if (file.endsWith('.user.js')) {
            await merge(file)
        }
    }
});
