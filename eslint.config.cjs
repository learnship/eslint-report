// eslint.config.cjs
const js = require('@eslint/js');
const jestPlugin = require('eslint-plugin-jest');
const globals = require('globals');

module.exports = [
  // 1. Base “recommended” config from ESLint
  js.configs.recommended,

  // 2. Node environment + ignoring node_modules
  {
    ignores: ['node_modules'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script', // or "module" if you need ESM features
      globals: {
        ...globals.node,
      },
    },
  },

  // 3. Jest plugin + Jest globals
  {
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.jest, // Allows `describe`, `it`, `test`, `expect`, etc.
      },
    },
  },
];
