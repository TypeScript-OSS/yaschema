import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('null schema', () => {
  it('schemaType should be "null"', () => {
    const nullSchema = schema.nullValue();

    expect(nullSchema.schemaType).toBe('null');
  });

  describe('should work', () => {
    const nullSchema = schema.nullValue();

    setupBasicTypeOperationsShouldWorkTests({ schema: nullSchema, deserializedValues: [null] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: nullSchema,
      deserializedValues: [undefined, 3, 'hello', [true], { one: 1 }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: nullSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: nullSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: nullSchema.optional(), deserializedValues: [null, undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: nullSchema.optional(), deserializedValues: [3] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: nullSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });
});
