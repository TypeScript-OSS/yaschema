import { validateValue } from '../validate-value';

describe('validateValue', () => {
  it('should work with number in the allowed set', () => {
    expect(validateValue(3, { allowed: new Set([1, 3, 5]), path: '' })).toMatchObject({});
  });

  it('should result in error with number not in the allowed set', () => {
    expect(validateValue(7, { allowed: new Set([1, 3, 5]), path: '' })?.error).toBeDefined();
  });

  it('should work with string in the allowed set', () => {
    expect(validateValue('3', { allowed: new Set(['1', '3', '5']), path: '' })).toMatchObject({});
  });

  it('should result in error with string not in the allowed set', () => {
    expect(validateValue('7', { allowed: new Set(['1', '3', '5']), path: '' })?.error).toBeDefined();
  });

  it('should result in error with number not in the allowed string set', () => {
    expect(validateValue(7, { allowed: new Set(['1', '3', '5']), path: '' })?.error).toBeDefined();
  });

  it('should work with boolean in the allowed set', () => {
    expect(validateValue(true, { allowed: new Set([true]), path: '' })).toMatchObject({});
  });

  it('should result in error with boolean not in the allowed set', () => {
    expect(validateValue(false, { allowed: new Set([true]), path: '' })?.error).toBeDefined();
  });
});
