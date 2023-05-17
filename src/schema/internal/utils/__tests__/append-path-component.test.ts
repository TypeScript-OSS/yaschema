import { appendPathComponent, resolveLazyPath } from '../path-utils';

describe('appendPathComponent', () => {
  it('should work with empty path', () => {
    expect(resolveLazyPath(appendPathComponent('', 'world'))).toBe('["world"]');
  });

  it('should work with non-empty path', () => {
    expect(resolveLazyPath(appendPathComponent('["hello"]', 'world'))).toBe('["hello"]["world"]');
  });
});
