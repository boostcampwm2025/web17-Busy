import { nextJsConfig } from '@repo/eslint-config/next-js';

/**
 * 배럴을 거치면 쓰지도 않는 모듈이 딸려 오고 심볼이 실제로 어디 있는지 알 수 없어진다.
 *
 * patterns가 아니라 paths를 쓰는 이유: patterns의 group은 하위 경로까지 매칭해서
 * '@/stores'가 '@/stores/useModalStore'(권장 형태)까지 잡는다. paths는 정확히 일치할 때만 걸린다.
 *
 * flat config에서 뒤 블록의 no-restricted-imports는 앞 블록 것을 병합이 아니라 덮어쓰므로,
 * 계층 규칙을 가진 블록마다 이 목록을 함께 넣어야 둘 다 살아남는다.
 */
const barrelPaths = ['@/api', '@/hooks', '@/components', '@/utils', '@/constants', '@/types', '@/stores', '@/mappers'].map((name) => ({
  name,
  message: `배럴 대신 직접 경로로 import하세요. 예: '${name}' 대신 '${name}/파일명'`,
}));

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,

  // 아래 계층 블록에 걸리지 않는 파일(app/**, src/components/app/** 등)을 위한 기본값.
  // 계층 블록은 이 뒤에 오면서 barrelPaths를 각자 다시 포함한다.
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: barrelPaths }],
    },
  },

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
          paths: barrelPaths,
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
          paths: barrelPaths,
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
          paths: barrelPaths,
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
          paths: barrelPaths,
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
