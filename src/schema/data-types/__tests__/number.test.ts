import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('boolean schema', () => {
  describe('without expected values', () => {
    const numberSchema = schema.number();

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [-100, -3.14, -1, 0, 1, 3.14, 100] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: numberSchema,
      deserializedValues: [null, undefined, 'hello', [true], { one: 1 }, true, false, NaN, Number.NEGATIVE_INFINITY, Number]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: numberSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: numberSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with expected true value', () => {
    const numberSchema = schema.number(3, 5);

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [3, 5] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: numberSchema, deserializedValues: [1, 7] });
  });
});
