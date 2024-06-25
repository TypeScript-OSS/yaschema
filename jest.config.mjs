export default {
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['text', 'html'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true
    }
  },
  moduleNameMapper: {
    'bignumber\\.js': '$0',
    '(.+)\\.js': '$1'
  }
};
