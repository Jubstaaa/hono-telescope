import { library } from '@jubstaa/config/eslint/library'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    ...library({ tsconfigRootDir: import.meta.dirname }),
    {
        extends: [
            reactHooks.configs.flat.recommended,
            jsxA11y.flatConfigs.recommended,
        ],
        files: ['src/dashboard/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off',
        },
    },
    {
        files: ['src/example/**'],
        rules: {
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/require-await': 'off',
            'no-console': 'off',
        },
    },
    {
        files: ['src/core/collectors/console-collector.ts'],
        rules: { 'no-console': 'off' },
    },
    {
        files: ['src/core/storage/*-storage.ts'],
        rules: { '@typescript-eslint/require-await': 'off' },
    },
])
