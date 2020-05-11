module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: 'plugin:prettier/recommended',
  plugins: ['prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {},
  },
  rules: {},
};
