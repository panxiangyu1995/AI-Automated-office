module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'test-results',
    'playwright-report',
    '.codex',
    '开源库参考项目',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: ['tests/**', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
    },
    {
      files: ['src/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
}
