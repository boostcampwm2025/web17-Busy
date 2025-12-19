import js from '@eslint/js';
import { globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import pluginNext from '@next/eslint-plugin-next';
import { config as baseConfig } from './base.mjs';

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
  ...baseConfig,

  globalIgnores(['*.d.ts', '.next/**', 'out/**', 'build/**']),

  // 2. React 기본 설정
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  // 3. Next.js 공식 플러그인 및 규칙
  {
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },

  // 4. React Hooks 규칙
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Next.js에서는 불필요
    },
  },

  // 5. 프론트엔드 전용 네이밍 컨벤션 및 파일명 규칙
  {
    files: ['**/*.tsx'], // 컴포넌트 파일(.tsx)에만 적용
    rules: {
      // 1-2. 컴포넌트 파일명: PascalCase 강제 (LoginButton.tsx)
      'check-file/filename-naming-convention': ['error', { '**/*.tsx': 'PASCAL_CASE' }],
      // 1-2. 폴더명: kebab-case 강제 (Next.js App Router)
      'check-file/folder-naming-convention': ['error', { '**/*': 'KEBAB_CASE' }],

      // 1-2. 이벤트 핸들러 네이밍 강제 (handle~, on~)
      // 복잡한 regex 대신 react 전용 규칙을 사용합니다.
      'react/jsx-handler-names': [
        'error',
        {
          eventHandlerPrefix: 'handle', // 함수 이름은 handle로 시작 (ex: handleClick)
          eventHandlerPropPrefix: 'on', // Props 이름은 on으로 시작 (ex: onClick)
          checkLocalVariables: true, // 내부 변수도 검사
          checkInlineFunction: true,
        },
      ],
    },
  },
];
