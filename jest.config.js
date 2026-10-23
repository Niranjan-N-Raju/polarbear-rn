module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/testUtils.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/**/types.tsx',
    '!src/icons/**',
    '!src/web.tsx',
    '!src/web/**',
    '!src/config/*.web.ts',
    '!src/screens/admin/**/defaults.ts',
    '!src/i18n/locales/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
    },
  },
};
