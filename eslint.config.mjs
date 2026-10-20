import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = [
  {
    ignores: [
      '.next/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'media/',
      'next-env.d.ts',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'src/app/(payload)/admin/importMap.js',
      'src/migrations/*.json',
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // AGENTS.md §5: `any` proibido sem justificativa (use eslint-disable com comentário).
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
      // Rich text nunca é renderizado como HTML bruto (AGENTS.md §4.7).
      'react/no-danger': 'error',
    },
  },
  {
    // Migrations são geradas pelo Payload e não devem ser editadas após aplicadas.
    files: ['src/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  prettier,
]

export default eslintConfig
