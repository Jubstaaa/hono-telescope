import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

// `prettier/prettier` carries no inline options on purpose: it reads this repo's .prettierrc
// (semi, 2-space, printWidth 100) rather than the frontend standard's own formatting.
const sharedRules = {
  'prettier/prettier': 'error',
  // The standard pairs `no-unused-vars: error` with the TS rule off. That inverts here: this
  // package's public surface is interfaces full of method signatures, and the base rule reads
  // their parameter names as unused variables — 80 false positives across collector.ts,
  // context-strategy.ts and create-telescope.ts alone.
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-console': ['warn', { allow: ['error'] }],
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-empty-object-type': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-explicit-any': 'error',
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      pathGroups: [
        { pattern: 'react', group: 'external', position: 'before' },
        { pattern: 'react-*', group: 'external', position: 'before' },
        { pattern: '@/**', group: 'internal', position: 'after' },
      ],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    },
  ],
  'perfectionist/sort-interfaces': [
    'error',
    {
      customGroups: [
        { elementNamePattern: '^(id|uuid)$', groupName: 'identity' },
        { elementNamePattern: '^on[A-Z]', groupName: 'callbacks' },
      ],
      groups: ['identity', 'unknown', 'callbacks'],
      order: 'asc',
      type: 'alphabetical',
    },
  ],
  'perfectionist/sort-object-types': [
    'error',
    {
      customGroups: [
        { elementNamePattern: '^(id|uuid)$', groupName: 'identity' },
        { elementNamePattern: '^on[A-Z]', groupName: 'callbacks' },
      ],
      groups: ['identity', 'unknown', 'callbacks'],
      order: 'asc',
      type: 'alphabetical',
    },
  ],
  'perfectionist/sort-named-imports': ['warn', { order: 'asc', type: 'alphabetical' }],
  'perfectionist/sort-objects': [
    'warn',
    {
      customGroups: [{ elementNamePattern: '^on[A-Z]', groupName: 'callbacks' }],
      groups: ['unknown', 'callbacks'],
      order: 'asc',
      type: 'alphabetical',
    },
  ],
};

const sharedPlugins = {
  import: importPlugin,
  perfectionist: perfectionistPlugin,
  prettier: prettierPlugin,
  react: reactPlugin,
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '.turbo/**',
      '**/assets/**',
      '**/*.d.ts',
      '.venv',
      'venv',
      'src/core/hono/dashboard-assets.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,

  // The library and the example run on Node/Bun: no React, no browser globals.
  {
    files: ['src/**/*.ts'],
    ignores: ['src/dashboard/**'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: globals.node,
    },
    plugins: sharedPlugins,
    rules: sharedRules,
  },

  // The dashboard is the only React surface, so the React rules are scoped to it.
  {
    files: ['src/dashboard/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: { ...sharedPlugins, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...sharedRules,
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          ignoreCase: true,
          locale: 'auto',
          multiline: 'last',
          reservedFirst: ['key', 'ref'],
          shorthandFirst: true,
          shorthandLast: false,
        },
      ],
    },
  },

  {
    files: ['**/*.types.ts', '**/*.types.tsx', '**/*.d.ts'],
    rules: { 'no-unused-vars': 'off' },
  },

  // The example app logs on purpose: its output is what you then read in the dashboard. The
  // console collector's tests have to call console to prove they patched it.
  {
    files: [
      'src/example/**/*.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      // This module's job is to wrap the console methods, so it has to name them.
      'src/core/collectors/console-collector.ts',
    ],
    rules: { 'no-console': 'off' },
  },
];
