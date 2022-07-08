import { appendPathIndex } from '../path-utils';

describe('appendPathIndex', () => {
  it('should work with empty path', () => {
    expect(appendPathIndex('', 3)).toBe('[3]');
  });

  it('should work with non-empty path', () => {
    expect(appendPathIndex('["hello"]', 3)).toBe('["hello"][3]');
  });
});
