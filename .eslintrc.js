module.exports = {
  root: true,
  extends: [
    '@cyansalt/preset',
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
