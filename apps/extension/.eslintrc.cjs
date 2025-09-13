module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      },
    ],
    // Override standard no-unused-vars to use TypeScript version
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      // Background script specific rules
      files: ['src/background/**/*.ts'],
      rules: {
        'no-console': 'warn', // Allow console in background for debugging
      },
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', 'scripts/**/*.mjs'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};