import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('boolean schema', () => {
  it('schemaType should be "boolean"', () => {
    const booleanSchema = schema.boolean();

    expect(booleanSchema.schemaType).toBe('boolean');
  });

  describe('without expected values', () => {
    const booleanSchema = schema.boolean();

    setupBasicTypeOperationsShouldWorkTests({ schema: booleanSchema, deserializedValues: [true, false] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: booleanSchema,
      deserializedValues: [null, undefined, 3, 'hello', [true], { one: 1 }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: booleanSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: booleanSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: booleanSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: booleanSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: booleanSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
    describe('if not(schema.boolean(false)) is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: booleanSchema.not(schema.boolean(false)), deserializedValues: [true] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: booleanSchema.not(schema.boolean(false)), deserializedValues: [false] });
    });
  });

  describe('with expected true value', () => {
    const trueOnlySchema = schema.boolean(true);

    setupBasicTypeOperationsShouldWorkTests({ schema: trueOnlySchema, deserializedValues: [true] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: trueOnlySchema, deserializedValues: [false] });
  });

  describe('with expected false value', () => {
    const falseOnlySchema = schema.boolean(false);

    setupBasicTypeOperationsShouldWorkTests({ schema: falseOnlySchema, deserializedValues: [false] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: falseOnlySchema, deserializedValues: [true] });
  });

  describe('with expected true or false value', () => {
    const booleanSchema = schema.boolean(true, false);

    setupBasicTypeOperationsShouldWorkTests({ schema: booleanSchema, deserializedValues: [true, false] });
  });
});
