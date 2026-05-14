export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
  testTimeout: 15000,
  collectCoverageFrom: [
    'src/modules/**/*.js',
    'src/middlewares/**/*.js',
    'src/shared/**/*.js',
    '!src/**/*.router.js',
    '!src/modules/notification/notification.scheduler.js',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
};
