module.exports = {
  preset: 'ts-jest',
  coverageReporters: ['text', 'html'],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
