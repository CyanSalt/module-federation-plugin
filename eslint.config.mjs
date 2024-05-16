import config from '@cyansalt/eslint-config'

export default config({
  configs: [
    {
      rules: {
        'unicorn/filename-case': ['error', {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
        }],
      },
    },
  ],
})
