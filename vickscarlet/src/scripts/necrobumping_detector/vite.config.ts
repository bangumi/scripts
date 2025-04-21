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
                fileName: 'bangumi_necrobumping_detector.user.js',
            },
            userscript: {
                name: 'Bangumi 挖坟人探测器',
                version: '1.0.6',
                namespace: 'b38.dev',
                description: 'Bangumi 挖坟人探测器, 看看是谁在挖坟，在日志和小组里生效',
                author: '神戸小鳥 @vickscarlet',
                license: 'MIT',
                icon: 'https://bgm.tv/img/favicon.ico',
                homepage:
                    'https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/necrobumping_detector',
                match: ['*://bgm.tv/*', '*://chii.in/*', '*://bangumi.tv/*'],
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
