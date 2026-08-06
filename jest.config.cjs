/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        jsx: 'react-jsx',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        target: 'ES2020',
        types: ['jest', '@testing-library/jest-dom'],
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/features/**/*.{ts,tsx}',
    'src/store/**/*.{ts,tsx}',
    'src/shared/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
}
