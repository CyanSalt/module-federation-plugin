module.exports = {
  root: true,
  extends: [
    '@cyansalt',
  ],
  rules: {
    'unicorn/filename-case': ['error', {
      cases: {
        kebabCase: true,
        pascalCase: true,
      },
    }],
  },
}
