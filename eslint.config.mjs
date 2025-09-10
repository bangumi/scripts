import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import userscripts from "eslint-plugin-userscripts";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  {
    ignores: [
      'g/'
    ]
  },
  {
    files: ['*.user.js'],
    plugins: {
      userscripts: {
        rules: userscripts.rules
      }
    },
    languageOptions: {
      globals: {
        GM_xmlhttpRequest: "readonly",
        unsafeWindow: "readonly",
        $: "readonly",
        chiiLib: "readonly",
        tb_init: "readonly",
        tb_remove: "readonly"
      }
    },
    rules: {
      ...userscripts.configs.recommended.rules,
      "userscripts/no-invalid-headers": ["error", {
        allowed: ["greasy", "gadget"]
      }]
    },
    settings: {
      userscriptVersions: {
        violentmonkey: '*'
      }
    }
  }
]);
