// Conventional Commits (docs/convencoes-git.md §2).
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    // Descrição em português: não forçar caixa específica.
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'test',
        'refactor',
        'chore',
        'ci',
        'build',
        'perf',
        'style',
        'revert',
      ],
    ],
  },
}

export default config
