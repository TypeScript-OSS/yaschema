import isPromise from 'is-promise';

import { schema } from '../exports.js';

describe('synchronous aliases', () => {
  it('operations on arrays with a few items should not return a promise', () => {
    const theSchema = schema.array({ items: schema.oneOf(schema.string(), schema.number()) });
    expect(isPromise(theSchema.serialize([3.14, 'hello', 2]))).toBeFalsy();
    expect(isPromise(theSchema.deserialize([3.14, 'hello', 2]))).toBeFalsy();
    expect(isPromise(theSchema.validate([3.14, 'hello', 2]))).toBeFalsy();
  });

  it('operations on arrays with a many items should not return a promise', () => {
    const theSchema = schema.array({ items: schema.oneOf(schema.string(), schema.number()) });
    const value = Array(100000)
      .fill(0)
      .map(() => (Math.random() < 0.5 ? 'hello' : Math.random()));
    expect(isPromise(theSchema.serialize(value))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(value))).toBeFalsy();
    expect(isPromise(theSchema.validate(value))).toBeFalsy();
  });

  it('operations on booleans should not return a promise', () => {
    const theSchema = schema.boolean();
    expect(isPromise(theSchema.serialize(true))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(true))).toBeFalsy();
    expect(isPromise(theSchema.validate(true))).toBeFalsy();
  });

  it('operations on dates should not return a promise', () => {
    const theSchema = schema.date();
    expect(isPromise(theSchema.serialize(new Date()))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(new Date().toISOString()))).toBeFalsy();
    expect(isPromise(theSchema.validate(new Date()))).toBeFalsy();
  });

  it('operations on numbers should not return a promise', () => {
    const theSchema = schema.number();
    expect(isPromise(theSchema.serialize(3.14))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(3.14))).toBeFalsy();
    expect(isPromise(theSchema.validate(3.14))).toBeFalsy();
  });

  it('operations on objects should not return a promise', () => {
    const theSchema = schema.object({
      one: schema.string(),
      two: schema.number(),
      three: schema.object({
        four: schema.boolean()
      })
    });
    const value = {
      one: 'one',
      two: 2,
      three: {
        four: true
      }
    };
    expect(isPromise(theSchema.serialize(value))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(value))).toBeFalsy();
    expect(isPromise(theSchema.validate(value))).toBeFalsy();
  });

  it('operations on records should not return a promise', () => {
    const theSchema = schema.record(schema.string(), schema.number());
    const value = { one: 1, two: 2, three: 3.14 };
    expect(isPromise(theSchema.serialize(value))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(value))).toBeFalsy();
    expect(isPromise(theSchema.validate(value))).toBeFalsy();
  });

  it('operations on tuples should not return a promise', () => {
    const theSchema = schema.tuple({ items: [schema.string(), schema.number()] });
    const value: [string, number] = ['hello', 3.14];
    expect(isPromise(theSchema.serialize(value))).toBeFalsy();
    expect(isPromise(theSchema.deserialize(value))).toBeFalsy();
    expect(isPromise(theSchema.validate(value))).toBeFalsy();
  });
});
