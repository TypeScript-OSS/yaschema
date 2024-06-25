import { appendPathComponent, appendPathIndex, atPath } from '../path-utils.js';

describe('atPath', () => {
  it('should work with undefined path', () => {
    expect(atPath()).toBe('');
  });

  it('should work with empty path', () => {
    expect(atPath(() => {})).toBe('');
  });

  it('should work with non-empty path', () => {
    expect(
      atPath(
        appendPathIndex(
          appendPathComponent(
            appendPathComponent(() => {}, 'hello'),
            'world'
          ),
          3
        )
      )
    ).toBe(' @ ["hello"]["world"][3]');
  });
});
