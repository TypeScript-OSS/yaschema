import { default as BigNumber } from 'bignumber.js';

import { schema } from '../exports.js';
import { bigNumberSchema, bigNumberWithoutCustomCloningSchema } from '../schema/__test_dependency__/big-number-schema.js';

describe('cloning values', () => {
  it('arrays should work', async () => {
    const aSchema = schema.array({ items: schema.string() });
    const initialValue = ['hello world', 'goodbye world'];
    const clonedValue = (await aSchema.cloneValueAsync(initialValue)).cloned;
    expect(clonedValue).toEqual(['hello world', 'goodbye world']);
    initialValue[0] = 'changed';
    expect(clonedValue).toEqual(['hello world', 'goodbye world']);
  });

  it('boolean should work', async () => {
    const aSchema = schema.boolean();
    expect((await aSchema.cloneValueAsync(true)).cloned).toEqual(true);
    expect((await aSchema.cloneValueAsync(false)).cloned).toEqual(false);
  });

  it('dates should work', async () => {
    const aSchema = schema.date();
    const aDate = new Date();
    expect((await aSchema.cloneValueAsync(aDate)).cloned).toEqual(aDate);
  });

  it('numbers should work', async () => {
    const aSchema = schema.number();
    expect((await aSchema.cloneValueAsync(3.14)).cloned).toEqual(3.14);
    expect((await aSchema.cloneValueAsync(-1231.1231)).cloned).toEqual(-1231.1231);
  });

  it('strings should work', async () => {
    const aSchema = schema.string();
    expect((await aSchema.cloneValueAsync('hello world')).cloned).toEqual('hello world');
  });

  it('objects should work', async () => {
    const aSchema = schema.object({ one: schema.string(), two: schema.number() });
    const initialValue = { one: 'hello', two: 2 };
    const clonedValue = (await aSchema.cloneValueAsync(initialValue)).cloned;
    expect(clonedValue).toEqual({ one: 'hello', two: 2 });
    initialValue.one = 'changed';
    expect(clonedValue).toEqual({ one: 'hello', two: 2 });
  });

  describe('custom', () => {
    it('with custom cloning should work', async () => {
      const clonedValue = await bigNumberSchema.cloneValueAsync(new BigNumber(3.14));
      expect(clonedValue.cloned?.isEqualTo(new BigNumber(3.14))).toBeTruthy();
    });

    it('without custom cloning should work', async () => {
      const clonedValue = await bigNumberWithoutCustomCloningSchema.cloneValueAsync(new BigNumber(3.14));
      expect(clonedValue.cloned?.isEqualTo(new BigNumber(3.14))).toBeTruthy();
    });
  });
});
