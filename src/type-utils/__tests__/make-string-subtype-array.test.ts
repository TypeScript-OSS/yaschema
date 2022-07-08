import { makeStringSubtypeArray } from '../make-string-subtype-array';

describe('makeStringSubtypeArray', () => {
  it('should work with flat list', () => {
    expect(Array.from(makeStringSubtypeArray('one', 'two'))).toMatchObject(['one', 'two']);
  });

  it('should work with one nested lists', () => {
    expect(Array.from(makeStringSubtypeArray('one', 'two', ['three', 'four']))).toMatchObject(['one', 'two', 'three', 'four']);
  });

  it('should work with multiple nested lists', () => {
    expect(Array.from(makeStringSubtypeArray('one', 'two', ['three', 'four'], ['five', 'six']))).toMatchObject([
      'one',
      'two',
      'three',
      'four',
      'five',
      'six'
    ]);
  });

  it('should work with nested string-subtype arrays', () => {
    const subListA = makeStringSubtypeArray('five', 'six');
    const subListB = makeStringSubtypeArray('three', 'four', subListA);
    expect(Array.from(makeStringSubtypeArray('one', 'two', subListB))).toMatchObject(['one', 'two', 'three', 'four', 'five', 'six']);
  });

  it('to work with expected types', () => {
    const values = makeStringSubtypeArray('one', 'two');
    type Value = typeof values[0];
    const one: Value = 'one';
    expect(one).toBe('one'); // Just a compilation check really here
  });

  describe("with values 'one' and 'two'", () => {
    const values = makeStringSubtypeArray('one', 'two');
    // type Value = typeof values[0];

    describe('checked', () => {
      it("to work with 'one'", () => {
        expect(values.checked('one')).toBe('one');
      });

      it("not to work with 'three'", () => {
        expect(values.checked('three')).toBeUndefined();
      });
    });

    describe('checkedArray', () => {
      it("to filter in 'one' but filter out 'three'", () => {
        expect(values.checkedArray('one', 'three')).toMatchObject(['one']);
      });
    });

    describe("exclude('two')", () => {
      it("checked 'one' should work", () => {
        expect(values.exclude('two').checked('one')).toBe('one');
      });

      it("checked 'two' should not work", () => {
        expect(values.exclude('two').checked('two')).toBeUndefined();
      });

      it("checked 'three' should not work", () => {
        expect(values.exclude('two').checked('three')).toBeUndefined();
      });
    });

    describe('has', () => {
      it("to return true for 'one'", () => {
        expect(values.has('one')).toBeTruthy();
      });

      it("not to return false for 'three'", () => {
        expect(values.has('three')).toBeFalsy();
      });
    });
  });
});
