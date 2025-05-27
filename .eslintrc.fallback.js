module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Basic JavaScript/TypeScript rules that work without TypeScript parser
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console.log for test output
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'no-undef': 'off', // Turn off for TypeScript files
    'no-redeclare': 'off', // Turn off for TypeScript files
  },
  ignorePatterns: [
    'node_modules/',
    'test-results/',
    'playwright-report/',
    'logs/',
    'dist/',
    '*.js'
  ],
  overrides: [
    {
      files: ['*.spec.ts', '*.test.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
