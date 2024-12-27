module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.cjs'],
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
};
