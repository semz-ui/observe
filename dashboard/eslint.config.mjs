// @ts-check
import eslint from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

// Ported from server/eslint.config.mjs so the repo has one lint story: the
// same type-checked rule set, with prettier running *through* eslint rather
// than as a separate CI step. eslint-config-next is layered on top for the
// react-hooks and next-specific rules.
export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'postcss.config.mjs',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
