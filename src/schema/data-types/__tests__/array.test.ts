import BigNumber from 'bignumber.js';

import { schema } from '../../..';
import { bigNumberSchema } from '../../__test_dependency__/big-number-schema';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('array schema', () => {
  it('schemaType should be "array"', () => {
    const arraySchema = schema.array();

    expect(arraySchema.schemaType).toBe('array');
  });

  describe('without any options', () => {
    const arraySchema = schema.array();

    setupBasicTypeOperationsShouldWorkTests({
      schema: arraySchema,
      deserializedValues: [[], [1, { one: 'one', two: 2 }], [{ one: 'ONE', two: 3.14 }]]
    });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: arraySchema, deserializedValues: [null, undefined, '', { one: 1 }, true, false] });
  });

  describe('with length validation', () => {
    const arraySchema = schema.array({ minLength: 1, maxLength: 3 });

    setupBasicTypeOperationsShouldWorkTests({ schema: arraySchema, deserializedValues: [['a'], ['a', 1], [1, 2, 3]] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: arraySchema,
      deserializedValues: [[], [1, 2, 3, 4], null, undefined, '', { one: 1 }, true, false]
    });
  });

  describe('with item validation', () => {
    const arraySchema = schema.array({ items: schema.string() });

    setupBasicTypeOperationsShouldWorkTests({
      schema: arraySchema,
      deserializedValues: [[], ['a'], ['a', 'b'], ['ABC', 'DEF', 'GHI'], Array(10000).fill('hello')]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: arraySchema,
      deserializedValues: [[1, 2, 3, 4], null, undefined, '', { one: 1 }, true, false]
    });
  });

  describe('with custom-serialized sub-elements', () => {
    const arraySchema = schema.array({ items: schema.date() });

    setupBasicTypeOperationsShouldWorkTests({
      schema: arraySchema,
      deserializedValues: [[new Date('2021-01-01T00:00:00.000Z'), new Date('2022-01-01T00:00:00.000Z')]],
      serializedValues: [['2021-01-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z']]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: arraySchema,
      deserializedValues: [
        null,
        undefined,
        '',
        [true],
        { one: 1 },
        true,
        false,
        { one: 'one', two: 2 },
        { one: 'one', two: 2, three: 'hello' }
      ]
    });
  });

  describe('with many BigNumber elements', () => {
    const arraySchema = schema.array({ items: bigNumberSchema });

    const values: BigNumber[] = [];
    const serializedValues: Array<{ bignumber: string }> = [];
    for (let i = 0; i < 10000; i += 1) {
      const value = BigNumber.random(4).times(100);
      values.push(value);
      serializedValues.push({ bignumber: value.toFixed() });
    }

    let numCalls = 0;
    let lastTimeout: ReturnType<typeof setTimeout> | undefined;
    const count = () => {
      numCalls += 1;
      lastTimeout = setTimeout(count, 10);
    };

    beforeAll(() => {
      lastTimeout = setTimeout(count, 10);
    });
    afterAll(() => {
      if (lastTimeout !== undefined) {
        clearTimeout(lastTimeout);
        lastTimeout = undefined;
      }

      // Ensuring that validation / transformation are yielding periodically
      expect(numCalls).toBeGreaterThan(5);
    });

    setupBasicTypeOperationsShouldWorkTests({
      schema: arraySchema,
      deserializedValues: [values],
      serializedValues: [serializedValues]
    });
  });
});
