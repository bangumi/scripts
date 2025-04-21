import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tsconfigPaths(),
        monkey({
            entry: 'src/index.ts',
            build: {
                fileName: 'bangumi_report.user.js',
            },
            userscript: {
                name: 'Bangumi 年鉴',
                version: '1.3.14',
                namespace: 'syaro.io',
                description: '根据Bangumi的时光机数据生成年鉴',
                author: '神戸小鳥 @vickscarlet',
                license: 'MIT',
                icon: 'https://bgm.tv/img/favicon.ico',
                homepage:
                    'https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/report',
                match: ['*://bgm.tv/user/*', '*://chii.in/user/*', '*://bangumi.tv/user/*'],
            },
        }),
    ],
    root: '.',
    build: {
        emptyOutDir: false,
        target: 'es2022',
        outDir: '../../../dist',
    },
})
