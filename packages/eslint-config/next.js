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
      /**
       * 컴포넌트 파일명은 PascalCase(LoginButton.tsx).
       * ignoreMiddleExtensions가 없으면 NowPlayingMetaActions.test.tsx의 `.test`가 이름의 일부로
       * 잡혀 위반이 된다. base.mjs의 .ts 규칙은 이미 이 옵션을 준다.
       */
      'check-file/filename-naming-convention': ['error', { '**/*.tsx': 'PASCAL_CASE' }, { ignoreMiddleExtensions: true }],

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

  /**
   * 7. 폴더명은 lint로 강제하지 않는다.
   *
   * base.mjs가 모든 폴더에 KEBAB_CASE를 걸지만 프론트엔드에는 맞지 않아 여기서 끈다.
   * 세 종류가 각자 정당한 이유로 다르기 때문이다.
   *
   * - `app/[id]`, `app/(home)` — Next.js App Router 문법이라 바꿀 방법이 없다
   * - `components/NowPlaying` — 컴포넌트 폴더는 대표 파일(NowPlaying.tsx)과 이름이 같아야 한다
   * - `hooks/player`, `components/player/partials` — 그룹·도메인 폴더는 소문자
   *
   * 이 셋을 한 패턴으로 표현하려면 읽을 수 없는 extglob이 필요하고, 그렇게까지 해서 잡히는 건
   * camelCase 폴더 2개(queryKeys, loginButtons)뿐이다. 규칙은 ARCHITECTURE.md의 "폴더명"에 두고,
   * 그 2개는 파일명 캠페인에서 같이 정리한다.
   *
   * 파일명은 계속 강제한다 — .tsx는 위 6번(PascalCase), .ts는 base.mjs(kebab-case).
   */
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'check-file/folder-naming-convention': 'off',
    },
  },
];
