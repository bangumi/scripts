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
                fileName: 'bangumi_quick_rating.user.js',
            },
            userscript: {
                name: 'Bangumi 收藏快速评分',
                version: '1.0.2',
                namespace: 'b38.dev',
                description: 'Bangumi 收藏快速评分, 仅自己收藏页面生效',
                author: '神戸小鳥 @vickscarlet',
                license: 'MIT',
                icon: 'https://bgm.tv/img/favicon.ico',
                homepage:
                    'https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/quick_rating',
                match: [
                    '*://bgm.tv/anime/list/*/*',
                    '*://bgm.tv/book/list/*/*',
                    '*://bgm.tv/game/list/*/*',
                    '*://bgm.tv/music/list/*/*',
                    '*://bgm.tv/real/list/*/*',
                    '*://chii.in/anime/list/*/*',
                    '*://chii.in/book/list/*/*',
                    '*://chii.in/game/list/*/*',
                    '*://chii.in/music/list/*/*',
                    '*://chii.in/real/list/*/*',
                    '*://bangumi.tv/anime/list/*/*',
                    '*://bangumi.tv/book/list/*/*',
                    '*://bangumi.tv/game/list/*/*',
                    '*://bangumi.tv/music/list/*/*',
                    '*://bangumi.tv/real/list/*/*',
                ],
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
