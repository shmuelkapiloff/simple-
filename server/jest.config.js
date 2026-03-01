module.exports = {
  testMatch: ["**/dist/__tests__/**/*.js"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/__tests__/setup.js", "/dist/__tests__/test-setup.js"],
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: false,
  bail: false,
  setupFilesAfterEnv: ["<rootDir>/dist/__tests__/test-setup.js"],
  testEnvironment: "node",
  verbose: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__tests__/**",
    "!src/**/*.d.ts"
  ]
};
