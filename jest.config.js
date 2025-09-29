module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false, // Desactivar temporalmente para debugging
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    "models/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**"
  ],
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    "**/tests/unit/**/*.test.js",
    "**/tests/integration/**/*.test.js"
  ],
  testTimeout: 30000,
  maxWorkers: 1,
  clearMocks: true,
  resetModules: false,
  
  // Añadir para mejor debugging
  detectOpenHandles: true,
  forceExit: true,
  
  // Ignorar patrones problemáticos temporalmente
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};