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
                fileName: 'bangumi_comment_list_optimization.user.js',
            },
            userscript: {
                name: 'Bangumi 高楼优化',
                version: '3.0.4',
                namespace: 'b38.dev',
                description: '优化高楼评论的滚动性能，只渲染可见区域的评论，减少卡顿和内存占用',
                author: '神戸小鳥 @vickscarlet',
                license: 'MIT',
                icon: 'https://bgm.tv/img/favicon.ico',
                homepage:
                    'https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/bangumi_comment_list',
                match: ['*://bgm.tv/*', '*://chii.in/*', '*://bangumi.tv/*'],
                'run-at': 'document-start',
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
