const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  // Ignore dossiers générés et dépendances
  { ignores: ['**/.next/**', 'node_modules/**', 'dist/**', 'out/**', 'coverage/**', 'build/**'] },

  // Base Next.js
  ...compat.extends('next/core-web-vitals'),

  // TypeScript et React (extensions recommandées)
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('plugin:react/recommended'),

  // Exceptions pour fichiers de config (CommonJS, require autorisé)
  {
    files: ['eslint.config.js', 'next.config.*', 'postcss.config.*', 'tailwind.config.*', 'scripts/**/*.*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Règles projet (appliquées globalement)
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  // Autoriser les expressions conditionnelles usuelles en JSX
  '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }],
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-img-element': 'warn',
      // Autorise styled-jsx: <style jsx global>
      'react/no-unknown-property': ['error', { ignore: ['jsx', 'global'] }],
      // Assouplir le commentaire TS pour cas nécessaires
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
    },
  },
];
