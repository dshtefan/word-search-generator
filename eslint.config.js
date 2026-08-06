import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react/**',
                '@/store',
                '@/store/*',
                '@/store/**',
                '**/store',
                '**/store/**',
                '@/features',
                '@/features/*',
                '@/features/**',
                '**/features',
                '**/features/**',
                'jspdf',
                'jspdf/*',
                'jspdf/**',
                'jszip',
                'jszip/*',
                'jszip/**',
              ],
              message: 'Domain modules must remain independent of UI, store, feature, and export infrastructure.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/export/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'getComputedStyle',
          message: 'Export documents must be built from typed data, not scraped DOM styles.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='getElementById']",
          message: 'Export documents must be built from typed data, not scraped DOM elements.',
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='querySelector']",
          message: 'Export documents must be built from typed data, not scraped DOM elements.',
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='getComputedStyle']",
          message: 'Export documents must be built from typed data, not scraped DOM styles.',
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['buttonVariants', 'tabsListVariants'],
        },
      ],
    },
  },
)
