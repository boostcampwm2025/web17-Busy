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
];
