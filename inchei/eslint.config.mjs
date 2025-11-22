import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc"
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
  { files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, jsdoc },
    extends: [
      "js/recommended",
      jsdoc.configs['flat/recommended-error']
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-property-description": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
    }
  },
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
        ...globals.greasemonkey,
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
