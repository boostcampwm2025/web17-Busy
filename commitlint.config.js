module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert', 'perf', 'ci', 'design']],
    'scope-case': [2, 'always', 'lower-case'],
  },
};
