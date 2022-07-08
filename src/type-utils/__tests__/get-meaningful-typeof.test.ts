import { getMeaningfulTypeof } from '../get-meaningful-typeof';

describe('getMeaningfulTypeof', () => {
  it('should work with null', () => {
    expect(getMeaningfulTypeof(null)).toBe('null');
  });

  it('should work with undefined', () => {
    expect(getMeaningfulTypeof(undefined)).toBe('undefined');
  });

  it('should work with Date', () => {
    expect(getMeaningfulTypeof(new Date())).toBe('Date');
  });

  it('should work with string', () => {
    expect(getMeaningfulTypeof('hello')).toBe('string');
  });

  it('should work with boolean', () => {
    expect(getMeaningfulTypeof(true)).toBe('boolean');
  });

  it('should work with number', () => {
    expect(getMeaningfulTypeof(3.14)).toBe('number');
  });

  it('should work with array', () => {
    expect(getMeaningfulTypeof([1, 2, 3])).toBe('array');
  });

  it('should work with object', () => {
    expect(getMeaningfulTypeof({ one: 1 })).toBe('object');
  });
});
