import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import userscripts from "eslint-plugin-userscripts";

const requireBangumiDomains = await import("./eslint-rules/require-bangumi-domains.mjs")
  .then(m => m.default)
  .catch(error => {
    console.error("Failed to load rule:", error);
    return { meta: {}, create: () => ({}) };
  });

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  { files: ["**/*.mjs"], languageOptions: { sourceType: "module" } },
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
      },
      local: {
        rules: {
          "require-all-bangumi-domains": requireBangumiDomains
        }
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
        allowed: ["gf", "gadget"]
      }],
      "local/require-all-bangumi-domains": "error",
    },
    settings: {
      userscriptVersions: {
        violentmonkey: '*'
      }
    }
  }
]);
