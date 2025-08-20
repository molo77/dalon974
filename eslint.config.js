// Flat config propre (JS uniquement) avec compatibilité des configs classiques
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
	// Ignorés
	{ ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', '**/*.min.js', '**/*.bundle.js', 'eslint.config.*'] },

	// Reco JS de base
	js.configs.recommended,

	// Extensions de base Next + React (équivalent .eslintrc)
	...compat.extends('next/core-web-vitals', 'plugin:react/recommended'),

	// Étend les règles TS uniquement pour les fichiers TS/TSX
	...compat.extends('plugin:@typescript-eslint/recommended').map((c) => ({ ...c, files: ['**/*.ts', '**/*.tsx'] })),

	// Bloc TS/TSX: parser TS + règles locales
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: {
			'@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
			react: require('eslint-plugin-react'),
			'react-hooks': require('eslint-plugin-react-hooks'),
			import: (() => { try { return require('eslint-plugin-import'); } catch { return {}; } })(),
		},
		languageOptions: {
			parser: require('@typescript-eslint/parser'),
			// Pas de "project" ici pour éviter les erreurs de parsing hors inclusions TS
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

	// Bloc JS/JSX/Config: parser standard
	{
		files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx'],
		plugins: {
			react: require('eslint-plugin-react'),
			'react-hooks': require('eslint-plugin-react-hooks'),
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
			'no-inner-declarations': 'off',
		},
	},
];
