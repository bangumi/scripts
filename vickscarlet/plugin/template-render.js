const fs = require('fs');
const path = require('path');
const glob = require('glob');
const through2 = require('through2');

let cache = {};
function getConcatFileContent(filepaths) {
    if(!filepaths) return '';
    if(!Array.isArray(filepaths)) filepaths = [filepaths];
    return filepaths
        .map(filepath=>fs.readFileSync(filepath).toString())
        .join('');
}

function getRenderContent(renderKey, options) {
    renderKey = (renderKey||"").replace(/\{\{\s*(.*?)\s*\}\}/,"$1");
    if(cache[renderKey]) return cache[renderKey];
    const [key, ...subs] = renderKey.split('.');
    if(!options[key]) return '';
    const files = glob.sync(options[key]);
    const sub = subs.join('.');
    let content;
    if(!sub) {
        content = getConcatFileContent(files);
    } else if(Array.isArray(files)) {
        content = getConcatFileContent(
            files.filter(
                file=>path.basename(file).match(sub)
            )
        );
    }
    return (cache[renderKey] = content);

}

function render(template, options) {
    const regex = /\{\{\s*[0-9a-zA-Z\._-]+\s*\}\}/;
    const match = regex.exec(template);
    if(!match) return template;
    return !match
        ? template
        : render(
            template.replace(
                match[0],
                getRenderContent(
                    match[0],
                    options
                )
            ),
            options
        );
};



module.exports = function(options) {
    return through2.obj((file, encoding, callback)=>{
        if(file.isBuffer()) {
            const code = render(file.contents.toString(), options)
            file.contents = Buffer.from(code);
            cache={};
        }
        callback(null, file);
    });
}
