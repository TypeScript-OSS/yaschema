import { makeNumberSubtypeArray } from '../make-number-subtype-array.js';

describe('makeNumberSubtypeArray', () => {
  it('should work with flat list', () => {
    expect(Array.from(makeNumberSubtypeArray(1, 2))).toMatchObject([1, 2]);
  });

  it('should work with one nested lists', () => {
    expect(Array.from(makeNumberSubtypeArray(1, 2, [3, 4]))).toMatchObject([1, 2, 3, 4]);
  });

  it('should work with multiple nested lists', () => {
    expect(Array.from(makeNumberSubtypeArray(1, 2, [3, 4], [5, 6]))).toMatchObject([1, 2, 3, 4, 5, 6]);
  });

  it('should work with nested number-subtype arrays', () => {
    const subListA = makeNumberSubtypeArray(5, 6);
    const subListB = makeNumberSubtypeArray(3, 4, subListA);
    expect(Array.from(makeNumberSubtypeArray(1, 2, subListB))).toMatchObject([1, 2, 3, 4, 5, 6]);
  });

  it('to work with expected types', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const values = makeNumberSubtypeArray(1, 2);
    type Value = (typeof values)[0];
    const one: Value = 1;
    expect(one).toBe(1); // Just a compilation check really here
  });

  describe('with values 1 and 2', () => {
    const values = makeNumberSubtypeArray(1, 2);

    describe('checked', () => {
      it('to work with 1', () => {
        expect(values.checked(1)).toBe(1);
      });

      it('not to work with 3', () => {
        expect(values.checked(3)).toBeUndefined();
      });
    });

    describe('checkedArray', () => {
      it('to filter in 1 but filter out 3', () => {
        expect(values.checkedArray(1, 3)).toMatchObject([1]);
      });
    });

    describe('exclude(2)', () => {
      it('checked 1 should work', () => {
        expect(values.exclude(2).checked(1)).toBe(1);
      });

      it('checked 2 should not work', () => {
        expect(values.exclude(2).checked(2)).toBeUndefined();
      });

      it('checked 3 should not work', () => {
        expect(values.exclude(2).checked(3)).toBeUndefined();
      });
    });

    describe('has', () => {
      it('to return true for 1', () => {
        expect(values.has(1)).toBeTruthy();
      });

      it('not to return false for 3', () => {
        expect(values.has(3)).toBeFalsy();
      });
    });
  });
});
