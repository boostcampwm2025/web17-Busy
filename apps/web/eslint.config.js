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
];
