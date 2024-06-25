import { appendPathComponent, resolveLazyPath } from '../path-utils.js';

describe('appendPathComponent', () => {
  it('should work with empty path', () => {
    expect(resolveLazyPath(appendPathComponent(() => {}, 'world')).string).toBe('["world"]');
  });

  it('should work with non-empty path', () => {
    expect(
      resolveLazyPath(
        appendPathComponent(
          appendPathComponent(() => {}, 'hello'),
          'world'
        )
      ).string
    ).toBe('["hello"]["world"]');
  });
});
