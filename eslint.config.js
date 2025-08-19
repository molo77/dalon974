// Flat config: ignore build artifacts and node_modules; keep rules minimal
module.exports = [
	{
		ignores: [
			"**/.next/**",
			"**/node_modules/**",
			"**/public/**",
			"**/coverage/**",
			"**/dist/**",
			"**/build/**",
			"**/.prisma/**",
		],
	},
	{
		files: ["**/*.{js,ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: "module",
		},
		rules: {},
	},
];
