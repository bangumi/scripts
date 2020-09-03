const {
    src, dest, series, parallel
} = require('gulp');
const rename = require('gulp-rename');
const render = require('./plugin/template-render');
const del = require('delete');

function buildWithTemplate(template, destPath, appName, basename, extname) {
    return ()=>src(template)
        .pipe(render({
            author: 'AUTHORS',
            namespace: 'src/namespace.txt',
            common: 'src/common/common.js',
            appbase: 'src/app/appbase.js',
            app: `src/app/${appName}/*`,
        }))
        .pipe(rename({
            basename: basename,
            extname: extname,
        }))
        .pipe(dest(destPath));
}

function buildApp4UserJS(appName) {
    return buildWithTemplate(
        'src/template/user.js',
        'dist',
        appName,
        `kotorichan-${appName}`,
        '.user.js'
    );
}

function buildApp4BGM(appName, cb) {
    const dest = `build/${appName}`;
    return parallel(
        buildWithTemplate(
            'src/template/bgm.js',
            dest,
            appName,
            'app',
            '.js'
        ),
        buildWithTemplate(
            'src/template/bgm.css',
            dest,
            appName,
            'app',
            '.css'
        ),
    )(cb);
}

function buildApp(appName) {
    return parallel(
        buildApp4UserJS(appName),
        done=>buildApp4BGM(appName, done),
    );
}

function build(cb) {
    return parallel(
        buildApp('encode_translate'),
        buildApp('remark'),
    )(cb);
}

function clean(cb) {
    del(['dist/*.user.js'], cb);
}

function test(cb) {
    cb();
}

module.exports = {
    build,
    clean,
    test,
    default: series(test, clean, build)
};