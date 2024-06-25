import { appendPathComponent, appendPathIndex, resolveLazyPath } from '../path-utils.js';

describe('appendPathIndex', () => {
  it('should work with empty path', () => {
    expect(resolveLazyPath(appendPathIndex(() => {}, 3)).string).toBe('[3]');
  });

  it('should work with non-empty path', () => {
    expect(
      resolveLazyPath(
        appendPathIndex(
          appendPathComponent(() => {}, 'hello'),
          3
        )
      ).string
    ).toBe('["hello"][3]');
  });
});
