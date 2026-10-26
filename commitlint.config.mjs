export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['api', 'web', 'rules-engine', 'docs', 'ci', 'deps']],
  },
};
