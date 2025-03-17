import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tsconfigPaths(),
        monkey({
            entry: 'src/index.js',
            build: {
                fileName: 'bangumi_unified.user.js',
            },
            userscript: {
                // ==UserScript==
                // @name
                // @namespace    b38.dev
                // @version      1.0.0
                // @author       神戸小鳥 @vickscarlet
                // @description  Bangumi 统一地址 v1
                // @license      MIT
                // @icon         https://bgm.tv/img/favicon.ico
                // @match        *://bgm.tv/*
                // @match        *://chii.in/*
                // @match        *://bangumi.tv/*
                // @grant        GM_setValue
                // @grant        GM_getValue
                // @grant        GM_registerMenuCommand
                // @run-at       document-start
                // ==/UserScript==
                name: 'Bangumi 统一地址',
                version: '1.0.0',
                namespace: 'b38.dev',
                description: 'Bangumi 统一地址 v1',
                author: '神戸小鳥 @vickscarlet',
                license: 'MIT',
                icon: 'https://bgm.tv/img/favicon.ico',
                grant: ['GM_setValue', 'GM_getValue', 'GM_registerMenuCommand'],
                homepage:
                    'https://github.com/bangumi/scripts/blob/master/vickscarlet/src/scripts/unified',
                match: ['*://bgm.tv/user/*', '*://chii.in/user/*', '*://bangumi.tv/user/*'],
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
