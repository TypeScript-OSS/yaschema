import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('undefined schema', () => {
  it('schemaType should be "undefined"', () => {
    const undefinedSchema = schema.undefinedValue();

    expect(undefinedSchema.schemaType).toBe('undefined');
  });

  describe('should work', () => {
    const undefinedSchema = schema.undefinedValue();

    setupBasicTypeOperationsShouldWorkTests({ schema: undefinedSchema, deserializedValues: [undefined] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: undefinedSchema,
      deserializedValues: [null, 3, 'hello', [true], { one: 1 }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: undefinedSchema.allowNull(), deserializedValues: [null, undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: undefinedSchema.allowNull(), deserializedValues: [3] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: undefinedSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: undefinedSchema.optional(), deserializedValues: [null, 3] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: undefinedSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });
});
