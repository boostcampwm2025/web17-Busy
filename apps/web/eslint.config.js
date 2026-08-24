import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,

  // Next App Router reserved filenames must be lowercase (layout.tsx, page.tsx, etc.)
  {
    files: ['app/**/{layout,page,loading,error,not-found,template,default}.tsx'],
    rules: {
      'check-file/filename-naming-convention': 'off',
    },
  },

  /**
   * 계층 의존 방향: page > component > business(hooks) > store(stores, queryKeys) > utility(api, utils, constants, types, mappers)
   * 상위는 하위를 자유롭게 import하지만, 하위는 상위를 import할 수 없다.
   * 테스트 파일은 대상에서 제외한다(계층 규칙이 아니라 검증 편의가 우선).
   */
  {
    files: [
      'src/api/internal/**/*.ts',
      'src/api/itunes/**/*.ts',
      'src/api/spotify/**/*.ts',
      'src/api/youtube/**/*.ts',
      'src/api/auth-token.ts',
      'src/utils/**/*.ts',
      'src/constants/**/*.ts',
      'src/types/**/*.ts',
      'src/mappers/**/*.ts',
    ],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/stores', '@/stores/*', '@/hooks', '@/hooks/*', '@/components', '@/components/*'],
              message: 'utility 계층은 store/business/component를 import할 수 없습니다. 필요하면 호출부에서 콜백을 주입하세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/stores/**/*.ts', 'src/api/queryKeys/**/*.ts'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/hooks', '@/hooks/*', '@/components', '@/components/*'],
              message: 'store 계층은 business/component를 import할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components', '@/components/*'],
              message: 'business 계층은 component를 import할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },

  /**
   * 서버 데이터 접근은 hooks를 거친다. 컴포넌트가 API를 직접 부르면 query cache 밖에서 상태가 갈라진다.
   * queryKeys는 store 계층이라 컴포넌트가 직접 써도 되지만, 배럴을 거치면 raw API까지 딸려 오므로 막는다.
   */
  {
    files: ['src/components/**/*.{ts,tsx}'],
    // components/app은 feature 코드가 돌기 전에 세션 토큰·401 핸들러 같은 횡단 관심사를 배선하는
    // 부트스트랩 계층이라 utility를 직접 다뤄야 한다(예: client.ts의 의존성 역전 등록 지점 #423).
    // 인라인 eslint-disable은 쓸 수 없다. 루트 eslint.config.mjs가 이 규칙을 몰라서
    // root cwd로 도는 lint-staged가 "쓸모없는 지시어"로 보고 지운다.
    ignores: ['**/*.test.{ts,tsx}', 'src/components/app/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/api'],
              allowImportNames: ['queryKeys'],
              message: 'component 계층은 API를 직접 호출할 수 없습니다. hooks를 거치세요.',
            },
          ],
        },
      ],
    },
  },
];
