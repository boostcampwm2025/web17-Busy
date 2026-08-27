import js from '@eslint/js';
import { globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import pluginNext from '@next/eslint-plugin-next';
import reactCompiler from 'eslint-plugin-react-compiler';
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

  // 5. React Compiler 규칙
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },

  // 6. 프론트엔드 전용 네이밍 컨벤션 및 파일명 규칙
  {
    files: ['**/*.tsx'], // 컴포넌트 파일(.tsx)에만 적용
    rules: {
      // 1-2. 컴포넌트 파일명: PascalCase 강제 (LoginButton.tsx)
      'check-file/filename-naming-convention': ['error', { '**/*.tsx': 'PASCAL_CASE' }],
      // 1-2. 폴더명: kebab-case 강제 (Next.js App Router)
      'check-file/folder-naming-convention': ['error', { '**/*': 'KEBAB_CASE' }],

      /**
       * 이벤트 핸들러 네이밍(handle~/on~)은 끈다.
       *
       * 실측 150건을 분류했더니 정상 관용구만 나왔다 — 인라인 화살표 52건(checkInlineFunction은 기본값이 아니다),
       * 훅·스토어 액션 직결 66건(`onClick={closeModal}`), 자식으로 넘기는 prop 32건(`onClose={onClose}`).
       * 규칙을 지키려면 액션마다 `handle*` 별칭을 만들어야 하는데, 그건 읽기 쉬워지는 게 아니라 한 겹 늘어나는 것이다.
       * 남겨 두면 경고 총량만 부풀려 `#320`의 ratchet 안에 진짜 문제를 묻는다
       * (실제로 이 더미 안에 react-hooks/rules-of-hooks 위반이 하나 숨어 있었다).
       */
      'react/jsx-handler-names': 'off',
    },
  },
];
