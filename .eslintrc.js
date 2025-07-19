module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    // Add your global variables here
    currentUser: 'writable',
    currentUserData: 'writable',
    enhancedDataManager: 'writable',
    showModal: 'readonly',
    hideModal: 'readonly',
    showStatusMessage: 'readonly',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unreachable': 'error',
  },
};