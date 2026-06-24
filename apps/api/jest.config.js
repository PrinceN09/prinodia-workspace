/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  },
  collectCoverageFrom: ["**/*.(t|j)s", "!**/*.spec.(t|j)s", "!**/main.ts"],
  coverageDirectory: "../coverage",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^@govsphere/(.*)$": "<rootDir>/../../packages/$1/src",
  },
};
