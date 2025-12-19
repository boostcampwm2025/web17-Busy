import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"], // TypeScript 파일에만 적용
    languageOptions: {
      parserOptions: {
        project: true, // tsconfig.json을 찾아 타입 정보를 읽음 (Boolean 체크용)
      },
    },
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        // 1. 변수 (camelCase, React 컴포넌트용 PascalCase, 상수용 UPPER_SNAKE_CASE)
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        // 2. 함수 (camelCase, React 컴포넌트용 PascalCase)
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        // 3. 클래스, 인터페이스, 타입 별칭 (PascalCase)
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        // 4. Boolean 변수 (is, has, should 접두사 강제) - 타입 정보 필요
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "has", "should"],
        },
        // 5. 인터페이스 (I 접두사 금지)
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false,
          },
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];