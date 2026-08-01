import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules", ".claude"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    // Node で動く設定ファイル: Node グローバルを許可し console を解禁
    files: ["**/*.config.{ts,js}", "scripts/**"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    // テストの「緑の偽装」を封じる
    files: ["test/**/*.ts"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
    },
  },
  prettier,
);
