import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const banner = readFileSync(resolve(import.meta.dirname, "header/bgm-eps-editor.js"), "utf-8").trimEnd();

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/bgm-eps-editor.tsx"),
      formats: ["iife"],
      name: "BgmEpsEditor",
      fileName: () => "bgm-eps-editor.user.js",
    },
    outDir: resolve(import.meta.dirname, "./dist"),
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      output: {
        banner,
      },
    },
  },
});
