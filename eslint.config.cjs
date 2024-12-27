// eslint.config.cjs
const js = require('@eslint/js');
const jestPlugin = require('eslint-plugin-jest');
const globals = require('globals');

module.exports = [
  {
    // 1. Pull in the recommended config (merging languageOptions & rules).
    ...js.configs.recommended,

    // 2. Language options for Node and Jest:
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.jest, // so Jest globals (describe, it, expect) are recognized
      },
    },

    // 3. Jest plugin setup:
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      // Add or override any custom rules here
      // e.g. "no-console": "off"
    },
  },
];
