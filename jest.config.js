module.exports = {
  preset: 'ts-jest',
  extensionsToTreatAsEsm: [".ts"],
  coverageReporters: ['text', 'html'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true
    }
  }
};
