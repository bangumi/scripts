import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import monkey, { cdn } from 'vite-plugin-monkey'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tsconfigPaths(),
        svgr(),
        react(),
        monkey({
            entry: 'src/index.tsx',
            build: {
                fileName: 'bangumi_community.user.js',
                externalGlobals: {
                    react: [
                        'React',
                        () => 'https://cdn.jsdelivr.net/npm/umd-react/dist/react.production.min.js',
                    ],
                    'react-dom/client': [
                        'ReactDOM',
                        () =>
                            'https://cdn.jsdelivr.net/npm/umd-react/dist/react-dom.production.min.js',
                    ],
                    'react-dom': [
                        'ReactDOM',
                        () =>
                            'https://cdn.jsdelivr.net/npm/umd-react/dist/react-dom.production.min.js',
                    ],
                    // 'react-custom-scrollbars': cdn.jsdelivr(
                    //     'ReactCustomScrollbars',
                    //     'dist/react-custom-scrollbars.min.js'
                    // ),
                },
            },
            userscript: {
                name: 'Bangumi 社区助手 preview',
                version: '0.1.12',
                namespace: 'b38.dev',
                description: '社区助手预览版 with React',
                author: '神戸小鳥 @vickscarlet',
                license: 'MIT',
                icon: 'https://bgm.tv/img/favicon.ico',
                homepage:
                    'https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/community',
                match: ['*://bgm.tv/*', '*://chii.in/*', '*://bangumi.tv/*'],
                'run-at': 'document-start',
            },
        }),
    ],
    build: {
        emptyOutDir: false,
        target: 'es2022',
        outDir: '../../../dist',
    },
})
