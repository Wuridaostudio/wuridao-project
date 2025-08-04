module.exports = [
  {
    files: ['**/*.ts'],
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      ...require('eslint-config-prettier').rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
