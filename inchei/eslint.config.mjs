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
    files: ['*.{user,gadget}.js'],
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
        $: "readonly",
        chiiLib: "readonly",
        tb_init: "readonly",
        tb_remove: "readonly",
        subjectList: "readonly",
        addRelateSubject: "readonly",
        findSubjectFunc: "readonly"
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
  },
  {
    files: ['*.user.js'],
    languageOptions: {
      globals: {
        GM_getValue: "readonly",
        GM_setValue: "readonly",
        GM_deleteValue: "readonly",
        GM_registerMenuCommand: "readonly",
        GM_unregisterMenuCommand: "readonly",
        GM_xmlhttpRequest: "readonly",
        GM_openInTab: "readonly",
        unsafeWindow: "readonly"
      }
    }
  },
  {
    files: ['*.gadget.js'],
    languageOptions: {
      globals: {
        chiiApp: "readonly"
      }
    },
    rules: {
      "userscripts/filename-user": "off"
    }
  }
]);
