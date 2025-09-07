import { defineConfig } from 'vite'
import monkey, { MonkeyUserScript } from 'vite-plugin-monkey'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tsconfigPaths(),
        svgr(),
        monkey({
            entry: pkg.main,
            build: {
                fileName: pkg.out,
            },
            userscript: {
                version: pkg.version,
                description: pkg.description,
                author: pkg.author,
                license: pkg.license,
                ...(pkg.userscript as MonkeyUserScript),
            },
        }),
    ],
    root: '.',
    build: {
        emptyOutDir: false,
        target: 'es2022',
        outDir: '../../dist',
    },
})
