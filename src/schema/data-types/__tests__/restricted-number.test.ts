import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('restrictedNumber schema', () => {
  describe('with value / range restrictions', () => {
    const restrictedNumberSchema = schema.restrictedNumber([
      3,
      { min: 7, max: 12 },
      { min: 19, minExclusive: true, max: 24, maxExclusive: true },
      { min: 999 },
      { max: -999 }
    ]);

    setupBasicTypeOperationsShouldWorkTests({
      schema: restrictedNumberSchema,
      deserializedValues: [-1000, -999, 3, 7, 8, 9, 12, 19.001, 20, 22, 23, 23.999, 999, 1000]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: restrictedNumberSchema,
      deserializedValues: [
        null,
        undefined,
        'hello',
        [true],
        { one: 1 },
        true,
        false,
        NaN,
        Number.NEGATIVE_INFINITY,
        Number,
        1,
        2,
        5,
        13,
        14,
        19,
        24,
        3.14,
        2.99
      ]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: restrictedNumberSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: restrictedNumberSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: restrictedNumberSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: restrictedNumberSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({
        schema: restrictedNumberSchema.allowNull().optional(),
        deserializedValues: [null, undefined]
      });
    });
  });

  describe('with divisible by restrictions', () => {
    const restrictedNumberSchema = schema.restrictedNumber([], { divisibleBy: [2, 3] });

    setupBasicTypeOperationsShouldWorkTests({ schema: restrictedNumberSchema, deserializedValues: [-2, 0, 2, 3, 6] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: restrictedNumberSchema,
      deserializedValues: [
        null,
        undefined,
        'hello',
        [true],
        { one: 1 },
        true,
        false,
        NaN,
        Number.NEGATIVE_INFINITY,
        Number,
        1,
        1.1,
        2.1,
        5,
        13,
        19,
        3.14,
        2.99
      ]
    });
  });

  describe('with range and divisible by restrictions', () => {
    const restrictedNumberSchema = schema.restrictedNumber([{ min: 0, minExclusive: true }], { divisibleBy: [2, 3] });

    setupBasicTypeOperationsShouldWorkTests({ schema: restrictedNumberSchema, deserializedValues: [2, 3, 6] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: restrictedNumberSchema,
      deserializedValues: [
        null,
        undefined,
        'hello',
        [true],
        { one: 1 },
        true,
        false,
        NaN,
        Number.NEGATIVE_INFINITY,
        Number,
        -2,
        0,
        1,
        1.1,
        2.1,
        5,
        13,
        19,
        3.14,
        2.99
      ]
    });
  });
});
