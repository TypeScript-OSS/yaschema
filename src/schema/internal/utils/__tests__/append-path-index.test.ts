import { appendPathIndex, resolveLazyPath } from '../path-utils';

describe('appendPathIndex', () => {
  it('should work with empty path', () => {
    expect(resolveLazyPath(appendPathIndex('', 3))).toBe('[3]');
  });

  it('should work with non-empty path', () => {
    expect(resolveLazyPath(appendPathIndex('["hello"]', 3))).toBe('["hello"][3]');
  });
});
