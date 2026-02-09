module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  ignorePatterns: [
    'node_modules',
    'dist',
    '**/dist',
    '.next',
    '**/.next',
    '.turbo',
    '**/.turbo',
    'out',
    '**/out',
    'build',
    '**/build',
    'coverage',
    '**/coverage',
    '*.tsbuildinfo',
    '**/*.tsbuildinfo',
    '*.config.js',
    '*.config.ts',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          './apps/api/tsconfig.eslint.json',
          './apps/web/tsconfig.json',
          './packages/database/tsconfig.json',
          './packages/types/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
      },
    },
  ],
};


