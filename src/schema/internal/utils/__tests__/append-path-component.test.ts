import { appendPathComponent } from '../path-utils';

describe('appendPathComponent', () => {
  it('should work with empty path', () => {
    expect(appendPathComponent('', 'world')).toBe('["world"]');
  });

  it('should work with non-empty path', () => {
    expect(appendPathComponent('["hello"]', 'world')).toBe('["hello"]["world"]');
  });
});
