import next from 'eslint-config-next';

export default [
  // Ignorés
  { ignores: ['**/.next/**', 'node_modules/**', 'dist/**', 'out/**', 'coverage/**', 'build/**'] },
  // Config Next.js (flat). eslint-config-next exporte un tableau de configs.
  ...next,
  // Règles projet légères
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@next/next/no-img-element': 'warn',
    },
  },
];
