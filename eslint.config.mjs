import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname || process.cwd() });

export default [
	{ ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', '**/*.min.js', '**/*.bundle.js', 'eslint.config.*'] },
	js.configs.recommended,
	...compat.extends('next/core-web-vitals', 'plugin:react/recommended'),
		{
		files: ['**/*.ts', '**/*.tsx'],
			...compat.extends('plugin:@typescript-eslint/recommended'),
		plugins: {
			'@typescript-eslint': (await import('@typescript-eslint/eslint-plugin')).default,
			react: (await import('eslint-plugin-react')).default,
			'react-hooks': (await import('eslint-plugin-react-hooks')).default,
			import: (await (async () => { try { return (await import('eslint-plugin-import')).default; } catch { return {}; } })()),
		},
			languageOptions: {
				parser: (await import('@typescript-eslint/parser')).default,
				parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
			},
		settings: { react: { version: 'detect' } },
		rules: {
			'react/react-in-jsx-scope': 'off',
			'react/no-unescaped-entities': 'warn',
			'react/no-unknown-property': 'off',
			'react-hooks/exhaustive-deps': 'warn',
			'no-empty': ['warn', { allowEmptyCatch: true }],
			'no-useless-catch': 'warn',
			'no-inner-declarations': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
	{
		files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx'],
		plugins: {
			react: (await import('eslint-plugin-react')).default,
			'react-hooks': (await import('eslint-plugin-react-hooks')).default,
		},
		languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
		settings: { react: { version: 'detect' } },
		rules: {
			'react/react-in-jsx-scope': 'off',
			'react/no-unescaped-entities': 'warn',
			'react/no-unknown-property': 'off',
			'react-hooks/exhaustive-deps': 'warn',
			'no-empty': ['warn', { allowEmptyCatch: true }],
			'no-useless-catch': 'warn',
		},
	},
];
