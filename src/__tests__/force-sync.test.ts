import isPromise from 'is-promise';

import { schema } from '../exports.js';

describe('with forceSync option', () => {
  it('operations on arrays with a few items should not return a promise', () => {
    const theSchema = schema.array({ items: schema.oneOf(schema.string(), schema.number()) });
    expect(isPromise(theSchema.serializeAsync([3.14, 'hello', 2], { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync([3.14, 'hello', 2], { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync([3.14, 'hello', 2], { forceSync: true }))).toBeFalsy();
  });

  it('operations on arrays with a many items should not return a promise', () => {
    const theSchema = schema.array({ items: schema.oneOf(schema.string(), schema.number()) });
    const value = Array(100000)
      .fill(0)
      .map(() => (Math.random() < 0.5 ? 'hello' : Math.random()));
    expect(isPromise(theSchema.serializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(value, { forceSync: true }))).toBeFalsy();
  });

  it('operations on booleans should not return a promise', () => {
    const theSchema = schema.boolean();
    expect(isPromise(theSchema.serializeAsync(true, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(true, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(true, { forceSync: true }))).toBeFalsy();
  });

  it('operations on dates should not return a promise', () => {
    const theSchema = schema.date();
    expect(isPromise(theSchema.serializeAsync(new Date(), { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(new Date().toISOString(), { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(new Date(), { forceSync: true }))).toBeFalsy();
  });

  it('operations on numbers should not return a promise', () => {
    const theSchema = schema.number();
    expect(isPromise(theSchema.serializeAsync(3.14, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(3.14, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(3.14, { forceSync: true }))).toBeFalsy();
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
    expect(isPromise(theSchema.serializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(value, { forceSync: true }))).toBeFalsy();
  });

  it('operations on records should not return a promise', () => {
    const theSchema = schema.record(schema.string(), schema.number());
    const value = { one: 1, two: 2, three: 3.14 };
    expect(isPromise(theSchema.serializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(value, { forceSync: true }))).toBeFalsy();
  });

  it('operations on tuples should not return a promise', () => {
    const theSchema = schema.tuple({ items: [schema.string(), schema.number()] });
    const value: [string, number] = ['hello', 3.14];
    expect(isPromise(theSchema.serializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.deserializeAsync(value, { forceSync: true }))).toBeFalsy();
    expect(isPromise(theSchema.validateAsync(value, { forceSync: true }))).toBeFalsy();
  });
});
