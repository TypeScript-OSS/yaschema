import { atPath } from '../path-utils';

describe('atPath', () => {
  it('should work with undefined path', () => {
    expect(atPath()).toBe('');
  });

  it('should work with empty path', () => {
    expect(atPath('')).toBe('');
  });

  it('should work with non-empty path', () => {
    expect(atPath('["hello"]["world"][3]')).toBe(' @ ["hello"]["world"][3]');
  });
});
